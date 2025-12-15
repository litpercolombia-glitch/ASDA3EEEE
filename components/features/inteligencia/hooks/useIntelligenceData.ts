/**
 * USE INTELLIGENCE DATA HOOK
 *
 * Hook para manejar datos de inteligencia logistica.
 * Centraliza la logica de fetching y procesamiento de datos.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Shipment } from '../../../../types';
import {
  IntelligenceMetrics,
  DeliveryPrediction,
  DetectedPattern,
  DelayAnalysis,
  DelayReport,
  SessionData,
  SessionComparison,
  IntelligenceFilters,
} from '../types';

interface UseIntelligenceDataProps {
  shipments: Shipment[];
  filters?: Partial<IntelligenceFilters>;
}

interface UseIntelligenceDataReturn {
  // State
  isLoading: boolean;
  error: string | null;

  // Data
  metrics: IntelligenceMetrics;
  predictions: DeliveryPrediction[];
  patterns: DetectedPattern[];
  delays: DelayAnalysis[];
  delayReport: DelayReport;
  sessions: SessionData[];
  comparison: SessionComparison | null;

  // Actions
  refresh: () => void;
  compareSessions: (currentId: string, previousId: string) => void;
}

export function useIntelligenceData({
  shipments,
  filters,
}: UseIntelligenceDataProps): UseIntelligenceDataReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comparison, setComparison] = useState<SessionComparison | null>(null);

  // Calcular metricas basadas en shipments
  const metrics = useMemo<IntelligenceMetrics>(() => {
    const total = shipments.length;
    const delivered = shipments.filter((s) => s.status === 'delivered').length;
    const inTransit = shipments.filter((s) => s.status === 'in_transit').length;
    const issues = shipments.filter((s) => s.status === 'issue').length;
    const critical = shipments.filter((s) => {
      if (s.status === 'delivered') return false;
      const days = s.detailedInfo?.daysInTransit || 0;
      return days >= 5 || s.status === 'issue';
    }).length;

    // Calcular tiempo promedio de entrega
    const deliveredShipments = shipments.filter(
      (s) => s.status === 'delivered' && s.detailedInfo?.daysInTransit
    );
    const avgTime =
      deliveredShipments.length > 0
        ? deliveredShipments.reduce((acc, s) => acc + (s.detailedInfo?.daysInTransit || 0), 0) /
          deliveredShipments.length
        : 0;

    return {
      totalShipments: total,
      deliveredCount: delivered,
      inTransitCount: inTransit,
      issueCount: issues,
      deliveryRate: total > 0 ? (delivered / total) * 100 : 0,
      avgDeliveryTime: avgTime * 24, // Convertir a horas
      criticalCount: critical,
    };
  }, [shipments]);

  // Generar predicciones (simuladas - en produccion vendrian del backend ML)
  const predictions = useMemo<DeliveryPrediction[]>(() => {
    return shipments
      .filter((s) => s.status !== 'delivered')
      .slice(0, 20)
      .map((s) => {
        const days = s.detailedInfo?.daysInTransit || 0;
        const hasIssue = s.status === 'issue';
        const riskLevel = hasIssue || days > 5 ? 'high' : days > 3 ? 'medium' : 'low';
        const confidence = hasIssue ? 0.6 : days > 3 ? 0.75 : 0.9;

        return {
          shipmentId: s.id,
          estimatedDate: new Date(Date.now() + (3 - days) * 24 * 60 * 60 * 1000),
          confidence,
          riskLevel,
          factors: [
            days > 3 ? 'Dias en transito elevados' : null,
            hasIssue ? 'Tiene novedad activa' : null,
            s.carrier === 'unknown' ? 'Transportadora desconocida' : null,
          ].filter(Boolean) as string[],
        };
      });
  }, [shipments]);

  // Detectar patrones
  const patterns = useMemo<DetectedPattern[]>(() => {
    const result: DetectedPattern[] = [];

    // Patron: Alta tasa de novedades
    const issueRate = metrics.totalShipments > 0
      ? (metrics.issueCount / metrics.totalShipments) * 100
      : 0;

    if (issueRate > 10) {
      result.push({
        id: 'high-issue-rate',
        type: 'delay',
        title: 'Alta tasa de novedades',
        description: `${issueRate.toFixed(1)}% de los envios tienen novedades`,
        impact: 'negative',
        frequency: metrics.issueCount,
        affectedShipments: metrics.issueCount,
        recommendation: 'Revisar proceso de verificacion de direcciones antes del envio',
      });
    }

    // Patron: Envios criticos
    if (metrics.criticalCount > 5) {
      result.push({
        id: 'critical-shipments',
        type: 'delay',
        title: 'Envios criticos acumulados',
        description: `${metrics.criticalCount} envios llevan mas de 5 dias sin entregar`,
        impact: 'negative',
        frequency: metrics.criticalCount,
        affectedShipments: metrics.criticalCount,
        recommendation: 'Contactar clientes y transportadoras para seguimiento urgente',
      });
    }

    // Patron: Buena tasa de entrega
    if (metrics.deliveryRate > 90) {
      result.push({
        id: 'high-delivery-rate',
        type: 'carrier',
        title: 'Excelente tasa de entrega',
        description: `${metrics.deliveryRate.toFixed(1)}% de entregas exitosas`,
        impact: 'positive',
        frequency: metrics.deliveredCount,
        affectedShipments: metrics.deliveredCount,
      });
    }

    return result;
  }, [metrics]);

  // Analisis de retrasos
  const delays = useMemo<DelayAnalysis[]>(() => {
    return shipments
      .filter((s) => {
        const days = s.detailedInfo?.daysInTransit || 0;
        return s.status !== 'delivered' && days > 3;
      })
      .map((s) => ({
        shipment: s,
        delayDays: (s.detailedInfo?.daysInTransit || 0) - 3,
        delayReason: s.status === 'issue' ? 'Novedad activa' : 'Retraso en transito',
        carrierResponsibility: s.status === 'issue' ? 70 : 50,
        estimatedCost: ((s.detailedInfo?.daysInTransit || 0) - 3) * 5000,
        suggestedAction:
          s.status === 'issue'
            ? 'Contactar cliente para resolver novedad'
            : 'Seguimiento con transportadora',
      }));
  }, [shipments]);

  // Reporte de retrasos
  const delayReport = useMemo<DelayReport>(() => {
    const totalDelays = delays.length;
    const avgDelayDays =
      totalDelays > 0
        ? delays.reduce((acc, d) => acc + d.delayDays, 0) / totalDelays
        : 0;

    // Agrupar por razon
    const reasonCounts: Record<string, number> = {};
    delays.forEach((d) => {
      reasonCounts[d.delayReason] = (reasonCounts[d.delayReason] || 0) + 1;
    });
    const topReasons = Object.entries(reasonCounts)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count);

    // Agrupar por carrier
    const carrierDelays: Record<string, { total: number; delayed: number }> = {};
    shipments.forEach((s) => {
      const carrier = s.carrier || 'unknown';
      if (!carrierDelays[carrier]) {
        carrierDelays[carrier] = { total: 0, delayed: 0 };
      }
      carrierDelays[carrier].total++;
      if ((s.detailedInfo?.daysInTransit || 0) > 3) {
        carrierDelays[carrier].delayed++;
      }
    });
    const carrierPerformance = Object.entries(carrierDelays)
      .map(([carrier, data]) => ({
        carrier,
        delayRate: data.total > 0 ? (data.delayed / data.total) * 100 : 0,
      }))
      .sort((a, b) => b.delayRate - a.delayRate);

    return {
      totalDelays,
      avgDelayDays,
      topReasons,
      carrierPerformance,
    };
  }, [delays, shipments]);

  // Sesiones disponibles (simuladas)
  const sessions = useMemo<SessionData[]>(() => {
    // En produccion, esto vendria del storage o backend
    return [];
  }, []);

  // Comparar sesiones
  const compareSessions = useCallback(
    (currentId: string, previousId: string) => {
      // Implementar logica de comparacion
      setComparison(null);
    },
    []
  );

  // Refresh data
  const refresh = useCallback(() => {
    setIsLoading(true);
    // En produccion, aqui iria el fetch de datos frescos
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  }, []);

  return {
    isLoading,
    error,
    metrics,
    predictions,
    patterns,
    delays,
    delayReport,
    sessions,
    comparison,
    refresh,
    compareSessions,
  };
}

export default useIntelligenceData;
