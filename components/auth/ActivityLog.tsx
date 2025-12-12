// components/auth/ActivityLog.tsx
// Panel de historial de actividad y sesiones
import React, { useState, useMemo } from 'react';
import {
  History,
  LogIn,
  LogOut,
  UserPlus,
  Activity,
  Clock,
  Monitor,
  Smartphone,
  Globe,
  Filter,
  Search,
  Calendar,
  ChevronDown,
  ChevronUp,
  Shield,
  Eye,
  FileText,
  Package,
  Settings,
  Download,
  RefreshCw,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { SessionLog, ActivityLog as ActivityLogType } from '../../services/authService';

interface ActivityLogPanelProps {
  compact?: boolean;
}

export const ActivityLogPanel: React.FC<ActivityLogPanelProps> = ({ compact = false }) => {
  const { user, getSessionLogs, getActivityLogs } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'sesiones' | 'actividad'>('sesiones');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  const sessionLogs = useMemo(() => getSessionLogs(), [getSessionLogs]);
  const activityLogs = useMemo(() => getActivityLogs(), [getActivityLogs]);

  // Filtrar logs
  const filteredSessionLogs = useMemo(() => {
    if (!searchQuery) return sessionLogs;
    const query = searchQuery.toLowerCase();
    return sessionLogs.filter(log =>
      log.action.toLowerCase().includes(query) ||
      log.device?.toLowerCase().includes(query)
    );
  }, [sessionLogs, searchQuery]);

  const filteredActivityLogs = useMemo(() => {
    if (!searchQuery) return activityLogs;
    const query = searchQuery.toLowerCase();
    return activityLogs.filter(log =>
      log.action.toLowerCase().includes(query) ||
      log.details.toLowerCase().includes(query) ||
      log.module.toLowerCase().includes(query)
    );
  }, [activityLogs, searchQuery]);

  // Iconos por tipo de acción
  const getSessionIcon = (action: string) => {
    switch (action) {
      case 'login': return <LogIn className="w-4 h-4 text-emerald-500" />;
      case 'logout': return <LogOut className="w-4 h-4 text-red-500" />;
      case 'register': return <UserPlus className="w-4 h-4 text-blue-500" />;
      default: return <Activity className="w-4 h-4 text-slate-500" />;
    }
  };

  const getModuleIcon = (module: string) => {
    switch (module) {
      case 'auth': return <Shield className="w-4 h-4 text-purple-500" />;
      case 'operaciones': return <Package className="w-4 h-4 text-blue-500" />;
      case 'admin': return <Settings className="w-4 h-4 text-amber-500" />;
      case 'reportes': return <FileText className="w-4 h-4 text-emerald-500" />;
      default: return <Activity className="w-4 h-4 text-slate-500" />;
    }
  };

  const getDeviceIcon = (device?: string) => {
    if (device?.toLowerCase().includes('móvil') || device?.toLowerCase().includes('mobile')) {
      return <Smartphone className="w-3.5 h-3.5" />;
    }
    return <Monitor className="w-3.5 h-3.5" />;
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `Hace ${minutes} min`;
    if (hours < 24) return `Hace ${hours}h`;
    if (days < 7) return `Hace ${days} días`;

    return date.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Modo compacto
  if (compact) {
    return (
      <div className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <History className="w-5 h-5 text-purple-500" />
            Actividad Reciente
          </h3>
          <span className="text-xs text-slate-500">{activityLogs.length} registros</span>
        </div>
        <div className="space-y-2">
          {activityLogs.slice(0, 5).map((log) => (
            <div key={log.id} className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-navy-800 rounded-lg">
              {getModuleIcon(log.module)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{log.action}</p>
                <p className="text-xs text-slate-500 truncate">{formatDate(log.timestamp)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-900 rounded-2xl border border-purple-500/30 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-2xl shadow-lg">
              <History className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Registro de Actividad</h2>
              <p className="text-purple-200">Historial de sesiones y acciones del sistema</p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4">
            <div className="text-center px-4 py-2 bg-white/10 rounded-xl">
              <p className="text-2xl font-bold text-white">{sessionLogs.length}</p>
              <p className="text-xs text-purple-200">Sesiones</p>
            </div>
            <div className="text-center px-4 py-2 bg-white/10 rounded-xl">
              <p className="text-2xl font-bold text-white">{activityLogs.length}</p>
              <p className="text-xs text-purple-200">Actividades</p>
            </div>
          </div>
        </div>
      </div>

      {/* Panel principal */}
      <div className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-700 overflow-hidden">
        {/* Tabs y búsqueda */}
        <div className="p-4 border-b border-slate-200 dark:border-navy-700 space-y-4">
          <div className="flex items-center gap-4">
            {/* Tabs */}
            <div className="flex bg-slate-100 dark:bg-navy-800 rounded-xl p-1">
              <button
                onClick={() => setActiveTab('sesiones')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  activeTab === 'sesiones'
                    ? 'bg-white dark:bg-navy-700 text-purple-600 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                <span className="flex items-center gap-2">
                  <LogIn className="w-4 h-4" />
                  Sesiones ({sessionLogs.length})
                </span>
              </button>
              <button
                onClick={() => setActiveTab('actividad')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  activeTab === 'actividad'
                    ? 'bg-white dark:bg-navy-700 text-purple-600 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Actividad ({activityLogs.length})
                </span>
              </button>
            </div>

            {/* Búsqueda */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar en el historial..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-600 rounded-xl
                  text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="max-h-[600px] overflow-y-auto">
          {activeTab === 'sesiones' ? (
            /* Lista de sesiones */
            filteredSessionLogs.length === 0 ? (
              <div className="p-12 text-center">
                <History className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500">No hay sesiones registradas</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-navy-800">
                {filteredSessionLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-4 hover:bg-slate-50 dark:hover:bg-navy-800/50 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-2.5 rounded-xl ${
                        log.action === 'login' ? 'bg-emerald-100 dark:bg-emerald-900/30' :
                        log.action === 'logout' ? 'bg-red-100 dark:bg-red-900/30' :
                        'bg-blue-100 dark:bg-blue-900/30'
                      }`}>
                        {getSessionIcon(log.action)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-slate-800 dark:text-white capitalize">
                            {log.action === 'login' ? 'Inicio de sesión' :
                             log.action === 'logout' ? 'Cierre de sesión' :
                             log.action === 'register' ? 'Registro' : log.action}
                          </p>
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(log.timestamp)}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                          {log.device && (
                            <span className="flex items-center gap-1">
                              {getDeviceIcon(log.device)}
                              {log.device}
                            </span>
                          )}
                          {log.userAgent && (
                            <span className="flex items-center gap-1">
                              <Globe className="w-3.5 h-3.5" />
                              {log.userAgent.split(' ').slice(0, 2).join(' ')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            /* Lista de actividad */
            filteredActivityLogs.length === 0 ? (
              <div className="p-12 text-center">
                <Activity className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500">No hay actividad registrada</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-navy-800">
                {filteredActivityLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-4 hover:bg-slate-50 dark:hover:bg-navy-800/50 transition-colors cursor-pointer"
                    onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-2.5 bg-slate-100 dark:bg-navy-800 rounded-xl">
                        {getModuleIcon(log.module)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-slate-800 dark:text-white">{log.action}</p>
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(log.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{log.details}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs rounded-full capitalize">
                            {log.module}
                          </span>
                          <span className="text-xs text-slate-500">{log.userEmail}</span>
                        </div>

                        {/* Detalles expandidos */}
                        {expandedLog === log.id && log.metadata && (
                          <div className="mt-4 p-3 bg-slate-50 dark:bg-navy-800 rounded-lg">
                            <p className="text-xs font-medium text-slate-500 mb-2">Metadata:</p>
                            <pre className="text-xs text-slate-600 dark:text-slate-400 overflow-x-auto">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                      <button className="text-slate-400 hover:text-slate-600">
                        {expandedLog === log.id ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityLogPanel;
