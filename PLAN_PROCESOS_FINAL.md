# PLAN: Procesos 2.0 - Sistema de Gestión de Usuarios

## OBJETIVO
Sistema donde cada persona selecciona su usuario, registra su trabajo, y SOLO el admin ve los reportes completos.

---

## REQUISITOS PRINCIPALES

### 1. GESTIÓN DE USUARIOS
- ✅ Agregar usuarios (nombre, avatar, color, meta diaria)
- ✅ Editar usuarios
- ✅ Eliminar usuarios
- ✅ Cada persona selecciona su usuario al entrar
- ❌ SIN ranking visible (nadie ve quién va ganando)

### 2. MODO ADMIN
- 🔐 **Contraseña:** `LITPER TU PAPA`
- Solo admin puede:
  - Agregar/editar/eliminar usuarios
  - Ver reportes de TODOS
  - Ver análisis y estadísticas
  - Exportar datos

### 3. VISTA USUARIO NORMAL
- Solo ve SU progreso
- Solo ve SUS rondas
- NO ve datos de otros
- NO ve ranking

---

## CAMPOS A REGISTRAR POR RONDA

Basado en tu app actual:

| Campo | Descripción |
|-------|-------------|
| Pedidos Iniciales | Cuántos pedidos tenía al empezar |
| Realizado | Guías completadas |
| Cancelado | Guías canceladas |
| Agendado | Guías agendadas para después |
| Difíciles | Guías con problemas |
| Pendientes | Guías que quedaron pendientes |
| Revisado | Guías revisadas |
| Tiempo usado | Minutos de la ronda |

---

## REPORTES ADMIN (COMPLETOS)

### A. REPORTE DIARIO
```
┌─────────────────────────────────────────────────────┐
│ REPORTE DEL DÍA: 15 Diciembre 2024                  │
├─────────────────────────────────────────────────────┤
│ Usuario      │ Rondas │ Realizadas │ Cancel │ Meta │
├─────────────────────────────────────────────────────┤
│ María        │   5    │    78      │   12   │ 156% │
│ Juan         │   4    │    45      │    8   │  90% │
│ Pedro        │   6    │    92      │    5   │ 184% │
├─────────────────────────────────────────────────────┤
│ TOTAL        │  15    │   215      │   25   │ 143% │
└─────────────────────────────────────────────────────┘
```

### B. REPORTE SEMANAL
- Total por usuario
- Promedio diario
- Mejor día / Peor día
- Tendencia (subiendo/bajando)

### C. REPORTE MENSUAL
- Resumen del mes
- Comparación con mes anterior
- Usuario más productivo
- Días más productivos (lunes, martes, etc.)

### D. ANÁLISIS POR USUARIO
- Historial completo
- Promedio de guías por ronda
- Tiempo promedio por ronda
- Tasa de cancelación
- Horarios más productivos

### E. EXPORTAR
- Excel con todos los datos
- PDF con gráficos
- Filtrar por fecha/usuario

---

## IDEAS ESPECÍFICAS ADICIONALES

### 1. 📊 DASHBOARD ADMIN
```
┌──────────────────────────────────────────────────────┐
│  HOY                        │  ESTA SEMANA           │
│  ────                       │  ───────────           │
│  👥 3 usuarios activos      │  📦 1,245 guías        │
│  📦 215 guías hoy           │  ❌ 89 canceladas      │
│  ⏱️ 4.2 min promedio        │  📈 +12% vs anterior   │
└──────────────────────────────────────────────────────┘
```

### 2. 🔔 ALERTAS AUTOMÁTICAS (Solo Admin)
- Usuario lleva 2+ horas sin registrar ronda
- Usuario con tasa de cancelación alta (>20%)
- Usuario por debajo del 50% de su meta
- Día con menos guías que el promedio

### 3. 📈 GRÁFICOS
- Guías por hora del día
- Guías por día de la semana
- Tendencia de los últimos 30 días
- Comparación entre usuarios (solo admin)

### 4. ⏱️ CRONÓMETRO MEJORADO
- Seleccionar tiempo: 15, 20, 25, 30, 45, 60 min
- Colores de alerta:
  - 🟢 Verde: >50% tiempo
  - 🟡 Amarillo: 25-50% tiempo
  - 🟠 Naranja: 10-25% tiempo
  - 🔴 Rojo: <10% tiempo
- Sonido al terminar
- Auto-guardar ronda al terminar

### 5. 📝 NOTAS POR RONDA
- Campo opcional para notas
- "Cliente difícil", "Problema de sistema", etc.
- Admin puede ver todas las notas

### 6. 🎯 METAS PERSONALIZADAS
- Meta diaria por usuario (el admin la configura)
- Meta semanal automática (meta diaria × 5)
- Barra de progreso personal

### 7. 📱 NOTAS FLOTANTES
- Notas rápidas visibles siempre
- Cada usuario tiene sus propias notas
- Admin puede ver notas de todos

### 8. 🕐 HISTORIAL DE ACTIVIDAD (Admin)
```
10:45 - María completó ronda #3 (18 guías)
10:30 - Juan completó ronda #2 (12 guías)
10:15 - Pedro inició ronda #4
09:45 - María completó ronda #2 (15 guías)
```

---

## ESTRUCTURA DE PANTALLAS

### PANTALLA 1: Selección de Usuario
```
┌─────────────────────────────────────────┐
│         ¿Quién eres?                    │
│                                         │
│   [😊 María]  [😎 Juan]  [🚀 Pedro]     │
│                                         │
│         [🔐 Entrar como Admin]          │
└─────────────────────────────────────────┘
```

### PANTALLA 2: Vista Usuario
```
┌─────────────────────────────────────────┐
│  Hola María 👋        [Cambiar usuario] │
├─────────────────────────────────────────┤
│  Tu progreso hoy: 45/50 (90%)           │
│  ████████████████████░░  90%            │
├─────────────────────────────────────────┤
│  [CRONÓMETRO 25:00]                     │
│  [▶ Iniciar ronda]                      │
├─────────────────────────────────────────┤
│  Tus rondas de hoy:                     │
│  #1 - 9:00am - 15 guías                 │
│  #2 - 9:30am - 18 guías                 │
│  #3 - 10:05am - 12 guías                │
└─────────────────────────────────────────┘
```

### PANTALLA 3: Vista Admin (con contraseña)
```
┌─────────────────────────────────────────┐
│  🔐 PANEL ADMIN                         │
├─────────────────────────────────────────┤
│  [👥 Usuarios]  [📊 Reportes]           │
│  [📈 Análisis]  [⚙️ Config]             │
├─────────────────────────────────────────┤
│  Resumen hoy:                           │
│  - 3 usuarios activos                   │
│  - 215 guías totales                    │
│  - 25 canceladas (11.6%)                │
├─────────────────────────────────────────┤
│  Por usuario:                           │
│  María: 78 ✅ | Juan: 45 ✅ | Pedro: 92 ✅│
└─────────────────────────────────────────┘
```

---

## FASES DE IMPLEMENTACIÓN

### FASE 1: Base
- [ ] Pantalla de selección de usuario
- [ ] Login admin con contraseña
- [ ] CRUD de usuarios (solo admin)
- [ ] Cronómetro funcional

### FASE 2: Registro
- [ ] Formulario de ronda con TODOS los campos
- [ ] Guardar rondas por usuario
- [ ] Vista personal (sin ranking)
- [ ] Progreso hacia meta

### FASE 3: Reportes Admin
- [ ] Reporte diario
- [ ] Reporte semanal
- [ ] Reporte mensual
- [ ] Análisis por usuario

### FASE 4: Extras
- [ ] Alertas automáticas
- [ ] Gráficos
- [ ] Exportar Excel/PDF
- [ ] Historial de actividad
- [ ] Notas flotantes

---

## CONTRASEÑA ADMIN

```
Contraseña: LITPER TU PAPA
```

- Se pide al hacer clic en "Entrar como Admin"
- Se guarda en sesión (no pide cada vez)
- Botón "Salir de Admin" para volver a vista normal

---

¿Apruebas este plan? Dime "hazlo" para implementar.
