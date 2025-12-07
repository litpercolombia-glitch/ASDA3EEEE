"""
RUTAS API PARA SISTEMA DE CONOCIMIENTO
=======================================

Endpoints FastAPI para gestionar la base de conocimiento.

Endpoints disponibles:
- POST /knowledge/upload       - Cargar archivo
- POST /knowledge/scrape       - Extraer desde web
- POST /knowledge/youtube      - Extraer desde YouTube
- POST /knowledge/text         - Guardar texto directo
- GET  /knowledge/search       - Buscar conocimiento
- GET  /knowledge/list         - Listar conocimiento
- GET  /knowledge/{id}         - Obtener uno específico
- DELETE /knowledge/{id}       - Eliminar conocimiento
- GET  /knowledge/stats        - Estadísticas
- GET  /knowledge/categories   - Categorías disponibles

Autor: Litper IA System
Versión: 1.0.0
"""

import os
from typing import Optional, List
from datetime import datetime

from fastapi import APIRouter, HTTPException, UploadFile, File, Query, Form
from pydantic import BaseModel, Field, HttpUrl
from loguru import logger

from .knowledge_manager import get_knowledge_manager


# ==================== ROUTER ====================

router = APIRouter(
    prefix="/knowledge",
    tags=["Conocimiento"],
    responses={
        404: {"description": "No encontrado"},
        500: {"description": "Error interno"}
    }
)


# ==================== MODELOS PYDANTIC ====================

class WebScrapeRequest(BaseModel):
    """Request para extraer contenido de una página web."""
    url: str = Field(..., description="URL de la página a extraer")
    con_login: bool = Field(False, description="¿Requiere autenticación?")
    credenciales: Optional[dict] = Field(None, description="Credenciales si requiere login")

    class Config:
        json_schema_extra = {
            "example": {
                "url": "https://docs.coordinadora.com/api",
                "con_login": False
            }
        }


class YouTubeRequest(BaseModel):
    """Request para extraer transcripción de YouTube."""
    url: str = Field(..., description="URL o ID del video de YouTube")

    class Config:
        json_schema_extra = {
            "example": {
                "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
            }
        }


class TextRequest(BaseModel):
    """Request para guardar texto directo."""
    titulo: str = Field(..., min_length=3, max_length=200, description="Título del contenido")
    contenido: str = Field(..., min_length=50, description="Contenido de texto")
    categoria: Optional[str] = Field(None, description="Categoría (opcional, se auto-clasifica)")
    tags: Optional[List[str]] = Field(None, description="Tags manuales (opcional)")

    class Config:
        json_schema_extra = {
            "example": {
                "titulo": "Proceso de devoluciones Coordinadora",
                "contenido": "Este documento describe el proceso paso a paso...",
                "categoria": "Logística"
            }
        }


class SearchRequest(BaseModel):
    """Request para búsqueda semántica."""
    query: str = Field(..., min_length=3, description="Texto de búsqueda")
    limite: int = Field(10, ge=1, le=50, description="Máximo de resultados")
    categoria: Optional[str] = Field(None, description="Filtrar por categoría")


class KnowledgeResponse(BaseModel):
    """Respuesta estándar para operaciones de conocimiento."""
    success: bool
    id: Optional[int] = None
    titulo: Optional[str] = None
    categoria: Optional[str] = None
    subcategoria: Optional[str] = None
    tags: Optional[List[str]] = None
    resumen: Optional[str] = None
    tokens: Optional[int] = None
    error: Optional[str] = None


# ==================== ENDPOINTS ====================

@router.post(
    "/upload",
    response_model=KnowledgeResponse,
    summary="Cargar archivo",
    description="""
    Carga un archivo y extrae su contenido para la base de conocimiento.

    **Formatos soportados:**
    - PDF (.pdf)
    - Word (.docx, .doc)
    - Texto (.txt, .md)
    - CSV (.csv)
    - JSON (.json)

    **Proceso:**
    1. El archivo se parsea según su formato
    2. El contenido se analiza con IA
    3. Se clasifica automáticamente
    4. Se genera embedding para búsqueda semántica
    5. Se guarda en la base de datos

    **Tip:** Para PDFs, asegúrate de que contengan texto (no escaneos).
    """
)
async def upload_file(
    archivo: UploadFile = File(..., description="Archivo a procesar")
):
    """
    Carga un archivo a la base de conocimiento.

    El archivo se procesa, clasifica automáticamente y se almacena
    con embeddings para búsqueda semántica.
    """

    logger.info(f"📁 Recibiendo archivo: {archivo.filename}")

    # Validar extensión
    extensiones_validas = {'.pdf', '.docx', '.doc', '.txt', '.md', '.csv', '.json', '.xml', '.html'}
    extension = os.path.splitext(archivo.filename)[1].lower()

    if extension not in extensiones_validas:
        raise HTTPException(
            status_code=400,
            detail=f"Formato no soportado: {extension}. Válidos: {', '.join(extensiones_validas)}"
        )

    try:
        # Leer contenido
        contenido = await archivo.read()

        # Validar tamaño (max 50MB)
        if len(contenido) > 50 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Archivo muy grande (max 50MB)")

        # Obtener gestor
        km = get_knowledge_manager()

        # Parsear documento
        texto = await km.document_parser.parsear_bytes(contenido, archivo.filename)

        # Guardar como conocimiento
        resultado = await km.cargar_conocimiento(
            fuente=archivo.filename,
            tipo="archivo",
            metadata={
                "nombre_archivo": archivo.filename,
                "tamaño_bytes": len(contenido),
                "extension": extension
            }
        )

        if resultado.get('success'):
            return KnowledgeResponse(**resultado)
        else:
            raise HTTPException(status_code=400, detail=resultado.get('error', 'Error procesando archivo'))

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error procesando archivo: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/scrape",
    response_model=KnowledgeResponse,
    summary="Extraer desde web",
    description="""
    Extrae contenido de una página web.

    **Características:**
    - Soporta páginas estáticas y dinámicas (JavaScript)
    - Opción de autenticación para sitios con login
    - Limpieza automática del HTML

    **Proceso:**
    1. Se navega a la URL
    2. Se extrae el contenido principal
    3. Se limpia el HTML
    4. Se clasifica y almacena

    **Tips:**
    - Para sitios con JavaScript pesado, el sistema usa Playwright
    - Páginas de documentación funcionan mejor
    - Evita URLs con contenido dinámico que cambia frecuentemente
    """
)
async def scrape_web(request: WebScrapeRequest):
    """
    Extrae y guarda contenido de una página web.

    Soporta páginas con y sin JavaScript, y opcionalmente
    sitios que requieren autenticación.
    """

    logger.info(f"🌐 Extrayendo: {request.url}")

    try:
        km = get_knowledge_manager()

        opciones = {}
        if request.con_login and request.credenciales:
            opciones['credenciales'] = request.credenciales

        resultado = await km.cargar_conocimiento(
            fuente=request.url,
            tipo="web",
            opciones=opciones
        )

        if resultado.get('success'):
            return KnowledgeResponse(**resultado)
        else:
            raise HTTPException(status_code=400, detail=resultado.get('error', 'Error extrayendo página'))

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error en scraping: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/youtube",
    response_model=KnowledgeResponse,
    summary="Extraer desde YouTube",
    description="""
    Extrae la transcripción de un video de YouTube.

    **Formatos de URL soportados:**
    - https://www.youtube.com/watch?v=VIDEO_ID
    - https://youtu.be/VIDEO_ID
    - VIDEO_ID directo (11 caracteres)

    **Proceso:**
    1. Se extrae la transcripción/subtítulos
    2. Se obtiene metadata del video
    3. Se clasifica y almacena

    **Limitaciones:**
    - Solo funciona con videos que tienen subtítulos
    - Videos privados no son accesibles
    - Prioriza español, luego inglés

    **Tip:** Los timestamps se incluyen cada minuto para fácil navegación.
    """
)
async def extract_youtube(request: YouTubeRequest):
    """
    Extrae transcripción de un video de YouTube.

    El video debe tener subtítulos disponibles (automáticos o manuales).
    """

    logger.info(f"📺 Extrayendo YouTube: {request.url}")

    try:
        km = get_knowledge_manager()

        resultado = await km.cargar_conocimiento(
            fuente=request.url,
            tipo="youtube"
        )

        if resultado.get('success'):
            return KnowledgeResponse(**resultado)
        else:
            raise HTTPException(status_code=400, detail=resultado.get('error', 'Error extrayendo video'))

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error con YouTube: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/text",
    response_model=KnowledgeResponse,
    summary="Guardar texto directo",
    description="""
    Guarda texto directamente en la base de conocimiento.

    **Usos:**
    - Documentar procesos internos
    - Guardar notas y aprendizajes
    - Agregar información que no viene de otras fuentes

    **Proceso:**
    1. El texto se analiza con IA
    2. Se clasifica automáticamente (o usa la categoría proporcionada)
    3. Se genera embedding para búsqueda

    **Tip:** Proporciona títulos descriptivos para mejor búsqueda.
    """
)
async def save_text(request: TextRequest):
    """
    Guarda texto directo en la base de conocimiento.

    Ideal para documentar procesos internos o agregar información manual.
    """

    logger.info(f"📝 Guardando texto: {request.titulo}")

    try:
        km = get_knowledge_manager()

        resultado = await km.cargar_conocimiento(
            fuente=request.contenido,
            tipo="texto",
            metadata={
                "titulo_manual": request.titulo,
                "categoria_sugerida": request.categoria,
                "tags_manuales": request.tags
            }
        )

        if resultado.get('success'):
            return KnowledgeResponse(**resultado)
        else:
            raise HTTPException(status_code=400, detail=resultado.get('error', 'Error guardando texto'))

    except Exception as e:
        logger.error(f"Error guardando texto: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/search",
    summary="Buscar conocimiento",
    description="""
    Búsqueda semántica en la base de conocimiento.

    **Características:**
    - Búsqueda por significado, no solo palabras exactas
    - Filtro opcional por categoría
    - Ordenado por relevancia

    **Ejemplos de búsqueda:**
    - "cómo rastrear envíos con Coordinadora"
    - "proceso de devoluciones"
    - "integrar API de tracking"

    **Tip:** Usa frases completas para mejor precisión semántica.
    """
)
async def search_knowledge(
    q: str = Query(..., min_length=3, description="Texto de búsqueda"),
    limite: int = Query(10, ge=1, le=50, description="Máximo resultados"),
    categoria: Optional[str] = Query(None, description="Filtrar por categoría")
):
    """
    Busca en la base de conocimiento usando similitud semántica.

    Retorna resultados ordenados por relevancia.
    """

    logger.info(f"🔍 Buscando: {q}")

    try:
        km = get_knowledge_manager()

        resultados = await km.buscar_conocimiento(
            query=q,
            limite=limite,
            categoria=categoria
        )

        return {
            "query": q,
            "total": len(resultados),
            "resultados": resultados
        }

    except Exception as e:
        logger.error(f"Error en búsqueda: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/list",
    summary="Listar conocimiento",
    description="""
    Lista todo el conocimiento con paginación.

    **Parámetros:**
    - limite: Resultados por página (default 20)
    - pagina: Número de página (default 1)
    - categoria: Filtrar por categoría
    - orden: fecha_desc, fecha_asc, titulo_asc

    **Tip:** Usa filtros para encontrar contenido específico.
    """
)
async def list_knowledge(
    limite: int = Query(20, ge=1, le=100, description="Resultados por página"),
    pagina: int = Query(1, ge=1, description="Número de página"),
    categoria: Optional[str] = Query(None, description="Filtrar por categoría"),
    orden: str = Query("fecha_desc", description="Ordenamiento")
):
    """
    Lista conocimiento con paginación y filtros.
    """

    try:
        km = get_knowledge_manager()

        offset = (pagina - 1) * limite

        resultado = await km.listar_conocimiento(
            limite=limite,
            offset=offset,
            categoria=categoria,
            orden=orden
        )

        return resultado

    except Exception as e:
        logger.error(f"Error listando: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/{id}",
    summary="Obtener conocimiento",
    description="""
    Obtiene un documento de conocimiento específico por ID.

    Incluye el contenido completo, útil para:
    - Revisar el documento
    - Usar con agentes IA
    - Exportar información
    """
)
async def get_knowledge(id: int):
    """
    Obtiene un conocimiento específico por ID.

    Incluye contenido completo y metadata.
    """

    try:
        km = get_knowledge_manager()

        conocimiento = await km.obtener_conocimiento(id)

        if not conocimiento:
            raise HTTPException(status_code=404, detail="Conocimiento no encontrado")

        return conocimiento

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error obteniendo: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete(
    "/{id}",
    summary="Eliminar conocimiento",
    description="""
    Elimina un documento de la base de conocimiento.

    **Precaución:** Esta acción es irreversible.

    **Tip:** Considera si realmente necesitas eliminar o si
    sería mejor reclasificar el contenido.
    """
)
async def delete_knowledge(id: int):
    """
    Elimina un conocimiento por ID.

    Acción irreversible.
    """

    try:
        km = get_knowledge_manager()

        eliminado = await km.eliminar_conocimiento(id)

        if not eliminado:
            raise HTTPException(status_code=404, detail="Conocimiento no encontrado")

        return {"success": True, "id": id, "mensaje": "Conocimiento eliminado"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error eliminando: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/stats/overview",
    summary="Estadísticas",
    description="""
    Obtiene estadísticas del sistema de conocimiento.

    **Incluye:**
    - Total de documentos
    - Distribución por categoría
    - Distribución por tipo de fuente
    - Último documento cargado

    **Tip:** Usa estas estadísticas para monitorear el crecimiento
    de tu base de conocimiento.
    """
)
async def get_stats():
    """
    Retorna estadísticas del sistema de conocimiento.
    """

    try:
        km = get_knowledge_manager()

        stats = await km.obtener_estadisticas()

        return {
            "estadisticas": stats,
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        logger.error(f"Error obteniendo stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/categories/list",
    summary="Categorías disponibles",
    description="""
    Lista todas las categorías y subcategorías disponibles.

    **Uso:**
    - Mostrar opciones al usuario
    - Validar clasificaciones
    - Filtrar búsquedas

    **Tip:** El sistema clasifica automáticamente, pero puedes
    usar estas categorías para filtrar o sugerir.
    """
)
async def get_categories():
    """
    Retorna la taxonomía completa de categorías.
    """

    try:
        km = get_knowledge_manager()

        return km.classifier.get_taxonomia_completa()

    except Exception as e:
        logger.error(f"Error obteniendo categorías: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/youtube/info",
    summary="Info de video YouTube",
    description="""
    Obtiene información de un video de YouTube sin procesar.

    **Útil para:**
    - Verificar si el video tiene subtítulos
    - Ver metadata antes de procesar
    - Validar URLs

    **Tip:** Usa esto antes de cargar para verificar disponibilidad.
    """
)
async def get_youtube_info(
    url: str = Query(..., description="URL o ID del video")
):
    """
    Obtiene información de un video de YouTube.

    No procesa ni guarda, solo muestra metadata.
    """

    try:
        km = get_knowledge_manager()

        info = await km.youtube_processor.obtener_info_video(url)

        return info

    except Exception as e:
        logger.error(f"Error obteniendo info: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== FUNCIÓN PARA REGISTRAR RUTAS ====================

def incluir_rutas(app):
    """
    Incluye las rutas de conocimiento en la aplicación FastAPI.

    Uso en main.py:
        from knowledge_system.knowledge_routes import incluir_rutas
        incluir_rutas(app)
    """
    app.include_router(router)
    logger.info("📚 Rutas de conocimiento registradas")
