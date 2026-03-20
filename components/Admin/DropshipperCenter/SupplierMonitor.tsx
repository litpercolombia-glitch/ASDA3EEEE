// ============================================
// SUPPLIER MONITOR
// Calificacion de proveedores por cumplimiento, calidad y tiempos
// ============================================

import React, { useMemo } from 'react';
import {
  Truck,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Star,
  Package,
  TrendingUp,
  TrendingDown,
  BarChart3,
  ShieldCheck,
  Timer,
} from 'lucide-react';
import { useDropshippingStore, formatCOP } from '../../../services/dropshippingService';

export const SupplierMonitor: React.FC = () => {
  const { selectedMonth, getSupplierScores } = useDropshippingStore();
  const suppliers = useMemo(() => getSupplierScores(), [selectedMonth, getSupplierScores]);

  if (suppliers.length === 0) {
    return (
      <div className="text-center py-16 bg-white dark:bg-navy-800 rounded-2xl border border-slate-200 dark:border-navy-700">
        <Truck className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
        <p className="text-slate-500 dark:text-slate-400 mb-2">Sin datos de proveedores</p>
        <p className="text-xs text-slate-400">Importa pedidos con campo "proveedor" para generar calificaciones</p>
      </div>
    );
  }

  // Summary
  const totalProveedores = suppliers.length;
  const excelentes = suppliers.filter((s) => s.estado === 'excelente').length;
  const buenos = suppliers.filter((s) => s.estado === 'bueno').length;
  const regulares = suppliers.filter((s) => s.estado === 'regular').length;
  const malos = suppliers.filter((s) => s.estado === 'malo').length;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          label="Excelentes"
          count={excelentes}
          total={totalProveedores}
          color="emerald"
          icon={ShieldCheck}
        />
        <SummaryCard
          label="Buenos"
          count={buenos}
          total={totalProveedores}
          color="blue"
          icon={CheckCircle}
        />
        <SummaryCard
          label="Regulares"
          count={regulares}
          total={totalProveedores}
          color="amber"
          icon={AlertTriangle}
        />
        <SummaryCard
          label="Malos"
          count={malos}
          total={totalProveedores}
          color="red"
          icon={XCircle}
        />
      </div>

      {/* Supplier cards */}
      <div className="space-y-4">
        {suppliers.map((supplier, i) => (
          <div
            key={i}
            className={`bg-white dark:bg-navy-800 rounded-2xl border-2 p-6 transition-all ${
              supplier.estado === 'excelente' ? 'border-emerald-300 dark:border-emerald-700' :
              supplier.estado === 'bueno' ? 'border-blue-300 dark:border-blue-700' :
              supplier.estado === 'regular' ? 'border-amber-300 dark:border-amber-700' :
              'border-red-300 dark:border-red-700'
            }`}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  supplier.estado === 'excelente' ? 'bg-emerald-100 dark:bg-emerald-900/30' :
                  supplier.estado === 'bueno' ? 'bg-blue-100 dark:bg-blue-900/30' :
                  supplier.estado === 'regular' ? 'bg-amber-100 dark:bg-amber-900/30' :
                  'bg-red-100 dark:bg-red-900/30'
                }`}>
                  <Truck className={`w-6 h-6 ${
                    supplier.estado === 'excelente' ? 'text-emerald-600' :
                    supplier.estado === 'bueno' ? 'text-blue-600' :
                    supplier.estado === 'regular' ? 'text-amber-600' :
                    'text-red-600'
                  }`} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-white text-lg">{supplier.proveedorNombre}</h4>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      supplier.plataforma === 'dropi'
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                        : 'bg-slate-100 text-slate-500 dark:bg-navy-700 dark:text-slate-400'
                    }`}>
                      {supplier.plataforma === 'dropi' ? 'Dropi' : 'Otro'}
                    </span>
                    <span className="text-xs text-slate-400">{supplier.totalPedidos} pedidos</span>
                  </div>
                </div>
              </div>

              {/* Score */}
              <div className="text-center">
                <div className={`relative w-16 h-16 rounded-full flex items-center justify-center ${
                  supplier.estado === 'excelente' ? 'bg-emerald-50 dark:bg-emerald-900/20' :
                  supplier.estado === 'bueno' ? 'bg-blue-50 dark:bg-blue-900/20' :
                  supplier.estado === 'regular' ? 'bg-amber-50 dark:bg-amber-900/20' :
                  'bg-red-50 dark:bg-red-900/20'
                }`}>
                  <svg className="absolute inset-0 w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-200 dark:text-navy-700" />
                    <circle
                      cx="18" cy="18" r="15.5" fill="none" strokeWidth="2"
                      strokeDasharray={`${supplier.score * 0.97} 97`}
                      strokeLinecap="round"
                      className={
                        supplier.estado === 'excelente' ? 'stroke-emerald-500' :
                        supplier.estado === 'bueno' ? 'stroke-blue-500' :
                        supplier.estado === 'regular' ? 'stroke-amber-500' :
                        'stroke-red-500'
                      }
                    />
                  </svg>
                  <span className={`text-lg font-black ${
                    supplier.estado === 'excelente' ? 'text-emerald-600 dark:text-emerald-400' :
                    supplier.estado === 'bueno' ? 'text-blue-600 dark:text-blue-400' :
                    supplier.estado === 'regular' ? 'text-amber-600 dark:text-amber-400' :
                    'text-red-600 dark:text-red-400'
                  }`}>
                    {supplier.score}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block uppercase font-bold tracking-wider">
                  {supplier.estado}
                </span>
              </div>
            </div>

            {/* Metrics grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
              <MetricBox
                icon={CheckCircle}
                label="Cumplimiento"
                value={`${supplier.tasaCumplimiento.toFixed(1)}%`}
                color={supplier.tasaCumplimiento >= 80 ? 'text-emerald-500' : supplier.tasaCumplimiento >= 60 ? 'text-amber-500' : 'text-red-500'}
              />
              <MetricBox
                icon={Timer}
                label="Despacho Prom."
                value={`${supplier.tiempoPromedioDespacho} dias`}
                color={supplier.tiempoPromedioDespacho <= 2 ? 'text-emerald-500' : supplier.tiempoPromedioDespacho <= 4 ? 'text-amber-500' : 'text-red-500'}
              />
              <MetricBox
                icon={Clock}
                label="Entrega Prom."
                value={`${supplier.tiempoPromedioEntrega} dias`}
                color={supplier.tiempoPromedioEntrega <= 4 ? 'text-emerald-500' : supplier.tiempoPromedioEntrega <= 7 ? 'text-amber-500' : 'text-red-500'}
              />
              <MetricBox
                icon={XCircle}
                label="Tasa Devolucion"
                value={`${supplier.tasaDevolucion.toFixed(1)}%`}
                color={supplier.tasaDevolucion <= 10 ? 'text-emerald-500' : supplier.tasaDevolucion <= 20 ? 'text-amber-500' : 'text-red-500'}
              />
              <MetricBox
                icon={Package}
                label="Costo Prom."
                value={formatCOP(supplier.costoPromedioProducto)}
                color="text-slate-600 dark:text-slate-300"
              />
              <MetricBox
                icon={TrendingUp}
                label="Margen Prom."
                value={`${supplier.margenPromedioConEste.toFixed(1)}%`}
                color={supplier.margenPromedioConEste >= 15 ? 'text-emerald-500' : supplier.margenPromedioConEste >= 5 ? 'text-amber-500' : 'text-red-500'}
              />
            </div>

            {/* Progress bars */}
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-500">A tiempo vs Retrasados</span>
                  <span className="text-slate-400">{supplier.pedidosAtiempo} / {supplier.pedidosAtiempo + supplier.pedidosRetrasados}</span>
                </div>
                <div className="flex h-2.5 rounded-full overflow-hidden bg-slate-100 dark:bg-navy-700">
                  <div
                    className="bg-emerald-500 rounded-l-full"
                    style={{ width: `${supplier.totalPedidos > 0 ? (supplier.pedidosAtiempo / supplier.totalPedidos) * 100 : 0}%` }}
                  />
                  <div
                    className="bg-red-500 rounded-r-full"
                    style={{ width: `${supplier.totalPedidos > 0 ? (supplier.pedidosRetrasados / supplier.totalPedidos) * 100 : 0}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] mt-1">
                  <span className="text-emerald-500">{supplier.pedidosAtiempo} a tiempo</span>
                  <span className="text-red-500">{supplier.pedidosRetrasados} retrasados</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-500">Entregados vs Devueltos</span>
                  <span className="text-slate-400">{supplier.totalPedidos - supplier.devoluciones} / {supplier.totalPedidos}</span>
                </div>
                <div className="flex h-2.5 rounded-full overflow-hidden bg-slate-100 dark:bg-navy-700">
                  <div
                    className="bg-blue-500 rounded-l-full"
                    style={{ width: `${supplier.totalPedidos > 0 ? ((supplier.totalPedidos - supplier.devoluciones) / supplier.totalPedidos) * 100 : 0}%` }}
                  />
                  <div
                    className="bg-orange-500 rounded-r-full"
                    style={{ width: `${supplier.totalPedidos > 0 ? (supplier.devoluciones / supplier.totalPedidos) * 100 : 0}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] mt-1">
                  <span className="text-blue-500">{supplier.totalPedidos - supplier.devoluciones} exitosos</span>
                  <span className="text-orange-500">{supplier.devoluciones} devueltos</span>
                </div>
              </div>
            </div>

            {/* Recommendation */}
            <div className={`p-3 rounded-xl text-sm ${
              supplier.estado === 'excelente' ? 'bg-emerald-50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-400' :
              supplier.estado === 'bueno' ? 'bg-blue-50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-400' :
              supplier.estado === 'regular' ? 'bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400' :
              'bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400'
            }`}>
              {supplier.estado === 'excelente' && <ShieldCheck className="w-4 h-4 inline mr-2" />}
              {supplier.estado === 'bueno' && <CheckCircle className="w-4 h-4 inline mr-2" />}
              {supplier.estado === 'regular' && <AlertTriangle className="w-4 h-4 inline mr-2" />}
              {supplier.estado === 'malo' && <XCircle className="w-4 h-4 inline mr-2" />}
              {supplier.recomendacion}
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

const SummaryCard: React.FC<{
  label: string;
  count: number;
  total: number;
  color: string;
  icon: React.ElementType;
}> = ({ label, count, total, color, icon: Icon }) => (
  <div className={`bg-${color}-50 dark:bg-${color}-900/10 border border-${color}-200 dark:border-${color}-800 rounded-xl p-4`}>
    <div className="flex items-center justify-between mb-2">
      <Icon className={`w-5 h-5 text-${color}-500`} />
      <span className={`text-xs font-bold text-${color}-600 dark:text-${color}-400`}>
        {total > 0 ? `${((count / total) * 100).toFixed(0)}%` : '0%'}
      </span>
    </div>
    <p className={`text-2xl font-black text-${color}-600 dark:text-${color}-400`}>{count}</p>
    <p className="text-xs text-slate-500">{label}</p>
  </div>
);

const MetricBox: React.FC<{
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
}> = ({ icon: Icon, label, value, color }) => (
  <div className="text-center">
    <Icon className={`w-4 h-4 mx-auto mb-1 ${color}`} />
    <p className={`text-sm font-bold ${color}`}>{value}</p>
    <p className="text-xs text-slate-400">{label}</p>
  </div>
);

export default SupplierMonitor;
