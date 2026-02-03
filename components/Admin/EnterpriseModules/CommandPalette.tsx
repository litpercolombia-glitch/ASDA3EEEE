// ============================================
// LITPER ENTERPRISE - COMMAND PALETTE
// Búsqueda global estilo Linear (Ctrl+K)
// ============================================

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Search,
  Command,
  FileText,
  Users,
  DollarSign,
  Settings,
  BarChart3,
  Bell,
  Shield,
  Zap,
  Building2,
  Receipt,
  Calculator,
  Wallet,
  ArrowRight,
  Clock,
  Star,
  Keyboard,
  X,
  Plus,
  Eye,
  Download,
  Upload,
  Workflow,
  Globe,
  Link,
} from 'lucide-react';

// ============================================
// TIPOS
// ============================================

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  category: 'navigation' | 'action' | 'search' | 'recent';
  action: () => void;
  shortcut?: string;
  keywords?: string[];
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string) => void;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Cargar búsquedas recientes
  useEffect(() => {
    const saved = localStorage.getItem('enterprise_recent_searches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Focus input cuando se abre
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Guardar búsqueda reciente
  const saveRecentSearch = (search: string) => {
    if (!search.trim()) return;
    const updated = [search, ...recentSearches.filter(s => s !== search)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('enterprise_recent_searches', JSON.stringify(updated));
  };

  // Comandos disponibles
  const commands: CommandItem[] = useMemo(() => [
    // Navegación
    {
      id: 'nav-command-center',
      title: 'Ir a Command Center',
      subtitle: 'Dashboard ejecutivo',
      icon: BarChart3,
      category: 'navigation',
      action: () => { onNavigate('command-center'); onClose(); },
      shortcut: 'G C',
      keywords: ['dashboard', 'inicio', 'home', 'principal'],
    },
    {
      id: 'nav-finanzas',
      title: 'Ir a Finanzas PRO',
      subtitle: 'Facturación, gastos, nómina',
      icon: Wallet,
      category: 'navigation',
      action: () => { onNavigate('finanzas'); onClose(); },
      shortcut: 'G F',
      keywords: ['dinero', 'facturas', 'gastos', 'nomina', 'p&l'],
    },
    {
      id: 'nav-integraciones',
      title: 'Ir a Integraciones',
      subtitle: 'APIs, webhooks, conexiones',
      icon: Link,
      category: 'navigation',
      action: () => { onNavigate('integraciones'); onClose(); },
      shortcut: 'G I',
      keywords: ['api', 'webhook', 'mcp', 'conexion'],
    },
    {
      id: 'nav-alertas',
      title: 'Ir a Alertas',
      subtitle: 'Centro de notificaciones',
      icon: Bell,
      category: 'navigation',
      action: () => { onNavigate('alertas'); onClose(); },
      shortcut: 'G A',
      keywords: ['notificaciones', 'avisos', 'alarmas'],
    },
    {
      id: 'nav-seguridad',
      title: 'Ir a Seguridad',
      subtitle: 'Usuarios, roles, 2FA',
      icon: Shield,
      category: 'navigation',
      action: () => { onNavigate('security'); onClose(); },
      shortcut: 'G S',
      keywords: ['usuarios', 'roles', 'permisos', '2fa', 'autenticacion'],
    },
    {
      id: 'nav-activity',
      title: 'Ir a Activity Log',
      subtitle: 'Timeline de acciones',
      icon: Clock,
      category: 'navigation',
      action: () => { onNavigate('activity'); onClose(); },
      shortcut: 'G L',
      keywords: ['historial', 'logs', 'timeline', 'actividad'],
    },
    {
      id: 'nav-webhooks',
      title: 'Ir a Webhooks Center',
      subtitle: 'Logs y configuración',
      icon: Globe,
      category: 'navigation',
      action: () => { onNavigate('webhooks'); onClose(); },
      shortcut: 'G W',
      keywords: ['webhook', 'endpoint', 'logs'],
    },
    {
      id: 'nav-dashboards',
      title: 'Ir a Dashboard Builder',
      subtitle: 'Widgets personalizados',
      icon: BarChart3,
      category: 'navigation',
      action: () => { onNavigate('dashboard-builder'); onClose(); },
      shortcut: 'G D',
      keywords: ['widgets', 'graficos', 'personalizar'],
    },
    {
      id: 'nav-sla',
      title: 'Ir a SLA Monitor',
      subtitle: 'Alertas de cumplimiento',
      icon: Zap,
      category: 'navigation',
      action: () => { onNavigate('sla'); onClose(); },
      shortcut: 'G M',
      keywords: ['sla', 'cumplimiento', 'deadline'],
    },
    {
      id: 'nav-billing',
      title: 'Ir a Billing Center',
      subtitle: 'Facturación por empresa',
      icon: DollarSign,
      category: 'navigation',
      action: () => { onNavigate('billing'); onClose(); },
      shortcut: 'G B',
      keywords: ['billing', 'cobros', 'planes', 'suscripcion'],
    },
    {
      id: 'nav-empresas',
      title: 'Ir a Multi-Empresa',
      subtitle: 'Gestión de empresas',
      icon: Building2,
      category: 'navigation',
      action: () => { onNavigate('empresas'); onClose(); },
      shortcut: 'G E',
      keywords: ['empresa', 'organizacion', 'tenant'],
    },
    {
      id: 'nav-automation',
      title: 'Ir a Automatización',
      subtitle: 'Workflows y reglas',
      icon: Workflow,
      category: 'navigation',
      action: () => { onNavigate('automation'); onClose(); },
      shortcut: 'G U',
      keywords: ['workflow', 'automatico', 'reglas'],
    },

    // Acciones rápidas
    {
      id: 'action-nueva-factura',
      title: 'Nueva Factura',
      subtitle: 'Crear factura rápidamente',
      icon: Plus,
      category: 'action',
      action: () => { onNavigate('finanzas'); onClose(); },
      shortcut: 'N F',
      keywords: ['factura', 'crear', 'nuevo'],
    },
    {
      id: 'action-nuevo-gasto',
      title: 'Registrar Gasto',
      subtitle: 'Agregar nuevo gasto',
      icon: Receipt,
      category: 'action',
      action: () => { onNavigate('finanzas'); onClose(); },
      shortcut: 'N G',
      keywords: ['gasto', 'expense', 'registrar'],
    },
    {
      id: 'action-ver-pyl',
      title: 'Ver P&L',
      subtitle: 'Estado de resultados',
      icon: BarChart3,
      category: 'action',
      action: () => { onNavigate('finanzas'); onClose(); },
      shortcut: 'V P',
      keywords: ['pyl', 'perdidas', 'ganancias', 'resultados'],
    },
    {
      id: 'action-importar-excel',
      title: 'Importar Excel',
      subtitle: 'Cargar datos desde archivo',
      icon: Upload,
      category: 'action',
      action: () => { onNavigate('finanzas'); onClose(); },
      shortcut: 'I E',
      keywords: ['importar', 'excel', 'csv', 'archivo'],
    },
    {
      id: 'action-calcular-nomina',
      title: 'Calcular Nómina',
      subtitle: 'Procesar nómina del mes',
      icon: Calculator,
      category: 'action',
      action: () => { onNavigate('finanzas'); onClose(); },
      shortcut: 'C N',
      keywords: ['nomina', 'empleados', 'salario'],
    },
    {
      id: 'action-nuevo-empleado',
      title: 'Agregar Empleado',
      subtitle: 'Registrar nuevo empleado',
      icon: Users,
      category: 'action',
      action: () => { onNavigate('finanzas'); onClose(); },
      shortcut: 'N E',
      keywords: ['empleado', 'personal', 'contratar'],
    },
    {
      id: 'action-exportar-reporte',
      title: 'Exportar Reporte',
      subtitle: 'Descargar en Excel',
      icon: Download,
      category: 'action',
      action: () => { onNavigate('finanzas'); onClose(); },
      shortcut: 'E R',
      keywords: ['exportar', 'descargar', 'excel', 'reporte'],
    },
    {
      id: 'action-configuracion',
      title: 'Configuración',
      subtitle: 'Ajustes del sistema',
      icon: Settings,
      category: 'action',
      action: () => { onNavigate('security'); onClose(); },
      shortcut: ',',
      keywords: ['config', 'ajustes', 'settings'],
    },
  ], [onNavigate, onClose]);

  // Filtrar comandos
  const filteredCommands = useMemo(() => {
    if (!query.trim()) {
      // Mostrar recientes + navegación
      const recent: CommandItem[] = recentSearches.slice(0, 3).map((search, idx) => ({
        id: `recent-${idx}`,
        title: search,
        icon: Clock,
        category: 'recent' as const,
        action: () => setQuery(search),
      }));
      return [...recent, ...commands.filter(c => c.category === 'navigation').slice(0, 8)];
    }

    const lowerQuery = query.toLowerCase();
    return commands.filter(cmd => {
      const matchTitle = cmd.title.toLowerCase().includes(lowerQuery);
      const matchSubtitle = cmd.subtitle?.toLowerCase().includes(lowerQuery);
      const matchKeywords = cmd.keywords?.some(k => k.includes(lowerQuery));
      return matchTitle || matchSubtitle || matchKeywords;
    });
  }, [query, commands, recentSearches]);

  // Navegación con teclado
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          saveRecentSearch(query);
          filteredCommands[selectedIndex].action();
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  }, [filteredCommands, selectedIndex, query, onClose]);

  // Scroll al item seleccionado
  useEffect(() => {
    const item = listRef.current?.children[selectedIndex] as HTMLElement;
    item?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  // Reset selection on query change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-slate-900 rounded-2xl shadow-2xl border border-slate-700/50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-700/50">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar comandos, acciones, módulos..."
            className="flex-1 bg-transparent text-white text-lg placeholder-slate-500 outline-none"
          />
          <div className="flex items-center gap-1 px-2 py-1 bg-slate-800 rounded-lg">
            <span className="text-xs text-slate-400">ESC</span>
          </div>
        </div>

        {/* Results */}
        <div
          ref={listRef}
          className="max-h-[400px] overflow-y-auto py-2"
        >
          {filteredCommands.length === 0 ? (
            <div className="py-12 text-center">
              <Search className="w-12 h-12 mx-auto text-slate-600 mb-3" />
              <p className="text-slate-400">No se encontraron resultados</p>
              <p className="text-sm text-slate-500 mt-1">Intenta con otra búsqueda</p>
            </div>
          ) : (
            <>
              {/* Group by category */}
              {query === '' && recentSearches.length > 0 && (
                <div className="px-3 py-2">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Recientes
                  </p>
                </div>
              )}

              {filteredCommands.map((cmd, idx) => {
                const Icon = cmd.icon;
                const isSelected = idx === selectedIndex;

                // Category header
                const showCategoryHeader =
                  query === '' &&
                  cmd.category === 'navigation' &&
                  (idx === 0 || filteredCommands[idx - 1]?.category === 'recent');

                return (
                  <React.Fragment key={cmd.id}>
                    {showCategoryHeader && (
                      <div className="px-3 py-2 mt-2">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Navegación
                        </p>
                      </div>
                    )}
                    <button
                      onClick={() => {
                        saveRecentSearch(query);
                        cmd.action();
                      }}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full flex items-center gap-3 px-4 py-3 transition-all ${
                        isSelected
                          ? 'bg-amber-500/20 text-white'
                          : 'text-slate-300 hover:bg-slate-800/50'
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${
                        isSelected
                          ? 'bg-amber-500/30'
                          : 'bg-slate-800'
                      }`}>
                        <Icon className={`w-4 h-4 ${
                          isSelected ? 'text-amber-400' : 'text-slate-400'
                        }`} />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium">{cmd.title}</p>
                        {cmd.subtitle && (
                          <p className="text-sm text-slate-500">{cmd.subtitle}</p>
                        )}
                      </div>
                      {cmd.shortcut && (
                        <div className="flex items-center gap-1">
                          {cmd.shortcut.split(' ').map((key, i) => (
                            <kbd
                              key={i}
                              className="px-2 py-0.5 bg-slate-800 rounded text-xs text-slate-400 font-mono"
                            >
                              {key}
                            </kbd>
                          ))}
                        </div>
                      )}
                      {isSelected && (
                        <ArrowRight className="w-4 h-4 text-amber-400" />
                      )}
                    </button>
                  </React.Fragment>
                );
              })}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-700/50 bg-slate-800/50 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-700 rounded">↑↓</kbd>
              Navegar
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-700 rounded">Enter</kbd>
              Seleccionar
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-700 rounded">Esc</kbd>
              Cerrar
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Command className="w-3 h-3" />
            <span>LITPER Enterprise</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
