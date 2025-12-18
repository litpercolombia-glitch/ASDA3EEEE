// services/brain/knowledge/LearningEngine.ts
// Motor de aprendizaje para mejorar predicciones basadas en datos históricos

import { UnifiedShipment, ShipmentStatus } from '../types/brain.types';
import { memoryManager } from '../core/MemoryManager';
import { eventBus } from '../core/EventBus';

export interface LearningModel {
  id: string;
  name: string;
  type: 'delivery_time' | 'success_rate' | 'issue_prediction' | 'carrier_performance';
  version: number;
  trainedAt: Date;
  accuracy: number;
  sampleSize: number;
  parameters: Record<string, number>;
}

export interface PredictionResult {
  value: number;
  confidence: number;
  factors: Array<{ name: string; impact: number }>;
  modelUsed: string;
}

class LearningEngineService {
  private models: Map<string, LearningModel> = new Map();
  private trainingData: UnifiedShipment[] = [];

  constructor() {
    this.initializeModels();
  }

  /**
   * Inicializar modelos base
   */
  private initializeModels(): void {
    // Modelo de tiempo de entrega
    this.models.set('delivery_time', {
      id: 'delivery_time',
      name: 'Predictor de Tiempo de Entrega',
      type: 'delivery_time',
      version: 1,
      trainedAt: new Date(),
      accuracy: 70,
      sampleSize: 0,
      parameters: {
        baseDeliveryDays: 4,
        carrierAdjustment: 0,
        cityAdjustment: 0,
        dayOfWeekAdjustment: 0,
      },
    });

    // Modelo de tasa de éxito
    this.models.set('success_rate', {
      id: 'success_rate',
      name: 'Predictor de Éxito de Entrega',
      type: 'success_rate',
      version: 1,
      trainedAt: new Date(),
      accuracy: 65,
      sampleSize: 0,
      parameters: {
        baseSuccessRate: 0.85,
        carrierFactor: 0,
        cityFactor: 0,
        productFactor: 0,
      },
    });

    // Modelo de predicción de problemas
    this.models.set('issue_prediction', {
      id: 'issue_prediction',
      name: 'Predictor de Problemas',
      type: 'issue_prediction',
      version: 1,
      trainedAt: new Date(),
      accuracy: 60,
      sampleSize: 0,
      parameters: {
        baseIssueRate: 0.15,
        carrierRiskFactor: 0,
        cityRiskFactor: 0,
        transitDaysThreshold: 5,
      },
    });
  }

  /**
   * Entrenar modelos con datos históricos
   */
  train(shipments: UnifiedShipment[]): void {
    this.trainingData = shipments;
    const completedShipments = shipments.filter(
      s => s.currentStatus.value === 'delivered' || s.currentStatus.value === 'returned'
    );

    if (completedShipments.length < 10) {
      console.log('Insuficientes datos para entrenar (mínimo 10 envíos completados)');
      return;
    }

    this.trainDeliveryTimeModel(completedShipments);
    this.trainSuccessRateModel(completedShipments);
    this.trainIssuePredictionModel(shipments);

    // Guardar en memoria
    this.models.forEach((model, id) => {
      memoryManager.remember(`model_${id}`, model, {
        type: 'LONG_TERM',
        importance: 95,
      });
    });

    eventBus.emit('learning.updated', {
      modelsUpdated: Array.from(this.models.keys()),
      sampleSize: completedShipments.length,
    });
  }

  /**
   * Entrenar modelo de tiempo de entrega
   */
  private trainDeliveryTimeModel(shipments: UnifiedShipment[]): void {
    const deliveredShipments = shipments.filter(
      s => s.currentStatus.value === 'delivered' && s.actualDelivery
    );

    if (deliveredShipments.length < 5) return;

    // Calcular tiempo promedio de entrega
    const deliveryTimes = deliveredShipments.map(s => {
      const startDate = s.createdAt;
      const endDate = s.actualDelivery!;
      return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    });

    const avgDeliveryTime = deliveryTimes.reduce((a, b) => a + b, 0) / deliveryTimes.length;

    // Calcular ajustes por transportadora
    const carrierTimes: Record<string, number[]> = {};
    deliveredShipments.forEach(s => {
      const carrier = s.carrier.value;
      if (!carrierTimes[carrier]) carrierTimes[carrier] = [];
      const time = Math.ceil(
        (s.actualDelivery!.getTime() - s.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      carrierTimes[carrier].push(time);
    });

    // Actualizar modelo
    const model = this.models.get('delivery_time')!;
    model.parameters.baseDeliveryDays = avgDeliveryTime;
    model.sampleSize = deliveredShipments.length;
    model.version++;
    model.trainedAt = new Date();
    model.accuracy = Math.min(90, 65 + Math.log10(deliveredShipments.length) * 10);
  }

  /**
   * Entrenar modelo de tasa de éxito
   */
  private trainSuccessRateModel(shipments: UnifiedShipment[]): void {
    const deliveredCount = shipments.filter(s => s.currentStatus.value === 'delivered').length;
    const successRate = deliveredCount / shipments.length;

    // Calcular por transportadora
    const carrierSuccess: Record<string, { success: number; total: number }> = {};
    shipments.forEach(s => {
      const carrier = s.carrier.value;
      if (!carrierSuccess[carrier]) carrierSuccess[carrier] = { success: 0, total: 0 };
      carrierSuccess[carrier].total++;
      if (s.currentStatus.value === 'delivered') {
        carrierSuccess[carrier].success++;
      }
    });

    // Actualizar modelo
    const model = this.models.get('success_rate')!;
    model.parameters.baseSuccessRate = successRate;
    model.sampleSize = shipments.length;
    model.version++;
    model.trainedAt = new Date();
    model.accuracy = Math.min(88, 60 + Math.log10(shipments.length) * 12);
  }

  /**
   * Entrenar modelo de predicción de problemas
   */
  private trainIssuePredictionModel(shipments: UnifiedShipment[]): void {
    const issueCount = shipments.filter(s => s.hasIssue).length;
    const issueRate = issueCount / shipments.length;

    // Encontrar umbral de días en tránsito donde aumentan problemas
    const issuesByDays: Record<number, { issues: number; total: number }> = {};
    shipments.forEach(s => {
      const days = s.daysInTransit;
      if (!issuesByDays[days]) issuesByDays[days] = { issues: 0, total: 0 };
      issuesByDays[days].total++;
      if (s.hasIssue) issuesByDays[days].issues++;
    });

    // Encontrar punto donde la tasa de problemas supera el 30%
    let threshold = 7;
    for (const [days, stats] of Object.entries(issuesByDays)) {
      if (stats.total >= 3 && stats.issues / stats.total > 0.3) {
        threshold = Math.min(threshold, parseInt(days));
      }
    }

    const model = this.models.get('issue_prediction')!;
    model.parameters.baseIssueRate = issueRate;
    model.parameters.transitDaysThreshold = threshold;
    model.sampleSize = shipments.length;
    model.version++;
    model.trainedAt = new Date();
    model.accuracy = Math.min(82, 55 + Math.log10(shipments.length) * 10);
  }

  /**
   * Predecir tiempo de entrega para un nuevo envío
   */
  predictDeliveryTime(
    carrier: string,
    destination: string,
    createdAt: Date
  ): PredictionResult {
    const model = this.models.get('delivery_time')!;
    const factors: Array<{ name: string; impact: number }> = [];

    let predictedDays = model.parameters.baseDeliveryDays;

    // Ajuste por día de la semana
    const dayOfWeek = createdAt.getDay();
    if (dayOfWeek === 5 || dayOfWeek === 6) {
      // Viernes o Sábado
      predictedDays += 1;
      factors.push({ name: 'Fin de semana', impact: 1 });
    }

    // Ajuste por transportadora (usando datos de entrenamiento)
    const carrierShipments = this.trainingData.filter(
      s =>
        s.carrier.value === carrier &&
        s.currentStatus.value === 'delivered' &&
        s.actualDelivery
    );
    if (carrierShipments.length >= 3) {
      const avgCarrierTime =
        carrierShipments.reduce((sum, s) => {
          return (
            sum +
            Math.ceil(
              (s.actualDelivery!.getTime() - s.createdAt.getTime()) / (1000 * 60 * 60 * 24)
            )
          );
        }, 0) / carrierShipments.length;
      const carrierAdjustment = avgCarrierTime - model.parameters.baseDeliveryDays;
      if (Math.abs(carrierAdjustment) > 0.5) {
        predictedDays += carrierAdjustment;
        factors.push({
          name: `Historial ${carrier}`,
          impact: carrierAdjustment,
        });
      }
    }

    return {
      value: Math.round(predictedDays * 10) / 10,
      confidence: model.accuracy,
      factors,
      modelUsed: model.id,
    };
  }

  /**
   * Predecir probabilidad de éxito de entrega
   */
  predictSuccessRate(
    carrier: string,
    destination: string
  ): PredictionResult {
    const model = this.models.get('success_rate')!;
    const factors: Array<{ name: string; impact: number }> = [];

    let probability = model.parameters.baseSuccessRate;

    // Ajuste por transportadora
    const carrierShipments = this.trainingData.filter(s => s.carrier.value === carrier);
    if (carrierShipments.length >= 5) {
      const carrierSuccessRate =
        carrierShipments.filter(s => s.currentStatus.value === 'delivered').length /
        carrierShipments.length;
      const adjustment = carrierSuccessRate - model.parameters.baseSuccessRate;
      probability += adjustment * 0.7;
      factors.push({
        name: `Rendimiento ${carrier}`,
        impact: adjustment * 100,
      });
    }

    // Ajuste por destino
    const destShipments = this.trainingData.filter(
      s => s.destination.value.toLowerCase().includes(destination.toLowerCase())
    );
    if (destShipments.length >= 3) {
      const destSuccessRate =
        destShipments.filter(s => s.currentStatus.value === 'delivered').length /
        destShipments.length;
      const adjustment = destSuccessRate - model.parameters.baseSuccessRate;
      probability += adjustment * 0.3;
      factors.push({
        name: `Historial ${destination}`,
        impact: adjustment * 100,
      });
    }

    return {
      value: Math.max(0.1, Math.min(0.99, probability)),
      confidence: model.accuracy,
      factors,
      modelUsed: model.id,
    };
  }

  /**
   * Predecir riesgo de problemas
   */
  predictIssueRisk(shipment: {
    carrier: string;
    destination: string;
    daysInTransit: number;
  }): PredictionResult {
    const model = this.models.get('issue_prediction')!;
    const factors: Array<{ name: string; impact: number }> = [];

    let riskScore = model.parameters.baseIssueRate;

    // Mayor riesgo si supera umbral de días
    if (shipment.daysInTransit >= model.parameters.transitDaysThreshold) {
      const daysOverThreshold =
        shipment.daysInTransit - model.parameters.transitDaysThreshold;
      const increase = Math.min(0.3, daysOverThreshold * 0.1);
      riskScore += increase;
      factors.push({
        name: 'Días en tránsito',
        impact: increase * 100,
      });
    }

    // Ajuste por transportadora
    const carrierIssues = this.trainingData.filter(
      s => s.carrier.value === shipment.carrier && s.hasIssue
    );
    const carrierTotal = this.trainingData.filter(
      s => s.carrier.value === shipment.carrier
    ).length;
    if (carrierTotal >= 5) {
      const carrierIssueRate = carrierIssues.length / carrierTotal;
      const adjustment = (carrierIssueRate - model.parameters.baseIssueRate) * 0.5;
      riskScore += adjustment;
      factors.push({
        name: `Historial ${shipment.carrier}`,
        impact: adjustment * 100,
      });
    }

    return {
      value: Math.max(0.01, Math.min(0.95, riskScore)),
      confidence: model.accuracy,
      factors,
      modelUsed: model.id,
    };
  }

  /**
   * Obtener todos los modelos
   */
  getModels(): LearningModel[] {
    return Array.from(this.models.values());
  }

  /**
   * Obtener estadísticas de aprendizaje
   */
  getStats(): {
    totalModels: number;
    averageAccuracy: number;
    totalSampleSize: number;
    lastTrainingDate: Date | null;
  } {
    const models = this.getModels();
    const totalAccuracy = models.reduce((sum, m) => sum + m.accuracy, 0);
    const lastDate = models.reduce(
      (latest, m) => (m.trainedAt > latest ? m.trainedAt : latest),
      new Date(0)
    );

    return {
      totalModels: models.length,
      averageAccuracy: totalAccuracy / models.length,
      totalSampleSize: this.trainingData.length,
      lastTrainingDate: lastDate.getTime() > 0 ? lastDate : null,
    };
  }
}

// Singleton
export const learningEngine = new LearningEngineService();
export default learningEngine;
