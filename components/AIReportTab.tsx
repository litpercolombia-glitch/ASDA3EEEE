import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Package,
  CheckCircle,
  Truck,
  MapPin,
  AlertTriangle,
  ChevronRight,
  Sparkles,
  Clock,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  AlertOctagon,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { Shipment, ShipmentStatus, CarrierName, ReportStats } from '../types';
import { getActualStatus, STATUS_CONFIG, NormalizedStatus, groupBySemaforo, getHoursSinceUpdate } from '../utils/statusHelpers';
import { GuiasDetailModal } from './GuiasDetailModal';
import { calculateStats } from '../services/logisticsService';

interface AIReportTabProps {
  shipments: Shipment[];
  onNavigateToSemaforo?: () => void;
}

interface MetricCardProps {
  value: number;
  label: string;
  icon: React.ElementType;
  colorClass: string;
  bgClass: string;
  onClick: () => void;
  trend?: { value: number; isPositive: boolean };
}

const MetricCard: React.FC<MetricCardProps> = ({
  value,
  label,
  icon: Icon,
  colorClass,
  bgClass,
  onClick,
  trend
}) => (
  <button
    onClick={onClick}
    className="group bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer text-left w-full"
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-3xl font-bold text-slate-800 dark:text-white">
          {value}
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{label}</p>
        {trend && (
          <div className={`flex items-center gap-1 mt-2 text-xs font-bold ${trend.isPositive ? 'text-green-600' : 'text-red-500'}`}>
            {trend.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trend.value}%
          </div>
        )}
      </div>
      <div className={`p-3 rounded-xl ${bgClass} group-hover:scale-110 transition-transform`}>
        <Icon className={`w-6 h-6 ${colorClass}`} />
      </div>
    </div>
    <div className="mt-4 flex items-center text-xs text-blue-600 dark:text-blue-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
      Ver detalles <ChevronRight className="w-4 h-4 ml-1" />
    </div>
  </button>
);

interface RecommendationCardProps {
  type: 'URGENT' | 'WARNING' | 'TIP' | 'SUCCESS';
  title: string;
  description: string;
  onAction?: () => void;
  actionLabel?: string;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({
  type,
  title,
  description,
  onAction,
  actionLabel
}) => {
  const styles = {
    URGENT: { bg: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800', icon: AlertOctagon, iconColor: 'text-red-500' },
    WARNING: { bg: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800', icon: AlertTriangle, iconColor: 'text-orange-500' },
    TIP: { bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800', icon: Lightbulb, iconColor: 'text-blue-500' },
    SUCCESS: { bg: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800', icon: CheckCircle, iconColor: 'text-green-500' }
  };

  const style = styles[type];
  const Icon = style.icon;

  return (
    <div className={`${style.bg} border rounded-xl p-4 flex gap-4`}>
      <Icon className={`w-6 h-6 ${style.iconColor} flex-shrink-0`} />
      <div className="flex-1">
        <h4 className="font-bold text-slate-800 dark:text-white">{title}</h4>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{description}</p>
        {onAction && actionLabel && (
          <button
            onClick={onAction}
            className="mt-3 text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1"
          >
            {actionLabel} <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

// Onboarding component
const ReportOnboarding: React.FC<{ onGenerate: () => void }> = ({ onGenerate }) => (
  <div className="max-w-2xl mx-auto text-center py-12">
    <div className="bg-gradient-to-br from-blue-500 to-purple-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
      <BarChart3 className="w-10 h-10 text-white" />
    </div>

    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">
      Reporte Inteligente
    </h2>

    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 mb-8 text-left">
      <div className="flex items-start gap-3 mb-4">
        <Sparkles className="w-5 h-5 text-purple-500 mt-0.5" />
        <p className="text-slate-600 dark:text-slate-300 font-medium">
          La IA analizará automáticamente:
        </p>
      </div>

      <ul className="space-y-3 ml-8">
        <li className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
          <CheckCircle className="w-4 h-4 text-green-500" />
          Estado actual de todas tus guías
        </li>
        <li className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
          <CheckCircle className="w-4 h-4 text-green-500" />
          Identificación de novedades y alertas
        </li>
        <li className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
          <CheckCircle className="w-4 h-4 text-green-500" />
          Métricas de rendimiento por transportadora
        </li>
        <li className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
          <CheckCircle className="w-4 h-4 text-green-500" />
          Recomendaciones de acción prioritarias
        </li>
      </ul>

      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-2">
          <Lightbulb className="w-4 h-4 text-blue-500 mt-0.5" />
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <strong>TIP:</strong> Haz click en cualquier métrica para ver el detalle de las guías involucradas
          </p>
        </div>
      </div>
    </div>

    <button
      onClick={onGenerate}
      className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all transform hover:scale-105"
    >
      <Sparkles className="w-6 h-6" />
      Generar Reporte
    </button>
  </div>
);

export const AIReportTab: React.FC<AIReportTabProps> = ({ shipments, onNavigateToSemaforo }) => {
  const [reportGenerated, setReportGenerated] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [modalGuias, setModalGuias] = useState<Shipment[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');

  // Calculate stats
  const stats = useMemo(() => calculateStats(shipments), [shipments]);
  const semaforoGroups = useMemo(() => groupBySemaforo(shipments), [shipments]);

  // Group by status
  const statusGroups = useMemo(() => {
    const groups: Record<NormalizedStatus, Shipment[]> = {
      ENTREGADO: [],
      EN_REPARTO: [],
      EN_TRANSITO: [],
      EN_OFICINA: [],
      NOVEDAD: [],
      PENDIENTE: [],
      DESCONOCIDO: []
    };

    shipments.forEach(s => {
      const status = getActualStatus(s);
      groups[status].push(s);
    });

    return groups;
  }, [shipments]);

  // Calculate carrier performance
  const carrierPerformance = useMemo(() => {
    const perf: Record<string, { total: number; delivered: number; issues: number }> = {};

    shipments.forEach(s => {
      const carrier = s.carrier;
      if (!perf[carrier]) perf[carrier] = { total: 0, delivered: 0, issues: 0 };
      perf[carrier].total++;
      if (s.status === ShipmentStatus.DELIVERED) perf[carrier].delivered++;
      if (s.status === ShipmentStatus.ISSUE) perf[carrier].issues++;
    });

    return Object.entries(perf).map(([carrier, data]) => ({
      carrier,
      ...data,
      successRate: data.total > 0 ? Math.round((data.delivered / data.total) * 100) : 0
    })).sort((a, b) => a.successRate - b.successRate);
  }, [shipments]);

  // Generate recommendations
  const recommendations = useMemo(() => {
    const recs: RecommendationCardProps[] = [];

    // 1. Guides with issues (URGENT)
    const withIssues = statusGroups.NOVEDAD;
    if (withIssues.length > 0) {
      recs.push({
        type: 'URGENT',
        title: `${withIssues.length} guías requieren acción inmediata`,
        description: 'Hay envíos con novedad que necesitan resolverse hoy.',
        actionLabel: 'Ver guías',
        onAction: () => handleMetricClick('NOVEDAD', withIssues, '⚠️ Guías con Novedad')
      });
    }

    // 2. Guides in office > 48h (WARNING)
    const inOffice = statusGroups.EN_OFICINA.filter(s => {
      const hours = getHoursSinceUpdate(s);
      return hours > 48;
    });
    if (inOffice.length > 0) {
      recs.push({
        type: 'WARNING',
        title: `${inOffice.length} guías en oficina por más de 48h`,
        description: 'Contacta a los clientes para coordinar retiro o re-entrega.',
        actionLabel: 'Contactar',
        onAction: () => handleMetricClick('EN_OFICINA_LARGO', inOffice, '📍 Guías en Oficina (+48h)')
      });
    }

    // 3. Poor performing carrier (TIP)
    const worstCarrier = carrierPerformance[0];
    if (worstCarrier && worstCarrier.successRate < 70 && worstCarrier.total >= 5) {
      recs.push({
        type: 'TIP',
        title: `${worstCarrier.carrier} tiene ${worstCarrier.successRate}% de éxito`,
        description: 'Considera usar otra transportadora para esas rutas.',
        actionLabel: 'Ver análisis'
      });
    }

    // 4. High success rate (SUCCESS)
    const overallSuccess = stats.total > 0 ? Math.round((stats.delivered / stats.total) * 100) : 0;
    if (overallSuccess > 90 && stats.total > 5) {
      recs.push({
        type: 'SUCCESS',
        title: `¡Excelente! ${overallSuccess}% de éxito general`,
        description: 'Tu operación logística está funcionando muy bien.'
      });
    }

    return recs;
  }, [statusGroups, carrierPerformance, stats]);

  const handleMetricClick = (filter: string, guias: Shipment[], title: string) => {
    setSelectedFilter(filter);
    setModalGuias(guias);
    setModalTitle(title);
    setIsModalOpen(true);
  };

  const reportDate = new Date().toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  if (!reportGenerated) {
    return <ReportOnboarding onGenerate={() => setReportGenerated(true)} />;
  }

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-blue-600" />
            Reporte IA
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Generado: {reportDate}
          </p>
        </div>
        <button
          onClick={() => setReportGenerated(false)}
          className="flex items-center gap-2 px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-bold text-sm transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Regenerar
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <MetricCard
          value={stats.total}
          label="Total Guías"
          icon={Package}
          colorClass="text-white"
          bgClass="bg-slate-700"
          onClick={() => handleMetricClick('TOTAL', shipments, '📦 Todas las Guías')}
        />
        <MetricCard
          value={statusGroups.ENTREGADO.length}
          label="Entregadas"
          icon={CheckCircle}
          colorClass="text-white"
          bgClass="bg-green-500"
          onClick={() => handleMetricClick('ENTREGADO', statusGroups.ENTREGADO, '✅ Guías Entregadas')}
        />
        <MetricCard
          value={statusGroups.EN_TRANSITO.length + statusGroups.EN_REPARTO.length}
          label="En Camino"
          icon={Truck}
          colorClass="text-white"
          bgClass="bg-blue-500"
          onClick={() => handleMetricClick('EN_CAMINO', [...statusGroups.EN_TRANSITO, ...statusGroups.EN_REPARTO], '🚚 Guías en Camino')}
        />
        <MetricCard
          value={statusGroups.EN_OFICINA.length}
          label="En Oficina"
          icon={MapPin}
          colorClass="text-white"
          bgClass="bg-orange-500"
          onClick={() => handleMetricClick('EN_OFICINA', statusGroups.EN_OFICINA, '📍 Guías en Oficina')}
        />
        <MetricCard
          value={statusGroups.NOVEDAD.length}
          label="Novedades"
          icon={AlertTriangle}
          colorClass="text-white"
          bgClass="bg-red-500"
          onClick={() => handleMetricClick('NOVEDAD', statusGroups.NOVEDAD, '⚠️ Guías con Novedad')}
        />
      </div>

      {/* AI Analysis */}
      <div className="bg-gradient-to-r from-blue-900 to-slate-900 rounded-2xl p-6 text-white">
        <div className="flex items-start gap-4">
          <div className="bg-white/10 p-3 rounded-xl">
            <Sparkles className="w-6 h-6 text-yellow-400" />
          </div>
          <div>
            <h3 className="font-bold text-lg mb-2">Análisis IA</h3>
            <p className="text-blue-100 leading-relaxed">
              {statusGroups.EN_OFICINA.length > 0 && (
                <>Tienes <strong>{statusGroups.EN_OFICINA.length} guías en oficina</strong>. </>
              )}
              {statusGroups.NOVEDAD.length > 0 && (
                <>Las <strong>{statusGroups.NOVEDAD.length} guías con novedad</strong> requieren acción inmediata. </>
              )}
              {stats.avgDays > 5 && (
                <>El tiempo promedio de {stats.avgDays} días está por encima del objetivo. </>
              )}
              {stats.delivered > 0 && (
                <>Se han entregado exitosamente <strong>{stats.delivered} guías</strong> ({Math.round((stats.delivered / stats.total) * 100)}% de efectividad).</>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            Acciones Recomendadas
          </h3>
          <div className="space-y-3">
            {recommendations.map((rec, idx) => (
              <RecommendationCard key={idx} {...rec} />
            ))}
          </div>
        </div>
      )}

      {/* Carrier Performance */}
      {carrierPerformance.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Rendimiento por Transportadora
          </h3>
          <div className="space-y-4">
            {carrierPerformance.map(carrier => (
              <div key={carrier.carrier} className="flex items-center gap-4">
                <div className="w-32 font-medium text-slate-700 dark:text-slate-300 truncate">
                  {carrier.carrier}
                </div>
                <div className="flex-1 h-4 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      carrier.successRate >= 80
                        ? 'bg-green-500'
                        : carrier.successRate >= 60
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                    }`}
                    style={{ width: `${carrier.successRate}%` }}
                  />
                </div>
                <div className="w-16 text-right font-bold text-slate-800 dark:text-white">
                  {carrier.successRate}%
                </div>
                <div className="w-16 text-right text-xs text-slate-500">
                  {carrier.total} guías
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      <GuiasDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        guias={modalGuias}
        title={modalTitle}
        filterStatus={selectedFilter || undefined}
      />
    </div>
  );
};

export default AIReportTab;
