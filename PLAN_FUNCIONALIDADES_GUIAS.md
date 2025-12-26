# Plan de Implementación: Sistema de Revisión de Guías y Hojas de Carga

## Resumen de Funcionalidades Solicitadas

1. **Marcar guías como revisadas** - Ícono tipo "check" al copiar número de guía
2. **Informe de revisión** - Mostrar guías revisadas vs no revisadas
3. **Sistema de hojas por carga** - Cada carga como hoja separada, eliminar hojas, ver todas
4. **Corrección de estatus** - Siempre tomar el último movimiento de la transportadora
5. **Metadata de carga** - Nombre de usuario y transportadoras al guardar

---

## FASE 1: Sistema de Guías Revisadas (Check de Meta)

### 1.1 Modificar Tipos de Datos

**Archivo:** `types/carga.types.ts`

```typescript
// Agregar a GuiaCarga:
interface GuiaCarga {
  // ... campos existentes
  revisada: boolean;              // Si fue revisada
  fechaRevision?: Date;           // Cuándo se revisó
  revisadoPor?: string;           // Usuario que revisó
}
```

### 1.2 Crear Hook para Detectar Copia de Guía

**Archivo nuevo:** `hooks/useGuideCopyDetector.ts`

- Detectar cuando el usuario copia el número de guía
- Usar `navigator.clipboard` API o evento `copy`
- Marcar automáticamente como revisada cuando se copia
- Mostrar notificación visual (toast)

```typescript
// Lógica:
1. Agregar listener de copia en tabla de guías
2. Cuando se copia, extraer número de guía
3. Llamar a cargaService.marcarGuiaRevisada(guiaId)
4. Actualizar UI con ícono de check animado
```

### 1.3 Componente de Ícono de Revisado

**Archivo nuevo:** `components/ReviewedBadge.tsx`

- Ícono tipo verificado de Meta (check azul circular)
- Animación al aparecer (fade-in + escala)
- Tooltip con fecha y usuario que revisó

```css
/* Estilo similar a Meta verified */
.reviewed-badge {
  background: #1877f2;
  border-radius: 50%;
  color: white;
  animation: verifyPop 0.3s ease;
}
```

### 1.4 Actualizar GuideTable.tsx

- Agregar columna "REVISADA" con el badge
- Botón para copiar guía con auto-marcado
- Indicador visual diferente para revisadas vs no revisadas
- Click en guía = copiar al portapapeles + marcar revisada

---

## FASE 2: Informe de Revisión

### 2.1 Componente de Estadísticas de Revisión

**Archivo nuevo:** `components/ReviewReportPanel.tsx`

```
┌─────────────────────────────────────────────┐
│  INFORME DE REVISIÓN                        │
├─────────────────────────────────────────────┤
│  ✅ Revisadas:    45/100  (45%)             │
│  ⏳ Pendientes:   55/100  (55%)             │
│                                             │
│  [Barra de progreso visual]                 │
│                                             │
│  Por transportadora:                        │
│  • Inter Rapidísimo: 20/30 revisadas        │
│  • Coordinadora: 15/40 revisadas            │
│  • Envía: 10/30 revisadas                   │
├─────────────────────────────────────────────┤
│  [Ver solo pendientes] [Ver solo revisadas] │
│  [Exportar informe]                         │
└─────────────────────────────────────────────┘
```

### 2.2 Exportar Informe de Revisión

- Generar Excel con columnas: Guía, Estado, Transportadora, Revisada, Fecha Revisión
- Separar en pestañas: "Revisadas" y "Pendientes"
- Incluir resumen estadístico

### 2.3 Filtros de Revisión

- Agregar filtro en `GuideFilterPanel.tsx`:
  - "Todas"
  - "Solo revisadas ✅"
  - "Solo pendientes ⏳"

---

## FASE 3: Sistema de Hojas por Carga

### 3.1 Rediseño de Interfaz de Cargas

**Archivo nuevo:** `components/CargaSheetsManager.tsx`

```
┌─────────────────────────────────────────────────────────────┐
│  HOJAS DE CARGA                                             │
├─────────────────────────────────────────────────────────────┤
│  [📋 Todas] [Hoja 1 ✕] [Hoja 2 ✕] [Hoja 3 ✕] [+ Nueva]     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Hoja actual: "26-Dic-2025 Carga #2"                       │
│  Usuario: Juan Pérez                                        │
│  Transportadoras: Inter, Coordinadora                       │
│  Guías: 45 | Revisadas: 20                                  │
│                                                             │
│  [Tabla de guías de esta hoja]                              │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  [🗑️ Eliminar hoja] [💾 Guardar hoja] [📤 Exportar]        │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Funcionalidades de Hojas

**Archivo:** `services/cargaService.ts` - Agregar métodos:

```typescript
// Obtener todas las hojas (cargas) con metadata
getHojasConMetadata(): HojaResumen[]

// Eliminar hoja específica
eliminarHoja(cargaId: string): boolean

// Combinar todas las hojas en vista única
getCargasCombinadas(): GuiaCarga[]

// Obtener metadata de hoja
getMetadataHoja(cargaId: string): {
  usuario: string;
  transportadoras: string[];
  totalGuias: number;
  revisadas: number;
  fechaCreacion: Date;
}
```

### 3.3 Vista "Mostrar Todas"

- Combina guías de todas las hojas
- Muestra columna adicional "HOJA" con número de carga
- Filtros aplicables a todas las hojas
- Exportación conjunta

### 3.4 Confirmación de Eliminación

- Modal de confirmación antes de eliminar hoja
- Mostrar resumen de lo que se perderá
- Opción de "archivar" en lugar de eliminar

---

## FASE 4: Corrección de Estatus (Último Movimiento)

### 4.1 Modificar Parser de Reportes

**Archivo:** `utils/excelParser.ts` y hooks relacionados

El problema actual: El estatus no siempre refleja el último movimiento.

**Solución:**

```typescript
// Cuando se parsea el reporte, ejemplo:
/*
Número: 240040759904
Estatus del paquete: Entregado (6 Días)
Inter Rapidisimo (INTER RAPIDÍSIMO):
2025-12-01 15:16 SARAVENA ARAU COL Tú envío fue entregado  <-- ESTE ES EL ÚLTIMO
2025-12-01 08:03 SARAVENA ARAU COL No logramos hacer la entrega
...
*/

function extraerEstadoReal(historial: string[]): string {
  // El historial viene ordenado del más reciente al más antiguo
  // El primer movimiento después del nombre de la transportadora es el estado real

  // Buscar patrón: YYYY-MM-DD HH:MM UBICACION DESCRIPCION
  const primerMovimiento = historial[0]; // Primer evento = más reciente

  // Extraer la descripción del movimiento
  // "2025-12-01 15:16 SARAVENA ARAU COL Tú envío fue entregado"
  // Resultado: "Tú envío fue entregado" -> Mapear a "Entregado"

  return mapearDescripcionAEstado(descripcion);
}
```

### 4.2 Mapeo de Descripciones a Estados

```typescript
const MAPEO_ESTADOS = {
  // Inter Rapidísimo
  'envío fue entregado': 'Entregado',
  'no logramos hacer la entrega': 'Intento fallido',
  'en centro logístico destino': 'En destino',
  'viajando a tu destino': 'En tránsito',
  'en centro logístico de tránsito': 'En tránsito',
  'recibimos tú envío': 'Recibido',

  // Coordinadora
  'entrega exitosa': 'Entregado',
  'en reparto': 'En reparto',
  'en terminal': 'En terminal',

  // Envía
  'entregado': 'Entregado',
  'en camino': 'En tránsito',
  // ... etc
};
```

### 4.3 Actualizar Lógica de Carga

Cuando se carga un reporte:
1. Parsear todo el historial de movimientos
2. Tomar SIEMPRE el primer movimiento (más reciente)
3. Extraer la descripción y mapear a estado normalizado
4. Guardar tanto el estado normalizado como la descripción original

---

## FASE 5: Metadata de Carga (Usuario y Transportadoras)

### 5.1 Mostrar Metadata al Guardar

**Modificar:** `components/GuideLoadingWizard.tsx`

Al presionar "Guardar carga":

```
┌─────────────────────────────────────────────┐
│  ✅ CARGA GUARDADA                          │
├─────────────────────────────────────────────┤
│  Nombre: 26-Dic-2025 Carga #2               │
│  Guardada por: Juan Pérez                   │
│  Fecha: 26/12/2025 14:30                    │
│                                             │
│  Transportadoras:                           │
│  • Inter Rapidísimo (45 guías)              │
│  • Coordinadora (30 guías)                  │
│  • Envía (25 guías)                         │
│                                             │
│  Total: 100 guías                           │
└─────────────────────────────────────────────┘
```

### 5.2 Mostrar Metadata en Lista de Hojas

Cada hoja en el selector debe mostrar:
- Nombre de la carga
- Usuario que la creó
- Íconos de transportadoras presentes
- Conteo de guías

---

## Orden de Implementación Recomendado

### Paso 1: Corrección de Estatus (Prioridad ALTA)
- Es la base para que todo funcione correctamente
- Modificar parser para extraer último movimiento
- Tiempo estimado: Afecta la precisión de todos los datos

### Paso 2: Sistema de Hojas
- Infraestructura para manejar múltiples cargas
- CRUD de hojas
- Vista combinada

### Paso 3: Marcar como Revisadas
- Agregar campo `revisada` a tipos
- Implementar detección de copia
- Actualizar tabla con badges

### Paso 4: Informe de Revisión
- Depende de Paso 3
- Panel de estadísticas
- Exportación

### Paso 5: Metadata
- Depende de Paso 2
- Mostrar info al guardar
- Badges en selector de hojas

---

## Archivos a Crear/Modificar

### Nuevos Archivos:
1. `hooks/useGuideCopyDetector.ts`
2. `components/ReviewedBadge.tsx`
3. `components/ReviewReportPanel.tsx`
4. `components/CargaSheetsManager.tsx`

### Archivos a Modificar:
1. `types/carga.types.ts` - Agregar campos de revisión
2. `services/cargaService.ts` - Métodos para hojas y revisión
3. `components/GuideTable.tsx` - Columna revisada, copiar
4. `components/GuideLoadingWizard.tsx` - Mostrar metadata
5. `utils/excelParser.ts` - Extraer último movimiento como estado
6. `components/intelligence/GuideFilterPanel.tsx` - Filtros de revisión

---

## Notas Técnicas

### Detección de Copia
```typescript
// Método recomendado: Clipboard API
const handleCopyGuide = async (guiaNumero: string, guiaId: string) => {
  await navigator.clipboard.writeText(guiaNumero);
  cargaService.marcarGuiaRevisada(guiaId);
  toast.success(`✅ ${guiaNumero} copiada y marcada como revisada`);
};
```

### Persistencia de Revisiones
- Las revisiones se guardan en localStorage junto con la carga
- Se sincronizan al actualizar la carga

### Rendimiento
- Usar `useMemo` para cálculos de estadísticas
- Lazy loading para hojas con muchas guías
- Virtualización si hay más de 500 guías

---

## Pregunta para el Usuario

Antes de comenzar la implementación:

1. **Sobre el check de revisada:** ¿Quieres que SOLO se marque al copiar, o también tener un botón manual para marcar/desmarcar?

2. **Sobre las hojas:** ¿Las hojas deben ser persistentes (sobrevivir al cerrar el navegador) o solo durante la sesión?

3. **Sobre eliminar hojas:** ¿Prefieres eliminar permanentemente o mover a "archivadas"?

4. **Sobre el usuario:** ¿Ya tienes un sistema de autenticación/usuarios, o usamos un nombre fijo por ahora?
