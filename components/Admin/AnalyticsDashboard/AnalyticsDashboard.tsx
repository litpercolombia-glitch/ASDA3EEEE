// ============================================
// LITPER PRO - ANALYTICS DASHBOARD
// Dashboard con gráficos interactivos y métricas avanzadas
// ============================================

import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  PieChart,
  Activity,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  Target,
  Truck,
  Package,
  DollarSign,
  Users,
  Clock,
  MapPin,
  Zap,
  Award,
  AlertCircle,
} from 'lucide-react';

// ============================================
// TIPOS
// ============================================

interface ChartData {
  label: string;
  value: number;
  previousValue?: number;
  color?: string;
}

interface TimeRange {
  id: string;
  label: string;
  days: number;
}

// ============================================
// CONSTANTES
// ============================================

const TIME_RANGES: TimeRange[] = [
  { id: '7d', label: '7 días', days: 7 },
  { id: '30d', label: '30 días', days: 30 },
  { id: '90d', label: '90 días', days: 90 },
  { id: 'ytd', label: 'Este año', days: 365 },
];

const MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

// ============================================
// DATOS MOCK
// ============================================

const generateMonthlyData = (): ChartData[] => {
  return MONTHS_ES.map((month, index) => ({
    label: month,
    value: Math.floor(Math.random() * 500) + 200,
    previousValue: Math.floor(Math.random() * 500) + 200,
    color: 'from-blue-500 to-cyan-500',
  }));
};

const generateCityData = (): ChartData[] => [
  { label: 'Bogotá', value: 1250, color: 'from-emerald-500 to-green-500' },
  { label: 'Medellín', value: 890, color: 'from-blue-500 to-cyan-500' },
  { label: 'Cali', value: 650, color: 'from-purple-500 to-violet-500' },
  { label: 'Barranquilla', value: 420, color: 'from-amber-500 to-orange-500' },
  { label: 'Cartagena', value: 280, color: 'from-pink-500 to-rose-500' },
  { label: 'Otras', value: 510, color: 'from-slate-500 to-gray-500' },
];

const generateCarrierData = (): ChartData[] => [
  { label: 'Coordinadora', value: 78, color: 'from-blue-500 to-indigo-500' },
  { label: 'Interrapidísimo', value: 72, color: 'from-red-500 to-rose-500' },
  { label: 'Servientrega', value: 68, color: 'from-amber-500 to-yellow-500' },
  { label: 'TCC', value: 65, color: 'from-emerald-500 to-green-500' },
  { label: 'Envía', value: 61, color: 'from-purple-500 to-violet-500' },
];

const generateWeeklyTrend = (): number[] => {
  return Array.from({ length: 7 }, () => Math.floor(Math.random() * 100) + 50);
};

// ============================================
// COMPONENTES DE GRÁFICOS
// ============================================

const BarChartComponent: React.FC<{
  data: ChartData[];
  height?: number;
  showLabels?: boolean;
  animated?: boolean;
}> = ({ data, height = 200, showLabels = true, animated = true }) => {
  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <div className="w-full" style={{ height }}>
      <div className="flex items-end justify-between gap-2 h-full">
        {data.map((item, index) => {
          const barHeight = (item.value / maxValue) * 100;

          return (
            <div key={index} className="flex-1 flex flex-col items-center gap-2 group">
              {/* Tooltip */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-navy-900 border border-navy-600 rounded-lg px-2 py-1 text-xs whitespace-nowrap">
                <span className="text-white font-bold">{item.value.toLocaleString()}</span>
              </div>

              {/* Bar */}
              <div className="w-full flex-1 flex items-end">
                <div
                  className={`w-full rounded-t-lg bg-gradient-to-t ${item.color || 'from-blue-500 to-cyan-500'} transition-all duration-500 hover:opacity-80`}
                  style={{
                    height: animated ? `${barHeight}%` : '0%',
                    animation: animated ? `growUp 0.5s ease-out ${index * 0.05}s forwards` : undefined,
                  }}
                />
              </div>

              {/* Label */}
              {showLabels && (
                <span className="text-xs text-slate-400 truncate w-full text-center">
                  {item.label}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes growUp {
          from { height: 0%; }
          to { height: var(--target-height); }
        }
      `}</style>
    </div>
  );
};

const DonutChart: React.FC<{
  data: ChartData[];
  size?: number;
  showLegend?: boolean;
}> = ({ data, size = 200, showLegend = true }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let currentAngle = -90;

  const segments = data.map(item => {
    const percentage = (item.value / total) * 100;
    const angle = (percentage / 100) * 360;
    const startAngle = currentAngle;
    currentAngle += angle;

    return {
      ...item,
      percentage,
      startAngle,
      endAngle: currentAngle,
    };
  });

  const getCoordinates = (angle: number, radius: number) => {
    const radians = (angle * Math.PI) / 180;
    return {
      x: size / 2 + radius * Math.cos(radians),
      y: size / 2 + radius * Math.sin(radians),
    };
  };

  const describeArc = (startAngle: number, endAngle: number, outerRadius: number, innerRadius: number) => {
    const start = getCoordinates(startAngle, outerRadius);
    const end = getCoordinates(endAngle, outerRadius);
    const innerStart = getCoordinates(endAngle, innerRadius);
    const innerEnd = getCoordinates(startAngle, innerRadius);
    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

    return [
      `M ${start.x} ${start.y}`,
      `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`,
      `L ${innerStart.x} ${innerStart.y}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerEnd.x} ${innerEnd.y}`,
      'Z',
    ].join(' ');
  };

  const colors = [
    '#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EC4899', '#6B7280'
  ];

  return (
    <div className="flex items-center gap-6">
      <svg width={size} height={size} className="transform -rotate-90">
        {segments.map((segment, index) => (
          <path
            key={index}
            d={describeArc(segment.startAngle, segment.endAngle - 0.5, size / 2 - 10, size / 2 - 40)}
            fill={colors[index % colors.length]}
            className="hover:opacity-80 transition-opacity cursor-pointer"
          />
        ))}
        {/* Center circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 50}
          fill="currentColor"
          className="text-navy-900"
        />
      </svg>

      {showLegend && (
        <div className="space-y-2">
          {segments.map((segment, index) => (
            <div key={index} className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: colors[index % colors.length] }}
              />
              <div className="flex-1">
                <p className="text-sm text-white font-medium">{segment.label}</p>
                <p className="text-xs text-slate-400">{segment.percentage.toFixed(1)}%</p>
              </div>
              <span className="text-sm font-bold text-white">{segment.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const LineChart: React.FC<{
  data: number[];
  labels?: string[];
  height?: number;
  color?: string;
}> = ({ data, labels, height = 100, color = 'from-blue-500 to-cyan-500' }) => {
  const maxValue = Math.max(...data);
  const minValue = Math.min(...data);
  const range = maxValue - minValue || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - ((value - minValue) / range) * 100;
    return { x, y, value };
  });

  const pathData = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');

  const areaData = `${pathData} L 100 100 L 0 100 Z`;

  return (
    <div className="w-full" style={{ height }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map(y => (
          <line
            key={y}
            x1="0"
            y1={y}
            x2="100"
            y2={y}
            stroke="currentColor"
            strokeWidth="0.5"
            className="text-navy-700"
          />
        ))}

        {/* Area fill */}
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaData} fill="url(#areaGradient)" />

        {/* Line */}
        <path
          d={pathData}
          fill="none"
          stroke="#3B82F6"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Points */}
        {points.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="2"
            fill="#3B82F6"
            className="hover:r-4 transition-all cursor-pointer"
          />
        ))}
      </svg>

      {labels && (
        <div className="flex justify-between mt-2">
          {labels.map((label, index) => (
            <span key={index} className="text-xs text-slate-400">{label}</span>
          ))}
        </div>
      )}
    </div>
  );
};

const ProgressBar: React.FC<{
  value: number;
  max: number;
  color?: string;
  showLabel?: boolean;
}> = ({ value, max, color = 'from-blue-500 to-cyan-500', showLabel = true }) => {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className="w-full">
      <div className="h-2 bg-navy-700 rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${color} rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between mt-1 text-xs text-slate-400">
          <span>{value.toLocaleString()}</span>
          <span>{max.toLocaleString()}</span>
        </div>
      )}
    </div>
  );
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export const AnalyticsDashboard: React.FC = () => {
  const [selectedRange, setSelectedRange] = useState<TimeRange>(TIME_RANGES[1]);
  const [showFilters, setShowFilters] = useState(false);

  const monthlyData = useMemo(() => generateMonthlyData(), []);
  const cityData = useMemo(() => generateCityData(), []);
  const carrierData = useMemo(() => generateCarrierData(), []);
  const weeklyTrend = useMemo(() => generateWeeklyTrend(), []);

  // KPIs principales
  const kpis = [
    {
      label: 'Total Guías',
      value: '4,892',
      change: 12.5,
      trend: 'up',
      icon: Package,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      label: 'Tasa Entrega',
      value: '78.5%',
      change: 3.2,
      trend: 'up',
      icon: Target,
      color: 'from-emerald-500 to-green-500',
    },
    {
      label: 'Tiempo Promedio',
      value: '2.8 días',
      change: -0.3,
      trend: 'down',
      icon: Clock,
      color: 'from-amber-500 to-orange-500',
    },
    {
      label: 'Ventas',
      value: '$45.2M',
      change: 18.7,
      trend: 'up',
      icon: DollarSign,
      color: 'from-purple-500 to-violet-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl shadow-xl shadow-indigo-500/30">
            <BarChart3 className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Analytics Dashboard</h1>
            <p className="text-slate-400">Métricas y análisis de rendimiento</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Time Range Selector */}
          <div className="flex bg-navy-800 rounded-xl p-1">
            {TIME_RANGES.map((range) => (
              <button
                key={range.id}
                onClick={() => setSelectedRange(range)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedRange.id === range.id
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 bg-navy-800 hover:bg-navy-700 rounded-xl text-slate-400 hover:text-white transition-all"
          >
            <Filter className="w-5 h-5" />
          </button>

          <button className="p-2 bg-navy-800 hover:bg-navy-700 rounded-xl text-slate-400 hover:text-white transition-all">
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <div
              key={index}
              className="relative p-6 bg-navy-800/50 rounded-2xl border border-navy-700 overflow-hidden group hover:border-navy-600 transition-all"
            >
              {/* Background gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${kpi.color} opacity-5 group-hover:opacity-10 transition-opacity`} />

              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${kpi.color}`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className={`flex items-center gap-1 text-sm font-medium ${
                    kpi.trend === 'up' ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {kpi.trend === 'up' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                    {Math.abs(kpi.change)}%
                  </div>
                </div>

                <p className="text-3xl font-bold text-white mb-1">{kpi.value}</p>
                <p className="text-sm text-slate-400">{kpi.label}</p>

                {/* Mini trend line */}
                <div className="mt-4 h-8">
                  <LineChart data={weeklyTrend} height={32} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Monthly Performance */}
        <div className="bg-navy-800/50 rounded-2xl border border-navy-700 overflow-hidden">
          <div className="p-6 border-b border-navy-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                <h3 className="font-semibold text-white">Rendimiento Mensual</h3>
              </div>
              <button className="text-sm text-blue-400 hover:text-blue-300">
                Ver detalle
              </button>
            </div>
          </div>
          <div className="p-6">
            <BarChartComponent data={monthlyData} height={250} />
          </div>
        </div>

        {/* Distribution by City */}
        <div className="bg-navy-800/50 rounded-2xl border border-navy-700 overflow-hidden">
          <div className="p-6 border-b border-navy-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-emerald-400" />
                <h3 className="font-semibold text-white">Distribución por Ciudad</h3>
              </div>
              <button className="text-sm text-emerald-400 hover:text-emerald-300">
                Ver detalle
              </button>
            </div>
          </div>
          <div className="p-6">
            <DonutChart data={cityData} size={180} />
          </div>
        </div>
      </div>

      {/* Carrier Performance */}
      <div className="bg-navy-800/50 rounded-2xl border border-navy-700 overflow-hidden">
        <div className="p-6 border-b border-navy-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Truck className="w-5 h-5 text-amber-400" />
              <h3 className="font-semibold text-white">Rendimiento por Transportadora</h3>
            </div>
            <span className="text-sm text-slate-400">Tasa de entrega (%)</span>
          </div>
        </div>
        <div className="p-6 space-y-4">
          {carrierData.map((carrier, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${carrier.color}`} />
                  <span className="font-medium text-white">{carrier.label}</span>
                </div>
                <span className={`text-sm font-bold ${
                  carrier.value >= 75 ? 'text-emerald-400' :
                  carrier.value >= 65 ? 'text-amber-400' :
                  'text-red-400'
                }`}>
                  {carrier.value}%
                </span>
              </div>
              <ProgressBar value={carrier.value} max={100} color={carrier.color} showLabel={false} />
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Mejor Ciudad', value: 'Bogotá', detail: '1,250 guías', icon: Award, color: 'from-amber-500 to-yellow-500' },
          { label: 'Mejor Transportadora', value: 'Coordinadora', detail: '78% entrega', icon: Truck, color: 'from-blue-500 to-cyan-500' },
          { label: 'Novedades Hoy', value: '12', detail: '2.4% del total', icon: AlertCircle, color: 'from-red-500 to-rose-500' },
          { label: 'Clientes Activos', value: '847', detail: '+23 nuevos', icon: Users, color: 'from-purple-500 to-violet-500' },
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="p-4 bg-navy-800/50 rounded-xl border border-navy-700 hover:border-navy-600 transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.color}`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs text-slate-400">{stat.label}</span>
              </div>
              <p className="text-xl font-bold text-white">{stat.value}</p>
              <p className="text-sm text-slate-400">{stat.detail}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
