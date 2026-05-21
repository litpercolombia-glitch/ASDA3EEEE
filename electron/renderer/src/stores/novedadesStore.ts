/**
 * novedadesStore — historial detallado de novedades del día con sub-tipos.
 * En Sprint 1 sincroniza con Supabase tabla `desk_novedades`.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TipoNovedad =
  | 'no_contesta'
  | 'cliente_ausente'
  | 'direccion_errada'
  | 'reentregar'
  | 'rechazo'
  | 'cambio_direccion'
  | 'cambio_fecha'
  | 'cancela'
  | 'reentrega'
  | 'otro';

export interface NovedadCatalogo {
  tipo: TipoNovedad;
  label: string;
  emoji: string;
  color: string;
}

export const NOVEDAD_CATALOGO: NovedadCatalogo[] = [
  { tipo: 'no_contesta',      label: 'Cliente no contesta',  emoji: '📵', color: '#94A3B8' },
  { tipo: 'cliente_ausente',  label: 'Cliente ausente',      emoji: '🚪', color: '#F59E0B' },
  { tipo: 'direccion_errada', label: 'Dirección errada',     emoji: '📍', color: '#EF4444' },
  { tipo: 'reentregar',       label: 'Reentregar mañana',    emoji: '📅', color: '#06B6D4' },
  { tipo: 'rechazo',          label: 'Rechazo',              emoji: '❌', color: '#C0392B' },
  { tipo: 'cambio_direccion', label: 'Cambio de dirección',  emoji: '🏠', color: '#A855F7' },
  { tipo: 'cambio_fecha',     label: 'Cambio de fecha',      emoji: '⏰', color: '#3B82F6' },
  { tipo: 'cancela',          label: 'Cliente cancela',      emoji: '🚫', color: '#DC2626' },
  { tipo: 'reentrega',        label: 'Reentrega',            emoji: '📦', color: '#10B981' },
  { tipo: 'otro',             label: 'Otro',                 emoji: '❓', color: '#A8A48F' },
];

export interface NovedadEntry {
  id: string;
  fecha: string;
  operadorId: string;
  rondaNumero: number;
  tipo: TipoNovedad;
  pedidoRef?: string;
  nota?: string;
  createdAt: string;
}

interface NovedadesState {
  novedades: NovedadEntry[];
  addNovedad: (input: Omit<NovedadEntry, 'id' | 'createdAt'>) => NovedadEntry;
  removeNovedad: (id: string) => void;
  clearNovedadesDelDia: (fecha: string) => void;
  countByTipo: (fecha: string) => Record<TipoNovedad, number>;
  novedadesDelDia: (fecha: string) => NovedadEntry[];
}

function genId(): string {
  return `nov-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const useNovedadesStore = create<NovedadesState>()(
  persist(
    (set, get) => ({
      novedades: [],

      addNovedad: (input) => {
        const entry: NovedadEntry = {
          ...input,
          id: genId(),
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ novedades: [...s.novedades, entry] }));
        return entry;
      },

      removeNovedad: (id) => {
        set((s) => ({ novedades: s.novedades.filter((n) => n.id !== id) }));
      },

      clearNovedadesDelDia: (fecha) => {
        set((s) => ({ novedades: s.novedades.filter((n) => n.fecha !== fecha) }));
      },

      countByTipo: (fecha) => {
        const counts = NOVEDAD_CATALOGO.reduce(
          (acc, c) => ({ ...acc, [c.tipo]: 0 }),
          {} as Record<TipoNovedad, number>,
        );
        for (const n of get().novedades) {
          if (n.fecha === fecha) counts[n.tipo]++;
        }
        return counts;
      },

      novedadesDelDia: (fecha) => {
        return get().novedades.filter((n) => n.fecha === fecha);
      },
    }),
    { name: 'litper-desk:novedades', version: 1 },
  ),
);
