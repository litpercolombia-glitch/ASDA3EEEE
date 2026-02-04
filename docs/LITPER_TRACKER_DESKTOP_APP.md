# LITPER Tracker - Documentación Completa de la Aplicación de Escritorio

## Descripción General

**LITPER Tracker** es una aplicación de escritorio desarrollada con Electron para el seguimiento rápido de trabajo del equipo LITPER. Diseñada como una ventana flotante siempre visible que permite registrar actividades sin interrumpir el flujo de trabajo.

| Característica | Valor |
|----------------|-------|
| **Framework** | Electron v28.0.0 |
| **Frontend** | React 18.2 + TypeScript 5.3 |
| **Estado** | Zustand 4.4.7 |
| **Build** | Vite 5.0.8 |
| **Estilos** | Tailwind CSS 3.3.6 |
| **ID de App** | `com.litper.tracker` |

---

## Flujo de la Aplicación

### Pantalla 1: Selección de Usuario

![User Selection](../screenshots/user-selection.png)

**"¿Quién eres?"** - Pantalla inicial donde se selecciona el usuario activo.

#### Usuarios Disponibles (9 miembros del equipo):

| Usuario | Avatar | Color | Meta Diaria |
|---------|--------|-------|-------------|
| CATALINA | 😊 | Púrpura (#8B5CF6) | 60 |
| ANGIE | ⭐ | Rosa (#EC4899) | 60 |
| CAROLINA | 💜 | Índigo (#6366F1) | 60 |
| ALEJANDRA | 🌸 | Ámbar (#F59E0B) | 60 |
| EVAN | 🚀 | Esmeralda (#10B981) | 60 |
| JIMMY | ⚡ | Azul (#3B82F6) | 60 |
| FELIPE | 🔥 | Teal (#14B8A6) | 60 |
| NORMA | 🌺 | Violeta (#A855F7) | 60 |
| KAREN | ✨ | Rosa fuerte (#F43F5E) | 60 |

#### Características de esta pantalla:
- **Indicador de conexión**: Muestra "Sin conexión" cuando está offline
- **Modo offline**: Botón de recarga para intentar sincronizar
- **Grid de usuarios**: Tarjetas con avatar, nombre y color personalizado

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

![Novedades Screen](../screenshots/novedades-tracking.png)

**Campos de tracking para NOVEDADES:**

| Campo | Icono | Color | Descripción |
|-------|-------|-------|-------------|
| **Revisadas** | 👁️ | Gris | Novedades revisadas |
| **Solucionadas** | ✅ | Verde | Incidencias resueltas |
| **Devolución** | 📦 | Azul | Problemas de devolución |
| **Cliente** | 👤 | Amarillo | Problemas reportados por cliente |
| **Transportadora** | 🚚 | Naranja | Problemas con transporte |
| **LITPER** | 🏢 | Púrpura | Problemas internos |

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

### 4 Modos Disponibles

| Modo | Tamaño | Descripción |
|------|--------|-------------|
| **Normal** | 360x580 | Interfaz completa |
| **Compacto** | 320x420 | Layout reducido |
| **Mini** | 280x200 | Timer + contador rápido |
| **Micro** | 180x80 | Solo timer visible |

### Características de Ventana

- **Always-on-top**: Siempre visible sobre otras ventanas
- **Frameless**: Sin barra de título nativa (custom titlebar)
- **Transparente**: Fondo con transparencia
- **Redimensionable**: Se puede ajustar el tamaño
- **Arrastrable**: Se puede mover libremente
- **Persistencia**: Recuerda posición y tamaño

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

## Integración con Bandeja del Sistema

- La app se **minimiza a la bandeja** en lugar de cerrarse
- **Click en icono de bandeja**: Restaura la ventana
- **Click derecho**: Menú contextual con opción "Salir"
- **Solo una instancia**: No permite abrir múltiples ventanas

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
│   ├── main.ts          # Proceso principal Electron
│   └── preload.ts       # Bridge IPC seguro
├── src/
│   ├── App.tsx          # Componente principal
│   ├── main.tsx         # Entry point React
│   ├── components/
│   │   ├── Timer.tsx         # Temporizador
│   │   ├── QuickCounter.tsx  # Contadores +/-
│   │   ├── MiniMode.tsx      # Vista mini
│   │   ├── SuperMiniMode.tsx # Vista micro
│   │   ├── TitleBar.tsx      # Barra de título
│   │   ├── ConfigPanel.tsx   # Panel configuración
│   │   └── ProgressBar.tsx   # Barra de progreso
│   └── stores/
│       └── trackerStore.ts   # Estado Zustand
├── package.json
└── vite.config.ts
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
| 9 usuarios predefinidos | ✅ |
| 2 modos de trabajo (Guías/Novedades) | ✅ |
| Timer con 5 presets | ✅ |
| 4 modos de ventana | ✅ |
| Contadores rápidos (+1/+5) | ✅ |
| Exportación Excel/CSV | ✅ |
| Modo offline completo | ✅ |
| Sincronización con API | ✅ |
| Persistencia de datos | ✅ |
| Atajos de teclado globales | ✅ |
| Bandeja del sistema | ✅ |
| Alertas de audio | ✅ |
| Barra de título personalizada | ✅ |

---

*Documentación generada para LITPER Tracker Desktop App v1.0*
