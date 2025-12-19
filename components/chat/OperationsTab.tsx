// components/chat/OperationsTab.tsx
// Tab de Operaciones - Migrado de ProBubbleV3

import React, { useState, useMemo } from 'react';
import {
  Package,
  Search,
  Filter,
  Phone,
  MessageCircle,
  Copy,
  CheckCircle,
  Truck,
  AlertTriangle,
  Clock,
  Building,
  TrendingUp,
  ChevronRight,
  ExternalLink,
  RefreshCw,
  Download,
  X,
} from 'lucide-react';
import { Shipment } from '../../types';

type FilterType = 'all' | 'delivered' | 'in_transit' | 'issue' | 'in_office' | 'pending';

interface OperationsTabProps {
  shipments?: Shipment[];
  onNavigateToTab?: (tab: string) => void;
  onExportData?: () => void;
  compact?: boolean;
}

export const OperationsTab: React.FC<OperationsTabProps> = ({
  shipments = [],
  onNavigateToTab,
  onExportData,
  compact = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);

  // Métricas
  const metrics = useMemo(() => {
    const total = shipments.length;
    const delivered = shipments.filter((s) => s.status === 'delivered').length;
    const inTransit = shipments.filter((s) => s.status === 'in_transit').length;
    const issues = shipments.filter((s) => s.status === 'issue').length;
    const inOffice = shipments.filter((s) => s.status === 'in_office').length;
    const pending = shipments.filter((s) => s.status === 'pending').length;

    return {
      total,
      delivered,
      inTransit,
      issues,
      inOffice,
      pending,
      deliveryRate: total > 0 ? Math.round((delivered / total) * 100) : 0,
    };
  }, [shipments]);

  // Filtros
  const filters: { id: FilterType; label: string; count: number; color: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'Todas', count: metrics.total, color: 'slate', icon: <Package className="w-4 h-4" /> },
    { id: 'delivered', label: 'Entregadas', count: metrics.delivered, color: 'emerald', icon: <CheckCircle className="w-4 h-4" /> },
    { id: 'in_transit', label: 'Tránsito', count: metrics.inTransit, color: 'blue', icon: <Truck className="w-4 h-4" /> },
    { id: 'issue', label: 'Novedad', count: metrics.issues, color: 'red', icon: <AlertTriangle className="w-4 h-4" /> },
    { id: 'in_office', label: 'Oficina', count: metrics.inOffice, color: 'amber', icon: <Building className="w-4 h-4" /> },
    { id: 'pending', label: 'Pendientes', count: metrics.pending, color: 'purple', icon: <Clock className="w-4 h-4" /> },
  ];

  // Filtrar shipments
  const filteredShipments = useMemo(() => {
    return shipments.filter((s) => {
      const matchesFilter = activeFilter === 'all' || s.status === activeFilter;
      const matchesSearch =
        searchQuery === '' ||
        s.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.recipientName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (s.recipientPhone || '').includes(searchQuery) ||
        (s.recipientCity?.toLowerCase() || '').includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [shipments, activeFilter, searchQuery]);

  // Copiar al portapapeles
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Abrir WhatsApp
  const openWhatsApp = (phone: string, message?: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const url = `https://wa.me/${cleanPhone}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
    window.open(url, '_blank');
  };

  // Llamar
  const makeCall = (phone: string) => {
    window.open(`tel:${phone}`, '_self');
  };

  const getStatusStyle = (status: string) => {
    const styles: Record<string, string> = {
      delivered: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30',
      in_transit: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30',
      issue: 'bg-red-100 text-red-700 dark:bg-red-900/30',
      in_office: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30',
      pending: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30',
      returned: 'bg-slate-100 text-slate-700 dark:bg-slate-900/30',
    };
    return styles[status] || styles.pending;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      delivered: 'Entregado',
      in_transit: 'En tránsito',
      issue: 'Novedad',
      in_office: 'En oficina',
      pending: 'Pendiente',
      returned: 'Devuelto',
    };
    return labels[status] || status;
  };

  // Vista de detalle
  if (selectedShipment) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-slate-200 dark:border-navy-700 flex items-center gap-3">
          <button
            onClick={() => setSelectedShipment(null)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-navy-800 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h3 className="font-bold text-slate-800 dark:text-white">
              {selectedShipment.trackingNumber}
            </h3>
            <p className="text-sm text-slate-500">{selectedShipment.carrier}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusStyle(selectedShipment.status)}`}>
            {getStatusLabel(selectedShipment.status)}
          </span>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-4">
          {/* Info del destinatario */}
          <div className="bg-slate-50 dark:bg-navy-800 rounded-xl p-4">
            <h4 className="font-semibold text-slate-800 dark:text-white mb-3">Destinatario</h4>
            <div className="space-y-2">
              <p className="text-sm">
                <span className="text-slate-500">Nombre:</span>{' '}
                <span className="font-medium">{selectedShipment.recipientName || 'No registrado'}</span>
              </p>
              <p className="text-sm">
                <span className="text-slate-500">Teléfono:</span>{' '}
                <span className="font-medium">{selectedShipment.recipientPhone || 'No registrado'}</span>
              </p>
              <p className="text-sm">
                <span className="text-slate-500">Ciudad:</span>{' '}
                <span className="font-medium">{selectedShipment.recipientCity || 'No registrada'}</span>
              </p>
              <p className="text-sm">
                <span className="text-slate-500">Dirección:</span>{' '}
                <span className="font-medium">{selectedShipment.recipientAddress || 'No registrada'}</span>
              </p>
            </div>
          </div>

          {/* Valores */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 text-center">
              <p className="text-xs text-slate-500">Valor Declarado</p>
              <p className="text-lg font-bold text-emerald-600">
                ${selectedShipment.declaredValue?.toLocaleString() || 0}
              </p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-center">
              <p className="text-xs text-slate-500">COD</p>
              <p className="text-lg font-bold text-blue-600">
                ${selectedShipment.codAmount?.toLocaleString() || 0}
              </p>
            </div>
          </div>

          {/* Acciones rápidas */}
          {selectedShipment.recipientPhone && (
            <div className="flex gap-2">
              <button
                onClick={() => openWhatsApp(selectedShipment.recipientPhone!)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                WhatsApp
              </button>
              <button
                onClick={() => makeCall(selectedShipment.recipientPhone!)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors"
              >
                <Phone className="w-5 h-5" />
                Llamar
              </button>
            </div>
          )}

          {/* Eventos */}
          {selectedShipment.events && selectedShipment.events.length > 0 && (
            <div className="bg-slate-50 dark:bg-navy-800 rounded-xl p-4">
              <h4 className="font-semibold text-slate-800 dark:text-white mb-3">Historial</h4>
              <div className="space-y-3">
                {selectedShipment.events.slice(0, 5).map((event, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-purple-500 mt-2 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-white">
                        {event.description}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(event.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header con métricas */}
      <div className="p-4 border-b border-slate-200 dark:border-navy-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white">Operaciones</h3>
              <p className="text-xs text-slate-500">{metrics.total} guías</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-lg font-bold text-emerald-600">{metrics.deliveryRate}%</p>
              <p className="text-xs text-slate-500">Entrega</p>
            </div>
            {onExportData && (
              <button
                onClick={onExportData}
                className="p-2 hover:bg-slate-100 dark:hover:bg-navy-800 rounded-lg"
                title="Exportar Excel"
              >
                <Download className="w-5 h-5 text-slate-500" />
              </button>
            )}
          </div>
        </div>

        {/* Búsqueda */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar guía, nombre, teléfono..."
            className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-navy-800 rounded-xl text-sm"
          />
        </div>
      </div>

      {/* Filtros */}
      <div className="px-4 py-3 border-b border-slate-200 dark:border-navy-700 overflow-x-auto">
        <div className="flex gap-2">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeFilter === filter.id
                  ? `bg-${filter.color}-100 text-${filter.color}-700 dark:bg-${filter.color}-900/30`
                  : 'bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-navy-700'
              }`}
            >
              {filter.icon}
              {filter.label}
              <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                activeFilter === filter.id
                  ? 'bg-white/50'
                  : 'bg-slate-200 dark:bg-navy-700'
              }`}>
                {filter.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Lista de guías */}
      <div className="flex-1 overflow-auto">
        {filteredShipments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <Package className="w-12 h-12 mb-3 opacity-30" />
            <p>No hay guías</p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-sm text-purple-600 mt-2"
              >
                Limpiar búsqueda
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-navy-700">
            {filteredShipments.slice(0, 50).map((shipment) => (
              <div
                key={shipment.id}
                className="p-4 hover:bg-slate-50 dark:hover:bg-navy-800 transition-colors"
              >
                <div className="flex items-start gap-3">
                  {/* Status indicator */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${getStatusStyle(shipment.status)}`}>
                    {shipment.status === 'delivered' && <CheckCircle className="w-5 h-5" />}
                    {shipment.status === 'in_transit' && <Truck className="w-5 h-5" />}
                    {shipment.status === 'issue' && <AlertTriangle className="w-5 h-5" />}
                    {shipment.status === 'in_office' && <Building className="w-5 h-5" />}
                    {shipment.status === 'pending' && <Clock className="w-5 h-5" />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <button
                        onClick={() => copyToClipboard(shipment.trackingNumber, shipment.id)}
                        className="font-mono font-semibold text-slate-800 dark:text-white hover:text-purple-600 flex items-center gap-1"
                      >
                        {shipment.trackingNumber}
                        {copiedId === shipment.id ? (
                          <CheckCircle className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <Copy className="w-3 h-3 opacity-50" />
                        )}
                      </button>
                      <span className="text-xs text-slate-400">{shipment.carrier}</span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 truncate">
                      {shipment.recipientName || 'Sin nombre'}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {shipment.recipientCity || 'Sin ciudad'}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {shipment.recipientPhone && (
                      <>
                        <button
                          onClick={() => openWhatsApp(shipment.recipientPhone!)}
                          className="p-2 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded-lg text-emerald-600"
                          title="WhatsApp"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => makeCall(shipment.recipientPhone!)}
                          className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg text-blue-600"
                          title="Llamar"
                        >
                          <Phone className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setSelectedShipment(shipment)}
                      className="p-2 hover:bg-slate-100 dark:hover:bg-navy-800 rounded-lg text-slate-400"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {filteredShipments.length > 50 && (
              <div className="p-4 text-center text-sm text-slate-500">
                Mostrando 50 de {filteredShipments.length} guías
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OperationsTab;
