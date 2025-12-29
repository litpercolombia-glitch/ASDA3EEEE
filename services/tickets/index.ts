/**
 * Tickets Service Exports - PR #5
 */

export { TicketService } from './TicketService';
export { TicketRules } from './TicketRules';
export type {
  Ticket,
  TicketTrigger,
  TicketPriority,
  TicketStatus,
  TicketMetadata,
  TicketTimelineEntry,
  CreateTicketParams,
  UpdateTicketParams,
  TicketQuery,
  TicketStats,
} from '../../types/ticket.types';
