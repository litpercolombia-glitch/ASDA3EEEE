# 🚀 PLAN TÉCNICO: Sistema de Tracking de Marketing Digital
## Implementación Real con OAuth - Meta, Google, TikTok

---

## 📁 ESTRUCTURA DE ARCHIVOS EXACTA

```
/home/user/ASDA3EEEE/
├── components/
│   └── marketing/                          # 🆕 NUEVO MÓDULO
│       ├── MarketingModule.tsx             # Módulo principal (entry point)
│       ├── MarketingLayout.tsx             # Layout con navegación
│       │
│       ├── dashboard/                      # Dashboard Principal
│       │   ├── MarketingDashboard.tsx      # Dashboard de KPIs
│       │   ├── KPICard.tsx                 # Card de métrica
│       │   ├── ROASWidget.tsx              # Widget ROAS destacado
│       │   ├── SalesMethodChart.tsx        # Gráfico métodos de pago
│       │   ├── ConversionFunnel.tsx        # Embudo conversión
│       │   ├── CostBreakdown.tsx           # Desglose de costos
│       │   └── PlatformFilter.tsx          # Filtros globales
│       │
│       ├── platforms/                      # Plataformas Publicitarias
│       │   ├── meta/                       # Facebook/Instagram
│       │   │   ├── MetaConnect.tsx         # ⭐ Botón OAuth Facebook
│       │   │   ├── MetaDashboard.tsx       # Dashboard Meta
│       │   │   ├── MetaAccounts.tsx        # Pestaña Cuentas
│       │   │   ├── MetaCampaigns.tsx       # Pestaña Campañas
│       │   │   ├── MetaAdSets.tsx          # Pestaña Conjuntos
│       │   │   ├── MetaAds.tsx             # Pestaña Anuncios
│       │   │   └── MetaCampaignRow.tsx     # Fila de campaña con toggle
│       │   │
│       │   ├── google/                     # Google Ads
│       │   │   ├── GoogleConnect.tsx       # ⭐ Botón OAuth Google
│       │   │   ├── GoogleDashboard.tsx     # Dashboard Google
│       │   │   ├── GoogleAccounts.tsx      # Pestaña Cuentas
│       │   │   ├── GoogleCampaigns.tsx     # Pestaña Campañas
│       │   │   ├── GoogleAdGroups.tsx      # Pestaña Grupos
│       │   │   ├── GoogleAds.tsx           # Pestaña Anuncios
│       │   │   └── GoogleKeywords.tsx      # Palabras clave
│       │   │
│       │   └── tiktok/                     # TikTok Ads
│       │       ├── TikTokConnect.tsx       # ⭐ Botón OAuth TikTok
│       │       ├── TikTokDashboard.tsx     # Dashboard TikTok
│       │       ├── TikTokAccounts.tsx      # Pestaña Cuentas
│       │       ├── TikTokCampaigns.tsx     # Pestaña Campañas
│       │       ├── TikTokAdGroups.tsx      # Pestaña Grupos
│       │       └── TikTokAds.tsx           # Pestaña Anuncios
│       │
│       ├── utm/                            # Sistema UTM
│       │   ├── UTMDashboard.tsx            # Dashboard UTMs
│       │   ├── UTMTable.tsx                # Tabla con métricas
│       │   ├── UTMBuilder.tsx              # Constructor de URLs
│       │   ├── UTMScriptGenerator.tsx      # Generador de scripts
│       │   └── UTMAttribution.tsx          # Atribución de ventas
│       │
│       ├── integrations/                   # Integraciones
│       │   ├── IntegrationsDashboard.tsx   # Dashboard integraciones
│       │   ├── PlatformConnector.tsx       # Conector universal
│       │   ├── WebhooksManager.tsx         # Gestión webhooks
│       │   ├── PixelManager.tsx            # Gestión píxeles
│       │   ├── WebhookLogs.tsx             # Logs de webhooks
│       │   └── IntegrationTest.tsx         # Pruebas
│       │
│       ├── rules/                          # Automatización
│       │   ├── RulesDashboard.tsx          # Lista de reglas
│       │   ├── RuleCreator.tsx             # Crear/editar regla
│       │   ├── ConditionBuilder.tsx        # Constructor condiciones
│       │   ├── ActionSelector.tsx          # Selector acciones
│       │   └── RuleExecutionLog.tsx        # Historial ejecuciones
│       │
│       ├── expenses/                       # Gastos
│       │   ├── ExpensesDashboard.tsx       # Dashboard gastos
│       │   ├── ExpenseForm.tsx             # Formulario gasto
│       │   ├── ExpensesList.tsx            # Lista gastos
│       │   └── ExpensesSummary.tsx         # Resumen
│       │
│       ├── fees/                           # Tasas/Impuestos
│       │   ├── FeesDashboard.tsx           # Dashboard tasas
│       │   ├── TaxConfig.tsx               # Config impuestos
│       │   ├── PaymentFees.tsx             # Tasas de pago
│       │   └── ProductCosts.tsx            # Costos productos
│       │
│       ├── reports/                        # Informes
│       │   ├── ReportsDashboard.tsx        # Dashboard informes
│       │   ├── ReportBuilder.tsx           # Constructor reportes
│       │   ├── ReportScheduler.tsx         # Programar envío
│       │   └── ReportExporter.tsx          # Exportar
│       │
│       └── shared/                         # Componentes compartidos
│           ├── PlatformIcon.tsx            # Iconos de plataformas
│           ├── MetricTrend.tsx             # Indicador tendencia ↑↓
│           ├── DateRangePicker.tsx         # Selector período
│           ├── CampaignStatusBadge.tsx     # Badge estado
│           ├── BulkActionsBar.tsx          # Acciones en lote
│           └── DataTable.tsx               # Tabla reutilizable
│
├── services/
│   └── marketing/                          # 🆕 SERVICIOS MARKETING
│       ├── index.ts                        # Exports
│       │
│       ├── oauth/                          # ⭐ OAuth Providers
│       │   ├── OAuthManager.ts             # Gestor OAuth central
│       │   ├── MetaOAuth.ts                # OAuth Facebook/Meta
│       │   ├── GoogleOAuth.ts              # OAuth Google
│       │   └── TikTokOAuth.ts              # OAuth TikTok
│       │
│       ├── api/                            # APIs de Plataformas
│       │   ├── MetaAdsAPI.ts               # Facebook Marketing API
│       │   ├── GoogleAdsAPI.ts             # Google Ads API
│       │   └── TikTokAdsAPI.ts             # TikTok Marketing API
│       │
│       ├── metrics/                        # Cálculo de Métricas
│       │   ├── MetricsCalculator.ts        # Calculador central
│       │   ├── ROASCalculator.ts           # Cálculo ROAS
│       │   ├── AttributionService.ts       # Atribución UTM
│       │   └── AggregationService.ts       # Agregación datos
│       │
│       ├── sync/                           # Sincronización
│       │   ├── SyncManager.ts              # Gestor sincronización
│       │   ├── MetaSync.ts                 # Sync Meta
│       │   ├── GoogleSync.ts               # Sync Google
│       │   └── TikTokSync.ts               # Sync TikTok
│       │
│       ├── webhooks/                       # Webhooks
│       │   ├── WebhookProcessor.ts         # Procesador central
│       │   ├── HotmartWebhook.ts           # Hotmart
│       │   ├── KiwifyWebhook.ts            # Kiwify
│       │   └── ShopifyWebhook.ts           # Shopify
│       │
│       ├── rules/                          # Motor de Reglas
│       │   ├── RulesEngine.ts              # Motor principal
│       │   ├── ConditionEvaluator.ts       # Evaluador condiciones
│       │   └── ActionExecutor.ts           # Ejecutor acciones
│       │
│       └── utm/                            # UTM Service
│           ├── UTMService.ts               # Servicio principal
│           ├── UTMCapture.ts               # Captura frontend
│           └── UTMAttribution.ts           # Atribución
│
├── stores/
│   └── marketingStore.ts                   # 🆕 Store Zustand
│
├── types/
│   └── marketing.types.ts                  # 🆕 Tipos TypeScript
│
├── hooks/
│   ├── useMarketingMetrics.ts              # 🆕 Hook métricas
│   ├── useAdPlatform.ts                    # 🆕 Hook plataformas
│   └── useUTMTracking.ts                   # 🆕 Hook UTMs
│
└── api/                                    # 🆕 API Routes (Backend)
    └── marketing/
        ├── oauth/
        │   ├── meta/
        │   │   ├── callback.ts             # Callback OAuth Meta
        │   │   └── route.ts                # Iniciar OAuth Meta
        │   ├── google/
        │   │   ├── callback.ts             # Callback OAuth Google
        │   │   └── route.ts                # Iniciar OAuth Google
        │   └── tiktok/
        │       ├── callback.ts             # Callback OAuth TikTok
        │       └── route.ts                # Iniciar OAuth TikTok
        ├── webhooks/
        │   ├── hotmart.ts                  # Webhook Hotmart
        │   ├── kiwify.ts                   # Webhook Kiwify
        │   └── shopify.ts                  # Webhook Shopify
        └── sync/
            ├── meta.ts                     # Sync Meta
            ├── google.ts                   # Sync Google
            └── tiktok.ts                   # Sync TikTok
```

---

## 🔐 IMPLEMENTACIÓN OAUTH REAL

### 1. META (Facebook/Instagram) - OAuth 2.0

#### Requisitos Previos:
1. Crear App en [developers.facebook.com](https://developers.facebook.com)
2. Agregar producto "Marketing API"
3. Configurar redirect URI: `https://tu-app.com/api/marketing/oauth/meta/callback`
4. Obtener App ID y App Secret

#### Flujo de Conexión:

```typescript
// services/marketing/oauth/MetaOAuth.ts

const META_CONFIG = {
  appId: process.env.VITE_META_APP_ID,
  appSecret: process.env.VITE_META_APP_SECRET, // Solo en backend
  redirectUri: `${window.location.origin}/api/marketing/oauth/meta/callback`,
  scopes: [
    'ads_management',           // Gestionar campañas
    'ads_read',                 // Leer métricas
    'business_management',      // Gestionar Business Manager
    'pages_read_engagement',    // Leer páginas
    'pages_show_list',          // Listar páginas
  ].join(','),
};

export class MetaOAuth {
  // 1. Generar URL de autorización
  static getAuthUrl(): string {
    const state = crypto.randomUUID(); // Anti-CSRF
    sessionStorage.setItem('meta_oauth_state', state);

    return `https://www.facebook.com/v18.0/dialog/oauth?` +
      `client_id=${META_CONFIG.appId}` +
      `&redirect_uri=${encodeURIComponent(META_CONFIG.redirectUri)}` +
      `&scope=${META_CONFIG.scopes}` +
      `&state=${state}` +
      `&response_type=code`;
  }

  // 2. Abrir popup de Facebook
  static connect(): Promise<MetaAuthResult> {
    return new Promise((resolve, reject) => {
      const authUrl = this.getAuthUrl();
      const width = 600, height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const popup = window.open(
        authUrl,
        'meta_oauth',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      // Escuchar mensaje del callback
      window.addEventListener('message', function handler(event) {
        if (event.data.type === 'META_OAUTH_SUCCESS') {
          window.removeEventListener('message', handler);
          popup?.close();
          resolve(event.data.payload);
        } else if (event.data.type === 'META_OAUTH_ERROR') {
          window.removeEventListener('message', handler);
          popup?.close();
          reject(new Error(event.data.error));
        }
      });
    });
  }
}
```

#### Componente de Conexión:

```tsx
// components/marketing/platforms/meta/MetaConnect.tsx

import { useState } from 'react';
import { Facebook, Check, Loader2, AlertCircle } from 'lucide-react';
import { MetaOAuth } from '@/services/marketing/oauth/MetaOAuth';
import { useMarketingStore } from '@/stores/marketingStore';

export function MetaConnect() {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const { metaAccounts, setMetaAccounts, setMetaToken } = useMarketingStore();

  const isConnected = metaAccounts.length > 0;

  const handleConnect = async () => {
    try {
      setStatus('connecting');
      setError(null);

      // Abre popup de Facebook
      const result = await MetaOAuth.connect();

      // Guardar token y cuentas
      setMetaToken(result.accessToken);
      setMetaAccounts(result.adAccounts);

      setStatus('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión');
      setStatus('error');
    }
  };

  const handleDisconnect = () => {
    setMetaToken(null);
    setMetaAccounts([]);
    setStatus('idle');
  };

  return (
    <div className="p-6 bg-gray-800/50 rounded-xl border border-gray-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600 rounded-xl">
            <Facebook className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Meta Ads</h3>
            <p className="text-sm text-gray-400">Facebook e Instagram Ads</p>
          </div>
        </div>

        {isConnected ? (
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 text-green-400">
              <Check className="w-4 h-4" />
              {metaAccounts.length} cuenta(s) conectada(s)
            </span>
            <button
              onClick={handleDisconnect}
              className="px-4 py-2 text-red-400 border border-red-400/50 rounded-lg hover:bg-red-400/10"
            >
              Desconectar
            </button>
          </div>
        ) : (
          <button
            onClick={handleConnect}
            disabled={status === 'connecting'}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {status === 'connecting' ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Conectando...</>
            ) : (
              <><Facebook className="w-5 h-5" /> Conectar con Facebook</>
            )}
          </button>
        )}
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center gap-2 text-red-400">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {isConnected && (
        <div className="mt-4 space-y-2">
          <p className="text-sm text-gray-400">Cuentas publicitarias:</p>
          <div className="flex flex-wrap gap-2">
            {metaAccounts.map((account) => (
              <span key={account.id} className="px-3 py-1 bg-gray-700 rounded-full text-sm text-white">
                {account.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

---

### 2. GOOGLE ADS - OAuth 2.0

#### Requisitos Previos:
1. Crear proyecto en [Google Cloud Console](https://console.cloud.google.com)
2. Habilitar Google Ads API
3. Crear credenciales OAuth 2.0
4. Solicitar Developer Token en Google Ads

```typescript
// services/marketing/oauth/GoogleOAuth.ts

const GOOGLE_CONFIG = {
  clientId: process.env.VITE_GOOGLE_CLIENT_ID,
  clientSecret: process.env.VITE_GOOGLE_CLIENT_SECRET, // Solo backend
  developerToken: process.env.VITE_GOOGLE_DEVELOPER_TOKEN, // Solo backend
  redirectUri: `${window.location.origin}/api/marketing/oauth/google/callback`,
  scopes: [
    'https://www.googleapis.com/auth/adwords',  // Google Ads completo
  ].join(' '),
};

export class GoogleOAuth {
  static getAuthUrl(): string {
    const state = crypto.randomUUID();
    sessionStorage.setItem('google_oauth_state', state);

    return `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${GOOGLE_CONFIG.clientId}` +
      `&redirect_uri=${encodeURIComponent(GOOGLE_CONFIG.redirectUri)}` +
      `&scope=${encodeURIComponent(GOOGLE_CONFIG.scopes)}` +
      `&state=${state}` +
      `&response_type=code` +
      `&access_type=offline` +  // Para refresh token
      `&prompt=consent`;        // Siempre pedir consentimiento
  }

  static connect(): Promise<GoogleAuthResult> {
    return new Promise((resolve, reject) => {
      const authUrl = this.getAuthUrl();
      const popup = window.open(authUrl, 'google_oauth', 'width=600,height=700');

      window.addEventListener('message', function handler(event) {
        if (event.data.type === 'GOOGLE_OAUTH_SUCCESS') {
          window.removeEventListener('message', handler);
          popup?.close();
          resolve(event.data.payload);
        } else if (event.data.type === 'GOOGLE_OAUTH_ERROR') {
          window.removeEventListener('message', handler);
          popup?.close();
          reject(new Error(event.data.error));
        }
      });
    });
  }
}
```

---

### 3. TIKTOK ADS - OAuth 2.0

#### Requisitos Previos:
1. Crear App en [TikTok for Business Developers](https://business-api.tiktok.com)
2. Solicitar acceso a Marketing API
3. Configurar redirect URI

```typescript
// services/marketing/oauth/TikTokOAuth.ts

const TIKTOK_CONFIG = {
  appId: process.env.VITE_TIKTOK_APP_ID,
  appSecret: process.env.VITE_TIKTOK_APP_SECRET, // Solo backend
  redirectUri: `${window.location.origin}/api/marketing/oauth/tiktok/callback`,
};

export class TikTokOAuth {
  static getAuthUrl(): string {
    const state = crypto.randomUUID();
    sessionStorage.setItem('tiktok_oauth_state', state);

    return `https://business-api.tiktok.com/portal/auth?` +
      `app_id=${TIKTOK_CONFIG.appId}` +
      `&redirect_uri=${encodeURIComponent(TIKTOK_CONFIG.redirectUri)}` +
      `&state=${state}`;
  }

  static connect(): Promise<TikTokAuthResult> {
    return new Promise((resolve, reject) => {
      const authUrl = this.getAuthUrl();
      const popup = window.open(authUrl, 'tiktok_oauth', 'width=600,height=700');

      window.addEventListener('message', function handler(event) {
        if (event.data.type === 'TIKTOK_OAUTH_SUCCESS') {
          window.removeEventListener('message', handler);
          popup?.close();
          resolve(event.data.payload);
        } else if (event.data.type === 'TIKTOK_OAUTH_ERROR') {
          window.removeEventListener('message', handler);
          popup?.close();
          reject(new Error(event.data.error));
        }
      });
    });
  }
}
```

---

## 🗄️ BASE DE DATOS (Supabase)

### Nuevas Tablas:

```sql
-- =============================================
-- CUENTAS PUBLICITARIAS
-- =============================================

CREATE TABLE ad_platform_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES usuarios(id),
  platform TEXT NOT NULL CHECK (platform IN ('meta', 'google', 'tiktok')),
  access_token TEXT NOT NULL,           -- Encriptado
  refresh_token TEXT,                   -- Encriptado
  token_expires_at TIMESTAMPTZ,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  last_sync_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),
  UNIQUE(user_id, platform)
);

CREATE TABLE ad_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID REFERENCES ad_platform_connections(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  external_id TEXT NOT NULL,            -- ID en la plataforma
  name TEXT NOT NULL,
  currency TEXT DEFAULT 'USD',
  timezone TEXT,
  status TEXT DEFAULT 'active',
  is_selected BOOLEAN DEFAULT true,     -- Si está seleccionada para tracking
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(platform, external_id)
);

-- =============================================
-- CAMPAÑAS, CONJUNTOS Y ANUNCIOS
-- =============================================

CREATE TABLE ad_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES ad_accounts(id) ON DELETE CASCADE,
  external_id TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT,                          -- active, paused, deleted
  objective TEXT,                       -- conversions, traffic, etc.
  budget_type TEXT,                     -- daily, lifetime
  budget_amount DECIMAL(12,2),
  start_date DATE,
  end_date DATE,

  -- Métricas (actualizadas por sync)
  impressions BIGINT DEFAULT 0,
  clicks BIGINT DEFAULT 0,
  spend DECIMAL(12,2) DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue DECIMAL(12,2) DEFAULT 0,

  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(account_id, external_id)
);

CREATE TABLE ad_adsets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES ad_campaigns(id) ON DELETE CASCADE,
  external_id TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT,
  targeting JSONB,                      -- Segmentación
  placements JSONB,                     -- Ubicaciones
  budget_amount DECIMAL(12,2),

  -- Métricas
  impressions BIGINT DEFAULT 0,
  clicks BIGINT DEFAULT 0,
  spend DECIMAL(12,2) DEFAULT 0,
  conversions INTEGER DEFAULT 0,

  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ad_ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adset_id UUID REFERENCES ad_adsets(id) ON DELETE CASCADE,
  external_id TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT,
  format TEXT,                          -- image, video, carousel
  preview_url TEXT,
  creative JSONB,

  -- Métricas
  impressions BIGINT DEFAULT 0,
  clicks BIGINT DEFAULT 0,
  spend DECIMAL(12,2) DEFAULT 0,
  conversions INTEGER DEFAULT 0,

  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- UTMs Y ATRIBUCIÓN
-- =============================================

CREATE TABLE utm_captures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  landing_page TEXT,
  referrer TEXT,
  user_agent TEXT,
  ip_address INET,
  country_code TEXT,
  captured_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_utm_captures_session ON utm_captures(session_id);
CREATE INDEX idx_utm_captures_source ON utm_captures(utm_source);
CREATE INDEX idx_utm_captures_campaign ON utm_captures(utm_campaign);

CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT,                     -- ID de Hotmart, Kiwify, etc.
  platform TEXT,                        -- hotmart, kiwify, shopify

  -- Datos de venta
  product_id TEXT,
  product_name TEXT,
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'COP',
  status TEXT,                          -- pending, approved, refunded
  payment_method TEXT,

  -- Cliente
  customer_email TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  customer_country TEXT,

  -- Atribución UTM
  utm_capture_id UUID REFERENCES utm_captures(id),
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,

  -- Atribución a Ads
  ad_account_id UUID REFERENCES ad_accounts(id),
  campaign_id UUID REFERENCES ad_campaigns(id),
  adset_id UUID REFERENCES ad_adsets(id),
  ad_id UUID REFERENCES ad_ads(id),

  sold_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sales_utm ON sales(utm_source, utm_campaign);
CREATE INDEX idx_sales_platform ON sales(platform);
CREATE INDEX idx_sales_date ON sales(sold_at);

-- =============================================
-- WEBHOOKS
-- =============================================

CREATE TABLE webhook_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES usuarios(id),
  name TEXT NOT NULL,
  platform TEXT NOT NULL,               -- hotmart, kiwify, shopify
  secret_key TEXT NOT NULL,             -- Para verificar firmas
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint_id UUID REFERENCES webhook_endpoints(id),
  payload JSONB,
  headers JSONB,
  status TEXT,                          -- success, error
  error_message TEXT,
  processed_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- REGLAS DE AUTOMATIZACIÓN
-- =============================================

CREATE TABLE automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES usuarios(id),
  name TEXT NOT NULL,
  platform TEXT,                        -- meta, google, tiktok
  applies_to TEXT,                      -- campaigns, adsets, ads

  conditions JSONB NOT NULL,            -- Array de condiciones
  actions JSONB NOT NULL,               -- Array de acciones

  frequency TEXT,                       -- hourly, daily, etc.
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE rule_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID REFERENCES automation_rules(id),
  triggered_by TEXT,                    -- entity que disparó
  conditions_met JSONB,
  actions_taken JSONB,
  status TEXT,                          -- success, partial, error
  error_message TEXT,
  executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- GASTOS Y COSTOS
-- =============================================

CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES usuarios(id),
  category TEXT NOT NULL,               -- ads, tools, team, etc.
  description TEXT,
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'COP',
  expense_type TEXT,                    -- one_time, recurring
  recurring_frequency TEXT,             -- monthly, weekly
  expense_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE product_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES usuarios(id),
  product_id TEXT,
  product_name TEXT NOT NULL,
  sale_price DECIMAL(12,2),
  cost DECIMAL(12,2),
  margin_percent DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE taxes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES usuarios(id),
  country_code TEXT NOT NULL,           -- CO, CL, EC
  name TEXT NOT NULL,
  percentage DECIMAL(5,2) NOT NULL,
  is_active BOOLEAN DEFAULT true
);

-- Insertar impuestos por defecto
INSERT INTO taxes (user_id, country_code, name, percentage) VALUES
  (NULL, 'CO', 'IVA Colombia', 19.00),
  (NULL, 'CL', 'IVA Chile', 19.00),
  (NULL, 'EC', 'IVA Ecuador', 12.00);

CREATE TABLE payment_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES usuarios(id),
  payment_method TEXT NOT NULL,
  fee_type TEXT,                        -- percentage, fixed
  fee_value DECIMAL(10,4),
  country_code TEXT
);

-- Insertar tasas por defecto Colombia
INSERT INTO payment_fees (user_id, payment_method, fee_type, fee_value, country_code) VALUES
  (NULL, 'pse', 'fixed', 3500, 'CO'),
  (NULL, 'credit_card', 'percentage', 3.49, 'CO'),
  (NULL, 'nequi', 'percentage', 1.5, 'CO'),
  (NULL, 'efecty', 'fixed', 5000, 'CO');

-- =============================================
-- PÍXELES
-- =============================================

CREATE TABLE pixels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES usuarios(id),
  name TEXT NOT NULL,
  platform TEXT NOT NULL,               -- meta, google, tiktok
  pixel_id TEXT NOT NULL,
  events JSONB DEFAULT '[]',            -- Eventos configurados
  is_active BOOLEAN DEFAULT true,
  last_event_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 📊 STORE DE ZUSTAND

```typescript
// stores/marketingStore.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface MarketingState {
  // Conexiones
  metaToken: string | null;
  googleToken: string | null;
  tiktokToken: string | null;

  // Cuentas
  metaAccounts: AdAccount[];
  googleAccounts: AdAccount[];
  tiktokAccounts: AdAccount[];

  // Campañas activas
  campaigns: Campaign[];
  selectedCampaigns: string[];

  // Filtros
  dateRange: { start: Date; end: Date };
  selectedPlatforms: ('meta' | 'google' | 'tiktok')[];
  selectedAccounts: string[];

  // Métricas agregadas
  metrics: AggregatedMetrics | null;

  // Estado de sync
  lastSync: Date | null;
  isSyncing: boolean;

  // Actions
  setMetaToken: (token: string | null) => void;
  setMetaAccounts: (accounts: AdAccount[]) => void;
  setGoogleToken: (token: string | null) => void;
  setGoogleAccounts: (accounts: AdAccount[]) => void;
  setTikTokToken: (token: string | null) => void;
  setTikTokAccounts: (accounts: AdAccount[]) => void;

  setCampaigns: (campaigns: Campaign[]) => void;
  toggleCampaignSelection: (id: string) => void;

  setDateRange: (range: { start: Date; end: Date }) => void;
  setSelectedPlatforms: (platforms: ('meta' | 'google' | 'tiktok')[]) => void;

  setMetrics: (metrics: AggregatedMetrics) => void;
  setSyncing: (syncing: boolean) => void;

  // Computed
  isConnected: (platform: 'meta' | 'google' | 'tiktok') => boolean;
  getAccountsByPlatform: (platform: string) => AdAccount[];
}

export const useMarketingStore = create<MarketingState>()(
  persist(
    (set, get) => ({
      metaToken: null,
      googleToken: null,
      tiktokToken: null,
      metaAccounts: [],
      googleAccounts: [],
      tiktokAccounts: [],
      campaigns: [],
      selectedCampaigns: [],
      dateRange: {
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        end: new Date(),
      },
      selectedPlatforms: ['meta', 'google', 'tiktok'],
      selectedAccounts: [],
      metrics: null,
      lastSync: null,
      isSyncing: false,

      setMetaToken: (token) => set({ metaToken: token }),
      setMetaAccounts: (accounts) => set({ metaAccounts: accounts }),
      setGoogleToken: (token) => set({ googleToken: token }),
      setGoogleAccounts: (accounts) => set({ googleAccounts: accounts }),
      setTikTokToken: (token) => set({ tiktokToken: token }),
      setTikTokAccounts: (accounts) => set({ tiktokAccounts: accounts }),

      setCampaigns: (campaigns) => set({ campaigns }),
      toggleCampaignSelection: (id) => set((state) => ({
        selectedCampaigns: state.selectedCampaigns.includes(id)
          ? state.selectedCampaigns.filter((c) => c !== id)
          : [...state.selectedCampaigns, id],
      })),

      setDateRange: (range) => set({ dateRange: range }),
      setSelectedPlatforms: (platforms) => set({ selectedPlatforms: platforms }),

      setMetrics: (metrics) => set({ metrics, lastSync: new Date() }),
      setSyncing: (syncing) => set({ isSyncing: syncing }),

      isConnected: (platform) => {
        const state = get();
        switch (platform) {
          case 'meta': return !!state.metaToken;
          case 'google': return !!state.googleToken;
          case 'tiktok': return !!state.tiktokToken;
          default: return false;
        }
      },

      getAccountsByPlatform: (platform) => {
        const state = get();
        switch (platform) {
          case 'meta': return state.metaAccounts;
          case 'google': return state.googleAccounts;
          case 'tiktok': return state.tiktokAccounts;
          default: return [];
        }
      },
    }),
    {
      name: 'litper-marketing-store',
      partialize: (state) => ({
        // Solo persistir tokens y cuentas, no datos temporales
        metaToken: state.metaToken,
        googleToken: state.googleToken,
        tiktokToken: state.tiktokToken,
        metaAccounts: state.metaAccounts,
        googleAccounts: state.googleAccounts,
        tiktokAccounts: state.tiktokAccounts,
        dateRange: state.dateRange,
        selectedPlatforms: state.selectedPlatforms,
      }),
    }
  )
);
```

---

## 🎯 FLUJO DE USUARIO

### Conectar Facebook Ads:

```
1. Usuario hace clic en "Conectar con Facebook"
                    ↓
2. Se abre popup de Facebook Login
                    ↓
3. Usuario inicia sesión y autoriza permisos
                    ↓
4. Facebook redirige a /api/marketing/oauth/meta/callback
                    ↓
5. Backend intercambia code por access_token
                    ↓
6. Backend obtiene lista de cuentas publicitarias
                    ↓
7. Popup envía mensaje al frontend con token + cuentas
                    ↓
8. Frontend guarda en store y muestra cuentas
                    ↓
9. Usuario selecciona qué cuentas quiere trackear
                    ↓
10. Sistema inicia sincronización de campañas
```

---

## 📋 ORDEN DE IMPLEMENTACIÓN

### FASE 1: Fundamentos (1-2 semanas)
1. ✅ Crear estructura de carpetas
2. ✅ Crear tablas en Supabase
3. ✅ Implementar marketingStore.ts
4. ✅ Crear types/marketing.types.ts
5. ✅ Crear MarketingModule.tsx (entry point)

### FASE 2: OAuth y Conexiones (2-3 semanas)
1. 🔲 Implementar MetaOAuth.ts
2. 🔲 Implementar GoogleOAuth.ts
3. 🔲 Implementar TikTokOAuth.ts
4. 🔲 Crear endpoints de callback en backend
5. 🔲 Crear UI de conexión (MetaConnect, GoogleConnect, TikTokConnect)

### FASE 3: APIs y Sincronización (2-3 semanas)
1. 🔲 Implementar MetaAdsAPI.ts
2. 🔲 Implementar GoogleAdsAPI.ts
3. 🔲 Implementar TikTokAdsAPI.ts
4. 🔲 Crear SyncManager.ts
5. 🔲 Implementar sincronización automática

### FASE 4: Dashboard y UI (2-3 semanas)
1. 🔲 MarketingDashboard.tsx con KPIs
2. 🔲 MetaDashboard con 4 pestañas
3. 🔲 GoogleDashboard con 4 pestañas
4. 🔲 TikTokDashboard con 4 pestañas
5. 🔲 Toggle ON/OFF para campañas

### FASE 5: UTMs y Atribución (1-2 semanas)
1. 🔲 Script de captura UTM
2. 🔲 UTMDashboard
3. 🔲 Sistema de atribución

### FASE 6: Webhooks y Ventas (1-2 semanas)
1. 🔲 Webhooks Hotmart/Kiwify
2. 🔲 Procesamiento de ventas
3. 🔲 Atribución automática

### FASE 7: Reglas y Automatización (1-2 semanas)
1. 🔲 Motor de reglas
2. 🔲 UI de creación de reglas
3. 🔲 Ejecución automática

---

## 🔑 VARIABLES DE ENTORNO NECESARIAS

```env
# Meta (Facebook)
VITE_META_APP_ID=tu_app_id
META_APP_SECRET=tu_app_secret          # Solo backend

# Google
VITE_GOOGLE_CLIENT_ID=tu_client_id
GOOGLE_CLIENT_SECRET=tu_client_secret  # Solo backend
GOOGLE_DEVELOPER_TOKEN=tu_dev_token    # Solo backend

# TikTok
VITE_TIKTOK_APP_ID=tu_app_id
TIKTOK_APP_SECRET=tu_app_secret        # Solo backend

# Supabase
VITE_SUPABASE_URL=tu_url
VITE_SUPABASE_ANON_KEY=tu_key
SUPABASE_SERVICE_KEY=tu_service_key    # Solo backend
```

---

## ⚠️ PASOS PREVIOS NECESARIOS

### Para Meta Ads:
1. Ir a [developers.facebook.com](https://developers.facebook.com)
2. Crear nueva App → Tipo: Business
3. Agregar producto "Marketing API"
4. Configurar OAuth redirect URI
5. Enviar App Review para permisos de producción

### Para Google Ads:
1. Ir a [Google Cloud Console](https://console.cloud.google.com)
2. Crear proyecto nuevo
3. Habilitar "Google Ads API"
4. Crear credenciales OAuth 2.0
5. Solicitar Developer Token en Google Ads (puede tomar días)

### Para TikTok Ads:
1. Ir a [TikTok for Business](https://business-api.tiktok.com)
2. Crear App y solicitar acceso a Marketing API
3. Esperar aprobación (puede tomar días)

---

**¿Quieres que empiece a implementar alguna fase específica?**
