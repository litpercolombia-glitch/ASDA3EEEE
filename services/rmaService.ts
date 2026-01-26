/**
 * RMA Service - Returns Management
 *
 * Servicio para gestión de devoluciones (RMA - Return Merchandise Authorization).
 */

import type {
  ReturnRequest,
  ReturnStatus,
  ReturnReason,
  ReturnItem,
  ReturnNote,
} from '@/types/customerPortal.types';

// ============================================
// STORAGE KEY
// ============================================

const STORAGE_KEY = 'litper_rma_requests';

// ============================================
// TIPOS ADICIONALES
// ============================================

export interface RMAFilters {
  search?: string;
  status?: ReturnStatus[];
  reason?: ReturnReason[];
  dateFrom?: Date;
  dateTo?: Date;
  customerId?: string;
}

export interface RMAStats {
  total: number;
  pending: number;
  approved: number;
  inTransit: number;
  received: number;
  resolved: number;
  rejected: number;
  totalRefundAmount: number;
  averageResolutionDays: number;
  byReason: Record<ReturnReason, number>;
}

export interface RMAPolicy {
  maxDaysToReturn: number;
  requiresPhotos: boolean;
  requiresOriginalPackaging: boolean;
  allowedReasons: ReturnReason[];
  restockingFeePercentage: number;
  freeReturnShipping: boolean;
  refundMethods: ('original_payment' | 'store_credit' | 'bank_transfer')[];
}

// ============================================
// POLÍTICA POR DEFECTO
// ============================================

const DEFAULT_POLICY: RMAPolicy = {
  maxDaysToReturn: 30,
  requiresPhotos: true,
  requiresOriginalPackaging: false,
  allowedReasons: [
    'defective',
    'wrong_item',
    'not_as_described',
    'damaged',
    'no_longer_needed',
    'size_exchange',
    'color_exchange',
  ],
  restockingFeePercentage: 0,
  freeReturnShipping: true,
  refundMethods: ['original_payment', 'store_credit'],
};

// ============================================
// CLASE PRINCIPAL
// ============================================

class RMAService {
  private requests: Map<string, ReturnRequest> = new Map();
  private policy: RMAPolicy = DEFAULT_POLICY;

  constructor() {
    this.loadFromStorage();
  }

  // ============================================
  // STORAGE
  // ============================================

  private loadFromStorage(): void {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const requests: ReturnRequest[] = JSON.parse(stored);
      requests.forEach(req => this.requests.set(req.id, req));
    }
  }

  private save(): void {
    const requests = Array.from(this.requests.values());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
  }

  // ============================================
  // CRUD
  // ============================================

  /**
   * Obtiene todas las solicitudes con filtros opcionales
   */
  getAll(filters?: RMAFilters): ReturnRequest[] {
    let requests = Array.from(this.requests.values());

    if (filters) {
      if (filters.search) {
        const search = filters.search.toLowerCase();
        requests = requests.filter(req =>
          req.requestNumber.toLowerCase().includes(search) ||
          req.orderNumber.toLowerCase().includes(search)
        );
      }

      if (filters.status?.length) {
        requests = requests.filter(req => filters.status!.includes(req.status));
      }

      if (filters.reason?.length) {
        requests = requests.filter(req => filters.reason!.includes(req.reason));
      }

      if (filters.dateFrom) {
        requests = requests.filter(req => new Date(req.createdAt) >= filters.dateFrom!);
      }

      if (filters.dateTo) {
        requests = requests.filter(req => new Date(req.createdAt) <= filters.dateTo!);
      }

      if (filters.customerId) {
        // Filtrar por cliente (si tuviéramos customerId en ReturnRequest)
      }
    }

    return requests.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  /**
   * Obtiene una solicitud por ID
   */
  getById(id: string): ReturnRequest | null {
    return this.requests.get(id) || null;
  }

  /**
   * Obtiene una solicitud por número
   */
  getByNumber(requestNumber: string): ReturnRequest | null {
    return Array.from(this.requests.values())
      .find(req => req.requestNumber === requestNumber) || null;
  }

  /**
   * Crea una nueva solicitud de devolución
   */
  create(data: {
    orderId: string;
    orderNumber: string;
    items: ReturnItem[];
    reason: ReturnReason;
    reasonDetails?: string;
    resolution: 'refund' | 'exchange' | 'store_credit';
    returnMethod: 'pickup' | 'dropoff' | 'mail';
    pickupAddress?: any;
  }): ReturnRequest {
    // Validar política
    this.validateAgainstPolicy(data);

    const now = new Date();
    const requestNumber = `RMA-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(this.requests.size + 1).padStart(4, '0')}`;

    const request: ReturnRequest = {
      id: `rma_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      requestNumber,
      orderId: data.orderId,
      orderNumber: data.orderNumber,
      status: 'pending',
      items: data.items,
      reason: data.reason,
      reasonDetails: data.reasonDetails,
      resolution: data.resolution,
      returnMethod: data.returnMethod,
      pickupAddress: data.pickupAddress,
      createdAt: now,
      approvedAt: null,
      receivedAt: null,
      resolvedAt: null,
      notes: [],
    };

    // Agregar nota inicial
    request.notes.push({
      id: `note_${Date.now()}`,
      author: 'system',
      message: `Solicitud de devolución creada. Motivo: ${this.getReasonLabel(data.reason)}`,
      createdAt: now,
    });

    this.requests.set(request.id, request);
    this.save();

    return request;
  }

  /**
   * Actualiza una solicitud
   */
  update(id: string, updates: Partial<ReturnRequest>): ReturnRequest {
    const request = this.requests.get(id);
    if (!request) throw new Error('Solicitud no encontrada');

    const updated: ReturnRequest = {
      ...request,
      ...updates,
    };

    this.requests.set(id, updated);
    this.save();

    return updated;
  }

  // ============================================
  // FLUJO DE ESTADOS
  // ============================================

  /**
   * Aprueba una solicitud
   */
  approve(id: string, note?: string): ReturnRequest {
    const request = this.requests.get(id);
    if (!request) throw new Error('Solicitud no encontrada');

    if (request.status !== 'pending') {
      throw new Error('Solo se pueden aprobar solicitudes pendientes');
    }

    request.status = 'approved';
    request.approvedAt = new Date();

    // Generar etiqueta de devolución si aplica
    if (request.returnMethod === 'mail' || request.returnMethod === 'dropoff') {
      request.returnLabel = this.generateReturnLabel(request);
    }

    // Agregar nota
    request.notes.push({
      id: `note_${Date.now()}`,
      author: 'support',
      message: note || 'Solicitud de devolución aprobada.',
      createdAt: new Date(),
    });

    this.save();
    return request;
  }

  /**
   * Rechaza una solicitud
   */
  reject(id: string, reason: string): ReturnRequest {
    const request = this.requests.get(id);
    if (!request) throw new Error('Solicitud no encontrada');

    if (request.status !== 'pending') {
      throw new Error('Solo se pueden rechazar solicitudes pendientes');
    }

    request.status = 'rejected';

    request.notes.push({
      id: `note_${Date.now()}`,
      author: 'support',
      message: `Solicitud rechazada: ${reason}`,
      createdAt: new Date(),
    });

    this.save();
    return request;
  }

  /**
   * Marca el producto como en tránsito (cliente envió el paquete)
   */
  markInTransit(id: string, trackingNumber: string): ReturnRequest {
    const request = this.requests.get(id);
    if (!request) throw new Error('Solicitud no encontrada');

    if (request.status !== 'approved') {
      throw new Error('La solicitud debe estar aprobada');
    }

    request.status = 'in_transit';
    request.returnTrackingNumber = trackingNumber;

    request.notes.push({
      id: `note_${Date.now()}`,
      author: 'system',
      message: `Producto enviado. Tracking: ${trackingNumber}`,
      createdAt: new Date(),
    });

    this.save();
    return request;
  }

  /**
   * Marca el producto como recibido
   */
  markReceived(id: string, note?: string): ReturnRequest {
    const request = this.requests.get(id);
    if (!request) throw new Error('Solicitud no encontrada');

    request.status = 'received';
    request.receivedAt = new Date();

    request.notes.push({
      id: `note_${Date.now()}`,
      author: 'support',
      message: note || 'Producto recibido en almacén.',
      createdAt: new Date(),
    });

    this.save();
    return request;
  }

  /**
   * Inicia la inspección del producto
   */
  startInspection(id: string): ReturnRequest {
    const request = this.requests.get(id);
    if (!request) throw new Error('Solicitud no encontrada');

    if (request.status !== 'received') {
      throw new Error('El producto debe estar recibido');
    }

    request.status = 'inspecting';

    request.notes.push({
      id: `note_${Date.now()}`,
      author: 'system',
      message: 'Producto en proceso de inspección.',
      createdAt: new Date(),
    });

    this.save();
    return request;
  }

  /**
   * Resuelve la solicitud (completa el reembolso/cambio)
   */
  resolve(
    id: string,
    resolution: {
      approved: boolean;
      refundAmount?: number;
      refundMethod?: string;
      note?: string;
    }
  ): ReturnRequest {
    const request = this.requests.get(id);
    if (!request) throw new Error('Solicitud no encontrada');

    request.status = 'resolved';
    request.resolvedAt = new Date();

    if (resolution.refundAmount) {
      request.refundAmount = resolution.refundAmount;
      request.refundMethod = resolution.refundMethod;
      request.refundStatus = 'pending';
    }

    request.notes.push({
      id: `note_${Date.now()}`,
      author: 'support',
      message: resolution.note || `Devolución resuelta. ${resolution.refundAmount ? `Reembolso: $${resolution.refundAmount.toLocaleString()}` : ''}`,
      createdAt: new Date(),
    });

    this.save();
    return request;
  }

  /**
   * Cancela una solicitud
   */
  cancel(id: string, reason: string): ReturnRequest {
    const request = this.requests.get(id);
    if (!request) throw new Error('Solicitud no encontrada');

    if (['resolved', 'cancelled'].includes(request.status)) {
      throw new Error('No se puede cancelar esta solicitud');
    }

    request.status = 'cancelled';

    request.notes.push({
      id: `note_${Date.now()}`,
      author: 'customer',
      message: `Solicitud cancelada: ${reason}`,
      createdAt: new Date(),
    });

    this.save();
    return request;
  }

  // ============================================
  // NOTAS
  // ============================================

  /**
   * Agrega una nota a la solicitud
   */
  addNote(
    id: string,
    note: {
      author: 'customer' | 'support';
      message: string;
      attachments?: string[];
    }
  ): ReturnRequest {
    const request = this.requests.get(id);
    if (!request) throw new Error('Solicitud no encontrada');

    request.notes.push({
      id: `note_${Date.now()}`,
      author: note.author,
      message: note.message,
      attachments: note.attachments,
      createdAt: new Date(),
    });

    this.save();
    return request;
  }

  // ============================================
  // UTILIDADES
  // ============================================

  /**
   * Genera una etiqueta de devolución (simulado)
   */
  private generateReturnLabel(request: ReturnRequest): string {
    // En producción, esto integraría con la API de la transportadora
    return `RETURN-${request.requestNumber}-${Date.now()}`;
  }

  /**
   * Valida contra la política de devoluciones
   */
  private validateAgainstPolicy(data: {
    reason: ReturnReason;
    items: ReturnItem[];
  }): void {
    if (!this.policy.allowedReasons.includes(data.reason)) {
      throw new Error(`El motivo "${this.getReasonLabel(data.reason)}" no está permitido para devoluciones`);
    }

    if (this.policy.requiresPhotos) {
      const itemsWithoutPhotos = data.items.filter(item =>
        !item.photos || item.photos.length === 0
      );
      if (itemsWithoutPhotos.length > 0) {
        throw new Error('Se requieren fotos de los productos a devolver');
      }
    }
  }

  /**
   * Obtiene la etiqueta de un motivo
   */
  getReasonLabel(reason: ReturnReason): string {
    const labels: Record<ReturnReason, string> = {
      defective: 'Producto defectuoso',
      wrong_item: 'Producto equivocado',
      not_as_described: 'No es como se describía',
      damaged: 'Dañado en transporte',
      no_longer_needed: 'Ya no lo necesito',
      size_exchange: 'Cambio de talla',
      color_exchange: 'Cambio de color',
      better_price: 'Encontré mejor precio',
      other: 'Otro',
    };
    return labels[reason] || reason;
  }

  /**
   * Obtiene la etiqueta de un estado
   */
  getStatusLabel(status: ReturnStatus): string {
    const labels: Record<ReturnStatus, string> = {
      pending: 'Pendiente de aprobación',
      approved: 'Aprobada',
      rejected: 'Rechazada',
      in_transit: 'Producto en camino',
      received: 'Producto recibido',
      inspecting: 'En inspección',
      resolved: 'Resuelta',
      cancelled: 'Cancelada',
    };
    return labels[status] || status;
  }

  // ============================================
  // ESTADÍSTICAS
  // ============================================

  /**
   * Obtiene estadísticas de devoluciones
   */
  getStats(filters?: RMAFilters): RMAStats {
    const requests = this.getAll(filters);

    const stats: RMAStats = {
      total: requests.length,
      pending: 0,
      approved: 0,
      inTransit: 0,
      received: 0,
      resolved: 0,
      rejected: 0,
      totalRefundAmount: 0,
      averageResolutionDays: 0,
      byReason: {
        defective: 0,
        wrong_item: 0,
        not_as_described: 0,
        damaged: 0,
        no_longer_needed: 0,
        size_exchange: 0,
        color_exchange: 0,
        better_price: 0,
        other: 0,
      },
    };

    let totalResolutionDays = 0;
    let resolvedCount = 0;

    for (const request of requests) {
      // Por estado
      switch (request.status) {
        case 'pending': stats.pending++; break;
        case 'approved': stats.approved++; break;
        case 'in_transit': stats.inTransit++; break;
        case 'received':
        case 'inspecting': stats.received++; break;
        case 'resolved': stats.resolved++; break;
        case 'rejected': stats.rejected++; break;
      }

      // Por motivo
      stats.byReason[request.reason]++;

      // Reembolsos
      if (request.refundAmount) {
        stats.totalRefundAmount += request.refundAmount;
      }

      // Tiempo de resolución
      if (request.resolvedAt && request.createdAt) {
        const days = Math.ceil(
          (new Date(request.resolvedAt).getTime() - new Date(request.createdAt).getTime()) /
          (1000 * 60 * 60 * 24)
        );
        totalResolutionDays += days;
        resolvedCount++;
      }
    }

    stats.averageResolutionDays = resolvedCount > 0
      ? Math.round(totalResolutionDays / resolvedCount)
      : 0;

    return stats;
  }

  // ============================================
  // POLÍTICA
  // ============================================

  /**
   * Obtiene la política de devoluciones
   */
  getPolicy(): RMAPolicy {
    return { ...this.policy };
  }

  /**
   * Actualiza la política de devoluciones
   */
  updatePolicy(updates: Partial<RMAPolicy>): void {
    this.policy = {
      ...this.policy,
      ...updates,
    };
    localStorage.setItem('litper_rma_policy', JSON.stringify(this.policy));
  }
}

// ============================================
// SINGLETON
// ============================================

export const rmaService = new RMAService();

// ============================================
// HOOK
// ============================================

export function useRMA() {
  return {
    getAll: rmaService.getAll.bind(rmaService),
    getById: rmaService.getById.bind(rmaService),
    create: rmaService.create.bind(rmaService),
    approve: rmaService.approve.bind(rmaService),
    reject: rmaService.reject.bind(rmaService),
    markInTransit: rmaService.markInTransit.bind(rmaService),
    markReceived: rmaService.markReceived.bind(rmaService),
    resolve: rmaService.resolve.bind(rmaService),
    cancel: rmaService.cancel.bind(rmaService),
    addNote: rmaService.addNote.bind(rmaService),
    getStats: rmaService.getStats.bind(rmaService),
    getPolicy: rmaService.getPolicy.bind(rmaService),
    getReasonLabel: rmaService.getReasonLabel.bind(rmaService),
    getStatusLabel: rmaService.getStatusLabel.bind(rmaService),
  };
}

export default rmaService;
