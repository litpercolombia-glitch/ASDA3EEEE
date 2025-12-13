// components/Admin/LearningCenter/LearningDashboard.tsx
// Dashboard del Sistema de Aprendizaje Automático

import React, { useState } from 'react';
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  CheckCircle,
  Clock,
  Target,
  Zap,
  RefreshCw,
  Eye,
  EyeOff,
  ChevronRight,
  Activity,
  BarChart2,
  Calendar,
  Settings,
  Play,
  Pause,
  X
} from 'lucide-react';
import { useLearning, type LearningPattern, type Insight, type Prediction, type BusinessRule } from '../../../services/learningService';

export function LearningDashboard() {
  const {
    patterns,
    predictions,
    insights,
    rules,
    snapshots,
    isLearning,
    lastLearningRun,
    modelAccuracy,
    runLearning,
    generatePredictions,
    markInsightRead,
    dismissInsight,
    addRule,
    toggleRule,
    deleteRule,
    unreadInsights,
    criticalInsights,
    activePatterns,
  } = useLearning();

  const [activeTab, setActiveTab] = useState<'overview' | 'patterns' | 'predictions' | 'insights' | 'rules'>('overview');
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [newRule, setNewRule] = useState({
    name: '',
    condition: '',
    action: '',
    isAutomatic: true,
    isActive: true,
  });

  const handleRunLearning = async () => {
    await runLearning();
  };

  const handleGeneratePredictions = () => {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const monthStr = nextMonth.toISOString().slice(0, 7);
    generatePredictions(monthStr);
  };

  const handleAddRule = () => {
    if (newRule.name && newRule.condition && newRule.action) {
      addRule(newRule);
      setNewRule({ name: '', condition: '', action: '', isAutomatic: true, isActive: true });
      setShowRuleModal(false);
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-400 bg-red-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20';
      case 'low': return 'text-green-400 bg-green-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-400 bg-red-500/20 border-red-500/50';
      case 'high': return 'text-orange-400 bg-orange-500/20 border-orange-500/50';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/50';
      case 'low': return 'text-green-400 bg-green-500/20 border-green-500/50';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/50';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'opportunity': return <TrendingUp className="w-5 h-5 text-green-400" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-red-400" />;
      case 'trend': return <Activity className="w-5 h-5 text-blue-400" />;
      case 'recommendation': return <Lightbulb className="w-5 h-5 text-yellow-400" />;
      default: return <Brain className="w-5 h-5 text-purple-400" />;
    }
  };

  const tabs = [
    { id: 'overview', label: 'Resumen', icon: Brain },
    { id: 'patterns', label: 'Patrones', icon: Activity, count: activePatterns.length },
    { id: 'predictions', label: 'Predicciones', icon: Target, count: predictions.length },
    { id: 'insights', label: 'Insights', icon: Lightbulb, count: unreadInsights.length },
    { id: 'rules', label: 'Reglas', icon: Settings, count: rules.filter(r => r.isActive).length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-500/20 rounded-xl">
            <Brain className="w-8 h-8 text-purple-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Sistema de Aprendizaje</h2>
            <p className="text-gray-400">IA que aprende de tu negocio y te ayuda a crecer</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {lastLearningRun && (
            <div className="text-sm text-gray-400">
              Último análisis: {new Date(lastLearningRun).toLocaleString('es-CO')}
            </div>
          )}
          <button
            onClick={handleRunLearning}
            disabled={isLearning}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLearning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Analizando...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Ejecutar Análisis
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Precisión del Modelo</p>
              <p className="text-2xl font-bold text-white">{(modelAccuracy * 100).toFixed(0)}%</p>
            </div>
            <div className="p-3 bg-green-500/20 rounded-lg">
              <Target className="w-6 h-6 text-green-400" />
            </div>
          </div>
          <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all"
              style={{ width: `${modelAccuracy * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Patrones Detectados</p>
              <p className="text-2xl font-bold text-white">{activePatterns.length}</p>
            </div>
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <Activity className="w-6 h-6 text-blue-400" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {patterns.filter(p => p.impact === 'high').length} de alto impacto
          </p>
        </div>

        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Insights Pendientes</p>
              <p className="text-2xl font-bold text-white">{unreadInsights.length}</p>
            </div>
            <div className="p-3 bg-yellow-500/20 rounded-lg">
              <Lightbulb className="w-6 h-6 text-yellow-400" />
            </div>
          </div>
          {criticalInsights.length > 0 && (
            <p className="text-sm text-red-400 mt-2">
              {criticalInsights.length} críticos requieren atención
            </p>
          )}
        </div>

        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Reglas Activas</p>
              <p className="text-2xl font-bold text-white">{rules.filter(r => r.isActive).length}</p>
            </div>
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <Settings className="w-6 h-6 text-purple-400" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {rules.reduce((sum, r) => sum + r.triggerCount, 0)} activaciones totales
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-700 pb-2 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className={`px-2 py-0.5 text-xs rounded-full ${
                activeTab === tab.id ? 'bg-purple-500' : 'bg-gray-600'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={handleRunLearning}
                disabled={isLearning}
                className="p-4 bg-gray-800/50 rounded-xl border border-gray-700 hover:border-purple-500 transition-colors text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30">
                    <Brain className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Analizar Datos</p>
                    <p className="text-sm text-gray-400">Detectar nuevos patrones</p>
                  </div>
                </div>
              </button>

              <button
                onClick={handleGeneratePredictions}
                className="p-4 bg-gray-800/50 rounded-xl border border-gray-700 hover:border-blue-500 transition-colors text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30">
                    <Target className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Generar Predicciones</p>
                    <p className="text-sm text-gray-400">Para el próximo mes</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setShowRuleModal(true)}
                className="p-4 bg-gray-800/50 rounded-xl border border-gray-700 hover:border-green-500 transition-colors text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/20 rounded-lg group-hover:bg-green-500/30">
                    <Settings className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Nueva Regla</p>
                    <p className="text-sm text-gray-400">Automatizar acciones</p>
                  </div>
                </div>
              </button>
            </div>

            {/* Recent Insights Preview */}
            <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-400" />
                  Últimos Insights
                </h3>
                <button
                  onClick={() => setActiveTab('insights')}
                  className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1"
                >
                  Ver todos <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                {insights.filter(i => !i.isDismissed).slice(0, 3).map((insight) => (
                  <div
                    key={insight.id}
                    className={`p-3 rounded-lg border ${getPriorityColor(insight.priority)} ${
                      !insight.isRead ? 'bg-opacity-20' : 'bg-opacity-10'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {getCategoryIcon(insight.category)}
                      <div className="flex-1">
                        <p className="font-medium text-white">{insight.title}</p>
                        <p className="text-sm text-gray-400">{insight.description}</p>
                      </div>
                      <span className={`px-2 py-0.5 text-xs rounded ${getPriorityColor(insight.priority)}`}>
                        {insight.priority}
                      </span>
                    </div>
                  </div>
                ))}
                {insights.length === 0 && (
                  <p className="text-center text-gray-500 py-4">
                    Ejecuta un análisis para generar insights
                  </p>
                )}
              </div>
            </div>

            {/* Top Patterns Preview */}
            <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-400" />
                  Patrones Principales
                </h3>
                <button
                  onClick={() => setActiveTab('patterns')}
                  className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1"
                >
                  Ver todos <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {patterns.filter(p => p.impact === 'high').slice(0, 4).map((pattern) => (
                  <div
                    key={pattern.id}
                    className="p-3 bg-gray-700/50 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-white">{pattern.name}</span>
                      <span className={`px-2 py-0.5 text-xs rounded ${getImpactColor(pattern.impact)}`}>
                        {pattern.impact}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 line-clamp-2">{pattern.description}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 bg-gray-600 rounded-full h-1.5">
                        <div
                          className="bg-purple-500 h-1.5 rounded-full"
                          style={{ width: `${pattern.confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400">{(pattern.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                ))}
              </div>
              {patterns.length === 0 && (
                <p className="text-center text-gray-500 py-4">
                  Ejecuta un análisis para detectar patrones
                </p>
              )}
            </div>
          </div>
        )}

        {/* Patterns Tab */}
        {activeTab === 'patterns' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-gray-400">
                {patterns.length} patrones detectados en tu negocio
              </p>
              <div className="flex gap-2">
                {['all', 'sales', 'delivery', 'advertising', 'behavior'].map((filter) => (
                  <button
                    key={filter}
                    className="px-3 py-1 text-sm rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600"
                  >
                    {filter === 'all' ? 'Todos' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {patterns.map((pattern) => (
                <div
                  key={pattern.id}
                  className="bg-gray-800/50 rounded-xl border border-gray-700 p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 text-xs rounded ${
                        pattern.type === 'sales' ? 'bg-green-500/20 text-green-400' :
                        pattern.type === 'delivery' ? 'bg-blue-500/20 text-blue-400' :
                        pattern.type === 'advertising' ? 'bg-purple-500/20 text-purple-400' :
                        pattern.type === 'seasonal' ? 'bg-orange-500/20 text-orange-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {pattern.type}
                      </span>
                      <span className={`px-2 py-0.5 text-xs rounded ${getImpactColor(pattern.impact)}`}>
                        {pattern.impact}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-400">
                      <Target className="w-4 h-4" />
                      {(pattern.confidence * 100).toFixed(0)}%
                    </div>
                  </div>
                  <h4 className="font-medium text-white mb-2">{pattern.name}</h4>
                  <p className="text-sm text-gray-400 mb-3">{pattern.description}</p>
                  <div className="text-xs text-gray-500">
                    Detectado: {new Date(pattern.detectedAt).toLocaleDateString('es-CO')}
                  </div>
                </div>
              ))}
            </div>

            {patterns.length === 0 && (
              <div className="text-center py-12">
                <Brain className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No hay patrones detectados aún</p>
                <button
                  onClick={handleRunLearning}
                  className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Ejecutar Análisis
                </button>
              </div>
            )}
          </div>
        )}

        {/* Predictions Tab */}
        {activeTab === 'predictions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-gray-400">
                {predictions.length} predicciones generadas
              </p>
              <button
                onClick={handleGeneratePredictions}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Target className="w-4 h-4" />
                Nueva Predicción
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Tipo</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Período</th>
                    <th className="text-right py-3 px-4 text-gray-400 font-medium">Predicción</th>
                    <th className="text-right py-3 px-4 text-gray-400 font-medium">Real</th>
                    <th className="text-right py-3 px-4 text-gray-400 font-medium">Precisión</th>
                    <th className="text-center py-3 px-4 text-gray-400 font-medium">Confianza</th>
                  </tr>
                </thead>
                <tbody>
                  {predictions.map((prediction) => (
                    <tr key={prediction.id} className="border-b border-gray-700/50">
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 text-xs rounded ${
                          prediction.type === 'demand' ? 'bg-green-500/20 text-green-400' :
                          prediction.type === 'revenue' ? 'bg-blue-500/20 text-blue-400' :
                          prediction.type === 'roas' ? 'bg-purple-500/20 text-purple-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {prediction.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-white">{prediction.period}</td>
                      <td className="py-3 px-4 text-right text-white">
                        {prediction.type === 'revenue'
                          ? `$${prediction.predicted.toLocaleString()}`
                          : prediction.type === 'roas'
                            ? `${prediction.predicted.toFixed(1)}x`
                            : prediction.predicted.toLocaleString()
                        }
                      </td>
                      <td className="py-3 px-4 text-right text-gray-400">
                        {prediction.actual !== undefined
                          ? prediction.type === 'revenue'
                            ? `$${prediction.actual.toLocaleString()}`
                            : prediction.actual.toLocaleString()
                          : '-'
                        }
                      </td>
                      <td className="py-3 px-4 text-right">
                        {prediction.accuracy !== undefined ? (
                          <span className={`${
                            prediction.accuracy > 0.8 ? 'text-green-400' :
                            prediction.accuracy > 0.6 ? 'text-yellow-400' :
                            'text-red-400'
                          }`}>
                            {(prediction.accuracy * 100).toFixed(0)}%
                          </span>
                        ) : '-'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 bg-gray-700 rounded-full h-1.5">
                            <div
                              className="bg-purple-500 h-1.5 rounded-full"
                              style={{ width: `${prediction.confidence * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-400">{(prediction.confidence * 100).toFixed(0)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {predictions.length === 0 && (
              <div className="text-center py-12">
                <Target className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No hay predicciones generadas</p>
                <button
                  onClick={handleGeneratePredictions}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Generar Predicciones
                </button>
              </div>
            )}
          </div>
        )}

        {/* Insights Tab */}
        {activeTab === 'insights' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-gray-400">
                {unreadInsights.length} insights sin leer
              </p>
            </div>

            <div className="space-y-3">
              {insights.filter(i => !i.isDismissed).map((insight) => (
                <div
                  key={insight.id}
                  className={`bg-gray-800/50 rounded-xl border p-4 ${
                    !insight.isRead ? 'border-purple-500/50' : 'border-gray-700'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {getCategoryIcon(insight.category)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium text-white">{insight.title}</h4>
                        <span className={`px-2 py-0.5 text-xs rounded ${getPriorityColor(insight.priority)}`}>
                          {insight.priority}
                        </span>
                        {!insight.isRead && (
                          <span className="px-2 py-0.5 text-xs bg-purple-500/20 text-purple-400 rounded">
                            Nuevo
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400 mb-2">{insight.description}</p>
                      <p className="text-sm text-green-400 mb-2">
                        <strong>Impacto:</strong> {insight.impact}
                      </p>
                      {insight.action && (
                        <p className="text-sm text-blue-400">
                          <strong>Acción sugerida:</strong> {insight.action}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      {!insight.isRead && (
                        <button
                          onClick={() => markInsightRead(insight.id)}
                          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg"
                          title="Marcar como leído"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => dismissInsight(insight.id)}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg"
                        title="Descartar"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {insights.filter(i => !i.isDismissed).length === 0 && (
              <div className="text-center py-12">
                <Lightbulb className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No hay insights pendientes</p>
                <button
                  onClick={handleRunLearning}
                  className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Ejecutar Análisis
                </button>
              </div>
            )}
          </div>
        )}

        {/* Rules Tab */}
        {activeTab === 'rules' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-gray-400">
                {rules.filter(r => r.isActive).length} reglas activas
              </p>
              <button
                onClick={() => setShowRuleModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Settings className="w-4 h-4" />
                Nueva Regla
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className={`bg-gray-800/50 rounded-xl border p-4 ${
                    rule.isActive ? 'border-green-500/50' : 'border-gray-700'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-medium text-white">{rule.name}</h4>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleRule(rule.id)}
                        className={`p-1.5 rounded-lg ${
                          rule.isActive
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-gray-700 text-gray-400'
                        }`}
                      >
                        {rule.isActive ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => deleteRule(rule.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/20"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-400">
                      <span className="text-yellow-400">SI:</span> {rule.condition}
                    </p>
                    <p className="text-gray-400">
                      <span className="text-green-400">ENTONCES:</span> {rule.action}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                    <span>{rule.isAutomatic ? 'Automática' : 'Manual'}</span>
                    <span>{rule.triggerCount} activaciones</span>
                  </div>
                </div>
              ))}
            </div>

            {rules.length === 0 && (
              <div className="text-center py-12">
                <Settings className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 mb-2">No hay reglas configuradas</p>
                <p className="text-sm text-gray-500 mb-4">
                  Las reglas te permiten automatizar acciones basadas en condiciones
                </p>
                <button
                  onClick={() => setShowRuleModal(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Crear Primera Regla
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Rule Modal */}
      {showRuleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Nueva Regla de Negocio</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nombre</label>
                <input
                  type="text"
                  value={newRule.name}
                  onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Ej: Alerta de bajo ROAS"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Condición (SI...)</label>
                <input
                  type="text"
                  value={newRule.condition}
                  onChange={(e) => setNewRule({ ...newRule, condition: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Ej: ROAS < 2.5"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Acción (ENTONCES...)</label>
                <input
                  type="text"
                  value={newRule.action}
                  onChange={(e) => setNewRule({ ...newRule, action: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Ej: Enviar alerta por email"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newRule.isAutomatic}
                  onChange={(e) => setNewRule({ ...newRule, isAutomatic: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-600 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-300">Ejecutar automáticamente</span>
              </label>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowRuleModal(false)}
                className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddRule}
                disabled={!newRule.name || !newRule.condition || !newRule.action}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Crear Regla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LearningDashboard;
