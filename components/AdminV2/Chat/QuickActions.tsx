/**
 * QuickActions - Acciones rapidas sugeridas
 * Grid responsive de acciones comunes
 */

import React, { useState } from 'react';
import {
  Package,
  FileText,
  TrendingUp,
  MapPin,
  AlertTriangle,
  DollarSign,
  BarChart3,
  Bell,
  Zap,
  Clock,
} from 'lucide-react';
import { colors, radius, shadows, transitions } from '../../../styles/theme';

// ============================================
// TYPES
// ============================================

interface QuickAction {
  id: string;
  icon: React.ElementType;
  label: string;
  description: string;
  example: string;
  color: string;
  category: string;
}

interface QuickActionsProps {
  onActionClick: (example: string) => void;
  compact?: boolean;
}

// ============================================
// DATA
// ============================================

const quickActions: QuickAction[] = [
  {
    id: 'track',
    icon: Package,
    label: 'Rastrear Envio',
    description: 'Rastrea una guia por su numero',
    example: 'Rastrear guia WDG123456',
    color: colors.skills.logistics.icon,
    category: 'logistics',
  },
  {
    id: 'report',
    icon: FileText,
    label: 'Generar Reporte',
    description: 'Reporte de entregas del dia',
    example: 'Genera el reporte de entregas de hoy',
    color: colors.success.default,
    category: 'analytics',
  },
  {
    id: 'cities',
    icon: MapPin,
    label: 'Analizar Ciudades',
    description: 'Estadisticas por ciudad',
    example: 'Cuales son las ciudades con mas problemas?',
    color: colors.warning.default,
    category: 'analytics',
  },
  {
    id: 'carriers',
    icon: TrendingUp,
    label: 'Transportadoras',
    description: 'Rendimiento de carriers',
    example: 'Analiza el rendimiento de las transportadoras',
    color: colors.brand.primary,
    category: 'logistics',
  },
  {
    id: 'problems',
    icon: AlertTriangle,
    label: 'Detectar Problemas',
    description: 'Guias con novedades',
    example: 'Cuales guias tienen problemas o novedades?',
    color: colors.error.default,
    category: 'logistics',
  },
  {
    id: 'profit',
    icon: DollarSign,
    label: 'Ganancias',
    description: 'Reporte de rentabilidad',
    example: 'Cual es mi ganancia del mes?',
    color: colors.skills.finance.icon,
    category: 'finance',
  },
  {
    id: 'dashboard',
    icon: BarChart3,
    label: 'Dashboard',
    description: 'Resumen general',
    example: 'Dame un resumen del estado actual',
    color: colors.brand.secondary,
    category: 'analytics',
  },
  {
    id: 'alerts',
    icon: Bell,
    label: 'Alertas',
    description: 'Notificaciones pendientes',
    example: 'Hay alertas importantes pendientes?',
    color: colors.skills.communication.icon,
    category: 'communication',
  },
];

// ============================================
// COMPONENT
// ============================================

export const QuickActions: React.FC<QuickActionsProps> = ({
  onActionClick,
  compact = false,
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Styles
  const containerStyles: React.CSSProperties = {
    padding: '1rem',
  };

  const headerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '1rem',
    fontSize: '0.875rem',
    fontWeight: 500,
    color: colors.text.secondary,
  };

  const gridStyles: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: compact
      ? 'repeat(auto-fill, minmax(140px, 1fr))'
      : 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '0.75rem',
  };

  const cardStyles = (action: QuickAction, isHovered: boolean): React.CSSProperties => ({
    display: 'flex',
    flexDirection: compact ? 'row' : 'column',
    alignItems: compact ? 'center' : 'flex-start',
    gap: compact ? '0.75rem' : '0.5rem',
    padding: compact ? '0.75rem' : '1rem',
    backgroundColor: isHovered ? colors.bg.hover : colors.bg.tertiary,
    border: `1px solid ${isHovered ? action.color + '40' : colors.border.light}`,
    borderRadius: radius.xl,
    cursor: 'pointer',
    transition: `all ${transitions.normal}`,
    transform: isHovered ? 'translateY(-2px)' : 'none',
    boxShadow: isHovered ? shadows.md : 'none',
  });

  const iconContainerStyles = (action: QuickAction): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: compact ? '2rem' : '2.5rem',
    height: compact ? '2rem' : '2.5rem',
    borderRadius: radius.lg,
    backgroundColor: action.color + '15',
    color: action.color,
    flexShrink: 0,
  });

  const textContainerStyles: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
  };

  const labelStyles: React.CSSProperties = {
    fontSize: compact ? '0.8125rem' : '0.875rem',
    fontWeight: 600,
    color: colors.text.primary,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  };

  const descriptionStyles: React.CSSProperties = {
    fontSize: '0.75rem',
    color: colors.text.tertiary,
    marginTop: '0.25rem',
    display: compact ? 'none' : 'block',
  };

  return (
    <div style={containerStyles}>
      <div style={headerStyles}>
        <Zap size={16} style={{ color: colors.brand.primary }} />
        <span>Acciones rapidas</span>
      </div>

      <div style={gridStyles}>
        {quickActions.map((action) => {
          const Icon = action.icon;
          const isHovered = hoveredId === action.id;

          return (
            <div
              key={action.id}
              style={cardStyles(action, isHovered)}
              onClick={() => onActionClick(action.example)}
              onMouseEnter={() => setHoveredId(action.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <div style={iconContainerStyles(action)}>
                <Icon size={compact ? 16 : 20} />
              </div>
              <div style={textContainerStyles}>
                <div style={labelStyles}>{action.label}</div>
                <div style={descriptionStyles}>{action.description}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============================================
// HORIZONTAL SCROLL VERSION (for mobile)
// ============================================

export const QuickActionsHorizontal: React.FC<QuickActionsProps> = ({
  onActionClick,
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const containerStyles: React.CSSProperties = {
    padding: '0.75rem 1rem',
    overflowX: 'auto',
    WebkitOverflowScrolling: 'touch',
    scrollbarWidth: 'none',
  };

  const scrollStyles: React.CSSProperties = {
    display: 'flex',
    gap: '0.5rem',
  };

  const chipStyles = (action: QuickAction, isHovered: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 0.875rem',
    backgroundColor: isHovered ? colors.bg.hover : colors.bg.tertiary,
    border: `1px solid ${isHovered ? action.color + '40' : colors.border.light}`,
    borderRadius: radius.full,
    cursor: 'pointer',
    transition: `all ${transitions.fast}`,
    whiteSpace: 'nowrap',
    flexShrink: 0,
  });

  return (
    <div style={containerStyles}>
      <div style={scrollStyles}>
        {quickActions.slice(0, 6).map((action) => {
          const Icon = action.icon;
          const isHovered = hoveredId === action.id;

          return (
            <div
              key={action.id}
              style={chipStyles(action, isHovered)}
              onClick={() => onActionClick(action.example)}
              onMouseEnter={() => setHoveredId(action.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <Icon size={14} style={{ color: action.color }} />
              <span
                style={{
                  fontSize: '0.8125rem',
                  color: isHovered ? colors.text.primary : colors.text.secondary,
                }}
              >
                {action.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default QuickActions;
