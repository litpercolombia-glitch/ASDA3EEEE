'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  Plus,
  GripVertical,
  X,
  Settings,
  Save,
  Trash2,
  Copy,
  Eye,
  Edit,
  ChevronDown,
  BarChart3,
  LineChart,
  PieChart,
  TrendingUp,
  DollarSign,
  Users,
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle,
  Activity,
  Zap,
  Database,
  Globe,
  RefreshCw,
  Maximize2,
  Minimize2,
  Lock,
  Unlock,
  Download,
  Share2,
  Palette,
  Grid3X3,
} from 'lucide-react';

// ============================================
// DASHBOARD BUILDER - ESTILO DATADOG
// Constructor de dashboards con widgets drag-drop
// ============================================

type WidgetType =
  | 'metric'
  | 'chart-line'
  | 'chart-bar'
  | 'chart-pie'
  | 'table'
  | 'list'
  | 'status'
  | 'map'
  | 'text'
  | 'clock';

interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  x: number; // Grid position
  y: number;
  width: number; // Grid units
  height: number;
  config: WidgetConfig;
  data?: any;
}

interface WidgetConfig {
  dataSource?: string;
  metric?: string;
  refreshInterval?: number; // seconds
  chartType?: string;
  colors?: string[];
  showLegend?: boolean;
  thresholds?: { value: number; color: string }[];
  format?: string;
  content?: string;
}

interface Dashboard {
  id: string;
  name: string;
  description?: string;
  widgets: Widget[];
  gridColumns: number;
  createdAt: Date;
  updatedAt: Date;
  isLocked: boolean;
  theme: 'dark' | 'light';
}

// Widget templates
const widgetTemplates: { type: WidgetType; name: string; icon: React.ElementType; defaultSize: { w: number; h: number } }[] = [
  { type: 'metric', name: 'Métrica', icon: TrendingUp, defaultSize: { w: 2, h: 1 } },
  { type: 'chart-line', name: 'Gráfico Líneas', icon: LineChart, defaultSize: { w: 4, h: 2 } },
  { type: 'chart-bar', name: 'Gráfico Barras', icon: BarChart3, defaultSize: { w: 4, h: 2 } },
  { type: 'chart-pie', name: 'Gráfico Pie', icon: PieChart, defaultSize: { w: 2, h: 2 } },
  { type: 'table', name: 'Tabla', icon: Database, defaultSize: { w: 4, h: 2 } },
  { type: 'list', name: 'Lista', icon: FileText, defaultSize: { w: 2, h: 2 } },
  { type: 'status', name: 'Estado', icon: Activity, defaultSize: { w: 2, h: 1 } },
  { type: 'clock', name: 'Reloj', icon: Clock, defaultSize: { w: 2, h: 1 } },
  { type: 'text', name: 'Texto', icon: FileText, defaultSize: { w: 3, h: 1 } },
];

// Mock data sources
const dataSources = [
  { id: 'invoices', name: 'Facturas', metrics: ['total', 'count', 'average', 'pending', 'overdue'] },
  { id: 'payments', name: 'Pagos', metrics: ['received', 'pending', 'failed', 'refunds'] },
  { id: 'expenses', name: 'Gastos', metrics: ['total', 'by_category', 'monthly_avg'] },
  { id: 'customers', name: 'Clientes', metrics: ['total', 'new_this_month', 'active', 'churn'] },
  { id: 'system', name: 'Sistema', metrics: ['uptime', 'requests', 'errors', 'latency'] },
];

// Sample data for widgets
const generateWidgetData = (type: WidgetType, config: WidgetConfig) => {
  switch (type) {
    case 'metric':
      return {
        value: Math.floor(Math.random() * 10000000),
        change: (Math.random() * 20 - 10).toFixed(1),
        trend: Math.random() > 0.5 ? 'up' : 'down',
      };
    case 'chart-line':
    case 'chart-bar':
      return Array.from({ length: 12 }, (_, i) => ({
        label: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][i],
        value: Math.floor(Math.random() * 1000000) + 500000,
      }));
    case 'chart-pie':
      return [
        { label: 'Publicidad', value: 35, color: '#8b5cf6' },
        { label: 'Nómina', value: 25, color: '#06b6d4' },
        { label: 'Servicios', value: 20, color: '#10b981' },
        { label: 'Otros', value: 20, color: '#f59e0b' },
      ];
    case 'table':
      return Array.from({ length: 5 }, (_, i) => ({
        id: `INV-${2025}${String(i + 1).padStart(4, '0')}`,
        cliente: ['Empresa A', 'Empresa B', 'Cliente C', 'Corp D', 'LLC E'][i],
        monto: `$${(Math.floor(Math.random() * 5000000) + 100000).toLocaleString()}`,
        estado: ['Pagada', 'Pendiente', 'Vencida', 'Pagada', 'Pendiente'][i],
      }));
    case 'list':
      return [
        { title: 'Pago recibido de Empresa ABC', time: 'Hace 5m' },
        { title: 'Nueva factura LITPER-2025-0043', time: 'Hace 15m' },
        { title: 'Gasto aprobado: Marketing', time: 'Hace 1h' },
        { title: 'Nómina procesada: Enero', time: 'Hace 2h' },
      ];
    case 'status':
      const statuses = ['healthy', 'warning', 'critical'];
      return { status: statuses[Math.floor(Math.random() * statuses.length)], message: 'Sistema operando' };
    default:
      return null;
  }
};

const defaultDashboard: Dashboard = {
  id: 'dash_1',
  name: 'Dashboard Principal',
  description: 'Vista general del negocio',
  gridColumns: 12,
  createdAt: new Date(),
  updatedAt: new Date(),
  isLocked: false,
  theme: 'dark',
  widgets: [
    { id: 'w1', type: 'metric', title: 'Ingresos Totales', x: 0, y: 0, width: 3, height: 1, config: { dataSource: 'invoices', metric: 'total', format: 'currency' } },
    { id: 'w2', type: 'metric', title: 'Facturas Pendientes', x: 3, y: 0, width: 3, height: 1, config: { dataSource: 'invoices', metric: 'pending', format: 'number' } },
    { id: 'w3', type: 'metric', title: 'Clientes Activos', x: 6, y: 0, width: 3, height: 1, config: { dataSource: 'customers', metric: 'active', format: 'number' } },
    { id: 'w4', type: 'status', title: 'Estado Sistema', x: 9, y: 0, width: 3, height: 1, config: { dataSource: 'system', metric: 'uptime' } },
    { id: 'w5', type: 'chart-line', title: 'Ingresos Mensuales', x: 0, y: 1, width: 6, height: 2, config: { dataSource: 'invoices', chartType: 'area', colors: ['#8b5cf6'] } },
    { id: 'w6', type: 'chart-pie', title: 'Distribución Gastos', x: 6, y: 1, width: 3, height: 2, config: { dataSource: 'expenses', showLegend: true } },
    { id: 'w7', type: 'list', title: 'Actividad Reciente', x: 9, y: 1, width: 3, height: 2, config: {} },
    { id: 'w8', type: 'table', title: 'Últimas Facturas', x: 0, y: 3, width: 6, height: 2, config: { dataSource: 'invoices' } },
    { id: 'w9', type: 'chart-bar', title: 'Pagos por Mes', x: 6, y: 3, width: 6, height: 2, config: { dataSource: 'payments', colors: ['#10b981'] } },
  ],
};

export function DashboardBuilder() {
  const [dashboard, setDashboard] = useState<Dashboard>(defaultDashboard);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedWidget, setSelectedWidget] = useState<string | null>(null);
  const [showWidgetPalette, setShowWidgetPalette] = useState(false);
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null);
  const [widgetData, setWidgetData] = useState<Record<string, any>>({});
  const gridRef = useRef<HTMLDivElement>(null);

  // Load dashboard
  useEffect(() => {
    const stored = localStorage.getItem('litper_dashboard_builder');
    if (stored) {
      const parsed = JSON.parse(stored);
      setDashboard({
        ...parsed,
        createdAt: new Date(parsed.createdAt),
        updatedAt: new Date(parsed.updatedAt),
      });
    }
  }, []);

  // Generate data for all widgets
  useEffect(() => {
    const data: Record<string, any> = {};
    dashboard.widgets.forEach(widget => {
      data[widget.id] = generateWidgetData(widget.type, widget.config);
    });
    setWidgetData(data);

    // Refresh data periodically
    const interval = setInterval(() => {
      const newData: Record<string, any> = {};
      dashboard.widgets.forEach(widget => {
        newData[widget.id] = generateWidgetData(widget.type, widget.config);
      });
      setWidgetData(newData);
    }, 30000);

    return () => clearInterval(interval);
  }, [dashboard.widgets]);

  // Save dashboard
  const saveDashboard = () => {
    const updated = { ...dashboard, updatedAt: new Date() };
    setDashboard(updated);
    localStorage.setItem('litper_dashboard_builder', JSON.stringify(updated));
  };

  // Add widget
  const addWidget = (type: WidgetType) => {
    const template = widgetTemplates.find(t => t.type === type);
    if (!template) return;

    const newWidget: Widget = {
      id: `w_${Date.now()}`,
      type,
      title: template.name,
      x: 0,
      y: Math.max(...dashboard.widgets.map(w => w.y + w.height), 0),
      width: template.defaultSize.w,
      height: template.defaultSize.h,
      config: {},
    };

    setDashboard(prev => ({
      ...prev,
      widgets: [...prev.widgets, newWidget],
    }));
    setShowWidgetPalette(false);
    setSelectedWidget(newWidget.id);
  };

  // Delete widget
  const deleteWidget = (id: string) => {
    setDashboard(prev => ({
      ...prev,
      widgets: prev.widgets.filter(w => w.id !== id),
    }));
    setSelectedWidget(null);
  };

  // Duplicate widget
  const duplicateWidget = (id: string) => {
    const widget = dashboard.widgets.find(w => w.id === id);
    if (!widget) return;

    const newWidget: Widget = {
      ...widget,
      id: `w_${Date.now()}`,
      x: Math.min(widget.x + 1, dashboard.gridColumns - widget.width),
      y: widget.y + widget.height,
    };

    setDashboard(prev => ({
      ...prev,
      widgets: [...prev.widgets, newWidget],
    }));
  };

  // Update widget
  const updateWidget = (id: string, updates: Partial<Widget>) => {
    setDashboard(prev => ({
      ...prev,
      widgets: prev.widgets.map(w => w.id === id ? { ...w, ...updates } : w),
    }));
  };

  // Format value
  const formatValue = (value: number, format?: string): string => {
    switch (format) {
      case 'currency':
        return `$${value.toLocaleString('es-CO')}`;
      case 'percent':
        return `${value}%`;
      default:
        return value.toLocaleString();
    }
  };

  // Render widget content
  const renderWidgetContent = (widget: Widget) => {
    const data = widgetData[widget.id];
    if (!data) return <div className="flex items-center justify-center h-full text-gray-500">Cargando...</div>;

    switch (widget.type) {
      case 'metric':
        return (
          <div className="h-full flex flex-col justify-center">
            <p className="text-3xl font-bold text-white">
              {formatValue(data.value, widget.config.format)}
            </p>
            <div className={`flex items-center gap-1 text-sm ${data.trend === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
              <TrendingUp className={`w-4 h-4 ${data.trend === 'down' ? 'rotate-180' : ''}`} />
              {data.change}%
            </div>
          </div>
        );

      case 'chart-line':
      case 'chart-bar':
        const maxValue = Math.max(...data.map((d: any) => d.value));
        return (
          <div className="h-full flex flex-col">
            <div className="flex-1 flex items-end gap-1 pb-6">
              {data.map((d: any, i: number) => (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div
                    className={`w-full ${widget.type === 'chart-bar' ? 'rounded-t' : 'rounded'} ${
                      widget.config.colors?.[0] || 'bg-violet-500'
                    }`}
                    style={{
                      height: `${(d.value / maxValue) * 100}%`,
                      backgroundColor: widget.config.colors?.[0] || '#8b5cf6',
                      minHeight: '4px',
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-gray-500">
              {data.filter((_: any, i: number) => i % 3 === 0).map((d: any, i: number) => (
                <span key={i}>{d.label}</span>
              ))}
            </div>
          </div>
        );

      case 'chart-pie':
        const total = data.reduce((acc: number, d: any) => acc + d.value, 0);
        let cumulativePercent = 0;
        return (
          <div className="h-full flex items-center gap-4">
            <div className="relative w-24 h-24">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                {data.map((d: any, i: number) => {
                  const percent = (d.value / total) * 100;
                  const offset = cumulativePercent;
                  cumulativePercent += percent;
                  return (
                    <circle
                      key={i}
                      cx="18"
                      cy="18"
                      r="15.915"
                      fill="transparent"
                      stroke={d.color}
                      strokeWidth="3"
                      strokeDasharray={`${percent} ${100 - percent}`}
                      strokeDashoffset={-offset}
                    />
                  );
                })}
              </svg>
            </div>
            <div className="flex-1 space-y-1">
              {data.map((d: any, i: number) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-gray-400">{d.label}</span>
                  <span className="text-white ml-auto">{d.value}%</span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'table':
        return (
          <div className="h-full overflow-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-500 border-b border-white/10">
                  <th className="text-left py-2">ID</th>
                  <th className="text-left py-2">Cliente</th>
                  <th className="text-right py-2">Monto</th>
                  <th className="text-right py-2">Estado</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row: any, i: number) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="py-2 font-mono text-gray-400">{row.id}</td>
                    <td className="py-2 text-white">{row.cliente}</td>
                    <td className="py-2 text-right text-white">{row.monto}</td>
                    <td className="py-2 text-right">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                        row.estado === 'Pagada' ? 'bg-emerald-500/20 text-emerald-400' :
                        row.estado === 'Vencida' ? 'bg-red-500/20 text-red-400' :
                        'bg-amber-500/20 text-amber-400'
                      }`}>
                        {row.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'list':
        return (
          <div className="h-full overflow-auto space-y-2">
            {data.map((item: any, i: number) => (
              <div key={i} className="flex items-start gap-2 p-2 bg-white/5 rounded-lg">
                <Activity className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white truncate">{item.title}</p>
                  <p className="text-[10px] text-gray-500">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        );

      case 'status':
        const statusConfig = {
          healthy: { color: 'text-emerald-400', bg: 'bg-emerald-500/20', icon: CheckCircle },
          warning: { color: 'text-amber-400', bg: 'bg-amber-500/20', icon: AlertTriangle },
          critical: { color: 'text-red-400', bg: 'bg-red-500/20', icon: AlertTriangle },
        };
        const config = statusConfig[data.status as keyof typeof statusConfig];
        const StatusIcon = config.icon;
        return (
          <div className="h-full flex items-center gap-3">
            <div className={`p-2 rounded-lg ${config.bg}`}>
              <StatusIcon className={`w-6 h-6 ${config.color}`} />
            </div>
            <div>
              <p className={`text-lg font-semibold capitalize ${config.color}`}>{data.status}</p>
              <p className="text-xs text-gray-500">{data.message}</p>
            </div>
          </div>
        );

      case 'clock':
        return (
          <div className="h-full flex items-center justify-center">
            <p className="text-3xl font-mono text-white">
              {new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
          </div>
        );

      case 'text':
        return (
          <div className="h-full flex items-center">
            <p className="text-sm text-gray-300">{widget.config.content || 'Haz clic para editar...'}</p>
          </div>
        );

      default:
        return <div className="text-gray-500">Widget no soportado</div>;
    }
  };

  return (
    <div className="h-full flex flex-col bg-black/20 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-500/20 rounded-lg">
              <LayoutDashboard className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">{dashboard.name}</h2>
              <p className="text-xs text-gray-400">{dashboard.widgets.length} widgets</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isEditing && (
              <>
                <button
                  onClick={() => setShowWidgetPalette(!showWidgetPalette)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Widget
                </button>
                <button
                  onClick={() => setDashboard(prev => ({ ...prev, isLocked: !prev.isLocked }))}
                  className={`p-2 rounded-lg transition-colors ${
                    dashboard.isLocked ? 'bg-amber-500/20 text-amber-400' : 'bg-white/5 text-gray-400'
                  }`}
                  title={dashboard.isLocked ? 'Desbloquear' : 'Bloquear'}
                >
                  {dashboard.isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                </button>
              </>
            )}

            <button
              onClick={() => {
                if (isEditing) saveDashboard();
                setIsEditing(!isEditing);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                isEditing
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              {isEditing ? (
                <>
                  <Save className="w-4 h-4" />
                  Guardar
                </>
              ) : (
                <>
                  <Edit className="w-4 h-4" />
                  Editar
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Widget Palette */}
      {showWidgetPalette && (
        <div className="p-4 border-b border-white/10 bg-black/30">
          <p className="text-sm text-gray-400 mb-3">Selecciona un widget para agregar:</p>
          <div className="flex flex-wrap gap-2">
            {widgetTemplates.map(template => (
              <button
                key={template.type}
                onClick={() => addWidget(template.type)}
                className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-white transition-colors"
              >
                <template.icon className="w-4 h-4 text-violet-400" />
                {template.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Dashboard Grid */}
      <div className="flex-1 overflow-auto p-4" ref={gridRef}>
        <div
          className="relative"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${dashboard.gridColumns}, 1fr)`,
            gap: '16px',
            minHeight: '600px',
          }}
        >
          {dashboard.widgets.map(widget => {
            const isSelected = selectedWidget === widget.id;

            return (
              <div
                key={widget.id}
                className={`relative bg-white/5 rounded-xl border transition-all ${
                  isSelected
                    ? 'border-violet-500 ring-2 ring-violet-500/30'
                    : 'border-white/10 hover:border-white/20'
                } ${isEditing && !dashboard.isLocked ? 'cursor-move' : ''}`}
                style={{
                  gridColumn: `span ${widget.width}`,
                  gridRow: `span ${widget.height}`,
                }}
                onClick={() => isEditing && setSelectedWidget(widget.id)}
              >
                {/* Widget Header */}
                <div className="flex items-center justify-between p-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    {isEditing && !dashboard.isLocked && (
                      <GripVertical className="w-4 h-4 text-gray-500 cursor-grab" />
                    )}
                    <h3 className="text-sm font-medium text-white">{widget.title}</h3>
                  </div>

                  {isEditing && isSelected && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); duplicateWidget(widget.id); }}
                        className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white"
                        title="Duplicar"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteWidget(widget.id); }}
                        className="p-1 hover:bg-red-500/10 rounded text-gray-400 hover:text-red-400"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Widget Content */}
                <div className="p-3" style={{ height: `calc(100% - 44px)` }}>
                  {renderWidgetContent(widget)}
                </div>

                {/* Resize handles (if editing) */}
                {isEditing && isSelected && !dashboard.isLocked && (
                  <>
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-violet-500 rounded cursor-ew-resize" />
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-1 w-8 bg-violet-500 rounded cursor-ns-resize" />
                    <div className="absolute right-0 bottom-0 w-3 h-3 bg-violet-500 rounded-tl cursor-nwse-resize" />
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Widget Config Panel */}
      {isEditing && selectedWidget && (
        <div className="p-4 border-t border-white/10 bg-black/30">
          {(() => {
            const widget = dashboard.widgets.find(w => w.id === selectedWidget);
            if (!widget) return null;

            return (
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">Título</label>
                  <input
                    type="text"
                    value={widget.title}
                    onChange={(e) => updateWidget(widget.id, { title: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white focus:outline-none focus:border-violet-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">Ancho</label>
                  <select
                    value={widget.width}
                    onChange={(e) => updateWidget(widget.id, { width: parseInt(e.target.value) })}
                    className="px-3 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white focus:outline-none"
                  >
                    {[2, 3, 4, 6, 8, 12].map(w => (
                      <option key={w} value={w}>{w} cols</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">Alto</label>
                  <select
                    value={widget.height}
                    onChange={(e) => updateWidget(widget.id, { height: parseInt(e.target.value) })}
                    className="px-3 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white focus:outline-none"
                  >
                    {[1, 2, 3, 4].map(h => (
                      <option key={h} value={h}>{h} rows</option>
                    ))}
                  </select>
                </div>

                {widget.type === 'metric' && (
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Formato</label>
                    <select
                      value={widget.config.format || 'number'}
                      onChange={(e) => updateWidget(widget.id, { config: { ...widget.config, format: e.target.value } })}
                      className="px-3 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white focus:outline-none"
                    >
                      <option value="number">Número</option>
                      <option value="currency">Moneda</option>
                      <option value="percent">Porcentaje</option>
                    </select>
                  </div>
                )}

                {widget.type === 'text' && (
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">Contenido</label>
                    <input
                      type="text"
                      value={widget.config.content || ''}
                      onChange={(e) => updateWidget(widget.id, { config: { ...widget.config, content: e.target.value } })}
                      className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white focus:outline-none focus:border-violet-500/50"
                      placeholder="Escribe tu texto..."
                    />
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

export default DashboardBuilder;
