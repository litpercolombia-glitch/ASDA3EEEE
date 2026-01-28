/**
 * Shopify Integration Service
 *
 * Servicio para integración con Shopify API.
 * Maneja autenticación, sincronización y operaciones CRUD.
 */

import type {
  ShopifyConnection,
  ShopifyShop,
  ShopifyProduct,
  ShopifyOrder,
  ShopifyCustomer,
  ShopifyFulfillment,
  ShopifyInventoryLevel,
  ShopifyLocation,
  ShopifySyncStatus,
  ShopifySyncOptions,
  ShopifyCreateFulfillment,
  ProductMapping,
  OrderMapping,
  ShopifyWebhook,
  ShopifyWebhookTopic,
  ShopifyScope,
} from '@/types/shopify.types';

// ============================================
// CONFIGURACIÓN
// ============================================

const SHOPIFY_API_VERSION = '2024-01';
const STORAGE_KEY = 'litper_shopify_connection';
const MAPPINGS_KEY = 'litper_shopify_mappings';

interface ShopifyServiceConfig {
  shopDomain: string;
  accessToken: string;
}

// ============================================
// CLASE PRINCIPAL
// ============================================

class ShopifyService {
  private config: ShopifyServiceConfig | null = null;
  private baseUrl: string = '';

  /**
   * Inicializa el servicio con las credenciales
   */
  init(config: ShopifyServiceConfig): void {
    this.config = config;
    this.baseUrl = `https://${config.shopDomain}/admin/api/${SHOPIFY_API_VERSION}`;
  }

  /**
   * Verifica si el servicio está configurado
   */
  isConfigured(): boolean {
    return this.config !== null;
  }

  /**
   * Obtiene los headers para las peticiones
   */
  private getHeaders(): HeadersInit {
    if (!this.config) throw new Error('Shopify service not configured');
    return {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': this.config.accessToken,
    };
  }

  /**
   * Realiza una petición a la API de Shopify
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    if (!this.config) throw new Error('Shopify service not configured');

    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.errors
          ? JSON.stringify(error.errors)
          : `Shopify API error: ${response.status}`
      );
    }

    return response.json();
  }

  // ============================================
  // TIENDA
  // ============================================

  /**
   * Obtiene información de la tienda
   */
  async getShop(): Promise<ShopifyShop> {
    const data = await this.request<{ shop: ShopifyShop }>('/shop.json');
    return data.shop;
  }

  // ============================================
  // PRODUCTOS
  // ============================================

  /**
   * Lista todos los productos
   */
  async getProducts(params?: {
    limit?: number;
    since_id?: number;
    created_at_min?: string;
    updated_at_min?: string;
    status?: 'active' | 'archived' | 'draft';
  }): Promise<ShopifyProduct[]> {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.since_id) searchParams.set('since_id', params.since_id.toString());
    if (params?.created_at_min) searchParams.set('created_at_min', params.created_at_min);
    if (params?.updated_at_min) searchParams.set('updated_at_min', params.updated_at_min);
    if (params?.status) searchParams.set('status', params.status);

    const query = searchParams.toString();
    const data = await this.request<{ products: ShopifyProduct[] }>(
      `/products.json${query ? `?${query}` : ''}`
    );
    return data.products;
  }

  /**
   * Obtiene un producto por ID
   */
  async getProduct(id: number): Promise<ShopifyProduct> {
    const data = await this.request<{ product: ShopifyProduct }>(`/products/${id}.json`);
    return data.product;
  }

  /**
   * Crea un nuevo producto
   */
  async createProduct(product: Partial<ShopifyProduct>): Promise<ShopifyProduct> {
    const data = await this.request<{ product: ShopifyProduct }>('/products.json', {
      method: 'POST',
      body: JSON.stringify({ product }),
    });
    return data.product;
  }

  /**
   * Actualiza un producto
   */
  async updateProduct(id: number, product: Partial<ShopifyProduct>): Promise<ShopifyProduct> {
    const data = await this.request<{ product: ShopifyProduct }>(`/products/${id}.json`, {
      method: 'PUT',
      body: JSON.stringify({ product }),
    });
    return data.product;
  }

  /**
   * Elimina un producto
   */
  async deleteProduct(id: number): Promise<void> {
    await this.request(`/products/${id}.json`, {
      method: 'DELETE',
    });
  }

  // ============================================
  // ÓRDENES
  // ============================================

  /**
   * Lista órdenes
   */
  async getOrders(params?: {
    limit?: number;
    since_id?: number;
    created_at_min?: string;
    created_at_max?: string;
    status?: 'open' | 'closed' | 'cancelled' | 'any';
    financial_status?: string;
    fulfillment_status?: string;
  }): Promise<ShopifyOrder[]> {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.since_id) searchParams.set('since_id', params.since_id.toString());
    if (params?.created_at_min) searchParams.set('created_at_min', params.created_at_min);
    if (params?.created_at_max) searchParams.set('created_at_max', params.created_at_max);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.financial_status) searchParams.set('financial_status', params.financial_status);
    if (params?.fulfillment_status) searchParams.set('fulfillment_status', params.fulfillment_status);

    const query = searchParams.toString();
    const data = await this.request<{ orders: ShopifyOrder[] }>(
      `/orders.json${query ? `?${query}` : ''}`
    );
    return data.orders;
  }

  /**
   * Obtiene una orden por ID
   */
  async getOrder(id: number): Promise<ShopifyOrder> {
    const data = await this.request<{ order: ShopifyOrder }>(`/orders/${id}.json`);
    return data.order;
  }

  /**
   * Cierra una orden
   */
  async closeOrder(id: number): Promise<ShopifyOrder> {
    const data = await this.request<{ order: ShopifyOrder }>(`/orders/${id}/close.json`, {
      method: 'POST',
    });
    return data.order;
  }

  /**
   * Cancela una orden
   */
  async cancelOrder(id: number, reason?: string): Promise<ShopifyOrder> {
    const data = await this.request<{ order: ShopifyOrder }>(`/orders/${id}/cancel.json`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    return data.order;
  }

  // ============================================
  // FULFILLMENT
  // ============================================

  /**
   * Crea un fulfillment para una orden
   */
  async createFulfillment(fulfillment: ShopifyCreateFulfillment): Promise<ShopifyFulfillment> {
    const data = await this.request<{ fulfillment: ShopifyFulfillment }>('/fulfillments.json', {
      method: 'POST',
      body: JSON.stringify({ fulfillment }),
    });
    return data.fulfillment;
  }

  /**
   * Actualiza el tracking de un fulfillment
   */
  async updateFulfillmentTracking(
    fulfillmentId: number,
    tracking: {
      tracking_info: {
        number: string;
        company: string;
        url?: string;
      };
      notify_customer?: boolean;
    }
  ): Promise<ShopifyFulfillment> {
    const data = await this.request<{ fulfillment: ShopifyFulfillment }>(
      `/fulfillments/${fulfillmentId}/update_tracking.json`,
      {
        method: 'POST',
        body: JSON.stringify({ fulfillment: tracking }),
      }
    );
    return data.fulfillment;
  }

  /**
   * Obtiene las órdenes de fulfillment pendientes
   */
  async getFulfillmentOrders(orderId: number): Promise<any[]> {
    const data = await this.request<{ fulfillment_orders: any[] }>(
      `/orders/${orderId}/fulfillment_orders.json`
    );
    return data.fulfillment_orders;
  }

  // ============================================
  // CLIENTES
  // ============================================

  /**
   * Lista clientes
   */
  async getCustomers(params?: {
    limit?: number;
    since_id?: number;
    created_at_min?: string;
    updated_at_min?: string;
  }): Promise<ShopifyCustomer[]> {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.since_id) searchParams.set('since_id', params.since_id.toString());
    if (params?.created_at_min) searchParams.set('created_at_min', params.created_at_min);
    if (params?.updated_at_min) searchParams.set('updated_at_min', params.updated_at_min);

    const query = searchParams.toString();
    const data = await this.request<{ customers: ShopifyCustomer[] }>(
      `/customers.json${query ? `?${query}` : ''}`
    );
    return data.customers;
  }

  /**
   * Obtiene un cliente por ID
   */
  async getCustomer(id: number): Promise<ShopifyCustomer> {
    const data = await this.request<{ customer: ShopifyCustomer }>(`/customers/${id}.json`);
    return data.customer;
  }

  /**
   * Busca clientes por email
   */
  async searchCustomersByEmail(email: string): Promise<ShopifyCustomer[]> {
    const data = await this.request<{ customers: ShopifyCustomer[] }>(
      `/customers/search.json?query=email:${encodeURIComponent(email)}`
    );
    return data.customers;
  }

  // ============================================
  // INVENTARIO
  // ============================================

  /**
   * Obtiene las ubicaciones de inventario
   */
  async getLocations(): Promise<ShopifyLocation[]> {
    const data = await this.request<{ locations: ShopifyLocation[] }>('/locations.json');
    return data.locations;
  }

  /**
   * Obtiene los niveles de inventario para un item
   */
  async getInventoryLevels(inventoryItemIds: number[]): Promise<ShopifyInventoryLevel[]> {
    const ids = inventoryItemIds.join(',');
    const data = await this.request<{ inventory_levels: ShopifyInventoryLevel[] }>(
      `/inventory_levels.json?inventory_item_ids=${ids}`
    );
    return data.inventory_levels;
  }

  /**
   * Ajusta el nivel de inventario
   */
  async adjustInventoryLevel(
    inventoryItemId: number,
    locationId: number,
    adjustment: number
  ): Promise<ShopifyInventoryLevel> {
    const data = await this.request<{ inventory_level: ShopifyInventoryLevel }>(
      '/inventory_levels/adjust.json',
      {
        method: 'POST',
        body: JSON.stringify({
          inventory_item_id: inventoryItemId,
          location_id: locationId,
          available_adjustment: adjustment,
        }),
      }
    );
    return data.inventory_level;
  }

  /**
   * Establece el nivel de inventario
   */
  async setInventoryLevel(
    inventoryItemId: number,
    locationId: number,
    available: number
  ): Promise<ShopifyInventoryLevel> {
    const data = await this.request<{ inventory_level: ShopifyInventoryLevel }>(
      '/inventory_levels/set.json',
      {
        method: 'POST',
        body: JSON.stringify({
          inventory_item_id: inventoryItemId,
          location_id: locationId,
          available,
        }),
      }
    );
    return data.inventory_level;
  }

  // ============================================
  // WEBHOOKS
  // ============================================

  /**
   * Lista webhooks registrados
   */
  async getWebhooks(): Promise<ShopifyWebhook[]> {
    const data = await this.request<{ webhooks: ShopifyWebhook[] }>('/webhooks.json');
    return data.webhooks;
  }

  /**
   * Crea un webhook
   */
  async createWebhook(topic: ShopifyWebhookTopic, address: string): Promise<ShopifyWebhook> {
    const data = await this.request<{ webhook: ShopifyWebhook }>('/webhooks.json', {
      method: 'POST',
      body: JSON.stringify({
        webhook: {
          topic,
          address,
          format: 'json',
        },
      }),
    });
    return data.webhook;
  }

  /**
   * Elimina un webhook
   */
  async deleteWebhook(id: number): Promise<void> {
    await this.request(`/webhooks/${id}.json`, {
      method: 'DELETE',
    });
  }
}

// ============================================
// SERVICIO DE CONEXIÓN
// ============================================

class ShopifyConnectionService {
  private shopifyService = new ShopifyService();

  /**
   * Guarda la conexión en localStorage
   */
  saveConnection(connection: Omit<ShopifyConnection, 'id' | 'createdAt' | 'updatedAt'>): ShopifyConnection {
    const now = new Date();
    const fullConnection: ShopifyConnection = {
      ...connection,
      id: `shopify_${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(fullConnection));
    this.shopifyService.init({
      shopDomain: connection.shopDomain,
      accessToken: connection.accessToken,
    });

    return fullConnection;
  }

  /**
   * Obtiene la conexión guardada
   */
  getConnection(): ShopifyConnection | null {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    try {
      const connection = JSON.parse(stored) as ShopifyConnection;
      this.shopifyService.init({
        shopDomain: connection.shopDomain,
        accessToken: connection.accessToken,
      });
      return connection;
    } catch {
      return null;
    }
  }

  /**
   * Elimina la conexión
   */
  removeConnection(): void {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(MAPPINGS_KEY);
  }

  /**
   * Verifica la conexión
   */
  async testConnection(shopDomain: string, accessToken: string): Promise<{
    success: boolean;
    shop?: ShopifyShop;
    error?: string;
  }> {
    try {
      this.shopifyService.init({ shopDomain, accessToken });
      const shop = await this.shopifyService.getShop();
      return { success: true, shop };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error de conexión',
      };
    }
  }

  /**
   * Obtiene el servicio de Shopify
   */
  getService(): ShopifyService {
    return this.shopifyService;
  }
}

// ============================================
// SERVICIO DE SINCRONIZACIÓN
// ============================================

class ShopifySyncService {
  private connectionService: ShopifyConnectionService;

  constructor(connectionService: ShopifyConnectionService) {
    this.connectionService = connectionService;
  }

  /**
   * Obtiene el estado de sincronización
   */
  getSyncStatus(): ShopifySyncStatus {
    const stored = localStorage.getItem(`${STORAGE_KEY}_sync_status`);
    if (stored) {
      return JSON.parse(stored);
    }
    return {
      products: { total: 0, synced: 0, failed: 0, lastSyncAt: null },
      orders: { total: 0, synced: 0, failed: 0, lastSyncAt: null },
      inventory: { total: 0, synced: 0, failed: 0, lastSyncAt: null },
      customers: { total: 0, synced: 0, failed: 0, lastSyncAt: null },
    };
  }

  /**
   * Guarda el estado de sincronización
   */
  private saveSyncStatus(status: ShopifySyncStatus): void {
    localStorage.setItem(`${STORAGE_KEY}_sync_status`, JSON.stringify(status));
  }

  /**
   * Sincroniza productos de Shopify
   */
  async syncProducts(onProgress?: (progress: number) => void): Promise<{
    total: number;
    synced: number;
    failed: number;
  }> {
    const service = this.connectionService.getService();
    const products = await service.getProducts({ limit: 250, status: 'active' });

    const status = this.getSyncStatus();
    status.products.total = products.length;
    status.products.synced = products.length;
    status.products.failed = 0;
    status.products.lastSyncAt = new Date();

    // Guardar mapeos de productos
    const mappings = this.getProductMappings();
    products.forEach((product, index) => {
      product.variants.forEach(variant => {
        if (variant.sku) {
          mappings.set(variant.sku, {
            litperProductId: variant.sku, // Usar SKU como ID de LITPER
            shopifyProductId: product.id,
            shopifyVariantId: variant.id,
            sku: variant.sku,
            lastSyncAt: new Date(),
          });
        }
      });
      onProgress?.(((index + 1) / products.length) * 100);
    });

    this.saveProductMappings(mappings);
    this.saveSyncStatus(status);

    return {
      total: products.length,
      synced: products.length,
      failed: 0,
    };
  }

  /**
   * Sincroniza órdenes de Shopify
   */
  async syncOrders(
    options?: { from?: Date; to?: Date },
    onProgress?: (progress: number) => void
  ): Promise<{
    total: number;
    synced: number;
    failed: number;
  }> {
    const service = this.connectionService.getService();
    const orders = await service.getOrders({
      limit: 250,
      status: 'any',
      created_at_min: options?.from?.toISOString(),
      created_at_max: options?.to?.toISOString(),
    });

    const status = this.getSyncStatus();
    status.orders.total = orders.length;
    status.orders.synced = orders.length;
    status.orders.failed = 0;
    status.orders.lastSyncAt = new Date();

    // Guardar mapeos de órdenes
    const mappings = this.getOrderMappings();
    orders.forEach((order, index) => {
      mappings.set(order.name, {
        litperGuideId: order.name,
        shopifyOrderId: order.id,
        shopifyOrderName: order.name,
        lastSyncAt: new Date(),
      });
      onProgress?.(((index + 1) / orders.length) * 100);
    });

    this.saveOrderMappings(mappings);
    this.saveSyncStatus(status);

    return {
      total: orders.length,
      synced: orders.length,
      failed: 0,
    };
  }

  /**
   * Sincroniza inventario
   */
  async syncInventory(onProgress?: (progress: number) => void): Promise<{
    total: number;
    synced: number;
    failed: number;
  }> {
    const service = this.connectionService.getService();
    const products = await service.getProducts({ limit: 250, status: 'active' });

    const inventoryItemIds: number[] = [];
    products.forEach(product => {
      product.variants.forEach(variant => {
        if (variant.inventory_item_id) {
          inventoryItemIds.push(variant.inventory_item_id);
        }
      });
    });

    // Obtener niveles de inventario en lotes de 50
    const batchSize = 50;
    let synced = 0;

    for (let i = 0; i < inventoryItemIds.length; i += batchSize) {
      const batch = inventoryItemIds.slice(i, i + batchSize);
      try {
        await service.getInventoryLevels(batch);
        synced += batch.length;
      } catch (error) {
        console.error('Error syncing inventory batch:', error);
      }
      onProgress?.(((i + batchSize) / inventoryItemIds.length) * 100);
    }

    const status = this.getSyncStatus();
    status.inventory.total = inventoryItemIds.length;
    status.inventory.synced = synced;
    status.inventory.failed = inventoryItemIds.length - synced;
    status.inventory.lastSyncAt = new Date();
    this.saveSyncStatus(status);

    return {
      total: inventoryItemIds.length,
      synced,
      failed: inventoryItemIds.length - synced,
    };
  }

  // ============================================
  // MAPEOS
  // ============================================

  getProductMappings(): Map<string, ProductMapping> {
    const stored = localStorage.getItem(`${MAPPINGS_KEY}_products`);
    if (!stored) return new Map();
    const entries = JSON.parse(stored);
    return new Map(entries);
  }

  saveProductMappings(mappings: Map<string, ProductMapping>): void {
    localStorage.setItem(`${MAPPINGS_KEY}_products`, JSON.stringify([...mappings.entries()]));
  }

  getOrderMappings(): Map<string, OrderMapping> {
    const stored = localStorage.getItem(`${MAPPINGS_KEY}_orders`);
    if (!stored) return new Map();
    const entries = JSON.parse(stored);
    return new Map(entries);
  }

  saveOrderMappings(mappings: Map<string, OrderMapping>): void {
    localStorage.setItem(`${MAPPINGS_KEY}_orders`, JSON.stringify([...mappings.entries()]));
  }
}

// ============================================
// INSTANCIAS SINGLETON
// ============================================

export const shopifyConnection = new ShopifyConnectionService();
export const shopifySync = new ShopifySyncService(shopifyConnection);
export const shopifyService = shopifyConnection.getService();

// ============================================
// HELPERS
// ============================================

/**
 * Genera la URL de autorización OAuth
 */
export function getShopifyOAuthUrl(
  shopDomain: string,
  clientId: string,
  redirectUri: string,
  scopes: ShopifyScope[],
  state: string
): string {
  const params = new URLSearchParams({
    client_id: clientId,
    scope: scopes.join(','),
    redirect_uri: redirectUri,
    state,
  });

  return `https://${shopDomain}/admin/oauth/authorize?${params.toString()}`;
}

/**
 * Intercambia el código de autorización por un token
 */
export async function exchangeShopifyCode(
  shopDomain: string,
  clientId: string,
  clientSecret: string,
  code: string
): Promise<{ access_token: string; scope: string }> {
  const response = await fetch(`https://${shopDomain}/admin/oauth/access_token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to exchange authorization code');
  }

  return response.json();
}

export default shopifyService;
