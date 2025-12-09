import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  Lock,
  Unlock,
  Upload,
  FileSpreadsheet,
  FileText,
  Video,
  Music,
  Eye,
  Trash2,
  RefreshCw,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  X,
  LogOut,
  BarChart3,
  Loader2,
  Calendar,
  Download,
  Plug,
  Zap,
  MessageSquare,
  ShoppingCart,
  Play,
  Copy,
  Check,
  Terminal,
  Link,
  Wifi,
  WifiOff,
  Clock,
  Settings,
  Target,
  Brain,
  Activity,
  MessageCircle,
  Package,
  Phone,
  PauseCircle,
} from 'lucide-react';
import { DateFilter, FiltroFecha, calcularRangoFecha } from '../ui/DateFilter';

// ============================================
// TIPOS E INTERFACES
// ============================================
interface DocumentoCargado {
  id: string;
  nombre: string;
  tipo: string;
  fecha_carga: string;
  estado: string;
  tiene_analisis_financiero: boolean;
  datos?: any[];
}

interface ReporteFinanciero {
  fecha_analisis: string;
  archivo: string;
  resumen: {
    total_facturado: number;
    ganancia_bruta: number;
    margen_bruto: number;
    total_fletes: number;
    total_devoluciones: number;
    tasa_entrega: number;
    entregados: number;
    no_entregados: number;
  };
  metricas: {
    ticket_promedio: number;
    ganancia_por_pedido: number;
    costo_por_pedido: number;
  };
  perdidas: {
    pedidos_no_entregados: number;
    ganancia_perdida_estimada: number;
    costo_devoluciones: number;
  };
  por_transportadora: Array<{
    nombre: string;
    pedidos: number;
    entregados: number;
    tasa: number;
    rentable: boolean;
  }>;
  analisis_ia?: string;
  alertas: Array<{
    tipo: string;
    mensaje: string;
    accion: string;
  }>;
  recomendaciones: {
    inmediatas: string[];
    politicas: string[];
    metas: Record<string, { actual: number; meta: number }>;
  };
}

interface ConnectionState {
  values: Record<string, string>;
  status: 'idle' | 'testing' | 'connected' | 'error';
  lastTested?: string;
}

interface LogEntry {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'error';
  source: string;
  message: string;
}

interface ProcessStatus {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'error';
}

// ============================================
// CONSTANTES
// ============================================
const STORAGE_KEY_CONEXIONES = 'litper_conexiones_config';
const STORAGE_KEY_LOGS = 'litper_conexiones_logs';
const STORAGE_KEY_DOCS = 'litper_admin_docs';
const STORAGE_KEY_SHARED_DATA = 'litper_shared_shipment_data';

const COLORS = {
  primary: '#F97316',
  background: '#0F172A',
  cards: '#1E293B',
  connected: '#10B981',
  disconnected: '#EF4444',
};

const CONNECTIONS_CONFIG = [
  {
    id: 'n8n',
    name: 'N8N',
    icon: Zap,
    description: 'Automatización de flujos',
    fields: [
      { key: 'webhookUrl', label: 'URL Webhook', type: 'url', placeholder: 'https://n8n.ejemplo.com/webhook/...', required: true }
    ],
    defaultUrl: 'https://n8n.srv1103164.hstgr.cloud/prueba-de-webhook/240bf3b5-7689-4997-8001-0f1183eb79e9'
  },
  {
    id: 'chatea-pro',
    name: 'Chatea Pro',
    icon: MessageSquare,
    description: 'WhatsApp Business',
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'password', placeholder: '••••••••', required: true },
      { key: 'webhookUrl', label: 'Webhook URL', type: 'url', placeholder: 'https://api.chateapro.com/...', required: true }
    ]
  },
  {
    id: 'dropi',
    name: 'Dropi',
    icon: ShoppingCart,
    description: 'Dropshipping',
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'password', placeholder: '••••••••', required: true },
      { key: 'storeId', label: 'Store ID', type: 'text', placeholder: 'Tu ID de tienda', required: true }
    ]
  }
];

const APP_WEBHOOKS = [
  { id: 'orden-nueva', name: 'Orden Nueva', url: '/api/webhook/orden-nueva', description: 'Nueva orden creada' },
  { id: 'estado-guia', name: 'Estado Guía', url: '/api/webhook/estado-guia', description: 'Cambio de estado' },
  { id: 'novedad', name: 'Novedad', url: '/api/webhook/novedad', description: 'Nueva novedad' },
  { id: 'chat-entrante', name: 'Chat Entrante', url: '/api/webhook/chat-entrante', description: 'Mensaje recibido' }
];

const INITIAL_PROCESSES: ProcessStatus[] = [
  { id: 'chat-vivo', name: 'Chat en Vivo', status: 'active' },
  { id: 'generacion-pedidos', name: 'Generación Pedidos', status: 'active' },
  { id: 'seguimiento-guias', name: 'Seguimiento Guías', status: 'active' },
  { id: 'novedades', name: 'Novedades', status: 'active' },
  { id: 'reclamo-oficina', name: 'Reclamo Oficina', status: 'active' },
  { id: 'llamadas-ia', name: 'Llamadas IA', status: 'paused' }
];

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export const AdminPanel: React.FC = () => {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [token, setToken] = useState<string | null>(null);

  // Tab state
  const [activeTab, setActiveTab] = useState<'upload' | 'documents' | 'financial' | 'conexiones' | 'predicciones'>('upload');
  const [filtroFecha, setFiltroFecha] = useState<FiltroFecha>('todo');

  // Documents state
  const [documentos, setDocumentos] = useState<DocumentoCargado[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [reporteFinanciero, setReporteFinanciero] = useState<ReporteFinanciero | null>(null);
  const [isLoadingReporte, setIsLoadingReporte] = useState(false);

  // Conexiones state
  const [connections, setConnections] = useState<Record<string, ConnectionState>>({});
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [copiedWebhook, setCopiedWebhook] = useState<string | null>(null);
  const [processes, setProcesses] = useState<ProcessStatus[]>(INITIAL_PROCESSES);

  // ============================================
  // INICIALIZACIÓN
  // ============================================
  useEffect(() => {
    const savedToken = localStorage.getItem('admin_token');
    if (savedToken) {
      setToken(savedToken);
      setIsAuthenticated(true);
    }

    // Cargar conexiones guardadas
    const savedConnections = localStorage.getItem(STORAGE_KEY_CONEXIONES);
    if (savedConnections) {
      try {
        setConnections(JSON.parse(savedConnections));
      } catch {
        initializeConnections();
      }
    } else {
      initializeConnections();
    }

    // Cargar logs
    const savedLogs = localStorage.getItem(STORAGE_KEY_LOGS);
    if (savedLogs) {
      try {
        setLogs(JSON.parse(savedLogs));
      } catch {
        setLogs([]);
      }
    }

    // Cargar documentos guardados
    const savedDocs = localStorage.getItem(STORAGE_KEY_DOCS);
    if (savedDocs) {
      try {
        setDocumentos(JSON.parse(savedDocs));
      } catch {
        setDocumentos([]);
      }
    }
  }, []);

  // Guardar conexiones
  useEffect(() => {
    if (Object.keys(connections).length > 0) {
      localStorage.setItem(STORAGE_KEY_CONEXIONES, JSON.stringify(connections));
    }
  }, [connections]);

  // Guardar logs
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logs.slice(0, 100)));
  }, [logs]);

  // Guardar documentos
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_DOCS, JSON.stringify(documentos));
  }, [documentos]);

  const initializeConnections = () => {
    const initial: Record<string, ConnectionState> = {};
    CONNECTIONS_CONFIG.forEach(conn => {
      const values: Record<string, string> = {};
      conn.fields.forEach(field => {
        values[field.key] = '';
      });
      if (conn.id === 'n8n' && conn.defaultUrl) {
        values.webhookUrl = conn.defaultUrl;
      }
      initial[conn.id] = { values, status: 'idle' };
    });
    setConnections(initial);
  };

  // ============================================
  // AUTH HANDLERS
  // ============================================
  const handleLogin = async () => {
    setError('');
    // Validación local
    if (password === 'Sacrije2020?08') {
      const localToken = 'local_admin_' + Date.now();
      setToken(localToken);
      setIsAuthenticated(true);
      localStorage.setItem('admin_token', localToken);
      setPassword('');
      addLog('success', 'sistema', 'Sesión iniciada correctamente');
    } else {
      setError('Contraseña incorrecta');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setToken(null);
    localStorage.removeItem('admin_token');
    addLog('info', 'sistema', 'Sesión cerrada');
  };

  // ============================================
  // LOGS
  // ============================================
  const addLog = useCallback((type: LogEntry['type'], source: string, message: string) => {
    const newLog: LogEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      type,
      source,
      message
    };
    setLogs(prev => [newLog, ...prev].slice(0, 100));
  }, []);

  // ============================================
  // CONEXIONES HANDLERS
  // ============================================
  const testConnection = async (connectionId: string) => {
    const connection = connections[connectionId];
    const config = CONNECTIONS_CONFIG.find(c => c.id === connectionId);

    if (!config || !connection) return;

    setConnections(prev => ({
      ...prev,
      [connectionId]: { ...prev[connectionId], status: 'testing' }
    }));

    addLog('info', connectionId, `Probando conexión con ${config.name}...`);

    try {
      const testUrl = connection.values.webhookUrl || '';

      await fetch(testUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true, source: 'litper', timestamp: new Date().toISOString() }),
        mode: 'no-cors'
      });

      setConnections(prev => ({
        ...prev,
        [connectionId]: {
          ...prev[connectionId],
          status: 'connected',
          lastTested: new Date().toISOString()
        }
      }));

      addLog('success', connectionId, `Conexión exitosa con ${config.name}`);
    } catch (error) {
      setConnections(prev => ({
        ...prev,
        [connectionId]: {
          ...prev[connectionId],
          status: 'error',
          lastTested: new Date().toISOString()
        }
      }));

      addLog('error', connectionId, `Error al conectar con ${config.name}`);
    }
  };

  const updateConnectionField = (connectionId: string, fieldKey: string, value: string) => {
    setConnections(prev => ({
      ...prev,
      [connectionId]: {
        ...prev[connectionId],
        values: { ...prev[connectionId].values, [fieldKey]: value },
        status: 'idle'
      }
    }));
  };

  const copyWebhook = async (webhook: typeof APP_WEBHOOKS[0]) => {
    const fullUrl = `${window.location.origin}${webhook.url}`;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopiedWebhook(webhook.id);
      addLog('info', 'sistema', `URL copiada: ${webhook.name}`);
      setTimeout(() => setCopiedWebhook(null), 2000);
    } catch {
      addLog('error', 'sistema', 'Error al copiar URL');
    }
  };

  // ============================================
  // UPLOAD HANDLERS
  // ============================================
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const newDoc: DocumentoCargado = {
        id: Date.now().toString(),
        nombre: file.name,
        tipo: file.name.endsWith('.xlsx') || file.name.endsWith('.xls') ? 'excel' : 'documento',
        fecha_carga: new Date().toISOString(),
        estado: 'completado',
        tiene_analisis_financiero: file.name.toLowerCase().includes('dropi') || file.name.toLowerCase().includes('financiero')
      };

      setDocumentos(prev => [newDoc, ...prev]);
      addLog('success', 'sistema', `Archivo cargado: ${file.name}`);

      // Guardar datos compartidos para sincronización con Seguimiento
      const sharedData = JSON.parse(localStorage.getItem(STORAGE_KEY_SHARED_DATA) || '[]');
      sharedData.push({
        id: newDoc.id,
        nombre: file.name,
        fecha: new Date().toISOString(),
        source: 'admin'
      });
      localStorage.setItem(STORAGE_KEY_SHARED_DATA, JSON.stringify(sharedData));

    } catch (err: any) {
      addLog('error', 'sistema', `Error al cargar: ${err.message}`);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatTimestamp = (iso: string) => {
    return new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  // ============================================
  // RENDER LOGIN
  // ============================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: COLORS.background }}>
        <div className="w-full max-w-md">
          <div className="rounded-2xl shadow-xl p-8 border border-slate-700" style={{ backgroundColor: COLORS.cards }}>
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center shadow-lg" style={{ backgroundColor: COLORS.primary }}>
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">Modo Administrador</h1>
              <p className="text-sm text-slate-400 mt-2">Acceso restringido</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Contraseña</label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                    placeholder="Ingresa la contraseña"
                    className="w-full px-4 py-3 pl-11 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2"
                    style={{ backgroundColor: COLORS.background, borderColor: '#334155' }}
                  />
                  <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-400 bg-red-900/20 px-4 py-3 rounded-lg">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <button
                onClick={handleLogin}
                className="w-full py-3 text-white font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 hover:opacity-90"
                style={{ backgroundColor: COLORS.primary }}
              >
                <Unlock className="w-5 h-5" />
                Ingresar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER PANEL
  // ============================================
  return (
    <div className="min-h-screen p-4 lg:p-8" style={{ backgroundColor: COLORS.background }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" style={{ backgroundColor: COLORS.primary }}>
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Modo Administrador</h1>
              <p className="text-sm text-slate-400">Gestión avanzada del sistema</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-slate-300 hover:text-white"
            style={{ backgroundColor: COLORS.cards }}
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: 'upload', icon: Upload, label: 'Cargar Documentos' },
            { id: 'documents', icon: FileText, label: `Documentos (${documentos.length})` },
            { id: 'financial', icon: DollarSign, label: 'Análisis Financiero' },
            { id: 'conexiones', icon: Plug, label: 'Conexiones' },
            { id: 'predicciones', icon: Target, label: 'Predicciones IA' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'text-white shadow-lg'
                  : 'text-slate-300 hover:text-white'
              }`}
              style={{
                backgroundColor: activeTab === tab.id ? COLORS.primary : COLORS.cards
              }}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="rounded-2xl shadow-xl border border-slate-700 overflow-hidden" style={{ backgroundColor: COLORS.cards }}>

          {/* ============================================ */}
          {/* TAB: UPLOAD */}
          {/* ============================================ */}
          {activeTab === 'upload' && (
            <div className="p-8">
              <div className="max-w-xl mx-auto">
                <div className="border-2 border-dashed border-slate-600 rounded-2xl p-8 text-center hover:border-orange-500 transition-colors cursor-pointer group">
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv,.docx,.pdf,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="admin-file-upload"
                    disabled={isUploading}
                  />
                  <label htmlFor="admin-file-upload" className="cursor-pointer">
                    {isUploading ? (
                      <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin" style={{ color: COLORS.primary }} />
                    ) : (
                      <Upload className="w-12 h-12 mx-auto mb-4 text-slate-400 group-hover:text-orange-500 transition-colors" />
                    )}
                    <p className="text-lg font-medium text-white mb-2">
                      {isUploading ? 'Procesando...' : 'Arrastra archivos o haz clic'}
                    </p>
                    <p className="text-sm text-slate-400">
                      Excel, CSV, PDF, Word, TXT
                    </p>
                  </label>
                </div>

                <div className="mt-6 p-4 rounded-xl" style={{ backgroundColor: COLORS.background }}>
                  <p className="text-sm text-slate-400 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Los datos se sincronizarán automáticamente con la pestaña de Seguimiento
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ============================================ */}
          {/* TAB: DOCUMENTS */}
          {/* ============================================ */}
          {activeTab === 'documents' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white">Documentos Cargados</h3>
                <button
                  onClick={() => setDocumentos([])}
                  className="flex items-center gap-1 px-3 py-1 rounded-lg text-sm text-slate-400 hover:text-white transition-colors"
                  style={{ backgroundColor: COLORS.background }}
                >
                  <Trash2 className="w-4 h-4" />
                  Limpiar todo
                </button>
              </div>

              {documentos.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 mx-auto text-slate-600 mb-4" />
                  <p className="text-slate-400">No hay documentos cargados</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {documentos.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 rounded-lg"
                      style={{ backgroundColor: COLORS.background }}
                    >
                      <div className="flex items-center gap-3">
                        <FileSpreadsheet className="w-5 h-5" style={{ color: COLORS.primary }} />
                        <div>
                          <p className="font-medium text-white">{doc.nombre}</p>
                          <p className="text-xs text-slate-400">
                            {new Date(doc.fecha_carga).toLocaleDateString('es-CO')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 rounded text-xs font-medium bg-green-900/30 text-green-400">
                          {doc.estado}
                        </span>
                        <button
                          onClick={() => setDocumentos(prev => prev.filter(d => d.id !== doc.id))}
                          className="p-1.5 rounded hover:bg-red-900/30 text-slate-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ============================================ */}
          {/* TAB: FINANCIAL */}
          {/* ============================================ */}
          {activeTab === 'financial' && (
            <div className="p-6">
              <div className="text-center py-12">
                <DollarSign className="w-12 h-12 mx-auto text-slate-600 mb-4" />
                <p className="text-slate-400 mb-4">
                  Sube un archivo Excel de Dropi para generar el análisis financiero
                </p>
                <button
                  onClick={() => setActiveTab('upload')}
                  className="px-4 py-2 text-white rounded-lg font-medium"
                  style={{ backgroundColor: COLORS.primary }}
                >
                  Cargar Archivo
                </button>
              </div>
            </div>
          )}

          {/* ============================================ */}
          {/* TAB: CONEXIONES */}
          {/* ============================================ */}
          {activeTab === 'conexiones' && (
            <div className="p-6 space-y-6">
              {/* Cards de Conexión */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {CONNECTIONS_CONFIG.map((config) => {
                  const state = connections[config.id] || { values: {}, status: 'idle' };
                  const IconComp = config.icon;

                  return (
                    <div
                      key={config.id}
                      className="rounded-xl p-5 border-2 transition-all"
                      style={{
                        backgroundColor: COLORS.background,
                        borderColor: state.status === 'connected' ? COLORS.connected :
                                    state.status === 'error' ? COLORS.disconnected : '#334155'
                      }}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg text-white" style={{ backgroundColor: COLORS.primary }}>
                            <IconComp className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-white">{config.name}</h4>
                            <p className="text-xs text-slate-400">{config.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div
                            className={`w-2.5 h-2.5 rounded-full ${state.status === 'connected' ? 'animate-pulse' : ''}`}
                            style={{
                              backgroundColor: state.status === 'connected' ? COLORS.connected :
                                              state.status === 'error' ? COLORS.disconnected :
                                              state.status === 'testing' ? COLORS.primary : '#64748b'
                            }}
                          />
                          <span className="text-xs text-slate-400">
                            {state.status === 'connected' ? 'Conectado' :
                             state.status === 'error' ? 'Error' :
                             state.status === 'testing' ? 'Probando...' : 'Sin probar'}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {config.fields.map(field => (
                          <div key={field.key}>
                            <label className="block text-xs font-medium text-slate-400 mb-1">{field.label}</label>
                            <input
                              type={field.type}
                              value={state.values[field.key] || ''}
                              onChange={(e) => updateConnectionField(config.id, field.key, e.target.value)}
                              placeholder={field.placeholder}
                              className="w-full px-3 py-2 rounded-lg border text-white placeholder-slate-500 text-sm"
                              style={{ backgroundColor: COLORS.cards, borderColor: '#334155' }}
                            />
                          </div>
                        ))}

                        <button
                          onClick={() => testConnection(config.id)}
                          disabled={state.status === 'testing'}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-white text-sm disabled:opacity-50"
                          style={{ backgroundColor: COLORS.primary }}
                        >
                          {state.status === 'testing' ? (
                            <><RefreshCw className="w-4 h-4 animate-spin" /> Probando...</>
                          ) : (
                            <><Play className="w-4 h-4" /> Probar</>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Webhooks + Logs */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Webhooks */}
                <div className="rounded-xl p-5 border border-slate-700" style={{ backgroundColor: COLORS.background }}>
                  <div className="flex items-center gap-2 mb-4">
                    <Link className="w-5 h-5" style={{ color: COLORS.primary }} />
                    <h4 className="font-semibold text-white">Webhooks de Mi App</h4>
                  </div>
                  <div className="space-y-2">
                    {APP_WEBHOOKS.map(webhook => (
                      <div key={webhook.id} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: COLORS.cards }}>
                        <div>
                          <p className="text-sm font-medium text-white">{webhook.name}</p>
                          <code className="text-xs" style={{ color: COLORS.primary }}>{webhook.url}</code>
                        </div>
                        <button
                          onClick={() => copyWebhook(webhook)}
                          className="px-3 py-1.5 rounded text-xs font-medium text-white"
                          style={{ backgroundColor: copiedWebhook === webhook.id ? COLORS.connected : COLORS.primary }}
                        >
                          {copiedWebhook === webhook.id ? <><Check className="w-3 h-3 inline mr-1" />Copiado</> : <><Copy className="w-3 h-3 inline mr-1" />Copiar</>}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Logs */}
                <div className="rounded-xl p-5 border border-slate-700" style={{ backgroundColor: COLORS.background }}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-5 h-5" style={{ color: COLORS.primary }} />
                      <h4 className="font-semibold text-white">Logs</h4>
                    </div>
                    <button
                      onClick={() => setLogs([])}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Limpiar
                    </button>
                  </div>
                  <div className="h-48 overflow-y-auto space-y-1 font-mono text-xs" style={{ backgroundColor: COLORS.cards, padding: '8px', borderRadius: '8px' }}>
                    {logs.length === 0 ? (
                      <p className="text-slate-500 text-center py-4">Sin logs</p>
                    ) : (
                      logs.map(log => (
                        <div key={log.id} className="flex items-start gap-2 py-1">
                          <span className="text-slate-500">{formatTimestamp(log.timestamp)}</span>
                          <span
                            className="px-1 rounded"
                            style={{
                              backgroundColor: log.type === 'success' ? '#10B98120' :
                                              log.type === 'error' ? '#EF444420' : '#3B82F620',
                              color: log.type === 'success' ? COLORS.connected :
                                    log.type === 'error' ? COLORS.disconnected : '#3B82F6'
                            }}
                          >
                            {log.source}
                          </span>
                          <span className={log.type === 'error' ? 'text-red-400' : log.type === 'success' ? 'text-green-400' : 'text-blue-400'}>
                            {log.message}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Procesos Activos */}
              <div className="rounded-xl p-5 border border-slate-700" style={{ backgroundColor: COLORS.background }}>
                <div className="flex items-center gap-2 mb-4">
                  <Settings className="w-5 h-5" style={{ color: COLORS.primary }} />
                  <h4 className="font-semibold text-white">Procesos Activos</h4>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {processes.map(process => (
                    <div key={process.id} className="p-3 rounded-lg text-center" style={{ backgroundColor: COLORS.cards }}>
                      <p className="text-sm font-medium text-white mb-1">{process.name}</p>
                      <div className="flex items-center justify-center gap-1">
                        {process.status === 'active' ? (
                          <><CheckCircle className="w-4 h-4" style={{ color: COLORS.connected }} /><span className="text-xs" style={{ color: COLORS.connected }}>Activo</span></>
                        ) : (
                          <><PauseCircle className="w-4 h-4 text-amber-500" /><span className="text-xs text-amber-500">Pausado</span></>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ============================================ */}
          {/* TAB: PREDICCIONES */}
          {/* ============================================ */}
          {activeTab === 'predicciones' && (
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Análisis de Riesgo */}
                <div className="rounded-xl p-5 border border-slate-700" style={{ backgroundColor: COLORS.background }}>
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    <h4 className="font-semibold text-white">Análisis de Riesgo</h4>
                  </div>
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-red-900/20 border border-red-800">
                      <p className="text-sm font-medium text-red-400">Guías en Riesgo Alto</p>
                      <p className="text-2xl font-bold text-red-400">0</p>
                      <p className="text-xs text-red-400/70">Sin movimiento > 5 días</p>
                    </div>
                    <div className="p-3 rounded-lg bg-amber-900/20 border border-amber-800">
                      <p className="text-sm font-medium text-amber-400">Requieren Atención</p>
                      <p className="text-2xl font-bold text-amber-400">0</p>
                      <p className="text-xs text-amber-400/70">Sin movimiento 3-5 días</p>
                    </div>
                    <div className="p-3 rounded-lg bg-green-900/20 border border-green-800">
                      <p className="text-sm font-medium text-green-400">En Buen Estado</p>
                      <p className="text-2xl font-bold text-green-400">0</p>
                      <p className="text-xs text-green-400/70">Movimiento reciente</p>
                    </div>
                  </div>
                </div>

                {/* Recomendaciones IA */}
                <div className="rounded-xl p-5 border border-slate-700" style={{ backgroundColor: COLORS.background }}>
                  <div className="flex items-center gap-2 mb-4">
                    <Brain className="w-5 h-5" style={{ color: COLORS.primary }} />
                    <h4 className="font-semibold text-white">Recomendaciones IA</h4>
                  </div>
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg" style={{ backgroundColor: COLORS.cards }}>
                      <p className="text-sm text-white">Carga datos en Seguimiento para recibir recomendaciones personalizadas basadas en IA.</p>
                    </div>
                    <div className="p-3 rounded-lg border border-dashed border-slate-600">
                      <p className="text-sm text-slate-400 text-center">
                        Las predicciones se generarán automáticamente cuando cargues guías
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tendencias */}
                <div className="lg:col-span-2 rounded-xl p-5 border border-slate-700" style={{ backgroundColor: COLORS.background }}>
                  <div className="flex items-center gap-2 mb-4">
                    <Activity className="w-5 h-5" style={{ color: COLORS.primary }} />
                    <h4 className="font-semibold text-white">Tendencias y Patrones</h4>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-lg text-center" style={{ backgroundColor: COLORS.cards }}>
                      <TrendingUp className="w-6 h-6 mx-auto mb-2 text-green-400" />
                      <p className="text-xs text-slate-400">Tasa de Entrega</p>
                      <p className="text-xl font-bold text-white">--</p>
                    </div>
                    <div className="p-4 rounded-lg text-center" style={{ backgroundColor: COLORS.cards }}>
                      <Clock className="w-6 h-6 mx-auto mb-2 text-blue-400" />
                      <p className="text-xs text-slate-400">Tiempo Promedio</p>
                      <p className="text-xl font-bold text-white">-- días</p>
                    </div>
                    <div className="p-4 rounded-lg text-center" style={{ backgroundColor: COLORS.cards }}>
                      <Package className="w-6 h-6 mx-auto mb-2 text-purple-400" />
                      <p className="text-xs text-slate-400">Total Guías</p>
                      <p className="text-xl font-bold text-white">0</p>
                    </div>
                    <div className="p-4 rounded-lg text-center" style={{ backgroundColor: COLORS.cards }}>
                      <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-amber-400" />
                      <p className="text-xs text-slate-400">Con Novedad</p>
                      <p className="text-xl font-bold text-white">0</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
