// components/admin/FinanceCenter/FinancialHistory.tsx
// Histórico Financiero Anual - Seguimiento del progreso del negocio

import React, { useState, useMemo } from 'react';
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Download,
  ChevronLeft,
  ChevronRight,
  Target,
  Award,
  AlertTriangle,
  DollarSign,
  Package,
  Percent,
} from 'lucide-react';
import {
  useFinanceStore,
  formatCurrency,
  formatPercentage,
  MONTHS_ES,
  type MonthlyFinancial,
} from '../../../services/financeService';

// ============================================
// GRÁFICO DE BARRAS SIMPLE (SVG)
// ============================================
interface BarChartProps {
  data: { month: string; value: number; label: string }[];
  color: string;
  height?: number;
}

const SimpleBarChart: React.FC<BarChartProps> = ({ data, color, height = 200 }) => {
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const barWidth = 100 / data.length;

  return (
    <div className="relative" style={{ height }}>
      {/* Grid lines */}
      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="border-t border-slate-200 dark:border-navy-700" />
        ))}
      </div>

      {/* Bars */}
      <svg className="w-full h-full" viewBox={`0 0 ${data.length * 50} ${height}`}>
        {data.map((item, index) => {
          const barHeight = (item.value / maxValue) * (height - 40);
          const x = index * 50 + 10;
          const y = height - barHeight - 20;

          return (
            <g key={item.month}>
              {/* Bar */}
              <rect
                x={x}
                y={y}
                width={30}
                height={barHeight}
                rx={4}
                className={`${color} opacity-80 hover:opacity-100 transition-opacity`}
                fill="currentColor"
              />
              {/* Label */}
              <text
                x={x + 15}
                y={height - 5}
                textAnchor="middle"
                className="fill-slate-500 dark:fill-slate-400 text-xs"
                fontSize="10"
              >
                {item.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// ============================================
// MINI GRÁFICO DE TENDENCIA
// ============================================
interface SparklineProps {
  data: number[];
  color: string;
  width?: number;
  height?: number;
}

const Sparkline: React.FC<SparklineProps> = ({ data, color, width = 100, height = 30 }) => {
  if (data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export const FinancialHistory: React.FC = () => {
  const { selectedYear, setSelectedYear, getYearlyReport, goals } = useFinanceStore();

  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');

  const yearlyData = getYearlyReport(selectedYear);

  // Calcular totales anuales
  const yearlyTotals = useMemo(() => {
    return yearlyData.reduce(
      (acc, month) => ({
        grossSales: acc.grossSales + month.grossSales,
        netSales: acc.netSales + month.netSales,
        netProfit: acc.netProfit + month.netProfit,
        totalOrders: acc.totalOrders + month.totalOrders,
        deliveredOrders: acc.deliveredOrders + month.deliveredOrders,
        advertisingExpenses: acc.advertisingExpenses + month.advertisingExpenses,
        fixedExpenses: acc.fixedExpenses + month.fixedExpenses,
      }),
      {
        grossSales: 0,
        netSales: 0,
        netProfit: 0,
        totalOrders: 0,
        deliveredOrders: 0,
        advertisingExpenses: 0,
        fixedExpenses: 0,
      }
    );
  }, [yearlyData]);

  // Calcular promedios
  const monthsWithData = yearlyData.filter((m) => m.grossSales > 0).length || 1;
  const averages = {
    monthlySales: yearlyTotals.grossSales / monthsWithData,
    monthlyProfit: yearlyTotals.netProfit / monthsWithData,
    avgMargin:
      yearlyTotals.netSales > 0
        ? (yearlyTotals.netProfit / yearlyTotals.netSales) * 100
        : 0,
    avgDeliveryRate:
      yearlyTotals.totalOrders > 0
        ? (yearlyTotals.deliveredOrders / yearlyTotals.totalOrders) * 100
        : 0,
  };

  // Datos para gráficos
  const salesChartData = MONTHS_ES.map((month, index) => {
    const monthData = yearlyData.find((m) => m.monthNumber === index + 1);
    return {
      month: `${selectedYear}-${String(index + 1).padStart(2, '0')}`,
      value: monthData?.grossSales || 0,
      label: month.slice(0, 3),
    };
  });

  const profitChartData = MONTHS_ES.map((month, index) => {
    const monthData = yearlyData.find((m) => m.monthNumber === index + 1);
    return {
      month: `${selectedYear}-${String(index + 1).padStart(2, '0')}`,
      value: monthData?.netProfit || 0,
      label: month.slice(0, 3),
    };
  });

  // Tendencias (últimos 6 meses con datos)
  const recentData = yearlyData.slice(-6);
  const salesTrend = recentData.map((m) => m.grossSales);
  const profitTrend = recentData.map((m) => m.netProfit);

  // Mejor y peor mes
  const bestMonth = yearlyData.reduce(
    (best, month) => (month.netProfit > (best?.netProfit || 0) ? month : best),
    null as MonthlyFinancial | null
  );
  const worstMonth = yearlyData.reduce(
    (worst, month) =>
      month.grossSales > 0 && month.netProfit < (worst?.netProfit || Infinity) ? month : worst,
    null as MonthlyFinancial | null
  );

  const handleExportYearly = () => {
    let csvContent = `Histórico Financiero ${selectedYear}\n\n`;
    csvContent += 'Mes,Ventas Brutas,Ventas Netas,Utilidad Neta,Margen %,Pedidos,Entregados,Tasa Entrega,Publicidad,ROAS\n';

    MONTHS_ES.forEach((month, index) => {
      const data = yearlyData.find((m) => m.monthNumber === index + 1);
      if (data) {
        csvContent += `${month},${data.grossSales},${data.netSales},${data.netProfit},${data.netMargin.toFixed(1)}%,${data.totalOrders},${data.deliveredOrders},${data.deliveryRate.toFixed(1)}%,${data.advertisingExpenses},${data.roas.toFixed(1)}\n`;
      } else {
        csvContent += `${month},0,0,0,0%,0,0,0%,0,0\n`;
      }
    });

    csvContent += `\nTOTAL ANUAL,${yearlyTotals.grossSales},${yearlyTotals.netSales},${yearlyTotals.netProfit},${averages.avgMargin.toFixed(1)}%,${yearlyTotals.totalOrders},${yearlyTotals.deliveredOrders},${averages.avgDeliveryRate.toFixed(1)}%,${yearlyTotals.advertisingExpenses},N/A\n`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Historico_Financiero_${selectedYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Calendar className="w-6 h-6 text-indigo-500" />
            Histórico Financiero {selectedYear}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Seguimiento anual del rendimiento del negocio
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Navegación de año */}
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-navy-700 rounded-lg p-1">
            <button
              onClick={() => setSelectedYear(selectedYear - 1)}
              className="p-1.5 hover:bg-white dark:hover:bg-navy-600 rounded transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 font-medium text-slate-800 dark:text-white">
              {selectedYear}
            </span>
            <button
              onClick={() => setSelectedYear(selectedYear + 1)}
              className="p-1.5 hover:bg-white dark:hover:bg-navy-600 rounded transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Toggle vista */}
          <div className="flex items-center bg-slate-100 dark:bg-navy-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded text-sm transition-colors ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-navy-600 text-slate-800 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Tabla
            </button>
            <button
              onClick={() => setViewMode('chart')}
              className={`px-3 py-1.5 rounded text-sm transition-colors ${
                viewMode === 'chart'
                  ? 'bg-white dark:bg-navy-600 text-slate-800 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Gráfico
            </button>
          </div>

          <button
            onClick={handleExportYearly}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
          >
            <Download className="w-4 h-4" />
            Exportar
          </button>
        </div>
      </div>

      {/* Resumen Anual */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-navy-800 rounded-xl p-4 border border-slate-200 dark:border-navy-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-500 dark:text-slate-400">Ventas Anuales</span>
            <Sparkline data={salesTrend} color="#22c55e" />
          </div>
          <p className="text-2xl font-bold text-slate-800 dark:text-white">
            {formatCurrency(yearlyTotals.grossSales)}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Promedio: {formatCurrency(averages.monthlySales)}/mes
          </p>
        </div>

        <div className="bg-white dark:bg-navy-800 rounded-xl p-4 border border-slate-200 dark:border-navy-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-500 dark:text-slate-400">Utilidad Anual</span>
            <Sparkline
              data={profitTrend}
              color={yearlyTotals.netProfit >= 0 ? '#3b82f6' : '#ef4444'}
            />
          </div>
          <p
            className={`text-2xl font-bold ${
              yearlyTotals.netProfit >= 0
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {formatCurrency(yearlyTotals.netProfit)}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Margen: {formatPercentage(averages.avgMargin)}
          </p>
        </div>

        <div className="bg-white dark:bg-navy-800 rounded-xl p-4 border border-slate-200 dark:border-navy-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-500 dark:text-slate-400">Pedidos Totales</span>
            <Package className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-slate-800 dark:text-white">
            {yearlyTotals.totalOrders.toLocaleString()}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Tasa entrega: {formatPercentage(averages.avgDeliveryRate)}
          </p>
        </div>

        <div className="bg-white dark:bg-navy-800 rounded-xl p-4 border border-slate-200 dark:border-navy-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-500 dark:text-slate-400">Inv. Publicidad</span>
            <TrendingUp className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-slate-800 dark:text-white">
            {formatCurrency(yearlyTotals.advertisingExpenses)}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            ROAS promedio:{' '}
            {yearlyTotals.advertisingExpenses > 0
              ? (yearlyTotals.grossSales / yearlyTotals.advertisingExpenses).toFixed(1)
              : 0}
            x
          </p>
        </div>
      </div>

      {/* Mejor y Peor Mes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {bestMonth && (
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-4 text-white">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-5 h-5" />
              <span className="font-medium">Mejor Mes</span>
            </div>
            <p className="text-2xl font-bold">
              {MONTHS_ES[bestMonth.monthNumber - 1]} {selectedYear}
            </p>
            <div className="flex items-center gap-4 mt-2 text-sm opacity-90">
              <span>Ventas: {formatCurrency(bestMonth.grossSales)}</span>
              <span>Utilidad: {formatCurrency(bestMonth.netProfit)}</span>
            </div>
          </div>
        )}

        {worstMonth && worstMonth.netProfit < yearlyTotals.netProfit / monthsWithData && (
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-4 text-white">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-medium">Mes a Mejorar</span>
            </div>
            <p className="text-2xl font-bold">
              {MONTHS_ES[worstMonth.monthNumber - 1]} {selectedYear}
            </p>
            <div className="flex items-center gap-4 mt-2 text-sm opacity-90">
              <span>Ventas: {formatCurrency(worstMonth.grossSales)}</span>
              <span>Utilidad: {formatCurrency(worstMonth.netProfit)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Vista de Gráficos */}
      {viewMode === 'chart' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-navy-800 rounded-xl p-6 border border-slate-200 dark:border-navy-700">
            <h3 className="font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              Ventas Mensuales
            </h3>
            <SimpleBarChart data={salesChartData} color="text-green-500" height={200} />
          </div>

          <div className="bg-white dark:bg-navy-800 rounded-xl p-6 border border-slate-200 dark:border-navy-700">
            <h3 className="font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              Utilidad Mensual
            </h3>
            <SimpleBarChart data={profitChartData} color="text-blue-500" height={200} />
          </div>
        </div>
      )}

      {/* Vista de Tabla */}
      {viewMode === 'table' && (
        <div className="bg-white dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-navy-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 dark:bg-navy-700/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">
                    Mes
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">
                    Ventas
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">
                    Utilidad
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">
                    Margen
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">
                    Pedidos
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">
                    Entrega
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">
                    Publicidad
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">
                    ROAS
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-navy-700">
                {MONTHS_ES.map((month, index) => {
                  const data = yearlyData.find((m) => m.monthNumber === index + 1);
                  const hasData = data && data.grossSales > 0;

                  return (
                    <tr
                      key={month}
                      className={`hover:bg-slate-50 dark:hover:bg-navy-700/30 ${
                        !hasData ? 'opacity-50' : ''
                      }`}
                    >
                      <td className="px-4 py-3 text-sm font-medium text-slate-800 dark:text-white">
                        {month}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-slate-600 dark:text-slate-300">
                        {hasData ? formatCurrency(data.grossSales) : '-'}
                      </td>
                      <td
                        className={`px-4 py-3 text-sm text-right font-medium ${
                          hasData && data.netProfit >= 0
                            ? 'text-green-600 dark:text-green-400'
                            : hasData
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-slate-400'
                        }`}
                      >
                        {hasData ? formatCurrency(data.netProfit) : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-slate-600 dark:text-slate-300">
                        {hasData ? formatPercentage(data.netMargin) : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-slate-600 dark:text-slate-300">
                        {hasData ? data.totalOrders.toLocaleString() : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-slate-600 dark:text-slate-300">
                        {hasData ? formatPercentage(data.deliveryRate) : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-slate-600 dark:text-slate-300">
                        {hasData ? formatCurrency(data.advertisingExpenses) : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-slate-600 dark:text-slate-300">
                        {hasData && data.roas > 0 ? `${data.roas.toFixed(1)}x` : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 dark:bg-navy-700 font-semibold">
                  <td className="px-4 py-3 text-sm text-slate-800 dark:text-white">
                    TOTAL {selectedYear}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-slate-800 dark:text-white">
                    {formatCurrency(yearlyTotals.grossSales)}
                  </td>
                  <td
                    className={`px-4 py-3 text-sm text-right ${
                      yearlyTotals.netProfit >= 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {formatCurrency(yearlyTotals.netProfit)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-slate-800 dark:text-white">
                    {formatPercentage(averages.avgMargin)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-slate-800 dark:text-white">
                    {yearlyTotals.totalOrders.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-slate-800 dark:text-white">
                    {formatPercentage(averages.avgDeliveryRate)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-slate-800 dark:text-white">
                    {formatCurrency(yearlyTotals.advertisingExpenses)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-slate-800 dark:text-white">
                    {yearlyTotals.advertisingExpenses > 0
                      ? `${(yearlyTotals.grossSales / yearlyTotals.advertisingExpenses).toFixed(1)}x`
                      : '-'}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialHistory;
