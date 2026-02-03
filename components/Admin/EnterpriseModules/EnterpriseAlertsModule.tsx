'use client';

import React, { useState, useEffect } from 'react';
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  XCircle,
  Clock,
  Settings,
  Plus,
  Search,
  Filter,
  Trash2,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  Mail,
  MessageSquare,
  Phone,
  Webhook,
  ChevronDown,
  RefreshCw,
  Zap,
  DollarSign,
  Users,
  Shield,
  Database,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react';

// ============================================
// ENTERPRISE ALERTS MODULE
// Centro de alertas empresariales
// ============================================

type AlertSeverity = 'critical' | 'warning' | 'info' | 'success';
type AlertCategory = 'system' | 'finance' | 'security' | 'performance' | 'user' | 'integration';
type AlertStatus = 'active' | 'acknowledged' | 'resolved' | 'snoozed';
type NotificationChannel = 'email' | 'slack' | 'sms' | 'webhook' | 'push';

interface Alert {
  id: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  category: AlertCategory;
  status: AlertStatus;
  timestamp: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  acknowledgedBy?: string;
  source: string;
  metadata?: Record<string, any>;
  actions?: AlertAction[];
}

interface AlertAction {
  label: string;
  action: string;
  variant: 'primary' | 'secondary' | 'danger';
}

interface AlertRule {
  id: string;
  name: string;
  description: string;
  condition: string;
  severity: AlertSeverity;
  category: AlertCategory;
  channels: NotificationChannel[];
  isEnabled: boolean;
  cooldown: number; // minutes
  lastTriggered?: Date;
}

const severityConfig: Record<AlertSeverity, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  critical: { label: 'Crítico', color: 'text-red-400', bg: 'bg-red-500/10', icon: XCircle },
  warning: { label: 'Advertencia', color: 'text-amber-400', bg: 'bg-amber-500/10', icon: AlertTriangle },
  info: { label: 'Info', color: 'text-blue-400', bg: 'bg-blue-500/10', icon: Info },
  success: { label: 'Éxito', color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: CheckCircle },
};

const categoryConfig: Record<AlertCategory, { label: string; icon: React.ElementType; color: string }> = {
  system: { label: 'Sistema', icon: Database, color: 'text-gray-400' },
  finance: { label: 'Finanzas', icon: DollarSign, color: 'text-emerald-400' },
  security: { label: 'Seguridad', icon: Shield, color: 'text-red-400' },
  performance: { label: 'Rendimiento', icon: Zap, color: 'text-amber-400' },
  user: { label: 'Usuarios', icon: Users, color: 'text-violet-400' },
  integration: { label: 'Integración', icon: Webhook, color: 'text-cyan-400' },
};

const channelIcons: Record<NotificationChannel, React.ElementType> = {
  email: Mail,
  slack: MessageSquare,
  sms: Phone,
  webhook: Webhook,
  push: Bell,
};

// Mock data
const generateMockAlerts = (): Alert[] => [
  {
    id: 'alert_1',
    title: 'Factura vencida hace 15 días',
    message: 'La factura LITPER-2024-0098 de Empresa XYZ está vencida hace 15 días. Monto pendiente: $2,450,000',
    severity: 'critical',
    category: 'finance',
    status: 'active',
    timestamp: new Date(Date.now() - 300000),
    source: 'Módulo Facturación',
    metadata: { invoiceId: 'LITPER-2024-0098', amount: 2450000 },
    actions: [
      { label: 'Ver Factura', action: 'view_invoice', variant: 'secondary' },
      { label: 'Enviar Recordatorio', action: 'send_reminder', variant: 'primary' },
    ],
  },
  {
    id: 'alert_2',
    title: 'Intento de acceso no autorizado',
    message: '5 intentos fallidos de login desde IP 192.168.1.100 en los últimos 10 minutos',
    severity: 'warning',
    category: 'security',
    status: 'active',
    timestamp: new Date(Date.now() - 600000),
    source: 'Módulo Seguridad',
    metadata: { ip: '192.168.1.100', attempts: 5 },
    actions: [
      { label: 'Bloquear IP', action: 'block_ip', variant: 'danger' },
      { label: 'Revisar Logs', action: 'view_logs', variant: 'secondary' },
    ],
  },
  {
    id: 'alert_3',
    title: 'Webhook Stripe fallando',
    message: 'El webhook de Stripe ha fallado 3 veces consecutivas. Última respuesta: 502 Bad Gateway',
    severity: 'warning',
    category: 'integration',
    status: 'acknowledged',
    timestamp: new Date(Date.now() - 1800000),
    acknowledgedAt: new Date(Date.now() - 1200000),
    acknowledgedBy: 'Carlos Méndez',
    source: 'Webhooks Center',
    actions: [
      { label: 'Reintentar', action: 'retry_webhook', variant: 'primary' },
      { label: 'Configurar', action: 'configure', variant: 'secondary' },
    ],
  },
  {
    id: 'alert_4',
    title: 'Uso de almacenamiento al 85%',
    message: 'El almacenamiento de archivos está alcanzando su límite. Se recomienda limpiar archivos antiguos o aumentar capacidad.',
    severity: 'info',
    category: 'system',
    status: 'active',
    timestamp: new Date(Date.now() - 3600000),
    source: 'Monitor de Recursos',
    metadata: { usage: 85, total: '100GB' },
  },
  {
    id: 'alert_5',
    title: 'Nómina procesada exitosamente',
    message: 'La nómina de enero 2025 ha sido procesada. 12 empleados, total: $18,500,000',
    severity: 'success',
    category: 'finance',
    status: 'resolved',
    timestamp: new Date(Date.now() - 86400000),
    resolvedAt: new Date(Date.now() - 82800000),
    source: 'Módulo Nómina',
  },
  {
    id: 'alert_6',
    title: 'SLA en riesgo - Ticket #1234',
    message: 'El ticket #1234 está a 30 minutos de incumplir el SLA. Prioridad: Alta',
    severity: 'warning',
    category: 'performance',
    status: 'active',
    timestamp: new Date(Date.now() - 120000),
    source: 'SLA Monitor',
    metadata: { ticketId: '1234', timeRemaining: 30 },
    actions: [
      { label: 'Ver Ticket', action: 'view_ticket', variant: 'primary' },
      { label: 'Escalar', action: 'escalate', variant: 'danger' },
    ],
  },
];

const mockRules: AlertRule[] = [
  {
    id: 'rule_1',
    name: 'Factura Vencida',
    description: 'Alerta cuando una factura supera su fecha de vencimiento',
    condition: 'invoice.dueDate < now() AND invoice.status != "paid"',
    severity: 'critical',
    category: 'finance',
    channels: ['email', 'slack'],
    isEnabled: true,
    cooldown: 1440,
    lastTriggered: new Date(Date.now() - 3600000),
  },
  {
    id: 'rule_2',
    name: 'Intentos de Login Fallidos',
    description: 'Alerta cuando hay más de 3 intentos fallidos desde una IP',
    condition: 'login.failed_attempts > 3 AND login.timeframe < 10min',
    severity: 'warning',
    category: 'security',
    channels: ['email', 'slack', 'sms'],
    isEnabled: true,
    cooldown: 30,
    lastTriggered: new Date(Date.now() - 600000),
  },
  {
    id: 'rule_3',
    name: 'SLA en Riesgo',
    description: 'Alerta cuando un ticket está a menos del 25% de su tiempo SLA',
    condition: 'ticket.sla_remaining < 25%',
    severity: 'warning',
    category: 'performance',
    channels: ['slack', 'push'],
    isEnabled: true,
    cooldown: 15,
  },
  {
    id: 'rule_4',
    name: 'Webhook Fallando',
    description: 'Alerta cuando un webhook falla más de 2 veces consecutivas',
    condition: 'webhook.consecutive_failures > 2',
    severity: 'warning',
    category: 'integration',
    channels: ['email', 'slack'],
    isEnabled: true,
    cooldown: 60,
  },
];

export function EnterpriseAlertsModule() {
  const [activeTab, setActiveTab] = useState<'alerts' | 'rules' | 'settings'>('alerts');
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [rules, setRules] = useState<AlertRule[]>(mockRules);
  const [filterSeverity, setFilterSeverity] = useState<AlertSeverity | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<AlertStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    setAlerts(generateMockAlerts());
  }, []);

  const filteredAlerts = alerts.filter(alert => {
    if (filterSeverity !== 'all' && alert.severity !== filterSeverity) return false;
    if (filterStatus !== 'all' && alert.status !== filterStatus) return false;
    if (searchQuery && !alert.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const stats = {
    critical: alerts.filter(a => a.severity === 'critical' && a.status === 'active').length,
    warning: alerts.filter(a => a.severity === 'warning' && a.status === 'active').length,
    info: alerts.filter(a => a.severity === 'info' && a.status === 'active').length,
    total: alerts.filter(a => a.status === 'active').length,
  };

  const acknowledgeAlert = (id: string) => {
    setAlerts(prev => prev.map(a => {
      if (a.id === id) {
        return { ...a, status: 'acknowledged', acknowledgedAt: new Date(), acknowledgedBy: 'Usuario Actual' };
      }
      return a;
    }));
  };

  const resolveAlert = (id: string) => {
    setAlerts(prev => prev.map(a => {
      if (a.id === id) {
        return { ...a, status: 'resolved', resolvedAt: new Date() };
      }
      return a;
    }));
  };

  const dismissAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  const toggleRule = (id: string) => {
    setRules(prev => prev.map(r => {
      if (r.id === id) {
        return { ...r, isEnabled: !r.isEnabled };
      }
      return r;
    }));
  };

  const formatTime = (date: Date): string => {
    const diff = Date.now() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `Hace ${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Hace ${hours}h`;
    return `Hace ${Math.floor(hours / 24)}d`;
  };

  return (
    <div className="h-full flex flex-col bg-black/20 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-lg relative">
              <Bell className="w-5 h-5 text-amber-400" />
              {stats.total > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                  {stats.total}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Centro de Alertas</h2>
              <p className="text-xs text-gray-400">{stats.total} alertas activas</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-2 rounded-lg transition-colors ${
                isMuted ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-gray-400'
              }`}
              title={isMuted ? 'Activar sonidos' : 'Silenciar'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm transition-colors">
              <Plus className="w-4 h-4" />
              Nueva Regla
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          {(['critical', 'warning', 'info'] as AlertSeverity[]).map(severity => {
            const config = severityConfig[severity];
            const count = alerts.filter(a => a.severity === severity && a.status === 'active').length;

            return (
              <button
                key={severity}
                onClick={() => setFilterSeverity(filterSeverity === severity ? 'all' : severity)}
                className={`p-3 rounded-lg border transition-all ${
                  filterSeverity === severity
                    ? `${config.bg} border-${severity === 'critical' ? 'red' : severity === 'warning' ? 'amber' : 'blue'}-500/30`
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <config.icon className={`w-5 h-5 ${config.color}`} />
                  <span className={`text-xl font-bold ${config.color}`}>{count}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{config.label}</p>
              </button>
            );
          })}
          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
            <div className="flex items-center justify-between">
              <Bell className="w-5 h-5 text-gray-400" />
              <span className="text-xl font-bold text-white">{stats.total}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Total Activas</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white/5 p-1 rounded-lg">
          {[
            { id: 'alerts', label: 'Alertas', icon: Bell },
            { id: 'rules', label: 'Reglas', icon: Settings },
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
        {/* Alerts Tab */}
        {activeTab === 'alerts' && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Buscar alertas..."
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
                <option value="acknowledged">Reconocidas</option>
                <option value="resolved">Resueltas</option>
              </select>
            </div>

            {/* Alerts List */}
            <div className="space-y-2">
              {filteredAlerts.map(alert => {
                const severity = severityConfig[alert.severity];
                const category = categoryConfig[alert.category];
                const SeverityIcon = severity.icon;
                const CategoryIcon = category.icon;
                const isExpanded = expandedAlert === alert.id;

                return (
                  <div
                    key={alert.id}
                    className={`rounded-lg border overflow-hidden transition-all ${
                      alert.status === 'active'
                        ? `${severity.bg} border-${alert.severity === 'critical' ? 'red' : alert.severity === 'warning' ? 'amber' : 'blue'}-500/20`
                        : 'bg-white/5 border-white/10'
                    }`}
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${severity.bg}`}>
                            <SeverityIcon className={`w-5 h-5 ${severity.color}`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-white font-medium">{alert.title}</h3>
                              {alert.status !== 'active' && (
                                <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                                  alert.status === 'acknowledged' ? 'bg-blue-500/20 text-blue-400' :
                                  alert.status === 'resolved' ? 'bg-emerald-500/20 text-emerald-400' :
                                  'bg-gray-500/20 text-gray-400'
                                }`}>
                                  {alert.status === 'acknowledged' ? 'Reconocida' : alert.status === 'resolved' ? 'Resuelta' : alert.status}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-400">{alert.message}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <CategoryIcon className="w-3 h-3" />
                                {category.label}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatTime(alert.timestamp)}
                              </span>
                              <span>{alert.source}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          {alert.status === 'active' && (
                            <>
                              <button
                                onClick={() => acknowledgeAlert(alert.id)}
                                className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
                                title="Reconocer"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => resolveAlert(alert.id)}
                                className="p-1.5 hover:bg-emerald-500/10 rounded text-gray-400 hover:text-emerald-400 transition-colors"
                                title="Resolver"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => dismissAlert(alert.id)}
                            className="p-1.5 hover:bg-red-500/10 rounded text-gray-400 hover:text-red-400 transition-colors"
                            title="Descartar"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          {alert.actions && (
                            <button
                              onClick={() => setExpandedAlert(isExpanded ? null : alert.id)}
                              className="p-1.5 hover:bg-white/10 rounded text-gray-400 transition-colors"
                            >
                              <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    {isExpanded && alert.actions && (
                      <div className="px-4 pb-4 pt-2 border-t border-white/10 flex gap-2">
                        {alert.actions.map((action, i) => (
                          <button
                            key={i}
                            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                              action.variant === 'primary' ? 'bg-violet-600 hover:bg-violet-700 text-white' :
                              action.variant === 'danger' ? 'bg-red-600 hover:bg-red-700 text-white' :
                              'bg-white/10 hover:bg-white/20 text-white'
                            }`}
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {filteredAlerts.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <Bell className="w-12 h-12 mb-4 opacity-50" />
                  <p className="text-sm">No hay alertas</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Rules Tab */}
        {activeTab === 'rules' && (
          <div className="space-y-4">
            {rules.map(rule => {
              const severity = severityConfig[rule.severity];
              const category = categoryConfig[rule.category];
              const CategoryIcon = category.icon;

              return (
                <div
                  key={rule.id}
                  className={`bg-white/5 rounded-xl border border-white/10 p-4 ${
                    !rule.isEnabled ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-white font-medium">{rule.name}</h3>
                        <span className={`px-1.5 py-0.5 rounded text-xs ${severity.bg} ${severity.color}`}>
                          {severity.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400">{rule.description}</p>
                    </div>

                    <button
                      onClick={() => toggleRule(rule.id)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        rule.isEnabled ? 'bg-emerald-500' : 'bg-gray-600'
                      }`}
                    >
                      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                        rule.isEnabled ? 'left-7' : 'left-1'
                      }`} />
                    </button>
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Categoría</p>
                        <div className="flex items-center gap-1">
                          <CategoryIcon className={`w-4 h-4 ${category.color}`} />
                          <span className="text-gray-300">{category.label}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Canales</p>
                        <div className="flex gap-1">
                          {rule.channels.map(channel => {
                            const Icon = channelIcons[channel];
                            return <Icon key={channel} className="w-4 h-4 text-gray-400" />;
                          })}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Cooldown</p>
                        <span className="text-gray-300">{rule.cooldown} min</span>
                      </div>
                    </div>

                    <div className="mt-3">
                      <p className="text-xs text-gray-500 mb-1">Condición</p>
                      <code className="text-xs text-violet-400 font-mono">{rule.condition}</code>
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

export default EnterpriseAlertsModule;
