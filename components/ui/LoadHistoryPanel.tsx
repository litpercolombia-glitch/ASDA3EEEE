// ============================================
// LITPER PRO - LOAD HISTORY PANEL
// Panel de historial de cargas con diseño profesional
// ============================================

import React, { useState, useEffect, useMemo } from 'react';
import {
  History,
  Clock,
  FileSpreadsheet,
  Download,
  Upload,
  Trash2,
  X,
  Check,
  Search,
  Calendar,
  Package,
  RefreshCw,
  Eye,
  ChevronDown,
  ChevronUp,
  Star,
  StarOff,
  Filter,
  SlidersHorizontal,
  MoreVertical,
  Copy,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

// ============================================
// TIPOS
// ============================================

export interface LoadEntry {
  id: string;
  name: string;
  type: 'excel' | 'reporte' | 'resumen' | 'guias';
  timestamp: Date;
  recordCount: number;
  data: any;
  metadata?: {
    fileName?: string;
    source?: string;
    description?: string;
  };
  isFavorite?: boolean;
}

interface LoadHistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onRestore: (entry: LoadEntry) => void;
  entries: LoadEntry[];
  onDelete: (id: string) => void;
  onDeleteAll: () => void;
  onToggleFavorite?: (id: string) => void;
}

// ============================================
// STORAGE HELPERS
// ============================================

const STORAGE_KEY = 'litper_load_history';
const MAX_ENTRIES = 20;
const MAX_RECORDS_PER_ENTRY = 500;

export const saveLoadEntry = (entry: Omit<LoadEntry, 'id' | 'timestamp'>): LoadEntry => {
  const entries = getLoadEntries();

  const newEntry: LoadEntry = {
    ...entry,
    id: `load_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date(),
    data: Array.isArray(entry.data)
      ? entry.data.slice(0, MAX_RECORDS_PER_ENTRY)
      : entry.data,
  };

  entries.unshift(newEntry);

  // Mantener máximo de entradas (excluyendo favoritos)
  const favorites = entries.filter(e => e.isFavorite);
  const nonFavorites = entries.filter(e => !e.isFavorite).slice(0, MAX_ENTRIES - favorites.length);
  const limited = [...favorites, ...nonFavorites];

  localStorage.setItem(STORAGE_KEY, JSON.stringify(limited));

  return newEntry;
};

export const getLoadEntries = (): LoadEntry[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    return parsed.map((e: any) => ({
      ...e,
      timestamp: new Date(e.timestamp),
    }));
  } catch {
    return [];
  }
};

export const deleteLoadEntry = (id: string): void => {
  const entries = getLoadEntries().filter(e => e.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
};

export const deleteAllLoadEntries = (): void => {
  const entries = getLoadEntries().filter(e => e.isFavorite);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
};

export const toggleFavorite = (id: string): void => {
  const entries = getLoadEntries().map(e =>
    e.id === id ? { ...e, isFavorite: !e.isFavorite } : e
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export const LoadHistoryPanel: React.FC<LoadHistoryPanelProps> = ({
  isOpen,
  onClose,
  onRestore,
  entries,
  onDelete,
  onDeleteAll,
  onToggleFavorite,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'name'>('newest');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filtrar y ordenar
  const filteredEntries = useMemo(() => {
    let result = entries;

    // Filtrar por búsqueda
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(e =>
        e.name.toLowerCase().includes(query) ||
        e.metadata?.fileName?.toLowerCase().includes(query) ||
        e.metadata?.description?.toLowerCase().includes(query)
      );
    }

    // Filtrar por tipo
    if (filterType !== 'all') {
      result = result.filter(e => e.type === filterType);
    }

    // Ordenar
    result.sort((a, b) => {
      if (sortOrder === 'newest') return b.timestamp.getTime() - a.timestamp.getTime();
      if (sortOrder === 'oldest') return a.timestamp.getTime() - b.timestamp.getTime();
      return a.name.localeCompare(b.name);
    });

    // Favoritos primero
    const favorites = result.filter(e => e.isFavorite);
    const nonFavorites = result.filter(e => !e.isFavorite);

    return [...favorites, ...nonFavorites];
  }, [entries, searchQuery, filterType, sortOrder]);

  // Estadísticas
  const stats = useMemo(() => ({
    total: entries.length,
    excel: entries.filter(e => e.type === 'excel').length,
    reporte: entries.filter(e => e.type === 'reporte').length,
    resumen: entries.filter(e => e.type === 'resumen').length,
    guias: entries.filter(e => e.type === 'guias').length,
    favorites: entries.filter(e => e.isFavorite).length,
  }), [entries]);

  // Formatear fecha
  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `Hace ${minutes}m`;
    if (hours < 24) return `Hace ${hours}h`;
    if (days < 7) return `Hace ${days}d`;
    return date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
  };

  // Obtener icono y color por tipo
  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'excel':
        return { icon: FileSpreadsheet, color: 'emerald', label: 'Excel' };
      case 'reporte':
        return { icon: Package, color: 'blue', label: 'Reporte' };
      case 'resumen':
        return { icon: Sparkles, color: 'purple', label: 'Resumen' };
      case 'guias':
        return { icon: Package, color: 'orange', label: 'Guías' };
      default:
        return { icon: FileSpreadsheet, color: 'slate', label: 'Datos' };
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50 p-4 pt-20 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white dark:bg-navy-900 rounded-3xl shadow-2xl overflow-hidden animate-scale-in">
        {/* Header con gradiente */}
        <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-6 overflow-hidden">
          {/* Patrón de fondo */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIgZmlsbD0id2hpdGUiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] "></div>
          </div>

          <div className="relative z-10 flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                <History className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white">Historial de Cargas</h2>
                <p className="text-white/70 text-sm">
                  {stats.total} cargas guardadas • {stats.favorites} favoritas
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Estadísticas */}
          <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
            {[
              { type: 'all', label: 'Todo', count: stats.total },
              { type: 'excel', label: 'Excel', count: stats.excel },
              { type: 'reporte', label: 'Reportes', count: stats.reporte },
              { type: 'guias', label: 'Guías', count: stats.guias },
            ].map((item) => (
              <button
                key={item.type}
                onClick={() => setFilterType(item.type)}
                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${filterType === item.type
                    ? 'bg-white text-purple-600 shadow-lg'
                    : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
              >
                {item.label}
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${filterType === item.type ? 'bg-purple-100' : 'bg-white/20'
                  }`}>
                  {item.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Barra de búsqueda y acciones */}
        <div className="p-4 border-b border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800/50">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar en historial..."
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-600 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>

            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="px-3 py-2.5 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-600 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none"
            >
              <option value="newest">Más recientes</option>
              <option value="oldest">Más antiguos</option>
              <option value="name">Por nombre</option>
            </select>

            {entries.length > 0 && (
              <button
                onClick={onDeleteAll}
                className="px-4 py-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-xl text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Limpiar</span>
              </button>
            )}
          </div>
        </div>

        {/* Lista de entradas */}
        <div className="max-h-[50vh] overflow-y-auto">
          {filteredEntries.length === 0 ? (
            <div className="py-16 text-center">
              {entries.length === 0 ? (
                <>
                  <History className="w-16 h-16 mx-auto text-slate-300 dark:text-navy-600 mb-4" />
                  <p className="text-lg font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Sin historial
                  </p>
                  <p className="text-sm text-slate-400">
                    Las cargas de Excel, reportes y guías se guardarán aquí
                  </p>
                </>
              ) : (
                <>
                  <Search className="w-16 h-16 mx-auto text-slate-300 dark:text-navy-600 mb-4" />
                  <p className="text-lg font-medium text-slate-600 dark:text-slate-400">
                    No se encontraron resultados
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-navy-700">
              {filteredEntries.map((entry) => {
                const typeStyle = getTypeStyle(entry.type);
                const TypeIcon = typeStyle.icon;
                const isExpanded = expandedId === entry.id;

                return (
                  <div
                    key={entry.id}
                    className="p-4 hover:bg-slate-50 dark:hover:bg-navy-800/50 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      {/* Icono */}
                      <div className={`p-2.5 rounded-xl bg-${typeStyle.color}-100 dark:bg-${typeStyle.color}-900/30`}>
                        <TypeIcon className={`w-5 h-5 text-${typeStyle.color}-600 dark:text-${typeStyle.color}-400`} />
                      </div>

                      {/* Contenido */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              {entry.isFavorite && (
                                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                              )}
                              <h4 className="font-semibold text-slate-700 dark:text-white truncate">
                                {entry.name}
                              </h4>
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs text-slate-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDate(entry.timestamp)}
                              </span>
                              <span className="text-xs text-slate-500 flex items-center gap-1">
                                <Package className="w-3 h-3" />
                                {entry.recordCount} registros
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-${typeStyle.color}-100 text-${typeStyle.color}-700 dark:bg-${typeStyle.color}-900/30 dark:text-${typeStyle.color}-400`}>
                                {typeStyle.label}
                              </span>
                            </div>
                          </div>

                          {/* Acciones */}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => onRestore(entry)}
                              className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                              title="Restaurar"
                            >
                              <Upload className="w-4 h-4" />
                            </button>
                            {onToggleFavorite && (
                              <button
                                onClick={() => onToggleFavorite(entry.id)}
                                className={`p-2 rounded-lg transition-colors ${entry.isFavorite
                                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600'
                                    : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-700'
                                  }`}
                                title={entry.isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                              >
                                {entry.isFavorite ? (
                                  <Star className="w-4 h-4 fill-current" />
                                ) : (
                                  <StarOff className="w-4 h-4" />
                                )}
                              </button>
                            )}
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                              className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-700 rounded-lg transition-colors"
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => onDelete(entry.id)}
                              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Detalles expandidos */}
                        {isExpanded && (
                          <div className="mt-4 p-4 bg-slate-100 dark:bg-navy-800 rounded-xl animate-fade-in">
                            {entry.metadata?.description && (
                              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                                {entry.metadata.description}
                              </p>
                            )}

                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <p className="text-xs text-slate-500 mb-1">Fecha completa</p>
                                <p className="text-slate-700 dark:text-slate-300">
                                  {entry.timestamp.toLocaleString('es-CO')}
                                </p>
                              </div>
                              {entry.metadata?.fileName && (
                                <div>
                                  <p className="text-xs text-slate-500 mb-1">Archivo original</p>
                                  <p className="text-slate-700 dark:text-slate-300 truncate">
                                    {entry.metadata.fileName}
                                  </p>
                                </div>
                              )}
                            </div>

                            <button
                              onClick={() => onRestore(entry)}
                              className="w-full mt-4 py-2.5 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-all"
                            >
                              <Upload className="w-4 h-4" />
                              Restaurar esta carga
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-navy-800/50 border-t border-slate-200 dark:border-navy-700">
          <p className="text-center text-xs text-slate-400">
            El historial guarda las últimas {MAX_ENTRIES} cargas (hasta {MAX_RECORDS_PER_ENTRY} registros cada una)
          </p>
        </div>
      </div>
    </div>
  );
};

// Botón para abrir el historial (para usar en el header)
export const LoadHistoryButton: React.FC<{
  onClick: () => void;
  count: number;
}> = ({ onClick, count }) => (
  <button
    onClick={onClick}
    className="relative p-2.5 bg-white dark:bg-navy-800 hover:bg-slate-100 dark:hover:bg-navy-700 border border-slate-200 dark:border-navy-600 rounded-xl transition-all group"
    title="Historial de cargas"
  >
    <History className="w-5 h-5 text-slate-600 dark:text-slate-300 group-hover:text-purple-600" />
    {count > 0 && (
      <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-purple-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
        {count > 9 ? '9+' : count}
      </span>
    )}
  </button>
);

export default LoadHistoryPanel;
