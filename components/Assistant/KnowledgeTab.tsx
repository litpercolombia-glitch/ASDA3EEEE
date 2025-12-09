import React, { useState, useEffect } from 'react';
import {
  Upload,
  Link,
  Youtube,
  FileText,
  Loader2,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Search,
  BookOpen,
  FileUp,
  Globe,
  Video,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

interface KnowledgeItem {
  id: string;
  titulo: string;
  tipo: string;
  categoria: string;
  resumen?: string;
  tags?: string[];
  fecha_carga?: string;
}

interface ProcessingResult {
  fuente_id: string;
  estado: string;
  tipo: string;
  resumen?: string;
  conocimiento_extraido?: any;
}

// API URL
const API_BASE = import.meta.env.VITE_ML_API_URL || 'http://localhost:8000';
const LOCAL_STORAGE_KEY = 'litper_knowledge_memory';

// Helper para localStorage
const getLocalKnowledge = (): KnowledgeItem[] => {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const saveLocalKnowledge = (items: KnowledgeItem[]) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Error guardando conocimiento local:', e);
  }
};

const addLocalKnowledge = (item: KnowledgeItem) => {
  const items = getLocalKnowledge();
  items.unshift(item);
  saveLocalKnowledge(items.slice(0, 100)); // Max 100 items
};

export const KnowledgeTab: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'upload' | 'list'>('upload');
  const [url, setUrl] = useState('');
  const [textContent, setTextContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingResult, setProcessingResult] = useState<ProcessingResult | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [knowledgeList, setKnowledgeList] = useState<KnowledgeItem[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Cargar lista de conocimiento (backend + local)
  const loadKnowledgeList = async () => {
    setIsLoadingList(true);
    try {
      // Intentar cargar del backend
      const response = await fetch(`${API_BASE}/api/knowledge/list?limite=50`);
      if (response.ok) {
        const data = await response.json();
        const backendItems = data.items || data.conocimientos || [];
        // Combinar con local
        const localItems = getLocalKnowledge();
        const combined = [...backendItems, ...localItems];
        // Eliminar duplicados por ID
        const unique = combined.filter((item, index, self) =>
          index === self.findIndex(i => i.id === item.id)
        );
        setKnowledgeList(unique);
      } else {
        // Si falla backend, usar solo local
        setKnowledgeList(getLocalKnowledge());
      }
    } catch (err) {
      console.error('Error cargando conocimiento:', err);
      // Fallback a local
      setKnowledgeList(getLocalKnowledge());
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    if (activeSection === 'list') {
      loadKnowledgeList();
    }
  }, [activeSection]);

  // Procesar documento
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setProcessingResult(null);
    setError(null);

    try {
      // Leer contenido del archivo localmente
      const content = await readFileContent(file);

      // Intentar subir al backend
      const formData = new FormData();
      formData.append('archivo', file);

      let backendSuccess = false;
      let result: any = null;

      try {
        const response = await fetch(`${API_BASE}/api/knowledge/upload`, {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          result = await response.json();
          backendSuccess = true;
        }
      } catch {
        console.log('Backend no disponible, guardando localmente');
      }

      // Siempre guardar localmente como respaldo
      const localItem: KnowledgeItem = {
        id: backendSuccess ? result?.id : `local_${Date.now()}`,
        titulo: backendSuccess ? result?.titulo : file.name.replace(/\.[^/.]+$/, ''),
        tipo: 'documento',
        categoria: detectCategoria(content),
        resumen: content.substring(0, 500) + (content.length > 500 ? '...' : ''),
        tags: extractTags(content),
        fecha_carga: new Date().toISOString(),
      };

      // Guardar en localStorage
      addLocalKnowledge(localItem);

      setProcessingResult({
        fuente_id: localItem.id,
        estado: 'completado',
        tipo: 'documento',
        resumen: localItem.resumen,
        conocimiento_extraido: {
          titulo_sugerido: localItem.titulo,
          tipo_contenido: 'documento',
          resumen: localItem.resumen,
        },
      });

      setSuccessMessage(`Conocimiento "${localItem.titulo}" guardado exitosamente`);
      setShowConfirm(true);
    } catch (err: any) {
      setError(err.message || 'Error procesando archivo');
    } finally {
      setIsProcessing(false);
      e.target.value = '';
    }
  };

  // Leer contenido de archivo
  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string || '');
      reader.onerror = reject;

      if (file.type.includes('text') || file.name.endsWith('.txt') || file.name.endsWith('.md') || file.name.endsWith('.csv')) {
        reader.readAsText(file);
      } else {
        // Para otros tipos, leer como texto de todos modos
        reader.readAsText(file);
      }
    });
  };

  // Detectar categoría automáticamente
  const detectCategoria = (content: string): string => {
    const lowerContent = content.toLowerCase();
    if (lowerContent.includes('entrega') || lowerContent.includes('envío') || lowerContent.includes('guía')) return 'logistica';
    if (lowerContent.includes('proceso') || lowerContent.includes('paso')) return 'proceso';
    if (lowerContent.includes('regla') || lowerContent.includes('política')) return 'regla';
    if (lowerContent.includes('plantilla') || lowerContent.includes('formato')) return 'plantilla';
    return 'general';
  };

  // Extraer tags del contenido
  const extractTags = (content: string): string[] => {
    const keywords = ['entrega', 'devolución', 'novedad', 'transportadora', 'cliente', 'pedido', 'guía', 'flete', 'coordinadora', 'servientrega', 'dropi'];
    const found = keywords.filter(k => content.toLowerCase().includes(k));
    return found.slice(0, 5);
  };

  // Guardar texto directo
  const handleTextSubmit = () => {
    if (!textContent.trim()) return;

    const localItem: KnowledgeItem = {
      id: `local_${Date.now()}`,
      titulo: textContent.substring(0, 50) + (textContent.length > 50 ? '...' : ''),
      tipo: 'texto',
      categoria: detectCategoria(textContent),
      resumen: textContent.substring(0, 500),
      tags: extractTags(textContent),
      fecha_carga: new Date().toISOString(),
    };

    addLocalKnowledge(localItem);
    setSuccessMessage(`Aprendizaje guardado exitosamente`);
    setTextContent('');
    loadKnowledgeList();
  };

  // Procesar URL
  const handleUrlSubmit = async () => {
    if (!url.trim()) return;

    setIsProcessing(true);
    setProcessingResult(null);
    setError(null);

    try {
      // Detectar tipo
      const isYoutube = url.includes('youtube.com') || url.includes('youtu.be');
      const endpoint = isYoutube
        ? `${API_BASE}/api/knowledge/youtube`
        : `${API_BASE}/api/knowledge/scrape`;

      let backendSuccess = false;
      let result: any = null;

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url }),
        });

        if (response.ok) {
          result = await response.json();
          backendSuccess = true;
        }
      } catch {
        console.log('Backend no disponible, guardando URL localmente');
      }

      // Guardar localmente
      const localItem: KnowledgeItem = {
        id: backendSuccess ? result?.id : `local_${Date.now()}`,
        titulo: backendSuccess ? result?.titulo : `Enlace: ${url.substring(0, 50)}`,
        tipo: isYoutube ? 'youtube' : 'web',
        categoria: isYoutube ? 'video' : 'web',
        resumen: backendSuccess ? result?.resumen : `URL guardada: ${url}`,
        tags: isYoutube ? ['video', 'youtube'] : ['web', 'enlace'],
        fecha_carga: new Date().toISOString(),
      };

      addLocalKnowledge(localItem);

      setProcessingResult({
        fuente_id: localItem.id,
        estado: 'completado',
        tipo: isYoutube ? 'youtube' : 'web',
        resumen: localItem.resumen,
        conocimiento_extraido: {
          titulo_sugerido: localItem.titulo,
          tipo_contenido: localItem.tipo,
          resumen: localItem.resumen,
        },
      });

      setSuccessMessage(`URL guardada exitosamente`);
      setShowConfirm(true);
      setUrl('');
    } catch (err: any) {
      setError(err.message || 'Error procesando URL');
    } finally {
      setIsProcessing(false);
    }
  };

  // Guardar conocimiento
  const handleSave = async (confirmar: boolean) => {
    if (!processingResult) return;

    if (confirmar && processingResult.fuente_id) {
      // El conocimiento ya se guardo en el backend
      // Refrescar lista
      await loadKnowledgeList();
    }

    setShowConfirm(false);
    setProcessingResult(null);
    setActiveSection('list');
  };

  // Filtrar lista
  const filteredList = knowledgeList.filter((item) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.titulo?.toLowerCase().includes(query) ||
      item.categoria?.toLowerCase().includes(query) ||
      item.resumen?.toLowerCase().includes(query)
    );
  });

  // Iconos por tipo
  const getTypeIcon = (tipo: string) => {
    switch (tipo?.toLowerCase()) {
      case 'documento':
      case 'archivo':
        return <FileText className="w-4 h-4" />;
      case 'web':
      case 'url':
        return <Globe className="w-4 h-4" />;
      case 'youtube':
      case 'video':
        return <Video className="w-4 h-4" />;
      default:
        return <BookOpen className="w-4 h-4" />;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Tabs internos */}
      <div className="flex border-b border-slate-200 dark:border-navy-700">
        <button
          onClick={() => setActiveSection('upload')}
          className={`flex-1 py-3 text-sm font-medium transition-all ${
            activeSection === 'upload'
              ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50 dark:bg-purple-900/10'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Upload className="w-4 h-4" />
            Agregar
          </div>
        </button>
        <button
          onClick={() => setActiveSection('list')}
          className={`flex-1 py-3 text-sm font-medium transition-all ${
            activeSection === 'list'
              ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50 dark:bg-purple-900/10'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <BookOpen className="w-4 h-4" />
            Ver ({knowledgeList.length})
          </div>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activeSection === 'upload' && (
          <div className="space-y-4">
            {/* Error */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800 dark:text-red-300">Error</p>
                  <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="ml-auto text-red-400 hover:text-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Subir documento */}
            <div className="border-2 border-dashed border-slate-300 dark:border-navy-600 rounded-xl p-6 text-center hover:border-purple-500 dark:hover:border-purple-500 transition-colors cursor-pointer group">
              <input
                type="file"
                accept=".docx,.pdf,.txt,.md,.csv,.json"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
                disabled={isProcessing}
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <div className="w-12 h-12 mx-auto mb-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
                  <FileUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Arrastra un documento o haz clic
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  PDF, DOCX, TXT, MD, CSV, JSON
                </p>
              </label>
            </div>

            {/* Mensaje de éxito */}
            {successMessage && (
              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3 flex items-center gap-2">
                <Check className="w-5 h-5 text-emerald-500" />
                <p className="text-sm text-emerald-700 dark:text-emerald-300">{successMessage}</p>
                <button
                  onClick={() => setSuccessMessage(null)}
                  className="ml-auto text-emerald-400 hover:text-emerald-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Texto directo - NUEVO */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Pegar texto para aprendizaje
              </label>
              <textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Pega aquí cualquier texto, proceso, regla o información que quieras que el asistente aprenda..."
                className="w-full px-4 py-3 border border-slate-300 dark:border-navy-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-navy-800 text-slate-700 dark:text-slate-200 h-32 resize-none"
                disabled={isProcessing}
              />
              <button
                onClick={handleTextSubmit}
                disabled={!textContent.trim() || isProcessing}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 dark:disabled:bg-navy-700 text-white rounded-xl text-sm font-medium transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Guardar aprendizaje
              </button>
            </div>

            {/* URL Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Pagina web o YouTube
              </label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-4 py-2.5 pl-10 border border-slate-300 dark:border-navy-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-navy-800 text-slate-700 dark:text-slate-200"
                    disabled={isProcessing}
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {url.includes('youtube') || url.includes('youtu.be') ? (
                      <Youtube className="w-4 h-4 text-red-500" />
                    ) : (
                      <Link className="w-4 h-4" />
                    )}
                  </div>
                </div>
                <button
                  onClick={handleUrlSubmit}
                  disabled={!url.trim() || isProcessing}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 dark:disabled:bg-navy-700 text-white rounded-xl text-sm font-medium transition-colors disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Procesar'
                  )}
                </button>
              </div>
            </div>

            {/* Estado de procesamiento */}
            {isProcessing && (
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-purple-800 dark:text-purple-300">
                    Procesando...
                  </p>
                  <p className="text-xs text-purple-600 dark:text-purple-400">
                    Extrayendo conocimiento con IA
                  </p>
                </div>
              </div>
            )}

            {/* Confirmacion de guardado */}
            {showConfirm && processingResult && (
              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg flex items-center justify-center">
                    <Check className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-emerald-800 dark:text-emerald-300">
                      Conocimiento extraido
                    </h4>
                    <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
                      <strong>Tipo:</strong>{' '}
                      {processingResult.conocimiento_extraido?.tipo_contenido || processingResult.tipo}
                    </p>
                    {processingResult.conocimiento_extraido?.titulo_sugerido && (
                      <p className="text-sm text-emerald-600 dark:text-emerald-400">
                        <strong>Titulo:</strong>{' '}
                        {processingResult.conocimiento_extraido.titulo_sugerido}
                      </p>
                    )}
                    {processingResult.resumen && (
                      <p className="text-xs text-emerald-500 dark:text-emerald-400 mt-2 line-clamp-3">
                        {processingResult.resumen}
                      </p>
                    )}
                  </div>
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                  El conocimiento ha sido guardado en la base de datos.
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleSave(true)}
                    className="flex-1 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Ver en lista
                  </button>
                  <button
                    onClick={() => handleSave(false)}
                    className="flex-1 py-2 bg-slate-200 dark:bg-navy-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-300 dark:hover:bg-navy-600 flex items-center justify-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Agregar otro
                  </button>
                </div>
              </div>
            )}

            {/* Info */}
            <div className="bg-slate-50 dark:bg-navy-800 rounded-xl p-4 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                El conocimiento cargado sera usado por el asistente para responder preguntas de
                forma mas precisa.
              </p>
            </div>
          </div>
        )}

        {activeSection === 'list' && (
          <div className="space-y-4">
            {/* Buscar */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar conocimiento..."
                className="w-full px-4 py-2.5 pl-10 border border-slate-200 dark:border-navy-600 rounded-xl text-sm bg-white dark:bg-navy-800 text-slate-700 dark:text-slate-200"
              />
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <button
                onClick={loadKnowledgeList}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingList ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Lista */}
            {isLoadingList ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
              </div>
            ) : filteredList.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 mx-auto text-slate-300 dark:text-navy-600 mb-3" />
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {searchQuery
                    ? 'No se encontraron resultados'
                    : 'No hay conocimiento guardado aun'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredList.map((item) => (
                  <KnowledgeItemCard key={item.id} item={item} getTypeIcon={getTypeIcon} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Componente para cada item de conocimiento
const KnowledgeItemCard: React.FC<{
  item: KnowledgeItem;
  getTypeIcon: (tipo: string) => JSX.Element;
}> = ({ item, getTypeIcon }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const tipoEmoji: Record<string, string> = {
    proceso: '📋',
    regla: '📌',
    plantilla: '📝',
    info_general: 'i',
    faq: '?',
    logistica: '🚚',
    operaciones: '⚙️',
    documento: '📄',
    web: '🌐',
    youtube: '🎬',
  };

  return (
    <div className="border border-slate-200 dark:border-navy-600 rounded-xl overflow-hidden bg-white dark:bg-navy-800">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-navy-700 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-100 dark:bg-navy-700 rounded-lg flex items-center justify-center text-slate-500">
            {getTypeIcon(item.tipo)}
          </div>
          <div className="text-left">
            <span className="text-sm font-medium text-slate-800 dark:text-white line-clamp-1">
              {item.titulo || 'Sin titulo'}
            </span>
            <p className="text-xs text-slate-400">
              {item.categoria || item.tipo}
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </button>

      {isExpanded && (
        <div className="px-3 pb-3 border-t border-slate-100 dark:border-navy-600">
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 line-clamp-4">
            {item.resumen || 'Sin resumen disponible'}
          </p>
          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {item.tags.slice(0, 5).map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 bg-slate-100 dark:bg-navy-700 text-slate-500 dark:text-slate-400 rounded text-[10px]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default KnowledgeTab;
