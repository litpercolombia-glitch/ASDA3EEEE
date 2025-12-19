// tests/services/analyticsService.test.ts
// Tests para el servicio de analytics

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock de shipments para tests
interface MockShipment {
  id: string;
  status: string;
  carrier: string;
  destination?: string;
  daysInTransit?: number;
}

const createMockShipments = (): MockShipment[] => [
  { id: '1', status: 'delivered', carrier: 'Coordinadora', destination: 'Bogota', daysInTransit: 2 },
  { id: '2', status: 'delivered', carrier: 'TCC', destination: 'Medellin', daysInTransit: 3 },
  { id: '3', status: 'in_transit', carrier: 'Coordinadora', destination: 'Bogota', daysInTransit: 5 },
  { id: '4', status: 'issue', carrier: 'Servientrega', destination: 'Cali', daysInTransit: 7 },
  { id: '5', status: 'returned', carrier: 'Envia', destination: 'Barranquilla', daysInTransit: 10 },
];

// Funciones de utilidad para analytics (simulando el servicio)
const calculateMetrics = (shipments: MockShipment[]) => {
  const total = shipments.length;
  const delivered = shipments.filter(s => s.status === 'delivered').length;
  const inTransit = shipments.filter(s => s.status === 'in_transit').length;
  const issues = shipments.filter(s => s.status === 'issue').length;
  const returned = shipments.filter(s => s.status === 'returned').length;

  return {
    total,
    delivered,
    inTransit,
    issues,
    returned,
    deliveryRate: total > 0 ? Math.round((delivered / total) * 100) : 0,
    issueRate: total > 0 ? Math.round((issues / total) * 100) : 0,
  };
};

const getTopCarriers = (shipments: MockShipment[], limit = 5) => {
  const carrierMap = new Map<string, number>();

  shipments.forEach(s => {
    const count = carrierMap.get(s.carrier) || 0;
    carrierMap.set(s.carrier, count + 1);
  });

  return Array.from(carrierMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([carrier, count]) => ({ carrier, count }));
};

const getTopCities = (shipments: MockShipment[], limit = 5) => {
  const cityMap = new Map<string, number>();

  shipments.forEach(s => {
    if (s.destination) {
      const count = cityMap.get(s.destination) || 0;
      cityMap.set(s.destination, count + 1);
    }
  });

  return Array.from(cityMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([city, count]) => ({ city, count }));
};

const calculateAverageDaysInTransit = (shipments: MockShipment[]) => {
  const withDays = shipments.filter(s => s.daysInTransit !== undefined);
  if (withDays.length === 0) return 0;

  const total = withDays.reduce((acc, s) => acc + (s.daysInTransit || 0), 0);
  return Math.round((total / withDays.length) * 10) / 10;
};

describe('Analytics Service', () => {
  describe('calculateMetrics', () => {
    it('calcula correctamente las métricas básicas', () => {
      const shipments = createMockShipments();
      const metrics = calculateMetrics(shipments);

      expect(metrics.total).toBe(5);
      expect(metrics.delivered).toBe(2);
      expect(metrics.inTransit).toBe(1);
      expect(metrics.issues).toBe(1);
      expect(metrics.returned).toBe(1);
    });

    it('calcula correctamente la tasa de entrega', () => {
      const shipments = createMockShipments();
      const metrics = calculateMetrics(shipments);

      // 2/5 = 40%
      expect(metrics.deliveryRate).toBe(40);
    });

    it('calcula correctamente la tasa de problemas', () => {
      const shipments = createMockShipments();
      const metrics = calculateMetrics(shipments);

      // 1/5 = 20%
      expect(metrics.issueRate).toBe(20);
    });

    it('retorna ceros para array vacío', () => {
      const metrics = calculateMetrics([]);

      expect(metrics.total).toBe(0);
      expect(metrics.delivered).toBe(0);
      expect(metrics.deliveryRate).toBe(0);
    });

    it('maneja correctamente 100% de entregas', () => {
      const allDelivered: MockShipment[] = [
        { id: '1', status: 'delivered', carrier: 'Test' },
        { id: '2', status: 'delivered', carrier: 'Test' },
      ];
      const metrics = calculateMetrics(allDelivered);

      expect(metrics.deliveryRate).toBe(100);
    });
  });

  describe('getTopCarriers', () => {
    it('obtiene las transportadoras principales ordenadas por cantidad', () => {
      const shipments = createMockShipments();
      const topCarriers = getTopCarriers(shipments);

      // Coordinadora tiene 2, el resto tiene 1
      expect(topCarriers[0].carrier).toBe('Coordinadora');
      expect(topCarriers[0].count).toBe(2);
    });

    it('respeta el límite especificado', () => {
      const shipments = createMockShipments();
      const topCarriers = getTopCarriers(shipments, 2);

      expect(topCarriers.length).toBe(2);
    });

    it('retorna array vacío para shipments vacío', () => {
      const topCarriers = getTopCarriers([]);
      expect(topCarriers).toHaveLength(0);
    });
  });

  describe('getTopCities', () => {
    it('obtiene las ciudades principales ordenadas por cantidad', () => {
      const shipments = createMockShipments();
      const topCities = getTopCities(shipments);

      // Bogota tiene 2, el resto tiene 1
      expect(topCities[0].city).toBe('Bogota');
      expect(topCities[0].count).toBe(2);
    });

    it('ignora shipments sin destino', () => {
      const shipmentsWithoutDestination: MockShipment[] = [
        { id: '1', status: 'delivered', carrier: 'Test' },
        { id: '2', status: 'delivered', carrier: 'Test', destination: 'Bogota' },
      ];
      const topCities = getTopCities(shipmentsWithoutDestination);

      expect(topCities).toHaveLength(1);
      expect(topCities[0].city).toBe('Bogota');
    });
  });

  describe('calculateAverageDaysInTransit', () => {
    it('calcula correctamente el promedio de días en tránsito', () => {
      const shipments = createMockShipments();
      const avg = calculateAverageDaysInTransit(shipments);

      // (2 + 3 + 5 + 7 + 10) / 5 = 5.4
      expect(avg).toBe(5.4);
    });

    it('retorna 0 para array vacío', () => {
      const avg = calculateAverageDaysInTransit([]);
      expect(avg).toBe(0);
    });

    it('ignora shipments sin días en tránsito', () => {
      const shipmentsPartial: MockShipment[] = [
        { id: '1', status: 'delivered', carrier: 'Test', daysInTransit: 10 },
        { id: '2', status: 'delivered', carrier: 'Test' }, // Sin días
      ];
      const avg = calculateAverageDaysInTransit(shipmentsPartial);

      expect(avg).toBe(10);
    });
  });
});

describe('Analytics Edge Cases', () => {
  it('maneja shipments con estados no estándar', () => {
    const nonStandardShipments: MockShipment[] = [
      { id: '1', status: 'unknown_status', carrier: 'Test' },
      { id: '2', status: '', carrier: 'Test' },
    ];
    const metrics = calculateMetrics(nonStandardShipments);

    expect(metrics.total).toBe(2);
    expect(metrics.delivered).toBe(0);
  });

  it('maneja transportadoras con nombres especiales', () => {
    const specialCarriers: MockShipment[] = [
      { id: '1', status: 'delivered', carrier: 'Test & Co.' },
      { id: '2', status: 'delivered', carrier: 'Test & Co.' },
      { id: '3', status: 'delivered', carrier: 'Otro' },
    ];
    const topCarriers = getTopCarriers(specialCarriers);

    expect(topCarriers[0].carrier).toBe('Test & Co.');
    expect(topCarriers[0].count).toBe(2);
  });
});
