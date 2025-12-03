/**
 * Input validation utilities
 */

import { VALIDATION, CARRIER_PATTERNS } from '../config/constants';
import { ValidationError } from './errorHandler';

/**
 * Validate phone number
 */
export function validatePhone(phone: string): boolean {
  return VALIDATION.PHONE.test(phone.trim());
}

/**
 * Validate email address
 */
export function validateEmail(email: string): boolean {
  return VALIDATION.EMAIL.test(email.trim());
}

/**
 * Validate tracking number format
 */
export function validateTrackingNumber(trackingNumber: string): boolean {
  const trimmed = trackingNumber.trim();
  return trimmed.length >= 8 && trimmed.length <= 15;
}

/**
 * Validate file size
 */
export function validateFileSize(file: File, maxSizeMB: number): boolean {
  const maxBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxBytes;
}

/**
 * Validate image file type
 */
export function validateImageType(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  return validTypes.includes(file.type);
}

/**
 * Validate CSV/Excel data row
 */
export interface DataRow {
  [key: string]: string | number | undefined;
}

export function validateDataRow(row: DataRow, requiredFields: string[]): void {
  const missing = requiredFields.filter((field) => !row[field]);

  if (missing.length > 0) {
    throw new ValidationError(`Campos requeridos faltantes: ${missing.join(', ')}`, {
      missing,
      row,
    });
  }
}

/**
 * Sanitize user input
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .slice(0, 1000); // Limit length
}

/**
 * Validate batch ID format
 */
export function validateBatchId(batchId: string): boolean {
  return /^[A-Z0-9_-]{3,50}$/i.test(batchId);
}

/**
 * Detect carrier from tracking number
 */
export function detectCarrier(trackingNumber: string): string | null {
  const trimmed = trackingNumber.trim();

  if (CARRIER_PATTERNS.INTER.test(trimmed)) return 'Inter Rapidísimo';
  if (CARRIER_PATTERNS.ENVIA.test(trimmed)) return 'Envía';
  if (CARRIER_PATTERNS.COORDINADORA.test(trimmed)) return 'Coordinadora';
  if (CARRIER_PATTERNS.TCC.test(trimmed)) return 'TCC';
  if (CARRIER_PATTERNS.VELOCES.test(trimmed)) return 'Veloces';

  return null;
}

/**
 * Validate API key presence
 */
export function validateApiKey(apiKey: string | undefined): void {
  if (!apiKey || apiKey.trim() === '') {
    throw new ValidationError('API key de Gemini no configurada. Verifica tu archivo .env', {
      key: 'VITE_GEMINI_API_KEY',
    });
  }
}

/**
 * Parse CSV line safely
 */
export function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}
