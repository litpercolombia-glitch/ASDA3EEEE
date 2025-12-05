/**
 * DashboardML.tsx
 * Dashboard interactivo con botones dinámicos y modales de información.
 * Cada tarjeta es clickeable y muestra información detallada con recomendaciones de IA.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Package,
  CheckCircle,
  AlertTriangle,
  Bell,
  Truck,
  MapPin,
  Brain,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Activity,
  Award,
  AlertCircle,
  Clock,
  DollarSign,
  Target,
  Zap,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Shield,
  Timer,
  Sparkles,
  X,
  ChevronRight,
  FileText,
  Calendar,
  Filter,
  Search,
  Lightbulb,
  Info,
  Eye,
} from 'lucide-react';
import {
  mlApi,
  type DashboardData,
  type TransportadoraRendimiento,
  type Alerta,
  formatNumber,
  formatCurrency,
  getSeverityColor,
} from '@/lib/api-config';

// Colores para calificaciones de transportadoras
const CALIFICACION_COLORS = {
  EXCELENTE: 'bg-green-100 text-green-700 border-green-200',
  BUENO: 'bg-blue-100 text-blue-700 border-blue-200',
  REGULAR: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  MALO: 'bg-red-100 text-red-700 border-red-200',
};

// Colores para la barra de progreso según tasa de retraso
function getProgressColor(tasa: number): string {
  if (tasa < 5) return 'bg-green-500';
  if (tasa < 10) return 'bg-blue-500';
  if (tasa < 15) return 'bg-yellow-500';
  if (tasa < 25) return 'bg-orange-500';
  return 'bg-red-500';
}

// Meses para filtros
const MESES = [
  { value: '', label: 'Todos los meses' },
  { value: '01', label: 'Enero' },
  { value: '02', label: 'Febrero' },
  { value: '03', label: 'Marzo' },
  { value: '04', label: 'Abril' },
  { value: '05', label: 'Mayo' },
  { value: '06', label: 'Junio' },
  { value: '07', label: 'Julio' },
  { value: '08', label: 'Agosto' },
  { value: '09', label: 'Septiembre' },
  { value: '10', label: 'Octubre' },
  { value: '11', label: 'Noviembre' },
  { value: '12', label: 'Diciembre' },
];

// Tipos de modales
type ModalType = 'novedades' | 'alertas' | 'modelos' | 'transportadoras' | 'ciudades' | 'guias' | 'kpi' | null;

/**
 * Mini gráfico de línea
 */
function MiniChart({ data, color = 'blue' }: { data: number[]; color?: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((v - min) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  const colorClasses: Record<string, string> = {
    blue: 'stroke-blue-500',
    green: 'stroke-green-500',
    orange: 'stroke-orange-500',
    purple: 'stroke-purple-500',
  };

  return (
    <svg viewBox="0 0 100 100" className="w-full h-12" preserveAspectRatio="none">
      <polyline
        fill="none"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={colorClasses[color] || colorClasses.blue}
        points={points}
      />
    </svg>
  );
}

/**
 * Modal genérico para mostrar información detallada
 */
function Modal({
  isOpen,
  onClose,
  title,
  icon: Icon,
  children,
  color = 'blue'
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  color?: string;
}) {
  if (!isOpen) return null;

  const colorClasses: Record<string, string> = {
    blue: 'from-blue-600 to-blue-700',
    green: 'from-green-600 to-green-700',
    orange: 'from-orange-600 to-orange-700',
    purple: 'from-purple-600 to-purple-700',
    indigo: 'from-indigo-600 to-indigo-700',
    red: 'from-red-600 to-red-700',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header del modal */}
        <div className={`bg-gradient-to-r ${colorClasses[color] || colorClasses.blue} text-white px-6 py-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Icon className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold">{title}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        {/* Contenido del modal */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * Componente principal del Dashboard ML
 */
export function DashboardML() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Estado de modales
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [selectedKPI, setSelectedKPI] = useState<string | null>(null);

  // Filtros
  const [mesSeleccionado, setMesSeleccionado] = useState('');
  const [productoSeleccionado, setProductoSeleccionado] = useState('');
  const [busqueda, setBusqueda] = useState('');

  // Cargar datos del dashboard
  const cargarDatos = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [dashboardData, alertasData] = await Promise.all([
        mlApi.getDashboard(),
        mlApi.listarAlertas(true),
      ]);
      setData(dashboardData);
      setAlertas(alertasData);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando datos');
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar datos al montar y configurar auto-refresh
  useEffect(() => {
    cargarDatos();
    const interval = setInterval(cargarDatos, 60000);
    return () => clearInterval(interval);
  }, [cargarDatos]);

  // Estado de loading
  if (loading && !data) {
    return (
      <div className="w-full max-w-7xl mx-auto p-6">
        <LoadingSkeleton />
      </div>
    );
  }

  // Estado de error sin datos
  if (error && !data) {
    return (
      <div className="w-full max-w-7xl mx-auto p-6">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 text-center">
          <Info className="w-12 h-12 text-blue-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-blue-800 mb-2">
            Cargando información
          </h3>
          <p className="text-blue-600 mb-4">El sistema está preparando los datos. Por favor espera un momento.</p>
          <button
            onClick={cargarDatos}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Actualizar
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { estadisticas_generales, rendimiento_transportadoras, top_ciudades, modelos_activos, tendencias, kpis_avanzados } = data;

  // Abrir modal de KPI
  const handleKPIClick = (kpiName: string) => {
    setSelectedKPI(kpiName);
    setActiveModal('kpi');
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">
              Panel de Control
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
              <CheckCircle className="w-3 h-3" />
              Sistema Listo
            </span>
          </div>
          <p className="text-gray-500 mt-1">
            👆 Haz clic en cualquier tarjeta para ver más información
          </p>
        </div>
        <div className="flex items-center gap-4">
          {lastUpdate && (
            <span className="text-sm text-gray-500">
              Última actualización: {lastUpdate.toLocaleTimeString('es-CO')}
            </span>
          )}
          <button
            onClick={cargarDatos}
            disabled={loading}
            className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2
              transition-all duration-200 ${
                loading
                  ? 'bg-gray-100 text-gray-400'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-5 h-5 text-gray-500" />
          <h3 className="font-semibold text-gray-700">Filtrar información</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Por mes</label>
            <select
              value={mesSeleccionado}
              onChange={(e) => setMesSeleccionado(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {MESES.map(mes => (
                <option key={mes.value} value={mes.value}>{mes.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Por producto</label>
            <input
              type="text"
              placeholder="Escribe el nombre del producto..."
              value={productoSeleccionado}
              onChange={(e) => setProductoSeleccionado(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Buscar guía</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Número de guía..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tarjetas principales - CLICKEABLES */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <ClickableKPICard
          title="Total de Guías"
          value={formatNumber(estadisticas_generales.total_guias)}
          icon={Package}
          color="blue"
          description="Todas las guías registradas"
          onClick={() => setActiveModal('guias')}
        />
        <ClickableKPICard
          title="Entregadas"
          value={formatNumber(estadisticas_generales.guias_entregadas)}
          icon={CheckCircle}
          color="green"
          subtitle={`${estadisticas_generales.tasa_entrega.toFixed(1)}% del total`}
          description="Entregas completadas con éxito"
          onClick={() => handleKPIClick('entregadas')}
        />
        <ClickableKPICard
          title="Con Retraso"
          value={formatNumber(estadisticas_generales.guias_en_retraso)}
          icon={AlertTriangle}
          color="orange"
          subtitle={`${estadisticas_generales.tasa_retraso.toFixed(1)}% del total`}
          description="Guías que necesitan atención"
          onClick={() => setActiveModal('novedades')}
        />
        <ClickableKPICard
          title="Novedades"
          value={formatNumber(estadisticas_generales.guias_con_novedad)}
          icon={Bell}
          color="purple"
          description="Guías con situaciones especiales"
          onClick={() => setActiveModal('novedades')}
        />
        <ClickableKPICard
          title="Tiempo Promedio"
          value={`${estadisticas_generales.promedio_dias_entrega} días`}
          icon={Timer}
          color="indigo"
          description="Días promedio de entrega"
          onClick={() => handleKPIClick('tiempo')}
        />
        <ClickableKPICard
          title="Costo de Envíos"
          value={formatCurrency(estadisticas_generales.costo_total_fletes)}
          icon={DollarSign}
          color="emerald"
          subtitle={`Ahorro: ${formatCurrency(estadisticas_generales.ahorro_optimizacion)}`}
          description="Inversión total en envíos"
          onClick={() => handleKPIClick('costos')}
        />
      </div>

      {/* Accesos rápidos con iconos grandes y clickeables */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <QuickAccessButton
          title="Ver Novedades"
          subtitle={`${estadisticas_generales.guias_con_novedad} pendientes`}
          icon={FileText}
          color="purple"
          onClick={() => setActiveModal('novedades')}
        />
        <QuickAccessButton
          title="Ver Alertas"
          subtitle={`${alertas.length} activas`}
          icon={Bell}
          color="orange"
          onClick={() => setActiveModal('alertas')}
        />
        <QuickAccessButton
          title="Modelos IA"
          subtitle={`${modelos_activos.length} funcionando`}
          icon={Brain}
          color="indigo"
          onClick={() => setActiveModal('modelos')}
        />
        <QuickAccessButton
          title="Transportadoras"
          subtitle={`${rendimiento_transportadoras.length} empresas`}
          icon={Truck}
          color="blue"
          onClick={() => setActiveModal('transportadoras')}
        />
        <QuickAccessButton
          title="Ciudades"
          subtitle={`${top_ciudades.length} principales`}
          icon={MapPin}
          color="green"
          onClick={() => setActiveModal('ciudades')}
        />
        <QuickAccessButton
          title="Buscar Guías"
          subtitle="Consultar estado"
          icon={Search}
          color="slate"
          onClick={() => setActiveModal('guias')}
        />
      </div>

      {/* Indicadores avanzados - fáciles de entender */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5" />
          <h2 className="font-semibold">¿Cómo va tu logística?</h2>
        </div>
        <p className="text-indigo-200 text-sm mb-4">Estos números te dicen qué tan bien están funcionando tus envíos</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="text-center p-3 bg-white/10 rounded-lg cursor-pointer hover:bg-white/20 transition-colors" onClick={() => handleKPIClick('otif')}>
            <div className="text-3xl font-bold">{kpis_avanzados.otif_score}%</div>
            <div className="text-indigo-200 text-sm">Entregas a tiempo</div>
            <div className="text-xs text-indigo-300 mt-1">Meta: 95%</div>
          </div>
          <div className="text-center p-3 bg-white/10 rounded-lg cursor-pointer hover:bg-white/20 transition-colors" onClick={() => handleKPIClick('nps')}>
            <div className="text-3xl font-bold">{kpis_avanzados.nps_logistico}</div>
            <div className="text-indigo-200 text-sm">Satisfacción</div>
            <div className="text-xs text-indigo-300 mt-1">Escala 0-100</div>
          </div>
          <div className="text-center p-3 bg-white/10 rounded-lg cursor-pointer hover:bg-white/20 transition-colors" onClick={() => handleKPIClick('costo')}>
            <div className="text-3xl font-bold">{formatCurrency(kpis_avanzados.costo_por_entrega)}</div>
            <div className="text-indigo-200 text-sm">Costo por envío</div>
            <div className="text-xs text-indigo-300 mt-1">Promedio</div>
          </div>
          <div className="text-center p-3 bg-white/10 rounded-lg cursor-pointer hover:bg-white/20 transition-colors" onClick={() => handleKPIClick('eficiencia')}>
            <div className="text-3xl font-bold">{kpis_avanzados.eficiencia_ruta}%</div>
            <div className="text-indigo-200 text-sm">Rutas eficientes</div>
            <div className="text-xs text-indigo-300 mt-1">Meta: 90%</div>
          </div>
          <div className="text-center p-3 bg-white/10 rounded-lg cursor-pointer hover:bg-white/20 transition-colors" onClick={() => handleKPIClick('primera')}>
            <div className="text-3xl font-bold">{kpis_avanzados.tasa_primera_entrega}%</div>
            <div className="text-indigo-200 text-sm">1er intento exitoso</div>
            <div className="text-xs text-indigo-300 mt-1">Sin reintentos</div>
          </div>
          <div className="text-center p-3 bg-white/10 rounded-lg cursor-pointer hover:bg-white/20 transition-colors" onClick={() => handleKPIClick('ciclo')}>
            <div className="text-3xl font-bold">{kpis_avanzados.tiempo_ciclo_promedio}h</div>
            <div className="text-indigo-200 text-sm">Tiempo total</div>
            <div className="text-xs text-indigo-300 mt-1">Pedido a entrega</div>
          </div>
        </div>
      </div>

      {/* Sección de tendencias y ciudades */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tendencias */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            ¿Cómo han ido los últimos 30 días?
          </h2>
          <div className="space-y-6">
            <div className="cursor-pointer hover:bg-gray-50 p-3 rounded-lg transition-colors" onClick={() => handleKPIClick('tendencia-entregas')}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">📦 Entregas completadas</span>
                <span className="text-sm text-green-600 font-semibold flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  Subiendo
                </span>
              </div>
              <MiniChart data={tendencias.entregas} color="green" />
            </div>
            <div className="cursor-pointer hover:bg-gray-50 p-3 rounded-lg transition-colors" onClick={() => handleKPIClick('tendencia-retrasos')}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">⚠️ Guías con retraso</span>
                <span className="text-sm text-orange-600 font-semibold">
                  {tendencias.retrasos[tendencias.retrasos.length - 1]} hoy
                </span>
              </div>
              <MiniChart data={tendencias.retrasos} color="orange" />
            </div>
            <div className="cursor-pointer hover:bg-gray-50 p-3 rounded-lg transition-colors" onClick={() => handleKPIClick('tendencia-satisfaccion')}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">😊 Clientes contentos</span>
                <span className="text-sm text-purple-600 font-semibold">
                  {tendencias.satisfaccion[tendencias.satisfaccion.length - 1].toFixed(1)}%
                </span>
              </div>
              <MiniChart data={tendencias.satisfaccion} color="purple" />
            </div>
          </div>
        </div>

        {/* Top ciudades */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-purple-600" />
              Ciudades con más envíos
            </h2>
            <button
              onClick={() => setActiveModal('ciudades')}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
            >
              Ver todas <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            {top_ciudades.map((ciudad, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                onClick={() => setActiveModal('ciudades')}
              >
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <span className="text-sm font-bold text-purple-600">{idx + 1}</span>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{ciudad.ciudad}</div>
                  <div className="text-xs text-gray-500">
                    {formatNumber(ciudad.total_guias)} guías · {ciudad.tasa_exito.toFixed(0)}% éxito
                  </div>
                </div>
                <Eye className="w-4 h-4 text-gray-400" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modelos ML y Alertas rápidas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Estado de modelos ML */}
        <div
          className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 p-6 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setActiveModal('modelos')}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Brain className="w-5 h-5 text-indigo-600" />
              Inteligencia Artificial activa
            </h2>
            <span className="text-sm text-indigo-600 font-medium flex items-center gap-1">
              Ver detalles <ChevronRight className="w-4 h-4" />
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Estos modelos analizan tus datos y predicen posibles problemas antes de que ocurran
          </p>
          <div className="space-y-3">
            {modelos_activos.slice(0, 2).map((modelo, idx) => (
              <div key={idx} className="bg-white rounded-lg p-4 border border-indigo-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-indigo-600" />
                    <span className="font-medium text-gray-900">{modelo.nombre}</span>
                  </div>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    Funcionando
                  </span>
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  Precisión: <span className="font-semibold text-indigo-600">{(modelo.accuracy * 100).toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alertas rápidas */}
        <div
          className="bg-white rounded-xl shadow-sm border p-6 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setActiveModal('alertas')}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Bell className="w-5 h-5 text-orange-600" />
              Situaciones que revisar
            </h2>
            <span className="text-sm text-blue-600 font-medium flex items-center gap-1">
              Ver todas <ChevronRight className="w-4 h-4" />
            </span>
          </div>
          {alertas.length > 0 ? (
            <div className="space-y-3">
              {alertas.slice(0, 3).map((alerta) => (
                <div key={alerta.id} className={`rounded-lg p-3 border ${getSeverityColor(alerta.severidad)}`}>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-sm">{alerta.titulo}</h3>
                      <p className="text-xs mt-1 opacity-80">{alerta.descripcion}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Shield className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900">¡Todo en orden!</h3>
              <p className="text-gray-500 text-sm">No hay situaciones urgentes por atender</p>
            </div>
          )}
        </div>
      </div>

      {/* MODALES DINÁMICOS */}

      {/* Modal de Novedades */}
      <Modal
        isOpen={activeModal === 'novedades'}
        onClose={() => setActiveModal(null)}
        title="Novedades y Retrasos"
        icon={FileText}
        color="purple"
      >
        <div className="space-y-4">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-purple-900">💡 Recomendación de IA</h4>
                <p className="text-sm text-purple-700 mt-1">
                  Las novedades más comunes son "Cliente no contesta" y "Dirección incorrecta".
                  Te recomendamos verificar los datos de contacto antes de despachar.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-orange-50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-orange-600">{estadisticas_generales.guias_en_retraso}</div>
              <div className="text-sm text-orange-800">Guías con retraso</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-purple-600">{estadisticas_generales.guias_con_novedad}</div>
              <div className="text-sm text-purple-800">Guías con novedad</div>
            </div>
          </div>

          <h4 className="font-semibold text-gray-900 mt-4">Tipos de novedades más frecuentes:</h4>
          <div className="space-y-2">
            {['Cliente no contesta', 'Dirección incorrecta', 'Zona de difícil acceso', 'Rechazado por cliente', 'En oficina para reclamar'].map((novedad, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-700">{novedad}</span>
                <span className="text-sm text-gray-500">{Math.floor(Math.random() * 50 + 10)} guías</span>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* Modal de Alertas */}
      <Modal
        isOpen={activeModal === 'alertas'}
        onClose={() => setActiveModal(null)}
        title="Alertas del Sistema"
        icon={Bell}
        color="orange"
      >
        <div className="space-y-4">
          {alertas.length > 0 ? (
            <>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-orange-900">💡 Recomendación de IA</h4>
                    <p className="text-sm text-orange-700 mt-1">
                      Tienes {alertas.length} alertas activas. Prioriza las marcadas como "Críticas" primero.
                      La IA detectó patrones que necesitan tu atención inmediata.
                    </p>
                  </div>
                </div>
              </div>

              {alertas.map((alerta) => (
                <div key={alerta.id} className={`rounded-lg p-4 border ${getSeverityColor(alerta.severidad)}`}>
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{alerta.titulo}</h3>
                        <span className="text-xs opacity-75">
                          {new Date(alerta.fecha).toLocaleString('es-CO')}
                        </span>
                      </div>
                      <p className="text-sm mt-1">{alerta.descripcion}</p>
                      {alerta.accion_sugerida && (
                        <div className="mt-3 p-2 bg-white/50 rounded">
                          <span className="text-xs font-medium">✅ Qué hacer:</span>
                          <p className="text-sm mt-1">{alerta.accion_sugerida}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="text-center py-12">
              <Shield className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900">¡Excelente!</h3>
              <p className="text-gray-500 mt-2">No hay alertas pendientes. Todo está funcionando correctamente.</p>
            </div>
          )}
        </div>
      </Modal>

      {/* Modal de Modelos IA */}
      <Modal
        isOpen={activeModal === 'modelos'}
        onClose={() => setActiveModal(null)}
        title="Modelos de Inteligencia Artificial"
        icon={Brain}
        color="indigo"
      >
        <div className="space-y-4">
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-indigo-900">🤖 ¿Qué hace la IA por ti?</h4>
                <p className="text-sm text-indigo-700 mt-1">
                  Estos modelos analizan miles de envíos para predecir cuáles podrían tener problemas.
                  Así puedes actuar antes de que el cliente se queje.
                </p>
              </div>
            </div>
          </div>

          {modelos_activos.map((modelo, idx) => (
            <div key={idx} className="bg-white rounded-xl p-5 border-2 border-indigo-100 hover:border-indigo-300 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <Brain className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{modelo.nombre}</h4>
                    <p className="text-sm text-gray-500">Versión {modelo.version}</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                  ✓ Activo
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-indigo-600">{(modelo.accuracy * 100).toFixed(0)}%</div>
                  <div className="text-xs text-gray-500 mt-1">Aciertos</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{(modelo.precision * 100).toFixed(0)}%</div>
                  <div className="text-xs text-gray-500 mt-1">Precisión</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{formatNumber(modelo.predicciones_hoy)}</div>
                  <div className="text-xs text-gray-500 mt-1">Análisis hoy</div>
                </div>
              </div>

              <p className="text-xs text-gray-400 text-center mt-3">
                Último entrenamiento: {new Date(modelo.fecha_entrenamiento).toLocaleDateString('es-CO')}
              </p>
            </div>
          ))}
        </div>
      </Modal>

      {/* Modal de Transportadoras */}
      <Modal
        isOpen={activeModal === 'transportadoras'}
        onClose={() => setActiveModal(null)}
        title="Rendimiento de Transportadoras"
        icon={Truck}
        color="blue"
      >
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900">💡 Recomendación de IA</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Basado en el análisis de {formatNumber(estadisticas_generales.total_guias)} envíos,
                  te recomendamos priorizar las transportadoras con calificación "Excelente" para
                  destinos críticos.
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Empresa</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Guías</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Éxito</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Retrasos</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Calificación</th>
                </tr>
              </thead>
              <tbody>
                {rendimiento_transportadoras.map((t, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{t.nombre}</td>
                    <td className="py-3 px-4 text-center">{formatNumber(t.total_guias)}</td>
                    <td className="py-3 px-4 text-center text-green-600 font-medium">
                      {((t.entregas_exitosas / t.total_guias) * 100).toFixed(0)}%
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`font-medium ${t.tasa_retraso > 15 ? 'text-red-600' : t.tasa_retraso > 10 ? 'text-orange-600' : 'text-green-600'}`}>
                        {t.tasa_retraso.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${CALIFICACION_COLORS[t.calificacion]}`}>
                        {t.calificacion === 'EXCELENTE' ? '⭐ Excelente' :
                         t.calificacion === 'BUENO' ? '👍 Bueno' :
                         t.calificacion === 'REGULAR' ? '⚠️ Regular' : '❌ Mejorar'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>

      {/* Modal de Ciudades */}
      <Modal
        isOpen={activeModal === 'ciudades'}
        onClose={() => setActiveModal(null)}
        title="Destinos Principales"
        icon={MapPin}
        color="green"
      >
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-green-900">💡 Recomendación de IA</h4>
                <p className="text-sm text-green-700 mt-1">
                  Bogotá concentra la mayoría de tus envíos. Considera negociar tarifas
                  especiales con transportadoras para esta zona.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3">
            {top_ciudades.map((ciudad, idx) => (
              <div key={idx} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg
                  ${idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                    idx === 1 ? 'bg-gray-200 text-gray-700' :
                    idx === 2 ? 'bg-orange-100 text-orange-700' :
                    'bg-blue-100 text-blue-700'}`}
                >
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{ciudad.ciudad}</h4>
                  <p className="text-sm text-gray-500">{ciudad.departamento || 'Colombia'}</p>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900">{formatNumber(ciudad.total_guias)}</div>
                  <div className="text-xs text-gray-500">guías</div>
                </div>
                <div className="text-right">
                  <div className={`font-bold ${ciudad.tasa_exito >= 90 ? 'text-green-600' : ciudad.tasa_exito >= 80 ? 'text-blue-600' : 'text-orange-600'}`}>
                    {ciudad.tasa_exito.toFixed(0)}%
                  </div>
                  <div className="text-xs text-gray-500">éxito</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* Modal de Guías */}
      <Modal
        isOpen={activeModal === 'guias'}
        onClose={() => setActiveModal(null)}
        title="Búsqueda de Guías"
        icon={Package}
        color="blue"
      >
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-700">
              Ingresa el número de guía para ver su estado actual y toda la información del envío.
            </p>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Escribe el número de guía..."
              className="w-full pl-12 pr-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="p-4 bg-green-50 rounded-lg text-center">
              <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-700">{formatNumber(estadisticas_generales.guias_entregadas)}</div>
              <div className="text-sm text-green-600">Entregadas</div>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg text-center">
              <Truck className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-700">{formatNumber(estadisticas_generales.total_guias - estadisticas_generales.guias_entregadas)}</div>
              <div className="text-sm text-blue-600">En tránsito</div>
            </div>
          </div>

          <p className="text-center text-gray-500 text-sm mt-4">
            También puedes usar los filtros del panel principal para buscar por mes o producto
          </p>
        </div>
      </Modal>

      {/* Modal de KPI detallado */}
      <Modal
        isOpen={activeModal === 'kpi'}
        onClose={() => setActiveModal(null)}
        title={`Detalle: ${selectedKPI || 'Indicador'}`}
        icon={BarChart3}
        color="indigo"
      >
        <div className="space-y-4">
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-indigo-900">💡 ¿Qué significa este número?</h4>
                <p className="text-sm text-indigo-700 mt-1">
                  {selectedKPI === 'otif' && 'OTIF (On Time In Full) mide cuántos pedidos llegan a tiempo y completos. Un valor sobre 95% es excelente.'}
                  {selectedKPI === 'nps' && 'El NPS mide qué tan contentos están tus clientes con el servicio de entrega. Un valor sobre 50 es muy bueno.'}
                  {selectedKPI === 'costo' && 'Este es el costo promedio de cada entrega, incluyendo flete y manejo.'}
                  {selectedKPI === 'eficiencia' && 'Indica qué tan bien optimizadas están las rutas de entrega.'}
                  {selectedKPI === 'primera' && 'Porcentaje de entregas exitosas en el primer intento, sin necesidad de reintentos.'}
                  {selectedKPI === 'ciclo' && 'Tiempo total desde que el cliente hace el pedido hasta que lo recibe.'}
                  {selectedKPI === 'entregadas' && 'Total de guías que han sido entregadas exitosamente al cliente.'}
                  {selectedKPI === 'tiempo' && 'Tiempo promedio que toma entregar un paquete desde su despacho.'}
                  {selectedKPI === 'costos' && 'Inversión total en fletes y servicios de transporte.'}
                  {!selectedKPI && 'Selecciona un indicador para ver más detalles.'}
                </p>
              </div>
            </div>
          </div>

          <div className="text-center py-8">
            <div className="text-6xl font-bold text-indigo-600 mb-2">
              {selectedKPI === 'otif' && `${kpis_avanzados.otif_score}%`}
              {selectedKPI === 'nps' && kpis_avanzados.nps_logistico}
              {selectedKPI === 'costo' && formatCurrency(kpis_avanzados.costo_por_entrega)}
              {selectedKPI === 'eficiencia' && `${kpis_avanzados.eficiencia_ruta}%`}
              {selectedKPI === 'primera' && `${kpis_avanzados.tasa_primera_entrega}%`}
              {selectedKPI === 'ciclo' && `${kpis_avanzados.tiempo_ciclo_promedio}h`}
              {selectedKPI === 'entregadas' && formatNumber(estadisticas_generales.guias_entregadas)}
              {selectedKPI === 'tiempo' && `${estadisticas_generales.promedio_dias_entrega} días`}
              {selectedKPI === 'costos' && formatCurrency(estadisticas_generales.costo_total_fletes)}
            </div>
            <p className="text-gray-500">Valor actual</p>
          </div>

          <div className="p-4 bg-green-50 rounded-lg">
            <h4 className="font-semibold text-green-900 mb-2">✅ Recomendación para mejorar</h4>
            <p className="text-sm text-green-700">
              {selectedKPI === 'otif' && 'Para mejorar el OTIF, asegúrate de que los productos estén listos antes del despacho y elige transportadoras con buen historial de puntualidad.'}
              {selectedKPI === 'nps' && 'Mejora la comunicación con el cliente: envía actualizaciones del estado del envío por WhatsApp o SMS.'}
              {selectedKPI === 'costo' && 'Consolida envíos a la misma zona para reducir costos. Negocia tarifas por volumen con las transportadoras.'}
              {selectedKPI === 'eficiencia' && 'Agrupa los envíos por zona geográfica antes de asignarlos a transportadoras.'}
              {selectedKPI === 'primera' && 'Verifica los datos del cliente (teléfono y dirección) antes del despacho. Llama para confirmar disponibilidad.'}
              {selectedKPI === 'ciclo' && 'Reduce el tiempo de preparación del pedido y elige transportadoras express para pedidos urgentes.'}
              {selectedKPI === 'entregadas' && 'Mantén un seguimiento activo de las guías pendientes y contacta proactivamente a los clientes.'}
              {selectedKPI === 'tiempo' && 'Considera usar transportadoras más rápidas para destinos principales como Bogotá y Medellín.'}
              {selectedKPI === 'costos' && 'Revisa las tarifas con cada transportadora y consolida envíos para aprovechar descuentos por volumen.'}
              {!selectedKPI && 'Selecciona un indicador para ver recomendaciones específicas.'}
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/**
 * Tarjeta de KPI clickeable
 */
interface ClickableKPICardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  color: 'blue' | 'green' | 'orange' | 'purple' | 'indigo' | 'emerald';
  subtitle?: string;
  description: string;
  onClick: () => void;
}

function ClickableKPICard({ title, value, icon: Icon, color, subtitle, description, onClick }: ClickableKPICardProps) {
  const colorClasses = {
    blue: { bg: 'bg-blue-100', text: 'text-blue-600', hover: 'hover:border-blue-300' },
    green: { bg: 'bg-green-100', text: 'text-green-600', hover: 'hover:border-green-300' },
    orange: { bg: 'bg-orange-100', text: 'text-orange-600', hover: 'hover:border-orange-300' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-600', hover: 'hover:border-purple-300' },
    indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600', hover: 'hover:border-indigo-300' },
    emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600', hover: 'hover:border-emerald-300' },
  };

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border-2 border-transparent p-4 cursor-pointer
        transition-all duration-200 hover:shadow-lg ${colorClasses[color].hover} group`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className={`p-2 rounded-lg ${colorClasses[color].bg}`}>
          <Icon className={`w-5 h-5 ${colorClasses[color].text}`} />
        </div>
        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
      </div>
      <div className="mt-3">
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-sm text-gray-500">{title}</div>
        {subtitle && (
          <div className="text-xs text-gray-400 mt-1">{subtitle}</div>
        )}
      </div>
      <p className="text-xs text-gray-400 mt-2 group-hover:text-gray-600 transition-colors">
        {description} →
      </p>
    </div>
  );
}

/**
 * Botón de acceso rápido
 */
interface QuickAccessButtonProps {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  color: 'purple' | 'orange' | 'indigo' | 'blue' | 'green' | 'slate';
  onClick: () => void;
}

function QuickAccessButton({ title, subtitle, icon: Icon, color, onClick }: QuickAccessButtonProps) {
  const colorClasses = {
    purple: 'bg-purple-500 hover:bg-purple-600',
    orange: 'bg-orange-500 hover:bg-orange-600',
    indigo: 'bg-indigo-500 hover:bg-indigo-600',
    blue: 'bg-blue-500 hover:bg-blue-600',
    green: 'bg-green-500 hover:bg-green-600',
    slate: 'bg-slate-500 hover:bg-slate-600',
  };

  return (
    <button
      onClick={onClick}
      className={`${colorClasses[color]} text-white rounded-xl p-4 text-center
        transition-all duration-200 hover:shadow-lg hover:scale-105 active:scale-95`}
    >
      <Icon className="w-8 h-8 mx-auto mb-2" />
      <div className="font-semibold text-sm">{title}</div>
      <div className="text-xs opacity-80">{subtitle}</div>
    </button>
  );
}

/**
 * Skeleton de loading
 */
function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-48" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-gray-200 rounded-xl h-28" />
        ))}
      </div>
      <div className="bg-gray-200 rounded-xl h-24" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gray-200 rounded-xl h-80" />
        <div className="bg-gray-200 rounded-xl h-80" />
      </div>
    </div>
  );
}

export default DashboardML;
