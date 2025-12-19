// components/dashboard/charts/CarrierPerformanceChart.tsx
// Gráfico de rendimiento por transportadora
import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts';
import { Truck } from 'lucide-react';
import { CarrierStats } from '../../../stores/dashboardStore';

interface CarrierPerformanceChartProps {
  data: CarrierStats[];
  title?: string;
  maxItems?: number;
}

const COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4'];

export const CarrierPerformanceChart: React.FC<CarrierPerformanceChartProps> = ({
  data,
  title = 'Rendimiento por Transportadora',
  maxItems = 6,
}) => {
  const chartData = data.slice(0, maxItems).map((item) => ({
    ...item,
    nombre: item.nombre.length > 15 ? item.nombre.substring(0, 12) + '...' : item.nombre,
    nombreCompleto: item.nombre,
  }));

  if (chartData.length === 0) {
    return (
      <div className="bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-700 p-6">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <Truck className="w-5 h-5 text-purple-500" />
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
        <Truck className="w-5 h-5 text-purple-500" />
        {title}
      </h3>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} horizontal={false} />

          <XAxis
            type="number"
            domain={[0, 100]}
            stroke="#9CA3AF"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}%`}
          />

          <YAxis
            type="category"
            dataKey="nombre"
            stroke="#9CA3AF"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            width={100}
          />

          <Tooltip
            contentStyle={{
              backgroundColor: '#1F2937',
              border: 'none',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
            }}
            labelStyle={{ color: '#F3F4F6', fontWeight: 'bold' }}
            formatter={(value: number, name: string, props: { payload: CarrierStats & { nombreCompleto: string } }) => {
              if (name === 'tasaEntrega') {
                return [`${value}%`, 'Tasa de Entrega'];
              }
              return [value, name];
            }}
            labelFormatter={(label, payload) => {
              if (payload && payload[0]) {
                return (payload[0].payload as { nombreCompleto: string }).nombreCompleto;
              }
              return label;
            }}
          />

          <Bar
            dataKey="tasaEntrega"
            radius={[0, 4, 4, 0]}
            maxBarSize={35}
          >
            {chartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
            <LabelList
              dataKey="tasaEntrega"
              position="right"
              fill="#9CA3AF"
              fontSize={12}
              formatter={(value: number) => `${value}%`}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Leyenda adicional con totales */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        {chartData.slice(0, 4).map((carrier, i) => (
          <div key={carrier.nombre} className="flex items-center gap-2 text-xs">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: COLORS[i % COLORS.length] }}
            />
            <span className="text-slate-600 dark:text-slate-400 truncate">
              {carrier.nombreCompleto}: {carrier.totalGuias} guías
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CarrierPerformanceChart;
