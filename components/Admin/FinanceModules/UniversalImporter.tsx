// ============================================
// LITPER PRO - UNIVERSAL IMPORTER
// Importador universal de Excel/CSV
// ============================================

import React, { useState, useCallback } from 'react';
import {
  Upload,
  FileSpreadsheet,
  Download,
  X,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Eye,
  Database,
  FileText,
  Users,
  Receipt,
  Trash2,
  Check,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react';
import * as XLSX from 'xlsx';

// ============================================
// TIPOS
// ============================================

type ImportDestination = 'gastos' | 'facturas' | 'empleados';

interface ColumnMapping {
  sourceColumn: string;
  targetField: string;
  sample: string;
}

interface ValidationError {
  row: number;
  column: string;
  message: string;
  value: any;
}

interface ImportResult {
  success: number;
  failed: number;
  errors: ValidationError[];
}

// ============================================
// CONSTANTES
// ============================================

const STORAGE_KEYS: Record<ImportDestination, string> = {
  gastos: 'litper_expenses',
  facturas: 'litper_invoices',
  empleados: 'litper_employees',
};

const FIELD_MAPPINGS: Record<ImportDestination, { field: string; label: string; required: boolean }[]> = {
  gastos: [
    { field: 'date', label: 'Fecha', required: true },
    { field: 'description', label: 'Descripción', required: true },
    { field: 'amount', label: 'Monto', required: true },
    { field: 'category', label: 'Categoría', required: false },
    { field: 'provider', label: 'Proveedor', required: false },
    { field: 'notes', label: 'Notas', required: false },
  ],
  facturas: [
    { field: 'date', label: 'Fecha', required: true },
    { field: 'clientNit', label: 'NIT Cliente', required: true },
    { field: 'clientName', label: 'Nombre Cliente', required: true },
    { field: 'description', label: 'Descripción', required: true },
    { field: 'subtotal', label: 'Subtotal', required: true },
    { field: 'iva', label: 'IVA', required: false },
    { field: 'total', label: 'Total', required: true },
    { field: 'status', label: 'Estado', required: false },
  ],
  empleados: [
    { field: 'cedula', label: 'Cédula', required: true },
    { field: 'name', label: 'Nombre', required: true },
    { field: 'position', label: 'Cargo', required: true },
    { field: 'department', label: 'Departamento', required: false },
    { field: 'baseSalary', label: 'Salario Base', required: true },
    { field: 'startDate', label: 'Fecha Ingreso', required: false },
    { field: 'email', label: 'Email', required: false },
    { field: 'phone', label: 'Teléfono', required: false },
  ],
};

const DESTINATION_CONFIG: Record<ImportDestination, { label: string; icon: React.ElementType; color: string }> = {
  gastos: { label: 'Gastos', icon: Receipt, color: 'red' },
  facturas: { label: 'Facturas', icon: FileText, color: 'blue' },
  empleados: { label: 'Empleados', icon: Users, color: 'purple' },
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export const UniversalImporter: React.FC = () => {
  // Estados
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview' | 'result'>('upload');
  const [fileName, setFileName] = useState('');
  const [rawData, setRawData] = useState<any[]>([]);
  const [sourceColumns, setSourceColumns] = useState<string[]>([]);
  const [destination, setDestination] = useState<ImportDestination>('gastos');
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [showPreviewDetails, setShowPreviewDetails] = useState(false);

  // Reset
  const resetImporter = () => {
    setStep('upload');
    setFileName('');
    setRawData([]);
    setSourceColumns([]);
    setColumnMappings([]);
    setValidationErrors([]);
    setImportResult(null);
  };

  // Manejar archivo
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheet = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheet];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          alert('El archivo está vacío');
          return;
        }

        setRawData(jsonData);

        // Detectar columnas
        const columns = Object.keys(jsonData[0] as object);
        setSourceColumns(columns);

        // Auto-mapear columnas
        const autoMappings: ColumnMapping[] = columns.map(col => {
          const lower = col.toLowerCase();
          let targetField = '';

          // Intentar auto-detectar basado en nombre de columna
          if (lower.includes('fecha') || lower.includes('date')) targetField = 'date';
          else if (lower.includes('desc') || lower.includes('concepto') || lower.includes('detalle')) targetField = 'description';
          else if (lower.includes('monto') || lower.includes('valor') || lower.includes('amount') || lower.includes('total')) targetField = 'amount';
          else if (lower.includes('categ')) targetField = 'category';
          else if (lower.includes('prov') || lower.includes('empresa') || lower.includes('vendedor')) targetField = 'provider';
          else if (lower.includes('nit') || lower.includes('rut')) targetField = 'clientNit';
          else if (lower.includes('nombre') || lower.includes('name') || lower.includes('cliente')) targetField = 'clientName';
          else if (lower.includes('cedula') || lower.includes('documento') || lower.includes('cc')) targetField = 'cedula';
          else if (lower.includes('cargo') || lower.includes('posicion') || lower.includes('puesto')) targetField = 'position';
          else if (lower.includes('depart') || lower.includes('area')) targetField = 'department';
          else if (lower.includes('salario') || lower.includes('sueldo')) targetField = 'baseSalary';
          else if (lower.includes('email') || lower.includes('correo')) targetField = 'email';
          else if (lower.includes('tel') || lower.includes('phone') || lower.includes('celular')) targetField = 'phone';
          else if (lower.includes('subtotal')) targetField = 'subtotal';
          else if (lower.includes('iva') || lower.includes('impuesto')) targetField = 'iva';
          else if (lower.includes('estado') || lower.includes('status')) targetField = 'status';
          else if (lower.includes('nota') || lower.includes('observ') || lower.includes('coment')) targetField = 'notes';

          return {
            sourceColumn: col,
            targetField,
            sample: String((jsonData[0] as any)[col] || ''),
          };
        });

        setColumnMappings(autoMappings);
        setStep('mapping');
      } catch (err) {
        console.error('Error reading file:', err);
        alert('Error al leer el archivo. Verifica que sea un archivo Excel o CSV válido.');
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  }, []);

  // Actualizar mapeo
  const updateMapping = (sourceColumn: string, targetField: string) => {
    setColumnMappings(prev =>
      prev.map(m =>
        m.sourceColumn === sourceColumn ? { ...m, targetField } : m
      )
    );
  };

  // Validar datos
  const validateData = (): ValidationError[] => {
    const errors: ValidationError[] = [];
    const requiredFields = FIELD_MAPPINGS[destination].filter(f => f.required).map(f => f.field);
    const mappedFields = columnMappings.filter(m => m.targetField).map(m => m.targetField);

    // Verificar campos requeridos
    requiredFields.forEach(field => {
      if (!mappedFields.includes(field)) {
        errors.push({
          row: 0,
          column: field,
          message: `El campo "${FIELD_MAPPINGS[destination].find(f => f.field === field)?.label}" es requerido pero no está mapeado`,
          value: null,
        });
      }
    });

    // Validar cada fila
    rawData.forEach((row, idx) => {
      columnMappings.forEach(mapping => {
        if (!mapping.targetField) return;

        const value = row[mapping.sourceColumn];

        // Validar campos numéricos
        if (['amount', 'subtotal', 'total', 'iva', 'baseSalary'].includes(mapping.targetField)) {
          const numValue = parseFloat(value);
          if (value !== undefined && value !== '' && isNaN(numValue)) {
            errors.push({
              row: idx + 1,
              column: mapping.targetField,
              message: `Valor no numérico`,
              value,
            });
          }
        }

        // Validar campos requeridos vacíos
        if (requiredFields.includes(mapping.targetField) && (value === undefined || value === '')) {
          errors.push({
            row: idx + 1,
            column: mapping.targetField,
            message: `Campo requerido vacío`,
            value,
          });
        }
      });
    });

    return errors;
  };

  // Ir a preview
  const goToPreview = () => {
    const errors = validateData();
    setValidationErrors(errors);
    setStep('preview');
  };

  // Transformar datos para importación
  const transformData = (row: any): any => {
    const transformed: any = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
    };

    columnMappings.forEach(mapping => {
      if (!mapping.targetField) return;

      let value = row[mapping.sourceColumn];

      // Transformar según tipo de campo
      if (['amount', 'subtotal', 'total', 'iva', 'baseSalary'].includes(mapping.targetField)) {
        value = parseFloat(value) || 0;
      } else if (mapping.targetField === 'date' || mapping.targetField === 'startDate') {
        // Manejar fechas de Excel
        if (typeof value === 'number') {
          const excelDate = new Date((value - 25569) * 86400 * 1000);
          value = excelDate.toISOString().split('T')[0];
        } else if (value) {
          try {
            value = new Date(value).toISOString().split('T')[0];
          } catch {
            value = new Date().toISOString().split('T')[0];
          }
        }
      } else if (mapping.targetField === 'category') {
        // Normalizar categorías para gastos
        const cat = String(value || '').toLowerCase();
        if (cat.includes('public') || cat.includes('market')) value = 'publicidad';
        else if (cat.includes('nomin') || cat.includes('salari') || cat.includes('person')) value = 'nomina';
        else if (cat.includes('servic')) value = 'servicios';
        else if (cat.includes('logis') || cat.includes('envio') || cat.includes('transp')) value = 'logistica';
        else value = 'otros';
      } else if (mapping.targetField === 'status') {
        // Normalizar estados para facturas
        const status = String(value || '').toLowerCase();
        if (status.includes('pag')) value = 'pagada';
        else if (status.includes('env')) value = 'enviada';
        else if (status.includes('venc')) value = 'vencida';
        else value = 'borrador';
      }

      transformed[mapping.targetField] = value;
    });

    // Agregar campos por defecto según destino
    if (destination === 'gastos') {
      if (!transformed.category) transformed.category = 'otros';
      if (!transformed.notes) transformed.notes = `Importado desde ${fileName}`;
    } else if (destination === 'facturas') {
      const counter = parseInt(localStorage.getItem('litper_invoice_counter') || '0') + 1;
      localStorage.setItem('litper_invoice_counter', counter.toString());
      transformed.number = `LITPER-${new Date().getFullYear()}-${counter.toString().padStart(4, '0')}`;
      transformed.dueDate = transformed.date;
      if (!transformed.status) transformed.status = 'borrador';
      transformed.client = {
        nit: transformed.clientNit || '',
        name: transformed.clientName || '',
        address: '',
        phone: '',
        email: '',
      };
      transformed.items = [{
        id: Date.now().toString(),
        description: transformed.description || 'Item importado',
        quantity: 1,
        unitPrice: transformed.subtotal || transformed.total || 0,
        iva: 19,
        subtotal: transformed.subtotal || transformed.total || 0,
        ivaAmount: transformed.iva || 0,
        total: transformed.total || 0,
      }];
      transformed.totalIva = transformed.iva || 0;
      transformed.notes = `Importado desde ${fileName}`;
    } else if (destination === 'empleados') {
      transformed.active = true;
      if (!transformed.bankAccount) transformed.bankAccount = '';
      if (!transformed.bankName) transformed.bankName = '';
    }

    return transformed;
  };

  // Ejecutar importación
  const executeImport = async () => {
    setIsImporting(true);

    const storageKey = STORAGE_KEYS[destination];
    const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');

    let success = 0;
    let failed = 0;
    const errors: ValidationError[] = [];

    for (let i = 0; i < rawData.length; i++) {
      try {
        const transformed = transformData(rawData[i]);
        existing.unshift(transformed);
        success++;
      } catch (err: any) {
        failed++;
        errors.push({
          row: i + 1,
          column: 'general',
          message: err.message || 'Error al transformar',
          value: null,
        });
      }
    }

    localStorage.setItem(storageKey, JSON.stringify(existing));

    setImportResult({ success, failed, errors });
    setStep('result');
    setIsImporting(false);
  };

  // Descargar plantilla
  const downloadTemplate = (dest: ImportDestination) => {
    const fields = FIELD_MAPPINGS[dest];
    const headers = fields.map(f => f.label);
    const exampleRow = fields.map(f => {
      switch (f.field) {
        case 'date':
        case 'startDate':
          return '2024-01-15';
        case 'amount':
        case 'subtotal':
        case 'total':
          return '100000';
        case 'baseSalary':
          return '1300000';
        case 'iva':
          return '19000';
        case 'category':
          return 'servicios';
        case 'status':
          return 'pagada';
        default:
          return `Ejemplo ${f.label}`;
      }
    });

    const ws = XLSX.utils.aoa_to_sheet([headers, exampleRow]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Plantilla');
    XLSX.writeFile(wb, `Plantilla_${DESTINATION_CONFIG[dest].label}_LITPER.xlsx`);
  };

  // Renderizar paso actual
  const renderStep = () => {
    switch (step) {
      case 'upload':
        return (
          <div className="space-y-6">
            {/* Destination Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">
                ¿A dónde quieres importar los datos?
              </label>
              <div className="grid md:grid-cols-3 gap-4">
                {(Object.entries(DESTINATION_CONFIG) as [ImportDestination, typeof DESTINATION_CONFIG['gastos']][]).map(([key, config]) => {
                  const Icon = config.icon;
                  return (
                    <button
                      key={key}
                      onClick={() => setDestination(key)}
                      className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                        destination === key
                          ? `border-${config.color}-500 bg-${config.color}-50 dark:bg-${config.color}-900/20`
                          : 'border-slate-200 dark:border-navy-700 hover:border-slate-300'
                      }`}
                    >
                      <Icon className={`w-8 h-8 text-${config.color}-500`} />
                      <span className="font-medium text-slate-700 dark:text-white">{config.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Upload Zone */}
            <div className="relative">
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload-universal"
              />
              <label
                htmlFor="file-upload-universal"
                className="block p-12 border-2 border-dashed border-slate-300 dark:border-navy-600 rounded-2xl text-center cursor-pointer hover:border-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 transition-all"
              >
                <Upload className="w-16 h-16 mx-auto text-slate-400 mb-4" />
                <p className="text-lg font-bold text-slate-700 dark:text-white mb-2">
                  Arrastra tu archivo aquí
                </p>
                <p className="text-sm text-slate-500">
                  o haz clic para seleccionar un archivo Excel o CSV
                </p>
                <p className="text-xs text-slate-400 mt-2">
                  Formatos soportados: .xlsx, .xls, .csv
                </p>
              </label>
            </div>

            {/* Templates */}
            <div className="p-4 bg-slate-50 dark:bg-navy-800 rounded-xl">
              <h4 className="font-bold text-slate-700 dark:text-white mb-3 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
                Descargar Plantillas
              </h4>
              <div className="flex flex-wrap gap-3">
                {(Object.entries(DESTINATION_CONFIG) as [ImportDestination, typeof DESTINATION_CONFIG['gastos']][]).map(([key, config]) => (
                  <button
                    key={key}
                    onClick={() => downloadTemplate(key)}
                    className={`flex items-center gap-2 px-4 py-2 bg-${config.color}-100 dark:bg-${config.color}-900/30 text-${config.color}-700 dark:text-${config.color}-400 rounded-lg text-sm font-medium hover:bg-${config.color}-200 dark:hover:bg-${config.color}-900/50 transition-all`}
                  >
                    <Download className="w-4 h-4" />
                    Plantilla {config.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 'mapping':
        return (
          <div className="space-y-6">
            {/* File Info */}
            <div className="flex items-center justify-between p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-xl border border-cyan-200 dark:border-cyan-800">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-8 h-8 text-cyan-500" />
                <div>
                  <p className="font-bold text-slate-700 dark:text-white">{fileName}</p>
                  <p className="text-sm text-slate-500">{rawData.length} filas encontradas</p>
                </div>
              </div>
              <button
                onClick={resetImporter}
                className="p-2 text-slate-400 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            {/* Destination */}
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-500">Importar a:</span>
              <div className="flex gap-2">
                {(Object.entries(DESTINATION_CONFIG) as [ImportDestination, typeof DESTINATION_CONFIG['gastos']][]).map(([key, config]) => {
                  const Icon = config.icon;
                  return (
                    <button
                      key={key}
                      onClick={() => setDestination(key)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        destination === key
                          ? `bg-${config.color}-500 text-white`
                          : 'bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {config.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Column Mappings */}
            <div>
              <h4 className="font-bold text-slate-700 dark:text-white mb-4">Mapeo de Columnas</h4>
              <div className="space-y-3">
                {columnMappings.map(mapping => (
                  <div
                    key={mapping.sourceColumn}
                    className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-navy-800 rounded-xl"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-slate-700 dark:text-white">{mapping.sourceColumn}</p>
                      <p className="text-xs text-slate-400 truncate">Ej: {mapping.sample}</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-400" />
                    <div className="flex-1">
                      <select
                        value={mapping.targetField}
                        onChange={(e) => updateMapping(mapping.sourceColumn, e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 outline-none"
                      >
                        <option value="">-- Ignorar columna --</option>
                        {FIELD_MAPPINGS[destination].map(field => (
                          <option key={field.field} value={field.field}>
                            {field.label} {field.required && '*'}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between">
              <button
                onClick={resetImporter}
                className="px-6 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-800 rounded-xl font-medium transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={goToPreview}
                className="flex items-center gap-2 px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-medium transition-all shadow-lg shadow-cyan-500/30"
              >
                Vista Previa
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        );

      case 'preview':
        const criticalErrors = validationErrors.filter(e => e.row === 0);
        const rowErrors = validationErrors.filter(e => e.row > 0);
        const canImport = criticalErrors.length === 0;

        return (
          <div className="space-y-6">
            {/* Validation Summary */}
            <div className={`p-4 rounded-xl border ${
              criticalErrors.length > 0
                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                : rowErrors.length > 0
                ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
            }`}>
              <div className="flex items-start gap-3">
                {criticalErrors.length > 0 ? (
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                ) : rowErrors.length > 0 ? (
                  <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <h4 className="font-bold text-slate-700 dark:text-white">
                    {criticalErrors.length > 0
                      ? 'Errores críticos encontrados'
                      : rowErrors.length > 0
                      ? `${rowErrors.length} advertencias en los datos`
                      : 'Validación exitosa'}
                  </h4>
                  {criticalErrors.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {criticalErrors.map((err, idx) => (
                        <li key={idx} className="text-sm text-red-600">{err.message}</li>
                      ))}
                    </ul>
                  )}
                  {rowErrors.length > 0 && criticalErrors.length === 0 && (
                    <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                      Los registros con errores se importarán con valores por defecto
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Preview Data */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-slate-700 dark:text-white">
                  Vista Previa ({Math.min(10, rawData.length)} de {rawData.length} registros)
                </h4>
                <button
                  onClick={() => setShowPreviewDetails(!showPreviewDetails)}
                  className="flex items-center gap-1 text-sm text-cyan-600 hover:text-cyan-700"
                >
                  {showPreviewDetails ? 'Ocultar' : 'Ver'} detalles
                  {showPreviewDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-200 dark:border-navy-700 rounded-xl">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-navy-800">
                      <th className="text-left py-3 px-4 text-xs font-bold text-slate-500">#</th>
                      {columnMappings.filter(m => m.targetField).map(m => (
                        <th key={m.sourceColumn} className="text-left py-3 px-4 text-xs font-bold text-slate-500">
                          {FIELD_MAPPINGS[destination].find(f => f.field === m.targetField)?.label || m.targetField}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rawData.slice(0, 10).map((row, idx) => (
                      <tr key={idx} className="border-t border-slate-100 dark:border-navy-700">
                        <td className="py-3 px-4 text-slate-400">{idx + 1}</td>
                        {columnMappings.filter(m => m.targetField).map(m => {
                          const hasError = rowErrors.some(e => e.row === idx + 1 && e.column === m.targetField);
                          return (
                            <td
                              key={m.sourceColumn}
                              className={`py-3 px-4 ${
                                hasError ? 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' : 'text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {String(row[m.sourceColumn] || '-')}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Errors Detail */}
            {showPreviewDetails && rowErrors.length > 0 && (
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl max-h-48 overflow-y-auto">
                <h5 className="font-bold text-slate-700 dark:text-white mb-2">Detalles de Advertencias</h5>
                <ul className="space-y-1 text-sm">
                  {rowErrors.slice(0, 20).map((err, idx) => (
                    <li key={idx} className="text-amber-700 dark:text-amber-400">
                      Fila {err.row}: {err.message} en "{err.column}" (valor: {err.value})
                    </li>
                  ))}
                  {rowErrors.length > 20 && (
                    <li className="text-amber-600">...y {rowErrors.length - 20} advertencias más</li>
                  )}
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-between">
              <button
                onClick={() => setStep('mapping')}
                className="px-6 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-800 rounded-xl font-medium transition-all"
              >
                Volver
              </button>
              <button
                onClick={executeImport}
                disabled={!canImport || isImporting}
                className="flex items-center gap-2 px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/30"
              >
                {isImporting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4" />
                    Importar {rawData.length} Registros
                  </>
                )}
              </button>
            </div>
          </div>
        );

      case 'result':
        return (
          <div className="text-center space-y-6">
            <div className={`inline-flex p-6 rounded-full ${
              importResult?.failed === 0
                ? 'bg-emerald-100 dark:bg-emerald-900/30'
                : 'bg-amber-100 dark:bg-amber-900/30'
            }`}>
              {importResult?.failed === 0 ? (
                <CheckCircle className="w-16 h-16 text-emerald-500" />
              ) : (
                <AlertTriangle className="w-16 h-16 text-amber-500" />
              )}
            </div>

            <div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                Importación Completada
              </h3>
              <p className="text-slate-500 dark:text-slate-400">
                Se procesaron {(importResult?.success || 0) + (importResult?.failed || 0)} registros
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                <p className="text-3xl font-black text-emerald-600">{importResult?.success || 0}</p>
                <p className="text-sm text-slate-500">Exitosos</p>
              </div>
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
                <p className="text-3xl font-black text-red-600">{importResult?.failed || 0}</p>
                <p className="text-sm text-slate-500">Fallidos</p>
              </div>
            </div>

            {importResult?.errors && importResult.errors.length > 0 && (
              <div className="p-4 bg-slate-50 dark:bg-navy-800 rounded-xl text-left max-w-md mx-auto">
                <h4 className="font-bold text-slate-700 dark:text-white mb-2">Errores</h4>
                <ul className="space-y-1 text-sm text-red-600 dark:text-red-400">
                  {importResult.errors.slice(0, 5).map((err, idx) => (
                    <li key={idx}>Fila {err.row}: {err.message}</li>
                  ))}
                </ul>
              </div>
            )}

            <button
              onClick={resetImporter}
              className="px-8 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-cyan-500/30"
            >
              Nueva Importación
            </button>
          </div>
        );
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Upload className="w-7 h-7 text-cyan-500" />
          Importador Universal
        </h2>
        <p className="text-slate-500 dark:text-slate-400">
          Importa datos desde Excel o CSV con mapeo inteligente
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {[
          { id: 'upload', label: 'Subir' },
          { id: 'mapping', label: 'Mapear' },
          { id: 'preview', label: 'Preview' },
          { id: 'result', label: 'Resultado' },
        ].map((s, idx) => (
          <React.Fragment key={s.id}>
            {idx > 0 && <div className="w-8 h-0.5 bg-slate-200 dark:bg-navy-700" />}
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-all ${
              step === s.id
                ? 'bg-cyan-500 text-white'
                : ['upload', 'mapping', 'preview', 'result'].indexOf(step) > idx
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-200 dark:bg-navy-700 text-slate-500'
            }`}>
              {['upload', 'mapping', 'preview', 'result'].indexOf(step) > idx ? (
                <Check className="w-4 h-4" />
              ) : (
                idx + 1
              )}
            </div>
          </React.Fragment>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-navy-800 rounded-2xl border border-slate-200 dark:border-navy-700 p-6">
        {renderStep()}
      </div>
    </div>
  );
};

export default UniversalImporter;
