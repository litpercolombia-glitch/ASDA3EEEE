#!/usr/bin/env python3
"""
SCRIPT PARA CARGAR DATOS DE PRUEBA - LITPER PRO
================================================
Ejecutar con: python scripts/cargar_datos_prueba.py

Este script:
1. Conecta a la base de datos
2. Inserta 500 guías de prueba con datos realistas
3. Permite entrenar los modelos ML inmediatamente
"""

import os
import sys
import random
from datetime import datetime, timedelta

# Agregar path del backend
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'backend', '.env'))

# Datos realistas para Colombia
TRANSPORTADORAS = [
    ("Coordinadora", 0.08),   # 8% tasa de retraso
    ("Servientrega", 0.12),   # 12% tasa de retraso
    ("TCC", 0.10),            # 10% tasa de retraso
    ("Envía", 0.15),          # 15% tasa de retraso
    ("Inter Rapidísimo", 0.18) # 18% tasa de retraso
]

CIUDADES = [
    ("Bogotá", 2),       # 2 días promedio
    ("Medellín", 2),
    ("Cali", 3),
    ("Barranquilla", 3),
    ("Cartagena", 3),
    ("Bucaramanga", 3),
    ("Pereira", 2),
    ("Manizales", 3),
    ("Cúcuta", 4),
    ("Santa Marta", 4),
    ("Villavicencio", 3),
    ("Ibagué", 2),
    ("Neiva", 3),
    ("Armenia", 2),
    ("Pasto", 5),
]

ESTADOS = [
    "Entregado",
    "En tránsito",
    "En bodega",
    "En reparto",
    "Devuelto",
    "Con novedad"
]

NOVEDADES = [
    "Dirección incorrecta",
    "Destinatario ausente",
    "Rechazado por cliente",
    "Zona de difícil acceso",
    "Mercancía averiada",
    None, None, None, None, None  # Más probabilidad de sin novedad
]


def generar_numero_guia(transportadora: str, indice: int) -> str:
    """Genera número de guía realista"""
    prefijos = {
        "Coordinadora": "COO",
        "Servientrega": "SER",
        "TCC": "TCC",
        "Envía": "ENV",
        "Inter Rapidísimo": "IRD"
    }
    prefijo = prefijos.get(transportadora, "GEN")
    return f"{prefijo}{datetime.now().strftime('%Y%m')}{indice:06d}"


def main():
    try:
        from database import get_session, GuiaHistorica, init_database

        print("=" * 50)
        print("  CARGANDO DATOS DE PRUEBA - LITPER PRO")
        print("=" * 50)
        print()

        # Inicializar BD
        print("Inicializando base de datos...")
        init_database()

        session = next(get_session())

        # Verificar si ya hay datos
        existing = session.query(GuiaHistorica).count()
        if existing > 0:
            print(f"Ya existen {existing} guías en la base de datos.")
            respuesta = input("¿Deseas agregar más datos? (s/n): ")
            if respuesta.lower() != 's':
                print("Operación cancelada.")
                return

        print()
        print("Generando 500 guías de prueba...")
        print()

        guias_creadas = 0

        for i in range(500):
            # Seleccionar transportadora con su tasa de retraso
            transportadora, tasa_retraso = random.choice(TRANSPORTADORAS)

            # Seleccionar ciudad con su tiempo promedio
            ciudad, dias_base = random.choice(CIUDADES)

            # Generar fechas
            dias_atras = random.randint(1, 90)
            fecha_envio = datetime.now() - timedelta(days=dias_atras)

            # Determinar si hay retraso (basado en tasa de transportadora)
            tiene_retraso = random.random() < tasa_retraso

            # Calcular días de tránsito
            if tiene_retraso:
                dias_transito = dias_base + random.randint(2, 5)
            else:
                dias_transito = dias_base + random.randint(-1, 1)
            dias_transito = max(1, dias_transito)

            # Determinar estado
            if dias_atras > dias_transito + 2:
                estado = random.choice(["Entregado", "Devuelto"])
            else:
                estado = random.choice(ESTADOS)

            # Determinar novedad
            tiene_novedad = random.random() < 0.1  # 10% de novedades
            tipo_novedad = random.choice(NOVEDADES) if tiene_novedad else None

            # Precio flete (basado en ciudad)
            precio_base = 8000 if ciudad in ["Bogotá", "Medellín"] else 12000 if ciudad in ["Cali", "Barranquilla"] else 15000
            precio_flete = precio_base + random.randint(-2000, 5000)

            # Valor declarado
            valor_declarado = random.randint(50000, 500000)

            # Crear guía
            guia = GuiaHistorica(
                numero_guia=generar_numero_guia(transportadora, i),
                transportadora=transportadora,
                ciudad_destino=ciudad,
                departamento_destino=ciudad,  # Simplificado
                fecha_envio=fecha_envio,
                fecha_entrega=fecha_envio + timedelta(days=dias_transito) if estado == "Entregado" else None,
                estatus=estado,
                tiene_retraso=tiene_retraso,
                tiene_novedad=tiene_novedad,
                tipo_novedad=tipo_novedad,
                dias_transito=dias_transito,
                precio_flete=precio_flete,
                valor_declarado=valor_declarado,
                peso_kg=round(random.uniform(0.5, 30), 2),
                nombre_destinatario=f"Cliente Prueba {i}",
                telefono_destinatario=f"3{random.randint(10, 99)}{random.randint(1000000, 9999999)}",
            )

            session.add(guia)
            guias_creadas += 1

            # Mostrar progreso
            if (i + 1) % 100 == 0:
                print(f"  → {i + 1}/500 guías creadas...")

        session.commit()

        print()
        print("=" * 50)
        print(f"  ✓ {guias_creadas} GUÍAS CREADAS EXITOSAMENTE")
        print("=" * 50)
        print()

        # Mostrar resumen
        print("Resumen de datos:")
        for transportadora, _ in TRANSPORTADORAS:
            count = session.query(GuiaHistorica).filter(
                GuiaHistorica.transportadora == transportadora
            ).count()
            print(f"  - {transportadora}: {count} guías")

        print()
        print("Próximo paso:")
        print("  Entrenar modelos ML con:")
        print("  curl -X POST http://localhost:8000/ml/entrenar")
        print()

    except ImportError as e:
        print(f"ERROR: No se pueden importar los módulos del backend.")
        print(f"Detalle: {e}")
        print()
        print("Asegúrate de:")
        print("  1. Estar en el directorio correcto")
        print("  2. Tener las dependencias instaladas: pip install -r backend/requirements.txt")

    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
