// utils/pwa.ts
// PWA utilities - Service Worker registration and install prompt

// ============================================
// SERVICE WORKER REGISTRATION
// ============================================
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.log('[PWA] Service Workers not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    console.log('[PWA] Service Worker registered:', registration.scope);

    // Check for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New content is available
            console.log('[PWA] New content available');
            dispatchPWAEvent('pwa-update-available', { registration });
          }
        });
      }
    });

    // Handle controller change (new SW activated)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[PWA] Controller changed');
    });

    return registration;
  } catch (error) {
    console.error('[PWA] Service Worker registration failed:', error);
    return null;
  }
}

// ============================================
// INSTALL PROMPT HANDLING
// ============================================
let deferredPrompt: BeforeInstallPromptEvent | null = null;

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function initInstallPrompt(): void {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    console.log('[PWA] Install prompt captured');
    dispatchPWAEvent('pwa-install-available', { platforms: (e as BeforeInstallPromptEvent).platforms });
  });

  window.addEventListener('appinstalled', () => {
    console.log('[PWA] App installed');
    deferredPrompt = null;
    dispatchPWAEvent('pwa-installed', {});
  });
}

export async function promptInstall(): Promise<boolean> {
  if (!deferredPrompt) {
    console.log('[PWA] No install prompt available');
    return false;
  }

  try {
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log('[PWA] Install prompt outcome:', outcome);
    deferredPrompt = null;
    return outcome === 'accepted';
  } catch (error) {
    console.error('[PWA] Install prompt failed:', error);
    return false;
  }
}

export function canInstall(): boolean {
  return deferredPrompt !== null;
}

// ============================================
// PUSH NOTIFICATION HELPERS
// ============================================
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.log('[PWA] Notifications not supported');
    return 'denied';
  }

  const permission = await Notification.requestPermission();
  console.log('[PWA] Notification permission:', permission);
  return permission;
}

export async function subscribeToPush(registration: ServiceWorkerRegistration): Promise<PushSubscription | null> {
  try {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        // This should be your VAPID public key
        'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U'
      ),
    });
    console.log('[PWA] Push subscription:', subscription);
    return subscription;
  } catch (error) {
    console.error('[PWA] Push subscription failed:', error);
    return null;
  }
}

// ============================================
// ONLINE/OFFLINE STATUS
// ============================================
export function initOnlineStatus(
  onOnline?: () => void,
  onOffline?: () => void
): () => void {
  const handleOnline = () => {
    console.log('[PWA] Online');
    dispatchPWAEvent('pwa-online', {});
    onOnline?.();
  };

  const handleOffline = () => {
    console.log('[PWA] Offline');
    dispatchPWAEvent('pwa-offline', {});
    onOffline?.();
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

export function isOnline(): boolean {
  return navigator.onLine;
}

// ============================================
// UPDATE HANDLING
// ============================================
export async function checkForUpdates(registration: ServiceWorkerRegistration): Promise<boolean> {
  try {
    await registration.update();
    return registration.waiting !== null;
  } catch (error) {
    console.error('[PWA] Update check failed:', error);
    return false;
  }
}

export function skipWaiting(registration: ServiceWorkerRegistration): void {
  registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
}

// ============================================
// BACKGROUND SYNC
// ============================================
export async function requestBackgroundSync(tag: string): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('SyncManager' in window)) {
    console.log('[PWA] Background Sync not supported');
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await (registration as any).sync.register(tag);
    console.log('[PWA] Background sync registered:', tag);
    return true;
  } catch (error) {
    console.error('[PWA] Background sync registration failed:', error);
    return false;
  }
}

// ============================================
// HELPERS
// ============================================
function dispatchPWAEvent(name: string, detail: any): void {
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// ============================================
// PWA STATUS
// ============================================
export function getPWADisplayMode(): 'browser' | 'standalone' | 'twa' {
  if (document.referrer.startsWith('android-app://')) {
    return 'twa';
  }
  if (window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone) {
    return 'standalone';
  }
  return 'browser';
}

export function isRunningAsPWA(): boolean {
  return getPWADisplayMode() !== 'browser';
}
