/**
 * EventLog Tests - PR #2
 *
 * Tests obligatorios:
 * - Parseo correcto del Excel (columnas exactas)
 * - StatusNormalizer aplicado a estatus
 * - payloadHash estable
 * - Dedupe por payloadHash
 * - Evento fuera de orden no degrada estado
 * - phoneHash generado correctamente (sin guardar teléfono)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  EventLogService,
  sha256,
  normalizePhone,
  generatePhoneHash,
  buildHashPayload,
  generatePayloadHash,
  buildEventKey,
  parseDropiDate,
} from '../services/eventLog/EventLogService';
import {
  parseExcelData,
  processExcelDropi,
  validateExcelStructure,
  REQUIRED_COLUMNS,
} from '../services/eventLog/ExcelDropiParser';
import { ActionLogService } from '../services/eventLog/ActionLogService';
import { DropiRawData } from '../types/eventLog.types';
import { CanonicalStatus } from '../types/canonical.types';

// =====================================================
// TEST DATA
// =====================================================

const SAMPLE_DROPI_ROW: DropiRawData = {
  fecha: '2024-01-15',
  telefono: '3001234567',
  numero_de_guia: 'GUIA123456',
  estatus: 'ENTREGADO',
  ciudad_de_destino: 'Bogotá',
  transportadora: 'Coordinadora',
  novedad: '',
  fecha_de_ultimo_movimiento: '2024-01-15 10:30',
  ultimo_movimiento: 'Entrega exitosa al destinatario',
  fecha_de_generacion_de_guia: '2024-01-10',
};

const SAMPLE_EXCEL_DATA = [
  {
    fecha: '2024-01-15',
    telefono: '3001234567',
    numero_de_guia: 'GUIA001',
    estatus: 'ENTREGADO',
    ciudad_de_destino: 'Bogotá',
    transportadora: 'Coordinadora',
    novedad: '',
    fecha_de_ultimo_movimiento: '2024-01-15 10:30',
    ultimo_movimiento: 'Entrega exitosa',
    fecha_de_generacion_de_guia: '2024-01-10',
  },
  {
    fecha: '2024-01-15',
    telefono: '3009876543',
    numero_de_guia: 'GUIA002',
    estatus: 'EN REPARTO',
    ciudad_de_destino: 'Medellín',
    transportadora: 'Inter',
    novedad: '',
    fecha_de_ultimo_movimiento: '2024-01-15 08:00',
    ultimo_movimiento: 'Salió a reparto',
    fecha_de_generacion_de_guia: '2024-01-12',
  },
  {
    fecha: '2024-01-15',
    telefono: '3005551234',
    numero_de_guia: 'GUIA003',
    estatus: 'DESTINATARIO AUSENTE',
    ciudad_de_destino: 'Cali',
    transportadora: 'TCC',
    novedad: 'Cliente no se encontraba',
    fecha_de_ultimo_movimiento: '2024-01-15 14:00',
    ultimo_movimiento: 'Intento de entrega fallido',
    fecha_de_generacion_de_guia: '2024-01-11',
  },
];

// =====================================================
// HASH UTILITIES TESTS
// =====================================================

describe('Hash Utilities', () => {
  describe('sha256()', () => {
    it('should generate consistent hash for same input', async () => {
      const hash1 = await sha256('test-string');
      const hash2 = await sha256('test-string');
      expect(hash1).toBe(hash2);
    });

    it('should generate different hash for different input', async () => {
      const hash1 = await sha256('test-string-1');
      const hash2 = await sha256('test-string-2');
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('normalizePhone()', () => {
    it('should normalize Colombian phone without country code', () => {
      expect(normalizePhone('3001234567')).toBe('+573001234567');
    });

    it('should normalize phone with country code', () => {
      expect(normalizePhone('+573001234567')).toBe('+573001234567');
    });

    it('should remove spaces and dashes', () => {
      expect(normalizePhone('300-123-4567')).toBe('+573001234567');
      expect(normalizePhone('300 123 4567')).toBe('+573001234567');
    });

    it('should remove leading zero', () => {
      expect(normalizePhone('03001234567')).toBe('+573001234567');
    });

    it('should return empty for empty input', () => {
      expect(normalizePhone('')).toBe('');
    });
  });

  describe('generatePhoneHash()', () => {
    it('should generate hash for phone', async () => {
      const hash = await generatePhoneHash('3001234567');
      expect(hash).toBeTruthy();
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should generate same hash for equivalent phones', async () => {
      const hash1 = await generatePhoneHash('3001234567');
      const hash2 = await generatePhoneHash('+573001234567');
      expect(hash1).toBe(hash2);
    });

    it('should return "no_phone" for empty phone', async () => {
      const hash = await generatePhoneHash('');
      expect(hash).toBe('no_phone');
    });
  });

  describe('buildHashPayload()', () => {
    it('should exclude telefono from payload', () => {
      const payload = buildHashPayload(SAMPLE_DROPI_ROW);
      expect(payload).not.toContain('telefono');
      expect(payload).not.toContain('3001234567');
    });

    it('should include required fields', () => {
      const payload = buildHashPayload(SAMPLE_DROPI_ROW);
      expect(payload).toContain('GUIA123456');
      expect(payload).toContain('ENTREGADO');
      expect(payload).toContain('Bogotá');
      expect(payload).toContain('Coordinadora');
    });

    it('should be deterministic (same input = same output)', () => {
      const payload1 = buildHashPayload(SAMPLE_DROPI_ROW);
      const payload2 = buildHashPayload(SAMPLE_DROPI_ROW);
      expect(payload1).toBe(payload2);
    });
  });

  describe('generatePayloadHash()', () => {
    it('should generate stable hash', async () => {
      const hash1 = await generatePayloadHash(SAMPLE_DROPI_ROW);
      const hash2 = await generatePayloadHash(SAMPLE_DROPI_ROW);
      expect(hash1).toBe(hash2);
    });

    it('should generate different hash for different data', async () => {
      const row2 = { ...SAMPLE_DROPI_ROW, estatus: 'EN REPARTO' };
      const hash1 = await generatePayloadHash(SAMPLE_DROPI_ROW);
      const hash2 = await generatePayloadHash(row2);
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('buildEventKey()', () => {
    it('should build correct format', () => {
      const key = buildEventKey('excel_dropi', 'GUIA123', 'abc123hash');
      expect(key).toBe('event:excel_dropi:GUIA123:abc123hash');
    });
  });

  describe('parseDropiDate()', () => {
    it('should parse ISO format', () => {
      const date = parseDropiDate('2024-01-15T10:30:00Z');
      expect(date).toBeInstanceOf(Date);
      expect(date?.getFullYear()).toBe(2024);
    });

    it('should parse DD/MM/YYYY format', () => {
      const date = parseDropiDate('15/01/2024');
      expect(date).toBeInstanceOf(Date);
      expect(date?.getDate()).toBe(15);
      expect(date?.getMonth()).toBe(0); // January
    });

    it('should parse YYYY-MM-DD format', () => {
      const date = parseDropiDate('2024-01-15');
      expect(date).toBeInstanceOf(Date);
      expect(date?.getFullYear()).toBe(2024);
    });

    it('should parse with time component', () => {
      const date = parseDropiDate('2024-01-15 10:30');
      expect(date).toBeInstanceOf(Date);
      expect(date?.getHours()).toBe(10);
      expect(date?.getMinutes()).toBe(30);
    });

    it('should return null for empty input', () => {
      expect(parseDropiDate('')).toBeNull();
      expect(parseDropiDate(undefined)).toBeNull();
    });
  });
});

// =====================================================
// EVENTLOG SERVICE TESTS
// =====================================================

describe('EventLogService', () => {
  beforeEach(() => {
    EventLogService.clear();
  });

  describe('processDropiData()', () => {
    it('should create EventLog from Dropi data', async () => {
      const result = await EventLogService.processDropiData(SAMPLE_DROPI_ROW, 'excel_dropi');

      expect(result.eventLog).not.toBeNull();
      expect(result.isDuplicate).toBe(false);
      expect(result.eventLog?.guia).toBe('GUIA123456');
      expect(result.eventLog?.source).toBe('excel_dropi');
    });

    it('should apply StatusNormalizer to estatus', async () => {
      const result = await EventLogService.processDropiData(SAMPLE_DROPI_ROW, 'excel_dropi');

      expect(result.eventLog?.canonicalStatus).toBe(CanonicalStatus.DELIVERED);
      expect(result.eventLog?.rawStatus).toBe('ENTREGADO');
    });

    it('should generate phoneHash (not store phone)', async () => {
      const result = await EventLogService.processDropiData(SAMPLE_DROPI_ROW, 'excel_dropi');

      expect(result.eventLog?.phoneHash).toBeTruthy();
      expect(result.eventLog?.phoneHash).not.toBe('3001234567');
      expect(result.eventLog?.phoneHash).not.toContain('300');
    });

    it('should generate payloadHash', async () => {
      const result = await EventLogService.processDropiData(SAMPLE_DROPI_ROW, 'excel_dropi');

      expect(result.eventLog?.payloadHash).toBeTruthy();
      expect(result.eventLog?.payloadHash.length).toBeGreaterThan(0);
    });

    it('should detect and block duplicates by payloadHash', async () => {
      // First insert
      const result1 = await EventLogService.processDropiData(SAMPLE_DROPI_ROW, 'excel_dropi');
      expect(result1.isDuplicate).toBe(false);

      // Duplicate
      const result2 = await EventLogService.processDropiData(SAMPLE_DROPI_ROW, 'excel_dropi');
      expect(result2.isDuplicate).toBe(true);
      expect(result2.eventLog).toBeNull();
    });

    it('should allow same guia with different status', async () => {
      const result1 = await EventLogService.processDropiData(SAMPLE_DROPI_ROW, 'excel_dropi');
      expect(result1.isDuplicate).toBe(false);

      const updatedRow = { ...SAMPLE_DROPI_ROW, estatus: 'DEVUELTO' };
      const result2 = await EventLogService.processDropiData(updatedRow, 'excel_dropi');
      expect(result2.isDuplicate).toBe(false);
    });
  });

  describe('Out-of-order events', () => {
    it('should detect out-of-order events', async () => {
      // First event (newer)
      const newerRow: DropiRawData = {
        ...SAMPLE_DROPI_ROW,
        fecha_de_ultimo_movimiento: '2024-01-20 10:00',
        estatus: 'ENTREGADO',
      };
      await EventLogService.processDropiData(newerRow, 'excel_dropi');

      // Second event (older - out of order)
      const olderRow: DropiRawData = {
        ...SAMPLE_DROPI_ROW,
        fecha_de_ultimo_movimiento: '2024-01-15 10:00',
        estatus: 'EN REPARTO',
      };
      const result = await EventLogService.processDropiData(olderRow, 'excel_dropi');

      expect(result.isOutOfOrder).toBe(true);
      expect(result.eventLog?.isOutOfOrder).toBe(true);
    });

    it('should NOT degrade guide state for out-of-order events', async () => {
      // First event - delivered
      const deliveredRow: DropiRawData = {
        ...SAMPLE_DROPI_ROW,
        fecha_de_ultimo_movimiento: '2024-01-20 10:00',
        estatus: 'ENTREGADO',
      };
      await EventLogService.processDropiData(deliveredRow, 'excel_dropi');

      // Check state is DELIVERED
      let state = EventLogService.getGuideState('GUIA123456');
      expect(state?.currentStatus).toBe(CanonicalStatus.DELIVERED);

      // Out-of-order event - should NOT change state
      const olderRow: DropiRawData = {
        ...SAMPLE_DROPI_ROW,
        fecha_de_ultimo_movimiento: '2024-01-15 10:00',
        estatus: 'EN REPARTO',
      };
      await EventLogService.processDropiData(olderRow, 'excel_dropi');

      // State should still be DELIVERED
      state = EventLogService.getGuideState('GUIA123456');
      expect(state?.currentStatus).toBe(CanonicalStatus.DELIVERED);
    });
  });

  describe('getEventsForGuide()', () => {
    it('should return all events for a guide ordered by occurredAt', async () => {
      const row1: DropiRawData = {
        ...SAMPLE_DROPI_ROW,
        fecha_de_ultimo_movimiento: '2024-01-15 10:00',
        estatus: 'EN REPARTO',
      };
      const row2: DropiRawData = {
        ...SAMPLE_DROPI_ROW,
        fecha_de_ultimo_movimiento: '2024-01-16 10:00',
        estatus: 'ENTREGADO',
      };

      await EventLogService.processDropiData(row1, 'excel_dropi');
      await EventLogService.processDropiData(row2, 'excel_dropi');

      const events = EventLogService.getEventsForGuide('GUIA123456');
      expect(events.length).toBe(2);
      expect(events[0].rawStatus).toBe('EN REPARTO');
      expect(events[1].rawStatus).toBe('ENTREGADO');
    });
  });
});

// =====================================================
// EXCEL DROPI PARSER TESTS
// =====================================================

describe('ExcelDropiParser', () => {
  describe('parseExcelData()', () => {
    it('should parse Excel with exact column names', () => {
      const result = parseExcelData(SAMPLE_EXCEL_DATA);

      expect(result.rows.length).toBe(3);
      expect(result.missingColumns.length).toBe(0);
    });

    it('should map alternative column names', () => {
      const altData = [
        {
          Fecha: '2024-01-15',
          Telefono: '3001234567',
          Guia: 'GUIA001',
          Estado: 'ENTREGADO',
          Ciudad: 'Bogotá',
          Transportadora: 'Coordinadora',
        },
      ];

      const result = parseExcelData(altData);
      expect(result.rows.length).toBe(1);
      expect(result.rows[0].numero_de_guia).toBe('GUIA001');
      expect(result.rows[0].estatus).toBe('ENTREGADO');
    });

    it('should detect missing required columns', () => {
      const incompleteData = [
        {
          fecha: '2024-01-15',
          telefono: '3001234567',
          // Missing: numero_de_guia, estatus, ciudad_de_destino, transportadora
        },
      ];

      const result = parseExcelData(incompleteData);
      expect(result.missingColumns.length).toBeGreaterThan(0);
      expect(result.missingColumns).toContain('numero_de_guia');
    });

    it('should warn about unmapped columns', () => {
      const dataWithExtra = [
        {
          ...SAMPLE_EXCEL_DATA[0],
          columna_extra: 'valor',
          otra_columna: '123',
        },
      ];

      const result = parseExcelData(dataWithExtra);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.includes('columna_extra'))).toBe(true);
    });
  });

  describe('validateExcelStructure()', () => {
    it('should validate correct structure', () => {
      const result = validateExcelStructure(SAMPLE_EXCEL_DATA);
      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should invalidate empty file', () => {
      const result = validateExcelStructure([]);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Excel file is empty');
    });
  });

  describe('processExcelDropi()', () => {
    beforeEach(() => {
      EventLogService.clear();
    });

    it('should process all rows', async () => {
      const result = await processExcelDropi(SAMPLE_EXCEL_DATA);

      expect(result.totalRows).toBe(3);
      expect(result.successCount).toBe(3);
      expect(result.duplicateCount).toBe(0);
      expect(result.errorCount).toBe(0);
    });

    it('should detect duplicates on second import', async () => {
      // First import
      await processExcelDropi(SAMPLE_EXCEL_DATA);

      // Second import (all duplicates)
      const result = await processExcelDropi(SAMPLE_EXCEL_DATA);

      expect(result.duplicateCount).toBe(3);
      expect(result.successCount).toBe(0);
    });

    it('should calculate duration', async () => {
      const result = await processExcelDropi(SAMPLE_EXCEL_DATA);
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
    });
  });
});

// =====================================================
// ACTIONLOG SERVICE TESTS
// =====================================================

describe('ActionLogService', () => {
  beforeEach(() => {
    ActionLogService.clear();
  });

  describe('planAction()', () => {
    it('should create planned action', () => {
      const action = ActionLogService.planAction({
        actionType: 'SEND_WHATSAPP',
        guia: 'GUIA123',
        reason: 'Novedad detectada',
        city: 'Bogotá',
        carrier: 'Coordinadora',
        trigger: 'webhook',
      });

      expect(action).not.toBeNull();
      expect(action?.status).toBe('PLANNED');
      expect(action?.actionType).toBe('SEND_WHATSAPP');
      expect(action?.guia).toBe('GUIA123');
    });

    it('should skip duplicate actions', () => {
      // First action
      const action1 = ActionLogService.planAction({
        actionType: 'SEND_WHATSAPP',
        guia: 'GUIA123',
        trigger: 'webhook',
      });
      expect(action1?.status).toBe('PLANNED');

      // Duplicate
      const action2 = ActionLogService.planAction({
        actionType: 'SEND_WHATSAPP',
        guia: 'GUIA123',
        trigger: 'webhook',
      });
      expect(action2?.status).toBe('SKIPPED_DUPLICATE');
    });

    it('should allow different action types for same guia', () => {
      const action1 = ActionLogService.planAction({
        actionType: 'SEND_WHATSAPP',
        guia: 'GUIA123',
        trigger: 'webhook',
      });

      const action2 = ActionLogService.planAction({
        actionType: 'CREATE_TICKET',
        guia: 'GUIA123',
        trigger: 'webhook',
      });

      expect(action1?.status).toBe('PLANNED');
      expect(action2?.status).toBe('PLANNED');
    });
  });

  describe('buildIdempotencyKey()', () => {
    it('should include date for daily uniqueness', () => {
      const key = ActionLogService.buildIdempotencyKey(
        'SEND_WHATSAPP',
        'GUIA123',
        'webhook',
        new Date('2024-01-15')
      );

      expect(key).toContain('2024-01-15');
    });
  });

  describe('markSuccess() / markFailed()', () => {
    it('should update action status to SUCCESS', () => {
      const action = ActionLogService.planAction({
        actionType: 'SEND_WHATSAPP',
        guia: 'GUIA123',
      });

      const updated = ActionLogService.markSuccess(action!.id, { messageId: '123' });
      expect(updated?.status).toBe('SUCCESS');
      expect(updated?.executedAt).toBeInstanceOf(Date);
    });

    it('should update action status to FAILED', () => {
      const action = ActionLogService.planAction({
        actionType: 'SEND_WHATSAPP',
        guia: 'GUIA123',
      });

      const updated = ActionLogService.markFailed(action!.id, 'API error');
      expect(updated?.status).toBe('FAILED');
      expect(updated?.errorDetails).toBe('API error');
    });
  });
});

// =====================================================
// INTEGRATION TESTS
// =====================================================

describe('Integration: Full Flow', () => {
  beforeEach(() => {
    EventLogService.clear();
    ActionLogService.clear();
  });

  it('should process Excel and track actions', async () => {
    // 1. Process Excel
    const result = await processExcelDropi(SAMPLE_EXCEL_DATA);
    expect(result.successCount).toBe(3);

    // 2. Check guide states
    const state1 = EventLogService.getGuideState('GUIA001');
    expect(state1?.currentStatus).toBe(CanonicalStatus.DELIVERED);

    const state3 = EventLogService.getGuideState('GUIA003');
    expect(state3?.currentStatus).toBe(CanonicalStatus.ISSUE);

    // 3. Plan actions for issues
    const action = ActionLogService.planAction({
      actionType: 'SEND_WHATSAPP',
      guia: 'GUIA003',
      reason: 'Destinatario ausente',
      city: 'Cali',
      carrier: 'TCC',
      trigger: 'excel_import',
      canonicalStatus: CanonicalStatus.ISSUE,
    });

    expect(action?.status).toBe('PLANNED');

    // 4. Check statistics
    const eventStats = EventLogService.getStats();
    expect(eventStats.totalEvents).toBe(3);
    expect(eventStats.totalGuides).toBe(3);

    const actionStats = ActionLogService.getStats();
    expect(actionStats.total).toBe(1);
    expect(actionStats.byType['SEND_WHATSAPP']).toBe(1);
  });

  it('should handle complete audit trail for a guide', async () => {
    // Process events for a single guide
    const events = [
      { ...SAMPLE_DROPI_ROW, estatus: 'RECIBIDO', fecha_de_ultimo_movimiento: '2024-01-10 10:00' },
      { ...SAMPLE_DROPI_ROW, estatus: 'EN TRANSITO', fecha_de_ultimo_movimiento: '2024-01-11 10:00' },
      { ...SAMPLE_DROPI_ROW, estatus: 'EN REPARTO', fecha_de_ultimo_movimiento: '2024-01-12 10:00' },
      { ...SAMPLE_DROPI_ROW, estatus: 'ENTREGADO', fecha_de_ultimo_movimiento: '2024-01-13 10:00' },
    ];

    for (const event of events) {
      await EventLogService.processDropiData(event, 'excel_dropi');
    }

    // Audit: Get all events for guide
    const auditEvents = EventLogService.getEventsForGuide('GUIA123456');
    expect(auditEvents.length).toBe(4);

    // Audit: Verify timeline order
    expect(auditEvents[0].canonicalStatus).toBe(CanonicalStatus.PROCESSING);
    expect(auditEvents[3].canonicalStatus).toBe(CanonicalStatus.DELIVERED);

    // Audit: Check for out-of-order events
    const outOfOrderEvents = auditEvents.filter(e => e.isOutOfOrder);
    expect(outOfOrderEvents.length).toBe(0);

    // Audit: Check final state
    const state = EventLogService.getGuideState('GUIA123456');
    expect(state?.currentStatus).toBe(CanonicalStatus.DELIVERED);
    expect(state?.eventCount).toBe(4);
  });
});
