// components/ChatFirst/SkillViews/AutomatizacionesSkillView.tsx
// Vista de Automatizaciones - Panel unificado de automatizacion
import React, { useState, useEffect, useCallback } from 'react';
import {
  Zap,
  Upload,
  FileSpreadsheet,
  Bell,
  MessageSquare,
  Clock,
  Settings,
  Play,
  Pause,
  Plus,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Loader2,
  Mail,
  Smartphone,
  History,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { Shipment } from '../../../types';
import {
  obtenerReglas,
  guardarReglas,
  procesarAutomatizaciones,
  generarAlertasInteligentes,
  obtenerHistorialEjecuciones,
  guardarEjecucion,
  eliminarRegla,
  crearReglaDesdeTemplate,
  PLANTILLAS_REGLAS,
  PLANTILLAS_WHATSAPP,
  type AutomationRule,
  type WorkflowExecution,
  type SmartAlert,
  type MessageTemplate,
} from '../../../services/automationService';

interface AutomatizacionesSkillViewProps {
  shipments: Shipment[];
  onChatQuery?: (query: string) => void;
  onFileUpload?: (file: File) => void;
}

interface QuickAction {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  action: () => void;
}

export const AutomatizacionesSkillView: React.FC<AutomatizacionesSkillViewProps> = ({
  shipments,
  onChatQuery,
  onFileUpload,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'quick' | 'rules' | 'history' | 'templates'>('quick');
  const [isRunning, setIsRunning] = useState(false);
  const [showRuleCreator, setShowRuleCreator] = useState(false);

  // Cargar reglas REALES desde automationService
  const [automations, setAutomations] = useState<AutomationRule[]>([]);
  const [historial, setHistorial] = useState<WorkflowExecution[]>([]);
  const [alertas, setAlertas] = useState<SmartAlert[]>([]);

  // Cargar reglas al montar
  useEffect(() => {
    const reglas = obtenerReglas();
    setAutomations(reglas);
    setHistorial(obtenerHistorialEjecuciones());
  }, []);

  // Actualizar historial periódicamente
  useEffect(() => {
    const interval = setInterval(() => {
      setHistorial(obtenerHistorialEjecuciones());
    }, 30000); // Cada 30 segundos
    return () => clearInterval(interval);
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsUploading(false);

    onFileUpload?.(file);
    onChatQuery?.(`Procesa el archivo Excel ${file.name}`);
  };

  // Toggle regla y PERSISTIR en localStorage
  const toggleAutomation = useCallback((id: string) => {
    setAutomations(prev => {
      const updated = prev.map(a =>
        a.id === id ? { ...a, activo: !a.activo } : a
      );
      guardarReglas(updated); // ✅ PERSISTIR EN LOCALSTORAGE
      return updated;
    });
  }, []);

  // Crear regla desde plantilla
  const handleCreateFromTemplate = useCallback((templateId: string) => {
    const nuevaRegla = crearReglaDesdeTemplate(templateId);
    if (nuevaRegla) {
      setAutomations(obtenerReglas());
      onChatQuery?.(`✅ Regla "${nuevaRegla.nombre}" creada exitosamente`);
      setShowRuleCreator(false);
    }
  }, [onChatQuery]);

  // Eliminar regla
  const handleDeleteRule = useCallback((reglaId: string, nombre: string) => {
    if (eliminarRegla(reglaId)) {
      setAutomations(obtenerReglas());
      onChatQuery?.(`🗑️ Regla "${nombre}" eliminada`);
    }
  }, [onChatQuery]);

  // Ejecutar automatizaciones REALES
  const runAutomations = useCallback(async () => {
    if (shipments.length === 0) {
      onChatQuery?.('No hay guías cargadas para procesar automatizaciones');
      return;
    }

    setIsRunning(true);

    try {
      // Ejecutar el motor de automatizaciones real
      const { ejecuciones, alertas: nuevasAlertas } = procesarAutomatizaciones(shipments, automations);

      // Guardar ejecuciones en historial
      ejecuciones.forEach(exec => guardarEjecucion(exec));

      // Generar alertas inteligentes
      const alertasIA = generarAlertasInteligentes(shipments);

      // Actualizar estado
      setHistorial(obtenerHistorialEjecuciones());
      setAlertas([...nuevasAlertas, ...alertasIA]);

      // Actualizar contador de ejecuciones en reglas
      setAutomations(prev => {
        const updated = prev.map(regla => {
          const ejecutada = ejecuciones.filter(e => e.reglaId === regla.id).length;
          if (ejecutada > 0) {
            return {
              ...regla,
              ejecutados: regla.ejecutados + ejecutada,
              ultimaEjecucion: new Date().toISOString(),
            };
          }
          return regla;
        });
        guardarReglas(updated);
        return updated;
      });

      // Mostrar resultado
      if (ejecuciones.length > 0) {
        onChatQuery?.(`✅ Se ejecutaron ${ejecuciones.length} automatizaciones para ${new Set(ejecuciones.map(e => e.guiaId)).size} guías`);
      } else {
        onChatQuery?.('No hay guías que cumplan las condiciones de las reglas activas');
      }
    } catch (error) {
      console.error('Error ejecutando automatizaciones:', error);
      onChatQuery?.('Error ejecutando automatizaciones');
    } finally {
      setIsRunning(false);
    }
  }, [shipments, automations, onChatQuery]);

  // Obtener descripción legible del trigger
  const getTriggerDescription = (regla: AutomationRule): string => {
    const { trigger } = regla;
    switch (trigger.tipo) {
      case 'time_threshold':
        return `>${trigger.condiciones.horasSinMovimiento}h sin movimiento`;
      case 'status_change':
        return `Estado: ${trigger.condiciones.nuevoEstado}`;
      case 'risk_level':
        return `Riesgo: ${trigger.condiciones.nivelMinimo}`;
      case 'multiple_attempts':
        return `${trigger.condiciones.intentosFallidos}+ intentos fallidos`;
      case 'schedule':
        return `Programado: ${trigger.condiciones.hora}`;
      default:
        return trigger.tipo;
    }
  };

  // Obtener descripción de acciones
  const getActionsDescription = (regla: AutomationRule): string => {
    return regla.acciones.map(a => {
      switch (a.tipo) {
        case 'send_whatsapp': return 'WhatsApp';
        case 'create_alert': return 'Alerta';
        case 'escalate': return 'Escalar';
        case 'notify_team': return 'Notificar';
        case 'tag_priority': return 'Priorizar';
        default: return a.tipo;
      }
    }).join(' + ');
  };

  const quickActions: QuickAction[] = [
    {
      id: 'run-now',
      name: 'Ejecutar Ahora',
      description: `Procesar ${shipments.length} guías`,
      icon: RefreshCw,
      color: 'from-accent-500 to-amber-500',
      action: runAutomations,
    },
    {
      id: 'upload',
      name: 'Cargar Excel',
      description: 'Importar guias desde archivo',
      icon: FileSpreadsheet,
      color: 'from-emerald-500 to-teal-500',
      action: () => document.getElementById('file-upload')?.click(),
    },
    {
      id: 'alert-team',
      name: 'Alertar Equipo',
      description: 'Enviar alerta inmediata',
      icon: Bell,
      color: 'from-red-500 to-orange-500',
      action: () => onChatQuery?.('Envia alerta al equipo sobre envios criticos'),
    },
    {
      id: 'message-clients',
      name: 'Mensajes Masivos',
      description: 'Notificar clientes afectados',
      icon: MessageSquare,
      color: 'from-blue-500 to-cyan-500',
      action: () => onChatQuery?.('Genera mensajes para clientes con envios retrasados'),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Hidden file input */}
      <input
        type="file"
        id="file-upload"
        accept=".xlsx,.xls,.csv"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 bg-white/5 rounded-xl">
        {[
          { id: 'quick', label: 'Acciones', icon: Zap },
          { id: 'rules', label: `Reglas (${automations.filter(a => a.activo).length})`, icon: Settings },
          { id: 'templates', label: 'Plantillas', icon: MessageSquare },
          { id: 'history', label: `Historial`, icon: History },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'quick' | 'rules' | 'history' | 'templates')}
            className={`flex-1 py-2 px-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1 ${
              activeTab === tab.id
                ? 'bg-accent-500 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Quick Actions Tab */}
      {activeTab === 'quick' && (
        <div className="space-y-4">
          {/* Upload Zone */}
          <label
            htmlFor="file-upload"
            className={`block p-6 border-2 border-dashed rounded-xl text-center cursor-pointer transition-all ${
              isUploading
                ? 'border-accent-500 bg-accent-500/10'
                : 'border-white/20 hover:border-white/40 hover:bg-white/5'
            }`}
          >
            {isUploading ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-10 h-10 text-accent-400 animate-spin" />
                <p className="text-white font-medium">Procesando archivo...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <Upload className="w-10 h-10 text-slate-400" />
                <div>
                  <p className="text-white font-medium">Arrastra un archivo o haz clic</p>
                  <p className="text-xs text-slate-500">.xlsx, .xls, .csv</p>
                </div>
              </div>
            )}
          </label>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <button
                key={action.id}
                onClick={action.action}
                disabled={action.id === 'run-now' && isRunning}
                className={`p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-left transition-all hover:scale-[1.02] ${
                  action.id === 'run-now' && isRunning ? 'opacity-70 cursor-wait' : ''
                }`}
              >
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center mb-3`}>
                  {action.id === 'run-now' && isRunning ? (
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  ) : (
                    <action.icon className="w-5 h-5 text-white" />
                  )}
                </div>
                <p className="font-medium text-white text-sm">
                  {action.id === 'run-now' && isRunning ? 'Procesando...' : action.name}
                </p>
                <p className="text-xs text-slate-400">{action.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Rules Tab */}
      {activeTab === 'rules' && (
        <div className="space-y-3">
          {automations.map((regla) => (
            <div
              key={regla.id}
              className={`p-4 rounded-xl border transition-all ${
                regla.activo
                  ? 'bg-white/5 border-white/20'
                  : 'bg-white/[0.02] border-white/10 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-white">{regla.nombre}</p>
                    {regla.activo && (
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">
                        Activa
                      </span>
                    )}
                    <span className="px-2 py-0.5 bg-slate-500/20 text-slate-400 text-xs rounded-full">
                      P{regla.prioridad}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{regla.descripcion}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {getTriggerDescription(regla)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      {getActionsDescription(regla)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Ejecutadas: {regla.ejecutados} veces
                    {regla.ultimaEjecucion && ` | Última: ${new Date(regla.ultimaEjecucion).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleAutomation(regla.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      regla.activo
                        ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                        : 'bg-white/10 text-slate-400 hover:bg-white/20'
                    }`}
                    title={regla.activo ? 'Pausar regla' : 'Activar regla'}
                  >
                    {regla.activo ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  {regla.id.startsWith('rule_custom') && (
                    <button
                      onClick={() => handleDeleteRule(regla.id, regla.nombre)}
                      className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                      title="Eliminar regla"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Crear nueva regla */}
          {!showRuleCreator ? (
            <button
              onClick={() => setShowRuleCreator(true)}
              className="w-full p-3 border border-dashed border-white/20 hover:border-white/40 rounded-xl text-center text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Crear nueva regla
            </button>
          ) : (
            <div className="p-4 bg-navy-800/50 rounded-xl border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-white">Crear Regla desde Plantilla</p>
                <button
                  onClick={() => setShowRuleCreator(false)}
                  className="p-1 hover:bg-white/10 rounded"
                >
                  <Plus className="w-4 h-4 text-slate-400 rotate-45" />
                </button>
              </div>
              <div className="grid gap-2">
                {PLANTILLAS_REGLAS.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleCreateFromTemplate(template.id)}
                    className="p-3 bg-white/5 hover:bg-white/10 rounded-lg text-left transition-colors border border-white/10 hover:border-accent-500/30"
                  >
                    <p className="text-sm font-medium text-white">{template.nombre}</p>
                    <p className="text-xs text-slate-400 mt-1">{template.descripcion}</p>
                  </button>
                ))}
              </div>
              <button
                onClick={() => {
                  setShowRuleCreator(false);
                  onChatQuery?.('Quiero crear una regla de automatización personalizada');
                }}
                className="w-full p-2 text-xs text-accent-400 hover:bg-accent-500/10 rounded-lg transition-colors"
              >
                O crear regla completamente personalizada...
              </button>
            </div>
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-3">
          {historial.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No hay ejecuciones registradas</p>
              <p className="text-xs mt-2">Ejecuta las automatizaciones para ver el historial</p>
            </div>
          ) : (
            <>
              {historial.slice(0, 10).map((exec) => (
                <div
                  key={exec.id}
                  className={`p-3 rounded-xl border ${
                    exec.resultado === 'exito'
                      ? 'bg-emerald-500/5 border-emerald-500/20'
                      : exec.resultado === 'parcial'
                      ? 'bg-amber-500/5 border-amber-500/20'
                      : 'bg-red-500/5 border-red-500/20'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {exec.resultado === 'exito' ? (
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                        ) : exec.resultado === 'parcial' ? (
                          <AlertCircle className="w-4 h-4 text-amber-400" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-400" />
                        )}
                        <span className="font-medium text-white text-sm">{exec.nombreRegla}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Guía: <span className="font-mono">{exec.guiaId.slice(0, 15)}...</span>
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {exec.accionesEjecutadas.join(' → ')}
                      </p>
                    </div>
                    <span className="text-xs text-slate-500">
                      {new Date(exec.timestamp).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}

              {historial.length > 10 && (
                <p className="text-xs text-center text-slate-500">
                  Mostrando 10 de {historial.length} ejecuciones
                </p>
              )}
            </>
          )}

          <button
            onClick={runAutomations}
            disabled={isRunning || shipments.length === 0}
            className="w-full p-3 bg-accent-500/20 hover:bg-accent-500/30 border border-accent-500/30 rounded-xl text-center text-accent-400 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isRunning ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {isRunning ? 'Ejecutando...' : `Ejecutar ahora (${shipments.length} guías)`}
          </button>
        </div>
      )}

      {/* Templates Tab - Plantillas WhatsApp */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
            <p className="text-xs text-emerald-400 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Plantillas de mensajes para automatizaciones
            </p>
          </div>

          {/* Categorías de plantillas */}
          {(['entrega', 'novedad', 'oficina', 'seguimiento'] as const).map(categoria => {
            const plantillas = PLANTILLAS_WHATSAPP.filter(p => p.categoria === categoria);
            if (plantillas.length === 0) return null;

            return (
              <div key={categoria}>
                <p className="text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
                  {categoria === 'entrega' ? '✅ Entregas' :
                   categoria === 'novedad' ? '⚠️ Novedades' :
                   categoria === 'oficina' ? '📦 En Oficina' :
                   '📊 Seguimiento'}
                </p>
                <div className="space-y-2">
                  {plantillas.map(plantilla => (
                    <div
                      key={plantilla.id}
                      className="p-3 bg-white/5 rounded-xl border border-white/10 hover:border-white/20 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-sm font-medium text-white">{plantilla.nombre}</p>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(plantilla.mensaje);
                            onChatQuery?.(`📋 Plantilla "${plantilla.nombre}" copiada al portapapeles`);
                          }}
                          className="px-2 py-1 text-xs text-accent-400 hover:bg-accent-500/10 rounded transition-colors"
                        >
                          Copiar
                        </button>
                      </div>
                      <p className="text-xs text-slate-300 bg-navy-900/50 p-2 rounded-lg font-mono">
                        {plantilla.mensaje}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {plantilla.variables.map(v => (
                          <span key={v} className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] rounded">
                            {`{${v}}`}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          <button
            onClick={() => onChatQuery?.('Quiero crear una plantilla de mensaje personalizada para WhatsApp')}
            className="w-full p-3 border border-dashed border-white/20 hover:border-white/40 rounded-xl text-center text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Crear plantilla personalizada
          </button>
        </div>
      )}

      {/* Quick Chat Actions */}
      <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10">
        <button
          onClick={() => onChatQuery?.('Que automatizaciones me recomiendas?')}
          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-slate-300"
        >
          Recomendar automatizaciones
        </button>
        <button
          onClick={() => onChatQuery?.('Genera mensajes masivos para guias retrasadas')}
          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-slate-300"
        >
          Mensajes masivos
        </button>
      </div>
    </div>
  );
};

export default AutomatizacionesSkillView;
