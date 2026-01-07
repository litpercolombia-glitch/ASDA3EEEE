// services/marketing/oauth/OAuthManager.ts
// Gestor central de OAuth para plataformas publicitarias

import type { AdPlatform, AdAccount, OAuthResult } from '../../../types/marketing.types';

// ============================================
// CONFIGURACIÓN
// ============================================

const OAUTH_CONFIG = {
  meta: {
    appId: import.meta.env.VITE_META_APP_ID || '',
    redirectUri: `${window.location.origin}/api/marketing/oauth/meta/callback`,
    scopes: [
      'ads_management',
      'ads_read',
      'business_management',
      'pages_read_engagement',
      'pages_show_list',
    ],
    authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
    apiVersion: 'v18.0',
  },
  google: {
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
    redirectUri: `${window.location.origin}/api/marketing/oauth/google/callback`,
    scopes: ['https://www.googleapis.com/auth/adwords'],
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
  },
  tiktok: {
    appId: import.meta.env.VITE_TIKTOK_APP_ID || '',
    redirectUri: `${window.location.origin}/api/marketing/oauth/tiktok/callback`,
    authUrl: 'https://business-api.tiktok.com/portal/auth',
  },
};

// ============================================
// TIPOS
// ============================================

interface OAuthState {
  state: string;
  platform: AdPlatform;
  timestamp: number;
}

type OAuthMessageHandler = (event: MessageEvent) => void;

// ============================================
// CLASE PRINCIPAL
// ============================================

class OAuthManagerService {
  private pendingAuth: Map<string, { resolve: (result: OAuthResult) => void; reject: (error: Error) => void }> = new Map();
  private messageHandler: OAuthMessageHandler | null = null;

  constructor() {
    this.setupMessageListener();
  }

  // ==================== LISTENERS ====================

  private setupMessageListener(): void {
    if (typeof window === 'undefined') return;

    this.messageHandler = (event: MessageEvent) => {
      // Verificar origen (solo aceptar de nuestro dominio)
      if (event.origin !== window.location.origin) return;

      const { type, payload, error, state } = event.data || {};

      if (!state || !this.pendingAuth.has(state)) return;

      const pending = this.pendingAuth.get(state)!;
      this.pendingAuth.delete(state);

      if (type?.endsWith('_OAUTH_SUCCESS') && payload) {
        pending.resolve(payload as OAuthResult);
      } else if (type?.endsWith('_OAUTH_ERROR')) {
        pending.reject(new Error(error || 'Error de autenticación'));
      }
    };

    window.addEventListener('message', this.messageHandler);
  }

  // ==================== GENERAR STATE ====================

  private generateState(platform: AdPlatform): string {
    const state = crypto.randomUUID();
    const oauthState: OAuthState = {
      state,
      platform,
      timestamp: Date.now(),
    };
    sessionStorage.setItem(`oauth_state_${state}`, JSON.stringify(oauthState));
    return state;
  }

  private validateState(state: string): OAuthState | null {
    const stored = sessionStorage.getItem(`oauth_state_${state}`);
    if (!stored) return null;

    const oauthState: OAuthState = JSON.parse(stored);

    // Validar que no haya expirado (5 minutos)
    if (Date.now() - oauthState.timestamp > 5 * 60 * 1000) {
      sessionStorage.removeItem(`oauth_state_${state}`);
      return null;
    }

    return oauthState;
  }

  // ==================== META (FACEBOOK) ====================

  async connectMeta(): Promise<OAuthResult> {
    const config = OAUTH_CONFIG.meta;

    if (!config.appId) {
      throw new Error('META_APP_ID no configurado. Agrega VITE_META_APP_ID en las variables de entorno.');
    }

    const state = this.generateState('meta');

    const authUrl = new URL(config.authUrl);
    authUrl.searchParams.set('client_id', config.appId);
    authUrl.searchParams.set('redirect_uri', config.redirectUri);
    authUrl.searchParams.set('scope', config.scopes.join(','));
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('response_type', 'code');

    return this.openAuthPopup(authUrl.toString(), state, 'meta');
  }

  // ==================== GOOGLE ====================

  async connectGoogle(): Promise<OAuthResult> {
    const config = OAUTH_CONFIG.google;

    if (!config.clientId) {
      throw new Error('GOOGLE_CLIENT_ID no configurado. Agrega VITE_GOOGLE_CLIENT_ID en las variables de entorno.');
    }

    const state = this.generateState('google');

    const authUrl = new URL(config.authUrl);
    authUrl.searchParams.set('client_id', config.clientId);
    authUrl.searchParams.set('redirect_uri', config.redirectUri);
    authUrl.searchParams.set('scope', config.scopes.join(' '));
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');

    return this.openAuthPopup(authUrl.toString(), state, 'google');
  }

  // ==================== TIKTOK ====================

  async connectTikTok(): Promise<OAuthResult> {
    const config = OAUTH_CONFIG.tiktok;

    if (!config.appId) {
      throw new Error('TIKTOK_APP_ID no configurado. Agrega VITE_TIKTOK_APP_ID en las variables de entorno.');
    }

    const state = this.generateState('tiktok');

    const authUrl = new URL(config.authUrl);
    authUrl.searchParams.set('app_id', config.appId);
    authUrl.searchParams.set('redirect_uri', config.redirectUri);
    authUrl.searchParams.set('state', state);

    return this.openAuthPopup(authUrl.toString(), state, 'tiktok');
  }

  // ==================== POPUP ====================

  private openAuthPopup(url: string, state: string, platform: AdPlatform): Promise<OAuthResult> {
    return new Promise((resolve, reject) => {
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const popup = window.open(
        url,
        `${platform}_oauth`,
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`
      );

      if (!popup) {
        reject(new Error('No se pudo abrir la ventana de autenticación. Verifica que los popups estén habilitados.'));
        return;
      }

      // Guardar promise para resolver cuando llegue el mensaje
      this.pendingAuth.set(state, { resolve, reject });

      // Verificar si el popup se cerró manualmente
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          if (this.pendingAuth.has(state)) {
            this.pendingAuth.delete(state);
            reject(new Error('Autenticación cancelada por el usuario'));
          }
        }
      }, 1000);

      // Timeout después de 5 minutos
      setTimeout(() => {
        clearInterval(checkClosed);
        if (this.pendingAuth.has(state)) {
          this.pendingAuth.delete(state);
          popup.close();
          reject(new Error('Tiempo de autenticación agotado'));
        }
      }, 5 * 60 * 1000);
    });
  }

  // ==================== CONEXIÓN GENÉRICA ====================

  async connect(platform: AdPlatform): Promise<OAuthResult> {
    switch (platform) {
      case 'meta':
        return this.connectMeta();
      case 'google':
        return this.connectGoogle();
      case 'tiktok':
        return this.connectTikTok();
      default:
        throw new Error(`Plataforma ${platform} no soportada`);
    }
  }

  // ==================== VERIFICAR CONFIGURACIÓN ====================

  isConfigured(platform: AdPlatform): boolean {
    switch (platform) {
      case 'meta':
        return !!OAUTH_CONFIG.meta.appId;
      case 'google':
        return !!OAUTH_CONFIG.google.clientId;
      case 'tiktok':
        return !!OAUTH_CONFIG.tiktok.appId;
      default:
        return false;
    }
  }

  getConfig(platform: AdPlatform) {
    return OAUTH_CONFIG[platform];
  }

  // ==================== CLEANUP ====================

  destroy(): void {
    if (this.messageHandler) {
      window.removeEventListener('message', this.messageHandler);
    }
    this.pendingAuth.clear();
  }
}

// ============================================
// SINGLETON
// ============================================

export const oauthManager = new OAuthManagerService();
export default oauthManager;

// ============================================
// FUNCIONES HELPER PARA CALLBACKS
// ============================================

/**
 * Llamar desde la página de callback para enviar resultado al opener
 */
export function sendOAuthSuccess(platform: AdPlatform, payload: OAuthResult): void {
  if (window.opener) {
    const state = new URLSearchParams(window.location.search).get('state');
    window.opener.postMessage(
      {
        type: `${platform.toUpperCase()}_OAUTH_SUCCESS`,
        payload,
        state,
      },
      window.location.origin
    );
    window.close();
  }
}

/**
 * Llamar desde la página de callback para enviar error al opener
 */
export function sendOAuthError(platform: AdPlatform, error: string): void {
  if (window.opener) {
    const state = new URLSearchParams(window.location.search).get('state');
    window.opener.postMessage(
      {
        type: `${platform.toUpperCase()}_OAUTH_ERROR`,
        error,
        state,
      },
      window.location.origin
    );
    window.close();
  }
}
