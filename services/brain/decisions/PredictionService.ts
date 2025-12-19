// services/brain/decisions/PredictionService.ts
// Servicio centralizado de predicciones

import { UnifiedShipment, ShipmentStatus } from '../types/brain.types';
import { learningEngine, PredictionResult } from '../knowledge/LearningEngine';
import { centralBrain } from '../core/CentralBrain';
import { memoryManager } from '../core/MemoryManager';

export interface ShipmentPrediction {
  shipmentId: string;
  trackingNumber: string;
  predictions: {
    deliveryTime: {
      estimatedDays: number;
      estimatedDate: Date;
      confidence: number;
      factors: Array<{ name: string; impact: number }>;
    };
    successProbability: {
      percentage: number;
      confidence: number;
      factors: Array<{ name: string; impact: number }>;
    };
    riskAssessment: {
      delayRisk: number;
      issueRisk: number;
      overallRisk: 'low' | 'medium' | 'high';
      confidence: number;
      factors: Array<{ name: string; impact: number }>;
    };
  };
  generatedAt: Date;
}

export interface BulkPredictionReport {
  totalShipments: number;
  predictedOnTime: number;
  predictedDelayed: number;
  predictedIssues: number;
  averageDeliveryTime: number;
  riskDistribution: {
    low: number;
    medium: number;
    high: number;
  };
  topRisks: Array<{
    shipmentId: string;
    trackingNumber: string;
    riskLevel: number;
    reason: string;
  }>;
  generatedAt: Date;
}

class PredictionServiceClass {
  /**
   * Generar predicción completa para un envío
   */
  predictForShipment(shipment: UnifiedShipment): ShipmentPrediction {
    // Predicción de tiempo de entrega
    const deliveryTime = learningEngine.predictDeliveryTime(
      shipment.carrier.value,
      shipment.destination.value,
      shipment.createdAt
    );

    // Predicción de éxito
    const successRate = learningEngine.predictSuccessRate(
      shipment.carrier.value,
      shipment.destination.value
    );

    // Predicción de riesgo
    const issueRisk = learningEngine.predictIssueRisk({
      carrier: shipment.carrier.value,
      destination: shipment.destination.value,
      daysInTransit: shipment.daysInTransit,
    });

    // Calcular fecha estimada
    const estimatedDate = new Date();
    estimatedDate.setDate(estimatedDate.getDate() + Math.ceil(deliveryTime.value));

    // Calcular riesgo de retraso
    const delayRisk = this.calculateDelayRisk(shipment, deliveryTime.value);

    // Determinar nivel de riesgo general
    const overallRisk = this.determineOverallRisk(delayRisk, issueRisk.value);

    const prediction: ShipmentPrediction = {
      shipmentId: shipment.id,
      trackingNumber: shipment.trackingNumber,
      predictions: {
        deliveryTime: {
          estimatedDays: Math.ceil(deliveryTime.value),
          estimatedDate,
          confidence: deliveryTime.confidence,
          factors: deliveryTime.factors,
        },
        successProbability: {
          percentage: Math.round(successRate.value * 100),
          confidence: successRate.confidence,
          factors: successRate.factors,
        },
        riskAssessment: {
          delayRisk: Math.round(delayRisk * 100),
          issueRisk: Math.round(issueRisk.value * 100),
          overallRisk,
          confidence: (deliveryTime.confidence + issueRisk.confidence) / 2,
          factors: [...deliveryTime.factors, ...issueRisk.factors],
        },
      },
      generatedAt: new Date(),
    };

    // Cachear predicción
    memoryManager.remember(`prediction_${shipment.id}`, prediction, {
      type: 'SHORT_TERM',
      importance: 70,
    });

    return prediction;
  }

  /**
   * Generar predicción por ID de envío
   */
  predictById(shipmentId: string): ShipmentPrediction | null {
    const shipment = centralBrain.getShipment(shipmentId);
    if (!shipment) return null;
    return this.predictForShipment(shipment);
  }

  /**
   * Generar reporte de predicciones para todos los envíos activos
   */
  generateBulkReport(shipments?: UnifiedShipment[]): BulkPredictionReport {
    const shipmentsToAnalyze = shipments || centralBrain.getShipments({
      status: ['pending', 'picked_up', 'in_transit', 'in_distribution', 'out_for_delivery'],
    });

    if (shipmentsToAnalyze.length === 0) {
      return {
        totalShipments: 0,
        predictedOnTime: 0,
        predictedDelayed: 0,
        predictedIssues: 0,
        averageDeliveryTime: 0,
        riskDistribution: { low: 0, medium: 0, high: 0 },
        topRisks: [],
        generatedAt: new Date(),
      };
    }

    const predictions = shipmentsToAnalyze.map(s => this.predictForShipment(s));

    // Calcular estadísticas
    let predictedOnTime = 0;
    let predictedDelayed = 0;
    let predictedIssues = 0;
    let totalDeliveryDays = 0;
    const riskDistribution = { low: 0, medium: 0, high: 0 };
    const topRisks: BulkPredictionReport['topRisks'] = [];

    predictions.forEach(pred => {
      totalDeliveryDays += pred.predictions.deliveryTime.estimatedDays;

      // Contar por riesgo
      riskDistribution[pred.predictions.riskAssessment.overallRisk]++;

      // On time si entrega en menos de 5 días y bajo riesgo
      if (
        pred.predictions.deliveryTime.estimatedDays <= 5 &&
        pred.predictions.riskAssessment.overallRisk === 'low'
      ) {
        predictedOnTime++;
      } else if (pred.predictions.riskAssessment.delayRisk > 50) {
        predictedDelayed++;
      }

      if (pred.predictions.riskAssessment.issueRisk > 40) {
        predictedIssues++;
      }

      // Agregar a top risks si es alto riesgo
      if (pred.predictions.riskAssessment.overallRisk === 'high') {
        topRisks.push({
          shipmentId: pred.shipmentId,
          trackingNumber: pred.trackingNumber,
          riskLevel: Math.max(
            pred.predictions.riskAssessment.delayRisk,
            pred.predictions.riskAssessment.issueRisk
          ),
          reason: this.determineRiskReason(pred),
        });
      }
    });

    // Ordenar top risks por nivel de riesgo
    topRisks.sort((a, b) => b.riskLevel - a.riskLevel);

    const report: BulkPredictionReport = {
      totalShipments: predictions.length,
      predictedOnTime,
      predictedDelayed,
      predictedIssues,
      averageDeliveryTime: totalDeliveryDays / predictions.length,
      riskDistribution,
      topRisks: topRisks.slice(0, 10), // Top 10
      generatedAt: new Date(),
    };

    // Cachear reporte
    memoryManager.remember('bulk_prediction_report', report, {
      type: 'SHORT_TERM',
      importance: 85,
    });

    return report;
  }

  /**
   * Predecir si un envío llegará a tiempo
   */
  willArriveOnTime(
    shipmentId: string,
    targetDays: number = 5
  ): {
    willArrive: boolean;
    confidence: number;
    estimatedDays: number;
    reason: string;
  } {
    const prediction = this.predictById(shipmentId);

    if (!prediction) {
      return {
        willArrive: false,
        confidence: 0,
        estimatedDays: 0,
        reason: 'Envío no encontrado',
      };
    }

    const estimatedDays = prediction.predictions.deliveryTime.estimatedDays;
    const willArrive = estimatedDays <= targetDays;

    let reason: string;
    if (willArrive) {
      reason = `Entrega estimada en ${estimatedDays} días, dentro del objetivo de ${targetDays} días`;
    } else {
      reason = `Entrega estimada en ${estimatedDays} días, ${estimatedDays - targetDays} días después del objetivo`;
    }

    return {
      willArrive,
      confidence: prediction.predictions.deliveryTime.confidence,
      estimatedDays,
      reason,
    };
  }

  /**
   * Obtener envíos que probablemente tendrán problemas
   */
  getAtRiskShipments(riskThreshold: number = 0.5): Array<{
    shipment: UnifiedShipment;
    prediction: ShipmentPrediction;
    primaryRisk: string;
  }> {
    const shipments = centralBrain.getShipments({
      status: ['pending', 'picked_up', 'in_transit', 'in_distribution', 'out_for_delivery'],
    });

    const atRisk: Array<{
      shipment: UnifiedShipment;
      prediction: ShipmentPrediction;
      primaryRisk: string;
    }> = [];

    shipments.forEach(shipment => {
      const prediction = this.predictForShipment(shipment);
      const maxRisk = Math.max(
        prediction.predictions.riskAssessment.delayRisk / 100,
        prediction.predictions.riskAssessment.issueRisk / 100
      );

      if (maxRisk >= riskThreshold) {
        atRisk.push({
          shipment,
          prediction,
          primaryRisk: this.determineRiskReason(prediction),
        });
      }
    });

    // Ordenar por riesgo
    atRisk.sort((a, b) => {
      const riskA = Math.max(
        a.prediction.predictions.riskAssessment.delayRisk,
        a.prediction.predictions.riskAssessment.issueRisk
      );
      const riskB = Math.max(
        b.prediction.predictions.riskAssessment.delayRisk,
        b.prediction.predictions.riskAssessment.issueRisk
      );
      return riskB - riskA;
    });

    return atRisk;
  }

  // ==================== HELPERS ====================

  private calculateDelayRisk(shipment: UnifiedShipment, estimatedDays: number): number {
    let risk = 0;

    // Riesgo base por días ya en tránsito
    if (shipment.daysInTransit > 3) {
      risk += 0.1 * (shipment.daysInTransit - 3);
    }

    // Riesgo si ya tiene novedad
    if (shipment.hasIssue) {
      risk += 0.3;
    }

    // Riesgo si estimación es mayor a 5 días
    if (estimatedDays > 5) {
      risk += 0.15 * (estimatedDays - 5);
    }

    return Math.min(0.95, risk);
  }

  private determineOverallRisk(
    delayRisk: number,
    issueRisk: number
  ): 'low' | 'medium' | 'high' {
    const maxRisk = Math.max(delayRisk, issueRisk);

    if (maxRisk >= 0.6) return 'high';
    if (maxRisk >= 0.3) return 'medium';
    return 'low';
  }

  private determineRiskReason(prediction: ShipmentPrediction): string {
    const { delayRisk, issueRisk, factors } = prediction.predictions.riskAssessment;

    if (issueRisk > delayRisk) {
      const topFactor = factors.find(f => f.impact > 0);
      return topFactor?.name || 'Alto riesgo de novedad';
    } else {
      const topFactor = factors.find(f => f.impact > 0);
      return topFactor?.name || 'Alto riesgo de retraso';
    }
  }
}

// Singleton
export const predictionService = new PredictionServiceClass();
export default predictionService;
