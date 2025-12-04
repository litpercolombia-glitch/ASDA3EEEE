import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
  ChevronDown,
  ChevronUp,
  Eye,
  X,
  Zap,
  Target,
  Shield,
  AlertCircle,
  Package,
  Lightbulb,
  ArrowUpDown,
  FileText,
  Sparkles,
  Info,
} from 'lucide-react';
import { ExcelUploader } from '../excel/ExcelUploader';
import {
  CiudadSemaforo,
  SemaforoExcelData,
  SemaforoColor,
  STORAGE_KEYS,
  TasaEntregaRow,
  TiempoPromedioRow,
} from '../../types/logistics';
import { saveTabData, loadTabData } from '../../utils/tabStorage';

interface SemaforoTabNewProps {
  onDataLoaded?: (data: SemaforoExcelData) => void;
}

// Enhanced Semaforo Score calculation
interface SemaforoScoreResult {
  score: number;
  color: SemaforoColor;
  factors: {
    tasaEntrega: number;
    velocidad: number;
    volumen: number;
    consistencia: number;
  };
  recommendation: string;
}

const calculateSemaforoScore = (
  entregas: number,
  devoluciones: number,
  total: number,
  tiempoPromedio: number,
  volumenHistorico: number = total
): SemaforoScoreResult => {
  // Calculate base metrics
  const tasaEntrega = total > 0 ? (entregas / total) * 100 : 0;
  const tasaDevolucion = total > 0 ? (devoluciones / total) * 100 : 0;

  // Semaforo Score Formula (as per brief):
  // Score = (TasaEntrega × 0.40) + ((10 - TiempoPromedio) × 0.30) + (VolumenHistorico × 0.20) + (Consistencia × 0.10)

  // Factor 1: Tasa de entrega (40% weight)
  const tasaEntregaFactor = tasaEntrega * 0.40;

  // Factor 2: Velocidad - inverse of time, normalized to 0-100 (30% weight)
  const tiempoNormalizado = Math.max(0, Math.min(10, tiempoPromedio));
  const velocidadFactor = ((10 - tiempoNormalizado) / 10) * 100 * 0.30;

  // Factor 3: Volumen - confidence based on sample size (20% weight)
  const volumenNormalizado = Math.min(volumenHistorico / 100, 1.0) * 100;
  const volumenFactor = volumenNormalizado * 0.20;

  // Factor 4: Consistencia - placeholder for consistency metric (10% weight)
  // In real scenario, this would calculate month-over-month variance
  const consistenciaFactor = (tasaEntrega > 70 ? 80 : tasaEntrega > 50 ? 60 : 40) * 0.10;

  // Final score
  const score = Math.round(tasaEntregaFactor + velocidadFactor + volumenFactor + consistenciaFactor);

  // Determine color based on score
  let color: SemaforoColor;
  let recommendation: string;

  if (score >= 75) {
    color = 'VERDE';
    recommendation = 'Ruta excelente. Mantener operación actual. Ideal para contraentrega.';
  } else if (score >= 65) {
    color = 'AMARILLO';
    recommendation = 'Buen rendimiento. Monitorear tiempos de entrega. Contraentrega aceptable.';
  } else if (score >= 50) {
    color = 'NARANJA';
    recommendation = 'Alerta. Confirmar datos del cliente antes de enviar. Considerar prepago.';
  } else {
    color = 'ROJO';
    recommendation = 'Ruta crítica. Exigir PREPAGO obligatorio o cambiar transportadora.';
  }

  // Add specific recommendations based on factors
  if (tiempoPromedio > 7) {
    recommendation += ` Tiempo de entrega alto (${tiempoPromedio.toFixed(1)} días).`;
  }
  if (total < 10) {
    recommendation += ' Muestra estadística limitada.';
  }
  if (tasaDevolucion > 30) {
    recommendation += ` Alta tasa de devolución (${tasaDevolucion.toFixed(0)}%).`;
  }

  return {
    score,
    color,
    factors: {
      tasaEntrega: Math.round(tasaEntregaFactor),
      velocidad: Math.round(velocidadFactor),
      volumen: Math.round(volumenFactor),
      consistencia: Math.round(consistenciaFactor),
    },
    recommendation,
  };
};

// Process Excel data with enhanced scoring
const procesarExcelConScore = (data: SemaforoExcelData): (CiudadSemaforo & { score: number; factors: SemaforoScoreResult['factors'] })[] => {
  const tiemposMap = new Map<string, number>();

  // Build time lookup
  data.tiempoPromedio.forEach((row) => {
    const key = `${row.ciudad.toUpperCase()}-${row.transportadora.toUpperCase()}`;
    tiemposMap.set(key, row.dias);
  });

  // Process each delivery rate row
  const results = data.tasaEntregas.map((row) => {
    const key = `${row.ciudad.toUpperCase()}-${row.transportadora.toUpperCase()}`;
    const tiempoPromedio = tiemposMap.get(key) || 5;

    const scoreResult = calculateSemaforoScore(
      row.entregas,
      row.devoluciones,
      row.total,
      tiempoPromedio,
      row.total
    );

    return {
      ciudad: row.ciudad,
      transportadora: row.transportadora,
      entregas: row.entregas,
      devoluciones: row.devoluciones,
      total: row.total,
      tasaExito: row.total > 0 ? (row.entregas / row.total) * 100 : 0,
      tasaDevolucion: row.total > 0 ? (row.devoluciones / row.total) * 100 : 0,
      tiempoPromedio,
      semaforo: scoreResult.color,
      recomendacionIA: scoreResult.recommendation,
      score: scoreResult.score,
      factors: scoreResult.factors,
    };
  });

  // Sort by score descending
  return results.sort((a, b) => b.score - a.score);
};

// City detail modal component
interface CityDetailModalProps {
  ciudad: CiudadSemaforo & { score: number; factors: SemaforoScoreResult['factors'] };
  onClose: () => void;
}

const CityDetailModal: React.FC<CityDetailModalProps> = ({ ciudad, onClose }) => {
  const colorConfig = {
    VERDE: { bg: 'bg-emerald-500', text: 'text-emerald-700', light: 'bg-emerald-100' },
    AMARILLO: { bg: 'bg-yellow-500', text: 'text-yellow-700', light: 'bg-yellow-100' },
    NARANJA: { bg: 'bg-orange-500', text: 'text-orange-700', light: 'bg-orange-100' },
    ROJO: { bg: 'bg-red-500', text: 'text-red-700', light: 'bg-red-100' },
  };

  const config = colorConfig[ciudad.semaforo];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-navy-900 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className={`${config.bg} px-6 py-4 text-white`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                {ciudad.ciudad}
              </h3>
              <p className="text-white/80 text-sm flex items-center gap-1">
                <Truck className="w-4 h-4" />
                {ciudad.transportadora}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Score display */}
          <div className="text-center">
            <div className={`inline-flex items-center justify-center w-24 h-24 ${config.bg} rounded-full text-white`}>
              <div>
                <p className="text-3xl font-bold">{ciudad.score}</p>
                <p className="text-xs">SCORE</p>
              </div>
            </div>
          </div>

          {/* Score breakdown */}
          <div className="bg-slate-50 dark:bg-navy-950 rounded-xl p-4">
            <h4 className="font-bold text-slate-700 dark:text-white text-sm mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Desglose del Score
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Tasa de Entrega (40%)</span>
                <span className="font-bold text-emerald-600">{ciudad.factors.tasaEntrega} pts</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Velocidad (30%)</span>
                <span className="font-bold text-blue-600">{ciudad.factors.velocidad} pts</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Volumen (20%)</span>
                <span className="font-bold text-purple-600">{ciudad.factors.volumen} pts</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Consistencia (10%)</span>
                <span className="font-bold text-amber-600">{ciudad.factors.consistencia} pts</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-emerald-600">{ciudad.entregas}</p>
              <p className="text-xs text-slate-500">Entregas exitosas</p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-red-600">{ciudad.devoluciones}</p>
              <p className="text-xs text-slate-500">Devoluciones</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{ciudad.tiempoPromedio}d</p>
              <p className="text-xs text-slate-500">Tiempo promedio</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-slate-700 dark:text-white">{ciudad.total}</p>
              <p className="text-xs text-slate-500">Total envíos</p>
            </div>
          </div>

          {/* AI Recommendation */}
          <div className={`${config.light} dark:bg-opacity-20 rounded-xl p-4 border border-${ciudad.semaforo === 'VERDE' ? 'emerald' : ciudad.semaforo === 'AMARILLO' ? 'yellow' : ciudad.semaforo === 'NARANJA' ? 'orange' : 'red'}-200 dark:border-opacity-30`}>
            <div className="flex items-start gap-2">
              <Bot className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-bold text-slate-700 dark:text-white text-sm mb-1">Recomendación IA</p>
                <p className="text-sm text-slate-600 dark:text-slate-300">{ciudad.recomendacionIA}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Insights panel component
interface InsightsPanelProps {
  ciudades: (CiudadSemaforo & { score: number })[];
}

const InsightsPanel: React.FC<InsightsPanelProps> = ({ ciudades }) => {
  const insights = useMemo(() => {
    const result: { type: 'warning' | 'success' | 'info' | 'strategy'; icon: string; title: string; message: string }[] = [];

    // Critical routes
    const critical = ciudades.filter(c => c.semaforo === 'ROJO');
    if (critical.length > 0) {
      result.push({
        type: 'warning',
        icon: '⚠️',
        title: 'Rutas Críticas Detectadas',
        message: `${critical.length} rutas tienen alto riesgo de devolución. Ciudades: ${critical.slice(0, 3).map(c => c.ciudad).join(', ')}${critical.length > 3 ? ` y ${critical.length - 3} más` : ''}`,
      });
    }

    // Top performers
    const topPerformers = ciudades.filter(c => c.semaforo === 'VERDE').slice(0, 3);
    if (topPerformers.length > 0) {
      result.push({
        type: 'success',
        icon: '✅',
        title: 'Rutas Óptimas',
        message: `Las mejores opciones son: ${topPerformers.map(c => `${c.ciudad} (${c.transportadora})`).join(', ')}`,
      });
    }

    // Low volume routes
    const lowVolume = ciudades.filter(c => c.total < 10);
    if (lowVolume.length > 0) {
      result.push({
        type: 'info',
        icon: '📊',
        title: 'Muestra Limitada',
        message: `${lowVolume.length} rutas tienen menos de 10 envíos históricos. Los resultados pueden variar.`,
      });
    }

    // Strategy recommendation
    const avgScore = ciudades.reduce((sum, c) => sum + c.score, 0) / ciudades.length;
    result.push({
      type: 'strategy',
      icon: '🎯',
      title: 'Estrategia Recomendada',
      message: avgScore >= 70
        ? `Score promedio: ${avgScore.toFixed(1)}/100. Tu red logística está optimizada. Mantén estas rutas.`
        : `Score promedio: ${avgScore.toFixed(1)}/100. Considera renegociar con transportadoras de bajo rendimiento.`,
    });

    return result;
  }, [ciudades]);

  const typeConfig = {
    warning: { bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800', text: 'text-red-700 dark:text-red-400' },
    success: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800', text: 'text-emerald-700 dark:text-emerald-400' },
    info: { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', text: 'text-blue-700 dark:text-blue-400' },
    strategy: { bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-800', text: 'text-purple-700 dark:text-purple-400' },
  };

  return (
    <div className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-700 p-4">
      <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
        <Zap className="w-5 h-5 text-purple-500" />
        Análisis Predictivo IA
        <Sparkles className="w-4 h-4 text-yellow-500" />
      </h3>
      <div className="space-y-3">
        {insights.map((insight, idx) => {
          const config = typeConfig[insight.type];
          return (
            <div
              key={idx}
              className={`${config.bg} ${config.border} border rounded-lg p-3`}
            >
              <p className={`font-bold text-sm ${config.text} flex items-center gap-2`}>
                <span>{insight.icon}</span>
                {insight.title}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{insight.message}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Main component
export const SemaforoTabNew: React.FC<SemaforoTabNewProps> = ({ onDataLoaded }) => {
  const [excelData, setExcelData] = useState<SemaforoExcelData | null>(null);
  const [ciudades, setCiudades] = useState<(CiudadSemaforo & { score: number; factors: SemaforoScoreResult['factors'] })[]>([]);
  const [lastUpload, setLastUpload] = useState<Date | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterSemaforo, setFilterSemaforo] = useState<SemaforoColor | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState<'score' | 'tasaExito' | 'total' | 'tiempoPromedio'>('score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [selectedCiudad, setSelectedCiudad] = useState<(CiudadSemaforo & { score: number; factors: SemaforoScoreResult['factors'] }) | null>(null);
  const [showTable, setShowTable] = useState(true);

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

      const processed = procesarExcelConScore(saved.data);
      setCiudades(processed);
    }
  }, []);

  // Handle Excel data loaded
  const handleDataLoaded = (data: SemaforoExcelData) => {
    setExcelData(data);
    setLastUpload(new Date());
    setFileName('datos_cargados.xlsx');

    // Process data with score calculation
    const processed = procesarExcelConScore(data);
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
    const c = { VERDE: 0, AMARILLO: 0, NARANJA: 0, ROJO: 0, total: 0 };
    ciudades.forEach((ciudad) => {
      c[ciudad.semaforo]++;
      c.total++;
    });
    return c;
  }, [ciudades]);

  // Filter and sort cities
  const filteredCiudades = useMemo(() => {
    let result = ciudades.filter((c) => {
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

    // Sort
    result.sort((a, b) => {
      let valueA: number, valueB: number;
      switch (sortBy) {
        case 'score':
          valueA = a.score;
          valueB = b.score;
          break;
        case 'tasaExito':
          valueA = a.tasaExito;
          valueB = b.tasaExito;
          break;
        case 'total':
          valueA = a.total;
          valueB = b.total;
          break;
        case 'tiempoPromedio':
          valueA = a.tiempoPromedio;
          valueB = b.tiempoPromedio;
          break;
        default:
          valueA = a.score;
          valueB = b.score;
      }
      return sortOrder === 'desc' ? valueB - valueA : valueA - valueB;
    });

    return result;
  }, [ciudades, searchQuery, filterSemaforo, sortBy, sortOrder]);

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

  // Toggle sort
  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  // Color config
  const semaforoConfig = {
    VERDE: { emoji: '🟢', label: 'Recomendado', bg: 'bg-emerald-500', light: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400' },
    AMARILLO: { emoji: '🟡', label: 'Con reservas', bg: 'bg-yellow-500', light: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400' },
    NARANJA: { emoji: '🟠', label: 'Alerta', bg: 'bg-orange-500', light: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400' },
    ROJO: { emoji: '🔴', label: 'No recomendado', bg: 'bg-red-500', light: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400' },
  };

  // If no data, show upload screen
  if (!excelData) {
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Activity className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
            Semáforo de Ciudades
          </h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Sistema inteligente de clasificación de rutas logísticas basado en datos históricos masivos
          </p>
        </div>

        <ExcelUploader pestaña="semaforo" onDataLoaded={handleDataLoaded} />

        {/* Feature highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="bg-white dark:bg-navy-900 rounded-xl p-4 border border-slate-200 dark:border-navy-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                <Target className="w-5 h-5 text-emerald-600" />
              </div>
              <h4 className="font-bold text-slate-700 dark:text-white">Semáforo Score</h4>
            </div>
            <p className="text-sm text-slate-500">
              Algoritmo avanzado que pondera tasa de éxito, velocidad, volumen y consistencia
            </p>
          </div>

          <div className="bg-white dark:bg-navy-900 rounded-xl p-4 border border-slate-200 dark:border-navy-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Bot className="w-5 h-5 text-purple-600" />
              </div>
              <h4 className="font-bold text-slate-700 dark:text-white">Insights IA</h4>
            </div>
            <p className="text-sm text-slate-500">
              Recomendaciones automáticas basadas en análisis de patrones históricos
            </p>
          </div>

          <div className="bg-white dark:bg-navy-900 rounded-xl p-4 border border-slate-200 dark:border-navy-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
              <h4 className="font-bold text-slate-700 dark:text-white">Protección</h4>
            </div>
            <p className="text-sm text-slate-500">
              Identifica rutas problemáticas para evitar pérdidas por devoluciones
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Data loaded view
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 rounded-2xl p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Activity className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                Semáforo de Ciudades
                <Sparkles className="w-5 h-5 text-yellow-300" />
              </h2>
              <div className="flex items-center gap-3 text-amber-100 text-sm mt-1">
                <span className="flex items-center gap-1">
                  <FileSpreadsheet className="w-4 h-4" />
                  {fileName}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {lastUpload?.toLocaleDateString('es-CO')}
                </span>
                <span className="flex items-center gap-1">
                  <Package className="w-4 h-4" />
                  {counts.total} rutas
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setExcelData(null)}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors text-sm font-bold"
            >
              <RefreshCw className="w-4 h-4" />
              Nuevo Excel
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <button
          onClick={() => setFilterSemaforo('ALL')}
          className={`p-4 rounded-xl border transition-all text-left ${
            filterSemaforo === 'ALL'
              ? 'bg-slate-100 dark:bg-slate-800 border-slate-400 ring-2 ring-slate-500'
              : 'bg-white dark:bg-navy-900 border-slate-200 dark:border-navy-700 hover:bg-slate-50'
          }`}
        >
          <p className="text-3xl font-bold text-slate-700 dark:text-white">{counts.total}</p>
          <p className="text-sm text-slate-500">Total Rutas</p>
        </button>

        {(['VERDE', 'AMARILLO', 'NARANJA', 'ROJO'] as const).map((color) => {
          const config = semaforoConfig[color];
          return (
            <button
              key={color}
              onClick={() => setFilterSemaforo(filterSemaforo === color ? 'ALL' : color)}
              className={`p-4 rounded-xl border transition-all text-left ${
                filterSemaforo === color
                  ? `${config.light} border-current ring-2`
                  : `bg-white dark:bg-navy-900 border-slate-200 dark:border-navy-700 hover:${config.light}`
              }`}
            >
              <p className={`text-3xl font-bold ${config.text}`}>{counts[color]}</p>
              <p className="text-sm text-slate-500 flex items-center gap-1">
                {config.emoji} {config.label}
              </p>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-700 p-4">
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <span className="font-bold text-slate-700 dark:text-white">LEYENDA:</span>
          <span className="flex items-center gap-1.5">🟢 <span className="text-slate-600 dark:text-slate-300">Score ≥75 (Excelente)</span></span>
          <span className="flex items-center gap-1.5">🟡 <span className="text-slate-600 dark:text-slate-300">Score 65-74 (Bueno)</span></span>
          <span className="flex items-center gap-1.5">🟠 <span className="text-slate-600 dark:text-slate-300">Score 50-64 (Alerta)</span></span>
          <span className="flex items-center gap-1.5">🔴 <span className="text-slate-600 dark:text-slate-300">Score &lt;50 (Crítico)</span></span>
        </div>
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

          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-4 py-2.5 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="score">Ordenar por Score</option>
              <option value="tasaExito">Ordenar por Tasa Éxito</option>
              <option value="total">Ordenar por Volumen</option>
              <option value="tiempoPromedio">Ordenar por Tiempo</option>
            </select>

            <button
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="p-2.5 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
            >
              {sortOrder === 'desc' ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
            </button>

            {filterSemaforo !== 'ALL' && (
              <button
                onClick={() => setFilterSemaforo('ALL')}
                className="px-4 py-2.5 bg-slate-100 dark:bg-navy-800 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors"
              >
                Mostrar todas
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-navy-950">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">Ciudad</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">Transportadora</th>
                <th
                  className="px-4 py-3 text-center text-xs font-bold uppercase text-slate-500 cursor-pointer hover:text-amber-600"
                  onClick={() => handleSort('score')}
                >
                  <span className="flex items-center justify-center gap-1">
                    Score
                    <ArrowUpDown className="w-3 h-3" />
                  </span>
                </th>
                <th
                  className="px-4 py-3 text-center text-xs font-bold uppercase text-slate-500 cursor-pointer hover:text-amber-600"
                  onClick={() => handleSort('tasaExito')}
                >
                  <span className="flex items-center justify-center gap-1">
                    Tasa Éxito
                    <ArrowUpDown className="w-3 h-3" />
                  </span>
                </th>
                <th
                  className="px-4 py-3 text-center text-xs font-bold uppercase text-slate-500 cursor-pointer hover:text-amber-600"
                  onClick={() => handleSort('tiempoPromedio')}
                >
                  <span className="flex items-center justify-center gap-1">
                    Tiempo
                    <ArrowUpDown className="w-3 h-3" />
                  </span>
                </th>
                <th
                  className="px-4 py-3 text-center text-xs font-bold uppercase text-slate-500 cursor-pointer hover:text-amber-600"
                  onClick={() => handleSort('total')}
                >
                  <span className="flex items-center justify-center gap-1">
                    Envíos
                    <ArrowUpDown className="w-3 h-3" />
                  </span>
                </th>
                <th className="px-4 py-3 text-center text-xs font-bold uppercase text-slate-500">Estado</th>
                <th className="px-4 py-3 text-center text-xs font-bold uppercase text-slate-500">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
              {filteredCiudades.map((ciudad, idx) => {
                const config = semaforoConfig[ciudad.semaforo];
                return (
                  <tr
                    key={`${ciudad.ciudad}-${ciudad.transportadora}-${idx}`}
                    className={`${config.light} hover:shadow-md transition-all`}
                  >
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-800 dark:text-white">{ciudad.ciudad}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {ciudad.transportadora}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center justify-center w-12 h-8 ${config.bg} text-white font-bold rounded-lg text-sm`}>
                        {ciudad.score}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-bold ${config.text}`}>{ciudad.tasaExito.toFixed(0)}%</span>
                    </td>
                    <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-400">
                      {ciudad.tiempoPromedio}d
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-slate-600 dark:text-slate-400">{ciudad.total}</span>
                      {ciudad.total < 10 && (
                        <span className="text-orange-500 text-xs ml-1" title="Muestra limitada">⚠️</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="flex items-center justify-center gap-1">
                        {config.emoji}
                        <span className={`text-xs font-bold ${config.text}`}>{config.label}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setSelectedCiudad(ciudad)}
                        className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        Ver
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredCiudades.length === 0 && (
          <div className="p-12 text-center">
            <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No se encontraron rutas con los filtros aplicados</p>
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

      {/* AI Insights Panel */}
      {ciudades.length > 0 && <InsightsPanel ciudades={ciudades} />}

      {/* City Detail Modal */}
      {selectedCiudad && (
        <CityDetailModal
          ciudad={selectedCiudad}
          onClose={() => setSelectedCiudad(null)}
        />
      )}
    </div>
  );
};

export default SemaforoTabNew;
