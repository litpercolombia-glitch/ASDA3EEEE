# PLAN DE SOLUCIÓN - PROBLEMAS DE PERSISTENCIA

**Fecha:** 2026-01-08
**Estado:** Plan propuesto
**Prioridad:** Alta

---

## RESUMEN DE PROBLEMAS A RESOLVER

| # | Problema | Impacto | Prioridad |
|---|----------|---------|-----------|
| 1 | Duplicación de datos (PostgreSQL vs Supabase) | Alto | 🔴 Crítico |
| 2 | 58 archivos usan localStorage directamente | Alto | 🔴 Crítico |
| 3 | Credenciales hardcodeadas en código | Medio | 🟡 Importante |
| 4 | Falta de sincronización automática | Alto | 🔴 Crítico |
| 5 | Fallback a localStorage sin notificar al usuario | Medio | 🟡 Importante |

---

## SOLUCIÓN 1: UNIFICAR FUENTE DE VERDAD

### Problema Actual
```
Frontend ──→ Supabase (guias, cargas, finanzas)
Backend ───→ PostgreSQL (guias_historicas, tracking)
         ↓
    DATOS DUPLICADOS Y DESINCRONIZADOS
```

### Solución Propuesta
```
Frontend ──→ API Backend ──→ PostgreSQL (ÚNICA FUENTE)
                         ──→ Redis (cache)

Supabase → SOLO para autenticación y realtime subscriptions
```

### Pasos de Implementación

#### Fase 1: Crear API unificada en Backend

**Archivo a crear:** `backend/api/v2/unified_api.py`

```python
# Endpoints unificados que el frontend consumirá
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database.config import get_session

router = APIRouter(prefix="/api/v2", tags=["unified"])

@router.get("/guias")
async def get_guias(db: Session = Depends(get_session)):
    """Endpoint único para obtener guías"""
    pass

@router.post("/guias")
async def create_guia(guia: GuiaCreate, db: Session = Depends(get_session)):
    """Endpoint único para crear guías"""
    pass

@router.get("/cargas")
async def get_cargas(db: Session = Depends(get_session)):
    """Endpoint único para obtener cargas"""
    pass

@router.post("/cargas")
async def create_carga(carga: CargaCreate, db: Session = Depends(get_session)):
    """Endpoint único para crear cargas"""
    pass

@router.get("/finanzas")
async def get_finanzas(db: Session = Depends(get_session)):
    """Endpoint único para obtener finanzas"""
    pass
```

#### Fase 2: Crear servicio frontend unificado

**Archivo a crear:** `services/unifiedApiService.ts`

```typescript
// Servicio que reemplaza supabaseService y cargaService
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const unifiedApi = {
  // Guías
  async getGuias(params?: { limit?: number; offset?: number }) {
    const response = await fetch(`${API_URL}/api/v2/guias`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    return response.json();
  },

  async createGuia(guia: Omit<Guia, 'id'>) {
    const response = await fetch(`${API_URL}/api/v2/guias`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify(guia)
    });
    return response.json();
  },

  // Cargas
  async getCargas() {
    const response = await fetch(`${API_URL}/api/v2/cargas`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    return response.json();
  },

  // ... resto de métodos
};
```

#### Fase 3: Migrar stores de Zustand

**Modificar:** `stores/cargaStore.ts`

```typescript
// ANTES (localStorage)
const STORAGE_KEY = 'litper_cargas';

// DESPUÉS (API Backend)
import { unifiedApi } from '../services/unifiedApiService';

export const useCargaStore = create<CargaState>()(
  persist(
    (set, get) => ({
      // Solo guardar en localStorage: preferencias UI, estado temporal
      // Datos críticos van al backend

      crearNuevaCarga: async (usuarioId, usuarioNombre) => {
        set({ isLoading: true });
        try {
          // Crear en backend (persistencia real)
          const carga = await unifiedApi.createCarga({ usuarioId, usuarioNombre });
          set({ cargaActual: carga, isLoading: false });
          return carga;
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },
    }),
    {
      name: 'carga-ui-state', // Solo estado de UI
      partialize: (state) => ({
        // Solo persistir estado de UI, no datos
        vistaActual: state.vistaActual,
        filtrosActivos: state.filtrosActivos,
      }),
    }
  )
);
```

### Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `services/supabaseService.ts` | Deprecar, redirigir a unifiedApi |
| `services/cargaService.ts` | Migrar de localStorage a API |
| `stores/cargaStore.ts` | Usar unifiedApi |
| `stores/shipmentStore.ts` | Usar unifiedApi |
| Todos los 58 archivos con localStorage | Auditar y migrar datos críticos |

---

## SOLUCIÓN 2: SERVICIO DE ALMACENAMIENTO CENTRALIZADO

### Problema
58 archivos acceden a localStorage directamente, sin control.

### Solución
Crear un servicio centralizado que:
1. Distinga entre datos críticos (→ Backend) y datos de UI (→ localStorage)
2. Sincronice automáticamente con el backend
3. Maneje offline/online gracefully

**Archivo a crear:** `services/storageService.ts`

```typescript
type StorageType = 'critical' | 'ui' | 'cache';

interface StorageConfig {
  type: StorageType;
  syncWithBackend: boolean;
  ttl?: number; // Time to live en segundos
}

const STORAGE_CONFIG: Record<string, StorageConfig> = {
  // Datos críticos - van al backend
  'litper_cargas': { type: 'critical', syncWithBackend: true },
  'litper_guias': { type: 'critical', syncWithBackend: true },
  'litper_finanzas': { type: 'critical', syncWithBackend: true },

  // Datos de UI - localStorage está bien
  'litper_theme': { type: 'ui', syncWithBackend: false },
  'litper_filters': { type: 'ui', syncWithBackend: false },
  'litper_columns': { type: 'ui', syncWithBackend: false },

  // Cache temporal
  'litper_cache_*': { type: 'cache', syncWithBackend: false, ttl: 3600 },
};

class StorageService {
  private pendingSync: Map<string, unknown> = new Map();
  private syncInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startSyncInterval();
    window.addEventListener('online', () => this.syncPending());
  }

  async set(key: string, value: unknown): Promise<void> {
    const config = this.getConfig(key);

    // Siempre guardar en localStorage para acceso rápido
    localStorage.setItem(key, JSON.stringify(value));

    // Si es crítico, sincronizar con backend
    if (config.syncWithBackend) {
      await this.syncToBackend(key, value);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const config = this.getConfig(key);

    // Si es crítico, intentar obtener del backend primero
    if (config.syncWithBackend && navigator.onLine) {
      try {
        const backendData = await this.getFromBackend<T>(key);
        if (backendData) {
          localStorage.setItem(key, JSON.stringify(backendData));
          return backendData;
        }
      } catch (error) {
        console.warn(`Backend unavailable, using localStorage for ${key}`);
      }
    }

    // Fallback a localStorage
    const local = localStorage.getItem(key);
    return local ? JSON.parse(local) : null;
  }

  private async syncToBackend(key: string, value: unknown): Promise<void> {
    if (!navigator.onLine) {
      this.pendingSync.set(key, value);
      return;
    }

    try {
      await fetch(`${API_URL}/api/v2/storage/${key}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify(value)
      });
      this.pendingSync.delete(key);
    } catch (error) {
      this.pendingSync.set(key, value);
    }
  }

  private async syncPending(): Promise<void> {
    for (const [key, value] of this.pendingSync) {
      await this.syncToBackend(key, value);
    }
  }

  private startSyncInterval(): void {
    this.syncInterval = setInterval(() => {
      if (navigator.onLine && this.pendingSync.size > 0) {
        this.syncPending();
      }
    }, 30000); // Sync cada 30 segundos
  }

  private getConfig(key: string): StorageConfig {
    // Buscar config exacta o por patrón
    if (STORAGE_CONFIG[key]) return STORAGE_CONFIG[key];

    // Buscar patrones con wildcard
    for (const [pattern, config] of Object.entries(STORAGE_CONFIG)) {
      if (pattern.endsWith('*') && key.startsWith(pattern.slice(0, -1))) {
        return config;
      }
    }

    // Default: UI storage
    return { type: 'ui', syncWithBackend: false };
  }
}

export const storage = new StorageService();
```

### Uso

```typescript
// En lugar de:
localStorage.setItem('litper_cargas', JSON.stringify(cargas));

// Usar:
await storage.set('litper_cargas', cargas);
```

---

## SOLUCIÓN 3: CREDENCIALES SEGURAS

### Problema
```yaml
# docker-compose.yml
POSTGRES_PASSWORD: ${DB_PASSWORD:-litper_secure_pass_2024}  # ⚠️ Default hardcodeado
```

### Solución

#### Fase 1: Eliminar defaults en docker-compose

**Modificar:** `docker-compose.yml`

```yaml
services:
  db:
    environment:
      POSTGRES_USER: ${DB_USER}      # Sin default
      POSTGRES_PASSWORD: ${DB_PASSWORD}  # Sin default
      POSTGRES_DB: ${DB_NAME}        # Sin default
```

#### Fase 2: Crear script de setup seguro

**Archivo a crear:** `scripts/setup-env.sh`

```bash
#!/bin/bash

echo "🔐 Configuración de entorno LITPER"
echo "=================================="

ENV_FILE=".env"

if [ -f "$ENV_FILE" ]; then
  echo "⚠️  El archivo .env ya existe. ¿Sobrescribir? (y/n)"
  read -r response
  if [ "$response" != "y" ]; then
    exit 0
  fi
fi

# Generar contraseña segura
generate_password() {
  openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 24
}

echo ""
echo "Generando credenciales seguras..."

DB_PASSWORD=$(generate_password)
REDIS_PASSWORD=$(generate_password)
JWT_SECRET=$(generate_password)

cat > "$ENV_FILE" << EOF
# ========================================
# LITPER - Variables de Entorno
# Generado automáticamente: $(date)
# ========================================

# Base de Datos
DB_USER=litper_user
DB_PASSWORD=${DB_PASSWORD}
DB_NAME=litper_prod

# Redis
REDIS_PASSWORD=${REDIS_PASSWORD}

# JWT
JWT_SECRET=${JWT_SECRET}

# API Keys (configurar manualmente)
ANTHROPIC_API_KEY=
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

# Entorno
NODE_ENV=production
DEBUG=false
EOF

echo "✅ Archivo .env creado con credenciales seguras"
echo ""
echo "⚠️  IMPORTANTE:"
echo "   - Guarda DB_PASSWORD en un lugar seguro: ${DB_PASSWORD}"
echo "   - Nunca subas .env a git"
echo "   - Configura las API keys manualmente"
```

#### Fase 3: Validación de entorno en startup

**Archivo a crear:** `backend/utils/env_validator.py`

```python
import os
import sys
from loguru import logger

REQUIRED_VARS = [
    'DATABASE_URL',
    'DB_PASSWORD',
]

REQUIRED_IN_PRODUCTION = [
    'ANTHROPIC_API_KEY',
    'JWT_SECRET',
]

def validate_environment():
    """Valida que las variables de entorno requeridas estén configuradas."""
    missing = []
    using_defaults = []

    # Variables requeridas siempre
    for var in REQUIRED_VARS:
        if not os.getenv(var):
            missing.append(var)

    # Detectar defaults peligrosos
    db_pass = os.getenv('DB_PASSWORD', '')
    if 'litper_secure_pass_2024' in db_pass or 'litper_pass' in db_pass:
        using_defaults.append('DB_PASSWORD (usando default inseguro)')

    # En producción, requerir más variables
    if os.getenv('NODE_ENV') == 'production':
        for var in REQUIRED_IN_PRODUCTION:
            if not os.getenv(var):
                missing.append(var)

    # Reportar problemas
    if missing:
        logger.error(f"Variables de entorno faltantes: {', '.join(missing)}")
        sys.exit(1)

    if using_defaults:
        logger.warning(f"⚠️  Variables con defaults inseguros: {', '.join(using_defaults)}")
        if os.getenv('NODE_ENV') == 'production':
            logger.error("No se permiten defaults en producción")
            sys.exit(1)

    logger.success("Variables de entorno validadas correctamente")

# Ejecutar al importar
validate_environment()
```

---

## SOLUCIÓN 4: SINCRONIZACIÓN AUTOMÁTICA

### Problema
No hay sincronización automática entre frontend y backend.

### Solución

**Archivo a crear:** `services/syncService.ts`

```typescript
import { unifiedApi } from './unifiedApiService';
import { storage } from './storageService';

interface SyncConfig {
  interval: number;        // Intervalo de sync en ms
  retryAttempts: number;   // Intentos de reintento
  onConflict: 'server-wins' | 'client-wins' | 'merge';
}

const DEFAULT_CONFIG: SyncConfig = {
  interval: 60000,         // 1 minuto
  retryAttempts: 3,
  onConflict: 'server-wins',
};

class SyncService {
  private config: SyncConfig;
  private syncInterval: NodeJS.Timeout | null = null;
  private isSyncing = false;
  private lastSyncTime: Date | null = null;
  private listeners: Set<(status: SyncStatus) => void> = new Set();

  constructor(config: Partial<SyncConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // Iniciar sincronización automática
  start(): void {
    if (this.syncInterval) return;

    // Sync inicial
    this.sync();

    // Sync periódico
    this.syncInterval = setInterval(() => {
      this.sync();
    }, this.config.interval);

    // Sync cuando vuelve online
    window.addEventListener('online', () => {
      this.notifyListeners({ status: 'reconnected' });
      this.sync();
    });

    window.addEventListener('offline', () => {
      this.notifyListeners({ status: 'offline' });
    });

    console.log('🔄 Sincronización automática iniciada');
  }

  stop(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // Sincronización manual
  async sync(): Promise<SyncResult> {
    if (this.isSyncing) {
      return { success: false, reason: 'sync_in_progress' };
    }

    if (!navigator.onLine) {
      return { success: false, reason: 'offline' };
    }

    this.isSyncing = true;
    this.notifyListeners({ status: 'syncing' });

    try {
      // 1. Obtener cambios pendientes locales
      const pendingChanges = await this.getPendingLocalChanges();

      // 2. Enviar cambios al servidor
      if (pendingChanges.length > 0) {
        await this.pushChangesToServer(pendingChanges);
      }

      // 3. Obtener cambios del servidor
      const serverChanges = await this.pullChangesFromServer();

      // 4. Aplicar cambios localmente
      await this.applyServerChanges(serverChanges);

      // 5. Actualizar timestamp
      this.lastSyncTime = new Date();
      await storage.set('last_sync', this.lastSyncTime.toISOString());

      this.notifyListeners({
        status: 'synced',
        lastSync: this.lastSyncTime,
        changesApplied: serverChanges.length
      });

      return { success: true };
    } catch (error) {
      this.notifyListeners({ status: 'error', error: error.message });
      return { success: false, reason: error.message };
    } finally {
      this.isSyncing = false;
    }
  }

  private async getPendingLocalChanges(): Promise<LocalChange[]> {
    const changes: LocalChange[] = [];
    const pendingKeys = await storage.get<string[]>('pending_sync_keys') || [];

    for (const key of pendingKeys) {
      const data = await storage.get(key);
      if (data) {
        changes.push({ key, data, timestamp: Date.now() });
      }
    }

    return changes;
  }

  private async pushChangesToServer(changes: LocalChange[]): Promise<void> {
    for (const change of changes) {
      await unifiedApi.syncData(change.key, change.data);
    }
    // Limpiar pendientes
    await storage.set('pending_sync_keys', []);
  }

  private async pullChangesFromServer(): Promise<ServerChange[]> {
    const lastSync = await storage.get<string>('last_sync');
    return unifiedApi.getChangesSince(lastSync || '1970-01-01');
  }

  private async applyServerChanges(changes: ServerChange[]): Promise<void> {
    for (const change of changes) {
      await storage.set(change.key, change.data);
    }
  }

  // Suscribirse a cambios de estado
  onStatusChange(callback: (status: SyncStatus) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(status: SyncStatus): void {
    this.listeners.forEach(cb => cb(status));
  }
}

export const syncService = new SyncService();

// Tipos
interface SyncResult {
  success: boolean;
  reason?: string;
}

interface LocalChange {
  key: string;
  data: unknown;
  timestamp: number;
}

interface ServerChange {
  key: string;
  data: unknown;
}

type SyncStatus = {
  status: 'syncing' | 'synced' | 'error' | 'offline' | 'reconnected';
  lastSync?: Date;
  changesApplied?: number;
  error?: string;
};
```

### Componente de UI para mostrar estado de sync

**Archivo a crear:** `components/SyncStatus.tsx`

```tsx
import React, { useEffect, useState } from 'react';
import { syncService } from '../services/syncService';

export const SyncStatusIndicator: React.FC = () => {
  const [status, setStatus] = useState<SyncStatus>({ status: 'synced' });

  useEffect(() => {
    const unsubscribe = syncService.onStatusChange(setStatus);
    syncService.start();
    return () => {
      unsubscribe();
      syncService.stop();
    };
  }, []);

  const getIcon = () => {
    switch (status.status) {
      case 'syncing': return '🔄';
      case 'synced': return '✅';
      case 'offline': return '📴';
      case 'error': return '❌';
      default: return '⏳';
    }
  };

  const getMessage = () => {
    switch (status.status) {
      case 'syncing': return 'Sincronizando...';
      case 'synced': return `Sincronizado ${formatTime(status.lastSync)}`;
      case 'offline': return 'Sin conexión - Cambios guardados localmente';
      case 'error': return `Error: ${status.error}`;
      default: return '';
    }
  };

  return (
    <div className={`sync-status sync-status--${status.status}`}>
      <span className="sync-icon">{getIcon()}</span>
      <span className="sync-message">{getMessage()}</span>
      {status.status === 'error' && (
        <button onClick={() => syncService.sync()}>Reintentar</button>
      )}
    </div>
  );
};
```

---

## SOLUCIÓN 5: NOTIFICACIÓN DE FALLBACK

### Problema
El usuario no sabe cuando los datos están en localStorage vs cloud.

### Solución

**Archivo a crear:** `components/StorageWarning.tsx`

```tsx
import React, { useEffect, useState } from 'react';
import { isSupabaseConfigured } from '../services/supabaseService';

export const StorageWarning: React.FC = () => {
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    // Mostrar warning si Supabase no está configurado
    if (!isSupabaseConfigured()) {
      setShowWarning(true);
    }
  }, []);

  if (!showWarning) return null;

  return (
    <div className="storage-warning">
      <div className="warning-icon">⚠️</div>
      <div className="warning-content">
        <strong>Modo local activado</strong>
        <p>
          Los datos se guardan solo en este navegador.
          Para sincronizar entre dispositivos, configura Supabase o conecta al backend.
        </p>
        <button onClick={() => setShowWarning(false)}>Entendido</button>
      </div>
    </div>
  );
};
```

---

## CRONOGRAMA DE IMPLEMENTACIÓN

### Fase 1: Preparación (Semana 1)
- [ ] Crear branch `feature/unified-persistence`
- [ ] Crear endpoints unificados en backend
- [ ] Crear `unifiedApiService.ts`
- [ ] Crear `storageService.ts`
- [ ] Crear tests unitarios

### Fase 2: Migración de Stores (Semana 2)
- [ ] Migrar `cargaStore.ts`
- [ ] Migrar `shipmentStore.ts`
- [ ] Migrar otros stores críticos
- [ ] Crear script de migración de datos

### Fase 3: Sincronización (Semana 3)
- [ ] Implementar `syncService.ts`
- [ ] Agregar indicador de estado de sync
- [ ] Implementar manejo offline
- [ ] Tests de integración

### Fase 4: Seguridad (Semana 4)
- [ ] Eliminar credenciales por defecto
- [ ] Crear script `setup-env.sh`
- [ ] Implementar validación de entorno
- [ ] Documentación de deployment

### Fase 5: Cleanup (Semana 5)
- [ ] Auditar 58 archivos con localStorage
- [ ] Migrar o marcar como UI-only
- [ ] Deprecar `supabaseService.ts` antiguo
- [ ] Actualizar documentación

---

## CHECKLIST DE VALIDACIÓN

Antes de considerar completado el plan:

- [ ] Todos los datos críticos persisten en PostgreSQL
- [ ] Frontend usa API unificada
- [ ] Sincronización automática funcionando
- [ ] Usuario notificado cuando está en modo local
- [ ] Sin credenciales por defecto en producción
- [ ] Tests de persistencia pasando
- [ ] Datos migrados correctamente

---

## ARCHIVOS A CREAR

| Archivo | Descripción |
|---------|-------------|
| `backend/api/v2/unified_api.py` | API unificada |
| `services/unifiedApiService.ts` | Cliente API |
| `services/storageService.ts` | Almacenamiento centralizado |
| `services/syncService.ts` | Sincronización automática |
| `components/SyncStatus.tsx` | Indicador de estado |
| `components/StorageWarning.tsx` | Warning de modo local |
| `scripts/setup-env.sh` | Setup de entorno |
| `backend/utils/env_validator.py` | Validador de entorno |

## ARCHIVOS A MODIFICAR

| Archivo | Cambio |
|---------|--------|
| `docker-compose.yml` | Eliminar defaults |
| `stores/cargaStore.ts` | Usar unifiedApi |
| `services/supabaseService.ts` | Deprecar |
| 58 archivos con localStorage | Auditar y migrar |

---

*Plan generado - LITPER Pro*
