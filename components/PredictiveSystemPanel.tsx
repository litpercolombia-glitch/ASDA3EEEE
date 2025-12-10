import React, { useState } from 'react';
import { useExcelParser, generateExcelTemplate } from '../hooks/useExcelParser';
import { calculateRiskScore, recommendBestCarrier } from '../utils/riskAlgorithms';
import { HistoricalData, ProductType, RiskLevel } from '../types';
import { Button } from './ui/Button';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { Upload, Download, AlertTriangle, CheckCircle, TrendingUp, Clock } from 'lucide-react';

interface PredictiveSystemPanelProps {
  onClose: () => void;
}

type TabType = 'upload' | 'predict' | 'recommend';

export function PredictiveSystemPanel({ onClose }: PredictiveSystemPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('upload');
  const [historicalData, setHistoricalData] = useState<HistoricalData | null>(() => {
    // Intentar cargar datos guardados
    const saved = localStorage.getItem('historical_logistics_data');
    return saved ? JSON.parse(saved) : null;
  });

  const { parseExcelFile, isLoading, parseResult, reset } = useExcelParser();

  // Estados para predicción
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedCarrier, setSelectedCarrier] = useState('');
  const [orderValue, setOrderValue] = useState<number | undefined>();
  const [productType, setProductType] = useState<ProductType>('Otro');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const result = await parseExcelFile(file);

    if (result.success && result.data) {
      // Mostrar preview y esperar confirmación
      // (En este caso auto-confirmamos, pero podrías agregar un paso de confirmación)
      setHistoricalData(result.data);
      localStorage.setItem('historical_logistics_data', JSON.stringify(result.data));
    }
  };

  const handleConfirmData = () => {
    if (parseResult?.data) {
      setHistoricalData(parseResult.data);
      localStorage.setItem('historical_logistics_data', JSON.stringify(parseResult.data));
      setActiveTab('predict');
      reset();
    }
  };

  const handleDownloadTemplate = () => {
    generateExcelTemplate();
  };

  const cities = historicalData ? Object.keys(historicalData).sort() : [];
  const carriers =
    selectedCity && historicalData?.[selectedCity]
      ? historicalData[selectedCity].map((c) => c.carrier)
      : [];

  // Calcular riesgo
  const riskAnalysis =
    selectedCity && selectedCarrier && historicalData
      ? calculateRiskScore(selectedCity, selectedCarrier, historicalData, orderValue, productType)
      : null;

  // Recomendador
  const recommendation =
    selectedCity && historicalData
      ? recommendBestCarrier(selectedCity, historicalData, productType)
      : null;

  const getRiskColor = (level: RiskLevel) => {
    switch (level) {
      case 'BAJO':
        return 'bg-green-50 border-green-200 text-green-900';
      case 'MEDIO':
        return 'bg-yellow-50 border-yellow-200 text-yellow-900';
      case 'ALTO':
        return 'bg-orange-50 border-orange-200 text-orange-900';
      case 'CRÍTICO':
        return 'bg-red-50 border-red-200 text-red-900';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-900';
    }
  };

  const getRiskIcon = (level: RiskLevel) => {
    switch (level) {
      case 'BAJO':
        return <CheckCircle className="w-8 h-8 text-green-600" />;
      case 'MEDIO':
        return <AlertTriangle className="w-8 h-8 text-yellow-600" />;
      case 'ALTO':
      case 'CRÍTICO':
        return <AlertTriangle className="w-8 h-8 text-red-600" />;
      default:
        return <AlertTriangle className="w-8 h-8 text-gray-600" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold mb-2">🎯 Sistema de Predicción Logística</h2>
              <p className="text-purple-100">Análisis inteligente de riesgo y recomendaciones</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-6">
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                activeTab === 'upload'
                  ? 'bg-white text-purple-600'
                  : 'bg-purple-500 bg-opacity-30 text-white hover:bg-opacity-50'
              }`}
            >
              📊 Cargar Datos
            </button>
            <button
              onClick={() => setActiveTab('predict')}
              disabled={!historicalData}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                activeTab === 'predict'
                  ? 'bg-white text-purple-600'
                  : historicalData
                    ? 'bg-purple-500 bg-opacity-30 text-white hover:bg-opacity-50'
                    : 'bg-gray-400 bg-opacity-30 text-gray-300 cursor-not-allowed'
              }`}
            >
              🎯 Predicción de Riesgo
            </button>
            <button
              onClick={() => setActiveTab('recommend')}
              disabled={!historicalData}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                activeTab === 'recommend'
                  ? 'bg-white text-purple-600'
                  : historicalData
                    ? 'bg-purple-500 bg-opacity-30 text-white hover:bg-opacity-50'
                    : 'bg-gray-400 bg-opacity-30 text-gray-300 cursor-not-allowed'
              }`}
            >
              🏆 Recomendador
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* TAB: Upload */}
          {activeTab === 'upload' && (
            <div className="space-y-6">
              {!parseResult && !historicalData && (
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
                  <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-700 mb-2">Sube tu archivo Excel</h3>
                  <p className="text-gray-500 mb-6">
                    Arrastra tu archivo aquí o haz clic para seleccionar
                  </p>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                    disabled={isLoading}
                  />
                  <label htmlFor="file-upload">
                    <Button
                      as="span"
                      variant="primary"
                      icon={
                        isLoading ? <LoadingSpinner size="sm" /> : <Upload className="w-4 h-4" />
                      }
                      disabled={isLoading}
                    >
                      {isLoading ? 'Procesando...' : 'Seleccionar Archivo'}
                    </Button>
                  </label>

                  <div className="mt-6">
                    <button
                      onClick={handleDownloadTemplate}
                      className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2 mx-auto"
                    >
                      <Download className="w-4 h-4" />
                      Descargar plantilla de ejemplo
                    </button>
                  </div>
                </div>
              )}

              {parseResult && parseResult.success && parseResult.preview && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-green-900 mb-4">
                    ✅ Preview de Datos Cargados
                  </h3>
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-white rounded-lg p-4 text-center">
                      <p className="text-3xl font-bold text-green-600">
                        {parseResult.preview.totalCities}
                      </p>
                      <p className="text-sm text-gray-600">Ciudades detectadas</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 text-center">
                      <p className="text-3xl font-bold text-blue-600">
                        {parseResult.preview.totalCarriers}
                      </p>
                      <p className="text-sm text-gray-600">Transportadoras</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 text-center">
                      <p className="text-3xl font-bold text-purple-600">
                        {parseResult.preview.totalRecords}
                      </p>
                      <p className="text-sm text-gray-600">Registros de entregas</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="font-semibold text-green-900 mb-2">Ciudades encontradas:</p>
                    <div className="flex flex-wrap gap-2">
                      {parseResult.preview.cities.map((city) => (
                        <span
                          key={city}
                          className="bg-white px-3 py-1 rounded-full text-sm text-gray-700"
                        >
                          {city}
                        </span>
                      ))}
                      {parseResult.preview.totalCities > 10 && (
                        <span className="bg-white px-3 py-1 rounded-full text-sm text-gray-500">
                          +{parseResult.preview.totalCities - 10} más
                        </span>
                      )}
                    </div>
                  </div>

                  <Button onClick={handleConfirmData} variant="primary" className="w-full">
                    ✓ Confirmar y Usar Datos
                  </Button>
                </div>
              )}

              {parseResult && !parseResult.success && parseResult.error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-red-900 mb-2">❌ Error al Cargar</h3>
                  <p className="text-red-700 mb-4">{parseResult.error}</p>
                  <Button onClick={reset} variant="secondary">
                    Intentar de nuevo
                  </Button>
                </div>
              )}

              {historicalData && !parseResult && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-blue-900 mb-2">ℹ️ Datos Ya Cargados</h3>
                  <p className="text-blue-700 mb-4">
                    Ya tienes datos históricos cargados. Puedes cargar un nuevo archivo para
                    reemplazarlos.
                  </p>
                  <div className="flex gap-3">
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-replace"
                    />
                    <label htmlFor="file-replace">
                      <Button as="span" variant="primary">
                        <Upload className="w-4 h-4 mr-2" />
                        Cargar Nuevo Archivo
                      </Button>
                    </label>
                    <Button onClick={() => setActiveTab('predict')} variant="secondary">
                      Ir a Predicción →
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: Predict */}
          {activeTab === 'predict' && historicalData && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
                <h3 className="text-2xl font-bold text-gray-800 mb-4">
                  🎯 Análisis de Riesgo de Envío
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Ciudad Destino *
                    </label>
                    <select
                      value={selectedCity}
                      onChange={(e) => {
                        setSelectedCity(e.target.value);
                        setSelectedCarrier('');
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Seleccionar ciudad...</option>
                      {cities.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Transportadora *
                    </label>
                    <select
                      value={selectedCarrier}
                      onChange={(e) => setSelectedCarrier(e.target.value)}
                      disabled={!selectedCity}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                    >
                      <option value="">Seleccionar transportadora...</option>
                      {carriers.map((carrier) => (
                        <option key={carrier} value={carrier}>
                          {carrier}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Valor del Pedido (opcional)
                    </label>
                    <input
                      type="number"
                      placeholder="$0"
                      value={orderValue || ''}
                      onChange={(e) =>
                        setOrderValue(e.target.value ? Number(e.target.value) : undefined)
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Tipo de Producto
                    </label>
                    <select
                      value={productType}
                      onChange={(e) => setProductType(e.target.value as ProductType)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Otro">Otro</option>
                      <option value="Frágil">Frágil</option>
                      <option value="Electrónico">Electrónico</option>
                      <option value="Ropa">Ropa</option>
                      <option value="Alimentos">Alimentos</option>
                      <option value="Documentos">Documentos</option>
                    </select>
                  </div>
                </div>
              </div>

              {riskAnalysis && (
                <div className={`border-2 rounded-xl p-6 ${getRiskColor(riskAnalysis.risk)}`}>
                  <div className="flex items-start gap-4 mb-4">
                    {getRiskIcon(riskAnalysis.risk)}
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold mb-1">
                        RIESGO {riskAnalysis.risk}: {riskAnalysis.score}% probabilidad de novedad
                      </h3>
                      <p className="text-sm opacity-80">
                        Análisis para {selectedCity} con {selectedCarrier}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white bg-opacity-50 rounded-lg p-3">
                      <p className="text-xs opacity-70 mb-1">Tasa de Éxito</p>
                      <p className="text-xl font-bold">{riskAnalysis.factors.tasaExito}%</p>
                    </div>
                    <div className="bg-white bg-opacity-50 rounded-lg p-3">
                      <p className="text-xs opacity-70 mb-1">Tiempo Promedio</p>
                      <p className="text-xl font-bold">
                        {riskAnalysis.factors.tiempoPromedio} días
                      </p>
                    </div>
                    <div className="bg-white bg-opacity-50 rounded-lg p-3">
                      <p className="text-xs opacity-70 mb-1">Datos Históricos</p>
                      <p className="text-xl font-bold">{riskAnalysis.factors.volumenDatos}</p>
                    </div>
                    <div className="bg-white bg-opacity-50 rounded-lg p-3">
                      <p className="text-xs opacity-70 mb-1">Confiabilidad</p>
                      <p className="text-xl font-bold">{riskAnalysis.factors.confiabilidad}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-lg mb-3">💡 Recomendaciones:</h4>
                    <ul className="space-y-2">
                      {riskAnalysis.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="mt-1">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: Recommend */}
          {activeTab === 'recommend' && historicalData && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6">
                <h3 className="text-2xl font-bold text-gray-800 mb-4">
                  🏆 Recomendador Inteligente de Transportadora
                </h3>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Ciudad Destino *
                  </label>
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar ciudad...</option>
                    {cities.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {recommendation && recommendation.best && (
                <div className="space-y-4">
                  <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <TrendingUp className="w-8 h-8 text-green-600" />
                      <h4 className="text-2xl font-bold text-green-900">
                        Recomendación: {recommendation.best.carrier}
                      </h4>
                    </div>
                    <p className="text-green-700 mb-4">{recommendation.reason}</p>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-white rounded-lg p-4 text-center">
                        <p className="text-3xl font-bold text-green-600">
                          {recommendation.best.deliveryRate.toFixed(0)}%
                        </p>
                        <p className="text-sm text-gray-600">Tasa de Éxito</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 text-center">
                        <p className="text-3xl font-bold text-blue-600">
                          {recommendation.best.avgTimeValue}
                        </p>
                        <p className="text-sm text-gray-600">Días promedio</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 text-center">
                        <p className="text-3xl font-bold text-purple-600">
                          {recommendation.best.total}
                        </p>
                        <p className="text-sm text-gray-600">Envíos históricos</p>
                      </div>
                    </div>
                  </div>

                  {recommendation.alternatives.length > 0 && (
                    <div>
                      <h4 className="font-bold text-gray-800 mb-3">Alternativas:</h4>
                      <div className="space-y-3">
                        {recommendation.alternatives.map((alt, index) => (
                          <div
                            key={index}
                            className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex justify-between items-center"
                          >
                            <div>
                              <p className="font-semibold text-gray-900">{alt.carrier}</p>
                              <p className="text-sm text-gray-600">
                                {alt.deliveryRate.toFixed(0)}% éxito • {alt.avgTimeValue} días
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-500">{alt.total} envíos</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!recommendation?.best && selectedCity && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
                  <p className="text-gray-600">No hay datos suficientes para {selectedCity}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t flex justify-between items-center">
          <p className="text-sm text-gray-600">
            {historicalData ? '✅ Datos cargados' : '⚠️ No hay datos cargados'}
          </p>
          <Button onClick={onClose} variant="secondary">
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}

// Helper component for Button with "as" prop
interface ButtonWithAsProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  as?: 'span' | 'button';
  variant?: 'primary' | 'secondary';
  icon?: React.ReactNode;
}

function ButtonWithAs({ as: Component = 'button', ...props }: ButtonWithAsProps) {
  return <Button {...props} />;
}
