'use client';

import React, { useState } from 'react';
import {
  Wallet,
  FileText,
  Receipt,
  Users,
  Calculator,
  TrendingUp,
  Upload,
  ArrowLeft,
  DollarSign,
  PiggyBank,
  CreditCard,
  BarChart3,
} from 'lucide-react';

// Import all finance modules
import { FinanceHub } from '../FinanceModules/FinanceHub';
import { InvoiceManager } from '../FinanceModules/InvoiceManager';
import { ExpenseManager } from '../FinanceModules/ExpenseManager';
import { PayrollManager } from '../FinanceModules/PayrollManager';
import { TaxCalculator } from '../FinanceModules/TaxCalculator';
import { PLReports } from '../FinanceModules/PLReports';
import { UniversalImporter } from '../FinanceModules/UniversalImporter';

// ============================================
// ENTERPRISE FINANCE MODULE
// Wrapper que integra todos los módulos financieros
// ============================================

type FinanceView = 'hub' | 'invoices' | 'expenses' | 'payroll' | 'taxes' | 'reports' | 'importer';

interface QuickStat {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: React.ElementType;
  color: string;
}

export function EnterpriseFinanceModule() {
  const [currentView, setCurrentView] = useState<FinanceView>('hub');

  const quickStats: QuickStat[] = [
    { label: 'Ingresos del Mes', value: '$24.5M', change: '+12%', trend: 'up', icon: DollarSign, color: 'emerald' },
    { label: 'Gastos del Mes', value: '$8.2M', change: '+5%', trend: 'up', icon: CreditCard, color: 'amber' },
    { label: 'Nómina Pendiente', value: '$3.8M', change: '0%', trend: 'up', icon: Users, color: 'violet' },
    { label: 'Utilidad Neta', value: '$12.5M', change: '+18%', trend: 'up', icon: PiggyBank, color: 'blue' },
  ];

  const modules = [
    { id: 'invoices', label: 'Facturación', icon: FileText, description: 'Crear y gestionar facturas', color: 'violet' },
    { id: 'expenses', label: 'Gastos', icon: Receipt, description: 'Control de gastos empresariales', color: 'amber' },
    { id: 'payroll', label: 'Nómina', icon: Users, description: 'Gestión de nómina y empleados', color: 'blue' },
    { id: 'taxes', label: 'Impuestos', icon: Calculator, description: 'Calculadora de impuestos Colombia', color: 'red' },
    { id: 'reports', label: 'Reportes P&L', icon: TrendingUp, description: 'Estados de pérdidas y ganancias', color: 'emerald' },
    { id: 'importer', label: 'Importador', icon: Upload, description: 'Importar datos Excel/CSV', color: 'cyan' },
  ];

  const renderCurrentView = () => {
    switch (currentView) {
      case 'hub':
        return (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-4">
              {quickStats.map((stat, index) => (
                <div
                  key={index}
                  className="bg-white/5 rounded-xl p-4 border border-white/10"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400 text-sm">{stat.label}</span>
                    <stat.icon className={`w-5 h-5 text-${stat.color}-400`} />
                  </div>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <div className={`flex items-center gap-1 text-xs ${stat.trend === 'up' ? 'text-emerald-400' : 'text-red-400'} mt-1`}>
                    <TrendingUp className={`w-3 h-3 ${stat.trend === 'down' ? 'rotate-180' : ''}`} />
                    {stat.change} vs mes anterior
                  </div>
                </div>
              ))}
            </div>

            {/* Module Cards */}
            <div className="grid grid-cols-3 gap-4">
              {modules.map((module) => (
                <button
                  key={module.id}
                  onClick={() => setCurrentView(module.id as FinanceView)}
                  className="bg-white/5 rounded-xl p-6 border border-white/10 hover:border-violet-500/30 transition-all text-left group"
                >
                  <div className={`p-3 bg-${module.color}-500/20 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform`}>
                    <module.icon className={`w-6 h-6 text-${module.color}-400`} />
                  </div>
                  <h3 className="text-white font-semibold mb-1">{module.label}</h3>
                  <p className="text-sm text-gray-400">{module.description}</p>
                </button>
              ))}
            </div>

            {/* Recent Activity */}
            <div className="bg-white/5 rounded-xl border border-white/10 p-4">
              <h3 className="text-white font-medium mb-4">Actividad Financiera Reciente</h3>
              <div className="space-y-3">
                {[
                  { action: 'Factura LITPER-2025-0043 creada', amount: '$2,450,000', time: 'Hace 5 min', type: 'invoice' },
                  { action: 'Pago recibido de Empresa ABC', amount: '$1,200,000', time: 'Hace 1 hora', type: 'payment' },
                  { action: 'Gasto registrado: Marketing', amount: '-$350,000', time: 'Hace 2 horas', type: 'expense' },
                  { action: 'Nómina enero procesada', amount: '$3,800,000', time: 'Hace 1 día', type: 'payroll' },
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        item.type === 'invoice' ? 'bg-violet-500/20' :
                        item.type === 'payment' ? 'bg-emerald-500/20' :
                        item.type === 'expense' ? 'bg-amber-500/20' :
                        'bg-blue-500/20'
                      }`}>
                        {item.type === 'invoice' && <FileText className="w-4 h-4 text-violet-400" />}
                        {item.type === 'payment' && <DollarSign className="w-4 h-4 text-emerald-400" />}
                        {item.type === 'expense' && <Receipt className="w-4 h-4 text-amber-400" />}
                        {item.type === 'payroll' && <Users className="w-4 h-4 text-blue-400" />}
                      </div>
                      <div>
                        <p className="text-sm text-white">{item.action}</p>
                        <p className="text-xs text-gray-500">{item.time}</p>
                      </div>
                    </div>
                    <span className={`text-sm font-medium ${item.amount.startsWith('-') ? 'text-red-400' : 'text-emerald-400'}`}>
                      {item.amount}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'invoices':
        return <InvoiceManager />;
      case 'expenses':
        return <ExpenseManager />;
      case 'payroll':
        return <PayrollManager />;
      case 'taxes':
        return <TaxCalculator />;
      case 'reports':
        return <PLReports />;
      case 'importer':
        return <UniversalImporter />;
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col bg-black/20 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          {currentView !== 'hub' && (
            <button
              onClick={() => setCurrentView('hub')}
              className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="p-2 bg-emerald-500/20 rounded-lg">
            <Wallet className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">
              {currentView === 'hub' ? 'Centro Financiero PRO' : modules.find(m => m.id === currentView)?.label}
            </h2>
            <p className="text-xs text-gray-400">
              {currentView === 'hub' ? 'Gestión financiera integral' : modules.find(m => m.id === currentView)?.description}
            </p>
          </div>
        </div>

        {/* Quick Navigation */}
        {currentView === 'hub' && (
          <div className="flex gap-2 mt-4">
            {modules.slice(0, 4).map(module => (
              <button
                key={module.id}
                onClick={() => setCurrentView(module.id as FinanceView)}
                className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-gray-400 hover:text-white transition-colors"
              >
                <module.icon className="w-4 h-4" />
                {module.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {renderCurrentView()}
      </div>
    </div>
  );
}

export default EnterpriseFinanceModule;
