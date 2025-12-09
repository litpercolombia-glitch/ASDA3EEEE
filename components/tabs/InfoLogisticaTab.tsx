import React, { useState, useMemo, useCallback } from 'react';
import {
  Package,
  Phone,
  MapPin,
  Truck,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Filter,
  Search,
  Download,
  Upload,
  FileSpreadsheet,
  RefreshCw,
  ChevronDown,
  Info,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  Eye,
  RotateCcw,
} from 'lucide-react';

// ============================================
// TIPOS
// ============================================

export type FiltroFecha = 'hoy' | 'ayer' | '7dias' | '14dias' | '30dias' | 'todo';

export type EstadoOrden =
  | 'ENTREGADO'
  | 'EN_TRANSITO'
  | 'PENDIENTE'
  | 'DEVOLUCION'
  | 'CANCELADO'
  | 'NOVEDAD';

export interface GuiaLogistica {
  id: string;
  numeroGuia: string;
  numeroCelular: string;
  estatusOrden: EstadoOrden;
  fechaReporte: Date;
  ciudadDestino: string;
  departamento: string;
  transportadora: string;
  novedad?: string;
  tipoNovedad?: string;
  valorFacturado?: number;
  ganancia?: number;
  precioFlete?: number;
}

interface InfoLogisticaTabProps {
  shipments?: any[];
}

// ============================================
// UTILIDADES DE FECHA
// ============================================

const calcularRangoFecha = (filtro: FiltroFecha): { inicio: Date; fin: Date } => {
  const ahora = new Date();
  const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());

  switch (filtro) {
    case 'hoy':
      return { inicio: hoy, fin: new Date(hoy.getTime() + 24 * 60 * 60 * 1000) };
    case 'ayer':
      const ayer = new Date(hoy.getTime() - 24 * 60 * 60 * 1000);
      return { inicio: ayer, fin: hoy };
    case '7dias':
      return { inicio: new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000), fin: ahora };
    case '14dias':
      return { inicio: new Date(hoy.getTime() - 14 * 24 * 60 * 60 * 1000), fin: ahora };
    case '30dias':
      return { inicio: new Date(hoy.getTime() - 30 * 24 * 60 * 60 * 1000), fin: ahora };
    case 'todo':
    default:
      return { inicio: new Date(0), fin: ahora };
  }
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export const InfoLogisticaTab: React.FC<InfoLogisticaTabProps> = ({ shipments = [] }) => {
  // Estados de filtros
  const [filtroFecha, setFiltroFecha] = useState<FiltroFecha>('todo');
  const [filtroTransportadora, setFiltroTransportadora] = useState<string>('todas');
  const [filtroEstatus, setFiltroEstatus] = useState<string>('todos');
  const [filtroCiudad, setFiltroCiudad] = useState<string>('todas');
  const [filtroNovedad, setFiltroNovedad] = useState<string>('todas');
  const [busqueda, setBusqueda] = useState('');
  const [ordenamiento, setOrdenamiento] = useState<{ campo: string; direccion: 'asc' | 'desc' }>({
    campo: 'fechaReporte',
    direccion: 'desc'
  });

  // Estado de datos cargados
  const [guiasLogisticas, setGuiasLogisticas] = useState<GuiaLogistica[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [archivosCargados, setArchivosCargados] = useState<{ nombre: string; fecha: Date; registros: number }[]>([]);

  // Extraer opciones únicas para filtros
  const opcionesFiltros = useMemo(() => {
    const transportadoras = new Set<string>();
    const ciudades = new Set<string>();
    const novedades = new Set<string>();

    guiasLogisticas.forEach(g => {
      if (g.transportadora) transportadoras.add(g.transportadora);
      if (g.ciudadDestino) ciudades.add(g.ciudadDestino);
      if (g.tipoNovedad) novedades.add(g.tipoNovedad);
    });

    return {
      transportadoras: Array.from(transportadoras).sort(),
      ciudades: Array.from(ciudades).sort(),
      novedades: Array.from(novedades).sort(),
    };
  }, [guiasLogisticas]);

  // Filtrar guías
  const guiasFiltradas = useMemo(() => {
    const { inicio, fin } = calcularRangoFecha(filtroFecha);

    return guiasLogisticas.filter(guia => {
      // Filtro de fecha
      const fechaGuia = new Date(guia.fechaReporte);
      if (fechaGuia < inicio || fechaGuia > fin) return false;

      // Filtro de transportadora
      if (filtroTransportadora !== 'todas' && guia.transportadora !== filtroTransportadora) return false;

      // Filtro de estatus
      if (filtroEstatus !== 'todos' && guia.estatusOrden !== filtroEstatus) return false;

      // Filtro de ciudad
      if (filtroCiudad !== 'todas' && guia.ciudadDestino !== filtroCiudad) return false;

      // Filtro de novedad
      if (filtroNovedad === 'con_novedad' && !guia.novedad) return false;
      if (filtroNovedad === 'sin_novedad' && guia.novedad) return false;

      // Búsqueda
      if (busqueda) {
        const termino = busqueda.toLowerCase();
        return (
          guia.numeroGuia.toLowerCase().includes(termino) ||
          guia.numeroCelular.includes(termino) ||
          guia.ciudadDestino.toLowerCase().includes(termino) ||
          guia.transportadora.toLowerCase().includes(termino)
        );
      }

      return true;
    }).sort((a, b) => {
      const { campo, direccion } = ordenamiento;
      let valorA: any = a[campo as keyof GuiaLogistica];
      let valorB: any = b[campo as keyof GuiaLogistica];

      if (campo === 'fechaReporte') {
        valorA = new Date(valorA).getTime();
        valorB = new Date(valorB).getTime();
      }

      if (valorA < valorB) return direccion === 'asc' ? -1 : 1;
      if (valorA > valorB) return direccion === 'asc' ? 1 : -1;
      return 0;
    });
  }, [guiasLogisticas, filtroFecha, filtroTransportadora, filtroEstatus, filtroCiudad, filtroNovedad, busqueda, ordenamiento]);

  // Estadísticas
  const estadisticas = useMemo(() => {
    const total = guiasFiltradas.length;
    const entregados = guiasFiltradas.filter(g => g.estatusOrden === 'ENTREGADO').length;
    const devoluciones = guiasFiltradas.filter(g => g.estatusOrden === 'DEVOLUCION').length;
    const enTransito = guiasFiltradas.filter(g => g.estatusOrden === 'EN_TRANSITO').length;
    const conNovedad = guiasFiltradas.filter(g => g.novedad).length;
    const tasaEntrega = total > 0 ? ((entregados / total) * 100).toFixed(1) : '0';

    return { total, entregados, devoluciones, enTransito, conNovedad, tasaEntrega };
  }, [guiasFiltradas]);

  // Manejar carga de archivo Excel
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);

    try {
      // Simular procesamiento (aquí se integraría con xlsx o backend)
      const formData = new FormData();
      formData.append('file', file);

      // Llamar al backend para procesar
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();

        // Convertir datos del backend a formato local
        const nuevasGuias: GuiaLogistica[] = data.guias || [];

        setGuiasLogisticas(prev => [...prev, ...nuevasGuias]);
        setArchivosCargados(prev => [...prev, {
          nombre: file.name,
          fecha: new Date(),
          registros: nuevasGuias.length
        }]);
      } else {
        // Procesar localmente si el backend no está disponible
        console.log('Procesando archivo localmente...');
        // Aquí se integraría xlsx para parsear el archivo
      }
    } catch (error) {
      console.error('Error al cargar archivo:', error);
    } finally {
      setIsLoading(false);
      e.target.value = '';
    }
  };

  // Cambiar ordenamiento
  const cambiarOrdenamiento = (campo: string) => {
    setOrdenamiento(prev => ({
      campo,
      direccion: prev.campo === campo && prev.direccion === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Obtener color de estatus
  const getEstatusColor = (estatus: EstadoOrden) => {
    switch (estatus) {
      case 'ENTREGADO': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'EN_TRANSITO': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'PENDIENTE': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'DEVOLUCION': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'CANCELADO': return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
      case 'NOVEDAD': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Obtener icono de estatus
  const getEstatusIcon = (estatus: EstadoOrden) => {
    switch (estatus) {
      case 'ENTREGADO': return <CheckCircle className="w-4 h-4" />;
      case 'EN_TRANSITO': return <Truck className="w-4 h-4" />;
      case 'PENDIENTE': return <Clock className="w-4 h-4" />;
      case 'DEVOLUCION': return <RotateCcw className="w-4 h-4" />;
      case 'CANCELADO': return <XCircle className="w-4 h-4" />;
      case 'NOVEDAD': return <AlertTriangle className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  // Limpiar filtros
  const limpiarFiltros = () => {
    setFiltroFecha('todo');
    setFiltroTransportadora('todas');
    setFiltroEstatus('todos');
    setFiltroCiudad('todas');
    setFiltroNovedad('todas');
    setBusqueda('');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <Package className="w-8 h-8" />
              Información Logística
            </h1>
            <p className="text-indigo-100 mt-1">
              Gestiona y analiza todos tus envíos en un solo lugar
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl cursor-pointer transition-all">
              <Upload className="w-5 h-5" />
              <span className="font-medium">Cargar Excel</span>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
          <div className="bg-white/10 rounded-xl p-4 backdrop-blur">
            <p className="text-xs text-indigo-200 uppercase">Total Guías</p>
            <p className="text-2xl font-bold">{estadisticas.total}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-4 backdrop-blur">
            <p className="text-xs text-indigo-200 uppercase">Entregados</p>
            <p className="text-2xl font-bold text-emerald-300">{estadisticas.entregados}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-4 backdrop-blur">
            <p className="text-xs text-indigo-200 uppercase">Tasa Entrega</p>
            <p className="text-2xl font-bold">{estadisticas.tasaEntrega}%</p>
          </div>
          <div className="bg-white/10 rounded-xl p-4 backdrop-blur">
            <p className="text-xs text-indigo-200 uppercase">Devoluciones</p>
            <p className="text-2xl font-bold text-red-300">{estadisticas.devoluciones}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-4 backdrop-blur">
            <p className="text-xs text-indigo-200 uppercase">Con Novedad</p>
            <p className="text-2xl font-bold text-orange-300">{estadisticas.conNovedad}</p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-navy-900 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-navy-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Filter className="w-5 h-5 text-indigo-500" />
            Filtros
          </h2>
          <button
            onClick={limpiarFiltros}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
          >
            <RefreshCw className="w-4 h-4" />
            Limpiar filtros
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          {/* Búsqueda */}
          <div className="lg:col-span-2">
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Buscar
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Guía, celular, ciudad..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-navy-700 rounded-xl bg-slate-50 dark:bg-navy-950 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filtro de fecha */}
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Período
            </label>
            <select
              value={filtroFecha}
              onChange={(e) => setFiltroFecha(e.target.value as FiltroFecha)}
              className="w-full px-4 py-2 border border-slate-300 dark:border-navy-700 rounded-xl bg-slate-50 dark:bg-navy-950 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="hoy">Hoy</option>
              <option value="ayer">Ayer</option>
              <option value="7dias">Últimos 7 días</option>
              <option value="14dias">Últimos 14 días</option>
              <option value="30dias">Últimos 30 días</option>
              <option value="todo">Todo</option>
            </select>
          </div>

          {/* Filtro de transportadora */}
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Transportadora
            </label>
            <select
              value={filtroTransportadora}
              onChange={(e) => setFiltroTransportadora(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 dark:border-navy-700 rounded-xl bg-slate-50 dark:bg-navy-950 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="todas">Todas</option>
              {opcionesFiltros.transportadoras.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Filtro de estatus */}
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Estatus
            </label>
            <select
              value={filtroEstatus}
              onChange={(e) => setFiltroEstatus(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 dark:border-navy-700 rounded-xl bg-slate-50 dark:bg-navy-950 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="todos">Todos</option>
              <option value="ENTREGADO">Entregado</option>
              <option value="EN_TRANSITO">En tránsito</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="DEVOLUCION">Devolución</option>
              <option value="CANCELADO">Cancelado</option>
              <option value="NOVEDAD">Con novedad</option>
            </select>
          </div>

          {/* Filtro de novedad */}
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Novedades
            </label>
            <select
              value={filtroNovedad}
              onChange={(e) => setFiltroNovedad(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 dark:border-navy-700 rounded-xl bg-slate-50 dark:bg-navy-950 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="todas">Todas</option>
              <option value="con_novedad">Con novedad</option>
              <option value="sin_novedad">Sin novedad</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de guías */}
      <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-lg border border-slate-200 dark:border-navy-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-navy-950 border-b border-slate-200 dark:border-navy-800">
              <tr>
                <th
                  className="px-4 py-3 text-left text-xs font-bold text-slate-600 dark:text-slate-300 uppercase cursor-pointer hover:bg-slate-100 dark:hover:bg-navy-800"
                  onClick={() => cambiarOrdenamiento('numeroGuia')}
                >
                  <div className="flex items-center gap-1">
                    <Package className="w-4 h-4" />
                    Número Guía
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">
                  <div className="flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    Celular
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-bold text-slate-600 dark:text-slate-300 uppercase cursor-pointer hover:bg-slate-100 dark:hover:bg-navy-800"
                  onClick={() => cambiarOrdenamiento('estatusOrden')}
                >
                  <div className="flex items-center gap-1">
                    Estatus
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-bold text-slate-600 dark:text-slate-300 uppercase cursor-pointer hover:bg-slate-100 dark:hover:bg-navy-800"
                  onClick={() => cambiarOrdenamiento('fechaReporte')}
                >
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Fecha Reporte
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    Ciudad
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">
                  Departamento
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">
                  <div className="flex items-center gap-1">
                    <Truck className="w-4 h-4" />
                    Transportadora
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">
                  <div className="flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    Novedad
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-navy-800">
              {guiasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <FileSpreadsheet className="w-12 h-12 text-slate-300 dark:text-navy-700" />
                      <p className="text-slate-500 dark:text-slate-400">
                        {guiasLogisticas.length === 0
                          ? 'No hay guías cargadas. Sube un archivo Excel para comenzar.'
                          : 'No se encontraron guías con los filtros aplicados.'
                        }
                      </p>
                      {guiasLogisticas.length === 0 && (
                        <label className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl cursor-pointer transition-all">
                          <Upload className="w-4 h-4" />
                          <span className="font-medium">Cargar archivo Excel</span>
                          <input
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                guiasFiltradas.map((guia) => (
                  <tr
                    key={guia.id}
                    className="hover:bg-slate-50 dark:hover:bg-navy-800/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {guia.numeroGuia}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-slate-700 dark:text-slate-300">
                        {guia.numeroCelular || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${getEstatusColor(guia.estatusOrden)}`}>
                        {getEstatusIcon(guia.estatusOrden)}
                        {guia.estatusOrden.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {new Date(guia.fechaReporte).toLocaleDateString('es-CO', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                      {guia.ciudadDestino}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {guia.departamento}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-slate-100 dark:bg-navy-800 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300">
                        {guia.transportadora}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {guia.novedad ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full text-xs font-medium">
                          <AlertTriangle className="w-3 h-3" />
                          {guia.tipoNovedad || 'Novedad'}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer con paginación */}
        {guiasFiltradas.length > 0 && (
          <div className="px-4 py-3 bg-slate-50 dark:bg-navy-950 border-t border-slate-200 dark:border-navy-800 flex items-center justify-between">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Mostrando {guiasFiltradas.length} de {guiasLogisticas.length} guías
            </p>
            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-all">
              <Download className="w-4 h-4" />
              Exportar
            </button>
          </div>
        )}
      </div>

      {/* Archivos cargados */}
      {archivosCargados.length > 0 && (
        <div className="bg-white dark:bg-navy-900 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-navy-800">
          <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-indigo-500" />
            Archivos Cargados
          </h3>
          <div className="space-y-2">
            {archivosCargados.map((archivo, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-slate-50 dark:bg-navy-950 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
                  <div>
                    <p className="font-medium text-slate-700 dark:text-slate-300">{archivo.nombre}</p>
                    <p className="text-xs text-slate-500">
                      {archivo.fecha.toLocaleDateString('es-CO')} - {archivo.registros} registros
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-bold">
                  Procesado
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-navy-900 rounded-2xl p-8 flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            <p className="font-medium text-slate-700 dark:text-slate-300">Procesando archivo...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default InfoLogisticaTab;
