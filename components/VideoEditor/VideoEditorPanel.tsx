// ============================================
// LITPER PRO - VIDEO EDITOR PANEL
// Panel de edicion de video con funciones basicas y premium
// ============================================

import React, { useState, useCallback } from 'react';
import {
  Video,
  Upload,
  Info,
  FileVideo,
  FileAudio,
  Scissors,
  Minimize2,
  Type,
  Image,
  Gauge,
  Combine,
  Film,
  VolumeX,
  Subtitles,
  Layers,
  Lock,
  Crown,
  Clock,
  CheckCircle,
  XCircle,
  Trash2,
  Play,
  X,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { useVideoEditingStore } from '../../stores/videoEditingStore';
import {
  VIDEO_FUNCTIONS,
  type VideoEditingFunction,
  type FunctionInfo,
} from '../../types/videoEditing';
import * as videoService from '../../services/videoEditingService';

// ============================================
// ICON MAP
// ============================================

const ICON_MAP: Record<string, React.ElementType> = {
  Info,
  FileVideo,
  FileAudio,
  Scissors,
  Minimize2,
  Type,
  Image,
  Gauge,
  Combine,
  Film,
  VolumeX,
  Subtitles,
  Layers,
};

// ============================================
// SUB-COMPONENTES
// ============================================

function FunctionCard({
  fn,
  userTier,
  isSelected,
  onSelect,
}: {
  fn: FunctionInfo;
  userTier: 'basic' | 'premium';
  isSelected: boolean;
  onSelect: (id: VideoEditingFunction) => void;
}) {
  const Icon = ICON_MAP[fn.icon] || Info;
  const isLocked = fn.tier === 'premium' && userTier === 'basic';

  return (
    <button
      onClick={() => !isLocked && onSelect(fn.id)}
      disabled={isLocked}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        padding: '14px',
        borderRadius: '10px',
        border: isSelected ? '2px solid #6366f1' : '1px solid #e5e7eb',
        background: isLocked
          ? '#f9fafb'
          : isSelected
            ? '#eef2ff'
            : '#ffffff',
        cursor: isLocked ? 'not-allowed' : 'pointer',
        opacity: isLocked ? 0.6 : 1,
        textAlign: 'left',
        width: '100%',
        transition: 'all 0.15s ease',
      }}
    >
      <div
        style={{
          padding: '8px',
          borderRadius: '8px',
          background: isLocked ? '#f3f4f6' : fn.tier === 'premium' ? '#fef3c7' : '#e0e7ff',
          flexShrink: 0,
        }}
      >
        <Icon size={20} color={isLocked ? '#9ca3af' : fn.tier === 'premium' ? '#d97706' : '#4f46e5'} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontWeight: 600, fontSize: '14px', color: '#111827' }}>{fn.name}</span>
          {isLocked && <Lock size={14} color="#9ca3af" />}
          {fn.tier === 'premium' && !isLocked && (
            <Crown size={14} color="#d97706" />
          )}
        </div>
        <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0', lineHeight: '1.4' }}>
          {fn.description}
        </p>
      </div>
      <ChevronRight size={16} color="#9ca3af" style={{ flexShrink: 0, marginTop: '2px' }} />
    </button>
  );
}

function JobHistoryItem({ job }: { job: { id: string; function: string; status: string; inputFile: string; createdAt: string; error?: string } }) {
  const statusColors: Record<string, string> = {
    completed: '#10b981',
    error: '#ef4444',
    processing: '#6366f1',
    queued: '#9ca3af',
  };
  const StatusIcon = job.status === 'completed' ? CheckCircle : job.status === 'error' ? XCircle : Clock;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px',
        borderRadius: '8px',
        background: '#f9fafb',
        fontSize: '13px',
      }}
    >
      <StatusIcon size={16} color={statusColors[job.status] || '#9ca3af'} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontWeight: 500, color: '#111827' }}>
          {VIDEO_FUNCTIONS.find((f) => f.id === job.function)?.name || job.function}
        </span>
        <p style={{ fontSize: '11px', color: '#9ca3af', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {job.inputFile.split('/').pop()}
        </p>
      </div>
      <span style={{ fontSize: '11px', color: '#9ca3af', flexShrink: 0 }}>
        {new Date(job.createdAt).toLocaleTimeString()}
      </span>
    </div>
  );
}

function DropZone({ onFileDrop }: { onFileDrop: (files: FileList) => void }) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragging(false), []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) {
        onFileDrop(e.dataTransfer.files);
      }
    },
    [onFileDrop]
  );

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        border: `2px dashed ${isDragging ? '#6366f1' : '#d1d5db'}`,
        borderRadius: '12px',
        padding: '24px',
        textAlign: 'center',
        background: isDragging ? '#eef2ff' : '#fafafa',
        transition: 'all 0.2s ease',
        cursor: 'pointer',
      }}
    >
      <Upload size={32} color={isDragging ? '#6366f1' : '#9ca3af'} style={{ margin: '0 auto 8px' }} />
      <p style={{ fontWeight: 500, color: '#374151', fontSize: '14px' }}>
        Arrastra archivos aqui
      </p>
      <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
        MP4, AVI, MKV, MOV, WebM, MP3, WAV, AAC
      </p>
      <label
        style={{
          display: 'inline-block',
          marginTop: '12px',
          padding: '8px 16px',
          borderRadius: '8px',
          background: '#6366f1',
          color: '#fff',
          fontSize: '13px',
          fontWeight: 500,
          cursor: 'pointer',
        }}
      >
        Seleccionar archivos
        <input
          type="file"
          multiple
          accept="video/*,audio/*"
          onChange={(e) => e.target.files && onFileDrop(e.target.files)}
          style={{ display: 'none' }}
        />
      </label>
    </div>
  );
}

// ============================================
// FORMULARIOS DE OPCIONES
// ============================================

function ConvertVideoForm({ onSubmit }: { onSubmit: (opts: Record<string, unknown>) => void }) {
  const [format, setFormat] = useState('mp4');
  const [resolution, setResolution] = useState('');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div>
        <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>Formato de salida</label>
        <select
          value={format}
          onChange={(e) => setFormat(e.target.value)}
          style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', marginTop: '4px', fontSize: '13px' }}
        >
          <option value="mp4">MP4</option>
          <option value="avi">AVI</option>
          <option value="mkv">MKV</option>
          <option value="mov">MOV</option>
          <option value="webm">WebM</option>
        </select>
      </div>
      <div>
        <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>Resolucion (opcional)</label>
        <select
          value={resolution}
          onChange={(e) => setResolution(e.target.value)}
          style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', marginTop: '4px', fontSize: '13px' }}
        >
          <option value="">Sin cambio</option>
          <option value="1920x1080">1080p (1920x1080)</option>
          <option value="1280x720">720p (1280x720)</option>
          <option value="854x480">480p (854x480)</option>
          <option value="3840x2160">4K (3840x2160)</option>
        </select>
      </div>
      <button
        onClick={() => onSubmit({ format, resolution: resolution || undefined })}
        style={{ padding: '10px', borderRadius: '8px', background: '#6366f1', color: '#fff', fontWeight: 600, fontSize: '14px', border: 'none', cursor: 'pointer' }}
      >
        <Play size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
        Convertir
      </button>
    </div>
  );
}

function TrimVideoForm({ onSubmit }: { onSubmit: (opts: Record<string, unknown>) => void }) {
  const [startTime, setStartTime] = useState('00:00:00');
  const [endTime, setEndTime] = useState('00:00:30');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div>
          <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>Inicio</label>
          <input
            type="text"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            placeholder="00:00:00"
            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', marginTop: '4px', fontSize: '13px', boxSizing: 'border-box' }}
          />
        </div>
        <div>
          <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>Fin</label>
          <input
            type="text"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            placeholder="00:00:30"
            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', marginTop: '4px', fontSize: '13px', boxSizing: 'border-box' }}
          />
        </div>
      </div>
      <button
        onClick={() => onSubmit({ startTime, endTime })}
        style={{ padding: '10px', borderRadius: '8px', background: '#6366f1', color: '#fff', fontWeight: 600, fontSize: '14px', border: 'none', cursor: 'pointer' }}
      >
        <Scissors size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
        Cortar
      </button>
    </div>
  );
}

function CompressForm({ onSubmit }: { onSubmit: (opts: Record<string, unknown>) => void }) {
  const [quality, setQuality] = useState('medium');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div>
        <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>Calidad</label>
        <select
          value={quality}
          onChange={(e) => setQuality(e.target.value)}
          style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', marginTop: '4px', fontSize: '13px' }}
        >
          <option value="low">Baja (archivo mas pequeno)</option>
          <option value="medium">Media (equilibrado)</option>
          <option value="high">Alta (mejor calidad)</option>
          <option value="ultra">Ultra (maxima calidad)</option>
        </select>
      </div>
      <button
        onClick={() => onSubmit({ quality })}
        style={{ padding: '10px', borderRadius: '8px', background: '#6366f1', color: '#fff', fontWeight: 600, fontSize: '14px', border: 'none', cursor: 'pointer' }}
      >
        <Minimize2 size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
        Comprimir
      </button>
    </div>
  );
}

function TextOverlayForm({ onSubmit }: { onSubmit: (opts: Record<string, unknown>) => void }) {
  const [text, setText] = useState('');
  const [fontSize, setFontSize] = useState(24);
  const [fontColor, setFontColor] = useState('#ffffff');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div>
        <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>Texto</label>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Tu texto aqui..."
          style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', marginTop: '4px', fontSize: '13px', boxSizing: 'border-box' }}
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div>
          <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>Tamano</label>
          <input
            type="number"
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', marginTop: '4px', fontSize: '13px', boxSizing: 'border-box' }}
          />
        </div>
        <div>
          <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>Color</label>
          <input
            type="color"
            value={fontColor}
            onChange={(e) => setFontColor(e.target.value)}
            style={{ width: '100%', height: '36px', borderRadius: '6px', border: '1px solid #d1d5db', marginTop: '4px', cursor: 'pointer' }}
          />
        </div>
      </div>
      <button
        onClick={() => onSubmit({ text, fontSize, fontColor })}
        style={{ padding: '10px', borderRadius: '8px', background: '#d97706', color: '#fff', fontWeight: 600, fontSize: '14px', border: 'none', cursor: 'pointer' }}
      >
        <Type size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
        Agregar Texto
      </button>
    </div>
  );
}

function SpeedForm({ onSubmit }: { onSubmit: (opts: Record<string, unknown>) => void }) {
  const [speed, setSpeed] = useState(1.0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div>
        <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>
          Velocidad: {speed}x {speed < 1 ? '(camara lenta)' : speed > 1 ? '(acelerado)' : '(normal)'}
        </label>
        <input
          type="range"
          min="0.25"
          max="4"
          step="0.25"
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
          style={{ width: '100%', marginTop: '8px' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#9ca3af' }}>
          <span>0.25x</span>
          <span>1x</span>
          <span>2x</span>
          <span>4x</span>
        </div>
      </div>
      <button
        onClick={() => onSubmit({ speed, adjustAudio: true })}
        style={{ padding: '10px', borderRadius: '8px', background: '#d97706', color: '#fff', fontWeight: 600, fontSize: '14px', border: 'none', cursor: 'pointer' }}
      >
        <Gauge size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
        Cambiar Velocidad
      </button>
    </div>
  );
}

function GenericForm({
  label,
  icon: IconComponent,
  onSubmit,
}: {
  label: string;
  icon: React.ElementType;
  onSubmit: () => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <p style={{ fontSize: '13px', color: '#6b7280' }}>
        Selecciona un archivo y presiona el boton para procesar.
      </p>
      <button
        onClick={onSubmit}
        style={{ padding: '10px', borderRadius: '8px', background: '#d97706', color: '#fff', fontWeight: 600, fontSize: '14px', border: 'none', cursor: 'pointer' }}
      >
        <IconComponent size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
        {label}
      </button>
    </div>
  );
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function VideoEditorPanel() {
  const {
    files,
    activeTab,
    selectedFunction,
    userTier,
    jobHistory,
    isProcessing,
    currentJob,
    setActiveTab,
    setSelectedFunction,
    addFile,
    removeFile,
    addJob,
    setTier,
    clearHistory,
  } = useVideoEditingStore();

  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const selectedFile = files.find((f) => f.id === selectedFileId);

  const basicFunctions = VIDEO_FUNCTIONS.filter((f) => f.tier === 'basic');
  const premiumFunctions = VIDEO_FUNCTIONS.filter((f) => f.tier === 'premium');

  const handleFileDrop = useCallback(
    (fileList: FileList) => {
      Array.from(fileList).forEach((file) => {
        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        const newFile = {
          id: `f_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name: file.name,
          path: `./media/input/${file.name}`,
          size: file.size,
          format: ext as never,
          addedAt: new Date().toISOString(),
        };
        addFile(newFile);
        if (!selectedFileId) setSelectedFileId(newFile.id);
      });
    },
    [addFile, selectedFileId]
  );

  const handleExecute = useCallback(
    (options: Record<string, unknown>) => {
      if (!selectedFile || !selectedFunction) return;

      const job = {
        id: `vj_${Date.now()}`,
        function: selectedFunction,
        status: 'processing' as const,
        inputFile: selectedFile.path,
        options,
        progress: 0,
        createdAt: new Date().toISOString(),
        startedAt: new Date().toISOString(),
      };
      addJob(job);
    },
    [selectedFile, selectedFunction, addJob]
  );

  const renderOptionsForm = () => {
    if (!selectedFunction) {
      return (
        <div style={{ textAlign: 'center', padding: '24px', color: '#9ca3af' }}>
          <Video size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
          <p style={{ fontSize: '14px' }}>Selecciona una funcion para comenzar</p>
        </div>
      );
    }

    if (!selectedFile) {
      return (
        <div style={{ textAlign: 'center', padding: '24px', color: '#9ca3af' }}>
          <Upload size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
          <p style={{ fontSize: '14px' }}>Primero sube un archivo</p>
        </div>
      );
    }

    switch (selectedFunction) {
      case 'convertVideo':
        return <ConvertVideoForm onSubmit={handleExecute} />;
      case 'trimVideo':
        return <TrimVideoForm onSubmit={handleExecute} />;
      case 'compressVideo':
        return <CompressForm onSubmit={handleExecute} />;
      case 'addTextOverlay':
        return <TextOverlayForm onSubmit={handleExecute} />;
      case 'adjustSpeed':
        return <SpeedForm onSubmit={handleExecute} />;
      case 'getMediaInfo':
        return <GenericForm label="Obtener Info" icon={Info} onSubmit={() => handleExecute({})} />;
      case 'convertAudio':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <select
              style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px' }}
              onChange={(e) => handleExecute({ format: e.target.value })}
              defaultValue=""
            >
              <option value="" disabled>Formato de audio...</option>
              <option value="mp3">MP3</option>
              <option value="wav">WAV</option>
              <option value="aac">AAC</option>
              <option value="ogg">OGG</option>
              <option value="flac">FLAC</option>
            </select>
          </div>
        );
      default:
        return (
          <GenericForm
            label="Ejecutar"
            icon={Play}
            onSubmit={() => handleExecute({})}
          />
        );
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ padding: '10px', borderRadius: '12px', background: '#eef2ff' }}>
            <Video size={24} color="#4f46e5" />
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', margin: 0 }}>
              Editor de Video
            </h2>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: '2px 0 0' }}>
              Edita, convierte y procesa tus videos
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {userTier === 'basic' ? (
            <button
              onClick={() => setTier('premium')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: '#fff',
                fontWeight: 600,
                fontSize: '13px',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <Crown size={16} />
              Activar Premium
            </button>
          ) : (
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '20px',
                background: '#fef3c7',
                color: '#92400e',
                fontWeight: 600,
                fontSize: '12px',
              }}
            >
              <Crown size={14} />
              Premium Activo
            </span>
          )}
        </div>
      </div>

      {/* Drop Zone */}
      <DropZone onFileDrop={handleFileDrop} />

      {/* Archivos importados */}
      {files.length > 0 && (
        <div style={{ marginTop: '16px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
            Archivos ({files.length})
          </h3>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {files.map((file) => (
              <div
                key={file.id}
                onClick={() => setSelectedFileId(file.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: selectedFileId === file.id ? '2px solid #6366f1' : '1px solid #e5e7eb',
                  background: selectedFileId === file.id ? '#eef2ff' : '#fff',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                <FileVideo size={14} color="#6366f1" />
                <span style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {file.name}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(file.id);
                    if (selectedFileId === file.id) setSelectedFileId(null);
                  }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}
                >
                  <X size={12} color="#9ca3af" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginTop: '20px', borderBottom: '2px solid #e5e7eb', paddingBottom: '0' }}>
        {[
          { id: 'basic' as const, label: 'Basico', icon: Video },
          { id: 'premium' as const, label: 'Premium', icon: Crown },
          { id: 'history' as const, label: 'Historial', icon: Clock },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 16px',
              borderRadius: '8px 8px 0 0',
              border: 'none',
              background: activeTab === tab.id ? '#6366f1' : 'transparent',
              color: activeTab === tab.id ? '#fff' : '#6b7280',
              fontWeight: activeTab === tab.id ? 600 : 400,
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
        {/* Functions list */}
        <div>
          {activeTab === 'basic' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {basicFunctions.map((fn) => (
                <FunctionCard
                  key={fn.id}
                  fn={fn}
                  userTier={userTier}
                  isSelected={selectedFunction === fn.id}
                  onSelect={setSelectedFunction}
                />
              ))}
            </div>
          )}

          {activeTab === 'premium' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {userTier === 'basic' && (
                <div
                  style={{
                    padding: '14px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #fffbeb, #fef3c7)',
                    border: '1px solid #fbbf24',
                    marginBottom: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Crown size={18} color="#d97706" />
                    <span style={{ fontWeight: 600, fontSize: '14px', color: '#92400e' }}>
                      Funciones Premium
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#a16207', marginTop: '6px' }}>
                    Activa Premium para desbloquear edicion avanzada: overlays, velocidad, B-roll y mas.
                  </p>
                </div>
              )}
              {premiumFunctions.map((fn) => (
                <FunctionCard
                  key={fn.id}
                  fn={fn}
                  userTier={userTier}
                  isSelected={selectedFunction === fn.id}
                  onSelect={setSelectedFunction}
                />
              ))}
            </div>
          )}

          {activeTab === 'history' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {jobHistory.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: '#9ca3af' }}>
                  <Clock size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                  <p style={{ fontSize: '14px' }}>No hay historial de trabajos</p>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      onClick={clearHistory}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: '1px solid #e5e7eb',
                        background: '#fff',
                        color: '#6b7280',
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      <Trash2 size={12} />
                      Limpiar
                    </button>
                  </div>
                  {jobHistory.map((job) => (
                    <JobHistoryItem key={job.id} job={job} />
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        {/* Options panel */}
        <div>
          <div
            style={{
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              background: '#fff',
              position: 'sticky',
              top: '20px',
            }}
          >
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#111827', marginBottom: '16px' }}>
              {selectedFunction
                ? VIDEO_FUNCTIONS.find((f) => f.id === selectedFunction)?.name || 'Opciones'
                : 'Opciones'}
            </h3>

            {isProcessing && currentJob && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px',
                  borderRadius: '8px',
                  background: '#eef2ff',
                  marginBottom: '16px',
                }}
              >
                <Loader2 size={16} color="#6366f1" style={{ animation: 'spin 1s linear infinite' }} />
                <span style={{ fontSize: '13px', color: '#4f46e5', fontWeight: 500 }}>
                  Procesando...
                </span>
              </div>
            )}

            {renderOptionsForm()}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
