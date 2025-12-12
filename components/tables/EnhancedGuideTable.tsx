// components/tables/EnhancedGuideTable.tsx
// Tabla mejorada de guías con filtros funcionales y más información logística
import React, { useState, useMemo, useCallback } from 'react';
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Package,
  Truck,
  CheckCircle,
  AlertTriangle,
  Building2,
  Clock,
  MapPin,
  Phone,
  MessageSquare,
  Copy,
  Eye,
  X,
  Calendar,
  ArrowUpDown,
  SlidersHorizontal,
  FileSpreadsheet,
  MoreVertical,
  ExternalLink,
  History,
  Target,
  TrendingUp,
  Info,
} from 'lucide-react';
import { Shipment } from '../../types';

// =====================================
// TIPOS
// =====================================

interface FilterState {
  search: string;
  status: string[];
  carrier: string[];
  city: string;
  hasPhone: 'all' | 'yes' | 'no';
  daysRange: [number, number];
  dateRange: [string, string];
}

interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

interface EnhancedGuideTableProps {
  shipments: Shipment[];
  onRefresh?: () => void;
  onExport?: () => void;
}

// =====================================
// COMPONENTE PRINCIPAL
// =====================================

export const EnhancedGuideTable: React.FC<EnhancedGuideTableProps> = ({
  shipments,
  onRefresh,
  onExport,
}) => {
  // Estados
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: [],
    carrier: [],
    city: '',
    hasPhone: 'all',
    daysRange: [0, 30],
    dateRange: ['', ''],
  });
  const [showFilters, setShowFilters] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'id', direction: 'desc' });
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // =====================================
  // DATOS DERIVADOS
  // =====================================

  // Obtener valores únicos para filtros
  const uniqueCarriers = useMemo(() => {
    const carriers = new Set<string>();
    shipments.forEach(s => {
      if (s.carrier) carriers.add(s.carrier);
    });
    return Array.from(carriers).sort();
  }, [shipments]);

  const uniqueCities = useMemo(() => {
    const cities = new Set<string>();
    shipments.forEach(s => {
      if (s.detailedInfo?.destination) cities.add(s.detailedInfo.destination);
    });
    return Array.from(cities).sort();
  }, [shipments]);

  // Filtrar guías
  const filteredShipments = useMemo(() => {
    return shipments.filter(s => {
      // Búsqueda
      if (filters.search) {
        const query = filters.search.toLowerCase();
        const matchesSearch =
          s.id?.toLowerCase().includes(query) ||
          s.trackingNumber?.toLowerCase().includes(query) ||
          s.phone?.includes(query) ||
          s.recipientPhone?.includes(query) ||
          s.senderPhone?.includes(query) ||
          s.detailedInfo?.destination?.toLowerCase().includes(query) ||
          s.carrier?.toLowerCase().includes(query) ||
          s.recipientName?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Estado
      if (filters.status.length > 0 && !filters.status.includes(s.status)) {
        return false;
      }

      // Transportadora
      if (filters.carrier.length > 0 && !filters.carrier.includes(s.carrier || '')) {
        return false;
      }

      // Ciudad
      if (filters.city && s.detailedInfo?.destination !== filters.city) {
        return false;
      }

      // Teléfono
      if (filters.hasPhone === 'yes') {
        const hasPhone = s.phone || s.recipientPhone || s.senderPhone;
        if (!hasPhone) return false;
      } else if (filters.hasPhone === 'no') {
        const hasPhone = s.phone || s.recipientPhone || s.senderPhone;
        if (hasPhone) return false;
      }

      // Días en tránsito
      const days = s.detailedInfo?.daysInTransit || 0;
      if (days < filters.daysRange[0] || days > filters.daysRange[1]) {
        return false;
      }

      return true;
    });
  }, [shipments, filters]);

  // Ordenar
  const sortedShipments = useMemo(() => {
    const sorted = [...filteredShipments];
    sorted.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortConfig.key) {
        case 'id':
          aValue = a.trackingNumber || a.id;
          bValue = b.trackingNumber || b.id;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'carrier':
          aValue = a.carrier || '';
          bValue = b.carrier || '';
          break;
        case 'city':
          aValue = a.detailedInfo?.destination || '';
          bValue = b.detailedInfo?.destination || '';
          break;
        case 'days':
          aValue = a.detailedInfo?.daysInTransit || 0;
          bValue = b.detailedInfo?.daysInTransit || 0;
          break;
        default:
          aValue = a.id;
          bValue = b.id;
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredShipments, sortConfig]);

  // Paginación
  const paginatedShipments = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedShipments.slice(start, start + pageSize);
  }, [sortedShipments, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedShipments.length / pageSize);

  // Estadísticas
  const stats = useMemo(() => {
    const total = filteredShipments.length;
    const delivered = filteredShipments.filter(s => s.status === 'delivered').length;
    const inTransit = filteredShipments.filter(s => s.status === 'in_transit').length;
    const issues = filteredShipments.filter(s => s.status === 'issue').length;
    const inOffice = filteredShipments.filter(s => s.status === 'in_office').length;
    const withPhone = filteredShipments.filter(s => s.phone || s.recipientPhone || s.senderPhone).length;

    return { total, delivered, inTransit, issues, inOffice, withPhone };
  }, [filteredShipments]);

  // =====================================
  // HANDLERS
  // =====================================

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleStatusFilter = (status: string) => {
    setFilters(prev => ({
      ...prev,
      status: prev.status.includes(status)
        ? prev.status.filter(s => s !== status)
        : [...prev.status, status],
    }));
    setCurrentPage(1);
  };

  const handleCarrierFilter = (carrier: string) => {
    setFilters(prev => ({
      ...prev,
      carrier: prev.carrier.includes(carrier)
        ? prev.carrier.filter(c => c !== carrier)
        : [...prev.carrier, carrier],
    }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: [],
      carrier: [],
      city: '',
      hasPhone: 'all',
      daysRange: [0, 30],
      dateRange: ['', ''],
    });
    setCurrentPage(1);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleWhatsApp = (shipment: Shipment) => {
    const phone = shipment.recipientPhone || shipment.senderPhone || shipment.phone;
    if (phone) {
      const cleanPhone = phone.replace(/\D/g, '');
      const message = encodeURIComponent(`Hola! Le contactamos sobre su envío ${shipment.trackingNumber || shipment.id}`);
      window.open(`https://wa.me/57${cleanPhone}?text=${message}`, '_blank');
    }
  };

  const handleCall = (shipment: Shipment) => {
    const phone = shipment.recipientPhone || shipment.senderPhone || shipment.phone;
    if (phone) {
      window.open(`tel:${phone}`, '_self');
    }
  };

  // =====================================
  // HELPERS
  // =====================================

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'delivered':
        return { icon: CheckCircle, color: 'emerald', label: 'Entregado', bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400' };
      case 'in_transit':
        return { icon: Truck, color: 'blue', label: 'En tránsito', bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' };
      case 'issue':
        return { icon: AlertTriangle, color: 'red', label: 'Novedad', bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400' };
      case 'in_office':
        return { icon: Building2, color: 'amber', label: 'En oficina', bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400' };
      default:
        return { icon: Package, color: 'slate', label: status, bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-400' };
    }
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.status.length > 0) count++;
    if (filters.carrier.length > 0) count++;
    if (filters.city) count++;
    if (filters.hasPhone !== 'all') count++;
    if (filters.daysRange[0] > 0 || filters.daysRange[1] < 30) count++;
    return count;
  }, [filters]);

  // =====================================
  // RENDER
  // =====================================

  return (
    <div className="bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-700 overflow-hidden">
      {/* ===== HEADER CON ESTADÍSTICAS ===== */}
      <div className="p-4 border-b border-slate-200 dark:border-navy-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-navy-900 dark:to-navy-950">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Stats */}
          <div className="flex items-center gap-3 overflow-x-auto pb-2 lg:pb-0">
            {[
              { label: 'Total', value: stats.total, color: 'slate', icon: Package },
              { label: 'Entregadas', value: stats.delivered, color: 'emerald', icon: CheckCircle },
              { label: 'En tránsito', value: stats.inTransit, color: 'blue', icon: Truck },
              { label: 'Novedad', value: stats.issues, color: 'red', icon: AlertTriangle },
              { label: 'Oficina', value: stats.inOffice, color: 'amber', icon: Building2 },
              { label: 'Con Tel.', value: stats.withPhone, color: 'green', icon: Phone },
            ].map((stat, i) => (
              <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-${stat.color}-50 dark:bg-${stat.color}-900/20 whitespace-nowrap`}>
                <stat.icon className={`w-4 h-4 text-${stat.color}-500`} />
                <span className={`text-sm font-bold text-${stat.color}-600 dark:text-${stat.color}-400`}>{stat.value}</span>
                <span className={`text-xs text-${stat.color}-500`}>{stat.label}</span>
              </div>
            ))}
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-2">
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="p-2 hover:bg-slate-200 dark:hover:bg-navy-700 rounded-lg transition-colors"
                title="Actualizar"
              >
                <RefreshCw className="w-5 h-5 text-slate-500" />
              </button>
            )}
            {onExport && (
              <button
                onClick={onExport}
                className="flex items-center gap-2 px-3 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors text-sm font-medium"
              >
                <Download className="w-4 h-4" />
                Exportar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ===== BARRA DE BÚSQUEDA Y FILTROS ===== */}
      <div className="p-4 border-b border-slate-200 dark:border-navy-700 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Búsqueda */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => { setFilters(prev => ({ ...prev, search: e.target.value })); setCurrentPage(1); }}
              placeholder="Buscar por guía, teléfono, ciudad, nombre..."
              className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-600 rounded-xl
                text-slate-800 dark:text-white placeholder-slate-400
                focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
            />
            {filters.search && (
              <button
                onClick={() => { setFilters(prev => ({ ...prev, search: '' })); setCurrentPage(1); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Botón de filtros */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all ${
              showFilters || activeFiltersCount > 0
                ? 'bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-700 text-cyan-700 dark:text-cyan-400'
                : 'bg-slate-50 dark:bg-navy-800 border-slate-200 dark:border-navy-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-700'
            }`}
          >
            <SlidersHorizontal className="w-5 h-5" />
            <span className="font-medium">Filtros</span>
            {activeFiltersCount > 0 && (
              <span className="px-2 py-0.5 bg-cyan-500 text-white text-xs font-bold rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Panel de filtros */}
        {showFilters && (
          <div className="p-4 bg-slate-50 dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-navy-600 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-slate-800 dark:text-white">Filtros Avanzados</h4>
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-red-500 hover:text-red-600 font-medium"
                >
                  Limpiar filtros
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Filtro por estado */}
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Estado</label>
                <div className="flex flex-wrap gap-2">
                  {['delivered', 'in_transit', 'issue', 'in_office'].map((status) => {
                    const config = getStatusConfig(status);
                    return (
                      <button
                        key={status}
                        onClick={() => handleStatusFilter(status)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          filters.status.includes(status)
                            ? `${config.bg} ${config.text} ring-2 ring-${config.color}-500`
                            : 'bg-slate-100 dark:bg-navy-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-navy-600'
                        }`}
                      >
                        <config.icon className="w-3.5 h-3.5" />
                        {config.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Filtro por transportadora */}
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Transportadora</label>
                <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                  {uniqueCarriers.map((carrier) => (
                    <button
                      key={carrier}
                      onClick={() => handleCarrierFilter(carrier)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        filters.carrier.includes(carrier)
                          ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 ring-2 ring-purple-500'
                          : 'bg-slate-100 dark:bg-navy-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-navy-600'
                      }`}
                    >
                      {carrier}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filtro por ciudad */}
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Ciudad Destino</label>
                <select
                  value={filters.city}
                  onChange={(e) => { setFilters(prev => ({ ...prev, city: e.target.value })); setCurrentPage(1); }}
                  className="w-full px-3 py-2 bg-white dark:bg-navy-700 border border-slate-200 dark:border-navy-600 rounded-lg text-sm
                    focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                >
                  <option value="">Todas las ciudades</option>
                  {uniqueCities.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              {/* Filtro por teléfono */}
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Teléfono</label>
                <select
                  value={filters.hasPhone}
                  onChange={(e) => { setFilters(prev => ({ ...prev, hasPhone: e.target.value as 'all' | 'yes' | 'no' })); setCurrentPage(1); }}
                  className="w-full px-3 py-2 bg-white dark:bg-navy-700 border border-slate-200 dark:border-navy-600 rounded-lg text-sm
                    focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                >
                  <option value="all">Todos</option>
                  <option value="yes">Con teléfono</option>
                  <option value="no">Sin teléfono</option>
                </select>
              </div>
            </div>

            {/* Rango de días */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                Días en tránsito: {filters.daysRange[0]} - {filters.daysRange[1]}
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="30"
                  value={filters.daysRange[0]}
                  onChange={(e) => setFilters(prev => ({ ...prev, daysRange: [parseInt(e.target.value), prev.daysRange[1]] }))}
                  className="flex-1 accent-cyan-500"
                />
                <input
                  type="range"
                  min="0"
                  max="30"
                  value={filters.daysRange[1]}
                  onChange={(e) => setFilters(prev => ({ ...prev, daysRange: [prev.daysRange[0], parseInt(e.target.value)] }))}
                  className="flex-1 accent-cyan-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ===== TABLA ===== */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-navy-950 sticky top-0">
            <tr>
              {[
                { key: 'id', label: 'Guía', width: 'w-40' },
                { key: 'status', label: 'Estado', width: 'w-32' },
                { key: 'carrier', label: 'Transportadora', width: 'w-32' },
                { key: 'city', label: 'Destino', width: 'w-40' },
                { key: 'phone', label: 'Contacto', width: 'w-36' },
                { key: 'days', label: 'Días', width: 'w-20' },
                { key: 'history', label: 'Último Mov.', width: 'w-48' },
                { key: 'actions', label: 'Acciones', width: 'w-32' },
              ].map((col) => (
                <th
                  key={col.key}
                  className={`text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ${col.width}`}
                >
                  {col.key !== 'phone' && col.key !== 'actions' && col.key !== 'history' ? (
                    <button
                      onClick={() => handleSort(col.key)}
                      className="flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                    >
                      {col.label}
                      <ArrowUpDown className={`w-3 h-3 ${sortConfig.key === col.key ? 'text-cyan-500' : ''}`} />
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
            {paginatedShipments.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center">
                  <Package className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                  <p className="text-slate-500 dark:text-slate-400">No se encontraron guías</p>
                  <p className="text-sm text-slate-400 mt-1">Intenta con otros filtros</p>
                </td>
              </tr>
            ) : (
              paginatedShipments.map((shipment) => {
                const statusConfig = getStatusConfig(shipment.status);
                const StatusIcon = statusConfig.icon;
                const phone = shipment.recipientPhone || shipment.senderPhone || shipment.phone;
                const days = shipment.detailedInfo?.daysInTransit || 0;
                const lastMovement = shipment.detailedInfo?.history?.[0];
                const isExpanded = expandedRow === shipment.id;

                return (
                  <React.Fragment key={shipment.id}>
                    <tr className="hover:bg-slate-50 dark:hover:bg-navy-800/50 transition-colors group">
                      {/* Guía */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setExpandedRow(isExpanded ? null : shipment.id)}
                            className="p-1 hover:bg-slate-200 dark:hover:bg-navy-700 rounded transition-colors"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                          </button>
                          <div>
                            <span className="font-mono font-bold text-slate-800 dark:text-white text-sm">
                              {shipment.trackingNumber || shipment.id}
                            </span>
                            {shipment.recipientName && (
                              <p className="text-xs text-slate-500 truncate max-w-[120px]">{shipment.recipientName}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {statusConfig.label}
                        </span>
                      </td>

                      {/* Transportadora */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
                          <Truck className="w-3.5 h-3.5 text-purple-500" />
                          {shipment.carrier || '-'}
                        </div>
                      </td>

                      {/* Destino */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
                          <MapPin className="w-3.5 h-3.5 text-cyan-500" />
                          <span className="truncate max-w-[140px]">{shipment.detailedInfo?.destination || '-'}</span>
                        </div>
                      </td>

                      {/* Contacto */}
                      <td className="px-4 py-3">
                        {phone ? (
                          <div className="flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400 font-mono">
                            <Phone className="w-3.5 h-3.5" />
                            {phone}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Sin teléfono</span>
                        )}
                      </td>

                      {/* Días */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          days >= 5 ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' :
                          days >= 3 ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' :
                          'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}>
                          <Clock className="w-3 h-3" />
                          {days}d
                        </span>
                      </td>

                      {/* Último movimiento */}
                      <td className="px-4 py-3">
                        {lastMovement ? (
                          <div className="text-xs">
                            <p className="text-slate-600 dark:text-slate-300 truncate max-w-[180px]">{lastMovement.status}</p>
                            <p className="text-slate-400">{lastMovement.date}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {phone && (
                            <>
                              <button
                                onClick={() => handleWhatsApp(shipment)}
                                className="p-2 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg text-green-600 transition-colors"
                                title="WhatsApp"
                              >
                                <MessageSquare className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleCall(shipment)}
                                className="p-2 hover:bg-cyan-100 dark:hover:bg-cyan-900/30 rounded-lg text-cyan-600 transition-colors"
                                title="Llamar"
                              >
                                <Phone className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleCopy(shipment.trackingNumber || shipment.id)}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors"
                            title="Copiar guía"
                          >
                            {copiedId === (shipment.trackingNumber || shipment.id) ? (
                              <CheckCircle className="w-4 h-4 text-emerald-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Fila expandida con detalles */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={8} className="px-4 py-4 bg-slate-50 dark:bg-navy-800/50">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Info de la guía */}
                            <div className="space-y-2">
                              <h4 className="font-bold text-slate-700 dark:text-white text-sm flex items-center gap-2">
                                <Info className="w-4 h-4 text-cyan-500" />
                                Información de la Guía
                              </h4>
                              <div className="space-y-1 text-sm">
                                <p><span className="text-slate-500">ID:</span> <span className="font-mono text-slate-800 dark:text-white">{shipment.id}</span></p>
                                <p><span className="text-slate-500">Tracking:</span> <span className="font-mono text-slate-800 dark:text-white">{shipment.trackingNumber}</span></p>
                                <p><span className="text-slate-500">Transportadora:</span> {shipment.carrier}</p>
                                <p><span className="text-slate-500">Destino:</span> {shipment.detailedInfo?.destination}</p>
                                {shipment.recipientName && <p><span className="text-slate-500">Destinatario:</span> {shipment.recipientName}</p>}
                              </div>
                            </div>

                            {/* Timeline de movimientos */}
                            <div className="md:col-span-2">
                              <h4 className="font-bold text-slate-700 dark:text-white text-sm flex items-center gap-2 mb-2">
                                <History className="w-4 h-4 text-purple-500" />
                                Historial de Movimientos
                              </h4>
                              {shipment.detailedInfo?.history && shipment.detailedInfo.history.length > 0 ? (
                                <div className="space-y-2 max-h-40 overflow-y-auto">
                                  {shipment.detailedInfo.history.slice(0, 5).map((mov, i) => (
                                    <div key={i} className="flex items-start gap-3 p-2 bg-white dark:bg-navy-900 rounded-lg">
                                      <div className={`w-2 h-2 rounded-full mt-1.5 ${i === 0 ? 'bg-cyan-500' : 'bg-slate-300'}`}></div>
                                      <div>
                                        <p className="text-sm text-slate-800 dark:text-white">{mov.status}</p>
                                        <p className="text-xs text-slate-500">{mov.date} {mov.location && `• ${mov.location}`}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-slate-400">Sin historial disponible</p>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ===== PAGINACIÓN ===== */}
      <div className="p-4 border-t border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-950 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
            className="px-3 py-2 bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-600 rounded-lg text-sm
              focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          >
            {[10, 25, 50, 100].map(size => (
              <option key={size} value={size}>{size} por página</option>
            ))}
          </select>
          <span className="text-sm text-slate-500">
            {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, sortedShipments.length)} de {sortedShipments.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 hover:bg-slate-200 dark:hover:bg-navy-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === pageNum
                      ? 'bg-cyan-500 text-white'
                      : 'hover:bg-slate-200 dark:hover:bg-navy-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2 hover:bg-slate-200 dark:hover:bg-navy-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedGuideTable;
