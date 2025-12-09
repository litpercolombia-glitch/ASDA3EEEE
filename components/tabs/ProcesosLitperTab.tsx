/**
 * 🌆 PROCESOS LITPER - Ciudad de Agentes IA
 * Dashboard principal de control total con MCP
 * Sistema de automatización para Colombia, Chile y Ecuador
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2,
  Users,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Zap,
  Brain,
  MessageSquare,
  Phone,
  Package,
  Target,
  Shield,
  Sparkles,
  ChevronRight,
  Play,
  Pause,
  RefreshCw,
  Send,
  TrendingUp,
  Globe,
  Bot,
  Cpu,
  Database,
  Network,
  Settings,
  BarChart3,
  PieChart,
  Layers,
  Boxes
} from 'lucide-react';

import {
  getEstadoCiudad,
  getDistritos,
  getAgentes,
  getMetricas,
  getAlertas,
  getEstadisticasGenerales,
  ejecutarComandoMCP,
  getAprendizajes
} from '../../services/agentCityService';

import { getGuiasConNovedad, getGuiasCriticas } from '../../services/trackingAgentService';
import { getNovedadesActivas, getEstadisticasNovedades } from '../../services/novedadesAgentService';
import { getPedidosPendientes, getEstadisticasPedidos, getLlamadasPendientes } from '../../services/ordersAgentService';

import {
  Pais,
  DistritoId,
  Distrito,
  EstadoCiudadAgentes,
  AlertaCiudad,
  DISTRITOS_CONFIG
} from '../../types/agents';

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS LOCALES
// ═══════════════════════════════════════════════════════════════════════════════

interface ProcesosLitperTabProps {
  selectedCountry?: string;
}

type VistaActiva = 'dashboard' | 'distrito' | 'agentes' | 'alertas' | 'aprendizajes' | 'configuracion';

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════

export const ProcesosLitperTab: React.FC<ProcesosLitperTabProps> = ({ selectedCountry }) => {
  const [vistaActiva, setVistaActiva] = useState<VistaActiva>('dashboard');
  const [distritoSeleccionado, setDistritoSeleccionado] = useState<DistritoId | null>(null);
  const [paisSeleccionado, setPaisSeleccionado] = useState<Pais>(
    (selectedCountry?.toLowerCase() as Pais) || Pais.COLOMBIA
  );

  const [estado, setEstado] = useState<EstadoCiudadAgentes | null>(null);
  const [estadisticas, setEstadisticas] = useState<any>(null);
  const [alertas, setAlertas] = useState<AlertaCiudad[]>([]);
  const [cargando, setCargando] = useState(true);

  // MCP Chat
  const [comandoMCP, setComandoMCP] = useState('');
  const [historialComandos, setHistorialComandos] = useState<Array<{
    comando: string;
    respuesta: string;
    timestamp: Date;
  }>>([]);
  const [ejecutandoComando, setEjecutandoComando] = useState(false);

  // ═══════════════════════════════════════════════════════════════════════════
  // CARGAR DATOS
  // ═══════════════════════════════════════════════════════════════════════════

  const cargarDatos = useCallback(() => {
    setCargando(true);
    try {
      const estadoCiudad = getEstadoCiudad();
      setEstado(estadoCiudad);

      const stats = getEstadisticasGenerales();
      setEstadisticas(stats);

      const alertasActivas = getAlertas(paisSeleccionado);
      setAlertas(alertasActivas);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setCargando(false);
    }
  }, [paisSeleccionado]);

  useEffect(() => {
    cargarDatos();
    const intervalo = setInterval(cargarDatos, 30000); // Actualizar cada 30s
    return () => clearInterval(intervalo);
  }, [cargarDatos]);

  // ═══════════════════════════════════════════════════════════════════════════
  // EJECUTAR COMANDO MCP
  // ═══════════════════════════════════════════════════════════════════════════

  const handleEjecutarComando = async () => {
    if (!comandoMCP.trim() || ejecutandoComando) return;

    setEjecutandoComando(true);
    const comandoEnviado = comandoMCP;
    setComandoMCP('');

    try {
      const resultado = await ejecutarComandoMCP(comandoEnviado, paisSeleccionado);

      setHistorialComandos(prev => [...prev, {
        comando: comandoEnviado,
        respuesta: resultado.resultado || resultado.error || 'Comando ejecutado',
        timestamp: new Date()
      }]);

      // Recargar datos después del comando
      cargarDatos();
    } catch (error) {
      setHistorialComandos(prev => [...prev, {
        comando: comandoEnviado,
        respuesta: `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        timestamp: new Date()
      }]);
    } finally {
      setEjecutandoComando(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER HEADER
  // ═══════════════════════════════════════════════════════════════════════════

  const renderHeader = () => (
    <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-900 rounded-2xl p-6 mb-6 shadow-2xl border border-indigo-500/20">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              Ciudad de Agentes Litper
              <span className="text-sm px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full">
                {estado?.estado || 'Operativo'}
              </span>
            </h1>
            <p className="text-indigo-200/80">
              Sistema de automatización total con IA para logística multi-país
            </p>
          </div>
        </div>

        {/* Selector de País */}
        <div className="flex items-center gap-3">
          <span className="text-indigo-200/60 text-sm">País:</span>
          <div className="flex gap-2">
            {Object.values(Pais).map(pais => (
              <button
                key={pais}
                onClick={() => setPaisSeleccionado(pais)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  paisSeleccionado === pais
                    ? 'bg-white text-indigo-900 shadow-lg'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {pais === Pais.COLOMBIA ? 'Colombia' :
                 pais === Pais.CHILE ? 'Chile' : 'Ecuador'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Métricas principales */}
      {estadisticas && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-6">
          <MetricaCard
            icono={<Bot className="w-5 h-5" />}
            valor={estadisticas.agentesActivos}
            label="Agentes Activos"
            color="text-blue-400"
          />
          <MetricaCard
            icono={<Cpu className="w-5 h-5" />}
            valor={estadisticas.agentesTrabajando}
            label="Trabajando"
            color="text-green-400"
          />
          <MetricaCard
            icono={<Activity className="w-5 h-5" />}
            valor={estadisticas.tareasCompletadas}
            label="Tareas Hoy"
            color="text-purple-400"
          />
          <MetricaCard
            icono={<CheckCircle2 className="w-5 h-5" />}
            valor={`${estadisticas.tasaExito}%`}
            label="Tasa Éxito"
            color="text-emerald-400"
          />
          <MetricaCard
            icono={<AlertTriangle className="w-5 h-5" />}
            valor={estadisticas.alertasActivas}
            label="Alertas"
            color="text-amber-400"
          />
          <MetricaCard
            icono={<Brain className="w-5 h-5" />}
            valor={estadisticas.aprendizajes}
            label="Aprendizajes"
            color="text-pink-400"
          />
        </div>
      )}
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER DISTRITOS
  // ═══════════════════════════════════════════════════════════════════════════

  const renderDistritos = () => {
    const distritos = getDistritos();

    return (
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-500" />
          Los 7 Distritos
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {distritos.map(distrito => {
            const config = DISTRITOS_CONFIG.find(d => d.id === distrito.id);
            if (!config) return null;

            return (
              <DistritoCard
                key={distrito.id}
                distrito={distrito}
                config={config}
                onClick={() => {
                  setDistritoSeleccionado(distrito.id);
                  setVistaActiva('distrito');
                }}
              />
            );
          })}
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER MCP CHAT
  // ═══════════════════════════════════════════════════════════════════════════

  const renderMCPChat = () => (
    <div className="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 flex items-center gap-3">
        <MessageSquare className="w-5 h-5 text-white" />
        <span className="font-semibold text-white">Chat con el Alcalde IA</span>
        <span className="text-xs px-2 py-0.5 bg-white/20 rounded-full text-white">
          Claude Opus
        </span>
      </div>

      {/* Historial de comandos */}
      <div className="h-64 overflow-y-auto p-4 space-y-3">
        {historialComandos.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <Bot className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>Escribe un comando para interactuar con la ciudad</p>
            <p className="text-sm mt-1">Ej: "¿Cuántas novedades hay en Colombia?"</p>
          </div>
        ) : (
          historialComandos.map((item, idx) => (
            <div key={idx} className="space-y-2">
              <div className="flex gap-2">
                <span className="text-indigo-400 font-medium">Tú:</span>
                <span className="text-gray-300">{item.comando}</span>
              </div>
              <div className="flex gap-2 bg-gray-800/50 rounded-lg p-3">
                <Bot className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                <span className="text-gray-200 text-sm whitespace-pre-wrap">{item.respuesta}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input de comando */}
      <div className="border-t border-gray-700 p-3 flex gap-2">
        <input
          type="text"
          value={comandoMCP}
          onChange={(e) => setComandoMCP(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleEjecutarComando()}
          placeholder="Escribe tu comando o pregunta..."
          className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          disabled={ejecutandoComando}
        />
        <button
          onClick={handleEjecutarComando}
          disabled={ejecutandoComando || !comandoMCP.trim()}
          className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg text-white font-medium hover:from-indigo-500 hover:to-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {ejecutandoComando ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER MÉTRICAS EN TIEMPO REAL
  // ═══════════════════════════════════════════════════════════════════════════

  const renderMetricasEnVivo = () => {
    const statsNovedades = getEstadisticasNovedades(paisSeleccionado);
    const statsPedidos = getEstadisticasPedidos(paisSeleccionado);
    const llamadasPendientes = getLlamadasPendientes();
    const guiasCriticas = getGuiasCriticas();

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Panel de Novedades */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-red-500 to-orange-500 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-semibold">Novedades Activas</span>
            </div>
            <span className="text-2xl font-bold text-white">{statsNovedades.activas}</span>
          </div>

          <div className="p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Resueltas hoy</span>
              <span className="font-medium text-green-600">{statsNovedades.resueltasHoy}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">En oficina</span>
              <span className="font-medium text-amber-600">{statsNovedades.enOficina}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Escaladas</span>
              <span className="font-medium text-red-600">{statsNovedades.escaladas}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-gray-200 dark:border-gray-700 pt-2">
              <span className="text-gray-500">Tasa resolución</span>
              <span className="font-bold text-indigo-600">{statsNovedades.tasaResolucion}%</span>
            </div>
          </div>
        </div>

        {/* Panel de Pedidos */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <Package className="w-5 h-5" />
              <span className="font-semibold">Pedidos Hoy</span>
            </div>
            <span className="text-2xl font-bold text-white">{statsPedidos.procesadosHoy}</span>
          </div>

          <div className="p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Pendientes</span>
              <span className="font-medium text-amber-600">{statsPedidos.pendientes}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Desde Chatea Pro</span>
              <span className="font-medium text-blue-600">{statsPedidos.porOrigen.chatea_pro}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Desde Shopify</span>
              <span className="font-medium text-purple-600">{statsPedidos.porOrigen.shopify}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-gray-200 dark:border-gray-700 pt-2">
              <span className="text-gray-500">Llamadas pendientes</span>
              <span className="font-bold text-orange-600">{llamadasPendientes.length}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER ALERTAS
  // ═══════════════════════════════════════════════════════════════════════════

  const renderAlertas = () => {
    const alertasActivas = alertas.filter(a => a.activa);

    if (alertasActivas.length === 0) {
      return (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 text-center">
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-2" />
          <p className="text-green-700 dark:text-green-300 font-medium">Sin alertas activas</p>
          <p className="text-green-600/70 dark:text-green-400/70 text-sm">Todo funciona correctamente</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {alertasActivas.slice(0, 5).map(alerta => (
          <div
            key={alerta.id}
            className={`rounded-lg p-4 border ${
              alerta.tipo === 'critical' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' :
              alerta.tipo === 'error' ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800' :
              alerta.tipo === 'warning' ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' :
              'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
            }`}
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${
                alerta.tipo === 'critical' ? 'text-red-500' :
                alerta.tipo === 'error' ? 'text-orange-500' :
                alerta.tipo === 'warning' ? 'text-amber-500' :
                'text-blue-500'
              }`} />
              <div className="flex-1">
                <h4 className="font-medium text-gray-800 dark:text-white">{alerta.titulo}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">{alerta.mensaje}</p>
                {alerta.accionRequerida && (
                  <p className="text-xs text-gray-500 mt-1 italic">{alerta.accionRequerida}</p>
                )}
              </div>
              <span className="text-xs text-gray-400">
                {new Date(alerta.creadaEn).toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER VISTA DE DISTRITO INDIVIDUAL
  // ═══════════════════════════════════════════════════════════════════════════

  const renderVistaDistrito = () => {
    if (!distritoSeleccionado) return null;

    const distrito = getDistritos().find(d => d.id === distritoSeleccionado);
    const config = DISTRITOS_CONFIG.find(d => d.id === distritoSeleccionado);
    const agentes = getAgentes(distritoSeleccionado, paisSeleccionado);

    if (!distrito || !config) return null;

    return (
      <div className="space-y-6">
        {/* Header del distrito */}
        <div className={`${config.colorBg} rounded-xl p-6 border border-gray-200 dark:border-gray-700`}>
          <button
            onClick={() => {
              setDistritoSeleccionado(null);
              setVistaActiva('dashboard');
            }}
            className="text-sm text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-1"
          >
            ← Volver al dashboard
          </button>

          <div className="flex items-center gap-4">
            <div className="text-4xl">{config.icono}</div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                {config.nombre}
              </h2>
              <p className="text-gray-600 dark:text-gray-300">{config.descripcion}</p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-gray-800 dark:text-white">{agentes.length}</div>
              <div className="text-xs text-gray-500">Agentes</div>
            </div>
            <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-600">{distrito.tareasCompletadasHoy}</div>
              <div className="text-xs text-gray-500">Completadas</div>
            </div>
            <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-blue-600">{distrito.tareasHoy}</div>
              <div className="text-xs text-gray-500">Total Hoy</div>
            </div>
            <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-purple-600">{distrito.tasaExitoHoy.toFixed(0)}%</div>
              <div className="text-xs text-gray-500">Éxito</div>
            </div>
          </div>
        </div>

        {/* Lista de agentes */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-500" />
              Agentes del Distrito
            </h3>
            <span className="text-sm text-gray-500">{agentes.length} agentes</span>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {agentes.map(agente => (
              <div key={agente.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      agente.estado === 'trabajando' ? 'bg-green-100 text-green-600' :
                      agente.estado === 'activo' ? 'bg-blue-100 text-blue-600' :
                      agente.estado === 'pausado' ? 'bg-amber-100 text-amber-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      <Bot className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800 dark:text-white">{agente.nombre}</h4>
                      <p className="text-sm text-gray-500">{agente.especialidad.replace(/_/g, ' ')}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-800 dark:text-white">
                        {agente.tareasCompletadas} tareas
                      </div>
                      <div className="text-xs text-gray-500">
                        {agente.calificacionPromedio.toFixed(1)}/10
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      agente.estado === 'trabajando' ? 'bg-green-100 text-green-700' :
                      agente.estado === 'activo' ? 'bg-blue-100 text-blue-700' :
                      agente.estado === 'pausado' ? 'bg-amber-100 text-amber-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {agente.estado}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER PRINCIPAL
  // ═══════════════════════════════════════════════════════════════════════════

  if (cargando && !estado) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-indigo-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Cargando Ciudad de Agentes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {renderHeader()}

      {vistaActiva === 'distrito' && distritoSeleccionado ? (
        renderVistaDistrito()
      ) : (
        <>
          {renderMetricasEnVivo()}
          {renderDistritos()}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Panel MCP */}
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-500" />
                Control Total con MCP
              </h2>
              {renderMCPChat()}
            </div>

            {/* Panel de Alertas */}
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Alertas del Sistema
              </h2>
              {renderAlertas()}
            </div>
          </div>

          {/* Footer con estadísticas de aprendizaje */}
          <div className="bg-gradient-to-r from-purple-900/20 to-indigo-900/20 rounded-xl p-6 border border-purple-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 dark:text-white">Memoria Colectiva</h3>
                  <p className="text-sm text-gray-500">Sistema de aprendizaje continuo activo</p>
                </div>
              </div>
              <div className="flex items-center gap-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{getAprendizajes().length}</div>
                  <div className="text-xs text-gray-500">Aprendizajes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-pink-600">{estadisticas?.distritosOperativos || 7}</div>
                  <div className="text-xs text-gray-500">Distritos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-600">{estadisticas?.agentesTotales || 0}</div>
                  <div className="text-xs text-gray-500">Agentes Total</div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTES AUXILIARES
// ═══════════════════════════════════════════════════════════════════════════════

const MetricaCard: React.FC<{
  icono: React.ReactNode;
  valor: number | string;
  label: string;
  color: string;
}> = ({ icono, valor, label, color }) => (
  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
    <div className={`${color} mb-1 flex justify-center`}>{icono}</div>
    <div className="text-xl font-bold text-white">{valor}</div>
    <div className="text-xs text-indigo-200/70">{label}</div>
  </div>
);

const DistritoCard: React.FC<{
  distrito: Distrito;
  config: typeof DISTRITOS_CONFIG[0];
  onClick: () => void;
}> = ({ distrito, config, onClick }) => (
  <button
    onClick={onClick}
    className={`${config.colorBg} rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all text-left w-full group`}
  >
    <div className="flex items-start justify-between mb-3">
      <span className="text-3xl">{config.icono}</span>
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
        distrito.estado === 'operativo' ? 'bg-green-100 text-green-700' :
        distrito.estado === 'degradado' ? 'bg-amber-100 text-amber-700' :
        'bg-red-100 text-red-700'
      }`}>
        {distrito.estado}
      </span>
    </div>

    <h3 className="font-bold text-gray-800 dark:text-white mb-1">{config.nombre}</h3>
    <p className="text-xs text-gray-500 mb-3 line-clamp-2">{config.descripcion}</p>

    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm">
        <Users className="w-4 h-4 text-gray-400" />
        <span className="text-gray-600 dark:text-gray-300">{distrito.agentesActivos} agentes</span>
      </div>
      {distrito.alertasActivas > 0 && (
        <span className="flex items-center gap-1 text-amber-600 text-sm">
          <AlertTriangle className="w-3 h-3" />
          {distrito.alertasActivas}
        </span>
      )}
    </div>

    <div className="mt-3 pt-3 border-t border-gray-200/50 dark:border-gray-600/50 flex justify-between text-xs">
      <span className="text-gray-500">Hoy: {distrito.tareasCompletadasHoy}/{distrito.tareasHoy}</span>
      <span className={config.color}>
        {distrito.tasaExitoHoy.toFixed(0)}% éxito
      </span>
    </div>

    <div className="flex items-center justify-end mt-2 text-gray-400 group-hover:text-indigo-500 transition-colors">
      <span className="text-xs">Gestionar</span>
      <ChevronRight className="w-4 h-4" />
    </div>
  </button>
);

export default ProcesosLitperTab;
