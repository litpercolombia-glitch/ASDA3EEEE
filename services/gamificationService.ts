// ============================================
// SERVICIO DE GAMIFICACIÓN
// ============================================

import { v4 as uuidv4 } from 'uuid';
import {
  UserLevel,
  LevelConfig,
  Badge,
  XPTransaction,
  UserStreak,
  Challenge,
  LeaderboardEntry,
  UserGamificationProfile,
  LEVEL_CONFIGS,
  AVAILABLE_BADGES,
  XP_REWARDS,
} from '../types/gamification';
import { Country } from '../types/country';

const PROFILE_KEY = 'litper_gamification_profile';
const LEADERBOARD_KEY = 'litper_leaderboard';

// ============================================
// PERFIL DE USUARIO
// ============================================

export const getUserProfile = (): UserGamificationProfile => {
  try {
    const data = localStorage.getItem(PROFILE_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return createNewProfile();
  } catch {
    return createNewProfile();
  }
};

export const saveUserProfile = (profile: UserGamificationProfile): void => {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.error('Error saving gamification profile:', e);
  }
};

const createNewProfile = (): UserGamificationProfile => {
  const profile: UserGamificationProfile = {
    id: uuidv4(),
    username: `Usuario_${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    country: 'COLOMBIA',
    totalXP: 0,
    currentLevel: 'novato',
    xpToNextLevel: 500,
    levelProgress: 0,
    stats: {
      totalShipments: 0,
      perfectDeliveries: 0,
      totalSavings: 0,
      flashShipments: 0,
      mlPredictions: 0,
      avgDeliveryTime: 0,
    },
    streaks: {
      shipment: { current: 0, longest: 0, lastActiveDate: '', streakType: 'daily_shipment' },
      noIssues: { current: 0, longest: 0, lastActiveDate: '', streakType: 'no_issues' },
      mlUsage: { current: 0, longest: 0, lastActiveDate: '', streakType: 'ml_usage' },
    },
    unlockedBadges: [],
    lockedBadges: [...AVAILABLE_BADGES],
    ranking: {
      national: 0,
      regional: 0,
      weekly: 0,
    },
    xpHistory: [],
    activeChallenges: generateInitialChallenges(),
    completedChallenges: [],
    activeBenefits: LEVEL_CONFIGS[0].benefits,
    memberSince: new Date().toISOString(),
    lastActive: new Date().toISOString(),
  };

  saveUserProfile(profile);
  return profile;
};

// ============================================
// GESTIÓN DE XP
// ============================================

export const addXP = (
  amount: number,
  reason: string,
  category: XPTransaction['category'],
  metadata?: Record<string, any>
): { newXP: number; leveledUp: boolean; newLevel?: UserLevel; newBadges: Badge[] } => {
  const profile = getUserProfile();

  const transaction: XPTransaction = {
    id: uuidv4(),
    amount,
    reason,
    category,
    timestamp: new Date().toISOString(),
    metadata,
  };

  profile.xpHistory.unshift(transaction);
  // Mantener solo últimas 100 transacciones
  profile.xpHistory = profile.xpHistory.slice(0, 100);

  const previousLevel = profile.currentLevel;
  profile.totalXP += amount;

  // Calcular nuevo nivel
  const newLevelConfig = calculateLevel(profile.totalXP);
  profile.currentLevel = newLevelConfig.level;
  profile.xpToNextLevel = newLevelConfig.maxXP - profile.totalXP;
  profile.levelProgress = calculateLevelProgress(profile.totalXP, newLevelConfig);
  profile.activeBenefits = newLevelConfig.benefits;

  const leveledUp = previousLevel !== profile.currentLevel;

  // Verificar badges
  const newBadges = checkForNewBadges(profile);

  profile.lastActive = new Date().toISOString();
  saveUserProfile(profile);

  return {
    newXP: profile.totalXP,
    leveledUp,
    newLevel: leveledUp ? profile.currentLevel : undefined,
    newBadges,
  };
};

const calculateLevel = (xp: number): LevelConfig => {
  for (let i = LEVEL_CONFIGS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_CONFIGS[i].minXP) {
      return LEVEL_CONFIGS[i];
    }
  }
  return LEVEL_CONFIGS[0];
};

const calculateLevelProgress = (xp: number, levelConfig: LevelConfig): number => {
  const xpInLevel = xp - levelConfig.minXP;
  const levelRange = levelConfig.maxXP - levelConfig.minXP;
  if (levelRange === Infinity) return 100;
  return Math.min(100, Math.round((xpInLevel / levelRange) * 100));
};

// ============================================
// GESTIÓN DE BADGES
// ============================================

const checkForNewBadges = (profile: UserGamificationProfile): Badge[] => {
  const newBadges: Badge[] = [];

  profile.lockedBadges.forEach((badge) => {
    if (shouldUnlockBadge(badge, profile)) {
      // Desbloquear badge
      badge.unlockedAt = new Date().toISOString();
      profile.unlockedBadges.push(badge);
      profile.recentBadge = badge;
      newBadges.push(badge);

      // Añadir XP del badge
      profile.totalXP += badge.xpReward;
    }
  });

  // Remover badges desbloqueados de la lista de bloqueados
  profile.lockedBadges = profile.lockedBadges.filter(
    (b) => !newBadges.some((nb) => nb.id === b.id)
  );

  return newBadges;
};

const shouldUnlockBadge = (badge: Badge, profile: UserGamificationProfile): boolean => {
  const req = badge.requirement;

  switch (req.type) {
    case 'shipments':
      return profile.stats.totalShipments >= req.count;

    case 'streak':
      const streaks = [
        profile.streaks.shipment.current,
        profile.streaks.noIssues.current,
        profile.streaks.mlUsage.current,
      ];
      return Math.max(...streaks) >= req.count;

    case 'ml_usage':
      return profile.stats.mlPredictions >= req.count;

    case 'flash_usage':
      return profile.stats.flashShipments >= req.count;

    case 'perfect_delivery':
      return profile.stats.perfectDeliveries >= req.count;

    case 'savings':
      return profile.stats.totalSavings >= req.count;

    case 'rank':
      return profile.ranking.national > 0 && profile.ranking.national <= req.count;

    default:
      return false;
  }
};

export const getBadgesByCategory = (
  category: Badge['category']
): { unlocked: Badge[]; locked: Badge[] } => {
  const profile = getUserProfile();
  return {
    unlocked: profile.unlockedBadges.filter((b) => b.category === category),
    locked: profile.lockedBadges.filter((b) => b.category === category),
  };
};

export const getBadgeProgress = (badge: Badge): number => {
  const profile = getUserProfile();
  const req = badge.requirement;

  let current = 0;
  switch (req.type) {
    case 'shipments':
      current = profile.stats.totalShipments;
      break;
    case 'streak':
      current = Math.max(
        profile.streaks.shipment.current,
        profile.streaks.noIssues.current,
        profile.streaks.mlUsage.current
      );
      break;
    case 'ml_usage':
      current = profile.stats.mlPredictions;
      break;
    case 'flash_usage':
      current = profile.stats.flashShipments;
      break;
    case 'perfect_delivery':
      current = profile.stats.perfectDeliveries;
      break;
    case 'savings':
      current = profile.stats.totalSavings;
      break;
    case 'rank':
      current = profile.ranking.national > 0 ? req.count - profile.ranking.national + 1 : 0;
      break;
  }

  return Math.min(100, Math.round((current / req.count) * 100));
};

// ============================================
// GESTIÓN DE RACHAS
// ============================================

export const updateStreak = (
  streakType: 'shipment' | 'noIssues' | 'mlUsage'
): { streakUpdated: boolean; newStreak: number; xpEarned: number } => {
  const profile = getUserProfile();
  const today = new Date().toISOString().split('T')[0];

  const streakKey = streakType === 'shipment' ? 'shipment' : streakType === 'noIssues' ? 'noIssues' : 'mlUsage';
  const streak = profile.streaks[streakKey];

  let xpEarned = 0;

  if (streak.lastActiveDate === today) {
    // Ya se actualizó hoy
    return { streakUpdated: false, newStreak: streak.current, xpEarned: 0 };
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  if (streak.lastActiveDate === yesterdayStr) {
    // Continúa la racha
    streak.current += 1;
    xpEarned = XP_REWARDS.streak_maintained;

    // Milestones
    if (streak.current === 7) xpEarned += XP_REWARDS.streak_milestone_7;
    if (streak.current === 30) xpEarned += XP_REWARDS.streak_milestone_30;
    if (streak.current === 90) xpEarned += XP_REWARDS.streak_milestone_90;
  } else {
    // Se rompe la racha, empieza de nuevo
    streak.current = 1;
    xpEarned = XP_REWARDS.first_shipment_day;
  }

  // Actualizar récord
  if (streak.current > streak.longest) {
    streak.longest = streak.current;
  }

  streak.lastActiveDate = today;
  profile.lastActive = new Date().toISOString();

  // Añadir XP
  if (xpEarned > 0) {
    addXP(xpEarned, `Racha de ${streak.current} días`, 'streak');
  }

  saveUserProfile(profile);

  return {
    streakUpdated: true,
    newStreak: streak.current,
    xpEarned,
  };
};

// ============================================
// GESTIÓN DE DESAFÍOS
// ============================================

const generateInitialChallenges = (): Challenge[] => {
  const now = new Date();
  const endOfWeek = new Date(now);
  endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()));
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return [
    {
      id: uuidv4(),
      name: 'Envío del Día',
      description: 'Completa al menos 1 envío hoy',
      icon: '📦',
      type: 'daily',
      startDate: now.toISOString(),
      endDate: new Date(now.setHours(23, 59, 59, 999)).toISOString(),
      requirement: { type: 'daily_shipment', target: 1, current: 0 },
      rewards: { xp: 50 },
      completed: false,
    },
    {
      id: uuidv4(),
      name: 'Semana Productiva',
      description: 'Completa 20 envíos esta semana',
      icon: '🚀',
      type: 'weekly',
      startDate: now.toISOString(),
      endDate: endOfWeek.toISOString(),
      requirement: { type: 'weekly_shipments', target: 20, current: 0 },
      rewards: { xp: 200 },
      completed: false,
    },
    {
      id: uuidv4(),
      name: 'Flash Master',
      description: 'Usa Litper Flash 10 veces esta semana',
      icon: '⚡',
      type: 'weekly',
      startDate: now.toISOString(),
      endDate: endOfWeek.toISOString(),
      requirement: { type: 'flash_usage', target: 10, current: 0 },
      rewards: { xp: 150, badge: 'flash_speed' },
      completed: false,
    },
    {
      id: uuidv4(),
      name: 'Analista del Mes',
      description: 'Usa predicciones ML 50 veces este mes',
      icon: '🔮',
      type: 'monthly',
      startDate: now.toISOString(),
      endDate: endOfMonth.toISOString(),
      requirement: { type: 'ml_usage', target: 50, current: 0 },
      rewards: {
        xp: 500,
        prize: { type: 'discount', value: 5, description: '5% descuento adicional por 1 semana' },
      },
      completed: false,
    },
  ];
};

export const updateChallengeProgress = (
  challengeType: string,
  incrementBy: number = 1
): { completed: Challenge[]; xpEarned: number } => {
  const profile = getUserProfile();
  const completedChallenges: Challenge[] = [];
  let totalXP = 0;

  profile.activeChallenges.forEach((challenge) => {
    if (challenge.requirement.type === challengeType && !challenge.completed) {
      challenge.requirement.current += incrementBy;

      if (challenge.requirement.current >= challenge.requirement.target) {
        challenge.completed = true;
        challenge.completedAt = new Date().toISOString();
        totalXP += challenge.rewards.xp;
        completedChallenges.push(challenge);
      }
    }
  });

  if (totalXP > 0) {
    addXP(totalXP, `Desafíos completados: ${completedChallenges.map((c) => c.name).join(', ')}`, 'challenge');
  }

  // Mover completados
  profile.activeChallenges = profile.activeChallenges.filter((c) => !c.completed);
  profile.completedChallenges = [...completedChallenges, ...profile.completedChallenges].slice(0, 50);

  saveUserProfile(profile);

  return { completed: completedChallenges, xpEarned: totalXP };
};

export const refreshChallenges = (): void => {
  const profile = getUserProfile();
  const now = new Date();

  // Remover desafíos expirados
  profile.activeChallenges = profile.activeChallenges.filter((c) => new Date(c.endDate) > now);

  // Generar nuevos desafíos si faltan
  if (profile.activeChallenges.length < 4) {
    const newChallenges = generateInitialChallenges();
    profile.activeChallenges = [
      ...profile.activeChallenges,
      ...newChallenges.slice(0, 4 - profile.activeChallenges.length),
    ];
  }

  saveUserProfile(profile);
};

// ============================================
// LEADERBOARD
// ============================================

export const getLeaderboard = (type: 'national' | 'weekly' = 'national'): LeaderboardEntry[] => {
  try {
    const data = localStorage.getItem(`${LEADERBOARD_KEY}_${type}`);
    if (data) {
      return JSON.parse(data);
    }
    return generateDemoLeaderboard();
  } catch {
    return generateDemoLeaderboard();
  }
};

const generateDemoLeaderboard = (): LeaderboardEntry[] => {
  const names = [
    'LogiMaster_CO', 'EnviosPro', 'FlashKing', 'CargoExpert', 'RapidoYa',
    'PackPro', 'EnviaMax', 'LogiStar', 'CargoLider', 'Express360',
    'ShipMaster', 'EnvioTop', 'LogiChamp', 'PackExpress', 'CargoVIP'
  ];

  const profile = getUserProfile();

  const entries: LeaderboardEntry[] = names.map((name, index) => ({
    rank: index + 1,
    userId: uuidv4(),
    username: name,
    country: 'COLOMBIA',
    xp: 25000 - index * 1500 + Math.floor(Math.random() * 500),
    level: index < 2 ? 'leyenda' : index < 5 ? 'maestro' : index < 8 ? 'experto' : 'profesional',
    shipmentsThisMonth: 200 - index * 10 + Math.floor(Math.random() * 20),
    badges: 15 - index,
    streak: 30 - index * 2,
  }));

  // Insertar usuario actual en posición aleatoria si tiene XP
  if (profile.totalXP > 0) {
    const userRank = Math.min(15, Math.max(1, Math.floor(15 - (profile.totalXP / 2000))));
    entries.splice(userRank - 1, 0, {
      rank: userRank,
      userId: profile.id,
      username: profile.username,
      country: profile.country,
      xp: profile.totalXP,
      level: profile.currentLevel,
      shipmentsThisMonth: profile.stats.totalShipments,
      badges: profile.unlockedBadges.length,
      streak: profile.streaks.shipment.current,
      isCurrentUser: true,
    });

    // Reajustar ranks
    entries.forEach((e, i) => {
      e.rank = i + 1;
    });
  }

  return entries.slice(0, 15);
};

export const updateUserRanking = (): void => {
  const profile = getUserProfile();
  const leaderboard = getLeaderboard('national');

  const userEntry = leaderboard.find((e) => e.isCurrentUser);
  if (userEntry) {
    profile.ranking.national = userEntry.rank;
    profile.ranking.weekly = Math.min(userEntry.rank + 2, 20);
  }

  saveUserProfile(profile);
};

// ============================================
// ACCIONES DE GAMIFICACIÓN
// ============================================

export const recordShipment = (
  isPerfect: boolean = true,
  isFast: boolean = false
): { xpEarned: number; newBadges: Badge[] } => {
  const profile = getUserProfile();
  profile.stats.totalShipments += 1;
  if (isPerfect) profile.stats.perfectDeliveries += 1;
  saveUserProfile(profile);

  let totalXP = XP_REWARDS.shipment_created;
  if (isPerfect) totalXP += XP_REWARDS.shipment_perfect;
  if (isFast) totalXP += XP_REWARDS.shipment_fast;

  const result = addXP(totalXP, 'Envío completado', 'shipment');

  // Actualizar racha
  updateStreak('shipment');
  if (isPerfect) updateStreak('noIssues');

  // Actualizar desafíos
  updateChallengeProgress('daily_shipment');
  updateChallengeProgress('weekly_shipments');

  return { xpEarned: totalXP, newBadges: result.newBadges };
};

export const recordFlashShipment = (): { xpEarned: number; newBadges: Badge[] } => {
  const profile = getUserProfile();
  profile.stats.flashShipments += 1;
  saveUserProfile(profile);

  const result = addXP(XP_REWARDS.flash_shipment, 'Envío Flash', 'flash');
  updateChallengeProgress('flash_usage');

  return { xpEarned: XP_REWARDS.flash_shipment, newBadges: result.newBadges };
};

export const recordMLUsage = (wasAccurate: boolean = true): { xpEarned: number; newBadges: Badge[] } => {
  const profile = getUserProfile();
  profile.stats.mlPredictions += 1;
  saveUserProfile(profile);

  let xp = XP_REWARDS.ml_prediction_used;
  if (wasAccurate) xp += XP_REWARDS.ml_prediction_accurate;

  const result = addXP(xp, 'Predicción ML utilizada', 'ml');
  updateStreak('mlUsage');
  updateChallengeProgress('ml_usage');

  return { xpEarned: xp, newBadges: result.newBadges };
};

export const recordSavings = (amount: number): void => {
  const profile = getUserProfile();
  profile.stats.totalSavings += amount;
  saveUserProfile(profile);
  checkForNewBadges(profile);
};

// ============================================
// UTILIDADES
// ============================================

export const getLevelConfig = (level: UserLevel): LevelConfig => {
  return LEVEL_CONFIGS.find((l) => l.level === level) || LEVEL_CONFIGS[0];
};

export const formatXP = (xp: number): string => {
  if (xp >= 1000) {
    return `${(xp / 1000).toFixed(1)}K`;
  }
  return xp.toString();
};

export const getNextLevelConfig = (currentLevel: UserLevel): LevelConfig | null => {
  const currentIndex = LEVEL_CONFIGS.findIndex((l) => l.level === currentLevel);
  if (currentIndex < LEVEL_CONFIGS.length - 1) {
    return LEVEL_CONFIGS[currentIndex + 1];
  }
  return null;
};

export const updateUsername = (newUsername: string): void => {
  const profile = getUserProfile();
  profile.username = newUsername;
  saveUserProfile(profile);
};

export const updateUserCountry = (country: Country): void => {
  const profile = getUserProfile();
  profile.country = country;
  saveUserProfile(profile);
};
