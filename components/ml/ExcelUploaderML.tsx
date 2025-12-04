/**
 * ExcelUploaderML.tsx
 * Componente para subir archivos Excel con datos de guías al sistema ML.
 * Soporta drag & drop y muestra estadísticas del procesamiento.
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  AlertTriangle,
  File,
  Trash2,
  RefreshCw,
  Clock,
  Database,
  AlertCircle,
  Loader2,
  Info,
} from 'lucide-react';
import { mlApi, type UploadResult } from '@/lib/api-config';

// Estados del componente
type UploadState = 'idle' | 'selected' | 'uploading' | 'success' | 'error';

// Formatos de archivo aceptados
const ACCEPTED_FORMATS = ['.xlsx', '.xls'];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

/**
 * Componente principal del uploader de Excel
 */
export function ExcelUploaderML() {
  // Estados
  const [file, setFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Ref para el input de archivo
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validar archivo
  const validarArchivo = useCallback((archivo: File): string | null => {
    const extension = archivo.name.toLowerCase().split('.').pop();

    if (!extension || !ACCEPTED_FORMATS.includes(`.${extension}`)) {
      return 'Solo se permiten archivos Excel (.xlsx, .xls)';
    }

    if (archivo.size > MAX_FILE_SIZE) {
      return 'El archivo excede el tamaño máximo de 50MB';
    }

    return null;
  }, []);

  // Handler para selección de archivo
  const handleFileSelect = useCallback(
    (archivo: File) => {
      const errorValidacion = validarArchivo(archivo);

      if (errorValidacion) {
        setError(errorValidacion);
        setFile(null);
        setUploadState('idle');
        return;
      }

      setFile(archivo);
      setError(null);
      setResult(null);
      setUploadState('selected');
    },
    [validarArchivo]
  );

  // Handler para input de archivo
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const archivo = e.target.files?.[0];
      if (archivo) {
        handleFileSelect(archivo);
      }
    },
    [handleFileSelect]
  );

  // Handlers de drag & drop
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const archivo = e.dataTransfer.files?.[0];
      if (archivo) {
        handleFileSelect(archivo);
      }
    },
    [handleFileSelect]
  );

  // Handler para subir archivo
  const handleUpload = useCallback(async () => {
    if (!file) return;

    setUploadState('uploading');
    setError(null);

    try {
      const resultado = await mlApi.cargarExcel(file);

      if (resultado.exito) {
        setResult(resultado);
        setUploadState('success');
      } else {
        setError(resultado.mensaje || 'Error procesando archivo');
        setUploadState('error');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error subiendo archivo';
      setError(errorMsg);
      setUploadState('error');
    }
  }, [file]);

  // Handler para reiniciar
  const handleReset = useCallback(() => {
    setFile(null);
    setUploadState('idle');
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Handler para click en zona de drop
  const handleZoneClick = useCallback(() => {
    if (uploadState === 'idle' || uploadState === 'error') {
      fileInputRef.current?.click();
    }
  }, [uploadState]);

  // Formatear tamaño de archivo
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Card principal */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Database className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Cargar Datos al Sistema</h2>
              <p className="text-emerald-100 text-sm">
                Sube archivos Excel para entrenar los modelos ML
              </p>
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-6">
          {/* Input oculto */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleInputChange}
            className="hidden"
          />

          {/* Estado: Idle o Error - Mostrar zona de drop */}
          {(uploadState === 'idle' || uploadState === 'error') && (
            <>
              {/* Zona de drop */}
              <div
                onClick={handleZoneClick}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-xl p-12 text-center
                  cursor-pointer transition-all duration-200
                  ${
                    isDragging
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-300 hover:border-emerald-400 hover:bg-gray-50'
                  }`}
              >
                <div
                  className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4
                    ${isDragging ? 'bg-emerald-100' : 'bg-gray-100'}`}
                >
                  <Upload
                    className={`w-8 h-8 ${isDragging ? 'text-emerald-600' : 'text-gray-400'}`}
                  />
                </div>
                <div className="text-gray-600 mb-2">
                  <span className="font-medium">
                    {isDragging
                      ? 'Suelta el archivo aquí'
                      : 'Arrastra tu archivo Excel aquí'}
                  </span>
                </div>
                <p className="text-sm text-gray-400">
                  o haz clic para seleccionar
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Formatos: .xlsx, .xls · Máximo: 50MB
                </p>
              </div>

              {/* Mensaje de error */}
              {error && (
                <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}
            </>
          )}

          {/* Estado: Archivo seleccionado */}
          {uploadState === 'selected' && file && (
            <div className="space-y-4">
              {/* Info del archivo */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border">
                <div className="p-3 bg-emerald-100 rounded-lg">
                  <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">
                    {file.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatFileSize(file.size)}
                  </div>
                </div>
                <button
                  onClick={handleReset}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              {/* Botón de subir */}
              <button
                onClick={handleUpload}
                className="w-full py-3 px-6 bg-emerald-600 text-white rounded-lg
                  font-semibold flex items-center justify-center gap-2
                  hover:bg-emerald-700 transition-colors"
              >
                <Upload className="w-5 h-5" />
                Procesar Archivo
              </button>
            </div>
          )}

          {/* Estado: Subiendo */}
          {uploadState === 'uploading' && (
            <div className="text-center py-8">
              <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-4" />
              <div className="text-lg font-medium text-gray-900 mb-2">
                Procesando archivo...
              </div>
              <p className="text-gray-500 text-sm">
                Esto puede tardar unos momentos según el tamaño del archivo
              </p>
            </div>
          )}

          {/* Estado: Éxito */}
          {uploadState === 'success' && result && (
            <div className="space-y-4">
              {/* Banner de éxito */}
              <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                <div>
                  <div className="font-medium text-green-800">
                    Archivo procesado exitosamente
                  </div>
                  <div className="text-sm text-green-600">
                    {result.mensaje}
                  </div>
                </div>
              </div>

              {/* Estadísticas */}
              <div className="grid grid-cols-2 gap-4">
                <StatCard
                  label="Total Registros"
                  value={result.total_registros}
                  icon={File}
                  color="blue"
                />
                <StatCard
                  label="Procesados"
                  value={result.registros_procesados}
                  icon={CheckCircle}
                  color="green"
                />
                <StatCard
                  label="Errores"
                  value={result.registros_errores}
                  icon={XCircle}
                  color="red"
                />
                <StatCard
                  label="Tiempo (seg)"
                  value={result.tiempo_procesamiento_segundos.toFixed(1)}
                  icon={Clock}
                  color="purple"
                />
              </div>

              {/* Errores detallados si hay */}
              {result.errores_detalle && result.errores_detalle.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-yellow-700 font-medium mb-2">
                    <AlertTriangle className="w-5 h-5" />
                    Errores encontrados ({result.errores_detalle.length})
                  </div>
                  <ul className="space-y-1 text-sm text-yellow-600 max-h-32 overflow-y-auto">
                    {result.errores_detalle.slice(0, 5).map((err, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-yellow-500">•</span>
                        Fila {err.fila}: {err.error}
                      </li>
                    ))}
                    {result.errores_detalle.length > 5 && (
                      <li className="text-yellow-500 italic">
                        ... y {result.errores_detalle.length - 5} más
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {/* Botón para cargar otro archivo */}
              <button
                onClick={handleReset}
                className="w-full py-3 px-6 border border-emerald-600 text-emerald-600
                  rounded-lg font-medium flex items-center justify-center gap-2
                  hover:bg-emerald-50 transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
                Cargar Otro Archivo
              </button>
            </div>
          )}

          {/* Card informativa */}
          {(uploadState === 'idle' || uploadState === 'selected') && (
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 border border-indigo-100">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-indigo-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-indigo-900">
                    ¿Qué hace el sistema con los datos?
                  </h4>
                  <ul className="text-sm text-indigo-700 mt-2 space-y-1">
                    <li>• Limpia y normaliza los datos de las guías</li>
                    <li>• Calcula métricas como días de tránsito y retrasos</li>
                    <li>• Entrena modelos ML para predicción de retrasos</li>
                    <li>• Alimenta el dashboard con estadísticas actualizadas</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Componente de tarjeta de estadística
 */
interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: 'blue' | 'green' | 'red' | 'purple';
}

function StatCard({ label, value, icon: Icon, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    green: 'bg-green-50 text-green-600 border-green-100',
    red: 'bg-red-50 text-red-600 border-red-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
  };

  const iconColorClasses = {
    blue: 'text-blue-500',
    green: 'text-green-500',
    red: 'text-red-500',
    purple: 'text-purple-500',
  };

  return (
    <div className={`rounded-lg p-4 border ${colorClasses[color]}`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-4 h-4 ${iconColorClasses[color]}`} />
        <span className="text-xs font-medium opacity-70">{label}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

export default ExcelUploaderML;
