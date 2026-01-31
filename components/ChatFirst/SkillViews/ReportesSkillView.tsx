// components/ChatFirst/SkillViews/ReportesSkillView.tsx
// Vista de Reportes - Generación y descarga de reportes Excel
import React, { useState } from 'react';
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
  Phone,
  FileSpreadsheet,
  Filter,
} from 'lucide-react';
import { Shipment, ShipmentStatus } from '../../../types';
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
  excelGenerator?: (shipments: Shipment[]) => void;
}

// ============================================
// FUNCIONES DE EXPORTACIÓN EXCEL
// ============================================

const formatDate = (date: Date | string | undefined): string => {
  if (!date) return 'N/A';
  const d = new Date(date);
  return d.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getLastMovement = (shipment: Shipment): { description: string; date: string } => {
  if (shipment.history && shipment.history.length > 0) {
    const last = shipment.history[shipment.history.length - 1];
    return {
      description: last.description || last.status || 'Sin descripción',
      date: formatDate(last.timestamp || last.date),
    };
  }
  return {
    description: shipment.status || 'Sin movimiento',
    date: formatDate(shipment.lastUpdate || shipment.date),
  };
};

const generateExcelReport = (
  shipments: Shipment[],
  reportName: string,
  filterFn?: (s: Shipment) => boolean
) => {
  const filteredShipments = filterFn ? shipments.filter(filterFn) : shipments;

  // Crear datos para Excel con las columnas principales
  const data = filteredShipments.map((s) => {
    const lastMovement = getLastMovement(s);
    return {
      'Número de Guía': s.trackingNumber || s.id,
      'Celular': s.phone || s.recipientPhone || 'N/A',
      'Estado': s.status || 'Sin estado',
      'Último Movimiento': lastMovement.description,
      'Fecha Último Movimiento': lastMovement.date,
      'Transportadora': s.carrier || 'N/A',
      'Ciudad Destino': s.destinationCity || s.city || 'N/A',
      'Destinatario': s.recipientName || s.recipient || 'N/A',
      'Días Transcurridos': s.daysInTransit || s.daysWithoutMovement || 0,
      'Valor': s.declaredValue || s.value || 0,
    };
  });

  // Crear workbook y worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);

  // Ajustar anchos de columna
  const colWidths = [
    { wch: 20 }, // Guía
    { wch: 15 }, // Celular
    { wch: 20 }, // Estado
    { wch: 35 }, // Último Movimiento
    { wch: 20 }, // Fecha
    { wch: 15 }, // Transportadora
    { wch: 20 }, // Ciudad
    { wch: 25 }, // Destinatario
    { wch: 10 }, // Días
    { wch: 12 }, // Valor
  ];
  ws['!cols'] = colWidths;

  // Agregar worksheet al workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Reporte');

  // Agregar hoja de resumen
  const resumen = [
    { Métrica: 'Total de Guías', Valor: filteredShipments.length },
    { Métrica: 'Entregadas', Valor: filteredShipments.filter(s => s.status === ShipmentStatus.DELIVERED).length },
    { Métrica: 'En Tránsito', Valor: filteredShipments.filter(s => s.status === ShipmentStatus.IN_TRANSIT).length },
    { Métrica: 'Con Novedad', Valor: filteredShipments.filter(s => s.status === ShipmentStatus.ISSUE || s.status === ShipmentStatus.EXCEPTION).length },
    { Métrica: 'Tasa de Entrega', Valor: `${filteredShipments.length > 0 ? Math.round((filteredShipments.filter(s => s.status === ShipmentStatus.DELIVERED).length / filteredShipments.length) * 100) : 0}%` },
    { Métrica: 'Fecha de Generación', Valor: new Date().toLocaleString('es-CO') },
  ];
  const wsResumen = XLSX.utils.json_to_sheet(resumen);
  wsResumen['!cols'] = [{ wch: 20 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');

  // Descargar archivo
  const fecha = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `${reportName}_${fecha}.xlsx`);
};

// Generadores específicos para cada tipo de reporte
const generateDailyReport = (shipments: Shipment[]) => {
  generateExcelReport(shipments, 'Reporte_Diario');
};

const generateCriticalReport = (shipments: Shipment[]) => {
  generateExcelReport(
    shipments,
    'Envios_Criticos',
    (s) => s.status === ShipmentStatus.ISSUE ||
           s.status === ShipmentStatus.EXCEPTION ||
           (s.daysWithoutMovement || 0) > 3 ||
           (s.daysInTransit || 0) > 5
  );
};

const generatePerformanceReport = (shipments: Shipment[]) => {
  // Agrupa por transportadora con métricas
  const byCarrier: Record<string, { total: number; delivered: number; issues: number }> = {};

  shipments.forEach((s) => {
    const carrier = s.carrier || 'Sin transportadora';
    if (!byCarrier[carrier]) {
      byCarrier[carrier] = { total: 0, delivered: 0, issues: 0 };
    }
    byCarrier[carrier].total++;
    if (s.status === ShipmentStatus.DELIVERED) byCarrier[carrier].delivered++;
    if (s.status === ShipmentStatus.ISSUE || s.status === ShipmentStatus.EXCEPTION) byCarrier[carrier].issues++;
  });

  const data = Object.entries(byCarrier).map(([carrier, stats]) => ({
    'Transportadora': carrier,
    'Total Guías': stats.total,
    'Entregadas': stats.delivered,
    'Con Novedad': stats.issues,
    'Tasa de Entrega': `${stats.total > 0 ? Math.round((stats.delivered / stats.total) * 100) : 0}%`,
    'Tasa de Novedad': `${stats.total > 0 ? Math.round((stats.issues / stats.total) * 100) : 0}%`,
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  ws['!cols'] = [{ wch: 20 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, ws, 'Rendimiento');

  // También agregar detalle de guías
  const wsDetail = XLSX.utils.json_to_sheet(shipments.map((s) => {
    const lastMovement = getLastMovement(s);
    return {
      'Guía': s.trackingNumber || s.id,
      'Celular': s.phone || s.recipientPhone || 'N/A',
      'Estado': s.status,
      'Movimiento': lastMovement.description,
      'Fecha': lastMovement.date,
      'Transportadora': s.carrier || 'N/A',
    };
  }));
  XLSX.utils.book_append_sheet(wb, wsDetail, 'Detalle');

  const fecha = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `Reporte_Rendimiento_${fecha}.xlsx`);
};

const generateCarriersReport = (shipments: Shipment[]) => {
  generateExcelReport(shipments, 'Reporte_Transportadoras');
};

const generateCitiesReport = (shipments: Shipment[]) => {
  // Agrupa por ciudad
  const byCity: Record<string, { total: number; delivered: number; issues: number; phones: string[] }> = {};

  shipments.forEach((s) => {
    const city = s.destinationCity || s.city || 'Sin ciudad';
    if (!byCity[city]) {
      byCity[city] = { total: 0, delivered: 0, issues: 0, phones: [] };
    }
    byCity[city].total++;
    if (s.status === ShipmentStatus.DELIVERED) byCity[city].delivered++;
    if (s.status === ShipmentStatus.ISSUE || s.status === ShipmentStatus.EXCEPTION) byCity[city].issues++;
    if (s.phone || s.recipientPhone) {
      byCity[city].phones.push(s.phone || s.recipientPhone || '');
    }
  });

  const data = Object.entries(byCity)
    .sort((a, b) => b[1].total - a[1].total)
    .map(([city, stats]) => ({
      'Ciudad': city,
      'Total Guías': stats.total,
      'Entregadas': stats.delivered,
      'Con Novedad': stats.issues,
      'Pendientes': stats.total - stats.delivered - stats.issues,
      'Tasa de Entrega': `${stats.total > 0 ? Math.round((stats.delivered / stats.total) * 100) : 0}%`,
    }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  ws['!cols'] = [{ wch: 25 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, ws, 'Por Ciudad');

  const fecha = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `Reporte_Ciudades_${fecha}.xlsx`);
};

const generateExecutiveReport = (shipments: Shipment[]) => {
  const delivered = shipments.filter(s => s.status === ShipmentStatus.DELIVERED).length;
  const inTransit = shipments.filter(s => s.status === ShipmentStatus.IN_TRANSIT).length;
  const issues = shipments.filter(s => s.status === ShipmentStatus.ISSUE || s.status === ShipmentStatus.EXCEPTION).length;

  const resumen = [
    { 'KPI': 'Total de Envíos', 'Valor': shipments.length, 'Detalle': '' },
    { 'KPI': 'Entregas Exitosas', 'Valor': delivered, 'Detalle': `${Math.round((delivered / shipments.length) * 100)}%` },
    { 'KPI': 'En Tránsito', 'Valor': inTransit, 'Detalle': `${Math.round((inTransit / shipments.length) * 100)}%` },
    { 'KPI': 'Con Novedades', 'Valor': issues, 'Detalle': `${Math.round((issues / shipments.length) * 100)}%` },
    { 'KPI': 'Pendientes', 'Valor': shipments.length - delivered - inTransit - issues, 'Detalle': '' },
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(resumen);
  ws['!cols'] = [{ wch: 20 }, { wch: 12 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, ws, 'Resumen Ejecutivo');

  // Top 10 ciudades problemáticas
  const cityIssues: Record<string, number> = {};
  shipments.filter(s => s.status === ShipmentStatus.ISSUE || s.status === ShipmentStatus.EXCEPTION).forEach((s) => {
    const city = s.destinationCity || s.city || 'Sin ciudad';
    cityIssues[city] = (cityIssues[city] || 0) + 1;
  });

  const topCities = Object.entries(cityIssues)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([city, count]) => ({ 'Ciudad': city, 'Novedades': count }));

  if (topCities.length > 0) {
    const wsCities = XLSX.utils.json_to_sheet(topCities);
    XLSX.utils.book_append_sheet(wb, wsCities, 'Ciudades Críticas');
  }

  const fecha = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `Resumen_Ejecutivo_${fecha}.xlsx`);
};

// ============================================
// TEMPLATES DE REPORTES
// ============================================

const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: 'daily',
    name: 'Reporte Diario',
    description: 'Todas las guías con celular, estado y movimientos',
    icon: Calendar,
    color: 'from-blue-500 to-cyan-500',
    prompt: 'Genera el reporte completo del dia de hoy',
    excelGenerator: generateDailyReport,
  },
  {
    id: 'critical',
    name: 'Envíos Críticos',
    description: 'Guías con novedades y sin movimiento (+3 días)',
    icon: AlertTriangle,
    color: 'from-red-500 to-orange-500',
    prompt: 'Genera reporte de envios criticos que necesitan atencion',
    excelGenerator: generateCriticalReport,
  },
  {
    id: 'performance',
    name: 'Rendimiento',
    description: 'Análisis por transportadora con tasas de entrega',
    icon: TrendingUp,
    color: 'from-emerald-500 to-teal-500',
    prompt: 'Genera reporte de rendimiento con tasas de entrega',
    excelGenerator: generatePerformanceReport,
  },
  {
    id: 'carriers',
    name: 'Por Transportadora',
    description: 'Detalle completo agrupado por transportadora',
    icon: Truck,
    color: 'from-purple-500 to-violet-500',
    prompt: 'Genera reporte comparativo de transportadoras',
    excelGenerator: generateCarriersReport,
  },
  {
    id: 'cities',
    name: 'Por Ciudad',
    description: 'Métricas desglosadas por ciudad destino',
    icon: BarChart3,
    color: 'from-amber-500 to-yellow-500',
    prompt: 'Genera reporte desglosado por ciudad',
    excelGenerator: generateCitiesReport,
  },
  {
    id: 'executive',
    name: 'Ejecutivo',
    description: 'Resumen KPIs para gerencia con ciudades críticas',
    icon: PieChart,
    color: 'from-indigo-500 to-purple-500',
    prompt: 'Genera un resumen ejecutivo para presentar a gerencia',
    excelGenerator: generateExecutiveReport,
  },
];

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export const ReportesSkillView: React.FC<ReportesSkillViewProps> = ({
  shipments,
  onGenerateReport,
  onChatQuery,
}) => {
  const [generatingReport, setGeneratingReport] = useState<string | null>(null);
  const [recentReports, setRecentReports] = useState<{ id: string; name: string; time: Date; count: number }[]>([]);

  // Quick stats para mostrar en reportes
  const stats = {
    total: shipments.length,
    delivered: shipments.filter(s => s.status === ShipmentStatus.DELIVERED).length,
    inTransit: shipments.filter(s => s.status === ShipmentStatus.IN_TRANSIT).length,
    issues: shipments.filter(s => s.status === ShipmentStatus.ISSUE || s.status === ShipmentStatus.EXCEPTION).length,
    withPhone: shipments.filter(s => s.phone || s.recipientPhone).length,
    deliveryRate: shipments.length > 0
      ? Math.round((shipments.filter(s => s.status === ShipmentStatus.DELIVERED).length / shipments.length) * 100)
      : 0,
  };

  const handleGenerateReport = async (template: ReportTemplate) => {
    if (shipments.length === 0) {
      alert('No hay guías cargadas para generar el reporte');
      return;
    }

    setGeneratingReport(template.id);

    try {
      // Generar Excel
      if (template.excelGenerator) {
        await new Promise(resolve => setTimeout(resolve, 500)); // Pequeña pausa para UX
        template.excelGenerator(shipments);
      }

      // Agregar a reportes recientes
      setRecentReports(prev => [
        { id: template.id, name: template.name, time: new Date(), count: shipments.length },
        ...prev.slice(0, 4),
      ]);

      onGenerateReport?.(template.id);
    } catch (error) {
      console.error('Error generando reporte:', error);
      alert('Error al generar el reporte. Intenta de nuevo.');
    } finally {
      setGeneratingReport(null);
    }
  };

  const handleDownloadRecent = (report: { id: string; name: string }) => {
    const template = REPORT_TEMPLATES.find(t => t.id === report.id);
    if (template?.excelGenerator) {
      template.excelGenerator(shipments);
    }
  };

  return (
    <div className="space-y-4">
      {/* Quick Stats Preview */}
      <div className="p-4 bg-gradient-to-r from-navy-800/80 to-navy-900/80 rounded-xl border border-white/10">
        <p className="text-xs text-slate-400 mb-3 flex items-center gap-1">
          <FileSpreadsheet className="w-3 h-3" />
          Datos disponibles para exportar
        </p>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
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
            <p className="text-[10px] text-slate-500">Tránsito</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-red-400">{stats.issues}</p>
            <p className="text-[10px] text-slate-500">Novedades</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-purple-400">{stats.withPhone}</p>
            <p className="text-[10px] text-slate-500">Con Cel</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-accent-400">{stats.deliveryRate}%</p>
            <p className="text-[10px] text-slate-500">Tasa</p>
          </div>
        </div>
      </div>

      {/* Columnas incluidas en reportes */}
      <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
        <p className="text-xs text-emerald-400 font-medium mb-2 flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          Columnas en cada reporte Excel:
        </p>
        <div className="flex flex-wrap gap-1">
          {['Guía', 'Celular', 'Estado', 'Movimiento', 'Fecha', 'Transportadora', 'Ciudad', 'Destinatario'].map((col) => (
            <span key={col} className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] rounded-full">
              {col}
            </span>
          ))}
        </div>
      </div>

      {/* Report Templates */}
      <div>
        <p className="text-sm font-medium text-slate-400 mb-3 flex items-center gap-2">
          <Download className="w-4 h-4" />
          Descargar Reporte Excel
        </p>
        <div className="grid grid-cols-2 gap-3">
          {REPORT_TEMPLATES.map((template) => (
            <button
              key={template.id}
              onClick={() => handleGenerateReport(template)}
              disabled={generatingReport !== null || shipments.length === 0}
              className={`p-4 rounded-xl text-left transition-all hover:scale-[1.02] ${
                generatingReport === template.id
                  ? 'bg-white/10 border-2 border-accent-500'
                  : shipments.length === 0
                    ? 'bg-white/5 border border-white/5 opacity-50 cursor-not-allowed'
                    : 'bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10'
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
                  <p className="font-medium text-white text-sm flex items-center gap-1">
                    {template.name}
                    <FileSpreadsheet className="w-3 h-3 text-emerald-400" />
                  </p>
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
            {recentReports.map((report, idx) => (
              <div
                key={`${report.id}-${idx}`}
                className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <div>
                    <p className="text-sm text-white">{report.name}</p>
                    <p className="text-xs text-slate-500">
                      {report.count} guías • {report.time.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDownloadRecent(report)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors flex items-center gap-1 text-emerald-400"
                >
                  <Download className="w-4 h-4" />
                  <span className="text-xs">Descargar</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Custom Report */}
      <div className="pt-3 border-t border-white/10">
        <p className="text-xs text-slate-500 mb-2">O pregunta por un reporte específico:</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onChatQuery?.('Dame las guías con más de 5 días sin movimiento')}
            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-slate-300"
          >
            Sin movimiento +5 días
          </button>
          <button
            onClick={() => onChatQuery?.('Cuáles guías tienen celular registrado y están pendientes?')}
            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-slate-300"
          >
            Pendientes con celular
          </button>
          <button
            onClick={() => onChatQuery?.('Lista las guías devueltas con teléfono del cliente')}
            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-slate-300"
          >
            Devueltas + teléfono
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportesSkillView;
