import React, { useState, useCallback, useEffect } from 'react';
import {
  Plug,
  Wifi,
  WifiOff,
  Play,
  Copy,
  Check,
  AlertCircle,
  RefreshCw,
  Terminal,
  Link,
  Zap,
  MessageSquare,
  ShoppingCart,
  Clock,
  Trash2,
  CheckCircle,
  PauseCircle,
  Settings,
  MessageCircle,
  Package,
  FileText,
  Phone,
  AlertTriangle,
  Activity,
} from 'lucide-react';

// ============================================
// TIPOS E INTERFACES
// ============================================
interface ConnectionConfig {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  fields: ConnectionField[];
}

interface ConnectionField {
  key: string;
  label: string;
  type: 'text' | 'password' | 'url';
  placeholder: string;
  required?: boolean;
}

interface ConnectionState {
  values: Record<string, string>;
  status: 'idle' | 'testing' | 'connected' | 'error';
  lastTested?: string;
  errorMessage?: string;
}

interface LogEntry {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'error';
  source: 'n8n' | 'chatea' | 'dropi' | 'sistema';
  message: string;
}

interface Webhook {
  id: string;
  name: string;
  url: string;
  description: string;
}

interface ProcessStatus {
  id: string;
  name: string;
  icon: React.ReactNode;
  status: 'active' | 'paused' | 'error';
  description: string;
}

// ============================================
// CONSTANTES
// ============================================
const STORAGE_KEY = 'litper_conexiones_config';
const LOGS_STORAGE_KEY = 'litper_conexiones_logs';

const CONNECTIONS: ConnectionConfig[] = [
  {
    id: 'n8n',
    name: 'N8N',
    icon: <Zap className="w-6 h-6" />,
    description: 'Automatización de flujos de trabajo',
    fields: [
      {
        key: 'webhookUrl',
        label: 'URL Webhook',
        type: 'url',
        placeholder: 'https://n8n.ejemplo.com/webhook/...',
        required: true,
      },
    ],
  },
  {
    id: 'chatea-pro',
    name: 'Chatea Pro',
    icon: <MessageSquare className="w-6 h-6" />,
    description: 'Integración con WhatsApp Business',
    fields: [
      {
        key: 'apiKey',
        label: 'API Key',
        type: 'password',
        placeholder: '••••••••••••••••',
        required: true,
      },
      {
        key: 'webhookUrl',
        label: 'Webhook URL',
        type: 'url',
        placeholder: 'https://api.chateapro.com/webhook/...',
        required: true,
      },
    ],
  },
  {
    id: 'dropi',
    name: 'Dropi',
    icon: <ShoppingCart className="w-6 h-6" />,
    description: 'Plataforma de dropshipping',
    fields: [
      {
        key: 'apiKey',
        label: 'API Key',
        type: 'password',
        placeholder: '••••••••••••••••',
        required: true,
      },
      {
        key: 'storeId',
        label: 'Store ID',
        type: 'text',
        placeholder: 'Tu ID de tienda',
        required: true,
      },
    ],
  },
];

const APP_WEBHOOKS: Webhook[] = [
  {
    id: 'orden-nueva',
    name: 'Orden Nueva',
    url: '/api/webhook/orden-nueva',
    description: 'Se dispara cuando se crea un nuevo pedido',
  },
  {
    id: 'estado-guia',
    name: 'Estado Guía',
    url: '/api/webhook/estado-guia',
    description: 'Se dispara cuando cambia el estado de una guía',
  },
  {
    id: 'novedad',
    name: 'Novedad',
    url: '/api/webhook/novedad',
    description: 'Se dispara cuando hay una novedad en un envío',
  },
  {
    id: 'chat-entrante',
    name: 'Chat Entrante',
    url: '/api/webhook/chat-entrante',
    description: 'Se dispara cuando llega un mensaje de chat',
  },
];

const INITIAL_PROCESSES: ProcessStatus[] = [
  {
    id: 'chat-vivo',
    name: 'Chat en Vivo',
    icon: <MessageCircle className="w-5 h-5" />,
    status: 'active',
    description: 'Atención al cliente en tiempo real',
  },
  {
    id: 'generacion-pedidos',
    name: 'Generación Pedidos',
    icon: <Package className="w-5 h-5" />,
    status: 'active',
    description: 'Creación automática de pedidos',
  },
  {
    id: 'seguimiento-guias',
    name: 'Seguimiento Guías',
    icon: <FileText className="w-5 h-5" />,
    status: 'active',
    description: 'Tracking de envíos automático',
  },
  {
    id: 'novedades',
    name: 'Novedades',
    icon: <AlertTriangle className="w-5 h-5" />,
    status: 'active',
    description: 'Gestión de incidencias',
  },
  {
    id: 'reclamo-oficina',
    name: 'Reclamo Oficina',
    icon: <Phone className="w-5 h-5" />,
    status: 'active',
    description: 'Escalamiento de reclamos',
  },
  {
    id: 'llamadas-ia',
    name: 'Llamadas IA',
    icon: <Activity className="w-5 h-5" />,
    status: 'paused',
    description: 'Llamadas automatizadas con IA',
  },
];

// ============================================
// COLORES LITPER
// ============================================
const COLORS = {
  primary: '#F97316',
  background: '#0F172A',
  cards: '#1E293B',
  connected: '#10B981',
  disconnected: '#EF4444',
  info: '#3B82F6',
  warning: '#F59E0B',
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export const ConexionesTab: React.FC = () => {
  // Estado de conexiones
  const [connections, setConnections] = useState<Record<string, ConnectionState>>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return initializeConnections();
      }
    }
    return initializeConnections();
  });

  // Estado de logs
  const [logs, setLogs] = useState<LogEntry[]>(() => {
    const saved = localStorage.getItem(LOGS_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  // Estado de procesos
  const [processes, setProcesses] = useState<ProcessStatus[]>(INITIAL_PROCESSES);

  // Estado de UI
  const [copiedWebhook, setCopiedWebhook] = useState<string | null>(null);

  // Inicializar conexiones con valores por defecto
  function initializeConnections(): Record<string, ConnectionState> {
    const initial: Record<string, ConnectionState> = {};
    CONNECTIONS.forEach((conn) => {
      const values: Record<string, string> = {};
      conn.fields.forEach((field) => {
        values[field.key] = '';
      });
      // URL de N8N por defecto
      if (conn.id === 'n8n') {
        values.webhookUrl =
          'https://n8n.srv1103164.hstgr.cloud/prueba-de-webhook/240bf3b5-7689-4997-8001-0f1183eb79e9';
      }
      initial[conn.id] = { values, status: 'idle' };
    });
    return initial;
  }

  // Guardar en localStorage cuando cambian las conexiones
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(connections));
  }, [connections]);

  // Guardar logs en localStorage
  useEffect(() => {
    localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(logs.slice(0, 100)));
  }, [logs]);

  // Log inicial
  useEffect(() => {
    if (logs.length === 0) {
      addLog('info', 'sistema', 'Sistema de conexiones iniciado');
    }
  }, []);

  // Agregar log
  const addLog = useCallback(
    (type: LogEntry['type'], source: LogEntry['source'], message: string) => {
      const newLog: LogEntry = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        type,
        source,
        message,
      };
      setLogs((prev) => [newLog, ...prev].slice(0, 100));
    },
    []
  );

  // Probar conexión
  const testConnection = async (connectionId: string) => {
    const connection = connections[connectionId];
    const connectionInfo = CONNECTIONS.find((c) => c.id === connectionId);

    if (!connectionInfo) return;

    // Validar campos requeridos
    const missingFields = connectionInfo.fields
      .filter((f) => f.required && !connection.values[f.key])
      .map((f) => f.label);

    if (missingFields.length > 0) {
      addLog(
        'error',
        connectionId as LogEntry['source'],
        `Campos requeridos: ${missingFields.join(', ')}`
      );
      setConnections((prev) => ({
        ...prev,
        [connectionId]: {
          ...prev[connectionId],
          status: 'error',
          errorMessage: `Faltan campos: ${missingFields.join(', ')}`,
        },
      }));
      return;
    }

    // Marcar como probando
    setConnections((prev) => ({
      ...prev,
      [connectionId]: { ...prev[connectionId], status: 'testing', errorMessage: undefined },
    }));

    addLog(
      'info',
      connectionId as LogEntry['source'],
      `Probando conexión con ${connectionInfo.name}...`
    );

    try {
      // Determinar URL a probar
      let testUrl = connection.values.webhookUrl || '';

      if (connectionId === 'dropi') {
        testUrl = 'https://api.dropi.co/v1/test';
      }

      // Preparar headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (connection.values.apiKey) {
        headers['Authorization'] = `Bearer ${connection.values.apiKey}`;
      }

      // Realizar petición
      const response = await fetch(testUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          test: true,
          source: 'litper',
          timestamp: new Date().toISOString(),
          ...(connection.values.storeId && { storeId: connection.values.storeId }),
        }),
        mode: 'no-cors',
      });

      // Marcar como conectado (no-cors no permite verificar response)
      setConnections((prev) => ({
        ...prev,
        [connectionId]: {
          ...prev[connectionId],
          status: 'connected',
          lastTested: new Date().toISOString(),
          errorMessage: undefined,
        },
      }));

      addLog(
        'success',
        connectionId as LogEntry['source'],
        `Conexión exitosa con ${connectionInfo.name}`
      );
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';

      setConnections((prev) => ({
        ...prev,
        [connectionId]: {
          ...prev[connectionId],
          status: 'error',
          lastTested: new Date().toISOString(),
          errorMessage: errorMsg,
        },
      }));

      addLog('error', connectionId as LogEntry['source'], `Error: ${errorMsg}`);
    }
  };

  // Actualizar campo de conexión
  const updateConnectionField = (connectionId: string, fieldKey: string, value: string) => {
    setConnections((prev) => ({
      ...prev,
      [connectionId]: {
        ...prev[connectionId],
        values: {
          ...prev[connectionId].values,
          [fieldKey]: value,
        },
        status: 'idle',
        errorMessage: undefined,
      },
    }));
  };

  // Copiar webhook
  const copyWebhook = async (webhook: Webhook) => {
    const baseUrl = window.location.origin;
    const fullUrl = `${baseUrl}${webhook.url}`;

    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopiedWebhook(webhook.id);
      addLog('info', 'sistema', `URL copiada: ${webhook.name}`);
      setTimeout(() => setCopiedWebhook(null), 2000);
    } catch {
      addLog('error', 'sistema', 'Error al copiar URL');
    }
  };

  // Limpiar logs
  const clearLogs = () => {
    setLogs([]);
    addLog('info', 'sistema', 'Logs limpiados');
  };

  // Formatear timestamp
  const formatTimestamp = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // Obtener indicador de estado
  const getStatusIndicator = (status: ConnectionState['status']) => {
    switch (status) {
      case 'connected':
        return (
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full animate-pulse"
              style={{ backgroundColor: COLORS.connected }}
            />
            <span className="text-sm font-medium" style={{ color: COLORS.connected }}>
              Conectado
            </span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: COLORS.disconnected }}
            />
            <span className="text-sm font-medium" style={{ color: COLORS.disconnected }}>
              Desconectado
            </span>
          </div>
        );
      case 'testing':
        return (
          <div className="flex items-center gap-2">
            <RefreshCw className="w-3 h-3 animate-spin" style={{ color: COLORS.primary }} />
            <span className="text-sm font-medium" style={{ color: COLORS.primary }}>
              Probando...
            </span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-slate-400 rounded-full" />
            <span className="text-sm font-medium text-slate-400">Sin probar</span>
          </div>
        );
    }
  };

  // Obtener icono de log
  const getLogIcon = (type: LogEntry['type']) => {
    switch (type) {
      case 'success':
        return <Check className="w-4 h-4" style={{ color: COLORS.connected }} />;
      case 'error':
        return <AlertCircle className="w-4 h-4" style={{ color: COLORS.disconnected }} />;
      default:
        return <Terminal className="w-4 h-4" style={{ color: COLORS.info }} />;
    }
  };

  // Obtener etiqueta de origen
  const getSourceLabel = (source: LogEntry['source']) => {
    const labels: Record<string, string> = {
      n8n: 'N8N',
      chatea: 'Chatea Pro',
      dropi: 'Dropi',
      sistema: 'Sistema',
    };
    return labels[source] || source;
  };

  // Obtener indicador de proceso
  const getProcessStatusIndicator = (status: ProcessStatus['status']) => {
    switch (status) {
      case 'active':
        return (
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4" style={{ color: COLORS.connected }} />
            <span className="text-xs font-medium" style={{ color: COLORS.connected }}>
              Activo
            </span>
          </div>
        );
      case 'paused':
        return (
          <div className="flex items-center gap-1.5">
            <PauseCircle className="w-4 h-4" style={{ color: COLORS.warning }} />
            <span className="text-xs font-medium" style={{ color: COLORS.warning }}>
              Pausado
            </span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4" style={{ color: COLORS.disconnected }} />
            <span className="text-xs font-medium" style={{ color: COLORS.disconnected }}>
              Error
            </span>
          </div>
        );
    }
  };

  // Contar conexiones
  const connectedCount = Object.values(connections).filter((c) => c.status === 'connected').length;
  const errorCount = Object.values(connections).filter((c) => c.status === 'error').length;

  return (
    <div className="space-y-6 p-6 min-h-screen" style={{ backgroundColor: COLORS.background }}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 rounded-xl" style={{ backgroundColor: COLORS.primary }}>
            <Plug className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Conexiones</h1>
            <p className="text-slate-400">Gestiona tus integraciones externas</p>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* CARDS DE CONEXIÓN */}
      {/* ============================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {CONNECTIONS.map((conn) => {
          const state = connections[conn.id];
          const borderColor =
            state.status === 'connected'
              ? COLORS.connected
              : state.status === 'error'
                ? COLORS.disconnected
                : '#334155';

          return (
            <div
              key={conn.id}
              className="rounded-xl p-6 border-2 transition-all hover:shadow-lg"
              style={{
                backgroundColor: COLORS.cards,
                borderColor,
              }}
            >
              {/* Card Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="p-2 rounded-lg text-white"
                    style={{ backgroundColor: COLORS.primary }}
                  >
                    {conn.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{conn.name}</h3>
                    <p className="text-sm text-slate-400">{conn.description}</p>
                  </div>
                </div>
                {getStatusIndicator(state.status)}
              </div>

              {/* Campos dinámicos */}
              <div className="space-y-3">
                {conn.fields.map((field) => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      {field.label}{' '}
                      {field.required && <span style={{ color: COLORS.disconnected }}>*</span>}
                    </label>
                    <input
                      type={field.type}
                      value={state.values[field.key] || ''}
                      onChange={(e) => updateConnectionField(conn.id, field.key, e.target.value)}
                      placeholder={field.placeholder}
                      className="w-full px-3 py-2 rounded-lg border text-white placeholder-slate-500 focus:ring-2 outline-none transition-all text-sm"
                      style={{
                        backgroundColor: COLORS.background,
                        borderColor: '#334155',
                      }}
                    />
                  </div>
                ))}

                {/* Error message */}
                {state.errorMessage && (
                  <p className="text-xs" style={{ color: COLORS.disconnected }}>
                    {state.errorMessage}
                  </p>
                )}

                {/* Botón Probar */}
                <button
                  onClick={() => testConnection(conn.id)}
                  disabled={state.status === 'testing'}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed text-white hover:opacity-90"
                  style={{ backgroundColor: COLORS.primary }}
                >
                  {state.status === 'testing' ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Probando...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Probar Conexión
                    </>
                  )}
                </button>

                {/* Última prueba */}
                {state.lastTested && (
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Clock className="w-3 h-3" />
                    Última prueba: {formatTimestamp(state.lastTested)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ============================================ */}
      {/* WEBHOOKS + LOGS */}
      {/* ============================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Webhooks de mi app */}
        <div
          className="rounded-xl p-6 border border-slate-700"
          style={{ backgroundColor: COLORS.cards }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Link className="w-5 h-5" style={{ color: COLORS.primary }} />
            <h3 className="text-lg font-semibold text-white">Webhooks de Mi App</h3>
          </div>

          <p className="text-sm text-slate-400 mb-4">
            Usa estos endpoints para recibir datos en tus integraciones
          </p>

          <div className="space-y-3">
            {APP_WEBHOOKS.map((webhook) => (
              <div
                key={webhook.id}
                className="flex items-center justify-between p-3 rounded-lg transition-colors hover:bg-slate-700/30"
                style={{ backgroundColor: COLORS.background }}
              >
                <div className="flex-1 min-w-0 mr-3">
                  <div className="flex items-center gap-2">
                    <Wifi className="w-4 h-4" style={{ color: COLORS.primary }} />
                    <span className="font-medium text-white">{webhook.name}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{webhook.description}</p>
                  <code className="text-xs mt-1 block truncate" style={{ color: COLORS.primary }}>
                    {webhook.url}
                  </code>
                </div>
                <button
                  onClick={() => copyWebhook(webhook)}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all shrink-0 text-white"
                  style={{
                    backgroundColor:
                      copiedWebhook === webhook.id ? COLORS.connected : COLORS.primary,
                  }}
                >
                  {copiedWebhook === webhook.id ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copiar
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Logs en tiempo real */}
        <div
          className="rounded-xl p-6 border border-slate-700"
          style={{ backgroundColor: COLORS.cards }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5" style={{ color: COLORS.primary }} />
              <h3 className="text-lg font-semibold text-white">Logs en Tiempo Real</h3>
            </div>
            <button
              onClick={clearLogs}
              className="flex items-center gap-1 px-3 py-1 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
            >
              <Trash2 className="w-4 h-4" />
              Limpiar
            </button>
          </div>

          <div
            className="h-64 overflow-y-auto rounded-lg p-3 font-mono text-sm space-y-2"
            style={{ backgroundColor: COLORS.background }}
          >
            {logs.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-500">
                No hay logs disponibles
              </div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-2 p-2 rounded hover:bg-slate-800/50 transition-colors"
                >
                  {getLogIcon(log.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-slate-500 text-xs">
                        {formatTimestamp(log.timestamp)}
                      </span>
                      <span
                        className="px-1.5 py-0.5 rounded text-xs font-medium text-white"
                        style={{ backgroundColor: COLORS.primary }}
                      >
                        {getSourceLabel(log.source)}
                      </span>
                    </div>
                    <p
                      className={`text-sm mt-0.5 ${
                        log.type === 'error'
                          ? 'text-red-400'
                          : log.type === 'success'
                            ? 'text-green-400'
                            : 'text-blue-400'
                      }`}
                    >
                      {log.message}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* PROCESOS ACTIVOS */}
      {/* ============================================ */}
      <div
        className="rounded-xl p-6 border border-slate-700"
        style={{ backgroundColor: COLORS.cards }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5" style={{ color: COLORS.primary }} />
          <h3 className="text-lg font-semibold text-white">Procesos Activos</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {processes.map((process) => (
            <div
              key={process.id}
              className="p-4 rounded-lg border border-slate-700 transition-all hover:border-slate-600"
              style={{ backgroundColor: COLORS.background }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="p-1.5 rounded"
                  style={{
                    backgroundColor:
                      process.status === 'active'
                        ? `${COLORS.connected}20`
                        : process.status === 'paused'
                          ? `${COLORS.warning}20`
                          : `${COLORS.disconnected}20`,
                    color:
                      process.status === 'active'
                        ? COLORS.connected
                        : process.status === 'paused'
                          ? COLORS.warning
                          : COLORS.disconnected,
                  }}
                >
                  {process.icon}
                </div>
              </div>
              <h4 className="text-sm font-medium text-white mb-1">{process.name}</h4>
              {getProcessStatusIndicator(process.status)}
            </div>
          ))}
        </div>
      </div>

      {/* ============================================ */}
      {/* RESUMEN DE CONEXIONES */}
      {/* ============================================ */}
      <div
        className="rounded-xl p-4 border border-slate-700 flex items-center justify-between"
        style={{ backgroundColor: COLORS.cards }}
      >
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Wifi className="w-5 h-5" style={{ color: COLORS.connected }} />
            <span className="text-slate-300">
              <span className="font-semibold text-white">{connectedCount}</span> conectadas
            </span>
          </div>
          <div className="flex items-center gap-2">
            <WifiOff className="w-5 h-5" style={{ color: COLORS.disconnected }} />
            <span className="text-slate-300">
              <span className="font-semibold text-white">{errorCount}</span> con error
            </span>
          </div>
        </div>
        <div className="text-sm text-slate-500">
          Total: {CONNECTIONS.length} integraciones configuradas
        </div>
      </div>
    </div>
  );
};

export default ConexionesTab;
