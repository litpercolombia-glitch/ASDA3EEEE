// components/Admin/NotificationsCenter/NotificationsDashboard.tsx
import React, { useState } from 'react';
import { Bell, BellRing, Settings, Check, X, Trash2, Eye, Plus, Zap, Clock, AlertTriangle, ShoppingCart, Package, TrendingUp } from 'lucide-react';
import { useNotifications, type Notification, type AlertRule, type NotificationType } from '../../../services/notificationsService';

export function NotificationsDashboard() {
  const { notifications, alertRules, preferences, markAsRead, markAllAsRead, dismiss, toggleAlertRule, updatePreferences, unread, unreadCount, activeRules } = useNotifications();
  const [activeTab, setActiveTab] = useState<'notificaciones' | 'reglas' | 'config'>('notificaciones');

  const getTypeIcon = (type: NotificationType) => {
    const icons: Record<NotificationType, React.ReactNode> = {
      venta: <ShoppingCart className="w-4 h-4" />,
      pedido: <Package className="w-4 h-4" />,
      alerta: <AlertTriangle className="w-4 h-4" />,
      sistema: <Settings className="w-4 h-4" />,
      marketing: <TrendingUp className="w-4 h-4" />,
      soporte: <Bell className="w-4 h-4" />,
    };
    return icons[type];
  };

  const tabs = [
    { id: 'notificaciones', label: 'Notificaciones', icon: Bell, count: unreadCount },
    { id: 'reglas', label: 'Reglas de Alerta', icon: Zap, count: activeRules.length },
    { id: 'config', label: 'Configuración', icon: Settings },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/20 rounded-xl">
            <BellRing className="w-8 h-8 text-amber-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Centro de Notificaciones</h2>
            <p className="text-gray-400">Alertas y notificaciones del sistema</p>
          </div>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllAsRead} className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700">
            <Check className="w-4 h-4" />Marcar todas como leídas
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700">
          <div className="flex items-center justify-between">
            <div><p className="text-2xl font-bold text-white">{unreadCount}</p><p className="text-xs text-gray-400">Sin Leer</p></div>
            <div className="p-2 bg-amber-500/20 rounded-lg"><Bell className="w-5 h-5 text-amber-400" /></div>
          </div>
        </div>
        <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700">
          <div className="flex items-center justify-between">
            <div><p className="text-2xl font-bold text-white">{activeRules.length}</p><p className="text-xs text-gray-400">Reglas Activas</p></div>
            <div className="p-2 bg-green-500/20 rounded-lg"><Zap className="w-5 h-5 text-green-400" /></div>
          </div>
        </div>
        <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700">
          <div className="flex items-center justify-between">
            <div><p className="text-2xl font-bold text-white">{notifications.length}</p><p className="text-xs text-gray-400">Total</p></div>
            <div className="p-2 bg-blue-500/20 rounded-lg"><Clock className="w-5 h-5 text-blue-400" /></div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-700 pb-2">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${activeTab === tab.id ? 'bg-amber-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}>
            <tab.icon className="w-4 h-4" />{tab.label}
            {tab.count !== undefined && <span className={`px-2 py-0.5 text-xs rounded-full ${activeTab === tab.id ? 'bg-amber-500' : 'bg-gray-600'}`}>{tab.count}</span>}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {activeTab === 'notificaciones' && (
          <div className="space-y-3">
            {notifications.filter(n => !n.isDismissed).map((notif) => (
              <div key={notif.id} className={`p-4 rounded-xl border transition-all ${!notif.isRead ? 'border-amber-500/50 bg-amber-500/5' : 'border-gray-700 bg-gray-800/50'}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: `${notif.color}20` }}>
                      <span style={{ color: notif.color }}>{getTypeIcon(notif.tipo)}</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-white">{notif.titulo}</h4>
                      <p className="text-sm text-gray-400">{notif.mensaje}</p>
                      <p className="text-xs text-gray-500 mt-1">{new Date(notif.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!notif.isRead && (
                      <button onClick={() => markAsRead(notif.id)} className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded">
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => dismiss(notif.id)} className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/20 rounded">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {notifications.filter(n => !n.isDismissed).length === 0 && (
              <div className="text-center py-12">
                <Bell className="w-12 h-12 mx-auto text-gray-600 mb-4" />
                <p className="text-gray-400">No hay notificaciones</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'reglas' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                <Plus className="w-4 h-4" />Nueva Regla
              </button>
            </div>
            {alertRules.map((rule) => (
              <div key={rule.id} className={`p-4 rounded-xl border ${rule.isActive ? 'border-green-500/50 bg-green-500/5' : 'border-gray-700 bg-gray-800/50'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Zap className={`w-5 h-5 ${rule.isActive ? 'text-green-400' : 'text-gray-400'}`} />
                    <div>
                      <h4 className="font-medium text-white">{rule.nombre}</h4>
                      <p className="text-sm text-gray-400">{rule.descripcion}</p>
                    </div>
                  </div>
                  <button onClick={() => toggleAlertRule(rule.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm ${rule.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                    {rule.isActive ? 'Activa' : 'Inactiva'}
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="p-2 bg-gray-700/50 rounded">
                    <p className="text-gray-500 text-xs mb-1">Condiciones</p>
                    {rule.condiciones.map((c, i) => (
                      <p key={i} className="text-gray-300"><code className="text-amber-400">{c.metrica}</code> {c.operador} {c.valor}</p>
                    ))}
                  </div>
                  <div className="p-2 bg-gray-700/50 rounded">
                    <p className="text-gray-500 text-xs mb-1">Canales</p>
                    <div className="flex gap-1">{rule.canales.map((c, i) => <span key={i} className="px-1.5 py-0.5 bg-gray-600 rounded text-xs text-gray-300">{c}</span>)}</div>
                  </div>
                  <div className="p-2 bg-gray-700/50 rounded">
                    <p className="text-gray-500 text-xs mb-1">Activaciones</p>
                    <p className="text-white font-medium">{rule.vecesActivada}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'config' && (
          <div className="space-y-6">
            <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700">
              <h3 className="font-medium text-white mb-4">Canales de Notificación</h3>
              <div className="space-y-3">
                {Object.entries(preferences.canales).map(([canal, activo]) => (
                  <label key={canal} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg cursor-pointer">
                    <span className="text-gray-300 capitalize">{canal}</span>
                    <input type="checkbox" checked={activo} onChange={(e) => updatePreferences({ canales: { ...preferences.canales, [canal]: e.target.checked } })}
                      className="w-5 h-5 rounded border-gray-600 text-amber-600 focus:ring-amber-500" />
                  </label>
                ))}
              </div>
            </div>
            <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700">
              <h3 className="font-medium text-white mb-4">Horario de Silencio</h3>
              <label className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg cursor-pointer mb-3">
                <span className="text-gray-300">Activar modo silencio nocturno</span>
                <input type="checkbox" checked={preferences.horarioSilencio.activo}
                  onChange={(e) => updatePreferences({ horarioSilencio: { ...preferences.horarioSilencio, activo: e.target.checked } })}
                  className="w-5 h-5 rounded border-gray-600 text-amber-600 focus:ring-amber-500" />
              </label>
              <p className="text-sm text-gray-400">No molestar de {preferences.horarioSilencio.inicio} a {preferences.horarioSilencio.fin}</p>
            </div>
            <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <h3 className="font-medium text-white">Resumen Diario</h3>
                  <p className="text-sm text-gray-400">Recibe un resumen de actividad cada mañana</p>
                </div>
                <input type="checkbox" checked={preferences.resumenDiario}
                  onChange={(e) => updatePreferences({ resumenDiario: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-600 text-amber-600 focus:ring-amber-500" />
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default NotificationsDashboard;
