// components/analytics/MessageDeliveryMetrics.tsx
// Dashboard de Métricas de Entrega de Mensajes - sent/delivered/read rates
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Send,
  CheckCircle,
  Eye,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Clock,
  Filter,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  MessageSquare,
  Mail,
  Smartphone,
  Bell,
  Monitor,
  ChevronDown,
  Zap,
} from 'lucide-react';

import {
  messageDeliveryMetrics,
  type DeliveryMetrics,
  type ChannelMetrics,
  type TemplateMetrics,
  type TimeSeriesPoint,
  type DeliveryFunnel,
  type TimeRange,
  type MetricsSummary,
} from '../../services/messageDeliveryMetricsService';

// ============================================
// TYPES
// ============================================

interface MessageDeliveryMetricsProps {
  className?: string;
}

// ============================================
// HELPERS
// ============================================

const formatNumber = (n: number): string =>
  new Intl.NumberFormat('es-CO').format(n);

const formatMs = (ms: number): string => {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${(ms / 60000).toFixed(1)}min`;
  return `${(ms / 3600000).toFixed(1)}h`;
};

const formatRate = (rate: number): string => `${rate.toFixed(1)}%`;

const channelIcons: Record<string, React.ReactNode> = {
  whatsapp: <MessageSquare className="w-4 h-4" />,
  sms: <Smartphone className="w-4 h-4" />,
  email: <Mail className="w-4 h-4" />,
  push: <Bell className="w-4 h-4" />,
  in_app: <Monitor className="w-4 h-4" />,
};

const channelLabels: Record<string, string> = {
  whatsapp: 'WhatsApp',
  sms: 'SMS',
  email: 'Email',
  push: 'Push',
  in_app: 'In-App',
};

const channelColors: Record<string, string> = {
  whatsapp: '#25D366',
  sms: '#3B82F6',
  email: '#8B5CF6',
  push: '#F59E0B',
  in_app: '#06B6D4',
};

const timeRangeLabels: Record<TimeRange, string> = {
  '24h': '24 horas',
  '7d': '7 dias',
  '30d': '30 dias',
  '90d': '90 dias',
  'custom': 'Personalizado',
};

// ============================================
// MINI CHART (SVG)
// ============================================

const MiniBarChart: React.FC<{
  data: { label: string; value: number; color: string }[];
  height?: number;
}> = ({ data, height = 120 }) => {
  const maxValue = Math.max(...data.map(d => d.value), 1);

  return (
    <div className="flex items-end gap-1" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex flex-col items-center flex-1 gap-1">
          <span className="text-[10px] text-slate-400">{d.value}</span>
          <div
            className="w-full rounded-t-sm transition-all duration-300 min-h-[2px]"
            style={{
              height: `${(d.value / maxValue) * (height - 30)}px`,
              backgroundColor: d.color,
              opacity: 0.85,
            }}
          />
          <span className="text-[9px] text-slate-500 truncate w-full text-center">
            {d.label}
          </span>
        </div>
      ))}
    </div>
  );
};

const TimeSeriesChart: React.FC<{ data: TimeSeriesPoint[] }> = ({ data }) => {
  if (data.length === 0) return null;

  const width = 100;
  const height = 50;
  const padding = 4;

  const maxVal = Math.max(
    ...data.map(d => Math.max(d.sent, d.delivered, d.read, d.failed)),
    1
  );

  const getY = (val: number) =>
    height - padding - (val / maxVal) * (height - 2 * padding);

  const getX = (i: number) =>
    padding + (i / Math.max(data.length - 1, 1)) * (width - 2 * padding);

  const makePath = (key: keyof TimeSeriesPoint) =>
    data
      .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d[key] as number)}`)
      .join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-24">
      <path d={makePath('sent')} fill="none" stroke="#3B82F6" strokeWidth={1.5} />
      <path d={makePath('delivered')} fill="none" stroke="#10B981" strokeWidth={1.5} />
      <path d={makePath('read')} fill="none" stroke="#8B5CF6" strokeWidth={1.5} />
      <path d={makePath('failed')} fill="none" stroke="#EF4444" strokeWidth={1} strokeDasharray="3,2" />
    </svg>
  );
};

// ============================================
// FUNNEL COMPONENT
// ============================================

const FunnelChart: React.FC<{ stages: DeliveryFunnel[] }> = ({ stages }) => {
  if (stages.length === 0) return null;

  const maxCount = Math.max(...stages.map(s => s.count), 1);
  const colors = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B'];

  return (
    <div className="space-y-3">
      {stages.map((stage, i) => (
        <div key={stage.stage} className="relative">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {stage.stage}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold" style={{ color: colors[i] }}>
                {formatNumber(stage.count)}
              </span>
              <span className="text-xs text-slate-400">({formatRate(stage.rate)})</span>
            </div>
          </div>
          <div className="w-full bg-slate-100 dark:bg-navy-800 rounded-full h-3">
            <div
              className="h-3 rounded-full transition-all duration-500"
              style={{
                width: `${(stage.count / maxCount) * 100}%`,
                backgroundColor: colors[i],
                minWidth: stage.count > 0 ? '8px' : '0',
              }}
            />
          </div>
          {stage.dropoff > 0 && (
            <div className="absolute -right-1 top-0 text-[10px] text-red-400 font-medium">
              -{formatRate(stage.dropoff)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// ============================================
// METRIC CARD
// ============================================

const MetricCard: React.FC<{
  label: string;
  value: string;
  change?: number;
  icon: React.ReactNode;
  color: string;
  subtext?: string;
}> = ({ label, value, change, icon, color, subtext }) => {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-700">
      <div className="flex items-start justify-between mb-2">
        <div className={`p-2 rounded-lg ${color}`}>{icon}</div>
        {change !== undefined && change !== 0 && (
          <div
            className={`flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded ${
              isPositive
                ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20'
                : 'text-red-600 bg-red-50 dark:bg-red-900/20'
            }`}
          >
            {isPositive ? (
              <ArrowUpRight className="w-3 h-3" />
            ) : (
              <ArrowDownRight className="w-3 h-3" />
            )}
            {Math.abs(change).toFixed(1)}%
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-slate-800 dark:text-white">{value}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{label}</p>
      {subtext && (
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{subtext}</p>
      )}
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export const MessageDeliveryMetrics: React.FC<MessageDeliveryMetricsProps> = ({
  className = '',
}) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [summary, setSummary] = useState<MetricsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTimeRangeDropdown, setShowTimeRangeDropdown] = useState(false);

  const loadData = useCallback(() => {
    setLoading(true);
    try {
      // Seed demo data if no records exist
      if (messageDeliveryMetrics.getRecordCount() === 0) {
        messageDeliveryMetrics.seedDemoData(500);
      }
      const data = messageDeliveryMetrics.getFullSummary(timeRange);
      setSummary(data);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const changes = summary?.periodComparison?.changes;

  if (loading || !summary) {
    return (
      <div className={`flex items-center justify-center py-20 ${className}`}>
        <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
        <span className="ml-2 text-slate-500">Cargando metricas...</span>
      </div>
    );
  }

  const { overall, byChannel, byTemplate, timeSeries, funnel, topFailureReasons } =
    summary;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-500" />
            Metricas de Entrega de Mensajes
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Tasas de envio, entrega y lectura por canal
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Time Range Selector */}
          <div className="relative">
            <button
              onClick={() => setShowTimeRangeDropdown(!showTimeRangeDropdown)}
              className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              <Filter className="w-4 h-4 text-slate-400" />
              {timeRangeLabels[timeRange]}
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
            {showTimeRangeDropdown && (
              <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-10 min-w-[140px]">
                {(['24h', '7d', '30d', '90d'] as TimeRange[]).map(range => (
                  <button
                    key={range}
                    onClick={() => {
                      setTimeRange(range);
                      setShowTimeRangeDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 ${
                      range === timeRange
                        ? 'text-blue-600 font-medium bg-blue-50 dark:bg-blue-900/20'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {timeRangeLabels[range]}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={loadData}
            className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
            title="Actualizar"
          >
            <RefreshCw className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Tasa de Envio"
          value={formatRate(overall.sentRate)}
          change={changes?.sentRate}
          icon={<Send className="w-4 h-4 text-blue-600" />}
          color="bg-blue-50 dark:bg-blue-900/20"
          subtext={`${formatNumber(overall.sent)} de ${formatNumber(overall.totalMessages)} mensajes`}
        />
        <MetricCard
          label="Tasa de Entrega"
          value={formatRate(overall.deliveryRate)}
          change={changes?.deliveryRate}
          icon={<CheckCircle className="w-4 h-4 text-emerald-600" />}
          color="bg-emerald-50 dark:bg-emerald-900/20"
          subtext={`${formatNumber(overall.delivered)} entregados`}
        />
        <MetricCard
          label="Tasa de Lectura"
          value={formatRate(overall.readRate)}
          change={changes?.readRate}
          icon={<Eye className="w-4 h-4 text-violet-600" />}
          color="bg-violet-50 dark:bg-violet-900/20"
          subtext={`${formatNumber(overall.read)} leidos`}
        />
        <MetricCard
          label="Tasa de Fallo"
          value={formatRate(overall.failureRate)}
          change={changes ? -changes.failureRate : undefined}
          icon={<AlertTriangle className="w-4 h-4 text-red-600" />}
          color="bg-red-50 dark:bg-red-900/20"
          subtext={`${formatNumber(overall.failed)} fallidos`}
        />
      </div>

      {/* Response times */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-500">Tiempo promedio de entrega</span>
          </div>
          <p className="text-2xl font-bold text-slate-800 dark:text-white">
            {formatMs(overall.avgDeliveryTimeMs)}
          </p>
          <p className="text-xs text-slate-400 mt-1">Desde envio hasta entrega al dispositivo</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-500">Tiempo promedio de lectura</span>
          </div>
          <p className="text-2xl font-bold text-slate-800 dark:text-white">
            {formatMs(overall.avgReadTimeMs)}
          </p>
          <p className="text-xs text-slate-400 mt-1">Desde entrega hasta apertura del mensaje</p>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Delivery Funnel */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            Funnel de Entrega
          </h3>
          <FunnelChart stages={funnel} />
        </div>

        {/* Time Series */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-500" />
            Tendencia Temporal
          </h3>
          <TimeSeriesChart data={timeSeries} />
          <div className="flex items-center justify-center gap-4 mt-3">
            <div className="flex items-center gap-1">
              <div className="w-3 h-0.5 bg-blue-500 rounded" />
              <span className="text-[10px] text-slate-400">Enviados</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-0.5 bg-emerald-500 rounded" />
              <span className="text-[10px] text-slate-400">Entregados</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-0.5 bg-violet-500 rounded" />
              <span className="text-[10px] text-slate-400">Leidos</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-0.5 bg-red-400 rounded" style={{ borderTop: '1px dashed' }} />
              <span className="text-[10px] text-slate-400">Fallidos</span>
            </div>
          </div>
        </div>
      </div>

      {/* By Channel */}
      {byChannel.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-blue-500" />
            Metricas por Canal
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700">
                  <th className="text-left py-2 px-3 text-slate-500 dark:text-slate-400 font-medium">Canal</th>
                  <th className="text-right py-2 px-3 text-slate-500 dark:text-slate-400 font-medium">Total</th>
                  <th className="text-right py-2 px-3 text-slate-500 dark:text-slate-400 font-medium">Enviados</th>
                  <th className="text-right py-2 px-3 text-slate-500 dark:text-slate-400 font-medium">Entregados</th>
                  <th className="text-right py-2 px-3 text-slate-500 dark:text-slate-400 font-medium">Leidos</th>
                  <th className="text-right py-2 px-3 text-slate-500 dark:text-slate-400 font-medium">Fallo</th>
                  <th className="text-right py-2 px-3 text-slate-500 dark:text-slate-400 font-medium">Tasa Entrega</th>
                  <th className="text-right py-2 px-3 text-slate-500 dark:text-slate-400 font-medium">Tasa Lectura</th>
                </tr>
              </thead>
              <tbody>
                {byChannel.map(ch => (
                  <tr
                    key={ch.channel}
                    className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30"
                  >
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="p-1.5 rounded-lg"
                          style={{ backgroundColor: `${channelColors[ch.channel]}15` }}
                        >
                          {channelIcons[ch.channel]}
                        </div>
                        <span className="font-medium text-slate-700 dark:text-slate-200">
                          {channelLabels[ch.channel]}
                        </span>
                      </div>
                    </td>
                    <td className="text-right py-2.5 px-3 text-slate-600 dark:text-slate-300">
                      {formatNumber(ch.totalMessages)}
                    </td>
                    <td className="text-right py-2.5 px-3 text-blue-600">{formatNumber(ch.sent)}</td>
                    <td className="text-right py-2.5 px-3 text-emerald-600">{formatNumber(ch.delivered)}</td>
                    <td className="text-right py-2.5 px-3 text-violet-600">{formatNumber(ch.read)}</td>
                    <td className="text-right py-2.5 px-3 text-red-500">{formatNumber(ch.failed)}</td>
                    <td className="text-right py-2.5 px-3">
                      <span
                        className={`font-semibold ${
                          ch.deliveryRate >= 90
                            ? 'text-emerald-600'
                            : ch.deliveryRate >= 70
                            ? 'text-amber-600'
                            : 'text-red-600'
                        }`}
                      >
                        {formatRate(ch.deliveryRate)}
                      </span>
                    </td>
                    <td className="text-right py-2.5 px-3">
                      <span
                        className={`font-semibold ${
                          ch.readRate >= 60
                            ? 'text-emerald-600'
                            : ch.readRate >= 40
                            ? 'text-amber-600'
                            : 'text-red-600'
                        }`}
                      >
                        {formatRate(ch.readRate)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Two-column: Templates & Failures */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Template */}
        {byTemplate.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
              <Send className="w-4 h-4 text-blue-500" />
              Rendimiento por Plantilla
            </h3>
            <div className="space-y-3">
              {byTemplate.slice(0, 5).map(tmpl => (
                <div
                  key={tmpl.templateId}
                  className="p-3 rounded-lg bg-slate-50 dark:bg-slate-700/30"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                      {tmpl.templateName}
                    </span>
                    <span className="text-xs text-slate-400 ml-2">
                      {formatNumber(tmpl.totalMessages)} msgs
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2 overflow-hidden">
                        <div className="flex h-full">
                          <div
                            className="bg-violet-500 h-full"
                            style={{ width: `${(tmpl.read / Math.max(tmpl.totalMessages, 1)) * 100}%` }}
                          />
                          <div
                            className="bg-emerald-500 h-full"
                            style={{
                              width: `${((tmpl.delivered - tmpl.read) / Math.max(tmpl.totalMessages, 1)) * 100}%`,
                            }}
                          />
                          <div
                            className="bg-blue-400 h-full"
                            style={{
                              width: `${((tmpl.sent - tmpl.delivered) / Math.max(tmpl.totalMessages, 1)) * 100}%`,
                            }}
                          />
                          <div
                            className="bg-red-400 h-full"
                            style={{
                              width: `${(tmpl.failed / Math.max(tmpl.totalMessages, 1)) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-emerald-600 whitespace-nowrap">
                      {formatRate(tmpl.deliveryRate)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Failure Reasons */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            Principales Razones de Fallo
          </h3>
          {topFailureReasons.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
              <p className="text-sm">Sin fallos en este periodo</p>
            </div>
          ) : (
            <div className="space-y-3">
              {topFailureReasons.map((reason, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-slate-600 dark:text-slate-300 truncate">
                        {reason.reason}
                      </span>
                      <span className="text-xs font-medium text-red-500 ml-2">
                        {reason.count} ({formatRate(reason.percentage)})
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5">
                      <div
                        className="bg-red-400 h-1.5 rounded-full"
                        style={{ width: `${reason.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Summary Stats Bar */}
      <div className="bg-gradient-to-r from-blue-50 to-violet-50 dark:from-blue-900/20 dark:to-violet-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800/30">
        <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-slate-500 dark:text-slate-400">Total mensajes: </span>
              <span className="font-bold text-slate-700 dark:text-white">
                {formatNumber(overall.totalMessages)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400">Pendientes: </span>
              <span className="font-bold text-amber-600">
                {formatNumber(overall.pending)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400">Canales activos: </span>
              <span className="font-bold text-blue-600">{byChannel.length}</span>
            </div>
          </div>
          <div className="text-xs text-slate-400">
            Periodo: {timeRangeLabels[timeRange]}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageDeliveryMetrics;
