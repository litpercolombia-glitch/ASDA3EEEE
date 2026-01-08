#!/bin/bash

# ============================================
# LITPER - Setup de Variables de Entorno
# Genera credenciales seguras para el proyecto
# ============================================

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Archivos de configuración
ROOT_ENV=".env"
BACKEND_ENV=".env.backend"

echo -e "${BLUE}"
echo "============================================"
echo "   LITPER - Setup de Entorno Seguro"
echo "============================================"
echo -e "${NC}"

# ==================== FUNCIONES ====================

generate_password() {
    # Genera una contraseña segura de 24 caracteres
    if command -v openssl &> /dev/null; then
        openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 24
    else
        # Fallback sin openssl
        cat /dev/urandom | tr -dc 'a-zA-Z0-9' | head -c 24
    fi
}

generate_secret() {
    # Genera un secret más largo para JWT
    if command -v openssl &> /dev/null; then
        openssl rand -base64 64 | tr -dc 'a-zA-Z0-9' | head -c 64
    else
        cat /dev/urandom | tr -dc 'a-zA-Z0-9' | head -c 64
    fi
}

check_existing_env() {
    local file=$1
    if [ -f "$file" ]; then
        echo -e "${YELLOW}Advertencia: El archivo $file ya existe.${NC}"
        read -p "¿Deseas sobrescribirlo? (y/n): " response
        if [ "$response" != "y" ] && [ "$response" != "Y" ]; then
            echo "Saltando $file"
            return 1
        fi
    fi
    return 0
}

# ==================== VERIFICACIONES ====================

echo -e "${BLUE}Verificando requisitos...${NC}"

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ] && [ ! -d "backend" ]; then
    echo -e "${RED}Error: Ejecuta este script desde el directorio raíz del proyecto.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Directorio correcto${NC}"

# ==================== GENERAR CREDENCIALES ====================

echo ""
echo -e "${BLUE}Generando credenciales seguras...${NC}"

DB_PASSWORD=$(generate_password)
REDIS_PASSWORD=$(generate_password)
JWT_SECRET=$(generate_secret)
SESSION_SECRET=$(generate_secret)

echo -e "${GREEN}✓ Credenciales generadas${NC}"

# ==================== CREAR .env (Frontend/Docker) ====================

echo ""
if check_existing_env "$ROOT_ENV"; then
    echo -e "${BLUE}Creando $ROOT_ENV...${NC}"

    cat > "$ROOT_ENV" << EOF
# ============================================
# LITPER - Variables de Entorno
# Generado automáticamente: $(date)
# ============================================
# IMPORTANTE: Nunca subas este archivo a git

# ==================== BASE DE DATOS ====================
DB_USER=litper_user
DB_PASSWORD=${DB_PASSWORD}
DB_NAME=litper_prod
DB_HOST=localhost
DB_PORT=5432

# URL completa de conexión
DATABASE_URL=postgresql://litper_user:${DB_PASSWORD}@localhost:5432/litper_prod

# ==================== REDIS ====================
REDIS_PASSWORD=${REDIS_PASSWORD}
REDIS_URL=redis://:${REDIS_PASSWORD}@localhost:6379/0

# ==================== SEGURIDAD ====================
JWT_SECRET=${JWT_SECRET}
SESSION_SECRET=${SESSION_SECRET}

# ==================== SUPABASE (Frontend Cloud) ====================
# Obtener en: https://app.supabase.com
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

# ==================== API KEYS ====================
# Anthropic Claude: https://console.anthropic.com
ANTHROPIC_API_KEY=
VITE_ANTHROPIC_API_KEY=

# Google AI: https://aistudio.google.com/apikey
GOOGLE_API_KEY=
VITE_GEMINI_API_KEY=

# OpenAI: https://platform.openai.com/api-keys
OPENAI_API_KEY=
VITE_OPENAI_API_KEY=

# ==================== CONFIGURACIÓN ====================
NODE_ENV=development
DEBUG=true
LOG_LEVEL=INFO
TZ=America/Bogota

# API Backend
VITE_API_URL=http://localhost:8000
API_HOST=0.0.0.0
API_PORT=8000

# ==================== INTEGRACIONES (Opcional) ====================
# WhatsApp Chatea
VITE_CHATEA_API_KEY=
VITE_CHATEA_WEBHOOK_URL=

# Meta WhatsApp Business
META_WHATSAPP_TOKEN=
META_PHONE_NUMBER_ID=

# Transportadoras
COORDINADORA_API_KEY=
COORDINADORA_NIT=
TCC_API_KEY=
ENVIA_API_KEY=

EOF

    echo -e "${GREEN}✓ $ROOT_ENV creado${NC}"
fi

# ==================== CREAR .env.backend ====================

echo ""
if check_existing_env "$BACKEND_ENV"; then
    echo -e "${BLUE}Creando $BACKEND_ENV...${NC}"

    cat > "$BACKEND_ENV" << EOF
# ============================================
# LITPER Backend - Variables de Entorno
# Generado automáticamente: $(date)
# ============================================

# ==================== BASE DE DATOS ====================
DATABASE_URL=postgresql://litper_user:${DB_PASSWORD}@localhost:5432/litper_prod

# Pool de conexiones
DB_POOL_SIZE=5
DB_MAX_OVERFLOW=10
DB_POOL_TIMEOUT=30
DB_POOL_RECYCLE=1800
DB_ECHO_SQL=false

# ==================== REDIS ====================
REDIS_URL=redis://:${REDIS_PASSWORD}@localhost:6379/0

# ==================== API de Claude (Anthropic) ====================
CLAUDE_API_KEY=
ANTHROPIC_API_KEY=
CLAUDE_MODEL=claude-sonnet-4-20250514

# ==================== Configuración de ML ====================
MODELOS_DIR=ml_models/saved
UPLOADS_DIR=uploads
REENTRENAMIENTO_AUTOMATICO=true
DIAS_RETRASO_ALERTA=3
UMBRAL_PROBABILIDAD_RETRASO=0.7
MIN_REGISTROS_ENTRENAMIENTO=100

# ==================== Servidor API ====================
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=false

# ==================== Seguridad ====================
JWT_SECRET=${JWT_SECRET}
SESSION_SECRET=${SESSION_SECRET}

# ==================== Logging ====================
LOG_LEVEL=INFO
DIAS_RETENCION_LOGS=30

# ==================== Chat Inteligente ====================
CHAT_MAX_TOKENS=2000

# ==================== General ====================
TZ=America/Bogota
MAX_FILE_SIZE=52428800

EOF

    echo -e "${GREEN}✓ $BACKEND_ENV creado${NC}"
fi

# ==================== CONFIGURAR .gitignore ====================

echo ""
echo -e "${BLUE}Verificando .gitignore...${NC}"

GITIGNORE=".gitignore"

# Asegurar que .env está en gitignore
if [ -f "$GITIGNORE" ]; then
    if ! grep -q "^\.env$" "$GITIGNORE"; then
        echo "" >> "$GITIGNORE"
        echo "# Environment files with secrets" >> "$GITIGNORE"
        echo ".env" >> "$GITIGNORE"
        echo ".env.backend" >> "$GITIGNORE"
        echo ".env.local" >> "$GITIGNORE"
        echo ".env.production" >> "$GITIGNORE"
        echo -e "${GREEN}✓ Archivos .env agregados a .gitignore${NC}"
    else
        echo -e "${GREEN}✓ .gitignore ya contiene .env${NC}"
    fi
else
    echo -e "${YELLOW}Advertencia: No se encontró .gitignore${NC}"
fi

# ==================== RESUMEN ====================

echo ""
echo -e "${GREEN}============================================"
echo "   Setup completado exitosamente"
echo "============================================${NC}"
echo ""
echo -e "${YELLOW}IMPORTANTE: Guarda estas credenciales en un lugar seguro:${NC}"
echo ""
echo -e "  DB_PASSWORD:     ${BLUE}${DB_PASSWORD}${NC}"
echo -e "  REDIS_PASSWORD:  ${BLUE}${REDIS_PASSWORD}${NC}"
echo -e "  JWT_SECRET:      ${BLUE}${JWT_SECRET:0:20}...${NC}"
echo ""
echo -e "${YELLOW}Próximos pasos:${NC}"
echo "  1. Configura las API keys en los archivos .env"
echo "  2. Configura Supabase si lo usas (VITE_SUPABASE_*)"
echo "  3. Ejecuta: docker-compose up -d"
echo "  4. Ejecuta: cd backend && python -m database.config"
echo ""
echo -e "${RED}NUNCA subas los archivos .env a git${NC}"
echo ""

# ==================== VERIFICAR DOCKER ====================

if command -v docker &> /dev/null; then
    echo -e "${BLUE}¿Deseas iniciar los contenedores de Docker ahora? (y/n): ${NC}"
    read -p "" start_docker
    if [ "$start_docker" = "y" ] || [ "$start_docker" = "Y" ]; then
        echo -e "${BLUE}Iniciando Docker...${NC}"
        docker-compose up -d
        echo -e "${GREEN}✓ Contenedores iniciados${NC}"
        echo ""
        echo "Verifica el estado con: docker-compose ps"
    fi
fi

echo ""
echo -e "${GREEN}¡Listo! Tu entorno está configurado.${NC}"
