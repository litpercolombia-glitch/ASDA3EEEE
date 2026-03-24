// components/ReportUpload/ReportUploadModal.tsx
// Modal emergente profesional para subir reportes individuales

import React, { useState, useRef, useCallback } from 'react';
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
} from '../../services/reportUploadService';

interface ReportUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className="bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-gray-700 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-700 bg-gradient-to-r from-indigo-600/20 to-purple-600/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/30 rounded-xl">
              <Upload className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Subir Reporte</h2>
              <p className="text-sm text-gray-400">Sube tu reporte para que quede registrado</p>
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
            <h3 className="text-xl font-bold text-white">Reporte Enviado</h3>
            <p className="text-gray-400 text-center">Tu reporte ha sido enviado exitosamente y está pendiente de revisión.</p>
          </div>
        ) : (
          /* Form */
          <div className="p-5 overflow-y-auto max-h-[calc(90vh-160px)] space-y-5">
            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300 text-sm">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

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

            {/* Category */}
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
                          ? 'border-indigo-500 bg-indigo-500/20 text-white'
                          : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-500'
                      }`}
                    >
                      <span className="text-xs">{config.label}</span>
                    </button>
                  )
                )}
              </div>
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
          </div>
        )}

        {/* Footer */}
        {!success && (
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
