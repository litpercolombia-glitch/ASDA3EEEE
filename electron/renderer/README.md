# LITPER DESK — Renderer

Renderer (Vite + React 19 + Tailwind) del Halo flotante. Vive en este
sub-paquete y se sirve **en puerto 5174** para no chocar con el web app
principal de asda3eeee (puerto 5173).

## Arrancar en dev

```bash
# Terminal 1 — renderer (Vite)
cd electron/renderer
npm install
npm run dev          # sirve en http://localhost:5174

# Terminal 2 — Electron (apunta al renderer)
cd electron
npm install
npm run dev          # abre el Halo
```

`electron/main.js` carga `http://localhost:5174` cuando `NODE_ENV=development`
y `electron/renderer/dist/index.html` en producción.

## Build de producción

```bash
cd electron/renderer && npm run build      # genera electron/renderer/dist/
cd ../ && npm run build:win                # NSIS .exe + portable
cd ../ && npm run build:linux              # AppImage + .deb
```

## Estructura

```
electron/renderer/
├── index.html                    # CSP + fuentes Google
├── src/
│   ├── main.tsx                  # bootstrap React
│   ├── App.tsx                   # Halo flotante (timer + contadores + team)
│   ├── components/
│   │   ├── LitperLogo.tsx        # logo LP+corona (placeholder hasta .ico)
│   │   ├── TeamPicker.tsx        # dropdown operadores + agregar
│   │   └── CounterCell.tsx       # contador con +/- y atajos
│   ├── stores/
│   │   ├── teamStore.ts          # 7 operadores seed + addUser
│   │   └── rondaStore.ts         # timer + 7 contadores
│   ├── theme/
│   │   └── tokens.ts             # paleta + helpers (espejo de tailwind)
│   └── styles/
│       └── globals.css           # Tailwind + drag regions + animaciones
├── package.json
├── vite.config.ts                # puerto 5174
├── tailwind.config.js            # tokens del brand kit
├── tsconfig.json
└── postcss.config.js
```

## Atajos de teclado (registrados en `electron/main.js`)

| Atajo | Acción |
|-------|--------|
| `Ctrl+Shift+L` | Mostrar/ocultar Halo |
| `Ctrl+Shift+S` | Iniciar/pausar timer de ronda |
| `Ctrl+Shift+R` | Guardar ronda |
| `Ctrl+K` | Buscador (Fase 4) |
| `Ctrl+Shift+P` | Screenshot (Fase 5) |
| `F1` | Abrir semáforo (Fase 3) |

## Click avanzado en contadores

| Acción | Efecto |
|--------|--------|
| Click izq en `+` o `-` | ±1 |
| **Click derecho** en `+` o `-` | **±5** |
| Scroll wheel sobre la celda | ±1 |
| Click en el número | Editar valor directo (prompt) |

## Container queries

El layout del Halo usa `container-type: inline-size` (clase `.cq-halo`).
Cuando el Halo se redimensiona a < 340px de ancho, el grid de contadores
pasa a 1 columna; con más ancho, auto-fill con `minmax(140px, 1fr)`. Esto
resuelve el problema de "no se adapta a la forma" — ya **NO usamos**
breakpoints de viewport, sino del contenedor padre.

## Próximos pasos (Fase 2 según plan)

- [ ] Conectar `teamStore` y `rondaStore` con Supabase ASDA via cliente dual.
- [ ] Migrar componentes restantes de `litper-pedidos-app/src/`.
- [ ] Modo Admin con permisos por rol (admin/supervisor/operator).
- [ ] Ranking del día + racha + meta diaria.
- [ ] Reemplazar `LitperLogo.tsx` por `.ico` oficial (Canva).
