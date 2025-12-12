// components/intelligence/SmartPrioritizationPanel.tsx
// Panel de Priorización Inteligente con IA
import React, { useState, useMemo, useEffect } from 'react';
import {
  Brain,
  AlertTriangle,
  CheckCircle,
  Clock,
  Phone,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Zap,
  Target,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Sparkles,
  RefreshCw,
  Eye,
  Shield,
  Activity,
  BarChart3,
  Lightbulb,
  Award,
  Flame,
  MapPin,
  Truck,
  X,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { Shipment, ShipmentStatus } from '../../types';
import {
  calcularScoreGuia,
  generarPrediccionDiaria,
  priorizarGuias,
  obtenerGuiasUrgentes,
  cargarPatronesAprendidos,
  aprenderDeHistorico,
  registrarAccionUsuario,
  GuiaScore,
  PrediccionDiaria,
} from '../../services/aiScoringService';

// =====================================
// TIPOS
// =====================================
interface SmartPrioritizationPanelProps {
  shipments: Shipment[];
  onCallGuide?: (shipment: Shipment) => void;
  onWhatsAppGuide?: (shipment: Shipment) => void;
  compact?: boolean;
}

// =====================================
// COMPONENTE PRINCIPAL
// =====================================
export const SmartPrioritizationPanel: React.FC<SmartPrioritizationPanelProps> = ({
  shipments,
  onCallGuide,
  onWhatsAppGuide,
  compact = false,
}) => {
  const [expandedGuia, setExpandedGuia] = useState<string | null>(null);
  const [isLearning, setIsLearning] = useState(false);
  const [showAllCriticas, setShowAllCriticas] = useState(false);

  // Cargar patrones al montar
  const patrones = useMemo(() => cargarPatronesAprendidos(), []);

  // Calcular predicción diaria
  const prediccion = useMemo(
    () => generarPrediccionDiaria(shipments, patrones),
    [shipments, patrones]
  );

  // Obtener guías priorizadas
  const guiasPriorizadas = useMemo(
    () => priorizarGuias(shipments, patrones),
    [shipments, patrones]
  );

  // Guías urgentes (top 10)
  const guiasUrgentes = useMemo(
    () => obtenerGuiasUrgentes(shipments, showAllCriticas ? 50 : 5),
    [shipments, showAllCriticas]
  );

  // Métricas de IA
  const metricsIA = useMemo(() => {
    const criticas = guiasPriorizadas.filter(g => g.score.nivelRiesgo === 'CRITICO').length;
    const altas = guiasPriorizadas.filter(g => g.score.nivelRiesgo === 'ALTO').length;
    const medias = guiasPriorizadas.filter(g => g.score.nivelRiesgo === 'MEDIO').length;
    const bajas = guiasPriorizadas.filter(g => g.score.nivelRiesgo === 'BAJO').length;

    const promedioScore = guiasPriorizadas.length > 0
      ? Math.round(guiasPriorizadas.reduce((acc, g) => acc + g.score.scoreTotal, 0) / guiasPriorizadas.length)
      : 0;

    return { criticas, altas, medias, bajas, promedioScore };
  }, [guiasPriorizadas]);

  // Función para aprender de datos
  const handleAprenderDeHistorico = async () => {
    setIsLearning(true);
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simular procesamiento
    aprenderDeHistorico(shipments);
    setIsLearning(false);
  };

  // Función para registrar acción
  const handleAccion = (accion: string, guia: Shipment) => {
    registrarAccionUsuario(accion, guia.id, 'PENDIENTE');

    if (accion === 'llamar' && onCallGuide) {
      onCallGuide(guia);
    } else if (accion === 'whatsapp' && onWhatsAppGuide) {
      onWhatsAppGuide(guia);
    }
  };

  // Obtener color por nivel de riesgo
  const getColorByRiesgo = (nivel: GuiaScore['nivelRiesgo']) => {
    switch (nivel) {
      case 'CRITICO': return { bg: 'bg-red-500', text: 'text-red-500', light: 'bg-red-50 dark:bg-red-900/20' };
      case 'ALTO': return { bg: 'bg-orange-500', text: 'text-orange-500', light: 'bg-orange-50 dark:bg-orange-900/20' };
      case 'MEDIO': return { bg: 'bg-amber-500', text: 'text-amber-500', light: 'bg-amber-50 dark:bg-amber-900/20' };
      case 'BAJO': return { bg: 'bg-emerald-500', text: 'text-emerald-500', light: 'bg-emerald-50 dark:bg-emerald-900/20' };
    }
  };

  if (compact) {
    return (
      <CompactView
        prediccion={prediccion}
        metricsIA={metricsIA}
        guiasUrgentes={guiasUrgentes}
        onExpand={() => setShowAllCriticas(true)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* ====================================== */}
      {/* HEADER CON PREDICCIÓN DEL DÍA */}
      {/* ====================================== */}
      <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-2xl p-6 text-white relative overflow-hidden">
        {/* Background effect */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full filter blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full filter blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
        </div>

        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Brain className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  Predicción IA del Día
                  <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
                </h2>
                <p className="text-sm text-white/80">
                  Confianza: {prediccion.confianza}% • Actualizado hace 5 min
                </p>
              </div>
            </div>

            <button
              onClick={handleAprenderDeHistorico}
              disabled={isLearning}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                isLearning
                  ? 'bg-white/20 cursor-not-allowed'
                  : 'bg-white/20 hover:bg-white/30'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${isLearning ? 'animate-spin' : ''}`} />
              {isLearning ? 'Aprendiendo...' : 'Actualizar IA'}
            </button>
          </div>

          {/* Predicción */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-4">
            <p className="text-lg">{prediccion.recomendacionGeneral}</p>
          </div>

          {/* Métricas de predicción */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
              <p className="text-3xl font-bold">{prediccion.entregasEsperadas}</p>
              <p className="text-sm text-white/80">Entregas esperadas</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
              <p className="text-3xl font-bold">{prediccion.novedadesEsperadas}</p>
              <p className="text-sm text-white/80">Novedades esperadas</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-amber-300">{prediccion.guiasCriticas.length}</p>
              <p className="text-sm text-white/80">Guías críticas</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
              <p className="text-lg font-bold">{prediccion.horasPico.join(', ') || 'N/A'}</p>
              <p className="text-sm text-white/80">Horas pico</p>
            </div>
          </div>
        </div>
      </div>

      {/* ====================================== */}
      {/* DISTRIBUCIÓN DE RIESGO */}
      {/* ====================================== */}
      <div className="bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-700 p-6">
        <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-purple-500" />
          Distribución de Riesgo por IA
        </h3>

        <div className="grid grid-cols-4 gap-4 mb-4">
          {[
            { nivel: 'CRITICO', count: metricsIA.criticas, color: 'red' },
            { nivel: 'ALTO', count: metricsIA.altas, color: 'orange' },
            { nivel: 'MEDIO', count: metricsIA.medias, color: 'amber' },
            { nivel: 'BAJO', count: metricsIA.bajas, color: 'emerald' },
          ].map(({ nivel, count, color }) => (
            <div
              key={nivel}
              className={`p-4 bg-${color}-50 dark:bg-${color}-900/20 rounded-xl border border-${color}-200 dark:border-${color}-800 text-center`}
            >
              <p className={`text-2xl font-bold text-${color}-600 dark:text-${color}-400`}>
                {count}
              </p>
              <p className={`text-xs font-medium text-${color}-600 dark:text-${color}-400`}>
                {nivel}
              </p>
            </div>
          ))}
        </div>

        {/* Barra de distribución */}
        <div className="h-4 rounded-full overflow-hidden flex bg-slate-100 dark:bg-navy-800">
          {metricsIA.criticas > 0 && (
            <div
              className="h-full bg-red-500 transition-all"
              style={{ width: `${(metricsIA.criticas / guiasPriorizadas.length) * 100}%` }}
            />
          )}
          {metricsIA.altas > 0 && (
            <div
              className="h-full bg-orange-500 transition-all"
              style={{ width: `${(metricsIA.altas / guiasPriorizadas.length) * 100}%` }}
            />
          )}
          {metricsIA.medias > 0 && (
            <div
              className="h-full bg-amber-500 transition-all"
              style={{ width: `${(metricsIA.medias / guiasPriorizadas.length) * 100}%` }}
            />
          )}
          {metricsIA.bajas > 0 && (
            <div
              className="h-full bg-emerald-500 transition-all"
              style={{ width: `${(metricsIA.bajas / guiasPriorizadas.length) * 100}%` }}
            />
          )}
        </div>

        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 text-center">
          Score promedio de riesgo: <span className="font-bold">{metricsIA.promedioScore}/100</span>
        </p>
      </div>

      {/* ====================================== */}
      {/* GUÍAS URGENTES */}
      {/* ====================================== */}
      <div className="bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-navy-700 bg-gradient-to-r from-red-500/10 to-orange-500/10">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-red-500" />
              Guías que Requieren Acción Inmediata
              <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
                {guiasUrgentes.length}
              </span>
            </h3>
            <button
              onClick={() => setShowAllCriticas(!showAllCriticas)}
              className="text-sm text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
            >
              {showAllCriticas ? 'Ver menos' : 'Ver todas'}
              {showAllCriticas ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-navy-800">
          {guiasUrgentes.length === 0 ? (
            <div className="p-8 text-center">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-emerald-500" />
              <p className="font-medium text-slate-800 dark:text-white">¡Excelente!</p>
              <p className="text-sm text-slate-500">No hay guías críticas que requieran acción inmediata</p>
            </div>
          ) : (
            guiasUrgentes.map((guia) => {
              const colors = getColorByRiesgo(guia.score.nivelRiesgo);
              const isExpanded = expandedGuia === guia.id;

              return (
                <div key={guia.id} className={`${colors.light}`}>
                  {/* Fila principal */}
                  <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* Score visual */}
                        <div className={`w-14 h-14 rounded-xl ${colors.bg} flex flex-col items-center justify-center text-white`}>
                          <span className="text-xl font-bold">{guia.score.scoreTotal}</span>
                          <span className="text-[10px] uppercase">Score</span>
                        </div>

                        {/* Info guía */}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-800 dark:text-white">
                              {guia.id}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${colors.bg} text-white`}>
                              {guia.score.nivelRiesgo}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                            {guia.score.recomendacionPrioritaria}
                          </p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {guia.detailedInfo?.destination || 'N/A'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Truck className="w-3 h-3" />
                              {guia.carrier}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {guia.detailedInfo?.daysInTransit || 0} días
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Acciones */}
                      <div className="flex items-center gap-2">
                        {guia.phone && (
                          <>
                            <button
                              onClick={() => handleAccion('llamar', guia)}
                              className="flex items-center gap-1 px-3 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                            >
                              <Phone className="w-4 h-4" />
                              Llamar
                            </button>
                            <button
                              onClick={() => handleAccion('whatsapp', guia)}
                              className="flex items-center gap-1 px-3 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
                            >
                              <MessageSquare className="w-4 h-4" />
                              WhatsApp
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => setExpandedGuia(isExpanded ? null : guia.id)}
                          className="p-2 bg-slate-100 dark:bg-navy-700 rounded-lg hover:bg-slate-200 dark:hover:bg-navy-600 transition-colors"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Detalle expandido */}
                  {isExpanded && (
                    <div className="px-6 pb-4 space-y-4">
                      {/* Factores de riesgo */}
                      <div className="bg-white dark:bg-navy-800 rounded-xl p-4 border border-slate-200 dark:border-navy-700">
                        <h4 className="font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2 text-sm">
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                          Factores de Riesgo Detectados
                        </h4>
                        <div className="space-y-2">
                          {guia.score.factoresRiesgo.map((factor, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-navy-900 rounded-lg">
                              <div>
                                <span className="font-medium text-sm text-slate-800 dark:text-white">
                                  {factor.nombre}
                                </span>
                                <p className="text-xs text-slate-500">{factor.descripcion}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-bold ${factor.peso > 15 ? 'text-red-500' : factor.peso > 8 ? 'text-orange-500' : 'text-amber-500'}`}>
                                  +{factor.peso} pts
                                </span>
                                {factor.mitigable && (
                                  <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs rounded">
                                    Mitigable
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Acciones recomendadas */}
                      <div className="bg-white dark:bg-navy-800 rounded-xl p-4 border border-slate-200 dark:border-navy-700">
                        <h4 className="font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2 text-sm">
                          <Lightbulb className="w-4 h-4 text-amber-500" />
                          Acciones Recomendadas por IA
                        </h4>
                        <div className="space-y-2">
                          {guia.score.accionesRecomendadas.map((accion) => (
                            <div key={accion.id} className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-navy-900 rounded-lg">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                                accion.prioridad === 1 ? 'bg-red-500' :
                                accion.prioridad === 2 ? 'bg-orange-500' :
                                'bg-slate-400'
                              }`}>
                                {accion.prioridad}
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-sm text-slate-800 dark:text-white">
                                  {accion.accion}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {accion.impactoEsperado} • {accion.tiempoEjecucion}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Probabilidades */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 text-center border border-red-200 dark:border-red-800">
                          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                            {guia.score.probabilidadDevolucion}%
                          </p>
                          <p className="text-xs text-red-600 dark:text-red-400">Prob. Devolución</p>
                        </div>
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 text-center border border-emerald-200 dark:border-emerald-800">
                          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                            {guia.score.probabilidadEntrega}%
                          </p>
                          <p className="text-xs text-emerald-600 dark:text-emerald-400">Prob. Entrega</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

// =====================================
// VISTA COMPACTA
// =====================================
const CompactView: React.FC<{
  prediccion: PrediccionDiaria;
  metricsIA: { criticas: number; altas: number; medias: number; bajas: number; promedioScore: number };
  guiasUrgentes: Array<Shipment & { score: GuiaScore }>;
  onExpand: () => void;
}> = ({ prediccion, metricsIA, guiasUrgentes, onExpand }) => {
  return (
    <div className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 rounded-xl border border-purple-500/20 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-500" />
          <span className="font-bold text-slate-800 dark:text-white">IA Insights</span>
          <span className="text-xs text-slate-500">({prediccion.confianza}% confianza)</span>
        </div>
        {metricsIA.criticas > 0 && (
          <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
            {metricsIA.criticas} críticas
          </span>
        )}
      </div>

      <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
        {prediccion.recomendacionGeneral}
      </p>

      <div className="flex items-center gap-4 text-xs">
        <span className="text-emerald-600">📦 {prediccion.entregasEsperadas} entregas</span>
        <span className="text-amber-600">⚠️ {prediccion.novedadesEsperadas} novedades</span>
        <button
          onClick={onExpand}
          className="ml-auto text-purple-600 hover:underline flex items-center gap-1"
        >
          Ver análisis completo <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

export default SmartPrioritizationPanel;
