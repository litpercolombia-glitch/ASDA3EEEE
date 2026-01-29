// stores/layoutStore.ts
// Estado del layout y sidebar

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type MainSection =
  | 'inicio'
  | 'operaciones'
  | 'inteligencia'
  | 'cerebro-ia'
  | 'negocio'
  | 'marketing'
  | 'config';

export type MarketingTab =
  | 'dashboard'
  | 'meta'
  | 'google'
  | 'tiktok'
  | 'utm'
  | 'integraciones'
  | 'reglas';

// Sub-tabs para cada sección
export type InicioTab = 'resumen' | 'actividad' | 'estadisticas';
export type OperacionesTab = 'envios' | 'tracking' | 'historial' | 'rutas' | 'google-sheets';
export type InteligenciaTab = 'analisis' | 'reportes' | 'predicciones' | 'insights';
export type CerebroIATab = 'asistente' | 'configuracion-ia' | 'historial-chat';
export type NegocioTab = 'metricas' | 'clientes' | 'ventas' | 'rendimiento';
export type ConfigTab = 'general' | 'api-keys' | 'integraciones' | 'usuarios' | 'admin';

interface LayoutState {
  // Sidebar
  sidebarCollapsed: boolean;
  sidebarHovered: boolean;

  // Navegación
  activeSection: MainSection;
  activeMarketingTab: MarketingTab;

  // Sub-tabs activas
  activeInicioTab: InicioTab;
  activeOperacionesTab: OperacionesTab;
  activeInteligenciaTab: InteligenciaTab;
  activeCerebroIATab: CerebroIATab;
  activeNegocioTab: NegocioTab;
  activeConfigTab: ConfigTab;

  // Secciones expandidas
  expandedSections: MainSection[];

  // UI
  showChatAssistant: boolean;
  showNotifications: boolean;

  // Actions
  toggleSidebar: () => void;
  collapseSidebar: () => void;
  expandSidebar: () => void;
  setHovered: (hovered: boolean) => void;

  setActiveSection: (section: MainSection) => void;
  setMarketingTab: (tab: MarketingTab) => void;

  // Sub-tab actions
  setInicioTab: (tab: InicioTab) => void;
  setOperacionesTab: (tab: OperacionesTab) => void;
  setInteligenciaTab: (tab: InteligenciaTab) => void;
  setCerebroIATab: (tab: CerebroIATab) => void;
  setNegocioTab: (tab: NegocioTab) => void;
  setConfigTab: (tab: ConfigTab) => void;

  // Expandir/colapsar secciones
  toggleSectionExpanded: (section: MainSection) => void;
  setSectionExpanded: (section: MainSection, expanded: boolean) => void;

  toggleChatAssistant: () => void;
  toggleNotifications: () => void;
}

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      sidebarHovered: false,
      activeSection: 'inicio',
      activeMarketingTab: 'dashboard',

      // Sub-tabs por defecto
      activeInicioTab: 'resumen',
      activeOperacionesTab: 'envios',
      activeInteligenciaTab: 'analisis',
      activeCerebroIATab: 'asistente',
      activeNegocioTab: 'metricas',
      activeConfigTab: 'general',

      // Secciones expandidas
      expandedSections: [],

      showChatAssistant: false,
      showNotifications: false,

      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      collapseSidebar: () => set({ sidebarCollapsed: true }),
      expandSidebar: () => set({ sidebarCollapsed: false }),
      setHovered: (hovered) => set({ sidebarHovered: hovered }),

      setActiveSection: (section) => set((state) => {
        // Al cambiar de sección, expandir automáticamente
        const newExpanded = state.expandedSections.includes(section)
          ? state.expandedSections
          : [...state.expandedSections, section];
        return { activeSection: section, expandedSections: newExpanded };
      }),
      setMarketingTab: (tab) => set({ activeMarketingTab: tab }),

      // Sub-tab setters
      setInicioTab: (tab) => set({ activeInicioTab: tab }),
      setOperacionesTab: (tab) => set({ activeOperacionesTab: tab }),
      setInteligenciaTab: (tab) => set({ activeInteligenciaTab: tab }),
      setCerebroIATab: (tab) => set({ activeCerebroIATab: tab }),
      setNegocioTab: (tab) => set({ activeNegocioTab: tab }),
      setConfigTab: (tab) => set({ activeConfigTab: tab }),

      // Toggle expandir sección
      toggleSectionExpanded: (section) => set((state) => {
        const isExpanded = state.expandedSections.includes(section);
        return {
          expandedSections: isExpanded
            ? state.expandedSections.filter(s => s !== section)
            : [...state.expandedSections, section]
        };
      }),

      setSectionExpanded: (section, expanded) => set((state) => ({
        expandedSections: expanded
          ? [...state.expandedSections.filter(s => s !== section), section]
          : state.expandedSections.filter(s => s !== section)
      })),

      toggleChatAssistant: () => set((state) => ({ showChatAssistant: !state.showChatAssistant })),
      toggleNotifications: () => set((state) => ({ showNotifications: !state.showNotifications })),
    }),
    {
      name: 'litper-layout-store',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        activeSection: state.activeSection,
        expandedSections: state.expandedSections,
      }),
    }
  )
);

export default useLayoutStore;
