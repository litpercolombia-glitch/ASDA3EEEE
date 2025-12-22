"""
API REST Principal de FastAPI para el Sistema ML de Litper Logística.
Proporciona endpoints para todas las funcionalidades del sistema.
"""

import os
import sys
from datetime import datetime, timedelta
from typing import Optional, List, Dict
from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy import func, Integer, cast
from sqlalchemy.orm import Session
from loguru import logger
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Configurar logging
logger.remove()
logger.add(
    sys.stdout,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan> - <level>{message}</level>",
    level=os.getenv('LOG_LEVEL', 'INFO')
)
logger.add(
    "logs/api_{time:YYYY-MM-DD}.log",
    rotation="1 day",
    retention="30 days",
    level="DEBUG"
)

# Imports del proyecto
from database import (
    get_session, init_database, crear_configuraciones_default,
    verificar_conexion, set_config, get_all_configs, GuiaHistorica, ArchivoCargado, MetricaModelo, ConversacionChat,
    PrediccionTiempoReal, AlertaSistema,
    NivelRiesgo, SeveridadAlerta, TipoAlerta
)
from excel_processor import excel_processor
from chat_inteligente import chat_inteligente
from ml_models import gestor_modelos
from reentrenamiento import sistema_reentrenamiento

# Sistema de Conocimiento Multi-Fuente
try:
    from knowledge_system.knowledge_routes import router as knowledge_router
    KNOWLEDGE_SYSTEM_AVAILABLE = True
    logger.info("📚 Sistema de Conocimiento cargado")
except ImportError as e:
    KNOWLEDGE_SYSTEM_AVAILABLE = False
    logger.warning(f"Sistema de Conocimiento no disponible: {e}")

# Sistema de Asistente IA
try:
    from knowledge_system.assistant_routes import router as assistant_router
    ASSISTANT_SYSTEM_AVAILABLE = True
    logger.info("🤖 Sistema de Asistente IA cargado")
except ImportError as e:
    ASSISTANT_SYSTEM_AVAILABLE = False
    logger.warning(f"Sistema de Asistente no disponible: {e}")

# Sistema de Administracion
try:
    from knowledge_system.admin_routes import router as admin_router
    ADMIN_SYSTEM_AVAILABLE = True
    logger.info("🔐 Sistema de Administracion cargado")
except ImportError as e:
    ADMIN_SYSTEM_AVAILABLE = False
    logger.warning(f"Sistema de Administracion no disponible: {e}")

# Sistema de Tracking Multi-Transportadora
try:
    from routes.tracking_routes import router as tracking_router
    TRACKING_SYSTEM_AVAILABLE = True
    logger.info("🚚 Sistema de Tracking cargado")
except ImportError as e:
    TRACKING_SYSTEM_AVAILABLE = False
    logger.warning(f"Sistema de Tracking no disponible: {e}")

# Sistema de Rescate de Guías
try:
    from routes.rescue_routes import router as rescue_router
    RESCUE_SYSTEM_AVAILABLE = True
    logger.info("🆘 Sistema de Rescate cargado")
except ImportError as e:
    RESCUE_SYSTEM_AVAILABLE = False
    logger.warning(f"Sistema de Rescate no disponible: {e}")

# Sistema de WhatsApp
try:
    from routes.whatsapp_routes import router as whatsapp_router
    WHATSAPP_SYSTEM_AVAILABLE = True
    logger.info("💬 Sistema de WhatsApp cargado")
except ImportError as e:
    WHATSAPP_SYSTEM_AVAILABLE = False
    logger.warning(f"Sistema de WhatsApp no disponible: {e}")

# Sistema de WebSocket
try:
    from routes.websocket_routes import router as websocket_router
    WEBSOCKET_SYSTEM_AVAILABLE = True
    logger.info("🔌 Sistema de WebSocket cargado")
except ImportError as e:
    WEBSOCKET_SYSTEM_AVAILABLE = False
    logger.warning(f"Sistema de WebSocket no disponible: {e}")

# Sistema de Push Notifications
try:
    from routes.push_routes import router as push_router
    PUSH_SYSTEM_AVAILABLE = True
    logger.info("🔔 Sistema de Push Notifications cargado")
except ImportError as e:
    PUSH_SYSTEM_AVAILABLE = False
    logger.warning(f"Sistema de Push no disponible: {e}")

# Sistema de Webhooks
try:
    from routes.webhook_routes import router as webhook_router
    WEBHOOK_SYSTEM_AVAILABLE = True
    logger.info("🪝 Sistema de Webhooks cargado")
except ImportError as e:
    WEBHOOK_SYSTEM_AVAILABLE = False
    logger.warning(f"Sistema de Webhooks no disponible: {e}")

# Sistema de Cerebro Autónomo (Claude AI)
try:
    from routes.brain_routes import router as brain_router
    BRAIN_SYSTEM_AVAILABLE = True
    logger.info("🧠 Sistema de Cerebro Autónomo cargado")
except ImportError as e:
    BRAIN_SYSTEM_AVAILABLE = False
    logger.warning(f"Sistema de Cerebro no disponible: {e}")


# ==================== CONFIGURACIÓN ====================

# Tiempo de inicio del servidor
START_TIME = datetime.now()

# Lista de orígenes permitidos para CORS
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "https://litper-logistica.vercel.app",
    "https://*.vercel.app",
]

# ==================== MODELOS PYDANTIC ====================

class PreguntaChatRequest(BaseModel):
    """Request para preguntar al chat"""
    pregunta: str = Field(..., min_length=1, max_length=2000)
    usar_contexto: bool = True
    session_id: Optional[str] = None


class PrediccionRequest(BaseModel):
    """Request para hacer predicción"""
    numero_guia: str = Field(..., min_length=5, max_length=50)


class PrediccionMasivaRequest(BaseModel):
    """Request para predicciones masivas"""
    numeros_guias: List[str]


class ConfigUpdateRequest(BaseModel):
    """Request para actualizar configuración"""
    valor: str


class AlertaCreateRequest(BaseModel):
    """Request para crear alerta"""
    tipo: str
    severidad: str
    titulo: str
    descripcion: Optional[str] = None
    condicion: Optional[Dict] = None


class ReporteGenerateRequest(BaseModel):
    """Request para generar reporte"""
    tipo: str  # PDF, EXCEL, CSV
    filtros: Optional[Dict] = {}


# ==================== LIFECYCLE ====================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Maneja el ciclo de vida de la aplicación"""
    logger.info("Iniciando aplicación Litper ML API...")

    # Inicializar base de datos
    if verificar_conexion():
        logger.success("Conexión a base de datos establecida")
        init_database()
        crear_configuraciones_default()
    else:
        logger.error("No se pudo conectar a la base de datos")

    # Iniciar scheduler de reentrenamiento
    try:
        sistema_reentrenamiento.iniciar_programacion()
    except Exception as e:
        logger.warning(f"No se pudo iniciar scheduler: {e}")

    yield

    # Cleanup
    logger.info("Deteniendo aplicación...")
    sistema_reentrenamiento.detener()


# ==================== APP ====================

app = FastAPI(
    title="Litper ML API",
    description="API de Machine Learning para Litper Logística Colombia",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, especificar dominios
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir router del Sistema de Conocimiento
if KNOWLEDGE_SYSTEM_AVAILABLE:
    app.include_router(knowledge_router, prefix="/api")
    logger.success("📚 Rutas de conocimiento registradas en /api/knowledge")

# Incluir router del Asistente IA
if ASSISTANT_SYSTEM_AVAILABLE:
    app.include_router(assistant_router, prefix="/api")
    logger.success("🤖 Rutas de asistente registradas en /api/assistant")

# Incluir router de Administracion
if ADMIN_SYSTEM_AVAILABLE:
    app.include_router(admin_router, prefix="/api")
    logger.success("🔐 Rutas de administracion registradas en /api/admin")

# Incluir router de Tracking
if TRACKING_SYSTEM_AVAILABLE:
    app.include_router(tracking_router, prefix="/api")
    logger.success("🚚 Rutas de tracking registradas en /api/tracking")

# Incluir router de Rescate
if RESCUE_SYSTEM_AVAILABLE:
    app.include_router(rescue_router, prefix="/api")
    logger.success("🆘 Rutas de rescate registradas en /api/rescue")

# Incluir router de WhatsApp
if WHATSAPP_SYSTEM_AVAILABLE:
    app.include_router(whatsapp_router, prefix="/api")
    logger.success("💬 Rutas de WhatsApp registradas en /api/whatsapp")

# Incluir router de WebSocket
if WEBSOCKET_SYSTEM_AVAILABLE:
    app.include_router(websocket_router)
    logger.success("🔌 WebSocket registrado en /ws")

# Incluir router de Push Notifications
if PUSH_SYSTEM_AVAILABLE:
    app.include_router(push_router)
    logger.success("🔔 Rutas de Push registradas en /api/push")

# Incluir router de Webhooks
if WEBHOOK_SYSTEM_AVAILABLE:
    app.include_router(webhook_router)
    logger.success("🪝 Rutas de Webhooks registradas en /api/webhooks")

# Incluir router del Cerebro Autónomo
if BRAIN_SYSTEM_AVAILABLE:
    app.include_router(brain_router)
    logger.success("🧠 Rutas del Cerebro Autónomo registradas en /api/brain")


# ==================== ENDPOINTS DE SISTEMA ====================

@app.get("/health")
async def health_check():
    """Verifica el estado de salud del sistema"""
    db_ok = verificar_conexion()
    modelos_ok = gestor_modelos.modelo_retrasos.esta_entrenado

    uptime = (datetime.now() - START_TIME).total_seconds()

    status = "healthy"
    if not db_ok:
        status = "unhealthy"
    elif not modelos_ok:
        status = "degraded"

    return {
        "status": status,
        "database": db_ok,
        "ml_models_loaded": modelos_ok,
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0",
        "uptime_seconds": round(uptime)
    }


@app.get("/config")
async def get_all_configurations():
    """Obtiene todas las configuraciones del sistema"""
    return get_all_configs()


@app.put("/config/{clave}")
async def update_configuration(clave: str, request: ConfigUpdateRequest):
    """Actualiza una configuración específica"""
    if set_config(clave, request.valor):
        return {"exito": True, "clave": clave, "valor": request.valor}
    raise HTTPException(status_code=500, detail="Error actualizando configuración")


# ==================== ENDPOINTS DE MEMORIA (EXCEL) ====================

@app.post("/memoria/cargar-excel")
async def cargar_excel(
    archivo: UploadFile = File(...),
    session: Session = Depends(get_session)
):
    """
    Sube y procesa un archivo Excel con datos de guías.
    """
    logger.info(f"Recibiendo archivo: {archivo.filename}")

    # Validar extensión
    if not archivo.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(
            status_code=400,
            detail="Solo se permiten archivos Excel (.xlsx, .xls)"
        )

    try:
        # Leer contenido
        contenido = await archivo.read()

        # Procesar
        resultado = excel_processor.procesar_archivo(
            archivo_bytes=contenido,
            nombre_archivo=archivo.filename,
            session=session,
            usuario='api'
        )

        return resultado

    except Exception as e:
        logger.error(f"Error procesando archivo: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/memoria/archivos")
async def listar_archivos(session: Session = Depends(get_session)):
    """Lista todos los archivos cargados"""
    archivos = session.query(ArchivoCargado).order_by(
        ArchivoCargado.fecha_carga.desc()
    ).limit(50).all()

    return [
        {
            "id": a.id,
            "nombre_archivo": a.nombre_archivo,
            "fecha_carga": a.fecha_carga.isoformat(),
            "total_registros": a.total_registros,
            "registros_procesados": a.registros_procesados,
            "estado": a.estado.value if a.estado else None,
            "usuario_carga": a.usuario_carga
        }
        for a in archivos
    ]


@app.get("/memoria/estadisticas")
async def get_estadisticas_memoria(session: Session = Depends(get_session)):
    """Obtiene estadísticas del sistema de memoria"""
    total_archivos = session.query(func.count(ArchivoCargado.id)).scalar() or 0
    total_registros = session.query(func.count(GuiaHistorica.id)).scalar() or 0

    ultimo_archivo = session.query(ArchivoCargado).order_by(
        ArchivoCargado.fecha_carga.desc()
    ).first()

    return {
        "total_archivos": total_archivos,
        "total_registros": total_registros,
        "ultimo_archivo": ultimo_archivo.nombre_archivo if ultimo_archivo else None,
        "fecha_ultima_carga": ultimo_archivo.fecha_carga.isoformat() if ultimo_archivo else None,
    }


# ==================== ENDPOINTS DE ML ====================

@app.post("/ml/entrenar")
async def entrenar_modelos(session: Session = Depends(get_session)):
    """
    Entrena todos los modelos ML con los datos disponibles.
    """
    logger.info("Solicitud de entrenamiento de modelos recibida")

    resultado = sistema_reentrenamiento.ejecutar_reentrenamiento(manual=True)

    if not resultado.get('exito'):
        raise HTTPException(status_code=400, detail=resultado.get('mensaje'))

    return resultado


@app.post("/ml/predecir")
async def predecir_retraso(
    request: PrediccionRequest,
    session: Session = Depends(get_session)
):
    """
    Realiza predicción de retraso para una guía específica.
    """
    # Buscar guía en BD
    guia = session.query(GuiaHistorica).filter(
        GuiaHistorica.numero_guia == request.numero_guia
    ).first()

    if guia:
        datos_guia = guia.to_dict()
    else:
        # Usar datos mínimos si no existe
        datos_guia = {'numero_guia': request.numero_guia}

    try:
        prediccion = gestor_modelos.predecir_retraso(datos_guia)

        # Guardar predicción
        pred_registro = PrediccionTiempoReal(
            numero_guia=request.numero_guia,
            guia_id=guia.id if guia else None,
            probabilidad_entrega_tiempo=1 - prediccion.get('probabilidad_retraso', 0),
            nivel_riesgo=NivelRiesgo[prediccion.get('nivel_riesgo', 'MEDIO')],
            factores_riesgo=prediccion.get('factores_riesgo', []),
            acciones_recomendadas=prediccion.get('acciones_recomendadas', []),
            modelo_usado=prediccion.get('modelo_usado'),
            version_modelo=prediccion.get('version'),
            confianza_prediccion=prediccion.get('confianza'),
        )
        session.add(pred_registro)
        session.commit()

        # Actualizar guía si existe
        if guia:
            guia.probabilidad_retraso = prediccion.get('probabilidad_retraso')
            guia.nivel_riesgo = prediccion.get('nivel_riesgo')
            session.commit()

        return {
            "numero_guia": request.numero_guia,
            "probabilidad_retraso": prediccion.get('probabilidad_retraso'),
            "nivel_riesgo": prediccion.get('nivel_riesgo'),
            "dias_estimados_entrega": prediccion.get('dias_estimados_entrega', 5),
            "fecha_estimada_entrega": (datetime.now() + timedelta(days=5)).isoformat(),
            "factores_riesgo": prediccion.get('factores_riesgo', []),
            "acciones_recomendadas": prediccion.get('acciones_recomendadas', []),
            "confianza": prediccion.get('confianza', 0.5),
            "modelo_usado": prediccion.get('modelo_usado'),
        }

    except Exception as e:
        logger.error(f"Error en predicción: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/ml/prediccion-masiva")
async def prediccion_masiva(
    request: PrediccionMasivaRequest,
    session: Session = Depends(get_session)
):
    """Realiza predicciones para múltiples guías"""
    resultados = []

    for numero in request.numeros_guias[:100]:  # Limitar a 100
        guia = session.query(GuiaHistorica).filter(
            GuiaHistorica.numero_guia == numero
        ).first()

        datos = guia.to_dict() if guia else {'numero_guia': numero}
        pred = gestor_modelos.predecir_retraso(datos)

        resultados.append({
            "numero_guia": numero,
            "probabilidad_retraso": pred.get('probabilidad_retraso'),
            "nivel_riesgo": pred.get('nivel_riesgo'),
        })

    return resultados


@app.get("/ml/metricas")
async def get_metricas_modelos(session: Session = Depends(get_session)):
    """Obtiene métricas de los modelos activos"""
    metricas = session.query(MetricaModelo).filter(
        MetricaModelo.esta_activo
    ).all()

    return [
        {
            "nombre_modelo": m.nombre_modelo,
            "version": m.version,
            "accuracy": m.accuracy,
            "precision": m.precision,
            "recall": m.recall,
            "f1_score": m.f1_score,
            "roc_auc": m.roc_auc,
            "fecha_entrenamiento": m.fecha_entrenamiento.isoformat(),
            "total_registros_entrenamiento": m.total_registros_entrenamiento,
            "features_importantes": m.features_importantes or []
        }
        for m in metricas
    ]


@app.get("/ml/estado-entrenamiento")
async def get_estado_entrenamiento():
    """Verifica si se necesita reentrenamiento"""
    return sistema_reentrenamiento.verificar_necesidad_reentrenamiento()


# ==================== ENDPOINTS DE CHAT ====================

@app.post("/chat/preguntar")
async def chat_preguntar(
    request: PreguntaChatRequest,
    session: Session = Depends(get_session)
):
    """
    Envía una pregunta al chat inteligente con IA.
    """
    logger.info(f"Pregunta recibida: {request.pregunta[:50]}...")

    try:
        respuesta = await chat_inteligente.responder(
            pregunta=request.pregunta,
            session=session,
            usar_contexto=request.usar_contexto,
            session_id=request.session_id
        )

        return respuesta

    except Exception as e:
        logger.error(f"Error en chat: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/chat/historial")
async def get_chat_historial(
    limite: int = Query(50, ge=1, le=200),
    session: Session = Depends(get_session)
):
    """Obtiene el historial de conversaciones"""
    conversaciones = session.query(ConversacionChat).order_by(
        ConversacionChat.fecha_conversacion.desc()
    ).limit(limite).all()

    return [
        {
            "id": c.id,
            "pregunta": c.pregunta_usuario,
            "respuesta": c.respuesta_ia,
            "fecha": c.fecha_conversacion.isoformat(),
            "tipo_consulta": c.tipo_consulta
        }
        for c in conversaciones
    ]


# ==================== ENDPOINTS DE DASHBOARD ====================

@app.get("/dashboard/resumen")
async def get_dashboard_resumen(session: Session = Depends(get_session)):
    """
    Obtiene el resumen completo para el dashboard.
    """
    # Estadísticas generales
    total_guias = session.query(func.count(GuiaHistorica.id)).scalar() or 0
    guias_entregadas = session.query(func.count(GuiaHistorica.id)).filter(
        GuiaHistorica.estatus.ilike('%entregad%')
    ).scalar() or 0
    guias_retraso = session.query(func.count(GuiaHistorica.id)).filter(
        GuiaHistorica.tiene_retraso
    ).scalar() or 0
    guias_novedad = session.query(func.count(GuiaHistorica.id)).filter(
        GuiaHistorica.tiene_novedad
    ).scalar() or 0

    # Rendimiento por transportadora
    transportadoras = session.query(
        GuiaHistorica.transportadora,
        func.count(GuiaHistorica.id).label('total'),
        func.sum(func.cast(GuiaHistorica.tiene_retraso, Integer)).label('retrasos'),
        func.avg(GuiaHistorica.dias_transito).label('avg_dias')
    ).filter(
        GuiaHistorica.transportadora.isnot(None)
    ).group_by(
        GuiaHistorica.transportadora
    ).all()

    rendimiento_transportadoras = []
    for t in transportadoras:
        total = t[1] or 0
        retrasos = t[2] or 0
        tasa = round(retrasos / total * 100, 1) if total > 0 else 0

        calificacion = 'EXCELENTE' if tasa < 5 else 'BUENO' if tasa < 15 else 'REGULAR' if tasa < 30 else 'MALO'

        rendimiento_transportadoras.append({
            "nombre": t[0],
            "total_guias": total,
            "entregas_exitosas": total - retrasos,
            "retrasos": retrasos,
            "tasa_retraso": tasa,
            "tiempo_promedio_dias": round(t[3] or 0, 1),
            "calificacion": calificacion
        })

    # Top ciudades
    ciudades = session.query(
        GuiaHistorica.ciudad_destino,
        func.count(GuiaHistorica.id).label('total')
    ).filter(
        GuiaHistorica.ciudad_destino.isnot(None)
    ).group_by(
        GuiaHistorica.ciudad_destino
    ).order_by(
        func.count(GuiaHistorica.id).desc()
    ).limit(5).all()

    top_ciudades = [
        {
            "ciudad": c[0],
            "total_guias": c[1],
            "porcentaje_del_total": round(c[1] / total_guias * 100, 1) if total_guias > 0 else 0
        }
        for c in ciudades
    ]

    # Modelos activos
    modelos = session.query(MetricaModelo).filter(
        MetricaModelo.esta_activo
    ).all()

    modelos_activos = [
        {
            "nombre": m.nombre_modelo,
            "version": m.version,
            "accuracy": m.accuracy,
            "fecha_entrenamiento": m.fecha_entrenamiento.isoformat() if m.fecha_entrenamiento else None,
            "estado": "ACTIVO"
        }
        for m in modelos
    ]

    # Alertas pendientes
    alertas_pendientes = session.query(func.count(AlertaSistema.id)).filter(
        AlertaSistema.esta_activa
    ).scalar() or 0

    return {
        "estadisticas_generales": {
            "total_guias": total_guias,
            "guias_entregadas": guias_entregadas,
            "guias_en_retraso": guias_retraso,
            "guias_con_novedad": guias_novedad,
            "tasa_entrega": round(guias_entregadas / total_guias * 100, 1) if total_guias > 0 else 0,
            "tasa_retraso": round(guias_retraso / total_guias * 100, 1) if total_guias > 0 else 0
        },
        "rendimiento_transportadoras": rendimiento_transportadoras,
        "top_ciudades": top_ciudades,
        "modelos_activos": modelos_activos,
        "alertas_pendientes": alertas_pendientes
    }


@app.get("/dashboard/transportadoras")
async def get_transportadoras_detalle(session: Session = Depends(get_session)):
    """Obtiene detalle de rendimiento de transportadoras"""
    transportadoras = session.query(
        GuiaHistorica.transportadora,
        func.count(GuiaHistorica.id).label('total'),
        func.sum(func.cast(GuiaHistorica.tiene_retraso, Integer)).label('retrasos'),
        func.sum(func.cast(GuiaHistorica.tiene_novedad, Integer)).label('novedades'),
        func.avg(GuiaHistorica.dias_transito).label('avg_dias')
    ).filter(
        GuiaHistorica.transportadora.isnot(None)
    ).group_by(
        GuiaHistorica.transportadora
    ).all()

    return [
        {
            "nombre": t[0],
            "total_guias": t[1] or 0,
            "retrasos": t[2] or 0,
            "novedades": t[3] or 0,
            "tasa_retraso": round((t[2] or 0) / t[1] * 100, 1) if t[1] > 0 else 0,
            "tiempo_promedio_dias": round(t[4] or 0, 1)
        }
        for t in transportadoras
    ]


@app.get("/dashboard/ciudades")
async def get_ciudades_detalle(session: Session = Depends(get_session)):
    """Obtiene estadísticas por ciudad"""
    ciudades = session.query(
        GuiaHistorica.ciudad_destino,
        func.count(GuiaHistorica.id).label('total')
    ).filter(
        GuiaHistorica.ciudad_destino.isnot(None)
    ).group_by(
        GuiaHistorica.ciudad_destino
    ).order_by(
        func.count(GuiaHistorica.id).desc()
    ).limit(20).all()

    total_general = session.query(func.count(GuiaHistorica.id)).scalar() or 1

    return [
        {
            "ciudad": c[0],
            "total_guias": c[1],
            "porcentaje_del_total": round(c[1] / total_general * 100, 1)
        }
        for c in ciudades
    ]


# ==================== ENDPOINTS DE ALERTAS ====================

@app.get("/alertas/listar")
async def listar_alertas(
    activas: bool = True,
    session: Session = Depends(get_session)
):
    """Lista alertas del sistema"""
    query = session.query(AlertaSistema)

    if activas:
        query = query.filter(AlertaSistema.esta_activa)

    alertas = query.order_by(AlertaSistema.fecha_creacion.desc()).limit(50).all()

    return [
        {
            "id": a.id,
            "tipo": a.tipo_alerta.value if a.tipo_alerta else None,
            "severidad": a.severidad.value if a.severidad else None,
            "titulo": a.titulo,
            "descripcion": a.descripcion,
            "fecha": a.fecha_creacion.isoformat(),
            "activa": a.esta_activa
        }
        for a in alertas
    ]


@app.post("/alertas/crear")
async def crear_alerta(
    request: AlertaCreateRequest,
    session: Session = Depends(get_session)
):
    """Crea una nueva alerta"""
    try:
        alerta = AlertaSistema(
            tipo_alerta=TipoAlerta[request.tipo.upper()],
            severidad=SeveridadAlerta[request.severidad.upper()],
            titulo=request.titulo,
            descripcion=request.descripcion,
            datos_relevantes=request.condicion
        )
        session.add(alerta)
        session.commit()

        return {"id": alerta.id, "exito": True}

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/alertas/resolver/{alerta_id}")
async def resolver_alerta(
    alerta_id: int,
    resolucion: str = "",
    session: Session = Depends(get_session)
):
    """Resuelve una alerta"""
    alerta = session.query(AlertaSistema).filter(
        AlertaSistema.id == alerta_id
    ).first()

    if not alerta:
        raise HTTPException(status_code=404, detail="Alerta no encontrada")

    alerta.esta_activa = False
    alerta.fecha_resolucion = datetime.now()
    alerta.comentario_resolucion = resolucion
    session.commit()

    return {"exito": True}


# ==================== ENDPOINTS DE TENDENCIAS ====================

@app.get("/dashboard/tendencias")
async def get_tendencias(
    dias: int = Query(30, ge=7, le=90),
    session: Session = Depends(get_session)
):
    """
    Obtiene tendencias de los últimos N días.
    Retorna series de tiempo para entregas, retrasos, novedades y satisfacción.
    """
    fecha_inicio = datetime.now() - timedelta(days=dias)

    # Obtener datos agrupados por día
    datos_diarios = session.query(
        func.date(GuiaHistorica.fecha_envio).label('fecha'),
        func.count(GuiaHistorica.id).label('total'),
        func.sum(cast(GuiaHistorica.estatus.ilike('%entregad%'), Integer)).label('entregas'),
        func.sum(cast(GuiaHistorica.tiene_retraso, Integer)).label('retrasos'),
        func.sum(cast(GuiaHistorica.tiene_novedad, Integer)).label('novedades')
    ).filter(
        GuiaHistorica.fecha_envio >= fecha_inicio,
        GuiaHistorica.fecha_envio.isnot(None)
    ).group_by(
        func.date(GuiaHistorica.fecha_envio)
    ).order_by(
        func.date(GuiaHistorica.fecha_envio)
    ).all()

    fechas = []
    entregas = []
    retrasos = []
    novedades = []
    satisfaccion = []

    for d in datos_diarios:
        fechas.append(d[0].isoformat() if d[0] else '')
        total = d[1] or 0
        ent = d[2] or 0
        ret = d[3] or 0
        nov = d[4] or 0

        entregas.append(ent)
        retrasos.append(ret)
        novedades.append(nov)
        # Satisfacción calculada como % de entregas sin problemas
        sat = ((ent - ret - nov) / total * 100) if total > 0 else 85
        satisfaccion.append(round(max(0, min(100, sat)), 1))

    # Si no hay datos, generar datos de ejemplo
    if not fechas:
        import random
        for i in range(dias - 1, -1, -1):
            fecha = datetime.now() - timedelta(days=i)
            fechas.append(fecha.strftime('%Y-%m-%d'))
            base_entregas = 150 + random.randint(0, 100)
            entregas.append(base_entregas)
            retrasos.append(int(base_entregas * (0.05 + random.random() * 0.1)))
            novedades.append(int(base_entregas * (0.02 + random.random() * 0.05)))
            satisfaccion.append(round(85 + random.random() * 10, 1))

    return {
        "fechas": fechas,
        "entregas": entregas,
        "retrasos": retrasos,
        "novedades": novedades,
        "satisfaccion": satisfaccion
    }


# ==================== ENDPOINTS DE REPORTES ====================

@app.post("/reportes/generar")
async def generar_reporte(
    request: ReporteGenerateRequest,
    session: Session = Depends(get_session)
):
    """
    Genera un reporte en el formato especificado.
    Tipos soportados: PDF, EXCEL, CSV
    """
    import uuid

    reporte_id = f"RPT-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"

    # En una implementación real, aquí se generaría el archivo
    # Por ahora retornamos metadata del reporte

    # Obtener estadísticas para el reporte
    total_guias = session.query(func.count(GuiaHistorica.id)).scalar() or 0

    return {
        "id": reporte_id,
        "tipo": request.tipo,
        "estado": "COMPLETADO",
        "url_descarga": f"/reportes/descargar/{reporte_id}",
        "fecha_generacion": datetime.now().isoformat(),
        "filtros_aplicados": request.filtros,
        "total_registros": total_guias,
        "mensaje": f"Reporte {request.tipo} generado exitosamente"
    }


@app.get("/reportes/listar")
async def listar_reportes(
    limite: int = Query(20, ge=1, le=100),
    session: Session = Depends(get_session)
):
    """Lista los reportes generados recientemente"""
    # En una implementación real, esto vendría de una tabla de reportes
    # Por ahora retornamos datos de ejemplo

    reportes = [
        {
            "id": f"RPT-{(datetime.now() - timedelta(days=i)).strftime('%Y%m%d')}-{hex(i)[2:].upper()}",
            "tipo": ["PDF", "EXCEL", "CSV"][i % 3],
            "fecha": (datetime.now() - timedelta(days=i)).isoformat(),
            "estado": "COMPLETADO",
            "url": "#"
        }
        for i in range(min(limite, 10))
    ]

    return reportes


@app.get("/reportes/descargar/{reporte_id}")
async def descargar_reporte(reporte_id: str):
    """Descarga un reporte generado"""
    # En una implementación real, aquí se retornaría el archivo
    return {
        "mensaje": f"Reporte {reporte_id} listo para descarga",
        "url": f"/static/reportes/{reporte_id}",
        "expira": (datetime.now() + timedelta(hours=24)).isoformat()
    }


# ==================== ENDPOINTS DE KPIS AVANZADOS ====================

@app.get("/dashboard/kpis-avanzados")
async def get_kpis_avanzados(session: Session = Depends(get_session)):
    """
    Obtiene KPIs avanzados de logística nivel Amazon.
    """
    total_guias = session.query(func.count(GuiaHistorica.id)).scalar() or 0
    guias_entregadas = session.query(func.count(GuiaHistorica.id)).filter(
        GuiaHistorica.estatus.ilike('%entregad%')
    ).scalar() or 0
    guias_retraso = session.query(func.count(GuiaHistorica.id)).filter(
        GuiaHistorica.tiene_retraso
    ).scalar() or 0
    guias_novedad = session.query(func.count(GuiaHistorica.id)).filter(
        GuiaHistorica.tiene_novedad
    ).scalar() or 0

    # OTIF: On-Time In-Full
    guias_perfectas = guias_entregadas - guias_retraso - guias_novedad
    otif_score = round((guias_perfectas / total_guias * 100) if total_guias > 0 else 0, 1)

    # Tiempo de ciclo promedio (días)
    tiempo_ciclo = session.query(func.avg(GuiaHistorica.dias_transito)).scalar() or 0

    # Costo promedio por flete
    costo_promedio = session.query(func.avg(GuiaHistorica.precio_flete)).scalar() or 0

    # Tasa de primera entrega (entregas sin novedad)
    primera_entrega = round(((guias_entregadas - guias_novedad) / guias_entregadas * 100) if guias_entregadas > 0 else 0, 1)

    # NPS Logístico (estimado basado en tasa de éxito)
    tasa_exito = (guias_entregadas / total_guias * 100) if total_guias > 0 else 0
    nps = round((tasa_exito - 50) * 2)  # Escala simplificada

    return {
        "otif_score": max(0, min(100, otif_score)),
        "nps_logistico": max(-100, min(100, nps)),
        "costo_por_entrega": round(costo_promedio, 0),
        "eficiencia_ruta": round(90 - (guias_retraso / total_guias * 50) if total_guias > 0 else 85, 1),
        "tasa_primera_entrega": primera_entrega,
        "tiempo_ciclo_promedio": round(float(tiempo_ciclo) * 24 if tiempo_ciclo else 48, 1)  # En horas
    }


# ==================== ENDPOINTS DE PREDICCIONES EN TIEMPO REAL ====================

@app.get("/dashboard/predicciones-recientes")
async def get_predicciones_recientes(
    limite: int = Query(10, ge=1, le=50),
    session: Session = Depends(get_session)
):
    """Obtiene las predicciones más recientes"""
    predicciones = session.query(PrediccionTiempoReal).order_by(
        PrediccionTiempoReal.fecha_prediccion.desc()
    ).limit(limite).all()

    return [
        {
            "numero_guia": p.numero_guia,
            "probabilidad": round(1 - (p.probabilidad_entrega_tiempo or 0), 2),
            "nivel_riesgo": p.nivel_riesgo.value if p.nivel_riesgo else "MEDIO",
            "ultima_actualizacion": p.fecha_prediccion.isoformat() if p.fecha_prediccion else None
        }
        for p in predicciones
    ]


# ==================== ENDPOINT DE CHAT EJECUTAR ACCION ====================

@app.post("/chat/ejecutar-accion")
async def ejecutar_accion_chat(
    accion: str,
    parametros: Dict = {},
    session: Session = Depends(get_session)
):
    """Ejecuta una acción sugerida por el chat"""
    acciones_disponibles = {
        "entrenar_modelos": lambda: sistema_reentrenamiento.ejecutar_reentrenamiento(manual=True),
        "limpiar_alertas": lambda: limpiar_alertas_resueltas(session),
        "generar_reporte": lambda: {"mensaje": "Reporte programado"},
    }

    if accion not in acciones_disponibles:
        raise HTTPException(status_code=400, detail=f"Acción '{accion}' no disponible")

    try:
        resultado = acciones_disponibles[accion]()
        return {"exito": True, "resultado": resultado, "accion": accion}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def limpiar_alertas_resueltas(session: Session):
    """Limpia alertas resueltas antiguas"""
    fecha_limite = datetime.now() - timedelta(days=30)
    eliminadas = session.query(AlertaSistema).filter(
        not AlertaSistema.esta_activa,
        AlertaSistema.fecha_resolucion < fecha_limite
    ).delete()
    session.commit()
    return {"alertas_eliminadas": eliminadas}


# ==================== MAIN ====================

if __name__ == "__main__":
    import uvicorn

    host = os.getenv('API_HOST', '0.0.0.0')
    port = int(os.getenv('API_PORT', '8000'))

    logger.info(f"Iniciando servidor en {host}:{port}")

    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=os.getenv('DEBUG', 'false').lower() == 'true',
        log_level="info"
    )
