// components/ChatFirst/SkillViews/ReportesSkillView.tsx
// Vista simplificada de Reportes - Generacion rapida de informes
import React, { useState, useCallback } from 'react';
import {
  FileText,
  Download,
  Send,
  Calendar,
  TrendingUp,
  Package,
  Truck,
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2,
  ChevronRight,
  BarChart3,
  PieChart,
  FileSpreadsheet,
  Printer,
  ExternalLink,
} from 'lucide-react';
import { Shipment, ShipmentStatus } from '../../../types';
import {
  generateShipmentReport,
  generateDailyReport,
  openPDFInNewTab,
  printPDF,
  downloadPDF,
} from '../../../services/pdfService';
import * as XLSX from 'xlsx';

interface ReportesSkillViewProps {
  shipments: Shipment[];
  onGenerateReport?: (type: string) => void;
  onChatQuery?: (query: string) => void;
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  prompt: string;
}

interface RecentReport {
  id: string;
  name: string;
  time: Date;
  html: string;
  type: 'pdf' | 'excel';
  shipmentCount: number;
}

const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: 'daily',
    name: 'Reporte Diario',
    description: 'Resumen completo del dia con metricas clave',
    icon: Calendar,
    color: 'from-blue-500 to-cyan-500',
    prompt: 'Genera el reporte completo del dia de hoy',
  },
  {
    id: 'critical',
    name: 'Envios Criticos',
    description: 'Listado de envios que requieren atencion urgente',
    icon: AlertTriangle,
    color: 'from-red-500 to-orange-500',
    prompt: 'Genera reporte de envios criticos que necesitan atencion',
  },
  {
    id: 'performance',
    name: 'Rendimiento',
    description: 'Analisis de tasas de entrega y tiempos',
    icon: TrendingUp,
    color: 'from-emerald-500 to-teal-500',
    prompt: 'Genera reporte de rendimiento con tasas de entrega',
  },
  {
    id: 'carriers',
    name: 'Por Transportadora',
    description: 'Comparativa de rendimiento entre transportadoras',
    icon: Truck,
    color: 'from-purple-500 to-violet-500',
    prompt: 'Genera reporte comparativo de transportadoras',
  },
  {
    id: 'cities',
    name: 'Por Ciudad',
    description: 'Desglose de metricas por ciudad destino',
    icon: BarChart3,
    color: 'from-amber-500 to-yellow-500',
    prompt: 'Genera reporte desglosado por ciudad',
  },
  {
    id: 'executive',
    name: 'Ejecutivo',
    description: 'Resumen ejecutivo para gerencia',
    icon: PieChart,
    color: 'from-indigo-500 to-purple-500',
    prompt: 'Genera un resumen ejecutivo para presentar a gerencia',
  },
];

export const ReportesSkillView: React.FC<ReportesSkillViewProps> = ({
  shipments,
  onGenerateReport,
  onChatQuery,
}) => {
  const [generatingReport, setGeneratingReport] = useState<string | null>(null);
  const [recentReports, setRecentReports] = useState<RecentReport[]>([]);

  // Quick stats para mostrar en reportes
  const stats = {
    total: shipments.length,
    delivered: shipments.filter(s => s.status === ShipmentStatus.DELIVERED).length,
    inTransit: shipments.filter(s => s.status === ShipmentStatus.IN_TRANSIT).length,
    issues: shipments.filter(s => s.status === ShipmentStatus.ISSUE || s.status === ShipmentStatus.EXCEPTION).length,
    deliveryRate: shipments.length > 0
      ? Math.round((shipments.filter(s => s.status === ShipmentStatus.DELIVERED).length / shipments.length) * 100)
      : 0,
  };

  // Exportar a Excel - FUNCIONAL
  const exportToExcel = useCallback((data: Shipment[], filename: string) => {
    const wsData = data.map(s => ({
      'Guía': s.trackingNumber || s.id,
      'Transportadora': s.carrier || 'N/A',
      'Estado': s.status,
      'Destino': s.detailedInfo?.destination || 'N/A',
      'Días en Tránsito': s.detailedInfo?.daysInTransit || 0,
      'Teléfono': s.phone || 'N/A',
      'Última Actualización': s.detailedInfo?.lastUpdate || 'N/A',
    }));

    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Guías');

    // Ajustar ancho de columnas
    ws['!cols'] = [
      { wch: 20 }, { wch: 18 }, { wch: 12 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 20 }
    ];

    XLSX.writeFile(wb, `${filename}.xlsx`);
  }, []);

  // Generar reporte - FUNCIONAL
  const handleGenerateReport = async (template: ReportTemplate) => {
    if (shipments.length === 0) {
      onChatQuery?.('No hay guías cargadas para generar un reporte');
      return;
    }

    setGeneratingReport(template.id);

    try {
      let html = '';
      let filteredShipments = shipments;

      switch (template.id) {
        case 'daily':
          html = generateDailyReport(shipments);
          break;

        case 'critical':
          filteredShipments = shipments.filter(s => {
            const days = s.detailedInfo?.daysInTransit || 0;
            return days >= 5 || s.status === ShipmentStatus.ISSUE || s.status === ShipmentStatus.EXCEPTION;
          });
          html = generateShipmentReport({
            shipments: filteredShipments,
            status: 'Críticos'
          });
          break;

        case 'performance':
        case 'carriers':
        case 'cities':
        case 'executive':
        default:
          html = generateShipmentReport({ shipments });
          break;
      }

      // Abrir reporte en nueva pestaña
      openPDFInNewTab(html);

      // Agregar a reportes recientes con el HTML guardado
      setRecentReports(prev => [
        {
          id: `${template.id}-${Date.now()}`,
          name: template.name,
          time: new Date(),
          html,
          type: 'pdf',
          shipmentCount: filteredShipments.length,
        },
        ...prev.slice(0, 4),
      ]);

      onGenerateReport?.(template.id);
    } catch (error) {
      console.error('Error generando reporte:', error);
      onChatQuery?.('Hubo un error generando el reporte. Intenta de nuevo.');
    } finally {
      setGeneratingReport(null);
    }
  };

  // Descargar reporte reciente
  const handleDownloadReport = async (report: RecentReport) => {
    if (report.type === 'pdf') {
      await downloadPDF(report.html, `${report.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.png`);
    }
  };

  // Imprimir reporte
  const handlePrintReport = (report: RecentReport) => {
    if (report.type === 'pdf') {
      printPDF(report.html);
    }
  };

  // Exportar como Excel
  const handleExportExcel = (templateId: string) => {
    let data = shipments;
    let filename = 'reporte_guias';

    if (templateId === 'critical') {
      data = shipments.filter(s => {
        const days = s.detailedInfo?.daysInTransit || 0;
        return days >= 5 || s.status === ShipmentStatus.ISSUE || s.status === ShipmentStatus.EXCEPTION;
      });
      filename = 'guias_criticas';
    }

    exportToExcel(data, filename);
  };

  return (
    <div className="space-y-4">
      {/* Quick Stats Preview */}
      <div className="p-4 bg-gradient-to-r from-navy-800/80 to-navy-900/80 rounded-xl border border-white/10">
        <p className="text-xs text-slate-400 mb-3 flex items-center gap-1">
          <FileText className="w-3 h-3" />
          Datos disponibles para reportes
        </p>
        <div className="grid grid-cols-5 gap-3">
          <div className="text-center">
            <p className="text-xl font-bold text-white">{stats.total}</p>
            <p className="text-[10px] text-slate-500">Total</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-emerald-400">{stats.delivered}</p>
            <p className="text-[10px] text-slate-500">Entregados</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-blue-400">{stats.inTransit}</p>
            <p className="text-[10px] text-slate-500">Transito</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-red-400">{stats.issues}</p>
            <p className="text-[10px] text-slate-500">Novedades</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-accent-400">{stats.deliveryRate}%</p>
            <p className="text-[10px] text-slate-500">Tasa</p>
          </div>
        </div>
      </div>

      {/* Report Templates */}
      <div>
        <p className="text-sm font-medium text-slate-400 mb-3">Generar Reporte</p>
        <div className="grid grid-cols-2 gap-3">
          {REPORT_TEMPLATES.map((template) => (
            <button
              key={template.id}
              onClick={() => handleGenerateReport(template)}
              disabled={generatingReport !== null}
              className={`p-4 rounded-xl text-left transition-all hover:scale-[1.02] ${
                generatingReport === template.id
                  ? 'bg-white/10 border-2 border-accent-500'
                  : 'bg-white/5 border border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg bg-gradient-to-br ${template.color}`}>
                  {generatingReport === template.id ? (
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  ) : (
                    <template.icon className="w-5 h-5 text-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white text-sm">{template.name}</p>
                  <p className="text-xs text-slate-400 truncate">{template.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Reports */}
      {recentReports.length > 0 && (
        <div>
          <p className="text-sm font-medium text-slate-400 mb-3">Reportes Generados</p>
          <div className="space-y-2">
            {recentReports.map((report) => (
              <div
                key={report.id}
                className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <div>
                    <p className="text-sm text-white">{report.name}</p>
                    <p className="text-xs text-slate-500">
                      {report.time.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })} • {report.shipmentCount} guías
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openPDFInNewTab(report.html)}
                    className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                    title="Ver reporte"
                  >
                    <ExternalLink className="w-4 h-4 text-blue-400" />
                  </button>
                  <button
                    onClick={() => handleDownloadReport(report)}
                    className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                    title="Descargar"
                  >
                    <Download className="w-4 h-4 text-emerald-400" />
                  </button>
                  <button
                    onClick={() => handlePrintReport(report)}
                    className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                    title="Imprimir"
                  >
                    <Printer className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Export Section */}
      <div className="pt-3 border-t border-white/10">
        <p className="text-sm font-medium text-slate-400 mb-3">Exportar Datos</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => exportToExcel(shipments, 'todas_las_guias')}
            className="flex items-center justify-center gap-2 p-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-400 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span className="text-xs font-medium">Excel - Todas ({stats.total})</span>
          </button>
          <button
            onClick={() => handleExportExcel('critical')}
            className="flex items-center justify-center gap-2 p-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span className="text-xs font-medium">Excel - Críticas ({stats.issues})</span>
          </button>
        </div>
      </div>

      {/* Custom Report */}
      <div className="pt-3 border-t border-white/10">
        <p className="text-xs text-slate-500 mb-2">O pide un reporte personalizado:</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onChatQuery?.('Comparame esta semana vs la semana pasada')}
            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-slate-300"
          >
            Comparativo semanal
          </button>
          <button
            onClick={() => onChatQuery?.('Cuales fueron los 10 envios mas problematicos?')}
            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-slate-300"
          >
            Top problematicos
          </button>
          <button
            onClick={() => onChatQuery?.('Dame las estadisticas de entregas exitosas')}
            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-slate-300"
          >
            Stats de exito
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportesSkillView;
