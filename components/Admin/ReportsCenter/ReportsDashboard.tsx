// components/Admin/ReportsCenter/ReportsDashboard.tsx
// Dashboard de Reportes Avanzados

import React, { useState } from 'react';
import {
  FileText,
  Download,
  Calendar,
  Clock,
  Play,
  Pause,
  Trash2,
  Plus,
  Eye,
  Settings,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  ShoppingCart,
  Truck,
  Users,
  Package,
  LineChart,
  Megaphone,
  ChevronRight,
  X,
  Mail,
  FileSpreadsheet,
  FileJson
} from 'lucide-react';
import {
  useReports,
  REPORT_TEMPLATES,
  type ReportTemplate,
  type GeneratedReport,
  type ScheduledReport,
  type ReportFrequency,
  type ExportFormat
} from '../../../services/reportsService';

export function ReportsDashboard() {
  const {
    templates,
    scheduledReports,
    generatedReports,
    isGenerating,
    generateReport,
    scheduleReport,
    deleteScheduledReport,
    toggleScheduledReport,
    deleteGeneratedReport,
    exportReport,
    recentReports,
    activeScheduled,
  } = useReports();

  const [activeTab, setActiveTab] = useState<'generate' | 'scheduled' | 'history'>('generate');
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [viewingReport, setViewingReport] = useState<GeneratedReport | null>(null);
  const [scheduleForm, setScheduleForm] = useState({
    name: '',
    frequency: 'monthly' as ReportFrequency,
    recipients: '',
    exportFormat: 'pdf' as ExportFormat,
  });

  const getTemplateIcon = (iconName: string) => {
    const icons: Record<string, React.ReactNode> = {
      ShoppingCart: <ShoppingCart className="w-6 h-6" />,
      TrendingUp: <TrendingUp className="w-6 h-6" />,
      Megaphone: <Megaphone className="w-6 h-6" />,
      Truck: <Truck className="w-6 h-6" />,
      Package: <Package className="w-6 h-6" />,
      Users: <Users className="w-6 h-6" />,
      LineChart: <LineChart className="w-6 h-6" />,
    };
    return icons[iconName] || <FileText className="w-6 h-6" />;
  };

  const getHighlightIcon = (type: string) => {
    switch (type) {
      case 'positive': return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'negative': return <TrendingDown className="w-4 h-4 text-red-400" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      default: return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const getHighlightColor = (type: string) => {
    switch (type) {
      case 'positive': return 'border-green-500/50 bg-green-500/10';
      case 'negative': return 'border-red-500/50 bg-red-500/10';
      case 'warning': return 'border-yellow-500/50 bg-yellow-500/10';
      default: return 'border-gray-500/50 bg-gray-500/10';
    }
  };

  const handleGenerateReport = async (template: ReportTemplate) => {
    const report = await generateReport(template.id, template.defaultFilters);
    setViewingReport(report);
  };

  const handleScheduleReport = () => {
    if (!selectedTemplate || !scheduleForm.name) return;

    const nextRun = new Date();
    switch (scheduleForm.frequency) {
      case 'daily': nextRun.setDate(nextRun.getDate() + 1); break;
      case 'weekly': nextRun.setDate(nextRun.getDate() + 7); break;
      case 'monthly': nextRun.setMonth(nextRun.getMonth() + 1); break;
      case 'quarterly': nextRun.setMonth(nextRun.getMonth() + 3); break;
      case 'yearly': nextRun.setFullYear(nextRun.getFullYear() + 1); break;
    }

    scheduleReport({
      templateId: selectedTemplate.id,
      name: scheduleForm.name,
      frequency: scheduleForm.frequency,
      nextRunDate: nextRun.toISOString(),
      recipients: scheduleForm.recipients.split(',').map(e => e.trim()).filter(Boolean),
      exportFormat: scheduleForm.exportFormat,
      filters: selectedTemplate.defaultFilters,
      isActive: true,
    });

    setShowScheduleModal(false);
    setScheduleForm({ name: '', frequency: 'monthly', recipients: '', exportFormat: 'pdf' });
    setSelectedTemplate(null);
  };

  const handleExport = (reportId: string, format: ExportFormat) => {
    exportReport(reportId, format);
    // Simular descarga
    alert(`Reporte exportado como ${format.toUpperCase()}`);
  };

  const frequencyLabels: Record<ReportFrequency, string> = {
    daily: 'Diario',
    weekly: 'Semanal',
    monthly: 'Mensual',
    quarterly: 'Trimestral',
    yearly: 'Anual',
    once: 'Una vez',
  };

  const tabs = [
    { id: 'generate', label: 'Generar Reporte', icon: FileText },
    { id: 'scheduled', label: 'Programados', icon: Calendar, count: activeScheduled.length },
    { id: 'history', label: 'Historial', icon: Clock, count: generatedReports.length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500/20 rounded-xl">
            <FileText className="w-8 h-8 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Centro de Reportes</h2>
            <p className="text-gray-400">Genera y programa reportes profesionales de tu negocio</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Reportes Este Mes</p>
              <p className="text-2xl font-bold text-white">{generatedReports.length}</p>
            </div>
            <div className="p-3 bg-indigo-500/20 rounded-lg">
              <FileText className="w-6 h-6 text-indigo-400" />
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Reportes Programados</p>
              <p className="text-2xl font-bold text-white">{activeScheduled.length}</p>
            </div>
            <div className="p-3 bg-green-500/20 rounded-lg">
              <Calendar className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Templates Disponibles</p>
              <p className="text-2xl font-bold text-white">{templates.length}</p>
            </div>
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <Settings className="w-6 h-6 text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-700 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className={`px-2 py-0.5 text-xs rounded-full ${
                activeTab === tab.id ? 'bg-indigo-500' : 'bg-gray-600'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {/* Generate Tab */}
        {activeTab === 'generate' && (
          <div className="space-y-6">
            <p className="text-gray-400">Selecciona un tipo de reporte para generar</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="bg-gray-800/50 rounded-xl border border-gray-700 p-4 hover:border-indigo-500/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                      {getTemplateIcon(template.icon)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-white">{template.name}</h3>
                      <p className="text-sm text-gray-400 mt-1">{template.description}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => handleGenerateReport(template)}
                      disabled={isGenerating}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm"
                    >
                      {isGenerating ? (
                        <>
                          <Clock className="w-4 h-4 animate-spin" />
                          Generando...
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          Generar
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedTemplate(template);
                        setScheduleForm({ ...scheduleForm, name: `${template.name} Automático` });
                        setShowScheduleModal(true);
                      }}
                      className="px-3 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 text-sm"
                    >
                      <Calendar className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Scheduled Tab */}
        {activeTab === 'scheduled' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-gray-400">
                {scheduledReports.length} reportes programados
              </p>
            </div>

            <div className="space-y-3">
              {scheduledReports.map((scheduled) => {
                const template = templates.find(t => t.id === scheduled.templateId);
                return (
                  <div
                    key={scheduled.id}
                    className={`bg-gray-800/50 rounded-xl border p-4 ${
                      scheduled.isActive ? 'border-green-500/50' : 'border-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          scheduled.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'
                        }`}>
                          {template && getTemplateIcon(template.icon)}
                        </div>
                        <div>
                          <h4 className="font-medium text-white">{scheduled.name}</h4>
                          <div className="flex items-center gap-3 text-sm text-gray-400 mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {frequencyLabels[scheduled.frequency]}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Próximo: {new Date(scheduled.nextRunDate).toLocaleDateString('es-CO')}
                            </span>
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {scheduled.recipients.length} destinatarios
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs rounded ${
                          scheduled.exportFormat === 'pdf' ? 'bg-red-500/20 text-red-400' :
                          scheduled.exportFormat === 'excel' ? 'bg-green-500/20 text-green-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {scheduled.exportFormat.toUpperCase()}
                        </span>
                        <button
                          onClick={() => toggleScheduledReport(scheduled.id)}
                          className={`p-2 rounded-lg ${
                            scheduled.isActive
                              ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                              : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                          }`}
                        >
                          {scheduled.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => deleteScheduledReport(scheduled.id)}
                          className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {scheduledReports.length === 0 && (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 mb-2">No hay reportes programados</p>
                <p className="text-sm text-gray-500">
                  Programa reportes automáticos desde la pestaña "Generar Reporte"
                </p>
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-gray-400">
                {generatedReports.length} reportes generados
              </p>
            </div>

            <div className="space-y-3">
              {generatedReports.map((report) => {
                const template = templates.find(t => t.id === report.templateId);
                return (
                  <div
                    key={report.id}
                    className="bg-gray-800/50 rounded-xl border border-gray-700 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                          {template && getTemplateIcon(template.icon)}
                        </div>
                        <div>
                          <h4 className="font-medium text-white">{report.name}</h4>
                          <p className="text-sm text-gray-400">
                            Generado: {new Date(report.generatedAt).toLocaleString('es-CO')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setViewingReport(report)}
                          className="flex items-center gap-2 px-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 text-sm"
                        >
                          <Eye className="w-4 h-4" />
                          Ver
                        </button>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleExport(report.id, 'pdf')}
                            className="p-2 rounded-lg text-red-400 hover:bg-red-500/20"
                            title="Exportar PDF"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleExport(report.id, 'excel')}
                            className="p-2 rounded-lg text-green-400 hover:bg-green-500/20"
                            title="Exportar Excel"
                          >
                            <FileSpreadsheet className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleExport(report.id, 'json')}
                            className="p-2 rounded-lg text-blue-400 hover:bg-blue-500/20"
                            title="Exportar JSON"
                          >
                            <FileJson className="w-4 h-4" />
                          </button>
                        </div>
                        <button
                          onClick={() => deleteGeneratedReport(report.id)}
                          className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Highlights Preview */}
                    {report.highlights.length > 0 && (
                      <div className="flex gap-3 mt-3 overflow-x-auto pb-2">
                        {report.highlights.map((highlight, idx) => (
                          <div
                            key={idx}
                            className={`flex-shrink-0 px-3 py-2 rounded-lg border ${getHighlightColor(highlight.type)}`}
                          >
                            <div className="flex items-center gap-2">
                              {getHighlightIcon(highlight.type)}
                              <span className="text-sm font-medium text-white">{highlight.title}</span>
                              <span className="text-sm text-gray-300">{highlight.value}</span>
                              {highlight.change !== undefined && (
                                <span className={`text-xs ${
                                  highlight.change > 0 ? 'text-green-400' : 'text-red-400'
                                }`}>
                                  {highlight.change > 0 ? '+' : ''}{highlight.change}%
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {generatedReports.length === 0 && (
              <div className="text-center py-12">
                <Clock className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 mb-2">No hay reportes generados</p>
                <button
                  onClick={() => setActiveTab('generate')}
                  className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Generar Primer Reporte
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && selectedTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Programar Reporte</h3>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="p-1 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Tipo de Reporte</label>
                <div className="flex items-center gap-2 p-3 bg-gray-700/50 rounded-lg">
                  <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                    {getTemplateIcon(selectedTemplate.icon)}
                  </div>
                  <span className="text-white">{selectedTemplate.name}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Nombre del Reporte</label>
                <input
                  type="text"
                  value={scheduleForm.name}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  placeholder="Ej: Reporte Mensual de Ventas"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Frecuencia</label>
                <select
                  value={scheduleForm.frequency}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, frequency: e.target.value as ReportFrequency })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                >
                  <option value="daily">Diario</option>
                  <option value="weekly">Semanal</option>
                  <option value="monthly">Mensual</option>
                  <option value="quarterly">Trimestral</option>
                  <option value="yearly">Anual</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Formato de Exportación</label>
                <select
                  value={scheduleForm.exportFormat}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, exportFormat: e.target.value as ExportFormat })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                >
                  <option value="pdf">PDF</option>
                  <option value="excel">Excel</option>
                  <option value="csv">CSV</option>
                  <option value="json">JSON</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Destinatarios (emails separados por coma)
                </label>
                <input
                  type="text"
                  value={scheduleForm.recipients}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, recipients: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  placeholder="email@ejemplo.com, otro@ejemplo.com"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700"
              >
                Cancelar
              </button>
              <button
                onClick={handleScheduleReport}
                disabled={!scheduleForm.name}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                Programar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Report Modal */}
      {viewingReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-gray-700">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <div>
                <h3 className="text-lg font-semibold text-white">{viewingReport.name}</h3>
                <p className="text-sm text-gray-400">
                  {new Date(viewingReport.period.start).toLocaleDateString('es-CO')} - {' '}
                  {new Date(viewingReport.period.end).toLocaleDateString('es-CO')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExport(viewingReport.id, 'pdf')}
                  className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                >
                  <Download className="w-4 h-4" />
                  PDF
                </button>
                <button
                  onClick={() => handleExport(viewingReport.id, 'excel')}
                  className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                >
                  <Download className="w-4 h-4" />
                  Excel
                </button>
                <button
                  onClick={() => setViewingReport(null)}
                  className="p-2 text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              {/* Highlights */}
              {viewingReport.highlights.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-400 mb-3">PUNTOS DESTACADOS</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {viewingReport.highlights.map((highlight, idx) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-xl border ${getHighlightColor(highlight.type)}`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {getHighlightIcon(highlight.type)}
                          <span className="text-sm text-gray-400">{highlight.title}</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold text-white">{highlight.value}</span>
                          {highlight.change !== undefined && (
                            <span className={`text-sm ${
                              highlight.change > 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {highlight.change > 0 ? '↑' : '↓'} {Math.abs(highlight.change)}%
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{highlight.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Report Data */}
              <div className="space-y-6">
                <div className="bg-gray-700/30 rounded-xl p-4">
                  <h4 className="text-sm font-medium text-gray-400 mb-3">RESUMEN</h4>
                  <p className="text-white">{viewingReport.summary}</p>
                </div>

                {/* Render data based on report type */}
                {viewingReport.type === 'sales_summary' && viewingReport.data.topProducts && (
                  <div className="bg-gray-700/30 rounded-xl p-4">
                    <h4 className="text-sm font-medium text-gray-400 mb-3">TOP PRODUCTOS</h4>
                    <table className="w-full">
                      <thead>
                        <tr className="text-gray-400 text-sm">
                          <th className="text-left py-2">Producto</th>
                          <th className="text-right py-2">Ventas</th>
                          <th className="text-right py-2">Unidades</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewingReport.data.topProducts.map((product: any, idx: number) => (
                          <tr key={idx} className="border-t border-gray-700">
                            <td className="py-2 text-white">{product.name}</td>
                            <td className="py-2 text-right text-green-400">
                              ${product.sales.toLocaleString()}
                            </td>
                            <td className="py-2 text-right text-gray-300">{product.units}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {viewingReport.type === 'advertising_performance' && viewingReport.data.platforms && (
                  <div className="bg-gray-700/30 rounded-xl p-4">
                    <h4 className="text-sm font-medium text-gray-400 mb-3">RENDIMIENTO POR PLATAFORMA</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(viewingReport.data.platforms).map(([platform, data]: [string, any]) => (
                        <div key={platform} className="bg-gray-800 rounded-lg p-3">
                          <p className="text-sm text-gray-400 capitalize">{platform}</p>
                          <p className="text-xl font-bold text-white">{data.roas}x ROAS</p>
                          <p className="text-xs text-gray-500">
                            Inversión: ${data.spend.toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {viewingReport.type === 'delivery_analysis' && viewingReport.data.byRegion && (
                  <div className="bg-gray-700/30 rounded-xl p-4">
                    <h4 className="text-sm font-medium text-gray-400 mb-3">ENTREGAS POR REGIÓN</h4>
                    <table className="w-full">
                      <thead>
                        <tr className="text-gray-400 text-sm">
                          <th className="text-left py-2">Región</th>
                          <th className="text-right py-2">Órdenes</th>
                          <th className="text-right py-2">Tasa Entrega</th>
                          <th className="text-right py-2">Días Promedio</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(viewingReport.data.byRegion).map(([region, data]: [string, any]) => (
                          <tr key={region} className="border-t border-gray-700">
                            <td className="py-2 text-white">{region}</td>
                            <td className="py-2 text-right text-gray-300">{data.orders}</td>
                            <td className={`py-2 text-right ${
                              data.deliveryRate > 0.85 ? 'text-green-400' :
                              data.deliveryRate > 0.75 ? 'text-yellow-400' : 'text-red-400'
                            }`}>
                              {(data.deliveryRate * 100).toFixed(0)}%
                            </td>
                            <td className="py-2 text-right text-gray-300">{data.avgDays}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReportsDashboard;
