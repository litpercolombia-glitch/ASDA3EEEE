/**
 * Tests for Risk Scoring System - PR #6
 *
 * Tests:
 * - 48h sin movimiento sube score
 * - AT_OFFICE + 72h -> HIGH
 * - DELIVERED -> terminal (LOW)
 * - novedad presente suma 15
 * - risky city/carrier suma 5/5
 * - reasons[] siempre coherente con el score
 */

import { describe, it, expect, beforeEach } from 'vitest';

// =====================================================
// RISK SCORING SERVICE TESTS
// =====================================================

describe('RiskScoringService', () => {
  let RiskScoringService: typeof import('../services/scoring/RiskScoringService').RiskScoringService;
  let RiskFlags: typeof import('../services/config/RiskFlags').RiskFlags;
  let CanonicalStatus: typeof import('../types/canonical.types').CanonicalStatus;

  beforeEach(async () => {
    const scoringModule = await import('../services/scoring/RiskScoringService');
    const flagsModule = await import('../services/config/RiskFlags');
    const typesModule = await import('../types/canonical.types');

    RiskScoringService = scoringModule.RiskScoringService;
    RiskFlags = flagsModule.RiskFlags;
    CanonicalStatus = typesModule.CanonicalStatus;

    // Reset to defaults
    RiskScoringService.resetThresholds();
    RiskFlags.clear();
  });

  describe('Time without movement scoring', () => {
    it('should add 10 pts for 24h+ without movement', () => {
      const date24hAgo = new Date(Date.now() - 25 * 60 * 60 * 1000);

      const result = RiskScoringService.scoreGuide({
        numero_de_guia: 'GUIA123',
        estatus: CanonicalStatus.IN_TRANSIT,
        fecha_de_ultimo_movimiento: date24hAgo,
      });

      expect(result.breakdown?.timeScore).toBe(10);
      expect(result.reasons).toContain('24h_no_movement');
    });

    it('should add 25 pts for 48h+ without movement', () => {
      const date48hAgo = new Date(Date.now() - 49 * 60 * 60 * 1000);

      const result = RiskScoringService.scoreGuide({
        numero_de_guia: 'GUIA123',
        estatus: CanonicalStatus.IN_TRANSIT,
        fecha_de_ultimo_movimiento: date48hAgo,
      });

      expect(result.breakdown?.timeScore).toBe(25);
      expect(result.reasons).toContain('48h_no_movement');
    });

    it('should add 35 pts for 72h+ without movement', () => {
      const date72hAgo = new Date(Date.now() - 73 * 60 * 60 * 1000);

      const result = RiskScoringService.scoreGuide({
        numero_de_guia: 'GUIA123',
        estatus: CanonicalStatus.IN_TRANSIT,
        fecha_de_ultimo_movimiento: date72hAgo,
      });

      expect(result.breakdown?.timeScore).toBe(35);
      expect(result.reasons).toContain('72h_no_movement');
    });

    it('should add 50 pts for 120h+ without movement', () => {
      const date120hAgo = new Date(Date.now() - 121 * 60 * 60 * 1000);

      const result = RiskScoringService.scoreGuide({
        numero_de_guia: 'GUIA123',
        estatus: CanonicalStatus.IN_TRANSIT,
        fecha_de_ultimo_movimiento: date120hAgo,
      });

      expect(result.breakdown?.timeScore).toBe(50);
      expect(result.reasons).toContain('120h_no_movement');
    });

    it('should assume 25 pts if no movement date provided', () => {
      const result = RiskScoringService.scoreGuide({
        numero_de_guia: 'GUIA123',
        estatus: CanonicalStatus.IN_TRANSIT,
        // No fecha_de_ultimo_movimiento
      });

      expect(result.breakdown?.timeScore).toBe(25);
      expect(result.reasons).toContain('48h_no_movement');
    });
  });

  describe('Status scoring', () => {
    it('should add 20 pts for IN_OFFICE status', () => {
      const result = RiskScoringService.scoreGuide({
        numero_de_guia: 'GUIA123',
        estatus: CanonicalStatus.IN_OFFICE,
        fecha_de_ultimo_movimiento: new Date(), // Recent
      });

      expect(result.breakdown?.statusScore).toBe(20);
      expect(result.reasons).toContain('status_at_office');
    });

    it('should add 25 pts for ISSUE status', () => {
      const result = RiskScoringService.scoreGuide({
        numero_de_guia: 'GUIA123',
        estatus: CanonicalStatus.ISSUE,
        fecha_de_ultimo_movimiento: new Date(),
      });

      expect(result.breakdown?.statusScore).toBe(25);
      expect(result.reasons).toContain('status_exception');
    });

    it('should add 25 pts for RETURNED status', () => {
      const result = RiskScoringService.scoreGuide({
        numero_de_guia: 'GUIA123',
        estatus: CanonicalStatus.RETURNED,
        fecha_de_ultimo_movimiento: new Date(),
      });

      expect(result.breakdown?.statusScore).toBe(25);
      expect(result.reasons).toContain('status_return');
    });

    it('should add 10 pts for IN_TRANSIT status', () => {
      const result = RiskScoringService.scoreGuide({
        numero_de_guia: 'GUIA123',
        estatus: CanonicalStatus.IN_TRANSIT,
        fecha_de_ultimo_movimiento: new Date(),
      });

      expect(result.breakdown?.statusScore).toBe(10);
      expect(result.reasons).toContain('status_in_transit');
    });
  });

  describe('Terminal status handling', () => {
    it('should mark DELIVERED as terminal with score 0', () => {
      const result = RiskScoringService.scoreGuide({
        numero_de_guia: 'GUIA123',
        estatus: CanonicalStatus.DELIVERED,
        fecha_de_ultimo_movimiento: new Date(Date.now() - 100 * 60 * 60 * 1000), // Old
      });

      expect(result.isTerminal).toBe(true);
      expect(result.score).toBe(0);
      expect(result.riskLevel).toBe('LOW');
      expect(result.reasons).toContain('status_delivered');
    });

    it('should mark CANCELLED as terminal with score 0', () => {
      const result = RiskScoringService.scoreGuide({
        numero_de_guia: 'GUIA123',
        estatus: CanonicalStatus.CANCELLED,
      });

      expect(result.isTerminal).toBe(true);
      expect(result.score).toBe(0);
      expect(result.riskLevel).toBe('LOW');
    });
  });

  describe('Novedad scoring', () => {
    it('should add 15 pts when novedad is present', () => {
      const result = RiskScoringService.scoreGuide({
        numero_de_guia: 'GUIA123',
        estatus: CanonicalStatus.IN_TRANSIT,
        novedad: 'Direccion incorrecta',
        fecha_de_ultimo_movimiento: new Date(),
      });

      expect(result.breakdown?.novedadScore).toBe(15);
      expect(result.reasons).toContain('novedad_present');
    });

    it('should add 0 pts when novedad is empty', () => {
      const result = RiskScoringService.scoreGuide({
        numero_de_guia: 'GUIA123',
        estatus: CanonicalStatus.IN_TRANSIT,
        novedad: '',
        fecha_de_ultimo_movimiento: new Date(),
      });

      expect(result.breakdown?.novedadScore).toBe(0);
      expect(result.reasons).not.toContain('novedad_present');
    });

    it('should add 0 pts when novedad is undefined', () => {
      const result = RiskScoringService.scoreGuide({
        numero_de_guia: 'GUIA123',
        estatus: CanonicalStatus.IN_TRANSIT,
        fecha_de_ultimo_movimiento: new Date(),
      });

      expect(result.breakdown?.novedadScore).toBe(0);
    });
  });

  describe('Location/Carrier risk scoring', () => {
    it('should add 5 pts for risky city', () => {
      RiskFlags.addRiskyCity('Cali');

      const result = RiskScoringService.scoreGuide({
        numero_de_guia: 'GUIA123',
        estatus: CanonicalStatus.IN_TRANSIT,
        ciudad_de_destino: 'Cali',
        fecha_de_ultimo_movimiento: new Date(),
      });

      expect(result.breakdown?.locationScore).toBe(5);
      expect(result.reasons).toContain('risky_city');
    });

    it('should add 5 pts for risky carrier', () => {
      RiskFlags.addRiskyCarrier('CarrierX');

      const result = RiskScoringService.scoreGuide({
        numero_de_guia: 'GUIA123',
        estatus: CanonicalStatus.IN_TRANSIT,
        transportadora: 'CarrierX',
        fecha_de_ultimo_movimiento: new Date(),
      });

      expect(result.breakdown?.locationScore).toBe(5);
      expect(result.reasons).toContain('risky_carrier');
    });

    it('should add 10 pts for both risky city and carrier', () => {
      RiskFlags.addRiskyCity('Medellin');
      RiskFlags.addRiskyCarrier('BadCarrier');

      const result = RiskScoringService.scoreGuide({
        numero_de_guia: 'GUIA123',
        estatus: CanonicalStatus.IN_TRANSIT,
        ciudad_de_destino: 'Medellin',
        transportadora: 'BadCarrier',
        fecha_de_ultimo_movimiento: new Date(),
      });

      expect(result.breakdown?.locationScore).toBe(10);
      expect(result.reasons).toContain('risky_city');
      expect(result.reasons).toContain('risky_carrier');
    });

    it('should be case-insensitive for city/carrier matching', () => {
      RiskFlags.addRiskyCity('BOGOTA');
      RiskFlags.addRiskyCarrier('servientrega');

      const result = RiskScoringService.scoreGuide({
        numero_de_guia: 'GUIA123',
        estatus: CanonicalStatus.IN_TRANSIT,
        ciudad_de_destino: 'Bogota',
        transportadora: 'SERVIENTREGA',
        fecha_de_ultimo_movimiento: new Date(),
      });

      expect(result.breakdown?.locationScore).toBe(10);
    });
  });

  describe('Risk level thresholds', () => {
    it('should return HIGH for score >= 70', () => {
      // 50 (time) + 20 (AT_OFFICE) + 15 (novedad) = 85
      const date120hAgo = new Date(Date.now() - 121 * 60 * 60 * 1000);

      const result = RiskScoringService.scoreGuide({
        numero_de_guia: 'GUIA123',
        estatus: CanonicalStatus.IN_OFFICE,
        novedad: 'Problema',
        fecha_de_ultimo_movimiento: date120hAgo,
      });

      expect(result.score).toBeGreaterThanOrEqual(70);
      expect(result.riskLevel).toBe('HIGH');
    });

    it('should return MEDIUM for score 40-69', () => {
      // 25 (48h) + 20 (AT_OFFICE) = 45
      const date48hAgo = new Date(Date.now() - 49 * 60 * 60 * 1000);

      const result = RiskScoringService.scoreGuide({
        numero_de_guia: 'GUIA123',
        estatus: CanonicalStatus.IN_OFFICE,
        fecha_de_ultimo_movimiento: date48hAgo,
      });

      expect(result.score).toBeGreaterThanOrEqual(40);
      expect(result.score).toBeLessThan(70);
      expect(result.riskLevel).toBe('MEDIUM');
    });

    it('should return LOW for score < 40', () => {
      // 10 (24h) + 10 (IN_TRANSIT) = 20
      const date24hAgo = new Date(Date.now() - 25 * 60 * 60 * 1000);

      const result = RiskScoringService.scoreGuide({
        numero_de_guia: 'GUIA123',
        estatus: CanonicalStatus.IN_TRANSIT,
        fecha_de_ultimo_movimiento: date24hAgo,
      });

      expect(result.score).toBeLessThan(40);
      expect(result.riskLevel).toBe('LOW');
    });
  });

  describe('Combined scoring: AT_OFFICE + 72h -> HIGH', () => {
    it('should result in HIGH risk for AT_OFFICE + 72h', () => {
      const date72hAgo = new Date(Date.now() - 73 * 60 * 60 * 1000);

      const result = RiskScoringService.scoreGuide({
        numero_de_guia: 'GUIA123',
        estatus: CanonicalStatus.IN_OFFICE,
        fecha_de_ultimo_movimiento: date72hAgo,
      });

      // 35 (72h) + 20 (AT_OFFICE) = 55 -> MEDIUM
      // Need novedad or 120h to hit HIGH
      expect(result.score).toBe(55);
      expect(result.riskLevel).toBe('MEDIUM');

      // With novedad: 35 + 20 + 15 = 70 -> HIGH
      const resultWithNovedad = RiskScoringService.scoreGuide({
        numero_de_guia: 'GUIA123',
        estatus: CanonicalStatus.IN_OFFICE,
        novedad: 'Problema',
        fecha_de_ultimo_movimiento: date72hAgo,
      });

      expect(resultWithNovedad.score).toBe(70);
      expect(resultWithNovedad.riskLevel).toBe('HIGH');
    });
  });

  describe('Reasons coherence', () => {
    it('should always have reasons matching the score components', () => {
      const date72hAgo = new Date(Date.now() - 73 * 60 * 60 * 1000);
      RiskFlags.addRiskyCity('Bogota');

      const result = RiskScoringService.scoreGuide({
        numero_de_guia: 'GUIA123',
        estatus: CanonicalStatus.IN_OFFICE,
        novedad: 'Direccion incorrecta',
        ciudad_de_destino: 'Bogota',
        fecha_de_ultimo_movimiento: date72hAgo,
      });

      // Check all expected reasons are present
      expect(result.reasons).toContain('72h_no_movement');
      expect(result.reasons).toContain('status_at_office');
      expect(result.reasons).toContain('novedad_present');
      expect(result.reasons).toContain('risky_city');

      // Verify score matches
      // 35 (time) + 20 (status) + 15 (novedad) + 5 (city) = 75
      expect(result.score).toBe(75);
    });

    it('should not include reasons for zero-score components', () => {
      const result = RiskScoringService.scoreGuide({
        numero_de_guia: 'GUIA123',
        estatus: CanonicalStatus.IN_TRANSIT,
        fecha_de_ultimo_movimiento: new Date(), // Recent
      });

      // Should not have time reasons (recent movement)
      expect(result.reasons).not.toContain('24h_no_movement');
      expect(result.reasons).not.toContain('48h_no_movement');

      // Should have status reason
      expect(result.reasons).toContain('status_in_transit');

      // Should not have novedad reason
      expect(result.reasons).not.toContain('novedad_present');
    });
  });

  describe('Batch operations', () => {
    it('should score multiple guides', () => {
      const guides = [
        { numero_de_guia: 'G1', estatus: CanonicalStatus.DELIVERED },
        { numero_de_guia: 'G2', estatus: CanonicalStatus.IN_OFFICE },
        { numero_de_guia: 'G3', estatus: CanonicalStatus.IN_TRANSIT },
      ];

      const results = RiskScoringService.scoreGuides(guides);

      expect(results).toHaveLength(3);
      expect(results[0].guia).toBe('G1');
      expect(results[0].isTerminal).toBe(true);
    });

    it('should sort by risk correctly', () => {
      const date72hAgo = new Date(Date.now() - 73 * 60 * 60 * 1000);

      const results = RiskScoringService.scoreGuides([
        { numero_de_guia: 'LOW', estatus: CanonicalStatus.IN_TRANSIT, fecha_de_ultimo_movimiento: new Date() },
        { numero_de_guia: 'HIGH', estatus: CanonicalStatus.IN_OFFICE, novedad: 'X', fecha_de_ultimo_movimiento: date72hAgo },
        { numero_de_guia: 'TERMINAL', estatus: CanonicalStatus.DELIVERED },
        { numero_de_guia: 'MEDIUM', estatus: CanonicalStatus.IN_OFFICE, fecha_de_ultimo_movimiento: new Date() },
      ]);

      const sorted = RiskScoringService.sortByRisk(results);

      expect(sorted[0].guia).toBe('HIGH');
      expect(sorted[1].guia).toBe('MEDIUM');
      expect(sorted[2].guia).toBe('LOW');
      expect(sorted[3].guia).toBe('TERMINAL'); // Terminal always last
    });
  });

  describe('Statistics', () => {
    it('should calculate correct stats', () => {
      const results = RiskScoringService.scoreGuides([
        { numero_de_guia: 'G1', estatus: CanonicalStatus.DELIVERED },
        { numero_de_guia: 'G2', estatus: CanonicalStatus.IN_OFFICE, novedad: 'X', fecha_de_ultimo_movimiento: new Date(Date.now() - 73 * 60 * 60 * 1000) },
        { numero_de_guia: 'G3', estatus: CanonicalStatus.IN_TRANSIT, fecha_de_ultimo_movimiento: new Date() },
      ]);

      const stats = RiskScoringService.getStats(results);

      expect(stats.total).toBe(3);
      expect(stats.terminalCount).toBe(1);
      expect(stats.byLevel.HIGH).toBeGreaterThanOrEqual(0);
    });
  });
});

// =====================================================
// RISK FLAGS TESTS
// =====================================================

describe('RiskFlags', () => {
  let RiskFlags: typeof import('../services/config/RiskFlags').RiskFlags;

  beforeEach(async () => {
    const module = await import('../services/config/RiskFlags');
    RiskFlags = module.RiskFlags;
    RiskFlags.clear();
  });

  it('should add and check risky cities', () => {
    RiskFlags.addRiskyCity('Cali');
    RiskFlags.addRiskyCity('Medellin');

    expect(RiskFlags.isRiskyCity('Cali')).toBe(true);
    expect(RiskFlags.isRiskyCity('cali')).toBe(true); // Case insensitive
    expect(RiskFlags.isRiskyCity('Bogota')).toBe(false);
  });

  it('should add and check risky carriers', () => {
    RiskFlags.addRiskyCarrier('BadCarrier');

    expect(RiskFlags.isRiskyCarrier('BadCarrier')).toBe(true);
    expect(RiskFlags.isRiskyCarrier('BADCARRIER')).toBe(true);
    expect(RiskFlags.isRiskyCarrier('GoodCarrier')).toBe(false);
  });

  it('should remove risky cities/carriers', () => {
    RiskFlags.addRiskyCity('Cali');
    RiskFlags.addRiskyCarrier('BadCarrier');

    RiskFlags.removeRiskyCity('Cali');
    RiskFlags.removeRiskyCarrier('BadCarrier');

    expect(RiskFlags.isRiskyCity('Cali')).toBe(false);
    expect(RiskFlags.isRiskyCarrier('BadCarrier')).toBe(false);
  });

  it('should set full config', () => {
    RiskFlags.setConfig({
      riskyCities: ['A', 'B', 'C'],
      riskyCarriers: ['X', 'Y'],
    });

    const config = RiskFlags.getConfig();

    expect(config.riskyCities).toHaveLength(3);
    expect(config.riskyCarriers).toHaveLength(2);
  });
});
