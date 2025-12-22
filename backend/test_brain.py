#!/usr/bin/env python3
"""
Script de prueba para el Cerebro Autónomo de Litper Pro.
Ejecuta pruebas básicas para verificar que el sistema funciona.

Uso:
    python test_brain.py

Requisitos:
    - Variable de entorno ANTHROPIC_API_KEY configurada
    - pip install anthropic
"""

import asyncio
import os
import sys
from datetime import datetime

# Agregar el directorio actual al path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()
load_dotenv('.env.backend')


def print_header(title: str):
    """Imprime un header formateado."""
    print("\n" + "=" * 60)
    print(f"  {title}")
    print("=" * 60)


def print_result(name: str, success: bool, message: str = ""):
    """Imprime el resultado de una prueba."""
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"\n{status} - {name}")
    if message:
        print(f"   {message}")


async def test_api_key():
    """Verifica que la API key esté configurada."""
    api_key = os.getenv("ANTHROPIC_API_KEY")

    if not api_key:
        print_result(
            "API Key",
            False,
            "ANTHROPIC_API_KEY no está configurada. Agrégala a tu archivo .env.backend"
        )
        return False

    if not api_key.startswith("sk-ant-"):
        print_result(
            "API Key",
            False,
            "La API key no tiene el formato correcto (debe empezar con sk-ant-)"
        )
        return False

    print_result(
        "API Key",
        True,
        f"Configurada correctamente ({api_key[:15]}...)"
    )
    return True


async def test_client_connection():
    """Prueba la conexión con Claude API."""
    try:
        from brain.claude.client import ClaudeBrainClient, ClaudeConfig

        config = ClaudeConfig()
        client = ClaudeBrainClient(config)

        health = await client.health_check()

        if health["status"] == "healthy":
            print_result(
                "Conexión Claude API",
                True,
                f"Modelo: {health.get('model', 'N/A')}"
            )
            return client
        else:
            print_result(
                "Conexión Claude API",
                False,
                f"Error: {health.get('error', 'Unknown')}"
            )
            return None

    except Exception as e:
        print_result("Conexión Claude API", False, str(e))
        return None


async def test_simple_question(client):
    """Prueba una pregunta simple al cerebro."""
    try:
        from brain.claude.client import ClaudeModel

        response = await client.think(
            context="¿Cuál es la capital de Colombia? Responde en una línea.",
            role='brain',
            model=ClaudeModel.HAIKU
        )

        if response.get('success') or response.get('response'):
            print_result(
                "Pregunta Simple",
                True,
                f"Respuesta: {response.get('response', str(response))[:100]}..."
            )
            return True
        else:
            print_result(
                "Pregunta Simple",
                False,
                f"Error: {response.get('error', 'Sin respuesta')}"
            )
            return False

    except Exception as e:
        print_result("Pregunta Simple", False, str(e))
        return False


async def test_decision_making(client):
    """Prueba la toma de decisiones."""
    try:
        response = await client.decide(
            situation="Un envío a Pasto lleva 5 días sin movimiento. El cliente ha llamado 2 veces.",
            options=["Contactar transportadora", "Notificar cliente", "Escalar a supervisor"],
            urgency="high"
        )

        if response.get('success') or response.get('decision'):
            print_result(
                "Toma de Decisiones",
                True,
                f"Decisión: {response.get('decision', str(response))[:80]}..."
            )
            return True
        else:
            print_result(
                "Toma de Decisiones",
                False,
                f"Error: {response.get('error', 'Sin decisión')}"
            )
            return False

    except Exception as e:
        print_result("Toma de Decisiones", False, str(e))
        return False


async def test_message_generation(client):
    """Prueba la generación de mensajes."""
    try:
        message = await client.generate_message(
            customer_name="María García",
            situation="Tu pedido #12345 tuvo un pequeño retraso pero ya está en camino",
            tone="friendly",
            channel="whatsapp"
        )

        if message and len(message) > 10:
            print_result(
                "Generación de Mensajes",
                True,
                f"Mensaje: {message[:100]}..."
            )
            return True
        else:
            print_result(
                "Generación de Mensajes",
                False,
                "Mensaje vacío o muy corto"
            )
            return False

    except Exception as e:
        print_result("Generación de Mensajes", False, str(e))
        return False


async def test_brain_engine():
    """Prueba el motor del cerebro completo."""
    try:
        from brain import ClaudeAutonomousBrain

        brain = ClaudeAutonomousBrain()

        # Enviar un evento
        event_id = await brain.submit_event(
            event_type="test_event",
            data={"test": True, "message": "Evento de prueba"},
            priority="low"
        )

        print_result(
            "Motor del Cerebro",
            True,
            f"Evento creado: {event_id}"
        )

        # Obtener estado
        status = brain.get_status()
        print(f"   Estado: {status['state']}")
        print(f"   Cola: {status['queue_size']} eventos")

        return True

    except Exception as e:
        print_result("Motor del Cerebro", False, str(e))
        return False


async def test_memory_system():
    """Prueba el sistema de memoria."""
    try:
        from brain.core.memory_system import BrainMemory

        memory = BrainMemory()

        # Almacenar algo
        class MockEvent:
            type = "test"
            data = {"test": True}
            priority = "normal"

        await memory.store_event(
            MockEvent(),
            {"decision": "test"},
            [{"success": True}]
        )

        stats = memory.get_stats()

        print_result(
            "Sistema de Memoria",
            True,
            f"Entradas: {stats['total_stored']}, Cache: {stats['cache_size']}"
        )
        return True

    except Exception as e:
        print_result("Sistema de Memoria", False, str(e))
        return False


async def test_action_executor():
    """Prueba el ejecutor de acciones."""
    try:
        from brain.core.action_executor import ActionExecutor

        executor = ActionExecutor()

        # Ejecutar una acción de prueba
        result = await executor.execute(
            tool_name="create_alert",
            params={
                "type": "info",
                "title": "Prueba de sistema",
                "priority": 1
            }
        )

        if result.success:
            print_result(
                "Ejecutor de Acciones",
                True,
                f"Handlers registrados: {len(executor.handlers)}"
            )
            return True
        else:
            print_result(
                "Ejecutor de Acciones",
                False,
                result.error
            )
            return False

    except Exception as e:
        print_result("Ejecutor de Acciones", False, str(e))
        return False


async def run_all_tests():
    """Ejecuta todas las pruebas."""
    print_header("🧠 PRUEBAS DEL CEREBRO AUTÓNOMO - LITPER PRO")
    print(f"Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    results = {
        'passed': 0,
        'failed': 0,
        'total': 0
    }

    # Test 1: API Key
    print_header("1. Verificación de Configuración")
    if await test_api_key():
        results['passed'] += 1
    else:
        results['failed'] += 1
        print("\n⚠️  Sin API Key, no se pueden ejecutar más pruebas.")
        print("   Configura ANTHROPIC_API_KEY en .env.backend")
        return results
    results['total'] += 1

    # Test 2: Conexión
    print_header("2. Conexión a Claude API")
    client = await test_client_connection()
    if client:
        results['passed'] += 1
    else:
        results['failed'] += 1
        print("\n⚠️  Sin conexión, no se pueden ejecutar más pruebas.")
        return results
    results['total'] += 1

    # Test 3: Pregunta simple
    print_header("3. Pregunta Simple")
    if await test_simple_question(client):
        results['passed'] += 1
    else:
        results['failed'] += 1
    results['total'] += 1

    # Test 4: Toma de decisiones
    print_header("4. Toma de Decisiones")
    if await test_decision_making(client):
        results['passed'] += 1
    else:
        results['failed'] += 1
    results['total'] += 1

    # Test 5: Generación de mensajes
    print_header("5. Generación de Mensajes")
    if await test_message_generation(client):
        results['passed'] += 1
    else:
        results['failed'] += 1
    results['total'] += 1

    # Test 6: Motor del cerebro
    print_header("6. Motor del Cerebro")
    if await test_brain_engine():
        results['passed'] += 1
    else:
        results['failed'] += 1
    results['total'] += 1

    # Test 7: Sistema de memoria
    print_header("7. Sistema de Memoria")
    if await test_memory_system():
        results['passed'] += 1
    else:
        results['failed'] += 1
    results['total'] += 1

    # Test 8: Ejecutor de acciones
    print_header("8. Ejecutor de Acciones")
    if await test_action_executor():
        results['passed'] += 1
    else:
        results['failed'] += 1
    results['total'] += 1

    # Resumen
    print_header("📊 RESUMEN DE PRUEBAS")
    print(f"\n  ✅ Pasadas:  {results['passed']}/{results['total']}")
    print(f"  ❌ Fallidas: {results['failed']}/{results['total']}")

    success_rate = (results['passed'] / results['total']) * 100 if results['total'] > 0 else 0
    print(f"\n  Tasa de éxito: {success_rate:.1f}%")

    if results['failed'] == 0:
        print("\n🎉 ¡Todas las pruebas pasaron! El cerebro está listo.")
    else:
        print("\n⚠️  Algunas pruebas fallaron. Revisa los errores arriba.")

    return results


if __name__ == "__main__":
    print("\n" + "🧠" * 30)
    asyncio.run(run_all_tests())
    print("\n" + "🧠" * 30 + "\n")
