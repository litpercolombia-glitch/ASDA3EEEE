// services/dropshippingService.ts
// Dropshipper Intelligence Service
// "Chatea Pro te ayuda a VENDER. Nosotros te ayudamos a saber si estás GANANDO."

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  PedidoDropshipping,
  EstadoCOD,
  MetodoPago,
  CODAnalyticsResumen,
  CODAnalyticsPorCiudad,
  CODAnalyticsPorTransportadora,
  CODAnalyticsPorProducto,
  ProductScorecard,
  ProductoCategoria,
  SupplierScore,
  CalculadoraInput,
  CalculadoraResult,
  DropshipperView,
} from '../types/dropshipping';

// ============================================
// HELPERS
// ============================================

const generateId = () => `ds_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const getCurrentMonth = () => new Date().toISOString().slice(0, 7);
const formatCOP = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

// ============================================
// STORE INTERFACE
// ============================================

interface DropshippingState {
  // Data
  pedidos: PedidoDropshipping[];
  selectedMonth: string;
  selectedView: DropshipperView;
  isLoading: boolean;

  // Actions - Pedidos
  addPedido: (pedido: Omit<PedidoDropshipping, 'id' | 'createdAt' | 'utilidadBruta' | 'utilidadNeta' | 'margenNeto'>) => void;
  updatePedido: (id: string, updates: Partial<PedidoDropshipping>) => void;
  deletePedido: (id: string) => void;
  importPedidos: (data: any[], fuente: 'dropi' | 'excel') => number;

  // Actions - UI
  setSelectedMonth: (month: string) => void;
  setSelectedView: (view: DropshipperView) => void;

  // Analytics - COD
  getResumenMensual: (mes?: string) => CODAnalyticsResumen;
  getAnalyticsPorCiudad: (mes?: string) => CODAnalyticsPorCiudad[];
  getAnalyticsPorTransportadora: (mes?: string) => CODAnalyticsPorTransportadora[];
  getAnalyticsPorProducto: (mes?: string) => CODAnalyticsPorProducto[];

  // Analytics - Product Scorecard
  getProductScorecards: (mes?: string) => ProductScorecard[];

  // Analytics - Supplier
  getSupplierScores: (mes?: string) => SupplierScore[];

  // Calculator
  calcularRentabilidad: (input: CalculadoraInput) => CalculadoraResult;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function calcularUtilidades(pedido: Partial<PedidoDropshipping>) {
  const precioVenta = pedido.precioVenta || 0;
  const costoProducto = pedido.costoProducto || 0;
  const costoEnvio = pedido.costoEnvio || 0;
  const comisionPlataforma = pedido.comisionPlataforma || 0;
  const comisionCOD = pedido.comisionCOD || 0;
  const costoPublicidad = pedido.costoPublicidad || 0;
  const costoDevolucion = pedido.costoDevolucion || 0;

  const utilidadBruta = precioVenta - costoProducto - costoEnvio - comisionPlataforma - comisionCOD;
  const utilidadNeta = utilidadBruta - costoPublicidad - costoDevolucion;
  const margenNeto = precioVenta > 0 ? (utilidadNeta / precioVenta) * 100 : 0;

  return { utilidadBruta, utilidadNeta, margenNeto };
}

function categorizarProducto(margenNeto: number, tasaEntrega: number, totalPedidos: number): ProductoCategoria {
  if (margenNeto >= 20 && tasaEntrega >= 80 && totalPedidos >= 10) return 'estrella';
  if (margenNeto >= 10 && tasaEntrega >= 70) return 'rentable';
  if (margenNeto >= 0 && tasaEntrega >= 50) return 'marginal';
  return 'perdedor';
}

function scoreProducto(margenNeto: number, tasaEntrega: number, roas: number): number {
  // Weight: margen 40%, tasa entrega 35%, ROAS 25%
  const margenScore = Math.min(100, Math.max(0, margenNeto * 2.5));
  const entregaScore = tasaEntrega;
  const roasScore = Math.min(100, Math.max(0, roas * 25));
  return Math.round(margenScore * 0.4 + entregaScore * 0.35 + roasScore * 0.25);
}

function getVeredicto(categoria: ProductoCategoria): { veredicto: string; razon: string } {
  switch (categoria) {
    case 'estrella':
      return { veredicto: 'Escalar', razon: 'Alto margen + alta entrega. Invertir más en ads.' };
    case 'rentable':
      return { veredicto: 'Mantener', razon: 'Rentable pero se puede optimizar.' };
    case 'marginal':
      return { veredicto: 'Optimizar', razon: 'Margen bajo o rechazos altos. Revisar precio/proveedor.' };
    case 'perdedor':
      return { veredicto: 'Eliminar', razon: 'Pierde dinero. Reemplazar por otro producto.' };
  }
}

function getRecomendacionCiudad(tasaEntrega: number): 'verde' | 'amarillo' | 'rojo' {
  if (tasaEntrega >= 80) return 'verde';
  if (tasaEntrega >= 60) return 'amarillo';
  return 'rojo';
}

function getEstadoSupplier(score: number): 'excelente' | 'bueno' | 'regular' | 'malo' {
  if (score >= 85) return 'excelente';
  if (score >= 70) return 'bueno';
  if (score >= 50) return 'regular';
  return 'malo';
}

// ============================================
// STORE
// ============================================

export const useDropshippingStore = create<DropshippingState>()(
  persist(
    (set, get) => ({
      // Initial state
      pedidos: [],
      selectedMonth: getCurrentMonth(),
      selectedView: 'hub',
      isLoading: false,

      // ============================
      // ACTIONS - PEDIDOS
      // ============================

      addPedido: (pedidoData) => {
        const calcs = calcularUtilidades(pedidoData);
        const pedido: PedidoDropshipping = {
          ...pedidoData,
          id: generateId(),
          ...calcs,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ pedidos: [...state.pedidos, pedido] }));
      },

      updatePedido: (id, updates) => {
        set((state) => ({
          pedidos: state.pedidos.map((p) => {
            if (p.id !== id) return p;
            const updated = { ...p, ...updates };
            const calcs = calcularUtilidades(updated);
            return { ...updated, ...calcs };
          }),
        }));
      },

      deletePedido: (id) => {
        set((state) => ({ pedidos: state.pedidos.filter((p) => p.id !== id) }));
      },

      importPedidos: (data, fuente) => {
        let count = 0;
        const newPedidos: PedidoDropshipping[] = [];

        for (const row of data) {
          try {
            const pedidoData: Omit<PedidoDropshipping, 'id' | 'createdAt' | 'utilidadBruta' | 'utilidadNeta' | 'margenNeto'> = {
              ordenId: String(row.ordenId || row.orden_id || row.order_id || row.id || ''),
              fuente,
              clienteNombre: String(row.clienteNombre || row.cliente || row.customer || ''),
              clienteTelefono: String(row.clienteTelefono || row.telefono || row.phone || ''),
              clienteCiudad: String(row.clienteCiudad || row.ciudad || row.city || ''),
              clienteDepartamento: String(row.clienteDepartamento || row.departamento || row.state || ''),
              productoNombre: String(row.productoNombre || row.producto || row.product || ''),
              productoSKU: row.productoSKU || row.sku || undefined,
              proveedorNombre: row.proveedorNombre || row.proveedor || row.supplier || undefined,
              cantidad: Number(row.cantidad || row.quantity || 1),
              precioVenta: Number(row.precioVenta || row.precio || row.price || 0),
              costoProducto: Number(row.costoProducto || row.costo || row.cost || 0),
              costoEnvio: Number(row.costoEnvio || row.flete || row.shipping || 0),
              costoDevolucion: Number(row.costoDevolucion || 0),
              comisionPlataforma: Number(row.comisionPlataforma || row.comision || 0),
              comisionCOD: Number(row.comisionCOD || 0),
              costoPublicidad: Number(row.costoPublicidad || row.ads || 0),
              metodoPago: (row.metodoPago || row.metodo_pago || 'contra_entrega') as MetodoPago,
              estadoCOD: (row.estadoCOD || row.estado || 'pendiente') as EstadoCOD,
              transportadora: String(row.transportadora || row.carrier || ''),
              fechaPedido: String(row.fechaPedido || row.fecha || new Date().toISOString().slice(0, 10)),
              fechaEnvio: row.fechaEnvio || undefined,
              fechaEntrega: row.fechaEntrega || undefined,
              fechaRechazo: row.fechaRechazo || undefined,
              mes: String(row.mes || (row.fechaPedido || row.fecha || new Date().toISOString()).slice(0, 7)),
              guiaNumero: row.guiaNumero || row.guia || undefined,
              motivoRechazo: row.motivoRechazo || undefined,
            };

            const calcs = calcularUtilidades(pedidoData);
            newPedidos.push({
              ...pedidoData,
              ...calcs,
              id: generateId(),
              createdAt: new Date().toISOString(),
            });
            count++;
          } catch {
            // Skip invalid rows
          }
        }

        if (newPedidos.length > 0) {
          set((state) => ({ pedidos: [...state.pedidos, ...newPedidos] }));
        }

        return count;
      },

      // ============================
      // ACTIONS - UI
      // ============================

      setSelectedMonth: (month) => set({ selectedMonth: month }),
      setSelectedView: (view) => set({ selectedView: view }),

      // ============================
      // ANALYTICS - COD RESUMEN
      // ============================

      getResumenMensual: (mes) => {
        const targetMes = mes || get().selectedMonth;
        const pedidos = get().pedidos.filter((p) => p.mes === targetMes);

        const pedidosCOD = pedidos.filter((p) => p.metodoPago === 'contra_entrega');
        const pedidosPrepago = pedidos.filter((p) => p.metodoPago !== 'contra_entrega');
        const entregados = pedidos.filter((p) => p.estadoCOD === 'entregado');
        const rechazados = pedidos.filter((p) => ['rechazado', 'devuelto', 'no_contactado'].includes(p.estadoCOD));

        const entregadosCOD = pedidosCOD.filter((p) => p.estadoCOD === 'entregado');
        const entregadosPrepago = pedidosPrepago.filter((p) => p.estadoCOD === 'entregado');

        const ventasBrutas = entregados.reduce((s, p) => s + p.precioVenta, 0);
        const costoProductos = entregados.reduce((s, p) => s + p.costoProducto, 0);
        const costoEnvios = pedidos.reduce((s, p) => s + p.costoEnvio, 0); // Todos pagan envío
        const costoDevoluciones = rechazados.reduce((s, p) => s + p.costoDevolucion + p.costoEnvio, 0);
        const comisiones = pedidos.reduce((s, p) => s + p.comisionPlataforma + p.comisionCOD, 0);
        const costoPublicidad = pedidos.reduce((s, p) => s + p.costoPublicidad, 0);

        const utilidadBruta = ventasBrutas - costoProductos - costoEnvios - comisiones;
        const utilidadNeta = utilidadBruta - costoPublicidad - costoDevoluciones;

        // Mes anterior
        const [y, m] = targetMes.split('-').map(Number);
        const prevDate = new Date(y, m - 2, 1);
        const prevMes = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
        const prevPedidos = get().pedidos.filter((p) => p.mes === prevMes);
        const prevEntregados = prevPedidos.filter((p) => p.estadoCOD === 'entregado');
        const prevRechazados = prevPedidos.filter((p) => ['rechazado', 'devuelto', 'no_contactado'].includes(p.estadoCOD));
        const prevTasaEntrega = prevPedidos.length > 0 ? (prevEntregados.length / prevPedidos.length) * 100 : 0;
        const prevUtilidadNeta = prevEntregados.reduce((s, p) => s + p.utilidadNeta, 0);

        const tasaEntregaGeneral = pedidos.length > 0 ? (entregados.length / pedidos.length) * 100 : 0;

        return {
          periodo: targetMes,
          totalPedidos: pedidos.length,
          pedidosCOD: pedidosCOD.length,
          pedidosPrepago: pedidosPrepago.length,
          entregados: entregados.length,
          rechazados: rechazados.length,

          tasaEntregaGeneral,
          tasaEntregaCOD: pedidosCOD.length > 0 ? (entregadosCOD.length / pedidosCOD.length) * 100 : 0,
          tasaEntregaPrepago: pedidosPrepago.length > 0 ? (entregadosPrepago.length / pedidosPrepago.length) * 100 : 0,
          tasaRechazoGeneral: pedidos.length > 0 ? (rechazados.length / pedidos.length) * 100 : 0,

          ventasBrutas,
          costoProductos,
          costoEnvios,
          costoDevoluciones,
          comisiones,
          costoPublicidad,
          utilidadBruta,
          utilidadNeta,
          margenBruto: ventasBrutas > 0 ? (utilidadBruta / ventasBrutas) * 100 : 0,
          margenNeto: ventasBrutas > 0 ? (utilidadNeta / ventasBrutas) * 100 : 0,

          roas: costoPublicidad > 0 ? ventasBrutas / costoPublicidad : 0,
          cpa: entregados.length > 0 ? costoPublicidad / entregados.length : 0,
          aov: entregados.length > 0 ? ventasBrutas / entregados.length : 0,
          costoPorRechazo: rechazados.length > 0 ? costoDevoluciones / rechazados.length : 0,
          dineroQuemadoEnRechazos: costoDevoluciones,

          vsMesAnterior: prevPedidos.length > 0
            ? {
                tasaEntrega: tasaEntregaGeneral - prevTasaEntrega,
                utilidadNeta: prevUtilidadNeta !== 0 ? ((utilidadNeta - prevUtilidadNeta) / Math.abs(prevUtilidadNeta)) * 100 : 0,
                rechazos: rechazados.length - prevRechazados.length,
              }
            : undefined,
        };
      },

      // ============================
      // ANALYTICS - POR CIUDAD
      // ============================

      getAnalyticsPorCiudad: (mes) => {
        const targetMes = mes || get().selectedMonth;
        const pedidos = get().pedidos.filter((p) => p.mes === targetMes);

        const ciudades = new Map<string, PedidoDropshipping[]>();
        for (const p of pedidos) {
          const key = p.clienteCiudad.toUpperCase().trim();
          if (!ciudades.has(key)) ciudades.set(key, []);
          ciudades.get(key)!.push(p);
        }

        const results: CODAnalyticsPorCiudad[] = [];
        for (const [ciudad, peds] of ciudades) {
          const entregados = peds.filter((p) => p.estadoCOD === 'entregado');
          const rechazados = peds.filter((p) => ['rechazado', 'devuelto', 'no_contactado'].includes(p.estadoCOD));
          const tasaEntrega = (entregados.length / peds.length) * 100;

          results.push({
            ciudad,
            departamento: peds[0]?.clienteDepartamento || '',
            totalPedidos: peds.length,
            entregados: entregados.length,
            rechazados: rechazados.length,
            tasaEntrega,
            tasaRechazo: (rechazados.length / peds.length) * 100,
            utilidadTotal: entregados.reduce((s, p) => s + p.utilidadNeta, 0),
            perdidaPorRechazos: rechazados.reduce((s, p) => s + p.costoEnvio + p.costoDevolucion, 0),
            recomendacion: getRecomendacionCiudad(tasaEntrega),
          });
        }

        return results.sort((a, b) => b.totalPedidos - a.totalPedidos);
      },

      // ============================
      // ANALYTICS - POR TRANSPORTADORA
      // ============================

      getAnalyticsPorTransportadora: (mes) => {
        const targetMes = mes || get().selectedMonth;
        const pedidos = get().pedidos.filter((p) => p.mes === targetMes);

        const transportadoras = new Map<string, PedidoDropshipping[]>();
        for (const p of pedidos) {
          const key = p.transportadora.toUpperCase().trim();
          if (!key) continue;
          if (!transportadoras.has(key)) transportadoras.set(key, []);
          transportadoras.get(key)!.push(p);
        }

        const results: CODAnalyticsPorTransportadora[] = [];
        for (const [transportadora, peds] of transportadoras) {
          const entregados = peds.filter((p) => p.estadoCOD === 'entregado');
          const rechazados = peds.filter((p) => ['rechazado', 'devuelto', 'no_contactado'].includes(p.estadoCOD));
          const tasaEntrega = (entregados.length / peds.length) * 100;

          // Tiempo promedio de entrega en días
          const tiempos = entregados
            .filter((p) => p.fechaEnvio && p.fechaEntrega)
            .map((p) => {
              const envio = new Date(p.fechaEnvio!);
              const entrega = new Date(p.fechaEntrega!);
              return (entrega.getTime() - envio.getTime()) / (1000 * 60 * 60 * 24);
            });
          const tiempoPromedio = tiempos.length > 0 ? tiempos.reduce((s, t) => s + t, 0) / tiempos.length : 0;

          results.push({
            transportadora,
            totalPedidos: peds.length,
            entregados: entregados.length,
            rechazados: rechazados.length,
            tasaEntrega,
            tiempoPromedioEntrega: Math.round(tiempoPromedio * 10) / 10,
            costoPromedioEnvio: peds.reduce((s, p) => s + p.costoEnvio, 0) / peds.length,
            recomendacion: getRecomendacionCiudad(tasaEntrega),
          });
        }

        return results.sort((a, b) => b.totalPedidos - a.totalPedidos);
      },

      // ============================
      // ANALYTICS - POR PRODUCTO
      // ============================

      getAnalyticsPorProducto: (mes) => {
        const targetMes = mes || get().selectedMonth;
        const pedidos = get().pedidos.filter((p) => p.mes === targetMes);

        const productos = new Map<string, PedidoDropshipping[]>();
        for (const p of pedidos) {
          const key = p.productoNombre.toUpperCase().trim();
          if (!productos.has(key)) productos.set(key, []);
          productos.get(key)!.push(p);
        }

        const results: CODAnalyticsPorProducto[] = [];
        for (const [nombre, peds] of productos) {
          const entregados = peds.filter((p) => p.estadoCOD === 'entregado');
          const rechazados = peds.filter((p) => ['rechazado', 'devuelto', 'no_contactado'].includes(p.estadoCOD));
          const tasaEntrega = peds.length > 0 ? (entregados.length / peds.length) * 100 : 0;
          const tasaRechazo = peds.length > 0 ? (rechazados.length / peds.length) * 100 : 0;

          const ingresoTotal = entregados.reduce((s, p) => s + p.precioVenta, 0);
          const costoTotal = peds.reduce((s, p) => s + p.costoProducto + p.costoEnvio + p.comisionPlataforma + p.comisionCOD + p.costoDevolucion + p.costoPublicidad, 0);
          const utilidadNeta = ingresoTotal - costoTotal;
          const margenNeto = ingresoTotal > 0 ? (utilidadNeta / ingresoTotal) * 100 : 0;

          const costoAds = peds.reduce((s, p) => s + p.costoPublicidad, 0);
          const cpa = entregados.length > 0 ? costoAds / entregados.length : 0;

          results.push({
            productoNombre: peds[0]?.productoNombre || nombre,
            productoSKU: peds[0]?.productoSKU,
            totalPedidos: peds.length,
            entregados: entregados.length,
            rechazados: rechazados.length,
            tasaEntrega,
            tasaRechazo,
            ingresoTotal,
            costoTotal,
            utilidadNeta,
            margenNeto,
            costoAdquisicionPromedio: cpa,
            recomendacion: categorizarProducto(margenNeto, tasaEntrega, peds.length),
          });
        }

        return results.sort((a, b) => b.utilidadNeta - a.utilidadNeta);
      },

      // ============================
      // PRODUCT SCORECARDS
      // ============================

      getProductScorecards: (mes) => {
        const analyticsProducto = get().getAnalyticsPorProducto(mes);

        return analyticsProducto.map((ap): ProductScorecard => {
          const roas = ap.costoAdquisicionPromedio > 0 ? ap.ingresoTotal / (ap.costoAdquisicionPromedio * ap.entregados) : 0;
          const score = scoreProducto(ap.margenNeto, ap.tasaEntrega, roas);
          const categoria = ap.recomendacion;
          const { veredicto, razon } = getVeredicto(categoria);

          return {
            productoNombre: ap.productoNombre,
            productoSKU: ap.productoSKU,
            categoria,
            score,
            totalPedidos: ap.totalPedidos,
            pedidosMes: ap.totalPedidos,
            tendenciaVentas: 'estable', // TODO: comparar con mes anterior
            precioVentaPromedio: ap.entregados > 0 ? ap.ingresoTotal / ap.entregados : 0,
            costoProductoPromedio: ap.costoTotal / ap.totalPedidos,
            margenBrutoPromedio: ap.margenNeto + 10, // Rough approx
            margenNetoPromedio: ap.margenNeto,
            utilidadTotalGenerada: ap.utilidadNeta,
            tasaEntrega: ap.tasaEntrega,
            tasaRechazo: ap.tasaRechazo,
            costoAdsTotal: ap.costoAdquisicionPromedio * ap.entregados,
            cpaPromedio: ap.costoAdquisicionPromedio,
            roasProducto: roas,
            veredicto,
            razon,
          };
        });
      },

      // ============================
      // SUPPLIER SCORES
      // ============================

      getSupplierScores: (mes) => {
        const targetMes = mes || get().selectedMonth;
        const pedidos = get().pedidos.filter((p) => p.mes === targetMes && p.proveedorNombre);

        const proveedores = new Map<string, PedidoDropshipping[]>();
        for (const p of pedidos) {
          const key = (p.proveedorNombre || 'Sin nombre').toUpperCase().trim();
          if (!proveedores.has(key)) proveedores.set(key, []);
          proveedores.get(key)!.push(p);
        }

        const results: SupplierScore[] = [];
        for (const [nombre, peds] of proveedores) {
          const entregados = peds.filter((p) => p.estadoCOD === 'entregado');
          const rechazados = peds.filter((p) => ['rechazado', 'devuelto'].includes(p.estadoCOD));

          // Tiempos de despacho (pedido → envío)
          const tiemposDespacho = peds
            .filter((p) => p.fechaEnvio)
            .map((p) => {
              const pedido = new Date(p.fechaPedido);
              const envio = new Date(p.fechaEnvio!);
              return (envio.getTime() - pedido.getTime()) / (1000 * 60 * 60 * 24);
            });
          const tiempoDespachoPromedio = tiemposDespacho.length > 0
            ? tiemposDespacho.reduce((s, t) => s + t, 0) / tiemposDespacho.length : 0;

          // Tiempos de entrega total
          const tiemposEntrega = entregados
            .filter((p) => p.fechaEntrega)
            .map((p) => {
              const pedido = new Date(p.fechaPedido);
              const entrega = new Date(p.fechaEntrega!);
              return (entrega.getTime() - pedido.getTime()) / (1000 * 60 * 60 * 24);
            });
          const tiempoEntregaPromedio = tiemposEntrega.length > 0
            ? tiemposEntrega.reduce((s, t) => s + t, 0) / tiemposEntrega.length : 0;

          // A tiempo = despacho < 2 días
          const asTiempo = tiemposDespacho.filter((t) => t <= 2).length;
          const tasaCumplimiento = tiemposDespacho.length > 0 ? (asTiempo / tiemposDespacho.length) * 100 : 0;

          const tasaDevolucion = peds.length > 0 ? (rechazados.length / peds.length) * 100 : 0;
          const margenPromedio = entregados.length > 0
            ? entregados.reduce((s, p) => s + p.margenNeto, 0) / entregados.length : 0;

          // Score: cumplimiento 40%, tasa entrega 35%, margen 25%
          const entregaRate = peds.length > 0 ? (entregados.length / peds.length) * 100 : 0;
          const score = Math.round(tasaCumplimiento * 0.4 + entregaRate * 0.35 + Math.min(100, margenPromedio * 2.5) * 0.25);
          const estado = getEstadoSupplier(score);

          let recomendacion = '';
          if (estado === 'excelente') recomendacion = 'Proveedor confiable. Considerar aumentar volumen.';
          else if (estado === 'bueno') recomendacion = 'Buen proveedor. Monitorear tiempos de despacho.';
          else if (estado === 'regular') recomendacion = 'Problemas frecuentes. Buscar alternativa.';
          else recomendacion = 'Proveedor poco confiable. Reemplazar urgente.';

          results.push({
            proveedorNombre: peds[0]?.proveedorNombre || nombre,
            plataforma: peds[0]?.fuente === 'dropi' ? 'dropi' : 'otro',
            score,
            totalPedidos: peds.length,
            pedidosAtiempo: asTiempo,
            pedidosRetrasados: tiemposDespacho.length - asTiempo,
            tasaCumplimiento,
            devoluciones: rechazados.length,
            tasaDevolucion,
            quejasCalidad: 0, // TODO: integrate with CRM tickets
            tiempoPromedioDespacho: Math.round(tiempoDespachoPromedio * 10) / 10,
            tiempoPromedioEntrega: Math.round(tiempoEntregaPromedio * 10) / 10,
            costoPromedioProducto: peds.reduce((s, p) => s + p.costoProducto, 0) / peds.length,
            margenPromedioConEste: margenPromedio,
            estado,
            recomendacion,
          });
        }

        return results.sort((a, b) => b.score - a.score);
      },

      // ============================
      // CALCULADORA DE RENTABILIDAD
      // ============================

      calcularRentabilidad: (input) => {
        const {
          precioVenta,
          costoProducto,
          costoEnvio,
          comisionPlataforma,
          comisionCOD,
          costoPublicidadPorVenta,
          tasaRechazoEstimada,
          costoDevolucionPromedio,
        } = input;

        // Por pedido entregado (sin considerar rechazos)
        const costosTotales = costoProducto + costoEnvio + comisionPlataforma + comisionCOD + costoPublicidadPorVenta;
        const utilidadPorPedido = precioVenta - costosTotales;
        const margenPorPedido = precioVenta > 0 ? (utilidadPorPedido / precioVenta) * 100 : 0;

        // Ajustado por rechazos: por cada 100 pedidos, X se rechazan
        // Los rechazados cuestan envío + devolución sin generar ingreso
        const tasaRechazo = tasaRechazoEstimada / 100;
        const costoProrrateoRechazo = tasaRechazo * (costoEnvio + costoDevolucionPromedio) / (1 - tasaRechazo);
        const utilidadRealPorPedido = utilidadPorPedido - costoProrrateoRechazo;
        const margenRealPorPedido = precioVenta > 0 ? (utilidadRealPorPedido / precioVenta) * 100 : 0;

        // Análisis de sensibilidad
        const calcMargenConRechazo = (tasa: number) => {
          const t = tasa / 100;
          const costo = t * (costoEnvio + costoDevolucionPromedio) / (1 - t);
          const util = utilidadPorPedido - costo;
          return precioVenta > 0 ? (util / precioVenta) * 100 : 0;
        };

        const esRentable = utilidadRealPorPedido > 0;
        let alerta: string | undefined;
        if (!esRentable) {
          alerta = `Estás PERDIENDO ${formatCOP(Math.abs(utilidadRealPorPedido))} por cada pedido entregado. Revisa tu precio o reduce rechazos.`;
        } else if (margenRealPorPedido < 10) {
          alerta = `Margen muy bajo (${margenRealPorPedido.toFixed(1)}%). Cualquier aumento en rechazos te puede poner en rojo.`;
        }

        return {
          utilidadPorPedido,
          margenPorPedido,
          utilidadRealPorPedido,
          margenRealPorPedido,
          ventasDiariasNecesarias: utilidadRealPorPedido > 0 ? Math.ceil(1000000 / utilidadRealPorPedido / 30) : 0, // Para 1M COP/mes
          puntoEquilibrio: 0, // Depends on fixed costs
          margenSiRechazo5: calcMargenConRechazo(5),
          margenSiRechazo10: calcMargenConRechazo(10),
          margenSiRechazo20: calcMargenConRechazo(20),
          margenSiRechazo30: calcMargenConRechazo(30),
          esRentable,
          alerta,
        };
      },
    }),
    {
      name: 'litper-dropshipping-store',
      partialize: (state) => ({
        pedidos: state.pedidos,
        selectedMonth: state.selectedMonth,
      }),
    }
  )
);

// ============================================
// EXPORTS ÚTILES
// ============================================

export { formatCOP };

export const ESTADOS_COD: Record<EstadoCOD, { label: string; color: string }> = {
  pendiente: { label: 'Pendiente', color: '#F59E0B' },
  confirmado: { label: 'Confirmado', color: '#3B82F6' },
  enviado: { label: 'Enviado', color: '#8B5CF6' },
  en_camino: { label: 'En camino', color: '#6366F1' },
  entregado: { label: 'Entregado', color: '#10B981' },
  rechazado: { label: 'Rechazado', color: '#EF4444' },
  no_contactado: { label: 'No contactado', color: '#F97316' },
  devuelto: { label: 'Devuelto', color: '#DC2626' },
  indemnizado: { label: 'Indemnizado', color: '#6B7280' },
};

export const CATEGORIAS_PRODUCTO: Record<string, { label: string; color: string; emoji: string }> = {
  estrella: { label: 'Estrella', color: '#F59E0B', emoji: '⭐' },
  rentable: { label: 'Rentable', color: '#10B981', emoji: '✅' },
  marginal: { label: 'Marginal', color: '#F97316', emoji: '⚠️' },
  perdedor: { label: 'Perdedor', color: '#EF4444', emoji: '❌' },
};
