# 🎮 LITPER Procesos - Desktop App

App de escritorio que permite tener el widget **siempre visible** encima de cualquier ventana.

## 🚀 Instalación

```bash
cd electron
npm install
```

## 💻 Desarrollo

1. Primero, inicia el frontend Vite:
```bash
# En la raíz del proyecto
npm run dev
```

2. Luego, inicia Electron:
```bash
cd electron
npm run dev
```

## 📦 Build para producción

```bash
# Primero construye el frontend
npm run build

# Luego construye Electron
cd electron
npm run build        # Detecta tu SO
npm run build:win    # Windows
npm run build:mac    # macOS
npm run build:linux  # Linux
```

## ⌨️ Atajos Globales

| Atajo | Acción |
|-------|--------|
| `Ctrl+Shift+L` | Mostrar/Ocultar app |
| `Ctrl+Shift+S` | Iniciar/Pausar timer |
| `Ctrl+Shift+R` | Guardar ronda |

## 📌 Features

- ✅ **Always on Top** - Siempre visible
- ✅ **System Tray** - Minimiza a la bandeja
- ✅ **Global Shortcuts** - Atajos desde cualquier app
- ✅ **Frameless Window** - Sin barra de título nativa
- ✅ **Single Instance** - Solo una instancia
- ✅ **Auto-hide** - Cierra a tray, no cierra la app

## 🎨 Personalización

Reemplaza los iconos en `assets/`:
- `icon.ico` - Windows (256x256)
- `icon.icns` - macOS
- `icon.png` - Linux (512x512)
- `tray-icon.png` - Icono del tray (16x16 o 32x32)
