/**
 * 🌆 DistritosIATab - Sistema de Distritos con IA Integrada
 * Cada distrito se abre en una nueva pestaña con su propio chat inteligente
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  Bot,
  Package,
  ShoppingCart,
  AlertTriangle,
  MessageCircle,
  CheckCircle2,
  Brain,
  Settings,
  ExternalLink,
  Sparkles,
  TrendingUp,
  Activity,
  Users,
  Target,
  Zap,
  Globe,
  Map,
  Layers,
  ChevronRight,
  Play,
  Eye,
  BarChart3,
  Clock,
  Star,
  Award,
} from 'lucide-react';
import { DistritoDetailPage } from '../distrito/DistritoDetailPage';
import { Country } from '../../types/country';

interface DistritosIATabProps {
  selectedCountry: Country;
}

interface Distrito {
  id: string;
  nombre: string;
  descripcion: string;
  icono: string;
  color: string;
  gradiente: string;
  procesos: string[];
  stats: {
    tareas: number;
    resueltas: number;
    pendientes: number;
    eficiencia: number;
  };
  capacidades: string[];
  estado: 'activo' | 'procesando' | 'pausado';
}

const DISTRITOS: Distrito[] = [
  {
    id: 'tracking',
    nombre: 'Distrito de Rastreo',
    descripcion: 'Seguimiento de guías y rastreo en tiempo real',
    icono: '📦',
    color: 'blue',
    gradiente: 'from-blue-500 to-cyan-600',
    procesos: ['P01: Seguimiento de Guías'],
    stats: { tareas: 1250, resueltas: 1180, pendientes: 70, eficiencia: 94.4 },
    capacidades: ['Rastrear guías', 'Detectar retrasos', 'Notificar estados', 'Crear tickets'],
    estado: 'activo',
  },
  {
    id: 'orders',
    nombre: 'Distrito de Pedidos',
    descripcion: 'Gestión de pedidos y procesamiento de órdenes',
    icono: '🛒',
    color: 'green',
    gradiente: 'from-green-500 to-emerald-600',
    procesos: ['P05: Generación de Pedidos'],
    stats: { tareas: 890, resueltas: 865, pendientes: 25, eficiencia: 97.2 },
    capacidades: ['Crear pedidos', 'Validar datos', 'Procesar órdenes', 'Gestionar inventario'],
    estado: 'activo',
  },
  {
    id: 'crisis',
    nombre: 'Distrito de Crisis',
    descripcion: 'Manejo de novedades y resolución de problemas',
    icono: '🚨',
    color: 'red',
    gradiente: 'from-red-500 to-orange-600',
    procesos: ['P02: Novedades', 'P03: Reclamo en Oficina'],
    stats: { tareas: 320, resueltas: 285, pendientes: 35, eficiencia: 89.1 },
    capacidades: ['Resolver novedades', 'Gestionar reclamos', 'Escalar casos', 'Coordinar entregas'],
    estado: 'procesando',
  },
  {
    id: 'communications',
    nombre: 'Distrito de Comunicaciones',
    descripcion: 'Chat en vivo y comunicación con clientes',
    icono: '💬',
    color: 'purple',
    gradiente: 'from-purple-500 to-pink-600',
    procesos: ['P04: Chat en Vivo'],
    stats: { tareas: 2100, resueltas: 1950, pendientes: 150, eficiencia: 92.9 },
    capacidades: ['Responder chats', 'Enviar plantillas', 'Gestionar tableros', 'Automatizar respuestas'],
    estado: 'activo',
  },
  {
    id: 'quality',
    nombre: 'Distrito de Calidad',
    descripcion: 'Control de calidad y garantías',
    icono: '✅',
    color: 'teal',
    gradiente: 'from-teal-500 to-green-600',
    procesos: ['Gestión de Garantías'],
    stats: { tareas: 180, resueltas: 165, pendientes: 15, eficiencia: 91.7 },
    capacidades: ['Verificar entregas', 'Procesar garantías', 'Validar evidencias', 'Auditar procesos'],
    estado: 'activo',
  },
  {
    id: 'intelligence',
    nombre: 'Distrito de Inteligencia',
    descripcion: 'Análisis e inteligencia artificial',
    icono: '🧠',
    color: 'indigo',
    gradiente: 'from-indigo-500 to-purple-600',
    procesos: ['Análisis de Patrones', 'Predicción ML'],
    stats: { tareas: 450, resueltas: 430, pendientes: 20, eficiencia: 95.6 },
    capacidades: ['Analizar datos', 'Detectar patrones', 'Predecir retrasos', 'Generar reportes'],
    estado: 'activo',
  },
  {
    id: 'automation',
    nombre: 'Distrito de Automatización',
    descripcion: 'Automatización de procesos',
    icono: '⚙️',
    color: 'gray',
    gradiente: 'from-gray-500 to-slate-600',
    procesos: ['Workflows Automáticos'],
    stats: { tareas: 560, resueltas: 540, pendientes: 20, eficiencia: 96.4 },
    capacidades: ['Ejecutar flujos', 'Programar tareas', 'Integrar sistemas', 'Monitorear procesos'],
    estado: 'activo',
  },
];

export const DistritosIATab: React.FC<DistritosIATabProps> = ({ selectedCountry }) => {
  const [distritoSeleccionado, setDistritoSeleccionado] = useState<string | null>(null);
  const [modoVista, setModoVista] = useState<'grid' | 'mapa'>('grid');
  const [mlActivo, setMlActivo] = useState(true);
  const [showStats, setShowStats] = useState(true);

  // Estadísticas globales
  const statsGlobales = useMemo(() => {
    const totals = DISTRITOS.reduce(
      (acc, d) => ({
        tareas: acc.tareas + d.stats.tareas,
        resueltas: acc.resueltas + d.stats.resueltas,
        pendientes: acc.pendientes + d.stats.pendientes,
      }),
      { tareas: 0, resueltas: 0, pendientes: 0 }
    );
    return {
      ...totals,
      eficiencia: ((totals.resueltas / totals.tareas) * 100).toFixed(1),
    };
  }, []);

  // Abrir distrito en nueva pestaña
  const openDistritoInNewTab = (distritoId: string) => {
    // Crear URL con parámetros
    const params = new URLSearchParams({
      distrito: distritoId,
      pais: selectedCountry || 'COLOMBIA',
    });

    // En desarrollo, abrimos en la misma ventana en modo de detalle
    // En producción podría ser una nueva pestaña
    setDistritoSeleccionado(distritoId);
  };

  // Si hay un distrito seleccionado, mostrar su detalle
  if (distritoSeleccionado) {
    return (
      <DistritoDetailPage
        distritoId={distritoSeleccionado}
        paisSeleccionado={selectedCountry || 'COLOMBIA'}
        onClose={() => setDistritoSeleccionado(null)}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Premium */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-900 p-8 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-500/20 to-transparent rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-indigo-500/20 to-transparent rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />

        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Building2 className="w-10 h-10 text-purple-400" />
                <div>
                  <h1 className="text-3xl lg:text-4xl font-bold">
                    🌆 Ciudad de Agentes IA
                  </h1>
                  <p className="text-purple-200 text-lg">Sistema de Distritos Inteligentes</p>
                </div>
              </div>
              <p className="text-purple-100 mt-4 max-w-2xl">
                Cada distrito tiene su propio asistente IA especializado. Haz clic en cualquier distrito
                para abrir su centro de control con chat inteligente, gestión de tareas y análisis en tiempo real.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {/* Estado ML */}
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${
                mlActivo ? 'bg-green-500/20 border border-green-400/30' : 'bg-red-500/20 border border-red-400/30'
              }`}>
                <div className={`w-2 h-2 rounded-full ${mlActivo ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                <span className="font-medium">Sistema ML {mlActivo ? 'Activo' : 'Inactivo'}</span>
                <button
                  onClick={() => setMlActivo(!mlActivo)}
                  className={`p-1 rounded-lg ${mlActivo ? 'bg-green-400/20 hover:bg-green-400/30' : 'bg-red-400/20 hover:bg-red-400/30'}`}
                >
                  {mlActivo ? <Play className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                </button>
              </div>

              {/* País */}
              <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-xl">
                <Globe className="w-4 h-4" />
                <span className="font-medium">
                  {selectedCountry === 'COLOMBIA' ? 'Colombia' :
                   selectedCountry === 'CHILE' ? 'Chile' : 'Ecuador'}
                </span>
              </div>
            </div>
          </div>

          {/* Stats rápidas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            {[
              { label: 'Tareas Totales', value: statsGlobales.tareas.toLocaleString(), icon: Target, color: 'from-blue-400 to-cyan-400' },
              { label: 'Resueltas', value: statsGlobales.resueltas.toLocaleString(), icon: CheckCircle2, color: 'from-green-400 to-emerald-400' },
              { label: 'Pendientes', value: statsGlobales.pendientes.toLocaleString(), icon: Clock, color: 'from-orange-400 to-red-400' },
              { label: 'Eficiencia', value: `${statsGlobales.eficiencia}%`, icon: TrendingUp, color: 'from-purple-400 to-pink-400' },
            ].map((stat, idx) => (
              <div key={idx} className="bg-white/10 backdrop-blur rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <stat.icon className="w-5 h-5 text-purple-300" />
                  <span className={`text-2xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                    {stat.value}
                  </span>
                </div>
                <p className="text-sm text-purple-200">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Indicador de nueva pestaña */}
      <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-xl border border-indigo-200 dark:border-indigo-700">
        <ExternalLink className="w-6 h-6 text-indigo-500" />
        <div className="flex-1">
          <p className="font-bold text-indigo-800 dark:text-indigo-200">
            Cada distrito se abre con su propio asistente IA
          </p>
          <p className="text-sm text-indigo-600 dark:text-indigo-300">
            Haz clic en cualquier distrito para acceder a su chat inteligente con todas las funcionalidades
          </p>
        </div>
      </div>

      {/* Grid de Distritos */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {DISTRITOS.map((distrito) => (
          <button
            key={distrito.id}
            onClick={() => openDistritoInNewTab(distrito.id)}
            className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border-2 border-transparent hover:border-indigo-400 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-2xl text-left"
          >
            {/* Header del distrito */}
            <div className={`bg-gradient-to-r ${distrito.gradiente} p-6 text-white relative overflow-hidden`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2" />

              <div className="relative z-10 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{distrito.icono}</span>
                  <div>
                    <h3 className="text-xl font-bold">{distrito.nombre}</h3>
                    <p className="text-sm text-white/80">{distrito.descripcion}</p>
                  </div>
                </div>

                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                  distrito.estado === 'activo' ? 'bg-green-400/30 text-green-100' :
                  distrito.estado === 'procesando' ? 'bg-yellow-400/30 text-yellow-100' :
                  'bg-gray-400/30 text-gray-100'
                }`}>
                  {distrito.estado === 'activo' ? '🟢 Activo' :
                   distrito.estado === 'procesando' ? '🟡 Procesando' : '⚪ Pausado'}
                </span>
              </div>

              {/* Procesos */}
              <div className="mt-4 flex flex-wrap gap-2">
                {distrito.procesos.map((proceso, idx) => (
                  <span key={idx} className="px-2 py-1 bg-white/20 rounded-lg text-xs font-medium">
                    {proceso}
                  </span>
                ))}
              </div>
            </div>

            {/* Stats del distrito */}
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center p-3 bg-slate-50 dark:bg-gray-700/50 rounded-xl">
                  <p className="text-2xl font-bold text-slate-800 dark:text-white">{distrito.stats.resueltas}</p>
                  <p className="text-xs text-slate-500">Resueltas</p>
                </div>
                <div className="text-center p-3 bg-slate-50 dark:bg-gray-700/50 rounded-xl">
                  <p className="text-2xl font-bold text-slate-800 dark:text-white">{distrito.stats.pendientes}</p>
                  <p className="text-xs text-slate-500">Pendientes</p>
                </div>
              </div>

              {/* Barra de eficiencia */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-slate-500">Eficiencia</span>
                  <span className="font-bold text-slate-800 dark:text-white">{distrito.stats.eficiencia}%</span>
                </div>
                <div className="w-full h-2 bg-slate-200 dark:bg-gray-600 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${distrito.gradiente} rounded-full transition-all duration-500`}
                    style={{ width: `${distrito.stats.eficiencia}%` }}
                  />
                </div>
              </div>

              {/* Capacidades */}
              <div className="space-y-1 mb-4">
                <p className="text-xs font-bold text-slate-400 uppercase">Capacidades:</p>
                <div className="flex flex-wrap gap-1">
                  {distrito.capacidades.slice(0, 3).map((cap, idx) => (
                    <span key={idx} className="px-2 py-1 bg-slate-100 dark:bg-gray-700 rounded text-xs text-slate-600 dark:text-slate-300">
                      {cap}
                    </span>
                  ))}
                  {distrito.capacidades.length > 3 && (
                    <span className="px-2 py-1 bg-slate-100 dark:bg-gray-700 rounded text-xs text-slate-400">
                      +{distrito.capacidades.length - 3} más
                    </span>
                  )}
                </div>
              </div>

              {/* CTA */}
              <div className={`flex items-center justify-center gap-2 p-3 bg-gradient-to-r ${distrito.gradiente} rounded-xl text-white font-bold group-hover:shadow-lg transition-all`}>
                <Bot className="w-5 h-5" />
                <span>Abrir Chat Inteligente</span>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Indicador de hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </button>
        ))}
      </div>

      {/* Panel de Información */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Procesos LITPER */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">Procesos LITPER</h3>
              <p className="text-sm text-slate-500">Flujos automatizados disponibles</p>
            </div>
          </div>

          <div className="space-y-3">
            {[
              { id: 'P01', nombre: 'Seguimiento de Guías', prioridad: 'CRÍTICO', auto: '100%' },
              { id: 'P02', nombre: 'Novedades', prioridad: 'CRÍTICO', auto: '90%' },
              { id: 'P03', nombre: 'Reclamo en Oficina', prioridad: 'ALTO', auto: '85%' },
              { id: 'P04', nombre: 'Chat en Vivo', prioridad: 'ALTO', auto: '80%' },
              { id: 'P05', nombre: 'Generación de Pedidos', prioridad: 'MEDIO', auto: '95%' },
            ].map((proceso) => (
              <div
                key={proceso.id}
                className="flex items-center justify-between p-4 bg-slate-50 dark:bg-gray-700/50 rounded-xl hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded font-mono text-sm font-bold">
                    {proceso.id}
                  </span>
                  <span className="font-medium text-slate-700 dark:text-slate-200">{proceso.nombre}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    proceso.prioridad === 'CRÍTICO' ? 'bg-red-100 text-red-700' :
                    proceso.prioridad === 'ALTO' ? 'bg-orange-100 text-orange-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {proceso.prioridad}
                  </span>
                  <span className="text-sm text-slate-500">{proceso.auto}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sistema ML Status */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">Sistema ML</h3>
              <p className="text-sm text-slate-500">Modelos de Machine Learning activos</p>
            </div>
          </div>

          <div className="space-y-4">
            {[
              { nombre: 'Predictor de Retrasos', accuracy: 92.3, estado: 'activo', predicciones: 1247 },
              { nombre: 'Detector de Novedades', accuracy: 87.6, estado: 'activo', predicciones: 892 },
              { nombre: 'Optimizador de Rutas', accuracy: 89.1, estado: 'activo', predicciones: 456 },
            ].map((modelo, idx) => (
              <div key={idx} className="p-4 bg-gradient-to-r from-slate-50 to-purple-50 dark:from-gray-700/50 dark:to-purple-900/20 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-700 dark:text-slate-200">{modelo.nombre}</span>
                  <span className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-xs font-bold">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    {modelo.estado.toUpperCase()}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500">Accuracy</p>
                    <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{modelo.accuracy}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Predicciones hoy</p>
                    <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{modelo.predicciones}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setDistritoSeleccionado('intelligence')}
            className="w-full mt-4 p-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-lg transition-all"
          >
            <Eye className="w-5 h-5" />
            Ver Dashboard ML Completo
          </button>
        </div>
      </div>
    </div>
  );
};

export default DistritosIATab;
