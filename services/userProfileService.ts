// services/userProfileService.ts
// Servicio de Perfil de Usuario - Configuración personalizada

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================
// TIPOS
// ============================================

export type Gender = 'male' | 'female' | 'other' | 'prefer_not_say';

export interface UserProfile {
  id: string;
  nombre: string;
  apellido?: string;
  email: string;
  telefono?: string;
  genero: Gender;
  avatar?: string;
  avatarColor?: string;
  empresa?: string;
  cargo?: string;
  pais?: string;
  ciudad?: string;
  idioma: 'es' | 'en';
  tema: 'dark' | 'light' | 'auto';
  notificaciones: {
    email: boolean;
    push: boolean;
    sonido: boolean;
  };
  createdAt: string;
  updatedAt: string;
  onboardingCompleted: boolean;
}

export interface UserProfileState {
  profile: UserProfile | null;
  isOnboardingComplete: boolean;

  // Actions
  setProfile: (profile: Partial<UserProfile>) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  completeOnboarding: (data: { nombre: string; genero: Gender }) => void;
  setAvatar: (avatarUrl: string) => void;
  setAvatarColor: (color: string) => void;
  resetProfile: () => void;
  getDisplayName: () => string;
  getGreeting: () => string;
  getInitials: () => string;
}

// ============================================
// COLORES DE AVATAR PREDETERMINADOS
// ============================================

export const AVATAR_COLORS = [
  { id: 'amber', bg: 'from-amber-500 to-orange-600', text: 'text-white' },
  { id: 'emerald', bg: 'from-emerald-500 to-teal-600', text: 'text-white' },
  { id: 'blue', bg: 'from-blue-500 to-indigo-600', text: 'text-white' },
  { id: 'purple', bg: 'from-purple-500 to-pink-600', text: 'text-white' },
  { id: 'rose', bg: 'from-rose-500 to-red-600', text: 'text-white' },
  { id: 'cyan', bg: 'from-cyan-500 to-blue-600', text: 'text-white' },
  { id: 'lime', bg: 'from-lime-500 to-green-600', text: 'text-white' },
  { id: 'fuchsia', bg: 'from-fuchsia-500 to-purple-600', text: 'text-white' },
];

// ============================================
// PERFIL POR DEFECTO
// ============================================

const DEFAULT_PROFILE: UserProfile = {
  id: '',
  nombre: '',
  email: '',
  genero: 'prefer_not_say',
  idioma: 'es',
  tema: 'dark',
  avatarColor: 'amber',
  notificaciones: {
    email: true,
    push: true,
    sonido: true,
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  onboardingCompleted: false,
};

// ============================================
// STORE DE PERFIL
// ============================================

export const useUserProfileStore = create<UserProfileState>()(
  persist(
    (set, get) => ({
      profile: null,
      isOnboardingComplete: false,

      setProfile: (profile) => {
        set({
          profile: {
            ...DEFAULT_PROFILE,
            ...profile,
            id: profile.id || `user_${Date.now()}`,
            updatedAt: new Date().toISOString(),
          } as UserProfile,
        });
      },

      updateProfile: (updates) => {
        set((state) => ({
          profile: state.profile
            ? {
                ...state.profile,
                ...updates,
                updatedAt: new Date().toISOString(),
              }
            : null,
        }));
      },

      completeOnboarding: (data) => {
        set((state) => ({
          profile: {
            ...DEFAULT_PROFILE,
            ...state.profile,
            ...data,
            id: state.profile?.id || `user_${Date.now()}`,
            onboardingCompleted: true,
            updatedAt: new Date().toISOString(),
          } as UserProfile,
          isOnboardingComplete: true,
        }));
      },

      setAvatar: (avatarUrl) => {
        set((state) => ({
          profile: state.profile
            ? { ...state.profile, avatar: avatarUrl, updatedAt: new Date().toISOString() }
            : null,
        }));
      },

      setAvatarColor: (color) => {
        set((state) => ({
          profile: state.profile
            ? { ...state.profile, avatarColor: color, updatedAt: new Date().toISOString() }
            : null,
        }));
      },

      resetProfile: () => {
        set({ profile: null, isOnboardingComplete: false });
      },

      getDisplayName: () => {
        const profile = get().profile;
        if (!profile) return 'Usuario';
        if (profile.apellido) return `${profile.nombre} ${profile.apellido}`;
        return profile.nombre || 'Usuario';
      },

      getGreeting: () => {
        const profile = get().profile;
        const hour = new Date().getHours();
        let greeting = '';

        if (hour >= 5 && hour < 12) {
          greeting = 'Buenos días';
        } else if (hour >= 12 && hour < 19) {
          greeting = 'Buenas tardes';
        } else {
          greeting = 'Buenas noches';
        }

        if (!profile) return greeting;

        // Personalizar según género
        const nombre = profile.nombre || 'Usuario';
        return `${greeting}, ${nombre}`;
      },

      getInitials: () => {
        const profile = get().profile;
        if (!profile || !profile.nombre) return 'U';

        const parts = profile.nombre.split(' ');
        if (parts.length >= 2) {
          return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        }
        return profile.nombre.substring(0, 2).toUpperCase();
      },
    }),
    {
      name: 'litper-user-profile',
    }
  )
);

// ============================================
// HELPERS
// ============================================

export const getGenderLabel = (gender: Gender): string => {
  switch (gender) {
    case 'male': return 'Masculino';
    case 'female': return 'Femenino';
    case 'other': return 'Otro';
    case 'prefer_not_say': return 'Prefiero no decir';
  }
};

export const getGenderIcon = (gender: Gender): string => {
  switch (gender) {
    case 'male': return '👨';
    case 'female': return '👩';
    case 'other': return '🧑';
    case 'prefer_not_say': return '👤';
  }
};

export default useUserProfileStore;
