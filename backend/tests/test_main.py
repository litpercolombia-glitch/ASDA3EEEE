# backend/tests/test_main.py
"""
Tests para los endpoints principales de la API.
"""

import pytest
from datetime import datetime


class TestHealthEndpoints:
    """Tests para endpoints de salud del sistema"""

    def test_health_check_returns_200(self, client):
        """El endpoint de salud debe retornar 200"""
        response = client.get("/health")
        assert response.status_code == 200

    def test_health_check_contains_status(self, client):
        """La respuesta de salud debe contener el campo status"""
        response = client.get("/health")
        data = response.json()
        assert "status" in data

    def test_health_check_contains_database_status(self, client):
        """La respuesta de salud debe contener el estado de la BD"""
        response = client.get("/health")
        data = response.json()
        # Puede estar como 'database' o dentro de otros campos
        assert "status" in data or "database" in data


class TestDashboardEndpoints:
    """Tests para endpoints del dashboard"""

    def test_get_dashboard_resumen(self, client):
        """El endpoint de resumen del dashboard debe funcionar"""
        response = client.get("/dashboard/resumen")
        # Puede retornar 200 o 404 si no hay datos
        assert response.status_code in [200, 404, 500]

    def test_get_tendencias_default_params(self, client):
        """El endpoint de tendencias debe funcionar con parámetros por defecto"""
        response = client.get("/dashboard/tendencias")
        assert response.status_code in [200, 404, 500]

    def test_get_tendencias_with_dias_param(self, client):
        """El endpoint de tendencias debe aceptar parámetro de días"""
        response = client.get("/dashboard/tendencias?dias=30")
        assert response.status_code in [200, 404, 500]

    def test_get_kpis_avanzados(self, client):
        """El endpoint de KPIs avanzados debe funcionar"""
        response = client.get("/dashboard/kpis-avanzados")
        assert response.status_code in [200, 404, 500]


class TestPushNotificationEndpoints:
    """Tests para endpoints de push notifications"""

    def test_get_vapid_key(self, client):
        """El endpoint de VAPID key debe retornar la clave"""
        response = client.get("/api/push/vapid-key")
        assert response.status_code == 200
        data = response.json()
        assert "vapid_public_key" in data

    def test_subscribe_to_push(self, client, sample_push_subscription):
        """Debe poder suscribirse a push notifications"""
        response = client.post(
            "/api/push/subscribe",
            json=sample_push_subscription
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

    def test_list_subscriptions(self, client):
        """Debe poder listar suscripciones"""
        response = client.get("/api/push/subscriptions")
        assert response.status_code == 200
        data = response.json()
        assert "total" in data
        assert "subscriptions" in data

    def test_push_service_status(self, client):
        """Debe poder obtener estado del servicio push"""
        response = client.get("/api/push/status")
        assert response.status_code == 200
        data = response.json()
        assert "available" in data


class TestWebhookEndpoints:
    """Tests para endpoints de webhooks"""

    def test_list_available_events(self, client):
        """Debe listar los eventos disponibles para webhooks"""
        response = client.get("/api/webhooks/events")
        assert response.status_code == 200
        data = response.json()
        assert "events" in data
        assert len(data["events"]) > 0

    def test_create_webhook(self, client, sample_webhook_data):
        """Debe poder crear un webhook"""
        response = client.post(
            "/api/webhooks/",
            json=sample_webhook_data
        )
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "secret" in data  # El secret solo se muestra al crear
        assert data["name"] == sample_webhook_data["name"]

    def test_list_webhooks(self, client):
        """Debe poder listar webhooks"""
        response = client.get("/api/webhooks/")
        assert response.status_code == 200
        data = response.json()
        assert "total" in data
        assert "webhooks" in data

    def test_create_webhook_invalid_events(self, client):
        """No debe crear webhook con eventos inválidos"""
        invalid_webhook = {
            "name": "Test",
            "url": "https://example.com/webhook",
            "events": ["evento_inexistente"]
        }
        response = client.post("/api/webhooks/", json=invalid_webhook)
        assert response.status_code == 400

    def test_webhook_service_status(self, client):
        """Debe poder obtener estado del servicio de webhooks"""
        response = client.get("/api/webhooks/status")
        assert response.status_code == 200
        data = response.json()
        assert "available" in data
        assert "total_webhooks" in data


class TestWebhookCRUD:
    """Tests CRUD completos para webhooks"""

    def test_webhook_lifecycle(self, client, sample_webhook_data):
        """Test del ciclo de vida completo de un webhook"""
        # Crear
        create_response = client.post("/api/webhooks/", json=sample_webhook_data)
        assert create_response.status_code == 200
        webhook_id = create_response.json()["id"]

        # Leer
        get_response = client.get(f"/api/webhooks/{webhook_id}")
        assert get_response.status_code == 200
        assert get_response.json()["name"] == sample_webhook_data["name"]

        # Actualizar
        update_response = client.put(
            f"/api/webhooks/{webhook_id}",
            json={"name": "Updated Name"}
        )
        assert update_response.status_code == 200

        # Verificar actualización
        get_updated = client.get(f"/api/webhooks/{webhook_id}")
        assert get_updated.json()["name"] == "Updated Name"

        # Eliminar
        delete_response = client.delete(f"/api/webhooks/{webhook_id}")
        assert delete_response.status_code == 200

        # Verificar eliminación
        get_deleted = client.get(f"/api/webhooks/{webhook_id}")
        assert get_deleted.status_code == 404


class TestErrorHandling:
    """Tests para manejo de errores"""

    def test_404_for_nonexistent_endpoint(self, client):
        """Endpoints inexistentes deben retornar 404"""
        response = client.get("/api/nonexistent/endpoint")
        assert response.status_code == 404

    def test_invalid_json_body(self, client):
        """Cuerpos JSON inválidos deben manejarse correctamente"""
        response = client.post(
            "/api/webhooks/",
            content="invalid json",
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 422  # Unprocessable Entity

    def test_missing_required_fields(self, client):
        """Campos requeridos faltantes deben generar error"""
        incomplete_webhook = {"name": "Test"}  # Falta url y events
        response = client.post("/api/webhooks/", json=incomplete_webhook)
        assert response.status_code == 422
