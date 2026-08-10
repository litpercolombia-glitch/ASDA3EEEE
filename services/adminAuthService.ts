/**
 * adminAuthService
 *
 * Reemplaza los checks de password hardcodeados que existían antes en
 * EnterpriseAdminDashboard.tsx y en AdminPanelV2.tsx (cada uno comparaba
 * contra un string fijo escrito directamente en el código del frontend).
 *
 * Antes: la contraseña vivía en texto plano dentro del bundle de JS que
 * el navegador descarga — cualquiera podía leerla con "Ver código fuente".
 *
 * Ahora: la contraseña real vive solo en la variable de entorno
 * ADMIN_SECRET de Vercel. El navegador nunca la recibe hasta que el
 * usuario la escribe y el servidor la valida en /api/auth/login.
 *
 * El "token" de sesión que se guarda en localStorage es el mismo
 * ADMIN_SECRET — se usa como Bearer token para llamar a /api/admin/*,
 * que ya lo validaban (ver services/auth/AdminAuth.ts). Expira solo a
 * nivel de UI tras SESSION_HOURS; para revocar acceso real, se rota
 * ADMIN_SECRET en Vercel.
 */

const STORAGE_KEY = 'litper_admin_session';

interface AdminSession {
  token: string;
  expiresAt: number;
}

function readSession(): AdminSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AdminSession;
    if (!parsed?.token || !parsed?.expiresAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeSession(session: AdminSession): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export const adminAuthService = {
  /**
   * Intenta autenticar contra el backend. Nunca compara la contraseña
   * en el cliente.
   */
  async login(password: string): Promise<{ ok: true } | { ok: false; error: string }> {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return { ok: false, error: data.error || 'Credenciales inválidas' };
      }

      const data = (await res.json()) as AdminSession;
      writeSession(data);
      return { ok: true };
    } catch {
      return { ok: false, error: 'No se pudo conectar con el servidor. Intenta de nuevo.' };
    }
  },

  logout(): void {
    localStorage.removeItem(STORAGE_KEY);
  },

  /**
   * Chequeo rápido y local (sin red) para decidir si mostrar el login o
   * el contenido mientras se confirma con el servidor.
   */
  hasLocalSession(): boolean {
    const session = readSession();
    return !!session && Date.now() < session.expiresAt;
  },

  /**
   * Confirma con el servidor que la sesión sigue siendo válida
   * (por si ADMIN_SECRET fue rotado desde que se guardó la sesión).
   */
  async verifySession(): Promise<boolean> {
    const session = readSession();
    if (!session) return false;
    if (Date.now() > session.expiresAt) {
      this.logout();
      return false;
    }

    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(session),
      });
      const data = await res.json();
      if (!data.valid) {
        this.logout();
        return false;
      }
      return true;
    } catch {
      // Si no hay red, no cerramos sesión de golpe — dejamos pasar con el
      // chequeo local para no bloquear al usuario por un problema de red.
      return this.hasLocalSession();
    }
  },

  /**
   * Header listo para usar contra /api/admin/* (que ya validan ADMIN_SECRET
   * como Bearer token vía services/auth/AdminAuth.ts).
   */
  getAuthHeader(): Record<string, string> {
    const session = readSession();
    if (!session) return {};
    return { Authorization: `Bearer ${session.token}` };
  },
};
