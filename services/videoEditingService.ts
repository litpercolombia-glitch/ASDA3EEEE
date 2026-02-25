// ============================================
// LITPER PRO - VIDEO EDITING SERVICE
// Servicio de edicion de video/audio con FFmpeg
// Funciones basicas (gratis) y premium (pago)
// ============================================

import {
  type MediaInfo,
  type VideoJob,
  type ConvertVideoOptions,
  type ConvertAudioOptions,
  type TrimOptions,
  type CompressOptions,
  type TextOverlayOptions,
  type ImageOverlayOptions,
  type SpeedOptions,
  type ConcatenateOptions,
  type BrollOptions,
  type RemoveSilenceOptions,
  type BurnSubtitlesOptions,
  type BatchJob,
  type JobStatus,
  type VideoEditingTier,
  BASIC_FUNCTIONS,
  PREMIUM_FUNCTIONS,
  COMPRESS_PRESETS,
} from '../types/videoEditing';

// ============================================
// CONSTANTES
// ============================================

const MEDIA_INPUT_DIR = './media/input';
const MEDIA_OUTPUT_DIR = './media/output';

const STORAGE_KEY = 'litper_video_jobs';

// ============================================
// HELPERS
// ============================================

function generateId(): string {
  return `vj_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

function buildOutputPath(inputFile: string, suffix: string, newExtension?: string): string {
  const baseName = inputFile.split('/').pop()?.replace(/\.[^.]+$/, '') || 'output';
  const ext = newExtension || inputFile.split('.').pop() || 'mp4';
  return `${MEDIA_OUTPUT_DIR}/${baseName}_${suffix}_${Date.now()}.${ext}`;
}

function getStoredJobs(): VideoJob[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function storeJob(job: VideoJob): void {
  const jobs = getStoredJobs();
  const index = jobs.findIndex((j) => j.id === job.id);
  if (index >= 0) {
    jobs[index] = job;
  } else {
    jobs.push(job);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs.slice(-100))); // Keep last 100
}

function checkTierAccess(
  functionName: string,
  userTier: VideoEditingTier
): { allowed: boolean; message?: string } {
  if (BASIC_FUNCTIONS.includes(functionName as never)) {
    return { allowed: true };
  }
  if (PREMIUM_FUNCTIONS.includes(functionName as never)) {
    if (userTier === 'premium') {
      return { allowed: true };
    }
    return {
      allowed: false,
      message: `La funcion "${functionName}" requiere plan Premium. Actualiza tu plan para desbloquear.`,
    };
  }
  return { allowed: false, message: `Funcion desconocida: ${functionName}` };
}

function createJob(
  functionName: string,
  inputFile: string,
  options: Record<string, unknown>
): VideoJob {
  const job: VideoJob = {
    id: generateId(),
    function: functionName as VideoJob['function'],
    status: 'queued',
    inputFile,
    options,
    progress: 0,
    createdAt: new Date().toISOString(),
  };
  storeJob(job);
  return job;
}

function updateJob(job: VideoJob, updates: Partial<VideoJob>): VideoJob {
  const updated = { ...job, ...updates };
  storeJob(updated);
  return updated;
}

// ============================================
// FUNCIONES BASICAS (TIER GRATIS)
// ============================================

/**
 * Obtener informacion detallada de un archivo multimedia
 */
export async function getMediaInfo(filePath: string): Promise<MediaInfo> {
  // Simula llamada al MCP server get_media_info
  const job = createJob('getMediaInfo', filePath, {});
  updateJob(job, { status: 'processing', startedAt: new Date().toISOString() });

  try {
    // En produccion, esto llama al MCP server:
    // await mcpClient.call('get_media_info', { file_path: filePath })
    const info: MediaInfo = {
      fileName: filePath.split('/').pop() || '',
      filePath,
      format: filePath.split('.').pop() || 'unknown',
      duration: 0,
      size: 0,
      bitrate: 0,
    };

    updateJob(job, {
      status: 'completed',
      progress: 100,
      completedAt: new Date().toISOString(),
      result: info as unknown as Record<string, unknown>,
    });

    return info;
  } catch (error) {
    updateJob(job, {
      status: 'error',
      error: error instanceof Error ? error.message : 'Error desconocido',
    });
    throw error;
  }
}

/**
 * Convertir video a otro formato
 */
export async function convertVideo(
  inputFile: string,
  options: ConvertVideoOptions,
  userTier: VideoEditingTier = 'basic'
): Promise<VideoJob> {
  const access = checkTierAccess('convertVideo', userTier);
  if (!access.allowed) throw new Error(access.message);

  const outputPath = buildOutputPath(inputFile, 'converted', options.format);
  const job = createJob('convertVideo', inputFile, { ...options, outputPath });

  return updateJob(job, {
    status: 'processing',
    outputFile: outputPath,
    startedAt: new Date().toISOString(),
  });
  // MCP: convert_video({ input_file, output_format, codec, resolution, bitrate })
}

/**
 * Convertir audio a otro formato
 */
export async function convertAudio(
  inputFile: string,
  options: ConvertAudioOptions,
  userTier: VideoEditingTier = 'basic'
): Promise<VideoJob> {
  const access = checkTierAccess('convertAudio', userTier);
  if (!access.allowed) throw new Error(access.message);

  const outputPath = buildOutputPath(inputFile, 'audio', options.format);
  const job = createJob('convertAudio', inputFile, { ...options, outputPath });

  return updateJob(job, {
    status: 'processing',
    outputFile: outputPath,
    startedAt: new Date().toISOString(),
  });
  // MCP: convert_audio({ input_file, output_format, bitrate, sample_rate })
}

/**
 * Cortar un segmento del video
 */
export async function trimVideo(
  inputFile: string,
  options: TrimOptions,
  userTier: VideoEditingTier = 'basic'
): Promise<VideoJob> {
  const access = checkTierAccess('trimVideo', userTier);
  if (!access.allowed) throw new Error(access.message);

  const outputPath = buildOutputPath(inputFile, 'trimmed');
  const job = createJob('trimVideo', inputFile, { ...options, outputPath });

  return updateJob(job, {
    status: 'processing',
    outputFile: outputPath,
    startedAt: new Date().toISOString(),
  });
  // MCP: trim_video({ input_file, start_time, end_time })
}

/**
 * Comprimir video reduciendo tamano
 */
export async function compressVideo(
  inputFile: string,
  options: CompressOptions,
  userTier: VideoEditingTier = 'basic'
): Promise<VideoJob> {
  const access = checkTierAccess('compressVideo', userTier);
  if (!access.allowed) throw new Error(access.message);

  const preset = COMPRESS_PRESETS[options.quality];
  const outputPath = buildOutputPath(inputFile, `compressed_${options.quality}`);
  const job = createJob('compressVideo', inputFile, { ...options, ...preset, outputPath });

  return updateJob(job, {
    status: 'processing',
    outputFile: outputPath,
    startedAt: new Date().toISOString(),
  });
  // FFmpeg: -crf {preset.crf} -preset {preset.preset}
}

// ============================================
// FUNCIONES PREMIUM (TIER PAGO)
// ============================================

/**
 * Agregar texto sobre el video
 */
export async function addTextOverlay(
  inputFile: string,
  options: TextOverlayOptions,
  userTier: VideoEditingTier = 'basic'
): Promise<VideoJob> {
  const access = checkTierAccess('addTextOverlay', userTier);
  if (!access.allowed) throw new Error(access.message);

  const outputPath = buildOutputPath(inputFile, 'text_overlay');
  const job = createJob('addTextOverlay', inputFile, { ...options, outputPath });

  return updateJob(job, {
    status: 'processing',
    outputFile: outputPath,
    startedAt: new Date().toISOString(),
  });
  // MCP: add_text_overlay({ input_file, text, x, y, font_size, font_color })
}

/**
 * Agregar imagen/watermark sobre el video
 */
export async function addImageOverlay(
  inputFile: string,
  options: ImageOverlayOptions,
  userTier: VideoEditingTier = 'basic'
): Promise<VideoJob> {
  const access = checkTierAccess('addImageOverlay', userTier);
  if (!access.allowed) throw new Error(access.message);

  const outputPath = buildOutputPath(inputFile, 'img_overlay');
  const job = createJob('addImageOverlay', inputFile, { ...options, outputPath });

  return updateJob(job, {
    status: 'processing',
    outputFile: outputPath,
    startedAt: new Date().toISOString(),
  });
  // MCP: add_image_overlay({ input_file, image_path, x, y, width, height, opacity })
}

/**
 * Ajustar velocidad del video
 */
export async function adjustSpeed(
  inputFile: string,
  options: SpeedOptions,
  userTier: VideoEditingTier = 'basic'
): Promise<VideoJob> {
  const access = checkTierAccess('adjustSpeed', userTier);
  if (!access.allowed) throw new Error(access.message);

  const label = options.speed < 1 ? 'slowmo' : 'speedup';
  const outputPath = buildOutputPath(inputFile, `${label}_${options.speed}x`);
  const job = createJob('adjustSpeed', inputFile, { ...options, outputPath });

  return updateJob(job, {
    status: 'processing',
    outputFile: outputPath,
    startedAt: new Date().toISOString(),
  });
  // MCP: adjust_speed({ input_file, speed, adjust_audio })
}

/**
 * Unir multiples videos con transiciones
 */
export async function concatenateVideos(
  options: ConcatenateOptions,
  userTier: VideoEditingTier = 'basic'
): Promise<VideoJob> {
  const access = checkTierAccess('concatenateVideos', userTier);
  if (!access.allowed) throw new Error(access.message);

  const outputPath = buildOutputPath(options.inputs[0] || 'concat', 'joined');
  const job = createJob('concatenateVideos', options.inputs[0] || '', {
    ...options,
    outputPath,
  });

  return updateJob(job, {
    status: 'processing',
    outputFile: outputPath,
    startedAt: new Date().toISOString(),
  });
  // MCP: concatenate_videos({ input_files, transition, transition_duration })
}

/**
 * Insertar B-roll en un punto especifico
 */
export async function addBroll(
  options: BrollOptions,
  userTier: VideoEditingTier = 'basic'
): Promise<VideoJob> {
  const access = checkTierAccess('addBroll', userTier);
  if (!access.allowed) throw new Error(access.message);

  const outputPath = buildOutputPath(options.mainVideo, 'broll');
  const job = createJob('addBroll', options.mainVideo, { ...options, outputPath });

  return updateJob(job, {
    status: 'processing',
    outputFile: outputPath,
    startedAt: new Date().toISOString(),
  });
  // MCP: add_broll({ main_video, broll_video, insert_at, duration })
}

/**
 * Detectar y eliminar segmentos silenciosos
 */
export async function removeSilence(
  inputFile: string,
  options: RemoveSilenceOptions = {},
  userTier: VideoEditingTier = 'basic'
): Promise<VideoJob> {
  const access = checkTierAccess('removeSilence', userTier);
  if (!access.allowed) throw new Error(access.message);

  const outputPath = buildOutputPath(inputFile, 'no_silence');
  const job = createJob('removeSilence', inputFile, {
    threshold: options.threshold ?? -30,
    minDuration: options.minDuration ?? 0.5,
    padding: options.padding ?? 0.1,
    outputPath,
  });

  return updateJob(job, {
    status: 'processing',
    outputFile: outputPath,
    startedAt: new Date().toISOString(),
  });
  // MCP: remove_silence({ input_file, threshold, min_duration, padding })
}

/**
 * Grabar subtitulos permanentemente en el video
 */
export async function burnSubtitles(
  inputFile: string,
  options: BurnSubtitlesOptions,
  userTier: VideoEditingTier = 'basic'
): Promise<VideoJob> {
  const access = checkTierAccess('burnSubtitles', userTier);
  if (!access.allowed) throw new Error(access.message);

  const outputPath = buildOutputPath(inputFile, 'subtitled');
  const job = createJob('burnSubtitles', inputFile, { ...options, outputPath });

  return updateJob(job, {
    status: 'processing',
    outputFile: outputPath,
    startedAt: new Date().toISOString(),
  });
  // MCP: burn_subtitles({ input_file, subtitle_file, font_size, font_color, position })
}

/**
 * Procesamiento por lotes
 */
export async function batchProcess(
  jobs: BatchJob[],
  userTier: VideoEditingTier = 'basic'
): Promise<VideoJob[]> {
  const access = checkTierAccess('batchProcess', userTier);
  if (!access.allowed) throw new Error(access.message);

  const results: VideoJob[] = [];

  for (const batchItem of jobs) {
    const job = createJob('batchProcess', batchItem.inputFile, {
      originalFunction: batchItem.function,
      ...batchItem.options,
    });
    results.push(
      updateJob(job, {
        status: 'processing',
        startedAt: new Date().toISOString(),
      })
    );
  }

  return results;
}

// ============================================
// UTILIDADES
// ============================================

/**
 * Obtener historial de trabajos
 */
export function getJobHistory(): VideoJob[] {
  return getStoredJobs().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * Limpiar historial de trabajos
 */
export function clearJobHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Obtener un trabajo por ID
 */
export function getJobById(jobId: string): VideoJob | undefined {
  return getStoredJobs().find((j) => j.id === jobId);
}

/**
 * Verificar si una funcion esta disponible para un tier
 */
export function isFunctionAvailable(
  functionName: string,
  userTier: VideoEditingTier
): boolean {
  return checkTierAccess(functionName, userTier).allowed;
}

/**
 * Obtener rutas de media
 */
export function getMediaPaths() {
  return {
    input: MEDIA_INPUT_DIR,
    output: MEDIA_OUTPUT_DIR,
  };
}

/**
 * Formatar duracion de segundos a HH:MM:SS
 */
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * Formatear tamano de archivo
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}
