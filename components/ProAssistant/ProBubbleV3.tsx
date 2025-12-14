// components/ProAssistant/ProBubbleV3.tsx
// Burbuja PRO V3 - Sistema mejorado con listado de guías y acciones avanzadas
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Sparkles,
  X,
  Search,
  AlertTriangle,
  Package,
  Truck,
  Phone,
  MessageSquare,
  MapPin,
  Clock,
  TrendingUp,
  Shield,
  Zap,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Filter,
  Download,
  RefreshCw,
  Building2,
  CheckCircle,
  XCircle,
  Copy,
  ExternalLink,
  BarChart3,
  Target,
  Bell,
  Settings,
  Minimize2,
  Maximize2,
  GitCompare,
  Calendar,
  Users,
  FileText,
  Send,
  List,
  Grid3X3,
  PhoneCall,
  MessageCircle,
  ArrowRight,
  Eye,
  MoreHorizontal,
  Loader2,
} from 'lucide-react';
import { useProAssistantStore } from '../../stores/proAssistantStore';
import ProPanel from './ProPanel';
import { Shipment } from '../../types';

// ============================================
// TIPOS
// ============================================

type ViewMode = 'bubble' | 'actions' | 'list' | 'search' | 'panel';
type ListFilter = 'all' | 'delivered' | 'in_transit' | 'issue' | 'in_office' | 'critical';

interface ProBubbleV3Props {
  shipments: Shipment[];
  onNavigateToTab?: (tab: string) => void;
  onRefreshData?: () => void;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

const ProBubbleV3: React.FC<ProBubbleV3Props> = ({
  shipments = [],
  onNavigateToTab,
  onRefreshData,
}) => {
  const {
    isOpen,
    setIsOpen,
    notifications,
    clearNotifications,
    isProcessing,
  } = useProAssistantStore();

  // Estados
  const [mode, setMode] = useState<ViewMode>('bubble');
  const [listFilter, setListFilter] = useState<ListFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGuide, setSelectedGuide] = useState<Shipment | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // ============================================
  // MÉTRICAS CALCULADAS
  // ============================================

  const metrics = useMemo(() => {
    const total = shipments.length;
    const delivered = shipments.filter(s => s.status === 'delivered').length;
    const inTransit = shipments.filter(s => s.status === 'in_transit').length;
    const issues = shipments.filter(s => s.status === 'issue').length;
    const inOffice = shipments.filter(s => s.status === 'in_office').length;

    // Críticas: más de 5 días sin entregar o con novedad
    const critical = shipments.filter(s => {
      if (s.status === 'delivered') return false;
      const days = s.detailedInfo?.daysInTransit || 0;
      return days >= 5 || s.status === 'issue';
    }).length;

    const deliveryRate = total > 0 ? Math.round((delivered / total) * 100) : 0;

    return { total, delivered, inTransit, issues, inOffice, critical, deliveryRate };
  }, [shipments]);

  // ============================================
  // GUÍAS FILTRADAS
  // ============================================

  const filteredShipments = useMemo(() => {
    let filtered = [...shipments];

    // Filtrar por estado
    switch (listFilter) {
      case 'delivered':
        filtered = filtered.filter(s => s.status === 'delivered');
        break;
      case 'in_transit':
        filtered = filtered.filter(s => s.status === 'in_transit');
        break;
      case 'issue':
        filtered = filtered.filter(s => s.status === 'issue');
        break;
      case 'in_office':
        filtered = filtered.filter(s => s.status === 'in_office');
        break;
      case 'critical':
        filtered = filtered.filter(s => {
          if (s.status === 'delivered') return false;
          const days = s.detailedInfo?.daysInTransit || 0;
          return days >= 5 || s.status === 'issue';
        });
        break;
    }

    // Filtrar por búsqueda
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s =>
        s.id?.toLowerCase().includes(query) ||
        s.trackingNumber?.toLowerCase().includes(query) ||
        s.phone?.includes(query) ||
        s.recipientPhone?.includes(query) ||
        s.detailedInfo?.destination?.toLowerCase().includes(query) ||
        s.carrier?.toLowerCase().includes(query)
      );
    }

    return filtered.slice(0, 50); // Limitar a 50 para rendimiento
  }, [shipments, listFilter, searchQuery]);

  // ============================================
  // ACCIONES
  // ============================================

  const handleWhatsApp = (shipment: Shipment) => {
    const phone = shipment.recipientPhone || shipment.senderPhone || shipment.phone;
    if (phone) {
      const cleanPhone = phone.replace(/\D/g, '');
      const message = encodeURIComponent(
        `Hola! Le contactamos sobre su envío ${shipment.trackingNumber || shipment.id}. ¿En qué podemos ayudarle?`
      );
      window.open(`https://wa.me/57${cleanPhone}?text=${message}`, '_blank');
    }
  };

  const handleCall = (shipment: Shipment) => {
    const phone = shipment.recipientPhone || shipment.senderPhone || shipment.phone;
    if (phone) {
      window.open(`tel:${phone}`, '_self');
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'delivered':
        return { icon: CheckCircle, color: 'emerald', label: 'Entregado', bg: 'bg-emerald-500' };
      case 'in_transit':
        return { icon: Truck, color: 'blue', label: 'En tránsito', bg: 'bg-blue-500' };
      case 'issue':
        return { icon: AlertTriangle, color: 'red', label: 'Novedad', bg: 'bg-red-500' };
      case 'in_office':
        return { icon: Building2, color: 'amber', label: 'En oficina', bg: 'bg-amber-500' };
      default:
        return { icon: Package, color: 'slate', label: status, bg: 'bg-slate-500' };
    }
  };

  // ============================================
  // FILTERS CONFIG
  // ============================================

  const filterOptions: { id: ListFilter; label: string; icon: React.ElementType; color: string; count: number }[] = [
    { id: 'all', label: 'Todas', icon: Package, color: 'slate', count: metrics.total },
    { id: 'critical', label: 'Críticas', icon: AlertTriangle, color: 'red', count: metrics.critical },
    { id: 'issue', label: 'Novedad', icon: XCircle, color: 'orange', count: metrics.issues },
    { id: 'in_office', label: 'Oficina', icon: Building2, color: 'amber', count: metrics.inOffice },
    { id: 'in_transit', label: 'Tránsito', icon: Truck, color: 'blue', count: metrics.inTransit },
    { id: 'delivered', label: 'Entregadas', icon: CheckCircle, color: 'emerald', count: metrics.delivered },
  ];

  // ============================================
  // RENDER - MODO BURBUJA
  // ============================================

  if (mode === 'bubble') {
    return (
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-3">
        {/* Indicadores flotantes */}
        {metrics.critical > 0 && (
          <div className="flex flex-col gap-1 items-end animate-fade-in">
            <button
              onClick={() => { setMode('list'); setListFilter('critical'); }}
              className="px-3 py-1.5 bg-red-500 rounded-lg text-white text-xs font-bold shadow-lg hover:bg-red-600 transition-all flex items-center gap-1.5 animate-pulse"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              {metrics.critical} críticas
            </button>
            {metrics.inOffice > 0 && (
              <button
                onClick={() => { setMode('list'); setListFilter('in_office'); }}
                className="px-3 py-1.5 bg-amber-500 rounded-lg text-white text-xs font-bold shadow-lg hover:bg-amber-600 transition-all flex items-center gap-1.5"
              >
                <Building2 className="w-3.5 h-3.5" />
                {metrics.inOffice} en oficina
              </button>
            )}
          </div>
        )}

        {/* Botón principal */}
        <button
          onClick={() => setMode('actions')}
          className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-red-500
            shadow-2xl shadow-orange-500/40 cursor-pointer transition-all duration-300
            hover:scale-110 hover:shadow-orange-500/60 active:scale-95
            flex flex-col items-center justify-center border-2 border-amber-300/50 overflow-hidden group"
        >
          {/* Efecto shine */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent
            opacity-0 group-hover:opacity-100 -translate-x-full group-hover:translate-x-full
            transition-transform duration-700" style={{ transform: 'skewX(-20deg)' }} />

          <span className="text-white font-black text-[10px] tracking-widest drop-shadow-lg">PRO</span>
          <Sparkles className="w-6 h-6 text-white drop-shadow-lg" />

          {/* Badge de notificaciones */}
          {notifications > 0 && (
            <div className="absolute -top-1 -right-1 min-w-[22px] h-[22px] px-1
              bg-red-500 rounded-full text-white text-xs font-bold
              flex items-center justify-center animate-bounce shadow-lg border-2 border-white">
              {notifications > 99 ? '99+' : notifications}
            </div>
          )}
        </button>
      </div>
    );
  }

  // ============================================
  // RENDER - PANEL DE ACCIONES
  // ============================================

  if (mode === 'actions') {
    return (
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-3">
        {/* Panel de acciones */}
        <div className="bg-slate-900 rounded-2xl border border-slate-700/50 shadow-2xl w-[350px] overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-b border-slate-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Asistente PRO</h3>
                  <p className="text-xs text-slate-400">{metrics.total} guías cargadas</p>
                </div>
              </div>
              <button
                onClick={() => setMode('bubble')}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Métricas rápidas */}
          <div className="p-3 border-b border-slate-700/50 grid grid-cols-4 gap-2">
            {[
              { label: 'Entrega', value: `${metrics.deliveryRate}%`, color: metrics.deliveryRate >= 80 ? 'emerald' : 'amber' },
              { label: 'Críticas', value: metrics.critical, color: metrics.critical > 0 ? 'red' : 'emerald' },
              { label: 'Novedad', value: metrics.issues, color: 'orange' },
              { label: 'Oficina', value: metrics.inOffice, color: 'amber' },
            ].map((stat, i) => (
              <div key={i} className={`text-center p-2 rounded-lg bg-${stat.color}-500/10`}>
                <p className={`text-lg font-bold text-${stat.color}-400`}>{stat.value}</p>
                <p className="text-[10px] text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Acciones principales */}
          <div className="p-3 space-y-2">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Acciones Rápidas</p>

            {/* Listar guías por estado */}
            <button
              onClick={() => setMode('list')}
              className="w-full p-3 bg-slate-800/50 hover:bg-slate-800 rounded-xl transition-all flex items-center gap-3 group"
            >
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <List className="w-5 h-5 text-purple-400" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-white text-sm">Listar Guías por Estado</p>
                <p className="text-xs text-slate-500">Ver y filtrar todas las guías</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </button>

            {/* Cola de llamadas */}
            <button
              onClick={() => { setMode('list'); setListFilter('critical'); }}
              className="w-full p-3 bg-slate-800/50 hover:bg-slate-800 rounded-xl transition-all flex items-center gap-3 group"
            >
              <div className="p-2 bg-red-500/20 rounded-lg relative">
                <PhoneCall className="w-5 h-5 text-red-400" />
                {metrics.critical > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white font-bold flex items-center justify-center">
                    {metrics.critical}
                  </span>
                )}
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-white text-sm">Cola de Llamadas Urgentes</p>
                <p className="text-xs text-slate-500">Guías críticas por gestionar</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </button>

            {/* WhatsApp masivo */}
            <button
              onClick={() => { setMode('list'); setListFilter('issue'); }}
              className="w-full p-3 bg-slate-800/50 hover:bg-slate-800 rounded-xl transition-all flex items-center gap-3 group"
            >
              <div className="p-2 bg-green-500/20 rounded-lg">
                <MessageCircle className="w-5 h-5 text-green-400" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-white text-sm">Gestionar Novedades</p>
                <p className="text-xs text-slate-500">Contactar guías con problemas</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </button>

            {/* Buscar guía */}
            <button
              onClick={() => setMode('search')}
              className="w-full p-3 bg-slate-800/50 hover:bg-slate-800 rounded-xl transition-all flex items-center gap-3 group"
            >
              <div className="p-2 bg-cyan-500/20 rounded-lg">
                <Search className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-white text-sm">Buscar Guía</p>
                <p className="text-xs text-slate-500">Buscar por número o teléfono</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </button>

            {/* Abrir panel completo */}
            <button
              onClick={() => { setMode('panel'); setIsOpen(true); }}
              className="w-full p-3 bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 rounded-xl transition-all flex items-center gap-3 group border border-amber-500/30"
            >
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <Maximize2 className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-white text-sm">Panel Completo</p>
                <p className="text-xs text-slate-500">Todas las funciones PRO</p>
              </div>
              <ChevronRight className="w-5 h-5 text-amber-400 group-hover:translate-x-1 transition-all" />
            </button>
          </div>
        </div>

        {/* Botón minimizado */}
        <button
          onClick={() => setMode('bubble')}
          className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 shadow-lg
            flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      </div>
    );
  }

  // ============================================
  // RENDER - LISTA DE GUÍAS
  // ============================================

  if (mode === 'list' || mode === 'search') {
    return (
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-3">
        <div className={`bg-slate-900 rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden animate-slide-up transition-all ${isExpanded ? 'w-[500px]' : 'w-[400px]'}`}>
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border-b border-slate-700/50">
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => setMode('actions')}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                <span className="text-sm">Volver</span>
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                  title={isExpanded ? 'Reducir' : 'Expandir'}
                >
                  {isExpanded ? <Minimize2 className="w-4 h-4 text-slate-400" /> : <Maximize2 className="w-4 h-4 text-slate-400" />}
                </button>
                <button
                  onClick={() => setMode('bubble')}
                  className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar guía, teléfono, ciudad..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl
                  text-white text-sm placeholder-slate-500
                  focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Filtros */}
          <div className="p-2 border-b border-slate-700/50 overflow-x-auto">
            <div className="flex gap-1.5">
              {filterOptions.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setListFilter(filter.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    listFilter === filter.id
                      ? `bg-${filter.color}-500 text-white`
                      : `bg-slate-800 text-slate-400 hover:bg-slate-700`
                  }`}
                >
                  <filter.icon className="w-3.5 h-3.5" />
                  {filter.label}
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                    listFilter === filter.id ? 'bg-white/20' : `bg-${filter.color}-500/20 text-${filter.color}-400`
                  }`}>
                    {filter.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Lista de guías */}
          <div className="max-h-[400px] overflow-y-auto">
            {filteredShipments.length === 0 ? (
              <div className="p-8 text-center">
                <Package className="w-12 h-12 mx-auto text-slate-600 mb-3" />
                <p className="text-slate-400 text-sm">No se encontraron guías</p>
                <p className="text-slate-500 text-xs mt-1">Intenta con otro filtro o búsqueda</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {filteredShipments.map((shipment) => {
                  const statusConfig = getStatusConfig(shipment.status);
                  const StatusIcon = statusConfig.icon;
                  const phone = shipment.recipientPhone || shipment.senderPhone || shipment.phone;

                  return (
                    <div
                      key={shipment.id}
                      className="p-3 hover:bg-slate-800/50 transition-colors group"
                    >
                      <div className="flex items-start gap-3">
                        {/* Icono de estado */}
                        <div className={`p-2 rounded-lg bg-${statusConfig.color}-500/20 flex-shrink-0`}>
                          <StatusIcon className={`w-4 h-4 text-${statusConfig.color}-400`} />
                        </div>

                        {/* Info de la guía */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-white text-sm">
                              {shipment.trackingNumber || shipment.id}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium bg-${statusConfig.color}-500/20 text-${statusConfig.color}-400`}>
                              {statusConfig.label}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                            {shipment.carrier && (
                              <span className="flex items-center gap-1">
                                <Truck className="w-3 h-3" />
                                {shipment.carrier}
                              </span>
                            )}
                            {shipment.detailedInfo?.destination && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {shipment.detailedInfo.destination}
                              </span>
                            )}
                          </div>

                          {phone && (
                            <div className="flex items-center gap-1 mt-1.5 text-xs text-emerald-400">
                              <Phone className="w-3 h-3" />
                              {phone}
                            </div>
                          )}
                        </div>

                        {/* Acciones */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {phone && (
                            <>
                              <button
                                onClick={() => handleWhatsApp(shipment)}
                                className="p-2 hover:bg-green-500/20 rounded-lg text-green-400 transition-colors"
                                title="WhatsApp"
                              >
                                <MessageSquare className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleCall(shipment)}
                                className="p-2 hover:bg-cyan-500/20 rounded-lg text-cyan-400 transition-colors"
                                title="Llamar"
                              >
                                <Phone className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleCopy(shipment.trackingNumber || shipment.id)}
                            className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 transition-colors"
                            title="Copiar"
                          >
                            {copiedId === (shipment.trackingNumber || shipment.id) ? (
                              <CheckCircle className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-slate-700/50 bg-slate-800/30">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Mostrando {filteredShipments.length} de {metrics.total} guías</span>
              {onRefreshData && (
                <button
                  onClick={onRefreshData}
                  className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Actualizar
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Botón minimizado */}
        <button
          onClick={() => setMode('bubble')}
          className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 shadow-lg
            flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      </div>
    );
  }

  // ============================================
  // RENDER - PANEL COMPLETO
  // ============================================

  if (mode === 'panel' && isOpen) {
    return (
      <>
        <ProPanel />
        <button
          onClick={() => { setMode('bubble'); setIsOpen(false); }}
          className="fixed bottom-6 right-6 z-[9996] w-12 h-12 rounded-xl bg-slate-800 border border-slate-700
            flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-all shadow-lg"
        >
          <Minimize2 className="w-5 h-5" />
        </button>
      </>
    );
  }

  return null;
};

// Estilos
const styles = `
  @keyframes slide-up {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-slide-up {
    animation: slide-up 0.3s ease-out;
  }
  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  .animate-fade-in {
    animation: fade-in 0.2s ease-out;
  }
`;

// Inyectar estilos
if (typeof document !== 'undefined') {
  const styleEl = document.createElement('style');
  styleEl.textContent = styles;
  document.head.appendChild(styleEl);
}

export default ProBubbleV3;
