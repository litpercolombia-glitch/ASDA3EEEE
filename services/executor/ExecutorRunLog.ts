/**
 * ExecutorRunLog - Observability for executor runs
 *
 * Tracks each execution run with metrics.
 * NO PII stored - only aggregated counts and run metadata.
 */

// =====================================================
// TYPES
// =====================================================

export interface ExecutorRunSummary {
  runId: string;
  startedAt: Date;
  finishedAt: Date;
  durationMs: number;

  // Counts
  planned: number;
  wouldSend: number;
  sent: number;
  success: number;
  failed4xx: number;
  failed5xx: number;
  skippedDuplicate: number;
  skippedRateLimit: number;
  skippedDisabled: number;

  // Config at time of run
  config: {
    executorEnabled: boolean;
    pilotCity?: string;
    pilotCarrier?: string;
    dailySendLimit: number;
    rateLimitPerMinute: number;
  };

  // Aggregated errors (no PII)
  errorSummary: {
    type: string;
    count: number;
  }[];

  // Status
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  message?: string;
}

export interface ExecutorRunLogEntry {
  runId: string;
  timestamp: Date;
  level: 'INFO' | 'WARN' | 'ERROR';
  message: string;
  metadata?: Record<string, unknown>;
}

// =====================================================
// RUN LOG SERVICE
// =====================================================

class ExecutorRunLogImpl {
  private runs: Map<string, ExecutorRunSummary> = new Map();
  private logs: ExecutorRunLogEntry[] = [];
  private maxRuns = 100; // Keep last 100 runs
  private maxLogs = 1000; // Keep last 1000 log entries

  /**
   * Generate unique run ID
   */
  generateRunId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 6);
    return `run_${timestamp}_${random}`;
  }

  /**
   * Record a completed run
   */
  recordRun(summary: ExecutorRunSummary): void {
    this.runs.set(summary.runId, summary);

    // Cleanup old runs
    if (this.runs.size > this.maxRuns) {
      const oldestKey = this.runs.keys().next().value;
      if (oldestKey) this.runs.delete(oldestKey);
    }
  }

  /**
   * Log an entry during a run
   */
  log(
    runId: string,
    level: ExecutorRunLogEntry['level'],
    message: string,
    metadata?: Record<string, unknown>
  ): void {
    // Sanitize metadata to remove any PII
    const sanitizedMetadata = metadata ? this.sanitizeMetadata(metadata) : undefined;

    this.logs.push({
      runId,
      timestamp: new Date(),
      level,
      message,
      metadata: sanitizedMetadata,
    });

    // Cleanup old logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  /**
   * Sanitize metadata to remove PII
   */
  private sanitizeMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(metadata)) {
      // Skip phone-related fields
      if (key.toLowerCase().includes('phone') || key.toLowerCase().includes('telefono')) {
        sanitized[key] = '[REDACTED]';
        continue;
      }

      // Redact phone patterns in string values
      if (typeof value === 'string') {
        sanitized[key] = value
          .replace(/\+?\d{10,15}/g, '[PHONE_REDACTED]')
          .replace(/\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/g, '[PHONE_REDACTED]');
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Get last run summary
   */
  getLastRun(): ExecutorRunSummary | null {
    const runs = Array.from(this.runs.values());
    return runs.length > 0 ? runs[runs.length - 1] : null;
  }

  /**
   * Get run by ID
   */
  getRun(runId: string): ExecutorRunSummary | null {
    return this.runs.get(runId) || null;
  }

  /**
   * Get all runs (most recent first)
   */
  getAllRuns(limit = 20): ExecutorRunSummary[] {
    return Array.from(this.runs.values())
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
      .slice(0, limit);
  }

  /**
   * Get logs for a run
   */
  getLogsForRun(runId: string): ExecutorRunLogEntry[] {
    return this.logs.filter(l => l.runId === runId);
  }

  /**
   * Get recent logs
   */
  getRecentLogs(limit = 50): ExecutorRunLogEntry[] {
    return this.logs.slice(-limit);
  }

  /**
   * Get aggregated stats
   */
  getStats(): {
    totalRuns: number;
    last24hRuns: number;
    totalSent: number;
    totalFailed: number;
    avgDurationMs: number;
    successRate: number;
  } {
    const runs = Array.from(this.runs.values());
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    const last24h = runs.filter(r => r.startedAt.getTime() > oneDayAgo);
    const totalSent = runs.reduce((sum, r) => sum + r.success, 0);
    const totalFailed = runs.reduce((sum, r) => sum + r.failed4xx + r.failed5xx, 0);
    const avgDuration = runs.length > 0
      ? runs.reduce((sum, r) => sum + r.durationMs, 0) / runs.length
      : 0;

    return {
      totalRuns: runs.length,
      last24hRuns: last24h.length,
      totalSent,
      totalFailed,
      avgDurationMs: Math.round(avgDuration),
      successRate: totalSent + totalFailed > 0
        ? (totalSent / (totalSent + totalFailed)) * 100
        : 100,
    };
  }

  /**
   * Export summary for JSON response (API-safe)
   */
  formatRunForApi(summary: ExecutorRunSummary): Record<string, unknown> {
    return {
      runId: summary.runId,
      startedAt: summary.startedAt.toISOString(),
      finishedAt: summary.finishedAt.toISOString(),
      durationMs: summary.durationMs,
      planned: summary.planned,
      wouldSend: summary.wouldSend,
      sent: summary.sent,
      success: summary.success,
      failed4xx: summary.failed4xx,
      failed5xx: summary.failed5xx,
      skippedDuplicate: summary.skippedDuplicate,
      skippedRateLimit: summary.skippedRateLimit,
      skippedDisabled: summary.skippedDisabled,
      status: summary.status,
      message: summary.message,
      config: summary.config,
      errorSummary: summary.errorSummary,
    };
  }

  /**
   * Clear all data (for testing)
   */
  clear(): void {
    this.runs.clear();
    this.logs = [];
  }
}

// Singleton export
export const ExecutorRunLog = new ExecutorRunLogImpl();

export default ExecutorRunLog;
