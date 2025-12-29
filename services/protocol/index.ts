/**
 * Protocol Module - PR #3
 *
 * Decision engine for business protocols.
 * Evaluates guides and creates ActionPlans.
 */

export { ProtocolEngine } from './ProtocolEngine';
export { DryRunSimulator } from './DryRunSimulator';
export { NoMovement48HProtocol, AtOffice3DProtocol } from './protocols';

// Re-export types
export type {
  Protocol,
  ProtocolTrigger,
  ProtocolInput,
  ProtocolEvaluationResult,
  ActionPlan,
  PlannedAction,
  ActionPriority,
  BatchProtocolResult,
} from '../../types/protocol.types';

export type {
  DryRunReport,
  DryRunGuideResult,
  DryRunConfig,
} from '../../types/dryrun.types';

export { buildActionPlanKey } from '../../types/protocol.types';
