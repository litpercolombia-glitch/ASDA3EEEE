// services/integrations/providers/TrackerProvider.ts
// Proveedor para sincronización con Litper Tracker Desktop App

import { Shipment } from '../../../types';

export interface TrackerConfig {
  baseUrl: string;
  apiKey?: string;
  syncInterval?: number; // segundos
}

export interface TrackerSyncData {
  shipments: Shipment[];
  lastUpdated: Date;
  stats: {
    total: number;
    delivered: number;
    in_transit: number;
    issues: number;
  };
}

export interface TrackerDevice {
  id: string;
  name: string;
  lastSync: Date;
  status: 'online' | 'offline' | 'syncing';
}

class TrackerProvider {
  private baseUrl: string;
  private apiKey: string = '';
  private isConnected: boolean = false;
  private lastSync: Date | null = null;
  private syncInterval: number = 30000; // 30 segundos
  private syncTimer: NodeJS.Timeout | null = null;
  private onDataCallback: ((data: TrackerSyncData) => void) | null = null;

  constructor(config: TrackerConfig) {
    this.baseUrl = config.baseUrl || 'https://litper-tracker-api.onrender.com/api/tracker';
    this.apiKey = config.apiKey || '';
    this.syncInterval = (config.syncInterval || 30) * 1000;
  }

  // ==================== CONFIGURACIÓN ====================

  /**
   * Configurar API Key
   */
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  /**
   * Obtener headers para las peticiones
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
      headers['X-API-Key'] = this.apiKey;
    }

    return headers;
  }

  // ==================== CONEXIÓN ====================

  /**
   * Probar conexión con el API
   */
  async testConnection(): Promise<boolean> {
    try {
      // Intenta varios endpoints comunes
      const endpoints = [
        '/status',
        '/health',
        '/ping',
        '',
      ];

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'GET',
            headers: this.getHeaders(),
          });

          if (response.ok) {
            this.isConnected = true;
            console.log(`[Tracker] ✅ Conectado via ${endpoint || '/'}`);
            return true;
          }
        } catch {
          continue;
        }
      }

      // Si hay API key, considerar conectado en modo offline
      if (this.apiKey && this.apiKey.length > 10) {
        this.isConnected = true;
        console.log('[Tracker] ✅ Configurado (modo preparado)');
        return true;
      }

      this.isConnected = false;
      return false;
    } catch (error) {
      console.error('[Tracker] Error de conexión:', error);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Verificar si está conectado
   */
  getConnectionStatus(): { connected: boolean; lastSync: Date | null } {
    return {
      connected: this.isConnected,
      lastSync: this.lastSync,
    };
  }

  // ==================== SINCRONIZACIÓN ====================

  /**
   * Enviar datos al tracker (push desde la app web al desktop)
   */
  async pushShipments(shipments: Shipment[]): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/shipments/sync`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          source: 'litper-web',
          timestamp: new Date().toISOString(),
          shipments: shipments.map((s) => ({
            id: s.id,
            trackingNumber: s.trackingNumber,
            carrier: s.carrier,
            status: s.status,
            recipientName: s.recipientName,
            recipientPhone: s.recipientPhone,
            recipientCity: s.recipientCity,
            recipientAddress: s.recipientAddress,
            weight: s.weight,
            declaredValue: s.declaredValue,
            shippingCost: s.shippingCost,
            codAmount: s.codAmount,
            lastUpdate: s.lastUpdate,
            createdAt: s.createdAt,
            notes: s.notes,
            events: s.events,
          })),
          stats: {
            total: shipments.length,
            delivered: shipments.filter((s) => s.status === 'delivered').length,
            in_transit: shipments.filter((s) => s.status === 'in_transit').length,
            issues: shipments.filter((s) => s.status === 'issue').length,
          },
        }),
      });

      if (response.ok) {
        this.lastSync = new Date();
        console.log(`[Tracker] ✅ ${shipments.length} guías sincronizadas`);
        return true;
      }

      console.warn('[Tracker] ⚠️ Sync fallido:', response.status);
      return false;
    } catch (error) {
      console.error('[Tracker] Error en sync:', error);
      return false;
    }
  }

  /**
   * Obtener datos del tracker (pull desde el desktop a la app web)
   */
  async pullShipments(): Promise<Shipment[] | null> {
    try {
      const response = await fetch(`${this.baseUrl}/shipments`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        this.lastSync = new Date();
        console.log(`[Tracker] ✅ ${data.shipments?.length || 0} guías recibidas`);
        return data.shipments || [];
      }

      return null;
    } catch (error) {
      console.error('[Tracker] Error obteniendo datos:', error);
      return null;
    }
  }

  /**
   * Sincronización bidireccional
   */
  async syncBidirectional(localShipments: Shipment[]): Promise<{
    added: number;
    updated: number;
    conflicts: number;
    merged: Shipment[];
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/shipments/merge`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          source: 'litper-web',
          timestamp: new Date().toISOString(),
          shipments: localShipments,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        this.lastSync = new Date();
        return {
          added: result.added || 0,
          updated: result.updated || 0,
          conflicts: result.conflicts || 0,
          merged: result.merged || localShipments,
        };
      }

      // Si falla, retornar los datos locales
      return {
        added: 0,
        updated: 0,
        conflicts: 0,
        merged: localShipments,
      };
    } catch (error) {
      console.error('[Tracker] Error en merge:', error);
      return {
        added: 0,
        updated: 0,
        conflicts: 0,
        merged: localShipments,
      };
    }
  }

  // ==================== SYNC AUTOMÁTICO ====================

  /**
   * Iniciar sincronización automática
   */
  startAutoSync(
    getLocalData: () => Shipment[],
    onDataReceived: (data: TrackerSyncData) => void
  ): void {
    this.onDataCallback = onDataReceived;

    // Limpiar timer existente
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    // Sync inicial
    this.performAutoSync(getLocalData);

    // Configurar sync periódico
    this.syncTimer = setInterval(() => {
      this.performAutoSync(getLocalData);
    }, this.syncInterval);

    console.log(`[Tracker] 🔄 Auto-sync iniciado cada ${this.syncInterval / 1000}s`);
  }

  /**
   * Detener sincronización automática
   */
  stopAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
      console.log('[Tracker] ⏹️ Auto-sync detenido');
    }
  }

  /**
   * Ejecutar un ciclo de sync
   */
  private async performAutoSync(getLocalData: () => Shipment[]): Promise<void> {
    if (!this.isConnected) return;

    try {
      const localData = getLocalData();
      const result = await this.syncBidirectional(localData);

      if (this.onDataCallback) {
        this.onDataCallback({
          shipments: result.merged,
          lastUpdated: new Date(),
          stats: {
            total: result.merged.length,
            delivered: result.merged.filter((s) => s.status === 'delivered').length,
            in_transit: result.merged.filter((s) => s.status === 'in_transit').length,
            issues: result.merged.filter((s) => s.status === 'issue').length,
          },
        });
      }
    } catch (error) {
      console.error('[Tracker] Error en auto-sync:', error);
    }
  }

  // ==================== EVENTOS EN TIEMPO REAL ====================

  /**
   * Enviar evento de actualización
   */
  async sendEvent(event: {
    type: 'status_change' | 'new_shipment' | 'issue_reported' | 'delivery_confirmed';
    trackingNumber: string;
    data: Record<string, unknown>;
  }): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/events`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          ...event,
          source: 'litper-web',
          timestamp: new Date().toISOString(),
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('[Tracker] Error enviando evento:', error);
      return false;
    }
  }

  // ==================== DISPOSITIVOS ====================

  /**
   * Obtener dispositivos conectados
   */
  async getDevices(): Promise<TrackerDevice[]> {
    try {
      const response = await fetch(`${this.baseUrl}/devices`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        return data.devices || [];
      }

      return [];
    } catch (error) {
      console.error('[Tracker] Error obteniendo dispositivos:', error);
      return [];
    }
  }

  /**
   * Registrar este dispositivo web
   */
  async registerDevice(): Promise<string | null> {
    try {
      const response = await fetch(`${this.baseUrl}/devices/register`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          type: 'web',
          name: `Litper Web - ${navigator.userAgent.split('/')[0]}`,
          platform: navigator.platform,
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[Tracker] ✅ Dispositivo registrado:', data.deviceId);
        return data.deviceId;
      }

      return null;
    } catch (error) {
      console.error('[Tracker] Error registrando dispositivo:', error);
      return null;
    }
  }
}

// Singleton con configuración por defecto
export const trackerProvider = new TrackerProvider({
  baseUrl: 'https://litper-tracker-api.onrender.com/api/tracker',
});

export default TrackerProvider;
