// components/intelligence/AILearningPanel.tsx
// Panel de visualización del aprendizaje y métricas de IA
import React, { useState, useMemo, useEffect } from 'react';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Target,
  Award,
  Sparkles,
  Activity,
  Database,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Clock,
  BarChart3,
  LineChart,
  Zap,
  BookOpen,
  Layers,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react';
import { Shipment } from '../../types';
import { aprenderDeHistorico, PatronAprendido, generarPrediccionDiaria } from '../../services/aiScoringService';

interface AILearningPanelProps {
  shipments: Shipment[];
  compact?: boolean;
}

// =====================================
// COMPONENTE PRINCIPAL
// =====================================
export const AILearningPanel: React.FC<AILearningPanelProps> = ({
  shipments,
  compact = false,
}) => {
  const [isLearning, setIsLearning] = useState(false);
  const [showPatterns, setShowPatterns] = useState(false);
  const [patronesActuales, setPatronesActuales] = useState<PatronAprendido[]>([]);

  // Cargar patrones guardados
  useEffect(() => {
    const saved = localStorage.getItem('litper_ai_patterns');
    if (saved) {
      try {
        setPatronesActuales(JSON.parse(saved));
      } catch (e) {
        console.error('Error parsing saved patterns:', e);
      }
    }
  }, []);

  // Entrenar modelo con datos actuales
  const handleTrain = () => {
    if (shipments.length === 0) return;

    setIsLearning(true);

    // Simular proceso de aprendizaje
    setTimeout(() => {
      const nuevosPatrones = aprenderDeHistorico(shipments);
      setPatronesActuales(nuevosPatrones);
      localStorage.setItem('litper_ai_patterns', JSON.stringify(nuevosPatrones));
      setIsLearning(false);
    }, 1500);
  };

  // Métricas del modelo
  const modelMetrics = useMemo(() => {
    const patronesCount = patronesActuales.length;
    const confianzaPromedio = patronesCount > 0
      ? patronesActuales.reduce((sum, p) => sum + p.confianza, 0) / patronesCount
      : 0;

    // Calcular precisión estimada basada en patrones
    const patronesAltos = patronesActuales.filter(p => p.confianza > 0.7).length;
    const precisionEstimada = patronesCount > 0
      ? (patronesAltos / patronesCount) * 100
      : 0;

    // Predicción actual
    const prediccion = shipments.length > 0
      ? generarPrediccionDiaria(shipments, patronesActuales)
      : null;

    return {
      patronesCount,
      confianzaPromedio: Math.round(confianzaPromedio * 100),
      precisionEstimada: Math.round(precisionEstimada),
      prediccion,
      datosEntrenamiento: shipments.length,
      ultimoEntrenamiento: localStorage.getItem('litper_ai_last_train') || 'Nunca',
    };
  }, [patronesActuales, shipments]);

  // Guardar timestamp de entrenamiento
  useEffect(() => {
    if (!isLearning && patronesActuales.length > 0) {
      localStorage.setItem('litper_ai_last_train', new Date().toLocaleString('es-CO'));
    }
  }, [isLearning, patronesActuales]);

  // Modo compacto
  if (compact) {
    return (
      <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/30 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Brain className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="font-bold text-slate-800 dark:text-white">Motor IA</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {modelMetrics.patronesCount} patrones · {modelMetrics.confianzaPromedio}% confianza
              </p>
            </div>
          </div>
          <button
            onClick={handleTrain}
            disabled={isLearning || shipments.length === 0}
            className="flex items-center gap-2 px-3 py-1.5 bg-purple-500 text-white text-sm rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isLearning ? 'animate-spin' : ''}`} />
            {isLearning ? 'Entrenando...' : 'Entrenar'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ====================================== */}
      {/* HEADER CON ESTADO DEL MODELO */}
      {/* ====================================== */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-900 rounded-2xl border border-purple-500/30 overflow-hidden">
        <div className="p-6 relative overflow-hidden">
          {/* Background Effect */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-1/4 w-64 h-64 bg-pink-500 rounded-full filter blur-[80px] animate-pulse"></div>
            <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-purple-500 rounded-full filter blur-[80px] animate-pulse" style={{ animationDelay: '1s' }}></div>
          </div>

          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-lg shadow-purple-500/30">
                <Brain className="w-10 h-10 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  Motor de Aprendizaje IA
                  <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
                </h2>
                <p className="text-purple-200">
                  Sistema de Machine Learning para predicción de entregas
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleTrain}
                disabled={isLearning || shipments.length === 0}
                className={`
                  flex items-center gap-2 px-5 py-3 rounded-xl font-bold
                  transition-all shadow-lg
                  ${isLearning
                    ? 'bg-purple-600 text-white cursor-wait'
                    : shipments.length === 0
                    ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-pink-600 hover:to-purple-600 hover:shadow-pink-500/30'
                  }
                `}
              >
                <RefreshCw className={`w-5 h-5 ${isLearning ? 'animate-spin' : ''}`} />
                {isLearning ? 'Entrenando modelo...' : 'Entrenar con datos actuales'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ====================================== */}
      {/* MÉTRICAS DEL MODELO */}
      {/* ====================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Patrones aprendidos */}
        <div className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-700 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Layers className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Patrones</span>
          </div>
          <p className="text-3xl font-bold text-slate-800 dark:text-white">{modelMetrics.patronesCount}</p>
          <p className="text-xs text-slate-500 mt-1">patrones detectados</p>
        </div>

        {/* Confianza promedio */}
        <div className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-700 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <Target className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Confianza</span>
          </div>
          <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{modelMetrics.confianzaPromedio}%</p>
          <p className="text-xs text-slate-500 mt-1">promedio del modelo</p>
        </div>

        {/* Precisión estimada */}
        <div className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-700 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <Award className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Precisión</span>
          </div>
          <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{modelMetrics.precisionEstimada}%</p>
          <p className="text-xs text-slate-500 mt-1">patrones de alta confianza</p>
        </div>

        {/* Datos de entrenamiento */}
        <div className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-700 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Database className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Datos</span>
          </div>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{modelMetrics.datosEntrenamiento}</p>
          <p className="text-xs text-slate-500 mt-1">guías analizadas</p>
        </div>
      </div>

      {/* ====================================== */}
      {/* PREDICCIÓN ACTUAL */}
      {/* ====================================== */}
      {modelMetrics.prediccion && (
        <div className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-navy-700 bg-gradient-to-r from-emerald-500/10 to-teal-500/10">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-500" />
              Predicción del Modelo para Hoy
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                <p className="text-3xl font-bold text-emerald-600">{modelMetrics.prediccion.entregasEsperadas}</p>
                <p className="text-sm text-emerald-600/80">Entregas esperadas</p>
              </div>
              <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
                <p className="text-3xl font-bold text-red-600">{modelMetrics.prediccion.novedadesEsperadas}</p>
                <p className="text-sm text-red-600/80">Novedades probables</p>
              </div>
              <div className="text-center p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                <p className="text-3xl font-bold text-amber-600">{modelMetrics.prediccion.guiasCriticas}</p>
                <p className="text-sm text-amber-600/80">Guías críticas</p>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                <p className="text-3xl font-bold text-purple-600">{modelMetrics.prediccion.confianzaGeneral}%</p>
                <p className="text-sm text-purple-600/80">Confianza</p>
              </div>
            </div>

            {/* Recomendaciones */}
            {modelMetrics.prediccion.recomendaciones.length > 0 && (
              <div className="border-t border-slate-200 dark:border-navy-700 pt-4">
                <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  Recomendaciones de IA
                </h4>
                <div className="space-y-2">
                  {modelMetrics.prediccion.recomendaciones.map((rec, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-navy-800 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-slate-700 dark:text-slate-300">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====================================== */}
      {/* PATRONES APRENDIDOS */}
      {/* ====================================== */}
      <div className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-700 overflow-hidden">
        <button
          onClick={() => setShowPatterns(!showPatterns)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-navy-800 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="text-left">
              <h3 className="font-bold text-slate-800 dark:text-white">Patrones Aprendidos</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {patronesActuales.length} patrones detectados por el modelo
              </p>
            </div>
          </div>
          {showPatterns ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </button>

        {showPatterns && (
          <div className="border-t border-slate-200 dark:border-navy-700 p-6">
            {patronesActuales.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-slate-100 dark:bg-navy-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Info className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-600 dark:text-slate-400 mb-2">No hay patrones aprendidos</p>
                <p className="text-sm text-slate-500">Carga guías y entrena el modelo para detectar patrones</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {patronesActuales.map((patron, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-navy-800 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className={`
                        p-2 rounded-lg
                        ${patron.tipo === 'ciudad' ? 'bg-blue-100 dark:bg-blue-900/30' :
                          patron.tipo === 'transportadora' ? 'bg-purple-100 dark:bg-purple-900/30' :
                          patron.tipo === 'horario' ? 'bg-amber-100 dark:bg-amber-900/30' :
                          'bg-slate-100 dark:bg-slate-800'}
                      `}>
                        {patron.tipo === 'ciudad' && <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                        {patron.tipo === 'transportadora' && <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
                        {patron.tipo === 'horario' && <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
                        {patron.tipo === 'estado' && <Activity className="w-4 h-4 text-slate-600 dark:text-slate-400" />}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800 dark:text-white">{patron.nombre}</p>
                        <p className="text-sm text-slate-500">{patron.descripcion}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-800 dark:text-white">
                          {Math.round(patron.confianza * 100)}%
                        </p>
                        <p className="text-xs text-slate-500">confianza</p>
                      </div>
                      <div className={`
                        w-3 h-3 rounded-full
                        ${patron.confianza > 0.7 ? 'bg-emerald-500' :
                          patron.confianza > 0.4 ? 'bg-amber-500' : 'bg-red-500'}
                      `}></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ====================================== */}
      {/* HISTORIAL DE ENTRENAMIENTO */}
      {/* ====================================== */}
      <div className="bg-slate-50 dark:bg-navy-950 rounded-xl border border-slate-200 dark:border-navy-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-slate-400" />
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Último entrenamiento: <span className="font-medium text-slate-800 dark:text-white">{modelMetrics.ultimoEntrenamiento}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${patronesActuales.length > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></div>
            <span className="text-sm text-slate-600 dark:text-slate-400">
              {patronesActuales.length > 0 ? 'Modelo activo' : 'Sin entrenar'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AILearningPanel;
