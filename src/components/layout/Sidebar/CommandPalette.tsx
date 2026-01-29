/**
 * CommandPalette - LITPER PRO
 *
 * Modal de búsqueda y comandos rápidos (Cmd+K)
 * Inspirado en Linear, Raycast y VS Code
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
  Star,
  Clock,
  Hash,
  Sparkles,
  Zap,
  Globe,
  Mail,
  Bell,
  Plus,
  X,
} from 'lucide-react';
import { useSidebarStore } from '../../../../stores/sidebarStore';

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  category: string;
  keywords?: string[];
  shortcut?: string;
  action?: () => void;
  path?: string;
}

interface CommandPaletteProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSelect?: (item: CommandItem) => void;
  customCommands?: CommandItem[];
}

// Default navigation commands
const defaultCommands: CommandItem[] = [
  // Principal
  { id: 'home', label: 'Inicio', icon: <Home className="w-4 h-4" />, category: 'Principal', path: '/', keywords: ['dashboard', 'home', 'inicio'] },
  { id: 'chat', label: 'Chat IA', icon: <MessageSquare className="w-4 h-4" />, category: 'Principal', path: '/chat', keywords: ['ai', 'asistente', 'chatbot'], shortcut: 'C' },
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" />, category: 'Principal', path: '/dashboard', keywords: ['panel', 'metricas'] },
  { id: 'pedidos', label: 'Pedidos', icon: <Package className="w-4 h-4" />, category: 'Principal', path: '/pedidos', keywords: ['orders', 'envios'] },

  // Logística
  { id: 'tracking', label: 'Tracking', icon: <Truck className="w-4 h-4" />, category: 'Logística', path: '/tracking', keywords: ['rastreo', 'seguimiento'] },
  { id: 'rutas', label: 'Rutas', icon: <Route className="w-4 h-4" />, category: 'Logística', path: '/rutas', keywords: ['routes', 'optimizar'] },
  { id: 'almacenes', label: 'Almacenes', icon: <Warehouse className="w-4 h-4" />, category: 'Logística', path: '/almacenes', keywords: ['warehouse', 'inventario'] },
  { id: 'transportadoras', label: 'Transportadoras', icon: <Globe className="w-4 h-4" />, category: 'Logística', path: '/transportadoras', keywords: ['carriers', 'envios'] },

  // Finanzas
  { id: 'facturacion', label: 'Facturación', icon: <FileText className="w-4 h-4" />, category: 'Finanzas', path: '/facturacion', keywords: ['invoices', 'facturas', 'dian'] },
  { id: 'cobros', label: 'Cobros', icon: <DollarSign className="w-4 h-4" />, category: 'Finanzas', path: '/cobros', keywords: ['payments', 'pagos'] },
  { id: 'reportes', label: 'Reportes', icon: <BarChart3 className="w-4 h-4" />, category: 'Finanzas', path: '/reportes', keywords: ['reports', 'analytics'] },

  // CRM
  { id: 'clientes', label: 'Clientes', icon: <Users className="w-4 h-4" />, category: 'CRM', path: '/clientes', keywords: ['customers', 'contacts'] },
  { id: 'productos', label: 'Productos', icon: <ShoppingCart className="w-4 h-4" />, category: 'CRM', path: '/productos', keywords: ['catalog', 'catalogo'] },
  { id: 'campanas', label: 'Campañas', icon: <Megaphone className="w-4 h-4" />, category: 'CRM', path: '/campanas', keywords: ['marketing', 'email'] },

  // Configuración
  { id: 'usuarios', label: 'Usuarios', icon: <UserCog className="w-4 h-4" />, category: 'Configuración', path: '/usuarios', keywords: ['users', 'team', 'equipo'] },
  { id: 'integraciones', label: 'Integraciones', icon: <Puzzle className="w-4 h-4" />, category: 'Configuración', path: '/integraciones', keywords: ['api', 'shopify', 'woocommerce'] },
  { id: 'personalizar', label: 'Personalizar', icon: <Palette className="w-4 h-4" />, category: 'Configuración', path: '/personalizar', keywords: ['theme', 'customize'] },

  // Acciones rápidas
  { id: 'new-order', label: 'Nuevo pedido', icon: <Plus className="w-4 h-4" />, category: 'Acciones', keywords: ['crear', 'order'], shortcut: 'N' },
  { id: 'new-client', label: 'Nuevo cliente', icon: <Plus className="w-4 h-4" />, category: 'Acciones', keywords: ['crear', 'customer'] },
  { id: 'notifications', label: 'Notificaciones', icon: <Bell className="w-4 h-4" />, category: 'Acciones', keywords: ['alerts'] },
  { id: 'settings', label: 'Configuración', icon: <Settings className="w-4 h-4" />, category: 'Acciones', path: '/settings', shortcut: ',' },
];

// Fuzzy search function
const fuzzySearch = (query: string, items: CommandItem[]): CommandItem[] => {
  if (!query) return items;

  const lowerQuery = query.toLowerCase();
  const queryWords = lowerQuery.split(' ').filter(Boolean);

  return items
    .map((item) => {
      const searchableText = [
        item.label,
        item.description,
        item.category,
        ...(item.keywords || []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      // Calculate match score
      let score = 0;

      // Exact match in label gets highest score
      if (item.label.toLowerCase() === lowerQuery) {
        score += 100;
      } else if (item.label.toLowerCase().startsWith(lowerQuery)) {
        score += 50;
      } else if (item.label.toLowerCase().includes(lowerQuery)) {
        score += 25;
      }

      // Check each query word
      queryWords.forEach((word) => {
        if (searchableText.includes(word)) {
          score += 10;
        }
      });

      return { item, score };
    })
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((result) => result.item);
};

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
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Combine default and custom commands
  const allCommands = useMemo(
    () => [...defaultCommands, ...customCommands],
    [customCommands]
  );

  // Filter commands based on query
  const filteredCommands = useMemo(
    () => fuzzySearch(query, allCommands),
    [query, allCommands]
  );

  // Group by category
  const groupedCommands = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};
    filteredCommands.forEach((cmd) => {
      if (!groups[cmd.category]) {
        groups[cmd.category] = [];
      }
      groups[cmd.category].push(cmd);
    });
    return groups;
  }, [filteredCommands]);

  // Flatten for keyboard navigation
  const flatCommands = useMemo(() => filteredCommands, [filteredCommands]);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((i) => Math.min(i + 1, flatCommands.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((i) => Math.max(i - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (flatCommands[selectedIndex]) {
            handleSelect(flatCommands[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, flatCommands, selectedIndex, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.querySelector('[data-selected="true"]');
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
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
        // Navigate to path
        console.log('Navigate to:', item.path);
      }
      onClose();
    },
    [onSelect, onClose]
  );

  if (!isOpen) return null;

  let currentIndex = 0;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="
          fixed z-[201]
          top-[20%] left-1/2 -translate-x-1/2
          w-full max-w-xl
          bg-slate-900 border border-slate-700
          rounded-2xl shadow-2xl
          overflow-hidden
          animate-in fade-in zoom-in-95 duration-150
        "
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800">
          <Search className="w-5 h-5 text-slate-500" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Buscar páginas, acciones..."
            className="
              flex-1 bg-transparent
              text-white text-base
              placeholder:text-slate-500
              outline-none
            "
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-500 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="px-2 py-1 text-xs font-mono bg-slate-800 rounded text-slate-400">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[400px] overflow-y-auto py-2">
          {flatCommands.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Search className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No se encontraron resultados</p>
              <p className="text-xs text-slate-600 mt-1">
                Intenta con otras palabras clave
              </p>
            </div>
          ) : (
            <>
              {/* Recent items */}
              {!query && recentItems.length > 0 && (
                <div className="mb-2">
                  <div className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    Recientes
                  </div>
                  {recentItems.slice(0, 3).map((item) => (
                    <button
                      key={`recent-${item.id}`}
                      className="
                        w-full flex items-center gap-3 px-4 py-2
                        text-sm text-slate-300 hover:text-white hover:bg-white/5
                        transition-colors duration-150
                      "
                    >
                      <Clock className="w-4 h-4 text-slate-600" />
                      <span className="flex-1 text-left truncate">{item.label}</span>
                    </button>
                  ))}
                  <div className="h-px bg-slate-800 my-2" />
                </div>
              )}

              {/* Grouped results */}
              {Object.entries(groupedCommands).map(([category, items]) => (
                <div key={category} className="mb-2">
                  <div className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    {category}
                  </div>
                  {items.map((item) => {
                    const isSelected = currentIndex === selectedIndex;
                    const itemIndex = currentIndex;
                    currentIndex++;

                    return (
                      <button
                        key={item.id}
                        data-selected={isSelected}
                        onClick={() => handleSelect(item)}
                        onMouseEnter={() => setSelectedIndex(itemIndex)}
                        className={`
                          w-full flex items-center gap-3 px-4 py-2
                          text-sm transition-colors duration-75
                          ${
                            isSelected
                              ? 'bg-blue-600/20 text-white'
                              : 'text-slate-300 hover:text-white hover:bg-white/5'
                          }
                        `}
                      >
                        <span
                          className={`
                            w-8 h-8 rounded-lg flex items-center justify-center
                            ${isSelected ? 'bg-blue-600/30 text-blue-400' : 'bg-slate-800 text-slate-400'}
                          `}
                        >
                          {item.icon}
                        </span>
                        <div className="flex-1 text-left">
                          <p className="font-medium">{item.label}</p>
                          {item.description && (
                            <p className="text-xs text-slate-500 truncate">
                              {item.description}
                            </p>
                          )}
                        </div>
                        {item.shortcut && (
                          <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-800 rounded text-slate-400">
                            {item.shortcut}
                          </kbd>
                        )}
                        {isSelected && (
                          <ArrowRight className="w-4 h-4 text-slate-500" />
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-slate-800 text-[11px] text-slate-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-slate-800 rounded">↑</kbd>
              <kbd className="px-1 py-0.5 bg-slate-800 rounded">↓</kbd>
              navegar
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-slate-800 rounded">↵</kbd>
              seleccionar
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Powered by LITPER AI</span>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};

export default CommandPalette;
