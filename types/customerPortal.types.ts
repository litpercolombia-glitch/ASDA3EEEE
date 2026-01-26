/**
 * Customer Portal Types
 *
 * Tipos para el portal de autoservicio de clientes.
 */

// ============================================
// CLIENTE
// ============================================

export interface PortalCustomer {
  id: string;
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
  company?: string;
  documentType: 'CC' | 'CE' | 'NIT' | 'PP';
  documentNumber: string;
  addresses: CustomerAddress[];
  defaultAddressId?: string;
  preferences: CustomerPreferences;
  stats: CustomerStats;
  isVerified: boolean;
  createdAt: Date;
  lastLoginAt: Date | null;
}

export interface CustomerAddress {
  id: string;
  label: string;           // "Casa", "Oficina", etc.
  recipientName: string;
  phone: string;
  address: string;
  addressLine2?: string;
  city: string;
  cityCode: string;
  department: string;
  departmentCode: string;
  postalCode?: string;
  instructions?: string;   // Instrucciones de entrega
  isDefault: boolean;
}

export interface CustomerPreferences {
  language: 'es' | 'en';
  notifications: {
    email: boolean;
    sms: boolean;
    whatsapp: boolean;
    push: boolean;
  };
  notifyOn: {
    orderConfirmed: boolean;
    orderShipped: boolean;
    outForDelivery: boolean;
    delivered: boolean;
    exceptions: boolean;
  };
  currency: string;
}

export interface CustomerStats {
  totalOrders: number;
  totalShipments: number;
  totalSpent: number;
  pendingDeliveries: number;
  completedDeliveries: number;
  returnRequests: number;
  memberSince: Date;
}

// ============================================
// ENVÍOS DEL CLIENTE
// ============================================

export interface CustomerShipment {
  id: string;
  trackingNumber: string;
  orderId?: string;
  orderNumber?: string;
  status: ShipmentStatus;
  carrier: string;
  carrierLogo?: string;

  // Origen
  originCity: string;
  originAddress?: string;

  // Destino
  destinationCity: string;
  destinationAddress: string;
  recipientName: string;
  recipientPhone?: string;

  // Fechas
  createdAt: Date;
  shippedAt: Date | null;
  estimatedDelivery: Date | null;
  deliveredAt: Date | null;

  // Paquete
  packageInfo: {
    weight: number;
    dimensions?: { length: number; width: number; height: number };
    description?: string;
    declaredValue?: number;
  };

  // Tracking
  events: TrackingEvent[];
  currentLocation?: string;

  // Documentos
  documents: {
    label?: string;
    invoice?: string;
    pod?: string;  // Proof of delivery
  };

  // Acciones disponibles
  actions: {
    canRequestReturn: boolean;
    canChangeAddress: boolean;
    canReschedule: boolean;
    canAddInstructions: boolean;
  };
}

export type ShipmentStatus =
  | 'pending'           // Pendiente de recolección
  | 'picked_up'         // Recogido
  | 'in_transit'        // En tránsito
  | 'in_customs'        // En aduana
  | 'out_for_delivery'  // En reparto
  | 'delivered'         // Entregado
  | 'failed_attempt'    // Intento fallido
  | 'returned'          // Devuelto
  | 'exception'         // Excepción
  | 'cancelled';        // Cancelado

export interface TrackingEvent {
  id: string;
  status: ShipmentStatus;
  description: string;
  location?: string;
  timestamp: Date;
  isSignificant: boolean;  // Mostrar en timeline principal
}

// ============================================
// ÓRDENES
// ============================================

export interface CustomerOrder {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;

  // Items
  items: OrderItem[];
  itemCount: number;

  // Totales
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
  currency: string;

  // Pago
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'partial_refund';
  paymentMethod?: string;

  // Envíos asociados
  shipments: CustomerShipment[];

  // Facturación
  billingAddress?: CustomerAddress;
  invoiceId?: string;
  invoiceUrl?: string;
}

export type OrderStatus =
  | 'pending'           // Pendiente
  | 'confirmed'         // Confirmada
  | 'processing'        // En proceso
  | 'shipped'           // Enviada
  | 'partially_shipped' // Parcialmente enviada
  | 'delivered'         // Entregada
  | 'completed'         // Completada
  | 'cancelled'         // Cancelada
  | 'refunded';         // Reembolsada

export interface OrderItem {
  id: string;
  productId?: string;
  sku?: string;
  name: string;
  description?: string;
  imageUrl?: string;
  quantity: number;
  unitPrice: number;
  total: number;
  status: 'pending' | 'shipped' | 'delivered' | 'returned';
}

// ============================================
// DEVOLUCIONES
// ============================================

export interface ReturnRequest {
  id: string;
  requestNumber: string;
  orderId: string;
  orderNumber: string;
  status: ReturnStatus;

  // Items a devolver
  items: ReturnItem[];

  // Motivo
  reason: ReturnReason;
  reasonDetails?: string;

  // Resolución preferida
  resolution: 'refund' | 'exchange' | 'store_credit';

  // Logística
  returnMethod: 'pickup' | 'dropoff' | 'mail';
  pickupAddress?: CustomerAddress;
  returnLabel?: string;
  returnTrackingNumber?: string;

  // Fechas
  createdAt: Date;
  approvedAt: Date | null;
  receivedAt: Date | null;
  resolvedAt: Date | null;

  // Reembolso
  refundAmount?: number;
  refundMethod?: string;
  refundStatus?: 'pending' | 'processing' | 'completed';

  // Comunicación
  notes: ReturnNote[];
}

export type ReturnStatus =
  | 'pending'           // Pendiente de aprobación
  | 'approved'          // Aprobada
  | 'rejected'          // Rechazada
  | 'in_transit'        // Producto en camino
  | 'received'          // Producto recibido
  | 'inspecting'        // En inspección
  | 'resolved'          // Resuelta
  | 'cancelled';        // Cancelada

export type ReturnReason =
  | 'defective'         // Producto defectuoso
  | 'wrong_item'        // Producto equivocado
  | 'not_as_described'  // No es como se describía
  | 'damaged'           // Dañado en transporte
  | 'no_longer_needed'  // Ya no lo necesito
  | 'size_exchange'     // Cambio de talla
  | 'color_exchange'    // Cambio de color
  | 'better_price'      // Encontré mejor precio
  | 'other';            // Otro

export interface ReturnItem {
  orderItemId: string;
  productName: string;
  sku?: string;
  quantity: number;
  reason: ReturnReason;
  condition: 'unopened' | 'opened' | 'used' | 'damaged';
  photos?: string[];
}

export interface ReturnNote {
  id: string;
  author: 'customer' | 'support';
  message: string;
  attachments?: string[];
  createdAt: Date;
}

// ============================================
// TICKETS DE SOPORTE
// ============================================

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  category: TicketCategory;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: TicketStatus;

  // Relaciones
  orderId?: string;
  shipmentId?: string;
  returnId?: string;

  // Mensajes
  messages: TicketMessage[];

  // Asignación
  assignedTo?: string;
  assignedTeam?: string;

  // Fechas
  createdAt: Date;
  updatedAt: Date;
  resolvedAt: Date | null;
  firstResponseAt: Date | null;

  // Satisfacción
  rating?: number;
  feedback?: string;
}

export type TicketCategory =
  | 'shipping'          // Problemas de envío
  | 'order'             // Problemas con pedido
  | 'return'            // Devoluciones
  | 'billing'           // Facturación
  | 'product'           // Información de producto
  | 'account'           // Cuenta
  | 'technical'         // Soporte técnico
  | 'other';            // Otro

export type TicketStatus =
  | 'open'              // Abierto
  | 'pending_customer'  // Esperando respuesta del cliente
  | 'pending_support'   // Esperando respuesta de soporte
  | 'in_progress'       // En progreso
  | 'resolved'          // Resuelto
  | 'closed';           // Cerrado

export interface TicketMessage {
  id: string;
  author: 'customer' | 'support' | 'system';
  authorName?: string;
  message: string;
  attachments?: TicketAttachment[];
  createdAt: Date;
  isInternal?: boolean;  // Solo visible para soporte
}

export interface TicketAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
}

// ============================================
// DASHBOARD DEL PORTAL
// ============================================

export interface PortalDashboard {
  customer: PortalCustomer;

  // Resumen rápido
  summary: {
    activeShipments: number;
    pendingDeliveries: number;
    openReturns: number;
    openTickets: number;
  };

  // Envíos recientes
  recentShipments: CustomerShipment[];

  // Órdenes recientes
  recentOrders: CustomerOrder[];

  // Notificaciones
  notifications: PortalNotification[];

  // Acciones rápidas disponibles
  quickActions: QuickAction[];
}

export interface PortalNotification {
  id: string;
  type: 'shipment' | 'order' | 'return' | 'ticket' | 'promo' | 'system';
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: Date;
}

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  action: string;
  params?: Record<string, string>;
}

// ============================================
// AUTENTICACIÓN DEL PORTAL
// ============================================

export interface PortalAuthState {
  isAuthenticated: boolean;
  customer: PortalCustomer | null;
  token: string | null;
  expiresAt: Date | null;
}

export interface PortalLoginRequest {
  email: string;
  password?: string;
  otp?: string;
  method: 'password' | 'otp' | 'magic_link';
}

export interface PortalRegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  company?: string;
  documentType: 'CC' | 'CE' | 'NIT' | 'PP';
  documentNumber: string;
  acceptTerms: boolean;
  acceptMarketing?: boolean;
}
