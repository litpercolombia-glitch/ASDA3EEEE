#!/usr/bin/env python3
"""
Test unificado para todos los proveedores de IA del Cerebro Autonomo.
Prueba: Gemini, Claude y OpenAI
"""

import asyncio
import os
import sys
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()
load_dotenv('.env.backend')


def print_header(title: str):
    print("\n" + "=" * 60)
    print(f"  {title}")
    print("=" * 60)


def print_provider_status(name: str, available: bool, key_prefix: str = ""):
    status = "CONFIGURADO" if available else "NO CONFIGURADO"
    icon = "✅" if available else "⬚"
    print(f"  {icon} {name}: {status}")
    if available and key_prefix:
        print(f"     Key: {key_prefix}...")


async def test_provider(name: str, client, test_num: int):
    """Prueba un proveedor especifico."""
    print(f"\n{'─' * 40}")
    print(f"  TEST {test_num}: {name.upper()}")
    print(f"{'─' * 40}")

    results = {"name": name, "tests": []}

    # Test 1: Think
    print(f"\n  1. Pregunta simple...")
    try:
        start = datetime.now()
        response = await client.think(
            context="Cual es la capital de Colombia? Responde solo la ciudad.",
            role='brain'
        )
        elapsed = (datetime.now() - start).total_seconds() * 1000

        if response.get('success'):
            print(f"     ✅ OK ({elapsed:.0f}ms)")
            print(f"     R: {response.get('response', '')[:80]}")
            results["tests"].append({"name": "think", "passed": True})
        else:
            print(f"     ❌ Error: {response.get('error', 'Unknown')}")
            results["tests"].append({"name": "think", "passed": False})
    except Exception as e:
        print(f"     ❌ Exception: {e}")
        results["tests"].append({"name": "think", "passed": False})

    # Test 2: Decide
    print(f"\n  2. Toma de decisiones...")
    try:
        start = datetime.now()
        response = await client.decide(
            situation="Un envio lleva 5 dias sin movimiento",
            options=["Contactar cliente", "Escalar", "Esperar"],
            urgency="high"
        )
        elapsed = (datetime.now() - start).total_seconds() * 1000

        if response.get('success'):
            decision = response.get('decision', response.get('response', ''))
            print(f"     ✅ OK ({elapsed:.0f}ms)")
            print(f"     R: {decision[:80]}...")
            results["tests"].append({"name": "decide", "passed": True})
        else:
            print(f"     ❌ Error: {response.get('error', 'Unknown')}")
            results["tests"].append({"name": "decide", "passed": False})
    except Exception as e:
        print(f"     ❌ Exception: {e}")
        results["tests"].append({"name": "decide", "passed": False})

    # Test 3: Generate Message
    print(f"\n  3. Generacion de mensaje...")
    try:
        start = datetime.now()
        message = await client.generate_message(
            customer_name="Maria",
            situation="Tu pedido esta en camino",
            tone="friendly",
            channel="whatsapp"
        )
        elapsed = (datetime.now() - start).total_seconds() * 1000

        if message and len(message) > 10:
            print(f"     ✅ OK ({elapsed:.0f}ms)")
            print(f"     R: {message[:80]}...")
            results["tests"].append({"name": "message", "passed": True})
        else:
            print(f"     ❌ Mensaje vacio")
            results["tests"].append({"name": "message", "passed": False})
    except Exception as e:
        print(f"     ❌ Exception: {e}")
        results["tests"].append({"name": "message", "passed": False})

    return results


async def main():
    print_header("🧠 TEST DE PROVEEDORES DE IA - LITPER PRO")
    print(f"Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    # Verificar API keys
    print_header("1. VERIFICACION DE API KEYS")

    providers_config = {
        "gemini": {
            "key_var": "GOOGLE_API_KEY",
            "available": bool(os.getenv("GOOGLE_API_KEY")),
            "client_class": None
        },
        "claude": {
            "key_var": "ANTHROPIC_API_KEY",
            "available": bool(os.getenv("ANTHROPIC_API_KEY")),
            "client_class": None
        },
        "openai": {
            "key_var": "OPENAI_API_KEY",
            "available": bool(os.getenv("OPENAI_API_KEY")),
            "client_class": None
        }
    }

    # Mostrar estado
    for name, config in providers_config.items():
        key = os.getenv(config["key_var"], "")
        print_provider_status(name.upper(), config["available"], key[:20] if key else "")

    # Importar clientes disponibles
    available_count = 0

    if providers_config["gemini"]["available"]:
        try:
            from brain.claude.gemini_client import GeminiBrainClient, GeminiConfig
            providers_config["gemini"]["client_class"] = (GeminiBrainClient, GeminiConfig)
            available_count += 1
        except ImportError as e:
            print(f"  ⚠️ Error importando Gemini: {e}")

    if providers_config["claude"]["available"]:
        try:
            from brain.claude.client import ClaudeBrainClient, ClaudeConfig
            providers_config["claude"]["client_class"] = (ClaudeBrainClient, ClaudeConfig)
            available_count += 1
        except ImportError as e:
            print(f"  ⚠️ Error importando Claude: {e}")

    if providers_config["openai"]["available"]:
        try:
            from brain.claude.openai_client import OpenAIBrainClient, OpenAIConfig
            providers_config["openai"]["client_class"] = (OpenAIBrainClient, OpenAIConfig)
            available_count += 1
        except ImportError as e:
            print(f"  ⚠️ Error importando OpenAI: {e}")

    if available_count == 0:
        print("\n❌ No hay ninguna API key configurada!")
        print("\nConfigura al menos una en backend/.env.backend:")
        print("  GOOGLE_API_KEY=...     (Gemini - GRATIS)")
        print("  ANTHROPIC_API_KEY=...  (Claude)")
        print("  OPENAI_API_KEY=...     (OpenAI)")
        return

    print(f"\n  📊 Proveedores disponibles: {available_count}/3")

    # Ejecutar tests
    print_header("2. EJECUTANDO TESTS")

    all_results = []
    test_num = 1

    for name, config in providers_config.items():
        if not config["available"] or not config["client_class"]:
            continue

        ClientClass, ConfigClass = config["client_class"]
        try:
            client = ClientClass(ConfigClass())
            results = await test_provider(name, client, test_num)
            all_results.append(results)
            test_num += 1
        except Exception as e:
            print(f"\n  ❌ Error creando cliente {name}: {e}")

    # Resumen
    print_header("3. RESUMEN DE RESULTADOS")

    total_tests = 0
    passed_tests = 0

    for result in all_results:
        provider_passed = sum(1 for t in result["tests"] if t["passed"])
        provider_total = len(result["tests"])
        total_tests += provider_total
        passed_tests += provider_passed

        icon = "✅" if provider_passed == provider_total else "⚠️"
        print(f"  {icon} {result['name'].upper()}: {provider_passed}/{provider_total} tests pasados")

    print(f"\n  {'─' * 40}")
    success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
    print(f"  TOTAL: {passed_tests}/{total_tests} tests ({success_rate:.1f}%)")

    if passed_tests == total_tests:
        print("\n  🎉 Todos los tests pasaron!")
    else:
        print("\n  ⚠️ Algunos tests fallaron. Revisa los errores arriba.")

    print_header("4. COMO USAR")
    print("""
  Iniciar servidor:
    uvicorn main:app --reload --port 8000

  Endpoints disponibles:
    GET  /api/brain/status              Estado de proveedores
    GET  /api/brain/test?provider=X     Test rapido
    GET  /api/brain/compare             Comparar proveedores
    POST /api/brain/think               Pensar/analizar
    POST /api/brain/decide              Tomar decision
    POST /api/brain/generate-message    Generar mensaje

  Especificar proveedor:
    /api/brain/test?provider=gemini
    /api/brain/test?provider=claude
    /api/brain/test?provider=openai
    """)


if __name__ == "__main__":
    print("\n" + "🧠" * 30)
    asyncio.run(main())
    print("\n" + "🧠" * 30 + "\n")
