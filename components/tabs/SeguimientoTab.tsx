import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import {
  Package,
  Search,
  Filter,
  AlertTriangle,
  Clock,
  MapPin,
  Phone,
  RefreshCw,
  Camera,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Copy,
  Check,
  Truck,
  Calendar,
  AlertCircle,
  Bot,
  Download,
  List,
  LayoutGrid,
  CheckCircle2,
  XCircle,
  Eye,
  ClipboardCopy,
  TrendingUp,
  BarChart3,
  FileWarning,
  ArrowRight,
  HelpCircle,
  Siren,
  Bell,
  Trash2,
  Save,
  History,
  FileSpreadsheet,
  X,
  Table,
  Brain,
  Zap,
  Activity,
  Target,
  Shield,
  Sun,
  Cloud,
  Snowflake,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { AlertDashboard } from '../AlertDashboard';
import { HelpTooltip } from '../HelpSystem/HelpTooltip';
import { seguimientoHelp } from '../HelpSystem/helpContent';
import { Shipment, ShipmentStatus, CarrierName } from '../../types';
import { GuiaRetrasada, AlertLevel } from '../../types/logistics';
import {
  detectarGuiasRetrasadas,
  calcularDiasSinMovimiento,
  getUltimaFechaEvento,
} from '../../utils/patternDetection';
import { toPng } from 'html-to-image';
import {
  obtenerTodasLasHojas,
  guardarNuevaHoja,
  eliminarHoja,
  restaurarHoja,
  sincronizarHojas,
  HojaCarga,
} from '../../services/globalStorageService';

interface SeguimientoTabProps {
  shipments: Shipment[];
  onRefresh?: () => void;
  onRestoreShipments?: (shipments: Shipment[]) => void;
}

// =====================================
// INTERFACE PARA GUÍA PROCESADA
// =====================================
interface GuiaProcesada {
  guia: Shipment;
  celular: string | null;
  transportadora: string;
  origen: string;
  destino: string;
  ultimoEvento: {
    fecha: string;
    descripcion: string;
  } | null;
  ultimos2Estados: {
    fecha: string;
    descripcion: string;
    ubicacion?: string;
  }[];
  estadoGeneral: string;
  estadoReal: string; // Estado del último evento de tracking
  dias: number;
  tieneTracking: boolean;
  tieneNovedad: boolean;
}

// =====================================
// COLORES POR ESTADO
// =====================================
const getStatusColor = (status: string): { bg: string; text: string; border: string } => {
  const statusLower = status.toLowerCase();

  if (
    statusLower.includes('entregado') ||
    statusLower === 'delivered' ||
    status === ShipmentStatus.DELIVERED
  ) {
    return {
      bg: 'bg-green-100 dark:bg-green-900/30',
      text: 'text-green-700 dark:text-green-400',
      border: 'border-green-300 dark:border-green-700',
    };
  }
  if (
    statusLower.includes('tránsito') ||
    statusLower.includes('transito') ||
    statusLower.includes('reparto') ||
    status === ShipmentStatus.IN_TRANSIT
  ) {
    return {
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      text: 'text-blue-700 dark:text-blue-400',
      border: 'border-blue-300 dark:border-blue-700',
    };
  }
  if (statusLower.includes('oficina') || status === ShipmentStatus.IN_OFFICE) {
    return {
      bg: 'bg-purple-100 dark:bg-purple-900/30',
      text: 'text-purple-700 dark:text-purple-400',
      border: 'border-purple-300 dark:border-purple-700',
    };
  }
  if (
    statusLower.includes('novedad') ||
    statusLower.includes('rechazado') ||
    statusLower.includes('devuelto') ||
    statusLower.includes('problema') ||
    status === ShipmentStatus.ISSUE
  ) {
    return {
      bg: 'bg-red-100 dark:bg-red-900/30',
      text: 'text-red-700 dark:text-red-400',
      border: 'border-red-300 dark:border-red-700',
    };
  }
  if (statusLower.includes('pendiente') || status === ShipmentStatus.PENDING) {
    return {
      bg: 'bg-yellow-100 dark:bg-yellow-900/30',
      text: 'text-yellow-700 dark:text-yellow-400',
      border: 'border-yellow-300 dark:border-yellow-700',
    };
  }
  return {
    bg: 'bg-gray-100 dark:bg-gray-800',
    text: 'text-gray-700 dark:text-gray-400',
    border: 'border-gray-300 dark:border-gray-700',
  };
};

const getStatusIcon = (status: string): string => {
  const statusLower = status.toLowerCase();

  if (statusLower.includes('entregado') || statusLower === 'delivered') return '🟢';
  if (
    statusLower.includes('tránsito') ||
    statusLower.includes('transito') ||
    statusLower.includes('reparto')
  )
    return '🔵';
  if (statusLower.includes('oficina')) return '🟣';
  if (
    statusLower.includes('novedad') ||
    statusLower.includes('rechazado') ||
    statusLower.includes('devuelto') ||
    statusLower.includes('problema')
  )
    return '🔴';
  if (statusLower.includes('pendiente')) return '🟡';
  return '⚪';
};

// =====================================
// FUNCIONES DE ANÁLISIS ML
// =====================================
const FESTIVOS_COLOMBIA = [
  '2025-01-01', '2025-01-06', '2025-03-24', '2025-04-17', '2025-04-18',
  '2025-05-01', '2025-06-02', '2025-06-23', '2025-06-30', '2025-07-20',
  '2025-08-07', '2025-08-18', '2025-10-13', '2025-11-03', '2025-11-17',
  '2025-12-08', '2025-12-25',
  '2026-01-01', '2026-01-12', '2026-03-23', '2026-04-02', '2026-04-03',
];

const getSeasonInfo = (): { season: string; impact: number; icon: React.ReactNode; color: string } => {
  const month = new Date().getMonth();
  if (month >= 10 || month <= 1) {
    return { season: 'Alta (Navidad)', impact: -15, icon: <Snowflake className="w-3.5 h-3.5" />, color: 'text-blue-500' };
  }
  if (month >= 3 && month <= 5) {
    return { season: 'Lluvias', impact: -10, icon: <Cloud className="w-3.5 h-3.5" />, color: 'text-slate-500' };
  }
  if (month >= 6 && month <= 8) {
    return { season: 'Seca', impact: 5, icon: <Sun className="w-3.5 h-3.5" />, color: 'text-yellow-500' };
  }
  return { season: 'Normal', impact: 0, icon: <Sun className="w-3.5 h-3.5" />, color: 'text-amber-500' };
};

const isNearHoliday = (): boolean => {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  const threeDaysBefore = new Date(today);
  threeDaysBefore.setDate(today.getDate() - 3);
  const threeDaysAfter = new Date(today);
  threeDaysAfter.setDate(today.getDate() + 3);

  return FESTIVOS_COLOMBIA.some(holiday => {
    const h = new Date(holiday);
    return h >= threeDaysBefore && h <= threeDaysAfter;
  });
};

interface AnomaliaDetectada {
  guia: GuiaProcesada;
  tipo: 'SIN_MOVIMIENTO' | 'TRANSITO_LARGO' | 'OFICINA_MUCHO' | 'NOVEDAD_ABIERTA';
  severidad: 'CRITICO' | 'ALTO' | 'MEDIO';
  descripcion: string;
  recomendacion: string;
}

const detectarAnomalias = (guias: GuiaProcesada[]): AnomaliaDetectada[] => {
  const anomalias: AnomaliaDetectada[] = [];

  guias.forEach(g => {
    if (g.estadoGeneral.toLowerCase().includes('entregado')) return;

    // Sin movimiento > 3 días
    if (g.dias >= 3 && g.tieneTracking) {
      const ultimoEvento = g.ultimoEvento?.descripcion?.toLowerCase() || '';
      if (!ultimoEvento.includes('entregado')) {
        anomalias.push({
          guia: g,
          tipo: 'SIN_MOVIMIENTO',
          severidad: g.dias >= 5 ? 'CRITICO' : 'ALTO',
          descripcion: `${g.dias} días sin movimiento`,
          recomendacion: 'Contactar transportadora urgente'
        });
      }
    }

    // En oficina mucho tiempo
    if (g.estadoGeneral.toLowerCase().includes('oficina') && g.dias >= 3) {
      anomalias.push({
        guia: g,
        tipo: 'OFICINA_MUCHO',
        severidad: g.dias >= 5 ? 'CRITICO' : 'MEDIO',
        descripcion: `${g.dias} días en oficina sin retiro`,
        recomendacion: 'Llamar cliente para coordinar retiro'
      });
    }

    // Novedad sin gestión
    if (g.tieneNovedad && g.dias >= 2) {
      anomalias.push({
        guia: g,
        tipo: 'NOVEDAD_ABIERTA',
        severidad: 'ALTO',
        descripcion: 'Novedad abierta sin resolver',
        recomendacion: 'Gestionar novedad con transportadora'
      });
    }
  });

  // Ordenar por severidad
  const orden = { CRITICO: 0, ALTO: 1, MEDIO: 2 };
  return anomalias.sort((a, b) => orden[a.severidad] - orden[b.severidad]);
};

// =====================================
// PANEL DE ANÁLISIS COMPACTO
// =====================================
const AnalysisPanel: React.FC<{
  guiasProcesadas: GuiaProcesada[];
}> = ({ guiasProcesadas }) => {
  const analisis = useMemo(() => {
    const total = guiasProcesadas.length;
    if (total === 0) return null;

    const entregados = guiasProcesadas.filter(g => g.estadoGeneral.toLowerCase().includes('entregado')).length;
    const conNovedad = guiasProcesadas.filter(g => g.tieneNovedad).length;
    const enTransito = guiasProcesadas.filter(g =>
      g.estadoGeneral.toLowerCase().includes('tránsito') ||
      g.estadoGeneral.toLowerCase().includes('transito') ||
      g.estadoGeneral.toLowerCase().includes('reparto')
    ).length;
    const conProblema = guiasProcesadas.filter(g => g.dias > 5 && !g.estadoGeneral.toLowerCase().includes('entregado')).length;

    const tasaEntrega = total > 0 ? Math.round((entregados / total) * 100) : 0;
    const anomalias = detectarAnomalias(guiasProcesadas);
    const season = getSeasonInfo();
    const nearHoliday = isNearHoliday();

    // Score de salud logística (0-100)
    let scoreBase = 70;
    scoreBase += (tasaEntrega - 50) * 0.3; // Ajuste por tasa de entrega
    scoreBase -= conProblema * 2; // Penalización por guías problemáticas
    scoreBase -= anomalias.filter(a => a.severidad === 'CRITICO').length * 5;
    scoreBase += season.impact;
    if (nearHoliday) scoreBase -= 10;
    const score = Math.min(100, Math.max(0, Math.round(scoreBase)));

    return {
      total,
      entregados,
      tasaEntrega,
      conNovedad,
      enTransito,
      conProblema,
      anomalias: anomalias.slice(0, 5), // Top 5
      anomaliasCriticas: anomalias.filter(a => a.severidad === 'CRITICO').length,
      anomaliasAltas: anomalias.filter(a => a.severidad === 'ALTO').length,
      season,
      nearHoliday,
      score
    };
  }, [guiasProcesadas]);

  if (!analisis || analisis.total === 0) return null;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30';
    if (score >= 60) return 'text-amber-500 bg-amber-100 dark:bg-amber-900/30';
    return 'text-red-500 bg-red-100 dark:bg-red-900/30';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excelente';
    if (score >= 60) return 'Regular';
    return 'Crítico';
  };

  return (
    <div className="bg-gradient-to-r from-slate-50 to-blue-50 dark:from-navy-900 dark:to-navy-800 rounded-xl border border-slate-200 dark:border-navy-700 p-3 mb-4">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        {/* Score de Salud */}
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold ${getScoreColor(analisis.score)}`}>
            <Brain className="w-4 h-4" />
            <span className="text-lg">{analisis.score}</span>
            <span className="text-xs font-normal">/ 100</span>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium">{getScoreLabel(analisis.score)}</span>
          </div>
        </div>

        {/* Indicadores Rápidos */}
        <div className="flex items-center gap-4 text-xs">
          {/* Tasa Entrega */}
          <div className="flex items-center gap-1.5">
            <Target className={`w-3.5 h-3.5 ${analisis.tasaEntrega >= 70 ? 'text-emerald-500' : 'text-amber-500'}`} />
            <span className="text-slate-600 dark:text-slate-300">
              <span className="font-bold">{analisis.tasaEntrega}%</span> entrega
            </span>
          </div>

          {/* En Tránsito */}
          <div className="flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-slate-600 dark:text-slate-300">
              <span className="font-bold">{analisis.enTransito}</span> en ruta
            </span>
          </div>

          {/* Con Problema */}
          {analisis.conProblema > 0 && (
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
              <span className="text-red-600 dark:text-red-400">
                <span className="font-bold">{analisis.conProblema}</span> críticos
              </span>
            </div>
          )}

          {/* Temporada */}
          <div className="flex items-center gap-1.5">
            <span className={analisis.season.color}>{analisis.season.icon}</span>
            <span className="text-slate-500 dark:text-slate-400">{analisis.season.season}</span>
            {analisis.nearHoliday && (
              <span className="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded text-[10px] font-medium">
                Festivo
              </span>
            )}
          </div>
        </div>

        {/* Anomalías Rápidas */}
        {(analisis.anomaliasCriticas > 0 || analisis.anomaliasAltas > 0) && (
          <div className="flex items-center gap-2">
            {analisis.anomaliasCriticas > 0 && (
              <span className="flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-xs font-medium">
                <Zap className="w-3 h-3" />
                {analisis.anomaliasCriticas} críticos
              </span>
            )}
            {analisis.anomaliasAltas > 0 && (
              <span className="flex items-center gap-1 px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg text-xs font-medium">
                <AlertCircle className="w-3 h-3" />
                {analisis.anomaliasAltas} alertas
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// =====================================
// TARJETAS DE RESUMEN DINÁMICO
// =====================================
const SummaryCards: React.FC<{
  guiasProcesadas: GuiaProcesada[];
  onFilterByStatus: (status: string | null) => void;
  activeFilter: string | null;
}> = ({ guiasProcesadas, onFilterByStatus, activeFilter }) => {
  const stats = useMemo(() => {
    const total = guiasProcesadas.length;
    const sinTracking = guiasProcesadas.filter((g) => !g.tieneTracking).length;
    const conTracking = total - sinTracking;

    // Agrupar por estado
    const porEstado: Record<string, number> = {};
    guiasProcesadas.forEach((g) => {
      const estado = g.estadoGeneral || 'Sin Estado';
      porEstado[estado] = (porEstado[estado] || 0) + 1;
    });

    // Calcular promedio de días de entrega (solo entregados)
    const entregados = guiasProcesadas.filter((g) =>
      g.estadoGeneral.toLowerCase().includes('entregado')
    );
    const promedioDias =
      entregados.length > 0
        ? Math.round(entregados.reduce((acc, g) => acc + g.dias, 0) / entregados.length)
        : 0;

    return { total, sinTracking, conTracking, porEstado, promedioDias };
  }, [guiasProcesadas]);

  return (
    <div className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-700 p-4 mb-4">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-emerald-500" />
        <h3 className="font-bold text-slate-800 dark:text-white">Resumen de Carga</h3>
        <HelpTooltip
          title="Resumen de Carga"
          content="Vista rápida del estado de tus guías. Click en cualquier tarjeta para filtrar."
          tips={[
            'Total Guías: Todas las guías cargadas',
            'Sin Tracking: Guías sin información de seguimiento',
            'Promedio Días: Tiempo promedio de entrega de guías entregadas',
            'Con Tracking: Guías con información de seguimiento activo',
          ]}
          position="right"
        >
          <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-emerald-500 cursor-help" />
        </HelpTooltip>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-4">
        {/* Total */}
        <div
          className={`p-3 rounded-xl cursor-pointer transition-all ${
            activeFilter === null
              ? 'bg-emerald-100 dark:bg-emerald-900/40 ring-2 ring-emerald-500'
              : 'bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30'
          }`}
          onClick={() => onFilterByStatus(null)}
        >
          <div className="flex items-center gap-2 mb-1">
            <Package className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
              Total Guías
            </span>
          </div>
          <p className="text-2xl font-bold text-emerald-800 dark:text-emerald-300">{stats.total}</p>
        </div>

        {/* Sin Tracking */}
        <div
          className={`p-3 rounded-xl cursor-pointer transition-all ${
            activeFilter === 'SIN_TRACKING'
              ? 'bg-orange-100 dark:bg-orange-900/40 ring-2 ring-orange-500'
              : 'bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30'
          }`}
          onClick={() => onFilterByStatus('SIN_TRACKING')}
        >
          <div className="flex items-center gap-2 mb-1">
            <FileWarning className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <span className="text-xs font-medium text-orange-700 dark:text-orange-400">
              Sin Tracking
            </span>
          </div>
          <p className="text-2xl font-bold text-orange-800 dark:text-orange-300">
            {stats.sinTracking}
          </p>
        </div>

        {/* Promedio Días */}
        <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-medium text-blue-700 dark:text-blue-400">
              Promedio Días
            </span>
          </div>
          <p className="text-2xl font-bold text-blue-800 dark:text-blue-300">
            {stats.promedioDias}
          </p>
        </div>

        {/* Con Tracking */}
        <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-900/20">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-xs font-medium text-purple-700 dark:text-purple-400">
              Con Tracking
            </span>
          </div>
          <p className="text-2xl font-bold text-purple-800 dark:text-purple-300">
            {stats.conTracking}
          </p>
        </div>

        {/* Transportadoras */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2 mb-1">
            <Truck className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            <span className="text-xs font-medium text-slate-700 dark:text-slate-400">
              Transportadoras
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-300">
            {new Set(guiasProcesadas.map((g) => g.transportadora)).size}
          </p>
        </div>
      </div>
    </div>
  );
};

// =====================================
// BOTONES DE CLASIFICACIÓN DINÁMICA
// =====================================
const DynamicStatusButtons: React.FC<{
  guiasProcesadas: GuiaProcesada[];
  onFilterByStatus: (status: string | null) => void;
  activeFilter: string | null;
}> = ({ guiasProcesadas, onFilterByStatus, activeFilter }) => {
  const statusGroups = useMemo(() => {
    const groups: Record<string, GuiaProcesada[]> = {};
    guiasProcesadas.forEach((g) => {
      const estado = g.estadoGeneral || 'Sin Estado';
      if (!groups[estado]) groups[estado] = [];
      groups[estado].push(g);
    });
    // Ordenar por cantidad (mayor a menor)
    return Object.entries(groups).sort((a, b) => b[1].length - a[1].length);
  }, [guiasProcesadas]);

  return (
    <div className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-700 p-4 mb-4">
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 font-medium uppercase tracking-wider">
        Clasificación por Estado (click para filtrar)
      </p>
      <div className="flex flex-wrap gap-2">
        {/* Botón "Todas" */}
        <button
          onClick={() => onFilterByStatus(null)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
            activeFilter === null
              ? 'bg-slate-800 dark:bg-white text-white dark:text-slate-800 shadow-lg'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <span>Todas</span>
          <span className="bg-white/20 dark:bg-black/20 px-2 py-0.5 rounded text-xs font-bold">
            {guiasProcesadas.length}
          </span>
        </button>

        {/* Botones dinámicos por estado */}
        {statusGroups.map(([status, guias]) => {
          const colors = getStatusColor(status);
          const icon = getStatusIcon(status);
          const isActive = activeFilter === status;

          return (
            <button
              key={status}
              onClick={() => onFilterByStatus(isActive ? null : status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 border ${
                isActive
                  ? `${colors.bg} ${colors.text} ${colors.border} ring-2 ring-offset-1 ring-current shadow-md`
                  : `${colors.bg} ${colors.text} ${colors.border} hover:shadow-md`
              }`}
            >
              <span>{icon}</span>
              <span>{status}</span>
              <span className="bg-white/50 dark:bg-black/20 px-2 py-0.5 rounded text-xs font-bold">
                {guias.length}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// =====================================
// BADGE DE ESTADO VISUAL
// =====================================
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const colors = getStatusColor(status);
  const icon = getStatusIcon(status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${colors.bg} ${colors.text} border ${colors.border}`}
    >
      <span>{icon}</span>
      <span>{status}</span>
    </span>
  );
};

// =====================================
// FILA DE GUÍA EN TABLA - NUEVA ESTRUCTURA
// =====================================
const GuiaTableRow: React.FC<{
  guia: GuiaProcesada;
  onExpand: () => void;
  isExpanded: boolean;
}> = ({ guia, onExpand, isExpanded }) => {
  const [copiedGuia, setCopiedGuia] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  const handleCopyGuia = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(guia.guia.id);
    setCopiedGuia(true);
    setTimeout(() => setCopiedGuia(false), 1500);
  };

  const handleCopyPhone = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (guia.celular) {
      navigator.clipboard.writeText(guia.celular);
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 1500);
    }
  };

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (guia.celular) {
      const message = encodeURIComponent(
        `Hola! Le escribo de Litper sobre su pedido con guía ${guia.guia.id}. El estado actual es: ${guia.estadoReal || guia.estadoGeneral}. ¿Podemos coordinar la entrega?`
      );
      window.open(`https://wa.me/57${guia.celular}?text=${message}`, '_blank');
    }
  };

  const statusColors = getStatusColor(guia.estadoGeneral);

  // Formatear fecha para mostrar
  const formatFecha = (fecha: string) => {
    try {
      const date = new Date(fecha);
      return date
        .toLocaleDateString('es-CO', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
        .replace(',', ',');
    } catch {
      return fecha;
    }
  };

  return (
    <tr
      className={`border-b border-slate-100 dark:border-navy-800 hover:bg-slate-50 dark:hover:bg-navy-800/50 cursor-pointer transition-colors ${
        isExpanded ? 'bg-blue-50 dark:bg-blue-900/20' : ''
      }`}
      onClick={onExpand}
    >
      {/* GUÍA + CELULAR + Badge Novedad */}
      <td className="px-4 py-3">
        <div className="flex flex-col gap-1.5">
          {/* Número de Guía */}
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm hover:underline">
              {guia.guia.id}
            </span>
            <button
              onClick={handleCopyGuia}
              className="p-1 hover:bg-slate-200 dark:hover:bg-navy-700 rounded transition-colors"
              title="Copiar guía"
            >
              {copiedGuia ? (
                <Check className="w-3.5 h-3.5 text-green-500" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>
            {guia.tieneNovedad && (
              <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-xs font-bold rounded">
                Novedad
              </span>
            )}
          </div>

          {/* Número de Celular - VISIBLE */}
          {guia.celular && (
            <div className="flex items-center gap-1.5 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-lg border border-green-200 dark:border-green-800">
              <Phone className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
              <span className="font-mono text-xs font-medium text-green-700 dark:text-green-400">
                {guia.celular}
              </span>
              <button
                onClick={handleCopyPhone}
                className="p-0.5 hover:bg-green-200 dark:hover:bg-green-800 rounded transition-colors"
                title="Copiar teléfono"
              >
                {copiedPhone ? (
                  <Check className="w-3 h-3 text-green-600" />
                ) : (
                  <Copy className="w-3 h-3 text-green-500" />
                )}
              </button>
              <a
                href={`tel:+57${guia.celular}`}
                onClick={(e) => e.stopPropagation()}
                className="p-0.5 hover:bg-blue-200 dark:hover:bg-blue-800 rounded transition-colors"
                title="Llamar"
              >
                <Phone className="w-3 h-3 text-blue-500" />
              </a>
              <button
                onClick={handleWhatsApp}
                className="p-0.5 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                title="WhatsApp"
              >
                <MessageCircle className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </td>

      {/* TRANSPORTADORA */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-slate-400" />
          <span className="text-sm text-slate-600 dark:text-slate-400">{guia.transportadora}</span>
        </div>
      </td>

      {/* RUTA: Origen → Destino */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400">
          <span className="font-medium">{guia.origen}</span>
          <ArrowRight className="w-3 h-3 text-slate-400" />
          <span className="font-medium">{guia.destino}</span>
        </div>
      </td>

      {/* ESTADO */}
      <td className="px-4 py-3">
        <StatusBadge status={guia.estadoGeneral} />
      </td>

      {/* DÍAS */}
      <td className="px-4 py-3 text-center">
        <span
          className={`inline-flex items-center gap-1 text-sm font-bold ${
            guia.dias > 10
              ? 'text-red-600 dark:text-red-400'
              : guia.dias > 5
                ? 'text-orange-600 dark:text-orange-400'
                : guia.dias > 3
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <Clock className="w-4 h-4" />
          {guia.dias}
        </span>
      </td>

      {/* ÚLTIMOS 2 ESTADOS */}
      <td className="px-4 py-3">
        <div className="space-y-1 max-w-xs">
          {guia.ultimos2Estados.length > 0 ? (
            guia.ultimos2Estados.map((estado, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs">
                <span
                  className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                    idx === 0 ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                ></span>
                <div className="flex-1 min-w-0">
                  <span className="text-slate-400 font-mono text-[10px]">
                    {formatFecha(estado.fecha)}
                  </span>
                  <p
                    className="text-slate-700 dark:text-slate-300 truncate"
                    title={estado.descripcion}
                  >
                    {estado.descripcion}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <span className="text-xs text-slate-400 italic">Sin información</span>
          )}
        </div>
      </td>

      {/* VER */}
      <td className="px-4 py-3 text-center">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onExpand();
          }}
          className={`p-2 rounded-lg transition-colors ${
            isExpanded
              ? 'bg-blue-500 text-white'
              : 'bg-slate-100 dark:bg-navy-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-navy-700'
          }`}
          title="Ver detalles"
        >
          <Eye className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
};

// =====================================
// DETALLES EXPANDIDOS DE GUÍA - HISTORIAL COMPLETO
// =====================================
const GuiaExpandedDetails: React.FC<{
  guia: GuiaProcesada;
  onCollapse: () => void;
}> = ({ guia, onCollapse }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const events = guia.guia.detailedInfo?.events || [];
  const sortedEvents = [...events].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Formatear fecha
  const formatFecha = (fecha: string) => {
    try {
      const date = new Date(fecha);
      return date.toLocaleDateString('es-CO', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return fecha;
    }
  };

  const handleCapture = async () => {
    if (cardRef.current) {
      try {
        const dataUrl = await toPng(cardRef.current, {
          backgroundColor: '#ffffff',
          quality: 1,
          pixelRatio: 2,
        });

        try {
          const blob = await (await fetch(dataUrl)).blob();
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
          alert('Imagen copiada al portapapeles');
        } catch {
          const link = document.createElement('a');
          link.download = `historial-${guia.guia.id}-${Date.now()}.png`;
          link.href = dataUrl;
          link.click();
        }
      } catch (err) {
        console.error('Error capturing:', err);
      }
    }
  };

  const handleWhatsApp = () => {
    if (guia.celular) {
      const message = encodeURIComponent(
        `Hola! Le escribo de Litper sobre su pedido con guía ${guia.guia.id}. El estado actual es: ${guia.estadoReal || guia.estadoGeneral}. ¿Podemos coordinar la entrega?`
      );
      window.open(`https://wa.me/57${guia.celular}?text=${message}`, '_blank');
    }
  };

  return (
    <tr>
      <td colSpan={7} className="p-0">
        <div
          ref={cardRef}
          className="bg-slate-50 dark:bg-navy-950 p-4 border-t border-slate-200 dark:border-navy-700"
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Info Principal */}
            <div>
              <h4 className="font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-500" />
                Información de la Guía
              </h4>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between p-2 bg-white dark:bg-navy-900 rounded-lg">
                  <span className="text-slate-500">Guía:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-white">
                    {guia.guia.id}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 bg-white dark:bg-navy-900 rounded-lg">
                  <span className="text-slate-500">Teléfono:</span>
                  <span className="font-mono text-slate-800 dark:text-white">
                    {guia.celular || '-'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 bg-white dark:bg-navy-900 rounded-lg">
                  <span className="text-slate-500">Transportadora:</span>
                  <span className="text-slate-800 dark:text-white">{guia.transportadora}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-white dark:bg-navy-900 rounded-lg">
                  <span className="text-slate-500">Ruta:</span>
                  <span className="text-slate-800 dark:text-white">
                    {guia.origen} → {guia.destino}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 bg-white dark:bg-navy-900 rounded-lg">
                  <span className="text-slate-500">Días:</span>
                  <span className="font-bold text-slate-800 dark:text-white">{guia.dias} días</span>
                </div>
              </div>

              {/* Acciones */}
              <div className="flex flex-wrap gap-2 mt-4">
                {guia.celular && (
                  <button
                    onClick={handleWhatsApp}
                    className="flex items-center gap-2 px-3 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp
                  </button>
                )}
                <button
                  onClick={handleCapture}
                  className="flex items-center gap-2 px-3 py-2 bg-slate-200 dark:bg-navy-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-300 dark:hover:bg-navy-700 transition-colors"
                >
                  <Camera className="w-4 h-4" />
                  Capturar
                </button>
                <button
                  onClick={onCollapse}
                  className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-400 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-navy-700 transition-colors"
                >
                  <ChevronUp className="w-4 h-4" />
                  Cerrar
                </button>
              </div>
            </div>

            {/* HISTORIAL COMPLETO DE ESTADOS */}
            <div className="lg:col-span-2">
              <h4 className="font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-500" />
                Historial Completo de Movimientos
                <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">
                  {sortedEvents.length} eventos
                </span>
              </h4>

              {sortedEvents.length > 0 ? (
                <div className="bg-white dark:bg-navy-900 rounded-lg border border-slate-200 dark:border-navy-700 max-h-80 overflow-y-auto">
                  <div className="divide-y divide-slate-100 dark:divide-navy-800">
                    {sortedEvents.map((event, idx) => (
                      <div
                        key={idx}
                        className={`p-3 hover:bg-slate-50 dark:hover:bg-navy-800/50 transition-colors ${
                          idx === 0 ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Indicador de timeline */}
                          <div className="flex flex-col items-center">
                            <div
                              className={`w-3 h-3 rounded-full flex-shrink-0 ${
                                idx === 0
                                  ? 'bg-emerald-500 ring-4 ring-emerald-100 dark:ring-emerald-900/50'
                                  : 'bg-slate-300 dark:bg-slate-600'
                              }`}
                            ></div>
                            {idx < sortedEvents.length - 1 && (
                              <div className="w-0.5 h-full min-h-[20px] bg-slate-200 dark:bg-slate-700 mt-1"></div>
                            )}
                          </div>

                          {/* Contenido del evento */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              {idx === 0 && (
                                <span className="px-2 py-0.5 bg-emerald-500 text-white text-xs font-bold rounded">
                                  ACTUAL
                                </span>
                              )}
                              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                                {formatFecha(event.date)}
                              </span>
                            </div>
                            <p
                              className={`text-sm font-medium mt-1 ${
                                idx === 0
                                  ? 'text-emerald-700 dark:text-emerald-400'
                                  : 'text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {event.description}
                            </p>
                            {event.location && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {event.location}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500 bg-white dark:bg-navy-900 rounded-lg">
                  <FileWarning className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                  <p className="text-sm">No hay eventos de tracking registrados</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
};

// =====================================
// TABLA DE GUÍAS NO RASTREADAS
// =====================================
const UntrackedGuidesTable: React.FC<{
  guias: GuiaProcesada[];
}> = ({ guias }) => {
  const [copiedAll, setCopiedAll] = useState(false);

  const untrackedGuias = useMemo(() => {
    return guias.filter((g) => !g.tieneTracking);
  }, [guias]);

  const handleCopyAll = () => {
    const text = untrackedGuias.map((g) => `${g.guia.id}\t${g.celular || ''}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  if (untrackedGuias.length === 0) return null;

  return (
    <div className="bg-white dark:bg-navy-900 rounded-xl border border-orange-200 dark:border-orange-800 p-4 mt-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileWarning className="w-5 h-5 text-orange-500" />
          <h3 className="font-bold text-slate-800 dark:text-white">Guías Sin Rastrear</h3>
          <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-2 py-0.5 rounded-full text-xs font-bold">
            {untrackedGuias.length}
          </span>
        </div>
        <button
          onClick={handleCopyAll}
          className="flex items-center gap-2 px-3 py-1.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-lg text-xs font-medium hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors"
        >
          {copiedAll ? (
            <>
              <Check className="w-3.5 h-3.5" />
              Copiado!
            </>
          ) : (
            <>
              <ClipboardCopy className="w-3.5 h-3.5" />
              Copiar Todas
            </>
          )}
        </button>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
        Estas guías aparecen en el archivo de celulares pero no tienen información de tracking.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-orange-50 dark:bg-orange-900/20">
              <th className="px-3 py-2 text-left text-xs font-bold text-orange-700 dark:text-orange-400 uppercase">
                Guía
              </th>
              <th className="px-3 py-2 text-left text-xs font-bold text-orange-700 dark:text-orange-400 uppercase">
                Celular
              </th>
              <th className="px-3 py-2 text-left text-xs font-bold text-orange-700 dark:text-orange-400 uppercase hidden md:table-cell">
                Transportadora
              </th>
            </tr>
          </thead>
          <tbody>
            {untrackedGuias.slice(0, 20).map((g, idx) => (
              <tr key={g.guia.id} className="border-b border-orange-100 dark:border-orange-900/30">
                <td className="px-3 py-2 font-mono font-bold text-slate-800 dark:text-white">
                  {g.guia.id}
                </td>
                <td className="px-3 py-2 font-mono text-slate-600 dark:text-slate-400">
                  {g.celular || '-'}
                </td>
                <td className="px-3 py-2 text-slate-600 dark:text-slate-400 hidden md:table-cell">
                  {g.transportadora}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {untrackedGuias.length > 20 && (
          <p className="text-center text-xs text-orange-500 mt-2 py-2">
            +{untrackedGuias.length - 20} guías más sin rastrear
          </p>
        )}
      </div>
    </div>
  );
};

// =====================================
// COMPONENTE PRINCIPAL
// Sistema de Hojas con Persistencia Global
// =====================================

export const SeguimientoTab: React.FC<SeguimientoTabProps> = ({
  shipments,
  onRefresh,
  onRestoreShipments,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterTransportadora, setFilterTransportadora] = useState<string | null>(null);
  const [expandedGuia, setExpandedGuia] = useState<string | null>(null);

  // Estados para Tablero de Alertas
  const [showAlertDashboard, setShowAlertDashboard] = useState(false);

  // Estados para Sistema de Hojas (Persistencia Global)
  const [hojas, setHojas] = useState<HojaCarga[]>([]);
  const [showHojas, setShowHojas] = useState(false);
  const [hojaActiva, setHojaActiva] = useState<string | null>(null);
  const [cargandoHojas, setCargandoHojas] = useState(false);
  const [guardandoHoja, setGuardandoHoja] = useState(false);
  const [sincronizando, setSincronizando] = useState(false);

  // Cargar hojas desde almacenamiento global al iniciar
  useEffect(() => {
    cargarHojasGlobales();
  }, []);

  // Cargar todas las hojas del almacenamiento global
  const cargarHojasGlobales = async () => {
    setCargandoHojas(true);
    try {
      const todasLasHojas = await obtenerTodasLasHojas();
      setHojas(todasLasHojas);
    } catch (e) {
      console.error('Error cargando hojas:', e);
    } finally {
      setCargandoHojas(false);
    }
  };

  // Guardar carga actual como nueva hoja (persistencia global)
  const guardarComoNuevaHoja = async () => {
    if (shipments.length === 0) return;

    setGuardandoHoja(true);
    try {
      const nuevaHoja = await guardarNuevaHoja(shipments);
      setHojas((prev) => [nuevaHoja, ...prev]);
      setHojaActiva(nuevaHoja.id);
      alert(`Hoja "${nuevaHoja.nombre}" guardada exitosamente para todos los usuarios`);
    } catch (e) {
      console.error('Error guardando hoja:', e);
      alert('Error al guardar la hoja');
    } finally {
      setGuardandoHoja(false);
    }
  };

  // Eliminar una hoja
  const eliminarHojaHandler = async (hojaId: string) => {
    if (!confirm('¿Eliminar esta hoja? Esta acción afectará a todos los usuarios.')) return;

    try {
      await eliminarHoja(hojaId);
      setHojas((prev) => prev.filter((h) => h.id !== hojaId));
      if (hojaActiva === hojaId) setHojaActiva(null);
    } catch (e) {
      console.error('Error eliminando hoja:', e);
    }
  };

  // Restaurar una hoja (cargar sus guías)
  const restaurarHojaHandler = async (hojaId: string) => {
    const hoja = hojas.find((h) => h.id === hojaId);
    if (hoja && onRestoreShipments) {
      onRestoreShipments(hoja.guias);
      setHojaActiva(hojaId);
      setShowHojas(false);
      alert(`Hoja "${hoja.nombre}" restaurada con ${hoja.cantidadGuias} guías`);
    }
  };

  // Sincronizar hojas con servidor
  const sincronizarHojasHandler = async () => {
    setSincronizando(true);
    try {
      const resultado = await sincronizarHojas();
      if (resultado.sincronizado) {
        await cargarHojasGlobales();
        alert(`Sincronización completada. ${resultado.hojasServidor} hojas en el servidor.`);
      } else {
        alert('No se pudo sincronizar. Trabajando en modo offline.');
      }
    } catch (e) {
      console.error('Error sincronizando:', e);
    } finally {
      setSincronizando(false);
    }
  };

  // Contar guías con alertas
  const guiasConAlertas = useMemo(() => {
    return shipments.filter(
      (s) =>
        s.riskAnalysis?.level === 'URGENTE' ||
        s.riskAnalysis?.level === 'ATENCIÓN' ||
        s.status === ShipmentStatus.ISSUE
    ).length;
  }, [shipments]);

  // Procesar TODAS las guías
  const guiasProcesadas: GuiaProcesada[] = useMemo(() => {
    return shipments.map((guia) => {
      const events = guia.detailedInfo?.events || [];
      const sortedEvents = [...events].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      const ultimoEvento = sortedEvents[0] || null;

      // Obtener últimos 2 estados
      const ultimos2Estados = sortedEvents.slice(0, 2).map((e) => ({
        fecha: e.date,
        descripcion: e.description,
        ubicacion: e.location,
      }));

      // Extraer origen y destino
      let origen = 'Colombia';
      let destino = 'Desconocido';
      if (guia.detailedInfo?.origin) origen = guia.detailedInfo.origin;
      if (guia.detailedInfo?.destination) destino = guia.detailedInfo.destination;

      // Determinar estado general basado en el último evento o el status
      let estadoGeneral = guia.status || 'Sin Estado';
      let estadoReal = '';
      let tieneNovedad = false;

      if (ultimoEvento) {
        estadoReal = ultimoEvento.description;
        // Detectar estado del último evento
        const descLower = ultimoEvento.description.toLowerCase();
        if (descLower.includes('entregado') || descLower.includes('delivered')) {
          estadoGeneral = 'Entregado';
        } else if (
          descLower.includes('reparto') ||
          descLower.includes('ruta') ||
          descLower.includes('tránsito') ||
          descLower.includes('proceso de entrega')
        ) {
          estadoGeneral = 'En Reparto';
        } else if (
          descLower.includes('oficina') ||
          descLower.includes('centro logístico') ||
          descLower.includes('centro de distribución') ||
          descLower.includes('bodega')
        ) {
          estadoGeneral = 'En Centro Logístico Destino';
        } else if (
          descLower.includes('novedad') ||
          descLower.includes('rechazado') ||
          descLower.includes('devuelto') ||
          descLower.includes('no fue posible')
        ) {
          estadoGeneral = 'Novedad';
          tieneNovedad = true;
        } else if (descLower.includes('recogido') || descLower.includes('recolectado')) {
          estadoGeneral = 'Recogido';
        }
      }

      // Detectar novedad también por estado de guía
      if (
        guia.status === ShipmentStatus.ISSUE ||
        estadoGeneral.toLowerCase().includes('novedad') ||
        estadoGeneral.toLowerCase().includes('devuelto')
      ) {
        tieneNovedad = true;
      }

      // Calcular días
      const dias = guia.detailedInfo?.daysInTransit || calcularDiasSinMovimiento(guia);

      // Determinar si tiene tracking real
      const tieneTracking = events.length > 0;

      return {
        guia,
        celular: guia.phone || null,
        transportadora: guia.carrier || CarrierName.UNKNOWN,
        origen,
        destino,
        ultimoEvento: ultimoEvento
          ? {
              fecha: ultimoEvento.date,
              descripcion: ultimoEvento.description,
            }
          : null,
        ultimos2Estados,
        estadoGeneral,
        estadoReal,
        dias,
        tieneTracking,
        tieneNovedad,
      };
    });
  }, [shipments]);

  // Filtrar guías
  const guiasFiltradas = useMemo(() => {
    return guiasProcesadas.filter((g) => {
      // Filtro de búsqueda
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesId = g.guia.id.toLowerCase().includes(query);
        const matchesPhone = g.celular?.includes(query);
        const matchesCity = g.destino?.toLowerCase().includes(query);
        const matchesOrigen = g.origen?.toLowerCase().includes(query);
        if (!matchesId && !matchesPhone && !matchesCity && !matchesOrigen) return false;
      }

      // Filtro por status
      if (filterStatus) {
        if (filterStatus === 'SIN_TRACKING') {
          if (g.tieneTracking) return false;
        } else if (g.estadoGeneral !== filterStatus) {
          return false;
        }
      }

      // Filtro por transportadora
      if (filterTransportadora && g.transportadora !== filterTransportadora) {
        return false;
      }

      return true;
    });
  }, [guiasProcesadas, searchQuery, filterStatus, filterTransportadora]);

  // Obtener transportadoras únicas
  const carriers = useMemo(() => {
    const unique = new Set(shipments.map((s) => s.carrier));
    return Array.from(unique).filter((c) => c !== CarrierName.UNKNOWN);
  }, [shipments]);

  const handleStatusFilter = (status: string | null) => {
    setFilterStatus(status);
    setExpandedGuia(null);
  };

  // Exportar a Excel Profesional
  const exportarExcelProfesional = useCallback(() => {
    const fechaExport = new Date()
      .toLocaleDateString('es-CO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
      .replace(/\//g, '-');

    // Hoja 1: Resumen de guías
    const datosResumen = guiasFiltradas.map((g) => ({
      'Número de Guía': g.guia.id,
      Teléfono: g.celular || '',
      Transportadora: g.transportadora,
      'Ciudad Origen': g.origen,
      'Ciudad Destino': g.destino,
      'Estado Actual': g.estadoGeneral,
      'Días en Tránsito': g.dias,
      'Tiene Novedad': g.tieneNovedad ? 'Sí' : 'No',
      'Último Estado': g.ultimos2Estados[0]?.descripcion || '',
      'Fecha Último Estado': g.ultimos2Estados[0]?.fecha || '',
      'Estado Anterior': g.ultimos2Estados[1]?.descripcion || '',
      'Fecha Estado Anterior': g.ultimos2Estados[1]?.fecha || '',
    }));

    // Hoja 2: Historial detallado
    const datosHistorial: any[] = [];
    guiasFiltradas.forEach((g) => {
      const events = g.guia.detailedInfo?.events || [];
      const sortedEvents = [...events].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      sortedEvents.forEach((event, idx) => {
        datosHistorial.push({
          'Número de Guía': g.guia.id,
          Transportadora: g.transportadora,
          Orden: idx + 1,
          Fecha: event.date,
          Descripción: event.description,
          Ubicación: event.location || '',
        });
      });
    });

    // Hoja 3: Estadísticas
    const entregados = guiasFiltradas.filter((g) =>
      g.estadoGeneral.toLowerCase().includes('entregado')
    ).length;
    const conNovedad = guiasFiltradas.filter((g) => g.tieneNovedad).length;
    const enReparto = guiasFiltradas.filter((g) =>
      g.estadoGeneral.toLowerCase().includes('reparto')
    ).length;
    const promedioDias =
      guiasFiltradas.length > 0
        ? Math.round(guiasFiltradas.reduce((acc, g) => acc + g.dias, 0) / guiasFiltradas.length)
        : 0;

    const datosEstadisticas = [
      { Métrica: 'Total de Guías', Valor: guiasFiltradas.length },
      { Métrica: 'Guías Entregadas', Valor: entregados },
      {
        Métrica: 'Tasa de Entrega',
        Valor: `${guiasFiltradas.length > 0 ? Math.round((entregados / guiasFiltradas.length) * 100) : 0}%`,
      },
      { Métrica: 'Guías con Novedad', Valor: conNovedad },
      { Métrica: 'Guías en Reparto', Valor: enReparto },
      { Métrica: 'Promedio Días en Tránsito', Valor: promedioDias },
      { Métrica: 'Fecha de Generación', Valor: new Date().toLocaleString('es-CO') },
    ];

    // Crear libro de Excel
    const wb = XLSX.utils.book_new();

    // Agregar hojas
    const wsResumen = XLSX.utils.json_to_sheet(datosResumen);
    const wsHistorial = XLSX.utils.json_to_sheet(datosHistorial);
    const wsEstadisticas = XLSX.utils.json_to_sheet(datosEstadisticas);

    // Configurar anchos de columna
    wsResumen['!cols'] = [
      { wch: 18 }, // Guía
      { wch: 12 }, // Teléfono
      { wch: 18 }, // Transportadora
      { wch: 15 }, // Origen
      { wch: 20 }, // Destino
      { wch: 25 }, // Estado
      { wch: 8 }, // Días
      { wch: 10 }, // Novedad
      { wch: 40 }, // Último Estado
      { wch: 20 }, // Fecha
      { wch: 40 }, // Estado Anterior
      { wch: 20 }, // Fecha Anterior
    ];

    wsHistorial['!cols'] = [
      { wch: 18 }, // Guía
      { wch: 18 }, // Transportadora
      { wch: 6 }, // Orden
      { wch: 20 }, // Fecha
      { wch: 50 }, // Descripción
      { wch: 30 }, // Ubicación
    ];

    XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen Guías');
    XLSX.utils.book_append_sheet(wb, wsHistorial, 'Historial Detallado');
    XLSX.utils.book_append_sheet(wb, wsEstadisticas, 'Estadísticas');

    // Descargar archivo
    XLSX.writeFile(wb, `Seguimiento_Guias_${fechaExport}.xlsx`);
  }, [guiasFiltradas]);

  if (shipments.length === 0) {
    return (
      <div className="bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-700 p-12 text-center">
        <div className="w-20 h-20 bg-slate-100 dark:bg-navy-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <Package className="w-10 h-10 text-slate-400" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
          No hay guías cargadas
        </h3>
        <p className="text-slate-500 dark:text-slate-400 mb-4">
          Carga un reporte para comenzar el seguimiento de guías
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header con ayuda contextual */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-emerald-500" />
            Seguimiento de Guías
            <HelpTooltip
              title={seguimientoHelp.general.title}
              content={seguimientoHelp.general.content}
              tips={seguimientoHelp.general.tips}
              position="bottom"
            >
              <HelpCircle className="w-4 h-4 text-slate-400 hover:text-emerald-500 cursor-help transition-colors" />
            </HelpTooltip>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {shipments.length} guías totales •{' '}
            {guiasProcesadas.filter((g) => g.tieneTracking).length} con tracking
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Botón Tablero de Alertas */}
          <button
            onClick={() => setShowAlertDashboard(!showAlertDashboard)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              showAlertDashboard
                ? 'bg-red-500 text-white'
                : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'
            }`}
          >
            <Siren className="w-4 h-4" />
            Alertas
            {guiasConAlertas > 0 && (
              <span
                className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${
                  showAlertDashboard ? 'bg-white/20 text-white' : 'bg-red-500 text-white'
                }`}
              >
                {guiasConAlertas}
              </span>
            )}
          </button>

          {/* BOTÓN "MIRAR TODAS" - Hojas Guardadas */}
          <button
            onClick={() => setShowHojas(!showHojas)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              showHojas
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                : 'bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 text-purple-700 dark:text-purple-400 hover:from-purple-200 hover:to-indigo-200 dark:hover:from-purple-900/50 dark:hover:to-indigo-900/50'
            }`}
          >
            <List className="w-4 h-4" />
            MIRAR TODAS
            {hojas.length > 0 && (
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  showHojas ? 'bg-white/20 text-white' : 'bg-purple-600 text-white'
                }`}
              >
                {hojas.length} hojas
              </span>
            )}
          </button>

          {/* Botón Exportar Excel */}
          {shipments.length > 0 && (
            <button
              onClick={exportarExcelProfesional}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 shadow-lg"
              title="Exportar a Excel profesional"
            >
              <Table className="w-4 h-4" />
              Exportar Excel
            </button>
          )}

          {/* Botón Guardar como Nueva Hoja */}
          {shipments.length > 0 && (
            <button
              onClick={guardarComoNuevaHoja}
              disabled={guardandoHoja}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                guardandoHoja
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600 shadow-lg'
              }`}
              title="Guardar como nueva hoja (para todos los usuarios)"
            >
              {guardandoHoja ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Guardar Hoja
                </>
              )}
            </button>
          )}

          {/* Botón Sincronizar */}
          <button
            onClick={sincronizarHojasHandler}
            disabled={sincronizando}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              sincronizando
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200'
            }`}
            title="Sincronizar hojas con servidor"
          >
            <RefreshCw className={`w-4 h-4 ${sincronizando ? 'animate-spin' : ''}`} />
          </button>

          {onRefresh && (
            <HelpTooltip
              title="Actualizar Tracking"
              content="Refresca la información de todas las guías consultando las APIs de las transportadoras."
              tips={['Puede tomar unos segundos', 'Solo actualiza guías con tracking activo']}
              position="bottom"
            >
              <button
                onClick={onRefresh}
                className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-navy-800 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-navy-700 transition-colors text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Actualizar
              </button>
            </HelpTooltip>
          )}
        </div>
      </div>

      {/* Panel del Tablero de Alertas */}
      {showAlertDashboard && (
        <div className="bg-white dark:bg-navy-900 rounded-xl border border-red-200 dark:border-red-800 shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-red-500 to-orange-500 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <Siren className="w-5 h-5" />
              <h3 className="font-bold">Tablero de Alertas - Guías que requieren gestión</h3>
            </div>
            <button
              onClick={() => setShowAlertDashboard(false)}
              className="p-1 hover:bg-white/20 rounded transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
          <AlertDashboard shipments={shipments} />
        </div>
      )}

      {/* ========================================= */}
      {/* PANEL DE HOJAS - MIRAR TODAS LAS CARGAS */}
      {/* Persistencia Global para Todos los Usuarios */}
      {/* ========================================= */}
      {showHojas && (
        <div className="bg-white dark:bg-navy-900 rounded-xl border-2 border-purple-300 dark:border-purple-700 shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3 text-white">
              <div className="p-2 bg-white/20 rounded-lg">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Sistema de Hojas de Carga</h3>
                <p className="text-purple-200 text-xs">
                  Cada carga se guarda como una hoja • Disponible para todos los usuarios
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-bold">
                {hojas.length} hojas guardadas
              </span>
              <button
                onClick={() => setShowHojas(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          <div className="p-4">
            {cargandoHojas ? (
              <div className="text-center py-12">
                <RefreshCw className="w-10 h-10 text-purple-500 mx-auto mb-3 animate-spin" />
                <p className="text-slate-500 dark:text-slate-400">Cargando hojas...</p>
              </div>
            ) : hojas.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileSpreadsheet className="w-10 h-10 text-purple-500" />
                </div>
                <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
                  No hay hojas guardadas
                </h4>
                <p className="text-slate-500 dark:text-slate-400 mb-4">
                  Carga guías y haz clic en "Guardar Hoja" para crear tu primera hoja.
                </p>
                <p className="text-xs text-purple-500">
                  Las hojas se guardan para TODOS los usuarios
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Leyenda */}
                <div className="flex items-center gap-4 mb-4 pb-4 border-b border-slate-200 dark:border-navy-700">
                  <span className="text-xs text-slate-500">
                    Cada carga se guarda como una hoja independiente. Puedes restaurar cualquier
                    hoja anterior.
                  </span>
                </div>

                {/* Lista de Hojas */}
                {hojas.map((hoja, index) => (
                  <div
                    key={hoja.id}
                    className={`rounded-xl p-4 border-2 transition-all ${
                      hojaActiva === hoja.id
                        ? 'bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-400 dark:border-emerald-600 shadow-lg'
                        : 'bg-slate-50 dark:bg-navy-800 border-slate-200 dark:border-navy-700 hover:border-purple-300 dark:hover:border-purple-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* Número de Hoja */}
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${
                            hojaActiva === hoja.id
                              ? 'bg-emerald-500 text-white'
                              : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                          }`}
                        >
                          #{index + 1}
                        </div>

                        {/* Info de la Hoja */}
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-800 dark:text-white">
                              {hoja.nombre}
                            </h4>
                            {hojaActiva === hoja.id && (
                              <span className="px-2 py-0.5 bg-emerald-500 text-white text-xs font-bold rounded-full">
                                ACTIVA
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {hoja.fechaCreacion.toLocaleDateString('es-CO', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Acciones */}
                      <div className="flex items-center gap-3">
                        <span
                          className={`px-3 py-1.5 rounded-full text-sm font-bold ${
                            hojaActiva === hoja.id
                              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                              : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                          }`}
                        >
                          {hoja.cantidadGuias} guías
                        </span>

                        {/* Botón Restaurar */}
                        {onRestoreShipments && hojaActiva !== hoja.id && (
                          <button
                            onClick={() => restaurarHojaHandler(hoja.id)}
                            className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                            title="Restaurar esta hoja"
                          >
                            <Download className="w-4 h-4" />
                            Restaurar
                          </button>
                        )}

                        {/* Botón Eliminar */}
                        <button
                          onClick={() => eliminarHojaHandler(hoja.id)}
                          className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          title="Eliminar hoja"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer con info */}
          <div className="bg-slate-50 dark:bg-navy-950 px-4 py-3 border-t border-slate-200 dark:border-navy-700">
            <p className="text-xs text-slate-500 text-center">
              Las hojas se sincronizan automáticamente y están disponibles para todos los usuarios
              de la aplicación
            </p>
          </div>
        </div>
      )}

      {/* Panel de Análisis Compacto */}
      <AnalysisPanel guiasProcesadas={guiasProcesadas} />

      {/* Tarjetas de Resumen Dinámico */}
      <SummaryCards
        guiasProcesadas={guiasProcesadas}
        onFilterByStatus={handleStatusFilter}
        activeFilter={filterStatus}
      />

      {/* Botones de Clasificación Dinámica */}
      <DynamicStatusButtons
        guiasProcesadas={guiasProcesadas}
        onFilterByStatus={handleStatusFilter}
        activeFilter={filterStatus}
      />

      {/* Filtros de Búsqueda con ayuda */}
      <div className="bg-white dark:bg-navy-900 rounded-lg border border-slate-200 dark:border-navy-700 p-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search con tooltip */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <HelpTooltip
              title={seguimientoHelp.filtros.title}
              content={seguimientoHelp.filtros.content}
              tips={seguimientoHelp.filtros.tips}
              position="bottom"
            >
              <input
                type="text"
                placeholder="Buscar guía, teléfono, ciudad..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </HelpTooltip>
          </div>

          {/* Carrier filter */}
          <select
            value={filterTransportadora || ''}
            onChange={(e) => setFilterTransportadora(e.target.value || null)}
            className="px-3 py-2 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Todas las transportadoras</option>
            {carriers.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Clear filters */}
          {(filterStatus || filterTransportadora || searchQuery) && (
            <button
              onClick={() => {
                setFilterStatus(null);
                setFilterTransportadora(null);
                setSearchQuery('');
              }}
              className="px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
            >
              Limpiar Filtros
            </button>
          )}
        </div>
      </div>

      {/* Contador de resultados */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>
          Mostrando {guiasFiltradas.length} de {guiasProcesadas.length} guías
        </span>
        {filterStatus && (
          <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded-full">
            Filtro: {filterStatus === 'SIN_TRACKING' ? 'Sin Tracking' : filterStatus}
          </span>
        )}
      </div>

      {/* Tabla de Guías - Nueva Estructura */}
      <div className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 dark:bg-navy-950 border-b border-slate-200 dark:border-navy-700">
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Guía
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Transportadora
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Ruta
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Días
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Últimos Estados
                </th>
                <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Ver
                </th>
              </tr>
            </thead>
            <tbody>
              {guiasFiltradas.map((g) => (
                <React.Fragment key={g.guia.id}>
                  <GuiaTableRow
                    guia={g}
                    onExpand={() => setExpandedGuia(expandedGuia === g.guia.id ? null : g.guia.id)}
                    isExpanded={expandedGuia === g.guia.id}
                  />
                  {expandedGuia === g.guia.id && (
                    <GuiaExpandedDetails guia={g} onCollapse={() => setExpandedGuia(null)} />
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {guiasFiltradas.length === 0 && (
          <div className="p-8 text-center">
            <div className="w-12 h-12 bg-slate-100 dark:bg-navy-800 rounded-full flex items-center justify-center mx-auto mb-3">
              <Search className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">
              Sin resultados
            </h3>
            <p className="text-slate-500 text-sm mb-3">
              No se encontraron guías con los filtros seleccionados
            </p>
            <button
              onClick={() => {
                setFilterStatus(null);
                setFilterTransportadora(null);
                setSearchQuery('');
              }}
              className="text-emerald-500 hover:text-emerald-600 font-medium text-sm"
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </div>

      {/* Tabla de Guías No Rastreadas */}
      <UntrackedGuidesTable guias={guiasProcesadas} />
    </div>
  );
};

export default SeguimientoTab;
