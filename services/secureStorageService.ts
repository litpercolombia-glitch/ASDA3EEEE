/**
 * Secure Storage Service
 *
 * Almacenamiento encriptado para datos sensibles.
 * Usa AES-GCM para encriptación simétrica.
 */

// Clave derivada del dominio + salt fijo (en producción usar clave del servidor)
const ENCRYPTION_SALT = 'LITPER_PRO_2026_SECURE';

class SecureStorageService {
  private cryptoKey: CryptoKey | null = null;
  private isInitialized = false;

  /**
   * Inicializa la clave de encriptación
   */
  async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Derivar clave del dominio + user agent (única por dispositivo)
      const keyMaterial = await this.getKeyMaterial();

      this.cryptoKey = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: new TextEncoder().encode(ENCRYPTION_SALT),
          iterations: 100000,
          hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );

      this.isInitialized = true;
    } catch (error) {
      console.error('[SecureStorage] Error initializing:', error);
      // Fallback a storage normal si crypto no está disponible
      this.isInitialized = true;
    }
  }

  /**
   * Genera material de clave único por dispositivo
   */
  private async getKeyMaterial(): Promise<CryptoKey> {
    const baseKey = `${window.location.origin}_${navigator.userAgent.slice(0, 50)}`;
    const encoder = new TextEncoder();

    return crypto.subtle.importKey(
      'raw',
      encoder.encode(baseKey),
      'PBKDF2',
      false,
      ['deriveKey']
    );
  }

  /**
   * Encripta y guarda un valor
   */
  async setSecure<T>(key: string, value: T): Promise<void> {
    await this.init();

    const data = JSON.stringify(value);

    if (!this.cryptoKey) {
      // Fallback sin encriptación
      localStorage.setItem(key, data);
      return;
    }

    try {
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encoder = new TextEncoder();

      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        this.cryptoKey,
        encoder.encode(data)
      );

      // Guardar IV + datos encriptados como base64
      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encrypted), iv.length);

      localStorage.setItem(key, this.arrayBufferToBase64(combined));
    } catch (error) {
      console.error('[SecureStorage] Encryption error:', error);
      // Fallback sin encriptación
      localStorage.setItem(key, data);
    }
  }

  /**
   * Obtiene y desencripta un valor
   */
  async getSecure<T>(key: string): Promise<T | null> {
    await this.init();

    const stored = localStorage.getItem(key);
    if (!stored) return null;

    if (!this.cryptoKey) {
      // Fallback: intentar parsear directamente
      try {
        return JSON.parse(stored);
      } catch {
        return null;
      }
    }

    try {
      const combined = this.base64ToArrayBuffer(stored);
      const iv = combined.slice(0, 12);
      const data = combined.slice(12);

      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        this.cryptoKey,
        data
      );

      const decoder = new TextDecoder();
      return JSON.parse(decoder.decode(decrypted));
    } catch (error) {
      // Puede ser dato no encriptado (migración), intentar leer directo
      try {
        return JSON.parse(stored);
      } catch {
        console.error('[SecureStorage] Decryption error:', error);
        return null;
      }
    }
  }

  /**
   * Elimina un valor
   */
  remove(key: string): void {
    localStorage.removeItem(key);
  }

  /**
   * Verifica si un valor existe
   */
  has(key: string): boolean {
    return localStorage.getItem(key) !== null;
  }

  /**
   * Limpia todos los datos seguros
   */
  clear(): void {
    localStorage.clear();
  }

  // Helpers para conversión
  private arrayBufferToBase64(buffer: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < buffer.byteLength; i++) {
      binary += String.fromCharCode(buffer[i]);
    }
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
}

// Singleton
export const secureStorage = new SecureStorageService();

// Hooks para React
export const useSecureStorage = () => {
  return {
    setItem: secureStorage.setSecure.bind(secureStorage),
    getItem: secureStorage.getSecure.bind(secureStorage),
    removeItem: secureStorage.remove.bind(secureStorage),
    clear: secureStorage.clear.bind(secureStorage),
  };
};

export default secureStorage;
