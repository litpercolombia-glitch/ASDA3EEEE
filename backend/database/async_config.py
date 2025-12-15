"""
Configuración ASYNC de PostgreSQL para FastAPI con SQLAlchemy + asyncpg.
Optimizado para alto rendimiento y conexiones concurrentes.
"""
import os
from typing import AsyncGenerator
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import NullPool
from sqlalchemy import text
from loguru import logger

load_dotenv()

# ===== CONFIGURACIÓN =====
class AsyncDBConfig:
    # Construir URL async desde variables de entorno
    USER = os.getenv('POSTGRES_USER', 'litper')
    PASSWORD = os.getenv('POSTGRES_PASSWORD', 'LitperDB2024Seguro')
    HOST = os.getenv('POSTGRES_HOST', '72.614.84')
    PORT = os.getenv('POSTGRES_PORT', '5432')
    DB = os.getenv('POSTGRES_DB', 'litper_logistica')

    # URL para asyncpg (usa postgresql+asyncpg://)
    DATABASE_URL = os.getenv(
        'DATABASE_URL_ASYNC',
        f'postgresql+asyncpg://{USER}:{PASSWORD}@{HOST}:{PORT}/{DB}'
    )

    # Pool config
    POOL_SIZE = int(os.getenv('DB_POOL_SIZE', '5'))
    MAX_OVERFLOW = int(os.getenv('DB_MAX_OVERFLOW', '10'))
    ECHO = os.getenv('DB_ECHO_SQL', 'false').lower() == 'true'

# ===== ENGINE ASYNC =====
_async_engine = None

def get_async_engine():
    """Crea engine async singleton."""
    global _async_engine
    if _async_engine is None:
        url = AsyncDBConfig.DATABASE_URL
        # Convertir postgres:// a postgresql+asyncpg://
        if url.startswith('postgres://'):
            url = url.replace('postgres://', 'postgresql+asyncpg://', 1)
        elif url.startswith('postgresql://') and '+asyncpg' not in url:
            url = url.replace('postgresql://', 'postgresql+asyncpg://', 1)

        logger.info(f"Conectando async a: {url.split('@')[-1]}")
        _async_engine = create_async_engine(
            url,
            pool_size=AsyncDBConfig.POOL_SIZE,
            max_overflow=AsyncDBConfig.MAX_OVERFLOW,
            pool_pre_ping=True,
            echo=AsyncDBConfig.ECHO,
        )
    return _async_engine

# ===== SESSION ASYNC =====
def get_async_session_factory():
    """Factory de sesiones async."""
    return async_sessionmaker(
        bind=get_async_engine(),
        class_=AsyncSession,
        expire_on_commit=False,
        autocommit=False,
        autoflush=False,
    )

async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency para FastAPI.

    Uso:
        @app.get("/items")
        async def get_items(db: AsyncSession = Depends(get_async_session)):
            result = await db.execute(select(Item))
            return result.scalars().all()
    """
    factory = get_async_session_factory()
    async with factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

@asynccontextmanager
async def get_db_async():
    """
    Context manager async.

    Uso:
        async with get_db_async() as db:
            result = await db.execute(select(Item))
    """
    factory = get_async_session_factory()
    session = factory()
    try:
        yield session
        await session.commit()
    except Exception:
        await session.rollback()
        raise
    finally:
        await session.close()

# ===== VERIFICACIÓN =====
async def verificar_conexion_async() -> dict:
    """Verifica conexión y retorna info del servidor."""
    try:
        engine = get_async_engine()
        async with engine.connect() as conn:
            # Test básico
            result = await conn.execute(text("SELECT 1"))
            await result.fetchone()

            # Info del servidor
            version = await conn.execute(text("SELECT version()"))
            db_version = (await version.fetchone())[0]

            now = await conn.execute(text("SELECT NOW()"))
            server_time = (await now.fetchone())[0]

        logger.success("✅ Conexión async verificada")
        return {
            "status": "connected",
            "database": AsyncDBConfig.DB,
            "host": AsyncDBConfig.HOST,
            "version": db_version.split(',')[0] if db_version else "unknown",
            "server_time": str(server_time),
        }
    except Exception as e:
        logger.error(f"❌ Error de conexión: {e}")
        return {"status": "error", "message": str(e)}

# ===== INIT =====
async def init_async_db():
    """Inicializa tablas (usa con Base.metadata)."""
    from .models import Base
    engine = get_async_engine()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.success("Tablas creadas/verificadas")

async def close_async_db():
    """Cierra el engine al apagar la app."""
    global _async_engine
    if _async_engine:
        await _async_engine.dispose()
        _async_engine = None
        logger.info("Engine async cerrado")
