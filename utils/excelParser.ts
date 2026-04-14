/**
 * EXCEL PARSER UNIFICADO
 *
 * Este archivo contiene TODA la logica de parseo de Excel.
 * NUNCA crees parsers de Excel en otros archivos.
 * Siempre usa: import { parseExcel, parseShipmentExcel } from '@/utils/excelParser'
 *
 * FIX 2026-04-14: Added UTF-8 codepage + mojibake repair for Dropi exports
 */

import * as XLSX from 'xlsx';

// ============================================
// ENCODING FIX - MOJIBAKE REPAIR
// ============================================

/**
 * Repairs mojibake (double-encoded UTF-8) in a string.
 * When Dropi exports Excel as .xls with UTF-8 data, SheetJS reads it
 * with Latin-1 codepage, causing "Bogotá" → "BogotÃ¡".
 *
 * Uses two methods:
 * 1. TextDecoder (most reliable for fully mojibaked strings)
 * 2. Manual pattern replacement (fallback for mixed encoding)
 *
 * Example: "BogotÃ¡" → "Bogotá", "MedellÃ­n" → "Medellín"
 */
export function fixMojibake(text: string): string {
  if (!text || typeof text !== 'string') return text;

  let fixed = text;

  // Method 1: Try TextDecoder approach (most reliable for full mojibake)
  try {
    // Check if string likely contains mojibake (Ã character is the telltale sign)
    if (fixed.includes('\u00C3') || fixed.includes('\u00C2')) {
      const bytes = new Uint8Array(fixed.length);
      for (let i = 0; i < fixed.length; i++) {
        bytes[i] = fixed.charCodeAt(i) & 0xFF;
      }
      const decoded = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
      // Verify the decoded string doesn't contain replacement characters
      if (!decoded.includes('\uFFFD')) {
        return decoded;
      }
    }
  } catch {
    // TextDecoder failed (mixed encoding), fall through to manual replacement
  }

  // Method 2: Manual replacement of known mojibake patterns
  const MOJIBAKE_MAP: [string, string][] = [
    // Lowercase accented vowels
    ['\u00C3\u00A1', 'á'],  // Ã¡ -> á
    ['\u00C3\u00A9', 'é'],  // Ã© -> é
    ['\u00C3\u00AD', 'í'],  // Ã­ -> í
    ['\u00C3\u00B3', 'ó'],  // Ã³ -> ó
    ['\u00C3\u00BA', 'ú'],  // Ãº -> ú
    // Uppercase accented vowels
    ['\u00C3\u0081', 'Á'],
    ['\u00C3\u0089', 'É'],
    ['\u00C3\u008D', 'Í'],
    ['\u00C3\u0093', 'Ó'],
    ['\u00C3\u009A', 'Ú'],
    // Ñ / ñ
    ['\u00C3\u00B1', 'ñ'],
    ['\u00C3\u0091', 'Ñ'],
    // Dieresis
    ['\u00C3\u00BC', 'ü'],
    ['\u00C3\u009C', 'Ü'],
    // Additional common patterns
    ['\u00C2\u00B0', '°'],
    ['\u00C2\u00B7', '·'],
    ['\u00C2\u00BF', '¿'],
    ['\u00C2\u00A1', '¡'],
  ];

  for (const [broken, correct] of MOJIBAKE_MAP) {
    if (fixed.includes(broken)) {
      fixed = fixed.split(broken).join(correct);
    }
  }

  return fixed;
}

/**
 * Apply mojibake fix to all string values in a row.
 * Also fixes column names (headers) that may be corrupted.
 */
function fixRowEncoding(row: Record<string, unknown>): Record<string, unknown> {
  const fixed: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    const fixedKey = fixMojibake(key);
    fixed[fixedKey] = typeof value === 'string' ? fixMojibake(value) : value;
  }
  return fixed;
}

// ============================================
// TIPOS GENERICOS
// ============================================

export interface ParsedExcelData<T = Record<string, unknown>> {
  success: boolean;
  data: T[];
  headers: string[];
  errors: string[];
  warnings: string[];
  preview: {
    totalRows: number;
    sampleRows: T[];
  };
}

export interface ExcelParserOptions {
  /** Columnas requeridas (error si faltan) */
  requiredColumns?: string[];
  /** Mapeo de columnas (nombre en Excel -> nombre en objeto) */
  columnMapping?: Record<string, string>;
  /** Funcion para validar cada fila */
  validateRow?: (row: Record<string, unknown>) => { valid: boolean; error?: string };
  /** Funcion para transformar cada fila */
  transformRow?: (row: Record<string, unknown>) => unknown;
  /** Nombre de la hoja a leer (default: primera hoja) */
  sheetName?: string;
  /** Numero maximo de filas a procesar */
  maxRows?: number;
  /** Saltar filas vacias */
  skipEmptyRows?: boolean;
}

// ============================================
// PARSER GENERICO DE EXCEL
// ============================================

/**
 * Parser generico de Excel
 * @param file - Archivo Excel a parsear
 * @param options - Opciones de parseo
 * @returns Datos parseados con metadata
 */
export async function parseExcel<T = Record<string, unknown>>(
  file: File,
  options: ExcelParserOptions = {}
): Promise<ParsedExcelData<T>> {
  const {
    requiredColumns = [],
    columnMapping = {},
    validateRow,
    transformRow,
    sheetName,
    maxRows,
    skipEmptyRows = true,
  } = options;

  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Leer archivo con codepage UTF-8
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, {
      type: 'array',
      codepage: 65001,  // ← FIX: Force UTF-8 encoding for .xls files from Dropi
      raw: false,        // Parse values as formatted strings
    });

    // Seleccionar hoja
    const selectedSheet = sheetName || workbook.SheetNames[0];
    if (!workbook.SheetNames.includes(selectedSheet)) {
      return {
        success: false,
        data: [],
        headers: [],
        errors: [`Hoja "${selectedSheet}" no encontrada. Hojas disponibles: ${workbook.SheetNames.join(', ')}`],
        warnings: [],
        preview: { totalRows: 0, sampleRows: [] },
      };
    }

    // Convertir a JSON
    const rawData: Record<string, unknown>[] = XLSX.utils.sheet_to_json(
      workbook.Sheets[selectedSheet],
      { raw: false, defval: '' }
    );

    if (rawData.length === 0) {
      return {
        success: false,
        data: [],
        headers: [],
        errors: ['El archivo Excel está vacío'],
        warnings: [],
        preview: { totalRows: 0, sampleRows: [] },
      };
    }

    // ═══ ENCODING FIX: Repair mojibake in ALL rows ═══
    const cleanData = rawData.map(row => fixRowEncoding(row));

    // Obtener headers (from cleaned data)
    const headers = Object.keys(cleanData[0]);

    // Validar columnas requeridas
    const missingColumns = requiredColumns.filter(
      (col) => !headers.some((h) => h.toLowerCase() === col.toLowerCase())
    );
    if (missingColumns.length > 0) {
      return {
        success: false,
        data: [],
        headers,
        errors: [`Columnas requeridas faltantes: ${missingColumns.join(', ')}`],
        warnings: [],
        preview: { totalRows: 0, sampleRows: [] },
      };
    }

    // Procesar filas
    const processedData: T[] = [];
    const rowsToProcess = maxRows ? cleanData.slice(0, maxRows) : cleanData;

    for (let i = 0; i < rowsToProcess.length; i++) {
      const row = rowsToProcess[i];

      // Saltar filas vacias
      if (skipEmptyRows && isRowEmpty(row)) {
        continue;
      }

      // Aplicar mapeo de columnas
      const mappedRow = applyColumnMapping(row, columnMapping);

      // Validar fila
      if (validateRow) {
        const validation = validateRow(mappedRow);
        if (!validation.valid) {
          warnings.push(`Fila ${i + 2}: ${validation.error || 'Datos inválidos'}`);
          continue;
        }
      }

      // Transformar fila
      const finalRow = transformRow ? transformRow(mappedRow) : mappedRow;
      processedData.push(finalRow as T);
    }

    return {
      success: true,
      data: processedData,
      headers,
      errors,
      warnings,
      preview: {
        totalRows: processedData.length,
        sampleRows: processedData.slice(0, 5) as T[],
      },
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      headers: [],
      errors: [error instanceof Error ? error.message : 'Error al procesar archivo Excel'],
      warnings: [],
      preview: { totalRows: 0, sampleRows: [] },
    };
  }
}

// ============================================
// CONFIGURACIONES PREDEFINIDAS
// ============================================

/**
 * Configuracion para parsear envios/guias
 */
export const SHIPMENT_EXCEL_CONFIG: ExcelParserOptions = {
  requiredColumns: [],
  columnMapping: {
    'guia': 'guideId',
    'guide': 'guideId',
    'numero': 'guideId',
    'tracking': 'guideId',
    'estado': 'status',
    'status': 'status',
    'telefono': 'phone',
    'phone': 'phone',
    'celular': 'phone',
    'transportadora': 'carrier',
    'carrier': 'carrier',
    'destino': 'destination',
    'ciudad': 'destination',
    'valor': 'value',
    'precio': 'value',
  },
  skipEmptyRows: true,
};

/**
 * Configuracion para parsear datos historicos de transportadoras
 */
export const HISTORICAL_EXCEL_CONFIG: ExcelParserOptions = {
  requiredColumns: ['CIUDAD', 'TRANSPORTADORA'],
  columnMapping: {
    'CIUDAD': 'city',
    'TRANSPORTADORA': 'carrier',
    'DEVOLUCIONES': 'returns',
    'ENTREGAS': 'deliveries',
    'TOTAL': 'total',
    'DIAS': 'avgDays',
  },
  skipEmptyRows: true,
};

/**
 * Configuracion para parsear ingresos financieros
 */
export const INCOME_EXCEL_CONFIG: ExcelParserOptions = {
  requiredColumns: ['fecha', 'monto'],
  columnMapping: {
    'fecha': 'date',
    'monto': 'amount',
    'concepto': 'concept',
    'categoria': 'category',
  },
  skipEmptyRows: true,
};

// ============================================
// FUNCIONES ESPECIALIZADAS
// ============================================

/**
 * Parsea un archivo Excel de envios/guias
 */
export async function parseShipmentExcel(file: File) {
  return parseExcel(file, {
    ...SHIPMENT_EXCEL_CONFIG,
    transformRow: (row) => ({
      guideId: findColumnValue(row, ['guia', 'guide', 'numero', 'id', 'tracking', 'nro']),
      status: findColumnValue(row, ['estado', 'status', 'estatus']),
      phone: findColumnValue(row, ['telefono', 'phone', 'celular', 'cel', 'movil']),
      carrier: findColumnValue(row, ['transportadora', 'carrier', 'empresa', 'mensajeria']),
      destination: findColumnValue(row, ['destino', 'destination', 'ciudad', 'city', 'municipio']),
      daysInTransit: findColumnValue(row, ['dias', 'days', 'tiempo', 'time']),
      value: findColumnValue(row, ['valor', 'value', 'precio', 'price', 'monto', 'amount']),
      rawData: row,
    }),
  });
}

/**
 * Parsea un archivo Excel de datos historicos
 */
export async function parseHistoricalExcel(file: File) {
  return parseExcel(file, HISTORICAL_EXCEL_CONFIG);
}

/**
 * Parsea un archivo Excel de ingresos
 */
export async function parseIncomeExcel(file: File) {
  return parseExcel(file, INCOME_EXCEL_CONFIG);
}

// ============================================
// UTILIDADES
// ============================================

/**
 * Verifica si una fila esta vacia
 */
function isRowEmpty(row: Record<string, unknown>): boolean {
  return Object.values(row).every(
    (value) => value === '' || value === null || value === undefined
  );
}

/**
 * Aplica mapeo de columnas a una fila
 */
function applyColumnMapping(
  row: Record<string, unknown>,
  mapping: Record<string, string>
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...row };

  for (const [from, to] of Object.entries(mapping)) {
    const fromLower = from.toLowerCase();
    for (const [key, value] of Object.entries(row)) {
      if (key.toLowerCase() === fromLower) {
        result[to] = value;
      }
    }
  }

  return result;
}

/**
 * Encuentra el valor de una columna por multiples nombres posibles
 */
function findColumnValue(row: Record<string, unknown>, possibleNames: string[]): string {
  for (const name of possibleNames) {
    for (const [key, value] of Object.entries(row)) {
      if (key.toLowerCase().includes(name.toLowerCase())) {
        return String(value || '');
      }
    }
  }
  return '';
}

/**
 * Normaliza un string (quita acentos, mayusculas, espacios extra)
 */
export function normalizeString(str: string): string {
  return str
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

// ============================================
// GENERACION DE PLANTILLAS
// ============================================

/**
 * Genera una plantilla Excel para envios
 */
export function generateShipmentTemplate(): void {
  const exampleData = [
    {
      GUIA: '1234567890',
      ESTADO: 'EN TRANSITO',
      TELEFONO: '3001234567',
      TRANSPORTADORA: 'COORDINADORA',
      DESTINO: 'BOGOTA',
      VALOR: 50000,
    },
    {
      GUIA: '0987654321',
      ESTADO: 'ENTREGADO',
      TELEFONO: '3109876543',
      TRANSPORTADORA: 'ENVIA',
      DESTINO: 'MEDELLIN',
      VALOR: 75000,
    },
  ];

  downloadExcel(exampleData, 'plantilla_envios.xlsx', 'Envios');
}

/**
 * Genera una plantilla Excel para datos historicos
 */
export function generateHistoricalTemplate(): void {
  const deliveryExample = [
    { CIUDAD: 'BOGOTA', TRANSPORTADORA: 'COORDINADORA', DEVOLUCIONES: 331, ENTREGAS: 959, TOTAL: 1290 },
    { CIUDAD: 'BOGOTA', TRANSPORTADORA: 'ENVIA', DEVOLUCIONES: 150, ENTREGAS: 450, TOTAL: 600 },
    { CIUDAD: 'MEDELLIN', TRANSPORTADORA: 'COORDINADORA', DEVOLUCIONES: 50, ENTREGAS: 200, TOTAL: 250 },
  ];

  const timeExample = [
    { CIUDAD: 'BOGOTA', TRANSPORTADORA: 'COORDINADORA', DIAS: 2 },
    { CIUDAD: 'BOGOTA', TRANSPORTADORA: 'ENVIA', DIAS: 3 },
    { CIUDAD: 'MEDELLIN', TRANSPORTADORA: 'COORDINADORA', DIAS: 3 },
  ];

  const wb = XLSX.utils.book_new();
  const ws1 = XLSX.utils.json_to_sheet(deliveryExample);
  const ws2 = XLSX.utils.json_to_sheet(timeExample);

  XLSX.utils.book_append_sheet(wb, ws1, 'Tasa_Entregas');
  XLSX.utils.book_append_sheet(wb, ws2, 'Tiempo_Promedio');

  XLSX.writeFile(wb, 'plantilla_datos_historicos.xlsx');
}

/**
 * Genera una plantilla Excel para ingresos
 */
export function generateIncomeTemplate(): void {
  const exampleData = [
    { FECHA: '2024-01-15', MONTO: 1500000, CONCEPTO: 'Ventas Online', CATEGORIA: 'Ventas' },
    { FECHA: '2024-01-16', MONTO: 2300000, CONCEPTO: 'Ventas Tienda', CATEGORIA: 'Ventas' },
    { FECHA: '2024-01-17', MONTO: 500000, CONCEPTO: 'Servicios', CATEGORIA: 'Servicios' },
  ];

  downloadExcel(exampleData, 'plantilla_ingresos.xlsx', 'Ingresos');
}

/**
 * Descarga datos como archivo Excel
 */
export function downloadExcel(
  data: Record<string, unknown>[],
  filename: string,
  sheetName: string = 'Datos'
): void {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);
}

/**
 * Exporta datos a Excel
 */
export function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  options?: {
    sheetName?: string;
    headers?: Record<keyof T, string>;
  }
): void {
  let exportData = data;

  // Renombrar headers si se especifican
  if (options?.headers) {
    exportData = data.map((row) => {
      const newRow: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(row)) {
        const newKey = options.headers?.[key as keyof T] || key;
        newRow[newKey] = value;
      }
      return newRow as T;
    });
  }

  downloadExcel(exportData, filename, options?.sheetName);
}

// ============================================
// VALIDADORES
// ============================================

/**
 * Valida que un archivo sea Excel
 */
export function isExcelFile(file: File): boolean {
  const validTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'application/excel',
    'application/x-excel',
  ];
  const validExtensions = ['.xlsx', '.xls', '.xlsm'];

  const hasValidType = validTypes.includes(file.type);
  const hasValidExtension = validExtensions.some((ext) =>
    file.name.toLowerCase().endsWith(ext)
  );

  return hasValidType || hasValidExtension;
}

/**
 * Valida el tamano del archivo
 */
export function validateFileSize(file: File, maxSizeMB: number = 10): boolean {
  const maxBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxBytes;
}

export default {
  parseExcel,
  parseShipmentExcel,
  parseHistoricalExcel,
  parseIncomeExcel,
  generateShipmentTemplate,
  generateHistoricalTemplate,
  generateIncomeTemplate,
  downloadExcel,
  exportToExcel,
  isExcelFile,
  validateFileSize,
  normalizeString,
  fixMojibake,
};
