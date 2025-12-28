# 🔍 AUDITORÍA TOTAL - LITPER PRO v5.0
## Reporte Ejecutivo de CTO + Product Lead + Security Engineer

**Fecha:** 28 de Diciembre 2024
**Auditor:** Claude (Opus 4.5)
**Alcance:** Frontend + Backend + DB + Integraciones + IA

---

# A) RESUMEN EJECUTIVO (1 página)

## Estado Actual
LITPER PRO es una **plataforma de logística e-commerce con IA** muy ambiciosa pero con **deuda técnica significativa** y **vulnerabilidades de seguridad críticas** que deben resolverse antes de escalar.

## Fortalezas Identificadas
- ✅ **Arquitectura modular** con 616+ componentes React organizados por dominio
- ✅ **Sistema de Skills** ya implementado (9 skills funcionales)
- ✅ **Integraciones Chatea/Dropi** estructuradas con tipos definidos
- ✅ **Backend FastAPI** bien organizado con ML integrado
- ✅ **Brain System** para decisiones autónomas (estructura base)

## Debilidades Críticas
- 🔴 **9 contraseñas de usuarios hardcodeadas** en código fuente
- 🔴 **Hashing de contraseñas con Base64** (NO es criptografía)
- 🔴 **API keys expuestas** en frontend (Chatea, Claude)
- 🔴 **CORS configurado como `*`** (permite cualquier origen)
- 🔴 **SeguimientoTab.tsx tiene 2,227 líneas** (necesita refactorización)
- 🟠 **Webhook signatures** no verificadas correctamente
- 🟠 **Estados Dropi/Transportadora** pueden desincronizarse

## Puntuación Global

| Área | Score | Estado |
|------|-------|--------|
| Seguridad | 3/10 | 🔴 CRÍTICO |
| Arquitectura | 6/10 | 🟠 MEJORABLE |
| UX/UI | 7/10 | 🟢 BUENO |
| Integraciones | 5/10 | 🟠 INCOMPLETO |
| IA/Skills | 7/10 | 🟢 PROMETEDOR |
| Performance | 5/10 | 🟠 MEJORABLE |
| Observabilidad | 4/10 | 🟠 BÁSICA |

## Inversión Requerida
- **P0 (Urgente):** 1-2 semanas de desarrollo
- **P1 (Productividad):** 2-4 semanas
- **P2 (IA/Automatización):** 1-3 meses

---

# B) HALLAZGOS CRÍTICOS (Bullet Points)

## 🔴 SEGURIDAD (Fix Inmediato)

1. **Contraseñas hardcodeadas en `authService.ts`:**
   ```typescript
   // Líneas 71-174 - 9 usuarios con passwords en texto plano
   password: 'LP.CAROLINA_2024?Jm'  // karenlitper@gmail.com
   password: 'Sacrije2020?08'        // Admin password
   ```

2. **Hashing con Base64 (NO ES SEGURO):**
   ```typescript
   // authService.ts:189
   const hashPassword = (password: string): string => {
     return btoa(password + '_litper_salt_2024'); // ❌ Base64 NO es hash
   };
   ```

3. **API Key Chatea expuesta en frontend:**
   ```typescript
   // chateaService.ts:10
   const CHATEA_API_KEY = 'HSbSQoOYa6kfnRxZ6YekDcVj85u85oInCGsP6CRJtnPCKBtEfsWvLe0TiN0W';
   ```

4. **CORS permite todo:**
   ```python
   # main.py:254
   allow_origins=["*"]  # ❌ Cualquier sitio puede acceder
   ```

5. **Webhook signature verification fake:**
   ```typescript
   // webhookService.ts:316
   return signature.length > 0 && secret.length > 0; // ❌ No verifica nada
   ```

## 🟠 ARQUITECTURA

6. **Componentes gigantes:**
   - `SeguimientoTab.tsx`: 2,227 líneas (máximo recomendado: 300)
   - `InteligenciaLogisticaTab.tsx`: 94KB
   - `PrediccionesTab.tsx`: 87KB

7. **Duplicación de código:**
   - `/services/` y `/src/services/` tienen archivos duplicados
   - Skills definidos en múltiples lugares

8. **Sin capa de abstracción para integraciones:**
   - Chatea, Dropi, transportadoras acceden directamente sin gateway

## 🟠 INTEGRACIONES

9. **Estados inconsistentes Dropi ↔ Transportadora:**
   - No hay reconciliación automática
   - Mapeo de estados incompleto en `webhookService.ts`

10. **Sin reintentos robustos:**
    - Webhooks sin cola de reintentos
    - Sin dead letter queue para fallos

---

# C) TABLA PRIORIZADA (Impacto/Esfuerzo/ROI)

| # | Tarea | Impacto | Esfuerzo | ROI | Prioridad |
|---|-------|---------|----------|-----|-----------|
| 1 | Mover contraseñas a Supabase Auth | 🔴 10 | 3 días | ⭐⭐⭐⭐⭐ | P0 |
| 2 | Implementar bcrypt para hashing | 🔴 10 | 1 día | ⭐⭐⭐⭐⭐ | P0 |
| 3 | Mover API keys a backend proxy | 🔴 9 | 2 días | ⭐⭐⭐⭐⭐ | P0 |
| 4 | Configurar CORS específico | 🔴 8 | 2 horas | ⭐⭐⭐⭐⭐ | P0 |
| 5 | Verificación HMAC en webhooks | 🔴 8 | 1 día | ⭐⭐⭐⭐ | P0 |
| 6 | Refactorizar SeguimientoTab | 🟠 7 | 5 días | ⭐⭐⭐⭐ | P1 |
| 7 | Integration Gateway pattern | 🟠 7 | 1 semana | ⭐⭐⭐⭐ | P1 |
| 8 | Sistema de reconciliación Dropi | 🟠 8 | 1 semana | ⭐⭐⭐⭐ | P1 |
| 9 | Agregar 6+ skills de logística | 🟢 6 | 2 semanas | ⭐⭐⭐ | P2 |
| 10 | Modo seguro IA (confirmación) | 🟢 7 | 1 semana | ⭐⭐⭐⭐ | P2 |

---

# 1) INVENTARIO Y MAPA DEL SISTEMA

## Stack Tecnológico

### Frontend
```
React 19.2.0 + TypeScript 5.8.2
├── Build: Vite 6.2.0
├── State: Zustand 5.0.9
├── UI: TailwindCSS 3.3.6 + Lucide Icons
├── Charts: Recharts 3.5.1
├── Excel: xlsx 0.18.5
├── PDF: jsPDF 2.5.1
└── AI SDKs: @anthropic-ai/sdk, @google/genai
```

### Backend
```
FastAPI (Python 3.11+)
├── ORM: SQLAlchemy 2.0.27 (async)
├── DB: PostgreSQL 15
├── Cache: Redis 7
├── ML: scikit-learn, custom models
├── AI: Claude API, Gemini API
└── Queue: Custom Redis-based
```

### Infraestructura
```
Docker Compose
├── db: PostgreSQL 15-Alpine
├── redis: Redis 7-Alpine
├── backend: FastAPI + Uvicorn
├── frontend: Vite dev server
└── nginx: Reverse proxy (producción)
```

## Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                         USUARIOS                                 │
└─────────────────────────┬───────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│                     FRONTEND (React)                             │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────────┐ │
│  │ Operaciones │ │ Seguimiento │ │ Inteligencia│ │   Admin    │ │
│  │   Tab       │ │    Tab      │ │     Tab     │ │   Panel    │ │
│  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └─────┬──────┘ │
│         │               │               │               │        │
│  ┌──────▼───────────────▼───────────────▼───────────────▼──────┐│
│  │                    ZUSTAND STORES                           ││
│  │  shipmentStore │ uiStore │ analyticsStore │ authStore      ││
│  └──────────────────────────┬──────────────────────────────────┘│
│                             │                                    │
│  ┌──────────────────────────▼──────────────────────────────────┐│
│  │                     SERVICES LAYER                          ││
│  │  logisticsService │ skillsService │ webhookService │ etc   ││
│  └──────────────────────────┬──────────────────────────────────┘│
└─────────────────────────────┼───────────────────────────────────┘
                              │ HTTP/WebSocket
┌─────────────────────────────▼───────────────────────────────────┐
│                     BACKEND (FastAPI)                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────────┐ │
│  │   Routes    │ │  Services   │ │  ML Models  │ │   Brain    │ │
│  │ /api/*      │ │  tracking   │ │  predicción │ │  Autónomo  │ │
│  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └─────┬──────┘ │
│         │               │               │               │        │
│  ┌──────▼───────────────▼───────────────▼───────────────▼──────┐│
│  │                    SQLAlchemy ORM                           ││
│  └──────────────────────────┬──────────────────────────────────┘│
└─────────────────────────────┼───────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
┌─────────▼─────────┐ ┌───────▼───────┐ ┌────────▼────────┐
│   PostgreSQL      │ │     Redis     │ │  Integraciones  │
│   (Persistencia)  │ │   (Cache/Q)   │ │  Chatea/Dropi   │
└───────────────────┘ └───────────────┘ └─────────────────┘
```

## Estructura de Archivos Clave

```
ASDA3EEEE/
├── App.tsx                          # Entry point (1,105 líneas)
├── components/
│   ├── tabs/
│   │   ├── SeguimientoTab.tsx       # ⚠️ 2,227 líneas (refactorizar)
│   │   ├── OperacionesUnificadoTab.tsx
│   │   └── PrediccionesTab.tsx
│   ├── ChatFirst/
│   │   ├── ChatCommandCenter.tsx    # Centro de comandos chat
│   │   └── SkillViews/              # Vistas por skill
│   └── Admin/                       # 20+ paneles admin
├── services/
│   ├── skillsService.ts             # 9 skills implementados
│   ├── webhookService.ts            # Handlers Dropi/Transportadora
│   ├── chateaService.ts             # ⚠️ API key expuesta
│   ├── authService.ts               # ⚠️ Passwords hardcodeadas
│   └── brain/                       # Sistema cerebro autónomo
├── backend/
│   ├── main.py                      # FastAPI app
│   ├── routes/
│   │   ├── chatea_pro_routes.py     # Endpoints Chatea
│   │   ├── webhook_routes.py        # Webhooks genéricos
│   │   └── tracking_ordenes_routes.py
│   ├── integrations/
│   │   └── chatea_pro.py            # Cliente Chatea Pro
│   └── workers/
│       └── task_queue.py            # Cola de tareas Redis
├── stores/                          # Zustand stores
├── types/                           # TypeScript types
└── .env.backend                     # Configuración backend
```

## Flujos Críticos

### Flujo 1: Carga de Guías (Seguimiento)
```
1. Usuario sube archivo Excel/pega texto
   ↓
2. parseExcelFile() / parseDetailedInput()
   ↓
3. detectCarrier() para cada guía
   ↓
4. setShipments() → React state
   ↓
5. useEffect → saveShipments() → localStorage
   ↓
6. SeguimientoTab renderiza tabla
   ↓
7. Usuario puede: filtrar, revisar, exportar
```

### Flujo 2: Webhook Dropi → Sistema
```
1. Dropi envía POST /api/chatea-pro/webhook
   ↓
2. receive_chatea_pro_webhook() recibe
   ↓
3. determine_priority() clasifica
   ↓
4. Si crítico → analyze_with_brain()
   ↓
5. Guardar en _event_history
   ↓
6. Si hay guía → webhookService.handleDropi()
   ↓
7. Crear/actualizar guía en Supabase
```

### Flujo 3: Chat con Skills
```
1. Usuario escribe en ChatCommandCenter
   ↓
2. skillsService.detectSkill(message)
   ↓
3. Match por keywords → skill.execute(params)
   ↓
4. Skill consulta servicios (guiasService, etc)
   ↓
5. Retorna SkillResult con:
   - message (respuesta)
   - artifacts (tablas, charts)
   - actions (botones)
   - suggestions (próximos pasos)
```

---

# 2) AUDITORÍA DE FUNCIONALIDADES (ÓRDENES Y LOGÍSTICA)

## Estado Actual del Flujo de Pedidos

### Lo que FUNCIONA ✅
- Carga de guías desde Excel, texto, resumen
- Detección automática de transportadora
- Visualización en tabla con filtros
- Sistema de revisión con badges Meta-style
- Exportación a Excel/PDF/PNG
- Alertas por días de retraso
- Semáforo de ciudades
- Skills básicos (9 implementados)

### Lo que FALTA ❌
- Reconciliación automática Dropi ↔ Transportadora
- Reintentos automáticos en cotización fallida
- Idempotencia en webhooks (duplicados posibles)
- Gestión de devoluciones end-to-end
- Trazabilidad completa de cambios
- Modo offline robusto

## Puntos de Fricción Detectados

| Problema | Ubicación | Impacto | Solución |
|----------|-----------|---------|----------|
| Pantalla muy densa | SeguimientoTab | Alto | Dividir en sub-componentes |
| Sin confirmación al borrar | Múltiples | Medio | Agregar ConfirmModal |
| Estados inconsistentes | Webhooks | Alto | Reconciliación periódica |
| Errores silenciosos | Muchos servicios | Alto | Toast notifications |
| Sin undo/redo | Ediciones | Medio | History stack |
| Carga lenta con +500 guías | SeguimientoTab | Alto | Virtualización + paginación server |

## Propuesta: Flujo Ideal de 3 Niveles

### Nivel A: Operador Nuevo (Modo Simple)
```
┌────────────────────────────────────────────────────┐
│  🚀 MODO SIMPLE - Wizard Guiado                    │
├────────────────────────────────────────────────────┤
│                                                    │
│  Paso 1: Subir archivo                             │
│  ┌──────────────────────────────────────────────┐  │
│  │  📁 Arrastra tu archivo Excel aquí          │  │
│  │     o pega el texto del reporte             │  │
│  └──────────────────────────────────────────────┘  │
│                                                    │
│  Paso 2: Verificar datos (preview 5 guías)        │
│  ┌──────────────────────────────────────────────┐  │
│  │  ✅ 45 guías detectadas                      │  │
│  │  🚚 Coordinadora: 20 | Servientrega: 25     │  │
│  └──────────────────────────────────────────────┘  │
│                                                    │
│  Paso 3: ¿Qué hacer ahora?                        │
│  ┌────────┐ ┌────────┐ ┌────────┐                 │
│  │📊 Ver  │ │⚠️ Solo │ │📱 Enviar│                │
│  │ Todo   │ │Novedades│ │WhatsApp│                 │
│  └────────┘ └────────┘ └────────┘                 │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Nivel B: Operador Avanzado (Modo Pro)
```
┌────────────────────────────────────────────────────────────────┐
│  ⚡ MODO PRO - Vista Completa                                   │
├────────────────────────────────────────────────────────────────┤
│ 🔍 Buscar...  │ Filtros: [Estado▼] [Ciudad▼] [Días▼] [Trans▼] │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ KPIs: 📦 156 total │ ✅ 78% entrega │ ⚠️ 12 novedades │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                │
│  ┌───┬──────────┬────────────┬──────────┬──────┬──────────┐   │
│  │ ✓ │   Guía   │ Transp.    │  Estado  │ Días │ Acciones │   │
│  ├───┼──────────┼────────────┼──────────┼──────┼──────────┤   │
│  │ ☑ │ 123456   │ Coordinad. │ 🟢 Entreg│  2   │ 📞 📱 👁 │   │
│  │ ☐ │ 789012   │ Servient.  │ 🔴 Noved │  5   │ 📞 📱 👁 │   │
│  └───┴──────────┴────────────┴──────────┴──────┴──────────┘   │
│                                                                │
│  [Selección masiva: Marcar revisadas | Exportar | WhatsApp]   │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Nivel C: Automatizado por IA (Chat-First)
```
┌────────────────────────────────────────────────────────────────┐
│  🤖 MODO IA - El sistema trabaja por ti                        │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 💬 Chat con LITPER IA                                    │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │                                                          │  │
│  │ 🤖: Buenos días! Detecté 3 situaciones que requieren    │  │
│  │     atención:                                            │  │
│  │                                                          │  │
│  │     1. 🔴 5 guías llevan +5 días sin movimiento         │  │
│  │     2. 🟠 Ciudad Pasto tiene 80% tasa fallo hoy         │  │
│  │     3. 🟡 12 novedades sin gestionar desde ayer         │  │
│  │                                                          │  │
│  │     ¿Qué quieres que haga?                              │  │
│  │                                                          │  │
│  │ 👤: Gestiona las novedades y avísame de las críticas    │  │
│  │                                                          │  │
│  │ 🤖: Perfecto. Voy a:                                    │  │
│  │     ✓ Clasificar las 12 novedades por tipo              │  │
│  │     ✓ Enviar WhatsApp a clientes afectados              │  │
│  │     ✓ Escalar 2 críticas a supervisor                   │  │
│  │                                                          │  │
│  │     [▶️ Ejecutar] [👁 Ver preview] [✏️ Modificar]        │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
│  Skills activos: 📦 Guías │ 🗺️ Ciudades │ ⚠️ Novedades       │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

# 3) UX/UI + DISEÑO

## Evaluación Actual

### Navegación ⭐⭐⭐ (3/5)
- ✅ Tabs claros en header
- ❌ Demasiadas opciones visibles
- ❌ Sin breadcrumbs
- ❌ Navegación inconsistente entre tabs

### Jerarquía Visual ⭐⭐⭐⭐ (4/5)
- ✅ Colores por estado funcionan bien (semáforo)
- ✅ Badges Meta-style son efectivos
- ❌ Cards muy densas en móvil
- ❌ Tipografía podría tener más contraste

### Densidad de Información ⭐⭐ (2/5)
- ❌ SeguimientoTab muestra demasiado
- ❌ Tablas con 10+ columnas
- ❌ Sin modo compacto/expandido
- 💡 Necesita: colapso progresivo de información

### Consistencia ⭐⭐⭐ (3/5)
- ✅ Tailwind CSS da base consistente
- ❌ Botones con estilos variados
- ❌ Modals no estandarizados
- ❌ Estados de carga inconsistentes

## Checklist de UI Requerida

### Estados Vacíos
- [ ] Tabla sin datos → Mensaje + CTA "Cargar guías"
- [ ] Búsqueda sin resultados → Sugerencias
- [ ] Sin conexión → Modo offline visible
- [ ] Sin permisos → Mensaje claro + contacto admin

### Estados de Carga
- [ ] Skeleton loaders para tablas
- [ ] Progress bar para uploads
- [ ] Spinner con mensaje contextual
- [ ] Optimistic updates donde aplique

### Estados de Error
- [ ] Toast para errores recuperables
- [ ] Modal para errores críticos
- [ ] Retry button automático
- [ ] Log de errores accesible

### Confirmaciones
- [ ] Modal antes de eliminar
- [ ] Preview antes de enviar WhatsApp masivo
- [ ] Undo disponible por 10 segundos
- [ ] Resumen antes de acciones batch

## Layout Recomendado

```
┌─────────────────────────────────────────────────────────────────┐
│  HEADER: Logo │ Search (Cmd+K) │ Notificaciones │ Usuario      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  SIDEBAR (colapsable)          │  MAIN CONTENT                 │
│  ┌───────────────────────────┐ │  ┌───────────────────────────┐│
│  │ 🏠 Dashboard              │ │  │                           ││
│  │ 📦 Seguimiento      [45] │ │  │   (Contenido dinámico     ││
│  │ ⚠️ Novedades        [12] │ │  │    según tab activo)      ││
│  │ 📊 Reportes               │ │  │                           ││
│  │ 🤖 Inteligencia IA        │ │  │                           ││
│  │ ─────────────────────     │ │  │                           ││
│  │ ⚙️ Configuración          │ │  │                           ││
│  │ 🔗 Integraciones          │ │  │                           ││
│  └───────────────────────────┘ │  └───────────────────────────┘│
│                                │                                │
├─────────────────────────────────────────────────────────────────┤
│  FOOTER: Status │ Última sync: 2 min │ v5.0.0                  │
└─────────────────────────────────────────────────────────────────┘
```

---

# 4) IA: CHAT + SKILLS (Sistema Completo)

## Skills Actuales (9 implementados)

| Skill | Categoría | Estado | Funcionalidad |
|-------|-----------|--------|---------------|
| `guias` | Logística | ✅ | Buscar, resumen, stats |
| `ciudades` | Logística | ✅ | Semáforo, pausar/reanudar |
| `novedades` | Logística | ✅ | Listar, clasificar |
| `finanzas` | Finanzas | ✅ | Resumen mes, gastos |
| `whatsapp` | Comunicación | ✅ | Enviar mensajes |
| `alertas` | Comunicación | ✅ | Ver/gestionar alertas |
| `reportes` | Análisis | ✅ | Reporte ejecutivo |
| `web` | Web | ✅ | Búsqueda internet |
| `clima` | Web | ✅ | Clima por ciudad |

## Skills Propuestos (15+ nuevos)

### Logística Avanzada

```typescript
// Skill: Conciliar Estados
const conciliarEstadosSkill: SkillDefinition = {
  id: 'conciliar',
  name: 'Conciliar Estados',
  description: 'Comparar y sincronizar estados Dropi vs Transportadora',
  icon: '🔄',
  category: 'logistica',
  keywords: ['conciliar', 'sincronizar', 'comparar', 'dropi', 'estado'],

  async execute(params): Promise<SkillResult> {
    // 1. Obtener guías de Dropi
    // 2. Obtener estados de transportadoras
    // 3. Detectar discrepancias
    // 4. Mostrar diff y proponer correcciones
    return {
      success: true,
      message: `🔄 Encontré 5 discrepancias entre Dropi y transportadoras`,
      artifacts: [{ type: 'table', title: 'Discrepancias', data: {...} }],
      actions: [
        { id: 'sync_all', label: 'Sincronizar Todo', action: 'sync_dropi', confirmRequired: true },
        { id: 'sync_one', label: 'Sincronizar 1 por 1', action: 'sync_step' }
      ]
    };
  }
};

// Skill: Reintentar Cotización
const reintentarCotizacionSkill: SkillDefinition = {
  id: 'recotizar',
  name: 'Reintentar Cotización',
  description: 'Recotizar envíos fallidos con otra transportadora',
  icon: '🔁',
  category: 'logistica',
  keywords: ['recotizar', 'reintentar', 'cotización', 'fallo', 'alternativa'],

  async execute(params): Promise<SkillResult> {
    // 1. Identificar envíos con cotización fallida
    // 2. Buscar alternativas por ciudad
    // 3. Proponer nueva cotización
    return {
      success: true,
      message: `🔁 3 envíos pueden recotizarse con mejor tarifa`,
      actions: [
        { id: 'cotizar', label: 'Recotizar Seleccionados', action: 'recotizar', confirmRequired: true }
      ]
    };
  }
};

// Skill: Detectar Anomalías
const detectarAnomaliasSkill: SkillDefinition = {
  id: 'anomalias',
  name: 'Detectar Anomalías',
  description: 'IA detecta patrones inusuales en operaciones',
  icon: '🔍',
  category: 'analisis',
  keywords: ['anomalia', 'inusual', 'patron', 'detectar', 'problema'],

  async execute(params): Promise<SkillResult> {
    // 1. Analizar últimas 24h de datos
    // 2. Comparar con baseline histórico
    // 3. Identificar desviaciones significativas
    return {
      success: true,
      message: `🔍 Detecté 2 anomalías:\n- Bogotá: 40% más devoluciones que promedio\n- TCC: Demora 2x normal`,
      artifacts: [{ type: 'chart', title: 'Desviaciones', data: {...} }],
      suggestions: ['¿Por qué Bogotá tiene tantas devoluciones?', 'Ver histórico TCC']
    };
  }
};

// Skill: Priorizar Casos
const priorizarCasosSkill: SkillDefinition = {
  id: 'priorizar',
  name: 'Priorizar Casos',
  description: 'IA ordena casos por urgencia e impacto',
  icon: '⚡',
  category: 'automatizacion',
  keywords: ['priorizar', 'urgente', 'importante', 'primero', 'orden'],

  async execute(params): Promise<SkillResult> {
    // Algoritmo de priorización:
    // Score = (Días retraso * 2) + (Valor / 100000) + (Cliente VIP * 5) + (Novedad crítica * 10)
    return {
      success: true,
      message: `⚡ Top 5 casos priorizados por urgencia:`,
      artifacts: [{
        type: 'list',
        title: 'Prioridades',
        data: [
          { guia: '123', score: 95, reason: 'Novedad crítica + 7 días' },
          { guia: '456', score: 82, reason: 'Cliente VIP + valor alto' }
        ]
      }]
    };
  }
};

// Skill: Mensaje a Cliente
const mensajeClienteSkill: SkillDefinition = {
  id: 'mensaje_cliente',
  name: 'Generar Mensaje Cliente',
  description: 'IA genera mensaje personalizado para cliente',
  icon: '✉️',
  category: 'comunicacion',
  keywords: ['mensaje', 'cliente', 'escribir', 'notificar', 'personalizado'],

  async execute(params): Promise<SkillResult> {
    const guiaId = params.guia as string;
    // 1. Obtener datos de la guía
    // 2. Analizar contexto (estado, días, historial)
    // 3. Generar mensaje empático con Claude
    return {
      success: true,
      message: `✉️ Mensaje generado para ${guiaId}:`,
      data: {
        mensaje: "Hola María! Lamentamos informarte que tu pedido #123 está experimentando un pequeño retraso. Nuestro equipo ya está gestionando la situación y estimamos entrega para mañana antes de las 6 PM. ¿Te funciona ese horario?"
      },
      actions: [
        { id: 'enviar', label: '📱 Enviar WhatsApp', action: 'send_whatsapp', confirmRequired: true },
        { id: 'editar', label: '✏️ Editar', action: 'edit_message' }
      ]
    };
  }
};

// Skill: Clasificar Novedad
const clasificarNovedadSkill: SkillDefinition = {
  id: 'clasificar_novedad',
  name: 'Clasificar Novedad',
  description: 'IA clasifica tipo de novedad y sugiere resolución',
  icon: '🏷️',
  category: 'automatizacion',
  keywords: ['clasificar', 'novedad', 'tipo', 'categoria', 'resolver'],

  async execute(params): Promise<SkillResult> {
    // Categorías: DIRECCION, TELEFONO, AUSENTE, RECHAZADO, DAÑADO, OTRO
    // ML model para clasificar basado en descripción
    return {
      success: true,
      message: `🏷️ Novedad clasificada:

**Tipo:** Dirección incorrecta
**Confianza:** 92%
**Resolución sugerida:** Contactar cliente para confirmar dirección`,
      actions: [
        { id: 'resolver', label: 'Aplicar Resolución', action: 'resolve_issue', confirmRequired: true },
        { id: 'reclasificar', label: 'Reclasificar', action: 'reclassify' }
      ]
    };
  }
};
```

### Tabla Completa de Skills Propuestos

| # | Skill ID | Nombre | Categoría | Inputs | Outputs | Permisos |
|---|----------|--------|-----------|--------|---------|----------|
| 1 | conciliar | Conciliar Estados | Logística | fecha_inicio, fecha_fin | Diff, acciones sync | Operador+ |
| 2 | recotizar | Reintentar Cotización | Logística | guia_ids[], ciudad | Nuevas tarifas | Operador+ |
| 3 | anomalias | Detectar Anomalías | Análisis | período, umbral | Alertas, causas | Supervisor+ |
| 4 | priorizar | Priorizar Casos | Automatización | criterios[] | Lista ordenada | Operador+ |
| 5 | mensaje_cliente | Mensaje Cliente | Comunicación | guia_id, tono | Mensaje generado | Operador+ |
| 6 | clasificar_novedad | Clasificar Novedad | Automatización | novedad_id | Tipo, resolución | Operador+ |
| 7 | transportadora_optima | Recomendar Transportadora | Logística | ciudad, peso, valor | Ranking, precios | Todos |
| 8 | proyeccion | Proyectar Mes | Análisis | - | KPIs estimados | Supervisor+ |
| 9 | comparar_periodos | Comparar Períodos | Análisis | periodo1, periodo2 | Diferencias, % | Supervisor+ |
| 10 | cliente_vip | Gestión VIP | CRM | cliente_id | Historial, acciones | Operador+ |
| 11 | devolucion | Gestionar Devolución | Logística | guia_id | Flujo devolución | Operador+ |
| 12 | reasignar | Reasignar Transportadora | Logística | guia_id, nueva_trans | Confirmación | Supervisor+ |
| 13 | escalamiento | Escalar Caso | Comunicación | guia_id, motivo | Ticket, notificación | Operador+ |
| 14 | tendencias | Analizar Tendencias | Análisis | periodo, dimension | Gráficos, insights | Supervisor+ |
| 15 | automatizar_regla | Crear Automatización | Automatización | condición, acción | Regla activa | Admin |

## Modo Seguro IA

```typescript
interface SafeMode {
  // Niveles de autonomía
  SUGGEST_ONLY: 'suggest',      // Solo sugiere, nunca ejecuta
  CONFIRM_ALWAYS: 'confirm',    // Pide confirmación siempre
  CONFIRM_CRITICAL: 'critical', // Confirma solo acciones críticas
  AUTONOMOUS: 'auto'            // Ejecuta automáticamente
}

// Acciones por nivel de riesgo
const ACTION_RISK_LEVELS = {
  // Bajo riesgo - Puede ejecutar en modo 'critical' o 'auto'
  LOW: ['buscar', 'listar', 'exportar', 'ver_detalle'],

  // Medio riesgo - Requiere confirmación excepto en 'auto'
  MEDIUM: ['marcar_revisado', 'clasificar', 'generar_mensaje'],

  // Alto riesgo - SIEMPRE requiere confirmación humana
  HIGH: ['enviar_whatsapp', 'cambiar_estado', 'pausar_ciudad'],

  // Crítico - Requiere doble confirmación + log
  CRITICAL: ['eliminar', 'reasignar_masivo', 'cancelar_pedido']
};

// Implementación
async function executeWithSafeMode(
  action: string,
  params: Record<string, unknown>,
  safeMode: SafeMode
): Promise<SkillResult> {
  const riskLevel = determineRiskLevel(action);

  if (safeMode === 'suggest' ||
      (safeMode === 'confirm' && riskLevel !== 'LOW') ||
      (safeMode === 'critical' && ['HIGH', 'CRITICAL'].includes(riskLevel))) {

    return {
      success: true,
      message: `🔒 Acción pendiente de confirmación`,
      data: { action, params, riskLevel },
      actions: [
        { id: 'confirm', label: '✅ Confirmar', action: 'confirm_action' },
        { id: 'cancel', label: '❌ Cancelar', action: 'cancel_action' },
        { id: 'modify', label: '✏️ Modificar', action: 'modify_action' }
      ]
    };
  }

  // Ejecutar y loguear
  const result = await executeAction(action, params);
  await logAction(action, params, result, 'auto');
  return result;
}
```

---

# 5) INTEGRACIONES (DROPI / CHATEA / WEBHOOKS / APIS)

## Análisis de Integraciones Actuales

### Chatea Pro
```
Estado: ⚠️ FUNCIONAL PERO INSEGURO

Endpoints usados:
- POST /api/iwh/{webhook_id} - Recibir eventos N8N
- POST /api/send-message - Enviar WhatsApp

Problemas:
1. API key hardcodeada en frontend
2. Sin retry logic robusto
3. Sin validación de firma webhook
4. Timeout de 30s (muy largo para UX)

Payloads de ejemplo:

// Webhook entrante (N8N → Litper)
{
  "event": "order_status_changed",
  "data": {
    "order_id": "ORD-12345",
    "customer_name": "María García",
    "customer_phone": "+573001234567",
    "status": "en_transito",
    "carrier": "Coordinadora",
    "guide": "123456789",
    "city": "Bogota"
  },
  "timestamp": "2024-12-28T10:30:00Z",
  "source": "dropi"
}

// Enviar mensaje WhatsApp
{
  "phone": "+573001234567",
  "message": "Hola María! Tu pedido #12345 ya está en camino.",
  "template": null
}
```

### Dropi (via Chatea)
```
Estado: ⚠️ PARCIALMENTE IMPLEMENTADO

Flujo actual:
Dropi → N8N → Chatea Webhook → Litper Backend

Problemas:
1. No hay acceso directo a API Dropi
2. Estados pueden desincronizarse
3. Sin reconciliación automática
4. Pérdida de datos si webhook falla

Mapeo de estados actual:
Dropi Status → Litper Status
─────────────────────────────
pendiente    → Pendiente
confirmado   → Pendiente
despachado   → En Tránsito
en_transito  → En Tránsito
en_reparto   → En Reparto
entregado    → Entregado
devolucion   → Devuelto
novedad      → Con Novedad
```

### Transportadoras
```
Estado: ✅ IMPLEMENTADO (mapeo básico)

Transportadoras soportadas:
- Coordinadora
- Servientrega
- Interrapidísimo
- TCC
- Envía

Webhook handler: webhookService.handleTransportadora()

Mapeo de estados:
ADMITIDO         → En Tránsito
EN DISTRIBUCION  → En Reparto
ENTREGADO        → Entregado
DEVUELTO         → Devuelto
NOVEDAD          → Con Novedad
```

## Tabla de Análisis de Integraciones

| Integración | Eventos | Riesgos | Observabilidad | Recomendación |
|-------------|---------|---------|----------------|---------------|
| **Chatea Pro** | order_created, status_changed, delay_detected | API key expuesta, sin retry | Logs básicos | Mover key a backend, agregar retry |
| **Dropi** | Via N8N, no directo | Desincronización, pérdida datos | Sin métricas | Acceso API directo + reconciliación |
| **Coordinadora** | Webhook estado | Timeout, formato variable | Log por guía | Normalizar payload + retry |
| **Servientrega** | Webhook estado | Campos opcionales null | Básico | Validación robusta |
| **N8N** | Orquestador | Single point of failure | Dashboard N8N | Fallback local |

## Propuesta: Integration Gateway

```typescript
// services/integrations/IntegrationGateway.ts

interface IntegrationGateway {
  // Métodos unificados para todas las integraciones

  async sendMessage(provider: 'chatea' | 'twilio', params: MessageParams): Promise<Result>;
  async getOrderStatus(provider: 'dropi' | 'carrier', orderId: string): Promise<OrderStatus>;
  async updateStatus(provider: string, guiaId: string, status: string): Promise<Result>;

  // Circuit breaker integrado
  async withCircuitBreaker<T>(
    provider: string,
    fn: () => Promise<T>,
    fallback?: () => T
  ): Promise<T>;

  // Retry con backoff exponencial
  async withRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number,
    baseDelay: number
  ): Promise<T>;

  // Métricas automáticas
  recordMetric(provider: string, operation: string, duration: number, success: boolean): void;
}

// Implementación de adapter por proveedor
class ChateaAdapter implements IntegrationAdapter {
  private circuitBreaker = new CircuitBreaker({ failureThreshold: 5, resetTimeout: 60000 });

  async sendMessage(params: MessageParams): Promise<Result> {
    return this.circuitBreaker.execute(async () => {
      const response = await fetch(`${BACKEND_URL}/api/chatea/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      return response.json();
    });
  }
}

// Reconciliación automática
class ReconciliationService {
  async reconcileDropiWithCarriers(since: Date): Promise<ReconciliationReport> {
    // 1. Obtener estados de Dropi
    const dropiStates = await this.dropi.getOrdersSince(since);

    // 2. Obtener estados de transportadoras
    const carrierStates = await this.carriers.getTrackingSince(since);

    // 3. Comparar y detectar discrepancias
    const discrepancies = this.findDiscrepancies(dropiStates, carrierStates);

    // 4. Aplicar reglas de resolución
    const resolutions = discrepancies.map(d => this.suggestResolution(d));

    return { discrepancies, resolutions, timestamp: new Date() };
  }
}
```

---

# 6) SEGURIDAD Y COMPLIANCE

## Top 10 Riesgos de Seguridad

| # | Riesgo | Severidad | Ubicación | Solución |
|---|--------|-----------|-----------|----------|
| 1 | **Contraseñas hardcodeadas** | 🔴 CRÍTICO | authService.ts:71-174 | Migrar a Supabase Auth |
| 2 | **Hashing con Base64** | 🔴 CRÍTICO | authService.ts:189 | Implementar bcrypt |
| 3 | **API key en frontend** | 🔴 CRÍTICO | chateaService.ts:10 | Proxy por backend |
| 4 | **CORS permite todo** | 🔴 ALTO | main.py:254 | Lista blanca dominios |
| 5 | **Webhook sin HMAC** | 🔴 ALTO | webhookService.ts:316 | Implementar HMAC SHA256 |
| 6 | **Tokens en localStorage** | 🟠 MEDIO | authService.ts | httpOnly cookies |
| 7 | **Sin rate limiting** | 🟠 MEDIO | Backend | slowapi middleware |
| 8 | **Admin password débil** | 🟠 MEDIO | admin_routes.py:54 | Política de passwords |
| 9 | **Logs sin sanitizar** | 🟠 MEDIO | Varios | Redactar PII en logs |
| 10 | **Sin audit trail** | 🟡 BAJO | General | Tabla de auditoría |

## Soluciones Detalladas

### 1. Migrar a Supabase Auth
```typescript
// ANTES (inseguro)
const users = [
  { email: 'user@test.com', password: 'LP.USER_2024?Jm' }
];

// DESPUÉS (seguro)
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function login(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  return { data, error };
}
```

### 2. Implementar bcrypt
```typescript
// ANTES (inseguro)
const hashPassword = (password: string) => btoa(password + '_salt');

// DESPUÉS (seguro)
import bcrypt from 'bcryptjs';

const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
};

const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};
```

### 3. Proxy de API keys
```typescript
// Frontend: Solo llama al backend
async function sendWhatsApp(phone: string, message: string) {
  return fetch('/api/messaging/whatsapp', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${authToken}` },
    body: JSON.stringify({ phone, message })
  });
}

// Backend: Tiene la API key segura
@router.post("/api/messaging/whatsapp")
async def send_whatsapp(request: WhatsAppRequest, user: User = Depends(get_current_user)):
    api_key = os.getenv("CHATEA_API_KEY")  # Nunca expuesta al frontend
    return await chatea_client.send(request.phone, request.message)
```

### 4. CORS específico
```python
# ANTES
allow_origins=["*"]

# DESPUÉS
ALLOWED_ORIGINS = [
    "https://litper-pro.vercel.app",
    "https://app.litper.co",
]

if os.getenv("ENV") == "development":
    ALLOWED_ORIGINS.extend(["http://localhost:3000", "http://localhost:5173"])

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)
```

### 5. HMAC para webhooks
```typescript
import crypto from 'crypto';

function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(`sha256=${expectedSignature}`)
  );
}

// En el handler
app.post('/webhook', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const isValid = verifyWebhookSignature(
    JSON.stringify(req.body),
    signature,
    process.env.WEBHOOK_SECRET
  );

  if (!isValid) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Procesar webhook...
});
```

---

# 7) PERFORMANCE + COSTOS + ESCALABILIDAD

## Problemas de Performance Identificados

### Frontend
| Problema | Ubicación | Impacto | Solución |
|----------|-----------|---------|----------|
| Componente gigante | SeguimientoTab (2,227 líneas) | Re-renders lentos | Dividir + React.memo |
| Sin virtualización | Tablas con 500+ filas | Scroll lag | react-virtualized |
| Bundle grande | ~2MB estimado | TTFB alto | Code splitting |
| Sin lazy loading | Todos los tabs | Initial load | React.lazy() |

### Backend
| Problema | Ubicación | Impacto | Solución |
|----------|-----------|---------|----------|
| N+1 queries | guiasService.getAll() | DB saturada | JOINs + eager loading |
| Sin cache | Endpoints frecuentes | Latencia alta | Redis cache |
| Sync processing | Webhooks | Timeouts | Cola async |
| Large payloads | Export Excel | Memory spikes | Streaming |

## Métricas Propuestas

```typescript
// Dashboard de métricas recomendado
interface PerformanceMetrics {
  // Frontend
  TTFB: number;          // Target: < 200ms
  FCP: number;           // First Contentful Paint: < 1.5s
  LCP: number;           // Largest Contentful Paint: < 2.5s
  CLS: number;           // Cumulative Layout Shift: < 0.1

  // Backend
  p50_latency: number;   // Target: < 100ms
  p95_latency: number;   // Target: < 500ms
  p99_latency: number;   // Target: < 1000ms
  error_rate: number;    // Target: < 0.1%

  // Queues
  queue_depth: number;   // Target: < 100
  queue_time: number;    // Target: < 5s

  // Business
  webhook_success_rate: number;  // Target: > 99%
  cron_success_rate: number;     // Target: > 99.9%
}
```

## Plan de Optimización

### Fase 1: Quick Wins (1 semana)
- [ ] Agregar `React.memo` a componentes de lista
- [ ] Implementar paginación server-side en guías
- [ ] Agregar cache Redis para stats de dashboard
- [ ] Lazy load tabs no visibles

### Fase 2: 30 días
- [ ] Refactorizar SeguimientoTab en 5+ componentes
- [ ] Implementar virtualización para tablas
- [ ] Code splitting por ruta
- [ ] Optimizar queries con JOINs

### Fase 3: 90 días
- [ ] CDN para assets estáticos
- [ ] Service Worker para offline
- [ ] WebSocket para updates real-time
- [ ] Horizontal scaling backend

---

# 8) OBSERVABILIDAD Y CALIDAD

## Estado Actual
- ✅ Logs con Loguru (backend)
- ✅ Console.log básico (frontend)
- ❌ Sin tracing distribuido
- ❌ Sin métricas estructuradas
- ❌ Sin alerting automático
- ❌ Tests mínimos

## Propuesta de Observabilidad

```typescript
// Estándar de logging
interface LogEntry {
  timestamp: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  service: string;
  requestId: string;      // Correlation ID
  userId?: string;
  action: string;
  duration?: number;
  metadata: Record<string, unknown>;
  error?: {
    message: string;
    stack: string;
    code: string;
  };
}

// Ejemplo
logger.info({
  requestId: 'req_abc123',
  userId: 'user_456',
  action: 'guia.created',
  duration: 150,
  metadata: {
    guiaId: 'GUI-789',
    carrier: 'Coordinadora',
    city: 'Bogota'
  }
});
```

## Cobertura de Tests Requerida

| Área | Actual | Target | Tests Críticos |
|------|--------|--------|----------------|
| Services | ~5% | 80% | skillsService, authService |
| Components | ~0% | 60% | SeguimientoTab, GuideTable |
| API Routes | ~10% | 90% | webhooks, auth, guias |
| Integraciones | ~0% | 70% | Chatea, carriers |

---

# 9) ROADMAP PARA "TOP GLOBAL"

## P0: Urgente (Esta semana)

| # | Objetivo | Cambio Técnico | Riesgo | Dueño | Criterio de Aceptación |
|---|----------|----------------|--------|-------|------------------------|
| 1 | Eliminar passwords hardcodeadas | Migrar a Supabase Auth | Medio | Backend | 0 passwords en código |
| 2 | Hashing seguro | bcrypt en authService | Bajo | Backend | Todos los passwords hasheados |
| 3 | Ocultar API keys | Proxy endpoint /api/messaging | Bajo | Backend | 0 keys en frontend bundle |
| 4 | CORS específico | Lista blanca en main.py | Bajo | Backend | Solo dominios permitidos |
| 5 | Webhook HMAC | Verificación real en webhookService | Bajo | Full-stack | Webhooks firmados |

## P1: Productividad (2-4 semanas)

| # | Objetivo | Cambio Técnico | Riesgo | Dueño | Criterio de Aceptación |
|---|----------|----------------|--------|-------|------------------------|
| 6 | Refactorizar SeguimientoTab | Dividir en 5 componentes | Medio | Frontend | Cada componente < 300 líneas |
| 7 | Integration Gateway | Nuevo servicio con adapters | Medio | Backend | Todas las integraciones unificadas |
| 8 | Reconciliación Dropi | Job cada 15 min | Medio | Backend | < 5% discrepancias |
| 9 | Error handling global | Toast + ErrorBoundary | Bajo | Frontend | 0 errores silenciosos |
| 10 | Paginación server-side | API + frontend | Bajo | Full-stack | Soporta 10k+ guías |

## P2: IA/Automatización (1-3 meses)

| # | Objetivo | Cambio Técnico | Riesgo | Dueño | Criterio de Aceptación |
|---|----------|----------------|--------|-------|------------------------|
| 11 | 15 Skills nuevos | Implementar en skillsService | Bajo | Full-stack | Skills funcionales + tests |
| 12 | Modo seguro IA | SafeMode con confirmaciones | Bajo | Frontend | Acciones críticas confirmadas |
| 13 | Chat-first como default | Rediseño home | Medio | Frontend | > 50% usuarios usan chat |
| 14 | Detección anomalías ML | Modelo + job | Alto | Data/ML | Precisión > 80% |
| 15 | Automatizaciones sin código | UI de reglas | Medio | Full-stack | Usuarios crean reglas |

---

# E) GITHUB ISSUES LISTOS

## P0 - Seguridad Crítica

```markdown
### Issue #1: 🔴 [SECURITY] Migrar autenticación a Supabase Auth
**Prioridad:** P0 - CRÍTICO
**Estimación:** 3 días
**Labels:** security, backend, breaking-change

**Descripción:**
Actualmente hay 9 usuarios con contraseñas hardcodeadas en `authService.ts`.
Esto es una vulnerabilidad crítica.

**Tareas:**
- [ ] Crear usuarios en Supabase Auth
- [ ] Modificar `authService.ts` para usar Supabase
- [ ] Migrar tokens a httpOnly cookies
- [ ] Actualizar AuthWrapper component
- [ ] Eliminar passwords del código
- [ ] Agregar tests

**Archivos a modificar:**
- `services/authService.ts`
- `components/auth/AuthWrapper.tsx`
- `components/auth/LoginPage.tsx`
---

### Issue #2: 🔴 [SECURITY] Implementar bcrypt para hashing de contraseñas
**Prioridad:** P0 - CRÍTICO
**Estimación:** 1 día
**Labels:** security, backend

**Descripción:**
El hashing actual usa `btoa()` (Base64) que NO es criptográfico.

**Código actual:**
```typescript
const hashPassword = (password: string): string => {
  return btoa(password + '_litper_salt_2024');
};
```

**Solución:**
```typescript
import bcrypt from 'bcryptjs';
const hashPassword = async (pw: string) => bcrypt.hash(pw, 12);
```

---

### Issue #3: 🔴 [SECURITY] Mover API keys de Chatea a backend
**Prioridad:** P0 - CRÍTICO
**Estimación:** 2 días
**Labels:** security, backend, frontend

**Descripción:**
API key de Chatea está expuesta en el bundle del frontend.

**Archivo:** `services/chateaService.ts:10`

**Solución:**
1. Crear endpoint `/api/messaging/whatsapp` en backend
2. Backend usa la API key internamente
3. Frontend solo llama al backend con auth token

---

### Issue #4: 🔴 [SECURITY] Configurar CORS con dominios específicos
**Prioridad:** P0 - ALTO
**Estimación:** 2 horas
**Labels:** security, backend

**Archivo:** `backend/main.py:254`

**Cambio:**
```python
# De
allow_origins=["*"]

# A
allow_origins=[
    "https://litper-pro.vercel.app",
    "https://app.litper.co"
]
```

---

### Issue #5: 🔴 [SECURITY] Implementar verificación HMAC para webhooks
**Prioridad:** P0 - ALTO
**Estimación:** 1 día
**Labels:** security, backend, integrations

**Archivo:** `services/webhookService.ts:307-316`

**Problema:** La verificación actual es fake:
```typescript
return signature.length > 0 && secret.length > 0; // No verifica nada!
```

**Solución:** Implementar HMAC SHA256 real.
```

## P1 - Productividad

```markdown
### Issue #6: 🟠 [REFACTOR] Dividir SeguimientoTab en componentes modulares
**Prioridad:** P1
**Estimación:** 5 días
**Labels:** refactor, frontend, performance

**Problema:** `SeguimientoTab.tsx` tiene 2,227 líneas.

**Propuesta de división:**
1. `SeguimientoHeader.tsx` - Header con stats y acciones
2. `GuiaTable.tsx` - Tabla principal (ya existe parcialmente)
3. `GuiaFilters.tsx` - Panel de filtros
4. `GuiaReviewPanel.tsx` - Panel de revisión
5. `SeguimientoSheets.tsx` - Gestión de hojas

---

### Issue #7: 🟠 [ARCH] Implementar Integration Gateway pattern
**Prioridad:** P1
**Estimación:** 1 semana
**Labels:** architecture, backend, integrations

**Descripción:**
Crear capa de abstracción para todas las integraciones externas.

**Componentes:**
- `IntegrationGateway` - Interfaz unificada
- `ChateaAdapter` - Adapter para Chatea
- `DropiAdapter` - Adapter para Dropi
- `CarrierAdapter` - Adapter genérico transportadoras
- `CircuitBreaker` - Para manejo de fallos
- `RetryPolicy` - Reintentos con backoff

---

### Issue #8: 🟠 [FEATURE] Sistema de reconciliación Dropi-Transportadoras
**Prioridad:** P1
**Estimación:** 1 semana
**Labels:** feature, backend, integrations

**Descripción:**
Job automático que detecta y resuelve discrepancias de estados.

**Funcionalidad:**
- Ejecutar cada 15 minutos
- Comparar estados Dropi vs último estado transportadora
- Generar reporte de discrepancias
- Auto-resolver casos simples
- Alertar casos complejos

---

### Issue #9: 🟠 [UX] Implementar error handling global
**Prioridad:** P1
**Estimación:** 3 días
**Labels:** ux, frontend

**Componentes:**
- Toast notifications para errores recuperables
- ErrorBoundary para errores de React
- Retry automático para errores de red
- Modo offline con banner visible

---

### Issue #10: 🟠 [PERF] Paginación server-side para guías
**Prioridad:** P1
**Estimación:** 4 días
**Labels:** performance, backend, frontend

**Problema:** Actualmente se cargan todas las guías en memoria.

**Solución:**
- Backend: Endpoint con `?page=1&limit=50`
- Frontend: Hook `usePaginatedGuias()`
- Mantener filtros en URL params
```

## P2 - IA/Automatización

```markdown
### Issue #11: 🟢 [FEATURE] Implementar 6 skills de logística avanzada
**Prioridad:** P2
**Estimación:** 2 semanas
**Labels:** feature, ai, skills

**Skills a implementar:**
1. `conciliar` - Conciliar estados Dropi/Transportadora
2. `recotizar` - Reintentar cotización fallida
3. `anomalias` - Detectar anomalías con IA
4. `priorizar` - Priorizar casos por urgencia
5. `mensaje_cliente` - Generar mensaje personalizado
6. `clasificar_novedad` - Clasificar tipo de novedad

---

### Issue #12: 🟢 [FEATURE] Modo seguro IA con confirmaciones
**Prioridad:** P2
**Estimación:** 1 semana
**Labels:** feature, ai, ux

**Niveles:**
- SUGGEST_ONLY: Solo sugiere
- CONFIRM_ALWAYS: Siempre confirma
- CONFIRM_CRITICAL: Solo acciones de alto riesgo
- AUTONOMOUS: Ejecuta automáticamente

---

### Issue #13: 🟢 [UX] Rediseñar home como Chat-First
**Prioridad:** P2
**Estimación:** 1 semana
**Labels:** ux, frontend, ai

**Descripción:**
Hacer que el chat sea la interfaz principal, con skills visibles.

---

### Issue #14: 🟢 [AI] Modelo de detección de anomalías
**Prioridad:** P2
**Estimación:** 3 semanas
**Labels:** ai, ml, backend

**Enfoque:**
- Detectar desviaciones de baseline por ciudad/transportadora
- Alertar picos de devoluciones
- Identificar patrones de retraso

---

### Issue #15: 🟢 [FEATURE] Builder de automatizaciones sin código
**Prioridad:** P2
**Estimación:** 4 semanas
**Labels:** feature, frontend, automation

**UI para crear reglas:**
"SI [condición] ENTONCES [acción]"

Ejemplo:
"SI guía lleva +5 días ENTONCES enviar WhatsApp y escalar"
```

---

# F) ARQUITECTURA FINAL RECOMENDADA

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           LITPER PRO v6.0                               │
│                        Arquitectura Chat-First                          │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    CHAT COMMAND CENTER                           │   │
│  │  ┌───────────────────────────────────────────────────────────┐  │   │
│  │  │  💬 "Muéstrame las novedades de hoy"                      │  │   │
│  │  │                                                            │  │   │
│  │  │  🤖 Encontré 12 novedades. 5 son críticas:                │  │   │
│  │  │     [Ver Tabla] [Resolver Todas] [Exportar]               │  │   │
│  │  └───────────────────────────────────────────────────────────┘  │   │
│  │                                                                  │   │
│  │  Skills: 📦 Guías │ 🗺️ Ciudades │ ⚠️ Novedades │ 📊 Reportes  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────┐  ┌─────────────────────────────────────────┐  │
│  │    SKILL VIEWS      │  │          QUICK ACTIONS                  │  │
│  │  (Vistas detalladas │  │  [Cargar Guías] [Ver Semáforo]         │  │
│  │   por skill)        │  │  [Exportar] [Configuración]            │  │
│  └─────────────────────┘  └─────────────────────────────────────────┘  │
│                                                                         │
│  State: Zustand │ Auth: Supabase │ UI: TailwindCSS + Shadcn            │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTPS + WebSocket
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              BACKEND                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      API GATEWAY (FastAPI)                       │   │
│  │  /api/chat      → Chat + Skills execution                        │   │
│  │  /api/guias     → CRUD guías                                     │   │
│  │  /api/webhooks  → Recibir eventos                                │   │
│  │  /api/messaging → Proxy a Chatea (API keys seguras)              │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                    │
│         ┌──────────────────────────┼──────────────────────────┐        │
│         ▼                          ▼                          ▼        │
│  ┌─────────────┐          ┌─────────────┐          ┌─────────────┐    │
│  │   SKILLS    │          │   BRAIN     │          │ INTEGRATION │    │
│  │   ENGINE    │◄────────►│  AUTÓNOMO   │◄────────►│   GATEWAY   │    │
│  │             │          │             │          │             │    │
│  │ 24 Skills   │          │ Decisiones  │          │ Chatea      │    │
│  │ Registrados │          │ Proactivas  │          │ Dropi       │    │
│  │             │          │ ML Models   │          │ Carriers    │    │
│  └─────────────┘          └─────────────┘          └─────────────┘    │
│                                    │                                    │
│  ┌─────────────────────────────────▼───────────────────────────────┐   │
│  │                        TASK QUEUE (Redis)                        │   │
│  │  Priority queues: critical │ high │ normal │ low                 │   │
│  │  + Dead Letter Queue + Retry with exponential backoff            │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
           ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
           │ PostgreSQL  │  │    Redis    │  │  Supabase   │
           │ (Datos)     │  │ (Cache/Q)   │  │ (Auth)      │
           └─────────────┘  └─────────────┘  └─────────────┘
```

---

# CONCLUSIÓN

LITPER PRO tiene una base sólida con features innovadores (Skills, Brain, Gamification), pero necesita **correcciones de seguridad URGENTES** antes de escalar.

**Próximos pasos inmediatos:**
1. 🔴 Resolver los 5 issues de seguridad P0 esta semana
2. 🟠 Comenzar refactorización de SeguimientoTab
3. 🟢 Planificar implementación de skills nuevos

Con estas mejoras, LITPER PRO puede convertirse en una plataforma **top global** en logística e-commerce con IA.

---

*Auditoría realizada por Claude (Opus 4.5) - 28 de Diciembre 2024*
