// stores/layoutStore.ts
// Estado del layout y sidebar - Simplificado (patrón Stripe/Vercel)

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type MainSection =
  | 'inicio'
  | 'operaciones'
  | 'inteligencia'
  | 'cerebro-ia'
  | 'negocio'
  | 'marketing'
  | 'enterprise';

export type MarketingTab =
  | 'dashboard'
  | 'meta'
  | 'google'
  | 'tiktok'
  | 'utm'
  | 'integraciones'
  | 'reglas';

// Sub-tabs para cada sección (manejadas por los componentes de contenido)
export type InicioTab = 'resumen' | 'actividad' | 'estadisticas';
export type OperacionesTab = 'envios' | 'tracking' | 'historial' | 'rutas';
export type InteligenciaTab = 'analisis' | 'reportes' | 'predicciones' | 'insights';
export type CerebroIATab = 'asistente' | 'configuracion-ia' | 'historial-chat';
export type NegocioTab = 'metricas' | 'clientes' | 'ventas' | 'rendimiento';
export type ConfigTab = 'general' | 'api-keys' | 'integraciones' | 'usuarios' | 'admin';
export type EnterpriseTab = 'command-center' | 'empresas' | 'analytics' | 'compliance' | 'security' | 'users' | 'automation';

interface LayoutState {
  // Sidebar
  sidebarCollapsed: boolean;

  // Mobile
  mobileMenuOpen: boolean;

  // Navegación - 1 click directo
  activeSection: MainSection;

  // Sub-tabs (manejadas por contenido, persistidas aquí)
  activeMarketingTab: MarketingTab;
  activeInicioTab: InicioTab;
  activeOperacionesTab: OperacionesTab;
  activeInteligenciaTab: InteligenciaTab;
  activeCerebroIATab: CerebroIATab;
  activeNegocioTab: NegocioTab;
  activeConfigTab: ConfigTab;
  activeEnterpriseTab: EnterpriseTab;

  // UI
  showChatAssistant: boolean;
  showNotifications: boolean;

  // Actions
  toggleSidebar: () => void;
  collapseSidebar: () => void;
  expandSidebar: () => void;

  // Mobile
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;

  // Navegación directa
  setActiveSection: (section: MainSection) => void;

  // Sub-tab setters
  setMarketingTab: (tab: MarketingTab) => void;
  setInicioTab: (tab: InicioTab) => void;
  setOperacionesTab: (tab: OperacionesTab) => void;
  setInteligenciaTab: (tab: InteligenciaTab) => void;
  setCerebroIATab: (tab: CerebroIATab) => void;
  setNegocioTab: (tab: NegocioTab) => void;
  setConfigTab: (tab: ConfigTab) => void;
  setEnterpriseTab: (tab: EnterpriseTab) => void;

  toggleChatAssistant: () => void;
  toggleNotifications: () => void;
}

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      mobileMenuOpen: false,
      activeSection: 'inicio',
      activeMarketingTab: 'dashboard',

      // Sub-tabs por defecto
      activeInicioTab: 'resumen',
      activeOperacionesTab: 'envios',
      activeInteligenciaTab: 'analisis',
      activeCerebroIATab: 'asistente',
      activeNegocioTab: 'metricas',
      activeConfigTab: 'general',
      activeEnterpriseTab: 'command-center',

      showChatAssistant: false,
      showNotifications: false,

      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      collapseSidebar: () => set({ sidebarCollapsed: true }),
      expandSidebar: () => set({ sidebarCollapsed: false }),

      toggleMobileMenu: () => set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen })),
      closeMobileMenu: () => set({ mobileMenuOpen: false }),

      // 1 click = navega directo. Sin expandedSections.
      setActiveSection: (section) => set({ activeSection: section }),

      // Sub-tab setters
      setMarketingTab: (tab) => set({ activeMarketingTab: tab }),
      setInicioTab: (tab) => set({ activeInicioTab: tab }),
      setOperacionesTab: (tab) => set({ activeOperacionesTab: tab }),
      setInteligenciaTab: (tab) => set({ activeInteligenciaTab: tab }),
      setCerebroIATab: (tab) => set({ activeCerebroIATab: tab }),
      setNegocioTab: (tab) => set({ activeNegocioTab: tab }),
      setConfigTab: (tab) => set({ activeConfigTab: tab }),
      setEnterpriseTab: (tab) => set({ activeEnterpriseTab: tab }),

      toggleChatAssistant: () => set((state) => ({ showChatAssistant: !state.showChatAssistant })),
      toggleNotifications: () => set((state) => ({ showNotifications: !state.showNotifications })),
    }),
    {
      name: 'litper-layout-store',
      version: 2,
      migrate: (persistedState: any, version: number) => {
        if (version < 2) {
          const { expandedSections, sidebarHovered, ...clean } = persistedState;
          return { ...clean, mobileMenuOpen: false };
        }
        return persistedState as LayoutState;
      },
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        activeSection: state.activeSection,
      }),
    }
  )
);

export default useLayoutStore;
