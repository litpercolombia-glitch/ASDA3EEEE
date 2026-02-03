'use client';

import React, { useState, useEffect } from 'react';
import {
  Activity,
  Clock,
  User,
  FileText,
  DollarSign,
  Settings,
  Shield,
  Bell,
  Filter,
  Search,
  ChevronDown,
  ExternalLink,
  RefreshCw,
  Download,
  Trash2,
  Eye,
  Edit,
  Plus,
  Check,
  X,
  AlertTriangle,
  Info,
  Zap,
  Database,
  Globe,
  Mail,
  CreditCard,
  Users,
  Building,
  Calendar,
} from 'lucide-react';

// ============================================
// ACTIVITY LOG GLOBAL - ESTILO VERCEL
// Timeline de actividad empresarial
// ============================================

interface ActivityEvent {
  id: string;
  type: 'create' | 'update' | 'delete' | 'view' | 'login' | 'logout' | 'export' | 'import' | 'payment' | 'alert' | 'system';
  category: 'user' | 'finance' | 'document' | 'security' | 'integration' | 'system';
  action: string;
  description: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  metadata?: Record<string, any>;
  timestamp: Date;
  ip?: string;
  userAgent?: string;
  status: 'success' | 'warning' | 'error' | 'pending';
  affectedResource?: {
    type: string;
    id: string;
    name: string;
  };
}

interface FilterState {
  types: string[];
  categories: string[];
  users: string[];
  dateRange: { start: Date | null; end: Date | null };
  status: string[];
  search: string;
}

// Datos de ejemplo
const generateMockEvents = (): ActivityEvent[] => {
  const users = [
    { id: 'u1', name: 'Carlos Méndez', email: 'carlos@litper.com' },
    { id: 'u2', name: 'María García', email: 'maria@litper.com' },
    { id: 'u3', name: 'Juan Rodríguez', email: 'juan@litper.com' },
    { id: 'u4', name: 'Ana López', email: 'ana@litper.com' },
    { id: 'system', name: 'Sistema', email: 'system@litper.com' },
  ];

  const events: Partial<ActivityEvent>[] = [
    { type: 'create', category: 'finance', action: 'Factura creada', description: 'Nueva factura LITPER-2025-0042 por $2,450,000', status: 'success', affectedResource: { type: 'invoice', id: 'inv-042', name: 'LITPER-2025-0042' } },
    { type: 'payment', category: 'finance', action: 'Pago recibido', description: 'Pago de $1,200,000 de Empresa ABC', status: 'success', affectedResource: { type: 'payment', id: 'pay-123', name: 'PAY-2025-0123' } },
    { type: 'login', category: 'security', action: 'Inicio de sesión', description: 'Acceso desde IP 192.168.1.100', status: 'success' },
    { type: 'export', category: 'document', action: 'Exportación PDF', description: 'Reporte P&L Q4 2024 exportado', status: 'success', affectedResource: { type: 'report', id: 'rep-q4', name: 'P&L Q4 2024' } },
    { type: 'update', category: 'user', action: 'Perfil actualizado', description: 'Información de contacto modificada', status: 'success' },
    { type: 'alert', category: 'system', action: 'Alerta SLA', description: 'Ticket #1234 próximo a vencer en 2 horas', status: 'warning', affectedResource: { type: 'ticket', id: 'tkt-1234', name: 'Ticket #1234' } },
    { type: 'delete', category: 'finance', action: 'Gasto eliminado', description: 'Gasto de publicidad de $150,000 eliminado', status: 'success' },
    { type: 'import', category: 'document', action: 'Importación CSV', description: '150 registros de gastos importados', status: 'success' },
    { type: 'system', category: 'system', action: 'Backup automático', description: 'Respaldo diario completado exitosamente', status: 'success' },
    { type: 'login', category: 'security', action: 'Intento de acceso', description: 'Intento fallido desde IP sospechosa', status: 'error' },
    { type: 'create', category: 'user', action: 'Usuario creado', description: 'Nuevo usuario: Pedro Sánchez agregado', status: 'success', affectedResource: { type: 'user', id: 'u5', name: 'Pedro Sánchez' } },
    { type: 'update', category: 'finance', action: 'Nómina procesada', description: 'Nómina de enero 2025 - 12 empleados', status: 'success' },
    { type: 'view', category: 'document', action: 'Documento visualizado', description: 'Contrato cliente XYZ revisado', status: 'success' },
    { type: 'alert', category: 'finance', action: 'Factura vencida', description: 'Factura LITPER-2024-0098 vencida hace 5 días', status: 'error', affectedResource: { type: 'invoice', id: 'inv-098', name: 'LITPER-2024-0098' } },
    { type: 'system', category: 'integration', action: 'Webhook ejecutado', description: 'Webhook de Stripe procesado correctamente', status: 'success' },
  ];

  const now = new Date();
  return events.map((event, index) => ({
    id: `evt-${index + 1}`,
    ...event,
    user: users[Math.floor(Math.random() * users.length)],
    timestamp: new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Last 7 days
    ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
  })) as ActivityEvent[];
};

const typeIcons: Record<string, React.ElementType> = {
  create: Plus,
  update: Edit,
  delete: Trash2,
  view: Eye,
  login: User,
  logout: User,
  export: Download,
  import: Database,
  payment: CreditCard,
  alert: Bell,
  system: Settings,
};

const categoryIcons: Record<string, React.ElementType> = {
  user: Users,
  finance: DollarSign,
  document: FileText,
  security: Shield,
  integration: Globe,
  system: Settings,
};

const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
  success: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  warning: { bg: 'bg-amber-500/10', text: 'text-amber-400', dot: 'bg-amber-400' },
  error: { bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-400' },
  pending: { bg: 'bg-blue-500/10', text: 'text-blue-400', dot: 'bg-blue-400' },
};

const categoryColors: Record<string, string> = {
  user: 'text-violet-400',
  finance: 'text-emerald-400',
  document: 'text-blue-400',
  security: 'text-red-400',
  integration: 'text-cyan-400',
  system: 'text-gray-400',
};

export function ActivityLogGlobal() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<ActivityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    types: [],
    categories: [],
    users: [],
    dateRange: { start: null, end: null },
    status: [],
    search: '',
  });

  // Cargar eventos
  useEffect(() => {
    const loadEvents = () => {
      const stored = localStorage.getItem('litper_activity_log');
      if (stored) {
        const parsed = JSON.parse(stored);
        setEvents(parsed.map((e: any) => ({ ...e, timestamp: new Date(e.timestamp) })));
      } else {
        const mockEvents = generateMockEvents();
        setEvents(mockEvents);
        localStorage.setItem('litper_activity_log', JSON.stringify(mockEvents));
      }
      setIsLoading(false);
    };
    loadEvents();
  }, []);

  // Aplicar filtros
  useEffect(() => {
    let result = [...events];

    if (filters.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(e =>
        e.action.toLowerCase().includes(search) ||
        e.description.toLowerCase().includes(search) ||
        e.user.name.toLowerCase().includes(search)
      );
    }

    if (filters.types.length > 0) {
      result = result.filter(e => filters.types.includes(e.type));
    }

    if (filters.categories.length > 0) {
      result = result.filter(e => filters.categories.includes(e.category));
    }

    if (filters.status.length > 0) {
      result = result.filter(e => filters.status.includes(e.status));
    }

    if (filters.dateRange.start) {
      result = result.filter(e => e.timestamp >= filters.dateRange.start!);
    }

    if (filters.dateRange.end) {
      result = result.filter(e => e.timestamp <= filters.dateRange.end!);
    }

    // Ordenar por fecha más reciente
    result.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    setFilteredEvents(result);
  }, [events, filters]);

  // Simular eventos en tiempo real
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      const randomEvents: Partial<ActivityEvent>[] = [
        { type: 'view', category: 'document', action: 'Página visitada', description: 'Dashboard principal', status: 'success' },
        { type: 'system', category: 'system', action: 'Heartbeat', description: 'Sistema operando normalmente', status: 'success' },
      ];

      const newEvent: ActivityEvent = {
        id: `evt-live-${Date.now()}`,
        ...randomEvents[Math.floor(Math.random() * randomEvents.length)],
        user: { id: 'system', name: 'Sistema', email: 'system@litper.com' },
        timestamp: new Date(),
        status: 'success',
      } as ActivityEvent;

      setEvents(prev => [newEvent, ...prev.slice(0, 99)]); // Keep last 100
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [isLive]);

  const formatTimestamp = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Ahora mismo';
    if (minutes < 60) return `Hace ${minutes}m`;
    if (hours < 24) return `Hace ${hours}h`;
    if (days < 7) return `Hace ${days}d`;
    return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
  };

  const groupEventsByDate = (events: ActivityEvent[]): Map<string, ActivityEvent[]> => {
    const groups = new Map<string, ActivityEvent[]>();

    events.forEach(event => {
      const date = event.timestamp.toLocaleDateString('es-CO', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });

      if (!groups.has(date)) {
        groups.set(date, []);
      }
      groups.get(date)!.push(event);
    });

    return groups;
  };

  const exportLog = () => {
    const csv = [
      ['ID', 'Fecha', 'Tipo', 'Categoría', 'Acción', 'Descripción', 'Usuario', 'Estado', 'IP'].join(','),
      ...filteredEvents.map(e => [
        e.id,
        e.timestamp.toISOString(),
        e.type,
        e.category,
        e.action,
        `"${e.description}"`,
        e.user.name,
        e.status,
        e.ip || '',
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `activity-log-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const clearFilters = () => {
    setFilters({
      types: [],
      categories: [],
      users: [],
      dateRange: { start: null, end: null },
      status: [],
      search: '',
    });
  };

  const toggleFilter = (key: keyof FilterState, value: string) => {
    if (key === 'search' || key === 'dateRange') return;

    setFilters(prev => {
      const current = prev[key] as string[];
      if (current.includes(value)) {
        return { ...prev, [key]: current.filter(v => v !== value) };
      } else {
        return { ...prev, [key]: [...current, value] };
      }
    });
  };

  const groupedEvents = groupEventsByDate(filteredEvents);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <RefreshCw className="w-8 h-8 text-violet-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-black/20 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-500/20 rounded-lg">
              <Activity className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Activity Log</h2>
              <p className="text-xs text-gray-400">{filteredEvents.length} eventos registrados</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Live indicator */}
            <button
              onClick={() => setIsLive(!isLive)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                isLive
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-gray-500/20 text-gray-400'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'}`} />
              {isLive ? 'En vivo' : 'Pausado'}
            </button>

            <button
              onClick={exportLog}
              className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors"
              title="Exportar CSV"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg transition-colors ${
                showFilters ? 'bg-violet-500/20 text-violet-400' : 'hover:bg-white/5 text-gray-400'
              }`}
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar en actividad..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50"
          />
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 p-4 bg-white/5 rounded-lg space-y-4">
            {/* Type filters */}
            <div>
              <p className="text-xs text-gray-400 mb-2">Tipo de evento</p>
              <div className="flex flex-wrap gap-2">
                {['create', 'update', 'delete', 'view', 'login', 'export', 'import', 'payment', 'alert', 'system'].map(type => (
                  <button
                    key={type}
                    onClick={() => toggleFilter('types', type)}
                    className={`px-2 py-1 rounded text-xs transition-colors ${
                      filters.types.includes(type)
                        ? 'bg-violet-500/30 text-violet-300'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Category filters */}
            <div>
              <p className="text-xs text-gray-400 mb-2">Categoría</p>
              <div className="flex flex-wrap gap-2">
                {['user', 'finance', 'document', 'security', 'integration', 'system'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => toggleFilter('categories', cat)}
                    className={`px-2 py-1 rounded text-xs transition-colors ${
                      filters.categories.includes(cat)
                        ? 'bg-violet-500/30 text-violet-300'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Status filters */}
            <div>
              <p className="text-xs text-gray-400 mb-2">Estado</p>
              <div className="flex flex-wrap gap-2">
                {['success', 'warning', 'error', 'pending'].map(status => (
                  <button
                    key={status}
                    onClick={() => toggleFilter('status', status)}
                    className={`px-2 py-1 rounded text-xs transition-colors ${
                      filters.status.includes(status)
                        ? statusColors[status].bg + ' ' + statusColors[status].text
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Clear filters */}
            {(filters.types.length > 0 || filters.categories.length > 0 || filters.status.length > 0) && (
              <button
                onClick={clearFilters}
                className="text-xs text-violet-400 hover:text-violet-300"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto p-4">
        {Array.from(groupedEvents.entries()).map(([date, dayEvents]) => (
          <div key={date} className="mb-6">
            {/* Date header */}
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-400 capitalize">{date}</span>
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-xs text-gray-500">{dayEvents.length} eventos</span>
            </div>

            {/* Events */}
            <div className="relative ml-2">
              {/* Timeline line */}
              <div className="absolute left-3 top-0 bottom-0 w-px bg-white/10" />

              {dayEvents.map((event, index) => {
                const TypeIcon = typeIcons[event.type] || Activity;
                const CategoryIcon = categoryIcons[event.category] || Settings;
                const statusStyle = statusColors[event.status];
                const isExpanded = expandedEvent === event.id;

                return (
                  <div
                    key={event.id}
                    className={`relative pl-8 pb-4 ${index === dayEvents.length - 1 ? 'pb-0' : ''}`}
                  >
                    {/* Timeline dot */}
                    <div className={`absolute left-0 w-6 h-6 rounded-full ${statusStyle.bg} flex items-center justify-center`}>
                      <TypeIcon className={`w-3 h-3 ${statusStyle.text}`} />
                    </div>

                    {/* Event card */}
                    <div
                      className={`bg-white/5 rounded-lg border border-white/10 overflow-hidden transition-all hover:border-white/20 cursor-pointer ${
                        isExpanded ? 'border-violet-500/30' : ''
                      }`}
                      onClick={() => setExpandedEvent(isExpanded ? null : event.id)}
                    >
                      <div className="p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-white">{event.action}</span>
                              <span className={`px-1.5 py-0.5 rounded text-[10px] ${statusStyle.bg} ${statusStyle.text}`}>
                                {event.status}
                              </span>
                            </div>
                            <p className="text-xs text-gray-400">{event.description}</p>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            {formatTimestamp(event.timestamp)}
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-[10px] text-white font-medium">
                                {event.user.name.split(' ').map(n => n[0]).join('')}
                              </div>
                              <span className="text-xs text-gray-400">{event.user.name}</span>
                            </div>
                            <div className={`flex items-center gap-1 ${categoryColors[event.category]}`}>
                              <CategoryIcon className="w-3 h-3" />
                              <span className="text-xs capitalize">{event.category}</span>
                            </div>
                          </div>
                          <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </div>
                      </div>

                      {/* Expanded details */}
                      {isExpanded && (
                        <div className="p-3 border-t border-white/10 bg-white/5 space-y-2">
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-gray-500">ID:</span>
                              <span className="ml-2 text-gray-300 font-mono">{event.id}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">IP:</span>
                              <span className="ml-2 text-gray-300 font-mono">{event.ip || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Timestamp:</span>
                              <span className="ml-2 text-gray-300">{event.timestamp.toLocaleString('es-CO')}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Email:</span>
                              <span className="ml-2 text-gray-300">{event.user.email}</span>
                            </div>
                          </div>

                          {event.affectedResource && (
                            <div className="flex items-center gap-2 p-2 bg-white/5 rounded">
                              <FileText className="w-4 h-4 text-gray-400" />
                              <div>
                                <span className="text-xs text-gray-500">Recurso afectado:</span>
                                <span className="ml-2 text-xs text-white">{event.affectedResource.name}</span>
                                <span className="ml-1 text-xs text-gray-500">({event.affectedResource.type})</span>
                              </div>
                            </div>
                          )}

                          {event.metadata && (
                            <div className="p-2 bg-black/30 rounded font-mono text-xs text-gray-400 overflow-x-auto">
                              {JSON.stringify(event.metadata, null, 2)}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {filteredEvents.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Activity className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-sm">No se encontraron eventos</p>
            <p className="text-xs text-gray-500 mt-1">Ajusta los filtros o espera nueva actividad</p>
          </div>
        )}
      </div>

      {/* Footer stats */}
      <div className="p-3 border-t border-white/10 bg-black/30">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              {filteredEvents.filter(e => e.status === 'success').length} exitosos
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              {filteredEvents.filter(e => e.status === 'warning').length} advertencias
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-400" />
              {filteredEvents.filter(e => e.status === 'error').length} errores
            </span>
          </div>
          <span>Últimos 7 días</span>
        </div>
      </div>
    </div>
  );
}

export default ActivityLogGlobal;
