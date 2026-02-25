/**
 * VIDEO EDITING STORE
 *
 * Store Zustand para el modulo de edicion de video.
 * Maneja proyectos, cola de trabajos, historial y tier del usuario.
 *
 * USO:
 * import { useVideoEditingStore } from '@/stores/videoEditingStore'
 *
 * const { jobs, userTier, addJob, setTier } = useVideoEditingStore()
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { VideoJob, VideoEditingTier, VideoEditingFunction, VideoFile } from '../types/videoEditing';

// ============================================
// TIPOS
// ============================================

interface VideoEditingState {
  // Archivos importados
  files: VideoFile[];

  // Trabajos
  currentJob: VideoJob | null;
  jobQueue: VideoJob[];
  jobHistory: VideoJob[];

  // Tier
  userTier: VideoEditingTier;

  // UI
  activeTab: 'basic' | 'premium' | 'history';
  selectedFunction: VideoEditingFunction | null;
  isProcessing: boolean;

  // Acciones - Archivos
  addFile: (file: VideoFile) => void;
  removeFile: (fileId: string) => void;
  clearFiles: () => void;

  // Acciones - Jobs
  addJob: (job: VideoJob) => void;
  updateJob: (jobId: string, updates: Partial<VideoJob>) => void;
  completeJob: (jobId: string, result?: Record<string, unknown>) => void;
  failJob: (jobId: string, error: string) => void;
  cancelJob: (jobId: string) => void;
  clearHistory: () => void;

  // Acciones - Tier
  setTier: (tier: VideoEditingTier) => void;

  // Acciones - UI
  setActiveTab: (tab: VideoEditingState['activeTab']) => void;
  setSelectedFunction: (fn: VideoEditingFunction | null) => void;
  setProcessing: (processing: boolean) => void;
}

// ============================================
// STORE
// ============================================

export const useVideoEditingStore = create<VideoEditingState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      files: [],
      currentJob: null,
      jobQueue: [],
      jobHistory: [],
      userTier: 'basic',
      activeTab: 'basic',
      selectedFunction: null,
      isProcessing: false,

      // Archivos
      addFile: (file) =>
        set((state) => ({
          files: [...state.files, file],
        })),

      removeFile: (fileId) =>
        set((state) => ({
          files: state.files.filter((f) => f.id !== fileId),
        })),

      clearFiles: () => set({ files: [] }),

      // Jobs
      addJob: (job) =>
        set((state) => {
          if (state.currentJob) {
            return {
              jobQueue: [...state.jobQueue, job],
            };
          }
          return {
            currentJob: job,
            isProcessing: true,
          };
        }),

      updateJob: (jobId, updates) =>
        set((state) => {
          if (state.currentJob?.id === jobId) {
            return {
              currentJob: { ...state.currentJob, ...updates },
            };
          }
          return {
            jobQueue: state.jobQueue.map((j) =>
              j.id === jobId ? { ...j, ...updates } : j
            ),
          };
        }),

      completeJob: (jobId, result) =>
        set((state) => {
          const completedJob = state.currentJob?.id === jobId
            ? {
                ...state.currentJob,
                status: 'completed' as const,
                progress: 100,
                completedAt: new Date().toISOString(),
                result,
              }
            : null;

          const nextJob = state.jobQueue[0] || null;
          const remainingQueue = state.jobQueue.slice(1);

          return {
            currentJob: nextJob,
            jobQueue: remainingQueue,
            jobHistory: completedJob
              ? [completedJob, ...state.jobHistory].slice(0, 50)
              : state.jobHistory,
            isProcessing: !!nextJob,
          };
        }),

      failJob: (jobId, error) =>
        set((state) => {
          const failedJob = state.currentJob?.id === jobId
            ? {
                ...state.currentJob,
                status: 'error' as const,
                error,
                completedAt: new Date().toISOString(),
              }
            : null;

          const nextJob = state.jobQueue[0] || null;
          const remainingQueue = state.jobQueue.slice(1);

          return {
            currentJob: nextJob,
            jobQueue: remainingQueue,
            jobHistory: failedJob
              ? [failedJob, ...state.jobHistory].slice(0, 50)
              : state.jobHistory,
            isProcessing: !!nextJob,
          };
        }),

      cancelJob: (jobId) =>
        set((state) => {
          if (state.currentJob?.id === jobId) {
            const nextJob = state.jobQueue[0] || null;
            return {
              currentJob: nextJob,
              jobQueue: state.jobQueue.slice(1),
              isProcessing: !!nextJob,
            };
          }
          return {
            jobQueue: state.jobQueue.filter((j) => j.id !== jobId),
          };
        }),

      clearHistory: () => set({ jobHistory: [] }),

      // Tier
      setTier: (tier) => set({ userTier: tier }),

      // UI
      setActiveTab: (tab) => set({ activeTab: tab }),
      setSelectedFunction: (fn) => set({ selectedFunction: fn }),
      setProcessing: (processing) => set({ isProcessing: processing }),
    }),
    {
      name: 'litper-video-editing',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        jobHistory: state.jobHistory,
        userTier: state.userTier,
        files: state.files,
      }),
    }
  )
);
