/**
 * Theme - Sistema de diseño profesional para AdminV2
 * Paleta azul/púrpura inspirada en Claude.ai
 */

// ============================================
// COLORES
// ============================================

export const colors = {
  // Backgrounds - Dark theme profesional
  bg: {
    primary: '#0A0A0F',      // Fondo principal más oscuro
    secondary: '#12121A',    // Fondo secundario
    tertiary: '#1A1A24',     // Fondo terciario (cards)
    elevated: '#22222E',     // Elementos elevados
    hover: '#2A2A38',        // Hover states
    active: '#32324A',       // Active states
  },

  // Text
  text: {
    primary: '#FAFAFA',      // Texto principal - casi blanco
    secondary: '#A1A1B5',    // Texto secundario
    tertiary: '#6B6B80',     // Texto terciario
    muted: '#52526A',        // Texto muy suave
    inverse: '#0A0A0F',      // Texto sobre fondos claros
  },

  // Brand - Azul/Púrpura profesional
  brand: {
    primary: '#6366F1',      // Indigo principal
    primaryHover: '#5558E3', // Hover
    primaryActive: '#4F52D5',// Active
    secondary: '#8B5CF6',    // Púrpura para IA/skills
    secondaryHover: '#7C4FE0',
    accent: '#06B6D4',       // Cyan para acciones secundarias
    gradient: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
  },

  // Semantic
  success: {
    default: '#10B981',
    light: '#10B98120',
    dark: '#059669',
  },
  warning: {
    default: '#F59E0B',
    light: '#F59E0B20',
    dark: '#D97706',
  },
  error: {
    default: '#EF4444',
    light: '#EF444420',
    dark: '#DC2626',
  },
  info: {
    default: '#3B82F6',
    light: '#3B82F620',
    dark: '#2563EB',
  },

  // Borders
  border: {
    default: '#2A2A3A',
    light: '#1F1F2E',
    hover: '#3A3A4A',
    focus: '#6366F1',
  },

  // Skill categories
  skills: {
    logistics: {
      bg: '#1E3A8A20',
      border: '#1E3A8A40',
      text: '#60A5FA',
      icon: '#3B82F6',
    },
    finance: {
      bg: '#16653420',
      border: '#16653440',
      text: '#4ADE80',
      icon: '#10B981',
    },
    analytics: {
      bg: '#7C2D1220',
      border: '#7C2D1240',
      text: '#FB923C',
      icon: '#F97316',
    },
    automation: {
      bg: '#581C8720',
      border: '#581C8740',
      text: '#C084FC',
      icon: '#8B5CF6',
    },
    communication: {
      bg: '#83184320',
      border: '#83184340',
      text: '#F472B6',
      icon: '#EC4899',
    },
  },
};

// ============================================
// ESPACIADO
// ============================================

export const spacing = {
  0: '0',
  px: '1px',
  0.5: '0.125rem',  // 2px
  1: '0.25rem',     // 4px
  1.5: '0.375rem',  // 6px
  2: '0.5rem',      // 8px
  2.5: '0.625rem',  // 10px
  3: '0.75rem',     // 12px
  3.5: '0.875rem',  // 14px
  4: '1rem',        // 16px
  5: '1.25rem',     // 20px
  6: '1.5rem',      // 24px
  7: '1.75rem',     // 28px
  8: '2rem',        // 32px
  9: '2.25rem',     // 36px
  10: '2.5rem',     // 40px
  12: '3rem',       // 48px
  14: '3.5rem',     // 56px
  16: '4rem',       // 64px
  20: '5rem',       // 80px
  24: '6rem',       // 96px
};

// ============================================
// TIPOGRAFÍA
// ============================================

export const typography = {
  fontFamily: {
    sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
  },
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],       // 12px
    sm: ['0.875rem', { lineHeight: '1.25rem' }],   // 14px
    base: ['1rem', { lineHeight: '1.5rem' }],      // 16px
    lg: ['1.125rem', { lineHeight: '1.75rem' }],   // 18px
    xl: ['1.25rem', { lineHeight: '1.75rem' }],    // 20px
    '2xl': ['1.5rem', { lineHeight: '2rem' }],     // 24px
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }],// 30px
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],  // 36px
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  letterSpacing: {
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
  },
};

// ============================================
// SOMBRAS
// ============================================

export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.4)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.3)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -4px rgba(0, 0, 0, 0.4)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.4)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.3)',
  glow: '0 0 20px rgba(99, 102, 241, 0.3)',
  glowPurple: '0 0 20px rgba(139, 92, 246, 0.3)',
  glowSuccess: '0 0 20px rgba(16, 185, 129, 0.3)',
  glowError: '0 0 20px rgba(239, 68, 68, 0.3)',
};

// ============================================
// BORDER RADIUS
// ============================================

export const radius = {
  none: '0',
  sm: '0.25rem',    // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  '3xl': '1.5rem',  // 24px
  full: '9999px',
};

// ============================================
// TRANSICIONES
// ============================================

export const transitions = {
  fast: '100ms cubic-bezier(0.4, 0, 0.2, 1)',
  normal: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
  slower: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  spring: '300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
};

// ============================================
// BREAKPOINTS
// ============================================

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

// ============================================
// Z-INDEX
// ============================================

export const zIndex = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  modalBackdrop: 40,
  modal: 50,
  popover: 60,
  tooltip: 70,
  toast: 80,
  commandPalette: 100,
};

// ============================================
// ANIMACIONES (para Framer Motion)
// ============================================

export const animations = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slideUp: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  },
  slideDown: {
    initial: { opacity: 0, y: -10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 10 },
  },
  slideLeft: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  },
  slideRight: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  },
  scale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  },
  stagger: {
    animate: {
      transition: {
        staggerChildren: 0.05,
      },
    },
  },
  springBounce: {
    type: 'spring',
    stiffness: 400,
    damping: 25,
  },
};

// ============================================
// THEME OBJECT COMPLETO
// ============================================

export const theme = {
  colors,
  spacing,
  typography,
  shadows,
  radius,
  transitions,
  breakpoints,
  zIndex,
  animations,
};

export default theme;
