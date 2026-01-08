// stores/rutasStore.ts
// Store para gestión de rutas de entrega

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================
// TIPOS
// ============================================

export interface Parada {
  id: string;
  guiaId: string;
  direccion: string;
  ciudad: string;
  cliente: string;
  telefono?: string;
  orden: number;
  estado: 'pendiente' | 'en_camino' | 'entregado' | 'fallido';
  horaEstimada?: string;
  horaReal?: string;
  notas?: string;
  coordenadas?: {
    lat: number;
    lng: number;
  };
}

export interface Ruta {
  id: string;
  nombre: string;
  fecha: string;
  conductor?: string;
  vehiculo?: string;
  zona: string;
  estado: 'planificada' | 'en_progreso' | 'completada' | 'cancelada';
  paradas: Parada[];
  distanciaTotal?: number; // km
  tiempoEstimado?: number; // minutos
  horaInicio?: string;
  horaFin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Conductor {
  id: string;
  nombre: string;
  telefono: string;
  vehiculo: string;
  placa: string;
  estado: 'disponible' | 'en_ruta' | 'descanso' | 'inactivo';
  rutaActual?: string;
}

export interface ZonaCobertura {
  id: string;
  nombre: string;
  ciudades: string[];
  color: string;
}

interface RutasState {
  rutas: Ruta[];
  conductores: Conductor[];
  zonas: ZonaCobertura[];
  rutaSeleccionada: Ruta | null;
  filtroEstado: 'todas' | 'planificada' | 'en_progreso' | 'completada';
  filtroFecha: string | null;

  // Actions
  agregarRuta: (ruta: Omit<Ruta, 'id' | 'createdAt' | 'updatedAt'>) => void;
  actualizarRuta: (id: string, datos: Partial<Ruta>) => void;
  eliminarRuta: (id: string) => void;
  seleccionarRuta: (ruta: Ruta | null) => void;

  agregarParada: (rutaId: string, parada: Omit<Parada, 'id' | 'orden'>) => void;
  actualizarParada: (rutaId: string, paradaId: string, datos: Partial<Parada>) => void;
  eliminarParada: (rutaId: string, paradaId: string) => void;
  reordenarParadas: (rutaId: string, paradasOrdenadas: string[]) => void;

  agregarConductor: (conductor: Omit<Conductor, 'id'>) => void;
  actualizarConductor: (id: string, datos: Partial<Conductor>) => void;

  setFiltroEstado: (estado: 'todas' | 'planificada' | 'en_progreso' | 'completada') => void;
  setFiltroFecha: (fecha: string | null) => void;

  // Getters
  getRutasFiltradas: () => Ruta[];
  getEstadisticas: () => {
    total: number;
    planificadas: number;
    enProgreso: number;
    completadas: number;
    paradasHoy: number;
    entregasHoy: number;
  };
}

// ============================================
// DATOS INICIALES DE EJEMPLO
// ============================================

const zonasIniciales: ZonaCobertura[] = [
  { id: 'z1', nombre: 'Zona Norte', ciudades: ['Bogota Norte', 'Usaquen', 'Suba'], color: 'from-blue-500 to-cyan-500' },
  { id: 'z2', nombre: 'Zona Sur', ciudades: ['Bogota Sur', 'Kennedy', 'Bosa'], color: 'from-green-500 to-emerald-500' },
  { id: 'z3', nombre: 'Zona Centro', ciudades: ['Centro', 'Chapinero', 'Teusaquillo'], color: 'from-amber-500 to-orange-500' },
  { id: 'z4', nombre: 'Zona Occidente', ciudades: ['Fontibon', 'Engativa', 'Puente Aranda'], color: 'from-purple-500 to-pink-500' },
];

const conductoresIniciales: Conductor[] = [
  { id: 'c1', nombre: 'Carlos Rodriguez', telefono: '3101234567', vehiculo: 'Moto', placa: 'ABC123', estado: 'disponible' },
  { id: 'c2', nombre: 'Maria Garcia', telefono: '3109876543', vehiculo: 'Furgon', placa: 'DEF456', estado: 'disponible' },
  { id: 'c3', nombre: 'Juan Martinez', telefono: '3115551234', vehiculo: 'Moto', placa: 'GHI789', estado: 'en_ruta' },
];

// ============================================
// STORE
// ============================================

export const useRutasStore = create<RutasState>()(
  persist(
    (set, get) => ({
      rutas: [],
      conductores: conductoresIniciales,
      zonas: zonasIniciales,
      rutaSeleccionada: null,
      filtroEstado: 'todas',
      filtroFecha: null,

      agregarRuta: (ruta) => {
        const nuevaRuta: Ruta = {
          ...ruta,
          id: `ruta_${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({ rutas: [...state.rutas, nuevaRuta] }));
      },

      actualizarRuta: (id, datos) => {
        set((state) => ({
          rutas: state.rutas.map((r) =>
            r.id === id ? { ...r, ...datos, updatedAt: new Date().toISOString() } : r
          ),
        }));
      },

      eliminarRuta: (id) => {
        set((state) => ({
          rutas: state.rutas.filter((r) => r.id !== id),
          rutaSeleccionada: state.rutaSeleccionada?.id === id ? null : state.rutaSeleccionada,
        }));
      },

      seleccionarRuta: (ruta) => {
        set({ rutaSeleccionada: ruta });
      },

      agregarParada: (rutaId, parada) => {
        set((state) => ({
          rutas: state.rutas.map((r) => {
            if (r.id === rutaId) {
              const nuevaParada: Parada = {
                ...parada,
                id: `parada_${Date.now()}`,
                orden: r.paradas.length + 1,
              };
              return { ...r, paradas: [...r.paradas, nuevaParada], updatedAt: new Date().toISOString() };
            }
            return r;
          }),
        }));
      },

      actualizarParada: (rutaId, paradaId, datos) => {
        set((state) => ({
          rutas: state.rutas.map((r) => {
            if (r.id === rutaId) {
              return {
                ...r,
                paradas: r.paradas.map((p) => (p.id === paradaId ? { ...p, ...datos } : p)),
                updatedAt: new Date().toISOString(),
              };
            }
            return r;
          }),
        }));
      },

      eliminarParada: (rutaId, paradaId) => {
        set((state) => ({
          rutas: state.rutas.map((r) => {
            if (r.id === rutaId) {
              const paradasFiltradas = r.paradas
                .filter((p) => p.id !== paradaId)
                .map((p, idx) => ({ ...p, orden: idx + 1 }));
              return { ...r, paradas: paradasFiltradas, updatedAt: new Date().toISOString() };
            }
            return r;
          }),
        }));
      },

      reordenarParadas: (rutaId, paradasOrdenadas) => {
        set((state) => ({
          rutas: state.rutas.map((r) => {
            if (r.id === rutaId) {
              const paradasReordenadas = paradasOrdenadas
                .map((id, idx) => {
                  const parada = r.paradas.find((p) => p.id === id);
                  return parada ? { ...parada, orden: idx + 1 } : null;
                })
                .filter(Boolean) as Parada[];
              return { ...r, paradas: paradasReordenadas, updatedAt: new Date().toISOString() };
            }
            return r;
          }),
        }));
      },

      agregarConductor: (conductor) => {
        const nuevoConductor: Conductor = {
          ...conductor,
          id: `conductor_${Date.now()}`,
        };
        set((state) => ({ conductores: [...state.conductores, nuevoConductor] }));
      },

      actualizarConductor: (id, datos) => {
        set((state) => ({
          conductores: state.conductores.map((c) => (c.id === id ? { ...c, ...datos } : c)),
        }));
      },

      setFiltroEstado: (estado) => set({ filtroEstado: estado }),
      setFiltroFecha: (fecha) => set({ filtroFecha: fecha }),

      getRutasFiltradas: () => {
        const { rutas, filtroEstado, filtroFecha } = get();
        return rutas.filter((r) => {
          if (filtroEstado !== 'todas' && r.estado !== filtroEstado) return false;
          if (filtroFecha && r.fecha !== filtroFecha) return false;
          return true;
        });
      },

      getEstadisticas: () => {
        const { rutas } = get();
        const hoy = new Date().toISOString().split('T')[0];
        const rutasHoy = rutas.filter((r) => r.fecha === hoy);

        return {
          total: rutas.length,
          planificadas: rutas.filter((r) => r.estado === 'planificada').length,
          enProgreso: rutas.filter((r) => r.estado === 'en_progreso').length,
          completadas: rutas.filter((r) => r.estado === 'completada').length,
          paradasHoy: rutasHoy.reduce((acc, r) => acc + r.paradas.length, 0),
          entregasHoy: rutasHoy.reduce(
            (acc, r) => acc + r.paradas.filter((p) => p.estado === 'entregado').length,
            0
          ),
        };
      },
    }),
    {
      name: 'litper-rutas-store',
      partialize: (state) => ({
        rutas: state.rutas,
        conductores: state.conductores,
        zonas: state.zonas,
      }),
    }
  )
);

export default useRutasStore;
