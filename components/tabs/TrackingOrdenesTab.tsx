import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Package,
  Search,
  AlertTriangle,
  Upload,
  FileSpreadsheet,
  Filter,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Truck,
  MapPin,
  Phone,
  User,
  Calendar,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Bell,
  Lightbulb,
  Eye,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  X,
  Download,
  Save,
  History,
  Activity,
  Target,
  Zap,
  Shield,
  Brain,
  FileText,
  ArrowRight,
} from 'lucide-react';
import * as XLSX from 'xlsx';

// =====================================
// INTERFACES
// =====================================

interface OrdenTracking {
  id?: number;
  hora: string | null;
  fecha: string | null;
  nombreCliente: string | null;
  telefono: string | null;
  numeroGuia: string;
  estatus: string | null;
  ciudadDestino: string | null;
  transportadora: string | null;
  novedad: string | null;
  ultimoMovimiento: string | null;
  fechaUltimoMovimiento: string | null;
  horaUltimoMovimiento: string | null;
  fechaGeneracionGuia: string | null;
  // Campos calculados
  diasEnTransito?: number;
  diasSinMovimiento?: number;
  tieneNovedad?: boolean;
  esCritica?: boolean;
  nivelRiesgo?: string;
  probabilidadEntrega?: number;
  vecesConNovedad?: number;
  totalActualizaciones?: number;
}

interface AlertaTracking {
  id: number;
  tipo: string;
  severidad: string;
  titulo: string;
  descripcion: string;
  guiasAfectadas: string[];
  cantidadAfectadas: number;
  transportadora?: string;
  ciudad?: string;
  accionRecomendada: string;
  estaActiva: boolean;
  fechaCreacion: string;
}

interface Metricas {
  total: number;
  entregadas: number;
  devoluciones: number;
  conNovedad: number;
  criticas: number;
  enProceso: number;
  tasaEntrega: number;
  tasaDevolucion: number;
  porRiesgo: Record<string, number>;
  porTransportadora: { nombre: string; total: number }[];
  porCiudad: { nombre: string; total: number }[];
  promedioDiasSinMovimiento: number;
}

interface SesionCarga {
  id: number;
  nombre: string;
  fecha: string;
  archivo: string;
  totalOrdenes: number;
  nuevas: number;
  actualizadas: number;
  entregadas: number;
  devolucion: number;
  conNovedad: number;
  enProceso: number;
}

interface HistorialOrden {
  id: number;
  estatus: string;
  estatusAnterior: string;
  novedad: string;
  ultimoMovimiento: string;
  fechaMovimiento: string;
  fechaRegistro: string;
  cambioEstatus: boolean;
  nuevaNovedad: boolean;
}

interface AnalisisIA {
  resumen: string;
  metricas: Metricas;
  recomendaciones: {
    tipo: string;
    titulo: string;
    descripcion: string;
    acciones: string[];
  }[];
  transportadorasProblematicas: {
    nombre: string;
    total: number;
    criticas: number;
    porcentajeCriticas: number;
  }[];
  ciudadesProblematicas: {
    nombre: string;
    total: number;
    criticas: number;
    porcentajeCriticas: number;
  }[];
}

// =====================================
// CONSTANTES
// =====================================

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const MAPEO_COLUMNAS: Record<string, string[]> = {
  hora: ['HORA', 'hora', 'Hora', 'HOUR', 'time'],
  fecha: ['FECHA', 'fecha', 'Fecha', 'DATE', 'date'],
  nombreCliente: ['NOMBRE CLIENTE', 'nombre cliente', 'CLIENTE', 'cliente', 'Customer', 'CUSTOMER', 'nombre', 'NOMBRE'],
  telefono: ['TELÉFONO', 'TELEFONO', 'telefono', 'teléfono', 'Tel', 'TEL', 'celular', 'CELULAR', 'phone', 'PHONE'],
  numeroGuia: ['NÚMERO GUIA', 'NUMERO GUIA', 'numero guia', 'Guía', 'GUIA', 'guia', 'tracking', 'TRACKING', 'N° GUIA', 'N GUIA'],
  estatus: ['ESTATUS', 'estatus', 'Estatus', 'STATUS', 'status', 'Estado', 'ESTADO', 'estado'],
  ciudadDestino: ['CIUDAD DESTINO', 'ciudad destino', 'Ciudad Destino', 'CIUDAD', 'ciudad', 'City', 'CITY', 'destino', 'DESTINO'],
  transportadora: ['TRANSPORTADORA', 'transportadora', 'Transportadora', 'CARRIER', 'carrier', 'empresa', 'EMPRESA'],
  novedad: ['NOVEDAD', 'novedad', 'Novedad', 'ISSUE', 'issue', 'problema', 'PROBLEMA'],
  ultimoMovimiento: ['ÚLTIMO MOVIMIENTO', 'ULTIMO MOVIMIENTO', 'ultimo movimiento', 'Last Movement', 'movimiento', 'MOVIMIENTO'],
  fechaUltimoMovimiento: ['FECHA DE ÚLTIMO MOVIMIENTO', 'FECHA ULTIMO MOVIMIENTO', 'fecha ultimo movimiento', 'fecha último movimiento'],
  horaUltimoMovimiento: ['HORA DE ÚLTIMO MOVIMIENTO', 'HORA ULTIMO MOVIMIENTO', 'hora ultimo movimiento', 'hora último movimiento'],
  fechaGeneracionGuia: ['FECHA GENERACION DE GUIA', 'FECHA GENERACION GUIA', 'fecha generacion guia', 'Fecha Generación', 'fecha envio', 'FECHA ENVIO'],
};

const ITEMS_PER_PAGE = 50;

// =====================================
// HELPERS
// =====================================

const getStatusColor = (estatus: string | null): { bg: string; text: string; border: string } => {
  if (!estatus) return { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-400', border: 'border-slate-300 dark:border-slate-600' };

  const statusLower = estatus.toLowerCase();

  if (statusLower.includes('entregado') || statusLower === 'delivered') {
    return { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-300 dark:border-emerald-700' };
  }
  if (statusLower.includes('devolucion') || statusLower.includes('devuelto') || statusLower.includes('cancelado')) {
    return { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', border: 'border-red-300 dark:border-red-700' };
  }
  if (statusLower.includes('reparto') || statusLower.includes('tránsito') || statusLower.includes('transito') || statusLower.includes('viajando')) {
    return { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-300 dark:border-blue-700' };
  }
  if (statusLower.includes('oficina') || statusLower.includes('centro') || statusLower.includes('bodega')) {
    return { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400', border: 'border-purple-300 dark:border-purple-700' };
  }
  if (statusLower.includes('novedad') || statusLower.includes('incidente') || statusLower.includes('problema')) {
    return { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-300 dark:border-amber-700' };
  }

  return { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', border: 'border-yellow-300 dark:border-yellow-700' };
};

const getRiesgoColor = (nivel: string | undefined): string => {
  switch (nivel) {
    case 'CRITICO': return 'text-red-600 dark:text-red-400';
    case 'ALTO': return 'text-orange-600 dark:text-orange-400';
    case 'MEDIO': return 'text-yellow-600 dark:text-yellow-400';
    case 'BAJO': return 'text-green-600 dark:text-green-400';
    default: return 'text-slate-500';
  }
};

const getSeveridadColor = (severidad: string): { bg: string; text: string; icon: React.ElementType } => {
  switch (severidad) {
    case 'CRITICAL':
      return { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', icon: AlertCircle };
    case 'URGENT':
      return { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400', icon: AlertTriangle };
    case 'WARNING':
      return { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', icon: Bell };
    default:
      return { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', icon: Lightbulb };
  }
};

const findColumnValue = (row: Record<string, any>, campo: string): any => {
  const posiblesNombres = MAPEO_COLUMNAS[campo] || [];
  for (const nombre of posiblesNombres) {
    if (row[nombre] !== undefined) {
      return row[nombre];
    }
  }
  // Buscar de forma más flexible
  const keys = Object.keys(row);
  for (const key of keys) {
    if (key.toLowerCase().includes(campo.toLowerCase())) {
      return row[key];
    }
  }
  return null;
};

// =====================================
// COMPONENTE PRINCIPAL
// =====================================

export const TrackingOrdenesTab: React.FC = () => {
  // Estado principal
  const [ordenes, setOrdenes] = useState<OrdenTracking[]>([]);
  const [ordenesLocal, setOrdenesLocal] = useState<OrdenTracking[]>([]); // Para visualización antes de guardar
  const [loading, setLoading] = useState(false);
  const [loadingAnalisis, setLoadingAnalisis] = useState(false);
  const [guardado, setGuardado] = useState(false);

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstatus, setFiltroEstatus] = useState('');
  const [filtroCiudad, setFiltroCiudad] = useState('');
  const [filtroTransportadora, setFiltroTransportadora] = useState('');
  const [filtroNovedad, setFiltroNovedad] = useState<boolean | null>(null);
  const [filtroCritica, setFiltroCritica] = useState<boolean | null>(null);

  // Paginación
  const [pagina, setPagina] = useState(1);

  // Vista
  const [vistaActiva, setVistaActiva] = useState<'tabla' | 'alertas' | 'analisis' | 'historial'>('tabla');
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [ordenSeleccionada, setOrdenSeleccionada] = useState<OrdenTracking | null>(null);
  const [historialOrden, setHistorialOrden] = useState<HistorialOrden[]>([]);

  // Datos
  const [metricas, setMetricas] = useState<Metricas | null>(null);
  const [alertas, setAlertas] = useState<AlertaTracking[]>([]);
  const [sesiones, setSesiones] = useState<SesionCarga[]>([]);
  const [analisisIA, setAnalisisIA] = useState<AnalisisIA | null>(null);

  // Resultado de carga
  const [resultadoCarga, setResultadoCarga] = useState<{
    total: number;
    nuevas: number;
    actualizadas: number;
    entregadas: number;
    devolucion: number;
    cambios: { guia: string; estatusAnterior: string; estatusNuevo: string; cliente: string }[];
    alertasGeneradas: number;
  } | null>(null);

  // =====================================
  // EFECTOS
  // =====================================

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  const cargarDatosIniciales = async () => {
    await Promise.all([
      cargarOrdenes(),
      cargarMetricas(),
      cargarAlertas(),
      cargarSesiones(),
    ]);
  };

  // =====================================
  // API CALLS
  // =====================================

  const cargarOrdenes = async () => {
    try {
      const params = new URLSearchParams();
      if (busqueda) params.append('busqueda', busqueda);
      if (filtroEstatus) params.append('estatus', filtroEstatus);
      if (filtroCiudad) params.append('ciudad', filtroCiudad);
      if (filtroTransportadora) params.append('transportadora', filtroTransportadora);
      if (filtroNovedad !== null) params.append('conNovedad', String(filtroNovedad));
      if (filtroCritica !== null) params.append('esCritica', String(filtroCritica));
      params.append('pagina', String(pagina));
      params.append('porPagina', String(ITEMS_PER_PAGE));

      const res = await fetch(`${API_BASE}/tracking-ordenes/ordenes?${params}`);
      const data = await res.json();

      if (data.success) {
        setOrdenes(data.ordenes);
      }
    } catch (error) {
      console.error('Error cargando órdenes:', error);
    }
  };

  const cargarMetricas = async () => {
    try {
      const res = await fetch(`${API_BASE}/tracking-ordenes/metricas`);
      const data = await res.json();
      if (data.success) {
        setMetricas(data.metricas);
      }
    } catch (error) {
      console.error('Error cargando métricas:', error);
    }
  };

  const cargarAlertas = async () => {
    try {
      const res = await fetch(`${API_BASE}/tracking-ordenes/alertas?activas=true`);
      const data = await res.json();
      if (data.success) {
        setAlertas(data.alertas);
      }
    } catch (error) {
      console.error('Error cargando alertas:', error);
    }
  };

  const cargarSesiones = async () => {
    try {
      const res = await fetch(`${API_BASE}/tracking-ordenes/sesiones?limite=10`);
      const data = await res.json();
      if (data.success) {
        setSesiones(data.sesiones);
      }
    } catch (error) {
      console.error('Error cargando sesiones:', error);
    }
  };

  const cargarHistorialOrden = async (numeroGuia: string) => {
    try {
      const res = await fetch(`${API_BASE}/tracking-ordenes/ordenes/${numeroGuia}`);
      const data = await res.json();
      if (data.success) {
        setHistorialOrden(data.historial);
        setOrdenSeleccionada(data.orden);
      }
    } catch (error) {
      console.error('Error cargando historial:', error);
    }
  };

  const generarAnalisisIA = async () => {
    setLoadingAnalisis(true);
    try {
      const res = await fetch(`${API_BASE}/tracking-ordenes/analisis-ia`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setAnalisisIA(data.analisis);
        setVistaActiva('analisis');
      }
    } catch (error) {
      console.error('Error generando análisis:', error);
    } finally {
      setLoadingAnalisis(false);
    }
  };

  const resolverAlerta = async (alertaId: number, comentario?: string) => {
    try {
      const res = await fetch(`${API_BASE}/tracking-ordenes/alertas/${alertaId}/resolver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comentario }),
      });
      const data = await res.json();
      if (data.success) {
        setAlertas(prev => prev.filter(a => a.id !== alertaId));
      }
    } catch (error) {
      console.error('Error resolviendo alerta:', error);
    }
  };

  // =====================================
  // MANEJO DE ARCHIVOS
  // =====================================

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setGuardado(false);
    setResultadoCarga(null);

    try {
      const reader = new FileReader();

      reader.onload = (event) => {
        try {
          const binaryStr = event.target?.result;
          const workbook = XLSX.read(binaryStr, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          // Mapear columnas
          const ordenesParseadas: OrdenTracking[] = jsonData.map((row: any) => ({
            hora: findColumnValue(row, 'hora'),
            fecha: findColumnValue(row, 'fecha'),
            nombreCliente: findColumnValue(row, 'nombreCliente'),
            telefono: findColumnValue(row, 'telefono'),
            numeroGuia: String(findColumnValue(row, 'numeroGuia') || ''),
            estatus: findColumnValue(row, 'estatus'),
            ciudadDestino: findColumnValue(row, 'ciudadDestino'),
            transportadora: findColumnValue(row, 'transportadora'),
            novedad: findColumnValue(row, 'novedad'),
            ultimoMovimiento: findColumnValue(row, 'ultimoMovimiento'),
            fechaUltimoMovimiento: findColumnValue(row, 'fechaUltimoMovimiento'),
            horaUltimoMovimiento: findColumnValue(row, 'horaUltimoMovimiento'),
            fechaGeneracionGuia: findColumnValue(row, 'fechaGeneracionGuia'),
            tieneNovedad: !!findColumnValue(row, 'novedad'),
          }));

          // Filtrar órdenes sin número de guía
          const ordenesValidas = ordenesParseadas.filter(o => o.numeroGuia && o.numeroGuia.trim() !== '');

          setOrdenesLocal(ordenesValidas);
          setLoading(false);
        } catch (parseError) {
          console.error('Error parseando Excel:', parseError);
          setLoading(false);
        }
      };

      reader.readAsBinaryString(file);
    } catch (error) {
      console.error('Error leyendo archivo:', error);
      setLoading(false);
    }

    // Limpiar input
    e.target.value = '';
  };

  const guardarEnDB = async () => {
    if (ordenesLocal.length === 0) return;

    setLoading(true);

    try {
      const nombreSesion = `Carga ${new Date().toLocaleDateString('es-CO')} ${new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`;

      const res = await fetch(`${API_BASE}/tracking-ordenes/sesion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombreSesion,
          ordenes: ordenesLocal,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setGuardado(true);
        setResultadoCarga({
          total: data.estadisticas.total,
          nuevas: data.estadisticas.nuevas,
          actualizadas: data.estadisticas.actualizadas,
          entregadas: data.estadisticas.entregadas,
          devolucion: data.estadisticas.devolucion,
          cambios: data.cambiosDetectados || [],
          alertasGeneradas: data.alertasGeneradas,
        });

        // Recargar datos
        await cargarDatosIniciales();
      }
    } catch (error) {
      console.error('Error guardando en DB:', error);
    } finally {
      setLoading(false);
    }
  };

  // =====================================
  // FILTRADO LOCAL
  // =====================================

  const ordenesFiltradas = useMemo(() => {
    const source = ordenesLocal.length > 0 && !guardado ? ordenesLocal : ordenes;

    return source.filter((orden) => {
      // Búsqueda
      if (busqueda) {
        const searchLower = busqueda.toLowerCase();
        const matchGuia = orden.numeroGuia?.toLowerCase().includes(searchLower);
        const matchCliente = orden.nombreCliente?.toLowerCase().includes(searchLower);
        const matchTelefono = orden.telefono?.includes(busqueda);
        if (!matchGuia && !matchCliente && !matchTelefono) return false;
      }

      // Filtros
      if (filtroEstatus && !orden.estatus?.toLowerCase().includes(filtroEstatus.toLowerCase())) return false;
      if (filtroCiudad && !orden.ciudadDestino?.toLowerCase().includes(filtroCiudad.toLowerCase())) return false;
      if (filtroTransportadora && !orden.transportadora?.toLowerCase().includes(filtroTransportadora.toLowerCase())) return false;
      if (filtroNovedad !== null && orden.tieneNovedad !== filtroNovedad) return false;
      if (filtroCritica !== null && orden.esCritica !== filtroCritica) return false;

      return true;
    });
  }, [ordenesLocal, ordenes, guardado, busqueda, filtroEstatus, filtroCiudad, filtroTransportadora, filtroNovedad, filtroCritica]);

  // Opciones para filtros
  const opcionesEstatus = useMemo(() => {
    const source = ordenesLocal.length > 0 ? ordenesLocal : ordenes;
    return [...new Set(source.map(o => o.estatus).filter(Boolean))];
  }, [ordenesLocal, ordenes]);

  const opcionesCiudad = useMemo(() => {
    const source = ordenesLocal.length > 0 ? ordenesLocal : ordenes;
    return [...new Set(source.map(o => o.ciudadDestino).filter(Boolean))];
  }, [ordenesLocal, ordenes]);

  const opcionesTransportadora = useMemo(() => {
    const source = ordenesLocal.length > 0 ? ordenesLocal : ordenes;
    return [...new Set(source.map(o => o.transportadora).filter(Boolean))];
  }, [ordenesLocal, ordenes]);

  // Paginación local
  const ordenesEnPagina = useMemo(() => {
    const inicio = (pagina - 1) * ITEMS_PER_PAGE;
    return ordenesFiltradas.slice(inicio, inicio + ITEMS_PER_PAGE);
  }, [ordenesFiltradas, pagina]);

  const totalPaginas = Math.ceil(ordenesFiltradas.length / ITEMS_PER_PAGE);

  // =====================================
  // RENDER
  // =====================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Package className="w-7 h-7 text-indigo-500" />
            Tracking de Órdenes
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Gestión inteligente de envíos de transportadoras con análisis y alertas automáticas
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Botón de análisis IA */}
          <button
            onClick={generarAnalisisIA}
            disabled={loadingAnalisis || (metricas?.total || 0) === 0}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Brain className={`w-4 h-4 ${loadingAnalisis ? 'animate-pulse' : ''}`} />
            {loadingAnalisis ? 'Analizando...' : 'Análisis IA'}
          </button>

          {/* Upload */}
          <label className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all cursor-pointer">
            <Upload className="w-4 h-4" />
            Cargar Excel
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Métricas Rápidas */}
      {metricas && metricas.total > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="bg-white dark:bg-navy-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-navy-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 dark:bg-navy-700 rounded-lg">
                <Package className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Total</p>
                <p className="text-lg font-bold text-slate-800 dark:text-white">{metricas.total.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-navy-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-navy-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Entregadas</p>
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{metricas.entregadas.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-navy-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-navy-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Truck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">En Proceso</p>
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{metricas.enProceso.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-navy-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-navy-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Devoluciones</p>
                <p className="text-lg font-bold text-red-600 dark:text-red-400">{metricas.devoluciones.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-navy-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-navy-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Críticas</p>
                <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{metricas.criticas.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-navy-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-navy-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Tasa Entrega</p>
                <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{metricas.tasaEntrega}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resultado de carga */}
      {resultadoCarga && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-emerald-800 dark:text-emerald-300">Carga exitosa</h3>
              <p className="text-sm text-emerald-700 dark:text-emerald-400 mt-1">
                {resultadoCarga.total} órdenes procesadas: {resultadoCarga.nuevas} nuevas, {resultadoCarga.actualizadas} actualizadas
              </p>
              {resultadoCarga.cambios.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                    {resultadoCarga.cambios.length} cambios de estatus detectados
                  </p>
                </div>
              )}
              {resultadoCarga.alertasGeneradas > 0 && (
                <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-1">
                  Se generaron {resultadoCarga.alertasGeneradas} alertas automáticas
                </p>
              )}
            </div>
            <button
              onClick={() => setResultadoCarga(null)}
              className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Alertas activas */}
      {alertas.length > 0 && vistaActiva === 'tabla' && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-4 rounded-xl border border-amber-200 dark:border-amber-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <span className="font-semibold text-amber-800 dark:text-amber-300">
                {alertas.length} alertas activas
              </span>
            </div>
            <button
              onClick={() => setVistaActiva('alertas')}
              className="text-sm text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1"
            >
              Ver todas <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2">
            {alertas.slice(0, 2).map((alerta) => {
              const color = getSeveridadColor(alerta.severidad);
              const Icon = color.icon;
              return (
                <div key={alerta.id} className={`flex items-center gap-3 p-2 rounded-lg ${color.bg}`}>
                  <Icon className={`w-4 h-4 ${color.text}`} />
                  <span className={`text-sm ${color.text}`}>{alerta.titulo}</span>
                  <span className="text-xs text-slate-500">({alerta.cantidadAfectadas} guías)</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tabs de vista */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-navy-700">
        <button
          onClick={() => setVistaActiva('tabla')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            vistaActiva === 'tabla'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 inline mr-2" />
          Tabla de Órdenes
        </button>
        <button
          onClick={() => setVistaActiva('alertas')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            vistaActiva === 'alertas'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          <Bell className="w-4 h-4 inline mr-2" />
          Alertas ({alertas.length})
        </button>
        <button
          onClick={() => setVistaActiva('analisis')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            vistaActiva === 'analisis'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          <Brain className="w-4 h-4 inline mr-2" />
          Análisis IA
        </button>
        <button
          onClick={() => setVistaActiva('historial')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            vistaActiva === 'historial'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          <History className="w-4 h-4 inline mr-2" />
          Historial de Cargas
        </button>
      </div>

      {/* Vista: Tabla de Órdenes */}
      {vistaActiva === 'tabla' && (
        <div className="space-y-4">
          {/* Controles */}
          <div className="bg-white dark:bg-navy-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-navy-700">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              {/* Búsqueda */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por guía, cliente o teléfono..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Filtros */}
              <button
                onClick={() => setMostrarFiltros(!mostrarFiltros)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                  mostrarFiltros
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-700 dark:text-indigo-400'
                    : 'border-slate-200 dark:border-navy-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-navy-700'
                }`}
              >
                <Filter className="w-4 h-4" />
                Filtros
                {mostrarFiltros ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {/* Guardar */}
              {ordenesLocal.length > 0 && !guardado && (
                <button
                  onClick={guardarEnDB}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  Guardar {ordenesLocal.length} órdenes
                </button>
              )}

              {/* Refrescar */}
              <button
                onClick={cargarDatosIniciales}
                className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-700 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* Panel de filtros */}
            {mostrarFiltros && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-200 dark:border-navy-700">
                <select
                  value={filtroEstatus}
                  onChange={(e) => setFiltroEstatus(e.target.value)}
                  className="px-3 py-2 border border-slate-200 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-900 text-slate-800 dark:text-white text-sm"
                >
                  <option value="">Todos los estatus</option>
                  {opcionesEstatus.map((e) => (
                    <option key={e} value={e}>{e}</option>
                  ))}
                </select>

                <select
                  value={filtroCiudad}
                  onChange={(e) => setFiltroCiudad(e.target.value)}
                  className="px-3 py-2 border border-slate-200 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-900 text-slate-800 dark:text-white text-sm"
                >
                  <option value="">Todas las ciudades</option>
                  {opcionesCiudad.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>

                <select
                  value={filtroTransportadora}
                  onChange={(e) => setFiltroTransportadora(e.target.value)}
                  className="px-3 py-2 border border-slate-200 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-900 text-slate-800 dark:text-white text-sm"
                >
                  <option value="">Todas las transportadoras</option>
                  {opcionesTransportadora.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>

                <div className="flex gap-2">
                  <button
                    onClick={() => setFiltroNovedad(filtroNovedad === true ? null : true)}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filtroNovedad === true
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        : 'bg-slate-100 text-slate-600 dark:bg-navy-700 dark:text-slate-400'
                    }`}
                  >
                    Con Novedad
                  </button>
                  <button
                    onClick={() => setFiltroCritica(filtroCritica === true ? null : true)}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filtroCritica === true
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        : 'bg-slate-100 text-slate-600 dark:bg-navy-700 dark:text-slate-400'
                    }`}
                  >
                    Críticas
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Info de registros */}
          <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
            <span>
              Mostrando {ordenesEnPagina.length} de {ordenesFiltradas.length} órdenes
              {ordenesLocal.length > 0 && !guardado && (
                <span className="ml-2 text-amber-600 dark:text-amber-400">(sin guardar)</span>
              )}
            </span>
            <span>
              Página {pagina} de {totalPaginas || 1}
            </span>
          </div>

          {/* Tabla */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : ordenesEnPagina.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-navy-700">
              <FileSpreadsheet className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300">No hay órdenes</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Carga un archivo Excel para comenzar
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-navy-800 rounded-xl shadow-sm border border-slate-200 dark:border-navy-700 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-navy-900 border-b border-slate-200 dark:border-navy-700">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-400">Guía</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-400">Cliente</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-400">Teléfono</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-400">Estatus</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-400">Ciudad</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-400">Transportadora</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-400">Último Movimiento</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-400">Fecha Mov.</th>
                    <th className="px-4 py-3 text-center font-medium text-slate-600 dark:text-slate-400">Novedad</th>
                    <th className="px-4 py-3 text-center font-medium text-slate-600 dark:text-slate-400">Riesgo</th>
                    <th className="px-4 py-3 text-center font-medium text-slate-600 dark:text-slate-400">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-navy-700">
                  {ordenesEnPagina.map((orden, idx) => {
                    const statusColor = getStatusColor(orden.estatus);
                    return (
                      <tr
                        key={orden.id || orden.numeroGuia + idx}
                        className={`hover:bg-slate-50 dark:hover:bg-navy-700/50 transition-colors ${
                          orden.esCritica ? 'bg-red-50/50 dark:bg-red-900/10' : ''
                        }`}
                      >
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs bg-slate-100 dark:bg-navy-700 px-2 py-1 rounded">
                            {orden.numeroGuia}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-800 dark:text-slate-200">
                          {orden.nombreCliente || '-'}
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                          {orden.telefono || '-'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColor.bg} ${statusColor.text}`}>
                            {orden.estatus || 'Sin estado'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {orden.ciudadDestino || '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                          <div className="flex items-center gap-1">
                            <Truck className="w-3 h-3" />
                            {orden.transportadora || '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 max-w-[200px] truncate">
                          {orden.ultimoMovimiento || '-'}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                          {orden.fechaUltimoMovimiento || '-'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {orden.tieneNovedad || orden.novedad ? (
                            <span className="text-xl" title={orden.novedad || 'Con novedad'}>
                              ⚠️
                            </span>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-600">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {orden.nivelRiesgo ? (
                            <span className={`text-xs font-bold ${getRiesgoColor(orden.nivelRiesgo)}`}>
                              {orden.nivelRiesgo}
                            </span>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-600">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => cargarHistorialOrden(orden.numeroGuia)}
                            className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                            title="Ver historial"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Paginación */}
          {totalPaginas > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setPagina(p => Math.max(1, p - 1))}
                disabled={pagina === 1}
                className="p-2 rounded-lg border border-slate-200 dark:border-navy-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-navy-700"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400">
                {pagina} / {totalPaginas}
              </span>
              <button
                onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
                disabled={pagina === totalPaginas}
                className="p-2 rounded-lg border border-slate-200 dark:border-navy-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-navy-700"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Vista: Alertas */}
      {vistaActiva === 'alertas' && (
        <div className="space-y-4">
          {alertas.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-navy-700">
              <Bell className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300">Sin alertas activas</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                No hay situaciones que requieran atención inmediata
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {alertas.map((alerta) => {
                const color = getSeveridadColor(alerta.severidad);
                const Icon = color.icon;
                return (
                  <div
                    key={alerta.id}
                    className={`bg-white dark:bg-navy-800 p-4 rounded-xl border-l-4 shadow-sm ${
                      alerta.severidad === 'CRITICAL' ? 'border-l-red-500' :
                      alerta.severidad === 'URGENT' ? 'border-l-orange-500' :
                      alerta.severidad === 'WARNING' ? 'border-l-amber-500' :
                      'border-l-blue-500'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-lg ${color.bg}`}>
                        <Icon className={`w-5 h-5 ${color.text}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-slate-800 dark:text-white">{alerta.titulo}</h4>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${color.bg} ${color.text}`}>
                            {alerta.severidad}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{alerta.descripcion}</p>
                        {alerta.accionRecomendada && (
                          <div className="mt-3 p-3 bg-slate-50 dark:bg-navy-900 rounded-lg">
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                              Acción recomendada:
                            </p>
                            <p className="text-sm text-slate-700 dark:text-slate-300">{alerta.accionRecomendada}</p>
                          </div>
                        )}
                        <div className="flex items-center gap-4 mt-3">
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {alerta.cantidadAfectadas} guías afectadas
                          </span>
                          {alerta.transportadora && (
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              <Truck className="w-3 h-3 inline mr-1" />{alerta.transportadora}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => resolverAlerta(alerta.id)}
                        className="px-3 py-1 text-sm bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors"
                      >
                        Resolver
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Vista: Análisis IA */}
      {vistaActiva === 'analisis' && (
        <div className="space-y-6">
          {!analisisIA ? (
            <div className="text-center py-12 bg-white dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-navy-700">
              <Brain className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300">Análisis con IA</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-4">
                Genera un análisis inteligente de tus órdenes con recomendaciones personalizadas
              </p>
              <button
                onClick={generarAnalisisIA}
                disabled={loadingAnalisis || (metricas?.total || 0) === 0}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50"
              >
                <Brain className={`w-5 h-5 ${loadingAnalisis ? 'animate-pulse' : ''}`} />
                {loadingAnalisis ? 'Analizando...' : 'Generar Análisis'}
              </button>
            </div>
          ) : (
            <>
              {/* Resumen */}
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 p-6 rounded-xl border border-purple-200 dark:border-purple-800">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                    <Brain className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-purple-800 dark:text-purple-300 text-lg">Resumen del Análisis</h3>
                    <p className="text-purple-700 dark:text-purple-400 mt-2">{analisisIA.resumen}</p>
                  </div>
                </div>
              </div>

              {/* Recomendaciones */}
              {analisisIA.recomendaciones.length > 0 && (
                <div className="bg-white dark:bg-navy-800 p-6 rounded-xl border border-slate-200 dark:border-navy-700">
                  <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-amber-500" />
                    Recomendaciones
                  </h3>
                  <div className="space-y-4">
                    {analisisIA.recomendaciones.map((rec, idx) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-lg border-l-4 ${
                          rec.tipo === 'CRITICO' ? 'bg-red-50 dark:bg-red-900/20 border-l-red-500' :
                          rec.tipo === 'ALERTA' ? 'bg-amber-50 dark:bg-amber-900/20 border-l-amber-500' :
                          'bg-blue-50 dark:bg-blue-900/20 border-l-blue-500'
                        }`}
                      >
                        <h4 className="font-semibold text-slate-800 dark:text-white">{rec.titulo}</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{rec.descripcion}</p>
                        {rec.acciones.length > 0 && (
                          <ul className="mt-3 space-y-1">
                            {rec.acciones.map((accion, i) => (
                              <li key={i} className="text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2">
                                <ArrowRight className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                                {accion}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Transportadoras Problemáticas */}
              {analisisIA.transportadorasProblematicas.length > 0 && (
                <div className="bg-white dark:bg-navy-800 p-6 rounded-xl border border-slate-200 dark:border-navy-700">
                  <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                    <Truck className="w-5 h-5 text-indigo-500" />
                    Transportadoras a Revisar
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {analisisIA.transportadorasProblematicas.map((t, idx) => (
                      <div key={idx} className="p-4 bg-slate-50 dark:bg-navy-900 rounded-lg">
                        <p className="font-medium text-slate-800 dark:text-white">{t.nombre}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm text-slate-500">{t.total} guías</span>
                          <span className={`text-sm font-bold ${
                            t.porcentajeCriticas > 30 ? 'text-red-600' :
                            t.porcentajeCriticas > 20 ? 'text-amber-600' :
                            'text-slate-600'
                          }`}>
                            {t.porcentajeCriticas}% críticas
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Vista: Historial de Cargas */}
      {vistaActiva === 'historial' && (
        <div className="space-y-4">
          {sesiones.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-navy-700">
              <History className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300">Sin historial de cargas</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Aún no has cargado ningún archivo
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-navy-700 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-navy-900 border-b border-slate-200 dark:border-navy-700">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-400">Sesión</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-400">Fecha</th>
                    <th className="px-4 py-3 text-center font-medium text-slate-600 dark:text-slate-400">Total</th>
                    <th className="px-4 py-3 text-center font-medium text-slate-600 dark:text-slate-400">Nuevas</th>
                    <th className="px-4 py-3 text-center font-medium text-slate-600 dark:text-slate-400">Actualizadas</th>
                    <th className="px-4 py-3 text-center font-medium text-slate-600 dark:text-slate-400">Entregadas</th>
                    <th className="px-4 py-3 text-center font-medium text-slate-600 dark:text-slate-400">Devolución</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-navy-700">
                  {sesiones.map((sesion) => (
                    <tr key={sesion.id} className="hover:bg-slate-50 dark:hover:bg-navy-700/50">
                      <td className="px-4 py-3 font-medium text-slate-800 dark:text-white">{sesion.nombre}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                        {sesion.fecha ? new Date(sesion.fecha).toLocaleString('es-CO') : '-'}
                      </td>
                      <td className="px-4 py-3 text-center text-slate-800 dark:text-white font-medium">{sesion.totalOrdenes}</td>
                      <td className="px-4 py-3 text-center text-emerald-600 dark:text-emerald-400">{sesion.nuevas}</td>
                      <td className="px-4 py-3 text-center text-blue-600 dark:text-blue-400">{sesion.actualizadas}</td>
                      <td className="px-4 py-3 text-center text-emerald-600 dark:text-emerald-400">{sesion.entregadas}</td>
                      <td className="px-4 py-3 text-center text-red-600 dark:text-red-400">{sesion.devolucion}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal de historial de orden */}
      {ordenSeleccionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-navy-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-navy-700 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                  Historial de Guía: {ordenSeleccionada.numeroGuia}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {ordenSeleccionada.nombreCliente} • {ordenSeleccionada.ciudadDestino}
                </p>
              </div>
              <button
                onClick={() => {
                  setOrdenSeleccionada(null);
                  setHistorialOrden([]);
                }}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {historialOrden.length === 0 ? (
                <div className="text-center py-8">
                  <History className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-500 dark:text-slate-400">Sin historial registrado</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {historialOrden.map((h, idx) => {
                    const statusColor = getStatusColor(h.estatus);
                    return (
                      <div
                        key={h.id}
                        className="relative pl-6 pb-4 border-l-2 border-slate-200 dark:border-navy-600 last:pb-0"
                      >
                        <div className="absolute left-0 top-0 w-3 h-3 -translate-x-[7px] rounded-full bg-indigo-500"></div>
                        <div className="bg-slate-50 dark:bg-navy-900 p-4 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor.bg} ${statusColor.text}`}>
                              {h.estatus}
                            </span>
                            {h.cambioEstatus && h.estatusAnterior && (
                              <span className="text-xs text-slate-500">
                                (antes: {h.estatusAnterior})
                              </span>
                            )}
                          </div>
                          {h.ultimoMovimiento && (
                            <p className="text-sm text-slate-600 dark:text-slate-400">{h.ultimoMovimiento}</p>
                          )}
                          {h.novedad && (
                            <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                              ⚠️ {h.novedad}
                            </p>
                          )}
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                            {h.fechaRegistro ? new Date(h.fechaRegistro).toLocaleString('es-CO') : '-'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackingOrdenesTab;
