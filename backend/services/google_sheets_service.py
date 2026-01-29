# backend/services/google_sheets_service.py
# Servicio para integración con Google Sheets API

import os
import json
import logging
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, date
from enum import Enum

# Google API imports
try:
    from google.oauth2 import service_account
    from google.oauth2.credentials import Credentials
    from googleapiclient.discovery import build
    from googleapiclient.errors import HttpError
    GOOGLE_API_AVAILABLE = True
except ImportError:
    GOOGLE_API_AVAILABLE = False
    logging.warning("Google API libraries not installed. Install with: pip install google-api-python-client google-auth")

from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

# ==================== MODELOS ====================

class SyncDirection(str, Enum):
    TO_SHEETS = "to_sheets"
    FROM_SHEETS = "from_sheets"
    BIDIRECTIONAL = "bidirectional"

class SheetInfo(BaseModel):
    sheet_id: int
    title: str
    index: int
    row_count: int
    column_count: int

class SpreadsheetInfo(BaseModel):
    spreadsheet_id: str
    title: str
    locale: str
    time_zone: str
    sheets: List[SheetInfo]

class SyncError(BaseModel):
    row: int
    column: Optional[str] = None
    message: str
    data: Optional[Dict[str, Any]] = None

class SyncResult(BaseModel):
    success: bool
    direction: SyncDirection
    rows_processed: int
    rows_created: int
    rows_updated: int
    rows_skipped: int
    errors: List[SyncError] = []
    duration_ms: int
    timestamp: datetime

class EnvioRow(BaseModel):
    numero_guia: str
    transportadora: str
    estado: str
    ciudad_destino: str
    dias_transito: int
    nombre_cliente: str
    telefono: str
    valor_declarado: float
    tiene_novedad: bool
    tipo_novedad: Optional[str] = None
    nivel_riesgo: str
    fecha_carga: str
    ultima_actualizacion: str

class FinanzasRow(BaseModel):
    fecha: str
    total_ventas: float
    costo_fletes: float
    devoluciones: float
    ganancia_neta: float
    margen_porcentaje: float
    envios_entregados: int
    envios_devueltos: int

class CiudadRow(BaseModel):
    ciudad: str
    departamento: str
    total_envios: int
    entregados: int
    novedades: int
    devueltos: int
    tasa_exito: float
    dias_promedio: float
    transportadora_principal: str
    riesgo: str

class AlertaRow(BaseModel):
    id: str
    numero_guia: str
    tipo_alerta: str
    prioridad: str
    mensaje: str
    accion_sugerida: str
    estado: str
    fecha_creacion: str

class DashboardMetrics(BaseModel):
    total_envios: int
    entregados: int
    en_transito: int
    novedades: int
    devueltos: int
    tasa_exito: float
    dias_promedio_entrega: float
    valor_en_riesgo: float
    top_ciudades_problematicas: List[Dict[str, Any]] = []
    rendimiento_transportadoras: List[Dict[str, Any]] = []

class SheetTemplate(BaseModel):
    id: str
    name: str
    description: str
    category: str
    sheets: List[Dict[str, Any]]
    formulas: List[Dict[str, Any]] = []

# ==================== SERVICIO PRINCIPAL ====================

class GoogleSheetsService:
    """Servicio para operaciones con Google Sheets API"""

    SCOPES = [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive.file'
    ]

    def __init__(self, credentials_path: Optional[str] = None, credentials_json: Optional[str] = None):
        """
        Inicializar servicio.

        Args:
            credentials_path: Ruta al archivo JSON de credenciales de servicio
            credentials_json: JSON string de credenciales (alternativa)
        """
        self.credentials = None
        self.service = None
        self.drive_service = None

        if not GOOGLE_API_AVAILABLE:
            logger.error("Google API libraries not available")
            return

        # Intentar cargar credenciales
        try:
            if credentials_json:
                creds_dict = json.loads(credentials_json)
                self.credentials = service_account.Credentials.from_service_account_info(
                    creds_dict, scopes=self.SCOPES
                )
            elif credentials_path and os.path.exists(credentials_path):
                self.credentials = service_account.Credentials.from_service_account_file(
                    credentials_path, scopes=self.SCOPES
                )
            elif os.environ.get('GOOGLE_SHEETS_CREDENTIALS'):
                creds_dict = json.loads(os.environ['GOOGLE_SHEETS_CREDENTIALS'])
                self.credentials = service_account.Credentials.from_service_account_info(
                    creds_dict, scopes=self.SCOPES
                )

            if self.credentials:
                self.service = build('sheets', 'v4', credentials=self.credentials)
                self.drive_service = build('drive', 'v3', credentials=self.credentials)
                logger.info("Google Sheets service initialized successfully")
        except Exception as e:
            logger.error(f"Error initializing Google Sheets service: {e}")

    def is_available(self) -> bool:
        """Verificar si el servicio está disponible"""
        return self.service is not None

    # ==================== INFORMACIÓN DEL SPREADSHEET ====================

    def get_spreadsheet_info(self, spreadsheet_id: str) -> Optional[SpreadsheetInfo]:
        """Obtener información de un spreadsheet"""
        if not self.service:
            return None

        try:
            result = self.service.spreadsheets().get(
                spreadsheetId=spreadsheet_id
            ).execute()

            sheets = []
            for sheet in result.get('sheets', []):
                props = sheet.get('properties', {})
                grid_props = props.get('gridProperties', {})
                sheets.append(SheetInfo(
                    sheet_id=props.get('sheetId', 0),
                    title=props.get('title', ''),
                    index=props.get('index', 0),
                    row_count=grid_props.get('rowCount', 0),
                    column_count=grid_props.get('columnCount', 0)
                ))

            props = result.get('properties', {})
            return SpreadsheetInfo(
                spreadsheet_id=spreadsheet_id,
                title=props.get('title', ''),
                locale=props.get('locale', 'es_CO'),
                time_zone=props.get('timeZone', 'America/Bogota'),
                sheets=sheets
            )
        except HttpError as e:
            logger.error(f"Error getting spreadsheet info: {e}")
            return None

    def get_sheet_names(self, spreadsheet_id: str) -> List[str]:
        """Obtener nombres de todas las hojas"""
        info = self.get_spreadsheet_info(spreadsheet_id)
        if info:
            return [sheet.title for sheet in info.sheets]
        return []

    # ==================== LECTURA DE DATOS ====================

    def read_sheet(
        self,
        spreadsheet_id: str,
        sheet_name: str,
        range_notation: Optional[str] = None
    ) -> Tuple[List[str], List[List[Any]]]:
        """
        Leer datos de una hoja.

        Returns:
            Tuple de (headers, rows)
        """
        if not self.service:
            return [], []

        try:
            # Construir rango
            if range_notation:
                full_range = f"{sheet_name}!{range_notation}"
            else:
                full_range = sheet_name

            result = self.service.spreadsheets().values().get(
                spreadsheetId=spreadsheet_id,
                range=full_range,
                valueRenderOption='FORMATTED_VALUE'
            ).execute()

            values = result.get('values', [])

            if not values:
                return [], []

            headers = values[0] if values else []
            rows = values[1:] if len(values) > 1 else []

            return headers, rows
        except HttpError as e:
            logger.error(f"Error reading sheet: {e}")
            return [], []

    def read_range(
        self,
        spreadsheet_id: str,
        range_notation: str
    ) -> List[List[Any]]:
        """Leer un rango específico"""
        if not self.service:
            return []

        try:
            result = self.service.spreadsheets().values().get(
                spreadsheetId=spreadsheet_id,
                range=range_notation,
                valueRenderOption='FORMATTED_VALUE'
            ).execute()

            return result.get('values', [])
        except HttpError as e:
            logger.error(f"Error reading range: {e}")
            return []

    # ==================== ESCRITURA DE DATOS ====================

    def write_data(
        self,
        spreadsheet_id: str,
        sheet_name: str,
        data: List[List[Any]],
        start_cell: str = 'A1'
    ) -> bool:
        """Escribir datos a una hoja"""
        if not self.service:
            return False

        try:
            range_notation = f"{sheet_name}!{start_cell}"

            body = {
                'values': data
            }

            self.service.spreadsheets().values().update(
                spreadsheetId=spreadsheet_id,
                range=range_notation,
                valueInputOption='USER_ENTERED',
                body=body
            ).execute()

            return True
        except HttpError as e:
            logger.error(f"Error writing data: {e}")
            return False

    def append_rows(
        self,
        spreadsheet_id: str,
        sheet_name: str,
        rows: List[List[Any]]
    ) -> int:
        """Agregar filas al final de una hoja"""
        if not self.service:
            return 0

        try:
            body = {
                'values': rows
            }

            result = self.service.spreadsheets().values().append(
                spreadsheetId=spreadsheet_id,
                range=f"{sheet_name}!A1",
                valueInputOption='USER_ENTERED',
                insertDataOption='INSERT_ROWS',
                body=body
            ).execute()

            updates = result.get('updates', {})
            return updates.get('updatedRows', 0)
        except HttpError as e:
            logger.error(f"Error appending rows: {e}")
            return 0

    def update_cell(
        self,
        spreadsheet_id: str,
        sheet_name: str,
        cell: str,
        value: Any
    ) -> bool:
        """Actualizar una celda específica"""
        return self.write_data(spreadsheet_id, sheet_name, [[value]], cell)

    def clear_sheet(
        self,
        spreadsheet_id: str,
        sheet_name: str,
        preserve_headers: bool = True
    ) -> bool:
        """Limpiar contenido de una hoja"""
        if not self.service:
            return False

        try:
            start_row = 2 if preserve_headers else 1
            range_notation = f"{sheet_name}!A{start_row}:ZZ"

            self.service.spreadsheets().values().clear(
                spreadsheetId=spreadsheet_id,
                range=range_notation
            ).execute()

            return True
        except HttpError as e:
            logger.error(f"Error clearing sheet: {e}")
            return False

    # ==================== GESTIÓN DE HOJAS ====================

    def create_sheet(
        self,
        spreadsheet_id: str,
        sheet_name: str,
        rows: int = 1000,
        columns: int = 26
    ) -> Optional[int]:
        """Crear una nueva hoja y retornar su ID"""
        if not self.service:
            return None

        try:
            request = {
                'addSheet': {
                    'properties': {
                        'title': sheet_name,
                        'gridProperties': {
                            'rowCount': rows,
                            'columnCount': columns
                        }
                    }
                }
            }

            result = self.service.spreadsheets().batchUpdate(
                spreadsheetId=spreadsheet_id,
                body={'requests': [request]}
            ).execute()

            replies = result.get('replies', [])
            if replies:
                return replies[0].get('addSheet', {}).get('properties', {}).get('sheetId')
            return None
        except HttpError as e:
            # Si la hoja ya existe, obtener su ID
            if 'already exists' in str(e):
                info = self.get_spreadsheet_info(spreadsheet_id)
                if info:
                    for sheet in info.sheets:
                        if sheet.title == sheet_name:
                            return sheet.sheet_id
            logger.error(f"Error creating sheet: {e}")
            return None

    def delete_sheet(self, spreadsheet_id: str, sheet_id: int) -> bool:
        """Eliminar una hoja por su ID"""
        if not self.service:
            return False

        try:
            request = {
                'deleteSheet': {
                    'sheetId': sheet_id
                }
            }

            self.service.spreadsheets().batchUpdate(
                spreadsheetId=spreadsheet_id,
                body={'requests': [request]}
            ).execute()

            return True
        except HttpError as e:
            logger.error(f"Error deleting sheet: {e}")
            return False

    # ==================== FORMATO ====================

    def format_header_row(
        self,
        spreadsheet_id: str,
        sheet_id: int,
        background_color: Dict[str, float] = None,
        text_color: Dict[str, float] = None,
        bold: bool = True
    ) -> bool:
        """Formatear la fila de encabezados"""
        if not self.service:
            return False

        if background_color is None:
            background_color = {'red': 0.2, 'green': 0.4, 'blue': 0.8}
        if text_color is None:
            text_color = {'red': 1, 'green': 1, 'blue': 1}

        try:
            requests = [
                {
                    'repeatCell': {
                        'range': {
                            'sheetId': sheet_id,
                            'startRowIndex': 0,
                            'endRowIndex': 1
                        },
                        'cell': {
                            'userEnteredFormat': {
                                'backgroundColor': background_color,
                                'textFormat': {
                                    'foregroundColor': text_color,
                                    'bold': bold
                                }
                            }
                        },
                        'fields': 'userEnteredFormat(backgroundColor,textFormat)'
                    }
                },
                {
                    'updateSheetProperties': {
                        'properties': {
                            'sheetId': sheet_id,
                            'gridProperties': {
                                'frozenRowCount': 1
                            }
                        },
                        'fields': 'gridProperties.frozenRowCount'
                    }
                }
            ]

            self.service.spreadsheets().batchUpdate(
                spreadsheetId=spreadsheet_id,
                body={'requests': requests}
            ).execute()

            return True
        except HttpError as e:
            logger.error(f"Error formatting header: {e}")
            return False

    def auto_resize_columns(
        self,
        spreadsheet_id: str,
        sheet_id: int,
        start_column: int = 0,
        end_column: int = 26
    ) -> bool:
        """Auto-redimensionar columnas"""
        if not self.service:
            return False

        try:
            request = {
                'autoResizeDimensions': {
                    'dimensions': {
                        'sheetId': sheet_id,
                        'dimension': 'COLUMNS',
                        'startIndex': start_column,
                        'endIndex': end_column
                    }
                }
            }

            self.service.spreadsheets().batchUpdate(
                spreadsheetId=spreadsheet_id,
                body={'requests': [request]}
            ).execute()

            return True
        except HttpError as e:
            logger.error(f"Error auto-resizing columns: {e}")
            return False

    # ==================== SINCRONIZACIÓN DE ENVÍOS ====================

    def sync_envios(
        self,
        spreadsheet_id: str,
        envios: List[EnvioRow],
        sheet_name: str = 'Envíos',
        clear_existing: bool = True
    ) -> SyncResult:
        """Sincronizar lista de envíos a Google Sheets"""
        start_time = datetime.now()
        errors = []

        if not self.service:
            return SyncResult(
                success=False,
                direction=SyncDirection.TO_SHEETS,
                rows_processed=0,
                rows_created=0,
                rows_updated=0,
                rows_skipped=len(envios),
                errors=[SyncError(row=0, message="Servicio no disponible")],
                duration_ms=0,
                timestamp=datetime.now()
            )

        try:
            # Crear hoja si no existe
            sheet_id = self.create_sheet(spreadsheet_id, sheet_name)

            # Headers
            headers = [
                'Guía', 'Transportadora', 'Estado', 'Ciudad', 'Días',
                'Cliente', 'Teléfono', 'Valor', 'Novedad', 'Tipo Novedad',
                'Riesgo', 'Fecha Carga', 'Última Actualización'
            ]

            # Convertir envíos a filas
            rows = []
            for i, envio in enumerate(envios):
                try:
                    row = [
                        envio.numero_guia,
                        envio.transportadora,
                        envio.estado,
                        envio.ciudad_destino,
                        envio.dias_transito,
                        envio.nombre_cliente,
                        envio.telefono,
                        envio.valor_declarado,
                        'Sí' if envio.tiene_novedad else 'No',
                        envio.tipo_novedad or '',
                        envio.nivel_riesgo,
                        envio.fecha_carga,
                        envio.ultima_actualizacion
                    ]
                    rows.append(row)
                except Exception as e:
                    errors.append(SyncError(
                        row=i + 2,
                        message=str(e),
                        data={'numero_guia': envio.numero_guia}
                    ))

            # Limpiar hoja existente
            if clear_existing:
                self.clear_sheet(spreadsheet_id, sheet_name, preserve_headers=False)

            # Escribir headers y datos
            all_data = [headers] + rows
            success = self.write_data(spreadsheet_id, sheet_name, all_data, 'A1')

            # Formatear
            if sheet_id and success:
                self.format_header_row(spreadsheet_id, sheet_id)
                self.auto_resize_columns(spreadsheet_id, sheet_id)

            duration = int((datetime.now() - start_time).total_seconds() * 1000)

            return SyncResult(
                success=success,
                direction=SyncDirection.TO_SHEETS,
                rows_processed=len(envios),
                rows_created=len(rows) if success else 0,
                rows_updated=0,
                rows_skipped=len(errors),
                errors=errors,
                duration_ms=duration,
                timestamp=datetime.now()
            )

        except Exception as e:
            logger.error(f"Error syncing envios: {e}")
            duration = int((datetime.now() - start_time).total_seconds() * 1000)
            return SyncResult(
                success=False,
                direction=SyncDirection.TO_SHEETS,
                rows_processed=0,
                rows_created=0,
                rows_updated=0,
                rows_skipped=len(envios),
                errors=[SyncError(row=0, message=str(e))],
                duration_ms=duration,
                timestamp=datetime.now()
            )

    def sync_finanzas(
        self,
        spreadsheet_id: str,
        finanzas: List[FinanzasRow],
        sheet_name: str = 'Finanzas'
    ) -> SyncResult:
        """Sincronizar datos financieros"""
        start_time = datetime.now()

        if not self.service:
            return SyncResult(
                success=False,
                direction=SyncDirection.TO_SHEETS,
                rows_processed=0,
                rows_created=0,
                rows_updated=0,
                rows_skipped=len(finanzas),
                errors=[SyncError(row=0, message="Servicio no disponible")],
                duration_ms=0,
                timestamp=datetime.now()
            )

        try:
            sheet_id = self.create_sheet(spreadsheet_id, sheet_name)

            headers = [
                'Fecha', 'Total Ventas', 'Costo Fletes', 'Devoluciones',
                'Ganancia Neta', 'Margen %', 'Entregados', 'Devueltos'
            ]

            rows = []
            for f in finanzas:
                rows.append([
                    f.fecha,
                    f.total_ventas,
                    f.costo_fletes,
                    f.devoluciones,
                    f.ganancia_neta,
                    f.margen_porcentaje,
                    f.envios_entregados,
                    f.envios_devueltos
                ])

            self.clear_sheet(spreadsheet_id, sheet_name, preserve_headers=False)
            all_data = [headers] + rows
            success = self.write_data(spreadsheet_id, sheet_name, all_data, 'A1')

            if sheet_id and success:
                self.format_header_row(spreadsheet_id, sheet_id)

            duration = int((datetime.now() - start_time).total_seconds() * 1000)

            return SyncResult(
                success=success,
                direction=SyncDirection.TO_SHEETS,
                rows_processed=len(finanzas),
                rows_created=len(rows) if success else 0,
                rows_updated=0,
                rows_skipped=0,
                errors=[],
                duration_ms=duration,
                timestamp=datetime.now()
            )
        except Exception as e:
            logger.error(f"Error syncing finanzas: {e}")
            return SyncResult(
                success=False,
                direction=SyncDirection.TO_SHEETS,
                rows_processed=0,
                rows_created=0,
                rows_updated=0,
                rows_skipped=len(finanzas),
                errors=[SyncError(row=0, message=str(e))],
                duration_ms=int((datetime.now() - start_time).total_seconds() * 1000),
                timestamp=datetime.now()
            )

    def sync_ciudades(
        self,
        spreadsheet_id: str,
        ciudades: List[CiudadRow],
        sheet_name: str = 'Ciudades'
    ) -> SyncResult:
        """Sincronizar estadísticas por ciudad"""
        start_time = datetime.now()

        if not self.service:
            return SyncResult(
                success=False,
                direction=SyncDirection.TO_SHEETS,
                rows_processed=0,
                rows_created=0,
                rows_updated=0,
                rows_skipped=len(ciudades),
                errors=[SyncError(row=0, message="Servicio no disponible")],
                duration_ms=0,
                timestamp=datetime.now()
            )

        try:
            sheet_id = self.create_sheet(spreadsheet_id, sheet_name)

            headers = [
                'Ciudad', 'Departamento', 'Total Envíos', 'Entregados',
                'Novedades', 'Devueltos', 'Tasa %', 'Días Prom',
                'Transportadora Principal', 'Riesgo'
            ]

            rows = []
            for c in ciudades:
                rows.append([
                    c.ciudad,
                    c.departamento,
                    c.total_envios,
                    c.entregados,
                    c.novedades,
                    c.devueltos,
                    c.tasa_exito,
                    c.dias_promedio,
                    c.transportadora_principal,
                    c.riesgo
                ])

            self.clear_sheet(spreadsheet_id, sheet_name, preserve_headers=False)
            all_data = [headers] + rows
            success = self.write_data(spreadsheet_id, sheet_name, all_data, 'A1')

            if sheet_id and success:
                self.format_header_row(spreadsheet_id, sheet_id)

            duration = int((datetime.now() - start_time).total_seconds() * 1000)

            return SyncResult(
                success=success,
                direction=SyncDirection.TO_SHEETS,
                rows_processed=len(ciudades),
                rows_created=len(rows) if success else 0,
                rows_updated=0,
                rows_skipped=0,
                errors=[],
                duration_ms=duration,
                timestamp=datetime.now()
            )
        except Exception as e:
            logger.error(f"Error syncing ciudades: {e}")
            return SyncResult(
                success=False,
                direction=SyncDirection.TO_SHEETS,
                rows_processed=0,
                rows_created=0,
                rows_updated=0,
                rows_skipped=len(ciudades),
                errors=[SyncError(row=0, message=str(e))],
                duration_ms=int((datetime.now() - start_time).total_seconds() * 1000),
                timestamp=datetime.now()
            )

    def sync_alertas(
        self,
        spreadsheet_id: str,
        alertas: List[AlertaRow],
        sheet_name: str = 'Alertas'
    ) -> SyncResult:
        """Sincronizar alertas"""
        start_time = datetime.now()

        if not self.service:
            return SyncResult(
                success=False,
                direction=SyncDirection.TO_SHEETS,
                rows_processed=0,
                rows_created=0,
                rows_updated=0,
                rows_skipped=len(alertas),
                errors=[SyncError(row=0, message="Servicio no disponible")],
                duration_ms=0,
                timestamp=datetime.now()
            )

        try:
            sheet_id = self.create_sheet(spreadsheet_id, sheet_name)

            headers = ['ID', 'Guía', 'Tipo', 'Prioridad', 'Mensaje', 'Acción', 'Estado', 'Fecha']

            rows = []
            for a in alertas:
                rows.append([
                    a.id,
                    a.numero_guia,
                    a.tipo_alerta,
                    a.prioridad,
                    a.mensaje,
                    a.accion_sugerida,
                    a.estado,
                    a.fecha_creacion
                ])

            self.clear_sheet(spreadsheet_id, sheet_name, preserve_headers=False)
            all_data = [headers] + rows
            success = self.write_data(spreadsheet_id, sheet_name, all_data, 'A1')

            if sheet_id and success:
                self.format_header_row(spreadsheet_id, sheet_id)

            duration = int((datetime.now() - start_time).total_seconds() * 1000)

            return SyncResult(
                success=success,
                direction=SyncDirection.TO_SHEETS,
                rows_processed=len(alertas),
                rows_created=len(rows) if success else 0,
                rows_updated=0,
                rows_skipped=0,
                errors=[],
                duration_ms=duration,
                timestamp=datetime.now()
            )
        except Exception as e:
            return SyncResult(
                success=False,
                direction=SyncDirection.TO_SHEETS,
                rows_processed=0,
                rows_created=0,
                rows_updated=0,
                rows_skipped=len(alertas),
                errors=[SyncError(row=0, message=str(e))],
                duration_ms=int((datetime.now() - start_time).total_seconds() * 1000),
                timestamp=datetime.now()
            )

    # ==================== DASHBOARD ====================

    def update_dashboard(
        self,
        spreadsheet_id: str,
        metrics: DashboardMetrics,
        sheet_name: str = 'Dashboard'
    ) -> bool:
        """Actualizar hoja de dashboard con métricas"""
        if not self.service:
            return False

        try:
            sheet_id = self.create_sheet(spreadsheet_id, sheet_name)

            # Datos del dashboard
            dashboard_data = [
                ['Métrica', 'Valor', 'Indicador'],
                ['Total Envíos', metrics.total_envios, '📦'],
                ['Entregados', metrics.entregados, '✅'],
                ['En Tránsito', metrics.en_transito, '🚚'],
                ['Novedades', metrics.novedades, '⚠️'],
                ['Devueltos', metrics.devueltos, '↩️'],
                ['Tasa de Éxito', f'{metrics.tasa_exito:.1f}%', '🟢' if metrics.tasa_exito >= 90 else ('🟡' if metrics.tasa_exito >= 70 else '🔴')],
                ['Días Promedio', f'{metrics.dias_promedio_entrega:.1f}', '📅'],
                ['Valor en Riesgo', f'${metrics.valor_en_riesgo:,.0f}', '💰'],
            ]

            self.clear_sheet(spreadsheet_id, sheet_name, preserve_headers=False)
            self.write_data(spreadsheet_id, sheet_name, dashboard_data, 'A1')

            # Top ciudades problemáticas
            if metrics.top_ciudades_problematicas:
                ciudades_data = [
                    [''],
                    ['Top Ciudades Problemáticas'],
                    ['Ciudad', 'Tasa Éxito', 'Indicador']
                ]
                for c in metrics.top_ciudades_problematicas[:5]:
                    tasa = c.get('tasa', 0)
                    indicador = '🔴' if tasa < 70 else ('🟡' if tasa < 85 else '🟢')
                    ciudades_data.append([c.get('ciudad', ''), f'{tasa:.1f}%', indicador])

                self.write_data(spreadsheet_id, sheet_name, ciudades_data, 'A12')

            # Rendimiento transportadoras
            if metrics.rendimiento_transportadoras:
                trans_data = [
                    [''],
                    ['Rendimiento Transportadoras'],
                    ['Transportadora', 'Tasa %', 'Días Prom']
                ]
                for t in metrics.rendimiento_transportadoras[:5]:
                    trans_data.append([
                        t.get('nombre', ''),
                        f'{t.get("tasa", 0):.1f}%',
                        f'{t.get("promedioDias", 0):.1f}'
                    ])

                self.write_data(spreadsheet_id, sheet_name, trans_data, 'E12')

            if sheet_id:
                self.format_header_row(spreadsheet_id, sheet_id)

            return True
        except Exception as e:
            logger.error(f"Error updating dashboard: {e}")
            return False

    # ==================== PLANTILLAS ====================

    def create_from_template(
        self,
        spreadsheet_id: str,
        template: SheetTemplate
    ) -> bool:
        """Crear hojas desde una plantilla"""
        if not self.service:
            return False

        try:
            for sheet_config in template.sheets:
                sheet_name = sheet_config.get('name', 'Sheet')
                headers = sheet_config.get('headers', [])

                # Crear hoja
                sheet_id = self.create_sheet(spreadsheet_id, sheet_name)

                # Escribir headers
                if headers:
                    self.write_data(spreadsheet_id, sheet_name, [headers], 'A1')

                # Formatear
                if sheet_id:
                    self.format_header_row(spreadsheet_id, sheet_id)

                    # Congelar filas/columnas si está especificado
                    frozen_rows = sheet_config.get('frozenRows', 0)
                    frozen_cols = sheet_config.get('frozenColumns', 0)

                    if frozen_rows > 0 or frozen_cols > 0:
                        self._freeze_cells(spreadsheet_id, sheet_id, frozen_rows, frozen_cols)

            # Aplicar fórmulas
            for formula in template.formulas:
                sheet_name = formula.get('sheet', '')
                cell = formula.get('cell', '')
                formula_text = formula.get('formula', '')

                if sheet_name and cell and formula_text:
                    self.update_cell(spreadsheet_id, sheet_name, cell, formula_text)

            return True
        except Exception as e:
            logger.error(f"Error creating from template: {e}")
            return False

    def _freeze_cells(
        self,
        spreadsheet_id: str,
        sheet_id: int,
        frozen_rows: int,
        frozen_cols: int
    ) -> bool:
        """Congelar filas y columnas"""
        if not self.service:
            return False

        try:
            request = {
                'updateSheetProperties': {
                    'properties': {
                        'sheetId': sheet_id,
                        'gridProperties': {
                            'frozenRowCount': frozen_rows,
                            'frozenColumnCount': frozen_cols
                        }
                    },
                    'fields': 'gridProperties.frozenRowCount,gridProperties.frozenColumnCount'
                }
            }

            self.service.spreadsheets().batchUpdate(
                spreadsheetId=spreadsheet_id,
                body={'requests': [request]}
            ).execute()

            return True
        except HttpError as e:
            logger.error(f"Error freezing cells: {e}")
            return False

    # ==================== IMPORTACIÓN DESDE SHEETS ====================

    def import_envios(
        self,
        spreadsheet_id: str,
        sheet_name: str = 'Envíos'
    ) -> List[EnvioRow]:
        """Importar envíos desde Google Sheets"""
        headers, rows = self.read_sheet(spreadsheet_id, sheet_name)

        if not headers or not rows:
            return []

        envios = []

        # Mapear columnas
        col_map = {h.lower(): i for i, h in enumerate(headers)}

        for row in rows:
            try:
                # Obtener valores con defaults
                def get_val(col_name: str, default: Any = ''):
                    idx = col_map.get(col_name.lower())
                    if idx is not None and idx < len(row):
                        return row[idx]
                    return default

                envio = EnvioRow(
                    numero_guia=str(get_val('guía') or get_val('guia') or ''),
                    transportadora=str(get_val('transportadora', '')),
                    estado=str(get_val('estado', '')),
                    ciudad_destino=str(get_val('ciudad', '')),
                    dias_transito=int(get_val('días', 0) or get_val('dias', 0) or 0),
                    nombre_cliente=str(get_val('cliente', '')),
                    telefono=str(get_val('teléfono') or get_val('telefono') or ''),
                    valor_declarado=float(get_val('valor', 0) or 0),
                    tiene_novedad=str(get_val('novedad', 'No')).lower() in ['sí', 'si', 'yes', 'true', '1'],
                    tipo_novedad=str(get_val('tipo novedad', '')),
                    nivel_riesgo=str(get_val('riesgo', 'NORMAL')),
                    fecha_carga=str(get_val('fecha carga', '')),
                    ultima_actualizacion=str(get_val('última actualización') or get_val('ultima actualizacion') or '')
                )

                if envio.numero_guia:
                    envios.append(envio)
            except Exception as e:
                logger.warning(f"Error parsing row: {e}")
                continue

        return envios


# Instancia singleton
_google_sheets_service: Optional[GoogleSheetsService] = None

def get_google_sheets_service() -> GoogleSheetsService:
    """Obtener instancia del servicio"""
    global _google_sheets_service
    if _google_sheets_service is None:
        _google_sheets_service = GoogleSheetsService()
    return _google_sheets_service

def initialize_google_sheets_service(
    credentials_path: Optional[str] = None,
    credentials_json: Optional[str] = None
) -> GoogleSheetsService:
    """Inicializar servicio con credenciales"""
    global _google_sheets_service
    _google_sheets_service = GoogleSheetsService(credentials_path, credentials_json)
    return _google_sheets_service
