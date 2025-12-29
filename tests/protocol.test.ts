/**
 * ProtocolEngine Tests - PR #3
 *
 * Tests obligatorios:
 * - Dispara protocolo correcto con datos reales
 * - NO dispara si guía ya está DELIVERED
 * - NO dispara si evento es out-of-order
 * - NO duplica ActionPlan el mismo día
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ProtocolEngine } from '../services/protocol/ProtocolEngine';
import { NoMovement48HProtocol } from '../services/protocol/protocols/NoMovement48H';
import { AtOffice3DProtocol } from '../services/protocol/protocols/AtOffice3D';
import { EventLogService } from '../services/eventLog/EventLogService';
import { ActionLogService } from '../services/eventLog/ActionLogService';
import { CanonicalStatus } from '../types/canonical.types';
import { DropiRawData } from '../types/eventLog.types';
import { buildActionPlanKey } from '../types/protocol.types';

// =====================================================
// TEST DATA
// =====================================================

/**
 * Create test data with specific date
 */
function createTestRow(overrides: Partial<DropiRawData> = {}): DropiRawData {
  return {
    fecha: '2024-01-15',
    telefono: '3001234567',
    numero_de_guia: 'GUIA' + Math.random().toString(36).substr(2, 6).toUpperCase(),
    estatus: 'EN TRANSITO',
    ciudad_de_destino: 'Bogotá',
    transportadora: 'Coordinadora',
    novedad: '',
    fecha_de_ultimo_movimiento: '2024-01-10 10:00',
    ultimo_movimiento: 'En tránsito hacia destino',
    fecha_de_generacion_de_guia: '2024-01-08',
    ...overrides,
  };
}

/**
 * Current time for tests (fixed for determinism)
 */
const NOW = new Date('2024-01-15T12:00:00Z');

/**
 * 3 days ago
 */
const THREE_DAYS_AGO = new Date('2024-01-12T12:00:00Z');

/**
 * 4 days ago
 */
const FOUR_DAYS_AGO = new Date('2024-01-11T12:00:00Z');

// =====================================================
// PROTOCOL UNIT TESTS
// =====================================================

describe('NoMovement48HProtocol', () => {
  describe('evaluate()', () => {
    it('should trigger for guide with no movement for 48+ hours', () => {
      const input = {
        guia: 'GUIA123',
        canonicalStatus: CanonicalStatus.IN_TRANSIT,
        novedad: null,
        ciudad_de_destino: 'Bogotá',
        transportadora: 'Coordinadora',
        fecha_de_ultimo_movimiento: THREE_DAYS_AGO, // 3 days ago
        ultimo_movimiento: 'En tránsito',
        fecha_de_generacion_de_guia: FOUR_DAYS_AGO,
        lastEventId: 'evt_123',
      };

      const result = NoMovement48HProtocol.evaluate(input, NOW);
      expect(result).toBe(true);
    });

    it('should NOT trigger for DELIVERED guide', () => {
      const input = {
        guia: 'GUIA123',
        canonicalStatus: CanonicalStatus.DELIVERED,
        novedad: null,
        ciudad_de_destino: 'Bogotá',
        transportadora: 'Coordinadora',
        fecha_de_ultimo_movimiento: THREE_DAYS_AGO,
        ultimo_movimiento: 'Entregado',
        fecha_de_generacion_de_guia: FOUR_DAYS_AGO,
        lastEventId: 'evt_123',
      };

      const result = NoMovement48HProtocol.evaluate(input, NOW);
      expect(result).toBe(false);
    });

    it('should NOT trigger if movement was less than 48 hours ago', () => {
      const recentMovement = new Date('2024-01-14T12:00:00Z'); // 24 hours ago

      const input = {
        guia: 'GUIA123',
        canonicalStatus: CanonicalStatus.IN_TRANSIT,
        novedad: null,
        ciudad_de_destino: 'Bogotá',
        transportadora: 'Coordinadora',
        fecha_de_ultimo_movimiento: recentMovement,
        ultimo_movimiento: 'En tránsito',
        fecha_de_generacion_de_guia: FOUR_DAYS_AGO,
        lastEventId: 'evt_123',
      };

      const result = NoMovement48HProtocol.evaluate(input, NOW);
      expect(result).toBe(false);
    });

    it('should NOT trigger if novelty is resolved', () => {
      const input = {
        guia: 'GUIA123',
        canonicalStatus: CanonicalStatus.IN_TRANSIT,
        novedad: 'Problema solucionado, en camino',
        ciudad_de_destino: 'Bogotá',
        transportadora: 'Coordinadora',
        fecha_de_ultimo_movimiento: THREE_DAYS_AGO,
        ultimo_movimiento: 'En tránsito',
        fecha_de_generacion_de_guia: FOUR_DAYS_AGO,
        lastEventId: 'evt_123',
      };

      const result = NoMovement48HProtocol.evaluate(input, NOW);
      expect(result).toBe(false);
    });
  });

  describe('generateActions()', () => {
    it('should generate SEND_WHATSAPP action with media priority', () => {
      const input = {
        guia: 'GUIA123',
        canonicalStatus: CanonicalStatus.IN_TRANSIT,
        novedad: null,
        ciudad_de_destino: 'Medellín',
        transportadora: 'TCC',
        fecha_de_ultimo_movimiento: THREE_DAYS_AGO,
        ultimo_movimiento: 'En tránsito',
        fecha_de_generacion_de_guia: FOUR_DAYS_AGO,
        lastEventId: 'evt_123',
      };

      const actions = NoMovement48HProtocol.generateActions(input);

      expect(actions.length).toBe(1);
      expect(actions[0].type).toBe('SEND_WHATSAPP');
      expect(actions[0].reason).toBe('sin_movimiento');
      expect(actions[0].priority).toBe('media');
      expect(actions[0].metadata?.city).toBe('Medellín');
      expect(actions[0].metadata?.carrier).toBe('TCC');
    });
  });
});

describe('AtOffice3DProtocol', () => {
  describe('evaluate()', () => {
    it('should trigger for AT_OFFICE guide with 72+ hours', () => {
      const input = {
        guia: 'GUIA456',
        canonicalStatus: CanonicalStatus.AT_OFFICE,
        novedad: null,
        ciudad_de_destino: 'Cali',
        transportadora: 'Interrapidísimo',
        fecha_de_ultimo_movimiento: FOUR_DAYS_AGO, // 4 days ago
        ultimo_movimiento: 'Disponible en oficina',
        fecha_de_generacion_de_guia: null,
        lastEventId: 'evt_456',
      };

      const result = AtOffice3DProtocol.evaluate(input, NOW);
      expect(result).toBe(true);
    });

    it('should NOT trigger for non-AT_OFFICE status', () => {
      const input = {
        guia: 'GUIA456',
        canonicalStatus: CanonicalStatus.IN_TRANSIT,
        novedad: null,
        ciudad_de_destino: 'Cali',
        transportadora: 'Interrapidísimo',
        fecha_de_ultimo_movimiento: FOUR_DAYS_AGO,
        ultimo_movimiento: 'En tránsito',
        fecha_de_generacion_de_guia: null,
        lastEventId: 'evt_456',
      };

      const result = AtOffice3DProtocol.evaluate(input, NOW);
      expect(result).toBe(false);
    });

    it('should NOT trigger if less than 72 hours at office', () => {
      const recentOffice = new Date('2024-01-14T00:00:00Z'); // ~36 hours ago

      const input = {
        guia: 'GUIA456',
        canonicalStatus: CanonicalStatus.AT_OFFICE,
        novedad: null,
        ciudad_de_destino: 'Cali',
        transportadora: 'Interrapidísimo',
        fecha_de_ultimo_movimiento: recentOffice,
        ultimo_movimiento: 'Disponible en oficina',
        fecha_de_generacion_de_guia: null,
        lastEventId: 'evt_456',
      };

      const result = AtOffice3DProtocol.evaluate(input, NOW);
      expect(result).toBe(false);
    });
  });

  describe('generateActions()', () => {
    it('should generate SEND_WHATSAPP action with alta priority', () => {
      const input = {
        guia: 'GUIA456',
        canonicalStatus: CanonicalStatus.AT_OFFICE,
        novedad: 'Esperando recogida',
        ciudad_de_destino: 'Barranquilla',
        transportadora: 'Servientrega',
        fecha_de_ultimo_movimiento: FOUR_DAYS_AGO,
        ultimo_movimiento: 'Disponible en oficina',
        fecha_de_generacion_de_guia: null,
        lastEventId: 'evt_456',
      };

      const actions = AtOffice3DProtocol.generateActions(input);

      expect(actions.length).toBe(1);
      expect(actions[0].type).toBe('SEND_WHATSAPP');
      expect(actions[0].reason).toBe('en_oficina_prolongado');
      expect(actions[0].priority).toBe('alta');
      expect(actions[0].metadata?.city).toBe('Barranquilla');
      expect(actions[0].metadata?.carrier).toBe('Servientrega');
    });
  });
});

// =====================================================
// PROTOCOL ENGINE INTEGRATION TESTS
// =====================================================

describe('ProtocolEngine', () => {
  beforeEach(() => {
    EventLogService.clear();
    ActionLogService.clear();
    ProtocolEngine.clear();
  });

  describe('evaluateGuide()', () => {
    it('should trigger NO_MOVEMENT_48H for stale guide', async () => {
      // Create a guide with old movement
      const row = createTestRow({
        numero_de_guia: 'GUIA_STALE',
        estatus: 'EN TRANSITO',
        fecha_de_ultimo_movimiento: '2024-01-10 10:00', // 5 days before NOW
      });

      await EventLogService.processDropiData(row, 'excel_dropi');

      const result = ProtocolEngine.evaluateGuide('GUIA_STALE', NOW);

      expect(result.evaluated).toBe(true);
      expect(result.skipped).toBe(false);
      expect(result.matchedProtocols).toContain('NO_MOVEMENT_48H');
      expect(result.actionPlans.length).toBeGreaterThan(0);
    });

    it('should trigger AT_OFFICE_3D for guide at office 72+ hours', async () => {
      const row = createTestRow({
        numero_de_guia: 'GUIA_OFFICE',
        estatus: 'DISPONIBLE EN OFICINA',
        fecha_de_ultimo_movimiento: '2024-01-11 10:00', // 4 days before NOW
      });

      await EventLogService.processDropiData(row, 'excel_dropi');

      const result = ProtocolEngine.evaluateGuide('GUIA_OFFICE', NOW);

      expect(result.evaluated).toBe(true);
      expect(result.matchedProtocols).toContain('AT_OFFICE_3D');
    });

    it('should NOT trigger for DELIVERED guide', async () => {
      const row = createTestRow({
        numero_de_guia: 'GUIA_DELIVERED',
        estatus: 'ENTREGADO',
        fecha_de_ultimo_movimiento: '2024-01-10 10:00',
      });

      await EventLogService.processDropiData(row, 'excel_dropi');

      const result = ProtocolEngine.evaluateGuide('GUIA_DELIVERED', NOW);

      expect(result.skipped).toBe(true);
      expect(result.skipReason).toBe('DELIVERED');
      expect(result.matchedProtocols.length).toBe(0);
    });

    it('should NOT trigger if last event was out-of-order', async () => {
      // First event (newer)
      const newerRow = createTestRow({
        numero_de_guia: 'GUIA_ORDER',
        estatus: 'ENTREGADO',
        fecha_de_ultimo_movimiento: '2024-01-14 10:00',
      });
      await EventLogService.processDropiData(newerRow, 'excel_dropi');

      // Second event (older - out of order)
      const olderRow = createTestRow({
        numero_de_guia: 'GUIA_ORDER',
        estatus: 'EN TRANSITO',
        fecha_de_ultimo_movimiento: '2024-01-10 10:00',
      });
      await EventLogService.processDropiData(olderRow, 'excel_dropi');

      // The guide state should still be DELIVERED (not degraded)
      const state = EventLogService.getGuideState('GUIA_ORDER');
      expect(state?.currentStatus).toBe(CanonicalStatus.DELIVERED);

      // And should be skipped by protocol engine
      const result = ProtocolEngine.evaluateGuide('GUIA_ORDER', NOW);
      expect(result.skipped).toBe(true);
      expect(result.skipReason).toBe('DELIVERED');
    });

    it('should NOT duplicate ActionPlan on same day', async () => {
      const row = createTestRow({
        numero_de_guia: 'GUIA_DUPE',
        estatus: 'EN TRANSITO',
        fecha_de_ultimo_movimiento: '2024-01-10 10:00',
      });

      await EventLogService.processDropiData(row, 'excel_dropi');

      // First evaluation - should create action plan
      const result1 = ProtocolEngine.evaluateGuide('GUIA_DUPE', NOW);
      expect(result1.actionPlans.length).toBeGreaterThan(0);

      // Second evaluation same day - should NOT create duplicate
      const result2 = ProtocolEngine.evaluateGuide('GUIA_DUPE', NOW);
      expect(result2.actionPlans.length).toBe(0);

      // But should still match the protocol
      expect(result2.matchedProtocols).toContain('NO_MOVEMENT_48H');
    });

    it('should allow ActionPlan on different day', async () => {
      const row = createTestRow({
        numero_de_guia: 'GUIA_DAYS',
        estatus: 'EN TRANSITO',
        fecha_de_ultimo_movimiento: '2024-01-10 10:00',
      });

      await EventLogService.processDropiData(row, 'excel_dropi');

      // First day
      const day1 = new Date('2024-01-15T12:00:00Z');
      const result1 = ProtocolEngine.evaluateGuide('GUIA_DAYS', day1);
      expect(result1.actionPlans.length).toBeGreaterThan(0);

      // Next day - should create new action plan
      const day2 = new Date('2024-01-16T12:00:00Z');
      const result2 = ProtocolEngine.evaluateGuide('GUIA_DAYS', day2);
      expect(result2.actionPlans.length).toBeGreaterThan(0);
    });
  });

  describe('evaluateAllGuides()', () => {
    it('should process multiple guides', async () => {
      // Create various guides
      const guides = [
        { guia: 'G1', estatus: 'EN TRANSITO', fecha: '2024-01-10 10:00' },
        { guia: 'G2', estatus: 'DISPONIBLE EN OFICINA', fecha: '2024-01-11 10:00' },
        { guia: 'G3', estatus: 'ENTREGADO', fecha: '2024-01-14 10:00' },
        { guia: 'G4', estatus: 'EN REPARTO', fecha: '2024-01-14 18:00' }, // Recent
      ];

      for (const g of guides) {
        const row = createTestRow({
          numero_de_guia: g.guia,
          estatus: g.estatus,
          fecha_de_ultimo_movimiento: g.fecha,
        });
        await EventLogService.processDropiData(row, 'excel_dropi');
      }

      const result = ProtocolEngine.evaluateAllGuides(NOW);

      expect(result.totalGuides).toBe(4);
      expect(result.evaluated).toBeGreaterThan(0);
      expect(result.skipped).toBeGreaterThan(0); // G3 is DELIVERED
      expect(result.actionPlansCreated).toBeGreaterThan(0);
    });
  });

  describe('hasActionPlanToday()', () => {
    it('should track action plans correctly', async () => {
      const row = createTestRow({
        numero_de_guia: 'GUIA_TRACK',
        estatus: 'EN TRANSITO',
        fecha_de_ultimo_movimiento: '2024-01-10 10:00',
      });

      await EventLogService.processDropiData(row, 'excel_dropi');

      // Before evaluation
      expect(ProtocolEngine.hasActionPlanToday('GUIA_TRACK', 'NO_MOVEMENT_48H', NOW)).toBe(false);

      // After evaluation
      ProtocolEngine.evaluateGuide('GUIA_TRACK', NOW);
      expect(ProtocolEngine.hasActionPlanToday('GUIA_TRACK', 'NO_MOVEMENT_48H', NOW)).toBe(true);
    });
  });
});

// =====================================================
// IDEMPOTENCY KEY TESTS
// =====================================================

describe('buildActionPlanKey()', () => {
  it('should generate correct format', () => {
    const key = buildActionPlanKey('GUIA123', 'NO_MOVEMENT_48H', new Date('2024-01-15T12:00:00Z'));
    expect(key).toBe('action:GUIA123:NO_MOVEMENT_48H:2024-01-15');
  });

  it('should generate different keys for different days', () => {
    const key1 = buildActionPlanKey('GUIA123', 'NO_MOVEMENT_48H', new Date('2024-01-15'));
    const key2 = buildActionPlanKey('GUIA123', 'NO_MOVEMENT_48H', new Date('2024-01-16'));
    expect(key1).not.toBe(key2);
  });

  it('should generate different keys for different triggers', () => {
    const date = new Date('2024-01-15');
    const key1 = buildActionPlanKey('GUIA123', 'NO_MOVEMENT_48H', date);
    const key2 = buildActionPlanKey('GUIA123', 'AT_OFFICE_3D', date);
    expect(key1).not.toBe(key2);
  });
});

// =====================================================
// ACTIONLOG INTEGRATION TESTS
// =====================================================

describe('ActionLog Integration', () => {
  beforeEach(() => {
    EventLogService.clear();
    ActionLogService.clear();
    ProtocolEngine.clear();
  });

  it('should register ActionPlans in ActionLog', async () => {
    const row = createTestRow({
      numero_de_guia: 'GUIA_LOG',
      estatus: 'EN TRANSITO',
      fecha_de_ultimo_movimiento: '2024-01-10 10:00',
    });

    await EventLogService.processDropiData(row, 'excel_dropi');
    ProtocolEngine.evaluateGuide('GUIA_LOG', NOW);

    // Check ActionLog
    const stats = ActionLogService.getStats();
    expect(stats.total).toBeGreaterThan(0);
    expect(stats.byStatus['PLANNED']).toBeGreaterThan(0);
  });

  it('should include trigger in ActionLog metadata', async () => {
    const row = createTestRow({
      numero_de_guia: 'GUIA_META',
      estatus: 'EN TRANSITO',
      fecha_de_ultimo_movimiento: '2024-01-10 10:00',
    });

    await EventLogService.processDropiData(row, 'excel_dropi');
    ProtocolEngine.evaluateGuide('GUIA_META', NOW);

    // Get actions for this guide
    const actions = ActionLogService.getActionsForGuide('GUIA_META');
    expect(actions.length).toBeGreaterThan(0);
    expect(actions[0].metadata.trigger).toBe('NO_MOVEMENT_48H');
  });
});
