import React, { useState, useMemo, useEffect } from 'react';
import {
  Target,
  Search,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle,
  Bot,
  FileSpreadsheet,
  Truck,
  MapPin,
  BarChart3,
  Percent,
  Clock,
  Package,
  RefreshCw,
  ChevronRight,
  Lightbulb,
  Shield,
  XCircle,
  Activity,
} from 'lucide-react';
import { Shipment, ShipmentStatus, CarrierName } from '../../types';
import {
  AnalisisPrediccion,
  PatronDetectado,
  CiudadSemaforo,
  SemaforoExcelData,
  STORAGE_KEYS,
} from '../../types/logistics';
import {
  detectarPatrones,
  generarPrediccion,
  procesarExcelParaSemaforo,
} from '../../utils/patternDetection';
import { loadTabData } from '../../utils/tabStorage';

interface PrediccionesTabProps {
  shipments: Shipment[];
}

const TendenciaBadge: React.FC<{ tendencia: AnalisisPrediccion['tendencia'] }> = ({ tendencia }) => {
  const config = {
    MEJORANDO: {
      icon: TrendingUp,
      bg: 'bg-emerald-100 dark:bg-emerald-900/30',
      text: 'text-emerald-700 dark:text-emerald-400',
      label: 'Mejorando',
    },
    ESTABLE: {
      icon: Minus,
      bg: 'bg-slate-100 dark:bg-slate-800',
      text: 'text-slate-700 dark:text-slate-400',
      label: 'Estable',
    },
    EMPEORANDO: {
      icon: TrendingDown,
      bg: 'bg-red-100 dark:bg-red-900/30',
      text: 'text-red-700 dark:text-red-400',
      label: 'Empeorando',
    },
  };

  const c = config[tendencia];
  const Icon = c.icon;

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${c.bg}`}>
      <Icon className={`w-4 h-4 ${c.text}`} />
      <span className={`text-xs font-bold ${c.text}`}>{c.label}</span>
    </div>
  );
};

const PatronCard: React.FC<{ patron: PatronDetectado; onClick?: () => void }> = ({
  patron,
  onClick,
}) => {
  const impactColors = {
    CRITICO: 'border-l-red-500 bg-red-50/50 dark:bg-red-900/10',
    ALTO: 'border-l-orange-500 bg-orange-50/50 dark:bg-orange-900/10',
    MEDIO: 'border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-900/10',
    BAJO: 'border-l-green-500 bg-green-50/50 dark:bg-green-900/10',
  };

  const impactIcons = {
    CRITICO: '🔴',
    ALTO: '🟠',
    MEDIO: '🟡',
    BAJO: '🟢',
  };

  return (
    <div
      className={`bg-white dark:bg-navy-900 rounded-xl border-l-4 ${impactColors[patron.impacto]} border border-slate-200 dark:border-navy-700 p-4 cursor-pointer hover:shadow-md transition-all`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{impactIcons[patron.impacto]}</span>
          <h4 className="font-bold text-slate-800 dark:text-white">{patron.titulo}</h4>
        </div>
        <span
          className={`text-xs font-bold px-2 py-1 rounded ${
            patron.impacto === 'CRITICO'
              ? 'bg-red-100 text-red-700'
              : patron.impacto === 'ALTO'
                ? 'bg-orange-100 text-orange-700'
                : patron.impacto === 'MEDIO'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-green-100 text-green-700'
          }`}
        >
          {patron.impacto}
        </span>
      </div>

      <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{patron.descripcion}</p>

      <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
        <span className="flex items-center gap-1">
          <Package className="w-3 h-3" />
          {patron.datosApoyo.cantidad} guías
        </span>
        <span className="flex items-center gap-1">
          <Percent className="w-3 h-3" />
          {patron.datosApoyo.porcentaje.toFixed(1)}% del total
        </span>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-100 dark:border-blue-800">
        <div className="flex items-start gap-2">
          <Lightbulb className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-blue-800 dark:text-blue-300">{patron.recomendacion}</p>
        </div>
      </div>
    </div>
  );
};

const PrediccionCard: React.FC<{ prediccion: AnalisisPrediccion }> = ({ prediccion }) => {
  const riskColor =
    prediccion.probabilidadExito >= 80
      ? 'text-emerald-500'
      : prediccion.probabilidadExito >= 60
        ? 'text-yellow-500'
        : 'text-red-500';

  return (
    <div className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-700 p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <MapPin className="w-4 h-4 text-slate-400" />
            {prediccion.ciudad}
          </h4>
          <p className="text-sm text-slate-500 flex items-center gap-1">
            <Truck className="w-3 h-3" />
            {prediccion.transportadora}
          </p>
        </div>
        <TendenciaBadge tendencia={prediccion.tendencia} />
      </div>

      {/* Probability meter */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-slate-500">Probabilidad de éxito</span>
          <span className={`text-lg font-bold ${riskColor}`}>
            {prediccion.probabilidadExito.toFixed(0)}%
          </span>
        </div>
        <div className="w-full h-2 bg-slate-200 dark:bg-navy-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              prediccion.probabilidadExito >= 80
                ? 'bg-emerald-500'
                : prediccion.probabilidadExito >= 60
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
            }`}
            style={{ width: `${prediccion.probabilidadExito}%` }}
          />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-slate-50 dark:bg-navy-950 rounded-lg p-2 text-center">
          <p className="text-xs text-slate-500">Guías Activas</p>
          <p className="text-lg font-bold text-slate-800 dark:text-white">{prediccion.guiasActivas}</p>
        </div>
        <div className="bg-slate-50 dark:bg-navy-950 rounded-lg p-2 text-center">
          <p className="text-xs text-slate-500">Retrasadas</p>
          <p className={`text-lg font-bold ${prediccion.guiasRetrasadas > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
            {prediccion.guiasRetrasadas}
          </p>
        </div>
        <div className="bg-slate-50 dark:bg-navy-950 rounded-lg p-2 text-center">
          <p className="text-xs text-slate-500">Éxito Histórico</p>
          <p className="text-lg font-bold text-blue-600">{prediccion.tasaExitoHistorica.toFixed(0)}%</p>
        </div>
        <div className="bg-slate-50 dark:bg-navy-950 rounded-lg p-2 text-center">
          <p className="text-xs text-slate-500">Tiempo Est.</p>
          <p className="text-lg font-bold text-purple-600">{prediccion.tiempoEstimado}d</p>
        </div>
      </div>

      {/* Recommendations */}
      {prediccion.recomendaciones.length > 0 && (
        <div className="space-y-1">
          {prediccion.recomendaciones.map((rec, idx) => (
            <p key={idx} className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-1">
              <ChevronRight className="w-3 h-3 mt-0.5 flex-shrink-0 text-amber-500" />
              {rec}
            </p>
          ))}
        </div>
      )}
    </div>
  );
};

export const PrediccionesTab: React.FC<PrediccionesTabProps> = ({ shipments }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCity, setSearchCity] = useState('');
  const [searchCarrier, setSearchCarrier] = useState<CarrierName | ''>('');
  const [semaforoData, setSemaforoData] = useState<CiudadSemaforo[]>([]);
  const [hasHistoricalData, setHasHistoricalData] = useState(false);

  // Load semaforo data for historical comparison
  useEffect(() => {
    const saved = loadTabData<{
      data: SemaforoExcelData;
      uploadDate: string;
      fileName: string;
    } | null>(STORAGE_KEYS.SEMAFORO, null);

    if (saved?.data) {
      const processed = procesarExcelParaSemaforo(saved.data);
      setSemaforoData(processed);
      setHasHistoricalData(true);
    }
  }, []);

  // Detect patterns
  const patrones = useMemo(() => {
    return detectarPatrones(shipments);
  }, [shipments]);

  // Get unique cities and carriers from shipments
  const { cities, carriers } = useMemo(() => {
    const citySet = new Set<string>();
    const carrierSet = new Set<CarrierName>();

    shipments.forEach((s) => {
      if (s.detailedInfo?.destination) {
        citySet.add(s.detailedInfo.destination.toUpperCase());
      }
      if (s.carrier !== CarrierName.UNKNOWN) {
        carrierSet.add(s.carrier);
      }
    });

    // Also add cities from semaforo data
    semaforoData.forEach((c) => {
      citySet.add(c.ciudad.toUpperCase());
    });

    return {
      cities: Array.from(citySet).sort(),
      carriers: Array.from(carrierSet),
    };
  }, [shipments, semaforoData]);

  // Generate prediction when search is triggered
  const [currentPrediction, setCurrentPrediction] = useState<AnalisisPrediccion | null>(null);

  const handlePredict = () => {
    if (!searchCity || !searchCarrier) return;

    const historico = semaforoData.find(
      (c) =>
        c.ciudad.toUpperCase() === searchCity.toUpperCase() &&
        c.transportadora.toUpperCase() === searchCarrier.toUpperCase()
    );

    const prediction = generarPrediccion(searchCity, searchCarrier, shipments, historico);
    setCurrentPrediction(prediction);
  };

  // Best combinations
  const mejoresCombinaciones = useMemo(() => {
    return semaforoData
      .filter((c) => c.semaforo === 'VERDE')
      .sort((a, b) => b.tasaExito - a.tasaExito)
      .slice(0, 5);
  }, [semaforoData]);

  // Worst combinations (problematic routes)
  const rutasProblematicas = useMemo(() => {
    return semaforoData
      .filter((c) => c.semaforo === 'ROJO')
      .sort((a, b) => a.tasaExito - b.tasaExito)
      .slice(0, 5);
  }, [semaforoData]);

  if (shipments.length === 0 && !hasHistoricalData) {
    return (
      <div className="bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-700 p-12 text-center">
        <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <Target className="w-10 h-10 text-purple-500" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
          Sin datos para predecir
        </h3>
        <p className="text-slate-500 dark:text-slate-400 mb-4 max-w-md mx-auto">
          Carga guías en la pestaña de Seguimiento o un Excel histórico en Semáforo para ver predicciones.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
          <Target className="w-8 h-8 text-purple-500" />
          Predicciones IA
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Análisis predictivo basado en datos actuales e históricos
        </p>
      </div>

      {/* Data sources */}
      <div className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-700 p-4">
        <h3 className="font-bold text-slate-700 dark:text-white text-sm mb-3 flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          FUENTES DE DATOS
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-center gap-3 bg-slate-50 dark:bg-navy-950 rounded-lg p-3">
            {shipments.length > 0 ? (
              <CheckCircle className="w-5 h-5 text-emerald-500" />
            ) : (
              <XCircle className="w-5 h-5 text-slate-400" />
            )}
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-white">
                {shipments.length} guías rastreadas (tiempo real)
              </p>
              <p className="text-xs text-slate-500">Datos de Seguimiento</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-50 dark:bg-navy-950 rounded-lg p-3">
            {hasHistoricalData ? (
              <CheckCircle className="w-5 h-5 text-emerald-500" />
            ) : (
              <XCircle className="w-5 h-5 text-slate-400" />
            )}
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-white">
                {hasHistoricalData ? `${semaforoData.length} rutas históricas` : 'Sin datos históricos'}
              </p>
              <p className="text-xs text-slate-500">Datos de Semáforo</p>
            </div>
          </div>
        </div>
      </div>

      {/* Prediction search */}
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl border border-purple-200 dark:border-purple-800 p-6">
        <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-purple-500" />
          Analizar Nueva Ruta
        </h3>

        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <label className="text-xs text-slate-500 mb-1 block">Ciudad</label>
            <select
              value={searchCity}
              onChange={(e) => setSearchCity(e.target.value)}
              className="w-full px-4 py-2.5 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Seleccionar ciudad...</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="text-xs text-slate-500 mb-1 block">Transportadora</label>
            <select
              value={searchCarrier}
              onChange={(e) => setSearchCarrier(e.target.value as CarrierName)}
              className="w-full px-4 py-2.5 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Seleccionar transportadora...</option>
              {carriers.map((carrier) => (
                <option key={carrier} value={carrier}>
                  {carrier}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handlePredict}
              disabled={!searchCity || !searchCarrier}
              className="px-6 py-2.5 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <Target className="w-4 h-4" />
              Predecir
            </button>
          </div>
        </div>

        {currentPrediction && (
          <div className="mt-4">
            <PrediccionCard prediccion={currentPrediction} />
          </div>
        )}
      </div>

      {/* Detected patterns */}
      {patrones.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Patrones Detectados ({patrones.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {patrones.map((patron) => (
              <PatronCard key={patron.id} patron={patron} />
            ))}
          </div>
        </div>
      )}

      {/* Best and worst routes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Problematic routes */}
        {rutasProblematicas.length > 0 && (
          <div>
            <h3 className="text-lg font-bold text-red-700 dark:text-red-400 mb-3 flex items-center gap-2">
              🔴 Rutas con Problemas Recurrentes
            </h3>
            <div className="space-y-2">
              {rutasProblematicas.map((ruta, idx) => (
                <div
                  key={`${ruta.ciudad}-${ruta.transportadora}-${idx}`}
                  className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-200 dark:border-red-800"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-white">
                        {ruta.ciudad} - {ruta.transportadora}
                      </p>
                      <p className="text-xs text-slate-500">
                        {ruta.tasaDevolucion.toFixed(0)}% devolución • {ruta.tiempoPromedio}d promedio
                      </p>
                    </div>
                    <span className="text-lg font-bold text-red-600">{ruta.tasaExito.toFixed(0)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Best routes */}
        {mejoresCombinaciones.length > 0 && (
          <div>
            <h3 className="text-lg font-bold text-emerald-700 dark:text-emerald-400 mb-3 flex items-center gap-2">
              ✅ Mejores Combinaciones
            </h3>
            <div className="space-y-2">
              {mejoresCombinaciones.map((ruta, idx) => (
                <div
                  key={`${ruta.ciudad}-${ruta.transportadora}-${idx}`}
                  className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3 border border-emerald-200 dark:border-emerald-800"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-white">
                        {ruta.ciudad} - {ruta.transportadora}
                      </p>
                      <p className="text-xs text-slate-500">
                        {ruta.total} envíos • {ruta.tiempoPromedio}d promedio
                      </p>
                    </div>
                    <span className="text-lg font-bold text-emerald-600">{ruta.tasaExito.toFixed(0)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Global recommendations */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-6">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
            <Bot className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white mb-2">
              Recomendaciones Globales
            </h3>
            <div className="text-sm text-slate-700 dark:text-slate-300 space-y-2">
              <ul className="list-disc list-inside space-y-1 ml-2">
                {rutasProblematicas.length > 0 && (
                  <li>
                    Evitar contraentrega en zonas rojas ({rutasProblematicas.map((r) => r.ciudad).join(', ')}). Exigir prepago.
                  </li>
                )}
                {mejoresCombinaciones.length > 0 && (
                  <li>
                    {mejoresCombinaciones[0].transportadora} tiene el mejor rendimiento general (
                    {mejoresCombinaciones[0].tasaExito.toFixed(0)}% éxito).
                  </li>
                )}
                {patrones.filter((p) => p.tipo === 'RETRASO').length > 0 && (
                  <li>
                    Guías sin movimiento &gt;48h tienen 60% probabilidad de devolución. Contactar proactivamente.
                  </li>
                )}
                <li>
                  Priorizar despachos inicio de semana para mejor rendimiento.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrediccionesTab;
