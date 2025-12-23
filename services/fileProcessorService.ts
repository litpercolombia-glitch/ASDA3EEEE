// ============================================
// LITPER COMMAND CENTER - FILE PROCESSOR
// Procesador de archivos Excel, CSV y PDF
// ============================================

import { guiasService, finanzasService, DBGuia, DBFinanza } from './supabaseService';
import * as XLSX from 'xlsx';

// ============================================
// TIPOS
// ============================================

export interface ProcessedFile {
  fileName: string;
  fileType: 'excel' | 'csv' | 'pdf' | 'json' | 'text';
  size: number;
  processedAt: string;
  rowCount: number;
  columnCount: number;
  headers: string[];
  preview: unknown[][];
  data: unknown[][];
  detectedType?: 'guias' | 'finanzas' | 'clientes' | 'unknown';
  mappingSuggestions?: ColumnMapping[];
  validationErrors?: ValidationError[];
}

export interface ColumnMapping {
  sourceColumn: string;
  targetField: string;
  confidence: number;
  transform?: 'uppercase' | 'lowercase' | 'number' | 'date' | 'phone' | 'currency';
}

export interface ValidationError {
  row: number;
  column: string;
  value: unknown;
  error: string;
  severity: 'error' | 'warning';
}

export interface ImportResult {
  success: boolean;
  totalRows: number;
  importedRows: number;
  skippedRows: number;
  errors: ValidationError[];
  createdRecords: unknown[];
}

export interface ExportOptions {
  format: 'xlsx' | 'csv' | 'json';
  columns?: string[];
  filters?: Record<string, unknown>;
  fileName?: string;
}

// ============================================
// MAPEO DE COLUMNAS CONOCIDAS
// ============================================

const COLUMN_MAPPINGS: Record<string, { field: string; aliases: string[] }> = {
  numero_guia: {
    field: 'numero_guia',
    aliases: ['guia', 'guía', 'numero', 'número', 'tracking', 'id_envio', 'nro_guia', 'n_guia', 'no_guia'],
  },
  transportadora: {
    field: 'transportadora',
    aliases: ['carrier', 'empresa', 'envio', 'courier', 'transport', 'mensajeria'],
  },
  ciudad_destino: {
    field: 'ciudad_destino',
    aliases: ['ciudad', 'city', 'destino', 'municipio', 'ciudad_cliente'],
  },
  departamento: {
    field: 'departamento',
    aliases: ['depto', 'dept', 'dpto', 'estado', 'region', 'provincia'],
  },
  estado: {
    field: 'estado',
    aliases: ['status', 'estado_envio', 'state', 'situacion'],
  },
  nombre_cliente: {
    field: 'nombre_cliente',
    aliases: ['cliente', 'nombre', 'customer', 'name', 'destinatario', 'comprador'],
  },
  telefono: {
    field: 'telefono',
    aliases: ['tel', 'phone', 'celular', 'movil', 'contacto', 'cel', 'fono'],
  },
  direccion: {
    field: 'direccion',
    aliases: ['address', 'dir', 'domicilio', 'calle', 'ubicacion'],
  },
  valor_declarado: {
    field: 'valor_declarado',
    aliases: ['valor', 'value', 'monto', 'precio', 'total', 'cod', 'recaudo', 'venta'],
  },
  valor_flete: {
    field: 'valor_flete',
    aliases: ['flete', 'envio', 'shipping', 'costo_envio', 'freight'],
  },
};

// ============================================
// FUNCIONES AUXILIARES
// ============================================

function normalizeColumnName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

function findColumnMapping(columnName: string): { field: string; confidence: number } | null {
  const normalized = normalizeColumnName(columnName);

  for (const [key, mapping] of Object.entries(COLUMN_MAPPINGS)) {
    if (normalized === normalizeColumnName(key)) {
      return { field: mapping.field, confidence: 1.0 };
    }

    for (const alias of mapping.aliases) {
      if (normalized === normalizeColumnName(alias)) {
        return { field: mapping.field, confidence: 0.9 };
      }
      if (normalized.includes(normalizeColumnName(alias))) {
        return { field: mapping.field, confidence: 0.7 };
      }
    }
  }

  return null;
}

function detectDataType(values: unknown[]): 'guias' | 'finanzas' | 'clientes' | 'unknown' {
  const sampleValues = values.slice(0, 100);

  // Contar columnas identificadas
  let guiaColumns = 0;
  let finanzaColumns = 0;
  let clienteColumns = 0;

  for (const value of sampleValues) {
    const str = String(value).toLowerCase();

    // Indicadores de guías
    if (/^[A-Z0-9]{8,20}$/i.test(str)) guiaColumns++;
    if (['entregado', 'en transito', 'novedad', 'pendiente'].some(s => str.includes(s))) guiaColumns++;

    // Indicadores de finanzas
    if (/^\$?\d+[.,]\d{2}$/.test(str)) finanzaColumns++;
    if (['ingreso', 'gasto', 'factura', 'pago'].some(s => str.includes(s))) finanzaColumns++;

    // Indicadores de clientes
    if (/^\d{10,12}$/.test(str)) clienteColumns++; // Teléfono
    if (str.includes('@')) clienteColumns++;
  }

  if (guiaColumns > finanzaColumns && guiaColumns > clienteColumns) return 'guias';
  if (finanzaColumns > guiaColumns && finanzaColumns > clienteColumns) return 'finanzas';
  if (clienteColumns > guiaColumns && clienteColumns > finanzaColumns) return 'clientes';

  return 'unknown';
}

function parseValue(value: unknown, transform?: ColumnMapping['transform']): unknown {
  if (value === null || value === undefined || value === '') return null;

  const str = String(value).trim();

  switch (transform) {
    case 'uppercase':
      return str.toUpperCase();
    case 'lowercase':
      return str.toLowerCase();
    case 'number':
      return parseFloat(str.replace(/[^0-9.-]/g, '')) || 0;
    case 'currency':
      return parseFloat(str.replace(/[^0-9.-]/g, '')) || 0;
    case 'date':
      try {
        return new Date(str).toISOString();
      } catch {
        return str;
      }
    case 'phone':
      return str.replace(/[^0-9+]/g, '');
    default:
      return str;
  }
}

function validateRow(row: Record<string, unknown>, type: 'guias' | 'finanzas'): ValidationError[] {
  const errors: ValidationError[] = [];

  if (type === 'guias') {
    if (!row.numero_guia) {
      errors.push({
        row: 0,
        column: 'numero_guia',
        value: row.numero_guia,
        error: 'Número de guía es requerido',
        severity: 'error',
      });
    }

    if (!row.ciudad_destino) {
      errors.push({
        row: 0,
        column: 'ciudad_destino',
        value: row.ciudad_destino,
        error: 'Ciudad destino es requerida',
        severity: 'error',
      });
    }

    if (row.valor_declarado && isNaN(Number(row.valor_declarado))) {
      errors.push({
        row: 0,
        column: 'valor_declarado',
        value: row.valor_declarado,
        error: 'Valor debe ser numérico',
        severity: 'warning',
      });
    }
  }

  if (type === 'finanzas') {
    if (!row.monto) {
      errors.push({
        row: 0,
        column: 'monto',
        value: row.monto,
        error: 'Monto es requerido',
        severity: 'error',
      });
    }

    if (!row.tipo || !['ingreso', 'gasto'].includes(String(row.tipo).toLowerCase())) {
      errors.push({
        row: 0,
        column: 'tipo',
        value: row.tipo,
        error: 'Tipo debe ser "ingreso" o "gasto"',
        severity: 'error',
      });
    }
  }

  return errors;
}

// ============================================
// PROCESADOR DE ARCHIVOS
// ============================================

export const fileProcessorService = {
  /**
   * Procesar archivo (auto-detecta tipo)
   */
  async processFile(file: File): Promise<ProcessedFile> {
    const fileName = file.name;
    const size = file.size;
    const extension = fileName.split('.').pop()?.toLowerCase();

    let fileType: ProcessedFile['fileType'] = 'text';
    let data: unknown[][] = [];
    let headers: string[] = [];

    if (extension === 'xlsx' || extension === 'xls') {
      fileType = 'excel';
      const result = await this.processExcel(file);
      data = result.data;
      headers = result.headers;
    } else if (extension === 'csv') {
      fileType = 'csv';
      const result = await this.processCsv(file);
      data = result.data;
      headers = result.headers;
    } else if (extension === 'json') {
      fileType = 'json';
      const result = await this.processJson(file);
      data = result.data;
      headers = result.headers;
    } else if (extension === 'txt') {
      fileType = 'text';
      const content = await file.text();
      data = content.split('\n').map(line => [line]);
      headers = ['content'];
    }

    // Detectar tipo de datos
    const allValues = data.flat();
    const detectedType = detectDataType(allValues);

    // Generar sugerencias de mapeo
    const mappingSuggestions: ColumnMapping[] = headers.map(header => {
      const mapping = findColumnMapping(header);
      return {
        sourceColumn: header,
        targetField: mapping?.field || 'custom',
        confidence: mapping?.confidence || 0,
      };
    });

    return {
      fileName,
      fileType,
      size,
      processedAt: new Date().toISOString(),
      rowCount: data.length,
      columnCount: headers.length,
      headers,
      preview: data.slice(0, 10),
      data,
      detectedType,
      mappingSuggestions,
      validationErrors: [],
    };
  },

  /**
   * Procesar archivo Excel
   */
  async processExcel(file: File): Promise<{ headers: string[]; data: unknown[][] }> {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as unknown[][];

    const headers = (jsonData[0] || []).map(h => String(h));
    const data = jsonData.slice(1).filter(row => row.some(cell => cell !== null && cell !== ''));

    return { headers, data };
  },

  /**
   * Procesar archivo CSV
   */
  async processCsv(file: File): Promise<{ headers: string[]; data: unknown[][] }> {
    const content = await file.text();
    const lines = content.split(/\r?\n/).filter(line => line.trim());

    // Detectar delimitador
    const firstLine = lines[0] || '';
    let delimiter = ',';
    if (firstLine.includes(';') && !firstLine.includes(',')) delimiter = ';';
    if (firstLine.includes('\t')) delimiter = '\t';

    const parseRow = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === delimiter && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }

      result.push(current.trim());
      return result;
    };

    const headers = parseRow(lines[0]);
    const data = lines.slice(1).map(line => parseRow(line));

    return { headers, data };
  },

  /**
   * Procesar archivo JSON
   */
  async processJson(file: File): Promise<{ headers: string[]; data: unknown[][] }> {
    const content = await file.text();
    const parsed = JSON.parse(content);

    let items: Record<string, unknown>[] = [];

    if (Array.isArray(parsed)) {
      items = parsed;
    } else if (parsed.data && Array.isArray(parsed.data)) {
      items = parsed.data;
    } else {
      items = [parsed];
    }

    if (items.length === 0) {
      return { headers: [], data: [] };
    }

    const headers = Object.keys(items[0]);
    const data = items.map(item => headers.map(h => item[h]));

    return { headers, data };
  },

  /**
   * Importar guías desde archivo procesado
   */
  async importGuias(
    processedFile: ProcessedFile,
    columnMappings: ColumnMapping[],
    options: { skipDuplicates?: boolean; dryRun?: boolean } = {}
  ): Promise<ImportResult> {
    const errors: ValidationError[] = [];
    const createdRecords: DBGuia[] = [];
    let skippedRows = 0;

    // Crear mapa de columnas
    const mappingMap = new Map<string, ColumnMapping>();
    columnMappings.forEach(m => mappingMap.set(m.sourceColumn, m));

    const guiasToCreate: Omit<DBGuia, 'id'>[] = [];

    for (let i = 0; i < processedFile.data.length; i++) {
      const row = processedFile.data[i];
      const record: Record<string, unknown> = {};

      // Mapear columnas
      processedFile.headers.forEach((header, colIndex) => {
        const mapping = mappingMap.get(header);
        if (mapping && mapping.targetField !== 'custom') {
          record[mapping.targetField] = parseValue(row[colIndex], mapping.transform);
        }
      });

      // Validar
      const rowErrors = validateRow(record, 'guias');
      if (rowErrors.length > 0) {
        rowErrors.forEach(e => {
          e.row = i + 2; // +2 por header y base 1
          errors.push(e);
        });

        if (rowErrors.some(e => e.severity === 'error')) {
          skippedRows++;
          continue;
        }
      }

      // Preparar guía
      guiasToCreate.push({
        numero_guia: String(record.numero_guia || ''),
        transportadora: String(record.transportadora || 'Sin especificar'),
        ciudad_destino: String(record.ciudad_destino || ''),
        departamento: String(record.departamento || ''),
        estado: String(record.estado || 'Pendiente'),
        nombre_cliente: String(record.nombre_cliente || ''),
        telefono: String(record.telefono || ''),
        direccion: String(record.direccion || ''),
        valor_declarado: Number(record.valor_declarado) || 0,
        valor_flete: Number(record.valor_flete) || 0,
        ganancia: 0,
        dias_transito: 0,
        tiene_novedad: false,
        fecha_creacion: new Date().toISOString(),
        fecha_actualizacion: new Date().toISOString(),
        fuente: 'EXCEL',
      });
    }

    // Si es dry run, no guardar
    if (options.dryRun) {
      return {
        success: true,
        totalRows: processedFile.data.length,
        importedRows: guiasToCreate.length,
        skippedRows,
        errors,
        createdRecords: [],
      };
    }

    // Importar en lotes
    const batchSize = 50;
    for (let i = 0; i < guiasToCreate.length; i += batchSize) {
      const batch = guiasToCreate.slice(i, i + batchSize);
      try {
        const created = await guiasService.createMany(batch);
        createdRecords.push(...created);
      } catch (error) {
        errors.push({
          row: i + 2,
          column: 'batch',
          value: batch.length,
          error: `Error en lote: ${error}`,
          severity: 'error',
        });
      }
    }

    return {
      success: errors.filter(e => e.severity === 'error').length === 0,
      totalRows: processedFile.data.length,
      importedRows: createdRecords.length,
      skippedRows: processedFile.data.length - createdRecords.length,
      errors,
      createdRecords,
    };
  },

  /**
   * Importar finanzas desde archivo procesado
   */
  async importFinanzas(
    processedFile: ProcessedFile,
    columnMappings: ColumnMapping[],
    options: { dryRun?: boolean } = {}
  ): Promise<ImportResult> {
    const errors: ValidationError[] = [];
    const createdRecords: DBFinanza[] = [];
    let skippedRows = 0;

    const mappingMap = new Map<string, ColumnMapping>();
    columnMappings.forEach(m => mappingMap.set(m.sourceColumn, m));

    const finanzasToCreate: Omit<DBFinanza, 'id' | 'created_at'>[] = [];

    for (let i = 0; i < processedFile.data.length; i++) {
      const row = processedFile.data[i];
      const record: Record<string, unknown> = {};

      processedFile.headers.forEach((header, colIndex) => {
        const mapping = mappingMap.get(header);
        if (mapping && mapping.targetField !== 'custom') {
          record[mapping.targetField] = parseValue(row[colIndex], mapping.transform);
        }
      });

      const rowErrors = validateRow(record, 'finanzas');
      if (rowErrors.length > 0) {
        rowErrors.forEach(e => {
          e.row = i + 2;
          errors.push(e);
        });

        if (rowErrors.some(e => e.severity === 'error')) {
          skippedRows++;
          continue;
        }
      }

      const fecha = record.fecha ? new Date(String(record.fecha)) : new Date();

      finanzasToCreate.push({
        tipo: String(record.tipo).toLowerCase() as 'ingreso' | 'gasto',
        categoria: String(record.categoria || 'Otros'),
        descripcion: String(record.descripcion || ''),
        monto: Number(record.monto) || 0,
        fecha: fecha.toISOString().split('T')[0],
        mes: fecha.toISOString().slice(0, 7),
        usuario_id: 'import',
      });
    }

    if (options.dryRun) {
      return {
        success: true,
        totalRows: processedFile.data.length,
        importedRows: finanzasToCreate.length,
        skippedRows,
        errors,
        createdRecords: [],
      };
    }

    for (const finanza of finanzasToCreate) {
      try {
        const created = await finanzasService.create(finanza);
        createdRecords.push(created);
      } catch (error) {
        errors.push({
          row: 0,
          column: 'create',
          value: finanza,
          error: String(error),
          severity: 'error',
        });
      }
    }

    return {
      success: errors.filter(e => e.severity === 'error').length === 0,
      totalRows: processedFile.data.length,
      importedRows: createdRecords.length,
      skippedRows: processedFile.data.length - createdRecords.length,
      errors,
      createdRecords,
    };
  },

  /**
   * Exportar datos a archivo
   */
  async exportData(
    dataSource: 'guias' | 'finanzas' | 'ciudades',
    options: ExportOptions
  ): Promise<Blob> {
    let data: unknown[] = [];

    // Obtener datos
    switch (dataSource) {
      case 'guias':
        data = await guiasService.getAll(1000);
        break;
      case 'finanzas':
        data = await finanzasService.getByMes(new Date().toISOString().slice(0, 7));
        break;
      // case 'ciudades':
      //   data = await ciudadesService.getAll();
      //   break;
    }

    // Filtrar columnas si se especificaron
    if (options.columns && options.columns.length > 0) {
      data = data.map(row => {
        const filtered: Record<string, unknown> = {};
        options.columns!.forEach(col => {
          filtered[col] = (row as Record<string, unknown>)[col];
        });
        return filtered;
      });
    }

    // Generar archivo según formato
    switch (options.format) {
      case 'xlsx': {
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      }

      case 'csv': {
        const worksheet = XLSX.utils.json_to_sheet(data);
        const csv = XLSX.utils.sheet_to_csv(worksheet);
        return new Blob([csv], { type: 'text/csv;charset=utf-8' });
      }

      case 'json':
      default:
        return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    }
  },

  /**
   * Descargar archivo
   */
  downloadFile(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  /**
   * Generar reporte Excel
   */
  async generateReport(type: 'daily' | 'weekly' | 'monthly'): Promise<Blob> {
    const workbook = XLSX.utils.book_new();

    // Guías
    const guias = await guiasService.getHoy();
    const guiasSheet = XLSX.utils.json_to_sheet(guias);
    XLSX.utils.book_append_sheet(workbook, guiasSheet, 'Guías');

    // Resumen
    const stats = await guiasService.getStats();
    const summaryData = [
      { Métrica: 'Total Guías', Valor: stats.total },
      { Métrica: 'Entregadas', Valor: stats.entregadas },
      { Métrica: 'En Tránsito', Valor: stats.enTransito },
      { Métrica: 'Con Novedad', Valor: stats.conNovedad },
      { Métrica: 'Tasa Entrega', Valor: `${stats.tasaEntrega}%` },
    ];
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen');

    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  },
};

export default fileProcessorService;
