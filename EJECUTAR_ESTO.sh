#!/bin/bash
# =====================================================
# SCRIPT ÚNICO PARA ACTIVAR TODO EL SISTEMA
# =====================================================
#
# EJECUTAR CON: bash EJECUTAR_ESTO.sh
#
# Este script hace TODO automáticamente:
# 1. Instala dependencias
# 2. Configura base de datos
# 3. Crea datos de prueba
# 4. Entrena modelos ML
# 5. Inicia el servidor
# =====================================================

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     LITPER PRO - INSTALACIÓN AUTOMÁTICA          ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════╝${NC}"
echo ""

# Directorio base
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# =====================================================
# PASO 1: INSTALAR DEPENDENCIAS
# =====================================================
echo -e "${YELLOW}[1/6] Instalando dependencias Python...${NC}"

pip install --upgrade pip -q

# Core
pip install fastapi uvicorn sqlalchemy psycopg2-binary asyncpg

# ML
pip install pandas numpy scikit-learn xgboost joblib

# IA (Claude, OpenAI, Gemini)
pip install anthropic openai aiohttp google-generativeai

# Utilidades
pip install python-dotenv loguru pydantic python-multipart openpyxl
pip install apscheduler httpx passlib python-jose bcrypt

echo -e "${GREEN}✓ Dependencias instaladas${NC}"
echo ""

# =====================================================
# PASO 2: VERIFICAR .ENV
# =====================================================
echo -e "${YELLOW}[2/6] Verificando configuración...${NC}"

if [ ! -f "backend/.env" ]; then
    echo -e "${RED}ERROR: No existe backend/.env${NC}"
    echo "Creando desde plantilla..."
    cp .env.backend backend/.env
fi

# Verificar que las API keys están configuradas
if grep -q "xxxxxxxxxxxxxxxxxxxxx" backend/.env; then
    echo -e "${RED}ERROR: Las API keys no están configuradas en backend/.env${NC}"
    echo "Edita el archivo y agrega tus API keys reales."
    exit 1
fi

echo -e "${GREEN}✓ Configuración OK${NC}"
echo ""

# =====================================================
# PASO 3: CONFIGURAR BASE DE DATOS
# =====================================================
echo -e "${YELLOW}[3/6] Configurando base de datos...${NC}"

# Crear base de datos si no existe
sudo -u postgres psql -c "CREATE DATABASE litper_ml_db;" 2>/dev/null || echo "  (BD ya existe)"
sudo -u postgres psql -c "CREATE USER litper_user WITH PASSWORD 'litper_pass';" 2>/dev/null || echo "  (Usuario ya existe)"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE litper_ml_db TO litper_user;" 2>/dev/null || true
sudo -u postgres psql -d litper_ml_db -c "GRANT ALL ON SCHEMA public TO litper_user;" 2>/dev/null || true

echo -e "${GREEN}✓ Base de datos configurada${NC}"
echo ""

# =====================================================
# PASO 4: INICIALIZAR TABLAS
# =====================================================
echo -e "${YELLOW}[4/6] Inicializando tablas...${NC}"

cd backend
python3 -c "
from database import init_database, crear_configuraciones_default
init_database()
crear_configuraciones_default()
print('Tablas creadas')
"
cd ..

echo -e "${GREEN}✓ Tablas inicializadas${NC}"
echo ""

# =====================================================
# PASO 5: CARGAR DATOS DE PRUEBA
# =====================================================
echo -e "${YELLOW}[5/6] Cargando datos de prueba...${NC}"

python3 scripts/cargar_datos_prueba.py << EOF
s
EOF

echo -e "${GREEN}✓ Datos de prueba cargados${NC}"
echo ""

# =====================================================
# PASO 6: INICIAR SERVIDOR
# =====================================================
echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     INSTALACIÓN COMPLETADA                       ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}El sistema está listo. Para iniciarlo ejecuta:${NC}"
echo ""
echo -e "  ${YELLOW}cd backend && python main.py${NC}"
echo ""
echo "Luego abre en tu navegador:"
echo "  → http://localhost:8000/docs    (API Swagger)"
echo "  → http://localhost:8000/health  (Estado del sistema)"
echo ""
echo "Para entrenar los modelos ML:"
echo "  → curl -X POST http://localhost:8000/ml/entrenar"
echo ""
echo "Para probar el chat IA:"
echo '  → curl -X POST http://localhost:8000/chat/preguntar \'
echo '       -H "Content-Type: application/json" \'
echo '       -d "{\"pregunta\": \"¿Cuántas guías hay en el sistema?\"}"'
echo ""

# Preguntar si iniciar ahora
read -p "¿Iniciar el servidor ahora? (s/n): " respuesta
if [ "$respuesta" == "s" ]; then
    echo ""
    echo -e "${YELLOW}Iniciando servidor...${NC}"
    cd backend
    python main.py
fi
