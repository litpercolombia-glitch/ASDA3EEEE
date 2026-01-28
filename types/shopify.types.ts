/**
 * Shopify Integration Types
 *
 * Tipos para la integración con Shopify API.
 * Basado en Shopify Admin API versión 2024-01.
 */

// ============================================
// CONEXIÓN Y AUTENTICACIÓN
// ============================================

export interface ShopifyConnection {
  id: string;
  shopDomain: string;             // mystore.myshopify.com
  accessToken: string;            // Token de acceso OAuth
  apiVersion: string;             // 2024-01
  scopes: ShopifyScope[];
  isActive: boolean;
  lastSyncAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type ShopifyScope =
  | 'read_products'
  | 'write_products'
  | 'read_orders'
  | 'write_orders'
  | 'read_inventory'
  | 'write_inventory'
  | 'read_customers'
  | 'write_customers'
  | 'read_fulfillments'
  | 'write_fulfillments'
  | 'read_shipping';

export interface ShopifyOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: ShopifyScope[];
}

// ============================================
// TIENDA
// ============================================

export interface ShopifyShop {
  id: number;
  name: string;
  email: string;
  domain: string;
  myshopifyDomain: string;
  currency: string;
  timezone: string;
  country: string;
  city: string;
  address1: string;
  phone: string;
  planName: string;
  planDisplayName: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// PRODUCTOS
// ============================================

export interface ShopifyProduct {
  id: number;
  title: string;
  body_html: string;
  vendor: string;
  product_type: string;
  handle: string;
  status: 'active' | 'archived' | 'draft';
  published_at: string | null;
  template_suffix: string | null;
  published_scope: 'web' | 'global';
  tags: string;
  variants: ShopifyVariant[];
  options: ShopifyProductOption[];
  images: ShopifyImage[];
  image: ShopifyImage | null;
  created_at: string;
  updated_at: string;
}

export interface ShopifyVariant {
  id: number;
  product_id: number;
  title: string;
  price: string;
  compare_at_price: string | null;
  sku: string;
  barcode: string | null;
  position: number;
  inventory_policy: 'deny' | 'continue';
  inventory_management: 'shopify' | null;
  inventory_item_id: number;
  inventory_quantity: number;
  weight: number;
  weight_unit: 'g' | 'kg' | 'oz' | 'lb';
  requires_shipping: boolean;
  taxable: boolean;
  fulfillment_service: string;
  option1: string | null;
  option2: string | null;
  option3: string | null;
  image_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface ShopifyProductOption {
  id: number;
  product_id: number;
  name: string;
  position: number;
  values: string[];
}

export interface ShopifyImage {
  id: number;
  product_id: number;
  position: number;
  src: string;
  width: number;
  height: number;
  alt: string | null;
  variant_ids: number[];
  created_at: string;
  updated_at: string;
}

// ============================================
// ÓRDENES
// ============================================

export interface ShopifyOrder {
  id: number;
  name: string;                   // #1001
  order_number: number;           // 1001
  email: string;
  phone: string | null;
  financial_status: ShopifyFinancialStatus;
  fulfillment_status: ShopifyFulfillmentStatus | null;
  currency: string;
  current_subtotal_price: string;
  current_total_discounts: string;
  current_total_price: string;
  current_total_tax: string;
  total_weight: number;
  subtotal_price: string;
  total_discounts: string;
  total_line_items_price: string;
  total_price: string;
  total_tax: string;
  taxes_included: boolean;
  line_items: ShopifyLineItem[];
  shipping_lines: ShopifyShippingLine[];
  billing_address: ShopifyAddress | null;
  shipping_address: ShopifyAddress | null;
  customer: ShopifyCustomer | null;
  fulfillments: ShopifyFulfillment[];
  refunds: ShopifyRefund[];
  discount_codes: ShopifyDiscountCode[];
  note: string | null;
  note_attributes: ShopifyNoteAttribute[];
  tags: string;
  test: boolean;
  processed_at: string;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
}

export type ShopifyFinancialStatus =
  | 'pending'
  | 'authorized'
  | 'partially_paid'
  | 'paid'
  | 'partially_refunded'
  | 'refunded'
  | 'voided';

export type ShopifyFulfillmentStatus =
  | 'fulfilled'
  | 'partial'
  | 'restocked';

export interface ShopifyLineItem {
  id: number;
  variant_id: number | null;
  product_id: number | null;
  title: string;
  variant_title: string | null;
  sku: string | null;
  vendor: string | null;
  quantity: number;
  price: string;
  total_discount: string;
  fulfillment_status: string | null;
  fulfillable_quantity: number;
  fulfillment_service: string;
  requires_shipping: boolean;
  taxable: boolean;
  gift_card: boolean;
  name: string;
  properties: ShopifyLineItemProperty[];
  tax_lines: ShopifyTaxLine[];
}

export interface ShopifyLineItemProperty {
  name: string;
  value: string;
}

export interface ShopifyTaxLine {
  title: string;
  price: string;
  rate: number;
}

export interface ShopifyShippingLine {
  id: number;
  title: string;
  code: string;
  price: string;
  source: string;
  discounted_price: string;
  carrier_identifier: string | null;
  requested_fulfillment_service_id: string | null;
}

export interface ShopifyAddress {
  first_name: string;
  last_name: string;
  company: string | null;
  address1: string;
  address2: string | null;
  city: string;
  province: string;
  province_code: string;
  country: string;
  country_code: string;
  zip: string;
  phone: string | null;
  name: string;
  latitude: number | null;
  longitude: number | null;
}

export interface ShopifyDiscountCode {
  code: string;
  amount: string;
  type: 'percentage' | 'fixed_amount' | 'shipping';
}

export interface ShopifyNoteAttribute {
  name: string;
  value: string;
}

// ============================================
// CLIENTES
// ============================================

export interface ShopifyCustomer {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  verified_email: boolean;
  accepts_marketing: boolean;
  accepts_marketing_updated_at: string | null;
  marketing_opt_in_level: string | null;
  orders_count: number;
  total_spent: string;
  state: 'disabled' | 'invited' | 'enabled' | 'declined';
  tags: string;
  currency: string;
  default_address: ShopifyAddress | null;
  addresses: ShopifyAddress[];
  note: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// FULFILLMENT
// ============================================

export interface ShopifyFulfillment {
  id: number;
  order_id: number;
  status: 'pending' | 'open' | 'success' | 'cancelled' | 'error' | 'failure';
  tracking_company: string | null;
  tracking_number: string | null;
  tracking_numbers: string[];
  tracking_url: string | null;
  tracking_urls: string[];
  shipment_status: ShopifyShipmentStatus | null;
  line_items: ShopifyFulfillmentLineItem[];
  location_id: number;
  created_at: string;
  updated_at: string;
}

export type ShopifyShipmentStatus =
  | 'label_printed'
  | 'label_purchased'
  | 'attempted_delivery'
  | 'ready_for_pickup'
  | 'confirmed'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'failure';

export interface ShopifyFulfillmentLineItem {
  id: number;
  variant_id: number;
  title: string;
  quantity: number;
  sku: string;
  variant_title: string;
  vendor: string | null;
  fulfillment_service: string;
  product_id: number;
  requires_shipping: boolean;
  taxable: boolean;
  gift_card: boolean;
  name: string;
  price: string;
  total_discount: string;
}

export interface ShopifyCreateFulfillment {
  line_items_by_fulfillment_order: {
    fulfillment_order_id: number;
    fulfillment_order_line_items?: {
      id: number;
      quantity: number;
    }[];
  }[];
  tracking_info?: {
    company: string;
    number: string;
    url?: string;
  };
  notify_customer?: boolean;
}

// ============================================
// INVENTARIO
// ============================================

export interface ShopifyInventoryItem {
  id: number;
  sku: string;
  cost: string | null;
  country_code_of_origin: string | null;
  harmonized_system_code: string | null;
  province_code_of_origin: string | null;
  tracked: boolean;
  requires_shipping: boolean;
  created_at: string;
  updated_at: string;
}

export interface ShopifyInventoryLevel {
  inventory_item_id: number;
  location_id: number;
  available: number | null;
  updated_at: string;
}

export interface ShopifyLocation {
  id: number;
  name: string;
  address1: string;
  address2: string | null;
  city: string;
  province: string;
  province_code: string;
  country: string;
  country_code: string;
  zip: string;
  phone: string | null;
  active: boolean;
  legacy: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================
// REFUNDS
// ============================================

export interface ShopifyRefund {
  id: number;
  order_id: number;
  created_at: string;
  processed_at: string;
  note: string | null;
  restock: boolean;
  duties: any[];
  refund_line_items: ShopifyRefundLineItem[];
  transactions: ShopifyTransaction[];
}

export interface ShopifyRefundLineItem {
  id: number;
  line_item_id: number;
  quantity: number;
  restock_type: 'no_restock' | 'cancel' | 'return' | 'legacy_restock';
  location_id: number | null;
  subtotal: string;
  total_tax: string;
}

export interface ShopifyTransaction {
  id: number;
  order_id: number;
  kind: 'authorization' | 'capture' | 'sale' | 'void' | 'refund';
  gateway: string;
  status: 'pending' | 'success' | 'failure' | 'error';
  message: string;
  amount: string;
  currency: string;
  created_at: string;
}

// ============================================
// WEBHOOKS
// ============================================

export interface ShopifyWebhook {
  id: number;
  address: string;
  topic: ShopifyWebhookTopic;
  format: 'json' | 'xml';
  created_at: string;
  updated_at: string;
}

export type ShopifyWebhookTopic =
  | 'orders/create'
  | 'orders/updated'
  | 'orders/fulfilled'
  | 'orders/paid'
  | 'orders/cancelled'
  | 'products/create'
  | 'products/update'
  | 'products/delete'
  | 'inventory_levels/update'
  | 'inventory_levels/connect'
  | 'inventory_levels/disconnect'
  | 'customers/create'
  | 'customers/update'
  | 'fulfillments/create'
  | 'fulfillments/update'
  | 'refunds/create';

// ============================================
// SINCRONIZACIÓN
// ============================================

export interface ShopifySyncStatus {
  products: {
    total: number;
    synced: number;
    failed: number;
    lastSyncAt: Date | null;
  };
  orders: {
    total: number;
    synced: number;
    failed: number;
    lastSyncAt: Date | null;
  };
  inventory: {
    total: number;
    synced: number;
    failed: number;
    lastSyncAt: Date | null;
  };
  customers: {
    total: number;
    synced: number;
    failed: number;
    lastSyncAt: Date | null;
  };
}

export interface ShopifySyncOptions {
  syncProducts?: boolean;
  syncOrders?: boolean;
  syncInventory?: boolean;
  syncCustomers?: boolean;
  ordersFrom?: Date;
  ordersTo?: Date;
}

// ============================================
// MAPEO LITPER <-> SHOPIFY
// ============================================

export interface ProductMapping {
  litperProductId: string;
  shopifyProductId: number;
  shopifyVariantId: number;
  sku: string;
  lastSyncAt: Date;
}

export interface OrderMapping {
  litperGuideId: string;
  shopifyOrderId: number;
  shopifyOrderName: string;
  lastSyncAt: Date;
}

export interface CustomerMapping {
  litperCustomerId: string;
  shopifyCustomerId: number;
  email: string;
  lastSyncAt: Date;
}

// ============================================
// API RESPONSE WRAPPERS
// ============================================

export interface ShopifyPaginatedResponse<T> {
  data: T[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor?: string;
    endCursor?: string;
  };
}

export interface ShopifyApiError {
  errors: string | { [key: string]: string[] };
}

export interface ShopifyRateLimitInfo {
  available: number;
  maximum: number;
  restoreRate: number;
  currentlyUsed: number;
}
