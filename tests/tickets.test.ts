/**
 * Tests for Ticket System - PR #5
 *
 * Tests:
 * - Ticket creation by FAILED_4xx
 * - Ticket creation by 5xx retries
 * - No duplicate tickets if already OPEN
 * - Ticket for "still stuck after contact"
 * - PII sanitization
 */

import { describe, it, expect, beforeEach } from 'vitest';

// =====================================================
// TICKET SERVICE TESTS
// =====================================================

describe('TicketService', () => {
  let TicketService: typeof import('../services/tickets/TicketService').TicketService;

  beforeEach(async () => {
    const module = await import('../services/tickets/TicketService');
    TicketService = module.TicketService;
    TicketService.clear();
  });

  describe('createTicket', () => {
    it('should create a new ticket with correct fields', () => {
      const ticket = TicketService.createTicket({
        guia: 'GUIA123',
        trigger: 'FAILED_4XX',
        priority: 'alta',
        metadata: {
          ciudad_de_destino: 'Bogota',
          transportadora: 'Servientrega',
          failureCode: 400,
        },
        actionRefs: ['act_123'],
        initialNote: 'Test ticket',
      });

      expect(ticket.ticketId).toMatch(/^tkt_/);
      expect(ticket.guia).toBe('GUIA123');
      expect(ticket.trigger).toBe('FAILED_4XX');
      expect(ticket.priority).toBe('alta');
      expect(ticket.status).toBe('OPEN');
      expect(ticket.metadata.ciudad_de_destino).toBe('Bogota');
      expect(ticket.actionRefs).toContain('act_123');
      expect(ticket.timeline).toHaveLength(1);
      expect(ticket.timeline[0].action).toBe('TICKET_CREATED');
    });

    it('should NOT duplicate ticket if OPEN exists for same guia+trigger', () => {
      // Create first ticket
      const ticket1 = TicketService.createTicket({
        guia: 'GUIA123',
        trigger: 'FAILED_4XX',
        priority: 'alta',
        metadata: {},
        actionRefs: ['act_1'],
      });

      // Try to create duplicate
      const ticket2 = TicketService.createTicket({
        guia: 'GUIA123',
        trigger: 'FAILED_4XX',
        priority: 'alta',
        metadata: {},
        actionRefs: ['act_2'],
      });

      // Should return same ticket
      expect(ticket2.ticketId).toBe(ticket1.ticketId);

      // Should have added timeline entry
      expect(ticket2.timeline).toHaveLength(2);
      expect(ticket2.timeline[1].action).toBe('DUPLICATE_TRIGGER_RECEIVED');

      // Should have merged actionRefs
      expect(ticket2.actionRefs).toContain('act_1');
      expect(ticket2.actionRefs).toContain('act_2');
    });

    it('should allow different triggers for same guia', () => {
      const ticket1 = TicketService.createTicket({
        guia: 'GUIA123',
        trigger: 'FAILED_4XX',
        priority: 'alta',
        metadata: {},
      });

      const ticket2 = TicketService.createTicket({
        guia: 'GUIA123',
        trigger: 'FAILED_5XX_RETRIES',
        priority: 'media',
        metadata: {},
      });

      expect(ticket1.ticketId).not.toBe(ticket2.ticketId);
      expect(TicketService.getStats().total).toBe(2);
    });
  });

  describe('PII sanitization', () => {
    it('should sanitize phone numbers in metadata', () => {
      const ticket = TicketService.createTicket({
        guia: 'GUIA123',
        trigger: 'FAILED_4XX',
        priority: 'alta',
        metadata: {
          failureReason: 'Invalid phone +573001234567',
          ciudad_de_destino: 'Bogota',
        } as any,
      });

      expect(ticket.metadata.failureReason).toBe('Invalid phone [REDACTED]');
      expect(ticket.metadata.ciudad_de_destino).toBe('Bogota');
    });

    it('should NOT store clear phone, only phoneHash', () => {
      const ticket = TicketService.createTicket({
        guia: 'GUIA123',
        trigger: 'FAILED_4XX',
        priority: 'alta',
        metadata: {
          phoneHash: 'ph_abc123',
          // phone field should not exist in type, but test sanitization
        },
      });

      const jsonStr = JSON.stringify(ticket);
      expect(jsonStr).not.toMatch(/\+?\d{10,15}/);
      expect(ticket.metadata.phoneHash).toBe('ph_abc123');
    });
  });

  describe('updateTicket', () => {
    it('should update status and add timeline entry', () => {
      const ticket = TicketService.createTicket({
        guia: 'GUIA123',
        trigger: 'FAILED_4XX',
        priority: 'alta',
        metadata: {},
      });

      const updated = TicketService.updateTicket(ticket.ticketId, {
        status: 'IN_PROGRESS',
      });

      expect(updated?.status).toBe('IN_PROGRESS');
      expect(updated?.timeline.length).toBeGreaterThan(1);
    });

    it('should track resolvedAt when RESOLVED', () => {
      const ticket = TicketService.createTicket({
        guia: 'GUIA123',
        trigger: 'FAILED_4XX',
        priority: 'alta',
        metadata: {},
      });

      const updated = TicketService.updateTicket(ticket.ticketId, {
        status: 'RESOLVED',
        resolutionNotes: 'Fixed by updating phone number',
      });

      expect(updated?.status).toBe('RESOLVED');
      expect(updated?.resolvedAt).toBeDefined();
      expect(updated?.resolutionNotes).toBe('Fixed by updating phone number');
    });

    it('should remove from open index when CLOSED', () => {
      const ticket = TicketService.createTicket({
        guia: 'GUIA123',
        trigger: 'FAILED_4XX',
        priority: 'alta',
        metadata: {},
      });

      expect(TicketService.hasOpenTicket('GUIA123', 'FAILED_4XX')).toBe(true);

      TicketService.updateTicket(ticket.ticketId, { status: 'CLOSED' });

      expect(TicketService.hasOpenTicket('GUIA123', 'FAILED_4XX')).toBe(false);

      // Now can create new ticket for same guia+trigger
      const newTicket = TicketService.createTicket({
        guia: 'GUIA123',
        trigger: 'FAILED_4XX',
        priority: 'alta',
        metadata: {},
      });

      expect(newTicket.ticketId).not.toBe(ticket.ticketId);
    });
  });

  describe('queryTickets', () => {
    beforeEach(() => {
      // Create various tickets
      TicketService.createTicket({
        guia: 'GUIA1',
        trigger: 'FAILED_4XX',
        priority: 'alta',
        metadata: {},
      });
      TicketService.createTicket({
        guia: 'GUIA2',
        trigger: 'FAILED_5XX_RETRIES',
        priority: 'media',
        metadata: {},
      });
      TicketService.createTicket({
        guia: 'GUIA3',
        trigger: 'AT_OFFICE_STILL',
        priority: 'alta',
        metadata: {},
      });
    });

    it('should filter by status', () => {
      const openTickets = TicketService.queryTickets({ status: 'OPEN' });
      expect(openTickets).toHaveLength(3);
    });

    it('should filter by trigger', () => {
      const failed4xx = TicketService.queryTickets({ trigger: 'FAILED_4XX' });
      expect(failed4xx).toHaveLength(1);
      expect(failed4xx[0].guia).toBe('GUIA1');
    });

    it('should filter by priority', () => {
      const alta = TicketService.queryTickets({ priority: 'alta' });
      expect(alta).toHaveLength(2);
    });

    it('should sort by priority then date', () => {
      const all = TicketService.queryTickets({});
      // alta priority should come first
      expect(all[0].priority).toBe('alta');
      expect(all[1].priority).toBe('alta');
      expect(all[2].priority).toBe('media');
    });
  });

  describe('getStats', () => {
    it('should return correct statistics', () => {
      TicketService.createTicket({
        guia: 'GUIA1',
        trigger: 'FAILED_4XX',
        priority: 'alta',
        metadata: {},
      });
      TicketService.createTicket({
        guia: 'GUIA2',
        trigger: 'FAILED_5XX_RETRIES',
        priority: 'media',
        metadata: {},
      });

      const stats = TicketService.getStats();

      expect(stats.total).toBe(2);
      expect(stats.openCount).toBe(2);
      expect(stats.byStatus.OPEN).toBe(2);
      expect(stats.byTrigger.FAILED_4XX).toBe(1);
      expect(stats.byTrigger.FAILED_5XX_RETRIES).toBe(1);
      expect(stats.byPriority.alta).toBe(1);
      expect(stats.byPriority.media).toBe(1);
    });
  });
});

// =====================================================
// TICKET RULES TESTS
// =====================================================

describe('TicketRules', () => {
  let TicketRules: typeof import('../services/tickets/TicketRules').TicketRules;
  let TicketService: typeof import('../services/tickets/TicketService').TicketService;

  beforeEach(async () => {
    const rulesModule = await import('../services/tickets/TicketRules');
    const serviceModule = await import('../services/tickets/TicketService');
    TicketRules = rulesModule.TicketRules;
    TicketService = serviceModule.TicketService;
    TicketService.clear();
  });

  describe('onFailed4xx', () => {
    it('should create ticket for 4xx SEND_WHATSAPP failure', () => {
      const actionLog = {
        id: 'act_123',
        actionType: 'SEND_WHATSAPP' as const,
        guia: 'GUIA123',
        idempotencyKey: 'key',
        status: 'FAILED' as const,
        actor: 'system' as const,
        createdAt: new Date(),
        metadata: {
          city: 'Bogota',
          carrier: 'Servientrega',
        },
      };

      const ticket = TicketRules.onFailed4xx({
        actionLog,
        httpCode: 400,
        errorMessage: 'Invalid phone number',
      });

      expect(ticket).not.toBeNull();
      expect(ticket?.trigger).toBe('FAILED_4XX');
      expect(ticket?.priority).toBe('alta');
      expect(ticket?.metadata.failureCode).toBe(400);
    });

    it('should NOT create ticket for 5xx error', () => {
      const actionLog = {
        id: 'act_123',
        actionType: 'SEND_WHATSAPP' as const,
        guia: 'GUIA123',
        idempotencyKey: 'key',
        status: 'FAILED' as const,
        actor: 'system' as const,
        createdAt: new Date(),
      };

      const ticket = TicketRules.onFailed4xx({
        actionLog,
        httpCode: 500,
      });

      expect(ticket).toBeNull();
    });

    it('should NOT create ticket for non-SEND_WHATSAPP action', () => {
      const actionLog = {
        id: 'act_123',
        actionType: 'CREATE_TICKET' as const,
        guia: 'GUIA123',
        idempotencyKey: 'key',
        status: 'FAILED' as const,
        actor: 'system' as const,
        createdAt: new Date(),
      };

      const ticket = TicketRules.onFailed4xx({
        actionLog,
        httpCode: 400,
      });

      expect(ticket).toBeNull();
    });
  });

  describe('onFailed5xxRetries', () => {
    it('should create ticket after 2+ retries', () => {
      const actionLog = {
        id: 'act_123',
        actionType: 'SEND_WHATSAPP' as const,
        guia: 'GUIA123',
        idempotencyKey: 'key',
        status: 'FAILED' as const,
        actor: 'system' as const,
        createdAt: new Date(),
        retryCount: 2,
      };

      const ticket = TicketRules.onFailed5xxRetries({
        actionLog,
        httpCode: 503,
        retryCount: 2,
      });

      expect(ticket).not.toBeNull();
      expect(ticket?.trigger).toBe('FAILED_5XX_RETRIES');
      expect(ticket?.priority).toBe('media');
    });

    it('should set alta priority after 3+ retries', () => {
      const actionLog = {
        id: 'act_123',
        actionType: 'SEND_WHATSAPP' as const,
        guia: 'GUIA123',
        idempotencyKey: 'key',
        status: 'FAILED' as const,
        actor: 'system' as const,
        createdAt: new Date(),
        retryCount: 3,
      };

      const ticket = TicketRules.onFailed5xxRetries({
        actionLog,
        httpCode: 500,
        retryCount: 3,
      });

      expect(ticket?.priority).toBe('alta');
    });

    it('should NOT create ticket before 2 retries', () => {
      const actionLog = {
        id: 'act_123',
        actionType: 'SEND_WHATSAPP' as const,
        guia: 'GUIA123',
        idempotencyKey: 'key',
        status: 'FAILED' as const,
        actor: 'system' as const,
        createdAt: new Date(),
        retryCount: 1,
      };

      const ticket = TicketRules.onFailed5xxRetries({
        actionLog,
        httpCode: 500,
        retryCount: 1,
      });

      expect(ticket).toBeNull();
    });
  });

  describe('onAtOfficeStillStuck', () => {
    it('should create ticket 48h after contact with no movement', () => {
      const contactTime = new Date(Date.now() - 49 * 60 * 60 * 1000); // 49h ago

      const ticket = TicketRules.onAtOfficeStillStuck({
        guia: 'GUIA123',
        trigger: 'AT_OFFICE_STILL',
        lastSuccessfulContactAt: contactTime,
        lastMovementAt: undefined,
        metadata: {
          ciudad_de_destino: 'Bogota',
          estatus: 'AT_OFFICE',
        },
        eventRefs: ['evt_1'],
        actionRefs: ['act_1'],
      });

      expect(ticket).not.toBeNull();
      expect(ticket?.trigger).toBe('AT_OFFICE_STILL');
      expect(ticket?.priority).toBe('alta');
    });

    it('should NOT create ticket if movement occurred after contact', () => {
      const contactTime = new Date(Date.now() - 49 * 60 * 60 * 1000); // 49h ago
      const movementTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24h ago

      const ticket = TicketRules.onAtOfficeStillStuck({
        guia: 'GUIA123',
        trigger: 'AT_OFFICE_STILL',
        lastSuccessfulContactAt: contactTime,
        lastMovementAt: movementTime,
        metadata: {},
        eventRefs: [],
        actionRefs: [],
      });

      expect(ticket).toBeNull();
    });

    it('should NOT create ticket before 48h', () => {
      const contactTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24h ago

      const ticket = TicketRules.onAtOfficeStillStuck({
        guia: 'GUIA123',
        trigger: 'AT_OFFICE_STILL',
        lastSuccessfulContactAt: contactTime,
        metadata: {},
        eventRefs: [],
        actionRefs: [],
      });

      expect(ticket).toBeNull();
    });
  });

  describe('processFailedAction', () => {
    it('should route to correct rule based on HTTP code', () => {
      const actionLog = {
        id: 'act_123',
        actionType: 'SEND_WHATSAPP' as const,
        guia: 'GUIA123',
        idempotencyKey: 'key',
        status: 'FAILED' as const,
        actor: 'system' as const,
        createdAt: new Date(),
        retryCount: 0,
      };

      // 4xx should create immediate ticket
      const ticket4xx = TicketRules.processFailedAction(actionLog, 400, 'Bad request');
      expect(ticket4xx?.trigger).toBe('FAILED_4XX');

      // Clear for next test
      TicketService.clear();

      // 5xx with low retries should not create ticket
      const ticket5xxLow = TicketRules.processFailedAction(
        { ...actionLog, retryCount: 1 },
        500,
        'Server error'
      );
      expect(ticket5xxLow).toBeNull();

      // 5xx with 2+ retries should create ticket
      const ticket5xxHigh = TicketRules.processFailedAction(
        { ...actionLog, retryCount: 2 },
        500,
        'Server error'
      );
      expect(ticket5xxHigh?.trigger).toBe('FAILED_5XX_RETRIES');
    });
  });
});

// =====================================================
// INTEGRATION TESTS
// =====================================================

describe('Ticket System Integration', () => {
  let TicketService: typeof import('../services/tickets/TicketService').TicketService;
  let TicketRules: typeof import('../services/tickets/TicketRules').TicketRules;

  beforeEach(async () => {
    const serviceModule = await import('../services/tickets/TicketService');
    const rulesModule = await import('../services/tickets/TicketRules');
    TicketService = serviceModule.TicketService;
    TicketRules = rulesModule.TicketRules;
    TicketService.clear();
  });

  it('should handle full ticket lifecycle', () => {
    // 1. Create ticket from failure
    const actionLog = {
      id: 'act_123',
      actionType: 'SEND_WHATSAPP' as const,
      guia: 'GUIA123',
      idempotencyKey: 'key',
      status: 'FAILED' as const,
      actor: 'system' as const,
      createdAt: new Date(),
      metadata: {
        city: 'Bogota',
      },
    };

    const ticket = TicketRules.processFailedAction(actionLog, 400, 'Invalid phone');
    expect(ticket?.status).toBe('OPEN');

    // 2. Update to IN_PROGRESS
    const inProgress = TicketService.updateTicket(ticket!.ticketId, {
      status: 'IN_PROGRESS',
    });
    expect(inProgress?.status).toBe('IN_PROGRESS');

    // 3. Resolve with notes
    const resolved = TicketService.updateTicket(ticket!.ticketId, {
      status: 'RESOLVED',
      resolutionNotes: 'Updated phone number in database',
    });
    expect(resolved?.status).toBe('RESOLVED');
    expect(resolved?.resolvedAt).toBeDefined();

    // 4. Close
    const closed = TicketService.updateTicket(ticket!.ticketId, {
      status: 'CLOSED',
    });
    expect(closed?.status).toBe('CLOSED');
    expect(closed?.closedAt).toBeDefined();

    // 5. Verify timeline has all actions
    expect(closed?.timeline.length).toBeGreaterThanOrEqual(4);

    // 6. Stats should show 1 closed ticket
    const stats = TicketService.getStats();
    expect(stats.byStatus.CLOSED).toBe(1);
    expect(stats.openCount).toBe(0);
  });

  it('should prevent duplicate tickets during concurrent failures', () => {
    const actionLog1 = {
      id: 'act_1',
      actionType: 'SEND_WHATSAPP' as const,
      guia: 'GUIA123',
      idempotencyKey: 'key1',
      status: 'FAILED' as const,
      actor: 'system' as const,
      createdAt: new Date(),
    };

    const actionLog2 = {
      id: 'act_2',
      actionType: 'SEND_WHATSAPP' as const,
      guia: 'GUIA123',
      idempotencyKey: 'key2',
      status: 'FAILED' as const,
      actor: 'system' as const,
      createdAt: new Date(),
    };

    // Simulate concurrent failures
    const ticket1 = TicketRules.processFailedAction(actionLog1, 400, 'Error 1');
    const ticket2 = TicketRules.processFailedAction(actionLog2, 400, 'Error 2');

    // Should be same ticket
    expect(ticket1?.ticketId).toBe(ticket2?.ticketId);

    // Should have both action refs
    expect(ticket2?.actionRefs).toContain('act_1');
    expect(ticket2?.actionRefs).toContain('act_2');

    // Only 1 ticket total
    expect(TicketService.getStats().total).toBe(1);
  });
});
