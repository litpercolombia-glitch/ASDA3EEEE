/**
 * Design tokens del brand kit LITPER (espejo de BRAND_KIT.md y tailwind.config.js).
 * Usar estos en TS donde sea más conveniente que clases Tailwind
 * (estados dinámicos, charts, canvas, etc.).
 */

export const colors = {
  navy: {
    700: '#1F2A5C',
    800: '#141B3D',
    900: '#0D1430',
    950: '#0A0E27',
  },
  gold: {
    400: '#F4C842',
    500: '#D4AF37',
    600: '#B8941E',
  },
  red: {
    500: '#C0392B',
    600: '#A02622',
  },
  cream: '#F5F2E8',
  creamMuted: '#A8A48F',
  semaforo: {
    verde: '#10B981',
    amarillo: '#F59E0B',
    rojo: '#C0392B',
  },
} as const;

/** Paleta extendida para asignar a operadores nuevos sin repetir. */
export const TEAM_COLOR_PALETTE = [
  '#38BDF8', // sky      Jefer
  '#EC4899', // magenta  Catalina
  '#06B6D4', // cyan     Jimmy
  '#10B981', // emerald  Felipe
  '#A855F7', // purple   Angie
  '#F87171', // coral    Karen
  '#F59E0B', // amber    Erika
  '#22D3EE', // teal
  '#FB923C', // orange
  '#34D399', // green
  '#818CF8', // indigo
  '#F472B6', // pink
  '#A3E635', // lime
  '#FBBF24', // yellow
  '#60A5FA', // blue
  '#C084FC', // violet
] as const;

export const TAGLINE = 'Calidad en cada detalle';
export const APP_NAME = 'LITPER DESK';
