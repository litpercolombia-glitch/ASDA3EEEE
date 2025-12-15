// components/ProAssistant/index.ts
// Exportaciones del Asistente PRO
//
// NOTA: ProBubbleV3 es ahora la version principal y recomendada.
// ProBubble y ProBubbleV2 estan deprecados y seran eliminados en futuras versiones.

// Version principal (usar esta)
export { default as ProBubbleV3 } from './ProBubbleV3';

// Alias para compatibilidad - apunta a V3
export { default as ProBubble } from './ProBubbleV3';

/**
 * @deprecated Usar ProBubbleV3 o ProBubble en su lugar
 */
export { default as ProBubbleV2 } from './ProBubbleV2';

/**
 * @deprecated Usar ProBubbleV3 o ProBubble en su lugar
 */
export { default as ProBubbleLegacy } from './ProBubble';

// Componentes del panel
export { default as ProPanel } from './ProPanel';
export { default as ProChatTab } from './tabs/ProChatTab';
export { default as ProKnowledgeTab } from './tabs/ProKnowledgeTab';
export { default as ProTasksTab } from './tabs/ProTasksTab';
export { default as ProConfigTab } from './tabs/ProConfigTab';
