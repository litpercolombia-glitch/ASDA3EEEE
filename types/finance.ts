// types/finance.ts
// Centro Financiero con P&L - LITPER PRO Enterprise

// ==================== INGRESOS ====================

export interface ProductoVendido {
  id: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  costoUnitario: number;
  subtotal: number;
}

export interface Ingreso {
  id: string;
  tipo: 'venta' | 'servicio' | 'devolucion_proveedor' | 'otro';
  fuente: 'dropi' | 'shopify' | 'manual' | 'api' | 'excel';

  // Datos de venta
  ordenId?: string;
  cliente?: string;
  clienteTelefono?: string;
  productos: ProductoVendido[];

  // Montos
  ventaBruta: number;
  descuentos: number;
  ventaNeta: number;

  // Costos directos
  costoProducto: number;
  costoEnvio: number;
  comisionPlataforma: number;
  comisionPasarela: number;

  // Resultado
  utilidadBruta: number;

  // Logística
  trackingNumber?: string;
  transportadora?: string;
  estadoEnvio?: string;

  // Metadata
  fecha: string;
  mes: string; // YYYY-MM
  archivoOrigen?: string;
  notas?: string;
  createdAt: string;
  createdBy: string;
}

// ==================== GASTOS ====================

export type CategoriaGasto =
  | 'publicidad'
  | 'nomina'
  | 'plataformas'
  | 'logistica'
  | 'oficina'
  | 'bancarios'
  | 'impuestos'
  | 'inventario'
  | 'marketing_otros'
  | 'legal'
  | 'tecnologia'
  | 'otros';

export const CATEGORIAS_GASTO: Record<CategoriaGasto, { nombre: string; icono: string; color: string }> = {
  publicidad: { nombre: 'Publicidad', icono: '📢', color: '#F59E0B' },
  nomina: { nombre: 'Nómina', icono: '👥', color: '#3B82F6' },
  plataformas: { nombre: 'Plataformas/Software', icono: '💻', color: '#8B5CF6' },
  logistica: { nombre: 'Logística', icono: '🚚', color: '#10B981' },
  oficina: { nombre: 'Oficina/Servicios', icono: '🏢', color: '#6B7280' },
  bancarios: { nombre: 'Gastos Bancarios', icono: '🏦', color: '#EF4444' },
  impuestos: { nombre: 'Impuestos', icono: '📋', color: '#DC2626' },
  inventario: { nombre: 'Inventario', icono: '📦', color: '#059669' },
  marketing_otros: { nombre: 'Marketing Otros', icono: '🎨', color: '#EC4899' },
  legal: { nombre: 'Legal/Contable', icono: '⚖️', color: '#4B5563' },
  tecnologia: { nombre: 'Tecnología', icono: '🖥️', color: '#0EA5E9' },
  otros: { nombre: 'Otros', icono: '📎', color: '#9CA3AF' },
};

export interface Gasto {
  id: string;
  categoria: CategoriaGasto;
  subcategoria: string;

  descripcion: string;
  monto: number;

  // Clasificación
  tipoGasto: 'fijo' | 'variable' | 'extraordinario';
  deducible: boolean;

  // Recurrencia
  esRecurrente: boolean;
  frecuencia?: 'diario' | 'semanal' | 'quincenal' | 'mensual' | 'anual';
  proximoPago?: string;

  // Comprobante
  tieneComprobante: boolean;
  comprobanteUrl?: string;
  numeroFactura?: string;

  // Proveedor
  proveedor?: string;

  // Metadata
  fecha: string;
  mes: string; // YYYY-MM
  archivoOrigen?: string;
  notas?: string;
  createdAt: string;
  createdBy: string;
}

// ==================== ESTADO DE RESULTADOS (P&L) ====================

export interface EstadoResultados {
  periodo: string; // YYYY-MM

  // INGRESOS
  ventasBrutas: number;
  descuentos: number;
  devoluciones: number;
  ventasNetas: number;

  // COSTO DE VENTAS
  costoProductos: number;
  costoEnvios: number;
  comisionesPlataforma: number;
  comisionesPasarela: number;
  totalCostoVentas: number;

  // UTILIDAD BRUTA
  utilidadBruta: number;
  margenBruto: number;

  // GASTOS OPERATIVOS
  gastosPublicidad: number;
  gastosNomina: number;
  gastosPlataformas: number;
  gastosOficina: number;
  gastosLogistica: number;
  otrosGastosOperativos: number;
  totalGastosOperativos: number;

  // UTILIDAD OPERATIVA (EBITDA)
  utilidadOperativa: number;
  margenOperativo: number;

  // OTROS GASTOS
  gastosFinancieros: number;
  impuestos: number;
  depreciacion: number;

  // UTILIDAD NETA
  utilidadNeta: number;
  margenNeto: number;

  // MÉTRICAS ADICIONALES
  roas: number; // Return on Ad Spend
  cpa: number; // Costo por Adquisición
  aov: number; // Average Order Value
  ltv: number; // Lifetime Value estimado
  totalOrdenes: number;
  ordenesEntregadas: number;
  tasaEntrega: number;

  // COMPARATIVAS
  vsAnterior: {
    ventasNetas: number;
    utilidadNeta: number;
    margenNeto: number;
  };
}

// ==================== ARCHIVOS IMPORTADOS ====================

export interface ArchivoFinanciero {
  id: string;
  nombre: string;
  tipo: 'dropi' | 'gastos' | 'nomina' | 'banco' | 'otro';
  fechaSubida: string;
  subidoPor: string;

  // Datos extraídos
  registrosImportados: number;
  periodosCubiertos: string[];
  montoTotal: number;

  // Trazabilidad
  registrosIds: string[];

  // Estado
  estado: 'procesando' | 'completado' | 'error' | 'parcial';
  errores?: string[];
}

// ==================== METAS FINANCIERAS ====================

export interface MetaFinanciera {
  id: string;
  tipo: 'ventas' | 'utilidad' | 'margen' | 'roas' | 'gastos';
  periodo: string; // YYYY-MM
  meta: number;
  actual: number;
  progreso: number; // 0-100
  estado: 'pendiente' | 'en_progreso' | 'lograda' | 'no_lograda';
  createdAt: string;
  createdBy: string;
}

// ==================== RESUMEN DASHBOARD ====================

export interface ResumenFinanciero {
  periodo: string;
  ventasNetas: number;
  utilidadNeta: number;
  margenNeto: number;
  roas: number;
  totalOrdenes: number;
  ticketPromedio: number;

  tendencia: {
    ventas: 'up' | 'down' | 'stable';
    utilidad: 'up' | 'down' | 'stable';
    margen: 'up' | 'down' | 'stable';
  };

  cambioVsMesAnterior: {
    ventas: number;
    utilidad: number;
    margen: number;
  };

  alertas: {
    tipo: 'warning' | 'danger' | 'info';
    mensaje: string;
  }[];
}

// ==================== FLUJO DE CAJA ====================

export interface FlujoCaja {
  periodo: string;
  saldoInicial: number;

  // Entradas
  cobroVentas: number;
  otrosIngresos: number;
  totalEntradas: number;

  // Salidas
  pagoProveedores: number;
  pagoNomina: number;
  pagoPublicidad: number;
  pagoServicios: number;
  otrosPagos: number;
  totalSalidas: number;

  // Resultado
  flujoNeto: number;
  saldoFinal: number;

  // Proyección
  proyeccion30Dias: number;
  alertaLiquidez: boolean;
}

// ==================== DEFAULTS ====================

export const ESTADO_RESULTADOS_VACIO: EstadoResultados = {
  periodo: '',
  ventasBrutas: 0,
  descuentos: 0,
  devoluciones: 0,
  ventasNetas: 0,
  costoProductos: 0,
  costoEnvios: 0,
  comisionesPlataforma: 0,
  comisionesPasarela: 0,
  totalCostoVentas: 0,
  utilidadBruta: 0,
  margenBruto: 0,
  gastosPublicidad: 0,
  gastosNomina: 0,
  gastosPlataformas: 0,
  gastosOficina: 0,
  gastosLogistica: 0,
  otrosGastosOperativos: 0,
  totalGastosOperativos: 0,
  utilidadOperativa: 0,
  margenOperativo: 0,
  gastosFinancieros: 0,
  impuestos: 0,
  depreciacion: 0,
  utilidadNeta: 0,
  margenNeto: 0,
  roas: 0,
  cpa: 0,
  aov: 0,
  ltv: 0,
  totalOrdenes: 0,
  ordenesEntregadas: 0,
  tasaEntrega: 0,
  vsAnterior: { ventasNetas: 0, utilidadNeta: 0, margenNeto: 0 },
};
