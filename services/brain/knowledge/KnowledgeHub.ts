// services/brain/knowledge/KnowledgeHub.ts
// Centro de conocimiento que coordina detección de patrones y aprendizaje

import { UnifiedShipment, DetectedPattern, Insight } from '../types/brain.types';
import { patternDetector } from './PatternDetector';
import { learningEngine, PredictionResult, LearningModel } from './LearningEngine';
import { centralBrain } from '../core/CentralBrain';
import { memoryManager } from '../core/MemoryManager';
import { eventBus } from '../core/EventBus';

export interface KnowledgeReport {
  generatedAt: Date;
  summary: {
    totalShipments: number;
    analyzedShipments: number;
    patternsFound: number;
    insightsGenerated: number;
    modelsAccuracy: number;
  };
  patterns: DetectedPattern[];
  insights: Insight[];
  predictions: {
    averageDeliveryTime: number;
    expectedSuccessRate: number;
    highRiskShipments: number;
  };
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    category: string;
    title: string;
    description: string;
    action: string;
  }>;
}

class KnowledgeHubService {
  private insights: Map<string, Insight> = new Map();
  private lastAnalysis: Date | null = null;

  /**
   * Ejecutar análisis completo de conocimiento
   */
  analyze(): KnowledgeReport {
    const shipments = centralBrain.getShipments();

    // Entrenar modelos
    learningEngine.train(shipments);

    // Detectar patrones
    const patterns = patternDetector.detectPatterns(shipments);

    // Generar insights
    const insights = this.generateInsights(shipments, patterns);

    // Calcular predicciones agregadas
    const predictions = this.calculateAggregatedPredictions(shipments);

    // Generar recomendaciones
    const recommendations = this.generateRecommendations(patterns, insights);

    // Crear reporte
    const report: KnowledgeReport = {
      generatedAt: new Date(),
      summary: {
        totalShipments: shipments.length,
        analyzedShipments: shipments.length,
        patternsFound: patterns.length,
        insightsGenerated: insights.length,
        modelsAccuracy: learningEngine.getStats().averageAccuracy,
      },
      patterns,
      insights,
      predictions,
      recommendations,
    };

    // Guardar en memoria
    memoryManager.remember('knowledge_report', report, {
      type: 'MEDIUM_TERM',
      importance: 90,
    });

    this.lastAnalysis = new Date();

    // Emitir evento
    eventBus.emit('learning.updated', {
      patternsFound: patterns.length,
      insightsGenerated: insights.length,
    });

    return report;
  }

  /**
   * Generar insights basados en datos y patrones
   */
  private generateInsights(
    shipments: UnifiedShipment[],
    patterns: DetectedPattern[]
  ): Insight[] {
    const insights: Insight[] = [];

    // Insight: Resumen de rendimiento general
    const delivered = shipments.filter(s => s.currentStatus.value === 'delivered').length;
    const successRate = shipments.length > 0 ? (delivered / shipments.length) * 100 : 0;

    insights.push({
      id: `insight_performance_${Date.now()}`,
      type: successRate >= 80 ? 'success' : successRate >= 60 ? 'warning' : 'critical',
      category: 'performance',
      title: 'Tasa de Entrega Exitosa',
      description: `${successRate.toFixed(1)}% de los envíos han sido entregados exitosamente`,
      data: { successRate, delivered, total: shipments.length },
      actionable: successRate < 80,
      suggestedAction:
        successRate < 80
          ? 'Revisar envíos con problemas para identificar causas comunes'
          : undefined,
      createdAt: new Date(),
      dismissed: false,
    });

    // Insight: Envíos activos que requieren atención
    const activeIssues = shipments.filter(s => s.hasIssue && s.currentStatus.value !== 'delivered');
    if (activeIssues.length > 0) {
      insights.push({
        id: `insight_issues_${Date.now()}`,
        type: 'critical',
        category: 'issues',
        title: `${activeIssues.length} Envíos con Novedad`,
        description: `Hay ${activeIssues.length} envíos activos con novedades que requieren atención`,
        data: {
          count: activeIssues.length,
          trackingNumbers: activeIssues.slice(0, 5).map(s => s.trackingNumber),
        },
        actionable: true,
        suggestedAction: 'Contactar transportadoras para resolver novedades',
        createdAt: new Date(),
        dismissed: false,
      });
    }

    // Insight: Tiempo promedio de entrega
    const deliveredShipments = shipments.filter(
      s => s.currentStatus.value === 'delivered' && s.actualDelivery
    );
    if (deliveredShipments.length >= 5) {
      const avgDays =
        deliveredShipments.reduce((sum, s) => sum + s.daysInTransit, 0) /
        deliveredShipments.length;

      insights.push({
        id: `insight_delivery_time_${Date.now()}`,
        type: avgDays <= 4 ? 'success' : avgDays <= 6 ? 'info' : 'warning',
        category: 'delivery_time',
        title: 'Tiempo Promedio de Entrega',
        description: `Los envíos tardan en promedio ${avgDays.toFixed(1)} días en llegar`,
        data: { averageDays: avgDays, sampleSize: deliveredShipments.length },
        actionable: avgDays > 5,
        suggestedAction:
          avgDays > 5
            ? 'Considerar transportadoras más rápidas para rutas frecuentes'
            : undefined,
        createdAt: new Date(),
        dismissed: false,
      });
    }

    // Insights desde patrones detectados
    patterns.forEach(pattern => {
      if (pattern.actionable && pattern.confidence >= 70) {
        insights.push({
          id: `insight_pattern_${pattern.id}`,
          type: pattern.type.includes('issue') ? 'warning' : 'info',
          category: 'pattern',
          title: pattern.name,
          description: pattern.description,
          data: pattern.data,
          actionable: true,
          suggestedAction: pattern.suggestedAction,
          createdAt: new Date(),
          dismissed: false,
        });
      }
    });

    // Guardar insights
    insights.forEach(i => this.insights.set(i.id, i));

    return insights;
  }

  /**
   * Calcular predicciones agregadas
   */
  private calculateAggregatedPredictions(shipments: UnifiedShipment[]): {
    averageDeliveryTime: number;
    expectedSuccessRate: number;
    highRiskShipments: number;
  } {
    // Envíos activos (no entregados ni devueltos)
    const activeShipments = shipments.filter(
      s =>
        s.currentStatus.value !== 'delivered' &&
        s.currentStatus.value !== 'returned' &&
        s.currentStatus.value !== 'cancelled'
    );

    let totalDeliveryDays = 0;
    let totalSuccessRate = 0;
    let highRiskCount = 0;

    activeShipments.forEach(s => {
      // Predicción de tiempo
      const timePrediction = learningEngine.predictDeliveryTime(
        s.carrier.value,
        s.destination.value,
        s.createdAt
      );
      totalDeliveryDays += timePrediction.value;

      // Predicción de éxito
      const successPrediction = learningEngine.predictSuccessRate(
        s.carrier.value,
        s.destination.value
      );
      totalSuccessRate += successPrediction.value;

      // Predicción de riesgo
      const riskPrediction = learningEngine.predictIssueRisk({
        carrier: s.carrier.value,
        destination: s.destination.value,
        daysInTransit: s.daysInTransit,
      });
      if (riskPrediction.value > 0.4) highRiskCount++;
    });

    return {
      averageDeliveryTime:
        activeShipments.length > 0 ? totalDeliveryDays / activeShipments.length : 0,
      expectedSuccessRate:
        activeShipments.length > 0 ? totalSuccessRate / activeShipments.length : 0,
      highRiskShipments: highRiskCount,
    };
  }

  /**
   * Generar recomendaciones basadas en análisis
   */
  private generateRecommendations(
    patterns: DetectedPattern[],
    insights: Insight[]
  ): KnowledgeReport['recommendations'] {
    const recommendations: KnowledgeReport['recommendations'] = [];

    // Recomendaciones basadas en patrones de alta confianza
    patterns
      .filter(p => p.confidence >= 75 && p.actionable)
      .forEach(pattern => {
        let priority: 'high' | 'medium' | 'low' = 'medium';
        if (pattern.type.includes('issue') || pattern.confidence >= 90) {
          priority = 'high';
        } else if (pattern.confidence < 80) {
          priority = 'low';
        }

        recommendations.push({
          priority,
          category: pattern.type,
          title: pattern.name,
          description: pattern.description,
          action: pattern.suggestedAction || 'Revisar y tomar acción',
        });
      });

    // Recomendaciones basadas en insights críticos
    insights
      .filter(i => i.type === 'critical' && i.actionable)
      .forEach(insight => {
        recommendations.push({
          priority: 'high',
          category: insight.category,
          title: insight.title,
          description: insight.description,
          action: insight.suggestedAction || 'Acción inmediata requerida',
        });
      });

    // Ordenar por prioridad
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return recommendations;
  }

  /**
   * Obtener predicción para un envío específico
   */
  getPredictionForShipment(shipmentId: string): {
    deliveryTime: PredictionResult;
    successRate: PredictionResult;
    issueRisk: PredictionResult;
  } | null {
    const shipment = centralBrain.getShipment(shipmentId);
    if (!shipment) return null;

    return {
      deliveryTime: learningEngine.predictDeliveryTime(
        shipment.carrier.value,
        shipment.destination.value,
        shipment.createdAt
      ),
      successRate: learningEngine.predictSuccessRate(
        shipment.carrier.value,
        shipment.destination.value
      ),
      issueRisk: learningEngine.predictIssueRisk({
        carrier: shipment.carrier.value,
        destination: shipment.destination.value,
        daysInTransit: shipment.daysInTransit,
      }),
    };
  }

  /**
   * Obtener insights activos
   */
  getActiveInsights(): Insight[] {
    return Array.from(this.insights.values()).filter(i => !i.dismissed);
  }

  /**
   * Descartar un insight
   */
  dismissInsight(insightId: string): void {
    const insight = this.insights.get(insightId);
    if (insight) {
      insight.dismissed = true;
    }
  }

  /**
   * Obtener patrones detectados
   */
  getPatterns(): DetectedPattern[] {
    return patternDetector.getPatterns();
  }

  /**
   * Obtener modelos de aprendizaje
   */
  getLearningModels(): LearningModel[] {
    return learningEngine.getModels();
  }

  /**
   * Obtener última fecha de análisis
   */
  getLastAnalysisDate(): Date | null {
    return this.lastAnalysis;
  }

  /**
   * Verificar si necesita re-análisis
   */
  needsReanalysis(): boolean {
    if (!this.lastAnalysis) return true;
    const hoursSinceAnalysis =
      (new Date().getTime() - this.lastAnalysis.getTime()) / (1000 * 60 * 60);
    return hoursSinceAnalysis > 4; // Re-analizar cada 4 horas
  }
}

// Singleton
export const knowledgeHub = new KnowledgeHubService();
export default knowledgeHub;
