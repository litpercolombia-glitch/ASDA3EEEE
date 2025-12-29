/**
 * ChartArtifact - Graficas profesionales
 * Line, Bar, Pie, Area charts con Recharts
 */

import React, { useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Download, Maximize2, BarChart3 } from 'lucide-react';
import { colors, radius, shadows, transitions } from '../../../styles/theme';
import { Button } from '../UI/Button';

// ============================================
// TYPES
// ============================================

export type ChartType = 'line' | 'bar' | 'pie' | 'area';

export interface ChartDataPoint {
  name: string;
  [key: string]: string | number;
}

export interface ChartSeries {
  key: string;
  name: string;
  color?: string;
}

export interface ChartArtifactProps {
  title?: string;
  type: ChartType;
  data: ChartDataPoint[];
  series: ChartSeries[];
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
  stacked?: boolean;
  animate?: boolean;
  onExport?: () => void;
}

// ============================================
// CHART COLORS
// ============================================

const CHART_COLORS = [
  colors.brand.primary,
  colors.brand.secondary,
  colors.success.default,
  colors.warning.default,
  colors.error.default,
  colors.info.default,
  '#EC4899', // Pink
  '#14B8A6', // Teal
  '#F97316', // Orange
  '#8B5CF6', // Purple
];

// ============================================
// CUSTOM TOOLTIP
// ============================================

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;

  return (
    <div
      style={{
        backgroundColor: colors.bg.elevated,
        border: `1px solid ${colors.border.default}`,
        borderRadius: radius.lg,
        padding: '0.75rem',
        boxShadow: shadows.lg,
      }}
    >
      <p
        style={{
          margin: 0,
          marginBottom: '0.5rem',
          fontSize: '0.8125rem',
          fontWeight: 600,
          color: colors.text.primary,
        }}
      >
        {label}
      </p>
      {payload.map((entry: any, idx: number) => (
        <p
          key={idx}
          style={{
            margin: '0.25rem 0',
            fontSize: '0.8125rem',
            color: entry.color,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <span
            style={{
              width: '0.5rem',
              height: '0.5rem',
              borderRadius: '50%',
              backgroundColor: entry.color,
            }}
          />
          {entry.name}:{' '}
          <strong>
            {typeof entry.value === 'number'
              ? new Intl.NumberFormat('es-CO').format(entry.value)
              : entry.value}
          </strong>
        </p>
      ))}
    </div>
  );
};

// ============================================
// COMPONENT
// ============================================

export const ChartArtifact: React.FC<ChartArtifactProps> = ({
  title,
  type,
  data,
  series,
  height = 300,
  showLegend = true,
  showGrid = true,
  stacked = false,
  animate = true,
  onExport,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Assign colors to series
  const coloredSeries = series.map((s, idx) => ({
    ...s,
    color: s.color || CHART_COLORS[idx % CHART_COLORS.length],
  }));

  // ============================================
  // STYLES
  // ============================================

  const containerStyles: React.CSSProperties = {
    backgroundColor: colors.bg.tertiary,
    borderRadius: radius.xl,
    border: `1px solid ${colors.border.light}`,
    overflow: 'hidden',
    ...(isFullscreen && {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 1000,
      borderRadius: 0,
    }),
  };

  const headerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1rem',
    borderBottom: `1px solid ${colors.border.light}`,
  };

  const titleStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '1rem',
    fontWeight: 600,
    color: colors.text.primary,
  };

  const actionsStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  };

  const chartContainerStyles: React.CSSProperties = {
    padding: '1rem',
    height: isFullscreen ? 'calc(100vh - 80px)' : height,
  };

  // ============================================
  // RENDER CHART
  // ============================================

  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 10, right: 10, left: 0, bottom: 0 },
    };

    const commonAxisProps = {
      stroke: colors.text.muted,
      tick: { fill: colors.text.tertiary, fontSize: 12 },
      tickLine: { stroke: colors.border.default },
      axisLine: { stroke: colors.border.default },
    };

    switch (type) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            {showGrid && (
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={colors.border.light}
                vertical={false}
              />
            )}
            <XAxis dataKey="name" {...commonAxisProps} />
            <YAxis {...commonAxisProps} />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && (
              <Legend
                wrapperStyle={{ paddingTop: '1rem' }}
                formatter={(value) => (
                  <span style={{ color: colors.text.secondary }}>{value}</span>
                )}
              />
            )}
            {coloredSeries.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.name}
                stroke={s.color}
                strokeWidth={2}
                dot={{ fill: s.color, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, strokeWidth: 0 }}
                isAnimationActive={animate}
              />
            ))}
          </LineChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            {showGrid && (
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={colors.border.light}
                vertical={false}
              />
            )}
            <XAxis dataKey="name" {...commonAxisProps} />
            <YAxis {...commonAxisProps} />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && (
              <Legend
                wrapperStyle={{ paddingTop: '1rem' }}
                formatter={(value) => (
                  <span style={{ color: colors.text.secondary }}>{value}</span>
                )}
              />
            )}
            {coloredSeries.map((s) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.name}
                fill={s.color}
                radius={[4, 4, 0, 0]}
                stackId={stacked ? 'stack' : undefined}
                isAnimationActive={animate}
              />
            ))}
          </BarChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            {showGrid && (
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={colors.border.light}
                vertical={false}
              />
            )}
            <XAxis dataKey="name" {...commonAxisProps} />
            <YAxis {...commonAxisProps} />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && (
              <Legend
                wrapperStyle={{ paddingTop: '1rem' }}
                formatter={(value) => (
                  <span style={{ color: colors.text.secondary }}>{value}</span>
                )}
              />
            )}
            {coloredSeries.map((s) => (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.name}
                stroke={s.color}
                fill={s.color}
                fillOpacity={0.2}
                strokeWidth={2}
                stackId={stacked ? 'stack' : undefined}
                isAnimationActive={animate}
              />
            ))}
          </AreaChart>
        );

      case 'pie':
        return (
          <PieChart>
            <Pie
              data={data}
              dataKey={series[0]?.key || 'value'}
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={height / 3}
              innerRadius={height / 5}
              paddingAngle={2}
              isAnimationActive={animate}
              label={({ name, percent }) =>
                `${name}: ${(percent * 100).toFixed(0)}%`
              }
              labelLine={{ stroke: colors.text.tertiary }}
            >
              {data.map((_, idx) => (
                <Cell
                  key={idx}
                  fill={CHART_COLORS[idx % CHART_COLORS.length]}
                  stroke={colors.bg.tertiary}
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            {showLegend && (
              <Legend
                formatter={(value) => (
                  <span style={{ color: colors.text.secondary }}>{value}</span>
                )}
              />
            )}
          </PieChart>
        );

      default:
        return null;
    }
  };

  return (
    <div style={containerStyles}>
      {/* Header */}
      <div style={headerStyles}>
        <div style={titleStyles}>
          <BarChart3 size={18} style={{ color: colors.brand.primary }} />
          {title || 'Grafica'}
        </div>

        <div style={actionsStyles}>
          <Button
            variant="ghost"
            size="sm"
            icon={Maximize2}
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            {isFullscreen ? 'Salir' : 'Expandir'}
          </Button>
          {onExport && (
            <Button variant="ghost" size="sm" icon={Download} onClick={onExport}>
              Exportar
            </Button>
          )}
        </div>
      </div>

      {/* Chart */}
      <div style={chartContainerStyles}>
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ChartArtifact;
