import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================
// COMPANY STORE - Datos de Empresa Enterprise
// ============================================

export type CompanyRole =
  | 'ceo_gerente'
  | 'director_operaciones'
  | 'coordinador_logistico'
  | 'analista'
  | 'vendedor'
  | 'soporte'
  | 'otro';

export type IndustrySector =
  | 'ecommerce'
  | 'retail'
  | 'manufactura'
  | 'distribucion'
  | 'servicios'
  | 'otro';

export type ShippingVolume =
  | '1-100'
  | '100-500'
  | '500-1000'
  | '1000-5000'
  | '5000+';

export type CarrierOption =
  | 'servientrega'
  | 'coordinadora'
  | 'envia'
  | 'tcc'
  | 'interrapidisimo'
  | 'otro';

export type ProductType =
  | 'paqueteria'
  | 'documentos'
  | 'fragil'
  | 'refrigerado'
  | 'otro';

export type IntegrationType =
  | 'shopify'
  | 'woocommerce'
  | 'api_propia'
  | 'manual';

// User Profile Data
export interface UserProfileData {
  fullName: string;
  role: CompanyRole | '';
  avatarUrl: string | null;
  avatarColor: string;
}

// Company Data
export interface CompanyData {
  name: string;
  taxId: string; // NIT
  country: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  logoUrl: string | null;
  sector: IndustrySector | '';
}

// Operation Preferences
export interface OperationPreferences {
  shippingVolume: ShippingVolume | '';
  carriers: CarrierOption[];
  productTypes: ProductType[];
  integrations: IntegrationType[];
}

// Onboarding State
export interface EnterpriseOnboardingState {
  // Current step (1-4)
  currentStep: number;

  // Step completion status
  stepsCompleted: {
    profile: boolean;
    company: boolean;
    preferences: boolean;
    finished: boolean;
  };

  // User profile data
  userProfile: UserProfileData;

  // Company data
  company: CompanyData;

  // Operation preferences
  preferences: OperationPreferences;

  // UI state
  isOnboardingComplete: boolean;
  showEnterpriseOnboarding: boolean;

  // Actions
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;

  // Profile actions
  updateUserProfile: (data: Partial<UserProfileData>) => void;
  completeProfileStep: () => void;

  // Company actions
  updateCompany: (data: Partial<CompanyData>) => void;
  completeCompanyStep: () => void;

  // Preferences actions
  updatePreferences: (data: Partial<OperationPreferences>) => void;
  completePreferencesStep: () => void;

  // Final actions
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  setShowEnterpriseOnboarding: (show: boolean) => void;

  // Getters
  getCompletionPercentage: () => number;
  getInitials: () => string;
}

const defaultUserProfile: UserProfileData = {
  fullName: '',
  role: '',
  avatarUrl: null,
  avatarColor: '#6366f1', // Indigo
};

const defaultCompany: CompanyData = {
  name: '',
  taxId: '',
  country: 'Colombia',
  city: '',
  address: '',
  phone: '',
  email: '',
  logoUrl: null,
  sector: '',
};

const defaultPreferences: OperationPreferences = {
  shippingVolume: '',
  carriers: [],
  productTypes: [],
  integrations: [],
};

export const useCompanyStore = create<EnterpriseOnboardingState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentStep: 1,

      stepsCompleted: {
        profile: false,
        company: false,
        preferences: false,
        finished: false,
      },

      userProfile: defaultUserProfile,
      company: defaultCompany,
      preferences: defaultPreferences,

      isOnboardingComplete: false,
      showEnterpriseOnboarding: false,

      // Navigation actions
      setCurrentStep: (step) => set({ currentStep: step }),

      nextStep: () => {
        const { currentStep } = get();
        if (currentStep < 4) {
          set({ currentStep: currentStep + 1 });
        }
      },

      prevStep: () => {
        const { currentStep } = get();
        if (currentStep > 1) {
          set({ currentStep: currentStep - 1 });
        }
      },

      // Profile actions
      updateUserProfile: (data) => {
        set((state) => ({
          userProfile: { ...state.userProfile, ...data },
        }));
      },

      completeProfileStep: () => {
        set((state) => ({
          stepsCompleted: { ...state.stepsCompleted, profile: true },
          currentStep: 2,
        }));
      },

      // Company actions
      updateCompany: (data) => {
        set((state) => ({
          company: { ...state.company, ...data },
        }));
      },

      completeCompanyStep: () => {
        set((state) => ({
          stepsCompleted: { ...state.stepsCompleted, company: true },
          currentStep: 3,
        }));
      },

      // Preferences actions
      updatePreferences: (data) => {
        set((state) => ({
          preferences: { ...state.preferences, ...data },
        }));
      },

      completePreferencesStep: () => {
        set((state) => ({
          stepsCompleted: { ...state.stepsCompleted, preferences: true },
          currentStep: 4,
        }));
      },

      // Final actions
      completeOnboarding: () => {
        set((state) => ({
          stepsCompleted: { ...state.stepsCompleted, finished: true },
          isOnboardingComplete: true,
          showEnterpriseOnboarding: false,
        }));
      },

      resetOnboarding: () => {
        set({
          currentStep: 1,
          stepsCompleted: {
            profile: false,
            company: false,
            preferences: false,
            finished: false,
          },
          userProfile: defaultUserProfile,
          company: defaultCompany,
          preferences: defaultPreferences,
          isOnboardingComplete: false,
          showEnterpriseOnboarding: true,
        });
      },

      setShowEnterpriseOnboarding: (show) => set({ showEnterpriseOnboarding: show }),

      // Getters
      getCompletionPercentage: () => {
        const { stepsCompleted } = get();
        const completed = Object.values(stepsCompleted).filter(Boolean).length;
        return Math.round((completed / 4) * 100);
      },

      getInitials: () => {
        const { userProfile } = get();
        if (!userProfile.fullName) return 'U';

        const names = userProfile.fullName.trim().split(' ');
        if (names.length === 1) {
          return names[0].charAt(0).toUpperCase();
        }
        return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
      },
    }),
    {
      name: 'litper-company-storage',
      partialize: (state) => ({
        stepsCompleted: state.stepsCompleted,
        userProfile: state.userProfile,
        company: state.company,
        preferences: state.preferences,
        isOnboardingComplete: state.isOnboardingComplete,
      }),
    }
  )
);

// Role labels for display
export const roleLabels: Record<CompanyRole, string> = {
  ceo_gerente: 'CEO / Gerente General',
  director_operaciones: 'Director de Operaciones',
  coordinador_logistico: 'Coordinador Logístico',
  analista: 'Analista',
  vendedor: 'Vendedor',
  soporte: 'Soporte al Cliente',
  otro: 'Otro',
};

// Sector labels for display
export const sectorLabels: Record<IndustrySector, string> = {
  ecommerce: 'E-commerce',
  retail: 'Retail / Tienda Física',
  manufactura: 'Manufactura',
  distribucion: 'Distribución',
  servicios: 'Servicios',
  otro: 'Otro',
};

// Volume labels for display
export const volumeLabels: Record<ShippingVolume, string> = {
  '1-100': '1 - 100 envíos',
  '100-500': '100 - 500 envíos',
  '500-1000': '500 - 1,000 envíos',
  '1000-5000': '1,000 - 5,000 envíos',
  '5000+': 'Más de 5,000 envíos',
};

// Carrier labels for display
export const carrierLabels: Record<CarrierOption, string> = {
  servientrega: 'Servientrega',
  coordinadora: 'Coordinadora',
  envia: 'Envía',
  tcc: 'TCC',
  interrapidisimo: 'Inter Rapidísimo',
  otro: 'Otra transportadora',
};

// Product type labels
export const productTypeLabels: Record<ProductType, string> = {
  paqueteria: 'Paquetería general',
  documentos: 'Documentos',
  fragil: 'Productos frágiles',
  refrigerado: 'Productos refrigerados',
  otro: 'Otro tipo',
};

// Integration labels
export const integrationLabels: Record<IntegrationType, string> = {
  shopify: 'Shopify',
  woocommerce: 'WooCommerce',
  api_propia: 'API propia',
  manual: 'Carga manual',
};

export default useCompanyStore;
