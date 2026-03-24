// components/ReportUpload/MyReportsPanel.tsx
// Panel donde cada usuario ve sus reportes subidos + métricas personales de pedidos

import React, { useState, useMemo } from 'react';
import {
  FileText,
  Upload,
  Search,
  Filter,
  Eye,
  Download,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronDown,
  Calendar,
  Tag,
  X,
  File,
  Image,
  FileSpreadsheet,
  Inbox,
  Package,
  TrendingUp,
  Target,
  Flame,
  Trophy,
  Zap,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ReferenceLine,
  Tooltip,
} from 'recharts';
import { useAuthStore } from '../../stores/authStore';
import { useReportUploadStore } from '../../stores/reportUploadStore';
import {
  UserReport,
  ReportCategory,
  ReportStatus,
  REPORT_CATEGORIES,
  STATUS_CONFIG,
  formatFileSize,
  META_MINUTOS_POR_PEDIDO,
  getSemaforoColor,
  SEMAFORO_CONFIG,
  getPedidosReportsByUser,
  getPedidosTrend,
  getPedidosRanking,
  getPedidosMetrics,
} from '../../services/reportUploadService';

interface MyReportsPanelProps {
  onOpenUploadModal: () => void;
}

export function MyReportsPanel({ onOpenUploadModal }: MyReportsPanelProps) {
  const { user } = useAuthStore();
  const { getByUser, filterStatus, filterCategory, searchQuery, setFilterStatus, setFilterCategory, setSearchQuery } = useReportUploadStore();

  const [viewingReport, setViewingReport] = useState<UserReport | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'status'>('date');

  // Pedidos metrics for current user
  const pedidosData = useMemo(() => {
    if (!user) return null;
    const reports = getPedidosReportsByUser(user.id);
    if (reports.length === 0) return null;

    const metrics = getPedidosMetrics({ userId: user.id, days: 30 });
    const trend = getPedidosTrend(user.id, 7);
    const ranking = getPedidosRanking();
    const myRank = ranking.findIndex(r => r.colaboradorId === user.id) + 1;
    const myData = ranking.find(r => r.colaboradorId === user.id);

    // Today's data
    const today = new Date().toISOString().split('T')[0];
    const todayMetrics = getPedidosMetrics({ userId: user.id, fecha: today });

    return {
      metrics,
      trend,
      myRank,
      totalRanked: ranking.length,
      streak: myData?.streak || 0,
      todayPedidos: todayMetrics.totalPedidos,
      todayTiempo: todayMetrics.tiempoPromedioPorPedido,
    };
  }, [user]);

  const reports = useMemo(() => {
    if (!user) return [];
    let items = getByUser(user.id);

    if (filterStatus !== 'all') {
      items = items.filter(r => r.status === filterStatus);
    }
    if (filterCategory !== 'all') {
      items = items.filter(r => r.category === filterCategory);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(r =>
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    items.sort((a, b) => {
      if (sortBy === 'date') return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
      return a.status.localeCompare(b.status);
    });

    return items;
  }, [user, getByUser, filterStatus, filterCategory, searchQuery, sortBy]);

  const statusCounts = useMemo(() => {
    if (!user) return {};
    const all = getByUser(user.id);
    const counts: Record<string, number> = { all: all.length };
    all.forEach(r => { counts[r.status] = (counts[r.status] || 0) + 1; });
    return counts;
  }, [user, getByUser]);

  const getStatusIcon = (status: ReportStatus) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-400" />;
      case 'under_review': return <AlertCircle className="w-4 h-4 text-yellow-400" />;
      case 'submitted': return <Clock className="w-4 h-4 text-blue-400" />;
      default: return <FileText className="w-4 h-4 text-gray-400" />;
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="w-5 h-5 text-purple-400" />;
    if (type.includes('spreadsheet') || type.includes('excel') || type.includes('csv'))
      return <FileSpreadsheet className="w-5 h-5 text-green-400" />;
    if (type.includes('pdf')) return <FileText className="w-5 h-5 text-red-400" />;
    return <File className="w-5 h-5 text-gray-400" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500/20 rounded-xl">
            <FileText className="w-7 h-7 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Mis Reportes</h2>
            <p className="text-gray-400 text-sm">
              {statusCounts['all'] || 0} reportes en total
            </p>
          </div>
        </div>
        <button
          onClick={onOpenUploadModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all font-medium shadow-lg shadow-indigo-500/25"
        >
          <Upload className="w-4 h-4" />
          Subir Reporte
        </button>
      </div>

      {/* Pedidos Metrics Section */}
      {pedidosData && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-2">
            <Package className="w-4 h-4 text-orange-400" />
            Mi Rendimiento en Pedidos
          </h3>

          {/* Today's Performance Card */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Tiempo/Pedido */}
            {(() => {
              const tiempo = pedidosData.metrics.tiempoPromedioPorPedido;
              const color = tiempo > 0 ? getSemaforoColor(tiempo) : 'green';
              const config = SEMAFORO_CONFIG[color];
              return (
                <div className={`rounded-xl border p-3 ${config.bgColor} ${config.borderColor}`}>
                  <p className="text-[10px] text-gray-400 uppercase">Tiempo/Pedido</p>
                  <p className={`text-2xl font-bold ${config.color}`}>
                    {tiempo > 0 ? `${tiempo}` : '--'}
                  </p>
                  <p className="text-[10px] text-gray-500">min (meta: {META_MINUTOS_POR_PEDIDO})</p>
                </div>
              );
            })()}

            {/* Total Pedidos */}
            <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-3">
              <p className="text-[10px] text-gray-400 uppercase">Total Pedidos</p>
              <p className="text-2xl font-bold text-white">{pedidosData.metrics.totalPedidos}</p>
              <p className="text-[10px] text-gray-500">{pedidosData.metrics.pedidosPorHora} /hora</p>
            </div>

            {/* Cumplimiento */}
            <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-3">
              <p className="text-[10px] text-gray-400 uppercase">En Meta</p>
              <p className={`text-2xl font-bold ${
                pedidosData.metrics.porcentajeCumplimientoMeta >= 80 ? 'text-green-400' :
                pedidosData.metrics.porcentajeCumplimientoMeta >= 50 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {pedidosData.metrics.porcentajeCumplimientoMeta}%
              </p>
              <p className="text-[10px] text-gray-500">rondas cumpliendo</p>
            </div>

            {/* Ranking */}
            <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-3">
              <p className="text-[10px] text-gray-400 uppercase">Mi Ranking</p>
              <p className="text-2xl font-bold text-amber-400 flex items-center gap-1">
                <Trophy className="w-4 h-4" />
                #{pedidosData.myRank || '--'}
              </p>
              <p className="text-[10px] text-gray-500">de {pedidosData.totalRanked}</p>
            </div>

            {/* Streak */}
            <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-3">
              <p className="text-[10px] text-gray-400 uppercase">Streak</p>
              <p className="text-2xl font-bold text-orange-400 flex items-center gap-1">
                {pedidosData.streak > 0 && <Flame className="w-4 h-4" />}
                {pedidosData.streak}
              </p>
              <p className="text-[10px] text-gray-500">días en meta</p>
            </div>
          </div>

          {/* Mini Trend Chart */}
          {pedidosData.trend.length > 1 && (
            <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-4">
              <p className="text-xs font-medium text-gray-400 mb-3 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                Mi tendencia (últimos 7 días)
              </p>
              <ResponsiveContainer width="100%" height={120}>
                <LineChart data={pedidosData.trend}>
                  <XAxis
                    dataKey="fecha"
                    stroke="#6b7280"
                    fontSize={9}
                    tickFormatter={(v) => {
                      const d = new Date(v + 'T12:00:00');
                      return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
                    }}
                  />
                  <YAxis stroke="#6b7280" fontSize={9} hide />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(value: number) => [`${value} min`, 'Tiempo/Pedido']}
                  />
                  <ReferenceLine
                    y={META_MINUTOS_POR_PEDIDO}
                    stroke="#22c55e"
                    strokeDasharray="4 4"
                    strokeWidth={1}
                  />
                  <Line
                    type="monotone"
                    dataKey="tiempoPromedio"
                    stroke="#818cf8"
                    strokeWidth={2}
                    dot={{ fill: '#818cf8', r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
              <p className="text-[10px] text-gray-600 text-center mt-1">
                Línea verde = meta {META_MINUTOS_POR_PEDIDO} min/pedido
              </p>
            </div>
          )}
        </div>
      )}

      {/* Status Pills */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'submitted', 'under_review', 'approved', 'rejected'] as const).map(status => {
          const config = status === 'all'
            ? { label: 'Todos', color: 'text-white', bgColor: 'bg-gray-600/30' }
            : STATUS_CONFIG[status];
          const count = statusCounts[status] || 0;
          return (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all ${
                filterStatus === status
                  ? 'bg-indigo-600 text-white'
                  : `${config.bgColor} ${config.color} hover:opacity-80`
              }`}
            >
              {status !== 'all' && getStatusIcon(status as ReportStatus)}
              {config.label}
              {count > 0 && (
                <span className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${
                  filterStatus === status ? 'bg-indigo-500' : 'bg-gray-700'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por título, descripción o etiqueta..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value as ReportCategory | 'all')}
          className="px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">Todas las categorías</option>
          {(Object.entries(REPORT_CATEGORIES) as [ReportCategory, typeof REPORT_CATEGORIES[ReportCategory]][]).map(([key, config]) => (
            <option key={key} value={key}>{config.label}</option>
          ))}
        </select>
      </div>

      {/* Reports List */}
      <div className="space-y-3">
        {reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-4 bg-gray-800 rounded-full mb-4">
              <Inbox className="w-10 h-10 text-gray-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-300 mb-2">
              {statusCounts['all'] === 0 ? 'No tienes reportes aún' : 'Sin resultados'}
            </h3>
            <p className="text-gray-500 mb-4 max-w-sm">
              {statusCounts['all'] === 0
                ? 'Sube tu primer reporte para que quede registrado en el sistema.'
                : 'Intenta cambiar los filtros o la búsqueda.'}
            </p>
            {statusCounts['all'] === 0 && (
              <button
                onClick={onOpenUploadModal}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
              >
                <Upload className="w-4 h-4" />
                Subir Primer Reporte
              </button>
            )}
          </div>
        ) : (
          reports.map(report => (
            <div
              key={report.id}
              className="bg-gray-800/50 rounded-xl border border-gray-700 p-4 hover:border-gray-600 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="p-2 bg-gray-700/50 rounded-lg flex-shrink-0">
                    {getFileIcon(report.fileType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-medium text-white truncate">{report.title}</h4>
                      <span className={`flex items-center gap-1 px-2 py-0.5 text-xs rounded-full ${STATUS_CONFIG[report.status].bgColor} ${STATUS_CONFIG[report.status].color}`}>
                        {getStatusIcon(report.status)}
                        {STATUS_CONFIG[report.status].label}
                      </span>
                      {report.version > 1 && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-purple-500/20 text-purple-400">
                          v{report.version}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 mt-1 line-clamp-1">{report.description || 'Sin descripción'}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(report.submittedAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {REPORT_CATEGORIES[report.category]?.label || report.category}
                      </span>
                      <span>{report.fileName} ({formatFileSize(report.fileSize)})</span>
                    </div>
                    {report.tags.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        {report.tags.map((tag, i) => (
                          <span key={i} className="px-2 py-0.5 text-xs bg-gray-700 text-gray-300 rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    {report.adminComment && (
                      <div className={`mt-2 p-2 rounded-lg text-sm ${
                        report.status === 'rejected'
                          ? 'bg-red-500/10 border border-red-500/30 text-red-300'
                          : 'bg-green-500/10 border border-green-500/30 text-green-300'
                      }`}>
                        <span className="font-medium">Admin: </span>{report.adminComment}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setViewingReport(report)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 text-sm flex-shrink-0"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Ver
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* View Report Detail Modal */}
      {viewingReport && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden border border-gray-700">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h3 className="text-lg font-bold text-white truncate pr-4">{viewingReport.title}</h3>
              <button onClick={() => setViewingReport(null)} className="p-1.5 hover:bg-gray-700 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto max-h-[calc(80vh-64px)] space-y-4">
              <div className="flex items-center gap-2">
                <span className={`flex items-center gap-1.5 px-3 py-1 text-sm rounded-full ${STATUS_CONFIG[viewingReport.status].bgColor} ${STATUS_CONFIG[viewingReport.status].color}`}>
                  {getStatusIcon(viewingReport.status)}
                  {STATUS_CONFIG[viewingReport.status].label}
                </span>
                <span className="text-sm text-gray-400">
                  v{viewingReport.version}
                </span>
              </div>

              <div className="bg-gray-800 rounded-xl p-4 space-y-3">
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">Categoría</p>
                  <p className="text-white text-sm">{REPORT_CATEGORIES[viewingReport.category]?.label}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">Descripción</p>
                  <p className="text-white text-sm">{viewingReport.description || 'Sin descripción'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">Periodo</p>
                  <p className="text-white text-sm">
                    {new Date(viewingReport.period.start).toLocaleDateString('es-CO')} - {new Date(viewingReport.period.end).toLocaleDateString('es-CO')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">Archivo</p>
                  <div className="flex items-center gap-2">
                    {getFileIcon(viewingReport.fileType)}
                    <span className="text-white text-sm">{viewingReport.fileName}</span>
                    <span className="text-gray-500 text-xs">({formatFileSize(viewingReport.fileSize)})</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">Enviado</p>
                  <p className="text-white text-sm">
                    {new Date(viewingReport.submittedAt).toLocaleString('es-CO')}
                  </p>
                </div>
              </div>

              {viewingReport.fileType.startsWith('image/') && viewingReport.fileData && (
                <div className="rounded-xl overflow-hidden border border-gray-700">
                  <img src={viewingReport.fileData} alt={viewingReport.title} className="w-full" />
                </div>
              )}

              {viewingReport.adminComment && (
                <div className={`p-4 rounded-xl border ${
                  viewingReport.status === 'rejected'
                    ? 'bg-red-500/10 border-red-500/30'
                    : 'bg-green-500/10 border-green-500/30'
                }`}>
                  <p className="text-xs text-gray-400 uppercase mb-1">Comentario del Administrador</p>
                  <p className={`text-sm ${viewingReport.status === 'rejected' ? 'text-red-300' : 'text-green-300'}`}>
                    {viewingReport.adminComment}
                  </p>
                </div>
              )}

              {viewingReport.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {viewingReport.tags.map((tag, i) => (
                    <span key={i} className="flex items-center gap-1 px-2.5 py-1 text-xs bg-gray-800 text-gray-300 rounded-full border border-gray-700">
                      <Tag className="w-3 h-3" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyReportsPanel;
