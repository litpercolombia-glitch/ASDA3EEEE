/**
 * Tests for Command Center & Admin Auth - PR #7
 *
 * Tests:
 * - Admin auth: 401 sin ADMIN_SECRET
 * - Endpoints funcionan con ADMIN_SECRET
 * - Command Center carga datos sin romper
 * - RiskFlags dinámico funciona
 * - Rollout control funciona
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// =====================================================
// ADMIN AUTH TESTS
// =====================================================

describe('AdminAuth', () => {
  let validateAdminAuth: typeof import('../services/auth/AdminAuth').validateAdminAuth;
  let validateCronAuth: typeof import('../services/auth/AdminAuth').validateCronAuth;

  beforeEach(async () => {
    // Reset modules
    vi.resetModules();

    const module = await import('../services/auth/AdminAuth');
    validateAdminAuth = module.validateAdminAuth;
    validateCronAuth = module.validateCronAuth;
  });

  describe('validateAdminAuth', () => {
    it('should return valid:false when no Authorization header', () => {
      const mockReq = {
        headers: {},
      } as any;

      const result = validateAdminAuth(mockReq);

      expect(result.valid).toBe(false);
      expect(result.method).toBe('none');
      expect(result.error).toContain('Authorization header required');
    });

    it('should return valid:false when wrong scheme', () => {
      const mockReq = {
        headers: {
          authorization: 'Basic abc123',
        },
      } as any;

      const result = validateAdminAuth(mockReq);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid authorization format');
    });

    it('should return valid:false when token is wrong', () => {
      // Set env
      process.env.ADMIN_SECRET = 'correct-secret';

      const mockReq = {
        headers: {
          authorization: 'Bearer wrong-secret',
        },
      } as any;

      const result = validateAdminAuth(mockReq);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid token');

      delete process.env.ADMIN_SECRET;
    });

    it('should return valid:true when token matches ADMIN_SECRET', () => {
      process.env.ADMIN_SECRET = 'my-admin-secret';

      const mockReq = {
        headers: {
          authorization: 'Bearer my-admin-secret',
        },
      } as any;

      const result = validateAdminAuth(mockReq);

      expect(result.valid).toBe(true);
      expect(result.method).toBe('bearer');

      delete process.env.ADMIN_SECRET;
    });

    it('should fall back to CRON_SECRET if ADMIN_SECRET not set', () => {
      delete process.env.ADMIN_SECRET;
      process.env.CRON_SECRET = 'cron-secret-fallback';

      const mockReq = {
        headers: {
          authorization: 'Bearer cron-secret-fallback',
        },
      } as any;

      const result = validateAdminAuth(mockReq);

      expect(result.valid).toBe(true);

      delete process.env.CRON_SECRET;
    });
  });

  describe('validateCronAuth', () => {
    it('should accept x-vercel-cron header', () => {
      process.env.CRON_SECRET = 'cron-secret';

      const mockReq = {
        headers: {
          'x-vercel-cron': 'cron-secret',
        },
      } as any;

      const result = validateCronAuth(mockReq);

      expect(result.valid).toBe(true);
      expect(result.method).toBe('x-vercel-cron');

      delete process.env.CRON_SECRET;
    });

    it('should accept Bearer token', () => {
      process.env.CRON_SECRET = 'cron-secret';

      const mockReq = {
        headers: {
          authorization: 'Bearer cron-secret',
        },
      } as any;

      const result = validateCronAuth(mockReq);

      expect(result.valid).toBe(true);
      expect(result.method).toBe('bearer');

      delete process.env.CRON_SECRET;
    });

    it('should reject invalid cron auth', () => {
      process.env.CRON_SECRET = 'cron-secret';

      const mockReq = {
        headers: {
          authorization: 'Bearer wrong-secret',
        },
      } as any;

      const result = validateCronAuth(mockReq);

      expect(result.valid).toBe(false);

      delete process.env.CRON_SECRET;
    });
  });
});

// =====================================================
// ROLLOUT CONTROL TESTS
// =====================================================

describe('RolloutControl', () => {
  let isExecutorPaused: typeof import('../api/admin/rollout-control').isExecutorPaused;
  let getRuntimeLimits: typeof import('../api/admin/rollout-control').getRuntimeLimits;
  let getRolloutState: typeof import('../api/admin/rollout-control').getRolloutState;

  beforeEach(async () => {
    vi.resetModules();
    const module = await import('../api/admin/rollout-control');
    isExecutorPaused = module.isExecutorPaused;
    getRuntimeLimits = module.getRuntimeLimits;
    getRolloutState = module.getRolloutState;
  });

  it('should start with executor not paused', () => {
    expect(isExecutorPaused()).toBe(false);
  });

  it('should start with empty runtime limits', () => {
    const limits = getRuntimeLimits();
    expect(limits).toEqual({});
  });

  it('should return full state', () => {
    const state = getRolloutState();

    expect(state).toHaveProperty('executorPaused');
    expect(state).toHaveProperty('limits');
  });
});

// =====================================================
// RISK FLAGS TESTS
// =====================================================

describe('RiskFlags Dynamic', () => {
  let RiskFlags: typeof import('../services/config/RiskFlags').RiskFlags;

  beforeEach(async () => {
    vi.resetModules();
    const module = await import('../services/config/RiskFlags');
    RiskFlags = module.RiskFlags;
    RiskFlags.clear();
  });

  it('should allow adding cities at runtime', () => {
    RiskFlags.addRiskyCity('TestCity');

    expect(RiskFlags.isRiskyCity('TestCity')).toBe(true);
    expect(RiskFlags.getConfig().riskyCities).toContain('testcity');
  });

  it('should allow removing cities at runtime', () => {
    RiskFlags.addRiskyCity('ToRemove');
    RiskFlags.removeRiskyCity('ToRemove');

    expect(RiskFlags.isRiskyCity('ToRemove')).toBe(false);
  });

  it('should allow setting full config', () => {
    RiskFlags.setConfig({
      riskyCities: ['City1', 'City2'],
      riskyCarriers: ['Carrier1'],
    });

    const config = RiskFlags.getConfig();

    expect(config.riskyCities).toHaveLength(2);
    expect(config.riskyCarriers).toHaveLength(1);
  });
});

// =====================================================
// COMMAND CENTER INTEGRATION TESTS
// =====================================================

describe('CommandCenter Data Loading', () => {
  let TicketService: typeof import('../services/tickets/TicketService').TicketService;
  let ActionLogService: typeof import('../services/eventLog/ActionLogService').ActionLogService;
  let ExecutorRunLog: typeof import('../services/executor/ExecutorRunLog').ExecutorRunLog;

  beforeEach(async () => {
    vi.resetModules();

    const ticketModule = await import('../services/tickets/TicketService');
    const actionModule = await import('../services/eventLog/ActionLogService');
    const runLogModule = await import('../services/executor/ExecutorRunLog');

    TicketService = ticketModule.TicketService;
    ActionLogService = actionModule.ActionLogService;
    ExecutorRunLog = runLogModule.ExecutorRunLog;

    // Clear all
    TicketService.clear();
    ActionLogService.clear();
    ExecutorRunLog.clear();
  });

  it('should load tickets section without error', () => {
    // Create some test data
    TicketService.createTicket({
      guia: 'TEST123',
      trigger: 'FAILED_4XX',
      priority: 'alta',
      metadata: { ciudad_de_destino: 'Bogota' },
    });

    const openTickets = TicketService.queryTickets({ status: 'OPEN' });
    const stats = TicketService.getStats();

    expect(openTickets).toHaveLength(1);
    expect(stats.openCount).toBe(1);
  });

  it('should load actions feed without error', () => {
    const stats = ActionLogService.getStats();

    expect(stats).toHaveProperty('total');
    expect(stats).toHaveProperty('byStatus');
    expect(stats).toHaveProperty('byType');
  });

  it('should load executor health without error', () => {
    const lastRun = ExecutorRunLog.getLastRun();
    const metrics24h = ExecutorRunLog.get24hMetrics();

    expect(lastRun).toBeNull(); // No runs yet
    expect(metrics24h).toHaveProperty('runs');
    expect(metrics24h).toHaveProperty('success');
    expect(metrics24h).toHaveProperty('successRate');
  });

  it('should handle empty data gracefully', () => {
    const openTickets = TicketService.queryTickets({ status: 'OPEN' });
    const allActions = ActionLogService.getAllActions();
    const metrics = ExecutorRunLog.get24hMetrics();

    expect(openTickets).toHaveLength(0);
    expect(allActions).toHaveLength(0);
    expect(metrics.runs).toBe(0);
    expect(metrics.successRate).toBe(100); // No failures = 100%
  });
});

// =====================================================
// AUTH SEPARATION TESTS
// =====================================================

describe('Auth Separation', () => {
  it('should use ADMIN_SECRET for admin endpoints, CRON_SECRET for cron', async () => {
    // Set different secrets
    process.env.ADMIN_SECRET = 'admin-only-secret';
    process.env.CRON_SECRET = 'cron-only-secret';

    const { validateAdminAuth, validateCronAuth } = await import('../services/auth/AdminAuth');

    // Admin auth should accept ADMIN_SECRET
    const adminReq = {
      headers: { authorization: 'Bearer admin-only-secret' },
    } as any;
    expect(validateAdminAuth(adminReq).valid).toBe(true);

    // Admin auth should reject CRON_SECRET
    const wrongAdminReq = {
      headers: { authorization: 'Bearer cron-only-secret' },
    } as any;
    expect(validateAdminAuth(wrongAdminReq).valid).toBe(false);

    // Cron auth should accept CRON_SECRET
    const cronReq = {
      headers: { authorization: 'Bearer cron-only-secret' },
    } as any;
    expect(validateCronAuth(cronReq).valid).toBe(true);

    // Cron auth should reject ADMIN_SECRET
    const wrongCronReq = {
      headers: { authorization: 'Bearer admin-only-secret' },
    } as any;
    expect(validateCronAuth(wrongCronReq).valid).toBe(false);

    delete process.env.ADMIN_SECRET;
    delete process.env.CRON_SECRET;
  });
});
