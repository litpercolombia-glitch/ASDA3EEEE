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
} from 'lucide-react';
import { ExcelPreviewData, ExcelValidationResult, SemaforoExcelData } from '../../types/logistics';

interface ExcelUploaderProps {
  pestaña: 'semaforo' | 'predicciones';
  onDataLoaded: (data: SemaforoExcelData) => void;
  requiredSheets?: string[];
  requiredColumns?: Record<string, string[]>;
}

declare global {
  interface Window {
    XLSX: any;
  }
}

// Default required columns for semaforo
const SEMAFORO_REQUIRED_SHEETS = ['Tasa_Entregas', 'Tiempo_Promedio'];
const SEMAFORO_REQUIRED_COLUMNS: Record<string, string[]> = {
  Tasa_Entregas: ['CIUDAD', 'TRANSPORTADORA', 'DEVOLUCIONES', 'ENTREGAS', 'TOTAL'],
  Tiempo_Promedio: ['CIUDAD', 'TRANSPORTADORA', 'DIAS'],
};

export const ExcelUploader: React.FC<ExcelUploaderProps> = ({
  pestaña,
  onDataLoaded,
  requiredSheets = SEMAFORO_REQUIRED_SHEETS,
  requiredColumns = SEMAFORO_REQUIRED_COLUMNS,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [preview, setPreview] = useState<ExcelPreviewData | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Normalize column name for flexible matching
  const normalizeColumnName = (name: string): string => {
    return name
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^A-Z0-9]/g, ''); // Remove special chars
  };

  // Find matching column with flexible matching
  const findMatchingColumn = (columns: string[], required: string): string | null => {
    const normalizedRequired = normalizeColumnName(required);

    for (const col of columns) {
      const normalizedCol = normalizeColumnName(col);
      if (
        normalizedCol === normalizedRequired ||
        normalizedCol.includes(normalizedRequired) ||
        normalizedRequired.includes(normalizedCol)
      ) {
        return col;
      }
    }
    return null;
  };

  // Find matching sheet with flexible matching
  const findMatchingSheet = (sheetNames: string[], required: string): string | null => {
    const normalizedRequired = normalizeColumnName(required);

    for (const name of sheetNames) {
      const normalizedName = normalizeColumnName(name);
      if (
        normalizedName === normalizedRequired ||
        normalizedName.includes(normalizedRequired) ||
        normalizedRequired.includes(normalizedName)
      ) {
        return name;
      }
    }
    return null;
  };

  const processFile = async (file: File) => {
    setIsLoading(true);
    setError(null);
    setWarnings([]);
    setPreview(null);

    try {
      // 1. Verify XLSX is loaded
      if (!window.XLSX) {
        throw new Error('Librería Excel no disponible. Por favor recarga la página.');
      }

      // 2. Read file
      const buffer = await file.arrayBuffer();
      const workbook = window.XLSX.read(buffer, { type: 'array' });

      // 3. Find required sheets (flexible matching)
      const foundSheets: Record<string, any> = {};
      const localWarnings: string[] = [];

      for (let i = 0; i < requiredSheets.length; i++) {
        const requiredSheet = requiredSheets[i];
        let foundSheetName = findMatchingSheet(workbook.SheetNames, requiredSheet);

        if (!foundSheetName) {
          // Fallback: use sheet by index if name not found
          if (workbook.SheetNames[i]) {
            foundSheetName = workbook.SheetNames[i];
            localWarnings.push(
              `No se encontró hoja "${requiredSheet}", usando "${foundSheetName}" (posición ${i + 1})`
            );
          } else {
            throw new Error(`No se encontró la hoja requerida: ${requiredSheet}`);
          }
        }

        foundSheets[requiredSheet] = {
          name: foundSheetName,
          sheet: workbook.Sheets[foundSheetName],
        };
      }

      // 4. Convert to JSON and validate columns
      const processedData: Record<string, any[]> = {};

      for (const [sheetKey, sheetInfo] of Object.entries(foundSheets)) {
        const jsonData = window.XLSX.utils.sheet_to_json(sheetInfo.sheet);

        if (jsonData.length === 0) {
          throw new Error(`La hoja "${sheetInfo.name}" está vacía`);
        }

        // Get actual columns
        const actualColumns = Object.keys(jsonData[0]);
        const required = requiredColumns[sheetKey] || [];

        // Map required columns to actual columns
        const columnMapping: Record<string, string> = {};

        for (const reqCol of required) {
          const foundCol = findMatchingColumn(actualColumns, reqCol);
          if (foundCol) {
            columnMapping[reqCol] = foundCol;
          } else {
            throw new Error(
              `Columna faltante en "${sheetInfo.name}": ${reqCol}. Columnas encontradas: ${actualColumns.join(', ')}`
            );
          }
        }

        // Normalize data using column mapping
        const normalizedData = jsonData.map((row: any) => {
          const normalized: any = {};
          for (const [reqCol, actualCol] of Object.entries(columnMapping)) {
            normalized[reqCol.toLowerCase()] = row[actualCol];
          }
          return normalized;
        });

        processedData[sheetKey] = normalizedData;
      }

      setWarnings(localWarnings);

      // 5. Show preview
      setPreview({
        fileName: file.name,
        sheets: Object.keys(processedData),
        recordCounts: Object.fromEntries(
          Object.entries(processedData).map(([k, v]) => [k, v.length])
        ),
        data: processedData,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error procesando archivo');
    } finally {
      setIsLoading(false);
    }
  };

  const confirmUpload = () => {
    if (!preview) return;

    try {
      // Transform data to expected format
      const semaforoData: SemaforoExcelData = {
        tasaEntregas: (preview.data.Tasa_Entregas || []).map((row: any) => ({
          ciudad: String(row.ciudad || '').toUpperCase(),
          transportadora: String(row.transportadora || '').toUpperCase(),
          devoluciones: Number(row.devoluciones) || 0,
          entregas: Number(row.entregas) || 0,
          total: Number(row.total) || 0,
        })),
        tiempoPromedio: (preview.data.Tiempo_Promedio || []).map((row: any) => ({
          ciudad: String(row.ciudad || '').toUpperCase(),
          transportadora: String(row.transportadora || '').toUpperCase(),
          dias: Number(row.dias) || 0,
        })),
      };

      onDataLoaded(semaforoData);
      setPreview(null);
    } catch (err) {
      setError('Error al procesar los datos del Excel');
    }
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

    const tasaData = [
      { CIUDAD: 'BOGOTA', TRANSPORTADORA: 'COORDINADORA', DEVOLUCIONES: 50, ENTREGAS: 950, TOTAL: 1000 },
      { CIUDAD: 'BOGOTA', TRANSPORTADORA: 'ENVIA', DEVOLUCIONES: 80, ENTREGAS: 420, TOTAL: 500 },
      { CIUDAD: 'MEDELLIN', TRANSPORTADORA: 'INTERRAPIDISIMO', DEVOLUCIONES: 100, ENTREGAS: 400, TOTAL: 500 },
      { CIUDAD: 'TUMACO', TRANSPORTADORA: 'INTERRAPIDISIMO', DEVOLUCIONES: 70, ENTREGAS: 30, TOTAL: 100 },
    ];

    const tiempoData = [
      { CIUDAD: 'BOGOTA', TRANSPORTADORA: 'COORDINADORA', DIAS: 2 },
      { CIUDAD: 'BOGOTA', TRANSPORTADORA: 'ENVIA', DIAS: 3 },
      { CIUDAD: 'MEDELLIN', TRANSPORTADORA: 'INTERRAPIDISIMO', DIAS: 4 },
      { CIUDAD: 'TUMACO', TRANSPORTADORA: 'INTERRAPIDISIMO', DIAS: 8 },
    ];

    const wb = window.XLSX.utils.book_new();
    const ws1 = window.XLSX.utils.json_to_sheet(tasaData);
    const ws2 = window.XLSX.utils.json_to_sheet(tiempoData);

    window.XLSX.utils.book_append_sheet(wb, ws1, 'Tasa_Entregas');
    window.XLSX.utils.book_append_sheet(wb, ws2, 'Tiempo_Promedio');

    window.XLSX.writeFile(wb, 'plantilla_semaforo.xlsx');
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
              Carga tu Archivo Excel
            </h3>

            <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">
              Para ver el semáforo de ciudades necesitas cargar un archivo Excel con los datos
              históricos de tasas de entrega y tiempos promedio.
            </p>

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
      {preview && (
        <div className="bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-700 overflow-hidden">
          <div className="px-6 py-4 bg-emerald-50 dark:bg-emerald-900/20 border-b border-slate-200 dark:border-navy-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileCheck className="w-6 h-6 text-emerald-500" />
              <div>
                <h4 className="font-bold text-slate-800 dark:text-white">{preview.fileName}</h4>
                <p className="text-sm text-slate-500">Archivo listo para cargar</p>
              </div>
            </div>
            <button
              onClick={() => setPreview(null)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {preview.sheets.map((sheet) => (
                <div
                  key={sheet}
                  className="bg-slate-50 dark:bg-navy-950 rounded-xl p-4 flex items-center gap-3"
                >
                  <Table className="w-8 h-8 text-amber-500" />
                  <div>
                    <p className="font-bold text-slate-700 dark:text-white">{sheet}</p>
                    <p className="text-sm text-slate-500">
                      {preview.recordCounts[sheet]} registros
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Data preview tables */}
            {preview.sheets.map((sheet) => (
              <div key={sheet} className="mb-6">
                <h5 className="font-bold text-slate-700 dark:text-white mb-2 text-sm">
                  Vista previa: {sheet}
                </h5>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-navy-800">
                        {Object.keys(preview.data[sheet][0] || {}).map((col) => (
                          <th
                            key={col}
                            className="px-3 py-2 text-left text-xs font-bold uppercase text-slate-500"
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.data[sheet].slice(0, 3).map((row: any, i: number) => (
                        <tr
                          key={i}
                          className="border-b border-slate-100 dark:border-navy-700"
                        >
                          {Object.values(row).map((val: any, j: number) => (
                            <td
                              key={j}
                              className="px-3 py-2 text-slate-600 dark:text-slate-300"
                            >
                              {String(val)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {preview.recordCounts[sheet] > 3 && (
                  <p className="text-xs text-slate-400 mt-2">
                    + {preview.recordCounts[sheet] - 3} registros más...
                  </p>
                )}
              </div>
            ))}

            <div className="flex items-center gap-3 mt-6 pt-6 border-t border-slate-200 dark:border-navy-700">
              <button
                onClick={confirmUpload}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold rounded-xl hover:from-emerald-600 hover:to-green-600 transition-all shadow-lg"
              >
                <CheckCircle className="w-5 h-5" />
                Confirmar y Cargar Datos
              </button>
              <button
                onClick={() => setPreview(null)}
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
            Formato Requerido
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-white dark:bg-navy-900 rounded-lg p-4 border border-slate-200 dark:border-navy-700">
              <p className="font-bold text-amber-600 text-sm mb-2">
                Hoja 1: "Tasa_Entregas"
              </p>
              <div className="text-xs text-slate-500 space-y-1">
                <p>• CIUDAD - Nombre de la ciudad</p>
                <p>• TRANSPORTADORA - Nombre del carrier</p>
                <p>• DEVOLUCIONES - Cantidad devuelta</p>
                <p>• ENTREGAS - Cantidad entregada</p>
                <p>• TOTAL - Total de envíos</p>
              </div>
            </div>

            <div className="bg-white dark:bg-navy-900 rounded-lg p-4 border border-slate-200 dark:border-navy-700">
              <p className="font-bold text-amber-600 text-sm mb-2">
                Hoja 2: "Tiempo_Promedio"
              </p>
              <div className="text-xs text-slate-500 space-y-1">
                <p>• CIUDAD - Nombre de la ciudad</p>
                <p>• TRANSPORTADORA - Nombre del carrier</p>
                <p>• DIAS - Días promedio de entrega</p>
              </div>
            </div>
          </div>

          <button
            onClick={downloadTemplate}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
          >
            <Download className="w-4 h-4" />
            Descargar Plantilla de Ejemplo
          </button>
        </div>
      )}
    </div>
  );
};

export default ExcelUploader;
