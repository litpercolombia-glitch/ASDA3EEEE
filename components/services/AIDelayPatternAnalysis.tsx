import React, { useState, useEffect } from 'react';
import {
  Brain,
  AlertTriangle,
  Clock,
  TrendingUp,
  MapPin,
  Truck,
  Lightbulb,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Target,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Eye,
  Phone,
  ExternalLink,
  Copy,
  Zap,
  Calendar,
  CloudRain,
  Flag,
} from 'lucide-react';
import { Shipment, ShipmentRiskLevel } from '../../types';
import { analyzeDelayPatterns } from '../../services/claudeService';

interface AIDelayPatternAnalysisProps {
  shipments: Shipment[];
  onGuideClick?: (guideNumber: string) => void;
}

interface PatternData {
  type: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  affectedCount: number;
  guideNumbers: string[];
  daysWithoutMovement: number;
  commonFactors: string[];
  recommendation: string;
}

interface AnalysisResult {
  patterns: PatternData[];
  urgentReview: string[];
  recommendations: {
    immediate: string[];
    shortTerm: string[];
    strategic: string[];
  };
  riskSummary: {
    totalAtRisk: number;
    criticalCount: number;
    estimatedLoss: number;
    mainCauses: string[];
  };
  colombianContext: {
    regionalIssues: string[];
    carrierAlerts: string[];
    seasonalFactors: string[];
    marketInsights: string[];
  };
}

const PATTERN_CONFIG = {
  CRITICAL: {
    color: 'text-red-600',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-300 dark:border-red-700',
    icon: <AlertTriangle className="w-5 h-5" />,
    label: 'Crítico',
  },
  HIGH: {
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    borderColor: 'border-orange-300 dark:border-orange-700',
    icon: <AlertCircle className="w-5 h-5" />,
    label: 'Alto',
  },
  MEDIUM: {
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-300 dark:border-yellow-700',
    icon: <Eye className="w-5 h-5" />,
    label: 'Medio',
  },
  LOW: {
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-300 dark:border-green-700',
    icon: <CheckCircle className="w-5 h-5" />,
    label: 'Bajo',
  },
};

const AIDelayPatternAnalysis: React.FC<AIDelayPatternAnalysisProps> = ({
  shipments,
  onGuideClick,
}) => {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['patterns', 'recommendations'])
  );
  const [expandedPatterns, setExpandedPatterns] = useState<Set<number>>(new Set());
  const [copiedGuide, setCopiedGuide] = useState<string | null>(null);
  const [lastAnalyzed, setLastAnalyzed] = useState<string | null>(null);

  const runAnalysis = async () => {
    if (shipments.length === 0) {
      setError('No hay guías para analizar');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await analyzeDelayPatterns(shipments);
      setAnalysis(result);
      setLastAnalyzed(new Date().toLocaleString('es-CO'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al analizar patrones');
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const togglePattern = (index: number) => {
    setExpandedPatterns((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const copyGuide = async (guide: string) => {
    await navigator.clipboard.writeText(guide);
    setCopiedGuide(guide);
    setTimeout(() => setCopiedGuide(null), 2000);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Quick stats from shipments
  const quickStats = {
    total: shipments.length,
    critical: shipments.filter((s) => s.riskAnalysis?.level === ShipmentRiskLevel.URGENT).length,
    delayed: shipments.filter((s) => (s.detailedInfo?.daysInTransit || 0) > 5).length,
    noMovement: shipments.filter((s) => (s.detailedInfo?.daysInTransit || 0) > 3).length,
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                Análisis de Patrones con IA
              </h2>
              <p className="text-purple-100">
                Experto en Logística Colombiana • {quickStats.total} guías
              </p>
            </div>
          </div>

          <button
            onClick={runAnalysis}
            disabled={loading || shipments.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 bg-white/20 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-all font-semibold"
          >
            {loading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Analizando...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                Analizar con IA
              </>
            )}
          </button>
        </div>

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-4 gap-4 mt-5">
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-white">{quickStats.total}</p>
            <p className="text-xs text-purple-100">Total Guías</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-red-300">{quickStats.critical}</p>
            <p className="text-xs text-purple-100">Críticas</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-orange-300">{quickStats.delayed}</p>
            <p className="text-xs text-purple-100">&gt;5 días</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-yellow-300">{quickStats.noMovement}</p>
            <p className="text-xs text-purple-100">Sin movimiento</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Error State */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <p className="text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full mb-4">
              <Brain className="w-8 h-8 text-purple-600 animate-pulse" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Analizando patrones de retraso...
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              El experto en logística colombiana está revisando tus envíos
            </p>
          </div>
        )}

        {/* No Analysis Yet */}
        {!loading && !analysis && !error && (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
              <Brain className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Análisis de Patrones con IA
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Haz clic en "Analizar con IA" para obtener insights de un experto en logística colombiana
            </p>
            <div className="flex flex-wrap justify-center gap-2 text-sm text-gray-500">
              <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
                Patrones de retraso
              </span>
              <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
                Guías sin movimiento
              </span>
              <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
                Recomendaciones
              </span>
              <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
                Contexto colombiano
              </span>
            </div>
          </div>
        )}

        {/* Analysis Results */}
        {analysis && !loading && (
          <>
            {/* Last Analyzed */}
            {lastAnalyzed && (
              <div className="flex items-center justify-end text-sm text-gray-500">
                <Clock className="w-4 h-4 mr-1" />
                Último análisis: {lastAnalyzed}
              </div>
            )}

            {/* Risk Summary */}
            <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-xl p-5 border border-red-200 dark:border-red-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-red-500" />
                Resumen de Riesgo
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-red-600">
                    {analysis.riskSummary.totalAtRisk}
                  </p>
                  <p className="text-sm text-gray-500">En Riesgo</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-orange-600">
                    {analysis.riskSummary.criticalCount}
                  </p>
                  <p className="text-sm text-gray-500">Críticos</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center col-span-2">
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(analysis.riskSummary.estimatedLoss)}
                  </p>
                  <p className="text-sm text-gray-500">Pérdida Estimada</p>
                </div>
              </div>
              {analysis.riskSummary.mainCauses.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Causas principales:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {analysis.riskSummary.mainCauses.map((cause, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-sm"
                      >
                        {cause}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Urgent Review */}
            {analysis.urgentReview.length > 0 && (
              <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-5 border-2 border-red-300 dark:border-red-700">
                <h3 className="text-lg font-bold text-red-700 dark:text-red-300 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Requieren Revisión INMEDIATA ({analysis.urgentReview.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {analysis.urgentReview.map((guide, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg border border-red-200 dark:border-red-700"
                    >
                      <span className="font-mono font-semibold text-gray-900 dark:text-white">
                        {guide}
                      </span>
                      <button
                        onClick={() => copyGuide(guide)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      >
                        {copiedGuide === guide ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                      <a
                        href={`https://t.17track.net/es#nums=${guide}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded"
                      >
                        <ExternalLink className="w-4 h-4 text-blue-500" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Patterns Section */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
              <button
                onClick={() => toggleSection('patterns')}
                className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-purple-500" />
                  <span className="font-semibold text-gray-900 dark:text-white">
                    Patrones Identificados ({analysis.patterns.length})
                  </span>
                </div>
                {expandedSections.has('patterns') ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </button>

              {expandedSections.has('patterns') && (
                <div className="p-4 space-y-3">
                  {analysis.patterns.map((pattern, index) => {
                    const config = PATTERN_CONFIG[pattern.type];
                    const isExpanded = expandedPatterns.has(index);

                    return (
                      <div
                        key={index}
                        className={`rounded-xl border-2 ${config.borderColor} ${config.bgColor} overflow-hidden`}
                      >
                        <button
                          onClick={() => togglePattern(index)}
                          className="w-full p-4 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div className={config.color}>{config.icon}</div>
                            <div className="text-left">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-xs font-bold px-2 py-0.5 rounded ${config.color} bg-white dark:bg-gray-800`}
                                >
                                  {config.label}
                                </span>
                                <span className="text-sm text-gray-500">
                                  {pattern.affectedCount} guías afectadas
                                </span>
                              </div>
                              <p className="font-medium text-gray-900 dark:text-white mt-1">
                                {pattern.description}
                              </p>
                            </div>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-gray-500" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-500" />
                          )}
                        </button>

                        {isExpanded && (
                          <div className="px-4 pb-4 space-y-4 border-t border-gray-200 dark:border-gray-600 pt-4">
                            {/* Days without movement */}
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="w-4 h-4 text-gray-500" />
                              <span className="text-gray-600 dark:text-gray-400">
                                Días sin movimiento:{' '}
                                <strong>{pattern.daysWithoutMovement}</strong>
                              </span>
                            </div>

                            {/* Common factors */}
                            {pattern.commonFactors.length > 0 && (
                              <div>
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  Factores comunes:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {pattern.commonFactors.map((factor, i) => (
                                    <span
                                      key={i}
                                      className="px-2 py-1 bg-white dark:bg-gray-700 rounded text-sm text-gray-600 dark:text-gray-300"
                                    >
                                      {factor}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Recommendation */}
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                              <div className="flex items-start gap-2">
                                <Lightbulb className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                  {pattern.recommendation}
                                </p>
                              </div>
                            </div>

                            {/* Affected guides */}
                            {pattern.guideNumbers.length > 0 && (
                              <div>
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  Guías afectadas:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {pattern.guideNumbers.slice(0, 10).map((guide, i) => (
                                    <div
                                      key={i}
                                      className="flex items-center gap-1 px-2 py-1 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600"
                                    >
                                      <span className="font-mono text-sm">{guide}</span>
                                      <button
                                        onClick={() => copyGuide(guide)}
                                        className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                                      >
                                        {copiedGuide === guide ? (
                                          <CheckCircle className="w-3 h-3 text-green-500" />
                                        ) : (
                                          <Copy className="w-3 h-3 text-gray-400" />
                                        )}
                                      </button>
                                    </div>
                                  ))}
                                  {pattern.guideNumbers.length > 10 && (
                                    <span className="px-2 py-1 text-sm text-gray-500">
                                      +{pattern.guideNumbers.length - 10} más
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recommendations Section */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
              <button
                onClick={() => toggleSection('recommendations')}
                className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Lightbulb className="w-5 h-5 text-yellow-500" />
                  <span className="font-semibold text-gray-900 dark:text-white">
                    Recomendaciones del Experto
                  </span>
                </div>
                {expandedSections.has('recommendations') ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </button>

              {expandedSections.has('recommendations') && (
                <div className="p-4 space-y-4">
                  {/* Immediate */}
                  {analysis.recommendations.immediate.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-red-600 mb-2 flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        Acciones Inmediatas (próximas 2 horas)
                      </h4>
                      <ul className="space-y-2">
                        {analysis.recommendations.immediate.map((rec, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg"
                          >
                            <span className="text-red-500 mt-1">•</span>
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {rec}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Short Term */}
                  {analysis.recommendations.shortTerm.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-orange-600 mb-2 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Corto Plazo (hoy/mañana)
                      </h4>
                      <ul className="space-y-2">
                        {analysis.recommendations.shortTerm.map((rec, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg"
                          >
                            <span className="text-orange-500 mt-1">•</span>
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {rec}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Strategic */}
                  {analysis.recommendations.strategic.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-blue-600 mb-2 flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Estratégico (mediano plazo)
                      </h4>
                      <ul className="space-y-2">
                        {analysis.recommendations.strategic.map((rec, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
                          >
                            <span className="text-blue-500 mt-1">•</span>
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {rec}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Colombian Context Section */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
              <button
                onClick={() => toggleSection('context')}
                className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-red-50 dark:from-yellow-900/20 dark:to-red-900/20 hover:opacity-90 transition-opacity"
              >
                <div className="flex items-center gap-3">
                  <Flag className="w-5 h-5 text-yellow-600" />
                  <span className="font-semibold text-gray-900 dark:text-white">
                    Contexto Colombiano
                  </span>
                </div>
                {expandedSections.has('context') ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </button>

              {expandedSections.has('context') && (
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Regional Issues */}
                  {analysis.colombianContext.regionalIssues.length > 0 && (
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                      <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-red-500" />
                        Problemas Regionales
                      </h4>
                      <ul className="space-y-2">
                        {analysis.colombianContext.regionalIssues.map((issue, i) => (
                          <li key={i} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                            <span className="text-red-400">•</span>
                            {issue}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Carrier Alerts */}
                  {analysis.colombianContext.carrierAlerts.length > 0 && (
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                      <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <Truck className="w-4 h-4 text-orange-500" />
                        Alertas de Transportadoras
                      </h4>
                      <ul className="space-y-2">
                        {analysis.colombianContext.carrierAlerts.map((alert, i) => (
                          <li key={i} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                            <span className="text-orange-400">•</span>
                            {alert}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Seasonal Factors */}
                  {analysis.colombianContext.seasonalFactors.length > 0 && (
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                      <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <CloudRain className="w-4 h-4 text-blue-500" />
                        Factores Estacionales
                      </h4>
                      <ul className="space-y-2">
                        {analysis.colombianContext.seasonalFactors.map((factor, i) => (
                          <li key={i} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                            <span className="text-blue-400">•</span>
                            {factor}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Market Insights */}
                  {analysis.colombianContext.marketInsights.length > 0 && (
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                      <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        Insights del Mercado
                      </h4>
                      <ul className="space-y-2">
                        {analysis.colombianContext.marketInsights.map((insight, i) => (
                          <li key={i} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                            <span className="text-green-400">•</span>
                            {insight}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AIDelayPatternAnalysis;
