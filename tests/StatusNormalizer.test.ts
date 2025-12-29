/**
 * Tests for StatusNormalizer
 *
 * Tests real carrier mappings for Colombian carriers:
 * - Coordinadora
 * - Interrapidísimo (Inter)
 * - Envía
 * - TCC
 * - Servientrega
 *
 * PR#1 Spec Coverage:
 * - canonicalStatus (status)
 * - exceptionReason? (reason)
 * - rawStatus (texto original)
 * - source (dropi / carrier / excel / manual)
 * - lastEventAt (timestamp evento)
 */

import { describe, it, expect } from 'vitest';
import { StatusNormalizer, detectCarrier } from '../services/StatusNormalizer';
import {
  CanonicalStatus,
  ExceptionReason,
  NormalizedStatus,
  DataSource,
} from '../types/canonical.types';

describe('StatusNormalizer', () => {
  describe('normalize() returns correct structure (PR#1 spec)', () => {
    it('should return status, reason, rawStatus, source, and lastEventAt', () => {
      const result = StatusNormalizer.normalize('ENTREGADO', 'COORDINADORA');

      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('reason');
      expect(result).toHaveProperty('rawStatus');
      expect(result).toHaveProperty('source');
      expect(result).toHaveProperty('lastEventAt');
      expect(result.lastEventAt).toBeInstanceOf(Date);
    });

    it('should preserve the original rawStatus', () => {
      const rawStatus = 'En Tránsito - Centro Bogotá';
      const result = StatusNormalizer.normalize(rawStatus, 'COORDINADORA');

      expect(result.rawStatus).toBe(rawStatus);
    });

    it('should default source to carrier', () => {
      const result = StatusNormalizer.normalize('ENTREGADO', 'COORDINADORA');
      expect(result.source).toBe('carrier');
    });

    it('should use provided source', () => {
      const result = StatusNormalizer.normalize('ENTREGADO', 'COORDINADORA', {
        source: 'dropi',
      });
      expect(result.source).toBe('dropi');
    });

    it('should support all source types', () => {
      const sources: DataSource[] = ['dropi', 'carrier', 'excel', 'manual', 'webhook', 'system'];

      sources.forEach((source) => {
        const result = StatusNormalizer.normalize('ENTREGADO', 'COORDINADORA', { source });
        expect(result.source).toBe(source);
      });
    });

    it('should use provided lastEventAt', () => {
      const lastEventAt = new Date('2024-01-15T10:30:00Z');
      const result = StatusNormalizer.normalize('ENTREGADO', 'COORDINADORA', { lastEventAt });

      expect(result.lastEventAt).toEqual(lastEventAt);
    });

    it('should parse string lastEventAt', () => {
      const lastEventAtStr = '2024-01-15T10:30:00Z';
      const result = StatusNormalizer.normalize('ENTREGADO', 'COORDINADORA', {
        lastEventAt: lastEventAtStr,
      });

      expect(result.lastEventAt).toEqual(new Date(lastEventAtStr));
    });
  });

  describe('COORDINADORA status mappings', () => {
    describe('successful flow statuses', () => {
      it('should map ADMITIDO to CREATED', () => {
        const result = StatusNormalizer.normalize('ADMITIDO', 'COORDINADORA');
        expect(result.status).toBe(CanonicalStatus.CREATED);
        expect(result.reason).toBe(ExceptionReason.NONE);
      });

      it('should map RECOGIDO to PROCESSING', () => {
        const result = StatusNormalizer.normalize('RECOGIDO', 'COORDINADORA');
        expect(result.status).toBe(CanonicalStatus.PROCESSING);
      });

      it('should map EN ALISTAMIENTO to PROCESSING', () => {
        const result = StatusNormalizer.normalize('EN ALISTAMIENTO', 'COORDINADORA');
        expect(result.status).toBe(CanonicalStatus.PROCESSING);
      });

      it('should map DESPACHADO to SHIPPED', () => {
        const result = StatusNormalizer.normalize('DESPACHADO', 'COORDINADORA');
        expect(result.status).toBe(CanonicalStatus.SHIPPED);
      });

      it('should map EN TRANSITO to IN_TRANSIT', () => {
        const result = StatusNormalizer.normalize('EN TRANSITO', 'COORDINADORA');
        expect(result.status).toBe(CanonicalStatus.IN_TRANSIT);
      });

      it('should map EN TRÁNSITO (with accent) to IN_TRANSIT', () => {
        const result = StatusNormalizer.normalize('EN TRÁNSITO', 'COORDINADORA');
        expect(result.status).toBe(CanonicalStatus.IN_TRANSIT);
      });

      it('should map LLEGADA A CENTRO to IN_TRANSIT', () => {
        const result = StatusNormalizer.normalize('LLEGADA A CENTRO', 'COORDINADORA');
        expect(result.status).toBe(CanonicalStatus.IN_TRANSIT);
      });

      it('should map EN REPARTO to OUT_FOR_DELIVERY', () => {
        const result = StatusNormalizer.normalize('EN REPARTO', 'COORDINADORA');
        expect(result.status).toBe(CanonicalStatus.OUT_FOR_DELIVERY);
      });

      it('should map EN RUTA to OUT_FOR_DELIVERY', () => {
        const result = StatusNormalizer.normalize('EN RUTA', 'COORDINADORA');
        expect(result.status).toBe(CanonicalStatus.OUT_FOR_DELIVERY);
      });

      it('should map ASIGNADO A MENSAJERO to OUT_FOR_DELIVERY', () => {
        const result = StatusNormalizer.normalize('ASIGNADO A MENSAJERO', 'COORDINADORA');
        expect(result.status).toBe(CanonicalStatus.OUT_FOR_DELIVERY);
      });

      it('should map EN OFICINA to IN_OFFICE', () => {
        const result = StatusNormalizer.normalize('EN OFICINA', 'COORDINADORA');
        expect(result.status).toBe(CanonicalStatus.IN_OFFICE);
      });

      it('should map ENTREGADO to DELIVERED', () => {
        const result = StatusNormalizer.normalize('ENTREGADO', 'COORDINADORA');
        expect(result.status).toBe(CanonicalStatus.DELIVERED);
        expect(result.reason).toBe(ExceptionReason.NONE);
      });

      it('should map CUMPLIDO to DELIVERED', () => {
        const result = StatusNormalizer.normalize('CUMPLIDO', 'COORDINADORA');
        expect(result.status).toBe(CanonicalStatus.DELIVERED);
      });
    });

    describe('issue statuses with reasons', () => {
      it('should map DIRECCIÓN INCORRECTA to ISSUE with BAD_ADDRESS', () => {
        const result = StatusNormalizer.normalize('DIRECCIÓN INCORRECTA', 'COORDINADORA');
        expect(result.status).toBe(CanonicalStatus.ISSUE);
        expect(result.reason).toBe(ExceptionReason.BAD_ADDRESS);
      });

      it('should map DIRECCION NO EXISTE to ISSUE with BAD_ADDRESS', () => {
        const result = StatusNormalizer.normalize('DIRECCION NO EXISTE', 'COORDINADORA');
        expect(result.status).toBe(CanonicalStatus.ISSUE);
        expect(result.reason).toBe(ExceptionReason.BAD_ADDRESS);
      });

      it('should map DESTINATARIO AUSENTE to ISSUE with RECIPIENT_UNAVAILABLE', () => {
        const result = StatusNormalizer.normalize('DESTINATARIO AUSENTE', 'COORDINADORA');
        expect(result.status).toBe(CanonicalStatus.ISSUE);
        expect(result.reason).toBe(ExceptionReason.RECIPIENT_UNAVAILABLE);
      });

      it('should map NO HAY QUIEN RECIBA to ISSUE with RECIPIENT_UNAVAILABLE', () => {
        const result = StatusNormalizer.normalize('NO HAY QUIEN RECIBA', 'COORDINADORA');
        expect(result.status).toBe(CanonicalStatus.ISSUE);
        expect(result.reason).toBe(ExceptionReason.RECIPIENT_UNAVAILABLE);
      });

      it('should map CERRADO to ISSUE with RECIPIENT_UNAVAILABLE', () => {
        const result = StatusNormalizer.normalize('CERRADO', 'COORDINADORA');
        expect(result.status).toBe(CanonicalStatus.ISSUE);
        expect(result.reason).toBe(ExceptionReason.RECIPIENT_UNAVAILABLE);
      });

      it('should map RECHAZADO to ISSUE with REJECTED', () => {
        const result = StatusNormalizer.normalize('RECHAZADO', 'COORDINADORA');
        expect(result.status).toBe(CanonicalStatus.ISSUE);
        expect(result.reason).toBe(ExceptionReason.REJECTED);
      });

      it('should map TELÉFONO INCORRECTO to ISSUE with BAD_PHONE', () => {
        const result = StatusNormalizer.normalize('TELÉFONO INCORRECTO', 'COORDINADORA');
        expect(result.status).toBe(CanonicalStatus.ISSUE);
        expect(result.reason).toBe(ExceptionReason.BAD_PHONE);
      });

      it('should map NO CONTESTA to ISSUE with BAD_PHONE', () => {
        const result = StatusNormalizer.normalize('NO CONTESTA', 'COORDINADORA');
        expect(result.status).toBe(CanonicalStatus.ISSUE);
        expect(result.reason).toBe(ExceptionReason.BAD_PHONE);
      });

      it('should map SIN DINERO to ISSUE with COD_ISSUE', () => {
        const result = StatusNormalizer.normalize('SIN DINERO', 'COORDINADORA');
        expect(result.status).toBe(CanonicalStatus.ISSUE);
        expect(result.reason).toBe(ExceptionReason.COD_ISSUE);
      });

      it('should map DAÑADO to ISSUE with DAMAGED', () => {
        const result = StatusNormalizer.normalize('DAÑADO', 'COORDINADORA');
        expect(result.status).toBe(CanonicalStatus.ISSUE);
        expect(result.reason).toBe(ExceptionReason.DAMAGED);
      });

      it('should map PERDIDO to ISSUE with LOST', () => {
        const result = StatusNormalizer.normalize('PERDIDO', 'COORDINADORA');
        expect(result.status).toBe(CanonicalStatus.ISSUE);
        expect(result.reason).toBe(ExceptionReason.LOST);
      });

      it('should map REPROGRAMADO to ISSUE with RESCHEDULED', () => {
        const result = StatusNormalizer.normalize('REPROGRAMADO', 'COORDINADORA');
        expect(result.status).toBe(CanonicalStatus.ISSUE);
        expect(result.reason).toBe(ExceptionReason.RESCHEDULED);
      });

      it('should map ZONA DE RIESGO to ISSUE with SECURITY', () => {
        const result = StatusNormalizer.normalize('ZONA DE RIESGO', 'COORDINADORA');
        expect(result.status).toBe(CanonicalStatus.ISSUE);
        expect(result.reason).toBe(ExceptionReason.SECURITY);
      });

      it('should map DIFICIL ACCESO to ISSUE with REMOTE_AREA', () => {
        const result = StatusNormalizer.normalize('DIFICIL ACCESO', 'COORDINADORA');
        expect(result.status).toBe(CanonicalStatus.ISSUE);
        expect(result.reason).toBe(ExceptionReason.REMOTE_AREA);
      });

      it('should map NOVEDAD to ISSUE with OTHER', () => {
        const result = StatusNormalizer.normalize('NOVEDAD', 'COORDINADORA');
        expect(result.status).toBe(CanonicalStatus.ISSUE);
        expect(result.reason).toBe(ExceptionReason.OTHER);
      });
    });

    describe('return and cancel statuses', () => {
      it('should map DEVUELTO to RETURNED', () => {
        const result = StatusNormalizer.normalize('DEVUELTO', 'COORDINADORA');
        expect(result.status).toBe(CanonicalStatus.RETURNED);
        expect(result.reason).toBe(ExceptionReason.NONE);
      });

      it('should map EN DEVOLUCIÓN to RETURNED', () => {
        const result = StatusNormalizer.normalize('EN DEVOLUCIÓN', 'COORDINADORA');
        expect(result.status).toBe(CanonicalStatus.RETURNED);
      });

      it('should map CANCELADO to CANCELLED', () => {
        const result = StatusNormalizer.normalize('CANCELADO', 'COORDINADORA');
        expect(result.status).toBe(CanonicalStatus.CANCELLED);
      });

      it('should map ANULADO to CANCELLED', () => {
        const result = StatusNormalizer.normalize('ANULADO', 'COORDINADORA');
        expect(result.status).toBe(CanonicalStatus.CANCELLED);
      });
    });
  });

  describe('INTERRAPIDISIMO status mappings', () => {
    it('should map RECIBIDO to CREATED', () => {
      const result = StatusNormalizer.normalize('RECIBIDO', 'INTERRAPIDISIMO');
      expect(result.status).toBe(CanonicalStatus.CREATED);
    });

    it('should map DESPACHO to SHIPPED', () => {
      const result = StatusNormalizer.normalize('DESPACHO', 'INTERRAPIDISIMO');
      expect(result.status).toBe(CanonicalStatus.SHIPPED);
    });

    it('should map MOVILIZACION to IN_TRANSIT', () => {
      const result = StatusNormalizer.normalize('MOVILIZACION', 'INTERRAPIDISIMO');
      expect(result.status).toBe(CanonicalStatus.IN_TRANSIT);
    });

    it('should map DISTRIBUCION to OUT_FOR_DELIVERY', () => {
      const result = StatusNormalizer.normalize('DISTRIBUCION', 'INTERRAPIDISIMO');
      expect(result.status).toBe(CanonicalStatus.OUT_FOR_DELIVERY);
    });

    it('should map EN PUNTO to IN_OFFICE', () => {
      const result = StatusNormalizer.normalize('EN PUNTO', 'INTERRAPIDISIMO');
      expect(result.status).toBe(CanonicalStatus.IN_OFFICE);
    });

    it('should map ENTREGADO to DELIVERED', () => {
      const result = StatusNormalizer.normalize('ENTREGADO', 'INTERRAPIDISIMO');
      expect(result.status).toBe(CanonicalStatus.DELIVERED);
    });

    it('should map AUSENTE to ISSUE with RECIPIENT_UNAVAILABLE', () => {
      const result = StatusNormalizer.normalize('AUSENTE', 'INTERRAPIDISIMO');
      expect(result.status).toBe(CanonicalStatus.ISSUE);
      expect(result.reason).toBe(ExceptionReason.RECIPIENT_UNAVAILABLE);
    });

    it('should map REHUSADO to ISSUE with REJECTED', () => {
      const result = StatusNormalizer.normalize('REHUSADO', 'INTERRAPIDISIMO');
      expect(result.status).toBe(CanonicalStatus.ISSUE);
      expect(result.reason).toBe(ExceptionReason.REJECTED);
    });

    it('should map NO TIENE DINERO to ISSUE with COD_ISSUE', () => {
      const result = StatusNormalizer.normalize('NO TIENE DINERO', 'INTERRAPIDISIMO');
      expect(result.status).toBe(CanonicalStatus.ISSUE);
      expect(result.reason).toBe(ExceptionReason.COD_ISSUE);
    });

    it('should map DEVOLUCION to RETURNED', () => {
      const result = StatusNormalizer.normalize('DEVOLUCION', 'INTERRAPIDISIMO');
      expect(result.status).toBe(CanonicalStatus.RETURNED);
    });
  });

  describe('ENVIA status mappings', () => {
    it('should map GENERADO to CREATED', () => {
      const result = StatusNormalizer.normalize('GENERADO', 'ENVIA');
      expect(result.status).toBe(CanonicalStatus.CREATED);
    });

    it('should map CARGUE to SHIPPED', () => {
      const result = StatusNormalizer.normalize('CARGUE', 'ENVIA');
      expect(result.status).toBe(CanonicalStatus.SHIPPED);
    });

    it('should map EN LINEA to IN_TRANSIT', () => {
      const result = StatusNormalizer.normalize('EN LINEA', 'ENVIA');
      expect(result.status).toBe(CanonicalStatus.IN_TRANSIT);
    });

    it('should map ULTIMO KM to OUT_FOR_DELIVERY', () => {
      const result = StatusNormalizer.normalize('ULTIMO KM', 'ENVIA');
      expect(result.status).toBe(CanonicalStatus.OUT_FOR_DELIVERY);
    });

    it('should map ENTREGA EXITOSA to DELIVERED', () => {
      const result = StatusNormalizer.normalize('ENTREGA EXITOSA', 'ENVIA');
      expect(result.status).toBe(CanonicalStatus.DELIVERED);
    });

    it('should map REPROGRAMAR to ISSUE with RESCHEDULED', () => {
      const result = StatusNormalizer.normalize('REPROGRAMAR', 'ENVIA');
      expect(result.status).toBe(CanonicalStatus.ISSUE);
      expect(result.reason).toBe(ExceptionReason.RESCHEDULED);
    });
  });

  describe('TCC status mappings', () => {
    it('should map DOCUMENTO RADICADO to CREATED', () => {
      const result = StatusNormalizer.normalize('DOCUMENTO RADICADO', 'TCC');
      expect(result.status).toBe(CanonicalStatus.CREATED);
    });

    it('should map CARGADO to SHIPPED', () => {
      const result = StatusNormalizer.normalize('CARGADO', 'TCC');
      expect(result.status).toBe(CanonicalStatus.SHIPPED);
    });

    it('should map EN TRANSPORTE to IN_TRANSIT', () => {
      const result = StatusNormalizer.normalize('EN TRANSPORTE', 'TCC');
      expect(result.status).toBe(CanonicalStatus.IN_TRANSIT);
    });

    it('should map SALIDA REPARTO to OUT_FOR_DELIVERY', () => {
      const result = StatusNormalizer.normalize('SALIDA REPARTO', 'TCC');
      expect(result.status).toBe(CanonicalStatus.OUT_FOR_DELIVERY);
    });

    it('should map DISPONIBLE RETIRO to IN_OFFICE', () => {
      const result = StatusNormalizer.normalize('DISPONIBLE RETIRO', 'TCC');
      expect(result.status).toBe(CanonicalStatus.IN_OFFICE);
    });

    it('should map ENTREGA EFECTIVA to DELIVERED', () => {
      const result = StatusNormalizer.normalize('ENTREGA EFECTIVA', 'TCC');
      expect(result.status).toBe(CanonicalStatus.DELIVERED);
    });

    it('should map ZONA DIFICIL to ISSUE with REMOTE_AREA', () => {
      const result = StatusNormalizer.normalize('ZONA DIFICIL', 'TCC');
      expect(result.status).toBe(CanonicalStatus.ISSUE);
      expect(result.reason).toBe(ExceptionReason.REMOTE_AREA);
    });
  });

  describe('SERVIENTREGA status mappings', () => {
    it('should map IMPRESO to CREATED', () => {
      const result = StatusNormalizer.normalize('IMPRESO', 'SERVIENTREGA');
      expect(result.status).toBe(CanonicalStatus.CREATED);
    });

    it('should map EN PLATAFORMA to IN_TRANSIT', () => {
      const result = StatusNormalizer.normalize('EN PLATAFORMA', 'SERVIENTREGA');
      expect(result.status).toBe(CanonicalStatus.IN_TRANSIT);
    });

    it('should map EN CENTRO DE DISTRIBUCION to IN_TRANSIT', () => {
      const result = StatusNormalizer.normalize('EN CENTRO DE DISTRIBUCION', 'SERVIENTREGA');
      expect(result.status).toBe(CanonicalStatus.IN_TRANSIT);
    });

    it('should map ASIGNADO MENSAJERO to OUT_FOR_DELIVERY', () => {
      const result = StatusNormalizer.normalize('ASIGNADO MENSAJERO', 'SERVIENTREGA');
      expect(result.status).toBe(CanonicalStatus.OUT_FOR_DELIVERY);
    });

    it('should map CLIENTE AUSENTE to ISSUE with RECIPIENT_UNAVAILABLE', () => {
      const result = StatusNormalizer.normalize('CLIENTE AUSENTE', 'SERVIENTREGA');
      expect(result.status).toBe(CanonicalStatus.ISSUE);
      expect(result.reason).toBe(ExceptionReason.RECIPIENT_UNAVAILABLE);
    });
  });

  describe('case insensitivity', () => {
    it('should handle lowercase statuses', () => {
      const result = StatusNormalizer.normalize('entregado', 'COORDINADORA');
      expect(result.status).toBe(CanonicalStatus.DELIVERED);
    });

    it('should handle mixed case statuses', () => {
      const result = StatusNormalizer.normalize('En Reparto', 'COORDINADORA');
      expect(result.status).toBe(CanonicalStatus.OUT_FOR_DELIVERY);
    });

    it('should handle UPPERCASE statuses', () => {
      const result = StatusNormalizer.normalize('EN TRANSITO', 'COORDINADORA');
      expect(result.status).toBe(CanonicalStatus.IN_TRANSIT);
    });
  });

  describe('accent handling', () => {
    it('should match with accents', () => {
      const result = StatusNormalizer.normalize('DIRECCIÓN INCORRECTA', 'COORDINADORA');
      expect(result.status).toBe(CanonicalStatus.ISSUE);
      expect(result.reason).toBe(ExceptionReason.BAD_ADDRESS);
    });

    it('should match without accents', () => {
      const result = StatusNormalizer.normalize('DIRECCION INCORRECTA', 'COORDINADORA');
      expect(result.status).toBe(CanonicalStatus.ISSUE);
      expect(result.reason).toBe(ExceptionReason.BAD_ADDRESS);
    });
  });

  describe('unknown status fallback', () => {
    it('should return ISSUE with OTHER for unknown statuses', () => {
      const result = StatusNormalizer.normalize('ESTADO DESCONOCIDO XYZ', 'COORDINADORA');
      expect(result.status).toBe(CanonicalStatus.ISSUE);
      expect(result.reason).toBe(ExceptionReason.OTHER);
    });

    it('should preserve rawStatus for unknown statuses', () => {
      const rawStatus = 'ESTADO COMPLETAMENTE NUEVO';
      const result = StatusNormalizer.normalize(rawStatus, 'TCC');
      expect(result.rawStatus).toBe(rawStatus);
    });
  });

  describe('detectCarrier()', () => {
    it('should detect COORDINADORA from name', () => {
      expect(detectCarrier('Coordinadora')).toBe('COORDINADORA');
      expect(detectCarrier('COORDINADORA')).toBe('COORDINADORA');
    });

    it('should detect INTERRAPIDISIMO from name', () => {
      expect(detectCarrier('Inter')).toBe('INTERRAPIDISIMO');
      expect(detectCarrier('INTERRAPIDISIMO')).toBe('INTERRAPIDISIMO');
    });

    it('should detect ENVIA from name', () => {
      expect(detectCarrier('Envía')).toBe('ENVIA');
      expect(detectCarrier('ENVIA')).toBe('ENVIA');
    });

    it('should detect TCC from name', () => {
      expect(detectCarrier('TCC')).toBe('TCC');
    });

    it('should detect SERVIENTREGA from name', () => {
      expect(detectCarrier('Servientrega')).toBe('SERVIENTREGA');
    });

    it('should return UNKNOWN for unrecognized carriers', () => {
      expect(detectCarrier('FedEx')).toBe('UNKNOWN');
      expect(detectCarrier('DHL')).toBe('UNKNOWN');
    });
  });

  describe('normalizeBatch()', () => {
    it('should normalize multiple statuses', () => {
      const items = [
        { rawStatus: 'ENTREGADO', carrier: 'COORDINADORA' as const },
        { rawStatus: 'EN TRANSITO', carrier: 'INTERRAPIDISIMO' as const },
        { rawStatus: 'RECHAZADO', carrier: 'TCC' as const },
      ];

      const results = StatusNormalizer.normalizeBatch(items);

      expect(results).toHaveLength(3);
      expect(results[0].status).toBe(CanonicalStatus.DELIVERED);
      expect(results[1].status).toBe(CanonicalStatus.IN_TRANSIT);
      expect(results[2].status).toBe(CanonicalStatus.ISSUE);
      expect(results[2].reason).toBe(ExceptionReason.REJECTED);
    });

    it('should preserve lastEventAt in batch', () => {
      const lastEventAt1 = new Date('2024-01-10');
      const lastEventAt2 = new Date('2024-01-11');

      const items = [
        { rawStatus: 'ENTREGADO', carrier: 'COORDINADORA' as const, lastEventAt: lastEventAt1 },
        { rawStatus: 'EN REPARTO', carrier: 'COORDINADORA' as const, lastEventAt: lastEventAt2 },
      ];

      const results = StatusNormalizer.normalizeBatch(items);

      expect(results[0].lastEventAt).toEqual(lastEventAt1);
      expect(results[1].lastEventAt).toEqual(lastEventAt2);
    });

    it('should preserve source in batch', () => {
      const items = [
        { rawStatus: 'ENTREGADO', carrier: 'COORDINADORA' as const, source: 'dropi' as const },
        { rawStatus: 'EN REPARTO', carrier: 'COORDINADORA' as const, source: 'excel' as const },
      ];

      const results = StatusNormalizer.normalizeBatch(items);

      expect(results[0].source).toBe('dropi');
      expect(results[1].source).toBe('excel');
    });
  });

  describe('helper methods', () => {
    describe('isDelivered()', () => {
      it('should return true for DELIVERED', () => {
        expect(StatusNormalizer.isDelivered(CanonicalStatus.DELIVERED)).toBe(true);
      });

      it('should return false for other statuses', () => {
        expect(StatusNormalizer.isDelivered(CanonicalStatus.IN_TRANSIT)).toBe(false);
        expect(StatusNormalizer.isDelivered(CanonicalStatus.ISSUE)).toBe(false);
      });
    });

    describe('hasIssue()', () => {
      it('should return true for ISSUE', () => {
        expect(StatusNormalizer.hasIssue(CanonicalStatus.ISSUE)).toBe(true);
      });

      it('should return false for other statuses', () => {
        expect(StatusNormalizer.hasIssue(CanonicalStatus.DELIVERED)).toBe(false);
      });
    });

    describe('isInProgress()', () => {
      it('should return true for in-progress statuses', () => {
        expect(StatusNormalizer.isInProgress(CanonicalStatus.CREATED)).toBe(true);
        expect(StatusNormalizer.isInProgress(CanonicalStatus.PROCESSING)).toBe(true);
        expect(StatusNormalizer.isInProgress(CanonicalStatus.SHIPPED)).toBe(true);
        expect(StatusNormalizer.isInProgress(CanonicalStatus.IN_TRANSIT)).toBe(true);
        expect(StatusNormalizer.isInProgress(CanonicalStatus.OUT_FOR_DELIVERY)).toBe(true);
        expect(StatusNormalizer.isInProgress(CanonicalStatus.IN_OFFICE)).toBe(true);
      });

      it('should return false for terminal statuses', () => {
        expect(StatusNormalizer.isInProgress(CanonicalStatus.DELIVERED)).toBe(false);
        expect(StatusNormalizer.isInProgress(CanonicalStatus.RETURNED)).toBe(false);
        expect(StatusNormalizer.isInProgress(CanonicalStatus.CANCELLED)).toBe(false);
      });
    });

    describe('isTerminal()', () => {
      it('should return true for terminal statuses', () => {
        expect(StatusNormalizer.isTerminal(CanonicalStatus.DELIVERED)).toBe(true);
        expect(StatusNormalizer.isTerminal(CanonicalStatus.RETURNED)).toBe(true);
        expect(StatusNormalizer.isTerminal(CanonicalStatus.CANCELLED)).toBe(true);
      });

      it('should return false for in-progress statuses', () => {
        expect(StatusNormalizer.isTerminal(CanonicalStatus.IN_TRANSIT)).toBe(false);
        expect(StatusNormalizer.isTerminal(CanonicalStatus.ISSUE)).toBe(false);
      });
    });

    describe('getSupportedCarriers()', () => {
      it('should return all supported carriers', () => {
        const carriers = StatusNormalizer.getSupportedCarriers();

        expect(carriers).toContain('COORDINADORA');
        expect(carriers).toContain('INTERRAPIDISIMO');
        expect(carriers).toContain('ENVIA');
        expect(carriers).toContain('TCC');
        expect(carriers).toContain('SERVIENTREGA');
        expect(carriers).toContain('UNKNOWN');
      });
    });

    describe('getMappings()', () => {
      it('should return mappings for a carrier', () => {
        const mappings = StatusNormalizer.getMappings('COORDINADORA');

        expect(Array.isArray(mappings)).toBe(true);
        expect(mappings.length).toBeGreaterThan(0);
        expect(mappings[0]).toHaveProperty('pattern');
        expect(mappings[0]).toHaveProperty('status');
      });
    });
  });

  describe('real-world scenarios', () => {
    it('should handle typical Coordinadora tracking flow', () => {
      const statuses = [
        'ADMITIDO',
        'RECOGIDO',
        'DESPACHADO',
        'EN TRANSITO',
        'LLEGADA A CENTRO',
        'EN REPARTO',
        'ENTREGADO',
      ];

      const results = statuses.map((s) => StatusNormalizer.normalize(s, 'COORDINADORA'));

      expect(results[0].status).toBe(CanonicalStatus.CREATED);
      expect(results[1].status).toBe(CanonicalStatus.PROCESSING);
      expect(results[2].status).toBe(CanonicalStatus.SHIPPED);
      expect(results[3].status).toBe(CanonicalStatus.IN_TRANSIT);
      expect(results[4].status).toBe(CanonicalStatus.IN_TRANSIT);
      expect(results[5].status).toBe(CanonicalStatus.OUT_FOR_DELIVERY);
      expect(results[6].status).toBe(CanonicalStatus.DELIVERED);
    });

    it('should handle typical issue flow leading to return', () => {
      const statuses = [
        'EN REPARTO',
        'DESTINATARIO AUSENTE',
        'REPROGRAMADO',
        'NO HAY QUIEN RECIBA',
        'EN DEVOLUCIÓN',
        'DEVUELTO',
      ];

      const results = statuses.map((s) => StatusNormalizer.normalize(s, 'COORDINADORA'));

      expect(results[0].status).toBe(CanonicalStatus.OUT_FOR_DELIVERY);
      expect(results[1].status).toBe(CanonicalStatus.ISSUE);
      expect(results[1].reason).toBe(ExceptionReason.RECIPIENT_UNAVAILABLE);
      expect(results[2].status).toBe(CanonicalStatus.ISSUE);
      expect(results[2].reason).toBe(ExceptionReason.RESCHEDULED);
      expect(results[3].status).toBe(CanonicalStatus.ISSUE);
      expect(results[4].status).toBe(CanonicalStatus.RETURNED);
      expect(results[5].status).toBe(CanonicalStatus.RETURNED);
    });

    it('should handle COD (contra entrega) issues', () => {
      const result1 = StatusNormalizer.normalize('SIN DINERO', 'COORDINADORA');
      const result2 = StatusNormalizer.normalize('NO TIENE DINERO', 'INTERRAPIDISIMO');

      expect(result1.status).toBe(CanonicalStatus.ISSUE);
      expect(result1.reason).toBe(ExceptionReason.COD_ISSUE);
      expect(result2.status).toBe(CanonicalStatus.ISSUE);
      expect(result2.reason).toBe(ExceptionReason.COD_ISSUE);
    });
  });
});
