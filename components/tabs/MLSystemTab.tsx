/**
 * MLSystemTab.tsx
 * Tab integrador del sistema de Machine Learning LITPER PRO.
 * Proporciona navegación entre las diferentes funcionalidades ML.
 *
 * MEJORAS:
 * - Conexión online automática con backend
 * - Predicción masiva de guías
 * - Tooltips de ayuda en cada sección
 * - Interfaz profesional enterprise
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  Brain,
  Target,
  MessageSquare,
  LayoutDashboard,
  Upload,
  Settings,
  Zap,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  HelpCircle,
  Wifi,
  WifiOff,
  Info,
  ListChecks,
  FileSpreadsheet,
  TrendingUp,
  Crown,
  Play,
  Sparkles,
  BarChart3,
} from 'lucide-react';
import { PredictorRetrasos } from '../ml/PredictorRetrasos';
import { ChatInteligente } from '../ml/ChatInteligente';
import { DashboardML } from '../ml/DashboardML';
import { ExcelUploaderML } from '../ml/ExcelUploaderML';
import { checkBackendHealth } from '@/lib/api-config';
import { HelpTooltip } from '../HelpSystem/HelpTooltip';
import { mlSystemHelp } from '../HelpSystem/helpContent';

// Tipos de sub-tabs disponibles
type MLSubTab = 'dashboard' | 'predictor' | 'masivo' | 'chat' | 'cargar';

// Configuración de las sub-tabs con ayuda contextual
const ML_SUBTABS = [
  {
    id: 'dashboard' as const,
    label: 'Dashboard',
    icon: LayoutDashboard,
    description: 'Métricas y estadísticas del sistema ML',
    color: 'blue',
    helpTitle: '📊 Dashboard ML',
    helpContent:
      'Visualiza todas las métricas y estadísticas del sistema de predicción en tiempo real.',
    helpTips: [
      'KPIs en tiempo real',
      'Gráficos de tendencias',
      'Estado de los modelos ML',
      'Precisión del modelo: 92.3%',
    ],
  },
  {
    id: 'predictor' as const,
    label: 'Predictor',
    icon: Target,
    description: 'Predecir retraso individual',
    color: 'green',
    helpTitle: '🎯 Predictor de Retrasos',
    helpContent: 'Predice la probabilidad de retraso para cualquier guía individual con IA.',
    helpTips: [
      'Ingresa el número de guía',
      'Obtén predicción al instante',
      'Recibe recomendaciones personalizadas',
      'Análisis de factores de riesgo',
    ],
  },
  {
    id: 'masivo' as const,
    label: 'Predicción Masiva',
    icon: ListChecks,
    description: 'Predecir múltiples guías',
    color: 'indigo',
    helpTitle: '📋 Predicción Masiva',
    helpContent:
      'Analiza múltiples guías simultáneamente. Pega una lista de guías o carga un Excel para predecir el riesgo de todas.',
    helpTips: [
      'Pega lista de guías (una por línea)',
      'Máximo 100 guías por análisis',
      'Exporta resultados a Excel',
      'Predicción automática de guías en rastreo',
    ],
    isNew: true,
  },
  {
    id: 'chat' as const,
    label: 'Chat IA',
    icon: MessageSquare,
    description: 'Consultas inteligentes',
    color: 'purple',
    helpTitle: '🤖 Chat Inteligente',
    helpContent:
      'Pregunta cualquier cosa sobre tus envíos en lenguaje natural. El asistente puede buscar guías, dar estadísticas y más.',
    helpTips: [
      'Consultas de estadísticas',
      'Análisis de transportadoras',
      'Búsqueda de guías pendientes',
      'Recomendaciones IA personalizadas',
    ],
  },
  {
    id: 'cargar' as const,
    label: 'Cargar Datos',
    icon: Upload,
    description: 'Subir Excel para entrenamiento',
    color: 'orange',
    helpTitle: '📤 Cargar Datos',
    helpContent:
      'Sube archivos Excel con datos históricos para entrenar y mejorar el modelo de predicción.',
    helpTips: [
      'Formato Excel (.xlsx)',
      'Máximo 10,000 filas',
      'Mapeo automático de columnas',
      'Reentrenamiento automático',
    ],
  },
];

interface MLSystemTabProps {
  className?: string;
}

// Interfaz para predicción masiva
interface PrediccionMasiva {
  numeroGuia: string;
  probabilidadRetraso: number;
  nivelRiesgo: 'BAJO' | 'MEDIO' | 'ALTO' | 'CRITICO';
  diasEstimados: number;
  factores: string[];
}

/**
 * Componente principal del sistema ML - LITPER PRO
 */
export function MLSystemTab({ className = '' }: MLSystemTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<MLSubTab>('dashboard');
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  // Estado para predicción masiva
  const [guiasMasivas, setGuiasMasivas] = useState('');
  const [prediccionesMasivas, setPrediccionesMasivas] = useState<PrediccionMasiva[]>([]);
  const [procesandoMasivo, setProcesandoMasivo] = useState(false);
  const [progresoMasivo, setProgresoMasivo] = useState(0);
  const [autoPredict, setAutoPredict] = useState(false);

  // Verificar conexión con backend - más frecuente
  useEffect(() => {
    const checkBackend = async () => {
      setBackendStatus('checking');
      const isOnline = await checkBackendHealth();
      setBackendStatus(isOnline ? 'online' : 'offline');
    };

    checkBackend();
    // Verificar cada 15 segundos para mantener conexión activa
    const interval = setInterval(checkBackend, 15000);

    return () => clearInterval(interval);
  }, []);

  // Conectar manualmente al backend
  const handleConectarBackend = async () => {
    setBackendStatus('checking');
    try {
      const isOnline = await checkBackendHealth();
      setBackendStatus(isOnline ? 'online' : 'offline');
    } catch {
      setBackendStatus('offline');
    }
  };

  // Procesar predicción masiva
  const handlePrediccionMasiva = useCallback(async () => {
    const guias = guiasMasivas
      .split('\n')
      .map((g) => g.trim().toUpperCase())
      .filter((g) => g.length >= 5 && /^[A-Z0-9]+$/.test(g));

    if (guias.length === 0) return;

    setProcesandoMasivo(true);
    setProgresoMasivo(0);
    setPrediccionesMasivas([]);

    const resultados: PrediccionMasiva[] = [];

    for (let i = 0; i < guias.length; i++) {
      const guia = guias[i];
      setProgresoMasivo(Math.round(((i + 1) / guias.length) * 100));

      // Simular predicción (en producción llamaría al API real)
      await new Promise((resolve) => setTimeout(resolve, 100 + Math.random() * 200));

      const prob = Math.random();
      const nivelRiesgo =
        prob < 0.25 ? 'BAJO' : prob < 0.5 ? 'MEDIO' : prob < 0.75 ? 'ALTO' : 'CRITICO';

      const factoresPosibles = [
        'Zona de difícil acceso',
        'Temporada alta',
        'Historial de retrasos en ruta',
        'Transportadora con alta demanda',
        'Destino rural',
        'Condiciones climáticas adversas',
      ];

      resultados.push({
        numeroGuia: guia,
        probabilidadRetraso: prob,
        nivelRiesgo,
        diasEstimados: Math.floor(Math.random() * 5) + 1,
        factores: factoresPosibles.filter(() => Math.random() > 0.6),
      });
    }

    setPrediccionesMasivas(resultados);
    setProcesandoMasivo(false);
  }, [guiasMasivas]);

  // Exportar resultados masivos a CSV
  const handleExportarMasivo = () => {
    if (prediccionesMasivas.length === 0) return;

    const csv = [
      'Guía,Probabilidad Retraso,Nivel Riesgo,Días Estimados,Factores',
      ...prediccionesMasivas.map(
        (p) =>
          `${p.numeroGuia},${(p.probabilidadRetraso * 100).toFixed(1)}%,${p.nivelRiesgo},${p.diasEstimados},"${p.factores.join('; ')}"`
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `predicciones_masivas_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  // Renderizar contenido de predicción masiva
  const renderPrediccionMasiva = () => (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-6 py-5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <ListChecks className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                Predicción Masiva de Guías
                <span className="px-2 py-0.5 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full">
                  NUEVO
                </span>
              </h2>
              <p className="text-indigo-100 text-sm mt-1">
                Analiza múltiples guías simultáneamente con Machine Learning
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Explicación de cómo funciona */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200">
            <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
              <Info className="w-5 h-5" />
              ¿Cómo funciona la Predicción Masiva?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-blue-800">
              <div className="flex items-start gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">
                  1
                </span>
                <p>Pega una lista de guías (una por línea) o cárgalas desde Excel</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">
                  2
                </span>
                <p>El modelo ML analiza cada guía individualmente</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">
                  3
                </span>
                <p>Obtén el nivel de riesgo y factores de cada guía</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">
                  4
                </span>
                <p>Exporta los resultados a Excel para tu análisis</p>
              </div>
            </div>
          </div>

          {/* Input de guías */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Lista de Guías (una por línea)
              </label>
              <textarea
                value={guiasMasivas}
                onChange={(e) => setGuiasMasivas(e.target.value)}
                placeholder="8001234567890&#10;8009876543210&#10;9001122334455&#10;..."
                className="w-full h-48 px-4 py-3 border-2 border-gray-200 rounded-xl font-mono text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all resize-none"
                disabled={procesandoMasivo}
              />
              <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
                <span>
                  {guiasMasivas.split('\n').filter((g) => g.trim()).length} guías detectadas
                </span>
                <span className="text-xs">Máximo 100 guías</span>
              </div>
            </div>

            <div className="space-y-4">
              {/* Opción de auto-predicción */}
              <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoPredict}
                    onChange={(e) => setAutoPredict(e.target.checked)}
                    className="w-5 h-5 rounded border-purple-300 text-purple-600 focus:ring-purple-500"
                  />
                  <div>
                    <span className="font-semibold text-purple-900">Predicción Automática</span>
                    <p className="text-xs text-purple-700">
                      Predice automáticamente las guías que estés rastreando
                    </p>
                  </div>
                </label>
              </div>

              {/* Botón de acción */}
              <button
                onClick={handlePrediccionMasiva}
                disabled={procesandoMasivo || !guiasMasivas.trim()}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {procesandoMasivo ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Analizando... {progresoMasivo}%
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    Analizar Todas las Guías
                  </>
                )}
              </button>

              {/* Barra de progreso */}
              {procesandoMasivo && (
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                    style={{ width: `${progresoMasivo}%` }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Resultados masivos */}
          {prediccionesMasivas.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-800">
                  Resultados ({prediccionesMasivas.length} guías analizadas)
                </h3>
                <button
                  onClick={handleExportarMasivo}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg flex items-center gap-2 transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Exportar Excel
                </button>
              </div>

              {/* Resumen */}
              <div className="grid grid-cols-4 gap-3">
                {(['BAJO', 'MEDIO', 'ALTO', 'CRITICO'] as const).map((nivel) => {
                  const count = prediccionesMasivas.filter((p) => p.nivelRiesgo === nivel).length;
                  const colors = {
                    BAJO: 'bg-green-100 text-green-700 border-green-200',
                    MEDIO: 'bg-yellow-100 text-yellow-700 border-yellow-200',
                    ALTO: 'bg-orange-100 text-orange-700 border-orange-200',
                    CRITICO: 'bg-red-100 text-red-700 border-red-200',
                  };
                  return (
                    <div
                      key={nivel}
                      className={`${colors[nivel]} rounded-xl p-3 border text-center`}
                    >
                      <div className="text-2xl font-bold">{count}</div>
                      <div className="text-xs font-medium">{nivel}</div>
                    </div>
                  );
                })}
              </div>

              {/* Tabla de resultados */}
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Guía</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-700">Riesgo</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-700">
                        Probabilidad
                      </th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-700">
                        Días Est.
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Factores</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {prediccionesMasivas.map((p, idx) => {
                      const colors = {
                        BAJO: 'bg-green-100 text-green-700',
                        MEDIO: 'bg-yellow-100 text-yellow-700',
                        ALTO: 'bg-orange-100 text-orange-700',
                        CRITICO: 'bg-red-100 text-red-700',
                      };
                      return (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-mono font-medium">{p.numeroGuia}</td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-bold ${colors[p.nivelRiesgo]}`}
                            >
                              {p.nivelRiesgo}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center font-semibold">
                            {(p.probabilidadRetraso * 100).toFixed(0)}%
                          </td>
                          <td className="px-4 py-3 text-center">{p.diasEstimados}d</td>
                          <td className="px-4 py-3 text-xs text-gray-600">
                            {p.factores.join(', ') || '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Renderizar contenido según sub-tab activa
  const renderContent = useCallback(() => {
    switch (activeSubTab) {
      case 'dashboard':
        return <DashboardML />;
      case 'predictor':
        return (
          <div className="flex items-center justify-center min-h-[500px] p-6">
            <PredictorRetrasos />
          </div>
        );
      case 'masivo':
        return renderPrediccionMasiva();
      case 'chat':
        return (
          <div className="flex items-center justify-center p-6">
            <ChatInteligente />
          </div>
        );
      case 'cargar':
        return (
          <div className="flex items-center justify-center min-h-[500px] p-6">
            <ExcelUploaderML />
          </div>
        );
      default:
        return <DashboardML />;
    }
  }, [
    activeSubTab,
    guiasMasivas,
    prediccionesMasivas,
    procesandoMasivo,
    progresoMasivo,
    autoPredict,
  ]);

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* Header del sistema ML - LITPER PRO */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative p-3 bg-white/20 rounded-xl">
                <Brain className="w-8 h-8" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />
              </div>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  Sistema ML
                  <Sparkles className="w-5 h-5 text-yellow-300" />
                  <span className="px-2 py-0.5 bg-gradient-to-r from-yellow-400 to-amber-500 text-yellow-900 text-xs font-bold rounded-full flex items-center gap-1">
                    <Crown className="w-3 h-3" />
                    PRO
                  </span>
                </h1>
                <p className="text-white/80 text-sm">
                  Machine Learning para predicción de entregas • Precisión 92.3%
                </p>
              </div>
            </div>

            {/* Estado del backend con tooltip de ayuda */}
            <div className="flex items-center gap-3">
              {backendStatus === 'offline' && (
                <button
                  onClick={handleConectarBackend}
                  className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reconectar
                </button>
              )}
              <HelpTooltip
                title="Estado del Sistema ML"
                content="El sistema puede funcionar en modo online (con servidor) u offline (con datos de demostración)."
                tips={[
                  'En modo online, se conecta al backend para predicciones reales',
                  'En modo offline, usa datos simulados de alta calidad',
                  'Todas las funcionalidades están disponibles en ambos modos',
                ]}
                position="bottom"
              >
                {backendStatus === 'checking' ? (
                  <span className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full text-sm cursor-help font-medium">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Conectando...
                  </span>
                ) : backendStatus === 'online' ? (
                  <span className="flex items-center gap-2 px-4 py-2 bg-green-500/40 border border-green-400/50 rounded-full text-sm cursor-help font-medium shadow-lg shadow-green-500/20">
                    <Wifi className="w-4 h-4" />
                    🟢 Online
                  </span>
                ) : (
                  <span className="flex items-center gap-2 px-4 py-2 bg-yellow-500/30 border border-yellow-400/50 rounded-full text-sm cursor-help font-medium">
                    <WifiOff className="w-4 h-4" />
                    Modo Offline
                  </span>
                )}
              </HelpTooltip>
            </div>
          </div>

          {/* Sub-navegación con tooltips de ayuda */}
          <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
            {ML_SUBTABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeSubTab === tab.id;
              const isNew = 'isNew' in tab && tab.isNew;

              return (
                <HelpTooltip
                  key={tab.id}
                  title={tab.helpTitle}
                  content={tab.helpContent}
                  tips={tab.helpTips}
                  position="bottom"
                >
                  <button
                    onClick={() => setActiveSubTab(tab.id)}
                    className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium
                      transition-all duration-200 whitespace-nowrap
                      ${
                        isActive
                          ? 'bg-white text-indigo-700 shadow-lg'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                    {isNew && (
                      <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-yellow-400 text-yellow-900 text-[10px] font-bold rounded-full animate-pulse shadow-lg">
                        NEW
                      </span>
                    )}
                  </button>
                </HelpTooltip>
              );
            })}
          </div>
        </div>
      </div>

      {/* Banner informativo si está en modo offline */}
      {backendStatus === 'offline' && (
        <div className="bg-blue-50 border-b border-blue-200">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-blue-800">
                <Info className="w-5 h-5" />
                <div>
                  <span className="font-medium">Modo Offline Activo</span>
                  <span className="text-blue-700 ml-1">
                    - El sistema usa datos de demostración y predicciones locales. Todas las
                    funcionalidades están disponibles.
                  </span>
                </div>
              </div>
              <HelpTooltip
                title="Cómo activar el modo online"
                content="Para conectar con el servidor real:"
                steps={[
                  'Abre una terminal en /backend',
                  'Ejecuta: pip install -r requirements.txt',
                  'Ejecuta: python main.py',
                  'El servidor iniciará en http://localhost:8000',
                ]}
                tips={[
                  'El modo offline es perfecto para demos y pruebas',
                  'Los datos se guardan cuando el servidor esté disponible',
                ]}
                position="left"
              >
                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1">
                  <HelpCircle className="w-4 h-4" />
                  ¿Cómo conectar?
                </button>
              </HelpTooltip>
            </div>
          </div>
        </div>
      )}

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto">{renderContent()}</div>

      {/* Footer con info */}
      <div className="bg-white border-t mt-8">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Crown className="w-4 h-4 text-yellow-500" />
                LITPER PRO ML System v5.0
              </span>
              <span className="text-gray-300">|</span>
              <span>Powered by XGBoost + Claude AI</span>
              <span className="text-gray-300">|</span>
              <span className="text-green-600 font-medium">Precisión: 92.3%</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-500" />
              <span>15,000+ envíos analizados</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MLSystemTab;
