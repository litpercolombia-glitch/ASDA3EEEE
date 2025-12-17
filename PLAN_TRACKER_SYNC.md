# Plan: LITPER Tracker con Sincronización

## Objetivo
Conectar LITPER Tracker (desktop) con Procesos 2.0 (web) para que:
1. Cada usuario se identifique
2. Se pueda elegir entre Guías o Novedades
3. Los datos se sincronicen automáticamente

---

## Estructura del Sistema

```
┌─────────────────────┐         ┌─────────────────────┐
│   LITPER Tracker    │         │    Procesos 2.0     │
│     (Desktop)       │◄───────►│       (Web)         │
│                     │  sync   │                     │
│  - Registro rápido  │         │  - Reportes admin   │
│  - Timer            │         │  - Gestión usuarios │
│  - Siempre visible  │         │  - Análisis         │
└─────────────────────┘         └─────────────────────┘
            │                            │
            └───────────┬────────────────┘
                        ▼
              ┌─────────────────┐
              │   LocalStorage  │
              │   Compartido    │
              └─────────────────┘
```

---

## Pantallas del Tracker

### Pantalla 1: Selección de Usuario
```
╔═══════════════════════════════════╗
║     LITPER Tracker           _ X  ║
╠═══════════════════════════════════╣
║                                   ║
║      ¿Quién eres?                 ║
║                                   ║
║   ┌─────┐  ┌─────┐  ┌─────┐      ║
║   │ 😊  │  │ 😎  │  │ 🚀  │      ║
║   │Juan │  │María│  │Pedro│      ║
║   └─────┘  └─────┘  └─────┘      ║
║                                   ║
╚═══════════════════════════════════╝
```
- Muestra usuarios creados en Procesos 2.0
- Click para seleccionar

### Pantalla 2: Selección de Proceso
```
╔═══════════════════════════════════╗
║  👤 Juan                     _ X  ║
╠═══════════════════════════════════╣
║                                   ║
║      ¿Qué vas a hacer?            ║
║                                   ║
║   ┌─────────────────────────┐     ║
║   │  📦 GENERACIÓN GUÍAS    │     ║
║   └─────────────────────────┘     ║
║                                   ║
║   ┌─────────────────────────┐     ║
║   │  🔔 NOVEDADES           │     ║
║   └─────────────────────────┘     ║
║                                   ║
╚═══════════════════════════════════╝
```

### Pantalla 3A: Modo GUÍAS
```
╔═══════════════════════════════════╗
║  📦 GUÍAS - Juan        [◄] _ X   ║
╠═══════════════════════════════════╣
║         ⏱️ 24:35                  ║
║   [15m] [20m] [25m] [▶️ INICIAR]  ║
╠═══════════════════════════════════╣
║  Iniciales    [-]  25  [+]        ║
║  ✅ Realizado [-]  18  [+]        ║
║  ❌ Cancelado [-]   3  [+]        ║
║  📅 Agendado  [-]   2  [+]        ║
║  ⚠️ Difíciles [-]   1  [+]        ║
║  ⏳ Pendientes[-]   1  [+]        ║
║  👁️ Revisado  [-]   0  [+]        ║
╠═══════════════════════════════════╣
║      [ 💾 GUARDAR RONDA ]         ║
║  Hoy: 45/50 (90%) ████████░       ║
╚═══════════════════════════════════╝
```

### Pantalla 3B: Modo NOVEDADES
```
╔═══════════════════════════════════╗
║  🔔 NOVEDADES - Juan    [◄] _ X   ║
╠═══════════════════════════════════╣
║         ⏱️ 24:35                  ║
║   [15m] [20m] [25m] [▶️ INICIAR]  ║
╠═══════════════════════════════════╣
║  📋 Revisadas    [-]  15  [+]     ║
║  ✅ Solucionadas [-]  10  [+]     ║
║  🔄 Devolución   [-]   2  [+]     ║
║  👤 Cliente      [-]   1  [+]     ║
║  🚚 Transporta.  [-]   1  [+]     ║
║  🏢 LITPER       [-]   1  [+]     ║
╠═══════════════════════════════════╣
║      [ 💾 GUARDAR RONDA ]         ║
║  Hoy: 30 novedades procesadas     ║
╚═══════════════════════════════════╝
```

---

## Campos por Proceso

### Generación de Guías
| Campo | Descripción |
|-------|-------------|
| Pedidos Iniciales | Cuántos pedidos tenías al empezar |
| Realizado | Guías generadas exitosamente |
| Cancelado | Pedidos cancelados |
| Agendado | Pedidos agendados para después |
| Difíciles | Pedidos con problemas |
| Pendientes | Quedaron pendientes |
| Revisado | Pedidos revisados |

### Novedades
| Campo | Descripción |
|-------|-------------|
| Revisadas | Total de novedades revisadas |
| Solucionadas | Novedades resueltas |
| Devolución | Por devolución |
| Cliente | Problema del cliente |
| Transportadora | Problema de transporte |
| LITPER | Problema interno |

---

## Sincronización

### Cómo funciona
1. **Tracker guarda** → LocalStorage con clave especial
2. **Procesos 2.0 lee** → El mismo LocalStorage
3. **Datos compartidos** → Usuarios, rondas, reportes

### Estructura de datos compartida
```typescript
{
  "litper-sync": {
    "usuarios": [...],           // Lista de usuarios
    "rondasGuias": [...],        // Rondas de generación
    "rondasNovedades": [...],    // Rondas de novedades
    "ultimaSync": "2024-12-16"   // Fecha última sync
  }
}
```

### Flujo de datos
```
TRACKER                         PROCESOS 2.0
   │                                 │
   │  1. Usuario trabaja             │
   │  2. Guarda ronda ───────────────┼──► 3. Admin ve reportes
   │                                 │
   │  4. Admin crea usuario ◄────────┼─── 5. Usuario aparece en Tracker
   │                                 │
```

---

## Reportes en Procesos 2.0 (Admin)

### Vista por proceso
```
┌─────────────────────────────────────────────────────────┐
│  📊 REPORTES                                            │
├─────────────────────────────────────────────────────────┤
│  [GUÍAS]  [NOVEDADES]  [TODOS]                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  📦 GENERACIÓN DE GUÍAS - Hoy                          │
│  ┌──────────┬────────┬────────┬────────┬────────┐      │
│  │ Usuario  │ Rondas │ Realiz │ Cancel │ Meta % │      │
│  ├──────────┼────────┼────────┼────────┼────────┤      │
│  │ Juan     │   4    │   52   │   3    │  104%  │      │
│  │ María    │   3    │   38   │   5    │   76%  │      │
│  │ Pedro    │   5    │   61   │   2    │  122%  │      │
│  └──────────┴────────┴────────┴────────┴────────┘      │
│                                                         │
│  🔔 NOVEDADES - Hoy                                    │
│  ┌──────────┬────────┬────────┬────────┬────────┐      │
│  │ Usuario  │ Revis. │ Soluc. │ Devol. │ Pend.  │      │
│  ├──────────┼────────┼────────┼────────┼────────┤      │
│  │ Ana      │   25   │   20   │   3    │   2    │      │
│  │ Luis     │   18   │   15   │   2    │   1    │      │
│  └──────────┴────────┴────────┴────────┴────────┘      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Fases de Implementación

### Fase 1: Actualizar Tracker
- [ ] Agregar pantalla selección de usuario
- [ ] Agregar pantalla selección de proceso
- [ ] Crear modo GUÍAS (ya existe, ajustar)
- [ ] Crear modo NOVEDADES (nuevo)
- [ ] Botón para volver/cambiar proceso

### Fase 2: Sincronización
- [ ] Crear store compartido
- [ ] Sincronizar usuarios desde Procesos 2.0
- [ ] Guardar rondas con tipo (guías/novedades)
- [ ] Guardar usuario que registró

### Fase 3: Actualizar Procesos 2.0
- [ ] Leer datos del Tracker
- [ ] Separar reportes por proceso
- [ ] Mostrar quién registró cada ronda
- [ ] Filtros por proceso

### Fase 4: Reconstruir .exe
- [ ] Actualizar código del Tracker
- [ ] Crear nuevo instalador
- [ ] Probar sincronización

---

## Resumen

| Característica | Antes | Después |
|---------------|-------|---------|
| Usuarios | No identificados | Cada uno elige quién es |
| Procesos | Solo guías | Guías + Novedades |
| Sincronización | No | Sí, automática |
| Reportes | Básicos | Por proceso y usuario |

---

## ¿Empezamos?

Dime **"HAZLO"** para implementar todo.
