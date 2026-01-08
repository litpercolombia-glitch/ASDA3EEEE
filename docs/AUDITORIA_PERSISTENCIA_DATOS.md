# AUDITORÍA DE PERSISTENCIA DE DATOS - LITPER PRO

**Fecha:** 2026-01-08
**Proyecto:** LITPER Logistics Platform
**Versión:** 1.0

---

## RESUMEN EJECUTIVO

### ¿Se guardan los datos correctamente?

| Componente | Persistencia | Portabilidad | Veredicto |
|------------|-------------|--------------|-----------|
| PostgreSQL (Backend) | ✅ Sí | ⚠️ Requiere configuración | **FUNCIONAL** |
| Supabase (Frontend Cloud) | ✅ Sí | ✅ Portátil (cloud) | **FUNCIONAL** |
| SQLite (Tracker) | ✅ Sí | ❌ Local únicamente | **LIMITADO** |
| Redis (Cache) | ✅ Sí (AOF) | ⚠️ Efímero por diseño | **FUNCIONAL** |
| localStorage (Zustand) | ✅ Sí | ❌ Solo navegador local | **LIMITADO** |

### Conclusión Principal

**La aplicación tiene un sistema híbrido de persistencia:**
- **Datos críticos del backend** → PostgreSQL (requiere base de datos configurada)
- **Datos del frontend en la nube** → Supabase (portátil entre dispositivos)
- **Estado de UI local** → localStorage (solo en el navegador actual)

**Para iniciar en cualquier lugar y mantener los datos, necesitas:**
1. Conexión a PostgreSQL (local Docker o remoto)
2. Configuración de Supabase (credenciales en `.env`)
3. El localStorage NO es portátil entre dispositivos

---

## 1. ARQUITECTURA DE PERSISTENCIA

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         LITPER - ARQUITECTURA DE DATOS                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────────┐        │
│  │   FRONTEND   │     │   BACKEND    │     │    EXTERNAL      │        │
│  │   (React)    │     │  (FastAPI)   │     │    SERVICES      │        │
│  └──────┬───────┘     └──────┬───────┘     └────────┬─────────┘        │
│         │                    │                      │                   │
│         │                    │                      │                   │
│    ┌────▼────┐          ┌────▼────┐          ┌──────▼──────┐           │
│    │Zustand  │          │SQLAlch- │          │  Supabase   │           │
│    │+persist │          │emy ORM  │          │  (Cloud)    │           │
│    └────┬────┘          └────┬────┘          └──────┬──────┘           │
│         │                    │                      │                   │
│    ┌────▼────┐          ┌────▼────┐          ┌──────▼──────┐           │
│    │localStorage│       │PostgreSQL│         │ PostgreSQL  │           │
│    │(browser)│          │ (Docker) │          │  (Managed)  │           │
│    └─────────┘          └────┬────┘          └─────────────┘           │
│                              │                                          │
│                         ┌────▼────┐                                     │
│                         │  Redis  │                                     │
│                         │ (Cache) │                                     │
│                         └─────────┘                                     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. AUDITORÍA DETALLADA POR COMPONENTE

### 2.1 PostgreSQL (Base de Datos Principal)

**Ubicación:** Docker container `litper-db` o servidor remoto

**Configuración encontrada:**
```python
# .env.backend
DATABASE_URL=postgresql://litper_user:litper_pass@localhost:5432/litper_ml_db
DB_POOL_SIZE=5
DB_MAX_OVERFLOW=10
DB_POOL_TIMEOUT=30
DB_POOL_RECYCLE=1800
```

**Tablas principales:**
| Tabla | Descripción | Registros críticos |
|-------|-------------|-------------------|
| `guias_historicas` | Guías de envío | ✅ Persistente |
| `archivos_cargados` | Archivos Excel importados | ✅ Persistente |
| `predicciones_tiempo_real` | Predicciones ML | ✅ Persistente |
| `alertas_sistema` | Alertas generadas | ✅ Persistente |
| `configuraciones_sistema` | Config del sistema | ✅ Persistente |
| `conversaciones_chat` | Historial de chat | ✅ Persistente |
| `tracking_ordenes` | Seguimiento de órdenes | ✅ Persistente |

**Veredicto:**
- ✅ **PERSISTE:** Todos los datos críticos del negocio
- ⚠️ **PORTABILIDAD:** Requiere configurar `DATABASE_URL` apuntando al servidor correcto
- ✅ **DOCKER:** Volumen `postgres_data` persiste datos entre reinicios

**Riesgo identificado:**
```yaml
# docker-compose.yml - Credenciales por defecto
POSTGRES_USER: ${DB_USER:-litper}
POSTGRES_PASSWORD: ${DB_PASSWORD:-litper_secure_pass_2024}
```
⚠️ Las credenciales por defecto están en el código. Se recomienda usar variables de entorno en producción.

---

### 2.2 Supabase (Cloud Frontend)

**Ubicación:** `services/supabaseService.ts`

**Configuración:**
```typescript
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
```

**Tablas en Supabase:**
| Tabla | Tipo | Portabilidad |
|-------|------|--------------|
| `guias` | Cloud | ✅ Cualquier dispositivo |
| `cargas` | Cloud | ✅ Cualquier dispositivo |
| `finanzas` | Cloud | ✅ Cualquier dispositivo |
| `ciudades_stats` | Cloud | ✅ Cualquier dispositivo |
| `alertas` | Cloud | ✅ Cualquier dispositivo |
| `actividad` | Cloud | ✅ Cualquier dispositivo |

**Fallback implementado:**
```typescript
export const getSupabase = (): SupabaseClient => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('Supabase no configurado. Usando localStorage como fallback.');
    throw new Error('SUPABASE_NOT_CONFIGURED');
  }
  // ...
};
```

**Veredicto:**
- ✅ **PERSISTE:** Sí, en la nube
- ✅ **PORTABILIDAD:** Datos accesibles desde cualquier dispositivo con las credenciales correctas
- ⚠️ **SIN CONFIGURAR:** Sin `.env` los datos caen a localStorage (no portátil)

---

### 2.3 SQLite (Tracker Local)

**Ubicación:** `/backend/data/tracker.db`

**Tablas:**
| Tabla | Descripción |
|-------|-------------|
| `usuarios` | Perfiles de usuario |
| `rondas_guias` | Rondas de guías |
| `rondas_novedades` | Rondas de novedades |
| `configuracion` | Configuración local |

**Veredicto:**
- ✅ **PERSISTE:** Sí, archivo local
- ❌ **PORTABILIDAD:** Solo existe en la máquina local
- ⚠️ **USO:** Parece ser para desarrollo/testing local

---

### 2.4 Redis (Cache)

**Ubicación:** Docker container `litper-redis`

**Configuración:**
```yaml
# docker-compose.yml
redis:
  command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
  volumes:
    - redis_data:/data
```

**Características:**
- `--appendonly yes` = Persistencia AOF habilitada
- `allkeys-lru` = Evicción LRU cuando se llena
- Volumen `redis_data` persiste entre reinicios

**Veredicto:**
- ✅ **PERSISTE:** Sí (AOF)
- ⚠️ **DISEÑO:** Es cache, los datos pueden ser regenerados
- ✅ **RECUPERABLE:** Al reiniciar, Redis recupera datos del AOF

---

### 2.5 localStorage / Zustand Stores

**Ubicación:** `stores/cargaStore.ts` y otros

**Stores con persistencia:**
```typescript
export const useCargaStore = create<CargaState>()(
  persist(
    (set, get) => ({
      // Estado
    }),
    {
      name: 'carga-storage', // Key en localStorage
    }
  )
);
```

**Stores identificados:**
| Store | Persistencia | Datos |
|-------|-------------|-------|
| `cargaStore` | localStorage | Cargas actuales, progreso |
| `authStore` | localStorage | Sesión de usuario |
| `shipmentStore` | localStorage | Envíos locales |
| `uiStore` | localStorage | Preferencias UI |
| `dashboardStore` | localStorage | Estado del dashboard |

**Veredicto:**
- ✅ **PERSISTE:** Sí, en el navegador actual
- ❌ **PORTABILIDAD:** NO portátil entre dispositivos/navegadores
- ⚠️ **RIESGO:** Si limpias el navegador, pierdes estos datos

---

## 3. MATRIZ DE PORTABILIDAD

| Escenario | PostgreSQL | Supabase | localStorage | SQLite |
|-----------|------------|----------|--------------|--------|
| Mismo dispositivo, reinicio | ✅ | ✅ | ✅ | ✅ |
| Otro dispositivo, misma red | ✅¹ | ✅ | ❌ | ❌ |
| Otro dispositivo, otra red | ✅² | ✅ | ❌ | ❌ |
| Deploy en servidor nuevo | ✅³ | ✅ | N/A | ❌ |
| Navegador diferente | ✅ | ✅ | ❌ | N/A |

¹ Requiere PostgreSQL en red accesible
² Requiere PostgreSQL expuesto a internet o VPN
³ Requiere migración de base de datos o backup

---

## 4. PROBLEMAS IDENTIFICADOS

### 4.1 Problema Crítico: Duplicación de Datos

Los datos de guías existen en **dos lugares diferentes**:
1. **PostgreSQL backend** (`guias_historicas`)
2. **Supabase frontend** (`guias`)

**Riesgo:** Desincronización entre frontend y backend

**Solución recomendada:**
- Definir una fuente única de verdad (PostgreSQL backend)
- Frontend debe siempre consumir datos del API backend
- Supabase solo para datos específicos del frontend

### 4.2 Problema: Fallback a localStorage

```typescript
console.warn('Supabase no configurado. Usando localStorage como fallback.');
```

Si Supabase no está configurado, los datos quedan atrapados en localStorage del navegador actual.

**Solución:** Siempre configurar Supabase en producción.

### 4.3 Problema: Credenciales en Código

```yaml
POSTGRES_PASSWORD: ${DB_PASSWORD:-litper_secure_pass_2024}
```

Las credenciales por defecto están hardcodeadas.

**Solución:** Nunca usar defaults en producción, siempre variables de entorno.

### 4.4 Problema: Falta de Sincronización Backend ↔ Frontend

El store tiene `sincronizarConBackend()` pero puede no ejecutarse automáticamente.

```typescript
sincronizarConBackend: () => Promise<boolean>;
```

**Solución:** Implementar sincronización automática periódica.

---

## 5. RECOMENDACIONES

### Para Desarrollo Local
```bash
# 1. Levantar toda la infraestructura
docker-compose up -d

# 2. Verificar que PostgreSQL está corriendo
docker exec litper-db psql -U litper -d litper_ml -c "SELECT 1"

# 3. Inicializar la base de datos
cd backend && python -m database.config
```

### Para Producción
```bash
# Variables de entorno requeridas:
DATABASE_URL=postgresql://user:pass@prod-server:5432/litper_prod
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### Checklist de Portabilidad

- [ ] Configurar `DATABASE_URL` apuntando al servidor PostgreSQL
- [ ] Configurar credenciales de Supabase en `.env`
- [ ] Verificar que Docker volumes están montados correctamente
- [ ] Realizar backup de PostgreSQL antes de migrar
- [ ] Los datos de localStorage NO se migran (estado de UI se reinicia)

---

## 6. CONCLUSIÓN FINAL

### ¿Puedo iniciar en cualquier lugar y tener mis datos?

**RESPUESTA: PARCIALMENTE SÍ**

| Tipo de Dato | ¿Disponible en otro lugar? | Requisito |
|--------------|---------------------------|-----------|
| Guías, predicciones, ML | ✅ Sí | PostgreSQL accesible |
| Cargas, finanzas (cloud) | ✅ Sí | Supabase configurado |
| Estado de UI, cargas locales | ❌ No | Atrapado en navegador |
| Cache y sesiones | ⚠️ Se regenera | Redis running |

### Arquitectura Recomendada para Máxima Portabilidad

```
[Usuario] → [Frontend] → [API Backend] → [PostgreSQL Cloud]
                                      → [Redis Cloud]
              ↓
         [Supabase] (para datos específicos de UI persistentes)
```

**Recomendación:** Para máxima portabilidad, usar:
1. **PostgreSQL gestionado** (Railway, Render, Supabase, AWS RDS)
2. **Redis gestionado** (Upstash, Redis Cloud)
3. **Supabase** para datos que necesitan sync entre dispositivos
4. **Eliminar dependencia de localStorage** para datos críticos

---

## 7. ARCHIVOS DE CONFIGURACIÓN CLAVE

| Archivo | Propósito | Prioridad |
|---------|-----------|-----------|
| `.env.backend` | Config PostgreSQL/Redis | 🔴 Crítico |
| `.env` (frontend) | Config Supabase/APIs | 🔴 Crítico |
| `docker-compose.yml` | Infraestructura local | 🟡 Desarrollo |
| `backend/database/config.py` | Conexión DB | 🟡 Backend |
| `services/supabaseService.ts` | Conexión Supabase | 🟡 Frontend |

---

*Auditoría generada automáticamente - LITPER Pro*
