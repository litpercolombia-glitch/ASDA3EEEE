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
   * Get detailed 24h metrics (P0-4)
   * NO PII - only aggregated counts
   */
  get24hMetrics(): {
    periodStart: string;
    periodEnd: string;
    runs: number;
    sent: number;
    success: number;
    failed4xx: number;
    failed5xx: number;
    skippedDuplicate: number;
    skippedRateLimit: number;
    skippedDisabled: number;
    successRate: number;
    avgDurationMs: number;
    topCities: { city: string; count: number }[];
    topCarriers: { carrier: string; count: number }[];
  } {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const runs = Array.from(this.runs.values())
      .filter(r => r.startedAt.getTime() > oneDayAgo);

    // Aggregate metrics
    let sent = 0;
    let success = 0;
    let failed4xx = 0;
    let failed5xx = 0;
    let skippedDuplicate = 0;
    let skippedRateLimit = 0;
    let skippedDisabled = 0;
    let totalDuration = 0;
    const cityCounts: Record<string, number> = {};
    const carrierCounts: Record<string, number> = {};

    for (const run of runs) {
      sent += run.sent;
      success += run.success;
      failed4xx += run.failed4xx;
      failed5xx += run.failed5xx;
      skippedDuplicate += run.skippedDuplicate;
      skippedRateLimit += run.skippedRateLimit;
      skippedDisabled += run.skippedDisabled;
      totalDuration += run.durationMs;

      // Aggregate by city/carrier from config (pilot restrictions)
      if (run.config.pilotCity) {
        cityCounts[run.config.pilotCity] = (cityCounts[run.config.pilotCity] || 0) + run.success;
      }
      if (run.config.pilotCarrier) {
        carrierCounts[run.config.pilotCarrier] = (carrierCounts[run.config.pilotCarrier] || 0) + run.success;
      }
    }

    // Sort and get top 5
    const topCities = Object.entries(cityCounts)
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const topCarriers = Object.entries(carrierCounts)
      .map(([carrier, count]) => ({ carrier, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const total = success + failed4xx + failed5xx;

    return {
      periodStart: new Date(oneDayAgo).toISOString(),
      periodEnd: new Date(now).toISOString(),
      runs: runs.length,
      sent,
      success,
      failed4xx,
      failed5xx,
      skippedDuplicate,
      skippedRateLimit,
      skippedDisabled,
      successRate: total > 0 ? Math.round((success / total) * 100 * 100) / 100 : 100,
      avgDurationMs: runs.length > 0 ? Math.round(totalDuration / runs.length) : 0,
      topCities,
      topCarriers,
    };
  }

  /**
   * Generate daily summary (P0-4)
   * Call at end of day or when requested
   */
  generateDailySummary(date?: Date): {
    date: string;
    runs: number;
    totalPlanned: number;
    totalSent: number;
    totalSuccess: number;
    totalFailed: number;
    totalSkipped: number;
    successRate: number;
    avgDurationMs: number;
    errorBreakdown: { type: string; count: number }[];
    statusBreakdown: { status: string; count: number }[];
  } {
    const targetDate = date || new Date();
    const dateStr = targetDate.toISOString().split('T')[0];
    const dayStart = new Date(dateStr + 'T00:00:00.000Z').getTime();
    const dayEnd = new Date(dateStr + 'T23:59:59.999Z').getTime();

    const runs = Array.from(this.runs.values())
      .filter(r => r.startedAt.getTime() >= dayStart && r.startedAt.getTime() <= dayEnd);

    let totalPlanned = 0;
    let totalSent = 0;
    let totalSuccess = 0;
    let totalFailed = 0;
    let totalSkipped = 0;
    let totalDuration = 0;
    const errorCounts: Record<string, number> = {};
    const statusCounts: Record<string, number> = {};

    for (const run of runs) {
      totalPlanned += run.planned;
      totalSent += run.sent;
      totalSuccess += run.success;
      totalFailed += run.failed4xx + run.failed5xx;
      totalSkipped += run.skippedDuplicate + run.skippedRateLimit + run.skippedDisabled;
      totalDuration += run.durationMs;

      // Aggregate errors
      for (const err of run.errorSummary) {
        errorCounts[err.type] = (errorCounts[err.type] || 0) + err.count;
      }

      // Count by status
      statusCounts[run.status] = (statusCounts[run.status] || 0) + 1;
    }

    const errorBreakdown = Object.entries(errorCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);

    const statusBreakdown = Object.entries(statusCounts)
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count);

    return {
      date: dateStr,
      runs: runs.length,
      totalPlanned,
      totalSent,
      totalSuccess,
      totalFailed,
      totalSkipped,
      successRate: totalSuccess + totalFailed > 0
        ? Math.round((totalSuccess / (totalSuccess + totalFailed)) * 100 * 100) / 100
        : 100,
      avgDurationMs: runs.length > 0 ? Math.round(totalDuration / runs.length) : 0,
      errorBreakdown,
      statusBreakdown,
    };
  }

  /**
   * Compare two daily summaries (for day-over-day analysis)
   */
  compareDays(
    date1: Date,
    date2: Date
  ): {
    day1: ReturnType<typeof this.generateDailySummary>;
    day2: ReturnType<typeof this.generateDailySummary>;
    delta: {
      runs: number;
      sent: number;
      success: number;
      failed: number;
      successRateDelta: number;
    };
  } {
    const day1 = this.generateDailySummary(date1);
    const day2 = this.generateDailySummary(date2);

    return {
      day1,
      day2,
      delta: {
        runs: day2.runs - day1.runs,
        sent: day2.totalSent - day1.totalSent,
        success: day2.totalSuccess - day1.totalSuccess,
        failed: day2.totalFailed - day1.totalFailed,
        successRateDelta: Math.round((day2.successRate - day1.successRate) * 100) / 100,
      },
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
