/**
 * USER ANALYSIS PANEL
 * Panel de análisis de productividad por usuario
 * Carga Excel/CSV, analiza con AI, muestra gráficos
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  Upload,
  FileSpreadsheet,
  Loader2,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Target,
  Clock,
  Package,
  Lightbulb,
  BarChart3,
  PieChart,
  Activity,
  Award,
  Zap,
  Brain,
  RefreshCw,
} from 'lucide-react';
import {
  analizarDatosTracker,
  analizarConClaudeAI,
  AnalysisResult,
} from '../../../../services/procesosAnalysisService';

interface Usuario {
  id: string;
  nombre: string;
  xp: number;
  nivel: number;
}

interface UserAnalysisPanelProps {
  usuario: Usuario;
  onBack: () => void;
}

const UserAnalysisPanel: React.FC<UserAnalysisPanelProps> = ({ usuario, onBack }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [aiInsights, setAiInsights] = useState<{ insights: string[]; recommendations: string[]; summary: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      setSelectedFile(file);
      setError(null);
    } else {
      setError('Por favor, selecciona un archivo CSV o Excel');
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
    }
  };

  // Analizar archivo
  const handleAnalizar = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError(null);
    setAnalysisResult(null);
    setAiInsights(null);

    try {
      const content = await selectedFile.text();
      const result = await analizarDatosTracker(content, usuario.nombre);
      setAnalysisResult(result);

      // Análisis con Claude AI en segundo plano
      setLoadingAI(true);
      try {
        const aiResult = await analizarConClaudeAI(result.data, usuario.nombre);
        setAiInsights(aiResult);
      } catch (aiError) {
        console.error('Error con Claude AI:', aiError);
      } finally {
        setLoadingAI(false);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al procesar el archivo';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Resetear para nuevo análisis
  const handleNuevoAnalisis = () => {
    setSelectedFile(null);
    setAnalysisResult(null);
    setAiInsights(null);
    setError(null);
  };

  // Renderizar estado de carga
  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-700">Analizando datos...</p>
          <p className="text-sm text-gray-500 mt-2">Procesando {selectedFile?.name}</p>
        </div>
      </div>
    );
  }

  // Renderizar resultados
  if (analysisResult) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Volver a usuarios
            </button>
            <h2 className="text-2xl font-bold text-gray-900">
              Análisis de {usuario.nombre}
            </h2>
            <p className="text-gray-600">
              Período: {analysisResult.data.metadata.fechaReporte || 'No especificado'}
            </p>
          </div>
          <button
            onClick={handleNuevoAnalisis}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <RefreshCw className="w-4 h-4" />
            Nuevo Análisis
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard
            title="Guías Realizadas"
            value={analysisResult.data.resumen.totalGuiasRealizadas}
            icon={<Package className="w-6 h-6" />}
            color="blue"
            trend={analysisResult.analysis.tendencia === 'mejorando' ? 'up' : analysisResult.analysis.tendencia === 'declinando' ? 'down' : undefined}
          />
          <KPICard
            title="Tasa de Éxito"
            value={`${analysisResult.analysis.kpis.tasaExito}%`}
            icon={<Target className="w-6 h-6" />}
            color={analysisResult.analysis.kpis.tasaExito >= 85 ? 'green' : 'orange'}
          />
          <KPICard
            title="Eficiencia"
            value={`${analysisResult.analysis.kpis.eficiencia}/h`}
            icon={<Zap className="w-6 h-6" />}
            color="purple"
          />
          <KPICard
            title="Total Rondas"
            value={analysisResult.data.resumen.totalRondas}
            icon={<Clock className="w-6 h-6" />}
            color="gray"
          />
        </div>

        {/* Insights locales */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Lightbulb className="w-6 h-6 text-yellow-600" />
            Insights del Análisis
          </h3>
          <div className="space-y-2">
            {analysisResult.analysis.insights.map((insight, idx) => (
              <div key={idx} className="flex items-start gap-3 p-2 bg-white/50 rounded-lg">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                <p className="text-gray-700">{insight}</p>
              </div>
            ))}
          </div>
        </div>

        {/* AI Insights (si están disponibles) */}
        {loadingAI && (
          <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
            <div className="flex items-center gap-3">
              <Brain className="w-6 h-6 text-purple-600 animate-pulse" />
              <span className="text-purple-700">Claude AI está analizando los datos...</span>
            </div>
          </div>
        )}

        {aiInsights && (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Brain className="w-6 h-6 text-purple-600" />
              Análisis con Claude AI
            </h3>
            {aiInsights.summary && (
              <p className="text-gray-700 mb-4 p-3 bg-white/50 rounded-lg italic">
                {aiInsights.summary}
              </p>
            )}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">🔍 Insights AI</h4>
                <ul className="space-y-1">
                  {aiInsights.insights.map((insight, idx) => (
                    <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-purple-500">•</span>
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">💡 Recomendaciones AI</h4>
                <ul className="space-y-1">
                  {aiInsights.recommendations.map((rec, idx) => (
                    <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-green-500">✓</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Recomendaciones */}
        <div className="bg-green-50 rounded-xl p-6 border border-green-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Award className="w-6 h-6 text-green-600" />
            Recomendaciones
          </h3>
          <div className="grid md:grid-cols-2 gap-3">
            {analysisResult.analysis.recommendations.map((rec, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-green-100">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-700">{rec}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Gráficos */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Rendimiento por Ronda */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Rendimiento por Ronda
            </h3>
            <div className="space-y-3">
              {analysisResult.charts.rendimientoPorRonda.slice(0, 8).map((ronda, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-600 w-12">{ronda.ronda}</span>
                  <div className="flex-1 flex gap-1 h-6">
                    <div
                      className="bg-green-500 rounded-l"
                      style={{ width: `${(ronda.realizadas / Math.max(1, ronda.realizadas + ronda.canceladas + ronda.pendientes)) * 100}%` }}
                      title={`Realizadas: ${ronda.realizadas}`}
                    />
                    <div
                      className="bg-red-500"
                      style={{ width: `${(ronda.canceladas / Math.max(1, ronda.realizadas + ronda.canceladas + ronda.pendientes)) * 100}%` }}
                      title={`Canceladas: ${ronda.canceladas}`}
                    />
                    <div
                      className="bg-yellow-500 rounded-r"
                      style={{ width: `${(ronda.pendientes / Math.max(1, ronda.realizadas + ronda.canceladas + ronda.pendientes)) * 100}%` }}
                      title={`Pendientes: ${ronda.pendientes}`}
                    />
                  </div>
                  <span className="text-sm text-gray-500 w-16 text-right">
                    {ronda.realizadas}/{ronda.realizadas + ronda.canceladas + ronda.pendientes}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex gap-4 mt-4 pt-4 border-t text-xs">
              <span className="flex items-center gap-1"><div className="w-3 h-3 bg-green-500 rounded" /> Realizadas</span>
              <span className="flex items-center gap-1"><div className="w-3 h-3 bg-red-500 rounded" /> Canceladas</span>
              <span className="flex items-center gap-1"><div className="w-3 h-3 bg-yellow-500 rounded" /> Pendientes</span>
            </div>
          </div>

          {/* Distribución */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-purple-600" />
              Distribución de Estados
            </h3>
            <div className="space-y-3">
              {analysisResult.charts.distribucion.map((item, idx) => {
                const total = analysisResult.charts.distribucion.reduce((acc, i) => acc + i.value, 0);
                const percentage = total > 0 ? (item.value / total) * 100 : 0;
                return (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: item.color }} />
                    <span className="text-sm text-gray-700 flex-1">{item.name}</span>
                    <span className="text-sm font-medium text-gray-900">{item.value}</span>
                    <span className="text-sm text-gray-500 w-16 text-right">{percentage.toFixed(1)}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Comparación Amazon */}
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-6 border border-orange-200">
          <h3 className="text-lg font-bold text-orange-900 mb-4 flex items-center gap-2">
            <Activity className="w-6 h-6" />
            Comparación con Estándares Amazon
          </h3>
          <div className="grid grid-cols-3 gap-6">
            <ComparisonMetric
              label="Tasa de Éxito"
              current={`${analysisResult.analysis.kpis.tasaExito}%`}
              target="99.9%"
              gap={`-${analysisResult.analysis.amazonComparison.tasaExitoGap}%`}
            />
            <ComparisonMetric
              label="Tiempo Promedio"
              current={`${analysisResult.analysis.kpis.tiempoPromedio} min`}
              target="<5 min"
              gap={`+${analysisResult.analysis.amazonComparison.tiempoGap} min`}
            />
            <ComparisonMetric
              label="Casos Difíciles"
              current={`${analysisResult.analysis.amazonComparison.casosDificilesGap + 1}%`}
              target="<1%"
              gap={`+${analysisResult.analysis.amazonComparison.casosDificilesGap}%`}
            />
          </div>
        </div>

        {/* Anomalías */}
        {analysisResult.analysis.anomalies.length > 0 && (
          <div className="bg-red-50 rounded-xl p-6 border border-red-200">
            <h3 className="text-lg font-bold text-red-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6" />
              Anomalías Detectadas
            </h3>
            <ul className="space-y-2">
              {analysisResult.analysis.anomalies.map((anomaly, idx) => (
                <li key={idx} className="flex items-start gap-2 text-red-800">
                  <span className="text-red-500">⚠</span>
                  {anomaly}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  // Renderizar zona de carga
  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Volver a usuarios
        </button>
        <h2 className="text-2xl font-bold text-gray-900">
          Cargar Reporte - {usuario.nombre}
        </h2>
        <p className="text-gray-600 mt-1">
          Sube el archivo Excel/CSV con los datos de rondas del LITPER TRACKER
        </p>
      </div>

      {/* Zona de Drag & Drop */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : selectedFile
            ? 'border-green-500 bg-green-50'
            : 'border-gray-300 hover:border-gray-400 bg-gray-50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileSelect}
          className="hidden"
        />

        {selectedFile ? (
          <div className="space-y-4">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto" />
            <div>
              <p className="text-lg font-semibold text-gray-900">{selectedFile.name}</p>
              <p className="text-sm text-gray-600 mt-1">
                {(selectedFile.size / 1024).toFixed(2)} KB
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedFile(null);
              }}
              className="text-sm text-red-600 hover:text-red-700 underline"
            >
              Cambiar archivo
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <Upload className="w-16 h-16 text-gray-400 mx-auto" />
              <FileSpreadsheet className="w-8 h-8 text-green-500 absolute bottom-0 right-1/2 translate-x-8" />
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900">
                {isDragging ? 'Suelta el archivo aquí' : 'Arrastra un archivo o haz click'}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Formatos aceptados: CSV, XLS, XLSX
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Botón Analizar */}
      {selectedFile && (
        <button
          onClick={handleAnalizar}
          className="w-full mt-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 flex items-center justify-center gap-2"
        >
          <Brain className="w-5 h-5" />
          Analizar con IA
        </button>
      )}

      {/* Formato esperado */}
      <div className="mt-8 p-4 bg-gray-100 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4" />
          Formato esperado del archivo:
        </h3>
        <pre className="text-xs text-gray-600 overflow-x-auto bg-white p-3 rounded border">
{`LITPER TRACKER - REPORTE 2025-12-21
Usuario: ${usuario.nombre}

=== GUIAS ===
Fecha,Usuario,Ronda,Hora Inicio,Hora Fin,Tiempo (min),Iniciales,Realizadas,Canceladas,...

=== NOVEDADES ===
Fecha,Usuario,Ronda,Hora Inicio,Hora Fin,Tiempo (min),Revisadas,Solucionadas,...

=== RESUMEN ===
Total Guías Realizadas: XX`}
        </pre>
      </div>
    </div>
  );
};

// Componentes auxiliares
const KPICard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'orange' | 'purple' | 'gray';
  trend?: 'up' | 'down';
}> = ({ title, value, icon, color, trend }) => {
  const colors = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    orange: 'from-orange-500 to-orange-600',
    purple: 'from-purple-500 to-purple-600',
    gray: 'from-gray-500 to-gray-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-lg bg-gradient-to-br ${colors[color]} text-white`}>
          {icon}
        </div>
        {trend && (
          <div className={trend === 'up' ? 'text-green-600' : 'text-red-600'}>
            {trend === 'up' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
          </div>
        )}
      </div>
      <p className="text-sm text-gray-600">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
};

const ComparisonMetric: React.FC<{
  label: string;
  current: string;
  target: string;
  gap: string;
}> = ({ label, current, target, gap }) => (
  <div className="bg-white rounded-lg p-4 text-center">
    <p className="text-sm font-medium text-gray-600 mb-2">{label}</p>
    <div className="space-y-1">
      <p className="text-lg font-bold text-blue-600">{current}</p>
      <p className="text-xs text-gray-500">Meta: {target}</p>
      <p className={`text-sm font-semibold ${gap.startsWith('+') || gap.startsWith('-') && !gap.includes('-0') ? 'text-red-600' : 'text-green-600'}`}>
        Gap: {gap}
      </p>
    </div>
  </div>
);

export default UserAnalysisPanel;
