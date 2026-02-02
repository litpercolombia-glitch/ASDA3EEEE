// ============================================
// LITPER PRO - PAYROLL MANAGER
// Sistema de nómina y empleados Colombia
// ============================================

import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  X,
  Save,
  UserPlus,
  Wallet,
  Calendar,
  DollarSign,
  Calculator,
  Download,
  FileText,
  CheckCircle,
  AlertCircle,
  Briefcase,
  Building2,
  History,
  Printer,
} from 'lucide-react';
import jsPDF from 'jspdf';

// ============================================
// TIPOS E INTERFACES
// ============================================

interface Employee {
  id: string;
  cedula: string;
  name: string;
  position: string;
  department: string;
  baseSalary: number;
  startDate: string;
  email: string;
  phone: string;
  bankAccount: string;
  bankName: string;
  active: boolean;
  createdAt: string;
}

interface PayrollItem {
  id: string;
  employeeId: string;
  employeeName: string;
  period: string; // YYYY-MM
  baseSalary: number;
  workedDays: number;
  // Devengados
  transportAllowance: number; // Auxilio de transporte
  overtime: number;
  bonus: number;
  // Deducciones
  healthDeduction: number; // 4%
  pensionDeduction: number; // 4%
  retentionDeduction: number; // Retención en la fuente
  otherDeductions: number;
  // Totales
  totalEarnings: number;
  totalDeductions: number;
  netPay: number;
  status: 'pendiente' | 'pagado';
  payDate?: string;
  createdAt: string;
}

// ============================================
// CONSTANTES
// ============================================

const EMPLOYEES_KEY = 'litper_employees';
const PAYROLL_KEY = 'litper_payroll';

// Salario mínimo 2024 Colombia
const MINIMUM_WAGE = 1300000;
const TRANSPORT_ALLOWANCE = 162000; // Auxilio de transporte 2024

// Tabla de retención en la fuente simplificada (UVT 2024: $47,065)
const UVT_VALUE = 47065;

// ============================================
// UTILIDADES
// ============================================

// Calcular retención en la fuente
const calculateRetention = (salary: number): number => {
  const uvts = salary / UVT_VALUE;

  // Tabla simplificada de retención
  if (uvts <= 95) return 0;
  if (uvts <= 150) return salary * 0.019;
  if (uvts <= 360) return salary * 0.028;
  if (uvts <= 640) return salary * 0.033;
  if (uvts <= 945) return salary * 0.035;
  if (uvts <= 2300) return salary * 0.037;
  return salary * 0.039;
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export const PayrollManager: React.FC = () => {
  // Estados
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payrollItems, setPayrollItems] = useState<PayrollItem[]>([]);
  const [activeTab, setActiveTab] = useState<'employees' | 'payroll' | 'history'>('employees');
  const [searchTerm, setSearchTerm] = useState('');
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [showPayrollForm, setShowPayrollForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollItem | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState(
    new Date().toISOString().slice(0, 7) // YYYY-MM
  );

  // Form states
  const [employeeForm, setEmployeeForm] = useState({
    cedula: '',
    name: '',
    position: '',
    department: '',
    baseSalary: MINIMUM_WAGE,
    startDate: '',
    email: '',
    phone: '',
    bankAccount: '',
    bankName: '',
  });

  const [payrollForm, setPayrollForm] = useState({
    employeeId: '',
    workedDays: 30,
    overtime: 0,
    bonus: 0,
    otherDeductions: 0,
  });

  // Cargar datos
  useEffect(() => {
    const savedEmployees = localStorage.getItem(EMPLOYEES_KEY);
    const savedPayroll = localStorage.getItem(PAYROLL_KEY);
    if (savedEmployees) setEmployees(JSON.parse(savedEmployees));
    if (savedPayroll) setPayrollItems(JSON.parse(savedPayroll));
  }, []);

  // Guardar datos
  useEffect(() => {
    localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem(PAYROLL_KEY, JSON.stringify(payrollItems));
  }, [payrollItems]);

  // Formatear moneda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Filtrar empleados
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp =>
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.cedula.includes(searchTerm) ||
      emp.position.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [employees, searchTerm]);

  // Filtrar nómina por período
  const currentPayroll = useMemo(() => {
    return payrollItems.filter(p => p.period === selectedPeriod);
  }, [payrollItems, selectedPeriod]);

  // Estadísticas
  const stats = useMemo(() => {
    const activeEmployees = employees.filter(e => e.active).length;
    const totalBaseSalary = employees.filter(e => e.active).reduce((sum, e) => sum + e.baseSalary, 0);
    const totalPaid = currentPayroll.filter(p => p.status === 'pagado').reduce((sum, p) => sum + p.netPay, 0);
    const pendingPayments = currentPayroll.filter(p => p.status === 'pendiente').length;
    return { activeEmployees, totalBaseSalary, totalPaid, pendingPayments };
  }, [employees, currentPayroll]);

  // Guardar empleado
  const saveEmployee = () => {
    const employee: Employee = {
      id: editingEmployee?.id || Date.now().toString(),
      ...employeeForm,
      active: true,
      createdAt: editingEmployee?.createdAt || new Date().toISOString(),
    };

    if (editingEmployee) {
      setEmployees(prev => prev.map(e => e.id === employee.id ? employee : e));
    } else {
      setEmployees(prev => [employee, ...prev]);
    }

    resetEmployeeForm();
  };

  // Resetear formulario empleado
  const resetEmployeeForm = () => {
    setEmployeeForm({
      cedula: '',
      name: '',
      position: '',
      department: '',
      baseSalary: MINIMUM_WAGE,
      startDate: '',
      email: '',
      phone: '',
      bankAccount: '',
      bankName: '',
    });
    setEditingEmployee(null);
    setShowEmployeeForm(false);
  };

  // Editar empleado
  const editEmployee = (employee: Employee) => {
    setEmployeeForm({
      cedula: employee.cedula,
      name: employee.name,
      position: employee.position,
      department: employee.department,
      baseSalary: employee.baseSalary,
      startDate: employee.startDate,
      email: employee.email,
      phone: employee.phone,
      bankAccount: employee.bankAccount,
      bankName: employee.bankName,
    });
    setEditingEmployee(employee);
    setShowEmployeeForm(true);
  };

  // Eliminar empleado
  const deleteEmployee = (id: string) => {
    if (confirm('¿Eliminar este empleado?')) {
      setEmployees(prev => prev.filter(e => e.id !== id));
    }
  };

  // Calcular nómina de un empleado
  const calculatePayroll = () => {
    const employee = employees.find(e => e.id === payrollForm.employeeId);
    if (!employee) return;

    const { workedDays, overtime, bonus, otherDeductions } = payrollForm;

    // Salario proporcional a días trabajados
    const proportionalSalary = (employee.baseSalary / 30) * workedDays;

    // Auxilio de transporte (solo si gana menos de 2 SMMLV)
    const transportAllowance = employee.baseSalary <= (MINIMUM_WAGE * 2) ? TRANSPORT_ALLOWANCE : 0;

    // Total devengado
    const totalEarnings = proportionalSalary + transportAllowance + overtime + bonus;

    // Base para deducciones (sin auxilio de transporte)
    const deductionBase = proportionalSalary + overtime + bonus;

    // Deducciones
    const healthDeduction = Math.round(deductionBase * 0.04);
    const pensionDeduction = Math.round(deductionBase * 0.04);
    const retentionDeduction = Math.round(calculateRetention(deductionBase));

    const totalDeductions = healthDeduction + pensionDeduction + retentionDeduction + otherDeductions;
    const netPay = totalEarnings - totalDeductions;

    const payrollItem: PayrollItem = {
      id: Date.now().toString(),
      employeeId: employee.id,
      employeeName: employee.name,
      period: selectedPeriod,
      baseSalary: employee.baseSalary,
      workedDays,
      transportAllowance,
      overtime,
      bonus,
      healthDeduction,
      pensionDeduction,
      retentionDeduction,
      otherDeductions,
      totalEarnings,
      totalDeductions,
      netPay,
      status: 'pendiente',
      createdAt: new Date().toISOString(),
    };

    setPayrollItems(prev => [payrollItem, ...prev]);
    setPayrollForm({
      employeeId: '',
      workedDays: 30,
      overtime: 0,
      bonus: 0,
      otherDeductions: 0,
    });
    setShowPayrollForm(false);
  };

  // Marcar como pagado
  const markAsPaid = (id: string) => {
    setPayrollItems(prev =>
      prev.map(p =>
        p.id === id
          ? { ...p, status: 'pagado' as const, payDate: new Date().toISOString().split('T')[0] }
          : p
      )
    );
  };

  // Generar PDF de desprendible
  const generatePayslip = (payroll: PayrollItem) => {
    const employee = employees.find(e => e.id === payroll.employeeId);
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFillColor(139, 92, 246);
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('LITPER PRO', 20, 22);
    doc.setFontSize(10);
    doc.text('Desprendible de Pago', 20, 30);

    doc.setFontSize(12);
    doc.text(`Período: ${payroll.period}`, pageWidth - 60, 25);

    // Employee Info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('EMPLEADO', 20, 55);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Nombre: ${payroll.employeeName}`, 20, 65);
    doc.text(`Cédula: ${employee?.cedula || 'N/A'}`, 20, 72);
    doc.text(`Cargo: ${employee?.position || 'N/A'}`, 20, 79);
    doc.text(`Departamento: ${employee?.department || 'N/A'}`, 20, 86);

    // Devengados
    let yPos = 105;
    doc.setFillColor(243, 244, 246);
    doc.rect(20, yPos - 8, pageWidth - 40, 12, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('DEVENGADOS', 25, yPos);

    yPos += 15;
    doc.setFont('helvetica', 'normal');
    const devengados = [
      { label: 'Salario Base (proporcional)', value: (payroll.baseSalary / 30) * payroll.workedDays },
      { label: 'Auxilio de Transporte', value: payroll.transportAllowance },
      { label: 'Horas Extra', value: payroll.overtime },
      { label: 'Bonificaciones', value: payroll.bonus },
    ];

    devengados.forEach(item => {
      doc.text(item.label, 25, yPos);
      doc.text(`$${item.value.toLocaleString()}`, pageWidth - 60, yPos);
      yPos += 8;
    });

    doc.setFont('helvetica', 'bold');
    doc.text('Total Devengado:', 25, yPos);
    doc.text(`$${payroll.totalEarnings.toLocaleString()}`, pageWidth - 60, yPos);

    // Deducciones
    yPos += 20;
    doc.setFillColor(254, 226, 226);
    doc.rect(20, yPos - 8, pageWidth - 40, 12, 'F');
    doc.text('DEDUCCIONES', 25, yPos);

    yPos += 15;
    doc.setFont('helvetica', 'normal');
    const deducciones = [
      { label: 'Salud (4%)', value: payroll.healthDeduction },
      { label: 'Pensión (4%)', value: payroll.pensionDeduction },
      { label: 'Retención en la Fuente', value: payroll.retentionDeduction },
      { label: 'Otras Deducciones', value: payroll.otherDeductions },
    ];

    deducciones.forEach(item => {
      doc.text(item.label, 25, yPos);
      doc.text(`$${item.value.toLocaleString()}`, pageWidth - 60, yPos);
      yPos += 8;
    });

    doc.setFont('helvetica', 'bold');
    doc.text('Total Deducciones:', 25, yPos);
    doc.text(`$${payroll.totalDeductions.toLocaleString()}`, pageWidth - 60, yPos);

    // Neto a Pagar
    yPos += 20;
    doc.setFillColor(209, 250, 229);
    doc.rect(20, yPos - 8, pageWidth - 40, 15, 'F');
    doc.setFontSize(14);
    doc.text('NETO A PAGAR:', 25, yPos + 2);
    doc.text(`$${payroll.netPay.toLocaleString()}`, pageWidth - 60, yPos + 2);

    // Bank Info
    yPos += 30;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Cuenta: ${employee?.bankAccount || 'N/A'}`, 20, yPos);
    doc.text(`Banco: ${employee?.bankName || 'N/A'}`, 20, yPos + 7);

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Este documento es un desprendible de pago generado por LITPER PRO', pageWidth / 2, 280, { align: 'center' });
    doc.text(`Generado: ${new Date().toLocaleDateString('es-CO')}`, pageWidth / 2, 286, { align: 'center' });

    doc.save(`Desprendible_${payroll.employeeName.replace(/\s/g, '_')}_${payroll.period}.pdf`);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Users className="w-7 h-7 text-purple-500" />
            Nómina y Empleados
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            Gestión de personal y cálculo de nómina Colombia
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowEmployeeForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-medium transition-all"
          >
            <UserPlus className="w-5 h-5" />
            Nuevo Empleado
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-5 h-5 text-purple-500" />
            <span className="text-2xl font-bold text-purple-600">{stats.activeEmployees}</span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">Empleados Activos</p>
        </div>
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between mb-2">
            <Wallet className="w-5 h-5 text-blue-500" />
            <span className="text-lg font-bold text-blue-600">{formatCurrency(stats.totalBaseSalary)}</span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">Total Salarios Base</p>
        </div>
        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            <span className="text-lg font-bold text-emerald-600">{formatCurrency(stats.totalPaid)}</span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">Pagado este período</p>
        </div>
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
          <div className="flex items-center justify-between mb-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            <span className="text-2xl font-bold text-amber-600">{stats.pendingPayments}</span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">Pagos Pendientes</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-navy-700">
        {[
          { id: 'employees', label: 'Empleados', icon: Users },
          { id: 'payroll', label: 'Nómina', icon: Wallet },
          { id: 'history', label: 'Historial', icon: History },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 font-medium transition-all border-b-2 -mb-[2px] ${
                activeTab === tab.id
                  ? 'text-purple-600 border-purple-500'
                  : 'text-slate-500 border-transparent hover:text-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB: EMPLOYEES */}
      {activeTab === 'employees' && (
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, cédula o cargo..."
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
            />
          </div>

          {/* Employees List */}
          {filteredEmployees.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 dark:bg-navy-800 rounded-2xl">
              <Users className="w-16 h-16 mx-auto text-slate-300 dark:text-navy-600 mb-4" />
              <p className="text-lg font-medium text-slate-500 mb-2">No hay empleados</p>
              <p className="text-sm text-slate-400">Agrega tu primer empleado para comenzar</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEmployees.map(emp => (
                <div
                  key={emp.id}
                  className="p-4 bg-white dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-navy-700 hover:shadow-lg transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-500 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                        {emp.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 dark:text-white">{emp.name}</h4>
                        <p className="text-xs text-slate-500">CC: {emp.cedula}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      emp.active
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {emp.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <Briefcase className="w-4 h-4" />
                      {emp.position}
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <Building2 className="w-4 h-4" />
                      {emp.department}
                    </div>
                    <div className="flex items-center gap-2 text-purple-600 font-bold">
                      <DollarSign className="w-4 h-4" />
                      {formatCurrency(emp.baseSalary)}
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-navy-700">
                    <button
                      onClick={() => editEmployee(emp)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-slate-100 dark:bg-navy-700 hover:bg-slate-200 dark:hover:bg-navy-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-all"
                    >
                      <Edit2 className="w-4 h-4" />
                      Editar
                    </button>
                    <button
                      onClick={() => {
                        setPayrollForm(prev => ({ ...prev, employeeId: emp.id }));
                        setShowPayrollForm(true);
                      }}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition-all"
                    >
                      <Calculator className="w-4 h-4" />
                      Nómina
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: PAYROLL */}
      {activeTab === 'payroll' && (
        <div className="space-y-4">
          {/* Period Selector */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-slate-400" />
              <input
                type="month"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-4 py-2 bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>
            <button
              onClick={() => setShowPayrollForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-medium transition-all"
            >
              <Calculator className="w-5 h-5" />
              Calcular Nómina
            </button>
          </div>

          {/* Payroll List */}
          {currentPayroll.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 dark:bg-navy-800 rounded-2xl">
              <Wallet className="w-16 h-16 mx-auto text-slate-300 dark:text-navy-600 mb-4" />
              <p className="text-lg font-medium text-slate-500 mb-2">Sin nóminas para {selectedPeriod}</p>
              <p className="text-sm text-slate-400">Calcula la nómina de tus empleados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-slate-200 dark:border-navy-700">
                    <th className="text-left py-4 px-4 text-xs font-bold uppercase text-slate-500">Empleado</th>
                    <th className="text-right py-4 px-4 text-xs font-bold uppercase text-slate-500">Devengado</th>
                    <th className="text-right py-4 px-4 text-xs font-bold uppercase text-slate-500">Deducciones</th>
                    <th className="text-right py-4 px-4 text-xs font-bold uppercase text-slate-500">Neto</th>
                    <th className="text-center py-4 px-4 text-xs font-bold uppercase text-slate-500">Estado</th>
                    <th className="text-right py-4 px-4 text-xs font-bold uppercase text-slate-500">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {currentPayroll.map(payroll => (
                    <tr
                      key={payroll.id}
                      className="border-b border-slate-100 dark:border-navy-700 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <p className="font-medium text-slate-700 dark:text-white">{payroll.employeeName}</p>
                        <p className="text-xs text-slate-500">{payroll.workedDays} días</p>
                      </td>
                      <td className="py-4 px-4 text-right text-slate-600 dark:text-slate-400">
                        {formatCurrency(payroll.totalEarnings)}
                      </td>
                      <td className="py-4 px-4 text-right text-red-600">
                        -{formatCurrency(payroll.totalDeductions)}
                      </td>
                      <td className="py-4 px-4 text-right font-bold text-purple-600">
                        {formatCurrency(payroll.netPay)}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          payroll.status === 'pagado'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        }`}>
                          {payroll.status === 'pagado' ? 'Pagado' : 'Pendiente'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSelectedPayroll(payroll)}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-navy-700 rounded-lg text-slate-500 hover:text-blue-500 transition-colors"
                            title="Ver detalle"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => generatePayslip(payroll)}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-navy-700 rounded-lg text-slate-500 hover:text-purple-500 transition-colors"
                            title="Desprendible PDF"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          {payroll.status === 'pendiente' && (
                            <button
                              onClick={() => markAsPaid(payroll.id)}
                              className="p-2 hover:bg-slate-100 dark:hover:bg-navy-700 rounded-lg text-slate-500 hover:text-emerald-500 transition-colors"
                              title="Marcar pagado"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB: HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {payrollItems.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 dark:bg-navy-800 rounded-2xl">
              <History className="w-16 h-16 mx-auto text-slate-300 dark:text-navy-600 mb-4" />
              <p className="text-lg font-medium text-slate-500">Sin historial de pagos</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Group by employee */}
              {employees.map(emp => {
                const empPayroll = payrollItems.filter(p => p.employeeId === emp.id);
                if (empPayroll.length === 0) return null;
                return (
                  <div key={emp.id} className="bg-white dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-navy-700 overflow-hidden">
                    <div className="p-4 bg-slate-50 dark:bg-navy-900 border-b border-slate-200 dark:border-navy-700">
                      <h4 className="font-bold text-slate-700 dark:text-white">{emp.name}</h4>
                      <p className="text-xs text-slate-500">{empPayroll.length} pagos registrados</p>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-navy-700">
                      {empPayroll.slice(0, 5).map(p => (
                        <div key={p.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-navy-700 transition-colors">
                          <div>
                            <p className="font-medium text-slate-700 dark:text-white">{p.period}</p>
                            <p className="text-xs text-slate-500">
                              {p.status === 'pagado' && p.payDate ? `Pagado: ${p.payDate}` : 'Pendiente'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-purple-600">{formatCurrency(p.netPay)}</p>
                            <button
                              onClick={() => generatePayslip(p)}
                              className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                            >
                              <Download className="w-3 h-3" />
                              PDF
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Employee Form Modal */}
      {showEmployeeForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-navy-900 rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-purple-500 to-violet-500 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <UserPlus className="w-8 h-8" />
                  <h3 className="text-xl font-bold">
                    {editingEmployee ? 'Editar Empleado' : 'Nuevo Empleado'}
                  </h3>
                </div>
                <button onClick={resetEmployeeForm} className="p-2 hover:bg-white/20 rounded-xl">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)] space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Cédula *</label>
                  <input
                    type="text"
                    value={employeeForm.cedula}
                    onChange={(e) => setEmployeeForm(prev => ({ ...prev, cedula: e.target.value }))}
                    className="w-full px-4 py-2 bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Teléfono</label>
                  <input
                    type="tel"
                    value={employeeForm.phone}
                    onChange={(e) => setEmployeeForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-4 py-2 bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  value={employeeForm.name}
                  onChange={(e) => setEmployeeForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Email</label>
                <input
                  type="email"
                  value={employeeForm.email}
                  onChange={(e) => setEmployeeForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-2 bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Cargo *</label>
                  <input
                    type="text"
                    value={employeeForm.position}
                    onChange={(e) => setEmployeeForm(prev => ({ ...prev, position: e.target.value }))}
                    className="w-full px-4 py-2 bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Departamento</label>
                  <input
                    type="text"
                    value={employeeForm.department}
                    onChange={(e) => setEmployeeForm(prev => ({ ...prev, department: e.target.value }))}
                    className="w-full px-4 py-2 bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Salario Base *</label>
                  <input
                    type="number"
                    value={employeeForm.baseSalary}
                    onChange={(e) => setEmployeeForm(prev => ({ ...prev, baseSalary: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-4 py-2 bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Fecha Ingreso</label>
                  <input
                    type="date"
                    value={employeeForm.startDate}
                    onChange={(e) => setEmployeeForm(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-4 py-2 bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Banco</label>
                  <input
                    type="text"
                    value={employeeForm.bankName}
                    onChange={(e) => setEmployeeForm(prev => ({ ...prev, bankName: e.target.value }))}
                    placeholder="Bancolombia, Davivienda..."
                    className="w-full px-4 py-2 bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">No. Cuenta</label>
                  <input
                    type="text"
                    value={employeeForm.bankAccount}
                    onChange={(e) => setEmployeeForm(prev => ({ ...prev, bankAccount: e.target.value }))}
                    className="w-full px-4 py-2 bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 dark:bg-navy-800 border-t border-slate-200 dark:border-navy-700 flex justify-end gap-3">
              <button onClick={resetEmployeeForm} className="px-6 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-700 rounded-xl font-medium">
                Cancelar
              </button>
              <button
                onClick={saveEmployee}
                disabled={!employeeForm.cedula || !employeeForm.name || !employeeForm.position || !employeeForm.baseSalary}
                className="flex items-center gap-2 px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payroll Calculation Modal */}
      {showPayrollForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-navy-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-purple-500 to-violet-500 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calculator className="w-8 h-8" />
                  <div>
                    <h3 className="text-xl font-bold">Calcular Nómina</h3>
                    <p className="text-purple-100 text-sm">Período: {selectedPeriod}</p>
                  </div>
                </div>
                <button onClick={() => setShowPayrollForm(false)} className="p-2 hover:bg-white/20 rounded-xl">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Empleado *</label>
                <select
                  value={payrollForm.employeeId}
                  onChange={(e) => setPayrollForm(prev => ({ ...prev, employeeId: e.target.value }))}
                  className="w-full px-4 py-3 bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                >
                  <option value="">Seleccionar empleado</option>
                  {employees.filter(e => e.active).map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} - {formatCurrency(emp.baseSalary)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Días Trabajados</label>
                  <input
                    type="number"
                    value={payrollForm.workedDays}
                    onChange={(e) => setPayrollForm(prev => ({ ...prev, workedDays: parseInt(e.target.value) || 0 }))}
                    min="0"
                    max="30"
                    className="w-full px-4 py-2 bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Horas Extra ($)</label>
                  <input
                    type="number"
                    value={payrollForm.overtime || ''}
                    onChange={(e) => setPayrollForm(prev => ({ ...prev, overtime: parseFloat(e.target.value) || 0 }))}
                    min="0"
                    className="w-full px-4 py-2 bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Bonificaciones ($)</label>
                  <input
                    type="number"
                    value={payrollForm.bonus || ''}
                    onChange={(e) => setPayrollForm(prev => ({ ...prev, bonus: parseFloat(e.target.value) || 0 }))}
                    min="0"
                    className="w-full px-4 py-2 bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Otras Deducciones ($)</label>
                  <input
                    type="number"
                    value={payrollForm.otherDeductions || ''}
                    onChange={(e) => setPayrollForm(prev => ({ ...prev, otherDeductions: parseFloat(e.target.value) || 0 }))}
                    min="0"
                    className="w-full px-4 py-2 bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
              </div>

              {/* Info deducciones Colombia */}
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                <h4 className="font-bold text-slate-700 dark:text-white mb-2 flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-amber-500" />
                  Deducciones Automáticas Colombia
                </h4>
                <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                  <li>• Salud: 4% del salario base</li>
                  <li>• Pensión: 4% del salario base</li>
                  <li>• Retención: Según tabla UVT DIAN</li>
                  <li>• Aux. Transporte: {formatCurrency(TRANSPORT_ALLOWANCE)} (si aplica)</li>
                </ul>
              </div>
            </div>

            <div className="p-6 bg-slate-50 dark:bg-navy-800 border-t border-slate-200 dark:border-navy-700 flex justify-end gap-3">
              <button onClick={() => setShowPayrollForm(false)} className="px-6 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-700 rounded-xl font-medium">
                Cancelar
              </button>
              <button
                onClick={calculatePayroll}
                disabled={!payrollForm.employeeId}
                className="flex items-center gap-2 px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Calculator className="w-4 h-4" />
                Calcular Nómina
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payroll Detail Modal */}
      {selectedPayroll && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-navy-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-purple-500 to-violet-500 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">{selectedPayroll.employeeName}</h3>
                  <p className="text-purple-100 text-sm">Período: {selectedPayroll.period}</p>
                </div>
                <button onClick={() => setSelectedPayroll(null)} className="p-2 hover:bg-white/20 rounded-xl">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Devengados */}
              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                <h4 className="font-bold text-slate-700 dark:text-white mb-3">Devengados</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Salario ({selectedPayroll.workedDays} días)</span>
                    <span className="font-medium">{formatCurrency((selectedPayroll.baseSalary / 30) * selectedPayroll.workedDays)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Auxilio Transporte</span>
                    <span className="font-medium">{formatCurrency(selectedPayroll.transportAllowance)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Horas Extra</span>
                    <span className="font-medium">{formatCurrency(selectedPayroll.overtime)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Bonificaciones</span>
                    <span className="font-medium">{formatCurrency(selectedPayroll.bonus)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-emerald-200 dark:border-emerald-700">
                    <span className="font-bold">Total Devengado</span>
                    <span className="font-bold text-emerald-600">{formatCurrency(selectedPayroll.totalEarnings)}</span>
                  </div>
                </div>
              </div>

              {/* Deducciones */}
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
                <h4 className="font-bold text-slate-700 dark:text-white mb-3">Deducciones</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Salud (4%)</span>
                    <span className="font-medium">-{formatCurrency(selectedPayroll.healthDeduction)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Pensión (4%)</span>
                    <span className="font-medium">-{formatCurrency(selectedPayroll.pensionDeduction)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Retención Fuente</span>
                    <span className="font-medium">-{formatCurrency(selectedPayroll.retentionDeduction)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Otras</span>
                    <span className="font-medium">-{formatCurrency(selectedPayroll.otherDeductions)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-red-200 dark:border-red-700">
                    <span className="font-bold">Total Deducciones</span>
                    <span className="font-bold text-red-600">-{formatCurrency(selectedPayroll.totalDeductions)}</span>
                  </div>
                </div>
              </div>

              {/* Neto */}
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-slate-700 dark:text-white">NETO A PAGAR</span>
                  <span className="text-2xl font-black text-purple-600">{formatCurrency(selectedPayroll.netPay)}</span>
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 dark:bg-navy-800 border-t border-slate-200 dark:border-navy-700 flex justify-end gap-3">
              <button
                onClick={() => generatePayslip(selectedPayroll)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-medium"
              >
                <Download className="w-4 h-4" />
                Descargar PDF
              </button>
              <button onClick={() => setSelectedPayroll(null)} className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-700 rounded-xl font-medium">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollManager;
