// components/Dashboard/ExecutiveDashboard.tsx
// Flexport-inspired executive logistics dashboard
import React, { useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Package,
  Truck,
  Clock,
  ShieldCheck,
  AlertTriangle,
  MapPin,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import {
  format,
  subDays,
  parseISO,
  differenceInDays,
  isAfter,
  isBefore,
  startOfDay,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { Shipment, ShipmentStatus } from '../../types';

// ============================================
// INTERFACES
// ============================================

interface ExecutiveDashboardProps {
  shipments: Shipment[];
  country: string;
}

interface KPIData {
  title: string;
  value: string;
  subtitle: string;
  trend: number; // percentage change vs previous period
  icon: React.ReactNode;
  color: 'emerald' | 'amber' | 'red' | 'blue';
}

interface DailyShipmentPoint {
  date: string;
  label: string;
  count: number;
}

interface CarrierDeliveryPoint {
  carrier: string;
  delivered: number;
  total: number;
}

interface RiskShipment {
  id: string;
  carrier: string;
  daysInTransit: number;
  status: ShipmentStatus;
  riskLevel: string;
  urgencyScore: number;
}

interface CityPerformance {
  city: string;
  total: number;
  delivered: number;
  deliveryRate: number;
}

// ============================================
// HELPER: TREND ARROW
// ============================================

const TrendIndicator: React.FC<{ value: number; invertColor?: boolean }> = ({
  value,
  invertColor = false,
}) => {
  if (Math.abs(value) < 0.1) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
        <Minus className="w-3 h-3" />
        0%
      </span>
    );
  }

  const isPositive = value > 0;
  const isGood = invertColor ? !isPositive : isPositive;

  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-medium ${
        isGood
          ? 'text-emerald-600 dark:text-emerald-400'
          : 'text-red-600 dark:text-red-400'
      }`}
    >
      {isPositive ? (
        <ArrowUpRight className="w-3 h-3" />
      ) : (
        <ArrowDownRight className="w-3 h-3" />
      )}
      {Math.abs(value).toFixed(1)}%
    </span>
  );
};

// ============================================
// HELPER: STATUS BADGE
// ============================================

const StatusBadge: React.FC<{ status: ShipmentStatus }> = ({ status }) => {
  const config: Record<ShipmentStatus, { bg: string; text: string }> = {
    [ShipmentStatus.DELIVERED]: {
      bg: 'bg-emerald-50 dark:bg-emerald-900/30',
      text: 'text-emerald-700 dark:text-emerald-300',
    },
    [ShipmentStatus.IN_TRANSIT]: {
      bg: 'bg-blue-50 dark:bg-blue-900/30',
      text: 'text-blue-700 dark:text-blue-300',
    },
    [ShipmentStatus.IN_OFFICE]: {
      bg: 'bg-amber-50 dark:bg-amber-900/30',
      text: 'text-amber-700 dark:text-amber-300',
    },
    [ShipmentStatus.PENDING]: {
      bg: 'bg-gray-50 dark:bg-gray-800',
      text: 'text-gray-700 dark:text-gray-300',
    },
    [ShipmentStatus.ISSUE]: {
      bg: 'bg-red-50 dark:bg-red-900/30',
      text: 'text-red-700 dark:text-red-300',
    },
  };

  const c = config[status] || config[ShipmentStatus.PENDING];

  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}
    >
      {status}
    </span>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  shipments,
  country,
}) => {
  const now = useMemo(() => new Date(), []);

  // ---- Split shipments into current and previous period (last 15 days each) ----
  const { currentPeriod, previousPeriod } = useMemo(() => {
    const midpoint = subDays(now, 15);
    const periodStart = subDays(now, 30);

    const current: Shipment[] = [];
    const previous: Shipment[] = [];

    shipments.forEach((s) => {
      try {
        const d = parseISO(s.dateKey);
        if (isAfter(d, midpoint)) {
          current.push(s);
        } else if (isAfter(d, periodStart)) {
          previous.push(s);
        }
      } catch {
        current.push(s); // fallback: treat undated as current
      }
    });

    return { currentPeriod: current, previousPeriod: previous };
  }, [shipments, now]);

  // ---- KPI computations ----
  const kpis = useMemo((): KPIData[] => {
    const total = shipments.length;
    const delivered = shipments.filter(
      (s) => s.status === ShipmentStatus.DELIVERED
    ).length;
    const deliveryRate = total > 0 ? (delivered / total) * 100 : 0;

    const withTransitInfo = shipments.filter(
      (s) => s.detailedInfo?.daysInTransit != null
    );
    const avgDays =
      withTransitInfo.length > 0
        ? withTransitInfo.reduce(
            (sum, s) => sum + (s.detailedInfo?.daysInTransit || 0),
            0
          ) / withTransitInfo.length
        : 0;

    const deliveredShipments = shipments.filter(
      (s) => s.status === ShipmentStatus.DELIVERED
    );
    const onTime = deliveredShipments.filter(
      (s) => (s.detailedInfo?.daysInTransit || 0) <= 5
    ).length;
    const slaCompliance =
      deliveredShipments.length > 0
        ? (onTime / deliveredShipments.length) * 100
        : 0;

    // Previous period metrics for trends
    const prevTotal = previousPeriod.length;
    const curTotal = currentPeriod.length;
    const totalTrend =
      prevTotal > 0 ? ((curTotal - prevTotal) / prevTotal) * 100 : 0;

    const prevDelivered = previousPeriod.filter(
      (s) => s.status === ShipmentStatus.DELIVERED
    ).length;
    const prevDeliveryRate =
      prevTotal > 0 ? (prevDelivered / prevTotal) * 100 : 0;
    const deliveryTrend = deliveryRate - prevDeliveryRate;

    const prevWithTransit = previousPeriod.filter(
      (s) => s.detailedInfo?.daysInTransit != null
    );
    const prevAvgDays =
      prevWithTransit.length > 0
        ? prevWithTransit.reduce(
            (sum, s) => sum + (s.detailedInfo?.daysInTransit || 0),
            0
          ) / prevWithTransit.length
        : 0;
    const avgDaysTrend =
      prevAvgDays > 0 ? ((avgDays - prevAvgDays) / prevAvgDays) * 100 : 0;

    const prevDeliveredShipments = previousPeriod.filter(
      (s) => s.status === ShipmentStatus.DELIVERED
    );
    const prevOnTime = prevDeliveredShipments.filter(
      (s) => (s.detailedInfo?.daysInTransit || 0) <= 5
    ).length;
    const prevSla =
      prevDeliveredShipments.length > 0
        ? (prevOnTime / prevDeliveredShipments.length) * 100
        : 0;
    const slaTrend = slaCompliance - prevSla;

    return [
      {
        title: 'Total Envios',
        value: total.toLocaleString(),
        subtitle: `${curTotal} ultimos 15 dias`,
        trend: totalTrend,
        icon: <Package className="w-5 h-5" />,
        color: 'blue',
      },
      {
        title: 'Tasa de Entrega',
        value: `${deliveryRate.toFixed(1)}%`,
        subtitle: `${delivered} de ${total} entregados`,
        trend: deliveryTrend,
        icon: <Truck className="w-5 h-5" />,
        color: deliveryRate >= 80 ? 'emerald' : deliveryRate >= 60 ? 'amber' : 'red',
      },
      {
        title: 'Tiempo Promedio',
        value: `${avgDays.toFixed(1)}d`,
        subtitle: 'dias en transito',
        trend: avgDaysTrend,
        icon: <Clock className="w-5 h-5" />,
        color: avgDays <= 3 ? 'emerald' : avgDays <= 5 ? 'amber' : 'red',
      },
      {
        title: 'SLA Compliance',
        value: `${slaCompliance.toFixed(1)}%`,
        subtitle: `${onTime} de ${deliveredShipments.length} a tiempo`,
        trend: slaTrend,
        icon: <ShieldCheck className="w-5 h-5" />,
        color:
          slaCompliance >= 90
            ? 'emerald'
            : slaCompliance >= 70
            ? 'amber'
            : 'red',
      },
    ];
  }, [shipments, currentPeriod, previousPeriod]);

  // ---- Daily shipments chart data (last 30 days) ----
  const dailyData = useMemo((): DailyShipmentPoint[] => {
    const days: DailyShipmentPoint[] = [];
    const countMap = new Map<string, number>();

    shipments.forEach((s) => {
      try {
        const key = format(parseISO(s.dateKey), 'yyyy-MM-dd');
        countMap.set(key, (countMap.get(key) || 0) + 1);
      } catch {
        // skip invalid dates
      }
    });

    for (let i = 29; i >= 0; i--) {
      const day = subDays(now, i);
      const key = format(day, 'yyyy-MM-dd');
      days.push({
        date: key,
        label: format(day, 'dd MMM', { locale: es }),
        count: countMap.get(key) || 0,
      });
    }

    return days;
  }, [shipments, now]);

  // ---- Carrier deliveries chart data ----
  const carrierData = useMemo((): CarrierDeliveryPoint[] => {
    const map = new Map<string, { delivered: number; total: number }>();

    shipments.forEach((s) => {
      const carrier = s.carrier || 'Desconocido';
      const entry = map.get(carrier) || { delivered: 0, total: 0 };
      entry.total++;
      if (s.status === ShipmentStatus.DELIVERED) entry.delivered++;
      map.set(carrier, entry);
    });

    return Array.from(map.entries())
      .map(([carrier, data]) => ({
        carrier: carrier.length > 12 ? carrier.slice(0, 12) + '...' : carrier,
        delivered: data.delivered,
        total: data.total,
      }))
      .sort((a, b) => b.total - a.total);
  }, [shipments]);

  // ---- Risk shipments ----
  const riskShipments = useMemo((): RiskShipment[] => {
    const urgencyMap: Record<string, number> = {
      URGENTE: 4,
      'ATENCIÓN': 3,
      SEGUIMIENTO: 2,
      NORMAL: 1,
    };

    return shipments
      .filter((s) => {
        const hasRisk =
          s.riskAnalysis &&
          s.riskAnalysis.level !== 'NORMAL';
        const isIssue = s.status === ShipmentStatus.ISSUE;
        const isLate = (s.detailedInfo?.daysInTransit || 0) > 5 &&
          s.status !== ShipmentStatus.DELIVERED;
        return hasRisk || isIssue || isLate;
      })
      .map((s) => ({
        id: s.id,
        carrier: s.carrier,
        daysInTransit: s.detailedInfo?.daysInTransit || 0,
        status: s.status,
        riskLevel: s.riskAnalysis?.level || 'SEGUIMIENTO',
        urgencyScore: urgencyMap[s.riskAnalysis?.level || 'SEGUIMIENTO'] || 2,
      }))
      .sort((a, b) => b.urgencyScore - a.urgencyScore || b.daysInTransit - a.daysInTransit)
      .slice(0, 20);
  }, [shipments]);

  // ---- City performance ----
  const cityPerformance = useMemo((): CityPerformance[] => {
    const map = new Map<string, { total: number; delivered: number }>();

    shipments.forEach((s) => {
      const city = s.detailedInfo?.destination || 'Desconocido';
      if (city === 'Desconocido') return;
      const entry = map.get(city) || { total: 0, delivered: 0 };
      entry.total++;
      if (s.status === ShipmentStatus.DELIVERED) entry.delivered++;
      map.set(city, entry);
    });

    return Array.from(map.entries())
      .map(([city, data]) => ({
        city,
        total: data.total,
        delivered: data.delivered,
        deliveryRate: data.total > 0 ? (data.delivered / data.total) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [shipments]);

  // ---- Color helpers ----
  const colorMap = {
    emerald: {
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      icon: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-200 dark:border-emerald-800',
    },
    amber: {
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      icon: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-200 dark:border-amber-800',
    },
    red: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      icon: 'text-red-600 dark:text-red-400',
      border: 'border-red-200 dark:border-red-800',
    },
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      icon: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-200 dark:border-blue-800',
    },
  };

  const riskBadgeColor = (level: string) => {
    switch (level) {
      case 'URGENTE':
        return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300';
      case 'ATENCIÓN':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
      case 'SEGUIMIENTO':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Dashboard Ejecutivo
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {country} &middot; {format(now, "d 'de' MMMM yyyy", { locale: es })}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Tiempo real
        </div>
      </div>

      {/* Row 1: KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const colors = colorMap[kpi.color];
          return (
            <div
              key={kpi.title}
              className="relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5 transition-colors hover:border-gray-300 dark:hover:border-gray-600"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {kpi.title}
                </span>
                <div className={`p-2 rounded-lg ${colors.bg}`}>
                  <span className={colors.icon}>{kpi.icon}</span>
                </div>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {kpi.value}
                </span>
                <TrendIndicator
                  value={kpi.trend}
                  invertColor={kpi.title === 'Tiempo Promedio'}
                />
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {kpi.subtitle}
              </p>
            </div>
          );
        })}
      </div>

      {/* Row 2: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Daily Shipments Line Chart */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
            Envios Diarios
          </h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
            Ultimos 30 dias
          </p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="currentColor"
                  className="text-gray-100 dark:text-gray-800"
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11 }}
                  className="text-gray-400"
                  interval="preserveStartEnd"
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  className="text-gray-400"
                  tickLine={false}
                  axisLine={false}
                  width={32}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255,255,255,0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  labelFormatter={(label) => `Fecha: ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                  name="Envios"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Carrier Deliveries Bar Chart */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
            Entregas por Transportadora
          </h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
            Total vs entregados
          </p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={carrierData} barGap={2}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="currentColor"
                  className="text-gray-100 dark:text-gray-800"
                />
                <XAxis
                  dataKey="carrier"
                  tick={{ fontSize: 10 }}
                  className="text-gray-400"
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  className="text-gray-400"
                  tickLine={false}
                  axisLine={false}
                  width={32}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255,255,255,0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar
                  dataKey="total"
                  fill="#e5e7eb"
                  radius={[4, 4, 0, 0]}
                  name="Total"
                />
                <Bar
                  dataKey="delivered"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  name="Entregados"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Risk Shipments */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Envios en Riesgo
            </h3>
            <span className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
              {riskShipments.length}
            </span>
          </div>

          {riskShipments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400 dark:text-gray-500">
              <ShieldCheck className="w-8 h-8 mb-2" />
              <p className="text-sm">Sin envios en riesgo</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {riskShipments.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono font-medium text-gray-900 dark:text-gray-100 truncate">
                        {s.id}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${riskBadgeColor(
                          s.riskLevel
                        )}`}
                      >
                        {s.riskLevel}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                      <span>{s.carrier}</span>
                      <span>{s.daysInTransit}d en transito</span>
                    </div>
                  </div>
                  <StatusBadge status={s.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* City Performance */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Rendimiento por Ciudad
            </h3>
          </div>

          {cityPerformance.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400 dark:text-gray-500">
              <MapPin className="w-8 h-8 mb-2" />
              <p className="text-sm">Sin datos de ciudades</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-72 overflow-y-auto">
              {cityPerformance.map((c) => (
                <div key={c.city} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[60%]">
                      {c.city}
                    </span>
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>{c.total} envios</span>
                      <span
                        className={`font-semibold ${
                          c.deliveryRate >= 80
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : c.deliveryRate >= 60
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {c.deliveryRate.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        c.deliveryRate >= 80
                          ? 'bg-emerald-500'
                          : c.deliveryRate >= 60
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(c.deliveryRate, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExecutiveDashboard;
