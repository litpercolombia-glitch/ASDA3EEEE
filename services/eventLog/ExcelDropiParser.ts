/**
 * ExcelDropiParser - PR #2
 *
 * Parser for Dropi Excel reports.
 * Reads EXACTLY these columns:
 * - fecha
 * - telefono
 * - numero_de_guia
 * - estatus
 * - ciudad_de_destino
 * - transportadora
 * - novedad
 * - fecha_de_ultimo_movimiento
 * - ultimo_movimiento
 * - fecha_de_generacion_de_guia
 */

import {
  DropiRawData,
  BatchProcessResult,
  EventLogProcessResult,
} from '../../types/eventLog.types';
import { EventLogService } from './EventLogService';

// =====================================================
// COLUMN MAPPING
// =====================================================

/**
 * Expected column names from Dropi Excel exports
 * Maps various possible column names to our internal field names
 */
const COLUMN_MAPPINGS: Record<string, keyof DropiRawData> = {
  // fecha
  'fecha': 'fecha',
  'Fecha': 'fecha',
  'FECHA': 'fecha',
  'date': 'fecha',

  // telefono
  'telefono': 'telefono',
  'Telefono': 'telefono',
  'TELEFONO': 'telefono',
  'teléfono': 'telefono',
  'Teléfono': 'telefono',
  'phone': 'telefono',
  'celular': 'telefono',
  'Celular': 'telefono',

  // numero_de_guia
  'numero_de_guia': 'numero_de_guia',
  'Numero_de_guia': 'numero_de_guia',
  'NUMERO_DE_GUIA': 'numero_de_guia',
  'numero de guia': 'numero_de_guia',
  'Numero de guia': 'numero_de_guia',
  'número de guía': 'numero_de_guia',
  'Número de guía': 'numero_de_guia',
  'guia': 'numero_de_guia',
  'Guia': 'numero_de_guia',
  'GUIA': 'numero_de_guia',
  'tracking': 'numero_de_guia',
  'tracking_number': 'numero_de_guia',

  // estatus
  'estatus': 'estatus',
  'Estatus': 'estatus',
  'ESTATUS': 'estatus',
  'estado': 'estatus',
  'Estado': 'estatus',
  'ESTADO': 'estatus',
  'status': 'estatus',

  // ciudad_de_destino
  'ciudad_de_destino': 'ciudad_de_destino',
  'Ciudad_de_destino': 'ciudad_de_destino',
  'CIUDAD_DE_DESTINO': 'ciudad_de_destino',
  'ciudad de destino': 'ciudad_de_destino',
  'Ciudad de destino': 'ciudad_de_destino',
  'ciudad': 'ciudad_de_destino',
  'Ciudad': 'ciudad_de_destino',
  'CIUDAD': 'ciudad_de_destino',
  'city': 'ciudad_de_destino',

  // transportadora
  'transportadora': 'transportadora',
  'Transportadora': 'transportadora',
  'TRANSPORTADORA': 'transportadora',
  'carrier': 'transportadora',
  'Carrier': 'transportadora',

  // novedad
  'novedad': 'novedad',
  'Novedad': 'novedad',
  'NOVEDAD': 'novedad',
  'observacion': 'novedad',
  'Observacion': 'novedad',
  'observación': 'novedad',
  'Observación': 'novedad',

  // fecha_de_ultimo_movimiento
  'fecha_de_ultimo_movimiento': 'fecha_de_ultimo_movimiento',
  'Fecha_de_ultimo_movimiento': 'fecha_de_ultimo_movimiento',
  'FECHA_DE_ULTIMO_MOVIMIENTO': 'fecha_de_ultimo_movimiento',
  'fecha de ultimo movimiento': 'fecha_de_ultimo_movimiento',
  'Fecha de ultimo movimiento': 'fecha_de_ultimo_movimiento',
  'fecha último movimiento': 'fecha_de_ultimo_movimiento',
  'Fecha último movimiento': 'fecha_de_ultimo_movimiento',
  'fecha_ultimo_movimiento': 'fecha_de_ultimo_movimiento',
  'last_movement_date': 'fecha_de_ultimo_movimiento',

  // ultimo_movimiento
  'ultimo_movimiento': 'ultimo_movimiento',
  'Ultimo_movimiento': 'ultimo_movimiento',
  'ULTIMO_MOVIMIENTO': 'ultimo_movimiento',
  'ultimo movimiento': 'ultimo_movimiento',
  'Ultimo movimiento': 'ultimo_movimiento',
  'último movimiento': 'ultimo_movimiento',
  'Último movimiento': 'ultimo_movimiento',
  'last_movement': 'ultimo_movimiento',
  'descripcion_movimiento': 'ultimo_movimiento',

  // fecha_de_generacion_de_guia
  'fecha_de_generacion_de_guia': 'fecha_de_generacion_de_guia',
  'Fecha_de_generacion_de_guia': 'fecha_de_generacion_de_guia',
  'FECHA_DE_GENERACION_DE_GUIA': 'fecha_de_generacion_de_guia',
  'fecha de generacion de guia': 'fecha_de_generacion_de_guia',
  'Fecha de generacion de guia': 'fecha_de_generacion_de_guia',
  'fecha generación guía': 'fecha_de_generacion_de_guia',
  'Fecha generación guía': 'fecha_de_generacion_de_guia',
  'fecha_generacion_guia': 'fecha_de_generacion_de_guia',
  'created_at': 'fecha_de_generacion_de_guia',
};

/**
 * Required columns that must be present
 */
const REQUIRED_COLUMNS: (keyof DropiRawData)[] = [
  'numero_de_guia',
  'estatus',
  'ciudad_de_destino',
  'transportadora',
];

// =====================================================
// PARSER
// =====================================================

export interface ParsedExcelResult {
  /** Headers found and mapped */
  headers: Record<string, keyof DropiRawData>;

  /** Raw data rows */
  rows: DropiRawData[];

  /** Missing required columns */
  missingColumns: string[];

  /** Warnings (e.g., unmapped columns) */
  warnings: string[];
}

/**
 * Parse Excel data (expects array of objects from xlsx library)
 */
export function parseExcelData(
  rawRows: Record<string, unknown>[]
): ParsedExcelResult {
  if (rawRows.length === 0) {
    return {
      headers: {},
      rows: [],
      missingColumns: REQUIRED_COLUMNS as string[],
      warnings: ['No data rows found'],
    };
  }

  // Get headers from first row keys
  const rawHeaders = Object.keys(rawRows[0]);
  const headers: Record<string, keyof DropiRawData> = {};
  const warnings: string[] = [];

  // Map headers
  for (const header of rawHeaders) {
    const normalizedHeader = header.trim();
    const mappedField = COLUMN_MAPPINGS[normalizedHeader];

    if (mappedField) {
      headers[normalizedHeader] = mappedField;
    } else {
      warnings.push(`Unmapped column: "${normalizedHeader}"`);
    }
  }

  // Check for missing required columns
  const foundFields = new Set(Object.values(headers));
  const missingColumns = REQUIRED_COLUMNS.filter(col => !foundFields.has(col));

  // Parse rows
  const rows: DropiRawData[] = [];

  for (const rawRow of rawRows) {
    const row: Partial<DropiRawData> = {};

    for (const [originalHeader, mappedField] of Object.entries(headers)) {
      const value = rawRow[originalHeader];
      row[mappedField] = value !== undefined && value !== null
        ? String(value).trim()
        : '';
    }

    // Only add row if it has a guia
    if (row.numero_de_guia) {
      rows.push(row as DropiRawData);
    }
  }

  return {
    headers,
    rows,
    missingColumns,
    warnings,
  };
}

/**
 * Process Excel data and create EventLog entries
 */
export async function processExcelDropi(
  rawRows: Record<string, unknown>[]
): Promise<BatchProcessResult> {
  const startTime = Date.now();
  const source = 'excel_dropi' as const;

  // Parse the Excel data
  const parsed = parseExcelData(rawRows);

  // Check for missing required columns
  if (parsed.missingColumns.length > 0) {
    return {
      totalRows: rawRows.length,
      successCount: 0,
      duplicateCount: 0,
      outOfOrderCount: 0,
      errorCount: rawRows.length,
      errors: [{
        row: 0,
        guia: '',
        message: `Missing required columns: ${parsed.missingColumns.join(', ')}`,
      }],
      durationMs: Date.now() - startTime,
      source,
      processedAt: new Date(),
    };
  }

  // Process each row
  const results: BatchProcessResult = {
    totalRows: parsed.rows.length,
    successCount: 0,
    duplicateCount: 0,
    outOfOrderCount: 0,
    errorCount: 0,
    errors: [],
    durationMs: 0,
    source,
    processedAt: new Date(),
  };

  for (let i = 0; i < parsed.rows.length; i++) {
    const row = parsed.rows[i];

    try {
      const result = await EventLogService.processDropiData(row, source);

      if (result.isDuplicate) {
        results.duplicateCount++;
        EventLogService.incrementDuplicateCount(row.numero_de_guia);
      } else if (result.isOutOfOrder) {
        results.outOfOrderCount++;
        results.successCount++; // Still counts as success, just flagged
      } else {
        results.successCount++;
      }
    } catch (error) {
      results.errorCount++;
      results.errors.push({
        row: i + 1, // 1-indexed for user display
        guia: row.numero_de_guia,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  results.durationMs = Date.now() - startTime;

  return results;
}

/**
 * Validate Excel structure before processing
 */
export function validateExcelStructure(
  rawRows: Record<string, unknown>[]
): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  columnMap: Record<string, keyof DropiRawData>;
} {
  if (rawRows.length === 0) {
    return {
      isValid: false,
      errors: ['Excel file is empty'],
      warnings: [],
      columnMap: {},
    };
  }

  const parsed = parseExcelData(rawRows.slice(0, 1)); // Just check headers

  return {
    isValid: parsed.missingColumns.length === 0,
    errors: parsed.missingColumns.map(col => `Missing required column: ${col}`),
    warnings: parsed.warnings,
    columnMap: parsed.headers,
  };
}

// Default export
export default {
  parseExcelData,
  processExcelDropi,
  validateExcelStructure,
  COLUMN_MAPPINGS,
  REQUIRED_COLUMNS,
};
