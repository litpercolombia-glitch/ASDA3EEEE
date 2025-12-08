/**
 * 🏙️ CIUDAD DE AGENTES LITPER - TAB DEDICADO
 * Dashboard completo para gestión de la Ciudad de Agentes
 * Sistema de 96 agentes organizados en 7 distritos
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
  ChevronDown,
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
  Boxes,
  Map,
  Eye,
  Search,
  Filter,
  Download,
  MoreVertical,
  Star,
  Award,
  Gauge,
  Radio,
  Wifi,
  Server,
  HardDrive,
  HelpCircle
} from 'lucide-react';
import { HelpTooltip } from '../HelpSystem/HelpTooltip';
import { agentesHelp } from '../HelpSystem/helpContent';

import {
  getEstadoCiudad,
  getDistritos,
  getAgentes,
  getMetricas,
  getAlertas,
  getEstadisticasGenerales,
  ejecutarComandoMCP,
  getAprendizajes,
  crearAlerta,
  resolverAlerta,
  pausarAgente,
  activarAgente
} from '../../services/agentCityService';

import { getGuiasConNovedad, getGuiasCriticas } from '../../services/trackingAgentService';
import { getNovedadesActivas, getEstadisticasNovedades } from '../../services/novedadesAgentService';
import { getPedidosPendientes, getEstadisticasPedidos, getLlamadasPendientes } from '../../services/ordersAgentService';

import {
  Pais,
  DistritoId,
  Distrito,
  Agente,
  EstadoCiudadAgentes,
  AlertaCiudad,
  MetricasCiudad,
  TipoAgente,
  EstadoAgente,
  DISTRITOS_CONFIG
} from '../../types/agents';

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS LOCALES
// ═══════════════════════════════════════════════════════════════════════════════

interface CiudadAgentesTabProps {
  selectedCountry?: string;
}

type VistaActiva = 'mapa' | 'distritos' | 'agentes' | 'metricas' | 'alertas' | 'memoria' | 'configuracion';

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════

export const CiudadAgentesTab: React.FC<CiudadAgentesTabProps> = ({ selectedCountry }) => {
  const [vistaActiva, setVistaActiva] = useState<VistaActiva>('mapa');
  const [distritoExpandido, setDistritoExpandido] = useState<DistritoId | null>(null);
  const [agenteSeleccionado, setAgenteSeleccionado] = useState<string | null>(null);
  const [paisSeleccionado, setPaisSeleccionado] = useState<Pais>(
    (selectedCountry?.toLowerCase() as Pais) || Pais.COLOMBIA
  );
  const [busquedaAgente, setBusquedaAgente] = useState('');

  const [estado, setEstado] = useState<EstadoCiudadAgentes | null>(null);
  const [estadisticas, setEstadisticas] = useState<any>(null);
  const [alertas, setAlertas] = useState<AlertaCiudad[]>([]);
  const [metricas, setMetricas] = useState<MetricasCiudad | null>(null);
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

      const metricasPais = getMetricas(paisSeleccionado);
      setMetricas(metricasPais);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setCargando(false);
    }
  }, [paisSeleccionado]);

  useEffect(() => {
    cargarDatos();
    const intervalo = setInterval(cargarDatos, 30000);
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
  // RENDER HEADER PRINCIPAL
  // ═══════════════════════════════════════════════════════════════════════════

  const renderHeader = () => (
    <div className="bg-gradient-to-r from-slate-900 via-indigo-900 to-purple-900 rounded-2xl p-6 mb-6 shadow-2xl border border-indigo-500/30 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-40 h-40 bg-blue-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-60 h-60 bg-purple-500 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-2xl border border-white/20">
              <Building2 className="w-10 h-10 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl font-black text-white">
                  Ciudad de Agentes
                </h1>
                <HelpTooltip
                  title={agentesHelp.general.title}
                  content={agentesHelp.general.content}
                  tips={agentesHelp.general.tips}
                  position="bottom"
                >
                  <HelpCircle className="w-5 h-5 text-white/60 hover:text-white cursor-help transition-colors" />
                </HelpTooltip>
                <span className="px-3 py-1 bg-gradient-to-r from-green-400 to-emerald-500 text-white text-sm font-bold rounded-full shadow-lg animate-pulse">
                  {estado?.estado || 'OPERATIVO'}
                </span>
              </div>
              <p className="text-indigo-200/80 text-lg">
                Sistema de automatización total con IA para logística multi-país
              </p>
              <div className="flex items-center gap-4 mt-2 text-sm text-indigo-300/70">
                <span className="flex items-center gap-1">
                  <Wifi className="w-4 h-4 text-green-400" />
                  Conexión estable
                </span>
                <span className="flex items-center gap-1">
                  <Server className="w-4 h-4 text-blue-400" />
                  {estadisticas?.agentesActivos || 0} agentes activos
                </span>
                <span className="flex items-center gap-1">
                  <HardDrive className="w-4 h-4 text-purple-400" />
                  v{estado?.version || '1.0.0'}
                </span>
              </div>
            </div>
          </div>

          {/* Selector de País */}
          <div className="flex items-center gap-3">
            <span className="text-indigo-200/60 text-sm font-medium">Hub:</span>
            <div className="flex gap-2 bg-black/20 rounded-xl p-1">
              {Object.values(Pais).map(pais => (
                <button
                  key={pais}
                  onClick={() => setPaisSeleccionado(pais)}
                  className={`px-5 py-2.5 rounded-lg font-bold transition-all ${
                    paisSeleccionado === pais
                      ? 'bg-white text-indigo-900 shadow-lg scale-105'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  {pais === Pais.COLOMBIA ? '🇨🇴 Colombia' :
                   pais === Pais.CHILE ? '🇨🇱 Chile' : '🇪🇨 Ecuador'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Métricas principales */}
        {estadisticas && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mt-6">
            <MetricaCompacta
              icono={<Bot className="w-5 h-5" />}
              valor={estadisticas.agentesTotales}
              label="Total Agentes"
              color="from-blue-400 to-blue-600"
            />
            <MetricaCompacta
              icono={<Cpu className="w-5 h-5" />}
              valor={estadisticas.agentesTrabajando}
              label="Trabajando"
              color="from-green-400 to-green-600"
            />
            <MetricaCompacta
              icono={<Layers className="w-5 h-5" />}
              valor={estadisticas.distritosOperativos}
              label="Distritos"
              color="from-purple-400 to-purple-600"
            />
            <MetricaCompacta
              icono={<Activity className="w-5 h-5" />}
              valor={estadisticas.tareasCompletadas}
              label="Tareas Hoy"
              color="from-cyan-400 to-cyan-600"
            />
            <MetricaCompacta
              icono={<CheckCircle2 className="w-5 h-5" />}
              valor={`${estadisticas.tasaExito}%`}
              label="Tasa Éxito"
              color="from-emerald-400 to-emerald-600"
            />
            <MetricaCompacta
              icono={<AlertTriangle className="w-5 h-5" />}
              valor={estadisticas.alertasActivas}
              label="Alertas"
              color="from-amber-400 to-amber-600"
            />
            <MetricaCompacta
              icono={<Brain className="w-5 h-5" />}
              valor={estadisticas.aprendizajes}
              label="Aprendizajes"
              color="from-pink-400 to-pink-600"
            />
            <MetricaCompacta
              icono={<Globe className="w-5 h-5" />}
              valor={3}
              label="Países"
              color="from-indigo-400 to-indigo-600"
            />
          </div>
        )}
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER NAVEGACIÓN SECUNDARIA
  // ═══════════════════════════════════════════════════════════════════════════

  const renderNavegacion = () => {
    const navItems = [
      { id: 'mapa', label: 'Mapa de la Ciudad', icon: Map, helpTitle: 'Mapa de la Ciudad', helpContent: 'Vista general de todos los distritos y su estado operativo', helpTips: ['Los 7 distritos se organizan alrededor de la Alcaldía central', 'Haz clic en un distrito para ver sus agentes'] },
      { id: 'distritos', label: 'Los 7 Distritos', icon: Layers, helpTitle: agentesHelp.distritos.title, helpContent: agentesHelp.distritos.content, helpTips: agentesHelp.distritos.tips },
      { id: 'agentes', label: 'Agentes IA', icon: Users, helpTitle: 'Agentes de IA', helpContent: 'Lista de todos los agentes inteligentes del sistema', helpTips: ['Cada distrito tiene agentes especializados', 'Los agentes procesan tareas automáticamente'] },
      { id: 'metricas', label: 'Métricas en Vivo', icon: BarChart3, helpTitle: 'Métricas en Tiempo Real', helpContent: 'Monitorea el rendimiento del sistema en tiempo real', helpTips: ['KPIs de rendimiento', 'Estadísticas por distrito', 'Tendencias de tareas'] },
      { id: 'alertas', label: 'Centro de Alertas', icon: AlertTriangle, helpTitle: 'Centro de Alertas', helpContent: 'Visualiza y gestiona alertas del sistema', helpTips: ['Alertas críticas requieren acción inmediata', 'Las alertas se resuelven automáticamente o manualmente'] },
      { id: 'memoria', label: 'Memoria Colectiva', icon: Brain, helpTitle: 'Memoria Colectiva', helpContent: 'Conocimiento aprendido por los agentes de todas sus interacciones', helpTips: ['Los agentes aprenden de cada tarea', 'El conocimiento se comparte entre distritos'] },
      { id: 'configuracion', label: 'Configuración', icon: Settings, helpTitle: 'Configuración', helpContent: 'Configura el comportamiento del sistema de agentes', helpTips: ['Ajusta parámetros de los agentes', 'Configura umbrales de alertas'] }
    ];

    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-2 mb-6 flex flex-wrap gap-2">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = vistaActiva === item.id;
          return (
            <HelpTooltip
              key={item.id}
              title={item.helpTitle}
              content={item.helpContent}
              tips={item.helpTips}
              position="bottom"
            >
              <button
                onClick={() => setVistaActiva(item.id as VistaActiva)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden md:inline">{item.label}</span>
              </button>
            </HelpTooltip>
          );
        })}
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER MAPA DE LA CIUDAD
  // ═══════════════════════════════════════════════════════════════════════════

  const renderMapaCiudad = () => {
    const distritos = getDistritos();

    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            Mapa de la Ciudad de Agentes
          </h2>
          <p className="text-gray-500">Vista general de todos los distritos y su estado operativo</p>
        </div>

        {/* Visualización del mapa como grid */}
        <div className="relative bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-2xl p-8 min-h-[500px]">
          {/* Centro - Alcaldía */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center shadow-2xl border-4 border-white dark:border-gray-700 hover:scale-110 transition-transform cursor-pointer">
              <div className="text-center">
                <Building2 className="w-10 h-10 text-white mx-auto mb-1" />
                <span className="text-white text-xs font-bold">ALCALDÍA</span>
              </div>
            </div>
          </div>

          {/* Distritos alrededor */}
          <div className="grid grid-cols-3 gap-4 h-full">
            {distritos.map((distrito, index) => {
              const config = DISTRITOS_CONFIG.find(d => d.id === distrito.id);
              if (!config) return null;

              const posiciones = [
                'col-start-1 row-start-1',
                'col-start-2 row-start-1',
                'col-start-3 row-start-1',
                'col-start-1 row-start-2',
                'col-start-3 row-start-2',
                'col-start-1 row-start-3',
                'col-start-3 row-start-3'
              ];

              return (
                <div
                  key={distrito.id}
                  className={`${posiciones[index]} ${index === 1 || index === 2 || index === 5 || index === 6 ? '' : ''}`}
                >
                  <DistritoTarjeta
                    distrito={distrito}
                    config={config}
                    expandido={distritoExpandido === distrito.id}
                    onClick={() => setDistritoExpandido(
                      distritoExpandido === distrito.id ? null : distrito.id
                    )}
                  />
                </div>
              );
            })}
          </div>

          {/* Líneas de conexión visuales */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
            <line x1="50%" y1="50%" x2="16%" y2="16%" stroke="currentColor" strokeWidth="2" className="text-indigo-500" />
            <line x1="50%" y1="50%" x2="50%" y2="16%" stroke="currentColor" strokeWidth="2" className="text-indigo-500" />
            <line x1="50%" y1="50%" x2="84%" y2="16%" stroke="currentColor" strokeWidth="2" className="text-indigo-500" />
            <line x1="50%" y1="50%" x2="16%" y2="50%" stroke="currentColor" strokeWidth="2" className="text-indigo-500" />
            <line x1="50%" y1="50%" x2="84%" y2="50%" stroke="currentColor" strokeWidth="2" className="text-indigo-500" />
            <line x1="50%" y1="50%" x2="16%" y2="84%" stroke="currentColor" strokeWidth="2" className="text-indigo-500" />
            <line x1="50%" y1="50%" x2="84%" y2="84%" stroke="currentColor" strokeWidth="2" className="text-indigo-500" />
          </svg>
        </div>

        {/* Panel de control rápido */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chat MCP */}
          <div className="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-white" />
                <span className="font-semibold text-white">Chat con Alcalde IA</span>
              </div>
              <span className="text-xs px-2 py-0.5 bg-white/20 rounded-full text-white">Claude Opus</span>
            </div>

            <div className="h-64 overflow-y-auto p-4 space-y-3">
              {historialComandos.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <Bot className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>Escribe un comando para interactuar</p>
                  <div className="mt-4 space-y-2 text-xs">
                    <p className="text-gray-400">Ejemplos:</p>
                    <p>"¿Cuántas novedades hay en Colombia?"</p>
                    <p>"Dame el estado del distrito Crisis"</p>
                    <p>"¿Qué agentes están trabajando?"</p>
                  </div>
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

          {/* Alertas activas */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-white" />
                <span className="font-semibold text-white">Alertas Activas</span>
              </div>
              <span className="text-white font-bold">{alertas.filter(a => a.activa).length}</span>
            </div>

            <div className="h-64 overflow-y-auto p-4 space-y-3">
              {alertas.filter(a => a.activa).length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-green-500 opacity-50" />
                  <p className="text-green-600 dark:text-green-400 font-medium">Sin alertas activas</p>
                  <p className="text-sm text-gray-400">Todo funciona correctamente</p>
                </div>
              ) : (
                alertas.filter(a => a.activa).slice(0, 5).map(alerta => (
                  <div
                    key={alerta.id}
                    className={`rounded-lg p-3 border ${
                      alerta.tipo === 'critical' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' :
                      alerta.tipo === 'error' ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800' :
                      alerta.tipo === 'warning' ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' :
                      'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                        alerta.tipo === 'critical' ? 'text-red-500' :
                        alerta.tipo === 'error' ? 'text-orange-500' :
                        alerta.tipo === 'warning' ? 'text-amber-500' :
                        'text-blue-500'
                      }`} />
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800 dark:text-white text-sm">{alerta.titulo}</h4>
                        <p className="text-xs text-gray-600 dark:text-gray-300">{alerta.mensaje}</p>
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(alerta.creadaEn).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER VISTA DISTRITOS
  // ═══════════════════════════════════════════════════════════════════════════

  const renderVistaDistritos = () => {
    const distritos = getDistritos();

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
            <Layers className="w-7 h-7 text-indigo-500" />
            Los 7 Distritos Operativos
          </h2>
          <div className="text-sm text-gray-500">
            {distritos.filter(d => d.estado === 'operativo').length}/{distritos.length} operativos
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {distritos.map(distrito => {
            const config = DISTRITOS_CONFIG.find(d => d.id === distrito.id);
            if (!config) return null;

            return (
              <DistritoCard
                key={distrito.id}
                distrito={distrito}
                config={config}
                expandido={distritoExpandido === distrito.id}
                paisSeleccionado={paisSeleccionado}
                onToggle={() => setDistritoExpandido(
                  distritoExpandido === distrito.id ? null : distrito.id
                )}
              />
            );
          })}
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER VISTA AGENTES
  // ═══════════════════════════════════════════════════════════════════════════

  const renderVistaAgentes = () => {
    const todosAgentes = getAgentes(undefined, paisSeleccionado);
    const agentesFiltrados = busquedaAgente
      ? todosAgentes.filter(a =>
          a.nombre.toLowerCase().includes(busquedaAgente.toLowerCase()) ||
          a.especialidad.toLowerCase().includes(busquedaAgente.toLowerCase())
        )
      : todosAgentes;

    const agentesPorEstado = {
      trabajando: agentesFiltrados.filter(a => a.estado === EstadoAgente.TRABAJANDO).length,
      activos: agentesFiltrados.filter(a => a.estado === EstadoAgente.ACTIVO).length,
      pausados: agentesFiltrados.filter(a => a.estado === EstadoAgente.PAUSADO).length,
      error: agentesFiltrados.filter(a => a.estado === EstadoAgente.ERROR).length
    };

    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
            <Users className="w-7 h-7 text-indigo-500" />
            Agentes IA
          </h2>

          <div className="flex items-center gap-3">
            {/* Barra de búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={busquedaAgente}
                onChange={(e) => setBusquedaAgente(e.target.value)}
                placeholder="Buscar agente..."
                className="pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Estadísticas rápidas */}
            <div className="hidden lg:flex items-center gap-2 text-sm">
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                {agentesPorEstado.trabajando} trabajando
              </span>
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                {agentesPorEstado.activos} activos
              </span>
              <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full font-medium">
                {agentesPorEstado.pausados} pausados
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {agentesFiltrados.map(agente => (
            <AgenteCard
              key={agente.id}
              agente={agente}
              seleccionado={agenteSeleccionado === agente.id}
              onClick={() => setAgenteSeleccionado(
                agenteSeleccionado === agente.id ? null : agente.id
              )}
            />
          ))}
        </div>

        {agentesFiltrados.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Bot className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p>No se encontraron agentes</p>
          </div>
        )}
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER VISTA MÉTRICAS
  // ═══════════════════════════════════════════════════════════════════════════

  const renderVistaMetricas = () => {
    const statsNovedades = getEstadisticasNovedades(paisSeleccionado);
    const statsPedidos = getEstadisticasPedidos(paisSeleccionado);

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
          <BarChart3 className="w-7 h-7 text-indigo-500" />
          Métricas en Tiempo Real
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Panel Novedades */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 to-orange-500 px-4 py-3 flex items-center justify-between">
              <span className="font-semibold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Novedades
              </span>
              <span className="text-2xl font-bold text-white">{statsNovedades.activas}</span>
            </div>
            <div className="p-4 space-y-2">
              <MetricaLinea label="Resueltas hoy" valor={statsNovedades.resueltasHoy} color="text-green-600" />
              <MetricaLinea label="En oficina" valor={statsNovedades.enOficina} color="text-amber-600" />
              <MetricaLinea label="Escaladas" valor={statsNovedades.escaladas} color="text-red-600" />
              <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                <MetricaLinea label="Tasa resolución" valor={`${statsNovedades.tasaResolucion}%`} color="text-indigo-600" bold />
              </div>
            </div>
          </div>

          {/* Panel Pedidos */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-3 flex items-center justify-between">
              <span className="font-semibold text-white flex items-center gap-2">
                <Package className="w-5 h-5" />
                Pedidos
              </span>
              <span className="text-2xl font-bold text-white">{statsPedidos.procesadosHoy}</span>
            </div>
            <div className="p-4 space-y-2">
              <MetricaLinea label="Pendientes" valor={statsPedidos.pendientes} color="text-amber-600" />
              <MetricaLinea label="Chatea Pro" valor={statsPedidos.porOrigen.chatea_pro} color="text-blue-600" />
              <MetricaLinea label="Shopify" valor={statsPedidos.porOrigen.shopify} color="text-purple-600" />
              <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                <MetricaLinea label="Tasa automática" valor={`${statsPedidos.tasaAutomatizacion || 92}%`} color="text-indigo-600" bold />
              </div>
            </div>
          </div>

          {/* Panel Comunicaciones */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-3 flex items-center justify-between">
              <span className="font-semibold text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Comunicaciones
              </span>
              <span className="text-2xl font-bold text-white">{metricas?.conversacionesActivas || 0}</span>
            </div>
            <div className="p-4 space-y-2">
              <MetricaLinea label="Chats activos" valor={metricas?.conversacionesActivas || 0} color="text-purple-600" />
              <MetricaLinea label="Llamadas hoy" valor={getLlamadasPendientes().length} color="text-blue-600" />
              <MetricaLinea label="Tiempo respuesta" valor={`${metricas?.tiempoRespuestaPromedio || 6}s`} color="text-green-600" />
              <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                <MetricaLinea label="Satisfacción" valor={`${metricas?.satisfaccionCliente || 91}%`} color="text-indigo-600" bold />
              </div>
            </div>
          </div>

          {/* Panel Guías */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-3 flex items-center justify-between">
              <span className="font-semibold text-white flex items-center gap-2">
                <Target className="w-5 h-5" />
                Tracking
              </span>
              <span className="text-2xl font-bold text-white">{metricas?.guiasRastreadas || 0}</span>
            </div>
            <div className="p-4 space-y-2">
              <MetricaLinea label="Con novedad" valor={metricas?.guiasConNovedad || 0} color="text-amber-600" />
              <MetricaLinea label="Críticas" valor={metricas?.guiasCriticas || 0} color="text-red-600" />
              <MetricaLinea label="En tránsito" valor={Math.floor((metricas?.guiasRastreadas || 100) * 0.7)} color="text-blue-600" />
              <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                <MetricaLinea label="Automatización" valor={`${metricas?.tasaAutomatizacion || 96}%`} color="text-indigo-600" bold />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER VISTA MEMORIA
  // ═══════════════════════════════════════════════════════════════════════════

  const renderVistaMemoria = () => {
    const aprendizajes = getAprendizajes();

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
            <Brain className="w-7 h-7 text-pink-500" />
            Memoria Colectiva
          </h2>
          <span className="px-3 py-1 bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 rounded-full font-medium">
            {aprendizajes.length} aprendizajes
          </span>
        </div>

        <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-xl p-6 border border-purple-500/20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-500 mb-1">{aprendizajes.length}</div>
              <div className="text-gray-500">Total Aprendizajes</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-pink-500 mb-1">{Math.floor(aprendizajes.length * 0.7)}</div>
              <div className="text-gray-500">Aplicados</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-indigo-500 mb-1">+18%</div>
              <div className="text-gray-500">Mejora Eficiencia</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-800 dark:text-white">Aprendizajes Recientes</h3>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-96 overflow-y-auto">
            {aprendizajes.slice(0, 10).map((aprendizaje, idx) => (
              <div key={aprendizaje.id || idx} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <div className="flex items-start justify-between">
                  <div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      aprendizaje.tipo === 'experiencia' ? 'bg-blue-100 text-blue-700' :
                      aprendizaje.tipo === 'patron' ? 'bg-purple-100 text-purple-700' :
                      aprendizaje.tipo === 'optimizacion' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {aprendizaje.tipo}
                    </span>
                    <p className="text-gray-800 dark:text-white font-medium mt-1">{aprendizaje.descripcion}</p>
                    <p className="text-sm text-gray-500">{aprendizaje.categoria}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    aprendizaje.impacto === 'alto' ? 'bg-red-100 text-red-700' :
                    aprendizaje.impacto === 'medio' ? 'bg-amber-100 text-amber-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {aprendizaje.impacto}
                  </span>
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
      {renderNavegacion()}

      {vistaActiva === 'mapa' && renderMapaCiudad()}
      {vistaActiva === 'distritos' && renderVistaDistritos()}
      {vistaActiva === 'agentes' && renderVistaAgentes()}
      {vistaActiva === 'metricas' && renderVistaMetricas()}
      {vistaActiva === 'alertas' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
            <AlertTriangle className="w-7 h-7 text-amber-500" />
            Centro de Alertas
          </h2>
          {/* Contenido de alertas */}
        </div>
      )}
      {vistaActiva === 'memoria' && renderVistaMemoria()}
      {vistaActiva === 'configuracion' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
            <Settings className="w-7 h-7 text-gray-500" />
            Configuración del Sistema
          </h2>
          {/* Contenido de configuración */}
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTES AUXILIARES
// ═══════════════════════════════════════════════════════════════════════════════

const MetricaCompacta: React.FC<{
  icono: React.ReactNode;
  valor: number | string;
  label: string;
  color: string;
}> = ({ icono, valor, label, color }) => (
  <div className={`bg-gradient-to-br ${color} rounded-xl p-3 text-center shadow-lg`}>
    <div className="text-white/80 mb-1 flex justify-center">{icono}</div>
    <div className="text-xl font-bold text-white">{valor}</div>
    <div className="text-xs text-white/70">{label}</div>
  </div>
);

const MetricaLinea: React.FC<{
  label: string;
  valor: number | string;
  color: string;
  bold?: boolean;
}> = ({ label, valor, color, bold }) => (
  <div className="flex justify-between text-sm">
    <span className="text-gray-500">{label}</span>
    <span className={`${color} ${bold ? 'font-bold' : 'font-medium'}`}>{valor}</span>
  </div>
);

const DistritoTarjeta: React.FC<{
  distrito: Distrito;
  config: typeof DISTRITOS_CONFIG[0];
  expandido: boolean;
  onClick: () => void;
}> = ({ distrito, config, expandido, onClick }) => (
  <button
    onClick={onClick}
    className={`${config.colorBg} rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all text-left w-full group hover:scale-105`}
  >
    <div className="flex items-center gap-3 mb-2">
      <span className="text-3xl">{config.icono}</span>
      <div>
        <h3 className="font-bold text-gray-800 dark:text-white text-sm">{config.nombre}</h3>
        <span className={`text-xs px-2 py-0.5 rounded-full ${
          distrito.estado === 'operativo' ? 'bg-green-100 text-green-700' :
          distrito.estado === 'degradado' ? 'bg-amber-100 text-amber-700' :
          'bg-red-100 text-red-700'
        }`}>
          {distrito.estado}
        </span>
      </div>
    </div>
    <div className="flex items-center justify-between text-xs text-gray-500">
      <span>{distrito.agentesActivos} agentes</span>
      <span>{distrito.tasaExitoHoy.toFixed(0)}% éxito</span>
    </div>
  </button>
);

const DistritoCard: React.FC<{
  distrito: Distrito;
  config: typeof DISTRITOS_CONFIG[0];
  expandido: boolean;
  paisSeleccionado: Pais;
  onToggle: () => void;
}> = ({ distrito, config, expandido, paisSeleccionado, onToggle }) => {
  const agentes = getAgentes(distrito.id, paisSeleccionado);

  return (
    <div className={`${config.colorBg} rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-all ${expandido ? 'ring-2 ring-indigo-500' : ''}`}>
      <button
        onClick={onToggle}
        className="w-full p-4 text-left hover:bg-black/5 transition-colors"
      >
        <div className="flex items-start justify-between mb-3">
          <span className="text-4xl">{config.icono}</span>
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

        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-2">
            <div className="text-lg font-bold text-gray-800 dark:text-white">{agentes.length}</div>
            <div className="text-xs text-gray-500">Agentes</div>
          </div>
          <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-2">
            <div className="text-lg font-bold text-green-600">{distrito.tareasCompletadasHoy}</div>
            <div className="text-xs text-gray-500">Completadas</div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200/50 dark:border-gray-600/50">
          <span className="text-xs text-gray-500">Tasa: {distrito.tasaExitoHoy.toFixed(0)}%</span>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expandido ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {expandido && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white/50 dark:bg-gray-800/50 space-y-4">
          {/* Características del distrito */}
          {config.caracteristicas && config.caracteristicas.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-800 dark:text-white mb-2 text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                Características del Distrito
              </h4>
              <div className="grid grid-cols-1 gap-1.5">
                {config.caracteristicas.map((caracteristica, idx) => (
                  <div key={idx} className="text-xs text-gray-600 dark:text-gray-300 bg-indigo-50 dark:bg-indigo-900/30 rounded px-2 py-1.5">
                    {caracteristica}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tareas del distrito */}
          {config.tareas && config.tareas.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-800 dark:text-white mb-2 text-sm flex items-center gap-2">
                <Target className="w-4 h-4 text-green-500" />
                Tareas Principales
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {config.tareas.map((tarea, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300">
                    <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" />
                    <span>{tarea}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Agentes del distrito */}
          <div>
            <h4 className="font-semibold text-gray-800 dark:text-white mb-2 text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" />
              Agentes del Distrito ({agentes.length})
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {agentes.slice(0, 5).map(agente => (
                <div key={agente.id} className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Bot className={`w-4 h-4 ${
                      agente.estado === EstadoAgente.TRABAJANDO ? 'text-green-500' :
                      agente.estado === EstadoAgente.ACTIVO ? 'text-blue-500' :
                      'text-gray-400'
                    }`} />
                    <span className="text-gray-800 dark:text-white">{agente.nombre}</span>
                  </div>
                  <span className={`text-xs ${
                    agente.estado === EstadoAgente.TRABAJANDO ? 'text-green-600' :
                    agente.estado === EstadoAgente.ACTIVO ? 'text-blue-600' :
                    'text-gray-500'
                  }`}>
                    {agente.estado}
                  </span>
                </div>
              ))}
              {agentes.length > 5 && (
                <p className="text-xs text-gray-500 text-center">+{agentes.length - 5} más</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const AgenteCard: React.FC<{
  agente: Agente;
  seleccionado: boolean;
  onClick: () => void;
}> = ({ agente, seleccionado, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg border p-4 text-left transition-all hover:shadow-xl ${
      seleccionado ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-gray-200 dark:border-gray-700'
    }`}
  >
    <div className="flex items-start justify-between mb-3">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
        agente.estado === EstadoAgente.TRABAJANDO ? 'bg-green-100 text-green-600' :
        agente.estado === EstadoAgente.ACTIVO ? 'bg-blue-100 text-blue-600' :
        agente.estado === EstadoAgente.PAUSADO ? 'bg-amber-100 text-amber-600' :
        'bg-gray-100 text-gray-600'
      }`}>
        <Bot className="w-6 h-6" />
      </div>
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
        agente.estado === EstadoAgente.TRABAJANDO ? 'bg-green-100 text-green-700' :
        agente.estado === EstadoAgente.ACTIVO ? 'bg-blue-100 text-blue-700' :
        agente.estado === EstadoAgente.PAUSADO ? 'bg-amber-100 text-amber-700' :
        'bg-gray-100 text-gray-700'
      }`}>
        {agente.estado}
      </span>
    </div>

    <h4 className="font-bold text-gray-800 dark:text-white mb-1">{agente.nombre}</h4>
    <p className="text-sm text-gray-500 mb-3">{agente.especialidad.replace(/_/g, ' ')}</p>

    <div className="grid grid-cols-2 gap-2 text-center text-xs">
      <div className="bg-gray-50 dark:bg-gray-700 rounded p-2">
        <div className="font-bold text-gray-800 dark:text-white">{agente.tareasCompletadas}</div>
        <div className="text-gray-500">Tareas</div>
      </div>
      <div className="bg-gray-50 dark:bg-gray-700 rounded p-2">
        <div className="font-bold text-gray-800 dark:text-white">{agente.calificacionPromedio.toFixed(1)}</div>
        <div className="text-gray-500">Puntuación</div>
      </div>
    </div>

    {seleccionado && (
      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Tareas fallidas:</span>
          <span className="text-red-600">{agente.tareasFallidas}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Tiempo promedio:</span>
          <span className="text-gray-800 dark:text-white">{agente.tiempoPromedioTarea}s</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">País:</span>
          <span className="text-gray-800 dark:text-white">
            {agente.pais === Pais.COLOMBIA ? '🇨🇴' : agente.pais === Pais.CHILE ? '🇨🇱' : '🇪🇨'}
          </span>
        </div>
      </div>
    )}
  </button>
);

export default CiudadAgentesTab;
