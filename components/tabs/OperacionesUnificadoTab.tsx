// components/tabs/OperacionesUnificadoTab.tsx
// Tab unificado que combina: Seguimiento + Cargas + Timeline + Mapa + Cerebro
import React, { useState, useMemo, useCallback } from 'react';
import {
  Package,
  BarChart3,
  Activity,
  Upload,
  Table,
  Eye,
  ChevronRight,
  Truck,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  TrendingUp,
  Filter,
  Search,
  RefreshCw,
  FileSpreadsheet,
  Zap,
  Brain,
  ListOrdered,
  Map,
  GitBranch,
  X,
} from 'lucide-react';
import { Shipment } from '../../types';

// Importar los tabs existentes
import { SeguimientoTab } from './SeguimientoTab';
import { InteligenciaLogisticaTab } from './InteligenciaLogisticaTab';
import SemaforoTabNew from './SemaforoTabNew';
import { SmartPrioritizationPanel } from '../intelligence';

// Nuevos componentes integrados (Timeline, Mapa, Cerebro)
import { ShipmentTimeline } from '../brain/ShipmentTimeline';
import { JourneyMap } from '../brain/JourneyMap';
import TrackingMap from '../maps/TrackingMap';

// Análisis de Rondas LITPER
import { AnalisisRondasTab } from './AnalisisRondasTab';

// =====================================
// TIPOS
// =====================================
type SubView = 'carga' | 'mapa' | 'prioridad' | 'inteligencia' | 'semaforo' | 'cerebro' | 'analisis-rondas';

interface OperacionesUnificadoTabProps {
  shipments: Shipment[];
  onShipmentsLoaded?: (shipments: Shipment[]) => void;
  onSemaforoDataLoaded?: (data: any) => void;
}

// =====================================
// SUB-NAVEGACIÓN (Simplificado - Sin tabla y timeline)
// =====================================
const subNavItems: { id: SubView; label: string; icon: React.ElementType; description: string; color: string }[] = [
  {
    id: 'carga',
    label: '📦 Cargar Guías',
    icon: Upload,
    description: 'Importar y gestionar',
    color: 'cyan'
  },
  {
    id: 'mapa',
    label: '🗺️ Mapa',
    icon: Map,
    description: 'Recorrido geográfico',
    color: 'teal'
  },
  {
    id: 'prioridad',
    label: 'Prioridad IA',
    icon: ListOrdered,
    description: 'Guías prioritarias',
    color: 'rose'
  },
  {
    id: 'inteligencia',
    label: 'Intel. Logística',
    icon: BarChart3,
    description: 'Análisis profundo',
    color: 'purple'
  },
  {
    id: 'cerebro',
    label: '🧠 Cerebro',
    icon: Brain,
    description: 'Coordinador IA',
    color: 'pink'
  },
  {
    id: 'semaforo',
    label: 'Semáforo',
    icon: Activity,
    description: 'Vista por estados',
    color: 'amber'
  },
  {
    id: 'analisis-rondas',
    label: '📊 Análisis Rondas',
    icon: TrendingUp,
    description: 'Control de rondas',
    color: 'emerald'
  },
];

// =====================================
// COMPONENTE PRINCIPAL
// =====================================
export const OperacionesUnificadoTab: React.FC<OperacionesUnificadoTabProps> = ({
  shipments,
  onShipmentsLoaded,
  onSemaforoDataLoaded,
}) => {
  const [activeView, setActiveView] = useState<SubView>('carga');

  // Métricas rápidas
  const metrics = useMemo(() => {
    const total = shipments.length;
    const entregados = shipments.filter(s => s.status === 'delivered').length;
    const enTransito = shipments.filter(s => s.status === 'in_transit').length;
    const conNovedad = shipments.filter(s => s.status === 'issue').length;
    const enOficina = shipments.filter(s => s.status === 'in_office').length;

    return {
      total,
      entregados,
      enTransito,
      conNovedad,
      enOficina,
      criticos: conNovedad + enOficina,
      tasaEntrega: total > 0 ? Math.round((entregados / total) * 100) : 0,
    };
  }, [shipments]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ====================================== */}
      {/* HEADER CON MÉTRICAS RÁPIDAS */}
      {/* ====================================== */}
      <div className="bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-700 overflow-hidden">
        {/* Título */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-navy-700 bg-gradient-to-r from-cyan-500/10 to-blue-500/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                  Centro de Operaciones
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Gestión integral de guías y seguimiento
                </p>
              </div>
            </div>

            {/* Métricas Mini */}
            {metrics.total > 0 && (
              <div className="hidden lg:flex items-center gap-4">
                <div className="text-center px-4 py-2 bg-slate-100 dark:bg-navy-800 rounded-lg">
                  <p className="text-2xl font-bold text-slate-800 dark:text-white">{metrics.total}</p>
                  <p className="text-xs text-slate-500">Total</p>
                </div>
                <div className="text-center px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{metrics.tasaEntrega}%</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">Entrega</p>
                </div>
                {metrics.criticos > 0 && (
                  <div className="text-center px-4 py-2 bg-red-100 dark:bg-red-900/30 rounded-lg animate-pulse">
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">{metrics.criticos}</p>
                    <p className="text-xs text-red-600 dark:text-red-400">Críticos</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sub-navegación */}
        <div className="px-4 py-3 bg-slate-50 dark:bg-navy-950 border-b border-slate-200 dark:border-navy-700">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {subNavItems.map((item) => {
              const isActive = activeView === item.id;
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`
                    flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm
                    transition-all duration-200 whitespace-nowrap
                    ${isActive
                      ? `bg-${item.color}-500 text-white shadow-lg shadow-${item.color}-500/30`
                      : 'bg-white dark:bg-navy-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-700 border border-slate-200 dark:border-navy-600'
                    }
                  `}
                >
                  <Icon className={`w-4 h-4 ${isActive ? '' : `text-${item.color}-500`}`} />
                  <span>{item.label}</span>
                  {(item.id === 'inteligencia' || item.id === 'prioridad') && metrics.criticos > 0 && !isActive && (
                    <span className="px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full animate-pulse">
                      {metrics.criticos}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ====================================== */}
      {/* CONTENIDO DINÁMICO */}
      {/* ====================================== */}
      <div className="min-h-[500px]">
        {activeView === 'carga' && (
          <div className="animate-fade-in">
            <SeguimientoTab
              shipments={shipments}
              onShipmentsLoaded={onShipmentsLoaded}
            />
          </div>
        )}

        {activeView === 'prioridad' && (
          <div className="animate-fade-in">
            {shipments.length === 0 ? (
              <EmptyState
                title="No hay guías para priorizar"
                description="Carga guías primero para ver las prioridades IA"
                action={() => setActiveView('carga')}
                actionLabel="Ir a Carga de Datos"
              />
            ) : (
              <SmartPrioritizationPanel
                shipments={shipments}
                onCallGuide={(shipment) => {
                  const phone = shipment.recipientPhone || shipment.senderPhone;
                  if (phone) {
                    window.open(`tel:${phone}`, '_blank');
                  }
                }}
                onWhatsAppGuide={(shipment) => {
                  const phone = shipment.recipientPhone || shipment.senderPhone;
                  if (phone) {
                    const message = encodeURIComponent(`Hola, le contactamos por su envío ${shipment.trackingNumber}`);
                    window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${message}`, '_blank');
                  }
                }}
              />
            )}
          </div>
        )}

        {activeView === 'inteligencia' && (
          <div className="animate-fade-in">
            <InteligenciaLogisticaTab />
          </div>
        )}

        {activeView === 'semaforo' && (
          <div className="animate-fade-in">
            <SemaforoTabNew onDataLoaded={onSemaforoDataLoaded} />
          </div>
        )}

        {/* ====================================== */}
        {/* OTROS TABS */}
        {/* ====================================== */}

        {/* Tab: Mapa de Recorrido */}
        {activeView === 'mapa' && (
          <div className="animate-fade-in">
            <MapaView shipments={shipments} />
          </div>
        )}

        {/* Tab: Cerebro Central */}
        {activeView === 'cerebro' && (
          <div className="animate-fade-in">
            <CerebroView shipments={shipments} />
          </div>
        )}

        {/* Tab: Análisis de Rondas LITPER */}
        {activeView === 'analisis-rondas' && (
          <div className="animate-fade-in">
            <AnalisisRondasTab />
          </div>
        )}
      </div>
    </div>
  );
};

// =====================================
// COMPONENTES AUXILIARES
// =====================================

// Estado vacío
const EmptyState: React.FC<{
  title: string;
  description: string;
  action: () => void;
  actionLabel: string;
}> = ({ title, description, action, actionLabel }) => (
  <div className="bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-700 p-12 text-center">
    <div className="w-20 h-20 bg-slate-100 dark:bg-navy-800 rounded-full flex items-center justify-center mx-auto mb-6">
      <Package className="w-10 h-10 text-slate-400" />
    </div>
    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{title}</h3>
    <p className="text-slate-500 dark:text-slate-400 mb-6">{description}</p>
    <button
      onClick={action}
      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-bold hover:from-cyan-600 hover:to-blue-700 transition-all"
    >
      <ChevronRight className="w-5 h-5" />
      {actionLabel}
    </button>
  </div>
);

// Tabla rápida de guías
const TablaGuiasRapida: React.FC<{ shipments: Shipment[] }> = ({ shipments }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredShipments = useMemo(() => {
    return shipments.filter(s => {
      const matchesSearch = !searchQuery ||
        s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.detailedInfo?.destination?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [shipments, searchQuery, statusFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-medium rounded-lg flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Entregado</span>;
      case 'in_transit':
        return <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-medium rounded-lg flex items-center gap-1"><Truck className="w-3 h-3" /> En tránsito</span>;
      case 'issue':
        return <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-medium rounded-lg flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Novedad</span>;
      case 'in_office':
        return <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-xs font-medium rounded-lg flex items-center gap-1"><Clock className="w-3 h-3" /> En oficina</span>;
      default:
        return <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-medium rounded-lg">{status}</span>;
    }
  };

  return (
    <div className="bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-700 overflow-hidden">
      {/* Filtros */}
      <div className="p-4 border-b border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-950">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Búsqueda */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por guía, teléfono, ciudad..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {/* Filtro de estado */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="ALL">Todos los estados</option>
            <option value="delivered">Entregados</option>
            <option value="in_transit">En tránsito</option>
            <option value="issue">Con novedad</option>
            <option value="in_office">En oficina</option>
          </select>
        </div>

        {/* Resumen */}
        <div className="flex items-center gap-4 mt-3 text-sm">
          <span className="text-slate-500 dark:text-slate-400">
            Mostrando <span className="font-bold text-slate-700 dark:text-white">{filteredShipments.length}</span> de {shipments.length} guías
          </span>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-navy-950 sticky top-0">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Guía</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Teléfono</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Estado</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Destino</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Transportadora</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
            {filteredShipments.slice(0, 100).map((shipment) => (
              <tr key={shipment.id} className="hover:bg-slate-50 dark:hover:bg-navy-800/50">
                <td className="px-4 py-3">
                  <span className="font-mono font-bold text-slate-800 dark:text-white">{shipment.id}</span>
                </td>
                <td className="px-4 py-3">
                  {shipment.phone ? (
                    <span className="text-green-600 dark:text-green-400 font-mono text-sm">{shipment.phone}</span>
                  ) : (
                    <span className="text-slate-400 text-sm">-</span>
                  )}
                </td>
                <td className="px-4 py-3">{getStatusBadge(shipment.status)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-300">
                    <MapPin className="w-3 h-3 text-purple-500" />
                    {shipment.detailedInfo?.destination || '-'}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-300">
                    <Truck className="w-3 h-3 text-blue-500" />
                    {shipment.carrier}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredShipments.length > 100 && (
          <div className="p-4 text-center text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-navy-950">
            Mostrando primeras 100 guías. Usa el buscador para encontrar guías específicas.
          </div>
        )}
      </div>
    </div>
  );
};

// =====================================
// TIMELINE VIEW - Historia Visual del Envío
// =====================================
const TimelineView: React.FC<{ shipments: Shipment[] }> = ({ shipments }) => {
  const [selectedGuide, setSelectedGuide] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredShipments = useMemo(() => {
    if (!searchQuery) return shipments.slice(0, 20);
    return shipments.filter(s =>
      s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.phone?.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 20);
  }, [shipments, searchQuery]);

  const selectedShipment = useMemo(() => {
    return shipments.find(s => s.id === selectedGuide);
  }, [shipments, selectedGuide]);

  // Generar timeline data para el envío seleccionado
  const generateTimelineData = useCallback((shipment: Shipment) => {
    const trackingHistory = shipment.trackingHistory || [];
    const steps = trackingHistory.map((event, index) => ({
      id: `step-${index}`,
      timestamp: new Date(event.date),
      title: event.status,
      description: event.description || event.status,
      location: event.location || '',
      statusIcon: index === 0 ? '📦' : index === trackingHistory.length - 1 ? '📍' : '🚚',
      statusColor: event.status.toLowerCase().includes('entregado') ? '#10b981' :
                   event.status.toLowerCase().includes('novedad') ? '#ef4444' : '#3b82f6',
      isCompleted: true,
      isCurrent: index === trackingHistory.length - 1,
      hasIssue: event.status.toLowerCase().includes('novedad'),
      source: shipment.carrier,
    }));

    return {
      steps,
      progress: shipment.status === 'delivered' ? 100 : Math.min(90, steps.length * 20),
      summary: {
        startDate: trackingHistory[0]?.date || 'N/A',
        currentStatus: shipment.status,
        daysInTransit: shipment.daysInTransit || 0,
        totalLocations: new Set(trackingHistory.map(e => e.location)).size,
      },
    };
  }, []);

  return (
    <div className="bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-700 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 dark:border-navy-700 bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
            <GitBranch className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">
              Timeline de Envíos
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Historia visual completa de cada guía
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
        {/* Lista de guías */}
        <div className="border-r border-slate-200 dark:border-navy-700">
          <div className="p-4 border-b border-slate-200 dark:border-navy-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar guía..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div className="max-h-[500px] overflow-y-auto">
            {filteredShipments.map((shipment) => (
              <button
                key={shipment.id}
                onClick={() => setSelectedGuide(shipment.id)}
                className={`w-full p-4 text-left border-b border-slate-100 dark:border-navy-800 hover:bg-slate-50 dark:hover:bg-navy-800/50 transition-colors ${
                  selectedGuide === shipment.id ? 'bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-l-indigo-500' : ''
                }`}
              >
                <div className="font-mono font-bold text-slate-800 dark:text-white text-sm">
                  {shipment.id}
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                  <span>{shipment.carrier}</span>
                  <span>•</span>
                  <span className={
                    shipment.status === 'delivered' ? 'text-green-600' :
                    shipment.status === 'issue' ? 'text-red-600' : 'text-blue-600'
                  }>
                    {shipment.status === 'delivered' ? '✓ Entregado' :
                     shipment.status === 'issue' ? '⚠ Novedad' : '🚚 En tránsito'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Timeline visual */}
        <div className="lg:col-span-2 p-6">
          {selectedShipment ? (
            <div className="space-y-6">
              {/* Info de la guía */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                    Guía: {selectedShipment.id}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {selectedShipment.carrier} • {selectedShipment.detailedInfo?.destination || 'Sin destino'}
                  </p>
                </div>
                <div className={`px-4 py-2 rounded-xl font-bold text-sm ${
                  selectedShipment.status === 'delivered' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                  selectedShipment.status === 'issue' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                }`}>
                  {selectedShipment.status === 'delivered' ? '✓ ENTREGADO' :
                   selectedShipment.status === 'issue' ? '⚠ CON NOVEDAD' : '🚚 EN TRÁNSITO'}
                </div>
              </div>

              {/* Timeline steps */}
              <div className="relative">
                {selectedShipment.trackingHistory && selectedShipment.trackingHistory.length > 0 ? (
                  <div className="space-y-4">
                    {selectedShipment.trackingHistory.map((event, index) => (
                      <div key={index} className="flex items-start gap-4">
                        <div className="relative">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${
                            event.status.toLowerCase().includes('entregado') ? 'bg-green-500' :
                            event.status.toLowerCase().includes('novedad') ? 'bg-red-500' :
                            'bg-blue-500'
                          }`}>
                            {index === 0 ? '📦' :
                             event.status.toLowerCase().includes('entregado') ? '✓' :
                             event.status.toLowerCase().includes('novedad') ? '!' : '🚚'}
                          </div>
                          {index < selectedShipment.trackingHistory!.length - 1 && (
                            <div className="absolute left-1/2 top-10 w-0.5 h-8 bg-slate-300 dark:bg-navy-600 -translate-x-1/2" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="text-sm font-bold text-slate-800 dark:text-white">
                            {event.status}
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            {event.description}
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                            <span>📅 {event.date}</span>
                            {event.location && <span>📍 {event.location}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-500">
                    <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No hay historial de tracking disponible</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-center py-20">
              <div>
                <GitBranch className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-navy-600" />
                <h3 className="text-lg font-bold text-slate-600 dark:text-slate-400">
                  Selecciona una guía
                </h3>
                <p className="text-sm text-slate-400 mt-2">
                  Haz clic en una guía de la lista para ver su timeline completo
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// =====================================
// MAPA VIEW - Recorrido Geográfico
// =====================================
const MapaView: React.FC<{ shipments: Shipment[] }> = ({ shipments }) => {
  const [selectedGuide, setSelectedGuide] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'all' | 'single'>('all');

  // Estadísticas de ubicaciones
  const locationStats = useMemo(() => {
    const cities: Record<string, number> = {};
    shipments.forEach(s => {
      const city = s.detailedInfo?.destination || 'Sin ciudad';
      cities[city] = (cities[city] || 0) + 1;
    });
    return Object.entries(cities)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [shipments]);

  const statusCounts = useMemo(() => ({
    delivered: shipments.filter(s => s.status === 'delivered').length,
    in_transit: shipments.filter(s => s.status === 'in_transit').length,
    issue: shipments.filter(s => s.status === 'issue').length,
    pending: shipments.filter(s => s.status === 'pending' || s.status === 'in_office').length,
  }), [shipments]);

  return (
    <div className="bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-700 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 dark:border-navy-700 bg-gradient-to-r from-teal-500/10 to-emerald-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl">
              <Map className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                Mapa de Envíos
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Visualización geográfica de rutas y destinos
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('all')}
              className={`px-4 py-2 rounded-xl font-medium text-sm transition-colors ${
                viewMode === 'all'
                  ? 'bg-teal-500 text-white'
                  : 'bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setViewMode('single')}
              className={`px-4 py-2 rounded-xl font-medium text-sm transition-colors ${
                viewMode === 'single'
                  ? 'bg-teal-500 text-white'
                  : 'bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              Por Guía
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-0">
        {/* Sidebar de estadísticas */}
        <div className="border-r border-slate-200 dark:border-navy-700 p-4">
          {/* Estados */}
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
            📊 Estados de Envío
          </h3>
          <div className="space-y-2 mb-6">
            <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <span className="text-sm text-green-700 dark:text-green-400">✓ Entregados</span>
              <span className="font-bold text-green-700 dark:text-green-400">{statusCounts.delivered}</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <span className="text-sm text-blue-700 dark:text-blue-400">🚚 En tránsito</span>
              <span className="font-bold text-blue-700 dark:text-blue-400">{statusCounts.in_transit}</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <span className="text-sm text-red-700 dark:text-red-400">⚠ Con novedad</span>
              <span className="font-bold text-red-700 dark:text-red-400">{statusCounts.issue}</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <span className="text-sm text-amber-700 dark:text-amber-400">⏳ Pendientes</span>
              <span className="font-bold text-amber-700 dark:text-amber-400">{statusCounts.pending}</span>
            </div>
          </div>

          {/* Top ciudades */}
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
            📍 Top Destinos
          </h3>
          <div className="space-y-2">
            {locationStats.map(([city, count], index) => (
              <div key={city} className="flex items-center gap-2">
                <span className="w-6 h-6 flex items-center justify-center bg-slate-100 dark:bg-navy-800 rounded-full text-xs font-bold">
                  {index + 1}
                </span>
                <span className="flex-1 text-sm text-slate-600 dark:text-slate-400 truncate">
                  {city}
                </span>
                <span className="text-sm font-bold text-slate-800 dark:text-white">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Mapa visual */}
        <div className="lg:col-span-3 p-6">
          {/* Mapa simplificado de Colombia */}
          <div className="relative bg-gradient-to-br from-slate-100 to-slate-200 dark:from-navy-800 dark:to-navy-900 rounded-2xl p-8 min-h-[500px]">
            {/* Leyenda */}
            <div className="absolute top-4 right-4 bg-white dark:bg-navy-800 rounded-xl p-4 shadow-lg">
              <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">LEYENDA</h4>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-green-500"></span>
                  <span className="text-slate-600 dark:text-slate-400">Entregado</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                  <span className="text-slate-600 dark:text-slate-400">En tránsito</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500"></span>
                  <span className="text-slate-600 dark:text-slate-400">Novedad</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                  <span className="text-slate-600 dark:text-slate-400">Pendiente</span>
                </div>
              </div>
            </div>

            {/* Representación visual de rutas */}
            <div className="flex flex-col items-center justify-center h-full space-y-8">
              <div className="text-center">
                <div className="text-6xl mb-4">🇨🇴</div>
                <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">
                  Colombia
                </h3>
                <p className="text-sm text-slate-500 mt-2">
                  {shipments.length} envíos activos
                </p>
              </div>

              {/* Ruta visual simplificada */}
              <div className="flex items-center gap-4 flex-wrap justify-center">
                {locationStats.slice(0, 5).map(([city, count]) => (
                  <div
                    key={city}
                    className="relative group cursor-pointer"
                  >
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white font-bold shadow-lg hover:scale-110 transition-transform">
                      {count}
                    </div>
                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-medium text-slate-600 dark:text-slate-400">
                      {city.split(' ')[0]}
                    </div>
                  </div>
                ))}
              </div>

              {/* Estadísticas de cobertura */}
              <div className="grid grid-cols-3 gap-8 mt-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-teal-600 dark:text-teal-400">
                    {locationStats.length}
                  </div>
                  <div className="text-sm text-slate-500">Ciudades</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                    {new Set(shipments.map(s => s.carrier)).size}
                  </div>
                  <div className="text-sm text-slate-500">Transportadoras</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {shipments.length}
                  </div>
                  <div className="text-sm text-slate-500">Envíos</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// =====================================
// CEREBRO VIEW - Coordinador Inteligente
// =====================================
const CerebroView: React.FC<{ shipments: Shipment[] }> = ({ shipments }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  // Análisis inteligente
  const analysis = useMemo(() => {
    const total = shipments.length;
    const delivered = shipments.filter(s => s.status === 'delivered').length;
    const issues = shipments.filter(s => s.status === 'issue').length;
    const inTransit = shipments.filter(s => s.status === 'in_transit').length;

    // Calcular métricas
    const deliveryRate = total > 0 ? (delivered / total) * 100 : 0;
    const issueRate = total > 0 ? (issues / total) * 100 : 0;

    // Detectar patrones
    const patterns: string[] = [];
    if (issueRate > 20) patterns.push('🚨 Alta tasa de novedades');
    if (deliveryRate > 80) patterns.push('✅ Excelente tasa de entrega');
    if (inTransit > total * 0.5) patterns.push('🚚 Muchos envíos en tránsito');

    // Recomendaciones
    const recommendations: string[] = [];
    if (issues > 0) recommendations.push(`Priorizar ${issues} guías con novedad`);
    if (inTransit > 10) recommendations.push('Monitorear envíos en tránsito prolongado');

    // Agrupar por transportadora
    const byCarrier: Record<string, { total: number; delivered: number; issues: number }> = {};
    shipments.forEach(s => {
      if (!byCarrier[s.carrier]) {
        byCarrier[s.carrier] = { total: 0, delivered: 0, issues: 0 };
      }
      byCarrier[s.carrier].total++;
      if (s.status === 'delivered') byCarrier[s.carrier].delivered++;
      if (s.status === 'issue') byCarrier[s.carrier].issues++;
    });

    return {
      total,
      delivered,
      issues,
      inTransit,
      deliveryRate,
      issueRate,
      patterns,
      recommendations,
      byCarrier,
    };
  }, [shipments]);

  const runAnalysis = useCallback(() => {
    setIsAnalyzing(true);
    // Simular análisis
    setTimeout(() => {
      setAnalysisResult({
        timestamp: new Date().toLocaleString('es-CO'),
        insights: [
          { type: 'success', message: `${analysis.delivered} guías entregadas exitosamente` },
          { type: 'warning', message: `${analysis.issues} guías requieren atención inmediata` },
          { type: 'info', message: `Tasa de entrega: ${analysis.deliveryRate.toFixed(1)}%` },
        ],
        prediction: analysis.deliveryRate > 70
          ? 'Buen rendimiento esperado para hoy'
          : 'Revisar guías problemáticas',
      });
      setIsAnalyzing(false);
    }, 1500);
  }, [analysis]);

  return (
    <div className="space-y-6">
      {/* Header del Cerebro */}
      <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
              <Brain className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Cerebro Central</h2>
              <p className="text-white/80">
                Coordinador inteligente de logística
              </p>
            </div>
          </div>
          <button
            onClick={runAnalysis}
            disabled={isAnalyzing}
            className="px-6 py-3 bg-white/20 hover:bg-white/30 rounded-xl font-bold transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Analizando...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                Analizar Ahora
              </>
            )}
          </button>
        </div>

        {/* Métricas principales */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="bg-white/10 rounded-xl p-4">
            <div className="text-3xl font-bold">{analysis.total}</div>
            <div className="text-sm text-white/70">Total Guías</div>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <div className="text-3xl font-bold text-green-300">{analysis.deliveryRate.toFixed(0)}%</div>
            <div className="text-sm text-white/70">Tasa Entrega</div>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <div className="text-3xl font-bold text-red-300">{analysis.issues}</div>
            <div className="text-sm text-white/70">Novedades</div>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <div className="text-3xl font-bold text-blue-300">{analysis.inTransit}</div>
            <div className="text-sm text-white/70">En Tránsito</div>
          </div>
        </div>
      </div>

      {/* Resultado del análisis */}
      {analysisResult && (
        <div className="bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-700 p-6 animate-fade-in">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="w-6 h-6 text-green-500" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">
              Análisis Completado
            </h3>
            <span className="text-sm text-slate-500 ml-auto">
              {analysisResult.timestamp}
            </span>
          </div>

          <div className="space-y-3">
            {analysisResult.insights.map((insight: any, i: number) => (
              <div
                key={i}
                className={`p-4 rounded-xl flex items-center gap-3 ${
                  insight.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' :
                  insight.type === 'warning' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400' :
                  'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                }`}
              >
                {insight.type === 'success' && <CheckCircle className="w-5 h-5" />}
                {insight.type === 'warning' && <AlertTriangle className="w-5 h-5" />}
                {insight.type === 'info' && <Eye className="w-5 h-5" />}
                <span className="font-medium">{insight.message}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl">
            <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400">
              <Brain className="w-5 h-5" />
              <span className="font-bold">Predicción IA:</span>
              <span>{analysisResult.prediction}</span>
            </div>
          </div>
        </div>
      )}

      {/* Paneles de análisis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Patrones detectados */}
        <div className="bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-700 p-6">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-500" />
            Patrones Detectados
          </h3>
          {analysis.patterns.length > 0 ? (
            <div className="space-y-3">
              {analysis.patterns.map((pattern, i) => (
                <div key={i} className="p-3 bg-slate-50 dark:bg-navy-800 rounded-xl text-slate-700 dark:text-slate-300">
                  {pattern}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-sm">No hay patrones significativos detectados</p>
          )}
        </div>

        {/* Recomendaciones */}
        <div className="bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-700 p-6">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            Recomendaciones IA
          </h3>
          {analysis.recommendations.length > 0 ? (
            <div className="space-y-3">
              {analysis.recommendations.map((rec, i) => (
                <div key={i} className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-amber-700 dark:text-amber-400 flex items-center gap-2">
                  <ChevronRight className="w-4 h-4" />
                  {rec}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-sm">Sin recomendaciones pendientes</p>
          )}
        </div>

        {/* Análisis por transportadora */}
        <div className="lg:col-span-2 bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-700 p-6">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-500" />
            Rendimiento por Transportadora
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-navy-700">
                  <th className="text-left py-3 px-4 text-sm font-bold text-slate-500">Transportadora</th>
                  <th className="text-center py-3 px-4 text-sm font-bold text-slate-500">Total</th>
                  <th className="text-center py-3 px-4 text-sm font-bold text-slate-500">Entregados</th>
                  <th className="text-center py-3 px-4 text-sm font-bold text-slate-500">Novedades</th>
                  <th className="text-center py-3 px-4 text-sm font-bold text-slate-500">Tasa</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(analysis.byCarrier).map(([carrier, stats]) => (
                  <tr key={carrier} className="border-b border-slate-100 dark:border-navy-800">
                    <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">{carrier}</td>
                    <td className="py-3 px-4 text-center text-slate-600 dark:text-slate-400">{stats.total}</td>
                    <td className="py-3 px-4 text-center text-green-600 dark:text-green-400">{stats.delivered}</td>
                    <td className="py-3 px-4 text-center text-red-600 dark:text-red-400">{stats.issues}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-1 rounded-lg text-sm font-bold ${
                        (stats.delivered / stats.total) > 0.7
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      }`}>
                        {((stats.delivered / stats.total) * 100).toFixed(0)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OperacionesUnificadoTab;
