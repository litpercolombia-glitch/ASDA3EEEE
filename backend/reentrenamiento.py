"""
Sistema de Reentrenamiento Automático de Modelos ML.
Usa APScheduler para ejecutar reentrenamiento semanal.
"""

import os
from datetime import datetime, timedelta
from typing import Optional, Dict, Any

import pandas as pd
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from loguru import logger

from database import (
    get_db_session,
    get_config,
    set_config,
    GuiaHistorica,
    MetricaModelo,
    AlertaSistema,
    TipoAlerta,
    SeveridadAlerta,
)
from ml_models import gestor_modelos


class SistemaReentrenamiento:
    """
    Sistema que maneja el reentrenamiento automático de modelos ML.
    Configurado para ejecutarse semanalmente los domingos a las 2:00 AM.
    """

    def __init__(self):
        self.scheduler = BackgroundScheduler()
        self.ultimo_entrenamiento: Optional[datetime] = None
        self.esta_ejecutando = False

    def iniciar_programacion(self):
        """
        Configura y arranca el scheduler para reentrenamiento automático.
        """
        # Obtener hora de reentrenamiento de config
        hora_reentrenamiento = get_config('hora_reentrenamiento', '02:00')
        hora, minuto = hora_reentrenamiento.split(':')

        # Configurar job para domingos a la hora especificada
        self.scheduler.add_job(
            self._ejecutar_reentrenamiento_programado,
            CronTrigger(
                day_of_week='sun',
                hour=int(hora),
                minute=int(minuto)
            ),
            id='reentrenamiento_semanal',
            name='Reentrenamiento semanal de modelos ML',
            replace_existing=True
        )

        # Job diario para verificar necesidad de reentrenamiento
        self.scheduler.add_job(
            self._verificar_necesidad_reentrenamiento,
            CronTrigger(hour=8, minute=0),
            id='verificar_reentrenamiento',
            name='Verificar necesidad de reentrenamiento',
            replace_existing=True
        )

        self.scheduler.start()
        logger.success(f"Scheduler de reentrenamiento iniciado - Domingos a las {hora_reentrenamiento}")

    def detener(self):
        """Detiene el scheduler"""
        if self.scheduler.running:
            self.scheduler.shutdown()
            logger.info("Scheduler de reentrenamiento detenido")

    def _ejecutar_reentrenamiento_programado(self):
        """Ejecuta el reentrenamiento programado automáticamente"""
        # Verificar si está habilitado
        automatico_habilitado = get_config('reentrenamiento_automatico', 'true').lower() == 'true'

        if not automatico_habilitado:
            logger.info("Reentrenamiento automático deshabilitado")
            return

        logger.info("Iniciando reentrenamiento automático programado")
        self.ejecutar_reentrenamiento()

    def _verificar_necesidad_reentrenamiento(self):
        """Verifica si se necesita reentrenamiento basado en métricas"""
        try:
            with get_db_session() as session:
                # Obtener última métrica
                ultima_metrica = session.query(MetricaModelo).filter(
                    MetricaModelo.nombre_modelo == 'ModeloRetrasos',
                    MetricaModelo.esta_activo == True
                ).order_by(MetricaModelo.fecha_entrenamiento.desc()).first()

                if not ultima_metrica:
                    logger.info("No hay métricas previas, se recomienda entrenamiento inicial")
                    return

                # Verificar días desde último entrenamiento
                dias_config = int(get_config('dias_para_reentrenamiento', '7'))
                dias_desde_ultimo = (datetime.now() - ultima_metrica.fecha_entrenamiento).days

                if dias_desde_ultimo >= dias_config:
                    self._crear_alerta_reentrenamiento(
                        f"Han pasado {dias_desde_ultimo} días desde el último entrenamiento"
                    )

                # Verificar accuracy
                umbral_accuracy = 0.85
                if ultima_metrica.accuracy and ultima_metrica.accuracy < umbral_accuracy:
                    self._crear_alerta_reentrenamiento(
                        f"Accuracy del modelo ({ultima_metrica.accuracy:.2%}) "
                        f"por debajo del umbral ({umbral_accuracy:.0%})"
                    )

        except Exception as e:
            logger.error(f"Error verificando necesidad de reentrenamiento: {e}")

    def _crear_alerta_reentrenamiento(self, razon: str):
        """Crea una alerta de sistema para reentrenamiento"""
        try:
            with get_db_session() as session:
                alerta = AlertaSistema(
                    tipo_alerta=TipoAlerta.ML,
                    severidad=SeveridadAlerta.WARNING,
                    titulo="Se recomienda reentrenamiento de modelos",
                    descripcion=razon,
                    datos_relevantes={
                        'razon': razon,
                        'fecha_verificacion': datetime.now().isoformat()
                    }
                )
                session.add(alerta)
                session.commit()
                logger.info(f"Alerta de reentrenamiento creada: {razon}")
        except Exception as e:
            logger.error(f"Error creando alerta: {e}")

    def ejecutar_reentrenamiento(self, manual: bool = False) -> Dict[str, Any]:
        """
        Ejecuta el proceso de reentrenamiento de modelos.

        Args:
            manual: Si es True, fue disparado manualmente.

        Returns:
            Diccionario con resultados del entrenamiento.
        """
        if self.esta_ejecutando:
            return {
                'exito': False,
                'mensaje': 'Ya hay un reentrenamiento en progreso'
            }

        self.esta_ejecutando = True
        inicio = datetime.now()

        logger.info(f"Iniciando reentrenamiento {'manual' if manual else 'automático'}")

        try:
            with get_db_session() as session:
                # Obtener cantidad mínima de registros
                min_registros = int(get_config('min_registros_entrenamiento', '100'))

                # Contar registros disponibles
                total_guias = session.query(GuiaHistorica).count()

                if total_guias < min_registros:
                    mensaje = f"Insuficientes datos: {total_guias} guías (mínimo {min_registros})"
                    logger.warning(mensaje)
                    return {
                        'exito': False,
                        'mensaje': mensaje,
                        'guias_disponibles': total_guias,
                        'minimo_requerido': min_registros
                    }

                # Obtener todos los datos
                logger.info(f"Obteniendo {total_guias} guías para entrenamiento...")
                guias = session.query(GuiaHistorica).all()

                # Convertir a DataFrame
                df = pd.DataFrame([g.to_dict() for g in guias])

                # Entrenar modelos
                logger.info("Entrenando modelos...")
                resultados = gestor_modelos.entrenar_todos(df)

                # Guardar métricas en BD
                for metrica in resultados.get('metricas', []):
                    if metrica.get('accuracy'):  # Solo si se entrenó correctamente
                        nueva_metrica = MetricaModelo(
                            nombre_modelo=metrica.get('modelo'),
                            version=metrica.get('version'),
                            accuracy=metrica.get('accuracy'),
                            precision=metrica.get('precision'),
                            recall=metrica.get('recall'),
                            f1_score=metrica.get('f1_score'),
                            roc_auc=metrica.get('roc_auc'),
                            total_registros_entrenamiento=metrica.get('registros_entrenamiento'),
                            duracion_entrenamiento_segundos=metrica.get('duracion_segundos'),
                            features_importantes=metrica.get('features_importantes'),
                            esta_activo=True
                        )
                        session.add(nueva_metrica)

                        # Desactivar métricas anteriores
                        session.query(MetricaModelo).filter(
                            MetricaModelo.nombre_modelo == metrica.get('modelo'),
                            MetricaModelo.version != metrica.get('version')
                        ).update({'esta_activo': False})

                session.commit()

                # Crear alerta de éxito
                alerta_exito = AlertaSistema(
                    tipo_alerta=TipoAlerta.ML,
                    severidad=SeveridadAlerta.INFO,
                    titulo="Reentrenamiento de modelos completado",
                    descripcion=f"Modelos entrenados: {', '.join(resultados.get('modelos_entrenados', []))}",
                    datos_relevantes={
                        'manual': manual,
                        'modelos': resultados.get('modelos_entrenados', []),
                        'tiempo_total': resultados.get('tiempo_total_segundos'),
                        'metricas': resultados.get('metricas', [])
                    },
                    esta_activa=False  # Auto-resolver
                )
                session.add(alerta_exito)
                session.commit()

                self.ultimo_entrenamiento = datetime.now()

                logger.success(
                    f"Reentrenamiento completado: {len(resultados.get('modelos_entrenados', []))} modelos "
                    f"en {resultados.get('tiempo_total_segundos', 0):.2f}s"
                )

                return {
                    'exito': resultados.get('exito', False),
                    'mensaje': 'Reentrenamiento completado exitosamente',
                    'modelos_entrenados': resultados.get('modelos_entrenados', []),
                    'metricas': resultados.get('metricas', []),
                    'tiempo_total_segundos': resultados.get('tiempo_total_segundos'),
                    'errores': resultados.get('errores', []),
                    'guias_usadas': total_guias
                }

        except Exception as e:
            logger.error(f"Error en reentrenamiento: {e}")

            # Crear alerta de error
            try:
                with get_db_session() as session:
                    alerta_error = AlertaSistema(
                        tipo_alerta=TipoAlerta.ML,
                        severidad=SeveridadAlerta.ERROR,
                        titulo="Error en reentrenamiento de modelos",
                        descripcion=str(e),
                        datos_relevantes={'error': str(e), 'manual': manual}
                    )
                    session.add(alerta_error)
                    session.commit()
            except:
                pass

            return {
                'exito': False,
                'mensaje': f'Error en reentrenamiento: {str(e)}',
                'error': str(e)
            }

        finally:
            self.esta_ejecutando = False

    def verificar_necesidad_reentrenamiento(self) -> Dict[str, Any]:
        """
        Verifica si se necesita reentrenamiento.

        Returns:
            Diccionario con estado y recomendaciones.
        """
        try:
            with get_db_session() as session:
                # Última métrica activa
                ultima_metrica = session.query(MetricaModelo).filter(
                    MetricaModelo.esta_activo == True
                ).order_by(MetricaModelo.fecha_entrenamiento.desc()).first()

                if not ultima_metrica:
                    return {
                        'necesita_reentrenamiento': True,
                        'razon': 'No hay modelos entrenados',
                        'dias_desde_ultimo': None,
                        'accuracy_actual': None
                    }

                dias_desde_ultimo = (datetime.now() - ultima_metrica.fecha_entrenamiento).days
                dias_umbral = int(get_config('dias_para_reentrenamiento', '7'))

                # Contar registros nuevos
                registros_nuevos = session.query(GuiaHistorica).filter(
                    GuiaHistorica.fecha_creacion > ultima_metrica.fecha_entrenamiento
                ).count()

                necesita = (
                    dias_desde_ultimo >= dias_umbral or
                    (ultima_metrica.accuracy and ultima_metrica.accuracy < 0.85) or
                    registros_nuevos > 500  # Muchos datos nuevos
                )

                razones = []
                if dias_desde_ultimo >= dias_umbral:
                    razones.append(f"Han pasado {dias_desde_ultimo} días")
                if ultima_metrica.accuracy and ultima_metrica.accuracy < 0.85:
                    razones.append(f"Accuracy bajo: {ultima_metrica.accuracy:.2%}")
                if registros_nuevos > 500:
                    razones.append(f"{registros_nuevos} registros nuevos")

                return {
                    'necesita_reentrenamiento': necesita,
                    'razon': '; '.join(razones) if razones else 'Modelo actualizado',
                    'dias_desde_ultimo': dias_desde_ultimo,
                    'accuracy_actual': ultima_metrica.accuracy,
                    'registros_nuevos': registros_nuevos,
                    'ultimo_entrenamiento': ultima_metrica.fecha_entrenamiento.isoformat()
                }

        except Exception as e:
            logger.error(f"Error verificando necesidad: {e}")
            return {
                'necesita_reentrenamiento': True,
                'razon': f'Error verificando: {str(e)}',
                'error': str(e)
            }


# Instancia global
sistema_reentrenamiento = SistemaReentrenamiento()
