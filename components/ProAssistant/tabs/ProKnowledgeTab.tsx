// components/ProAssistant/tabs/ProKnowledgeTab.tsx
// Tab de gestion de conocimiento del Asistente PRO
import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  Globe,
  Video,
  FileEdit,
  Trash2,
  Eye,
  Search,
  Plus,
  X,
  Loader2,
  CheckCircle,
  Clock,
  Tag,
  BookOpen,
  Brain,
  Sparkles,
  Link,
  File,
  AlertCircle,
} from 'lucide-react';
import { useProAssistantStore, ProKnowledge } from '../../../stores/proAssistantStore';

// ============================================
// TIPOS DE FUENTES
// ============================================
const sourceTypes = [
  {
    id: 'document',
    label: 'Documento',
    icon: FileText,
    accept: '.pdf,.docx,.txt,.xlsx,.csv',
    color: 'blue',
  },
  { id: 'url', label: 'URL', icon: Globe, accept: '', color: 'green' },
  { id: 'video', label: 'Video', icon: Video, accept: '', color: 'red' },
  { id: 'text', label: 'Texto', icon: FileEdit, accept: '', color: 'purple' },
];

// ============================================
// COMPONENTE DE ITEM DE CONOCIMIENTO
// ============================================
const KnowledgeItem: React.FC<{
  item: ProKnowledge;
  onView: () => void;
  onDelete: () => void;
}> = ({ item, onView, onDelete }) => {
  const getTypeIcon = () => {
    switch (item.type) {
      case 'document':
        return <FileText className="w-4 h-4" />;
      case 'url':
        return <Globe className="w-4 h-4" />;
      case 'video':
        return <Video className="w-4 h-4" />;
      case 'text':
        return <FileEdit className="w-4 h-4" />;
      default:
        return <File className="w-4 h-4" />;
    }
  };

  const getTypeColor = () => {
    switch (item.type) {
      case 'document':
        return 'bg-blue-500/20 text-blue-400';
      case 'url':
        return 'bg-green-500/20 text-green-400';
      case 'video':
        return 'bg-red-500/20 text-red-400';
      case 'text':
        return 'bg-purple-500/20 text-purple-400';
      default:
        return 'bg-slate-500/20 text-slate-400';
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Hoy';
    if (days === 1) return 'Ayer';
    if (days < 7) return `Hace ${days} dias`;
    if (days < 30) return `Hace ${Math.floor(days / 7)} semanas`;
    return `Hace ${Math.floor(days / 30)} meses`;
  };

  return (
    <div className="p-4 bg-slate-800/50 hover:bg-slate-800 rounded-xl border border-slate-700/50 transition-all group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Icono de tipo */}
          <div className={`p-2 rounded-lg ${getTypeColor()}`}>{getTypeIcon()}</div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-white truncate">{item.title}</h4>
            <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
              {item.summary || 'Sin resumen disponible'}
            </p>

            {/* Metadata */}
            <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDate(item.createdAt)}
              </span>
              {item.metadata?.pages && <span>{item.metadata.pages} paginas</span>}
              {item.metadata?.words && <span>{item.metadata.words} palabras</span>}
            </div>

            {/* Tags */}
            {item.tags && item.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {item.tags.slice(0, 3).map((tag, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 bg-slate-700/50 text-slate-400 text-[10px] rounded-full"
                  >
                    {tag}
                  </span>
                ))}
                {item.tags.length > 3 && (
                  <span className="px-2 py-0.5 text-slate-500 text-[10px]">
                    +{item.tags.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onView}
            className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
            title="Ver detalle"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 hover:bg-red-500/20 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
            title="Eliminar"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// MODAL DE SUBIDA
// ============================================
const UploadModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onUpload: (data: Partial<ProKnowledge>) => void;
}> = ({ isOpen, onClose, onUpload }) => {
  const [activeType, setActiveType] = useState<'document' | 'url' | 'video' | 'text'>('document');
  const [urlInput, setUrlInput] = useState('');
  const [textInput, setTextInput] = useState('');
  const [titleInput, setTitleInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);

    // Simular procesamiento
    await new Promise((r) => setTimeout(r, 2000));

    onUpload({
      type: 'document',
      title: file.name,
      content: `Contenido procesado de ${file.name}`,
      summary: `Documento ${file.type} con ${Math.round(file.size / 1024)} KB`,
      source: file.name,
      tags: ['documento', file.type.split('/')[1] || 'archivo'],
      metadata: {
        pages: Math.floor(Math.random() * 20) + 1,
        words: Math.floor(Math.random() * 5000) + 500,
      },
    });

    setIsProcessing(false);
    onClose();
  };

  const handleUrlSubmit = async () => {
    if (!urlInput.trim()) return;

    setIsProcessing(true);
    await new Promise((r) => setTimeout(r, 2000));

    onUpload({
      type: 'url',
      title: titleInput || new URL(urlInput).hostname,
      content: `Contenido extraido de ${urlInput}`,
      summary: `Web scraping de ${new URL(urlInput).hostname}`,
      source: urlInput,
      tags: ['web', 'url', new URL(urlInput).hostname],
    });

    setIsProcessing(false);
    setUrlInput('');
    setTitleInput('');
    onClose();
  };

  const handleTextSubmit = async () => {
    if (!textInput.trim()) return;

    setIsProcessing(true);
    await new Promise((r) => setTimeout(r, 1000));

    onUpload({
      type: 'text',
      title: titleInput || 'Nota de texto',
      content: textInput,
      summary: textInput.substring(0, 100) + '...',
      source: 'Manual',
      tags: ['texto', 'nota'],
      metadata: {
        words: textInput.split(/\s+/).length,
      },
    });

    setIsProcessing(false);
    setTextInput('');
    setTitleInput('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-white">Agregar Conocimiento</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tipo de fuente */}
        <div className="flex border-b border-slate-700">
          {sourceTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setActiveType(type.id as any)}
              className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 text-sm transition-all ${
                activeType === type.id
                  ? 'text-amber-400 border-b-2 border-amber-400 bg-amber-500/10'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <type.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{type.label}</span>
            </button>
          ))}
        </div>

        {/* Contenido */}
        <div className="p-4">
          {activeType === 'document' && (
            <div className="text-center py-8">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt,.xlsx,.csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-amber-500/50 rounded-xl p-8 cursor-pointer transition-colors"
              >
                {isProcessing ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-12 h-12 text-amber-400 animate-spin" />
                    <p className="text-slate-400">Procesando documento...</p>
                  </div>
                ) : (
                  <>
                    <Upload className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                    <p className="text-slate-300 font-medium">Arrastra archivos aqui o haz clic</p>
                    <p className="text-xs text-slate-500 mt-1">.pdf .docx .txt .xlsx .csv</p>
                  </>
                )}
              </div>
            </div>
          )}

          {activeType === 'url' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Titulo (opcional)
                </label>
                <input
                  type="text"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  placeholder="Nombre descriptivo..."
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">URL</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://..."
                    className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    onClick={handleUrlSubmit}
                    disabled={!urlInput.trim() || isProcessing}
                    className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Analizar'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeType === 'video' && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                <div className="flex items-center gap-2 text-amber-400 mb-2">
                  <AlertCircle className="w-4 h-4" />
                  <span className="font-medium text-sm">Funcion Premium</span>
                </div>
                <p className="text-xs text-slate-400">
                  La transcripcion de videos requiere integracion con Whisper API. Soporta YouTube,
                  Vimeo y videos locales.
                </p>
              </div>
              <input
                type="text"
                placeholder="URL del video (YouTube, Vimeo)..."
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          )}

          {activeType === 'text' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Titulo</label>
                <input
                  type="text"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  placeholder="Titulo de la nota..."
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Contenido</label>
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Escribe o pega el texto aqui..."
                  rows={6}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>
              <button
                onClick={handleTextSubmit}
                disabled={!textInput.trim() || isProcessing}
                className="w-full px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Procesando...
                  </span>
                ) : (
                  'Guardar Conocimiento'
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
const ProKnowledgeTab: React.FC = () => {
  const { knowledge, addKnowledge, removeKnowledge, searchKnowledge } = useProAssistantStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ProKnowledge | null>(null);

  const filteredKnowledge = searchQuery ? searchKnowledge(searchQuery) : knowledge;

  const handleUpload = (data: Partial<ProKnowledge>) => {
    addKnowledge({
      type: data.type || 'text',
      title: data.title || 'Sin titulo',
      content: data.content || '',
      summary: data.summary || '',
      tags: data.tags || [],
      source: data.source || '',
      metadata: data.metadata,
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* ============================================ */}
      {/* HEADER */}
      {/* ============================================ */}
      <div className="p-4 border-b border-slate-700/50">
        {/* Boton agregar */}
        <button
          onClick={() => setShowUploadModal(true)}
          className="w-full mb-4 px-4 py-3 bg-gradient-to-r from-amber-500/20 to-orange-500/20
            border border-amber-500/30 hover:border-amber-500/50
            rounded-xl text-amber-400 font-medium
            flex items-center justify-center gap-2
            transition-all hover:bg-amber-500/30"
        >
          <Plus className="w-5 h-5" />
          Agregar Conocimiento
        </button>

        {/* Busqueda */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar en conocimiento..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700
              rounded-xl text-white placeholder-slate-500 text-sm
              focus:outline-none focus:border-amber-500/50"
          />
        </div>
      </div>

      {/* ============================================ */}
      {/* LISTA DE CONOCIMIENTO */}
      {/* ============================================ */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredKnowledge.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-slate-400 font-medium mb-1">
              {searchQuery ? 'No se encontraron resultados' : 'Base de conocimiento vacia'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {searchQuery
                ? 'Intenta con otros terminos de busqueda'
                : 'Agrega documentos, URLs o notas para entrenar al asistente'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-4 py-2 bg-slate-800 text-slate-300 text-sm rounded-lg hover:bg-slate-700 transition-colors"
              >
                Agregar primer item
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {/* Header de lista */}
            <div className="flex items-center justify-between px-1 text-xs text-slate-500">
              <span>{filteredKnowledge.length} items</span>
              <span>
                {Math.round(
                  filteredKnowledge.reduce((acc, k) => acc + (k.content?.length || 0), 0) / 1024
                )}{' '}
                KB
              </span>
            </div>

            {/* Items */}
            {filteredKnowledge.map((item) => (
              <KnowledgeItem
                key={item.id}
                item={item}
                onView={() => setSelectedItem(item)}
                onDelete={() => removeKnowledge(item.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ============================================ */}
      {/* MODAL DE SUBIDA */}
      {/* ============================================ */}
      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUpload={handleUpload}
      />

      {/* ============================================ */}
      {/* MODAL DE DETALLE */}
      {/* ============================================ */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h3 className="font-bold text-white truncate">{selectedItem.title}</h3>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              <p className="text-sm text-slate-300 whitespace-pre-wrap">{selectedItem.content}</p>
              {selectedItem.tags && selectedItem.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-700">
                  {selectedItem.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-slate-800 text-slate-400 text-xs rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProKnowledgeTab;
