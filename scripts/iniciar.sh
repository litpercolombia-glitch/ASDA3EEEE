#!/bin/bash
# ===========================================
# SCRIPT DE INICIO - LITPER PRO
# ===========================================
# Ejecutar con: bash scripts/iniciar.sh

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

BASE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$BASE_DIR"

echo "================================================"
echo -e "${BLUE}  INICIANDO LITPER PRO${NC}"
echo "================================================"
echo ""

# Activar entorno virtual si existe
if [ -d "venv" ]; then
    echo -e "${YELLOW}Activando entorno virtual...${NC}"
    source venv/bin/activate
fi

# Verificar .env
if [ ! -f "backend/.env" ]; then
    echo -e "${RED}ERROR: No existe backend/.env${NC}"
    echo "Copia el archivo de ejemplo:"
    echo "  cp .env.backend backend/.env"
    exit 1
fi

# Verificar API key
if grep -q "xxxxxxxxxxxxxxxxxxxxx" backend/.env; then
    echo -e "${YELLOW}⚠ ADVERTENCIA: API key no configurada en backend/.env${NC}"
    echo "  El sistema funcionará en modo limitado."
    echo "  Configura ANTHROPIC_API_KEY para habilitar IA."
    echo ""
fi

# Verificar PostgreSQL
echo -e "${YELLOW}Verificando base de datos...${NC}"
if command -v docker &> /dev/null; then
    if docker ps | grep -q "litper.*postgres"; then
        echo -e "${GREEN}✓ PostgreSQL corriendo en Docker${NC}"
    else
        echo -e "${YELLOW}Iniciando PostgreSQL con Docker...${NC}"
        docker-compose up -d db 2>/dev/null || echo "  (Docker compose no disponible)"
    fi
fi

echo ""
echo -e "${YELLOW}Iniciando servidor FastAPI...${NC}"
echo ""
echo "================================================"
echo -e "${GREEN}  Servidor disponible en:${NC}"
echo -e "${GREEN}  → http://localhost:8000${NC}"
echo -e "${GREEN}  → http://localhost:8000/docs (Swagger)${NC}"
echo "================================================"
echo ""

cd backend
python main.py
