# backend/routes/google_sheets_routes.py
# Rutas API para integración con Google Sheets

from fastapi import APIRouter, HTTPException, Depends, Query, Body
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime
import logging

from ..services.google_sheets_service import (
    get_google_sheets_service,
    initialize_google_sheets_service,
    GoogleSheetsService,
    EnvioRow,
    FinanzasRow,
    CiudadRow,
    AlertaRow,
    DashboardMetrics,
    SheetTemplate,
    SyncResult,
    SyncDirection,
    SpreadsheetInfo
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/google-sheets", tags=["Google Sheets"])

# ==================== MODELOS DE REQUEST/RESPONSE ====================

class ConnectRequest(BaseModel):
    spreadsheet_id: str
    credentials: Optional[str] = None  # JSON string de credenciales

class ConnectResponse(BaseModel):
    success: bool
    spreadsheet: Optional[SpreadsheetInfo] = None
    message: str

class WriteDataRequest(BaseModel):
    spreadsheet_id: str
    sheet_name: str
    data: List[List[Any]]
    start_cell: str = "A1"

class AppendRowsRequest(BaseModel):
    spreadsheet_id: str
    sheet_name: str
    rows: List[List[Any]]

class UpdateCellRequest(BaseModel):
    spreadsheet_id: str
    sheet_name: str
    cell: str
    value: Any

class SyncEnviosRequest(BaseModel):
    spreadsheet_id: str
    envios: List[EnvioRow]
    sheet_name: str = "Envíos"
    clear_existing: bool = True

class SyncFinanzasRequest(BaseModel):
    spreadsheet_id: str
    finanzas: List[FinanzasRow]
    sheet_name: str = "Finanzas"

class SyncCiudadesRequest(BaseModel):
    spreadsheet_id: str
    ciudades: List[CiudadRow]
    sheet_name: str = "Ciudades"

class SyncAlertasRequest(BaseModel):
    spreadsheet_id: str
    alertas: List[AlertaRow]
    sheet_name: str = "Alertas"

class UpdateDashboardRequest(BaseModel):
    spreadsheet_id: str
    metrics: DashboardMetrics
    sheet_name: str = "Dashboard"

class CreateTemplateRequest(BaseModel):
    spreadsheet_id: str
    template: SheetTemplate

class CreateSheetRequest(BaseModel):
    spreadsheet_id: str
    sheet_name: str
    rows: int = 1000
    columns: int = 26

class SheetDataResponse(BaseModel):
    sheet_name: str
    headers: List[str]
    rows: List[List[Any]]
    total_rows: int
    last_updated: datetime

class ApiResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Any] = None

# ==================== DEPENDENCIAS ====================

def get_sheets_service() -> GoogleSheetsService:
    """Dependency para obtener el servicio de Google Sheets"""
    return get_google_sheets_service()

# ==================== ENDPOINTS ====================

@router.get("/status")
async def get_status(service: GoogleSheetsService = Depends(get_sheets_service)):
    """Verificar estado del servicio"""
    return {
        "available": service.is_available(),
        "message": "Google Sheets service is ready" if service.is_available() else "Service not configured"
    }

@router.post("/initialize")
async def initialize_service(
    credentials_path: Optional[str] = Body(None),
    credentials_json: Optional[str] = Body(None)
):
    """Inicializar servicio con credenciales"""
    try:
        service = initialize_google_sheets_service(credentials_path, credentials_json)
        return ApiResponse(
            success=service.is_available(),
            message="Service initialized" if service.is_available() else "Failed to initialize",
            data={"available": service.is_available()}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/connect", response_model=ConnectResponse)
async def connect_spreadsheet(
    request: ConnectRequest,
    service: GoogleSheetsService = Depends(get_sheets_service)
):
    """Conectar a un spreadsheet específico"""
    try:
        if request.credentials:
            service = initialize_google_sheets_service(credentials_json=request.credentials)

        if not service.is_available():
            return ConnectResponse(
                success=False,
                spreadsheet=None,
                message="El servicio de Google Sheets no está configurado. Configure las credenciales primero."
            )

        info = service.get_spreadsheet_info(request.spreadsheet_id)

        if info:
            return ConnectResponse(
                success=True,
                spreadsheet=info,
                message=f"Conectado exitosamente a '{info.title}'"
            )
        else:
            return ConnectResponse(
                success=False,
                spreadsheet=None,
                message="No se pudo acceder al spreadsheet. Verifique el ID y los permisos."
            )
    except Exception as e:
        logger.error(f"Error connecting to spreadsheet: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/info/{spreadsheet_id}", response_model=SpreadsheetInfo)
async def get_spreadsheet_info(
    spreadsheet_id: str,
    service: GoogleSheetsService = Depends(get_sheets_service)
):
    """Obtener información de un spreadsheet"""
    if not service.is_available():
        raise HTTPException(status_code=503, detail="Servicio no disponible")

    info = service.get_spreadsheet_info(spreadsheet_id)
    if not info:
        raise HTTPException(status_code=404, detail="Spreadsheet no encontrado")

    return info

@router.get("/sheets/{spreadsheet_id}")
async def get_sheet_names(
    spreadsheet_id: str,
    service: GoogleSheetsService = Depends(get_sheets_service)
):
    """Obtener nombres de todas las hojas"""
    if not service.is_available():
        raise HTTPException(status_code=503, detail="Servicio no disponible")

    names = service.get_sheet_names(spreadsheet_id)
    return {"sheets": names}

@router.get("/data")
async def get_sheet_data(
    spreadsheet_id: str = Query(..., description="ID del spreadsheet"),
    sheet_name: str = Query(..., description="Nombre de la hoja"),
    range: Optional[str] = Query(None, description="Rango opcional (ej: A1:Z100)"),
    service: GoogleSheetsService = Depends(get_sheets_service)
):
    """Obtener datos de una hoja"""
    if not service.is_available():
        raise HTTPException(status_code=503, detail="Servicio no disponible")

    try:
        headers, rows = service.read_sheet(spreadsheet_id, sheet_name, range)

        return SheetDataResponse(
            sheet_name=sheet_name,
            headers=headers,
            rows=rows,
            total_rows=len(rows),
            last_updated=datetime.now()
        )
    except Exception as e:
        logger.error(f"Error reading sheet data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/write")
async def write_data(
    request: WriteDataRequest,
    service: GoogleSheetsService = Depends(get_sheets_service)
):
    """Escribir datos a una hoja"""
    if not service.is_available():
        raise HTTPException(status_code=503, detail="Servicio no disponible")

    try:
        success = service.write_data(
            request.spreadsheet_id,
            request.sheet_name,
            request.data,
            request.start_cell
        )

        return ApiResponse(
            success=success,
            message="Datos escritos exitosamente" if success else "Error al escribir datos"
        )
    except Exception as e:
        logger.error(f"Error writing data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/append")
async def append_rows(
    request: AppendRowsRequest,
    service: GoogleSheetsService = Depends(get_sheets_service)
):
    """Agregar filas al final de una hoja"""
    if not service.is_available():
        raise HTTPException(status_code=503, detail="Servicio no disponible")

    try:
        rows_added = service.append_rows(
            request.spreadsheet_id,
            request.sheet_name,
            request.rows
        )

        return ApiResponse(
            success=rows_added > 0,
            message=f"Se agregaron {rows_added} filas",
            data={"rows_added": rows_added}
        )
    except Exception as e:
        logger.error(f"Error appending rows: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/update-cell")
async def update_cell(
    request: UpdateCellRequest,
    service: GoogleSheetsService = Depends(get_sheets_service)
):
    """Actualizar una celda específica"""
    if not service.is_available():
        raise HTTPException(status_code=503, detail="Servicio no disponible")

    try:
        success = service.update_cell(
            request.spreadsheet_id,
            request.sheet_name,
            request.cell,
            request.value
        )

        return ApiResponse(
            success=success,
            message="Celda actualizada" if success else "Error al actualizar celda"
        )
    except Exception as e:
        logger.error(f"Error updating cell: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/create-sheet")
async def create_sheet(
    request: CreateSheetRequest,
    service: GoogleSheetsService = Depends(get_sheets_service)
):
    """Crear una nueva hoja"""
    if not service.is_available():
        raise HTTPException(status_code=503, detail="Servicio no disponible")

    try:
        sheet_id = service.create_sheet(
            request.spreadsheet_id,
            request.sheet_name,
            request.rows,
            request.columns
        )

        return ApiResponse(
            success=sheet_id is not None,
            message=f"Hoja '{request.sheet_name}' creada" if sheet_id else "Error al crear hoja",
            data={"sheet_id": sheet_id}
        )
    except Exception as e:
        logger.error(f"Error creating sheet: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/sheet/{spreadsheet_id}/{sheet_id}")
async def delete_sheet(
    spreadsheet_id: str,
    sheet_id: int,
    service: GoogleSheetsService = Depends(get_sheets_service)
):
    """Eliminar una hoja"""
    if not service.is_available():
        raise HTTPException(status_code=503, detail="Servicio no disponible")

    try:
        success = service.delete_sheet(spreadsheet_id, sheet_id)

        return ApiResponse(
            success=success,
            message="Hoja eliminada" if success else "Error al eliminar hoja"
        )
    except Exception as e:
        logger.error(f"Error deleting sheet: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/clear/{spreadsheet_id}/{sheet_name}")
async def clear_sheet(
    spreadsheet_id: str,
    sheet_name: str,
    preserve_headers: bool = Query(True, description="Mantener fila de encabezados"),
    service: GoogleSheetsService = Depends(get_sheets_service)
):
    """Limpiar contenido de una hoja"""
    if not service.is_available():
        raise HTTPException(status_code=503, detail="Servicio no disponible")

    try:
        success = service.clear_sheet(spreadsheet_id, sheet_name, preserve_headers)

        return ApiResponse(
            success=success,
            message="Hoja limpiada" if success else "Error al limpiar hoja"
        )
    except Exception as e:
        logger.error(f"Error clearing sheet: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== SINCRONIZACIÓN ====================

@router.post("/sync/envios", response_model=SyncResult)
async def sync_envios(
    request: SyncEnviosRequest,
    service: GoogleSheetsService = Depends(get_sheets_service)
):
    """Sincronizar envíos a Google Sheets"""
    if not service.is_available():
        raise HTTPException(status_code=503, detail="Servicio no disponible")

    try:
        result = service.sync_envios(
            request.spreadsheet_id,
            request.envios,
            request.sheet_name,
            request.clear_existing
        )
        return result
    except Exception as e:
        logger.error(f"Error syncing envios: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/sync/finanzas", response_model=SyncResult)
async def sync_finanzas(
    request: SyncFinanzasRequest,
    service: GoogleSheetsService = Depends(get_sheets_service)
):
    """Sincronizar datos financieros a Google Sheets"""
    if not service.is_available():
        raise HTTPException(status_code=503, detail="Servicio no disponible")

    try:
        result = service.sync_finanzas(
            request.spreadsheet_id,
            request.finanzas,
            request.sheet_name
        )
        return result
    except Exception as e:
        logger.error(f"Error syncing finanzas: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/sync/ciudades", response_model=SyncResult)
async def sync_ciudades(
    request: SyncCiudadesRequest,
    service: GoogleSheetsService = Depends(get_sheets_service)
):
    """Sincronizar estadísticas de ciudades a Google Sheets"""
    if not service.is_available():
        raise HTTPException(status_code=503, detail="Servicio no disponible")

    try:
        result = service.sync_ciudades(
            request.spreadsheet_id,
            request.ciudades,
            request.sheet_name
        )
        return result
    except Exception as e:
        logger.error(f"Error syncing ciudades: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/sync/alertas", response_model=SyncResult)
async def sync_alertas(
    request: SyncAlertasRequest,
    service: GoogleSheetsService = Depends(get_sheets_service)
):
    """Sincronizar alertas a Google Sheets"""
    if not service.is_available():
        raise HTTPException(status_code=503, detail="Servicio no disponible")

    try:
        result = service.sync_alertas(
            request.spreadsheet_id,
            request.alertas,
            request.sheet_name
        )
        return result
    except Exception as e:
        logger.error(f"Error syncing alertas: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/dashboard/update")
async def update_dashboard(
    request: UpdateDashboardRequest,
    service: GoogleSheetsService = Depends(get_sheets_service)
):
    """Actualizar dashboard de métricas"""
    if not service.is_available():
        raise HTTPException(status_code=503, detail="Servicio no disponible")

    try:
        success = service.update_dashboard(
            request.spreadsheet_id,
            request.metrics,
            request.sheet_name
        )

        return ApiResponse(
            success=success,
            message="Dashboard actualizado" if success else "Error al actualizar dashboard"
        )
    except Exception as e:
        logger.error(f"Error updating dashboard: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== PLANTILLAS ====================

@router.post("/create-template")
async def create_from_template(
    request: CreateTemplateRequest,
    service: GoogleSheetsService = Depends(get_sheets_service)
):
    """Crear hojas desde una plantilla"""
    if not service.is_available():
        raise HTTPException(status_code=503, detail="Servicio no disponible")

    try:
        success = service.create_from_template(
            request.spreadsheet_id,
            request.template
        )

        return ApiResponse(
            success=success,
            message=f"Plantilla '{request.template.name}' aplicada" if success else "Error al aplicar plantilla"
        )
    except Exception as e:
        logger.error(f"Error creating from template: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== IMPORTACIÓN ====================

@router.get("/import/envios")
async def import_envios(
    spreadsheet_id: str = Query(...),
    sheet_name: str = Query("Envíos"),
    service: GoogleSheetsService = Depends(get_sheets_service)
):
    """Importar envíos desde Google Sheets"""
    if not service.is_available():
        raise HTTPException(status_code=503, detail="Servicio no disponible")

    try:
        envios = service.import_envios(spreadsheet_id, sheet_name)

        return {
            "success": True,
            "count": len(envios),
            "envios": envios
        }
    except Exception as e:
        logger.error(f"Error importing envios: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== UTILIDADES ====================

@router.get("/test-connection/{spreadsheet_id}")
async def test_connection(
    spreadsheet_id: str,
    service: GoogleSheetsService = Depends(get_sheets_service)
):
    """Probar conexión a un spreadsheet"""
    if not service.is_available():
        return {
            "connected": False,
            "message": "Servicio no configurado"
        }

    try:
        info = service.get_spreadsheet_info(spreadsheet_id)

        if info:
            return {
                "connected": True,
                "spreadsheet_title": info.title,
                "sheets_count": len(info.sheets),
                "message": f"Conexión exitosa a '{info.title}'"
            }
        else:
            return {
                "connected": False,
                "message": "No se pudo acceder al spreadsheet"
            }
    except Exception as e:
        return {
            "connected": False,
            "message": str(e)
        }

@router.get("/generate-url/{spreadsheet_id}")
async def generate_url(spreadsheet_id: str):
    """Generar URL de Google Sheets"""
    return {
        "url": f"https://docs.google.com/spreadsheets/d/{spreadsheet_id}",
        "edit_url": f"https://docs.google.com/spreadsheets/d/{spreadsheet_id}/edit"
    }
