"""
API REST Principal de FastAPI para el Sistema ML de Litper Logística.
Proporciona endpoints para todas las funcionalidades del sistema.
"""

import os
import sys
import time
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from sqlalchemy import func, and_, or_
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
    get_session, get_db_session, init_database, crear_configuraciones_default,
    verificar_conexion, get_config, set_config, get_all_configs, get_db_stats,
    GuiaHistorica, ArchivoCargado, MetricaModelo, ConversacionChat,
    PrediccionTiempoReal, ConfiguracionSistema, AlertaSistema,
    EstadoArchivo, NivelRiesgo, SeveridadAlerta, TipoAlerta
)
from excel_processor import excel_processor
from chat_inteligente import chat_inteligente
from ml_models import gestor_modelos
from reentrenamiento import sistema_reentrenamiento


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
        MetricaModelo.esta_activo == True
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
        GuiaHistorica.tiene_retraso == True
    ).scalar() or 0
    guias_novedad = session.query(func.count(GuiaHistorica.id)).filter(
        GuiaHistorica.tiene_novedad == True
    ).scalar() or 0

    # Rendimiento por transportadora
    transportadoras = session.query(
        GuiaHistorica.transportadora,
        func.count(GuiaHistorica.id).label('total'),
        func.sum(func.cast(GuiaHistorica.tiene_retraso == True, Integer)).label('retrasos'),
        func.avg(GuiaHistorica.dias_transito).label('avg_dias')
    ).filter(
        GuiaHistorica.transportadora.isnot(None)
    ).group_by(
        GuiaHistorica.transportadora
    ).all()

    from sqlalchemy import Integer

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
        MetricaModelo.esta_activo == True
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
        AlertaSistema.esta_activa == True
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
    from sqlalchemy import Integer

    transportadoras = session.query(
        GuiaHistorica.transportadora,
        func.count(GuiaHistorica.id).label('total'),
        func.sum(func.cast(GuiaHistorica.tiene_retraso == True, Integer)).label('retrasos'),
        func.sum(func.cast(GuiaHistorica.tiene_novedad == True, Integer)).label('novedades'),
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
        query = query.filter(AlertaSistema.esta_activa == True)

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
