import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================
// ONBOARDING STORE - Estado de Login y Onboarding
// ============================================

interface OnboardingProgress {
  createAccount: boolean;
  configureCompany: boolean;
  connectCarrier: boolean;
  firstShipment: boolean;
  setupNotifications: boolean;
}

interface UserSession {
  name: string;
  email: string;
  company: string;
  role: string;
  avatar?: string;
  lastLogin?: Date;
}

interface OnboardingState {
  // Auth states
  isAuthenticated: boolean;
  isLoading: boolean;
  loginError: string | null;

  // Flow states
  showSplash: boolean;
  showWelcome: boolean;
  showOnboarding: boolean;
  hideWelcomeForever: boolean;

  // User data
  user: UserSession | null;

  // Onboarding progress
  onboardingProgress: OnboardingProgress;
  onboardingDismissed: boolean;

  // Quick stats for welcome modal
  pendingShipments: number;
  newAlerts: number;
  pendingGuides: number;

  // Actions
  setLoading: (loading: boolean) => void;
  setShowSplash: (show: boolean) => void;
  setShowWelcome: (show: boolean) => void;
  setHideWelcomeForever: (hide: boolean) => void;
  setShowOnboarding: (show: boolean) => void;
  setOnboardingDismissed: (dismissed: boolean) => void;

  login: (password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;

  updateOnboardingStep: (step: keyof OnboardingProgress, completed: boolean) => void;
  resetOnboarding: () => void;

  getOnboardingPercentage: () => number;
  getNextIncompleteStep: () => keyof OnboardingProgress | null;
}

const defaultOnboardingProgress: OnboardingProgress = {
  createAccount: true, // Always true after login
  configureCompany: false,
  connectCarrier: false,
  firstShipment: false,
  setupNotifications: false,
};

const defaultUser: UserSession = {
  name: 'Usuario Admin',
  email: 'admin@litper.com',
  company: 'LITPER Colombia',
  role: 'Administrador',
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      // Initial states
      isAuthenticated: false,
      isLoading: false,
      loginError: null,

      showSplash: false,
      showWelcome: false,
      showOnboarding: false,
      hideWelcomeForever: false,

      user: null,

      onboardingProgress: defaultOnboardingProgress,
      onboardingDismissed: false,

      pendingShipments: 12,
      newAlerts: 5,
      pendingGuides: 8,

      // Actions
      setLoading: (loading) => set({ isLoading: loading }),
      setShowSplash: (show) => set({ showSplash: show }),
      setShowWelcome: (show) => set({ showWelcome: show }),
      setHideWelcomeForever: (hide) => set({ hideWelcomeForever: hide }),
      setShowOnboarding: (show) => set({ showOnboarding: show }),
      setOnboardingDismissed: (dismissed) => set({ onboardingDismissed: dismissed }),

      login: async (password: string) => {
        set({ isLoading: true, loginError: null });

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Check password (in real app, this would be an API call)
        if (password === 'admin123' || password === 'litper2025') {
          const { hideWelcomeForever, onboardingDismissed, onboardingProgress } = get();

          set({
            isAuthenticated: true,
            isLoading: false,
            loginError: null,
            user: defaultUser,
            showSplash: true, // Show splash after successful login
          });

          // After splash, determine what to show
          setTimeout(() => {
            set({ showSplash: false });

            // Show welcome if not hidden forever
            if (!hideWelcomeForever) {
              set({ showWelcome: true });
            }

            // Check if onboarding should be shown
            const percentage = get().getOnboardingPercentage();
            if (percentage < 100 && !onboardingDismissed) {
              set({ showOnboarding: true });
            }
          }, 3000); // Splash duration

          return { success: true };
        } else {
          set({
            isLoading: false,
            loginError: 'Credenciales incorrectas. Intenta de nuevo.',
          });
          return { success: false, error: 'Credenciales incorrectas' };
        }
      },

      logout: () => {
        set({
          isAuthenticated: false,
          user: null,
          showSplash: false,
          showWelcome: false,
          loginError: null,
        });
      },

      updateOnboardingStep: (step, completed) => {
        set((state) => ({
          onboardingProgress: {
            ...state.onboardingProgress,
            [step]: completed,
          },
        }));
      },

      resetOnboarding: () => {
        set({
          onboardingProgress: defaultOnboardingProgress,
          onboardingDismissed: false,
          showOnboarding: true,
        });
      },

      getOnboardingPercentage: () => {
        const { onboardingProgress } = get();
        const steps = Object.values(onboardingProgress);
        const completed = steps.filter(Boolean).length;
        return Math.round((completed / steps.length) * 100);
      },

      getNextIncompleteStep: () => {
        const { onboardingProgress } = get();
        const steps: (keyof OnboardingProgress)[] = [
          'createAccount',
          'configureCompany',
          'connectCarrier',
          'firstShipment',
          'setupNotifications',
        ];

        for (const step of steps) {
          if (!onboardingProgress[step]) {
            return step;
          }
        }
        return null;
      },
    }),
    {
      name: 'litper-onboarding-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        hideWelcomeForever: state.hideWelcomeForever,
        onboardingProgress: state.onboardingProgress,
        onboardingDismissed: state.onboardingDismissed,
      }),
    }
  )
);

export default useOnboardingStore;
