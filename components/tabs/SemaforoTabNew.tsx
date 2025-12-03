import React, { useState, useMemo, useEffect } from 'react';
import {
  Activity,
  Search,
  Filter,
  Download,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Bot,
  FileSpreadsheet,
  Truck,
  MapPin,
  BarChart3,
  Percent,
} from 'lucide-react';
import { ExcelUploader } from '../excel/ExcelUploader';
import {
  CiudadSemaforo,
  SemaforoExcelData,
  SemaforoColor,
  STORAGE_KEYS,
} from '../../types/logistics';
import { procesarExcelParaSemaforo } from '../../utils/patternDetection';
import { saveTabData, loadTabData } from '../../utils/tabStorage';

interface SemaforoTabNewProps {
  onDataLoaded?: (data: SemaforoExcelData) => void;
}

const SemaforoColorBadge: React.FC<{ color: SemaforoColor; tasaExito: number }> = ({
  color,
  tasaExito,
}) => {
  const config = {
    VERDE: {
      bg: 'bg-emerald-100 dark:bg-emerald-900/30',
      text: 'text-emerald-700 dark:text-emerald-400',
      border: 'border-emerald-200 dark:border-emerald-800',
      icon: '🟢',
      label: 'Excelente',
      range: '≥75%',
    },
    AMARILLO: {
      bg: 'bg-yellow-100 dark:bg-yellow-900/30',
      text: 'text-yellow-700 dark:text-yellow-400',
      border: 'border-yellow-200 dark:border-yellow-800',
      icon: '🟡',
      label: 'Bueno',
      range: '65-74%',
    },
    NARANJA: {
      bg: 'bg-orange-100 dark:bg-orange-900/30',
      text: 'text-orange-700 dark:text-orange-400',
      border: 'border-orange-200 dark:border-orange-800',
      icon: '🟠',
      label: 'Alerta',
      range: '50-64%',
    },
    ROJO: {
      bg: 'bg-red-100 dark:bg-red-900/30',
      text: 'text-red-700 dark:text-red-400',
      border: 'border-red-200 dark:border-red-800',
      icon: '🔴',
      label: 'Crítico',
      range: '<50%',
    },
  };

  const c = config[color];

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${c.bg} ${c.border} border`}>
      <span>{c.icon}</span>
      <span className={`text-sm font-bold ${c.text}`}>{tasaExito.toFixed(0)}%</span>
    </div>
  );
};

const CiudadCard: React.FC<{ ciudad: CiudadSemaforo }> = ({ ciudad }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const borderColors = {
    VERDE: 'border-l-emerald-500',
    AMARILLO: 'border-l-yellow-500',
    NARANJA: 'border-l-orange-500',
    ROJO: 'border-l-red-500',
  };

  const bgColors = {
    VERDE: 'bg-emerald-50/50 dark:bg-emerald-900/10',
    AMARILLO: 'bg-yellow-50/50 dark:bg-yellow-900/10',
    NARANJA: 'bg-orange-50/50 dark:bg-orange-900/10',
    ROJO: 'bg-red-50/50 dark:bg-red-900/10',
  };

  return (
    <div
      className={`bg-white dark:bg-navy-900 rounded-xl border-l-4 ${borderColors[ciudad.semaforo]} border border-slate-200 dark:border-navy-700 overflow-hidden transition-all hover:shadow-md`}
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-slate-400" />
              {ciudad.ciudad}
            </h3>
            <p className="text-sm text-slate-500 flex items-center gap-1">
              <Truck className="w-4 h-4" />
              {ciudad.transportadora}
            </p>
          </div>
          <SemaforoColorBadge color={ciudad.semaforo} tasaExito={ciudad.tasaExito} />
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Tasa de éxito</span>
            <span>{ciudad.entregas} / {ciudad.total} entregas</span>
          </div>
          <div className="w-full h-2 bg-slate-200 dark:bg-navy-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                ciudad.semaforo === 'VERDE'
                  ? 'bg-emerald-500'
                  : ciudad.semaforo === 'AMARILLO'
                    ? 'bg-yellow-500'
                    : ciudad.semaforo === 'NARANJA'
                      ? 'bg-orange-500'
                      : 'bg-red-500'
              }`}
              style={{ width: `${ciudad.tasaExito}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-slate-50 dark:bg-navy-950 rounded-lg p-2 text-center">
            <p className="text-xs text-slate-500">Entregas</p>
            <p className="text-lg font-bold text-emerald-600">{ciudad.entregas}</p>
          </div>
          <div className="bg-slate-50 dark:bg-navy-950 rounded-lg p-2 text-center">
            <p className="text-xs text-slate-500">Devoluciones</p>
            <p className="text-lg font-bold text-red-600">{ciudad.devoluciones}</p>
          </div>
          <div className="bg-slate-50 dark:bg-navy-950 rounded-lg p-2 text-center">
            <p className="text-xs text-slate-500">Tiempo Prom.</p>
            <p className="text-lg font-bold text-blue-600">{ciudad.tiempoPromedio}d</p>
          </div>
        </div>

        {/* AI Recommendation */}
        <div className={`${bgColors[ciudad.semaforo]} rounded-lg p-3 border ${
          ciudad.semaforo === 'VERDE' ? 'border-emerald-200 dark:border-emerald-800' :
          ciudad.semaforo === 'AMARILLO' ? 'border-yellow-200 dark:border-yellow-800' :
          ciudad.semaforo === 'NARANJA' ? 'border-orange-200 dark:border-orange-800' :
          'border-red-200 dark:border-red-800'
        }`}>
          <div className="flex items-start gap-2">
            <Bot className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-slate-700 dark:text-slate-300">{ciudad.recomendacionIA}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export const SemaforoTabNew: React.FC<SemaforoTabNewProps> = ({ onDataLoaded }) => {
  const [excelData, setExcelData] = useState<SemaforoExcelData | null>(null);
  const [ciudades, setCiudades] = useState<CiudadSemaforo[]>([]);
  const [lastUpload, setLastUpload] = useState<Date | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterSemaforo, setFilterSemaforo] = useState<SemaforoColor | 'ALL'>('ALL');

  // Load saved data on mount
  useEffect(() => {
    const saved = loadTabData<{
      data: SemaforoExcelData;
      uploadDate: string;
      fileName: string;
    } | null>(STORAGE_KEYS.SEMAFORO, null);

    if (saved) {
      setExcelData(saved.data);
      setLastUpload(new Date(saved.uploadDate));
      setFileName(saved.fileName);

      const processed = procesarExcelParaSemaforo(saved.data);
      setCiudades(processed);
    }
  }, []);

  // Handle Excel data loaded
  const handleDataLoaded = (data: SemaforoExcelData) => {
    setExcelData(data);
    setLastUpload(new Date());
    setFileName('datos_cargados.xlsx');

    // Process data
    const processed = procesarExcelParaSemaforo(data);
    setCiudades(processed);

    // Save to localStorage
    saveTabData(STORAGE_KEYS.SEMAFORO, {
      data,
      uploadDate: new Date().toISOString(),
      fileName: 'datos_cargados.xlsx',
    });

    // Notify parent
    if (onDataLoaded) {
      onDataLoaded(data);
    }
  };

  // Count by semaforo color
  const counts = useMemo(() => {
    const c = { VERDE: 0, AMARILLO: 0, NARANJA: 0, ROJO: 0 };
    ciudades.forEach((ciudad) => {
      c[ciudad.semaforo]++;
    });
    return c;
  }, [ciudades]);

  // Filter cities
  const filteredCiudades = useMemo(() => {
    return ciudades.filter((c) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !c.ciudad.toLowerCase().includes(query) &&
          !c.transportadora.toLowerCase().includes(query)
        ) {
          return false;
        }
      }
      if (filterSemaforo !== 'ALL' && c.semaforo !== filterSemaforo) {
        return false;
      }
      return true;
    });
  }, [ciudades, searchQuery, filterSemaforo]);

  // Group by semaforo for display
  const groupedByColor = useMemo(() => {
    const groups: Record<SemaforoColor, CiudadSemaforo[]> = {
      ROJO: [],
      NARANJA: [],
      AMARILLO: [],
      VERDE: [],
    };
    filteredCiudades.forEach((c) => {
      groups[c.semaforo].push(c);
    });
    return groups;
  }, [filteredCiudades]);

  // Clear data
  const handleClearData = () => {
    if (confirm('¿Estás seguro de que deseas borrar los datos cargados?')) {
      setExcelData(null);
      setCiudades([]);
      setLastUpload(null);
      setFileName(null);
      localStorage.removeItem(STORAGE_KEYS.SEMAFORO);
    }
  };

  // If no data, show upload screen
  if (!excelData) {
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center justify-center gap-3 mb-2">
            <Activity className="w-8 h-8 text-amber-500" />
            Semáforo de Ciudades
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            Visualiza el rendimiento de entregas por ciudad y transportadora
          </p>
        </div>

        <ExcelUploader pestaña="semaforo" onDataLoaded={handleDataLoaded} />
      </div>
    );
  }

  // Data loaded view
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <Activity className="w-8 h-8 text-amber-500" />
            Semáforo de Ciudades
          </h2>
          <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
            <span className="flex items-center gap-1">
              <FileSpreadsheet className="w-4 h-4" />
              {fileName}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {lastUpload?.toLocaleDateString('es-CO')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setExcelData(null)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-navy-800 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-navy-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Nuevo Excel
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-700 p-4">
        <p className="text-sm font-bold text-slate-700 dark:text-white mb-3">LEYENDA:</p>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <span className="flex items-center gap-1.5">
            <span>🟢</span>
            <span className="text-slate-600 dark:text-slate-300">Excelente (≥75%)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span>🟡</span>
            <span className="text-slate-600 dark:text-slate-300">Bueno (65-74%)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span>🟠</span>
            <span className="text-slate-600 dark:text-slate-300">Alerta (50-64%)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span>🔴</span>
            <span className="text-slate-600 dark:text-slate-300">Crítico (&lt;50%)</span>
          </span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          onClick={() => setFilterSemaforo(filterSemaforo === 'ROJO' ? 'ALL' : 'ROJO')}
          className={`p-4 rounded-xl border transition-all ${
            filterSemaforo === 'ROJO'
              ? 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700 ring-2 ring-red-500'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 hover:bg-red-100'
          }`}
        >
          <p className="text-3xl font-bold text-red-600">{counts.ROJO}</p>
          <p className="text-sm text-red-700 dark:text-red-400">Ciudades Críticas</p>
        </button>

        <button
          onClick={() => setFilterSemaforo(filterSemaforo === 'NARANJA' ? 'ALL' : 'NARANJA')}
          className={`p-4 rounded-xl border transition-all ${
            filterSemaforo === 'NARANJA'
              ? 'bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700 ring-2 ring-orange-500'
              : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 hover:bg-orange-100'
          }`}
        >
          <p className="text-3xl font-bold text-orange-600">{counts.NARANJA}</p>
          <p className="text-sm text-orange-700 dark:text-orange-400">En Alerta</p>
        </button>

        <button
          onClick={() => setFilterSemaforo(filterSemaforo === 'AMARILLO' ? 'ALL' : 'AMARILLO')}
          className={`p-4 rounded-xl border transition-all ${
            filterSemaforo === 'AMARILLO'
              ? 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700 ring-2 ring-yellow-500'
              : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 hover:bg-yellow-100'
          }`}
        >
          <p className="text-3xl font-bold text-yellow-600">{counts.AMARILLO}</p>
          <p className="text-sm text-yellow-700 dark:text-yellow-400">Buenas</p>
        </button>

        <button
          onClick={() => setFilterSemaforo(filterSemaforo === 'VERDE' ? 'ALL' : 'VERDE')}
          className={`p-4 rounded-xl border transition-all ${
            filterSemaforo === 'VERDE'
              ? 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700 ring-2 ring-emerald-500'
              : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
          }`}
        >
          <p className="text-3xl font-bold text-emerald-600">{counts.VERDE}</p>
          <p className="text-sm text-emerald-700 dark:text-emerald-400">Excelentes</p>
        </button>
      </div>

      {/* Search and Filter */}
      <div className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-700 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar ciudad o transportadora..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {filterSemaforo !== 'ALL' && (
            <button
              onClick={() => setFilterSemaforo('ALL')}
              className="px-4 py-2 bg-slate-100 dark:bg-navy-800 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors"
            >
              Mostrar todas
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="space-y-6">
        {/* Critical cities */}
        {groupedByColor.ROJO.length > 0 && (filterSemaforo === 'ALL' || filterSemaforo === 'ROJO') && (
          <div>
            <h3 className="text-lg font-bold text-red-700 dark:text-red-400 flex items-center gap-2 mb-3">
              🔴 Ciudades Críticas ({groupedByColor.ROJO.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupedByColor.ROJO.map((ciudad, idx) => (
                <CiudadCard key={`${ciudad.ciudad}-${ciudad.transportadora}-${idx}`} ciudad={ciudad} />
              ))}
            </div>
          </div>
        )}

        {/* Alert cities */}
        {groupedByColor.NARANJA.length > 0 && (filterSemaforo === 'ALL' || filterSemaforo === 'NARANJA') && (
          <div>
            <h3 className="text-lg font-bold text-orange-700 dark:text-orange-400 flex items-center gap-2 mb-3">
              🟠 Ciudades en Alerta ({groupedByColor.NARANJA.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupedByColor.NARANJA.map((ciudad, idx) => (
                <CiudadCard key={`${ciudad.ciudad}-${ciudad.transportadora}-${idx}`} ciudad={ciudad} />
              ))}
            </div>
          </div>
        )}

        {/* Good cities */}
        {groupedByColor.AMARILLO.length > 0 && (filterSemaforo === 'ALL' || filterSemaforo === 'AMARILLO') && (
          <div>
            <h3 className="text-lg font-bold text-yellow-700 dark:text-yellow-400 flex items-center gap-2 mb-3">
              🟡 Ciudades Buenas ({groupedByColor.AMARILLO.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupedByColor.AMARILLO.map((ciudad, idx) => (
                <CiudadCard key={`${ciudad.ciudad}-${ciudad.transportadora}-${idx}`} ciudad={ciudad} />
              ))}
            </div>
          </div>
        )}

        {/* Excellent cities */}
        {groupedByColor.VERDE.length > 0 && (filterSemaforo === 'ALL' || filterSemaforo === 'VERDE') && (
          <div>
            <h3 className="text-lg font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-2 mb-3">
              🟢 Ciudades Excelentes ({groupedByColor.VERDE.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupedByColor.VERDE.map((ciudad, idx) => (
                <CiudadCard key={`${ciudad.ciudad}-${ciudad.transportadora}-${idx}`} ciudad={ciudad} />
              ))}
            </div>
          </div>
        )}

        {filteredCiudades.length === 0 && (
          <div className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-700 p-12 text-center">
            <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No se encontraron ciudades con los filtros aplicados</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterSemaforo('ALL');
              }}
              className="mt-4 text-amber-500 hover:text-amber-600 font-medium"
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </div>

      {/* AI General Analysis */}
      {ciudades.length > 0 && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
              <Bot className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white mb-2">Análisis IA General</h3>
              <div className="text-sm text-slate-700 dark:text-slate-300 space-y-2">
                <p>
                  De <strong>{ciudades.length}</strong> rutas analizadas, <strong>{counts.ROJO}</strong> presentan
                  riesgo crítico (&gt;60% devolución). Se recomienda:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  {counts.ROJO > 0 && (
                    <li>
                      Exigir prepago para las {counts.ROJO} ciudades en rojo (zonas de muy alto riesgo)
                    </li>
                  )}
                  {ciudades.filter(c => c.semaforo === 'VERDE').length > 0 && (
                    <li>
                      Priorizar despachos a ciudades verdes para mejor flujo de caja
                    </li>
                  )}
                  <li>
                    Revisar transportadoras alternativas para rutas problemáticas
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SemaforoTabNew;
