# LITPER PEDIDOS

Aplicación de escritorio flotante para gestión de pedidos con cronómetro regresivo.

## Características

- **Ventana flotante** - Siempre visible encima de otras aplicaciones
- **Cronómetro regresivo** - Con alertas de colores (verde → amarillo → naranja → rojo)
- **Gestión de usuarios** - Agregar, editar y eliminar usuarios (modo Admin)
- **Colores personalizados** - Cada usuario con su color y avatar
- **Estadísticas** - Ranking y progreso diario
- **Bandeja del sistema** - Icono para control rápido

## Instalación

```bash
# Instalar dependencias
npm install

# Desarrollo (React + Electron)
npm run electron:dev

# Construir para Windows
npm run electron:build:win

# Construir para Mac
npm run electron:build:mac

# Construir para Linux
npm run electron:build:linux
```

## Uso

1. **Modo Admin**: Clic en el engranaje para activar
2. **Crear usuario**: En modo Admin, clic en "Nuevo"
3. **Seleccionar usuario**: Clic en el dropdown superior
4. **Iniciar timer**: Selecciona tiempo y presiona Play
5. **Registrar ronda**: Al terminar el timer, ingresa los pedidos

## Estructura

```
litper-pedidos-app/
├── electron/          # Proceso principal de Electron
│   ├── main.js        # Ventana y configuración
│   └── preload.js     # API segura
├── src/
│   ├── components/    # Componentes React
│   ├── stores/        # Estado global (Zustand)
│   └── styles/        # CSS y Tailwind
└── assets/            # Iconos y recursos
```

## Tecnologías

- Electron
- React 18
- TypeScript
- Zustand (estado)
- Tailwind CSS
- Lucide Icons
