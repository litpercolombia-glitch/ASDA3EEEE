// services/contextIntelligenceService.ts
// Servicio de Inteligencia Contextual - Genera insights y sugerencias proactivas
import { Shipment, ShipmentStatus, CarrierName } from '../types';

// ============================================
// TIPOS
// ============================================

export interface ContextInsight {
  id: string;
  type: 'alert' | 'recommendation' | 'trend' | 'anomaly' | 'achievement';
  severity: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  description: string;
  action?: {
    label: string;
    query: string;
  };
  data?: Record<string, any>;
  timestamp: Date;
}

export interface DailyBriefing {
  greeting: string;
  summary: string;
  keyMetrics: {
    total: number;
    delivered: number;
    deliveryRate: number;
    atRisk: number;
    issues: number;
  };
  criticalAlerts: ContextInsight[];
  recommendations: ContextInsight[];
  trends: ContextInsight[];
}

export interface ProactiveSuggestion {
  id: string;
  trigger: string;
  suggestion: string;
  query: string;
  priority: number;
  expiresAt?: Date;
}

// ============================================
// HELPERS
// ============================================

const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos dias';
  if (hour < 18) return 'Buenas tardes';
  return 'Buenas noches';
};

const getDayContext = (): string => {
  const day = new Date().getDay();
  const dayNames = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
  const isWeekend = day === 0 || day === 6;
  const isMonday = day === 1;
  const isFriday = day === 5;

  if (isWeekend) return 'Es fin de semana, el volumen suele ser menor.';
  if (isMonday) return 'Es lunes, tipicamente el dia con mas volumen de la semana.';
  if (isFriday) return 'Es viernes, buen momento para revisar metricas semanales.';
  return `Hoy es ${dayNames[day]}.`;
};

const generateId = () => `insight-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// ============================================
// ANALISIS DE DATOS
// ============================================

const analyzeShipments = (shipments: Shipment[]) => {
  const total = shipments.length;
  const delivered = shipments.filter(s => s.status === ShipmentStatus.DELIVERED).length;
  const inTransit = shipments.filter(s => s.status === ShipmentStatus.IN_TRANSIT).length;
  const pending = shipments.filter(s => s.status === ShipmentStatus.PENDING).length;
  const issues = shipments.filter(s =>
    s.status === ShipmentStatus.ISSUE ||
    s.status === ShipmentStatus.EXCEPTION
  ).length;

  // Envios en riesgo (mas de 3 dias o con novedad)
  const atRisk = shipments.filter(s => {
    if (s.status === ShipmentStatus.DELIVERED) return false;
    const days = s.detailedInfo?.daysInTransit || 0;
    return days >= 3 || s.status === ShipmentStatus.ISSUE;
  }).length;

  // Envios criticos (mas de 5 dias o devolucion)
  const critical = shipments.filter(s => {
    if (s.status === ShipmentStatus.DELIVERED) return false;
    const days = s.detailedInfo?.daysInTransit || 0;
    return days >= 5 || s.status === ShipmentStatus.RETURNED;
  }).length;

  const deliveryRate = total > 0 ? Math.round((delivered / total) * 100) : 0;

  // Agrupar por ciudad
  const byCity = new Map<string, Shipment[]>();
  shipments.forEach(s => {
    const city = s.detailedInfo?.destination?.split(',')[0]?.trim() || 'Sin ciudad';
    if (!byCity.has(city)) byCity.set(city, []);
    byCity.get(city)!.push(s);
  });

  // Agrupar por transportadora
  const byCarrier = new Map<string, Shipment[]>();
  shipments.forEach(s => {
    const carrier = s.carrier || 'Sin transportadora';
    if (!byCarrier.has(carrier)) byCarrier.set(carrier, []);
    byCarrier.get(carrier)!.push(s);
  });

  // Ciudades criticas
  const criticalCities: string[] = [];
  byCity.forEach((cityShipments, city) => {
    const cityIssues = cityShipments.filter(s =>
      s.status === ShipmentStatus.ISSUE || s.status === ShipmentStatus.EXCEPTION
    ).length;
    const issueRate = cityShipments.length > 0 ? (cityIssues / cityShipments.length) * 100 : 0;
    if (issueRate > 20 || cityIssues >= 5) {
      criticalCities.push(city);
    }
  });

  return {
    total,
    delivered,
    inTransit,
    pending,
    issues,
    atRisk,
    critical,
    deliveryRate,
    byCity,
    byCarrier,
    criticalCities,
  };
};

// ============================================
// GENERADORES DE INSIGHTS
// ============================================

const generateCriticalAlerts = (analysis: ReturnType<typeof analyzeShipments>): ContextInsight[] => {
  const alerts: ContextInsight[] = [];

  // Alerta de envios criticos
  if (analysis.critical > 0) {
    alerts.push({
      id: generateId(),
      type: 'alert',
      severity: 'critical',
      title: `${analysis.critical} envio${analysis.critical > 1 ? 's' : ''} critico${analysis.critical > 1 ? 's' : ''}`,
      description: `Hay envios con mas de 5 dias sin movimiento que requieren atencion inmediata.`,
      action: {
        label: 'Ver criticos',
        query: 'Muestrame los envios criticos con mas de 5 dias',
      },
      timestamp: new Date(),
    });
  }

  // Alerta de ciudades problematicas
  if (analysis.criticalCities.length > 0) {
    alerts.push({
      id: generateId(),
      type: 'alert',
      severity: 'warning',
      title: `${analysis.criticalCities.length} ciudad${analysis.criticalCities.length > 1 ? 'es' : ''} con problemas`,
      description: `${analysis.criticalCities.slice(0, 3).join(', ')}${analysis.criticalCities.length > 3 ? ' y mas' : ''} tienen alta tasa de novedades.`,
      action: {
        label: 'Analizar ciudades',
        query: `Analiza la situacion de ${analysis.criticalCities[0]}`,
      },
      data: { cities: analysis.criticalCities },
      timestamp: new Date(),
    });
  }

  // Alerta de tasa de entrega baja
  if (analysis.deliveryRate < 70 && analysis.total > 10) {
    alerts.push({
      id: generateId(),
      type: 'alert',
      severity: 'warning',
      title: 'Tasa de entrega baja',
      description: `Solo ${analysis.deliveryRate}% de entregas completadas. El objetivo es 85%+.`,
      action: {
        label: 'Ver detalles',
        query: 'Por que la tasa de entrega esta baja?',
      },
      timestamp: new Date(),
    });
  }

  return alerts;
};

const generateRecommendations = (analysis: ReturnType<typeof analyzeShipments>): ContextInsight[] => {
  const recommendations: ContextInsight[] = [];

  // Recomendacion de seguimiento
  if (analysis.atRisk > 0) {
    recommendations.push({
      id: generateId(),
      type: 'recommendation',
      severity: 'info',
      title: 'Seguimiento preventivo',
      description: `${analysis.atRisk} envios podrian retrasarse. Contactar clientes proactivamente.`,
      action: {
        label: 'Generar mensajes',
        query: 'Genera mensajes para clientes con envios en riesgo',
      },
      timestamp: new Date(),
    });
  }

  // Recomendacion de reporte
  if (analysis.total > 20) {
    recommendations.push({
      id: generateId(),
      type: 'recommendation',
      severity: 'info',
      title: 'Generar reporte',
      description: 'Tienes suficientes datos para un analisis detallado.',
      action: {
        label: 'Generar reporte',
        query: 'Genera el reporte ejecutivo del dia',
      },
      timestamp: new Date(),
    });
  }

  return recommendations;
};

const generateTrends = (analysis: ReturnType<typeof analyzeShipments>): ContextInsight[] => {
  const trends: ContextInsight[] = [];

  // Trend de rendimiento
  if (analysis.deliveryRate >= 85) {
    trends.push({
      id: generateId(),
      type: 'achievement',
      severity: 'success',
      title: 'Buen rendimiento!',
      description: `${analysis.deliveryRate}% de tasa de entrega. Excelente trabajo!`,
      timestamp: new Date(),
    });
  }

  // Trend de volumen
  if (analysis.total > 100) {
    trends.push({
      id: generateId(),
      type: 'trend',
      severity: 'info',
      title: 'Alto volumen',
      description: `Manejando ${analysis.total} envios activos.`,
      timestamp: new Date(),
    });
  }

  return trends;
};

// ============================================
// SERVICIO PRINCIPAL
// ============================================

export const contextIntelligenceService = {
  /**
   * Genera el briefing diario completo
   */
  generateDailyBriefing(shipments: Shipment[]): DailyBriefing {
    const analysis = analyzeShipments(shipments);
    const greeting = getGreeting();
    const dayContext = getDayContext();

    let summary = '';

    if (analysis.total === 0) {
      summary = `${greeting}! No tienes envios cargados todavia. Puedo ayudarte a cargar guias desde Excel o conectar con transportadoras.`;
    } else {
      summary = `${greeting}! Tienes **${analysis.total.toLocaleString()} envios activos** con ${analysis.deliveryRate}% de tasa de entrega.`;

      if (analysis.critical > 0) {
        summary += ` **Atencion:** ${analysis.critical} envios criticos necesitan revision inmediata.`;
      } else if (analysis.atRisk > 0) {
        summary += ` ${analysis.atRisk} envios estan en riesgo de retraso.`;
      } else {
        summary += ' Todo parece estar bajo control.';
      }

      summary += ` ${dayContext}`;
    }

    return {
      greeting,
      summary,
      keyMetrics: {
        total: analysis.total,
        delivered: analysis.delivered,
        deliveryRate: analysis.deliveryRate,
        atRisk: analysis.atRisk,
        issues: analysis.issues,
      },
      criticalAlerts: generateCriticalAlerts(analysis),
      recommendations: generateRecommendations(analysis),
      trends: generateTrends(analysis),
    };
  },

  /**
   * Genera sugerencias proactivas basadas en el contexto actual
   */
  generateProactiveSuggestions(shipments: Shipment[]): ProactiveSuggestion[] {
    const analysis = analyzeShipments(shipments);
    const suggestions: ProactiveSuggestion[] = [];
    const hour = new Date().getHours();

    // Sugerencia matutina
    if (hour >= 7 && hour <= 10) {
      suggestions.push({
        id: generateId(),
        trigger: 'morning',
        suggestion: 'Revisar el estado de envios del dia anterior',
        query: 'Dame un resumen de como quedo ayer',
        priority: 1,
      });
    }

    // Sugerencia de cierre de dia
    if (hour >= 16 && hour <= 18) {
      suggestions.push({
        id: generateId(),
        trigger: 'evening',
        suggestion: 'Generar reporte de cierre del dia',
        query: 'Genera el reporte de cierre del dia',
        priority: 1,
      });
    }

    // Sugerencia por envios criticos
    if (analysis.critical > 0) {
      suggestions.push({
        id: generateId(),
        trigger: 'critical_shipments',
        suggestion: `Atender ${analysis.critical} envios criticos`,
        query: 'Que envios necesitan atencion urgente?',
        priority: 0,
      });
    }

    // Sugerencia por ciudades problematicas
    if (analysis.criticalCities.length > 0) {
      suggestions.push({
        id: generateId(),
        trigger: 'critical_cities',
        suggestion: `Revisar situacion de ${analysis.criticalCities[0]}`,
        query: `Que esta pasando con los envios de ${analysis.criticalCities[0]}?`,
        priority: 1,
      });
    }

    // Ordenar por prioridad
    return suggestions.sort((a, b) => a.priority - b.priority);
  },

  /**
   * Genera insights en tiempo real basados en cambios
   */
  generateRealTimeInsights(
    currentShipments: Shipment[],
    previousShipments: Shipment[]
  ): ContextInsight[] {
    const insights: ContextInsight[] = [];
    const currentAnalysis = analyzeShipments(currentShipments);
    const previousAnalysis = analyzeShipments(previousShipments);

    // Detectar nuevos envios criticos
    const newCritical = currentAnalysis.critical - previousAnalysis.critical;
    if (newCritical > 0) {
      insights.push({
        id: generateId(),
        type: 'alert',
        severity: 'critical',
        title: 'Nuevos envios criticos',
        description: `${newCritical} envio${newCritical > 1 ? 's' : ''} acaba${newCritical > 1 ? 'n' : ''} de volverse critico${newCritical > 1 ? 's' : ''}.`,
        action: {
          label: 'Ver ahora',
          query: 'Muestrame los envios que acaban de volverse criticos',
        },
        timestamp: new Date(),
      });
    }

    // Detectar mejora en entregas
    const deliveryImprovement = currentAnalysis.delivered - previousAnalysis.delivered;
    if (deliveryImprovement >= 5) {
      insights.push({
        id: generateId(),
        type: 'achievement',
        severity: 'success',
        title: 'Entregas completadas',
        description: `${deliveryImprovement} envios fueron entregados exitosamente.`,
        timestamp: new Date(),
      });
    }

    return insights;
  },

  /**
   * Formatea el briefing como mensaje de chat
   */
  formatBriefingAsMessage(briefing: DailyBriefing): string {
    let message = briefing.summary + '\n';

    if (briefing.criticalAlerts.length > 0) {
      message += '\n**Alertas:**\n';
      briefing.criticalAlerts.forEach(alert => {
        const icon = alert.severity === 'critical' ? '🔴' : '⚠️';
        message += `${icon} ${alert.title}\n`;
      });
    }

    if (briefing.recommendations.length > 0) {
      message += '\n**Sugerencias:**\n';
      briefing.recommendations.slice(0, 2).forEach(rec => {
        message += `💡 ${rec.title}\n`;
      });
    }

    message += '\n¿Que te gustaria hacer?';

    return message;
  },

  /**
   * Analiza los datos y retorna metricas
   */
  analyzeShipments,
};

export default contextIntelligenceService;
