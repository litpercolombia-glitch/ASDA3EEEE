// components/dashboard/QuickDashboard.tsx
// Dashboard rápido con resumen del día y accesos directos
import React, { useMemo } from 'react';
import {
  Package,
  Truck,
  CheckCircle,
  AlertTriangle,
  Building2,
  TrendingUp,
  TrendingDown,
  Clock,
  Phone,
  Target,
  Zap,
  Calendar,
  ArrowRight,
  Sparkles,
  Bell,
  Activity,
  BarChart3,
  PieChart,
  Users,
  MapPin,
} from 'lucide-react';
import { Shipment, ShipmentStatus } from '../../types';

interface QuickDashboardProps {
  shipments: Shipment[];
  onNavigateToTab?: (tab: string) => void;
  userName?: string;
}

export const QuickDashboard: React.FC<QuickDashboardProps> = ({
  shipments,
  onNavigateToTab,
  userName = 'Usuario',
}) => {
  // Métricas calculadas
  // CORREGIDO: Usar valores del enum ShipmentStatus
  const metrics = useMemo(() => {
    const total = shipments.length;
    const delivered = shipments.filter(s =>
      s.status === ShipmentStatus.DELIVERED ||
      s.status === 'delivered' ||
      s.status === 'Entregado'
    ).length;
    const inTransit = shipments.filter(s =>
      s.status === ShipmentStatus.IN_TRANSIT ||
      s.status === 'in_transit' ||
      s.status === 'En Reparto'
    ).length;
    const issues = shipments.filter(s =>
      s.status === ShipmentStatus.ISSUE ||
      s.status === 'issue' ||
      s.status === 'Novedad'
    ).length;
    const inOffice = shipments.filter(s =>
      s.status === ShipmentStatus.IN_OFFICE ||
      s.status === 'in_office' ||
      s.status === 'En Oficina'
    ).length;

    const withPhone = shipments.filter(s =>
      s.phone || (s as any).recipientPhone || (s as any).senderPhone
    ).length;

    // Críticas
    const critical = shipments.filter(s => {
      const isDelivered = s.status === ShipmentStatus.DELIVERED ||
        s.status === 'delivered' || s.status === 'Entregado';
      if (isDelivered) return false;
      const days = s.detailedInfo?.daysInTransit || 0;
      const isIssue = s.status === ShipmentStatus.ISSUE ||
        s.status === 'issue' || s.status === 'Novedad';
      return days >= 5 || isIssue;
    }).length;

    // Tasas
    const deliveryRate = total > 0 ? Math.round((delivered / total) * 100) : 0;
    const issueRate = total > 0 ? Math.round((issues / total) * 100) : 0;

    // Por transportadora
    const byCarrier: Record<string, number> = {};
    shipments.forEach(s => {
      if (s.carrier) {
        byCarrier[s.carrier] = (byCarrier[s.carrier] || 0) + 1;
      }
    });
    const topCarriers = Object.entries(byCarrier)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Por ciudad
    const byCity: Record<string, number> = {};
    shipments.forEach(s => {
      const city = s.detailedInfo?.destination;
      if (city) {
        byCity[city] = (byCity[city] || 0) + 1;
      }
    });
    const topCities = Object.entries(byCity)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      total,
      delivered,
      inTransit,
      issues,
      inOffice,
      critical,
      withPhone,
      deliveryRate,
      issueRate,
      topCarriers,
      topCities,
    };
  }, [shipments]);

  // Hora actual para saludo
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
      {/* ===== HEADER DE BIENVENIDA ===== */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 rounded-2xl border border-purple-500/20 overflow-hidden">
        <div className="p-6 relative">
          {/* Efectos de fondo */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-1/4 w-64 h-64 bg-purple-500 rounded-full filter blur-[80px]"></div>
            <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-cyan-500 rounded-full filter blur-[80px]"></div>
          </div>

          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <p className="text-purple-300 text-sm">{today}</p>
              <h1 className="text-2xl lg:text-3xl font-bold text-white mt-1">
                {getGreeting()}, {userName}
              </h1>
              <p className="text-slate-300 mt-2">
                Aquí está el resumen de tu operación logística
              </p>
            </div>

            {/* Métricas destacadas */}
            <div className="flex items-center gap-4">
              <div className="text-center px-6 py-3 bg-white/10 rounded-xl backdrop-blur-sm">
                <p className="text-3xl font-bold text-white">{metrics.total}</p>
                <p className="text-xs text-purple-200">Guías Activas</p>
              </div>
              <div className={`text-center px-6 py-3 rounded-xl backdrop-blur-sm ${
                metrics.deliveryRate >= 80 ? 'bg-emerald-500/20' : 'bg-amber-500/20'
              }`}>
                <p className={`text-3xl font-bold ${metrics.deliveryRate >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {metrics.deliveryRate}%
                </p>
                <p className={`text-xs ${metrics.deliveryRate >= 80 ? 'text-emerald-200' : 'text-amber-200'}`}>
                  Tasa Entrega
                </p>
              </div>
              {metrics.critical > 0 && (
                <div className="text-center px-6 py-3 bg-red-500/20 rounded-xl backdrop-blur-sm animate-pulse">
                  <p className="text-3xl font-bold text-red-400">{metrics.critical}</p>
                  <p className="text-xs text-red-200">Críticas</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ===== TARJETAS DE ESTADO ===== */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          {
            label: 'Entregadas',
            value: metrics.delivered,
            icon: CheckCircle,
            color: 'emerald',
            onClick: () => onNavigateToTab?.('operaciones'),
          },
          {
            label: 'En Tránsito',
            value: metrics.inTransit,
            icon: Truck,
            color: 'blue',
            onClick: () => onNavigateToTab?.('operaciones'),
          },
          {
            label: 'Con Novedad',
            value: metrics.issues,
            icon: AlertTriangle,
            color: 'red',
            onClick: () => onNavigateToTab?.('operaciones'),
          },
          {
            label: 'En Oficina',
            value: metrics.inOffice,
            icon: Building2,
            color: 'amber',
            onClick: () => onNavigateToTab?.('operaciones'),
          },
          {
            label: 'Con Teléfono',
            value: metrics.withPhone,
            icon: Phone,
            color: 'green',
            percentage: metrics.total > 0 ? Math.round((metrics.withPhone / metrics.total) * 100) : 0,
          },
        ].map((stat, i) => (
          <button
            key={i}
            onClick={stat.onClick}
            className={`bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-700 p-4
              hover:border-${stat.color}-500 hover:shadow-lg hover:shadow-${stat.color}-500/10 transition-all
              text-left group`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg bg-${stat.color}-100 dark:bg-${stat.color}-900/30
                group-hover:scale-110 transition-transform`}>
                <stat.icon className={`w-5 h-5 text-${stat.color}-600 dark:text-${stat.color}-400`} />
              </div>
              {stat.percentage !== undefined && (
                <span className="text-xs text-slate-500">{stat.percentage}%</span>
              )}
            </div>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{stat.value}</p>
            <p className="text-sm text-slate-500">{stat.label}</p>
          </button>
        ))}
      </div>

      {/* ===== ACCIONES RÁPIDAS ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alertas */}
        <div className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-700 p-5">
          <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-500" />
            Alertas del Día
          </h3>

          <div className="space-y-3">
            {metrics.critical > 0 && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-medium text-red-700 dark:text-red-400">
                    {metrics.critical} guías críticas requieren atención
                  </span>
                </div>
              </div>
            )}

            {metrics.inOffice > 0 && (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                    {metrics.inOffice} guías en oficina esperando retiro
                  </span>
                </div>
              </div>
            )}

            {metrics.issues > 0 && (
              <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-medium text-orange-700 dark:text-orange-400">
                    {metrics.issues} guías con novedad para gestionar
                  </span>
                </div>
              </div>
            )}

            {metrics.critical === 0 && metrics.inOffice === 0 && metrics.issues === 0 && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                    ¡Excelente! No hay alertas pendientes
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Top transportadoras */}
        <div className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-700 p-5">
          <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <Truck className="w-5 h-5 text-purple-500" />
            Por Transportadora
          </h3>

          <div className="space-y-3">
            {metrics.topCarriers.length > 0 ? (
              metrics.topCarriers.map(([carrier, count], i) => (
                <div key={carrier} className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    i === 0 ? 'bg-amber-100 text-amber-600' :
                    i === 1 ? 'bg-slate-100 text-slate-600' :
                    i === 2 ? 'bg-orange-100 text-orange-600' :
                    'bg-slate-50 text-slate-500'
                  }`}>
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{carrier}</span>
                      <span className="text-sm text-slate-500">{count}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 dark:bg-navy-700 rounded-full mt-1 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          i === 0 ? 'bg-purple-500' : i === 1 ? 'bg-purple-400' : 'bg-purple-300'
                        }`}
                        style={{ width: `${(count / metrics.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400 text-center py-4">Sin datos disponibles</p>
            )}
          </div>
        </div>

        {/* Top ciudades */}
        <div className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-700 p-5">
          <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-cyan-500" />
            Por Ciudad Destino
          </h3>

          <div className="space-y-3">
            {metrics.topCities.length > 0 ? (
              metrics.topCities.map(([city, count], i) => (
                <div key={city} className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    i === 0 ? 'bg-cyan-100 text-cyan-600' :
                    i === 1 ? 'bg-slate-100 text-slate-600' :
                    'bg-slate-50 text-slate-500'
                  }`}>
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{city}</span>
                      <span className="text-sm text-slate-500">{count}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 dark:bg-navy-700 rounded-full mt-1 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          i === 0 ? 'bg-cyan-500' : i === 1 ? 'bg-cyan-400' : 'bg-cyan-300'
                        }`}
                        style={{ width: `${(count / metrics.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400 text-center py-4">Sin datos disponibles</p>
            )}
          </div>
        </div>
      </div>

      {/* ===== ACCESOS RÁPIDOS ===== */}
      <div className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-700 p-5">
        <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500" />
          Accesos Rápidos
        </h3>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Centro de Operaciones', icon: Package, color: 'cyan', tab: 'operaciones' },
            { label: 'Inteligencia IA', icon: Sparkles, color: 'purple', tab: 'inteligencia-ia' },
            { label: 'Análisis y Reportes', icon: BarChart3, color: 'emerald', tab: 'analisis' },
            { label: 'Configuración', icon: Users, color: 'slate', tab: 'admin' },
          ].map((item, i) => (
            <button
              key={i}
              onClick={() => onNavigateToTab?.(item.tab)}
              className={`flex items-center gap-3 p-4 rounded-xl border border-slate-200 dark:border-navy-600
                hover:border-${item.color}-500 hover:bg-${item.color}-50 dark:hover:bg-${item.color}-900/20
                transition-all group text-left`}
            >
              <div className={`p-2 rounded-lg bg-${item.color}-100 dark:bg-${item.color}-900/30
                group-hover:scale-110 transition-transform`}>
                <item.icon className={`w-5 h-5 text-${item.color}-600 dark:text-${item.color}-400`} />
              </div>
              <div className="flex-1">
                <p className="font-medium text-slate-800 dark:text-white text-sm">{item.label}</p>
              </div>
              <ArrowRight className={`w-4 h-4 text-slate-400 group-hover:text-${item.color}-500
                group-hover:translate-x-1 transition-all`} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuickDashboard;
