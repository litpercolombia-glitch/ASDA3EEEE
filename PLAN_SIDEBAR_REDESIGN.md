# 🎨 PLAN: Rediseño con Sidebar Estilo ChatGPT + Marketing Tracking

## 📋 Resumen

Rediseñar la navegación de LITPER PRO para tener un **sidebar izquierdo profesional** como ChatGPT/Claude, e integrar el sistema de Marketing Tracking.

---

## 🖼️ Diseño Visual Propuesto

```
┌─────────────────────────────────────────────────────────────────────┐
│  🔶 LITPER PRO                              🇨🇴 Colombia  👤 User   │
├──────────────┬──────────────────────────────────────────────────────┤
│              │                                                      │
│  📊 Inicio   │                                                      │
│              │              CONTENIDO PRINCIPAL                     │
│  📦 Envíos   │                                                      │
│              │         (Dashboard, Tablas, Gráficos)                │
│  🚚 Tracking │                                                      │
│              │                                                      │
│  📈 Marketing│                                                      │
│              │                                                      │
│  🧠 IA       │                                                      │
│              │                                                      │
│  ⚙️ Config   │                                                      │
│              │                                                      │
│ ─────────────│                                                      │
│              │                                                      │
│  💬 Chat IA  │                                                      │
│              │                                                      │
│  ❓ Ayuda    │                                                      │
│              │                                                      │
└──────────────┴──────────────────────────────────────────────────────┘
```

---

## 📁 Estructura de Archivos

```
components/
├── layout/                         # 🆕 NUEVO
│   ├── AppLayout.tsx               # Layout principal con sidebar
│   ├── Sidebar.tsx                 # Sidebar colapsable
│   ├── SidebarItem.tsx             # Item del menú
│   ├── SidebarSection.tsx          # Sección con título
│   ├── TopBar.tsx                  # Barra superior
│   └── UserMenu.tsx                # Menú de usuario
│
├── marketing/                      # 🆕 NUEVO (del chat anterior)
│   ├── MarketingModule.tsx
│   ├── MarketingTab.tsx
│   ├── dashboard/
│   │   └── MarketingDashboard.tsx
│   └── shared/
│       └── PlatformConnector.tsx
│
└── ... (existentes)

stores/
├── layoutStore.ts                  # 🆕 Estado del sidebar
└── marketingStore.ts               # 🆕 Estado de marketing

types/
└── marketing.types.ts              # 🆕 Tipos de marketing

services/
└── marketing/
    └── oauth/
        └── OAuthManager.ts         # 🆕 OAuth para ads
```

---

## 🎯 Secciones del Sidebar

### Sección Principal
| Icono | Label | Ruta/Tab | Descripción |
|-------|-------|----------|-------------|
| 🏠 | Inicio | home | Dashboard principal |
| 📦 | Operaciones | operaciones | Gestión de envíos |
| 🧠 | Cerebro IA | cerebro-ia | Inteligencia artificial |
| 💼 | Negocio | negocio | Centro de negocios |
| ⚙️ | Config | config | Configuración |

### Sección Marketing (Nueva)
| Icono | Label | Ruta/Tab | Descripción |
|-------|-------|----------|-------------|
| 📊 | Dashboard | marketing | KPIs y métricas |
| 📘 | Meta Ads | marketing/meta | Facebook/Instagram |
| 🔴 | Google Ads | marketing/google | Search, Display |
| 🎵 | TikTok Ads | marketing/tiktok | TikTok For Business |
| 🔗 | UTMs | marketing/utm | Tracking UTMs |

### Sección Inferior (Fija)
| Icono | Label | Acción |
|-------|-------|--------|
| 💬 | Chat IA | Abrir asistente |
| ❓ | Ayuda | Centro de ayuda |
| 👤 | Perfil | Menú usuario |

---

## 🔧 Componentes a Crear

### 1. AppLayout.tsx
```tsx
// Layout principal que envuelve toda la app
<div className="flex h-screen">
  <Sidebar />
  <main className="flex-1 overflow-auto">
    {children}
  </main>
</div>
```

### 2. Sidebar.tsx
- Colapsable (icono ☰)
- Hover para expandir cuando está colapsado
- Secciones separadas
- Badge de notificaciones
- Indicador de tab activa
- Animaciones suaves

### 3. TopBar.tsx
- Logo LITPER PRO
- Barra de búsqueda
- Selector de país
- Notificaciones
- Perfil de usuario

---

## 📊 Estado del Sidebar (Zustand)

```typescript
interface LayoutState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  activeSection: string;
  activeTab: string;

  toggleSidebar: () => void;
  collapseSidebar: () => void;
  expandSidebar: () => void;
  setActiveTab: (tab: string) => void;
}
```

---

## 🎨 Estilos

### Colores
- Sidebar background: `bg-gray-900` (oscuro)
- Item hover: `bg-gray-800`
- Item activo: `bg-blue-600` o gradiente
- Texto: `text-gray-300` / `text-white`

### Dimensiones
- Sidebar expandido: `w-64` (256px)
- Sidebar colapsado: `w-16` (64px)
- Transición: `duration-300`

---

## 📋 Orden de Implementación

### Fase 1: Layout Base
1. ✅ Crear `layoutStore.ts`
2. ✅ Crear `AppLayout.tsx`
3. ✅ Crear `Sidebar.tsx`
4. ✅ Crear `TopBar.tsx`

### Fase 2: Integrar Marketing
5. ✅ Copiar archivos de marketing del chat anterior
6. ✅ Agregar sección Marketing al sidebar
7. ✅ Conectar rutas

### Fase 3: Migrar Navegación
8. ✅ Mover tabs actuales al sidebar
9. ✅ Actualizar App.tsx para usar AppLayout
10. ✅ Remover TabNavigation antiguo

### Fase 4: Pulir
11. ✅ Animaciones
12. ✅ Responsive (mobile)
13. ✅ Persistencia de estado

---

## ⏱️ Estimación

| Fase | Tiempo |
|------|--------|
| Layout Base | 30 min |
| Marketing | 20 min |
| Migración | 20 min |
| Pulido | 15 min |
| **Total** | **~1.5 horas** |

---

## 🚀 Resultado Final

- ✅ Sidebar profesional estilo ChatGPT
- ✅ Navegación clara y organizada
- ✅ Sistema de Marketing Tracking integrado
- ✅ Conexión OAuth con Meta, Google, TikTok
- ✅ Dashboard con KPIs de marketing
- ✅ Colapsable para más espacio
- ✅ Responsive para mobile

---

**¿Aprobado para implementar?**
