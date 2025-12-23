# Guia de Usuario: LitperPro Chat-First

## Descripcion General

LitperPro utiliza un diseno **Chat-First**, donde el chat con IA es el centro de toda la experiencia. En lugar de navegar entre multiples pantallas, puedes hacer todo desde el chat.

---

## Pantalla Principal

Al entrar a LitperPro, veras:

```
┌─────────────────────────────────────────────────────────────┐
│  LITPER PRO - Centro de Comando IA           [Refresh] [⚙]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  📊 CONTEXTO EN VIVO                                │    │
│  │  [Total] [Entregados] [Transito] [Riesgo] [Issues]  │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  💡 INSIGHTS PROACTIVOS (si hay alertas)            │    │
│  │  - Alertas criticas                                 │    │
│  │  - Sugerencias                                      │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  💬 CHAT                                            │    │
│  │  "Buenos dias! Tienes X envios activos..."          │    │
│  │                                                     │    │
│  │  [Escribe un comando o pregunta...]                 │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  🔮 SKILLS                                          │    │
│  │  [Seguimiento] [Alertas] [Reportes]                 │    │
│  │  [Predicciones] [Automatizar]                       │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Las 5 Skills

### 1. 📦 Seguimiento
**Que hace:** Muestra el estado de todos tus envios en tiempo real.

**Comandos de ejemplo:**
- "Donde esta la guia 123456?"
- "Muestrame envios a Bogota"
- "Cuales estan retrasados?"
- "Que envios tienen mas de 5 dias?"

**Panel de Skill:**
- Stats rapidas (total, criticos, en transito)
- Busqueda por guia, telefono o ciudad
- Filtros por estado
- Lista de envios con alertas visuales

---

### 2. 🚨 Alertas (Semaforo)
**Que hace:** Sistema de semaforo por ciudad para identificar problemas.

**Comandos de ejemplo:**
- "Que ciudades estan criticas?"
- "Pausar alertas de Cali"
- "Envia alerta al equipo"
- "Por que Bogota esta en rojo?"

**Panel de Skill:**
- Resumen global (criticas, atencion, saludables)
- Lista de ciudades con score y color
- Tendencias (mejorando/empeorando)
- Opcion de silenciar ciudades

---

### 3. 📊 Reportes
**Que hace:** Genera reportes ejecutivos con un click.

**Comandos de ejemplo:**
- "Genera el reporte de hoy"
- "Compara esta semana vs anterior"
- "Como va Coordinadora?"
- "Dame las estadisticas de exito"

**Templates disponibles:**
- Reporte Diario
- Envios Criticos
- Rendimiento
- Por Transportadora
- Por Ciudad
- Ejecutivo

---

### 4. 🧠 Predicciones
**Que hace:** Usa ML para predecir entregas y recomendar transportadoras.

**Comandos de ejemplo:**
- "Que envios van a fallar?"
- "Predice como estara manana"
- "Que transportadora me recomiendas?"
- "Cuales tienen mayor riesgo?"

**Panel de Skill:**
- Probabilidad de entrega por envio
- Niveles de riesgo (Alto/Medio/Bajo)
- Recomendaciones de transportadora
- Scores comparativos

---

### 5. ⚙️ Automatizar
**Que hace:** Automatiza tareas repetitivas y carga datos.

**Comandos de ejemplo:**
- "Carga este Excel"
- "Crea regla: si retraso > 3 dias, alerta"
- "Automatiza mensaje a cliente"
- "Programa reporte diario"

**Acciones rapidas:**
- Cargar Excel (drag & drop)
- Alertar equipo
- Mensajes masivos
- Programar reportes

---

## Ejemplos de Uso Diario

### Manana (8-10 AM)
```
Usuario: "Buenos dias"
IA: "Buenos dias! Tienes 1,284 envios activos con 89% de tasa de entrega.
     Atencion: 23 envios criticos y 3 ciudades con problemas.
     ¿Que hacemos primero?"

Usuario: "Muestrame los criticos"
[Se abre panel de Seguimiento filtrado por criticos]

Usuario: "Genera alerta para el equipo sobre estas ciudades"
IA: "He generado la alerta. ¿Quieres enviarla por WhatsApp o email?"
```

### Mediodia (12-2 PM)
```
Usuario: "Como vamos hoy?"
IA: "Van bien! De 1,284 envios:
     - 156 entregados esta manana
     - 89% tasa de entrega
     - Bogota mejoro 12% vs ayer

     Sugerencia: Revisar 8 envios en Cali que llevan 4 dias."

Usuario: "Revisa Cali"
[Se abre panel de Alertas centrado en Cali]
```

### Cierre del Dia (5-6 PM)
```
Usuario: "Genera el reporte de cierre"
IA: "Reporte del dia generado:
     - 312 entregas completadas
     - 92% tasa de efectividad
     - Top: Medellin (96%)
     - Atencion: Barranquilla (78%)

     ¿Lo exporto a PDF o lo envio por email?"
```

---

## Tips y Trucos

### 1. Usa lenguaje natural
No necesitas comandos exactos. El sistema entiende:
- "que pasa con bogota" = "Analiza la situacion de Bogota"
- "guias problematicas" = "Muestrame envios con novedades"

### 2. Skills como atajos
Haz clic en una skill para ver datos + chat contextual al mismo tiempo.

### 3. Acciones en mensajes
Los botones en los mensajes del chat ejecutan acciones directamente.

### 4. Contexto persistente
El chat recuerda la conversacion. Puedes decir "y de ayer?" sin repetir contexto.

### 5. Insights proactivos
Pon atencion a las alertas automaticas - el sistema detecta problemas antes que tu.

---

## Atajos de Teclado

| Atajo | Accion |
|-------|--------|
| `Enter` | Enviar mensaje |
| `Ctrl+K` | Busqueda universal |
| `Esc` | Cerrar panel de skill |

---

## Preguntas Frecuentes

**P: ¿Como cargo mis guias?**
R: Di "Quiero cargar guias" o haz clic en la skill "Automatizar" y arrastra tu Excel.

**P: ¿Por que algunas ciudades estan en rojo?**
R: El sistema calcula un score basado en tasa de entrega, velocidad y novedades. Rojo = problemas criticos.

**P: ¿Puedo ver el dashboard clasico?**
R: Si, accede desde el menu a "Dashboard Legacy" para la vista tradicional.

**P: ¿Los reportes se pueden programar?**
R: Si, usa la skill "Automatizar" > "Programar Reporte" o di "Programa un reporte diario a las 8am".

---

## Soporte

Si tienes problemas o sugerencias:
1. Usa el chat: "Tengo un problema con..."
2. Accede al Admin Panel para configuracion avanzada
3. Revisa los logs en Configuracion > Sistema

---

*Version: Chat-First 2.0*
*Ultima actualizacion: 2024*
