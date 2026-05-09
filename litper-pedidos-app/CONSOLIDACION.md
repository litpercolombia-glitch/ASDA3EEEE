# Estado de consolidación — `litper-pedidos-app/`

> Estado: **electron/ deprecated, src/ pendiente de migrar.**
> Fecha: 2026-05-09.

---

## Qué pasa con este directorio

Este sub-paquete era uno de los 3 prototipos paralelos de desktop. Per `DECISIONES_LITPER_DESK.md` se consolida en `/electron/` (canónico).

| Subcarpeta | Estado | Razón |
|------------|--------|-------|
| `electron/main.js` | **DEPRECATED** | Sus features (opacidad submenu, posición persistida, transparencia) ya están integradas en `/electron/main.js` canónico. |
| `electron/preload.js` | **DEPRECATED** | Reemplazado por `/electron/preload.js` con whitelist de canales (hardening control #7). |
| `src/` | **A MIGRAR** | Aún contiene UI valiosa (timer, contadores, gestión de usuarios). Se migrará progresivamente al renderer canónico durante Fase 2. |
| `package.json` | **MANTENER (temporal)** | Sus deps deben revisarse antes de borrar. |
| `tailwind.config.js`, `tsconfig.json`, `vite.config.ts` | **MANTENER (temporal)** | Referencia para el setup del renderer canónico. |

## Cómo se hará la migración

1. **Fase 2 (semana 2-3)**: mover componentes de `src/components/` a un renderer único en la raíz del repo (probable destino: `/src/desktop/`).
2. Cada componente migrado se valida en el Halo flotante real con datos de Supabase.
3. Cuando todo `src/` esté migrado, se elimina el directorio completo en un commit aparte.

## Hasta entonces

- ❌ **NO agregar features nuevas** aquí.
- ❌ **NO usar `electron/main.js` ni `electron/preload.js` de este sub-paquete** — están deprecated.
- ✅ Sí se puede leer `src/` para entender el flujo previo.
- ✅ Sí se puede actualizar este README con notas de migración.
