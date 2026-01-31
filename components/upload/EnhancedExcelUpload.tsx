// components/upload/EnhancedExcelUpload.tsx
// Carga de Excel mejorada con configuración de columnas y nombre de sesión
import React, { useState, useRef, useCallback } from 'react';
import {
  FileUp,
  X,
  Check,
  Columns,
  Settings,
  Edit3,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
  GripVertical,
  Trash2,
  RefreshCw,
  Save,
} from 'lucide-react';
import * as XLSX from 'xlsx';

// ============================================
// TIPOS
// ============================================

interface ColumnMapping {
  id: string;
  excelColumn: string; // Nombre de la columna en Excel
  mappedTo: string; // Campo del sistema
  enabled: boolean;
  preview: string[]; // Primeros valores de muestra
}

interface ExcelPreviewData {
  headers: string[];
  rows: Record<string, any>[];
  totalRows: number;
}

interface EnhancedExcelUploadProps {
  onUploadComplete: (data: {
    sessionName: string;
    rows: Record<string, any>[];
    columnMapping: ColumnMapping[];
  }) => void;
  onCancel: () => void;
}

// Campos del sistema disponibles para mapeo
const SYSTEM_FIELDS = [
  { id: 'trackingNumber', label: 'Número de Guía', required: true },
  { id: 'phone', label: 'Celular', required: false },
  { id: 'status', label: 'Estado', required: false },
  { id: 'carrier', label: 'Transportadora', required: false },
  { id: 'destinationCity', label: 'Ciudad Destino', required: false },
  { id: 'recipientName', label: 'Destinatario', required: false },
  { id: 'recipientPhone', label: 'Teléfono Destinatario', required: false },
  { id: 'lastUpdate', label: 'Última Actualización', required: false },
  { id: 'lastMovement', label: 'Último Movimiento', required: false },
  { id: 'daysInTransit', label: 'Días en Tránsito', required: false },
  { id: 'value', label: 'Valor', required: false },
  { id: 'product', label: 'Producto', required: false },
  { id: 'address', label: 'Dirección', required: false },
  { id: 'notes', label: 'Notas', required: false },
];

// Mapeo automático de nombres de columnas comunes
const AUTO_MAPPINGS: Record<string, string> = {
  // Guía
  'guia': 'trackingNumber',
  'numero guia': 'trackingNumber',
  'número guía': 'trackingNumber',
  'no guia': 'trackingNumber',
  'tracking': 'trackingNumber',
  'n guia': 'trackingNumber',
  'numeroguia': 'trackingNumber',
  // Celular
  'celular': 'phone',
  'telefono': 'phone',
  'teléfono': 'phone',
  'cel': 'phone',
  'phone': 'phone',
  'movil': 'phone',
  'móvil': 'phone',
  // Estado
  'estado': 'status',
  'estatus': 'status',
  'status': 'status',
  'estado actual': 'status',
  // Transportadora
  'transportadora': 'carrier',
  'carrier': 'carrier',
  'mensajeria': 'carrier',
  'mensajería': 'carrier',
  'empresa': 'carrier',
  // Ciudad
  'ciudad': 'destinationCity',
  'ciudad destino': 'destinationCity',
  'destino': 'destinationCity',
  'city': 'destinationCity',
  // Destinatario
  'destinatario': 'recipientName',
  'nombre': 'recipientName',
  'cliente': 'recipientName',
  'recipient': 'recipientName',
  // Fecha
  'fecha': 'lastUpdate',
  'fecha actualizacion': 'lastUpdate',
  'ultima actualizacion': 'lastUpdate',
  'date': 'lastUpdate',
  // Movimiento
  'movimiento': 'lastMovement',
  'ultimo movimiento': 'lastMovement',
  'descripcion': 'lastMovement',
  // Valor
  'valor': 'value',
  'monto': 'value',
  'total': 'value',
  'price': 'value',
  // Dirección
  'direccion': 'address',
  'dirección': 'address',
  'address': 'address',
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export const EnhancedExcelUpload: React.FC<EnhancedExcelUploadProps> = ({
  onUploadComplete,
  onCancel,
}) => {
  const [step, setStep] = useState<'upload' | 'configure' | 'preview'>('upload');
  const [sessionName, setSessionName] = useState(() => {
    const now = new Date();
    return `Carga ${now.toLocaleDateString('es-CO')} ${now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`;
  });
  const [previewData, setPreviewData] = useState<ExcelPreviewData | null>(null);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showColumnConfig, setShowColumnConfig] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-detectar mapeo de columna
  const autoDetectMapping = (columnName: string): string => {
    const normalized = columnName.toLowerCase().trim().replace(/[_\-\.]/g, ' ');
    return AUTO_MAPPINGS[normalized] || '';
  };

  // Procesar archivo Excel
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

      if (jsonData.length === 0) {
        setError('El archivo está vacío o no tiene formato válido');
        setIsLoading(false);
        return;
      }

      // Obtener headers
      const headers = Object.keys(jsonData[0] || {});

      // Crear mapeos automáticos
      const mappings: ColumnMapping[] = headers.map((header, idx) => ({
        id: `col_${idx}`,
        excelColumn: header,
        mappedTo: autoDetectMapping(header),
        enabled: true,
        preview: jsonData.slice(0, 3).map(row => String(row[header] || '')),
      }));

      setPreviewData({
        headers,
        rows: jsonData,
        totalRows: jsonData.length,
      });
      setColumnMappings(mappings);
      setSessionName(file.name.replace(/\.(xlsx|xls)$/i, '') || sessionName);
      setStep('configure');
    } catch (err) {
      console.error('Error procesando Excel:', err);
      setError('Error al procesar el archivo. Verifica que sea un Excel válido.');
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [sessionName]);

  // Actualizar mapeo de columna
  const updateColumnMapping = (columnId: string, field: string, value: any) => {
    setColumnMappings(prev =>
      prev.map(col =>
        col.id === columnId ? { ...col, [field]: value } : col
      )
    );
  };

  // Verificar si hay campos requeridos mapeados
  const hasRequiredMappings = () => {
    return columnMappings.some(
      col => col.enabled && col.mappedTo === 'trackingNumber'
    );
  };

  // Confirmar y procesar
  const handleConfirm = () => {
    if (!previewData || !hasRequiredMappings()) {
      setError('Debes mapear al menos el campo "Número de Guía"');
      return;
    }

    onUploadComplete({
      sessionName,
      rows: previewData.rows,
      columnMapping: columnMappings.filter(col => col.enabled),
    });
  };

  // Renderizar paso de carga
  const renderUploadStep = () => (
    <div className="p-8">
      <div className="max-w-lg mx-auto text-center">
        <div className="bg-gradient-to-br from-purple-500 to-blue-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-xl">
          <FileUp className="w-10 h-10 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">
          📊 Importar desde Excel
        </h3>
        <p className="text-gray-400 mb-6">
          Sube un archivo Excel (.xlsx, .xls) con tus guías
        </p>

        <label className={`inline-flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-lg cursor-pointer transition-all transform hover:scale-105 shadow-xl ${
          isLoading
            ? 'bg-gray-600 cursor-not-allowed'
            : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white'
        }`}>
          {isLoading ? (
            <>
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Procesando...
            </>
          ) : (
            <>
              <FileUp className="w-6 h-6" />
              Seleccionar Archivo
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            disabled={isLoading}
            className="hidden"
          />
        </label>

        {error && (
          <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400 text-sm flex items-center gap-2 justify-center">
            <AlertTriangle className="w-4 h-4" />
            {error}
          </div>
        )}
      </div>
    </div>
  );

  // Renderizar paso de configuración
  const renderConfigureStep = () => (
    <div className="p-6 space-y-6 max-h-[70vh] overflow-auto">
      {/* Nombre de la sesión */}
      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
        <label className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
          <Edit3 className="w-4 h-4" />
          Nombre de la carga
        </label>
        <input
          type="text"
          value={sessionName}
          onChange={(e) => setSessionName(e.target.value)}
          placeholder="Ej: Guías Coordinadora Enero 2024"
          className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
        />
      </div>

      {/* Resumen */}
      <div className="flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
        <div className="flex items-center gap-3">
          <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
          <div>
            <p className="text-white font-medium">{previewData?.totalRows.toLocaleString()} registros</p>
            <p className="text-emerald-400 text-sm">{previewData?.headers.length} columnas detectadas</p>
          </div>
        </div>
        <button
          onClick={() => setShowColumnConfig(!showColumnConfig)}
          className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Columns className="w-4 h-4" />
          {showColumnConfig ? 'Ocultar' : 'Configurar'} Columnas
        </button>
      </div>

      {/* Configuración de columnas */}
      {showColumnConfig && (
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-700 bg-gray-800">
            <h4 className="font-medium text-white flex items-center gap-2">
              <Settings className="w-4 h-4 text-purple-400" />
              Mapeo de Columnas
            </h4>
            <p className="text-xs text-gray-400 mt-1">
              Indica qué campo del sistema corresponde a cada columna del Excel
            </p>
          </div>

          <div className="divide-y divide-gray-700 max-h-[300px] overflow-auto">
            {columnMappings.map((col) => (
              <div
                key={col.id}
                className={`p-4 flex items-center gap-4 transition-colors ${
                  col.enabled ? 'bg-transparent' : 'bg-gray-900/50 opacity-50'
                }`}
              >
                {/* Toggle */}
                <button
                  onClick={() => updateColumnMapping(col.id, 'enabled', !col.enabled)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    col.enabled
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-gray-700 text-gray-500'
                  }`}
                >
                  {col.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>

                {/* Columna Excel */}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{col.excelColumn}</p>
                  <p className="text-xs text-gray-500 truncate">
                    Ej: {col.preview.slice(0, 2).join(', ')}
                  </p>
                </div>

                {/* Flecha */}
                <span className="text-gray-500">→</span>

                {/* Selector de campo */}
                <select
                  value={col.mappedTo}
                  onChange={(e) => updateColumnMapping(col.id, 'mappedTo', e.target.value)}
                  disabled={!col.enabled}
                  className="px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white text-sm focus:border-purple-500 outline-none disabled:opacity-50"
                >
                  <option value="">-- Sin mapear --</option>
                  {SYSTEM_FIELDS.map((field) => (
                    <option key={field.id} value={field.id}>
                      {field.label} {field.required ? '*' : ''}
                    </option>
                  ))}
                </select>

                {/* Indicador de mapeo */}
                {col.mappedTo && col.enabled && (
                  <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vista previa */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-700 bg-gray-800">
          <h4 className="font-medium text-white flex items-center gap-2">
            <Eye className="w-4 h-4 text-blue-400" />
            Vista Previa (primeros 5 registros)
          </h4>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-900">
              <tr>
                {columnMappings
                  .filter(col => col.enabled && col.mappedTo)
                  .map((col) => (
                    <th key={col.id} className="px-4 py-3 text-left text-gray-400 font-medium">
                      {SYSTEM_FIELDS.find(f => f.id === col.mappedTo)?.label || col.excelColumn}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {previewData?.rows.slice(0, 5).map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-800/50">
                  {columnMappings
                    .filter(col => col.enabled && col.mappedTo)
                    .map((col) => (
                      <td key={col.id} className="px-4 py-3 text-white truncate max-w-[200px]">
                        {String(row[col.excelColumn] || '-')}
                      </td>
                    ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Botones */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-700">
        <button
          onClick={() => {
            setStep('upload');
            setPreviewData(null);
            setColumnMappings([]);
            setError(null);
          }}
          className="px-4 py-2 text-gray-400 hover:text-white transition-colors flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Cargar otro archivo
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!hasRequiredMappings()}
            className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${
              hasRequiredMappings()
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Check className="w-5 h-5" />
            Confirmar Carga ({previewData?.totalRows.toLocaleString()} guías)
          </button>
        </div>
      </div>

      {!hasRequiredMappings() && (
        <p className="text-center text-amber-400 text-sm">
          ⚠️ Debes mapear al menos el campo "Número de Guía" para continuar
        </p>
      )}
    </div>
  );

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-700 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <FileSpreadsheet className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-white">📥 Cargar Guías desde Excel</h2>
            <p className="text-sm text-gray-400">
              {step === 'upload' ? 'Selecciona un archivo Excel' :
               step === 'configure' ? 'Configura las columnas y nombre' :
               'Confirma la carga'}
            </p>
          </div>
        </div>
        <button
          onClick={onCancel}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Content */}
      {step === 'upload' && renderUploadStep()}
      {step === 'configure' && renderConfigureStep()}
    </div>
  );
};

export default EnhancedExcelUpload;
