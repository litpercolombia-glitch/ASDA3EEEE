// components/search/UniversalSearch.tsx
// Búsqueda Universal con Atajos de Teclado - Estilo Spotlight/Command K
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Search,
  X,
  Package,
  Users,
  FileText,
  Settings,
  Brain,
  BarChart3,
  Truck,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  Command,
  ArrowUp,
  ArrowDown,
  CornerDownLeft,
  Hash,
  Zap,
} from 'lucide-react';
import { Shipment } from '../../types';

// ============================================
// TIPOS
// ============================================

interface SearchResult {
  id: string;
  type: 'shipment' | 'action' | 'page' | 'command';
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  iconColor: string;
  data?: unknown;
  action?: () => void;
}

interface UniversalSearchProps {
  shipments: Shipment[];
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (tab: string) => void;
  onSelectShipment?: (shipment: Shipment) => void;
}

// ============================================
// ACCIONES Y PÁGINAS DISPONIBLES
// ============================================

const QUICK_ACTIONS: SearchResult[] = [
  {
    id: 'action-chat',
    type: 'action',
    title: 'Abrir Chat IA',
    subtitle: 'Conversa con el asistente',
    icon: Brain,
    iconColor: 'text-purple-500',
  },
  {
    id: 'action-report',
    type: 'action',
    title: 'Generar Reporte',
    subtitle: 'Crear reporte del día',
    icon: FileText,
    iconColor: 'text-blue-500',
  },
  {
    id: 'action-export',
    type: 'action',
    title: 'Exportar a Excel',
    subtitle: 'Descargar datos',
    icon: BarChart3,
    iconColor: 'text-emerald-500',
  },
];

const PAGES: SearchResult[] = [
  {
    id: 'page-home',
    type: 'page',
    title: 'Inicio',
    subtitle: 'Dashboard principal',
    icon: Package,
    iconColor: 'text-amber-500',
  },
  {
    id: 'page-operations',
    type: 'page',
    title: 'Operaciones',
    subtitle: 'Seguimiento y gestión de envíos',
    icon: Truck,
    iconColor: 'text-emerald-500',
  },
  {
    id: 'page-intelligence',
    type: 'page',
    title: 'Inteligencia IA',
    subtitle: 'Asistente, predicciones y ML',
    icon: Brain,
    iconColor: 'text-purple-500',
  },
  {
    id: 'page-business',
    type: 'page',
    title: 'Negocio',
    subtitle: 'CRM, pedidos y finanzas',
    icon: Users,
    iconColor: 'text-rose-500',
  },
  {
    id: 'page-config',
    type: 'page',
    title: 'Configuración',
    subtitle: 'Ajustes del sistema',
    icon: Settings,
    iconColor: 'text-slate-500',
  },
];

const COMMANDS: SearchResult[] = [
  {
    id: 'cmd-status',
    type: 'command',
    title: '/estado',
    subtitle: 'Ver estado general de envíos',
    icon: Hash,
    iconColor: 'text-cyan-500',
  },
  {
    id: 'cmd-critical',
    type: 'command',
    title: '/criticas',
    subtitle: 'Ver guías críticas',
    icon: AlertTriangle,
    iconColor: 'text-red-500',
  },
  {
    id: 'cmd-predict',
    type: 'command',
    title: '/predecir',
    subtitle: 'Predicciones ML',
    icon: Zap,
    iconColor: 'text-amber-500',
  },
];

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

const UniversalSearch: React.FC<UniversalSearchProps> = ({
  shipments,
  isOpen,
  onClose,
  onNavigate,
  onSelectShipment,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeCategory, setActiveCategory] = useState<'all' | 'shipments' | 'actions' | 'pages'>('all');

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // ============================================
  // BÚSQUEDA DE GUÍAS
  // ============================================

  const searchShipments = useCallback((searchQuery: string): SearchResult[] => {
    if (!searchQuery || searchQuery.length < 2) return [];

    const lowerQuery = searchQuery.toLowerCase();
    return shipments
      .filter(s =>
        s.id?.toLowerCase().includes(lowerQuery) ||
        s.trackingNumber?.toLowerCase().includes(lowerQuery) ||
        s.phone?.includes(searchQuery) ||
        s.recipientPhone?.includes(searchQuery) ||
        s.carrier?.toLowerCase().includes(lowerQuery) ||
        s.detailedInfo?.destination?.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 10)
      .map(s => ({
        id: `shipment-${s.id}`,
        type: 'shipment' as const,
        title: s.trackingNumber || s.id,
        subtitle: `${s.carrier || 'N/A'} • ${s.detailedInfo?.destination || 'Sin destino'} • ${s.status}`,
        icon: s.status === 'delivered' ? CheckCircle :
              s.status === 'issue' ? AlertTriangle :
              s.status === 'in_transit' ? Truck : Package,
        iconColor: s.status === 'delivered' ? 'text-emerald-500' :
                   s.status === 'issue' ? 'text-red-500' :
                   s.status === 'in_transit' ? 'text-blue-500' : 'text-slate-500',
        data: s,
      }));
  }, [shipments]);

  // ============================================
  // RESULTADOS COMBINADOS
  // ============================================

  const results = useMemo((): SearchResult[] => {
    if (!query) {
      // Sin query, mostrar acciones rápidas y páginas
      return [...QUICK_ACTIONS, ...PAGES.slice(0, 4)];
    }

    const lowerQuery = query.toLowerCase();
    const allResults: SearchResult[] = [];

    // Buscar en guías
    if (activeCategory === 'all' || activeCategory === 'shipments') {
      allResults.push(...searchShipments(query));
    }

    // Buscar en acciones
    if (activeCategory === 'all' || activeCategory === 'actions') {
      const matchedActions = QUICK_ACTIONS.filter(a =>
        a.title.toLowerCase().includes(lowerQuery) ||
        a.subtitle?.toLowerCase().includes(lowerQuery)
      );
      allResults.push(...matchedActions);
    }

    // Buscar en páginas
    if (activeCategory === 'all' || activeCategory === 'pages') {
      const matchedPages = PAGES.filter(p =>
        p.title.toLowerCase().includes(lowerQuery) ||
        p.subtitle?.toLowerCase().includes(lowerQuery)
      );
      allResults.push(...matchedPages);
    }

    // Comandos (si empieza con /)
    if (query.startsWith('/')) {
      const matchedCommands = COMMANDS.filter(c =>
        c.title.toLowerCase().includes(lowerQuery)
      );
      allResults.push(...matchedCommands);
    }

    return allResults.slice(0, 15);
  }, [query, activeCategory, searchShipments]);

  // ============================================
  // EFECTOS
  // ============================================

  // Focus al abrir
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Reset selected index cuando cambian resultados
  useEffect(() => {
    setSelectedIndex(0);
  }, [results.length]);

  // Scroll al elemento seleccionado
  useEffect(() => {
    const resultsContainer = resultsRef.current;
    if (resultsContainer && results.length > 0) {
      const selectedElement = resultsContainer.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex, results.length]);

  // ============================================
  // HANDLERS
  // ============================================

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % results.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (results[selectedIndex]) {
          handleSelect(results[selectedIndex]);
        }
        break;
      case 'Escape':
        onClose();
        break;
      case 'Tab':
        e.preventDefault();
        // Cambiar categoría
        const categories: Array<'all' | 'shipments' | 'actions' | 'pages'> = ['all', 'shipments', 'actions', 'pages'];
        const currentIdx = categories.indexOf(activeCategory);
        setActiveCategory(categories[(currentIdx + 1) % categories.length]);
        break;
    }
  };

  const handleSelect = (result: SearchResult) => {
    switch (result.type) {
      case 'shipment':
        if (onSelectShipment && result.data) {
          onSelectShipment(result.data as Shipment);
        }
        break;
      case 'page':
        const pageMap: Record<string, string> = {
          'page-home': 'home',
          'page-operations': 'operaciones',
          'page-intelligence': 'inteligencia-ia',
          'page-business': 'negocio',
          'page-config': 'admin',
        };
        if (onNavigate && pageMap[result.id]) {
          onNavigate(pageMap[result.id]);
        }
        break;
      case 'action':
      case 'command':
        if (result.action) {
          result.action();
        }
        break;
    }
    onClose();
  };

  // ============================================
  // RENDER
  // ============================================

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Search Modal */}
      <div className="relative w-full max-w-2xl mx-4 bg-slate-900 rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden animate-slide-down">
        {/* Input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-700/50">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar guías, páginas, acciones..."
            className="flex-1 bg-transparent text-white text-lg placeholder-slate-500 outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 hover:bg-slate-800 rounded-lg text-slate-400"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-400">ESC</kbd>
            <span>cerrar</span>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-1 px-4 py-2 border-b border-slate-700/50 bg-slate-800/30">
          {[
            { id: 'all' as const, label: 'Todo' },
            { id: 'shipments' as const, label: 'Guías' },
            { id: 'actions' as const, label: 'Acciones' },
            { id: 'pages' as const, label: 'Páginas' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeCategory === cat.id
                  ? 'bg-purple-500 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
          <span className="ml-auto text-[10px] text-slate-500 flex items-center gap-1">
            <kbd className="px-1 bg-slate-800 rounded">TAB</kbd> cambiar
          </span>
        </div>

        {/* Results */}
        <div
          ref={resultsRef}
          className="max-h-[400px] overflow-y-auto py-2"
        >
          {results.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <Search className="w-10 h-10 mx-auto text-slate-600 mb-3" />
              <p className="text-slate-400">No se encontraron resultados</p>
              <p className="text-xs text-slate-500 mt-1">Intenta con otro término de búsqueda</p>
            </div>
          ) : (
            results.map((result, index) => (
              <button
                key={result.id}
                onClick={() => handleSelect(result)}
                className={`w-full flex items-center gap-3 px-5 py-3 transition-colors ${
                  index === selectedIndex
                    ? 'bg-purple-600/20 border-l-2 border-purple-500'
                    : 'hover:bg-slate-800/50 border-l-2 border-transparent'
                }`}
              >
                <div className={`p-2 rounded-lg bg-slate-800 ${result.iconColor}`}>
                  <result.icon className="w-4 h-4" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-white font-medium">{result.title}</p>
                  {result.subtitle && (
                    <p className="text-xs text-slate-400">{result.subtitle}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                    result.type === 'shipment' ? 'bg-emerald-500/20 text-emerald-400' :
                    result.type === 'action' ? 'bg-purple-500/20 text-purple-400' :
                    result.type === 'page' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-cyan-500/20 text-cyan-400'
                  }`}>
                    {result.type === 'shipment' ? 'Guía' :
                     result.type === 'action' ? 'Acción' :
                     result.type === 'page' ? 'Página' : 'Comando'}
                  </span>
                  {index === selectedIndex && (
                    <CornerDownLeft className="w-4 h-4 text-purple-400" />
                  )}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-700/50 bg-slate-800/30">
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <ArrowUp className="w-3 h-3" />
              <ArrowDown className="w-3 h-3" />
              navegar
            </span>
            <span className="flex items-center gap-1">
              <CornerDownLeft className="w-3 h-3" />
              seleccionar
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Command className="w-3 h-3" />
            <span>+</span>
            <kbd className="px-1 bg-slate-700 rounded">K</kbd>
            <span>abrir búsqueda</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Estilos de animación
const styles = `
  @keyframes slide-down {
    from { opacity: 0; transform: translateY(-20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-slide-down {
    animation: slide-down 0.2s ease-out;
  }
`;

if (typeof document !== 'undefined') {
  const existingStyle = document.getElementById('universal-search-styles');
  if (!existingStyle) {
    const styleEl = document.createElement('style');
    styleEl.id = 'universal-search-styles';
    styleEl.textContent = styles;
    document.head.appendChild(styleEl);
  }
}

export default UniversalSearch;
