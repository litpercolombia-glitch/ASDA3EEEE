// components/Admin/MCPCenter/StitchDashboard.tsx
// Dashboard de Stitch MCP - Orquestación visual de pipelines entre plataformas

import React, { useState } from 'react';
import {
  Workflow,
  Play,
  Pause,
  Trash2,
  Plus,
  RefreshCw,
  Check,
  AlertTriangle,
  Clock,
  Zap,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Activity,
  BarChart3,
  Copy,
  Eye,
  Settings,
  Layers,
  GitBranch,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import {
  useStitchStore,
  STITCH_TEMPLATES,
  TEMPLATE_CATEGORIES,
  type StitchPipeline,
  type StitchRun,
  type StitchTemplate,
  type StitchNode,
} from '../../../services/mcpStitchService';
import { useMCPStore, PROVIDERS } from '../../../services/mcpConnectionsService';

// ============================================
// NODE VISUAL
// ============================================

const NodeBadge: React.FC<{ node: StitchNode; compact?: boolean }> = ({ node, compact }) => {
  const typeColors: Record<string, string> = {
    trigger: 'bg-blue-500',
    action: 'bg-purple-500',
    transform: 'bg-amber-500',
    condition: 'bg-cyan-500',
    output: 'bg-green-500',
  };

  const typeLabels: Record<string, string> = {
    trigger: 'Trigger',
    action: 'Acción',
    transform: 'Transformar',
    condition: 'Condición',
    output: 'Salida',
  };

  const providerIcon = node.provider === 'internal'
    ? '⚙️'
    : node.provider === 'webhook'
      ? '🔗'
      : PROVIDERS.find((p) => p.id === node.provider)?.icon || '📦';

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 dark:bg-navy-700 rounded-lg">
        <span className="text-sm">{providerIcon}</span>
        <span className="text-xs text-slate-600 dark:text-slate-300 truncate max-w-[100px]">
          {node.label}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 p-2 bg-white dark:bg-navy-800 rounded-lg border border-slate-200 dark:border-navy-600 shadow-sm">
      <div className={`w-2 h-2 rounded-full ${typeColors[node.type]}`} />
      <span className="text-lg">{providerIcon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-700 dark:text-white truncate">{node.label}</p>
        <p className="text-xs text-slate-400">{typeLabels[node.type]}</p>
      </div>
    </div>
  );
};

// ============================================
// PIPELINE FLOW VISUAL
// ============================================

const PipelineFlow: React.FC<{ nodes: StitchNode[] }> = ({ nodes }) => {
  return (
    <div className="flex items-center gap-1 overflow-x-auto py-2 px-1">
      {nodes.map((node, idx) => (
        <React.Fragment key={node.id}>
          <NodeBadge node={node} compact />
          {idx < nodes.length - 1 && (
            <ArrowRight className="w-3 h-3 text-slate-400 dark:text-slate-500 shrink-0" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

// ============================================
// PIPELINE CARD
// ============================================

const PipelineCard: React.FC<{
  pipeline: StitchPipeline;
  onRun: () => void;
  onToggle: () => void;
  onDelete: () => void;
  onViewRuns: () => void;
  isRunning: boolean;
}> = ({ pipeline, onRun, onToggle, onDelete, onViewRuns, isRunning }) => {
  const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
    active: { color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30', label: 'Activo' },
    paused: { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30', label: 'Pausado' },
    error: { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30', label: 'Error' },
    draft: { color: 'text-slate-500 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800', label: 'Borrador' },
  };

  const config = statusConfig[pipeline.status];

  return (
    <div className="bg-white dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-navy-700 overflow-hidden hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 dark:border-navy-700">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{pipeline.icon}</span>
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-white">{pipeline.name}</h3>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
                {config.label}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onRun}
              disabled={isRunning}
              className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors disabled:opacity-50"
              title="Ejecutar ahora"
            >
              {isRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              onClick={onToggle}
              className={`p-1.5 rounded-lg transition-colors ${
                pipeline.status === 'active'
                  ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                  : 'text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20'
              }`}
              title={pipeline.status === 'active' ? 'Pausar' : 'Activar'}
            >
              {pipeline.status === 'active' ? <Pause className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              title="Eliminar"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">{pipeline.description}</p>
      </div>

      {/* Flow Preview */}
      <div className="px-4 py-2 bg-slate-50 dark:bg-navy-900/50 border-b border-slate-100 dark:border-navy-700">
        <PipelineFlow nodes={pipeline.nodes} />
      </div>

      {/* Stats */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <Activity className="w-3 h-3" />
            {pipeline.runCount} ejecuciones
          </span>
          <span className="flex items-center gap-1">
            <BarChart3 className="w-3 h-3" />
            {pipeline.successRate}% éxito
          </span>
          {pipeline.lastRun && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(pipeline.lastRun).toLocaleString()}
            </span>
          )}
        </div>
        <button
          onClick={onViewRuns}
          className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 flex items-center gap-1"
        >
          <Eye className="w-3 h-3" />
          Ver historial
        </button>
      </div>
    </div>
  );
};

// ============================================
// TEMPLATE CARD
// ============================================

const TemplateCard: React.FC<{
  template: StitchTemplate;
  onUse: () => void;
}> = ({ template, onUse }) => {
  const connectedProviders = useMCPStore.getState().connections;

  return (
    <div className="bg-white dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-navy-700 p-4 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
      <div className="flex items-start gap-3 mb-3">
        <span className="text-2xl">{template.icon}</span>
        <div className="flex-1">
          <h4 className="font-semibold text-slate-800 dark:text-white">{template.name}</h4>
          <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-navy-700 text-slate-500 dark:text-slate-400">
            {TEMPLATE_CATEGORIES[template.category]}
          </span>
        </div>
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">{template.description}</p>

      {/* Required providers */}
      <div className="flex flex-wrap gap-1 mb-3">
        {template.providers.map((providerId) => {
          const provider = PROVIDERS.find((p) => p.id === providerId);
          const isConnected = connectedProviders.some(
            (c) => c.provider === providerId && c.status === 'connected'
          );
          return (
            <span
              key={providerId}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${
                isConnected
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  : 'bg-slate-100 dark:bg-navy-700 text-slate-500 dark:text-slate-400'
              }`}
            >
              <span>{provider?.icon}</span>
              {provider?.name}
              {isConnected && <Check className="w-3 h-3" />}
            </span>
          );
        })}
      </div>

      <button
        onClick={onUse}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
      >
        <Copy className="w-4 h-4" />
        Usar plantilla
      </button>
    </div>
  );
};

// ============================================
// RUN HISTORY PANEL
// ============================================

const RunHistoryPanel: React.FC<{
  runs: StitchRun[];
  onClose: () => void;
}> = ({ runs, onClose }) => {
  const [expandedRun, setExpandedRun] = useState<string | null>(null);

  const statusIcon: Record<string, React.ReactNode> = {
    success: <CheckCircle2 className="w-4 h-4 text-green-500" />,
    failed: <XCircle className="w-4 h-4 text-red-500" />,
    partial: <AlertCircle className="w-4 h-4 text-amber-500" />,
    running: <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />,
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-navy-800 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="p-6 border-b border-slate-200 dark:border-navy-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-500" />
            Historial de Ejecuciones
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-navy-700 rounded-lg transition-colors text-slate-400"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {runs.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Clock className="w-8 h-8 mx-auto mb-2" />
              <p>No hay ejecuciones registradas</p>
            </div>
          ) : (
            runs.map((run) => (
              <div
                key={run.id}
                className="border border-slate-200 dark:border-navy-700 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => setExpandedRun(expandedRun === run.id ? null : run.id)}
                  className="w-full p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-navy-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {statusIcon[run.status]}
                    <div className="text-left">
                      <p className="text-sm font-medium text-slate-700 dark:text-white">
                        {run.pipelineName}
                      </p>
                      <p className="text-xs text-slate-400">
                        {new Date(run.startedAt).toLocaleString()} • {run.dataProcessed} registros
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">
                      {run.nodesExecuted}/{run.totalNodes} nodos
                    </span>
                    {expandedRun === run.id ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </button>

                {expandedRun === run.id && (
                  <div className="border-t border-slate-200 dark:border-navy-700 p-3 bg-slate-50 dark:bg-navy-900/50">
                    <div className="space-y-1.5 font-mono text-xs">
                      {run.logs.map((log, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <span className="text-slate-400 w-16 shrink-0">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                          <span
                            className={`${
                              log.level === 'error'
                                ? 'text-red-500'
                                : log.level === 'success'
                                  ? 'text-green-500'
                                  : log.level === 'warning'
                                    ? 'text-amber-500'
                                    : 'text-slate-500'
                            }`}
                          >
                            [{log.level.toUpperCase()}]
                          </span>
                          <span className="text-slate-600 dark:text-slate-300">{log.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================
// COMPONENTE PRINCIPAL - STITCH DASHBOARD
// ============================================

export const StitchDashboard: React.FC = () => {
  const {
    pipelines,
    runs,
    isRunning,
    createFromTemplate,
    togglePipeline,
    deletePipeline,
    runPipeline,
    runAllActive,
    getPipelineRuns,
    getActiveCount,
    getTotalRuns,
    getOverallSuccessRate,
  } = useStitchStore();

  const [showTemplates, setShowTemplates] = useState(false);
  const [viewingRunsFor, setViewingRunsFor] = useState<string | null>(null);
  const [isRunningAll, setIsRunningAll] = useState(false);

  const activeCount = getActiveCount();
  const totalRuns = getTotalRuns();
  const successRate = getOverallSuccessRate();

  const handleRunPipeline = async (id: string) => {
    try {
      await runPipeline(id);
    } catch (error) {
      console.error('Error running pipeline:', error);
    }
  };

  const handleRunAll = async () => {
    setIsRunningAll(true);
    try {
      await runAllActive();
    } finally {
      setIsRunningAll(false);
    }
  };

  const handleCreateFromTemplate = (templateId: string) => {
    const pipeline = createFromTemplate(templateId);
    if (pipeline) {
      setShowTemplates(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-900 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl">
            <Workflow className="w-6 h-6 text-white" />
          </div>
          Stitch MCP
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Orquestador de pipelines - Conecta y automatiza flujos entre plataformas
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-navy-800 rounded-xl p-4 border border-slate-200 dark:border-navy-700">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm mb-1">
            <Layers className="w-4 h-4" />
            Pipelines
          </div>
          <p className="text-2xl font-bold text-slate-800 dark:text-white">{pipelines.length}</p>
        </div>
        <div className="bg-white dark:bg-navy-800 rounded-xl p-4 border border-slate-200 dark:border-navy-700">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm mb-1">
            <Zap className="w-4 h-4 text-green-500" />
            Activos
          </div>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{activeCount}</p>
        </div>
        <div className="bg-white dark:bg-navy-800 rounded-xl p-4 border border-slate-200 dark:border-navy-700">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm mb-1">
            <Activity className="w-4 h-4 text-blue-500" />
            Ejecuciones
          </div>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalRuns}</p>
        </div>
        <div className="bg-white dark:bg-navy-800 rounded-xl p-4 border border-slate-200 dark:border-navy-700">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm mb-1">
            <BarChart3 className="w-4 h-4 text-purple-500" />
            Tasa de éxito
          </div>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{successRate}%</p>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            <Plus className="w-4 h-4" />
            Nueva Pipeline
          </button>
          {activeCount > 0 && (
            <button
              onClick={handleRunAll}
              disabled={isRunningAll}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium disabled:opacity-50"
            >
              {isRunningAll ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Ejecutando...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Ejecutar todas ({activeCount})
                </>
              )}
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <GitBranch className="w-4 h-4" />
          {STITCH_TEMPLATES.length} plantillas disponibles
        </div>
      </div>

      {/* Templates Section */}
      {showTemplates && (
        <div className="mb-6">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-1 flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-500" />
              Plantillas de Pipeline
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Usa una plantilla pre-construida para empezar rápidamente
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {STITCH_TEMPLATES.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onUse={() => handleCreateFromTemplate(template.id)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Pipelines Grid */}
      {pipelines.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {pipelines.map((pipeline) => (
            <PipelineCard
              key={pipeline.id}
              pipeline={pipeline}
              onRun={() => handleRunPipeline(pipeline.id)}
              onToggle={() => togglePipeline(pipeline.id)}
              onDelete={() => deletePipeline(pipeline.id)}
              onViewRuns={() => setViewingRunsFor(pipeline.id)}
              isRunning={!!isRunning[pipeline.id]}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-navy-700">
          <Workflow className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-300 mb-2">
            No hay pipelines configurados
          </h3>
          <p className="text-slate-400 dark:text-slate-500 mb-4 max-w-md mx-auto">
            Crea tu primer pipeline usando una plantilla para automatizar flujos de datos entre tus plataformas conectadas
          </p>
          <button
            onClick={() => setShowTemplates(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            Crear Pipeline
          </button>
        </div>
      )}

      {/* Recent Runs */}
      {runs.length > 0 && (
        <div className="mt-6 bg-white dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-navy-700 p-4">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-white mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            Ejecuciones Recientes
          </h3>
          <div className="space-y-2">
            {runs.slice(-5).reverse().map((run) => (
              <div
                key={run.id}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-navy-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {run.status === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : run.status === 'failed' ? (
                    <XCircle className="w-4 h-4 text-red-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                  )}
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    {run.pipelineName}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span>{run.dataProcessed} registros</span>
                  <span>{new Date(run.startedAt).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Run History Modal */}
      {viewingRunsFor && (
        <RunHistoryPanel
          runs={getPipelineRuns(viewingRunsFor)}
          onClose={() => setViewingRunsFor(null)}
        />
      )}
    </div>
  );
};

export default StitchDashboard;
