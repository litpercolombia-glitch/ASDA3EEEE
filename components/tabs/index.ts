// ============================================
// TABS PRINCIPALES - USAR ESTOS
// ============================================

// Navegacion (version consolidada)
export { TabNavigationNew as TabNavigation } from './TabNavigationNew';

// Semaforo (version consolidada)
export { SemaforoTabNew as SemaforoTab } from './SemaforoTabNew';

// Seguimiento
export { SeguimientoTab } from './SeguimientoTab';

// Predicciones y ML
export { PrediccionesTab } from './PrediccionesTab';
export { MLSystemTab } from './MLSystemTab';

// IA y Asistente
export { ReporteIATab } from './ReporteIATab';
export { AsistenteTab } from './AsistenteTab';
export { AprendizajeIATab } from './AprendizajeIATab';

// Logistica
export { InteligenciaLogisticaTab } from './InteligenciaLogisticaTab';
export { CiudadAgentesTab } from './CiudadAgentesTab';
export { DistritosIATab } from './DistritosIATab';
export { TrackingOrdenesTab } from './TrackingOrdenesTab';

// Funcionalidades
export { default as DemandTab } from './DemandTab';
export { default as GamificationTab } from './GamificationTab';
export { ProcesosLitperTab } from './ProcesosLitperTab';
export { MCPConnectionsTab } from './MCPConnectionsTab';
export { ConexionesTab } from './ConexionesTab';

// Tabs unificados
export { OperacionesUnificadoTab } from './OperacionesUnificadoTab';
export { InteligenciaIAUnificadoTab } from './InteligenciaIAUnificadoTab';
export { AnalisisUnificadoTab } from './AnalisisUnificadoTab';

// Centro de Negocio
export { CentroNegocioTab } from './CentroNegocioTab';

// ============================================
// LAZY LOADING - USAR PARA MEJOR PERFORMANCE
// ============================================

export {
  LazyTab,
  LazyTabRenderer,
  TabLoadingFallback,
  prefetchTab,
  prefetchTabs,
  prefetchAdjacentTabs,
  // Lazy component exports
  LazySeguimientoTab,
  LazySemaforoTab,
  LazyPrediccionesTab,
  LazyDemandTab,
  LazyMLSystemTab,
  LazyCentroNegocioTab,
  LazyProcesosLitperTab,
  LazyGamificationTab,
  LazyInteligenciaLogisticaTab,
  LazyAsistenteIAUnificado,
  LazyCiudadAgentesTab,
  LazyOperacionesUnificadoTab,
  LazyInteligenciaIAUnificadoTab,
  LazyAnalisisUnificadoTab,
} from './LazyTabs';

// ============================================
// DEPRECADOS - NO USAR
// ============================================

/**
 * @deprecated Usar TabNavigation en su lugar
 */
export { TabNavigationNew } from './TabNavigationNew';

/**
 * @deprecated Usar SemaforoTab en su lugar
 */
export { SemaforoTabNew } from './SemaforoTabNew';
