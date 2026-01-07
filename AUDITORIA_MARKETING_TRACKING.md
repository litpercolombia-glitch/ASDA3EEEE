# 📊 AUDITORÍA: Sistema de Tracking de Marketing Digital
## Análisis de Brechas y Plan de Implementación

**Fecha:** 2026-01-07
**Aplicación:** LITPER Pro Seguimiento
**Versión Actual:** Multi-plataforma (React + Python + dbt)
**Enfoque:** Colombia, Ecuador y Chile

---

## 📋 RESUMEN EJECUTIVO

### Estado Actual de la Aplicación

Tu aplicación **LITPER Pro Seguimiento** es una plataforma robusta de **logística de última milla** con:

| Métrica | Valor |
|---------|-------|
| Archivos TypeScript/React | 547 |
| Servicios implementados | 132 |
| Componentes React | 214 |
| Tabs funcionales | 28 |
| Integraciones activas | 15+ |

### Análisis de Cobertura

La especificación del sistema de tracking de marketing incluye **18 módulos principales**. A continuación el análisis:

| Categoría | Cobertura Actual | Estado |
|-----------|------------------|--------|
| Dashboard de KPIs | 🟡 25% | Parcial (logística, no marketing) |
| Meta Ads | 🟢 60% | Estructura MCP existe |
| Google Ads | 🟢 60% | Estructura MCP existe |
| TikTok Ads | 🟢 60% | Estructura MCP existe |
| UTMs | 🔴 5% | Casi inexistente |
| Webhooks | 🟢 70% | Implementado para logística |
| Reglas Automatización | 🟡 40% | Motor skills existe |
| Tasas/Honorarios | 🔴 0% | No implementado |
| Gastos | 🟡 30% | financeService parcial |
| Informes | 🟡 50% | Reportes de logística |
| Notificaciones | 🟢 70% | WhatsApp/alertas existe |
| Suscripción | 🔴 0% | No implementado |
| Mi Cuenta | 🟢 80% | Auth robusto |
| Avanzado (Multi-Dashboard) | 🔴 10% | Básico |
| Programa Referidos | 🔴 0% | No implementado |
| Soporte | 🔴 10% | Básico |

### Recomendación General

**Opción A: Módulo Independiente (RECOMENDADO)**
- Crear un nuevo módulo de Marketing Tracking separado
- Reutilizar la infraestructura existente (Supabase, stores, UI components)
- No afecta funcionalidad actual de logística

**Opción B: Integración Completa**
- Fusionar tracking de marketing con logística
- Mayor complejidad pero visión unificada
- Requiere refactoring significativo

---

## 🔍 ANÁLISIS DETALLADO POR MÓDULO

### 1. RESUMEN (Dashboard Principal de Marketing)

#### Estado Actual: 🟡 25%
```
✅ Existe: Sistema de filtros (DateFilter), Cards de KPIs (ExecutiveKPIs)
✅ Existe: Gráficos con Recharts
✅ Existe: Toggle modo oscuro/claro
❌ Falta: KPIs de marketing (ROAS, CPA, etc.)
❌ Falta: Filtros por plataforma publicitaria
❌ Falta: Widget de ventas por método de pago
❌ Falta: Métricas de costos publicitarios
❌ Falta: Métricas de conversación WhatsApp → venta
```

#### Componentes a Crear:
```typescript
// Nuevos componentes necesarios
components/marketing/
├── MarketingDashboard.tsx          // Dashboard principal
├── KPICard.tsx                     // Cards de KPIs (reutilizable)
├── ROASCard.tsx                    // ROAS destacado
├── SalesMethodPieChart.tsx         // Gráfico de métodos de pago
├── ConversionFunnel.tsx            // Embudo de conversión
├── PlatformFilter.tsx              // Filtro por plataforma
├── CostBreakdown.tsx               // Desglose de costos
└── WhatsAppConversionMetrics.tsx   // Métricas de WhatsApp
```

#### Esfuerzo Estimado: **40 horas**

---

### 2. META (Facebook/Instagram Ads)

#### Estado Actual: 🟢 60%
```
✅ Existe: mcpConnectionsService.ts con Meta Ads
✅ Existe: Estructura de conexión OAuth
✅ Existe: UI de integraciones (ConexionesTab)
❌ Falta: Pestañas CUENTAS, CAMPAÑAS, CONJUNTOS, ANUNCIOS
❌ Falta: Toggle ON/OFF para campañas
❌ Falta: Métricas específicas de Meta (CPM, CTR, CPC)
❌ Falta: Verificación de UTMs
❌ Falta: Acciones en lote (pausar, activar)
```

#### Componentes a Crear:
```typescript
components/marketing/meta/
├── MetaDashboard.tsx               // Dashboard principal Meta
├── MetaAccountsTab.tsx             // Pestaña cuentas
├── MetaCampaignsTab.tsx            // Pestaña campañas
├── MetaAdSetsTab.tsx               // Pestaña conjuntos
├── MetaAdsTab.tsx                  // Pestaña anuncios
├── CampaignToggle.tsx              // Toggle ON/OFF
├── BulkActionsBar.tsx              // Barra de acciones en lote
└── UTMVerificationBadge.tsx        // Badge de verificación UTM
```

#### Servicios a Crear:
```typescript
services/marketing/
├── metaAdsService.ts               // Servicio de Meta Ads
├── metaCampaignsService.ts         // Gestión de campañas
└── metaMetricsService.ts           // Cálculo de métricas
```

#### Esfuerzo Estimado: **60 horas**

---

### 3. GOOGLE (Google Ads)

#### Estado Actual: 🟢 60%
```
✅ Existe: mcpConnectionsService.ts con Google Ads
✅ Existe: Estructura OAuth base
❌ Falta: Pestañas CUENTAS, CAMPAÑAS, GRUPOS, ANUNCIOS
❌ Falta: Tipos de campaña (Search, Display, Shopping, Video, PMax)
❌ Falta: Estrategias de puja
❌ Falta: Palabras clave y pujas
```

#### Componentes a Crear:
```typescript
components/marketing/google/
├── GoogleDashboard.tsx             // Dashboard principal Google
├── GoogleAccountsTab.tsx           // Pestaña cuentas
├── GoogleCampaignsTab.tsx          // Pestaña campañas
├── GoogleAdGroupsTab.tsx           // Pestaña grupos
├── GoogleAdsTab.tsx                // Pestaña anuncios
├── KeywordsManager.tsx             // Gestor de palabras clave
├── BidStrategySelector.tsx         // Selector de estrategia
└── CampaignTypeFilter.tsx          // Filtro por tipo
```

#### Esfuerzo Estimado: **55 horas**

---

### 4. TIKTOK (TikTok Ads)

#### Estado Actual: 🟢 60%
```
✅ Existe: mcpConnectionsService.ts con TikTok Ads
✅ Existe: Estructura OAuth base
❌ Falta: Pestañas específicas de TikTok
❌ Falta: Métricas de video (reproducciones, engagement)
❌ Falta: Preview de anuncios de video
```

#### Componentes a Crear:
```typescript
components/marketing/tiktok/
├── TikTokDashboard.tsx             // Dashboard principal TikTok
├── TikTokAccountsTab.tsx           // Pestaña cuentas
├── TikTokCampaignsTab.tsx          // Pestaña campañas
├── TikTokAdGroupsTab.tsx           // Pestaña grupos
├── TikTokAdsTab.tsx                // Pestaña anuncios
├── VideoPreviewCard.tsx            // Preview de video
└── VideoEngagementMetrics.tsx      // Métricas de engagement
```

#### Esfuerzo Estimado: **50 horas**

---

### 5. UTMs (Reporte de UTMs)

#### Estado Actual: 🔴 5%
```
❌ Falta: Sistema completo de tracking de UTMs
❌ Falta: Captura de UTMs en frontend
❌ Falta: Tabla de UTMs con agrupación
❌ Falta: Atribución de ventas a UTMs
❌ Falta: Scripts de captura
```

#### Componentes a Crear:
```typescript
components/marketing/utm/
├── UTMDashboard.tsx                // Dashboard de UTMs
├── UTMTable.tsx                    // Tabla con agrupación
├── UTMFilters.tsx                  // Filtros de UTM
├── UTMBuilder.tsx                  // Constructor de URLs
├── UTMScriptGenerator.tsx          // Generador de scripts
└── UTMAttribution.tsx              // Atribución de ventas
```

#### Servicios a Crear:
```typescript
services/marketing/
├── utmService.ts                   // Servicio principal UTM
├── utmCaptureService.ts            // Captura de UTMs
└── utmAttributionService.ts        // Atribución
```

#### Tablas a Crear (Supabase):
```sql
-- Nuevas tablas necesarias
utm_captures (
  id, session_id, utm_source, utm_medium, utm_campaign,
  utm_content, utm_term, captured_at, user_agent, ip_address
)

utm_conversions (
  id, utm_capture_id, sale_id, platform, revenue,
  converted_at, attribution_type
)
```

#### Esfuerzo Estimado: **35 horas**

---

### 6. INTEGRACIONES

#### Estado Actual: 🟢 70%
```
✅ Existe: webhookService.ts completo
✅ Existe: Sistema de conexiones MCP
✅ Existe: WhatsApp via Chatea Pro
✅ Existe: UI de integraciones (MCPConnectionsTab)
❌ Falta: Webhooks para Hotmart, Kiwify, Monetizze, etc.
❌ Falta: Generador de scripts de UTM por plataforma
❌ Falta: Gestión de píxeles (Meta, Google, TikTok)
❌ Falta: Sistema de pruebas de integración
```

#### Componentes a Crear:
```typescript
components/marketing/integrations/
├── IntegrationsDashboard.tsx       // Dashboard de integraciones
├── WebhooksTab.tsx                 // Gestión de webhooks
├── UTMScriptsTab.tsx               // Scripts y códigos
├── PixelManagerTab.tsx             // Gestión de píxeles
├── WhatsAppTab.tsx                 // Config WhatsApp
├── IntegrationTestTab.tsx          // Pruebas
├── PixelEventConfig.tsx            // Config eventos píxel
└── WebhookLogViewer.tsx            // Visor de logs
```

#### Servicios a Crear:
```typescript
services/marketing/
├── hotmartWebhookService.ts        // Webhook Hotmart
├── kiwifyWebhookService.ts         // Webhook Kiwify
├── pixelService.ts                 // Gestión de píxeles
└── integrationTestService.ts       // Testing
```

#### Esfuerzo Estimado: **45 horas**

---

### 7. REGLAS (Automatización)

#### Estado Actual: 🟡 40%
```
✅ Existe: automationEngineService.ts
✅ Existe: skillsService.ts con skills ejecutables
✅ Existe: Sistema de alertas
❌ Falta: UI de creación de reglas
❌ Falta: Condiciones de métricas publicitarias
❌ Falta: Acciones sobre campañas (pausar, ajustar)
❌ Falta: Frecuencia de evaluación configurable
```

#### Componentes a Crear:
```typescript
components/marketing/rules/
├── RulesDashboard.tsx              // Dashboard de reglas
├── RulesTable.tsx                  // Lista de reglas
├── RuleCreator.tsx                 // Creador de reglas
├── ConditionBuilder.tsx            // Constructor de condiciones
├── ActionSelector.tsx              // Selector de acciones
├── RuleScheduler.tsx               // Programación
└── RuleExecutionLog.tsx            // Log de ejecuciones
```

#### Esfuerzo Estimado: **40 horas**

---

### 8. TASAS/HONORARIOS

#### Estado Actual: 🔴 0%
```
❌ Falta: Sistema de impuestos por país
❌ Falta: Configuración de tasas de pasarela
❌ Falta: Costos de productos
❌ Falta: Comisiones de afiliados
```

#### Componentes a Crear:
```typescript
components/marketing/fees/
├── FeesDashboard.tsx               // Dashboard de tasas
├── TaxConfigTab.tsx                // Config impuestos
├── PaymentFeesTab.tsx              // Tasas de pago
├── ProductCostsTab.tsx             // Costos de productos
├── CommissionsTab.tsx              // Comisiones
└── CountryTaxSelector.tsx          // Selector por país
```

#### Tablas a Crear:
```sql
taxes (
  id, country_code, name, percentage, product_ids, active
)

payment_fees (
  id, payment_method, fee_type, fee_value, country_code
)

product_costs (
  id, product_id, product_name, sale_price, cost, margin
)
```

#### Esfuerzo Estimado: **25 horas**

---

### 9. GASTOS/DESPESAS

#### Estado Actual: 🟡 30%
```
✅ Existe: financeService.ts básico
✅ Existe: financeServiceEnterprise.ts
❌ Falta: UI de gestión de gastos
❌ Falta: Categorización de gastos
❌ Falta: Gastos recurrentes
❌ Falta: Importación automática de ads
```

#### Componentes a Crear:
```typescript
components/marketing/expenses/
├── ExpensesDashboard.tsx           // Dashboard de gastos
├── ExpensesTable.tsx               // Tabla de gastos
├── ExpenseForm.tsx                 // Formulario de gasto
├── CategoryManager.tsx             // Gestor de categorías
├── RecurringExpenses.tsx           // Gastos recurrentes
└── ExpensesSummary.tsx             // Resumen
```

#### Esfuerzo Estimado: **30 horas**

---

### 10. INFORMES/RELATÓRIOS

#### Estado Actual: 🟡 50%
```
✅ Existe: reportService.ts
✅ Existe: Exportación a Excel (XLSX)
✅ Existe: Exportación a PDF (jsPDF)
✅ Existe: Gráficos con Recharts
❌ Falta: Reportes específicos de marketing
❌ Falta: Agrupación por fuente/campaña
❌ Falta: Envío programado de reportes
```

#### Componentes a Crear:
```typescript
components/marketing/reports/
├── ReportsDashboard.tsx            // Dashboard de informes
├── ReportBuilder.tsx               // Constructor de reportes
├── ReportScheduler.tsx             // Programación de envío
├── ReportTemplates.tsx             // Plantillas
└── CustomColumnSelector.tsx        // Selector de columnas
```

#### Esfuerzo Estimado: **35 horas**

---

### 11. NOTIFICACIONES

#### Estado Actual: 🟢 70%
```
✅ Existe: notificationsService.ts
✅ Existe: WhatsApp via Chatea
✅ Existe: Sistema de alertas
✅ Existe: Toast notifications
❌ Falta: Notificaciones de venta configurables
❌ Falta: Reportes programados por horario
❌ Falta: Alertas de métricas publicitarias
```

#### Componentes a Crear:
```typescript
components/marketing/notifications/
├── NotificationSettings.tsx        // Configuración
├── SaleNotificationConfig.tsx      // Config ventas
├── ReportScheduleConfig.tsx        // Programación reportes
├── AlertThresholdConfig.tsx        // Umbrales de alerta
└── NotificationChannelSelector.tsx // Canales
```

#### Esfuerzo Estimado: **20 horas**

---

### 12. SUSCRIPCIÓN/ASSINATURA

#### Estado Actual: 🔴 0%
```
❌ Falta: Sistema de planes
❌ Falta: Gestión de pagos
❌ Falta: Límites por plan
❌ Falta: Historial de facturas
```

#### Componentes a Crear:
```typescript
components/subscription/
├── SubscriptionDashboard.tsx       // Dashboard suscripción
├── PlanSelector.tsx                // Selector de planes
├── PaymentMethodManager.tsx        // Métodos de pago
├── InvoiceHistory.tsx              // Historial facturas
├── UsageStats.tsx                  // Uso actual
└── UpgradeModal.tsx                // Modal de upgrade
```

#### Servicios a Crear:
```typescript
services/
├── subscriptionService.ts          // Gestión de suscripciones
├── billingService.ts               // Facturación
└── planLimitsService.ts            // Límites por plan
```

#### Tablas a Crear:
```sql
plans (
  id, name, price_monthly, features, limits
)

subscriptions (
  id, user_id, plan_id, status, current_period_start,
  current_period_end, payment_method
)

invoices (
  id, subscription_id, amount, status, paid_at, pdf_url
)
```

#### Esfuerzo Estimado: **50 horas**

---

### 13. MI CUENTA

#### Estado Actual: 🟢 80%
```
✅ Existe: authService.ts robusto
✅ Existe: UserProfilePanel
✅ Existe: LoginPage, RegisterPage
✅ Existe: ActivityLog
❌ Falta: 2FA (Autenticación de dos factores)
❌ Falta: Documentos de identidad por país
❌ Falta: Eliminar cuenta
```

#### Componentes a Crear:
```typescript
components/account/
├── TwoFactorSetup.tsx              // Config 2FA
├── IdentityDocuments.tsx           // Documentos
├── DeleteAccountFlow.tsx           // Eliminar cuenta
└── BackupCodes.tsx                 // Códigos de respaldo
```

#### Esfuerzo Estimado: **15 horas**

---

### 14. AVANZADO (Multi-Dashboard)

#### Estado Actual: 🔴 10%
```
✅ Existe: Concepto de dashboards (DashboardStore)
❌ Falta: Múltiples dashboards por usuario
❌ Falta: Colaboradores con roles
❌ Falta: Configuración por dashboard
```

#### Componentes a Crear:
```typescript
components/advanced/
├── DashboardManager.tsx            // Gestor de dashboards
├── DashboardCreator.tsx            // Crear dashboard
├── CollaboratorsManager.tsx        // Gestión colaboradores
├── RoleSelector.tsx                // Selector de roles
└── DashboardSettings.tsx           // Config por dashboard
```

#### Tablas a Crear:
```sql
dashboards (
  id, user_id, name, currency, timezone, config
)

dashboard_collaborators (
  id, dashboard_id, user_id, role, invited_at, accepted_at
)
```

#### Esfuerzo Estimado: **35 horas**

---

### 15. PROGRAMA DE REFERIDOS

#### Estado Actual: 🔴 0%
```
❌ Falta: Sistema de referidos completo
❌ Falta: Tracking de conversiones
❌ Falta: Comisiones y retiros
```

#### Componentes a Crear:
```typescript
components/referrals/
├── ReferralDashboard.tsx           // Dashboard referidos
├── ReferralLinkGenerator.tsx       // Generador de links
├── ReferralStats.tsx               // Estadísticas
├── CommissionHistory.tsx           // Historial comisiones
├── WithdrawalRequest.tsx           // Solicitud retiro
└── ReferralQRCode.tsx              // QR Code
```

#### Tablas a Crear:
```sql
referral_links (
  id, user_id, code, created_at
)

referrals (
  id, referrer_id, referred_id, status, converted_at
)

referral_commissions (
  id, referral_id, amount, status, paid_at
)
```

#### Esfuerzo Estimado: **30 horas**

---

### 16. SOPORTE

#### Estado Actual: 🔴 10%
```
✅ Existe: Estructura básica de ayuda
❌ Falta: Tutoriales organizados
❌ Falta: Base de conocimiento
❌ Falta: Chat de soporte
```

#### Componentes a Crear:
```typescript
components/support/
├── SupportDashboard.tsx            // Dashboard soporte
├── TutorialsSection.tsx            // Tutoriales
├── KnowledgeBase.tsx               // Base de conocimiento
├── ContactSupport.tsx              // Contacto
└── CommunityLinks.tsx              // Comunidades
```

#### Esfuerzo Estimado: **20 horas**

---

### 17. NOVEDADES

#### Estado Actual: 🔴 0%
```
❌ Falta: Feed de actualizaciones
❌ Falta: Notificaciones de nuevas funciones
```

#### Componentes a Crear:
```typescript
components/updates/
├── UpdatesFeed.tsx                 // Feed de novedades
├── UpdateCard.tsx                  // Card de actualización
└── UpdatesPreferences.tsx          // Preferencias
```

#### Esfuerzo Estimado: **10 horas**

---

### 18. APLICACIÓN MÓVIL

#### Estado Actual: 🟡 30%
```
✅ Existe: Aplicaciones Electron desktop
✅ Existe: PWA parcial (pwa.ts)
❌ Falta: App nativa iOS/Android
❌ Falta: Push notifications móvil
```

#### Opciones:
1. **React Native** - Apps nativas (mayor esfuerzo)
2. **PWA mejorado** - Progressive Web App (menor esfuerzo)
3. **Capacitor** - Apps híbridas (esfuerzo medio)

#### Esfuerzo Estimado: **80-200 horas** (según opción)

---

## 📊 RESUMEN DE ESFUERZO

### Por Prioridad

| Prioridad | Módulos | Horas Est. |
|-----------|---------|------------|
| **Alta** | Dashboard, Meta, Google, TikTok, UTMs | 240 |
| **Media** | Integraciones, Reglas, Gastos, Informes | 150 |
| **Baja** | Suscripción, Referidos, Soporte, Novedades | 110 |
| **Opcional** | App Móvil | 80-200 |

### Total General

| Categoría | Horas |
|-----------|-------|
| Componentes nuevos | ~400 |
| Servicios nuevos | ~80 |
| Tablas de BD | ~30 |
| Testing | ~50 |
| **TOTAL** | **~560 horas** |

---

## 🎯 PLAN DE IMPLEMENTACIÓN RECOMENDADO

### FASE 1: Fundamentos (Semanas 1-4)
**Objetivo:** Establecer la base del módulo de marketing

1. **Crear estructura base**
   - Carpeta `components/marketing/`
   - Servicios base `services/marketing/`
   - Nuevas tablas en Supabase
   - Store de marketing con Zustand

2. **Dashboard principal de marketing**
   - KPIs cards (ROAS, CPA, ROI, etc.)
   - Filtros globales
   - Gráficos básicos

3. **Sistema de UTMs**
   - Captura de UTMs
   - Tabla de UTMs
   - Scripts de captura

### FASE 2: Plataformas Publicitarias (Semanas 5-10)
**Objetivo:** Integrar las 3 plataformas principales

4. **Meta Ads completo**
   - 4 pestañas (Cuentas, Campañas, Conjuntos, Anuncios)
   - OAuth y sincronización
   - Acciones (pausar, activar)

5. **Google Ads completo**
   - 4 pestañas
   - Tipos de campaña
   - Palabras clave

6. **TikTok Ads completo**
   - 4 pestañas
   - Métricas de video

### FASE 3: Automatización y Tracking (Semanas 11-14)
**Objetivo:** Reglas y seguimiento avanzado

7. **Sistema de reglas**
   - Creador de reglas
   - Condiciones y acciones
   - Ejecución automática

8. **Integraciones webhooks**
   - Hotmart, Kiwify, etc.
   - Sistema de pruebas
   - Logs

9. **Gestión de píxeles**
   - Meta Pixel
   - Google Tag
   - TikTok Pixel

### FASE 4: Finanzas y Reportes (Semanas 15-18)
**Objetivo:** Control financiero completo

10. **Sistema de gastos**
    - CRUD de gastos
    - Categorías
    - Recurrentes

11. **Tasas y honorarios**
    - Impuestos por país
    - Costos de productos
    - Comisiones

12. **Informes avanzados**
    - Constructor de reportes
    - Exportación
    - Programación

### FASE 5: Monetización (Semanas 19-22)
**Objetivo:** Sistema de suscripción

13. **Planes y suscripciones**
    - Gestión de planes
    - Límites
    - Pagos

14. **Programa de referidos**
    - Links
    - Tracking
    - Comisiones

### FASE 6: Pulido Final (Semanas 23-26)
**Objetivo:** Completar y optimizar

15. **Notificaciones avanzadas**
16. **Soporte y tutoriales**
17. **Novedades feed**
18. **Optimización y testing**

---

## 💡 RECOMENDACIONES TÉCNICAS

### Arquitectura Sugerida

```
src/
├── components/
│   ├── marketing/              # NUEVO: Todo el módulo de marketing
│   │   ├── dashboard/
│   │   ├── meta/
│   │   ├── google/
│   │   ├── tiktok/
│   │   ├── utm/
│   │   ├── integrations/
│   │   ├── rules/
│   │   ├── expenses/
│   │   ├── reports/
│   │   └── notifications/
│   ├── subscription/           # NUEVO: Suscripciones
│   ├── referrals/              # NUEVO: Referidos
│   └── ... (existentes)
├── services/
│   ├── marketing/              # NUEVO: Servicios de marketing
│   │   ├── metaAdsService.ts
│   │   ├── googleAdsService.ts
│   │   ├── tiktokAdsService.ts
│   │   ├── utmService.ts
│   │   ├── rulesEngineService.ts
│   │   └── marketingMetricsService.ts
│   └── ... (existentes)
├── stores/
│   ├── marketingStore.ts       # NUEVO: Estado de marketing
│   └── ... (existentes)
└── types/
    ├── marketing.types.ts      # NUEVO: Tipos de marketing
    └── ... (existentes)
```

### Reutilización de Código Existente

| Componente Existente | Reutilizar Para |
|---------------------|-----------------|
| DateFilter | Filtros de período |
| ExecutiveKPIs | Base para KPI cards |
| webhookService | Webhooks de plataformas |
| automationEngineService | Motor de reglas |
| reportService | Exportación de reportes |
| notificationsService | Alertas de marketing |
| chateaService | Notificaciones WhatsApp |
| authService | Autenticación |

### Nuevas Tablas Supabase Necesarias

```sql
-- Marketing Core
marketing_accounts        -- Cuentas publicitarias
marketing_campaigns       -- Campañas sincronizadas
marketing_adsets          -- Conjuntos de anuncios
marketing_ads             -- Anuncios individuales
marketing_metrics_daily   -- Métricas diarias

-- UTMs y Atribución
utm_captures              -- Capturas de UTM
utm_conversions           -- Conversiones atribuidas
sales                     -- Ventas con atribución

-- Configuración
pixels                    -- Píxeles configurados
automation_rules          -- Reglas de automatización
rule_executions           -- Log de ejecuciones

-- Finanzas
taxes                     -- Impuestos
payment_fees              -- Tasas de pago
product_costs             -- Costos de productos
expenses                  -- Gastos manuales

-- Suscripción
plans                     -- Planes disponibles
subscriptions             -- Suscripciones activas
invoices                  -- Facturas

-- Multi-tenant
dashboards                -- Dashboards múltiples
collaborators             -- Colaboradores

-- Referidos
referral_links            -- Links de referido
referrals                 -- Referidos
referral_commissions      -- Comisiones
```

---

## ⚠️ CONSIDERACIONES IMPORTANTES

### 1. APIs de Plataformas Publicitarias

| Plataforma | API | Requisitos |
|------------|-----|------------|
| Meta | Marketing API | App Review, Business Manager |
| Google | Google Ads API | Developer Token, OAuth |
| TikTok | Marketing API | Business Center, App Approval |

**Recomendación:** Iniciar el proceso de aprobación de APIs lo antes posible (puede tomar 2-4 semanas).

### 2. Cumplimiento Legal

- **GDPR/RGPD:** Consentimiento para tracking
- **Cookies:** Política de cookies para UTMs
- **Facturación:** Requisitos por país (Colombia DIAN, Chile SII, Ecuador SRI)

### 3. Escalabilidad

- Implementar caching para métricas (Redis recomendado)
- Rate limiting para APIs de plataformas
- Job queues para sincronización (Bull o similar)

### 4. Seguridad

- Tokens de API encriptados
- Refresh tokens para OAuth
- Audit logs para acciones críticas

---

## 🚀 PRÓXIMOS PASOS INMEDIATOS

1. **Validar el plan** con stakeholders
2. **Iniciar proceso de aprobación** de APIs publicitarias
3. **Crear estructura de carpetas** del módulo de marketing
4. **Diseñar esquema de BD** detallado
5. **Crear tipos TypeScript** para marketing
6. **Implementar store** de Zustand para marketing
7. **Comenzar con Dashboard** principal

---

## 📝 CONCLUSIÓN

Tu aplicación LITPER Pro Seguimiento tiene una **base sólida** para implementar el sistema de tracking de marketing. La arquitectura existente (React + Supabase + Zustand) es ideal para este tipo de extensión.

**Puntos fuertes actuales:**
- Infraestructura de integraciones MCP ya existe
- Sistema de webhooks funcional
- Autenticación robusta
- Exportación a Excel/PDF
- Sistema de alertas

**Brecha principal:**
- Falta el módulo completo de marketing (métricas, UTMs, reglas)
- No hay sistema de suscripción/monetización
- Falta multi-tenancy avanzado

**Recomendación final:** Implementar por fases, comenzando por el Dashboard y UTMs (mayor valor inmediato), seguido de las integraciones con plataformas publicitarias.

---

*Documento generado el 2026-01-07*
*LITPER Pro Seguimiento - Sistema de Tracking de Marketing Digital*
