// ============================================
// PRODUCT SCORECARD
// Ranking de productos por rentabilidad REAL
// ============================================

import React, { useMemo } from 'react';
import {
  Star,
  CheckCircle,
  AlertTriangle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Package,
  DollarSign,
  Target,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { useDropshippingStore, formatCOP, CATEGORIAS_PRODUCTO } from '../../../services/dropshippingService';

export const ProductScorecard: React.FC = () => {
  const { selectedMonth, getProductScorecards } = useDropshippingStore();
  const scorecards = useMemo(() => getProductScorecards(), [selectedMonth, getProductScorecards]);

  if (scorecards.length === 0) {
    return (
      <div className="text-center py-16 bg-white dark:bg-navy-800 rounded-2xl border border-slate-200 dark:border-navy-700">
        <Package className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
        <p className="text-slate-500 dark:text-slate-400 mb-2">Sin datos de productos</p>
        <p className="text-xs text-slate-400">Importa pedidos desde el Hub para generar scorecards</p>
      </div>
    );
  }

  // Summary counts
  const counts = {
    estrella: scorecards.filter((s) => s.categoria === 'estrella').length,
    rentable: scorecards.filter((s) => s.categoria === 'rentable').length,
    marginal: scorecards.filter((s) => s.categoria === 'marginal').length,
    perdedor: scorecards.filter((s) => s.categoria === 'perdedor').length,
  };

  return (
    <div className="space-y-6">
      {/* Category summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <CategoryCard
          emoji="⭐"
          label="Estrellas"
          count={counts.estrella}
          description="Escalar - alto margen + alta entrega"
          color="amber"
        />
        <CategoryCard
          emoji="✅"
          label="Rentables"
          count={counts.rentable}
          description="Mantener - buenos resultados"
          color="emerald"
        />
        <CategoryCard
          emoji="⚠️"
          label="Marginales"
          count={counts.marginal}
          description="Optimizar - margen bajo o rechazos altos"
          color="orange"
        />
        <CategoryCard
          emoji="❌"
          label="Perdedores"
          count={counts.perdedor}
          description="Eliminar - pierden dinero"
          color="red"
        />
      </div>

      {/* Product cards */}
      <div className="space-y-4">
        {scorecards.map((sc, i) => (
          <div
            key={i}
            className={`bg-white dark:bg-navy-800 rounded-2xl border-2 p-6 transition-all ${
              sc.categoria === 'estrella' ? 'border-amber-300 dark:border-amber-700' :
              sc.categoria === 'rentable' ? 'border-emerald-300 dark:border-emerald-700' :
              sc.categoria === 'marginal' ? 'border-orange-300 dark:border-orange-700' :
              'border-red-300 dark:border-red-700'
            }`}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                  sc.categoria === 'estrella' ? 'bg-amber-100 dark:bg-amber-900/30' :
                  sc.categoria === 'rentable' ? 'bg-emerald-100 dark:bg-emerald-900/30' :
                  sc.categoria === 'marginal' ? 'bg-orange-100 dark:bg-orange-900/30' :
                  'bg-red-100 dark:bg-red-900/30'
                }`}>
                  {CATEGORIAS_PRODUCTO[sc.categoria]?.emoji || '?'}
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-white text-lg">{sc.productoNombre}</h4>
                  <div className="flex items-center gap-2">
                    {sc.productoSKU && <span className="text-xs text-slate-400">SKU: {sc.productoSKU}</span>}
                    {sc.proveedorNombre && (
                      <span className="text-xs bg-slate-100 dark:bg-navy-700 text-slate-500 px-2 py-0.5 rounded-full">
                        {sc.proveedorNombre}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Score badge */}
              <div className={`flex flex-col items-center px-4 py-2 rounded-xl ${
                sc.score >= 70 ? 'bg-emerald-100 dark:bg-emerald-900/30' :
                sc.score >= 40 ? 'bg-amber-100 dark:bg-amber-900/30' :
                'bg-red-100 dark:bg-red-900/30'
              }`}>
                <span className={`text-2xl font-black ${
                  sc.score >= 70 ? 'text-emerald-600 dark:text-emerald-400' :
                  sc.score >= 40 ? 'text-amber-600 dark:text-amber-400' :
                  'text-red-600 dark:text-red-400'
                }`}>
                  {sc.score}
                </span>
                <span className="text-xs text-slate-400">Score</span>
              </div>
            </div>

            {/* Metrics grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-4">
              <MetricBox
                label="Pedidos"
                value={String(sc.totalPedidos)}
                icon={Package}
              />
              <MetricBox
                label="Tasa Entrega"
                value={`${sc.tasaEntrega.toFixed(1)}%`}
                icon={sc.tasaEntrega >= 80 ? CheckCircle : AlertTriangle}
                color={sc.tasaEntrega >= 80 ? 'text-emerald-500' : sc.tasaEntrega >= 60 ? 'text-amber-500' : 'text-red-500'}
              />
              <MetricBox
                label="Margen Neto"
                value={`${sc.margenNetoPromedio.toFixed(1)}%`}
                icon={sc.margenNetoPromedio >= 15 ? TrendingUp : TrendingDown}
                color={sc.margenNetoPromedio >= 15 ? 'text-emerald-500' : sc.margenNetoPromedio >= 5 ? 'text-amber-500' : 'text-red-500'}
              />
              <MetricBox
                label="Utilidad Total"
                value={formatCOP(sc.utilidadTotalGenerada)}
                icon={DollarSign}
                color={sc.utilidadTotalGenerada >= 0 ? 'text-emerald-500' : 'text-red-500'}
              />
              <MetricBox
                label="CPA"
                value={formatCOP(sc.cpaPromedio)}
                icon={Target}
              />
              <MetricBox
                label="ROAS"
                value={`${sc.roasProducto.toFixed(1)}x`}
                icon={sc.roasProducto >= 3 ? ArrowUp : ArrowDown}
                color={sc.roasProducto >= 3 ? 'text-emerald-500' : sc.roasProducto >= 2 ? 'text-amber-500' : 'text-red-500'}
              />
            </div>

            {/* Verdict */}
            <div className={`flex items-center justify-between p-3 rounded-xl ${
              sc.categoria === 'estrella' ? 'bg-amber-50 dark:bg-amber-900/10' :
              sc.categoria === 'rentable' ? 'bg-emerald-50 dark:bg-emerald-900/10' :
              sc.categoria === 'marginal' ? 'bg-orange-50 dark:bg-orange-900/10' :
              'bg-red-50 dark:bg-red-900/10'
            }`}>
              <div>
                <span className={`text-sm font-bold ${
                  sc.categoria === 'estrella' ? 'text-amber-700 dark:text-amber-400' :
                  sc.categoria === 'rentable' ? 'text-emerald-700 dark:text-emerald-400' :
                  sc.categoria === 'marginal' ? 'text-orange-700 dark:text-orange-400' :
                  'text-red-700 dark:text-red-400'
                }`}>
                  {sc.veredicto}
                </span>
                <span className="text-sm text-slate-500 ml-2">- {sc.razon}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================
// SUB-COMPONENTS
// ============================================

const CategoryCard: React.FC<{
  emoji: string;
  label: string;
  count: number;
  description: string;
  color: string;
}> = ({ emoji, label, count, description, color }) => (
  <div className={`bg-${color}-50 dark:bg-${color}-900/10 border border-${color}-200 dark:border-${color}-800 rounded-xl p-4`}>
    <div className="flex items-center gap-2 mb-2">
      <span className="text-xl">{emoji}</span>
      <span className={`text-2xl font-black text-${color}-600 dark:text-${color}-400`}>{count}</span>
    </div>
    <p className={`text-sm font-bold text-${color}-700 dark:text-${color}-300`}>{label}</p>
    <p className="text-xs text-slate-500 mt-1">{description}</p>
  </div>
);

const MetricBox: React.FC<{
  label: string;
  value: string;
  icon: React.ElementType;
  color?: string;
}> = ({ label, value, icon: Icon, color = 'text-slate-600 dark:text-slate-300' }) => (
  <div className="text-center">
    <Icon className={`w-4 h-4 mx-auto mb-1 ${color}`} />
    <p className={`text-sm font-bold ${color}`}>{value}</p>
    <p className="text-xs text-slate-400">{label}</p>
  </div>
);

export default ProductScorecard;
