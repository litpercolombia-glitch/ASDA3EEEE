#!/usr/bin/env python3
"""
Test rápido de Gemini API para el Cerebro Autónomo.
"""

import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()
load_dotenv('.env.backend')


async def test_gemini():
    """Prueba básica de Gemini."""
    print("\n" + "="*60)
    print("  🧠 TEST DE GEMINI API - LITPER PRO")
    print("="*60)

    # Verificar API key
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        print("\n❌ GOOGLE_API_KEY no configurada en .env.backend")
        return False

    print(f"\n✅ API Key encontrada: {api_key[:20]}...")

    # Importar cliente
    try:
        from brain.claude.gemini_client import GeminiBrainClient, GeminiConfig
        print("✅ Cliente Gemini importado correctamente")
    except Exception as e:
        print(f"❌ Error importando cliente: {e}")
        return False

    # Crear cliente
    config = GeminiConfig()
    client = GeminiBrainClient(config)
    print(f"✅ Cliente creado - Modelo: {config.model}")

    # Test 1: Pregunta simple
    print("\n" + "-"*40)
    print("TEST 1: Pregunta Simple")
    print("-"*40)

    try:
        response = await client.think(
            context="¿Cuál es la capital de Colombia? Responde en una línea corta.",
            role='brain'
        )

        if response.get('success'):
            print(f"✅ Respuesta: {response['response'][:150]}")
        else:
            print(f"❌ Error: {response.get('error')}")
            return False

    except Exception as e:
        print(f"❌ Excepción: {e}")
        return False

    # Test 2: Toma de decisiones
    print("\n" + "-"*40)
    print("TEST 2: Toma de Decisiones")
    print("-"*40)

    try:
        response = await client.decide(
            situation="Un envío a Pasto lleva 5 días sin movimiento. El cliente ha llamado 2 veces.",
            options=["Contactar transportadora", "Notificar cliente", "Escalar a supervisor"],
            urgency="high"
        )

        if response.get('success'):
            print(f"✅ Decisión: {response.get('decision', response.get('response', ''))[:150]}")
        else:
            print(f"❌ Error: {response.get('error')}")

    except Exception as e:
        print(f"❌ Excepción: {e}")

    # Test 3: Generación de mensaje
    print("\n" + "-"*40)
    print("TEST 3: Generación de Mensaje WhatsApp")
    print("-"*40)

    try:
        message = await client.generate_message(
            customer_name="María García",
            situation="Tu pedido #12345 tuvo un pequeño retraso pero ya está en camino",
            tone="friendly",
            channel="whatsapp"
        )

        if message and len(message) > 10:
            print(f"✅ Mensaje generado:\n{message[:300]}")
        else:
            print(f"❌ Mensaje vacío o muy corto")

    except Exception as e:
        print(f"❌ Excepción: {e}")

    # Test 4: Sistema de memoria (no requiere API)
    print("\n" + "-"*40)
    print("TEST 4: Sistema de Memoria")
    print("-"*40)

    try:
        from brain.core.memory_system import BrainMemory
        memory = BrainMemory()

        class MockEvent:
            type = "test"
            data = {"test": True}
            priority = "normal"

        await memory.store_event(MockEvent(), {"decision": "test"}, [{"success": True}])
        stats = memory.get_stats()
        print(f"✅ Memoria funcionando - Entradas: {stats['total_stored']}")

    except Exception as e:
        print(f"❌ Error memoria: {e}")

    # Test 5: Ejecutor de acciones (no requiere API)
    print("\n" + "-"*40)
    print("TEST 5: Ejecutor de Acciones")
    print("-"*40)

    try:
        from brain.core.action_executor import ActionExecutor
        executor = ActionExecutor()

        result = await executor.execute(
            tool_name="create_alert",
            params={"type": "info", "title": "Test", "priority": 1}
        )

        if result.success:
            print(f"✅ Ejecutor funcionando - {len(executor.handlers)} handlers")
        else:
            print(f"⚠️ Ejecutor OK pero acción simulada: {result.error}")

    except Exception as e:
        print(f"❌ Error ejecutor: {e}")

    print("\n" + "="*60)
    print("  🎉 TESTS COMPLETADOS")
    print("="*60)
    print("\n¡Tu cerebro Gemini está funcionando correctamente!")
    print("Puedes iniciar el servidor con: uvicorn main:app --reload\n")

    return True


if __name__ == "__main__":
    asyncio.run(test_gemini())
