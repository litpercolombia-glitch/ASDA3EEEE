// ============================================
// LITPER PRO - ADMIN PANEL PRO
// Panel de administración profesional con IA
// ============================================

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Target,
  Brain,
  Truck,
  MapPin,
  Package,
  Search,
  Clock,
  Zap,
  Activity,
  Database,
  FileUp,
  ChevronDown,
  ChevronUp,
  Info,
  Sparkles,
  Link,
  Globe,
  BookOpen,
  Save,
  FolderOpen,
  Lightbulb,
  Star,
  ArrowRight,
  PieChart,
  ExternalLink,
  Copy,
  Check,
  Settings,
  Bell,
  History,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { DateFilter, FiltroFecha, calcularRangoFecha } from '../ui/DateFilter';
import { ConexionesTab } from '../tabs/ConexionesTab';
import { SessionManager } from '../ui/SessionManager';
import { DocumentAnalysisPanel } from '../ui/DocumentAnalysisPanel';
import { documentProcessor, ProcessedDocument, SessionData } from '../../services/documentProcessingService';
import { Shipment, ShipmentStatus, CarrierName } from '../../types';
import { SemaforoExcelData, CiudadSemaforo, STORAGE_KEYS } from '../../types/logistics';
import { saveTabData, loadTabData } from '../../utils/tabStorage';

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
  processedDoc?: ProcessedDocument;
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

// ============================================
// COLORES LITPER PRO
// ============================================

const COLORS = {
  primary: '#F97316',
  secondary: '#6366F1',
  background: '#0F172A',
  cards: '#1E293B',
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export const AdminPanelPro: React.FC = () => {
  // Estados de autenticación
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [token, setToken] = useState<string | null>(null);

  // Estados de UI
  const [filtroFecha, setFiltroFecha] = useState<FiltroFecha>('todo');
  const [activeTab, setActiveTab] = useState<'procesamiento' | 'documentos' | 'financial' | 'conocimiento' | 'integraciones' | 'predicciones' | 'info-logistica'>('procesamiento');

  // Estados de documentos
  const [documentos, setDocumentos] = useState<DocumentoCargado[]>([]);
  const [processedDocs, setProcessedDocs] = useState<ProcessedDocument[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentProcessingDoc, setCurrentProcessingDoc] = useState<ProcessedDocument | null>(null);

  // Estados de URL
  const [urlInput, setUrlInput] = useState('');
  const [isProcessingUrl, setIsProcessingUrl] = useState(false);

  // Estados financieros
  const [reporteFinanciero, setReporteFinanciero] = useState<ReporteFinanciero | null>(null);
  const [isLoadingReporte, setIsLoadingReporte] = useState(false);

  // Base de conocimiento
  const [knowledgeEntries, setKnowledgeEntries] = useState<any[]>([]);

  // Notificaciones
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Info Logística
  const [logisticsData, setLogisticsData] = useState<CiudadSemaforo[]>([]);
  const [selectedLogisticItem, setSelectedLogisticItem] = useState<CiudadSemaforo | null>(null);
  const [excelFiles, setExcelFiles] = useState<Array<{id: string, nombre: string, fecha: string, registros: number, tipo: string}>>([]);
  const [isLoadingLogistics, setIsLoadingLogistics] = useState(false);

  // ============================================
  // EFECTOS
  // ============================================

  // Verificar token guardado
  useEffect(() => {
    const savedToken = localStorage.getItem('admin_token');
    if (savedToken) {
      setToken(savedToken);
      setIsAuthenticated(true);
    }
  }, []);

  // Cargar documentos procesados
  useEffect(() => {
    if (isAuthenticated) {
      loadProcessedDocuments();
      loadKnowledge();
      loadLogisticsData();
    }
  }, [isAuthenticated]);

  // ============================================
  // FUNCIONES DE AUTENTICACIÓN
  // ============================================

  const handleLogin = () => {
    setError('');

    if (password === 'Sacrije2020?08') {
      const localToken = 'admin_pro_' + Date.now();
      setToken(localToken);
      setIsAuthenticated(true);
      localStorage.setItem('admin_token', localToken);
      setPassword('');
      showNotification('success', 'Bienvenido al Panel de Administración');
    } else {
      setError('Contraseña incorrecta');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setToken(null);
    localStorage.removeItem('admin_token');
    showNotification('info', 'Sesión cerrada');
  };

  // ============================================
  // FUNCIONES DE NOTIFICACIÓN
  // ============================================

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // ============================================
  // FUNCIONES DE DOCUMENTOS
  // ============================================

  const loadProcessedDocuments = () => {
    const docs = documentProcessor.getProcessedDocuments();
    setProcessedDocs(docs);

    // Convertir a formato de lista
    const docList: DocumentoCargado[] = docs.map(d => ({
      id: d.id,
      nombre: d.fileName,
      tipo: d.fileType,
      fecha_carga: new Date(d.processedAt).toISOString(),
      estado: d.status,
      tiene_analisis_financiero: !!d.financialMetrics,
      processedDoc: d,
    }));
    setDocumentos(docList);
  };

  const loadKnowledge = () => {
    const knowledge = documentProcessor.getKnowledge();
    setKnowledgeEntries(knowledge);
  };

  // Cargar datos logísticos desde localStorage
  const loadLogisticsData = () => {
    setIsLoadingLogistics(true);
    try {
      // Cargar datos del semáforo
      const savedSemaforo = localStorage.getItem(STORAGE_KEYS.SEMAFORO);
      if (savedSemaforo) {
        const parsed = JSON.parse(savedSemaforo);
        if (parsed.ciudadesSemaforo) {
          setLogisticsData(parsed.ciudadesSemaforo);
        }
      }

      // Cargar archivos Excel procesados
      const files: Array<{id: string, nombre: string, fecha: string, registros: number, tipo: string}> = [];

      // Buscar documentos tipo Excel
      const docs = documentProcessor.getProcessedDocuments();
      docs.filter(d => d.fileType === 'excel').forEach(doc => {
        files.push({
          id: doc.id,
          nombre: doc.fileName,
          fecha: new Date(doc.processedAt).toLocaleDateString('es-CO'),
          registros: doc.rowCount || 0,
          tipo: 'Excel'
        });
      });

      // Agregar datos del semáforo si existen
      if (savedSemaforo) {
        const parsed = JSON.parse(savedSemaforo);
        if (parsed.excelFileName) {
          const existingFile = files.find(f => f.nombre === parsed.excelFileName);
          if (!existingFile) {
            files.unshift({
              id: 'semaforo-excel',
              nombre: parsed.excelFileName || 'Datos Semáforo',
              fecha: parsed.lastUpdate ? new Date(parsed.lastUpdate).toLocaleDateString('es-CO') : 'N/A',
              registros: parsed.ciudadesSemaforo?.length || 0,
              tipo: 'Semáforo'
            });
          }
        }
      }

      setExcelFiles(files);
    } catch (err) {
      console.error('Error cargando datos logísticos:', err);
    } finally {
      setIsLoadingLogistics(false);
    }
  };

  // Procesar archivo Excel
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    showNotification('info', 'Procesando archivo...');

    try {
      const reader = new FileReader();

      reader.onload = async (event) => {
        try {
          const data = event.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });

          // Obtener datos de la primera hoja
          const firstSheet = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheet];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          // Procesar con IA
          const processedDoc = await documentProcessor.processExcel(jsonData, file.name);

          setCurrentProcessingDoc(processedDoc);
          loadProcessedDocuments();

          if (processedDoc.status === 'completed') {
            showNotification('success', 'Documento procesado exitosamente con análisis IA');
          } else {
            showNotification('error', processedDoc.error || 'Error en el procesamiento');
          }
        } catch (err: any) {
          showNotification('error', `Error procesando archivo: ${err.message}`);
        } finally {
          setIsProcessing(false);
        }
      };

      reader.readAsBinaryString(file);
    } catch (err: any) {
      showNotification('error', `Error: ${err.message}`);
      setIsProcessing(false);
    }

    e.target.value = '';
  };

  // Procesar URL
  const handleProcessUrl = async () => {
    if (!urlInput.trim()) return;

    setIsProcessingUrl(true);
    showNotification('info', 'Analizando URL...');

    try {
      const processedDoc = await documentProcessor.processUrl(urlInput);

      setCurrentProcessingDoc(processedDoc);
      loadProcessedDocuments();

      if (processedDoc.status === 'completed') {
        showNotification('success', 'URL procesada exitosamente');
      } else {
        showNotification('error', processedDoc.error || 'Error procesando URL');
      }

      setUrlInput('');
    } catch (err: any) {
      showNotification('error', `Error: ${err.message}`);
    } finally {
      setIsProcessingUrl(false);
    }
  };

  // Eliminar documento
  const handleDeleteDocument = (id: string) => {
    if (confirm('¿Eliminar este documento?')) {
      documentProcessor.deleteProcessedDocument(id);
      loadProcessedDocuments();
      showNotification('info', 'Documento eliminado');
    }
  };

  // Guardar en conocimiento
  const handleSaveToKnowledge = (doc: ProcessedDocument) => {
    if (!doc.aiAnalysis) return;

    documentProcessor.addToKnowledge({
      type: 'info',
      title: doc.fileName,
      content: doc.rawContent.substring(0, 5000),
      summary: doc.aiAnalysis.summary,
      tags: [...doc.aiAnalysis.entities.cities, ...doc.aiAnalysis.entities.carriers],
      source: doc.fileName,
      priority: 'media',
    });

    loadKnowledge();
    showNotification('success', 'Guardado en base de conocimiento');
  };

  // ============================================
  // FUNCIONES DE FORMATO
  // ============================================

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getTypeIcon = (tipo: string) => {
    switch (tipo.toLowerCase()) {
      case 'excel':
        return <FileSpreadsheet className="w-5 h-5 text-emerald-500" />;
      case 'pdf':
      case 'docx':
      case 'txt':
        return <FileText className="w-5 h-5 text-blue-500" />;
      case 'url':
        return <Globe className="w-5 h-5 text-purple-500" />;
      case 'video':
        return <Video className="w-5 h-5 text-red-500" />;
      case 'audio':
        return <Music className="w-5 h-5 text-pink-500" />;
      default:
        return <FileText className="w-5 h-5 text-slate-500" />;
    }
  };

  // ============================================
  // PANTALLA DE LOGIN
  // ============================================

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-navy-950 to-slate-900 flex items-center justify-center p-4">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 w-full max-w-md">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/10">
            {/* Logo */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-orange-400 via-orange-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-xl shadow-orange-500/30 transform rotate-3">
                <Shield className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl font-black text-white mb-2">
                LITPER <span className="text-orange-400">PRO</span>
              </h1>
              <p className="text-slate-400">Panel de Administración</p>
            </div>

            {/* Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Contraseña de Acceso
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                    placeholder="••••••••••••"
                    className="w-full px-4 py-4 pl-12 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  />
                  <Lock className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <button
                onClick={handleLogin}
                className="w-full py-4 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-bold rounded-xl transition-all shadow-xl shadow-orange-500/30 flex items-center justify-center gap-2 transform hover:scale-[1.02]"
              >
                <Unlock className="w-5 h-5" />
                Acceder al Sistema
              </button>
            </div>

            <p className="text-center text-xs text-slate-500 mt-6">
              Acceso exclusivo para administradores
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // PANEL PRINCIPAL
  // ============================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 dark:from-navy-950 dark:via-slate-900 dark:to-navy-950">
      {/* Notificación */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-xl shadow-xl flex items-center gap-3 animate-slide-in-right ${notification.type === 'success' ? 'bg-emerald-500 text-white' :
            notification.type === 'error' ? 'bg-red-500 text-white' :
              'bg-blue-500 text-white'
          }`}>
          {notification.type === 'success' && <CheckCircle className="w-5 h-5" />}
          {notification.type === 'error' && <AlertTriangle className="w-5 h-5" />}
          {notification.type === 'info' && <Info className="w-5 h-5" />}
          <span className="font-medium">{notification.message}</span>
          <button onClick={() => setNotification(null)} className="ml-2">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto p-4 lg:p-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-orange-400 to-pink-500 rounded-2xl shadow-xl shadow-orange-500/30">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-black text-slate-800 dark:text-white">
                  LITPER <span className="text-orange-500">PRO</span>
                </h1>
                <span className="px-2 py-0.5 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs font-bold rounded-full">
                  ADMIN
                </span>
              </div>
              <p className="text-slate-500 dark:text-slate-400">
                Centro de Control Inteligente
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Session Manager */}
            <SessionManager
              tabId="admin"
              tabName="Panel Admin"
              currentData={{ documentos: processedDocs, knowledge: knowledgeEntries }}
              onRestore={(data) => {
                if (data.documentos) setProcessedDocs(data.documentos);
                if (data.knowledge) setKnowledgeEntries(data.knowledge);
              }}
              compact
            />

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-navy-800 hover:bg-slate-300 dark:hover:bg-navy-700 text-slate-700 dark:text-slate-300 rounded-xl transition-all"
            >
              <LogOut className="w-4 h-4" />
              Salir
            </button>
          </div>
        </div>

        {/* Filtro de fecha */}
        <div className="mb-6">
          <DateFilter
            value={filtroFecha}
            onChange={setFiltroFecha}
            showCount
            count={documentos.length}
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: 'procesamiento', label: 'Procesamiento IA', icon: Brain, color: 'purple' },
            { id: 'documentos', label: 'Documentos', icon: FileText, color: 'blue', badge: documentos.length },
            { id: 'financial', label: 'Análisis Financiero', icon: DollarSign, color: 'emerald' },
            { id: 'conocimiento', label: 'Base de Conocimiento', icon: BookOpen, color: 'amber', badge: knowledgeEntries.length },
            { id: 'predicciones', label: 'Predicciones ML', icon: Activity, color: 'pink' },
            { id: 'integraciones', label: 'Integraciones', icon: Plug, color: 'orange' },
            { id: 'info-logistica', label: 'Info Logística', icon: Truck, color: 'cyan', badge: logisticsData.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium whitespace-nowrap transition-all ${activeTab === tab.id
                  ? `bg-${tab.color}-500 text-white shadow-lg shadow-${tab.color}-500/30`
                  : 'bg-white dark:bg-navy-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-navy-700'
                }`}
              style={{
                backgroundColor: activeTab === tab.id ? COLORS[tab.color as keyof typeof COLORS] || COLORS.primary : undefined,
              }}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${activeTab === tab.id ? 'bg-white/20' : 'bg-slate-200 dark:bg-navy-700'
                  }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Contenido Principal */}
        <div className="bg-white dark:bg-navy-900 rounded-3xl shadow-xl border border-slate-200 dark:border-navy-700 overflow-hidden">

          {/* ============================================ */}
          {/* TAB: PROCESAMIENTO IA */}
          {/* ============================================ */}
          {activeTab === 'procesamiento' && (
            <div className="p-8">
              <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="text-center">
                  <div className="inline-flex p-4 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-2xl mb-4 shadow-xl shadow-purple-500/30">
                    <Brain className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                    Centro de Procesamiento IA
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400">
                    Carga documentos o URLs para análisis inteligente con resúmenes y recomendaciones
                  </p>
                </div>

                {/* Upload Zone */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Subir Archivo */}
                  <div className="relative">
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv,.docx,.pdf,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload-pro"
                      disabled={isProcessing}
                    />
                    <label
                      htmlFor="file-upload-pro"
                      className={`block p-8 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all ${isProcessing
                          ? 'border-purple-300 bg-purple-50 dark:bg-purple-900/20'
                          : 'border-slate-300 dark:border-navy-600 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20'
                        }`}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-12 h-12 mx-auto mb-4 text-purple-500 animate-spin" />
                          <p className="text-lg font-bold text-purple-700 dark:text-purple-300">
                            Procesando con IA...
                          </p>
                          <p className="text-sm text-purple-500 mt-1">
                            Analizando contenido y generando recomendaciones
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg">
                            <FileUp className="w-8 h-8 text-white" />
                          </div>
                          <p className="text-lg font-bold text-slate-700 dark:text-white mb-2">
                            Subir Archivo
                          </p>
                          <p className="text-sm text-slate-500">
                            Excel, CSV, PDF, Word, TXT
                          </p>
                        </>
                      )}
                    </label>
                  </div>

                  {/* Procesar URL */}
                  <div className="p-8 border-2 border-dashed border-slate-300 dark:border-navy-600 rounded-2xl">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <Globe className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-lg font-bold text-slate-700 dark:text-white mb-4 text-center">
                      Analizar URL
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        placeholder="https://ejemplo.com/pagina"
                        className="flex-1 px-4 py-3 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-600 rounded-xl text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                        disabled={isProcessingUrl}
                      />
                      <button
                        onClick={handleProcessUrl}
                        disabled={!urlInput.trim() || isProcessingUrl}
                        className="px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium disabled:opacity-50 transition-all flex items-center gap-2"
                      >
                        {isProcessingUrl ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Zap className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Documento Procesado */}
                {currentProcessingDoc && (
                  <div className="mt-8">
                    <DocumentAnalysisPanel
                      document={currentProcessingDoc}
                      onClose={() => setCurrentProcessingDoc(null)}
                      onSaveToKnowledge={() => handleSaveToKnowledge(currentProcessingDoc)}
                    />
                  </div>
                )}

                {/* Documentos Recientes */}
                {processedDocs.length > 0 && !currentProcessingDoc && (
                  <div className="mt-8">
                    <h3 className="text-lg font-bold text-slate-700 dark:text-white mb-4 flex items-center gap-2">
                      <History className="w-5 h-5 text-slate-400" />
                      Documentos Procesados Recientemente
                    </h3>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {processedDocs.slice(0, 6).map((doc) => (
                        <div
                          key={doc.id}
                          onClick={() => setCurrentProcessingDoc(doc)}
                          className="p-4 bg-slate-50 dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-navy-700 hover:border-purple-400 cursor-pointer transition-all group"
                        >
                          <div className="flex items-start justify-between mb-2">
                            {getTypeIcon(doc.fileType)}
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${doc.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-red-100 text-red-700'
                              }`}>
                              {doc.status === 'completed' ? 'Listo' : 'Error'}
                            </span>
                          </div>
                          <h4 className="font-medium text-slate-700 dark:text-white truncate group-hover:text-purple-600">
                            {doc.fileName}
                          </h4>
                          <p className="text-xs text-slate-500 mt-1">
                            {new Date(doc.processedAt).toLocaleDateString('es-CO')}
                          </p>
                          {doc.aiAnalysis && (
                            <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                              {doc.aiAnalysis.summary}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ============================================ */}
          {/* TAB: DOCUMENTOS */}
          {/* ============================================ */}
          {activeTab === 'documentos' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <Database className="w-6 h-6 text-blue-500" />
                  Todos los Documentos
                </h3>
                <button
                  onClick={loadProcessedDocuments}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-navy-800 rounded-lg transition-colors"
                >
                  <RefreshCw className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              {documentos.length === 0 ? (
                <div className="text-center py-16">
                  <FileText className="w-16 h-16 mx-auto text-slate-300 dark:text-navy-600 mb-4" />
                  <p className="text-lg font-medium text-slate-500 mb-2">No hay documentos</p>
                  <p className="text-sm text-slate-400">
                    Sube documentos en la pestaña "Procesamiento IA"
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-navy-700">
                        <th className="text-left py-4 px-4 text-xs font-bold uppercase text-slate-500">Documento</th>
                        <th className="text-left py-4 px-4 text-xs font-bold uppercase text-slate-500">Tipo</th>
                        <th className="text-left py-4 px-4 text-xs font-bold uppercase text-slate-500">Fecha</th>
                        <th className="text-left py-4 px-4 text-xs font-bold uppercase text-slate-500">Estado</th>
                        <th className="text-left py-4 px-4 text-xs font-bold uppercase text-slate-500">Análisis</th>
                        <th className="text-right py-4 px-4 text-xs font-bold uppercase text-slate-500">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {documentos.map((doc) => (
                        <tr
                          key={doc.id}
                          className="border-b border-slate-100 dark:border-navy-700 hover:bg-slate-50 dark:hover:bg-navy-800 transition-colors"
                        >
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              {getTypeIcon(doc.tipo)}
                              <span className="font-medium text-slate-700 dark:text-white truncate max-w-xs">
                                {doc.nombre}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className="px-2 py-1 bg-slate-100 dark:bg-navy-700 rounded text-xs font-medium uppercase">
                              {doc.tipo}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-sm text-slate-500">
                            {new Date(doc.fecha_carga).toLocaleDateString('es-CO')}
                          </td>
                          <td className="py-4 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${doc.estado === 'completed'
                                ? 'bg-emerald-100 text-emerald-700'
                                : doc.estado === 'processing'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-red-100 text-red-700'
                              }`}>
                              {doc.estado === 'completed' ? 'Completado' :
                                doc.estado === 'processing' ? 'Procesando' : 'Error'}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            {doc.processedDoc?.aiAnalysis ? (
                              <span className="flex items-center gap-1 text-xs text-purple-600">
                                <Sparkles className="w-3 h-3" />
                                IA Aplicada
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400">-</span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {doc.processedDoc && (
                                <button
                                  onClick={() => setCurrentProcessingDoc(doc.processedDoc!)}
                                  className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg text-blue-500 transition-colors"
                                  title="Ver análisis"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteDocument(doc.id)}
                                className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-red-500 transition-colors"
                                title="Eliminar"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ============================================ */}
          {/* TAB: ANÁLISIS FINANCIERO */}
          {/* ============================================ */}
          {activeTab === 'financial' && (
            <div className="p-6">
              <div className="text-center py-16">
                <div className="inline-flex p-4 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl mb-4 shadow-xl shadow-emerald-500/30">
                  <DollarSign className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                  Análisis Financiero Automático
                </h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-8">
                  Sube un archivo Excel de Dropi para generar un Estado de Pérdidas y Ganancias completo con análisis IA
                </p>

                {/* Documentos con métricas financieras */}
                {processedDocs.filter(d => d.financialMetrics).length > 0 ? (
                  <div className="max-w-4xl mx-auto">
                    <h4 className="text-left text-lg font-bold text-slate-700 dark:text-white mb-4">
                      Reportes Financieros Generados
                    </h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      {processedDocs.filter(d => d.financialMetrics).map((doc) => (
                        <div
                          key={doc.id}
                          onClick={() => setCurrentProcessingDoc(doc)}
                          className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl border border-emerald-200 dark:border-emerald-800 cursor-pointer hover:shadow-lg transition-all text-left"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <FileSpreadsheet className="w-8 h-8 text-emerald-500" />
                              <div>
                                <h5 className="font-bold text-slate-700 dark:text-white truncate">
                                  {doc.fileName}
                                </h5>
                                <p className="text-xs text-slate-500">
                                  {new Date(doc.processedAt).toLocaleDateString('es-CO')}
                                </p>
                              </div>
                            </div>
                            <ArrowRight className="w-5 h-5 text-emerald-500" />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-white dark:bg-navy-800 rounded-xl">
                              <p className="text-xs text-slate-500 mb-1">Ventas</p>
                              <p className="text-lg font-bold text-emerald-600">
                                {formatCurrency(doc.financialMetrics!.totalSales)}
                              </p>
                            </div>
                            <div className="p-3 bg-white dark:bg-navy-800 rounded-xl">
                              <p className="text-xs text-slate-500 mb-1">Margen</p>
                              <p className="text-lg font-bold text-blue-600">
                                {doc.financialMetrics!.profitMargin.toFixed(1)}%
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setActiveTab('procesamiento')}
                    className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold flex items-center gap-2 mx-auto transition-all shadow-lg shadow-emerald-500/30"
                  >
                    <Upload className="w-5 h-5" />
                    Subir Archivo Excel
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ============================================ */}
          {/* TAB: BASE DE CONOCIMIENTO */}
          {/* ============================================ */}
          {activeTab === 'conocimiento' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-amber-500" />
                  Base de Conocimiento IA
                </h3>
                <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full text-sm font-medium">
                  {knowledgeEntries.length} entradas
                </span>
              </div>

              {knowledgeEntries.length === 0 ? (
                <div className="text-center py-16">
                  <BookOpen className="w-16 h-16 mx-auto text-slate-300 dark:text-navy-600 mb-4" />
                  <p className="text-lg font-medium text-slate-500 mb-2">Base de conocimiento vacía</p>
                  <p className="text-sm text-slate-400">
                    Procesa documentos y guárdalos aquí para que el asistente IA los use
                  </p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {knowledgeEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-4 bg-slate-50 dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-navy-700"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${entry.type === 'proceso' ? 'bg-blue-100 text-blue-700' :
                            entry.type === 'regla' ? 'bg-purple-100 text-purple-700' :
                              entry.type === 'plantilla' ? 'bg-emerald-100 text-emerald-700' :
                                'bg-slate-100 text-slate-700'
                          }`}>
                          {entry.type}
                        </span>
                        <button
                          onClick={() => documentProcessor.deleteKnowledge(entry.id)}
                          className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <h4 className="font-bold text-slate-700 dark:text-white mb-1 truncate">
                        {entry.title}
                      </h4>
                      <p className="text-xs text-slate-500 line-clamp-2 mb-2">
                        {entry.summary}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {entry.tags.slice(0, 3).map((tag: string, idx: number) => (
                          <span key={idx} className="px-1.5 py-0.5 bg-slate-200 dark:bg-navy-700 rounded text-[10px] text-slate-600 dark:text-slate-400">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ============================================ */}
          {/* TAB: PREDICCIONES ML */}
          {/* ============================================ */}
          {activeTab === 'predicciones' && (
            <div className="p-6">
              <div className="text-center py-16 max-w-2xl mx-auto">
                <div className="inline-flex p-4 bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl mb-4 shadow-xl shadow-pink-500/30">
                  <Activity className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                  Sistema de Predicciones ML
                </h3>
                <p className="text-slate-500 dark:text-slate-400 mb-8">
                  Machine Learning para predecir tasas de éxito, tiempos de entrega y detectar patrones
                </p>

                <div className="grid md:grid-cols-3 gap-4 mb-8">
                  {[
                    { icon: Calendar, label: 'Temporada', desc: 'Navidad, Lluvias, etc.' },
                    { icon: Clock, label: 'Día Semana', desc: 'Impacto de fines de semana' },
                    { icon: Truck, label: 'Transportadora', desc: 'Rendimiento histórico' },
                  ].map((factor, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 dark:bg-navy-800 rounded-xl">
                      <factor.icon className="w-8 h-8 text-pink-500 mx-auto mb-2" />
                      <p className="font-bold text-slate-700 dark:text-white">{factor.label}</p>
                      <p className="text-xs text-slate-500">{factor.desc}</p>
                    </div>
                  ))}
                </div>

                <p className="text-sm text-slate-400">
                  Las predicciones se aplican automáticamente a los datos cargados en Seguimiento
                </p>
              </div>
            </div>
          )}

          {/* ============================================ */}
          {/* TAB: INTEGRACIONES */}
          {/* ============================================ */}
          {activeTab === 'integraciones' && (
            <div className="p-0">
              <ConexionesTab />
            </div>
          )}

          {/* ============================================ */}
          {/* TAB: INFO LOGÍSTICA */}
          {/* ============================================ */}
          {activeTab === 'info-logistica' && (
            <div className="p-6 space-y-8">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl shadow-xl shadow-cyan-500/30">
                    <Truck className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                      Info Logística
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400">
                      Documentos Excel e información de entregas en tiempo real
                    </p>
                  </div>
                </div>
                <button
                  onClick={loadLogisticsData}
                  className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-medium transition-all"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingLogistics ? 'animate-spin' : ''}`} />
                  Actualizar
                </button>
              </div>

              {/* Archivos Excel Cargados */}
              <div className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-2xl p-6 border border-cyan-200 dark:border-cyan-800">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-cyan-500" />
                  Documentos Excel Cargados
                </h3>

                {excelFiles.length === 0 ? (
                  <div className="text-center py-8">
                    <FileSpreadsheet className="w-12 h-12 mx-auto text-slate-300 dark:text-navy-600 mb-3" />
                    <p className="text-slate-500 dark:text-slate-400">No hay archivos Excel cargados</p>
                    <p className="text-xs text-slate-400 mt-1">Sube archivos en "Procesamiento IA" o "Semáforo"</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {excelFiles.map((file) => (
                      <div
                        key={file.id}
                        onClick={() => {
                          if (file.tipo === 'Semáforo') {
                            loadLogisticsData();
                            showNotification('info', 'Datos del semáforo actualizados');
                          } else {
                            const doc = processedDocs.find(d => d.id === file.id);
                            if (doc) setCurrentProcessingDoc(doc);
                          }
                        }}
                        className="p-4 bg-white dark:bg-navy-800 rounded-xl border border-cyan-200 dark:border-cyan-700 hover:border-cyan-400 hover:shadow-lg cursor-pointer transition-all group"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
                            <FileSpreadsheet className="w-5 h-5 text-cyan-600" />
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                            file.tipo === 'Semáforo'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                              : 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400'
                          }`}>
                            {file.tipo}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-700 dark:text-white truncate group-hover:text-cyan-600 mb-1">
                          {file.nombre}
                        </h4>
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>{file.fecha}</span>
                          <span className="font-medium text-cyan-600">{file.registros} registros</span>
                        </div>
                        <div className="mt-3 flex items-center gap-1 text-cyan-500 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                          <Eye className="w-3 h-3" />
                          <span>Ver detalle</span>
                          <ArrowRight className="w-3 h-3" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Información Logística Dinámica */}
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-500" />
                  Semáforo de Entregas por Ciudad
                  {logisticsData.length > 0 && (
                    <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-bold">
                      {logisticsData.length} ciudades
                    </span>
                  )}
                </h3>

                {logisticsData.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 dark:bg-navy-800 rounded-2xl">
                    <MapPin className="w-16 h-16 mx-auto text-slate-300 dark:text-navy-600 mb-4" />
                    <p className="text-lg font-medium text-slate-500 mb-2">Sin datos logísticos</p>
                    <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
                      Carga un archivo Excel en la pestaña "Semáforo" para ver las métricas de entregas por ciudad y transportadora
                    </p>
                    <button
                      onClick={() => setActiveTab('procesamiento')}
                      className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-medium transition-all"
                    >
                      Cargar Datos
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b-2 border-slate-200 dark:border-navy-700">
                          <th className="text-left py-4 px-4 text-xs font-bold uppercase text-slate-500">Ciudad</th>
                          <th className="text-left py-4 px-4 text-xs font-bold uppercase text-slate-500">Transportadora</th>
                          <th className="text-center py-4 px-4 text-xs font-bold uppercase text-slate-500">Entregas</th>
                          <th className="text-center py-4 px-4 text-xs font-bold uppercase text-slate-500">Devoluciones</th>
                          <th className="text-center py-4 px-4 text-xs font-bold uppercase text-slate-500">Tasa Éxito</th>
                          <th className="text-center py-4 px-4 text-xs font-bold uppercase text-slate-500">Tiempo Prom.</th>
                          <th className="text-center py-4 px-4 text-xs font-bold uppercase text-slate-500">Semáforo</th>
                          <th className="text-right py-4 px-4 text-xs font-bold uppercase text-slate-500">Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {logisticsData.map((item, idx) => (
                          <tr
                            key={idx}
                            onClick={() => setSelectedLogisticItem(item)}
                            className="border-b border-slate-100 dark:border-navy-700 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 cursor-pointer transition-colors"
                          >
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-slate-400" />
                                <span className="font-medium text-slate-700 dark:text-white">{item.ciudad}</span>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <span className="px-2 py-1 bg-slate-100 dark:bg-navy-700 rounded text-sm font-medium">
                                {item.transportadora}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-center">
                              <span className="font-bold text-emerald-600">{item.entregas}</span>
                            </td>
                            <td className="py-4 px-4 text-center">
                              <span className="font-bold text-red-500">{item.devoluciones}</span>
                            </td>
                            <td className="py-4 px-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <div className="w-16 h-2 bg-slate-200 dark:bg-navy-700 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      item.tasaExito >= 90 ? 'bg-emerald-500' :
                                      item.tasaExito >= 75 ? 'bg-amber-500' :
                                      item.tasaExito >= 60 ? 'bg-orange-500' : 'bg-red-500'
                                    }`}
                                    style={{ width: `${item.tasaExito}%` }}
                                  />
                                </div>
                                <span className="font-bold text-sm">{item.tasaExito.toFixed(1)}%</span>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-center">
                              <span className="font-medium text-slate-600 dark:text-slate-300">{item.tiempoPromedio} días</span>
                            </td>
                            <td className="py-4 px-4 text-center">
                              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                                item.semaforo === 'VERDE' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                item.semaforo === 'AMARILLO' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                item.semaforo === 'NARANJA' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                                'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              }`}>
                                <span className={`w-2 h-2 rounded-full ${
                                  item.semaforo === 'VERDE' ? 'bg-emerald-500' :
                                  item.semaforo === 'AMARILLO' ? 'bg-amber-500' :
                                  item.semaforo === 'NARANJA' ? 'bg-orange-500' : 'bg-red-500'
                                }`} />
                                {item.semaforo}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <button className="p-2 hover:bg-cyan-100 dark:hover:bg-cyan-900/30 rounded-lg text-cyan-500 transition-colors">
                                <ChevronDown className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Resumen Estadístico */}
              {logisticsData.length > 0 && (
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="p-5 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl text-white">
                    <div className="flex items-center justify-between mb-2">
                      <CheckCircle className="w-6 h-6 text-white/70" />
                      <span className="text-2xl font-bold">
                        {logisticsData.reduce((sum, item) => sum + item.entregas, 0)}
                      </span>
                    </div>
                    <p className="text-sm text-white/80">Total Entregas</p>
                  </div>
                  <div className="p-5 bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl text-white">
                    <div className="flex items-center justify-between mb-2">
                      <AlertTriangle className="w-6 h-6 text-white/70" />
                      <span className="text-2xl font-bold">
                        {logisticsData.reduce((sum, item) => sum + item.devoluciones, 0)}
                      </span>
                    </div>
                    <p className="text-sm text-white/80">Total Devoluciones</p>
                  </div>
                  <div className="p-5 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl text-white">
                    <div className="flex items-center justify-between mb-2">
                      <Target className="w-6 h-6 text-white/70" />
                      <span className="text-2xl font-bold">
                        {(logisticsData.reduce((sum, item) => sum + item.tasaExito, 0) / logisticsData.length).toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-sm text-white/80">Tasa Promedio</p>
                  </div>
                  <div className="p-5 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl text-white">
                    <div className="flex items-center justify-between mb-2">
                      <Clock className="w-6 h-6 text-white/70" />
                      <span className="text-2xl font-bold">
                        {(logisticsData.reduce((sum, item) => sum + item.tiempoPromedio, 0) / logisticsData.length).toFixed(1)}
                      </span>
                    </div>
                    <p className="text-sm text-white/80">Días Promedio</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal de Detalle Logístico */}
        {selectedLogisticItem && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-navy-900 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden">
              <div className="p-6 bg-gradient-to-r from-cyan-500 to-blue-500 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/20 rounded-xl backdrop-blur">
                      <MapPin className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">{selectedLogisticItem.ciudad}</h3>
                      <p className="text-cyan-100">{selectedLogisticItem.transportadora}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedLogisticItem(null)}
                    className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Métricas principales */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Entregas</span>
                    </div>
                    <p className="text-3xl font-bold text-emerald-600">{selectedLogisticItem.entregas}</p>
                  </div>
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Devoluciones</span>
                    </div>
                    <p className="text-3xl font-bold text-red-600">{selectedLogisticItem.devoluciones}</p>
                  </div>
                </div>

                {/* Tasa de éxito */}
                <div className="p-4 bg-slate-50 dark:bg-navy-800 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Tasa de Éxito</span>
                    <span className={`text-2xl font-bold ${
                      selectedLogisticItem.tasaExito >= 90 ? 'text-emerald-600' :
                      selectedLogisticItem.tasaExito >= 75 ? 'text-amber-600' :
                      selectedLogisticItem.tasaExito >= 60 ? 'text-orange-600' : 'text-red-600'
                    }`}>
                      {selectedLogisticItem.tasaExito.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full h-4 bg-slate-200 dark:bg-navy-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        selectedLogisticItem.tasaExito >= 90 ? 'bg-emerald-500' :
                        selectedLogisticItem.tasaExito >= 75 ? 'bg-amber-500' :
                        selectedLogisticItem.tasaExito >= 60 ? 'bg-orange-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${selectedLogisticItem.tasaExito}%` }}
                    />
                  </div>
                </div>

                {/* Info adicional */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-blue-500" />
                      <span className="text-sm text-slate-500">Tiempo Promedio</span>
                    </div>
                    <p className="text-xl font-bold text-blue-600">{selectedLogisticItem.tiempoPromedio} días</p>
                  </div>
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                    <div className="flex items-center gap-2 mb-1">
                      <Package className="w-4 h-4 text-purple-500" />
                      <span className="text-sm text-slate-500">Total Envíos</span>
                    </div>
                    <p className="text-xl font-bold text-purple-600">{selectedLogisticItem.total}</p>
                  </div>
                </div>

                {/* Recomendación IA */}
                {selectedLogisticItem.recomendacionIA && (
                  <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                        <Sparkles className="w-5 h-5 text-purple-500" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-700 dark:text-white mb-1">Recomendación IA</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-300">{selectedLogisticItem.recomendacionIA}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Semáforo */}
                <div className="flex items-center justify-center">
                  <div className={`px-6 py-3 rounded-full font-bold flex items-center gap-2 ${
                    selectedLogisticItem.semaforo === 'VERDE' ? 'bg-emerald-100 text-emerald-700' :
                    selectedLogisticItem.semaforo === 'AMARILLO' ? 'bg-amber-100 text-amber-700' :
                    selectedLogisticItem.semaforo === 'NARANJA' ? 'bg-orange-100 text-orange-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    <span className={`w-4 h-4 rounded-full animate-pulse ${
                      selectedLogisticItem.semaforo === 'VERDE' ? 'bg-emerald-500' :
                      selectedLogisticItem.semaforo === 'AMARILLO' ? 'bg-amber-500' :
                      selectedLogisticItem.semaforo === 'NARANJA' ? 'bg-orange-500' : 'bg-red-500'
                    }`} />
                    Estado: {selectedLogisticItem.semaforo}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de análisis */}
        {currentProcessingDoc && activeTab !== 'procesamiento' && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <DocumentAnalysisPanel
                document={currentProcessingDoc}
                onClose={() => setCurrentProcessingDoc(null)}
                onSaveToKnowledge={() => handleSaveToKnowledge(currentProcessingDoc)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanelPro;
