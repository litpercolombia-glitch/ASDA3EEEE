import { useState, useRef, useCallback, useEffect } from 'react';

export interface TrimRange {
  start: number;
  end: number;
}

export interface VideoTrimmerState {
  file: File | null;
  videoUrl: string | null;
  duration: number;
  currentTime: number;
  isPlaying: boolean;
  isTrimming: boolean;
  trimProgress: number;
  trimRange: TrimRange;
  trimmedBlob: Blob | null;
  trimmedUrl: string | null;
  error: string | null;
}

export function useVideoTrimmer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);

  const [state, setState] = useState<VideoTrimmerState>({
    file: null,
    videoUrl: null,
    duration: 0,
    currentTime: 0,
    isPlaying: false,
    isTrimming: false,
    trimProgress: 0,
    trimRange: { start: 0, end: 0 },
    trimmedBlob: null,
    trimmedUrl: null,
    error: null,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const animationFrameRef = useRef<number>(0);

  // Cleanup URLs on unmount
  useEffect(() => {
    return () => {
      if (state.videoUrl) URL.revokeObjectURL(state.videoUrl);
      if (state.trimmedUrl) URL.revokeObjectURL(state.trimmedUrl);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  const loadVideo = useCallback((file: File) => {
    // Cleanup previous URLs
    setState((prev) => {
      if (prev.videoUrl) URL.revokeObjectURL(prev.videoUrl);
      if (prev.trimmedUrl) URL.revokeObjectURL(prev.trimmedUrl);
      return prev;
    });

    const url = URL.createObjectURL(file);
    setState((prev) => ({
      ...prev,
      file,
      videoUrl: url,
      trimmedBlob: null,
      trimmedUrl: null,
      error: null,
      currentTime: 0,
      isPlaying: false,
      isTrimming: false,
      trimProgress: 0,
    }));
  }, []);

  const onVideoLoaded = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const dur = video.duration;
    setState((prev) => ({
      ...prev,
      duration: dur,
      trimRange: { start: 0, end: dur },
    }));
  }, []);

  const setTrimStart = useCallback((value: number) => {
    setState((prev) => ({
      ...prev,
      trimRange: {
        start: Math.min(value, prev.trimRange.end - 0.1),
        end: prev.trimRange.end,
      },
    }));
  }, []);

  const setTrimEnd = useCallback((value: number) => {
    setState((prev) => ({
      ...prev,
      trimRange: {
        start: prev.trimRange.start,
        end: Math.max(value, prev.trimRange.start + 0.1),
      },
    }));
  }, []);

  const seekTo = useCallback((time: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = time;
    setState((prev) => ({ ...prev, currentTime: time }));
  }, []);

  const togglePlayback = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      // Start from trim start if at beginning or outside range
      if (video.currentTime < state.trimRange.start || video.currentTime >= state.trimRange.end) {
        video.currentTime = state.trimRange.start;
      }
      video.play();
      setState((prev) => ({ ...prev, isPlaying: true }));
    } else {
      video.pause();
      setState((prev) => ({ ...prev, isPlaying: false }));
    }
  }, [state.trimRange]);

  const onTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const ct = video.currentTime;
    setState((prev) => ({ ...prev, currentTime: ct }));
    // Stop at trim end during preview
    if (ct >= state.trimRange.end) {
      video.pause();
      video.currentTime = state.trimRange.end;
      setState((prev) => ({ ...prev, isPlaying: false, currentTime: state.trimRange.end }));
    }
  }, [state.trimRange.end]);

  const trimVideo = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    setState((prev) => ({
      ...prev,
      isTrimming: true,
      trimProgress: 0,
      error: null,
      trimmedBlob: null,
      trimmedUrl: null,
    }));

    try {
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('No se pudo obtener contexto del canvas');

      // Set up MediaRecorder from canvas stream
      const stream = canvas.captureStream(30);

      // Also capture audio from the video if it has an audio track
      try {
        const audioCtx = new AudioContext();
        const source = audioCtx.createMediaElementSource(video);
        const destination = audioCtx.createMediaStreamDestination();
        source.connect(destination);
        source.connect(audioCtx.destination);
        destination.stream.getAudioTracks().forEach((track) => {
          stream.addTrack(track);
        });
      } catch {
        // Video may not have audio - that's fine
      }

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
          ? 'video/webm;codecs=vp8'
          : 'video/webm';

      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 5_000_000,
      });

      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      const recordingDone = new Promise<Blob>((resolve, reject) => {
        recorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: mimeType });
          if (blob.size === 0) {
            reject(new Error('El video recortado esta vacio'));
          } else {
            resolve(blob);
          }
        };
        recorder.onerror = () => reject(new Error('Error durante la grabacion'));
      });

      // Seek to start and begin recording
      video.currentTime = state.trimRange.start;
      video.muted = true;

      await new Promise<void>((resolve) => {
        video.onseeked = () => resolve();
      });

      recorder.start(100);
      video.play();

      const totalDuration = state.trimRange.end - state.trimRange.start;

      // Draw frames to canvas while recording
      const drawFrame = () => {
        if (video.currentTime >= state.trimRange.end || video.paused) {
          video.pause();
          recorder.stop();
          return;
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const progress = ((video.currentTime - state.trimRange.start) / totalDuration) * 100;
        setState((prev) => ({ ...prev, trimProgress: Math.min(progress, 100) }));
        animationFrameRef.current = requestAnimationFrame(drawFrame);
      };
      animationFrameRef.current = requestAnimationFrame(drawFrame);

      const blob = await recordingDone;
      const url = URL.createObjectURL(blob);

      video.muted = false;

      setState((prev) => {
        if (prev.trimmedUrl) URL.revokeObjectURL(prev.trimmedUrl);
        return {
          ...prev,
          trimmedBlob: blob,
          trimmedUrl: url,
          isTrimming: false,
          trimProgress: 100,
        };
      });
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isTrimming: false,
        error: err instanceof Error ? err.message : 'Error al recortar el video',
      }));
    }
  }, [state.trimRange]);

  const downloadTrimmed = useCallback(() => {
    if (!state.trimmedUrl || !state.file) return;
    const a = document.createElement('a');
    a.href = state.trimmedUrl;
    const baseName = state.file.name.replace(/\.[^.]+$/, '');
    a.download = `${baseName}_recortado.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [state.trimmedUrl, state.file]);

  const reset = useCallback(() => {
    if (state.videoUrl) URL.revokeObjectURL(state.videoUrl);
    if (state.trimmedUrl) URL.revokeObjectURL(state.trimmedUrl);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    setState({
      file: null,
      videoUrl: null,
      duration: 0,
      currentTime: 0,
      isPlaying: false,
      isTrimming: false,
      trimProgress: 0,
      trimRange: { start: 0, end: 0 },
      trimmedBlob: null,
      trimmedUrl: null,
      error: null,
    });
  }, [state.videoUrl, state.trimmedUrl]);

  return {
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
  };
}
