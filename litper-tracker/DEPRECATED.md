# DEPRECATED — `litper-tracker/`

> Estado: **archivado** desde 2026-05-09.
> Reemplazado por: [`/electron/`](../electron/) + UI consolidada (Fase 1+ del plan).

---

## Por que se deprecó

Este directorio era uno de **3 prototipos paralelos** de la app de escritorio que nunca se llegaron a fusionar:

1. `/electron/` — el más reciente, con tray + globalShortcut + IPC validado.
2. `/litper-pedidos-app/` — versión con timer + contadores + gestion de usuarios.
3. `/litper-tracker/` — **este** (variante temprana, sin features únicas que justifiquen mantenerla).

Per `DECISIONES_LITPER_DESK.md` el usuario aprobó **consolidar prototipos existentes** en `/electron/` (canónico) + migrar UI de `/litper-pedidos-app/`. `litper-tracker/` no aporta y queda fuera de scope.

## ¿Algo recuperable?

No. Si encuentras código aquí que crees útil, primero verifica si ya está en:
- `/electron/main.js` (proceso principal, hardenizado).
- `/electron/preload.js` (IPC con whitelist).
- `/litper-pedidos-app/src/` (UI a migrar en próximos commits).

## ¿Cuándo se borra el directorio físicamente?

Después de que se complete la Fase 2 del plan y nadie haya pedido restaurar nada. La idea es eliminarlo en un commit aparte (`chore: remove deprecated litper-tracker directory`) para que el git log sea claro.

Hasta entonces, **no agregar nada nuevo aquí**.
