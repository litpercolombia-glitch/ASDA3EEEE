// =====================================================
// SERVICIO DE PERSISTENCIA GLOBAL
// Guarda datos para TODOS los usuarios/dispositivos
// =====================================================

import { Shipment } from '../types';

const API_BASE_URL = 'https://api.jsonbin.io/v3/b';
const MASTER_KEY = '$2a$10$YOUR_MASTER_KEY'; // Reemplazar con clave real en producción
const BIN_ID = 'litper-global-storage'; // ID del bin para almacenamiento

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
  try {
    // Intentar obtener del servidor primero
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
    console.log('Usando almacenamiento local (modo offline)');
  }

  // Fallback a localStorage
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
 */
export const guardarNuevaHoja = async (
  guias: Shipment[],
  nombreHoja?: string
): Promise<HojaCarga> => {
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
    cantidadGuias: guias.length,
    guias: guias,
    creadoPor: obtenerIdDispositivo(),
    activo: true,
  };

  const nuevasHojas = [nuevaHoja, ...hojas].slice(0, 50); // Máximo 50 hojas

  await guardarHojasGlobal(nuevasHojas);

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
 */
const guardarHojasGlobal = async (hojas: HojaCarga[]): Promise<void> => {
  const storage: GlobalStorage = {
    hojas,
    ultimaActualizacion: new Date(),
    version: '1.0.0',
  };

  // Guardar en localStorage siempre
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(hojas));

  try {
    // Intentar guardar en el servidor
    await fetch(`${API_BASE_URL}/${BIN_ID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': MASTER_KEY,
      },
      body: JSON.stringify(storage),
    });
  } catch (error) {
    console.log('Guardado en modo offline');
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
