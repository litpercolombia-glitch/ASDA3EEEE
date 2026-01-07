// components/ProAssistant/ProBubbleV4.tsx
// Burbuja PRO V4 - Sistema unificado con Chat IA con Modos
import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  X,
  AlertTriangle,
  Package,
  Truck,
  Building2,
  CheckCircle,
  ChevronDown,
  MessageSquare,
  BarChart3,
  Zap,
  FileText,
  Brain,
  Search,
  List,
  PhoneCall,
  MessageCircle,
  ChevronRight,
  Minimize2,
  Maximize2,
  ChevronLeft,
  Phone,
  Copy,
  MapPin,
  RefreshCw,
} from 'lucide-react';
import { useProAssistantStore } from '../../stores/proAssistantStore';
import UnifiedChatIA, { ChatMode } from '../chat/UnifiedChatIA';
import { Shipment } from '../../types';

// ============================================
// TIPOS
// ============================================

type ViewMode = 'bubble' | 'actions' | 'list' | 'chat';
type ListFilter = 'all' | 'delivered' | 'in_transit' | 'issue' | 'in_office' | 'critical';

interface ProBubbleV4Props {
  shipments: Shipment[];
  onNavigateToTab?: (tab: string) => void;
  onRefreshData?: () => void;
  onExportData?: () => void;
  forceOpen?: boolean;
  onForceOpenHandled?: () => void;
}

// ============================================
// CONFIGURACIÓN DE ACCIONES OPERATIVAS
// ============================================

const OPERATIONAL_ACTIONS = [
  { id: 'search', icon: Search, label: 'Buscar Guía', color: 'blue', description: 'Consultar estado' },
  { id: 'novelty', icon: AlertTriangle, label: 'Novedades', color: 'orange', description: 'Gestionar casos' },
  { id: 'whatsapp', icon: MessageCircle, label: 'WhatsApp', color: 'emerald', description: 'Mensaje rápido' },
  { id: 'calls', icon: PhoneCall, label: 'Llamadas', color: 'cyan', description: 'Cola prioritaria' },
];

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

const ProBubbleV4: React.FC<ProBubbleV4Props> = ({
  shipments = [],
  onNavigateToTab,
  onRefreshData,
  onExportData,
  forceOpen = false,
  onForceOpenHandled,
}) => {
  const { notifications } = useProAssistantStore();

  // Estados
  const [mode, setMode] = useState<ViewMode>('bubble');
  const [listFilter, setListFilter] = useState<ListFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [chatInitialMode, setChatInitialMode] = useState<ChatMode>('chat');

  // Efecto para abrir el chat cuando se solicita desde fuera
  useEffect(() => {
    if (forceOpen && mode === 'bubble') {
      setMode('chat');
      onForceOpenHandled?.();
    }
  }, [forceOpen, mode, onForceOpenHandled]);

  // ============================================
  // MÉTRICAS CALCULADAS
  // ============================================

  const metrics = useMemo(() => {
    const total = shipments.length;
    const delivered = shipments.filter(s => s.status === 'delivered').length;
    const inTransit = shipments.filter(s => s.status === 'in_transit').length;
    const issues = shipments.filter(s => s.status === 'issue').length;
    const inOffice = shipments.filter(s => s.status === 'in_office').length;
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

    return filtered.slice(0, 50);
  }, [shipments, listFilter, searchQuery]);

  // ============================================
  // ACCIONES
  // ============================================

  const handleWhatsApp = (shipment: Shipment) => {
    const phone = shipment.recipientPhone || shipment.senderPhone || shipment.phone;
    if (phone) {
      const cleanPhone = phone.replace(/\D/g, '');
      const message = encodeURIComponent(
        `Hola! Le contactamos sobre su envío ${shipment.trackingNumber || shipment.id}.`
      );
      window.open(`https://wa.me/57${cleanPhone}?text=${message}`, '_blank');
    }
  };

  const handleCall = (shipment: Shipment) => {
    const phone = shipment.recipientPhone || shipment.senderPhone || shipment.phone;
    if (phone) window.open(`tel:${phone}`, '_self');
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'delivered':
        return { icon: CheckCircle, bgClass: 'bg-emerald-500/20', textClass: 'text-emerald-400', label: 'Entregado' };
      case 'in_transit':
        return { icon: Truck, bgClass: 'bg-blue-500/20', textClass: 'text-blue-400', label: 'En tránsito' };
      case 'issue':
        return { icon: AlertTriangle, bgClass: 'bg-red-500/20', textClass: 'text-red-400', label: 'Novedad' };
      case 'in_office':
        return { icon: Building2, bgClass: 'bg-amber-500/20', textClass: 'text-amber-400', label: 'En oficina' };
      default:
        return { icon: Package, bgClass: 'bg-slate-500/20', textClass: 'text-slate-400', label: status };
    }
  };

  const filterOptions = [
    { id: 'all' as ListFilter, label: 'Todas', icon: Package, activeClass: 'bg-slate-500 text-white', badgeClass: 'bg-slate-500/20 text-slate-400', count: metrics.total },
    { id: 'critical' as ListFilter, label: 'Críticas', icon: AlertTriangle, activeClass: 'bg-red-500 text-white', badgeClass: 'bg-red-500/20 text-red-400', count: metrics.critical },
    { id: 'issue' as ListFilter, label: 'Novedad', icon: AlertTriangle, activeClass: 'bg-orange-500 text-white', badgeClass: 'bg-orange-500/20 text-orange-400', count: metrics.issues },
    { id: 'in_office' as ListFilter, label: 'Oficina', icon: Building2, activeClass: 'bg-amber-500 text-white', badgeClass: 'bg-amber-500/20 text-amber-400', count: metrics.inOffice },
    { id: 'in_transit' as ListFilter, label: 'Tránsito', icon: Truck, activeClass: 'bg-blue-500 text-white', badgeClass: 'bg-blue-500/20 text-blue-400', count: metrics.inTransit },
    { id: 'delivered' as ListFilter, label: 'Entregadas', icon: CheckCircle, activeClass: 'bg-emerald-500 text-white', badgeClass: 'bg-emerald-500/20 text-emerald-400', count: metrics.delivered },
  ];

  const openChatWithMode = (chatMode: ChatMode) => {
    setChatInitialMode(chatMode);
    setMode('chat');
  };

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
          </div>
        )}

        {/* Botón principal mejorado */}
        <button
          onClick={() => setMode('actions')}
          className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-600
            shadow-2xl shadow-purple-500/40 cursor-pointer transition-all duration-300
            hover:scale-110 hover:shadow-purple-500/60 active:scale-95
            flex flex-col items-center justify-center border-2 border-white/20 overflow-hidden group"
        >
          {/* Efecto shine */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent
            opacity-0 group-hover:opacity-100 -translate-x-full group-hover:translate-x-full
            transition-transform duration-700" style={{ transform: 'skewX(-20deg)' }} />

          <Brain className="w-7 h-7 text-white drop-shadow-lg" />
          <span className="text-white font-black text-[8px] tracking-widest drop-shadow-lg mt-0.5">LITPER IA</span>

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
        <div className="bg-slate-900 rounded-2xl border border-slate-700/50 shadow-2xl w-[380px] overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-purple-500/20 via-indigo-500/20 to-blue-500/20 border-b border-slate-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">LITPER IA</h3>
                  <p className="text-xs text-slate-400">{metrics.total} guías | {metrics.deliveryRate}% entrega</p>
                </div>
              </div>
              <button onClick={() => setMode('bubble')} className="p-2 hover:bg-slate-800 rounded-lg">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Chat Operativo - Acceso Rápido */}
          <div className="p-3 border-b border-slate-700/50">
            <button
              onClick={() => openChatWithMode('chat')}
              className="w-full p-3 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 hover:from-purple-500/30 hover:to-indigo-500/30 rounded-xl transition-all flex items-center gap-3 group border border-purple-500/20"
            >
              <div className="p-2.5 bg-purple-500 rounded-xl">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-bold text-white">Chat Operativo</p>
                <p className="text-xs text-slate-400">Resolver casos 1 a 1, mensajes WhatsApp</p>
              </div>
              <ChevronRight className="w-5 h-5 text-purple-400 group-hover:translate-x-1 transition-all" />
            </button>
          </div>

          {/* Acciones Operativas Rápidas */}
          <div className="p-3 border-b border-slate-700/50">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 px-1">Acciones Rápidas</p>
            <div className="grid grid-cols-4 gap-2">
              {OPERATIONAL_ACTIONS.map((action) => {
                const colorStyles = {
                  blue: 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20 text-blue-400',
                  orange: 'bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/20 text-orange-400',
                  emerald: 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20 text-emerald-400',
                  cyan: 'bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/20 text-cyan-400',
                };
                const styles = colorStyles[action.color as keyof typeof colorStyles] || colorStyles.blue;

                return (
                  <button
                    key={action.id}
                    onClick={() => {
                      if (action.id === 'search') setMode('list');
                      else if (action.id === 'novelty') { setMode('list'); setListFilter('issue'); }
                      else if (action.id === 'whatsapp') { setMode('list'); setListFilter('issue'); }
                      else if (action.id === 'calls') { setMode('list'); setListFilter('critical'); }
                    }}
                    className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl transition-all hover:scale-105 border ${styles}`}
                  >
                    <action.icon className="w-5 h-5" />
                    <span className="text-[9px] font-medium text-center">{action.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Métricas rápidas */}
          <div className="p-3 border-b border-slate-700/50 grid grid-cols-4 gap-2">
            {[
              { label: 'Entrega', value: `${metrics.deliveryRate}%`, bgClass: metrics.deliveryRate >= 80 ? 'bg-emerald-500/10' : 'bg-amber-500/10', textClass: metrics.deliveryRate >= 80 ? 'text-emerald-400' : 'text-amber-400' },
              { label: 'Críticas', value: metrics.critical, bgClass: metrics.critical > 0 ? 'bg-red-500/10' : 'bg-emerald-500/10', textClass: metrics.critical > 0 ? 'text-red-400' : 'text-emerald-400' },
              { label: 'Novedad', value: metrics.issues, bgClass: 'bg-orange-500/10', textClass: 'text-orange-400' },
              { label: 'Oficina', value: metrics.inOffice, bgClass: 'bg-amber-500/10', textClass: 'text-amber-400' },
            ].map((stat, i) => (
              <div key={i} className={`text-center p-2 rounded-lg ${stat.bgClass}`}>
                <p className={`text-lg font-bold ${stat.textClass}`}>{stat.value}</p>
                <p className="text-[10px] text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Acciones rápidas */}
          <div className="p-3 space-y-2">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Acciones Rápidas</p>

            <button
              onClick={() => setMode('list')}
              className="w-full p-3 bg-slate-800/50 hover:bg-slate-800 rounded-xl transition-all flex items-center gap-3 group"
            >
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <List className="w-5 h-5 text-purple-400" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-white text-sm">Ver Guías por Estado</p>
                <p className="text-xs text-slate-500">Filtrar y gestionar guías</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </button>

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
                <p className="text-xs text-slate-500">Guías que requieren acción</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </button>

            <button
              onClick={() => { setMode('list'); setListFilter('issue'); }}
              className="w-full p-3 bg-slate-800/50 hover:bg-slate-800 rounded-xl transition-all flex items-center gap-3 group"
            >
              <div className="p-2 bg-green-500/20 rounded-lg">
                <MessageCircle className="w-5 h-5 text-green-400" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-white text-sm">Gestionar Novedades</p>
                <p className="text-xs text-slate-500">WhatsApp y llamadas</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </button>

            {/* Separador */}
            <div className="border-t border-slate-700/50 my-2" />

            {/* Botón Centro de Inteligencia IA - Chat Estratégico */}
            {onNavigateToTab && (
              <button
                onClick={() => onNavigateToTab('inteligencia-ia')}
                className="w-full p-4 bg-gradient-to-r from-indigo-600/30 via-purple-600/30 to-pink-600/30 hover:from-indigo-600/40 hover:via-purple-600/40 hover:to-pink-600/40 rounded-xl transition-all flex items-center gap-3 group border border-indigo-500/40"
              >
                <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-bold text-white">Centro de Inteligencia IA</p>
                  <p className="text-xs text-indigo-300">Análisis • Predicciones • Decisiones estratégicas</p>
                </div>
                <div className="flex flex-col items-center gap-0.5">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <ChevronRight className="w-5 h-5 text-purple-400 group-hover:translate-x-1 transition-all" />
                </div>
              </button>
            )}
          </div>
        </div>

        <button
          onClick={() => setMode('bubble')}
          className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 shadow-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      </div>
    );
  }

  // ============================================
  // RENDER - LISTA DE GUÍAS
  // ============================================

  if (mode === 'list') {
    return (
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-3">
        <div className={`bg-slate-900 rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden animate-slide-up transition-all ${isExpanded ? 'w-[500px]' : 'w-[400px]'}`}>
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border-b border-slate-700/50">
            <div className="flex items-center justify-between mb-3">
              <button onClick={() => setMode('actions')} className="flex items-center gap-2 text-slate-400 hover:text-white">
                <ChevronLeft className="w-5 h-5" />
                <span className="text-sm">Volver</span>
              </button>
              <div className="flex items-center gap-2">
                <button onClick={() => setIsExpanded(!isExpanded)} className="p-2 hover:bg-slate-800 rounded-lg">
                  {isExpanded ? <Minimize2 className="w-4 h-4 text-slate-400" /> : <Maximize2 className="w-4 h-4 text-slate-400" />}
                </button>
                <button onClick={() => setMode('bubble')} className="p-2 hover:bg-slate-800 rounded-lg">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar guía, teléfono, ciudad..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />
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
                      ? filter.activeClass
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  <filter.icon className="w-3.5 h-3.5" />
                  {filter.label}
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${listFilter === filter.id ? 'bg-white/20' : filter.badgeClass}`}>
                    {filter.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Lista */}
          <div className="max-h-[400px] overflow-y-auto">
            {filteredShipments.length === 0 ? (
              <div className="p-8 text-center">
                <Package className="w-12 h-12 mx-auto text-slate-600 mb-3" />
                <p className="text-slate-400 text-sm">No se encontraron guías</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {filteredShipments.map((shipment) => {
                  const statusConfig = getStatusConfig(shipment.status);
                  const StatusIcon = statusConfig.icon;
                  const phone = shipment.recipientPhone || shipment.senderPhone || shipment.phone;

                  return (
                    <div key={shipment.id} className="p-3 hover:bg-slate-800/50 transition-colors group">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg flex-shrink-0 ${statusConfig.bgClass}`}>
                          <StatusIcon className={`w-4 h-4 ${statusConfig.textClass}`} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-white text-sm">
                              {shipment.trackingNumber || shipment.id}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${statusConfig.bgClass} ${statusConfig.textClass}`}>
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

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {phone && (
                            <>
                              <button onClick={() => handleWhatsApp(shipment)} className="p-2 hover:bg-green-500/20 rounded-lg text-green-400">
                                <MessageCircle className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleCall(shipment)} className="p-2 hover:bg-cyan-500/20 rounded-lg text-cyan-400">
                                <Phone className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button onClick={() => handleCopy(shipment.trackingNumber || shipment.id)} className="p-2 hover:bg-slate-700 rounded-lg text-slate-400">
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
                <button onClick={onRefreshData} className="flex items-center gap-1 text-slate-400 hover:text-white">
                  <RefreshCw className="w-3.5 h-3.5" />
                  Actualizar
                </button>
              )}
            </div>
          </div>
        </div>

        <button onClick={() => setMode('bubble')} className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 shadow-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-all">
          <ChevronDown className="w-5 h-5" />
        </button>
      </div>
    );
  }

  // ============================================
  // RENDER - CHAT IA
  // ============================================

  if (mode === 'chat') {
    return (
      <UnifiedChatIA
        shipments={shipments}
        isOpen={true}
        onClose={() => setMode('bubble')}
        onNavigateToTab={onNavigateToTab}
        initialMode={chatInitialMode}
      />
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
  .animate-slide-up { animation: slide-up 0.3s ease-out; }
  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  .animate-fade-in { animation: fade-in 0.2s ease-out; }
`;

if (typeof document !== 'undefined') {
  const existingStyle = document.getElementById('pro-bubble-v4-styles');
  if (!existingStyle) {
    const styleEl = document.createElement('style');
    styleEl.id = 'pro-bubble-v4-styles';
    styleEl.textContent = styles;
    document.head.appendChild(styleEl);
  }
}

export default ProBubbleV4;
