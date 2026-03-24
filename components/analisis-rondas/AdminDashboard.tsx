/**
 * 👑 ADMIN DASHBOARD - ANÁLISIS DE RONDAS LITPER
 * Vista completa del administrador con todas las métricas del equipo
 */

import React, { useRef, useState } from 'react';
import {
  Crown,
  LogOut,
  Upload,
  Download,
  FileSpreadsheet,
  Target,
  Clock,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Users,
  Award,
  Zap,
  Activity,
  Lightbulb,
  BarChart3,
  RefreshCw,
  Package,
  XCircle,
  PieChart,
  History,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Eye,
  FileText,
  Share2,
  Link2,
  Copy,
  Check,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import {
  MetricasGlobales,
  MetricasUsuario,
  AlertaGlobal,
  Recomendacion,
  ReporteHistorico,
} from '../../types/analisis-rondas';
import {
  COLORES_ESTADO,
  COLORES_ALERTA,
  COLORES_PRIORIDAD,
  UMBRALES,
  ICONOS,
  COLORES_SEMAFORO,
  METRICAS_AVANZADAS,
} from '../../constants/analisis-rondas';

interface AdminDashboardProps {
  datos: MetricasGlobales | null;
  historico: ReporteHistorico[];
  alertas: AlertaGlobal[];
  recomendaciones: Recomendacion[];
  onCargarCSV: (file: File) => Promise<void>;
  onLogout: () => void;
  onExportar: (tipo: 'excel' | 'pdf') => void;
  cargando: boolean;
}

// Colores para gráficos
const CHART_COLORS = {
  excelente: '#10b981',
  bueno: '#3b82f6',
  regular: '#f59e0b',
  bajo: '#f43f5e',
  primary: '#06b6d4',
  secondary: '#8b5cf6',
};

const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#f43f5e'];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  datos,
  historico,
  alertas,
  recomendaciones,
  onCargarCSV,
  onLogout,
  onExportar,
  cargando,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [showHistorico, setShowHistorico] = useState(false);
  const [expandedRecs, setExpandedRecs] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [linkCopiado, setLinkCopiado] = useState(false);

  // Generar link para compartir con el equipo
  const shareLink = `${window.location.origin}${window.location.pathname}?view=analisis-rondas`;

  const copiarLinkEquipo = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setLinkCopiado(true);
      setTimeout(() => setLinkCopiado(false), 2000);
    } catch {
      // Fallback para navegadores sin clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = shareLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setLinkCopiado(true);
      setTimeout(() => setLinkCopiado(false), 2000);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await onCargarCSV(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      await onCargarCSV(file);
    }
  };

  const getEstadoColor = (estado: string) => {
    return COLORES_ESTADO[estado as keyof typeof COLORES_ESTADO] || COLORES_ESTADO.regular;
  };

  const getMedallaIcon = (posicion: number) => {
    switch (posicion) {
      case 0:
        return ICONOS.MEDALLA_ORO;
      case 1:
        return ICONOS.MEDALLA_PLATA;
      case 2:
        return ICONOS.MEDALLA_BRONCE;
      default:
        return `#${posicion + 1}`;
    }
  };

  // Preparar datos para gráficos
  const chartDataRendimiento = datos?.ranking.map((u) => ({
    nombre: u.usuario,
    tasaExito: parseFloat(u.tasaExito.toFixed(1)),
    guias: u.guiasRealizadas,
    meta: UMBRALES.META_EXITO_EQUIPO,
  })) || [];

  const chartDataDistribucion = datos ? [
    { name: 'Excelente', value: datos.distribucionEstados.excelente, color: CHART_COLORS.excelente },
    { name: 'Bueno', value: datos.distribucionEstados.bueno, color: CHART_COLORS.bueno },
    { name: 'Regular', value: datos.distribucionEstados.regular, color: CHART_COLORS.regular },
    { name: 'Bajo', value: datos.distribucionEstados.bajo, color: CHART_COLORS.bajo },
  ].filter(d => d.value > 0) : [];

  return (
    <div className="space-y-6 p-4 sm:p-6 animate-fade-in">
      {/* Header */}
      <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Crown className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                {ICONOS.ADMIN} Panel de Control Admin
              </h1>
              <p className="text-sm text-slate-400">
                Vista completa del equipo
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={cargando}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-medium hover:from-cyan-400 hover:to-blue-500 transition-all shadow-md shadow-cyan-500/20 hover:shadow-lg flex items-center gap-2 disabled:opacity-50"
            >
              {cargando ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              Subir Reporte
            </button>
            <button
              onClick={() => setShowHistorico(!showHistorico)}
              className="px-4 py-2 bg-slate-700/50 text-slate-300 border border-slate-600/50 rounded-xl font-medium hover:bg-slate-600/50 transition-all flex items-center gap-2"
            >
              <History className="w-4 h-4" />
              Histórico
            </button>
            <button
              onClick={() => setShowShareModal(!showShareModal)}
              className="px-4 py-2 bg-slate-700/50 text-slate-300 border border-slate-600/50 rounded-xl font-medium hover:bg-slate-600/50 transition-all flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              Compartir
            </button>
            {datos && (
              <button
                onClick={() => onExportar('excel')}
                className="px-4 py-2 bg-emerald-600/80 text-white rounded-xl font-medium hover:bg-emerald-500 transition-all flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Exportar
              </button>
            )}
            <button
              onClick={onLogout}
              className="px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-xl font-medium transition-all flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Salir
            </button>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Panel de Histórico */}
      {showHistorico && (
        <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-6">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <History className="w-5 h-5 text-purple-400" />
            Histórico de Reportes ({historico.length})
          </h3>
          {historico.length === 0 ? (
            <p className="text-slate-500 text-center py-4">
              No hay reportes anteriores
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {historico.slice(0, 10).map((reporte) => (
                <div
                  key={reporte.id}
                  className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-slate-500" />
                    <div>
                      <p className="font-medium text-slate-300">
                        {reporte.archivoNombre}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(reporte.fecha).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-white">
                      {reporte.metricas.tasaExitoEquipo.toFixed(1)}%
                    </p>
                    <p className="text-xs text-slate-500">
                      {reporte.metricas.usuariosActivos} usuarios
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal de Compartir */}
      {showShareModal && (
        <div className="bg-slate-800/90 rounded-xl border border-slate-700/50 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Share2 className="w-5 h-5 text-blue-400" />
              Compartir con el Equipo
            </h3>
            <button
              onClick={() => setShowShareModal(false)}
              className="text-slate-500 hover:text-slate-300"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-slate-400 mb-4">
            Comparte este link con tu equipo para que puedan acceder al análisis de rondas y ver su rendimiento individual.
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 px-4 py-3 bg-slate-900/50 rounded-lg border border-slate-600/50">
              <Link2 className="w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={shareLink}
                readOnly
                className="flex-1 bg-transparent text-sm text-slate-300 outline-none"
              />
            </div>
            <button
              onClick={copiarLinkEquipo}
              className={`px-4 py-3 rounded-lg font-medium flex items-center gap-2 transition-all ${
                linkCopiado
                  ? 'bg-emerald-500 text-white'
                  : 'bg-cyan-600 text-white hover:bg-cyan-500'
              }`}
            >
              {linkCopiado ? (
                <>
                  <Check className="w-4 h-4" />
                  Copiado
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copiar
                </>
              )}
            </button>
          </div>
          <div className="mt-4 p-3 bg-blue-500/10 rounded-lg">
            <p className="text-xs text-blue-400">
              💡 <strong>Tip:</strong> Cada operador podrá seleccionar su nombre al ingresar para ver sus propias métricas personalizadas.
            </p>
          </div>
        </div>
      )}

      {/* Zona de carga si no hay datos */}
      {!datos && (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
            dragActive
              ? 'border-cyan-500 bg-cyan-500/5'
              : 'border-slate-600/50 bg-slate-800/30 hover:border-cyan-500/50'
          }`}
        >
          <FileSpreadsheet className="w-16 h-16 mx-auto mb-4 text-slate-500" />
          <h3 className="text-lg font-semibold text-white mb-2">
            Sube un archivo CSV o Excel
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            Arrastra y suelta o haz clic en &quot;Subir Reporte&quot;
          </p>
          <p className="text-xs text-slate-500">
            Formatos soportados: .csv, .xlsx, .xls
          </p>
        </div>
      )}

      {datos && (
        <>
          {/* Métricas globales */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {/* Total Guías */}
            <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Package className="w-5 h-5 text-blue-400" />
                </div>
              </div>
              <div className="text-2xl font-bold text-white">
                {datos.totalGuiasProcesadas}
              </div>
              <div className="text-sm text-slate-400">Guías Totales</div>
              <div className="text-xs text-emerald-400 mt-1">
                {datos.totalGuiasRealizadas} realizadas
              </div>
            </div>

            {/* Total Rondas */}
            <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Activity className="w-5 h-5 text-purple-400" />
                </div>
              </div>
              <div className="text-2xl font-bold text-white">
                {datos.totalRondas}
              </div>
              <div className="text-sm text-slate-400">Rondas</div>
            </div>

            {/* Tasa de Éxito */}
            <div className={`rounded-xl border p-4 bg-slate-800/60 ${
              datos.tasaExitoEquipo >= UMBRALES.META_EXITO_EQUIPO
                ? 'border-emerald-500/30'
                : datos.tasaExitoEquipo >= UMBRALES.REGULAR
                ? 'border-amber-500/30'
                : 'border-rose-500/30'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg ${
                  datos.tasaExitoEquipo >= UMBRALES.META_EXITO_EQUIPO
                    ? 'bg-emerald-500/10' : datos.tasaExitoEquipo >= UMBRALES.REGULAR
                    ? 'bg-amber-500/10' : 'bg-rose-500/10'
                }`}>
                  <Target className={`w-5 h-5 ${
                    datos.tasaExitoEquipo >= UMBRALES.META_EXITO_EQUIPO
                      ? 'text-emerald-400'
                      : datos.tasaExitoEquipo >= UMBRALES.REGULAR
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`} />
                </div>
                <span className="text-sm text-slate-500">Meta: {datos.metaEquipo}%</span>
              </div>
              <div className={`text-2xl font-bold ${
                datos.tasaExitoEquipo >= UMBRALES.META_EXITO_EQUIPO
                  ? 'text-emerald-400'
                  : datos.tasaExitoEquipo >= UMBRALES.REGULAR
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}>
                {datos.tasaExitoEquipo.toFixed(1)}%
              </div>
              <div className="text-sm text-slate-400">Tasa de Éxito</div>
            </div>

            {/* Usuarios Activos */}
            <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-cyan-500/10">
                  <Users className="w-5 h-5 text-cyan-400" />
                </div>
              </div>
              <div className="text-2xl font-bold text-white">
                {datos.usuariosActivos}
              </div>
              <div className="text-sm text-slate-400">Usuarios Activos</div>
            </div>

            {/* Novedades */}
            <div className={`rounded-xl border p-4 bg-slate-800/60 ${
              datos.ratioNovedades > UMBRALES.ALERTA_NOVEDADES
                ? 'border-orange-500/30'
                : 'border-slate-700/50'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg ${
                  datos.ratioNovedades > UMBRALES.ALERTA_NOVEDADES
                    ? 'bg-orange-500/10' : 'bg-slate-700/50'
                }`}>
                  <AlertTriangle className={`w-5 h-5 ${
                    datos.ratioNovedades > UMBRALES.ALERTA_NOVEDADES
                      ? 'text-orange-400'
                      : 'text-slate-400'
                  }`} />
                </div>
              </div>
              <div className={`text-2xl font-bold ${
                datos.ratioNovedades > UMBRALES.ALERTA_NOVEDADES
                  ? 'text-orange-400'
                  : 'text-white'
              }`}>
                {datos.ratioNovedades.toFixed(1)}%
              </div>
              <div className="text-sm text-slate-400">Novedades</div>
            </div>
          </div>

          {/* SEMÁFORO DEL EQUIPO + EFICIENCIA + TOP 3 PROBLEMAS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Semáforo del Equipo */}
            {datos.semaforoEquipo && (() => {
              const semaforoTotal = datos.semaforoEquipo.verde + datos.semaforoEquipo.amarillo + datos.semaforoEquipo.rojo + datos.semaforoEquipo.gris;
              const semaforoItems = [
                { label: 'Excelente', value: datos.semaforoEquipo.verde, barColor: 'bg-emerald-500' },
                { label: 'Atención', value: datos.semaforoEquipo.amarillo, barColor: 'bg-amber-500' },
                { label: 'Crítico', value: datos.semaforoEquipo.rojo, barColor: 'bg-rose-500' },
                { label: 'Sin datos', value: datos.semaforoEquipo.gris, barColor: 'bg-slate-500' },
              ];
              return (
                <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-6">
                  <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-cyan-400" />
                    Semáforo del Equipo
                  </h3>
                  <div className="space-y-3">
                    {semaforoItems.map(item => {
                      const pct = semaforoTotal > 0 ? (item.value / semaforoTotal) * 100 : 0;
                      return (
                        <div key={item.label} className="flex items-center gap-3">
                          <span className="text-sm text-slate-400 w-20 text-right">{item.label}</span>
                          <div className="flex-1 h-2.5 bg-slate-700/50 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${item.barColor} rounded-full transition-all`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-sm font-bold text-white w-6 text-right">{item.value}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Eficiencia del Equipo */}
            <div className={`rounded-xl border p-6 bg-slate-800/60 ${
              (datos.eficienciaEquipo || 0) >= 100
                ? 'border-emerald-500/30'
                : (datos.eficienciaEquipo || 0) >= 80
                ? 'border-blue-500/30'
                : 'border-rose-500/30'
            }`}>
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Zap className={`w-5 h-5 ${
                  (datos.eficienciaEquipo || 0) >= 100 ? 'text-emerald-400' :
                  (datos.eficienciaEquipo || 0) >= 80 ? 'text-blue-400' : 'text-rose-400'
                }`} />
                Eficiencia del Equipo
              </h3>
              <div className="text-center">
                <div className={`text-4xl font-bold mb-2 ${
                  (datos.eficienciaEquipo || 0) >= 100 ? 'text-emerald-400' :
                  (datos.eficienciaEquipo || 0) >= 80 ? 'text-blue-400' : 'text-rose-400'
                }`}>
                  {(datos.eficienciaEquipo || 0).toFixed(0)}%
                </div>
                <div className="text-sm text-slate-500">
                  Base: {METRICAS_AVANZADAS.TIEMPO_POR_GUIA} min/guía
                </div>
                <div className="mt-3 h-3 bg-slate-700/50 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      (datos.eficienciaEquipo || 0) >= 100 ? 'bg-emerald-500' :
                      (datos.eficienciaEquipo || 0) >= 80 ? 'bg-blue-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(datos.eficienciaEquipo || 0, 150)}%`, maxWidth: '100%' }}
                  />
                </div>
              </div>
            </div>

            {/* Top 3 Problemas */}
            {datos.top3Problemas && datos.top3Problemas.length > 0 && (
              <div className="bg-slate-800/60 rounded-xl border border-rose-500/20 p-6">
                <h3 className="font-semibold text-rose-400 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-rose-400" />
                  Top 3 Problemas del Día
                </h3>
                <div className="space-y-3">
                  {datos.top3Problemas.map((problema) => (
                    <div
                      key={problema.id}
                      className="flex items-start gap-3 bg-slate-700/30 rounded-lg p-3"
                    >
                      <span className="text-xl">{problema.icono}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-200 text-sm truncate">
                          {problema.titulo}
                        </p>
                        <p className="text-xs text-slate-500">
                          {problema.descripcion}
                        </p>
                        {problema.usuariosAfectados.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {problema.usuariosAfectados.slice(0, 3).map(u => (
                              <span key={u} className="px-1.5 py-0.5 bg-rose-500/15 text-rose-300 rounded text-xs">
                                {u}
                              </span>
                            ))}
                            {problema.usuariosAfectados.length > 3 && (
                              <span className="text-xs text-slate-500">+{problema.usuariosAfectados.length - 3}</span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        problema.impacto >= 50 ? 'bg-rose-500/20 text-rose-300' :
                        problema.impacto >= 25 ? 'bg-orange-500/20 text-orange-300' : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {problema.impacto}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de Barras - Rendimiento por Usuario */}
            <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-6">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-400" />
                Rendimiento por Usuario
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartDataRendimiento} layout="vertical">
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#2dd4bf" />
                        <stop offset="100%" stopColor="#06b6d4" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                    <YAxis dataKey="nombre" type="category" width={80} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: 'white',
                      }}
                      formatter={(value: number) => [`${value}%`, 'Tasa de Éxito']}
                    />
                    <Bar
                      dataKey="tasaExito"
                      fill="url(#barGradient)"
                      radius={[0, 6, 6, 0]}
                    />
                    <Line
                      type="monotone"
                      dataKey="meta"
                      stroke="#f43f5e"
                      strokeDasharray="5 5"
                      strokeWidth={1.5}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Gráfico de Pie - Distribución de Estados */}
            <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-6">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-purple-400" />
                Distribución de Estados
              </h3>
              <div className="h-64 flex items-center justify-center">
                {chartDataDistribucion.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={chartDataDistribucion}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="value"
                        stroke="#1e293b"
                        strokeWidth={2}
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {chartDataDistribucion.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          border: '1px solid #334155',
                          borderRadius: '8px',
                          color: 'white',
                        }}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-slate-500">No hay datos para mostrar</p>
                )}
              </div>
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                {chartDataDistribucion.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm text-slate-400">
                      {item.name} ({item.value})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Ranking de Usuarios */}
          <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-6">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              Ranking de Usuarios
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-700/30 border-b border-slate-700/30">
                    <th className="text-left py-3 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">#</th>
                    <th className="text-left py-3 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Usuario</th>
                    <th className="text-center py-3 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Semáforo</th>
                    <th className="text-center py-3 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tasa Éxito</th>
                    <th className="text-center py-3 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Eficiencia</th>
                    <th className="text-center py-3 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Guías</th>
                    <th className="text-center py-3 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Racha</th>
                    <th className="text-center py-3 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {datos.ranking.map((usuario, index) => {
                    const estadoColors = getEstadoColor(usuario.estado);
                    const semaforo = usuario.avanzadas?.semaforo || 'gris';
                    const eficiencia = usuario.avanzadas?.eficiencia || 0;
                    const tasaBarColor = usuario.tasaExito >= 85 ? 'bg-emerald-500' : usuario.tasaExito >= 70 ? 'bg-blue-500' : usuario.tasaExito >= 50 ? 'bg-amber-500' : 'bg-rose-500';
                    const eficBarColor = eficiencia >= 100 ? 'bg-emerald-500' : eficiencia >= 80 ? 'bg-blue-500' : 'bg-rose-500';
                    return (
                      <tr
                        key={usuario.usuario}
                        className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors"
                      >
                        <td className="py-3 px-2">
                          <span className="text-lg">{getMedallaIcon(index)}</span>
                        </td>
                        <td className="py-3 px-2">
                          <span className="font-medium text-white">
                            {usuario.usuario}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className="text-xl">
                            {semaforo === 'verde' && '🟢'}
                            {semaforo === 'amarillo' && '🟡'}
                            {semaforo === 'rojo' && '🔴'}
                            {semaforo === 'gris' && '⚪'}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className={`font-semibold ${estadoColors.text}`}>
                            {usuario.tasaExito.toFixed(1)}%
                          </span>
                          <div className="w-16 h-1.5 bg-slate-700/50 rounded-full mt-1 mx-auto">
                            <div className={`h-full rounded-full ${tasaBarColor}`} style={{ width: `${Math.min(usuario.tasaExito, 100)}%` }} />
                          </div>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className={`font-medium ${
                            eficiencia >= 100 ? 'text-emerald-400' :
                            eficiencia >= 80 ? 'text-blue-400' :
                            'text-rose-400'
                          }`}>
                            {eficiencia.toFixed(0)}%
                          </span>
                          <div className="w-16 h-1.5 bg-slate-700/50 rounded-full mt-1 mx-auto">
                            <div className={`h-full rounded-full ${eficBarColor}`} style={{ width: `${Math.min(eficiencia, 100)}%` }} />
                          </div>
                        </td>
                        <td className="py-3 px-2 text-center text-slate-300">
                          {usuario.guiasRealizadas}/{usuario.totalGuiasIniciales}
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className="text-sm text-slate-300">
                            {usuario.avanzadas?.racha.icono || '💤'} {usuario.avanzadas?.racha.dias || 0}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${estadoColors.bg} ${estadoColors.text}`}>
                            {estadoColors.icon} {usuario.estado}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Alertas Globales */}
          {alertas.length > 0 && (
            <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-6">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-400" />
                Alertas del Equipo ({alertas.length})
              </h3>
              <div className="space-y-3">
                {alertas.map((alerta) => {
                  const alertaColors = COLORES_ALERTA[alerta.tipo];
                  return (
                    <div
                      key={alerta.id}
                      className={`p-4 rounded-lg border-l-4 bg-slate-700/20 ${alertaColors.border}`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-xl">{alerta.icono}</span>
                        <div className="flex-1">
                          <p className="font-semibold text-white">
                            {alerta.titulo}
                          </p>
                          <p className="text-sm mt-1 text-slate-400">
                            {alerta.descripcion}
                          </p>
                          {alerta.usuariosAfectados && alerta.usuariosAfectados.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {alerta.usuariosAfectados.map((u) => (
                                <span
                                  key={u}
                                  className="px-2 py-0.5 bg-slate-600/50 text-slate-300 rounded text-xs"
                                >
                                  {u}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recomendaciones */}
          {recomendaciones.length > 0 && (
            <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-6">
              <button
                onClick={() => setExpandedRecs(!expandedRecs)}
                className="w-full flex items-center justify-between mb-4"
              >
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-cyan-400" />
                  Recomendaciones Automáticas ({recomendaciones.length})
                </h3>
                {expandedRecs ? (
                  <ChevronUp className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                )}
              </button>
              {expandedRecs && (
                <div className="space-y-3">
                  {recomendaciones.map((rec) => {
                    const prioridadColors = COLORES_PRIORIDAD[rec.prioridad];
                    return (
                      <div
                        key={rec.id}
                        className="bg-slate-700/20 rounded-xl p-4 border border-slate-700/30"
                      >
                        <div className="flex items-start gap-3">
                          <div className="text-xl">{rec.icono || '💡'}</div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${prioridadColors.badge}`}>
                                {rec.prioridad.toUpperCase()}
                              </span>
                              <span className="font-semibold text-white">
                                {rec.titulo}
                              </span>
                            </div>
                            <p className="text-sm text-slate-400 mb-2">
                              {rec.descripcion}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-cyan-400">
                              <Zap className="w-4 h-4" />
                              <span className="font-medium">Acción:</span>
                              <span>{rec.accion}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Métricas de Limpieza */}
          <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-4">
            <div className="grid grid-cols-3 divide-x divide-slate-700/30">
              <div className="text-center px-4">
                <BarChart3 className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                <div className="text-lg font-bold text-white">
                  {datos.duplicadosDetectados}
                </div>
                <div className="text-xs text-slate-500">
                  Duplicados eliminados
                </div>
              </div>
              <div className="text-center px-4">
                <Clock className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                <div className="text-lg font-bold text-white">
                  {datos.rondasConTiempoCero}
                </div>
                <div className="text-xs text-slate-500">
                  Rondas tiempo = 0
                </div>
              </div>
              <div className="text-center px-4">
                <XCircle className="w-5 h-5 text-rose-400 mx-auto mb-1" />
                <div className="text-lg font-bold text-white">
                  {datos.ratioCancelaciones.toFixed(1)}%
                </div>
                <div className="text-xs text-slate-500">
                  Ratio cancelaciones
                </div>
              </div>
            </div>
          </div>

          {/* Fecha del reporte */}
          <div className="text-center text-sm text-slate-500">
            Reporte generado: {new Date(datos.fecha).toLocaleString()}
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
