/**
 * NotificationSettings
 *
 * Componente para configurar las notificaciones automáticas de tracking.
 */

import React, { useState, useEffect } from 'react';
import {
  Bell,
  Mail,
  MessageSquare,
  Smartphone,
  Send,
  Settings,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  Edit2,
  Save,
  RotateCcw,
  TestTube,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  BarChart3,
} from 'lucide-react';
import {
  trackingNotificationService,
  type NotificationTemplate,
  type NotificationChannel,
  type NotificationEvent,
  type NotificationConfig,
  type NotificationLog,
} from '@/services/trackingNotificationService';

type Tab = 'channels' | 'templates' | 'logs' | 'stats';

const CHANNEL_CONFIG: Record<NotificationChannel, {
  label: string;
  icon: React.FC<{ className?: string }>;
  color: string;
  description: string;
}> = {
  email: {
    label: 'Email',
    icon: Mail,
    color: 'blue',
    description: 'Notificaciones por correo electrónico',
  },
  sms: {
    label: 'SMS',
    icon: Smartphone,
    color: 'green',
    description: 'Mensajes de texto cortos',
  },
  whatsapp: {
    label: 'WhatsApp',
    icon: MessageSquare,
    color: 'emerald',
    description: 'Mensajes vía WhatsApp Business',
  },
  push: {
    label: 'Push',
    icon: Bell,
    color: 'purple',
    description: 'Notificaciones push en el navegador',
  },
};

const EVENT_LABELS: Record<NotificationEvent, string> = {
  guide_created: 'Guía creada',
  pickup_scheduled: 'Recolección programada',
  picked_up: 'Paquete recogido',
  in_transit: 'En tránsito',
  out_for_delivery: 'En reparto',
  delivered: 'Entregado',
  delivery_attempt: 'Intento de entrega',
  delivery_exception: 'Excepción de entrega',
  returned: 'Devuelto',
  customs_hold: 'Retención en aduana',
};

export const NotificationSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('channels');
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [editedBody, setEditedBody] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Cargar datos
  useEffect(() => {
    setTemplates(trackingNotificationService.getTemplates());
    setLogs(trackingNotificationService.getLogs(50));
  }, []);

  // Guardar template editado
  const handleSaveTemplate = (templateId: string) => {
    trackingNotificationService.updateTemplate(templateId, { body: editedBody });
    setTemplates(trackingNotificationService.getTemplates());
    setEditingTemplate(null);
    setEditedBody('');
  };

  // Toggle estado de template
  const handleToggleTemplate = (templateId: string, isActive: boolean) => {
    trackingNotificationService.updateTemplate(templateId, { isActive });
    setTemplates(trackingNotificationService.getTemplates());
  };

  // Probar notificación
  const handleTestNotification = async (template: NotificationTemplate) => {
    setIsTesting(true);
    setTestResult(null);

    try {
      // Simular envío con datos de prueba
      const mockGuide = {
        id: 'test-001',
        numeroGuia: 'TEST-123456',
        trackingNumber: 'TEST-123456',
        nombreDestinatario: 'Usuario de Prueba',
        correoDestinatario: 'test@example.com',
        telefonoDestinatario: '+57 300 123 4567',
        transportadora: 'Transportadora Demo',
        direccionDestinatario: 'Calle 123 #45-67',
        ciudadDestinatario: 'Bogotá',
        ciudadOrigen: 'Medellín',
        correoRemitente: 'sender@example.com',
      };

      await trackingNotificationService.sendNotification(
        mockGuide as any,
        template.event,
        { test: 'true' }
      );

      setTestResult({
        success: true,
        message: 'Notificación de prueba enviada correctamente',
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Error al enviar',
      });
    } finally {
      setIsTesting(false);
      setLogs(trackingNotificationService.getLogs(50));
    }
  };

  // Estadísticas
  const stats = trackingNotificationService.getStats();

  // Formatear fecha
  const formatDate = (date: Date | string | null): string => {
    if (!date) return '-';
    return new Date(date).toLocaleString('es-CO', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
            <Bell className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Notificaciones de Tracking
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Configura las notificaciones automáticas para tus clientes
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700">
        {[
          { id: 'channels', label: 'Canales', icon: Settings },
          { id: 'templates', label: 'Plantillas', icon: Mail },
          { id: 'logs', label: 'Historial', icon: Clock },
          { id: 'stats', label: 'Estadísticas', icon: BarChart3 },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-purple-600 border-b-2 border-purple-500 bg-purple-50/50 dark:bg-purple-900/10'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'channels' && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Habilita los canales por los cuales deseas enviar notificaciones a tus clientes.
            </p>

            {(Object.entries(CHANNEL_CONFIG) as [NotificationChannel, typeof CHANNEL_CONFIG.email][]).map(
              ([channel, config]) => {
                const isEnabled = trackingNotificationService.isChannelEnabled(channel);
                const Icon = config.icon;

                return (
                  <div
                    key={channel}
                    className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl bg-${config.color}-100 dark:bg-${config.color}-900/30`}>
                        <Icon className={`w-5 h-5 text-${config.color}-600`} />
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-900 dark:text-white">
                          {config.label}
                        </h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {config.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        isEnabled
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                      }`}>
                        {isEnabled ? 'Activo' : 'Inactivo'}
                      </span>
                      <button
                        onClick={() => {
                          trackingNotificationService.setConfig({
                            id: channel,
                            channel,
                            isEnabled: !isEnabled,
                            settings: {},
                          });
                          // Forzar re-render
                          setTemplates([...templates]);
                        }}
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          isEnabled ? 'bg-purple-600' : 'bg-slate-300 dark:bg-slate-600'
                        }`}
                      >
                        <span
                          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            isEnabled ? 'left-7' : 'left-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                );
              }
            )}

            <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-900 dark:text-amber-100">
                    Configuración avanzada
                  </h4>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                    Para configurar las credenciales de cada canal (API keys, SMTP, etc.),
                    contacta al administrador del sistema.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="space-y-4">
            {/* Agrupar por evento */}
            {(Object.entries(EVENT_LABELS) as [NotificationEvent, string][]).map(([event, label]) => {
              const eventTemplates = templates.filter(t => t.event === event);
              if (eventTemplates.length === 0) return null;

              return (
                <div key={event} className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedTemplate(expandedTemplate === event ? null : event)}
                    className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {expandedTemplate === event ? (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-slate-400" />
                      )}
                      <span className="font-medium text-slate-900 dark:text-white">{label}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {eventTemplates.filter(t => t.isActive).length}/{eventTemplates.length} activos
                      </span>
                    </div>
                  </button>

                  {expandedTemplate === event && (
                    <div className="p-4 space-y-3">
                      {eventTemplates.map(template => {
                        const channelConfig = CHANNEL_CONFIG[template.channel];
                        const Icon = channelConfig.icon;
                        const isEditing = editingTemplate === template.id;

                        return (
                          <div
                            key={template.id}
                            className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <Icon className={`w-4 h-4 text-${channelConfig.color}-600`} />
                                <span className="font-medium text-slate-900 dark:text-white">
                                  {channelConfig.label}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleTestNotification(template)}
                                  disabled={isTesting}
                                  className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                                >
                                  {isTesting ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <TestTube className="w-3 h-3" />
                                  )}
                                  Probar
                                </button>
                                <button
                                  onClick={() => handleToggleTemplate(template.id, !template.isActive)}
                                  className={`px-2 py-1 text-xs rounded transition-colors ${
                                    template.isActive
                                      ? 'text-green-600 bg-green-50 dark:bg-green-900/20'
                                      : 'text-slate-500 bg-slate-100 dark:bg-slate-700'
                                  }`}
                                >
                                  {template.isActive ? 'Activo' : 'Inactivo'}
                                </button>
                              </div>
                            </div>

                            {template.subject && (
                              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Asunto: {template.subject}
                              </p>
                            )}

                            {isEditing ? (
                              <div className="space-y-3">
                                <textarea
                                  value={editedBody}
                                  onChange={(e) => setEditedBody(e.target.value)}
                                  rows={8}
                                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                                <div className="flex items-center justify-between">
                                  <div className="flex flex-wrap gap-1">
                                    {template.variables.map(v => (
                                      <code
                                        key={v}
                                        className="text-xs px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-purple-600 dark:text-purple-400 rounded"
                                      >
                                        {`{${v}}`}
                                      </code>
                                    ))}
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => {
                                        setEditingTemplate(null);
                                        setEditedBody('');
                                      }}
                                      className="flex items-center gap-1 px-3 py-1.5 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                                    >
                                      <X className="w-4 h-4" />
                                      Cancelar
                                    </button>
                                    <button
                                      onClick={() => handleSaveTemplate(template.id)}
                                      className="flex items-center gap-1 px-3 py-1.5 text-sm text-white bg-purple-600 hover:bg-purple-700 rounded-lg"
                                    >
                                      <Save className="w-4 h-4" />
                                      Guardar
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <pre className="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-wrap font-mono bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg max-h-32 overflow-y-auto">
                                  {template.body}
                                </pre>
                                <button
                                  onClick={() => {
                                    setEditingTemplate(template.id);
                                    setEditedBody(template.body);
                                  }}
                                  className="mt-2 flex items-center gap-1 px-2 py-1 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                                >
                                  <Edit2 className="w-3 h-3" />
                                  Editar
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {testResult && (
              <div className={`p-4 rounded-xl ${
                testResult.success
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
              }`}>
                <div className="flex items-center gap-2">
                  {testResult.success ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  )}
                  <span className={testResult.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}>
                    {testResult.message}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-4">
            {logs.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-slate-500 dark:text-slate-400">
                  No hay notificaciones enviadas aún
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {logs.map(log => {
                  const channelConfig = CHANNEL_CONFIG[log.channel];
                  const Icon = channelConfig.icon;

                  return (
                    <div
                      key={log.id}
                      className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl"
                    >
                      <div className={`p-2 rounded-lg bg-${channelConfig.color}-100 dark:bg-${channelConfig.color}-900/30`}>
                        <Icon className={`w-4 h-4 text-${channelConfig.color}-600`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900 dark:text-white text-sm">
                            {EVENT_LABELS[log.event]}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            log.status === 'sent' || log.status === 'delivered'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : log.status === 'failed'
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          }`}>
                            {log.status === 'sent' ? 'Enviado' :
                             log.status === 'delivered' ? 'Entregado' :
                             log.status === 'failed' ? 'Fallido' : 'Pendiente'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {log.recipient}
                        </p>
                      </div>

                      <div className="text-right text-xs text-slate-500 dark:text-slate-400">
                        {formatDate(log.sentAt)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-6">
            {/* Resumen */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-center">
                <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Total</p>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl text-center">
                <p className="text-3xl font-bold text-green-600">{stats.sent}</p>
                <p className="text-sm text-green-600 dark:text-green-400">Enviados</p>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-center">
                <p className="text-3xl font-bold text-blue-600">{stats.delivered}</p>
                <p className="text-sm text-blue-600 dark:text-blue-400">Entregados</p>
              </div>
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl text-center">
                <p className="text-3xl font-bold text-red-600">{stats.failed}</p>
                <p className="text-sm text-red-600 dark:text-red-400">Fallidos</p>
              </div>
            </div>

            {/* Por canal */}
            <div>
              <h4 className="font-medium text-slate-900 dark:text-white mb-3">Por Canal</h4>
              <div className="space-y-2">
                {(Object.entries(CHANNEL_CONFIG) as [NotificationChannel, typeof CHANNEL_CONFIG.email][]).map(
                  ([channel, config]) => {
                    const count = stats.byChannel[channel];
                    const Icon = config.icon;
                    const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;

                    return (
                      <div key={channel} className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 text-${config.color}-600`} />
                        <span className="text-sm text-slate-600 dark:text-slate-400 w-24">
                          {config.label}
                        </span>
                        <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full bg-${config.color}-500 transition-all`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-slate-900 dark:text-white w-12 text-right">
                          {count}
                        </span>
                      </div>
                    );
                  }
                )}
              </div>
            </div>

            {/* Por evento */}
            <div>
              <h4 className="font-medium text-slate-900 dark:text-white mb-3">Por Evento</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {(Object.entries(EVENT_LABELS) as [NotificationEvent, string][]).map(([event, label]) => {
                  const count = stats.byEvent[event];

                  return (
                    <div
                      key={event}
                      className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg"
                    >
                      <span className="text-sm text-slate-600 dark:text-slate-400 truncate">
                        {label}
                      </span>
                      <span className="text-sm font-bold text-slate-900 dark:text-white ml-2">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationSettings;
