/**
 * DashboardArtifact - Dashboard de KPIs
 * Grid de metricas con comparaciones
 */

import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Package,
  DollarSign,
  Users,
  Clock,
  Target,
  AlertTriangle,
  CheckCircle,
  LayoutDashboard,
} from 'lucide-react';
import { colors, radius, shadows, transitions } from '../../../styles/theme';

// ============================================
// TYPES
// ============================================

export interface KPIMetric {
  id: string;
  label: string;
  value: number | string;
  previousValue?: number;
  format?: 'number' | 'currency' | 'percent' | 'string';
  icon?: 'package' | 'dollar' | 'users' | 'clock' | 'target' | 'alert' | 'check';
  color?: 'default' | 'success' | 'warning' | 'error' | 'info';
  trend?: 'up' | 'down' | 'neutral';
  description?: string;
}

export interface DashboardArtifactProps {
  title?: string;
  metrics: KPIMetric[];
  columns?: 2 | 3 | 4;
  compact?: boolean;
}

// ============================================
// UTILS
// ============================================

const formatValue = (value: number | string, format?: string): string => {
  if (typeof value === 'string') return value;

  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);

    case 'percent':
      return `${value.toFixed(1)}%`;

    case 'number':
    default:
      return new Intl.NumberFormat('es-CO').format(value);
  }
};

const getPercentChange = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

const getIconComponent = (icon?: string) => {
  switch (icon) {
    case 'package':
      return Package;
    case 'dollar':
      return DollarSign;
    case 'users':
      return Users;
    case 'clock':
      return Clock;
    case 'target':
      return Target;
    case 'alert':
      return AlertTriangle;
    case 'check':
      return CheckCircle;
    default:
      return Target;
  }
};

const getColorStyles = (color?: string) => {
  switch (color) {
    case 'success':
      return {
        bg: colors.success.light,
        icon: colors.success.default,
        text: colors.success.default,
      };
    case 'warning':
      return {
        bg: colors.warning.light,
        icon: colors.warning.default,
        text: colors.warning.default,
      };
    case 'error':
      return {
        bg: colors.error.light,
        icon: colors.error.default,
        text: colors.error.default,
      };
    case 'info':
      return {
        bg: colors.info.light,
        icon: colors.info.default,
        text: colors.info.default,
      };
    default:
      return {
        bg: colors.brand.primary + '15',
        icon: colors.brand.primary,
        text: colors.brand.primary,
      };
  }
};

// ============================================
// KPI CARD
// ============================================

interface KPICardProps {
  metric: KPIMetric;
  compact?: boolean;
}

const KPICard: React.FC<KPICardProps> = ({ metric, compact }) => {
  const IconComponent = getIconComponent(metric.icon);
  const colorStyles = getColorStyles(metric.color);

  // Calculate change
  const hasChange =
    typeof metric.value === 'number' && metric.previousValue !== undefined;
  const percentChange = hasChange
    ? getPercentChange(metric.value as number, metric.previousValue!)
    : 0;
  const trend = metric.trend || (percentChange > 0 ? 'up' : percentChange < 0 ? 'down' : 'neutral');
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  // Styles
  const cardStyles: React.CSSProperties = {
    padding: compact ? '1rem' : '1.25rem',
    backgroundColor: colors.bg.tertiary,
    borderRadius: radius.xl,
    border: `1px solid ${colors.border.light}`,
    transition: `all ${transitions.normal}`,
  };

  const headerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: compact ? '0.75rem' : '1rem',
  };

  const iconContainerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: compact ? '2.5rem' : '3rem',
    height: compact ? '2.5rem' : '3rem',
    borderRadius: radius.lg,
    backgroundColor: colorStyles.bg,
  };

  const trendBadgeStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    padding: '0.25rem 0.5rem',
    borderRadius: radius.full,
    fontSize: '0.75rem',
    fontWeight: 500,
    backgroundColor:
      trend === 'up'
        ? colors.success.light
        : trend === 'down'
          ? colors.error.light
          : colors.bg.elevated,
    color:
      trend === 'up'
        ? colors.success.default
        : trend === 'down'
          ? colors.error.default
          : colors.text.tertiary,
  };

  const valueStyles: React.CSSProperties = {
    fontSize: compact ? '1.5rem' : '2rem',
    fontWeight: 700,
    color: colors.text.primary,
    lineHeight: 1.2,
  };

  const labelStyles: React.CSSProperties = {
    fontSize: compact ? '0.8125rem' : '0.875rem',
    color: colors.text.secondary,
    marginTop: '0.25rem',
  };

  const descriptionStyles: React.CSSProperties = {
    fontSize: '0.75rem',
    color: colors.text.tertiary,
    marginTop: '0.5rem',
  };

  return (
    <div
      style={cardStyles}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = colors.border.hover;
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = shadows.md;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = colors.border.light;
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={headerStyles}>
        <div style={iconContainerStyles}>
          <IconComponent size={compact ? 18 : 22} style={{ color: colorStyles.icon }} />
        </div>

        {hasChange && (
          <div style={trendBadgeStyles}>
            <TrendIcon size={12} />
            {Math.abs(percentChange).toFixed(1)}%
          </div>
        )}
      </div>

      <div style={valueStyles}>{formatValue(metric.value, metric.format)}</div>
      <div style={labelStyles}>{metric.label}</div>

      {metric.description && <div style={descriptionStyles}>{metric.description}</div>}
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export const DashboardArtifact: React.FC<DashboardArtifactProps> = ({
  title,
  metrics,
  columns = 3,
  compact = false,
}) => {
  // Styles
  const containerStyles: React.CSSProperties = {
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.xl,
    border: `1px solid ${colors.border.light}`,
    overflow: 'hidden',
  };

  const headerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '1rem',
    borderBottom: `1px solid ${colors.border.light}`,
    fontSize: '1rem',
    fontWeight: 600,
    color: colors.text.primary,
  };

  const gridStyles: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gap: compact ? '0.75rem' : '1rem',
    padding: compact ? '0.75rem' : '1rem',
  };

  // Responsive columns
  const responsiveStyles = `
    @media (max-width: 1024px) {
      .dashboard-grid {
        grid-template-columns: repeat(2, 1fr) !important;
      }
    }
    @media (max-width: 640px) {
      .dashboard-grid {
        grid-template-columns: 1fr !important;
      }
    }
  `;

  return (
    <>
      <style>{responsiveStyles}</style>
      <div style={containerStyles}>
        {title && (
          <div style={headerStyles}>
            <LayoutDashboard size={18} style={{ color: colors.brand.primary }} />
            {title}
          </div>
        )}

        <div className="dashboard-grid" style={gridStyles}>
          {metrics.map((metric) => (
            <KPICard key={metric.id} metric={metric} compact={compact} />
          ))}
        </div>
      </div>
    </>
  );
};

export default DashboardArtifact;
