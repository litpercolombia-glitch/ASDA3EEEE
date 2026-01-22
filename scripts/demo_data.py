#!/usr/bin/env python3
"""
SCRIPT DE DATOS DE DEMO
=======================

Genera datos de prueba para demostrar las capacidades del sistema.
Incluye:
- Pedidos simulados
- Datos financieros
- Métricas de transportadoras
- Alertas de ejemplo

Uso:
    python demo_data.py

Autor: Litper IA System
"""

import os
import json
import random
from datetime import datetime, timedelta
from typing import List, Dict

# ==================== CONFIGURACION ====================

# Transportadoras colombianas
TRANSPORTADORAS = [
    {"nombre": "Servientrega", "codigo": "SERV", "tasa_base": 88},
    {"nombre": "Coordinadora", "codigo": "COOR", "tasa_base": 85},
    {"nombre": "Interrapidisimo", "codigo": "INTER", "tasa_base": 82},
    {"nombre": "TCC", "codigo": "TCC", "tasa_base": 80},
    {"nombre": "Envía", "codigo": "ENVIA", "tasa_base": 78},
    {"nombre": "Deprisa", "codigo": "DEPR", "tasa_base": 75},
]

# Estados de guía
ESTADOS_GUIA = [
    "ENTREGADO",
    "EN TRANSITO",
    "EN CENTRO DE DISTRIBUCION",
    "DEVOLUCION",
    "NO ENTREGADO - DIRECCION INCORRECTA",
    "NO ENTREGADO - CLIENTE AUSENTE",
    "PENDIENTE CONFIRMACION",
    "RECOGIDO",
]

# Ciudades colombianas
CIUDADES = [
    {"nombre": "Bogotá", "departamento": "Cundinamarca", "tasa_entrega": 90},
    {"nombre": "Medellín", "departamento": "Antioquia", "tasa_entrega": 88},
    {"nombre": "Cali", "departamento": "Valle del Cauca", "tasa_entrega": 85},
    {"nombre": "Barranquilla", "departamento": "Atlántico", "tasa_entrega": 82},
    {"nombre": "Cartagena", "departamento": "Bolívar", "tasa_entrega": 80},
    {"nombre": "Bucaramanga", "departamento": "Santander", "tasa_entrega": 83},
    {"nombre": "Pereira", "departamento": "Risaralda", "tasa_entrega": 81},
    {"nombre": "Santa Marta", "departamento": "Magdalena", "tasa_entrega": 75},
    {"nombre": "Cúcuta", "departamento": "Norte de Santander", "tasa_entrega": 70},
    {"nombre": "Villavicencio", "departamento": "Meta", "tasa_entrega": 72},
]

# Productos de ejemplo
PRODUCTOS = [
    {"nombre": "Smartphone Samsung A54", "precio": 1200000, "costo": 800000},
    {"nombre": "Audífonos Bluetooth", "precio": 89000, "costo": 45000},
    {"nombre": "Smartwatch Xiaomi", "precio": 180000, "costo": 95000},
    {"nombre": "Cargador Rápido 65W", "precio": 75000, "costo": 35000},
    {"nombre": "Funda Premium iPhone", "precio": 45000, "costo": 15000},
    {"nombre": "Power Bank 20000mAh", "precio": 95000, "costo": 50000},
    {"nombre": "Cable USB-C 2m", "precio": 25000, "costo": 8000},
    {"nombre": "Soporte Celular Carro", "precio": 35000, "costo": 12000},
]


# ==================== FUNCIONES ====================

def generar_numero_guia(transportadora: Dict) -> str:
    """Genera número de guía aleatorio."""
    codigo = transportadora["codigo"]
    numero = random.randint(1000000000, 9999999999)
    return f"{codigo}{numero}"


def generar_pedido(fecha: datetime) -> Dict:
    """Genera un pedido aleatorio."""
    transportadora = random.choice(TRANSPORTADORAS)
    ciudad = random.choice(CIUDADES)
    producto = random.choice(PRODUCTOS)

    # Determinar si se entrega basado en tasas
    prob_entrega = (transportadora["tasa_base"] + ciudad["tasa_entrega"]) / 200
    entregado = random.random() < prob_entrega

    if entregado:
        estado = "ENTREGADO"
    else:
        estado = random.choice([e for e in ESTADOS_GUIA if e != "ENTREGADO"])

    # Calcular costos
    precio_flete = random.randint(8000, 15000)
    costo_devolucion = 0 if entregado else random.randint(5000, 12000)

    return {
        "id": f"PED-{random.randint(100000, 999999)}",
        "fecha_creacion": fecha.isoformat(),
        "fecha_despacho": (fecha + timedelta(hours=random.randint(2, 24))).isoformat(),
        "numero_guia": generar_numero_guia(transportadora),
        "transportadora": transportadora["nombre"],
        "estado_guia": estado,
        "ciudad_destino": ciudad["nombre"],
        "departamento": ciudad["departamento"],
        "producto": producto["nombre"],
        "valor_producto": producto["precio"],
        "costo_producto": producto["costo"],
        "precio_flete": precio_flete,
        "costo_devolucion": costo_devolucion,
        "valor_facturado": producto["precio"] + precio_flete,
        "ganancia": producto["precio"] - producto["costo"] - precio_flete - costo_devolucion,
        "cliente": {
            "nombre": f"Cliente {random.randint(1000, 9999)}",
            "telefono": f"3{random.randint(100000000, 199999999)}",
            "confirmado": random.random() > 0.1
        }
    }


def generar_pedidos(dias: int = 30, pedidos_por_dia: int = 50) -> List[Dict]:
    """Genera lista de pedidos para los últimos N días."""
    pedidos = []
    fecha_inicio = datetime.now() - timedelta(days=dias)

    for i in range(dias):
        fecha = fecha_inicio + timedelta(days=i)
        # Variación en cantidad de pedidos por día
        cantidad = pedidos_por_dia + random.randint(-15, 20)

        for _ in range(cantidad):
            hora_aleatoria = timedelta(
                hours=random.randint(7, 22),
                minutes=random.randint(0, 59)
            )
            pedidos.append(generar_pedido(fecha + hora_aleatoria))

    return pedidos


def calcular_metricas(pedidos: List[Dict]) -> Dict:
    """Calcula métricas agregadas de los pedidos."""
    total_pedidos = len(pedidos)
    entregados = sum(1 for p in pedidos if p["estado_guia"] == "ENTREGADO")

    total_facturado = sum(p["valor_facturado"] for p in pedidos)
    total_ganancia = sum(p["ganancia"] for p in pedidos)
    total_fletes = sum(p["precio_flete"] for p in pedidos)
    total_devoluciones = sum(p["costo_devolucion"] for p in pedidos)

    # Métricas por transportadora
    por_transportadora = {}
    for p in pedidos:
        t = p["transportadora"]
        if t not in por_transportadora:
            por_transportadora[t] = {"total": 0, "entregados": 0}
        por_transportadora[t]["total"] += 1
        if p["estado_guia"] == "ENTREGADO":
            por_transportadora[t]["entregados"] += 1

    transportadoras = [
        {
            "nombre": t,
            "pedidos": d["total"],
            "entregados": d["entregados"],
            "tasa_entrega": round(d["entregados"] / d["total"] * 100, 1) if d["total"] > 0 else 0
        }
        for t, d in por_transportadora.items()
    ]

    # Métricas por ciudad
    por_ciudad = {}
    for p in pedidos:
        c = p["ciudad_destino"]
        if c not in por_ciudad:
            por_ciudad[c] = {"total": 0, "entregados": 0}
        por_ciudad[c]["total"] += 1
        if p["estado_guia"] == "ENTREGADO":
            por_ciudad[c]["entregados"] += 1

    ciudades = [
        {
            "ciudad": c,
            "pedidos": d["total"],
            "entregados": d["entregados"],
            "tasa_entrega": round(d["entregados"] / d["total"] * 100, 1) if d["total"] > 0 else 0
        }
        for c, d in por_ciudad.items()
    ]

    return {
        "resumen": {
            "total_pedidos": total_pedidos,
            "entregados": entregados,
            "no_entregados": total_pedidos - entregados,
            "tasa_entrega": round(entregados / total_pedidos * 100, 1) if total_pedidos > 0 else 0,
            "total_facturado": total_facturado,
            "total_ganancia": total_ganancia,
            "margen_bruto": round(total_ganancia / total_facturado * 100, 1) if total_facturado > 0 else 0,
            "total_fletes": total_fletes,
            "total_devoluciones": total_devoluciones,
            "ticket_promedio": round(total_facturado / total_pedidos) if total_pedidos > 0 else 0,
            "ganancia_por_pedido": round(total_ganancia / entregados) if entregados > 0 else 0
        },
        "por_transportadora": sorted(transportadoras, key=lambda x: x["pedidos"], reverse=True),
        "por_ciudad": sorted(ciudades, key=lambda x: x["pedidos"], reverse=True)[:10],
        "alertas": generar_alertas(pedidos, transportadoras, ciudades)
    }


def generar_alertas(pedidos: List[Dict], transportadoras: List[Dict], ciudades: List[Dict]) -> List[Dict]:
    """Genera alertas basadas en los datos."""
    alertas = []

    # Alertas de transportadoras con baja tasa
    for t in transportadoras:
        if t["tasa_entrega"] < 75:
            alertas.append({
                "tipo": "critica",
                "categoria": "transportadora",
                "mensaje": f"{t['nombre']} tiene tasa de entrega muy baja: {t['tasa_entrega']}%",
                "accion": "Considerar cambio de transportadora o renegociar"
            })
        elif t["tasa_entrega"] < 82:
            alertas.append({
                "tipo": "advertencia",
                "categoria": "transportadora",
                "mensaje": f"{t['nombre']} tiene tasa de entrega mejorable: {t['tasa_entrega']}%",
                "accion": "Monitorear y establecer objetivos"
            })

    # Alertas de ciudades problemáticas
    for c in ciudades:
        if c["pedidos"] > 20 and c["tasa_entrega"] < 70:
            alertas.append({
                "tipo": "critica",
                "categoria": "zona",
                "mensaje": f"Ciudad {c['ciudad']} con alta tasa de no entrega: {100-c['tasa_entrega']}%",
                "accion": "Implementar doble confirmación para esta zona"
            })

    # Alerta de pedidos sin confirmar
    sin_confirmar = sum(1 for p in pedidos if not p["cliente"]["confirmado"])
    if sin_confirmar > len(pedidos) * 0.1:
        alertas.append({
            "tipo": "advertencia",
            "categoria": "proceso",
            "mensaje": f"{sin_confirmar} pedidos ({round(sin_confirmar/len(pedidos)*100, 1)}%) sin confirmar",
            "accion": "Mejorar proceso de confirmación antes del despacho"
        })

    return alertas


def guardar_demo_data(output_dir: str = "demo_data"):
    """Genera y guarda todos los datos de demo."""
    os.makedirs(output_dir, exist_ok=True)

    print("Generando datos de demo...")

    # Generar pedidos
    print("  - Generando pedidos (30 días)...")
    pedidos = generar_pedidos(dias=30, pedidos_por_dia=50)

    # Calcular métricas
    print("  - Calculando métricas...")
    metricas = calcular_metricas(pedidos)

    # Guardar archivos
    archivos = {
        "pedidos.json": pedidos,
        "metricas.json": metricas,
        "transportadoras.json": metricas["por_transportadora"],
        "ciudades.json": metricas["por_ciudad"],
        "alertas.json": metricas["alertas"],
        "resumen.json": metricas["resumen"]
    }

    for nombre, datos in archivos.items():
        ruta = os.path.join(output_dir, nombre)
        with open(ruta, 'w', encoding='utf-8') as f:
            json.dump(datos, f, ensure_ascii=False, indent=2)
        print(f"  - Guardado: {ruta}")

    # Mostrar resumen
    print("\n" + "="*50)
    print("RESUMEN DE DATOS GENERADOS")
    print("="*50)
    print(f"Total pedidos: {metricas['resumen']['total_pedidos']}")
    print(f"Entregados: {metricas['resumen']['entregados']} ({metricas['resumen']['tasa_entrega']}%)")
    print(f"Facturado: ${metricas['resumen']['total_facturado']:,.0f}")
    print(f"Ganancia: ${metricas['resumen']['total_ganancia']:,.0f}")
    print(f"Margen bruto: {metricas['resumen']['margen_bruto']}%")
    print(f"Alertas generadas: {len(metricas['alertas'])}")
    print("="*50)

    return metricas


# ==================== MAIN ====================

if __name__ == "__main__":
    # Cambiar al directorio del proyecto
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.dirname(script_dir)
    os.chdir(project_dir)

    # Generar datos
    metricas = guardar_demo_data("demo_data")

    print("\nDatos de demo generados exitosamente!")
    print("Ubicación: demo_data/")
    print("\nArchivos disponibles:")
    print("  - pedidos.json: Todos los pedidos simulados")
    print("  - metricas.json: Métricas agregadas")
    print("  - transportadoras.json: Rendimiento por transportadora")
    print("  - ciudades.json: Rendimiento por ciudad")
    print("  - alertas.json: Alertas generadas")
    print("  - resumen.json: Resumen ejecutivo")
