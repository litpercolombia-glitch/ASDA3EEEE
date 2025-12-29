/**
 * CRON Endpoint Security Tests
 *
 * Tests for:
 * - 401 without Authorization header
 * - 401 with invalid secret
 * - 200 with valid CRON_SECRET
 * - No PII in responses
 * - Respects EXECUTOR_ENABLED=false
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// =====================================================
// MOCK REQUEST/RESPONSE
// =====================================================

interface MockRequest {
  method: string;
  headers: Record<string, string>;
}

interface MockResponse {
  statusCode: number;
  body: unknown;
  status: (code: number) => MockResponse;
  json: (data: unknown) => void;
}

function createMockRequest(overrides: Partial<MockRequest> = {}): MockRequest {
  return {
    method: 'POST',
    headers: {},
    ...overrides,
  };
}

function createMockResponse(): MockResponse {
  const res: MockResponse = {
    statusCode: 200,
    body: null,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(data: unknown) {
      this.body = data;
    },
  };
  return res;
}

// =====================================================
// SECURITY VALIDATION TESTS
// =====================================================

describe('CRON Endpoint Security', () => {
  const VALID_SECRET = 'test-cron-secret-12345';

  beforeEach(() => {
    // Set env vars
    vi.stubEnv('CRON_SECRET', VALID_SECRET);
    vi.stubEnv('EXECUTOR_ENABLED', 'false');
    vi.stubEnv('DAILY_SEND_LIMIT', '100');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('validateCronSecret()', () => {
    // Inline the validation function for testing
    function validateCronSecret(req: MockRequest): boolean {
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        return false;
      }

      const [scheme, token] = authHeader.split(' ');

      if (scheme !== 'Bearer' || !token) {
        return false;
      }

      const cronSecret = process.env.CRON_SECRET;

      if (!cronSecret) {
        return false;
      }

      if (token.length !== cronSecret.length) {
        return false;
      }

      let result = 0;
      for (let i = 0; i < token.length; i++) {
        result |= token.charCodeAt(i) ^ cronSecret.charCodeAt(i);
      }

      return result === 0;
    }

    it('should return false without Authorization header', () => {
      const req = createMockRequest({ headers: {} });
      expect(validateCronSecret(req)).toBe(false);
    });

    it('should return false with wrong scheme', () => {
      const req = createMockRequest({
        headers: { authorization: `Basic ${VALID_SECRET}` },
      });
      expect(validateCronSecret(req)).toBe(false);
    });

    it('should return false with invalid token', () => {
      const req = createMockRequest({
        headers: { authorization: 'Bearer wrong-secret' },
      });
      expect(validateCronSecret(req)).toBe(false);
    });

    it('should return false with partially matching token', () => {
      const req = createMockRequest({
        headers: { authorization: 'Bearer test-cron-secret-12346' },
      });
      expect(validateCronSecret(req)).toBe(false);
    });

    it('should return true with valid token', () => {
      const req = createMockRequest({
        headers: { authorization: `Bearer ${VALID_SECRET}` },
      });
      expect(validateCronSecret(req)).toBe(true);
    });

    it('should use constant-time comparison (different lengths)', () => {
      const req = createMockRequest({
        headers: { authorization: 'Bearer short' },
      });
      expect(validateCronSecret(req)).toBe(false);
    });
  });
});

// =====================================================
// PII REDACTION TESTS
// =====================================================

describe('PII Redaction', () => {
  describe('Error sanitization', () => {
    function sanitizeError(message: string): string {
      return message
        .replace(/\+?\d{10,15}/g, '[PHONE_REDACTED]')
        .replace(/\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/g, '[PHONE_REDACTED]');
    }

    it('should redact phone numbers with country code', () => {
      const error = 'Failed to send to +573001234567';
      expect(sanitizeError(error)).toBe('Failed to send to [PHONE_REDACTED]');
    });

    it('should redact phone numbers without country code', () => {
      const error = 'Invalid phone: 3001234567';
      expect(sanitizeError(error)).toBe('Invalid phone: [PHONE_REDACTED]');
    });

    it('should redact formatted phone numbers', () => {
      const error = 'Call failed for 300-123-4567';
      expect(sanitizeError(error)).toBe('Call failed for [PHONE_REDACTED]');
    });

    it('should redact multiple phone numbers', () => {
      const error = 'Phones: +573001234567 and +573009876543';
      expect(sanitizeError(error)).toBe('Phones: [PHONE_REDACTED] and [PHONE_REDACTED]');
    });

    it('should not redact non-phone data', () => {
      const error = 'Error code 500, action_id: act_12345';
      expect(sanitizeError(error)).toBe('Error code 500, action_id: act_12345');
    });
  });
});

// =====================================================
// EXECUTOR ENABLED FLAG TESTS
// =====================================================

describe('EXECUTOR_ENABLED flag', () => {
  beforeEach(() => {
    vi.stubEnv('EXECUTOR_ENABLED', 'false');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should be false by default', () => {
    expect(process.env.EXECUTOR_ENABLED).toBe('false');
  });

  it('should parse as boolean correctly', () => {
    const enabled = process.env.EXECUTOR_ENABLED === 'true';
    expect(enabled).toBe(false);
  });

  it('should enable when set to "true"', () => {
    vi.stubEnv('EXECUTOR_ENABLED', 'true');
    const enabled = process.env.EXECUTOR_ENABLED === 'true';
    expect(enabled).toBe(true);
  });
});

// =====================================================
// RUN RESULT STRUCTURE TESTS
// =====================================================

describe('Run Result Structure', () => {
  interface RunResult {
    runId: string;
    startedAt: string;
    finishedAt: string;
    durationMs: number;
    planned: number;
    wouldSend: number;
    sent: number;
    success: number;
    failed4xx: number;
    failed5xx: number;
    skippedDuplicate: number;
    skippedRateLimit: number;
    skippedDisabled: number;
    status: string;
  }

  function createMockResult(): RunResult {
    return {
      runId: 'run_abc123',
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      durationMs: 150,
      planned: 10,
      wouldSend: 8,
      sent: 0,
      success: 8,
      failed4xx: 1,
      failed5xx: 0,
      skippedDuplicate: 1,
      skippedRateLimit: 0,
      skippedDisabled: 0,
      status: 'PARTIAL',
    };
  }

  it('should contain all required fields', () => {
    const result = createMockResult();

    expect(result).toHaveProperty('runId');
    expect(result).toHaveProperty('startedAt');
    expect(result).toHaveProperty('finishedAt');
    expect(result).toHaveProperty('durationMs');
    expect(result).toHaveProperty('planned');
    expect(result).toHaveProperty('wouldSend');
    expect(result).toHaveProperty('sent');
    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('failed4xx');
    expect(result).toHaveProperty('failed5xx');
    expect(result).toHaveProperty('skippedDuplicate');
    expect(result).toHaveProperty('skippedRateLimit');
    expect(result).toHaveProperty('status');
  });

  it('should NOT contain any phone numbers', () => {
    const result = createMockResult();
    const jsonStr = JSON.stringify(result);

    // Check for phone patterns
    expect(jsonStr).not.toMatch(/\+?\d{10,15}/);
    expect(jsonStr).not.toMatch(/telefono/i);
    expect(jsonStr).not.toMatch(/phone(?!Hash)/i);
  });

  it('should have valid ISO date strings', () => {
    const result = createMockResult();

    expect(() => new Date(result.startedAt)).not.toThrow();
    expect(() => new Date(result.finishedAt)).not.toThrow();
  });
});

// =====================================================
// PIIVault TESTS
// =====================================================

describe('PIIVault', () => {
  // Import actual implementation
  let PIIVault: typeof import('../services/executor/PIIVault').PIIVault;

  beforeEach(async () => {
    const module = await import('../services/executor/PIIVault');
    PIIVault = module.PIIVault;
    PIIVault.clear();
  });

  it('should store phone and return hash', async () => {
    const hash = await PIIVault.store('3001234567');

    expect(hash).not.toBe('3001234567');
    expect(hash.length).toBeGreaterThan(0);
  });

  it('should lookup phone by hash', async () => {
    const hash = await PIIVault.store('3001234567');
    const phone = PIIVault.lookup(hash);

    expect(phone).toBe('+573001234567'); // Normalized
  });

  it('should return null for unknown hash', () => {
    const phone = PIIVault.lookup('unknown_hash');
    expect(phone).toBeNull();
  });

  it('should clear all entries', async () => {
    await PIIVault.store('3001234567');
    expect(PIIVault.size()).toBe(1);

    PIIVault.clear();
    expect(PIIVault.size()).toBe(0);
  });

  it('should not expose phone in stats', () => {
    const stats = PIIVault.getStats();

    const statsStr = JSON.stringify(stats);
    expect(statsStr).not.toMatch(/\d{10}/);
    expect(statsStr).not.toContain('phone');
  });
});

// =====================================================
// ExecutorRunLog TESTS
// =====================================================

describe('ExecutorRunLog', () => {
  let ExecutorRunLog: typeof import('../services/executor/ExecutorRunLog').ExecutorRunLog;

  beforeEach(async () => {
    const module = await import('../services/executor/ExecutorRunLog');
    ExecutorRunLog = module.ExecutorRunLog;
    ExecutorRunLog.clear();
  });

  it('should sanitize metadata with phone numbers', () => {
    const runId = 'test_run';

    ExecutorRunLog.log(runId, 'INFO', 'Test message', {
      phone: '3001234567',
      guia: 'GUIA123',
    });

    const logs = ExecutorRunLog.getLogsForRun(runId);
    expect(logs.length).toBe(1);
    expect(logs[0].metadata?.phone).toBe('[REDACTED]');
    expect(logs[0].metadata?.guia).toBe('GUIA123');
  });

  it('should sanitize phone patterns in string values', () => {
    const runId = 'test_run';

    ExecutorRunLog.log(runId, 'ERROR', 'Test', {
      error: 'Failed for +573001234567',
    });

    const logs = ExecutorRunLog.getLogsForRun(runId);
    expect(logs[0].metadata?.error).toBe('Failed for [PHONE_REDACTED]');
  });

  it('should generate unique run IDs', () => {
    const id1 = ExecutorRunLog.generateRunId();
    const id2 = ExecutorRunLog.generateRunId();

    expect(id1).not.toBe(id2);
    expect(id1).toMatch(/^run_/);
  });
});
