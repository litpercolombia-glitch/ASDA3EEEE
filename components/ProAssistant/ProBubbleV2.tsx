// components/ProAssistant/ProBubbleV2.tsx
// Burbuja PRO V2 - Sistema completo de asistente logístico nivel Amazon
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
  TrendingDown,
  Shield,
  Zap,
  ChevronUp,
  ChevronDown,
  ChevronRight,
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
} from 'lucide-react';
import { useProAssistantStore } from '../../stores/proAssistantStore';
import ProPanel from './ProPanel';

// ============================================
// TIPOS E INTERFACES
// ============================================

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  badge?: number;
  action: () => void;
  description?: string;
}

interface SearchResult {
  id: string;
  type: 'guia' | 'cliente' | 'novedad' | 'accion';
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  data: any;
  actions?: { label: string; icon: React.ReactNode; onClick: () => void }[];
}

interface MiniMetric {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'stable';
  color: string;
  icon: React.ReactNode;
}

interface ProBubbleV2Props {
  // Contexto de toda la app
  guiasLogisticas?: any[];
  sesionesGuardadas?: any[];
  onNavigateToTab?: (tab: string) => void;
  onFilterGuias?: (filter: any) => void;
  onOpenRescue?: () => void;
  onOpenComparison?: () => void;
  onExportData?: () => void;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

const ProBubbleV2: React.FC<ProBubbleV2Props> = ({
  guiasLogisticas = [],
  sesionesGuardadas = [],
  onNavigateToTab,
  onFilterGuias,
  onOpenRescue,
  onOpenComparison,
  onExportData,
}) => {
  const {
    isOpen,
    setIsOpen,
    notifications,
    clearNotifications,
    isProcessing,
    setShipmentsContext,
    metrics,
  } = useProAssistantStore();

  // Estados locales
  const [mode, setMode] = useState<'bubble' | 'bar' | 'search' | 'panel'>('bubble');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeQuickFilter, setActiveQuickFilter] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sincronizar contexto
  useEffect(() => {
    if (guiasLogisticas.length > 0) {
      setShipmentsContext(guiasLogisticas);
    }
  }, [guiasLogisticas, setShipmentsContext]);

  // ============================================
  // MÉTRICAS CALCULADAS
  // ============================================

  const calculatedMetrics = useMemo(() => {
    if (guiasLogisticas.length === 0) return null;

    const total = guiasLogisticas.length;
    const entregadas = guiasLogisticas.filter(g =>
      g.estadoActual?.toLowerCase().includes('entregado') ||
      g.estadoActual?.toLowerCase().includes('exitoso')
    ).length;
    const conNovedad = guiasLogisticas.filter(g => g.tieneNovedad).length;
    const enOficina = guiasLogisticas.filter(g =>
      g.estadoActual?.toLowerCase().includes('oficina') ||
      g.estadoActual?.toLowerCase().includes('reclam')
    ).length;
    const criticas = guiasLogisticas.filter(g => g.diasTranscurridos >= 5 && !g.estadoActual?.toLowerCase().includes('entregado')).length;

    const tasaEntrega = total > 0 ? (entregadas / total) * 100 : 0;
    const tasaDevolucion = total > 0 ? ((total - entregadas) / total) * 100 : 0;

    return {
      total,
      entregadas,
      conNovedad,
      enOficina,
      criticas,
      tasaEntrega,
      tasaDevolucion,
    };
  }, [guiasLogisticas]);

  // ============================================
  // ACCIONES RÁPIDAS
  // ============================================

  const quickActions: QuickAction[] = useMemo(() => [
    {
      id: 'criticas',
      label: 'Críticas',
      icon: <AlertTriangle className="w-4 h-4" />,
      color: 'red',
      badge: calculatedMetrics?.criticas || 0,
      description: 'Guías +5 días sin entregar',
      action: () => {
        setActiveQuickFilter('criticas');
        onFilterGuias?.({ diasMin: 5, excluirEntregadas: true });
      },
    },
    {
      id: 'oficina',
      label: 'En Oficina',
      icon: <Building2 className="w-4 h-4" />,
      color: 'amber',
      badge: calculatedMetrics?.enOficina || 0,
      description: 'Reclamo en oficina',
      action: () => {
        setActiveQuickFilter('oficina');
        onFilterGuias?.({ estado: 'oficina' });
      },
    },
    {
      id: 'novedad',
      label: 'Novedades',
      icon: <Package className="w-4 h-4" />,
      color: 'orange',
      badge: calculatedMetrics?.conNovedad || 0,
      description: 'Guías con novedad activa',
      action: () => {
        setActiveQuickFilter('novedad');
        onFilterGuias?.({ tieneNovedad: true });
      },
    },
    {
      id: 'rescate',
      label: 'Rescate',
      icon: <Shield className="w-4 h-4" />,
      color: 'purple',
      badge: calculatedMetrics?.conNovedad || 0,
      description: 'Abrir cola de rescate',
      action: () => onOpenRescue?.(),
    },
    {
      id: 'comparar',
      label: 'Comparar',
      icon: <GitCompare className="w-4 h-4" />,
      color: 'indigo',
      badge: sesionesGuardadas.length,
      description: 'Comparar sesiones',
      action: () => onOpenComparison?.(),
    },
    {
      id: 'exportar',
      label: 'Exportar',
      icon: <Download className="w-4 h-4" />,
      color: 'emerald',
      description: 'Exportar datos a Excel',
      action: () => onExportData?.(),
    },
  ], [calculatedMetrics, sesionesGuardadas.length, onFilterGuias, onOpenRescue, onOpenComparison, onExportData]);

  // ============================================
  // BÚSQUEDA INTELIGENTE
  // ============================================

  const performSearch = useCallback((query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const lowerQuery = query.toLowerCase().trim();
    const results: SearchResult[] = [];

    // Buscar en guías
    guiasLogisticas.forEach(guia => {
      const matchGuia = guia.numeroGuia?.toLowerCase().includes(lowerQuery);
      const matchTel = guia.telefono?.includes(lowerQuery);
      const matchCiudad = guia.ciudadDestino?.toLowerCase().includes(lowerQuery);
      const matchEstado = guia.estadoActual?.toLowerCase().includes(lowerQuery);

      if (matchGuia || matchTel || matchCiudad || matchEstado) {
        results.push({
          id: guia.numeroGuia,
          type: 'guia',
          title: guia.numeroGuia,
          subtitle: `${guia.transportadora} • ${guia.ciudadDestino} • ${guia.estadoActual}`,
          icon: guia.tieneNovedad ?
            <AlertTriangle className="w-4 h-4 text-amber-500" /> :
            <Package className="w-4 h-4 text-blue-500" />,
          data: guia,
          actions: [
            guia.telefono && {
              label: 'WhatsApp',
              icon: <MessageSquare className="w-3 h-3" />,
              onClick: () => {
                const phone = guia.telefono.replace(/\D/g, '');
                window.open(`https://wa.me/57${phone}?text=Hola! Sobre su pedido ${guia.numeroGuia}...`, '_blank');
              },
            },
            guia.telefono && {
              label: 'Llamar',
              icon: <Phone className="w-3 h-3" />,
              onClick: () => window.open(`tel:${guia.telefono}`, '_self'),
            },
            {
              label: 'Copiar',
              icon: <Copy className="w-3 h-3" />,
              onClick: () => {
                navigator.clipboard.writeText(guia.numeroGuia);
                setCopiedId(guia.numeroGuia);
                setTimeout(() => setCopiedId(null), 2000);
              },
            },
          ].filter(Boolean) as SearchResult['actions'],
        });
      }
    });

    // Buscar acciones rápidas
    quickActions.forEach(action => {
      if (action.label.toLowerCase().includes(lowerQuery) ||
          action.description?.toLowerCase().includes(lowerQuery)) {
        results.push({
          id: `action-${action.id}`,
          type: 'accion',
          title: action.label,
          subtitle: action.description || '',
          icon: action.icon,
          data: action,
          actions: [{
            label: 'Ejecutar',
            icon: <Zap className="w-3 h-3" />,
            onClick: action.action,
          }],
        });
      }
    });

    // Limitar resultados
    setSearchResults(results.slice(0, 10));
    setIsSearching(false);
  }, [guiasLogisticas, quickActions]);

  // Debounce de búsqueda
  useEffect(() => {
    const timeout = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery, performSearch]);

  // ============================================
  // HANDLERS
  // ============================================

  const handleBubbleClick = () => {
    if (mode === 'bubble') {
      setShowQuickActions(true);
      setMode('bar');
    } else if (mode === 'bar' || mode === 'search') {
      setMode('bubble');
      setShowQuickActions(false);
      setSearchQuery('');
      setSearchResults([]);
      setActiveQuickFilter(null);
    }
  };

  const handleOpenFullPanel = () => {
    setMode('panel');
    setIsOpen(true);
    setShowQuickActions(false);
    clearNotifications();
  };

  const handleSearchFocus = () => {
    setMode('search');
  };

  const handleCloseSearch = () => {
    setMode('bar');
    setSearchQuery('');
    setSearchResults([]);
  };

  // ============================================
  // MINI MÉTRICAS
  // ============================================

  const miniMetrics: MiniMetric[] = useMemo(() => {
    if (!calculatedMetrics) return [];
    return [
      {
        label: 'Entrega',
        value: `${calculatedMetrics.tasaEntrega.toFixed(0)}%`,
        trend: calculatedMetrics.tasaEntrega >= 85 ? 'up' : 'down',
        color: calculatedMetrics.tasaEntrega >= 85 ? 'emerald' : 'amber',
        icon: <Target className="w-3 h-3" />,
      },
      {
        label: 'Críticas',
        value: calculatedMetrics.criticas,
        trend: calculatedMetrics.criticas > 5 ? 'down' : 'up',
        color: calculatedMetrics.criticas > 5 ? 'red' : 'emerald',
        icon: <AlertTriangle className="w-3 h-3" />,
      },
      {
        label: 'Novedad',
        value: calculatedMetrics.conNovedad,
        color: 'amber',
        icon: <Package className="w-3 h-3" />,
      },
    ];
  }, [calculatedMetrics]);

  // ============================================
  // RENDERIZADO
  // ============================================

  // Si está en modo panel completo
  if (mode === 'panel' && isOpen) {
    return (
      <>
        <ProPanel />
        {/* Botón flotante pequeño para volver */}
        <button
          onClick={() => {
            setMode('bubble');
            setIsOpen(false);
          }}
          className="fixed bottom-6 right-6 z-[9996] w-12 h-12 rounded-xl bg-slate-800 border border-slate-700
            flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-all
            shadow-lg"
        >
          <Minimize2 className="w-5 h-5" />
        </button>
      </>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-3">

      {/* ============================================ */}
      {/* BARRA DE BÚSQUEDA Y RESULTADOS */}
      {/* ============================================ */}
      {(mode === 'bar' || mode === 'search') && (
        <div
          className={`
            bg-slate-900 rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden
            transition-all duration-300 ease-out
            ${mode === 'search' && searchResults.length > 0 ? 'w-[400px]' : 'w-[380px]'}
          `}
        >
          {/* Header con búsqueda */}
          <div className="p-3 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-b border-slate-700/50">
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={handleSearchFocus}
                  placeholder="Buscar guía, teléfono, ciudad..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl
                    text-white text-sm placeholder-slate-500
                    focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50
                    transition-all"
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
              <button
                onClick={handleOpenFullPanel}
                className="p-2.5 bg-amber-500 hover:bg-amber-600 rounded-xl text-white transition-colors"
                title="Abrir panel completo"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mini métricas */}
          {mode === 'bar' && calculatedMetrics && (
            <div className="px-3 py-2 border-b border-slate-700/50 flex items-center gap-2">
              {miniMetrics.map((metric, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-lg bg-${metric.color}-500/10 text-${metric.color}-400`}
                >
                  {metric.icon}
                  <span className="text-xs font-medium">{metric.value}</span>
                  <span className="text-[10px] text-slate-500">{metric.label}</span>
                </div>
              ))}
            </div>
          )}

          {/* Resultados de búsqueda */}
          {mode === 'search' && searchResults.length > 0 && (
            <div className="max-h-[350px] overflow-y-auto">
              {searchResults.map((result) => (
                <div
                  key={result.id}
                  className="p-3 hover:bg-slate-800/50 border-b border-slate-800 last:border-0
                    transition-colors cursor-pointer group"
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg bg-slate-800 ${
                      result.type === 'guia' ? '' : 'bg-amber-500/20'
                    }`}>
                      {result.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white text-sm">
                          {result.title}
                        </span>
                        {result.type === 'guia' && result.data?.tieneNovedad && (
                          <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] rounded-full">
                            NOVEDAD
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 truncate">{result.subtitle}</p>

                      {/* Días y teléfono */}
                      {result.type === 'guia' && (
                        <div className="flex items-center gap-3 mt-1.5 text-[10px]">
                          <span className={`flex items-center gap-1 ${
                            result.data?.diasTranscurridos >= 5 ? 'text-red-400' : 'text-slate-500'
                          }`}>
                            <Clock className="w-3 h-3" />
                            {result.data?.diasTranscurridos}d
                          </span>
                          {result.data?.telefono && (
                            <span className="flex items-center gap-1 text-emerald-400">
                              <Phone className="w-3 h-3" />
                              {result.data.telefono}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {result.actions?.map((action, i) => (
                        <button
                          key={i}
                          onClick={(e) => {
                            e.stopPropagation();
                            action.onClick();
                          }}
                          className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white
                            transition-colors"
                          title={action.label}
                        >
                          {copiedId === result.id && action.label === 'Copiar' ? (
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            action.icon
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Mensaje sin resultados */}
          {mode === 'search' && searchQuery && searchResults.length === 0 && !isSearching && (
            <div className="p-6 text-center">
              <Search className="w-10 h-10 mx-auto text-slate-600 mb-2" />
              <p className="text-slate-400 text-sm">No se encontraron resultados</p>
              <p className="text-slate-500 text-xs">Intenta con otro término</p>
            </div>
          )}

          {/* Acciones rápidas */}
          {mode === 'bar' && !searchQuery && (
            <div className="p-3">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 px-1">
                Acciones Rápidas
              </p>
              <div className="grid grid-cols-3 gap-2">
                {quickActions.map((action) => (
                  <button
                    key={action.id}
                    onClick={action.action}
                    className={`
                      relative flex flex-col items-center gap-1.5 p-3 rounded-xl
                      transition-all duration-200
                      ${activeQuickFilter === action.id
                        ? `bg-${action.color}-500/30 border-${action.color}-500/50 border`
                        : `bg-slate-800/50 hover:bg-slate-800 border border-transparent`
                      }
                    `}
                    title={action.description}
                  >
                    <div className={`text-${action.color}-400`}>
                      {action.icon}
                    </div>
                    <span className="text-[10px] text-slate-300 font-medium">
                      {action.label}
                    </span>
                    {action.badge !== undefined && action.badge > 0 && (
                      <span className={`
                        absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1
                        bg-${action.color}-500 rounded-full
                        text-white text-[10px] font-bold
                        flex items-center justify-center
                      `}>
                        {action.badge > 99 ? '99+' : action.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Footer con info */}
          <div className="px-3 py-2 bg-slate-800/30 border-t border-slate-700/50 flex items-center justify-between">
            <span className="text-[10px] text-slate-500">
              {guiasLogisticas.length} guías cargadas
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleBubbleClick}
                className="text-[10px] text-slate-400 hover:text-white transition-colors"
              >
                Minimizar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* BOTÓN BURBUJA PRINCIPAL */}
      {/* ============================================ */}
      <button
        onClick={handleBubbleClick}
        className={`
          relative w-16 h-16 rounded-2xl
          bg-gradient-to-br from-amber-400 via-orange-500 to-red-500
          shadow-2xl shadow-orange-500/40
          cursor-pointer
          transition-all duration-300 ease-out
          hover:scale-110 hover:shadow-orange-500/60
          active:scale-95
          flex flex-col items-center justify-center
          border-2 border-amber-300/50
          overflow-hidden
          group
          ${isProcessing ? 'animate-pulse' : ''}
          ${mode !== 'bubble' ? 'scale-90 opacity-80' : ''}
        `}
      >
        {/* Efecto shine */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent
            opacity-0 group-hover:opacity-100
            -translate-x-full group-hover:translate-x-full
            transition-transform duration-700"
          style={{ transform: 'skewX(-20deg)' }}
        />

        {/* Partículas de brillo */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1 right-2 w-1.5 h-1.5 bg-white/60 rounded-full animate-pulse" />
          <div className="absolute top-3 left-2 w-1 h-1 bg-yellow-200/80 rounded-full animate-pulse delay-150" />
        </div>

        {/* Contenido */}
        {mode === 'bubble' ? (
          <>
            <span className="text-white font-black text-[10px] tracking-widest drop-shadow-lg">
              PRO
            </span>
            <Sparkles className="w-6 h-6 text-white drop-shadow-lg" />
          </>
        ) : (
          <ChevronDown className="w-7 h-7 text-white drop-shadow-lg" />
        )}

        {/* Badge de notificaciones */}
        {notifications > 0 && mode === 'bubble' && (
          <div className="absolute -top-1 -right-1 min-w-[22px] h-[22px] px-1
            bg-red-500 rounded-full text-white text-xs font-bold
            flex items-center justify-center animate-bounce
            shadow-lg shadow-red-500/50 border-2 border-white">
            {notifications > 99 ? '99+' : notifications}
          </div>
        )}

        {/* Indicador de guías críticas */}
        {calculatedMetrics && calculatedMetrics.criticas > 0 && mode === 'bubble' && (
          <div className="absolute -bottom-1 -left-1 w-6 h-6 bg-red-600 rounded-full
            flex items-center justify-center text-white text-[10px] font-bold
            border-2 border-white shadow-lg animate-pulse">
            {calculatedMetrics.criticas}
          </div>
        )}
      </button>

      {/* ============================================ */}
      {/* INDICADOR DE ESTADO RÁPIDO (Solo en modo bubble) */}
      {/* ============================================ */}
      {mode === 'bubble' && calculatedMetrics && (
        <div className="absolute bottom-20 right-0 flex flex-col gap-1 items-end">
          {calculatedMetrics.enOficina > 0 && (
            <div className="px-2 py-1 bg-amber-500/90 rounded-lg text-white text-[10px] font-medium
              shadow-lg animate-pulse flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              {calculatedMetrics.enOficina} en oficina
            </div>
          )}
          {calculatedMetrics.criticas > 0 && (
            <div className="px-2 py-1 bg-red-500/90 rounded-lg text-white text-[10px] font-medium
              shadow-lg flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {calculatedMetrics.criticas} críticas
            </div>
          )}
        </div>
      )}

      {/* Estilos adicionales */}
      <style>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ProBubbleV2;
