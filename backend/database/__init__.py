"""
Módulo de base de datos para el sistema ML de Litper Logística.
Exporta modelos, configuración y utilidades de base de datos.
"""

from .models import (
    Base,
    GuiaHistorica,
    ArchivoCargado,
    MetricaModelo,
    ConversacionChat,
    PrediccionTiempoReal,
    ConfiguracionSistema,
    AlertaSistema,
    WorkflowAutomatizado,
    ReporteGenerado,
    NotificacionUsuario,
    EstadoArchivo,
    NivelRiesgo,
    SeveridadAlerta,
    TipoAlerta,
    CONFIGURACIONES_DEFAULT,
)

from .config import (
    get_session,
    get_db_session,
    init_database,
    crear_configuraciones_default,
    verificar_conexion,
    get_config,
    set_config,
    get_all_configs,
    get_db_stats,
    ejecutar_migracion_inicial,
    create_engine_instance,
    get_session_factory,
)

__all__ = [
    # Modelos
    'Base',
    'GuiaHistorica',
    'ArchivoCargado',
    'MetricaModelo',
    'ConversacionChat',
    'PrediccionTiempoReal',
    'ConfiguracionSistema',
    'AlertaSistema',
    'WorkflowAutomatizado',
    'ReporteGenerado',
    'NotificacionUsuario',
    # Enums
    'EstadoArchivo',
    'NivelRiesgo',
    'SeveridadAlerta',
    'TipoAlerta',
    # Configuraciones
    'CONFIGURACIONES_DEFAULT',
    # Funciones de sesión
    'get_session',
    'get_db_session',
    'create_engine_instance',
    'get_session_factory',
    # Funciones de inicialización
    'init_database',
    'crear_configuraciones_default',
    'verificar_conexion',
    'ejecutar_migracion_inicial',
    # Funciones de configuración
    'get_config',
    'set_config',
    'get_all_configs',
    'get_db_stats',
]
