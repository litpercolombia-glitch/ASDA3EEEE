// components/ChatFirst/SkillViews/ReportesSkillView.tsx
// Vista simplificada de Reportes - Generacion rapida de informes
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
} from 'lucide-react';
import { Shipment, ShipmentStatus } from '../../../types';

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
  const [recentReports, setRecentReports] = useState<{ id: string; name: string; time: Date }[]>([]);

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

  const handleGenerateReport = async (template: ReportTemplate) => {
    setGeneratingReport(template.id);

    // Simular generacion (en produccion llamaria al servicio)
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Agregar a reportes recientes
    setRecentReports(prev => [
      { id: template.id, name: template.name, time: new Date() },
      ...prev.slice(0, 4),
    ]);

    setGeneratingReport(null);

    // Trigger chat query para generar el reporte real
    onChatQuery?.(template.prompt);
    onGenerateReport?.(template.id);
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
          <p className="text-sm font-medium text-slate-400 mb-3">Reportes Recientes</p>
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
                      {report.time.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                    <Download className="w-4 h-4 text-slate-400" />
                  </button>
                  <button className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                    <Send className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
