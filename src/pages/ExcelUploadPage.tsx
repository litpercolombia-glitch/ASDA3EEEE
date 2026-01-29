/**
 * ExcelUploadPage - LITPER PRO
 *
 * Página de carga masiva de pedidos desde Excel
 * Con drag&drop, preview, mapeo visual y validaciones colombianas
 */

import React, { useState, useCallback, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Download,
  Save,
  Trash2,
  RefreshCw,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Database,
  MapPin,
  Phone,
  User,
  Package,
  DollarSign,
  Hash,
  Calendar,
  Mail,
  Home,
  Building,
  FileText,
  X,
  Check,
  Loader2,
  Info,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface ExcelRow {
  [key: string]: string | number | null;
}

interface ColumnMapping {
  excelColumn: string;
  litperField: string;
  isRequired: boolean;
  isValid: boolean;
}

interface ValidationError {
  row: number;
  column: string;
  value: string;
  message: string;
  type: 'error' | 'warning';
}

interface ImportTemplate {
  id: string;
  name: string;
  mappings: Record<string, string>;
  createdAt: Date;
}

interface ProcessedRow extends ExcelRow {
  _rowNumber: number;
  _isValid: boolean;
  _errors: ValidationError[];
}

// ============================================================================
// CONSTANTS - LITPER FIELDS
// ============================================================================

const LITPER_FIELDS = [
  { id: 'guia', label: 'Número de Guía', icon: Hash, required: false },
  { id: 'cliente_nombre', label: 'Nombre del Cliente', icon: User, required: true },
  { id: 'cliente_telefono', label: 'Teléfono', icon: Phone, required: true },
  { id: 'cliente_email', label: 'Email', icon: Mail, required: false },
  { id: 'cliente_documento', label: 'Documento (CC/NIT)', icon: FileText, required: false },
  { id: 'direccion', label: 'Dirección de Entrega', icon: Home, required: true },
  { id: 'ciudad', label: 'Ciudad', icon: MapPin, required: true },
  { id: 'departamento', label: 'Departamento', icon: Building, required: false },
  { id: 'barrio', label: 'Barrio', icon: MapPin, required: false },
  { id: 'producto', label: 'Producto', icon: Package, required: true },
  { id: 'cantidad', label: 'Cantidad', icon: Hash, required: true },
  { id: 'valor_producto', label: 'Valor del Producto', icon: DollarSign, required: true },
  { id: 'valor_envio', label: 'Valor del Envío', icon: DollarSign, required: false },
  { id: 'valor_total', label: 'Valor Total', icon: DollarSign, required: false },
  { id: 'observaciones', label: 'Observaciones', icon: FileText, required: false },
  { id: 'fecha_pedido', label: 'Fecha del Pedido', icon: Calendar, required: false },
];

// ============================================================================
// COLOMBIAN CITIES DATABASE (Top 100+)
// ============================================================================

const COLOMBIAN_CITIES = [
  'Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Cúcuta', 'Bucaramanga',
  'Pereira', 'Santa Marta', 'Ibagué', 'Pasto', 'Manizales', 'Neiva', 'Soledad',
  'Villavicencio', 'Armenia', 'Soacha', 'Valledupar', 'Montería', 'Itagüí',
  'Palmira', 'Buenaventura', 'Floridablanca', 'Sincelejo', 'Popayán', 'Bello',
  'Barrancabermeja', 'Dos Quebradas', 'Tuluá', 'Envigado', 'Cartago', 'Girardot',
  'Buga', 'Tunja', 'Florencia', 'Maicao', 'Sogamoso', 'Girón', 'Apartadó',
  'Facatativá', 'Zipaquirá', 'Riohacha', 'Turbo', 'Ocaña', 'Quibdó', 'Ciénaga',
  'Fusagasugá', 'Chía', 'Magangué', 'Duitama', 'Yopal', 'Jamundí', 'Piedecuesta',
  'Aguachica', 'Lorica', 'Caucasia', 'Sabanalarga', 'Copacabana', 'Rionegro',
  'Espinal', 'Arauca', 'Ipiales', 'Leticia', 'Mocoa', 'San Andrés', 'Mitú',
  'Puerto Carreño', 'Inírida', 'Tumaco', 'La Dorada', 'Chiquinquirá', 'Puerto Asís',
  'Sabaneta', 'Cajicá', 'Madrid', 'Funza', 'Mosquera', 'Tocancipá', 'Cota',
  'La Calera', 'Tenjo', 'Tabio', 'Sopó', 'Gachancipá', 'Sibaté', 'La Mesa',
  'Melgar', 'Anapoima', 'Villeta', 'Pacho', 'Ubaté', 'Chocontá', 'Guatavita',
  // Normalize variations
  'BOGOTA', 'MEDELLIN', 'CALI', 'BARRANQUILLA', 'CARTAGENA',
  'Bogota', 'Medellin', 'Cucuta', 'Bucaramanga DC', 'Santa Marta DC',
];

const normalizeCity = (city: string): string => {
  return city
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

const NORMALIZED_CITIES = new Set(COLOMBIAN_CITIES.map(normalizeCity));

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

const validateColombianPhone = (phone: string): { isValid: boolean; message: string } => {
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.length === 0) {
    return { isValid: false, message: 'Teléfono vacío' };
  }

  if (cleaned.length !== 10) {
    return { isValid: false, message: `Debe tener 10 dígitos (tiene ${cleaned.length})` };
  }

  if (!cleaned.startsWith('3')) {
    return { isValid: false, message: 'Debe empezar con 3 (celular colombiano)' };
  }

  return { isValid: true, message: 'Válido' };
};

const validateCity = (city: string): { isValid: boolean; message: string; suggestion?: string } => {
  if (!city || city.trim().length === 0) {
    return { isValid: false, message: 'Ciudad vacía' };
  }

  const normalized = normalizeCity(city);

  if (NORMALIZED_CITIES.has(normalized)) {
    return { isValid: true, message: 'Ciudad válida' };
  }

  // Find similar cities
  const suggestions = COLOMBIAN_CITIES.filter(c => {
    const nc = normalizeCity(c);
    return nc.includes(normalized) || normalized.includes(nc) ||
           levenshteinDistance(nc, normalized) <= 2;
  });

  if (suggestions.length > 0) {
    return {
      isValid: false,
      message: 'Ciudad no reconocida',
      suggestion: suggestions[0],
    };
  }

  return { isValid: false, message: 'Ciudad no encontrada en Colombia' };
};

const validatePositiveNumber = (value: string | number): { isValid: boolean; message: string } => {
  const num = typeof value === 'string' ? parseFloat(value.replace(/[,$]/g, '')) : value;

  if (isNaN(num)) {
    return { isValid: false, message: 'No es un número válido' };
  }

  if (num < 0) {
    return { isValid: false, message: 'Debe ser positivo' };
  }

  return { isValid: true, message: 'Válido' };
};

const validateEmail = (email: string): { isValid: boolean; message: string } => {
  if (!email || email.trim().length === 0) {
    return { isValid: true, message: 'Opcional' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email)
    ? { isValid: true, message: 'Válido' }
    : { isValid: false, message: 'Formato de email inválido' };
};

// Levenshtein distance for fuzzy matching
const levenshteinDistance = (a: string, b: string): number => {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
};

// ============================================================================
// AUTO-DETECT COLUMN MAPPING
// ============================================================================

const autoDetectMapping = (headers: string[]): Record<string, string> => {
  const mapping: Record<string, string> = {};

  const patterns: Record<string, RegExp[]> = {
    guia: [/guia/i, /tracking/i, /numero.*guia/i, /n[uú]mero/i],
    cliente_nombre: [/nombre/i, /cliente/i, /destinatario/i, /receptor/i],
    cliente_telefono: [/tel[eé]fono/i, /celular/i, /m[oó]vil/i, /phone/i, /cel/i],
    cliente_email: [/email/i, /correo/i, /e-mail/i, /mail/i],
    cliente_documento: [/documento/i, /c[eé]dula/i, /nit/i, /cc/i, /identificaci/i],
    direccion: [/direcci[oó]n/i, /address/i, /domicilio/i],
    ciudad: [/ciudad/i, /city/i, /municipio/i],
    departamento: [/departamento/i, /depto/i, /estado/i, /region/i],
    barrio: [/barrio/i, /localidad/i, /zona/i],
    producto: [/producto/i, /item/i, /art[ií]culo/i, /descripci/i, /referencia/i],
    cantidad: [/cantidad/i, /qty/i, /unidades/i, /cant/i],
    valor_producto: [/valor.*producto/i, /precio/i, /price/i, /costo/i],
    valor_envio: [/valor.*env[ií]o/i, /flete/i, /shipping/i, /env[ií]o/i],
    valor_total: [/valor.*total/i, /total/i, /monto/i],
    observaciones: [/observaci/i, /notas/i, /comentarios/i, /notes/i],
    fecha_pedido: [/fecha/i, /date/i, /pedido/i],
  };

  headers.forEach(header => {
    const normalizedHeader = header.toLowerCase().trim();

    for (const [field, regexList] of Object.entries(patterns)) {
      if (!mapping[header]) {
        for (const regex of regexList) {
          if (regex.test(normalizedHeader)) {
            mapping[header] = field;
            break;
          }
        }
      }
    }
  });

  return mapping;
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const ExcelUploadPage: React.FC = () => {
  // File state
  const [file, setFile] = useState<File | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Data state
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawData, setRawData] = useState<ExcelRow[]>([]);
  const [processedData, setProcessedData] = useState<ProcessedRow[]>([]);

  // Mapping state
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [showAllRows, setShowAllRows] = useState(false);

  // Template state
  const [templates, setTemplates] = useState<ImportTemplate[]>(() => {
    const saved = localStorage.getItem('litper-excel-templates');
    return saved ? JSON.parse(saved) : [];
  });
  const [templateName, setTemplateName] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);

  // UI state
  const [activeStep, setActiveStep] = useState<'upload' | 'mapping' | 'validation' | 'summary'>('upload');
  const [expandedErrors, setExpandedErrors] = useState<Set<number>>(new Set());

  // ============================================================================
  // FILE HANDLING
  // ============================================================================

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls') || droppedFile.name.endsWith('.csv'))) {
      processFile(droppedFile);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  }, []);

  const processFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setIsProcessing(true);
    setUploadProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => Math.min(prev + 10, 90));
    }, 100);

    try {
      const data = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json<ExcelRow>(worksheet, { header: 1 });

      if (jsonData.length > 0) {
        const headerRow = jsonData[0] as unknown as string[];
        const dataRows = jsonData.slice(1).map((row: unknown) => {
          const obj: ExcelRow = {};
          (row as (string | number | null)[]).forEach((cell, index) => {
            obj[headerRow[index]] = cell;
          });
          return obj;
        }).filter(row => Object.values(row).some(v => v !== null && v !== undefined && v !== ''));

        setHeaders(headerRow.filter(h => h));
        setRawData(dataRows);

        // Auto-detect mapping
        const autoMapping = autoDetectMapping(headerRow);
        setColumnMapping(autoMapping);

        setActiveStep('mapping');
      }

      clearInterval(progressInterval);
      setUploadProgress(100);
    } catch (error) {
      console.error('Error processing file:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // ============================================================================
  // VALIDATION
  // ============================================================================

  const validateData = useCallback(() => {
    const processed: ProcessedRow[] = rawData.map((row, index) => {
      const errors: ValidationError[] = [];

      // Get mapped values
      const mappedRow: Record<string, string | number | null> = {};
      Object.entries(columnMapping).forEach(([excelCol, litperField]) => {
        mappedRow[litperField] = row[excelCol];
      });

      // Validate phone
      if (mappedRow.cliente_telefono) {
        const phoneValidation = validateColombianPhone(String(mappedRow.cliente_telefono));
        if (!phoneValidation.isValid) {
          errors.push({
            row: index + 2,
            column: 'Teléfono',
            value: String(mappedRow.cliente_telefono),
            message: phoneValidation.message,
            type: 'error',
          });
        }
      }

      // Validate city
      if (mappedRow.ciudad) {
        const cityValidation = validateCity(String(mappedRow.ciudad));
        if (!cityValidation.isValid) {
          errors.push({
            row: index + 2,
            column: 'Ciudad',
            value: String(mappedRow.ciudad),
            message: cityValidation.message + (cityValidation.suggestion ? ` ¿Quisiste decir "${cityValidation.suggestion}"?` : ''),
            type: 'warning',
          });
        }
      }

      // Validate numeric fields
      ['cantidad', 'valor_producto', 'valor_envio', 'valor_total'].forEach(field => {
        if (mappedRow[field] !== null && mappedRow[field] !== undefined && mappedRow[field] !== '') {
          const numValidation = validatePositiveNumber(mappedRow[field] as string | number);
          if (!numValidation.isValid) {
            const fieldLabel = LITPER_FIELDS.find(f => f.id === field)?.label || field;
            errors.push({
              row: index + 2,
              column: fieldLabel,
              value: String(mappedRow[field]),
              message: numValidation.message,
              type: 'error',
            });
          }
        }
      });

      // Validate email
      if (mappedRow.cliente_email) {
        const emailValidation = validateEmail(String(mappedRow.cliente_email));
        if (!emailValidation.isValid) {
          errors.push({
            row: index + 2,
            column: 'Email',
            value: String(mappedRow.cliente_email),
            message: emailValidation.message,
            type: 'warning',
          });
        }
      }

      // Check required fields
      LITPER_FIELDS.filter(f => f.required).forEach(field => {
        const value = mappedRow[field.id];
        if (value === null || value === undefined || value === '') {
          errors.push({
            row: index + 2,
            column: field.label,
            value: '',
            message: 'Campo requerido vacío',
            type: 'error',
          });
        }
      });

      return {
        ...row,
        _rowNumber: index + 2,
        _isValid: errors.filter(e => e.type === 'error').length === 0,
        _errors: errors,
      };
    });

    setProcessedData(processed);
    setActiveStep('validation');
  }, [rawData, columnMapping]);

  // ============================================================================
  // TEMPLATE MANAGEMENT
  // ============================================================================

  const saveTemplate = () => {
    if (!templateName.trim()) return;

    const newTemplate: ImportTemplate = {
      id: Date.now().toString(),
      name: templateName.trim(),
      mappings: columnMapping,
      createdAt: new Date(),
    };

    const updated = [...templates, newTemplate];
    setTemplates(updated);
    localStorage.setItem('litper-excel-templates', JSON.stringify(updated));
    setTemplateName('');
    setShowTemplates(false);
  };

  const applyTemplate = (template: ImportTemplate) => {
    setColumnMapping(template.mappings);
    setShowTemplates(false);
  };

  const deleteTemplate = (id: string) => {
    const updated = templates.filter(t => t.id !== id);
    setTemplates(updated);
    localStorage.setItem('litper-excel-templates', JSON.stringify(updated));
  };

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const validRows = useMemo(() => processedData.filter(r => r._isValid), [processedData]);
  const invalidRows = useMemo(() => processedData.filter(r => !r._isValid), [processedData]);
  const allErrors = useMemo(() => processedData.flatMap(r => r._errors), [processedData]);
  const errorCount = useMemo(() => allErrors.filter(e => e.type === 'error').length, [allErrors]);
  const warningCount = useMemo(() => allErrors.filter(e => e.type === 'warning').length, [allErrors]);

  const mappedFieldsCount = useMemo(() =>
    Object.values(columnMapping).filter(v => v).length,
    [columnMapping]
  );

  const requiredFieldsMapped = useMemo(() => {
    const requiredIds = LITPER_FIELDS.filter(f => f.required).map(f => f.id);
    const mappedIds = Object.values(columnMapping);
    return requiredIds.filter(id => mappedIds.includes(id)).length;
  }, [columnMapping]);

  const totalRequiredFields = LITPER_FIELDS.filter(f => f.required).length;

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div
      className="min-h-screen p-6"
      style={{ background: '#0a0a0f' }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="p-3 rounded-xl"
              style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)' }}
            >
              <FileSpreadsheet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Importar Pedidos</h1>
              <p className="text-sm text-zinc-500">Carga masiva desde Excel con validación inteligente</p>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center gap-2 mt-6">
            {[
              { id: 'upload', label: 'Subir Archivo', icon: Upload },
              { id: 'mapping', label: 'Mapear Columnas', icon: ArrowRight },
              { id: 'validation', label: 'Validar Datos', icon: CheckCircle },
              { id: 'summary', label: 'Resumen', icon: Database },
            ].map((step, index) => (
              <React.Fragment key={step.id}>
                <button
                  onClick={() => {
                    if (step.id === 'upload' || (step.id === 'mapping' && rawData.length > 0) ||
                        (step.id === 'validation' && processedData.length > 0)) {
                      setActiveStep(step.id as typeof activeStep);
                    }
                  }}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                    transition-all duration-200
                  `}
                  style={{
                    background: activeStep === step.id
                      ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(139, 92, 246, 0.1) 100%)'
                      : 'transparent',
                    color: activeStep === step.id ? '#60a5fa' : '#71717a',
                    border: activeStep === step.id ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid transparent',
                  }}
                >
                  <step.icon className="w-4 h-4" />
                  {step.label}
                </button>
                {index < 3 && (
                  <ChevronDown
                    className="w-4 h-4 text-zinc-700 rotate-[-90deg]"
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Step 1: Upload */}
        {activeStep === 'upload' && (
          <div
            className="rounded-2xl p-8"
            style={{
              background: '#12121a',
              border: '1px solid rgba(63, 63, 70, 0.5)',
            }}
          >
            {/* Dropzone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragActive(true); }}
              onDragLeave={() => setIsDragActive(false)}
              onDrop={handleDrop}
              className={`
                relative border-2 border-dashed rounded-xl p-12
                transition-all duration-300 cursor-pointer
                ${isDragActive ? 'border-blue-500 bg-blue-500/5' : 'border-zinc-700 hover:border-zinc-600'}
              `}
              style={{
                background: isDragActive
                  ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(139, 92, 246, 0.02) 100%)'
                  : 'transparent',
              }}
            >
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelect}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />

              <div className="text-center">
                {isProcessing ? (
                  <>
                    <Loader2 className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-spin" />
                    <p className="text-lg font-medium text-white mb-2">Procesando archivo...</p>
                    <div className="w-64 h-2 bg-zinc-800 rounded-full mx-auto overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-sm text-zinc-500 mt-2">{uploadProgress}%</p>
                  </>
                ) : (
                  <>
                    <div
                      className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                      style={{
                        background: isDragActive
                          ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(139, 92, 246, 0.1) 100%)'
                          : 'rgba(63, 63, 70, 0.3)',
                      }}
                    >
                      <Upload className={`w-10 h-10 ${isDragActive ? 'text-blue-400' : 'text-zinc-500'}`} />
                    </div>
                    <p className="text-lg font-medium text-white mb-2">
                      {isDragActive ? 'Suelta el archivo aquí' : 'Arrastra tu archivo Excel aquí'}
                    </p>
                    <p className="text-sm text-zinc-500 mb-4">
                      o haz clic para seleccionar
                    </p>
                    <div className="flex items-center justify-center gap-4 text-xs text-zinc-600">
                      <span className="flex items-center gap-1">
                        <FileSpreadsheet className="w-4 h-4" />
                        .xlsx
                      </span>
                      <span className="flex items-center gap-1">
                        <FileSpreadsheet className="w-4 h-4" />
                        .xls
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        .csv
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Templates */}
            {templates.length > 0 && (
              <div className="mt-6">
                <button
                  onClick={() => setShowTemplates(!showTemplates)}
                  className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
                >
                  <Database className="w-4 h-4" />
                  Templates guardados ({templates.length})
                  {showTemplates ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showTemplates && (
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {templates.map(template => (
                      <div
                        key={template.id}
                        className="p-4 rounded-xl flex items-center justify-between"
                        style={{
                          background: 'rgba(63, 63, 70, 0.2)',
                          border: '1px solid rgba(63, 63, 70, 0.3)',
                        }}
                      >
                        <div>
                          <p className="text-sm font-medium text-white">{template.name}</p>
                          <p className="text-xs text-zinc-500">
                            {Object.keys(template.mappings).length} columnas mapeadas
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => applyTemplate(template)}
                            className="p-2 rounded-lg text-zinc-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteTemplate(template.id)}
                            className="p-2 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Download Template */}
            <div className="mt-6 flex items-center justify-center gap-4">
              <button
                onClick={() => {
                  // Create sample template
                  const ws = XLSX.utils.json_to_sheet([
                    {
                      'Nombre Cliente': 'Juan Pérez',
                      'Teléfono': '3001234567',
                      'Ciudad': 'Bogotá',
                      'Dirección': 'Calle 123 #45-67',
                      'Producto': 'Producto de prueba',
                      'Cantidad': 1,
                      'Valor': 50000,
                    }
                  ]);
                  const wb = XLSX.utils.book_new();
                  XLSX.utils.book_append_sheet(wb, ws, 'Pedidos');
                  XLSX.writeFile(wb, 'plantilla_pedidos_litper.xlsx');
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-white transition-colors"
                style={{ background: 'rgba(63, 63, 70, 0.3)' }}
              >
                <Download className="w-4 h-4" />
                Descargar plantilla de ejemplo
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Column Mapping */}
        {activeStep === 'mapping' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Excel Preview */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: '#12121a',
                border: '1px solid rgba(63, 63, 70, 0.5)',
              }}
            >
              <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(63, 63, 70, 0.5)' }}>
                <div className="flex items-center gap-3">
                  <Eye className="w-5 h-5 text-blue-400" />
                  <div>
                    <h3 className="text-sm font-medium text-white">Vista Previa</h3>
                    <p className="text-xs text-zinc-500">{file?.name} • {rawData.length} filas</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAllRows(!showAllRows)}
                  className="text-xs text-zinc-400 hover:text-white transition-colors"
                >
                  {showAllRows ? 'Mostrar 10' : 'Mostrar todas'}
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: 'rgba(63, 63, 70, 0.2)' }}>
                      <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        #
                      </th>
                      {headers.map((header, i) => (
                        <th key={i} className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider whitespace-nowrap">
                          {header}
                          {columnMapping[header] && (
                            <span className="ml-2 text-blue-400 normal-case">
                              → {LITPER_FIELDS.find(f => f.id === columnMapping[header])?.label}
                            </span>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(showAllRows ? rawData : rawData.slice(0, 10)).map((row, i) => (
                      <tr
                        key={i}
                        className="border-t"
                        style={{ borderColor: 'rgba(63, 63, 70, 0.3)' }}
                      >
                        <td className="px-4 py-2 text-zinc-600">{i + 2}</td>
                        {headers.map((header, j) => (
                          <td key={j} className="px-4 py-2 text-zinc-300 whitespace-nowrap max-w-[200px] truncate">
                            {row[header] ?? '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Column Mapping */}
            <div
              className="rounded-2xl"
              style={{
                background: '#12121a',
                border: '1px solid rgba(63, 63, 70, 0.5)',
              }}
            >
              <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(63, 63, 70, 0.5)' }}>
                <div className="flex items-center gap-3">
                  <ArrowRight className="w-5 h-5 text-purple-400" />
                  <div>
                    <h3 className="text-sm font-medium text-white">Mapeo de Columnas</h3>
                    <p className="text-xs text-zinc-500">
                      {mappedFieldsCount} de {headers.length} columnas mapeadas •
                      <span className={requiredFieldsMapped === totalRequiredFields ? 'text-green-400' : 'text-amber-400'}>
                        {' '}{requiredFieldsMapped}/{totalRequiredFields} requeridos
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-3 max-h-[500px] overflow-y-auto">
                {headers.map((header, i) => {
                  const mappedField = LITPER_FIELDS.find(f => f.id === columnMapping[header]);

                  return (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 rounded-xl transition-colors"
                      style={{
                        background: columnMapping[header] ? 'rgba(59, 130, 246, 0.05)' : 'rgba(63, 63, 70, 0.2)',
                        border: `1px solid ${columnMapping[header] ? 'rgba(59, 130, 246, 0.2)' : 'rgba(63, 63, 70, 0.3)'}`,
                      }}
                    >
                      {/* Excel Column */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="w-4 h-4 text-green-400 flex-shrink-0" />
                          <span className="text-sm font-medium text-white truncate">{header}</span>
                        </div>
                        <p className="text-xs text-zinc-500 mt-0.5 truncate">
                          Ej: {rawData[0]?.[header] ?? 'vacío'}
                        </p>
                      </div>

                      {/* Arrow */}
                      <ArrowRight className="w-4 h-4 text-zinc-600 flex-shrink-0" />

                      {/* LITPER Field Selector */}
                      <div className="flex-1">
                        <select
                          value={columnMapping[header] || ''}
                          onChange={(e) => setColumnMapping(prev => ({ ...prev, [header]: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg text-sm bg-transparent text-white outline-none cursor-pointer"
                          style={{
                            background: 'rgba(63, 63, 70, 0.3)',
                            border: '1px solid rgba(63, 63, 70, 0.5)',
                          }}
                        >
                          <option value="" style={{ background: '#1a1a24' }}>-- Sin mapear --</option>
                          {LITPER_FIELDS.map(field => (
                            <option key={field.id} value={field.id} style={{ background: '#1a1a24' }}>
                              {field.required ? '* ' : ''}{field.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Status Icon */}
                      {mappedField && (
                        <div className="flex-shrink-0">
                          {mappedField.required ? (
                            <CheckCircle className="w-5 h-5 text-green-400" />
                          ) : (
                            <CheckCircle className="w-5 h-5 text-blue-400" />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Actions */}
              <div className="px-5 py-4 flex items-center justify-between" style={{ borderTop: '1px solid rgba(63, 63, 70, 0.5)' }}>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="Nombre del template..."
                    className="px-3 py-2 rounded-lg text-sm bg-transparent text-white outline-none placeholder:text-zinc-600"
                    style={{
                      background: 'rgba(63, 63, 70, 0.3)',
                      border: '1px solid rgba(63, 63, 70, 0.5)',
                    }}
                  />
                  <button
                    onClick={saveTemplate}
                    disabled={!templateName.trim()}
                    className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={validateData}
                  disabled={requiredFieldsMapped < totalRequiredFields}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all disabled:opacity-50"
                  style={{
                    background: requiredFieldsMapped >= totalRequiredFields
                      ? 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)'
                      : 'rgba(63, 63, 70, 0.5)',
                  }}
                >
                  Validar Datos
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Validation */}
        {activeStep === 'validation' && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div
                className="p-5 rounded-xl"
                style={{
                  background: '#12121a',
                  border: '1px solid rgba(63, 63, 70, 0.5)',
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
                    <Database className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{processedData.length}</p>
                    <p className="text-xs text-zinc-500">Total de filas</p>
                  </div>
                </div>
              </div>

              <div
                className="p-5 rounded-xl"
                style={{
                  background: '#12121a',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-emerald-400">{validRows.length}</p>
                    <p className="text-xs text-zinc-500">Filas válidas</p>
                  </div>
                </div>
              </div>

              <div
                className="p-5 rounded-xl"
                style={{
                  background: '#12121a',
                  border: `1px solid ${errorCount > 0 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(63, 63, 70, 0.5)'}`,
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg" style={{ background: errorCount > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(63, 63, 70, 0.3)' }}>
                    <XCircle className={`w-5 h-5 ${errorCount > 0 ? 'text-red-400' : 'text-zinc-500'}`} />
                  </div>
                  <div>
                    <p className={`text-2xl font-bold ${errorCount > 0 ? 'text-red-400' : 'text-zinc-500'}`}>{errorCount}</p>
                    <p className="text-xs text-zinc-500">Errores</p>
                  </div>
                </div>
              </div>

              <div
                className="p-5 rounded-xl"
                style={{
                  background: '#12121a',
                  border: `1px solid ${warningCount > 0 ? 'rgba(245, 158, 11, 0.3)' : 'rgba(63, 63, 70, 0.5)'}`,
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg" style={{ background: warningCount > 0 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(63, 63, 70, 0.3)' }}>
                    <AlertTriangle className={`w-5 h-5 ${warningCount > 0 ? 'text-amber-400' : 'text-zinc-500'}`} />
                  </div>
                  <div>
                    <p className={`text-2xl font-bold ${warningCount > 0 ? 'text-amber-400' : 'text-zinc-500'}`}>{warningCount}</p>
                    <p className="text-xs text-zinc-500">Advertencias</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Errors List */}
            {invalidRows.length > 0 && (
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  background: '#12121a',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                }}
              >
                <div className="px-5 py-4 flex items-center gap-3" style={{ borderBottom: '1px solid rgba(63, 63, 70, 0.5)' }}>
                  <XCircle className="w-5 h-5 text-red-400" />
                  <h3 className="text-sm font-medium text-white">Filas con errores ({invalidRows.length})</h3>
                </div>

                <div className="max-h-[400px] overflow-y-auto">
                  {invalidRows.map((row, i) => (
                    <div
                      key={i}
                      className="border-b last:border-b-0"
                      style={{ borderColor: 'rgba(63, 63, 70, 0.3)' }}
                    >
                      <button
                        onClick={() => {
                          const newExpanded = new Set(expandedErrors);
                          if (newExpanded.has(row._rowNumber)) {
                            newExpanded.delete(row._rowNumber);
                          } else {
                            newExpanded.add(row._rowNumber);
                          }
                          setExpandedErrors(newExpanded);
                        }}
                        className="w-full px-5 py-3 flex items-center justify-between hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-zinc-400">Fila {row._rowNumber}</span>
                          <span className="text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded">
                            {row._errors.filter(e => e.type === 'error').length} errores
                          </span>
                          {row._errors.some(e => e.type === 'warning') && (
                            <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                              {row._errors.filter(e => e.type === 'warning').length} advertencias
                            </span>
                          )}
                        </div>
                        {expandedErrors.has(row._rowNumber) ? (
                          <ChevronUp className="w-4 h-4 text-zinc-500" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-zinc-500" />
                        )}
                      </button>

                      {expandedErrors.has(row._rowNumber) && (
                        <div className="px-5 pb-4 space-y-2">
                          {row._errors.map((error, j) => (
                            <div
                              key={j}
                              className="flex items-start gap-3 p-3 rounded-lg"
                              style={{
                                background: error.type === 'error'
                                  ? 'rgba(239, 68, 68, 0.05)'
                                  : 'rgba(245, 158, 11, 0.05)',
                              }}
                            >
                              {error.type === 'error' ? (
                                <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                              ) : (
                                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                              )}
                              <div>
                                <p className="text-sm text-white">
                                  <span className="font-medium">{error.column}:</span> {error.message}
                                </p>
                                <p className="text-xs text-zinc-500 mt-0.5">
                                  Valor actual: "{error.value || '(vacío)'}"
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Valid Rows Preview */}
            {validRows.length > 0 && (
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  background: '#12121a',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                }}
              >
                <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(63, 63, 70, 0.5)' }}>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-sm font-medium text-white">Filas válidas listas para importar ({validRows.length})</h3>
                  </div>
                </div>

                <div className="overflow-x-auto max-h-[300px]">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0" style={{ background: '#12121a' }}>
                      <tr style={{ background: 'rgba(63, 63, 70, 0.2)' }}>
                        <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">#</th>
                        {Object.values(columnMapping).filter(Boolean).slice(0, 6).map((fieldId, i) => {
                          const field = LITPER_FIELDS.find(f => f.id === fieldId);
                          return (
                            <th key={i} className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider whitespace-nowrap">
                              {field?.label || fieldId}
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {validRows.slice(0, 10).map((row, i) => (
                        <tr
                          key={i}
                          className="border-t"
                          style={{ borderColor: 'rgba(63, 63, 70, 0.3)' }}
                        >
                          <td className="px-4 py-2 text-zinc-600">{row._rowNumber}</td>
                          {Object.entries(columnMapping).filter(([_, v]) => v).slice(0, 6).map(([excelCol, _], j) => (
                            <td key={j} className="px-4 py-2 text-zinc-300 whitespace-nowrap max-w-[150px] truncate">
                              {row[excelCol] ?? '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setActiveStep('mapping')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-white transition-colors"
                style={{ background: 'rgba(63, 63, 70, 0.3)' }}
              >
                <ArrowRight className="w-4 h-4 rotate-180" />
                Volver al mapeo
              </button>

              <button
                onClick={() => setActiveStep('summary')}
                disabled={validRows.length === 0}
                className="flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium text-white transition-all disabled:opacity-50"
                style={{
                  background: validRows.length > 0
                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                    : 'rgba(63, 63, 70, 0.5)',
                }}
              >
                <Sparkles className="w-4 h-4" />
                Importar {validRows.length} pedidos
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Summary */}
        {activeStep === 'summary' && (
          <div
            className="rounded-2xl p-8 text-center"
            style={{
              background: '#12121a',
              border: '1px solid rgba(16, 185, 129, 0.3)',
            }}
          >
            <div
              className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
              style={{ background: 'rgba(16, 185, 129, 0.1)' }}
            >
              <CheckCircle className="w-10 h-10 text-emerald-400" />
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">¡Importación Lista!</h2>
            <p className="text-zinc-400 mb-6">
              {validRows.length} pedidos están listos para ser procesados
            </p>

            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="text-center">
                <p className="text-3xl font-bold text-emerald-400">{validRows.length}</p>
                <p className="text-xs text-zinc-500">Pedidos válidos</p>
              </div>
              {invalidRows.length > 0 && (
                <>
                  <div className="w-px h-12 bg-zinc-800" />
                  <div className="text-center">
                    <p className="text-3xl font-bold text-red-400">{invalidRows.length}</p>
                    <p className="text-xs text-zinc-500">Omitidos</p>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => {
                  // Reset all state
                  setFile(null);
                  setHeaders([]);
                  setRawData([]);
                  setProcessedData([]);
                  setColumnMapping({});
                  setActiveStep('upload');
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-white transition-colors"
                style={{ background: 'rgba(63, 63, 70, 0.3)' }}
              >
                <RefreshCw className="w-4 h-4" />
                Nueva importación
              </button>

              <button
                onClick={() => {
                  // In real app, this would send to API
                  console.log('Importing:', validRows);
                  alert(`¡${validRows.length} pedidos importados exitosamente!`);
                }}
                className="flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium text-white"
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                }}
              >
                <CheckCircle className="w-4 h-4" />
                Confirmar importación
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExcelUploadPage;
