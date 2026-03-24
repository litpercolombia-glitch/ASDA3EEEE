// components/ReportUpload/ReportUploadModal.tsx
// Modal emergente profesional para subir reportes individuales + Formulario inteligente de pedidos

import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  X,
  Upload,
  FileText,
  Calendar,
  Tag,
  AlertTriangle,
  CheckCircle,
  Trash2,
  File,
  Image,
  FileSpreadsheet,
  Loader2,
  Package,
  Plus,
  Clock,
  TrendingUp,
  Target,
  Zap,
  Timer,
} from 'lucide-react';
import { useReportUploadStore } from '../../stores/reportUploadStore';
import { useAuthStore } from '../../stores/authStore';
import {
  REPORT_CATEGORIES,
  ReportCategory,
  fileToBase64,
  formatFileSize,
  validateFile,
  ACCEPTED_FILE_TYPES,
  RondaReportData,
  META_MINUTOS_POR_PEDIDO,
  getSemaforoColor,
  SEMAFORO_CONFIG,
  calcularResumenPedidos,
  crearRondaData,
  submitPedidosReport,
} from '../../services/reportUploadService';
import {
  timerDataDisponible,
  importarRondasDelDia,
  getFechasConDatos,
  getTimerUsuarios,
} from '../../services/pedidosIntegrationService';

interface ReportUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// ============================================
// SUB-COMPONENTE: Formulario de Pedidos
// ============================================

function PedidosForm({
  onSubmitSuccess,
  userId,
  userName,
  userEmail,
}: {
  onSubmitSuccess: () => void;
  userId: string;
  userName: string;
  userEmail: string;
}) {
  const [mode, setMode] = useState<'import' | 'manual'>('import');
  const [rondas, setRondas] = useState<RondaReportData[]>([]);
  const [metaDiaria, setMetaDiaria] = useState(50);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importDate, setImportDate] = useState(new Date().toISOString().split('T')[0]);
  const [importUserId, setImportUserId] = useState('');

  // Manual form
  const [manualDuracion, setManualDuracion] = useState(25);
  const [manualRealizados, setManualRealizados] = useState(0);
  const [manualCancelados, setManualCancelados] = useState(0);
  const [manualAgendados, setManualAgendados] = useState(0);

  const hasTimerData = useMemo(() => timerDataDisponible(), []);
  const fechasDisponibles = useMemo(() => getFechasConDatos(importUserId || undefined), [importUserId]);
  const timerUsuarios = useMemo(() => getTimerUsuarios(), []);

  const resumen = useMemo(() => {
    if (rondas.length === 0) return null;
    return calcularResumenPedidos(rondas, metaDiaria);
  }, [rondas, metaDiaria]);

  const handleImport = () => {
    const result = importarRondasDelDia(importUserId || undefined, importDate);
    if (!result || result.rondas.length === 0) {
      setError('No se encontraron rondas para esa fecha/usuario en el timer');
      return;
    }
    setRondas(result.rondas);
    if (result.metaDiaria > 0) setMetaDiaria(result.metaDiaria);
    setError(null);
  };

  const handleAddManualRonda = () => {
    if (manualRealizados === 0 && manualCancelados === 0 && manualAgendados === 0) {
      setError('Agrega al menos un pedido a la ronda');
      return;
    }
    const nuevaRonda = crearRondaData(
      rondas.length + 1,
      manualDuracion,
      manualRealizados,
      manualCancelados,
      manualAgendados
    );
    setRondas([...rondas, nuevaRonda]);
    setManualRealizados(0);
    setManualCancelados(0);
    setManualAgendados(0);
    setError(null);
  };

  const handleRemoveRonda = (index: number) => {
    setRondas(rondas.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (rondas.length === 0) {
      setError('Agrega al menos una ronda');
      return;
    }
    setIsSubmitting(true);
    setError(null);

    try {
      const resumenFinal = calcularResumenPedidos(rondas, metaDiaria);
      submitPedidosReport({
        fecha: importDate,
        colaboradorId: userId,
        colaboradorNombre: userName,
        rondas,
        resumen: resumenFinal,
      });
      onSubmitSuccess();
    } catch {
      setError('Error al guardar el reporte');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Mode Selector */}
      <div className="flex gap-2">
        <button
          onClick={() => setMode('import')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
            mode === 'import'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700'
          }`}
        >
          <Zap className="w-4 h-4" />
          Importar del Timer
        </button>
        <button
          onClick={() => setMode('manual')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
            mode === 'manual'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700'
          }`}
        >
          <Plus className="w-4 h-4" />
          Ingreso Manual
        </button>
      </div>

      {/* Import Mode */}
      {mode === 'import' && (
        <div className="space-y-3">
          {!hasTimerData ? (
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-center">
              <Timer className="w-8 h-8 text-amber-400 mx-auto mb-2" />
              <p className="text-amber-300 text-sm font-medium">No se detectaron datos del Timer</p>
              <p className="text-amber-400/60 text-xs mt-1">
                Usa la app Litper Pedidos para registrar rondas, o cambia a ingreso manual
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                {timerUsuarios.length > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Usuario Timer</label>
                    <select
                      value={importUserId}
                      onChange={(e) => setImportUserId(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Usuario actual</option>
                      {timerUsuarios.map(u => (
                        <option key={u.id} value={u.id}>{u.avatar} {u.nombre}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Fecha</label>
                  <input
                    type="date"
                    value={importDate}
                    onChange={(e) => setImportDate(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              {fechasDisponibles.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-xs text-gray-500">Fechas con datos:</span>
                  {fechasDisponibles.slice(0, 7).map(f => (
                    <button
                      key={f}
                      onClick={() => setImportDate(f)}
                      className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
                        importDate === f
                          ? 'bg-indigo-500 text-white'
                          : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                      }`}
                    >
                      {new Date(f + 'T12:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                    </button>
                  ))}
                </div>
              )}
              <button
                onClick={handleImport}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all font-medium"
              >
                <Zap className="w-4 h-4" />
                Importar Rondas
              </button>
            </>
          )}
        </div>
      )}

      {/* Manual Mode */}
      {mode === 'manual' && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Fecha del reporte</label>
            <input
              type="date"
              value={importDate}
              onChange={(e) => setImportDate(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="p-3 bg-gray-800/80 rounded-xl border border-gray-700 space-y-3">
            <p className="text-xs font-medium text-gray-400 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              Nueva Ronda #{rondas.length + 1}
            </p>

            <div className="grid grid-cols-4 gap-2">
              <div>
                <label className="block text-[10px] text-gray-500 mb-1 text-center">Duración (min)</label>
                <input
                  type="number"
                  value={manualDuracion}
                  onChange={(e) => setManualDuracion(parseInt(e.target.value) || 0)}
                  className="w-full px-2 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-center text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-[10px] text-green-400 mb-1 text-center">Realizados</label>
                <input
                  type="number"
                  value={manualRealizados}
                  onChange={(e) => setManualRealizados(parseInt(e.target.value) || 0)}
                  className="w-full px-2 py-2 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-center text-sm font-bold focus:outline-none focus:ring-2 focus:ring-green-500"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-[10px] text-red-400 mb-1 text-center">Cancelados</label>
                <input
                  type="number"
                  value={manualCancelados}
                  onChange={(e) => setManualCancelados(parseInt(e.target.value) || 0)}
                  className="w-full px-2 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-center text-sm font-bold focus:outline-none focus:ring-2 focus:ring-red-500"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-[10px] text-blue-400 mb-1 text-center">Agendados</label>
                <input
                  type="number"
                  value={manualAgendados}
                  onChange={(e) => setManualAgendados(parseInt(e.target.value) || 0)}
                  className="w-full px-2 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-400 text-center text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>
            </div>

            {/* Preview tiempo/pedido antes de agregar */}
            {manualRealizados > 0 && (
              <div className="flex items-center justify-between px-2">
                <span className="text-xs text-gray-500">Tiempo por pedido:</span>
                {(() => {
                  const tpp = manualDuracion / manualRealizados;
                  const color = getSemaforoColor(tpp);
                  const config = SEMAFORO_CONFIG[color];
                  return (
                    <span className={`text-sm font-bold ${config.color}`}>
                      {tpp.toFixed(1)} min/pedido {color === 'green' ? '✓' : color === 'yellow' ? '⚠' : '✗'}
                    </span>
                  );
                })()}
              </div>
            )}

            <button
              onClick={handleAddManualRonda}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Agregar Ronda
            </button>
          </div>
        </div>
      )}

      {/* Meta Diaria */}
      <div className="flex items-center gap-3">
        <label className="text-xs text-gray-400 whitespace-nowrap">Meta diaria:</label>
        <input
          type="number"
          value={metaDiaria}
          onChange={(e) => setMetaDiaria(parseInt(e.target.value) || 0)}
          className="w-20 px-2 py-1.5 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
          min="1"
        />
        <span className="text-xs text-gray-500">pedidos</span>
        <span className="text-xs text-gray-600">|</span>
        <span className="text-xs text-gray-500">Meta: {META_MINUTOS_POR_PEDIDO} min/pedido</span>
      </div>

      {/* Rondas List */}
      {rondas.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-400">
            Rondas registradas ({rondas.length})
          </p>
          <div className="max-h-40 overflow-y-auto space-y-1.5">
            {rondas.map((ronda, i) => {
              const color = getSemaforoColor(ronda.tiempoPorPedido);
              const config = SEMAFORO_CONFIG[color];
              return (
                <div
                  key={i}
                  className={`flex items-center justify-between p-2.5 rounded-lg border ${config.bgColor} ${config.borderColor}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 w-6">#{ronda.numero}</span>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-green-400 font-medium">{ronda.pedidosRealizados} realizados</span>
                      {ronda.pedidosCancelados > 0 && (
                        <span className="text-red-400">{ronda.pedidosCancelados} cancel.</span>
                      )}
                      {ronda.pedidosAgendados > 0 && (
                        <span className="text-blue-400">{ronda.pedidosAgendados} agend.</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${config.color}`}>
                      {ronda.tiempoPorPedido.toFixed(1)} min
                    </span>
                    <span className="text-xs">
                      {color === 'green' ? '✓' : color === 'yellow' ? '⚠' : '✗'}
                    </span>
                    <button
                      onClick={() => handleRemoveRonda(i)}
                      className="p-1 hover:bg-red-500/20 rounded transition-colors"
                    >
                      <Trash2 className="w-3 h-3 text-gray-500 hover:text-red-400" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Resumen Preview */}
      {resumen && (
        <div className="p-4 bg-gray-800/80 rounded-xl border border-gray-700 space-y-3">
          <p className="text-xs font-semibold text-gray-300 uppercase tracking-wide flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" />
            Resumen del Reporte
          </p>

          {/* Main KPI - Tiempo por pedido con semáforo grande */}
          {(() => {
            const color = getSemaforoColor(resumen.tiempoPromedioPorPedido);
            const config = SEMAFORO_CONFIG[color];
            return (
              <div className={`p-3 rounded-xl border ${config.bgColor} ${config.borderColor} text-center`}>
                <p className={`text-3xl font-bold ${config.color}`}>
                  {resumen.tiempoPromedioPorPedido.toFixed(1)} min
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Tiempo promedio por pedido (Meta: {META_MINUTOS_POR_PEDIDO} min)
                </p>
                <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${config.bgColor} ${config.color} font-medium`}>
                  {config.label}
                </span>
              </div>
            );
          })()}

          <div className="grid grid-cols-4 gap-2 text-center">
            <div>
              <p className="text-lg font-bold text-white">{resumen.totalPedidos}</p>
              <p className="text-[10px] text-gray-500">Pedidos</p>
            </div>
            <div>
              <p className="text-lg font-bold text-emerald-400">{resumen.pedidosPorHora}</p>
              <p className="text-[10px] text-gray-500">Pedidos/Hora</p>
            </div>
            <div>
              <p className="text-lg font-bold text-amber-400">{resumen.tasaCancelacion}%</p>
              <p className="text-[10px] text-gray-500">Cancelación</p>
            </div>
            <div>
              <p className="text-lg font-bold text-indigo-400">{resumen.porcentajeCumplimiento}%</p>
              <p className="text-[10px] text-gray-500">En Meta</p>
            </div>
          </div>

          {/* Meta Diaria Progress */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-400">Meta diaria</span>
              <span className="text-white font-medium">{resumen.totalPedidos}/{resumen.metaDiaria}</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  resumen.cumplimientoMetaDiaria >= 100 ? 'bg-green-500' : 'bg-indigo-500'
                }`}
                style={{ width: `${Math.min(100, resumen.cumplimientoMetaDiaria)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={isSubmitting || rondas.length === 0}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold shadow-lg shadow-indigo-500/25"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Guardando...
          </>
        ) : (
          <>
            <Package className="w-5 h-5" />
            Enviar Reporte de Pedidos
          </>
        )}
      </button>
    </div>
  );
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export function ReportUploadModal({ isOpen, onClose }: ReportUploadModalProps) {
  const { submit } = useReportUploadStore();
  const { user } = useAuthStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ReportCategory>('daily_operations');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [tags, setTags] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = useCallback(() => {
    setTitle('');
    setDescription('');
    setCategory('daily_operations');
    setPeriodStart('');
    setPeriodEnd('');
    setTags('');
    setFile(null);
    setFilePreview(null);
    setError(null);
    setSuccess(false);
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [onClose, resetForm]);

  const handleFile = useCallback((selectedFile: File) => {
    const validation = validateFile(selectedFile);
    if (!validation.valid) {
      setError(validation.error || 'Archivo no válido');
      return;
    }
    setFile(selectedFile);
    setError(null);

    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setFilePreview(e.target?.result as string);
      reader.readAsDataURL(selectedFile);
    } else {
      setFilePreview(null);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFile(droppedFile);
  }, [handleFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) handleFile(selectedFile);
  }, [handleFile]);

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="w-8 h-8 text-purple-400" />;
    if (type.includes('spreadsheet') || type.includes('excel') || type.includes('csv'))
      return <FileSpreadsheet className="w-8 h-8 text-green-400" />;
    if (type.includes('pdf')) return <FileText className="w-8 h-8 text-red-400" />;
    return <File className="w-8 h-8 text-gray-400" />;
  };

  const handleSubmit = async () => {
    if (!user) {
      setError('Debes iniciar sesión para subir un reporte');
      return;
    }
    if (!title.trim()) {
      setError('El título es obligatorio');
      return;
    }
    if (!file) {
      setError('Debes adjuntar un archivo');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const fileData = await fileToBase64(file);

      submit({
        userId: user.id,
        userName: user.nombre,
        userEmail: user.email,
        title: title.trim(),
        description: description.trim(),
        category,
        period: {
          start: periodStart || new Date().toISOString().split('T')[0],
          end: periodEnd || new Date().toISOString().split('T')[0],
        },
        fileData,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        adminComment: undefined,
        reviewedAt: undefined,
        reviewedBy: undefined,
        previousVersionId: undefined,
      });

      setSuccess(true);
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch {
      setError('Error al subir el reporte. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePedidosSuccess = () => {
    setSuccess(true);
    setTimeout(() => {
      handleClose();
    }, 1500);
  };

  if (!isOpen) return null;

  const isPedidos = category === 'pedidos_report';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className="bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-gray-700 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-5 border-b border-gray-700 bg-gradient-to-r ${
          isPedidos ? 'from-orange-600/20 to-amber-600/20' : 'from-indigo-600/20 to-purple-600/20'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${isPedidos ? 'bg-orange-500/30' : 'bg-indigo-500/30'}`}>
              {isPedidos ? (
                <Package className={`w-6 h-6 ${isPedidos ? 'text-orange-400' : 'text-indigo-400'}`} />
              ) : (
                <Upload className="w-6 h-6 text-indigo-400" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {isPedidos ? 'Reporte de Pedidos' : 'Subir Reporte'}
              </h2>
              <p className="text-sm text-gray-400">
                {isPedidos
                  ? `Meta: ${META_MINUTOS_POR_PEDIDO} min por pedido`
                  : 'Sube tu reporte para que quede registrado'}
              </p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Success State */}
        {success ? (
          <div className="p-12 flex flex-col items-center justify-center gap-4">
            <div className="p-4 bg-green-500/20 rounded-full animate-bounce">
              <CheckCircle className="w-12 h-12 text-green-400" />
            </div>
            <h3 className="text-xl font-bold text-white">
              {isPedidos ? 'Reporte de Pedidos Guardado' : 'Reporte Enviado'}
            </h3>
            <p className="text-gray-400 text-center">
              {isPedidos
                ? 'Tu reporte de pedidos ha sido guardado con las métricas calculadas.'
                : 'Tu reporte ha sido enviado exitosamente y está pendiente de revisión.'}
            </p>
          </div>
        ) : (
          /* Form */
          <div className="p-5 overflow-y-auto max-h-[calc(90vh-160px)] space-y-5">
            {/* Error */}
            {error && !isPedidos && (
              <div className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300 text-sm">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Category - Always visible */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Tipo de Reporte
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(Object.entries(REPORT_CATEGORIES) as [ReportCategory, typeof REPORT_CATEGORIES[ReportCategory]][]).map(
                  ([key, config]) => (
                    <button
                      key={key}
                      onClick={() => setCategory(key)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-all ${
                        category === key
                          ? key === 'pedidos_report'
                            ? 'border-orange-500 bg-orange-500/20 text-white'
                            : 'border-indigo-500 bg-indigo-500/20 text-white'
                          : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-500'
                      }`}
                    >
                      {key === 'pedidos_report' && <Package className="w-3.5 h-3.5" />}
                      <span className="text-xs">{config.label}</span>
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Pedidos Form */}
            {isPedidos && user ? (
              <PedidosForm
                onSubmitSuccess={handlePedidosSuccess}
                userId={user.id}
                userName={user.nombre}
                userEmail={user.email}
              />
            ) : (
              /* Standard File Upload Form */
              <>
                {/* Drag & Drop Zone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-indigo-500 bg-indigo-500/10 scale-[1.02]'
                      : file
                      ? 'border-green-500/50 bg-green-500/5'
                      : 'border-gray-600 hover:border-indigo-500/50 hover:bg-gray-800/50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    accept={ACCEPTED_FILE_TYPES.join(',')}
                    className="hidden"
                  />

                  {file ? (
                    <div className="flex items-center gap-4">
                      {filePreview ? (
                        <img src={filePreview} alt="Preview" className="w-16 h-16 object-cover rounded-lg" />
                      ) : (
                        getFileIcon(file.type)
                      )}
                      <div className="flex-1 text-left">
                        <p className="text-white font-medium truncate">{file.name}</p>
                        <p className="text-sm text-gray-400">{formatFileSize(file.size)}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setFile(null);
                          setFilePreview(null);
                        }}
                        className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className={`w-10 h-10 mx-auto mb-3 ${isDragging ? 'text-indigo-400' : 'text-gray-500'}`} />
                      <p className="text-white font-medium">
                        {isDragging ? 'Suelta tu archivo aquí' : 'Arrastra tu archivo o haz click'}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">PDF, Excel, imágenes o texto (máx. 10MB)</p>
                    </>
                  )}
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Título del Reporte *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ej: Reporte de entregas semana 8"
                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Descripción
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe brevemente el contenido de tu reporte..."
                    rows={3}
                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Period */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-1.5 text-sm font-medium text-gray-300 mb-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      Fecha Inicio
                    </label>
                    <input
                      type="date"
                      value={periodStart}
                      onChange={(e) => setPeriodStart(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-800 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-1.5 text-sm font-medium text-gray-300 mb-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      Fecha Fin
                    </label>
                    <input
                      type="date"
                      value={periodEnd}
                      onChange={(e) => setPeriodEnd(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-800 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-300 mb-1.5">
                    <Tag className="w-3.5 h-3.5" />
                    Etiquetas (separadas por coma)
                  </label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="Ej: urgente, semanal, entregas"
                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </>
            )}
          </div>
        )}

        {/* Footer - Only for non-pedidos */}
        {!success && !isPedidos && (
          <div className="flex items-center justify-between gap-3 p-5 border-t border-gray-700 bg-gray-800/50">
            <button
              onClick={handleClose}
              className="px-5 py-2.5 border border-gray-600 text-gray-300 rounded-xl hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !title.trim() || !file}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-lg shadow-indigo-500/25"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Enviar Reporte
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ReportUploadModal;
