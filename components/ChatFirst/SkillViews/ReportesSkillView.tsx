// components/ChatFirst/SkillViews/ReportesSkillView.tsx
// Vista completa de Reportes - Generacion de informes personalizables
import React, { useState, useCallback, useMemo } from 'react';
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
  Filter,
  Settings,
  Eye,
  X,
  Check,
  ChevronDown,
  MapPin,
  Building2,
} from 'lucide-react';
import { Shipment, ShipmentStatus } from '../../../types';
import {
  generateShipmentReport,
  generateDailyReport,
  generatePerformanceReport,
  generateCarrierReport,
  generateCityReport,
  generateExecutiveReport,
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

// Columnas disponibles para Excel
interface ExcelColumn {
  id: string;
  label: string;
  accessor: (s: Shipment) => string | number;
  width: number;
}

const AVAILABLE_COLUMNS: ExcelColumn[] = [
  { id: 'guia', label: 'Número de Guía', accessor: s => s.trackingNumber || s.id, width: 20 },
  { id: 'carrier', label: 'Transportadora', accessor: s => s.carrier || 'N/A', width: 18 },
  { id: 'status', label: 'Estado', accessor: s => s.status, width: 12 },
  { id: 'destination', label: 'Ciudad Destino', accessor: s => s.detailedInfo?.destination || s.detailedInfo?.city || 'N/A', width: 25 },
  { id: 'days', label: 'Días en Tránsito', accessor: s => s.detailedInfo?.daysInTransit || 0, width: 15 },
  { id: 'phone', label: 'Teléfono', accessor: s => s.phone || 'N/A', width: 15 },
  { id: 'lastUpdate', label: 'Última Actualización', accessor: s => s.detailedInfo?.lastUpdate || 'N/A', width: 20 },
  { id: 'recipient', label: 'Destinatario', accessor: s => s.detailedInfo?.recipient || 'N/A', width: 25 },
  { id: 'address', label: 'Dirección', accessor: s => s.detailedInfo?.address || 'N/A', width: 35 },
  { id: 'lastEvent', label: 'Último Evento', accessor: s => s.detailedInfo?.lastEvent || s.statusDescription || 'N/A', width: 40 },
  { id: 'weight', label: 'Peso (kg)', accessor: s => s.detailedInfo?.weight || 'N/A', width: 10 },
  { id: 'value', label: 'Valor Declarado', accessor: s => s.detailedInfo?.declaredValue ? `$${s.detailedInfo.declaredValue}` : 'N/A', width: 15 },
];

// Filtros para exportación
interface ExportFilters {
  dateFrom: string;
  dateTo: string;
  carriers: string[];
  cities: string[];
  statuses: string[];
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

  // Estados para Excel personalizable
  const [showExcelConfig, setShowExcelConfig] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(['guia', 'carrier', 'status', 'destination', 'days', 'phone', 'lastUpdate']);
  const [exportFilters, setExportFilters] = useState<ExportFilters>({
    dateFrom: '',
    dateTo: '',
    carriers: [],
    cities: [],
    statuses: [],
  });
  const [showPreview, setShowPreview] = useState(false);

  // Obtener opciones únicas para filtros
  const filterOptions = useMemo(() => {
    const carriers = [...new Set(shipments.map(s => s.carrier).filter(Boolean))];
    const cities = [...new Set(shipments.map(s => s.detailedInfo?.destination || s.detailedInfo?.city).filter(Boolean))];
    const statuses = [...new Set(shipments.map(s => s.status).filter(Boolean))];
    return { carriers, cities, statuses };
  }, [shipments]);

  // Filtrar envíos según filtros seleccionados
  const filteredShipments = useMemo(() => {
    let result = [...shipments];

    // Filtro por fecha
    if (exportFilters.dateFrom) {
      const fromDate = new Date(exportFilters.dateFrom);
      result = result.filter(s => {
        const updateDate = s.detailedInfo?.lastUpdate ? new Date(s.detailedInfo.lastUpdate) : null;
        return updateDate && updateDate >= fromDate;
      });
    }
    if (exportFilters.dateTo) {
      const toDate = new Date(exportFilters.dateTo);
      toDate.setHours(23, 59, 59);
      result = result.filter(s => {
        const updateDate = s.detailedInfo?.lastUpdate ? new Date(s.detailedInfo.lastUpdate) : null;
        return updateDate && updateDate <= toDate;
      });
    }

    // Filtro por transportadora
    if (exportFilters.carriers.length > 0) {
      result = result.filter(s => exportFilters.carriers.includes(s.carrier));
    }

    // Filtro por ciudad
    if (exportFilters.cities.length > 0) {
      result = result.filter(s => {
        const city = s.detailedInfo?.destination || s.detailedInfo?.city;
        return city && exportFilters.cities.includes(city);
      });
    }

    // Filtro por estado
    if (exportFilters.statuses.length > 0) {
      result = result.filter(s => exportFilters.statuses.includes(s.status));
    }

    return result;
  }, [shipments, exportFilters]);

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

  // Toggle columna para exportar
  const toggleColumn = (columnId: string) => {
    setSelectedColumns(prev =>
      prev.includes(columnId)
        ? prev.filter(c => c !== columnId)
        : [...prev, columnId]
    );
  };

  // Toggle filtro múltiple
  const toggleFilter = (filterType: 'carriers' | 'cities' | 'statuses', value: string) => {
    setExportFilters(prev => ({
      ...prev,
      [filterType]: prev[filterType].includes(value)
        ? prev[filterType].filter(v => v !== value)
        : [...prev[filterType], value]
    }));
  };

  // Limpiar todos los filtros
  const clearFilters = () => {
    setExportFilters({
      dateFrom: '',
      dateTo: '',
      carriers: [],
      cities: [],
      statuses: [],
    });
  };

  // Exportar a Excel - FUNCIONAL con columnas y filtros personalizables
  const exportToExcel = useCallback((data: Shipment[], filename: string, useSelectedColumns = true) => {
    const columnsToUse = useSelectedColumns
      ? AVAILABLE_COLUMNS.filter(c => selectedColumns.includes(c.id))
      : AVAILABLE_COLUMNS.slice(0, 7); // Default columns

    const wsData = data.map(s => {
      const row: Record<string, string | number> = {};
      columnsToUse.forEach(col => {
        row[col.label] = col.accessor(s);
      });
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Guías');

    // Ajustar ancho de columnas según las seleccionadas
    ws['!cols'] = columnsToUse.map(col => ({ wch: col.width }));

    // Agregar hoja de resumen si hay suficientes datos
    if (data.length > 0) {
      const resumen = [
        { 'Métrica': 'Total de Guías', 'Valor': data.length },
        { 'Métrica': 'Entregadas', 'Valor': data.filter(s => s.status === ShipmentStatus.DELIVERED).length },
        { 'Métrica': 'En Tránsito', 'Valor': data.filter(s => s.status === ShipmentStatus.IN_TRANSIT).length },
        { 'Métrica': 'Con Novedad', 'Valor': data.filter(s => s.status === ShipmentStatus.ISSUE || s.status === ShipmentStatus.EXCEPTION).length },
        { 'Métrica': 'Tasa de Entrega', 'Valor': `${Math.round((data.filter(s => s.status === ShipmentStatus.DELIVERED).length / data.length) * 100)}%` },
        { 'Métrica': 'Fecha de Generación', 'Valor': new Date().toLocaleString('es-CO') },
      ];

      // Agregar desglose por transportadora
      const carrierCounts: Record<string, number> = {};
      data.forEach(s => {
        if (s.carrier) {
          carrierCounts[s.carrier] = (carrierCounts[s.carrier] || 0) + 1;
        }
      });
      Object.entries(carrierCounts).forEach(([carrier, count]) => {
        resumen.push({ 'Métrica': `Guías ${carrier}`, 'Valor': count });
      });

      const wsResumen = XLSX.utils.json_to_sheet(resumen);
      wsResumen['!cols'] = [{ wch: 25 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');
    }

    XLSX.writeFile(wb, `${filename}.xlsx`);
  }, [selectedColumns]);

  // Exportar con filtros aplicados
  const exportFilteredExcel = useCallback(() => {
    const filename = `reporte_personalizado_${new Date().toISOString().split('T')[0]}`;
    exportToExcel(filteredShipments, filename, true);
    setShowExcelConfig(false);
    setShowPreview(false);
  }, [filteredShipments, exportToExcel]);

  // Generar reporte - FUNCIONAL con reportes diferenciados
  const handleGenerateReport = async (template: ReportTemplate) => {
    if (shipments.length === 0) {
      onChatQuery?.('No hay guías cargadas para generar un reporte');
      return;
    }

    setGeneratingReport(template.id);

    try {
      let html = '';
      let reportShipments = shipments;

      switch (template.id) {
        case 'daily':
          html = generateDailyReport(shipments);
          break;

        case 'critical':
          reportShipments = shipments.filter(s => {
            const days = s.detailedInfo?.daysInTransit || 0;
            return days >= 5 || s.status === ShipmentStatus.ISSUE || s.status === ShipmentStatus.EXCEPTION;
          });
          html = generateShipmentReport({
            shipments: reportShipments,
            status: 'Críticos'
          });
          break;

        case 'performance':
          html = generatePerformanceReport(shipments);
          break;

        case 'carriers':
          html = generateCarrierReport(shipments);
          break;

        case 'cities':
          html = generateCityReport(shipments);
          break;

        case 'executive':
          html = generateExecutiveReport(shipments);
          break;

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
          shipmentCount: reportShipments.length,
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

  // Descargar reporte reciente como PDF real
  const handleDownloadReport = async (report: RecentReport) => {
    if (report.type === 'pdf') {
      await downloadPDF(report.html, `${report.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
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

      {/* Export Section - Mejorado */}
      <div className="pt-3 border-t border-white/10">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-slate-400">Exportar a Excel</p>
          <button
            onClick={() => setShowExcelConfig(!showExcelConfig)}
            className="flex items-center gap-1 px-2 py-1 text-xs text-accent-400 hover:bg-accent-500/10 rounded-lg transition-colors"
          >
            <Settings className="w-3 h-3" />
            Personalizar
          </button>
        </div>

        {/* Botones rápidos de exportación */}
        {!showExcelConfig && (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => exportToExcel(shipments, 'todas_las_guias', false)}
              className="flex items-center justify-center gap-2 p-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-400 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="text-xs font-medium">Todas ({stats.total})</span>
            </button>
            <button
              onClick={() => handleExportExcel('critical')}
              className="flex items-center justify-center gap-2 p-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="text-xs font-medium">Críticas ({stats.issues})</span>
            </button>
          </div>
        )}

        {/* Panel de configuración Excel personalizable */}
        {showExcelConfig && (
          <div className="space-y-4 p-4 bg-navy-800/50 rounded-xl border border-white/10">
            {/* Selector de columnas */}
            <div>
              <p className="text-xs font-medium text-slate-300 mb-2 flex items-center gap-1">
                <Settings className="w-3 h-3" />
                Columnas a exportar ({selectedColumns.length} seleccionadas)
              </p>
              <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto">
                {AVAILABLE_COLUMNS.map(col => (
                  <button
                    key={col.id}
                    onClick={() => toggleColumn(col.id)}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-left transition-colors ${
                      selectedColumns.includes(col.id)
                        ? 'bg-accent-500/20 text-accent-400 border border-accent-500/30'
                        : 'bg-white/5 text-slate-400 border border-transparent hover:bg-white/10'
                    }`}
                  >
                    {selectedColumns.includes(col.id) ? (
                      <Check className="w-3 h-3 flex-shrink-0" />
                    ) : (
                      <div className="w-3 h-3 flex-shrink-0" />
                    )}
                    <span className="truncate">{col.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Filtros */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-slate-300 flex items-center gap-1">
                  <Filter className="w-3 h-3" />
                  Filtros
                </p>
                {(exportFilters.carriers.length > 0 || exportFilters.cities.length > 0 || exportFilters.statuses.length > 0 || exportFilters.dateFrom || exportFilters.dateTo) && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Limpiar
                  </button>
                )}
              </div>

              {/* Filtro por fecha */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">Desde</label>
                  <input
                    type="date"
                    value={exportFilters.dateFrom}
                    onChange={(e) => setExportFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                    className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">Hasta</label>
                  <input
                    type="date"
                    value={exportFilters.dateTo}
                    onChange={(e) => setExportFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                    className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white"
                  />
                </div>
              </div>

              {/* Filtro por transportadora */}
              {filterOptions.carriers.length > 0 && (
                <div className="mb-3">
                  <label className="text-[10px] text-slate-500 block mb-1 flex items-center gap-1">
                    <Truck className="w-3 h-3" />
                    Transportadora
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {filterOptions.carriers.slice(0, 8).map(carrier => (
                      <button
                        key={carrier}
                        onClick={() => toggleFilter('carriers', carrier)}
                        className={`px-2 py-1 rounded text-[10px] transition-colors ${
                          exportFilters.carriers.includes(carrier)
                            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                            : 'bg-white/5 text-slate-400 hover:bg-white/10'
                        }`}
                      >
                        {carrier}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Filtro por estado */}
              <div className="mb-3">
                <label className="text-[10px] text-slate-500 block mb-1 flex items-center gap-1">
                  <Package className="w-3 h-3" />
                  Estado
                </label>
                <div className="flex flex-wrap gap-1">
                  {filterOptions.statuses.map(status => (
                    <button
                      key={status}
                      onClick={() => toggleFilter('statuses', status)}
                      className={`px-2 py-1 rounded text-[10px] transition-colors ${
                        exportFilters.statuses.includes(status)
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : 'bg-white/5 text-slate-400 hover:bg-white/10'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filtro por ciudad */}
              {filterOptions.cities.length > 0 && (
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    Ciudad ({filterOptions.cities.length} disponibles)
                  </label>
                  <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                    {filterOptions.cities.slice(0, 15).map(city => (
                      <button
                        key={city}
                        onClick={() => toggleFilter('cities', city)}
                        className={`px-2 py-1 rounded text-[10px] transition-colors ${
                          exportFilters.cities.includes(city)
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-white/5 text-slate-400 hover:bg-white/10'
                        }`}
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Vista previa */}
            <div>
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-white mb-2"
              >
                <Eye className="w-3 h-3" />
                {showPreview ? 'Ocultar' : 'Ver'} vista previa ({filteredShipments.length} guías)
              </button>

              {showPreview && (
                <div className="bg-white/5 rounded-lg p-2 max-h-32 overflow-auto">
                  <table className="w-full text-[10px]">
                    <thead>
                      <tr className="text-slate-500 border-b border-white/10">
                        {AVAILABLE_COLUMNS.filter(c => selectedColumns.includes(c.id)).slice(0, 5).map(col => (
                          <th key={col.id} className="text-left py-1 px-1">{col.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredShipments.slice(0, 5).map((s, idx) => (
                        <tr key={idx} className="text-slate-300 border-b border-white/5">
                          {AVAILABLE_COLUMNS.filter(c => selectedColumns.includes(c.id)).slice(0, 5).map(col => (
                            <td key={col.id} className="py-1 px-1 truncate max-w-[100px]">
                              {String(col.accessor(s)).substring(0, 20)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredShipments.length > 5 && (
                    <p className="text-[10px] text-slate-500 text-center mt-1">
                      ... y {filteredShipments.length - 5} más
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Botones de acción */}
            <div className="flex gap-2 pt-2 border-t border-white/10">
              <button
                onClick={() => {
                  setShowExcelConfig(false);
                  setShowPreview(false);
                }}
                className="flex-1 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-slate-400 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={exportFilteredExcel}
                disabled={filteredShipments.length === 0 || selectedColumns.length === 0}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-lg text-xs text-emerald-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-3 h-3" />
                Exportar ({filteredShipments.length})
              </button>
            </div>
          </div>
        )}
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
