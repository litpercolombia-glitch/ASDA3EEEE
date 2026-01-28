/**
 * Encryption Service
 *
 * Servicio de encriptación AES-256-GCM para datos sensibles.
 * Incluye key derivation segura (PBKDF2) y migración automática.
 */

import {
  EncryptedData,
  SecureStorageConfig,
  StoredCredential,
} from '../../types/security.types';

// ============================================
// CONFIGURACIÓN
// ============================================

const DEFAULT_CONFIG: SecureStorageConfig = {
  keyDerivation: 'pbkdf2',
  iterations: 100000,
  saltLength: 16,
};

const STORAGE_PREFIX = 'litper_secure_';
const SCHEMA_VERSION = 1;

// ============================================
// ENCRYPTION SERVICE CLASS
// ============================================

export class EncryptionService {
  private config: SecureStorageConfig;
  private derivedKey: CryptoKey | null = null;
  private keyPromise: Promise<CryptoKey> | null = null;
  private salt: Uint8Array | null = null;

  constructor(config?: Partial<SecureStorageConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ============================================
  // KEY DERIVATION
  // ============================================

  /**
   * Deriva una clave de encriptación desde una contraseña/seed
   */
  private async deriveKey(password: string, salt?: Uint8Array): Promise<CryptoKey> {
    // Use existing salt or generate new one
    if (!salt) {
      salt = this.salt || crypto.getRandomValues(new Uint8Array(this.config.saltLength));
      this.salt = salt;
    }

    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);

    // Import password as key material
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    // Derive AES-256 key using PBKDF2
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: this.config.iterations,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    return key;
  }

  /**
   * Inicializa el servicio con una clave maestra
   */
  async initialize(masterPassword?: string): Promise<void> {
    // Use device fingerprint + app secret as default master password
    const password = masterPassword || await this.generateDeviceKey();

    // Check if we have stored salt
    const storedSalt = localStorage.getItem(`${STORAGE_PREFIX}salt`);
    if (storedSalt) {
      this.salt = this.base64ToUint8Array(storedSalt);
    }

    this.keyPromise = this.deriveKey(password, this.salt || undefined);
    this.derivedKey = await this.keyPromise;

    // Store salt for future sessions
    if (this.salt && !storedSalt) {
      localStorage.setItem(`${STORAGE_PREFIX}salt`, this.uint8ArrayToBase64(this.salt));
    }
  }

  /**
   * Genera una clave única del dispositivo
   */
  private async generateDeviceKey(): Promise<string> {
    const components = [
      navigator.userAgent,
      navigator.language,
      new Date().getTimezoneOffset().toString(),
      screen.width.toString(),
      screen.height.toString(),
      navigator.hardwareConcurrency?.toString() || 'unknown',
    ];

    const data = components.join('|');
    const encoder = new TextEncoder();
    const buffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Asegura que la clave esté inicializada
   */
  private async ensureKey(): Promise<CryptoKey> {
    if (this.derivedKey) return this.derivedKey;
    if (this.keyPromise) return this.keyPromise;
    await this.initialize();
    return this.derivedKey!;
  }

  // ============================================
  // ENCRYPTION / DECRYPTION
  // ============================================

  /**
   * Encripta datos usando AES-256-GCM
   */
  async encrypt(data: string): Promise<EncryptedData> {
    const key = await this.ensureKey();

    // Generate random IV (12 bytes for GCM)
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Encode data
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);

    // Encrypt
    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      dataBuffer
    );

    // Extract ciphertext and auth tag (GCM appends 16-byte tag)
    const encryptedArray = new Uint8Array(encryptedBuffer);
    const ciphertext = encryptedArray.slice(0, -16);
    const tag = encryptedArray.slice(-16);

    return {
      iv: this.uint8ArrayToBase64(iv),
      data: this.uint8ArrayToBase64(ciphertext),
      tag: this.uint8ArrayToBase64(tag),
      algorithm: 'AES-256-GCM',
      version: SCHEMA_VERSION,
    };
  }

  /**
   * Desencripta datos
   */
  async decrypt(encryptedData: EncryptedData): Promise<string> {
    const key = await this.ensureKey();

    // Decode components
    const iv = this.base64ToUint8Array(encryptedData.iv);
    const ciphertext = this.base64ToUint8Array(encryptedData.data);
    const tag = this.base64ToUint8Array(encryptedData.tag);

    // Reconstruct encrypted buffer (ciphertext + tag)
    const encryptedBuffer = new Uint8Array(ciphertext.length + tag.length);
    encryptedBuffer.set(ciphertext);
    encryptedBuffer.set(tag, ciphertext.length);

    // Decrypt
    try {
      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        encryptedBuffer
      );

      const decoder = new TextDecoder();
      return decoder.decode(decryptedBuffer);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data. Key may have changed.');
    }
  }

  // ============================================
  // SECURE STORAGE
  // ============================================

  /**
   * Almacena un valor de forma segura
   */
  async setSecure(key: string, value: any): Promise<void> {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    const encrypted = await this.encrypt(stringValue);

    const credential: StoredCredential = {
      key,
      value: encrypted,
      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    };

    localStorage.setItem(
      `${STORAGE_PREFIX}${key}`,
      JSON.stringify(credential)
    );
  }

  /**
   * Recupera un valor almacenado de forma segura
   */
  async getSecure<T = string>(key: string): Promise<T | null> {
    const stored = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    if (!stored) return null;

    try {
      const credential: StoredCredential = JSON.parse(stored);

      // Check expiry if set
      if (credential.metadata.expiresAt && credential.metadata.expiresAt < Date.now()) {
        this.removeSecure(key);
        return null;
      }

      const decrypted = await this.decrypt(credential.value);

      // Try to parse as JSON, otherwise return as string
      try {
        return JSON.parse(decrypted) as T;
      } catch {
        return decrypted as unknown as T;
      }
    } catch (error) {
      console.error('Failed to retrieve secure value:', error);
      return null;
    }
  }

  /**
   * Elimina un valor almacenado
   */
  removeSecure(key: string): void {
    localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
  }

  /**
   * Almacena con tiempo de expiración
   */
  async setSecureWithExpiry(key: string, value: any, expiryMs: number): Promise<void> {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    const encrypted = await this.encrypt(stringValue);

    const credential: StoredCredential = {
      key,
      value: encrypted,
      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        expiresAt: Date.now() + expiryMs,
      },
    };

    localStorage.setItem(
      `${STORAGE_PREFIX}${key}`,
      JSON.stringify(credential)
    );
  }

  // ============================================
  // MIGRATION
  // ============================================

  /**
   * Migra datos no encriptados existentes al almacenamiento seguro
   */
  async migrateExistingData(keysToMigrate: string[]): Promise<{
    migrated: string[];
    failed: string[];
    skipped: string[];
  }> {
    const result = {
      migrated: [] as string[],
      failed: [] as string[],
      skipped: [] as string[],
    };

    for (const key of keysToMigrate) {
      try {
        // Skip if already secure
        const secureKey = `${STORAGE_PREFIX}${key}`;
        if (localStorage.getItem(secureKey)) {
          result.skipped.push(key);
          continue;
        }

        // Get existing value
        const existingValue = localStorage.getItem(key);
        if (!existingValue) {
          result.skipped.push(key);
          continue;
        }

        // Encrypt and store securely
        await this.setSecure(key, existingValue);

        // Remove old unencrypted value
        localStorage.removeItem(key);

        result.migrated.push(key);
      } catch (error) {
        console.error(`Failed to migrate ${key}:`, error);
        result.failed.push(key);
      }
    }

    return result;
  }

  /**
   * Migra tokens de autenticación al almacenamiento seguro
   */
  async migrateAuthTokens(): Promise<void> {
    const authKeys = [
      'auth_tokens',
      'access_token',
      'refresh_token',
      'user_session',
      'litper_auth',
    ];

    const result = await this.migrateExistingData(authKeys);
    console.log('Auth token migration:', result);
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Convierte Uint8Array a Base64
   */
  private uint8ArrayToBase64(array: Uint8Array): string {
    return btoa(String.fromCharCode(...array));
  }

  /**
   * Convierte Base64 a Uint8Array
   */
  private base64ToUint8Array(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  /**
   * Limpia todos los datos seguros
   */
  clearAllSecure(): void {
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  /**
   * Obtiene todas las claves seguras almacenadas
   */
  getSecureKeys(): string[] {
    const keys: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX) && key !== `${STORAGE_PREFIX}salt`) {
        keys.push(key.replace(STORAGE_PREFIX, ''));
      }
    }

    return keys;
  }

  /**
   * Verifica si el servicio está inicializado
   */
  isInitialized(): boolean {
    return this.derivedKey !== null;
  }

  /**
   * Re-encripta todos los datos con una nueva clave
   */
  async rotateKey(newPassword: string): Promise<void> {
    // Get all current data
    const keys = this.getSecureKeys();
    const data: Record<string, any> = {};

    for (const key of keys) {
      const value = await this.getSecure(key);
      if (value !== null) {
        data[key] = value;
      }
    }

    // Clear current data
    this.clearAllSecure();

    // Re-initialize with new password
    this.derivedKey = null;
    this.keyPromise = null;
    this.salt = null;
    localStorage.removeItem(`${STORAGE_PREFIX}salt`);

    await this.initialize(newPassword);

    // Re-encrypt all data
    for (const [key, value] of Object.entries(data)) {
      await this.setSecure(key, value);
    }
  }
}

// ============================================
// SINGLETON EXPORT
// ============================================

export const encryptionService = new EncryptionService();

// Auto-initialize on import
encryptionService.initialize().catch(console.error);

export default encryptionService;
