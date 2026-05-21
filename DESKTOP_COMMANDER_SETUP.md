# Setup de Desktop Commander MCP

Para que Claude (en esta sesión) pueda **abrir, lanzar y debuggear LITPER DESK
directamente en tu PC Windows** sin que tengas que copy/pastar comandos.

---

## Por qué ayuda

Con Desktop Commander conectado, en mi próximo turno puedo:
- Ejecutar el PowerShell installer en tu PC con un comando
- Lanzar `LITPER DESK.exe` automáticamente
- Leer los logs de `%APPDATA%\litper-desk\` si algo crashea
- Aplicar hotfixes en vivo (recompilo, te paso ZIP nuevo, lo aplico)
- Capturar screenshots de tu pantalla cuando algo se ve raro
- Editar archivos de configuración (`.env.local`) en tu máquina

Sin Desktop Commander: tú haces el copy/paste, yo te guío. Más lento.

---

## Setup en 5 pasos (5 minutos)

### Paso 1 — Verifica Node 18+ en Windows

Abre PowerShell:
```powershell
node --version
```

Si no lo tienes o es viejo: descarga **Node LTS** desde https://nodejs.org → instalar.

### Paso 2 — Localiza el archivo de config de Claude

Depende de cómo uses Claude. **Tres opciones**:

#### Si usas Claude Code en web (claude.ai/code)
- Abre tu sesión.
- Abajo a la izquierda hay un menú **Connectors** o **MCP** o **⚙ Settings**.
- Busca **Add MCP server** o **Edit MCP config**.

#### Si usas Claude Code CLI
- Edita `%USERPROFILE%\.claude\settings.json` en Windows.
- Si el archivo no existe, créalo.

#### Si usas Claude Desktop app
- **Settings** (⚙ esquina superior) → **Developer** → **Edit Config**.

### Paso 3 — Agrega el server al JSON

Pega esto adentro del JSON existente (o crea uno nuevo si está vacío):

```json
{
  "mcpServers": {
    "desktop-commander": {
      "command": "npx",
      "args": ["-y", "@wonderwhy-er/desktop-commander"]
    }
  }
}
```

**Si ya tenías otros MCPs configurados**, mete el `"desktop-commander"` adentro del objeto `mcpServers` existente sin borrar los demás. Ejemplo:

```json
{
  "mcpServers": {
    "github": { "...": "..." },
    "desktop-commander": {
      "command": "npx",
      "args": ["-y", "@wonderwhy-er/desktop-commander"]
    }
  }
}
```

### Paso 4 — Reinicia Claude

- Web: refresca la pestaña / cierra sesión y vuelve a entrar.
- Desktop: cierra completamente y vuelve a abrir.

### Paso 5 — Aprueba el conector

Cuando vuelvas a esta sesión:
- Aparecerá un popup de seguridad pidiéndote permitir el conector `desktop-commander`.
- Click **Allow** o **Approve**.
- Te recomiendo dejar **"Approve each command"** la primera vez para que veas qué hago.

---

## Cómo confirmarme que está listo

Cuando termines, en el chat escribe:
```
Desktop Commander listo
```

Yo en mi siguiente turno detectaré las nuevas tools `mcp__desktop-commander__*`,
abriré LITPER DESK en tu PC con el PowerShell installer, y empezamos a iterar
en vivo.

---

## Seguridad

- Desktop Commander te pide aprobar cada comando por defecto.
- Solo ejecuta cosas dentro de la sesión activa de Claude.
- Si desconectas el conector, pierdo acceso a tu PC inmediatamente.
- Repo oficial (open source, revisable): https://github.com/wonderwhy-er/DesktopCommanderMCP

---

## Si algo falla

| Error | Solución |
|-------|----------|
| `npx no se reconoce` | Instala Node LTS y reinicia terminal |
| Popup de aprobación no aparece | Reinicia Claude completamente (cerrar todas las ventanas) |
| Servidor no arranca | En PowerShell: `npx -y @wonderwhy-er/desktop-commander` y ver el error |
| Antivirus bloquea | Whitelist `%LocalAppData%\npm\` o usa instalación local |
