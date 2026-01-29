/**
 * Inventory Types
 * ===============
 *
 * Tipos para el módulo de inventario.
 * Compatible con estándares de NetSuite/ShipBob/Odoo.
 */

// ============================================
// PRODUCTO
// ============================================

export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  category?: string;
  brand?: string;
  imageUrl?: string;
  barcode?: string;

  // Dimensiones y peso
  weight?: number; // kg
  weightUnit?: 'kg' | 'lb' | 'g';
  length?: number;
  width?: number;
  height?: number;
  dimensionUnit?: 'cm' | 'in' | 'm';

  // Precios
  costPrice: number; // Costo de adquisición
  salePrice: number; // Precio de venta
  currency: string; // COP, USD, etc.

  // Inventario
  trackInventory: boolean;
  allowBackorder: boolean;
  minStockLevel: number; // Nivel mínimo para alerta
  reorderPoint: number; // Punto de reorden
  reorderQuantity: number; // Cantidad a reordenar

  // Estado
  status: ProductStatus;
  isActive: boolean;

  // Metadata
  tags?: string[];
  customFields?: Record<string, any>;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export type ProductStatus = 'active' | 'inactive' | 'discontinued' | 'draft';

// ============================================
// INVENTARIO / STOCK
// ============================================

export interface InventoryItem {
  id: string;
  productId: string;
  product?: Product;
  warehouseId: string;
  warehouse?: Warehouse;
  locationId?: string; // Ubicación dentro del almacén

  // Cantidades
  quantityOnHand: number; // Stock físico disponible
  quantityReserved: number; // Reservado para pedidos
  quantityAvailable: number; // onHand - reserved
  quantityIncoming: number; // En tránsito hacia almacén
  quantityOutgoing: number; // En proceso de salida

  // Lotes (opcional)
  lotNumber?: string;
  expirationDate?: string;

  // Costo
  unitCost: number;
  totalValue: number; // quantityOnHand * unitCost

  // Estado
  status: InventoryStatus;
  lastCountDate?: string;
  lastMovementDate?: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export type InventoryStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'overstock';

// ============================================
// ALMACÉN / BODEGA
// ============================================

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  type: WarehouseType;

  // Ubicación
  address: Address;
  timezone: string;

  // Contacto
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;

  // Configuración
  isDefault: boolean;
  isActive: boolean;
  allowNegativeStock: boolean;

  // Capacidad
  totalCapacity?: number; // Unidades o m³
  usedCapacity?: number;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export type WarehouseType = 'main' | 'secondary' | 'dropship' | 'returns' | 'virtual';

export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
}

// ============================================
// MOVIMIENTOS DE INVENTARIO
// ============================================

export interface InventoryMovement {
  id: string;
  type: MovementType;
  productId: string;
  product?: Product;

  // Ubicaciones
  fromWarehouseId?: string;
  fromWarehouse?: Warehouse;
  toWarehouseId?: string;
  toWarehouse?: Warehouse;

  // Cantidades
  quantity: number;
  previousQuantity: number;
  newQuantity: number;

  // Referencia
  referenceType?: 'order' | 'purchase' | 'transfer' | 'adjustment' | 'return';
  referenceId?: string;

  // Costo
  unitCost?: number;
  totalCost?: number;

  // Lote
  lotNumber?: string;

  // Metadata
  reason?: string;
  notes?: string;
  performedBy: string;

  // Timestamps
  createdAt: string;
}

export type MovementType =
  | 'receipt'      // Entrada por compra
  | 'shipment'     // Salida por venta
  | 'transfer_in'  // Transferencia entrada
  | 'transfer_out' // Transferencia salida
  | 'adjustment'   // Ajuste manual
  | 'return'       // Devolución
  | 'damage'       // Daño/pérdida
  | 'count';       // Conteo de inventario

// ============================================
// AJUSTE DE INVENTARIO
// ============================================

export interface InventoryAdjustment {
  id: string;
  type: AdjustmentType;
  status: AdjustmentStatus;
  warehouseId: string;
  warehouse?: Warehouse;

  // Items
  items: AdjustmentItem[];

  // Metadata
  reason: string;
  notes?: string;
  createdBy: string;
  approvedBy?: string;

  // Timestamps
  createdAt: string;
  approvedAt?: string;
  completedAt?: string;
}

export interface AdjustmentItem {
  productId: string;
  product?: Product;
  locationId?: string;

  expectedQuantity: number;
  countedQuantity: number;
  varianceQuantity: number; // counted - expected
  varianceValue: number;

  reason?: string;
}

export type AdjustmentType = 'cycle_count' | 'physical_count' | 'write_off' | 'correction';
export type AdjustmentStatus = 'draft' | 'pending_approval' | 'approved' | 'completed' | 'cancelled';

// ============================================
// ALERTAS DE INVENTARIO
// ============================================

export interface InventoryAlert {
  id: string;
  type: AlertType;
  severity: 'low' | 'medium' | 'high' | 'critical';

  productId: string;
  product?: Product;
  warehouseId?: string;
  warehouse?: Warehouse;

  // Detalles
  message: string;
  currentValue: number;
  thresholdValue: number;

  // Estado
  status: 'active' | 'acknowledged' | 'resolved';
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolvedAt?: string;

  // Timestamps
  createdAt: string;
}

export type AlertType =
  | 'low_stock'
  | 'out_of_stock'
  | 'overstock'
  | 'expiring_soon'
  | 'expired'
  | 'reorder_point';

// ============================================
// REPORTES
// ============================================

export interface InventoryReport {
  generatedAt: string;
  warehouseId?: string;

  // Resumen
  totalProducts: number;
  totalSKUs: number;
  totalValue: number;

  // Por estado
  inStockCount: number;
  lowStockCount: number;
  outOfStockCount: number;

  // Movimientos período
  totalReceipts: number;
  totalShipments: number;
  totalAdjustments: number;

  // Top productos
  topSellingProducts: ProductSummary[];
  lowStockProducts: ProductSummary[];
  deadStock: ProductSummary[]; // Sin movimiento en X días
}

export interface ProductSummary {
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  value: number;
  lastMovementDate?: string;
}

// ============================================
// FILTROS Y BÚSQUEDA
// ============================================

export interface InventoryFilters {
  search?: string;
  warehouseId?: string;
  categoryId?: string;
  status?: InventoryStatus[];
  minQuantity?: number;
  maxQuantity?: number;
  hasAlerts?: boolean;
  sortBy?: 'name' | 'sku' | 'quantity' | 'value' | 'lastMovement';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// ============================================
// RESPUESTAS API
// ============================================

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface InventoryStats {
  totalValue: number;
  totalProducts: number;
  totalUnits: number;
  lowStockCount: number;
  outOfStockCount: number;
  pendingAlerts: number;
  recentMovements: number;
}
