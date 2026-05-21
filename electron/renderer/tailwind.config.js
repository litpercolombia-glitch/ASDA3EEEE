/** Tailwind config alineado con BRAND_KIT.md (litper navy/gold/red). */
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'litper-navy': {
          700: '#1F2A5C',
          800: '#141B3D',
          900: '#0D1430',
          950: '#0A0E27',
        },
        'litper-gold': {
          400: '#F4C842',
          500: '#D4AF37',
          600: '#B8941E',
        },
        'litper-red': {
          500: '#C0392B',
          600: '#A02622',
        },
        'litper-cream': {
          DEFAULT: '#F5F2E8',
          muted: '#A8A48F',
          disabled: '#5C5642',
        },
        'semaforo': {
          verde: '#10B981',
          amarillo: '#F59E0B',
          rojo: '#C0392B',
        },
      },
      fontFamily: {
        brand: ['Cinzel', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'halo': '0 16px 40px -8px rgba(10, 14, 39, 0.8), 0 0 0 1px rgba(212, 175, 55, 0.15)',
        'panel': '0 4px 16px -4px rgba(10, 14, 39, 0.6)',
        'gold-glow': '0 0 24px -2px rgba(212, 175, 55, 0.4)',
      },
      borderRadius: {
        'panel': '12px',
      },
    },
  },
  plugins: [],
};
