// services/financeServiceEnterprise.ts
// Centro Financiero Completo - LITPER PRO Enterprise

import {
  Ingreso,
  Gasto,
  EstadoResultados,
  ArchivoFinanciero,
  MetaFinanciera,
  ResumenFinanciero,
  FlujoCaja,
  CategoriaGasto,
  ESTADO_RESULTADOS_VACIO,
} from '../types/finance';
import { permissionService } from './permissionService';

// ==================== STORAGE KEYS ====================
const STORAGE_KEYS = {
  INGRESOS: 'litper_ingresos',
  GASTOS: 'litper_gastos',
  ARCHIVOS: 'litper_archivos_financieros',
  METAS: 'litper_metas_financieras',
  CONFIG: 'litper_finance_config',
};

// ==================== FINANCE SERVICE ====================

class FinanceServiceEnterprise {
  private ingresos: Map<string, Ingreso> = new Map();
  private gastos: Map<string, Gasto> = new Map();
  private archivos: Map<string, ArchivoFinanciero> = new Map();
  private metas: Map<string, MetaFinanciera> = new Map();
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadFromStorage();
  }

  // ==================== INICIALIZACIÓN ====================

  private loadFromStorage(): void {
    try {
      // Cargar ingresos
      const savedIngresos = localStorage.getItem(STORAGE_KEYS.INGRESOS);
      if (savedIngresos) {
        const ingresos = JSON.parse(savedIngresos) as Ingreso[];
        ingresos.forEach((i) => this.ingresos.set(i.id, i));
      }

      // Cargar gastos
      const savedGastos = localStorage.getItem(STORAGE_KEYS.GASTOS);
      if (savedGastos) {
        const gastos = JSON.parse(savedGastos) as Gasto[];
        gastos.forEach((g) => this.gastos.set(g.id, g));
      }

      // Cargar archivos
      const savedArchivos = localStorage.getItem(STORAGE_KEYS.ARCHIVOS);
      if (savedArchivos) {
        const archivos = JSON.parse(savedArchivos) as ArchivoFinanciero[];
        archivos.forEach((a) => this.archivos.set(a.id, a));
      }

      // Cargar metas
      const savedMetas = localStorage.getItem(STORAGE_KEYS.METAS);
      if (savedMetas) {
        const metas = JSON.parse(savedMetas) as MetaFinanciera[];
        metas.forEach((m) => this.metas.set(m.id, m));
      }
    } catch (error) {
      console.error('[FinanceService] Error cargando datos:', error);
    }
  }

  private saveIngresos(): void {
    const ingresos = Array.from(this.ingresos.values());
    localStorage.setItem(STORAGE_KEYS.INGRESOS, JSON.stringify(ingresos));
  }

  private saveGastos(): void {
    const gastos = Array.from(this.gastos.values());
    localStorage.setItem(STORAGE_KEYS.GASTOS, JSON.stringify(gastos));
  }

  private saveArchivos(): void {
    const archivos = Array.from(this.archivos.values());
    localStorage.setItem(STORAGE_KEYS.ARCHIVOS, JSON.stringify(archivos));
  }

  private saveMetas(): void {
    const metas = Array.from(this.metas.values());
    localStorage.setItem(STORAGE_KEYS.METAS, JSON.stringify(metas));
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener());
  }

  // ==================== GESTIÓN DE INGRESOS ====================

  /**
   * Crear ingreso
   */
  crearIngreso(datos: Omit<Ingreso, 'id' | 'createdAt' | 'createdBy'>): Ingreso {
    const id = `ing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const usuario = permissionService.getUsuarioActual();

    const ingreso: Ingreso = {
      ...datos,
      id,
      mes: datos.fecha.substring(0, 7),
      createdAt: new Date().toISOString(),
      createdBy: usuario?.id || 'system',
    };

    this.ingresos.set(id, ingreso);
    this.saveIngresos();
    this.notifyListeners();

    permissionService.logAction('create', 'finanzas', `Ingreso creado: $${datos.ventaNeta.toLocaleString()}`);

    return ingreso;
  }

  /**
   * Obtener todos los ingresos
   */
  getIngresos(filtro?: { mes?: string; tipo?: string; fuente?: string }): Ingreso[] {
    let ingresos = Array.from(this.ingresos.values());

    if (filtro?.mes) {
      ingresos = ingresos.filter((i) => i.mes === filtro.mes);
    }
    if (filtro?.tipo) {
      ingresos = ingresos.filter((i) => i.tipo === filtro.tipo);
    }
    if (filtro?.fuente) {
      ingresos = ingresos.filter((i) => i.fuente === filtro.fuente);
    }

    return ingresos.sort((a, b) => b.fecha.localeCompare(a.fecha));
  }

  /**
   * Obtener ingreso por ID
   */
  getIngreso(id: string): Ingreso | undefined {
    return this.ingresos.get(id);
  }

  /**
   * Actualizar ingreso
   */
  actualizarIngreso(id: string, datos: Partial<Ingreso>): Ingreso | null {
    const ingreso = this.ingresos.get(id);
    if (!ingreso) return null;

    const actualizado = { ...ingreso, ...datos, id };
    this.ingresos.set(id, actualizado);
    this.saveIngresos();
    this.notifyListeners();

    permissionService.logAction('update', 'finanzas', `Ingreso actualizado: ${id}`);

    return actualizado;
  }

  /**
   * Eliminar ingreso
   */
  eliminarIngreso(id: string): boolean {
    if (!this.ingresos.has(id)) return false;

    this.ingresos.delete(id);
    this.saveIngresos();
    this.notifyListeners();

    permissionService.logAction('delete', 'finanzas', `Ingreso eliminado: ${id}`);

    return true;
  }

  // ==================== GESTIÓN DE GASTOS ====================

  /**
   * Crear gasto
   */
  crearGasto(datos: Omit<Gasto, 'id' | 'createdAt' | 'createdBy'>): Gasto {
    const id = `gast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const usuario = permissionService.getUsuarioActual();

    const gasto: Gasto = {
      ...datos,
      id,
      mes: datos.fecha.substring(0, 7),
      createdAt: new Date().toISOString(),
      createdBy: usuario?.id || 'system',
    };

    this.gastos.set(id, gasto);
    this.saveGastos();
    this.notifyListeners();

    permissionService.logAction('create', 'finanzas', `Gasto creado: $${datos.monto.toLocaleString()} - ${datos.categoria}`);

    return gasto;
  }

  /**
   * Obtener todos los gastos
   */
  getGastos(filtro?: { mes?: string; categoria?: CategoriaGasto; tipoGasto?: string }): Gasto[] {
    let gastos = Array.from(this.gastos.values());

    if (filtro?.mes) {
      gastos = gastos.filter((g) => g.mes === filtro.mes);
    }
    if (filtro?.categoria) {
      gastos = gastos.filter((g) => g.categoria === filtro.categoria);
    }
    if (filtro?.tipoGasto) {
      gastos = gastos.filter((g) => g.tipoGasto === filtro.tipoGasto);
    }

    return gastos.sort((a, b) => b.fecha.localeCompare(a.fecha));
  }

  /**
   * Obtener gasto por ID
   */
  getGasto(id: string): Gasto | undefined {
    return this.gastos.get(id);
  }

  /**
   * Actualizar gasto
   */
  actualizarGasto(id: string, datos: Partial<Gasto>): Gasto | null {
    const gasto = this.gastos.get(id);
    if (!gasto) return null;

    const actualizado = { ...gasto, ...datos, id };
    this.gastos.set(id, actualizado);
    this.saveGastos();
    this.notifyListeners();

    permissionService.logAction('update', 'finanzas', `Gasto actualizado: ${id}`);

    return actualizado;
  }

  /**
   * Eliminar gasto
   */
  eliminarGasto(id: string): boolean {
    if (!this.gastos.has(id)) return false;

    this.gastos.delete(id);
    this.saveGastos();
    this.notifyListeners();

    permissionService.logAction('delete', 'finanzas', `Gasto eliminado: ${id}`);

    return true;
  }

  // ==================== ESTADO DE RESULTADOS (P&L) ====================

  /**
   * Calcular Estado de Resultados para un período
   */
  calcularEstadoResultados(periodo: string): EstadoResultados {
    const ingresosPeriodo = this.getIngresos({ mes: periodo });
    const gastosPeriodo = this.getGastos({ mes: periodo });

    // Calcular ingresos
    const ventasBrutas = ingresosPeriodo.reduce((sum, i) => sum + i.ventaBruta, 0);
    const descuentos = ingresosPeriodo.reduce((sum, i) => sum + i.descuentos, 0);
    const devoluciones = ingresosPeriodo.filter((i) => i.tipo === 'devolucion_proveedor').reduce((sum, i) => sum + i.ventaNeta, 0);
    const ventasNetas = ventasBrutas - descuentos - Math.abs(devoluciones);

    // Calcular costo de ventas
    const costoProductos = ingresosPeriodo.reduce((sum, i) => sum + i.costoProducto, 0);
    const costoEnvios = ingresosPeriodo.reduce((sum, i) => sum + i.costoEnvio, 0);
    const comisionesPlataforma = ingresosPeriodo.reduce((sum, i) => sum + i.comisionPlataforma, 0);
    const comisionesPasarela = ingresosPeriodo.reduce((sum, i) => sum + i.comisionPasarela, 0);
    const totalCostoVentas = costoProductos + costoEnvios + comisionesPlataforma + comisionesPasarela;

    // Utilidad bruta
    const utilidadBruta = ventasNetas - totalCostoVentas;
    const margenBruto = ventasNetas > 0 ? (utilidadBruta / ventasNetas) * 100 : 0;

    // Gastos operativos por categoría
    const gastosPublicidad = gastosPeriodo.filter((g) => g.categoria === 'publicidad').reduce((sum, g) => sum + g.monto, 0);
    const gastosNomina = gastosPeriodo.filter((g) => g.categoria === 'nomina').reduce((sum, g) => sum + g.monto, 0);
    const gastosPlataformas = gastosPeriodo.filter((g) => g.categoria === 'plataformas').reduce((sum, g) => sum + g.monto, 0);
    const gastosOficina = gastosPeriodo.filter((g) => g.categoria === 'oficina').reduce((sum, g) => sum + g.monto, 0);
    const gastosLogistica = gastosPeriodo.filter((g) => g.categoria === 'logistica').reduce((sum, g) => sum + g.monto, 0);
    const otrosGastosOperativos = gastosPeriodo
      .filter((g) => !['publicidad', 'nomina', 'plataformas', 'oficina', 'logistica', 'bancarios', 'impuestos'].includes(g.categoria))
      .reduce((sum, g) => sum + g.monto, 0);
    const totalGastosOperativos = gastosPublicidad + gastosNomina + gastosPlataformas + gastosOficina + gastosLogistica + otrosGastosOperativos;

    // Utilidad operativa
    const utilidadOperativa = utilidadBruta - totalGastosOperativos;
    const margenOperativo = ventasNetas > 0 ? (utilidadOperativa / ventasNetas) * 100 : 0;

    // Otros gastos
    const gastosFinancieros = gastosPeriodo.filter((g) => g.categoria === 'bancarios').reduce((sum, g) => sum + g.monto, 0);
    const impuestos = gastosPeriodo.filter((g) => g.categoria === 'impuestos').reduce((sum, g) => sum + g.monto, 0);
    const depreciacion = 0; // Por ahora no manejamos depreciación

    // Utilidad neta
    const utilidadNeta = utilidadOperativa - gastosFinancieros - impuestos - depreciacion;
    const margenNeto = ventasNetas > 0 ? (utilidadNeta / ventasNetas) * 100 : 0;

    // Métricas adicionales
    const totalOrdenes = ingresosPeriodo.filter((i) => i.tipo === 'venta').length;
    const roas = gastosPublicidad > 0 ? ventasNetas / gastosPublicidad : 0;
    const cpa = totalOrdenes > 0 ? gastosPublicidad / totalOrdenes : 0;
    const aov = totalOrdenes > 0 ? ventasNetas / totalOrdenes : 0;

    // Calcular período anterior para comparar
    const [year, month] = periodo.split('-').map(Number);
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const periodoAnterior = `${prevYear}-${prevMonth.toString().padStart(2, '0')}`;
    const pyGAnterior = this.calcularEstadoResultadosBasico(periodoAnterior);

    const vsAnterior = {
      ventasNetas: pyGAnterior.ventasNetas > 0 ? ((ventasNetas - pyGAnterior.ventasNetas) / pyGAnterior.ventasNetas) * 100 : 0,
      utilidadNeta: pyGAnterior.utilidadNeta !== 0 ? ((utilidadNeta - pyGAnterior.utilidadNeta) / Math.abs(pyGAnterior.utilidadNeta)) * 100 : 0,
      margenNeto: margenNeto - pyGAnterior.margenNeto,
    };

    return {
      periodo,
      ventasBrutas,
      descuentos,
      devoluciones,
      ventasNetas,
      costoProductos,
      costoEnvios,
      comisionesPlataforma,
      comisionesPasarela,
      totalCostoVentas,
      utilidadBruta,
      margenBruto,
      gastosPublicidad,
      gastosNomina,
      gastosPlataformas,
      gastosOficina,
      gastosLogistica,
      otrosGastosOperativos,
      totalGastosOperativos,
      utilidadOperativa,
      margenOperativo,
      gastosFinancieros,
      impuestos,
      depreciacion,
      utilidadNeta,
      margenNeto,
      roas,
      cpa,
      aov,
      ltv: aov * 2.5, // Estimado simple
      totalOrdenes,
      ordenesEntregadas: totalOrdenes, // Simplificado
      tasaEntrega: 100,
      vsAnterior,
    };
  }

  /**
   * Versión básica para evitar recursión
   */
  private calcularEstadoResultadosBasico(periodo: string): { ventasNetas: number; utilidadNeta: number; margenNeto: number } {
    const ingresos = this.getIngresos({ mes: periodo });
    const gastos = this.getGastos({ mes: periodo });

    const ventasNetas = ingresos.reduce((sum, i) => sum + i.ventaNeta, 0);
    const totalCostos = ingresos.reduce((sum, i) => sum + i.costoProducto + i.costoEnvio + i.comisionPlataforma + i.comisionPasarela, 0);
    const totalGastos = gastos.reduce((sum, g) => sum + g.monto, 0);
    const utilidadNeta = ventasNetas - totalCostos - totalGastos;
    const margenNeto = ventasNetas > 0 ? (utilidadNeta / ventasNetas) * 100 : 0;

    return { ventasNetas, utilidadNeta, margenNeto };
  }

  // ==================== RESUMEN Y DASHBOARD ====================

  /**
   * Obtener resumen financiero para dashboard
   */
  getResumenFinanciero(periodo?: string): ResumenFinanciero {
    const mes = periodo || new Date().toISOString().substring(0, 7);
    const pyg = this.calcularEstadoResultados(mes);

    const tendencia = {
      ventas: pyg.vsAnterior.ventasNetas > 5 ? 'up' : pyg.vsAnterior.ventasNetas < -5 ? 'down' : 'stable',
      utilidad: pyg.vsAnterior.utilidadNeta > 5 ? 'up' : pyg.vsAnterior.utilidadNeta < -5 ? 'down' : 'stable',
      margen: pyg.vsAnterior.margenNeto > 1 ? 'up' : pyg.vsAnterior.margenNeto < -1 ? 'down' : 'stable',
    } as ResumenFinanciero['tendencia'];

    const alertas: ResumenFinanciero['alertas'] = [];

    if (pyg.margenNeto < 15) {
      alertas.push({ tipo: 'warning', mensaje: 'Margen neto por debajo del 15%' });
    }
    if (pyg.roas < 2) {
      alertas.push({ tipo: 'danger', mensaje: 'ROAS por debajo de 2x - revisar publicidad' });
    }
    if (pyg.utilidadNeta < 0) {
      alertas.push({ tipo: 'danger', mensaje: 'Utilidad neta negativa este período' });
    }
    if (pyg.gastosPublicidad > pyg.ventasNetas * 0.15) {
      alertas.push({ tipo: 'warning', mensaje: 'Gastos de publicidad superan el 15% de ventas' });
    }

    return {
      periodo: mes,
      ventasNetas: pyg.ventasNetas,
      utilidadNeta: pyg.utilidadNeta,
      margenNeto: pyg.margenNeto,
      roas: pyg.roas,
      totalOrdenes: pyg.totalOrdenes,
      ticketPromedio: pyg.aov,
      tendencia,
      cambioVsMesAnterior: {
        ventas: pyg.vsAnterior.ventasNetas,
        utilidad: pyg.vsAnterior.utilidadNeta,
        margen: pyg.vsAnterior.margenNeto,
      },
      alertas,
    };
  }

  /**
   * Obtener gastos por categoría
   */
  getGastosPorCategoria(periodo?: string): Record<CategoriaGasto, number> {
    const mes = periodo || new Date().toISOString().substring(0, 7);
    const gastos = this.getGastos({ mes });

    const porCategoria: Record<CategoriaGasto, number> = {
      publicidad: 0,
      nomina: 0,
      plataformas: 0,
      logistica: 0,
      oficina: 0,
      bancarios: 0,
      impuestos: 0,
      inventario: 0,
      marketing_otros: 0,
      legal: 0,
      tecnologia: 0,
      otros: 0,
    };

    gastos.forEach((g) => {
      porCategoria[g.categoria] += g.monto;
    });

    return porCategoria;
  }

  /**
   * Obtener tendencia histórica
   */
  getTendenciaHistorica(meses: number = 6): { periodo: string; ventas: number; utilidad: number; margen: number }[] {
    const resultado: { periodo: string; ventas: number; utilidad: number; margen: number }[] = [];
    const hoy = new Date();

    for (let i = meses - 1; i >= 0; i--) {
      const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
      const periodo = fecha.toISOString().substring(0, 7);
      const pyg = this.calcularEstadoResultadosBasico(periodo);

      resultado.push({
        periodo,
        ventas: pyg.ventasNetas,
        utilidad: pyg.utilidadNeta,
        margen: pyg.margenNeto,
      });
    }

    return resultado;
  }

  // ==================== IMPORTACIÓN DE ARCHIVOS ====================

  /**
   * Importar datos desde Excel (Dropi format)
   */
  importarDropi(datos: any[], nombreArchivo: string): { exito: boolean; registros: number; errores: string[] } {
    const errores: string[] = [];
    const registrosIds: string[] = [];
    const usuario = permissionService.getUsuarioActual();

    datos.forEach((row, index) => {
      try {
        // Mapear campos de Dropi
        const ingreso: Omit<Ingreso, 'id' | 'createdAt' | 'createdBy'> = {
          tipo: 'venta',
          fuente: 'dropi',
          ordenId: row['ID Orden'] || row['OrderID'] || row['id'],
          cliente: row['Cliente'] || row['Customer'] || row['nombre'],
          clienteTelefono: row['Teléfono'] || row['Phone'],
          productos: [],
          ventaBruta: parseFloat(row['Total'] || row['Venta'] || 0),
          descuentos: parseFloat(row['Descuento'] || 0),
          ventaNeta: parseFloat(row['Venta Neta'] || row['Total'] || 0),
          costoProducto: parseFloat(row['Costo Producto'] || row['Costo'] || 0),
          costoEnvio: parseFloat(row['Costo Envío'] || row['Envío'] || 0),
          comisionPlataforma: parseFloat(row['Comisión Dropi'] || row['Comisión'] || 0),
          comisionPasarela: parseFloat(row['Comisión Pasarela'] || 0),
          utilidadBruta: 0,
          trackingNumber: row['Guía'] || row['Tracking'],
          transportadora: row['Transportadora'] || row['Carrier'],
          estadoEnvio: row['Estado'] || row['Status'],
          fecha: row['Fecha'] || new Date().toISOString().split('T')[0],
          archivoOrigen: nombreArchivo,
        };

        // Calcular utilidad bruta
        ingreso.utilidadBruta = ingreso.ventaNeta - ingreso.costoProducto - ingreso.costoEnvio - ingreso.comisionPlataforma - ingreso.comisionPasarela;

        const ingresoCreado = this.crearIngreso(ingreso);
        registrosIds.push(ingresoCreado.id);
      } catch (error) {
        errores.push(`Fila ${index + 1}: ${error}`);
      }
    });

    // Registrar archivo
    const archivo: ArchivoFinanciero = {
      id: `archivo_${Date.now()}`,
      nombre: nombreArchivo,
      tipo: 'dropi',
      fechaSubida: new Date().toISOString(),
      subidoPor: usuario?.nombre || 'Sistema',
      registrosImportados: registrosIds.length,
      periodosCubiertos: [...new Set(registrosIds.map((id) => this.ingresos.get(id)?.mes || ''))],
      montoTotal: registrosIds.reduce((sum, id) => sum + (this.ingresos.get(id)?.ventaNeta || 0), 0),
      registrosIds,
      estado: errores.length === 0 ? 'completado' : errores.length < datos.length ? 'parcial' : 'error',
      errores: errores.length > 0 ? errores : undefined,
    };

    this.archivos.set(archivo.id, archivo);
    this.saveArchivos();

    permissionService.logAction('import', 'finanzas', `Importación Dropi: ${registrosIds.length} registros de ${nombreArchivo}`);

    return { exito: errores.length < datos.length, registros: registrosIds.length, errores };
  }

  /**
   * Importar gastos desde Excel
   */
  importarGastos(datos: any[], nombreArchivo: string): { exito: boolean; registros: number; errores: string[] } {
    const errores: string[] = [];
    const registrosIds: string[] = [];
    const usuario = permissionService.getUsuarioActual();

    datos.forEach((row, index) => {
      try {
        const gasto: Omit<Gasto, 'id' | 'createdAt' | 'createdBy'> = {
          categoria: (row['Categoría'] || row['Categoria'] || 'otros').toLowerCase() as CategoriaGasto,
          subcategoria: row['Subcategoría'] || row['Subcategoria'] || '',
          descripcion: row['Descripción'] || row['Descripcion'] || row['Concepto'] || '',
          monto: parseFloat(row['Monto'] || row['Valor'] || 0),
          tipoGasto: (row['Tipo'] || 'variable').toLowerCase() as 'fijo' | 'variable' | 'extraordinario',
          deducible: row['Deducible']?.toLowerCase() === 'si' || row['Deducible'] === true,
          esRecurrente: row['Recurrente']?.toLowerCase() === 'si' || row['Recurrente'] === true,
          tieneComprobante: !!row['Factura'] || !!row['Comprobante'],
          numeroFactura: row['Factura'] || row['No. Factura'],
          proveedor: row['Proveedor'] || row['Vendor'],
          fecha: row['Fecha'] || new Date().toISOString().split('T')[0],
          archivoOrigen: nombreArchivo,
        };

        const gastoCreado = this.crearGasto(gasto);
        registrosIds.push(gastoCreado.id);
      } catch (error) {
        errores.push(`Fila ${index + 1}: ${error}`);
      }
    });

    // Registrar archivo
    const archivo: ArchivoFinanciero = {
      id: `archivo_${Date.now()}`,
      nombre: nombreArchivo,
      tipo: 'gastos',
      fechaSubida: new Date().toISOString(),
      subidoPor: usuario?.nombre || 'Sistema',
      registrosImportados: registrosIds.length,
      periodosCubiertos: [...new Set(registrosIds.map((id) => this.gastos.get(id)?.mes || ''))],
      montoTotal: registrosIds.reduce((sum, id) => sum + (this.gastos.get(id)?.monto || 0), 0),
      registrosIds,
      estado: errores.length === 0 ? 'completado' : errores.length < datos.length ? 'parcial' : 'error',
      errores: errores.length > 0 ? errores : undefined,
    };

    this.archivos.set(archivo.id, archivo);
    this.saveArchivos();

    permissionService.logAction('import', 'finanzas', `Importación Gastos: ${registrosIds.length} registros de ${nombreArchivo}`);

    return { exito: errores.length < datos.length, registros: registrosIds.length, errores };
  }

  /**
   * Obtener archivos importados
   */
  getArchivos(): ArchivoFinanciero[] {
    return Array.from(this.archivos.values()).sort((a, b) => b.fechaSubida.localeCompare(a.fechaSubida));
  }

  /**
   * Obtener registros de un archivo
   */
  getRegistrosDeArchivo(archivoId: string): { ingresos: Ingreso[]; gastos: Gasto[] } {
    const archivo = this.archivos.get(archivoId);
    if (!archivo) return { ingresos: [], gastos: [] };

    const ingresos = archivo.registrosIds
      .map((id) => this.ingresos.get(id))
      .filter((i): i is Ingreso => i !== undefined);

    const gastos = archivo.registrosIds
      .map((id) => this.gastos.get(id))
      .filter((g): g is Gasto => g !== undefined);

    return { ingresos, gastos };
  }

  // ==================== METAS ====================

  /**
   * Crear meta financiera
   */
  crearMeta(datos: Omit<MetaFinanciera, 'id' | 'actual' | 'progreso' | 'estado' | 'createdAt' | 'createdBy'>): MetaFinanciera {
    const id = `meta_${Date.now()}`;
    const usuario = permissionService.getUsuarioActual();

    const meta: MetaFinanciera = {
      ...datos,
      id,
      actual: 0,
      progreso: 0,
      estado: 'pendiente',
      createdAt: new Date().toISOString(),
      createdBy: usuario?.id || 'system',
    };

    this.metas.set(id, meta);
    this.saveMetas();
    this.notifyListeners();

    return meta;
  }

  /**
   * Obtener metas
   */
  getMetas(periodo?: string): MetaFinanciera[] {
    let metas = Array.from(this.metas.values());

    if (periodo) {
      metas = metas.filter((m) => m.periodo === periodo);
    }

    // Actualizar progreso
    metas.forEach((meta) => {
      const pyg = this.calcularEstadoResultadosBasico(meta.periodo);

      switch (meta.tipo) {
        case 'ventas':
          meta.actual = pyg.ventasNetas;
          break;
        case 'utilidad':
          meta.actual = pyg.utilidadNeta;
          break;
        case 'margen':
          meta.actual = pyg.margenNeto;
          break;
      }

      meta.progreso = meta.meta > 0 ? Math.min(100, (meta.actual / meta.meta) * 100) : 0;
      meta.estado = meta.progreso >= 100 ? 'lograda' : meta.progreso > 0 ? 'en_progreso' : 'pendiente';
    });

    return metas;
  }

  // ==================== SUBSCRIPCIONES ====================

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // ==================== UTILIDADES ====================

  /**
   * Obtener períodos disponibles
   */
  getPeriodosDisponibles(): string[] {
    const periodosIngresos = new Set(Array.from(this.ingresos.values()).map((i) => i.mes));
    const periodosGastos = new Set(Array.from(this.gastos.values()).map((g) => g.mes));

    return [...new Set([...periodosIngresos, ...periodosGastos])].sort().reverse();
  }

  /**
   * Resetear datos
   */
  reset(): void {
    this.ingresos.clear();
    this.gastos.clear();
    this.archivos.clear();
    this.metas.clear();

    this.saveIngresos();
    this.saveGastos();
    this.saveArchivos();
    this.saveMetas();
    this.notifyListeners();
  }
}

// Singleton
export const financeServiceEnterprise = new FinanceServiceEnterprise();
export default financeServiceEnterprise;
