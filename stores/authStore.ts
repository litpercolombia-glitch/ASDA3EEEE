// stores/authStore.ts
// Estado global de autenticación con Zustand
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  User,
  LoginCredentials,
  RegisterData,
  SessionLog,
  ActivityLog,
  login as authLogin,
  register as authRegister,
  logout as authLogout,
  getCurrentUser,
  isAuthenticated,
  getUserSessionLogs,
  getUserActivityLogs,
  updateProfile as authUpdateProfile,
  changePassword as authChangePassword,
  getAllUsers,
  toggleUserStatus as authToggleUserStatus,
  logCurrentUserActivity,
} from '../services/authService';
import { signInWithGoogle as supabaseSignInWithGoogle } from '../services/supabaseService';

// =====================================
// TIPOS
// =====================================

interface AuthState {
  // Estado
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Acciones de autenticación
  login: (credentials: LoginCredentials) => Promise<boolean>;
  initiateGoogleLogin: () => Promise<void>;
  loginWithGoogle: (data: { email: string; nombre: string; avatar?: string }) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => void;

  // Acciones de perfil
  updateProfile: (updates: Partial<User>) => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;

  // Logs y actividad
  getSessionLogs: () => SessionLog[];
  getActivityLogs: () => ActivityLog[];
  logActivity: (action: string, details: string, module: string) => void;

  // Admin
  getAllUsers: () => User[];
  toggleUserStatus: (email: string) => Promise<boolean>;

  // Utilidades
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

// =====================================
// STORE
// =====================================

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Login
      login: async (credentials) => {
        set({ isLoading: true, error: null });

        try {
          const response = await authLogin(credentials);

          if (response.success && response.user) {
            set({
              user: response.user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.message || 'Error al iniciar sesión',
            });
            return false;
          }
        } catch (error) {
          set({
            isLoading: false,
            error: 'Error de conexión',
          });
          return false;
        }
      },

      // Google OAuth — inicia la redirección a Google vía Supabase
      initiateGoogleLogin: async () => {
        set({ isLoading: true, error: null });
        try {
          await supabaseSignInWithGoogle();
          // La página se redirige a Google; no hay más ejecución aquí
        } catch (err) {
          set({
            isLoading: false,
            error: 'No se pudo iniciar sesión con Google. Verifica la configuración de Supabase.',
          });
        }
      },

      // Google OAuth — llamado desde AuthCallback con los datos del usuario
      loginWithGoogle: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const { login: authLogin, register } = await import('../services/authService');
          const loginResult = await authLogin({ email: data.email, password: 'oauth_authenticated' });
          if (loginResult.success && loginResult.user) {
            set({ user: { ...loginResult.user, avatar: data.avatar }, isAuthenticated: true, isLoading: false, error: null });
            return true;
          }
          const regResult = await register({
            email: data.email,
            password: 'oauth_authenticated',
            nombre: data.nombre,
            rol: 'operador',
          });
          if (regResult.success && regResult.user) {
            set({ user: { ...regResult.user, avatar: data.avatar }, isAuthenticated: true, isLoading: false, error: null });
            return true;
          }
          set({ isLoading: false, error: 'No se pudo autenticar con Google.' });
          return false;
        } catch (err) {
          set({ isLoading: false, error: 'Error al procesar la autenticación con Google.' });
          return false;
        }
      },

      // Registro
      register: async (data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await authRegister(data);

          if (response.success && response.user) {
            set({
              user: response.user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.message || 'Error al registrarse',
            });
            return false;
          }
        } catch (error) {
          set({
            isLoading: false,
            error: 'Error de conexión',
          });
          return false;
        }
      },

      // Logout
      logout: () => {
        authLogout();
        set({
          user: null,
          isAuthenticated: false,
          error: null,
        });
      },

      // Verificar autenticación
      checkAuth: () => {
        const authenticated = isAuthenticated();
        const user = getCurrentUser();

        set({
          user: authenticated ? user : null,
          isAuthenticated: authenticated,
        });
      },

      // Actualizar perfil
      updateProfile: async (updates) => {
        set({ isLoading: true, error: null });

        try {
          const response = authUpdateProfile(updates);

          if (response.success && response.user) {
            set({
              user: response.user,
              isLoading: false,
            });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.message || 'Error al actualizar perfil',
            });
            return false;
          }
        } catch (error) {
          set({
            isLoading: false,
            error: 'Error de conexión',
          });
          return false;
        }
      },

      // Cambiar contraseña
      changePassword: async (currentPassword, newPassword) => {
        set({ isLoading: true, error: null });

        try {
          const response = authChangePassword(currentPassword, newPassword);

          if (response.success) {
            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.message || 'Error al cambiar contraseña',
            });
            return false;
          }
        } catch (error) {
          set({
            isLoading: false,
            error: 'Error de conexión',
          });
          return false;
        }
      },

      // Obtener logs de sesión
      getSessionLogs: () => {
        const { user } = get();
        return getUserSessionLogs(user?.id);
      },

      // Obtener logs de actividad
      getActivityLogs: () => {
        const { user } = get();
        return getUserActivityLogs(user?.rol === 'admin' ? undefined : user?.id);
      },

      // Registrar actividad
      logActivity: (action, details, module) => {
        logCurrentUserActivity(action, details, module);
      },

      // Obtener todos los usuarios (admin)
      getAllUsers: () => {
        return getAllUsers();
      },

      // Toggle estado de usuario (admin)
      toggleUserStatus: async (email) => {
        const response = authToggleUserStatus(email);
        return response.success;
      },

      // Limpiar error
      clearError: () => set({ error: null }),

      // Set loading
      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'litper-auth-store',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
