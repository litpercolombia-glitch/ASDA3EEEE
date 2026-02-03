'use client';

import React, { useState, useEffect } from 'react';
import {
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Bell,
  Settings,
  Plus,
  Edit,
  Trash2,
  Eye,
  Filter,
  Search,
  Download,
  RefreshCw,
  Calendar,
  Target,
  Gauge,
  Timer,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Zap,
  Users,
  Building,
  FileText,
  Mail,
  MessageSquare,
  Phone,
} from 'lucide-react';

// ============================================
// SLA MONITOR - ALERTAS Y COMPLIANCE
// Monitoreo de SLAs con alertas de deadline
// ============================================

type SLAStatus = 'on_track' | 'at_risk' | 'breached' | 'completed';
type SLAPriority = 'critical' | 'high' | 'medium' | 'low';
type AlertChannel = 'email' | 'slack' | 'sms' | 'webhook';

interface SLAPolicy {
  id: string;
  name: string;
  description: string;
  targetResponseTime: number; // minutes
  targetResolutionTime: number; // minutes
  priority: SLAPriority;
  categories: string[];
  alertThresholds: {
    warning: number; // % of time remaining
    critical: number;
  };
  alertChannels: AlertChannel[];
  isActive: boolean;
  createdAt: Date;
}

interface SLATicket {
  id: string;
  title: string;
  description: string;
  policyId: string;
  status: SLAStatus;
  priority: SLAPriority;
  category: string;
  customer: {
    id: string;
    name: string;
    company: string;
  };
  assignee?: {
    id: string;
    name: string;
  };
  createdAt: Date;
  respondedAt?: Date;
  resolvedAt?: Date;
  responseDeadline: Date;
  resolutionDeadline: Date;
  timeRemaining: number; // minutes
  breachReason?: string;
}

interface SLAMetrics {
  totalTickets: number;
  onTrack: number;
  atRisk: number;
  breached: number;
  completed: number;
  avgResponseTime: number; // minutes
  avgResolutionTime: number;
  complianceRate: number; // %
  trend: 'up' | 'down' | 'stable';
}

// Mock policies
const mockPolicies: SLAPolicy[] = [
  {
    id: 'sla_1',
    name: 'Crítico - Producción',
    description: 'Incidentes que afectan producción',
    targetResponseTime: 15,
    targetResolutionTime: 60,
    priority: 'critical',
    categories: ['producción', 'crítico', 'downtime'],
    alertThresholds: { warning: 50, critical: 25 },
    alertChannels: ['email', 'slack', 'sms'],
    isActive: true,
    createdAt: new Date('2025-01-01'),
  },
  {
    id: 'sla_2',
    name: 'Alto - Clientes Premium',
    description: 'Soporte para clientes premium',
    targetResponseTime: 30,
    targetResolutionTime: 240,
    priority: 'high',
    categories: ['premium', 'soporte', 'consulta'],
    alertThresholds: { warning: 40, critical: 20 },
    alertChannels: ['email', 'slack'],
    isActive: true,
    createdAt: new Date('2025-01-01'),
  },
  {
    id: 'sla_3',
    name: 'Medio - Soporte General',
    description: 'Tickets de soporte estándar',
    targetResponseTime: 120,
    targetResolutionTime: 480,
    priority: 'medium',
    categories: ['soporte', 'consulta', 'general'],
    alertThresholds: { warning: 30, critical: 15 },
    alertChannels: ['email'],
    isActive: true,
    createdAt: new Date('2025-01-01'),
  },
  {
    id: 'sla_4',
    name: 'Bajo - Consultas',
    description: 'Consultas y solicitudes menores',
    targetResponseTime: 480,
    targetResolutionTime: 2880,
    priority: 'low',
    categories: ['consulta', 'información', 'mejora'],
    alertThresholds: { warning: 25, critical: 10 },
    alertChannels: ['email'],
    isActive: true,
    createdAt: new Date('2025-01-01'),
  },
];

// Generate mock tickets
const generateMockTickets = (): SLATicket[] => {
  const customers = [
    { id: 'c1', name: 'Carlos Méndez', company: 'Empresa ABC' },
    { id: 'c2', name: 'María García', company: 'Tech Solutions' },
    { id: 'c3', name: 'Juan Rodríguez', company: 'Digital Corp' },
    { id: 'c4', name: 'Ana López', company: 'Startup XYZ' },
  ];

  const assignees = [
    { id: 'a1', name: 'Pedro Sánchez' },
    { id: 'a2', name: 'Laura Martínez' },
    { id: 'a3', name: 'Diego Hernández' },
  ];

  const titles = [
    'Error en facturación automática',
    'Problema de acceso al sistema',
    'Consulta sobre integración API',
    'Solicitud de reporte personalizado',
    'Bug en módulo de pagos',
    'Actualización de datos cliente',
    'Configuración de webhooks',
    'Problema con exportación PDF',
  ];

  const now = new Date();
  const tickets: SLATicket[] = [];

  for (let i = 0; i < 15; i++) {
    const policy = mockPolicies[Math.floor(Math.random() * mockPolicies.length)];
    const createdAt = new Date(now.getTime() - Math.random() * 48 * 60 * 60 * 1000);
    const responseDeadline = new Date(createdAt.getTime() + policy.targetResponseTime * 60 * 1000);
    const resolutionDeadline = new Date(createdAt.getTime() + policy.targetResolutionTime * 60 * 1000);

    const timeRemaining = Math.floor((resolutionDeadline.getTime() - now.getTime()) / 60000);
    const percentRemaining = (timeRemaining / policy.targetResolutionTime) * 100;

    let status: SLAStatus;
    if (Math.random() > 0.7) {
      status = 'completed';
    } else if (percentRemaining <= 0) {
      status = 'breached';
    } else if (percentRemaining <= policy.alertThresholds.critical) {
      status = 'at_risk';
    } else {
      status = 'on_track';
    }

    tickets.push({
      id: `TKT-${2025}${String(i + 1).padStart(4, '0')}`,
      title: titles[Math.floor(Math.random() * titles.length)],
      description: 'Descripción detallada del ticket...',
      policyId: policy.id,
      status,
      priority: policy.priority,
      category: policy.categories[0],
      customer: customers[Math.floor(Math.random() * customers.length)],
      assignee: Math.random() > 0.2 ? assignees[Math.floor(Math.random() * assignees.length)] : undefined,
      createdAt,
      respondedAt: Math.random() > 0.3 ? new Date(createdAt.getTime() + Math.random() * policy.targetResponseTime * 60 * 1000 * 0.8) : undefined,
      resolvedAt: status === 'completed' ? new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000) : undefined,
      responseDeadline,
      resolutionDeadline,
      timeRemaining: Math.max(0, timeRemaining),
      breachReason: status === 'breached' ? 'Tiempo de resolución excedido' : undefined,
    });
  }

  return tickets.sort((a, b) => a.timeRemaining - b.timeRemaining);
};

const priorityColors: Record<SLAPriority, { bg: string; text: string; border: string }> = {
  critical: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },
  high: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30' },
  medium: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  low: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
};

const statusColors: Record<SLAStatus, { bg: string; text: string; icon: React.ElementType }> = {
  on_track: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', icon: CheckCircle },
  at_risk: { bg: 'bg-amber-500/10', text: 'text-amber-400', icon: AlertTriangle },
  breached: { bg: 'bg-red-500/10', text: 'text-red-400', icon: XCircle },
  completed: { bg: 'bg-blue-500/10', text: 'text-blue-400', icon: CheckCircle },
};

const channelIcons: Record<AlertChannel, React.ElementType> = {
  email: Mail,
  slack: MessageSquare,
  sms: Phone,
  webhook: Zap,
};

export function SLAMonitor() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tickets' | 'policies' | 'reports'>('dashboard');
  const [tickets, setTickets] = useState<SLATicket[]>([]);
  const [policies, setPolicies] = useState<SLAPolicy[]>(mockPolicies);
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<SLAStatus | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<SLAPriority | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditingPolicy, setIsEditingPolicy] = useState(false);
  const [editingPolicyId, setEditingPolicyId] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('litper_sla_tickets');
    if (stored) {
      setTickets(JSON.parse(stored).map((t: any) => ({
        ...t,
        createdAt: new Date(t.createdAt),
        respondedAt: t.respondedAt ? new Date(t.respondedAt) : undefined,
        resolvedAt: t.resolvedAt ? new Date(t.resolvedAt) : undefined,
        responseDeadline: new Date(t.responseDeadline),
        resolutionDeadline: new Date(t.resolutionDeadline),
      })));
    } else {
      const mock = generateMockTickets();
      setTickets(mock);
      localStorage.setItem('litper_sla_tickets', JSON.stringify(mock));
    }
  }, []);

  // Calculate metrics
  const metrics: SLAMetrics = {
    totalTickets: tickets.length,
    onTrack: tickets.filter(t => t.status === 'on_track').length,
    atRisk: tickets.filter(t => t.status === 'at_risk').length,
    breached: tickets.filter(t => t.status === 'breached').length,
    completed: tickets.filter(t => t.status === 'completed').length,
    avgResponseTime: Math.round(tickets.reduce((acc, t) => {
      if (t.respondedAt) {
        return acc + (t.respondedAt.getTime() - t.createdAt.getTime()) / 60000;
      }
      return acc;
    }, 0) / tickets.filter(t => t.respondedAt).length || 0),
    avgResolutionTime: Math.round(tickets.reduce((acc, t) => {
      if (t.resolvedAt) {
        return acc + (t.resolvedAt.getTime() - t.createdAt.getTime()) / 60000;
      }
      return acc;
    }, 0) / tickets.filter(t => t.resolvedAt).length || 0),
    complianceRate: Math.round(((tickets.filter(t => t.status === 'completed' || t.status === 'on_track').length) / tickets.length) * 100),
    trend: 'up',
  };

  const filteredTickets = tickets.filter(t => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase()) && !t.id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const formatTime = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
    return `${Math.floor(minutes / 1440)}d ${Math.floor((minutes % 1440) / 60)}h`;
  };

  const getTimeRemainingColor = (ticket: SLATicket): string => {
    const policy = policies.find(p => p.id === ticket.policyId);
    if (!policy) return 'text-gray-400';

    const percentRemaining = (ticket.timeRemaining / policy.targetResolutionTime) * 100;
    if (percentRemaining <= policy.alertThresholds.critical) return 'text-red-400';
    if (percentRemaining <= policy.alertThresholds.warning) return 'text-amber-400';
    return 'text-emerald-400';
  };

  const exportReport = () => {
    const csv = [
      ['ID', 'Título', 'Estado', 'Prioridad', 'Cliente', 'Empresa', 'Creado', 'Tiempo Restante', 'Cumplimiento'].join(','),
      ...tickets.map(t => [
        t.id,
        `"${t.title}"`,
        t.status,
        t.priority,
        t.customer.name,
        t.customer.company,
        t.createdAt.toISOString(),
        formatTime(t.timeRemaining),
        t.status === 'breached' ? 'No' : 'Sí',
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `sla-report-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="h-full flex flex-col bg-black/20 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-500/20 rounded-lg">
              <Gauge className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">SLA Monitor</h2>
              <p className="text-xs text-gray-400">{metrics.complianceRate}% cumplimiento general</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportReport}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-colors"
            >
              <Download className="w-4 h-4" />
              Exportar
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white/5 p-1 rounded-lg">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: Gauge },
            { id: 'tickets', label: 'Tickets', icon: FileText },
            { id: 'policies', label: 'Políticas', icon: Settings },
            { id: 'reports', label: 'Reportes', icon: TrendingUp },
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
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Metrics Grid */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">En Tiempo</span>
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                </div>
                <p className="text-2xl font-bold text-emerald-400">{metrics.onTrack}</p>
                <p className="text-xs text-gray-500 mt-1">tickets on track</p>
              </div>

              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">En Riesgo</span>
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                </div>
                <p className="text-2xl font-bold text-amber-400">{metrics.atRisk}</p>
                <p className="text-xs text-gray-500 mt-1">requieren atención</p>
              </div>

              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">Incumplidos</span>
                  <XCircle className="w-5 h-5 text-red-400" />
                </div>
                <p className="text-2xl font-bold text-red-400">{metrics.breached}</p>
                <p className="text-xs text-gray-500 mt-1">SLA breached</p>
              </div>

              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">Cumplimiento</span>
                  <Target className="w-5 h-5 text-violet-400" />
                </div>
                <p className="text-2xl font-bold text-white">{metrics.complianceRate}%</p>
                <div className="flex items-center gap-1 text-xs text-emerald-400 mt-1">
                  <TrendingUp className="w-3 h-3" />
                  +5% vs mes anterior
                </div>
              </div>
            </div>

            {/* At Risk Tickets */}
            <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
              <div className="p-4 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                    <h3 className="text-white font-medium">Tickets en Riesgo</h3>
                  </div>
                  <span className="text-xs text-gray-500">{metrics.atRisk + metrics.breached} tickets</span>
                </div>
              </div>
              <div className="divide-y divide-white/5">
                {tickets
                  .filter(t => t.status === 'at_risk' || t.status === 'breached')
                  .slice(0, 5)
                  .map(ticket => {
                    const statusStyle = statusColors[ticket.status];
                    const priorityStyle = priorityColors[ticket.priority];
                    const StatusIcon = statusStyle.icon;

                    return (
                      <div key={ticket.id} className="p-4 hover:bg-white/5 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono text-sm text-gray-400">{ticket.id}</span>
                              <span className={`px-1.5 py-0.5 rounded text-xs ${priorityStyle.bg} ${priorityStyle.text} capitalize`}>
                                {ticket.priority}
                              </span>
                              <span className={`px-1.5 py-0.5 rounded text-xs ${statusStyle.bg} ${statusStyle.text}`}>
                                {ticket.status === 'at_risk' ? 'En Riesgo' : 'Incumplido'}
                              </span>
                            </div>
                            <p className="text-white text-sm">{ticket.title}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {ticket.customer.company} • {ticket.assignee?.name || 'Sin asignar'}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className={`flex items-center gap-1 text-sm ${getTimeRemainingColor(ticket)}`}>
                              <Timer className="w-4 h-4" />
                              {ticket.timeRemaining > 0 ? formatTime(ticket.timeRemaining) : 'Vencido'}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">tiempo restante</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Response Time Chart */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <h3 className="text-white font-medium mb-4">Tiempo Promedio de Respuesta</h3>
                <div className="flex items-end gap-1 h-32">
                  {[45, 32, 28, 35, 22, 18, 25].map((value, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center">
                      <div
                        className="w-full bg-violet-500 rounded-t"
                        style={{ height: `${(value / 50) * 100}%` }}
                      />
                      <span className="text-[10px] text-gray-500 mt-1">
                        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'][i]}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex justify-between text-sm">
                  <span className="text-gray-400">Promedio: {metrics.avgResponseTime}m</span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <TrendingDown className="w-4 h-4" />
                    -12% vs semana anterior
                  </span>
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <h3 className="text-white font-medium mb-4">Distribución por Prioridad</h3>
                <div className="space-y-3">
                  {(['critical', 'high', 'medium', 'low'] as SLAPriority[]).map(priority => {
                    const count = tickets.filter(t => t.priority === priority).length;
                    const percent = (count / tickets.length) * 100;
                    const style = priorityColors[priority];

                    return (
                      <div key={priority}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className={`capitalize ${style.text}`}>{priority}</span>
                          <span className="text-gray-400">{count} ({percent.toFixed(0)}%)</span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${style.bg.replace('/10', '')}`}
                            style={{ width: `${percent}%`, backgroundColor: style.text.replace('text-', '').replace('-400', '') }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tickets Tab */}
        {activeTab === 'tickets' && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Buscar tickets..."
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
                <option value="on_track">En Tiempo</option>
                <option value="at_risk">En Riesgo</option>
                <option value="breached">Incumplido</option>
                <option value="completed">Completado</option>
              </select>

              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value as any)}
                className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none"
              >
                <option value="all">Todas las prioridades</option>
                <option value="critical">Crítica</option>
                <option value="high">Alta</option>
                <option value="medium">Media</option>
                <option value="low">Baja</option>
              </select>
            </div>

            {/* Tickets List */}
            <div className="space-y-2">
              {filteredTickets.map(ticket => {
                const statusStyle = statusColors[ticket.status];
                const priorityStyle = priorityColors[ticket.priority];
                const StatusIcon = statusStyle.icon;
                const isExpanded = selectedTicket === ticket.id;

                return (
                  <div
                    key={ticket.id}
                    className={`bg-white/5 rounded-lg border transition-all ${
                      isExpanded ? 'border-violet-500/30' : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div
                      className="p-4 cursor-pointer"
                      onClick={() => setSelectedTicket(isExpanded ? null : ticket.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={`p-1.5 rounded ${statusStyle.bg}`}>
                            <StatusIcon className={`w-4 h-4 ${statusStyle.text}`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono text-sm text-gray-400">{ticket.id}</span>
                              <span className={`px-1.5 py-0.5 rounded text-xs ${priorityStyle.bg} ${priorityStyle.text} capitalize`}>
                                {ticket.priority}
                              </span>
                            </div>
                            <p className="text-white text-sm">{ticket.title}</p>
                            <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Building className="w-3 h-3" />
                                {ticket.customer.company}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {ticket.assignee?.name || 'Sin asignar'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className={`flex items-center gap-1 text-sm ${getTimeRemainingColor(ticket)}`}>
                              <Timer className="w-4 h-4" />
                              {ticket.timeRemaining > 0 ? formatTime(ticket.timeRemaining) : 'Vencido'}
                            </div>
                          </div>
                          <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="p-4 border-t border-white/10 bg-black/30 space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Política SLA</p>
                            <p className="text-sm text-white">{policies.find(p => p.id === ticket.policyId)?.name}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Deadline Respuesta</p>
                            <p className="text-sm text-white">{ticket.responseDeadline.toLocaleString('es-CO')}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Deadline Resolución</p>
                            <p className="text-sm text-white">{ticket.resolutionDeadline.toLocaleString('es-CO')}</p>
                          </div>
                        </div>

                        {ticket.breachReason && (
                          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                            <p className="text-xs text-red-400 flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4" />
                              Razón de incumplimiento: {ticket.breachReason}
                            </p>
                          </div>
                        )}

                        <div className="flex justify-end gap-2">
                          <button className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-colors">
                            Ver Historial
                          </button>
                          <button className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm transition-colors">
                            Escalar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Policies Tab */}
        {activeTab === 'policies' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm transition-colors">
                <Plus className="w-4 h-4" />
                Nueva Política
              </button>
            </div>

            <div className="space-y-3">
              {policies.map(policy => {
                const priorityStyle = priorityColors[policy.priority];

                return (
                  <div
                    key={policy.id}
                    className="bg-white/5 rounded-xl border border-white/10 p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-white font-medium">{policy.name}</h3>
                          <span className={`px-2 py-0.5 rounded text-xs ${priorityStyle.bg} ${priorityStyle.text} capitalize`}>
                            {policy.priority}
                          </span>
                          {policy.isActive ? (
                            <span className="px-2 py-0.5 rounded text-xs bg-emerald-500/20 text-emerald-400">Activa</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-xs bg-gray-500/20 text-gray-400">Inactiva</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400">{policy.description}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-2 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-400 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-white/10">
                      <div>
                        <p className="text-xs text-gray-500">Respuesta</p>
                        <p className="text-sm text-white">{formatTime(policy.targetResponseTime)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Resolución</p>
                        <p className="text-sm text-white">{formatTime(policy.targetResolutionTime)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Alertas</p>
                        <div className="flex gap-1 mt-1">
                          {policy.alertChannels.map(channel => {
                            const Icon = channelIcons[channel];
                            return <Icon key={channel} className="w-4 h-4 text-gray-400" />;
                          })}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Umbrales</p>
                        <p className="text-sm text-white">
                          <span className="text-amber-400">{policy.alertThresholds.warning}%</span>
                          {' / '}
                          <span className="text-red-400">{policy.alertThresholds.critical}%</span>
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-white/10">
                      <p className="text-xs text-gray-500 mb-2">Categorías:</p>
                      <div className="flex flex-wrap gap-1">
                        {policy.categories.map(cat => (
                          <span key={cat} className="px-2 py-0.5 bg-white/5 text-gray-400 rounded text-xs">
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <h3 className="text-white font-medium mb-4">Cumplimiento Semanal</h3>
                <div className="flex items-end gap-2 h-40">
                  {[92, 88, 95, 91, 97, 89, 94].map((value, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center">
                      <div
                        className={`w-full rounded-t ${value >= 90 ? 'bg-emerald-500' : value >= 80 ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ height: `${value}%` }}
                      />
                      <span className="text-[10px] text-gray-500 mt-1">S{i + 1}</span>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-400 mt-4">Objetivo: 95% cumplimiento</p>
              </div>

              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <h3 className="text-white font-medium mb-4">Rendimiento por Equipo</h3>
                <div className="space-y-3">
                  {[
                    { name: 'Soporte Técnico', compliance: 96, tickets: 45 },
                    { name: 'Ventas', compliance: 89, tickets: 23 },
                    { name: 'Finanzas', compliance: 94, tickets: 18 },
                    { name: 'Operaciones', compliance: 91, tickets: 32 },
                  ].map(team => (
                    <div key={team.name}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-white">{team.name}</span>
                        <span className={team.compliance >= 90 ? 'text-emerald-400' : 'text-amber-400'}>
                          {team.compliance}%
                        </span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${team.compliance >= 90 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                          style={{ width: `${team.compliance}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <h3 className="text-white font-medium mb-4">Resumen del Período</h3>
              <div className="grid grid-cols-5 gap-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-white">{metrics.totalTickets}</p>
                  <p className="text-xs text-gray-500">Total Tickets</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-emerald-400">{metrics.completed}</p>
                  <p className="text-xs text-gray-500">Resueltos</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-red-400">{metrics.breached}</p>
                  <p className="text-xs text-gray-500">Incumplidos</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-white">{formatTime(metrics.avgResponseTime)}</p>
                  <p className="text-xs text-gray-500">Tiempo Respuesta</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-white">{formatTime(metrics.avgResolutionTime)}</p>
                  <p className="text-xs text-gray-500">Tiempo Resolución</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SLAMonitor;
