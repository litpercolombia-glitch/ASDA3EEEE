// components/ReportUpload/PublicUploadPage.tsx
// Página pública accesible por link compartido - No requiere login

import React, { useState, useRef, useCallback } from 'react';
import {
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
  User,
  Mail,
  Shield,
  X,
  ExternalLink,
} from 'lucide-react';
import {
  ShareableUploadLink,
  ReportCategory,
  REPORT_CATEGORIES,
  fileToBase64,
  formatFileSize,
  validateFile,
  ACCEPTED_FILE_TYPES,
  submitReport,
  incrementLinkUploads,
} from '../../services/reportUploadService';

interface PublicUploadPageProps {
  uploadLink: ShareableUploadLink;
  onComplete?: () => void;
}

export function PublicUploadPage({ uploadLink, onComplete }: PublicUploadPageProps) {
  const [personName, setPersonName] = useState('');
  const [personEmail, setPersonEmail] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ReportCategory>(
    uploadLink.category !== 'any' ? uploadLink.category : 'daily_operations'
  );
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
    if (uploadLink.requiresName && !personName.trim()) {
      setError('Tu nombre es obligatorio');
      return;
    }
    if (uploadLink.requiresEmail && !personEmail.trim()) {
      setError('Tu correo es obligatorio');
      return;
    }
    if (uploadLink.requiresEmail && personEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personEmail)) {
      setError('Ingresa un correo válido');
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

      const useName = personName.trim() || 'Anónimo';
      const useEmail = personEmail.trim() || 'sin-email@link-publico.com';

      submitReport({
        userId: `public_${uploadLink.token}_${useEmail}`,
        userName: useName,
        userEmail: useEmail,
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
        tags: [
          ...tags.split(',').map(t => t.trim()).filter(Boolean),
          `link:${uploadLink.token}`,
          `via:link-publico`,
        ],
        adminComment: undefined,
        reviewedAt: undefined,
        reviewedBy: undefined,
        previousVersionId: undefined,
      });

      incrementLinkUploads(uploadLink.token);
      setSuccess(true);
    } catch {
      setError('Error al subir el reporte. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success screen
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 flex items-center justify-center p-4">
        <div className="bg-gray-900/80 backdrop-blur-xl rounded-3xl border border-gray-700/50 p-12 max-w-md w-full text-center shadow-2xl">
          <div className="p-5 bg-green-500/20 rounded-full w-fit mx-auto mb-6">
            <CheckCircle className="w-16 h-16 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Reporte Enviado</h2>
          <p className="text-gray-400 mb-6">
            Tu reporte ha sido recibido exitosamente. El administrador lo revisará pronto.
          </p>
          <div className="bg-gray-800/50 rounded-xl p-4 text-left mb-6">
            <p className="text-sm text-gray-500">Detalles del envío:</p>
            <p className="text-white font-medium mt-1">{title}</p>
            <p className="text-gray-400 text-sm mt-1">{personName || 'Sin nombre'} - {file?.name}</p>
          </div>
          <button
            onClick={() => {
              setSuccess(false);
              setTitle('');
              setDescription('');
              setFile(null);
              setFilePreview(null);
              setTags('');
              onComplete?.();
            }}
            className="w-full px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium"
          >
            Subir Otro Reporte
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 flex items-center justify-center p-4">
      <div className="bg-gray-900/80 backdrop-blur-xl rounded-3xl border border-gray-700/50 w-full max-w-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-700/50 bg-gradient-to-r from-indigo-600/20 to-purple-600/20">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/30 rounded-2xl">
              <Upload className="w-8 h-8 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{uploadLink.name}</h1>
              <p className="text-sm text-gray-400 mt-0.5">{uploadLink.description || 'Sube tu reporte aquí'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
            <Shield className="w-3 h-3" />
            <span>Formulario seguro - Solicitado por {uploadLink.createdByName}</span>
          </div>
          {uploadLink.maxUploads !== null && (
            <div className="mt-2 text-xs text-gray-500">
              {uploadLink.currentUploads} de {uploadLink.maxUploads} envíos usados
            </div>
          )}
        </div>

        {/* Form */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300 text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Name & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-gray-300 mb-1.5">
                <User className="w-3.5 h-3.5" />
                Tu Nombre {uploadLink.requiresName && <span className="text-red-400">*</span>}
              </label>
              <input
                type="text"
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                placeholder="Ej: Juan Pérez"
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-gray-300 mb-1.5">
                <Mail className="w-3.5 h-3.5" />
                Tu Correo {uploadLink.requiresEmail && <span className="text-red-400">*</span>}
              </label>
              <input
                type="email"
                value={personEmail}
                onChange={(e) => setPersonEmail(e.target.value)}
                placeholder="Ej: tu@correo.com"
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

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
              Título del Reporte <span className="text-red-400">*</span>
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
          {uploadLink.category === 'any' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Tipo de Reporte
              </label>
              <div className="grid grid-cols-2 gap-2">
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
          )}

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
              Etiquetas (opcional, separadas por coma)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Ej: urgente, semanal"
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700/50 bg-gray-800/30">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !title.trim() || !file}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold text-lg shadow-lg shadow-indigo-500/25"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Enviar Reporte
              </>
            )}
          </button>
          <p className="text-center text-xs text-gray-500 mt-3">
            Powered by LITPER PRO - Los datos se almacenan de forma segura
          </p>
        </div>
      </div>
    </div>
  );
}

export default PublicUploadPage;
