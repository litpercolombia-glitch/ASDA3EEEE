#!/usr/bin/env python3
"""
Script para probar la conexión a PostgreSQL.
Ejecutar: python test_db_connection.py
"""
import asyncio
import sys
from dotenv import load_dotenv

load_dotenv()

# Colores para terminal
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
CYAN = '\033[96m'
RESET = '\033[0m'
BOLD = '\033[1m'

def print_header():
    print(f"\n{CYAN}{'='*50}{RESET}")
    print(f"{BOLD}{CYAN}  LITPER LOGÍSTICA - Test de Conexión DB{RESET}")
    print(f"{CYAN}{'='*50}{RESET}\n")

def print_success(msg):
    print(f"{GREEN}✅ {msg}{RESET}")

def print_error(msg):
    print(f"{RED}❌ {msg}{RESET}")

def print_info(msg):
    print(f"{YELLOW}ℹ️  {msg}{RESET}")

async def test_async_connection():
    """Prueba conexión async con asyncpg."""
    print(f"\n{BOLD}1. Probando conexión ASYNC (asyncpg)...{RESET}")
    try:
        from database.async_config import verificar_conexion_async, AsyncDBConfig
        print_info(f"Host: {AsyncDBConfig.HOST}:{AsyncDBConfig.PORT}")
        print_info(f"Database: {AsyncDBConfig.DB}")
        print_info(f"User: {AsyncDBConfig.USER}")

        result = await verificar_conexion_async()

        if result["status"] == "connected":
            print_success("Conexión ASYNC exitosa!")
            print_info(f"Versión: {result.get('version', 'N/A')}")
            print_info(f"Hora servidor: {result.get('server_time', 'N/A')}")
            return True
        else:
            print_error(f"Error: {result.get('message', 'Unknown')}")
            return False
    except Exception as e:
        print_error(f"Error async: {e}")
        return False

def test_sync_connection():
    """Prueba conexión sync con psycopg2."""
    print(f"\n{BOLD}2. Probando conexión SYNC (psycopg2)...{RESET}")
    try:
        from database.config import verificar_conexion, DatabaseConfig
        print_info(f"URL: {DatabaseConfig.DATABASE_URL.split('@')[-1]}")

        if verificar_conexion():
            print_success("Conexión SYNC exitosa!")
            return True
        else:
            print_error("Conexión SYNC fallida")
            return False
    except Exception as e:
        print_error(f"Error sync: {e}")
        return False

def test_env_variables():
    """Verifica variables de entorno."""
    print(f"\n{BOLD}3. Verificando variables de entorno...{RESET}")
    import os

    required = ['POSTGRES_USER', 'POSTGRES_PASSWORD', 'POSTGRES_HOST', 'POSTGRES_DB']
    missing = []

    for var in required:
        value = os.getenv(var)
        if value:
            # Ocultar password
            display = '***' if 'PASSWORD' in var else value
            print_success(f"{var} = {display}")
        else:
            print_error(f"{var} no definida")
            missing.append(var)

    return len(missing) == 0

async def main():
    print_header()

    results = {
        "env": test_env_variables(),
        "sync": test_sync_connection(),
        "async": await test_async_connection(),
    }

    print(f"\n{CYAN}{'='*50}{RESET}")
    print(f"{BOLD}RESUMEN:{RESET}")
    print(f"{CYAN}{'='*50}{RESET}")

    all_ok = all(results.values())

    for test, passed in results.items():
        status = f"{GREEN}PASS{RESET}" if passed else f"{RED}FAIL{RESET}"
        print(f"  {test.upper():.<20} [{status}]")

    print(f"\n{BOLD}Estado general: ", end="")
    if all_ok:
        print(f"{GREEN}✅ TODO OK - Listo para usar{RESET}")
    else:
        print(f"{RED}❌ HAY ERRORES - Revisar configuración{RESET}")

    print()
    return 0 if all_ok else 1

if __name__ == '__main__':
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
