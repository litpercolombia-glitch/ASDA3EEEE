import React, { useState, useEffect, useMemo } from 'react';
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
} from 'lucide-react';
import { DateFilter, FiltroFecha, calcularRangoFecha } from '../ui/DateFilter';
import { ConexionesTab } from '../tabs/ConexionesTab';
import { Shipment, ShipmentStatus, CarrierName } from '../../types';
import { SemaforoExcelData, CiudadSemaforo, STORAGE_KEYS } from '../../types/logistics';
import { saveTabData, loadTabData } from '../../utils/tabStorage';
import { ExcelUploader } from '../excel/ExcelUploader';

interface DocumentoCargado {
  id: string;
  nombre: string;
  tipo: string;
  fecha_carga: string;
  estado: string;
  tiene_analisis_financiero: boolean;
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

// API URL
const API_BASE = import.meta.env.VITE_ML_API_URL || 'http://localhost:8000';

export const AdminPanel: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [filtroFecha, setFiltroFecha] = useState<FiltroFecha>('todo');
  const [documentos, setDocumentos] = useState<DocumentoCargado[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [reporteFinanciero, setReporteFinanciero] = useState<ReporteFinanciero | null>(null);
  const [isLoadingReporte, setIsLoadingReporte] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'upload' | 'documents' | 'financial' | 'integraciones' | 'predicciones' | 'info-logistica'
  >('upload');

  // Info Logística - Datos sincronizados con Semáforo
  const [infoLogisticaData, setInfoLogisticaData] = useState<SemaforoExcelData | null>(null);
  const [ciudadesLogistica, setCiudadesLogistica] = useState<CiudadSemaforo[]>([]);
  const [searchCiudad, setSearchCiudad] = useState('');
  const [lastDataUpload, setLastDataUpload] = useState<Date | null>(null);

  // Verificar token guardado
  useEffect(() => {
    const savedToken = localStorage.getItem('admin_token');
    if (savedToken) {
      setToken(savedToken);
      setIsAuthenticated(true);
    }
  }, []);

  // Cargar documentos cuando esta autenticado
  useEffect(() => {
    if (isAuthenticated && token) {
      loadDocumentos();
      loadInfoLogistica();
    }
  }, [isAuthenticated, token, filtroFecha]);

  // Cargar datos de Info Logística desde localStorage (sincronizado con Semáforo)
  const loadInfoLogistica = () => {
    const saved = loadTabData<{
      data: SemaforoExcelData;
      uploadDate: string;
      fileName: string;
    } | null>(STORAGE_KEYS.SEMAFORO, null);

    if (saved) {
      setInfoLogisticaData(saved.data);
      setLastDataUpload(new Date(saved.uploadDate));
      // Procesar ciudades
      const ciudades = procesarCiudadesLogistica(saved.data);
      setCiudadesLogistica(ciudades);
    }
  };

  // Procesar datos de Excel para Info Logística
  const procesarCiudadesLogistica = (data: SemaforoExcelData): CiudadSemaforo[] => {
    const tiemposMap = new Map<string, number>();

    data.tiempoPromedio.forEach((row) => {
      const key = `${row.ciudad.toUpperCase()}-${row.transportadora.toUpperCase()}`;
      tiemposMap.set(key, row.dias);
    });

    return data.tasaEntregas
      .map((row) => {
        const key = `${row.ciudad.toUpperCase()}-${row.transportadora.toUpperCase()}`;
        const tiempoPromedio = tiemposMap.get(key) || 5;
        const tasaExito = row.total > 0 ? (row.entregas / row.total) * 100 : 0;
        const tasaDevolucion = row.total > 0 ? (row.devoluciones / row.total) * 100 : 0;

        let semaforo: 'VERDE' | 'AMARILLO' | 'NARANJA' | 'ROJO';
        if (tasaExito >= 75) semaforo = 'VERDE';
        else if (tasaExito >= 65) semaforo = 'AMARILLO';
        else if (tasaExito >= 50) semaforo = 'NARANJA';
        else semaforo = 'ROJO';

        return {
          ciudad: row.ciudad,
          transportadora: row.transportadora,
          entregas: row.entregas,
          devoluciones: row.devoluciones,
          total: row.total,
          tasaExito,
          tasaDevolucion,
          tiempoPromedio,
          semaforo,
          recomendacionIA: generarRecomendacion(tasaExito, tiempoPromedio, tasaDevolucion),
        };
      })
      .sort((a, b) => b.tasaExito - a.tasaExito);
  };

  const generarRecomendacion = (
    tasaExito: number,
    tiempoPromedio: number,
    tasaDevolucion: number
  ): string => {
    if (tasaExito >= 75) return 'Excelente ruta. Ideal para contraentrega.';
    if (tasaExito >= 65) return 'Buen rendimiento. Monitorear tiempos.';
    if (tasaExito >= 50) return 'Alerta. Confirmar datos del cliente. Considerar prepago.';
    return 'Ruta crítica. PREPAGO obligatorio o cambiar transportadora.';
  };

  // Manejar carga de datos desde Info Logística (sincroniza con Semáforo)
  const handleInfoLogisticaUpload = (data: SemaforoExcelData) => {
    setInfoLogisticaData(data);
    setLastDataUpload(new Date());
    const ciudades = procesarCiudadesLogistica(data);
    setCiudadesLogistica(ciudades);

    // Guardar en localStorage para sincronizar con pestaña Semáforo
    saveTabData(STORAGE_KEYS.SEMAFORO, {
      data,
      uploadDate: new Date().toISOString(),
      fileName: 'datos_admin.xlsx',
    });
  };

  // Filtrar ciudades por búsqueda
  const ciudadesFiltradas = useMemo(() => {
    if (!searchCiudad) return ciudadesLogistica;
    const query = searchCiudad.toLowerCase();
    return ciudadesLogistica.filter(
      (c) =>
        c.ciudad.toLowerCase().includes(query) || c.transportadora.toLowerCase().includes(query)
    );
  }, [ciudadesLogistica, searchCiudad]);

  const handleLogin = async () => {
    setError('');

    try {
      const response = await fetch(`${API_BASE}/api/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Contrasena incorrecta');
      }

      const data = await response.json();

      if (data.success && data.token) {
        setToken(data.token);
        setIsAuthenticated(true);
        localStorage.setItem('admin_token', data.token);
        setPassword('');
      } else {
        throw new Error('Error en la respuesta');
      }
    } catch (err: any) {
      // Fallback: validacion local si el backend no esta disponible
      if (password === 'Sacrije2020?08') {
        const localToken = 'local_admin_' + Date.now();
        setToken(localToken);
        setIsAuthenticated(true);
        localStorage.setItem('admin_token', localToken);
        setPassword('');
      } else {
        setError(err.message || 'Contrasena incorrecta');
      }
    }
  };

  const handleLogout = async () => {
    try {
      if (token && !token.startsWith('local_')) {
        await fetch(`${API_BASE}/api/admin/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (err) {
      console.error('Error en logout:', err);
    }

    setIsAuthenticated(false);
    setToken(null);
    localStorage.removeItem('admin_token');
  };

  const loadDocumentos = async () => {
    setIsLoadingDocs(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/documents?filtro=${filtroFecha}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDocumentos(data.documentos || []);
      }
    } catch (err) {
      console.error('Error cargando documentos:', err);
      // Usar datos de ejemplo
      setDocumentos([]);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('archivo', file);

      const response = await fetch(`${API_BASE}/api/admin/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Error al subir archivo');
      }

      const result = await response.json();

      // Si es archivo financiero, analizarlo
      if (result.es_financiero) {
        setActiveTab('financial');
        await analizarArchivo(result.id);
      }

      await loadDocumentos();
    } catch (err: any) {
      console.error('Error:', err);
      alert(err.message || 'Error subiendo archivo');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const analizarArchivo = async (archivoId?: string) => {
    setIsLoadingReporte(true);

    try {
      const response = await fetch(`${API_BASE}/api/admin/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ archivo_id: archivoId }),
      });

      if (response.ok) {
        const data = await response.json();
        setReporteFinanciero(data);
      }
    } catch (err) {
      console.error('Error analizando:', err);
    } finally {
      setIsLoadingReporte(false);
    }
  };

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
      case 'documento':
        return <FileText className="w-5 h-5 text-blue-500" />;
      case 'video':
        return <Video className="w-5 h-5 text-red-500" />;
      case 'audio':
        return <Music className="w-5 h-5 text-purple-500" />;
      default:
        return <FileText className="w-5 h-5 text-slate-500" />;
    }
  };

  // Pantalla de login
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-navy-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-xl p-8 border border-slate-200 dark:border-navy-700">
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                Modo Administrador
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Acceso restringido</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Contrasena
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                    placeholder="Ingresa la contrasena"
                    className="w-full px-4 py-3 pl-11 border border-slate-300 dark:border-navy-600 rounded-xl bg-white dark:bg-navy-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-lg">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <button
                onClick={handleLogin}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <Unlock className="w-5 h-5" />
                Ingresar
              </button>
            </div>

            <p className="text-center text-xs text-slate-400 mt-6">
              Este acceso es solo para administradores autorizados
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Panel de administracion
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-navy-950 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                Modo Administrador
              </h1>
              <p className="text-sm text-slate-500">Gestion avanzada del sistema</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-navy-800 hover:bg-slate-300 dark:hover:bg-navy-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesion
          </button>
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
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all ${
              activeTab === 'upload'
                ? 'bg-amber-500 text-white shadow-lg'
                : 'bg-white dark:bg-navy-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-navy-700'
            }`}
          >
            <Upload className="w-4 h-4" />
            Cargar Documentos
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all ${
              activeTab === 'documents'
                ? 'bg-amber-500 text-white shadow-lg'
                : 'bg-white dark:bg-navy-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-navy-700'
            }`}
          >
            <FileText className="w-4 h-4" />
            Documentos ({documentos.length})
          </button>
          <button
            onClick={() => setActiveTab('financial')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all ${
              activeTab === 'financial'
                ? 'bg-amber-500 text-white shadow-lg'
                : 'bg-white dark:bg-navy-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-navy-700'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            Analisis Financiero
          </button>
          <button
            onClick={() => setActiveTab('info-logistica')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all ${
              activeTab === 'info-logistica'
                ? 'bg-emerald-500 text-white shadow-lg'
                : 'bg-white dark:bg-navy-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-navy-700'
            }`}
          >
            <Truck className="w-4 h-4" />
            Info Logistica
            {ciudadesLogistica.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-xs font-bold">
                {ciudadesLogistica.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('predicciones')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all ${
              activeTab === 'predicciones'
                ? 'bg-purple-500 text-white shadow-lg'
                : 'bg-white dark:bg-navy-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-navy-700'
            }`}
          >
            <Brain className="w-4 h-4" />
            Predicciones ML
          </button>
          <button
            onClick={() => setActiveTab('integraciones')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all ${
              activeTab === 'integraciones'
                ? 'bg-orange-500 text-white shadow-lg'
                : 'bg-white dark:bg-navy-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-navy-700'
            }`}
          >
            <Plug className="w-4 h-4" />
            Integraciones
          </button>
        </div>

        {/* Contenido */}
        <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-xl border border-slate-200 dark:border-navy-700 overflow-hidden">
          {/* Upload Tab */}
          {activeTab === 'upload' && (
            <div className="p-8">
              <div className="max-w-xl mx-auto">
                <div className="border-2 border-dashed border-slate-300 dark:border-navy-600 rounded-2xl p-8 text-center hover:border-amber-500 transition-colors cursor-pointer group">
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv,.docx,.pdf,.txt,.mp4,.mp3,.pptx"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="admin-file-upload"
                    disabled={isUploading}
                  />
                  <label htmlFor="admin-file-upload" className="cursor-pointer">
                    {isUploading ? (
                      <Loader2 className="w-12 h-12 mx-auto mb-4 text-amber-500 animate-spin" />
                    ) : (
                      <Upload className="w-12 h-12 mx-auto mb-4 text-slate-400 group-hover:text-amber-500 transition-colors" />
                    )}
                    <p className="text-lg font-medium text-slate-700 dark:text-white mb-2">
                      {isUploading ? 'Procesando...' : 'Arrastra archivos o haz clic'}
                    </p>
                    <p className="text-sm text-slate-500">
                      Excel, CSV, PDF, Word, PPT, MP3, MP4, TXT
                    </p>
                  </label>
                </div>

                <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { icon: FileSpreadsheet, label: 'Excel', color: 'emerald' },
                    { icon: FileText, label: 'Documentos', color: 'blue' },
                    { icon: Video, label: 'Videos', color: 'red' },
                    { icon: Music, label: 'Audios', color: 'purple' },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-slate-50 dark:bg-navy-800 rounded-xl text-center"
                    >
                      <item.icon className={`w-8 h-8 mx-auto mb-2 text-${item.color}-500`} />
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                        {item.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-800 dark:text-white">Documentos Cargados</h3>
                <button
                  onClick={loadDocumentos}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-navy-800 rounded-lg transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingDocs ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {isLoadingDocs ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                </div>
              ) : documentos.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 mx-auto text-slate-300 dark:text-navy-600 mb-4" />
                  <p className="text-slate-500">No hay documentos cargados</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-navy-700">
                        <th className="text-left py-3 px-4 text-xs font-bold uppercase text-slate-500">
                          Archivo
                        </th>
                        <th className="text-left py-3 px-4 text-xs font-bold uppercase text-slate-500">
                          Tipo
                        </th>
                        <th className="text-left py-3 px-4 text-xs font-bold uppercase text-slate-500">
                          Fecha
                        </th>
                        <th className="text-left py-3 px-4 text-xs font-bold uppercase text-slate-500">
                          Estado
                        </th>
                        <th className="text-right py-3 px-4 text-xs font-bold uppercase text-slate-500">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {documentos.map((doc) => (
                        <tr
                          key={doc.id}
                          className="border-b border-slate-100 dark:border-navy-700 hover:bg-slate-50 dark:hover:bg-navy-800"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              {getTypeIcon(doc.tipo)}
                              <span className="font-medium text-slate-700 dark:text-white">
                                {doc.nombre}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 bg-slate-100 dark:bg-navy-700 rounded text-xs font-medium">
                              {doc.tipo}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-500">
                            {new Date(doc.fecha_carga).toLocaleDateString('es-CO')}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                doc.estado === 'completado'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : doc.estado === 'procesando'
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {doc.estado}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button className="p-1.5 hover:bg-slate-100 dark:hover:bg-navy-700 rounded">
                                <Eye className="w-4 h-4 text-slate-400" />
                              </button>
                              {doc.tiene_analisis_financiero && (
                                <button
                                  onClick={() => {
                                    setActiveTab('financial');
                                    analizarArchivo(doc.id);
                                  }}
                                  className="p-1.5 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded"
                                >
                                  <BarChart3 className="w-4 h-4 text-amber-500" />
                                </button>
                              )}
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

          {/* Financial Tab */}
          {activeTab === 'financial' && (
            <div className="p-6">
              {isLoadingReporte ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto mb-4" />
                    <p className="text-slate-500">Generando analisis financiero...</p>
                  </div>
                </div>
              ) : reporteFinanciero ? (
                <div className="space-y-6">
                  {/* Header del reporte */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                        Estado de Perdidas y Ganancias
                      </h3>
                      <p className="text-sm text-slate-500">
                        {reporteFinanciero.archivo} |{' '}
                        {new Date(reporteFinanciero.fecha_analisis).toLocaleDateString('es-CO')}
                      </p>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg">
                      <Download className="w-4 h-4" />
                      Exportar
                    </button>
                  </div>

                  {/* Resumen ejecutivo */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                      <p className="text-sm text-blue-600 font-medium">Ventas</p>
                      <p className="text-2xl font-bold text-blue-800 dark:text-blue-300">
                        {formatCurrency(reporteFinanciero.resumen.total_facturado)}
                      </p>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4">
                      <p className="text-sm text-emerald-600 font-medium">Ganancia Bruta</p>
                      <p className="text-2xl font-bold text-emerald-800 dark:text-emerald-300">
                        {formatCurrency(reporteFinanciero.resumen.ganancia_bruta)}
                      </p>
                      <p className="text-xs text-emerald-500">
                        {reporteFinanciero.resumen.margen_bruto.toFixed(1)}% margen
                      </p>
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4">
                      <p className="text-sm text-amber-600 font-medium">Tasa de Entrega</p>
                      <p className="text-2xl font-bold text-amber-800 dark:text-amber-300">
                        {reporteFinanciero.resumen.tasa_entrega.toFixed(1)}%
                      </p>
                      <p className="text-xs text-amber-500">
                        {reporteFinanciero.resumen.entregados} de{' '}
                        {reporteFinanciero.resumen.entregados +
                          reporteFinanciero.resumen.no_entregados}
                      </p>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4">
                      <p className="text-sm text-red-600 font-medium">Perdida Estimada</p>
                      <p className="text-2xl font-bold text-red-800 dark:text-red-300">
                        {formatCurrency(reporteFinanciero.perdidas.ganancia_perdida_estimada)}
                      </p>
                      <p className="text-xs text-red-500">
                        {reporteFinanciero.perdidas.pedidos_no_entregados} no entregados
                      </p>
                    </div>
                  </div>

                  {/* Alertas */}
                  {reporteFinanciero.alertas.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-700 dark:text-white">Alertas</h4>
                      {reporteFinanciero.alertas.map((alerta, idx) => (
                        <div
                          key={idx}
                          className={`p-4 rounded-lg flex items-start gap-3 ${
                            alerta.tipo === 'critica'
                              ? 'bg-red-50 dark:bg-red-900/20 border border-red-200'
                              : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200'
                          }`}
                        >
                          <AlertTriangle
                            className={`w-5 h-5 flex-shrink-0 ${
                              alerta.tipo === 'critica' ? 'text-red-500' : 'text-amber-500'
                            }`}
                          />
                          <div>
                            <p
                              className={`font-medium ${
                                alerta.tipo === 'critica'
                                  ? 'text-red-800 dark:text-red-300'
                                  : 'text-amber-800 dark:text-amber-300'
                              }`}
                            >
                              {alerta.mensaje}
                            </p>
                            <p
                              className={`text-sm ${
                                alerta.tipo === 'critica'
                                  ? 'text-red-600 dark:text-red-400'
                                  : 'text-amber-600 dark:text-amber-400'
                              }`}
                            >
                              {alerta.accion}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Analisis IA */}
                  {reporteFinanciero.analisis_ia && (
                    <div className="bg-slate-50 dark:bg-navy-800 rounded-xl p-6">
                      <h4 className="font-bold text-slate-700 dark:text-white mb-3 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-amber-500" />
                        Analisis IA
                      </h4>
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                          {reporteFinanciero.analisis_ia}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Recomendaciones */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-6">
                      <h4 className="font-bold text-emerald-800 dark:text-emerald-300 mb-3">
                        Acciones Inmediatas
                      </h4>
                      <ul className="space-y-2">
                        {reporteFinanciero.recomendaciones.inmediatas.map((rec, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-emerald-700 dark:text-emerald-400">
                              {rec}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6">
                      <h4 className="font-bold text-blue-800 dark:text-blue-300 mb-3">
                        Politicas a Implementar
                      </h4>
                      <ul className="space-y-2">
                        {reporteFinanciero.recomendaciones.politicas.map((rec, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-blue-700 dark:text-blue-400">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <DollarSign className="w-12 h-12 mx-auto text-slate-300 dark:text-navy-600 mb-4" />
                  <p className="text-slate-500 mb-4">
                    Sube un archivo Excel de Dropi para generar el analisis financiero
                  </p>
                  <button
                    onClick={() => setActiveTab('upload')}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium"
                  >
                    Cargar Archivo
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Info Logística Tab */}
          {activeTab === 'info-logistica' && (
            <div className="p-6">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Truck className="w-6 h-6 text-emerald-500" />
                    <div>
                      <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                        Info Logística
                      </h3>
                      <p className="text-sm text-slate-500">
                        Datos sincronizados con el Semáforo de Rutas
                      </p>
                    </div>
                  </div>
                  {lastDataUpload && (
                    <span className="text-xs text-slate-500 bg-slate-100 dark:bg-navy-800 px-3 py-1 rounded-full">
                      Última actualización: {lastDataUpload.toLocaleDateString('es-CO')}
                    </span>
                  )}
                </div>

                {/* Buscador de ciudades */}
                <div className="relative mb-6">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={searchCiudad}
                    onChange={(e) => setSearchCiudad(e.target.value)}
                    placeholder="Buscar ciudad o transportadora (ej: Medellín, Bogotá, Coordinadora...)"
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-navy-600 rounded-xl bg-white dark:bg-navy-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-lg"
                  />
                </div>

                {/* Mensaje de sin datos */}
                {ciudadesLogistica.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 dark:bg-navy-800 rounded-xl">
                    <Database className="w-12 h-12 mx-auto text-slate-300 dark:text-navy-600 mb-4" />
                    <p className="text-slate-600 dark:text-slate-400 mb-4">
                      No hay datos de logística. Sube un archivo Excel en el Semáforo o aquí.
                    </p>
                    <p className="text-sm text-slate-500">
                      Los datos se sincronizan automáticamente con la pestaña Semáforo.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Resumen de transportadoras */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800">
                        <p className="text-sm text-emerald-600 font-medium">Rutas VERDE</p>
                        <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">
                          {ciudadesLogistica.filter((c) => c.semaforo === 'VERDE').length}
                        </p>
                        <p className="text-xs text-emerald-500">+75% éxito</p>
                      </div>
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 border border-yellow-200 dark:border-yellow-800">
                        <p className="text-sm text-yellow-600 font-medium">Rutas AMARILLO</p>
                        <p className="text-3xl font-bold text-yellow-700 dark:text-yellow-400">
                          {ciudadesLogistica.filter((c) => c.semaforo === 'AMARILLO').length}
                        </p>
                        <p className="text-xs text-yellow-500">65-75% éxito</p>
                      </div>
                      <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 border border-orange-200 dark:border-orange-800">
                        <p className="text-sm text-orange-600 font-medium">Rutas NARANJA</p>
                        <p className="text-3xl font-bold text-orange-700 dark:text-orange-400">
                          {ciudadesLogistica.filter((c) => c.semaforo === 'NARANJA').length}
                        </p>
                        <p className="text-xs text-orange-500">50-65% éxito</p>
                      </div>
                      <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
                        <p className="text-sm text-red-600 font-medium">Rutas ROJO</p>
                        <p className="text-3xl font-bold text-red-700 dark:text-red-400">
                          {ciudadesLogistica.filter((c) => c.semaforo === 'ROJO').length}
                        </p>
                        <p className="text-xs text-red-500">&lt;50% éxito</p>
                      </div>
                    </div>

                    {/* Resultados de búsqueda */}
                    {searchCiudad && (
                      <div className="mb-4">
                        <p className="text-sm text-slate-500">
                          {ciudadesFiltradas.length} resultado(s) para "{searchCiudad}"
                        </p>
                      </div>
                    )}

                    {/* Tarjetas de ciudades bonitas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto">
                      {ciudadesFiltradas.map((ciudad, idx) => {
                        const colorMap = {
                          VERDE: {
                            bg: 'bg-emerald-50 dark:bg-emerald-900/20',
                            border: 'border-emerald-300 dark:border-emerald-700',
                            badge: 'bg-emerald-500',
                            text: 'text-emerald-700 dark:text-emerald-400',
                          },
                          AMARILLO: {
                            bg: 'bg-yellow-50 dark:bg-yellow-900/20',
                            border: 'border-yellow-300 dark:border-yellow-700',
                            badge: 'bg-yellow-500',
                            text: 'text-yellow-700 dark:text-yellow-400',
                          },
                          NARANJA: {
                            bg: 'bg-orange-50 dark:bg-orange-900/20',
                            border: 'border-orange-300 dark:border-orange-700',
                            badge: 'bg-orange-500',
                            text: 'text-orange-700 dark:text-orange-400',
                          },
                          ROJO: {
                            bg: 'bg-red-50 dark:bg-red-900/20',
                            border: 'border-red-300 dark:border-red-700',
                            badge: 'bg-red-500',
                            text: 'text-red-700 dark:text-red-400',
                          },
                        };
                        const colors = colorMap[ciudad.semaforo];

                        return (
                          <div
                            key={`${ciudad.ciudad}-${ciudad.transportadora}-${idx}`}
                            className={`rounded-xl p-4 border-2 ${colors.bg} ${colors.border} transition-all hover:shadow-lg`}
                          >
                            {/* Header de tarjeta */}
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-slate-500" />
                                <div>
                                  <h4 className="font-bold text-slate-800 dark:text-white text-lg">
                                    {ciudad.ciudad}
                                  </h4>
                                  <p className="text-xs text-slate-500">{ciudad.transportadora}</p>
                                </div>
                              </div>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-bold text-white ${colors.badge}`}
                              >
                                {ciudad.semaforo}
                              </span>
                            </div>

                            {/* Métricas principales */}
                            <div className="grid grid-cols-3 gap-2 mb-3">
                              <div className="text-center p-2 bg-white dark:bg-navy-800 rounded-lg">
                                <p className="text-xs text-slate-500">Entregas</p>
                                <p className="text-lg font-bold text-emerald-600">
                                  {ciudad.entregas}
                                </p>
                              </div>
                              <div className="text-center p-2 bg-white dark:bg-navy-800 rounded-lg">
                                <p className="text-xs text-slate-500">Devoluciones</p>
                                <p className="text-lg font-bold text-red-600">
                                  {ciudad.devoluciones}
                                </p>
                              </div>
                              <div className="text-center p-2 bg-white dark:bg-navy-800 rounded-lg">
                                <p className="text-xs text-slate-500">Total</p>
                                <p className="text-lg font-bold text-slate-700 dark:text-white">
                                  {ciudad.total}
                                </p>
                              </div>
                            </div>

                            {/* Porcentajes */}
                            <div className="grid grid-cols-2 gap-2 mb-3">
                              <div className={`p-2 rounded-lg ${colors.bg}`}>
                                <p className="text-xs text-slate-500">Tasa Éxito</p>
                                <p className={`text-xl font-bold ${colors.text}`}>
                                  {ciudad.tasaExito.toFixed(1)}%
                                </p>
                              </div>
                              <div className="p-2 rounded-lg bg-slate-100 dark:bg-navy-800">
                                <p className="text-xs text-slate-500">Tiempo Prom.</p>
                                <p className="text-xl font-bold text-slate-700 dark:text-white flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {ciudad.tiempoPromedio.toFixed(1)}d
                                </p>
                              </div>
                            </div>

                            {/* Recomendación IA */}
                            <div className="flex items-start gap-2 p-2 bg-white dark:bg-navy-800 rounded-lg border border-slate-200 dark:border-navy-700">
                              <Sparkles className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
                              <p className="text-xs text-slate-600 dark:text-slate-300">
                                {ciudad.recomendacionIA}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Predicciones Tab */}
          {activeTab === 'predicciones' && (
            <div className="p-6">
              <div className="text-center py-12">
                <Brain className="w-16 h-16 mx-auto text-purple-500 mb-4" />
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                  Sistema de Predicciones ML
                </h3>
                <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-lg mx-auto">
                  El sistema de predicciones está disponible en la pestaña principal. Utiliza
                  factores como temporada, día de semana, festivos y datos históricos para predecir
                  tasas de éxito.
                </p>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6 max-w-2xl mx-auto">
                  <h4 className="font-bold text-purple-800 dark:text-purple-300 mb-4">
                    Factores considerados por el ML:
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-navy-800 rounded-lg p-3">
                      <Calendar className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Temporada
                      </p>
                      <p className="text-xs text-slate-500">Navidad, Lluvias, Seca</p>
                    </div>
                    <div className="bg-white dark:bg-navy-800 rounded-lg p-3">
                      <Clock className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Día Semana
                      </p>
                      <p className="text-xs text-slate-500">Impacto por día</p>
                    </div>
                    <div className="bg-white dark:bg-navy-800 rounded-lg p-3">
                      <Activity className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Histórico
                      </p>
                      <p className="text-xs text-slate-500">Datos pasados</p>
                    </div>
                    <div className="bg-white dark:bg-navy-800 rounded-lg p-3">
                      <Truck className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Transportadora
                      </p>
                      <p className="text-xs text-slate-500">Rendimiento</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Integraciones Tab */}
          {activeTab === 'integraciones' && (
            <div className="p-0">
              <ConexionesTab />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
