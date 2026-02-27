// components/dashboard/charts/DeliveryTrendChart.tsx
// Gráfico de tendencias de entregas
import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import { TrendData } from '../../../stores/dashboardStore';

interface DeliveryTrendChartProps {
  data: TrendData[];
  title?: string;
}

export const DeliveryTrendChart: React.FC<DeliveryTrendChartProps> = ({
  data,
  title = 'Tendencia de Entregas',
}) => {
  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-700 p-6">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-500" />
          {title}
        </h3>
        <div className="h-[300px] flex items-center justify-center text-slate-400">
          Sin datos disponibles
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-700 p-6">
      <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-emerald-500" />
        {title}
      </h3>

      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorEntregas" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00ff88" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#00ff88" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorRetrasos" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ff6666" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#ff6666" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorNovedades" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ffb800" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#ffb800" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />

          <XAxis
            dataKey="fecha"
            stroke="rgba(255,255,255,0.4)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />

          <YAxis
            stroke="rgba(255,255,255,0.4)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => value.toLocaleString()}
          />

          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(10, 14, 23, 0.95)',
              border: '1px solid rgba(0, 245, 255, 0.2)',
              borderRadius: '12px',
              boxShadow: '0 0 20px rgba(0, 245, 255, 0.1), 0 8px 32px rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(20px)',
            }}
            labelStyle={{ color: '#F3F4F6', fontWeight: 'bold' }}
            itemStyle={{ color: '#D1D5DB' }}
          />

          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="circle"
          />

          <Area
            type="monotone"
            dataKey="entregas"
            stroke="#00ff88"
            strokeWidth={2}
            fill="url(#colorEntregas)"
            name="Entregas"
          />

          <Area
            type="monotone"
            dataKey="retrasos"
            stroke="#ff6666"
            strokeWidth={2}
            fill="url(#colorRetrasos)"
            name="Retrasos"
          />

          <Area
            type="monotone"
            dataKey="novedades"
            stroke="#ffb800"
            strokeWidth={2}
            fill="url(#colorNovedades)"
            name="Novedades"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DeliveryTrendChart;
