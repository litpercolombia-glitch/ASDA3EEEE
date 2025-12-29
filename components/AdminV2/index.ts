/**
 * AdminV2 - Chat-first Admin Panel
 *
 * Exports all components for the new admin panel
 */

// Main component
export { AdminPanelV2 } from './AdminPanelV2';
export { default } from './AdminPanelV2';

// Chat components
export { ChatInterface } from './chat/ChatInterface';

// Skills
export { SkillsRegistry } from './skills/SkillsRegistry';
export * from './skills/types';

// Hooks
export { useChat } from './hooks/useChat';

// Individual skills
export { TrackShipmentSkill } from './skills/logistics/TrackShipment.skill';
