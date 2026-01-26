/**
 * PWA Service
 *
 * Utilidades para Progressive Web App:
 * - Instalación
 * - Service Worker
 * - Push Notifications
 * - Background Sync
 * - Offline Detection
 */

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

// ============================================
// ESTADO
// ============================================

interface PWAState {
  isInstalled: boolean;
  isInstallable: boolean;
  isOnline: boolean;
  isUpdateAvailable: boolean;
  serviceWorkerRegistration: ServiceWorkerRegistration | null;
  installPrompt: InstallPromptEvent | null;
}

const state: PWAState = {
  isInstalled: false,
  isInstallable: false,
  isOnline: navigator.onLine,
  isUpdateAvailable: false,
  serviceWorkerRegistration: null,
  installPrompt: null,
};

const listeners: Set<(state: PWAState) => void> = new Set();

function notifyListeners() {
  listeners.forEach(listener => listener({ ...state }));
}

// ============================================
// SERVICIO PRINCIPAL
// ============================================

class PWAService {
  /**
   * Inicializa el servicio PWA
   */
  async init(): Promise<void> {
    // Detectar si ya está instalado
    state.isInstalled = this.checkIfInstalled();

    // Registrar Service Worker
    await this.registerServiceWorker();

    // Escuchar eventos de instalación
    this.setupInstallPrompt();

    // Escuchar cambios de conexión
    this.setupOnlineListener();

    // Escuchar actualizaciones
    this.setupUpdateListener();

    notifyListeners();
  }

  /**
   * Verifica si la app está instalada
   */
  private checkIfInstalled(): boolean {
    // Modo standalone (instalada como PWA)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return true;
    }

    // iOS: navigator.standalone
    if ((navigator as any).standalone === true) {
      return true;
    }

    // Referrer de android TWA
    if (document.referrer.includes('android-app://')) {
      return true;
    }

    return false;
  }

  /**
   * Registra el Service Worker
   */
  async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) {
      console.log('[PWA] Service Worker no soportado');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      state.serviceWorkerRegistration = registration;

      console.log('[PWA] Service Worker registrado:', registration.scope);

      // Escuchar actualizaciones
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              state.isUpdateAvailable = true;
              notifyListeners();
            }
          });
        }
      });

      return registration;
    } catch (error) {
      console.error('[PWA] Error registrando Service Worker:', error);
      return null;
    }
  }

  /**
   * Configura el evento de instalación
   */
  private setupInstallPrompt(): void {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      state.installPrompt = e as InstallPromptEvent;
      state.isInstallable = true;
      notifyListeners();
      console.log('[PWA] App instalable');
    });

    window.addEventListener('appinstalled', () => {
      state.isInstalled = true;
      state.isInstallable = false;
      state.installPrompt = null;
      notifyListeners();
      console.log('[PWA] App instalada');
    });
  }

  /**
   * Configura listener de conexión
   */
  private setupOnlineListener(): void {
    window.addEventListener('online', () => {
      state.isOnline = true;
      notifyListeners();
      this.triggerSync();
    });

    window.addEventListener('offline', () => {
      state.isOnline = false;
      notifyListeners();
    });
  }

  /**
   * Configura listener de actualizaciones
   */
  private setupUpdateListener(): void {
    if (state.serviceWorkerRegistration) {
      setInterval(() => {
        state.serviceWorkerRegistration?.update();
      }, 60 * 60 * 1000); // Cada hora
    }
  }

  /**
   * Solicita la instalación de la PWA
   */
  async promptInstall(): Promise<boolean> {
    if (!state.installPrompt) {
      console.log('[PWA] No hay prompt de instalación disponible');
      return false;
    }

    try {
      await state.installPrompt.prompt();
      const result = await state.installPrompt.userChoice;

      if (result.outcome === 'accepted') {
        console.log('[PWA] Usuario aceptó la instalación');
        state.installPrompt = null;
        state.isInstallable = false;
        notifyListeners();
        return true;
      } else {
        console.log('[PWA] Usuario rechazó la instalación');
        return false;
      }
    } catch (error) {
      console.error('[PWA] Error en prompt de instalación:', error);
      return false;
    }
  }

  /**
   * Aplica una actualización pendiente
   */
  applyUpdate(): void {
    if (state.serviceWorkerRegistration?.waiting) {
      state.serviceWorkerRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }

  /**
   * Dispara sincronización en background
   */
  async triggerSync(tag: string = 'sync-data'): Promise<void> {
    if (!state.serviceWorkerRegistration) return;

    try {
      await state.serviceWorkerRegistration.sync.register(tag);
      console.log('[PWA] Sync registrado:', tag);
    } catch (error) {
      console.log('[PWA] Background sync no soportado');
    }
  }

  /**
   * Suscribe a notificaciones push
   */
  async subscribeToPush(vapidPublicKey: string): Promise<PushSubscription | null> {
    if (!state.serviceWorkerRegistration) {
      console.log('[PWA] No hay Service Worker registrado');
      return null;
    }

    try {
      const permission = await Notification.requestPermission();

      if (permission !== 'granted') {
        console.log('[PWA] Permiso de notificaciones denegado');
        return null;
      }

      const subscription = await state.serviceWorkerRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey),
      });

      console.log('[PWA] Suscrito a push:', subscription.endpoint);
      return subscription;
    } catch (error) {
      console.error('[PWA] Error suscribiendo a push:', error);
      return null;
    }
  }

  /**
   * Cancela suscripción a push
   */
  async unsubscribeFromPush(): Promise<boolean> {
    if (!state.serviceWorkerRegistration) return false;

    try {
      const subscription = await state.serviceWorkerRegistration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        console.log('[PWA] Desuscrito de push');
        return true;
      }
      return false;
    } catch (error) {
      console.error('[PWA] Error desuscribiendo de push:', error);
      return false;
    }
  }

  /**
   * Muestra una notificación local
   */
  async showNotification(
    title: string,
    options?: NotificationOptions
  ): Promise<void> {
    if (!('Notification' in window)) {
      console.log('[PWA] Notificaciones no soportadas');
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    if (state.serviceWorkerRegistration) {
      await state.serviceWorkerRegistration.showNotification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        ...options,
      });
    } else {
      new Notification(title, options);
    }
  }

  /**
   * Obtiene el estado actual
   */
  getState(): PWAState {
    return { ...state };
  }

  /**
   * Suscribe a cambios de estado
   */
  subscribe(listener: (state: PWAState) => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  /**
   * Convierte base64 a Uint8Array (para VAPID key)
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }

  /**
   * Cachea URLs específicas
   */
  cacheUrls(urls: string[]): void {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CACHE_URLS',
        urls,
      });
    }
  }

  /**
   * Limpia el caché
   */
  clearCache(): void {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CLEAR_CACHE',
      });
    }
  }

  /**
   * Comparte contenido (Web Share API)
   */
  async share(data: ShareData): Promise<boolean> {
    if (!navigator.share) {
      console.log('[PWA] Web Share API no soportada');
      return false;
    }

    try {
      await navigator.share(data);
      return true;
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('[PWA] Error compartiendo:', error);
      }
      return false;
    }
  }

  /**
   * Obtiene el tipo de conexión
   */
  getConnectionInfo(): { type: string; downlink: number; saveData: boolean } | null {
    const connection = (navigator as any).connection ||
                       (navigator as any).mozConnection ||
                       (navigator as any).webkitConnection;

    if (!connection) return null;

    return {
      type: connection.effectiveType || 'unknown',
      downlink: connection.downlink || 0,
      saveData: connection.saveData || false,
    };
  }

  /**
   * Verifica si hay soporte para características específicas
   */
  checkSupport(): Record<string, boolean> {
    return {
      serviceWorker: 'serviceWorker' in navigator,
      pushManager: 'PushManager' in window,
      notifications: 'Notification' in window,
      backgroundSync: 'SyncManager' in window,
      periodicSync: 'PeriodicSyncManager' in window,
      share: 'share' in navigator,
      clipboard: 'clipboard' in navigator,
      geolocation: 'geolocation' in navigator,
      bluetooth: 'bluetooth' in navigator,
      usb: 'usb' in navigator,
      mediaDevices: 'mediaDevices' in navigator,
      wakeLock: 'wakeLock' in navigator,
      badging: 'setAppBadge' in navigator,
      fileSystem: 'showOpenFilePicker' in window,
      contacts: 'contacts' in navigator,
      persistentStorage: 'storage' in navigator && 'persist' in navigator.storage,
    };
  }

  /**
   * Solicita almacenamiento persistente
   */
  async requestPersistentStorage(): Promise<boolean> {
    if (navigator.storage && navigator.storage.persist) {
      const isPersisted = await navigator.storage.persist();
      console.log('[PWA] Almacenamiento persistente:', isPersisted);
      return isPersisted;
    }
    return false;
  }

  /**
   * Establece badge de la app (número de notificaciones)
   */
  async setBadge(count: number): Promise<void> {
    if ('setAppBadge' in navigator) {
      try {
        if (count === 0) {
          await (navigator as any).clearAppBadge();
        } else {
          await (navigator as any).setAppBadge(count);
        }
      } catch (error) {
        console.error('[PWA] Error estableciendo badge:', error);
      }
    }
  }
}

// ============================================
// SINGLETON
// ============================================

export const pwaService = new PWAService();

// ============================================
// HOOK PARA REACT
// ============================================

import { useState, useEffect } from 'react';

export function usePWA() {
  const [pwaState, setPwaState] = useState<PWAState>(pwaService.getState());

  useEffect(() => {
    // Inicializar si aún no se ha hecho
    pwaService.init();

    // Suscribirse a cambios
    const unsubscribe = pwaService.subscribe(setPwaState);
    return unsubscribe;
  }, []);

  return {
    ...pwaState,
    install: () => pwaService.promptInstall(),
    update: () => pwaService.applyUpdate(),
    share: (data: ShareData) => pwaService.share(data),
    notify: (title: string, options?: NotificationOptions) =>
      pwaService.showNotification(title, options),
    checkSupport: () => pwaService.checkSupport(),
    getConnectionInfo: () => pwaService.getConnectionInfo(),
    setBadge: (count: number) => pwaService.setBadge(count),
  };
}

export default pwaService;
