// ============================================
// SISTEMA DE GAMIFICACIÓN Y LOGROS
// ============================================

export type UserLevel = 'novato' | 'aprendiz' | 'profesional' | 'experto' | 'maestro' | 'leyenda';

export interface LevelConfig {
  level: UserLevel;
  name: string;
  minXP: number;
  maxXP: number;
  color: string;
  bgColor: string;
  icon: string;
  benefits: LevelBenefit[];
}

export interface LevelBenefit {
  type: 'discount' | 'feature' | 'support' | 'badge';
  name: string;
  description: string;
  value?: number; // Para descuentos: porcentaje
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  bgColor: string;
  category: 'shipping' | 'streak' | 'ml' | 'flash' | 'special' | 'community';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  requirement: BadgeRequirement;
  xpReward: number;
  unlockedAt?: string;
}

export interface BadgeRequirement {
  type:
    | 'shipments'
    | 'streak'
    | 'ml_usage'
    | 'flash_usage'
    | 'perfect_delivery'
    | 'savings'
    | 'rank'
    | 'special';
  count: number;
  timeframe?: 'day' | 'week' | 'month' | 'all_time';
  description: string;
}

export interface XPTransaction {
  id: string;
  amount: number;
  reason: string;
  category: 'shipment' | 'streak' | 'ml' | 'flash' | 'achievement' | 'challenge' | 'bonus';
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface UserStreak {
  current: number;
  longest: number;
  lastActiveDate: string;
  streakType: 'daily_shipment' | 'no_issues' | 'ml_usage';
}

export interface Challenge {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'daily' | 'weekly' | 'monthly' | 'special';
  startDate: string;
  endDate: string;
  requirement: {
    type: string;
    target: number;
    current: number;
  };
  rewards: {
    xp: number;
    badge?: string;
    prize?: {
      type: 'discount' | 'cash' | 'feature';
      value: number;
      description: string;
    };
  };
  participants?: number;
  completed: boolean;
  completedAt?: string;
}

export interface LeaderboardEntry {
  rank: number;
  previousRank?: number;
  userId: string;
  username: string;
  avatar?: string;
  country: string;
  xp: number;
  level: UserLevel;
  shipmentsThisMonth: number;
  badges: number;
  streak: number;
  isCurrentUser?: boolean;
}

export interface UserGamificationProfile {
  id: string;
  username: string;
  avatar?: string;
  country: string;

  // XP y Nivel
  totalXP: number;
  currentLevel: UserLevel;
  xpToNextLevel: number;
  levelProgress: number; // 0-100

  // Estadísticas
  stats: {
    totalShipments: number;
    perfectDeliveries: number;
    totalSavings: number;
    flashShipments: number;
    mlPredictions: number;
    avgDeliveryTime: number;
  };

  // Rachas
  streaks: {
    shipment: UserStreak;
    noIssues: UserStreak;
    mlUsage: UserStreak;
  };

  // Badges
  unlockedBadges: Badge[];
  lockedBadges: Badge[];
  recentBadge?: Badge;

  // Ranking
  ranking: {
    national: number;
    regional: number;
    weekly: number;
  };

  // Historial
  xpHistory: XPTransaction[];

  // Challenges activos
  activeChallenges: Challenge[];
  completedChallenges: Challenge[];

  // Beneficios activos
  activeBenefits: LevelBenefit[];

  // Timestamps
  memberSince: string;
  lastActive: string;
}

// ============================================
// CONFIGURACIÓN DE NIVELES
// ============================================

export const LEVEL_CONFIGS: LevelConfig[] = [
  {
    level: 'novato',
    name: 'Novato',
    minXP: 0,
    maxXP: 500,
    color: 'text-slate-500',
    bgColor: 'bg-slate-100',
    icon: '🌱',
    benefits: [
      {
        type: 'feature',
        name: 'Acceso Básico',
        description: 'Acceso a todas las funciones básicas',
      },
    ],
  },
  {
    level: 'aprendiz',
    name: 'Aprendiz',
    minXP: 500,
    maxXP: 1500,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
    icon: '📦',
    benefits: [
      {
        type: 'discount',
        name: '3% Descuento',
        description: '3% de descuento en envíos',
        value: 3,
      },
      {
        type: 'feature',
        name: 'Predicciones Básicas',
        description: 'Acceso a predicciones ML básicas',
      },
    ],
  },
  {
    level: 'profesional',
    name: 'Profesional',
    minXP: 1500,
    maxXP: 4000,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    icon: '🚀',
    benefits: [
      {
        type: 'discount',
        name: '5% Descuento',
        description: '5% de descuento permanente',
        value: 5,
      },
      { type: 'feature', name: 'Litper Flash', description: 'Acceso completo a perfiles Flash' },
      {
        type: 'support',
        name: 'Soporte Prioritario',
        description: 'Respuesta en menos de 4 horas',
      },
    ],
  },
  {
    level: 'experto',
    name: 'Experto',
    minXP: 4000,
    maxXP: 10000,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    icon: '⭐',
    benefits: [
      {
        type: 'discount',
        name: '8% Descuento',
        description: '8% de descuento permanente',
        value: 8,
      },
      {
        type: 'feature',
        name: 'Predicción Avanzada',
        description: 'Predicciones de demanda a 90 días',
      },
      { type: 'feature', name: 'API Access', description: 'Acceso a API para integraciones' },
      { type: 'support', name: 'Soporte VIP', description: 'Respuesta en menos de 1 hora' },
    ],
  },
  {
    level: 'maestro',
    name: 'Maestro',
    minXP: 10000,
    maxXP: 25000,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    icon: '👑',
    benefits: [
      {
        type: 'discount',
        name: '12% Descuento',
        description: '12% de descuento permanente',
        value: 12,
      },
      {
        type: 'feature',
        name: 'Beta Features',
        description: 'Acceso anticipado a nuevas funciones',
      },
      { type: 'feature', name: 'White Label', description: 'Personalización de marca' },
      { type: 'support', name: 'Account Manager', description: 'Gerente de cuenta dedicado' },
    ],
  },
  {
    level: 'leyenda',
    name: 'Leyenda',
    minXP: 25000,
    maxXP: Infinity,
    color: 'text-gold-500',
    bgColor: 'bg-gradient-to-r from-gold-100 to-orange-100',
    icon: '🏆',
    benefits: [
      {
        type: 'discount',
        name: '15% Descuento',
        description: '15% de descuento permanente',
        value: 15,
      },
      {
        type: 'feature',
        name: 'Todo Incluido',
        description: 'Acceso a todas las funciones premium',
      },
      { type: 'badge', name: 'Badge Exclusivo', description: 'Badge de Leyenda en perfil público' },
      { type: 'support', name: 'Soporte 24/7', description: 'Línea directa de soporte' },
    ],
  },
];

// ============================================
// BADGES DISPONIBLES
// ============================================

export const AVAILABLE_BADGES: Badge[] = [
  // Shipping Badges
  {
    id: 'first_shipment',
    name: 'Primer Envío',
    description: 'Completaste tu primer envío exitosamente',
    icon: '📬',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
    category: 'shipping',
    rarity: 'common',
    requirement: { type: 'shipments', count: 1, description: '1 envío completado' },
    xpReward: 50,
  },
  {
    id: 'ten_shipments',
    name: 'Emprendedor',
    description: 'Completaste 10 envíos',
    icon: '📦',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    category: 'shipping',
    rarity: 'common',
    requirement: { type: 'shipments', count: 10, description: '10 envíos completados' },
    xpReward: 100,
  },
  {
    id: 'hundred_shipments',
    name: 'Comerciante',
    description: 'Completaste 100 envíos',
    icon: '🏪',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    category: 'shipping',
    rarity: 'rare',
    requirement: { type: 'shipments', count: 100, description: '100 envíos completados' },
    xpReward: 500,
  },
  {
    id: 'thousand_shipments',
    name: 'Magnate Logístico',
    description: 'Completaste 1,000 envíos',
    icon: '🏭',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    category: 'shipping',
    rarity: 'epic',
    requirement: { type: 'shipments', count: 1000, description: '1,000 envíos completados' },
    xpReward: 2000,
  },

  // Streak Badges
  {
    id: 'streak_7',
    name: 'Constante',
    description: '7 días consecutivos con envíos',
    icon: '🔥',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    category: 'streak',
    rarity: 'common',
    requirement: { type: 'streak', count: 7, description: '7 días de racha' },
    xpReward: 100,
  },
  {
    id: 'streak_30',
    name: 'Imparable',
    description: '30 días consecutivos con envíos',
    icon: '💪',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    category: 'streak',
    rarity: 'rare',
    requirement: { type: 'streak', count: 30, description: '30 días de racha' },
    xpReward: 500,
  },
  {
    id: 'streak_90',
    name: 'Leyenda de la Constancia',
    description: '90 días consecutivos con envíos',
    icon: '🌟',
    color: 'text-gold-500',
    bgColor: 'bg-gold-100',
    category: 'streak',
    rarity: 'legendary',
    requirement: { type: 'streak', count: 90, description: '90 días de racha' },
    xpReward: 2000,
  },
  {
    id: 'no_issues_10',
    name: 'Sin Novedades',
    description: '10 días consecutivos sin novedades',
    icon: '✨',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
    category: 'streak',
    rarity: 'rare',
    requirement: {
      type: 'streak',
      count: 10,
      timeframe: 'day',
      description: '10 días sin novedades',
    },
    xpReward: 300,
  },

  // ML Badges
  {
    id: 'ml_first',
    name: 'Curioso de Datos',
    description: 'Usaste predicción ML por primera vez',
    icon: '🔮',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
    category: 'ml',
    rarity: 'common',
    requirement: { type: 'ml_usage', count: 1, description: 'Primera predicción ML' },
    xpReward: 50,
  },
  {
    id: 'ml_50',
    name: 'Analista de Datos',
    description: 'Usaste 50 predicciones ML',
    icon: '📊',
    color: 'text-violet-600',
    bgColor: 'bg-violet-100',
    category: 'ml',
    rarity: 'rare',
    requirement: { type: 'ml_usage', count: 50, description: '50 predicciones ML' },
    xpReward: 300,
  },
  {
    id: 'ml_master',
    name: 'ML Master',
    description: 'Usaste 200 predicciones ML',
    icon: '🧠',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    category: 'ml',
    rarity: 'epic',
    requirement: { type: 'ml_usage', count: 200, description: '200 predicciones ML' },
    xpReward: 1000,
  },

  // Flash Badges
  {
    id: 'flash_first',
    name: 'Rayo Inicial',
    description: 'Creaste tu primer perfil Flash',
    icon: '⚡',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    category: 'flash',
    rarity: 'common',
    requirement: { type: 'flash_usage', count: 1, description: 'Primer perfil Flash' },
    xpReward: 50,
  },
  {
    id: 'flash_speed',
    name: 'Velocista',
    description: '50 envíos con Litper Flash',
    icon: '🏎️',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    category: 'flash',
    rarity: 'rare',
    requirement: { type: 'flash_usage', count: 50, description: '50 envíos Flash' },
    xpReward: 400,
  },
  {
    id: 'flash_master',
    name: 'Flash Master',
    description: '500 envíos con Litper Flash',
    icon: '⚡👑',
    color: 'text-gold-500',
    bgColor: 'bg-gold-100',
    category: 'flash',
    rarity: 'legendary',
    requirement: { type: 'flash_usage', count: 500, description: '500 envíos Flash' },
    xpReward: 2500,
  },

  // Special Badges
  {
    id: 'perfect_week',
    name: 'Semana Perfecta',
    description: '100% entregas exitosas en una semana',
    icon: '💯',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
    category: 'special',
    rarity: 'rare',
    requirement: {
      type: 'perfect_delivery',
      count: 100,
      timeframe: 'week',
      description: '100% éxito semanal',
    },
    xpReward: 500,
  },
  {
    id: 'savings_100k',
    name: 'Ahorrador',
    description: 'Ahorraste $100,000 en envíos',
    icon: '💰',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
    category: 'special',
    rarity: 'rare',
    requirement: { type: 'savings', count: 100000, description: '$100K ahorrados' },
    xpReward: 400,
  },
  {
    id: 'savings_1m',
    name: 'Millonario del Ahorro',
    description: 'Ahorraste $1,000,000 en envíos',
    icon: '💎',
    color: 'text-gold-500',
    bgColor: 'bg-gold-100',
    category: 'special',
    rarity: 'legendary',
    requirement: { type: 'savings', count: 1000000, description: '$1M ahorrados' },
    xpReward: 3000,
  },

  // Community/Ranking Badges
  {
    id: 'top_100',
    name: 'Top 100 Nacional',
    description: 'Entraste al Top 100 del ranking nacional',
    icon: '🏅',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    category: 'community',
    rarity: 'rare',
    requirement: { type: 'rank', count: 100, description: 'Top 100 ranking' },
    xpReward: 500,
  },
  {
    id: 'top_10',
    name: 'Top 10 Nacional',
    description: 'Entraste al Top 10 del ranking nacional',
    icon: '🥇',
    color: 'text-gold-500',
    bgColor: 'bg-gold-100',
    category: 'community',
    rarity: 'epic',
    requirement: { type: 'rank', count: 10, description: 'Top 10 ranking' },
    xpReward: 1500,
  },
  {
    id: 'champion',
    name: 'Campeón Nacional',
    description: 'Alcanzaste el #1 del ranking nacional',
    icon: '🏆',
    color: 'text-gold-500',
    bgColor: 'bg-gradient-to-r from-gold-100 to-orange-100',
    category: 'community',
    rarity: 'legendary',
    requirement: { type: 'rank', count: 1, description: '#1 del ranking' },
    xpReward: 5000,
  },
];

// ============================================
// XP POR ACCIÓN
// ============================================

export const XP_REWARDS = {
  // Envíos
  shipment_created: 10,
  shipment_delivered: 20,
  shipment_perfect: 30, // Entregado sin novedades
  shipment_fast: 15, // Entregado antes de tiempo estimado

  // Rachas
  streak_maintained: 5, // Por cada día de racha
  streak_milestone_7: 50,
  streak_milestone_30: 200,
  streak_milestone_90: 500,

  // ML
  ml_prediction_used: 5,
  ml_prediction_accurate: 15, // Si la predicción fue correcta

  // Flash
  flash_profile_created: 25,
  flash_shipment: 15,

  // Desafíos
  challenge_daily_complete: 50,
  challenge_weekly_complete: 200,
  challenge_monthly_complete: 500,

  // Especiales
  first_shipment_day: 10,
  no_issues_day: 10,
  referral: 100,
};
