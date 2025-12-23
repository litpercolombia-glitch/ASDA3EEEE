// components/ChatFirst/SkillViews/SeguimientoSkillView.tsx
// Vista simplificada de Seguimiento - Solo lo esencial
import React, { useMemo, useState } from 'react';
import {
  Package,
  Search,
  AlertTriangle,
  CheckCircle,
  Clock,
  Truck,
  MapPin,
  Phone,
  ExternalLink,
  Filter,
  ChevronRight,
  Eye,
} from 'lucide-react';
import { Shipment, ShipmentStatus } from '../../../types';

interface SeguimientoSkillViewProps {
  shipments: Shipment[];
  onShipmentClick?: (shipment: Shipment) => void;
  onChatQuery?: (query: string) => void;
}

interface ProcessedShipment {
  shipment: Shipment;
  daysInTransit: number;
  alertLevel: 'CRITICO' | 'ALTO' | 'MEDIO' | 'NORMAL';
  lastEvent: string;
}

const getAlertColor = (level: string) => {
  switch (level) {
    case 'CRITICO': return 'bg-red-500/20 border-red-500/50 text-red-300';
    case 'ALTO': return 'bg-orange-500/20 border-orange-500/50 text-orange-300';
    case 'MEDIO': return 'bg-amber-500/20 border-amber-500/50 text-amber-300';
    default: return 'bg-slate-500/20 border-slate-500/50 text-slate-300';
  }
};

const getStatusIcon = (status: ShipmentStatus) => {
  switch (status) {
    case ShipmentStatus.DELIVERED: return <CheckCircle className="w-4 h-4 text-emerald-400" />;
    case ShipmentStatus.IN_TRANSIT: return <Truck className="w-4 h-4 text-blue-400" />;
    case ShipmentStatus.PENDING: return <Clock className="w-4 h-4 text-amber-400" />;
    case ShipmentStatus.ISSUE:
    case ShipmentStatus.EXCEPTION: return <AlertTriangle className="w-4 h-4 text-red-400" />;
    default: return <Package className="w-4 h-4 text-slate-400" />;
  }
};

export const SeguimientoSkillView: React.FC<SeguimientoSkillViewProps> = ({
  shipments,
  onShipmentClick,
  onChatQuery,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'critical' | 'in_transit' | 'delivered'>('all');

  // Procesar envios con alertas
  const processedShipments = useMemo((): ProcessedShipment[] => {
    return shipments.map(shipment => {
      const days = shipment.detailedInfo?.daysInTransit || 0;
      const hasIssue = shipment.status === ShipmentStatus.ISSUE ||
                       shipment.status === ShipmentStatus.EXCEPTION;

      let alertLevel: ProcessedShipment['alertLevel'] = 'NORMAL';
      if (hasIssue || days >= 7) alertLevel = 'CRITICO';
      else if (days >= 5) alertLevel = 'ALTO';
      else if (days >= 3) alertLevel = 'MEDIO';

      return {
        shipment,
        daysInTransit: days,
        alertLevel,
        lastEvent: shipment.detailedInfo?.lastEvent || shipment.statusDescription || 'Sin informacion',
      };
    });
  }, [shipments]);

  // Filtrar envios
  const filteredShipments = useMemo(() => {
    let filtered = processedShipments;

    // Filtro por estado
    switch (filter) {
      case 'critical':
        filtered = filtered.filter(p => p.alertLevel === 'CRITICO' || p.alertLevel === 'ALTO');
        break;
      case 'in_transit':
        filtered = filtered.filter(p => p.shipment.status === ShipmentStatus.IN_TRANSIT);
        break;
      case 'delivered':
        filtered = filtered.filter(p => p.shipment.status === ShipmentStatus.DELIVERED);
        break;
    }

    // Filtro por busqueda
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.shipment.trackingNumber?.toLowerCase().includes(query) ||
        p.shipment.id?.toLowerCase().includes(query) ||
        p.shipment.recipientPhone?.includes(query) ||
        p.shipment.detailedInfo?.destination?.toLowerCase().includes(query)
      );
    }

    // Ordenar por alerta (criticos primero)
    return filtered.sort((a, b) => {
      const order = { CRITICO: 0, ALTO: 1, MEDIO: 2, NORMAL: 3 };
      return order[a.alertLevel] - order[b.alertLevel];
    }).slice(0, 50); // Limitar a 50
  }, [processedShipments, filter, searchQuery]);

  // Stats rapidas
  const stats = useMemo(() => {
    const critical = processedShipments.filter(p => p.alertLevel === 'CRITICO' || p.alertLevel === 'ALTO').length;
    const inTransit = processedShipments.filter(p => p.shipment.status === ShipmentStatus.IN_TRANSIT).length;
    const delivered = processedShipments.filter(p => p.shipment.status === ShipmentStatus.DELIVERED).length;
    return { critical, inTransit, delivered, total: shipments.length };
  }, [processedShipments, shipments.length]);

  return (
    <div className="space-y-4">
      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats.total, color: 'text-white', bg: 'bg-slate-600' },
          { label: 'Criticos', value: stats.critical, color: 'text-red-400', bg: 'bg-red-500/20' },
          { label: 'En Transito', value: stats.inTransit, color: 'text-blue-400', bg: 'bg-blue-500/20' },
          { label: 'Entregados', value: stats.delivered, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
        ].map((stat) => (
          <button
            key={stat.label}
            onClick={() => {
              if (stat.label === 'Criticos') setFilter('critical');
              else if (stat.label === 'En Transito') setFilter('in_transit');
              else if (stat.label === 'Entregados') setFilter('delivered');
              else setFilter('all');
            }}
            className={`${stat.bg} p-3 rounded-xl text-center transition-all hover:scale-105`}
          >
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-slate-400">{stat.label}</p>
          </button>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por guia, telefono, destino..."
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-accent-500"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'critical', 'in_transit', 'delivered'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                filter === f
                  ? 'bg-accent-500 text-white'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10'
              }`}
            >
              {f === 'all' ? 'Todos' : f === 'critical' ? 'Criticos' : f === 'in_transit' ? 'Transito' : 'Entregados'}
            </button>
          ))}
        </div>
      </div>

      {/* Shipments List */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
        {filteredShipments.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No se encontraron envios</p>
            {searchQuery && (
              <button
                onClick={() => onChatQuery?.(`Buscar guia ${searchQuery}`)}
                className="mt-2 text-accent-400 hover:underline text-sm"
              >
                Buscar "{searchQuery}" con IA
              </button>
            )}
          </div>
        ) : (
          filteredShipments.map((processed) => (
            <button
              key={processed.shipment.id}
              onClick={() => onShipmentClick?.(processed.shipment)}
              className={`w-full p-3 rounded-xl border ${getAlertColor(processed.alertLevel)} text-left transition-all hover:scale-[1.01] hover:shadow-lg`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  {getStatusIcon(processed.shipment.status)}
                  <div>
                    <p className="font-mono font-bold text-white">
                      {processed.shipment.trackingNumber || processed.shipment.id}
                    </p>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" />
                      {processed.shipment.detailedInfo?.destination || 'Destino no especificado'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    processed.alertLevel === 'CRITICO' ? 'bg-red-500 text-white' :
                    processed.alertLevel === 'ALTO' ? 'bg-orange-500 text-white' :
                    processed.alertLevel === 'MEDIO' ? 'bg-amber-500 text-white' :
                    'bg-slate-600 text-slate-300'
                  }`}>
                    {processed.daysInTransit}d
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-2 truncate">
                {processed.lastEvent}
              </p>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/10">
                <span className="text-xs text-slate-500">
                  {processed.shipment.carrier || 'Transportadora'}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </div>
            </button>
          ))
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10">
        <button
          onClick={() => onChatQuery?.('Cuales envios tienen mas de 5 dias sin movimiento?')}
          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-slate-300"
        >
          Ver retrasos criticos
        </button>
        <button
          onClick={() => onChatQuery?.('Genera reporte de envios en transito')}
          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-slate-300"
        >
          Reporte de transito
        </button>
        <button
          onClick={() => onChatQuery?.('Que envios necesitan atencion urgente?')}
          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-slate-300"
        >
          Atencion urgente
        </button>
      </div>
    </div>
  );
};

export default SeguimientoSkillView;
