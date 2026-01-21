#!/usr/bin/env python3
"""
VERIFICADOR DEL SISTEMA LITPER PRO
===================================
Ejecutar con: python verificar_sistema.py

Este script verifica qué componentes están listos y cuáles faltan.
"""

import os
import sys

# Colores para terminal
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

def check(condition, name):
    if condition:
        print(f"  {Colors.GREEN}✓{Colors.END} {name}")
        return True
    else:
        print(f"  {Colors.RED}✗{Colors.END} {name}")
        return False

def try_import(module_name, display_name=None):
    display = display_name or module_name
    try:
        __import__(module_name)
        return check(True, display)
    except ImportError:
        return check(False, f"{display} (pip install {module_name})")

print()
print(f"{Colors.BLUE}{'='*50}{Colors.END}")
print(f"{Colors.BLUE}  VERIFICACIÓN DEL SISTEMA LITPER PRO{Colors.END}")
print(f"{Colors.BLUE}{'='*50}{Colors.END}")
print()

# ==================== PYTHON ====================
print(f"{Colors.YELLOW}[1] PYTHON{Colors.END}")
check(sys.version_info >= (3, 8), f"Python {sys.version.split()[0]}")
print()

# ==================== DEPENDENCIAS CORE ====================
print(f"{Colors.YELLOW}[2] DEPENDENCIAS CORE{Colors.END}")
core_ok = all([
    try_import("fastapi", "FastAPI"),
    try_import("uvicorn", "Uvicorn"),
    try_import("sqlalchemy", "SQLAlchemy"),
    try_import("psycopg2", "PostgreSQL driver"),
    try_import("pandas", "Pandas"),
    try_import("numpy", "NumPy"),
])
print()

# ==================== DEPENDENCIAS ML ====================
print(f"{Colors.YELLOW}[3] MACHINE LEARNING{Colors.END}")
ml_ok = all([
    try_import("sklearn", "Scikit-learn"),
    try_import("xgboost", "XGBoost"),
    try_import("joblib", "Joblib"),
])
print()

# ==================== DEPENDENCIAS IA ====================
print(f"{Colors.YELLOW}[4] INTELIGENCIA ARTIFICIAL{Colors.END}")
ia_ok = 0
if try_import("anthropic", "Claude (Anthropic)"):
    ia_ok += 1
if try_import("openai", "OpenAI (ChatGPT)"):
    ia_ok += 1
if try_import("aiohttp", "Aiohttp (para Gemini)"):
    ia_ok += 1
print(f"  {Colors.BLUE}ℹ{Colors.END} Al menos 1 proveedor de IA es suficiente")
print()

# ==================== ARCHIVO .ENV ====================
print(f"{Colors.YELLOW}[5] CONFIGURACIÓN{Colors.END}")
env_path = os.path.join(os.path.dirname(__file__), 'backend', '.env')
env_exists = os.path.exists(env_path)
check(env_exists, "Archivo backend/.env existe")

if env_exists:
    with open(env_path, 'r') as f:
        content = f.read()

    has_claude = 'sk-ant-api03-' in content and 'xxxxx' not in content
    has_openai = 'sk-proj-' in content
    has_gemini = 'AIza' in content

    check(has_claude, "API Key de Claude configurada")
    check(has_openai, "API Key de OpenAI configurada")
    check(has_gemini, "API Key de Gemini configurada")
print()

# ==================== BASE DE DATOS ====================
print(f"{Colors.YELLOW}[6] BASE DE DATOS{Colors.END}")
try:
    import psycopg2
    # Intentar conectar
    try:
        conn = psycopg2.connect(
            dbname="litper_ml_db",
            user="litper_user",
            password="litper_pass",
            host="localhost"
        )
        conn.close()
        check(True, "Conexión a PostgreSQL OK")
        db_ok = True
    except:
        check(False, "Conexión a PostgreSQL (BD no existe o no está corriendo)")
        db_ok = False
except ImportError:
    check(False, "Driver PostgreSQL no instalado")
    db_ok = False
print()

# ==================== RESUMEN ====================
print(f"{Colors.BLUE}{'='*50}{Colors.END}")
print(f"{Colors.BLUE}  RESUMEN{Colors.END}")
print(f"{Colors.BLUE}{'='*50}{Colors.END}")
print()

all_ok = core_ok and ml_ok and ia_ok > 0 and env_exists and db_ok

if all_ok:
    print(f"{Colors.GREEN}✓ SISTEMA LISTO PARA EJECUTAR{Colors.END}")
    print()
    print("Ejecuta:")
    print("  cd backend && python main.py")
    print()
else:
    print(f"{Colors.YELLOW}⚠ FALTAN COMPONENTES{Colors.END}")
    print()

    if not core_ok or not ml_ok:
        print("1. Instala las dependencias:")
        print("   pip install fastapi uvicorn sqlalchemy psycopg2-binary pandas numpy scikit-learn xgboost")
        print()

    if ia_ok == 0:
        print("2. Instala al menos un proveedor de IA:")
        print("   pip install anthropic  # Para Claude")
        print("   pip install openai     # Para ChatGPT")
        print("   pip install aiohttp    # Para Gemini (gratis)")
        print()

    if not db_ok:
        print("3. Configura PostgreSQL:")
        print("   - Inicia PostgreSQL")
        print("   - Crea la base de datos: createdb litper_ml_db")
        print("   - Crea el usuario: CREATE USER litper_user WITH PASSWORD 'litper_pass';")
        print()

    if not env_exists:
        print("4. Crea el archivo de configuración:")
        print("   cp .env.backend backend/.env")
        print("   # Luego edita backend/.env con tus API keys")
        print()

print(f"{Colors.BLUE}{'='*50}{Colors.END}")
