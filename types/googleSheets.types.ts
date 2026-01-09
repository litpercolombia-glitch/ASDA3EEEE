// types/googleSheets.types.ts
// Tipos para la integración con Google Sheets

// ==================== CONFIGURACIÓN ====================

export interface GoogleSheetsConfig {
  spreadsheetId: string;
  spreadsheetName: string;
  spreadsheetUrl: string;
  isConnected: boolean;
  lastSync: Date | null;
  autoSync: boolean;
  syncInterval: number; // minutos
  credentials?: GoogleCredentials;
}

export interface GoogleCredentials {
  type: 'service_account' | 'oauth2';
  clientEmail?: string;
  projectId?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
}

// ==================== HOJAS ====================

export interface SheetInfo {
  sheetId: number;
  title: string;
  index: number;
  rowCount: number;
  columnCount: number;
  lastModified?: Date;
}

export interface SpreadsheetInfo {
  spreadsheetId: string;
  title: string;
  locale: string;
  timeZone: string;
  sheets: SheetInfo[];
  lastModified: Date;
}

// ==================== DATOS ====================

export type CellValue = string | number | boolean | null;

export interface CellData {
  row: number;
  column: number;
  value: CellValue;
  formattedValue?: string;
  formula?: string;
}

export interface RowData {
  rowIndex: number;
  values: CellValue[];
  formattedValues?: string[];
}

export interface SheetData {
  sheetName: string;
  headers: string[];
  rows: RowData[];
  totalRows: number;
  lastUpdated: Date;
}

// ==================== SINCRONIZACIÓN ====================

export type SyncDirection = 'to_sheets' | 'from_sheets' | 'bidirectional';
export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

export interface SyncConfig {
  direction: SyncDirection;
  sheetName: string;
  dataType: 'envios' | 'finanzas' | 'alertas' | 'ciudades' | 'custom';
  mappings: ColumnMapping[];
  filters?: SyncFilter[];
  autoSync: boolean;
  syncInterval: number; // minutos
}

export interface ColumnMapping {
  sheetColumn: string; // A, B, C... o nombre de columna
  appField: string; // Campo en la app
  transform?: 'none' | 'uppercase' | 'lowercase' | 'trim' | 'number' | 'date' | 'currency';
  formula?: string; // Fórmula de Sheets a aplicar
}

export interface SyncFilter {
  field: string;
  operator: 'equals' | 'contains' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'not_in';
  value: string | number | string[];
}

export interface SyncResult {
  success: boolean;
  direction: SyncDirection;
  rowsProcessed: number;
  rowsCreated: number;
  rowsUpdated: number;
  rowsSkipped: number;
  errors: SyncError[];
  duration: number; // ms
  timestamp: Date;
}

export interface SyncError {
  row: number;
  column?: string;
  message: string;
  data?: Record<string, unknown>;
}

export interface SyncHistory {
  id: string;
  timestamp: Date;
  direction: SyncDirection;
  sheetName: string;
  result: SyncResult;
}

// ==================== PLANTILLAS ====================

export interface SheetTemplate {
  id: string;
  name: string;
  description: string;
  sheets: TemplateSheet[];
  formulas: TemplateFormula[];
  category: 'logistica' | 'finanzas' | 'reportes' | 'custom';
}

export interface TemplateSheet {
  name: string;
  headers: string[];
  columnWidths?: number[];
  frozenRows?: number;
  frozenColumns?: number;
  formatting?: SheetFormatting;
}

export interface TemplateFormula {
  sheet: string;
  cell: string;
  formula: string;
  description: string;
}

export interface SheetFormatting {
  headerBackground?: string;
  headerTextColor?: string;
  alternateRowColors?: [string, string];
  conditionalFormats?: ConditionalFormat[];
}

export interface ConditionalFormat {
  range: string;
  type: 'text_contains' | 'number_gt' | 'number_lt' | 'custom';
  value: string | number;
  backgroundColor?: string;
  textColor?: string;
}

// ==================== FÓRMULAS PREDEFINIDAS ====================

export interface PredefinedFormula {
  id: string;
  name: string;
  description: string;
  formula: string;
  category: 'conteo' | 'suma' | 'promedio' | 'porcentaje' | 'condicional' | 'lookup' | 'custom';
  parameters: FormulaParameter[];
  example: string;
}

export interface FormulaParameter {
  name: string;
  description: string;
  type: 'range' | 'value' | 'text' | 'number';
  default?: string;
}

// ==================== ENVÍOS (ESPECÍFICO PARA LITPER) ====================

export interface EnvioSheetRow {
  numeroGuia: string;
  transportadora: string;
  estado: string;
  ciudadDestino: string;
  diasTransito: number;
  nombreCliente: string;
  telefono: string;
  valorDeclarado: number;
  tieneNovedad: boolean;
  tipoNovedad?: string;
  nivelRiesgo: string;
  fechaCarga: string;
  ultimaActualizacion: string;
}

export interface FinanzasSheetRow {
  fecha: string;
  totalVentas: number;
  costoFletes: number;
  devoluciones: number;
  gananciaNeta: number;
  margenPorcentaje: number;
  enviosEntregados: number;
  enviosDevueltos: number;
}

export interface AlertaSheetRow {
  id: string;
  numeroGuia: string;
  tipoAlerta: string;
  prioridad: 'URGENTE' | 'ALTA' | 'MEDIA' | 'BAJA';
  mensaje: string;
  accionSugerida: string;
  estado: 'pendiente' | 'atendida' | 'resuelta';
  fechaCreacion: string;
  fechaResolucion?: string;
}

export interface CiudadSheetRow {
  ciudad: string;
  departamento: string;
  totalEnvios: number;
  entregados: number;
  novedades: number;
  devueltos: number;
  tasaExito: number;
  diasPromedio: number;
  transportadoraPrincipal: string;
  riesgo: string;
}

// ==================== DASHBOARD EN SHEETS ====================

export interface DashboardMetrics {
  totalEnvios: number;
  entregados: number;
  enTransito: number;
  novedades: number;
  devueltos: number;
  tasaExito: number;
  diasPromedioEntrega: number;
  valorEnRiesgo: number;
  topCiudadesProblematicas: { ciudad: string; tasa: number }[];
  rendimientoTransportadoras: { nombre: string; tasa: number; promedioDias: number }[];
}

// ==================== EVENTOS Y NOTIFICACIONES ====================

export interface SheetChangeEvent {
  spreadsheetId: string;
  sheetId: number;
  sheetName: string;
  changeType: 'insert' | 'update' | 'delete';
  range: string;
  oldValue?: CellValue;
  newValue?: CellValue;
  timestamp: Date;
  userId?: string;
}

export interface WebhookConfig {
  enabled: boolean;
  url: string;
  secret: string;
  events: ('change' | 'insert' | 'delete' | 'format')[];
}

// ==================== ESTADO DEL SERVICIO ====================

export interface GoogleSheetsState {
  config: GoogleSheetsConfig;
  spreadsheet: SpreadsheetInfo | null;
  syncStatus: SyncStatus;
  lastSyncResult: SyncResult | null;
  syncHistory: SyncHistory[];
  isLoading: boolean;
  error: string | null;
}

// ==================== RESPUESTAS API ====================

export interface GoogleSheetsApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ConnectResponse {
  success: boolean;
  spreadsheet: SpreadsheetInfo;
  message: string;
}

export interface SyncResponse {
  success: boolean;
  result: SyncResult;
  message: string;
}
