// services/integrations/UnifiedDataService.ts
// Servicio de datos unificado - Combina Litper + Chatea

import { integrationManager } from './IntegrationManager';
import {
  Customer360,
  ChateaCustomer,
  ChateaOrder,
  ChateaChat,
  ChateaAnalytics,
  ShipmentReference,
} from '../../types/integrations';
import { Shipment } from '../../types';

class UnifiedDataServiceImpl {
  // ==================== VISTA 360 DEL CLIENTE ====================

  /**
   * Obtener vista completa de un cliente
   */
  async getCustomer360(phoneOrId: string): Promise<Customer360 | null> {
    try {
      // Obtener datos de Chatea
      const chateaProvider = integrationManager.getChateaProvider();
      let chateaCustomer: ChateaCustomer | null = null;
      let chateaOrders: ChateaOrder[] = [];
      let chateaChats: ChateaChat[] = [];

      if (chateaProvider) {
        const customers = await chateaProvider.getCustomers({ limit: 1 });
        chateaCustomer = customers.find(
          (c) => c.phone.includes(phoneOrId) || c.id === phoneOrId
        ) || null;

        if (chateaCustomer) {
          chateaOrders = await chateaProvider.getOrders({ limit: 100 });
          chateaOrders = chateaOrders.filter((o) => o.customerId === chateaCustomer!.id);

          chateaChats = await chateaProvider.getChats({ limit: 50 });
          chateaChats = chateaChats.filter((c) => c.customerId === chateaCustomer!.id);
        }
      }

      // Obtener datos de Litper (shipments locales)
      const shipments = this.getLocalShipments().filter(
        (s) => s.recipientPhone?.includes(phoneOrId) || s.senderPhone?.includes(phoneOrId)
      );

      if (!chateaCustomer && shipments.length === 0) {
        return null;
      }

      // Construir vista 360
      const customer360: Customer360 = {
        id: chateaCustomer?.id || phoneOrId,
        chateaId: chateaCustomer?.id,
        phone: chateaCustomer?.phone || phoneOrId,
        name: chateaCustomer?.name || shipments[0]?.recipientName || 'Cliente',
        email: chateaCustomer?.email,
        address: chateaCustomer?.address || shipments[0]?.destination,
        city: chateaCustomer?.city || shipments[0]?.destinationCity,

        lifetimeValue: chateaCustomer?.lifetimeValue || 0,
        ordersCount: chateaOrders.length,
        shipmentsCount: shipments.length,
        issuesCount: shipments.filter((s) => s.status === 'issue').length,

        orders: chateaOrders,
        shipments: shipments.map((s) => ({
          id: s.id || '',
          trackingNumber: s.trackingNumber,
          carrier: s.carrier,
          status: s.status,
          createdAt: s.createdAt || new Date(),
          deliveredAt: s.deliveredAt,
        })),
        chats: chateaChats,
        alerts: [],

        lastOrder: chateaOrders[0]?.createdAt,
        lastShipment: shipments[0]?.createdAt,
        lastChat: chateaChats[0]?.lastMessage,
        lastInteraction: this.getMostRecent([
          chateaOrders[0]?.createdAt,
          shipments[0]?.createdAt,
          chateaChats[0]?.lastMessage,
        ]),

        segment: this.calculateSegment(chateaCustomer, chateaOrders.length),
        avgOrderValue: chateaOrders.length > 0
          ? chateaOrders.reduce((sum, o) => sum + o.total, 0) / chateaOrders.length
          : 0,
        avgDeliveryTime: this.calculateAvgDeliveryTime(shipments),
      };

      return customer360;
    } catch (error) {
      console.error('[UnifiedData] Error obteniendo Customer360:', error);
      return null;
    }
  }

  // ==================== RESUMEN DEL NEGOCIO ====================

  /**
   * Obtener resumen unificado del negocio
   */
  async getBusinessSummary(): Promise<{
    sales: { today: number; week: number; month: number };
    orders: { pending: number; confirmed: number; shipped: number; delivered: number };
    shipments: { active: number; delayed: number; inOffice: number; delivered: number };
    chats: { active: number; waiting: number; resolved: number };
    alerts: { critical: number; warning: number; info: number };
  }> {
    const chateaProvider = integrationManager.getChateaProvider();
    const shipments = this.getLocalShipments();

    // Datos de Chatea
    let chateaSummary = {
      orders: { pending: 0, confirmed: 0, shipped: 0 },
      chats: { active: 0, waiting: 0 },
      sales: { today: 0, week: 0 },
    };

    if (chateaProvider) {
      chateaSummary = await chateaProvider.getBusinessSummary();
    }

    // Datos de Litper
    const shipmentStats = {
      active: shipments.filter((s) => !['delivered', 'returned', 'cancelled'].includes(s.status)).length,
      delayed: shipments.filter((s) => this.isDelayed(s)).length,
      inOffice: shipments.filter((s) => s.status === 'in_office').length,
      delivered: shipments.filter((s) => s.status === 'delivered').length,
    };

    return {
      sales: {
        today: chateaSummary.sales.today,
        week: chateaSummary.sales.week,
        month: chateaSummary.sales.week * 4, // Aproximado
      },
      orders: {
        pending: chateaSummary.orders.pending,
        confirmed: chateaSummary.orders.confirmed,
        shipped: chateaSummary.orders.shipped,
        delivered: shipmentStats.delivered,
      },
      shipments: shipmentStats,
      chats: {
        active: chateaSummary.chats.active,
        waiting: chateaSummary.chats.waiting,
        resolved: 0,
      },
      alerts: {
        critical: shipmentStats.delayed,
        warning: shipmentStats.inOffice,
        info: 0,
      },
    };
  }

  /**
   * Obtener analytics combinados
   */
  async getAnalytics(period: 'today' | 'week' | 'month' = 'today'): Promise<{
    chatea: ChateaAnalytics | null;
    shipments: {
      total: number;
      delivered: number;
      deliveryRate: number;
      avgDeliveryTime: number;
      byCarrier: Record<string, { total: number; delivered: number; rate: number }>;
    };
  }> {
    const chateaProvider = integrationManager.getChateaProvider();
    const shipments = this.getLocalShipments();

    // Analytics de Chatea
    let chateaAnalytics: ChateaAnalytics | null = null;
    if (chateaProvider) {
      chateaAnalytics = await chateaProvider.getAnalytics(period);
    }

    // Analytics de envíos
    const delivered = shipments.filter((s) => s.status === 'delivered');
    const byCarrier: Record<string, { total: number; delivered: number; rate: number }> = {};

    shipments.forEach((s) => {
      if (!byCarrier[s.carrier]) {
        byCarrier[s.carrier] = { total: 0, delivered: 0, rate: 0 };
      }
      byCarrier[s.carrier].total++;
      if (s.status === 'delivered') {
        byCarrier[s.carrier].delivered++;
      }
    });

    // Calcular tasas
    Object.keys(byCarrier).forEach((carrier) => {
      const stats = byCarrier[carrier];
      stats.rate = stats.total > 0 ? Math.round((stats.delivered / stats.total) * 100) : 0;
    });

    return {
      chatea: chateaAnalytics,
      shipments: {
        total: shipments.length,
        delivered: delivered.length,
        deliveryRate: shipments.length > 0
          ? Math.round((delivered.length / shipments.length) * 100)
          : 0,
        avgDeliveryTime: this.calculateAvgDeliveryTime(delivered),
        byCarrier,
      },
    };
  }

  // ==================== BÚSQUEDA UNIFICADA ====================

  /**
   * Buscar en todo el sistema
   */
  async search(query: string): Promise<{
    customers: Customer360[];
    orders: ChateaOrder[];
    shipments: Shipment[];
    chats: ChateaChat[];
  }> {
    const results = {
      customers: [] as Customer360[],
      orders: [] as ChateaOrder[],
      shipments: [] as Shipment[],
      chats: [] as ChateaChat[],
    };

    const lowerQuery = query.toLowerCase();

    // Buscar en shipments locales
    results.shipments = this.getLocalShipments().filter(
      (s) =>
        s.trackingNumber.toLowerCase().includes(lowerQuery) ||
        s.recipientName?.toLowerCase().includes(lowerQuery) ||
        s.recipientPhone?.includes(query)
    );

    // Buscar en Chatea
    const chateaProvider = integrationManager.getChateaProvider();
    if (chateaProvider) {
      const orders = await chateaProvider.getOrders({ limit: 100 });
      results.orders = orders.filter(
        (o) =>
          o.id.toLowerCase().includes(lowerQuery) ||
          o.customerName.toLowerCase().includes(lowerQuery) ||
          o.customerPhone.includes(query)
      );

      const chats = await chateaProvider.getChats({ limit: 100 });
      results.chats = chats.filter(
        (c) =>
          c.customerName.toLowerCase().includes(lowerQuery) ||
          c.customerPhone.includes(query)
      );
    }

    return results;
  }

  // ==================== ACCIONES UNIFICADAS ====================

  /**
   * Confirmar pedido y crear guía
   */
  async confirmOrderAndCreateShipment(
    orderId: string,
    carrier: string
  ): Promise<{ success: boolean; trackingNumber?: string; error?: string }> {
    const chateaProvider = integrationManager.getChateaProvider();

    if (!chateaProvider) {
      return { success: false, error: 'Chatea no está conectado' };
    }

    // Confirmar en Chatea
    const confirmed = await chateaProvider.confirmOrder(orderId);
    if (!confirmed) {
      return { success: false, error: 'No se pudo confirmar el pedido' };
    }

    // Aquí iría la lógica de crear guía con la transportadora
    const trackingNumber = `${carrier.substring(0, 3).toUpperCase()}${Date.now()}`;

    return { success: true, trackingNumber };
  }

  /**
   * Enviar notificación al cliente
   */
  async notifyCustomer(
    phone: string,
    message: string,
    templateId?: string
  ): Promise<boolean> {
    const chateaProvider = integrationManager.getChateaProvider();

    if (!chateaProvider) {
      console.warn('[UnifiedData] Chatea no conectado, no se puede enviar WhatsApp');
      return false;
    }

    return chateaProvider.sendWhatsApp(phone, message, templateId);
  }

  // ==================== UTILIDADES PRIVADAS ====================

  /**
   * Obtener shipments del store local
   */
  private getLocalShipments(): Shipment[] {
    // Intentar obtener del store global o localStorage
    try {
      const saved = localStorage.getItem('litper_shipments');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Ignorar
    }
    return [];
  }

  /**
   * Verificar si un envío está retrasado
   */
  private isDelayed(shipment: Shipment): boolean {
    if (shipment.status === 'delivered') return false;

    const daysSinceCreation = shipment.createdAt
      ? Math.floor((Date.now() - new Date(shipment.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    return daysSinceCreation > 5;
  }

  /**
   * Calcular tiempo promedio de entrega
   */
  private calculateAvgDeliveryTime(shipments: (Shipment | ShipmentReference)[]): number {
    const delivered = shipments.filter((s) => 'deliveredAt' in s && s.deliveredAt);
    if (delivered.length === 0) return 0;

    const totalDays = delivered.reduce((sum, s) => {
      const created = 'createdAt' in s ? new Date(s.createdAt) : new Date();
      const deliveredAt = 'deliveredAt' in s && s.deliveredAt ? new Date(s.deliveredAt) : new Date();
      const days = Math.floor((deliveredAt.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
      return sum + days;
    }, 0);

    return Math.round(totalDays / delivered.length);
  }

  /**
   * Obtener fecha más reciente
   */
  private getMostRecent(dates: (Date | undefined)[]): Date | undefined {
    const validDates = dates.filter((d) => d) as Date[];
    if (validDates.length === 0) return undefined;
    return new Date(Math.max(...validDates.map((d) => d.getTime())));
  }

  /**
   * Calcular segmento del cliente
   */
  private calculateSegment(
    customer: ChateaCustomer | null,
    ordersCount: number
  ): Customer360['segment'] {
    if (!customer) return 'new';

    if (customer.lifetimeValue > 500000) return 'vip';
    if (ordersCount === 0) return 'new';

    const daysSinceLastOrder = customer.lastOrder
      ? Math.floor((Date.now() - new Date(customer.lastOrder).getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    if (daysSinceLastOrder > 60) return 'inactive';
    if (daysSinceLastOrder > 30) return 'at_risk';

    return 'regular';
  }
}

// Singleton
export const unifiedDataService = new UnifiedDataServiceImpl();
export default unifiedDataService;
