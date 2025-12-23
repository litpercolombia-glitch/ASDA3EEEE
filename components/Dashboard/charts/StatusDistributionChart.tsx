// components/dashboard/charts/StatusDistributionChart.tsx
// Gráfico de distribución por estado (Pie Chart)
import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { PieChart as PieIcon } from 'lucide-react';
import { StatusDistribution } from '../../../stores/dashboardStore';

interface StatusDistributionChartProps {
  data: StatusDistribution | null;
  title?: string;
}

const STATUS_CONFIG = {
  delivered: { label: 'Entregadas', color: '#10B981' },
  in_transit: { label: 'En Tránsito', color: '#3B82F6' },
  issue: { label: 'Con Novedad', color: '#EF4444' },
  in_office: { label: 'En Oficina', color: '#F59E0B' },
  returned: { label: 'Devueltas', color: '#8B5CF6' },
};

export const StatusDistributionChart: React.FC<StatusDistributionChartProps> = ({
  data,
  title = 'Distribución por Estado',
}) => {
  if (!data) {
    return (
      <div className="bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-700 p-6">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <PieIcon className="w-5 h-5 text-cyan-500" />
          {title}
        </h3>
        <div className="h-[300px] flex items-center justify-center text-slate-400">
          Sin datos disponibles
        </div>
      </div>
    );
  }

  const chartData = Object.entries(data)
    .filter(([_, value]) => value > 0)
    .map(([key, value]) => ({
      name: STATUS_CONFIG[key as keyof typeof STATUS_CONFIG]?.label || key,
      value,
      color: STATUS_CONFIG[key as keyof typeof STATUS_CONFIG]?.color || '#6B7280',
    }));

  const total = chartData.reduce((acc, item) => acc + item.value, 0);

  const renderCustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: {
    cx: number;
    cy: number;
    midAngle: number;
    innerRadius: number;
    outerRadius: number;
    percent: number;
  }) => {
    if (percent < 0.05) return null; // No mostrar etiquetas para valores muy pequeños

    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-700 p-6">
      <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
        <PieIcon className="w-5 h-5 text-cyan-500" />
        {title}
      </h3>

      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={90}
            innerRadius={50}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>

          <Tooltip
            contentStyle={{
              backgroundColor: '#1F2937',
              border: 'none',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
            }}
            labelStyle={{ color: '#F3F4F6' }}
            formatter={(value: number, name: string) => [
              `${value} (${((value / total) * 100).toFixed(1)}%)`,
              name,
            ]}
          />

          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            formatter={(value: string) => (
              <span className="text-slate-600 dark:text-slate-300 text-sm">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Total en el centro */}
      <div className="text-center -mt-4">
        <p className="text-2xl font-bold text-slate-800 dark:text-white">{total.toLocaleString()}</p>
        <p className="text-xs text-slate-500">Total Guías</p>
      </div>
    </div>
  );
};

export default StatusDistributionChart;
