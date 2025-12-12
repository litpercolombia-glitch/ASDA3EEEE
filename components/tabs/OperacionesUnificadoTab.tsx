// components/tabs/OperacionesUnificadoTab.tsx
// Tab unificado que combina: Seguimiento + Inteligencia Logística + Semáforo
import React, { useState, useMemo } from 'react';
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
} from 'lucide-react';
import { Shipment } from '../../types';

// Importar los tabs existentes
import { SeguimientoTab } from './SeguimientoTab';
import { InteligenciaLogisticaTab } from './InteligenciaLogisticaTab';
import SemaforoTabNew from './SemaforoTabNew';

// =====================================
// TIPOS
// =====================================
type SubView = 'carga' | 'tabla' | 'inteligencia' | 'semaforo';

interface OperacionesUnificadoTabProps {
  shipments: Shipment[];
  onShipmentsLoaded?: (shipments: Shipment[]) => void;
  onSemaforoDataLoaded?: (data: any) => void;
}

// =====================================
// SUB-NAVEGACIÓN
// =====================================
const subNavItems: { id: SubView; label: string; icon: React.ElementType; description: string; color: string }[] = [
  {
    id: 'carga',
    label: 'Carga de Datos',
    icon: Upload,
    description: 'Importar guías',
    color: 'cyan'
  },
  {
    id: 'tabla',
    label: 'Tabla de Guías',
    icon: Table,
    description: 'Ver y gestionar',
    color: 'blue'
  },
  {
    id: 'inteligencia',
    label: 'Intel. Logística',
    icon: BarChart3,
    description: 'Análisis profundo',
    color: 'purple'
  },
  {
    id: 'semaforo',
    label: 'Semáforo',
    icon: Activity,
    description: 'Vista por estados',
    color: 'amber'
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
                  {item.id === 'inteligencia' && metrics.criticos > 0 && !isActive && (
                    <span className="px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full">
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

        {activeView === 'tabla' && (
          <div className="animate-fade-in">
            {shipments.length === 0 ? (
              <EmptyState
                title="No hay guías cargadas"
                description="Ve a 'Carga de Datos' para importar tus guías"
                action={() => setActiveView('carga')}
                actionLabel="Ir a Carga de Datos"
              />
            ) : (
              <TablaGuiasRapida shipments={shipments} />
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

export default OperacionesUnificadoTab;
