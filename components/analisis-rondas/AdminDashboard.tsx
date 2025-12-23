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
  bajo: '#ef4444',
  primary: '#06b6d4',
  secondary: '#8b5cf6',
};

const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

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
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl border border-amber-200 dark:border-amber-800 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
              <Crown className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-amber-800 dark:text-amber-300 flex items-center gap-2">
                {ICONOS.ADMIN} Panel de Control Admin
              </h1>
              <p className="text-sm text-amber-700 dark:text-amber-400">
                Vista completa del equipo
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={cargando}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-medium hover:from-amber-600 hover:to-orange-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2 disabled:opacity-50"
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
              className="px-4 py-2 bg-white dark:bg-navy-800 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700 rounded-xl font-medium hover:bg-amber-50 dark:hover:bg-navy-700 transition-all flex items-center gap-2"
            >
              <History className="w-4 h-4" />
              Histórico
            </button>
            {datos && (
              <button
                onClick={() => onExportar('excel')}
                className="px-4 py-2 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-all flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Exportar
              </button>
            )}
            <button
              onClick={onLogout}
              className="px-4 py-2 bg-slate-100 dark:bg-navy-700 text-slate-700 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-navy-600 transition-all flex items-center gap-2"
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
        <div className="bg-white dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-navy-700 p-6">
          <h3 className="font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <History className="w-5 h-5 text-purple-500" />
            Histórico de Reportes ({historico.length})
          </h3>
          {historico.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400 text-center py-4">
              No hay reportes anteriores
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {historico.slice(0, 10).map((reporte) => (
                <div
                  key={reporte.id}
                  className="flex items-center justify-between p-3 bg-slate-50 dark:bg-navy-700 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="font-medium text-slate-700 dark:text-slate-300">
                        {reporte.archivoNombre}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(reporte.fecha).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-700 dark:text-slate-300">
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

      {/* Zona de carga si no hay datos */}
      {!datos && (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
            dragActive
              ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
              : 'border-slate-300 dark:border-navy-600 hover:border-amber-400'
          }`}
        >
          <FileSpreadsheet className="w-16 h-16 mx-auto mb-4 text-slate-400" />
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Sube un archivo CSV o Excel
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Arrastra y suelta o haz clic en "Subir Reporte"
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Formatos soportados: .csv, .xlsx, .xls
          </p>
        </div>
      )}

      {datos && (
        <>
          {/* Métricas globales */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {/* Total Guías */}
            <div className="bg-white dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-navy-700 p-4">
              <div className="flex items-center justify-between mb-2">
                <Package className="w-5 h-5 text-blue-500" />
              </div>
              <div className="text-2xl font-bold text-slate-800 dark:text-white">
                {datos.totalGuiasProcesadas}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Guías Totales</div>
              <div className="text-xs text-emerald-600 mt-1">
                {datos.totalGuiasRealizadas} realizadas
              </div>
            </div>

            {/* Total Rondas */}
            <div className="bg-white dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-navy-700 p-4">
              <div className="flex items-center justify-between mb-2">
                <Activity className="w-5 h-5 text-purple-500" />
              </div>
              <div className="text-2xl font-bold text-slate-800 dark:text-white">
                {datos.totalRondas}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Rondas</div>
            </div>

            {/* Tasa de Éxito */}
            <div className={`rounded-xl border p-4 ${
              datos.tasaExitoEquipo >= UMBRALES.META_EXITO_EQUIPO
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700'
                : datos.tasaExitoEquipo >= UMBRALES.REGULAR
                ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700'
                : 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <Target className={`w-5 h-5 ${
                  datos.tasaExitoEquipo >= UMBRALES.META_EXITO_EQUIPO
                    ? 'text-emerald-500'
                    : datos.tasaExitoEquipo >= UMBRALES.REGULAR
                    ? 'text-amber-500'
                    : 'text-red-500'
                }`} />
                <span className="text-sm text-slate-500">Meta: {datos.metaEquipo}%</span>
              </div>
              <div className={`text-2xl font-bold ${
                datos.tasaExitoEquipo >= UMBRALES.META_EXITO_EQUIPO
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : datos.tasaExitoEquipo >= UMBRALES.REGULAR
                  ? 'text-amber-700 dark:text-amber-400'
                  : 'text-red-700 dark:text-red-400'
              }`}>
                {datos.tasaExitoEquipo.toFixed(1)}%
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Tasa de Éxito</div>
            </div>

            {/* Usuarios Activos */}
            <div className="bg-white dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-navy-700 p-4">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-5 h-5 text-cyan-500" />
              </div>
              <div className="text-2xl font-bold text-slate-800 dark:text-white">
                {datos.usuariosActivos}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Usuarios Activos</div>
            </div>

            {/* Novedades */}
            <div className={`rounded-xl border p-4 ${
              datos.ratioNovedades > UMBRALES.ALERTA_NOVEDADES
                ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700'
                : 'bg-white dark:bg-navy-800 border-slate-200 dark:border-navy-700'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <AlertTriangle className={`w-5 h-5 ${
                  datos.ratioNovedades > UMBRALES.ALERTA_NOVEDADES
                    ? 'text-orange-500'
                    : 'text-slate-400'
                }`} />
              </div>
              <div className={`text-2xl font-bold ${
                datos.ratioNovedades > UMBRALES.ALERTA_NOVEDADES
                  ? 'text-orange-700 dark:text-orange-400'
                  : 'text-slate-800 dark:text-white'
              }`}>
                {datos.ratioNovedades.toFixed(1)}%
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Novedades</div>
            </div>
          </div>

          {/* SEMÁFORO DEL EQUIPO + EFICIENCIA + TOP 3 PROBLEMAS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Semáforo del Equipo */}
            {datos.semaforoEquipo && (
              <div className="bg-white dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-navy-700 p-6">
                <h3 className="font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-cyan-500" />
                  Semáforo del Equipo
                </h3>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className={`p-3 rounded-lg ${COLORES_SEMAFORO.verde.bg}`}>
                    <div className="text-2xl">🟢</div>
                    <div className={`text-xl font-bold ${COLORES_SEMAFORO.verde.text}`}>
                      {datos.semaforoEquipo.verde}
                    </div>
                    <div className="text-xs text-slate-500">Excelente</div>
                  </div>
                  <div className={`p-3 rounded-lg ${COLORES_SEMAFORO.amarillo.bg}`}>
                    <div className="text-2xl">🟡</div>
                    <div className={`text-xl font-bold ${COLORES_SEMAFORO.amarillo.text}`}>
                      {datos.semaforoEquipo.amarillo}
                    </div>
                    <div className="text-xs text-slate-500">Atención</div>
                  </div>
                  <div className={`p-3 rounded-lg ${COLORES_SEMAFORO.rojo.bg}`}>
                    <div className="text-2xl">🔴</div>
                    <div className={`text-xl font-bold ${COLORES_SEMAFORO.rojo.text}`}>
                      {datos.semaforoEquipo.rojo}
                    </div>
                    <div className="text-xs text-slate-500">Crítico</div>
                  </div>
                  <div className={`p-3 rounded-lg ${COLORES_SEMAFORO.gris.bg}`}>
                    <div className="text-2xl">⚪</div>
                    <div className={`text-xl font-bold ${COLORES_SEMAFORO.gris.text}`}>
                      {datos.semaforoEquipo.gris}
                    </div>
                    <div className="text-xs text-slate-500">Sin datos</div>
                  </div>
                </div>
              </div>
            )}

            {/* Eficiencia del Equipo */}
            <div className={`rounded-xl border p-6 ${
              (datos.eficienciaEquipo || 0) >= 100
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700'
                : (datos.eficienciaEquipo || 0) >= 80
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
                : 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
            }`}>
              <h3 className="font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <Zap className={`w-5 h-5 ${
                  (datos.eficienciaEquipo || 0) >= 100 ? 'text-emerald-500' :
                  (datos.eficienciaEquipo || 0) >= 80 ? 'text-blue-500' : 'text-red-500'
                }`} />
                Eficiencia del Equipo
              </h3>
              <div className="text-center">
                <div className={`text-4xl font-bold mb-2 ${
                  (datos.eficienciaEquipo || 0) >= 100 ? 'text-emerald-700 dark:text-emerald-300' :
                  (datos.eficienciaEquipo || 0) >= 80 ? 'text-blue-700 dark:text-blue-300' : 'text-red-700 dark:text-red-300'
                }`}>
                  {(datos.eficienciaEquipo || 0).toFixed(0)}%
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  Base: {METRICAS_AVANZADAS.TIEMPO_POR_GUIA} min/guía
                </div>
                <div className="mt-3 h-3 bg-slate-200 dark:bg-navy-600 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      (datos.eficienciaEquipo || 0) >= 100 ? 'bg-emerald-500' :
                      (datos.eficienciaEquipo || 0) >= 80 ? 'bg-blue-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(datos.eficienciaEquipo || 0, 150)}%`, maxWidth: '100%' }}
                  />
                </div>
              </div>
            </div>

            {/* Top 3 Problemas */}
            {datos.top3Problemas && datos.top3Problemas.length > 0 && (
              <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-xl border border-red-200 dark:border-red-800 p-6">
                <h3 className="font-semibold text-red-800 dark:text-red-300 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  Top 3 Problemas del Día
                </h3>
                <div className="space-y-3">
                  {datos.top3Problemas.map((problema, index) => (
                    <div
                      key={problema.id}
                      className="flex items-start gap-3 bg-white/50 dark:bg-navy-800/50 rounded-lg p-3"
                    >
                      <span className="text-xl">{problema.icono}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-800 dark:text-slate-200 text-sm truncate">
                          {problema.titulo}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {problema.descripcion}
                        </p>
                        {problema.usuariosAfectados.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {problema.usuariosAfectados.slice(0, 3).map(u => (
                              <span key={u} className="px-1.5 py-0.5 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded text-xs">
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
                        problema.impacto >= 50 ? 'bg-red-500 text-white' :
                        problema.impacto >= 25 ? 'bg-orange-500 text-white' : 'bg-amber-500 text-white'
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
            <div className="bg-white dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-navy-700 p-6">
              <h3 className="font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-500" />
                Rendimiento por Usuario
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartDataRendimiento} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
                    <YAxis dataKey="nombre" type="category" width={80} tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: 'none',
                        borderRadius: '8px',
                        color: 'white',
                      }}
                      formatter={(value: number) => [`${value}%`, 'Tasa de Éxito']}
                    />
                    <Bar
                      dataKey="tasaExito"
                      fill={CHART_COLORS.primary}
                      radius={[0, 4, 4, 0]}
                    />
                    <Line
                      type="monotone"
                      dataKey="meta"
                      stroke="#ef4444"
                      strokeDasharray="5 5"
                      strokeWidth={2}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Gráfico de Pie - Distribución de Estados */}
            <div className="bg-white dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-navy-700 p-6">
              <h3 className="font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-purple-500" />
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
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {chartDataDistribucion.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          border: 'none',
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
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {item.name} ({item.value})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Ranking de Usuarios */}
          <div className="bg-white dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-navy-700 p-6">
            <h3 className="font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              Ranking de Usuarios
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-navy-700">
                    <th className="text-left py-3 px-2 text-sm font-semibold text-slate-600 dark:text-slate-400">#</th>
                    <th className="text-left py-3 px-2 text-sm font-semibold text-slate-600 dark:text-slate-400">Usuario</th>
                    <th className="text-center py-3 px-2 text-sm font-semibold text-slate-600 dark:text-slate-400">Semáforo</th>
                    <th className="text-center py-3 px-2 text-sm font-semibold text-slate-600 dark:text-slate-400">Tasa Éxito</th>
                    <th className="text-center py-3 px-2 text-sm font-semibold text-slate-600 dark:text-slate-400">Eficiencia</th>
                    <th className="text-center py-3 px-2 text-sm font-semibold text-slate-600 dark:text-slate-400">Guías</th>
                    <th className="text-center py-3 px-2 text-sm font-semibold text-slate-600 dark:text-slate-400">Racha</th>
                    <th className="text-center py-3 px-2 text-sm font-semibold text-slate-600 dark:text-slate-400">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {datos.ranking.map((usuario, index) => {
                    const estadoColors = getEstadoColor(usuario.estado);
                    const semaforo = usuario.avanzadas?.semaforo || 'gris';
                    const semaforoColors = COLORES_SEMAFORO[semaforo];
                    return (
                      <tr
                        key={usuario.usuario}
                        className="border-b border-slate-100 dark:border-navy-700 hover:bg-slate-50 dark:hover:bg-navy-700/50 transition-colors"
                      >
                        <td className="py-3 px-2">
                          <span className="text-lg">{getMedallaIcon(index)}</span>
                        </td>
                        <td className="py-3 px-2">
                          <span className="font-medium text-slate-800 dark:text-white">
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
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className={`font-medium ${
                            (usuario.avanzadas?.eficiencia || 0) >= 100 ? 'text-emerald-600 dark:text-emerald-400' :
                            (usuario.avanzadas?.eficiencia || 0) >= 80 ? 'text-blue-600 dark:text-blue-400' :
                            'text-red-600 dark:text-red-400'
                          }`}>
                            {(usuario.avanzadas?.eficiencia || 0).toFixed(0)}%
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center text-slate-700 dark:text-slate-300">
                          {usuario.guiasRealizadas}/{usuario.totalGuiasIniciales}
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className="text-sm">
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
            <div className="bg-white dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-navy-700 p-6">
              <h3 className="font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                Alertas del Equipo ({alertas.length})
              </h3>
              <div className="space-y-3">
                {alertas.map((alerta) => {
                  const alertaColors = COLORES_ALERTA[alerta.tipo];
                  return (
                    <div
                      key={alerta.id}
                      className={`p-4 rounded-xl border ${alertaColors.bg} ${alertaColors.border}`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-xl">{alerta.icono}</span>
                        <div className="flex-1">
                          <p className={`font-semibold ${alertaColors.text}`}>
                            {alerta.titulo}
                          </p>
                          <p className={`text-sm mt-1 ${alertaColors.text} opacity-80`}>
                            {alerta.descripcion}
                          </p>
                          {alerta.usuariosAfectados && alerta.usuariosAfectados.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {alerta.usuariosAfectados.map((u) => (
                                <span
                                  key={u}
                                  className="px-2 py-0.5 bg-white/50 dark:bg-black/20 rounded text-xs"
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
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-6">
              <button
                onClick={() => setExpandedRecs(!expandedRecs)}
                className="w-full flex items-center justify-between mb-4"
              >
                <h3 className="font-semibold text-blue-800 dark:text-blue-300 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-blue-500" />
                  Recomendaciones Automáticas ({recomendaciones.length})
                </h3>
                {expandedRecs ? (
                  <ChevronUp className="w-5 h-5 text-blue-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-blue-500" />
                )}
              </button>
              {expandedRecs && (
                <div className="space-y-3">
                  {recomendaciones.map((rec, index) => {
                    const prioridadColors = COLORES_PRIORIDAD[rec.prioridad];
                    return (
                      <div
                        key={rec.id}
                        className="bg-white dark:bg-navy-800 rounded-xl p-4 border border-blue-100 dark:border-blue-900"
                      >
                        <div className="flex items-start gap-3">
                          <div className="text-xl">{rec.icono || '💡'}</div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${prioridadColors.badge}`}>
                                {rec.prioridad.toUpperCase()}
                              </span>
                              <span className="font-semibold text-slate-800 dark:text-white">
                                {rec.titulo}
                              </span>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                              {rec.descripcion}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
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

          {/* Información adicional */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-50 dark:bg-navy-700 rounded-xl p-4 text-center">
              <div className="text-2xl mb-1">📊</div>
              <div className="text-lg font-bold text-slate-800 dark:text-white">
                {datos.duplicadosDetectados}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Duplicados eliminados
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-navy-700 rounded-xl p-4 text-center">
              <div className="text-2xl mb-1">⏱️</div>
              <div className="text-lg font-bold text-slate-800 dark:text-white">
                {datos.rondasConTiempoCero}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Rondas con tiempo = 0
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-navy-700 rounded-xl p-4 text-center">
              <div className="text-2xl mb-1">❌</div>
              <div className="text-lg font-bold text-slate-800 dark:text-white">
                {datos.ratioCancelaciones.toFixed(1)}%
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Ratio cancelaciones
              </div>
            </div>
          </div>

          {/* Fecha del reporte */}
          <div className="text-center text-sm text-slate-500 dark:text-slate-400">
            Reporte generado: {new Date(datos.fecha).toLocaleString()}
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
