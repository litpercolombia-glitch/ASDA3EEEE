/**
 * MODULO DE INTELIGENCIA LOGISTICA
 *
 * Este modulo contiene todos los componentes relacionados con
 * analisis de inteligencia logistica.
 *
 * ESTRUCTURA:
 * /inteligencia
 * ├── index.ts                    # Este archivo (exports)
 * ├── InteligenciaTab.tsx         # Componente contenedor principal
 * ├── components/
 * │   ├── AnalyticsSummary.tsx    # Resumen de metricas
 * │   ├── PredictionPanel.tsx     # Panel de predicciones
 * │   ├── PatternDetection.tsx    # Deteccion de patrones
 * │   ├── DelayAnalysis.tsx       # Analisis de retrasos
 * │   └── SessionComparison.tsx   # Comparacion de sesiones
 * ├── hooks/
 * │   ├── useIntelligenceData.ts  # Hook para datos
 * │   └── useIntelligenceFilters.ts # Hook para filtros
 * └── types.ts                    # Tipos locales
 *
 * USO:
 * import { InteligenciaTab, AnalyticsSummary } from '@/components/features/inteligencia'
 */

// Componente principal (temporalmente redirige al original)
// TODO: Migrar InteligenciaLogisticaTab aqui y dividirlo
export { InteligenciaLogisticaTab as InteligenciaTab } from '../../tabs/InteligenciaLogisticaTab';

// Sub-componentes
export { default as AnalyticsSummary } from './components/AnalyticsSummary';
export { default as PredictionPanel } from './components/PredictionPanel';
export { default as PatternDetection } from './components/PatternDetection';
export { default as DelayAnalysis } from './components/DelayAnalysis';
export { default as SessionComparison } from './components/SessionComparison';

// Hooks
export { useIntelligenceData } from './hooks/useIntelligenceData';
export { useIntelligenceFilters } from './hooks/useIntelligenceFilters';

// Tipos
export * from './types';
