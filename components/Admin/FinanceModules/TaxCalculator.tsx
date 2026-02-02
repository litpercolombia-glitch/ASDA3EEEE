// ============================================
// LITPER PRO - TAX CALCULATOR COLOMBIA
// Sistema de impuestos Colombia
// ============================================

import React, { useState, useEffect, useMemo } from 'react';
import {
  Calculator,
  Calendar,
  Bell,
  Building2,
  DollarSign,
  Percent,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Download,
  Plus,
  X,
  Info,
  MapPin,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';

// ============================================
// TIPOS E INTERFACES
// ============================================

interface TaxRecord {
  id: string;
  type: 'iva' | 'retefuente' | 'ica';
  period: string;
  baseAmount: number;
  taxAmount: number;
  description: string;
  createdAt: string;
}

interface FiscalDeadline {
  id: string;
  title: string;
  date: string;
  type: 'iva' | 'retefuente' | 'ica' | 'renta' | 'otro';
  description: string;
  completed: boolean;
}

// ============================================
// CONSTANTES
// ============================================

const STORAGE_KEY = 'litper_tax_records';
const DEADLINES_KEY = 'litper_tax_deadlines';

// IVA
const IVA_RATE = 0.19;

// Retención en la fuente por actividad
const RETEFUENTE_RATES: Record<string, { name: string; rate: number; threshold: number }> = {
  compras: { name: 'Compras generales', rate: 0.025, threshold: 1036000 },
  servicios: { name: 'Servicios generales', rate: 0.04, threshold: 156000 },
  honorarios: { name: 'Honorarios profesionales', rate: 0.11, threshold: 0 },
  arrendamientos: { name: 'Arrendamientos', rate: 0.035, threshold: 1036000 },
  transporte: { name: 'Transporte de carga', rate: 0.01, threshold: 156000 },
  otros: { name: 'Otros conceptos', rate: 0.035, threshold: 156000 },
};

// ICA por municipio (tarifas principales)
const ICA_RATES: Record<string, { name: string; rate: number }> = {
  bogota: { name: 'Bogotá D.C.', rate: 0.0069 },
  medellin: { name: 'Medellín', rate: 0.007 },
  cali: { name: 'Cali', rate: 0.0066 },
  barranquilla: { name: 'Barranquilla', rate: 0.007 },
  cartagena: { name: 'Cartagena', rate: 0.007 },
  bucaramanga: { name: 'Bucaramanga', rate: 0.005 },
  pereira: { name: 'Pereira', rate: 0.007 },
  manizales: { name: 'Manizales', rate: 0.007 },
  otro: { name: 'Otro municipio', rate: 0.007 },
};

// Calendario fiscal 2024-2025
const FISCAL_CALENDAR_2024: FiscalDeadline[] = [
  { id: '1', title: 'Declaración IVA Bimestre Ene-Feb', date: '2024-03-15', type: 'iva', description: 'Declaración y pago del IVA bimestral', completed: true },
  { id: '2', title: 'Declaración IVA Bimestre Mar-Abr', date: '2024-05-15', type: 'iva', description: 'Declaración y pago del IVA bimestral', completed: true },
  { id: '3', title: 'Declaración IVA Bimestre May-Jun', date: '2024-07-15', type: 'iva', description: 'Declaración y pago del IVA bimestral', completed: true },
  { id: '4', title: 'Declaración IVA Bimestre Jul-Ago', date: '2024-09-13', type: 'iva', description: 'Declaración y pago del IVA bimestral', completed: true },
  { id: '5', title: 'Declaración IVA Bimestre Sep-Oct', date: '2024-11-15', type: 'iva', description: 'Declaración y pago del IVA bimestral', completed: true },
  { id: '6', title: 'Declaración IVA Bimestre Nov-Dic', date: '2025-01-17', type: 'iva', description: 'Declaración y pago del IVA bimestral', completed: false },
  { id: '7', title: 'Declaración IVA Bimestre Ene-Feb 2025', date: '2025-03-14', type: 'iva', description: 'Declaración y pago del IVA bimestral', completed: false },
  { id: '8', title: 'Declaración Renta 2024', date: '2025-08-15', type: 'renta', description: 'Declaración de renta personas jurídicas', completed: false },
];

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export const TaxCalculator: React.FC = () => {
  // Estados
  const [taxRecords, setTaxRecords] = useState<TaxRecord[]>([]);
  const [deadlines, setDeadlines] = useState<FiscalDeadline[]>(FISCAL_CALENDAR_2024);
  const [activeTab, setActiveTab] = useState<'calculadora' | 'calendario' | 'resumen'>('calculadora');
  const [selectedTaxType, setSelectedTaxType] = useState<'iva' | 'retefuente' | 'ica'>('iva');
  const [showAddDeadline, setShowAddDeadline] = useState(false);

  // Form states
  const [calcForm, setCalcForm] = useState({
    baseAmount: 0,
    activity: 'compras',
    municipality: 'bogota',
    description: '',
  });

  const [deadlineForm, setDeadlineForm] = useState({
    title: '',
    date: '',
    type: 'iva' as FiscalDeadline['type'],
    description: '',
  });

  // Cargar datos
  useEffect(() => {
    const savedRecords = localStorage.getItem(STORAGE_KEY);
    const savedDeadlines = localStorage.getItem(DEADLINES_KEY);
    if (savedRecords) setTaxRecords(JSON.parse(savedRecords));
    if (savedDeadlines) setDeadlines(JSON.parse(savedDeadlines));
  }, []);

  // Guardar datos
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(taxRecords));
  }, [taxRecords]);

  useEffect(() => {
    localStorage.setItem(DEADLINES_KEY, JSON.stringify(deadlines));
  }, [deadlines]);

  // Formatear moneda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Calcular impuesto
  const calculateTax = (): { taxAmount: number; rate: number; message: string } => {
    const { baseAmount, activity, municipality } = calcForm;

    if (selectedTaxType === 'iva') {
      return {
        taxAmount: Math.round(baseAmount * IVA_RATE),
        rate: IVA_RATE * 100,
        message: `IVA del 19% sobre base gravable`,
      };
    }

    if (selectedTaxType === 'retefuente') {
      const config = RETEFUENTE_RATES[activity];
      if (baseAmount < config.threshold && config.threshold > 0) {
        return {
          taxAmount: 0,
          rate: 0,
          message: `No aplica retención. Monto menor a ${formatCurrency(config.threshold)}`,
        };
      }
      return {
        taxAmount: Math.round(baseAmount * config.rate),
        rate: config.rate * 100,
        message: `Retención ${config.name} (${config.rate * 100}%)`,
      };
    }

    if (selectedTaxType === 'ica') {
      const config = ICA_RATES[municipality];
      return {
        taxAmount: Math.round(baseAmount * config.rate),
        rate: config.rate * 100,
        message: `ICA ${config.name} (${(config.rate * 100).toFixed(2)}%)`,
      };
    }

    return { taxAmount: 0, rate: 0, message: '' };
  };

  const taxResult = useMemo(() => calculateTax(), [calcForm, selectedTaxType]);

  // Guardar cálculo
  const saveTaxRecord = () => {
    if (calcForm.baseAmount <= 0) return;

    const record: TaxRecord = {
      id: Date.now().toString(),
      type: selectedTaxType,
      period: new Date().toISOString().slice(0, 7),
      baseAmount: calcForm.baseAmount,
      taxAmount: taxResult.taxAmount,
      description: calcForm.description || taxResult.message,
      createdAt: new Date().toISOString(),
    };

    setTaxRecords(prev => [record, ...prev]);
    setCalcForm({ baseAmount: 0, activity: 'compras', municipality: 'bogota', description: '' });
  };

  // Agregar deadline
  const addDeadline = () => {
    const deadline: FiscalDeadline = {
      id: Date.now().toString(),
      ...deadlineForm,
      completed: false,
    };
    setDeadlines(prev => [...prev, deadline].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    setDeadlineForm({ title: '', date: '', type: 'iva', description: '' });
    setShowAddDeadline(false);
  };

  // Toggle deadline completado
  const toggleDeadlineComplete = (id: string) => {
    setDeadlines(prev =>
      prev.map(d => d.id === id ? { ...d, completed: !d.completed } : d)
    );
  };

  // Eliminar registro
  const deleteRecord = (id: string) => {
    if (confirm('¿Eliminar este registro?')) {
      setTaxRecords(prev => prev.filter(r => r.id !== id));
    }
  };

  // Próximos vencimientos
  const upcomingDeadlines = useMemo(() => {
    const today = new Date();
    return deadlines
      .filter(d => !d.completed && new Date(d.date) >= today)
      .slice(0, 5);
  }, [deadlines]);

  // Resumen bimestral IVA
  const bimonthlyIVASummary = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Determinar el bimestre actual
    const bimestreStart = currentMonth % 2 === 0 ? currentMonth : currentMonth - 1;
    const bimestreEnd = bimestreStart + 1;

    const startDate = new Date(currentYear, bimestreStart, 1);
    const endDate = new Date(currentYear, bimestreEnd + 1, 0);

    const ivaRecords = taxRecords.filter(r => {
      const recordDate = new Date(r.createdAt);
      return r.type === 'iva' && recordDate >= startDate && recordDate <= endDate;
    });

    const totalBase = ivaRecords.reduce((sum, r) => sum + r.baseAmount, 0);
    const totalIva = ivaRecords.reduce((sum, r) => sum + r.taxAmount, 0);

    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const periodName = `${months[bimestreStart]}-${months[bimestreEnd]} ${currentYear}`;

    return { periodName, totalBase, totalIva, count: ivaRecords.length };
  }, [taxRecords]);

  // Días hasta próximo vencimiento
  const daysUntilDeadline = (date: string): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadline = new Date(date);
    deadline.setHours(0, 0, 0, 0);
    return Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Calculator className="w-7 h-7 text-amber-500" />
            Impuestos Colombia
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            IVA, Retención en la fuente, ICA y calendario fiscal
          </p>
        </div>
      </div>

      {/* Alert próximo vencimiento */}
      {upcomingDeadlines.length > 0 && (
        <div className={`p-4 rounded-xl border flex items-start gap-3 ${
          daysUntilDeadline(upcomingDeadlines[0].date) <= 7
            ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            : daysUntilDeadline(upcomingDeadlines[0].date) <= 15
            ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
            : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
        }`}>
          <Bell className={`w-5 h-5 flex-shrink-0 ${
            daysUntilDeadline(upcomingDeadlines[0].date) <= 7 ? 'text-red-500' :
            daysUntilDeadline(upcomingDeadlines[0].date) <= 15 ? 'text-amber-500' : 'text-blue-500'
          }`} />
          <div className="flex-1">
            <p className="font-bold text-slate-700 dark:text-white">
              {upcomingDeadlines[0].title}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Vence: {upcomingDeadlines[0].date} ({daysUntilDeadline(upcomingDeadlines[0].date)} días)
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-navy-700">
        {[
          { id: 'calculadora', label: 'Calculadora', icon: Calculator },
          { id: 'calendario', label: 'Calendario Fiscal', icon: Calendar },
          { id: 'resumen', label: 'Resumen Declaración', icon: FileText },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 font-medium transition-all border-b-2 -mb-[2px] ${
                activeTab === tab.id
                  ? 'text-amber-600 border-amber-500'
                  : 'text-slate-500 border-transparent hover:text-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB: CALCULADORA */}
      {activeTab === 'calculadora' && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Calculator */}
          <div className="space-y-6">
            {/* Tax Type Selector */}
            <div className="flex gap-2">
              {[
                { id: 'iva', label: 'IVA 19%', icon: Percent },
                { id: 'retefuente', label: 'Retención', icon: DollarSign },
                { id: 'ica', label: 'ICA', icon: MapPin },
              ].map(type => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.id}
                    onClick={() => setSelectedTaxType(type.id as any)}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${
                      selectedTaxType === type.id
                        ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30'
                        : 'bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-slate-700 dark:text-slate-300 hover:border-amber-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {type.label}
                  </button>
                );
              })}
            </div>

            {/* Form */}
            <div className="p-6 bg-white dark:bg-navy-800 rounded-2xl border border-slate-200 dark:border-navy-700 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Base Gravable *
                </label>
                <input
                  type="number"
                  value={calcForm.baseAmount || ''}
                  onChange={(e) => setCalcForm(prev => ({ ...prev, baseAmount: parseFloat(e.target.value) || 0 }))}
                  placeholder="0"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-xl text-xl font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              {selectedTaxType === 'retefuente' && (
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Actividad Económica
                  </label>
                  <select
                    value={calcForm.activity}
                    onChange={(e) => setCalcForm(prev => ({ ...prev, activity: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                  >
                    {Object.entries(RETEFUENTE_RATES).map(([key, val]) => (
                      <option key={key} value={key}>
                        {val.name} ({val.rate * 100}%)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedTaxType === 'ica' && (
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Municipio
                  </label>
                  <select
                    value={calcForm.municipality}
                    onChange={(e) => setCalcForm(prev => ({ ...prev, municipality: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                  >
                    {Object.entries(ICA_RATES).map(([key, val]) => (
                      <option key={key} value={key}>
                        {val.name} ({(val.rate * 100).toFixed(2)}%)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Descripción (opcional)
                </label>
                <input
                  type="text"
                  value={calcForm.description}
                  onChange={(e) => setCalcForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Ej: Factura proveedor X"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              {/* Result */}
              <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Impuesto a pagar:</span>
                  <span className="text-xs px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full">
                    {taxResult.rate}%
                  </span>
                </div>
                <p className="text-3xl font-black text-amber-600">{formatCurrency(taxResult.taxAmount)}</p>
                <p className="text-xs text-slate-500 mt-2">{taxResult.message}</p>
              </div>

              <button
                onClick={saveTaxRecord}
                disabled={calcForm.baseAmount <= 0}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-500/30"
              >
                <Plus className="w-5 h-5" />
                Guardar Cálculo
              </button>
            </div>
          </div>

          {/* Records History */}
          <div className="p-6 bg-white dark:bg-navy-800 rounded-2xl border border-slate-200 dark:border-navy-700">
            <h3 className="font-bold text-slate-700 dark:text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-500" />
              Historial de Cálculos
            </h3>

            {taxRecords.length === 0 ? (
              <div className="text-center py-8">
                <Calculator className="w-12 h-12 mx-auto text-slate-300 dark:text-navy-600 mb-3" />
                <p className="text-slate-500">Sin cálculos guardados</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {taxRecords.slice(0, 20).map(record => (
                  <div
                    key={record.id}
                    className="p-3 bg-slate-50 dark:bg-navy-900 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                          record.type === 'iva' ? 'bg-blue-100 text-blue-700' :
                          record.type === 'retefuente' ? 'bg-purple-100 text-purple-700' :
                          'bg-emerald-100 text-emerald-700'
                        }`}>
                          {record.type}
                        </span>
                        <span className="text-xs text-slate-500">{record.period}</span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{record.description}</p>
                      <p className="text-xs text-slate-500">Base: {formatCurrency(record.baseAmount)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-amber-600">{formatCurrency(record.taxAmount)}</p>
                      <button
                        onClick={() => deleteRecord(record.id)}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: CALENDARIO */}
      {activeTab === 'calendario' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-700 dark:text-white">Calendario Fiscal 2024-2025</h3>
            <button
              onClick={() => setShowAddDeadline(true)}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium transition-all"
            >
              <Plus className="w-4 h-4" />
              Agregar Fecha
            </button>
          </div>

          <div className="space-y-3">
            {deadlines.map(deadline => {
              const days = daysUntilDeadline(deadline.date);
              const isPast = days < 0;
              const isUrgent = !deadline.completed && days >= 0 && days <= 7;
              const isWarning = !deadline.completed && days > 7 && days <= 15;

              return (
                <div
                  key={deadline.id}
                  className={`p-4 rounded-xl border flex items-center gap-4 transition-all ${
                    deadline.completed
                      ? 'bg-slate-50 dark:bg-navy-800 border-slate-200 dark:border-navy-700 opacity-60'
                      : isUrgent
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                      : isWarning
                      ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                      : 'bg-white dark:bg-navy-800 border-slate-200 dark:border-navy-700'
                  }`}
                >
                  <button
                    onClick={() => toggleDeadlineComplete(deadline.id)}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      deadline.completed
                        ? 'bg-emerald-500 border-emerald-500'
                        : 'border-slate-300 dark:border-navy-600 hover:border-emerald-500'
                    }`}
                  >
                    {deadline.completed && <CheckCircle className="w-4 h-4 text-white" />}
                  </button>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                        deadline.type === 'iva' ? 'bg-blue-100 text-blue-700' :
                        deadline.type === 'retefuente' ? 'bg-purple-100 text-purple-700' :
                        deadline.type === 'ica' ? 'bg-emerald-100 text-emerald-700' :
                        deadline.type === 'renta' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {deadline.type}
                      </span>
                      <h4 className={`font-medium ${deadline.completed ? 'line-through text-slate-500' : 'text-slate-700 dark:text-white'}`}>
                        {deadline.title}
                      </h4>
                    </div>
                    <p className="text-sm text-slate-500">{deadline.description}</p>
                  </div>

                  <div className="text-right">
                    <p className="font-medium text-slate-700 dark:text-white">{deadline.date}</p>
                    {!deadline.completed && (
                      <p className={`text-xs font-bold ${
                        isPast ? 'text-red-600' :
                        isUrgent ? 'text-red-500' :
                        isWarning ? 'text-amber-500' : 'text-slate-500'
                      }`}>
                        {isPast ? 'Vencido' : `${days} días`}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB: RESUMEN */}
      {activeTab === 'resumen' && (
        <div className="space-y-6">
          <div className="p-6 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl text-white">
            <h3 className="text-xl font-bold mb-2">Resumen IVA Bimestral</h3>
            <p className="text-amber-100 text-sm mb-4">Período: {bimonthlyIVASummary.periodName}</p>

            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-white/20 rounded-xl">
                <p className="text-amber-100 text-sm">Operaciones</p>
                <p className="text-2xl font-bold">{bimonthlyIVASummary.count}</p>
              </div>
              <div className="p-4 bg-white/20 rounded-xl">
                <p className="text-amber-100 text-sm">Base Gravable</p>
                <p className="text-2xl font-bold">{formatCurrency(bimonthlyIVASummary.totalBase)}</p>
              </div>
              <div className="p-4 bg-white/20 rounded-xl">
                <p className="text-amber-100 text-sm">IVA Generado</p>
                <p className="text-2xl font-bold">{formatCurrency(bimonthlyIVASummary.totalIva)}</p>
              </div>
            </div>
          </div>

          {/* Desglose por tipo */}
          <div className="grid md:grid-cols-3 gap-4">
            {(['iva', 'retefuente', 'ica'] as const).map(type => {
              const records = taxRecords.filter(r => r.type === type);
              const total = records.reduce((sum, r) => sum + r.taxAmount, 0);
              return (
                <div key={type} className="p-4 bg-white dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-navy-700">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                      type === 'iva' ? 'bg-blue-100 text-blue-700' :
                      type === 'retefuente' ? 'bg-purple-100 text-purple-700' :
                      'bg-emerald-100 text-emerald-700'
                    }`}>
                      {type}
                    </span>
                    <span className="text-sm text-slate-500">{records.length} registros</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-800 dark:text-white">{formatCurrency(total)}</p>
                  <p className="text-xs text-slate-500">Total acumulado</p>
                </div>
              );
            })}
          </div>

          {/* Info declaración */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-slate-700 dark:text-white mb-1">Información para Declaración</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Este resumen incluye los cálculos guardados en el sistema. Para la declaración formal,
                  consulta con tu contador y verifica los valores con tus facturas y comprobantes originales.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Deadline Modal */}
      {showAddDeadline && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-navy-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-amber-500 to-orange-500 text-white">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Agregar Fecha Fiscal</h3>
                <button onClick={() => setShowAddDeadline(false)} className="p-2 hover:bg-white/20 rounded-xl">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Título *</label>
                <input
                  type="text"
                  value={deadlineForm.title}
                  onChange={(e) => setDeadlineForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Ej: Declaración IVA"
                  className="w-full px-4 py-2 bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Fecha *</label>
                <input
                  type="date"
                  value={deadlineForm.date}
                  onChange={(e) => setDeadlineForm(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-4 py-2 bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Tipo</label>
                <select
                  value={deadlineForm.type}
                  onChange={(e) => setDeadlineForm(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full px-4 py-2 bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  <option value="iva">IVA</option>
                  <option value="retefuente">Retención Fuente</option>
                  <option value="ica">ICA</option>
                  <option value="renta">Renta</option>
                  <option value="otro">Otro</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Descripción</label>
                <input
                  type="text"
                  value={deadlineForm.description}
                  onChange={(e) => setDeadlineForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descripción opcional"
                  className="w-full px-4 py-2 bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
            </div>

            <div className="p-6 bg-slate-50 dark:bg-navy-800 border-t border-slate-200 dark:border-navy-700 flex justify-end gap-3">
              <button onClick={() => setShowAddDeadline(false)} className="px-6 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-700 rounded-xl font-medium">
                Cancelar
              </button>
              <button
                onClick={addDeadline}
                disabled={!deadlineForm.title || !deadlineForm.date}
                className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium disabled:opacity-50"
              >
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaxCalculator;
