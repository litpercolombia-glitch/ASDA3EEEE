// services/marketing/OAuthManager.ts
// Gestor OAuth para plataformas publicitarias

import type { AdPlatform, OAuthResult } from '../../types/marketing.types';

const OAUTH_CONFIG = {
  meta: {
    appId: import.meta.env.VITE_META_APP_ID || '',
    redirectUri: `${typeof window !== 'undefined' ? window.location.origin : ''}/api/marketing/oauth/meta/callback`,
    scopes: ['ads_management', 'ads_read', 'business_management'],
    authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
  },
  google: {
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
    redirectUri: `${typeof window !== 'undefined' ? window.location.origin : ''}/api/marketing/oauth/google/callback`,
    scopes: ['https://www.googleapis.com/auth/adwords'],
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  },
  tiktok: {
    appId: import.meta.env.VITE_TIKTOK_APP_ID || '',
    redirectUri: `${typeof window !== 'undefined' ? window.location.origin : ''}/api/marketing/oauth/tiktok/callback`,
    authUrl: 'https://business-api.tiktok.com/portal/auth',
  },
};

class OAuthManagerService {
  private pendingAuth: Map<string, { resolve: (result: OAuthResult) => void; reject: (error: Error) => void }> = new Map();

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('message', this.handleMessage.bind(this));
    }
  }

  private handleMessage(event: MessageEvent) {
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
  }

  private generateState(platform: AdPlatform): string {
    const state = crypto.randomUUID();
    sessionStorage.setItem(`oauth_state_${state}`, JSON.stringify({ platform, timestamp: Date.now() }));
    return state;
  }

  async connect(platform: AdPlatform): Promise<OAuthResult> {
    const config = OAUTH_CONFIG[platform];
    const state = this.generateState(platform);

    let authUrl: string;
    if (platform === 'meta') {
      authUrl = `${config.authUrl}?client_id=${config.appId}&redirect_uri=${encodeURIComponent(config.redirectUri)}&scope=${config.scopes.join(',')}&state=${state}&response_type=code`;
    } else if (platform === 'google') {
      authUrl = `${config.authUrl}?client_id=${config.clientId}&redirect_uri=${encodeURIComponent(config.redirectUri)}&scope=${encodeURIComponent(config.scopes.join(' '))}&state=${state}&response_type=code&access_type=offline&prompt=consent`;
    } else {
      authUrl = `${config.authUrl}?app_id=${config.appId}&redirect_uri=${encodeURIComponent(config.redirectUri)}&state=${state}`;
    }

    return this.openAuthPopup(authUrl, state, platform);
  }

  private openAuthPopup(url: string, state: string, platform: AdPlatform): Promise<OAuthResult> {
    return new Promise((resolve, reject) => {
      const width = 600, height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const popup = window.open(url, `${platform}_oauth`, `width=${width},height=${height},left=${left},top=${top}`);

      if (!popup) {
        reject(new Error('No se pudo abrir la ventana de autenticación'));
        return;
      }

      this.pendingAuth.set(state, { resolve, reject });

      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          if (this.pendingAuth.has(state)) {
            this.pendingAuth.delete(state);
            reject(new Error('Autenticación cancelada'));
          }
        }
      }, 1000);

      setTimeout(() => {
        clearInterval(checkClosed);
        if (this.pendingAuth.has(state)) {
          this.pendingAuth.delete(state);
          popup.close();
          reject(new Error('Tiempo agotado'));
        }
      }, 5 * 60 * 1000);
    });
  }

  isConfigured(platform: AdPlatform): boolean {
    switch (platform) {
      case 'meta': return !!OAUTH_CONFIG.meta.appId;
      case 'google': return !!OAUTH_CONFIG.google.clientId;
      case 'tiktok': return !!OAUTH_CONFIG.tiktok.appId;
      default: return false;
    }
  }
}

export const oauthManager = new OAuthManagerService();
export default oauthManager;
