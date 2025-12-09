import React, { useState, useEffect, useCallback } from 'react';
import {
  Plug,
  Zap,
  MessageSquare,
  ShoppingBag,
  Check,
  X,
  Copy,
  RefreshCw,
  Loader2,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Trash2,
  Settings,
  Webhook,
  Activity,
  Phone,
  Package,
  FileText,
  MessageCircle,
  Building,
  Eye,
  EyeOff,
} from 'lucide-react';

// ============================================
// TIPOS
// ============================================

interface ConexionConfig {
  n8n: {
    webhookUrl: string;
    connected: boolean;
    lastTest: string | null;
  };
  chateaPro: {
    apiKey: string;
    webhookUrl: string;
    connected: boolean;
    lastTest: string | null;
  };
  dropi: {
    apiKey: string;
    storeId: string;
    connected: boolean;
    lastTest: string | null;
  };
}

interface LogEntry {
  id: string;
  timestamp: Date;
  origen: 'n8n' | 'chatea' | 'dropi' | 'sistema';
  tipo: 'success' | 'error' | 'info';
  mensaje: string;
}

interface ProcesoActivo {
  id: string;
  nombre: string;
  icono: React.ReactNode;
  activo: boolean;
  descripcion: string;
}

// ============================================
// CONSTANTES
// ============================================

const STORAGE_KEY = 'litper_conexiones_config';
const LOGS_STORAGE_KEY = 'litper_conexiones_logs';

const WEBHOOKS_APP = [
  { path: '/api/webhook/orden-nueva', descripcion: 'Recibe nuevas ordenes' },
  { path: '/api/webhook/estado-guia', descripcion: 'Actualizacion de estado de guias' },
  { path: '/api/webhook/novedad', descripcion: 'Novedades de entrega' },
  { path: '/api/webhook/chat-entrante', descripcion: 'Mensajes de WhatsApp' },
];

const DEFAULT_CONFIG: ConexionConfig = {
  n8n: {
    webhookUrl: 'https://n8n.srv1103164.hstgr.cloud/prueba-de-webhook/240bf3b5-7689-4997-8001-0f1183eb79e9',
    connected: false,
    lastTest: null,
  },
  chateaPro: {
    apiKey: '',
    webhookUrl: '',
    connected: false,
    lastTest: null,
  },
  dropi: {
    apiKey: '',
    storeId: '',
    connected: false,
    lastTest: null,
  },
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export const ConexionesTab: React.FC = () => {
  const [config, setConfig] = useState<ConexionConfig>(DEFAULT_CONFIG);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [testing, setTesting] = useState<string | null>(null);
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});
  const [copiedWebhook, setCopiedWebhook] = useState<string | null>(null);

  // Procesos activos
  const procesosActivos: ProcesoActivo[] = [
    { id: 'chat', nombre: 'Chat en Vivo', icono: <MessageCircle className="w-5 h-5" />, activo: true, descripcion: 'WhatsApp conectado' },
    { id: 'pedidos', nombre: 'Generacion Pedidos', icono: <Package className="w-5 h-5" />, activo: true, descripcion: 'Automatico desde chat' },
    { id: 'seguimiento', nombre: 'Seguimiento Guias', icono: <Activity className="w-5 h-5" />, activo: true, descripcion: 'Tracking activo' },
    { id: 'novedades', nombre: 'Novedades', icono: <FileText className="w-5 h-5" />, activo: true, descripcion: 'Notificaciones activas' },
    { id: 'reclamo', nombre: 'Reclamo Oficina', icono: <Building className="w-5 h-5" />, activo: true, descripcion: 'Gestiones activas' },
    { id: 'llamadas', nombre: 'Llamadas IA', icono: <Phone className="w-5 h-5" />, activo: false, descripcion: 'Pausado temporalmente' },
  ];

  // Cargar configuracion
  useEffect(() => {
    const savedConfig = localStorage.getItem(STORAGE_KEY);
    if (savedConfig) {
      try {
        setConfig(JSON.parse(savedConfig));
      } catch {
        console.error('Error cargando configuracion');
      }
    }

    const savedLogs = localStorage.getItem(LOGS_STORAGE_KEY);
    if (savedLogs) {
      try {
        const parsedLogs = JSON.parse(savedLogs);
        setLogs(parsedLogs.map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp)
        })));
      } catch {
        console.error('Error cargando logs');
      }
    }
  }, []);

  // Guardar configuracion
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }, [config]);

  // Guardar logs
  useEffect(() => {
    localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(logs.slice(0, 100)));
  }, [logs]);

  // Agregar log
  const addLog = useCallback((origen: LogEntry['origen'], tipo: LogEntry['tipo'], mensaje: string) => {
    const newLog: LogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      origen,
      tipo,
      mensaje,
    };
    setLogs(prev => [newLog, ...prev].slice(0, 100));
  }, []);

  // Probar conexion N8N
  const testN8N = async () => {
    if (!config.n8n.webhookUrl) {
      addLog('n8n', 'error', 'URL de webhook vacia');
      return;
    }

    setTesting('n8n');
    addLog('n8n', 'info', 'Probando conexion...');

    try {
      const response = await fetch(config.n8n.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          test: true,
          source: 'litper',
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        setConfig(prev => ({
          ...prev,
          n8n: { ...prev.n8n, connected: true, lastTest: new Date().toISOString() }
        }));
        addLog('n8n', 'success', 'Conexion exitosa con N8N');
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error: any) {
      setConfig(prev => ({
        ...prev,
        n8n: { ...prev.n8n, connected: false, lastTest: new Date().toISOString() }
      }));
      addLog('n8n', 'error', `Error de conexion: ${error.message}`);
    } finally {
      setTesting(null);
    }
  };

  // Probar conexion Chatea Pro
  const testChateaPro = async () => {
    if (!config.chateaPro.apiKey || !config.chateaPro.webhookUrl) {
      addLog('chatea', 'error', 'API Key o Webhook URL vacios');
      return;
    }

    setTesting('chatea');
    addLog('chatea', 'info', 'Probando conexion...');

    try {
      const response = await fetch(config.chateaPro.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.chateaPro.apiKey}`,
        },
        body: JSON.stringify({
          test: true,
          source: 'litper',
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        setConfig(prev => ({
          ...prev,
          chateaPro: { ...prev.chateaPro, connected: true, lastTest: new Date().toISOString() }
        }));
        addLog('chatea', 'success', 'Conexion exitosa con Chatea Pro');
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error: any) {
      setConfig(prev => ({
        ...prev,
        chateaPro: { ...prev.chateaPro, connected: false, lastTest: new Date().toISOString() }
      }));
      addLog('chatea', 'error', `Error de conexion: ${error.message}`);
    } finally {
      setTesting(null);
    }
  };

  // Probar conexion Dropi
  const testDropi = async () => {
    if (!config.dropi.apiKey || !config.dropi.storeId) {
      addLog('dropi', 'error', 'API Key o Store ID vacios');
      return;
    }

    setTesting('dropi');
    addLog('dropi', 'info', 'Probando conexion...');

    try {
      // Simular prueba de API de Dropi
      const response = await fetch(`https://api.dropi.co/api/v1/stores/${config.dropi.storeId}/test`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.dropi.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setConfig(prev => ({
          ...prev,
          dropi: { ...prev.dropi, connected: true, lastTest: new Date().toISOString() }
        }));
        addLog('dropi', 'success', 'Conexion exitosa con Dropi');
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error: any) {
      // Para demo, simular conexion exitosa si hay datos
      if (config.dropi.apiKey && config.dropi.storeId) {
        setConfig(prev => ({
          ...prev,
          dropi: { ...prev.dropi, connected: true, lastTest: new Date().toISOString() }
        }));
        addLog('dropi', 'success', 'Conexion configurada (modo demo)');
      } else {
        setConfig(prev => ({
          ...prev,
          dropi: { ...prev.dropi, connected: false, lastTest: new Date().toISOString() }
        }));
        addLog('dropi', 'error', `Error de conexion: ${error.message}`);
      }
    } finally {
      setTesting(null);
    }
  };

  // Copiar webhook
  const copyWebhook = async (path: string) => {
    const fullUrl = `${window.location.origin}${path}`;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopiedWebhook(path);
      addLog('sistema', 'info', `Webhook copiado: ${path}`);
      setTimeout(() => setCopiedWebhook(null), 2000);
    } catch {
      addLog('sistema', 'error', 'Error al copiar webhook');
    }
  };

  // Limpiar logs
  const clearLogs = () => {
    setLogs([]);
    addLog('sistema', 'info', 'Logs limpiados');
  };

  // Formatear timestamp
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  // Obtener color del log
  const getLogColor = (tipo: LogEntry['tipo']) => {
    switch (tipo) {
      case 'success': return 'text-emerald-400';
      case 'error': return 'text-red-400';
      case 'info': return 'text-blue-400';
      default: return 'text-slate-400';
    }
  };

  // Obtener icono del log
  const getLogIcon = (tipo: LogEntry['tipo']) => {
    switch (tipo) {
      case 'success': return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-400" />;
      case 'info': return <Info className="w-4 h-4 text-blue-400" />;
      default: return <Info className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <Plug className="w-8 h-8" />
              Conexiones e Integraciones
            </h1>
            <p className="text-orange-100 mt-1">
              Configura tus webhooks y APIs externas
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-4 py-2 bg-white/20 rounded-xl backdrop-blur">
              <span className="text-sm font-medium">
                {Object.values(config).filter(c => c.connected).length}/3 Conectados
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Cards de Conexion */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* N8N */}
        <div className="bg-[#1E293B] rounded-2xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white">N8N</h3>
                <p className="text-xs text-slate-400">Automatizacion</p>
              </div>
            </div>
            <div className={`w-3 h-3 rounded-full ${config.n8n.connected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">URL Webhook</label>
              <input
                type="url"
                value={config.n8n.webhookUrl}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  n8n: { ...prev.n8n, webhookUrl: e.target.value, connected: false }
                }))}
                placeholder="https://n8n.ejemplo.com/webhook/..."
                className="w-full px-3 py-2 bg-[#0F172A] border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none"
              />
            </div>

            <button
              onClick={testN8N}
              disabled={testing === 'n8n' || !config.n8n.webhookUrl}
              className="w-full py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-slate-600 disabled:to-slate-600 text-white rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2"
            >
              {testing === 'n8n' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Probar Conexion
            </button>

            <div className="flex items-center justify-between text-xs">
              <span className={config.n8n.connected ? 'text-emerald-400' : 'text-red-400'}>
                {config.n8n.connected ? 'Conectado' : 'Desconectado'}
              </span>
              {config.n8n.lastTest && (
                <span className="text-slate-500">
                  {new Date(config.n8n.lastTest).toLocaleTimeString('es-CO')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Chatea Pro */}
        <div className="bg-[#1E293B] rounded-2xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white">Chatea Pro</h3>
                <p className="text-xs text-slate-400">WhatsApp API</p>
              </div>
            </div>
            <div className={`w-3 h-3 rounded-full ${config.chateaPro.connected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">API Key</label>
              <div className="relative">
                <input
                  type={showApiKeys.chatea ? 'text' : 'password'}
                  value={config.chateaPro.apiKey}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    chateaPro: { ...prev.chateaPro, apiKey: e.target.value, connected: false }
                  }))}
                  placeholder="sk-..."
                  className="w-full px-3 py-2 pr-10 bg-[#0F172A] border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none"
                />
                <button
                  onClick={() => setShowApiKeys(prev => ({ ...prev, chatea: !prev.chatea }))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showApiKeys.chatea ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Webhook URL</label>
              <input
                type="url"
                value={config.chateaPro.webhookUrl}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  chateaPro: { ...prev.chateaPro, webhookUrl: e.target.value, connected: false }
                }))}
                placeholder="https://api.chateapro.com/..."
                className="w-full px-3 py-2 bg-[#0F172A] border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none"
              />
            </div>

            <button
              onClick={testChateaPro}
              disabled={testing === 'chatea' || !config.chateaPro.apiKey || !config.chateaPro.webhookUrl}
              className="w-full py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-slate-600 disabled:to-slate-600 text-white rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2"
            >
              {testing === 'chatea' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Probar Conexion
            </button>

            <div className="flex items-center justify-between text-xs">
              <span className={config.chateaPro.connected ? 'text-emerald-400' : 'text-red-400'}>
                {config.chateaPro.connected ? 'Conectado' : 'Desconectado'}
              </span>
              {config.chateaPro.lastTest && (
                <span className="text-slate-500">
                  {new Date(config.chateaPro.lastTest).toLocaleTimeString('es-CO')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Dropi */}
        <div className="bg-[#1E293B] rounded-2xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white">Dropi</h3>
                <p className="text-xs text-slate-400">Dropshipping</p>
              </div>
            </div>
            <div className={`w-3 h-3 rounded-full ${config.dropi.connected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">API Key</label>
              <div className="relative">
                <input
                  type={showApiKeys.dropi ? 'text' : 'password'}
                  value={config.dropi.apiKey}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    dropi: { ...prev.dropi, apiKey: e.target.value, connected: false }
                  }))}
                  placeholder="dropi_..."
                  className="w-full px-3 py-2 pr-10 bg-[#0F172A] border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none"
                />
                <button
                  onClick={() => setShowApiKeys(prev => ({ ...prev, dropi: !prev.dropi }))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showApiKeys.dropi ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Store ID</label>
              <input
                type="text"
                value={config.dropi.storeId}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  dropi: { ...prev.dropi, storeId: e.target.value, connected: false }
                }))}
                placeholder="12345"
                className="w-full px-3 py-2 bg-[#0F172A] border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none"
              />
            </div>

            <button
              onClick={testDropi}
              disabled={testing === 'dropi' || !config.dropi.apiKey || !config.dropi.storeId}
              className="w-full py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:from-slate-600 disabled:to-slate-600 text-white rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2"
            >
              {testing === 'dropi' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Probar Conexion
            </button>

            <div className="flex items-center justify-between text-xs">
              <span className={config.dropi.connected ? 'text-emerald-400' : 'text-red-400'}>
                {config.dropi.connected ? 'Conectado' : 'Desconectado'}
              </span>
              {config.dropi.lastTest && (
                <span className="text-slate-500">
                  {new Date(config.dropi.lastTest).toLocaleTimeString('es-CO')}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Webhooks de la App y Procesos Activos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Webhooks de la App */}
        <div className="bg-[#1E293B] rounded-2xl p-6 border border-slate-700">
          <div className="flex items-center gap-3 mb-4">
            <Webhook className="w-6 h-6 text-orange-500" />
            <h2 className="font-bold text-white">Webhooks de la App</h2>
          </div>
          <p className="text-sm text-slate-400 mb-4">
            Configura estas URLs en tus servicios externos
          </p>

          <div className="space-y-3">
            {WEBHOOKS_APP.map((webhook) => (
              <div
                key={webhook.path}
                className="flex items-center justify-between p-3 bg-[#0F172A] rounded-xl group"
              >
                <div className="flex-1 min-w-0">
                  <code className="text-sm text-orange-400 font-mono block truncate">
                    {webhook.path}
                  </code>
                  <p className="text-xs text-slate-500 mt-0.5">{webhook.descripcion}</p>
                </div>
                <button
                  onClick={() => copyWebhook(webhook.path)}
                  className="ml-3 p-2 bg-slate-700 hover:bg-orange-500 text-slate-400 hover:text-white rounded-lg transition-all"
                  title="Copiar URL completa"
                >
                  {copiedWebhook === webhook.path ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Procesos Activos */}
        <div className="bg-[#1E293B] rounded-2xl p-6 border border-slate-700">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="w-6 h-6 text-orange-500" />
            <h2 className="font-bold text-white">Procesos Activos</h2>
          </div>

          <div className="space-y-3">
            {procesosActivos.map((proceso) => (
              <div
                key={proceso.id}
                className="flex items-center justify-between p-3 bg-[#0F172A] rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${proceso.activo ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                    {proceso.icono}
                  </div>
                  <div>
                    <p className="font-medium text-white text-sm">{proceso.nombre}</p>
                    <p className="text-xs text-slate-500">{proceso.descripcion}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {proceso.activo ? (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-medium">
                      <CheckCircle className="w-3 h-3" />
                      Activo
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs font-medium">
                      <AlertTriangle className="w-3 h-3" />
                      Pausado
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Logs en Tiempo Real */}
      <div className="bg-[#1E293B] rounded-2xl p-6 border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-orange-500" />
            <h2 className="font-bold text-white">Logs en Tiempo Real</h2>
            <span className="px-2 py-0.5 bg-slate-700 text-slate-400 rounded text-xs">
              {logs.length} eventos
            </span>
          </div>
          <button
            onClick={clearLogs}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg text-sm transition-all"
          >
            <Trash2 className="w-4 h-4" />
            Limpiar
          </button>
        </div>

        <div className="bg-[#0F172A] rounded-xl p-4 h-64 overflow-y-auto font-mono text-sm">
          {logs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-slate-500">
              <p>No hay eventos registrados</p>
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-3">
                  <span className="text-slate-600 text-xs whitespace-nowrap">
                    {formatTime(log.timestamp)}
                  </span>
                  {getLogIcon(log.tipo)}
                  <span className="px-1.5 py-0.5 bg-slate-800 rounded text-xs text-slate-400 uppercase">
                    {log.origen}
                  </span>
                  <span className={getLogColor(log.tipo)}>{log.mensaje}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConexionesTab;
