#!/bin/bash
# ===========================================
# SCRIPT DE INSTALACIÓN - LITPER PRO
# ===========================================
# Ejecutar con: bash scripts/instalar.sh

set -e

echo "================================================"
echo "  INSTALACIÓN DE LITPER PRO - Sistema de IA"
echo "================================================"
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Directorio base
BASE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$BASE_DIR"

echo -e "${YELLOW}[1/5] Verificando Python...${NC}"
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    echo -e "${GREEN}✓ $PYTHON_VERSION encontrado${NC}"
else
    echo -e "${RED}✗ Python3 no encontrado. Instálalo primero.${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}[2/5] Creando entorno virtual...${NC}"
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo -e "${GREEN}✓ Entorno virtual creado${NC}"
else
    echo -e "${GREEN}✓ Entorno virtual ya existe${NC}"
fi

echo ""
echo -e "${YELLOW}[3/5] Activando entorno virtual...${NC}"
source venv/bin/activate
echo -e "${GREEN}✓ Entorno activado${NC}"

echo ""
echo -e "${YELLOW}[4/5] Instalando dependencias...${NC}"
pip install --upgrade pip -q
pip install -r backend/requirements.txt
echo -e "${GREEN}✓ Dependencias instaladas${NC}"

echo ""
echo -e "${YELLOW}[5/5] Verificando instalación...${NC}"

# Verificar paquetes críticos
python3 -c "import fastapi; print('  ✓ FastAPI')"
python3 -c "import sqlalchemy; print('  ✓ SQLAlchemy')"
python3 -c "import pandas; print('  ✓ Pandas')"
python3 -c "import sklearn; print('  ✓ Scikit-learn')"
python3 -c "import xgboost; print('  ✓ XGBoost')"

# Verificar IA (opcional)
python3 -c "import anthropic; print('  ✓ Anthropic (Claude)')" 2>/dev/null || echo "  ⚠ Anthropic no instalado (opcional)"
python3 -c "import aiohttp; print('  ✓ Aiohttp (Gemini)')" 2>/dev/null || echo "  ⚠ Aiohttp no instalado (opcional)"

echo ""
echo "================================================"
echo -e "${GREEN}  INSTALACIÓN COMPLETADA${NC}"
echo "================================================"
echo ""
echo "Próximos pasos:"
echo "  1. Configura tu API key en backend/.env"
echo "  2. Ejecuta: bash scripts/iniciar.sh"
echo ""
