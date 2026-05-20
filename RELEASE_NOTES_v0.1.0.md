# LITPER DESK v0.1.0 — Primera build de prueba

> Build: 2026-05-20.
> Branch: `claude/order-management-desktop-app-aajeM`.
> Estado: **MVP visual** del Halo flotante. Sin Supabase aún (Fase 2 pendiente).

---

## Artefactos generados

Construidos con `electron-builder` 25.1.8 + Electron 33.4.11.

| Archivo | Tamaño | Para |
|---------|--------|------|
| `LITPER-DESK-0.1.0-win-x64-portable.zip` | 111 MB | Windows 10/11 x64 — extrae y ejecuta sin instalar |
| `LITPER-DESK-0.1.0-x86_64.AppImage` | 104 MB | Linux x64 — ejecutable portable (`chmod +x` y doble click) |
| `LITPER-DESK-0.1.0-amd64.deb` | 72 MB | Ubuntu/Debian — `sudo dpkg -i LITPER-DESK-*.deb` |

⚠️ macOS no soportado en esta versión (sin Apple Developer ID, decisión previa).

---

## Cómo usar (Windows)

1. Descomprime `LITPER-DESK-0.1.0-win-x64-portable.zip` en cualquier carpeta (ej. `C:\Litper\Desk\`).
2. Doble click en `LITPER DESK.exe`.
3. El Halo aparece en la esquina inferior derecha, **siempre encima**.
4. Icono en la bandeja del sistema (junto al reloj) — click izquierdo muestra/oculta, click derecho abre menú.

### Posibles avisos de Windows
- **SmartScreen** dirá "Windows protegió tu equipo" (.exe sin firma de código).
  → Click en "Más información" → "Ejecutar de todas formas".
- **Windows Defender** puede tardar 1-2s en escanear el primer arranque.

Solución definitiva en Fase 8 del plan: cert EV de code signing (~$300/año) para que SmartScreen no avise.

---

## Atajos globales (funcionan desde cualquier ventana)

| Atajo | Acción |
|-------|--------|
| `Ctrl+Shift+L` | Mostrar / ocultar Halo |
| `Ctrl+Shift+S` | Iniciar / pausar timer |
| `Ctrl+Shift+R` | Guardar ronda |
| `Ctrl+K` | Buscador (placeholder — Fase 4) |
| `Ctrl+Shift+P` | Screenshot (placeholder — Fase 5) |
| `F1` | Abrir semáforo (placeholder — Fase 3) |

---

## Funcionalidades incluidas en esta build

✅ Ventana flotante always-on-top, frameless, transparente, arrastrable
✅ System tray con menú: mostrar/ocultar, opacidad (50-100%), iniciar/guardar ronda
✅ 7 operadores seed: **Jefer, Catalina, Jimmy, Felipe, Angie, Karen, Erika**
✅ Botón "Agregar operador" con asignación automática de color sin repetir
✅ Timer regresivo (30 min por defecto) con color por semáforo (verde→amarillo→naranja→rojo+pulse)
✅ 7 contadores: Iniciales, Realizado, Cancelado, Agendado, Difíciles, Pendientes, Revisado
✅ Clicks ±1, click-derecho ±5, scroll wheel, click en número para editar
✅ Persistencia local en `%APPDATA%\litper-desk\` (rondas no se pierden al cerrar)
✅ Single-instance (no se duplica si la abres dos veces)
✅ Hardening: sandbox, CSP estricto, IPC con zod, partition aislada

---

## Funcionalidades pendientes (siguientes fases)

❌ Conexión a Supabase ASDA + Semáforo (Fase 2-3 — necesito tus credenciales)
❌ Botón Semáforo reactivo con webview embebido (Fase 3)
❌ Buscador global Ctrl+K federado (Fase 4)
❌ Screenshots con anotación + opacidad + formas (Fase 5)
❌ MCP Server Litper Hub (Fase 6)
❌ Conector WhatsApp Cloud (Fase 7)
❌ Auto-update + code signing (Fase 8)
❌ App icon definitivo (hoy usa el icono default de Electron — pendiente convertir tu logo a .ico)

---

## Cómo reportar bugs

Pruébalo y mándame:
- Qué intentaste hacer.
- Qué pasó (capturas del Halo ayudan).
- Versión de Windows.

Si algo crashea, el log estará en `%APPDATA%\litper-desk\logs\`.

---

## Próximo paso sugerido

Cuando confirmes que el Halo se ve y se comporta como esperas, arrancamos **Fase 2**:
1. Migraciones SQL en Supabase ASDA (`team.users`, `rondas.events`, `audit_log`, `holidays`).
2. Cliente Supabase dual (federa org de ASDA + org del Semáforo).
3. Modo Admin con CRUD de operadores y permisos por rol.
4. Ranking del día + racha + meta diaria.

Para Fase 2 necesito de ti: **URL + anon key** de la org Supabase de ASDA3EEEE (no la del semáforo).
