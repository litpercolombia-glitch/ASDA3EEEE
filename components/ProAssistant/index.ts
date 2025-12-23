// components/ProAssistant/index.ts
// Exportaciones del Asistente PRO
//
// NOTA: ProBubbleV4 es ahora la version principal y recomendada.
// Incluye Chat IA con modos estilo Claude.

// Version principal (usar esta)
export { default as ProBubbleV4 } from './ProBubbleV4';

// Alias para compatibilidad - apunta a V4
export { default as ProBubble } from './ProBubbleV4';

/**
 * @deprecated Usar ProBubbleV4 o ProBubble en su lugar
 */
export { default as ProBubbleV3 } from './ProBubbleV3';

/**
 * @deprecated Usar ProBubbleV4 o ProBubble en su lugar
 */
export { default as ProBubbleV2 } from './ProBubbleV2';

/**
 * @deprecated Usar ProBubbleV4 o ProBubble en su lugar
 */
export { default as ProBubbleLegacy } from './ProBubble';

// Chat IA Unificado con Modos
export { default as UnifiedChatIA } from '../chat/UnifiedChatIA';

// Componentes del panel
export { default as ProPanel } from './ProPanel';
export { default as ProChatTab } from './tabs/ProChatTab';
export { default as ProKnowledgeTab } from './tabs/ProKnowledgeTab';
export { default as ProTasksTab } from './tabs/ProTasksTab';
export { default as ProConfigTab } from './tabs/ProConfigTab';
