// ============================================
// LITPER PRO - COMMAND CENTER
// Centro de comando con vista unificada en tiempo real
// ============================================

import React, { useState, useEffect, useMemo } from 'react';
import {
  Command,
  Activity,
  Package,
  Truck,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  Users,
  Bell,
  Zap,
  Target,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Eye,
  MoreHorizontal,
  ChevronRight,
  PlayCircle,
  PauseCircle,
  Volume2,
  VolumeX,
  Maximize2,
  Filter,
  Calendar,
  Globe,
  Sparkles,
  Shield,
  BarChart3,
} from 'lucide-react';

// ============================================
// TIPOS
// ============================================

interface LiveMetric {
  id: string;
  label: string;
  value: number | string;
  previousValue?: number;
  change?: number;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ElementType;
  color: string;
  trend?: number[];
}

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  source: string;
  actionLabel?: string;
  isRead: boolean;
}

interface ActivityItem {
  id: string;
  type: 'carga' | 'entrega' | 'novedad' | 'finanza' | 'usuario';
  title: string;
  description: string;
  timestamp: Date;
  user?: string;
  metadata?: Record<string, unknown>;
}

// ============================================
// DATOS MOCK (En producción conectar a tiempo real)
// ============================================

const generateMockMetrics = (): LiveMetric[] => [
  {
    id: 'guias-hoy',
    label: 'Guías Hoy',
    value: Math.floor(Math.random() * 50) + 150,
    previousValue: 180,
    change: 12.5,
    changeType: 'positive',
    icon: Package,
    color: 'from-blue-500 to-cyan-500',
    trend: [45, 52, 48, 55, 60, 58, 65],
  },
  {
    id: 'entregadas',
    label: 'Entregadas',
    value: Math.floor(Math.random() * 30) + 100,
    previousValue: 120,
    change: 8.3,
    changeType: 'positive',
    icon: CheckCircle,
    color: 'from-emerald-500 to-green-500',
    trend: [30, 35, 42, 38, 45, 48, 52],
  },
  {
    id: 'en-transito',
    label: 'En Tránsito',
    value: Math.floor(Math.random() * 20) + 40,
    previousValue: 50,
    change: -5.2,
    changeType: 'neutral',
    icon: Truck,
    color: 'from-amber-500 to-orange-500',
    trend: [20, 25, 22, 28, 24, 26, 23],
  },
  {
    id: 'con-novedad',
    label: 'Con Novedad',
    value: Math.floor(Math.random() * 10) + 5,
    previousValue: 8,
    change: 25,
    changeType: 'negative',
    icon: AlertTriangle,
    color: 'from-red-500 to-rose-500',
    trend: [3, 5, 4, 7, 6, 8, 9],
  },
  {
    id: 'tasa-entrega',
    label: 'Tasa Entrega',
    value: '78.5%',
    previousValue: 75.2,
    change: 3.3,
    changeType: 'positive',
    icon: Target,
    color: 'from-purple-500 to-violet-500',
    trend: [72, 74, 73, 76, 75, 78, 79],
  },
  {
    id: 'ventas-hoy',
    label: 'Ventas Hoy',
    value: '$4.2M',
    previousValue: 3800000,
    change: 10.5,
    changeType: 'positive',
    icon: DollarSign,
    color: 'from-green-500 to-emerald-500',
    trend: [3.2, 3.5, 3.8, 4.0, 3.9, 4.1, 4.2],
  },
];

const generateMockAlerts = (): Alert[] => [
  {
    id: '1',
    type: 'critical',
    title: 'Tasa de entrega crítica en Quibdó',
    message: 'La tasa de entrega cayó al 45%. Se recomienda pausar envíos.',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    source: 'Semáforo IA',
    actionLabel: 'Ver detalles',
    isRead: false,
  },
  {
    id: '2',
    type: 'warning',
    title: 'Stock bajo en producto estrella',
    message: 'Quedan solo 15 unidades del producto "Maleta Premium"',
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    source: 'Inventario',
    actionLabel: 'Gestionar',
    isRead: false,
  },
  {
    id: '3',
    type: 'success',
    title: 'Meta diaria alcanzada',
    message: 'Superaste la meta de 150 guías diarias. ¡Excelente trabajo!',
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    source: 'Dashboard',
    isRead: true,
  },
  {
    id: '4',
    type: 'info',
    title: 'Nueva transportadora disponible',
    message: 'Interrapidísimo habilitó nuevas rutas en Antioquia',
    timestamp: new Date(Date.now() - 60 * 60 * 1000),
    source: 'Integraciones',
    actionLabel: 'Configurar',
    isRead: true,
  },
];

const generateMockActivity = (): ActivityItem[] => [
  {
    id: '1',
    type: 'carga',
    title: 'Nueva carga creada',
    description: 'Carga #128 con 45 guías',
    timestamp: new Date(Date.now() - 2 * 60 * 1000),
    user: 'Felipe',
  },
  {
    id: '2',
    type: 'entrega',
    title: 'Guía entregada',
    description: 'Guía 775411 entregada en Bogotá',
    timestamp: new Date(Date.now() - 8 * 60 * 1000),
  },
  {
    id: '3',
    type: 'novedad',
    title: 'Novedad reportada',
    description: 'Dirección incorrecta en Medellín',
    timestamp: new Date(Date.now() - 12 * 60 * 1000),
    user: 'Karen',
  },
  {
    id: '4',
    type: 'finanza',
    title: 'Ingreso registrado',
    description: 'Venta de $350,000 procesada',
    timestamp: new Date(Date.now() - 20 * 60 * 1000),
  },
  {
    id: '5',
    type: 'usuario',
    title: 'Nuevo inicio de sesión',
    description: 'Jimmy inició sesión desde Bogotá',
    timestamp: new Date(Date.now() - 35 * 60 * 1000),
  },
];

// ============================================
// COMPONENTES AUXILIARES
// ============================================

const MiniChart: React.FC<{ data: number[]; color: string }> = ({ data, color }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  return (
    <div className="flex items-end gap-0.5 h-8">
      {data.map((value, index) => {
        const height = ((value - min) / range) * 100;
        return (
          <div
            key={index}
            className={`w-1 rounded-full bg-gradient-to-t ${color} opacity-60`}
            style={{ height: `${Math.max(height, 10)}%` }}
          />
        );
      })}
    </div>
  );
};

const AlertCard: React.FC<{ alert: Alert; onAction?: () => void }> = ({ alert, onAction }) => {
  const colors = {
    critical: 'bg-red-500/10 border-red-500/30 text-red-400',
    warning: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    info: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
  };

  const icons = {
    critical: AlertTriangle,
    warning: Bell,
    info: Zap,
    success: CheckCircle,
  };

  const Icon = icons[alert.type];

  return (
    <div className={`p-4 rounded-xl border ${colors[alert.type]} ${!alert.isRead ? 'ring-2 ring-offset-2 ring-offset-navy-900' : 'opacity-75'}`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${alert.type === 'critical' ? 'bg-red-500/20' : alert.type === 'warning' ? 'bg-amber-500/20' : alert.type === 'success' ? 'bg-emerald-500/20' : 'bg-blue-500/20'}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <h4 className="font-semibold text-white">{alert.title}</h4>
            <span className="text-xs text-slate-500">
              {formatTimeAgo(alert.timestamp)}
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">{alert.message}</p>
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-slate-500">{alert.source}</span>
            {alert.actionLabel && (
              <button
                onClick={onAction}
                className="text-xs font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                {alert.actionLabel}
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const formatTimeAgo = (date: Date): string => {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'Ahora';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export const CommandCenter: React.FC = () => {
  const [metrics, setMetrics] = useState<LiveMetric[]>(generateMockMetrics());
  const [alerts, setAlerts] = useState<Alert[]>(generateMockAlerts());
  const [activity, setActivity] = useState<ActivityItem[]>(generateMockActivity());
  const [isLive, setIsLive] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  // Simular actualización en tiempo real
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      setMetrics(generateMockMetrics());
      setLastUpdate(new Date());
    }, 5000);

    return () => clearInterval(interval);
  }, [isLive]);

  // Estadísticas del mapa (mock)
  const cityStats = useMemo(() => [
    { city: 'Bogotá', lat: 4.711, lng: -74.072, deliveries: 45, rate: 85, status: 'green' },
    { city: 'Medellín', lat: 6.244, lng: -75.581, deliveries: 32, rate: 78, status: 'green' },
    { city: 'Cali', lat: 3.451, lng: -76.532, deliveries: 28, rate: 65, status: 'yellow' },
    { city: 'Barranquilla', lat: 10.964, lng: -74.796, deliveries: 18, rate: 72, status: 'yellow' },
    { city: 'Cartagena', lat: 10.391, lng: -75.479, deliveries: 12, rate: 80, status: 'green' },
    { city: 'Quibdó', lat: 5.694, lng: -76.661, deliveries: 5, rate: 45, status: 'red' },
  ], []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-xl shadow-purple-500/30">
            <Command className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              Command Center
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full flex items-center gap-1">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                LIVE
              </span>
            </h1>
            <p className="text-slate-400">
              Vista unificada de todas las operaciones en tiempo real
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsLive(!isLive)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
              isLive
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-slate-700 text-slate-400'
            }`}
          >
            {isLive ? <PlayCircle className="w-4 h-4" /> : <PauseCircle className="w-4 h-4" />}
            {isLive ? 'En vivo' : 'Pausado'}
          </button>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl transition-all ${
              soundEnabled ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700 text-slate-400'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>

          <button
            onClick={() => {
              setMetrics(generateMockMetrics());
              setLastUpdate(new Date());
            }}
            className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl transition-all"
          >
            <RefreshCw className="w-5 h-5" />
          </button>

          <span className="text-xs text-slate-500">
            Actualizado: {lastUpdate.toLocaleTimeString('es-CO')}
          </span>
        </div>
      </div>

      {/* Live Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div
              key={metric.id}
              className="relative p-4 bg-navy-800/50 rounded-2xl border border-navy-700 hover:border-navy-600 transition-all group overflow-hidden"
            >
              {/* Gradient background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${metric.color} opacity-5 group-hover:opacity-10 transition-opacity`} />

              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${metric.color}`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  {metric.change !== undefined && (
                    <div className={`flex items-center gap-1 text-xs font-medium ${
                      metric.changeType === 'positive' ? 'text-emerald-400' :
                      metric.changeType === 'negative' ? 'text-red-400' :
                      'text-slate-400'
                    }`}>
                      {metric.changeType === 'positive' ? <ArrowUp className="w-3 h-3" /> :
                       metric.changeType === 'negative' ? <ArrowDown className="w-3 h-3" /> : null}
                      {Math.abs(metric.change)}%
                    </div>
                  )}
                </div>

                <p className="text-2xl font-bold text-white mb-1">
                  {metric.value}
                </p>
                <p className="text-xs text-slate-400">{metric.label}</p>

                {metric.trend && (
                  <div className="mt-3">
                    <MiniChart data={metric.trend} color={metric.color} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Map / Mapa de calor */}
        <div className="lg:col-span-2 bg-navy-800/50 rounded-2xl border border-navy-700 overflow-hidden">
          <div className="p-4 border-b border-navy-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-cyan-400" />
              <h3 className="font-semibold text-white">Mapa de Operaciones</h3>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-1.5 hover:bg-navy-700 rounded-lg transition-colors">
                <Filter className="w-4 h-4 text-slate-400" />
              </button>
              <button className="p-1.5 hover:bg-navy-700 rounded-lg transition-colors">
                <Maximize2 className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Simulated map with city points */}
          <div className="relative h-80 bg-gradient-to-br from-navy-900 to-navy-800 p-6">
            {/* Colombia outline (simplified) */}
            <div className="absolute inset-0 flex items-center justify-center opacity-20">
              <div className="w-64 h-80 border-2 border-cyan-500/30 rounded-[40%] transform -rotate-12" />
            </div>

            {/* City markers */}
            {cityStats.map((city, index) => {
              const x = 20 + (index % 3) * 30 + Math.random() * 10;
              const y = 15 + Math.floor(index / 3) * 35 + Math.random() * 10;

              return (
                <div
                  key={city.city}
                  className="absolute cursor-pointer group"
                  style={{ left: `${x}%`, top: `${y}%` }}
                  onClick={() => setSelectedCity(city.city)}
                >
                  {/* Pulse effect */}
                  <div className={`absolute -inset-2 rounded-full animate-ping ${
                    city.status === 'green' ? 'bg-emerald-500/30' :
                    city.status === 'yellow' ? 'bg-amber-500/30' :
                    'bg-red-500/30'
                  }`} />

                  {/* Marker */}
                  <div className={`relative w-4 h-4 rounded-full border-2 border-white shadow-lg ${
                    city.status === 'green' ? 'bg-emerald-500' :
                    city.status === 'yellow' ? 'bg-amber-500' :
                    'bg-red-500'
                  }`} />

                  {/* Tooltip */}
                  <div className="absolute left-6 top-0 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <div className="bg-navy-900 border border-navy-600 rounded-xl p-3 shadow-xl min-w-[160px]">
                      <p className="font-semibold text-white">{city.city}</p>
                      <div className="mt-2 space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Entregas:</span>
                          <span className="text-white font-medium">{city.deliveries}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Tasa:</span>
                          <span className={`font-medium ${
                            city.rate >= 75 ? 'text-emerald-400' :
                            city.rate >= 60 ? 'text-amber-400' :
                            'text-red-400'
                          }`}>{city.rate}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Legend */}
            <div className="absolute bottom-4 left-4 flex items-center gap-4 bg-navy-900/90 px-4 py-2 rounded-xl">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-xs text-slate-400">+75%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-xs text-slate-400">60-75%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-xs text-slate-400">&lt;60%</span>
              </div>
            </div>
          </div>

          {/* City list */}
          <div className="p-4 bg-navy-900/50">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {cityStats.map((city) => (
                <div
                  key={city.city}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    selectedCity === city.city
                      ? 'bg-cyan-500/10 border-cyan-500/30'
                      : 'bg-navy-800 border-navy-700 hover:border-navy-600'
                  }`}
                  onClick={() => setSelectedCity(city.city)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        city.status === 'green' ? 'bg-emerald-500' :
                        city.status === 'yellow' ? 'bg-amber-500' :
                        'bg-red-500'
                      }`} />
                      <span className="font-medium text-white">{city.city}</span>
                    </div>
                    <span className={`text-sm font-bold ${
                      city.rate >= 75 ? 'text-emerald-400' :
                      city.rate >= 60 ? 'text-amber-400' :
                      'text-red-400'
                    }`}>{city.rate}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Alerts Panel */}
        <div className="bg-navy-800/50 rounded-2xl border border-navy-700 overflow-hidden">
          <div className="p-4 border-b border-navy-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-amber-400" />
              <h3 className="font-semibold text-white">Alertas Activas</h3>
              <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs font-bold rounded-full">
                {alerts.filter(a => !a.isRead).length}
              </span>
            </div>
            <button className="text-xs text-slate-400 hover:text-white">
              Marcar leídas
            </button>
          </div>

          <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
            {alerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="bg-navy-800/50 rounded-2xl border border-navy-700 overflow-hidden">
        <div className="p-4 border-b border-navy-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-blue-400" />
            <h3 className="font-semibold text-white">Actividad Reciente</h3>
          </div>
          <button className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1">
            Ver todo
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4">
          <div className="flex gap-4 overflow-x-auto pb-2">
            {activity.map((item) => {
              const icons = {
                carga: Package,
                entrega: CheckCircle,
                novedad: AlertTriangle,
                finanza: DollarSign,
                usuario: Users,
              };
              const colors = {
                carga: 'from-blue-500 to-cyan-500',
                entrega: 'from-emerald-500 to-green-500',
                novedad: 'from-amber-500 to-orange-500',
                finanza: 'from-green-500 to-emerald-500',
                usuario: 'from-purple-500 to-violet-500',
              };
              const Icon = icons[item.type];

              return (
                <div
                  key={item.id}
                  className="flex-shrink-0 w-64 p-4 bg-navy-900/50 rounded-xl border border-navy-700 hover:border-navy-600 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${colors[item.type]}`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">{item.title}</p>
                      <p className="text-sm text-slate-400 truncate">{item.description}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                        <Clock className="w-3 h-3" />
                        <span>{formatTimeAgo(item.timestamp)}</span>
                        {item.user && (
                          <>
                            <span>•</span>
                            <span>{item.user}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Stats Footer */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Cargas Activas', value: '12', icon: Package, color: 'from-blue-500 to-cyan-500' },
          { label: 'Usuarios Online', value: '6', icon: Users, color: 'from-emerald-500 to-green-500' },
          { label: 'Tickets Abiertos', value: '3', icon: MessageSquare, color: 'from-amber-500 to-orange-500' },
          { label: 'Integraciones', value: '5/7', icon: Plug, color: 'from-purple-500 to-violet-500' },
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="flex items-center gap-4 p-4 bg-navy-800/50 rounded-xl border border-navy-700"
            >
              <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color}`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-slate-400">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Para evitar error de MessageSquare no definido
const MessageSquare = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

export default CommandCenter;
