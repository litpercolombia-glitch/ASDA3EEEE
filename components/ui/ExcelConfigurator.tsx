// ============================================
// CONFIGURADOR DE CARGA EXCEL
// Permite personalizar qué columnas cargar
// Contraseña: LITPERTUPAPA
// ============================================

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Lock,
  Unlock,
  FileSpreadsheet,
  Plus,
  Trash2,
  Copy,
  Download,
  Upload,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Grid,
  Columns,
  Rows,
  FileText,
  Zap,
} from 'lucide-react';
import {
  useExcelConfigStore,
  ExcelLoadConfig,
  ColumnMapping,
  AVAILABLE_FIELDS,
  PRESET_TEMPLATES,
  CONFIG_PASSWORD,
} from '../../services/excelConfigService';

// ============================================
// COMPONENTE: Pantalla de Login
// ============================================
const ConfigLogin: React.FC<{
  onSuccess: () => void;
}> = ({ onSuccess }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { authenticate } = useExcelConfigStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (authenticate(password)) {
      onSuccess();
    } else {
      setError('Contraseña incorrecta');
      setPassword('');
    }
  };

  return (
    <div className="max-w-md mx-auto p-8">
      <div className="text-center mb-8">
        <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
          <Lock className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
          Configuración Avanzada
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Ingresa la contraseña para acceder al configurador de Excel
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            className="w-full px-4 py-4 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <button
          type="submit"
          className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
        >
          <Unlock className="w-5 h-5" />
          Acceder
        </button>
      </form>
    </div>
  );
};

// ============================================
// COMPONENTE: Editor de Mapeo de Columnas
// ============================================
const ColumnMappingEditor: React.FC<{
  mappings: ColumnMapping[];
  onChange: (mappings: ColumnMapping[]) => void;
  previewData?: any[][];
}> = ({ mappings, onChange, previewData }) => {
  const [expandedColumn, setExpandedColumn] = useState<string | null>(null);

  const addColumn = () => {
    const nextLetter = String.fromCharCode(65 + mappings.length); // A, B, C...
    onChange([
      ...mappings,
      {
        excelColumn: nextLetter,
        mappedTo: 'omitir',
        dataType: 'auto',
        enabled: true,
      },
    ]);
  };

  const updateMapping = (index: number, updates: Partial<ColumnMapping>) => {
    const newMappings = [...mappings];
    newMappings[index] = { ...newMappings[index], ...updates };
    onChange(newMappings);
  };

  const removeMapping = (index: number) => {
    onChange(mappings.filter((_, i) => i !== index));
  };

  const getPreviewValue = (colLetter: string) => {
    if (!previewData || previewData.length < 2) return null;
    const colIndex = colLetter.charCodeAt(0) - 65;
    return previewData[1]?.[colIndex];
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-bold text-slate-700 dark:text-white flex items-center gap-2">
          <Columns className="w-4 h-4" />
          Mapeo de Columnas
        </h4>
        <button
          onClick={addColumn}
          className="flex items-center gap-1 px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Agregar
        </button>
      </div>

      {mappings.map((mapping, index) => (
        <div
          key={index}
          className={`border rounded-xl overflow-hidden transition-all ${
            mapping.enabled
              ? 'border-slate-200 dark:border-navy-700'
              : 'border-slate-100 dark:border-navy-800 opacity-50'
          }`}
        >
          {/* Header del mapeo */}
          <div
            className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-navy-800 cursor-pointer"
            onClick={() => setExpandedColumn(expandedColumn === mapping.excelColumn ? null : mapping.excelColumn)}
          >
            {/* Toggle enabled */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                updateMapping(index, { enabled: !mapping.enabled });
              }}
              className={`p-1.5 rounded-lg transition-colors ${
                mapping.enabled
                  ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : 'bg-slate-200 text-slate-400 dark:bg-navy-700'
              }`}
            >
              {mapping.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>

            {/* Columna Excel */}
            <div className="w-16">
              <input
                type="text"
                value={mapping.excelColumn}
                onChange={(e) => updateMapping(index, { excelColumn: e.target.value.toUpperCase() })}
                onClick={(e) => e.stopPropagation()}
                className="w-full px-2 py-1 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-600 rounded text-center font-mono font-bold text-sm"
                maxLength={2}
              />
            </div>

            <span className="text-slate-400">→</span>

            {/* Campo mapeado */}
            <select
              value={mapping.mappedTo}
              onChange={(e) => updateMapping(index, { mappedTo: e.target.value })}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 px-3 py-1.5 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-600 rounded-lg text-sm"
            >
              {AVAILABLE_FIELDS.map((field) => (
                <option key={field.id} value={field.id}>
                  {field.label} {field.required && '*'}
                </option>
              ))}
            </select>

            {/* Preview value */}
            {previewData && (
              <div className="hidden md:block px-2 py-1 bg-blue-50 dark:bg-blue-900/20 rounded text-xs text-blue-600 dark:text-blue-400 max-w-32 truncate">
                {getPreviewValue(mapping.excelColumn) || 'vacío'}
              </div>
            )}

            {/* Expand button */}
            {expandedColumn === mapping.excelColumn ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}

            {/* Delete button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeMapping(index);
              }}
              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Opciones expandidas */}
          {expandedColumn === mapping.excelColumn && (
            <div className="p-4 border-t border-slate-200 dark:border-navy-700 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                {/* Tipo de dato */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Tipo de Dato</label>
                  <select
                    value={mapping.dataType}
                    onChange={(e) => updateMapping(index, { dataType: e.target.value as any })}
                    className="w-full px-3 py-2 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-600 rounded-lg text-sm"
                  >
                    <option value="auto">Automático</option>
                    <option value="text">Texto</option>
                    <option value="number">Número</option>
                    <option value="phone">Teléfono</option>
                    <option value="date">Fecha</option>
                    <option value="currency">Moneda</option>
                    <option value="status">Estado</option>
                  </select>
                </div>

                {/* Transformación */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Transformar</label>
                  <select
                    value={mapping.transform || ''}
                    onChange={(e) => updateMapping(index, { transform: e.target.value || undefined })}
                    className="w-full px-3 py-2 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-600 rounded-lg text-sm"
                  >
                    <option value="">Ninguna</option>
                    <option value="uppercase">MAYÚSCULAS</option>
                    <option value="lowercase">minúsculas</option>
                    <option value="trim">Quitar espacios</option>
                  </select>
                </div>
              </div>

              {/* Valor por defecto */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Valor por Defecto (si está vacío)</label>
                <input
                  type="text"
                  value={mapping.defaultValue || ''}
                  onChange={(e) => updateMapping(index, { defaultValue: e.target.value || undefined })}
                  placeholder="Dejar vacío para no usar"
                  className="w-full px-3 py-2 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-600 rounded-lg text-sm"
                />
              </div>
            </div>
          )}
        </div>
      ))}

      {mappings.length === 0 && (
        <div className="text-center py-8 text-slate-400">
          <Columns className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No hay columnas configuradas</p>
          <button
            onClick={addColumn}
            className="mt-3 text-indigo-500 hover:text-indigo-600 text-sm font-medium"
          >
            + Agregar primera columna
          </button>
        </div>
      )}
    </div>
  );
};

// ============================================
// COMPONENTE: Configurador Principal
// ============================================
export const ExcelConfigurator: React.FC<{
  onConfigSelect?: (configId: string) => void;
  previewData?: any[][];
}> = ({ onConfigSelect, previewData }) => {
  const {
    isAuthenticated,
    logout,
    configs,
    activeConfigId,
    createConfig,
    updateConfig,
    deleteConfig,
    duplicateConfig,
    setActiveConfig,
    getActiveConfig,
    exportConfig,
    importConfig,
  } = useExcelConfigStore();

  const [showLogin, setShowLogin] = useState(!isAuthenticated);
  const [editingConfig, setEditingConfig] = useState<ExcelLoadConfig | null>(null);
  const [showPresets, setShowPresets] = useState(false);

  useEffect(() => {
    setShowLogin(!isAuthenticated);
  }, [isAuthenticated]);

  const handleCreateFromPreset = (preset: typeof PRESET_TEMPLATES[0]) => {
    const id = createConfig(preset);
    setActiveConfig(id);
    onConfigSelect?.(id);
    setShowPresets(false);
  };

  const handleCreateNew = () => {
    const id = createConfig({
      name: 'Nueva Configuración',
      description: '',
      startRow: 2,
      skipEmptyRows: true,
      hasHeaderRow: true,
      headerRowIndex: 1,
      columnMappings: [],
    });
    const newConfig = configs.find((c) => c.id === id);
    if (newConfig) {
      setEditingConfig(newConfig);
    }
  };

  const handleSaveConfig = () => {
    if (editingConfig) {
      updateConfig(editingConfig.id, editingConfig);
      setEditingConfig(null);
    }
  };

  const handleExport = (id: string) => {
    const json = exportConfig(id);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `excel-config-${id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const json = event.target?.result as string;
        const id = importConfig(json);
        if (id) {
          setActiveConfig(id);
        }
      };
      reader.readAsText(file);
    }
  };

  if (showLogin) {
    return <ConfigLogin onSuccess={() => setShowLogin(false)} />;
  }

  // Modo edición
  if (editingConfig) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-indigo-500" />
              Editar Configuración
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditingConfig(null)}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-navy-800 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveConfig}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Guardar
            </button>
          </div>
        </div>

        {/* Formulario */}
        <div className="bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-700 p-6 space-y-6">
          {/* Nombre y descripción */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Nombre de la Configuración
              </label>
              <input
                type="text"
                value={editingConfig.name}
                onChange={(e) => setEditingConfig({ ...editingConfig, name: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Descripción (opcional)
              </label>
              <input
                type="text"
                value={editingConfig.description || ''}
                onChange={(e) => setEditingConfig({ ...editingConfig, description: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl"
                placeholder="Ej: Para reportes de Dropi"
              />
            </div>
          </div>

          {/* Configuración de filas */}
          <div className="bg-slate-50 dark:bg-navy-800 rounded-xl p-4">
            <h4 className="font-bold text-slate-700 dark:text-white mb-4 flex items-center gap-2">
              <Rows className="w-4 h-4" />
              Configuración de Filas
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Fila Inicial</label>
                <input
                  type="number"
                  min="1"
                  value={editingConfig.startRow}
                  onChange={(e) => setEditingConfig({ ...editingConfig, startRow: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-600 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Fila Final (opcional)</label>
                <input
                  type="number"
                  min="1"
                  value={editingConfig.endRow || ''}
                  onChange={(e) => setEditingConfig({ ...editingConfig, endRow: parseInt(e.target.value) || undefined })}
                  placeholder="Hasta el final"
                  className="w-full px-3 py-2 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-600 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Fila de Encabezados</label>
                <input
                  type="number"
                  min="1"
                  value={editingConfig.headerRowIndex}
                  onChange={(e) => setEditingConfig({ ...editingConfig, headerRowIndex: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-600 rounded-lg"
                />
              </div>
              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingConfig.skipEmptyRows}
                    onChange={(e) => setEditingConfig({ ...editingConfig, skipEmptyRows: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-300"
                  />
                  <span className="text-sm text-slate-600 dark:text-slate-300">Omitir filas vacías</span>
                </label>
              </div>
            </div>
          </div>

          {/* Mapeo de columnas */}
          <ColumnMappingEditor
            mappings={editingConfig.columnMappings}
            onChange={(mappings) => setEditingConfig({ ...editingConfig, columnMappings: mappings })}
            previewData={previewData}
          />
        </div>
      </div>
    );
  }

  // Lista de configuraciones
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-indigo-500" />
            Configurador de Carga Excel
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Personaliza cómo se cargan los archivos Excel
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-navy-800 dark:hover:bg-navy-700 text-slate-600 dark:text-slate-300 rounded-lg transition-colors cursor-pointer flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Importar
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
          <button
            onClick={() => setShowPresets(true)}
            className="px-4 py-2 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-lg transition-colors flex items-center gap-2"
          >
            <Zap className="w-4 h-4" />
            Plantillas
          </button>
          <button
            onClick={handleCreateNew}
            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nueva
          </button>
          <button
            onClick={logout}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            title="Cerrar sesión"
          >
            <Lock className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Modal de plantillas */}
      {showPresets && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-navy-700 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Plantillas Predefinidas</h3>
              <button
                onClick={() => setShowPresets(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-navy-800 rounded-lg"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-6 space-y-3 overflow-y-auto max-h-[60vh]">
              {PRESET_TEMPLATES.map((preset, index) => (
                <button
                  key={index}
                  onClick={() => handleCreateFromPreset(preset)}
                  className="w-full p-4 text-left bg-slate-50 dark:bg-navy-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl border border-slate-200 dark:border-navy-700 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-white">{preset.name}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{preset.description}</p>
                    </div>
                    <div className="text-xs text-slate-400">
                      {preset.columnMappings.length} columnas
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Lista de configuraciones */}
      {configs.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-700">
          <FileSpreadsheet className="w-16 h-16 mx-auto text-slate-300 dark:text-navy-600 mb-4" />
          <h3 className="text-lg font-bold text-slate-700 dark:text-white mb-2">
            No hay configuraciones
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            Crea una nueva configuración o usa una plantilla predefinida
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setShowPresets(true)}
              className="px-4 py-2 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-lg transition-colors"
            >
              Ver Plantillas
            </button>
            <button
              onClick={handleCreateNew}
              className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors"
            >
              Crear Nueva
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {configs.map((config) => (
            <div
              key={config.id}
              className={`bg-white dark:bg-navy-900 rounded-xl border-2 p-4 transition-all ${
                activeConfigId === config.id
                  ? 'border-indigo-500 shadow-lg'
                  : 'border-slate-200 dark:border-navy-700 hover:border-slate-300 dark:hover:border-navy-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => {
                      setActiveConfig(config.id);
                      onConfigSelect?.(config.id);
                    }}
                    className={`p-3 rounded-xl ${
                      activeConfigId === config.id
                        ? 'bg-indigo-500 text-white'
                        : 'bg-slate-100 dark:bg-navy-800 text-slate-500'
                    }`}
                  >
                    <FileSpreadsheet className="w-5 h-5" />
                  </button>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-white">{config.name}</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {config.description || `${config.columnMappings.length} columnas configuradas`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {activeConfigId === config.id && (
                    <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded">
                      ACTIVA
                    </span>
                  )}
                  <span className="text-xs text-slate-400">
                    Usado {config.usageCount}x
                  </span>
                  <button
                    onClick={() => {
                      const configToEdit = configs.find((c) => c.id === config.id);
                      if (configToEdit) setEditingConfig({ ...configToEdit });
                    }}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-navy-800 rounded-lg text-slate-400 hover:text-slate-600"
                    title="Editar"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => duplicateConfig(config.id)}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-navy-800 rounded-lg text-slate-400 hover:text-slate-600"
                    title="Duplicar"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleExport(config.id)}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-navy-800 rounded-lg text-slate-400 hover:text-slate-600"
                    title="Exportar"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('¿Eliminar esta configuración?')) {
                        deleteConfig(config.id);
                      }
                    }}
                    className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-slate-400 hover:text-red-500"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExcelConfigurator;
