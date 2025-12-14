// services/realtimeService.ts
// Sistema de WebSockets para Actualizaciones en Tiempo Real
import { create } from 'zustand';

// ============================================
// TYPES
// ============================================
export type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error' | 'reconnecting';

export interface RealtimeEvent {
  type: 'shipment_update' | 'notification' | 'alert' | 'system' | 'user_activity';
  payload: any;
  timestamp: Date;
  source?: string;
}

export interface SubscriptionChannel {
  name: string;
  subscribers: Set<(event: RealtimeEvent) => void>;
}

// ============================================
// REALTIME STORE
// ============================================
interface RealtimeState {
  status: WebSocketStatus;
  lastPing: Date | null;
  reconnectAttempts: number;
  eventHistory: RealtimeEvent[];
  channels: Map<string, SubscriptionChannel>;

  // Actions
  setStatus: (status: WebSocketStatus) => void;
  addEvent: (event: RealtimeEvent) => void;
  subscribe: (channel: string, callback: (event: RealtimeEvent) => void) => () => void;
  emit: (channel: string, event: RealtimeEvent) => void;
}

export const useRealtimeStore = create<RealtimeState>((set, get) => ({
  status: 'disconnected',
  lastPing: null,
  reconnectAttempts: 0,
  eventHistory: [],
  channels: new Map(),

  setStatus: (status) => set({ status }),

  addEvent: (event) => {
    set((state) => ({
      eventHistory: [event, ...state.eventHistory].slice(0, 100),
    }));
  },

  subscribe: (channel, callback) => {
    const { channels } = get();

    if (!channels.has(channel)) {
      channels.set(channel, { name: channel, subscribers: new Set() });
    }

    channels.get(channel)!.subscribers.add(callback);

    // Return unsubscribe function
    return () => {
      const ch = channels.get(channel);
      if (ch) {
        ch.subscribers.delete(callback);
        if (ch.subscribers.size === 0) {
          channels.delete(channel);
        }
      }
    };
  },

  emit: (channel, event) => {
    const { channels, addEvent } = get();
    const ch = channels.get(channel);

    if (ch) {
      ch.subscribers.forEach((callback) => {
        try {
          callback(event);
        } catch (error) {
          console.error(`[Realtime] Error in subscriber for ${channel}:`, error);
        }
      });
    }

    addEvent(event);
  },
}));

// ============================================
// WEBSOCKET CLIENT (Simulated)
// ============================================
class RealtimeClient {
  private reconnectInterval = 5000;
  private maxReconnectAttempts = 10;
  private pingInterval = 30000;
  private pingTimer: NodeJS.Timeout | null = null;
  private simulationTimer: NodeJS.Timeout | null = null;

  constructor() {
    // Initialize
  }

  connect(): void {
    const { setStatus } = useRealtimeStore.getState();
    setStatus('connecting');

    // Simulate connection
    setTimeout(() => {
      setStatus('connected');
      this.startPing();
      this.startSimulation();
      console.log('[Realtime] Connected to realtime service');
    }, 1000);
  }

  disconnect(): void {
    const { setStatus } = useRealtimeStore.getState();

    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }

    if (this.simulationTimer) {
      clearInterval(this.simulationTimer);
      this.simulationTimer = null;
    }

    setStatus('disconnected');
    console.log('[Realtime] Disconnected from realtime service');
  }

  private startPing(): void {
    this.pingTimer = setInterval(() => {
      useRealtimeStore.setState({ lastPing: new Date() });
    }, this.pingInterval);
  }

  private startSimulation(): void {
    // Simulate real-time events for demo
    this.simulationTimer = setInterval(() => {
      const { emit, status } = useRealtimeStore.getState();

      if (status !== 'connected') return;

      // Random event simulation
      const random = Math.random();

      if (random < 0.2) {
        // Shipment update
        emit('shipments', {
          type: 'shipment_update',
          payload: {
            guideNumber: `TEST${Math.floor(Math.random() * 1000000)}`,
            status: ['DELIVERED', 'IN_TRANSIT', 'PENDING'][Math.floor(Math.random() * 3)],
            city: ['Bogotá', 'Medellín', 'Cali', 'Barranquilla'][Math.floor(Math.random() * 4)],
          },
          timestamp: new Date(),
          source: 'simulation',
        });
      } else if (random < 0.3) {
        // System notification
        emit('notifications', {
          type: 'notification',
          payload: {
            title: 'Actualización del sistema',
            message: 'Nueva versión disponible',
            priority: 'low',
          },
          timestamp: new Date(),
          source: 'system',
        });
      }
    }, 10000); // Every 10 seconds
  }

  send(channel: string, data: any): void {
    const { status, emit } = useRealtimeStore.getState();

    if (status !== 'connected') {
      console.warn('[Realtime] Cannot send - not connected');
      return;
    }

    emit(channel, {
      type: 'user_activity',
      payload: data,
      timestamp: new Date(),
      source: 'user',
    });
  }
}

// Singleton instance
export const realtimeClient = new RealtimeClient();

// ============================================
// HOOKS
// ============================================
import { useEffect, useCallback, useState } from 'react';

export function useRealtime() {
  const { status, lastPing, eventHistory, subscribe, emit } = useRealtimeStore();

  const connect = useCallback(() => {
    realtimeClient.connect();
  }, []);

  const disconnect = useCallback(() => {
    realtimeClient.disconnect();
  }, []);

  const send = useCallback((channel: string, data: any) => {
    realtimeClient.send(channel, data);
  }, []);

  return {
    status,
    lastPing,
    eventHistory,
    connect,
    disconnect,
    subscribe,
    emit,
    send,
    isConnected: status === 'connected',
  };
}

export function useChannel(channel: string, callback: (event: RealtimeEvent) => void) {
  const { subscribe } = useRealtimeStore();

  useEffect(() => {
    const unsubscribe = subscribe(channel, callback);
    return () => unsubscribe();
  }, [channel, callback, subscribe]);
}

export function useShipmentUpdates(onUpdate: (shipment: any) => void) {
  useChannel('shipments', (event) => {
    if (event.type === 'shipment_update') {
      onUpdate(event.payload);
    }
  });
}

// ============================================
// REALTIME STATUS INDICATOR COMPONENT
// ============================================
import React from 'react';
import { Wifi, WifiOff, RefreshCw, AlertTriangle } from 'lucide-react';

export const RealtimeIndicator: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { status, lastPing } = useRealtime();

  const statusConfig = {
    connected: { icon: Wifi, color: 'text-emerald-500', bg: 'bg-emerald-500', label: 'Conectado' },
    connecting: { icon: RefreshCw, color: 'text-blue-500', bg: 'bg-blue-500', label: 'Conectando...' },
    reconnecting: { icon: RefreshCw, color: 'text-amber-500', bg: 'bg-amber-500', label: 'Reconectando...' },
    disconnected: { icon: WifiOff, color: 'text-slate-400', bg: 'bg-slate-400', label: 'Desconectado' },
    error: { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500', label: 'Error' },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        <Icon className={`w-4 h-4 ${config.color} ${status === 'connecting' || status === 'reconnecting' ? 'animate-spin' : ''}`} />
        {status === 'connected' && (
          <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 ${config.bg} rounded-full animate-pulse`} />
        )}
      </div>
      <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
      {lastPing && status === 'connected' && (
        <span className="text-xs text-slate-400">
          (ping: {Math.round((Date.now() - lastPing.getTime()) / 1000)}s)
        </span>
      )}
    </div>
  );
};

export default realtimeClient;
