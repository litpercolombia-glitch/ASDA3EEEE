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
import { WeeklyScorecard } from './WeeklyScorecard';
import { OperadorManager } from './OperadorManager';
import { RondaClosureLinkManager } from './RondaClosureLinkManager';

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
  const [showShareModal, setShowShareModal] = useState(false);
  const [linkCopiado, setLinkCopiado] = useState(false);
  const [adminTab, setAdminTab] = useState<'dashboard' | 'scorecard' | 'closures' | 'operators'>('dashboard');

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
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0a0a1a 0%, #0f172a 50%, #1e1b4b 100%)' }}>
      {/* Subtle grid overlay */}
      <svg className="fixed inset-0 w-full h-full opacity-[0.02] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="admin-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#admin-grid)" />
      </svg>

      <div className="relative z-10 space-y-6 p-4 sm:p-6">
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.06]"
        style={{
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(234, 88, 12, 0.05) 50%, rgba(139, 92, 246, 0.05) 100%)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-[2px]"
          style={{ background: 'linear-gradient(90deg, #f59e0b, #ea580c, #8b5cf6, #06b6d4)' }}
        />

        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
                    boxShadow: '0 0 20px rgba(245, 158, 11, 0.3)',
                  }}
                >
                  <Crown className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 flex items-center justify-center" style={{ borderColor: 'rgba(15, 23, 42, 0.95)' }}>
                  <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  Panel de Control
                  <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider font-medium rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    Admin
                  </span>
                </h1>
                <p className="text-sm text-white/40">
                  Vista completa del equipo en tiempo real
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={cargando}
                className="px-4 py-2.5 rounded-xl font-medium text-sm text-white transition-all flex items-center gap-2 disabled:opacity-50 hover:shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
                  boxShadow: '0 2px 10px rgba(245, 158, 11, 0.3)',
                }}
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
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:text-white transition-all flex items-center gap-2 border border-white/[0.08] hover:border-white/[0.15] bg-white/[0.03] hover:bg-white/[0.06]"
              >
                <History className="w-4 h-4" />
                Historico
              </button>
              <button
                onClick={() => setShowShareModal(!showShareModal)}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:text-white transition-all flex items-center gap-2 border border-white/[0.08] hover:border-cyan-500/30 bg-white/[0.03] hover:bg-cyan-500/[0.06]"
              >
                <Share2 className="w-4 h-4" />
                Compartir
              </button>
              {datos && (
                <button
                  onClick={() => onExportar('excel')}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:text-white transition-all flex items-center gap-2 border border-white/[0.08] hover:border-emerald-500/30 bg-white/[0.03] hover:bg-emerald-500/[0.06]"
                >
                  <Download className="w-4 h-4" />
                  Exportar
                </button>
              )}
              <button
                onClick={onLogout}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-white/40 hover:text-red-400 transition-all flex items-center gap-2 border border-white/[0.06] hover:border-red-500/20 bg-white/[0.02] hover:bg-red-500/[0.06]"
              >
                <LogOut className="w-4 h-4" />
                Salir
              </button>
            </div>
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

      {/* Panel de Historico */}
      {showHistorico && (
        <div className="rounded-xl border border-white/[0.06] p-6" style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(10px)' }}>
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <History className="w-5 h-5 text-purple-400" />
            Historico de Reportes ({historico.length})
          </h3>
          {historico.length === 0 ? (
            <p className="text-white/40 text-center py-4">
              No hay reportes anteriores
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {historico.slice(0, 10).map((reporte) => (
                <div
                  key={reporte.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-white/30" />
                    <div>
                      <p className="font-medium text-white/80">
                        {reporte.archivoNombre}
                      </p>
                      <p className="text-xs text-white/30">
                        {new Date(reporte.fecha).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-white/80">
                      {reporte.metricas.tasaExitoEquipo.toFixed(1)}%
                    </p>
                    <p className="text-xs text-white/30">
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
        <div className="rounded-xl border border-cyan-500/20 p-6" style={{ background: 'rgba(6, 182, 212, 0.04)', backdropFilter: 'blur(10px)' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Share2 className="w-5 h-5 text-cyan-400" />
              Compartir con el Equipo
            </h3>
            <button
              onClick={() => setShowShareModal(false)}
              className="text-white/30 hover:text-white/60 transition-colors"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-white/40 mb-4">
            Comparte este link con tu equipo para que accedan al analisis y vean su rendimiento.
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 px-4 py-3 rounded-lg border border-white/[0.08] bg-white/[0.03]">
              <Link2 className="w-4 h-4 text-white/30" />
              <input
                type="text"
                value={shareLink}
                readOnly
                className="flex-1 bg-transparent text-sm text-white/60 outline-none"
              />
            </div>
            <button
              onClick={copiarLinkEquipo}
              className={`px-4 py-3 rounded-lg font-medium flex items-center gap-2 transition-all text-sm ${
                linkCopiado
                  ? 'text-white'
                  : 'text-white hover:shadow-lg'
              }`}
              style={{
                background: linkCopiado ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                boxShadow: linkCopiado ? '0 2px 10px rgba(16, 185, 129, 0.3)' : '0 2px 10px rgba(6, 182, 212, 0.3)',
              }}
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
          <div className="mt-4 p-3 rounded-lg border border-cyan-500/10 bg-cyan-500/5">
            <p className="text-xs text-cyan-400/70">
              Cada operador selecciona su nombre al ingresar para ver sus metricas personalizadas.
            </p>
          </div>
        </div>
      )}

      {/* Admin Tabs - Premium pill design */}
      <div className="flex gap-1 rounded-xl p-1 overflow-x-auto border border-white/[0.06]" style={{ background: 'rgba(255,255,255,0.02)' }}>
        {[
          { id: 'dashboard' as const, label: 'Dashboard', icon: '📊', color: '#f59e0b' },
          { id: 'scorecard' as const, label: 'Scorecard Semanal', icon: '🏆', color: '#8b5cf6' },
          { id: 'closures' as const, label: 'Cierres de Ronda', icon: '📋', color: '#06b6d4' },
          { id: 'operators' as const, label: 'Operadores', icon: '👥', color: '#10b981' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setAdminTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
              adminTab === tab.id
                ? 'text-white shadow-lg'
                : 'text-white/40 hover:text-white/60 hover:bg-white/[0.03]'
            }`}
            style={adminTab === tab.id ? {
              background: `linear-gradient(135deg, ${tab.color}40, ${tab.color}20)`,
              border: `1px solid ${tab.color}30`,
              boxShadow: `0 2px 10px ${tab.color}15`,
            } : {}}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Scorecard Tab */}
      {adminTab === 'scorecard' && (
        <WeeklyScorecard datos={datos} />
      )}

      {/* Closures Tab */}
      {adminTab === 'closures' && (
        <RondaClosureLinkManager />
      )}

      {/* Operators Tab */}
      {adminTab === 'operators' && (
        <OperadorManager />
      )}

      {/* Dashboard Tab - Original content */}
      {adminTab === 'dashboard' && !datos && (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
            dragActive
              ? 'border-amber-500/50 bg-amber-500/5'
              : 'border-white/[0.08] hover:border-amber-500/30'
          }`}
          style={{ background: dragActive ? undefined : 'rgba(255,255,255,0.01)' }}
        >
          <FileSpreadsheet className="w-16 h-16 mx-auto mb-4 text-white/20" />
          <h3 className="text-lg font-semibold text-white/60 mb-2">
            Sube un archivo CSV o Excel
          </h3>
          <p className="text-sm text-white/30 mb-4">
            Arrastra y suelta o haz clic en "Subir Reporte"
          </p>
          <p className="text-xs text-white/20">
            Formatos soportados: .csv, .xlsx, .xls
          </p>
        </div>
      )}

      {adminTab === 'dashboard' && datos && (
        <>
          {/* Metricas globales */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {/* Total Guias */}
            <div className="rounded-xl border border-white/[0.06] p-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div className="flex items-center justify-between mb-2">
                <Package className="w-5 h-5 text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-white">
                {datos.totalGuiasProcesadas}
              </div>
              <div className="text-sm text-white/40">Guias Totales</div>
              <div className="text-xs text-emerald-400 mt-1">
                {datos.totalGuiasRealizadas} realizadas
              </div>
            </div>

            {/* Total Rondas */}
            <div className="rounded-xl border border-white/[0.06] p-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div className="flex items-center justify-between mb-2">
                <Activity className="w-5 h-5 text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-white">
                {datos.totalRondas}
              </div>
              <div className="text-sm text-white/40">Rondas</div>
            </div>

            {/* Tasa de Exito */}
            <div className="rounded-xl border p-4"
              style={{
                background: datos.tasaExitoEquipo >= UMBRALES.META_EXITO_EQUIPO
                  ? 'rgba(16, 185, 129, 0.08)' : datos.tasaExitoEquipo >= UMBRALES.REGULAR
                  ? 'rgba(245, 158, 11, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                borderColor: datos.tasaExitoEquipo >= UMBRALES.META_EXITO_EQUIPO
                  ? 'rgba(16, 185, 129, 0.2)' : datos.tasaExitoEquipo >= UMBRALES.REGULAR
                  ? 'rgba(245, 158, 11, 0.2)' : 'rgba(239, 68, 68, 0.2)',
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <Target className={`w-5 h-5 ${
                  datos.tasaExitoEquipo >= UMBRALES.META_EXITO_EQUIPO ? 'text-emerald-400' :
                  datos.tasaExitoEquipo >= UMBRALES.REGULAR ? 'text-amber-400' : 'text-red-400'
                }`} />
                <span className="text-xs text-white/30">Meta: {datos.metaEquipo}%</span>
              </div>
              <div className={`text-2xl font-bold ${
                datos.tasaExitoEquipo >= UMBRALES.META_EXITO_EQUIPO ? 'text-emerald-400' :
                datos.tasaExitoEquipo >= UMBRALES.REGULAR ? 'text-amber-400' : 'text-red-400'
              }`}>
                {datos.tasaExitoEquipo.toFixed(1)}%
              </div>
              <div className="text-sm text-white/40">Tasa de Exito</div>
            </div>

            {/* Usuarios Activos */}
            <div className="rounded-xl border border-white/[0.06] p-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div className="flex items-center justify-between mb-2">
                <Users className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="text-2xl font-bold text-white">
                {datos.usuariosActivos}
              </div>
              <div className="text-sm text-white/40">Usuarios Activos</div>
            </div>

            {/* Novedades */}
            <div className="rounded-xl border p-4"
              style={{
                background: datos.ratioNovedades > UMBRALES.ALERTA_NOVEDADES ? 'rgba(249, 115, 22, 0.08)' : 'rgba(255,255,255,0.03)',
                borderColor: datos.ratioNovedades > UMBRALES.ALERTA_NOVEDADES ? 'rgba(249, 115, 22, 0.2)' : 'rgba(255,255,255,0.06)',
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <AlertTriangle className={`w-5 h-5 ${
                  datos.ratioNovedades > UMBRALES.ALERTA_NOVEDADES ? 'text-orange-400' : 'text-white/30'
                }`} />
              </div>
              <div className={`text-2xl font-bold ${
                datos.ratioNovedades > UMBRALES.ALERTA_NOVEDADES ? 'text-orange-400' : 'text-white'
              }`}>
                {datos.ratioNovedades.toFixed(1)}%
              </div>
              <div className="text-sm text-white/40">Novedades</div>
            </div>
          </div>

          {/* SEMAFORO + EFICIENCIA + TOP 3 PROBLEMAS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Semaforo del Equipo */}
            {datos.semaforoEquipo && (
              <div className="rounded-xl border border-white/[0.06] p-6" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-cyan-400" />
                  Semaforo del Equipo
                </h3>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="p-3 rounded-lg" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                    <div className="text-2xl">🟢</div>
                    <div className="text-xl font-bold text-emerald-400">{datos.semaforoEquipo.verde}</div>
                    <div className="text-xs text-white/30">Excelente</div>
                  </div>
                  <div className="p-3 rounded-lg" style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.15)' }}>
                    <div className="text-2xl">🟡</div>
                    <div className="text-xl font-bold text-amber-400">{datos.semaforoEquipo.amarillo}</div>
                    <div className="text-xs text-white/30">Atencion</div>
                  </div>
                  <div className="p-3 rounded-lg" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.15)' }}>
                    <div className="text-2xl">🔴</div>
                    <div className="text-xl font-bold text-red-400">{datos.semaforoEquipo.rojo}</div>
                    <div className="text-xs text-white/30">Critico</div>
                  </div>
                  <div className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="text-2xl">⚪</div>
                    <div className="text-xl font-bold text-white/50">{datos.semaforoEquipo.gris}</div>
                    <div className="text-xs text-white/30">Sin datos</div>
                  </div>
                </div>
              </div>
            )}

            {/* Eficiencia del Equipo */}
            <div className="rounded-xl border p-6"
              style={{
                background: (datos.eficienciaEquipo || 0) >= 100 ? 'rgba(16, 185, 129, 0.06)' :
                  (datos.eficienciaEquipo || 0) >= 80 ? 'rgba(59, 130, 246, 0.06)' : 'rgba(239, 68, 68, 0.06)',
                borderColor: (datos.eficienciaEquipo || 0) >= 100 ? 'rgba(16, 185, 129, 0.15)' :
                  (datos.eficienciaEquipo || 0) >= 80 ? 'rgba(59, 130, 246, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              }}
            >
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Zap className={`w-5 h-5 ${
                  (datos.eficienciaEquipo || 0) >= 100 ? 'text-emerald-400' :
                  (datos.eficienciaEquipo || 0) >= 80 ? 'text-blue-400' : 'text-red-400'
                }`} />
                Eficiencia del Equipo
              </h3>
              <div className="text-center">
                <div className={`text-4xl font-bold mb-2 ${
                  (datos.eficienciaEquipo || 0) >= 100 ? 'text-emerald-400' :
                  (datos.eficienciaEquipo || 0) >= 80 ? 'text-blue-400' : 'text-red-400'
                }`}>
                  {(datos.eficienciaEquipo || 0).toFixed(0)}%
                </div>
                <div className="text-sm text-white/30">
                  Base: {METRICAS_AVANZADAS.TIEMPO_POR_GUIA} min/guia
                </div>
                <div className="mt-3 h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(datos.eficienciaEquipo || 0, 150)}%`,
                      maxWidth: '100%',
                      background: (datos.eficienciaEquipo || 0) >= 100 ? 'linear-gradient(90deg, #10b981, #059669)' :
                        (datos.eficienciaEquipo || 0) >= 80 ? 'linear-gradient(90deg, #3b82f6, #2563eb)' : 'linear-gradient(90deg, #ef4444, #dc2626)',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Top 3 Problemas */}
            {datos.top3Problemas && datos.top3Problemas.length > 0 && (
              <div className="rounded-xl border p-6" style={{ background: 'rgba(239, 68, 68, 0.04)', borderColor: 'rgba(239, 68, 68, 0.15)' }}>
                <h3 className="font-semibold text-red-400 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  Top 3 Problemas del Dia
                </h3>
                <div className="space-y-3">
                  {datos.top3Problemas.map((problema) => (
                    <div
                      key={problema.id}
                      className="flex items-start gap-3 rounded-lg p-3 border border-white/[0.04]"
                      style={{ background: 'rgba(255,255,255,0.02)' }}
                    >
                      <span className="text-xl">{problema.icono}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white/80 text-sm truncate">{problema.titulo}</p>
                        <p className="text-xs text-white/30">{problema.descripcion}</p>
                        {problema.usuariosAfectados.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {problema.usuariosAfectados.slice(0, 3).map(u => (
                              <span key={u} className="px-1.5 py-0.5 rounded text-xs text-red-300" style={{ background: 'rgba(239, 68, 68, 0.15)' }}>{u}</span>
                            ))}
                            {problema.usuariosAfectados.length > 3 && (
                              <span className="text-xs text-white/30">+{problema.usuariosAfectados.length - 3}</span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="px-2 py-1 rounded text-xs font-medium text-white"
                        style={{
                          background: problema.impacto >= 50 ? '#ef4444' : problema.impacto >= 25 ? '#f97316' : '#f59e0b',
                        }}
                      >
                        {problema.impacto}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Graficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Grafico de Barras - Rendimiento por Usuario */}
            <div className="rounded-xl border border-white/[0.06] p-6" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-400" />
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

            {/* Grafico de Pie - Distribucion de Estados */}
            <div className="rounded-xl border border-white/[0.06] p-6" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-purple-400" />
                Distribucion de Estados
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
                          backgroundColor: '#0f172a',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '8px',
                          color: 'white',
                        }}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-white/30">No hay datos para mostrar</p>
                )}
              </div>
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                {chartDataDistribucion.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm text-white/50">{item.name} ({item.value})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Ranking de Usuarios */}
          <div className="rounded-xl border border-white/[0.06] p-6" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              Ranking de Usuarios
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left py-3 px-2 text-sm font-semibold text-white/40">#</th>
                    <th className="text-left py-3 px-2 text-sm font-semibold text-white/40">Usuario</th>
                    <th className="text-center py-3 px-2 text-sm font-semibold text-white/40">Semaforo</th>
                    <th className="text-center py-3 px-2 text-sm font-semibold text-white/40">Tasa Exito</th>
                    <th className="text-center py-3 px-2 text-sm font-semibold text-white/40">Eficiencia</th>
                    <th className="text-center py-3 px-2 text-sm font-semibold text-white/40">Guias</th>
                    <th className="text-center py-3 px-2 text-sm font-semibold text-white/40">Racha</th>
                    <th className="text-center py-3 px-2 text-sm font-semibold text-white/40">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {datos.ranking.map((usuario, index) => {
                    const estadoColors = getEstadoColor(usuario.estado);
                    const semaforo = usuario.avanzadas?.semaforo || 'gris';
                    return (
                      <tr
                        key={usuario.usuario}
                        className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="py-3 px-2">
                          <span className="text-lg">{getMedallaIcon(index)}</span>
                        </td>
                        <td className="py-3 px-2">
                          <span className="font-medium text-white">{usuario.usuario}</span>
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
                          <span className={`font-semibold ${
                            usuario.tasaExito >= 85 ? 'text-emerald-400' :
                            usuario.tasaExito >= 70 ? 'text-blue-400' :
                            usuario.tasaExito >= 50 ? 'text-amber-400' : 'text-red-400'
                          }`}>
                            {usuario.tasaExito.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className={`font-medium ${
                            (usuario.avanzadas?.eficiencia || 0) >= 100 ? 'text-emerald-400' :
                            (usuario.avanzadas?.eficiencia || 0) >= 80 ? 'text-blue-400' : 'text-red-400'
                          }`}>
                            {(usuario.avanzadas?.eficiencia || 0).toFixed(0)}%
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center text-white/60">
                          {usuario.guiasRealizadas}/{usuario.totalGuiasIniciales}
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className="text-sm">
                            {usuario.avanzadas?.racha.icono || '💤'} {usuario.avanzadas?.racha.dias || 0}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                            style={{
                              background: usuario.estado === 'excelente' ? 'rgba(16,185,129,0.15)' :
                                usuario.estado === 'bueno' ? 'rgba(59,130,246,0.15)' :
                                usuario.estado === 'regular' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                              color: usuario.estado === 'excelente' ? '#34d399' :
                                usuario.estado === 'bueno' ? '#60a5fa' :
                                usuario.estado === 'regular' ? '#fbbf24' : '#f87171',
                            }}
                          >
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
            <div className="rounded-xl border border-white/[0.06] p-6" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-400" />
                Alertas del Equipo ({alertas.length})
              </h3>
              <div className="space-y-3">
                {alertas.map((alerta) => {
                  const colorMap: Record<string, { bg: string; border: string; text: string }> = {
                    critico: { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.15)', text: 'text-red-400' },
                    urgente: { bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.15)', text: 'text-orange-400' },
                    atencion: { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.15)', text: 'text-amber-400' },
                    info: { bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.15)', text: 'text-blue-400' },
                  };
                  const c = colorMap[alerta.tipo] || colorMap.info;
                  return (
                    <div key={alerta.id} className="p-4 rounded-xl" style={{ background: c.bg, border: `1px solid ${c.border}` }}>
                      <div className="flex items-start gap-3">
                        <span className="text-xl">{alerta.icono}</span>
                        <div className="flex-1">
                          <p className={`font-semibold ${c.text}`}>{alerta.titulo}</p>
                          <p className={`text-sm mt-1 ${c.text} opacity-70`}>{alerta.descripcion}</p>
                          {alerta.usuariosAfectados && alerta.usuariosAfectados.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {alerta.usuariosAfectados.map((u) => (
                                <span key={u} className="px-2 py-0.5 rounded text-xs text-white/60" style={{ background: 'rgba(255,255,255,0.06)' }}>{u}</span>
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
            <div className="rounded-xl border p-6" style={{ background: 'rgba(99, 102, 241, 0.04)', borderColor: 'rgba(99, 102, 241, 0.12)' }}>
              <button
                onClick={() => setExpandedRecs(!expandedRecs)}
                className="w-full flex items-center justify-between mb-4"
              >
                <h3 className="font-semibold text-indigo-300 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-indigo-400" />
                  Recomendaciones IA ({recomendaciones.length})
                </h3>
                {expandedRecs ? (
                  <ChevronUp className="w-5 h-5 text-indigo-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-indigo-400" />
                )}
              </button>
              {expandedRecs && (
                <div className="space-y-3">
                  {recomendaciones.map((rec) => (
                    <div key={rec.id} className="rounded-xl p-4 border border-white/[0.06]" style={{ background: 'rgba(255,255,255,0.02)' }}>
                      <div className="flex items-start gap-3">
                        <div className="text-xl">{rec.icono || '💡'}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                              style={{
                                background: rec.prioridad === 'alta' ? '#ef4444' : rec.prioridad === 'media' ? '#f59e0b' : '#3b82f6',
                              }}
                            >
                              {rec.prioridad.toUpperCase()}
                            </span>
                            <span className="font-semibold text-white">{rec.titulo}</span>
                          </div>
                          <p className="text-sm text-white/40 mb-2">{rec.descripcion}</p>
                          <div className="flex items-center gap-2 text-sm text-indigo-400">
                            <Zap className="w-4 h-4" />
                            <span className="font-medium">Accion:</span>
                            <span className="text-white/50">{rec.accion}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Informacion adicional */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl p-4 text-center border border-white/[0.06]" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <div className="text-2xl mb-1">📊</div>
              <div className="text-lg font-bold text-white">{datos.duplicadosDetectados}</div>
              <div className="text-sm text-white/40">Duplicados eliminados</div>
            </div>
            <div className="rounded-xl p-4 text-center border border-white/[0.06]" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <div className="text-2xl mb-1">⏱️</div>
              <div className="text-lg font-bold text-white">{datos.rondasConTiempoCero}</div>
              <div className="text-sm text-white/40">Rondas con tiempo = 0</div>
            </div>
            <div className="rounded-xl p-4 text-center border border-white/[0.06]" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <div className="text-2xl mb-1">❌</div>
              <div className="text-lg font-bold text-white">{datos.ratioCancelaciones.toFixed(1)}%</div>
              <div className="text-sm text-white/40">Ratio cancelaciones</div>
            </div>
          </div>

          {/* Fecha del reporte */}
          <div className="text-center text-sm text-white/30">
            Reporte generado: {new Date(datos.fecha).toLocaleString()}
          </div>
        </>
      )}
      </div>
    </div>
  );
};

export default AdminDashboard;
