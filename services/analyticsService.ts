import { Shipment, ShipmentStatus } from '../types';

export interface WeeklyMetrics {
  totalShipments: number;
  successfulDeliveries: number;
  successRate: number;
  failures: number;
  failureRate: number;
  averageDeliveryTime: number;
  bestCarrier: {
    name: string;
    successRate: number;
  };
  worstCarrier: {
    name: string;
    failureCount: number;
  };
}

export interface CriticalZone {
  city: string;
  failures: number;
  commonCarrier: string;
}

export interface DelayedRoute {
  from: string;
  to: string;
  averageTime: number;
  actualTime: number;
  delayDays: number;
}

export interface AnalyticsReport {
  weekNumber: number;
  year: number;
  generatedDate: string;
  metrics: WeeklyMetrics;
  criticalZones: CriticalZone[];
  delayedRoutes: DelayedRoute[];
}

/**
 * Calcula las métricas semanales a partir de los envíos
 */
export function calculateWeeklyMetrics(shipments: Shipment[]): WeeklyMetrics {
  const total = shipments.length;

  if (total === 0) {
    return {
      totalShipments: 0,
      successfulDeliveries: 0,
      successRate: 0,
      failures: 0,
      failureRate: 0,
      averageDeliveryTime: 0,
      bestCarrier: { name: 'N/A', successRate: 0 },
      worstCarrier: { name: 'N/A', failureCount: 0 },
    };
  }

  // Contar entregas exitosas
  const successful = shipments.filter(
    (s) => s.status === 'Entregado' || s.status === 'delivered'
  ).length;

  // Contar fallos
  const failures = shipments.filter(
    (s) =>
      s.status === 'Fallido' ||
      s.status === 'failed' ||
      s.status === 'Devolución' ||
      s.status === 'returned'
  ).length;

  // Calcular tiempo promedio de entrega
  const deliveryTimes: number[] = [];
  shipments.forEach((shipment) => {
    if (shipment.estimatedDelivery && shipment.lastUpdate) {
      const start = new Date(shipment.lastUpdate).getTime();
      const end = new Date(shipment.estimatedDelivery).getTime();
      const days = Math.abs(Math.floor((end - start) / (1000 * 60 * 60 * 24)));
      if (days > 0 && days < 365) {
        // Validar días razonables
        deliveryTimes.push(days);
      }
    }
  });

  const averageDeliveryTime =
    deliveryTimes.length > 0
      ? Math.round(
          deliveryTimes.reduce((a, b) => a + b, 0) / deliveryTimes.length
        )
      : 0;

  // Analizar transportadoras
  const carrierStats = new Map<
    string,
    { total: number; successful: number; failed: number }
  >();

  shipments.forEach((shipment) => {
    const carrier = shipment.carrier;
    if (!carrierStats.has(carrier)) {
      carrierStats.set(carrier, { total: 0, successful: 0, failed: 0 });
    }

    const stats = carrierStats.get(carrier)!;
    stats.total++;

    if (shipment.status === 'Entregado' || shipment.status === 'delivered') {
      stats.successful++;
    } else if (
      shipment.status === 'Fallido' ||
      shipment.status === 'failed' ||
      shipment.status === 'Devolución' ||
      shipment.status === 'returned'
    ) {
      stats.failed++;
    }
  });

  // Encontrar mejor transportadora
  let bestCarrier = { name: 'N/A', successRate: 0 };
  let worstCarrier = { name: 'N/A', failureCount: 0 };

  carrierStats.forEach((stats, carrier) => {
    const successRate = (stats.successful / stats.total) * 100;
    if (successRate > bestCarrier.successRate) {
      bestCarrier = { name: carrier, successRate: Math.round(successRate) };
    }

    if (stats.failed > worstCarrier.failureCount) {
      worstCarrier = { name: carrier, failureCount: stats.failed };
    }
  });

  return {
    totalShipments: total,
    successfulDeliveries: successful,
    successRate: Math.round((successful / total) * 100),
    failures,
    failureRate: Math.round((failures / total) * 100),
    averageDeliveryTime,
    bestCarrier,
    worstCarrier,
  };
}

/**
 * Identifica las zonas críticas con más fallos
 */
export function identifyCriticalZones(
  shipments: Shipment[],
  topN: number = 3
): CriticalZone[] {
  const failedShipments = shipments.filter(
    (s) =>
      s.status === 'Fallido' ||
      s.status === 'failed' ||
      s.status === 'Devolución' ||
      s.status === 'returned'
  );

  // Agrupar por ciudad
  const cityFailures = new Map<string, { failures: number; carriers: string[] }>();

  failedShipments.forEach((shipment) => {
    const city = extractCity(shipment.destination);
    if (!cityFailures.has(city)) {
      cityFailures.set(city, { failures: 0, carriers: [] });
    }

    const data = cityFailures.get(city)!;
    data.failures++;
    data.carriers.push(shipment.carrier);
  });

  // Convertir a array y ordenar
  const zones: CriticalZone[] = [];
  cityFailures.forEach((data, city) => {
    // Encontrar transportadora más común
    const carrierCounts = new Map<string, number>();
    data.carriers.forEach((carrier) => {
      carrierCounts.set(carrier, (carrierCounts.get(carrier) || 0) + 1);
    });

    let commonCarrier = 'N/A';
    let maxCount = 0;
    carrierCounts.forEach((count, carrier) => {
      if (count > maxCount) {
        maxCount = count;
        commonCarrier = carrier;
      }
    });

    zones.push({
      city,
      failures: data.failures,
      commonCarrier,
    });
  });

  // Ordenar por número de fallos (descendente) y tomar top N
  return zones.sort((a, b) => b.failures - a.failures).slice(0, topN);
}

/**
 * Detecta rutas con retrasos significativos
 */
export function detectDelayedRoutes(
  shipments: Shipment[],
  topN: number = 5
): DelayedRoute[] {
  const routes = new Map<
    string,
    { times: number[]; origins: Set<string>; destinations: Set<string> }
  >();

  shipments.forEach((shipment) => {
    if (shipment.estimatedDelivery && shipment.lastUpdate) {
      const origin = extractCity(shipment.origin || 'Desconocido');
      const destination = extractCity(shipment.destination);
      const routeKey = `${origin} → ${destination}`;

      const start = new Date(shipment.lastUpdate).getTime();
      const end = new Date(shipment.estimatedDelivery).getTime();
      const days = Math.abs(Math.floor((end - start) / (1000 * 60 * 60 * 24)));

      if (days > 0 && days < 30) {
        // Validar días razonables
        if (!routes.has(routeKey)) {
          routes.set(routeKey, {
            times: [],
            origins: new Set(),
            destinations: new Set(),
          });
        }

        const route = routes.get(routeKey)!;
        route.times.push(days);
        route.origins.add(origin);
        route.destinations.add(destination);
      }
    }
  });

  // Calcular rutas con retrasos
  const delayedRoutes: DelayedRoute[] = [];

  routes.forEach((data, routeKey) => {
    if (data.times.length >= 2) {
      // Necesitamos al menos 2 datos
      const avgTime = data.times.reduce((a, b) => a + b, 0) / data.times.length;
      const maxTime = Math.max(...data.times);

      // Detectar retraso significativo (50% o más del promedio)
      if (maxTime > avgTime * 1.5) {
        const [from, to] = routeKey.split(' → ');
        delayedRoutes.push({
          from,
          to,
          averageTime: Math.round(avgTime),
          actualTime: maxTime,
          delayDays: Math.round(maxTime - avgTime),
        });
      }
    }
  });

  // Ordenar por retraso (descendente) y tomar top N
  return delayedRoutes
    .sort((a, b) => b.delayDays - a.delayDays)
    .slice(0, topN);
}

/**
 * Extrae el nombre de la ciudad de una dirección
 */
function extractCity(address: string): string {
  if (!address) return 'Desconocido';

  // Intentar extraer ciudad (asume formato: "Calle X, Ciudad, País")
  const parts = address.split(',').map((p) => p.trim());

  if (parts.length >= 2) {
    return parts[parts.length - 2]; // Penúltima parte suele ser la ciudad
  }

  // Si no hay comas, buscar palabras comunes de ciudades colombianas
  const colombianCities = [
    'Bogotá',
    'Medellín',
    'Cali',
    'Barranquilla',
    'Cartagena',
    'Cúcuta',
    'Bucaramanga',
    'Pereira',
    'Santa Marta',
    'Ibagué',
    'Pasto',
    'Manizales',
    'Villavicencio',
    'Valledupar',
    'Montería',
    'Armenia',
    'Neiva',
    'Popayán',
    'Sincelejo',
    'Tunja',
  ];

  for (const city of colombianCities) {
    if (address.toLowerCase().includes(city.toLowerCase())) {
      return city;
    }
  }

  return address.split(' ')[0]; // Primera palabra como fallback
}

/**
 * Obtiene el número de semana del año
 */
function getWeekNumber(date: Date): number {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Genera un reporte completo de análisis
 */
export function generateAnalyticsReport(
  shipments: Shipment[]
): AnalyticsReport {
  const now = new Date();

  return {
    weekNumber: getWeekNumber(now),
    year: now.getFullYear(),
    generatedDate: now.toISOString(),
    metrics: calculateWeeklyMetrics(shipments),
    criticalZones: identifyCriticalZones(shipments),
    delayedRoutes: detectDelayedRoutes(shipments),
  };
}
