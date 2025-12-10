// components/ProAssistant/tabs/ProTasksTab.tsx
// Tab de Tareas y Ejecucion del Asistente PRO
import React, { useState } from 'react';
import {
  Zap,
  BarChart3,
  Phone,
  MessageSquare,
  RefreshCw,
  TrendingUp,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Play,
  Pause,
  Trash2,
  Calendar,
  Target,
  FileSpreadsheet,
  Bell,
  Send,
  Download,
  Settings,
} from 'lucide-react';
import { useProAssistantStore, ProTask } from '../../../stores/proAssistantStore';

// ============================================
// ACCIONES RAPIDAS DISPONIBLES
// ============================================
const quickActions = [
  {
    id: 'report_daily',
    name: 'Reporte del dia',
    description: 'Genera informe completo',
    icon: BarChart3,
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'call_reclaims',
    name: 'Llamar Reclamos',
    description: 'Clientes en Reclamo Oficina',
    icon: Phone,
    color: 'from-emerald-500 to-green-500',
  },
  {
    id: 'whatsapp_bulk',
    name: 'WhatsApp Masivo',
    description: 'Mensajes a clientes',
    icon: MessageSquare,
    color: 'from-green-500 to-emerald-500',
  },
  {
    id: 'sync_carriers',
    name: 'Sincronizar Guias',
    description: 'Actualizar transportadoras',
    icon: RefreshCw,
    color: 'from-purple-500 to-violet-500',
  },
  {
    id: 'traffic_light',
    name: 'Semaforo Ciudades',
    description: 'Analisis de rutas',
    icon: Activity,
    color: 'from-amber-500 to-orange-500',
  },
  {
    id: 'ml_prediction',
    name: 'Prediccion ML',
    description: 'Analisis predictivo IA',
    icon: TrendingUp,
    color: 'from-pink-500 to-rose-500',
  },
];

// ============================================
// COMPONENTE DE ACCION RAPIDA
// ============================================
const QuickActionCard: React.FC<{
  action: typeof quickActions[0];
  onExecute: () => void;
  isExecuting: boolean;
}> = ({ action, onExecute, isExecuting }) => {
  return (
    <button
      onClick={onExecute}
      disabled={isExecuting}
      className={`
        relative overflow-hidden rounded-xl p-4
        bg-gradient-to-br ${action.color}
        text-white text-left
        transition-all duration-300
        hover:scale-105 hover:shadow-lg
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
        group
      `}
    >
      {/* Efecto de brillo */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

      <div className="relative z-10">
        <action.icon className={`w-6 h-6 mb-2 ${isExecuting ? 'animate-spin' : ''}`} />
        <h3 className="font-bold text-sm">{action.name}</h3>
        <p className="text-[10px] text-white/80">{action.description}</p>
      </div>
    </button>
  );
};

// ============================================
// COMPONENTE DE TAREA EN PROGRESO
// ============================================
const TaskItem: React.FC<{
  task: ProTask;
  onCancel?: () => void;
  onRemove: () => void;
}> = ({ task, onCancel, onRemove }) => {
  const getStatusIcon = () => {
    switch (task.status) {
      case 'running':
        return <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      case 'scheduled':
        return <Clock className="w-4 h-4 text-purple-400" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusColor = () => {
    switch (task.status) {
      case 'running':
        return 'bg-amber-500/20 border-amber-500/30';
      case 'completed':
        return 'bg-emerald-500/10 border-emerald-500/20';
      case 'error':
        return 'bg-red-500/10 border-red-500/20';
      case 'scheduled':
        return 'bg-purple-500/10 border-purple-500/20';
      default:
        return 'bg-slate-800/50 border-slate-700/50';
    }
  };

  const formatTime = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `Hace ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Hace ${hours}h`;
    return `Hace ${Math.floor(hours / 24)}d`;
  };

  return (
    <div className={`p-3 rounded-xl border ${getStatusColor()} transition-all`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {getStatusIcon()}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm text-white truncate">{task.name}</h4>
            {task.description && (
              <p className="text-xs text-slate-400 truncate">{task.description}</p>
            )}

            {/* Barra de progreso */}
            {task.status === 'running' && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>{task.progress}%</span>
                  <span>{Math.round((100 - task.progress) * 0.12)} seg restantes</span>
                </div>
                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-300"
                    style={{ width: `${task.progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Resultado o error */}
            {task.status === 'completed' && task.result && (
              <p className="text-xs text-emerald-400 mt-1">
                {typeof task.result === 'string' ? task.result : JSON.stringify(task.result).substring(0, 50)}
              </p>
            )}
            {task.status === 'error' && task.error && (
              <p className="text-xs text-red-400 mt-1">{task.error}</p>
            )}

            {/* Timestamp */}
            <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500">
              {task.status === 'completed' && task.completedAt && (
                <span>Completado {getTimeAgo(task.completedAt)}</span>
              )}
              {task.status === 'scheduled' && task.scheduledFor && (
                <span>Programado: {formatTime(task.scheduledFor)}</span>
              )}
              {task.status === 'running' && (
                <span>Iniciado {getTimeAgo(task.createdAt)}</span>
              )}
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-1">
          {task.status === 'running' && onCancel && (
            <button
              onClick={onCancel}
              className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
              title="Pausar"
            >
              <Pause className="w-3.5 h-3.5" />
            </button>
          )}
          {(task.status === 'completed' || task.status === 'error') && (
            <button
              onClick={onRemove}
              className="p-1.5 hover:bg-red-500/20 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
              title="Eliminar"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
const ProTasksTab: React.FC = () => {
  const {
    tasks,
    addTask,
    updateTask,
    removeTask,
    clearCompletedTasks,
    setIsProcessing,
    shipmentsContext,
  } = useProAssistantStore();

  const [executingAction, setExecutingAction] = useState<string | null>(null);

  // Ejecutar accion rapida
  const executeQuickAction = async (actionId: string) => {
    const action = quickActions.find((a) => a.id === actionId);
    if (!action) return;

    setExecutingAction(actionId);
    setIsProcessing(true);

    const taskId = `task_${Date.now()}`;

    // Agregar tarea
    addTask({
      name: action.name,
      description: action.description,
      status: 'running',
      progress: 0,
    });

    // Simular ejecucion
    for (let i = 0; i <= 100; i += 5) {
      await new Promise((r) => setTimeout(r, 100 + Math.random() * 100));
      updateTask(taskId, { progress: i });
    }

    // Generar resultado basado en la accion
    let result: any = null;

    switch (actionId) {
      case 'report_daily':
        result = {
          total: shipmentsContext.length,
          delivered: shipmentsContext.filter((s) => s.status?.toLowerCase().includes('entreg')).length,
          pending: shipmentsContext.filter((s) => s.novelty).length,
        };
        break;
      case 'call_reclaims':
        const reclaims = shipmentsContext.filter((s) =>
          s.novelty?.toLowerCase().includes('reclamo')
        ).length;
        result = `${reclaims} llamadas programadas`;
        break;
      case 'sync_carriers':
        result = `${shipmentsContext.length} guias sincronizadas`;
        break;
      default:
        result = 'Tarea completada';
    }

    updateTask(taskId, {
      status: 'completed',
      progress: 100,
      completedAt: new Date(),
      result,
    });

    setExecutingAction(null);
    setIsProcessing(false);
  };

  // Filtrar tareas
  const runningTasks = tasks.filter((t) => t.status === 'running');
  const completedTasks = tasks.filter((t) => t.status === 'completed');
  const scheduledTasks = tasks.filter((t) => t.status === 'scheduled');

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ============================================ */}
      {/* ACCIONES RAPIDAS */}
      {/* ============================================ */}
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-medium text-white">Acciones Rapidas</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {quickActions.map((action) => (
            <QuickActionCard
              key={action.id}
              action={action}
              onExecute={() => executeQuickAction(action.id)}
              isExecuting={executingAction === action.id}
            />
          ))}
        </div>
      </div>

      {/* ============================================ */}
      {/* LISTA DE TAREAS */}
      {/* ============================================ */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Tareas en progreso */}
        {runningTasks.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                En Progreso ({runningTasks.length})
              </span>
            </div>
            <div className="space-y-2">
              {runningTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onRemove={() => removeTask(task.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Tareas programadas */}
        {scheduledTasks.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Programadas ({scheduledTasks.length})
              </span>
            </div>
            <div className="space-y-2">
              {scheduledTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onRemove={() => removeTask(task.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Tareas completadas */}
        {completedTasks.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Completadas ({completedTasks.length})
                </span>
              </div>
              <button
                onClick={clearCompletedTasks}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                Limpiar
              </button>
            </div>
            <div className="space-y-2">
              {completedTasks.slice(0, 5).map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onRemove={() => removeTask(task.id)}
                />
              ))}
              {completedTasks.length > 5 && (
                <p className="text-xs text-slate-500 text-center py-2">
                  +{completedTasks.length - 5} tareas mas
                </p>
              )}
            </div>
          </div>
        )}

        {/* Estado vacio */}
        {tasks.length === 0 && (
          <div className="text-center py-12">
            <Target className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-slate-400 font-medium mb-1">Sin tareas activas</h3>
            <p className="text-xs text-slate-500">
              Usa las acciones rapidas para ejecutar tareas automaticas
            </p>
          </div>
        )}
      </div>

      {/* ============================================ */}
      {/* FOOTER CON PROGRAMACION */}
      {/* ============================================ */}
      <div className="p-4 border-t border-slate-700/50 bg-slate-900/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Calendar className="w-3.5 h-3.5" />
            <span>Proxima ejecucion programada: 8:00 AM</span>
          </div>
          <button className="text-xs text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1">
            <Settings className="w-3.5 h-3.5" />
            Configurar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProTasksTab;
