// services/cargaService.ts
// Servicio para gestionar cargas de guías

import {
  Carga,
  GuiaCarga,
  CargaStats,
  CargaResumen,
  CargaDia,
  CargaHistorial,
  FiltrosCarga,
} from '../types/carga.types';

const STORAGE_KEY = 'litper_cargas';
const CURRENT_CARGA_KEY = 'litper_carga_actual';
const AUTO_SAVE_INTERVAL = 30000; // 30 segundos

class CargaService {
  private autoSaveTimer: ReturnType<typeof setInterval> | null = null;

  // ==================== CRUD DE CARGAS ====================

  /**
   * Crear nueva carga
   */
  crearCarga(
    usuarioId: string,
    usuarioNombre: string,
    guiasIniciales: GuiaCarga[] = []
  ): Carga {
    const hoy = this.getFechaHoy();
    const cargasDelDia = this.getCargasDelDia(hoy);
    const numeroCarga = cargasDelDia.length + 1;

    const fechaFormateada = this.formatearFecha(new Date());

    const carga: Carga = {
      id: `carga_${hoy}_${numeroCarga}_${Date.now()}`,
      fecha: hoy,
      numeroCarga,
      nombre: `${fechaFormateada} Carga #${numeroCarga}`,
      usuarioId,
      usuarioNombre,
      guias: guiasIniciales,
      totalGuias: guiasIniciales.length,
      stats: this.calcularStats(guiasIniciales),
      estado: 'activa',
      creadaEn: new Date(),
      actualizadaEn: new Date(),
    };

    this.guardarCarga(carga);
    this.setCargaActual(carga.id);

    return carga;
  }

  /**
   * Obtener carga por ID
   */
  getCarga(cargaId: string): Carga | null {
    const cargas = this.getTodasLasCargas();
    return cargas.find(c => c.id === cargaId) || null;
  }

  /**
   * Actualizar carga
   */
  actualizarCarga(cargaId: string, updates: Partial<Carga>): Carga | null {
    const cargas = this.getTodasLasCargas();
    const index = cargas.findIndex(c => c.id === cargaId);

    if (index === -1) return null;

    const cargaActualizada: Carga = {
      ...cargas[index],
      ...updates,
      actualizadaEn: new Date(),
      stats: updates.guias
        ? this.calcularStats(updates.guias)
        : cargas[index].stats,
      totalGuias: updates.guias?.length ?? cargas[index].totalGuias,
    };

    cargas[index] = cargaActualizada;
    this.guardarTodasLasCargas(cargas);

    return cargaActualizada;
  }

  /**
   * Cerrar carga (no se puede editar más)
   */
  cerrarCarga(cargaId: string): boolean {
    const carga = this.actualizarCarga(cargaId, {
      estado: 'cerrada',
      cerradaEn: new Date(),
    });
    return carga !== null;
  }

  /**
   * Eliminar carga
   */
  eliminarCarga(cargaId: string): boolean {
    const cargas = this.getTodasLasCargas();
    const filtradas = cargas.filter(c => c.id !== cargaId);

    if (filtradas.length === cargas.length) return false;

    this.guardarTodasLasCargas(filtradas);

    // Si era la carga actual, limpiar
    if (this.getCargaActualId() === cargaId) {
      localStorage.removeItem(CURRENT_CARGA_KEY);
    }

    return true;
  }

  // ==================== GUÍAS ====================

  /**
   * Agregar guías a una carga
   */
  agregarGuias(cargaId: string, guias: GuiaCarga[]): Carga | null {
    const carga = this.getCarga(cargaId);
    if (!carga || carga.estado !== 'activa') return null;

    // Evitar duplicados por número de guía
    const guiasExistentes = new Set(carga.guias.map(g => g.numeroGuia));
    const guiasNuevas = guias.filter(g => !guiasExistentes.has(g.numeroGuia));

    const guiasActualizadas = [...carga.guias, ...guiasNuevas];

    return this.actualizarCarga(cargaId, { guias: guiasActualizadas });
  }

  /**
   * Actualizar guía específica
   */
  actualizarGuia(
    cargaId: string,
    guiaId: string,
    updates: Partial<GuiaCarga>
  ): Carga | null {
    const carga = this.getCarga(cargaId);
    if (!carga) return null;

    const guiasActualizadas = carga.guias.map(g =>
      g.id === guiaId ? { ...g, ...updates } : g
    );

    return this.actualizarCarga(cargaId, { guias: guiasActualizadas });
  }

  /**
   * Eliminar guía de una carga
   */
  eliminarGuia(cargaId: string, guiaId: string): Carga | null {
    const carga = this.getCarga(cargaId);
    if (!carga || carga.estado !== 'activa') return null;

    const guiasFiltradas = carga.guias.filter(g => g.id !== guiaId);
    return this.actualizarCarga(cargaId, { guias: guiasFiltradas });
  }

  // ==================== CONSULTAS ====================

  /**
   * Obtener todas las cargas
   */
  getTodasLasCargas(): Carga[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];

      const cargas = JSON.parse(data) as Carga[];

      // Convertir fechas de string a Date
      return cargas.map(c => ({
        ...c,
        creadaEn: new Date(c.creadaEn),
        actualizadaEn: new Date(c.actualizadaEn),
        cerradaEn: c.cerradaEn ? new Date(c.cerradaEn) : undefined,
      }));
    } catch (error) {
      console.error('Error al cargar cargas:', error);
      return [];
    }
  }

  /**
   * Obtener cargas de un día específico
   */
  getCargasDelDia(fecha: string): Carga[] {
    return this.getTodasLasCargas().filter(c => c.fecha === fecha);
  }

  /**
   * Obtener historial de cargas agrupado por día
   */
  getHistorial(filtros?: FiltrosCarga): CargaHistorial {
    let cargas = this.getTodasLasCargas();

    // Aplicar filtros
    if (filtros) {
      if (filtros.fechaDesde) {
        cargas = cargas.filter(c => c.fecha >= filtros.fechaDesde!);
      }
      if (filtros.fechaHasta) {
        cargas = cargas.filter(c => c.fecha <= filtros.fechaHasta!);
      }
      if (filtros.usuarioId) {
        cargas = cargas.filter(c => c.usuarioId === filtros.usuarioId);
      }
      if (filtros.estado && filtros.estado !== 'todas') {
        cargas = cargas.filter(c => c.estado === filtros.estado);
      }
    }

    // Agrupar por fecha
    const porFecha: Record<string, Carga[]> = {};
    cargas.forEach(c => {
      if (!porFecha[c.fecha]) porFecha[c.fecha] = [];
      porFecha[c.fecha].push(c);
    });

    // Convertir a CargaDia y ordenar
    const fechas: CargaDia[] = Object.entries(porFecha)
      .map(([fecha, cargasDelDia]) => ({
        fecha,
        cargas: cargasDelDia.map(c => this.toCargaResumen(c)),
        totalGuias: cargasDelDia.reduce((sum, c) => sum + c.totalGuias, 0),
        totalCargas: cargasDelDia.length,
      }))
      .sort((a, b) => b.fecha.localeCompare(a.fecha)); // Más reciente primero

    const todasLasFechas = fechas.map(f => f.fecha);

    return {
      fechas,
      totalCargas: cargas.length,
      totalGuias: cargas.reduce((sum, c) => sum + c.totalGuias, 0),
      rangoFechas: {
        desde: todasLasFechas[todasLasFechas.length - 1] || '',
        hasta: todasLasFechas[0] || '',
      },
    };
  }

  /**
   * Buscar guía en todas las cargas
   */
  buscarGuia(numeroGuia: string): Array<{ carga: CargaResumen; guia: GuiaCarga }> {
    const resultados: Array<{ carga: CargaResumen; guia: GuiaCarga }> = [];
    const cargas = this.getTodasLasCargas();

    cargas.forEach(carga => {
      const guia = carga.guias.find(g =>
        g.numeroGuia.toLowerCase().includes(numeroGuia.toLowerCase())
      );
      if (guia) {
        resultados.push({
          carga: this.toCargaResumen(carga),
          guia,
        });
      }
    });

    return resultados;
  }

  // ==================== CARGA ACTUAL ====================

  /**
   * Obtener ID de carga actual
   */
  getCargaActualId(): string | null {
    return localStorage.getItem(CURRENT_CARGA_KEY);
  }

  /**
   * Establecer carga actual
   */
  setCargaActual(cargaId: string): void {
    localStorage.setItem(CURRENT_CARGA_KEY, cargaId);
  }

  /**
   * Obtener carga actual completa
   */
  getCargaActual(): Carga | null {
    const id = this.getCargaActualId();
    return id ? this.getCarga(id) : null;
  }

  /**
   * Obtener o crear carga del día actual
   */
  getOCrearCargaHoy(usuarioId: string, usuarioNombre: string): Carga {
    const hoy = this.getFechaHoy();
    const cargasHoy = this.getCargasDelDia(hoy);

    // Buscar carga activa del usuario hoy
    const cargaActiva = cargasHoy.find(
      c => c.usuarioId === usuarioId && c.estado === 'activa'
    );

    if (cargaActiva) {
      this.setCargaActual(cargaActiva.id);
      return cargaActiva;
    }

    // Crear nueva
    return this.crearCarga(usuarioId, usuarioNombre);
  }

  // ==================== AUTO-GUARDADO ====================

  /**
   * Iniciar auto-guardado
   */
  iniciarAutoGuardado(cargaId: string, onSave?: () => void): void {
    this.detenerAutoGuardado();

    this.autoSaveTimer = setInterval(() => {
      const carga = this.getCarga(cargaId);
      if (carga && carga.estado === 'activa') {
        this.actualizarCarga(cargaId, { actualizadaEn: new Date() });
        onSave?.();
        console.log('Auto-guardado:', new Date().toLocaleTimeString());
      }
    }, AUTO_SAVE_INTERVAL);
  }

  /**
   * Detener auto-guardado
   */
  detenerAutoGuardado(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  // ==================== UTILIDADES ====================

  /**
   * Calcular estadísticas de guías
   */
  calcularStats(guias: GuiaCarga[]): CargaStats {
    const stats: CargaStats = {
      totalGuias: guias.length,
      entregadas: 0,
      enTransito: 0,
      conNovedad: 0,
      devueltas: 0,
      otros: 0,
      porcentajeEntrega: 0,
      diasPromedioTransito: 0,
      transportadoras: {},
      ciudades: {},
    };

    if (guias.length === 0) return stats;

    let totalDias = 0;

    guias.forEach(g => {
      // Por estado
      const estado = g.estado.toLowerCase();
      if (estado.includes('entregado')) {
        stats.entregadas++;
      } else if (estado.includes('tránsito') || estado.includes('transito')) {
        stats.enTransito++;
      } else if (g.tieneNovedad || estado.includes('novedad')) {
        stats.conNovedad++;
      } else if (estado.includes('devuelto') || estado.includes('retorno')) {
        stats.devueltas++;
      } else {
        stats.otros++;
      }

      // Días
      totalDias += g.diasTransito;

      // Transportadoras
      if (g.transportadora) {
        stats.transportadoras[g.transportadora] =
          (stats.transportadoras[g.transportadora] || 0) + 1;
      }

      // Ciudades
      if (g.ciudadDestino) {
        stats.ciudades[g.ciudadDestino] =
          (stats.ciudades[g.ciudadDestino] || 0) + 1;
      }
    });

    stats.porcentajeEntrega = Math.round((stats.entregadas / guias.length) * 100);
    stats.diasPromedioTransito = Math.round(totalDias / guias.length);

    return stats;
  }

  /**
   * Convertir Carga a CargaResumen
   */
  private toCargaResumen(carga: Carga): CargaResumen {
    return {
      id: carga.id,
      numeroCarga: carga.numeroCarga,
      nombre: carga.nombre,
      totalGuias: carga.totalGuias,
      usuarioNombre: carga.usuarioNombre,
      estado: carga.estado,
      creadaEn: carga.creadaEn,
      stats: {
        entregadas: carga.stats.entregadas,
        conNovedad: carga.stats.conNovedad,
      },
    };
  }

  /**
   * Obtener fecha de hoy en formato YYYY-MM-DD
   */
  private getFechaHoy(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Formatear fecha para nombre de carga
   */
  private formatearFecha(fecha: Date): string {
    return fecha.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  /**
   * Guardar una carga
   */
  private guardarCarga(carga: Carga): void {
    const cargas = this.getTodasLasCargas();
    const index = cargas.findIndex(c => c.id === carga.id);

    if (index >= 0) {
      cargas[index] = carga;
    } else {
      cargas.push(carga);
    }

    this.guardarTodasLasCargas(cargas);
  }

  /**
   * Guardar todas las cargas
   */
  private guardarTodasLasCargas(cargas: Carga[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cargas));
  }

  /**
   * Limpiar cargas antiguas (más de 30 días)
   */
  limpiarCargasAntiguas(diasMaximos: number = 30): number {
    const cargas = this.getTodasLasCargas();
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - diasMaximos);
    const fechaLimiteStr = fechaLimite.toISOString().split('T')[0];

    const cargasFiltradas = cargas.filter(c => c.fecha >= fechaLimiteStr);
    const eliminadas = cargas.length - cargasFiltradas.length;

    if (eliminadas > 0) {
      this.guardarTodasLasCargas(cargasFiltradas);
    }

    return eliminadas;
  }
}

// Singleton
export const cargaService = new CargaService();
export default cargaService;
