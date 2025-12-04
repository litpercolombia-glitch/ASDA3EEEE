"""
Modelos de Machine Learning para predicción de retrasos y novedades.
Implementa XGBoost para retrasos y Random Forest para novedades.
"""

import os
import pickle
import time
from datetime import datetime
from typing import Optional, Dict, List, Any, Tuple
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, roc_auc_score, confusion_matrix
)
from loguru import logger

try:
    import xgboost as xgb
    XGBOOST_AVAILABLE = True
except ImportError:
    XGBOOST_AVAILABLE = False
    logger.warning("XGBoost no disponible, usando Random Forest como alternativa")

from sklearn.ensemble import RandomForestClassifier


# ==================== CONFIGURACIÓN ====================

# Directorio para guardar modelos
MODELOS_DIR = Path(os.getenv('MODELOS_DIR', 'ml_models/saved'))
MODELOS_DIR.mkdir(parents=True, exist_ok=True)

# Features para el modelo de retrasos
FEATURES_RETRASOS = [
    'transportadora',
    'departamento_destino',
    'ciudad_destino',
    'dia_semana',
    'mes',
    'precio_flete',
    'valor_compra_productos',
    'tipo_tienda',
    'tiene_novedad_historica',
]

# Features para el modelo de novedades
FEATURES_NOVEDADES = [
    'transportadora',
    'ciudad_destino',
    'dia_semana',
    'precio_flete',
    'valor_compra_productos',
    'dias_transito',
]

# Hiperparámetros XGBoost
XGBOOST_PARAMS = {
    'n_estimators': 200,
    'max_depth': 6,
    'learning_rate': 0.1,
    'subsample': 0.8,
    'colsample_bytree': 0.8,
    'random_state': 42,
    'n_jobs': -1,
    'eval_metric': 'logloss',
}

# Hiperparámetros Random Forest
RF_PARAMS = {
    'n_estimators': 100,
    'max_depth': 10,
    'min_samples_split': 5,
    'min_samples_leaf': 2,
    'random_state': 42,
    'n_jobs': -1,
}


# ==================== CLASES DE MODELOS ====================

class ModeloRetrasos:
    """
    Modelo para predecir probabilidad de retraso en entregas.
    Usa XGBoost si está disponible, sino Random Forest.
    """

    def __init__(self):
        self.modelo = None
        self.encoders: Dict[str, LabelEncoder] = {}
        self.scaler = StandardScaler()
        self.features = FEATURES_RETRASOS
        self.esta_entrenado = False
        self.version = None
        self.metricas = {}

    def _preparar_features(
        self,
        df: pd.DataFrame,
        fit_encoders: bool = False
    ) -> np.ndarray:
        """
        Prepara las features para el modelo.

        Args:
            df: DataFrame con datos.
            fit_encoders: Si debe ajustar los encoders (True para entrenamiento).

        Returns:
            Array con features preparadas.
        """
        df_prep = df.copy()

        # Extraer características de fecha
        if 'fecha_generacion_guia' in df_prep.columns:
            df_prep['dia_semana'] = pd.to_datetime(
                df_prep['fecha_generacion_guia']
            ).dt.dayofweek
            df_prep['mes'] = pd.to_datetime(
                df_prep['fecha_generacion_guia']
            ).dt.month
        else:
            df_prep['dia_semana'] = 0
            df_prep['mes'] = 1

        # Crear feature de novedad histórica
        df_prep['tiene_novedad_historica'] = df_prep.get('tiene_novedad', False).astype(int)

        # Llenar valores nulos
        df_prep['precio_flete'] = df_prep.get('precio_flete', 0).fillna(0)
        df_prep['valor_compra_productos'] = df_prep.get('valor_compra_productos', 0).fillna(0)

        # Encodear variables categóricas
        categoricas = ['transportadora', 'departamento_destino', 'ciudad_destino', 'tipo_tienda']

        for col in categoricas:
            if col in df_prep.columns:
                df_prep[col] = df_prep[col].fillna('DESCONOCIDO').astype(str)

                if fit_encoders:
                    self.encoders[col] = LabelEncoder()
                    df_prep[col] = self.encoders[col].fit_transform(df_prep[col])
                elif col in self.encoders:
                    # Manejar categorías nuevas no vistas en entrenamiento
                    conocidas = set(self.encoders[col].classes_)
                    df_prep[col] = df_prep[col].apply(
                        lambda x: x if x in conocidas else 'DESCONOCIDO'
                    )
                    df_prep[col] = self.encoders[col].transform(df_prep[col])
                else:
                    df_prep[col] = 0
            else:
                df_prep[col] = 0

        # Seleccionar features disponibles
        features_disponibles = [f for f in self.features if f in df_prep.columns]
        X = df_prep[features_disponibles].values

        # Escalar numéricas
        if fit_encoders:
            X = self.scaler.fit_transform(X)
        else:
            X = self.scaler.transform(X)

        return X

    def entrenar(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Entrena el modelo con los datos proporcionados.

        Args:
            df: DataFrame con datos de guías históricas.

        Returns:
            Diccionario con métricas del entrenamiento.
        """
        inicio = time.time()
        logger.info(f"Iniciando entrenamiento de ModeloRetrasos con {len(df)} registros")

        # Preparar datos
        df_train = df.dropna(subset=['tiene_retraso'])

        if len(df_train) < 50:
            raise ValueError(f"Insuficientes datos para entrenar: {len(df_train)} (mínimo 50)")

        X = self._preparar_features(df_train, fit_encoders=True)
        y = df_train['tiene_retraso'].astype(int).values

        # Split train/test
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )

        # Entrenar modelo
        if XGBOOST_AVAILABLE:
            self.modelo = xgb.XGBClassifier(**XGBOOST_PARAMS)
            logger.info("Usando XGBoost")
        else:
            self.modelo = RandomForestClassifier(**RF_PARAMS)
            logger.info("Usando Random Forest")

        self.modelo.fit(X_train, y_train)

        # Evaluar
        y_pred = self.modelo.predict(X_test)
        y_proba = self.modelo.predict_proba(X_test)[:, 1]

        self.metricas = {
            'accuracy': float(accuracy_score(y_test, y_pred)),
            'precision': float(precision_score(y_test, y_pred, zero_division=0)),
            'recall': float(recall_score(y_test, y_pred, zero_division=0)),
            'f1_score': float(f1_score(y_test, y_pred, zero_division=0)),
            'roc_auc': float(roc_auc_score(y_test, y_proba)) if len(np.unique(y_test)) > 1 else 0.0,
        }

        # Feature importance
        if hasattr(self.modelo, 'feature_importances_'):
            features_disponibles = [f for f in self.features if f in df_train.columns]
            importancias = sorted(
                zip(features_disponibles, self.modelo.feature_importances_),
                key=lambda x: x[1],
                reverse=True
            )
            self.metricas['features_importantes'] = [
                {'nombre': f, 'importancia': float(i)} for f, i in importancias[:10]
            ]

        self.esta_entrenado = True
        self.version = datetime.now().strftime('%Y%m%d_%H%M%S')
        duracion = time.time() - inicio

        logger.success(
            f"Modelo entrenado - Accuracy: {self.metricas['accuracy']:.3f}, "
            f"F1: {self.metricas['f1_score']:.3f}, Tiempo: {duracion:.2f}s"
        )

        return {
            'modelo': 'ModeloRetrasos',
            'version': self.version,
            'registros_entrenamiento': len(df_train),
            'duracion_segundos': duracion,
            **self.metricas
        }

    def predecir(self, datos: Dict[str, Any]) -> Dict[str, Any]:
        """
        Realiza predicción para una guía.

        Args:
            datos: Diccionario con datos de la guía.

        Returns:
            Diccionario con predicción y nivel de riesgo.
        """
        if not self.esta_entrenado:
            raise ValueError("El modelo no ha sido entrenado")

        # Crear DataFrame de una fila
        df = pd.DataFrame([datos])
        X = self._preparar_features(df)

        # Obtener probabilidad
        probabilidad = float(self.modelo.predict_proba(X)[0][1])

        # Determinar nivel de riesgo
        if probabilidad < 0.4:
            nivel_riesgo = 'BAJO'
        elif probabilidad < 0.6:
            nivel_riesgo = 'MEDIO'
        elif probabilidad < 0.8:
            nivel_riesgo = 'ALTO'
        else:
            nivel_riesgo = 'CRITICO'

        # Factores de riesgo
        factores = []
        if datos.get('dias_transito', 0) > 5:
            factores.append(f"Días en tránsito elevados: {datos.get('dias_transito')}")
        if datos.get('tiene_novedad'):
            factores.append("Tiene novedad registrada")

        # Acciones recomendadas
        acciones = {
            'BAJO': ['Monitoreo normal'],
            'MEDIO': ['Seguimiento activo', 'Verificar próximo movimiento'],
            'ALTO': ['Contactar transportadora', 'Alertar al cliente'],
            'CRITICO': ['Acción inmediata requerida', 'Escalamiento', 'Contactar cliente urgente'],
        }

        return {
            'probabilidad_retraso': round(probabilidad, 4),
            'nivel_riesgo': nivel_riesgo,
            'factores_riesgo': factores,
            'acciones_recomendadas': acciones.get(nivel_riesgo, []),
            'confianza': round(max(probabilidad, 1 - probabilidad), 4),
            'modelo_usado': 'ModeloRetrasos',
            'version': self.version,
        }

    def guardar(self, nombre: Optional[str] = None) -> str:
        """Guarda el modelo en disco"""
        if not self.esta_entrenado:
            raise ValueError("No hay modelo para guardar")

        nombre = nombre or f"modelo_retrasos_{self.version}.pkl"
        ruta = MODELOS_DIR / nombre

        with open(ruta, 'wb') as f:
            pickle.dump({
                'modelo': self.modelo,
                'encoders': self.encoders,
                'scaler': self.scaler,
                'version': self.version,
                'metricas': self.metricas,
            }, f)

        logger.info(f"Modelo guardado en {ruta}")
        return str(ruta)

    def cargar(self, ruta: str) -> bool:
        """Carga el modelo desde disco"""
        try:
            with open(ruta, 'rb') as f:
                data = pickle.load(f)

            self.modelo = data['modelo']
            self.encoders = data['encoders']
            self.scaler = data['scaler']
            self.version = data['version']
            self.metricas = data['metricas']
            self.esta_entrenado = True

            logger.info(f"Modelo cargado desde {ruta}")
            return True
        except Exception as e:
            logger.error(f"Error cargando modelo: {e}")
            return False


class ModeloNovedades:
    """
    Modelo para clasificar tipo de novedad.
    Usa Random Forest para clasificación multi-clase.
    """

    def __init__(self):
        self.modelo = None
        self.encoders: Dict[str, LabelEncoder] = {}
        self.label_encoder = LabelEncoder()
        self.scaler = StandardScaler()
        self.features = FEATURES_NOVEDADES
        self.clases: List[str] = []
        self.esta_entrenado = False
        self.version = None
        self.metricas = {}

    def _preparar_features(
        self,
        df: pd.DataFrame,
        fit_encoders: bool = False
    ) -> np.ndarray:
        """Prepara features para el modelo"""
        df_prep = df.copy()

        # Extraer día de la semana
        if 'fecha_generacion_guia' in df_prep.columns:
            df_prep['dia_semana'] = pd.to_datetime(
                df_prep['fecha_generacion_guia']
            ).dt.dayofweek
        else:
            df_prep['dia_semana'] = 0

        # Llenar nulos
        df_prep['precio_flete'] = df_prep.get('precio_flete', 0).fillna(0)
        df_prep['valor_compra_productos'] = df_prep.get('valor_compra_productos', 0).fillna(0)
        df_prep['dias_transito'] = df_prep.get('dias_transito', 0).fillna(0)

        # Encodear categóricas
        categoricas = ['transportadora', 'ciudad_destino']

        for col in categoricas:
            if col in df_prep.columns:
                df_prep[col] = df_prep[col].fillna('DESCONOCIDO').astype(str)

                if fit_encoders:
                    self.encoders[col] = LabelEncoder()
                    df_prep[col] = self.encoders[col].fit_transform(df_prep[col])
                elif col in self.encoders:
                    conocidas = set(self.encoders[col].classes_)
                    df_prep[col] = df_prep[col].apply(
                        lambda x: x if x in conocidas else 'DESCONOCIDO'
                    )
                    df_prep[col] = self.encoders[col].transform(df_prep[col])
                else:
                    df_prep[col] = 0
            else:
                df_prep[col] = 0

        # Seleccionar features
        features_disponibles = [f for f in self.features if f in df_prep.columns]
        X = df_prep[features_disponibles].values

        # Escalar
        if fit_encoders:
            X = self.scaler.fit_transform(X)
        else:
            X = self.scaler.transform(X)

        return X

    def entrenar(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Entrena el modelo de clasificación de novedades.
        Solo usa guías con novedades.
        """
        inicio = time.time()
        logger.info(f"Iniciando entrenamiento de ModeloNovedades")

        # Filtrar solo guías con novedad
        df_train = df[df['tiene_novedad'] == True].dropna(subset=['tipo_novedad'])

        if len(df_train) < 30:
            logger.warning(f"Insuficientes datos con novedades: {len(df_train)}")
            return {
                'modelo': 'ModeloNovedades',
                'mensaje': f'Insuficientes datos: {len(df_train)} (mínimo 30)',
                'entrenado': False
            }

        # Preparar datos
        X = self._preparar_features(df_train, fit_encoders=True)

        # Encodear labels
        y = self.label_encoder.fit_transform(df_train['tipo_novedad'].astype(str))
        self.clases = list(self.label_encoder.classes_)

        # Split
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )

        # Entrenar
        self.modelo = RandomForestClassifier(**RF_PARAMS)
        self.modelo.fit(X_train, y_train)

        # Evaluar
        y_pred = self.modelo.predict(X_test)

        self.metricas = {
            'accuracy': float(accuracy_score(y_test, y_pred)),
            'precision': float(precision_score(y_test, y_pred, average='weighted', zero_division=0)),
            'recall': float(recall_score(y_test, y_pred, average='weighted', zero_division=0)),
            'f1_score': float(f1_score(y_test, y_pred, average='weighted', zero_division=0)),
        }

        self.esta_entrenado = True
        self.version = datetime.now().strftime('%Y%m%d_%H%M%S')
        duracion = time.time() - inicio

        logger.success(
            f"ModeloNovedades entrenado - Accuracy: {self.metricas['accuracy']:.3f}, "
            f"Clases: {len(self.clases)}"
        )

        return {
            'modelo': 'ModeloNovedades',
            'version': self.version,
            'registros_entrenamiento': len(df_train),
            'clases': self.clases,
            'duracion_segundos': duracion,
            **self.metricas
        }

    def predecir(self, datos: Dict[str, Any]) -> Dict[str, Any]:
        """Predice tipo de novedad más probable"""
        if not self.esta_entrenado:
            raise ValueError("El modelo no ha sido entrenado")

        df = pd.DataFrame([datos])
        X = self._preparar_features(df)

        # Probabilidades por clase
        probas = self.modelo.predict_proba(X)[0]
        clase_pred = self.clases[np.argmax(probas)]

        return {
            'tipo_novedad_predicho': clase_pred,
            'probabilidad': float(max(probas)),
            'probabilidades_por_clase': {
                c: float(p) for c, p in zip(self.clases, probas)
            },
            'modelo_usado': 'ModeloNovedades',
            'version': self.version,
        }

    def guardar(self, nombre: Optional[str] = None) -> str:
        """Guarda el modelo en disco"""
        if not self.esta_entrenado:
            raise ValueError("No hay modelo para guardar")

        nombre = nombre or f"modelo_novedades_{self.version}.pkl"
        ruta = MODELOS_DIR / nombre

        with open(ruta, 'wb') as f:
            pickle.dump({
                'modelo': self.modelo,
                'encoders': self.encoders,
                'label_encoder': self.label_encoder,
                'scaler': self.scaler,
                'clases': self.clases,
                'version': self.version,
                'metricas': self.metricas,
            }, f)

        logger.info(f"Modelo guardado en {ruta}")
        return str(ruta)

    def cargar(self, ruta: str) -> bool:
        """Carga el modelo desde disco"""
        try:
            with open(ruta, 'rb') as f:
                data = pickle.load(f)

            self.modelo = data['modelo']
            self.encoders = data['encoders']
            self.label_encoder = data['label_encoder']
            self.scaler = data['scaler']
            self.clases = data['clases']
            self.version = data['version']
            self.metricas = data['metricas']
            self.esta_entrenado = True

            logger.info(f"Modelo cargado desde {ruta}")
            return True
        except Exception as e:
            logger.error(f"Error cargando modelo: {e}")
            return False


class GestorModelos:
    """
    Gestor centralizado para todos los modelos ML.
    Maneja entrenamiento, predicción y persistencia.
    """

    def __init__(self):
        self.modelo_retrasos = ModeloRetrasos()
        self.modelo_novedades = ModeloNovedades()
        self._cargar_modelos_existentes()

    def _cargar_modelos_existentes(self):
        """Intenta cargar modelos guardados previamente"""
        try:
            # Buscar modelo de retrasos más reciente
            modelos_retrasos = sorted(
                MODELOS_DIR.glob("modelo_retrasos_*.pkl"),
                reverse=True
            )
            if modelos_retrasos:
                self.modelo_retrasos.cargar(str(modelos_retrasos[0]))

            # Buscar modelo de novedades más reciente
            modelos_novedades = sorted(
                MODELOS_DIR.glob("modelo_novedades_*.pkl"),
                reverse=True
            )
            if modelos_novedades:
                self.modelo_novedades.cargar(str(modelos_novedades[0]))

        except Exception as e:
            logger.warning(f"No se pudieron cargar modelos existentes: {e}")

    def entrenar_todos(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Entrena todos los modelos con los datos proporcionados.

        Args:
            df: DataFrame con datos históricos de guías.

        Returns:
            Diccionario con resultados de entrenamiento.
        """
        resultados = {
            'modelos_entrenados': [],
            'metricas': [],
            'errores': [],
        }

        inicio = time.time()

        # Entrenar modelo de retrasos
        try:
            metricas_retrasos = self.modelo_retrasos.entrenar(df)
            self.modelo_retrasos.guardar()
            resultados['modelos_entrenados'].append('ModeloRetrasos')
            resultados['metricas'].append(metricas_retrasos)
        except Exception as e:
            logger.error(f"Error entrenando ModeloRetrasos: {e}")
            resultados['errores'].append({
                'modelo': 'ModeloRetrasos',
                'error': str(e)
            })

        # Entrenar modelo de novedades
        try:
            metricas_novedades = self.modelo_novedades.entrenar(df)
            if metricas_novedades.get('entrenado', True):
                self.modelo_novedades.guardar()
                resultados['modelos_entrenados'].append('ModeloNovedades')
            resultados['metricas'].append(metricas_novedades)
        except Exception as e:
            logger.error(f"Error entrenando ModeloNovedades: {e}")
            resultados['errores'].append({
                'modelo': 'ModeloNovedades',
                'error': str(e)
            })

        resultados['tiempo_total_segundos'] = time.time() - inicio
        resultados['exito'] = len(resultados['errores']) == 0

        return resultados

    def predecir_retraso(self, datos_guia: Dict[str, Any]) -> Dict[str, Any]:
        """
        Realiza predicción de retraso para una guía.

        Args:
            datos_guia: Datos de la guía a predecir.

        Returns:
            Predicción con probabilidad y nivel de riesgo.
        """
        if not self.modelo_retrasos.esta_entrenado:
            return {
                'error': 'Modelo de retrasos no entrenado',
                'probabilidad_retraso': 0.5,
                'nivel_riesgo': 'DESCONOCIDO',
            }

        return self.modelo_retrasos.predecir(datos_guia)

    def predecir_novedad(self, datos_guia: Dict[str, Any]) -> Dict[str, Any]:
        """
        Predice tipo de novedad para una guía.

        Args:
            datos_guia: Datos de la guía.

        Returns:
            Predicción de tipo de novedad.
        """
        if not self.modelo_novedades.esta_entrenado:
            return {
                'error': 'Modelo de novedades no entrenado'
            }

        return self.modelo_novedades.predecir(datos_guia)

    def obtener_estado(self) -> Dict[str, Any]:
        """Obtiene el estado actual de los modelos"""
        return {
            'modelo_retrasos': {
                'entrenado': self.modelo_retrasos.esta_entrenado,
                'version': self.modelo_retrasos.version,
                'metricas': self.modelo_retrasos.metricas,
            },
            'modelo_novedades': {
                'entrenado': self.modelo_novedades.esta_entrenado,
                'version': self.modelo_novedades.version,
                'metricas': self.modelo_novedades.metricas,
            },
        }

    def obtener_features_importantes(self) -> Dict[str, List[Dict]]:
        """Obtiene features más importantes de cada modelo"""
        resultado = {}

        if self.modelo_retrasos.esta_entrenado:
            resultado['modelo_retrasos'] = self.modelo_retrasos.metricas.get(
                'features_importantes', []
            )

        return resultado


# Instancia global del gestor
gestor_modelos = GestorModelos()
