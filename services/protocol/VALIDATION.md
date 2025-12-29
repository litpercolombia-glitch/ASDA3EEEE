# Validación en Seco (Dry Run)

## ⚠️ OBLIGATORIO antes de PR #4

Antes de ejecutar acciones reales (WhatsApp), **debes validar** que las decisiones del ProtocolEngine son correctas.

---

## Cómo Ejecutar la Simulación

### 1. Simulación básica

```typescript
import { DryRunSimulator } from './services/protocol';

// Correr simulación
const report = DryRunSimulator.runSimulation();

// Ver reporte formateado
console.log(DryRunSimulator.formatReport(report));
```

### 2. Simulación con filtros

```typescript
const report = DryRunSimulator.runSimulation({
  // Solo guías de los últimos 7 días
  since: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),

  // Analizar falsos positivos
  analyzeFalsePositives: true,

  // Limitar a 1000 guías
  limit: 1000,
});
```

### 3. Exportar resultados

```typescript
// JSON para análisis
const json = DryRunSimulator.exportJSON(report);
fs.writeFileSync('dryrun-report.json', json);

// Resumen rápido
console.log(DryRunSimulator.quickSummary(report));
// → "DryRun: 5000 guides would trigger 250 (NO_MOVEMENT_48H: 180 AT_OFFICE_3D: 70) FP rate: 5.2%"
```

---

## Qué Revisar en el Reporte

### 1. Volumen Total

```
Total guides:        5000
Evaluated:           4200
Skipped (terminal):  800
Would trigger:       250 (5.9%)
```

**Pregunta:** ¿5.9% es razonable para tu operación?
- Si es > 20%, probablemente los umbrales son muy agresivos
- Si es < 1%, quizás los umbrales son muy conservadores

### 2. Por Protocolo

```
NO_MOVEMENT_48H: 180 guides (4.3%)
AT_OFFICE_3D:    70 guides (1.7%)
```

**Pregunta:** ¿Estos números tienen sentido operativamente?

### 3. Distribución por Tiempo

```
2-3 days: 45
3-5 days: 85
5-7 days: 50
7+ days:  70
```

**Pregunta:** ¿Hay muchas guías con 7+ días sin movimiento? Eso puede indicar problemas sistémicos.

### 4. Top Ciudades y Transportadoras

```
Top Cities:
  Bogotá: 120
  Medellín: 45
  Cali: 30

Top Carriers:
  Coordinadora: 80
  TCC: 60
  Inter: 40
```

**Pregunta:** ¿Hay alguna transportadora sobre-representada? Puede indicar problemas con ese carrier.

### 5. Falsos Positivos

```
Count: 15
Rate:  6.0%

Examples:
  - GUIA123: Retraso de fin de semana (2.1 days)
  - GUIA456: Apenas cruzó el umbral (48.3 hours)
```

**Aceptable:** < 10% de falsos positivos
**Preocupante:** > 20%

---

## Patrones de Falsos Positivos

| Patrón | Descripción | Acción |
|--------|-------------|--------|
| `WEEKEND_DELAY` | Sin movimiento por fin de semana | Considerar excluir sábado/domingo |
| `JUST_CROSSED_THRESHOLD` | Apenas pasó las 48h | Subir umbral a 52h o añadir grace period |
| `RECENT_NOVELTY_UPDATE` | Novedad actualizada pero no detectada | Mejorar detección de novedades resueltas |

---

## Checklist de Validación

Antes de habilitar PR #4, confirma:

- [ ] Volumen diario estimado es manejable (< X mensajes/día según tu plan de WhatsApp)
- [ ] Tasa de falsos positivos < 10%
- [ ] No hay una ciudad/transportadora con > 50% del volumen (indicaría problema sistémico)
- [ ] La distribución por tiempo tiene sentido (no todos son 7+ días)
- [ ] Revisaste manualmente 10-20 guías que "dispararían" y confirmas que son correctas

---

## Script de Validación Diaria

Crea un cron job para correr esto cada día por 72h:

```typescript
// scripts/daily-dryrun.ts
import { DryRunSimulator } from '../services/protocol';
import fs from 'fs';

const report = DryRunSimulator.runSimulation({
  since: new Date(Date.now() - 24 * 60 * 60 * 1000), // últimas 24h
  analyzeFalsePositives: true,
});

// Log summary
console.log(DryRunSimulator.quickSummary(report));

// Save full report
const filename = `dryrun-${new Date().toISOString().split('T')[0]}.json`;
fs.writeFileSync(`./reports/${filename}`, DryRunSimulator.exportJSON(report));

// Alert if anomalies
if (report.falsePositiveRate > 15) {
  console.warn('⚠️ HIGH FALSE POSITIVE RATE:', report.falsePositiveRate);
}

if (report.totalWouldTrigger > 500) {
  console.warn('⚠️ HIGH VOLUME:', report.totalWouldTrigger);
}
```

---

## Siguiente Paso

Una vez que la simulación muestra resultados aceptables por 24-72h:

1. ✅ Volumen manejable
2. ✅ Falsos positivos < 10%
3. ✅ Revisión manual OK

→ Proceder con PR #4 (ActionExecutor)
