// components/tabs/AnalisisUnificadoTab.tsx
// Tab unificado que combina: Predicción Demanda + Reportes + Gamificación/Logros
import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  Trophy,
  FileText,
  PieChart,
  Calendar,
  Target,
  Award,
  Star,
  Zap,
  Download,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Clock,
  CheckCircle,
  AlertTriangle,
  Users,
  Truck,
  MapPin,
  DollarSign,
} from 'lucide-react';
import { Shipment } from '../../types';

// Importar componentes existentes
import DemandTab from './DemandTab';
import GamificationTab from './GamificationTab';

// =====================================
// TIPOS
// =====================================
type SubView = 'dashboard' | 'demanda' | 'logros' | 'reportes';

interface AnalisisUnificadoTabProps {
  shipments: Shipment[];
  selectedCountry?: string;
}

// =====================================
// SUB-NAVEGACIÓN
// =====================================
const subNavItems: { id: SubView; label: string; icon: React.ElementType; color: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: PieChart, color: 'blue' },
  { id: 'demanda', label: 'Predicción', icon: TrendingUp, color: 'purple' },
  { id: 'logros', label: 'Logros', icon: Trophy, color: 'amber' },
  { id: 'reportes', label: 'Reportes', icon: FileText, color: 'emerald' },
];

// =====================================
// COMPONENTE PRINCIPAL
// =====================================
export const AnalisisUnificadoTab: React.FC<AnalisisUnificadoTabProps> = ({
  shipments,
  selectedCountry = 'CO',
}) => {
  const [activeView, setActiveView] = useState<SubView>('dashboard');
  const [dateRange, setDateRange] = useState<'hoy' | 'semana' | 'mes'>('hoy');

  // Métricas calculadas
  const metrics = useMemo(() => {
    const total = shipments.length;
    const entregados = shipments.filter(s => s.status === 'delivered').length;
    const enTransito = shipments.filter(s => s.status === 'in_transit').length;
    const conNovedad = shipments.filter(s => s.status === 'issue').length;
    const enOficina = shipments.filter(s => s.status === 'in_office').length;

    // Tasas
    const tasaEntrega = total > 0 ? (entregados / total) * 100 : 0;
    const tasaDevolucion = total > 0 ? ((conNovedad + enOficina) / total) * 100 : 0;

    // Por transportadora
    const porTransportadora: Record<string, { total: number; entregados: number }> = {};
    shipments.forEach(s => {
      const carrier = s.carrier || 'Desconocido';
      if (!porTransportadora[carrier]) {
        porTransportadora[carrier] = { total: 0, entregados: 0 };
      }
      porTransportadora[carrier].total++;
      if (s.status === 'delivered') {
        porTransportadora[carrier].entregados++;
      }
    });

    // Por ciudad
    const porCiudad: Record<string, number> = {};
    shipments.forEach(s => {
      const city = s.detailedInfo?.destination || 'Desconocida';
      porCiudad[city] = (porCiudad[city] || 0) + 1;
    });

    const topCiudades = Object.entries(porCiudad)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      total,
      entregados,
      enTransito,
      conNovedad,
      enOficina,
      tasaEntrega: Math.round(tasaEntrega * 10) / 10,
      tasaDevolucion: Math.round(tasaDevolucion * 10) / 10,
      porTransportadora,
      topCiudades,
      meta: 92, // Meta de entrega
    };
  }, [shipments]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ====================================== */}
      {/* HEADER */}
      {/* ====================================== */}
      <div className="bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-navy-700 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                  Análisis y Rendimiento
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Métricas, predicciones y logros
                </p>
              </div>
            </div>

            {/* Selector de período */}
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-navy-800 rounded-lg p-1">
              {(['hoy', 'semana', 'mes'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setDateRange(period)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    dateRange === period
                      ? 'bg-white dark:bg-navy-700 text-slate-800 dark:text-white shadow'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                  }`}
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sub-navegación */}
        <div className="px-4 py-3 bg-slate-50 dark:bg-navy-950 border-b border-slate-200 dark:border-navy-700">
          <div className="flex items-center gap-2">
            {subNavItems.map((item) => {
              const isActive = activeView === item.id;
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`
                    flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm
                    transition-all duration-200
                    ${isActive
                      ? `bg-${item.color}-500 text-white shadow-lg shadow-${item.color}-500/30`
                      : 'bg-white dark:bg-navy-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-700 border border-slate-200 dark:border-navy-600'
                    }
                  `}
                >
                  <Icon className={`w-4 h-4 ${isActive ? '' : `text-${item.color}-500`}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ====================================== */}
      {/* CONTENIDO DINÁMICO */}
      {/* ====================================== */}
      {activeView === 'dashboard' && (
        <DashboardAnalisis metrics={metrics} />
      )}

      {activeView === 'demanda' && (
        <div className="animate-fade-in">
          <DemandTab country={selectedCountry} />
        </div>
      )}

      {activeView === 'logros' && (
        <div className="animate-fade-in">
          <GamificationTab />
        </div>
      )}

      {activeView === 'reportes' && (
        <ReportesPanel shipments={shipments} metrics={metrics} />
      )}
    </div>
  );
};

// =====================================
// DASHBOARD DE ANÁLISIS
// =====================================
const DashboardAnalisis: React.FC<{ metrics: any }> = ({ metrics }) => {
  return (
    <div className="space-y-6">
      {/* KPIs principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tasa de Entrega */}
        <div className="bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-700 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className={`flex items-center gap-1 text-sm font-medium ${
              metrics.tasaEntrega >= metrics.meta ? 'text-emerald-500' : 'text-amber-500'
            }`}>
              {metrics.tasaEntrega >= metrics.meta ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              {metrics.tasaEntrega >= metrics.meta ? '+' : ''}{(metrics.tasaEntrega - metrics.meta).toFixed(1)}%
            </span>
          </div>
          <p className="text-3xl font-bold text-slate-800 dark:text-white">{metrics.tasaEntrega}%</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Tasa de Entrega</p>
          <div className="mt-3 h-2 bg-slate-100 dark:bg-navy-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                metrics.tasaEntrega >= metrics.meta ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
              style={{ width: `${Math.min(metrics.tasaEntrega, 100)}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-1">Meta: {metrics.meta}%</p>
        </div>

        {/* Tasa de Devolución */}
        <div className="bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-700 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <span className={`flex items-center gap-1 text-sm font-medium ${
              metrics.tasaDevolucion <= 8 ? 'text-emerald-500' : 'text-red-500'
            }`}>
              {metrics.tasaDevolucion <= 8 ? '✓' : '⚠'}
            </span>
          </div>
          <p className="text-3xl font-bold text-slate-800 dark:text-white">{metrics.tasaDevolucion}%</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Tasa de Devolución</p>
          <div className="mt-3 h-2 bg-slate-100 dark:bg-navy-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                metrics.tasaDevolucion <= 8 ? 'bg-emerald-500' : metrics.tasaDevolucion <= 15 ? 'bg-amber-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(metrics.tasaDevolucion * 5, 100)}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-1">Meta: ≤8%</p>
        </div>

        {/* Total Guías */}
        <div className="bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-700 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Truck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-800 dark:text-white">{metrics.total.toLocaleString()}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Total Guías</p>
          <div className="mt-3 flex items-center gap-2 text-xs">
            <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded">{metrics.entregados} entregados</span>
            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded">{metrics.enTransito} en tránsito</span>
          </div>
        </div>

        {/* Críticos */}
        <div className="bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-700 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <Zap className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            {(metrics.conNovedad + metrics.enOficina) > 0 && (
              <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
                ¡Atención!
              </span>
            )}
          </div>
          <p className="text-3xl font-bold text-slate-800 dark:text-white">{metrics.conNovedad + metrics.enOficina}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Guías Críticas</p>
          <div className="mt-3 flex items-center gap-2 text-xs">
            <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 rounded">{metrics.conNovedad} novedades</span>
            <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded">{metrics.enOficina} en oficina</span>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Por Transportadora */}
        <div className="bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-700 p-6">
          <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-500" />
            Rendimiento por Transportadora
          </h3>
          <div className="space-y-3">
            {Object.entries(metrics.porTransportadora)
              .sort((a, b) => b[1].total - a[1].total)
              .slice(0, 5)
              .map(([carrier, data]: [string, any]) => {
                const rate = data.total > 0 ? Math.round((data.entregados / data.total) * 100) : 0;
                return (
                  <div key={carrier} className="flex items-center gap-3">
                    <div className="w-32 truncate text-sm font-medium text-slate-700 dark:text-slate-300">
                      {carrier}
                    </div>
                    <div className="flex-1 h-3 bg-slate-100 dark:bg-navy-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          rate >= 90 ? 'bg-emerald-500' : rate >= 70 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${rate}%` }}
                      />
                    </div>
                    <div className="w-16 text-right">
                      <span className="text-sm font-bold text-slate-800 dark:text-white">{rate}%</span>
                    </div>
                    <div className="w-20 text-right text-xs text-slate-500">
                      {data.total} guías
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Top Ciudades */}
        <div className="bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-700 p-6">
          <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-purple-500" />
            Top Ciudades de Destino
          </h3>
          <div className="space-y-3">
            {metrics.topCiudades.map(([city, count]: [string, number], idx: number) => (
              <div key={city} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                  idx === 0 ? 'bg-amber-100 text-amber-600' :
                  idx === 1 ? 'bg-slate-200 text-slate-600' :
                  idx === 2 ? 'bg-orange-100 text-orange-600' :
                  'bg-slate-100 text-slate-500'
                }`}>
                  {idx + 1}
                </div>
                <div className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-300">
                  {city}
                </div>
                <div className="text-sm font-bold text-slate-800 dark:text-white">
                  {count} guías
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// =====================================
// PANEL DE REPORTES
// =====================================
const ReportesPanel: React.FC<{ shipments: Shipment[]; metrics: any }> = ({ shipments, metrics }) => {
  const reportTypes = [
    {
      id: 'diario',
      title: 'Reporte Diario',
      description: 'Resumen de operaciones del día',
      icon: Calendar,
      color: 'blue',
    },
    {
      id: 'transportadoras',
      title: 'Rendimiento Transportadoras',
      description: 'Comparativo de transportadoras',
      icon: Truck,
      color: 'purple',
    },
    {
      id: 'ciudades',
      title: 'Análisis por Ciudades',
      description: 'Rendimiento geográfico',
      icon: MapPin,
      color: 'emerald',
    },
    {
      id: 'novedades',
      title: 'Reporte de Novedades',
      description: 'Detalle de incidencias',
      icon: AlertTriangle,
      color: 'red',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Grid de reportes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reportTypes.map((report) => {
          const Icon = report.icon;
          return (
            <div
              key={report.id}
              className="bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-700 p-6 hover:shadow-lg transition-shadow cursor-pointer group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-3 bg-${report.color}-100 dark:bg-${report.color}-900/30 rounded-xl group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-6 h-6 text-${report.color}-600 dark:text-${report.color}-400`} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-white">{report.title}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{report.description}</p>
                  </div>
                </div>
                <button className="p-2 bg-slate-100 dark:bg-navy-800 rounded-lg hover:bg-slate-200 dark:hover:bg-navy-700 transition-colors">
                  <Download className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Resumen rápido */}
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl border border-blue-500/20 p-6">
        <h3 className="font-bold text-slate-800 dark:text-white mb-4">Resumen Ejecutivo</h3>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <p>
            <strong>Total de guías procesadas:</strong> {metrics.total.toLocaleString()}<br />
            <strong>Tasa de entrega:</strong> {metrics.tasaEntrega}% (Meta: {metrics.meta}%)<br />
            <strong>Tasa de devolución:</strong> {metrics.tasaDevolucion}% (Meta: ≤8%)<br />
            <strong>Guías pendientes de gestión:</strong> {metrics.conNovedad + metrics.enOficina}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AnalisisUnificadoTab;
