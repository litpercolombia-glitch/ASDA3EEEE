# PLAN: LITPER PROCESOS 2.0

## Resumen de lo que quieres

1. ✅ Agregar/eliminar usuarios
2. ✅ Cronómetro cuenta regresiva (resta tiempo)
3. ✅ Colores bonitos por usuario
4. ✅ Panel administrador con reportes + IA
5. ✅ App de notas flotante (siempre visible)
6. ✅ Gamificación (puntos, logros, personalización)
7. ✅ Privacidad (usuario solo ve lo suyo)

---

## 1. GESTIÓN DE USUARIOS

### Funcionalidades:
```
┌─────────────────────────────────────────┐
│  👥 USUARIOS                    [+ Nuevo] │
├─────────────────────────────────────────┤
│  🟣 María García        ⚙️  🗑️           │
│  🟢 Carlos López        ⚙️  🗑️           │
│  🔵 Ana Martínez        ⚙️  🗑️           │
│  🟡 Pedro Sánchez       ⚙️  🗑️           │
└─────────────────────────────────────────┘
```

### Datos del usuario:
- Nombre
- Color personalizado (elegible)
- Avatar/emoji
- Meta diaria de guías
- Sonido de alerta personalizado

---

## 2. CRONÓMETRO CUENTA REGRESIVA

### Cómo funciona:
```
┌─────────────────────────────────────────┐
│         ⏱️ TIEMPO RESTANTE              │
│                                         │
│           25:00                         │
│      ████████████░░░░░░░░              │
│                                         │
│    [▶️ Iniciar]  [⏸️ Pausar]  [🔄 Reset] │
│                                         │
│  ⚙️ Configurar: 15 | 25 | 45 | 60 min  │
└─────────────────────────────────────────┘
```

### Alertas:
- 🟢 Verde: Tiempo suficiente (>50%)
- 🟡 Amarillo: Mitad del tiempo (25-50%)
- 🟠 Naranja: Poco tiempo (<25%)
- 🔴 Rojo: Últimos 5 minutos (parpadea)
- 🔔 Sonido cuando termina

---

## 3. COLORES POR USUARIO

### Paleta disponible:
```
🟣 Morado    #8B5CF6
🔵 Azul     #3B82F6
🟢 Verde    #10B981
🟡 Amarillo #F59E0B
🟠 Naranja  #F97316
🔴 Rojo     #EF4444
💗 Rosa     #EC4899
🩵 Cyan     #06B6D4
```

### Aplicación del color:
- Borde de tarjeta del usuario
- Icono/avatar
- Barras de progreso
- Gráficos en reportes

---

## 4. PANEL ADMINISTRADOR

### Vista Admin:
```
┌─────────────────────────────────────────┐
│  👑 PANEL ADMINISTRADOR                 │
├─────────────────────────────────────────┤
│                                         │
│  📊 REPORTES DE HOY                     │
│  ┌─────────┬─────────┬─────────┐       │
│  │ María   │ Carlos  │ Ana     │       │
│  │ 45 ✅   │ 38 ✅   │ 52 ✅   │       │
│  │ 3 ❌    │ 5 ❌    │ 2 ❌    │       │
│  └─────────┴─────────┴─────────┘       │
│                                         │
│  🤖 ALERTAS IA                          │
│  ⚠️ María lleva 15min sin registrar    │
│  💡 Carlos mejoró 20% vs ayer          │
│  🎯 Ana cerca de meta diaria           │
│                                         │
│  📈 GRÁFICOS                            │
│  [Por hora] [Por usuario] [Semanal]    │
│                                         │
└─────────────────────────────────────────┘
```

### Reportes incluidos:
- Guías por usuario (hoy/semana/mes)
- Tiempo promedio por guía
- Comparativo entre usuarios
- Tendencias (mejorando/empeorando)
- Exportar a Excel

### IA - Alertas automáticas:
- "María lleva 20 minutos inactiva"
- "Carlos completó su meta diaria 🎉"
- "Rendimiento del equipo 15% arriba vs ayer"
- "Hora pico: 10-12am tienen más guías"

### IA - Recomendaciones:
- "Asignar más guías a Ana (es la más rápida)"
- "Carlos trabaja mejor en la tarde"
- "Reducir meta de María los lunes"

---

## 5. APP DE NOTAS FLOTANTE

### Diseño:
```
┌─────────────────────────────┐
│ 📝 Notas Rápidas      ─ □ x │
├─────────────────────────────┤
│                             │
│ • Llamar cliente 3125551234 │
│ • Revisar guía #45678       │
│ • Preguntar a jefe          │
│                             │
│ [+ Nueva nota]              │
├─────────────────────────────┤
│ 📌 Siempre visible    ✅    │
│ 🔒 Bloquear posición        │
│ ➖ Minimizar                │
│ 👁️ Ocultar                  │
└─────────────────────────────┘
```

### Funciones (como en tu imagen):
- **Siempre visible**: Queda encima de todo (Alt+T)
- **Bloquear**: No se puede mover (Alt+L)
- **Minimizar**: Solo barra de título (Alt+M)
- **Ocultar**: Desaparece temporalmente (Alt+F4)
- **Ocultar otros**: Solo notas visibles (Alt+F3)

### Características:
- Arrastrar a cualquier posición
- Redimensionar
- Múltiples notas
- Colores por importancia
- Guardar automático

---

## 6. GAMIFICACIÓN

### Sistema de puntos:
```
┌─────────────────────────────────────────┐
│  🎮 TUS ESTADÍSTICAS                    │
├─────────────────────────────────────────┤
│                                         │
│  ⭐ NIVEL 12 - Experto                  │
│  ████████████░░░░░░░░  2,450 / 3,000 XP │
│                                         │
│  🏆 LOGROS DESBLOQUEADOS: 8/20          │
│  [🔥 Racha 5 días] [⚡ 50 guías/día]   │
│  [🎯 100% meta] [🌟 Sin errores]        │
│                                         │
│  🎨 MI PERSONALIZACION                  │
│  Avatar: 🦊  Color: 🟣  Sonido: 🔔     │
│                                         │
└─────────────────────────────────────────┘
```

### Puntos por acción:
| Acción | Puntos |
|--------|--------|
| Guía completada | +10 XP |
| Sin cancelaciones | +5 XP bonus |
| Meta diaria cumplida | +50 XP |
| Racha de días | +20 XP/día |
| Mejor tiempo del día | +30 XP |

### Logros desbloqueables:
- 🔥 **Racha de fuego**: 5 días seguidos
- ⚡ **Velocista**: 50 guías en un día
- 🎯 **Perfeccionista**: 100% meta cumplida
- 🌟 **Sin errores**: 0 cancelaciones en el día
- 🏆 **Campeón semanal**: Más guías de la semana
- 💎 **Veterano**: 1000 guías totales
- 🚀 **Cohete**: Mejor tiempo promedio
- 👑 **Leyenda**: Nivel 20 alcanzado

### Personalización (desbloqueable):
- **Avatares**: 🦊 🐱 🦁 🐼 🦄 🐲 (con puntos)
- **Colores**: Más colores premium
- **Sonidos**: Diferentes alertas
- **Temas**: Modo oscuro especial, neón, etc.

---

## 7. PRIVACIDAD

### Lo que ve el USUARIO:
```
✅ Sus propias guías
✅ Su cronómetro
✅ Sus puntos y logros
✅ Sus notas
✅ Su ranking (posición, no datos de otros)
❌ NO ve datos de otros usuarios
❌ NO ve nombres de otros en ranking
```

### Lo que ve el ADMIN:
```
✅ Todos los usuarios
✅ Todas las guías
✅ Reportes comparativos
✅ Alertas de todos
✅ Exportar datos
```

---

## ESTRUCTURA DE ARCHIVOS

```
components/features/procesos/
├── index.ts
├── types.ts
├── ProcesosTab.tsx              # Contenedor principal
├── components/
│   ├── UserManager.tsx          # Gestión de usuarios
│   ├── CountdownTimer.tsx       # Cronómetro regresivo
│   ├── GuiasForm.tsx           # Formulario de guías
│   ├── NovedadesForm.tsx       # Formulario novedades
│   ├── FloatingNotes.tsx       # Notas flotantes
│   ├── AdminDashboard.tsx      # Panel admin
│   ├── AIAlerts.tsx            # Alertas IA
│   ├── GamificationPanel.tsx   # Puntos y logros
│   ├── UserStats.tsx           # Estadísticas usuario
│   └── Leaderboard.tsx         # Ranking (privado)
├── hooks/
│   ├── useCountdown.ts         # Lógica cronómetro
│   ├── useGamification.ts      # Lógica puntos
│   ├── useFloatingWindow.ts    # Lógica notas
│   └── useAIRecommendations.ts # Lógica IA
└── stores/
    └── procesosStore.ts        # Estado global
```

---

## DISEÑO VISUAL

### Colores del tema:
```css
/* Fondo principal */
--bg-dark: #0f172a;
--bg-card: #1e293b;

/* Colores de usuario (vibrantes) */
--user-purple: #8B5CF6;
--user-blue: #3B82F6;
--user-green: #10B981;
--user-yellow: #F59E0B;
--user-pink: #EC4899;

/* Estados del cronómetro */
--timer-ok: #10B981;      /* Verde */
--timer-warning: #F59E0B;  /* Amarillo */
--timer-danger: #EF4444;   /* Rojo */

/* Gamificación */
--xp-gold: #FFD700;
--level-up: #8B5CF6;
```

---

## ORDEN DE IMPLEMENTACIÓN

### Fase 1: Base
1. [ ] Gestión de usuarios (agregar/eliminar)
2. [ ] Cronómetro cuenta regresiva
3. [ ] Colores por usuario

### Fase 2: Admin
4. [ ] Panel administrador
5. [ ] Reportes básicos
6. [ ] Alertas IA simples

### Fase 3: Extras
7. [ ] App de notas flotante
8. [ ] Sistema de puntos
9. [ ] Logros y personalización

---

## ¿QUIERES QUE EMPIECE?

Dime si quieres que:
- **A)** Empiece a implementar todo
- **B)** Modifique algo del plan
- **C)** Te explique algo más detallado

---

*Plan creado el 15 de Diciembre 2024*
