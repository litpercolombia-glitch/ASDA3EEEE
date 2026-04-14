"""
Procesador de archivos Excel para el sistema ML de Litper Logística.
Maneja la validación, limpieza y carga de datos de guías desde archivos Excel.

FIX 2026-04-14: Added encoding repair for mojibake from Dropi exports.
"""

import hashlib
import re
import time
from datetime import datetime
from typing import Optional, Dict, List, Tuple, Any
from io import BytesIO

import pandas as pd
from loguru import logger
from sqlalchemy.orm import Session

from database.models import (
    GuiaHistorica,
    ArchivoCargado,
    EstadoArchivo,
)


# ==================== ENCODING REPAIR ====================

# Mojibake repair: when UTF-8 bytes are misread as Latin-1
# "BogotÃ¡" → "Bogotá", "MedellÃ­n" → "Medellín"
MOJIBAKE_MAP = {
    'Ã¡': 'á', 'Ã©': 'é', 'Ã\xad': 'í', 'Ã³': 'ó', 'Ãº': 'ú',
    'Ã\x81': 'Á', 'Ã\x89': 'É', 'Ã\x8d': 'Í', 'Ã\x93': 'Ó', 'Ã\x9a': 'Ú',
    'Ã±': 'ñ', 'Ã\x91': 'Ñ',
    'Ã¼': 'ü', 'Ã\x9c': 'Ü',
    'Â°': '°', 'Â¿': '¿', 'Â¡': '¡',
}


def reparar_encoding(texto: Any) -> Optional[str]:
    """
    Repara texto con mojibake (double-encoded UTF-8).
    Ejemplo: "BogotÃ¡" → "Bogotá"

    Method 1: Re-encode as Latin-1, decode as UTF-8 (most reliable)
    Method 2: Manual pattern replacement (fallback for mixed encoding)
    """
    if texto is None or not isinstance(texto, str):
        return texto

    if not texto.strip():
        return texto

    # Method 1: encode/decode approach
    try:
        if 'Ã' in texto or 'Â' in texto:
            decoded = texto.encode('latin-1').decode('utf-8')
            return decoded
    except (UnicodeDecodeError, UnicodeEncodeError):
        pass  # Mixed encoding, fall through

    # Method 2: Manual pattern replacement
    fixed = texto
    for broken, correct in MOJIBAKE_MAP.items():
        if broken in fixed:
            fixed = fixed.replace(broken, correct)

    return fixed


# ==================== CONFIGURACIÓN ====================

# Mapeo de columnas del Excel a campos de la base de datos
COLUMN_MAPPING = {
    # Columna Excel -> Campo BD
    'ID Orden': 'id_orden',
    'Número de Guía': 'numero_guia',
    'Numero de Guia': 'numero_guia',
    'Guía': 'numero_guia',
    'Guia': 'numero_guia',
    'Número Factura': 'numero_factura',
    'Numero Factura': 'numero_factura',

    # Fechas
    'Fecha Reporte': 'fecha_reporte',
    'Fecha Generación Guía': 'fecha_generacion_guia',
    'Fecha Generacion Guia': 'fecha_generacion_guia',
    'Fecha de Generación': 'fecha_generacion_guia',
    'Fecha Último Movimiento': 'fecha_ultimo_movimiento',
    'Fecha Ultimo Movimiento': 'fecha_ultimo_movimiento',
    'Último Movimiento Fecha': 'fecha_ultimo_movimiento',
    'Fecha Novedad': 'fecha_novedad',
    'Fecha Solución': 'fecha_solucion',
    'Fecha Solucion': 'fecha_solucion',

    # Cliente
    'Cliente': 'nombre_cliente',
    'Nombre Cliente': 'nombre_cliente',
    'Nombre': 'nombre_cliente',
    'Teléfono': 'telefono',
    'Telefono': 'telefono',
    'Celular': 'telefono',
    'Email': 'email',
    'Correo': 'email',

    # Ubicación
    'Departamento': 'departamento_destino',
    'Departamento Destino': 'departamento_destino',
    'Ciudad': 'ciudad_destino',
    'Ciudad Destino': 'ciudad_destino',
    'Dirección': 'direccion',
    'Direccion': 'direccion',
    'Código Postal': 'codigo_postal',
    'Codigo Postal': 'codigo_postal',

    # Tracking
    'Estatus': 'estatus',
    'Estado': 'estatus',
    'Status': 'estatus',
    'Transportadora': 'transportadora',
    'Carrier': 'transportadora',
    'Último Movimiento': 'ultimo_movimiento',
    'Ultimo Movimiento': 'ultimo_movimiento',
    'Descripción Estado': 'ultimo_movimiento',

    # Novedades
    'Novedad': 'tipo_novedad',
    'Tipo Novedad': 'tipo_novedad',
    'Descripción Novedad': 'descripcion_novedad',
    'Descripcion Novedad': 'descripcion_novedad',
    'Fue Solucionada': 'fue_solucionada',
    'Solucionada': 'fue_solucionada',
    'Solución': 'solucion',
    'Solucion': 'solucion',

    # Financiero
    'Valor Facturado': 'valor_facturado',
    'Total Factura': 'valor_facturado',
    'Valor Compra Productos': 'valor_compra_productos',
    'Valor Productos': 'valor_compra_productos',
    'Costo Productos': 'valor_compra_productos',
    'Ganancia': 'ganancia',
    'Utilidad': 'ganancia',
    'Precio Flete': 'precio_flete',
    'Costo Flete': 'precio_flete',
    'Flete': 'precio_flete',
    'Costo Devolución': 'costo_devolucion',
    'Costo Devolucion': 'costo_devolucion',

    # Comercial
    'Vendedor': 'vendedor',
    'Asesor': 'vendedor',
    'Tipo Tienda': 'tipo_tienda',
    'Canal': 'tipo_tienda',
    'Tienda': 'tienda',
    'Categorías': 'categorias',
    'Categorias': 'categorias',
    'Categoría': 'categorias',
}

# Columnas requeridas (al menos una de cada grupo)
REQUIRED_COLUMNS = [
    ['Número de Guía', 'Numero de Guia', 'Guía', 'Guia'],
]

# Columnas opcionales importantes
IMPORTANT_COLUMNS = [
    'Ciudad Destino', 'Ciudad',
    'Transportadora', 'Carrier',
    'Estatus', 'Estado', 'Status',
    'Fecha Generación Guía', 'Fecha Generacion Guia',
]


class ExcelProcessor:
    """
    Procesador de archivos Excel para cargar guías al sistema.
    """

    def __init__(self):
        self.errores: List[Dict[str, Any]] = []
        self.warnings: List[str] = []
        self.stats = {
            'total': 0,
            'procesados': 0,
            'errores': 0,
            'duplicados': 0,
        }

    def reset(self):
        self.errores = []
        self.warnings = []
        self.stats = {
            'total': 0,
            'procesados': 0,
            'errores': 0,
            'duplicados': 0,
        }

    def calcular_hash(self, contenido: bytes) -> str:
        return hashlib.md5(contenido).hexdigest()

    def validar_formato(self, df: pd.DataFrame) -> Tuple[bool, List[str]]:
        errores = []
        columnas_excel = set(df.columns.tolist())

        tiene_guia = False
        for grupo in REQUIRED_COLUMNS:
            if any(col in columnas_excel for col in grupo):
                tiene_guia = True
                break

        if not tiene_guia:
            errores.append(
                "El archivo debe contener una columna de número de guía "
                "(Número de Guía, Guía, etc.)"
            )

        columnas_encontradas = []
        for col in IMPORTANT_COLUMNS:
            if col in columnas_excel:
                columnas_encontradas.append(col)

        if len(columnas_encontradas) < 2:
            self.warnings.append(
                f"Se recomienda incluir columnas adicionales: "
                f"{', '.join(IMPORTANT_COLUMNS[:4])}"
            )

        return len(errores) == 0, errores

    def normalizar_columnas(self, df: pd.DataFrame) -> pd.DataFrame:
        """Normaliza nombres de columnas. Repara mojibake en headers."""
        df_normalizado = df.copy()

        # First, repair encoding in column names
        columnas_reparadas = {}
        for col in df.columns:
            col_reparado = reparar_encoding(str(col).strip())
            if col_reparado != str(col).strip():
                columnas_reparadas[col] = col_reparado
                logger.debug(f"Columna reparada: '{col}' -> '{col_reparado}'")

        if columnas_reparadas:
            df_normalizado = df_normalizado.rename(columns=columnas_reparadas)

        # Now map to internal names
        columnas_nuevas = {}
        for col in df_normalizado.columns:
            col_str = str(col).strip()
            if col_str in COLUMN_MAPPING:
                columnas_nuevas[col] = COLUMN_MAPPING[col_str]
            else:
                columnas_nuevas[col] = col_str.lower().replace(' ', '_')

        df_normalizado = df_normalizado.rename(columns=columnas_nuevas)
        return df_normalizado

    def limpiar_datos(self, df: pd.DataFrame) -> pd.DataFrame:
        """Limpia datos. Incluye reparación de encoding mojibake."""
        df_limpio = df.copy()

        # Limpiar strings AND repair encoding
        for col in df_limpio.select_dtypes(include=['object']).columns:
            df_limpio[col] = df_limpio[col].apply(
                lambda x: reparar_encoding(str(x).strip()) if pd.notna(x) else None
            )
            df_limpio[col] = df_limpio[col].replace(['', 'nan', 'None', 'null'], None)

        # Convertir fechas
        columnas_fecha = [
            'fecha_reporte', 'fecha_generacion_guia', 'fecha_ultimo_movimiento',
            'fecha_novedad', 'fecha_solucion', 'fecha_entrega_real'
        ]
        for col in columnas_fecha:
            if col in df_limpio.columns:
                df_limpio[col] = pd.to_datetime(
                    df_limpio[col], errors='coerce', dayfirst=True
                )

        # Convertir valores numéricos
        columnas_numericas = [
            'valor_facturado', 'valor_compra_productos', 'ganancia',
            'precio_flete', 'costo_devolucion'
        ]
        for col in columnas_numericas:
            if col in df_limpio.columns:
                df_limpio[col] = df_limpio[col].apply(
                    lambda x: self._limpiar_numero(x) if pd.notna(x) else None
                )

        columnas_bool = ['fue_solucionada']
        for col in columnas_bool:
            if col in df_limpio.columns:
                df_limpio[col] = df_limpio[col].apply(self._convertir_bool)

        if 'ciudad_destino' in df_limpio.columns:
            df_limpio['ciudad_destino'] = df_limpio['ciudad_destino'].apply(
                self._normalizar_ciudad
            )

        if 'transportadora' in df_limpio.columns:
            df_limpio['transportadora'] = df_limpio['transportadora'].apply(
                self._normalizar_transportadora
            )

        return df_limpio

    def _limpiar_numero(self, valor: Any) -> Optional[float]:
        try:
            if valor is None:
                return None
            valor_str = str(valor).replace('$', '').replace(',', '').replace(' ', '')
            return float(valor_str) if valor_str else None
        except (ValueError, TypeError):
            return None

    def _convertir_bool(self, valor: Any) -> bool:
        if pd.isna(valor) or valor is None:
            return False
        valor_str = str(valor).lower().strip()
        return valor_str in ('si', 'sí', 'yes', 'true', '1', 'x', 'verdadero')

    def _normalizar_ciudad(self, ciudad: Optional[str]) -> Optional[str]:
        if not ciudad:
            return None

        # Repair encoding first, then normalize
        ciudad = reparar_encoding(str(ciudad).strip().upper())

        correcciones = {
            'BOGOTA': 'BOGOTÁ D.C.',
            'BOGOTÁ': 'BOGOTÁ D.C.',
            'BOGOTA D.C': 'BOGOTÁ D.C.',
            'BOGOTA DC': 'BOGOTÁ D.C.',
            'BOGOTÁ D.C': 'BOGOTÁ D.C.',
            'MEDELLIN': 'MEDELLÍN',
            'MEDELLÍN': 'MEDELLÍN',
            'CALI': 'CALI',
            'BARRANQUILLA': 'BARRANQUILLA',
            'BUCARAMANGA': 'BUCARAMANGA',
            'CARTAGENA': 'CARTAGENA',
            'PEREIRA': 'PEREIRA',
            'MANIZALES': 'MANIZALES',
            'SANTA MARTA': 'SANTA MARTA',
            'IBAGUE': 'IBAGUÉ',
            'IBAGUÉ': 'IBAGUÉ',
            'CUCUTA': 'CÚCUTA',
            'CÚCUTA': 'CÚCUTA',
            'VILLAVICENCIO': 'VILLAVICENCIO',
            'PASTO': 'PASTO',
            'NEIVA': 'NEIVA',
            'ARMENIA': 'ARMENIA',
            'POPAYAN': 'POPAYÁN',
            'POPAYÁN': 'POPAYÁN',
            'TUNJA': 'TUNJA',
            'MONTERIA': 'MONTERÍA',
            'MONTERÍA': 'MONTERÍA',
            'VALLEDUPAR': 'VALLEDUPAR',
            'SINCELEJO': 'SINCELEJO',
            'RIOHACHA': 'RIOHACHA',
        }

        return correcciones.get(ciudad, ciudad.title())

    def _normalizar_transportadora(self, transportadora: Optional[str]) -> Optional[str]:
        if not transportadora:
            return None

        transportadora = reparar_encoding(str(transportadora).strip().upper())

        mapeo = {
            'INTER': 'INTERRAPIDISIMO',
            'INTERRAPIDISIMO': 'INTERRAPIDISIMO',
            'INTERRAPIDÍSIMO': 'INTERRAPIDISIMO',
            'INTER RAPIDÍSIMO': 'INTERRAPIDISIMO',
            'INTER RAPIDISIMO': 'INTERRAPIDISIMO',
            'ENVIA': 'ENVÍA',
            'ENVÍA': 'ENVÍA',
            'COORDINADORA': 'COORDINADORA',
            'TCC': 'TCC',
            'SERVIENTREGA': 'SERVIENTREGA',
            'DEPRISA': 'DEPRISA',
            '472': '472',
            'VELOCES': 'VELOCES',
        }

        return mapeo.get(transportadora, transportadora.title())

    def calcular_metricas(self, df: pd.DataFrame) -> pd.DataFrame:
        df_metricas = df.copy()

        if 'fecha_generacion_guia' in df_metricas.columns:
            fecha_referencia = df_metricas.get(
                'fecha_ultimo_movimiento',
                pd.Series([datetime.now()] * len(df_metricas))
            )
            fecha_referencia = fecha_referencia.fillna(datetime.now())
            df_metricas['dias_transito'] = (
                fecha_referencia - df_metricas['fecha_generacion_guia']
            ).dt.days
            df_metricas['dias_transito'] = df_metricas['dias_transito'].clip(lower=0)

        umbral_retraso = 5
        if 'dias_transito' in df_metricas.columns:
            df_metricas['tiene_retraso'] = df_metricas['dias_transito'] > umbral_retraso
            df_metricas['dias_retraso'] = (
                df_metricas['dias_transito'] - umbral_retraso
            ).clip(lower=0)
        else:
            df_metricas['tiene_retraso'] = False
            df_metricas['dias_retraso'] = 0

        if 'tipo_novedad' in df_metricas.columns:
            df_metricas['tiene_novedad'] = df_metricas['tipo_novedad'].notna()
        else:
            df_metricas['tiene_novedad'] = False

        return df_metricas

    def procesar_archivo(
        self,
        archivo_bytes: bytes,
        nombre_archivo: str,
        session: Session,
        usuario: str = 'sistema'
    ) -> Dict[str, Any]:
        self.reset()
        inicio = time.time()

        logger.info(f"Iniciando procesamiento de archivo: {nombre_archivo}")

        hash_archivo = self.calcular_hash(archivo_bytes)

        archivo_existente = session.query(ArchivoCargado).filter_by(
            hash_archivo=hash_archivo
        ).first()

        if archivo_existente:
            logger.warning(f"Archivo duplicado detectado: {nombre_archivo}")
            return {
                'exito': False,
                'archivo': nombre_archivo,
                'total_registros': 0,
                'registros_procesados': 0,
                'registros_errores': 0,
                'tiempo_procesamiento_segundos': 0,
                'errores_detalle': [],
                'mensaje': f"Este archivo ya fue cargado el {archivo_existente.fecha_carga.strftime('%Y-%m-%d %H:%M')}"
            }

        archivo_cargado = ArchivoCargado(
            nombre_archivo=nombre_archivo,
            estado=EstadoArchivo.PROCESANDO,
            usuario_carga=usuario,
            hash_archivo=hash_archivo,
            tamanio_bytes=len(archivo_bytes)
        )
        session.add(archivo_cargado)
        session.flush()

        try:
            logger.debug("Leyendo archivo Excel...")

            # FIX: Use appropriate engine based on file extension
            if nombre_archivo.lower().endswith('.xls'):
                df = pd.read_excel(BytesIO(archivo_bytes), engine='xlrd')
            else:
                df = pd.read_excel(BytesIO(archivo_bytes), engine='openpyxl')

            self.stats['total'] = len(df)
            archivo_cargado.total_registros = len(df)
            logger.info(f"Archivo leído: {len(df)} registros, {len(df.columns)} columnas")

            # FIX: Repair encoding in column names BEFORE validation
            columnas_originales = df.columns.tolist()
            columnas_reparadas = [reparar_encoding(str(c)) for c in columnas_originales]
            if columnas_originales != columnas_reparadas:
                df.columns = columnas_reparadas
                logger.info("Encoding de columnas reparado (mojibake detectado)")

            es_valido, errores_formato = self.validar_formato(df)
            if not es_valido:
                archivo_cargado.estado = EstadoArchivo.ERROR
                archivo_cargado.mensaje_error = "; ".join(errores_formato)
                session.commit()
                return {
                    'exito': False,
                    'archivo': nombre_archivo,
                    'total_registros': len(df),
                    'registros_procesados': 0,
                    'registros_errores': 0,
                    'tiempo_procesamiento_segundos': time.time() - inicio,
                    'errores_detalle': [{'fila': 0, 'error': e} for e in errores_formato],
                    'mensaje': "El archivo no tiene el formato esperado"
                }

            logger.debug("Normalizando columnas...")
            df = self.normalizar_columnas(df)

            logger.debug("Limpiando datos (incluye reparación de encoding)...")
            df = self.limpiar_datos(df)

            logger.debug("Calculando métricas...")
            df = self.calcular_metricas(df)

            batch_size = 100
            guias_existentes = set(
                g[0] for g in session.query(GuiaHistorica.numero_guia).all()
            )

            for i in range(0, len(df), batch_size):
                batch = df.iloc[i:i + batch_size]

                for idx, row in batch.iterrows():
                    try:
                        numero_guia = row.get('numero_guia')

                        if not numero_guia:
                            self.errores.append({
                                'fila': idx + 2,
                                'columna': 'numero_guia',
                                'valor': 'vacío',
                                'error': 'Número de guía requerido'
                            })
                            self.stats['errores'] += 1
                            continue

                        if numero_guia in guias_existentes:
                            self.stats['duplicados'] += 1
                            continue

                        guia = self._crear_guia_desde_fila(row, archivo_cargado.id)
                        session.add(guia)
                        guias_existentes.add(numero_guia)
                        self.stats['procesados'] += 1

                    except Exception as e:
                        self.errores.append({
                            'fila': idx + 2,
                            'columna': 'general',
                            'valor': str(row.get('numero_guia', 'N/A')),
                            'error': str(e)
                        })
                        self.stats['errores'] += 1
                        logger.error(f"Error en fila {idx + 2}: {e}")

                session.flush()
                logger.debug(f"Procesadas {min(i + batch_size, len(df))}/{len(df)} filas")

            tiempo_total = time.time() - inicio
            archivo_cargado.registros_procesados = self.stats['procesados']
            archivo_cargado.registros_errores = self.stats['errores']
            archivo_cargado.registros_duplicados = self.stats['duplicados']
            archivo_cargado.tiempo_procesamiento_segundos = tiempo_total
            archivo_cargado.errores_detalle = self.errores[:100]

            if self.stats['errores'] > 0 and self.stats['procesados'] > 0:
                archivo_cargado.estado = EstadoArchivo.PARCIAL
            elif self.stats['errores'] > 0:
                archivo_cargado.estado = EstadoArchivo.ERROR
            else:
                archivo_cargado.estado = EstadoArchivo.COMPLETADO

            session.commit()

            logger.success(
                f"Procesamiento completado: {self.stats['procesados']} procesados, "
                f"{self.stats['errores']} errores, {self.stats['duplicados']} duplicados"
            )

            return {
                'exito': True,
                'archivo': nombre_archivo,
                'total_registros': self.stats['total'],
                'registros_procesados': self.stats['procesados'],
                'registros_errores': self.stats['errores'],
                'registros_duplicados': self.stats['duplicados'],
                'tiempo_procesamiento_segundos': tiempo_total,
                'errores_detalle': self.errores[:50],
                'warnings': self.warnings,
                'mensaje': f"Archivo procesado: {self.stats['procesados']} registros cargados"
            }

        except Exception as e:
            logger.error(f"Error general procesando archivo: {e}")
            archivo_cargado.estado = EstadoArchivo.ERROR
            archivo_cargado.mensaje_error = str(e)
            session.commit()

            return {
                'exito': False,
                'archivo': nombre_archivo,
                'total_registros': self.stats['total'],
                'registros_procesados': 0,
                'registros_errores': 0,
                'tiempo_procesamiento_segundos': time.time() - inicio,
                'errores_detalle': [{'fila': 0, 'error': str(e)}],
                'mensaje': f"Error procesando archivo: {str(e)}"
            }

    def _crear_guia_desde_fila(self, row: pd.Series, archivo_id: int) -> GuiaHistorica:
        guia = GuiaHistorica(
            archivo_origen_id=archivo_id,
            id_orden=row.get('id_orden'),
            numero_guia=str(row.get('numero_guia')),
            numero_factura=row.get('numero_factura'),
            fecha_reporte=row.get('fecha_reporte'),
            fecha_generacion_guia=row.get('fecha_generacion_guia'),
            fecha_ultimo_movimiento=row.get('fecha_ultimo_movimiento'),
            fecha_novedad=row.get('fecha_novedad'),
            fecha_solucion=row.get('fecha_solucion'),
            nombre_cliente=row.get('nombre_cliente'),
            telefono=row.get('telefono'),
            email=row.get('email'),
            departamento_destino=row.get('departamento_destino'),
            ciudad_destino=row.get('ciudad_destino'),
            direccion=row.get('direccion'),
            codigo_postal=row.get('codigo_postal'),
            estatus=row.get('estatus'),
            transportadora=row.get('transportadora'),
            ultimo_movimiento=row.get('ultimo_movimiento'),
            tiene_novedad=bool(row.get('tiene_novedad', False)),
            tipo_novedad=row.get('tipo_novedad'),
            descripcion_novedad=row.get('descripcion_novedad'),
            fue_solucionada=bool(row.get('fue_solucionada', False)),
            solucion=row.get('solucion'),
            valor_facturado=row.get('valor_facturado'),
            valor_compra_productos=row.get('valor_compra_productos'),
            ganancia=row.get('ganancia'),
            precio_flete=row.get('precio_flete'),
            costo_devolucion=row.get('costo_devolucion'),
            vendedor=row.get('vendedor'),
            tipo_tienda=row.get('tipo_tienda'),
            tienda=row.get('tienda'),
            categorias=row.get('categorias'),
            dias_transito=int(row.get('dias_transito', 0)) if pd.notna(row.get('dias_transito')) else None,
            tiene_retraso=bool(row.get('tiene_retraso', False)),
            dias_retraso=int(row.get('dias_retraso', 0)) if pd.notna(row.get('dias_retraso')) else None,
        )
        return guia


# Instancia global del procesador
excel_processor = ExcelProcessor()
