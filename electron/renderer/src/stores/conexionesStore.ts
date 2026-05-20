/**
 * conexionesStore — credenciales y endpoints externos.
 *
 * Persistencia local. En Fase 1 los tokens sensibles deberian moverse
 * a OS keychain (keytar) y NO a localStorage. Por ahora staging.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Conexiones {
  supabaseAsdaUrl: string;
  supabaseAsdaAnonKey: string;
  supabaseSemaforoUrl: string;
  supabaseSemaforoAnonKey: string;
  backendUrl: string;
  whatsappToken: string;
  whatsappPhoneNumberId: string;
  metaAdsAccessToken: string;
  metaAdsAccountId: string;
  chateaProApiKey: string;
  driveFolderId: string;
  slackChannel: string;
}

const EMPTY: Conexiones = {
  supabaseAsdaUrl: '',
  supabaseAsdaAnonKey: '',
  supabaseSemaforoUrl: 'https://gtsivwbnhcawvmsfujby.supabase.co',
  supabaseSemaforoAnonKey: '',
  backendUrl: 'http://localhost:8000',
  whatsappToken: '',
  whatsappPhoneNumberId: '',
  metaAdsAccessToken: '',
  metaAdsAccountId: '',
  chateaProApiKey: '',
  driveFolderId: '',
  slackChannel: '#ops',
};

interface ConexionesState {
  conexiones: Conexiones;
  setConexion: <K extends keyof Conexiones>(key: K, value: Conexiones[K]) => void;
  reset: () => void;
}

export const useConexionesStore = create<ConexionesState>()(
  persist(
    (set) => ({
      conexiones: EMPTY,
      setConexion: (key, value) => set((s) => ({ conexiones: { ...s.conexiones, [key]: value } })),
      reset: () => set({ conexiones: EMPTY }),
    }),
    { name: 'litper-desk:conexiones', version: 1 },
  ),
);
