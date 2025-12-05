import React, { useState, useEffect } from 'react';
import {
  UserGamificationProfile,
  Badge,
  Challenge,
  LeaderboardEntry,
  LevelConfig,
  LEVEL_CONFIGS,
} from '../../types/gamification';
import {
  getUserProfile,
  getLeaderboard,
  getLevelConfig,
  formatXP,
  getNextLevelConfig,
  getBadgeProgress,
  refreshChallenges,
  updateUsername,
} from '../../services/gamificationService';
import {
  Trophy,
  Star,
  Zap,
  Target,
  Medal,
  Crown,
  Flame,
  TrendingUp,
  Award,
  Gift,
  Users,
  ChevronRight,
  Lock,
  Check,
  Edit,
  X,
  Sparkles,
  Clock,
  Package,
  BarChart3,
} from 'lucide-react';

const GamificationTab: React.FC = () => {
  const [profile, setProfile] = useState<UserGamificationProfile | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [activeSection, setActiveSection] = useState<'overview' | 'badges' | 'challenges' | 'leaderboard'>('overview');
  const [editingUsername, setEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState('');

  useEffect(() => {
    loadData();
    refreshChallenges();
  }, []);

  const loadData = () => {
    const userProfile = getUserProfile();
    setProfile(userProfile);
    setLeaderboard(getLeaderboard('national'));
    setNewUsername(userProfile.username);
  };

  const handleUpdateUsername = () => {
    if (newUsername.trim()) {
      updateUsername(newUsername.trim());
      setEditingUsername(false);
      loadData();
    }
  };

  if (!profile) return null;

  const currentLevelConfig = getLevelConfig(profile.currentLevel);
  const nextLevelConfig = getNextLevelConfig(profile.currentLevel);

  const categoryIcons: Record<string, React.ReactNode> = {
    shipping: <Package className="w-4 h-4" />,
    streak: <Flame className="w-4 h-4" />,
    ml: <BarChart3 className="w-4 h-4" />,
    flash: <Zap className="w-4 h-4" />,
    special: <Star className="w-4 h-4" />,
    community: <Users className="w-4 h-4" />,
  };

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl transform translate-x-32 -translate-y-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-yellow-400 rounded-full blur-3xl transform -translate-x-24 translate-y-24" />
        </div>

        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            {/* Avatar & Level */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center text-4xl">
                  {currentLevelConfig.icon}
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gold-500 rounded-full flex items-center justify-center text-navy-900 font-bold text-sm border-2 border-white">
                  {profile.ranking.national || '?'}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  {editingUsername ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        className="bg-white/20 rounded-lg px-3 py-1 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                        placeholder="Tu nombre"
                      />
                      <button
                        onClick={handleUpdateUsername}
                        className="p-1 hover:bg-white/20 rounded"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setEditingUsername(false)}
                        className="p-1 hover:bg-white/20 rounded"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <h2 className="text-2xl font-bold">{profile.username}</h2>
                      <button
                        onClick={() => setEditingUsername(true)}
                        className="p-1 hover:bg-white/20 rounded"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-bold ${currentLevelConfig.bgColor} ${currentLevelConfig.color.replace('text-', 'text-')}`}
                    style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                  >
                    {currentLevelConfig.name}
                  </span>
                  <span className="text-white/70 text-sm">
                    Miembro desde{' '}
                    {new Date(profile.memberSince).toLocaleDateString('es', {
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3 md:ml-auto">
              <div className="bg-white/10 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold">{formatXP(profile.totalXP)}</div>
                <div className="text-xs text-white/70">XP Total</div>
              </div>
              <div className="bg-white/10 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold">{profile.unlockedBadges.length}</div>
                <div className="text-xs text-white/70">Badges</div>
              </div>
              <div className="bg-white/10 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold">{profile.streaks.shipment.current}</div>
                <div className="text-xs text-white/70">Racha 🔥</div>
              </div>
              <div className="bg-white/10 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold">#{profile.ranking.national || '-'}</div>
                <div className="text-xs text-white/70">Ranking</div>
              </div>
            </div>
          </div>

          {/* XP Progress Bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span>Progreso a {nextLevelConfig?.name || 'Max'}</span>
              <span>
                {formatXP(profile.totalXP)} / {nextLevelConfig ? formatXP(nextLevelConfig.minXP) : '∞'} XP
              </span>
            </div>
            <div className="h-3 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full transition-all duration-500"
                style={{ width: `${profile.levelProgress}%` }}
              />
            </div>
            {nextLevelConfig && (
              <div className="text-xs text-white/60 mt-1">
                Faltan {formatXP(profile.xpToNextLevel)} XP para {nextLevelConfig.name}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex bg-white dark:bg-navy-900 rounded-xl p-1 border border-slate-200 dark:border-navy-800">
        {[
          { id: 'overview', label: 'Resumen', icon: <BarChart3 className="w-4 h-4" /> },
          { id: 'badges', label: 'Badges', icon: <Award className="w-4 h-4" /> },
          { id: 'challenges', label: 'Desafíos', icon: <Target className="w-4 h-4" /> },
          { id: 'leaderboard', label: 'Ranking', icon: <Trophy className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id as any)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${
              activeSection === tab.id
                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-navy-800'
            }`}
          >
            {tab.icon}
            <span className="hidden md:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Overview Section */}
      {activeSection === 'overview' && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Level Benefits */}
          <div className="bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-800 p-6">
            <h3 className="flex items-center gap-2 font-bold text-slate-800 dark:text-white mb-4">
              <Gift className="w-5 h-5 text-purple-500" />
              Beneficios de tu Nivel
            </h3>
            <div className="space-y-3">
              {profile.activeBenefits.map((benefit, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl"
                >
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center">
                    {benefit.type === 'discount' ? (
                      <span className="text-purple-600 font-bold">{benefit.value}%</span>
                    ) : (
                      <Sparkles className="w-5 h-5 text-purple-500" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-slate-800 dark:text-white">{benefit.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {benefit.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Next Level Preview */}
            {nextLevelConfig && (
              <div className="mt-4 p-4 bg-slate-50 dark:bg-navy-800 rounded-xl border-2 border-dashed border-slate-200 dark:border-navy-700">
                <div className="text-sm text-slate-500 mb-2">Próximo nivel: {nextLevelConfig.name}</div>
                <div className="flex flex-wrap gap-2">
                  {nextLevelConfig.benefits.slice(0, 2).map((benefit, i) => (
                    <span
                      key={i}
                      className="text-xs bg-slate-200 dark:bg-navy-700 text-slate-600 dark:text-slate-400 px-2 py-1 rounded-full"
                    >
                      {benefit.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-800 p-6">
            <h3 className="flex items-center gap-2 font-bold text-slate-800 dark:text-white mb-4">
              <Clock className="w-5 h-5 text-blue-500" />
              Actividad Reciente
            </h3>
            <div className="space-y-3">
              {profile.xpHistory.slice(0, 5).map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-navy-800 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        tx.category === 'shipment'
                          ? 'bg-blue-100 dark:bg-blue-900/30'
                          : tx.category === 'streak'
                            ? 'bg-orange-100 dark:bg-orange-900/30'
                            : tx.category === 'ml'
                              ? 'bg-purple-100 dark:bg-purple-900/30'
                              : 'bg-emerald-100 dark:bg-emerald-900/30'
                      }`}
                    >
                      {tx.category === 'shipment' ? (
                        <Package className="w-4 h-4 text-blue-500" />
                      ) : tx.category === 'streak' ? (
                        <Flame className="w-4 h-4 text-orange-500" />
                      ) : tx.category === 'ml' ? (
                        <BarChart3 className="w-4 h-4 text-purple-500" />
                      ) : (
                        <Zap className="w-4 h-4 text-emerald-500" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm text-slate-700 dark:text-slate-300">{tx.reason}</div>
                      <div className="text-xs text-slate-400">
                        {new Date(tx.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">+{tx.amount} XP</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: 'Envíos Totales',
                value: profile.stats.totalShipments,
                icon: <Package className="w-5 h-5" />,
                color: 'blue',
              },
              {
                label: 'Entregas Perfectas',
                value: profile.stats.perfectDeliveries,
                icon: <Check className="w-5 h-5" />,
                color: 'emerald',
              },
              {
                label: 'Envíos Flash',
                value: profile.stats.flashShipments,
                icon: <Zap className="w-5 h-5" />,
                color: 'orange',
              },
              {
                label: 'Predicciones ML',
                value: profile.stats.mlPredictions,
                icon: <BarChart3 className="w-5 h-5" />,
                color: 'purple',
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className={`bg-${stat.color}-50 dark:bg-${stat.color}-900/20 rounded-xl p-4 border border-${stat.color}-100 dark:border-${stat.color}-800`}
              >
                <div className={`text-${stat.color}-500 mb-2`}>{stat.icon}</div>
                <div className="text-2xl font-bold text-slate-800 dark:text-white">{stat.value}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Badges Section */}
      {activeSection === 'badges' && (
        <div className="space-y-6">
          {/* Unlocked Badges */}
          <div>
            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-white mb-4">
              <Award className="w-5 h-5 text-gold-500" />
              Badges Desbloqueados ({profile.unlockedBadges.length})
            </h3>
            {profile.unlockedBadges.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {profile.unlockedBadges.map((badge) => (
                  <BadgeCard key={badge.id} badge={badge} unlocked />
                ))}
              </div>
            ) : (
              <div className="bg-slate-50 dark:bg-navy-800 rounded-xl p-8 text-center">
                <Award className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">Completa acciones para desbloquear badges</p>
              </div>
            )}
          </div>

          {/* Locked Badges */}
          <div>
            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-white mb-4">
              <Lock className="w-5 h-5 text-slate-400" />
              Por Desbloquear ({profile.lockedBadges.length})
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {profile.lockedBadges.slice(0, 12).map((badge) => (
                <BadgeCard key={badge.id} badge={badge} unlocked={false} progress={getBadgeProgress(badge)} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Challenges Section */}
      {activeSection === 'challenges' && (
        <div className="space-y-6">
          {/* Active Challenges */}
          <div>
            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-white mb-4">
              <Target className="w-5 h-5 text-orange-500" />
              Desafíos Activos
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {profile.activeChallenges.map((challenge) => (
                <ChallengeCard key={challenge.id} challenge={challenge} />
              ))}
            </div>
          </div>

          {/* Completed Challenges */}
          {profile.completedChallenges.length > 0 && (
            <div>
              <h3 className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-white mb-4">
                <Check className="w-5 h-5 text-emerald-500" />
                Desafíos Completados
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {profile.completedChallenges.slice(0, 4).map((challenge) => (
                  <ChallengeCard key={challenge.id} challenge={challenge} completed />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Leaderboard Section */}
      {activeSection === 'leaderboard' && (
        <div className="bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-800 overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-navy-800">
            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-white">
              <Trophy className="w-5 h-5 text-gold-500" />
              Ranking Nacional
            </h3>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-navy-800">
            {leaderboard.map((entry, index) => (
              <div
                key={entry.userId}
                className={`flex items-center gap-4 p-4 transition-colors ${
                  entry.isCurrentUser
                    ? 'bg-purple-50 dark:bg-purple-900/20'
                    : 'hover:bg-slate-50 dark:hover:bg-navy-800'
                }`}
              >
                {/* Rank */}
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                    entry.rank === 1
                      ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white'
                      : entry.rank === 2
                        ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-white'
                        : entry.rank === 3
                          ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white'
                          : 'bg-slate-100 dark:bg-navy-800 text-slate-500'
                  }`}
                >
                  {entry.rank <= 3 ? (
                    entry.rank === 1 ? (
                      <Crown className="w-5 h-5" />
                    ) : (
                      <Medal className="w-5 h-5" />
                    )
                  ) : (
                    entry.rank
                  )}
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 dark:text-white truncate">
                      {entry.username}
                      {entry.isCurrentUser && (
                        <span className="ml-2 text-xs bg-purple-200 dark:bg-purple-800 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full">
                          Tú
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span>{formatXP(entry.xp)} XP</span>
                    <span>{entry.badges} badges</span>
                    <span className="flex items-center gap-1">
                      <Flame className="w-3 h-3" />
                      {entry.streak}
                    </span>
                  </div>
                </div>

                {/* Level Badge */}
                <div className="text-right">
                  <span className="text-lg">{getLevelConfig(entry.level).icon}</span>
                  <div className="text-xs text-slate-500">{entry.shipmentsThisMonth} envíos/mes</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Badge Card Component
const BadgeCard: React.FC<{ badge: Badge; unlocked: boolean; progress?: number }> = ({
  badge,
  unlocked,
  progress = 0,
}) => {
  const rarityColors: Record<string, string> = {
    common: 'border-slate-300 dark:border-slate-600',
    rare: 'border-blue-400',
    epic: 'border-purple-400',
    legendary: 'border-gold-500',
  };

  return (
    <div
      className={`relative p-4 rounded-xl border-2 text-center transition-all ${
        unlocked
          ? `bg-white dark:bg-navy-900 ${rarityColors[badge.rarity]}`
          : 'bg-slate-50 dark:bg-navy-800 border-slate-200 dark:border-navy-700 opacity-60'
      }`}
    >
      {/* Rarity indicator */}
      {unlocked && badge.rarity !== 'common' && (
        <div
          className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center ${
            badge.rarity === 'legendary'
              ? 'bg-gold-500'
              : badge.rarity === 'epic'
                ? 'bg-purple-500'
                : 'bg-blue-500'
          }`}
        >
          <Star className="w-3 h-3 text-white fill-white" />
        </div>
      )}

      <div className="text-3xl mb-2">{badge.icon}</div>
      <div className="font-bold text-sm text-slate-800 dark:text-white">{badge.name}</div>
      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{badge.description}</div>

      {!unlocked && progress > 0 && (
        <div className="mt-2">
          <div className="h-1.5 bg-slate-200 dark:bg-navy-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-400 mt-1">{progress}%</div>
        </div>
      )}

      {unlocked && (
        <div className="mt-2 text-xs text-emerald-500 font-medium">+{badge.xpReward} XP</div>
      )}

      {!unlocked && <Lock className="w-4 h-4 text-slate-400 mx-auto mt-2" />}
    </div>
  );
};

// Challenge Card Component
const ChallengeCard: React.FC<{ challenge: Challenge; completed?: boolean }> = ({
  challenge,
  completed = false,
}) => {
  const progress = (challenge.requirement.current / challenge.requirement.target) * 100;

  const typeColors: Record<string, string> = {
    daily: 'from-blue-500 to-cyan-500',
    weekly: 'from-purple-500 to-pink-500',
    monthly: 'from-orange-500 to-red-500',
    special: 'from-gold-500 to-yellow-500',
  };

  return (
    <div
      className={`bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-800 p-5 ${
        completed ? 'opacity-70' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-xl bg-gradient-to-br ${typeColors[challenge.type]} flex items-center justify-center text-2xl`}
          >
            {challenge.icon}
          </div>
          <div>
            <h4 className="font-bold text-slate-800 dark:text-white">{challenge.name}</h4>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                challenge.type === 'daily'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  : challenge.type === 'weekly'
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                    : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
              }`}
            >
              {challenge.type === 'daily' ? 'Diario' : challenge.type === 'weekly' ? 'Semanal' : 'Mensual'}
            </span>
          </div>
        </div>
        {completed && (
          <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
            <Check className="w-5 h-5 text-emerald-500" />
          </div>
        )}
      </div>

      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{challenge.description}</p>

      {/* Progress */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-slate-500">Progreso</span>
          <span className="font-medium text-slate-700 dark:text-slate-300">
            {challenge.requirement.current} / {challenge.requirement.target}
          </span>
        </div>
        <div className="h-2 bg-slate-100 dark:bg-navy-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all bg-gradient-to-r ${typeColors[challenge.type]}`}
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>
      </div>

      {/* Rewards */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-400">Recompensa:</span>
        <div className="flex items-center gap-2">
          <span className="font-bold text-emerald-500">+{challenge.rewards.xp} XP</span>
          {challenge.rewards.badge && (
            <span className="text-purple-500">
              <Award className="w-4 h-4" />
            </span>
          )}
          {challenge.rewards.prize && (
            <span className="text-gold-500">
              <Gift className="w-4 h-4" />
            </span>
          )}
        </div>
      </div>

      {/* Time remaining */}
      {!completed && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-navy-800 text-xs text-slate-400 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Termina:{' '}
          {new Date(challenge.endDate).toLocaleDateString('es', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
          })}
        </div>
      )}
    </div>
  );
};

export default GamificationTab;
