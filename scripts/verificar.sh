#!/bin/bash
# ===========================================
# SCRIPT DE VERIFICACIÓN - LITPER PRO
# ===========================================
# Ejecutar con: bash scripts/verificar.sh
# Requiere que el servidor esté corriendo

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

API_URL="${API_URL:-http://localhost:8000}"

echo "================================================"
echo "  VERIFICACIÓN DEL SISTEMA LITPER PRO"
echo "================================================"
echo ""
echo "API URL: $API_URL"
echo ""

# Función para verificar endpoint
check_endpoint() {
    local name=$1
    local endpoint=$2
    local method=${3:-GET}
    local data=${4:-}

    if [ "$method" == "POST" ] && [ -n "$data" ]; then
        response=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_URL$endpoint" -H "Content-Type: application/json" -d "$data" 2>/dev/null)
    else
        response=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL$endpoint" 2>/dev/null)
    fi

    if [ "$response" == "200" ]; then
        echo -e "${GREEN}✓${NC} $name"
        return 0
    else
        echo -e "${RED}✗${NC} $name (HTTP $response)"
        return 1
    fi
}

echo "--- ENDPOINTS CORE ---"
check_endpoint "Health Check" "/health"
check_endpoint "Configuración" "/config"

echo ""
echo "--- DASHBOARD ---"
check_endpoint "Resumen" "/dashboard/resumen"
check_endpoint "KPIs Avanzados" "/dashboard/kpis-avanzados"
check_endpoint "Tendencias" "/dashboard/tendencias"
check_endpoint "Transportadoras" "/dashboard/transportadoras"

echo ""
echo "--- MACHINE LEARNING ---"
check_endpoint "Métricas ML" "/ml/metricas"
check_endpoint "Estado Entrenamiento" "/ml/estado-entrenamiento"

echo ""
echo "--- CEREBRO AUTÓNOMO ---"
check_endpoint "Brain Status" "/api/brain/status"
check_endpoint "Brain Health" "/api/brain/health"

echo ""
echo "--- CHAT INTELIGENTE ---"
check_endpoint "Chat Historial" "/chat/historial"

echo ""
echo "--- ALERTAS ---"
check_endpoint "Listar Alertas" "/alertas/listar"

echo ""
echo "--- MEMORIA ---"
check_endpoint "Archivos Cargados" "/memoria/archivos"
check_endpoint "Estadísticas Memoria" "/memoria/estadisticas"

echo ""
echo "================================================"

# Resumen detallado
echo ""
echo "--- ESTADO DETALLADO ---"
health=$(curl -s "$API_URL/health" 2>/dev/null)
if [ -n "$health" ]; then
    echo "Health Response:"
    echo "$health" | python3 -m json.tool 2>/dev/null || echo "$health"
fi

echo ""
echo "================================================"
echo "  VERIFICACIÓN COMPLETADA"
echo "================================================"
