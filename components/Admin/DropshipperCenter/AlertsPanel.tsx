// ============================================
// ALERTS PANEL
// Panel de alertas inteligentes para dropshippers
// ============================================

import React, { useEffect, useState, useMemo } from 'react';
import {
  Bell,
  AlertTriangle,
  XCircle,
  CheckCircle,
  Info,
  MessageCircle,
  Eye,
  Trash2,
  RefreshCw,
  Send,
} from 'lucide-react';
import {
  evaluateAlerts,
  getAlerts,
  getUnreadAlerts,
  markAlertRead,
  markAllRead,
  clearAlerts,
  sendAlertViaWhatsApp,
  getAlertWhatsAppMessage,
  type DropshipperAlert,
  type AlertSeverity,
} from '../../../services/dropshipperAlertsService';
import { useDropshippingStore } from '../../../services/dropshippingService';

export const AlertsPanel: React.FC = () => {
  const [alerts, setAlerts] = useState<DropshipperAlert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<DropshipperAlert | null>(null);
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [showWhatsappModal, setShowWhatsappModal] = useState(false);
  const { selectedMonth, setSelectedView } = useDropshippingStore();

  // Load and evaluate alerts
  useEffect(() => {
    const existing = getAlerts();
    const newAlerts = evaluateAlerts();
    setAlerts([...existing].reverse()); // Most recent first
  }, [selectedMonth]);

  const unreadCount = useMemo(() => alerts.filter((a) => !a.read).length, [alerts]);

  const handleRefresh = () => {
    const newAlerts = evaluateAlerts();
    setAlerts([...getAlerts()].reverse());
  };

  const handleMarkRead = (id: string) => {
    markAlertRead(id);
    setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, read: true } : a));
  };

  const handleMarkAllRead = () => {
    markAllRead();
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
  };

  const handleClear = () => {
    if (confirm('Borrar todas las alertas?')) {
      clearAlerts();
      setAlerts([]);
    }
  };

  const handleSendWhatsApp = async (alert: DropshipperAlert) => {
    setSelectedAlert(alert);
    setShowWhatsappModal(true);
  };

  const confirmSendWhatsApp = async () => {
    if (!selectedAlert || !whatsappPhone) return;
    const success = await sendAlertViaWhatsApp(selectedAlert.id, whatsappPhone);
    if (success) {
      setAlerts((prev) => prev.map((a) => a.id === selectedAlert.id ? { ...a, sentViaWhatsApp: true } : a));
    }
    setShowWhatsappModal(false);
    setWhatsappPhone('');
    setSelectedAlert(null);
  };

  const handleNavigate = (view: string) => {
    setSelectedView(view as any);
  };

  const severityConfig: Record<AlertSeverity, { icon: React.ElementType; color: string; bgColor: string }> = {
    critical: { icon: XCircle, color: 'text-red-500', bgColor: 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800' },
    warning: { icon: AlertTriangle, color: 'text-amber-500', bgColor: 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800' },
    info: { icon: Info, color: 'text-blue-500', bgColor: 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800' },
    success: { icon: CheckCircle, color: 'text-emerald-500', bgColor: 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800' },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="w-5 h-5 text-slate-400" />
          <h3 className="font-bold text-slate-800 dark:text-white">Alertas Inteligentes</h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="p-2 bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 rounded-lg transition-colors"
            title="Re-evaluar alertas"
          >
            <RefreshCw className="w-4 h-4 text-slate-500" />
          </button>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="p-2 bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 rounded-lg transition-colors"
              title="Marcar todas como leidas"
            >
              <Eye className="w-4 h-4 text-slate-500" />
            </button>
          )}
          {alerts.length > 0 && (
            <button
              onClick={handleClear}
              className="p-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
              title="Limpiar alertas"
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </button>
          )}
        </div>
      </div>

      {/* Alert list */}
      {alerts.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-navy-800 rounded-2xl border border-slate-200 dark:border-navy-700">
          <CheckCircle className="w-12 h-12 text-emerald-300 mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400 mb-2">Sin alertas activas</p>
          <p className="text-xs text-slate-400">Las alertas se generan automaticamente al importar pedidos</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => {
            const config = severityConfig[alert.severity];
            const Icon = config.icon;

            return (
              <div
                key={alert.id}
                className={`p-4 rounded-xl border transition-all ${config.bgColor} ${!alert.read ? 'ring-2 ring-offset-1 ring-blue-300 dark:ring-blue-700' : 'opacity-80'}`}
              >
                <div className="flex items-start gap-3">
                  <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${config.color}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-slate-800 dark:text-white text-sm">{alert.title}</h4>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {new Date(alert.createdAt).toLocaleDateString('es-CO', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{alert.message}</p>
                    {alert.detail && (
                      <p className="text-xs text-slate-400 mt-1">{alert.detail}</p>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-3">
                      {alert.actionLabel && alert.actionView && (
                        <button
                          onClick={() => handleNavigate(alert.actionView!)}
                          className="text-xs px-3 py-1 bg-white dark:bg-navy-700 border border-slate-200 dark:border-navy-600 rounded-lg font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-navy-600 transition-colors"
                        >
                          {alert.actionLabel}
                        </button>
                      )}
                      <button
                        onClick={() => handleSendWhatsApp(alert)}
                        className={`text-xs px-3 py-1 rounded-lg font-medium transition-colors flex items-center gap-1 ${
                          alert.sentViaWhatsApp
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'bg-green-500 hover:bg-green-600 text-white'
                        }`}
                      >
                        <Send className="w-3 h-3" />
                        {alert.sentViaWhatsApp ? 'Enviado' : 'WhatsApp'}
                      </button>
                      {!alert.read && (
                        <button
                          onClick={() => handleMarkRead(alert.id)}
                          className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          Marcar leida
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* WhatsApp Modal */}
      {showWhatsappModal && selectedAlert && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowWhatsappModal(false)}>
          <div className="bg-white dark:bg-navy-800 rounded-2xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-green-500" />
              Enviar por WhatsApp
            </h3>
            <div className="bg-slate-50 dark:bg-navy-900 rounded-xl p-3 mb-4 text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap max-h-40 overflow-y-auto">
              {getAlertWhatsAppMessage(selectedAlert.id) || selectedAlert.message}
            </div>
            <input
              type="tel"
              placeholder="Numero WhatsApp (ej: 573001234567)"
              value={whatsappPhone}
              onChange={(e) => setWhatsappPhone(e.target.value)}
              className="w-full bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-xl px-4 py-3 text-sm mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowWhatsappModal(false)}
                className="flex-1 py-2 bg-slate-100 dark:bg-navy-700 text-slate-700 dark:text-slate-300 rounded-xl font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={confirmSendWhatsApp}
                disabled={!whatsappPhone}
                className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium disabled:opacity-50"
              >
                Enviar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertsPanel;
