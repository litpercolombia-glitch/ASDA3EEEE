/**
 * CommandPalette - LITPER PRO
 *
 * Modal de búsqueda y comandos rápidos (Cmd+K / Ctrl+K)
 * Con búsqueda fuzzy avanzada tipo fuse.js
 * Inspirado en Linear, Raycast, VS Code y Spotlight
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Search,
  Home,
  MessageSquare,
  LayoutDashboard,
  Package,
  Truck,
  Route,
  Warehouse,
  FileText,
  DollarSign,
  BarChart3,
  Users,
  ShoppingCart,
  Megaphone,
  Settings,
  UserCog,
  Puzzle,
  Palette,
  ArrowRight,
  Clock,
  Sparkles,
  Globe,
  Bell,
  Plus,
  X,
  HelpCircle,
  Book,
  Keyboard,
  Mail,
  FileSpreadsheet,
  Download,
  Upload,
  MapPin,
  Calculator,
  Shield,
  Zap,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Hash,
  Command,
} from 'lucide-react';
import { useSidebarStore } from '../../../../stores/sidebarStore';

// ============================================================================
// TYPES
// ============================================================================

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  category: CommandCategory;
  keywords?: string[];
  shortcut?: string;
  action?: () => void;
  path?: string;
  badge?: {
    text: string;
    variant: 'info' | 'success' | 'warning' | 'error';
  };
}

type CommandCategory =
  | 'Navegación'
  | 'Acciones Rápidas'
  | 'Logística'
  | 'Finanzas'
  | 'CRM'
  | 'Configuración'
  | 'Ayuda';

interface CommandPaletteProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSelect?: (item: CommandItem) => void;
  customCommands?: CommandItem[];
}

interface FuzzyMatch {
  item: CommandItem;
  score: number;
  matches: number[];
}

// ============================================================================
// FUZZY SEARCH (fuse.js-like implementation)
// ============================================================================

const fuzzyMatch = (pattern: string, text: string): { score: number; matches: number[] } => {
  const patternLower = pattern.toLowerCase();
  const textLower = text.toLowerCase();

  let score = 0;
  let patternIdx = 0;
  let matches: number[] = [];
  let consecutiveMatches = 0;
  let lastMatchIdx = -2;

  for (let i = 0; i < textLower.length && patternIdx < patternLower.length; i++) {
    if (textLower[i] === patternLower[patternIdx]) {
      matches.push(i);

      // Bonus for consecutive matches
      if (i === lastMatchIdx + 1) {
        consecutiveMatches++;
        score += 10 + consecutiveMatches * 5;
      } else {
        consecutiveMatches = 0;
        score += 10;
      }

      // Bonus for matching at word boundaries
      if (i === 0 || textLower[i - 1] === ' ' || textLower[i - 1] === '-' || textLower[i - 1] === '_') {
        score += 15;
      }

      // Bonus for matching uppercase in camelCase
      if (text[i] === text[i].toUpperCase() && text[i] !== text[i].toLowerCase()) {
        score += 5;
      }

      lastMatchIdx = i;
      patternIdx++;
    }
  }

  // All pattern characters must match
  if (patternIdx !== patternLower.length) {
    return { score: 0, matches: [] };
  }

  // Bonus for shorter strings (more relevant)
  score += Math.max(0, 50 - textLower.length);

  // Bonus for exact prefix match
  if (textLower.startsWith(patternLower)) {
    score += 100;
  }

  return { score, matches };
};

const fuzzySearch = (query: string, items: CommandItem[]): FuzzyMatch[] => {
  if (!query.trim()) {
    return items.map(item => ({ item, score: 0, matches: [] }));
  }

  const results: FuzzyMatch[] = [];

  items.forEach(item => {
    // Search in label
    const labelMatch = fuzzyMatch(query, item.label);

    // Search in description
    const descMatch = item.description ? fuzzyMatch(query, item.description) : { score: 0, matches: [] };

    // Search in keywords
    let keywordScore = 0;
    (item.keywords || []).forEach(keyword => {
      const kwMatch = fuzzyMatch(query, keyword);
      keywordScore = Math.max(keywordScore, kwMatch.score * 0.8); // Keywords worth slightly less
    });

    // Search in category
    const catMatch = fuzzyMatch(query, item.category);

    const totalScore = Math.max(
      labelMatch.score * 1.5, // Label matches worth more
      descMatch.score,
      keywordScore,
      catMatch.score * 0.5
    );

    if (totalScore > 0) {
      results.push({
        item,
        score: totalScore,
        matches: labelMatch.matches,
      });
    }
  });

  return results.sort((a, b) => b.score - a.score);
};

// ============================================================================
// COMMANDS DATABASE
// ============================================================================

const createCommands = (): CommandItem[] => [
  // ========== NAVEGACIÓN ==========
  {
    id: 'home',
    label: 'Inicio',
    description: 'Ir al dashboard principal',
    icon: <Home className="w-4 h-4" />,
    category: 'Navegación',
    path: '/',
    keywords: ['dashboard', 'home', 'inicio', 'principal'],
    shortcut: '⌘H',
  },
  {
    id: 'chat',
    label: 'Chat IA',
    description: 'Asistente inteligente LITPER',
    icon: <MessageSquare className="w-4 h-4" />,
    category: 'Navegación',
    path: '/chat',
    keywords: ['ai', 'asistente', 'chatbot', 'inteligencia', 'artificial'],
    shortcut: '⌘J',
  },
  {
    id: 'dashboard-exec',
    label: 'Dashboard Ejecutivo',
    description: 'KPIs y métricas en tiempo real',
    icon: <TrendingUp className="w-4 h-4" />,
    category: 'Navegación',
    path: '/dashboard-ejecutivo',
    keywords: ['kpi', 'metricas', 'ejecutivo', 'ceo'],
    badge: { text: 'PRO', variant: 'info' },
  },
  {
    id: 'pedidos',
    label: 'Pedidos',
    description: 'Gestión de pedidos y envíos',
    icon: <Package className="w-4 h-4" />,
    category: 'Navegación',
    path: '/pedidos',
    keywords: ['orders', 'envios', 'ordenes'],
    shortcut: '⌘P',
  },
  {
    id: 'tracking',
    label: 'Tracking',
    description: 'Rastreo de envíos en tiempo real',
    icon: <Truck className="w-4 h-4" />,
    category: 'Navegación',
    path: '/tracking',
    keywords: ['rastreo', 'seguimiento', 'ubicacion', 'estado'],
    shortcut: '⌘T',
  },

  // ========== ACCIONES RÁPIDAS ==========
  {
    id: 'new-order',
    label: 'Crear Pedido',
    description: 'Agregar un nuevo pedido manualmente',
    icon: <Plus className="w-4 h-4" />,
    category: 'Acciones Rápidas',
    keywords: ['nuevo', 'crear', 'agregar', 'order'],
    shortcut: '⌘N',
  },
  {
    id: 'search-guide',
    label: 'Buscar Guía',
    description: 'Buscar por número de guía',
    icon: <Hash className="w-4 h-4" />,
    category: 'Acciones Rápidas',
    keywords: ['guia', 'tracking', 'numero', 'rastrear'],
    shortcut: '⌘G',
  },
  {
    id: 'export-report',
    label: 'Exportar Reporte',
    description: 'Descargar reporte en Excel',
    icon: <Download className="w-4 h-4" />,
    category: 'Acciones Rápidas',
    keywords: ['excel', 'csv', 'descargar', 'exportar'],
    shortcut: '⌘E',
  },
  {
    id: 'import-excel',
    label: 'Importar Excel',
    description: 'Cargar pedidos desde archivo',
    icon: <Upload className="w-4 h-4" />,
    category: 'Acciones Rápidas',
    keywords: ['cargar', 'subir', 'excel', 'csv', 'importar'],
    shortcut: '⌘I',
  },
  {
    id: 'refresh-data',
    label: 'Actualizar Datos',
    description: 'Sincronizar con transportadoras',
    icon: <RefreshCw className="w-4 h-4" />,
    category: 'Acciones Rápidas',
    keywords: ['sync', 'refresh', 'actualizar', 'sincronizar'],
    shortcut: '⌘R',
  },
  {
    id: 'notifications',
    label: 'Ver Notificaciones',
    description: 'Alertas y novedades pendientes',
    icon: <Bell className="w-4 h-4" />,
    category: 'Acciones Rápidas',
    keywords: ['alertas', 'avisos', 'pendientes'],
    badge: { text: '5', variant: 'warning' },
  },

  // ========== LOGÍSTICA ==========
  {
    id: 'rutas',
    label: 'Optimizar Rutas',
    description: 'Planificación de rutas de entrega',
    icon: <Route className="w-4 h-4" />,
    category: 'Logística',
    path: '/rutas',
    keywords: ['routes', 'optimizar', 'planificar'],
  },
  {
    id: 'almacenes',
    label: 'Almacenes',
    description: 'Gestión de inventario por bodega',
    icon: <Warehouse className="w-4 h-4" />,
    category: 'Logística',
    path: '/almacenes',
    keywords: ['warehouse', 'inventario', 'bodega', 'stock'],
  },
  {
    id: 'transportadoras',
    label: 'Transportadoras',
    description: 'Coordinadora, Servientrega, Inter...',
    icon: <Globe className="w-4 h-4" />,
    category: 'Logística',
    path: '/transportadoras',
    keywords: ['carriers', 'coordinadora', 'servientrega', 'interrapidisimo'],
  },
  {
    id: 'ciudades',
    label: 'Semáforo de Ciudades',
    description: 'Análisis de entregabilidad por ciudad',
    icon: <MapPin className="w-4 h-4" />,
    category: 'Logística',
    path: '/ciudades',
    keywords: ['cities', 'semaforo', 'entregabilidad', 'cobertura'],
    badge: { text: 'AI', variant: 'success' },
  },
  {
    id: 'novedades',
    label: 'Novedades',
    description: 'Gestión de devoluciones y problemas',
    icon: <AlertTriangle className="w-4 h-4" />,
    category: 'Logística',
    path: '/novedades',
    keywords: ['issues', 'problemas', 'devoluciones', 'reclamos'],
    badge: { text: '12', variant: 'error' },
  },

  // ========== FINANZAS ==========
  {
    id: 'facturacion',
    label: 'Facturación DIAN',
    description: 'Facturación electrónica Colombia',
    icon: <FileText className="w-4 h-4" />,
    category: 'Finanzas',
    path: '/facturacion',
    keywords: ['invoices', 'facturas', 'dian', 'electronica'],
  },
  {
    id: 'cobros',
    label: 'Cobros y Pagos',
    description: 'Gestión de cartera y recaudos',
    icon: <DollarSign className="w-4 h-4" />,
    category: 'Finanzas',
    path: '/cobros',
    keywords: ['payments', 'pagos', 'cartera', 'recaudos'],
  },
  {
    id: 'reportes',
    label: 'Reportes Financieros',
    description: 'Analytics y métricas de negocio',
    icon: <BarChart3 className="w-4 h-4" />,
    category: 'Finanzas',
    path: '/reportes',
    keywords: ['reports', 'analytics', 'estadisticas'],
  },
  {
    id: 'calculator',
    label: 'Calculadora de Envío',
    description: 'Cotizar envíos por transportadora',
    icon: <Calculator className="w-4 h-4" />,
    category: 'Finanzas',
    keywords: ['cotizar', 'precio', 'tarifa', 'costo'],
  },

  // ========== CRM ==========
  {
    id: 'clientes',
    label: 'Clientes',
    description: 'Base de datos de clientes',
    icon: <Users className="w-4 h-4" />,
    category: 'CRM',
    path: '/clientes',
    keywords: ['customers', 'contacts', 'destinatarios'],
  },
  {
    id: 'productos',
    label: 'Catálogo de Productos',
    description: 'Gestión de productos y SKUs',
    icon: <ShoppingCart className="w-4 h-4" />,
    category: 'CRM',
    path: '/productos',
    keywords: ['catalog', 'catalogo', 'sku', 'items'],
  },
  {
    id: 'campanas',
    label: 'Campañas Marketing',
    description: 'Seguimiento de campañas ads',
    icon: <Megaphone className="w-4 h-4" />,
    category: 'CRM',
    path: '/campanas',
    keywords: ['marketing', 'email', 'ads', 'facebook', 'google'],
  },

  // ========== CONFIGURACIÓN ==========
  {
    id: 'usuarios',
    label: 'Usuarios y Permisos',
    description: 'Gestión del equipo',
    icon: <UserCog className="w-4 h-4" />,
    category: 'Configuración',
    path: '/usuarios',
    keywords: ['users', 'team', 'equipo', 'permisos', 'roles'],
  },
  {
    id: 'integraciones',
    label: 'Integraciones',
    description: 'Shopify, WooCommerce, APIs',
    icon: <Puzzle className="w-4 h-4" />,
    category: 'Configuración',
    path: '/integraciones',
    keywords: ['api', 'shopify', 'woocommerce', 'webhook'],
  },
  {
    id: 'seguridad',
    label: 'Seguridad',
    description: 'Autenticación y auditoría',
    icon: <Shield className="w-4 h-4" />,
    category: 'Configuración',
    path: '/seguridad',
    keywords: ['security', '2fa', 'password', 'audit'],
  },
  {
    id: 'settings',
    label: 'Configuración General',
    description: 'Preferencias de la cuenta',
    icon: <Settings className="w-4 h-4" />,
    category: 'Configuración',
    path: '/settings',
    keywords: ['preferences', 'config', 'opciones'],
    shortcut: '⌘,',
  },

  // ========== AYUDA ==========
  {
    id: 'help-docs',
    label: 'Documentación',
    description: 'Guías y tutoriales de LITPER',
    icon: <Book className="w-4 h-4" />,
    category: 'Ayuda',
    keywords: ['docs', 'manual', 'guia', 'tutorial'],
  },
  {
    id: 'help-shortcuts',
    label: 'Atajos de Teclado',
    description: 'Ver todos los shortcuts',
    icon: <Keyboard className="w-4 h-4" />,
    category: 'Ayuda',
    keywords: ['shortcuts', 'keyboard', 'teclado', 'hotkeys'],
    shortcut: '⌘/',
  },
  {
    id: 'help-support',
    label: 'Soporte Técnico',
    description: 'Contactar al equipo de soporte',
    icon: <Mail className="w-4 h-4" />,
    category: 'Ayuda',
    keywords: ['support', 'help', 'ticket', 'contacto'],
  },
  {
    id: 'help-whats-new',
    label: "Novedades de LITPER",
    description: 'Últimas actualizaciones',
    icon: <Zap className="w-4 h-4" />,
    category: 'Ayuda',
    keywords: ['changelog', 'updates', 'news', 'nuevo'],
    badge: { text: 'Nuevo', variant: 'success' },
  },
];

// ============================================================================
// CATEGORY ICONS
// ============================================================================

const categoryIcons: Record<CommandCategory, React.ReactNode> = {
  'Navegación': <Home className="w-3 h-3" />,
  'Acciones Rápidas': <Zap className="w-3 h-3" />,
  'Logística': <Truck className="w-3 h-3" />,
  'Finanzas': <DollarSign className="w-3 h-3" />,
  'CRM': <Users className="w-3 h-3" />,
  'Configuración': <Settings className="w-3 h-3" />,
  'Ayuda': <HelpCircle className="w-3 h-3" />,
};

// ============================================================================
// BADGE COMPONENT
// ============================================================================

const Badge: React.FC<{ text: string; variant: 'info' | 'success' | 'warning' | 'error' }> = ({
  text,
  variant,
}) => {
  const colors = {
    info: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    success: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    warning: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    error: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  return (
    <span
      className={`
        px-1.5 py-0.5 text-[10px] font-semibold rounded border
        ${colors[variant]}
      `}
    >
      {text}
    </span>
  );
};

// ============================================================================
// HIGHLIGHTED TEXT COMPONENT
// ============================================================================

const HighlightedText: React.FC<{ text: string; matches: number[] }> = ({ text, matches }) => {
  if (matches.length === 0) return <>{text}</>;

  const matchSet = new Set(matches);
  return (
    <>
      {text.split('').map((char, i) => (
        <span
          key={i}
          className={matchSet.has(i) ? 'text-blue-400 font-semibold' : ''}
        >
          {char}
        </span>
      ))}
    </>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen: controlledIsOpen,
  onClose: controlledOnClose,
  onSelect,
  customCommands = [],
}) => {
  const { isCommandPaletteOpen, closeCommandPalette, recentItems } = useSidebarStore();

  const isOpen = controlledIsOpen ?? isCommandPaletteOpen;
  const onClose = controlledOnClose ?? closeCommandPalette;

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // All commands
  const allCommands = useMemo(
    () => [...createCommands(), ...customCommands],
    [customCommands]
  );

  // Fuzzy search results
  const searchResults = useMemo(
    () => fuzzySearch(query, allCommands),
    [query, allCommands]
  );

  // Group by category
  const groupedResults = useMemo(() => {
    const groups: Record<string, FuzzyMatch[]> = {};
    const categoryOrder: CommandCategory[] = [
      'Navegación',
      'Acciones Rápidas',
      'Logística',
      'Finanzas',
      'CRM',
      'Configuración',
      'Ayuda',
    ];

    searchResults.forEach((result) => {
      const cat = result.item.category;
      if (!groups[cat]) {
        groups[cat] = [];
      }
      groups[cat].push(result);
    });

    // Return in order
    const ordered: [string, FuzzyMatch[]][] = [];
    categoryOrder.forEach((cat) => {
      if (groups[cat] && groups[cat].length > 0) {
        ordered.push([cat, groups[cat]]);
      }
    });

    return ordered;
  }, [searchResults]);

  // Flat list for keyboard navigation
  const flatResults = useMemo(() => searchResults, [searchResults]);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setIsAnimating(true);
      setTimeout(() => {
        inputRef.current?.focus();
        setIsAnimating(false);
      }, 50);
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((i) => Math.min(i + 1, flatResults.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((i) => Math.max(i - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (flatResults[selectedIndex]) {
            handleSelect(flatResults[selectedIndex].item);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        case 'Tab':
          e.preventDefault();
          if (e.shiftKey) {
            setSelectedIndex((i) => Math.max(i - 1, 0));
          } else {
            setSelectedIndex((i) => Math.min(i + 1, flatResults.length - 1));
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, flatResults, selectedIndex, onClose]);

  // Scroll selected into view
  useEffect(() => {
    if (listRef.current) {
      const selected = listRef.current.querySelector('[data-selected="true"]');
      if (selected) {
        selected.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  const handleSelect = useCallback(
    (item: CommandItem) => {
      if (item.action) {
        item.action();
      } else if (onSelect) {
        onSelect(item);
      } else if (item.path) {
        // Navigate - in real app, use router
        window.location.href = item.path;
      }
      onClose();
    },
    [onSelect, onClose]
  );

  if (!isOpen) return null;

  let currentIndex = 0;

  return createPortal(
    <>
      {/* Backdrop with blur */}
      <div
        className="fixed inset-0 z-[200]"
        onClick={onClose}
        style={{
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(8px)',
          animation: 'fadeIn 0.15s ease-out',
        }}
      />

      {/* Modal */}
      <div
        className="fixed z-[201] top-[15%] left-1/2 w-full max-w-2xl"
        style={{
          transform: 'translateX(-50%)',
          animation: 'slideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <div
          className="mx-4 overflow-hidden rounded-2xl"
          style={{
            background: 'linear-gradient(180deg, #12121a 0%, #0d0d14 100%)',
            border: '1px solid rgba(63, 63, 70, 0.5)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05) inset',
          }}
        >
          {/* Search Header */}
          <div
            className="flex items-center gap-3 px-5 py-4"
            style={{ borderBottom: '1px solid rgba(63, 63, 70, 0.5)' }}
          >
            <div
              className="p-2 rounded-lg"
              style={{ background: 'rgba(59, 130, 246, 0.1)' }}
            >
              <Command className="w-4 h-4 text-blue-400" />
            </div>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              placeholder="Buscar páginas, comandos, pedidos..."
              className="flex-1 bg-transparent text-white text-base placeholder:text-zinc-500 outline-none"
              style={{ caretColor: '#3b82f6' }}
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <div className="flex items-center gap-1">
              <kbd
                className="px-2 py-1 text-xs font-mono rounded"
                style={{
                  background: 'rgba(63, 63, 70, 0.5)',
                  color: '#a1a1aa',
                  border: '1px solid rgba(82, 82, 91, 0.5)',
                }}
              >
                ESC
              </kbd>
            </div>
          </div>

          {/* Results */}
          <div
            ref={listRef}
            className="overflow-y-auto py-2"
            style={{ maxHeight: '420px' }}
          >
            {flatResults.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <div
                  className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
                  style={{ background: 'rgba(63, 63, 70, 0.3)' }}
                >
                  <Search className="w-8 h-8 text-zinc-600" />
                </div>
                <p className="text-sm text-zinc-400 font-medium">No se encontraron resultados</p>
                <p className="text-xs text-zinc-600 mt-1">
                  Intenta con otras palabras clave
                </p>
              </div>
            ) : (
              <>
                {/* Recent items (only when no query) */}
                {!query && recentItems.length > 0 && (
                  <div className="mb-2">
                    <div
                      className="px-5 py-2 text-[11px] font-semibold uppercase tracking-wider flex items-center gap-2"
                      style={{ color: '#71717a' }}
                    >
                      <Clock className="w-3 h-3" />
                      Recientes
                    </div>
                    {recentItems.slice(0, 3).map((item) => (
                      <button
                        key={`recent-${item.id}`}
                        className="w-full flex items-center gap-3 px-5 py-2.5 text-sm text-zinc-400 hover:text-white transition-colors"
                        style={{ background: 'transparent' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <Clock className="w-4 h-4 text-zinc-600" />
                        <span className="flex-1 text-left truncate">{item.label}</span>
                      </button>
                    ))}
                    <div className="mx-5 my-2" style={{ height: '1px', background: 'rgba(63, 63, 70, 0.5)' }} />
                  </div>
                )}

                {/* Grouped results */}
                {groupedResults.map(([category, items]) => (
                  <div key={category} className="mb-2">
                    <div
                      className="px-5 py-2 text-[11px] font-semibold uppercase tracking-wider flex items-center gap-2"
                      style={{ color: '#71717a' }}
                    >
                      {categoryIcons[category as CommandCategory]}
                      {category}
                    </div>
                    {items.map((result) => {
                      const isSelected = currentIndex === selectedIndex;
                      const itemIndex = currentIndex;
                      currentIndex++;

                      return (
                        <button
                          key={result.item.id}
                          data-selected={isSelected}
                          onClick={() => handleSelect(result.item)}
                          onMouseEnter={() => setSelectedIndex(itemIndex)}
                          className="w-full flex items-center gap-3 px-5 py-2.5 text-sm transition-all duration-75"
                          style={{
                            background: isSelected
                              ? 'linear-gradient(90deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.05) 100%)'
                              : 'transparent',
                            color: isSelected ? '#ffffff' : '#a1a1aa',
                          }}
                        >
                          <span
                            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
                            style={{
                              background: isSelected
                                ? 'rgba(59, 130, 246, 0.2)'
                                : 'rgba(63, 63, 70, 0.5)',
                              color: isSelected ? '#60a5fa' : '#71717a',
                              boxShadow: isSelected
                                ? '0 0 20px rgba(59, 130, 246, 0.2)'
                                : 'none',
                            }}
                          >
                            {result.item.icon}
                          </span>
                          <div className="flex-1 text-left min-w-0">
                            <p className="font-medium truncate">
                              <HighlightedText
                                text={result.item.label}
                                matches={result.matches}
                              />
                            </p>
                            {result.item.description && (
                              <p
                                className="text-xs truncate mt-0.5"
                                style={{ color: isSelected ? '#94a3b8' : '#52525b' }}
                              >
                                {result.item.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {result.item.badge && (
                              <Badge
                                text={result.item.badge.text}
                                variant={result.item.badge.variant}
                              />
                            )}
                            {result.item.shortcut && (
                              <kbd
                                className="px-1.5 py-0.5 text-[10px] font-mono rounded"
                                style={{
                                  background: 'rgba(63, 63, 70, 0.5)',
                                  color: '#71717a',
                                  border: '1px solid rgba(82, 82, 91, 0.3)',
                                }}
                              >
                                {result.item.shortcut}
                              </kbd>
                            )}
                            {isSelected && (
                              <ArrowRight
                                className="w-4 h-4 text-blue-400"
                                style={{ animation: 'slideRight 0.2s ease' }}
                              />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Footer */}
          <div
            className="flex items-center justify-between px-5 py-3 text-[11px]"
            style={{
              borderTop: '1px solid rgba(63, 63, 70, 0.5)',
              color: '#52525b',
            }}
          >
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded" style={{ background: 'rgba(63, 63, 70, 0.5)' }}>↑</kbd>
                <kbd className="px-1.5 py-0.5 rounded" style={{ background: 'rgba(63, 63, 70, 0.5)' }}>↓</kbd>
                <span className="text-zinc-500">navegar</span>
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded" style={{ background: 'rgba(63, 63, 70, 0.5)' }}>↵</kbd>
                <span className="text-zinc-500">seleccionar</span>
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded" style={{ background: 'rgba(63, 63, 70, 0.5)' }}>Tab</kbd>
                <span className="text-zinc-500">siguiente</span>
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span className="text-zinc-400">Powered by LITPER AI</span>
            </div>
          </div>
        </div>
      </div>

      {/* Inject animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0) scale(1);
          }
        }
        @keyframes slideRight {
          from { transform: translateX(-4px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </>,
    document.body
  );
};

export default CommandPalette;
