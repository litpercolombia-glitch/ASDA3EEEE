// services/guideHistoryService.ts
// Servicio de Historial de Guías - Tracking completo desde carga hasta entrega
// Similar a Amazon: timeline detallado de cada envío

import { eventBus } from './brain/core/EventBus';
import { memoryManager } from './brain/core/MemoryManager';

// ============================================
// TIPOS E INTERFACES
// ============================================

export type GuideSource = 'carga' | 'inteligencia_logistica' | '17track' | 'transportadora' | 'manual';
export type GuideStatus =
  | 'creado'
  | 'en_transito'
  | 'en_reparto'
  | 'en_oficina'
  | 'novedad'
  | 'entregado'
  | 'devuelto'
  | 'perdido';

export type RiskLevel = 'bajo' | 'medio' | 'alto' | 'critico';
export type DeliveryPrediction = 'probable' | 'en_riesgo' | 'critico' | 'entregado';

export interface GuideEvent {
  id: string;
  timestamp: Date;
  source: GuideSource;
  status: GuideStatus;
  statusRaw: string;
  location?: string;
  description: string;
  novedad?: string;
  metadata?: Record<string, unknown>;
}

export interface GuidePrediction {
  entrega: DeliveryPrediction;
  diasEstimados: number;
  probabilidadExito: number;
  factoresRiesgo: string[];
  recomendaciones: string[];
}

export interface GuideMetrics {
  diasEnTransito: number;
  diasSinMovimiento: number;
  cantidadEventos: number;
  tieneNovedad: boolean;
  novedadActual?: string;
  ultimaActualizacion: Date;
}

export interface GuideHistory {
  guia: string;
  transportadora: string;
  ciudadOrigen?: string;
  ciudadDestino: string;
  telefono?: string;
  cliente?: string;
  valor?: number;
  timeline: GuideEvent[];
  currentStatus: GuideStatus;
  currentStatusRaw: string;
  riskLevel: RiskLevel;
  prediction: GuidePrediction;
  metrics: GuideMetrics;
  sources: GuideSource[];
  createdAt: Date;
  updatedAt: Date;
}

export interface GuideStats {
  total: number;
  porEstado: Record<GuideStatus, number>;
  porRiesgo: Record<RiskLevel, number>;
  porTransportadora: Record<string, number>;
  porCiudad: Record<string, number>;
  promedioTiempoEntrega: number;
  tasaEntrega: number;
  tasaNovedad: number;
}

// ============================================
// SERVICIO DE HISTORIAL DE GUÍAS
// ============================================

class GuideHistoryService {
  private histories: Map<string, GuideHistory> = new Map();
  private initialized: boolean = false;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    console.log('📦 [GuideHistory] Inicializando servicio de historial...');
    this.loadFromMemory();
    this.setupEventListeners();
    this.initialized = true;
    console.log(`📦 [GuideHistory] Servicio inicializado con ${this.histories.size} guías`);
  }

  private loadFromMemory(): void {
    const savedHistories = memoryManager.recallByCategory('guide_histories');
    savedHistories.forEach(entry => {
      const history = entry.data as GuideHistory;
      if (history && history.guia) {
        this.histories.set(history.guia, history);
      }
    });
  }

  private setupEventListeners(): void {
    eventBus.on('guide.loaded', (event) => {
      this.handleGuideLoaded(event);
    });

    eventBus.on('guide.updated', (event) => {
      this.handleGuideUpdated(event);
    });

    eventBus.on('guide.status_changed', (event) => {
      this.handleStatusChanged(event);
    });
  }

  // ==================== REGISTRO DE GUÍAS ====================

  /**
   * Registrar guía desde CARGA (paso adelante del estado)
   * La carga es cuando el vendedor/operador sube las guías al sistema
   */
  registerFromCarga(guideData: {
    guia: string;
    transportadora: string;
    ciudadDestino: string;
    ciudadOrigen?: string;
    telefono?: string;
    cliente?: string;
    valor?: number;
    estado?: string;
    novedad?: string;
  }): GuideHistory {
    const existingHistory = this.histories.get(guideData.guia);

    if (existingHistory) {
      // Agregar evento de carga al timeline existente
      return this.addEvent(guideData.guia, {
        source: 'carga',
        status: this.mapStatus(guideData.estado || 'creado'),
        statusRaw: guideData.estado || 'Cargado al sistema',
        description: `Guía cargada desde archivo de carga`,
        novedad: guideData.novedad,
        metadata: { ciudadDestino: guideData.ciudadDestino },
      });
    }

    // Crear nuevo historial
    const now = new Date();
    const status = this.mapStatus(guideData.estado || 'creado');

    const history: GuideHistory = {
      guia: guideData.guia,
      transportadora: guideData.transportadora,
      ciudadOrigen: guideData.ciudadOrigen,
      ciudadDestino: guideData.ciudadDestino,
      telefono: guideData.telefono,
      cliente: guideData.cliente,
      valor: guideData.valor,
      timeline: [{
        id: this.generateId(),
        timestamp: now,
        source: 'carga',
        status,
        statusRaw: guideData.estado || 'Cargado',
        description: 'Guía registrada en el sistema desde archivo de carga',
        novedad: guideData.novedad,
      }],
      currentStatus: status,
      currentStatusRaw: guideData.estado || 'Cargado',
      riskLevel: this.calculateRiskLevel(status, 0, guideData.novedad),
      prediction: this.generatePrediction(status, 0, guideData.novedad, guideData.ciudadDestino),
      metrics: {
        diasEnTransito: 0,
        diasSinMovimiento: 0,
        cantidadEventos: 1,
        tieneNovedad: !!guideData.novedad,
        novedadActual: guideData.novedad,
        ultimaActualizacion: now,
      },
      sources: ['carga'],
      createdAt: now,
      updatedAt: now,
    };

    this.histories.set(guideData.guia, history);
    this.persistHistory(history);

    eventBus.emit('guide.history_created', {
      guia: guideData.guia,
      source: 'carga',
    });

    return history;
  }

  /**
   * Registrar guía desde INTELIGENCIA LOGÍSTICA (paso atrás del estado)
   * Inteligencia logística es el seguimiento real desde las transportadoras
   */
  registerFromInteligencia(guideData: {
    guia: string;
    transportadora: string;
    estado: string;
    ciudadDestino?: string;
    telefono?: string;
    diasTransito?: number;
    novedad?: string;
    ultimoEvento?: string;
    fechaEvento?: Date;
  }): GuideHistory {
    const existingHistory = this.histories.get(guideData.guia);
    const status = this.mapStatus(guideData.estado);

    if (existingHistory) {
      // Agregar evento de inteligencia al timeline existente
      return this.addEvent(guideData.guia, {
        source: 'inteligencia_logistica',
        status,
        statusRaw: guideData.estado,
        description: guideData.ultimoEvento || `Estado actualizado: ${guideData.estado}`,
        novedad: guideData.novedad,
        metadata: {
          diasTransito: guideData.diasTransito,
          fechaEvento: guideData.fechaEvento,
        },
      });
    }

    // Crear nuevo historial si no existe
    const now = new Date();
    const diasTransito = guideData.diasTransito || 0;

    const history: GuideHistory = {
      guia: guideData.guia,
      transportadora: guideData.transportadora,
      ciudadDestino: guideData.ciudadDestino || 'No especificada',
      telefono: guideData.telefono,
      timeline: [{
        id: this.generateId(),
        timestamp: guideData.fechaEvento || now,
        source: 'inteligencia_logistica',
        status,
        statusRaw: guideData.estado,
        description: guideData.ultimoEvento || `Estado: ${guideData.estado}`,
        novedad: guideData.novedad,
      }],
      currentStatus: status,
      currentStatusRaw: guideData.estado,
      riskLevel: this.calculateRiskLevel(status, diasTransito, guideData.novedad),
      prediction: this.generatePrediction(status, diasTransito, guideData.novedad, guideData.ciudadDestino),
      metrics: {
        diasEnTransito: diasTransito,
        diasSinMovimiento: 0,
        cantidadEventos: 1,
        tieneNovedad: !!guideData.novedad,
        novedadActual: guideData.novedad,
        ultimaActualizacion: now,
      },
      sources: ['inteligencia_logistica'],
      createdAt: now,
      updatedAt: now,
    };

    this.histories.set(guideData.guia, history);
    this.persistHistory(history);

    eventBus.emit('guide.history_created', {
      guia: guideData.guia,
      source: 'inteligencia_logistica',
    });

    return history;
  }

  /**
   * Agregar evento al historial de una guía
   */
  addEvent(guia: string, eventData: {
    source: GuideSource;
    status: GuideStatus;
    statusRaw: string;
    description: string;
    location?: string;
    novedad?: string;
    metadata?: Record<string, unknown>;
  }): GuideHistory {
    const history = this.histories.get(guia);
    if (!history) {
      throw new Error(`Guía ${guia} no encontrada en historial`);
    }

    const now = new Date();
    const newEvent: GuideEvent = {
      id: this.generateId(),
      timestamp: now,
      ...eventData,
    };

    // Agregar evento al timeline
    history.timeline.push(newEvent);

    // Actualizar estado actual
    history.currentStatus = eventData.status;
    history.currentStatusRaw = eventData.statusRaw;

    // Agregar source si es nueva
    if (!history.sources.includes(eventData.source)) {
      history.sources.push(eventData.source);
    }

    // Actualizar métricas
    const diasTransito = this.calculateDaysInTransit(history);
    history.metrics = {
      diasEnTransito: diasTransito,
      diasSinMovimiento: this.calculateDaysWithoutMovement(history),
      cantidadEventos: history.timeline.length,
      tieneNovedad: !!eventData.novedad || history.metrics.tieneNovedad,
      novedadActual: eventData.novedad || history.metrics.novedadActual,
      ultimaActualizacion: now,
    };

    // Recalcular riesgo y predicción
    history.riskLevel = this.calculateRiskLevel(
      eventData.status,
      diasTransito,
      eventData.novedad || history.metrics.novedadActual
    );
    history.prediction = this.generatePrediction(
      eventData.status,
      diasTransito,
      eventData.novedad || history.metrics.novedadActual,
      history.ciudadDestino
    );

    history.updatedAt = now;

    this.persistHistory(history);

    eventBus.emit('guide.event_added', {
      guia,
      event: newEvent,
      source: eventData.source,
    });

    return history;
  }

  // ==================== CONSULTAS ====================

  /**
   * Obtener historial de una guía
   */
  getHistory(guia: string): GuideHistory | undefined {
    return this.histories.get(guia);
  }

  /**
   * Obtener timeline completo de una guía
   */
  getTimeline(guia: string): GuideEvent[] {
    const history = this.histories.get(guia);
    return history?.timeline || [];
  }

  /**
   * Obtener todas las guías
   */
  getAllHistories(): GuideHistory[] {
    return Array.from(this.histories.values());
  }

  /**
   * Obtener guías que están en AMBOS sistemas (carga + inteligencia)
   * Estas tienen el timeline más completo
   */
  getGuidesWithFullHistory(): GuideHistory[] {
    return this.getAllHistories().filter(h =>
      h.sources.includes('carga') && h.sources.includes('inteligencia_logistica')
    );
  }

  /**
   * Obtener guías por estado
   */
  getByStatus(status: GuideStatus): GuideHistory[] {
    return this.getAllHistories().filter(h => h.currentStatus === status);
  }

  /**
   * Obtener guías por nivel de riesgo
   */
  getByRiskLevel(level: RiskLevel): GuideHistory[] {
    return this.getAllHistories().filter(h => h.riskLevel === level);
  }

  /**
   * Obtener guías críticas (riesgo alto o crítico)
   */
  getCriticalGuides(): GuideHistory[] {
    return this.getAllHistories().filter(h =>
      h.riskLevel === 'alto' || h.riskLevel === 'critico'
    );
  }

  /**
   * Obtener guías con novedad activa
   */
  getWithNovelty(): GuideHistory[] {
    return this.getAllHistories().filter(h => h.metrics.tieneNovedad);
  }

  /**
   * Buscar guías por múltiples criterios
   */
  search(criteria: {
    transportadora?: string;
    ciudad?: string;
    status?: GuideStatus;
    riskLevel?: RiskLevel;
    hasNovedad?: boolean;
    minDiasTransito?: number;
    maxDiasTransito?: number;
  }): GuideHistory[] {
    let results = this.getAllHistories();

    if (criteria.transportadora) {
      results = results.filter(h =>
        h.transportadora.toLowerCase().includes(criteria.transportadora!.toLowerCase())
      );
    }
    if (criteria.ciudad) {
      results = results.filter(h =>
        h.ciudadDestino.toLowerCase().includes(criteria.ciudad!.toLowerCase())
      );
    }
    if (criteria.status) {
      results = results.filter(h => h.currentStatus === criteria.status);
    }
    if (criteria.riskLevel) {
      results = results.filter(h => h.riskLevel === criteria.riskLevel);
    }
    if (criteria.hasNovedad !== undefined) {
      results = results.filter(h => h.metrics.tieneNovedad === criteria.hasNovedad);
    }
    if (criteria.minDiasTransito !== undefined) {
      results = results.filter(h => h.metrics.diasEnTransito >= criteria.minDiasTransito!);
    }
    if (criteria.maxDiasTransito !== undefined) {
      results = results.filter(h => h.metrics.diasEnTransito <= criteria.maxDiasTransito!);
    }

    return results;
  }

  // ==================== ESTADÍSTICAS ====================

  /**
   * Obtener estadísticas generales
   */
  getStats(): GuideStats {
    const histories = this.getAllHistories();

    const porEstado: Record<GuideStatus, number> = {
      creado: 0, en_transito: 0, en_reparto: 0, en_oficina: 0,
      novedad: 0, entregado: 0, devuelto: 0, perdido: 0,
    };
    const porRiesgo: Record<RiskLevel, number> = {
      bajo: 0, medio: 0, alto: 0, critico: 0,
    };
    const porTransportadora: Record<string, number> = {};
    const porCiudad: Record<string, number> = {};
    let totalDiasEntrega = 0;
    let guiasEntregadas = 0;
    let guiasConNovedad = 0;

    histories.forEach(h => {
      porEstado[h.currentStatus]++;
      porRiesgo[h.riskLevel]++;
      porTransportadora[h.transportadora] = (porTransportadora[h.transportadora] || 0) + 1;
      porCiudad[h.ciudadDestino] = (porCiudad[h.ciudadDestino] || 0) + 1;

      if (h.currentStatus === 'entregado') {
        guiasEntregadas++;
        totalDiasEntrega += h.metrics.diasEnTransito;
      }
      if (h.metrics.tieneNovedad) {
        guiasConNovedad++;
      }
    });

    return {
      total: histories.length,
      porEstado,
      porRiesgo,
      porTransportadora,
      porCiudad,
      promedioTiempoEntrega: guiasEntregadas > 0 ? totalDiasEntrega / guiasEntregadas : 0,
      tasaEntrega: histories.length > 0 ? (guiasEntregadas / histories.length) * 100 : 0,
      tasaNovedad: histories.length > 0 ? (guiasConNovedad / histories.length) * 100 : 0,
    };
  }

  /**
   * Obtener resumen para contexto de IA
   */
  getAIContext(): string {
    const stats = this.getStats();
    const critical = this.getCriticalGuides();
    const withNovedad = this.getWithNovelty().slice(0, 10);

    return `
RESUMEN DE GUÍAS:
- Total: ${stats.total} guías
- Entregadas: ${stats.porEstado.entregado} (${stats.tasaEntrega.toFixed(1)}%)
- En tránsito: ${stats.porEstado.en_transito}
- En reparto: ${stats.porEstado.en_reparto}
- En oficina: ${stats.porEstado.en_oficina}
- Con novedad: ${stats.porEstado.novedad} (${stats.tasaNovedad.toFixed(1)}%)
- Devueltas: ${stats.porEstado.devuelto}

RIESGO:
- Crítico: ${stats.porRiesgo.critico} guías
- Alto: ${stats.porRiesgo.alto} guías
- Medio: ${stats.porRiesgo.medio} guías

GUÍAS CRÍTICAS (requieren atención):
${critical.slice(0, 5).map(g =>
  `- ${g.guia}: ${g.currentStatusRaw} (${g.metrics.diasEnTransito} días, ${g.transportadora})`
).join('\n')}

NOVEDADES ACTIVAS:
${withNovedad.map(g =>
  `- ${g.guia}: ${g.metrics.novedadActual} (${g.ciudadDestino})`
).join('\n')}

TRANSPORTADORAS:
${Object.entries(stats.porTransportadora)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5)
  .map(([t, c]) => `- ${t}: ${c} guías`)
  .join('\n')}
`.trim();
  }

  // ==================== UTILIDADES PRIVADAS ====================

  private mapStatus(rawStatus: string): GuideStatus {
    const lower = rawStatus.toLowerCase();

    if (lower.includes('entreg') || lower.includes('delivered')) return 'entregado';
    if (lower.includes('reparto') || lower.includes('out for delivery')) return 'en_reparto';
    if (lower.includes('oficina') || lower.includes('pickup') || lower.includes('reclamar')) return 'en_oficina';
    if (lower.includes('devuel') || lower.includes('return')) return 'devuelto';
    if (lower.includes('novedad') || lower.includes('issue') || lower.includes('problem')) return 'novedad';
    if (lower.includes('transit') || lower.includes('camino') || lower.includes('ruta')) return 'en_transito';
    if (lower.includes('perdid') || lower.includes('lost')) return 'perdido';

    return 'creado';
  }

  private calculateRiskLevel(status: GuideStatus, diasTransito: number, novedad?: string): RiskLevel {
    // Entregado = sin riesgo
    if (status === 'entregado') return 'bajo';

    // Devuelto o perdido = crítico
    if (status === 'devuelto' || status === 'perdido') return 'critico';

    // Con novedad
    if (novedad || status === 'novedad') {
      if (diasTransito > 5) return 'critico';
      if (diasTransito > 3) return 'alto';
      return 'medio';
    }

    // En oficina (riesgo de devolución)
    if (status === 'en_oficina') {
      if (diasTransito > 5) return 'critico';
      if (diasTransito > 3) return 'alto';
      return 'medio';
    }

    // Por días en tránsito
    if (diasTransito > 7) return 'critico';
    if (diasTransito > 5) return 'alto';
    if (diasTransito > 3) return 'medio';

    return 'bajo';
  }

  private generatePrediction(
    status: GuideStatus,
    diasTransito: number,
    novedad?: string,
    ciudad?: string
  ): GuidePrediction {
    // Ya entregado
    if (status === 'entregado') {
      return {
        entrega: 'entregado',
        diasEstimados: 0,
        probabilidadExito: 100,
        factoresRiesgo: [],
        recomendaciones: [],
      };
    }

    // Ya devuelto
    if (status === 'devuelto') {
      return {
        entrega: 'critico',
        diasEstimados: 0,
        probabilidadExito: 0,
        factoresRiesgo: ['Guía devuelta'],
        recomendaciones: ['Contactar cliente para reenvío', 'Verificar dirección'],
      };
    }

    const factores: string[] = [];
    const recomendaciones: string[] = [];
    let probabilidad = 85;
    let diasEstimados = 2;

    // Ajustar por novedad
    if (novedad) {
      probabilidad -= 25;
      factores.push(`Novedad: ${novedad}`);
      recomendaciones.push('Gestionar novedad con transportadora');
    }

    // Ajustar por días en tránsito
    if (diasTransito > 7) {
      probabilidad -= 30;
      diasEstimados = 5;
      factores.push(`${diasTransito} días en tránsito (muy alto)`);
      recomendaciones.push('Escalar con transportadora urgentemente');
    } else if (diasTransito > 5) {
      probabilidad -= 20;
      diasEstimados = 3;
      factores.push(`${diasTransito} días en tránsito (alto)`);
      recomendaciones.push('Contactar transportadora');
    } else if (diasTransito > 3) {
      probabilidad -= 10;
      diasEstimados = 2;
      factores.push(`${diasTransito} días en tránsito`);
    }

    // Ajustar por estado
    if (status === 'en_oficina') {
      probabilidad -= 15;
      factores.push('En oficina - riesgo de devolución');
      recomendaciones.push('Llamar cliente para coordinar recogida');
    }

    // Ajustar por ciudad (zonas difíciles en Colombia)
    const zonasDificiles = ['leticia', 'mitu', 'inirida', 'puerto carreno', 'san andres'];
    if (ciudad && zonasDificiles.some(z => ciudad.toLowerCase().includes(z))) {
      probabilidad -= 10;
      diasEstimados += 2;
      factores.push('Zona de difícil acceso');
    }

    probabilidad = Math.max(0, Math.min(100, probabilidad));

    let prediccion: DeliveryPrediction;
    if (probabilidad >= 70) prediccion = 'probable';
    else if (probabilidad >= 40) prediccion = 'en_riesgo';
    else prediccion = 'critico';

    return {
      entrega: prediccion,
      diasEstimados,
      probabilidadExito: probabilidad,
      factoresRiesgo: factores,
      recomendaciones,
    };
  }

  private calculateDaysInTransit(history: GuideHistory): number {
    if (history.timeline.length === 0) return 0;
    const firstEvent = history.timeline[0];
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - new Date(firstEvent.timestamp).getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private calculateDaysWithoutMovement(history: GuideHistory): number {
    if (history.timeline.length === 0) return 0;
    const lastEvent = history.timeline[history.timeline.length - 1];
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - new Date(lastEvent.timestamp).getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private persistHistory(history: GuideHistory): void {
    memoryManager.remember('guide_histories', history, {
      type: 'LONG_TERM',
      importance: 70,
      id: `history_${history.guia}`,
    });
  }

  private generateId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // ==================== HANDLERS DE EVENTOS ====================

  private handleGuideLoaded(event: any): void {
    const { guia, source, data } = event.payload;
    if (source === 'carga') {
      this.registerFromCarga(data);
    } else if (source === 'inteligencia') {
      this.registerFromInteligencia(data);
    }
  }

  private handleGuideUpdated(event: any): void {
    const { guia, updates } = event.payload;
    const history = this.histories.get(guia);
    if (history && updates.status) {
      this.addEvent(guia, {
        source: 'manual',
        status: this.mapStatus(updates.status),
        statusRaw: updates.status,
        description: updates.description || 'Estado actualizado',
        novedad: updates.novedad,
      });
    }
  }

  private handleStatusChanged(event: any): void {
    const { guia, newStatus, source } = event.payload;
    const history = this.histories.get(guia);
    if (history) {
      this.addEvent(guia, {
        source: source || 'manual',
        status: this.mapStatus(newStatus),
        statusRaw: newStatus,
        description: `Estado cambiado a: ${newStatus}`,
      });
    }
  }

  /**
   * Sincronizar con datos externos (del store de shipments)
   */
  syncFromShipments(shipments: any[]): void {
    console.log(`📦 [GuideHistory] Sincronizando ${shipments.length} guías...`);

    shipments.forEach(s => {
      const guia = s.id || s.guia;
      if (!guia) return;

      const existing = this.histories.get(guia);

      if (existing) {
        // Actualizar si hay cambio de estado
        if (s.status !== existing.currentStatusRaw || s.estado !== existing.currentStatusRaw) {
          this.addEvent(guia, {
            source: 'inteligencia_logistica',
            status: this.mapStatus(s.status || s.estado || 'en_transito'),
            statusRaw: s.status || s.estado || 'En tránsito',
            description: s.lastEvent || 'Actualización de seguimiento',
            novedad: s.novelty || s.novedad,
          });
        }
      } else {
        // Crear nuevo
        this.registerFromInteligencia({
          guia,
          transportadora: s.carrier || s.transportadora || 'No especificada',
          estado: s.status || s.estado || 'en_transito',
          ciudadDestino: s.destination || s.ciudadDestino,
          telefono: s.phone || s.telefono,
          diasTransito: s.daysInTransit || s.dias || 0,
          novedad: s.novelty || s.novedad,
          ultimoEvento: s.lastEvent || s.ultimoEvento,
        });
      }
    });

    console.log(`📦 [GuideHistory] Sincronización completada. Total: ${this.histories.size} guías`);
  }

  /**
   * Limpiar historial
   */
  clear(): void {
    this.histories.clear();
    console.log('📦 [GuideHistory] Historial limpiado');
  }
}

// Singleton
export const guideHistoryService = new GuideHistoryService();
export default guideHistoryService;
