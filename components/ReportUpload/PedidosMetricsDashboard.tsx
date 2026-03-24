// components/ReportUpload/PedidosMetricsDashboard.tsx
// Dashboard completo de métricas de pedidos para admin

import React, { useState, useMemo } from 'react';
import {
  Package,
  Clock,
  TrendingUp,
  Users,
  Target,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Trophy,
  Flame,
  BarChart3,
  Calendar,
  Download,
  Filter,
  ChevronDown,
  ChevronUp,
  Zap,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
  RadialBarChart,
  RadialBar,
  Legend,
} from 'recharts';
import {
  META_MINUTOS_POR_PEDIDO,
  getSemaforoColor,
  SEMAFORO_CONFIG,
  getPedidosMetrics,
  getPedidosRanking,
  getPedidosTrend,
  getAllPedidosReports,
  SemaforoColor,
} from '../../services/reportUploadService';
import * as XLSX from 'xlsx';

export function PedidosMetricsDashboard() {
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('month');
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  const daysMap = { today: 1, week: 7, month: 30, all: 365 };

  const metrics = useMemo(() => getPedidosMetrics({ days: daysMap[dateRange] }), [dateRange]);
  const ranking = useMemo(() => getPedidosRanking(), [dateRange]);
  const trend = useMemo(() => getPedidosTrend(undefined, daysMap[dateRange]), [dateRange]);
  const allReports = useMemo(() => getAllPedidosReports(), [dateRange]);

  // Find top performer
  const topPerformer = ranking.length > 0 ? ranking[0] : null;

  // Alerts
  const alerts = useMemo(() => {
    const items: Array<{ type: 'danger' | 'warning' | 'info'; message: string }> = [];

    ranking.forEach(r => {
      if (r.tiempoPromedio > 4 && r.totalPedidos > 0) {
        items.push({
          type: 'danger',
          message: `${r.colaboradorNombre}: promedio ${r.tiempoPromedio.toFixed(1)} min/pedido (meta: ${META_MINUTOS_POR_PEDIDO} min)`,
        });
      }
      if (r.tasaCancelacion > 20) {
        items.push({
          type: 'warning',
          message: `${r.colaboradorNombre}: tasa de cancelación del ${r.tasaCancelacion}%`,
        });
      }
    });

    return items;
  }, [ranking]);

  // Bar chart data - pedidos por colaborador
  const barData = useMemo(() => {
    return ranking.map(r => ({
      name: r.colaboradorNombre.split(' ')[0],
      realizados: r.totalPedidos,
      tiempo: r.tiempoPromedio,
      color: getSemaforoColor(r.tiempoPromedio),
    }));
  }, [ranking]);

  // Gauge data
  const gaugeData = useMemo(() => {
    const value = metrics.porcentajeCumplimientoMeta;
    return [{ name: 'Cumplimiento', value, fill: value >= 80 ? '#22c55e' : value >= 50 ? '#f59e0b' : '#ef4444' }];
  }, [metrics]);

  const semaforoColor = metrics.tiempoPromedioPorPedido > 0
    ? getSemaforoColor(metrics.tiempoPromedioPorPedido)
    : 'green';
  const semaforoConfig = SEMAFORO_CONFIG[semaforoColor];

  // Export Excel
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: KPIs
    const kpis = [
      { 'Métrica': 'Tiempo Promedio/Pedido', 'Valor': `${metrics.tiempoPromedioPorPedido} min`, 'Meta': `${META_MINUTOS_POR_PEDIDO} min` },
      { 'Métrica': 'Total Pedidos', 'Valor': metrics.totalPedidos, 'Meta': '' },
      { 'Métrica': 'Pedidos/Hora', 'Valor': metrics.pedidosPorHora, 'Meta': '' },
      { 'Métrica': '% Cumplimiento Meta', 'Valor': `${metrics.porcentajeCumplimientoMeta}%`, 'Meta': '100%' },
      { 'Métrica': 'Tasa Cancelación', 'Valor': `${metrics.tasaCancelacion}%`, 'Meta': '<20%' },
      { 'Métrica': 'Colaboradores', 'Valor': metrics.colaboradoresUnicos, 'Meta': '' },
    ];
    const wsKPI = XLSX.utils.json_to_sheet(kpis);
    wsKPI['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(wb, wsKPI, 'KPIs');

    // Sheet 2: Ranking
    const rankingData = ranking.map((r, i) => ({
      '#': i + 1,
      'Colaborador': r.colaboradorNombre,
      'Total Pedidos': r.totalPedidos,
      'Tiempo Promedio (min)': r.tiempoPromedio,
      'Estado': SEMAFORO_CONFIG[r.semaforoColor].label,
      'Cancelación %': r.tasaCancelacion,
      'Reportes': r.totalReportes,
      'Streak (días)': r.streak,
    }));
    const wsRanking = XLSX.utils.json_to_sheet(rankingData);
    wsRanking['!cols'] = [{ wch: 5 }, { wch: 20 }, { wch: 12 }, { wch: 18 }, { wch: 12 }, { wch: 14 }, { wch: 10 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, wsRanking, 'Ranking');

    // Sheet 3: Tendencia
    const trendData = trend.map(t => ({
      'Fecha': t.fecha,
      'Total Pedidos': t.totalPedidos,
      'Tiempo Promedio (min)': t.tiempoPromedio,
      'Cumple Meta': t.cumpleMeta ? 'Sí' : 'No',
    }));
    const wsTrend = XLSX.utils.json_to_sheet(trendData);
    wsTrend['!cols'] = [{ wch: 12 }, { wch: 14 }, { wch: 18 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, wsTrend, 'Tendencia');

    // Sheet 4: Detalle Rondas
    const rondasData = allReports.flatMap(r =>
      r.rondas.map(ronda => ({
        'Fecha': r.fecha,
        'Colaborador': r.colaboradorNombre,
        'Ronda #': ronda.numero,
        'Duración (min)': ronda.duracionMinutos,
        'Realizados': ronda.pedidosRealizados,
        'Cancelados': ronda.pedidosCancelados,
        'Agendados': ronda.pedidosAgendados,
        'Min/Pedido': ronda.tiempoPorPedido,
        'Cumple Meta': ronda.cumpleMeta ? 'Sí' : 'No',
      }))
    );
    if (rondasData.length > 0) {
      const wsRondas = XLSX.utils.json_to_sheet(rondasData);
      wsRondas['!cols'] = [{ wch: 12 }, { wch: 20 }, { wch: 8 }, { wch: 14 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 12 }];
      XLSX.utils.book_append_sheet(wb, wsRondas, 'Detalle Rondas');
    }

    const fecha = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `Metricas_Pedidos_${fecha}.xlsx`);
  };

  const colorMap: Record<SemaforoColor, string> = { green: '#22c55e', yellow: '#f59e0b', red: '#ef4444' };

  if (allReports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="p-5 bg-gray-800 rounded-full mb-4">
          <Package className="w-12 h-12 text-gray-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-300 mb-2">Sin datos de pedidos</h3>
        <p className="text-gray-500 max-w-sm">
          Los colaboradores deben subir reportes de pedidos para que las métricas aparezcan aquí.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header + Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-orange-500/30 to-amber-500/30 rounded-xl">
            <BarChart3 className="w-7 h-7 text-orange-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Métricas de Pedidos</h2>
            <p className="text-gray-400 text-sm">Meta: {META_MINUTOS_POR_PEDIDO} min por pedido</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-800 rounded-lg p-1">
            {(['today', 'week', 'month', 'all'] as const).map(range => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  dateRange === range
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {range === 'today' ? 'Hoy' : range === 'week' ? '7 días' : range === 'month' ? '30 días' : 'Todo'}
              </button>
            ))}
          </div>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            Excel
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tiempo Promedio */}
        <div className={`rounded-xl border p-4 ${semaforoConfig.bgColor} ${semaforoConfig.borderColor}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs">Tiempo/Pedido</p>
              <p className={`text-3xl font-bold mt-1 ${semaforoConfig.color}`}>
                {metrics.tiempoPromedioPorPedido > 0 ? `${metrics.tiempoPromedioPorPedido}` : '--'}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">min (meta: {META_MINUTOS_POR_PEDIDO})</p>
            </div>
            <div className={`p-3 rounded-xl ${semaforoConfig.bgColor}`}>
              <Clock className={`w-6 h-6 ${semaforoConfig.color}`} />
            </div>
          </div>
        </div>

        {/* Total Pedidos */}
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs">Total Pedidos</p>
              <p className="text-3xl font-bold text-white mt-1">{metrics.totalPedidos}</p>
              <p className="text-xs text-gray-500 mt-0.5">{metrics.pedidosPorHora} por hora</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl opacity-80">
              <Package className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        {/* Cumplimiento Meta */}
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs">Cumplimiento Meta</p>
              <p className={`text-3xl font-bold mt-1 ${
                metrics.porcentajeCumplimientoMeta >= 80 ? 'text-green-400' :
                metrics.porcentajeCumplimientoMeta >= 50 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {metrics.porcentajeCumplimientoMeta}%
              </p>
              <p className="text-xs text-gray-500 mt-0.5">rondas en meta</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl opacity-80">
              <Target className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        {/* Top Performer */}
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs">Mejor Colaborador</p>
              <p className="text-lg font-bold text-white mt-1 truncate">
                {topPerformer?.colaboradorNombre.split(' ')[0] || '--'}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {topPerformer ? `${topPerformer.tiempoPromedio} min/pedido` : 'Sin datos'}
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl opacity-80">
              <Trophy className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Trend Chart */}
        {trend.length > 1 && (
          <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              Tendencia Tiempo/Pedido
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="fecha"
                  stroke="#6b7280"
                  fontSize={10}
                  tickFormatter={(v) => {
                    const d = new Date(v + 'T12:00:00');
                    return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
                  }}
                />
                <YAxis stroke="#6b7280" fontSize={10} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#9ca3af' }}
                  formatter={(value: number) => [`${value} min`, 'Tiempo/Pedido']}
                />
                <ReferenceLine
                  y={META_MINUTOS_POR_PEDIDO}
                  stroke="#22c55e"
                  strokeDasharray="5 5"
                  label={{ value: `Meta ${META_MINUTOS_POR_PEDIDO}min`, fill: '#22c55e', fontSize: 10, position: 'right' }}
                />
                <Line
                  type="monotone"
                  dataKey="tiempoPromedio"
                  stroke="#818cf8"
                  strokeWidth={2}
                  dot={{ fill: '#818cf8', r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Bar Chart - Por Colaborador */}
        {barData.length > 0 && (
          <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" />
              Pedidos por Colaborador
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={10} />
                <YAxis stroke="#6b7280" fontSize={10} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#9ca3af' }}
                />
                <Bar dataKey="realizados" name="Pedidos" radius={[4, 4, 0, 0]}>
                  {barData.map((entry, index) => (
                    <Cell key={index} fill={colorMap[entry.color]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Cumplimiento Gauge + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Gauge */}
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-4">
          <h3 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
            <Target className="w-4 h-4 text-indigo-400" />
            Cumplimiento General
          </h3>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={180}>
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="60%"
                outerRadius="90%"
                startAngle={180}
                endAngle={0}
                data={gaugeData}
              >
                <RadialBar
                  dataKey="value"
                  cornerRadius={10}
                  background={{ fill: '#374151' }}
                />
                <text
                  x="50%"
                  y="45%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-white text-2xl font-bold"
                >
                  {metrics.porcentajeCumplimientoMeta}%
                </text>
                <text
                  x="50%"
                  y="60%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-gray-400 text-xs"
                >
                  en meta de {META_MINUTOS_POR_PEDIDO} min
                </text>
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alerts */}
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-4">
          <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Alertas
          </h3>
          {alerts.length === 0 ? (
            <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-sm text-green-300">Todo en orden - sin alertas</span>
            </div>
          ) : (
            <div className="space-y-2 max-h-[150px] overflow-y-auto">
              {alerts.map((alert, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-2 p-2.5 rounded-lg border ${
                    alert.type === 'danger'
                      ? 'bg-red-500/10 border-red-500/30'
                      : alert.type === 'warning'
                      ? 'bg-amber-500/10 border-amber-500/30'
                      : 'bg-blue-500/10 border-blue-500/30'
                  }`}
                >
                  {alert.type === 'danger' ? (
                    <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  )}
                  <span className={`text-xs ${
                    alert.type === 'danger' ? 'text-red-300' : 'text-amber-300'
                  }`}>
                    {alert.message}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Ranking Table */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-700">
          <h3 className="text-sm font-medium text-gray-300 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            Ranking de Colaboradores
          </h3>
        </div>

        {/* Table Header */}
        <div className="grid grid-cols-7 gap-2 px-4 py-2 bg-gray-900/50 text-xs text-gray-500 font-medium">
          <span>#</span>
          <span className="col-span-2">Colaborador</span>
          <span className="text-center">Pedidos</span>
          <span className="text-center">Tiempo/Pedido</span>
          <span className="text-center">Cancel. %</span>
          <span className="text-center">Streak</span>
        </div>

        {/* Rows */}
        <div className="divide-y divide-gray-700/50">
          {ranking.map((person, i) => {
            const config = SEMAFORO_CONFIG[person.semaforoColor];
            return (
              <div key={person.colaboradorId}>
                <button
                  onClick={() => setExpandedUser(expandedUser === person.colaboradorId ? null : person.colaboradorId)}
                  className="w-full grid grid-cols-7 gap-2 px-4 py-3 hover:bg-gray-700/20 transition-colors items-center"
                >
                  <span className="text-sm">
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                  </span>
                  <div className="col-span-2 flex items-center gap-2 text-left">
                    <div className="w-7 h-7 bg-indigo-500/30 rounded-full flex items-center justify-center text-indigo-300 text-xs font-bold">
                      {person.colaboradorNombre.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm text-white truncate">{person.colaboradorNombre}</span>
                  </div>
                  <span className="text-sm text-white text-center font-medium">{person.totalPedidos}</span>
                  <div className="flex items-center justify-center gap-1">
                    <span className={`text-sm font-bold ${config.color}`}>
                      {person.tiempoPromedio.toFixed(1)}
                    </span>
                    <span className="text-[10px] text-gray-500">min</span>
                  </div>
                  <span className={`text-sm text-center ${person.tasaCancelacion > 20 ? 'text-red-400' : 'text-gray-400'}`}>
                    {person.tasaCancelacion}%
                  </span>
                  <div className="flex items-center justify-center gap-1">
                    {person.streak > 0 && <Flame className="w-3 h-3 text-orange-400" />}
                    <span className={`text-sm ${person.streak > 0 ? 'text-orange-400 font-medium' : 'text-gray-500'}`}>
                      {person.streak}d
                    </span>
                  </div>
                </button>

                {/* Expanded Details */}
                {expandedUser === person.colaboradorId && (
                  <div className="px-4 pb-3 bg-gray-900/30">
                    <div className="grid grid-cols-4 gap-3 p-3 bg-gray-800/50 rounded-lg text-center">
                      <div>
                        <p className="text-xs text-gray-500">Reportes</p>
                        <p className="text-sm font-bold text-white">{person.totalReportes}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Pedidos/Hora</p>
                        <p className="text-sm font-bold text-white">
                          {person.tiempoPromedio > 0 ? (60 / person.tiempoPromedio).toFixed(1) : '--'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Último Reporte</p>
                        <p className="text-sm font-bold text-white">
                          {person.ultimoReporte
                            ? new Date(person.ultimoReporte).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
                            : '--'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Estado</p>
                        <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${config.bgColor} ${config.color}`}>
                          {config.label}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default PedidosMetricsDashboard;
