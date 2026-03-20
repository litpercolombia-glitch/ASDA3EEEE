// services/dropiSyncService.ts
// Auto-importador de pedidos desde Dropi via Chatea Pro API
// Sincroniza pedidos automaticamente y los convierte a PedidoDropshipping

import { useDropshippingStore } from './dropshippingService';
import type { PedidoDropshipping, EstadoCOD, MetodoPago } from '../types/dropshipping';

// ============================================
// CONFIGURACION
// ============================================

const CHATEA_API_BASE = import.meta.env.VITE_CHATEA_API_KEY
  ? 'https://chateapro.app/api'
  : '/api/chatea-pro';

const CHATEA_API_KEY = import.meta.env.VITE_CHATEA_API_KEY || '';

const SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutos

// ============================================
// STATUS MAPPING: Dropi → PedidoDropshipping
// ============================================

const DROPI_STATUS_MAP: Record<string, EstadoCOD> = {
  // Pre-envío
  'PENDIENTE': 'pendiente',
  'CONFIRMADO': 'confirmado',
  'EN_PREPARACION': 'confirmado',

  // En camino
  'DESPACHADO': 'enviado',
  'GUÍA GENERADA': 'enviado',
  'EN TERMINAL ORIGEN': 'en_camino',
  'EN TRANSPORTE': 'en_camino',
  'EN_TRANSITO': 'en_camino',
  'EN TERMINAL DESTINO': 'en_camino',
  'EN REPARTO': 'en_camino',
  'ADMITIDA': 'en_camino',
  'DIGITALIZADA': 'en_camino',

  // Entregado
  'ENTREGADO': 'entregado',
  'ENTREGADA': 'entregado',

  // Rechazado / Devuelto
  'DEVOLUCION': 'rechazado',
  'DEVOLUCIÓN': 'rechazado',
  'DEVUELTO': 'devuelto',
  'CANCELADO': 'rechazado',
  'NO ENTREGADO': 'rechazado',

  // Novedades (se tratan como no contactado)
  'NOVEDAD': 'no_contactado',
  'EN PUNTO DROOP': 'no_contactado',

  // Indemnizado
  'INDEMNIZADA POR DROPI': 'indemnizado',
  'INDEMNIZADO': 'indemnizado',
};

function mapDropiStatus(status: string): EstadoCOD {
  const normalized = status.toUpperCase().trim();
  return DROPI_STATUS_MAP[normalized] || 'pendiente';
}

function mapMetodoPago(metodo?: string): MetodoPago {
  if (!metodo) return 'contra_entrega';
  const m = metodo.toLowerCase();
  if (m.includes('contra') || m.includes('cod')) return 'contra_entrega';
  if (m.includes('transfer') || m.includes('pse') || m.includes('nequi') || m.includes('daviplata')) return 'transferencia';
  if (m.includes('prepago') || m.includes('tarjeta') || m.includes('credit')) return 'prepago';
  return 'contra_entrega'; // Default COD en Colombia
}

// ============================================
// API CLIENT
// ============================================

async function fetchFromChatea(endpoint: string, options: RequestInit = {}): Promise<any> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(CHATEA_API_KEY ? { 'Authorization': `Bearer ${CHATEA_API_KEY}` } : {}),
  };

  const response = await fetch(`${CHATEA_API_BASE}${endpoint}`, {
    ...options,
    headers: { ...headers, ...options.headers },
  });

  if (!response.ok) {
    throw new Error(`Chatea API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// ============================================
// SYNC FUNCTIONS
// ============================================

export interface DropiSyncResult {
  success: boolean;
  newOrders: number;
  updatedOrders: number;
  errors: string[];
  timestamp: string;
}

/**
 * Fetch orders from Dropi via Chatea Pro and sync to dropshipping store
 */
export async function syncDropiOrders(options?: {
  status?: string;
  limit?: number;
  sinceDate?: string;
}): Promise<DropiSyncResult> {
  const result: DropiSyncResult = {
    success: false,
    newOrders: 0,
    updatedOrders: 0,
    errors: [],
    timestamp: new Date().toISOString(),
  };

  try {
    // Fetch orders from Chatea Pro (which proxies Dropi)
    const params = new URLSearchParams();
    if (options?.status) params.set('status', options.status);
    if (options?.limit) params.set('limit', String(options.limit));

    const data = await fetchFromChatea(`/orders?${params.toString()}`);
    const orders = data.orders || data.data || data || [];

    if (!Array.isArray(orders)) {
      result.errors.push('Respuesta inesperada de la API');
      return result;
    }

    const store = useDropshippingStore.getState();
    const existingIds = new Set(store.pedidos.map((p) => p.ordenId));

    let newCount = 0;
    let updatedCount = 0;

    for (const order of orders) {
      try {
        const ordenId = String(order.id || order.numero || order.order_id || '');
        if (!ordenId) continue;

        const estadoCOD = mapDropiStatus(order.estado || order.estatus || '');
        const fechaPedido = order.fecha_creacion || order.fecha || new Date().toISOString().slice(0, 10);
        const mes = fechaPedido.slice(0, 7);

        // Extract product info
        const productos = order.productos || order.items || [];
        const primerProducto = productos[0] || {};
        const productoNombre = primerProducto.nombre || primerProducto.name || order.producto || 'Sin nombre';
        const costoProducto = Number(primerProducto.costo || primerProducto.cost || order.costo_producto || 0);

        const pedidoData = {
          ordenId,
          fuente: 'dropi' as const,
          clienteNombre: String(order.cliente_nombre || order.cliente || ''),
          clienteTelefono: String(order.cliente_telefono || order.telefono || ''),
          clienteCiudad: String(order.ciudad || order.ciudad_de_destino || ''),
          clienteDepartamento: String(order.departamento || ''),
          productoNombre,
          productoSKU: primerProducto.sku || undefined,
          proveedorNombre: primerProducto.proveedor || order.proveedor || undefined,
          cantidad: Number(primerProducto.cantidad || order.cantidad || 1),
          precioVenta: Number(order.total || order.precio || order.valor || 0),
          costoProducto,
          costoEnvio: Number(order.costo_envio || order.flete || 0),
          costoDevolucion: ['rechazado', 'devuelto'].includes(estadoCOD) ? Number(order.costo_devolucion || order.costo_envio || 8000) : 0,
          comisionPlataforma: Number(order.comision || order.comision_plataforma || 0),
          comisionCOD: Number(order.comision_cod || order.comision_recaudo || 0),
          costoPublicidad: 0, // Se asigna después con el módulo de ads
          metodoPago: mapMetodoPago(order.metodo_pago || order.forma_pago),
          estadoCOD,
          transportadora: String(order.transportadora || order.carrier || ''),
          fechaPedido,
          fechaEnvio: order.fecha_envio || order.fecha_despacho || undefined,
          fechaEntrega: order.fecha_entrega || undefined,
          fechaRechazo: ['rechazado', 'devuelto'].includes(estadoCOD) ? (order.fecha_actualizacion || undefined) : undefined,
          mes,
          guiaNumero: order.guia || order.numero_de_guia || undefined,
          motivoRechazo: order.novedad_descripcion || order.motivo_devolucion || undefined,
        };

        if (existingIds.has(ordenId)) {
          // Update existing
          const existing = store.pedidos.find((p) => p.ordenId === ordenId);
          if (existing) {
            store.updatePedido(existing.id, pedidoData);
            updatedCount++;
          }
        } else {
          // Add new
          store.addPedido(pedidoData);
          newCount++;
          existingIds.add(ordenId);
        }
      } catch (err) {
        result.errors.push(`Error procesando orden: ${err}`);
      }
    }

    result.success = true;
    result.newOrders = newCount;
    result.updatedOrders = updatedCount;
  } catch (err) {
    result.errors.push(`Error de conexion: ${err}`);
  }

  return result;
}

/**
 * Fetch delayed orders specifically
 */
export async function syncDelayedOrders(minDays: number = 5): Promise<DropiSyncResult> {
  try {
    const data = await fetchFromChatea(`/orders/delayed?min_days=${minDays}`);
    const orders = data.orders || data || [];

    if (!Array.isArray(orders) || orders.length === 0) {
      return { success: true, newOrders: 0, updatedOrders: 0, errors: [], timestamp: new Date().toISOString() };
    }

    // Process through the regular sync path
    return syncDropiOrders();
  } catch {
    return syncDropiOrders(); // Fallback to full sync
  }
}

/**
 * Get Dropi dashboard stats via Chatea Pro
 */
export async function getDropiStats(): Promise<{
  totalOrders: number;
  delivered: number;
  returned: number;
  inTransit: number;
  deliveryRate: number;
} | null> {
  try {
    const data = await fetchFromChatea('/dashboard/stats');
    return {
      totalOrders: data.total || 0,
      delivered: data.delivered || data.entregados || 0,
      returned: data.returned || data.devueltos || 0,
      inTransit: data.in_transit || data.en_transito || 0,
      deliveryRate: data.delivery_rate || data.tasa_entrega || 0,
    };
  } catch {
    return null;
  }
}

// ============================================
// AUTO-SYNC MANAGER
// ============================================

let syncInterval: ReturnType<typeof setInterval> | null = null;
let lastSyncResult: DropiSyncResult | null = null;

export function startAutoSync(intervalMs: number = SYNC_INTERVAL_MS): void {
  stopAutoSync();
  // Initial sync
  syncDropiOrders().then((r) => { lastSyncResult = r; });
  // Schedule
  syncInterval = setInterval(async () => {
    lastSyncResult = await syncDropiOrders();
  }, intervalMs);
}

export function stopAutoSync(): void {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
}

export function isAutoSyncRunning(): boolean {
  return syncInterval !== null;
}

export function getLastSyncResult(): DropiSyncResult | null {
  return lastSyncResult;
}

// ============================================
// EXCEL IMPORT (enhanced for Dropi format)
// ============================================

export function importDropiExcel(rows: any[]): number {
  const store = useDropshippingStore.getState();
  const mapped = rows.map((row) => ({
    ordenId: row.numero_de_guia || row.guia || row.orden || row.id || '',
    fuente: 'dropi',
    clienteNombre: row.destinatario || row.cliente || row.nombre || '',
    clienteTelefono: row.telefono || row.celular || row.phone || '',
    clienteCiudad: row.ciudad_de_destino || row.ciudad || row.city || '',
    clienteDepartamento: row.departamento || row.state || '',
    productoNombre: row.producto || row.product || row.descripcion || 'Producto Dropi',
    proveedorNombre: row.proveedor || row.supplier || undefined,
    cantidad: Number(row.cantidad || row.qty || 1),
    precioVenta: Number(row.valor || row.total || row.precio || row.price || 0),
    costoProducto: Number(row.costo || row.costo_producto || row.cost || 0),
    costoEnvio: Number(row.flete || row.costo_envio || row.shipping || 0),
    costoDevolucion: Number(row.costo_devolucion || 0),
    comisionPlataforma: Number(row.comision || 0),
    comisionCOD: Number(row.comision_cod || row.recaudo || 0),
    costoPublicidad: 0,
    metodoPago: mapMetodoPago(row.metodo_pago || row.forma_pago),
    estadoCOD: mapDropiStatus(row.estatus || row.estado || row.status || ''),
    transportadora: row.transportadora || row.carrier || '',
    fechaPedido: row.fecha || row.fecha_creacion || row.date || new Date().toISOString().slice(0, 10),
    fechaEnvio: row.fecha_envio || row.fecha_despacho || undefined,
    fechaEntrega: row.fecha_entrega || undefined,
    mes: (row.fecha || row.fecha_creacion || new Date().toISOString()).slice(0, 7),
    guiaNumero: row.numero_de_guia || row.guia || undefined,
    motivoRechazo: row.novedad || row.motivo || undefined,
  }));

  return store.importPedidos(mapped, 'dropi');
}
