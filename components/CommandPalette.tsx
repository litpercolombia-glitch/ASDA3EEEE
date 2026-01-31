// components/CommandPalette.tsx
// Command Palette estilo Linear - Implementación manual sin cmdk

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Search,
  Plus,
  FileSpreadsheet,
  BarChart3,
  Home,
  Package,
  MapPin,
  ArrowRight,
  Clock,
  Command,
  CornerDownLeft,
} from 'lucide-react';

// ============================================
// TIPOS
// ============================================

interface CommandItem {
  id: string;
  icon: React.ElementType;
  label: string;
  shortcut?: string;
  section: 'actions' | 'goto' | 'recent';
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNewGuide: () => void;
  onUploadExcel: () => void;
  onGenerateReport: () => void;
  onNavigate: (section: string) => void;
  recentGuides?: { id: string; label: string }[];
}

// ============================================
// HOOK PARA KEYBOARD SHORTCUTS
// ============================================

export function useCommandPalette(onOpen: () => void) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onOpen();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onOpen]);
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export function CommandPalette({
  isOpen,
  onClose,
  onNewGuide,
  onUploadExcel,
  onGenerateReport,
  onNavigate,
  recentGuides = [],
}: CommandPaletteProps) {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Definir comandos
  const commands: CommandItem[] = useMemo(() => [
    // Acciones
    {
      id: 'new-guide',
      icon: Plus,
      label: 'Nueva guía',
      section: 'actions',
      action: () => { onNewGuide(); onClose(); },
    },
    {
      id: 'upload-excel',
      icon: FileSpreadsheet,
      label: 'Cargar Excel',
      section: 'actions',
      action: () => { onUploadExcel(); onClose(); },
    },
    {
      id: 'generate-report',
      icon: BarChart3,
      label: 'Generar reporte',
      section: 'actions',
      action: () => { onGenerateReport(); onClose(); },
    },
    // Ir a
    {
      id: 'goto-home',
      icon: Home,
      label: 'Inicio',
      shortcut: 'G H',
      section: 'goto',
      action: () => { onNavigate('inicio'); onClose(); },
    },
    {
      id: 'goto-envios',
      icon: Package,
      label: 'Envíos',
      shortcut: 'G E',
      section: 'goto',
      action: () => { onNavigate('envios'); onClose(); },
    },
    {
      id: 'goto-tracking',
      icon: MapPin,
      label: 'Tracking',
      shortcut: 'G T',
      section: 'goto',
      action: () => { onNavigate('tracking'); onClose(); },
    },
    // Guías recientes
    ...recentGuides.slice(0, 5).map(guide => ({
      id: `recent-${guide.id}`,
      icon: Clock,
      label: guide.label,
      section: 'recent' as const,
      action: () => { onNavigate(`tracking?id=${guide.id}`); onClose(); },
    })),
  ], [onNewGuide, onUploadExcel, onGenerateReport, onNavigate, onClose, recentGuides]);

  // Filtrar comandos por búsqueda
  const filteredCommands = useMemo(() => {
    if (!search.trim()) return commands;
    const searchLower = search.toLowerCase();
    return commands.filter(cmd =>
      cmd.label.toLowerCase().includes(searchLower)
    );
  }, [commands, search]);

  // Agrupar por sección
  const groupedCommands = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {
      actions: [],
      goto: [],
      recent: [],
    };
    filteredCommands.forEach(cmd => {
      groups[cmd.section].push(cmd);
    });
    return groups;
  }, [filteredCommands]);

  // Reset cuando se abre
  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, filteredCommands.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  }, [filteredCommands, selectedIndex, onClose]);

  // Reset selected index when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  // Scroll selected item into view
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const selected = list.querySelector('[data-selected="true"]');
    selected?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  if (!isOpen) return null;

  let flatIndex = -1;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-xl bg-[#1a1a1f] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Search Input */}
        <div className="flex items-center gap-3 p-4 border-b border-white/5">
          <Search className="w-5 h-5 text-white/30" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar guía, cliente o comando..."
            className="flex-1 bg-transparent text-white text-sm placeholder-white/30 outline-none"
          />
          <kbd className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px] text-white/30 font-mono">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-80 overflow-y-auto p-2">
          {filteredCommands.length === 0 ? (
            <div className="p-8 text-center text-white/30 text-sm">
              No se encontraron resultados
            </div>
          ) : (
            <>
              {/* Acciones */}
              {groupedCommands.actions.length > 0 && (
                <div className="mb-2">
                  <p className="px-3 py-2 text-[10px] font-semibold text-white/30 uppercase tracking-wider">
                    Acciones
                  </p>
                  {groupedCommands.actions.map((cmd) => {
                    flatIndex++;
                    const isSelected = flatIndex === selectedIndex;
                    return (
                      <CommandItemButton
                        key={cmd.id}
                        icon={cmd.icon}
                        label={cmd.label}
                        shortcut={cmd.shortcut}
                        isSelected={isSelected}
                        onClick={cmd.action}
                      />
                    );
                  })}
                </div>
              )}

              {/* Ir a */}
              {groupedCommands.goto.length > 0 && (
                <div className="mb-2">
                  <p className="px-3 py-2 text-[10px] font-semibold text-white/30 uppercase tracking-wider">
                    Ir a
                  </p>
                  {groupedCommands.goto.map((cmd) => {
                    flatIndex++;
                    const isSelected = flatIndex === selectedIndex;
                    return (
                      <CommandItemButton
                        key={cmd.id}
                        icon={cmd.icon}
                        label={cmd.label}
                        shortcut={cmd.shortcut}
                        isSelected={isSelected}
                        onClick={cmd.action}
                      />
                    );
                  })}
                </div>
              )}

              {/* Guías recientes */}
              {groupedCommands.recent.length > 0 && (
                <div className="mb-2">
                  <p className="px-3 py-2 text-[10px] font-semibold text-white/30 uppercase tracking-wider">
                    Guías recientes
                  </p>
                  {groupedCommands.recent.map((cmd) => {
                    flatIndex++;
                    const isSelected = flatIndex === selectedIndex;
                    return (
                      <CommandItemButton
                        key={cmd.id}
                        icon={cmd.icon}
                        label={cmd.label}
                        shortcut={cmd.shortcut}
                        isSelected={isSelected}
                        onClick={cmd.action}
                      />
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer hints */}
        <div className="flex items-center gap-4 px-4 py-3 border-t border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-1.5 text-[10px] text-white/30">
            <kbd className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded font-mono">↑</kbd>
            <kbd className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded font-mono">↓</kbd>
            <span>Navegar</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-white/30">
            <CornerDownLeft className="w-3 h-3" />
            <span>Seleccionar</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-white/30">
            <Command className="w-3 h-3" />
            <span>K para buscar</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// COMMAND ITEM BUTTON
// ============================================

function CommandItemButton({
  icon: Icon,
  label,
  shortcut,
  isSelected,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  shortcut?: string;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      data-selected={isSelected}
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
        transition-colors
        ${isSelected
          ? 'bg-[#FF6B35]/10 text-white'
          : 'text-white/60 hover:text-white hover:bg-white/5'
        }
      `}
    >
      <Icon className={`w-4 h-4 ${isSelected ? 'text-[#FF6B35]' : 'text-white/40'}`} />
      <span className="flex-1 text-left">{label}</span>
      {shortcut && (
        <kbd className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-[10px] text-white/30 font-mono">
          {shortcut}
        </kbd>
      )}
      {isSelected && <ArrowRight className="w-4 h-4 text-[#FF6B35]" />}
    </button>
  );
}

export default CommandPalette;
