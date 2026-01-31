"""
RUTAS API PARA MODO ADMINISTRADOR
==================================

Endpoints FastAPI para el panel de administracion.

Endpoints disponibles:
- POST /admin/login          - Autenticacion
- POST /admin/upload         - Cargar documentos
- GET  /admin/documents      - Listar documentos cargados
- GET  /admin/financial      - Obtener analisis financiero
- POST /admin/analyze        - Analizar archivo financiero
- GET  /admin/config         - Obtener configuracion
- PUT  /admin/config         - Actualizar configuracion

Autor: Litper IA System
Version: 1.0.0
"""

import os
import io
import uuid
import hashlib
from typing import Optional, List
from datetime import datetime, timedelta

from fastapi import APIRouter, HTTPException, UploadFile, File, Query, Depends, Header
from pydantic import BaseModel, Field
from loguru import logger
import anthropic

try:
    import pandas as pd
    PANDAS_AVAILABLE = True
except ImportError:
    PANDAS_AVAILABLE = False


# ==================== ROUTER ====================

router = APIRouter(
    prefix="/admin",
    tags=["Administracion"],
    responses={
        401: {"description": "No autorizado"},
        403: {"description": "Acceso denegado"},
        500: {"description": "Error interno"}
    }
)


# ==================== CONFIGURACION ====================

ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "Sacrije2020?08")
# En produccion, usar hash y tokens JWT


# ==================== MODELOS PYDANTIC ====================

class LoginRequest(BaseModel):
    """Request de login."""
    password: str = Field(..., description="Contrasena de administrador")


class LoginResponse(BaseModel):
    """Respuesta de login."""
    success: bool
    token: Optional[str] = None
    message: str


class DocumentoInfo(BaseModel):
    """Informacion de documento cargado."""
    id: str
    nombre: str
    tipo: str
    fecha_carga: datetime
    estado: str
    tiene_analisis_financiero: bool = False


class AnalisisFinancieroRequest(BaseModel):
    """Request para analisis financiero."""
    archivo_id: Optional[str] = None
    periodo_inicio: Optional[str] = None
    periodo_fin: Optional[str] = None


class FiltroFecha(BaseModel):
    """Filtro de fechas."""
    tipo: str = Field("hoy", description="hoy, ayer, 7dias, 14dias, 30dias, todo")


# ==================== ESTADO EN MEMORIA (para demo) ====================

# En produccion, esto iria en base de datos
documentos_cargados = []
sesiones_activas = {}


# ==================== FUNCIONES AUXILIARES ====================

def verificar_token(authorization: Optional[str] = Header(None)) -> bool:
    """
    Verifica el token de autorizacion.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Token requerido")

    # Formato: Bearer <token>
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="Formato de token invalido")

    token = parts[1]

    # Verificar token en sesiones
    if token not in sesiones_activas:
        raise HTTPException(status_code=401, detail="Token invalido o expirado")

    # Verificar expiracion
    sesion = sesiones_activas[token]
    if datetime.now() > sesion["expira"]:
        del sesiones_activas[token]
        raise HTTPException(status_code=401, detail="Sesion expirada")

    return True


def calcular_rango_fecha(filtro: str) -> tuple:
    """
    Calcula el rango de fechas segun el filtro.
    """
    hoy = datetime.now().replace(hour=23, minute=59, second=59)
    inicio = datetime.now().replace(hour=0, minute=0, second=0)

    if filtro == "hoy":
        return inicio, hoy
    elif filtro == "ayer":
        ayer = inicio - timedelta(days=1)
        fin_ayer = ayer.replace(hour=23, minute=59, second=59)
        return ayer, fin_ayer
    elif filtro == "7dias":
        return inicio - timedelta(days=7), hoy
    elif filtro == "14dias":
        return inicio - timedelta(days=14), hoy
    elif filtro == "30dias":
        return inicio - timedelta(days=30), hoy
    else:  # todo
        return datetime(2020, 1, 1), hoy


# ==================== ENDPOINTS ====================

@router.post(
    "/login",
    response_model=LoginResponse,
    summary="Login de administrador",
    description="Autentica al administrador y retorna un token de sesion."
)
async def login(request: LoginRequest):
    """
    Login de administrador.
    """

    if request.password != ADMIN_PASSWORD:
        logger.warning("Intento de login fallido")
        raise HTTPException(status_code=401, detail="Contrasena incorrecta")

    # Generar token
    token = hashlib.sha256(
        f"{uuid.uuid4()}{datetime.now().isoformat()}".encode()
    ).hexdigest()

    # Guardar sesion
    sesiones_activas[token] = {
        "creada": datetime.now(),
        "expira": datetime.now() + timedelta(hours=8)
    }

    logger.info("Login de admin exitoso")

    return LoginResponse(
        success=True,
        token=token,
        message="Login exitoso"
    )


@router.post(
    "/logout",
    summary="Logout de administrador",
    description="Cierra la sesion actual."
)
async def logout(authorization: Optional[str] = Header(None)):
    """
    Logout de administrador.
    """

    if authorization:
        parts = authorization.split()
        if len(parts) == 2:
            token = parts[1]
            if token in sesiones_activas:
                del sesiones_activas[token]

    return {"success": True, "message": "Sesion cerrada"}


@router.post(
    "/upload",
    summary="Cargar documento",
    description="Carga un documento para procesamiento y analisis."
)
async def upload_documento(
    archivo: UploadFile = File(...),
    _: bool = Depends(verificar_token)
):
    """
    Carga un documento para procesamiento.
    """

    logger.info(f"Admin: Cargando archivo {archivo.filename}")

    try:
        contenido = await archivo.read()

        # Determinar tipo
        extension = os.path.splitext(archivo.filename)[1].lower()
        tipos_validos = {
            '.xlsx': 'excel',
            '.xls': 'excel',
            '.csv': 'csv',
            '.docx': 'documento',
            '.pdf': 'documento',
            '.txt': 'texto',
            '.mp4': 'video',
            '.mp3': 'audio',
            '.pptx': 'presentacion'
        }

        tipo = tipos_validos.get(extension, 'otro')

        # Crear registro
        doc_id = str(uuid.uuid4())
        doc_info = {
            "id": doc_id,
            "nombre": archivo.filename,
            "tipo": tipo,
            "extension": extension,
            "tamano": len(contenido),
            "fecha_carga": datetime.now(),
            "estado": "procesando",
            "contenido": contenido,
            "analisis_financiero": None
        }

        documentos_cargados.append(doc_info)

        # Si es Excel, intentar analisis financiero
        es_financiero = False
        if tipo == "excel" and PANDAS_AVAILABLE:
            try:
                df = pd.read_excel(io.BytesIO(contenido))
                columnas = [str(c).upper() for c in df.columns]

                # Detectar si es archivo de Dropi
                columnas_dropi = ["VALOR FACTURADO", "GANANCIA", "PRECIO FLETE",
                                 "ESTADO GUIA", "TRANSPORTADORA"]
                coincidencias = sum(1 for c in columnas_dropi if any(c in col for col in columnas))

                if coincidencias >= 3:
                    es_financiero = True
                    doc_info["tiene_analisis_financiero"] = True
                    doc_info["estado"] = "completado"

            except Exception as e:
                logger.warning(f"Error procesando Excel: {e}")

        if not es_financiero:
            doc_info["estado"] = "completado"

        return {
            "id": doc_id,
            "nombre": archivo.filename,
            "tipo": tipo,
            "estado": doc_info["estado"],
            "es_financiero": es_financiero,
            "mensaje": "Archivo cargado exitosamente"
        }

    except Exception as e:
        logger.error(f"Error cargando archivo: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/documents",
    summary="Listar documentos",
    description="Lista todos los documentos cargados con filtro de fecha."
)
async def listar_documentos(
    filtro: str = Query("todo", description="Filtro de fecha"),
    _: bool = Depends(verificar_token)
):
    """
    Lista documentos cargados.
    """

    inicio, fin = calcular_rango_fecha(filtro)

    # Filtrar por fecha
    docs_filtrados = [
        {
            "id": d["id"],
            "nombre": d["nombre"],
            "tipo": d["tipo"],
            "fecha_carga": d["fecha_carga"].isoformat(),
            "estado": d["estado"],
            "tiene_analisis_financiero": d.get("tiene_analisis_financiero", False)
        }
        for d in documentos_cargados
        if inicio <= d["fecha_carga"] <= fin
    ]

    return {
        "total": len(docs_filtrados),
        "filtro": filtro,
        "documentos": docs_filtrados
    }


@router.post(
    "/analyze",
    summary="Analizar archivo financiero",
    description="Genera un estado de perdidas y ganancias desde un archivo Excel."
)
async def analizar_financiero(
    archivo_id: Optional[str] = None,
    archivo: Optional[UploadFile] = File(None),
    _: bool = Depends(verificar_token)
):
    """
    Analiza un archivo y genera reporte financiero.
    """

    if not PANDAS_AVAILABLE:
        raise HTTPException(
            status_code=500,
            detail="Pandas no esta instalado"
        )

    try:
        # Obtener contenido
        if archivo:
            contenido = await archivo.read()
            nombre_archivo = archivo.filename
        elif archivo_id:
            doc = next((d for d in documentos_cargados if d["id"] == archivo_id), None)
            if not doc:
                raise HTTPException(status_code=404, detail="Documento no encontrado")
            contenido = doc["contenido"]
            nombre_archivo = doc["nombre"]
        else:
            raise HTTPException(status_code=400, detail="Debe proporcionar archivo o archivo_id")

        # Leer Excel
        df = pd.read_excel(io.BytesIO(contenido))
        [str(c).upper() for c in df.columns]

        # Mapear columnas comunes
        mapeo_columnas = {
            "VALOR FACTURADO": ["VALOR FACTURADO", "FACTURADO", "VENTA", "VENTAS"],
            "GANANCIA": ["GANANCIA", "UTILIDAD", "PROFIT", "MARGEN"],
            "PRECIO FLETE": ["PRECIO FLETE", "FLETE", "ENVIO", "COSTO ENVIO"],
            "COSTO DEVOLUCION": ["COSTO DEVOLUCION FLETE", "DEVOLUCION", "RETORNO"],
            "ESTADO GUIA": ["ESTADO GUIA", "ESTATUS", "STATUS", "ESTADO"],
            "TRANSPORTADORA": ["TRANSPORTADORA", "CARRIER", "EMPRESA"]
        }

        def encontrar_columna(nombres_posibles):
            for col in df.columns:
                for nombre in nombres_posibles:
                    if nombre.upper() in str(col).upper():
                        return col
            return None

        # Encontrar columnas
        col_facturado = encontrar_columna(mapeo_columnas["VALOR FACTURADO"])
        col_ganancia = encontrar_columna(mapeo_columnas["GANANCIA"])
        col_flete = encontrar_columna(mapeo_columnas["PRECIO FLETE"])
        col_devolucion = encontrar_columna(mapeo_columnas["COSTO DEVOLUCION"])
        col_estado = encontrar_columna(mapeo_columnas["ESTADO GUIA"])
        col_transportadora = encontrar_columna(mapeo_columnas["TRANSPORTADORA"])

        # Calcular metricas
        total_registros = len(df)

        # Ventas
        total_facturado = 0
        if col_facturado:
            total_facturado = pd.to_numeric(df[col_facturado], errors='coerce').sum()

        # Ganancia
        ganancia_bruta = 0
        if col_ganancia:
            ganancia_bruta = pd.to_numeric(df[col_ganancia], errors='coerce').sum()

        # Costos logisticos
        total_fletes = 0
        if col_flete:
            total_fletes = pd.to_numeric(df[col_flete], errors='coerce').sum()

        total_devoluciones = 0
        if col_devolucion:
            total_devoluciones = pd.to_numeric(df[col_devolucion], errors='coerce').sum()

        # Entregas
        entregados = 0
        no_entregados = 0
        if col_estado:
            estados_entregado = ["ENTREGADO", "DELIVERED", "EXITOSO"]
            df_estado = df[col_estado].fillna("").astype(str).str.upper()
            entregados = sum(1 for e in df_estado if any(x in e for x in estados_entregado))
            no_entregados = total_registros - entregados

        tasa_entrega = (entregados / total_registros * 100) if total_registros > 0 else 0

        # Calcular metricas derivadas
        margen_bruto = (ganancia_bruta / total_facturado * 100) if total_facturado > 0 else 0
        ticket_promedio = total_facturado / entregados if entregados > 0 else 0
        ganancia_por_pedido = ganancia_bruta / entregados if entregados > 0 else 0
        costo_por_pedido = total_fletes / total_registros if total_registros > 0 else 0

        # Perdidas estimadas
        ganancia_promedio = ganancia_bruta / entregados if entregados > 0 else 0
        ganancia_perdida = no_entregados * ganancia_promedio

        # Analisis por transportadora
        por_transportadora = []
        if col_transportadora and col_estado:
            for transp in df[col_transportadora].dropna().unique():
                df_transp = df[df[col_transportadora] == transp]
                total_t = len(df_transp)
                ent_t = sum(1 for e in df_transp[col_estado].fillna("").astype(str).str.upper()
                           if any(x in e for x in ["ENTREGADO", "DELIVERED"]))
                tasa_t = (ent_t / total_t * 100) if total_t > 0 else 0

                por_transportadora.append({
                    "nombre": str(transp),
                    "pedidos": total_t,
                    "entregados": ent_t,
                    "tasa": round(tasa_t, 1),
                    "rentable": tasa_t >= 80
                })

        # Generar reporte con IA
        reporte_ia = await generar_reporte_ia(
            total_facturado=total_facturado,
            ganancia_bruta=ganancia_bruta,
            total_fletes=total_fletes,
            total_devoluciones=total_devoluciones,
            tasa_entrega=tasa_entrega,
            total_registros=total_registros,
            entregados=entregados,
            por_transportadora=por_transportadora
        )

        # Construir respuesta
        reporte = {
            "fecha_analisis": datetime.now().isoformat(),
            "archivo": nombre_archivo,
            "periodo": {
                "registros": total_registros
            },
            "resumen": {
                "total_facturado": round(total_facturado, 2),
                "ganancia_bruta": round(ganancia_bruta, 2),
                "margen_bruto": round(margen_bruto, 1),
                "total_fletes": round(total_fletes, 2),
                "total_devoluciones": round(total_devoluciones, 2),
                "tasa_entrega": round(tasa_entrega, 1),
                "entregados": entregados,
                "no_entregados": no_entregados
            },
            "metricas": {
                "ticket_promedio": round(ticket_promedio, 2),
                "ganancia_por_pedido": round(ganancia_por_pedido, 2),
                "costo_por_pedido": round(costo_por_pedido, 2)
            },
            "perdidas": {
                "pedidos_no_entregados": no_entregados,
                "ganancia_perdida_estimada": round(ganancia_perdida, 2),
                "costo_devoluciones": round(total_devoluciones, 2)
            },
            "por_transportadora": por_transportadora[:10],
            "analisis_ia": reporte_ia,
            "alertas": generar_alertas(
                margen_bruto, tasa_entrega, total_devoluciones, total_facturado
            ),
            "recomendaciones": generar_recomendaciones(
                margen_bruto, tasa_entrega, total_devoluciones, total_facturado
            )
        }

        return reporte

    except Exception as e:
        logger.error(f"Error en analisis financiero: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/financial/latest",
    summary="Ultimo analisis financiero",
    description="Obtiene el ultimo reporte financiero generado."
)
async def ultimo_financiero(_: bool = Depends(verificar_token)):
    """
    Retorna el ultimo analisis financiero.
    """

    # Buscar ultimo documento con analisis
    docs_financieros = [
        d for d in documentos_cargados
        if d.get("tiene_analisis_financiero") and d.get("analisis_financiero")
    ]

    if not docs_financieros:
        return {
            "existe": False,
            "mensaje": "No hay analisis financieros disponibles"
        }

    ultimo = max(docs_financieros, key=lambda x: x["fecha_carga"])

    return {
        "existe": True,
        "fecha": ultimo["fecha_carga"].isoformat(),
        "archivo": ultimo["nombre"],
        "reporte": ultimo["analisis_financiero"]
    }


@router.get(
    "/config",
    summary="Obtener configuracion",
    description="Obtiene la configuracion del sistema de administracion."
)
async def obtener_config(_: bool = Depends(verificar_token)):
    """
    Retorna configuracion del admin.
    """

    return {
        "email_reportes": os.getenv("REPORT_EMAIL", "litpercolombia@gmail.com"),
        "margen_bruto_meta": 40,
        "tasa_entrega_meta": 85,
        "costo_logistico_max": 15,
        "roas_minimo": 3
    }


# ==================== FUNCIONES AUXILIARES ====================

def generar_alertas(margen: float, tasa: float, devoluciones: float, ventas: float) -> List[dict]:
    """
    Genera alertas basadas en metricas.
    """
    alertas = []

    if margen < 10:
        alertas.append({
            "tipo": "critica",
            "mensaje": f"Margen bruto muy bajo: {margen:.1f}%",
            "accion": "Revisar costos y precios urgentemente"
        })
    elif margen < 20:
        alertas.append({
            "tipo": "advertencia",
            "mensaje": f"Margen bruto por debajo de la meta: {margen:.1f}%",
            "accion": "Optimizar estructura de costos"
        })

    if tasa < 70:
        alertas.append({
            "tipo": "critica",
            "mensaje": f"Tasa de entrega critica: {tasa:.1f}%",
            "accion": "Revisar proceso de confirmacion y transportadoras"
        })
    elif tasa < 85:
        alertas.append({
            "tipo": "advertencia",
            "mensaje": f"Tasa de entrega mejorable: {tasa:.1f}%",
            "accion": "Analizar causas de no entrega"
        })

    costo_dev_pct = (devoluciones / ventas * 100) if ventas > 0 else 0
    if costo_dev_pct > 15:
        alertas.append({
            "tipo": "critica",
            "mensaje": f"Costo de devoluciones alto: {costo_dev_pct:.1f}% de ventas",
            "accion": "Reducir devoluciones mejorando confirmacion"
        })

    return alertas


def generar_recomendaciones(margen: float, tasa: float, devoluciones: float, ventas: float) -> dict:
    """
    Genera recomendaciones estrategicas.
    """
    inmediatas = []
    politicas = []
    metas = {}

    # Basado en margen
    if margen < 30:
        inmediatas.append("Revisar precios de venta vs costos de producto")
        inmediatas.append("Negociar mejores tarifas con proveedores")
        metas["margen_bruto"] = {"actual": margen, "meta": 40}

    # Basado en tasa entrega
    if tasa < 85:
        inmediatas.append("Implementar doble confirmacion de pedidos")
        politicas.append("Rechazar pedidos de ciudades con tasa <70%")
        metas["tasa_entrega"] = {"actual": tasa, "meta": 90}

    # Basado en devoluciones
    costo_dev_pct = (devoluciones / ventas * 100) if ventas > 0 else 0
    if costo_dev_pct > 10:
        inmediatas.append("Contactar cliente antes del despacho")
        politicas.append("Cobrar envio en zonas problematicas")

    # Generales
    politicas.append("Establecer KPIs semanales de seguimiento")
    politicas.append("Revisar metricas financieras mensualmente")

    return {
        "inmediatas": inmediatas,
        "politicas": politicas,
        "metas": metas
    }


async def generar_reporte_ia(
    total_facturado: float,
    ganancia_bruta: float,
    total_fletes: float,
    total_devoluciones: float,
    tasa_entrega: float,
    total_registros: int,
    entregados: int,
    por_transportadora: list
) -> str:
    """
    Genera analisis con IA.
    """

    try:
        api_key = os.getenv("ANTHROPIC_API_KEY") or os.getenv("VITE_CLAUDE_API_KEY")
        if not api_key:
            return "Analisis IA no disponible (API key no configurada)"

        cliente = anthropic.Anthropic(api_key=api_key)

        prompt = f"""Analiza estos datos financieros de un negocio de dropshipping en Colombia:

METRICAS:
- Ventas totales: ${total_facturado:,.0f}
- Ganancia bruta: ${ganancia_bruta:,.0f}
- Margen bruto: {(ganancia_bruta/total_facturado*100) if total_facturado > 0 else 0:.1f}%
- Costos de envio: ${total_fletes:,.0f}
- Costos de devoluciones: ${total_devoluciones:,.0f}
- Tasa de entrega: {tasa_entrega:.1f}%
- Pedidos: {total_registros} ({entregados} entregados)

TRANSPORTADORAS:
{chr(10).join([f"- {t['nombre']}: {t['pedidos']} pedidos, {t['tasa']}% entrega" for t in por_transportadora[:5]])}

Genera un analisis ejecutivo breve (3-4 parrafos) con:
1. Resumen de la situacion financiera
2. Principales problemas identificados
3. Oportunidades de mejora
4. Recomendacion principal

Responde en espanol colombiano, directo y accionable."""

        response = cliente.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1000,
            messages=[{"role": "user", "content": prompt}]
        )

        return response.content[0].text

    except Exception as e:
        logger.error(f"Error generando reporte IA: {e}")
        return f"Analisis IA no disponible: {str(e)}"


# ==================== FUNCION PARA REGISTRAR RUTAS ====================

def incluir_rutas_admin(app):
    """
    Incluye las rutas de admin en la aplicacion FastAPI.

    Uso en main.py:
        from knowledge_system.admin_routes import incluir_rutas_admin
        incluir_rutas_admin(app)
    """
    app.include_router(router)
    logger.info("Rutas de administracion registradas")
