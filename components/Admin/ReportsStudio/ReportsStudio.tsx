// ============================================
// LITPER PRO - REPORTS STUDIO
// Generador avanzado de reportes con templates
// ============================================

import React, { useState } from 'react';
import {
  FileText,
  Download,
  Send,
  Calendar,
  Filter,
  PlusCircle,
  Copy,
  Trash2,
  Edit2,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  BarChart3,
  PieChart,
  TrendingUp,
  Package,
  DollarSign,
  Truck,
  Users,
  Mail,
  Share2,
  Printer,
  FileSpreadsheet,
  FilePdf,
  Settings,
  Sparkles,
  Zap,
  Star,
  ChevronRight,
} from 'lucide-react';

// ============================================
// TIPOS
// ============================================

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  category: 'operaciones' | 'finanzas' | 'clientes' | 'rendimiento';
  isPremium?: boolean;
  lastUsed?: Date;
}

interface ScheduledReport {
  id: string;
  templateId: string;
  name: string;
  frequency: 'diario' | 'semanal' | 'mensual';
  recipients: string[];
  nextRun: Date;
  enabled: boolean;
}

interface GeneratedReport {
  id: string;
  name: string;
  template: string;
  generatedAt: Date;
  format: 'pdf' | 'excel' | 'csv';
  size: string;
  status: 'completed' | 'processing' | 'failed';
}

// ============================================
// DATOS MOCK
// ============================================

const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: 'resumen-diario',
    name: 'Resumen Diario',
    description: 'Resumen completo de operaciones del día',
    icon: BarChart3,
    color: 'from-blue-500 to-cyan-500',
    category: 'operaciones',
  },
  {
    id: 'entregas-ciudad',
    name: 'Entregas por Ciudad',
    description: 'Análisis detallado por ubicación',
    icon: Package,
    color: 'from-emerald-500 to-green-500',
    category: 'operaciones',
  },
  {
    id: 'rendimiento-transportadoras',
    name: 'Rendimiento Transportadoras',
    description: 'Comparativa de performance por carrier',
    icon: Truck,
    color: 'from-amber-500 to-orange-500',
    category: 'rendimiento',
  },
  {
    id: 'pyl-mensual',
    name: 'P&L Mensual',
    description: 'Estado de pérdidas y ganancias',
    icon: DollarSign,
    color: 'from-green-500 to-emerald-500',
    category: 'finanzas',
  },
  {
    id: 'analisis-clientes',
    name: 'Análisis de Clientes',
    description: 'Segmentación y comportamiento',
    icon: Users,
    color: 'from-purple-500 to-violet-500',
    category: 'clientes',
    isPremium: true,
  },
  {
    id: 'tendencias-ventas',
    name: 'Tendencias de Ventas',
    description: 'Proyecciones y análisis predictivo',
    icon: TrendingUp,
    color: 'from-pink-500 to-rose-500',
    category: 'finanzas',
    isPremium: true,
  },
  {
    id: 'novedades-detalle',
    name: 'Detalle de Novedades',
    description: 'Análisis de problemas y causas',
    icon: XCircle,
    color: 'from-red-500 to-rose-500',
    category: 'operaciones',
  },
  {
    id: 'roi-marketing',
    name: 'ROI Marketing',
    description: 'Retorno de inversión publicitaria',
    icon: PieChart,
    color: 'from-indigo-500 to-purple-500',
    category: 'finanzas',
    isPremium: true,
  },
];

const SCHEDULED_REPORTS: ScheduledReport[] = [
  {
    id: '1',
    templateId: 'resumen-diario',
    name: 'Reporte Diario 8am',
    frequency: 'diario',
    recipients: ['admin@litper.co', 'gerencia@litper.co'],
    nextRun: new Date(Date.now() + 12 * 60 * 60 * 1000),
    enabled: true,
  },
  {
    id: '2',
    templateId: 'pyl-mensual',
    name: 'P&L Fin de Mes',
    frequency: 'mensual',
    recipients: ['contabilidad@litper.co'],
    nextRun: new Date('2024-01-31'),
    enabled: true,
  },
];

const RECENT_REPORTS: GeneratedReport[] = [
  {
    id: '1',
    name: 'Resumen_Diario_2024-01-15.pdf',
    template: 'Resumen Diario',
    generatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    format: 'pdf',
    size: '1.2 MB',
    status: 'completed',
  },
  {
    id: '2',
    name: 'Entregas_Bogota_Enero.xlsx',
    template: 'Entregas por Ciudad',
    generatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    format: 'excel',
    size: '856 KB',
    status: 'completed',
  },
  {
    id: '3',
    name: 'PYL_Diciembre_2023.pdf',
    template: 'P&L Mensual',
    generatedAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
    format: 'pdf',
    size: '2.4 MB',
    status: 'completed',
  },
];

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export const ReportsStudio: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'templates' | 'scheduled' | 'history'>('templates');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);

  const categories = [
    { id: 'todos', label: 'Todos' },
    { id: 'operaciones', label: 'Operaciones' },
    { id: 'finanzas', label: 'Finanzas' },
    { id: 'clientes', label: 'Clientes' },
    { id: 'rendimiento', label: 'Rendimiento' },
  ];

  const filteredTemplates = REPORT_TEMPLATES.filter(
    t => selectedCategory === 'todos' || t.category === selectedCategory
  );

  const handleGenerateReport = (template: ReportTemplate) => {
    setSelectedTemplate(template);
    setShowGenerateModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl shadow-xl shadow-cyan-500/30">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Reports Studio</h1>
            <p className="text-slate-400">Genera y programa reportes personalizados</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-medium shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all">
            <PlusCircle className="w-5 h-5" />
            Crear Template
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-navy-700 pb-2">
        {[
          { id: 'templates', label: 'Templates', icon: FileText },
          { id: 'scheduled', label: 'Programados', icon: Clock },
          { id: 'history', label: 'Historial', icon: Download },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-cyan-600 text-white'
                  : 'text-slate-400 hover:bg-navy-700 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <>
          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-navy-800 text-slate-400 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Templates Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredTemplates.map((template) => {
              const Icon = template.icon;
              return (
                <div
                  key={template.id}
                  className="group p-5 bg-navy-800/50 rounded-2xl border border-navy-700 hover:border-navy-600 transition-all cursor-pointer"
                  onClick={() => handleGenerateReport(template)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${template.color}`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    {template.isPremium && (
                      <span className="px-2 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded">
                        PRO
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-white mb-1 group-hover:text-cyan-400 transition-colors">
                    {template.name}
                  </h3>
                  <p className="text-sm text-slate-400 mb-4">{template.description}</p>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 capitalize">{template.category}</span>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Scheduled Tab */}
      {activeTab === 'scheduled' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white">Reportes Programados</h3>
            <button className="flex items-center gap-2 px-3 py-1.5 bg-navy-700 hover:bg-navy-600 text-slate-300 rounded-lg text-sm transition-all">
              <PlusCircle className="w-4 h-4" />
              Nuevo
            </button>
          </div>

          {SCHEDULED_REPORTS.map((report) => (
            <div
              key={report.id}
              className="p-4 bg-navy-800/50 rounded-xl border border-navy-700 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg ${report.enabled ? 'bg-emerald-500/20' : 'bg-slate-700'}`}>
                  <Clock className={`w-5 h-5 ${report.enabled ? 'text-emerald-400' : 'text-slate-500'}`} />
                </div>
                <div>
                  <h4 className="font-medium text-white">{report.name}</h4>
                  <p className="text-sm text-slate-400">
                    {report.frequency} • {report.recipients.length} destinatarios
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-slate-300">Próxima ejecución</p>
                  <p className="text-xs text-slate-400">
                    {report.nextRun.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-navy-700 rounded-lg text-slate-400 hover:text-white transition-all">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button className="p-2 hover:bg-navy-700 rounded-lg text-slate-400 hover:text-red-400 transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="bg-navy-800/50 rounded-2xl border border-navy-700 overflow-hidden">
          <div className="p-4 border-b border-navy-700 flex items-center justify-between">
            <h3 className="font-semibold text-white">Reportes Generados</h3>
            <button className="text-sm text-cyan-400 hover:text-cyan-300">
              Limpiar historial
            </button>
          </div>

          <div className="divide-y divide-navy-700">
            {RECENT_REPORTS.map((report) => (
              <div
                key={report.id}
                className="p-4 flex items-center justify-between hover:bg-navy-700/30 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${
                    report.format === 'pdf' ? 'bg-red-500/20' : 'bg-emerald-500/20'
                  }`}>
                    {report.format === 'pdf' ? (
                      <FilePdf className="w-5 h-5 text-red-400" />
                    ) : (
                      <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium text-white">{report.name}</h4>
                    <p className="text-sm text-slate-400">
                      {report.template} • {report.size}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-sm text-slate-400">
                    {report.generatedAt.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-navy-700 rounded-lg text-slate-400 hover:text-cyan-400 transition-all">
                      <Download className="w-4 h-4" />
                    </button>
                    <button className="p-2 hover:bg-navy-700 rounded-lg text-slate-400 hover:text-white transition-all">
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button className="p-2 hover:bg-navy-700 rounded-lg text-slate-400 hover:text-red-400 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generate Modal */}
      {showGenerateModal && selectedTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-navy-800 rounded-2xl border border-navy-700 w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-navy-700">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${selectedTemplate.color}`}>
                  {React.createElement(selectedTemplate.icon, { className: 'w-6 h-6 text-white' })}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{selectedTemplate.name}</h3>
                  <p className="text-sm text-slate-400">{selectedTemplate.description}</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Rango de fechas</label>
                <div className="flex gap-3">
                  <input
                    type="date"
                    className="flex-1 px-3 py-2 bg-navy-700 border border-navy-600 rounded-lg text-white"
                    defaultValue={new Date().toISOString().split('T')[0]}
                  />
                  <input
                    type="date"
                    className="flex-1 px-3 py-2 bg-navy-700 border border-navy-600 rounded-lg text-white"
                    defaultValue={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Formato de salida</label>
                <div className="flex gap-3">
                  {['PDF', 'Excel', 'CSV'].map((format) => (
                    <button
                      key={format}
                      className="flex-1 px-4 py-2 bg-navy-700 hover:bg-navy-600 border border-navy-600 rounded-lg text-slate-300 hover:text-white transition-all"
                    >
                      {format}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Enviar por email</label>
                <input
                  type="email"
                  placeholder="email@ejemplo.com (opcional)"
                  className="w-full px-3 py-2 bg-navy-700 border border-navy-600 rounded-lg text-white placeholder-slate-500"
                />
              </div>
            </div>

            <div className="p-6 border-t border-navy-700 flex gap-3">
              <button
                onClick={() => setShowGenerateModal(false)}
                className="flex-1 px-4 py-2 bg-navy-700 hover:bg-navy-600 text-slate-300 rounded-lg transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setShowGenerateModal(false);
                  // TODO: Generate report
                }}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-medium hover:opacity-90 transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Generar Reporte
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsStudio;
