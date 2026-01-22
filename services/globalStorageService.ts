// =====================================================
// SERVICIO DE PERSISTENCIA GLOBAL
// Guarda datos para TODOS los usuarios/dispositivos
// =====================================================

import { Shipment } from '../types';

// NOTA: JSONbin deshabilitado - usar solo localStorage por ahora
// Para habilitar sincronización en la nube, configurar estas variables
const API_BASE_URL = import.meta.env.VITE_STORAGE_API_URL || '';
const MASTER_KEY = import.meta.env.VITE_STORAGE_API_KEY || '';
const BIN_ID = import.meta.env.VITE_STORAGE_BIN_ID || '';
const USE_CLOUD_STORAGE = Boolean(API_BASE_URL && MASTER_KEY && BIN_ID);

// Interface para una Hoja de Carga
export interface HojaCarga {
  id: string;
  nombre: string;
  fechaCreacion: Date;
  fechaActualizacion: Date;
  cantidadGuias: number;
  guias: Shipment[];
  creadoPor: string;
  activo: boolean;
}

// Interface para el almacenamiento global
export interface GlobalStorage {
  hojas: HojaCarga[];
  ultimaActualizacion: Date;
  version: string;
}

// Fallback a localStorage si no hay conexión
const LOCAL_STORAGE_KEY = 'litper_global_hojas';

// =====================================================
// FUNCIONES PRINCIPALES
// =====================================================

/**
 * Obtiene todas las hojas de carga del almacenamiento global
 */
export const obtenerTodasLasHojas = async (): Promise<HojaCarga[]> => {
  // Si cloud storage está configurado, intentar usarlo
  if (USE_CLOUD_STORAGE) {
    try {
      const response = await fetch(`${API_BASE_URL}/${BIN_ID}/latest`, {
        headers: {
          'X-Master-Key': MASTER_KEY,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const storage: GlobalStorage = data.record;

        // Convertir fechas string a Date
        const hojas = storage.hojas.map((h) => ({
          ...h,
          fechaCreacion: new Date(h.fechaCreacion),
          fechaActualizacion: new Date(h.fechaActualizacion),
        }));

        // Guardar en localStorage como backup
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(hojas));

        return hojas;
      }
    } catch (error) {
      console.log('Cloud storage falló, usando localStorage');
    }
  }

  // Usar localStorage (modo por defecto)
  return obtenerHojasLocal();
};

/**
 * Obtiene hojas del almacenamiento local
 */
export const obtenerHojasLocal = (): HojaCarga[] => {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const hojas = JSON.parse(saved);
      return hojas.map((h: any) => ({
        ...h,
        fechaCreacion: new Date(h.fechaCreacion),
        fechaActualizacion: new Date(h.fechaActualizacion),
      }));
    }
  } catch (e) {
    console.error('Error cargando hojas locales:', e);
  }
  return [];
};

/**
 * Guarda una nueva hoja de carga
 * MEJORADO: Mejor manejo de errores y límites
 */
export const guardarNuevaHoja = async (
  guias: Shipment[],
  nombreHoja?: string
): Promise<HojaCarga> => {
  // Validar cantidad de guías - LÍMITE: 1000 guías por hoja
  const MAX_GUIAS_NUEVA_HOJA = 1000;
  if (guias.length > MAX_GUIAS_NUEVA_HOJA) {
    console.warn(`Muchas guías (${guias.length}), limitando a ${MAX_GUIAS_NUEVA_HOJA}`);
  }

  const hojas = await obtenerTodasLasHojas();

  const nuevaHoja: HojaCarga = {
    id: `hoja_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    nombre:
      nombreHoja ||
      `Carga ${new Date().toLocaleDateString('es-CO', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })}`,
    fechaCreacion: new Date(),
    fechaActualizacion: new Date(),
    cantidadGuias: Math.min(guias.length, MAX_GUIAS_NUEVA_HOJA),
    guias: guias.slice(0, MAX_GUIAS_NUEVA_HOJA),
    creadoPor: obtenerIdDispositivo(),
    activo: true,
  };

  // Máximo 20 hojas para evitar problemas de espacio
  const nuevasHojas = [nuevaHoja, ...hojas].slice(0, 20);

  try {
    await guardarHojasGlobal(nuevasHojas);
    console.log(`Hoja guardada: ${nuevaHoja.nombre} con ${nuevaHoja.cantidadGuias} guías`);
  } catch (error: any) {
    console.error('Error guardando hoja:', error);
    throw new Error(`No se pudo guardar la hoja: ${error.message || 'Error de almacenamiento'}`);
  }

  return nuevaHoja;
};

/**
 * Elimina una hoja de carga
 */
export const eliminarHoja = async (hojaId: string): Promise<boolean> => {
  const hojas = await obtenerTodasLasHojas();
  const nuevasHojas = hojas.filter((h) => h.id !== hojaId);

  await guardarHojasGlobal(nuevasHojas);

  return true;
};

/**
 * Elimina una guía individual de una hoja
 */
export const eliminarGuiaDeHoja = async (
  hojaId: string,
  guiaId: string
): Promise<HojaCarga | null> => {
  const hojas = await obtenerTodasLasHojas();
  const hojaIndex = hojas.findIndex((h) => h.id === hojaId);

  if (hojaIndex === -1) return null;

  const hoja = hojas[hojaIndex];
  const nuevasGuias = hoja.guias.filter((g) => g.id !== guiaId);

  // Actualizar la hoja
  const hojaActualizada: HojaCarga = {
    ...hoja,
    guias: nuevasGuias,
    cantidadGuias: nuevasGuias.length,
    fechaActualizacion: new Date(),
  };

  // Si no quedan guías, eliminar la hoja completa
  if (nuevasGuias.length === 0) {
    const nuevasHojas = hojas.filter((h) => h.id !== hojaId);
    await guardarHojasGlobal(nuevasHojas);
    return null;
  }

  // Actualizar la lista de hojas
  const nuevasHojas = [...hojas];
  nuevasHojas[hojaIndex] = hojaActualizada;
  await guardarHojasGlobal(nuevasHojas);

  return hojaActualizada;
};

/**
 * Restaura una hoja de carga (la hace activa)
 */
export const restaurarHoja = async (hojaId: string): Promise<HojaCarga | null> => {
  const hojas = await obtenerTodasLasHojas();
  const hoja = hojas.find((h) => h.id === hojaId);

  if (hoja) {
    // Marcar todas como inactivas y esta como activa
    const nuevasHojas = hojas.map((h) => ({
      ...h,
      activo: h.id === hojaId,
    }));

    await guardarHojasGlobal(nuevasHojas);

    return { ...hoja, activo: true };
  }

  return null;
};

/**
 * Guarda las hojas en el almacenamiento global
 * IMPORTANTE: Limita el tamaño para evitar exceder localStorage (~5MB)
 */
const guardarHojasGlobal = async (hojas: HojaCarga[]): Promise<void> => {
  // Limitar guías por hoja - LÍMITE: 1000 guías por hoja
  const MAX_GUIAS_POR_HOJA = 1000;
  const MAX_HOJAS = 20;

  // Optimizar hojas: limitar guías por hoja
  const hojasOptimizadas = hojas.slice(0, MAX_HOJAS).map(hoja => ({
    ...hoja,
    // Guardar solo los datos esenciales de cada guía
    guias: hoja.guias.slice(0, MAX_GUIAS_POR_HOJA).map(g => ({
      id: g.id,
      guia: g.guia,
      trackingNumber: g.trackingNumber,
      status: g.status,
      carrier: g.carrier,
      destination: g.destination,
      daysInTransit: g.daysInTransit,
      hasIssue: g.hasIssue,
      phone: g.phone,
      // Omitir detailedInfo para reducir tamaño
    })),
    cantidadGuias: Math.min(hoja.guias.length, MAX_GUIAS_POR_HOJA),
  }));

  // Guardar en localStorage con manejo de errores
  try {
    const jsonData = JSON.stringify(hojasOptimizadas);

    // Verificar tamaño antes de guardar (~5MB límite)
    const sizeInMB = new Blob([jsonData]).size / (1024 * 1024);
    if (sizeInMB > 4.5) {
      console.warn(`Datos muy grandes (${sizeInMB.toFixed(2)}MB), reduciendo...`);
      // Guardar solo las últimas 10 hojas con menos guías
      const hojasReducidas = hojasOptimizadas.slice(0, 10).map(h => ({
        ...h,
        guias: h.guias.slice(0, 50),
      }));
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(hojasReducidas));
    } else {
      localStorage.setItem(LOCAL_STORAGE_KEY, jsonData);
    }
  } catch (error: any) {
    // Manejar error de quota exceeded
    if (error.name === 'QuotaExceededError' || error.code === 22) {
      console.error('localStorage lleno, limpiando datos antiguos...');
      // Limpiar hojas antiguas y reintentar
      const hojasMinimas = hojas.slice(0, 5).map(h => ({
        ...h,
        guias: h.guias.slice(0, 30),
      }));
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(hojasMinimas));
      } catch {
        // Última opción: guardar solo IDs
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([]));
        throw new Error('No hay espacio en localStorage. Se limpiaron los datos.');
      }
    } else {
      throw error;
    }
  }

  // Intentar guardar en cloud si está configurado
  if (USE_CLOUD_STORAGE) {
    const storage: GlobalStorage = {
      hojas: hojasOptimizadas,
      ultimaActualizacion: new Date(),
      version: '1.0.0',
    };

    try {
      await fetch(`${API_BASE_URL}/${BIN_ID}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': MASTER_KEY,
        },
        body: JSON.stringify(storage),
      });
    } catch (error) {
      console.log('Cloud sync falló, datos guardados localmente');
    }
  }
};

/**
 * Obtiene un ID único para el dispositivo actual
 */
const obtenerIdDispositivo = (): string => {
  let deviceId = localStorage.getItem('litper_device_id');
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('litper_device_id', deviceId);
  }
  return deviceId;
};

/**
 * Sincroniza hojas locales con el servidor
 */
export const sincronizarHojas = async (): Promise<{
  sincronizado: boolean;
  hojasLocales: number;
  hojasServidor: number;
}> => {
  const hojasLocales = obtenerHojasLocal();

  try {
    const hojasServidor = await obtenerTodasLasHojas();

    // Combinar hojas (las del servidor tienen prioridad por fecha)
    const todasLasHojas = [...hojasServidor];

    hojasLocales.forEach((local) => {
      const existeEnServidor = hojasServidor.find((s) => s.id === local.id);
      if (!existeEnServidor) {
        todasLasHojas.push(local);
      }
    });

    // Ordenar por fecha y guardar
    todasLasHojas.sort(
      (a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime()
    );

    await guardarHojasGlobal(todasLasHojas.slice(0, 50));

    return {
      sincronizado: true,
      hojasLocales: hojasLocales.length,
      hojasServidor: hojasServidor.length,
    };
  } catch (error) {
    return {
      sincronizado: false,
      hojasLocales: hojasLocales.length,
      hojasServidor: 0,
    };
  }
};

export default {
  obtenerTodasLasHojas,
  obtenerHojasLocal,
  guardarNuevaHoja,
  eliminarHoja,
  eliminarGuiaDeHoja,
  restaurarHoja,
  sincronizarHojas,
};
