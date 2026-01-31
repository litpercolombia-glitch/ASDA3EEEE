/**
 * EXCEL PARSER UNIFICADO
 *
 * Este archivo contiene TODA la logica de parseo de Excel.
 * NUNCA crees parsers de Excel en otros archivos.
 * Siempre usa: import { parseExcel, parseShipmentExcel } from '@/utils/excelParser'
 */

import * as XLSX from 'xlsx';

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
    // Leer archivo
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });

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

    // Obtener headers
    const headers = Object.keys(rawData[0]);

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
    const rowsToProcess = maxRows ? rawData.slice(0, maxRows) : rawData;

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
 * ACTUALIZADO: Mapeo completo para Excel Colombia (63 columnas)
 */
export const SHIPMENT_EXCEL_CONFIG: ExcelParserOptions = {
  requiredColumns: [],
  columnMapping: {
    // GUÍA - Múltiples variantes
    'guia': 'guideId',
    'guía': 'guideId',
    'guide': 'guideId',
    'numero': 'guideId',
    'número': 'guideId',
    'tracking': 'guideId',
    'numero de guia': 'guideId',
    'número de guía': 'guideId',
    'no. guia': 'guideId',
    'codigo': 'guideId',
    'código': 'guideId',

    // ESTADO/ESTATUS - Variantes Colombia
    'estado': 'status',
    'estatus': 'status',
    'status': 'status',
    'estado actual': 'status',
    'estatus actual': 'status',
    'estado envio': 'status',
    'estado del envio': 'status',

    // CIUDAD DESTINO - Variantes completas
    'ciudad destino': 'destination',
    'ciudad_destino': 'destination',
    'destino': 'destination',
    'ciudad': 'destination',
    'city': 'destination',
    'municipio': 'destination',
    'ciudad de destino': 'destination',
    'municipio destino': 'destination',

    // ÚLTIMO MOVIMIENTO
    'ultimo movimiento': 'lastMovement',
    'último movimiento': 'lastMovement',
    'ultimomovimiento': 'lastMovement',
    'movimiento': 'lastMovement',
    'tracking': 'lastMovement',
    'novedad': 'lastMovement',

    // TELÉFONO
    'telefono': 'phone',
    'teléfono': 'phone',
    'phone': 'phone',
    'celular': 'phone',
    'cel': 'phone',
    'movil': 'phone',
    'móvil': 'phone',
    'telefono destinatario': 'phone',

    // TRANSPORTADORA
    'transportadora': 'carrier',
    'carrier': 'carrier',
    'empresa': 'carrier',
    'mensajeria': 'carrier',
    'mensajería': 'carrier',
    'courier': 'carrier',

    // VALOR
    'valor': 'value',
    'precio': 'value',
    'value': 'value',
    'monto': 'value',
    'total': 'value',
    'valor declarado': 'value',
    'recaudo': 'value',

    // FECHA
    'fecha': 'date',
    'date': 'date',
    'fecha envio': 'date',
    'fecha creacion': 'date',

    // DESTINATARIO
    'destinatario': 'recipientName',
    'nombre destinatario': 'recipientName',
    'cliente': 'recipientName',
    'receptor': 'recipientName',

    // DIRECCIÓN
    'direccion': 'address',
    'dirección': 'address',
    'direccion destino': 'address',
    'dir': 'address',

    // DEPARTAMENTO
    'departamento': 'department',
    'depto': 'department',
    'region': 'department',
  },
  skipEmptyRows: false, // Cambiar a false para no perder filas
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
 * ACTUALIZADO: Mapeo completo de columnas para Excel Colombia (63 columnas)
 */
export async function parseShipmentExcel(file: File) {
  let skippedRows = 0;
  let processedRows = 0;

  const result = await parseExcel(file, {
    ...SHIPMENT_EXCEL_CONFIG,
    skipEmptyRows: false, // No saltar filas para contar correctamente
    transformRow: (row) => {
      // Verificar si la fila tiene datos útiles
      const guideId = findColumnValue(row, [
        'guia', 'guide', 'numero', 'id', 'tracking', 'nro', 'guía',
        'numero de guia', 'número de guía', 'no. guia', 'no guia',
        'numero guia', 'n° guia', 'n guia', 'cod', 'codigo'
      ]);

      if (!guideId || guideId.trim() === '') {
        skippedRows++;
        return null; // Marcar para filtrar después
      }

      processedRows++;

      return {
        guideId,
        // ESTATUS - Mapeo ampliado
        status: findColumnValue(row, [
          'estatus', 'estado', 'status', 'state',
          'estado actual', 'estatus actual', 'estado envio',
          'estado del envio', 'estado de la guia', 'situacion'
        ]),
        // CIUDAD DESTINO - Mapeo ampliado
        destination: findColumnValue(row, [
          'ciudad destino', 'ciudad_destino', 'ciudaddestino',
          'destino', 'destination', 'ciudad', 'city', 'municipio',
          'ciudad de destino', 'municipio destino', 'ciudad entrega',
          'ciudad destinatario', 'poblacion destino', 'localidad destino'
        ]),
        // ÚLTIMO MOVIMIENTO - Nuevo campo
        lastMovement: findColumnValue(row, [
          'ultimo movimiento', 'último movimiento', 'last movement',
          'ultimomovimiento', 'ultimo_movimiento', 'movimiento',
          'ultima actualizacion', 'última actualización', 'tracking',
          'seguimiento', 'novedad', 'observacion', 'descripcion estado'
        ]),
        // TELÉFONO - Mapeo ampliado
        phone: findColumnValue(row, [
          'telefono', 'teléfono', 'phone', 'celular', 'cel', 'movil', 'móvil',
          'telefono destinatario', 'tel destinatario', 'contacto',
          'numero celular', 'número celular', 'tel', 'fono'
        ]),
        // TRANSPORTADORA - Mapeo ampliado
        carrier: findColumnValue(row, [
          'transportadora', 'carrier', 'empresa', 'mensajeria', 'mensajería',
          'empresa transporte', 'courier', 'operador', 'proveedor',
          'empresa de envios', 'compañia', 'compañía'
        ]),
        // DÍAS EN TRÁNSITO
        daysInTransit: findColumnValue(row, [
          'dias', 'días', 'days', 'tiempo', 'time', 'dias transito',
          'días en tránsito', 'tiempo transito', 'dias habiles'
        ]),
        // VALOR
        value: findColumnValue(row, [
          'valor', 'value', 'precio', 'price', 'monto', 'amount',
          'valor declarado', 'valor envio', 'total', 'costo', 'importe',
          'valor recaudo', 'recaudo', 'cod value'
        ]),
        // FECHA
        date: findColumnValue(row, [
          'fecha', 'date', 'fecha envio', 'fecha creacion', 'fecha despacho',
          'fecha ingreso', 'fecha registro', 'created', 'created_at'
        ]),
        // DESTINATARIO
        recipientName: findColumnValue(row, [
          'destinatario', 'nombre destinatario', 'recipient', 'cliente',
          'nombre cliente', 'receptor', 'consignatario', 'para'
        ]),
        // DIRECCIÓN
        address: findColumnValue(row, [
          'direccion', 'dirección', 'address', 'direccion destino',
          'direccion entrega', 'dir', 'domicilio'
        ]),
        // DEPARTAMENTO
        department: findColumnValue(row, [
          'departamento', 'depto', 'dpto', 'region', 'región',
          'departamento destino', 'estado destino'
        ]),
        // Guardar datos originales para debug
        rawData: row,
      };
    },
  });

  // Filtrar filas nulas (las que no tenían guía)
  const filteredData = result.data.filter((item: any) => item !== null);

  // Log de filas procesadas vs ignoradas
  console.log(`[ExcelParser] Procesamiento completado:`);
  console.log(`  - Total filas en archivo: ${result.preview.totalRows + skippedRows}`);
  console.log(`  - Filas procesadas: ${filteredData.length}`);
  console.log(`  - Filas ignoradas (sin guía): ${skippedRows}`);

  if (skippedRows > 0) {
    result.warnings.push(`${skippedRows} filas ignoradas por no tener número de guía`);
  }

  return {
    ...result,
    data: filteredData,
    preview: {
      ...result.preview,
      totalRows: filteredData.length,
      sampleRows: filteredData.slice(0, 5),
    },
  };
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
 * MEJORADO: Busca coincidencias exactas primero, luego parciales
 */
function findColumnValue(row: Record<string, unknown>, possibleNames: string[]): string {
  const normalizedRow: Record<string, { key: string; value: unknown }> = {};

  // Normalizar todas las claves del row
  for (const [key, value] of Object.entries(row)) {
    const normalizedKey = normalizeColumnName(key);
    normalizedRow[normalizedKey] = { key, value };
  }

  // PASO 1: Buscar coincidencia EXACTA (normalizada)
  for (const name of possibleNames) {
    const normalizedName = normalizeColumnName(name);
    if (normalizedRow[normalizedName]) {
      const val = normalizedRow[normalizedName].value;
      if (val !== null && val !== undefined && val !== '') {
        return String(val);
      }
    }
  }

  // PASO 2: Buscar coincidencia PARCIAL (la clave contiene el nombre)
  for (const name of possibleNames) {
    const normalizedName = normalizeColumnName(name);
    for (const [normalizedKey, { value }] of Object.entries(normalizedRow)) {
      if (normalizedKey.includes(normalizedName) || normalizedName.includes(normalizedKey)) {
        if (value !== null && value !== undefined && value !== '') {
          return String(value);
        }
      }
    }
  }

  // PASO 3: Buscar coincidencia por palabras clave
  for (const name of possibleNames) {
    const nameWords = normalizeColumnName(name).split(/[\s_-]+/).filter(w => w.length > 2);
    for (const [normalizedKey, { value }] of Object.entries(normalizedRow)) {
      const keyWords = normalizedKey.split(/[\s_-]+/).filter(w => w.length > 2);
      // Si todas las palabras del nombre están en la clave
      if (nameWords.length > 0 && nameWords.every(word => keyWords.some(kw => kw.includes(word) || word.includes(kw)))) {
        if (value !== null && value !== undefined && value !== '') {
          return String(value);
        }
      }
    }
  }

  return '';
}

/**
 * Normaliza el nombre de una columna para comparación
 */
function normalizeColumnName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
    .replace(/[^a-z0-9\s]/g, ' ')    // Quitar caracteres especiales
    .replace(/\s+/g, ' ')            // Normalizar espacios
    .trim();
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
};
