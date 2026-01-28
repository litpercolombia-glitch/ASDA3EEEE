/**
 * Multi-Warehouse Service
 *
 * Servicio para gestión de múltiples almacenes con:
 * - Distribución inteligente de inventario
 * - Transferencias entre almacenes
 * - Fulfillment optimizado
 * - Reglas de distribución
 */

import type {
  Warehouse,
  WarehouseType,
  WarehouseStatus,
  MultiWarehouseInventory,
  WarehouseStockLevel,
  InventoryTransfer,
  TransferStatus,
  TransferItem,
  FulfillmentRequest,
  FulfillmentPlan,
  FulfillmentStrategy,
  FulfillmentAllocation,
  DistributionRule,
  WarehouseAnalytics,
  NetworkOverview,
} from '@/types/multiWarehouse.types';

// ============================================
// STORAGE KEYS
// ============================================

const STORAGE_KEYS = {
  WAREHOUSES: 'litper_warehouses',
  INVENTORY: 'litper_mw_inventory',
  TRANSFERS: 'litper_transfers',
  RULES: 'litper_distribution_rules',
};

// ============================================
// SERVICIO DE ALMACENES
// ============================================

class WarehouseService {
  private warehouses: Map<string, Warehouse> = new Map();

  constructor() {
    this.loadFromStorage();
    this.ensureDefaultWarehouse();
  }

  private loadFromStorage(): void {
    const stored = localStorage.getItem(STORAGE_KEYS.WAREHOUSES);
    if (stored) {
      const warehouses: Warehouse[] = JSON.parse(stored);
      warehouses.forEach(w => this.warehouses.set(w.id, w));
    }
  }

  private save(): void {
    const warehouses = Array.from(this.warehouses.values());
    localStorage.setItem(STORAGE_KEYS.WAREHOUSES, JSON.stringify(warehouses));
  }

  private ensureDefaultWarehouse(): void {
    if (this.warehouses.size === 0) {
      const defaultWarehouse: Warehouse = {
        id: 'wh_default',
        code: 'BOG-01',
        name: 'Almacén Principal Bogotá',
        type: 'main',
        status: 'active',
        location: {
          address: 'Zona Franca Bogotá',
          city: 'Bogotá',
          cityCode: '11001',
          department: 'Bogotá D.C.',
          departmentCode: '11',
          country: 'Colombia',
          countryCode: 'CO',
          latitude: 4.6097,
          longitude: -74.0817,
          timezone: 'America/Bogota',
        },
        capacity: {
          totalArea: 5000,
          usableArea: 4000,
          usedArea: 2500,
          totalPositions: 10000,
          usedPositions: 6500,
          maxWeight: 500000,
          currentWeight: 325000,
          utilizationPercentage: 65,
        },
        config: {
          canFulfill: true,
          fulfillmentPriority: 1,
          maxDailyOrders: 1000,
          cutoffTime: '16:00',
          canReceive: true,
          requiresAppointment: true,
          canTransferOut: true,
          canTransferIn: true,
          canProcessReturns: true,
          enabledCarriers: ['servientrega', 'coordinadora', 'interrapidisimo', 'envia'],
          enabledShippingMethods: ['standard', 'express', 'same_day'],
          safetyStockPercentage: 20,
          autoReplenish: true,
          replenishThreshold: 30,
        },
        coverageZones: [
          {
            id: 'zone_bog',
            name: 'Bogotá y alrededores',
            type: 'radius',
            values: [],
            radius: 50,
            priority: 1,
            deliveryDays: 1,
            isFreeShipping: true,
            freeShippingMinimum: 100000,
          },
          {
            id: 'zone_cund',
            name: 'Cundinamarca',
            type: 'department',
            values: ['25'],
            priority: 2,
            deliveryDays: 2,
            shippingCost: 15000,
          },
        ],
        operatingHours: {
          monday: { isOpen: true, openTime: '07:00', closeTime: '18:00' },
          tuesday: { isOpen: true, openTime: '07:00', closeTime: '18:00' },
          wednesday: { isOpen: true, openTime: '07:00', closeTime: '18:00' },
          thursday: { isOpen: true, openTime: '07:00', closeTime: '18:00' },
          friday: { isOpen: true, openTime: '07:00', closeTime: '18:00' },
          saturday: { isOpen: true, openTime: '08:00', closeTime: '14:00' },
          sunday: { isOpen: false },
          holidays: [],
        },
        contact: {
          managerName: 'Carlos Rodríguez',
          email: 'almacen.bogota@litper.co',
          phone: '+57 1 234 5678',
          emergencyPhone: '+57 310 123 4567',
        },
        metrics: {
          ordersToday: 0,
          ordersThisWeek: 0,
          ordersThisMonth: 0,
          averageOrdersPerDay: 0,
          averagePickTime: 5,
          averagePackTime: 3,
          averageShipTime: 2,
          pickAccuracy: 99.5,
          shipAccuracy: 99.8,
          skuCount: 0,
          totalUnits: 0,
          lowStockItems: 0,
          outOfStockItems: 0,
          returnsProcessedToday: 0,
          returnsProcessedThisMonth: 0,
          updatedAt: new Date(),
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
      };

      this.warehouses.set(defaultWarehouse.id, defaultWarehouse);
      this.save();
    }
  }

  // CRUD
  getAll(): Warehouse[] {
    return Array.from(this.warehouses.values())
      .sort((a, b) => a.config.fulfillmentPriority - b.config.fulfillmentPriority);
  }

  getActive(): Warehouse[] {
    return this.getAll().filter(w => w.isActive && w.status === 'active');
  }

  getById(id: string): Warehouse | null {
    return this.warehouses.get(id) || null;
  }

  getByCode(code: string): Warehouse | null {
    return Array.from(this.warehouses.values())
      .find(w => w.code === code) || null;
  }

  create(data: Partial<Warehouse>): Warehouse {
    const id = `wh_${Date.now()}`;
    const now = new Date();

    const warehouse: Warehouse = {
      id,
      code: data.code || `WH-${String(this.warehouses.size + 1).padStart(2, '0')}`,
      name: data.name || 'Nuevo Almacén',
      type: data.type || 'distribution',
      status: data.status || 'active',
      location: data.location || {
        address: '',
        city: '',
        cityCode: '',
        department: '',
        departmentCode: '',
        country: 'Colombia',
        countryCode: 'CO',
        latitude: 0,
        longitude: 0,
        timezone: 'America/Bogota',
      },
      capacity: data.capacity || {
        totalArea: 0,
        usableArea: 0,
        usedArea: 0,
        totalPositions: 0,
        usedPositions: 0,
        maxWeight: 0,
        currentWeight: 0,
        utilizationPercentage: 0,
      },
      config: data.config || {
        canFulfill: true,
        fulfillmentPriority: this.warehouses.size + 1,
        maxDailyOrders: 500,
        cutoffTime: '16:00',
        canReceive: true,
        requiresAppointment: false,
        canTransferOut: true,
        canTransferIn: true,
        canProcessReturns: false,
        enabledCarriers: [],
        enabledShippingMethods: ['standard'],
        safetyStockPercentage: 20,
        autoReplenish: false,
        replenishThreshold: 30,
      },
      coverageZones: data.coverageZones || [],
      operatingHours: data.operatingHours || {
        monday: { isOpen: true, openTime: '08:00', closeTime: '17:00' },
        tuesday: { isOpen: true, openTime: '08:00', closeTime: '17:00' },
        wednesday: { isOpen: true, openTime: '08:00', closeTime: '17:00' },
        thursday: { isOpen: true, openTime: '08:00', closeTime: '17:00' },
        friday: { isOpen: true, openTime: '08:00', closeTime: '17:00' },
        saturday: { isOpen: false },
        sunday: { isOpen: false },
        holidays: [],
      },
      contact: data.contact || {
        managerName: '',
        email: '',
        phone: '',
      },
      metrics: {
        ordersToday: 0,
        ordersThisWeek: 0,
        ordersThisMonth: 0,
        averageOrdersPerDay: 0,
        averagePickTime: 0,
        averagePackTime: 0,
        averageShipTime: 0,
        pickAccuracy: 100,
        shipAccuracy: 100,
        skuCount: 0,
        totalUnits: 0,
        lowStockItems: 0,
        outOfStockItems: 0,
        returnsProcessedToday: 0,
        returnsProcessedThisMonth: 0,
        updatedAt: now,
      },
      createdAt: now,
      updatedAt: now,
      isActive: true,
    };

    this.warehouses.set(id, warehouse);
    this.save();
    return warehouse;
  }

  update(id: string, updates: Partial<Warehouse>): Warehouse {
    const warehouse = this.warehouses.get(id);
    if (!warehouse) throw new Error('Almacén no encontrado');

    const updated: Warehouse = {
      ...warehouse,
      ...updates,
      updatedAt: new Date(),
    };

    this.warehouses.set(id, updated);
    this.save();
    return updated;
  }

  delete(id: string): void {
    this.warehouses.delete(id);
    this.save();
  }

  // Utilidades
  findBestWarehouse(cityCode: string, departmentCode: string): Warehouse | null {
    const activeWarehouses = this.getActive();

    // Buscar almacén con cobertura para esta zona
    for (const warehouse of activeWarehouses) {
      for (const zone of warehouse.coverageZones) {
        if (zone.type === 'city' && zone.values.includes(cityCode)) {
          return warehouse;
        }
        if (zone.type === 'department' && zone.values.includes(departmentCode)) {
          return warehouse;
        }
      }
    }

    // Devolver el de mayor prioridad como fallback
    return activeWarehouses[0] || null;
  }

  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    // Haversine formula
    const R = 6371; // km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}

// ============================================
// SERVICIO DE INVENTARIO MULTI-ALMACÉN
// ============================================

class MultiWarehouseInventoryService {
  private inventory: Map<string, MultiWarehouseInventory> = new Map();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    const stored = localStorage.getItem(STORAGE_KEYS.INVENTORY);
    if (stored) {
      const items: MultiWarehouseInventory[] = JSON.parse(stored);
      items.forEach(i => this.inventory.set(i.productId, i));
    }
  }

  private save(): void {
    const items = Array.from(this.inventory.values());
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(items));
  }

  getAll(): MultiWarehouseInventory[] {
    return Array.from(this.inventory.values());
  }

  getByProduct(productId: string): MultiWarehouseInventory | null {
    return this.inventory.get(productId) || null;
  }

  getStockInWarehouse(productId: string, warehouseId: string): WarehouseStockLevel | null {
    const inv = this.inventory.get(productId);
    if (!inv) return null;
    return inv.warehouseStock.find(ws => ws.warehouseId === warehouseId) || null;
  }

  setStock(
    productId: string,
    warehouseId: string,
    quantity: number,
    options?: {
      sku?: string;
      productName?: string;
      warehouseCode?: string;
      warehouseName?: string;
      location?: string;
    }
  ): MultiWarehouseInventory {
    let inv = this.inventory.get(productId);

    if (!inv) {
      inv = {
        productId,
        sku: options?.sku || productId,
        productName: options?.productName || 'Producto',
        totalQuantity: 0,
        totalAvailable: 0,
        totalReserved: 0,
        totalInTransit: 0,
        warehouseStock: [],
        isMultiWarehouse: true,
        reorderPoint: 10,
        reorderQuantity: 50,
        globalStatus: 'in_stock',
        updatedAt: new Date(),
      };
    }

    // Buscar o crear stock level para este almacén
    let stockLevel = inv.warehouseStock.find(ws => ws.warehouseId === warehouseId);

    if (!stockLevel) {
      stockLevel = {
        warehouseId,
        warehouseCode: options?.warehouseCode || warehouseId,
        warehouseName: options?.warehouseName || 'Almacén',
        quantityOnHand: 0,
        quantityAvailable: 0,
        quantityReserved: 0,
        quantityIncoming: 0,
        minStock: 5,
        maxStock: 100,
        reorderPoint: 10,
        status: 'available',
        lastReceivedAt: null,
        lastShippedAt: null,
        lastCountedAt: null,
      };
      inv.warehouseStock.push(stockLevel);
    }

    stockLevel.quantityOnHand = quantity;
    stockLevel.quantityAvailable = quantity - stockLevel.quantityReserved;
    stockLevel.location = options?.location;
    stockLevel.status = this.calculateStockStatus(stockLevel);

    // Recalcular totales
    this.recalculateTotals(inv);

    this.inventory.set(productId, inv);
    this.save();
    return inv;
  }

  adjustStock(
    productId: string,
    warehouseId: string,
    adjustment: number,
    reason?: string
  ): MultiWarehouseInventory {
    const inv = this.inventory.get(productId);
    if (!inv) throw new Error('Producto no encontrado en inventario');

    const stockLevel = inv.warehouseStock.find(ws => ws.warehouseId === warehouseId);
    if (!stockLevel) throw new Error('Producto no encontrado en este almacén');

    stockLevel.quantityOnHand += adjustment;
    stockLevel.quantityAvailable = stockLevel.quantityOnHand - stockLevel.quantityReserved;
    stockLevel.status = this.calculateStockStatus(stockLevel);

    if (adjustment > 0) {
      stockLevel.lastReceivedAt = new Date();
    } else {
      stockLevel.lastShippedAt = new Date();
    }

    this.recalculateTotals(inv);
    this.save();
    return inv;
  }

  reserveStock(productId: string, warehouseId: string, quantity: number): boolean {
    const inv = this.inventory.get(productId);
    if (!inv) return false;

    const stockLevel = inv.warehouseStock.find(ws => ws.warehouseId === warehouseId);
    if (!stockLevel || stockLevel.quantityAvailable < quantity) return false;

    stockLevel.quantityReserved += quantity;
    stockLevel.quantityAvailable -= quantity;
    stockLevel.status = this.calculateStockStatus(stockLevel);

    this.recalculateTotals(inv);
    this.save();
    return true;
  }

  releaseStock(productId: string, warehouseId: string, quantity: number): void {
    const inv = this.inventory.get(productId);
    if (!inv) return;

    const stockLevel = inv.warehouseStock.find(ws => ws.warehouseId === warehouseId);
    if (!stockLevel) return;

    stockLevel.quantityReserved = Math.max(0, stockLevel.quantityReserved - quantity);
    stockLevel.quantityAvailable = stockLevel.quantityOnHand - stockLevel.quantityReserved;
    stockLevel.status = this.calculateStockStatus(stockLevel);

    this.recalculateTotals(inv);
    this.save();
  }

  private calculateStockStatus(level: WarehouseStockLevel): 'available' | 'low' | 'out' | 'blocked' {
    if (level.quantityAvailable <= 0) return 'out';
    if (level.quantityOnHand <= level.reorderPoint) return 'low';
    return 'available';
  }

  private recalculateTotals(inv: MultiWarehouseInventory): void {
    inv.totalQuantity = inv.warehouseStock.reduce((sum, ws) => sum + ws.quantityOnHand, 0);
    inv.totalAvailable = inv.warehouseStock.reduce((sum, ws) => sum + ws.quantityAvailable, 0);
    inv.totalReserved = inv.warehouseStock.reduce((sum, ws) => sum + ws.quantityReserved, 0);
    inv.totalInTransit = inv.warehouseStock.reduce((sum, ws) => sum + ws.quantityIncoming, 0);

    if (inv.totalAvailable <= 0) {
      inv.globalStatus = 'out_of_stock';
    } else if (inv.totalQuantity <= inv.reorderPoint) {
      inv.globalStatus = 'low_stock';
    } else {
      inv.globalStatus = 'in_stock';
    }

    inv.updatedAt = new Date();
  }

  getLowStockItems(): MultiWarehouseInventory[] {
    return this.getAll().filter(i => i.globalStatus === 'low_stock' || i.globalStatus === 'out_of_stock');
  }
}

// ============================================
// SERVICIO DE TRANSFERENCIAS
// ============================================

class TransferService {
  private transfers: Map<string, InventoryTransfer> = new Map();
  private inventoryService: MultiWarehouseInventoryService;

  constructor(inventoryService: MultiWarehouseInventoryService) {
    this.inventoryService = inventoryService;
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    const stored = localStorage.getItem(STORAGE_KEYS.TRANSFERS);
    if (stored) {
      const transfers: InventoryTransfer[] = JSON.parse(stored);
      transfers.forEach(t => this.transfers.set(t.id, t));
    }
  }

  private save(): void {
    const transfers = Array.from(this.transfers.values());
    localStorage.setItem(STORAGE_KEYS.TRANSFERS, JSON.stringify(transfers));
  }

  getAll(): InventoryTransfer[] {
    return Array.from(this.transfers.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getById(id: string): InventoryTransfer | null {
    return this.transfers.get(id) || null;
  }

  create(data: {
    sourceWarehouseId: string;
    sourceWarehouseCode: string;
    destinationWarehouseId: string;
    destinationWarehouseCode: string;
    type: InventoryTransfer['type'];
    items: Omit<TransferItem, 'id' | 'approvedQuantity' | 'shippedQuantity' | 'receivedQuantity' | 'discrepancy'>[];
    expectedArrivalDate: Date;
    requestedBy: string;
    notes?: string;
  }): InventoryTransfer {
    const now = new Date();
    const id = `tr_${Date.now()}`;
    const transferNumber = `TR-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(this.transfers.size + 1).padStart(4, '0')}`;

    const items: TransferItem[] = data.items.map((item, index) => ({
      ...item,
      id: `tri_${Date.now()}_${index}`,
      approvedQuantity: 0,
      shippedQuantity: 0,
      receivedQuantity: 0,
      discrepancy: 0,
    }));

    const transfer: InventoryTransfer = {
      id,
      transferNumber,
      type: data.type,
      status: 'draft',
      sourceWarehouseId: data.sourceWarehouseId,
      sourceWarehouseCode: data.sourceWarehouseCode,
      destinationWarehouseId: data.destinationWarehouseId,
      destinationWarehouseCode: data.destinationWarehouseCode,
      items,
      totalItems: items.length,
      totalUnits: items.reduce((sum, i) => sum + i.requestedQuantity, 0),
      requestedDate: now,
      expectedArrivalDate: data.expectedArrivalDate,
      shippedDate: null,
      receivedDate: null,
      notes: data.notes,
      requestedBy: data.requestedBy,
      createdAt: now,
      updatedAt: now,
    };

    this.transfers.set(id, transfer);
    this.save();
    return transfer;
  }

  approve(id: string, approvedBy: string): InventoryTransfer {
    const transfer = this.transfers.get(id);
    if (!transfer) throw new Error('Transferencia no encontrada');

    transfer.status = 'approved';
    transfer.approvedBy = approvedBy;
    transfer.approvedAt = new Date();

    // Aprobar cantidades
    transfer.items.forEach(item => {
      item.approvedQuantity = item.requestedQuantity;
    });

    // Reservar stock en origen
    transfer.items.forEach(item => {
      this.inventoryService.reserveStock(
        item.productId,
        transfer.sourceWarehouseId,
        item.approvedQuantity
      );
    });

    transfer.updatedAt = new Date();
    this.save();
    return transfer;
  }

  ship(id: string, trackingNumber?: string, carrier?: string): InventoryTransfer {
    const transfer = this.transfers.get(id);
    if (!transfer) throw new Error('Transferencia no encontrada');

    transfer.status = 'shipped';
    transfer.shippedDate = new Date();
    transfer.trackingNumber = trackingNumber;
    transfer.carrier = carrier;

    // Marcar como enviado
    transfer.items.forEach(item => {
      item.shippedQuantity = item.approvedQuantity;

      // Descontar del origen
      this.inventoryService.releaseStock(
        item.productId,
        transfer.sourceWarehouseId,
        item.shippedQuantity
      );
      this.inventoryService.adjustStock(
        item.productId,
        transfer.sourceWarehouseId,
        -item.shippedQuantity,
        `Transferencia ${transfer.transferNumber}`
      );
    });

    transfer.updatedAt = new Date();
    this.save();
    return transfer;
  }

  receive(
    id: string,
    receivedItems: { itemId: string; receivedQuantity: number; discrepancyReason?: string }[]
  ): InventoryTransfer {
    const transfer = this.transfers.get(id);
    if (!transfer) throw new Error('Transferencia no encontrada');

    transfer.status = 'completed';
    transfer.receivedDate = new Date();

    // Actualizar cantidades recibidas
    receivedItems.forEach(ri => {
      const item = transfer.items.find(i => i.id === ri.itemId);
      if (item) {
        item.receivedQuantity = ri.receivedQuantity;
        item.discrepancy = item.shippedQuantity - ri.receivedQuantity;
        item.discrepancyReason = ri.discrepancyReason;

        // Agregar al destino
        this.inventoryService.adjustStock(
          item.productId,
          transfer.destinationWarehouseId,
          ri.receivedQuantity,
          `Transferencia ${transfer.transferNumber}`
        );
      }
    });

    transfer.updatedAt = new Date();
    this.save();
    return transfer;
  }

  cancel(id: string, reason: string): InventoryTransfer {
    const transfer = this.transfers.get(id);
    if (!transfer) throw new Error('Transferencia no encontrada');

    // Liberar stock reservado si ya estaba aprobada
    if (['approved', 'picking', 'packed'].includes(transfer.status)) {
      transfer.items.forEach(item => {
        this.inventoryService.releaseStock(
          item.productId,
          transfer.sourceWarehouseId,
          item.approvedQuantity
        );
      });
    }

    transfer.status = 'cancelled';
    transfer.notes = `${transfer.notes || ''}\n[CANCELADA] ${reason}`;
    transfer.updatedAt = new Date();

    this.save();
    return transfer;
  }
}

// ============================================
// SERVICIO DE FULFILLMENT
// ============================================

class FulfillmentService {
  private warehouseService: WarehouseService;
  private inventoryService: MultiWarehouseInventoryService;

  constructor(
    warehouseService: WarehouseService,
    inventoryService: MultiWarehouseInventoryService
  ) {
    this.warehouseService = warehouseService;
    this.inventoryService = inventoryService;
  }

  /**
   * Genera un plan de fulfillment óptimo
   */
  createFulfillmentPlan(
    request: FulfillmentRequest,
    strategy: FulfillmentStrategy = 'balanced'
  ): FulfillmentPlan {
    const allocations: FulfillmentAllocation[] = [];

    switch (strategy) {
      case 'nearest_warehouse':
        return this.planNearestWarehouse(request);
      case 'lowest_cost':
        return this.planLowestCost(request);
      case 'fastest_delivery':
        return this.planFastestDelivery(request);
      case 'single_warehouse':
        return this.planSingleWarehouse(request);
      case 'split_shipment':
        return this.planSplitShipment(request);
      case 'balanced':
      default:
        return this.planBalanced(request);
    }
  }

  private planNearestWarehouse(request: FulfillmentRequest): FulfillmentPlan {
    const warehouses = this.warehouseService.getActive();

    // Calcular distancia a cada almacén
    const warehousesWithDistance = warehouses
      .filter(w => w.config.canFulfill)
      .map(w => ({
        warehouse: w,
        distance: request.shippingAddress.latitude && request.shippingAddress.longitude
          ? this.warehouseService.calculateDistance(
              w.location.latitude,
              w.location.longitude,
              request.shippingAddress.latitude,
              request.shippingAddress.longitude
            )
          : 9999,
      }))
      .sort((a, b) => a.distance - b.distance);

    // Intentar asignar todo al almacén más cercano con stock
    for (const { warehouse } of warehousesWithDistance) {
      const allocation = this.tryAllocateFromWarehouse(warehouse, request.items);
      if (allocation && allocation.items.length === request.items.length) {
        return {
          orderId: request.orderId,
          strategy: 'nearest_warehouse',
          allocations: [allocation],
          totalShipments: 1,
          estimatedDeliveryDate: this.estimateDelivery(warehouse, request),
          totalShippingCost: allocation.estimatedShippingCost,
        };
      }
    }

    // Si no se puede desde uno solo, dividir
    return this.planSplitShipment(request);
  }

  private planLowestCost(request: FulfillmentRequest): FulfillmentPlan {
    // Simplificado: usar el almacén con menor costo de envío
    const warehouses = this.warehouseService.getActive()
      .filter(w => w.config.canFulfill)
      .sort((a, b) => a.config.fulfillmentPriority - b.config.fulfillmentPriority);

    for (const warehouse of warehouses) {
      const allocation = this.tryAllocateFromWarehouse(warehouse, request.items);
      if (allocation && allocation.items.length === request.items.length) {
        return {
          orderId: request.orderId,
          strategy: 'lowest_cost',
          allocations: [allocation],
          totalShipments: 1,
          estimatedDeliveryDate: this.estimateDelivery(warehouse, request),
          totalShippingCost: allocation.estimatedShippingCost,
        };
      }
    }

    return this.planSplitShipment(request);
  }

  private planFastestDelivery(request: FulfillmentRequest): FulfillmentPlan {
    return this.planNearestWarehouse(request);
  }

  private planSingleWarehouse(request: FulfillmentRequest): FulfillmentPlan {
    const warehouse = this.warehouseService.findBestWarehouse(
      request.shippingAddress.cityCode,
      request.shippingAddress.departmentCode
    );

    if (!warehouse) {
      throw new Error('No hay almacenes disponibles');
    }

    const allocation = this.tryAllocateFromWarehouse(warehouse, request.items);

    if (!allocation || allocation.items.length < request.items.length) {
      throw new Error('Stock insuficiente en el almacén seleccionado');
    }

    return {
      orderId: request.orderId,
      strategy: 'single_warehouse',
      allocations: [allocation],
      totalShipments: 1,
      estimatedDeliveryDate: this.estimateDelivery(warehouse, request),
      totalShippingCost: allocation.estimatedShippingCost,
    };
  }

  private planSplitShipment(request: FulfillmentRequest): FulfillmentPlan {
    const allocations: FulfillmentAllocation[] = [];
    const remainingItems = [...request.items];
    const warehouses = this.warehouseService.getActive()
      .filter(w => w.config.canFulfill);

    for (const warehouse of warehouses) {
      if (remainingItems.length === 0) break;

      const allocation = this.tryAllocateFromWarehouse(warehouse, remainingItems);
      if (allocation && allocation.items.length > 0) {
        allocations.push(allocation);

        // Remover items asignados
        allocation.items.forEach(allocated => {
          const idx = remainingItems.findIndex(i => i.productId === allocated.productId);
          if (idx >= 0) {
            remainingItems[idx].quantity -= allocated.quantity;
            if (remainingItems[idx].quantity <= 0) {
              remainingItems.splice(idx, 1);
            }
          }
        });
      }
    }

    if (remainingItems.length > 0) {
      throw new Error('No hay stock suficiente en ningún almacén');
    }

    return {
      orderId: request.orderId,
      strategy: 'split_shipment',
      allocations,
      totalShipments: allocations.length,
      estimatedDeliveryDate: new Date(Math.max(...allocations.map(a =>
        this.estimateDelivery(this.warehouseService.getById(a.warehouseId)!, request).getTime()
      ))),
      totalShippingCost: allocations.reduce((sum, a) => sum + a.estimatedShippingCost, 0),
    };
  }

  private planBalanced(request: FulfillmentRequest): FulfillmentPlan {
    // Intentar primero desde un solo almacén
    try {
      return this.planSingleWarehouse(request);
    } catch {
      // Si no es posible, dividir
      return this.planSplitShipment(request);
    }
  }

  private tryAllocateFromWarehouse(
    warehouse: Warehouse,
    items: FulfillmentRequest['items']
  ): FulfillmentAllocation | null {
    const allocatedItems: FulfillmentAllocation['items'] = [];

    for (const item of items) {
      const stock = this.inventoryService.getStockInWarehouse(item.productId, warehouse.id);
      if (stock && stock.quantityAvailable >= item.quantity) {
        allocatedItems.push({
          productId: item.productId,
          sku: item.sku,
          quantity: item.quantity,
          location: stock.location,
        });
      }
    }

    if (allocatedItems.length === 0) return null;

    return {
      warehouseId: warehouse.id,
      warehouseCode: warehouse.code,
      items: allocatedItems,
      carrier: warehouse.config.enabledCarriers[0] || 'default',
      shippingMethod: warehouse.config.enabledShippingMethods[0] || 'standard',
      estimatedShippingCost: 15000, // Simplificado
      estimatedDeliveryDays: 2,
      priority: warehouse.config.fulfillmentPriority,
    };
  }

  private estimateDelivery(warehouse: Warehouse, request: FulfillmentRequest): Date {
    const zone = warehouse.coverageZones.find(z => {
      if (z.type === 'city') return z.values.includes(request.shippingAddress.cityCode);
      if (z.type === 'department') return z.values.includes(request.shippingAddress.departmentCode);
      return false;
    });

    const days = zone?.deliveryDays || 3;
    const delivery = new Date();
    delivery.setDate(delivery.getDate() + days);
    return delivery;
  }
}

// ============================================
// INSTANCIAS SINGLETON
// ============================================

export const warehouseService = new WarehouseService();
export const multiWarehouseInventory = new MultiWarehouseInventoryService();
export const transferService = new TransferService(multiWarehouseInventory);
export const fulfillmentService = new FulfillmentService(warehouseService, multiWarehouseInventory);

// ============================================
// HOOKS
// ============================================

export function useWarehouses() {
  return {
    getAll: warehouseService.getAll.bind(warehouseService),
    getActive: warehouseService.getActive.bind(warehouseService),
    getById: warehouseService.getById.bind(warehouseService),
    create: warehouseService.create.bind(warehouseService),
    update: warehouseService.update.bind(warehouseService),
    delete: warehouseService.delete.bind(warehouseService),
    findBestWarehouse: warehouseService.findBestWarehouse.bind(warehouseService),
  };
}

export function useMultiWarehouseInventory() {
  return {
    getAll: multiWarehouseInventory.getAll.bind(multiWarehouseInventory),
    getByProduct: multiWarehouseInventory.getByProduct.bind(multiWarehouseInventory),
    setStock: multiWarehouseInventory.setStock.bind(multiWarehouseInventory),
    adjustStock: multiWarehouseInventory.adjustStock.bind(multiWarehouseInventory),
    reserveStock: multiWarehouseInventory.reserveStock.bind(multiWarehouseInventory),
    releaseStock: multiWarehouseInventory.releaseStock.bind(multiWarehouseInventory),
    getLowStockItems: multiWarehouseInventory.getLowStockItems.bind(multiWarehouseInventory),
  };
}

export function useTransfers() {
  return {
    getAll: transferService.getAll.bind(transferService),
    getById: transferService.getById.bind(transferService),
    create: transferService.create.bind(transferService),
    approve: transferService.approve.bind(transferService),
    ship: transferService.ship.bind(transferService),
    receive: transferService.receive.bind(transferService),
    cancel: transferService.cancel.bind(transferService),
  };
}

export function useFulfillment() {
  return {
    createPlan: fulfillmentService.createFulfillmentPlan.bind(fulfillmentService),
  };
}

export default {
  warehouseService,
  multiWarehouseInventory,
  transferService,
  fulfillmentService,
};
