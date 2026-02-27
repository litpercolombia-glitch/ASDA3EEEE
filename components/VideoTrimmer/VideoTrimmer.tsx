import React, { useCallback, useRef } from 'react';
import {
  Upload,
  Play,
  Pause,
  Scissors,
  Download,
  RotateCcw,
  AlertCircle,
  Film,
  Clock,
} from 'lucide-react';
import { useVideoTrimmer } from '../../hooks/useVideoTrimmer';
import { Button } from '../ui/Button';

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 10);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`;
}

export function VideoTrimmer() {
  const {
    state,
    videoRef,
    canvasRef,
    previewVideoRef,
    loadVideo,
    onVideoLoaded,
    setTrimStart,
    setTrimEnd,
    seekTo,
    togglePlayback,
    onTimeUpdate,
    trimVideo,
    downloadTrimmed,
    reset,
  } = useVideoTrimmer();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith('video/')) {
        alert('Por favor selecciona un archivo de video valido');
        return;
      }
      loadVideo(file);
    },
    [loadVideo]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (!file) return;
      if (!file.type.startsWith('video/')) {
        alert('Por favor selecciona un archivo de video valido');
        return;
      }
      loadVideo(file);
    },
    [loadVideo]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const trimDuration = state.trimRange.end - state.trimRange.start;

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
          <Film className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Recortar Video</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Selecciona el rango de tiempo y recorta tu video directamente en el navegador
          </p>
        </div>
      </div>

      {/* Upload Area */}
      {!state.videoUrl && (
        <div
          className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-12 text-center cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors bg-gray-50 dark:bg-gray-800/50"
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <Upload className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
          <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
            Arrastra un video aqui o haz clic para seleccionar
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Soporta MP4, WebM, MOV y otros formatos de video
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}

      {/* Video Player & Controls */}
      {state.videoUrl && (
        <div className="space-y-4">
          {/* Video Player */}
          <div className="relative bg-black rounded-xl overflow-hidden">
            <video
              ref={videoRef}
              src={state.videoUrl}
              className="w-full max-h-[500px] object-contain"
              onLoadedMetadata={onVideoLoaded}
              onTimeUpdate={onTimeUpdate}
              onClick={togglePlayback}
              playsInline
            />
            {/* Play/Pause overlay */}
            {!state.isPlaying && state.duration > 0 && (
              <button
                className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors"
                onClick={togglePlayback}
              >
                <div className="bg-white/90 rounded-full p-4">
                  <Play className="w-8 h-8 text-gray-900 ml-1" />
                </div>
              </button>
            )}
          </div>

          {/* File Info */}
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <span className="truncate max-w-xs">{state.file?.name}</span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Duracion: {formatTime(state.duration)}
            </span>
          </div>

          {/* Timeline */}
          {state.duration > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-4">
              {/* Timeline Bar */}
              <div className="relative h-12 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                {/* Selected range */}
                <div
                  className="absolute top-0 bottom-0 bg-blue-100 dark:bg-blue-900/40"
                  style={{
                    left: `${(state.trimRange.start / state.duration) * 100}%`,
                    width: `${((state.trimRange.end - state.trimRange.start) / state.duration) * 100}%`,
                  }}
                />
                {/* Current time indicator */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                  style={{ left: `${(state.currentTime / state.duration) * 100}%` }}
                />
                {/* Clickable timeline */}
                <input
                  type="range"
                  min={0}
                  max={state.duration}
                  step={0.01}
                  value={state.currentTime}
                  onChange={(e) => seekTo(parseFloat(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                {/* Start handle */}
                <div
                  className="absolute top-0 bottom-0 w-1 bg-green-500 cursor-ew-resize z-20"
                  style={{ left: `${(state.trimRange.start / state.duration) * 100}%` }}
                />
                {/* End handle */}
                <div
                  className="absolute top-0 bottom-0 w-1 bg-green-500 cursor-ew-resize z-20"
                  style={{ left: `${(state.trimRange.end / state.duration) * 100}%` }}
                />
              </div>

              {/* Range Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Inicio del recorte
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={0}
                      max={state.duration}
                      step={0.1}
                      value={state.trimRange.start}
                      onChange={(e) => setTrimStart(parseFloat(e.target.value))}
                      className="flex-1 accent-green-500"
                    />
                    <span className="text-sm font-mono font-medium text-gray-700 dark:text-gray-300 w-20 text-right">
                      {formatTime(state.trimRange.start)}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Fin del recorte
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={0}
                      max={state.duration}
                      step={0.1}
                      value={state.trimRange.end}
                      onChange={(e) => setTrimEnd(parseFloat(e.target.value))}
                      className="flex-1 accent-green-500"
                    />
                    <span className="text-sm font-mono font-medium text-gray-700 dark:text-gray-300 w-20 text-right">
                      {formatTime(state.trimRange.end)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Duration info */}
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded-lg py-2">
                <Scissors className="w-4 h-4" />
                Duracion del recorte: <span className="font-mono font-medium">{formatTime(trimDuration)}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              icon={state.isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              onClick={togglePlayback}
              disabled={state.isTrimming || state.duration === 0}
            >
              {state.isPlaying ? 'Pausar' : 'Reproducir'}
            </Button>

            <Button
              variant="primary"
              icon={<Scissors className="w-4 h-4" />}
              onClick={trimVideo}
              disabled={state.isTrimming || state.duration === 0}
              isLoading={state.isTrimming}
            >
              {state.isTrimming ? `Recortando... ${Math.round(state.trimProgress)}%` : 'Recortar Video'}
            </Button>

            {state.trimmedUrl && (
              <Button variant="primary" icon={<Download className="w-4 h-4" />} onClick={downloadTrimmed}>
                Descargar Recortado
              </Button>
            )}

            <Button variant="ghost" icon={<RotateCcw className="w-4 h-4" />} onClick={reset}>
              Nuevo Video
            </Button>
          </div>

          {/* Progress Bar */}
          {state.isTrimming && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600 dark:text-gray-400">Procesando video...</span>
                <span className="font-mono font-medium text-blue-600 dark:text-blue-400">
                  {Math.round(state.trimProgress)}%
                </span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-300"
                  style={{ width: `${state.trimProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Error */}
          {state.error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {state.error}
            </div>
          )}

          {/* Trimmed Video Preview */}
          {state.trimmedUrl && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
              <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                <Film className="w-4 h-4 text-green-500" />
                Video Recortado
              </h3>
              <video
                ref={previewVideoRef}
                src={state.trimmedUrl}
                className="w-full max-h-[400px] object-contain bg-black rounded-lg"
                controls
                playsInline
              />
            </div>
          )}
        </div>
      )}

      {/* Hidden canvas for recording */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
