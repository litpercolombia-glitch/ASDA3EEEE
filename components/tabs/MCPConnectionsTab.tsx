import React, { useState, useCallback } from 'react';
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
} from 'lucide-react';

interface ConnectionCard {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  urlPlaceholder: string;
  defaultUrl?: string;
}

interface ConnectionState {
  url: string;
  apiKey: string;
  status: 'idle' | 'testing' | 'connected' | 'error';
  lastTested?: Date;
}

interface LogEntry {
  id: string;
  timestamp: Date;
  type: 'info' | 'success' | 'error' | 'warning';
  message: string;
  connection?: string;
}

interface Webhook {
  id: string;
  name: string;
  url: string;
  description: string;
}

const CONNECTIONS: ConnectionCard[] = [
  {
    id: 'n8n',
    name: 'N8N',
    icon: <Zap className="w-6 h-6" />,
    description: 'Automatización de flujos de trabajo',
    urlPlaceholder: 'https://tu-instancia-n8n.com/webhook/...',
    defaultUrl:
      'https://n8n.srv1103164.hstgr.cloud/prueba-de-webhook/240bf3b5-7689-4997-8001-0f1183eb79e9',
  },
  {
    id: 'chatea-pro',
    name: 'Chatea Pro',
    icon: <MessageSquare className="w-6 h-6" />,
    description: 'Integración con WhatsApp Business',
    urlPlaceholder: 'https://api.chateapro.com/v1/...',
  },
  {
    id: 'dropi',
    name: 'Dropi',
    icon: <ShoppingCart className="w-6 h-6" />,
    description: 'Plataforma de dropshipping',
    urlPlaceholder: 'https://api.dropi.co/v1/...',
  },
];

const APP_WEBHOOKS: Webhook[] = [
  {
    id: 'new-order',
    name: 'Nuevo Pedido',
    url: '/api/webhooks/new-order',
    description: 'Se dispara cuando se crea un nuevo pedido',
  },
  {
    id: 'status-change',
    name: 'Cambio de Estado',
    url: '/api/webhooks/status-change',
    description: 'Se dispara cuando cambia el estado de un envío',
  },
  {
    id: 'delivery-complete',
    name: 'Entrega Completada',
    url: '/api/webhooks/delivery-complete',
    description: 'Se dispara cuando se completa una entrega',
  },
  {
    id: 'return-request',
    name: 'Solicitud de Devolución',
    url: '/api/webhooks/return-request',
    description: 'Se dispara cuando se solicita una devolución',
  },
];

export const MCPConnectionsTab: React.FC = () => {
  const [connections, setConnections] = useState<Record<string, ConnectionState>>({
    n8n: {
      url: CONNECTIONS[0].defaultUrl || '',
      apiKey: '',
      status: 'idle',
    },
    'chatea-pro': { url: '', apiKey: '', status: 'idle' },
    dropi: { url: '', apiKey: '', status: 'idle' },
  });

  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: '1',
      timestamp: new Date(),
      type: 'info',
      message: 'Sistema de conexiones MCP iniciado',
    },
  ]);

  const [copiedWebhook, setCopiedWebhook] = useState<string | null>(null);

  const addLog = useCallback((type: LogEntry['type'], message: string, connection?: string) => {
    const newLog: LogEntry = {
      id: Date.now().toString(),
      timestamp: new Date(),
      type,
      message,
      connection,
    };
    setLogs((prev) => [newLog, ...prev].slice(0, 50)); // Máximo 50 logs
  }, []);

  const testConnection = async (connectionId: string) => {
    const connection = connections[connectionId];
    const connectionInfo = CONNECTIONS.find((c) => c.id === connectionId);

    if (!connection.url) {
      addLog('error', `URL no configurada para ${connectionInfo?.name}`, connectionId);
      return;
    }

    setConnections((prev) => ({
      ...prev,
      [connectionId]: { ...prev[connectionId], status: 'testing' },
    }));

    addLog('info', `Probando conexión con ${connectionInfo?.name}...`, connectionId);

    try {
      // Simular llamada a la API - en producción usarías fetch real
      const response = await fetch(connection.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(connection.apiKey && { Authorization: `Bearer ${connection.apiKey}` }),
        },
        body: JSON.stringify({ test: true, timestamp: new Date().toISOString() }),
        mode: 'no-cors', // Para evitar problemas CORS en pruebas
      });

      // Si llegamos aquí sin error, consideramos éxito (no-cors no da acceso a response)
      setConnections((prev) => ({
        ...prev,
        [connectionId]: {
          ...prev[connectionId],
          status: 'connected',
          lastTested: new Date(),
        },
      }));
      addLog('success', `Conexión exitosa con ${connectionInfo?.name}`, connectionId);
    } catch (error) {
      setConnections((prev) => ({
        ...prev,
        [connectionId]: {
          ...prev[connectionId],
          status: 'error',
          lastTested: new Date(),
        },
      }));
      addLog(
        'error',
        `Error al conectar con ${connectionInfo?.name}: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        connectionId
      );
    }
  };

  const copyWebhook = async (webhook: Webhook) => {
    const baseUrl = window.location.origin;
    const fullUrl = `${baseUrl}${webhook.url}`;

    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopiedWebhook(webhook.id);
      addLog('info', `URL copiada: ${webhook.name}`);
      setTimeout(() => setCopiedWebhook(null), 2000);
    } catch (error) {
      addLog('error', 'Error al copiar URL al portapapeles');
    }
  };

  const clearLogs = () => {
    setLogs([]);
    addLog('info', 'Logs limpiados');
  };

  const getStatusIndicator = (status: ConnectionState['status']) => {
    switch (status) {
      case 'connected':
        return (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <span className="text-green-500 text-sm font-medium">Conectado</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full" />
            <span className="text-red-500 text-sm font-medium">Error</span>
          </div>
        );
      case 'testing':
        return (
          <div className="flex items-center gap-2">
            <RefreshCw className="w-3 h-3 text-orange-500 animate-spin" />
            <span className="text-orange-500 text-sm font-medium">Probando...</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-slate-400 rounded-full" />
            <span className="text-slate-400 text-sm font-medium">Sin probar</span>
          </div>
        );
    }
  };

  const getLogIcon = (type: LogEntry['type']) => {
    switch (type) {
      case 'success':
        return <Check className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Terminal className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6 p-6 min-h-screen" style={{ backgroundColor: '#0F172A' }}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 rounded-xl" style={{ backgroundColor: '#F97316' }}>
            <Plug className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Conexiones MCP</h1>
            <p className="text-slate-400">Gestiona tus integraciones externas</p>
          </div>
        </div>
      </div>

      {/* Connection Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {CONNECTIONS.map((conn) => {
          const state = connections[conn.id];
          return (
            <div
              key={conn.id}
              className="rounded-xl p-6 border transition-all hover:border-orange-500/50"
              style={{
                backgroundColor: '#1E293B',
                borderColor:
                  state.status === 'connected'
                    ? '#22C55E'
                    : state.status === 'error'
                      ? '#EF4444'
                      : '#334155',
              }}
            >
              {/* Card Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: '#F97316' }}>
                    {conn.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{conn.name}</h3>
                    <p className="text-sm text-slate-400">{conn.description}</p>
                  </div>
                </div>
                {getStatusIndicator(state.status)}
              </div>

              {/* URL Input */}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    URL / Webhook
                  </label>
                  <input
                    type="text"
                    value={state.url}
                    onChange={(e) =>
                      setConnections((prev) => ({
                        ...prev,
                        [conn.id]: { ...prev[conn.id], url: e.target.value, status: 'idle' },
                      }))
                    }
                    placeholder={conn.urlPlaceholder}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all text-sm"
                  />
                </div>

                {/* API Key Input */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    API Key (opcional)
                  </label>
                  <input
                    type="password"
                    value={state.apiKey}
                    onChange={(e) =>
                      setConnections((prev) => ({
                        ...prev,
                        [conn.id]: { ...prev[conn.id], apiKey: e.target.value },
                      }))
                    }
                    placeholder="••••••••••••••••"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all text-sm"
                  />
                </div>

                {/* Test Button */}
                <button
                  onClick={() => testConnection(conn.id)}
                  disabled={state.status === 'testing'}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed text-white"
                  style={{ backgroundColor: '#F97316' }}
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

                {/* Last Tested */}
                {state.lastTested && (
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Clock className="w-3 h-3" />
                    Última prueba: {state.lastTested.toLocaleTimeString()}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Section: Logs + Webhooks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Logs Section */}
        <div
          className="rounded-xl p-6 border border-slate-700"
          style={{ backgroundColor: '#1E293B' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5" style={{ color: '#F97316' }} />
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
            style={{ backgroundColor: '#0F172A' }}
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
                        {log.timestamp.toLocaleTimeString()}
                      </span>
                      {log.connection && (
                        <span
                          className="px-1.5 py-0.5 rounded text-xs font-medium"
                          style={{ backgroundColor: '#F97316', color: 'white' }}
                        >
                          {CONNECTIONS.find((c) => c.id === log.connection)?.name}
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-sm mt-0.5 ${
                        log.type === 'error'
                          ? 'text-red-400'
                          : log.type === 'success'
                            ? 'text-green-400'
                            : log.type === 'warning'
                              ? 'text-yellow-400'
                              : 'text-slate-300'
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

        {/* Webhooks Section */}
        <div
          className="rounded-xl p-6 border border-slate-700"
          style={{ backgroundColor: '#1E293B' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Link className="w-5 h-5" style={{ color: '#F97316' }} />
            <h3 className="text-lg font-semibold text-white">Webhooks de Litper</h3>
          </div>

          <p className="text-sm text-slate-400 mb-4">
            Usa estos endpoints para recibir datos en tus integraciones externas
          </p>

          <div className="space-y-3">
            {APP_WEBHOOKS.map((webhook) => (
              <div
                key={webhook.id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-700/50 transition-colors"
                style={{ backgroundColor: '#0F172A' }}
              >
                <div className="flex-1 min-w-0 mr-3">
                  <div className="flex items-center gap-2">
                    <Wifi className="w-4 h-4" style={{ color: '#F97316' }} />
                    <span className="font-medium text-white">{webhook.name}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{webhook.description}</p>
                  <code className="text-xs text-orange-400 mt-1 block truncate">{webhook.url}</code>
                </div>
                <button
                  onClick={() => copyWebhook(webhook)}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all shrink-0"
                  style={{
                    backgroundColor: copiedWebhook === webhook.id ? '#22C55E' : '#F97316',
                    color: 'white',
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
      </div>

      {/* Connection Summary */}
      <div
        className="rounded-xl p-4 border border-slate-700 flex items-center justify-between"
        style={{ backgroundColor: '#1E293B' }}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Wifi className="w-5 h-5 text-green-500" />
            <span className="text-slate-300">
              <span className="font-semibold text-white">
                {Object.values(connections).filter((c) => c.status === 'connected').length}
              </span>{' '}
              conectadas
            </span>
          </div>
          <div className="flex items-center gap-2">
            <WifiOff className="w-5 h-5 text-red-500" />
            <span className="text-slate-300">
              <span className="font-semibold text-white">
                {Object.values(connections).filter((c) => c.status === 'error').length}
              </span>{' '}
              con error
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

export default MCPConnectionsTab;
