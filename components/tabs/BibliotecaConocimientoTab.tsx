/**
 * BIBLIOTECA DE CONOCIMIENTO - TAB
 * ==================================
 *
 * Interfaz para cargar y gestionar conocimiento desde múltiples fuentes.
 * Permite cargar archivos, páginas web y videos de YouTube.
 *
 * FUNCIONALIDADES:
 * - Cargar archivos (PDF, DOCX, TXT, etc.)
 * - Extraer contenido de páginas web
 * - Transcribir videos de YouTube
 * - Búsqueda semántica
 * - Visualización por categorías
 *
 * @author Litper IA System
 * @version 1.0.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  BookOpen,
  Upload,
  Globe,
  Youtube,
  Search,
  FileText,
  Folder,
  Tag,
  Calendar,
  ExternalLink,
  Trash2,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Loader2,
  ChevronRight,
  BarChart3,
  Lightbulb,
  HelpCircle
} from 'lucide-react';
import { HelpTooltip } from '../HelpSystem/HelpTooltip';
import { knowledgeLibraryHelp } from '../HelpSystem/helpContent';

// ==================== TIPOS ====================

interface KnowledgeItem {
  id: number;
  titulo: string;
  resumen?: string;
  categoria: string;
  subcategoria: string;
  tags: string[];
  fuente_tipo: string;
  fuente_url?: string;
  fecha_carga: string;
  similitud?: number;
}

interface KnowledgeStats {
  total_documentos: number;
  por_categoria: Record<string, number>;
  por_tipo: Record<string, number>;
  ultimo_cargado?: {
    titulo: string;
    categoria: string;
    fecha: string;
  };
}

type UploadTab = 'archivo' | 'web' | 'youtube' | 'texto';
type ViewTab = 'cargar' | 'explorar' | 'estadisticas';

// ==================== CONFIG ====================

const API_BASE = import.meta.env.VITE_ML_API_URL || 'http://localhost:8000';

const CATEGORIA_COLORS: Record<string, string> = {
  'Logística': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'Dropshipping': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  'Tecnología': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  'Operaciones': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  'Legal y Compliance': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  'Mercados': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
};

const TIPO_ICONS: Record<string, React.ReactNode> = {
  'archivo': <FileText size={16} />,
  'web': <Globe size={16} />,
  'youtube': <Youtube size={16} />,
  'texto': <FileText size={16} />,
};

// ==================== COMPONENTE PRINCIPAL ====================

const BibliotecaConocimientoTab: React.FC = () => {
  // Estado general
  const [viewTab, setViewTab] = useState<ViewTab>('cargar');
  const [uploadTab, setUploadTab] = useState<UploadTab>('archivo');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Estado de carga
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [webUrl, setWebUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [textoTitulo, setTextoTitulo] = useState('');
  const [textoContenido, setTextoContenido] = useState('');
  const [requiresLogin, setRequiresLogin] = useState(false);

  // Estado de exploración
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<KnowledgeItem[]>([]);
  const [knowledgeList, setKnowledgeList] = useState<KnowledgeItem[]>([]);
  const [selectedCategoria, setSelectedCategoria] = useState<string | null>(null);

  // Estado de estadísticas
  const [stats, setStats] = useState<KnowledgeStats | null>(null);

  // ==================== EFECTOS ====================

  useEffect(() => {
    if (viewTab === 'explorar') {
      loadKnowledgeList();
    } else if (viewTab === 'estadisticas') {
      loadStats();
    }
  }, [viewTab]);

  // ==================== FUNCIONES API ====================

  const loadKnowledgeList = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        limite: '50',
        pagina: '1',
        orden: 'fecha_desc'
      });
      if (selectedCategoria) {
        params.append('categoria', selectedCategoria);
      }

      const response = await fetch(`${API_BASE}/api/knowledge/list?${params}`);
      const data = await response.json();
      setKnowledgeList(data.items || []);
    } catch (error) {
      console.error('Error cargando lista:', error);
      showMessage('error', 'Error al cargar la lista de conocimiento');
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/knowledge/stats/overview`);
      const data = await response.json();
      setStats(data.estadisticas);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
      showMessage('error', 'Error al cargar las estadísticas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        q: searchQuery,
        limite: '20'
      });

      const response = await fetch(`${API_BASE}/api/knowledge/search?${params}`);
      const data = await response.json();
      setSearchResults(data.resultados || []);
    } catch (error) {
      console.error('Error en búsqueda:', error);
      showMessage('error', 'Error al buscar');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadFile = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('archivo', selectedFile);

      const response = await fetch(`${API_BASE}/api/knowledge/upload`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        showMessage('success', `Archivo cargado: ${data.titulo} (${data.categoria})`);
        setSelectedFile(null);
      } else {
        throw new Error(data.error || 'Error al cargar archivo');
      }
    } catch (error: any) {
      showMessage('error', error.message || 'Error al cargar archivo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleScrapeWeb = async () => {
    if (!webUrl.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/knowledge/scrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: webUrl,
          con_login: requiresLogin
        })
      });

      const data = await response.json();

      if (data.success) {
        showMessage('success', `Página extraída: ${data.titulo} (${data.categoria})`);
        setWebUrl('');
      } else {
        throw new Error(data.error || 'Error al extraer página');
      }
    } catch (error: any) {
      showMessage('error', error.message || 'Error al extraer página');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExtractYouTube = async () => {
    if (!youtubeUrl.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/knowledge/youtube`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: youtubeUrl })
      });

      const data = await response.json();

      if (data.success) {
        showMessage('success', `Video extraído: ${data.titulo} (${data.categoria})`);
        setYoutubeUrl('');
      } else {
        throw new Error(data.error || 'Error al extraer video');
      }
    } catch (error: any) {
      showMessage('error', error.message || 'Error al extraer video');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveText = async () => {
    if (!textoTitulo.trim() || !textoContenido.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/knowledge/text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: textoTitulo,
          contenido: textoContenido
        })
      });

      const data = await response.json();

      if (data.success) {
        showMessage('success', `Texto guardado: ${data.titulo} (${data.categoria})`);
        setTextoTitulo('');
        setTextoContenido('');
      } else {
        throw new Error(data.error || 'Error al guardar texto');
      }
    } catch (error: any) {
      showMessage('error', error.message || 'Error al guardar texto');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este conocimiento?')) return;

    try {
      const response = await fetch(`${API_BASE}/api/knowledge/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        showMessage('success', 'Conocimiento eliminado');
        loadKnowledgeList();
      }
    } catch (error) {
      showMessage('error', 'Error al eliminar');
    }
  };

  // ==================== HELPERS ====================

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('es-CO', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  // ==================== RENDER ====================

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <HelpTooltip {...knowledgeLibraryHelp.biblioteca}>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <BookOpen className="text-blue-600" />
            Biblioteca de Conocimiento
          </h1>
        </HelpTooltip>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Carga información desde múltiples fuentes para que los agentes IA aprendan
        </p>
      </div>

      {/* Mensaje de estado */}
      {message && (
        <div
          className={`mb-4 p-4 rounded-lg flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          }`}
        >
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          {message.text}
        </div>
      )}

      {/* Tabs principales */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">
        <HelpTooltip content="Carga nuevo conocimiento desde archivos, web o YouTube">
          <button
            onClick={() => setViewTab('cargar')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
              viewTab === 'cargar'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
            }`}
          >
            <Upload size={18} />
            Cargar
          </button>
        </HelpTooltip>

        <HelpTooltip content="Explora y busca en todo el conocimiento cargado">
          <button
            onClick={() => setViewTab('explorar')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
              viewTab === 'explorar'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
            }`}
          >
            <Search size={18} />
            Explorar
          </button>
        </HelpTooltip>

        <HelpTooltip content="Ve estadísticas y métricas del conocimiento">
          <button
            onClick={() => setViewTab('estadisticas')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
              viewTab === 'estadisticas'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
            }`}
          >
            <BarChart3 size={18} />
            Estadísticas
          </button>
        </HelpTooltip>
      </div>

      {/* Contenido según tab */}
      {viewTab === 'cargar' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel izquierdo - Tipos de carga */}
          <div className="space-y-4">
            {/* Archivo */}
            <HelpTooltip {...knowledgeLibraryHelp.cargarArchivo} position="right">
              <div
                onClick={() => setUploadTab('archivo')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  uploadTab === 'archivo'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <FileText className="text-blue-600" size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-white">Archivo</h3>
                    <p className="text-sm text-gray-500">PDF, DOCX, TXT, etc.</p>
                  </div>
                </div>
              </div>
            </HelpTooltip>

            {/* Web */}
            <HelpTooltip {...knowledgeLibraryHelp.cargarWeb} position="right">
              <div
                onClick={() => setUploadTab('web')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  uploadTab === 'web'
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                    <Globe className="text-green-600" size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-white">Página Web</h3>
                    <p className="text-sm text-gray-500">Cualquier URL</p>
                  </div>
                </div>
              </div>
            </HelpTooltip>

            {/* YouTube */}
            <HelpTooltip {...knowledgeLibraryHelp.cargarYouTube} position="right">
              <div
                onClick={() => setUploadTab('youtube')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  uploadTab === 'youtube'
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                    : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                    <Youtube className="text-red-600" size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-white">YouTube</h3>
                    <p className="text-sm text-gray-500">Extrae transcripción</p>
                  </div>
                </div>
              </div>
            </HelpTooltip>

            {/* Texto directo */}
            <HelpTooltip
              title="Texto Directo"
              content="Escribe o pega texto directamente para guardarlo en la biblioteca."
              tips={['Ideal para notas internas', 'Procesos documentados', 'Aprendizajes del equipo']}
              position="right"
            >
              <div
                onClick={() => setUploadTab('texto')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  uploadTab === 'texto'
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                    <FileText className="text-purple-600" size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-white">Texto</h3>
                    <p className="text-sm text-gray-500">Escribir directamente</p>
                  </div>
                </div>
              </div>
            </HelpTooltip>
          </div>

          {/* Panel derecho - Formulario según tipo */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              {/* Archivo */}
              {uploadTab === 'archivo' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                    <FileText className="text-blue-600" />
                    Cargar Archivo
                  </h3>

                  <div
                    className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-blue-500 transition-colors cursor-pointer"
                    onClick={() => document.getElementById('file-input')?.click()}
                  >
                    <input
                      id="file-input"
                      type="file"
                      className="hidden"
                      accept=".pdf,.docx,.doc,.txt,.md,.csv,.json"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    />
                    <Upload className="mx-auto text-gray-400 mb-4" size={48} />
                    <p className="text-gray-600 dark:text-gray-400">
                      {selectedFile ? selectedFile.name : 'Arrastra un archivo o click para seleccionar'}
                    </p>
                    <p className="text-sm text-gray-400 mt-2">
                      PDF, DOCX, TXT, MD, CSV, JSON (max 50MB)
                    </p>
                  </div>

                  <button
                    onClick={handleUploadFile}
                    disabled={!selectedFile || isLoading}
                    className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
                    {isLoading ? 'Procesando...' : 'Cargar Archivo'}
                  </button>
                </div>
              )}

              {/* Web */}
              {uploadTab === 'web' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                    <Globe className="text-green-600" />
                    Extraer de Página Web
                  </h3>

                  <input
                    type="url"
                    value={webUrl}
                    onChange={(e) => setWebUrl(e.target.value)}
                    placeholder="https://ejemplo.com/documentacion"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />

                  <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={requiresLogin}
                      onChange={(e) => setRequiresLogin(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    La página requiere login
                  </label>

                  <button
                    onClick={handleScrapeWeb}
                    disabled={!webUrl.trim() || isLoading}
                    className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Globe size={20} />}
                    {isLoading ? 'Extrayendo...' : 'Extraer Contenido'}
                  </button>
                </div>
              )}

              {/* YouTube */}
              {uploadTab === 'youtube' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                    <Youtube className="text-red-600" />
                    Extraer de YouTube
                  </h3>

                  <input
                    type="url"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />

                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 flex items-center gap-2">
                      <Lightbulb size={16} />
                      Solo funcionan videos con subtítulos disponibles
                    </p>
                  </div>

                  <button
                    onClick={handleExtractYouTube}
                    disabled={!youtubeUrl.trim() || isLoading}
                    className="w-full py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Youtube size={20} />}
                    {isLoading ? 'Extrayendo...' : 'Extraer Transcripción'}
                  </button>
                </div>
              )}

              {/* Texto */}
              {uploadTab === 'texto' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                    <FileText className="text-purple-600" />
                    Guardar Texto
                  </h3>

                  <input
                    type="text"
                    value={textoTitulo}
                    onChange={(e) => setTextoTitulo(e.target.value)}
                    placeholder="Título del contenido"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />

                  <textarea
                    value={textoContenido}
                    onChange={(e) => setTextoContenido(e.target.value)}
                    placeholder="Escribe o pega el contenido aquí..."
                    rows={8}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  />

                  <button
                    onClick={handleSaveText}
                    disabled={!textoTitulo.trim() || !textoContenido.trim() || isLoading}
                    className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? <Loader2 className="animate-spin" size={20} /> : <FileText size={20} />}
                    {isLoading ? 'Guardando...' : 'Guardar Texto'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Vista Explorar */}
      {viewTab === 'explorar' && (
        <div className="space-y-6">
          {/* Barra de búsqueda */}
          <HelpTooltip {...knowledgeLibraryHelp.busqueda}>
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Buscar en la biblioteca de conocimiento..."
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={isLoading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Buscar'}
              </button>
              <button
                onClick={loadKnowledgeList}
                disabled={isLoading}
                className="px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <RefreshCw size={20} />
              </button>
            </div>
          </HelpTooltip>

          {/* Resultados de búsqueda o lista */}
          <div className="grid gap-4">
            {(searchResults.length > 0 ? searchResults : knowledgeList).map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-gray-400">{TIPO_ICONS[item.fuente_tipo] || <FileText size={16} />}</span>
                      <h3 className="font-semibold text-gray-800 dark:text-white">{item.titulo}</h3>
                      {item.similitud && (
                        <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-0.5 rounded">
                          {Math.round(item.similitud * 100)}% relevante
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                      {item.resumen}
                    </p>

                    <div className="flex items-center gap-4 text-sm">
                      <span className={`px-2 py-1 rounded ${CATEGORIA_COLORS[item.categoria] || 'bg-gray-100 text-gray-800'}`}>
                        {item.categoria}
                      </span>
                      <span className="text-gray-400 flex items-center gap-1">
                        <Calendar size={14} />
                        {formatDate(item.fecha_carga)}
                      </span>
                      {item.fuente_url && (
                        <a
                          href={item.fuente_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <ExternalLink size={14} />
                          Ver fuente
                        </a>
                      )}
                    </div>

                    {item.tags && item.tags.length > 0 && (
                      <div className="flex items-center gap-2 mt-3">
                        <Tag size={14} className="text-gray-400" />
                        {item.tags.slice(0, 5).map((tag, idx) => (
                          <span
                            key={idx}
                            className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-gray-400 hover:text-red-500 p-2"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}

            {knowledgeList.length === 0 && searchResults.length === 0 && !isLoading && (
              <div className="text-center py-12">
                <BookOpen className="mx-auto text-gray-300 mb-4" size={64} />
                <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400">
                  La biblioteca está vacía
                </h3>
                <p className="text-gray-400 mt-2">
                  Comienza cargando contenido desde archivos, web o YouTube
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Vista Estadísticas */}
      {viewTab === 'estadisticas' && stats && (
        <div className="space-y-6">
          {/* Resumen general */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-sm text-gray-500">Total Documentos</p>
              <p className="text-3xl font-bold text-gray-800 dark:text-white">{stats.total_documentos}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-sm text-gray-500">Categorías</p>
              <p className="text-3xl font-bold text-blue-600">{Object.keys(stats.por_categoria).length}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-sm text-gray-500">Tipos de Fuente</p>
              <p className="text-3xl font-bold text-green-600">{Object.keys(stats.por_tipo).length}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-sm text-gray-500">Último Cargado</p>
              <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                {stats.ultimo_cargado?.titulo || 'N/A'}
              </p>
            </div>
          </div>

          {/* Por categoría */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <Folder className="text-blue-600" />
              Documentos por Categoría
            </h3>
            <div className="space-y-3">
              {Object.entries(stats.por_categoria).map(([cat, count]) => (
                <div key={cat} className="flex items-center gap-4">
                  <span className={`px-3 py-1 rounded-lg ${CATEGORIA_COLORS[cat] || 'bg-gray-100 text-gray-800'}`}>
                    {cat}
                  </span>
                  <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full"
                      style={{ width: `${(count / stats.total_documentos) * 100}%` }}
                    />
                  </div>
                  <span className="text-gray-600 dark:text-gray-400 w-12 text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Por tipo */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <FileText className="text-green-600" />
              Documentos por Tipo de Fuente
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(stats.por_tipo).map(([tipo, count]) => (
                <div
                  key={tipo}
                  className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 text-center"
                >
                  <div className="text-3xl mb-2">{TIPO_ICONS[tipo] || <FileText size={24} />}</div>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">{count}</p>
                  <p className="text-sm text-gray-500 capitalize">{tipo}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && viewTab !== 'cargar' && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-blue-600" size={40} />
        </div>
      )}
    </div>
  );
};

export default BibliotecaConocimientoTab;
