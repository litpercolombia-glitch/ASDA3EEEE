/**
 * LITPER DESK — Electron Preload
 *
 * Hardenizado segun PLAN_AVANZADO_LITPER_DESK.md §2 (control #7):
 * - Whitelist explicita de canales invocables.
 * - Whitelist explicita de eventos suscribibles.
 * - El renderer NO ve `process` ni `ipcRenderer` directamente.
 * - Cada `on(...)` retorna una funcion para hacer unsubscribe.
 */
const { contextBridge, ipcRenderer } = require('electron');

// Canales que el renderer puede invocar via window.litperDesk.invoke().
const ALLOWED_INVOKE = new Set([
  'window:minimize',
  'window:hide',
  'window:set-opacity',
  'window:set-always-on-top',
  'window:get-state',
  'shell:open-external',
  'app:get-platform',
]);

// Eventos que el main puede emitir hacia el renderer.
const ALLOWED_EVENTS = new Set([
  'window:resize',
  'shortcut',
  'always-on-top-changed',
]);

contextBridge.exposeInMainWorld('litperDesk', {
  /**
   * Invoca un canal IPC con request/response.
   * Rechaza si el canal no esta en la whitelist.
   */
  invoke(channel, payload) {
    if (!ALLOWED_INVOKE.has(channel)) {
      console.warn('[preload] blocked invoke', channel);
      return Promise.reject(new Error('channel_not_allowed'));
    }
    return ipcRenderer.invoke(channel, payload);
  },

  /**
   * Suscribe a un evento del main process.
   * Devuelve un unsubscribe que el renderer puede llamar al desmontarse.
   */
  on(event, callback) {
    if (!ALLOWED_EVENTS.has(event)) {
      console.warn('[preload] blocked subscribe', event);
      return () => {};
    }
    const handler = (_e, ...args) => callback(...args);
    ipcRenderer.on(event, handler);
    return () => ipcRenderer.off(event, handler);
  },

  /** Indicador de que estamos en Electron (para feature-detect en el renderer). */
  isElectron: true,
});
