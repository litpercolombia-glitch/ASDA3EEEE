/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY?: string;
  readonly VITE_STORAGE_KEY?: string;
  readonly VITE_STORAGE_EXPIRY_HOURS?: string;
  readonly VITE_ENABLE_AI_ASSISTANT?: string;
  readonly VITE_ENABLE_IMAGE_ANALYSIS?: string;
  readonly VITE_ENABLE_AUDIO_TRANSCRIPTION?: string;
  readonly DEV: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
