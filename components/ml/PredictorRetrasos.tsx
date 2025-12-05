/**
 * PredictorRetrasos.tsx
 * Componente para predecir retrasos en entregas usando Machine Learning.
 * Permite ingresar un número de guía y obtener la predicción de riesgo.
 */

import React, { useState, useCallback } from 'react';
import {
  Search,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  RefreshCw,
  Truck,
  Target,
  Zap,
} from 'lucide-react';
import { getPredictionWithFallback, type Prediccion } from '@/lib/api-config';

// Tipos para el estado del componente
interface PredictorState {
  numeroGuia: string;
  prediccion: Prediccion | null;
  loading: boolean;
  error: string | null;
  isDemoMode: boolean;
}

// Colores y configuración por nivel de riesgo
const RISK_CONFIG = {
  BAJO: {
    color: 'green',
    bgGradient: 'from-green-50 to-green-100',
    borderColor: 'border-green-200',
    textColor: 'text-green-700',
    iconColor: 'text-green-500',
    icon: CheckCircle,
    label: 'Riesgo Bajo',
    description: 'Alta probabilidad de entrega a tiempo',
  },
  MEDIO: {
    color: 'yellow',
    bgGradient: 'from-yellow-50 to-yellow-100',
    borderColor: 'border-yellow-200',
    textColor: 'text-yellow-700',
    iconColor: 'text-yellow-500',
    icon: Clock,
    label: 'Riesgo Medio',
    description: 'Posible retraso leve',
  },
  ALTO: {
    color: 'orange',
    bgGradient: 'from-orange-50 to-orange-100',
    borderColor: 'border-orange-200',
    textColor: 'text-orange-700',
    iconColor: 'text-orange-500',
    icon: AlertTriangle,
    label: 'Riesgo Alto',
    description: 'Probable retraso significativo',
  },
  CRITICO: {
    color: 'red',
    bgGradient: 'from-red-50 to-red-100',
    borderColor: 'border-red-200',
    textColor: 'text-red-700',
    iconColor: 'text-red-500',
    icon: XCircle,
    label: 'Riesgo Crítico',
    description: 'Requiere acción inmediata',
  },
};

/**
 * Componente principal del Predictor de Retrasos
 */
export function PredictorRetrasos() {
  // Estado del componente
  const [state, setState] = useState<PredictorState>({
    numeroGuia: '',
    prediccion: null,
    loading: false,
    error: null,
    isDemoMode: false,
  });

  // Handler para cambio de input
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^a-zA-Z0-9]/g, '');
    setState((prev) => ({
      ...prev,
      numeroGuia: value,
      error: null,
    }));
  }, []);

  // Handler para ejecutar predicción (con fallback a modo demo)
  const handlePrediccion = useCallback(async () => {
    const { numeroGuia } = state;

    if (!numeroGuia || numeroGuia.length < 5) {
      setState((prev) => ({
        ...prev,
        error: 'Ingresa un número de guía válido (mínimo 5 caracteres)',
      }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const { data: resultado, isDemo } = await getPredictionWithFallback(numeroGuia);
      setState((prev) => ({
        ...prev,
        prediccion: resultado,
        loading: false,
        isDemoMode: isDemo,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al realizar predicción';
      setState((prev) => ({
        ...prev,
        error: errorMessage,
        loading: false,
      }));
    }
  }, [state.numeroGuia]);

  // Handler para nueva predicción
  const handleNuevaPrediccion = useCallback(() => {
    setState({
      numeroGuia: '',
      prediccion: null,
      loading: false,
      error: null,
      isDemoMode: false,
    });
  }, []);

  // Handler para enviar con Enter
  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !state.loading) {
        handlePrediccion();
      }
    },
    [handlePrediccion, state.loading]
  );

  const { numeroGuia, prediccion, loading, error, isDemoMode } = state;

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Card principal */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Predictor de Retrasos ML
                {isDemoMode && (
                  <span className="px-2 py-0.5 bg-blue-400/30 text-blue-100 text-xs rounded-full">
                    Demo
                  </span>
                )}
              </h2>
              <p className="text-blue-100 text-sm">
                Análisis predictivo con Machine Learning
              </p>
            </div>
          </div>
        </div>

        {/* Banner modo demo */}
        {isDemoMode && prediccion && (
          <div className="bg-blue-50 border-b border-blue-200 px-6 py-3">
            <div className="flex items-center gap-2 text-blue-700 text-sm">
              <Zap className="w-4 h-4" />
              <span>
                <strong>Modo Demo:</strong> Esta predicción es simulada porque el backend no está disponible.
              </span>
            </div>
          </div>
        )}

        {/* Contenido */}
        <div className="p-6">
          {/* Formulario de búsqueda */}
          {!prediccion && (
            <div className="space-y-4">
              {/* Input de número de guía */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de Guía
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={numeroGuia}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    placeholder="Ej: 8001234567890"
                    className={`w-full px-4 py-3 pl-12 border rounded-lg text-lg font-mono
                      focus:ring-2 focus:ring-blue-500 focus:border-transparent
                      transition-all duration-200
                      ${error ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                    disabled={loading}
                    maxLength={20}
                  />
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
              </div>

              {/* Mensaje de error */}
              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                  <AlertTriangle className="w-4 h-4" />
                  {error}
                </div>
              )}

              {/* Botón de predicción */}
              <button
                onClick={handlePrediccion}
                disabled={loading || !numeroGuia}
                className={`w-full py-3 px-6 rounded-lg font-semibold text-white
                  flex items-center justify-center gap-2 transition-all duration-200
                  ${
                    loading || !numeroGuia
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 active:scale-98'
                  }`}
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Analizando...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    Predecir Riesgo de Retraso
                  </>
                )}
              </button>

              {/* Info card */}
              <div className="mt-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-100">
                <div className="flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 text-indigo-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-indigo-900">
                      ¿Cómo funciona?
                    </h4>
                    <p className="text-sm text-indigo-700 mt-1">
                      Nuestro modelo de ML analiza patrones históricos de entregas,
                      transportadoras, ciudades y otros factores para predecir la
                      probabilidad de retraso de tu envío.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Resultado de predicción */}
          {prediccion && (
            <div className="space-y-6">
              {/* Tarjeta de resultado */}
              <ResultadoPrediccion
                prediccion={prediccion}
                onNuevaPrediccion={handleNuevaPrediccion}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Componente para mostrar el resultado de la predicción
 */
interface ResultadoPrediccionProps {
  prediccion: Prediccion;
  onNuevaPrediccion: () => void;
}

function ResultadoPrediccion({ prediccion, onNuevaPrediccion }: ResultadoPrediccionProps) {
  const config = RISK_CONFIG[prediccion.nivel_riesgo] || RISK_CONFIG.MEDIO;
  const IconComponent = config.icon;

  const probabilidadPorcentaje = Math.round(prediccion.probabilidad_retraso * 100);

  return (
    <div className="space-y-4">
      {/* Header del resultado */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Truck className="w-5 h-5 text-gray-500" />
          <span className="font-mono text-lg font-semibold text-gray-800">
            {prediccion.numero_guia}
          </span>
        </div>
        <span className="text-sm text-gray-500">
          Modelo: {prediccion.modelo_usado}
        </span>
      </div>

      {/* Card de nivel de riesgo */}
      <div
        className={`bg-gradient-to-r ${config.bgGradient} border ${config.borderColor}
          rounded-xl p-6 transition-all duration-300`}
      >
        <div className="flex items-center gap-4">
          {/* Ícono grande */}
          <div className={`p-4 rounded-full bg-white/80 ${config.iconColor}`}>
            <IconComponent className="w-10 h-10" />
          </div>

          {/* Información del riesgo */}
          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-bold ${config.textColor}`}>
                {config.label}
              </span>
              <span className={`text-xl font-semibold ${config.textColor}`}>
                ({probabilidadPorcentaje}%)
              </span>
            </div>
            <p className={`text-sm mt-1 ${config.textColor} opacity-80`}>
              {config.description}
            </p>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="mt-4">
          <div className="h-3 bg-white/50 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out
                ${
                  prediccion.nivel_riesgo === 'BAJO'
                    ? 'bg-green-500'
                    : prediccion.nivel_riesgo === 'MEDIO'
                    ? 'bg-yellow-500'
                    : prediccion.nivel_riesgo === 'ALTO'
                    ? 'bg-orange-500'
                    : 'bg-red-500'
                }`}
              style={{ width: `${probabilidadPorcentaje}%` }}
            />
          </div>
          <div className="flex justify-between text-xs mt-1 opacity-60">
            <span>0%</span>
            <span>Probabilidad de retraso</span>
            <span>100%</span>
          </div>
        </div>
      </div>

      {/* Factores de riesgo */}
      {prediccion.factores_riesgo && prediccion.factores_riesgo.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            Factores de Riesgo Detectados
          </h4>
          <ul className="space-y-1">
            {prediccion.factores_riesgo.map((factor, idx) => (
              <li key={idx} className="text-sm text-gray-600 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                {factor}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recomendaciones */}
      {prediccion.acciones_recomendadas && prediccion.acciones_recomendadas.length > 0 && (
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
          <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-blue-500" />
            Acciones Recomendadas
          </h4>
          <ul className="space-y-2">
            {prediccion.acciones_recomendadas.map((accion, idx) => (
              <li key={idx} className="text-sm text-blue-700 flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-200 text-blue-800
                  flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {idx + 1}
                </span>
                {accion}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Información adicional */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-800">
            {prediccion.dias_estimados_entrega || '5'}
          </div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">
            Días est. entrega
          </div>
        </div>
        <div className="bg-white border rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-800">
            {Math.round((prediccion.confianza || 0.5) * 100)}%
          </div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">
            Confianza del modelo
          </div>
        </div>
      </div>

      {/* Botón para nueva predicción */}
      <button
        onClick={onNuevaPrediccion}
        className="w-full py-3 px-6 rounded-lg font-medium text-blue-600
          bg-blue-50 hover:bg-blue-100 border border-blue-200
          flex items-center justify-center gap-2 transition-all duration-200"
      >
        <RefreshCw className="w-5 h-5" />
        Nueva Predicción
      </button>
    </div>
  );
}

export default PredictorRetrasos;
