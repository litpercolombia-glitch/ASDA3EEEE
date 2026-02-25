// ============================================
// LITPER PRO - VIDEO EDITING TYPES
// Tipos para el modulo de edicion de video/audio
// ============================================

// ============================================
// ENUMS DE FORMATOS
// ============================================

export type VideoFormat = 'mp4' | 'avi' | 'mkv' | 'mov' | 'webm' | 'flv' | 'wmv';
export type AudioFormat = 'mp3' | 'wav' | 'aac' | 'ogg' | 'flac' | 'wma';
export type VideoCodec = 'h264' | 'h265' | 'vp8' | 'vp9' | 'av1' | 'mpeg4';
export type AudioCodec = 'aac' | 'mp3' | 'opus' | 'vorbis' | 'flac' | 'pcm';

export type VideoEditingTier = 'basic' | 'premium';

export type JobStatus = 'queued' | 'processing' | 'completed' | 'error' | 'cancelled';

export type VideoEditingFunction =
  | 'getMediaInfo'
  | 'convertVideo'
  | 'convertAudio'
  | 'trimVideo'
  | 'compressVideo'
  | 'addTextOverlay'
  | 'addImageOverlay'
  | 'adjustSpeed'
  | 'concatenateVideos'
  | 'addBroll'
  | 'removeSilence'
  | 'burnSubtitles'
  | 'batchProcess';

// ============================================
// TIER MAPPING
// ============================================

export const BASIC_FUNCTIONS: VideoEditingFunction[] = [
  'getMediaInfo',
  'convertVideo',
  'convertAudio',
  'trimVideo',
  'compressVideo',
];

export const PREMIUM_FUNCTIONS: VideoEditingFunction[] = [
  'addTextOverlay',
  'addImageOverlay',
  'adjustSpeed',
  'concatenateVideos',
  'addBroll',
  'removeSilence',
  'burnSubtitles',
  'batchProcess',
];

// ============================================
// INTERFACES PRINCIPALES
// ============================================

export interface MediaInfo {
  fileName: string;
  filePath: string;
  format: string;
  duration: number; // seconds
  size: number; // bytes
  bitrate: number;
  video?: {
    codec: string;
    width: number;
    height: number;
    fps: number;
    bitrate: number;
  };
  audio?: {
    codec: string;
    sampleRate: number;
    channels: number;
    bitrate: number;
  };
}

export interface VideoFile {
  id: string;
  name: string;
  path: string;
  size: number;
  format: VideoFormat | AudioFormat;
  addedAt: string;
  mediaInfo?: MediaInfo;
}

export interface VideoJob {
  id: string;
  function: VideoEditingFunction;
  status: JobStatus;
  inputFile: string;
  outputFile?: string;
  options: Record<string, unknown>;
  progress: number; // 0-100
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  error?: string;
  result?: Record<string, unknown>;
}

// ============================================
// OPCIONES POR FUNCION
// ============================================

export interface ConvertVideoOptions {
  format: VideoFormat;
  codec?: VideoCodec;
  resolution?: string; // e.g. "1920x1080"
  bitrate?: string; // e.g. "5000k"
  fps?: number;
}

export interface ConvertAudioOptions {
  format: AudioFormat;
  codec?: AudioCodec;
  bitrate?: string; // e.g. "320k"
  sampleRate?: number; // e.g. 44100
  channels?: number; // 1 = mono, 2 = stereo
}

export interface TrimOptions {
  startTime: string; // "HH:MM:SS" or seconds
  endTime: string;
}

export interface CompressOptions {
  quality: 'low' | 'medium' | 'high' | 'ultra';
  maxSize?: number; // target size in MB
}

export interface TextOverlayOptions {
  text: string;
  x?: number;
  y?: number;
  fontSize?: number;
  fontColor?: string;
  backgroundColor?: string;
  startTime?: string;
  endTime?: string;
  fontFamily?: string;
}

export interface ImageOverlayOptions {
  imagePath: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  opacity?: number; // 0-1
  startTime?: string;
  endTime?: string;
}

export interface SpeedOptions {
  speed: number; // 0.25 = 4x slower, 2.0 = 2x faster
  adjustAudio?: boolean;
}

export interface ConcatenateOptions {
  inputs: string[];
  transition?: 'none' | 'fade' | 'dissolve' | 'wipe';
  transitionDuration?: number; // seconds
}

export interface BrollOptions {
  mainVideo: string;
  brollVideo: string;
  insertAt: string; // timestamp
  duration?: string; // how long the b-roll plays
}

export interface RemoveSilenceOptions {
  threshold?: number; // dB level, default -30
  minDuration?: number; // minimum silence duration in seconds
  padding?: number; // seconds to keep before/after speech
}

export interface BurnSubtitlesOptions {
  subtitleFile: string; // path to .srt or .ass file
  fontSize?: number;
  fontColor?: string;
  position?: 'top' | 'center' | 'bottom';
}

export interface BatchJob {
  inputFile: string;
  function: VideoEditingFunction;
  options: Record<string, unknown>;
}

// ============================================
// DESCRIPCIONES DE FUNCIONES (para UI)
// ============================================

export interface FunctionInfo {
  id: VideoEditingFunction;
  name: string;
  description: string;
  tier: VideoEditingTier;
  icon: string; // Lucide icon name
}

export const VIDEO_FUNCTIONS: FunctionInfo[] = [
  // Basicas
  {
    id: 'getMediaInfo',
    name: 'Info del Archivo',
    description: 'Obtener informacion detallada: duracion, resolucion, codec, bitrate',
    tier: 'basic',
    icon: 'Info',
  },
  {
    id: 'convertVideo',
    name: 'Convertir Video',
    description: 'Cambiar formato: MP4, AVI, MKV, MOV, WebM',
    tier: 'basic',
    icon: 'FileVideo',
  },
  {
    id: 'convertAudio',
    name: 'Convertir Audio',
    description: 'Cambiar formato de audio: MP3, WAV, AAC, OGG, FLAC',
    tier: 'basic',
    icon: 'FileAudio',
  },
  {
    id: 'trimVideo',
    name: 'Cortar Video',
    description: 'Recortar un segmento por tiempo de inicio y fin',
    tier: 'basic',
    icon: 'Scissors',
  },
  {
    id: 'compressVideo',
    name: 'Comprimir Video',
    description: 'Reducir tamano del archivo manteniendo calidad',
    tier: 'basic',
    icon: 'Minimize2',
  },
  // Premium
  {
    id: 'addTextOverlay',
    name: 'Texto sobre Video',
    description: 'Agregar titulos, subtitulos o texto personalizado',
    tier: 'premium',
    icon: 'Type',
  },
  {
    id: 'addImageOverlay',
    name: 'Imagen/Watermark',
    description: 'Agregar logo, watermark o imagen encima del video',
    tier: 'premium',
    icon: 'Image',
  },
  {
    id: 'adjustSpeed',
    name: 'Velocidad',
    description: 'Camara lenta (0.25x) o acelerado (hasta 4x)',
    tier: 'premium',
    icon: 'Gauge',
  },
  {
    id: 'concatenateVideos',
    name: 'Unir Videos',
    description: 'Concatenar multiples videos con transiciones',
    tier: 'premium',
    icon: 'Combine',
  },
  {
    id: 'addBroll',
    name: 'B-Roll',
    description: 'Insertar metraje secundario en un punto especifico',
    tier: 'premium',
    icon: 'Film',
  },
  {
    id: 'removeSilence',
    name: 'Quitar Silencios',
    description: 'Detectar y eliminar segmentos silenciosos automaticamente',
    tier: 'premium',
    icon: 'VolumeX',
  },
  {
    id: 'burnSubtitles',
    name: 'Grabar Subtitulos',
    description: 'Incrustar subtitulos .srt/.ass permanentemente en el video',
    tier: 'premium',
    icon: 'Subtitles',
  },
  {
    id: 'batchProcess',
    name: 'Lote (Batch)',
    description: 'Procesar multiples archivos con la misma operacion',
    tier: 'premium',
    icon: 'Layers',
  },
];

// ============================================
// QUALITY PRESETS
// ============================================

export const COMPRESS_PRESETS: Record<CompressOptions['quality'], { crf: number; preset: string }> = {
  low: { crf: 35, preset: 'fast' },
  medium: { crf: 28, preset: 'medium' },
  high: { crf: 23, preset: 'slow' },
  ultra: { crf: 18, preset: 'veryslow' },
};
