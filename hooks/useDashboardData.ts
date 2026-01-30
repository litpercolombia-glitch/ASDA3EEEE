// hooks/useDashboardData.ts
// Hook para cargar y gestionar datos del dashboard
import { useCallback, useEffect } from 'react';
import { useDashboardStore, TrendData, CarrierStats, CityStats } from '../stores/dashboardStore';
import { Shipment } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface UseDashboardDataProps {
  shipments?: Shipment[];
  autoFetch?: boolean;
}

export function useDashboardData({ shipments = [], autoFetch = true }: UseDashboardDataProps = {}) {
  const {
    setMetrics,
    setTrends,
    setCarrierStats,
    setCityStats,
    setStatusDistribution,
    setLoading,
    setError,
    dateRange,
    metrics,
    trends,
    carrierStats,
    cityStats,
    statusDistribution,
    isLoading,
  } = useDashboardStore();

  // Calcular métricas desde shipments locales
  const calculateLocalMetrics = useCallback(() => {
    if (shipments.length === 0) return;

    const total = shipments.length;
    const delivered = shipments.filter(s => s.status === 'delivered').length;
    const inTransit = shipments.filter(s => s.status === 'in_transit').length;
    const issues = shipments.filter(s => s.status === 'issue').length;
    const inOffice = shipments.filter(s => s.status === 'in_office').length;

    // Guías en retraso (más de 5 días sin entregar)
    const delayed = shipments.filter(s => {
      if (s.status === 'delivered') return false;
      const days = s.detailedInfo?.daysInTransit || 0;
      return days >= 5;
    }).length;

    // Calcular tiempo de ciclo promedio
    const deliveredWithTime = shipments.filter(s =>
      s.status === 'delivered' && s.detailedInfo?.daysInTransit
    );
    const avgCycleTime = deliveredWithTime.length > 0
      ? deliveredWithTime.reduce((acc, s) => acc + (s.detailedInfo?.daysInTransit || 0), 0) / deliveredWithTime.length
      : 0;

    setMetrics({
      totalGuias: total,
      guiasEntregadas: delivered,
      guiasEnTransito: inTransit,
      guiasConNovedad: issues,
      guiasEnRetraso: delayed,
      tasaEntrega: total > 0 ? Math.round((delivered / total) * 100) : 0,
      tasaRetraso: total > 0 ? Math.round((delayed / total) * 100) : 0,
      tiempoCicloPromedio: Math.round(avgCycleTime * 10) / 10,
      otifScore: total > 0 ? Math.round(((delivered - delayed) / total) * 100) : 0,
      npsLogistico: Math.round((delivered / Math.max(total, 1)) * 100 - (issues / Math.max(total, 1)) * 50),
      costoPromedioPorEntrega: 8500, // Valor por defecto
      tasaPrimeraEntrega: total > 0 ? Math.round(((delivered - issues) / total) * 100) : 0,
    });

    // Distribución por estado
    setStatusDistribution({
      delivered,
      in_transit: inTransit,
      issue: issues,
      in_office: inOffice,
      returned: shipments.filter(s => s.status === 'returned').length,
    });

    // Stats por transportadora
    const carrierMap = new Map<string, { total: number; delivered: number; delayed: number; totalDays: number }>();
    shipments.forEach(s => {
      const carrier = s.carrier || 'Desconocida';
      const current = carrierMap.get(carrier) || { total: 0, delivered: 0, delayed: 0, totalDays: 0 };
      current.total++;
      if (s.status === 'delivered') current.delivered++;
      if ((s.detailedInfo?.daysInTransit || 0) >= 5 && s.status !== 'delivered') current.delayed++;
      current.totalDays += s.detailedInfo?.daysInTransit || 0;
      carrierMap.set(carrier, current);
    });

    const carrierStatsData: CarrierStats[] = Array.from(carrierMap.entries())
      .map(([nombre, data]) => ({
        nombre,
        totalGuias: data.total,
        entregadas: data.delivered,
        tasaEntrega: Math.round((data.delivered / data.total) * 100),
        tiempoPromedio: Math.round((data.totalDays / data.total) * 10) / 10,
        retrasos: data.delayed,
      }))
      .sort((a, b) => b.totalGuias - a.totalGuias);

    setCarrierStats(carrierStatsData);

    // Stats por ciudad
    const cityMap = new Map<string, { total: number; delivered: number; issues: number }>();
    shipments.forEach(s => {
      const city = s.detailedInfo?.destination || 'Desconocida';
      const current = cityMap.get(city) || { total: 0, delivered: 0, issues: 0 };
      current.total++;
      if (s.status === 'delivered') current.delivered++;
      if (s.status === 'issue') current.issues++;
      cityMap.set(city, current);
    });

    const cityStatsData: CityStats[] = Array.from(cityMap.entries())
      .map(([ciudad, data]) => ({
        ciudad,
        totalGuias: data.total,
        entregadas: data.delivered,
        novedades: data.issues,
        tasaExito: Math.round((data.delivered / data.total) * 100),
      }))
      .sort((a, b) => b.totalGuias - a.totalGuias)
      .slice(0, 10);

    setCityStats(cityStatsData);

    // Generar tendencias (últimos 7 días simulados)
    const trendData: TrendData[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('es-CO', { month: 'short', day: 'numeric' });

      // Simular variación basada en datos reales
      const baseDelivered = Math.round(delivered / 7);
      const variation = Math.random() * 0.4 - 0.2; // -20% a +20%

      trendData.push({
        fecha: dateStr,
        entregas: Math.max(0, Math.round(baseDelivered * (1 + variation))),
        retrasos: Math.max(0, Math.round((delayed / 7) * (1 + Math.random() * 0.5))),
        novedades: Math.max(0, Math.round((issues / 7) * (1 + Math.random() * 0.3))),
        satisfaccion: Math.round(85 + Math.random() * 10),
      });
    }
    setTrends(trendData);

  }, [shipments, setMetrics, setTrends, setCarrierStats, setCityStats, setStatusDistribution]);

  // Fetch desde API (cuando esté disponible)
  const fetchFromAPI = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);

    try {
      const [resumenRes, tendenciasRes] = await Promise.all([
        fetch(`${API_URL}/dashboard/resumen`, { signal }).catch(() => null),
        fetch(`${API_URL}/dashboard/tendencias?dias=30`, { signal }).catch(() => null),
      ]);

      // Check if aborted before updating state
      if (signal?.aborted) return;

      if (resumenRes?.ok) {
        const resumen = await resumenRes.json();
        if (signal?.aborted) return;
        if (resumen.estadisticas_generales) {
          const stats = resumen.estadisticas_generales;
          setMetrics({
            totalGuias: stats.total_guias || 0,
            guiasEntregadas: stats.guias_entregadas || 0,
            guiasEnTransito: stats.guias_en_transito || 0,
            guiasConNovedad: stats.guias_con_novedad || 0,
            guiasEnRetraso: stats.guias_en_retraso || 0,
            tasaEntrega: stats.tasa_entrega || 0,
            tasaRetraso: stats.tasa_retraso || 0,
            tiempoCicloPromedio: stats.tiempo_ciclo_promedio || 0,
            otifScore: stats.otif_score || 0,
            npsLogistico: stats.nps_logistico || 0,
            costoPromedioPorEntrega: stats.costo_por_entrega || 8500,
            tasaPrimeraEntrega: stats.tasa_primera_entrega || 0,
          });
        }
      }

      if (signal?.aborted) return;

      if (tendenciasRes?.ok) {
        const tendencias = await tendenciasRes.json();
        if (signal?.aborted) return;
        if (tendencias.fechas) {
          const trendData: TrendData[] = tendencias.fechas.map((fecha: string, i: number) => ({
            fecha,
            entregas: tendencias.entregas?.[i] || 0,
            retrasos: tendencias.retrasos?.[i] || 0,
            novedades: tendencias.novedades?.[i] || 0,
            satisfaccion: tendencias.satisfaccion?.[i] || 0,
          }));
          setTrends(trendData);
        }
      }
    } catch (err) {
      // Ignore abort errors
      if (err instanceof Error && err.name === 'AbortError') return;
      console.warn('API no disponible, usando datos locales');
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, [setMetrics, setTrends, setLoading, setError]);

  // Efecto para calcular métricas cuando cambian los shipments
  useEffect(() => {
    if (shipments.length > 0) {
      calculateLocalMetrics();
    }
  }, [shipments, calculateLocalMetrics]);

  // Efecto para fetch inicial desde API con cleanup
  useEffect(() => {
    if (!autoFetch) return;

    const abortController = new AbortController();
    fetchFromAPI(abortController.signal);

    return () => {
      abortController.abort();
    };
  }, [autoFetch, fetchFromAPI]);

  return {
    metrics,
    trends,
    carrierStats,
    cityStats,
    statusDistribution,
    isLoading,
    dateRange,
    refresh: () => fetchFromAPI(),
    recalculate: calculateLocalMetrics,
  };
}
