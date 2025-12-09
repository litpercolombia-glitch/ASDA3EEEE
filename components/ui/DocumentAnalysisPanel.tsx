// ============================================
// LITPER PRO - DOCUMENT ANALYSIS PANEL
// Panel de análisis IA para documentos procesados
// ============================================

import React, { useState } from 'react';
import {
  FileText,
  Brain,
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  MapPin,
  Truck,
  DollarSign,
  Calendar,
  X,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  BookOpen,
  Target,
  Zap,
  BarChart3,
  PieChart,
  Activity,
  ArrowRight,
  Star,
  Clock,
} from 'lucide-react';
import { ProcessedDocument, documentProcessor } from '../../services/documentProcessingService';

interface DocumentAnalysisPanelProps {
  document: ProcessedDocument;
  onClose?: () => void;
  onSaveToKnowledge?: () => void;
}

export const DocumentAnalysisPanel: React.FC<DocumentAnalysisPanelProps> = ({
  document,
  onClose,
  onSaveToKnowledge,
}) => {
  const [expandedSection, setExpandedSection] = useState<string | null>('summary');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const analysis = document.aiAnalysis;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(key);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'negative': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'logistica': return <Truck className="w-5 h-5" />;
      case 'finanzas': return <DollarSign className="w-5 h-5" />;
      case 'ventas': return <TrendingUp className="w-5 h-5" />;
      case 'atencion': return <Activity className="w-5 h-5" />;
      case 'operaciones': return <Target className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      logistica: 'Logística',
      finanzas: 'Finanzas',
      ventas: 'Ventas',
      atencion: 'Atención al Cliente',
      operaciones: 'Operaciones',
      otro: 'General',
    };
    return labels[category] || category;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-navy-700 overflow-hidden">
      {/* Header con gradiente */}
      <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-6 overflow-hidden">
        {/* Efecto de brillo */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2ZmZiIgb3BhY2l0eT0iMC4wNSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50"></div>

        <div className="relative z-10 flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-yellow-300" />
                <span className="text-xs font-bold text-yellow-200 uppercase tracking-wider">
                  Análisis IA Completo
                </span>
              </div>
              <h2 className="text-xl font-bold text-white truncate max-w-md">
                {document.fileName}
              </h2>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs text-white/80 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(document.processedAt).toLocaleString('es-CO')}
                </span>
                {analysis?.category && (
                  <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs text-white font-medium flex items-center gap-1">
                    {getCategoryIcon(analysis.category)}
                    {getCategoryLabel(analysis.category)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          )}
        </div>
      </div>

      {/* Contenido */}
      <div className="p-6 space-y-6">
        {/* Estado del documento */}
        {document.status === 'error' && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-700 dark:text-red-400">Error en el procesamiento</p>
              <p className="text-sm text-red-600 dark:text-red-300 mt-1">{document.error}</p>
            </div>
          </div>
        )}

        {/* Métricas financieras (si aplica) */}
        {document.financialMetrics && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <MetricCard
              label="Ventas Totales"
              value={formatCurrency(document.financialMetrics.totalSales)}
              icon={<DollarSign className="w-5 h-5" />}
              color="blue"
            />
            <MetricCard
              label="Ganancia"
              value={formatCurrency(document.financialMetrics.totalProfit)}
              icon={<TrendingUp className="w-5 h-5" />}
              color="emerald"
            />
            <MetricCard
              label="Margen"
              value={`${document.financialMetrics.profitMargin.toFixed(1)}%`}
              icon={<PieChart className="w-5 h-5" />}
              color="purple"
            />
            <MetricCard
              label="Tasa Entrega"
              value={`${document.financialMetrics.deliveryRate.toFixed(1)}%`}
              icon={<CheckCircle className="w-5 h-5" />}
              color={document.financialMetrics.deliveryRate >= 70 ? 'emerald' : 'amber'}
            />
            <MetricCard
              label="Tasa Devolución"
              value={`${document.financialMetrics.returnRate.toFixed(1)}%`}
              icon={<TrendingDown className="w-5 h-5" />}
              color={document.financialMetrics.returnRate <= 15 ? 'emerald' : 'red'}
            />
            <MetricCard
              label="Ticket Promedio"
              value={formatCurrency(document.financialMetrics.avgTicket)}
              icon={<BarChart3 className="w-5 h-5" />}
              color="indigo"
            />
          </div>
        )}

        {analysis && (
          <>
            {/* Resumen Ejecutivo */}
            <CollapsibleSection
              title="Resumen Ejecutivo"
              icon={<Star className="w-5 h-5 text-amber-500" />}
              isExpanded={expandedSection === 'summary'}
              onToggle={() => setExpandedSection(expandedSection === 'summary' ? null : 'summary')}
            >
              <div className="space-y-4">
                <div className="flex items-start gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getSentimentColor(analysis.sentiment)}`}>
                    {analysis.sentiment === 'positive' ? 'Positivo' :
                      analysis.sentiment === 'negative' ? 'Negativo' : 'Neutral'}
                  </span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 text-base leading-relaxed">
                  {analysis.summary}
                </p>
                <button
                  onClick={() => handleCopy(analysis.summary, 'summary')}
                  className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  {copiedText === 'summary' ? 'Copiado!' : 'Copiar resumen'}
                </button>
              </div>
            </CollapsibleSection>

            {/* Puntos Clave */}
            <CollapsibleSection
              title="Puntos Clave Identificados"
              icon={<Target className="w-5 h-5 text-blue-500" />}
              isExpanded={expandedSection === 'keypoints'}
              onToggle={() => setExpandedSection(expandedSection === 'keypoints' ? null : 'keypoints')}
              badge={analysis.keyPoints.length}
            >
              <div className="space-y-3">
                {analysis.keyPoints.map((point, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-navy-800 rounded-xl">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {idx + 1}
                    </span>
                    <p className="text-slate-700 dark:text-slate-300 text-sm">{point}</p>
                  </div>
                ))}
              </div>
            </CollapsibleSection>

            {/* Recomendaciones IA */}
            <CollapsibleSection
              title="Recomendaciones IA"
              icon={<Lightbulb className="w-5 h-5 text-amber-500" />}
              isExpanded={expandedSection === 'recommendations'}
              onToggle={() => setExpandedSection(expandedSection === 'recommendations' ? null : 'recommendations')}
              badge={analysis.recommendations.length}
              highlight
            >
              <div className="space-y-3">
                {analysis.recommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border border-amber-200 dark:border-amber-800 rounded-xl"
                  >
                    <div className="flex-shrink-0 p-1.5 bg-amber-500 rounded-lg">
                      <Zap className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-slate-700 dark:text-slate-300 font-medium">{rec}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  </div>
                ))}
              </div>
            </CollapsibleSection>

            {/* Acciones a Tomar */}
            {analysis.actionItems.length > 0 && (
              <CollapsibleSection
                title="Acciones a Tomar"
                icon={<CheckCircle className="w-5 h-5 text-emerald-500" />}
                isExpanded={expandedSection === 'actions'}
                onToggle={() => setExpandedSection(expandedSection === 'actions' ? null : 'actions')}
                badge={analysis.actionItems.length}
              >
                <div className="space-y-2">
                  {analysis.actionItems.map((action, idx) => (
                    <label
                      key={idx}
                      className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
                    >
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-slate-700 dark:text-slate-300 text-sm">{action}</span>
                    </label>
                  ))}
                </div>
              </CollapsibleSection>
            )}

            {/* Entidades Detectadas */}
            <CollapsibleSection
              title="Entidades Detectadas"
              icon={<MapPin className="w-5 h-5 text-purple-500" />}
              isExpanded={expandedSection === 'entities'}
              onToggle={() => setExpandedSection(expandedSection === 'entities' ? null : 'entities')}
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Ciudades */}
                <EntityGroup
                  label="Ciudades"
                  icon={<MapPin className="w-4 h-4" />}
                  items={analysis.entities.cities}
                  color="blue"
                />

                {/* Transportadoras */}
                <EntityGroup
                  label="Transportadoras"
                  icon={<Truck className="w-4 h-4" />}
                  items={analysis.entities.carriers}
                  color="purple"
                />

                {/* Montos */}
                <EntityGroup
                  label="Montos"
                  icon={<DollarSign className="w-4 h-4" />}
                  items={analysis.entities.amounts}
                  color="emerald"
                />

                {/* Fechas */}
                <EntityGroup
                  label="Fechas"
                  icon={<Calendar className="w-4 h-4" />}
                  items={analysis.entities.dates}
                  color="amber"
                />
              </div>
            </CollapsibleSection>
          </>
        )}

        {/* Acciones */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-navy-700">
          <div className="flex items-center gap-2">
            {onSaveToKnowledge && (
              <button
                onClick={onSaveToKnowledge}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-purple-500/30"
              >
                <BookOpen className="w-4 h-4" />
                Guardar en Conocimiento
              </button>
            )}
          </div>

          <button
            onClick={() => {
              const blob = new Blob([JSON.stringify(document, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `analisis_${document.fileName.replace(/[^a-z0-9]/gi, '_')}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-medium transition-all"
          >
            <Download className="w-4 h-4" />
            Exportar Análisis
          </button>
        </div>
      </div>
    </div>
  );
};

// Componente de tarjeta de métrica
const MetricCard: React.FC<{
  label: string;
  value: string;
  icon: React.ReactNode;
  color: 'blue' | 'emerald' | 'purple' | 'amber' | 'red' | 'indigo';
}> = ({ label, value, icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800',
    amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800',
    indigo: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800',
  };

  return (
    <div className={`p-4 rounded-xl border ${colorClasses[color]}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wider opacity-80">{label}</span>
      </div>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
};

// Componente de sección colapsable
const CollapsibleSection: React.FC<{
  title: string;
  icon: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  badge?: number;
  highlight?: boolean;
  children: React.ReactNode;
}> = ({ title, icon, isExpanded, onToggle, badge, highlight, children }) => {
  return (
    <div className={`rounded-xl border ${highlight
        ? 'border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10'
        : 'border-slate-200 dark:border-navy-700'
      } overflow-hidden`}>
      <button
        onClick={onToggle}
        className={`w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-navy-800/50 transition-colors ${highlight ? 'hover:bg-amber-100/50 dark:hover:bg-amber-900/20' : ''
          }`}
      >
        <div className="flex items-center gap-3">
          {icon}
          <span className="font-bold text-slate-700 dark:text-white">{title}</span>
          {badge !== undefined && (
            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-full">
              {badge}
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-slate-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400" />
        )}
      </button>
      {isExpanded && (
        <div className="p-4 pt-0 animate-fade-in">
          {children}
        </div>
      )}
    </div>
  );
};

// Componente de grupo de entidades
const EntityGroup: React.FC<{
  label: string;
  icon: React.ReactNode;
  items: string[];
  color: 'blue' | 'purple' | 'emerald' | 'amber';
}> = ({ label, icon, items, color }) => {
  const colorClasses = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
    emerald: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
    amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
  };

  return (
    <div className="p-3 bg-slate-50 dark:bg-navy-800 rounded-xl">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
          {label}
        </span>
      </div>
      <div className="flex flex-wrap gap-1">
        {items.length === 0 ? (
          <span className="text-xs text-slate-400">Ninguna</span>
        ) : (
          items.slice(0, 5).map((item, idx) => (
            <span
              key={idx}
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${colorClasses[color]}`}
            >
              {item}
            </span>
          ))
        )}
        {items.length > 5 && (
          <span className="text-xs text-slate-400">+{items.length - 5} más</span>
        )}
      </div>
    </div>
  );
};

export default DocumentAnalysisPanel;
