// services/brain/knowledge/PatternDetector.ts
// Detecta patrones en los datos de envíos

import { UnifiedShipment, DetectedPattern, ShipmentStatus } from '../types/brain.types';
import { eventBus } from '../core/EventBus';
import { memoryManager } from '../core/MemoryManager';

export interface PatternRule {
  id: string;
  name: string;
  description: string;
  type: 'carrier' | 'location' | 'time' | 'status' | 'customer' | 'product';
  detector: (shipments: UnifiedShipment[]) => DetectedPattern | null;
  minOccurrences: number;
}

class PatternDetectorService {
  private patterns: Map<string, DetectedPattern> = new Map();
  private rules: PatternRule[] = [];

  constructor() {
    this.initializeRules();
  }

  /**
   * Inicializar reglas de detección de patrones
   */
  private initializeRules(): void {
    this.rules = [
      // Patrón: Transportadora con muchos retrasos
      {
        id: 'carrier_delays',
        name: 'Transportadora con Retrasos',
        description: 'Detecta transportadoras con alto índice de retrasos',
        type: 'carrier',
        minOccurrences: 5,
        detector: (shipments) => this.detectCarrierDelays(shipments),
      },

      // Patrón: Ciudad destino problemática
      {
        id: 'problematic_city',
        name: 'Ciudad Problemática',
        description: 'Detecta ciudades con alto índice de novedades',
        type: 'location',
        minOccurrences: 3,
        detector: (shipments) => this.detectProblematicCity(shipments),
      },

      // Patrón: Día de la semana con más entregas
      {
        id: 'best_delivery_day',
        name: 'Mejor Día de Entrega',
        description: 'Detecta los días con mayor tasa de entrega exitosa',
        type: 'time',
        minOccurrences: 10,
        detector: (shipments) => this.detectBestDeliveryDay(shipments),
      },

      // Patrón: Envíos estancados
      {
        id: 'stalled_shipments',
        name: 'Envíos Estancados',
        description: 'Detecta envíos sin movimiento prolongado',
        type: 'status',
        minOccurrences: 1,
        detector: (shipments) => this.detectStalledShipments(shipments),
      },

      // Patrón: Producto con alta devolución
      {
        id: 'high_return_product',
        name: 'Producto con Alta Devolución',
        description: 'Detecta productos que se devuelven frecuentemente',
        type: 'product',
        minOccurrences: 3,
        detector: (shipments) => this.detectHighReturnProduct(shipments),
      },

      // Patrón: Horario óptimo de recogida
      {
        id: 'optimal_pickup_time',
        name: 'Horario Óptimo de Recogida',
        description: 'Detecta los horarios con mejores tiempos de tránsito',
        type: 'time',
        minOccurrences: 10,
        detector: (shipments) => this.detectOptimalPickupTime(shipments),
      },
    ];
  }

  /**
   * Ejecutar detección de todos los patrones
   */
  detectPatterns(shipments: UnifiedShipment[]): DetectedPattern[] {
    const detected: DetectedPattern[] = [];

    this.rules.forEach(rule => {
      if (shipments.length >= rule.minOccurrences) {
        const pattern = rule.detector(shipments);
        if (pattern && pattern.confidence >= 60) {
          detected.push(pattern);
          this.patterns.set(pattern.id, pattern);

          // Guardar en memoria
          memoryManager.remember(`pattern_${pattern.id}`, pattern, {
            type: 'MEDIUM_TERM',
            importance: pattern.confidence,
          });

          // Emitir evento
          eventBus.emit('pattern.detected', {
            patternId: pattern.id,
            type: pattern.type,
            confidence: pattern.confidence,
          });
        }
      }
    });

    return detected;
  }

  /**
   * Obtener patrones detectados
   */
  getPatterns(): DetectedPattern[] {
    return Array.from(this.patterns.values());
  }

  /**
   * Obtener patrón por ID
   */
  getPattern(id: string): DetectedPattern | undefined {
    return this.patterns.get(id);
  }

  // ==================== DETECTORES ESPECÍFICOS ====================

  private detectCarrierDelays(shipments: UnifiedShipment[]): DetectedPattern | null {
    const carrierStats: Record<string, { total: number; delayed: number }> = {};

    shipments.forEach(s => {
      const carrier = s.carrier.value;
      if (!carrierStats[carrier]) {
        carrierStats[carrier] = { total: 0, delayed: 0 };
      }
      carrierStats[carrier].total++;
      if (s.isDelayed) carrierStats[carrier].delayed++;
    });

    // Encontrar transportadora más problemática
    let worstCarrier: string | null = null;
    let worstRate = 0;

    Object.entries(carrierStats).forEach(([carrier, stats]) => {
      if (stats.total >= 5) {
        const rate = stats.delayed / stats.total;
        if (rate > worstRate && rate > 0.3) {
          worstRate = rate;
          worstCarrier = carrier;
        }
      }
    });

    if (!worstCarrier) return null;

    const stats = carrierStats[worstCarrier];
    return {
      id: `carrier_delays_${worstCarrier.toLowerCase().replace(/\s/g, '_')}`,
      type: 'carrier_performance',
      name: `${worstCarrier} con Alto Índice de Retrasos`,
      description: `${worstCarrier} tiene ${Math.round(worstRate * 100)}% de envíos retrasados (${stats.delayed}/${stats.total})`,
      confidence: Math.min(95, 60 + stats.total * 2),
      occurrences: stats.delayed,
      lastSeen: new Date(),
      data: {
        carrier: worstCarrier,
        delayRate: worstRate,
        totalShipments: stats.total,
        delayedShipments: stats.delayed,
      },
      actionable: true,
      suggestedAction: `Considerar alternativas a ${worstCarrier} para rutas críticas`,
    };
  }

  private detectProblematicCity(shipments: UnifiedShipment[]): DetectedPattern | null {
    const cityStats: Record<string, { total: number; issues: number }> = {};

    shipments.forEach(s => {
      const city = s.destination.value;
      if (!cityStats[city]) {
        cityStats[city] = { total: 0, issues: 0 };
      }
      cityStats[city].total++;
      if (s.hasIssue || s.currentStatus.value === 'returned') {
        cityStats[city].issues++;
      }
    });

    let worstCity: string | null = null;
    let worstRate = 0;

    Object.entries(cityStats).forEach(([city, stats]) => {
      if (stats.total >= 3) {
        const rate = stats.issues / stats.total;
        if (rate > worstRate && rate > 0.25) {
          worstRate = rate;
          worstCity = city;
        }
      }
    });

    if (!worstCity) return null;

    const stats = cityStats[worstCity];
    return {
      id: `problematic_city_${worstCity.toLowerCase().replace(/[^a-z]/g, '_')}`,
      type: 'location_issues',
      name: `Problemas Frecuentes en ${worstCity}`,
      description: `${worstCity} tiene ${Math.round(worstRate * 100)}% de envíos con problemas`,
      confidence: Math.min(90, 55 + stats.total * 3),
      occurrences: stats.issues,
      lastSeen: new Date(),
      data: {
        city: worstCity,
        issueRate: worstRate,
        totalShipments: stats.total,
        issueShipments: stats.issues,
      },
      actionable: true,
      suggestedAction: `Verificar direcciones y contactos en ${worstCity} antes de enviar`,
    };
  }

  private detectBestDeliveryDay(shipments: UnifiedShipment[]): DetectedPattern | null {
    const dayStats: Record<number, { total: number; delivered: number }> = {};
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    shipments.forEach(s => {
      if (s.actualDelivery) {
        const day = s.actualDelivery.getDay();
        if (!dayStats[day]) {
          dayStats[day] = { total: 0, delivered: 0 };
        }
        dayStats[day].total++;
        if (s.currentStatus.value === 'delivered') {
          dayStats[day].delivered++;
        }
      }
    });

    let bestDay: number | null = null;
    let bestRate = 0;

    Object.entries(dayStats).forEach(([day, stats]) => {
      if (stats.total >= 5) {
        const rate = stats.delivered / stats.total;
        if (rate > bestRate) {
          bestRate = rate;
          bestDay = parseInt(day);
        }
      }
    });

    if (bestDay === null) return null;

    const stats = dayStats[bestDay];
    return {
      id: `best_delivery_day_${bestDay}`,
      type: 'time_optimization',
      name: `${dayNames[bestDay]} es el Mejor Día`,
      description: `Los ${dayNames[bestDay]} tienen ${Math.round(bestRate * 100)}% de entregas exitosas`,
      confidence: Math.min(85, 50 + stats.total),
      occurrences: stats.delivered,
      lastSeen: new Date(),
      data: {
        dayOfWeek: bestDay,
        dayName: dayNames[bestDay],
        successRate: bestRate,
        totalDeliveries: stats.total,
      },
      actionable: true,
      suggestedAction: `Priorizar entregas importantes para ${dayNames[bestDay]}`,
    };
  }

  private detectStalledShipments(shipments: UnifiedShipment[]): DetectedPattern | null {
    const now = new Date();
    const stalled = shipments.filter(s => {
      if (s.currentStatus.value === 'delivered' || s.currentStatus.value === 'returned') {
        return false;
      }
      const hoursSinceUpdate = (now.getTime() - s.lastUpdate.getTime()) / (1000 * 60 * 60);
      return hoursSinceUpdate > 72; // Más de 3 días sin actualización
    });

    if (stalled.length === 0) return null;

    return {
      id: `stalled_shipments_${Date.now()}`,
      type: 'status_alert',
      name: `${stalled.length} Envíos Estancados`,
      description: `Hay ${stalled.length} envíos sin actualización en más de 72 horas`,
      confidence: 95,
      occurrences: stalled.length,
      lastSeen: new Date(),
      data: {
        stalledCount: stalled.length,
        shipmentIds: stalled.map(s => s.id),
        trackingNumbers: stalled.map(s => s.trackingNumber),
      },
      actionable: true,
      suggestedAction: 'Contactar transportadoras para verificar estado de estos envíos',
    };
  }

  private detectHighReturnProduct(shipments: UnifiedShipment[]): DetectedPattern | null {
    const productStats: Record<string, { total: number; returned: number }> = {};

    shipments.forEach(s => {
      if (s.product?.name) {
        const product = s.product.name.value;
        if (!productStats[product]) {
          productStats[product] = { total: 0, returned: 0 };
        }
        productStats[product].total++;
        if (s.currentStatus.value === 'returned') {
          productStats[product].returned++;
        }
      }
    });

    let worstProduct: string | null = null;
    let worstRate = 0;

    Object.entries(productStats).forEach(([product, stats]) => {
      if (stats.total >= 3) {
        const rate = stats.returned / stats.total;
        if (rate > worstRate && rate > 0.2) {
          worstRate = rate;
          worstProduct = product;
        }
      }
    });

    if (!worstProduct) return null;

    const stats = productStats[worstProduct];
    return {
      id: `high_return_${worstProduct.toLowerCase().replace(/\s/g, '_').slice(0, 20)}`,
      type: 'product_issues',
      name: `Alta Devolución: ${worstProduct.slice(0, 30)}`,
      description: `${worstProduct} tiene ${Math.round(worstRate * 100)}% de devoluciones`,
      confidence: Math.min(85, 50 + stats.total * 5),
      occurrences: stats.returned,
      lastSeen: new Date(),
      data: {
        product: worstProduct,
        returnRate: worstRate,
        totalSold: stats.total,
        totalReturned: stats.returned,
      },
      actionable: true,
      suggestedAction: 'Revisar descripción del producto y expectativas del cliente',
    };
  }

  private detectOptimalPickupTime(shipments: UnifiedShipment[]): DetectedPattern | null {
    // Agrupar por hora de creación y calcular tiempo promedio de tránsito
    const hourStats: Record<number, { totalDays: number; count: number }> = {};

    shipments.forEach(s => {
      if (s.actualDelivery && s.createdAt) {
        const hour = s.createdAt.getHours();
        const daysInTransit = Math.ceil(
          (s.actualDelivery.getTime() - s.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (!hourStats[hour]) {
          hourStats[hour] = { totalDays: 0, count: 0 };
        }
        hourStats[hour].totalDays += daysInTransit;
        hourStats[hour].count++;
      }
    });

    let bestHour: number | null = null;
    let bestAvg = Infinity;

    Object.entries(hourStats).forEach(([hour, stats]) => {
      if (stats.count >= 5) {
        const avg = stats.totalDays / stats.count;
        if (avg < bestAvg) {
          bestAvg = avg;
          bestHour = parseInt(hour);
        }
      }
    });

    if (bestHour === null) return null;

    const stats = hourStats[bestHour];
    const timeRange = `${bestHour}:00 - ${bestHour + 1}:00`;

    return {
      id: `optimal_pickup_${bestHour}`,
      type: 'time_optimization',
      name: `Mejor Horario de Creación: ${timeRange}`,
      description: `Pedidos creados a las ${timeRange} llegan ${bestAvg.toFixed(1)} días más rápido`,
      confidence: Math.min(80, 45 + stats.count * 2),
      occurrences: stats.count,
      lastSeen: new Date(),
      data: {
        optimalHour: bestHour,
        averageTransitDays: bestAvg,
        sampleSize: stats.count,
      },
      actionable: true,
      suggestedAction: `Crear pedidos entre ${timeRange} para tiempos de entrega óptimos`,
    };
  }

  /**
   * Agregar regla de patrón personalizada
   */
  addCustomRule(rule: PatternRule): void {
    this.rules.push(rule);
  }
}

// Singleton
export const patternDetector = new PatternDetectorService();
export default patternDetector;
