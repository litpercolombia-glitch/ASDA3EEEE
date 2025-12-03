import React, { useState, useCallback } from 'react';
import {
  FileSpreadsheet,
  Upload,
  CheckCircle,
  AlertTriangle,
  X,
  Download,
  FileCheck,
  Table,
  Info,
} from 'lucide-react';
import { ExcelPreviewData, ExcelValidationResult, SemaforoExcelData, TasaEntregaRow, TiempoPromedioRow } from '../../types/logistics';

interface ExcelUploaderProps {
  pestaña: 'semaforo' | 'predicciones';
  onDataLoaded: (data: SemaforoExcelData) => void;
}

declare global {
  interface Window {
    XLSX: any;
  }
}

// Known Colombian carriers
const KNOWN_CARRIERS = [
  'COORDINADORA',
  'ENVIA',
  'INTERRAPIDISIMO',
  'TCC',
  'SERVIENTREGA',
  'DEPRISA',
  'VELOCES',
  'FUTURA',
  'JAMV-DRIVE',
  'JAMV',
  '472',
];

export const ExcelUploader: React.FC<ExcelUploaderProps> = ({
  pestaña,
  onDataLoaded,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [preview, setPreview] = useState<ExcelPreviewData | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [processedData, setProcessedData] = useState<SemaforoExcelData | null>(null);

  // Check if a string looks like a carrier name
  const isCarrier = (str: string): boolean => {
    if (!str) return false;
    const upper = str.trim().toUpperCase();
    return KNOWN_CARRIERS.some(c => upper.includes(c) || c.includes(upper));
  };

  // Check if a string is indented (indicates it's a child row in pivot table)
  const isIndented = (str: string): boolean => {
    if (!str || typeof str !== 'string') return false;
    return str.startsWith(' ') || str.startsWith('\t');
  };

  // Parse Excel date (can be number or string)
  const parseExcelDate = (value: any): Date | null => {
    if (!value) return null;

    // If it's a number (Excel serial date)
    if (typeof value === 'number') {
      const date = new Date((value - 25569) * 86400 * 1000);
      return isNaN(date.getTime()) ? null : date;
    }

    // If it's a string
    const str = String(value).trim();

    // Try DD-MM-YYYY or DD/MM/YYYY
    const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (dmyMatch) {
      const [, day, month, year] = dmyMatch;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }

    // Try YYYY-MM-DD
    const ymdMatch = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
    if (ymdMatch) {
      const [, year, month, day] = ymdMatch;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }

    // Try standard Date parse
    const date = new Date(str);
    return isNaN(date.getTime()) ? null : date;
  };

  // Process pivot table from "tasa de entregas" sheet
  const processPivotTable = (sheet: any, localWarnings: string[]): TasaEntregaRow[] => {
    const results: TasaEntregaRow[] = [];

    // Get raw data as array of arrays
    const data = window.XLSX.utils.sheet_to_json(sheet, { header: 1 });

    if (data.length < 5) {
      localWarnings.push('La hoja de tasas tiene muy pocas filas');
      return results;
    }

    // Find header row (look for "Etiquetas" or similar)
    let headerRowIdx = -1;
    let devolucionColIdx = -1;
    let devolucionPctColIdx = -1;
    let entregadoColIdx = -1;
    let entregadoPctColIdx = -1;
    let totalColIdx = -1;

    // Search for headers in first 10 rows
    for (let i = 0; i < Math.min(10, data.length); i++) {
      const row = data[i];
      if (!row) continue;

      // Look for column headers
      for (let j = 0; j < row.length; j++) {
        const cell = String(row[j] || '').toUpperCase().trim();

        if (cell.includes('ETIQUETA') || cell.includes('FILA')) {
          headerRowIdx = i;
        }
        if (cell.includes('DEVOLUCION') || cell.includes('DEVOLUCIÓN')) {
          if (devolucionColIdx === -1) devolucionColIdx = j;
          else if (devolucionPctColIdx === -1) devolucionPctColIdx = j;
        }
        if (cell.includes('ENTREGADO') || cell.includes('ENTREGA')) {
          if (entregadoColIdx === -1) entregadoColIdx = j;
          else if (entregadoPctColIdx === -1) entregadoPctColIdx = j;
        }
        if (cell === 'TOTAL' || cell.includes('TOTAL GENERAL')) {
          totalColIdx = j;
        }
      }
    }

    // Fallback: assume standard pivot table layout
    if (headerRowIdx === -1) headerRowIdx = 2; // Usually row 3 (0-indexed = 2)
    if (devolucionColIdx === -1) devolucionColIdx = 1;
    if (devolucionPctColIdx === -1) devolucionPctColIdx = 2;
    if (entregadoColIdx === -1) entregadoColIdx = 3;
    if (entregadoPctColIdx === -1) entregadoPctColIdx = 4;
    if (totalColIdx === -1) totalColIdx = 5;

    // Process data rows (starting after headers)
    let currentCity = '';
    const startRow = headerRowIdx + 2; // Skip header and subheader rows

    for (let i = startRow; i < data.length; i++) {
      const row = data[i];
      if (!row || !row[0]) continue;

      const label = String(row[0]).trim();
      if (!label || label.toLowerCase().includes('total')) continue; // Skip total rows

      // Check if this is a city (not indented and not a carrier)
      const isIndentedRow = isIndented(row[0]);
      const isCarrierRow = isCarrier(label);

      if (!isIndentedRow && !isCarrierRow) {
        // This is a city row
        currentCity = label.toUpperCase();
      } else if (currentCity) {
        // This is a carrier row under the current city
        const transportadora = label.toUpperCase().trim();

        const devolucionesCant = parseFloat(row[devolucionColIdx]) || 0;
        const devolucionesPct = parseFloat(row[devolucionPctColIdx]) || 0;
        const entregasCant = parseFloat(row[entregadoColIdx]) || 0;
        const entregasPct = parseFloat(row[entregadoPctColIdx]) || 0;
        const total = parseFloat(row[totalColIdx]) || (devolucionesCant + entregasCant);

        // Only add if we have meaningful data
        if (total > 0) {
          results.push({
            ciudad: currentCity,
            transportadora,
            devoluciones: devolucionesCant,
            devolucionesPct: devolucionesPct,
            entregas: entregasCant,
            entregasPct: entregasPct,
            total,
          });
        }
      }
    }

    // If pivot table parsing failed, try simple table format
    if (results.length === 0) {
      localWarnings.push('No se pudo procesar como tabla pivote, intentando formato simple...');
      return processSimpleTable(sheet, localWarnings);
    }

    return results;
  };

  // Fallback: Process simple table format
  const processSimpleTable = (sheet: any, localWarnings: string[]): TasaEntregaRow[] => {
    const results: TasaEntregaRow[] = [];
    const jsonData = window.XLSX.utils.sheet_to_json(sheet);

    if (jsonData.length === 0) return results;

    // Find column mappings
    const firstRow = jsonData[0];
    const columns = Object.keys(firstRow);

    const findColumn = (keywords: string[]): string | null => {
      for (const col of columns) {
        const upper = col.toUpperCase();
        for (const keyword of keywords) {
          if (upper.includes(keyword)) return col;
        }
      }
      return null;
    };

    const ciudadCol = findColumn(['CIUDAD', 'DESTINO', 'CITY']);
    const transCol = findColumn(['TRANSPORTADORA', 'CARRIER', 'TRANSPORT']);
    const devCol = findColumn(['DEVOLUCION', 'DEVOLUCIÓN', 'RETURN', 'DEV']);
    const entregaCol = findColumn(['ENTREGADO', 'ENTREGA', 'DELIVERED', 'ENT']);
    const totalCol = findColumn(['TOTAL']);

    if (!ciudadCol || !transCol) {
      localWarnings.push('No se encontraron columnas CIUDAD y TRANSPORTADORA');
      return results;
    }

    for (const row of jsonData) {
      const ciudad = String(row[ciudadCol] || '').toUpperCase().trim();
      const transportadora = String(row[transCol] || '').toUpperCase().trim();

      if (!ciudad || !transportadora) continue;

      const devoluciones = parseFloat(row[devCol || '']) || 0;
      const entregas = parseFloat(row[entregaCol || '']) || 0;
      const total = parseFloat(row[totalCol || '']) || (devoluciones + entregas);

      if (total > 0) {
        results.push({
          ciudad,
          transportadora,
          devoluciones,
          devolucionesPct: total > 0 ? devoluciones / total : 0,
          entregas,
          entregasPct: total > 0 ? entregas / total : 0,
          total,
        });
      }
    }

    return results;
  };

  // Process "Tiempo promedio" sheet
  const processTiempoPromedio = (sheet: any, localWarnings: string[]): TiempoPromedioRow[] => {
    const results: TiempoPromedioRow[] = [];
    const jsonData = window.XLSX.utils.sheet_to_json(sheet);

    if (jsonData.length === 0) {
      localWarnings.push('La hoja de tiempo promedio está vacía');
      return results;
    }

    const firstRow = jsonData[0];
    const columns = Object.keys(firstRow);

    const findColumn = (keywords: string[]): string | null => {
      for (const col of columns) {
        const upper = col.toUpperCase();
        for (const keyword of keywords) {
          if (upper.includes(keyword)) return col;
        }
      }
      return null;
    };

    // Find columns for detailed records format
    const ciudadCol = findColumn(['CIUDAD DESTINO', 'CIUDAD', 'DESTINO']);
    const transportadoraCol = findColumn(['TRANSPORTADORA', 'CARRIER']);
    const fechaCol = findColumn(['FECHA']);
    const fechaUltimoMovCol = findColumn(['ULTIMO MOV', 'ÚLTIMO MOV', 'FECHA ULTIMO']);
    const estatusCol = findColumn(['ESTATUS', 'STATUS', 'ESTADO']);
    const tiempoEntregaCol = findColumn(['TIEMPO ENTREGA', 'TIEMPO', 'DIAS', 'DÍAS']);
    const usuarioCol = findColumn(['USUARIO', 'USER']);

    if (!ciudadCol) {
      localWarnings.push('No se encontró columna de ciudad en hoja de tiempo promedio');
      return results;
    }

    // Group by city+carrier to calculate average time
    const groupedData: Record<string, { total: number; count: number; dias: number[] }> = {};

    for (const row of jsonData) {
      const ciudad = String(row[ciudadCol] || '').toUpperCase().trim();
      const transportadora = String(row[transportadoraCol || ''] || '').toUpperCase().trim() || 'DESCONOCIDO';

      if (!ciudad) continue;

      const tiempoEntrega = parseFloat(row[tiempoEntregaCol || '']) || 0;
      const key = `${ciudad}|${transportadora}`;

      if (!groupedData[key]) {
        groupedData[key] = { total: 0, count: 0, dias: [] };
      }

      if (tiempoEntrega > 0) {
        groupedData[key].total += tiempoEntrega;
        groupedData[key].count++;
        groupedData[key].dias.push(tiempoEntrega);
      }
    }

    // Convert to array with calculated averages
    for (const [key, data] of Object.entries(groupedData)) {
      const [ciudad, transportadora] = key.split('|');
      const avgDias = data.count > 0 ? Math.round(data.total / data.count) : 0;

      results.push({
        ciudad,
        transportadora,
        dias: avgDias,
      });
    }

    return results;
  };

  const processFile = async (file: File) => {
    setIsLoading(true);
    setError(null);
    setWarnings([]);
    setPreview(null);
    setProcessedData(null);

    try {
      if (!window.XLSX) {
        throw new Error('Librería Excel no disponible. Por favor recarga la página.');
      }

      const buffer = await file.arrayBuffer();
      const workbook = window.XLSX.read(buffer, { type: 'array' });
      const localWarnings: string[] = [];

      // Find required sheets (flexible matching)
      const findSheet = (keywords: string[]): string | null => {
        for (const name of workbook.SheetNames) {
          const upper = name.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          for (const keyword of keywords) {
            const normalizedKeyword = keyword.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            if (upper.includes(normalizedKeyword)) return name;
          }
        }
        return null;
      };

      // Find "tasa de entregas" sheet
      let tasaSheetName = findSheet(['TASA', 'ENTREGA', 'DELIVERY', 'RATE']);
      if (!tasaSheetName && workbook.SheetNames[0]) {
        tasaSheetName = workbook.SheetNames[0];
        localWarnings.push(`No se encontró hoja "tasa de entregas", usando "${tasaSheetName}"`);
      }

      // Find "Tiempo promedio" sheet
      let tiempoSheetName = findSheet(['TIEMPO', 'PROMEDIO', 'TIME', 'AVERAGE']);
      if (!tiempoSheetName && workbook.SheetNames[1]) {
        tiempoSheetName = workbook.SheetNames[1];
        localWarnings.push(`No se encontró hoja "Tiempo promedio", usando "${tiempoSheetName}"`);
      }

      if (!tasaSheetName) {
        throw new Error('No se encontró la hoja de tasas de entrega. El Excel debe tener al menos una hoja con datos de tasas.');
      }

      // Process sheets
      const tasaSheet = workbook.Sheets[tasaSheetName];
      const tasaEntregas = processPivotTable(tasaSheet, localWarnings);

      let tiempoPromedio: TiempoPromedioRow[] = [];
      if (tiempoSheetName) {
        const tiempoSheet = workbook.Sheets[tiempoSheetName];
        tiempoPromedio = processTiempoPromedio(tiempoSheet, localWarnings);
      }

      if (tasaEntregas.length === 0) {
        throw new Error('No se pudieron extraer datos de tasas de entrega del Excel. Verifica el formato.');
      }

      // Store processed data
      const data: SemaforoExcelData = { tasaEntregas, tiempoPromedio };
      setProcessedData(data);

      // Calculate totals for preview
      const totalEnvios = tasaEntregas.reduce((sum, r) => sum + r.total, 0);
      const totalRutas = tasaEntregas.length;
      const ciudadesUnicas = new Set(tasaEntregas.map(r => r.ciudad)).size;

      setWarnings(localWarnings);
      setPreview({
        fileName: file.name,
        sheets: workbook.SheetNames,
        recordCounts: {
          'Rutas ciudad-transportadora': totalRutas,
          'Ciudades únicas': ciudadesUnicas,
          'Total envíos procesados': totalEnvios,
          'Registros tiempo promedio': tiempoPromedio.length,
        },
        data: {
          tasaEntregas: tasaEntregas.slice(0, 5), // Preview first 5
          tiempoPromedio: tiempoPromedio.slice(0, 5),
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error procesando archivo');
    } finally {
      setIsLoading(false);
    }
  };

  const confirmUpload = () => {
    if (!processedData) return;
    onDataLoaded(processedData);
    setPreview(null);
    setProcessedData(null);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      processFile(file);
    } else {
      setError('Por favor selecciona un archivo Excel (.xlsx o .xls)');
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    e.target.value = '';
  };

  const downloadTemplate = () => {
    if (!window.XLSX) {
      alert('Librería Excel no disponible');
      return;
    }

    // Create sample pivot table data
    const tasaData = [
      ['Etiquetas de fila', 'DEVOLUCION', '', 'ENTREGADO', '', 'Total'],
      ['', 'Cuenta', '%', 'Cuenta', '%', ''],
      ['BOGOTA', 510, 0.279, 1316, 0.721, 1826],
      ['  COORDINADORA', 331, 0.257, 959, 0.743, 1290],
      ['  ENVIA', 69, 0.381, 112, 0.619, 181],
      ['  INTERRAPIDISIMO', 69, 0.301, 160, 0.699, 229],
      ['MEDELLIN', 304, 0.278, 789, 0.722, 1093],
      ['  COORDINADORA', 146, 0.222, 513, 0.778, 659],
      ['  INTERRAPIDISIMO', 158, 0.364, 276, 0.636, 434],
      ['TUMACO', 70, 0.70, 30, 0.30, 100],
      ['  INTERRAPIDISIMO', 70, 0.70, 30, 0.30, 100],
    ];

    const tiempoData = [
      ['CIUDAD DESTINO', 'FECHA', 'FECHA ULTIMO MOV', 'ESTATUS', 'TIEMPO ENTREGA', 'USUARIO', 'TRANSPORTADORA'],
      ['BOGOTA', '15-10-2025', '2025-10-17', 'ENTREGADO', 2, 'JOHN DOE', 'COORDINADORA'],
      ['BOGOTA', '15-10-2025', '2025-10-18', 'ENTREGADO', 3, 'JANE DOE', 'ENVIA'],
      ['MEDELLIN', '15-10-2025', '2025-10-19', 'ENTREGADO', 4, 'BOB SMITH', 'COORDINADORA'],
      ['TUMACO', '15-10-2025', '2025-10-23', 'DEVOLUCION', 8, 'ALICE JONES', 'INTERRAPIDISIMO'],
    ];

    const wb = window.XLSX.utils.book_new();
    const ws1 = window.XLSX.utils.aoa_to_sheet(tasaData);
    const ws2 = window.XLSX.utils.aoa_to_sheet(tiempoData);

    window.XLSX.utils.book_append_sheet(wb, ws1, 'tasa de entregas');
    window.XLSX.utils.book_append_sheet(wb, ws2, 'Tiempo promedio');

    window.XLSX.writeFile(wb, 'plantilla_semaforo_litper.xlsx');
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      {!preview && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200
            ${
              isDragOver
                ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                : 'border-slate-300 dark:border-navy-600 hover:border-amber-400'
            }
          `}
        >
          <div className="max-w-md mx-auto">
            <div
              className={`
              w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center
              ${isDragOver ? 'bg-amber-500' : 'bg-gradient-to-br from-amber-400 to-orange-500'}
              shadow-lg
            `}
            >
              <FileSpreadsheet className="w-10 h-10 text-white" />
            </div>

            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
              📊 Carga tu Archivo Excel
            </h3>

            <p className="text-slate-500 dark:text-slate-400 mb-4 text-sm">
              Para ver el semáforo de ciudades necesitas cargar un archivo Excel con los datos históricos.
            </p>

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-6 text-left">
              <div className="flex items-start gap-2 mb-2">
                <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm font-bold text-blue-700 dark:text-blue-300">
                  El archivo debe contener 2 hojas:
                </p>
              </div>
              <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1 ml-6">
                <li>✅ <strong>"tasa de entregas"</strong> - Tabla pivote ciudad/transportadora</li>
                <li>✅ <strong>"Tiempo promedio"</strong> - Registros detallados de guías</li>
              </ul>
            </div>

            <label
              className={`
              inline-flex items-center gap-3 px-6 py-3.5 rounded-xl font-bold cursor-pointer
              transition-all transform hover:scale-105 shadow-lg
              ${
                isLoading
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white'
              }
            `}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Seleccionar Archivo Excel
                </>
              )}
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                disabled={isLoading}
                className="hidden"
              />
            </label>

            <p className="text-xs text-slate-400 mt-3">o arrastra tu archivo aquí</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-red-700 dark:text-red-400 font-medium">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-yellow-700 dark:text-yellow-400 font-medium mb-2">
                Advertencias:
              </p>
              <ul className="text-sm text-yellow-600 dark:text-yellow-300 space-y-1">
                {warnings.map((w, i) => (
                  <li key={i}>• {w}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Preview */}
      {preview && processedData && (
        <div className="bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-700 overflow-hidden">
          <div className="px-6 py-4 bg-emerald-50 dark:bg-emerald-900/20 border-b border-slate-200 dark:border-navy-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileCheck className="w-6 h-6 text-emerald-500" />
              <div>
                <h4 className="font-bold text-slate-800 dark:text-white">{preview.fileName}</h4>
                <p className="text-sm text-slate-500">Archivo procesado correctamente</p>
              </div>
            </div>
            <button
              onClick={() => {
                setPreview(null);
                setProcessedData(null);
              }}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            {/* Summary stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {Object.entries(preview.recordCounts).map(([label, count]) => (
                <div
                  key={label}
                  className="bg-slate-50 dark:bg-navy-950 rounded-xl p-4 text-center"
                >
                  <p className="text-2xl font-bold text-amber-600">{count}</p>
                  <p className="text-xs text-slate-500">{label}</p>
                </div>
              ))}
            </div>

            {/* Sheets found */}
            <div className="mb-6">
              <h5 className="font-bold text-slate-700 dark:text-white text-sm mb-2 flex items-center gap-2">
                <Table className="w-4 h-4" />
                Hojas encontradas
              </h5>
              <div className="flex flex-wrap gap-2">
                {preview.sheets.map((sheet) => (
                  <span
                    key={sheet}
                    className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm rounded-full"
                  >
                    {sheet}
                  </span>
                ))}
              </div>
            </div>

            {/* Preview of processed data */}
            <div className="mb-6">
              <h5 className="font-bold text-slate-700 dark:text-white text-sm mb-2">
                Vista previa de rutas (primeras 5)
              </h5>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-navy-800">
                      <th className="px-3 py-2 text-left text-xs font-bold uppercase text-slate-500">Ciudad</th>
                      <th className="px-3 py-2 text-left text-xs font-bold uppercase text-slate-500">Transportadora</th>
                      <th className="px-3 py-2 text-right text-xs font-bold uppercase text-emerald-600">Entregas</th>
                      <th className="px-3 py-2 text-right text-xs font-bold uppercase text-red-600">Devoluciones</th>
                      <th className="px-3 py-2 text-right text-xs font-bold uppercase text-slate-500">Total</th>
                      <th className="px-3 py-2 text-right text-xs font-bold uppercase text-blue-600">Éxito %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processedData.tasaEntregas.slice(0, 5).map((row, i) => {
                      const tasaExito = row.total > 0 ? (row.entregas / row.total) * 100 : 0;
                      return (
                        <tr key={i} className="border-b border-slate-100 dark:border-navy-700">
                          <td className="px-3 py-2 text-slate-700 dark:text-slate-300 font-medium">{row.ciudad}</td>
                          <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{row.transportadora}</td>
                          <td className="px-3 py-2 text-right text-emerald-600 font-bold">{row.entregas}</td>
                          <td className="px-3 py-2 text-right text-red-600">{row.devoluciones}</td>
                          <td className="px-3 py-2 text-right text-slate-500">{row.total}</td>
                          <td className="px-3 py-2 text-right">
                            <span className={`font-bold ${tasaExito >= 70 ? 'text-emerald-600' : tasaExito >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                              {tasaExito.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {processedData.tasaEntregas.length > 5 && (
                <p className="text-xs text-slate-400 mt-2">
                  + {processedData.tasaEntregas.length - 5} rutas más...
                </p>
              )}
            </div>

            <div className="flex items-center gap-3 pt-6 border-t border-slate-200 dark:border-navy-700">
              <button
                onClick={confirmUpload}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold rounded-xl hover:from-emerald-600 hover:to-green-600 transition-all shadow-lg"
              >
                <CheckCircle className="w-5 h-5" />
                Confirmar y Cargar Datos
              </button>
              <button
                onClick={() => {
                  setPreview(null);
                  setProcessedData(null);
                }}
                className="px-6 py-3.5 bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-navy-700 transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Format info and template download */}
      {!preview && (
        <div className="bg-slate-50 dark:bg-navy-950 rounded-xl p-6">
          <h4 className="font-bold text-slate-700 dark:text-white mb-4 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-amber-500" />
            Formato del Excel Esperado
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-white dark:bg-navy-900 rounded-lg p-4 border border-slate-200 dark:border-navy-700">
              <p className="font-bold text-amber-600 text-sm mb-2">
                Hoja 1: "tasa de entregas"
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                Tabla pivote con estructura:
              </p>
              <div className="text-xs text-slate-500 space-y-1 bg-slate-50 dark:bg-navy-950 p-2 rounded font-mono">
                <p>| Etiqueta | DEVOLUCION | % | ENTREGADO | % | Total |</p>
                <p>| BOGOTA   |            |   |           |   |       |</p>
                <p>|  COORD.. | 331        | 25| 959       | 75| 1290  |</p>
              </div>
            </div>

            <div className="bg-white dark:bg-navy-900 rounded-lg p-4 border border-slate-200 dark:border-navy-700">
              <p className="font-bold text-amber-600 text-sm mb-2">
                Hoja 2: "Tiempo promedio"
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                Registros detallados:
              </p>
              <div className="text-xs text-slate-500 space-y-1">
                <p>• CIUDAD DESTINO</p>
                <p>• FECHA</p>
                <p>• TIEMPO ENTREGA (días)</p>
                <p>• TRANSPORTADORA</p>
                <p>• ESTATUS</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
            >
              <Download className="w-4 h-4" />
              Descargar Plantilla de Ejemplo
            </button>
            <p className="text-xs text-slate-400">
              ⚠️ El Excel permanecerá cargado hasta que subas uno nuevo
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExcelUploader;
