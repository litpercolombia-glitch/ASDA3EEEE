/**
 * SeguimientoComponents.tsx
 *
 * Sub-componentes extraídos de SeguimientoTab para reducir su tamaño
 * y mejorar la mantenibilidad.
 *
 * ANTES: SeguimientoTab tenía 2,227 líneas
 * AHORA: Componentes modulares reutilizables
 */

import React, { useState, useMemo } from 'react';
import {
  Package,
  AlertTriangle,
  Clock,
  MapPin,
  Phone,
  Copy,
  Check,
  Truck,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Brain,
  Zap,
  Target,
  Sun,
  Cloud,
  Snowflake,
  ChevronUp,
  ChevronDown,
  ExternalLink,
  MessageCircle,
} from 'lucide-react';
import { Shipment, ShipmentStatus } from '../../types';

// ============================================
// TIPOS E INTERFACES
// ============================================

export interface GuiaProcesada {
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
  estadoReal: string;
  dias: number;
  tieneTracking: boolean;
  tieneNovedad: boolean;
}

export interface AnomaliaDetectada {
  guia: GuiaProcesada;
  tipo: 'SIN_MOVIMIENTO' | 'TRANSITO_LARGO' | 'OFICINA_MUCHO' | 'NOVEDAD_ABIERTA';
  severidad: 'CRITICO' | 'ALTO' | 'MEDIO';
  descripcion: string;
  recomendacion: string;
}

export interface SeasonInfo {
  season: string;
  impact: number;
  icon: React.ReactNode;
  color: string;
}

// ============================================
// CONSTANTES
// ============================================

export const FESTIVOS_COLOMBIA = [
  '2025-01-01', '2025-01-06', '2025-03-24', '2025-04-17', '2025-04-18',
  '2025-05-01', '2025-06-02', '2025-06-23', '2025-06-30', '2025-07-20',
  '2025-08-07', '2025-08-18', '2025-10-13', '2025-11-03', '2025-11-17',
  '2025-12-08', '2025-12-25',
  '2026-01-01', '2026-01-12', '2026-03-23', '2026-04-02', '2026-04-03',
];

// ============================================
// FUNCIONES HELPER
// ============================================

export const getStatusColor = (status: string): { bg: string; text: string; border: string } => {
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

export const getStatusIcon = (status: string): string => {
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

export const getSeasonInfo = (): SeasonInfo => {
  const month = new Date().getMonth();
  if (month >= 10 || month <= 1) {
    return {
      season: 'Alta (Navidad)',
      impact: -15,
      icon: <Snowflake className="w-3.5 h-3.5" />,
      color: 'text-blue-500',
    };
  }
  if (month >= 3 && month <= 5) {
    return {
      season: 'Lluvias',
      impact: -10,
      icon: <Cloud className="w-3.5 h-3.5" />,
      color: 'text-slate-500',
    };
  }
  if (month >= 6 && month <= 8) {
    return {
      season: 'Seca',
      impact: 5,
      icon: <Sun className="w-3.5 h-3.5" />,
      color: 'text-yellow-500',
    };
  }
  return {
    season: 'Normal',
    impact: 0,
    icon: <Sun className="w-3.5 h-3.5" />,
    color: 'text-amber-500',
  };
};

export const isNearHoliday = (): boolean => {
  const today = new Date();
  const threeDaysBefore = new Date(today);
  threeDaysBefore.setDate(today.getDate() - 3);
  const threeDaysAfter = new Date(today);
  threeDaysAfter.setDate(today.getDate() + 3);

  return FESTIVOS_COLOMBIA.some((holiday) => {
    const h = new Date(holiday);
    return h >= threeDaysBefore && h <= threeDaysAfter;
  });
};

export const detectarAnomalias = (guias: GuiaProcesada[]): AnomaliaDetectada[] => {
  const anomalias: AnomaliaDetectada[] = [];

  guias.forEach((g) => {
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
          recomendacion: 'Contactar transportadora urgente',
        });
      }
    }

    // En oficina mucho tiempo
    if (g.estadoGeneral.toLowerCase().includes('oficina') && g.dias >= 2) {
      anomalias.push({
        guia: g,
        tipo: 'OFICINA_MUCHO',
        severidad: g.dias >= 4 ? 'CRITICO' : 'MEDIO',
        descripcion: `${g.dias} días en oficina`,
        recomendacion: 'Cliente debe recoger o reprogramar',
      });
    }

    // Novedad abierta
    if (g.tieneNovedad && g.dias >= 1) {
      anomalias.push({
        guia: g,
        tipo: 'NOVEDAD_ABIERTA',
        severidad: g.dias >= 3 ? 'ALTO' : 'MEDIO',
        descripcion: `Novedad sin resolver (${g.dias}d)`,
        recomendacion: 'Gestionar novedad con cliente',
      });
    }
  });

  // Ordenar por severidad
  const severityOrder = { CRITICO: 0, ALTO: 1, MEDIO: 2 };
  return anomalias.sort((a, b) => severityOrder[a.severidad] - severityOrder[b.severidad]);
};

// ============================================
// COMPONENTES
// ============================================

/**
 * Badge de Estado Visual
 */
export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
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

/**
 * Panel de Análisis Compacto
 */
export const AnalysisPanel: React.FC<{
  guiasProcesadas: GuiaProcesada[];
}> = ({ guiasProcesadas }) => {
  const analisis = useMemo(() => {
    const total = guiasProcesadas.length;
    if (total === 0) return null;

    const entregados = guiasProcesadas.filter((g) =>
      g.estadoGeneral.toLowerCase().includes('entregado')
    ).length;
    const conNovedad = guiasProcesadas.filter((g) => g.tieneNovedad).length;
    const enTransito = guiasProcesadas.filter(
      (g) =>
        g.estadoGeneral.toLowerCase().includes('tránsito') ||
        g.estadoGeneral.toLowerCase().includes('transito') ||
        g.estadoGeneral.toLowerCase().includes('reparto')
    ).length;
    const conProblema = guiasProcesadas.filter(
      (g) => g.dias > 5 && !g.estadoGeneral.toLowerCase().includes('entregado')
    ).length;

    const tasaEntrega = total > 0 ? Math.round((entregados / total) * 100) : 0;
    const anomalias = detectarAnomalias(guiasProcesadas);
    const season = getSeasonInfo();
    const nearHoliday = isNearHoliday();

    // Score de salud logística (0-100)
    let scoreBase = 70;
    scoreBase += (tasaEntrega - 50) * 0.3;
    scoreBase -= conProblema * 2;
    scoreBase -= anomalias.filter((a) => a.severidad === 'CRITICO').length * 5;
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
      anomalias: anomalias.slice(0, 5),
      anomaliasCriticas: anomalias.filter((a) => a.severidad === 'CRITICO').length,
      anomaliasAltas: anomalias.filter((a) => a.severidad === 'ALTO').length,
      season,
      nearHoliday,
      score,
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
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold ${getScoreColor(analisis.score)}`}
          >
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
          <div className="flex items-center gap-1.5">
            <Target
              className={`w-3.5 h-3.5 ${analisis.tasaEntrega >= 70 ? 'text-emerald-500' : 'text-amber-500'}`}
            />
            <span className="text-slate-600 dark:text-slate-300">
              <span className="font-bold">{analisis.tasaEntrega}%</span> entrega
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-slate-600 dark:text-slate-300">
              <span className="font-bold">{analisis.enTransito}</span> en ruta
            </span>
          </div>

          {analisis.conProblema > 0 && (
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
              <span className="text-red-600 dark:text-red-400">
                <span className="font-bold">{analisis.conProblema}</span> críticos
              </span>
            </div>
          )}

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

/**
 * Botones de Clasificación Dinámica por Estado
 */
export const DynamicStatusButtons: React.FC<{
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
    return Object.entries(groups).sort((a, b) => b[1].length - a[1].length);
  }, [guiasProcesadas]);

  return (
    <div className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-700 p-4 mb-4">
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 font-medium uppercase tracking-wider">
        Clasificación por Estado (click para filtrar)
      </p>
      <div className="flex flex-wrap gap-2">
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

/**
 * Tarjetas de Resumen con Estadísticas
 */
export const SummaryCards: React.FC<{
  guiasProcesadas: GuiaProcesada[];
  onFilterByStatus: (status: string | null) => void;
  activeFilter: string | null;
}> = ({ guiasProcesadas, onFilterByStatus, activeFilter }) => {
  const stats = useMemo(() => {
    const total = guiasProcesadas.length;
    const entregados = guiasProcesadas.filter((g) =>
      g.estadoGeneral.toLowerCase().includes('entregado')
    ).length;
    const enTransito = guiasProcesadas.filter(
      (g) =>
        g.estadoGeneral.toLowerCase().includes('tránsito') ||
        g.estadoGeneral.toLowerCase().includes('transito') ||
        g.estadoGeneral.toLowerCase().includes('reparto')
    ).length;
    const enOficina = guiasProcesadas.filter((g) =>
      g.estadoGeneral.toLowerCase().includes('oficina')
    ).length;
    const conNovedad = guiasProcesadas.filter((g) => g.tieneNovedad).length;
    const sinTracking = guiasProcesadas.filter((g) => !g.tieneTracking).length;

    return { total, entregados, enTransito, enOficina, conNovedad, sinTracking };
  }, [guiasProcesadas]);

  const cards = [
    {
      label: 'Total',
      value: stats.total,
      icon: Package,
      color: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
      filter: null,
    },
    {
      label: 'Entregados',
      value: stats.entregados,
      icon: CheckCircle2,
      color: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
      filter: 'Entregado',
    },
    {
      label: 'En Tránsito',
      value: stats.enTransito,
      icon: Truck,
      color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
      filter: 'En Tránsito',
    },
    {
      label: 'En Oficina',
      value: stats.enOficina,
      icon: MapPin,
      color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
      filter: 'En Oficina',
    },
    {
      label: 'Con Novedad',
      value: stats.conNovedad,
      icon: AlertTriangle,
      color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
      filter: 'novedad',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
      {cards.map((card) => (
        <button
          key={card.label}
          onClick={() => onFilterByStatus(card.filter)}
          className={`p-4 rounded-xl border transition-all ${
            activeFilter === card.filter
              ? 'ring-2 ring-indigo-500 shadow-lg'
              : 'hover:shadow-md'
          } ${card.color}`}
        >
          <div className="flex items-center justify-between">
            <card.icon className="w-5 h-5" />
            <span className="text-2xl font-bold">{card.value}</span>
          </div>
          <p className="text-xs mt-2 font-medium">{card.label}</p>
        </button>
      ))}
    </div>
  );
};

/**
 * Fila de Guía en Tabla
 */
export const GuiaTableRow: React.FC<{
  guia: GuiaProcesada;
  onExpand: () => void;
  isExpanded: boolean;
  rowNumber?: number;
}> = ({ guia, onExpand, isExpanded, rowNumber }) => {
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
      {/* GUÍA + CELULAR */}
      <td className="px-4 py-3">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            {rowNumber && (
              <span className="w-6 h-6 flex items-center justify-center bg-slate-100 dark:bg-navy-800 rounded-full text-xs font-bold text-slate-500 dark:text-slate-400">
                {rowNumber}
              </span>
            )}
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
              <button
                onClick={handleWhatsApp}
                className="p-0.5 hover:bg-green-200 dark:hover:bg-green-800 rounded transition-colors"
                title="Enviar WhatsApp"
              >
                <MessageCircle className="w-3 h-3 text-green-500" />
              </button>
            </div>
          )}
        </div>
      </td>

      {/* TRANSPORTADORA */}
      <td className="px-4 py-3">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {guia.transportadora}
        </span>
      </td>

      {/* DESTINO */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-sm text-slate-600 dark:text-slate-400">{guia.destino}</span>
        </div>
      </td>

      {/* ESTADO */}
      <td className="px-4 py-3">
        <StatusBadge status={guia.estadoGeneral} />
      </td>

      {/* DÍAS */}
      <td className="px-4 py-3 text-center">
        <span
          className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${
            guia.dias >= 5
              ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
              : guia.dias >= 3
                ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
          }`}
        >
          <Clock className="w-3 h-3" />
          {guia.dias}d
        </span>
      </td>

      {/* ÚLTIMO EVENTO */}
      <td className="px-4 py-3">
        {guia.ultimoEvento ? (
          <div className="text-xs">
            <p className="text-slate-600 dark:text-slate-400 truncate max-w-[200px]">
              {guia.ultimoEvento.descripcion}
            </p>
            <p className="text-slate-400 dark:text-slate-500">
              {formatFecha(guia.ultimoEvento.fecha)}
            </p>
          </div>
        ) : (
          <span className="text-xs text-slate-400">Sin información</span>
        )}
      </td>

      {/* EXPANDIR */}
      <td className="px-4 py-3 text-center">
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-blue-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </td>
    </tr>
  );
};

export default {
  StatusBadge,
  AnalysisPanel,
  DynamicStatusButtons,
  SummaryCards,
  GuiaTableRow,
  getStatusColor,
  getStatusIcon,
  getSeasonInfo,
  isNearHoliday,
  detectarAnomalias,
};
