// components/intelligence/AutomationPanel.tsx
// Panel de Automatización y Workflows Inteligentes
import React, { useState, useEffect, useMemo } from 'react';
import {
  Zap,
  Play,
  Pause,
  Settings,
  Bell,
  BellOff,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Plus,
  Trash2,
  Edit3,
  RefreshCw,
  MessageCircle,
  Phone,
  Mail,
  Users,
  Target,
  Activity,
  TrendingUp,
  Filter,
  Search,
  MoreVertical,
  PlayCircle,
  History,
  Sparkles,
  Bot,
  Shield,
} from 'lucide-react';
import { Shipment } from '../../types';
import {
  AutomationRule,
  SmartAlert,
  WorkflowExecution,
  obtenerReglas,
  guardarReglas,
  obtenerAlertas,
  guardarAlertas,
  marcarAlertaLeida,
  obtenerHistorialEjecuciones,
  procesarAutomatizaciones,
  generarAlertasInteligentes,
} from '../../services/automationService';

interface AutomationPanelProps {
  shipments: Shipment[];
  compact?: boolean;
}

// =====================================
// COMPONENTE PRINCIPAL
// =====================================
export const AutomationPanel: React.FC<AutomationPanelProps> = ({
  shipments,
  compact = false,
}) => {
  const [activeTab, setActiveTab] = useState<'reglas' | 'alertas' | 'historial'>('alertas');
  const [reglas, setReglas] = useState<AutomationRule[]>([]);
  const [alertas, setAlertas] = useState<SmartAlert[]>([]);
  const [historial, setHistorial] = useState<WorkflowExecution[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [expandedRule, setExpandedRule] = useState<string | null>(null);

  // Cargar datos iniciales
  useEffect(() => {
    setReglas(obtenerReglas());
    setAlertas(obtenerAlertas());
    setHistorial(obtenerHistorialEjecuciones());
  }, []);

  // Métricas de automatización
  const metricas = useMemo(() => {
    const reglasActivas = reglas.filter(r => r.activo).length;
    const alertasNoLeidas = alertas.filter(a => !a.leido).length;
    const ejecucionesHoy = historial.filter(h => {
      const fecha = new Date(h.timestamp);
      const hoy = new Date();
      return fecha.toDateString() === hoy.toDateString();
    }).length;
    const exitoRate = historial.length > 0
      ? Math.round((historial.filter(h => h.resultado === 'exito').length / historial.length) * 100)
      : 0;

    return { reglasActivas, alertasNoLeidas, ejecucionesHoy, exitoRate };
  }, [reglas, alertas, historial]);

  // Ejecutar automatizaciones
  const ejecutarAutomatizaciones = () => {
    if (shipments.length === 0) return;

    setIsProcessing(true);

    setTimeout(() => {
      // Procesar reglas
      const { ejecuciones, alertas: nuevasAlertas } = procesarAutomatizaciones(shipments, reglas);

      // Generar alertas inteligentes adicionales
      const alertasIA = generarAlertasInteligentes(shipments);

      // Combinar y guardar alertas
      const todasAlertas = [...nuevasAlertas, ...alertasIA, ...alertas].slice(0, 50);
      setAlertas(todasAlertas);
      guardarAlertas(todasAlertas);

      // Actualizar historial
      const nuevoHistorial = [...ejecuciones, ...historial].slice(0, 100);
      setHistorial(nuevoHistorial);

      // Actualizar contadores de reglas
      const reglasActualizadas = reglas.map(r => {
        const ejecucionesRegla = ejecuciones.filter(e => e.reglaId === r.id).length;
        if (ejecucionesRegla > 0) {
          return {
            ...r,
            ejecutados: r.ejecutados + ejecucionesRegla,
            ultimaEjecucion: new Date().toISOString()
          };
        }
        return r;
      });
      setReglas(reglasActualizadas);
      guardarReglas(reglasActualizadas);

      setIsProcessing(false);
    }, 1500);
  };

  // Toggle regla activa
  const toggleRegla = (reglaId: string) => {
    const actualizadas = reglas.map(r =>
      r.id === reglaId ? { ...r, activo: !r.activo } : r
    );
    setReglas(actualizadas);
    guardarReglas(actualizadas);
  };

  // Marcar alerta como leída
  const handleMarcarLeida = (alertaId: string) => {
    marcarAlertaLeida(alertaId);
    setAlertas(prev => prev.map(a =>
      a.id === alertaId ? { ...a, leido: true } : a
    ));
  };

  // Modo compacto
  if (compact) {
    return (
      <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl border border-amber-500/30 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-lg relative">
              <Zap className="w-5 h-5 text-amber-500" />
              {metricas.alertasNoLeidas > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {metricas.alertasNoLeidas}
                </span>
              )}
            </div>
            <div>
              <p className="font-bold text-slate-800 dark:text-white">Automatización</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {metricas.reglasActivas} reglas activas · {metricas.ejecucionesHoy} acciones hoy
              </p>
            </div>
          </div>
          <button
            onClick={ejecutarAutomatizaciones}
            disabled={isProcessing || shipments.length === 0}
            className="flex items-center gap-2 px-3 py-1.5 bg-amber-500 text-white text-sm rounded-lg hover:bg-amber-600 disabled:opacity-50 transition-all"
          >
            <PlayCircle className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
            {isProcessing ? 'Procesando...' : 'Ejecutar'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ====================================== */}
      {/* HEADER */}
      {/* ====================================== */}
      <div className="bg-gradient-to-r from-amber-900 via-orange-900 to-amber-900 rounded-2xl border border-amber-500/30 overflow-hidden">
        <div className="p-6 relative overflow-hidden">
          {/* Background Effect */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-1/4 w-64 h-64 bg-amber-500 rounded-full filter blur-[80px] animate-pulse"></div>
            <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-orange-500 rounded-full filter blur-[80px] animate-pulse" style={{ animationDelay: '1s' }}></div>
          </div>

          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl shadow-lg shadow-amber-500/30">
                <Zap className="w-10 h-10 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  Centro de Automatización
                  <Bot className="w-5 h-5 text-amber-300 animate-pulse" />
                </h2>
                <p className="text-amber-200">
                  Workflows inteligentes y alertas automáticas
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={ejecutarAutomatizaciones}
                disabled={isProcessing || shipments.length === 0}
                className={`
                  flex items-center gap-2 px-5 py-3 rounded-xl font-bold
                  transition-all shadow-lg
                  ${isProcessing
                    ? 'bg-amber-600 text-white cursor-wait'
                    : shipments.length === 0
                    ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600'
                  }
                `}
              >
                <PlayCircle className={`w-5 h-5 ${isProcessing ? 'animate-spin' : ''}`} />
                {isProcessing ? 'Procesando...' : 'Ejecutar Automatizaciones'}
              </button>
            </div>
          </div>
        </div>

        {/* Métricas rápidas */}
        <div className="px-6 py-4 bg-black/30 border-t border-white/10 grid grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{metricas.reglasActivas}</p>
            <p className="text-xs text-amber-200">Reglas Activas</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-400">{metricas.alertasNoLeidas}</p>
            <p className="text-xs text-amber-200">Alertas Nuevas</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{metricas.ejecucionesHoy}</p>
            <p className="text-xs text-amber-200">Acciones Hoy</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-400">{metricas.exitoRate}%</p>
            <p className="text-xs text-amber-200">Tasa Éxito</p>
          </div>
        </div>
      </div>

      {/* ====================================== */}
      {/* TABS */}
      {/* ====================================== */}
      <div className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-700 overflow-hidden">
        <div className="flex border-b border-slate-200 dark:border-navy-700">
          {[
            { id: 'alertas' as const, label: 'Alertas', icon: Bell, count: metricas.alertasNoLeidas },
            { id: 'reglas' as const, label: 'Reglas', icon: Settings, count: metricas.reglasActivas },
            { id: 'historial' as const, label: 'Historial', icon: History, count: metricas.ejecucionesHoy },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex-1 flex items-center justify-center gap-2 px-4 py-4 font-medium text-sm
                transition-all border-b-2
                ${activeTab === tab.id
                  ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-navy-800'
                }
              `}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.count > 0 && (
                <span className={`
                  px-2 py-0.5 text-xs font-bold rounded-full
                  ${activeTab === tab.id
                    ? 'bg-amber-500 text-white'
                    : 'bg-slate-200 dark:bg-navy-700 text-slate-600 dark:text-slate-400'
                  }
                `}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Contenido de tabs */}
        <div className="p-6">
          {/* ALERTAS */}
          {activeTab === 'alertas' && (
            <div className="space-y-4">
              {alertas.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-navy-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BellOff className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-slate-600 dark:text-slate-400">No hay alertas pendientes</p>
                  <p className="text-sm text-slate-500 mt-1">Ejecuta las automatizaciones para generar alertas</p>
                </div>
              ) : (
                alertas.map((alerta) => (
                  <div
                    key={alerta.id}
                    className={`
                      p-4 rounded-xl border transition-all
                      ${alerta.leido
                        ? 'bg-slate-50 dark:bg-navy-800/50 border-slate-200 dark:border-navy-700'
                        : alerta.tipo === 'critico'
                        ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                        : alerta.tipo === 'urgente'
                        ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                        : alerta.tipo === 'exito'
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                        : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                      }
                    `}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className={`
                          p-2 rounded-lg flex-shrink-0
                          ${alerta.tipo === 'critico' ? 'bg-red-100 dark:bg-red-900/30' :
                            alerta.tipo === 'urgente' ? 'bg-amber-100 dark:bg-amber-900/30' :
                            alerta.tipo === 'exito' ? 'bg-emerald-100 dark:bg-emerald-900/30' :
                            'bg-blue-100 dark:bg-blue-900/30'}
                        `}>
                          {alerta.tipo === 'critico' && <AlertTriangle className="w-5 h-5 text-red-600" />}
                          {alerta.tipo === 'urgente' && <Clock className="w-5 h-5 text-amber-600" />}
                          {alerta.tipo === 'exito' && <CheckCircle className="w-5 h-5 text-emerald-600" />}
                          {alerta.tipo === 'informativo' && <Bell className="w-5 h-5 text-blue-600" />}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 dark:text-white">{alerta.titulo}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{alerta.mensaje}</p>
                          {alerta.guiasAfectadas.length > 0 && (
                            <p className="text-xs text-slate-500 mt-2">
                              {alerta.guiasAfectadas.length} guía(s) afectada(s)
                            </p>
                          )}
                          {alerta.accionRecomendada && (
                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              {alerta.accionRecomendada}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">
                          {new Date(alerta.timestamp).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {!alerta.leido && (
                          <button
                            onClick={() => handleMarcarLeida(alerta.id)}
                            className="p-1.5 hover:bg-white dark:hover:bg-navy-700 rounded-lg transition-colors"
                            title="Marcar como leída"
                          >
                            <CheckCircle className="w-4 h-4 text-slate-400 hover:text-emerald-500" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* REGLAS */}
          {activeTab === 'reglas' && (
            <div className="space-y-4">
              {reglas.map((regla) => (
                <div
                  key={regla.id}
                  className={`
                    rounded-xl border transition-all overflow-hidden
                    ${regla.activo
                      ? 'bg-white dark:bg-navy-800 border-slate-200 dark:border-navy-600'
                      : 'bg-slate-50 dark:bg-navy-900 border-slate-200 dark:border-navy-700 opacity-60'
                    }
                  `}
                >
                  <div
                    className="p-4 flex items-center justify-between cursor-pointer"
                    onClick={() => setExpandedRule(expandedRule === regla.id ? null : regla.id)}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleRegla(regla.id);
                        }}
                        className={`
                          p-2 rounded-lg transition-all
                          ${regla.activo
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'
                            : 'bg-slate-200 dark:bg-navy-700 text-slate-400'
                          }
                        `}
                      >
                        {regla.activo ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                      </button>
                      <div>
                        <p className="font-bold text-slate-800 dark:text-white">{regla.nombre}</p>
                        <p className="text-sm text-slate-500">{regla.descripcion}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium text-slate-800 dark:text-white">{regla.ejecutados}</p>
                        <p className="text-xs text-slate-500">ejecuciones</p>
                      </div>
                      {expandedRule === regla.id ? (
                        <ChevronUp className="w-5 h-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Detalles expandidos */}
                  {expandedRule === regla.id && (
                    <div className="px-4 pb-4 border-t border-slate-200 dark:border-navy-700 pt-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        {/* Trigger */}
                        <div className="p-3 bg-slate-50 dark:bg-navy-900 rounded-lg">
                          <p className="text-xs font-bold text-slate-500 uppercase mb-2">Disparador</p>
                          <p className="text-sm text-slate-700 dark:text-slate-300">
                            {regla.trigger.tipo === 'status_change' && 'Cambio de estado'}
                            {regla.trigger.tipo === 'time_threshold' && 'Umbral de tiempo'}
                            {regla.trigger.tipo === 'risk_level' && 'Nivel de riesgo IA'}
                            {regla.trigger.tipo === 'multiple_attempts' && 'Múltiples intentos'}
                            {regla.trigger.tipo === 'schedule' && 'Programado'}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {JSON.stringify(regla.trigger.condiciones)}
                          </p>
                        </div>

                        {/* Acciones */}
                        <div className="p-3 bg-slate-50 dark:bg-navy-900 rounded-lg">
                          <p className="text-xs font-bold text-slate-500 uppercase mb-2">Acciones</p>
                          <div className="space-y-1">
                            {regla.acciones.map((accion, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                                {accion.tipo === 'send_whatsapp' && <MessageCircle className="w-3 h-3 text-green-500" />}
                                {accion.tipo === 'create_alert' && <Bell className="w-3 h-3 text-amber-500" />}
                                {accion.tipo === 'escalate' && <Users className="w-3 h-3 text-red-500" />}
                                {accion.tipo === 'tag_priority' && <Target className="w-3 h-3 text-purple-500" />}
                                {accion.tipo === 'notify_team' && <Users className="w-3 h-3 text-blue-500" />}
                                {accion.tipo === 'schedule_call' && <Phone className="w-3 h-3 text-cyan-500" />}
                                <span className="capitalize">{accion.tipo.replace(/_/g, ' ')}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {regla.ultimaEjecucion && (
                        <p className="text-xs text-slate-500 mt-3 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Última ejecución: {new Date(regla.ultimaEjecucion).toLocaleString('es-CO')}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* HISTORIAL */}
          {activeTab === 'historial' && (
            <div className="space-y-3">
              {historial.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-navy-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <History className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-slate-600 dark:text-slate-400">No hay historial de ejecuciones</p>
                </div>
              ) : (
                historial.slice(0, 20).map((ejecucion) => (
                  <div
                    key={ejecucion.id}
                    className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-navy-800 rounded-xl"
                  >
                    <div className={`
                      p-2 rounded-lg
                      ${ejecucion.resultado === 'exito' ? 'bg-emerald-100 dark:bg-emerald-900/30' :
                        ejecucion.resultado === 'parcial' ? 'bg-amber-100 dark:bg-amber-900/30' :
                        'bg-red-100 dark:bg-red-900/30'}
                    `}>
                      {ejecucion.resultado === 'exito' && <CheckCircle className="w-4 h-4 text-emerald-600" />}
                      {ejecucion.resultado === 'parcial' && <AlertTriangle className="w-4 h-4 text-amber-600" />}
                      {ejecucion.resultado === 'fallido' && <XCircle className="w-4 h-4 text-red-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 dark:text-white truncate">{ejecucion.nombreRegla}</p>
                      <p className="text-xs text-slate-500 truncate">
                        Guía: {ejecucion.guiaId} · {ejecucion.accionesEjecutadas.length} acciones
                      </p>
                    </div>
                    <span className="text-xs text-slate-500 whitespace-nowrap">
                      {new Date(ejecucion.timestamp).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* ====================================== */}
      {/* ACCIONES RÁPIDAS */}
      {/* ====================================== */}
      <div className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-700 p-6">
        <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500" />
          Acciones Rápidas
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: MessageCircle, label: 'WhatsApp Masivo', desc: 'Enviar a todas las novedades', color: 'green' },
            { icon: Phone, label: 'Cola de Llamadas', desc: 'Programar llamadas urgentes', color: 'cyan' },
            { icon: Target, label: 'Priorizar Críticas', desc: 'Marcar guías urgentes', color: 'red' },
            { icon: RefreshCw, label: 'Reprocesar', desc: 'Ejecutar todas las reglas', color: 'purple' },
          ].map((accion, idx) => (
            <button
              key={idx}
              className={`
                p-4 rounded-xl border border-slate-200 dark:border-navy-600
                hover:border-${accion.color}-500 hover:bg-${accion.color}-50 dark:hover:bg-${accion.color}-900/20
                transition-all text-left group
              `}
            >
              <div className={`p-2 bg-${accion.color}-100 dark:bg-${accion.color}-900/30 rounded-lg w-fit mb-2 group-hover:scale-110 transition-transform`}>
                <accion.icon className={`w-5 h-5 text-${accion.color}-600 dark:text-${accion.color}-400`} />
              </div>
              <p className="font-medium text-slate-800 dark:text-white text-sm">{accion.label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{accion.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AutomationPanel;
