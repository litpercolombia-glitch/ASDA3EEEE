# backend/tests/conftest.py
"""
Configuración y fixtures de pytest para el backend de Litper Pro.
"""

import os
import sys
import pytest
from typing import Generator
from datetime import datetime

# Agregar el directorio backend al path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Intentar importar FastAPI test client
try:
    from fastapi.testclient import TestClient
    FASTAPI_AVAILABLE = True
except ImportError:
    FASTAPI_AVAILABLE = False

# Intentar importar SQLAlchemy para tests con BD
try:
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from sqlalchemy.pool import StaticPool
    SQLALCHEMY_AVAILABLE = True
except ImportError:
    SQLALCHEMY_AVAILABLE = False


# ==================== FIXTURES DE BASE DE DATOS ====================

@pytest.fixture(scope="session")
def test_database_url() -> str:
    """URL de la base de datos de test (SQLite en memoria)"""
    return "sqlite:///:memory:"


@pytest.fixture(scope="function")
def db_engine(test_database_url: str):
    """Engine de SQLAlchemy para tests"""
    if not SQLALCHEMY_AVAILABLE:
        pytest.skip("SQLAlchemy no disponible")

    engine = create_engine(
        test_database_url,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool
    )
    yield engine
    engine.dispose()


@pytest.fixture(scope="function")
def db_session(db_engine):
    """Sesión de base de datos para cada test"""
    if not SQLALCHEMY_AVAILABLE:
        pytest.skip("SQLAlchemy no disponible")

    # Importar modelos y crear tablas
    try:
        from database.models import Base
        Base.metadata.create_all(bind=db_engine)
    except ImportError:
        pass

    TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=db_engine)
    session = TestSessionLocal()

    try:
        yield session
    finally:
        session.close()
        # Limpiar tablas después de cada test
        try:
            from database.models import Base
            Base.metadata.drop_all(bind=db_engine)
        except ImportError:
            pass


# ==================== FIXTURES DE FASTAPI ====================

@pytest.fixture(scope="function")
def client(db_session) -> Generator:
    """Test client de FastAPI con dependencias mockeadas"""
    if not FASTAPI_AVAILABLE:
        pytest.skip("FastAPI no disponible")

    try:
        from main import app
        from database import get_session

        # Override de la dependencia de sesión
        def override_get_session():
            try:
                yield db_session
            finally:
                pass

        app.dependency_overrides[get_session] = override_get_session

        with TestClient(app) as test_client:
            yield test_client

        # Limpiar overrides
        app.dependency_overrides.clear()

    except ImportError as e:
        pytest.skip(f"No se pudo importar la app: {e}")


# ==================== FIXTURES DE DATOS DE PRUEBA ====================

@pytest.fixture
def sample_guia_data() -> dict:
    """Datos de ejemplo para una guía"""
    return {
        "numero_guia": "TEST123456789",
        "transportadora": "Coordinadora",
        "ciudad_destino": "Bogota",
        "departamento_destino": "Cundinamarca",
        "nombre_cliente": "Cliente Test",
        "telefono": "3001234567",
        "estatus": "EN TRANSITO",
        "fecha_generacion_guia": datetime.now().isoformat(),
        "tiene_novedad": False,
        "tiene_retraso": False,
        "valor_facturado": 50000.0
    }


@pytest.fixture
def sample_tracking_numbers() -> list:
    """Lista de números de guía para tests"""
    return [
        "COORD123456789012",
        "TCC9876543210",
        "SERVI123456789",
        "ENVIA987654321",
        "INTER123456789012"
    ]


@pytest.fixture
def sample_carrier_data() -> dict:
    """Datos de transportadoras para tests"""
    return {
        "coordinadora": {
            "name": "Coordinadora",
            "prefix": "COORD",
            "tracking_url": "https://www.coordinadora.com/rastreo/"
        },
        "tcc": {
            "name": "TCC",
            "prefix": "TCC",
            "tracking_url": "https://www.tcc.com.co/rastreo/"
        },
        "servientrega": {
            "name": "Servientrega",
            "prefix": "SERVI",
            "tracking_url": "https://www.servientrega.com/"
        }
    }


@pytest.fixture
def sample_webhook_data() -> dict:
    """Datos de ejemplo para un webhook"""
    return {
        "name": "Test Webhook",
        "url": "https://example.com/webhook",
        "events": ["shipment.delivered", "shipment.delayed"],
        "description": "Webhook de prueba"
    }


@pytest.fixture
def sample_push_subscription() -> dict:
    """Datos de ejemplo para una suscripción push"""
    return {
        "endpoint": "https://fcm.googleapis.com/fcm/send/test-endpoint-123",
        "keys": {
            "p256dh": "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM",
            "auth": "tBHItJI5svbpez7KI4CCXg"
        },
        "device_type": "web"
    }


# ==================== FIXTURES DE MOCKS ====================

@pytest.fixture
def mock_api_response() -> dict:
    """Respuesta mock de API externa"""
    return {
        "status": "success",
        "data": {
            "tracking_number": "TEST123456789",
            "status": "IN_TRANSIT",
            "last_update": datetime.now().isoformat(),
            "events": [
                {
                    "date": datetime.now().isoformat(),
                    "description": "Paquete en camino",
                    "location": "Bogota"
                }
            ]
        }
    }


# ==================== MARKERS PERSONALIZADOS ====================

def pytest_configure(config):
    """Configurar markers personalizados"""
    config.addinivalue_line(
        "markers", "slow: marca tests que tardan mucho"
    )
    config.addinivalue_line(
        "markers", "integration: marca tests de integración"
    )
    config.addinivalue_line(
        "markers", "unit: marca tests unitarios"
    )


# ==================== HOOKS DE PYTEST ====================

def pytest_collection_modifyitems(config, items):
    """Modificar la colección de tests"""
    # Agregar marker 'unit' a tests que no tienen markers
    for item in items:
        if not any(marker.name in ['slow', 'integration'] for marker in item.iter_markers()):
            item.add_marker(pytest.mark.unit)
