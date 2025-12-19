// services/brain/core/ContextManager.ts
// Gestor de contexto - Sabe quién eres y qué estás haciendo

import { BrainContext, UserContext, SessionContext, OperationalContext } from '../types/brain.types';
import { eventBus } from './EventBus';

const CONTEXT_STORAGE_KEY = 'litper_brain_context';

class ContextManagerService {
  private context: BrainContext;
  private contextListeners: Set<(context: BrainContext) => void> = new Set();

  constructor() {
    this.context = this.loadContext();
    this.startSessionTracking();
  }

  /**
   * Cargar contexto desde localStorage
   */
  private loadContext(): BrainContext {
    try {
      const stored = localStorage.getItem(CONTEXT_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convertir fechas
        if (parsed.session) {
          parsed.session.startedAt = new Date(parsed.session.startedAt);
          parsed.session.lastActivity = new Date(parsed.session.lastActivity);
        }
        return parsed;
      }
    } catch (error) {
      console.error('[Context] Error cargando contexto:', error);
    }

    // Contexto por defecto
    return this.createDefaultContext();
  }

  /**
   * Crear contexto por defecto
   */
  private createDefaultContext(): BrainContext {
    return {
      user: {},
      session: {
        sessionId: this.generateSessionId(),
        startedAt: new Date(),
        lastActivity: new Date(),
      },
      operational: {
        totalShipments: 0,
        pendingAlerts: 0,
        criticalIssues: 0,
        todayDeliveries: 0,
        performanceScore: 0,
      },
      customData: {},
    };
  }

  /**
   * Guardar contexto en localStorage
   */
  private saveContext(): void {
    try {
      localStorage.setItem(CONTEXT_STORAGE_KEY, JSON.stringify(this.context));
    } catch (error) {
      console.error('[Context] Error guardando contexto:', error);
    }
  }

  /**
   * Notificar a los listeners de cambios
   */
  private notifyListeners(): void {
    this.contextListeners.forEach(listener => {
      try {
        listener(this.context);
      } catch (error) {
        console.error('[Context] Error en listener:', error);
      }
    });

    eventBus.emit('context.changed', { context: this.context });
  }

  // ==================== CONTEXTO DE USUARIO ====================

  /**
   * Establecer usuario
   */
  setUser(user: Partial<UserContext>): void {
    this.context.user = {
      ...this.context.user,
      ...user,
    };
    this.saveContext();
    this.notifyListeners();
  }

  /**
   * Obtener usuario
   */
  getUser(): UserContext {
    return { ...this.context.user };
  }

  /**
   * Limpiar usuario (logout)
   */
  clearUser(): void {
    this.context.user = {};
    this.saveContext();
    this.notifyListeners();
  }

  // ==================== CONTEXTO DE SESIÓN ====================

  /**
   * Obtener sesión actual
   */
  getSession(): SessionContext {
    return { ...this.context.session };
  }

  /**
   * Actualizar actividad de sesión
   */
  updateActivity(): void {
    this.context.session.lastActivity = new Date();
    this.saveContext();
  }

  /**
   * Establecer tab activo
   */
  setActiveTab(tab: string): void {
    this.context.session.activeTab = tab;
    this.context.session.lastActivity = new Date();
    this.saveContext();
    this.notifyListeners();
  }

  /**
   * Establecer guías seleccionadas
   */
  setSelectedShipments(shipmentIds: string[]): void {
    this.context.session.selectedShipments = shipmentIds;
    this.saveContext();
  }

  /**
   * Nueva sesión
   */
  newSession(): void {
    this.context.session = {
      sessionId: this.generateSessionId(),
      startedAt: new Date(),
      lastActivity: new Date(),
    };
    this.saveContext();
    this.notifyListeners();
  }

  // ==================== CONTEXTO OPERACIONAL ====================

  /**
   * Obtener contexto operacional
   */
  getOperational(): OperationalContext {
    return { ...this.context.operational };
  }

  /**
   * Actualizar contexto operacional
   */
  updateOperational(data: Partial<OperationalContext>): void {
    this.context.operational = {
      ...this.context.operational,
      ...data,
    };
    this.saveContext();
    this.notifyListeners();
  }

  /**
   * Calcular y actualizar métricas operacionales desde shipments
   */
  updateFromShipments(shipments: Array<{
    status: string;
    hasIssue?: boolean;
    isDelayed?: boolean;
    deliveredAt?: Date;
  }>): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const operational: OperationalContext = {
      totalShipments: shipments.length,
      pendingAlerts: shipments.filter(s => s.hasIssue || s.isDelayed).length,
      criticalIssues: shipments.filter(s => s.status === 'issue').length,
      todayDeliveries: shipments.filter(s => {
        if (!s.deliveredAt) return false;
        const deliveryDate = new Date(s.deliveredAt);
        deliveryDate.setHours(0, 0, 0, 0);
        return deliveryDate.getTime() === today.getTime();
      }).length,
      performanceScore: this.calculatePerformanceScore(shipments),
    };

    this.updateOperational(operational);
  }

  /**
   * Calcular score de performance
   */
  private calculatePerformanceScore(shipments: Array<{
    status: string;
    hasIssue?: boolean;
    isDelayed?: boolean;
  }>): number {
    if (shipments.length === 0) return 0;

    const delivered = shipments.filter(s => s.status === 'delivered').length;
    const issues = shipments.filter(s => s.hasIssue).length;
    const delayed = shipments.filter(s => s.isDelayed).length;

    const deliveryRate = (delivered / shipments.length) * 100;
    const issueRate = (issues / shipments.length) * 100;
    const delayRate = (delayed / shipments.length) * 100;

    // Score: base de entrega - penalizaciones por problemas
    const score = deliveryRate - (issueRate * 0.5) - (delayRate * 0.3);
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  // ==================== DATOS PERSONALIZADOS ====================

  /**
   * Establecer dato personalizado
   */
  setCustomData(key: string, value: unknown): void {
    this.context.customData[key] = value;
    this.saveContext();
  }

  /**
   * Obtener dato personalizado
   */
  getCustomData<T>(key: string): T | undefined {
    return this.context.customData[key] as T | undefined;
  }

  /**
   * Eliminar dato personalizado
   */
  removeCustomData(key: string): void {
    delete this.context.customData[key];
    this.saveContext();
  }

  // ==================== CONTEXTO COMPLETO ====================

  /**
   * Obtener contexto completo
   */
  getFullContext(): BrainContext {
    return JSON.parse(JSON.stringify(this.context));
  }

  /**
   * Suscribirse a cambios de contexto
   */
  subscribe(callback: (context: BrainContext) => void): () => void {
    this.contextListeners.add(callback);
    return () => this.contextListeners.delete(callback);
  }

  /**
   * Resetear contexto
   */
  reset(): void {
    this.context = this.createDefaultContext();
    this.saveContext();
    this.notifyListeners();
  }

  // ==================== UTILIDADES ====================

  /**
   * Generar ID de sesión
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Tracking de sesión (actualizar actividad periódicamente)
   */
  private startSessionTracking(): void {
    // Actualizar cada minuto si hay actividad
    setInterval(() => {
      const lastActivity = this.context.session.lastActivity;
      const now = new Date();
      const inactiveMinutes = (now.getTime() - lastActivity.getTime()) / 1000 / 60;

      // Si hay más de 30 min de inactividad, nueva sesión
      if (inactiveMinutes > 30) {
        this.newSession();
      }
    }, 60000);
  }

  /**
   * Obtener tiempo de sesión actual
   */
  getSessionDuration(): number {
    const start = this.context.session.startedAt;
    return Math.round((Date.now() - start.getTime()) / 1000 / 60); // minutos
  }

  /**
   * Verificar si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    return !!this.context.user.userId;
  }

  /**
   * Obtener resumen del contexto para logs/debug
   */
  getSummary(): string {
    const { user, session, operational } = this.context;
    return `User: ${user.userName || 'Anonymous'} | ` +
      `Session: ${this.getSessionDuration()}min | ` +
      `Tab: ${session.activeTab || 'none'} | ` +
      `Shipments: ${operational.totalShipments} | ` +
      `Alerts: ${operational.pendingAlerts}`;
  }
}

// Singleton
export const contextManager = new ContextManagerService();
export default contextManager;
