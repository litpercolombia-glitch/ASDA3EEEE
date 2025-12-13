// components/navigation/Breadcrumbs.tsx
// Sistema de Breadcrumbs estilo Amazon
import React, { useMemo } from 'react';
import {
  ChevronRight,
  Home,
  Package,
  BarChart3,
  Brain,
  Layers,
  Shield,
  Settings,
  Users,
  MapPin,
  Truck,
  TrendingUp,
  Target,
  Activity,
  Bot,
  Trophy,
  FileText,
  PieChart,
} from 'lucide-react';

// ============================================
// TYPES
// ============================================
export interface BreadcrumbItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  isActive?: boolean;
}

// ============================================
// TAB CONFIGURATION
// ============================================
const TAB_CONFIG: Record<string, { label: string; icon: React.ReactNode; parent?: string }> = {
  home: { label: 'Inicio', icon: <Home className="w-4 h-4" /> },
  operaciones: { label: 'Operaciones', icon: <Package className="w-4 h-4" /> },
  'inteligencia-ia': { label: 'Inteligencia IA', icon: <Brain className="w-4 h-4" /> },
  analisis: { label: 'Análisis', icon: <BarChart3 className="w-4 h-4" /> },
  'procesos-litper': { label: 'Procesos LITPER', icon: <Layers className="w-4 h-4" /> },
  admin: { label: 'Configuración', icon: <Settings className="w-4 h-4" /> },

  // Legacy tabs (as children)
  seguimiento: { label: 'Seguimiento', icon: <Package className="w-4 h-4" />, parent: 'operaciones' },
  semaforo: { label: 'Semáforo', icon: <Activity className="w-4 h-4" />, parent: 'operaciones' },

  demanda: { label: 'Predicción', icon: <TrendingUp className="w-4 h-4" />, parent: 'inteligencia-ia' },
  ml: { label: 'Sistema ML', icon: <Brain className="w-4 h-4" />, parent: 'inteligencia-ia' },
  asistente: { label: 'Asistente IA', icon: <Bot className="w-4 h-4" />, parent: 'inteligencia-ia' },

  predicciones: { label: 'Estadísticas', icon: <PieChart className="w-4 h-4" />, parent: 'analisis' },
  'inteligencia-logistica': { label: 'Intel. Logística', icon: <Target className="w-4 h-4" />, parent: 'analisis' },
  reporte: { label: 'Reportes', icon: <FileText className="w-4 h-4" />, parent: 'analisis' },

  gamificacion: { label: 'Logros', icon: <Trophy className="w-4 h-4" />, parent: 'home' },
  'ciudad-agentes': { label: 'Ciudad Agentes', icon: <MapPin className="w-4 h-4" />, parent: 'procesos-litper' },
};

// ============================================
// BREADCRUMBS COMPONENT
// ============================================
interface BreadcrumbsProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  className?: string;
  showIcons?: boolean;
  separator?: 'chevron' | 'slash' | 'dot';
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  currentTab,
  onNavigate,
  className = '',
  showIcons = true,
  separator = 'chevron',
}) => {
  // Build breadcrumb trail
  const breadcrumbs = useMemo<BreadcrumbItem[]>(() => {
    const items: BreadcrumbItem[] = [];

    // Always start with Home
    items.push({
      id: 'home',
      label: 'Inicio',
      icon: <Home className="w-4 h-4" />,
      onClick: () => onNavigate('home'),
    });

    if (currentTab === 'home') {
      items[0].isActive = true;
      return items;
    }

    const currentConfig = TAB_CONFIG[currentTab];
    if (!currentConfig) {
      // Unknown tab, just show home
      return items;
    }

    // Add parent if exists
    if (currentConfig.parent && currentConfig.parent !== 'home') {
      const parentConfig = TAB_CONFIG[currentConfig.parent];
      if (parentConfig) {
        items.push({
          id: currentConfig.parent,
          label: parentConfig.label,
          icon: parentConfig.icon,
          onClick: () => onNavigate(currentConfig.parent!),
        });
      }
    }

    // Add current tab
    items.push({
      id: currentTab,
      label: currentConfig.label,
      icon: currentConfig.icon,
      isActive: true,
    });

    return items;
  }, [currentTab, onNavigate]);

  const separatorIcon = useMemo(() => {
    switch (separator) {
      case 'slash':
        return <span className="text-slate-400 mx-2">/</span>;
      case 'dot':
        return <span className="w-1 h-1 bg-slate-400 rounded-full mx-2" />;
      default:
        return <ChevronRight className="w-4 h-4 text-slate-400 mx-1" />;
    }
  }, [separator]);

  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex items-center text-sm ${className}`}
    >
      <ol className="flex items-center flex-wrap gap-1">
        {breadcrumbs.map((item, index) => (
          <li key={item.id} className="flex items-center">
            {index > 0 && separatorIcon}

            {item.isActive ? (
              <span
                className="flex items-center gap-1.5 px-2 py-1 text-slate-600 dark:text-slate-300 font-medium"
                aria-current="page"
              >
                {showIcons && item.icon && (
                  <span className="text-accent-500">{item.icon}</span>
                )}
                {item.label}
              </span>
            ) : (
              <button
                onClick={item.onClick}
                className="flex items-center gap-1.5 px-2 py-1 text-slate-500 dark:text-slate-400 hover:text-accent-600 dark:hover:text-accent-400 hover:bg-slate-100 dark:hover:bg-navy-800 rounded-lg transition-colors"
              >
                {showIcons && item.icon && (
                  <span className="text-slate-400 dark:text-slate-500">{item.icon}</span>
                )}
                {item.label}
              </button>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

// ============================================
// BREADCRUMBS BAR (with additional context)
// ============================================
interface BreadcrumbsBarProps extends BreadcrumbsProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const BreadcrumbsBar: React.FC<BreadcrumbsBarProps> = ({
  currentTab,
  onNavigate,
  title,
  subtitle,
  actions,
  className = '',
  showIcons = true,
  separator = 'chevron',
}) => {
  const currentConfig = TAB_CONFIG[currentTab];

  return (
    <div className={`bg-white dark:bg-navy-900 border-b border-slate-200 dark:border-navy-800 ${className}`}>
      <div className="max-w-[1600px] mx-auto px-4 lg:px-8 py-4">
        {/* Breadcrumbs */}
        <Breadcrumbs
          currentTab={currentTab}
          onNavigate={onNavigate}
          showIcons={showIcons}
          separator={separator}
          className="mb-2"
        />

        {/* Title Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {currentConfig?.icon && (
              <div className="p-2 bg-accent-100 dark:bg-accent-900/30 rounded-xl text-accent-600 dark:text-accent-400">
                {currentConfig.icon}
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-slate-800 dark:text-white">
                {title || currentConfig?.label || currentTab}
              </h1>
              {subtitle && (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================
// COMPACT BREADCRUMBS (for mobile)
// ============================================
export const CompactBreadcrumbs: React.FC<BreadcrumbsProps> = ({
  currentTab,
  onNavigate,
  className = '',
}) => {
  const currentConfig = TAB_CONFIG[currentTab];
  const parentId = currentConfig?.parent;
  const parentConfig = parentId ? TAB_CONFIG[parentId] : null;

  if (!parentConfig || currentTab === 'home') {
    return null;
  }

  return (
    <button
      onClick={() => onNavigate(parentId!)}
      className={`flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-accent-600 dark:hover:text-accent-400 transition-colors ${className}`}
    >
      <ChevronRight className="w-4 h-4 rotate-180" />
      <span>{parentConfig.label}</span>
    </button>
  );
};

export default Breadcrumbs;
