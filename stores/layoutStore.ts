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

interface LayoutState {
  // Sidebar
  sidebarCollapsed: boolean;
  sidebarHovered: boolean;

  // Navegación
  activeSection: MainSection;
  activeMarketingTab: MarketingTab;

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
      showChatAssistant: false,
      showNotifications: false,

      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      collapseSidebar: () => set({ sidebarCollapsed: true }),
      expandSidebar: () => set({ sidebarCollapsed: false }),
      setHovered: (hovered) => set({ sidebarHovered: hovered }),

      setActiveSection: (section) => set({ activeSection: section }),
      setMarketingTab: (tab) => set({ activeMarketingTab: tab }),

      toggleChatAssistant: () => set((state) => ({ showChatAssistant: !state.showChatAssistant })),
      toggleNotifications: () => set((state) => ({ showNotifications: !state.showNotifications })),
    }),
    {
      name: 'litper-layout-store',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        activeSection: state.activeSection,
      }),
    }
  )
);

export default useLayoutStore;
