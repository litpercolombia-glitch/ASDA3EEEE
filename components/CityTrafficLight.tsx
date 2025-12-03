import React, { useState } from 'react';
import { useExcelParser } from '../hooks/useExcelParser';
import { HistoricalData, CarrierPerformance } from '../types';
import { Button } from './ui/Button';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { Upload, Download, MapPin, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

interface CityTrafficLightProps {
  onBack?: () => void;
}

interface CityMetrics {
  city: string;
  carriers: CarrierPerformance[];
  overallSuccessRate: number;
  overallReturnRate: number;
  totalShipments: number;
  avgDeliveryTime: number;
  classification: 'excellent' | 'good' | 'warning' | 'critical';
  recommendations: string[];
}

export function CityTrafficLight({ onBack }: CityTrafficLightProps) {
  const [historicalData, setHistoricalData] = useState<HistoricalData | null>(() => {
    const saved = localStorage.getItem('historical_logistics_data');
    return saved ? JSON.parse(saved) : null;
  });

  const [selectedCity, setSelectedCity] = useState<string>('');
  const { parseExcelFile, isLoading, parseResult, reset } = useExcelParser();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const result = await parseExcelFile(file);

    if (result.success && result.data) {
      setHistoricalData(result.data);
      localStorage.setItem('historical_logistics_data', JSON.stringify(result.data));
    }
  };

  const cities = historicalData ? Object.keys(historicalData).sort() : [];

  // Calcular métricas de la ciudad seleccionada
  const cityMetrics: CityMetrics | null = selectedCity && historicalData?.[selectedCity]
    ? calculateCityMetrics(selectedCity, historicalData[selectedCity])
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                🚦 Semáforo de Ciudad
              </h1>
              <p className="text-gray-600">
                Análisis de rendimiento logístico por ciudad
              </p>
            </div>
            {onBack && (
              <Button onClick={onBack} variant="secondary">
                ← Volver
              </Button>
            )}
          </div>
        </div>

        {/* Upload Section */}
        {!historicalData && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
              <Upload className="w-16 h-16 text-blue-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-700 mb-2">
                Sube tu archivo Excel con datos logísticos
              </h3>
              <p className="text-gray-500 mb-6">
                El sistema analizará automáticamente las tasas de entrega y devolución
              </p>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload-traffic"
                disabled={isLoading}
              />
              <label htmlFor="file-upload-traffic">
                <Button
                  as="span"
                  variant="primary"
                  icon={isLoading ? <LoadingSpinner size="sm" /> : <Upload className="w-4 h-4" />}
                  disabled={isLoading}
                >
                  {isLoading ? 'Procesando...' : 'Seleccionar Archivo'}
                </Button>
              </label>

              <div className="mt-6">
                <button
                  onClick={() => {
                    const { generateExcelTemplate } = require('../hooks/useExcelParser');
                    generateExcelTemplate();
                  }}
                  className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2 mx-auto"
                >
                  <Download className="w-4 h-4" />
                  Descargar plantilla de ejemplo
                </button>
              </div>
            </div>
          </div>
        )}

        {/* City Selector */}
        {historicalData && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <div className="flex items-center gap-4">
              <MapPin className="w-6 h-6 text-blue-600" />
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Selecciona una ciudad para analizar
                </label>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold"
                >
                  <option value="">-- Seleccionar Ciudad --</option>
                  {cities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => {
                  setHistoricalData(null);
                  setSelectedCity('');
                  localStorage.removeItem('historical_logistics_data');
                }}
                className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                Cargar nuevo archivo
              </button>
            </div>
          </div>
        )}

        {/* Results */}
        {cityMetrics && (
          <div className="space-y-6">
            {/* Classification Badge */}
            <div className={`rounded-2xl p-6 ${getClassificationBg(cityMetrics.classification)}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold mb-2">
                    Resultados: {cityMetrics.city}
                  </h2>
                  <p className={`text-lg font-semibold ${getClassificationTextColor(cityMetrics.classification)}`}>
                    {getClassificationLabel(cityMetrics.classification)}
                  </p>
                </div>
                <div className="text-6xl">
                  {getClassificationIcon(cityMetrics.classification)}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <MetricCard
                  label="Efectividad"
                  value={`${cityMetrics.overallSuccessRate.toFixed(1)}%`}
                  trend={cityMetrics.overallSuccessRate >= 70 ? 'up' : 'down'}
                  color={cityMetrics.overallSuccessRate >= 70 ? 'green' : 'red'}
                />
                <MetricCard
                  label="Devoluciones"
                  value={`${cityMetrics.overallReturnRate.toFixed(1)}%`}
                  trend={cityMetrics.overallReturnRate <= 30 ? 'up' : 'down'}
                  color={cityMetrics.overallReturnRate <= 30 ? 'green' : 'red'}
                />
                <MetricCard
                  label="Total Envíos"
                  value={cityMetrics.totalShipments.toString()}
                  color="blue"
                />
                <MetricCard
                  label="Tiempo Promedio"
                  value={`${cityMetrics.avgDeliveryTime.toFixed(0)} días`}
                  color="purple"
                />
              </div>
            </div>

            {/* Carrier Cards */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                {cityMetrics.carriers.length} opciones disponibles
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cityMetrics.carriers
                  .sort((a, b) => b.deliveryRate - a.deliveryRate)
                  .map((carrier, index) => (
                    <CarrierCard key={index} carrier={carrier} rank={index + 1} />
                  ))}
              </div>
            </div>

            {/* Recommendations */}
            {cityMetrics.recommendations.length > 0 && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-6 h-6" />
                  Recomendaciones
                </h3>
                <ul className="space-y-3">
                  {cityMetrics.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="text-blue-600 font-bold mt-1">•</span>
                      <span className="text-gray-700">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function to calculate city metrics
function calculateCityMetrics(city: string, carriers: CarrierPerformance[]): CityMetrics {
  const totalShipments = carriers.reduce((sum, c) => sum + c.total, 0);
  const totalDeliveries = carriers.reduce((sum, c) => sum + c.deliveries, 0);
  const totalReturns = carriers.reduce((sum, c) => sum + c.returns, 0);
  const avgTime = carriers.reduce((sum, c) => sum + c.avgTimeValue * c.total, 0) / totalShipments;

  const overallSuccessRate = (totalDeliveries / totalShipments) * 100;
  const overallReturnRate = (totalReturns / totalShipments) * 100;

  // Classification
  let classification: CityMetrics['classification'] = 'good';
  if (overallSuccessRate >= 80) classification = 'excellent';
  else if (overallSuccessRate >= 60) classification = 'good';
  else if (overallSuccessRate >= 40) classification = 'warning';
  else classification = 'critical';

  // Recommendations
  const recommendations: string[] = [];

  if (overallSuccessRate < 60) {
    recommendations.push(`Tasa de éxito baja (${overallSuccessRate.toFixed(0)}%). Considerar cambio de estrategia logística.`);
  }

  if (overallReturnRate > 40) {
    recommendations.push(`Alta tasa de devoluciones (${overallReturnRate.toFixed(0)}%). Revisar procesos de confirmación.`);
  }

  if (avgTime > 7) {
    recommendations.push(`Tiempo de entrega alto (${avgTime.toFixed(0)} días). Evaluar transportadoras más rápidas.`);
  }

  const bestCarrier = carriers.reduce((best, current) =>
    current.deliveryRate > best.deliveryRate ? current : best
  );

  recommendations.push(`Se recomienda usar ${bestCarrier.carrier} con ${bestCarrier.deliveryRate.toFixed(0)}% de efectividad.`);

  if (totalShipments < 20) {
    recommendations.push('Datos limitados. Incrementar volumen de envíos para análisis más preciso.');
  }

  return {
    city,
    carriers,
    overallSuccessRate,
    overallReturnRate,
    totalShipments,
    avgDeliveryTime: avgTime,
    classification,
    recommendations,
  };
}

// UI Helper Components
function MetricCard({
  label,
  value,
  trend,
  color,
}: {
  label: string;
  value: string;
  trend?: 'up' | 'down';
  color: string;
}) {
  const colorClasses = {
    green: 'bg-green-50 border-green-200',
    red: 'bg-red-50 border-red-200',
    blue: 'bg-blue-50 border-blue-200',
    purple: 'bg-purple-50 border-purple-200',
  };

  return (
    <div className={`${colorClasses[color as keyof typeof colorClasses]} border-2 rounded-xl p-4`}>
      <p className="text-sm text-gray-600 mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {trend && (
          trend === 'up' ? (
            <TrendingUp className="w-5 h-5 text-green-600" />
          ) : (
            <TrendingDown className="w-5 h-5 text-red-600" />
          )
        )}
      </div>
    </div>
  );
}

function CarrierCard({ carrier, rank }: { carrier: CarrierPerformance; rank: number }) {
  const getRatingColor = (rate: number) => {
    if (rate >= 75) return 'bg-green-500';
    if (rate >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getRatingBg = (rate: number) => {
    if (rate >= 75) return 'bg-green-50 border-green-200';
    if (rate >= 50) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  return (
    <div className={`${getRatingBg(carrier.deliveryRate)} border-2 rounded-2xl p-6 relative overflow-hidden transition-transform hover:scale-105`}>
      {/* Rank Badge */}
      {rank <= 3 && (
        <div className="absolute top-4 right-4">
          <span className={`text-2xl ${rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}`}>
            {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
          </span>
        </div>
      )}

      {/* Carrier Name */}
      <h4 className="text-xl font-bold text-gray-900 mb-4 pr-12">
        {carrier.carrier}
      </h4>

      {/* Rating Badge */}
      <div className={`${getRatingColor(carrier.deliveryRate)} text-white inline-block px-4 py-2 rounded-full font-bold text-lg mb-4`}>
        {carrier.deliveryRate.toFixed(1)}/10
      </div>

      {/* Metrics */}
      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Efectividad</span>
            <span className="font-bold text-gray-900">{carrier.deliveryRate.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`${getRatingColor(carrier.deliveryRate)} h-2 rounded-full transition-all`}
              style={{ width: `${carrier.deliveryRate}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Devoluciones</span>
            <span className="font-bold text-gray-900">{carrier.returnRate.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-red-400 h-2 rounded-full transition-all"
              style={{ width: `${carrier.returnRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 gap-2 text-sm">
        <div>
          <p className="text-gray-500">Llega aprox.</p>
          <p className="font-bold text-gray-900">{carrier.avgTime}</p>
        </div>
        <div>
          <p className="text-gray-500">Envíos</p>
          <p className="font-bold text-gray-900">{carrier.total}</p>
        </div>
      </div>
    </div>
  );
}

// Classification helpers
function getClassificationBg(classification: string) {
  switch (classification) {
    case 'excellent':
      return 'bg-green-50 border-2 border-green-200';
    case 'good':
      return 'bg-blue-50 border-2 border-blue-200';
    case 'warning':
      return 'bg-yellow-50 border-2 border-yellow-200';
    case 'critical':
      return 'bg-red-50 border-2 border-red-200';
    default:
      return 'bg-gray-50 border-2 border-gray-200';
  }
}

function getClassificationTextColor(classification: string) {
  switch (classification) {
    case 'excellent':
      return 'text-green-700';
    case 'good':
      return 'text-blue-700';
    case 'warning':
      return 'text-yellow-700';
    case 'critical':
      return 'text-red-700';
    default:
      return 'text-gray-700';
  }
}

function getClassificationLabel(classification: string) {
  switch (classification) {
    case 'excellent':
      return '🟢 Excelente - Zona de Alto Rendimiento';
    case 'good':
      return '🔵 Bueno - Desempeño Satisfactorio';
    case 'warning':
      return '🟡 Precaución - Requiere Atención';
    case 'critical':
      return '🔴 Crítico - Acción Inmediata Requerida';
    default:
      return 'Sin Clasificación';
  }
}

function getClassificationIcon(classification: string) {
  switch (classification) {
    case 'excellent':
      return '🟢';
    case 'good':
      return '🔵';
    case 'warning':
      return '🟡';
    case 'critical':
      return '🔴';
    default:
      return '⚪';
  }
}
