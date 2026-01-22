"""
RUTAS API PARA CHAT SKILLS
==========================

Endpoints FastAPI para los skills del AdminChat.
Cada skill tiene su propio endpoint que retorna datos estructurados.

Endpoints:
- GET  /chat/skills              - Lista de skills disponibles
- GET  /chat/dashboard           - Dashboard con métricas principales
- GET  /chat/reporte             - Reporte de período
- GET  /chat/guias               - Estado de guías
- GET  /chat/tracking/{guia}     - Tracking de guía específica
- GET  /chat/finanzas            - Análisis financiero
- GET  /chat/alertas             - Alertas del sistema
- GET  /chat/transportadoras     - Métricas de transportadoras
- GET  /chat/clientes            - Información de clientes
- POST /chat/exportar            - Exportar datos
- POST /chat/enviar              - Enviar notificación
- POST /chat/predecir            - Predecir retraso
- POST /chat/entrenar            - Iniciar entrenamiento
- GET  /chat/config              - Configuración del sistema

Autor: Litper IA System
Version: 1.0.0
"""

import os
import json
from datetime import datetime, timedelta
from typing import Optional, List
import random

from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel, Field
from loguru import logger

from .admin_routes import verificar_token

# ==================== ROUTER ====================

router = APIRouter(
    prefix="/chat",
    tags=["Chat Skills"],
    responses={
        401: {"description": "No autorizado"},
        500: {"description": "Error interno"}
    }
)


# ==================== MODELOS ====================

class SkillInfo(BaseModel):
    name: str
    description: str
    category: str
    icon: str
    usage: str


class MetricCard(BaseModel):
    label: str
    value: str
    change: Optional[float] = None
    trend: Optional[str] = None


class AlertInfo(BaseModel):
    tipo: str
    mensaje: str
    accion: Optional[str] = None
    fecha: Optional[str] = None


# ==================== DATOS DE DEMO ====================

def cargar_datos_demo():
    """Carga datos de demo si existen."""
    demo_dir = os.path.join(os.path.dirname(__file__), "..", "..", "demo_data")

    datos = {
        "pedidos": [],
        "metricas": {},
        "transportadoras": [],
        "alertas": []
    }

    archivos = ["pedidos.json", "metricas.json", "transportadoras.json", "alertas.json"]

    for archivo in archivos:
        ruta = os.path.join(demo_dir, archivo)
        if os.path.exists(ruta):
            try:
                with open(ruta, 'r', encoding='utf-8') as f:
                    key = archivo.replace(".json", "")
                    datos[key] = json.load(f)
            except Exception as e:
                logger.warning(f"Error cargando {archivo}: {e}")

    return datos


def generar_datos_simulados():
    """Genera datos simulados si no hay datos de demo."""
    total_pedidos = random.randint(1200, 1800)
    entregados = int(total_pedidos * random.uniform(0.78, 0.88))

    return {
        "resumen": {
            "total_pedidos": total_pedidos,
            "entregados": entregados,
            "no_entregados": total_pedidos - entregados,
            "tasa_entrega": round(entregados / total_pedidos * 100, 1),
            "total_facturado": random.randint(80000000, 150000000),
            "total_ganancia": random.randint(15000000, 35000000),
            "margen_bruto": random.uniform(18, 28),
            "ticket_promedio": random.randint(85000, 120000)
        },
        "transportadoras": [
            {"nombre": "Servientrega", "pedidos": 450, "tasa_entrega": 87.5},
            {"nombre": "Coordinadora", "pedidos": 380, "tasa_entrega": 84.2},
            {"nombre": "Interrapidisimo", "pedidos": 290, "tasa_entrega": 81.0},
            {"nombre": "TCC", "pedidos": 220, "tasa_entrega": 79.5},
            {"nombre": "Envía", "pedidos": 180, "tasa_entrega": 76.8},
        ],
        "alertas": [
            {
                "tipo": "advertencia",
                "mensaje": "Tasa de entrega por debajo del objetivo (85%)",
                "accion": "Revisar procesos de confirmación"
            },
            {
                "tipo": "info",
                "mensaje": "Nuevo récord de ventas diarias ayer",
                "accion": None
            }
        ]
    }


# ==================== ENDPOINTS ====================

@router.get("/skills", summary="Lista de skills disponibles")
async def listar_skills():
    """Retorna la lista de skills disponibles en el chat."""
    skills = [
        SkillInfo(
            name="dashboard",
            description="Panel principal con métricas clave",
            category="reportes",
            icon="📊",
            usage="/dashboard"
        ),
        SkillInfo(
            name="reporte",
            description="Reporte detallado del período",
            category="reportes",
            icon="📈",
            usage="/reporte [hoy|semana|mes]"
        ),
        SkillInfo(
            name="guias",
            description="Estado de guías y envíos",
            category="operaciones",
            icon="📦",
            usage="/guias [estado]"
        ),
        SkillInfo(
            name="tracking",
            description="Rastrear guía específica",
            category="operaciones",
            icon="🔍",
            usage="/tracking [numero_guia]"
        ),
        SkillInfo(
            name="finanzas",
            description="Análisis financiero",
            category="finanzas",
            icon="💰",
            usage="/finanzas [periodo]"
        ),
        SkillInfo(
            name="alertas",
            description="Alertas del sistema",
            category="operaciones",
            icon="⚠️",
            usage="/alertas"
        ),
        SkillInfo(
            name="transportadora",
            description="Métricas de transportadoras",
            category="operaciones",
            icon="🚚",
            usage="/transportadora [nombre]"
        ),
        SkillInfo(
            name="clientes",
            description="Información de clientes",
            category="clientes",
            icon="👥",
            usage="/clientes [buscar]"
        ),
        SkillInfo(
            name="exportar",
            description="Exportar datos",
            category="reportes",
            icon="📥",
            usage="/exportar [tipo]"
        ),
        SkillInfo(
            name="predecir",
            description="Predecir retraso de guía",
            category="operaciones",
            icon="🔮",
            usage="/predecir [guia]"
        ),
        SkillInfo(
            name="config",
            description="Configuración del sistema",
            category="configuracion",
            icon="⚙️",
            usage="/config"
        ),
        SkillInfo(
            name="ayuda",
            description="Ayuda y comandos",
            category="ayuda",
            icon="❓",
            usage="/ayuda"
        ),
    ]

    return {"skills": [s.dict() for s in skills], "total": len(skills)}


@router.get("/dashboard", summary="Dashboard principal")
async def dashboard(_: bool = Depends(verificar_token)):
    """Retorna métricas principales del dashboard."""
    datos = cargar_datos_demo()

    if datos["metricas"]:
        resumen = datos["metricas"].get("resumen", {})
    else:
        resumen = generar_datos_simulados()["resumen"]

    # Calcular cambios (simulados)
    cambio_ventas = random.uniform(-5, 15)
    cambio_entrega = random.uniform(-3, 5)
    cambio_margen = random.uniform(-2, 4)

    return {
        "titulo": "Dashboard - Resumen del Día",
        "fecha": datetime.now().strftime("%Y-%m-%d"),
        "cards": [
            {
                "label": "Ventas Totales",
                "value": f"${resumen.get('total_facturado', 0):,.0f}",
                "change": round(cambio_ventas, 1),
                "trend": "up" if cambio_ventas > 0 else "down"
            },
            {
                "label": "Pedidos",
                "value": str(resumen.get("total_pedidos", 0)),
                "change": None,
                "trend": None
            },
            {
                "label": "Tasa Entrega",
                "value": f"{resumen.get('tasa_entrega', 0)}%",
                "change": round(cambio_entrega, 1),
                "trend": "up" if cambio_entrega > 0 else "down"
            },
            {
                "label": "Margen Bruto",
                "value": f"{resumen.get('margen_bruto', 0):.1f}%",
                "change": round(cambio_margen, 1),
                "trend": "up" if cambio_margen > 0 else "down"
            }
        ],
        "metricas_secundarias": {
            "entregados": resumen.get("entregados", 0),
            "no_entregados": resumen.get("no_entregados", 0),
            "ticket_promedio": resumen.get("ticket_promedio", 0),
            "ganancia_por_pedido": resumen.get("ganancia_por_pedido", 0)
        }
    }


@router.get("/reporte", summary="Reporte de período")
async def reporte(
    periodo: str = Query("hoy", description="hoy, semana, mes"),
    _: bool = Depends(verificar_token)
):
    """Genera reporte del período especificado."""
    datos = cargar_datos_demo()

    if datos["metricas"]:
        base = datos["metricas"].get("resumen", {})
    else:
        base = generar_datos_simulados()["resumen"]

    # Ajustar según período
    multiplicador = {"hoy": 1, "semana": 7, "mes": 30}.get(periodo, 1)

    return {
        "titulo": f"Reporte - {periodo.capitalize()}",
        "periodo": periodo,
        "fecha_inicio": (datetime.now() - timedelta(days=multiplicador-1)).strftime("%Y-%m-%d"),
        "fecha_fin": datetime.now().strftime("%Y-%m-%d"),
        "resumen": {
            "ventas": base.get("total_facturado", 0) * multiplicador // 30,
            "ganancia": base.get("total_ganancia", 0) * multiplicador // 30,
            "pedidos": base.get("total_pedidos", 0) * multiplicador // 30,
            "tasa_entrega": base.get("tasa_entrega", 0),
            "margen": base.get("margen_bruto", 0)
        },
        "comparacion": {
            "vs_periodo_anterior": random.uniform(-10, 20),
            "vs_mismo_periodo_anio": random.uniform(-5, 30)
        }
    }


@router.get("/guias", summary="Estado de guías")
async def guias(
    estado: Optional[str] = Query(None, description="Filtrar por estado"),
    _: bool = Depends(verificar_token)
):
    """Retorna estado de las guías."""
    datos = cargar_datos_demo()
    pedidos = datos.get("pedidos", [])

    # Agrupar por estado
    por_estado = {}
    for p in pedidos[-100:]:  # Últimos 100
        estado_guia = p.get("estado_guia", "DESCONOCIDO")
        if estado_guia not in por_estado:
            por_estado[estado_guia] = 0
        por_estado[estado_guia] += 1

    # Si no hay datos, generar simulados
    if not por_estado:
        por_estado = {
            "ENTREGADO": 65,
            "EN TRANSITO": 15,
            "EN CENTRO DE DISTRIBUCION": 8,
            "DEVOLUCION": 5,
            "NO ENTREGADO": 4,
            "PENDIENTE": 3
        }

    return {
        "titulo": "Estado de Guías",
        "total": sum(por_estado.values()),
        "por_estado": [
            {"estado": k, "cantidad": v, "porcentaje": round(v/sum(por_estado.values())*100, 1)}
            for k, v in sorted(por_estado.items(), key=lambda x: x[1], reverse=True)
        ],
        "filtro_aplicado": estado
    }


@router.get("/tracking/{numero_guia}", summary="Tracking de guía")
async def tracking(
    numero_guia: str,
    _: bool = Depends(verificar_token)
):
    """Retorna tracking de una guía específica."""
    # Simular tracking
    eventos = [
        {"fecha": (datetime.now() - timedelta(days=3)).isoformat(), "estado": "RECOGIDO", "ubicacion": "Bodega origen"},
        {"fecha": (datetime.now() - timedelta(days=2)).isoformat(), "estado": "EN TRANSITO", "ubicacion": "Centro distribución Bogotá"},
        {"fecha": (datetime.now() - timedelta(days=1)).isoformat(), "estado": "EN CENTRO DESTINO", "ubicacion": "Centro distribución Medellín"},
        {"fecha": datetime.now().isoformat(), "estado": "EN REPARTO", "ubicacion": "Ruta de entrega"}
    ]

    return {
        "numero_guia": numero_guia,
        "estado_actual": "EN REPARTO",
        "transportadora": "Servientrega",
        "origen": "Bogotá",
        "destino": "Medellín",
        "eventos": eventos,
        "estimado_entrega": (datetime.now() + timedelta(hours=4)).isoformat()
    }


@router.get("/finanzas", summary="Análisis financiero")
async def finanzas(
    periodo: str = Query("mes", description="semana, mes, trimestre"),
    _: bool = Depends(verificar_token)
):
    """Retorna análisis financiero."""
    datos = cargar_datos_demo()

    if datos["metricas"]:
        base = datos["metricas"].get("resumen", {})
    else:
        base = generar_datos_simulados()["resumen"]

    return {
        "titulo": f"Análisis Financiero - {periodo.capitalize()}",
        "periodo": periodo,
        "ingresos": {
            "ventas_brutas": base.get("total_facturado", 0),
            "devoluciones": base.get("total_facturado", 0) * 0.08,
            "ventas_netas": base.get("total_facturado", 0) * 0.92
        },
        "costos": {
            "costo_producto": base.get("total_facturado", 0) * 0.55,
            "costo_envio": base.get("total_facturado", 0) * 0.12,
            "costo_devoluciones": base.get("total_facturado", 0) * 0.05,
            "otros": base.get("total_facturado", 0) * 0.03
        },
        "utilidad": {
            "bruta": base.get("total_ganancia", 0),
            "margen_bruto": base.get("margen_bruto", 0),
            "operativa": base.get("total_ganancia", 0) * 0.85,
            "margen_operativo": base.get("margen_bruto", 0) * 0.85
        },
        "proyeccion": {
            "siguiente_mes": base.get("total_ganancia", 0) * 1.1,
            "tendencia": "creciente"
        }
    }


@router.get("/alertas", summary="Alertas del sistema")
async def alertas(_: bool = Depends(verificar_token)):
    """Retorna alertas activas del sistema."""
    datos = cargar_datos_demo()
    alertas_data = datos.get("alertas", [])

    if not alertas_data:
        alertas_data = generar_datos_simulados()["alertas"]

    # Agregar timestamp
    for a in alertas_data:
        if "fecha" not in a:
            a["fecha"] = datetime.now().isoformat()

    return {
        "titulo": "Alertas del Sistema",
        "total": len(alertas_data),
        "criticas": len([a for a in alertas_data if a.get("tipo") == "critica"]),
        "advertencias": len([a for a in alertas_data if a.get("tipo") == "advertencia"]),
        "alertas": alertas_data
    }


@router.get("/transportadoras", summary="Métricas de transportadoras")
async def transportadoras(
    nombre: Optional[str] = Query(None, description="Filtrar por nombre"),
    _: bool = Depends(verificar_token)
):
    """Retorna métricas de transportadoras."""
    datos = cargar_datos_demo()
    transp = datos.get("transportadoras", [])

    if not transp:
        transp = generar_datos_simulados()["transportadoras"]

    if nombre:
        transp = [t for t in transp if nombre.lower() in t.get("nombre", "").lower()]

    return {
        "titulo": "Métricas de Transportadoras",
        "total": len(transp),
        "transportadoras": transp,
        "mejor": max(transp, key=lambda x: x.get("tasa_entrega", 0)) if transp else None,
        "peor": min(transp, key=lambda x: x.get("tasa_entrega", 100)) if transp else None
    }


@router.get("/clientes", summary="Información de clientes")
async def clientes(
    buscar: Optional[str] = Query(None, description="Buscar cliente"),
    _: bool = Depends(verificar_token)
):
    """Retorna información de clientes."""
    # Datos simulados
    clientes_data = [
        {"id": "CLI001", "nombre": "Juan Pérez", "pedidos": 15, "valor_total": 2500000, "tasa_entrega": 93},
        {"id": "CLI002", "nombre": "María García", "pedidos": 8, "valor_total": 1200000, "tasa_entrega": 87},
        {"id": "CLI003", "nombre": "Carlos López", "pedidos": 12, "valor_total": 1800000, "tasa_entrega": 91},
    ]

    if buscar:
        clientes_data = [c for c in clientes_data if buscar.lower() in c.get("nombre", "").lower()]

    return {
        "titulo": "Gestión de Clientes",
        "total": len(clientes_data),
        "clientes": clientes_data,
        "resumen": {
            "total_clientes": 1250,
            "activos_mes": 380,
            "nuevos_mes": 45,
            "ticket_promedio": 95000
        }
    }


@router.post("/predecir", summary="Predecir retraso")
async def predecir(
    guia: str = Query(..., description="Número de guía"),
    _: bool = Depends(verificar_token)
):
    """Predice probabilidad de retraso de una guía."""
    # Simulación de predicción
    prob_retraso = random.uniform(0.1, 0.5)

    return {
        "guia": guia,
        "probabilidad_retraso": round(prob_retraso * 100, 1),
        "riesgo": "alto" if prob_retraso > 0.4 else "medio" if prob_retraso > 0.25 else "bajo",
        "factores": [
            {"factor": "Zona destino", "impacto": random.uniform(0.1, 0.3)},
            {"factor": "Transportadora", "impacto": random.uniform(0.05, 0.2)},
            {"factor": "Historial cliente", "impacto": random.uniform(0.05, 0.15)}
        ],
        "recomendacion": "Contactar al cliente para confirmar disponibilidad" if prob_retraso > 0.3 else "Seguimiento normal"
    }


@router.get("/config", summary="Configuración del sistema")
async def config(_: bool = Depends(verificar_token)):
    """Retorna configuración del sistema."""
    return {
        "titulo": "Configuración del Sistema",
        "general": {
            "empresa": "Litper Pro",
            "version": "2.0.0",
            "ambiente": os.getenv("ENV", "development")
        },
        "metas": {
            "margen_bruto": 40,
            "tasa_entrega": 85,
            "roas_minimo": 3,
            "ticket_promedio_objetivo": 100000
        },
        "integraciones": {
            "dropi": {"activo": True, "ultimo_sync": datetime.now().isoformat()},
            "transportadoras": {"activo": True, "cantidad": 6},
            "ia": {"claude": True, "openai": True, "gemini": True}
        },
        "notificaciones": {
            "email": os.getenv("REPORT_EMAIL", "admin@litper.co"),
            "alertas_criticas": True,
            "reporte_diario": True
        }
    }


# ==================== FUNCION PARA REGISTRAR RUTAS ====================

def incluir_rutas_chat(app):
    """
    Incluye las rutas de chat skills en la aplicación FastAPI.

    Uso en main.py:
        from knowledge_system.chat_skills_routes import incluir_rutas_chat
        incluir_rutas_chat(app)
    """
    app.include_router(router)
    logger.info("Rutas de Chat Skills registradas")
