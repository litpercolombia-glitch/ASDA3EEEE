# FLUJO REAL DE SEGUIMIENTO DE GUÍAS - LITPER PRO
## Cómo opera el equipo hoy (paso a paso)

---

## 1. CARGA INICIAL DE GUÍAS

### Paso 1.1: Obtener reporte de transportadora
```
OPERADOR:
1. Ingresa al portal de cada transportadora (Coordinadora, Servientrega, etc.)
2. Descarga el reporte Excel del día
3. Guarda en carpeta local

TIEMPO: ~10 minutos por transportadora
FRECUENCIA: 2-3 veces al día (mañana, mediodía, tarde)
```

### Paso 1.2: Cargar en Litper Pro
```
OPERADOR:
1. Abre pestaña "Seguimiento de Guías"
2. Click en "Cargar archivo" o pega texto
3. Sistema detecta transportadora automáticamente
4. Revisa preview de guías detectadas
5. Confirma carga

PROBLEMAS ACTUALES:
- A veces el sistema no detecta bien la transportadora
- Guías duplicadas si se carga el mismo archivo 2 veces
- No hay validación de formato antes de cargar
```

---

## 2. MONITOREO DIARIO

### Paso 2.1: Revisar dashboard
```
SUPERVISOR:
1. Abre dashboard principal
2. Revisa KPIs: total guías, % entregadas, novedades pendientes
3. Identifica ciudades con semáforo rojo
4. Prioriza qué revisar primero

FRECUENCIA: Cada 2 horas
```

### Paso 2.2: Revisar novedades
```
OPERADOR:
1. Filtra por estado "Con Novedad"
2. Revisa cada novedad una por una
3. Decide acción:
   - Contactar cliente (WhatsApp manual)
   - Contactar transportadora
   - Marcar como resuelta
   - Escalar a supervisor

PROBLEMAS ACTUALES:
- No hay priorización automática (urgentes vs normales)
- WhatsApp se envía manual (copiar número, abrir WhatsApp, pegar mensaje)
- No queda registro de intentos de contacto
```

### Paso 2.3: Conciliación manual
```
SUPERVISOR (1 vez al día):
1. Compara reporte de Dropi con estado en Litper
2. Busca discrepancias manualmente
3. Actualiza estados donde no coinciden
4. Reporta casos críticos

TIEMPO: 1-2 horas diarias
PROBLEMAS:
- Proceso 100% manual
- Propenso a errores humanos
- No hay log de cambios
```

---

## 3. GESTIÓN DE NOVEDADES

### Flujo actual de novedad típica
```
1. WEBHOOK LLEGA (automático)
   ↓
2. SISTEMA REGISTRA NOVEDAD (automático)
   ↓
3. OPERADOR VE EN LISTA (manual - cuando revisa)
   ↓
4. OPERADOR CLASIFICA (manual)
   Tipos:
   - Dirección incorrecta
   - Cliente ausente
   - Rechazado
   - Zona difícil
   - Dañado
   ↓
5. OPERADOR DECIDE ACCIÓN (manual)
   ↓
6. EJECUTA ACCIÓN (manual)
   - Llamar cliente
   - Enviar WhatsApp
   - Contactar transportadora
   - Reprogramar entrega
   ↓
7. MARCA COMO GESTIONADA (manual)
   ↓
8. ESPERA NUEVO ESTADO (automático)
```

### Tiempos promedio actuales
| Etapa | Tiempo | Ideal |
|-------|--------|-------|
| Detección de novedad | Inmediato | ✅ |
| Operador la ve | 30 min - 2 horas | ❌ (debería ser < 5 min) |
| Primera acción | 1-4 horas | ❌ (debería ser < 30 min) |
| Resolución total | 24-72 horas | ❌ (debería ser < 24h) |

---

## 4. REPORTES Y CIERRE DEL DÍA

### Paso 4.1: Generar reporte diario
```
SUPERVISOR (fin del día):
1. Exporta Excel con guías del día
2. Filtra por estado final
3. Calcula KPIs manualmente
4. Envía por email a gerencia

PROBLEMAS:
- Excel gigante (puede crashear navegador)
- No hay template automático
- KPIs calculados a mano
```

### Paso 4.2: Marcar guías revisadas
```
OPERADOR (antes de irse):
1. Revisa lista de guías pendientes
2. Marca las que ya gestionó como "revisadas"
3. Deja notas para el siguiente turno

PROBLEMAS:
- No hay badge visual de "revisada"
- Las notas se pierden a veces
- No hay handoff formal entre turnos
```

---

## 5. SOURCE OF TRUTH ACTUAL

### ¿Quién manda para cada dato?

| Dato | Fuente Principal | Respaldo | Conflicto |
|------|------------------|----------|-----------|
| Estado de envío | Transportadora | Dropi | Transportadora gana |
| Datos del cliente | Dropi | - | Dropi manda |
| Dirección entrega | Dropi | Cliente | Dropi + actualización manual |
| Valor del pedido | Dropi | - | Dropi manda |
| Historial de estados | Sistema Litper | - | Log local |
| Notas de gestión | Sistema Litper | - | Log local |

### Problemas de consistencia
```
ESCENARIO COMÚN:
1. Transportadora dice: "ENTREGADO" a las 10:00
2. Dropi sigue diciendo: "EN REPARTO" (no actualiza rápido)
3. Cliente llama: "No me ha llegado nada"
4. ¿A quién le creemos?

DECISIÓN ACTUAL: Manual, caso por caso
DECISIÓN IDEAL: Reglas automatizadas + verificación con cliente
```

---

## 6. INTEGRACIONES ACTUALES

### Chatea (WhatsApp)
```
Estado: PARCIALMENTE AUTOMÁTICO
- Recibe mensajes: ✅ Webhook funciona
- Envía mensajes: ⚠️ Manual desde UI
- Respuestas automáticas: ❌ No implementado
- Seguimiento de conversación: ❌ No implementado
```

### Dropi
```
Estado: VÍA CHATEA/N8N
- Recibe órdenes nuevas: ✅ Webhook
- Recibe actualizaciones: ✅ Webhook
- Envía actualizaciones: ❌ No implementado
- Sincronización bidireccional: ❌ No implementado
```

### Transportadoras
```
Estado: WEBHOOK ENTRANTE
- Coordinadora: ✅ Webhook activo
- Servientrega: ✅ Webhook activo
- Interrapidísimo: ✅ Webhook activo
- TCC: ⚠️ Webhook intermitente
- Envía: ⚠️ Solo consulta manual
```

---

## 7. PAIN POINTS DEL EQUIPO

### Top 5 quejas del equipo operativo
1. "Paso mucho tiempo buscando guías específicas"
2. "WhatsApp manual es muy lento"
3. "A veces el estado no coincide con lo que dice la transportadora"
4. "El Excel se congela cuando hay muchas guías"
5. "No sé cuáles novedades son urgentes vs cuáles pueden esperar"

### Top 5 quejas del supervisor
1. "No tengo visibilidad en tiempo real"
2. "Los reportes son muy manuales"
3. "No sé si el equipo está al día con las novedades"
4. "Cuando hay pico de novedades, no damos abasto"
5. "Las ciudades rojas no se resuelven, solo las vemos"

---

## 8. FLUJO IDEAL (OBJETIVO)

```
PEDIDO NUEVO (Dropi)
    ↓ [automático]
GUÍA CREADA EN LITPER
    ↓ [automático]
WEBHOOK DE TRANSPORTADORA
    ↓ [automático]
ESTADO ACTUALIZADO + RECONCILIACIÓN
    ↓ [automático]
SI NOVEDAD → IA CLASIFICA + PRIORIZA
    ↓ [automático]
IA SUGIERE ACCIÓN
    ↓ [operador confirma con 1 click]
ACCIÓN EJECUTADA (WhatsApp, llamada, etc.)
    ↓ [automático]
LOG COMPLETO + MÉTRICAS
    ↓ [automático]
SIGUIENTE ACCIÓN SI NO SE RESUELVE
```

**Tiempo objetivo: De 2-4 horas a < 30 minutos por novedad**
