// /src/core/inbox/types.ts
// Tipos para el sistema de Inbox centralizado

/**
 * Fuentes de eventos soportadas
 */
export type EventSource =
  | 'chatea'      // WhatsApp via Chatea
  | 'dropi'       // Plataforma Dropi
  | 'shopify'     // E-commerce Shopify
  | 'manual'      // Entrada manual
  | 'internal';   // Sistema interno

/**
 * Tipos de eventos normalizados
 */
export type EventType =
  | 'order.upsert'         // Crear o actualizar orden
  | 'order.status_update'  // Cambio de estado
  | 'order.cancelled'      // Orden cancelada
  | 'shipping.created'     // Guía creada
  | 'shipping.delivered'   // Entregado
  | 'shipping.failed'      // Fallo en entrega
  | 'customer.message'     // Mensaje del cliente
  | 'alert.risk'           // Alerta de riesgo
  | 'unknown';             // No reconocido

/**
 * Información del cliente (PII - manejar con cuidado)
 */
export interface CustomerInfo {
  name: string | null;
  surname: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
}

/**
 * Item de una orden
 */
export interface OrderItem {
  productId: string | null;
  variationId: string | null;
  quantity: number | null;
  sku: string | null;
  name: string | null;
}

/**
 * Datos normalizados del evento
 */
export interface EventData {
  orderId: string;
  status: string;
  shippingGuide: string | null;
  shippingCompany: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  total: number | null;
  rateType: string | null;
  customer: CustomerInfo;
  items: OrderItem[];
}

/**
 * Evento de Inbox normalizado
 * Este es el formato estándar para todos los eventos entrantes
 */
export interface InboxEvent {
  /** Fuente del evento */
  source: EventSource;

  /** Tipo de evento normalizado */
  eventType: EventType;

  /** Timestamp de cuando ocurrió el evento */
  occurredAt: string;

  /** Clave única para idempotencia (dedupe) */
  idempotencyKey: string;

  /** Payload original sin modificar (para debugging) */
  raw: unknown;

  /** Datos normalizados y estructurados */
  data: EventData;
}

/**
 * Resultado del dispatch de un evento
 */
export interface DispatchResult {
  success: boolean;
  action: string;
  orderId?: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Orden para upsert en la base de datos
 */
export interface OrderUpsert {
  id: string;
  externalId: string;
  source: EventSource;
  status: string;
  statusHistory: StatusHistoryEntry[];
  shippingGuide: string | null;
  shippingCompany: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  total: number | null;
  rateType: string | null;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  customerAddress: string | null;
  items: OrderItem[];
  riskScore: number;
  riskFactors: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Entrada en el historial de estados
 */
export interface StatusHistoryEntry {
  status: string;
  timestamp: string;
  source: EventSource;
}

/**
 * Configuración del webhook
 */
export interface WebhookConfig {
  secret: string;
  allowedIps?: string[];
  rateLimit?: number;
}
