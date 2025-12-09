import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Activity,
  Search,
  Filter,
  Download,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Bot,
  FileSpreadsheet,
  Truck,
  MapPin,
  BarChart3,
  Percent,
  ChevronDown,
  ChevronUp,
  Eye,
  X,
  Zap,
  Target,
  Shield,
  AlertCircle,
  Package,
  Lightbulb,
  ArrowUpDown,
  FileText,
  Sparkles,
  Info,
  ArrowRight,
  Award,
  Navigation,
  Route,
  Star,
  Brain,
  Repeat,
  DollarSign,
  HelpCircle,
} from 'lucide-react';
import { HelpTooltip } from '../HelpSystem/HelpTooltip';
import { semaforoHelp } from '../HelpSystem/helpContent';
import { ExcelUploader } from '../excel/ExcelUploader';
import {
  CiudadSemaforo,
  SemaforoExcelData,
  SemaforoColor,
  STORAGE_KEYS,
  TasaEntregaRow,
  TiempoPromedioRow,
} from '../../types/logistics';
import { saveTabData, loadTabData } from '../../utils/tabStorage';
import { CiudadColombia, buscarCiudades, CIUDADES_COLOMBIA } from '../../data/ciudadesColombia';

interface SemaforoTabNewProps {
  onDataLoaded?: (data: SemaforoExcelData) => void;
}

// Enhanced Semaforo Score calculation
interface SemaforoScoreResult {
  score: number;
  color: SemaforoColor;
  factors: {
    tasaEntrega: number;
    velocidad: number;
    volumen: number;
    consistencia: number;
  };
  recommendation: string;
}

const calculateSemaforoScore = (
  entregas: number,
  devoluciones: number,
  total: number,
  tiempoPromedio: number,
  volumenHistorico: number = total
): SemaforoScoreResult => {
  // Calculate base metrics
  const tasaEntrega = total > 0 ? (entregas / total) * 100 : 0;
  const tasaDevolucion = total > 0 ? (devoluciones / total) * 100 : 0;

  // Semaforo Score Formula (as per brief):
  // Score = (TasaEntrega × 0.40) + ((10 - TiempoPromedio) × 0.30) + (VolumenHistorico × 0.20) + (Consistencia × 0.10)

  // Factor 1: Tasa de entrega (40% weight)
  const tasaEntregaFactor = tasaEntrega * 0.40;

  // Factor 2: Velocidad - inverse of time, normalized to 0-100 (30% weight)
  const tiempoNormalizado = Math.max(0, Math.min(10, tiempoPromedio));
  const velocidadFactor = ((10 - tiempoNormalizado) / 10) * 100 * 0.30;

  // Factor 3: Volumen - confidence based on sample size (20% weight)
  const volumenNormalizado = Math.min(volumenHistorico / 100, 1.0) * 100;
  const volumenFactor = volumenNormalizado * 0.20;

  // Factor 4: Consistencia - placeholder for consistency metric (10% weight)
  // In real scenario, this would calculate month-over-month variance
  const consistenciaFactor = (tasaEntrega > 70 ? 80 : tasaEntrega > 50 ? 60 : 40) * 0.10;

  // Final score
  const score = Math.round(tasaEntregaFactor + velocidadFactor + volumenFactor + consistenciaFactor);

  // Determine color based on score
  let color: SemaforoColor;
  let recommendation: string;

  if (score >= 75) {
    color = 'VERDE';
    recommendation = 'Ruta excelente. Mantener operación actual. Ideal para contraentrega.';
  } else if (score >= 65) {
    color = 'AMARILLO';
    recommendation = 'Buen rendimiento. Monitorear tiempos de entrega. Contraentrega aceptable.';
  } else if (score >= 50) {
    color = 'NARANJA';
    recommendation = 'Alerta. Confirmar datos del cliente antes de enviar. Considerar prepago.';
  } else {
    color = 'ROJO';
    recommendation = 'Ruta crítica. Exigir PREPAGO obligatorio o cambiar transportadora.';
  }

  // Add specific recommendations based on factors
  if (tiempoPromedio > 7) {
    recommendation += ` Tiempo de entrega alto (${tiempoPromedio.toFixed(1)} días).`;
  }
  if (total < 10) {
    recommendation += ' Muestra estadística limitada.';
  }
  if (tasaDevolucion > 30) {
    recommendation += ` Alta tasa de devolución (${tasaDevolucion.toFixed(0)}%).`;
  }

  return {
    score,
    color,
    factors: {
      tasaEntrega: Math.round(tasaEntregaFactor),
      velocidad: Math.round(velocidadFactor),
      volumen: Math.round(volumenFactor),
      consistencia: Math.round(consistenciaFactor),
    },
    recommendation,
  };
};

// Process Excel data with enhanced scoring
const procesarExcelConScore = (data: SemaforoExcelData): (CiudadSemaforo & { score: number; factors: SemaforoScoreResult['factors'] })[] => {
  const tiemposMap = new Map<string, number>();

  // Build time lookup
  data.tiempoPromedio.forEach((row) => {
    const key = `${row.ciudad.toUpperCase()}-${row.transportadora.toUpperCase()}`;
    tiemposMap.set(key, row.dias);
  });

  // Process each delivery rate row
  const results = data.tasaEntregas.map((row) => {
    const key = `${row.ciudad.toUpperCase()}-${row.transportadora.toUpperCase()}`;
    const tiempoPromedio = tiemposMap.get(key) || 5;

    const scoreResult = calculateSemaforoScore(
      row.entregas,
      row.devoluciones,
      row.total,
      tiempoPromedio,
      row.total
    );

    return {
      ciudad: row.ciudad,
      transportadora: row.transportadora,
      entregas: row.entregas,
      devoluciones: row.devoluciones,
      total: row.total,
      tasaExito: row.total > 0 ? (row.entregas / row.total) * 100 : 0,
      tasaDevolucion: row.total > 0 ? (row.devoluciones / row.total) * 100 : 0,
      tiempoPromedio,
      semaforo: scoreResult.color,
      recomendacionIA: scoreResult.recommendation,
      score: scoreResult.score,
      factors: scoreResult.factors,
    };
  });

  // Sort by score descending
  return results.sort((a, b) => b.score - a.score);
};

// City detail modal component
interface CityDetailModalProps {
  ciudad: CiudadSemaforo & { score: number; factors: SemaforoScoreResult['factors'] };
  onClose: () => void;
}

const CityDetailModal: React.FC<CityDetailModalProps> = ({ ciudad, onClose }) => {
  const colorConfig = {
    VERDE: { bg: 'bg-emerald-500', text: 'text-emerald-700', light: 'bg-emerald-100' },
    AMARILLO: { bg: 'bg-yellow-500', text: 'text-yellow-700', light: 'bg-yellow-100' },
    NARANJA: { bg: 'bg-orange-500', text: 'text-orange-700', light: 'bg-orange-100' },
    ROJO: { bg: 'bg-red-500', text: 'text-red-700', light: 'bg-red-100' },
  };

  const config = colorConfig[ciudad.semaforo];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-navy-900 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className={`${config.bg} px-6 py-4 text-white`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                {ciudad.ciudad}
              </h3>
              <p className="text-white/80 text-sm flex items-center gap-1">
                <Truck className="w-4 h-4" />
                {ciudad.transportadora}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Score display */}
          <div className="text-center">
            <div className={`inline-flex items-center justify-center w-24 h-24 ${config.bg} rounded-full text-white`}>
              <div>
                <p className="text-3xl font-bold">{ciudad.score}</p>
                <p className="text-xs">SCORE</p>
              </div>
            </div>
          </div>

          {/* Score breakdown */}
          <div className="bg-slate-50 dark:bg-navy-950 rounded-xl p-4">
            <h4 className="font-bold text-slate-700 dark:text-white text-sm mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Desglose del Score
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Tasa de Entrega (40%)</span>
                <span className="font-bold text-emerald-600">{ciudad.factors.tasaEntrega} pts</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Velocidad (30%)</span>
                <span className="font-bold text-blue-600">{ciudad.factors.velocidad} pts</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Volumen (20%)</span>
                <span className="font-bold text-purple-600">{ciudad.factors.volumen} pts</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Consistencia (10%)</span>
                <span className="font-bold text-amber-600">{ciudad.factors.consistencia} pts</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-emerald-600">{ciudad.entregas}</p>
              <p className="text-xs text-slate-500">Entregas exitosas</p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-red-600">{ciudad.devoluciones}</p>
              <p className="text-xs text-slate-500">Devoluciones</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{ciudad.tiempoPromedio}d</p>
              <p className="text-xs text-slate-500">Tiempo promedio</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-slate-700 dark:text-white">{ciudad.total}</p>
              <p className="text-xs text-slate-500">Total envíos</p>
            </div>
          </div>

          {/* AI Recommendation */}
          <div className={`${config.light} dark:bg-opacity-20 rounded-xl p-4 border border-${ciudad.semaforo === 'VERDE' ? 'emerald' : ciudad.semaforo === 'AMARILLO' ? 'yellow' : ciudad.semaforo === 'NARANJA' ? 'orange' : 'red'}-200 dark:border-opacity-30`}>
            <div className="flex items-start gap-2">
              <Bot className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-bold text-slate-700 dark:text-white text-sm mb-1">Recomendación IA</p>
                <p className="text-sm text-slate-600 dark:text-slate-300">{ciudad.recomendacionIA}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// CITY SEARCH RESULTS - Muestra info completa de ciudad buscada
// ============================================
interface CitySearchResultsProps {
  ciudad: string;
  resultados: (CiudadSemaforo & { score: number; factors: SemaforoScoreResult['factors'] })[];
  onClear: () => void;
}

const CitySearchResults: React.FC<CitySearchResultsProps> = ({ ciudad, resultados, onClear }) => {
  if (resultados.length === 0) return null;

  const totalEnvios = resultados.reduce((sum, r) => sum + r.total, 0);
  const totalEntregas = resultados.reduce((sum, r) => sum + r.entregas, 0);
  const totalDevoluciones = resultados.reduce((sum, r) => sum + r.devoluciones, 0);
  const tasaPromedio = totalEnvios > 0 ? (totalEntregas / totalEnvios) * 100 : 0;
  const mejorTransportadora = resultados.reduce((best, r) => r.score > best.score ? r : best, resultados[0]);

  const semaforoConfig = {
    VERDE: { emoji: '🟢', bg: 'bg-emerald-500', light: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600', border: 'border-emerald-200 dark:border-emerald-800' },
    AMARILLO: { emoji: '🟡', bg: 'bg-yellow-500', light: 'bg-yellow-50 dark:bg-yellow-900/20', text: 'text-yellow-600', border: 'border-yellow-200 dark:border-yellow-800' },
    NARANJA: { emoji: '🟠', bg: 'bg-orange-500', light: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-600', border: 'border-orange-200 dark:border-orange-800' },
    ROJO: { emoji: '🔴', bg: 'bg-red-500', light: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-600', border: 'border-red-200 dark:border-red-800' },
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 to-amber-50 dark:from-navy-900 dark:to-navy-800 rounded-2xl border-2 border-amber-200 dark:border-amber-800 p-6 mb-6 animate-in slide-in-from-top">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl shadow-lg">
            <MapPin className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{ciudad}</h3>
            <p className="text-sm text-slate-500">{resultados.length} transportadora{resultados.length > 1 ? 's' : ''} disponible{resultados.length > 1 ? 's' : ''}</p>
          </div>
        </div>
        <button
          onClick={onClear}
          className="p-2 hover:bg-slate-200 dark:hover:bg-navy-700 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-slate-500" />
        </button>
      </div>

      {/* Resumen General */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-navy-900 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-navy-700">
          <p className="text-xs text-slate-500 mb-1">Total Envíos</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-white">{totalEnvios}</p>
        </div>
        <div className="bg-white dark:bg-navy-900 rounded-xl p-4 shadow-sm border border-emerald-200 dark:border-emerald-800">
          <p className="text-xs text-emerald-600 mb-1">Entregas Exitosas</p>
          <p className="text-2xl font-bold text-emerald-600">{totalEntregas}</p>
        </div>
        <div className="bg-white dark:bg-navy-900 rounded-xl p-4 shadow-sm border border-red-200 dark:border-red-800">
          <p className="text-xs text-red-500 mb-1">Devoluciones</p>
          <p className="text-2xl font-bold text-red-500">{totalDevoluciones}</p>
        </div>
        <div className="bg-white dark:bg-navy-900 rounded-xl p-4 shadow-sm border border-blue-200 dark:border-blue-800">
          <p className="text-xs text-blue-600 mb-1">Tasa de Éxito</p>
          <p className="text-2xl font-bold text-blue-600">{tasaPromedio.toFixed(1)}%</p>
        </div>
      </div>

      {/* Mejor Opción */}
      <div className={`${semaforoConfig[mejorTransportadora.semaforo].light} ${semaforoConfig[mejorTransportadora.semaforo].border} border-2 rounded-xl p-4 mb-6`}>
        <div className="flex items-center gap-2 mb-3">
          <Award className="w-5 h-5 text-amber-500" />
          <span className="font-bold text-slate-700 dark:text-white">Mejor Opción Recomendada</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 ${semaforoConfig[mejorTransportadora.semaforo].bg} rounded-xl flex items-center justify-center text-white font-bold`}>
              {mejorTransportadora.score}
            </div>
            <div>
              <p className="font-bold text-slate-800 dark:text-white text-lg">{mejorTransportadora.transportadora}</p>
              <p className="text-sm text-slate-500">Score {mejorTransportadora.score}/100 • {mejorTransportadora.tasaExito.toFixed(0)}% éxito • {mejorTransportadora.tiempoPromedio}d promedio</p>
            </div>
          </div>
          <span className="text-2xl">{semaforoConfig[mejorTransportadora.semaforo].emoji}</span>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-navy-700">
          <p className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
            <Bot className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
            {mejorTransportadora.recomendacionIA}
          </p>
        </div>
      </div>

      {/* Comparativa de Transportadoras */}
      <div className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-700 overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 dark:bg-navy-950 border-b border-slate-200 dark:border-navy-700">
          <h4 className="font-bold text-slate-700 dark:text-white flex items-center gap-2">
            <Truck className="w-4 h-4 text-amber-500" />
            Comparativa de Transportadoras en {ciudad}
          </h4>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-navy-800">
          {resultados.sort((a, b) => b.score - a.score).map((t, idx) => {
            const config = semaforoConfig[t.semaforo];
            return (
              <div key={`${t.transportadora}-${idx}`} className={`p-4 ${idx === 0 ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-slate-400 w-6">#{idx + 1}</span>
                      <div className={`w-10 h-10 ${config.bg} rounded-lg flex items-center justify-center text-white font-bold text-sm`}>
                        {t.score}
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-white">{t.transportadora}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-emerald-500" />
                          {t.entregas} entregas
                        </span>
                        <span className="flex items-center gap-1">
                          <XCircle className="w-3 h-3 text-red-500" />
                          {t.devoluciones} dev.
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-blue-500" />
                          {t.tiempoPromedio}d
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <span className={`text-lg font-bold ${config.text}`}>{t.tasaExito.toFixed(0)}%</span>
                      <span>{config.emoji}</span>
                    </div>
                    <p className="text-xs text-slate-400">{t.total} envíos</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recomendaciones */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800">
          <p className="font-bold text-emerald-700 dark:text-emerald-400 text-sm mb-2 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Para Contraentrega
          </p>
          <p className="text-sm text-emerald-600 dark:text-emerald-300">
            {resultados.filter(r => r.semaforo === 'VERDE').length > 0
              ? `Usa ${resultados.filter(r => r.semaforo === 'VERDE')[0]?.transportadora || mejorTransportadora.transportadora} para máxima seguridad.`
              : 'Considera solicitar prepago en esta ciudad.'}
          </p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
          <p className="font-bold text-blue-700 dark:text-blue-400 text-sm mb-2 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Tiempo de Entrega
          </p>
          <p className="text-sm text-blue-600 dark:text-blue-300">
            Promedio en {ciudad}: {(resultados.reduce((sum, r) => sum + r.tiempoPromedio, 0) / resultados.length).toFixed(1)} días.
            {resultados.some(r => r.tiempoPromedio <= 3) && ` La más rápida: ${resultados.reduce((best, r) => r.tiempoPromedio < best.tiempoPromedio ? r : best, resultados[0]).transportadora}.`}
          </p>
        </div>
      </div>
    </div>
  );
};

// Insights panel component
interface InsightsPanelProps {
  ciudades: (CiudadSemaforo & { score: number })[];
}

const InsightsPanel: React.FC<InsightsPanelProps> = ({ ciudades }) => {
  const insights = useMemo(() => {
    const result: { type: 'warning' | 'success' | 'info' | 'strategy'; icon: string; title: string; message: string }[] = [];

    // Critical routes
    const critical = ciudades.filter(c => c.semaforo === 'ROJO');
    if (critical.length > 0) {
      result.push({
        type: 'warning',
        icon: '⚠️',
        title: 'Rutas Críticas Detectadas',
        message: `${critical.length} rutas tienen alto riesgo de devolución. Ciudades: ${critical.slice(0, 3).map(c => c.ciudad).join(', ')}${critical.length > 3 ? ` y ${critical.length - 3} más` : ''}`,
      });
    }

    // Top performers
    const topPerformers = ciudades.filter(c => c.semaforo === 'VERDE').slice(0, 3);
    if (topPerformers.length > 0) {
      result.push({
        type: 'success',
        icon: '✅',
        title: 'Rutas Óptimas',
        message: `Las mejores opciones son: ${topPerformers.map(c => `${c.ciudad} (${c.transportadora})`).join(', ')}`,
      });
    }

    // Low volume routes
    const lowVolume = ciudades.filter(c => c.total < 10);
    if (lowVolume.length > 0) {
      result.push({
        type: 'info',
        icon: '📊',
        title: 'Muestra Limitada',
        message: `${lowVolume.length} rutas tienen menos de 10 envíos históricos. Los resultados pueden variar.`,
      });
    }

    // Strategy recommendation
    const avgScore = ciudades.reduce((sum, c) => sum + c.score, 0) / ciudades.length;
    result.push({
      type: 'strategy',
      icon: '🎯',
      title: 'Estrategia Recomendada',
      message: avgScore >= 70
        ? `Score promedio: ${avgScore.toFixed(1)}/100. Tu red logística está optimizada. Mantén estas rutas.`
        : `Score promedio: ${avgScore.toFixed(1)}/100. Considera renegociar con transportadoras de bajo rendimiento.`,
    });

    return result;
  }, [ciudades]);

  const typeConfig = {
    warning: { bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800', text: 'text-red-700 dark:text-red-400' },
    success: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800', text: 'text-emerald-700 dark:text-emerald-400' },
    info: { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', text: 'text-blue-700 dark:text-blue-400' },
    strategy: { bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-800', text: 'text-purple-700 dark:text-purple-400' },
  };

  return (
    <div className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-700 p-4">
      <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
        <Zap className="w-5 h-5 text-purple-500" />
        Análisis Predictivo IA
        <Sparkles className="w-4 h-4 text-yellow-500" />
        <HelpTooltip
          title="Análisis con Inteligencia Artificial"
          content="El sistema analiza automáticamente tus datos para generar insights y recomendaciones."
          tips={[
            'Detecta rutas problemáticas antes de enviar',
            'Identifica las mejores transportadoras por ciudad',
            'Sugiere estrategias de optimización',
            'Calcula el impacto financiero de cambios'
          ]}
          position="right"
        >
          <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-purple-500 cursor-help" />
        </HelpTooltip>
      </h3>
      <div className="space-y-3">
        {insights.map((insight, idx) => {
          const config = typeConfig[insight.type];
          return (
            <div
              key={idx}
              className={`${config.bg} ${config.border} border rounded-lg p-3`}
            >
              <p className={`font-bold text-sm ${config.text} flex items-center gap-2`}>
                <span>{insight.icon}</span>
                {insight.title}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{insight.message}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Route Optimization Panel - New Component
interface RouteOptimizationPanelProps {
  ciudades: (CiudadSemaforo & { score: number; factors: SemaforoScoreResult['factors'] })[];
}

interface RouteOptimization {
  ciudad: string;
  currentCarrier: string;
  currentScore: number;
  currentTime: number;
  currentSuccessRate: number;
  recommendedCarrier: string;
  recommendedScore: number;
  recommendedTime: number;
  recommendedSuccessRate: number;
  improvement: number;
  timeImprovement: number;
  recommendation: string;
  priority: 'ALTA' | 'MEDIA' | 'BAJA';
}

interface CarrierCityComparison {
  city: string;
  carriers: {
    name: string;
    score: number;
    successRate: number;
    time: number;
    total: number;
  }[];
  bestCarrier: string;
  worstCarrier: string;
  speedDifference: number;
  successDifference: number;
}

const RouteOptimizationPanel: React.FC<RouteOptimizationPanelProps> = ({ ciudades }) => {
  const [expandedSection, setExpandedSection] = useState<'optimizations' | 'comparisons' | 'report' | null>('optimizations');

  // Generate route optimizations
  const optimizations = useMemo((): RouteOptimization[] => {
    const result: RouteOptimization[] = [];

    // Group by city
    const cityGroups: Record<string, typeof ciudades> = {};
    ciudades.forEach(c => {
      const city = c.ciudad.toUpperCase();
      if (!cityGroups[city]) cityGroups[city] = [];
      cityGroups[city].push(c);
    });

    // For cities with multiple carriers, find optimization opportunities
    Object.entries(cityGroups).forEach(([city, carriers]) => {
      if (carriers.length < 2) return;

      // Sort by score to find best and worst
      const sorted = [...carriers].sort((a, b) => b.score - a.score);
      const best = sorted[0];
      const worst = sorted[sorted.length - 1];

      // Only suggest if there's significant difference
      const scoreDiff = best.score - worst.score;
      const timeDiff = worst.tiempoPromedio - best.tiempoPromedio;

      if (scoreDiff >= 10 || timeDiff >= 1.5) {
        result.push({
          ciudad: city,
          currentCarrier: worst.transportadora,
          currentScore: worst.score,
          currentTime: worst.tiempoPromedio,
          currentSuccessRate: worst.tasaExito,
          recommendedCarrier: best.transportadora,
          recommendedScore: best.score,
          recommendedTime: best.tiempoPromedio,
          recommendedSuccessRate: best.tasaExito,
          improvement: scoreDiff,
          timeImprovement: timeDiff,
          recommendation: generateOptimizationRecommendation(city, worst, best),
          priority: scoreDiff >= 25 ? 'ALTA' : scoreDiff >= 15 ? 'MEDIA' : 'BAJA',
        });
      }
    });

    return result.sort((a, b) => b.improvement - a.improvement);
  }, [ciudades]);

  // Generate carrier comparisons by city
  const carrierComparisons = useMemo((): CarrierCityComparison[] => {
    const cityGroups: Record<string, typeof ciudades> = {};
    ciudades.forEach(c => {
      const city = c.ciudad.toUpperCase();
      if (!cityGroups[city]) cityGroups[city] = [];
      cityGroups[city].push(c);
    });

    return Object.entries(cityGroups)
      .filter(([_, carriers]) => carriers.length >= 2)
      .map(([city, carriers]) => {
        const sorted = [...carriers].sort((a, b) => b.score - a.score);
        const best = sorted[0];
        const worst = sorted[sorted.length - 1];

        return {
          city,
          carriers: carriers.map(c => ({
            name: c.transportadora,
            score: c.score,
            successRate: c.tasaExito,
            time: c.tiempoPromedio,
            total: c.total,
          })).sort((a, b) => b.score - a.score),
          bestCarrier: best.transportadora,
          worstCarrier: worst.transportadora,
          speedDifference: worst.tiempoPromedio - best.tiempoPromedio,
          successDifference: best.tasaExito - worst.tasaExito,
        };
      })
      .sort((a, b) => b.successDifference - a.successDifference)
      .slice(0, 10);
  }, [ciudades]);

  // Generate optimization report summary
  const reportSummary = useMemo(() => {
    const highPriority = optimizations.filter(o => o.priority === 'ALTA');
    const mediumPriority = optimizations.filter(o => o.priority === 'MEDIA');

    const totalTimeReduction = optimizations.reduce((sum, o) => sum + o.timeImprovement, 0);
    const avgSuccessImprovement = optimizations.length > 0
      ? optimizations.reduce((sum, o) => sum + (o.recommendedSuccessRate - o.currentSuccessRate), 0) / optimizations.length
      : 0;

    // Carrier rankings
    const carrierScores: Record<string, { wins: number; losses: number; avgScore: number; count: number }> = {};
    ciudades.forEach(c => {
      const key = c.transportadora.toUpperCase();
      if (!carrierScores[key]) carrierScores[key] = { wins: 0, losses: 0, avgScore: 0, count: 0 };
      carrierScores[key].avgScore += c.score;
      carrierScores[key].count++;
    });

    Object.keys(carrierScores).forEach(k => {
      carrierScores[k].avgScore = carrierScores[k].avgScore / carrierScores[k].count;
    });

    optimizations.forEach(o => {
      const recKey = o.recommendedCarrier.toUpperCase();
      const currKey = o.currentCarrier.toUpperCase();
      if (carrierScores[recKey]) carrierScores[recKey].wins++;
      if (carrierScores[currKey]) carrierScores[currKey].losses++;
    });

    const carrierRanking = Object.entries(carrierScores)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.avgScore - a.avgScore);

    return {
      totalOptimizations: optimizations.length,
      highPriority: highPriority.length,
      mediumPriority: mediumPriority.length,
      totalTimeReduction,
      avgSuccessImprovement,
      carrierRanking,
    };
  }, [optimizations, ciudades]);

  const priorityColors = {
    ALTA: { bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800', text: 'text-red-700 dark:text-red-400', badge: 'bg-red-500' },
    MEDIA: { bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800', text: 'text-amber-700 dark:text-amber-400', badge: 'bg-amber-500' },
    BAJA: { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', text: 'text-blue-700 dark:text-blue-400', badge: 'bg-blue-500' },
  };

  if (optimizations.length === 0 && carrierComparisons.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-700 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-6 py-4 text-white">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <Route className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              Optimización de Rutas Sugeridas
              <Brain className="w-5 h-5 text-yellow-300" />
            </h3>
            <p className="text-blue-100 text-sm">
              Análisis comparativo de transportadoras por ciudad basado en rendimiento histórico
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-navy-700">
        <button
          onClick={() => setExpandedSection(expandedSection === 'optimizations' ? null : 'optimizations')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
            expandedSection === 'optimizations'
              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-b-2 border-blue-500'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-navy-800'
          }`}
        >
          <Lightbulb className="w-4 h-4" />
          Sugerencias ({optimizations.length})
        </button>
        <button
          onClick={() => setExpandedSection(expandedSection === 'comparisons' ? null : 'comparisons')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
            expandedSection === 'comparisons'
              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-b-2 border-blue-500'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-navy-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Comparativa
        </button>
        <button
          onClick={() => setExpandedSection(expandedSection === 'report' ? null : 'report')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
            expandedSection === 'report'
              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-b-2 border-blue-500'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-navy-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          Reporte
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Optimizations List */}
        {expandedSection === 'optimizations' && (
          <div className="space-y-4">
            {optimizations.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <p className="text-slate-600 dark:text-slate-400 font-medium">
                  ¡Tus rutas están optimizadas!
                </p>
                <p className="text-sm text-slate-400">
                  No se detectaron oportunidades significativas de mejora
                </p>
              </div>
            ) : (
              <>
                <p className="text-sm text-slate-500 mb-4">
                  Se detectaron <span className="font-bold text-blue-600">{optimizations.length}</span> oportunidades de optimización basadas en el rendimiento histórico de transportadoras
                </p>

                {optimizations.map((opt, idx) => {
                  const colors = priorityColors[opt.priority];
                  return (
                    <div
                      key={`${opt.ciudad}-${idx}`}
                      className={`${colors.bg} ${colors.border} border rounded-xl p-4`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-5 h-5 text-slate-500" />
                          <h4 className="font-bold text-slate-800 dark:text-white">{opt.ciudad}</h4>
                          <span className={`${colors.badge} text-white text-xs font-bold px-2 py-0.5 rounded-full`}>
                            {opt.priority}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-emerald-600 font-bold text-lg">+{opt.improvement}pts</p>
                          <p className="text-xs text-slate-500">mejora score</p>
                        </div>
                      </div>

                      {/* Current vs Recommended */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        <div className="bg-red-50 dark:bg-red-900/10 rounded-lg p-3 border border-red-200 dark:border-red-800">
                          <div className="flex items-center gap-2 mb-2">
                            <XCircle className="w-4 h-4 text-red-500" />
                            <span className="text-xs font-bold text-red-700 dark:text-red-400">ACTUAL</span>
                          </div>
                          <p className="font-bold text-slate-800 dark:text-white">{opt.currentCarrier}</p>
                          <div className="flex items-center gap-3 mt-2 text-sm">
                            <span className="text-red-600">Score: {opt.currentScore}</span>
                            <span className="text-slate-500">|</span>
                            <span className="text-slate-600">{opt.currentSuccessRate.toFixed(0)}% éxito</span>
                            <span className="text-slate-500">|</span>
                            <span className="text-slate-600">{opt.currentTime}d</span>
                          </div>
                        </div>

                        <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-lg p-3 border border-emerald-200 dark:border-emerald-800">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">RECOMENDADO</span>
                          </div>
                          <p className="font-bold text-slate-800 dark:text-white">{opt.recommendedCarrier}</p>
                          <div className="flex items-center gap-3 mt-2 text-sm">
                            <span className="text-emerald-600 font-bold">Score: {opt.recommendedScore}</span>
                            <span className="text-slate-500">|</span>
                            <span className="text-slate-600">{opt.recommendedSuccessRate.toFixed(0)}% éxito</span>
                            <span className="text-slate-500">|</span>
                            <span className="text-slate-600">{opt.recommendedTime}d</span>
                          </div>
                        </div>
                      </div>

                      {/* Benefits */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {opt.timeImprovement > 0 && (
                          <span className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-medium">
                            <Clock className="w-3 h-3" />
                            {opt.timeImprovement.toFixed(1)} días más rápido
                          </span>
                        )}
                        <span className="flex items-center gap-1 px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-medium">
                          <TrendingUp className="w-3 h-3" />
                          +{(opt.recommendedSuccessRate - opt.currentSuccessRate).toFixed(0)}% efectividad
                        </span>
                      </div>

                      {/* AI Recommendation */}
                      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
                        <div className="flex items-start gap-2">
                          <Brain className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-purple-800 dark:text-purple-200">{opt.recommendation}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}

        {/* Carrier Comparisons */}
        {expandedSection === 'comparisons' && (
          <div className="space-y-4">
            <p className="text-sm text-slate-500 mb-4">
              Comparativa de rendimiento entre transportadoras para las mismas ciudades
            </p>

            {carrierComparisons.map((comp, idx) => (
              <div key={`${comp.city}-${idx}`} className="bg-slate-50 dark:bg-navy-950 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-500" />
                    {comp.city}
                  </h4>
                  <span className="text-xs text-slate-500">
                    {comp.carriers.length} transportadoras
                  </span>
                </div>

                <div className="space-y-2">
                  {comp.carriers.map((carrier, cIdx) => {
                    const isFirst = cIdx === 0;
                    const isLast = cIdx === comp.carriers.length - 1;

                    return (
                      <div
                        key={carrier.name}
                        className={`flex items-center justify-between p-2 rounded-lg ${
                          isFirst
                            ? 'bg-emerald-100 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800'
                            : isLast
                              ? 'bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                              : 'bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {isFirst && <Award className="w-4 h-4 text-emerald-600" />}
                          {isLast && <AlertTriangle className="w-4 h-4 text-red-500" />}
                          {!isFirst && !isLast && <Truck className="w-4 h-4 text-slate-400" />}
                          <div>
                            <p className={`font-bold text-sm ${isFirst ? 'text-emerald-700' : isLast ? 'text-red-700' : 'text-slate-700'} dark:text-white`}>
                              {carrier.name}
                            </p>
                            <p className="text-xs text-slate-500">{carrier.total} envíos</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="text-center">
                            <p className={`font-bold ${carrier.score >= 70 ? 'text-emerald-600' : carrier.score >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                              {carrier.score}
                            </p>
                            <p className="text-[10px] text-slate-400">Score</p>
                          </div>
                          <div className="text-center">
                            <p className="font-medium text-slate-700 dark:text-slate-300">{carrier.successRate.toFixed(0)}%</p>
                            <p className="text-[10px] text-slate-400">Éxito</p>
                          </div>
                          <div className="text-center">
                            <p className="font-medium text-slate-700 dark:text-slate-300">{carrier.time}d</p>
                            <p className="text-[10px] text-slate-400">Tiempo</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Summary */}
                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-navy-700 flex items-center justify-between text-xs text-slate-500">
                  <span>
                    <strong className="text-emerald-600">{comp.bestCarrier}</strong> es {comp.speedDifference.toFixed(1)}d más rápido y {comp.successDifference.toFixed(0)}% más efectivo
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary Report */}
        {expandedSection === 'report' && (
          <div className="space-y-4">
            <div className="text-center py-4">
              <h4 className="font-bold text-lg text-slate-800 dark:text-white mb-2">
                Reporte de Optimización Logística
              </h4>
              <p className="text-sm text-slate-500">
                Generado automáticamente basado en {ciudades.length} rutas analizadas
              </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-blue-600">{reportSummary.totalOptimizations}</p>
                <p className="text-xs text-slate-500">Optimizaciones</p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-red-600">{reportSummary.highPriority}</p>
                <p className="text-xs text-slate-500">Prioridad Alta</p>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-emerald-600">+{reportSummary.avgSuccessImprovement.toFixed(1)}%</p>
                <p className="text-xs text-slate-500">Mejora Promedio</p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-purple-600">-{reportSummary.totalTimeReduction.toFixed(1)}d</p>
                <p className="text-xs text-slate-500">Tiempo Total</p>
              </div>
            </div>

            {/* Carrier Ranking */}
            <div className="bg-slate-50 dark:bg-navy-950 rounded-xl p-4">
              <h5 className="font-bold text-slate-700 dark:text-white mb-3 flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500" />
                Ranking de Transportadoras por Desempeño
              </h5>
              <div className="space-y-2">
                {reportSummary.carrierRanking.map((carrier, idx) => (
                  <div key={carrier.name} className="flex items-center justify-between p-2 bg-white dark:bg-navy-900 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                        idx === 0 ? 'bg-yellow-500' :
                        idx === 1 ? 'bg-slate-400' :
                        idx === 2 ? 'bg-amber-600' :
                        'bg-slate-300'
                      }`}>
                        {idx + 1}
                      </span>
                      <div>
                        <p className="font-bold text-slate-800 dark:text-white">{carrier.name}</p>
                        <p className="text-xs text-slate-500">{carrier.count} rutas analizadas</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className={`font-bold ${carrier.avgScore >= 70 ? 'text-emerald-600' : carrier.avgScore >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                          {carrier.avgScore.toFixed(0)}
                        </p>
                        <p className="text-[10px] text-slate-400">Score Prom.</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-emerald-600">{carrier.wins}</p>
                        <p className="text-[10px] text-slate-400">Recomendada</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-red-600">{carrier.losses}</p>
                        <p className="text-[10px] text-slate-400">A mejorar</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Summary */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
              <div className="flex items-start gap-3">
                <Brain className="w-6 h-6 text-purple-600 mt-0.5" />
                <div>
                  <h5 className="font-bold text-purple-700 dark:text-purple-300 mb-2">Resumen IA</h5>
                  <p className="text-sm text-purple-800 dark:text-purple-200">
                    {reportSummary.totalOptimizations > 0
                      ? `Se identificaron ${reportSummary.totalOptimizations} oportunidades de optimización. Implementando estas sugerencias podrías mejorar la tasa de éxito promedio en un ${reportSummary.avgSuccessImprovement.toFixed(1)}% y reducir el tiempo de entrega total en ${reportSummary.totalTimeReduction.toFixed(1)} días. ${reportSummary.highPriority > 0 ? `Las ${reportSummary.highPriority} optimizaciones de alta prioridad deberían implementarse primero para maximizar el impacto.` : ''}`
                      : 'Tu distribución de transportadoras por ruta está bien optimizada. Continúa monitoreando para detectar cambios en el rendimiento.'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function to generate optimization recommendation
const generateOptimizationRecommendation = (
  city: string,
  current: CiudadSemaforo & { score: number },
  recommended: CiudadSemaforo & { score: number }
): string => {
  const timeDiff = current.tiempoPromedio - recommended.tiempoPromedio;
  const successDiff = recommended.tasaExito - current.tasaExito;

  let rec = `Para envíos a ${city}, considera usar ${recommended.transportadora} en lugar de ${current.transportadora}. `;

  if (timeDiff > 0 && successDiff > 0) {
    rec += `Esto reduciría el tiempo de entrega en ${timeDiff.toFixed(1)} días y aumentaría la efectividad en ${successDiff.toFixed(0)}%. `;
  } else if (timeDiff > 0) {
    rec += `Esto reduciría el tiempo de entrega en ${timeDiff.toFixed(1)} días. `;
  } else if (successDiff > 0) {
    rec += `Esto aumentaría la efectividad en ${successDiff.toFixed(0)}%. `;
  }

  if (current.tasaDevolucion > 20) {
    rec += `Actualmente ${current.transportadora} tiene una tasa de devolución del ${current.tasaDevolucion.toFixed(0)}% en esta ruta.`;
  }

  return rec;
};

// Main component
export const SemaforoTabNew: React.FC<SemaforoTabNewProps> = ({ onDataLoaded }) => {
  const [excelData, setExcelData] = useState<SemaforoExcelData | null>(null);
  const [ciudades, setCiudades] = useState<(CiudadSemaforo & { score: number; factors: SemaforoScoreResult['factors'] })[]>([]);
  const [lastUpload, setLastUpload] = useState<Date | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterSemaforo, setFilterSemaforo] = useState<SemaforoColor | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState<'score' | 'tasaExito' | 'total' | 'tiempoPromedio'>('score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [selectedCiudad, setSelectedCiudad] = useState<(CiudadSemaforo & { score: number; factors: SemaforoScoreResult['factors'] }) | null>(null);
  const [showTable, setShowTable] = useState(true);
  const [searchedCity, setSearchedCity] = useState<string | null>(null);

  // Autocompletado de ciudades
  const [showSugerencias, setShowSugerencias] = useState(false);
  const sugerenciasCiudad = useMemo(() => {
    if (searchQuery.length < 2) return [];
    return buscarCiudades(searchQuery, 8);
  }, [searchQuery]);

  const handleSelectCiudadSugerencia = (ciudad: CiudadColombia) => {
    setSearchQuery(ciudad.nombre);
    setSearchedCity(ciudad.nombre);
    setShowSugerencias(false);
  };

  // Resultados de búsqueda de ciudad específica
  const citySearchResults = useMemo(() => {
    if (!searchedCity) return [];
    return ciudades.filter(c => c.ciudad.toLowerCase() === searchedCity.toLowerCase());
  }, [ciudades, searchedCity]);

  const clearCitySearch = () => {
    setSearchedCity(null);
    setSearchQuery('');
  };

  // Load saved data on mount
  useEffect(() => {
    const saved = loadTabData<{
      data: SemaforoExcelData;
      uploadDate: string;
      fileName: string;
    } | null>(STORAGE_KEYS.SEMAFORO, null);

    if (saved) {
      setExcelData(saved.data);
      setLastUpload(new Date(saved.uploadDate));
      setFileName(saved.fileName);

      const processed = procesarExcelConScore(saved.data);
      setCiudades(processed);
    }
  }, []);

  // Handle Excel data loaded
  const handleDataLoaded = (data: SemaforoExcelData) => {
    setExcelData(data);
    setLastUpload(new Date());
    setFileName('datos_cargados.xlsx');

    // Process data with score calculation
    const processed = procesarExcelConScore(data);
    setCiudades(processed);

    // Save to localStorage
    saveTabData(STORAGE_KEYS.SEMAFORO, {
      data,
      uploadDate: new Date().toISOString(),
      fileName: 'datos_cargados.xlsx',
    });

    // Notify parent
    if (onDataLoaded) {
      onDataLoaded(data);
    }
  };

  // Count by semaforo color
  const counts = useMemo(() => {
    const c = { VERDE: 0, AMARILLO: 0, NARANJA: 0, ROJO: 0, total: 0 };
    ciudades.forEach((ciudad) => {
      c[ciudad.semaforo]++;
      c.total++;
    });
    return c;
  }, [ciudades]);

  // Filter and sort cities
  const filteredCiudades = useMemo(() => {
    let result = ciudades.filter((c) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !c.ciudad.toLowerCase().includes(query) &&
          !c.transportadora.toLowerCase().includes(query)
        ) {
          return false;
        }
      }
      if (filterSemaforo !== 'ALL' && c.semaforo !== filterSemaforo) {
        return false;
      }
      return true;
    });

    // Sort
    result.sort((a, b) => {
      let valueA: number, valueB: number;
      switch (sortBy) {
        case 'score':
          valueA = a.score;
          valueB = b.score;
          break;
        case 'tasaExito':
          valueA = a.tasaExito;
          valueB = b.tasaExito;
          break;
        case 'total':
          valueA = a.total;
          valueB = b.total;
          break;
        case 'tiempoPromedio':
          valueA = a.tiempoPromedio;
          valueB = b.tiempoPromedio;
          break;
        default:
          valueA = a.score;
          valueB = b.score;
      }
      return sortOrder === 'desc' ? valueB - valueA : valueA - valueB;
    });

    return result;
  }, [ciudades, searchQuery, filterSemaforo, sortBy, sortOrder]);

  // Clear data
  const handleClearData = () => {
    if (confirm('¿Estás seguro de que deseas borrar los datos cargados?')) {
      setExcelData(null);
      setCiudades([]);
      setLastUpload(null);
      setFileName(null);
      localStorage.removeItem(STORAGE_KEYS.SEMAFORO);
    }
  };

  // Toggle sort
  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  // Color config
  const semaforoConfig = {
    VERDE: { emoji: '🟢', label: 'Recomendado', bg: 'bg-emerald-500', light: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400' },
    AMARILLO: { emoji: '🟡', label: 'Con reservas', bg: 'bg-yellow-500', light: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400' },
    NARANJA: { emoji: '🟠', label: 'Alerta', bg: 'bg-orange-500', light: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400' },
    ROJO: { emoji: '🔴', label: 'No recomendado', bg: 'bg-red-500', light: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400' },
  };

  // If no data, show upload screen
  if (!excelData) {
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Activity className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
            Semáforo de Ciudades
          </h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Sistema inteligente de clasificación de rutas logísticas basado en datos históricos masivos
          </p>
        </div>

        <ExcelUploader pestaña="semaforo" onDataLoaded={handleDataLoaded} />

        {/* Feature highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="bg-white dark:bg-navy-900 rounded-xl p-4 border border-slate-200 dark:border-navy-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                <Target className="w-5 h-5 text-emerald-600" />
              </div>
              <h4 className="font-bold text-slate-700 dark:text-white">Semáforo Score</h4>
            </div>
            <p className="text-sm text-slate-500">
              Algoritmo avanzado que pondera tasa de éxito, velocidad, volumen y consistencia
            </p>
          </div>

          <div className="bg-white dark:bg-navy-900 rounded-xl p-4 border border-slate-200 dark:border-navy-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Bot className="w-5 h-5 text-purple-600" />
              </div>
              <h4 className="font-bold text-slate-700 dark:text-white">Insights IA</h4>
            </div>
            <p className="text-sm text-slate-500">
              Recomendaciones automáticas basadas en análisis de patrones históricos
            </p>
          </div>

          <div className="bg-white dark:bg-navy-900 rounded-xl p-4 border border-slate-200 dark:border-navy-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
              <h4 className="font-bold text-slate-700 dark:text-white">Protección</h4>
            </div>
            <p className="text-sm text-slate-500">
              Identifica rutas problemáticas para evitar pérdidas por devoluciones
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Data loaded view
  return (
    <div className="space-y-6">
      {/* Header con ayuda contextual */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 rounded-2xl p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Activity className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                Semáforo de Ciudades
                <Sparkles className="w-5 h-5 text-yellow-300" />
                <HelpTooltip
                  title={semaforoHelp.general.title}
                  content={semaforoHelp.general.content}
                  tips={semaforoHelp.general.tips}
                  position="bottom"
                >
                  <HelpCircle className="w-4 h-4 text-white/70 hover:text-white cursor-help transition-colors" />
                </HelpTooltip>
              </h2>
              <div className="flex items-center gap-3 text-amber-100 text-sm mt-1">
                <span className="flex items-center gap-1">
                  <FileSpreadsheet className="w-4 h-4" />
                  {fileName}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {lastUpload?.toLocaleDateString('es-CO')}
                </span>
                <span className="flex items-center gap-1">
                  <Package className="w-4 h-4" />
                  {counts.total} rutas
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setExcelData(null)}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors text-sm font-bold"
            >
              <RefreshCw className="w-4 h-4" />
              Nuevo Excel
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <button
          onClick={() => setFilterSemaforo('ALL')}
          className={`p-4 rounded-xl border transition-all text-left ${
            filterSemaforo === 'ALL'
              ? 'bg-slate-100 dark:bg-slate-800 border-slate-400 ring-2 ring-slate-500'
              : 'bg-white dark:bg-navy-900 border-slate-200 dark:border-navy-700 hover:bg-slate-50'
          }`}
        >
          <p className="text-3xl font-bold text-slate-700 dark:text-white">{counts.total}</p>
          <p className="text-sm text-slate-500">Total Rutas</p>
        </button>

        {(['VERDE', 'AMARILLO', 'NARANJA', 'ROJO'] as const).map((color) => {
          const config = semaforoConfig[color];
          return (
            <button
              key={color}
              onClick={() => setFilterSemaforo(filterSemaforo === color ? 'ALL' : color)}
              className={`p-4 rounded-xl border transition-all text-left ${
                filterSemaforo === color
                  ? `${config.light} border-current ring-2`
                  : `bg-white dark:bg-navy-900 border-slate-200 dark:border-navy-700 hover:${config.light}`
              }`}
            >
              <p className={`text-3xl font-bold ${config.text}`}>{counts[color]}</p>
              <p className="text-sm text-slate-500 flex items-center gap-1">
                {config.emoji} {config.label}
              </p>
            </button>
          );
        })}
      </div>

      {/* Legend con ayuda */}
      <div className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-700 p-4">
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <span className="font-bold text-slate-700 dark:text-white flex items-center gap-2">
            LEYENDA:
            <HelpTooltip
              title="Sistema de Puntuación Semáforo"
              content="El Score se calcula considerando múltiples factores de rendimiento logístico."
              tips={[
                'Tasa de Entrega (40%): Porcentaje de entregas exitosas',
                'Velocidad (30%): Tiempo promedio de entrega',
                'Volumen (20%): Cantidad de envíos históricos',
                'Consistencia (10%): Estabilidad del rendimiento'
              ]}
              position="right"
            >
              <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-amber-500 cursor-help" />
            </HelpTooltip>
          </span>
          <span className="flex items-center gap-1.5">🟢 <span className="text-slate-600 dark:text-slate-300">Score ≥75 (Excelente)</span></span>
          <span className="flex items-center gap-1.5">🟡 <span className="text-slate-600 dark:text-slate-300">Score 65-74 (Bueno)</span></span>
          <span className="flex items-center gap-1.5">🟠 <span className="text-slate-600 dark:text-slate-300">Score 50-64 (Alerta)</span></span>
          <span className="flex items-center gap-1.5">🔴 <span className="text-slate-600 dark:text-slate-300">Score &lt;50 (Crítico)</span></span>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-700 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 z-10" />
            <input
              type="text"
              placeholder="Buscar ciudad o transportadora..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSugerencias(true);
              }}
              onFocus={() => setShowSugerencias(true)}
              onBlur={() => setTimeout(() => setShowSugerencias(false), 200)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />

            {/* Autocompletado de ciudades de Colombia */}
            {showSugerencias && sugerenciasCiudad.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto">
                <div className="px-3 py-2 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-b border-amber-200 dark:border-amber-800">
                  <p className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    Ciudades de Colombia
                  </p>
                </div>
                {sugerenciasCiudad.map((ciudad, idx) => (
                  <button
                    key={`${ciudad.nombre}-${ciudad.departamento}-${idx}`}
                    onClick={() => handleSelectCiudadSugerencia(ciudad)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors border-b border-slate-100 dark:border-navy-800 last:border-b-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        ciudad.esCapital
                          ? 'bg-amber-100 dark:bg-amber-900/30'
                          : 'bg-slate-100 dark:bg-slate-700'
                      }`}>
                        <MapPin className={`w-4 h-4 ${ciudad.esCapital ? 'text-amber-500' : 'text-slate-400'}`} />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-slate-800 dark:text-white text-sm">
                          {ciudad.nombre}
                          {ciudad.esCapital && (
                            <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded">
                              CAPITAL
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-slate-500">{ciudad.departamento}</p>
                      </div>
                    </div>
                    {ciudad.poblacion && (
                      <span className="text-xs text-slate-400">
                        {ciudad.poblacion >= 1000000
                          ? `${(ciudad.poblacion / 1000000).toFixed(1)}M`
                          : ciudad.poblacion >= 1000
                            ? `${(ciudad.poblacion / 1000).toFixed(0)}K`
                            : ciudad.poblacion} hab.
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-4 py-2.5 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="score">Ordenar por Score</option>
              <option value="tasaExito">Ordenar por Tasa Éxito</option>
              <option value="total">Ordenar por Volumen</option>
              <option value="tiempoPromedio">Ordenar por Tiempo</option>
            </select>

            <button
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="p-2.5 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
            >
              {sortOrder === 'desc' ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
            </button>

            {filterSemaforo !== 'ALL' && (
              <button
                onClick={() => setFilterSemaforo('ALL')}
                className="px-4 py-2.5 bg-slate-100 dark:bg-navy-800 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors"
              >
                Mostrar todas
              </button>
            )}
          </div>
        </div>
      </div>

      {/* City Search Results - Mostrar cuando hay ciudad seleccionada */}
      {searchedCity && citySearchResults.length > 0 && (
        <CitySearchResults
          ciudad={searchedCity}
          resultados={citySearchResults}
          onClear={clearCitySearch}
        />
      )}

      {/* Results Table - Ocultar si hay búsqueda de ciudad activa */}
      {!searchedCity && (
      <div className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-navy-950">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">Ciudad</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">Transportadora</th>
                <th
                  className="px-4 py-3 text-center text-xs font-bold uppercase text-slate-500 cursor-pointer hover:text-amber-600"
                  onClick={() => handleSort('score')}
                >
                  <span className="flex items-center justify-center gap-1">
                    Score
                    <ArrowUpDown className="w-3 h-3" />
                  </span>
                </th>
                <th
                  className="px-4 py-3 text-center text-xs font-bold uppercase text-slate-500 cursor-pointer hover:text-amber-600"
                  onClick={() => handleSort('tasaExito')}
                >
                  <span className="flex items-center justify-center gap-1">
                    Tasa Éxito
                    <ArrowUpDown className="w-3 h-3" />
                  </span>
                </th>
                <th
                  className="px-4 py-3 text-center text-xs font-bold uppercase text-slate-500 cursor-pointer hover:text-amber-600"
                  onClick={() => handleSort('tiempoPromedio')}
                >
                  <span className="flex items-center justify-center gap-1">
                    Tiempo
                    <ArrowUpDown className="w-3 h-3" />
                  </span>
                </th>
                <th
                  className="px-4 py-3 text-center text-xs font-bold uppercase text-slate-500 cursor-pointer hover:text-amber-600"
                  onClick={() => handleSort('total')}
                >
                  <span className="flex items-center justify-center gap-1">
                    Envíos
                    <ArrowUpDown className="w-3 h-3" />
                  </span>
                </th>
                <th className="px-4 py-3 text-center text-xs font-bold uppercase text-slate-500">Estado</th>
                <th className="px-4 py-3 text-center text-xs font-bold uppercase text-slate-500">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
              {filteredCiudades.map((ciudad, idx) => {
                const config = semaforoConfig[ciudad.semaforo];
                return (
                  <tr
                    key={`${ciudad.ciudad}-${ciudad.transportadora}-${idx}`}
                    className={`${config.light} hover:shadow-md transition-all`}
                  >
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-800 dark:text-white">{ciudad.ciudad}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {ciudad.transportadora}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center justify-center w-12 h-8 ${config.bg} text-white font-bold rounded-lg text-sm`}>
                        {ciudad.score}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-bold ${config.text}`}>{ciudad.tasaExito.toFixed(0)}%</span>
                    </td>
                    <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-400">
                      {ciudad.tiempoPromedio}d
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-slate-600 dark:text-slate-400">{ciudad.total}</span>
                      {ciudad.total < 10 && (
                        <span className="text-orange-500 text-xs ml-1" title="Muestra limitada">⚠️</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="flex items-center justify-center gap-1">
                        {config.emoji}
                        <span className={`text-xs font-bold ${config.text}`}>{config.label}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setSelectedCiudad(ciudad)}
                        className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        Ver
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredCiudades.length === 0 && (
          <div className="p-12 text-center">
            <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No se encontraron rutas con los filtros aplicados</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterSemaforo('ALL');
              }}
              className="mt-4 text-amber-500 hover:text-amber-600 font-medium"
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </div>
      )}

      {/* AI Insights Panel */}
      {ciudades.length > 0 && !searchedCity && <InsightsPanel ciudades={ciudades} />}

      {/* Route Optimization Panel - Solo visible cuando no hay búsqueda */}
      {ciudades.length > 0 && !searchedCity && <RouteOptimizationPanel ciudades={ciudades} />}

      {/* City Detail Modal */}
      {selectedCiudad && (
        <CityDetailModal
          ciudad={selectedCiudad}
          onClose={() => setSelectedCiudad(null)}
        />
      )}
    </div>
  );
};

export default SemaforoTabNew;
