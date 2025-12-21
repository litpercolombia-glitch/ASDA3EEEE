// components/enterprise/FinanceDashboard.tsx
// Dashboard Financiero con P&L - LITPER PRO Enterprise

import React, { useState, useEffect, useMemo } from 'react';
import {
  DollarSign, TrendingUp, TrendingDown, PieChart, BarChart3, FileText,
  Download, Upload, Calendar, AlertTriangle, Target, ArrowUp, ArrowDown,
  Minus, RefreshCw, Filter, ChevronDown, Plus, Eye, FileSpreadsheet
} from 'lucide-react';
import { financeServiceEnterprise } from '../../services/financeServiceEnterprise';
import { permissionService } from '../../services/permissionService';
import {
  EstadoResultados,
  Ingreso,
  Gasto,
  CategoriaGasto,
  CATEGORIAS_GASTO,
  ArchivoFinanciero,
} from '../../types/finance';
import * as XLSX from 'xlsx';

// ==================== TIPOS ====================

type TabFinance = 'dashboard' | 'ingresos' | 'gastos' | 'pyg' | 'archivos';

// ==================== COMPONENTE PRINCIPAL ====================

export const FinanceDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabFinance>('dashboard');
  const [periodo, setPeriodo] = useState(() => new Date().toISOString().substring(0, 7));
  const [pyg, setPyG] = useState<EstadoResultados | null>(null);
  const [ingresos, setIngresos] = useState<Ingreso[]>([]);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [archivos, setArchivos] = useState<ArchivoFinanciero[]>([]);
  const [showNuevoGasto, setShowNuevoGasto] = useState(false);

  useEffect(() => {
    loadData();
    const unsubscribe = financeServiceEnterprise.subscribe(loadData);
    return unsubscribe;
  }, [periodo]);

  const loadData = () => {
    setPyG(financeServiceEnterprise.calcularEstadoResultados(periodo));
    setIngresos(financeServiceEnterprise.getIngresos({ mes: periodo }));
    setGastos(financeServiceEnterprise.getGastos({ mes: periodo }));
    setArchivos(financeServiceEnterprise.getArchivos());
  };

  const periodosDisponibles = financeServiceEnterprise.getPeriodosDisponibles();
  const nombreMes = new Date(periodo + '-01').toLocaleDateString('es', { month: 'long', year: 'numeric' });

  const tabs = [
    { id: 'dashboard' as TabFinance, label: 'Dashboard', icon: BarChart3 },
    { id: 'pyg' as TabFinance, label: 'P&G', icon: FileText },
    { id: 'ingresos' as TabFinance, label: 'Ingresos', icon: TrendingUp, count: ingresos.length },
    { id: 'gastos' as TabFinance, label: 'Gastos', icon: TrendingDown, count: gastos.length },
    { id: 'archivos' as TabFinance, label: 'Archivos', icon: FileSpreadsheet, count: archivos.length },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-green-500" />
            Centro Financiero
          </h1>
          <p className="text-gray-400 mt-1">Estado de Pérdidas y Ganancias</p>
        </div>

        <div className="flex items-center gap-4">
          <select
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg"
          >
            {periodosDisponibles.length > 0 ? (
              periodosDisponibles.map((p) => (
                <option key={p} value={p}>
                  {new Date(p + '-01').toLocaleDateString('es', { month: 'long', year: 'numeric' })}
                </option>
              ))
            ) : (
              <option value={periodo}>{nombreMes}</option>
            )}
          </select>
          <button
            onClick={loadData}
            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* KPIs Rápidos */}
      {pyg && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <KPICard
            label="Ventas Netas"
            value={pyg.ventasNetas}
            change={pyg.vsAnterior.ventasNetas}
            icon={DollarSign}
            color="blue"
            format="currency"
          />
          <KPICard
            label="Utilidad Neta"
            value={pyg.utilidadNeta}
            change={pyg.vsAnterior.utilidadNeta}
            icon={TrendingUp}
            color={pyg.utilidadNeta >= 0 ? 'green' : 'red'}
            format="currency"
          />
          <KPICard
            label="Margen Neto"
            value={pyg.margenNeto}
            change={pyg.vsAnterior.margenNeto}
            icon={Target}
            color="purple"
            format="percent"
          />
          <KPICard
            label="ROAS"
            value={pyg.roas}
            icon={BarChart3}
            color="amber"
            format="multiplier"
          />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-700 pb-4 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-green-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            <tab.icon className="w-5 h-5" />
            {tab.label}
            {tab.count !== undefined && (
              <span className="ml-1 px-2 py-0.5 text-xs bg-black/30 rounded-full">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'dashboard' && pyg && <DashboardTab pyg={pyg} periodo={periodo} />}
      {activeTab === 'pyg' && pyg && <PyGTab pyg={pyg} nombreMes={nombreMes} />}
      {activeTab === 'ingresos' && <IngresosTab ingresos={ingresos} periodo={periodo} />}
      {activeTab === 'gastos' && (
        <GastosTab
          gastos={gastos}
          periodo={periodo}
          showNuevo={showNuevoGasto}
          setShowNuevo={setShowNuevoGasto}
          onRefresh={loadData}
        />
      )}
      {activeTab === 'archivos' && <ArchivosTab archivos={archivos} onRefresh={loadData} />}
    </div>
  );
};

// ==================== KPI CARD ====================

const KPICard: React.FC<{
  label: string;
  value: number;
  change?: number;
  icon: React.ComponentType<{ className?: string }>;
  color: 'blue' | 'green' | 'red' | 'purple' | 'amber';
  format: 'currency' | 'percent' | 'multiplier';
}> = ({ label, value, change, icon: Icon, color, format }) => {
  const colorClasses = {
    blue: 'from-blue-600 to-blue-800',
    green: 'from-green-600 to-green-800',
    red: 'from-red-600 to-red-800',
    purple: 'from-purple-600 to-purple-800',
    amber: 'from-amber-600 to-amber-800',
  };

  const formatValue = () => {
    switch (format) {
      case 'currency':
        return `$${Math.abs(value).toLocaleString()}`;
      case 'percent':
        return `${value.toFixed(1)}%`;
      case 'multiplier':
        return `${value.toFixed(2)}x`;
    }
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} rounded-xl p-4`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm opacity-80">{label}</p>
          <p className="text-2xl font-bold mt-1">{formatValue()}</p>
        </div>
        <Icon className="w-8 h-8 opacity-50" />
      </div>
      {change !== undefined && (
        <div className={`flex items-center gap-1 mt-2 text-sm ${change >= 0 ? 'text-green-300' : 'text-red-300'}`}>
          {change >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
          {Math.abs(change).toFixed(1)}% vs mes anterior
        </div>
      )}
    </div>
  );
};

// ==================== TAB: DASHBOARD ====================

const DashboardTab: React.FC<{ pyg: EstadoResultados; periodo: string }> = ({ pyg, periodo }) => {
  const gastosPorCategoria = financeServiceEnterprise.getGastosPorCategoria(periodo);
  const tendencia = financeServiceEnterprise.getTendenciaHistorica(6);
  const resumen = financeServiceEnterprise.getResumenFinanciero(periodo);

  const categoriasSorted = Object.entries(gastosPorCategoria)
    .filter(([_, monto]) => monto > 0)
    .sort(([, a], [, b]) => b - a);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Gráfico de tendencia */}
      <div className="bg-gray-800 rounded-xl p-4">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-400" />
          Tendencia de Ventas (6 meses)
        </h3>
        <div className="h-48 flex items-end justify-between gap-2">
          {tendencia.map((mes, index) => {
            const maxVentas = Math.max(...tendencia.map((m) => m.ventas));
            const height = maxVentas > 0 ? (mes.ventas / maxVentas) * 100 : 0;
            const isCurrentMonth = mes.periodo === periodo;

            return (
              <div key={mes.periodo} className="flex-1 flex flex-col items-center">
                <div className="w-full relative" style={{ height: '160px' }}>
                  <div
                    className={`absolute bottom-0 w-full rounded-t transition-all ${
                      isCurrentMonth ? 'bg-green-500' : 'bg-blue-600'
                    }`}
                    style={{ height: `${height}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400 mt-2">
                  {new Date(mes.periodo + '-01').toLocaleDateString('es', { month: 'short' })}
                </span>
                <span className="text-xs font-medium">
                  ${(mes.ventas / 1000000).toFixed(1)}M
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Distribución de gastos */}
      <div className="bg-gray-800 rounded-xl p-4">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <PieChart className="w-5 h-5 text-purple-400" />
          Distribución de Gastos
        </h3>
        <div className="space-y-3">
          {categoriasSorted.slice(0, 6).map(([cat, monto]) => {
            const info = CATEGORIAS_GASTO[cat as CategoriaGasto];
            const totalGastos = Object.values(gastosPorCategoria).reduce((a, b) => a + b, 0);
            const porcentaje = totalGastos > 0 ? (monto / totalGastos) * 100 : 0;

            return (
              <div key={cat}>
                <div className="flex justify-between text-sm mb-1">
                  <span>
                    {info.icono} {info.nombre}
                  </span>
                  <span>${monto.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="h-2 rounded-full"
                    style={{ width: `${porcentaje}%`, backgroundColor: info.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Alertas */}
      {resumen.alertas.length > 0 && (
        <div className="lg:col-span-2 bg-gray-800 rounded-xl p-4">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            Alertas del Negocio
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {resumen.alertas.map((alerta, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg ${
                  alerta.tipo === 'danger'
                    ? 'bg-red-500/20 border border-red-500/50'
                    : alerta.tipo === 'warning'
                    ? 'bg-yellow-500/20 border border-yellow-500/50'
                    : 'bg-blue-500/20 border border-blue-500/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle
                    className={`w-5 h-5 ${
                      alerta.tipo === 'danger' ? 'text-red-400' : alerta.tipo === 'warning' ? 'text-yellow-400' : 'text-blue-400'
                    }`}
                  />
                  <span>{alerta.mensaje}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Métricas adicionales */}
      <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-xl p-4 text-center">
          <p className="text-gray-400 text-sm">Total Órdenes</p>
          <p className="text-2xl font-bold">{pyg.totalOrdenes}</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 text-center">
          <p className="text-gray-400 text-sm">Ticket Promedio</p>
          <p className="text-2xl font-bold">${pyg.aov.toLocaleString()}</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 text-center">
          <p className="text-gray-400 text-sm">CPA</p>
          <p className="text-2xl font-bold">${pyg.cpa.toLocaleString()}</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 text-center">
          <p className="text-gray-400 text-sm">LTV Estimado</p>
          <p className="text-2xl font-bold">${pyg.ltv.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};

// ==================== TAB: P&G ====================

const PyGTab: React.FC<{ pyg: EstadoResultados; nombreMes: string }> = ({ pyg, nombreMes }) => {
  const handleExportPDF = () => {
    alert('Exportar a PDF (próximamente)');
  };

  const handleExportExcel = () => {
    const data = [
      ['ESTADO DE PÉRDIDAS Y GANANCIAS', '', ''],
      [nombreMes.toUpperCase(), '', ''],
      ['', '', ''],
      ['CONCEPTO', 'MONTO', '%'],
      ['', '', ''],
      ['INGRESOS', '', ''],
      ['  Ventas Brutas', pyg.ventasBrutas, ''],
      ['  (-) Descuentos', -pyg.descuentos, ''],
      ['  (-) Devoluciones', -pyg.devoluciones, ''],
      ['= VENTAS NETAS', pyg.ventasNetas, '100.0%'],
      ['', '', ''],
      ['COSTO DE VENTAS', '', ''],
      ['  Costo de Productos', pyg.costoProductos, `${((pyg.costoProductos / pyg.ventasNetas) * 100).toFixed(1)}%`],
      ['  Costo de Envíos', pyg.costoEnvios, `${((pyg.costoEnvios / pyg.ventasNetas) * 100).toFixed(1)}%`],
      ['  Comisiones Plataforma', pyg.comisionesPlataforma, ''],
      ['  Comisiones Pasarela', pyg.comisionesPasarela, ''],
      ['= TOTAL COSTO VENTAS', pyg.totalCostoVentas, `${((pyg.totalCostoVentas / pyg.ventasNetas) * 100).toFixed(1)}%`],
      ['', '', ''],
      ['= UTILIDAD BRUTA', pyg.utilidadBruta, `${pyg.margenBruto.toFixed(1)}%`],
      ['', '', ''],
      ['GASTOS OPERATIVOS', '', ''],
      ['  Publicidad', pyg.gastosPublicidad, ''],
      ['  Nómina', pyg.gastosNomina, ''],
      ['  Plataformas', pyg.gastosPlataformas, ''],
      ['  Oficina', pyg.gastosOficina, ''],
      ['  Logística', pyg.gastosLogistica, ''],
      ['  Otros', pyg.otrosGastosOperativos, ''],
      ['= TOTAL GASTOS OPERATIVOS', pyg.totalGastosOperativos, `${((pyg.totalGastosOperativos / pyg.ventasNetas) * 100).toFixed(1)}%`],
      ['', '', ''],
      ['= UTILIDAD OPERATIVA (EBITDA)', pyg.utilidadOperativa, `${pyg.margenOperativo.toFixed(1)}%`],
      ['', '', ''],
      ['OTROS GASTOS', '', ''],
      ['  Gastos Financieros', pyg.gastosFinancieros, ''],
      ['  Impuestos', pyg.impuestos, ''],
      ['', '', ''],
      ['= UTILIDAD NETA', pyg.utilidadNeta, `${pyg.margenNeto.toFixed(1)}%`],
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'P&G');
    XLSX.writeFile(wb, `PYG_${pyg.periodo}.xlsx`);
  };

  const LineaPyG: React.FC<{ label: string; value: number; isTotal?: boolean; indent?: boolean; showPercent?: boolean }> = ({
    label,
    value,
    isTotal,
    indent,
    showPercent,
  }) => {
    const percent = pyg.ventasNetas > 0 ? (value / pyg.ventasNetas) * 100 : 0;
    return (
      <div className={`flex justify-between py-2 ${isTotal ? 'font-bold border-t border-gray-600' : ''}`}>
        <span className={indent ? 'pl-4' : ''}>{label}</span>
        <div className="flex gap-8">
          <span className={value < 0 ? 'text-red-400' : ''}>
            {value < 0 ? '-' : ''}${Math.abs(value).toLocaleString()}
          </span>
          {showPercent && <span className="text-gray-400 w-16 text-right">{percent.toFixed(1)}%</span>}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Estado de Pérdidas y Ganancias - {nombreMes}</h2>
        <div className="flex gap-2">
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg"
          >
            <FileText className="w-5 h-5" />
            PDF
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg"
          >
            <FileSpreadsheet className="w-5 h-5" />
            Excel
          </button>
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl p-6 font-mono text-sm">
        <div className="text-gray-400 mb-4">INGRESOS</div>
        <LineaPyG label="Ventas Brutas" value={pyg.ventasBrutas} indent />
        <LineaPyG label="(-) Descuentos" value={-pyg.descuentos} indent />
        <LineaPyG label="(-) Devoluciones" value={-pyg.devoluciones} indent />
        <LineaPyG label="= VENTAS NETAS" value={pyg.ventasNetas} isTotal showPercent />

        <div className="text-gray-400 mt-6 mb-4">COSTO DE VENTAS</div>
        <LineaPyG label="Costo de Productos" value={pyg.costoProductos} indent showPercent />
        <LineaPyG label="Costo de Envíos" value={pyg.costoEnvios} indent showPercent />
        <LineaPyG label="Comisiones Plataforma" value={pyg.comisionesPlataforma} indent showPercent />
        <LineaPyG label="Comisiones Pasarela" value={pyg.comisionesPasarela} indent showPercent />
        <LineaPyG label="= TOTAL COSTO VENTAS" value={pyg.totalCostoVentas} isTotal showPercent />

        <div className="mt-4 py-3 bg-blue-900/30 rounded px-4">
          <LineaPyG label="= UTILIDAD BRUTA" value={pyg.utilidadBruta} isTotal showPercent />
        </div>

        <div className="text-gray-400 mt-6 mb-4">GASTOS OPERATIVOS</div>
        <LineaPyG label="Publicidad" value={pyg.gastosPublicidad} indent showPercent />
        <LineaPyG label="Nómina" value={pyg.gastosNomina} indent showPercent />
        <LineaPyG label="Plataformas" value={pyg.gastosPlataformas} indent showPercent />
        <LineaPyG label="Oficina" value={pyg.gastosOficina} indent showPercent />
        <LineaPyG label="Logística" value={pyg.gastosLogistica} indent showPercent />
        <LineaPyG label="Otros" value={pyg.otrosGastosOperativos} indent showPercent />
        <LineaPyG label="= TOTAL GASTOS OPERATIVOS" value={pyg.totalGastosOperativos} isTotal showPercent />

        <div className="mt-4 py-3 bg-purple-900/30 rounded px-4">
          <LineaPyG label="= UTILIDAD OPERATIVA (EBITDA)" value={pyg.utilidadOperativa} isTotal showPercent />
        </div>

        <div className="text-gray-400 mt-6 mb-4">OTROS GASTOS</div>
        <LineaPyG label="Gastos Financieros" value={pyg.gastosFinancieros} indent />
        <LineaPyG label="Impuestos" value={pyg.impuestos} indent />

        <div className={`mt-4 py-3 rounded px-4 ${pyg.utilidadNeta >= 0 ? 'bg-green-900/30' : 'bg-red-900/30'}`}>
          <LineaPyG label="= UTILIDAD NETA" value={pyg.utilidadNeta} isTotal showPercent />
        </div>
      </div>
    </div>
  );
};

// ==================== TAB: INGRESOS ====================

const IngresosTab: React.FC<{ ingresos: Ingreso[]; periodo: string }> = ({ ingresos, periodo }) => {
  const totalIngresos = ingresos.reduce((sum, i) => sum + i.ventaNeta, 0);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-lg">
          <span className="text-gray-400">Total: </span>
          <span className="font-bold text-green-400">${totalIngresos.toLocaleString()}</span>
          <span className="text-gray-400 ml-2">({ingresos.length} registros)</span>
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left">Fecha</th>
              <th className="px-4 py-3 text-left">Cliente</th>
              <th className="px-4 py-3 text-left">Orden</th>
              <th className="px-4 py-3 text-right">Venta Neta</th>
              <th className="px-4 py-3 text-right">Utilidad</th>
              <th className="px-4 py-3 text-left">Fuente</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {ingresos.map((ingreso) => (
              <tr key={ingreso.id} className="hover:bg-gray-700/50">
                <td className="px-4 py-3">{new Date(ingreso.fecha).toLocaleDateString('es')}</td>
                <td className="px-4 py-3">{ingreso.cliente || '-'}</td>
                <td className="px-4 py-3 font-mono text-sm">{ingreso.ordenId || '-'}</td>
                <td className="px-4 py-3 text-right text-green-400">${ingreso.ventaNeta.toLocaleString()}</td>
                <td className="px-4 py-3 text-right">
                  <span className={ingreso.utilidadBruta >= 0 ? 'text-green-400' : 'text-red-400'}>
                    ${ingreso.utilidadBruta.toLocaleString()}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded">{ingreso.fuente}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ==================== TAB: GASTOS ====================

const GastosTab: React.FC<{
  gastos: Gasto[];
  periodo: string;
  showNuevo: boolean;
  setShowNuevo: (show: boolean) => void;
  onRefresh: () => void;
}> = ({ gastos, periodo, showNuevo, setShowNuevo, onRefresh }) => {
  const [nuevoGasto, setNuevoGasto] = useState({
    categoria: 'otros' as CategoriaGasto,
    descripcion: '',
    monto: 0,
    tipoGasto: 'variable' as const,
  });

  const totalGastos = gastos.reduce((sum, g) => sum + g.monto, 0);

  const handleCrearGasto = () => {
    if (nuevoGasto.monto > 0 && nuevoGasto.descripcion) {
      financeServiceEnterprise.crearGasto({
        ...nuevoGasto,
        subcategoria: '',
        deducible: false,
        esRecurrente: false,
        tieneComprobante: false,
        fecha: new Date().toISOString().split('T')[0],
      });
      setNuevoGasto({ categoria: 'otros', descripcion: '', monto: 0, tipoGasto: 'variable' });
      setShowNuevo(false);
      onRefresh();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-lg">
          <span className="text-gray-400">Total: </span>
          <span className="font-bold text-red-400">${totalGastos.toLocaleString()}</span>
          <span className="text-gray-400 ml-2">({gastos.length} registros)</span>
        </div>
        <button
          onClick={() => setShowNuevo(true)}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg"
        >
          <Plus className="w-5 h-5" />
          Nuevo Gasto
        </button>
      </div>

      {showNuevo && (
        <div className="bg-gray-800 rounded-xl p-4">
          <h3 className="font-bold mb-4">Registrar Gasto</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              value={nuevoGasto.categoria}
              onChange={(e) => setNuevoGasto({ ...nuevoGasto, categoria: e.target.value as CategoriaGasto })}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg"
            >
              {Object.entries(CATEGORIAS_GASTO).map(([key, info]) => (
                <option key={key} value={key}>
                  {info.icono} {info.nombre}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Descripción"
              value={nuevoGasto.descripcion}
              onChange={(e) => setNuevoGasto({ ...nuevoGasto, descripcion: e.target.value })}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg"
            />
            <input
              type="number"
              placeholder="Monto"
              value={nuevoGasto.monto || ''}
              onChange={(e) => setNuevoGasto({ ...nuevoGasto, monto: parseFloat(e.target.value) || 0 })}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg"
            />
            <div className="flex gap-2">
              <button onClick={handleCrearGasto} className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg">
                Guardar
              </button>
              <button onClick={() => setShowNuevo(false)} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gray-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left">Fecha</th>
              <th className="px-4 py-3 text-left">Categoría</th>
              <th className="px-4 py-3 text-left">Descripción</th>
              <th className="px-4 py-3 text-right">Monto</th>
              <th className="px-4 py-3 text-left">Tipo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {gastos.map((gasto) => {
              const info = CATEGORIAS_GASTO[gasto.categoria];
              return (
                <tr key={gasto.id} className="hover:bg-gray-700/50">
                  <td className="px-4 py-3">{new Date(gasto.fecha).toLocaleDateString('es')}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-sm" style={{ backgroundColor: info.color + '30', color: info.color }}>
                      {info.icono} {info.nombre}
                    </span>
                  </td>
                  <td className="px-4 py-3">{gasto.descripcion}</td>
                  <td className="px-4 py-3 text-right text-red-400">${gasto.monto.toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-400 text-sm">{gasto.tipoGasto}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ==================== TAB: ARCHIVOS ====================

const ArchivosTab: React.FC<{ archivos: ArchivoFinanciero[]; onRefresh: () => void }> = ({ archivos, onRefresh }) => {
  const handleImportDropi = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = new Uint8Array(event.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet);

      const resultado = financeServiceEnterprise.importarDropi(jsonData, file.name);
      alert(`Importación completada:\n- ${resultado.registros} registros importados\n- ${resultado.errores.length} errores`);
      onRefresh();
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImportGastos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = new Uint8Array(event.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet);

      const resultado = financeServiceEnterprise.importarGastos(jsonData, file.name);
      alert(`Importación completada:\n- ${resultado.registros} registros importados\n- ${resultado.errores.length} errores`);
      onRefresh();
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-800 rounded-xl p-6">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5 text-green-400" />
            Importar Ventas (Dropi)
          </h3>
          <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-600 rounded-lg hover:border-green-500 cursor-pointer transition-colors">
            <FileSpreadsheet className="w-12 h-12 text-gray-400 mb-2" />
            <span className="text-gray-400">Arrastra o selecciona archivo Excel</span>
            <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImportDropi} />
          </label>
        </div>

        <div className="bg-gray-800 rounded-xl p-6">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5 text-red-400" />
            Importar Gastos
          </h3>
          <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-600 rounded-lg hover:border-red-500 cursor-pointer transition-colors">
            <FileSpreadsheet className="w-12 h-12 text-gray-400 mb-2" />
            <span className="text-gray-400">Arrastra o selecciona archivo Excel</span>
            <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImportGastos} />
          </label>
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl p-4">
        <h3 className="font-bold mb-4">Archivos Importados</h3>
        {archivos.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No hay archivos importados</p>
        ) : (
          <div className="space-y-2">
            {archivos.map((archivo) => (
              <div key={archivo.id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-8 h-8 text-green-400" />
                  <div>
                    <p className="font-medium">{archivo.nombre}</p>
                    <p className="text-sm text-gray-400">
                      {archivo.registrosImportados} registros | ${archivo.montoTotal.toLocaleString()} |{' '}
                      {new Date(archivo.fechaSubida).toLocaleDateString('es')}
                    </p>
                  </div>
                </div>
                <span
                  className={`px-2 py-1 rounded text-sm ${
                    archivo.estado === 'completado'
                      ? 'bg-green-500/20 text-green-400'
                      : archivo.estado === 'error'
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-yellow-500/20 text-yellow-400'
                  }`}
                >
                  {archivo.estado}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FinanceDashboard;
