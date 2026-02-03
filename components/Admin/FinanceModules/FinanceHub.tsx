// ============================================
// LITPER PRO - FINANCE HUB
// Hub principal de módulos financieros
// ============================================

import React, { useState } from 'react';
import {
  FileText,
  Receipt,
  Users,
  Calculator,
  TrendingUp,
  Upload,
  Wallet,
  ArrowLeft,
  Building2,
  DollarSign,
  PieChart,
  FileSpreadsheet,
} from 'lucide-react';

// Importar módulos financieros
import { InvoiceManager } from './InvoiceManager';
import { ExpenseManager } from './ExpenseManager';
import { PayrollManager } from './PayrollManager';
import { TaxCalculator } from './TaxCalculator';
import { PLReports } from './PLReports';
import { UniversalImporter } from './UniversalImporter';

// ============================================
// TIPOS
// ============================================

type FinanceModule =
  | 'hub'
  | 'facturacion'
  | 'gastos'
  | 'nomina'
  | 'impuestos'
  | 'pyl'
  | 'importador';

interface ModuleCard {
  id: FinanceModule;
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

export const FinanceHub: React.FC = () => {
  const [activeModule, setActiveModule] = useState<FinanceModule>('hub');

  // Definición de módulos
  const modules: ModuleCard[] = [
    {
      id: 'facturacion',
      title: 'Facturación',
      description: 'Crear facturas, consecutivos, PDF, estados',
      icon: FileText,
      color: 'blue',
      gradient: 'from-blue-500 to-indigo-500',
      stats: 'Facturas del mes',
    },
    {
      id: 'gastos',
      title: 'Gestión de Gastos',
      description: 'Registro, categorías, comprobantes',
      icon: Receipt,
      color: 'red',
      gradient: 'from-red-500 to-pink-500',
      stats: 'Gastos registrados',
    },
    {
      id: 'nomina',
      title: 'Nómina y Empleados',
      description: 'Empleados, deducciones, desprendibles',
      icon: Users,
      color: 'purple',
      gradient: 'from-purple-500 to-violet-500',
      stats: 'Empleados activos',
    },
    {
      id: 'impuestos',
      title: 'Impuestos Colombia',
      description: 'IVA, ReteFuente, ICA, calendario fiscal',
      icon: Calculator,
      color: 'amber',
      gradient: 'from-amber-500 to-orange-500',
      stats: 'Próximo vencimiento',
    },
    {
      id: 'pyl',
      title: 'Reportes P&L',
      description: 'Pérdidas y ganancias, comparativos',
      icon: TrendingUp,
      color: 'emerald',
      gradient: 'from-emerald-500 to-teal-500',
      stats: 'Utilidad del mes',
    },
    {
      id: 'importador',
      title: 'Importador Universal',
      description: 'Excel/CSV, mapeo, validación',
      icon: Upload,
      color: 'cyan',
      gradient: 'from-cyan-500 to-blue-500',
      stats: 'Archivos importados',
    },
  ];

  // Renderizar módulo activo
  const renderModule = () => {
    switch (activeModule) {
      case 'facturacion':
        return <InvoiceManager />;
      case 'gastos':
        return <ExpenseManager />;
      case 'nomina':
        return <PayrollManager />;
      case 'impuestos':
        return <TaxCalculator />;
      case 'pyl':
        return <PLReports />;
      case 'importador':
        return <UniversalImporter />;
      default:
        return null;
    }
  };

  // Si hay un módulo activo, mostrarlo
  if (activeModule !== 'hub') {
    return (
      <div className="h-full">
        {/* Header con botón volver */}
        <div className="flex items-center gap-4 p-4 border-b border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900">
          <button
            onClick={() => setActiveModule('hub')}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-slate-700 dark:text-slate-300 rounded-xl font-medium transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al Hub
          </button>
          <div className="flex items-center gap-3">
            {(() => {
              const mod = modules.find(m => m.id === activeModule);
              if (!mod) return null;
              const Icon = mod.icon;
              return (
                <>
                  <div className={`p-2 bg-gradient-to-br ${mod.gradient} rounded-xl`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                      {mod.title}
                    </h2>
                    <p className="text-xs text-slate-500">{mod.description}</p>
                  </div>
                </>
              );
            })()}
          </div>
        </div>

        {/* Contenido del módulo */}
        <div className="h-[calc(100%-73px)] overflow-y-auto">
          {renderModule()}
        </div>
      </div>
    );
  }

  // Hub principal
  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex p-4 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-3xl mb-4 shadow-xl shadow-emerald-500/30">
          <Wallet className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-3xl font-black text-slate-800 dark:text-white mb-2">
          Centro Financiero <span className="text-emerald-500">PRO</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
          Sistema completo de gestión financiera con facturación, gastos, nómina, impuestos y reportes P&L
        </p>
      </div>

      {/* Stats rápidos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Ingresos Mes', value: '$0', icon: DollarSign, color: 'emerald' },
          { label: 'Gastos Mes', value: '$0', icon: Receipt, color: 'red' },
          { label: 'Utilidad', value: '$0', icon: TrendingUp, color: 'blue' },
          { label: 'Impuestos', value: '$0', icon: Building2, color: 'amber' },
        ].map((stat, idx) => (
          <div
            key={idx}
            className={`p-4 bg-gradient-to-br from-${stat.color}-50 to-${stat.color}-100 dark:from-${stat.color}-900/20 dark:to-${stat.color}-900/10 rounded-2xl border border-${stat.color}-200 dark:border-${stat.color}-800`}
          >
            <div className="flex items-center justify-between mb-2">
              <stat.icon className={`w-5 h-5 text-${stat.color}-500`} />
              <span className={`text-xs font-bold text-${stat.color}-600 dark:text-${stat.color}-400`}>
                Este mes
              </span>
            </div>
            <p className="text-2xl font-black text-slate-800 dark:text-white">{stat.value}</p>
            <p className="text-xs text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Grid de módulos */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((module) => {
          const Icon = module.icon;
          return (
            <button
              key={module.id}
              onClick={() => setActiveModule(module.id)}
              className="group p-6 bg-white dark:bg-navy-800 rounded-2xl border border-slate-200 dark:border-navy-700 hover:border-transparent hover:shadow-xl transition-all text-left relative overflow-hidden"
            >
              {/* Gradient overlay on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${module.gradient} opacity-0 group-hover:opacity-5 transition-opacity`} />

              {/* Icon */}
              <div className={`inline-flex p-3 bg-gradient-to-br ${module.gradient} rounded-xl mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                <Icon className="w-6 h-6 text-white" />
              </div>

              {/* Content */}
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-slate-800 group-hover:to-slate-600 dark:group-hover:from-white dark:group-hover:to-slate-300">
                {module.title}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                {module.description}
              </p>

              {/* Footer */}
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

      {/* Quick actions */}
      <div className="flex flex-wrap justify-center gap-4">
        <button
          onClick={() => setActiveModule('facturacion')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-all shadow-lg shadow-blue-500/30"
        >
          <FileText className="w-4 h-4" />
          Nueva Factura
        </button>
        <button
          onClick={() => setActiveModule('gastos')}
          className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-all shadow-lg shadow-red-500/30"
        >
          <Receipt className="w-4 h-4" />
          Registrar Gasto
        </button>
        <button
          onClick={() => setActiveModule('pyl')}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-all shadow-lg shadow-emerald-500/30"
        >
          <PieChart className="w-4 h-4" />
          Ver P&L
        </button>
        <button
          onClick={() => setActiveModule('importador')}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-medium transition-all shadow-lg shadow-cyan-500/30"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Importar Excel
        </button>
      </div>
    </div>
  );
};

export default FinanceHub;
