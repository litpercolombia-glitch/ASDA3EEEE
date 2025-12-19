// services/brain/unification/SourcePriority.ts
// Define qué fuente tiene la VERDAD para cada tipo de dato

import { DataSource, SourcedData } from '../types/brain.types';

/**
 * Prioridad de fuentes por campo
 * El primero en la lista es el más confiable
 */
export const SOURCE_PRIORITY: Record<string, DataSource[]> = {
  // ESTADO LOGÍSTICO → Tracking es la verdad (viene directo de transportadora)
  status: ['TRACKING', 'DROPI', 'MANUAL', 'SYSTEM'],
  currentStatus: ['TRACKING', 'DROPI', 'MANUAL', 'SYSTEM'],
  lastUpdate: ['TRACKING', 'DROPI', 'SYSTEM'],

  // UBICACIÓN → Tracking es la verdad
  location: ['TRACKING', 'DROPI'],
  currentLocation: ['TRACKING', 'DROPI'],
  origin: ['TRACKING', 'DROPI', 'MANUAL'],
  destination: ['DROPI', 'TRACKING', 'MANUAL'],

  // DATOS DEL CLIENTE → Dropi es la verdad (tiene la orden completa)
  customerName: ['DROPI', 'TRACKING', 'MANUAL'],
  customerPhone: ['DROPI', 'MANUAL', 'TRACKING'],
  customerEmail: ['DROPI', 'MANUAL'],
  customerAddress: ['DROPI', 'TRACKING', 'MANUAL'],

  // DATOS DEL PRODUCTO → Dropi es la verdad
  productName: ['DROPI', 'MANUAL'],
  productQuantity: ['DROPI', 'MANUAL'],
  productValue: ['DROPI', 'MANUAL'],

  // DATOS DE ENVÍO → Tracking es la verdad
  carrier: ['TRACKING', 'DROPI', 'MANUAL'],
  trackingNumber: ['TRACKING', 'DROPI', 'MANUAL'],
  estimatedDelivery: ['TRACKING', 'DROPI'],
  actualDelivery: ['TRACKING', 'DROPI'],

  // DATOS DE ORDEN → Dropi es la verdad
  orderNumber: ['DROPI', 'MANUAL'],
  invoiceNumber: ['DROPI', 'MANUAL'],
  store: ['DROPI', 'MANUAL'],
};

/**
 * Confianza base por fuente (0-100)
 */
export const SOURCE_CONFIDENCE: Record<DataSource, number> = {
  TRACKING: 95,  // Datos directos de transportadora
  DROPI: 85,     // Datos del sistema de órdenes
  MANUAL: 70,    // Ingresado manualmente
  SYSTEM: 60,    // Generado por el sistema
};

/**
 * Resolver cuál fuente usar para un campo específico
 */
export function getPrioritySource(field: string): DataSource[] {
  return SOURCE_PRIORITY[field] || ['TRACKING', 'DROPI', 'MANUAL', 'SYSTEM'];
}

/**
 * Obtener confianza base de una fuente
 */
export function getSourceConfidence(source: DataSource): number {
  return SOURCE_CONFIDENCE[source] || 50;
}

/**
 * Resolver el mejor valor entre múltiples fuentes
 */
export function resolveBestValue<T>(
  field: string,
  values: Array<{ value: T; source: DataSource; timestamp?: Date }>
): SourcedData<T> | null {
  if (values.length === 0) return null;

  const priority = getPrioritySource(field);

  // Ordenar por prioridad de fuente
  const sorted = [...values].sort((a, b) => {
    const priorityA = priority.indexOf(a.source);
    const priorityB = priority.indexOf(b.source);

    // Si una fuente no está en la lista, va al final
    const indexA = priorityA === -1 ? 999 : priorityA;
    const indexB = priorityB === -1 ? 999 : priorityB;

    // Primero por prioridad
    if (indexA !== indexB) return indexA - indexB;

    // Si misma prioridad, el más reciente gana
    if (a.timestamp && b.timestamp) {
      return b.timestamp.getTime() - a.timestamp.getTime();
    }

    return 0;
  });

  const best = sorted[0];

  return {
    value: best.value,
    source: best.source,
    timestamp: best.timestamp || new Date(),
    confidence: getSourceConfidence(best.source),
  };
}

/**
 * Comparar dos valores y decidir cuál es mejor
 */
export function compareValues<T>(
  field: string,
  valueA: SourcedData<T>,
  valueB: SourcedData<T>
): SourcedData<T> {
  const priority = getPrioritySource(field);
  const indexA = priority.indexOf(valueA.source);
  const indexB = priority.indexOf(valueB.source);

  // El de mayor prioridad (menor índice) gana
  if (indexA !== indexB) {
    return (indexA < indexB || indexB === -1) ? valueA : valueB;
  }

  // Si misma prioridad, el más reciente gana
  if (valueA.timestamp > valueB.timestamp) return valueA;
  if (valueB.timestamp > valueA.timestamp) return valueB;

  // Si todo igual, el de mayor confianza
  return valueA.confidence >= valueB.confidence ? valueA : valueB;
}

/**
 * Verificar si un valor debe ser actualizado
 */
export function shouldUpdate<T>(
  field: string,
  current: SourcedData<T> | undefined,
  newValue: SourcedData<T>
): boolean {
  if (!current) return true;

  const priority = getPrioritySource(field);
  const currentIndex = priority.indexOf(current.source);
  const newIndex = priority.indexOf(newValue.source);

  // Nueva fuente de mayor prioridad
  if (newIndex < currentIndex && newIndex !== -1) return true;

  // Misma fuente pero más reciente
  if (newValue.source === current.source && newValue.timestamp > current.timestamp) {
    return true;
  }

  // Fuente de menor prioridad con data más reciente (solo si pasa umbral de tiempo)
  if (newIndex > currentIndex) {
    const hoursDiff = (newValue.timestamp.getTime() - current.timestamp.getTime()) / 1000 / 60 / 60;
    // Si la data actual tiene más de 24h, aceptar la nueva aunque sea de menor prioridad
    if (hoursDiff > 24) return true;
  }

  return false;
}

export default {
  SOURCE_PRIORITY,
  SOURCE_CONFIDENCE,
  getPrioritySource,
  getSourceConfidence,
  resolveBestValue,
  compareValues,
  shouldUpdate,
};
