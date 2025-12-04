#!/usr/bin/env python3
"""
Script para inicializar la base de datos del sistema ML.
"""

import sys
import os

# Agregar el directorio actual al path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

from loguru import logger
logger.remove()
logger.add(sys.stdout, level="INFO")

from database import (
    init_database,
    crear_configuraciones_default,
    verificar_conexion,
    get_db_stats
)

def main():
    print("=" * 50)
    print("INICIALIZACIÓN DE BASE DE DATOS - LITPER ML")
    print("=" * 50)
    print()

    # Verificar conexión
    print("[1/3] Verificando conexión...")
    if not verificar_conexion():
        print("[ERROR] No se pudo conectar a la base de datos")
        return False

    print("[OK] Conexión verificada")
    print()

    # Crear tablas
    print("[2/3] Creando tablas...")
    if not init_database():
        print("[ERROR] No se pudieron crear las tablas")
        return False

    print("[OK] Tablas creadas")
    print()

    # Crear configuraciones por defecto
    print("[3/3] Creando configuraciones por defecto...")
    if not crear_configuraciones_default():
        print("[ERROR] No se pudieron crear las configuraciones")
        return False

    print("[OK] Configuraciones creadas")
    print()

    # Mostrar estadísticas
    print("=" * 50)
    print("ESTADÍSTICAS DE LA BASE DE DATOS")
    print("=" * 50)
    stats = get_db_stats()
    for tabla, count in stats.items():
        print(f"  - {tabla}: {count} registros")

    print()
    print("[OK] Base de datos inicializada correctamente")
    return True


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
