// services/pushNotificationService.ts
// Servicio para gestionar notificaciones push

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

// Convertir base64 a Uint8Array para VAPID key
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

// Verificar si el navegador soporta push notifications
export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

// Verificar si ya tiene permiso
export function getNotificationPermission(): NotificationPermission {
  if (!isPushSupported()) return 'denied';
  return Notification.permission;
}

// Solicitar permiso para notificaciones
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isPushSupported()) {
    console.warn('Push notifications no soportadas');
    return 'denied';
  }

  const permission = await Notification.requestPermission();
  return permission;
}

// Obtener VAPID public key del servidor
async function getVapidPublicKey(): Promise<string | null> {
  try {
    const response = await fetch(`${API_URL}/api/push/vapid-key`);
    if (!response.ok) return null;
    const data = await response.json();
    return data.vapid_public_key;
  } catch (error) {
    console.error('Error obteniendo VAPID key:', error);
    return null;
  }
}

// Suscribirse a push notifications
export async function subscribeToPush(): Promise<boolean> {
  if (!isPushSupported()) {
    console.warn('Push notifications no soportadas');
    return false;
  }

  const permission = await requestNotificationPermission();
  if (permission !== 'granted') {
    console.warn('Permiso de notificaciones denegado');
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    // Verificar si ya existe una suscripción
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      // Obtener VAPID key del servidor
      const vapidPublicKey = await getVapidPublicKey();

      if (!vapidPublicKey) {
        console.error('No se pudo obtener VAPID key');
        return false;
      }

      // Crear nueva suscripción
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
    }

    // Enviar suscripción al servidor
    const subscriptionData: PushSubscriptionData = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))),
        auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!))),
      },
    };

    const response = await fetch(`${API_URL}/api/push/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscriptionData),
    });

    if (!response.ok) {
      throw new Error('Error registrando suscripción en servidor');
    }

    console.log('Suscripción push exitosa');
    return true;
  } catch (error) {
    console.error('Error suscribiendo a push:', error);
    return false;
  }
}

// Cancelar suscripción
export async function unsubscribeFromPush(): Promise<boolean> {
  if (!isPushSupported()) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      // Notificar al servidor
      await fetch(`${API_URL}/api/push/unsubscribe`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });

      // Cancelar suscripción local
      await subscription.unsubscribe();
    }

    return true;
  } catch (error) {
    console.error('Error cancelando suscripción:', error);
    return false;
  }
}

// Verificar si está suscrito
export async function isSubscribedToPush(): Promise<boolean> {
  if (!isPushSupported()) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return subscription !== null;
  } catch {
    return false;
  }
}

// Mostrar notificación local (sin servidor)
export function showLocalNotification(
  title: string,
  options?: NotificationOptions
): void {
  if (!isPushSupported() || Notification.permission !== 'granted') return;

  const defaultOptions: NotificationOptions = {
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    tag: 'litper-notification',
    renotify: true,
    ...options,
  };

  navigator.serviceWorker.ready.then((registration) => {
    registration.showNotification(title, defaultOptions);
  });
}

// Notificar cambio de estado de guía
export function notifyShipmentStatusChange(
  guia: string,
  nuevoEstado: string,
  destinatario?: string
): void {
  const statusMessages: Record<string, string> = {
    delivered: 'Entregado exitosamente',
    in_transit: 'En camino',
    issue: 'Tiene una novedad',
    in_office: 'Disponible en oficina',
    returned: 'Devuelto al remitente',
  };

  const message = statusMessages[nuevoEstado] || nuevoEstado;

  showLocalNotification(`Guía ${guia.substring(0, 10)}...`, {
    body: `${message}${destinatario ? ` - ${destinatario}` : ''}`,
    data: { guia, estado: nuevoEstado },
    actions: [
      { action: 'view', title: 'Ver detalles' },
      { action: 'dismiss', title: 'Cerrar' },
    ],
  });
}

// Notificar alerta crítica
export function notifyCriticalAlert(
  mensaje: string,
  cantidad: number
): void {
  showLocalNotification('Alerta Crítica - LITPER PRO', {
    body: `${cantidad} guías requieren atención: ${mensaje}`,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    requireInteraction: true,
    tag: 'critical-alert',
    vibrate: [300, 100, 300, 100, 300],
  });
}
