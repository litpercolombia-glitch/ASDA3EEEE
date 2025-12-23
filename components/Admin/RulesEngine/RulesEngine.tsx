// ============================================
// LITPER PRO - RULES ENGINE
// Motor de reglas de negocio automatizadas
// ============================================

import React, { useState } from 'react';
import {
  Cog,
  Zap,
  PlusCircle,
  Play,
  Pause,
  Trash2,
  Edit2,
  Copy,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Settings,
  Bell,
  Mail,
  Smartphone,
  DollarSign,
  Package,
  Truck,
  MapPin,
  Users,
  TrendingDown,
  Shield,
  Lock,
  Unlock,
  Activity,
  Filter,
  Search,
} from 'lucide-react';

// ============================================
// TIPOS
// ============================================

interface Rule {
  id: string;
  name: string;
  description: string;
  category: 'logistica' | 'finanzas' | 'clientes' | 'seguridad';
  trigger: {
    type: 'condition' | 'schedule' | 'event';
    config: Record<string, unknown>;
  };
  conditions: Condition[];
  actions: Action[];
  enabled: boolean;
  priority: 'high' | 'medium' | 'low';
  executionCount: number;
  lastExecuted?: Date;
  createdAt: Date;
}

interface Condition {
  id: string;
  field: string;
  operator: 'equals' | 'greater' | 'less' | 'contains' | 'between';
  value: string | number;
  logicalOperator?: 'AND' | 'OR';
}

interface Action {
  id: string;
  type: 'notify' | 'email' | 'pause' | 'flag' | 'webhook' | 'update';
  config: Record<string, unknown>;
}

// ============================================
// DATOS MOCK
// ============================================

const RULES: Rule[] = [
  {
    id: '1',
    name: 'Pausar ciudad con tasa crítica',
    description: 'Pausa automáticamente los envíos cuando la tasa de entrega cae por debajo del 50%',
    category: 'logistica',
    trigger: { type: 'condition', config: {} },
    conditions: [
      { id: '1', field: 'tasaEntrega', operator: 'less', value: 50 },
    ],
    actions: [
      { id: '1', type: 'pause', config: { target: 'city' } },
      { id: '2', type: 'notify', config: { message: 'Ciudad pausada por tasa crítica' } },
      { id: '3', type: 'email', config: { to: 'admin@litper.co' } },
    ],
    enabled: true,
    priority: 'high',
    executionCount: 12,
    lastExecuted: new Date(Date.now() - 2 * 60 * 60 * 1000),
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    name: 'Alerta de margen bajo',
    description: 'Envía alerta cuando el margen bruto cae por debajo del 15%',
    category: 'finanzas',
    trigger: { type: 'condition', config: {} },
    conditions: [
      { id: '1', field: 'margenBruto', operator: 'less', value: 15 },
    ],
    actions: [
      { id: '1', type: 'notify', config: { priority: 'urgent' } },
      { id: '2', type: 'email', config: { to: 'finanzas@litper.co' } },
    ],
    enabled: true,
    priority: 'high',
    executionCount: 5,
    lastExecuted: new Date(Date.now() - 24 * 60 * 60 * 1000),
    createdAt: new Date('2024-01-05'),
  },
  {
    id: '3',
    name: 'Prepago obligatorio zona roja',
    description: 'Requiere prepago para ciudades con más de 15% de devolución',
    category: 'logistica',
    trigger: { type: 'condition', config: {} },
    conditions: [
      { id: '1', field: 'tasaDevolucion', operator: 'greater', value: 15 },
    ],
    actions: [
      { id: '1', type: 'flag', config: { flag: 'prepago_obligatorio' } },
      { id: '2', type: 'notify', config: { message: 'Prepago activado' } },
    ],
    enabled: true,
    priority: 'medium',
    executionCount: 28,
    lastExecuted: new Date(Date.now() - 4 * 60 * 60 * 1000),
    createdAt: new Date('2024-01-10'),
  },
  {
    id: '4',
    name: 'Reporte diario automático',
    description: 'Genera y envía el reporte diario a las 8am',
    category: 'logistica',
    trigger: { type: 'schedule', config: { cron: '0 8 * * *' } },
    conditions: [],
    actions: [
      { id: '1', type: 'webhook', config: { url: '/api/generate-report' } },
      { id: '2', type: 'email', config: { to: 'equipo@litper.co', template: 'daily-report' } },
    ],
    enabled: true,
    priority: 'low',
    executionCount: 45,
    lastExecuted: new Date(Date.now() - 8 * 60 * 60 * 1000),
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '5',
    name: 'Cliente VIP - Prioridad alta',
    description: 'Marca como prioritario los pedidos de clientes con más de 10 compras',
    category: 'clientes',
    trigger: { type: 'event', config: { event: 'new_order' } },
    conditions: [
      { id: '1', field: 'totalCompras', operator: 'greater', value: 10 },
    ],
    actions: [
      { id: '1', type: 'flag', config: { flag: 'vip_priority' } },
      { id: '2', type: 'update', config: { field: 'priority', value: 'high' } },
    ],
    enabled: false,
    priority: 'medium',
    executionCount: 156,
    lastExecuted: new Date(Date.now() - 1 * 60 * 60 * 1000),
    createdAt: new Date('2024-01-03'),
  },
];

const RULE_TEMPLATES = [
  {
    id: 'pause-low-rate',
    name: 'Pausar por tasa baja',
    icon: Pause,
    color: 'from-red-500 to-rose-500',
  },
  {
    id: 'prepago-required',
    name: 'Prepago obligatorio',
    icon: Lock,
    color: 'from-amber-500 to-orange-500',
  },
  {
    id: 'alert-margin',
    name: 'Alerta de margen',
    icon: TrendingDown,
    color: 'from-purple-500 to-violet-500',
  },
  {
    id: 'vip-customer',
    name: 'Cliente VIP',
    icon: Users,
    color: 'from-blue-500 to-cyan-500',
  },
];

// ============================================
// COMPONENTES AUXILIARES
// ============================================

const PriorityBadge: React.FC<{ priority: Rule['priority'] }> = ({ priority }) => {
  const colors = {
    high: 'bg-red-500/20 text-red-400',
    medium: 'bg-amber-500/20 text-amber-400',
    low: 'bg-blue-500/20 text-blue-400',
  };

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[priority]}`}>
      {priority === 'high' ? 'Alta' : priority === 'medium' ? 'Media' : 'Baja'}
    </span>
  );
};

const CategoryIcon: React.FC<{ category: Rule['category'] }> = ({ category }) => {
  const icons = {
    logistica: Truck,
    finanzas: DollarSign,
    clientes: Users,
    seguridad: Shield,
  };
  const Icon = icons[category];
  return <Icon className="w-4 h-4" />;
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export const RulesEngine: React.FC = () => {
  const [rules, setRules] = useState<Rule[]>(RULES);
  const [expandedRule, setExpandedRule] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('todos');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const toggleRule = (ruleId: string) => {
    setRules(prev => prev.map(rule =>
      rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
    ));
  };

  const filteredRules = rules.filter(rule => {
    const matchesSearch = rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'todos' || rule.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const stats = {
    total: rules.length,
    active: rules.filter(r => r.enabled).length,
    executions: rules.reduce((sum, r) => sum + r.executionCount, 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl shadow-xl shadow-amber-500/30">
            <Cog className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Motor de Reglas</h1>
            <p className="text-slate-400">Automatiza tus procesos de negocio</p>
          </div>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 transition-all"
        >
          <PlusCircle className="w-5 h-5" />
          Nueva Regla
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-navy-800/50 rounded-xl border border-navy-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400">Total Reglas</span>
            <Cog className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
        </div>

        <div className="p-4 bg-navy-800/50 rounded-xl border border-navy-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400">Activas</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400">{stats.active}</p>
        </div>

        <div className="p-4 bg-navy-800/50 rounded-xl border border-navy-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400">Ejecuciones</span>
            <Activity className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-white">{stats.executions}</p>
        </div>
      </div>

      {/* Quick Templates */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {RULE_TEMPLATES.map((template) => {
          const Icon = template.icon;
          return (
            <button
              key={template.id}
              className="p-4 bg-navy-800/50 rounded-xl border border-navy-700 hover:border-navy-600 transition-all group"
            >
              <div className={`p-2 rounded-lg bg-gradient-to-br ${template.color} w-fit mb-3`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-medium text-white group-hover:text-amber-400 transition-colors">
                {template.name}
              </p>
              <p className="text-xs text-slate-400 mt-1">Usar template</p>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-navy-800 rounded-xl border border-navy-700">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar reglas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-white placeholder-slate-400 outline-none"
          />
        </div>

        <div className="flex gap-2">
          {['todos', 'logistica', 'finanzas', 'clientes', 'seguridad'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-4 py-2 rounded-xl font-medium capitalize transition-all ${
                filterCategory === cat
                  ? 'bg-amber-600 text-white'
                  : 'bg-navy-800 text-slate-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Rules List */}
      <div className="space-y-4">
        {filteredRules.map((rule) => (
          <div
            key={rule.id}
            className={`bg-navy-800/50 rounded-2xl border overflow-hidden transition-all ${
              rule.enabled ? 'border-navy-700' : 'border-navy-800 opacity-60'
            }`}
          >
            {/* Rule Header */}
            <div
              className="p-5 flex items-center justify-between cursor-pointer"
              onClick={() => setExpandedRule(expandedRule === rule.id ? null : rule.id)}
            >
              <div className="flex items-center gap-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleRule(rule.id);
                  }}
                  className={`p-2 rounded-lg transition-all ${
                    rule.enabled
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-slate-700 text-slate-500'
                  }`}
                >
                  {rule.enabled ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                </button>

                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-white">{rule.name}</h3>
                    <PriorityBadge priority={rule.priority} />
                  </div>
                  <p className="text-sm text-slate-400 mt-1">{rule.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right hidden md:block">
                  <p className="text-sm text-slate-300">{rule.executionCount} ejecuciones</p>
                  {rule.lastExecuted && (
                    <p className="text-xs text-slate-500">
                      Última: {rule.lastExecuted.toLocaleString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
                {expandedRule === rule.id ? (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                )}
              </div>
            </div>

            {/* Expanded Details */}
            {expandedRule === rule.id && (
              <div className="px-5 pb-5 pt-0 border-t border-navy-700">
                <div className="grid md:grid-cols-2 gap-6 mt-4">
                  {/* Conditions */}
                  <div>
                    <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                      <Filter className="w-4 h-4 text-blue-400" />
                      Condiciones
                    </h4>
                    <div className="space-y-2">
                      {rule.conditions.length > 0 ? (
                        rule.conditions.map((condition, index) => (
                          <div key={condition.id} className="flex items-center gap-2 text-sm">
                            {index > 0 && (
                              <span className="px-2 py-0.5 bg-navy-700 text-slate-400 rounded">
                                {condition.logicalOperator || 'AND'}
                              </span>
                            )}
                            <span className="text-white">{condition.field}</span>
                            <span className="text-amber-400">{condition.operator}</span>
                            <span className="text-emerald-400">{condition.value}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500">Sin condiciones (se ejecuta siempre)</p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div>
                    <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-400" />
                      Acciones
                    </h4>
                    <div className="space-y-2">
                      {rule.actions.map((action) => (
                        <div key={action.id} className="flex items-center gap-2 text-sm">
                          <div className={`p-1 rounded ${
                            action.type === 'notify' ? 'bg-blue-500/20' :
                            action.type === 'email' ? 'bg-purple-500/20' :
                            action.type === 'pause' ? 'bg-red-500/20' :
                            'bg-amber-500/20'
                          }`}>
                            {action.type === 'notify' && <Bell className="w-3 h-3 text-blue-400" />}
                            {action.type === 'email' && <Mail className="w-3 h-3 text-purple-400" />}
                            {action.type === 'pause' && <Pause className="w-3 h-3 text-red-400" />}
                            {action.type === 'flag' && <AlertTriangle className="w-3 h-3 text-amber-400" />}
                            {action.type === 'webhook' && <Zap className="w-3 h-3 text-emerald-400" />}
                            {action.type === 'update' && <Settings className="w-3 h-3 text-cyan-400" />}
                          </div>
                          <span className="text-white capitalize">{action.type}</span>
                          <ArrowRight className="w-3 h-3 text-slate-500" />
                          <span className="text-slate-400">{JSON.stringify(action.config)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Actions buttons */}
                <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-navy-700">
                  <button className="flex items-center gap-2 px-3 py-1.5 bg-navy-700 hover:bg-navy-600 text-slate-300 rounded-lg text-sm transition-all">
                    <Copy className="w-4 h-4" />
                    Duplicar
                  </button>
                  <button className="flex items-center gap-2 px-3 py-1.5 bg-navy-700 hover:bg-navy-600 text-slate-300 rounded-lg text-sm transition-all">
                    <Edit2 className="w-4 h-4" />
                    Editar
                  </button>
                  <button className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm transition-all">
                    <Trash2 className="w-4 h-4" />
                    Eliminar
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RulesEngine;
