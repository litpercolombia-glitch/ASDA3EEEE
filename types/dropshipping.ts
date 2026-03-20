// types/dropshipping.ts
// Módulo Dropshipper Intelligence - Complemento a Chatea Pro
// "Chatea Pro te ayuda a VENDER. Nosotros te ayudamos a saber si estás GANANDO."

// ==================== PEDIDO COD ====================

export type EstadoCOD =
  | 'pendiente'          // Esperando confirmación
  | 'confirmado'         // Cliente confirmó por WhatsApp/llamada
  | 'enviado'            // Despachado al cliente
  | 'en_camino'          // En tránsito
  | 'entregado'          // Entregado exitosamente
  | 'rechazado'          // Cliente rechazó en puerta
  | 'no_contactado'      // No se pudo contactar
  | 'devuelto'           // Devuelto al proveedor/bodega
  | 'indemnizado';       // Compensado por plataforma

export type MetodoPago = 'contra_entrega' | 'prepago' | 'transferencia' | 'mixto';

export interface PedidoDropshipping {
  id: string;
  ordenId: string;               // ID en Dropi/Shopify
  fuente: 'dropi' | 'shopify' | 'manual' | 'excel';

  // Cliente
  clienteNombre: string;
  clienteTelefono: string;
  clienteCiudad: string;
  clienteDepartamento: string;

  // Producto
  productoNombre: string;
  productoSKU?: string;
  proveedorNombre?: string;
  cantidad: number;

  // Financiero
  precioVenta: number;           // Lo que paga el cliente
  costoProducto: number;         // Lo que le cuesta al dropshipper
  costoEnvio: number;            // Flete
  costoDevolucion: number;       // Si fue rechazado, costo del retorno
  comisionPlataforma: number;    // Comisión Dropi/Shopify
  comisionCOD: number;           // Fee por recaudo contra entrega
  costoPublicidad: number;       // Costo de ads atribuido a este pedido

  // Cálculos
  utilidadBruta: number;         // precioVenta - costoProducto - costoEnvio - comisiones
  utilidadNeta: number;          // utilidadBruta - costoPublicidad - costoDevolucion
  margenNeto: number;            // utilidadNeta / precioVenta * 100

  // Estado
  metodoPago: MetodoPago;
  estadoCOD: EstadoCOD;
  transportadora: string;

  // Fechas
  fechaPedido: string;           // YYYY-MM-DD
  fechaEnvio?: string;
  fechaEntrega?: string;
  fechaRechazo?: string;
  mes: string;                   // YYYY-MM

  // Tracking
  guiaNumero?: string;
  motivoRechazo?: string;

  createdAt: string;
}

// ==================== ANALYTICS COD ====================

export interface CODAnalyticsPorCiudad {
  ciudad: string;
  departamento: string;
  totalPedidos: number;
  entregados: number;
  rechazados: number;
  tasaEntrega: number;           // 0-100
  tasaRechazo: number;           // 0-100
  utilidadTotal: number;
  perdidaPorRechazos: number;    // Costos de envío+devolución de rechazados
  recomendacion: 'verde' | 'amarillo' | 'rojo';  // Seguir / cuidado / evitar
}

export interface CODAnalyticsPorTransportadora {
  transportadora: string;
  totalPedidos: number;
  entregados: number;
  rechazados: number;
  tasaEntrega: number;
  tiempoPromedioEntrega: number; // días
  costoPromedioEnvio: number;
  recomendacion: 'verde' | 'amarillo' | 'rojo';
}

export interface CODAnalyticsPorProducto {
  productoNombre: string;
  productoSKU?: string;
  totalPedidos: number;
  entregados: number;
  rechazados: number;
  tasaEntrega: number;
  tasaRechazo: number;
  ingresoTotal: number;
  costoTotal: number;
  utilidadNeta: number;
  margenNeto: number;
  costoAdquisicionPromedio: number;  // CPA
  recomendacion: 'estrella' | 'rentable' | 'marginal' | 'perdedor';
}

export interface CODAnalyticsResumen {
  periodo: string;               // YYYY-MM
  totalPedidos: number;
  pedidosCOD: number;
  pedidosPrepago: number;
  entregados: number;
  rechazados: number;

  // Tasas
  tasaEntregaGeneral: number;
  tasaEntregaCOD: number;
  tasaEntregaPrepago: number;
  tasaRechazoGeneral: number;

  // Financiero
  ventasBrutas: number;
  costoProductos: number;
  costoEnvios: number;
  costoDevoluciones: number;      // El "costo oculto" que nadie trackea
  comisiones: number;
  costoPublicidad: number;
  utilidadBruta: number;
  utilidadNeta: number;
  margenBruto: number;
  margenNeto: number;

  // KPIs dropshipping
  roas: number;                  // Return on Ad Spend
  cpa: number;                   // Costo por Adquisición
  aov: number;                   // Average Order Value
  costoPorRechazo: number;       // Costo promedio de cada rechazo
  dineroQuemadoEnRechazos: number; // Total perdido en rechazos

  // Comparativa
  vsMesAnterior?: {
    tasaEntrega: number;          // cambio en puntos porcentuales
    utilidadNeta: number;         // cambio en %
    rechazos: number;             // cambio en cantidad
  };
}

// ==================== PRODUCT SCORECARD ====================

export type ProductoCategoria = 'estrella' | 'rentable' | 'marginal' | 'perdedor';

export interface ProductScorecard {
  productoNombre: string;
  productoSKU?: string;
  proveedorNombre?: string;
  categoria: ProductoCategoria;
  score: number;                 // 0-100

  // Volumen
  totalPedidos: number;
  pedidosMes: number;
  tendenciaVentas: 'subiendo' | 'estable' | 'bajando';

  // Financiero
  precioVentaPromedio: number;
  costoProductoPromedio: number;
  margenBrutoPromedio: number;
  margenNetoPromedio: number;     // Incluye ads + envíos + devoluciones
  utilidadTotalGenerada: number;

  // COD performance
  tasaEntrega: number;
  tasaRechazo: number;

  // Ads
  costoAdsTotal: number;
  cpaPromedio: number;
  roasProducto: number;

  // Verdict
  veredicto: string;              // "Escalar" | "Mantener" | "Optimizar" | "Eliminar"
  razon: string;                  // Explicación corta
}

// ==================== SUPPLIER MONITOR ====================

export interface SupplierScore {
  proveedorNombre: string;
  plataforma: 'dropi' | 'shopify' | 'otro';
  score: number;                 // 0-100

  // Performance
  totalPedidos: number;
  pedidosAtiempo: number;
  pedidosRetrasados: number;
  tasaCumplimiento: number;      // % a tiempo

  // Calidad
  devoluciones: number;
  tasaDevolucion: number;
  quejasCalidad: number;

  // Tiempos
  tiempoPromedioDespacho: number; // días desde pedido hasta envío
  tiempoPromedioEntrega: number;  // días totales hasta entrega

  // Financiero
  costoPromedioProducto: number;
  margenPromedioConEste: number;

  // Verdict
  estado: 'excelente' | 'bueno' | 'regular' | 'malo';
  recomendacion: string;
}

// ==================== PROFIT CALCULATOR ====================

export interface CalculadoraInput {
  precioVenta: number;
  costoProducto: number;
  costoEnvio: number;
  comisionPlataforma: number;    // % o valor fijo
  comisionCOD: number;           // Fee por recaudo
  costoPublicidadPorVenta: number; // CPA estimado
  tasaRechazoEstimada: number;   // % esperado
  costoDevolucionPromedio: number;
}

export interface CalculadoraResult {
  // Por pedido entregado
  utilidadPorPedido: number;
  margenPorPedido: number;

  // Ajustado por rechazos
  utilidadRealPorPedido: number; // Descontando el costo de rechazos prorrateado
  margenRealPorPedido: number;

  // Proyecciones
  ventasDiariasNecesarias: number;  // Para X meta de utilidad
  puntoEquilibrio: number;       // Pedidos mínimos para cubrir costos fijos

  // Análisis de sensibilidad
  margenSiRechazo5: number;
  margenSiRechazo10: number;
  margenSiRechazo20: number;
  margenSiRechazo30: number;

  // Alerta
  esRentable: boolean;
  alerta?: string;
}

// ==================== DASHBOARD STATE ====================

export type DropshipperView =
  | 'hub'
  | 'cod_analytics'
  | 'profit_calculator'
  | 'product_scorecard'
  | 'supplier_monitor';

export interface DropshipperDashboardState {
  // Data
  pedidos: PedidoDropshipping[];
  resumenMensual: CODAnalyticsResumen | null;
  analyticsCiudad: CODAnalyticsPorCiudad[];
  analyticsTransportadora: CODAnalyticsPorTransportadora[];
  analyticsProducto: CODAnalyticsPorProducto[];
  productScorecards: ProductScorecard[];
  supplierScores: SupplierScore[];

  // UI
  selectedMonth: string;
  selectedView: DropshipperView;
  isLoading: boolean;
}
