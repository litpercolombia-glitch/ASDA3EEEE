# Sprint 1 — Guía paso a paso para conseguir las credenciales

> Para arrancar Sprint 1 (Supabase real + WhatsApp + Drive/Slack)
> necesito de ti 5 datos. Esta guía te lleva paso a paso a cada uno.

---

## 1️⃣ Supabase ASDA (logística) — ⚠️ BLOQUEA Sprint 1 entero

**Qué necesito**: Project URL + anon key.

**Pasos**:
1. https://supabase.com/dashboard
2. Login con la cuenta que creó el proyecto ASDA.
3. Click en el proyecto **ASDA** (NO el del semáforo).
4. Sidebar izquierdo: **⚙ Project Settings** → **API**
5. Copia:
   - **Project URL**: `https://________.supabase.co`
   - **anon / public** key (empieza por `eyJhbGc...`)

⚠️ **NO me pases la `service_role`**. Esa es la que da acceso total — quédatela tú.

**Cómo pasármelas (escoge una)**:
- A) Pégalas en el modal **Conexiones** de LITPER DESK (queda solo en tu PC, no se sube a git)
- B) Mensaje aquí en el chat — las uso para los SQL de migración pero no las commit
- C) Edita `electron/.env.local` (gitignored) en tu copia local y me dices "ya están"

---

## 2️⃣ Supabase Semáforo — solo anon key

**URL ya la tengo**: `https://gtsivwbnhcawvmsfujby.supabase.co`

**Pasos**:
1. Mismo dashboard https://supabase.com/dashboard
2. Click proyecto del **semáforo**.
3. **⚙ Project Settings** → **API** → copia **anon / public** key.

---

## 3️⃣ Backend ASDA (FastAPI Python)

**Escenario A — Solo localhost cuando trabajas**:
- Avísame "solo local". Yo te configuro **Cloudflare Tunnel** (gratis) → `localhost:8000` queda accesible como `https://api-asda.litper.com` sin abrir puertos. Setup en 10 min.

**Escenario B — Ya está desplegado**:
- Pásame la URL pública (Vercel, Railway, Render, lo que sea).

**Escenario C — No está desplegado en ningún lado**:
- Te ayudo a deploy en **Railway** ($5/mes, FastAPI nativo, fácil) o **Fly.io** (free tier). Tarda ~30 min.

---

## 4️⃣ WhatsApp Cloud — Phone Number ID + System User Token

Lo más complejo. Tienes 2 caminos:

### Camino A — Meta directo (gratis, más control, 1-3 horas si todo va bien)

#### 4.A.1. Phone Number ID

1. https://business.facebook.com/wa/manage
2. Si no tienes cuenta WhatsApp Business API:
   - **Add new account** → seguir wizard
   - Necesitas un número **NO usado en WhatsApp normal**
3. Click en tu número de teléfono → columna derecha → **Phone number ID** (15 dígitos) → copia.

#### 4.A.2. System User Access Token (permanente, NO el de 24h)

1. https://business.facebook.com/settings (Business Manager Settings)
2. Sidebar: **Users** → **System Users**
3. **Add** → nombre `"Litper Desk"`, role `"Admin"` → crear
4. Selecciona el system user creado.
5. **Add Assets** → conecta:
   - **WhatsApp Business Account** (permiso "Manage")
   - **App de Meta** (permiso "Develop & Manage")
6. **Generate New Token**:
   - App: tu app
   - **Token expiration: Never**
   - Permisos (marca todos):
     - `whatsapp_business_messaging`
     - `whatsapp_business_management`
     - `business_management`
   - **Generate Token** → cópialo INMEDIATAMENTE (no se vuelve a mostrar).

**Docs oficiales**:
https://developers.facebook.com/docs/whatsapp/business-management-api/get-started

### Camino B — ChateaPro (más rápido, ya integrado en tu backend)

Veo que `backend/integrations/chatea_pro.py` ya existe. Si prefieres saltarte Meta:

1. https://chateapro.app → tu cuenta → **API Settings**
2. Copia tu **API Key** (empieza por `cp_`)
3. Eso va en el campo `chateaProApiKey` del modal Conexiones de LITPER DESK.

ChateaPro es BSP licenciado de Meta. Más rápido pero le pagas mensualidad.

---

## 5️⃣ Google Drive folder — para PDFs diarios

1. https://drive.google.com
2. Click derecho en cualquier carpeta → **Nueva carpeta** → `litper-desk-reportes`
3. Abre la carpeta.
4. La URL será: `https://drive.google.com/drive/folders/XXXXXXXXXXXXXX`
5. Esa parte después de `/folders/` es el **folder ID** → copia.

---

## 6️⃣ Slack canal — para alertas

Solo el nombre del canal. Default: `#ops`.
Si no existe: en Slack → `+` → nuevo canal → nombre → crear.

---

## Resumen — qué bloquea qué

| Item | Bloquea | Tiempo de obtención |
|------|---------|---------------------|
| 1. Supabase ASDA URL/key | Sprint 1 entero | 2 min |
| 2. Supabase Semáforo key | Botón Semáforo | 2 min |
| 3. Backend ASDA URL | WhatsApp + tracking real | depende escenario |
| 4. WhatsApp token (Meta) | Conector WhatsApp Sprint 2 | 1-3 horas |
| 4-alt. ChateaPro key | Conector WhatsApp Sprint 2 | 5 min |
| 5. Drive folder ID | PDF auto-upload Sprint 2 | 1 min |
| 6. Slack canal | Alertas Sprint 2 | 1 min |

**Si solo tienes 5 minutos**: dame Supabase ASDA + Semáforo. Con eso ya arranco Sprint 1.
