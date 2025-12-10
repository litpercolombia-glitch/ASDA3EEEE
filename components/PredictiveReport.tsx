import React, { useState, useEffect } from 'react';
import { Shipment } from '../types';
import { generateAnalyticsReport, AnalyticsReport } from '../services/analyticsService';
import {
  generatePredictiveInsights,
  generateExecutiveSummary,
  PredictiveInsights,
} from '../services/predictiveService';
import { Button } from './ui/Button';
import { LoadingSpinner } from './ui/LoadingSpinner';

interface PredictiveReportProps {
  shipments: Shipment[];
  onClose: () => void;
}

export function PredictiveReport({ shipments, onClose }: PredictiveReportProps) {
  const [report, setReport] = useState<AnalyticsReport | null>(null);
  const [insights, setInsights] = useState<PredictiveInsights | null>(null);
  const [summary, setSummary] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    generateReport();
  }, [shipments]);

  const generateReport = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Generar análisis de datos
      const analyticsReport = generateAnalyticsReport(shipments);
      setReport(analyticsReport);

      // Generar insights predictivos con IA
      const predictiveInsights = await generatePredictiveInsights(analyticsReport, shipments);
      setInsights(predictiveInsights);

      // Generar resumen ejecutivo
      const execSummary = await generateExecutiveSummary(analyticsReport);
      setSummary(execSummary);
    } catch (err) {
      console.error('Error generando reporte:', err);
      setError('Error al generar el reporte predictivo. Por favor intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const exportReport = () => {
    if (!report || !insights) return;

    const reportText = generateReportText(report, insights, summary);
    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reporte-predictivo-semana-${report.weekNumber}-${report.year}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full">
          <LoadingSpinner size="lg" />
          <p className="text-center mt-4 text-gray-600">Generando reporte predictivo con IA...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full">
          <div className="text-center">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Error</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={generateReport} variant="primary">
                Reintentar
              </Button>
              <Button onClick={onClose} variant="secondary">
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!report || !insights) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl max-w-6xl w-full my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-t-lg">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold mb-2">📄 Reporte Predictivo Logístico</h2>
              <p className="text-blue-100">
                Semana {report.weekNumber} - Año {report.year}
              </p>
              <p className="text-sm text-blue-200 mt-1">
                Generado: {new Date(report.generatedDate).toLocaleString('es-CO')}
              </p>
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
        </div>

        <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Empresa Info */}
          <div className="bg-gray-50 border-l-4 border-blue-500 p-4 mb-6">
            <p className="font-semibold text-gray-700">Empresa: LITPER SEGUIMIENTO DE GUÍAS</p>
            <p className="text-sm text-gray-600">
              Generado por: Inteligencia Artificial (Claude) + Datos Históricos
            </p>
          </div>

          {/* Resumen Ejecutivo */}
          {summary && (
            <section className="mb-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                <span className="text-3xl mr-3">📊</span>
                Resumen Ejecutivo
              </h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">{summary}</p>
              </div>
            </section>
          )}

          {/* Métricas Clave */}
          <section className="mb-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">📈 Métricas Clave</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard
                title="Guías Procesadas"
                value={report.metrics.totalShipments}
                icon="📦"
                color="blue"
              />
              <MetricCard
                title="Entregas Exitosas"
                value={`${report.metrics.successfulDeliveries} (${report.metrics.successRate}%)`}
                icon="✅"
                color="green"
              />
              <MetricCard
                title="Fallos Detectados"
                value={`${report.metrics.failures} (${report.metrics.failureRate}%)`}
                icon="❌"
                color="red"
              />
              <MetricCard
                title="Tiempo Promedio"
                value={`${report.metrics.averageDeliveryTime} días`}
                icon="⏱️"
                color="yellow"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-700 font-semibold mb-1">🏆 Mejor Transportadora</p>
                <p className="text-lg font-bold text-green-900">
                  {report.metrics.bestCarrier.name}
                </p>
                <p className="text-sm text-green-600">
                  {report.metrics.bestCarrier.successRate}% entregas exitosas
                </p>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-700 font-semibold mb-1">
                  ⚠️ Transportadora con Más Fallos
                </p>
                <p className="text-lg font-bold text-red-900">{report.metrics.worstCarrier.name}</p>
                <p className="text-sm text-red-600">
                  {report.metrics.worstCarrier.failureCount} fallos registrados
                </p>
              </div>
            </div>
          </section>

          {/* Zonas Críticas */}
          {report.criticalZones.length > 0 && (
            <section className="mb-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                <span className="text-3xl mr-3">📍</span>
                Zonas Críticas Identificadas
              </h3>
              <div className="space-y-3">
                {report.criticalZones.map((zone, index) => (
                  <div key={index} className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-orange-900 text-lg">
                          {index + 1}. {zone.city}
                        </p>
                        <p className="text-sm text-orange-700">
                          Transportadora común: {zone.commonCarrier}
                        </p>
                      </div>
                      <span className="bg-orange-200 text-orange-900 px-3 py-1 rounded-full font-semibold">
                        {zone.failures} fallos
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Rutas con Retrasos */}
          {report.delayedRoutes.length > 0 && (
            <section className="mb-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                <span className="text-3xl mr-3">⏳</span>
                Rutas con Retrasos Significativos
              </h3>
              <div className="space-y-3">
                {report.delayedRoutes.map((route, index) => (
                  <div key={index} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="font-bold text-yellow-900 text-lg mb-2">
                      {route.from} → {route.to}
                    </p>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-yellow-700">Tiempo promedio</p>
                        <p className="font-semibold text-yellow-900">{route.averageTime} días</p>
                      </div>
                      <div>
                        <p className="text-yellow-700">Tiempo real</p>
                        <p className="font-semibold text-yellow-900">{route.actualTime} días</p>
                      </div>
                      <div>
                        <p className="text-yellow-700">Retraso</p>
                        <p className="font-semibold text-red-600">+{route.delayDays} días</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Predicciones IA */}
          <section className="mb-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <span className="text-3xl mr-3">🧠</span>
              Predicciones para la Próxima Semana (IA)
            </h3>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-5">
              <p className="text-sm text-purple-700 mb-3 italic">
                Generadas por Claude AI analizando patrones históricos y tendencias
              </p>
              <ul className="space-y-3">
                {insights.predictions.map((prediction, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-purple-600 font-bold mr-3 mt-1">•</span>
                    <span className="text-gray-700 flex-1">{prediction}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Sugerencias Estratégicas */}
          <section className="mb-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <span className="text-3xl mr-3">🧾</span>
              Sugerencias Estratégicas (IA)
            </h3>
            <div className="space-y-3">
              {insights.strategicSuggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start"
                >
                  <span className="text-green-600 text-xl mr-3 mt-1">✓</span>
                  <p className="text-gray-700 flex-1">{suggestion}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Alertas de Riesgo */}
          {insights.riskAlerts.length > 0 && (
            <section className="mb-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                <span className="text-3xl mr-3">⚠️</span>
                Alertas de Riesgo
              </h3>
              <div className="space-y-3">
                {insights.riskAlerts.map((alert, index) => (
                  <div
                    key={index}
                    className="bg-red-50 border-l-4 border-red-500 p-4 flex items-start"
                  >
                    <span className="text-red-600 text-xl mr-3">🚨</span>
                    <p className="text-gray-700 flex-1">{alert}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Footer con acciones */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-between items-center border-t">
          <p className="text-sm text-gray-600">Reporte generado automáticamente por LITPER IA</p>
          <div className="flex gap-3">
            <Button onClick={exportReport} variant="secondary" icon={<span>💾</span>}>
              Exportar Reporte
            </Button>
            <Button onClick={onClose} variant="primary">
              Cerrar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente auxiliar para tarjetas de métricas
interface MetricCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: 'blue' | 'green' | 'red' | 'yellow';
}

function MetricCard({ title, value, icon, color }: MetricCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-900',
    green: 'bg-green-50 border-green-200 text-green-900',
    red: 'bg-red-50 border-red-200 text-red-900',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-900',
  };

  return (
    <div className={`${colorClasses[color]} border rounded-lg p-4`}>
      <div className="text-2xl mb-2">{icon}</div>
      <p className="text-sm opacity-80 mb-1">{title}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}

// Función para generar el texto del reporte para exportación
function generateReportText(
  report: AnalyticsReport,
  insights: PredictiveInsights,
  summary: string
): string {
  return `
╔════════════════════════════════════════════════════════════════════╗
║     REPORTE PREDICTIVO LOGÍSTICO - SEMANA ${report.weekNumber} - ${report.year}     ║
╚════════════════════════════════════════════════════════════════════╝

Empresa: LITPER SEGUIMIENTO DE GUÍAS (Versión Premium)
Generado por: Inteligencia Artificial (Claude) + Datos Históricos
Fecha de emisión: ${new Date(report.generatedDate).toLocaleString('es-CO')}

────────────────────────────────────────────────────────────────────

📊 RESUMEN EJECUTIVO

${summary}

────────────────────────────────────────────────────────────────────

📈 MÉTRICAS CLAVE

• Total de guías procesadas: ${report.metrics.totalShipments}
• Entregas exitosas: ${report.metrics.successfulDeliveries} (${report.metrics.successRate}%)
• Fallos detectados: ${report.metrics.failures} (${report.metrics.failureRate}%)
• Tiempo promedio de entrega: ${report.metrics.averageDeliveryTime} días
• Transportadora con mejor rendimiento: ${report.metrics.bestCarrier.name} (${report.metrics.bestCarrier.successRate}% entregas exitosas)
• Transportadora con más fallos: ${report.metrics.worstCarrier.name} (${report.metrics.worstCarrier.failureCount} fallos)

────────────────────────────────────────────────────────────────────

📍 ZONAS CRÍTICAS IDENTIFICADAS

${report.criticalZones.map((zone, i) => `${i + 1}. Ciudad: ${zone.city} - Fallos: ${zone.failures} - Transportadora común: ${zone.commonCarrier}`).join('\n')}

────────────────────────────────────────────────────────────────────

⏳ RUTAS CON RETRASOS SIGNIFICATIVOS

${report.delayedRoutes
  .map(
    (route, i) => `${i + 1}. Ruta: ${route.from} → ${route.to}
   - Tiempo promedio: ${route.averageTime} días
   - Tiempo real: ${route.actualTime} días → Retraso de +${route.delayDays} días`
  )
  .join('\n\n')}

────────────────────────────────────────────────────────────────────

🧠 PREDICCIONES PARA LA PRÓXIMA SEMANA (IA)

Generadas por Claude AI a partir de datos recientes y patrones históricos:

${insights.predictions.map((pred, i) => `${i + 1}. ${pred}`).join('\n\n')}

────────────────────────────────────────────────────────────────────

🧾 SUGERENCIAS ESTRATÉGICAS (IA)

${insights.strategicSuggestions.map((sug, i) => `${i + 1}. ${sug}`).join('\n\n')}

────────────────────────────────────────────────────────────────────

⚠️ ALERTAS DE RIESGO

${insights.riskAlerts.map((alert, i) => `${i + 1}. ${alert}`).join('\n\n')}

────────────────────────────────────────────────────────────────────

Reporte generado automáticamente por LITPER IA
© ${report.year} LITPER SEGUIMIENTO DE GUÍAS
`.trim();
}
