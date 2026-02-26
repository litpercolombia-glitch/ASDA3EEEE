// ============================================
// LITPER PRO - MESSAGE DELIVERY METRICS SERVICE
// Métricas de entrega de mensajes (sent/delivered/read rates)
// ============================================

// ============================================
// TYPES
// ============================================

export type MessageChannel = 'whatsapp' | 'sms' | 'email' | 'push' | 'in_app';
export type MessageStatus = 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
export type TimeRange = '24h' | '7d' | '30d' | '90d' | 'custom';

export interface MessageRecord {
  id: string;
  channel: MessageChannel;
  recipient: string;
  status: MessageStatus;
  templateId?: string;
  templateName?: string;
  batchId?: string;
  createdAt: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  failedAt?: Date;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}

export interface DeliveryMetrics {
  totalMessages: number;
  sent: number;
  delivered: number;
  read: number;
  failed: number;
  pending: number;
  sentRate: number;
  deliveryRate: number;
  readRate: number;
  failureRate: number;
  avgDeliveryTimeMs: number;
  avgReadTimeMs: number;
}

export interface ChannelMetrics extends DeliveryMetrics {
  channel: MessageChannel;
}

export interface TemplateMetrics extends DeliveryMetrics {
  templateId: string;
  templateName: string;
}

export interface TimeSeriesPoint {
  timestamp: string;
  sent: number;
  delivered: number;
  read: number;
  failed: number;
}

export interface DeliveryFunnel {
  stage: string;
  count: number;
  rate: number;
  dropoff: number;
}

export interface MetricsSummary {
  overall: DeliveryMetrics;
  byChannel: ChannelMetrics[];
  byTemplate: TemplateMetrics[];
  timeSeries: TimeSeriesPoint[];
  funnel: DeliveryFunnel[];
  topFailureReasons: { reason: string; count: number; percentage: number }[];
  periodComparison: {
    current: DeliveryMetrics;
    previous: DeliveryMetrics;
    changes: {
      sentRate: number;
      deliveryRate: number;
      readRate: number;
      failureRate: number;
    };
  };
}

// ============================================
// STORAGE
// ============================================

const STORAGE_KEY = 'litper_message_delivery_metrics';
const MAX_RECORDS = 10000;

// ============================================
// SERVICE
// ============================================

class MessageDeliveryMetricsService {
  private records: MessageRecord[];

  constructor() {
    this.records = this.loadRecords();
  }

  // --- Storage ---

  private loadRecords(): MessageRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      return JSON.parse(data).map((r: Record<string, unknown>) => ({
        ...r,
        createdAt: new Date(r.createdAt as string),
        sentAt: r.sentAt ? new Date(r.sentAt as string) : undefined,
        deliveredAt: r.deliveredAt ? new Date(r.deliveredAt as string) : undefined,
        readAt: r.readAt ? new Date(r.readAt as string) : undefined,
        failedAt: r.failedAt ? new Date(r.failedAt as string) : undefined,
      }));
    } catch {
      return [];
    }
  }

  private saveRecords(): void {
    // Keep only most recent records to avoid localStorage overflow
    if (this.records.length > MAX_RECORDS) {
      this.records = this.records
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, MAX_RECORDS);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.records));
  }

  private generateId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // --- Record Management ---

  trackMessage(params: {
    channel: MessageChannel;
    recipient: string;
    templateId?: string;
    templateName?: string;
    batchId?: string;
    metadata?: Record<string, unknown>;
  }): MessageRecord {
    const record: MessageRecord = {
      id: this.generateId(),
      channel: params.channel,
      recipient: params.recipient,
      status: 'PENDING',
      templateId: params.templateId,
      templateName: params.templateName,
      batchId: params.batchId,
      createdAt: new Date(),
      metadata: params.metadata,
    };

    this.records.push(record);
    this.saveRecords();
    return record;
  }

  updateStatus(messageId: string, status: MessageStatus, errorMessage?: string): MessageRecord | null {
    const record = this.records.find(r => r.id === messageId);
    if (!record) return null;

    record.status = status;
    const now = new Date();

    switch (status) {
      case 'SENT':
        record.sentAt = now;
        break;
      case 'DELIVERED':
        record.deliveredAt = now;
        if (!record.sentAt) record.sentAt = now;
        break;
      case 'READ':
        record.readAt = now;
        if (!record.deliveredAt) record.deliveredAt = now;
        if (!record.sentAt) record.sentAt = now;
        break;
      case 'FAILED':
        record.failedAt = now;
        record.errorMessage = errorMessage;
        break;
    }

    this.saveRecords();
    return record;
  }

  // --- Filtering ---

  private getDateRange(range: TimeRange, customStart?: Date, customEnd?: Date): { start: Date; end: Date } {
    const end = new Date();
    let start: Date;

    switch (range) {
      case '24h':
        start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        start = new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'custom':
        start = customStart || new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
        return { start, end: customEnd || end };
      default:
        start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    return { start, end };
  }

  private filterRecords(
    range: TimeRange,
    channel?: MessageChannel,
    customStart?: Date,
    customEnd?: Date
  ): MessageRecord[] {
    const { start, end } = this.getDateRange(range, customStart, customEnd);

    return this.records.filter(r => {
      const inRange = r.createdAt >= start && r.createdAt <= end;
      const matchesChannel = !channel || r.channel === channel;
      return inRange && matchesChannel;
    });
  }

  // --- Metrics Calculation ---

  private calculateMetrics(records: MessageRecord[]): DeliveryMetrics {
    const total = records.length;
    if (total === 0) {
      return {
        totalMessages: 0,
        sent: 0,
        delivered: 0,
        read: 0,
        failed: 0,
        pending: 0,
        sentRate: 0,
        deliveryRate: 0,
        readRate: 0,
        failureRate: 0,
        avgDeliveryTimeMs: 0,
        avgReadTimeMs: 0,
      };
    }

    const sent = records.filter(r => r.sentAt).length;
    const delivered = records.filter(r => r.deliveredAt).length;
    const read = records.filter(r => r.readAt).length;
    const failed = records.filter(r => r.status === 'FAILED').length;
    const pending = records.filter(r => r.status === 'PENDING').length;

    // Calculate average delivery time (sent -> delivered)
    const deliveryTimes = records
      .filter(r => r.sentAt && r.deliveredAt)
      .map(r => r.deliveredAt!.getTime() - r.sentAt!.getTime());

    const avgDeliveryTimeMs = deliveryTimes.length > 0
      ? deliveryTimes.reduce((a, b) => a + b, 0) / deliveryTimes.length
      : 0;

    // Calculate average read time (delivered -> read)
    const readTimes = records
      .filter(r => r.deliveredAt && r.readAt)
      .map(r => r.readAt!.getTime() - r.deliveredAt!.getTime());

    const avgReadTimeMs = readTimes.length > 0
      ? readTimes.reduce((a, b) => a + b, 0) / readTimes.length
      : 0;

    return {
      totalMessages: total,
      sent,
      delivered,
      read,
      failed,
      pending,
      sentRate: total > 0 ? Math.round((sent / total) * 1000) / 10 : 0,
      deliveryRate: sent > 0 ? Math.round((delivered / sent) * 1000) / 10 : 0,
      readRate: delivered > 0 ? Math.round((read / delivered) * 1000) / 10 : 0,
      failureRate: total > 0 ? Math.round((failed / total) * 1000) / 10 : 0,
      avgDeliveryTimeMs,
      avgReadTimeMs,
    };
  }

  // --- Public API ---

  getOverallMetrics(
    range: TimeRange = '30d',
    customStart?: Date,
    customEnd?: Date
  ): DeliveryMetrics {
    const records = this.filterRecords(range, undefined, customStart, customEnd);
    return this.calculateMetrics(records);
  }

  getMetricsByChannel(
    range: TimeRange = '30d',
    customStart?: Date,
    customEnd?: Date
  ): ChannelMetrics[] {
    const channels: MessageChannel[] = ['whatsapp', 'sms', 'email', 'push', 'in_app'];

    return channels
      .map(channel => {
        const records = this.filterRecords(range, channel, customStart, customEnd);
        const metrics = this.calculateMetrics(records);
        return { ...metrics, channel };
      })
      .filter(m => m.totalMessages > 0);
  }

  getMetricsByTemplate(
    range: TimeRange = '30d',
    customStart?: Date,
    customEnd?: Date
  ): TemplateMetrics[] {
    const records = this.filterRecords(range, undefined, customStart, customEnd);

    const templateGroups = new Map<string, MessageRecord[]>();
    records.forEach(r => {
      const key = r.templateId || 'no_template';
      if (!templateGroups.has(key)) {
        templateGroups.set(key, []);
      }
      templateGroups.get(key)!.push(r);
    });

    const results: TemplateMetrics[] = [];
    templateGroups.forEach((templateRecords, templateId) => {
      const metrics = this.calculateMetrics(templateRecords);
      results.push({
        ...metrics,
        templateId,
        templateName: templateRecords[0]?.templateName || templateId,
      });
    });

    return results.sort((a, b) => b.totalMessages - a.totalMessages);
  }

  getTimeSeries(
    range: TimeRange = '30d',
    channel?: MessageChannel,
    customStart?: Date,
    customEnd?: Date
  ): TimeSeriesPoint[] {
    const records = this.filterRecords(range, channel, customStart, customEnd);
    const { start, end } = this.getDateRange(range, customStart, customEnd);

    // Determine bucket size based on range
    let bucketMs: number;
    let dateFormat: (d: Date) => string;

    const durationMs = end.getTime() - start.getTime();
    const durationDays = durationMs / (24 * 60 * 60 * 1000);

    if (durationDays <= 1) {
      bucketMs = 60 * 60 * 1000; // 1 hour
      dateFormat = (d: Date) =>
        d.toLocaleString('es-CO', { hour: '2-digit', minute: '2-digit' });
    } else if (durationDays <= 7) {
      bucketMs = 24 * 60 * 60 * 1000; // 1 day
      dateFormat = (d: Date) =>
        d.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric' });
    } else {
      bucketMs = 24 * 60 * 60 * 1000; // 1 day
      dateFormat = (d: Date) =>
        d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
    }

    const points: TimeSeriesPoint[] = [];
    let current = new Date(start);

    while (current <= end) {
      const bucketEnd = new Date(current.getTime() + bucketMs);
      const bucketRecords = records.filter(
        r => r.createdAt >= current && r.createdAt < bucketEnd
      );

      points.push({
        timestamp: dateFormat(current),
        sent: bucketRecords.filter(r => r.sentAt).length,
        delivered: bucketRecords.filter(r => r.deliveredAt).length,
        read: bucketRecords.filter(r => r.readAt).length,
        failed: bucketRecords.filter(r => r.status === 'FAILED').length,
      });

      current = bucketEnd;
    }

    return points;
  }

  getDeliveryFunnel(
    range: TimeRange = '30d',
    customStart?: Date,
    customEnd?: Date
  ): DeliveryFunnel[] {
    const records = this.filterRecords(range, undefined, customStart, customEnd);
    const total = records.length;

    if (total === 0) {
      return [
        { stage: 'Creados', count: 0, rate: 0, dropoff: 0 },
        { stage: 'Enviados', count: 0, rate: 0, dropoff: 0 },
        { stage: 'Entregados', count: 0, rate: 0, dropoff: 0 },
        { stage: 'Leídos', count: 0, rate: 0, dropoff: 0 },
      ];
    }

    const sent = records.filter(r => r.sentAt).length;
    const delivered = records.filter(r => r.deliveredAt).length;
    const read = records.filter(r => r.readAt).length;

    return [
      {
        stage: 'Creados',
        count: total,
        rate: 100,
        dropoff: 0,
      },
      {
        stage: 'Enviados',
        count: sent,
        rate: Math.round((sent / total) * 1000) / 10,
        dropoff: Math.round(((total - sent) / total) * 1000) / 10,
      },
      {
        stage: 'Entregados',
        count: delivered,
        rate: Math.round((delivered / total) * 1000) / 10,
        dropoff: sent > 0 ? Math.round(((sent - delivered) / sent) * 1000) / 10 : 0,
      },
      {
        stage: 'Leídos',
        count: read,
        rate: Math.round((read / total) * 1000) / 10,
        dropoff: delivered > 0 ? Math.round(((delivered - read) / delivered) * 1000) / 10 : 0,
      },
    ];
  }

  getTopFailureReasons(
    range: TimeRange = '30d',
    limit: number = 5,
    customStart?: Date,
    customEnd?: Date
  ): { reason: string; count: number; percentage: number }[] {
    const records = this.filterRecords(range, undefined, customStart, customEnd);
    const failedRecords = records.filter(r => r.status === 'FAILED');

    if (failedRecords.length === 0) return [];

    const reasonCounts = new Map<string, number>();
    failedRecords.forEach(r => {
      const reason = r.errorMessage || 'Error desconocido';
      reasonCounts.set(reason, (reasonCounts.get(reason) || 0) + 1);
    });

    return Array.from(reasonCounts.entries())
      .map(([reason, count]) => ({
        reason,
        count,
        percentage: Math.round((count / failedRecords.length) * 1000) / 10,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  getFullSummary(
    range: TimeRange = '30d',
    customStart?: Date,
    customEnd?: Date
  ): MetricsSummary {
    // Calculate previous period for comparison
    const { start, end } = this.getDateRange(range, customStart, customEnd);
    const periodDuration = end.getTime() - start.getTime();
    const prevStart = new Date(start.getTime() - periodDuration);
    const prevEnd = new Date(start.getTime());

    const currentRecords = this.filterRecords(range, undefined, customStart, customEnd);
    const previousRecords = this.filterRecords('custom', undefined, prevStart, prevEnd);

    const current = this.calculateMetrics(currentRecords);
    const previous = this.calculateMetrics(previousRecords);

    return {
      overall: current,
      byChannel: this.getMetricsByChannel(range, customStart, customEnd),
      byTemplate: this.getMetricsByTemplate(range, customStart, customEnd),
      timeSeries: this.getTimeSeries(range, undefined, customStart, customEnd),
      funnel: this.getDeliveryFunnel(range, customStart, customEnd),
      topFailureReasons: this.getTopFailureReasons(range, 5, customStart, customEnd),
      periodComparison: {
        current,
        previous,
        changes: {
          sentRate: current.sentRate - previous.sentRate,
          deliveryRate: current.deliveryRate - previous.deliveryRate,
          readRate: current.readRate - previous.readRate,
          failureRate: current.failureRate - previous.failureRate,
        },
      },
    };
  }

  // --- Seed demo data for testing ---

  seedDemoData(count: number = 500): void {
    const channels: MessageChannel[] = ['whatsapp', 'sms', 'email', 'push'];
    const templates = [
      { id: 'reclamo_oficina', name: 'Reclamo en Oficina' },
      { id: 'no_estaba', name: 'No Estaba - Reagendar' },
      { id: 'confirmar_entrega', name: 'Confirmar Entrega' },
      { id: 'agradecimiento', name: 'Agradecimiento' },
      { id: 'direccion_errada', name: 'Dirección Errada' },
    ];
    const errors = [
      'Número no válido',
      'Sin conexión a WhatsApp',
      'Límite de envío alcanzado',
      'Número bloqueado',
      'Timeout de conexión',
    ];

    const now = Date.now();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

    for (let i = 0; i < count; i++) {
      const channel = channels[Math.floor(Math.random() * channels.length)];
      const template = templates[Math.floor(Math.random() * templates.length)];
      const createdAt = new Date(now - Math.random() * thirtyDaysMs);

      const record: MessageRecord = {
        id: this.generateId(),
        channel,
        recipient: `+5730${Math.floor(10000000 + Math.random() * 90000000)}`,
        status: 'PENDING',
        templateId: template.id,
        templateName: template.name,
        createdAt,
      };

      // Simulate status progression
      const rand = Math.random();
      if (rand < 0.08) {
        // 8% failed
        record.status = 'FAILED';
        record.failedAt = new Date(createdAt.getTime() + Math.random() * 5000);
        record.errorMessage = errors[Math.floor(Math.random() * errors.length)];
      } else if (rand < 0.12) {
        // 4% still pending
        record.status = 'PENDING';
      } else {
        // Sent
        record.sentAt = new Date(createdAt.getTime() + Math.random() * 3000);

        if (rand < 0.20) {
          // 8% sent but not delivered
          record.status = 'SENT';
        } else {
          // Delivered
          record.deliveredAt = new Date(record.sentAt.getTime() + Math.random() * 60000);

          if (rand < 0.45) {
            // 25% delivered but not read
            record.status = 'DELIVERED';
          } else {
            // Read
            record.readAt = new Date(record.deliveredAt.getTime() + Math.random() * 3600000);
            record.status = 'READ';
          }
        }
      }

      this.records.push(record);
    }

    this.saveRecords();
  }

  clearData(): void {
    this.records = [];
    localStorage.removeItem(STORAGE_KEY);
  }

  getRecordCount(): number {
    return this.records.length;
  }
}

// ============================================
// SINGLETON EXPORT
// ============================================

export const messageDeliveryMetrics = new MessageDeliveryMetricsService();

export default MessageDeliveryMetricsService;
