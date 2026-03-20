// ============================================
// DROPSHIPPER HUB
// Centro de Inteligencia para Dropshippers
// "Chatea Pro te ayuda a VENDER. Nosotros te ayudamos a saber si estás GANANDO."
// ============================================

import React, { useState, useRef } from 'react';
import {
  BarChart3,
  Calculator,
  Star,
  Truck,
  TrendingUp,
  ArrowLeft,
  Upload,
  Calendar,
  Package,
  DollarSign,
  AlertTriangle,
  FileSpreadsheet,
} from 'lucide-react';
import { useDropshippingStore, formatCOP } from '../../../services/dropshippingService';
import type { DropshipperView } from '../../../types/dropshipping';

// Lazy imports for code splitting
import { CODAnalytics } from './CODAnalytics';
import { ProfitCalculator } from './ProfitCalculator';
import { ProductScorecard } from './ProductScorecard';
import { SupplierMonitor } from './SupplierMonitor';

// ============================================
// TIPOS
// ============================================

interface ModuleCard {
  id: DropshipperView;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  gradient: string;
  stats?: string;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export const DropshipperHub: React.FC = () => {
  const [activeModule, setActiveModule] = useState<DropshipperView>('hub');
  const { pedidos, selectedMonth, setSelectedMonth, importPedidos } = useDropshippingStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentMonthPedidos = pedidos.filter((p) => p.mes === selectedMonth);
  const entregados = currentMonthPedidos.filter((p) => p.estadoCOD === 'entregado');
  const rechazados = currentMonthPedidos.filter((p) => ['rechazado', 'devuelto', 'no_contactado'].includes(p.estadoCOD));

  // Module definitions
  const modules: ModuleCard[] = [
    {
      id: 'cod_analytics',
      title: 'Analytics COD',
      description: 'Tasa de rechazo por ciudad, transportadora y producto. El costo oculto que nadie te muestra.',
      icon: BarChart3,
      color: 'blue',
      gradient: 'from-blue-500 to-indigo-500',
      stats: `${currentMonthPedidos.length} pedidos este mes`,
    },
    {
      id: 'profit_calculator',
      title: 'Calculadora de Rentabilidad',
      description: 'Calcula tu ganancia REAL por pedido incluyendo rechazos, ads, y todos los costos ocultos.',
      icon: Calculator,
      color: 'emerald',
      gradient: 'from-emerald-500 to-teal-500',
      stats: 'Antes de vender, sabe si ganas',
    },
    {
      id: 'product_scorecard',
      title: 'Scorecard de Productos',
      description: 'Ranking de tus productos: cuales escalar, mantener, optimizar o eliminar.',
      icon: Star,
      color: 'amber',
      gradient: 'from-amber-500 to-orange-500',
      stats: `${new Set(currentMonthPedidos.map(p => p.productoNombre)).size} productos`,
    },
    {
      id: 'supplier_monitor',
      title: 'Monitor de Proveedores',
      description: 'Calificacion de proveedores por cumplimiento, calidad y tiempos.',
      icon: Truck,
      color: 'purple',
      gradient: 'from-purple-500 to-violet-500',
      stats: `${new Set(currentMonthPedidos.filter(p => p.proveedorNombre).map(p => p.proveedorNombre)).size} proveedores`,
    },
  ];

  // Handle Excel import
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const XLSX = await import('xlsx');
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(sheet);
      const count = importPedidos(jsonData, 'excel');
      alert(`Se importaron ${count} pedidos exitosamente.`);
    } catch (err) {
      alert('Error al importar archivo. Verifica el formato.');
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Render active module
  const renderModule = () => {
    switch (activeModule) {
      case 'cod_analytics':
        return <CODAnalytics />;
      case 'profit_calculator':
        return <ProfitCalculator />;
      case 'product_scorecard':
        return <ProductScorecard />;
      case 'supplier_monitor':
        return <SupplierMonitor />;
      default:
        return null;
    }
  };

  // Active module view
  if (activeModule !== 'hub') {
    const mod = modules.find((m) => m.id === activeModule);
    return (
      <div className="h-full">
        {/* Header */}
        <div className="flex items-center gap-4 p-4 border-b border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900">
          <button
            onClick={() => setActiveModule('hub')}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-slate-700 dark:text-slate-300 rounded-xl font-medium transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Hub
          </button>
          {mod && (
            <div className="flex items-center gap-3">
              <div className={`p-2 bg-gradient-to-br ${mod.gradient} rounded-xl`}>
                <mod.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">{mod.title}</h2>
                <p className="text-xs text-slate-500">{mod.description}</p>
              </div>
            </div>
          )}

          {/* Month selector */}
          <div className="ml-auto flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-lg px-3 py-1.5 text-sm text-slate-700 dark:text-slate-300"
            />
          </div>
        </div>

        {/* Content */}
        <div className="h-[calc(100%-73px)] overflow-y-auto p-6">
          {renderModule()}
        </div>
      </div>
    );
  }

  // ============================
  // HUB VIEW
  // ============================
  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl mb-4 shadow-xl shadow-blue-500/30">
          <TrendingUp className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-3xl font-black text-slate-800 dark:text-white mb-2">
          Dropshipper <span className="text-blue-500">Intelligence</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
          Chatea Pro te ayuda a vender. Nosotros te ayudamos a saber si estas ganando.
        </p>
      </div>

      {/* Month selector + Import */}
      <div className="flex flex-wrap items-center justify-center gap-4">
        <div className="flex items-center gap-2 bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl px-4 py-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-transparent text-sm text-slate-700 dark:text-slate-300 font-medium"
          />
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-all shadow-lg shadow-blue-500/30"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Importar Pedidos (Excel)
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <QuickStat
          label="Pedidos"
          value={String(currentMonthPedidos.length)}
          icon={Package}
          color="blue"
        />
        <QuickStat
          label="Entregados"
          value={String(entregados.length)}
          icon={TrendingUp}
          color="emerald"
          subtitle={currentMonthPedidos.length > 0 ? `${((entregados.length / currentMonthPedidos.length) * 100).toFixed(1)}%` : undefined}
        />
        <QuickStat
          label="Rechazados"
          value={String(rechazados.length)}
          icon={AlertTriangle}
          color="red"
          subtitle={currentMonthPedidos.length > 0 ? `${((rechazados.length / currentMonthPedidos.length) * 100).toFixed(1)}%` : undefined}
        />
        <QuickStat
          label="Utilidad"
          value={formatCOP(entregados.reduce((s, p) => s + p.utilidadNeta, 0))}
          icon={DollarSign}
          color="emerald"
        />
      </div>

      {/* Module cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {modules.map((module) => {
          const Icon = module.icon;
          return (
            <button
              key={module.id}
              onClick={() => setActiveModule(module.id)}
              className="group p-6 bg-white dark:bg-navy-800 rounded-2xl border border-slate-200 dark:border-navy-700 hover:border-transparent hover:shadow-xl transition-all text-left relative overflow-hidden"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${module.gradient} opacity-0 group-hover:opacity-5 transition-opacity`} />

              <div className={`inline-flex p-3 bg-gradient-to-br ${module.gradient} rounded-xl mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                <Icon className="w-6 h-6 text-white" />
              </div>

              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">
                {module.title}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                {module.description}
              </p>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">{module.stats}</span>
                <span className={`text-xs font-bold text-${module.color}-500 group-hover:translate-x-1 transition-transform`}>
                  Abrir →
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Empty state / Getting started */}
      {currentMonthPedidos.length === 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-2xl p-8 text-center">
          <Upload className="w-12 h-12 text-blue-400 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-blue-700 dark:text-blue-400 mb-2">Empieza importando tus pedidos</h3>
          <p className="text-sm text-blue-600/70 dark:text-blue-400/70 max-w-md mx-auto mb-4">
            Sube un Excel con tus pedidos de Dropi o captura manual. Las columnas que reconocemos:
            ordenId, cliente, ciudad, producto, precioVenta, costoProducto, costoEnvio, estadoCOD, transportadora, fechaPedido.
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-all shadow-lg shadow-blue-500/30"
          >
            <FileSpreadsheet className="w-5 h-5" />
            Importar Excel
          </button>
        </div>
      )}
    </div>
  );
};

// ============================================
// SUB-COMPONENTS
// ============================================

const QuickStat: React.FC<{
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
  subtitle?: string;
}> = ({ label, value, icon: Icon, color, subtitle }) => (
  <div className={`p-4 bg-gradient-to-br from-${color}-50 to-${color}-100 dark:from-${color}-900/20 dark:to-${color}-900/10 rounded-2xl border border-${color}-200 dark:border-${color}-800`}>
    <div className="flex items-center justify-between mb-2">
      <Icon className={`w-5 h-5 text-${color}-500`} />
      {subtitle && (
        <span className={`text-xs font-bold text-${color}-600 dark:text-${color}-400`}>{subtitle}</span>
      )}
    </div>
    <p className="text-2xl font-black text-slate-800 dark:text-white">{value}</p>
    <p className="text-xs text-slate-500">{label}</p>
  </div>
);

export default DropshipperHub;
