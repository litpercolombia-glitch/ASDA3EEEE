// ============================================
// LITPER PRO - SESSION MANAGER COMPONENT
// Guardar y restaurar sesiones de trabajo
// ============================================

import React, { useState, useEffect } from 'react';
import {
  Save,
  FolderOpen,
  Trash2,
  Clock,
  Download,
  Upload,
  X,
  Check,
  AlertCircle,
  FileText,
  Database,
  History,
  Star,
  Search,
  MoreVertical,
  RefreshCw,
} from 'lucide-react';
import { documentProcessor, SessionData } from '../../services/documentProcessingService';

interface SessionManagerProps {
  tabId: string;
  tabName: string;
  currentData: any;
  onRestore: (data: any) => void;
  onDataChange?: () => void;
  compact?: boolean;
}

export const SessionManager: React.FC<SessionManagerProps> = ({
  tabId,
  tabName,
  currentData,
  onRestore,
  onDataChange,
  compact = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [newSessionName, setNewSessionName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'save' | 'load'>('save');

  // Cargar sesiones al montar
  useEffect(() => {
    loadSessions();
  }, [tabId]);

  const loadSessions = () => {
    const tabSessions = documentProcessor.getSessions(tabId);
    setSessions(tabSessions);
  };

  // Guardar sesión
  const handleSave = () => {
    if (!currentData || Object.keys(currentData).length === 0) {
      setSavedMessage('No hay datos para guardar');
      setTimeout(() => setSavedMessage(''), 3000);
      return;
    }

    setIsSaving(true);

    try {
      const name = newSessionName.trim() || `${tabName} - ${new Date().toLocaleString('es-CO')}`;
      const recordCount = Array.isArray(currentData)
        ? currentData.length
        : typeof currentData === 'object'
          ? Object.keys(currentData).length
          : 1;

      documentProcessor.saveSession(
        tabId,
        name,
        currentData,
        `${recordCount} registros guardados`
      );

      setSavedMessage('Sesion guardada exitosamente');
      setNewSessionName('');
      loadSessions();

      if (onDataChange) onDataChange();

      setTimeout(() => setSavedMessage(''), 3000);
    } catch (error) {
      setSavedMessage('Error al guardar');
      setTimeout(() => setSavedMessage(''), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  // Restaurar sesión
  const handleRestore = (session: SessionData) => {
    onRestore(session.data);
    setIsOpen(false);
    setSavedMessage(`Sesion "${session.name}" restaurada`);
    setTimeout(() => setSavedMessage(''), 3000);
  };

  // Eliminar sesión
  const handleDelete = (id: string) => {
    if (confirm('Eliminar esta sesion guardada?')) {
      documentProcessor.deleteSession(id);
      loadSessions();
    }
  };

  // Exportar sesión
  const handleExport = (session: SessionData) => {
    const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${session.name.replace(/[^a-z0-9]/gi, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filtrar sesiones
  const filteredSessions = sessions.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Formatear fecha
  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Versión compacta (solo botones)
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {savedMessage && (
          <span className={`text-xs px-2 py-1 rounded-full animate-fade-in ${savedMessage.includes('Error') ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
            }`}>
            {savedMessage}
          </span>
        )}

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-medium transition-all disabled:opacity-50"
          title="Guardar sesión"
        >
          <Save className="w-3.5 h-3.5" />
          {isSaving ? 'Guardando...' : 'Guardar'}
        </button>

        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-medium transition-all"
          title="Cargar sesión"
        >
          <FolderOpen className="w-3.5 h-3.5" />
          Cargar
          {sessions.length > 0 && (
            <span className="px-1.5 py-0.5 bg-white/20 rounded-full text-[10px]">
              {sessions.length}
            </span>
          )}
        </button>

        {/* Modal de sesiones */}
        {isOpen && (
          <SessionModal
            sessions={filteredSessions}
            onClose={() => setIsOpen(false)}
            onRestore={handleRestore}
            onDelete={handleDelete}
            onExport={handleExport}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            formatDate={formatDate}
          />
        )}
      </div>
    );
  }

  // Versión completa (panel)
  return (
    <div className="bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-700 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Gestor de Sesiones</h3>
              <p className="text-xs text-blue-100">Guarda y restaura tu trabajo</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-medium text-white">
            {sessions.length} guardadas
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-navy-700">
        <button
          onClick={() => setActiveTab('save')}
          className={`flex-1 py-3 text-sm font-medium transition-all ${activeTab === 'save'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20'
              : 'text-slate-500 hover:text-slate-700'
            }`}
        >
          <Save className="w-4 h-4 inline mr-2" />
          Guardar Nueva
        </button>
        <button
          onClick={() => setActiveTab('load')}
          className={`flex-1 py-3 text-sm font-medium transition-all ${activeTab === 'load'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20'
              : 'text-slate-500 hover:text-slate-700'
            }`}
        >
          <History className="w-4 h-4 inline mr-2" />
          Historial ({sessions.length})
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {savedMessage && (
          <div className={`mb-4 p-3 rounded-xl flex items-center gap-2 ${savedMessage.includes('Error')
              ? 'bg-red-50 text-red-600 border border-red-200'
              : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
            }`}>
            {savedMessage.includes('Error') ? (
              <AlertCircle className="w-4 h-4" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            <span className="text-sm font-medium">{savedMessage}</span>
          </div>
        )}

        {activeTab === 'save' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Nombre de la sesion (opcional)
              </label>
              <input
                type="text"
                value={newSessionName}
                onChange={(e) => setNewSessionName(e.target.value)}
                placeholder={`${tabName} - ${new Date().toLocaleDateString('es-CO')}`}
                className="w-full px-4 py-3 border border-slate-200 dark:border-navy-600 rounded-xl bg-white dark:bg-navy-800 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="bg-slate-50 dark:bg-navy-800 rounded-xl p-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Vista previa de datos:</p>
              <div className="text-sm text-slate-700 dark:text-slate-300">
                {currentData ? (
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-500" />
                    <span>
                      {Array.isArray(currentData)
                        ? `${currentData.length} registros`
                        : `${Object.keys(currentData).length} campos`}
                    </span>
                  </div>
                ) : (
                  <span className="text-slate-400">Sin datos cargados</span>
                )}
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={isSaving || !currentData}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-lg shadow-emerald-500/30"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Guardar Sesión
                </>
              )}
            </button>
          </div>
        )}

        {activeTab === 'load' && (
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar sesiones..."
                className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-navy-600 rounded-xl bg-white dark:bg-navy-800 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
            </div>

            {/* Sessions list */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {filteredSessions.length === 0 ? (
                <div className="text-center py-8">
                  <History className="w-12 h-12 mx-auto text-slate-300 dark:text-navy-600 mb-3" />
                  <p className="text-slate-500 dark:text-slate-400 text-sm">
                    {sessions.length === 0 ? 'No hay sesiones guardadas' : 'No se encontraron resultados'}
                  </p>
                </div>
              ) : (
                filteredSessions.map((session) => (
                  <div
                    key={session.id}
                    className="group p-4 bg-slate-50 dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-navy-700 hover:border-blue-400 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-slate-700 dark:text-white truncate">
                          {session.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-slate-500">
                            <Clock className="w-3 h-3 inline mr-1" />
                            {formatDate(session.createdAt)}
                          </span>
                          <span className="text-xs text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
                            {session.metadata.recordCount} registros
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleRestore(session)}
                          className="p-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                          title="Restaurar"
                        >
                          <Upload className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleExport(session)}
                          className="p-1.5 bg-slate-200 dark:bg-navy-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-300"
                          title="Exportar"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(session.id)}
                          className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Modal para la versión compacta
const SessionModal: React.FC<{
  sessions: SessionData[];
  onClose: () => void;
  onRestore: (session: SessionData) => void;
  onDelete: (id: string) => void;
  onExport: (session: SessionData) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  formatDate: (date: Date | string) => string;
}> = ({ sessions, onClose, onRestore, onDelete, onExport, searchQuery, setSearchQuery, formatDate }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-navy-900 rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden shadow-2xl animate-scale-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Database className="w-6 h-6 text-white" />
            <h3 className="text-lg font-bold text-white">Sesiones Guardadas</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-200 dark:border-navy-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar sesiones..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-navy-600 rounded-xl bg-white dark:bg-navy-800 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
          </div>
        </div>

        {/* Sessions */}
        <div className="p-4 max-h-96 overflow-y-auto space-y-2">
          {sessions.length === 0 ? (
            <div className="text-center py-8">
              <History className="w-12 h-12 mx-auto text-slate-300 dark:text-navy-600 mb-3" />
              <p className="text-slate-500 dark:text-slate-400">No hay sesiones guardadas</p>
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className="group p-4 bg-slate-50 dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-navy-700 hover:border-blue-400 transition-all cursor-pointer"
                onClick={() => onRestore(session)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-slate-700 dark:text-white truncate">
                      {session.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-500">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {formatDate(session.createdAt)}
                      </span>
                      <span className="text-xs text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
                        {session.metadata.recordCount} registros
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onExport(session)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      title="Exportar"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(session.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SessionManager;
