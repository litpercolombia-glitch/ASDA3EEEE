// services/unifiedCargaService.ts
// Servicio unificado que combina cargaService y globalStorageService
// Proporciona una única fuente de verdad para la gestión de cargas

import { cargaService } from './cargaService';
import {
  obtenerTodasLasHojas,
  obtenerHojasLocal,
  guardarNuevaHoja,
  eliminarHoja,
  eliminarGuiaDeHoja,
  sincronizarHojas,
  HojaCarga,
} from './globalStorageService';
import {
  Carga,
  GuiaCarga,
  CargaProgress,
  CargaBatch,
  BatchConfig,
  DEFAULT_BATCH_CONFIG,
  SyncStatus,
  BackendSyncResult,
} from '../types/carga.types';
import { Shipment } from '../types';

// ==================== TIPOS UNIFICADOS ====================

export interface UnifiedCarga {
  id: string;
  nombre: string;
  fecha: string;
  numeroCarga: number;
  guias: GuiaCarga[];
  totalGuias: number;
  estado: 'activa' | 'cerrada' | 'archivada';
  usuarioId: string;
  usuarioNombre: string;
  creadaEn: Date;
  actualizadaEn: Date;
  // Metadata de sincronización
  sincronizadoConBackend: boolean;
  sincronizadoConGlobal: boolean;
  backendId?: string;
  globalHojaId?: string;
}

export interface UnifiedStorageStatus {
  localStorage: {
    cargas: number;
    guiasTotales: number;
    ultimaActualizacion: Date | null;
  };
  globalStorage: {
    hojas: number;
    guiasTotales: number;
    sincronizado: boolean;
  };
  backend: {
    conectado: boolean;
    ultimaSync: Date | null;
    pendientes: number;
  };
}

// ==================== SERVICIO UNIFICADO ====================

class UnifiedCargaService {
  private batchConfig: BatchConfig = DEFAULT_BATCH_CONFIG;
  private syncStatus: SyncStatus = {
    ultimaSync: null,
    pendienteSync: false,
    errorSync: null,
    cargasPendientes: [],
  };

  // ==================== CONFIGURACIÓN ====================

  setBatchConfig(config: Partial<BatchConfig>): void {
    this.batchConfig = { ...this.batchConfig, ...config };
  }

  getBatchConfig(): BatchConfig {
    return this.batchConfig;
  }

  // ==================== CRUD UNIFICADO ====================

  /**
   * Crear nueva carga unificada
   */
  async crearCarga(
    usuarioId: string,
    usuarioNombre: string,
    guiasIniciales: GuiaCarga[] = []
  ): Promise<UnifiedCarga> {
    // 1. Crear en localStorage (cargaService)
    const carga = cargaService.crearCarga(usuarioId, usuarioNombre, guiasIniciales);

    // 2. Crear en globalStorage si hay guías
    let globalHojaId: string | undefined;
    if (guiasIniciales.length > 0) {
      try {
        const shipments = this.guiasToShipments(guiasIniciales);
        const hoja = await guardarNuevaHoja(shipments, carga.nombre);
        globalHojaId = hoja.id;
      } catch (error) {
        console.warn('No se pudo crear hoja global:', error);
      }
    }

    return this.cargaToUnified(carga, globalHojaId);
  }

  /**
   * Obtener carga por ID
   */
  async getCarga(cargaId: string): Promise<UnifiedCarga | null> {
    const carga = cargaService.getCarga(cargaId);
    if (!carga) return null;
    return this.cargaToUnified(carga);
  }

  /**
   * Obtener todas las cargas
   */
  async getTodasLasCargas(): Promise<UnifiedCarga[]> {
    const cargas = cargaService.getTodasLasCargas();
    return cargas.map(c => this.cargaToUnified(c));
  }

  /**
   * Obtener carga activa del día
   */
  async getCargaActivaHoy(usuarioId: string, usuarioNombre: string): Promise<UnifiedCarga> {
    const carga = cargaService.getOCrearCargaHoy(usuarioId, usuarioNombre);
    return this.cargaToUnified(carga);
  }

  // ==================== GUÍAS ====================

  /**
   * Agregar guías con procesamiento en lotes
   */
  async agregarGuiasEnLotes(
    cargaId: string,
    guias: GuiaCarga[],
    onProgress?: (progress: CargaProgress) => void
  ): Promise<CargaProgress> {
    const { tamanoLote, delayEntreGuias, delayEntreLotes } = this.batchConfig;

    // Dividir en lotes
    const lotes: CargaBatch[] = [];
    for (let i = 0; i < guias.length; i += tamanoLote) {
      const guiasLote = guias.slice(i, i + tamanoLote);
      lotes.push({
        id: `batch_${Date.now()}_${i}`,
        cargaId,
        numeroBatch: Math.floor(i / tamanoLote) + 1,
        guias: guiasLote,
        totalGuias: guiasLote.length,
        estado: 'pendiente',
        creadoEn: new Date(),
      });
    }

    // Inicializar progreso
    const progress: CargaProgress = {
      total: guias.length,
      procesados: 0,
      exitosos: 0,
      fallidos: 0,
      porcentaje: 0,
      batchActual: 0,
      totalBatches: lotes.length,
      errores: [],
      estado: 'procesando',
      tiempoInicio: new Date(),
    };

    onProgress?.(progress);

    // Procesar lotes
    for (let batchIndex = 0; batchIndex < lotes.length; batchIndex++) {
      const lote = lotes[batchIndex];
      progress.batchActual = batchIndex + 1;

      for (const guia of lote.guias) {
        try {
          // Agregar guía individual
          const cargaActualizada = cargaService.agregarGuias(cargaId, [guia]);

          if (cargaActualizada) {
            progress.exitosos++;
          } else {
            throw new Error('Guía duplicada o carga inactiva');
          }
        } catch (error) {
          progress.fallidos++;
          progress.errores.push({
            guiaId: guia.id,
            numeroGuia: guia.numeroGuia,
            mensaje: String(error),
            timestamp: new Date(),
            reintentos: 0,
            resuelta: false,
          });
        }

        progress.procesados++;
        progress.porcentaje = Math.round((progress.procesados / progress.total) * 100);
        progress.guiaActual = guia.numeroGuia;

        onProgress?.(progress);

        // Delay entre guías
        if (delayEntreGuias > 0) {
          await this.delay(delayEntreGuias);
        }
      }

      // Delay entre lotes
      if (batchIndex < lotes.length - 1 && delayEntreLotes > 0) {
        await this.delay(delayEntreLotes);
      }
    }

    // Finalizar
    progress.estado = progress.fallidos > 0 ? 'error' : 'completado';
    onProgress?.(progress);

    // Sincronizar con globalStorage
    await this.syncCargaToGlobal(cargaId);

    return progress;
  }

  /**
   * Agregar guías simples (sin lotes)
   */
  async agregarGuias(cargaId: string, guias: GuiaCarga[]): Promise<Carga | null> {
    return cargaService.agregarGuias(cargaId, guias);
  }

  // ==================== SINCRONIZACIÓN ====================

  /**
   * Sincronizar carga con globalStorage
   */
  async syncCargaToGlobal(cargaId: string): Promise<boolean> {
    const carga = cargaService.getCarga(cargaId);
    if (!carga) return false;

    try {
      const shipments = this.guiasToShipments(carga.guias);
      await guardarNuevaHoja(shipments, carga.nombre);
      return true;
    } catch (error) {
      console.error('Error sincronizando con globalStorage:', error);
      return false;
    }
  }

  /**
   * Sincronizar con backend
   */
  async syncCargaToBackend(cargaId: string): Promise<BackendSyncResult> {
    const carga = cargaService.getCarga(cargaId);
    if (!carga) {
      return {
        success: false,
        cargaId,
        error: 'Carga no encontrada',
        timestamp: new Date(),
      };
    }

    try {
      const backendUrl = import.meta.env?.VITE_BACKEND_URL || 'https://litper-tracker-api.onrender.com';

      const response = await fetch(`${backendUrl}/api/cargas/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fecha: carga.fecha,
          numero_carga: carga.numeroCarga,
          nombre: carga.nombre,
          usuario_id: carga.usuarioId,
          usuario_nombre: carga.usuarioNombre,
          total_guias: carga.totalGuias,
          estado: carga.estado,
        }),
      });

      if (response.ok) {
        const backendData = await response.json();

        // Sincronizar guías
        if (carga.guias.length > 0) {
          await fetch(`${backendUrl}/api/cargas/${backendData.id}/guias`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ guias: carga.guias }),
          });
        }

        this.syncStatus.ultimaSync = new Date();
        this.syncStatus.pendienteSync = false;
        this.syncStatus.cargasPendientes = this.syncStatus.cargasPendientes.filter(
          id => id !== cargaId
        );

        return {
          success: true,
          cargaId,
          backendId: backendData.id,
          timestamp: new Date(),
        };
      } else {
        throw new Error(`Error del servidor: ${response.status}`);
      }
    } catch (error) {
      this.syncStatus.errorSync = String(error);
      if (!this.syncStatus.cargasPendientes.includes(cargaId)) {
        this.syncStatus.cargasPendientes.push(cargaId);
      }

      return {
        success: false,
        cargaId,
        error: String(error),
        timestamp: new Date(),
      };
    }
  }

  /**
   * Sincronizar todas las cargas pendientes
   */
  async syncAllPending(): Promise<BackendSyncResult[]> {
    const results: BackendSyncResult[] = [];

    for (const cargaId of this.syncStatus.cargasPendientes) {
      const result = await this.syncCargaToBackend(cargaId);
      results.push(result);

      // Pequeño delay entre syncs
      await this.delay(500);
    }

    return results;
  }

  /**
   * Obtener estado de almacenamiento
   */
  async getStorageStatus(): Promise<UnifiedStorageStatus> {
    const cargas = cargaService.getTodasLasCargas();
    const hojasLocales = obtenerHojasLocal();

    let backendConectado = false;
    try {
      const backendUrl = import.meta.env?.VITE_BACKEND_URL || 'https://litper-tracker-api.onrender.com';
      const response = await fetch(`${backendUrl}/api/health`, { method: 'GET' });
      backendConectado = response.ok;
    } catch {
      backendConectado = false;
    }

    return {
      localStorage: {
        cargas: cargas.length,
        guiasTotales: cargas.reduce((sum, c) => sum + c.guias.length, 0),
        ultimaActualizacion: cargas.length > 0
          ? new Date(Math.max(...cargas.map(c => c.actualizadaEn.getTime())))
          : null,
      },
      globalStorage: {
        hojas: hojasLocales.length,
        guiasTotales: hojasLocales.reduce((sum, h) => sum + h.cantidadGuias, 0),
        sincronizado: true, // Local siempre sincronizado
      },
      backend: {
        conectado: backendConectado,
        ultimaSync: this.syncStatus.ultimaSync,
        pendientes: this.syncStatus.cargasPendientes.length,
      },
    };
  }

  // ==================== HELPERS ====================

  private cargaToUnified(carga: Carga, globalHojaId?: string): UnifiedCarga {
    return {
      id: carga.id,
      nombre: carga.nombre,
      fecha: carga.fecha,
      numeroCarga: carga.numeroCarga,
      guias: carga.guias,
      totalGuias: carga.totalGuias,
      estado: carga.estado,
      usuarioId: carga.usuarioId,
      usuarioNombre: carga.usuarioNombre,
      creadaEn: carga.creadaEn,
      actualizadaEn: carga.actualizadaEn,
      sincronizadoConBackend: !this.syncStatus.cargasPendientes.includes(carga.id),
      sincronizadoConGlobal: !!globalHojaId,
      globalHojaId,
    };
  }

  private guiasToShipments(guias: GuiaCarga[]): Shipment[] {
    return guias.map(g => ({
      id: g.id,
      guia: g.numeroGuia,
      trackingNumber: g.numeroGuia,
      estado: g.estado,
      status: g.estado,
      transportadora: g.transportadora,
      carrier: g.transportadora,
      ciudadDestino: g.ciudadDestino,
      destination: g.ciudadDestino,
      telefono: g.telefono,
      phone: g.telefono,
      nombreCliente: g.nombreCliente,
      direccion: g.direccion,
      dias: g.diasTransito,
      daysInTransit: g.diasTransito,
      tieneNovedad: g.tieneNovedad,
      hasIssue: g.tieneNovedad,
      tipoNovedad: g.tipoNovedad,
      descripcionNovedad: g.descripcionNovedad,
      valorDeclarado: g.valorDeclarado,
      ultimoMovimiento: g.ultimoMovimiento,
      source: g.fuente,
    } as Shipment));
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton
export const unifiedCargaService = new UnifiedCargaService();
export default unifiedCargaService;
