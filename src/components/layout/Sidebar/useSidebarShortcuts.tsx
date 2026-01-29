/**
 * useSidebarShortcuts - LITPER PRO
 *
 * Hook para atajos de teclado del sidebar
 * Inspirado en Linear, Notion y VS Code
 */

import React, { useEffect, useCallback } from 'react';
import { useSidebarStore } from '../../../../stores/sidebarStore';

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description?: string;
}

interface UseSidebarShortcutsOptions {
  enabled?: boolean;
  onNavigate?: (path: string) => void;
  customShortcuts?: ShortcutConfig[];
}

export const useSidebarShortcuts = (options: UseSidebarShortcutsOptions = {}) => {
  const { enabled = true, onNavigate, customShortcuts = [] } = options;

  const {
    toggleCollapsed,
    toggleCommandPalette,
    isCommandPaletteOpen,
    setActiveItem,
    expandAllSections,
    collapseAllSections,
  } = useSidebarStore();

  // Navigation handler
  const navigate = useCallback(
    (itemId: string, path: string) => {
      setActiveItem(itemId);
      onNavigate?.(path);
    },
    [setActiveItem, onNavigate]
  );

  // Default shortcuts
  const defaultShortcuts: ShortcutConfig[] = [
    // Command Palette
    {
      key: 'k',
      meta: true,
      action: toggleCommandPalette,
      description: 'Abrir búsqueda',
    },
    {
      key: 'k',
      ctrl: true,
      action: toggleCommandPalette,
      description: 'Abrir búsqueda (Windows)',
    },

    // Toggle sidebar
    {
      key: '[',
      action: toggleCollapsed,
      description: 'Colapsar/expandir sidebar',
    },

    // Expand/collapse all sections
    {
      key: 'e',
      alt: true,
      action: expandAllSections,
      description: 'Expandir todas las secciones',
    },
    {
      key: 'c',
      alt: true,
      action: collapseAllSections,
      description: 'Colapsar todas las secciones',
    },

    // Quick navigation
    {
      key: 'h',
      meta: true,
      action: () => navigate('home', '/'),
      description: 'Ir a Inicio',
    },
    {
      key: 'g',
      meta: true,
      shift: true,
      action: () => navigate('chat', '/chat'),
      description: 'Ir a Chat IA',
    },
    {
      key: 'd',
      meta: true,
      shift: true,
      action: () => navigate('dashboard', '/dashboard'),
      description: 'Ir a Dashboard',
    },
    {
      key: 'p',
      meta: true,
      shift: true,
      action: () => navigate('pedidos', '/pedidos'),
      description: 'Ir a Pedidos',
    },
    {
      key: ',',
      meta: true,
      action: () => navigate('configuracion', '/configuracion'),
      description: 'Ir a Configuración',
    },

    // Number shortcuts for sections (1-5)
    {
      key: '1',
      alt: true,
      action: () => navigate('home', '/'),
      description: 'Ir a Principal',
    },
    {
      key: '2',
      alt: true,
      action: () => navigate('tracking', '/tracking'),
      description: 'Ir a Logística',
    },
    {
      key: '3',
      alt: true,
      action: () => navigate('facturacion', '/facturacion'),
      description: 'Ir a Finanzas',
    },
    {
      key: '4',
      alt: true,
      action: () => navigate('clientes', '/clientes'),
      description: 'Ir a CRM',
    },
    {
      key: '5',
      alt: true,
      action: () => navigate('usuarios', '/usuarios'),
      description: 'Ir a Configuración',
    },
  ];

  // Combine default and custom shortcuts
  const allShortcuts = [...defaultShortcuts, ...customShortcuts];

  // Keyboard event handler
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Allow Cmd+K even in inputs
        if (!(e.key === 'k' && (e.metaKey || e.ctrlKey))) {
          return;
        }
      }

      // Skip if command palette is open (it handles its own keys)
      if (isCommandPaletteOpen && e.key !== 'k') {
        return;
      }

      // Find matching shortcut
      const shortcut = allShortcuts.find((s) => {
        if (s.key.toLowerCase() !== e.key.toLowerCase()) return false;
        if (s.meta && !e.metaKey) return false;
        if (s.ctrl && !e.ctrlKey) return false;
        if (s.shift && !e.shiftKey) return false;
        if (s.alt && !e.altKey) return false;

        // Make sure we're not requiring a modifier that wasn't pressed
        if (!s.meta && !s.ctrl && !s.shift && !s.alt) {
          // No modifiers required, but make sure none are pressed
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false;
        }

        return true;
      });

      if (shortcut) {
        e.preventDefault();
        e.stopPropagation();
        shortcut.action();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, allShortcuts, isCommandPaletteOpen]);

  // Return shortcuts for documentation/help
  return {
    shortcuts: allShortcuts.map((s) => ({
      key: formatShortcut(s),
      description: s.description || '',
    })),
  };
};

// Format shortcut for display
const formatShortcut = (config: ShortcutConfig): string => {
  const parts: string[] = [];

  if (config.meta) {
    parts.push(navigator.platform.includes('Mac') ? '⌘' : 'Ctrl');
  }
  if (config.ctrl && !config.meta) {
    parts.push('Ctrl');
  }
  if (config.alt) {
    parts.push(navigator.platform.includes('Mac') ? '⌥' : 'Alt');
  }
  if (config.shift) {
    parts.push('⇧');
  }

  parts.push(config.key.toUpperCase());

  return parts.join(' + ');
};

// Shortcut display component
interface ShortcutBadgeProps {
  shortcut: string;
  className?: string;
}

export const ShortcutBadge: React.FC<ShortcutBadgeProps> = ({
  shortcut,
  className = '',
}) => {
  const keys = shortcut.split(' + ');

  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`}>
      {keys.map((key, index) => (
        <kbd
          key={index}
          className="
            px-1.5 py-0.5 text-[10px] font-mono
            bg-slate-800 border border-slate-700
            rounded text-slate-400
          "
        >
          {key}
        </kbd>
      ))}
    </span>
  );
};

// Hook for showing shortcuts help
export const useSidebarShortcutsHelp = () => {
  const { shortcuts } = useSidebarShortcuts({ enabled: false });

  const groupedShortcuts = {
    navigation: shortcuts.filter((s) =>
      s.description?.toLowerCase().includes('ir a')
    ),
    actions: shortcuts.filter(
      (s) =>
        !s.description?.toLowerCase().includes('ir a') &&
        s.description
    ),
  };

  return groupedShortcuts;
};

export default useSidebarShortcuts;