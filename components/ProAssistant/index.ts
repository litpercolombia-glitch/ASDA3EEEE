// components/ProAssistant/index.ts
// Exportaciones del Asistente PRO
//
// ProBubbleV4 es la version principal.

// Version principal
export { default as ProBubbleV4 } from './ProBubbleV4';

// Alias para compatibilidad - apunta a V4
export { default as ProBubble } from './ProBubbleV4';

// Chat IA Unificado con Modos
export { default as UnifiedChatIA } from '../chat/UnifiedChatIA';

// Componentes del panel
export { default as ProPanel } from './ProPanel';
export { default as ProChatTab } from './tabs/ProChatTab';
export { default as ProKnowledgeTab } from './tabs/ProKnowledgeTab';
export { default as ProTasksTab } from './tabs/ProTasksTab';
export { default as ProConfigTab } from './tabs/ProConfigTab';
