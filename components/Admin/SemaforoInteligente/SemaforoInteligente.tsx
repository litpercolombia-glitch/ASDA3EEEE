// ============================================
// LITPER PRO - SEMÁFORO INTELIGENTE 2.0
// Sistema avanzado de monitoreo de entregas con predicciones
// ============================================

import React, { useState, useMemo } from 'react';
import {
  MapPin,
  Truck,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Filter,
  Search,
  Download,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  Eye,
  PauseCircle,
  PlayCircle,
  Settings,
  Bell,
  Zap,
  Target,
  Calendar,
  BarChart3,
  Info,
  AlertCircle,
  XCircle,
  ThumbsUp,
  ThumbsDown,
  Brain,
  Sparkles,
} from 'lucide-react';

// ============================================
// TIPOS
// ============================================

interface CityData {
  id: string;
  ciudad: string;
  departamento: string;
  totalGuias: number;
  entregadas: number;
  enTransito: number;
  devueltas: number;
  novedades: number;
  tasaEntrega: number;
  tasaDevolucion: number;
  tiempoPromedio: number;
  tendencia: 'up' | 'down' | 'stable';
  status: 'verde' | 'amarillo' | 'naranja' | 'rojo';
  transportadoraPrincipal: string;
  ultimaActualizacion: Date;
  prediccion48h: number;
  recomendacion?: string;
  pausado: boolean;
}

interface TransportadoraData {
  nombre: string;
  tasaEntrega: number;
  tiempoPromedio: number;
  guias: number;
  status: 'verde' | 'amarillo' | 'rojo';
}

// ============================================
// DATOS MOCK
// ============================================

const generateCityData = (): CityData[] => [
  {
    id: '1',
    ciudad: 'Bogotá',
    departamento: 'Cundinamarca',
    totalGuias: 1250,
    entregadas: 1062,
    enTransito: 125,
    devueltas: 63,
    novedades: 15,
    tasaEntrega: 85,
    tasaDevolucion: 5,
    tiempoPromedio: 2.1,
    tendencia: 'up',
    status: 'verde',
    transportadoraPrincipal: 'Coordinadora',
    ultimaActualizacion: new Date(),
    prediccion48h: 87,
    pausado: false,
  },
  {
    id: '2',
    ciudad: 'Medellín',
    departamento: 'Antioquia',
    totalGuias: 890,
    entregadas: 712,
    enTransito: 133,
    devueltas: 45,
    novedades: 22,
    tasaEntrega: 80,
    tasaDevolucion: 5,
    tiempoPromedio: 2.4,
    tendencia: 'stable',
    status: 'verde',
    transportadoraPrincipal: 'Servientrega',
    ultimaActualizacion: new Date(),
    prediccion48h: 82,
    pausado: false,
  },
  {
    id: '3',
    ciudad: 'Cali',
    departamento: 'Valle del Cauca',
    totalGuias: 650,
    entregadas: 455,
    enTransito: 130,
    devueltas: 65,
    novedades: 35,
    tasaEntrega: 70,
    tasaDevolucion: 10,
    tiempoPromedio: 3.2,
    tendencia: 'down',
    status: 'amarillo',
    transportadoraPrincipal: 'TCC',
    ultimaActualizacion: new Date(),
    prediccion48h: 68,
    recomendacion: 'Considerar cambiar transportadora',
    pausado: false,
  },
  {
    id: '4',
    ciudad: 'Barranquilla',
    departamento: 'Atlántico',
    totalGuias: 420,
    entregadas: 294,
    enTransito: 84,
    devueltas: 42,
    novedades: 18,
    tasaEntrega: 70,
    tasaDevolucion: 10,
    tiempoPromedio: 3.5,
    tendencia: 'down',
    status: 'amarillo',
    transportadoraPrincipal: 'Interrapidísimo',
    ultimaActualizacion: new Date(),
    prediccion48h: 72,
    pausado: false,
  },
  {
    id: '5',
    ciudad: 'Cartagena',
    departamento: 'Bolívar',
    totalGuias: 280,
    entregadas: 224,
    enTransito: 42,
    devueltas: 14,
    novedades: 8,
    tasaEntrega: 80,
    tasaDevolucion: 5,
    tiempoPromedio: 2.8,
    tendencia: 'up',
    status: 'verde',
    transportadoraPrincipal: 'Coordinadora',
    ultimaActualizacion: new Date(),
    prediccion48h: 82,
    pausado: false,
  },
  {
    id: '6',
    ciudad: 'Bucaramanga',
    departamento: 'Santander',
    totalGuias: 180,
    entregadas: 126,
    enTransito: 36,
    devueltas: 18,
    novedades: 12,
    tasaEntrega: 70,
    tasaDevolucion: 10,
    tiempoPromedio: 3.8,
    tendencia: 'stable',
    status: 'amarillo',
    transportadoraPrincipal: 'Envía',
    ultimaActualizacion: new Date(),
    prediccion48h: 71,
    pausado: false,
  },
  {
    id: '7',
    ciudad: 'Quibdó',
    departamento: 'Chocó',
    totalGuias: 45,
    entregadas: 20,
    enTransito: 15,
    devueltas: 10,
    novedades: 8,
    tasaEntrega: 44,
    tasaDevolucion: 22,
    tiempoPromedio: 6.5,
    tendencia: 'down',
    status: 'rojo',
    transportadoraPrincipal: 'Interrapidísimo',
    ultimaActualizacion: new Date(),
    prediccion48h: 40,
    recomendacion: 'PAUSAR ENVÍOS - Zona crítica',
    pausado: true,
  },
  {
    id: '8',
    ciudad: 'Buenaventura',
    departamento: 'Valle del Cauca',
    totalGuias: 35,
    entregadas: 18,
    enTransito: 10,
    devueltas: 7,
    novedades: 5,
    tasaEntrega: 51,
    tasaDevolucion: 20,
    tiempoPromedio: 5.8,
    tendencia: 'down',
    status: 'rojo',
    transportadoraPrincipal: 'TCC',
    ultimaActualizacion: new Date(),
    prediccion48h: 48,
    recomendacion: 'Solo prepago obligatorio',
    pausado: false,
  },
  {
    id: '9',
    ciudad: 'Apartadó',
    departamento: 'Antioquia',
    totalGuias: 60,
    entregadas: 37,
    enTransito: 15,
    devueltas: 8,
    novedades: 6,
    tasaEntrega: 62,
    tasaDevolucion: 13,
    tiempoPromedio: 4.2,
    tendencia: 'stable',
    status: 'naranja',
    transportadoraPrincipal: 'Interrapidísimo',
    ultimaActualizacion: new Date(),
    prediccion48h: 60,
    pausado: false,
  },
  {
    id: '10',
    ciudad: 'Pereira',
    departamento: 'Risaralda',
    totalGuias: 320,
    entregadas: 243,
    enTransito: 51,
    devueltas: 26,
    novedades: 10,
    tasaEntrega: 76,
    tasaDevolucion: 8,
    tiempoPromedio: 2.6,
    tendencia: 'up',
    status: 'verde',
    transportadoraPrincipal: 'Servientrega',
    ultimaActualizacion: new Date(),
    prediccion48h: 78,
    pausado: false,
  },
];

// ============================================
// COMPONENTES AUXILIARES
// ============================================

const StatusBadge: React.FC<{ status: CityData['status']; size?: 'sm' | 'md' | 'lg' }> = ({ status, size = 'md' }) => {
  const colors = {
    verde: 'bg-emerald-500',
    amarillo: 'bg-amber-500',
    naranja: 'bg-orange-500',
    rojo: 'bg-red-500',
  };

  const sizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <div className={`${sizes[size]} ${colors[status]} rounded-full shadow-lg`}>
      <div className={`${sizes[size]} ${colors[status]} rounded-full animate-ping opacity-50`} />
    </div>
  );
};

const TrendIcon: React.FC<{ trend: CityData['tendencia'] }> = ({ trend }) => {
  if (trend === 'up') return <TrendingUp className="w-4 h-4 text-emerald-400" />;
  if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-400" />;
  return <div className="w-4 h-4 flex items-center justify-center text-slate-400">—</div>;
};

const MiniProgressBar: React.FC<{ value: number; color: string }> = ({ value, color }) => (
  <div className="w-full h-1.5 bg-navy-700 rounded-full overflow-hidden">
    <div
      className={`h-full rounded-full bg-gradient-to-r ${color}`}
      style={{ width: `${Math.min(value, 100)}%` }}
    />
  </div>
);

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export const SemaforoInteligente: React.FC = () => {
  const [cities, setCities] = useState<CityData[]>(generateCityData());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<CityData['status'] | 'todos'>('todos');
  const [sortBy, setSortBy] = useState<'tasaEntrega' | 'totalGuias' | 'ciudad'>('tasaEntrega');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [expandedCity, setExpandedCity] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table' | 'map'>('cards');

  // Filtrar y ordenar ciudades
  const filteredCities = useMemo(() => {
    return cities
      .filter(city => {
        const matchesSearch = city.ciudad.toLowerCase().includes(searchQuery.toLowerCase()) ||
          city.departamento.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = filterStatus === 'todos' || city.status === filterStatus;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        const aValue = a[sortBy];
        const bValue = b[sortBy];
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        }
        return sortOrder === 'asc' ? (aValue as number) - (bValue as number) : (bValue as number) - (aValue as number);
      });
  }, [cities, searchQuery, filterStatus, sortBy, sortOrder]);

  // Estadísticas generales
  const stats = useMemo(() => {
    const total = cities.reduce((sum, c) => sum + c.totalGuias, 0);
    const entregadas = cities.reduce((sum, c) => sum + c.entregadas, 0);
    const verdes = cities.filter(c => c.status === 'verde').length;
    const rojas = cities.filter(c => c.status === 'rojo').length;

    return {
      totalGuias: total,
      tasaGeneral: Math.round((entregadas / total) * 100),
      ciudadesVerdes: verdes,
      ciudadesRojas: rojas,
      ciudadesTotal: cities.length,
    };
  }, [cities]);

  const togglePause = (cityId: string) => {
    setCities(prev => prev.map(city =>
      city.id === cityId ? { ...city, pausado: !city.pausado } : city
    ));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-500 rounded-2xl shadow-xl shadow-emerald-500/30">
            <MapPin className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              Semáforo Inteligente 2.0
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded">
                AI-POWERED
              </span>
            </h1>
            <p className="text-slate-400">Monitoreo de entregas con predicciones en tiempo real</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Selector */}
          <div className="flex bg-navy-800 rounded-xl p-1">
            {['cards', 'table', 'map'].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode as typeof viewMode)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${
                  viewMode === mode
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {mode === 'cards' ? 'Tarjetas' : mode === 'table' ? 'Tabla' : 'Mapa'}
              </button>
            ))}
          </div>

          <button className="p-2 bg-navy-800 hover:bg-navy-700 rounded-xl text-slate-400 hover:text-white transition-all">
            <RefreshCw className="w-5 h-5" />
          </button>

          <button className="p-2 bg-navy-800 hover:bg-navy-700 rounded-xl text-slate-400 hover:text-white transition-all">
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-4 bg-navy-800/50 rounded-xl border border-navy-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400">Total Guías</span>
            <Package className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-white">{stats.totalGuias.toLocaleString()}</p>
        </div>

        <div className="p-4 bg-navy-800/50 rounded-xl border border-navy-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400">Tasa General</span>
            <Target className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400">{stats.tasaGeneral}%</p>
        </div>

        <div className="p-4 bg-navy-800/50 rounded-xl border border-navy-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400">Ciudades Verdes</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white">
            {stats.ciudadesVerdes}
            <span className="text-sm text-slate-400 ml-1">/ {stats.ciudadesTotal}</span>
          </p>
        </div>

        <div className="p-4 bg-navy-800/50 rounded-xl border border-navy-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400">Ciudades Rojas</span>
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <p className="text-2xl font-bold text-red-400">{stats.ciudadesRojas}</p>
        </div>

        <div className="p-4 bg-gradient-to-br from-violet-500/20 to-purple-500/20 rounded-xl border border-violet-500/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-violet-400">Predicción IA 48h</span>
            <Brain className="w-4 h-4 text-violet-400" />
          </div>
          <p className="text-2xl font-bold text-white">{stats.tasaGeneral + 2}%</p>
          <p className="text-xs text-emerald-400 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +2% proyectado
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-navy-800 rounded-xl border border-navy-700">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar ciudad o departamento..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-white placeholder-slate-400 outline-none"
          />
        </div>

        <div className="flex gap-2">
          {(['todos', 'verde', 'amarillo', 'naranja', 'rojo'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-xl font-medium transition-all capitalize ${
                filterStatus === status
                  ? status === 'verde' ? 'bg-emerald-600 text-white' :
                    status === 'amarillo' ? 'bg-amber-600 text-white' :
                    status === 'naranja' ? 'bg-orange-600 text-white' :
                    status === 'rojo' ? 'bg-red-600 text-white' :
                    'bg-blue-600 text-white'
                  : 'bg-navy-800 text-slate-400 hover:text-white'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Cities Grid */}
      {viewMode === 'cards' && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCities.map((city) => (
            <div
              key={city.id}
              className={`p-5 bg-navy-800/50 rounded-2xl border transition-all cursor-pointer ${
                expandedCity === city.id
                  ? 'border-blue-500 ring-2 ring-blue-500/20'
                  : city.pausado
                  ? 'border-red-500/30 opacity-75'
                  : 'border-navy-700 hover:border-navy-600'
              }`}
              onClick={() => setExpandedCity(expandedCity === city.id ? null : city.id)}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <StatusBadge status={city.status} size="lg" />
                  <div>
                    <h3 className="font-bold text-white flex items-center gap-2">
                      {city.ciudad}
                      {city.pausado && (
                        <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded">
                          PAUSADO
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-400">{city.departamento}</p>
                  </div>
                </div>
                <TrendIcon trend={city.tendencia} />
              </div>

              {/* Main Stats */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center p-2 bg-navy-700/50 rounded-lg">
                  <p className="text-lg font-bold text-white">{city.totalGuias}</p>
                  <p className="text-xs text-slate-400">Guías</p>
                </div>
                <div className="text-center p-2 bg-navy-700/50 rounded-lg">
                  <p className={`text-lg font-bold ${
                    city.tasaEntrega >= 75 ? 'text-emerald-400' :
                    city.tasaEntrega >= 60 ? 'text-amber-400' :
                    'text-red-400'
                  }`}>{city.tasaEntrega}%</p>
                  <p className="text-xs text-slate-400">Entrega</p>
                </div>
                <div className="text-center p-2 bg-navy-700/50 rounded-lg">
                  <p className="text-lg font-bold text-white">{city.tiempoPromedio}d</p>
                  <p className="text-xs text-slate-400">Tiempo</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Tasa de entrega</span>
                  <span className={`font-medium ${
                    city.tasaEntrega >= 75 ? 'text-emerald-400' :
                    city.tasaEntrega >= 60 ? 'text-amber-400' :
                    'text-red-400'
                  }`}>{city.tasaEntrega}%</span>
                </div>
                <MiniProgressBar
                  value={city.tasaEntrega}
                  color={
                    city.tasaEntrega >= 75 ? 'from-emerald-500 to-green-500' :
                    city.tasaEntrega >= 60 ? 'from-amber-500 to-yellow-500' :
                    'from-red-500 to-rose-500'
                  }
                />
              </div>

              {/* AI Prediction */}
              <div className="flex items-center justify-between p-3 bg-violet-500/10 rounded-xl mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-violet-400" />
                  <span className="text-xs text-violet-300">Predicción 48h</span>
                </div>
                <span className={`text-sm font-bold ${
                  city.prediccion48h > city.tasaEntrega ? 'text-emerald-400' :
                  city.prediccion48h < city.tasaEntrega ? 'text-red-400' :
                  'text-slate-400'
                }`}>
                  {city.prediccion48h}%
                  {city.prediccion48h > city.tasaEntrega && <TrendingUp className="w-3 h-3 inline ml-1" />}
                  {city.prediccion48h < city.tasaEntrega && <TrendingDown className="w-3 h-3 inline ml-1" />}
                </span>
              </div>

              {/* Recommendation */}
              {city.recomendacion && (
                <div className={`p-3 rounded-xl mb-4 ${
                  city.status === 'rojo' ? 'bg-red-500/10 border border-red-500/30' :
                  'bg-amber-500/10 border border-amber-500/30'
                }`}>
                  <div className="flex items-center gap-2">
                    <AlertCircle className={`w-4 h-4 ${
                      city.status === 'rojo' ? 'text-red-400' : 'text-amber-400'
                    }`} />
                    <span className={`text-xs font-medium ${
                      city.status === 'rojo' ? 'text-red-300' : 'text-amber-300'
                    }`}>{city.recomendacion}</span>
                  </div>
                </div>
              )}

              {/* Expanded Details */}
              {expandedCity === city.id && (
                <div className="pt-4 border-t border-navy-700 space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Entregadas:</span>
                      <span className="text-emerald-400 font-medium">{city.entregadas}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">En tránsito:</span>
                      <span className="text-amber-400 font-medium">{city.enTransito}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Devueltas:</span>
                      <span className="text-red-400 font-medium">{city.devueltas}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Novedades:</span>
                      <span className="text-orange-400 font-medium">{city.novedades}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-blue-400" />
                      <span className="text-sm text-slate-300">{city.transportadoraPrincipal}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePause(city.id);
                      }}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        city.pausado
                          ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                          : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                      }`}
                    >
                      {city.pausado ? (
                        <>
                          <PlayCircle className="w-4 h-4" />
                          Reanudar
                        </>
                      ) : (
                        <>
                          <PauseCircle className="w-4 h-4" />
                          Pausar
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="bg-navy-800/50 rounded-2xl border border-navy-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-navy-700">
                  <th className="text-left p-4 text-xs font-medium text-slate-400 uppercase">Ciudad</th>
                  <th className="text-center p-4 text-xs font-medium text-slate-400 uppercase">Estado</th>
                  <th className="text-center p-4 text-xs font-medium text-slate-400 uppercase">Guías</th>
                  <th className="text-center p-4 text-xs font-medium text-slate-400 uppercase">Tasa</th>
                  <th className="text-center p-4 text-xs font-medium text-slate-400 uppercase">Tiempo</th>
                  <th className="text-center p-4 text-xs font-medium text-slate-400 uppercase">Tendencia</th>
                  <th className="text-center p-4 text-xs font-medium text-slate-400 uppercase">Predicción 48h</th>
                  <th className="text-center p-4 text-xs font-medium text-slate-400 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredCities.map((city) => (
                  <tr key={city.id} className="border-b border-navy-700/50 hover:bg-navy-700/30">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <StatusBadge status={city.status} />
                        <div>
                          <p className="font-medium text-white">{city.ciudad}</p>
                          <p className="text-xs text-slate-400">{city.departamento}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                        city.status === 'verde' ? 'bg-emerald-500/20 text-emerald-400' :
                        city.status === 'amarillo' ? 'bg-amber-500/20 text-amber-400' :
                        city.status === 'naranja' ? 'bg-orange-500/20 text-orange-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {city.status}
                      </span>
                    </td>
                    <td className="p-4 text-center text-white font-medium">{city.totalGuias}</td>
                    <td className="p-4 text-center">
                      <span className={`font-bold ${
                        city.tasaEntrega >= 75 ? 'text-emerald-400' :
                        city.tasaEntrega >= 60 ? 'text-amber-400' :
                        'text-red-400'
                      }`}>{city.tasaEntrega}%</span>
                    </td>
                    <td className="p-4 text-center text-slate-300">{city.tiempoPromedio}d</td>
                    <td className="p-4 text-center">
                      <TrendIcon trend={city.tendencia} />
                    </td>
                    <td className="p-4 text-center">
                      <span className={`font-bold ${
                        city.prediccion48h > city.tasaEntrega ? 'text-emerald-400' :
                        city.prediccion48h < city.tasaEntrega ? 'text-red-400' :
                        'text-slate-400'
                      }`}>{city.prediccion48h}%</span>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => togglePause(city.id)}
                        className={`p-2 rounded-lg transition-all ${
                          city.pausado
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-slate-700 text-slate-400 hover:text-white'
                        }`}
                      >
                        {city.pausado ? <PlayCircle className="w-4 h-4" /> : <PauseCircle className="w-4 h-4" />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Map View Placeholder */}
      {viewMode === 'map' && (
        <div className="h-96 bg-navy-800/50 rounded-2xl border border-navy-700 flex items-center justify-center">
          <div className="text-center">
            <MapPin className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Mapa Interactivo</h3>
            <p className="text-slate-400">Próximamente: Visualización geográfica con Google Maps / Mapbox</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SemaforoInteligente;
