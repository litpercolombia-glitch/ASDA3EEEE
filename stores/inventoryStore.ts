/**
 * Inventory Store
 * ===============
 *
 * Store de Zustand para gestión de inventario.
 * Maneja estado global de productos, stock y alertas.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Product,
  InventoryItem,
  Warehouse,
  InventoryMovement,
  InventoryAlert,
  InventoryFilters,
  InventoryStats,
  PaginatedResponse,
} from '../types/inventory.types';
import {
  productService,
  inventoryService,
  warehouseService,
  movementService,
  alertService,
} from '../services/inventoryService';

// ============================================
// TIPOS DEL STORE
// ============================================

interface InventoryState {
  // Estado
  products: Product[];
  inventory: InventoryItem[];
  warehouses: Warehouse[];
  movements: InventoryMovement[];
  alerts: InventoryAlert[];
  stats: InventoryStats | null;

  // UI State
  selectedWarehouseId: string | null;
  filters: InventoryFilters;
  isLoading: boolean;
  error: string | null;

  // Paginación
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };

  // Actions - Productos
  loadProducts: (filters?: InventoryFilters) => void;
  createProduct: (data: Partial<Product>) => Product;
  updateProduct: (id: string, data: Partial<Product>) => Product | null;
  deleteProduct: (id: string) => boolean;
  importProducts: (data: Partial<Product>[]) => { imported: number; errors: string[] };

  // Actions - Inventario
  loadInventory: (filters?: InventoryFilters) => void;
  setStock: (productId: string, warehouseId: string, quantity: number, unitCost?: number) => InventoryItem;
  adjustStock: (productId: string, warehouseId: string, adjustment: number, reason: string) => InventoryItem | null;
  reserveStock: (productId: string, warehouseId: string, quantity: number) => boolean;
  releaseStock: (productId: string, warehouseId: string, quantity: number) => boolean;

  // Actions - Almacenes
  loadWarehouses: () => void;
  createWarehouse: (data: Partial<Warehouse>) => Warehouse;
  updateWarehouse: (id: string, data: Partial<Warehouse>) => Warehouse | null;
  deleteWarehouse: (id: string) => boolean;
  selectWarehouse: (id: string | null) => void;

  // Actions - Alertas
  loadAlerts: () => void;
  acknowledgeAlert: (alertId: string) => boolean;
  resolveAlert: (alertId: string) => boolean;

  // Actions - Estadísticas
  loadStats: (warehouseId?: string) => void;

  // Actions - UI
  setFilters: (filters: Partial<InventoryFilters>) => void;
  resetFilters: () => void;
  setPage: (page: number) => void;
  setError: (error: string | null) => void;

  // Actions - Inicialización
  initialize: () => void;
}

// ============================================
// ESTADO INICIAL
// ============================================

const initialFilters: InventoryFilters = {
  search: '',
  warehouseId: undefined,
  status: [],
  sortBy: 'name',
  sortOrder: 'asc',
  page: 1,
  limit: 20,
};

const initialPagination = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
};

// ============================================
// STORE
// ============================================

export const useInventoryStore = create<InventoryState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      products: [],
      inventory: [],
      warehouses: [],
      movements: [],
      alerts: [],
      stats: null,
      selectedWarehouseId: null,
      filters: initialFilters,
      isLoading: false,
      error: null,
      pagination: initialPagination,

      // ============================================
      // PRODUCTOS
      // ============================================

      loadProducts: (filters) => {
        set({ isLoading: true, error: null });
        try {
          const mergedFilters = { ...get().filters, ...filters };
          const result = productService.getAll(mergedFilters);

          set({
            products: result.data,
            pagination: {
              page: result.page,
              limit: result.limit,
              total: result.total,
              totalPages: result.totalPages,
            },
            filters: mergedFilters,
            isLoading: false,
          });
        } catch (error) {
          set({ error: String(error), isLoading: false });
        }
      },

      createProduct: (data) => {
        const product = productService.create(data);
        get().loadProducts();
        return product;
      },

      updateProduct: (id, data) => {
        const product = productService.update(id, data);
        if (product) {
          get().loadProducts();
        }
        return product;
      },

      deleteProduct: (id) => {
        const success = productService.delete(id);
        if (success) {
          get().loadProducts();
        }
        return success;
      },

      importProducts: (data) => {
        const result = productService.bulkImport(data);
        get().loadProducts();
        return result;
      },

      // ============================================
      // INVENTARIO
      // ============================================

      loadInventory: (filters) => {
        set({ isLoading: true, error: null });
        try {
          const mergedFilters = {
            ...get().filters,
            ...filters,
            warehouseId: filters?.warehouseId || get().selectedWarehouseId || undefined,
          };
          const result = inventoryService.getAll(mergedFilters);

          set({
            inventory: result.data,
            pagination: {
              page: result.page,
              limit: result.limit,
              total: result.total,
              totalPages: result.totalPages,
            },
            isLoading: false,
          });
        } catch (error) {
          set({ error: String(error), isLoading: false });
        }
      },

      setStock: (productId, warehouseId, quantity, unitCost) => {
        const item = inventoryService.setStock(productId, warehouseId, quantity, unitCost);
        get().loadInventory();
        get().loadStats();
        get().loadAlerts();
        return item;
      },

      adjustStock: (productId, warehouseId, adjustment, reason) => {
        const userId = 'current_user'; // TODO: obtener del auth store
        const item = inventoryService.adjustStock(productId, warehouseId, adjustment, reason, userId);
        if (item) {
          get().loadInventory();
          get().loadStats();
          get().loadAlerts();
        }
        return item;
      },

      reserveStock: (productId, warehouseId, quantity) => {
        const success = inventoryService.reserveStock(productId, warehouseId, quantity);
        if (success) {
          get().loadInventory();
        }
        return success;
      },

      releaseStock: (productId, warehouseId, quantity) => {
        const success = inventoryService.releaseStock(productId, warehouseId, quantity);
        if (success) {
          get().loadInventory();
        }
        return success;
      },

      // ============================================
      // ALMACENES
      // ============================================

      loadWarehouses: () => {
        const warehouses = warehouseService.getAll();
        set({ warehouses });

        // Si no hay almacén seleccionado, seleccionar el default
        if (!get().selectedWarehouseId && warehouses.length > 0) {
          const defaultWarehouse = warehouses.find((w) => w.isDefault) || warehouses[0];
          set({ selectedWarehouseId: defaultWarehouse.id });
        }
      },

      createWarehouse: (data) => {
        const warehouse = warehouseService.create(data);
        get().loadWarehouses();
        return warehouse;
      },

      updateWarehouse: (id, data) => {
        const warehouse = warehouseService.update(id, data);
        if (warehouse) {
          get().loadWarehouses();
        }
        return warehouse;
      },

      deleteWarehouse: (id) => {
        const success = warehouseService.delete(id);
        if (success) {
          get().loadWarehouses();
          // Si se eliminó el almacén seleccionado, limpiar selección
          if (get().selectedWarehouseId === id) {
            set({ selectedWarehouseId: null });
          }
        }
        return success;
      },

      selectWarehouse: (id) => {
        set({ selectedWarehouseId: id });
        get().loadInventory({ warehouseId: id || undefined });
        get().loadStats(id || undefined);
      },

      // ============================================
      // ALERTAS
      // ============================================

      loadAlerts: () => {
        const alerts = alertService.getActive();
        set({ alerts });
      },

      acknowledgeAlert: (alertId) => {
        const userId = 'current_user'; // TODO: obtener del auth store
        const success = alertService.acknowledge(alertId, userId);
        if (success) {
          get().loadAlerts();
        }
        return success;
      },

      resolveAlert: (alertId) => {
        const success = alertService.resolve(alertId);
        if (success) {
          get().loadAlerts();
        }
        return success;
      },

      // ============================================
      // ESTADÍSTICAS
      // ============================================

      loadStats: (warehouseId) => {
        const stats = inventoryService.getStats(warehouseId || get().selectedWarehouseId || undefined);
        set({ stats });
      },

      // ============================================
      // UI
      // ============================================

      setFilters: (filters) => {
        set((state) => ({
          filters: { ...state.filters, ...filters },
        }));
      },

      resetFilters: () => {
        set({ filters: initialFilters });
      },

      setPage: (page) => {
        set((state) => ({
          filters: { ...state.filters, page },
        }));
        get().loadProducts();
      },

      setError: (error) => {
        set({ error });
      },

      // ============================================
      // INICIALIZACIÓN
      // ============================================

      initialize: () => {
        // Asegurar que existe un almacén por defecto
        warehouseService.ensureDefault();

        // Cargar datos
        get().loadWarehouses();
        get().loadProducts();
        get().loadInventory();
        get().loadAlerts();
        get().loadStats();
      },
    }),
    {
      name: 'litper-inventory-store',
      version: 1,
      partialize: (state) => ({
        selectedWarehouseId: state.selectedWarehouseId,
        filters: state.filters,
      }),
    }
  )
);

// ============================================
// HOOKS HELPERS
// ============================================

/**
 * Hook para obtener productos con filtros
 */
export const useProducts = (filters?: InventoryFilters) => {
  const { products, pagination, isLoading, loadProducts } = useInventoryStore();

  return {
    products,
    pagination,
    isLoading,
    refresh: () => loadProducts(filters),
  };
};

/**
 * Hook para obtener inventario del almacén seleccionado
 */
export const useInventory = () => {
  const {
    inventory,
    selectedWarehouseId,
    stats,
    isLoading,
    loadInventory,
    setStock,
    adjustStock,
  } = useInventoryStore();

  return {
    inventory,
    warehouseId: selectedWarehouseId,
    stats,
    isLoading,
    refresh: loadInventory,
    setStock,
    adjustStock,
  };
};

/**
 * Hook para alertas de inventario
 */
export const useInventoryAlerts = () => {
  const { alerts, loadAlerts, acknowledgeAlert, resolveAlert } = useInventoryStore();

  return {
    alerts,
    activeCount: alerts.filter((a) => a.status === 'active').length,
    refresh: loadAlerts,
    acknowledge: acknowledgeAlert,
    resolve: resolveAlert,
  };
};

export default useInventoryStore;
