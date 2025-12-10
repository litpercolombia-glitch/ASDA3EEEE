/**
 * Índice de componentes ML para Litper Logística
 * Exporta todos los componentes del sistema de Machine Learning
 */

export { PredictorRetrasos } from './PredictorRetrasos';
export { ChatInteligente } from './ChatInteligente';
export { DashboardML } from './DashboardML';
export { ExcelUploaderML } from './ExcelUploaderML';

// Re-exportar todo como default para imports más simples
export default {
  PredictorRetrasos: () => import('./PredictorRetrasos'),
  ChatInteligente: () => import('./ChatInteligente'),
  DashboardML: () => import('./DashboardML'),
  ExcelUploaderML: () => import('./ExcelUploaderML'),
};
