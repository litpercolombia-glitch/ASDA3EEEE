/**
 * SISTEMA DE AYUDA CONTEXTUAL
 * ============================
 *
 * Exporta todos los componentes del sistema de ayuda.
 *
 * EJEMPLO DE USO:
 *
 * import { HelpTooltip, HelpBadge, InfoBadge, helpContent } from '@/components/HelpSystem';
 *
 * <HelpTooltip
 *   {...helpContent.cargarArchivo}
 * >
 *   <button>Cargar</button>
 * </HelpTooltip>
 */

// Componentes principales
export { default as HelpTooltip, HelpBadge, InfoBadge, TipBadge } from './HelpTooltip';
export type { HelpTooltipProps } from './HelpTooltip';

// Contenido de ayuda predefinido
export { helpContent, getHelpForSection } from './helpContent';
