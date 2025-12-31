#!/bin/bash
# ===========================================
# LITPER PEDIDOS - Script de Reinstalación
# ===========================================

set -e

echo "🔄 Iniciando reinstalación de LITPER PEDIDOS..."
echo ""

# Obtener directorio del script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "📁 Directorio: $SCRIPT_DIR"
echo ""

# Paso 1: Limpiar instalación anterior
echo "🧹 Limpiando instalación anterior..."
rm -rf node_modules
rm -rf dist
rm -rf dist-electron
rm -f package-lock.json
rm -f yarn.lock
rm -f pnpm-lock.yaml
echo "   ✓ Limpieza completada"
echo ""

# Paso 2: Instalar dependencias
echo "📦 Instalando dependencias..."
npm install
echo "   ✓ Dependencias instaladas"
echo ""

# Paso 3: Verificar instalación
echo "🔍 Verificando instalación..."
if [ -d "node_modules" ] && [ -d "node_modules/react" ] && [ -d "node_modules/electron" ]; then
    echo "   ✓ node_modules correctamente instalado"
else
    echo "   ❌ Error: node_modules no se instaló correctamente"
    exit 1
fi
echo ""

# Paso 4: Compilar el proyecto
echo "🔨 Compilando el proyecto..."
npm run build
echo "   ✓ Proyecto compilado"
echo ""

echo "============================================"
echo "✅ REINSTALACIÓN COMPLETADA EXITOSAMENTE"
echo "============================================"
echo ""
echo "Comandos disponibles:"
echo "  npm run electron:dev     - Ejecutar en modo desarrollo"
echo "  npm run electron:build:win   - Crear instalador Windows"
echo "  npm run electron:build:mac   - Crear instalador macOS"
echo "  npm run electron:build:linux - Crear instalador Linux"
echo ""
