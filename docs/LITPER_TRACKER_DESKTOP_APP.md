# LITPER Tracker - Documentación Completa de la Aplicación de Escritorio

## Descripción General

**LITPER Tracker** es una aplicación de escritorio desarrollada con Electron para el seguimiento rápido de trabajo del equipo LITPER Colombia. Diseñada como una ventana flotante siempre visible que permite registrar actividades sin interrumpir el flujo de trabajo.

| Característica | Valor |
|----------------|-------|
| **Framework** | Electron v28.0.0 |
| **Frontend** | React 18.2 + TypeScript 5.3 |
| **Estado** | Zustand 4.4.7 |
| **Build** | Vite 5.0.8 |
| **Estilos** | Tailwind CSS 3.3.6 |
| **ID de App** | `com.litper.tracker` |
| **Versión** | 1.0.0 |
| **Autor** | LITPER Colombia |

## Instaladores Disponibles

| Plataforma | Archivo | Tamaño |
|------------|---------|--------|
| **Linux** | LITPER Tracker-1.0.0.AppImage | ~108 MB |
| **Linux** | litper-tracker_1.0.0_amd64.snap | ~91 MB |
| **Windows** | win-unpacked/ | Portable |
| **Zip** | LITPER-Tracker-1.0.0-Linux.zip | ~107 MB |

---

## Flujo de la Aplicación

### Pantalla 1: Selección de Usuario

**"¿Quién eres?"** - Pantalla inicial donde se selecciona el usuario activo.

#### Sincronización de Usuarios

Los usuarios se **sincronizan dinámicamente desde la API** (Procesos 2.0). Ya no están hardcodeados en la aplicación.

#### Características de esta pantalla:
- **Indicador de conexión**: Muestra "API conectada" o "Sin conexión"
- **Botón sincronizar**: Icono de refresh para actualizar lista de usuarios
- **Botón configuración**: Acceso al panel de configuración
- **Grid de usuarios**: Tarjetas con avatar, nombre y color personalizado
- **Mensaje vacío**: Si no hay usuarios, muestra "Crea usuarios en Procesos 2.0"

---

### Pantalla 2: Selección de Proceso

![Process Selection](../screenshots/process-selection.png)

**"¿Qué vas a trabajar?"** - Selección del tipo de trabajo a registrar.

#### Opciones de Proceso:

| Proceso | Icono | Color | Descripción |
|---------|-------|-------|-------------|
| **Generación de Guías** | 📋 | Verde | Registro de guías generadas, canceladas, agendadas |
| **Novedades** | ⚠️ | Naranja | Seguimiento de incidencias y soluciones |

#### Funciones disponibles:
- **Exportar mis datos (Excel)**: Descarga CSV con todas las rondas del usuario
- **Cerrar sesión**: Icono de flecha para volver a selección de usuario
- **Indicador de rondas**: "Sin rondas hoy" o contador de rondas completadas

---

### Pantalla 3: Trabajo - Generación de Guías

![Guias Screen](../screenshots/guias-tracking.png)

**Campos de tracking para GUÍAS:**

| Campo | Icono | Color | Descripción |
|-------|-------|-------|-------------|
| **Iniciales** | 📋 | Azul | Pedidos iniciales del lote |
| **Realizado** | ✅ | Verde | Guías generadas exitosamente |
| **Cancelado** | ❌ | Rojo | Pedidos cancelados |
| **Agendado** | 📅 | Amarillo | Pedidos programados para después |
| **Difíciles** | ⚠️ | Naranja | Pedidos con problemas |
| **Pendientes** | 📌 | Púrpura | Pedidos pendientes de procesar |
| **Revisado** | 👁️ | Gris | Pedidos revisados |

#### Resumen del día:
- Muestra: `✅ X/50 (Y%)` - Total de "Realizados" vs meta diaria

---

### Pantalla 4: Trabajo - Novedades

**Campos de tracking para NOVEDADES (actualizados):**

| Campo | Icono | Color | Descripción |
|-------|-------|-------|-------------|
| **Total novedades** | 📊 | Cyan | Total de novedades a procesar (editable) |
| **Revisadas** | 👁️ | Gris | Novedades revisadas |
| **Solucionadas** | ✅ | Verde | Incidencias resueltas |
| **Error por solución** | 🔄 | Rojo | Errores encontrados al solucionar |
| **Proveedor** | 🏭 | Índigo | Problemas de proveedor |
| **Cliente** | 👤 | Azul | Problemas reportados por cliente |
| **Transportadora** | 🚚 | Púrpura | Problemas con transporte |
| **LITPER** | 🏢 | Naranja | Problemas internos |

#### Cronómetro (Stopwatch)
A diferencia de Guías, Novedades usa un **cronómetro ascendente** que cuenta el tiempo trabajado en lugar de un temporizador descendente.

#### Mini Dashboard - Resumen en tiempo real
Muestra en tiempo real:
- Solucionadas (verde)
- Revisadas (gris)
- Errores (rojo)

#### Resumen del día:
- Muestra: `✅ X solucionadas` - Total de novedades solucionadas

---

## Temporizador (Timer)

### Configuración del Timer

| Preset | Duración |
|--------|----------|
| 15m | 15 minutos |
| 20m | 20 minutos |
| 25m | 25 minutos (default) |
| **30m** | 30 minutos (seleccionado en tu captura) |
| 40m | 40 minutos |

### Estados del Timer

| Estado | Descripción | Color |
|--------|-------------|-------|
| `idle` | No iniciado | Verde |
| `running` | En ejecución | Verde → Amarillo → Rojo |
| `paused` | Pausado | Gris |
| `finished` | Completado | Rojo pulsante |

### Código de Colores por Tiempo Restante

| % Restante | Color | Efecto |
|------------|-------|--------|
| >50% | Verde | Normal |
| 25-50% | Amarillo | Normal |
| 10-25% | Naranja | Normal |
| <10% | Rojo | Pulso animado |

### Controles
- **▶️ Iniciar**: Comienza el temporizador
- **⏸️ Pausar**: Pausa el temporizador
- **🔄 Reset**: Reinicia al tiempo seleccionado

### Alertas de Audio
- **Fin del timer**: 3 beeps rápidos (880Hz)
- **Guardar ronda exitoso**: Tono ascendente (C-E-G)

---

## Contadores Rápidos

### Interacción con Botones +/-

| Acción | Resultado |
|--------|-----------|
| **Click izquierdo en +** | +1 |
| **Click izquierdo en -** | -1 |
| **Click derecho en +** | +5 |
| **Click derecho en -** | -5 |
| **Click en el número** | Edición directa |
| **Enter** | Confirmar edición |
| **Escape** | Cancelar edición |

---

## Modos de Ventana

### 5 Modos Disponibles

| Modo | Tamaño | Descripción | Componente |
|------|--------|-------------|------------|
| **Normal** | 320x480 (default) | Interfaz completa | Pantallas completas |
| **Compacto** | 320x420 | Layout reducido | Pantallas completas |
| **Mini** | 280x200 | Timer + contador rápido | `MiniMode` |
| **Micro** | 180x80 | Solo timer visible | `SuperMiniMode` |
| **Barra** | Horizontal | Barra horizontal minimalista | `BarMode` |

### Dimensiones de Ventana

| Propiedad | Valor |
|-----------|-------|
| Ancho mínimo | 280px |
| Alto mínimo | 200px |
| Ancho máximo | 400px |
| Alto máximo | 700px |

### Características de Ventana

- **Always-on-top**: Siempre visible sobre otras ventanas (toggle disponible)
- **Frameless**: Sin barra de título nativa (custom titlebar)
- **Transparente**: Fondo con transparencia
- **Redimensionable**: Se puede ajustar el tamaño
- **Arrastrable**: Se puede mover libremente
- **Persistencia**: Recuerda posición y tamaño
- **Shadow**: Sombra habilitada para mejor visibilidad

---

## Barra de Título Personalizada

### Botones de Control

| Botón | Función |
|-------|---------|
| **📌** | Toggle always-on-top |
| **⚙️** | Abrir panel de configuración |
| **➖** | Minimizar a bandeja del sistema |
| **✖️** | Minimizar (no cierra la app) |

---

## Funcionalidad Offline

### Almacenamiento Local

**Electron Store** (Persistencia principal):
```
- apiUrl: URL del API
- windowPosition: { x, y }
- windowSize: { width, height }
- modo: Modo de ventana actual
- rondasHoy: Array de rondas del día
- fecha: Fecha actual (para reset diario)
- tiempoTotal: Duración del timer
```

**LocalStorage** (Sincronización web):
```
- litper-tracker-data: { fecha, rondasHoy, totales }
- litper-tracker-sync: { rondasHoy, fecha, ultimaSync }
```

### Comportamiento Offline

1. **Funciona 100% sin internet**
2. **Reset automático diario** al cambiar la fecha
3. **Sincronización automática** cuando hay conexión
4. **Fallback local** si el API no responde

---

## Exportación de Datos

### Formato de Exportación: CSV

**Nombre del archivo**: `LITPER_Rondas_{FECHA}.csv`

#### Columnas para Guías:
```
Fecha, Usuario, Ronda, Hora Inicio, Hora Fin, Tiempo (min),
Iniciales, Realizadas, Canceladas, Agendadas, Difíciles,
Pendientes, Revisadas
```

#### Columnas para Novedades:
```
Fecha, Usuario, Ronda, Hora Inicio, Hora Fin, Tiempo (min),
Revisadas, Solucionadas, Devolución, Cliente, Transportadora, LITPER
```

#### Sección de Resumen:
```
Total Guías Realizadas: X
Total Novedades Solucionadas: Y
Total Rondas: Z
```

---

## Atajos de Teclado

### Globales (Funcionan fuera de la app)

| Atajo | Acción |
|-------|--------|
| `Ctrl+Shift+P` | Mostrar/ocultar aplicación |

### Locales (Dentro de la app)

| Atajo | Acción |
|-------|--------|
| `+` / `-` | Incrementar/decrementar contador |
| `Click derecho` | Incremento/decremento x5 |
| `Enter` | Confirmar edición |
| `Escape` | Cancelar edición |

---

## Integración con API

### Endpoints Utilizados

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/usuarios` | GET | Lista de usuarios |
| `/rondas?fecha={date}` | GET | Rondas de una fecha |
| `/rondas/guias` | POST | Guardar ronda de guías |
| `/rondas/novedades` | POST | Guardar ronda de novedades |

### URL del API
- **Default**: `https://litper-tracker-api.onrender.com/api/tracker`
- **Configurable**: Se puede cambiar en panel de configuración

---

## Integración con Bandeja del Sistema (Tray)

### Comportamiento del Icono
- La app se **minimiza a la bandeja** en lugar de cerrarse
- **Click en icono de bandeja**: Toggle mostrar/ocultar ventana
- **Click derecho**: Menú contextual completo

### Menú Contextual del Tray

| Opción | Acción |
|--------|--------|
| **Mostrar LITPER** | Restaura y enfoca la ventana |
| **Modo** → Normal/Compacto/Mini/Micro/Barra | Cambia el modo de ventana |
| **Siempre encima** | Toggle always-on-top (checkbox) |
| **Acciones rápidas** → Ver Resumen del Día | Abre el panel de resumen diario |
| **Acciones rápidas** → Ver Metas | Abre el panel de metas |
| **Acciones rápidas** → Ver Historial | Abre el panel de historial |
| **Exportar Datos** | Exporta los datos a CSV |
| **Hacer Backup** | Realiza un backup de los datos |
| **Salir** | Cierra completamente la aplicación |

---

## Guardar Ronda

### Proceso de Guardado

1. **Validación**: Verifica que hay datos ingresados
2. **Timestamp**: Registra hora de inicio y fin
3. **Duración**: Calcula minutos trabajados
4. **Número de ronda**: Auto-incrementa por usuario/proceso
5. **Persistencia local**: Guarda en electron-store
6. **Sync con API**: Intenta enviar al servidor
7. **Feedback**: Sonido de éxito + reset de campos

### Botón "GUARDAR RONDA"
- Color: Naranja/Ámbar
- Icono: 💾
- Acción: Guarda todos los valores actuales como una ronda

---

## Instalación y Desarrollo

### Comandos Disponibles

```bash
# Desarrollo
npm run dev              # Inicia servidor de desarrollo
npm run electron:dev     # Inicia Electron + dev server

# Build
npm run build            # Build frontend + Electron
npm run build:win        # Instalador Windows (.exe)
npm run build:mac        # Instalador macOS (.dmg)
npm run build:linux      # Instalador Linux (.AppImage)
```

### Plataformas Soportadas

| Plataforma | Formato |
|------------|---------|
| Windows | NSIS Installer (.exe) |
| macOS | DMG Image (.dmg) |
| Linux | AppImage (.AppImage) |

---

## Estructura de Archivos

```
litper-tracker/
├── electron/
│   ├── main.ts              # Proceso principal Electron
│   └── preload.ts           # Bridge IPC seguro
├── src/
│   ├── App.tsx              # Componente principal con pantallas
│   ├── main.tsx             # Entry point React
│   ├── vite-env.d.ts        # Tipos TypeScript
│   ├── components/
│   │   ├── BarMode.tsx          # Modo barra horizontal
│   │   ├── Celebrations.tsx     # Animaciones de celebración
│   │   ├── ConfigPanel.tsx      # Panel de configuración
│   │   ├── ConfirmModal.tsx     # Modal de confirmación
│   │   ├── DailySummary.tsx     # Resumen diario
│   │   ├── GoalsIndicator.tsx   # Indicador de metas
│   │   ├── HistoryPanel.tsx     # Panel de historial
│   │   ├── MiniMode.tsx         # Modo mini
│   │   ├── ProgressBar.tsx      # Barra de progreso
│   │   ├── QuickCounter.tsx     # Contadores rápidos +/-
│   │   ├── Sidebar.tsx          # Barra lateral
│   │   ├── StatsPanel.tsx       # Panel de estadísticas
│   │   ├── Stopwatch.tsx        # Cronómetro ascendente
│   │   ├── SuperMiniMode.tsx    # Modo micro
│   │   ├── TemplatesPanel.tsx   # Panel de plantillas
│   │   ├── Timer.tsx            # Temporizador descendente
│   │   ├── TitleBar.tsx         # Barra de título
│   │   ├── Toast.tsx            # Notificaciones toast
│   │   └── index.ts             # Exports
│   ├── stores/
│   │   └── trackerStore.ts      # Estado global Zustand
│   └── styles/
│       └── ...                  # Estilos CSS
├── release/                     # Builds generados
│   ├── LITPER Tracker-1.0.0.AppImage
│   ├── litper-tracker_1.0.0_amd64.snap
│   ├── linux-unpacked/
│   └── win-unpacked/
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── postcss.config.js
```

---

## Panel de Configuración

### Opciones Configurables

| Opción | Descripción | Default |
|--------|-------------|---------|
| **URL del API** | Endpoint del servidor | litper-tracker-api.onrender.com |
| **Modo de ventana** | Normal/Compacto/Mini/Micro | Normal |
| **Always-on-top** | Ventana siempre visible | Activado |
| **Opacidad** | Transparencia de la ventana | 100% |

---

## Resumen de Funcionalidades

| Característica | Estado |
|----------------|--------|
| Ventana flotante always-on-top | ✅ |
| Usuarios dinámicos desde API | ✅ |
| 2 modos de trabajo (Guías/Novedades) | ✅ |
| Timer descendente (para Guías) | ✅ |
| Cronómetro ascendente (para Novedades) | ✅ |
| 5 modos de ventana (Normal/Compacto/Mini/Micro/Barra) | ✅ |
| Contadores rápidos (+1/+5) | ✅ |
| Exportación CSV | ✅ |
| Backup de datos | ✅ |
| Modo offline completo | ✅ |
| Sincronización con API | ✅ |
| Persistencia de datos (electron-store) | ✅ |
| Atajos de teclado globales (Ctrl+Shift+P) | ✅ |
| Bandeja del sistema con menú completo | ✅ |
| Notificaciones del sistema | ✅ |
| Barra de título personalizada | ✅ |
| Panel de historial | ✅ |
| Panel de metas | ✅ |
| Resumen diario | ✅ |
| Plantillas de trabajo | ✅ |
| Celebraciones animadas | ✅ |
| Mini Dashboard en tiempo real | ✅ |

---

## Paneles Adicionales

### Panel de Configuración (ConfigPanel)
Accesible desde el icono de engranaje en la barra de título.

### Panel de Estadísticas (StatsPanel)
Muestra estadísticas detalladas del trabajo.

### Panel de Historial (HistoryPanel)
Permite ver el historial de rondas registradas.

### Resumen Diario (DailySummary)
Muestra un resumen del día con todas las rondas y totales.

### Indicador de Metas (GoalsIndicator)
Muestra el progreso hacia las metas diarias establecidas.

### Panel de Plantillas (TemplatesPanel)
Permite guardar y usar plantillas de trabajo.

### Celebraciones (Celebrations)
Animaciones de celebración al alcanzar metas.

### Toast Notifications
Notificaciones flotantes para feedback de acciones.

### Modal de Confirmación (ConfirmModal)
Dialogo de confirmación para acciones importantes como "Nuevo Día".

---

## IPC Handlers (Comunicación Electron)

| Handler | Descripción |
|---------|-------------|
| `get-store` | Obtiene valor del store persistente |
| `set-store` | Guarda valor en el store |
| `minimize` | Minimiza la ventana |
| `close` | Oculta la ventana (no cierra) |
| `toggle-always-on-top` | Toggle siempre encima |
| `set-opacity` | Establece opacidad de ventana |
| `set-size` | Establece tamaño de ventana |
| `export-csv` | Exporta contenido a CSV |
| `send-notification` | Envía notificación del sistema |

---

## Listeners del Renderer (desde Tray)

| Evento | Acción |
|--------|--------|
| `set-mode` | Cambia modo de ventana |
| `show-daily-summary` | Muestra resumen diario |
| `show-goals` | Muestra panel de metas |
| `show-history` | Muestra historial |
| `export-data` | Exporta datos |
| `do-backup` | Realiza backup |

---

*Documentación actualizada para LITPER Tracker Desktop App v1.0.0*
