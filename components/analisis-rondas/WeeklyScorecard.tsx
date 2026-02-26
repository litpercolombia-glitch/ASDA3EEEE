/**
 * Scorecard Semanal por Operador - Tipo Amazon DSP
 * Muestra métricas de la semana + tier + discrepancias + tendencia
 */

import React, { useState, useMemo } from 'react';
import {
  Trophy,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle,
  Clock,
  Package,
  Target,
  Zap,
  FileText,
  ChevronDown,
  ChevronUp,
  Camera,
  MessageSquare,
  Flag,
  Eye,
} from 'lucide-react';
import { MetricasGlobales, MetricasUsuario } from '../../types/analisis-rondas';
import { getOperadores, getScorecardTier, SCORECARD_TIERS, RONDA_PRESETS, METRICAS_AVANZADAS } from '../../constants/analisis-rondas';
import {
  RondaClosure,
  getClosures,
  getClosuresByOperator,
  getOperatorTimeline,
  TimelineEntry,
} from '../../services/rondaReportBridgeService';

interface WeeklyScorecardProps {
  datos: MetricasGlobales | null;
}

export const WeeklyScorecard: React.FC<WeeklyScorecardProps> = ({ datos }) => {
  const [expandedOp, setExpandedOp] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'scorecard' | 'timeline'>('scorecard');

  const operadores = getOperadores();
  const allClosures = getClosures();

  // Build scorecard data per operator
  const scorecards = useMemo(() => {
    if (!datos) return [];

    return datos.ranking.map(metric => {
      const op = operadores.find(o => o.nombre.toUpperCase() === metric.usuario.toUpperCase());
      const closures = getClosuresByOperator(metric.usuario);
      const tier = getScorecardTier(metric.tasaExito);
      const timeline = getOperatorTimeline(metric.usuario);

      // Count discrepancies
      const totalDisc = closures.reduce((sum, c) => sum + c.discrepancies.length, 0);
      const hasUnreviewed = closures.some(c => c.status === 'submitted');

      // Calculate closure compliance (has closure for this period?)
      const hasClosure = closures.length > 0;

      // Efficiency from advanced metrics
      const eficiencia = metric.avanzadas?.eficiencia || 0;

      // Guides per hour vs expected
      const guiasHoraRatio = metric.guiasPorHora / METRICAS_AVANZADAS.GUIAS_POR_HORA_ESPERADAS;

      return {
        metric,
        op,
        closures,
        tier,
        timeline,
        totalDisc,
        hasUnreviewed,
        hasClosure,
        eficiencia,
        guiasHoraRatio,
      };
    });
  }, [datos, operadores]);

  if (!datos) {
    return (
      <div className="text-center py-12 text-slate-400 dark:text-slate-500">
        <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Carga datos CSV para ver el scorecard semanal</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" />
          Scorecard Semanal - Tipo Amazon DSP
        </h3>
        <div className="flex gap-1 bg-slate-100 dark:bg-navy-700 rounded-lg p-0.5">
          <button
            onClick={() => setViewMode('scorecard')}
            className={`px-3 py-1 text-xs rounded-md ${viewMode === 'scorecard' ? 'bg-white dark:bg-navy-600 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500'}`}
          >
            Scorecard
          </button>
          <button
            onClick={() => setViewMode('timeline')}
            className={`px-3 py-1 text-xs rounded-md ${viewMode === 'timeline' ? 'bg-white dark:bg-navy-600 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500'}`}
          >
            Timeline
          </button>
        </div>
      </div>

      {/* Tier legend */}
      <div className="flex flex-wrap gap-2">
        {Object.values(SCORECARD_TIERS).map(t => (
          <div key={t.label} className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span>{t.icon}</span>
            <span>{t.label} ({'>='}{t.minTasa}%)</span>
          </div>
        ))}
      </div>

      {/* Scorecards */}
      {viewMode === 'scorecard' ? (
        <div className="space-y-3">
          {scorecards.map(({ metric, op, closures, tier, totalDisc, hasUnreviewed, hasClosure, eficiencia, guiasHoraRatio }, idx) => (
            <div
              key={metric.usuario}
              className="bg-white dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-navy-700 overflow-hidden"
            >
              {/* Main row */}
              <button
                onClick={() => setExpandedOp(expandedOp === metric.usuario ? null : metric.usuario)}
                className="w-full p-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-navy-700/50 transition-colors"
              >
                {/* Rank */}
                <div className="w-8 text-center">
                  {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : (
                    <span className="text-sm font-bold text-slate-400">#{idx + 1}</span>
                  )}
                </div>

                {/* Avatar + Name */}
                <div className="flex items-center gap-3 min-w-[120px]">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                    style={{ backgroundColor: `${op?.color || '#6366f1'}20` }}
                  >
                    {op?.icono || '👤'}
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-slate-800 dark:text-white text-sm">{metric.usuario}</p>
                    <p className="text-xs" style={{ color: tier.color }}>{tier.icon} {tier.label}</p>
                  </div>
                </div>

                {/* Metrics */}
                <div className="flex-1 grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="text-center">
                    <p className="text-lg font-bold" style={{ color: tier.color }}>{metric.tasaExito.toFixed(1)}%</p>
                    <p className="text-[10px] text-slate-400">Tasa Éxito</p>
                  </div>
                  <div className="text-center hidden sm:block">
                    <p className="text-lg font-bold text-slate-700 dark:text-slate-300">{eficiencia.toFixed(0)}%</p>
                    <p className="text-[10px] text-slate-400">Eficiencia</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-slate-700 dark:text-slate-300">
                      {metric.guiasRealizadas}/{metric.totalGuiasIniciales}
                    </p>
                    <p className="text-[10px] text-slate-400">Guías</p>
                  </div>
                  <div className="text-center hidden sm:block">
                    <p className="text-lg font-bold text-slate-700 dark:text-slate-300">{metric.totalRondas}</p>
                    <p className="text-[10px] text-slate-400">Rondas</p>
                  </div>
                  <div className="text-center hidden sm:block">
                    <div className="flex items-center justify-center gap-1">
                      {hasClosure ? (
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                      )}
                      {totalDisc > 0 && (
                        <span className="px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded text-[10px] font-bold">
                          {totalDisc} disc.
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400">Cierre</p>
                  </div>
                </div>

                {/* Trend */}
                <div className="flex items-center gap-1">
                  {metric.tendencia === 'subiendo' && <TrendingUp className="w-4 h-4 text-emerald-500" />}
                  {metric.tendencia === 'bajando' && <TrendingDown className="w-4 h-4 text-red-500" />}
                  {metric.tendencia === 'estable' && <Minus className="w-4 h-4 text-slate-400" />}
                </div>

                <div>
                  {expandedOp === metric.usuario ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </div>
              </button>

              {/* Expanded detail */}
              {expandedOp === metric.usuario && (
                <div className="border-t border-slate-200 dark:border-navy-700 p-4 bg-slate-50 dark:bg-navy-900/50">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Left: CSV Metrics */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1">
                        <FileText className="w-3 h-3" /> DATOS CSV (Automáticos)
                      </h4>
                      <div className="space-y-1.5 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Guías Realizadas:</span>
                          <span className="font-medium text-slate-700 dark:text-slate-300">{metric.guiasRealizadas}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Canceladas:</span>
                          <span className="font-medium text-red-600">{metric.canceladas}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Pendientes:</span>
                          <span className="font-medium text-amber-600">{metric.pendientes}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Novedades:</span>
                          <span className="font-medium text-orange-600">{metric.novedades}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Guías/Hora:</span>
                          <span className={`font-medium ${guiasHoraRatio >= 1 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {metric.guiasPorHora.toFixed(1)} (meta: {METRICAS_AVANZADAS.GUIAS_POR_HORA_ESPERADAS})
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Tiempo Total:</span>
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {Math.floor(metric.tiempoTotal / 60)}h {Math.round(metric.tiempoTotal % 60)}m
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Closure data */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1">
                        <Camera className="w-3 h-3" /> CIERRE DE RONDA (Operador)
                      </h4>
                      {closures.length > 0 ? (
                        <div className="space-y-2">
                          {closures.slice(0, 3).map(c => (
                            <div key={c.id} className="p-2 bg-white dark:bg-navy-800 rounded-lg border border-slate-200 dark:border-navy-700">
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-slate-500">{c.date}</span>
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                  c.status === 'reviewed' ? 'bg-emerald-100 text-emerald-700' :
                                  c.status === 'flagged' ? 'bg-red-100 text-red-700' :
                                  'bg-blue-100 text-blue-700'
                                }`}>
                                  {c.status === 'reviewed' ? 'Revisado' : c.status === 'flagged' ? 'Flagged' : 'Pendiente'}
                                </span>
                              </div>
                              <div className="text-xs text-slate-600 dark:text-slate-400">
                                Reportó: {c.selfReportedRealizadas} realizadas, {c.selfReportedCanceladas} cancel.
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                {c.evidence.length > 0 && (
                                  <span className="text-[10px] text-purple-500 flex items-center gap-0.5">
                                    <Camera className="w-3 h-3" /> {c.evidence.filter(e => e.type === 'photo').length} fotos
                                  </span>
                                )}
                                {c.discrepancies.length > 0 && (
                                  <span className="text-[10px] text-red-500 flex items-center gap-0.5">
                                    <AlertTriangle className="w-3 h-3" /> {c.discrepancies.length} discrepancias
                                  </span>
                                )}
                                {c.generalComment && (
                                  <span className="text-[10px] text-blue-500 flex items-center gap-0.5">
                                    <MessageSquare className="w-3 h-3" /> Comentario
                                  </span>
                                )}
                              </div>

                              {/* Discrepancies detail */}
                              {c.discrepancies.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  {c.discrepancies.map(d => (
                                    <div key={d.id} className={`text-[10px] p-1.5 rounded ${
                                      d.severity === 'high' ? 'bg-red-50 dark:bg-red-900/20 text-red-600' :
                                      d.severity === 'medium' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600' :
                                      'bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                                    }`}>
                                      {d.field}: Operador={d.selfReported} vs CSV={d.csvValue} (dif: {d.difference})
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-center">
                          <AlertTriangle className="w-6 h-6 text-amber-500 mx-auto mb-1" />
                          <p className="text-xs text-amber-600">Sin cierre de ronda</p>
                          <p className="text-[10px] text-amber-500">El operador no ha enviado su cierre</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* Timeline view */
        <div className="space-y-3">
          {scorecards.map(({ metric, op, timeline }) => (
            <div key={metric.usuario} className="bg-white dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-navy-700 p-4">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
                  style={{ backgroundColor: `${op?.color || '#6366f1'}20` }}
                >
                  {op?.icono || '👤'}
                </div>
                <span className="font-bold text-sm text-slate-800 dark:text-white">{metric.usuario}</span>
                <span className="text-xs text-slate-400">({timeline.length} eventos)</span>
              </div>

              {timeline.length > 0 ? (
                <div className="relative pl-6 space-y-3 border-l-2 border-slate-200 dark:border-navy-600 ml-4">
                  {timeline.slice(0, 5).map(entry => (
                    <div key={entry.id} className="relative">
                      <div className="absolute -left-[31px] w-5 h-5 rounded-full bg-white dark:bg-navy-800 border-2 border-slate-200 dark:border-navy-600 flex items-center justify-center text-xs">
                        {entry.icon}
                      </div>
                      <div className={`p-2 rounded-lg ${
                        entry.color === 'red' ? 'bg-red-50 dark:bg-red-900/20' :
                        entry.color === 'amber' ? 'bg-amber-50 dark:bg-amber-900/20' :
                        entry.color === 'green' ? 'bg-emerald-50 dark:bg-emerald-900/20' :
                        'bg-blue-50 dark:bg-blue-900/20'
                      }`}>
                        <p className="font-medium text-xs text-slate-700 dark:text-slate-300">{entry.title}</p>
                        <p className="text-[10px] text-slate-500">{entry.description}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(entry.date).toLocaleString('es-CO')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-2">Sin actividad registrada</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WeeklyScorecard;
