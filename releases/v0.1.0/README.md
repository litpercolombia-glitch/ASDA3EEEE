# LITPER DESK v0.1.0 — Descarga (Windows)

> El instalador completo (111 MB) está partido en 3 archivos porque GitHub
> no acepta archivos individuales mayores a 100 MB.

## Paso 1 — Descarga estos 4 archivos a la misma carpeta

Click derecho → "Guardar enlace como..." en cada uno:

| Archivo | Tamaño | Link directo (raw) |
|---------|--------|--------------------|
| Parte 1 de 3 | 55 MB | [LITPER-DESK-win-part-01](https://raw.githubusercontent.com/litpercolombia-glitch/ASDA3EEEE/claude/order-management-desktop-app-aajeM/releases/v0.1.0/LITPER-DESK-win-part-01) |
| Parte 2 de 3 | 55 MB | [LITPER-DESK-win-part-02](https://raw.githubusercontent.com/litpercolombia-glitch/ASDA3EEEE/claude/order-management-desktop-app-aajeM/releases/v0.1.0/LITPER-DESK-win-part-02) |
| Parte 3 de 3 | 319 KB | [LITPER-DESK-win-part-03](https://raw.githubusercontent.com/litpercolombia-glitch/ASDA3EEEE/claude/order-management-desktop-app-aajeM/releases/v0.1.0/LITPER-DESK-win-part-03) |
| Script de unión | 1 KB | [JUNTAR-WINDOWS.bat](https://raw.githubusercontent.com/litpercolombia-glitch/ASDA3EEEE/claude/order-management-desktop-app-aajeM/releases/v0.1.0/JUNTAR-WINDOWS.bat) |

## Paso 2 — Combina las partes

Doble click en `JUNTAR-WINDOWS.bat`. Hace todo automático:

1. Une las 3 partes en un solo ZIP.
2. Verifica que el checksum SHA256 sea exactamente:
   `349042cd0a131b476e0f2ce472f39c0132fde4e97f1006d5ad39a3c40c55489b`

## Paso 3 — Descomprime y ejecuta

1. Click derecho en `LITPER-DESK-0.1.0-win-x64-portable.zip` → "Extraer todo"
2. Entra a la carpeta extraída
3. Doble click en **`LITPER DESK.exe`**

### Si Windows SmartScreen avisa
"Más información" → "Ejecutar de todas formas". El .exe no está firmado todavía
(decisión pendiente, ~$300/año cert EV — Fase 8 del plan).

## Atajos globales

| Atajo | Acción |
|-------|--------|
| `Ctrl+Shift+L` | Mostrar / ocultar Halo |
| `Ctrl+Shift+S` | Iniciar / pausar timer |
| `Ctrl+Shift+R` | Guardar ronda |
| `Ctrl+K` | Buscador (Fase 4) |
| `F1` | Semáforo (Fase 3) |

Ver `RELEASE_NOTES_v0.1.0.md` en el root del repo para detalle completo.
