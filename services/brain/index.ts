// services/brain/index.ts
// Punto de entrada principal del Cerebro Central de Litper Pro

// ==================== TIPOS ====================
export * from './types/brain.types';

// ==================== CORE ====================
export { eventBus, EventBusService } from './core/EventBus';
export { memoryManager, MemoryManagerService } from './core/MemoryManager';
export { contextManager, ContextManagerService } from './core/ContextManager';
export { centralBrain, CentralBrainService } from './core/CentralBrain';

// ==================== UNIFICACIÓN ====================
export { dataUnifier } from './unification/DataUnifier';
export { shipmentMatcher, TrackingData, DropiData, MatchResult } from './unification/ShipmentMatcher';
export {
  SOURCE_PRIORITY,
  SOURCE_CONFIDENCE,
  getPrioritySource,
  getSourceConfidence,
  resolveBestValue,
  compareValues,
  shouldUpdate,
} from './unification/SourcePriority';

// ==================== JOURNEY ====================
export { journeyBuilder, ShipmentJourney } from './journey/JourneyBuilder';
export { eventCollector, CollectedEvents, RawEvent } from './journey/EventCollector';
export { locationTracker, LocationPoint, LocationHistory } from './journey/LocationTracker';
export { timelineGenerator, TimelineData, TimelineStep } from './journey/TimelineGenerator';

// ==================== CONOCIMIENTO ====================
export { knowledgeHub, KnowledgeReport } from './knowledge/KnowledgeHub';
export { patternDetector, PatternRule } from './knowledge/PatternDetector';
export { learningEngine, LearningModel, PredictionResult } from './knowledge/LearningEngine';

// ==================== DECISIONES ====================
export { decisionEngine, DecisionContext, DecisionRule, PendingDecision } from './decisions/DecisionEngine';
export { actionExecutor, ActionResult, ActionHandler } from './decisions/ActionExecutor';
export { predictionService, ShipmentPrediction, BulkPredictionReport } from './decisions/PredictionService';

// ==================== AUTOMATIZACIÓN ====================
export { rulesManager, RuleExecution } from './automation/RulesManager';
export { alertManager, Alert, AlertSeverity, AlertStatus, AlertFilter } from './automation/AlertManager';
export { insightsManager, InsightGenerator } from './automation/InsightsManager';

// ==================== INICIALIZACIÓN ====================

import { centralBrain } from './core/CentralBrain';
import { memoryManager } from './core/MemoryManager';
import { contextManager } from './core/ContextManager';
import { eventBus } from './core/EventBus';
import { knowledgeHub } from './knowledge/KnowledgeHub';
import { rulesManager } from './automation/RulesManager';
import { alertManager } from './automation/AlertManager';
import { insightsManager } from './automation/InsightsManager';

/**
 * Inicializar el Cerebro Central
 * Llamar esta función al inicio de la aplicación
 */
export function initializeBrain(config?: {
  userId?: string;
  userName?: string;
  autoAnalyze?: boolean;
}): void {
  console.log('🧠 Inicializando Cerebro Central de Litper Pro...');

  // Configurar usuario
  if (config?.userId || config?.userName) {
    contextManager.setUser({
      userId: config.userId,
      userName: config.userName,
    });
  }

  // Inicializar sesión
  contextManager.startSession();

  // Ejecutar análisis inicial si hay datos
  if (config?.autoAnalyze !== false) {
    const shipments = centralBrain.getShipments();
    if (shipments.length > 0) {
      console.log(`🔍 Analizando ${shipments.length} envíos...`);
      knowledgeHub.analyze();
      insightsManager.generateAllInsights();
    }
  }

  console.log('✅ Cerebro Central inicializado correctamente');
}

/**
 * Obtener estado general del cerebro
 */
export function getBrainStatus(): {
  isInitialized: boolean;
  totalShipments: number;
  activeAlerts: number;
  pendingDecisions: number;
  patterns: number;
  insights: number;
  memoryUsage: number;
  lastAnalysis: Date | null;
} {
  return {
    isInitialized: centralBrain.getState().isInitialized,
    totalShipments: centralBrain.getShipments().length,
    activeAlerts: alertManager.getActiveAlerts().length,
    pendingDecisions: centralBrain.getState().pendingDecisions,
    patterns: knowledgeHub.getPatterns().length,
    insights: insightsManager.getActiveInsights().length,
    memoryUsage: memoryManager.getStats().totalEntries,
    lastAnalysis: knowledgeHub.getLastAnalysisDate(),
  };
}

/**
 * Forzar análisis completo
 */
export function analyzeNow(): {
  patterns: number;
  insights: number;
  predictions: number;
} {
  const report = knowledgeHub.analyze();
  const insights = insightsManager.generateAllInsights();

  return {
    patterns: report.patterns.length,
    insights: insights.length,
    predictions: report.predictions.highRiskShipments,
  };
}

/**
 * Limpiar y reiniciar el cerebro
 */
export function resetBrain(): void {
  console.log('🔄 Reiniciando Cerebro Central...');
  memoryManager.clear();
  console.log('✅ Cerebro reiniciado');
}

// Export default
export default {
  // Core
  centralBrain,
  eventBus,
  memoryManager,
  contextManager,

  // Knowledge
  knowledgeHub,

  // Automation
  rulesManager,
  alertManager,
  insightsManager,

  // Functions
  initializeBrain,
  getBrainStatus,
  analyzeNow,
  resetBrain,
};
