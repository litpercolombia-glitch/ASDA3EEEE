// components/dashboard/AdvancedDashboard.tsx
// Dashboard avanzado con gráficos y métricas detalladas
import React, { useEffect } from 'react';
import {
  Target,
  Users,
  Clock,
  DollarSign,
  CheckCircle,
  TrendingUp,
  RefreshCw,
  Calendar,
  Activity,
} from 'lucide-react';
import { Shipment } from '../../types';
import { useDashboardData } from '../../hooks/useDashboardData';
import {
  DeliveryTrendChart,
  CarrierPerformanceChart,
  StatusDistributionChart,
  CityHeatmap,
  KPICard,
} from './charts';

interface AdvancedDashboardProps {
  shipments: Shipment[];
  userName?: string;
}

export const AdvancedDashboard: React.FC<AdvancedDashboardProps> = ({
  shipments,
  userName = 'Usuario',
}) => {
  const {
    metrics,
    trends,
    carrierStats,
    cityStats,
    statusDistribution,
    isLoading,
    refresh,
  } = useDashboardData({ shipments, autoFetch: true });

  // Saludo según hora
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  // Fecha actual
  const today = new Date().toLocaleDateString('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ===== HEADER ===== */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 rounded-2xl border border-purple-500/20 overflow-hidden">
        <div className="p-6 relative">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-1/4 w-64 h-64 bg-purple-500 rounded-full filter blur-[80px]" />
            <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-cyan-500 rounded-full filter blur-[80px]" />
          </div>

          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <p className="text-purple-300 text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {today}
              </p>
              <h1 className="text-2xl lg:text-3xl font-bold text-white mt-1">
                {getGreeting()}, {userName}
              </h1>
              <p className="text-slate-300 mt-2 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Dashboard Analytics Avanzado
              </p>
            </div>

            <button
              onClick={refresh}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
          </div>
        </div>
      </div>

      {/* ===== KPIs PRINCIPALES ===== */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <KPICard
          label="OTIF Score"
          value={metrics?.otifScore}
          icon={Target}
          target={95}
          format="percentage"
          colorScheme="default"
        />
        <KPICard
          label="NPS Logístico"
          value={metrics?.npsLogistico}
          icon={Users}
          format="number"
          colorScheme={metrics?.npsLogistico && metrics.npsLogistico >= 70 ? 'success' : 'warning'}
        />
        <KPICard
          label="Tiempo Ciclo"
          value={metrics?.tiempoCicloPromedio}
          icon={Clock}
          unit="días"
          format="decimal"
          target={3}
        />
        <KPICard
          label="Costo/Entrega"
          value={metrics?.costoPromedioPorEntrega}
          icon={DollarSign}
          format="currency"
        />
        <KPICard
          label="Primera Entrega"
          value={metrics?.tasaPrimeraEntrega}
          icon={CheckCircle}
          format="percentage"
          target={90}
        />
        <KPICard
          label="Tasa Entrega"
          value={metrics?.tasaEntrega}
          icon={TrendingUp}
          format="percentage"
          target={85}
        />
      </div>

      {/* ===== GRÁFICOS PRINCIPALES ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DeliveryTrendChart data={trends} />
        <CarrierPerformanceChart data={carrierStats} />
      </div>

      {/* ===== GRÁFICOS SECUNDARIOS ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <StatusDistributionChart data={statusDistribution} />
        <CityHeatmap data={cityStats} />

        {/* Panel de Resumen Rápido */}
        <div className="bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-700 p-6">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-500" />
            Resumen del Período
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-navy-800 rounded-lg">
              <span className="text-slate-600 dark:text-slate-400">Total Guías</span>
              <span className="font-bold text-slate-800 dark:text-white">
                {metrics?.totalGuias?.toLocaleString() || 0}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
              <span className="text-emerald-600 dark:text-emerald-400">Entregadas</span>
              <span className="font-bold text-emerald-700 dark:text-emerald-300">
                {metrics?.guiasEntregadas?.toLocaleString() || 0}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <span className="text-blue-600 dark:text-blue-400">En Tránsito</span>
              <span className="font-bold text-blue-700 dark:text-blue-300">
                {metrics?.guiasEnTransito?.toLocaleString() || 0}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <span className="text-amber-600 dark:text-amber-400">Con Novedad</span>
              <span className="font-bold text-amber-700 dark:text-amber-300">
                {metrics?.guiasConNovedad?.toLocaleString() || 0}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <span className="text-red-600 dark:text-red-400">En Retraso</span>
              <span className="font-bold text-red-700 dark:text-red-300">
                {metrics?.guiasEnRetraso?.toLocaleString() || 0}
              </span>
            </div>
          </div>

          {/* Indicador de actualización */}
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-navy-700">
            <p className="text-xs text-slate-400 text-center">
              Última actualización: {new Date().toLocaleTimeString('es-CO')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedDashboard;
