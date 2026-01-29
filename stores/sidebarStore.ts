/**
 * Sidebar Store - LITPER PRO
 *
 * Estado global del sidebar con persistencia en localStorage
 * Inspirado en Linear, Notion y Slack
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================
// TYPES
// ============================================

export type SidebarSection =
  | 'principal'
  | 'logistica'
  | 'finanzas'
  | 'crm'
  | 'configuracion';

export interface SidebarFavorite {
  id: string;
  type: 'page' | 'action' | 'search';
  label: string;
  icon: string;
  path?: string;
  action?: string;
  color?: string;
}

export interface RecentItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  timestamp: number;
}

export interface SidebarNotification {
  id: string;
  sectionId: SidebarSection;
  itemId: string;
  count?: number;
  type: 'error' | 'warning' | 'info' | 'success';
  pulse?: boolean;
}

export interface SidebarState {
  // Collapse state
  isCollapsed: boolean;
  isMobileOpen: boolean;

  // Sections
  expandedSections: SidebarSection[];

  // Favorites
  favorites: SidebarFavorite[];

  // Recent
  recentItems: RecentItem[];

  // Active item
  activeItemId: string | null;
  activeSectionId: SidebarSection | null;

  // Command palette
  isCommandPaletteOpen: boolean;

  // Notifications/Badges
  notifications: SidebarNotification[];

  // User preferences
  theme: 'light' | 'dark' | 'system';
  compactMode: boolean;

  // Actions
  toggleCollapsed: () => void;
  setCollapsed: (collapsed: boolean) => void;
  toggleMobileOpen: () => void;
  setMobileOpen: (open: boolean) => void;

  toggleSection: (section: SidebarSection) => void;
  expandSection: (section: SidebarSection) => void;
  collapseSection: (section: SidebarSection) => void;
  expandAllSections: () => void;
  collapseAllSections: () => void;

  addFavorite: (favorite: SidebarFavorite) => void;
  removeFavorite: (id: string) => void;
  reorderFavorites: (startIndex: number, endIndex: number) => void;
  isFavorite: (id: string) => boolean;

  addRecentItem: (item: Omit<RecentItem, 'timestamp'>) => void;
  clearRecentItems: () => void;

  setActiveItem: (itemId: string | null, sectionId?: SidebarSection | null) => void;

  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  toggleCommandPalette: () => void;

  addNotification: (notification: SidebarNotification) => void;
  removeNotification: (id: string) => void;
  clearNotifications: (sectionId?: SidebarSection) => void;
  getNotificationCount: (sectionId?: SidebarSection, itemId?: string) => number;

  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setCompactMode: (compact: boolean) => void;

  reset: () => void;
}

// ============================================
// DEFAULT STATE
// ============================================

const defaultState = {
  isCollapsed: false,
  isMobileOpen: false,
  expandedSections: ['principal', 'logistica'] as SidebarSection[],
  favorites: [] as SidebarFavorite[],
  recentItems: [] as RecentItem[],
  activeItemId: null as string | null,
  activeSectionId: null as SidebarSection | null,
  isCommandPaletteOpen: false,
  notifications: [
    { id: 'chat-badge', sectionId: 'principal' as SidebarSection, itemId: 'chat', count: 3, type: 'info' as const, pulse: true },
    { id: 'pedidos-badge', sectionId: 'principal' as SidebarSection, itemId: 'pedidos', count: 12, type: 'warning' as const },
  ] as SidebarNotification[],
  theme: 'dark' as const,
  compactMode: false,
};

// ============================================
// STORE
// ============================================

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set, get) => ({
      ...defaultState,

      // Collapse actions
      toggleCollapsed: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
      setCollapsed: (collapsed) => set({ isCollapsed: collapsed }),
      toggleMobileOpen: () => set((state) => ({ isMobileOpen: !state.isMobileOpen })),
      setMobileOpen: (open) => set({ isMobileOpen: open }),

      // Section actions
      toggleSection: (section) =>
        set((state) => ({
          expandedSections: state.expandedSections.includes(section)
            ? state.expandedSections.filter((s) => s !== section)
            : [...state.expandedSections, section],
        })),
      expandSection: (section) =>
        set((state) => ({
          expandedSections: state.expandedSections.includes(section)
            ? state.expandedSections
            : [...state.expandedSections, section],
        })),
      collapseSection: (section) =>
        set((state) => ({
          expandedSections: state.expandedSections.filter((s) => s !== section),
        })),
      expandAllSections: () =>
        set({
          expandedSections: ['principal', 'logistica', 'finanzas', 'crm', 'configuracion'],
        }),
      collapseAllSections: () => set({ expandedSections: [] }),

      // Favorites actions
      addFavorite: (favorite) =>
        set((state) => {
          if (state.favorites.some((f) => f.id === favorite.id)) {
            return state;
          }
          return { favorites: [...state.favorites, favorite] };
        }),
      removeFavorite: (id) =>
        set((state) => ({
          favorites: state.favorites.filter((f) => f.id !== id),
        })),
      reorderFavorites: (startIndex, endIndex) =>
        set((state) => {
          const result = Array.from(state.favorites);
          const [removed] = result.splice(startIndex, 1);
          result.splice(endIndex, 0, removed);
          return { favorites: result };
        }),
      isFavorite: (id) => get().favorites.some((f) => f.id === id),

      // Recent items actions
      addRecentItem: (item) =>
        set((state) => {
          const filtered = state.recentItems.filter((r) => r.id !== item.id);
          const newItem = { ...item, timestamp: Date.now() };
          return {
            recentItems: [newItem, ...filtered].slice(0, 10), // Keep last 10
          };
        }),
      clearRecentItems: () => set({ recentItems: [] }),

      // Active item
      setActiveItem: (itemId, sectionId = null) =>
        set({ activeItemId: itemId, activeSectionId: sectionId }),

      // Command palette
      openCommandPalette: () => set({ isCommandPaletteOpen: true }),
      closeCommandPalette: () => set({ isCommandPaletteOpen: false }),
      toggleCommandPalette: () =>
        set((state) => ({ isCommandPaletteOpen: !state.isCommandPaletteOpen })),

      // Notifications
      addNotification: (notification) =>
        set((state) => ({
          notifications: [
            ...state.notifications.filter((n) => n.id !== notification.id),
            notification,
          ],
        })),
      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),
      clearNotifications: (sectionId) =>
        set((state) => ({
          notifications: sectionId
            ? state.notifications.filter((n) => n.sectionId !== sectionId)
            : [],
        })),
      getNotificationCount: (sectionId, itemId) => {
        const { notifications } = get();
        return notifications
          .filter(
            (n) =>
              (!sectionId || n.sectionId === sectionId) &&
              (!itemId || n.itemId === itemId)
          )
          .reduce((sum, n) => sum + (n.count || 1), 0);
      },

      // Preferences
      setTheme: (theme) => set({ theme }),
      setCompactMode: (compact) => set({ compactMode: compact }),

      // Reset
      reset: () => set(defaultState),
    }),
    {
      name: 'litper-sidebar',
      partialize: (state) => ({
        isCollapsed: state.isCollapsed,
        expandedSections: state.expandedSections,
        favorites: state.favorites,
        recentItems: state.recentItems,
        theme: state.theme,
        compactMode: state.compactMode,
      }),
    }
  )
);

// ============================================
// SELECTORS
// ============================================

export const useSidebarCollapsed = () => useSidebarStore((s) => s.isCollapsed);
export const useSidebarMobileOpen = () => useSidebarStore((s) => s.isMobileOpen);
export const useExpandedSections = () => useSidebarStore((s) => s.expandedSections);
export const useSidebarFavorites = () => useSidebarStore((s) => s.favorites);
export const useRecentItems = () => useSidebarStore((s) => s.recentItems);
export const useActiveItem = () =>
  useSidebarStore((s) => ({ itemId: s.activeItemId, sectionId: s.activeSectionId }));
export const useCommandPaletteOpen = () => useSidebarStore((s) => s.isCommandPaletteOpen);
export const useSidebarTheme = () => useSidebarStore((s) => s.theme);

export default useSidebarStore;
