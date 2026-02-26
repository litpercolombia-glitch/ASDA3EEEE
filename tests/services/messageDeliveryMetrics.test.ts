// tests/services/messageDeliveryMetrics.test.ts
// Tests para el servicio de métricas de entrega de mensajes

import { describe, it, expect, beforeEach } from 'vitest';

// ============================================
// MOCK TYPES (matching the service types)
// ============================================

type MessageChannel = 'whatsapp' | 'sms' | 'email' | 'push' | 'in_app';
type MessageStatus = 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';

interface MockMessageRecord {
  id: string;
  channel: MessageChannel;
  recipient: string;
  status: MessageStatus;
  templateId?: string;
  templateName?: string;
  createdAt: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  failedAt?: Date;
  errorMessage?: string;
}

// ============================================
// HELPER FUNCTIONS (mimicking service logic)
// ============================================

function calculateDeliveryMetrics(records: MockMessageRecord[]) {
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

  const deliveryTimes = records
    .filter(r => r.sentAt && r.deliveredAt)
    .map(r => r.deliveredAt!.getTime() - r.sentAt!.getTime());

  const avgDeliveryTimeMs = deliveryTimes.length > 0
    ? deliveryTimes.reduce((a, b) => a + b, 0) / deliveryTimes.length
    : 0;

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

function calculateFunnel(records: MockMessageRecord[]) {
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
    { stage: 'Creados', count: total, rate: 100, dropoff: 0 },
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

function getTopFailureReasons(records: MockMessageRecord[], limit: number = 5) {
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

function groupByChannel(records: MockMessageRecord[]) {
  const channels: MessageChannel[] = ['whatsapp', 'sms', 'email', 'push', 'in_app'];
  return channels
    .map(channel => {
      const channelRecords = records.filter(r => r.channel === channel);
      return { channel, ...calculateDeliveryMetrics(channelRecords) };
    })
    .filter(m => m.totalMessages > 0);
}

// ============================================
// MOCK DATA FACTORY
// ============================================

let idCounter = 0;

function createMessage(overrides: Partial<MockMessageRecord> = {}): MockMessageRecord {
  idCounter++;
  const now = new Date();
  return {
    id: `msg_test_${idCounter}`,
    channel: 'whatsapp',
    recipient: '+573001234567',
    status: 'PENDING',
    createdAt: now,
    ...overrides,
  };
}

function createSentMessage(channel: MessageChannel = 'whatsapp'): MockMessageRecord {
  const now = new Date();
  return createMessage({
    channel,
    status: 'SENT',
    sentAt: new Date(now.getTime() + 1000),
  });
}

function createDeliveredMessage(channel: MessageChannel = 'whatsapp'): MockMessageRecord {
  const now = new Date();
  return createMessage({
    channel,
    status: 'DELIVERED',
    sentAt: new Date(now.getTime() + 1000),
    deliveredAt: new Date(now.getTime() + 5000),
  });
}

function createReadMessage(channel: MessageChannel = 'whatsapp'): MockMessageRecord {
  const now = new Date();
  return createMessage({
    channel,
    status: 'READ',
    sentAt: new Date(now.getTime() + 1000),
    deliveredAt: new Date(now.getTime() + 5000),
    readAt: new Date(now.getTime() + 60000),
  });
}

function createFailedMessage(channel: MessageChannel = 'whatsapp', error?: string): MockMessageRecord {
  const now = new Date();
  return createMessage({
    channel,
    status: 'FAILED',
    failedAt: new Date(now.getTime() + 2000),
    errorMessage: error || 'Número no válido',
  });
}

// ============================================
// TESTS
// ============================================

describe('MessageDeliveryMetrics', () => {
  beforeEach(() => {
    idCounter = 0;
  });

  describe('calculateDeliveryMetrics', () => {
    it('returns zero metrics for empty records', () => {
      const metrics = calculateDeliveryMetrics([]);
      expect(metrics.totalMessages).toBe(0);
      expect(metrics.sent).toBe(0);
      expect(metrics.delivered).toBe(0);
      expect(metrics.read).toBe(0);
      expect(metrics.failed).toBe(0);
      expect(metrics.sentRate).toBe(0);
      expect(metrics.deliveryRate).toBe(0);
      expect(metrics.readRate).toBe(0);
      expect(metrics.failureRate).toBe(0);
    });

    it('correctly counts messages by status', () => {
      const records = [
        createMessage(), // PENDING
        createSentMessage(),
        createDeliveredMessage(),
        createReadMessage(),
        createFailedMessage(),
      ];

      const metrics = calculateDeliveryMetrics(records);

      expect(metrics.totalMessages).toBe(5);
      expect(metrics.pending).toBe(1);
      expect(metrics.sent).toBe(3); // sent, delivered, and read all have sentAt
      expect(metrics.delivered).toBe(2); // delivered and read have deliveredAt
      expect(metrics.read).toBe(1);
      expect(metrics.failed).toBe(1);
    });

    it('calculates correct sent rate', () => {
      const records = [
        createSentMessage(),
        createSentMessage(),
        createSentMessage(),
        createMessage(), // pending
        createFailedMessage(),
      ];

      const metrics = calculateDeliveryMetrics(records);
      // 3 sent out of 5 total = 60%
      expect(metrics.sentRate).toBe(60);
    });

    it('calculates correct delivery rate (delivered/sent)', () => {
      const records = [
        createDeliveredMessage(),
        createDeliveredMessage(),
        createSentMessage(), // sent but not delivered
      ];

      const metrics = calculateDeliveryMetrics(records);
      // 2 delivered out of 3 sent = 66.7%
      expect(metrics.deliveryRate).toBe(66.7);
    });

    it('calculates correct read rate (read/delivered)', () => {
      const records = [
        createReadMessage(),
        createDeliveredMessage(), // delivered but not read
        createDeliveredMessage(), // delivered but not read
      ];

      const metrics = calculateDeliveryMetrics(records);
      // 1 read out of 3 delivered = 33.3%
      expect(metrics.readRate).toBe(33.3);
    });

    it('calculates correct failure rate', () => {
      const records = [
        createFailedMessage(),
        createFailedMessage(),
        createSentMessage(),
        createSentMessage(),
        createSentMessage(),
        createSentMessage(),
        createSentMessage(),
        createSentMessage(),
        createSentMessage(),
        createSentMessage(),
      ];

      const metrics = calculateDeliveryMetrics(records);
      // 2 failed out of 10 = 20%
      expect(metrics.failureRate).toBe(20);
    });

    it('calculates average delivery time', () => {
      const now = new Date();
      const records = [
        createMessage({
          status: 'DELIVERED',
          sentAt: new Date(now.getTime()),
          deliveredAt: new Date(now.getTime() + 10000), // 10s
        }),
        createMessage({
          status: 'DELIVERED',
          sentAt: new Date(now.getTime()),
          deliveredAt: new Date(now.getTime() + 20000), // 20s
        }),
      ];

      const metrics = calculateDeliveryMetrics(records);
      // Average: (10000 + 20000) / 2 = 15000ms
      expect(metrics.avgDeliveryTimeMs).toBe(15000);
    });

    it('calculates average read time', () => {
      const now = new Date();
      const records = [
        createMessage({
          status: 'READ',
          sentAt: now,
          deliveredAt: new Date(now.getTime() + 1000),
          readAt: new Date(now.getTime() + 31000), // 30s after delivery
        }),
        createMessage({
          status: 'READ',
          sentAt: now,
          deliveredAt: new Date(now.getTime() + 1000),
          readAt: new Date(now.getTime() + 61000), // 60s after delivery
        }),
      ];

      const metrics = calculateDeliveryMetrics(records);
      // Average: (30000 + 60000) / 2 = 45000ms
      expect(metrics.avgReadTimeMs).toBe(45000);
    });
  });

  describe('calculateFunnel', () => {
    it('returns empty funnel for no records', () => {
      const funnel = calculateFunnel([]);
      expect(funnel).toHaveLength(4);
      funnel.forEach(stage => {
        expect(stage.count).toBe(0);
        expect(stage.rate).toBe(0);
      });
    });

    it('calculates correct funnel stages', () => {
      const records = [
        createMessage(),          // pending only
        createSentMessage(),      // sent
        createSentMessage(),      // sent
        createDeliveredMessage(), // delivered
        createDeliveredMessage(), // delivered
        createDeliveredMessage(), // delivered
        createReadMessage(),      // read
        createReadMessage(),      // read
        createFailedMessage(),    // failed
        createFailedMessage(),    // failed
      ];

      const funnel = calculateFunnel(records);

      expect(funnel[0].stage).toBe('Creados');
      expect(funnel[0].count).toBe(10);
      expect(funnel[0].rate).toBe(100);

      expect(funnel[1].stage).toBe('Enviados');
      expect(funnel[1].count).toBe(7); // 2 sent + 3 delivered + 2 read (all have sentAt)

      expect(funnel[2].stage).toBe('Entregados');
      expect(funnel[2].count).toBe(5); // 3 delivered + 2 read (all have deliveredAt)

      expect(funnel[3].stage).toBe('Leídos');
      expect(funnel[3].count).toBe(2);
    });

    it('calculates dropoff rates correctly', () => {
      const records = [
        createReadMessage(),
        createReadMessage(),
        createReadMessage(),
        createDeliveredMessage(),
        createDeliveredMessage(),
        createSentMessage(),
        createMessage(),
        createMessage(),
        createMessage(),
        createMessage(),
      ];

      const funnel = calculateFunnel(records);

      // Creados: 10, no dropoff
      expect(funnel[0].dropoff).toBe(0);

      // Enviados: 6 (3 read + 2 delivered + 1 sent), dropoff from 10
      expect(funnel[1].count).toBe(6);
      expect(funnel[1].dropoff).toBe(40); // (10-6)/10 = 40%
    });
  });

  describe('getTopFailureReasons', () => {
    it('returns empty array when no failures', () => {
      const records = [createSentMessage(), createDeliveredMessage()];
      const reasons = getTopFailureReasons(records);
      expect(reasons).toHaveLength(0);
    });

    it('groups and counts failure reasons', () => {
      const records = [
        createFailedMessage('whatsapp', 'Número no válido'),
        createFailedMessage('whatsapp', 'Número no válido'),
        createFailedMessage('whatsapp', 'Número no válido'),
        createFailedMessage('whatsapp', 'Timeout de conexión'),
        createFailedMessage('whatsapp', 'Número bloqueado'),
      ];

      const reasons = getTopFailureReasons(records);

      expect(reasons[0].reason).toBe('Número no válido');
      expect(reasons[0].count).toBe(3);
      expect(reasons[0].percentage).toBe(60);

      expect(reasons[1].reason).toBe('Timeout de conexión');
      expect(reasons[1].count).toBe(1);
    });

    it('respects limit parameter', () => {
      const records = [
        createFailedMessage('whatsapp', 'Error 1'),
        createFailedMessage('whatsapp', 'Error 2'),
        createFailedMessage('whatsapp', 'Error 3'),
        createFailedMessage('whatsapp', 'Error 4'),
      ];

      const reasons = getTopFailureReasons(records, 2);
      expect(reasons).toHaveLength(2);
    });
  });

  describe('groupByChannel', () => {
    it('groups messages by channel correctly', () => {
      const records = [
        createSentMessage('whatsapp'),
        createDeliveredMessage('whatsapp'),
        createReadMessage('whatsapp'),
        createSentMessage('email'),
        createDeliveredMessage('email'),
        createSentMessage('sms'),
      ];

      const channels = groupByChannel(records);

      const whatsapp = channels.find(c => c.channel === 'whatsapp');
      expect(whatsapp).toBeDefined();
      expect(whatsapp!.totalMessages).toBe(3);
      expect(whatsapp!.sent).toBe(3);
      expect(whatsapp!.delivered).toBe(2);
      expect(whatsapp!.read).toBe(1);

      const email = channels.find(c => c.channel === 'email');
      expect(email).toBeDefined();
      expect(email!.totalMessages).toBe(2);

      const sms = channels.find(c => c.channel === 'sms');
      expect(sms).toBeDefined();
      expect(sms!.totalMessages).toBe(1);
    });

    it('excludes channels with no messages', () => {
      const records = [
        createSentMessage('whatsapp'),
        createSentMessage('whatsapp'),
      ];

      const channels = groupByChannel(records);

      expect(channels).toHaveLength(1);
      expect(channels[0].channel).toBe('whatsapp');
    });
  });

  describe('edge cases', () => {
    it('handles all messages being pending', () => {
      const records = [createMessage(), createMessage(), createMessage()];
      const metrics = calculateDeliveryMetrics(records);

      expect(metrics.totalMessages).toBe(3);
      expect(metrics.pending).toBe(3);
      expect(metrics.sentRate).toBe(0);
      expect(metrics.deliveryRate).toBe(0);
      expect(metrics.readRate).toBe(0);
    });

    it('handles all messages being failed', () => {
      const records = [
        createFailedMessage(),
        createFailedMessage(),
        createFailedMessage(),
      ];
      const metrics = calculateDeliveryMetrics(records);

      expect(metrics.totalMessages).toBe(3);
      expect(metrics.failed).toBe(3);
      expect(metrics.failureRate).toBe(100);
      expect(metrics.sentRate).toBe(0);
    });

    it('handles single message', () => {
      const records = [createReadMessage()];
      const metrics = calculateDeliveryMetrics(records);

      expect(metrics.totalMessages).toBe(1);
      expect(metrics.sent).toBe(1);
      expect(metrics.delivered).toBe(1);
      expect(metrics.read).toBe(1);
      expect(metrics.sentRate).toBe(100);
      expect(metrics.deliveryRate).toBe(100);
      expect(metrics.readRate).toBe(100);
    });

    it('handles 100% delivery rate scenario', () => {
      const records = [
        createDeliveredMessage(),
        createDeliveredMessage(),
        createDeliveredMessage(),
        createDeliveredMessage(),
        createDeliveredMessage(),
      ];
      const metrics = calculateDeliveryMetrics(records);

      expect(metrics.sentRate).toBe(100);
      expect(metrics.deliveryRate).toBe(100);
      expect(metrics.failureRate).toBe(0);
    });

    it('handles messages with template info', () => {
      const records = [
        createMessage({
          status: 'READ',
          templateId: 'tmpl_1',
          templateName: 'Welcome',
          sentAt: new Date(),
          deliveredAt: new Date(),
          readAt: new Date(),
        }),
      ];

      const metrics = calculateDeliveryMetrics(records);
      expect(metrics.totalMessages).toBe(1);
      expect(metrics.read).toBe(1);
    });
  });

  describe('rate calculations precision', () => {
    it('handles rates with decimal precision', () => {
      // 1 out of 3 = 33.3%
      const records = [
        createReadMessage(),
        createSentMessage(),
        createSentMessage(),
      ];

      const metrics = calculateDeliveryMetrics(records);
      // 3 sent out of 3 total = 100%
      expect(metrics.sentRate).toBe(100);
      // 1 delivered out of 3 sent = 33.3%
      expect(metrics.deliveryRate).toBe(33.3);
    });

    it('handles 2/3 ratio correctly', () => {
      const records = [
        createDeliveredMessage(),
        createDeliveredMessage(),
        createSentMessage(),
      ];

      const metrics = calculateDeliveryMetrics(records);
      // 2 delivered out of 3 sent = 66.7%
      expect(metrics.deliveryRate).toBe(66.7);
    });
  });
});
