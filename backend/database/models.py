"""
Modelos SQLAlchemy para el sistema ML de Litper Logística
Define todas las tablas de la base de datos PostgreSQL
"""

from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, Text,
    ForeignKey, JSON, Index, Enum as SQLEnum
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
import enum

Base = declarative_base()


# ==================== ENUMS ====================

class EstadoArchivo(enum.Enum):
    """Estados posibles de un archivo cargado"""
    PROCESANDO = "PROCESANDO"
    COMPLETADO = "COMPLETADO"
    ERROR = "ERROR"
    PARCIAL = "PARCIAL"


class NivelRiesgo(enum.Enum):
    """Niveles de riesgo para predicciones"""
    BAJO = "BAJO"
    MEDIO = "MEDIO"
    ALTO = "ALTO"
    CRITICO = "CRITICO"


class SeveridadAlerta(enum.Enum):
    """Severidad de alertas del sistema"""
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"


class TipoAlerta(enum.Enum):
    """Tipos de alertas del sistema"""
    RETRASO = "RETRASO"
    NOVEDAD = "NOVEDAD"
    SISTEMA = "SISTEMA"
    ML = "ML"
    AUTOMATICA = "AUTOMATICA"


# ==================== MODELOS ====================

class GuiaHistorica(Base):
    """
    Tabla principal que almacena todas las guías de envío procesadas.
    Contiene información detallada de cada envío y métricas calculadas.
    """
    __tablename__ = 'guias_historicas'

    # Identificadores
    id = Column(Integer, primary_key=True, autoincrement=True)
    id_orden = Column(String(50), nullable=True)
    numero_guia = Column(String(50), nullable=False, index=True)
    numero_factura = Column(String(50), nullable=True)

    # Fechas importantes
    fecha_reporte = Column(DateTime, nullable=True)
    fecha_generacion_guia = Column(DateTime, nullable=True)
    fecha_ultimo_movimiento = Column(DateTime, nullable=True)
    fecha_novedad = Column(DateTime, nullable=True)
    fecha_solucion = Column(DateTime, nullable=True)
    fecha_entrega_real = Column(DateTime, nullable=True)

    # Información del cliente
    nombre_cliente = Column(String(200), nullable=True)
    telefono = Column(String(50), nullable=True)
    email = Column(String(100), nullable=True)

    # Ubicación
    departamento_destino = Column(String(100), nullable=True)
    ciudad_destino = Column(String(100), nullable=True, index=True)
    direccion = Column(Text, nullable=True)
    codigo_postal = Column(String(20), nullable=True)

    # Tracking y estado
    estatus = Column(String(100), nullable=True, index=True)
    transportadora = Column(String(100), nullable=True, index=True)
    ultimo_movimiento = Column(Text, nullable=True)

    # Novedades
    tiene_novedad = Column(Boolean, default=False)
    tipo_novedad = Column(String(100), nullable=True)
    descripcion_novedad = Column(Text, nullable=True)
    fue_solucionada = Column(Boolean, default=False)
    solucion = Column(Text, nullable=True)

    # Información financiera
    valor_facturado = Column(Float, nullable=True)
    valor_compra_productos = Column(Float, nullable=True)
    ganancia = Column(Float, nullable=True)
    precio_flete = Column(Float, nullable=True)
    costo_devolucion = Column(Float, nullable=True)

    # Información comercial
    vendedor = Column(String(100), nullable=True)
    tipo_tienda = Column(String(100), nullable=True)
    tienda = Column(String(100), nullable=True)
    categorias = Column(String(500), nullable=True)

    # Métricas calculadas
    dias_transito = Column(Integer, nullable=True)
    tiene_retraso = Column(Boolean, default=False)
    dias_retraso = Column(Integer, nullable=True)

    # Predicciones ML
    probabilidad_retraso = Column(Float, nullable=True)
    prediccion_dias_entrega = Column(Integer, nullable=True)
    riesgo_novedad = Column(Float, nullable=True)
    nivel_riesgo = Column(String(20), nullable=True)

    # Metadata
    archivo_origen_id = Column(Integer, ForeignKey('archivos_cargados.id'), nullable=True)
    fecha_creacion = Column(DateTime, default=datetime.utcnow)
    fecha_actualizacion = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relación con archivo origen
    archivo_origen = relationship("ArchivoCargado", back_populates="guias")

    # Relación con predicciones
    predicciones = relationship("PrediccionTiempoReal", back_populates="guia")

    # Índices compuestos para optimización
    __table_args__ = (
        Index('idx_guia_transportadora_fecha', 'transportadora', 'fecha_generacion_guia'),
        Index('idx_guia_ciudad_retraso', 'ciudad_destino', 'tiene_retraso'),
        Index('idx_guia_estatus_fecha', 'estatus', 'fecha_generacion_guia'),
    )

    def __repr__(self):
        return f"<GuiaHistorica(id={self.id}, guia={self.numero_guia}, ciudad={self.ciudad_destino})>"

    def to_dict(self):
        """Convierte el modelo a diccionario"""
        return {
            'id': self.id,
            'numero_guia': self.numero_guia,
            'id_orden': self.id_orden,
            'fecha_generacion': self.fecha_generacion_guia.isoformat() if self.fecha_generacion_guia else None,
            'nombre_cliente': self.nombre_cliente,
            'telefono': self.telefono,
            'ciudad_destino': self.ciudad_destino,
            'departamento_destino': self.departamento_destino,
            'estatus': self.estatus,
            'transportadora': self.transportadora,
            'dias_transito': self.dias_transito,
            'tiene_retraso': self.tiene_retraso,
            'tiene_novedad': self.tiene_novedad,
            'tipo_novedad': self.tipo_novedad,
            'probabilidad_retraso': self.probabilidad_retraso,
            'nivel_riesgo': self.nivel_riesgo,
            'precio_flete': self.precio_flete,
            'valor_compra_productos': self.valor_compra_productos,
        }


class ArchivoCargado(Base):
    """
    Registro de archivos Excel cargados al sistema.
    Mantiene el historial y estadísticas de cada carga.
    """
    __tablename__ = 'archivos_cargados'

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre_archivo = Column(String(255), nullable=False)
    ruta_archivo = Column(String(500), nullable=True)
    fecha_carga = Column(DateTime, default=datetime.utcnow)

    # Estadísticas de procesamiento
    total_registros = Column(Integer, default=0)
    registros_procesados = Column(Integer, default=0)
    registros_errores = Column(Integer, default=0)
    registros_duplicados = Column(Integer, default=0)

    # Estado
    estado = Column(SQLEnum(EstadoArchivo), default=EstadoArchivo.PROCESANDO)
    mensaje_error = Column(Text, nullable=True)
    errores_detalle = Column(JSON, nullable=True)

    # Metadata
    usuario_carga = Column(String(100), default='sistema')
    tiempo_procesamiento_segundos = Column(Float, nullable=True)
    hash_archivo = Column(String(64), unique=True, nullable=True)
    tamanio_bytes = Column(Integer, nullable=True)

    # Relación con guías
    guias = relationship("GuiaHistorica", back_populates="archivo_origen")

    def __repr__(self):
        return f"<ArchivoCargado(id={self.id}, archivo={self.nombre_archivo}, estado={self.estado})>"


class MetricaModelo(Base):
    """
    Métricas de los modelos de Machine Learning.
    Almacena el historial de rendimiento de cada modelo entrenado.
    """
    __tablename__ = 'metricas_modelos'

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre_modelo = Column(String(100), nullable=False, index=True)
    version = Column(String(50), nullable=False)

    # Métricas de rendimiento
    accuracy = Column(Float, nullable=True)
    precision = Column(Float, nullable=True)
    recall = Column(Float, nullable=True)
    f1_score = Column(Float, nullable=True)
    roc_auc = Column(Float, nullable=True)

    # Información de entrenamiento
    fecha_entrenamiento = Column(DateTime, default=datetime.utcnow)
    total_registros_entrenamiento = Column(Integer, nullable=True)
    duracion_entrenamiento_segundos = Column(Float, nullable=True)

    # Configuración del modelo
    hiperparametros = Column(JSON, nullable=True)
    features_importantes = Column(JSON, nullable=True)

    # Estado
    esta_activo = Column(Boolean, default=False)
    ruta_archivo_modelo = Column(String(500), nullable=True)

    # Referencia al archivo que lo entrenó
    archivo_id = Column(Integer, ForeignKey('archivos_cargados.id'), nullable=True)

    def __repr__(self):
        return f"<MetricaModelo(modelo={self.nombre_modelo}, version={self.version}, accuracy={self.accuracy})>"


class ConversacionChat(Base):
    """
    Historial de conversaciones con el chat inteligente.
    Almacena preguntas, respuestas y métricas de uso.
    """
    __tablename__ = 'conversaciones_chat'

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String(100), nullable=True, index=True)
    usuario = Column(String(100), default='anonimo')

    # Conversación
    pregunta_usuario = Column(Text, nullable=False)
    respuesta_ia = Column(Text, nullable=False)
    tipo_consulta = Column(String(50), nullable=True)

    # Contexto usado
    guias_consultadas = Column(JSON, nullable=True)
    metricas_usadas = Column(JSON, nullable=True)
    accion_ejecutada = Column(String(100), nullable=True)
    resultado_accion = Column(JSON, nullable=True)

    # Métricas de rendimiento
    fecha_conversacion = Column(DateTime, default=datetime.utcnow, index=True)
    tiempo_respuesta_segundos = Column(Float, nullable=True)
    tokens_usados = Column(Integer, nullable=True)

    # Feedback
    feedback_positivo = Column(Boolean, nullable=True)
    comentario_feedback = Column(Text, nullable=True)

    def __repr__(self):
        return f"<ConversacionChat(id={self.id}, tipo={self.tipo_consulta}, fecha={self.fecha_conversacion})>"


class PrediccionTiempoReal(Base):
    """
    Registro de predicciones realizadas en tiempo real.
    Permite comparar predicciones con resultados reales.
    """
    __tablename__ = 'predicciones_tiempo_real'

    id = Column(Integer, primary_key=True, autoincrement=True)
    numero_guia = Column(String(50), nullable=False, index=True)
    guia_id = Column(Integer, ForeignKey('guias_historicas.id'), nullable=True)

    # Predicción
    probabilidad_entrega_tiempo = Column(Float, nullable=True)
    dias_estimados_entrega = Column(Integer, nullable=True)
    fecha_estimada_entrega = Column(DateTime, nullable=True)

    # Análisis de riesgo
    nivel_riesgo = Column(SQLEnum(NivelRiesgo), nullable=True)
    factores_riesgo = Column(JSON, nullable=True)
    acciones_recomendadas = Column(JSON, nullable=True)

    # Metadata de predicción
    fecha_prediccion = Column(DateTime, default=datetime.utcnow, index=True)
    modelo_usado = Column(String(100), nullable=True)
    version_modelo = Column(String(50), nullable=True)
    confianza_prediccion = Column(Float, nullable=True)

    # Resultado real (para validación)
    resultado_real = Column(String(50), nullable=True)
    fecha_entrega_real = Column(DateTime, nullable=True)
    fue_preciso = Column(Boolean, nullable=True)
    error_dias = Column(Integer, nullable=True)

    # Relación con guía
    guia = relationship("GuiaHistorica", back_populates="predicciones")

    def __repr__(self):
        return f"<PrediccionTiempoReal(guia={self.numero_guia}, riesgo={self.nivel_riesgo})>"


class ConfiguracionSistema(Base):
    """
    Configuraciones del sistema ML.
    Almacena parámetros ajustables del sistema.
    """
    __tablename__ = 'configuraciones_sistema'

    id = Column(Integer, primary_key=True, autoincrement=True)
    clave = Column(String(100), unique=True, nullable=False)
    valor = Column(Text, nullable=True)
    descripcion = Column(Text, nullable=True)
    tipo_dato = Column(String(50), default='string')  # string, int, float, bool, json
    categoria = Column(String(50), default='general')  # general, ml, chat, alertas

    # Metadata
    fecha_creacion = Column(DateTime, default=datetime.utcnow)
    fecha_actualizacion = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    usuario_modificacion = Column(String(100), nullable=True)

    def __repr__(self):
        return f"<ConfiguracionSistema(clave={self.clave}, valor={self.valor})>"

    def get_valor_tipado(self):
        """Retorna el valor convertido al tipo correcto"""
        if self.tipo_dato == 'int':
            return int(self.valor) if self.valor else 0
        elif self.tipo_dato == 'float':
            return float(self.valor) if self.valor else 0.0
        elif self.tipo_dato == 'bool':
            return self.valor.lower() in ('true', '1', 'yes', 'si') if self.valor else False
        elif self.tipo_dato == 'json':
            import json
            return json.loads(self.valor) if self.valor else {}
        return self.valor


class AlertaSistema(Base):
    """
    Alertas generadas por el sistema.
    Incluye alertas de modelos ML, retrasos, novedades, etc.
    """
    __tablename__ = 'alertas_sistema'

    id = Column(Integer, primary_key=True, autoincrement=True)
    tipo_alerta = Column(SQLEnum(TipoAlerta), nullable=False)
    severidad = Column(SQLEnum(SeveridadAlerta), default=SeveridadAlerta.INFO)

    # Contenido
    titulo = Column(String(200), nullable=False)
    descripcion = Column(Text, nullable=True)
    datos_relevantes = Column(JSON, nullable=True)

    # Estado
    esta_activa = Column(Boolean, default=True)
    fecha_creacion = Column(DateTime, default=datetime.utcnow, index=True)
    fecha_resolucion = Column(DateTime, nullable=True)

    # Resolución
    acciones_tomadas = Column(JSON, nullable=True)
    usuario_resolvio = Column(String(100), nullable=True)
    comentario_resolucion = Column(Text, nullable=True)

    # Relaciones opcionales
    guia_relacionada_id = Column(Integer, ForeignKey('guias_historicas.id'), nullable=True)

    def __repr__(self):
        return f"<AlertaSistema(id={self.id}, tipo={self.tipo_alerta}, titulo={self.titulo})>"


class WorkflowAutomatizado(Base):
    """
    Workflows automatizados definidos por usuarios.
    Permite crear automatizaciones tipo "Si X entonces Y".
    """
    __tablename__ = 'workflows_automatizados'

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(200), nullable=False)
    descripcion = Column(Text, nullable=True)

    # Condición del workflow
    condicion_tipo = Column(String(50), nullable=False)  # retraso, novedad, probabilidad, etc.
    condicion_parametros = Column(JSON, nullable=False)  # Parámetros de la condición

    # Acción a ejecutar
    accion_tipo = Column(String(50), nullable=False)  # notificar, email, crear_tarea, etc.
    accion_parametros = Column(JSON, nullable=False)  # Parámetros de la acción

    # Estado
    esta_activo = Column(Boolean, default=True)
    fecha_creacion = Column(DateTime, default=datetime.utcnow)
    fecha_ultima_ejecucion = Column(DateTime, nullable=True)
    total_ejecuciones = Column(Integer, default=0)

    # Metadata
    creado_por = Column(String(100), nullable=True)

    def __repr__(self):
        return f"<WorkflowAutomatizado(id={self.id}, nombre={self.nombre}, activo={self.esta_activo})>"


class ReporteGenerado(Base):
    """
    Registro de reportes generados por el sistema.
    """
    __tablename__ = 'reportes_generados'

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(200), nullable=False)
    tipo = Column(String(50), nullable=False)  # PDF, EXCEL, CSV

    # Configuración del reporte
    filtros_aplicados = Column(JSON, nullable=True)
    columnas_incluidas = Column(JSON, nullable=True)

    # Archivo
    ruta_archivo = Column(String(500), nullable=True)
    tamanio_bytes = Column(Integer, nullable=True)
    url_descarga = Column(String(500), nullable=True)

    # Metadata
    fecha_generacion = Column(DateTime, default=datetime.utcnow)
    tiempo_generacion_segundos = Column(Float, nullable=True)
    total_registros = Column(Integer, nullable=True)
    generado_por = Column(String(100), default='sistema')

    def __repr__(self):
        return f"<ReporteGenerado(id={self.id}, nombre={self.nombre}, tipo={self.tipo})>"


class NotificacionUsuario(Base):
    """
    Notificaciones para usuarios del sistema.
    """
    __tablename__ = 'notificaciones_usuarios'

    id = Column(Integer, primary_key=True, autoincrement=True)
    usuario = Column(String(100), nullable=False, index=True)
    tipo = Column(String(50), nullable=False)  # info, warning, error, success

    # Contenido
    titulo = Column(String(200), nullable=False)
    mensaje = Column(Text, nullable=True)
    datos_adicionales = Column(JSON, nullable=True)

    # Estado
    leida = Column(Boolean, default=False)
    fecha_creacion = Column(DateTime, default=datetime.utcnow)
    fecha_lectura = Column(DateTime, nullable=True)

    # Origen
    origen = Column(String(100), nullable=True)  # sistema, chat, workflow, ml
    alerta_relacionada_id = Column(Integer, ForeignKey('alertas_sistema.id'), nullable=True)

    def __repr__(self):
        return f"<NotificacionUsuario(id={self.id}, usuario={self.usuario}, titulo={self.titulo})>"


# ==================== CONFIGURACIONES POR DEFECTO ====================

CONFIGURACIONES_DEFAULT = [
    {
        'clave': 'reentrenamiento_automatico',
        'valor': 'true',
        'descripcion': 'Habilita el reentrenamiento automático semanal de modelos ML',
        'tipo_dato': 'bool',
        'categoria': 'ml'
    },
    {
        'clave': 'dias_retraso_alerta',
        'valor': '3',
        'descripcion': 'Días sin movimiento para considerar una guía en retraso',
        'tipo_dato': 'int',
        'categoria': 'alertas'
    },
    {
        'clave': 'umbral_probabilidad_retraso',
        'valor': '0.7',
        'descripcion': 'Umbral de probabilidad para alertar sobre posible retraso',
        'tipo_dato': 'float',
        'categoria': 'ml'
    },
    {
        'clave': 'min_registros_entrenamiento',
        'valor': '100',
        'descripcion': 'Mínimo de registros necesarios para entrenar modelos',
        'tipo_dato': 'int',
        'categoria': 'ml'
    },
    {
        'clave': 'dias_para_reentrenamiento',
        'valor': '7',
        'descripcion': 'Días máximos entre entrenamientos de modelo',
        'tipo_dato': 'int',
        'categoria': 'ml'
    },
    {
        'clave': 'max_tokens_chat',
        'valor': '2000',
        'descripcion': 'Máximo de tokens para respuestas del chat IA',
        'tipo_dato': 'int',
        'categoria': 'chat'
    },
    {
        'clave': 'modelo_chat_default',
        'valor': 'claude-sonnet-4-20250514',
        'descripcion': 'Modelo de Claude a usar por defecto en el chat',
        'tipo_dato': 'string',
        'categoria': 'chat'
    },
    {
        'clave': 'notificaciones_email_activas',
        'valor': 'false',
        'descripcion': 'Habilita el envío de notificaciones por email',
        'tipo_dato': 'bool',
        'categoria': 'general'
    },
    {
        'clave': 'hora_reentrenamiento',
        'valor': '02:00',
        'descripcion': 'Hora para ejecutar el reentrenamiento automático',
        'tipo_dato': 'string',
        'categoria': 'ml'
    },
    {
        'clave': 'dias_retencion_logs',
        'valor': '30',
        'descripcion': 'Días para retener logs del sistema',
        'tipo_dato': 'int',
        'categoria': 'general'
    },
]


# ==================== TRACKING ORDENES ====================

class SesionTrackingTransportadora(Base):
    """
    Registro de sesiones de carga de archivos de tracking de transportadoras.
    Cada vez que se sube un Excel, se crea una sesión para cruzar datos históricos.
    """
    __tablename__ = 'sesiones_tracking_transportadora'

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre_sesion = Column(String(200), nullable=False)
    fecha_sesion = Column(DateTime, default=datetime.utcnow, index=True)
    nombre_archivo = Column(String(255), nullable=True)

    # Estadísticas de la carga
    total_ordenes = Column(Integer, default=0)
    ordenes_nuevas = Column(Integer, default=0)
    ordenes_actualizadas = Column(Integer, default=0)
    ordenes_entregadas = Column(Integer, default=0)
    ordenes_devolucion = Column(Integer, default=0)
    ordenes_con_novedad = Column(Integer, default=0)
    ordenes_en_proceso = Column(Integer, default=0)

    # Análisis IA
    resumen_ia = Column(Text, nullable=True)
    alertas_generadas = Column(JSON, nullable=True)
    recomendaciones = Column(JSON, nullable=True)

    # Metadata
    fecha_creacion = Column(DateTime, default=datetime.utcnow)

    # Relación con órdenes
    ordenes = relationship("TrackingOrden", back_populates="sesion")

    def __repr__(self):
        return f"<SesionTrackingTransportadora(id={self.id}, nombre={self.nombre_sesion}, total={self.total_ordenes})>"


class TrackingOrden(Base):
    """
    Tabla principal de órdenes de tracking de transportadoras.
    Almacena los 13 campos requeridos + campos adicionales para análisis.
    """
    __tablename__ = 'tracking_ordenes'

    id = Column(Integer, primary_key=True, autoincrement=True)

    # 13 CAMPOS PRINCIPALES DEL EXCEL
    hora = Column(String(20), nullable=True)
    fecha = Column(DateTime, nullable=True)
    nombre_cliente = Column(String(255), nullable=True)
    telefono = Column(String(50), nullable=True, index=True)
    numero_guia = Column(String(100), nullable=False, index=True)
    estatus = Column(String(100), nullable=True, index=True)
    ciudad_destino = Column(String(100), nullable=True, index=True)
    transportadora = Column(String(100), nullable=True, index=True)
    novedad = Column(Text, nullable=True)
    ultimo_movimiento = Column(Text, nullable=True)
    fecha_ultimo_movimiento = Column(DateTime, nullable=True)
    hora_ultimo_movimiento = Column(String(20), nullable=True)
    fecha_generacion_guia = Column(DateTime, nullable=True)

    # CAMPOS CALCULADOS PARA ANÁLISIS
    dias_en_transito = Column(Integer, default=0)
    dias_sin_movimiento = Column(Integer, default=0)
    tiene_novedad = Column(Boolean, default=False)
    es_critica = Column(Boolean, default=False)  # Más de 5 días sin movimiento
    estado_anterior = Column(String(100), nullable=True)  # Para detectar cambios
    veces_con_novedad = Column(Integer, default=0)  # Novedades acumuladas históricamente

    # NIVEL DE RIESGO (calculado por IA)
    nivel_riesgo = Column(String(20), nullable=True)  # BAJO, MEDIO, ALTO, CRITICO
    probabilidad_entrega = Column(Float, nullable=True)
    probabilidad_devolucion = Column(Float, nullable=True)

    # METADATA
    sesion_id = Column(Integer, ForeignKey('sesiones_tracking_transportadora.id'), nullable=True)
    fecha_primera_carga = Column(DateTime, default=datetime.utcnow)
    fecha_ultima_actualizacion = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    total_actualizaciones = Column(Integer, default=1)

    # Relación con sesión
    sesion = relationship("SesionTrackingTransportadora", back_populates="ordenes")

    # Relación con historial
    historial = relationship("HistorialTrackingOrden", back_populates="orden", order_by="desc(HistorialTrackingOrden.fecha_registro)")

    # Índices compuestos
    __table_args__ = (
        Index('idx_tracking_guia_transportadora', 'numero_guia', 'transportadora'),
        Index('idx_tracking_estatus_ciudad', 'estatus', 'ciudad_destino'),
        Index('idx_tracking_fecha_estatus', 'fecha', 'estatus'),
        Index('idx_tracking_critica', 'es_critica', 'dias_sin_movimiento'),
    )

    def __repr__(self):
        return f"<TrackingOrden(guia={self.numero_guia}, estatus={self.estatus}, ciudad={self.ciudad_destino})>"

    def to_dict(self):
        """Convierte el modelo a diccionario para la API"""
        return {
            'id': self.id,
            'hora': self.hora,
            'fecha': self.fecha.isoformat() if self.fecha else None,
            'nombreCliente': self.nombre_cliente,
            'telefono': self.telefono,
            'numeroGuia': self.numero_guia,
            'estatus': self.estatus,
            'ciudadDestino': self.ciudad_destino,
            'transportadora': self.transportadora,
            'novedad': self.novedad,
            'ultimoMovimiento': self.ultimo_movimiento,
            'fechaUltimoMovimiento': self.fecha_ultimo_movimiento.isoformat() if self.fecha_ultimo_movimiento else None,
            'horaUltimoMovimiento': self.hora_ultimo_movimiento,
            'fechaGeneracionGuia': self.fecha_generacion_guia.isoformat() if self.fecha_generacion_guia else None,
            'diasEnTransito': self.dias_en_transito,
            'diasSinMovimiento': self.dias_sin_movimiento,
            'tieneNovedad': self.tiene_novedad,
            'esCritica': self.es_critica,
            'nivelRiesgo': self.nivel_riesgo,
            'probabilidadEntrega': self.probabilidad_entrega,
            'vecesConNovedad': self.veces_con_novedad,
            'totalActualizaciones': self.total_actualizaciones,
        }


class HistorialTrackingOrden(Base):
    """
    Historial de cambios de cada orden.
    Cada vez que se carga un Excel y la guía ya existe, se registra el estado anterior.
    Esto permite ver la evolución completa de cada guía en el tiempo.
    """
    __tablename__ = 'historial_tracking_ordenes'

    id = Column(Integer, primary_key=True, autoincrement=True)

    # Referencia a la orden
    orden_id = Column(Integer, ForeignKey('tracking_ordenes.id'), nullable=False)
    numero_guia = Column(String(100), nullable=False, index=True)

    # Estado en ese momento
    estatus = Column(String(100), nullable=True)
    novedad = Column(Text, nullable=True)
    ultimo_movimiento = Column(Text, nullable=True)
    fecha_movimiento = Column(DateTime, nullable=True)

    # Cambios detectados
    cambio_estatus = Column(Boolean, default=False)
    estatus_anterior = Column(String(100), nullable=True)
    nueva_novedad = Column(Boolean, default=False)

    # Metadata
    sesion_id = Column(Integer, ForeignKey('sesiones_tracking_transportadora.id'), nullable=True)
    fecha_registro = Column(DateTime, default=datetime.utcnow, index=True)

    # Relación con orden
    orden = relationship("TrackingOrden", back_populates="historial")

    __table_args__ = (
        Index('idx_historial_guia_fecha', 'numero_guia', 'fecha_registro'),
    )

    def __repr__(self):
        return f"<HistorialTrackingOrden(guia={self.numero_guia}, estatus={self.estatus}, fecha={self.fecha_registro})>"


class AlertaTracking(Base):
    """
    Alertas inteligentes generadas por el análisis de tracking.
    Se generan automáticamente cuando se detectan situaciones críticas.
    """
    __tablename__ = 'alertas_tracking'

    id = Column(Integer, primary_key=True, autoincrement=True)

    # Tipo y severidad
    tipo = Column(String(50), nullable=False)  # ESTANCADA, NOVEDAD_RECURRENTE, DEVOLUCION_PROBABLE, DEMORA_TRANSPORTADORA
    severidad = Column(String(20), nullable=False)  # INFO, WARNING, URGENT, CRITICAL

    # Contenido
    titulo = Column(String(200), nullable=False)
    descripcion = Column(Text, nullable=True)

    # Guías afectadas (JSON array de números de guía)
    guias_afectadas = Column(JSON, nullable=True)
    cantidad_afectadas = Column(Integer, default=0)

    # Contexto
    transportadora = Column(String(100), nullable=True)
    ciudad = Column(String(100), nullable=True)

    # Recomendación de IA
    accion_recomendada = Column(Text, nullable=True)

    # Estado
    esta_activa = Column(Boolean, default=True)
    fue_resuelta = Column(Boolean, default=False)
    fecha_resolucion = Column(DateTime, nullable=True)
    comentario_resolucion = Column(Text, nullable=True)

    # Metadata
    sesion_id = Column(Integer, ForeignKey('sesiones_tracking_transportadora.id'), nullable=True)
    fecha_creacion = Column(DateTime, default=datetime.utcnow, index=True)

    def __repr__(self):
        return f"<AlertaTracking(tipo={self.tipo}, severidad={self.severidad}, titulo={self.titulo})>"

    def to_dict(self):
        return {
            'id': self.id,
            'tipo': self.tipo,
            'severidad': self.severidad,
            'titulo': self.titulo,
            'descripcion': self.descripcion,
            'guiasAfectadas': self.guias_afectadas or [],
            'cantidadAfectadas': self.cantidad_afectadas,
            'transportadora': self.transportadora,
            'ciudad': self.ciudad,
            'accionRecomendada': self.accion_recomendada,
            'estaActiva': self.esta_activa,
            'fechaCreacion': self.fecha_creacion.isoformat() if self.fecha_creacion else None,
        }
