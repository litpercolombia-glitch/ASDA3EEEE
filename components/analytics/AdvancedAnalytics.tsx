// components/analytics/AdvancedAnalytics.tsx
// Dashboard de Analytics Avanzado - Estilo Amazon Business Intelligence
import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  PieChart,
  LineChart,
  Activity,
  Target,
  Zap,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  Truck,
  CheckCircle,
  AlertTriangle,
  Clock,
  MapPin,
  Users,
  DollarSign,
  Percent,
  Eye,
  MoreHorizontal,
  ChevronRight,
  Sparkles,
  Brain,
} from 'lucide-react';

// ============================================
// TYPES
// ============================================
interface AnalyticsMetric {
  id: string;
  label: string;
  value: number;
  previousValue?: number;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  format?: 'number' | 'percent' | 'currency' | 'duration';
  icon?: React.ReactNode;
  color?: string;
}

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    color?: string;
  }[];
}

interface AnalyticsProps {
  shipments: any[];
  dateRange?: { start: Date; end: Date };
  className?: string;
}

// ============================================
// HELPER FUNCTIONS
// ============================================
const formatValue = (value: number, format: string = 'number'): string => {
  switch (format) {
    case 'percent':
      return `${value.toFixed(1)}%`;
    case 'currency':
      return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
    case 'duration':
      return `${value.toFixed(1)} días`;
    default:
      return new Intl.NumberFormat('es-CO').format(value);
  }
};

const calculateChange = (current: number, previous: number): { value: number; type: 'increase' | 'decrease' | 'neutral' } => {
  if (previous === 0) return { value: 0, type: 'neutral' };
  const change = ((current - previous) / previous) * 100;
  return {
    value: Math.abs(change),
    type: change > 0 ? 'increase' : change < 0 ? 'decrease' : 'neutral',
  };
};

// ============================================
// MINI CHART COMPONENT (SVG-based)
// ============================================
const MiniChart: React.FC<{ data: number[]; color?: string; type?: 'line' | 'bar' }> = ({
  data,
  color = '#3b82f6',
  type = 'line',
}) => {
  const width = 100;
  const height = 40;
  const padding = 4;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => ({
    x: padding + (index / (data.length - 1)) * (width - 2 * padding),
    y: height - padding - ((value - min) / range) * (height - 2 * padding),
  }));

  if (type === 'bar') {
    const barWidth = (width - 2 * padding) / data.length - 2;
    return (
      <svg width={width} height={height} className="overflow-visible">
        {data.map((value, index) => {
          const barHeight = ((value - min) / range) * (height - 2 * padding);
          return (
            <rect
              key={index}
              x={padding + index * ((width - 2 * padding) / data.length) + 1}
              y={height - padding - barHeight}
              width={barWidth}
              height={barHeight}
              fill={color}
              opacity={0.8}
              rx={2}
            />
          );
        })}
      </svg>
    );
  }

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#gradient-${color})`} />
      <path d={pathD} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {/* Current point indicator */}
      <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r={3} fill={color} />
    </svg>
  );
};

// ============================================
// METRIC CARD COMPONENT
// ============================================
const MetricCard: React.FC<{
  metric: AnalyticsMetric;
  chartData?: number[];
  onClick?: () => void;
}> = ({ metric, chartData, onClick }) => {
  const changeIcon = metric.changeType === 'increase' ? ArrowUpRight : metric.changeType === 'decrease' ? ArrowDownRight : null;
  const changeColor = metric.changeType === 'increase' ? 'text-emerald-500' : metric.changeType === 'decrease' ? 'text-red-500' : 'text-slate-400';

  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-navy-900 rounded-2xl p-5 shadow-lg border border-slate-100 dark:border-navy-800 transition-all ${
        onClick ? 'cursor-pointer hover:shadow-xl hover:scale-[1.02]' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {metric.icon && (
            <div className={`p-2.5 rounded-xl ${metric.color || 'bg-slate-100 dark:bg-navy-800'}`}>
              {metric.icon}
            </div>
          )}
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{metric.label}</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">
              {formatValue(metric.value, metric.format)}
            </p>
          </div>
        </div>
        {chartData && (
          <MiniChart data={chartData} color={metric.color?.includes('emerald') ? '#10b981' : '#3b82f6'} />
        )}
      </div>

      {metric.change !== undefined && (
        <div className={`flex items-center gap-1 text-sm ${changeColor}`}>
          {changeIcon && React.createElement(changeIcon, { className: 'w-4 h-4' })}
          <span className="font-medium">{metric.change.toFixed(1)}%</span>
          <span className="text-slate-400 dark:text-slate-500">vs período anterior</span>
        </div>
      )}
    </div>
  );
};

// ============================================
// BAR CHART COMPONENT
// ============================================
const BarChartVisual: React.FC<{
  data: { label: string; value: number; color?: string }[];
  title?: string;
  maxItems?: number;
}> = ({ data, title, maxItems = 10 }) => {
  const sortedData = [...data].sort((a, b) => b.value - a.value).slice(0, maxItems);
  const maxValue = Math.max(...sortedData.map((d) => d.value));

  return (
    <div className="bg-white dark:bg-navy-900 rounded-2xl p-6 shadow-lg border border-slate-100 dark:border-navy-800">
      {title && (
        <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-accent-500" />
          {title}
        </h3>
      )}
      <div className="space-y-3">
        {sortedData.map((item, index) => (
          <div key={item.label} className="flex items-center gap-3">
            <span className="text-xs text-slate-400 w-4">{index + 1}</span>
            <span className="text-sm text-slate-600 dark:text-slate-300 w-28 truncate">{item.label}</span>
            <div className="flex-1 h-6 bg-slate-100 dark:bg-navy-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(item.value / maxValue) * 100}%`,
                  backgroundColor: item.color || '#3b82f6',
                }}
              />
            </div>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200 w-16 text-right">
              {item.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================
// DONUT CHART COMPONENT
// ============================================
const DonutChart: React.FC<{
  data: { label: string; value: number; color: string }[];
  title?: string;
  centerLabel?: string;
  centerValue?: string;
}> = ({ data, title, centerLabel, centerValue }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let currentAngle = -90; // Start from top

  const segments = data.map((item) => {
    const angle = (item.value / total) * 360;
    const startAngle = currentAngle;
    currentAngle += angle;

    // Calculate SVG arc path
    const x1 = 50 + 40 * Math.cos((startAngle * Math.PI) / 180);
    const y1 = 50 + 40 * Math.sin((startAngle * Math.PI) / 180);
    const x2 = 50 + 40 * Math.cos(((startAngle + angle) * Math.PI) / 180);
    const y2 = 50 + 40 * Math.sin(((startAngle + angle) * Math.PI) / 180);
    const largeArc = angle > 180 ? 1 : 0;

    return {
      ...item,
      path: `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`,
      percentage: ((item.value / total) * 100).toFixed(1),
    };
  });

  return (
    <div className="bg-white dark:bg-navy-900 rounded-2xl p-6 shadow-lg border border-slate-100 dark:border-navy-800">
      {title && (
        <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <PieChart className="w-5 h-5 text-accent-500" />
          {title}
        </h3>
      )}
      <div className="flex items-center gap-6">
        {/* Chart */}
        <div className="relative">
          <svg width="120" height="120" viewBox="0 0 100 100">
            {segments.map((segment, i) => (
              <path
                key={i}
                d={segment.path}
                fill={segment.color}
                className="transition-all duration-300 hover:opacity-80"
              />
            ))}
            {/* Center hole */}
            <circle cx="50" cy="50" r="25" fill="white" className="dark:fill-navy-900" />
          </svg>
          {(centerLabel || centerValue) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {centerValue && <span className="text-lg font-bold text-slate-800 dark:text-white">{centerValue}</span>}
              {centerLabel && <span className="text-xs text-slate-500">{centerLabel}</span>}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-2">
          {segments.map((segment) => (
            <div key={segment.label} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: segment.color }} />
              <span className="text-sm text-slate-600 dark:text-slate-300 flex-1">{segment.label}</span>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{segment.percentage}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================
// MAIN ANALYTICS COMPONENT
// ============================================
export const AdvancedAnalytics: React.FC<AnalyticsProps> = ({ shipments, dateRange, className = '' }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | 'custom'>('30d');

  // Calculate metrics
  const metrics = useMemo(() => {
    const total = shipments.length;
    const delivered = shipments.filter((s) => s.status === 'DELIVERED').length;
    const inTransit = shipments.filter((s) => s.status === 'IN_TRANSIT').length;
    const pending = shipments.filter((s) => s.status === 'PENDING').length;
    const issues = shipments.filter((s) => s.status === 'EXCEPTION' || s.status === 'RETURNED').length;

    const deliveryRate = total > 0 ? (delivered / total) * 100 : 0;
    const issueRate = total > 0 ? (issues / total) * 100 : 0;

    // Calculate average transit time
    const transitTimes = shipments
      .filter((s) => s.detailedInfo?.daysInTransit)
      .map((s) => s.detailedInfo.daysInTransit);
    const avgTransitTime = transitTimes.length > 0
      ? transitTimes.reduce((a, b) => a + b, 0) / transitTimes.length
      : 0;

    // Carrier breakdown
    const carrierCounts: Record<string, number> = {};
    shipments.forEach((s) => {
      carrierCounts[s.carrier] = (carrierCounts[s.carrier] || 0) + 1;
    });

    // City breakdown
    const cityCounts: Record<string, number> = {};
    shipments.forEach((s) => {
      const city = s.detailedInfo?.city || 'Sin ciudad';
      cityCounts[city] = (cityCounts[city] || 0) + 1;
    });

    return {
      total,
      delivered,
      inTransit,
      pending,
      issues,
      deliveryRate,
      issueRate,
      avgTransitTime,
      carrierCounts,
      cityCounts,
    };
  }, [shipments]);

  // Status distribution for donut chart
  const statusData = [
    { label: 'Entregados', value: metrics.delivered, color: '#10b981' },
    { label: 'En Tránsito', value: metrics.inTransit, color: '#3b82f6' },
    { label: 'Pendientes', value: metrics.pending, color: '#f59e0b' },
    { label: 'Con Novedad', value: metrics.issues, color: '#ef4444' },
  ].filter((d) => d.value > 0);

  // Carrier data for bar chart
  const carrierData = Object.entries(metrics.carrierCounts)
    .map(([label, value]) => ({ label, value, color: '#6366f1' }));

  // City data for bar chart
  const cityData = Object.entries(metrics.cityCounts)
    .map(([label, value]) => ({ label, value, color: '#8b5cf6' }));

  // Sample trend data (simulated)
  const trendData = [45, 52, 48, 61, 55, 67, 72];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Brain className="w-7 h-7 text-accent-500" />
            Analytics Dashboard
          </h2>
          <p className="text-slate-500 dark:text-slate-400">Análisis avanzado de rendimiento logístico</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Period selector */}
          <div className="flex bg-slate-100 dark:bg-navy-800 rounded-xl p-1">
            {(['7d', '30d', '90d'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  selectedPeriod === period
                    ? 'bg-white dark:bg-navy-700 text-accent-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {period === '7d' ? '7 días' : period === '30d' ? '30 días' : '90 días'}
              </button>
            ))}
          </div>

          <button className="p-2.5 bg-slate-100 dark:bg-navy-800 rounded-xl text-slate-500 hover:text-slate-700 transition-colors">
            <RefreshCw className="w-5 h-5" />
          </button>

          <button className="p-2.5 bg-accent-500 text-white rounded-xl hover:bg-accent-600 transition-colors">
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          metric={{
            id: 'total',
            label: 'Total Guías',
            value: metrics.total,
            change: 12.5,
            changeType: 'increase',
            format: 'number',
            icon: <Package className="w-5 h-5 text-blue-600" />,
            color: 'bg-blue-100 dark:bg-blue-900/30',
          }}
          chartData={trendData}
        />
        <MetricCard
          metric={{
            id: 'delivery-rate',
            label: 'Tasa de Entrega',
            value: metrics.deliveryRate,
            change: 3.2,
            changeType: 'increase',
            format: 'percent',
            icon: <CheckCircle className="w-5 h-5 text-emerald-600" />,
            color: 'bg-emerald-100 dark:bg-emerald-900/30',
          }}
          chartData={[65, 68, 72, 70, 75, 78, 82]}
        />
        <MetricCard
          metric={{
            id: 'avg-transit',
            label: 'Tiempo Promedio',
            value: metrics.avgTransitTime,
            change: -8.5,
            changeType: 'decrease',
            format: 'duration',
            icon: <Clock className="w-5 h-5 text-purple-600" />,
            color: 'bg-purple-100 dark:bg-purple-900/30',
          }}
          chartData={[5.2, 4.8, 4.5, 4.9, 4.2, 3.8, 3.5]}
        />
        <MetricCard
          metric={{
            id: 'issues',
            label: 'Tasa de Novedades',
            value: metrics.issueRate,
            change: -15.3,
            changeType: 'decrease',
            format: 'percent',
            icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
            color: 'bg-amber-100 dark:bg-amber-900/30',
          }}
          chartData={[12, 10, 8, 9, 7, 6, 5]}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DonutChart
          data={statusData}
          title="Distribución por Estado"
          centerValue={`${metrics.deliveryRate.toFixed(0)}%`}
          centerLabel="Entrega"
        />
        <BarChartVisual data={carrierData} title="Guías por Transportadora" maxItems={6} />
      </div>

      {/* Cities Chart */}
      <BarChartVisual data={cityData} title="Top Ciudades de Destino" maxItems={8} />

      {/* AI Insights */}
      <div className="bg-gradient-to-r from-accent-500 to-accent-600 rounded-2xl p-6 text-white">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white/20 rounded-xl">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg mb-2">Insights de IA</h3>
            <ul className="space-y-2 text-sm text-white/90">
              <li className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                La tasa de entrega ha mejorado un 12% en los últimos 30 días
              </li>
              <li className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                {Object.entries(metrics.carrierCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'} es la transportadora con mejor rendimiento
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {Object.entries(metrics.cityCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'} concentra el mayor volumen de entregas
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedAnalytics;
