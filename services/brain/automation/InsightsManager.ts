// services/brain/automation/InsightsManager.ts
// Gestiona insights y recomendaciones del sistema

import { Insight, UnifiedShipment } from '../types/brain.types';
import { eventBus } from '../core/EventBus';
import { memoryManager } from '../core/MemoryManager';
import { knowledgeHub } from '../knowledge/KnowledgeHub';
import { centralBrain } from '../core/CentralBrain';

export interface InsightGenerator {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  generator: (shipments: UnifiedShipment[]) => Insight | null;
  minShipments: number;
  cooldownHours: number;
  lastGenerated?: Date;
}

class InsightsManagerService {
  private insights: Map<string, Insight> = new Map();
  private generators: InsightGenerator[] = [];
  private dismissedInsightIds: Set<string> = new Set();

  constructor() {
    this.initializeGenerators();
    this.setupPeriodicGeneration();
  }

  /**
   * Inicializar generadores de insights
   */
  private initializeGenerators(): void {
    this.generators = [
      // Insight: Rendimiento general
      {
        id: 'performance_summary',
        name: 'Resumen de Rendimiento',
        description: 'Resumen del rendimiento general de entregas',
        enabled: true,
        minShipments: 10,
        cooldownHours: 24,
        generator: (shipments) => this.generatePerformanceSummary(shipments),
      },

      // Insight: Mejor transportadora
      {
        id: 'best_carrier',
        name: 'Mejor Transportadora',
        description: 'Identifica la transportadora con mejor rendimiento',
        enabled: true,
        minShipments: 20,
        cooldownHours: 48,
        generator: (shipments) => this.generateBestCarrierInsight(shipments),
      },

      // Insight: Envíos en riesgo
      {
        id: 'at_risk_shipments',
        name: 'Envíos en Riesgo',
        description: 'Alerta sobre envíos que pueden tener problemas',
        enabled: true,
        minShipments: 5,
        cooldownHours: 6,
        generator: (shipments) => this.generateAtRiskInsight(shipments),
      },

      // Insight: Tendencia semanal
      {
        id: 'weekly_trend',
        name: 'Tendencia Semanal',
        description: 'Comparación con la semana anterior',
        enabled: true,
        minShipments: 20,
        cooldownHours: 168, // 1 semana
        generator: (shipments) => this.generateWeeklyTrendInsight(shipments),
      },

      // Insight: Oportunidad de mejora
      {
        id: 'improvement_opportunity',
        name: 'Oportunidad de Mejora',
        description: 'Sugiere áreas donde se puede mejorar',
        enabled: true,
        minShipments: 15,
        cooldownHours: 72,
        generator: (shipments) => this.generateImprovementInsight(shipments),
      },

      // Insight: Logro de entrega
      {
        id: 'delivery_milestone',
        name: 'Hito de Entregas',
        description: 'Celebra logros de entrega',
        enabled: true,
        minShipments: 50,
        cooldownHours: 24,
        generator: (shipments) => this.generateMilestoneInsight(shipments),
      },
    ];
  }

  /**
   * Configurar generación periódica
   */
  private setupPeriodicGeneration(): void {
    // Generar insights cada hora
    setInterval(() => {
      this.generateAllInsights();
    }, 60 * 60 * 1000);
  }

  /**
   * Generar todos los insights
   */
  generateAllInsights(): Insight[] {
    const shipments = centralBrain.getShipments();
    const generated: Insight[] = [];
    const now = new Date();

    for (const generator of this.generators) {
      if (!generator.enabled) continue;
      if (shipments.length < generator.minShipments) continue;

      // Verificar cooldown
      if (generator.lastGenerated) {
        const hoursSinceGeneration =
          (now.getTime() - generator.lastGenerated.getTime()) / (1000 * 60 * 60);
        if (hoursSinceGeneration < generator.cooldownHours) continue;
      }

      try {
        const insight = generator.generator(shipments);
        if (insight && !this.dismissedInsightIds.has(insight.id)) {
          this.insights.set(insight.id, insight);
          generated.push(insight);
          generator.lastGenerated = now;

          // Guardar en memoria
          memoryManager.remember(`insight_${insight.id}`, insight, {
            type: 'SHORT_TERM',
            importance: insight.type === 'critical' ? 90 : 60,
          });
        }
      } catch (error) {
        console.error(`Error generating insight ${generator.id}:`, error);
      }
    }

    if (generated.length > 0) {
      eventBus.emit('learning.updated', {
        insightsGenerated: generated.length,
        insightTypes: generated.map(i => i.category),
      });
    }

    return generated;
  }

  // ==================== GENERADORES DE INSIGHTS ====================

  private generatePerformanceSummary(shipments: UnifiedShipment[]): Insight | null {
    const delivered = shipments.filter(s => s.currentStatus.value === 'delivered').length;
    const issues = shipments.filter(s => s.hasIssue).length;
    const successRate = (delivered / shipments.length) * 100;

    let type: Insight['type'] = 'info';
    if (successRate >= 90) type = 'success';
    else if (successRate < 70) type = 'warning';
    else if (successRate < 50) type = 'critical';

    return {
      id: `performance_${Date.now()}`,
      type,
      category: 'performance',
      title: 'Rendimiento de Entregas',
      description: `Tasa de entrega exitosa: ${successRate.toFixed(1)}% (${delivered}/${shipments.length} envíos)`,
      data: {
        successRate,
        delivered,
        total: shipments.length,
        issues,
      },
      actionable: successRate < 80,
      suggestedAction:
        successRate < 80
          ? 'Revisar envíos con problemas para identificar patrones'
          : undefined,
      createdAt: new Date(),
      dismissed: false,
    };
  }

  private generateBestCarrierInsight(shipments: UnifiedShipment[]): Insight | null {
    const carrierStats: Record<string, { delivered: number; total: number; avgDays: number }> = {};

    shipments.forEach(s => {
      const carrier = s.carrier.value;
      if (!carrierStats[carrier]) {
        carrierStats[carrier] = { delivered: 0, total: 0, avgDays: 0 };
      }
      carrierStats[carrier].total++;
      if (s.currentStatus.value === 'delivered') {
        carrierStats[carrier].delivered++;
        carrierStats[carrier].avgDays += s.daysInTransit;
      }
    });

    // Encontrar mejor transportadora
    let best: { name: string; rate: number; avgDays: number } | null = null;

    Object.entries(carrierStats).forEach(([carrier, stats]) => {
      if (stats.total >= 5) {
        const rate = (stats.delivered / stats.total) * 100;
        const avgDays = stats.delivered > 0 ? stats.avgDays / stats.delivered : 0;
        if (!best || rate > best.rate) {
          best = { name: carrier, rate, avgDays };
        }
      }
    });

    if (!best) return null;

    return {
      id: `best_carrier_${Date.now()}`,
      type: 'success',
      category: 'carrier_performance',
      title: `${best.name} es tu Mejor Transportadora`,
      description: `${best.name} tiene ${best.rate.toFixed(1)}% de entregas exitosas con promedio de ${best.avgDays.toFixed(1)} días`,
      data: {
        carrier: best.name,
        successRate: best.rate,
        averageDays: best.avgDays,
        carrierStats,
      },
      actionable: true,
      suggestedAction: `Considera usar ${best.name} para envíos prioritarios`,
      createdAt: new Date(),
      dismissed: false,
    };
  }

  private generateAtRiskInsight(shipments: UnifiedShipment[]): Insight | null {
    const atRisk = shipments.filter(
      s =>
        s.currentStatus.value !== 'delivered' &&
        s.currentStatus.value !== 'returned' &&
        (s.daysInTransit > 5 || s.hasIssue)
    );

    if (atRisk.length === 0) return null;

    return {
      id: `at_risk_${Date.now()}`,
      type: atRisk.length > 5 ? 'critical' : 'warning',
      category: 'risk',
      title: `${atRisk.length} Envíos Requieren Atención`,
      description: `Hay ${atRisk.length} envíos que podrían tener problemas de entrega`,
      data: {
        count: atRisk.length,
        shipments: atRisk.slice(0, 5).map(s => ({
          trackingNumber: s.trackingNumber,
          daysInTransit: s.daysInTransit,
          hasIssue: s.hasIssue,
        })),
      },
      actionable: true,
      suggestedAction: 'Revisar envíos en riesgo y contactar transportadoras',
      createdAt: new Date(),
      dismissed: false,
    };
  }

  private generateWeeklyTrendInsight(shipments: UnifiedShipment[]): Insight | null {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const thisWeek = shipments.filter(s => s.createdAt >= oneWeekAgo);
    const lastWeek = shipments.filter(
      s => s.createdAt >= twoWeeksAgo && s.createdAt < oneWeekAgo
    );

    if (lastWeek.length < 5) return null;

    const thisWeekDelivered = thisWeek.filter(
      s => s.currentStatus.value === 'delivered'
    ).length;
    const lastWeekDelivered = lastWeek.filter(
      s => s.currentStatus.value === 'delivered'
    ).length;

    const thisWeekRate = thisWeek.length > 0 ? (thisWeekDelivered / thisWeek.length) * 100 : 0;
    const lastWeekRate = lastWeek.length > 0 ? (lastWeekDelivered / lastWeek.length) * 100 : 0;
    const change = thisWeekRate - lastWeekRate;

    let type: Insight['type'] = 'info';
    if (change > 5) type = 'success';
    else if (change < -5) type = 'warning';

    return {
      id: `weekly_trend_${Date.now()}`,
      type,
      category: 'trend',
      title: change >= 0 ? 'Tendencia Positiva' : 'Tendencia a Mejorar',
      description: `Tasa de entrega ${change >= 0 ? 'subió' : 'bajó'} ${Math.abs(change).toFixed(1)}% vs semana anterior`,
      data: {
        thisWeekRate,
        lastWeekRate,
        change,
        thisWeekCount: thisWeek.length,
        lastWeekCount: lastWeek.length,
      },
      actionable: change < -5,
      suggestedAction: change < -5 ? 'Analizar causas de la disminución' : undefined,
      createdAt: new Date(),
      dismissed: false,
    };
  }

  private generateImprovementInsight(shipments: UnifiedShipment[]): Insight | null {
    // Analizar área de mayor oportunidad
    const issues = shipments.filter(s => s.hasIssue);
    const delayed = shipments.filter(s => s.isDelayed);
    const returned = shipments.filter(s => s.currentStatus.value === 'returned');

    let biggestIssue: { area: string; count: number; suggestion: string } | null = null;

    if (issues.length > returned.length && issues.length > delayed.length / 2) {
      biggestIssue = {
        area: 'Novedades',
        count: issues.length,
        suggestion: 'Verificar direcciones y datos de contacto antes de enviar',
      };
    } else if (returned.length > issues.length && returned.length > delayed.length / 2) {
      biggestIssue = {
        area: 'Devoluciones',
        count: returned.length,
        suggestion: 'Revisar calidad de productos y descripciones',
      };
    } else if (delayed.length >= 5) {
      biggestIssue = {
        area: 'Retrasos',
        count: delayed.length,
        suggestion: 'Considerar transportadoras más rápidas para rutas frecuentes',
      };
    }

    if (!biggestIssue) return null;

    return {
      id: `improvement_${Date.now()}`,
      type: 'info',
      category: 'improvement',
      title: `Oportunidad: Reducir ${biggestIssue.area}`,
      description: `${biggestIssue.count} envíos afectados por ${biggestIssue.area.toLowerCase()}`,
      data: {
        area: biggestIssue.area,
        count: biggestIssue.count,
        percentage: ((biggestIssue.count / shipments.length) * 100).toFixed(1),
      },
      actionable: true,
      suggestedAction: biggestIssue.suggestion,
      createdAt: new Date(),
      dismissed: false,
    };
  }

  private generateMilestoneInsight(shipments: UnifiedShipment[]): Insight | null {
    const delivered = shipments.filter(s => s.currentStatus.value === 'delivered').length;

    // Hitos: 50, 100, 250, 500, 1000, etc.
    const milestones = [50, 100, 250, 500, 1000, 2500, 5000, 10000];
    const recentMilestone = milestones.reverse().find(m => delivered >= m);

    if (!recentMilestone || delivered > recentMilestone * 1.1) return null;

    return {
      id: `milestone_${recentMilestone}_${Date.now()}`,
      type: 'success',
      category: 'milestone',
      title: `${recentMilestone} Envíos Entregados`,
      description: `Has alcanzado ${delivered} entregas exitosas. ¡Excelente trabajo!`,
      data: {
        milestone: recentMilestone,
        actual: delivered,
        total: shipments.length,
      },
      actionable: false,
      createdAt: new Date(),
      dismissed: false,
    };
  }

  // ==================== MÉTODOS PÚBLICOS ====================

  /**
   * Obtener insights activos
   */
  getActiveInsights(): Insight[] {
    return Array.from(this.insights.values())
      .filter(i => !i.dismissed)
      .sort((a, b) => {
        const typeOrder = { critical: 0, warning: 1, success: 2, info: 3 };
        return typeOrder[a.type] - typeOrder[b.type];
      });
  }

  /**
   * Obtener insight por ID
   */
  getInsight(insightId: string): Insight | undefined {
    return this.insights.get(insightId);
  }

  /**
   * Descartar insight
   */
  dismissInsight(insightId: string): boolean {
    const insight = this.insights.get(insightId);
    if (insight) {
      insight.dismissed = true;
      this.dismissedInsightIds.add(insightId);
      return true;
    }
    return false;
  }

  /**
   * Obtener estadísticas
   */
  getStats(): {
    totalInsights: number;
    activeInsights: number;
    byType: Record<string, number>;
    byCategory: Record<string, number>;
  } {
    const active = this.getActiveInsights();

    const byType: Record<string, number> = {};
    const byCategory: Record<string, number> = {};

    active.forEach(i => {
      byType[i.type] = (byType[i.type] || 0) + 1;
      byCategory[i.category] = (byCategory[i.category] || 0) + 1;
    });

    return {
      totalInsights: this.insights.size,
      activeInsights: active.length,
      byType,
      byCategory,
    };
  }
}

// Singleton
export const insightsManager = new InsightsManagerService();
export default insightsManager;
