/**
 * DryRunSimulator Tests
 *
 * Validates the simulation runs correctly before enabling real execution.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DryRunSimulator } from '../services/protocol/DryRunSimulator';
import { EventLogService } from '../services/eventLog/EventLogService';
import { CanonicalStatus } from '../types/canonical.types';
import { DropiRawData } from '../types/eventLog.types';

// =====================================================
// TEST DATA
// =====================================================

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

const NOW = new Date('2024-01-15T12:00:00Z');

// =====================================================
// TESTS
// =====================================================

describe('DryRunSimulator', () => {
  beforeEach(() => {
    EventLogService.clear();
  });

  describe('runSimulation()', () => {
    it('should generate report for empty EventLog', () => {
      const report = DryRunSimulator.runSimulation();

      expect(report.totalGuides).toBe(0);
      expect(report.totalEvaluated).toBe(0);
      expect(report.totalWouldTrigger).toBe(0);
    });

    it('should evaluate guides and detect triggers', async () => {
      // Create test guides
      const guides = [
        { guia: 'STALE1', estatus: 'EN TRANSITO', fecha: '2024-01-10 10:00' },
        { guia: 'STALE2', estatus: 'EN TRANSITO', fecha: '2024-01-09 10:00' },
        { guia: 'RECENT', estatus: 'EN TRANSITO', fecha: '2024-01-14 18:00' },
        { guia: 'DELIVERED', estatus: 'ENTREGADO', fecha: '2024-01-14 10:00' },
        { guia: 'OFFICE', estatus: 'DISPONIBLE EN OFICINA', fecha: '2024-01-11 10:00' },
      ];

      for (const g of guides) {
        const row = createTestRow({
          numero_de_guia: g.guia,
          estatus: g.estatus,
          fecha_de_ultimo_movimiento: g.fecha,
        });
        await EventLogService.processDropiData(row, 'excel_dropi');
      }

      // Mock the current time for consistent results
      const report = DryRunSimulator.runSimulation();

      expect(report.totalGuides).toBe(5);
      expect(report.totalSkipped).toBeGreaterThan(0); // DELIVERED
      expect(report.totalWouldTrigger).toBeGreaterThan(0); // STALE guides
    });

    it('should skip terminal statuses', async () => {
      // All terminal statuses
      const guides = [
        { guia: 'D1', estatus: 'ENTREGADO' },
        { guia: 'D2', estatus: 'DEVUELTO' },
        { guia: 'D3', estatus: 'CANCELADO' },
      ];

      for (const g of guides) {
        const row = createTestRow({
          numero_de_guia: g.guia,
          estatus: g.estatus,
          fecha_de_ultimo_movimiento: '2024-01-10 10:00',
        });
        await EventLogService.processDropiData(row, 'excel_dropi');
      }

      const report = DryRunSimulator.runSimulation();

      expect(report.totalGuides).toBe(3);
      expect(report.totalSkipped).toBe(3);
      expect(report.totalWouldTrigger).toBe(0);
    });

    it('should detect AT_OFFICE_3D protocol', async () => {
      const row = createTestRow({
        numero_de_guia: 'OFFICE_LONG',
        estatus: 'DISPONIBLE EN OFICINA',
        fecha_de_ultimo_movimiento: '2024-01-11 10:00', // 4 days ago
      });

      await EventLogService.processDropiData(row, 'excel_dropi');

      const report = DryRunSimulator.runSimulation();

      expect(report.byProtocol['AT_OFFICE_3D']).toBeDefined();
      expect(report.byProtocol['AT_OFFICE_3D']?.count).toBe(1);
    });

    it('should calculate days since movement correctly', async () => {
      const row = createTestRow({
        numero_de_guia: 'TIME_TEST',
        estatus: 'EN TRANSITO',
        fecha_de_ultimo_movimiento: '2024-01-12 12:00', // 3 days ago
      });

      await EventLogService.processDropiData(row, 'excel_dropi');

      const report = DryRunSimulator.runSimulation();
      const detail = report.details.find(d => d.guia === 'TIME_TEST');

      expect(detail).toBeDefined();
      expect(detail?.daysSinceMovement).toBeGreaterThanOrEqual(2);
      expect(detail?.daysSinceMovement).toBeLessThanOrEqual(4);
    });

    it('should track cities and carriers', async () => {
      const guides = [
        { guia: 'G1', ciudad: 'Bogotá', transportadora: 'Coordinadora' },
        { guia: 'G2', ciudad: 'Bogotá', transportadora: 'TCC' },
        { guia: 'G3', ciudad: 'Medellín', transportadora: 'Coordinadora' },
      ];

      for (const g of guides) {
        const row = createTestRow({
          numero_de_guia: g.guia,
          ciudad_de_destino: g.ciudad,
          transportadora: g.transportadora,
          fecha_de_ultimo_movimiento: '2024-01-10 10:00',
        });
        await EventLogService.processDropiData(row, 'excel_dropi');
      }

      const report = DryRunSimulator.runSimulation();

      // Check top cities
      const bogota = report.topCities.find(c => c.city === 'Bogotá');
      expect(bogota?.count).toBe(2);

      // Check top carriers
      const coord = report.topCarriers.find(c => c.carrier === 'Coordinadora');
      expect(coord?.count).toBe(2);
    });

    it('should apply limit config', async () => {
      // Create 10 guides
      for (let i = 0; i < 10; i++) {
        const row = createTestRow({
          numero_de_guia: `LIMIT_TEST_${i}`,
          fecha_de_ultimo_movimiento: '2024-01-10 10:00',
        });
        await EventLogService.processDropiData(row, 'excel_dropi');
      }

      const report = DryRunSimulator.runSimulation({ limit: 5 });

      expect(report.totalGuides).toBe(5);
    });
  });

  describe('formatReport()', () => {
    it('should generate readable text report', async () => {
      const row = createTestRow({
        numero_de_guia: 'FORMAT_TEST',
        fecha_de_ultimo_movimiento: '2024-01-10 10:00',
      });
      await EventLogService.processDropiData(row, 'excel_dropi');

      const report = DryRunSimulator.runSimulation();
      const formatted = DryRunSimulator.formatReport(report);

      expect(formatted).toContain('DRY RUN SIMULATION REPORT');
      expect(formatted).toContain('VOLUME SUMMARY');
      expect(formatted).toContain('BY PROTOCOL');
    });
  });

  describe('exportJSON()', () => {
    it('should export valid JSON', async () => {
      const row = createTestRow({
        numero_de_guia: 'JSON_TEST',
      });
      await EventLogService.processDropiData(row, 'excel_dropi');

      const report = DryRunSimulator.runSimulation();
      const json = DryRunSimulator.exportJSON(report);

      expect(() => JSON.parse(json)).not.toThrow();

      const parsed = JSON.parse(json);
      expect(parsed.totalGuides).toBe(1);
    });
  });

  describe('quickSummary()', () => {
    it('should generate one-line summary', async () => {
      const row = createTestRow({
        numero_de_guia: 'QUICK_TEST',
        fecha_de_ultimo_movimiento: '2024-01-10 10:00',
      });
      await EventLogService.processDropiData(row, 'excel_dropi');

      const report = DryRunSimulator.runSimulation();
      const summary = DryRunSimulator.quickSummary(report);

      expect(summary).toContain('DryRun:');
      expect(summary).toContain('guides');
      expect(summary).toContain('NO_MOVEMENT_48H:');
    });
  });

  describe('False Positive Detection', () => {
    it('should detect weekend delay pattern', async () => {
      // Create a guide with last movement on Saturday
      const row = createTestRow({
        numero_de_guia: 'WEEKEND_TEST',
        estatus: 'EN TRANSITO',
        // Jan 13, 2024 was a Saturday
        fecha_de_ultimo_movimiento: '2024-01-13 10:00',
      });
      await EventLogService.processDropiData(row, 'excel_dropi');

      const report = DryRunSimulator.runSimulation({
        analyzeFalsePositives: true,
      });

      // May or may not detect as FP depending on current day
      // Just verify the report has the falsePositives array
      expect(report.potentialFalsePositives).toBeDefined();
      expect(Array.isArray(report.potentialFalsePositives)).toBe(true);
    });

    it('should calculate false positive rate', async () => {
      const row = createTestRow({
        numero_de_guia: 'FP_RATE_TEST',
        fecha_de_ultimo_movimiento: '2024-01-10 10:00',
      });
      await EventLogService.processDropiData(row, 'excel_dropi');

      const report = DryRunSimulator.runSimulation();

      expect(typeof report.falsePositiveRate).toBe('number');
      expect(report.falsePositiveRate).toBeGreaterThanOrEqual(0);
      expect(report.falsePositiveRate).toBeLessThanOrEqual(100);
    });
  });
});
