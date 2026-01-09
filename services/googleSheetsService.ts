// services/googleSheetsService.ts
// Servicio para integración con Google Sheets

import {
  GoogleSheetsConfig,
  GoogleSheetsState,
  SpreadsheetInfo,
  SheetInfo,
  SheetData,
  SyncConfig,
  SyncResult,
  SyncDirection,
  SyncHistory,
  ColumnMapping,
  EnvioSheetRow,
  FinanzasSheetRow,
  AlertaSheetRow,
  CiudadSheetRow,
  DashboardMetrics,
  SheetTemplate,
  PredefinedFormula,
  CellValue,
  RowData,
} from '../types/googleSheets.types';

const STORAGE_KEY = 'litper_google_sheets_config';
const SYNC_HISTORY_KEY = 'litper_sheets_sync_history';
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// ==================== PLANTILLAS PREDEFINIDAS ====================

export const SHEET_TEMPLATES: SheetTemplate[] = [
  {
    id: 'logistica_completa',
    name: 'Logística Completa',
    description: 'Plantilla completa para gestión de envíos con dashboard y métricas',
    category: 'logistica',
    sheets: [
      {
        name: 'Envíos',
        headers: [
          'Guía', 'Transportadora', 'Estado', 'Ciudad', 'Días',
          'Cliente', 'Teléfono', 'Valor', 'Novedad', 'Tipo Novedad',
          'Riesgo', 'Fecha Carga', 'Última Actualización'
        ],
        frozenRows: 1,
        frozenColumns: 1,
      },
      {
        name: 'Dashboard',
        headers: ['Métrica', 'Valor', 'Tendencia', 'Meta', '% Cumplimiento'],
        frozenRows: 1,
      },
      {
        name: 'Alertas',
        headers: ['ID', 'Guía', 'Tipo', 'Prioridad', 'Mensaje', 'Acción', 'Estado', 'Fecha'],
        frozenRows: 1,
      },
      {
        name: 'Ciudades',
        headers: ['Ciudad', 'Departamento', 'Total', 'Entregados', 'Novedades', 'Tasa %', 'Días Prom', 'Riesgo'],
        frozenRows: 1,
      },
      {
        name: 'Transportadoras',
        headers: ['Transportadora', 'Total', 'Entregados', 'Novedades', 'Tasa %', 'Días Prom', 'Calificación'],
        frozenRows: 1,
      },
    ],
    formulas: [
      { sheet: 'Dashboard', cell: 'B2', formula: '=COUNTA(Envíos!A:A)-1', description: 'Total de envíos' },
      { sheet: 'Dashboard', cell: 'B3', formula: '=COUNTIF(Envíos!C:C,"Entregado")', description: 'Entregados' },
      { sheet: 'Dashboard', cell: 'B4', formula: '=COUNTIF(Envíos!C:C,"En Reparto")+COUNTIF(Envíos!C:C,"En Tránsito")', description: 'En tránsito' },
      { sheet: 'Dashboard', cell: 'B5', formula: '=COUNTIF(Envíos!I:I,TRUE)', description: 'Con novedad' },
      { sheet: 'Dashboard', cell: 'B6', formula: '=B3/B2*100', description: 'Tasa de éxito %' },
      { sheet: 'Dashboard', cell: 'B7', formula: '=AVERAGE(Envíos!E:E)', description: 'Días promedio' },
      { sheet: 'Dashboard', cell: 'B8', formula: '=SUMIF(Envíos!K:K,"URGENTE",Envíos!H:H)+SUMIF(Envíos!K:K,"ATENCIÓN",Envíos!H:H)', description: 'Valor en riesgo' },
    ],
  },
  {
    id: 'finanzas_basico',
    name: 'Finanzas Básico',
    description: 'Control de ventas, costos y márgenes',
    category: 'finanzas',
    sheets: [
      {
        name: 'Resumen Diario',
        headers: ['Fecha', 'Ventas', 'Costo Fletes', 'Devoluciones', 'Ganancia', 'Margen %', 'Entregados', 'Devueltos'],
        frozenRows: 1,
      },
      {
        name: 'Resumen Mensual',
        headers: ['Mes', 'Total Ventas', 'Total Costos', 'Total Devoluciones', 'Ganancia Neta', 'Margen Promedio'],
        frozenRows: 1,
      },
    ],
    formulas: [
      { sheet: 'Resumen Diario', cell: 'E2', formula: '=B2-C2-D2', description: 'Ganancia = Ventas - Fletes - Devoluciones' },
      { sheet: 'Resumen Diario', cell: 'F2', formula: '=IF(B2>0,E2/B2*100,0)', description: 'Margen %' },
    ],
  },
  {
    id: 'reportes_semanal',
    name: 'Reporte Semanal',
    description: 'Reporte semanal con comparativas',
    category: 'reportes',
    sheets: [
      {
        name: 'Esta Semana',
        headers: ['Día', 'Envíos', 'Entregados', 'Novedades', 'Tasa %'],
        frozenRows: 1,
      },
      {
        name: 'Comparativo',
        headers: ['Métrica', 'Esta Semana', 'Semana Anterior', 'Variación', '% Cambio'],
        frozenRows: 1,
      },
    ],
    formulas: [],
  },
];

// ==================== FÓRMULAS PREDEFINIDAS ====================

export const PREDEFINED_FORMULAS: PredefinedFormula[] = [
  {
    id: 'contar_estado',
    name: 'Contar por Estado',
    description: 'Cuenta envíos por estado específico',
    formula: '=COUNTIF({rango},"{valor}")',
    category: 'conteo',
    parameters: [
      { name: 'rango', description: 'Columna de estados', type: 'range', default: 'C:C' },
      { name: 'valor', description: 'Estado a contar', type: 'text', default: 'Entregado' },
    ],
    example: '=COUNTIF(C:C,"Entregado")',
  },
  {
    id: 'tasa_exito',
    name: 'Tasa de Éxito',
    description: 'Calcula porcentaje de entregas exitosas',
    formula: '=COUNTIF({columna_estado},"Entregado")/(COUNTA({columna_estado})-1)*100',
    category: 'porcentaje',
    parameters: [
      { name: 'columna_estado', description: 'Columna de estados', type: 'range', default: 'C:C' },
    ],
    example: '=COUNTIF(C:C,"Entregado")/(COUNTA(C:C)-1)*100',
  },
  {
    id: 'promedio_dias',
    name: 'Promedio de Días',
    description: 'Promedio de días en tránsito',
    formula: '=AVERAGE({rango_dias})',
    category: 'promedio',
    parameters: [
      { name: 'rango_dias', description: 'Columna de días', type: 'range', default: 'E:E' },
    ],
    example: '=AVERAGE(E:E)',
  },
  {
    id: 'valor_en_riesgo',
    name: 'Valor en Riesgo',
    description: 'Suma de valores de envíos con riesgo alto o urgente',
    formula: '=SUMIF({columna_riesgo},"URGENTE",{columna_valor})+SUMIF({columna_riesgo},"ATENCIÓN",{columna_valor})',
    category: 'suma',
    parameters: [
      { name: 'columna_riesgo', description: 'Columna de nivel de riesgo', type: 'range', default: 'K:K' },
      { name: 'columna_valor', description: 'Columna de valores', type: 'range', default: 'H:H' },
    ],
    example: '=SUMIF(K:K,"URGENTE",H:H)+SUMIF(K:K,"ATENCIÓN",H:H)',
  },
  {
    id: 'semaforo_riesgo',
    name: 'Semáforo de Riesgo',
    description: 'Asigna nivel de riesgo basado en días',
    formula: '=IF({dias}>7,"🔴 CRÍTICO",IF({dias}>5,"🟠 ALTO",IF({dias}>3,"🟡 MEDIO","🟢 BAJO")))',
    category: 'condicional',
    parameters: [
      { name: 'dias', description: 'Celda con días en tránsito', type: 'value', default: 'E2' },
    ],
    example: '=IF(E2>7,"🔴 CRÍTICO",IF(E2>5,"🟠 ALTO",IF(E2>3,"🟡 MEDIO","🟢 BAJO")))',
  },
  {
    id: 'buscar_guia',
    name: 'Buscar Guía',
    description: 'Busca información de una guía',
    formula: '=VLOOKUP({numero_guia},{rango_datos},{columna},FALSE)',
    category: 'lookup',
    parameters: [
      { name: 'numero_guia', description: 'Número de guía a buscar', type: 'text' },
      { name: 'rango_datos', description: 'Rango de datos', type: 'range', default: 'A:M' },
      { name: 'columna', description: 'Número de columna a retornar', type: 'number', default: '3' },
    ],
    example: '=VLOOKUP("12345",A:M,3,FALSE)',
  },
  {
    id: 'contar_ciudad',
    name: 'Contar por Ciudad',
    description: 'Cuenta envíos a una ciudad específica',
    formula: '=COUNTIF({columna_ciudad},"{ciudad}")',
    category: 'conteo',
    parameters: [
      { name: 'columna_ciudad', description: 'Columna de ciudades', type: 'range', default: 'D:D' },
      { name: 'ciudad', description: 'Nombre de la ciudad', type: 'text', default: 'Bogotá' },
    ],
    example: '=COUNTIF(D:D,"Bogotá")',
  },
  {
    id: 'tasa_ciudad',
    name: 'Tasa de Éxito por Ciudad',
    description: 'Calcula tasa de éxito para una ciudad específica',
    formula: '=COUNTIFS({col_ciudad},"{ciudad}",{col_estado},"Entregado")/COUNTIF({col_ciudad},"{ciudad}")*100',
    category: 'porcentaje',
    parameters: [
      { name: 'col_ciudad', description: 'Columna de ciudades', type: 'range', default: 'D:D' },
      { name: 'ciudad', description: 'Ciudad a analizar', type: 'text', default: 'Bogotá' },
      { name: 'col_estado', description: 'Columna de estados', type: 'range', default: 'C:C' },
    ],
    example: '=COUNTIFS(D:D,"Bogotá",C:C,"Entregado")/COUNTIF(D:D,"Bogotá")*100',
  },
  {
    id: 'sparkline_tendencia',
    name: 'Sparkline de Tendencia',
    description: 'Mini gráfico de tendencia',
    formula: '=SPARKLINE({rango_valores})',
    category: 'custom',
    parameters: [
      { name: 'rango_valores', description: 'Rango de valores para el gráfico', type: 'range' },
    ],
    example: '=SPARKLINE(B2:B8)',
  },
  {
    id: 'dias_hasta_hoy',
    name: 'Días desde Fecha',
    description: 'Calcula días transcurridos desde una fecha',
    formula: '=DATEDIF({fecha},TODAY(),"D")',
    category: 'custom',
    parameters: [
      { name: 'fecha', description: 'Celda con la fecha', type: 'value', default: 'L2' },
    ],
    example: '=DATEDIF(L2,TODAY(),"D")',
  },
];

// ==================== CLASE PRINCIPAL DEL SERVICIO ====================

class GoogleSheetsService {
  private config: GoogleSheetsConfig | null = null;
  private syncHistory: SyncHistory[] = [];

  constructor() {
    this.loadConfig();
    this.loadSyncHistory();
  }

  // ==================== CONFIGURACIÓN ====================

  private loadConfig(): void {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        this.config = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error cargando configuración de Google Sheets:', error);
    }
  }

  private saveConfig(): void {
    if (this.config) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
    }
  }

  private loadSyncHistory(): void {
    try {
      const saved = localStorage.getItem(SYNC_HISTORY_KEY);
      if (saved) {
        this.syncHistory = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error cargando historial de sincronización:', error);
    }
  }

  private saveSyncHistory(): void {
    // Mantener solo los últimos 50 registros
    if (this.syncHistory.length > 50) {
      this.syncHistory = this.syncHistory.slice(-50);
    }
    localStorage.setItem(SYNC_HISTORY_KEY, JSON.stringify(this.syncHistory));
  }

  getConfig(): GoogleSheetsConfig | null {
    return this.config;
  }

  isConnected(): boolean {
    return this.config?.isConnected ?? false;
  }

  // ==================== CONEXIÓN ====================

  async connect(spreadsheetId: string, credentials?: string): Promise<SpreadsheetInfo> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/google-sheets/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          spreadsheet_id: spreadsheetId,
          credentials: credentials,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error conectando: ${response.statusText}`);
      }

      const data = await response.json();

      this.config = {
        spreadsheetId,
        spreadsheetName: data.spreadsheet.title,
        spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
        isConnected: true,
        lastSync: null,
        autoSync: false,
        syncInterval: 30,
      };

      this.saveConfig();
      return data.spreadsheet;
    } catch (error) {
      console.error('Error conectando a Google Sheets:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    this.config = null;
    localStorage.removeItem(STORAGE_KEY);
  }

  // ==================== OPERACIONES DE LECTURA ====================

  async getSpreadsheetInfo(): Promise<SpreadsheetInfo | null> {
    if (!this.config?.spreadsheetId) return null;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/google-sheets/info/${this.config.spreadsheetId}`
      );

      if (!response.ok) throw new Error('Error obteniendo información');

      return await response.json();
    } catch (error) {
      console.error('Error obteniendo info del spreadsheet:', error);
      throw error;
    }
  }

  async getSheetData(sheetName: string, range?: string): Promise<SheetData> {
    if (!this.config?.spreadsheetId) {
      throw new Error('No hay spreadsheet conectado');
    }

    try {
      const params = new URLSearchParams({
        spreadsheet_id: this.config.spreadsheetId,
        sheet_name: sheetName,
      });
      if (range) params.append('range', range);

      const response = await fetch(
        `${API_BASE_URL}/api/google-sheets/data?${params}`
      );

      if (!response.ok) throw new Error('Error obteniendo datos');

      return await response.json();
    } catch (error) {
      console.error('Error obteniendo datos de hoja:', error);
      throw error;
    }
  }

  // ==================== OPERACIONES DE ESCRITURA ====================

  async writeData(
    sheetName: string,
    data: CellValue[][],
    startCell: string = 'A1'
  ): Promise<boolean> {
    if (!this.config?.spreadsheetId) {
      throw new Error('No hay spreadsheet conectado');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/google-sheets/write`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spreadsheet_id: this.config.spreadsheetId,
          sheet_name: sheetName,
          data,
          start_cell: startCell,
        }),
      });

      if (!response.ok) throw new Error('Error escribiendo datos');

      return true;
    } catch (error) {
      console.error('Error escribiendo datos:', error);
      throw error;
    }
  }

  async appendRows(sheetName: string, rows: CellValue[][]): Promise<number> {
    if (!this.config?.spreadsheetId) {
      throw new Error('No hay spreadsheet conectado');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/google-sheets/append`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spreadsheet_id: this.config.spreadsheetId,
          sheet_name: sheetName,
          rows,
        }),
      });

      if (!response.ok) throw new Error('Error agregando filas');

      const result = await response.json();
      return result.rows_added;
    } catch (error) {
      console.error('Error agregando filas:', error);
      throw error;
    }
  }

  async updateCell(sheetName: string, cell: string, value: CellValue): Promise<boolean> {
    if (!this.config?.spreadsheetId) {
      throw new Error('No hay spreadsheet conectado');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/google-sheets/update-cell`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spreadsheet_id: this.config.spreadsheetId,
          sheet_name: sheetName,
          cell,
          value,
        }),
      });

      if (!response.ok) throw new Error('Error actualizando celda');

      return true;
    } catch (error) {
      console.error('Error actualizando celda:', error);
      throw error;
    }
  }

  // ==================== SINCRONIZACIÓN ====================

  async syncEnvios(
    envios: EnvioSheetRow[],
    direction: SyncDirection = 'to_sheets'
  ): Promise<SyncResult> {
    const startTime = Date.now();
    const sheetName = 'Envíos';

    try {
      if (direction === 'to_sheets' || direction === 'bidirectional') {
        // Convertir envíos a formato de filas
        const rows: CellValue[][] = envios.map(e => [
          e.numeroGuia,
          e.transportadora,
          e.estado,
          e.ciudadDestino,
          e.diasTransito,
          e.nombreCliente,
          e.telefono,
          e.valorDeclarado,
          e.tieneNovedad ? 'Sí' : 'No',
          e.tipoNovedad || '',
          e.nivelRiesgo,
          e.fechaCarga,
          e.ultimaActualizacion,
        ]);

        // Primero escribir headers
        const headers = [
          'Guía', 'Transportadora', 'Estado', 'Ciudad', 'Días',
          'Cliente', 'Teléfono', 'Valor', 'Novedad', 'Tipo Novedad',
          'Riesgo', 'Fecha Carga', 'Última Actualización'
        ];

        await this.writeData(sheetName, [headers], 'A1');

        // Luego escribir datos
        if (rows.length > 0) {
          await this.writeData(sheetName, rows, 'A2');
        }
      }

      const result: SyncResult = {
        success: true,
        direction,
        rowsProcessed: envios.length,
        rowsCreated: envios.length,
        rowsUpdated: 0,
        rowsSkipped: 0,
        errors: [],
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };

      // Registrar en historial
      this.syncHistory.push({
        id: `sync_${Date.now()}`,
        timestamp: new Date(),
        direction,
        sheetName,
        result,
      });
      this.saveSyncHistory();

      // Actualizar config
      if (this.config) {
        this.config.lastSync = new Date();
        this.saveConfig();
      }

      return result;
    } catch (error) {
      const errorResult: SyncResult = {
        success: false,
        direction,
        rowsProcessed: 0,
        rowsCreated: 0,
        rowsUpdated: 0,
        rowsSkipped: envios.length,
        errors: [{ row: 0, message: String(error) }],
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };

      this.syncHistory.push({
        id: `sync_${Date.now()}`,
        timestamp: new Date(),
        direction,
        sheetName,
        result: errorResult,
      });
      this.saveSyncHistory();

      throw error;
    }
  }

  async syncFinanzas(
    finanzas: FinanzasSheetRow[],
    direction: SyncDirection = 'to_sheets'
  ): Promise<SyncResult> {
    const startTime = Date.now();
    const sheetName = 'Finanzas';

    try {
      if (direction === 'to_sheets' || direction === 'bidirectional') {
        const headers = [
          'Fecha', 'Total Ventas', 'Costo Fletes', 'Devoluciones',
          'Ganancia Neta', 'Margen %', 'Entregados', 'Devueltos'
        ];

        const rows: CellValue[][] = finanzas.map(f => [
          f.fecha,
          f.totalVentas,
          f.costoFletes,
          f.devoluciones,
          f.gananciaNeta,
          f.margenPorcentaje,
          f.enviosEntregados,
          f.enviosDevueltos,
        ]);

        await this.writeData(sheetName, [headers], 'A1');
        if (rows.length > 0) {
          await this.writeData(sheetName, rows, 'A2');
        }
      }

      const result: SyncResult = {
        success: true,
        direction,
        rowsProcessed: finanzas.length,
        rowsCreated: finanzas.length,
        rowsUpdated: 0,
        rowsSkipped: 0,
        errors: [],
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };

      this.syncHistory.push({
        id: `sync_${Date.now()}`,
        timestamp: new Date(),
        direction,
        sheetName,
        result,
      });
      this.saveSyncHistory();

      return result;
    } catch (error) {
      throw error;
    }
  }

  async syncAlertas(
    alertas: AlertaSheetRow[],
    direction: SyncDirection = 'to_sheets'
  ): Promise<SyncResult> {
    const startTime = Date.now();
    const sheetName = 'Alertas';

    try {
      if (direction === 'to_sheets' || direction === 'bidirectional') {
        const headers = ['ID', 'Guía', 'Tipo', 'Prioridad', 'Mensaje', 'Acción', 'Estado', 'Fecha'];

        const rows: CellValue[][] = alertas.map(a => [
          a.id,
          a.numeroGuia,
          a.tipoAlerta,
          a.prioridad,
          a.mensaje,
          a.accionSugerida,
          a.estado,
          a.fechaCreacion,
        ]);

        await this.writeData(sheetName, [headers], 'A1');
        if (rows.length > 0) {
          await this.writeData(sheetName, rows, 'A2');
        }
      }

      return {
        success: true,
        direction,
        rowsProcessed: alertas.length,
        rowsCreated: alertas.length,
        rowsUpdated: 0,
        rowsSkipped: 0,
        errors: [],
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };
    } catch (error) {
      throw error;
    }
  }

  async syncCiudades(
    ciudades: CiudadSheetRow[],
    direction: SyncDirection = 'to_sheets'
  ): Promise<SyncResult> {
    const startTime = Date.now();
    const sheetName = 'Ciudades';

    try {
      if (direction === 'to_sheets' || direction === 'bidirectional') {
        const headers = [
          'Ciudad', 'Departamento', 'Total Envíos', 'Entregados',
          'Novedades', 'Devueltos', 'Tasa %', 'Días Prom',
          'Transportadora Principal', 'Riesgo'
        ];

        const rows: CellValue[][] = ciudades.map(c => [
          c.ciudad,
          c.departamento,
          c.totalEnvios,
          c.entregados,
          c.novedades,
          c.devueltos,
          c.tasaExito,
          c.diasPromedio,
          c.transportadoraPrincipal,
          c.riesgo,
        ]);

        await this.writeData(sheetName, [headers], 'A1');
        if (rows.length > 0) {
          await this.writeData(sheetName, rows, 'A2');
        }
      }

      return {
        success: true,
        direction,
        rowsProcessed: ciudades.length,
        rowsCreated: ciudades.length,
        rowsUpdated: 0,
        rowsSkipped: 0,
        errors: [],
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };
    } catch (error) {
      throw error;
    }
  }

  // ==================== DASHBOARD ====================

  async updateDashboard(metrics: DashboardMetrics): Promise<boolean> {
    const sheetName = 'Dashboard';

    try {
      const dashboardData: CellValue[][] = [
        ['Métrica', 'Valor', 'Indicador'],
        ['Total Envíos', metrics.totalEnvios, '📦'],
        ['Entregados', metrics.entregados, '✅'],
        ['En Tránsito', metrics.enTransito, '🚚'],
        ['Novedades', metrics.novedades, '⚠️'],
        ['Devueltos', metrics.devueltos, '↩️'],
        ['Tasa de Éxito', `${metrics.tasaExito.toFixed(1)}%`, metrics.tasaExito >= 90 ? '🟢' : metrics.tasaExito >= 70 ? '🟡' : '🔴'],
        ['Días Promedio', metrics.diasPromedioEntrega.toFixed(1), '📅'],
        ['Valor en Riesgo', `$${metrics.valorEnRiesgo.toLocaleString()}`, '💰'],
      ];

      await this.writeData(sheetName, dashboardData, 'A1');

      // Top ciudades problemáticas
      if (metrics.topCiudadesProblematicas.length > 0) {
        const ciudadesHeader = [['', '', ''], ['Top Ciudades Problemáticas', '', '']];
        const ciudadesData: CellValue[][] = metrics.topCiudadesProblematicas.map((c, i) => [
          `${i + 1}. ${c.ciudad}`,
          `${c.tasa.toFixed(1)}% éxito`,
          c.tasa < 70 ? '🔴' : c.tasa < 85 ? '🟡' : '🟢',
        ]);

        await this.writeData(sheetName, [...ciudadesHeader, ...ciudadesData], 'A12');
      }

      return true;
    } catch (error) {
      console.error('Error actualizando dashboard:', error);
      throw error;
    }
  }

  // ==================== PLANTILLAS ====================

  async createFromTemplate(template: SheetTemplate): Promise<boolean> {
    if (!this.config?.spreadsheetId) {
      throw new Error('No hay spreadsheet conectado');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/google-sheets/create-template`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spreadsheet_id: this.config.spreadsheetId,
          template,
        }),
      });

      if (!response.ok) throw new Error('Error creando plantilla');

      return true;
    } catch (error) {
      console.error('Error creando desde plantilla:', error);
      throw error;
    }
  }

  getTemplates(): SheetTemplate[] {
    return SHEET_TEMPLATES;
  }

  getTemplate(id: string): SheetTemplate | undefined {
    return SHEET_TEMPLATES.find(t => t.id === id);
  }

  // ==================== FÓRMULAS ====================

  getFormulas(): PredefinedFormula[] {
    return PREDEFINED_FORMULAS;
  }

  getFormulasByCategory(category: string): PredefinedFormula[] {
    return PREDEFINED_FORMULAS.filter(f => f.category === category);
  }

  buildFormula(formulaId: string, params: Record<string, string>): string {
    const formula = PREDEFINED_FORMULAS.find(f => f.id === formulaId);
    if (!formula) return '';

    let result = formula.formula;
    for (const [key, value] of Object.entries(params)) {
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }
    return result;
  }

  // ==================== HISTORIAL ====================

  getSyncHistory(): SyncHistory[] {
    return this.syncHistory;
  }

  clearSyncHistory(): void {
    this.syncHistory = [];
    localStorage.removeItem(SYNC_HISTORY_KEY);
  }

  // ==================== UTILIDADES ====================

  generateSpreadsheetUrl(spreadsheetId: string): string {
    return `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
  }

  async testConnection(): Promise<boolean> {
    if (!this.config?.spreadsheetId) return false;

    try {
      const info = await this.getSpreadsheetInfo();
      return info !== null;
    } catch {
      return false;
    }
  }
}

// Singleton
export const googleSheetsService = new GoogleSheetsService();
export default googleSheetsService;
