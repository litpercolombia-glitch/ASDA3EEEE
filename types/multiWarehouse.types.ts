/**
 * Multi-Warehouse Types
 *
 * Tipos para gestión de múltiples almacenes con distribución
 * de inventario, transferencias y optimización de fulfillment.
 */

// ============================================
// ALMACÉN
// ============================================

export interface Warehouse {
  id: string;
  code: string;                      // Código único (ej: BOG-01, MDE-01)
  name: string;
  type: WarehouseType;
  status: WarehouseStatus;

  // Ubicación
  location: WarehouseLocation;

  // Capacidad
  capacity: WarehouseCapacity;

  // Configuración
  config: WarehouseConfig;

  // Zonas de cobertura
  coverageZones: CoverageZone[];

  // Horarios
  operatingHours: OperatingHours;

  // Contacto
  contact: WarehouseContact;

  // Métricas
  metrics: WarehouseMetrics;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export type WarehouseType =
  | 'main'              // Almacén principal
  | 'distribution'      // Centro de distribución
  | 'fulfillment'       // Centro de fulfillment
  | 'cross_dock'        // Cross-docking
  | 'dark_store'        // Dark store (última milla)
  | 'dropship'          // Dropshipping (virtual)
  | 'returns';          // Centro de devoluciones

export type WarehouseStatus =
  | 'active'            // Activo
  | 'inactive'          // Inactivo
  | 'maintenance'       // En mantenimiento
  | 'full'              // Lleno
  | 'limited';          // Capacidad limitada

export interface WarehouseLocation {
  address: string;
  addressLine2?: string;
  city: string;
  cityCode: string;
  department: string;
  departmentCode: string;
  country: string;
  countryCode: string;
  postalCode?: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export interface WarehouseCapacity {
  totalArea: number;              // m²
  usableArea: number;             // m²
  usedArea: number;               // m²
  totalPositions: number;         // Posiciones de almacenamiento
  usedPositions: number;
  maxWeight: number;              // kg
  currentWeight: number;          // kg
  utilizationPercentage: number;  // % usado
}

export interface WarehouseConfig {
  // Fulfillment
  canFulfill: boolean;
  fulfillmentPriority: number;    // 1 = más alta prioridad
  maxDailyOrders: number;
  cutoffTime: string;             // Hora de corte (HH:mm)

  // Recepción
  canReceive: boolean;
  requiresAppointment: boolean;

  // Transferencias
  canTransferOut: boolean;
  canTransferIn: boolean;

  // Devoluciones
  canProcessReturns: boolean;

  // Carriers habilitados
  enabledCarriers: string[];

  // Métodos de envío
  enabledShippingMethods: string[];

  // Stock mínimo de seguridad (%)
  safetyStockPercentage: number;

  // Auto-reabastecimiento
  autoReplenish: boolean;
  replenishThreshold: number;     // % para disparar reabastecimiento
}

export interface CoverageZone {
  id: string;
  name: string;
  type: 'city' | 'department' | 'region' | 'postal_codes' | 'radius';
  values: string[];               // Códigos de ciudades, departamentos, CPs
  radius?: number;                // km (si type = radius)
  priority: number;               // Prioridad para esta zona
  deliveryDays: number;           // Días estimados de entrega
  shippingCost?: number;          // Costo de envío para esta zona
  isFreeShipping?: boolean;
  freeShippingMinimum?: number;
}

export interface OperatingHours {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
  holidays: HolidaySchedule[];
}

export interface DaySchedule {
  isOpen: boolean;
  openTime?: string;      // HH:mm
  closeTime?: string;     // HH:mm
  breakStart?: string;    // HH:mm
  breakEnd?: string;      // HH:mm
}

export interface HolidaySchedule {
  date: string;           // YYYY-MM-DD
  name: string;
  isOpen: boolean;
  openTime?: string;
  closeTime?: string;
}

export interface WarehouseContact {
  managerName: string;
  email: string;
  phone: string;
  emergencyPhone?: string;
}

export interface WarehouseMetrics {
  // Fulfillment
  ordersToday: number;
  ordersThisWeek: number;
  ordersThisMonth: number;
  averageOrdersPerDay: number;

  // Tiempos
  averagePickTime: number;        // minutos
  averagePackTime: number;        // minutos
  averageShipTime: number;        // minutos

  // Precisión
  pickAccuracy: number;           // %
  shipAccuracy: number;           // %

  // Inventario
  skuCount: number;
  totalUnits: number;
  lowStockItems: number;
  outOfStockItems: number;

  // Devoluciones
  returnsProcessedToday: number;
  returnsProcessedThisMonth: number;

  updatedAt: Date;
}

// ============================================
// INVENTARIO MULTI-ALMACÉN
// ============================================

export interface MultiWarehouseInventory {
  productId: string;
  sku: string;
  productName: string;

  // Total global
  totalQuantity: number;
  totalAvailable: number;
  totalReserved: number;
  totalInTransit: number;

  // Por almacén
  warehouseStock: WarehouseStockLevel[];

  // Configuración
  isMultiWarehouse: boolean;
  preferredWarehouseId?: string;
  reorderPoint: number;
  reorderQuantity: number;

  // Estado
  globalStatus: 'in_stock' | 'low_stock' | 'out_of_stock' | 'discontinued';

  updatedAt: Date;
}

export interface WarehouseStockLevel {
  warehouseId: string;
  warehouseCode: string;
  warehouseName: string;

  // Cantidades
  quantityOnHand: number;
  quantityAvailable: number;
  quantityReserved: number;
  quantityIncoming: number;      // En tránsito hacia este almacén

  // Ubicación dentro del almacén
  location?: string;              // Ej: "A-01-03" (Pasillo-Estante-Nivel)
  binLocations?: BinLocation[];

  // Control
  minStock: number;
  maxStock: number;
  reorderPoint: number;

  // Estado
  status: 'available' | 'low' | 'out' | 'blocked';

  // Fechas
  lastReceivedAt: Date | null;
  lastShippedAt: Date | null;
  lastCountedAt: Date | null;
}

export interface BinLocation {
  bin: string;                    // Código de ubicación
  quantity: number;
  lotNumber?: string;
  expirationDate?: Date;
  receivedDate: Date;
}

// ============================================
// TRANSFERENCIAS
// ============================================

export interface InventoryTransfer {
  id: string;
  transferNumber: string;
  type: TransferType;
  status: TransferStatus;

  // Origen y destino
  sourceWarehouseId: string;
  sourceWarehouseCode: string;
  destinationWarehouseId: string;
  destinationWarehouseCode: string;

  // Items
  items: TransferItem[];
  totalItems: number;
  totalUnits: number;

  // Fechas
  requestedDate: Date;
  expectedArrivalDate: Date;
  shippedDate: Date | null;
  receivedDate: Date | null;

  // Transporte
  carrier?: string;
  trackingNumber?: string;
  shippingCost?: number;

  // Notas
  notes?: string;
  internalNotes?: string;

  // Aprobación
  requestedBy: string;
  approvedBy?: string;
  approvedAt?: Date;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export type TransferType =
  | 'replenishment'       // Reabastecimiento
  | 'rebalance'           // Rebalanceo de inventario
  | 'consolidation'       // Consolidación
  | 'return_to_vendor'    // Devolución a proveedor
  | 'relocation'          // Reubicación
  | 'emergency';          // Emergencia

export type TransferStatus =
  | 'draft'               // Borrador
  | 'pending_approval'    // Pendiente de aprobación
  | 'approved'            // Aprobada
  | 'picking'             // En picking
  | 'packed'              // Empacada
  | 'shipped'             // Enviada
  | 'in_transit'          // En tránsito
  | 'delivered'           // Entregada
  | 'receiving'           // En recepción
  | 'completed'           // Completada
  | 'cancelled';          // Cancelada

export interface TransferItem {
  id: string;
  productId: string;
  sku: string;
  productName: string;

  // Cantidades
  requestedQuantity: number;
  approvedQuantity: number;
  shippedQuantity: number;
  receivedQuantity: number;

  // Discrepancias
  discrepancy: number;
  discrepancyReason?: string;

  // Ubicación
  sourceLocation?: string;
  destinationLocation?: string;

  // Lote
  lotNumber?: string;
  expirationDate?: Date;
}

// ============================================
// FULFILLMENT MULTI-ALMACÉN
// ============================================

export interface FulfillmentRequest {
  orderId: string;
  orderNumber: string;
  items: FulfillmentItem[];
  shippingAddress: ShippingAddress;
  shippingMethod: string;
  priority: 'standard' | 'express' | 'same_day';
  requiredDate?: Date;
}

export interface FulfillmentItem {
  productId: string;
  sku: string;
  quantity: number;
  weight?: number;
}

export interface ShippingAddress {
  city: string;
  cityCode: string;
  department: string;
  departmentCode: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
}

export interface FulfillmentPlan {
  orderId: string;
  strategy: FulfillmentStrategy;
  allocations: FulfillmentAllocation[];
  totalShipments: number;
  estimatedDeliveryDate: Date;
  totalShippingCost: number;
  notes?: string;
}

export type FulfillmentStrategy =
  | 'single_warehouse'      // Todo de un almacén
  | 'split_shipment'        // Dividir entre almacenes
  | 'nearest_warehouse'     // Almacén más cercano
  | 'lowest_cost'           // Menor costo
  | 'fastest_delivery'      // Entrega más rápida
  | 'balanced';             // Balance costo/tiempo

export interface FulfillmentAllocation {
  warehouseId: string;
  warehouseCode: string;
  items: {
    productId: string;
    sku: string;
    quantity: number;
    location?: string;
  }[];
  carrier: string;
  shippingMethod: string;
  estimatedShippingCost: number;
  estimatedDeliveryDays: number;
  priority: number;
}

// ============================================
// REGLAS DE DISTRIBUCIÓN
// ============================================

export interface DistributionRule {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  priority: number;

  // Condiciones
  conditions: RuleCondition[];

  // Acciones
  action: RuleAction;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface RuleCondition {
  type: 'zone' | 'product' | 'quantity' | 'value' | 'shipping_method' | 'time';
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: any;
}

export interface RuleAction {
  type: 'assign_warehouse' | 'split_order' | 'set_priority' | 'add_carrier';
  warehouseIds?: string[];
  splitRatio?: Record<string, number>;
  priority?: number;
  carriers?: string[];
}

// ============================================
// REPORTES Y ANALYTICS
// ============================================

export interface WarehouseAnalytics {
  warehouseId: string;
  period: { from: Date; to: Date };

  // Fulfillment
  ordersProcessed: number;
  unitsShipped: number;
  averageOrderValue: number;
  fulfillmentRate: number;        // % de órdenes cumplidas a tiempo

  // Inventario
  inventoryTurnover: number;      // Rotación de inventario
  daysOfInventory: number;        // Días de inventario
  stockoutRate: number;           // % de agotados
  overStockRate: number;          // % de sobrestock

  // Eficiencia
  ordersPerHour: number;
  unitsPerHour: number;
  costPerOrder: number;
  costPerUnit: number;

  // Calidad
  errorRate: number;              // % de errores
  returnRate: number;             // % de devoluciones

  // Por día
  dailyStats: {
    date: string;
    orders: number;
    units: number;
    revenue: number;
  }[];

  // Top productos
  topProducts: {
    productId: string;
    sku: string;
    name: string;
    unitsSold: number;
    revenue: number;
  }[];
}

export interface NetworkOverview {
  // Resumen global
  totalWarehouses: number;
  activeWarehouses: number;
  totalCapacity: number;
  usedCapacity: number;
  utilizationRate: number;

  // Inventario global
  totalSKUs: number;
  totalUnits: number;
  totalValue: number;
  lowStockAlerts: number;
  outOfStockAlerts: number;

  // Fulfillment global
  ordersToday: number;
  ordersInProgress: number;
  pendingShipments: number;

  // Transferencias
  activeTransfers: number;
  pendingTransfers: number;

  // Por almacén
  warehousesSummary: {
    id: string;
    code: string;
    name: string;
    status: WarehouseStatus;
    utilizationRate: number;
    ordersToday: number;
    alerts: number;
  }[];
}
