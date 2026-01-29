/**
 * Inventory Service
 * =================
 *
 * Servicio para gestión de inventario.
 * Maneja productos, stock, movimientos y alertas.
 */

import {
  Product,
  InventoryItem,
  Warehouse,
  InventoryMovement,
  InventoryAdjustment,
  InventoryAlert,
  InventoryFilters,
  InventoryStats,
  PaginatedResponse,
  MovementType,
  ProductStatus,
  InventoryStatus,
  AdjustmentItem,
} from '../types/inventory.types';

// ============================================
// CONFIGURACIÓN
// ============================================

const STORAGE_KEYS = {
  PRODUCTS: 'litper_inventory_products',
  INVENTORY: 'litper_inventory_items',
  WAREHOUSES: 'litper_inventory_warehouses',
  MOVEMENTS: 'litper_inventory_movements',
  ADJUSTMENTS: 'litper_inventory_adjustments',
  ALERTS: 'litper_inventory_alerts',
};

// ============================================
// HELPERS
// ============================================

const generateId = (): string => {
  return `inv_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
};

const generateSKU = (prefix = 'SKU'): string => {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}`;
};

const calculateInventoryStatus = (item: InventoryItem, product: Product): InventoryStatus => {
  if (item.quantityAvailable <= 0) return 'out_of_stock';
  if (item.quantityAvailable <= product.minStockLevel) return 'low_stock';
  if (item.quantityAvailable > product.reorderQuantity * 3) return 'overstock';
  return 'in_stock';
};

// ============================================
// STORAGE HELPERS
// ============================================

const getFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const saveToStorage = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('[InventoryService] Error saving to storage:', e);
  }
};

// ============================================
// PRODUCTOS
// ============================================

export const productService = {
  /**
   * Obtener todos los productos
   */
  getAll: (filters?: InventoryFilters): PaginatedResponse<Product> => {
    let products = getFromStorage<Product[]>(STORAGE_KEYS.PRODUCTS, []);

    // Filtrar
    if (filters?.search) {
      const search = filters.search.toLowerCase();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(search) ||
          p.sku.toLowerCase().includes(search) ||
          p.barcode?.toLowerCase().includes(search)
      );
    }

    if (filters?.categoryId) {
      products = products.filter((p) => p.category === filters.categoryId);
    }

    // Ordenar
    const sortBy = filters?.sortBy || 'name';
    const sortOrder = filters?.sortOrder || 'asc';
    products.sort((a, b) => {
      const aVal = a[sortBy as keyof Product] || '';
      const bVal = b[sortBy as keyof Product] || '';
      const comparison = String(aVal).localeCompare(String(bVal));
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    // Paginar
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const total = products.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const data = products.slice(start, start + limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  },

  /**
   * Obtener producto por ID
   */
  getById: (id: string): Product | null => {
    const products = getFromStorage<Product[]>(STORAGE_KEYS.PRODUCTS, []);
    return products.find((p) => p.id === id) || null;
  },

  /**
   * Obtener producto por SKU
   */
  getBySku: (sku: string): Product | null => {
    const products = getFromStorage<Product[]>(STORAGE_KEYS.PRODUCTS, []);
    return products.find((p) => p.sku.toLowerCase() === sku.toLowerCase()) || null;
  },

  /**
   * Crear producto
   */
  create: (data: Partial<Product>): Product => {
    const products = getFromStorage<Product[]>(STORAGE_KEYS.PRODUCTS, []);

    const newProduct: Product = {
      id: generateId(),
      sku: data.sku || generateSKU(),
      name: data.name || 'Nuevo Producto',
      description: data.description,
      category: data.category,
      brand: data.brand,
      imageUrl: data.imageUrl,
      barcode: data.barcode,
      weight: data.weight,
      weightUnit: data.weightUnit || 'kg',
      length: data.length,
      width: data.width,
      height: data.height,
      dimensionUnit: data.dimensionUnit || 'cm',
      costPrice: data.costPrice || 0,
      salePrice: data.salePrice || 0,
      currency: data.currency || 'COP',
      trackInventory: data.trackInventory ?? true,
      allowBackorder: data.allowBackorder ?? false,
      minStockLevel: data.minStockLevel || 5,
      reorderPoint: data.reorderPoint || 10,
      reorderQuantity: data.reorderQuantity || 20,
      status: data.status || 'active',
      isActive: data.isActive ?? true,
      tags: data.tags || [],
      customFields: data.customFields || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    products.push(newProduct);
    saveToStorage(STORAGE_KEYS.PRODUCTS, products);

    return newProduct;
  },

  /**
   * Actualizar producto
   */
  update: (id: string, data: Partial<Product>): Product | null => {
    const products = getFromStorage<Product[]>(STORAGE_KEYS.PRODUCTS, []);
    const index = products.findIndex((p) => p.id === id);

    if (index === -1) return null;

    products[index] = {
      ...products[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    saveToStorage(STORAGE_KEYS.PRODUCTS, products);
    return products[index];
  },

  /**
   * Eliminar producto
   */
  delete: (id: string): boolean => {
    const products = getFromStorage<Product[]>(STORAGE_KEYS.PRODUCTS, []);
    const filtered = products.filter((p) => p.id !== id);

    if (filtered.length === products.length) return false;

    saveToStorage(STORAGE_KEYS.PRODUCTS, filtered);
    return true;
  },

  /**
   * Importar productos desde Excel/CSV
   */
  bulkImport: (data: Partial<Product>[]): { imported: number; errors: string[] } => {
    const products = getFromStorage<Product[]>(STORAGE_KEYS.PRODUCTS, []);
    const errors: string[] = [];
    let imported = 0;

    for (const item of data) {
      try {
        if (!item.name) {
          errors.push(`Producto sin nombre: ${JSON.stringify(item)}`);
          continue;
        }

        // Verificar SKU duplicado
        if (item.sku && products.some((p) => p.sku === item.sku)) {
          errors.push(`SKU duplicado: ${item.sku}`);
          continue;
        }

        const newProduct = productService.create(item);
        products.push(newProduct);
        imported++;
      } catch (e) {
        errors.push(`Error importando: ${e}`);
      }
    }

    saveToStorage(STORAGE_KEYS.PRODUCTS, products);
    return { imported, errors };
  },
};

// ============================================
// INVENTARIO / STOCK
// ============================================

export const inventoryService = {
  /**
   * Obtener items de inventario
   */
  getAll: (filters?: InventoryFilters): PaginatedResponse<InventoryItem> => {
    let items = getFromStorage<InventoryItem[]>(STORAGE_KEYS.INVENTORY, []);
    const products = getFromStorage<Product[]>(STORAGE_KEYS.PRODUCTS, []);
    const warehouses = getFromStorage<Warehouse[]>(STORAGE_KEYS.WAREHOUSES, []);

    // Enriquecer con producto y almacén
    items = items.map((item) => ({
      ...item,
      product: products.find((p) => p.id === item.productId),
      warehouse: warehouses.find((w) => w.id === item.warehouseId),
    }));

    // Filtrar por almacén
    if (filters?.warehouseId) {
      items = items.filter((i) => i.warehouseId === filters.warehouseId);
    }

    // Filtrar por estado
    if (filters?.status?.length) {
      items = items.filter((i) => filters.status!.includes(i.status));
    }

    // Filtrar por búsqueda
    if (filters?.search) {
      const search = filters.search.toLowerCase();
      items = items.filter(
        (i) =>
          i.product?.name.toLowerCase().includes(search) ||
          i.product?.sku.toLowerCase().includes(search)
      );
    }

    // Filtrar por cantidad
    if (filters?.minQuantity !== undefined) {
      items = items.filter((i) => i.quantityAvailable >= filters.minQuantity!);
    }
    if (filters?.maxQuantity !== undefined) {
      items = items.filter((i) => i.quantityAvailable <= filters.maxQuantity!);
    }

    // Filtrar con alertas
    if (filters?.hasAlerts) {
      items = items.filter((i) => i.status === 'low_stock' || i.status === 'out_of_stock');
    }

    // Paginar
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const total = items.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const data = items.slice(start, start + limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  },

  /**
   * Obtener stock de un producto en todos los almacenes
   */
  getProductStock: (productId: string): InventoryItem[] => {
    const items = getFromStorage<InventoryItem[]>(STORAGE_KEYS.INVENTORY, []);
    return items.filter((i) => i.productId === productId);
  },

  /**
   * Obtener stock de un producto en un almacén específico
   */
  getStock: (productId: string, warehouseId: string): InventoryItem | null => {
    const items = getFromStorage<InventoryItem[]>(STORAGE_KEYS.INVENTORY, []);
    return items.find((i) => i.productId === productId && i.warehouseId === warehouseId) || null;
  },

  /**
   * Establecer stock (crear o actualizar)
   */
  setStock: (
    productId: string,
    warehouseId: string,
    quantity: number,
    unitCost?: number
  ): InventoryItem => {
    const items = getFromStorage<InventoryItem[]>(STORAGE_KEYS.INVENTORY, []);
    const product = productService.getById(productId);
    const existingIndex = items.findIndex(
      (i) => i.productId === productId && i.warehouseId === warehouseId
    );

    const cost = unitCost || product?.costPrice || 0;

    if (existingIndex !== -1) {
      // Actualizar existente
      items[existingIndex] = {
        ...items[existingIndex],
        quantityOnHand: quantity,
        quantityAvailable: quantity - items[existingIndex].quantityReserved,
        unitCost: cost,
        totalValue: quantity * cost,
        lastMovementDate: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: product ? calculateInventoryStatus({ ...items[existingIndex], quantityAvailable: quantity }, product) : 'in_stock',
      };
      saveToStorage(STORAGE_KEYS.INVENTORY, items);
      return items[existingIndex];
    } else {
      // Crear nuevo
      const newItem: InventoryItem = {
        id: generateId(),
        productId,
        warehouseId,
        quantityOnHand: quantity,
        quantityReserved: 0,
        quantityAvailable: quantity,
        quantityIncoming: 0,
        quantityOutgoing: 0,
        unitCost: cost,
        totalValue: quantity * cost,
        status: product
          ? calculateInventoryStatus({ quantityAvailable: quantity } as InventoryItem, product)
          : 'in_stock',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      items.push(newItem);
      saveToStorage(STORAGE_KEYS.INVENTORY, items);

      // Verificar alertas
      if (product && quantity <= product.minStockLevel) {
        alertService.createStockAlert(productId, warehouseId, quantity, product.minStockLevel);
      }

      return newItem;
    }
  },

  /**
   * Ajustar stock (agregar o quitar)
   */
  adjustStock: (
    productId: string,
    warehouseId: string,
    adjustment: number,
    reason: string,
    userId: string
  ): InventoryItem | null => {
    const current = inventoryService.getStock(productId, warehouseId);
    const newQuantity = (current?.quantityOnHand || 0) + adjustment;

    if (newQuantity < 0) {
      console.error('[InventoryService] Stock no puede ser negativo');
      return null;
    }

    const updated = inventoryService.setStock(productId, warehouseId, newQuantity);

    // Registrar movimiento
    movementService.create({
      type: adjustment > 0 ? 'receipt' : 'shipment',
      productId,
      toWarehouseId: adjustment > 0 ? warehouseId : undefined,
      fromWarehouseId: adjustment < 0 ? warehouseId : undefined,
      quantity: Math.abs(adjustment),
      previousQuantity: current?.quantityOnHand || 0,
      newQuantity,
      referenceType: 'adjustment',
      reason,
      performedBy: userId,
    });

    return updated;
  },

  /**
   * Reservar stock para un pedido
   */
  reserveStock: (productId: string, warehouseId: string, quantity: number): boolean => {
    const items = getFromStorage<InventoryItem[]>(STORAGE_KEYS.INVENTORY, []);
    const index = items.findIndex(
      (i) => i.productId === productId && i.warehouseId === warehouseId
    );

    if (index === -1) return false;

    const item = items[index];
    if (item.quantityAvailable < quantity) return false;

    items[index] = {
      ...item,
      quantityReserved: item.quantityReserved + quantity,
      quantityAvailable: item.quantityAvailable - quantity,
      updatedAt: new Date().toISOString(),
    };

    saveToStorage(STORAGE_KEYS.INVENTORY, items);
    return true;
  },

  /**
   * Liberar stock reservado
   */
  releaseStock: (productId: string, warehouseId: string, quantity: number): boolean => {
    const items = getFromStorage<InventoryItem[]>(STORAGE_KEYS.INVENTORY, []);
    const index = items.findIndex(
      (i) => i.productId === productId && i.warehouseId === warehouseId
    );

    if (index === -1) return false;

    const item = items[index];
    const releaseQty = Math.min(quantity, item.quantityReserved);

    items[index] = {
      ...item,
      quantityReserved: item.quantityReserved - releaseQty,
      quantityAvailable: item.quantityAvailable + releaseQty,
      updatedAt: new Date().toISOString(),
    };

    saveToStorage(STORAGE_KEYS.INVENTORY, items);
    return true;
  },

  /**
   * Obtener estadísticas generales
   */
  getStats: (warehouseId?: string): InventoryStats => {
    let items = getFromStorage<InventoryItem[]>(STORAGE_KEYS.INVENTORY, []);
    const alerts = getFromStorage<InventoryAlert[]>(STORAGE_KEYS.ALERTS, []);
    const movements = getFromStorage<InventoryMovement[]>(STORAGE_KEYS.MOVEMENTS, []);

    if (warehouseId) {
      items = items.filter((i) => i.warehouseId === warehouseId);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return {
      totalValue: items.reduce((sum, i) => sum + i.totalValue, 0),
      totalProducts: new Set(items.map((i) => i.productId)).size,
      totalUnits: items.reduce((sum, i) => sum + i.quantityOnHand, 0),
      lowStockCount: items.filter((i) => i.status === 'low_stock').length,
      outOfStockCount: items.filter((i) => i.status === 'out_of_stock').length,
      pendingAlerts: alerts.filter((a) => a.status === 'active').length,
      recentMovements: movements.filter(
        (m) => new Date(m.createdAt) >= today
      ).length,
    };
  },
};

// ============================================
// ALMACENES
// ============================================

export const warehouseService = {
  getAll: (): Warehouse[] => {
    return getFromStorage<Warehouse[]>(STORAGE_KEYS.WAREHOUSES, []);
  },

  getById: (id: string): Warehouse | null => {
    const warehouses = getFromStorage<Warehouse[]>(STORAGE_KEYS.WAREHOUSES, []);
    return warehouses.find((w) => w.id === id) || null;
  },

  getDefault: (): Warehouse | null => {
    const warehouses = getFromStorage<Warehouse[]>(STORAGE_KEYS.WAREHOUSES, []);
    return warehouses.find((w) => w.isDefault) || warehouses[0] || null;
  },

  create: (data: Partial<Warehouse>): Warehouse => {
    const warehouses = getFromStorage<Warehouse[]>(STORAGE_KEYS.WAREHOUSES, []);

    const newWarehouse: Warehouse = {
      id: generateId(),
      code: data.code || `WH${warehouses.length + 1}`,
      name: data.name || 'Nuevo Almacén',
      type: data.type || 'main',
      address: data.address || {
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'Colombia',
      },
      timezone: data.timezone || 'America/Bogota',
      contactName: data.contactName,
      contactPhone: data.contactPhone,
      contactEmail: data.contactEmail,
      isDefault: data.isDefault || warehouses.length === 0,
      isActive: data.isActive ?? true,
      allowNegativeStock: data.allowNegativeStock ?? false,
      totalCapacity: data.totalCapacity,
      usedCapacity: data.usedCapacity || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    warehouses.push(newWarehouse);
    saveToStorage(STORAGE_KEYS.WAREHOUSES, warehouses);

    return newWarehouse;
  },

  update: (id: string, data: Partial<Warehouse>): Warehouse | null => {
    const warehouses = getFromStorage<Warehouse[]>(STORAGE_KEYS.WAREHOUSES, []);
    const index = warehouses.findIndex((w) => w.id === id);

    if (index === -1) return null;

    warehouses[index] = {
      ...warehouses[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    saveToStorage(STORAGE_KEYS.WAREHOUSES, warehouses);
    return warehouses[index];
  },

  delete: (id: string): boolean => {
    const warehouses = getFromStorage<Warehouse[]>(STORAGE_KEYS.WAREHOUSES, []);
    const filtered = warehouses.filter((w) => w.id !== id);

    if (filtered.length === warehouses.length) return false;

    saveToStorage(STORAGE_KEYS.WAREHOUSES, filtered);
    return true;
  },

  /**
   * Inicializar almacén por defecto si no existe
   */
  ensureDefault: (): Warehouse => {
    const warehouses = getFromStorage<Warehouse[]>(STORAGE_KEYS.WAREHOUSES, []);

    if (warehouses.length === 0) {
      return warehouseService.create({
        code: 'PRINCIPAL',
        name: 'Bodega Principal',
        type: 'main',
        isDefault: true,
        address: {
          street: '',
          city: 'Bogotá',
          state: 'Cundinamarca',
          postalCode: '',
          country: 'Colombia',
        },
      });
    }

    return warehouses.find((w) => w.isDefault) || warehouses[0];
  },
};

// ============================================
// MOVIMIENTOS
// ============================================

export const movementService = {
  getAll: (filters?: { productId?: string; warehouseId?: string; type?: MovementType; limit?: number }): InventoryMovement[] => {
    let movements = getFromStorage<InventoryMovement[]>(STORAGE_KEYS.MOVEMENTS, []);

    if (filters?.productId) {
      movements = movements.filter((m) => m.productId === filters.productId);
    }

    if (filters?.warehouseId) {
      movements = movements.filter(
        (m) => m.fromWarehouseId === filters.warehouseId || m.toWarehouseId === filters.warehouseId
      );
    }

    if (filters?.type) {
      movements = movements.filter((m) => m.type === filters.type);
    }

    // Ordenar por fecha (más recientes primero)
    movements.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (filters?.limit) {
      movements = movements.slice(0, filters.limit);
    }

    return movements;
  },

  create: (data: Partial<InventoryMovement>): InventoryMovement => {
    const movements = getFromStorage<InventoryMovement[]>(STORAGE_KEYS.MOVEMENTS, []);

    const newMovement: InventoryMovement = {
      id: generateId(),
      type: data.type || 'adjustment',
      productId: data.productId || '',
      fromWarehouseId: data.fromWarehouseId,
      toWarehouseId: data.toWarehouseId,
      quantity: data.quantity || 0,
      previousQuantity: data.previousQuantity || 0,
      newQuantity: data.newQuantity || 0,
      referenceType: data.referenceType,
      referenceId: data.referenceId,
      unitCost: data.unitCost,
      totalCost: data.totalCost,
      lotNumber: data.lotNumber,
      reason: data.reason,
      notes: data.notes,
      performedBy: data.performedBy || 'system',
      createdAt: new Date().toISOString(),
    };

    movements.push(newMovement);
    saveToStorage(STORAGE_KEYS.MOVEMENTS, movements);

    return newMovement;
  },
};

// ============================================
// ALERTAS
// ============================================

export const alertService = {
  getAll: (filters?: { status?: string; productId?: string }): InventoryAlert[] => {
    let alerts = getFromStorage<InventoryAlert[]>(STORAGE_KEYS.ALERTS, []);

    if (filters?.status) {
      alerts = alerts.filter((a) => a.status === filters.status);
    }

    if (filters?.productId) {
      alerts = alerts.filter((a) => a.productId === filters.productId);
    }

    return alerts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getActive: (): InventoryAlert[] => {
    return alertService.getAll({ status: 'active' });
  },

  createStockAlert: (
    productId: string,
    warehouseId: string,
    currentQuantity: number,
    threshold: number
  ): InventoryAlert => {
    const alerts = getFromStorage<InventoryAlert[]>(STORAGE_KEYS.ALERTS, []);
    const product = productService.getById(productId);

    const isOutOfStock = currentQuantity <= 0;
    const alertType = isOutOfStock ? 'out_of_stock' : 'low_stock';
    const severity = isOutOfStock ? 'critical' : currentQuantity <= threshold / 2 ? 'high' : 'medium';

    const newAlert: InventoryAlert = {
      id: generateId(),
      type: alertType,
      severity,
      productId,
      warehouseId,
      message: isOutOfStock
        ? `${product?.name || 'Producto'} está agotado`
        : `Stock bajo de ${product?.name || 'Producto'}: ${currentQuantity} unidades`,
      currentValue: currentQuantity,
      thresholdValue: threshold,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    alerts.push(newAlert);
    saveToStorage(STORAGE_KEYS.ALERTS, alerts);

    return newAlert;
  },

  acknowledge: (alertId: string, userId: string): boolean => {
    const alerts = getFromStorage<InventoryAlert[]>(STORAGE_KEYS.ALERTS, []);
    const index = alerts.findIndex((a) => a.id === alertId);

    if (index === -1) return false;

    alerts[index] = {
      ...alerts[index],
      status: 'acknowledged',
      acknowledgedBy: userId,
      acknowledgedAt: new Date().toISOString(),
    };

    saveToStorage(STORAGE_KEYS.ALERTS, alerts);
    return true;
  },

  resolve: (alertId: string): boolean => {
    const alerts = getFromStorage<InventoryAlert[]>(STORAGE_KEYS.ALERTS, []);
    const index = alerts.findIndex((a) => a.id === alertId);

    if (index === -1) return false;

    alerts[index] = {
      ...alerts[index],
      status: 'resolved',
      resolvedAt: new Date().toISOString(),
    };

    saveToStorage(STORAGE_KEYS.ALERTS, alerts);
    return true;
  },
};

// ============================================
// EXPORTAR SERVICIO UNIFICADO
// ============================================

export const inventoryModule = {
  products: productService,
  inventory: inventoryService,
  warehouses: warehouseService,
  movements: movementService,
  alerts: alertService,
};

export default inventoryModule;
