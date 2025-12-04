"""
Configuración de conexión a PostgreSQL para el sistema ML de Litper Logística.
Incluye funciones para crear y gestionar sesiones de base de datos.
"""

import os
from contextlib import contextmanager
from typing import Generator, Optional
from dotenv import load_dotenv
from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool
from loguru import logger

from .models import (
    Base,
    ConfiguracionSistema,
    CONFIGURACIONES_DEFAULT
)

# Cargar variables de entorno
load_dotenv()

# ==================== CONFIGURACIÓN ====================

class DatabaseConfig:
    """Configuración de la base de datos"""

    # URL de conexión (PostgreSQL)
    DATABASE_URL: str = os.getenv(
        'DATABASE_URL',
        'postgresql://litper_user:litper_pass@localhost:5432/litper_ml_db'
    )

    # Configuración del pool de conexiones
    POOL_SIZE: int = int(os.getenv('DB_POOL_SIZE', '5'))
    MAX_OVERFLOW: int = int(os.getenv('DB_MAX_OVERFLOW', '10'))
    POOL_TIMEOUT: int = int(os.getenv('DB_POOL_TIMEOUT', '30'))
    POOL_RECYCLE: int = int(os.getenv('DB_POOL_RECYCLE', '1800'))  # 30 minutos

    # Configuración de debugging
    ECHO_SQL: bool = os.getenv('DB_ECHO_SQL', 'false').lower() == 'true'


# ==================== ENGINE Y SESSION ====================

_engine = None
_SessionLocal = None


def get_database_url() -> str:
    """
    Obtiene la URL de la base de datos desde variables de entorno.
    Maneja el formato especial de Railway/Render que usa 'postgres://' en lugar de 'postgresql://'.
    """
    url = DatabaseConfig.DATABASE_URL

    # Railway/Render usan 'postgres://' pero SQLAlchemy 1.4+ requiere 'postgresql://'
    if url.startswith('postgres://'):
        url = url.replace('postgres://', 'postgresql://', 1)

    return url


def create_engine_instance():
    """
    Crea una instancia del engine de SQLAlchemy.
    Usa singleton pattern para reutilizar la misma conexión.
    """
    global _engine

    if _engine is None:
        database_url = get_database_url()
        logger.info(f"Conectando a base de datos: {database_url.split('@')[-1]}")

        _engine = create_engine(
            database_url,
            poolclass=QueuePool,
            pool_size=DatabaseConfig.POOL_SIZE,
            max_overflow=DatabaseConfig.MAX_OVERFLOW,
            pool_timeout=DatabaseConfig.POOL_TIMEOUT,
            pool_recycle=DatabaseConfig.POOL_RECYCLE,
            pool_pre_ping=True,  # Verificar conexiones antes de usarlas
            echo=DatabaseConfig.ECHO_SQL,
        )

        # Event listener para logging de conexiones
        @event.listens_for(_engine, 'connect')
        def on_connect(dbapi_conn, connection_record):
            logger.debug("Nueva conexión establecida a la base de datos")

        @event.listens_for(_engine, 'checkout')
        def on_checkout(dbapi_conn, connection_record, connection_proxy):
            logger.debug("Conexión obtenida del pool")

        logger.success("Engine de base de datos creado exitosamente")

    return _engine


def get_session_factory():
    """
    Obtiene la fábrica de sesiones.
    """
    global _SessionLocal

    if _SessionLocal is None:
        engine = create_engine_instance()
        _SessionLocal = sessionmaker(
            autocommit=False,
            autoflush=False,
            bind=engine,
            expire_on_commit=False  # Evita recargar objetos después de commit
        )

    return _SessionLocal


def get_session() -> Generator[Session, None, None]:
    """
    Generator para obtener una sesión de base de datos.
    Uso recomendado con dependency injection de FastAPI.

    Ejemplo:
        @app.get("/items")
        def get_items(db: Session = Depends(get_session)):
            return db.query(Item).all()
    """
    SessionLocal = get_session_factory()
    session = SessionLocal()

    try:
        yield session
    finally:
        session.close()


@contextmanager
def get_db_session() -> Generator[Session, None, None]:
    """
    Context manager para obtener una sesión de base de datos.
    Maneja automáticamente el commit/rollback y cierre.

    Ejemplo:
        with get_db_session() as session:
            items = session.query(Item).all()
    """
    SessionLocal = get_session_factory()
    session = SessionLocal()

    try:
        yield session
        session.commit()
    except Exception as e:
        session.rollback()
        logger.error(f"Error en transacción de base de datos: {e}")
        raise
    finally:
        session.close()


# ==================== INICIALIZACIÓN ====================

def init_database(drop_existing: bool = False) -> bool:
    """
    Inicializa la base de datos creando todas las tablas.

    Args:
        drop_existing: Si es True, elimina todas las tablas existentes primero.

    Returns:
        bool: True si la inicialización fue exitosa.
    """
    try:
        engine = create_engine_instance()

        if drop_existing:
            logger.warning("Eliminando todas las tablas existentes...")
            Base.metadata.drop_all(bind=engine)

        logger.info("Creando tablas de base de datos...")
        Base.metadata.create_all(bind=engine)

        logger.success("Base de datos inicializada correctamente")
        return True

    except Exception as e:
        logger.error(f"Error al inicializar base de datos: {e}")
        return False


def crear_configuraciones_default() -> bool:
    """
    Crea las configuraciones por defecto en la base de datos.
    Solo inserta las que no existen.

    Returns:
        bool: True si fue exitoso.
    """
    try:
        with get_db_session() as session:
            for config in CONFIGURACIONES_DEFAULT:
                existente = session.query(ConfiguracionSistema).filter_by(
                    clave=config['clave']
                ).first()

                if not existente:
                    nueva_config = ConfiguracionSistema(**config)
                    session.add(nueva_config)
                    logger.debug(f"Configuración creada: {config['clave']}")

            session.commit()
            logger.success("Configuraciones por defecto creadas")
            return True

    except Exception as e:
        logger.error(f"Error al crear configuraciones default: {e}")
        return False


def verificar_conexion() -> bool:
    """
    Verifica que la conexión a la base de datos funcione correctamente.

    Returns:
        bool: True si la conexión es exitosa.
    """
    try:
        engine = create_engine_instance()
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            result.fetchone()

        logger.success("Conexión a base de datos verificada")
        return True

    except Exception as e:
        logger.error(f"Error de conexión a base de datos: {e}")
        return False


# ==================== UTILIDADES ====================

def get_config(clave: str, default: Optional[str] = None) -> Optional[str]:
    """
    Obtiene un valor de configuración de la base de datos.

    Args:
        clave: La clave de la configuración.
        default: Valor por defecto si no existe.

    Returns:
        El valor de la configuración o el default.
    """
    try:
        with get_db_session() as session:
            config = session.query(ConfiguracionSistema).filter_by(
                clave=clave
            ).first()

            if config:
                return config.valor
            return default

    except Exception as e:
        logger.error(f"Error al obtener configuración {clave}: {e}")
        return default


def set_config(clave: str, valor: str, descripcion: Optional[str] = None) -> bool:
    """
    Establece un valor de configuración en la base de datos.

    Args:
        clave: La clave de la configuración.
        valor: El nuevo valor.
        descripcion: Descripción opcional.

    Returns:
        bool: True si fue exitoso.
    """
    try:
        with get_db_session() as session:
            config = session.query(ConfiguracionSistema).filter_by(
                clave=clave
            ).first()

            if config:
                config.valor = valor
                if descripcion:
                    config.descripcion = descripcion
            else:
                config = ConfiguracionSistema(
                    clave=clave,
                    valor=valor,
                    descripcion=descripcion
                )
                session.add(config)

            session.commit()
            logger.info(f"Configuración {clave} actualizada a {valor}")
            return True

    except Exception as e:
        logger.error(f"Error al establecer configuración {clave}: {e}")
        return False


def get_all_configs() -> dict:
    """
    Obtiene todas las configuraciones como diccionario.

    Returns:
        dict: Diccionario con todas las configuraciones.
    """
    try:
        with get_db_session() as session:
            configs = session.query(ConfiguracionSistema).all()
            return {c.clave: c.valor for c in configs}

    except Exception as e:
        logger.error(f"Error al obtener configuraciones: {e}")
        return {}


def get_db_stats() -> dict:
    """
    Obtiene estadísticas de la base de datos.

    Returns:
        dict: Estadísticas de tablas y registros.
    """
    try:
        from .models import (
            GuiaHistorica, ArchivoCargado, MetricaModelo,
            ConversacionChat, PrediccionTiempoReal, AlertaSistema
        )

        with get_db_session() as session:
            stats = {
                'guias_historicas': session.query(GuiaHistorica).count(),
                'archivos_cargados': session.query(ArchivoCargado).count(),
                'metricas_modelos': session.query(MetricaModelo).count(),
                'conversaciones_chat': session.query(ConversacionChat).count(),
                'predicciones': session.query(PrediccionTiempoReal).count(),
                'alertas_activas': session.query(AlertaSistema).filter_by(
                    esta_activa=True
                ).count(),
            }

            return stats

    except Exception as e:
        logger.error(f"Error al obtener estadísticas: {e}")
        return {}


# ==================== MIGRACIONES SIMPLES ====================

def ejecutar_migracion_inicial() -> bool:
    """
    Ejecuta la migración inicial: crea tablas y configuraciones.

    Returns:
        bool: True si fue exitoso.
    """
    logger.info("Iniciando migración inicial...")

    # Verificar conexión
    if not verificar_conexion():
        logger.error("No se puede conectar a la base de datos")
        return False

    # Crear tablas
    if not init_database():
        logger.error("Error al crear tablas")
        return False

    # Crear configuraciones por defecto
    if not crear_configuraciones_default():
        logger.error("Error al crear configuraciones")
        return False

    logger.success("Migración inicial completada exitosamente")
    return True


# ==================== PUNTO DE ENTRADA ====================

if __name__ == '__main__':
    """
    Script para inicializar la base de datos desde línea de comandos.
    Uso: python -m backend.database.config
    """
    import sys

    logger.add(
        sys.stderr,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>"
    )

    print("=" * 50)
    print("INICIALIZACIÓN DE BASE DE DATOS - LITPER ML")
    print("=" * 50)

    if ejecutar_migracion_inicial():
        print("\n[OK] Base de datos lista para usar")
        stats = get_db_stats()
        print("\nEstadísticas actuales:")
        for tabla, count in stats.items():
            print(f"  - {tabla}: {count} registros")
    else:
        print("\n[ERROR] No se pudo inicializar la base de datos")
        sys.exit(1)
