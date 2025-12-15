/**
 * UI STORE
 *
 * Store centralizado para estado de la interfaz de usuario.
 * Maneja navegacion, tema, sidebar, modales, etc.
 *
 * USO:
 * import { useUIStore } from '@/stores/uiStore'
 *
 * const { activeTab, setActiveTab, theme, toggleTheme } = useUIStore()
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { STORAGE_KEYS } from '../constants';

// ============================================
// TIPOS
// ============================================

export type Theme = 'light' | 'dark' | 'system';
export type TabId = string;

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface ModalConfig {
  id: string;
  component: string;
  props?: Record<string, unknown>;
  onClose?: () => void;
}

interface UIState {
  // Navigation
  activeTab: TabId;
  previousTab: TabId | null;
  tabHistory: TabId[];

  // Sidebar
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;

  // Theme
  theme: Theme;

  // Modals
  activeModals: ModalConfig[];

  // Notifications
  notifications: Notification[];

  // Global Loading
  globalLoading: boolean;
  loadingMessage: string | null;

  // Mobile
  isMobile: boolean;
  mobileMenuOpen: boolean;

  // Search
  searchOpen: boolean;
  searchQuery: string;

  // Actions - Navigation
  setActiveTab: (tab: TabId) => void;
  goBack: () => void;
  goToTab: (tab: TabId) => void;

  // Actions - Sidebar
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebarCollapse: () => void;

  // Actions - Theme
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;

  // Actions - Modals
  openModal: (config: ModalConfig) => void;
  closeModal: (id: string) => void;
  closeAllModals: () => void;

  // Actions - Notifications
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;

  // Actions - Loading
  setGlobalLoading: (loading: boolean, message?: string) => void;

  // Actions - Mobile
  setIsMobile: (isMobile: boolean) => void;
  toggleMobileMenu: () => void;

  // Actions - Search
  toggleSearch: () => void;
  setSearchQuery: (query: string) => void;
  closeSearch: () => void;
}

// ============================================
// HELPERS
// ============================================

const generateId = () => Math.random().toString(36).substring(2, 9);

// ============================================
// STORE
// ============================================

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      // Initial State
      activeTab: 'seguimiento',
      previousTab: null,
      tabHistory: [],
      sidebarOpen: true,
      sidebarCollapsed: false,
      theme: 'dark',
      activeModals: [],
      notifications: [],
      globalLoading: false,
      loadingMessage: null,
      isMobile: false,
      mobileMenuOpen: false,
      searchOpen: false,
      searchQuery: '',

      // Actions - Navigation
      setActiveTab: (tab) =>
        set((state) => ({
          activeTab: tab,
          previousTab: state.activeTab,
          tabHistory: [...state.tabHistory.slice(-9), state.activeTab],
        })),

      goBack: () =>
        set((state) => {
          if (state.tabHistory.length === 0) return state;
          const previousTab = state.tabHistory[state.tabHistory.length - 1];
          return {
            activeTab: previousTab,
            previousTab: state.activeTab,
            tabHistory: state.tabHistory.slice(0, -1),
          };
        }),

      goToTab: (tab) => {
        get().setActiveTab(tab);
      },

      // Actions - Sidebar
      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      toggleSidebarCollapse: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      // Actions - Theme
      setTheme: (theme) => {
        set({ theme });
        // Apply theme to document
        if (typeof document !== 'undefined') {
          const root = document.documentElement;
          root.classList.remove('light', 'dark');
          if (theme === 'system') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
              ? 'dark'
              : 'light';
            root.classList.add(systemTheme);
          } else {
            root.classList.add(theme);
          }
        }
      },

      toggleTheme: () =>
        set((state) => {
          const newTheme = state.theme === 'dark' ? 'light' : 'dark';
          // Apply theme
          if (typeof document !== 'undefined') {
            document.documentElement.classList.remove('light', 'dark');
            document.documentElement.classList.add(newTheme);
          }
          return { theme: newTheme };
        }),

      // Actions - Modals
      openModal: (config) =>
        set((state) => ({
          activeModals: [...state.activeModals, { ...config, id: config.id || generateId() }],
        })),

      closeModal: (id) =>
        set((state) => {
          const modal = state.activeModals.find((m) => m.id === id);
          modal?.onClose?.();
          return {
            activeModals: state.activeModals.filter((m) => m.id !== id),
          };
        }),

      closeAllModals: () =>
        set((state) => {
          state.activeModals.forEach((m) => m.onClose?.());
          return { activeModals: [] };
        }),

      // Actions - Notifications
      addNotification: (notification) => {
        const id = generateId();
        const duration = notification.duration ?? 5000;

        set((state) => ({
          notifications: [
            ...state.notifications,
            { ...notification, id },
          ],
        }));

        // Auto-remove after duration
        if (duration > 0) {
          setTimeout(() => {
            get().removeNotification(id);
          }, duration);
        }
      },

      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),

      clearNotifications: () => set({ notifications: [] }),

      // Actions - Loading
      setGlobalLoading: (loading, message) =>
        set({
          globalLoading: loading,
          loadingMessage: loading ? message || null : null,
        }),

      // Actions - Mobile
      setIsMobile: (isMobile) =>
        set({
          isMobile,
          sidebarOpen: !isMobile,
        }),

      toggleMobileMenu: () =>
        set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen })),

      // Actions - Search
      toggleSearch: () =>
        set((state) => ({
          searchOpen: !state.searchOpen,
          searchQuery: state.searchOpen ? '' : state.searchQuery,
        })),

      setSearchQuery: (query) => set({ searchQuery: query }),

      closeSearch: () => set({ searchOpen: false, searchQuery: '' }),
    }),
    {
      name: STORAGE_KEYS.VIEW_PREFERENCES,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        activeTab: state.activeTab,
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);

// ============================================
// CONVENIENCE HOOKS
// ============================================

export const useActiveTab = () => useUIStore((state) => state.activeTab);
export const useTheme = () => useUIStore((state) => state.theme);
export const useSidebar = () =>
  useUIStore((state) => ({
    open: state.sidebarOpen,
    collapsed: state.sidebarCollapsed,
    toggle: state.toggleSidebar,
    toggleCollapse: state.toggleSidebarCollapse,
  }));

export default useUIStore;
