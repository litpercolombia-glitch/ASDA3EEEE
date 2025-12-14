// ============================================
// PERSONALIZADOR DE VISUALIZACIÓN
// Permite cambiar cómo se muestra la información
// ============================================

import React, { useState } from 'react';
import {
  LayoutGrid,
  List,
  Table,
  Square,
  Columns,
  Rows,
  Eye,
  EyeOff,
  Settings,
  Save,
  Star,
  StarOff,
  Trash2,
  Plus,
  Check,
  ChevronDown,
  RefreshCw,
  Palette,
  Grid,
  LayoutList,
  Kanban,
  GripVertical,
  X,
  Download,
  Upload,
} from 'lucide-react';
import {
  useViewPreferencesStore,
  ViewMode,
  DensityMode,
  ColumnConfig,
  ViewPreset,
} from '../../services/viewPreferencesService';

// ============================================
// COMPONENTE: Selector Rápido de Vista
// ============================================
export const QuickViewSelector: React.FC<{
  onModeChange?: (mode: ViewMode) => void;
  compact?: boolean;
}> = ({ onModeChange, compact = false }) => {
  const { globalConfig, setViewMode } = useViewPreferencesStore();

  const viewModes: { id: ViewMode; icon: React.ElementType; label: string }[] = [
    { id: 'table', icon: Table, label: 'Tabla' },
    { id: 'cards', icon: LayoutGrid, label: 'Tarjetas' },
    { id: 'list', icon: List, label: 'Lista' },
    { id: 'compact', icon: Rows, label: 'Compacta' },
    { id: 'kanban', icon: Kanban, label: 'Kanban' },
  ];

  const handleChange = (mode: ViewMode) => {
    setViewMode(mode);
    onModeChange?.(mode);
  };

  if (compact) {
    return (
      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-navy-800 rounded-lg">
        {viewModes.slice(0, 4).map((mode) => (
          <button
            key={mode.id}
            onClick={() => handleChange(mode.id)}
            className={`p-2 rounded-md transition-all ${
              globalConfig.viewMode === mode.id
                ? 'bg-white dark:bg-navy-700 text-indigo-600 shadow-sm'
                : 'text-slate-400 hover:text-slate-600'
            }`}
            title={mode.label}
          >
            <mode.icon className="w-4 h-4" />
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {viewModes.map((mode) => (
        <button
          key={mode.id}
          onClick={() => handleChange(mode.id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            globalConfig.viewMode === mode.id
              ? 'bg-indigo-500 text-white shadow-lg'
              : 'bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-navy-700'
          }`}
        >
          <mode.icon className="w-4 h-4" />
          <span className="font-medium">{mode.label}</span>
        </button>
      ))}
    </div>
  );
};

// ============================================
// COMPONENTE: Selector de Densidad
// ============================================
export const DensitySelector: React.FC = () => {
  const { globalConfig, setDensity } = useViewPreferencesStore();

  const densities: { id: DensityMode; label: string; desc: string }[] = [
    { id: 'comfortable', label: 'Espaciada', desc: 'Más espacio entre elementos' },
    { id: 'normal', label: 'Normal', desc: 'Balance estándar' },
    { id: 'compact', label: 'Compacta', desc: 'Ver más elementos' },
  ];

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Densidad</label>
      <div className="flex gap-2">
        {densities.map((d) => (
          <button
            key={d.id}
            onClick={() => setDensity(d.id)}
            className={`flex-1 p-3 rounded-xl text-center transition-all ${
              globalConfig.density === d.id
                ? 'bg-indigo-100 dark:bg-indigo-900/30 border-2 border-indigo-500 text-indigo-700 dark:text-indigo-300'
                : 'bg-slate-50 dark:bg-navy-800 border-2 border-transparent hover:border-slate-200 dark:hover:border-navy-600'
            }`}
          >
            <p className="font-medium text-sm">{d.label}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

// ============================================
// COMPONENTE: Selector de Columnas
// ============================================
export const ColumnSelector: React.FC = () => {
  const { globalConfig, setColumnVisibility, reorderColumns } = useViewPreferencesStore();
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, columnId: string) => {
    setDraggingId(columnId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggingId || draggingId === targetId) return;

    const columns = [...globalConfig.columns];
    const dragIndex = columns.findIndex((c) => c.id === draggingId);
    const targetIndex = columns.findIndex((c) => c.id === targetId);

    if (dragIndex !== -1 && targetIndex !== -1) {
      const [removed] = columns.splice(dragIndex, 1);
      columns.splice(targetIndex, 0, removed);

      // Update order
      columns.forEach((col, idx) => {
        col.order = idx + 1;
      });

      reorderColumns(columns);
    }
  };

  const handleDragEnd = () => {
    setDraggingId(null);
  };

  const visibleCount = globalConfig.columns.filter((c) => c.visible).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
          Columnas Visibles ({visibleCount})
        </label>
        <button
          onClick={() => {
            globalConfig.columns.forEach((c) => setColumnVisibility(c.id, true));
          }}
          className="text-xs text-indigo-500 hover:text-indigo-600"
        >
          Mostrar todas
        </button>
      </div>

      <div className="space-y-1 max-h-64 overflow-y-auto">
        {globalConfig.columns
          .sort((a, b) => a.order - b.order)
          .map((column) => (
            <div
              key={column.id}
              draggable
              onDragStart={(e) => handleDragStart(e, column.id)}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-2 p-2 rounded-lg cursor-move transition-all ${
                draggingId === column.id
                  ? 'bg-indigo-100 dark:bg-indigo-900/30 scale-105'
                  : 'bg-slate-50 dark:bg-navy-800 hover:bg-slate-100 dark:hover:bg-navy-700'
              }`}
            >
              <GripVertical className="w-4 h-4 text-slate-300" />
              <button
                onClick={() => setColumnVisibility(column.id, !column.visible)}
                className={`p-1 rounded ${
                  column.visible
                    ? 'text-emerald-500'
                    : 'text-slate-300'
                }`}
              >
                {column.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
              <span className={`flex-1 text-sm ${
                column.visible
                  ? 'text-slate-700 dark:text-white'
                  : 'text-slate-400'
              }`}>
                {column.label}
              </span>
            </div>
          ))}
      </div>
    </div>
  );
};

// ============================================
// COMPONENTE: Selector de Esquema de Color
// ============================================
export const ColorSchemeSelector: React.FC = () => {
  const { globalConfig, setColorScheme } = useViewPreferencesStore();

  const schemes = [
    { id: 'default', label: 'Por Defecto', colors: ['#6366f1', '#10b981', '#f59e0b'] },
    { id: 'minimal', label: 'Minimalista', colors: ['#64748b', '#94a3b8', '#cbd5e1'] },
    { id: 'colorful', label: 'Colorido', colors: ['#ec4899', '#8b5cf6', '#06b6d4'] },
    { id: 'dark', label: 'Oscuro', colors: ['#1e293b', '#334155', '#475569'] },
  ] as const;

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
        <Palette className="w-4 h-4" />
        Esquema de Color
      </label>
      <div className="grid grid-cols-2 gap-2">
        {schemes.map((scheme) => (
          <button
            key={scheme.id}
            onClick={() => setColorScheme(scheme.id)}
            className={`p-3 rounded-xl text-left transition-all ${
              globalConfig.colorScheme === scheme.id
                ? 'ring-2 ring-indigo-500 bg-slate-50 dark:bg-navy-800'
                : 'bg-slate-50 dark:bg-navy-800 hover:bg-slate-100 dark:hover:bg-navy-700'
            }`}
          >
            <div className="flex gap-1 mb-2">
              {scheme.colors.map((color, idx) => (
                <div
                  key={idx}
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <p className="text-xs font-medium text-slate-700 dark:text-white">{scheme.label}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

// ============================================
// COMPONENTE: Selector de Presets
// ============================================
export const PresetSelector: React.FC<{
  onPresetApply?: (presetId: string) => void;
}> = ({ onPresetApply }) => {
  const {
    presets,
    activePresetId,
    applyPreset,
    createPreset,
    deletePreset,
    toggleFavorite,
  } = useViewPreferencesStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');

  const handleApply = (presetId: string) => {
    applyPreset(presetId);
    onPresetApply?.(presetId);
  };

  const handleCreate = () => {
    if (newPresetName.trim()) {
      createPreset(newPresetName.trim());
      setNewPresetName('');
      setShowCreateModal(false);
    }
  };

  const favorites = presets.filter((p) => p.isFavorite);
  const others = presets.filter((p) => !p.isFavorite);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
          Presets Guardados
        </label>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-600"
        >
          <Plus className="w-3 h-3" />
          Guardar Actual
        </button>
      </div>

      {/* Favoritos */}
      {favorites.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-slate-400 uppercase font-bold">Favoritos</p>
          {favorites.map((preset) => (
            <PresetItem
              key={preset.id}
              preset={preset}
              isActive={activePresetId === preset.id}
              onApply={() => handleApply(preset.id)}
              onDelete={() => deletePreset(preset.id)}
              onToggleFavorite={() => toggleFavorite(preset.id)}
            />
          ))}
        </div>
      )}

      {/* Otros */}
      <div className="space-y-2">
        {favorites.length > 0 && <p className="text-xs text-slate-400 uppercase font-bold">Todos</p>}
        {others.map((preset) => (
          <PresetItem
            key={preset.id}
            preset={preset}
            isActive={activePresetId === preset.id}
            onApply={() => handleApply(preset.id)}
            onDelete={() => deletePreset(preset.id)}
            onToggleFavorite={() => toggleFavorite(preset.id)}
          />
        ))}
      </div>

      {/* Modal de creación */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-navy-900 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">
              Guardar Configuración Actual
            </h3>
            <input
              type="text"
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              placeholder="Nombre del preset"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl mb-4"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                className="flex-1 px-4 py-2 bg-indigo-500 text-white rounded-lg"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente interno para cada preset
const PresetItem: React.FC<{
  preset: ViewPreset;
  isActive: boolean;
  onApply: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
}> = ({ preset, isActive, onApply, onDelete, onToggleFavorite }) => {
  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer ${
        isActive
          ? 'bg-indigo-50 dark:bg-indigo-900/20 border-2 border-indigo-300 dark:border-indigo-700'
          : 'bg-slate-50 dark:bg-navy-800 border-2 border-transparent hover:border-slate-200 dark:hover:border-navy-600'
      }`}
      onClick={onApply}
    >
      <span className="text-xl">{preset.icon || '📊'}</span>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-700 dark:text-white truncate">{preset.name}</p>
        {preset.description && (
          <p className="text-xs text-slate-400 truncate">{preset.description}</p>
        )}
      </div>
      <div className="flex items-center gap-1">
        {isActive && <Check className="w-4 h-4 text-indigo-500" />}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          className={`p-1 rounded ${
            preset.isFavorite ? 'text-amber-500' : 'text-slate-300 hover:text-amber-500'
          }`}
        >
          {preset.isFavorite ? <Star className="w-4 h-4 fill-current" /> : <StarOff className="w-4 h-4" />}
        </button>
        {!preset.isDefault && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 text-slate-300 hover:text-red-500 rounded"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

// ============================================
// COMPONENTE: Panel Completo de Personalización
// ============================================
export const ViewCustomizerPanel: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const { globalConfig, toggleOption, resetToDefaults, exportPresets, importPresets } = useViewPreferencesStore();

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const json = event.target?.result as string;
        importPresets(json);
      };
      reader.readAsText(file);
    }
  };

  const handleExport = () => {
    const json = exportPresets();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'view-presets.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Panel lateral */}
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white dark:bg-navy-900 shadow-2xl overflow-hidden flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-navy-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-indigo-500" />
              Personalizar Vista
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-navy-800 rounded-lg"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Contenido scrolleable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Modo de vista */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Modo de Vista
            </label>
            <QuickViewSelector />
          </div>

          {/* Densidad */}
          <DensitySelector />

          {/* Columnas */}
          <ColumnSelector />

          {/* Esquema de color */}
          <ColorSchemeSelector />

          {/* Opciones adicionales */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Opciones de Estilo
            </label>
            <div className="space-y-2">
              {[
                { key: 'showHeaders' as const, label: 'Mostrar encabezados' },
                { key: 'alternateRowColors' as const, label: 'Alternar colores de fila' },
                { key: 'showBorders' as const, label: 'Mostrar bordes' },
                { key: 'roundedCorners' as const, label: 'Esquinas redondeadas' },
                { key: 'showIcons' as const, label: 'Mostrar iconos' },
              ].map((option) => (
                <label key={option.key} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={globalConfig[option.key]}
                    onChange={() => toggleOption(option.key)}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Presets */}
          <PresetSelector />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-navy-700 space-y-2">
          <div className="flex gap-2">
            <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 rounded-lg cursor-pointer hover:bg-slate-200 dark:hover:bg-navy-700">
              <Upload className="w-4 h-4" />
              Importar
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
            <button
              onClick={handleExport}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-navy-700"
            >
              <Download className="w-4 h-4" />
              Exportar
            </button>
          </div>
          <button
            onClick={resetToDefaults}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30"
          >
            <RefreshCw className="w-4 h-4" />
            Restablecer Valores
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewCustomizerPanel;
