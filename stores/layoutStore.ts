// stores/layoutStore.ts
// Estado del layout y sidebar - Simplificado a 5 secciones

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type MainSection =
  | 'inicio'
  | 'operaciones'
  | 'semaforo'
  | 'reportes'
  | 'config';

// Sub-tabs para cada sección
export type InicioTab = 'resumen' | 'ejecutivo';
export type OperacionesTab = 'envios' | 'tracking' | 'mapa';
export type ReportesTab = 'analisis' | 'reportes';
export type ConfigTab = 'general' | 'api-keys' | 'integraciones' | 'usuarios' | 'admin';

interface LayoutState {
  // Sidebar
  sidebarCollapsed: boolean;
  sidebarHovered: boolean;

  // Navegación
  activeSection: MainSection;

  // Sub-tabs activas
  activeInicioTab: InicioTab;
  activeOperacionesTab: OperacionesTab;
  activeReportesTab: ReportesTab;
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

  // Sub-tab actions
  setInicioTab: (tab: InicioTab) => void;
  setOperacionesTab: (tab: OperacionesTab) => void;
  setReportesTab: (tab: ReportesTab) => void;
  setConfigTab: (tab: ConfigTab) => void;

  // Expandir/colapsar secciones
  toggleSectionExpanded: (section: MainSection) => void;
  setSectionExpanded: (section: MainSection, expanded: boolean) => void;

  toggleChatAssistant: () => void;
  toggleNotifications: () => void;
}

// Valid sections for migration from old persisted state
const VALID_SECTIONS: MainSection[] = ['inicio', 'operaciones', 'semaforo', 'reportes', 'config'];

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      sidebarHovered: false,
      activeSection: 'inicio',

      // Sub-tabs por defecto
      activeInicioTab: 'resumen',
      activeOperacionesTab: 'envios',
      activeReportesTab: 'analisis',
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
        // Validate section (handles old persisted values)
        const validSection = VALID_SECTIONS.includes(section) ? section : 'inicio';
        const newExpanded = state.expandedSections.includes(validSection)
          ? state.expandedSections
          : [...state.expandedSections, validSection];
        return { activeSection: validSection, expandedSections: newExpanded };
      }),

      // Sub-tab setters
      setInicioTab: (tab) => set({ activeInicioTab: tab }),
      setOperacionesTab: (tab) => set({ activeOperacionesTab: tab }),
      setReportesTab: (tab) => set({ activeReportesTab: tab }),
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
      // Migration: if persisted activeSection is invalid, reset to 'inicio'
      merge: (persistedState: any, currentState) => {
        const merged = { ...currentState, ...persistedState };
        if (!VALID_SECTIONS.includes(merged.activeSection)) {
          merged.activeSection = 'inicio';
        }
        // Filter out old sections from expandedSections
        if (Array.isArray(merged.expandedSections)) {
          merged.expandedSections = merged.expandedSections.filter(
            (s: string) => VALID_SECTIONS.includes(s as MainSection)
          );
        }
        return merged;
      },
    }
  )
);

export default useLayoutStore;
