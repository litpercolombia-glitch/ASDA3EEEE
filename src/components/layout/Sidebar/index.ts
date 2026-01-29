/**
 * Sidebar Components Index - LITPER PRO
 *
 * Exporta todos los componentes del sidebar profesional
 */

// Main component
export { Sidebar, MobileMenuButton } from './Sidebar';
export type { default as SidebarType } from './Sidebar';

// Header
export { SidebarHeader, WorkspaceSwitcher } from './SidebarHeader';

// Search
export { SidebarSearch, QuickFilters } from './SidebarSearch';

// Section
export { SidebarSection, SidebarDivider, SectionActions } from './SidebarSection';

// Item
export { SidebarItem, SidebarCompactItem } from './SidebarItem';

// Favorites
export { SidebarFavorites, AddToFavoritesButton } from './SidebarFavorites';

// Badge
export { SidebarBadge, SidebarBadgeGroup, StatusIndicator } from './SidebarBadge';
export type { BadgeVariant } from './SidebarBadge';

// Tooltip
export { SidebarTooltip, CollapsedTooltip } from './SidebarTooltip';

// User Menu
export { SidebarUserMenu } from './SidebarUserMenu';

// Command Palette
export { CommandPalette } from './CommandPalette';

// Hooks
export { useSidebarShortcuts, ShortcutBadge, useSidebarShortcutsHelp } from './useSidebarShortcuts';

// Re-export store
export {
  useSidebarStore,
  useSidebarCollapsed,
  useSidebarMobileOpen,
  useExpandedSections,
  useSidebarFavorites,
  useRecentItems,
  useActiveItem,
  useCommandPaletteOpen,
  useSidebarTheme,
} from '../../../stores/sidebarStore';

export type {
  SidebarSection as SidebarSectionType,
  SidebarFavorite,
  SidebarNotification,
  SidebarState,
} from '../../../stores/sidebarStore';
