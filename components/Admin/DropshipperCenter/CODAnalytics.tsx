// ============================================
// COD ANALYTICS DASHBOARD
// Analítica de rechazos COD por ciudad, transportadora y producto
// ============================================

import React, { useMemo, useState } from 'react';
import {
  MapPin,
  Truck,
  Package,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  DollarSign,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
} from 'lucide-react';
import { useDropshippingStore, formatCOP } from '../../../services/dropshippingService';

type TabView = 'resumen' | 'ciudades' | 'transportadoras' | 'productos';

export const CODAnalytics: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabView>('resumen');
  const { selectedMonth, getResumenMensual, getAnalyticsPorCiudad, getAnalyticsPorTransportadora, getAnalyticsPorProducto } = useDropshippingStore();

  const resumen = useMemo(() => getResumenMensual(), [selectedMonth, getResumenMensual]);
  const ciudades = useMemo(() => getAnalyticsPorCiudad(), [selectedMonth, getAnalyticsPorCiudad]);
  const transportadoras = useMemo(() => getAnalyticsPorTransportadora(), [selectedMonth, getAnalyticsPorTransportadora]);
  const productos = useMemo(() => getAnalyticsPorProducto(), [selectedMonth, getAnalyticsPorProducto]);

  const tabs: { id: TabView; label: string; icon: React.ElementType }[] = [
    { id: 'resumen', label: 'Resumen', icon: BarChart3 },
    { id: 'ciudades', label: 'Por Ciudad', icon: MapPin },
    { id: 'transportadoras', label: 'Por Transportadora', icon: Truck },
    { id: 'productos', label: 'Por Producto', icon: Package },
  ];

  // ============================
  // RESUMEN TAB
  // ============================
  const renderResumen = () => (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Tasa Entrega"
          value={`${resumen.tasaEntregaGeneral.toFixed(1)}%`}
          subtitle={resumen.vsMesAnterior ? `${resumen.vsMesAnterior.tasaEntrega >= 0 ? '+' : ''}${resumen.vsMesAnterior.tasaEntrega.toFixed(1)}pp vs mes ant.` : 'Sin datos previos'}
          trend={resumen.vsMesAnterior && resumen.vsMesAnterior.tasaEntrega >= 0 ? 'up' : 'down'}
          color="emerald"
          icon={CheckCircle}
        />
        <KPICard
          title="Tasa Rechazo"
          value={`${resumen.tasaRechazoGeneral.toFixed(1)}%`}
          subtitle={`${resumen.rechazados} de ${resumen.totalPedidos} pedidos`}
          trend={resumen.tasaRechazoGeneral <= 10 ? 'up' : 'down'}
          color="red"
          icon={XCircle}
        />
        <KPICard
          title="Utilidad Neta"
          value={formatCOP(resumen.utilidadNeta)}
          subtitle={`Margen: ${resumen.margenNeto.toFixed(1)}%`}
          trend={resumen.utilidadNeta > 0 ? 'up' : 'down'}
          color="blue"
          icon={DollarSign}
        />
        <KPICard
          title="Quemado en Rechazos"
          value={formatCOP(resumen.dineroQuemadoEnRechazos)}
          subtitle={`${formatCOP(resumen.costoPorRechazo)} por rechazo`}
          trend="down"
          color="orange"
          icon={AlertTriangle}
        />
      </div>

      {/* COD vs Prepago comparison */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-navy-800 rounded-2xl border border-slate-200 dark:border-navy-700 p-6">
          <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-4 uppercase tracking-wider">
            Contra Entrega (COD)
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-300">Pedidos</span>
              <span className="font-bold text-slate-800 dark:text-white">{resumen.pedidosCOD}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-300">Tasa entrega</span>
              <span className={`font-bold ${resumen.tasaEntregaCOD >= 80 ? 'text-emerald-500' : resumen.tasaEntregaCOD >= 60 ? 'text-amber-500' : 'text-red-500'}`}>
                {resumen.tasaEntregaCOD.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-navy-700 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${resumen.tasaEntregaCOD >= 80 ? 'bg-emerald-500' : resumen.tasaEntregaCOD >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                style={{ width: `${Math.min(100, resumen.tasaEntregaCOD)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-navy-800 rounded-2xl border border-slate-200 dark:border-navy-700 p-6">
          <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-4 uppercase tracking-wider">
            Prepago
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-300">Pedidos</span>
              <span className="font-bold text-slate-800 dark:text-white">{resumen.pedidosPrepago}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-300">Tasa entrega</span>
              <span className={`font-bold ${resumen.tasaEntregaPrepago >= 90 ? 'text-emerald-500' : 'text-amber-500'}`}>
                {resumen.tasaEntregaPrepago.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-navy-700 rounded-full h-3">
              <div
                className="h-3 rounded-full bg-emerald-500 transition-all"
                style={{ width: `${Math.min(100, resumen.tasaEntregaPrepago)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Cost breakdown */}
      <div className="bg-white dark:bg-navy-800 rounded-2xl border border-slate-200 dark:border-navy-700 p-6">
        <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-4 uppercase tracking-wider">
          Desglose de Costos vs Ingresos
        </h3>
        <div className="space-y-3">
          <CostBar label="Ventas Brutas" value={resumen.ventasBrutas} max={resumen.ventasBrutas} color="bg-emerald-500" />
          <CostBar label="Costo Productos" value={resumen.costoProductos} max={resumen.ventasBrutas} color="bg-blue-500" />
          <CostBar label="Envios" value={resumen.costoEnvios} max={resumen.ventasBrutas} color="bg-indigo-500" />
          <CostBar label="Publicidad" value={resumen.costoPublicidad} max={resumen.ventasBrutas} color="bg-purple-500" />
          <CostBar label="Comisiones" value={resumen.comisiones} max={resumen.ventasBrutas} color="bg-slate-500" />
          <CostBar label="Costo Rechazos" value={resumen.costoDevoluciones} max={resumen.ventasBrutas} color="bg-red-500" isHighlight />
          <div className="border-t border-slate-200 dark:border-navy-700 pt-3 mt-3">
            <CostBar
              label="UTILIDAD NETA"
              value={resumen.utilidadNeta}
              max={resumen.ventasBrutas}
              color={resumen.utilidadNeta >= 0 ? 'bg-emerald-500' : 'bg-red-500'}
              isBold
            />
          </div>
        </div>
      </div>

      {/* ROAS & CPA */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MiniStat label="ROAS" value={`${resumen.roas.toFixed(1)}x`} good={resumen.roas >= 3} />
        <MiniStat label="CPA" value={formatCOP(resumen.cpa)} good={resumen.cpa < resumen.aov * 0.3} />
        <MiniStat label="Ticket Promedio" value={formatCOP(resumen.aov)} good={true} />
        <MiniStat label="Costo por Rechazo" value={formatCOP(resumen.costoPorRechazo)} good={resumen.costoPorRechazo < 15000} />
      </div>
    </div>
  );

  // ============================
  // CIUDADES TAB
  // ============================
  const renderCiudades = () => (
    <div className="space-y-4">
      {ciudades.length === 0 ? (
        <EmptyState message="Sin datos de ciudades. Importa pedidos para ver analytics." />
      ) : (
        <>
          {/* Semaforo resumen */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 text-center">
              <p className="text-2xl font-black text-emerald-600">{ciudades.filter(c => c.recomendacion === 'verde').length}</p>
              <p className="text-xs text-emerald-500 font-medium">Ciudades Seguras</p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-center">
              <p className="text-2xl font-black text-amber-600">{ciudades.filter(c => c.recomendacion === 'amarillo').length}</p>
              <p className="text-xs text-amber-500 font-medium">Con Precaucion</p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-center">
              <p className="text-2xl font-black text-red-600">{ciudades.filter(c => c.recomendacion === 'rojo').length}</p>
              <p className="text-xs text-red-500 font-medium">Evitar / Confirmar</p>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-navy-800 rounded-2xl border border-slate-200 dark:border-navy-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-navy-700">
                    <th className="text-left p-4 text-slate-500 font-medium">Ciudad</th>
                    <th className="text-center p-4 text-slate-500 font-medium">Pedidos</th>
                    <th className="text-center p-4 text-slate-500 font-medium">Entregados</th>
                    <th className="text-center p-4 text-slate-500 font-medium">Rechazados</th>
                    <th className="text-center p-4 text-slate-500 font-medium">Tasa Entrega</th>
                    <th className="text-right p-4 text-slate-500 font-medium">Utilidad</th>
                    <th className="text-right p-4 text-slate-500 font-medium">Perdida Rechazos</th>
                    <th className="text-center p-4 text-slate-500 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {ciudades.map((c, i) => (
                    <tr key={i} className="border-b border-slate-100 dark:border-navy-700/50 hover:bg-slate-50 dark:hover:bg-navy-700/30">
                      <td className="p-4 font-medium text-slate-800 dark:text-white">{c.ciudad}</td>
                      <td className="p-4 text-center text-slate-600 dark:text-slate-300">{c.totalPedidos}</td>
                      <td className="p-4 text-center text-emerald-600 font-medium">{c.entregados}</td>
                      <td className="p-4 text-center text-red-600 font-medium">{c.rechazados}</td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-bold ${
                          c.tasaEntrega >= 80 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                          c.tasaEntrega >= 60 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                          'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {c.tasaEntrega.toFixed(1)}%
                        </span>
                      </td>
                      <td className="p-4 text-right font-medium text-slate-800 dark:text-white">{formatCOP(c.utilidadTotal)}</td>
                      <td className="p-4 text-right font-medium text-red-500">{c.perdidaPorRechazos > 0 ? `-${formatCOP(c.perdidaPorRechazos)}` : '-'}</td>
                      <td className="p-4 text-center">
                        <SemaforoDot color={c.recomendacion} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );

  // ============================
  // TRANSPORTADORAS TAB
  // ============================
  const renderTransportadoras = () => (
    <div className="space-y-4">
      {transportadoras.length === 0 ? (
        <EmptyState message="Sin datos de transportadoras." />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {transportadoras.map((t, i) => (
            <div key={i} className="bg-white dark:bg-navy-800 rounded-2xl border border-slate-200 dark:border-navy-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${
                    t.recomendacion === 'verde' ? 'bg-emerald-100 dark:bg-emerald-900/30' :
                    t.recomendacion === 'amarillo' ? 'bg-amber-100 dark:bg-amber-900/30' :
                    'bg-red-100 dark:bg-red-900/30'
                  }`}>
                    <Truck className={`w-5 h-5 ${
                      t.recomendacion === 'verde' ? 'text-emerald-600' :
                      t.recomendacion === 'amarillo' ? 'text-amber-600' :
                      'text-red-600'
                    }`} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-white">{t.transportadora}</h4>
                    <p className="text-xs text-slate-500">{t.totalPedidos} pedidos</p>
                  </div>
                </div>
                <SemaforoDot color={t.recomendacion} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-slate-500">Tasa Entrega</p>
                  <p className={`text-lg font-bold ${t.tasaEntrega >= 80 ? 'text-emerald-500' : t.tasaEntrega >= 60 ? 'text-amber-500' : 'text-red-500'}`}>
                    {t.tasaEntrega.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Tiempo Prom.</p>
                  <p className="text-lg font-bold text-slate-800 dark:text-white">{t.tiempoPromedioEntrega} dias</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Rechazados</p>
                  <p className="text-lg font-bold text-red-500">{t.rechazados}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Costo Prom.</p>
                  <p className="text-lg font-bold text-slate-800 dark:text-white">{formatCOP(t.costoPromedioEnvio)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ============================
  // PRODUCTOS TAB
  // ============================
  const renderProductos = () => (
    <div className="space-y-4">
      {productos.length === 0 ? (
        <EmptyState message="Sin datos de productos." />
      ) : (
        <div className="bg-white dark:bg-navy-800 rounded-2xl border border-slate-200 dark:border-navy-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-navy-700">
                  <th className="text-left p-4 text-slate-500 font-medium">Producto</th>
                  <th className="text-center p-4 text-slate-500 font-medium">Pedidos</th>
                  <th className="text-center p-4 text-slate-500 font-medium">Entrega %</th>
                  <th className="text-right p-4 text-slate-500 font-medium">Ingreso</th>
                  <th className="text-right p-4 text-slate-500 font-medium">Utilidad</th>
                  <th className="text-center p-4 text-slate-500 font-medium">Margen</th>
                  <th className="text-center p-4 text-slate-500 font-medium">CPA</th>
                  <th className="text-center p-4 text-slate-500 font-medium">Veredicto</th>
                </tr>
              </thead>
              <tbody>
                {productos.map((p, i) => (
                  <tr key={i} className="border-b border-slate-100 dark:border-navy-700/50 hover:bg-slate-50 dark:hover:bg-navy-700/30">
                    <td className="p-4">
                      <p className="font-medium text-slate-800 dark:text-white">{p.productoNombre}</p>
                      {p.productoSKU && <p className="text-xs text-slate-400">{p.productoSKU}</p>}
                    </td>
                    <td className="p-4 text-center text-slate-600 dark:text-slate-300">{p.totalPedidos}</td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-bold ${
                        p.tasaEntrega >= 80 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                        p.tasaEntrega >= 60 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {p.tasaEntrega.toFixed(1)}%
                      </span>
                    </td>
                    <td className="p-4 text-right text-slate-800 dark:text-white">{formatCOP(p.ingresoTotal)}</td>
                    <td className="p-4 text-right">
                      <span className={p.utilidadNeta >= 0 ? 'text-emerald-600 font-medium' : 'text-red-600 font-medium'}>
                        {formatCOP(p.utilidadNeta)}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`font-bold ${p.margenNeto >= 20 ? 'text-emerald-500' : p.margenNeto >= 10 ? 'text-amber-500' : 'text-red-500'}`}>
                        {p.margenNeto.toFixed(1)}%
                      </span>
                    </td>
                    <td className="p-4 text-center text-slate-600 dark:text-slate-300">{formatCOP(p.costoAdquisicionPromedio)}</td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-bold ${
                        p.recomendacion === 'estrella' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                        p.recomendacion === 'rentable' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                        p.recomendacion === 'marginal' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {p.recomendacion === 'estrella' ? '⭐ Estrella' :
                         p.recomendacion === 'rentable' ? '✅ Rentable' :
                         p.recomendacion === 'marginal' ? '⚠️ Marginal' :
                         '❌ Perdedor'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Tab navigation */}
      <div className="flex gap-2 bg-slate-100 dark:bg-navy-800 rounded-xl p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all flex-1 justify-center ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-navy-700 text-slate-800 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      {activeTab === 'resumen' && renderResumen()}
      {activeTab === 'ciudades' && renderCiudades()}
      {activeTab === 'transportadoras' && renderTransportadoras()}
      {activeTab === 'productos' && renderProductos()}
    </div>
  );
};

// ============================================
// SUB-COMPONENTS
// ============================================

const KPICard: React.FC<{
  title: string;
  value: string;
  subtitle: string;
  trend: 'up' | 'down';
  color: string;
  icon: React.ElementType;
}> = ({ title, value, subtitle, trend, color, icon: Icon }) => (
  <div className="bg-white dark:bg-navy-800 rounded-2xl border border-slate-200 dark:border-navy-700 p-5">
    <div className="flex items-center justify-between mb-3">
      <div className={`p-2 rounded-xl bg-${color}-100 dark:bg-${color}-900/30`}>
        <Icon className={`w-5 h-5 text-${color}-500`} />
      </div>
      {trend === 'up' ? (
        <ArrowUpRight className="w-4 h-4 text-emerald-500" />
      ) : (
        <ArrowDownRight className="w-4 h-4 text-red-500" />
      )}
    </div>
    <p className="text-2xl font-black text-slate-800 dark:text-white">{value}</p>
    <p className="text-xs text-slate-500 mt-1">{title}</p>
    <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
  </div>
);

const CostBar: React.FC<{
  label: string;
  value: number;
  max: number;
  color: string;
  isHighlight?: boolean;
  isBold?: boolean;
}> = ({ label, value, max, color, isHighlight, isBold }) => {
  const pct = max > 0 ? (Math.abs(value) / max) * 100 : 0;
  return (
    <div className="flex items-center gap-4">
      <span className={`w-40 text-sm ${isBold ? 'font-bold text-slate-800 dark:text-white' : 'text-slate-600 dark:text-slate-300'} ${isHighlight ? 'text-red-500' : ''}`}>
        {label}
      </span>
      <div className="flex-1 bg-slate-100 dark:bg-navy-700 rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full transition-all ${color}`}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
      <span className={`w-32 text-right text-sm ${isBold ? 'font-bold text-slate-800 dark:text-white' : 'font-medium text-slate-600 dark:text-slate-300'} ${isHighlight ? 'text-red-500' : ''}`}>
        {formatCOP(value)}
      </span>
    </div>
  );
};

const MiniStat: React.FC<{ label: string; value: string; good: boolean }> = ({ label, value, good }) => (
  <div className="bg-white dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-navy-700 p-4 text-center">
    <p className={`text-xl font-black ${good ? 'text-emerald-500' : 'text-red-500'}`}>{value}</p>
    <p className="text-xs text-slate-500 mt-1">{label}</p>
  </div>
);

const SemaforoDot: React.FC<{ color: 'verde' | 'amarillo' | 'rojo' }> = ({ color }) => (
  <div className={`w-3 h-3 rounded-full mx-auto ${
    color === 'verde' ? 'bg-emerald-500 shadow-emerald-500/50' :
    color === 'amarillo' ? 'bg-amber-500 shadow-amber-500/50' :
    'bg-red-500 shadow-red-500/50'
  } shadow-lg`} />
);

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div className="text-center py-16 bg-white dark:bg-navy-800 rounded-2xl border border-slate-200 dark:border-navy-700">
    <BarChart3 className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
    <p className="text-slate-500 dark:text-slate-400">{message}</p>
  </div>
);

export default CODAnalytics;
