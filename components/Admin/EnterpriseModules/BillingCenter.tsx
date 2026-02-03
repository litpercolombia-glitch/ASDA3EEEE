'use client';

import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Building,
  DollarSign,
  TrendingUp,
  Calendar,
  FileText,
  Download,
  Send,
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  ChevronDown,
  Check,
  X,
  AlertTriangle,
  Clock,
  RefreshCw,
  Receipt,
  Wallet,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
  Mail,
  ChevronsUpDown,
  BadgePercent,
  Banknote,
} from 'lucide-react';

// ============================================
// BILLING CENTER - FACTURACIÓN POR EMPRESA
// Centro de facturación multi-tenant
// ============================================

type BillingPlan = 'starter' | 'professional' | 'enterprise' | 'custom';
type BillingStatus = 'active' | 'past_due' | 'cancelled' | 'trial';
type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
type PaymentMethod = 'credit_card' | 'bank_transfer' | 'paypal';

interface Company {
  id: string;
  name: string;
  email: string;
  nit: string;
  plan: BillingPlan;
  status: BillingStatus;
  mrr: number;
  balance: number;
  paymentMethod: PaymentMethod;
  lastPayment?: Date;
  nextBilling: Date;
  createdAt: Date;
  seats: number;
  usedSeats: number;
}

interface Invoice {
  id: string;
  companyId: string;
  companyName: string;
  number: string;
  status: InvoiceStatus;
  amount: number;
  tax: number;
  total: number;
  dueDate: Date;
  issuedAt: Date;
  paidAt?: Date;
  items: InvoiceItem[];
}

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface BillingMetrics {
  mrr: number;
  arr: number;
  activeCompanies: number;
  churnRate: number;
  avgRevenuePerCompany: number;
  pendingInvoices: number;
  pendingAmount: number;
  collectedThisMonth: number;
}

// Plans configuration
const planConfig: Record<BillingPlan, { name: string; price: number; features: string[]; color: string }> = {
  starter: {
    name: 'Starter',
    price: 499000,
    features: ['5 usuarios', 'Funciones básicas', 'Soporte email'],
    color: 'text-blue-400',
  },
  professional: {
    name: 'Professional',
    price: 1499000,
    features: ['25 usuarios', 'Todas las funciones', 'Soporte prioritario', 'API access'],
    color: 'text-violet-400',
  },
  enterprise: {
    name: 'Enterprise',
    price: 4999000,
    features: ['Usuarios ilimitados', 'SSO & SAML', 'SLA dedicado', 'Account manager'],
    color: 'text-amber-400',
  },
  custom: {
    name: 'Custom',
    price: 0,
    features: ['Solución personalizada', 'Precio negociado'],
    color: 'text-emerald-400',
  },
};

const statusColors: Record<BillingStatus, { bg: string; text: string }> = {
  active: { bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
  past_due: { bg: 'bg-red-500/10', text: 'text-red-400' },
  cancelled: { bg: 'bg-gray-500/10', text: 'text-gray-400' },
  trial: { bg: 'bg-blue-500/10', text: 'text-blue-400' },
};

const invoiceStatusColors: Record<InvoiceStatus, { bg: string; text: string }> = {
  draft: { bg: 'bg-gray-500/10', text: 'text-gray-400' },
  sent: { bg: 'bg-blue-500/10', text: 'text-blue-400' },
  paid: { bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
  overdue: { bg: 'bg-red-500/10', text: 'text-red-400' },
  cancelled: { bg: 'bg-gray-500/10', text: 'text-gray-400' },
};

// Mock data
const generateMockCompanies = (): Company[] => [
  {
    id: 'comp_1',
    name: 'Tech Solutions SAS',
    email: 'billing@techsolutions.co',
    nit: '900.123.456-7',
    plan: 'enterprise',
    status: 'active',
    mrr: 4999000,
    balance: 0,
    paymentMethod: 'credit_card',
    lastPayment: new Date('2025-01-15'),
    nextBilling: new Date('2025-02-15'),
    createdAt: new Date('2024-03-01'),
    seats: 100,
    usedSeats: 67,
  },
  {
    id: 'comp_2',
    name: 'Digital Corp',
    email: 'admin@digitalcorp.com',
    nit: '800.987.654-3',
    plan: 'professional',
    status: 'active',
    mrr: 1499000,
    balance: 0,
    paymentMethod: 'bank_transfer',
    lastPayment: new Date('2025-01-20'),
    nextBilling: new Date('2025-02-20'),
    createdAt: new Date('2024-06-15'),
    seats: 25,
    usedSeats: 22,
  },
  {
    id: 'comp_3',
    name: 'Startup XYZ',
    email: 'contact@startupxyz.co',
    nit: '901.234.567-8',
    plan: 'starter',
    status: 'past_due',
    mrr: 499000,
    balance: 998000,
    paymentMethod: 'credit_card',
    lastPayment: new Date('2024-12-10'),
    nextBilling: new Date('2025-01-10'),
    createdAt: new Date('2024-09-01'),
    seats: 5,
    usedSeats: 5,
  },
  {
    id: 'comp_4',
    name: 'Empresa ABC',
    email: 'finanzas@empresaabc.com',
    nit: '800.111.222-3',
    plan: 'professional',
    status: 'active',
    mrr: 1499000,
    balance: 0,
    paymentMethod: 'credit_card',
    lastPayment: new Date('2025-01-05'),
    nextBilling: new Date('2025-02-05'),
    createdAt: new Date('2024-01-15'),
    seats: 25,
    usedSeats: 18,
  },
  {
    id: 'comp_5',
    name: 'Nueva Empresa',
    email: 'info@nuevaempresa.co',
    nit: '901.999.888-7',
    plan: 'professional',
    status: 'trial',
    mrr: 0,
    balance: 0,
    paymentMethod: 'credit_card',
    nextBilling: new Date('2025-02-15'),
    createdAt: new Date('2025-01-15'),
    seats: 25,
    usedSeats: 3,
  },
];

const generateMockInvoices = (companies: Company[]): Invoice[] => {
  const invoices: Invoice[] = [];
  let invoiceNum = 1;

  companies.forEach(company => {
    // Current month invoice
    const planPrice = planConfig[company.plan].price;
    if (planPrice > 0) {
      invoices.push({
        id: `inv_${invoiceNum}`,
        companyId: company.id,
        companyName: company.name,
        number: `FAC-2025-${String(invoiceNum).padStart(4, '0')}`,
        status: company.status === 'past_due' ? 'overdue' : company.lastPayment ? 'paid' : 'sent',
        amount: planPrice,
        tax: Math.round(planPrice * 0.19),
        total: Math.round(planPrice * 1.19),
        dueDate: company.nextBilling,
        issuedAt: new Date(company.nextBilling.getTime() - 15 * 24 * 60 * 60 * 1000),
        paidAt: company.lastPayment,
        items: [
          {
            description: `Plan ${planConfig[company.plan].name} - Mensual`,
            quantity: 1,
            unitPrice: planPrice,
            total: planPrice,
          },
        ],
      });
      invoiceNum++;
    }
  });

  return invoices;
};

export function BillingCenter() {
  const [activeTab, setActiveTab] = useState<'overview' | 'companies' | 'invoices' | 'plans'>('overview');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<BillingStatus | 'all'>('all');
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);

  useEffect(() => {
    const storedCompanies = localStorage.getItem('litper_billing_companies');
    if (storedCompanies) {
      setCompanies(JSON.parse(storedCompanies).map((c: any) => ({
        ...c,
        lastPayment: c.lastPayment ? new Date(c.lastPayment) : undefined,
        nextBilling: new Date(c.nextBilling),
        createdAt: new Date(c.createdAt),
      })));
    } else {
      const mock = generateMockCompanies();
      setCompanies(mock);
      localStorage.setItem('litper_billing_companies', JSON.stringify(mock));
    }
  }, []);

  useEffect(() => {
    if (companies.length > 0) {
      setInvoices(generateMockInvoices(companies));
    }
  }, [companies]);

  // Calculate metrics
  const metrics: BillingMetrics = {
    mrr: companies.reduce((acc, c) => acc + c.mrr, 0),
    arr: companies.reduce((acc, c) => acc + c.mrr, 0) * 12,
    activeCompanies: companies.filter(c => c.status === 'active').length,
    churnRate: 2.5,
    avgRevenuePerCompany: Math.round(companies.reduce((acc, c) => acc + c.mrr, 0) / companies.length),
    pendingInvoices: invoices.filter(i => i.status === 'sent' || i.status === 'overdue').length,
    pendingAmount: invoices.filter(i => i.status === 'sent' || i.status === 'overdue').reduce((acc, i) => acc + i.total, 0),
    collectedThisMonth: invoices.filter(i => i.status === 'paid').reduce((acc, i) => acc + i.total, 0),
  };

  const filteredCompanies = companies.filter(c => {
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase()) && !c.nit.includes(searchQuery)) return false;
    return true;
  });

  const formatCurrency = (amount: number): string => {
    return `$${amount.toLocaleString('es-CO')}`;
  };

  const sendReminder = (companyId: string) => {
    alert(`Recordatorio enviado a ${companies.find(c => c.id === companyId)?.email}`);
  };

  const exportInvoices = () => {
    const csv = [
      ['Número', 'Empresa', 'NIT', 'Estado', 'Subtotal', 'IVA', 'Total', 'Fecha Emisión', 'Fecha Vencimiento'].join(','),
      ...invoices.map(inv => {
        const company = companies.find(c => c.id === inv.companyId);
        return [
          inv.number,
          `"${inv.companyName}"`,
          company?.nit || '',
          inv.status,
          inv.amount,
          inv.tax,
          inv.total,
          inv.issuedAt.toISOString().split('T')[0],
          inv.dueDate.toISOString().split('T')[0],
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `invoices-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="h-full flex flex-col bg-black/20 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <CreditCard className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Billing Center</h2>
              <p className="text-xs text-gray-400">{companies.length} empresas activas</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportInvoices}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-colors"
            >
              <Download className="w-4 h-4" />
              Exportar
            </button>
            <button
              onClick={() => setIsCreatingInvoice(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nueva Factura
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white/5 p-1 rounded-lg">
          {[
            { id: 'overview', label: 'Resumen', icon: TrendingUp },
            { id: 'companies', label: 'Empresas', icon: Building },
            { id: 'invoices', label: 'Facturas', icon: FileText },
            { id: 'plans', label: 'Planes', icon: BadgePercent },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm transition-colors ${
                activeTab === tab.id
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Metrics */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 rounded-xl p-4 border border-emerald-500/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-emerald-300 text-sm">MRR</span>
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                </div>
                <p className="text-2xl font-bold text-white">{formatCurrency(metrics.mrr)}</p>
                <div className="flex items-center gap-1 text-xs text-emerald-400 mt-1">
                  <ArrowUpRight className="w-3 h-3" />
                  +12% vs mes anterior
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">ARR</span>
                  <Banknote className="w-5 h-5 text-violet-400" />
                </div>
                <p className="text-2xl font-bold text-white">{formatCurrency(metrics.arr)}</p>
                <p className="text-xs text-gray-500 mt-1">Proyección anual</p>
              </div>

              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">Por Cobrar</span>
                  <Clock className="w-5 h-5 text-amber-400" />
                </div>
                <p className="text-2xl font-bold text-amber-400">{formatCurrency(metrics.pendingAmount)}</p>
                <p className="text-xs text-gray-500 mt-1">{metrics.pendingInvoices} facturas pendientes</p>
              </div>

              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">Cobrado</span>
                  <PiggyBank className="w-5 h-5 text-emerald-400" />
                </div>
                <p className="text-2xl font-bold text-emerald-400">{formatCurrency(metrics.collectedThisMonth)}</p>
                <p className="text-xs text-gray-500 mt-1">Este mes</p>
              </div>
            </div>

            {/* Revenue by Plan */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <h3 className="text-white font-medium mb-4">Ingresos por Plan</h3>
                <div className="space-y-3">
                  {(['enterprise', 'professional', 'starter'] as BillingPlan[]).map(plan => {
                    const planCompanies = companies.filter(c => c.plan === plan);
                    const revenue = planCompanies.reduce((acc, c) => acc + c.mrr, 0);
                    const percent = (revenue / metrics.mrr) * 100;

                    return (
                      <div key={plan}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className={planConfig[plan].color}>{planConfig[plan].name}</span>
                          <span className="text-white">{formatCurrency(revenue)}</span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full`}
                            style={{
                              width: `${percent}%`,
                              backgroundColor: plan === 'enterprise' ? '#f59e0b' : plan === 'professional' ? '#8b5cf6' : '#3b82f6',
                            }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{planCompanies.length} empresas</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <h3 className="text-white font-medium mb-4">Estado de Cuentas</h3>
                <div className="space-y-3">
                  {[
                    { status: 'active' as BillingStatus, label: 'Activas', count: companies.filter(c => c.status === 'active').length },
                    { status: 'trial' as BillingStatus, label: 'En Prueba', count: companies.filter(c => c.status === 'trial').length },
                    { status: 'past_due' as BillingStatus, label: 'Vencidas', count: companies.filter(c => c.status === 'past_due').length },
                    { status: 'cancelled' as BillingStatus, label: 'Canceladas', count: companies.filter(c => c.status === 'cancelled').length },
                  ].map(item => {
                    const style = statusColors[item.status];
                    return (
                      <div key={item.status} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${style.bg.replace('/10', '')}`} style={{ backgroundColor: style.text.replace('text-', '').includes('emerald') ? '#10b981' : style.text.includes('red') ? '#ef4444' : style.text.includes('blue') ? '#3b82f6' : '#6b7280' }} />
                          <span className="text-sm text-gray-400">{item.label}</span>
                        </div>
                        <span className={`text-sm ${style.text}`}>{item.count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Past Due Accounts */}
            {companies.filter(c => c.status === 'past_due').length > 0 && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  <h3 className="text-red-400 font-medium">Cuentas Vencidas</h3>
                </div>
                <div className="space-y-2">
                  {companies.filter(c => c.status === 'past_due').map(company => (
                    <div key={company.id} className="flex items-center justify-between bg-black/30 rounded-lg p-3">
                      <div>
                        <p className="text-white text-sm">{company.name}</p>
                        <p className="text-xs text-gray-500">Debe: {formatCurrency(company.balance)}</p>
                      </div>
                      <button
                        onClick={() => sendReminder(company.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm transition-colors"
                      >
                        <Send className="w-3 h-3" />
                        Recordatorio
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Companies Tab */}
        {activeTab === 'companies' && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Buscar empresa o NIT..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50"
                />
              </div>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none"
              >
                <option value="all">Todos los estados</option>
                <option value="active">Activas</option>
                <option value="trial">En Prueba</option>
                <option value="past_due">Vencidas</option>
                <option value="cancelled">Canceladas</option>
              </select>
            </div>

            {/* Companies Table */}
            <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-xs text-gray-500 font-medium p-4">Empresa</th>
                    <th className="text-left text-xs text-gray-500 font-medium p-4">Plan</th>
                    <th className="text-left text-xs text-gray-500 font-medium p-4">Estado</th>
                    <th className="text-right text-xs text-gray-500 font-medium p-4">MRR</th>
                    <th className="text-right text-xs text-gray-500 font-medium p-4">Usuarios</th>
                    <th className="text-left text-xs text-gray-500 font-medium p-4">Próx. Cobro</th>
                    <th className="text-right text-xs text-gray-500 font-medium p-4">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredCompanies.map(company => {
                    const status = statusColors[company.status];
                    const plan = planConfig[company.plan];

                    return (
                      <tr key={company.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-4">
                          <div>
                            <p className="text-white text-sm font-medium">{company.name}</p>
                            <p className="text-xs text-gray-500">{company.nit}</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`text-sm ${plan.color}`}>{plan.name}</span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs ${status.bg} ${status.text} capitalize`}>
                            {company.status === 'past_due' ? 'Vencida' : company.status === 'active' ? 'Activa' : company.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <span className="text-white text-sm">{formatCurrency(company.mrr)}</span>
                        </td>
                        <td className="p-4 text-right">
                          <span className="text-sm text-gray-400">{company.usedSeats}/{company.seats}</span>
                        </td>
                        <td className="p-4">
                          <span className="text-sm text-gray-400">
                            {company.nextBilling.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors">
                              <Mail className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Invoices Tab */}
        {activeTab === 'invoices' && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Buscar factura..."
                  className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50"
                />
              </div>
            </div>

            <div className="space-y-2">
              {invoices.map(invoice => {
                const status = invoiceStatusColors[invoice.status];

                return (
                  <div
                    key={invoice.id}
                    className="bg-white/5 rounded-lg border border-white/10 p-4 hover:border-white/20 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-white/5 rounded-lg">
                          <Receipt className="w-5 h-5 text-gray-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm text-white">{invoice.number}</span>
                            <span className={`px-1.5 py-0.5 rounded text-xs ${status.bg} ${status.text} capitalize`}>
                              {invoice.status === 'overdue' ? 'Vencida' : invoice.status === 'paid' ? 'Pagada' : invoice.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400">{invoice.companyName}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-white font-medium">{formatCurrency(invoice.total)}</p>
                          <p className="text-xs text-gray-500">
                            Vence: {invoice.dueDate.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                          </p>
                        </div>

                        <div className="flex items-center gap-1">
                          <button className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors">
                            <Download className="w-4 h-4" />
                          </button>
                          {invoice.status === 'sent' && (
                            <button className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors">
                              <Send className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Plans Tab */}
        {activeTab === 'plans' && (
          <div className="grid grid-cols-3 gap-4">
            {(['starter', 'professional', 'enterprise'] as BillingPlan[]).map(planKey => {
              const plan = planConfig[planKey];
              const planCompanies = companies.filter(c => c.plan === planKey);

              return (
                <div
                  key={planKey}
                  className={`bg-white/5 rounded-xl border border-white/10 p-6 relative overflow-hidden`}
                >
                  {planKey === 'professional' && (
                    <div className="absolute top-4 right-4 px-2 py-0.5 bg-violet-500/20 text-violet-400 text-xs rounded">
                      Popular
                    </div>
                  )}

                  <h3 className={`text-xl font-bold ${plan.color} mb-2`}>{plan.name}</h3>
                  <p className="text-3xl font-bold text-white mb-1">
                    {formatCurrency(plan.price)}
                    <span className="text-sm text-gray-500 font-normal">/mes</span>
                  </p>
                  <p className="text-xs text-gray-500 mb-4">{planCompanies.length} empresas activas</p>

                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-gray-400">
                        <Check className="w-4 h-4 text-emerald-400" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <div className="pt-4 border-t border-white/10">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-500">Ingresos mensuales</span>
                      <span className="text-white">{formatCurrency(planCompanies.reduce((acc, c) => acc + c.mrr, 0))}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Usuarios activos</span>
                      <span className="text-white">{planCompanies.reduce((acc, c) => acc + c.usedSeats, 0)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default BillingCenter;
