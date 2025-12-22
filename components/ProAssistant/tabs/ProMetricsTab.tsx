// components/ProAssistant/tabs/ProMetricsTab.tsx
// Dashboard de Métricas Nivel Amazon
import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Package,
  Truck,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Award,
  BarChart3,
  PieChart,
  Activity,
  Zap,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Minus,
} from 'lucide-react';
import { useProAssistantStore } from '../../../stores/proAssistantStore';
import { guideHistoryService, GuideStats } from '../../../services/guideHistoryService';

// ============================================
// TIPOS
// ============================================

interface MetricCard {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ReactNode;
  color: string;
  target?: number;
}

interface AmazonBenchmark {
  metric: string;
  current: number;
  amazon: number;
  gap: number;
  status: 'above' | 'below' | 'at';
}

// ============================================
// COMPONENTES
// ============================================

const MetricCardComponent: React.FC<{ metric: MetricCard }> = ({ metric }) => {
  const changeIcon = metric.change !== undefined ? (
    metric.change > 0 ? <ArrowUp className="w-3 h-3" /> :
    metric.change < 0 ? <ArrowDown className="w-3 h-3" /> :
    <Minus className="w-3 h-3" />
  ) : null;

  const changeColor = metric.change !== undefined ? (
    metric.change > 0 ? 'text-emerald-400' :
    metric.change < 0 ? 'text-red-400' :
    'text-slate-400'
  ) : '';

  return (
    <div className={`p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:border-${metric.color}-500/30 transition-all`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl bg-${metric.color}-500/20 flex items-center justify-center`}>
          {metric.icon}
        </div>
        {metric.change !== undefined && (
          <div className={`flex items-center gap-1 text-xs ${changeColor}`}>
            {changeIcon}
            {Math.abs(metric.change)}%
          </div>
        )}
      </div>
      <p className={`text-2xl font-bold text-${metric.color}-400`}>{metric.value}</p>
      <p className="text-xs text-slate-500 mt-1">{metric.label}</p>
      {metric.target && (
        <div className="mt-2">
          <div className="flex justify-between text-[10px] text-slate-500 mb-1">
            <span>Meta: {metric.target}%</span>
            <span>{typeof metric.value === 'string' ? metric.value : `${((metric.value as number / metric.target) * 100).toFixed(0)}%`}</span>
          </div>
          <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full bg-${metric.color}-500 rounded-full transition-all`}
              style={{ width: `${Math.min(100, typeof metric.value === 'number' ? (metric.value / metric.target) * 100 : 0)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

const BenchmarkRow: React.FC<{ benchmark: AmazonBenchmark }> = ({ benchmark }) => {
  const statusColor = benchmark.status === 'above' ? 'emerald' : benchmark.status === 'below' ? 'red' : 'amber';
  const statusIcon = benchmark.status === 'above' ? <CheckCircle className="w-4 h-4" /> :
                     benchmark.status === 'below' ? <AlertTriangle className="w-4 h-4" /> :
                     <Target className="w-4 h-4" />;

  return (
    <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
      <div className="flex items-center gap-3">
        <div className={`text-${statusColor}-400`}>{statusIcon}</div>
        <div>
          <p className="text-sm font-medium text-white">{benchmark.metric}</p>
          <p className="text-xs text-slate-500">Amazon: {benchmark.amazon}%</p>
        </div>
      </div>
      <div className="text-right">
        <p className={`text-lg font-bold text-${statusColor}-400`}>{benchmark.current}%</p>
        <p className={`text-xs text-${statusColor}-400`}>
          {benchmark.gap > 0 ? '+' : ''}{benchmark.gap}%
        </p>
      </div>
    </div>
  );
};

const RiskIndicator: React.FC<{ level: string; count: number; total: number }> = ({ level, count, total }) => {
  const colors: Record<string, string> = {
    critico: 'red',
    alto: 'orange',
    medio: 'amber',
    bajo: 'emerald',
  };
  const color = colors[level] || 'slate';
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <div className="flex items-center gap-3">
      <div className={`w-3 h-3 rounded-full bg-${color}-500`} />
      <div className="flex-1">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-slate-400 capitalize">{level}</span>
          <span className="text-white font-medium">{count}</span>
        </div>
        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full bg-${color}-500 rounded-full`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

const ProMetricsTab: React.FC = () => {
  const { shipmentsContext } = useProAssistantStore();
  const [stats, setStats] = useState<GuideStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [shipmentsContext]);

  const loadStats = () => {
    setIsLoading(true);

    // Sincronizar con el servicio de historial
    if (shipmentsContext.length > 0) {
      guideHistoryService.syncFromShipments(shipmentsContext);
    }

    // Obtener estadísticas
    const newStats = guideHistoryService.getStats();
    setStats(newStats);
    setIsLoading(false);
  };

  if (isLoading || !stats) {
    return (
      <div className="flex items-center justify-center h-full">
        <RefreshCw className="w-6 h-6 text-amber-400 animate-spin" />
      </div>
    );
  }

  // Calcular métricas
  const deliveryRate = stats.total > 0 ? (stats.porEstado.entregado / stats.total) * 100 : 0;
  const issueRate = stats.total > 0 ? ((stats.porEstado.novedad + stats.porEstado.devuelto) / stats.total) * 100 : 0;
  const inTransitRate = stats.total > 0 ? (stats.porEstado.en_transito / stats.total) * 100 : 0;
  const officeRate = stats.total > 0 ? (stats.porEstado.en_oficina / stats.total) * 100 : 0;

  // Métricas principales
  const metrics: MetricCard[] = [
    {
      label: 'Tasa de Entrega',
      value: `${deliveryRate.toFixed(1)}%`,
      change: 2.3,
      icon: <CheckCircle className="w-5 h-5 text-emerald-400" />,
      color: 'emerald',
      target: 98,
    },
    {
      label: 'Tasa de Novedad',
      value: `${issueRate.toFixed(1)}%`,
      change: -1.2,
      icon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
      color: 'amber',
    },
    {
      label: 'Tiempo Promedio',
      value: `${stats.promedioTiempoEntrega.toFixed(1)} días`,
      icon: <Clock className="w-5 h-5 text-blue-400" />,
      color: 'blue',
    },
    {
      label: 'Total Guías',
      value: stats.total,
      icon: <Package className="w-5 h-5 text-purple-400" />,
      color: 'purple',
    },
  ];

  // Benchmarks vs Amazon
  const benchmarks: AmazonBenchmark[] = [
    {
      metric: 'Tasa de Entrega',
      current: Math.round(deliveryRate),
      amazon: 98,
      gap: Math.round(deliveryRate - 98),
      status: deliveryRate >= 98 ? 'above' : deliveryRate >= 90 ? 'at' : 'below',
    },
    {
      metric: 'Tiempo de Entrega',
      current: Math.round(stats.promedioTiempoEntrega),
      amazon: 3,
      gap: Math.round(3 - stats.promedioTiempoEntrega),
      status: stats.promedioTiempoEntrega <= 3 ? 'above' : stats.promedioTiempoEntrega <= 5 ? 'at' : 'below',
    },
    {
      metric: 'Resolución de Novedades',
      current: Math.round(100 - issueRate),
      amazon: 95,
      gap: Math.round((100 - issueRate) - 95),
      status: (100 - issueRate) >= 95 ? 'above' : (100 - issueRate) >= 85 ? 'at' : 'below',
    },
  ];

  // Score general (0-100)
  const overallScore = Math.round(
    (deliveryRate * 0.4) +
    ((100 - issueRate) * 0.3) +
    (Math.max(0, 100 - (stats.promedioTiempoEntrega * 10)) * 0.3)
  );

  const scoreColor = overallScore >= 80 ? 'emerald' : overallScore >= 60 ? 'amber' : 'red';

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 space-y-6">
      {/* ============================================ */}
      {/* SCORE GENERAL */}
      {/* ============================================ */}
      <div className={`p-6 bg-gradient-to-br from-${scoreColor}-500/20 to-${scoreColor}-600/10 border border-${scoreColor}-500/30 rounded-2xl`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Performance Score</p>
            <p className={`text-4xl font-bold text-${scoreColor}-400`}>{overallScore}</p>
            <p className="text-sm text-slate-400 mt-1">
              {overallScore >= 80 ? 'Excelente' : overallScore >= 60 ? 'Bueno' : 'Necesita Mejora'}
            </p>
          </div>
          <div className="relative w-24 h-24">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-slate-700"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${overallScore * 2.51} 251`}
                className={`text-${scoreColor}-400`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <Award className={`w-8 h-8 text-${scoreColor}-400`} />
            </div>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* MÉTRICAS PRINCIPALES */}
      {/* ============================================ */}
      <div>
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-amber-400" />
          Métricas Principales
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {metrics.map((metric, i) => (
            <MetricCardComponent key={i} metric={metric} />
          ))}
        </div>
      </div>

      {/* ============================================ */}
      {/* BENCHMARK VS AMAZON */}
      {/* ============================================ */}
      <div>
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <Target className="w-4 h-4 text-purple-400" />
          Benchmark vs Amazon
        </h3>
        <div className="space-y-2">
          {benchmarks.map((benchmark, i) => (
            <BenchmarkRow key={i} benchmark={benchmark} />
          ))}
        </div>
      </div>

      {/* ============================================ */}
      {/* DISTRIBUCIÓN DE RIESGO */}
      {/* ============================================ */}
      <div>
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-red-400" />
          Distribución de Riesgo
        </h3>
        <div className="p-4 bg-slate-800/50 rounded-xl space-y-3">
          <RiskIndicator level="critico" count={stats.porRiesgo.critico} total={stats.total} />
          <RiskIndicator level="alto" count={stats.porRiesgo.alto} total={stats.total} />
          <RiskIndicator level="medio" count={stats.porRiesgo.medio} total={stats.total} />
          <RiskIndicator level="bajo" count={stats.porRiesgo.bajo} total={stats.total} />
        </div>
      </div>

      {/* ============================================ */}
      {/* TOP TRANSPORTADORAS */}
      {/* ============================================ */}
      <div>
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <Truck className="w-4 h-4 text-cyan-400" />
          Top Transportadoras
        </h3>
        <div className="space-y-2">
          {Object.entries(stats.porTransportadora)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([carrier, count], i) => (
              <div key={carrier} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="text-sm text-white">{carrier}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-cyan-400">{count}</span>
                  <span className="text-xs text-slate-500 ml-1">
                    ({((count / stats.total) * 100).toFixed(0)}%)
                  </span>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* ============================================ */}
      {/* ACCIONES RECOMENDADAS */}
      {/* ============================================ */}
      <div>
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          Acciones Recomendadas
        </h3>
        <div className="space-y-2">
          {stats.porRiesgo.critico > 0 && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-400">
                  {stats.porRiesgo.critico} guías en riesgo crítico
                </p>
                <p className="text-xs text-slate-400">
                  Requieren atención inmediata para evitar devolución
                </p>
              </div>
            </div>
          )}
          {stats.porEstado.en_oficina > 0 && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-3">
              <Clock className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-400">
                  {stats.porEstado.en_oficina} guías en oficina
                </p>
                <p className="text-xs text-slate-400">
                  Contactar clientes para coordinar recogida
                </p>
              </div>
            </div>
          )}
          {deliveryRate < 90 && (
            <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-purple-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-purple-400">
                  Mejorar tasa de entrega
                </p>
                <p className="text-xs text-slate-400">
                  Actual: {deliveryRate.toFixed(1)}% - Meta: 98%
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Refresh button */}
      <button
        onClick={loadStats}
        className="w-full py-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm text-slate-300 transition-colors flex items-center justify-center gap-2"
      >
        <RefreshCw className="w-4 h-4" />
        Actualizar Métricas
      </button>

      <div className="h-4" />
    </div>
  );
};

export default ProMetricsTab;
