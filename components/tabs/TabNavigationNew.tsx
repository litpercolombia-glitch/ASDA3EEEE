import React from 'react';
import { Package, Activity, Target, FileBarChart, Bot, Brain, TrendingUp, Trophy, Building2, GraduationCap, Plug, ShieldCheck, BarChart2 } from 'lucide-react';
import { MainTabNew } from '../../types/logistics';

interface TabNavigationNewProps {
  currentTab: MainTabNew;
  onTabChange: (tab: MainTabNew) => void;
  notifications?: {
    seguimiento?: number;
    demanda?: number;
    gamificacion?: number;
    'inteligencia-logistica'?: number;
    semaforo?: number;
    predicciones?: number;
    reporte?: number;
    asistente?: number;
    ml?: number;
    'procesos-litper'?: number;
    'ciudad-agentes'?: number;
    'aprendizaje-ia'?: number;
    'mcp-connections'?: number;
    'conexiones'?: number;
    'admin'?: number;
  };
}

interface TabConfig {
  id: MainTabNew;
  icon: React.ElementType;
  label: string;
  shortLabel: string;
  color: string;
  activeColor: string;
  isNew?: boolean;
}

const tabs: TabConfig[] = [
  {
    id: 'seguimiento',
    icon: Package,
    label: 'Seguimiento',
    shortLabel: 'Seguir',
    color: 'text-emerald-500',
    activeColor: 'bg-emerald-500',
  },
  {
    id: 'demanda',
    icon: TrendingUp,
    label: 'Predicción',
    shortLabel: 'Pred.',
    color: 'text-purple-500',
    activeColor: 'bg-gradient-to-r from-purple-500 to-violet-500',
    isNew: true,
  },
  {
    id: 'gamificacion',
    icon: Trophy,
    label: 'Logros',
    shortLabel: 'XP',
    color: 'text-gold-500',
    activeColor: 'bg-gradient-to-r from-indigo-500 to-purple-500',
    isNew: true,
  },
  {
    id: 'inteligencia-logistica',
    icon: BarChart2,
    label: 'Intel. Logística',
    shortLabel: 'Intel.',
    color: 'text-cyan-500',
    activeColor: 'bg-gradient-to-r from-cyan-500 to-blue-600',
    isNew: true,
  },
  {
    id: 'semaforo',
    icon: Activity,
    label: 'Semáforo',
    shortLabel: 'Sem.',
    color: 'text-amber-500',
    activeColor: 'bg-amber-500',
  },
  {
    id: 'predicciones',
    icon: Target,
    label: 'Análisis',
    shortLabel: 'Análi.',
    color: 'text-teal-500',
    activeColor: 'bg-teal-500',
  },
  {
    id: 'reporte',
    icon: FileBarChart,
    label: 'Reporte IA',
    shortLabel: 'Rep.',
    color: 'text-blue-500',
    activeColor: 'bg-blue-500',
  },
  {
    id: 'asistente',
    icon: Bot,
    label: 'Asistente',
    shortLabel: 'IA',
    color: 'text-pink-500',
    activeColor: 'bg-pink-500',
  },
  {
    id: 'ml',
    icon: Brain,
    label: 'Sistema ML',
    shortLabel: 'ML',
    color: 'text-cyan-500',
    activeColor: 'bg-cyan-500',
  },
  {
    id: 'procesos-litper',
    icon: Building2,
    label: 'Procesos Litper',
    shortLabel: 'Procesos',
    color: 'text-indigo-500',
    activeColor: 'bg-gradient-to-r from-indigo-600 to-purple-600',
  },
  {
    id: 'ciudad-agentes',
    icon: Building2,
    label: 'Ciudad Agentes',
    shortLabel: 'Ciudad',
    color: 'text-purple-500',
    activeColor: 'bg-gradient-to-r from-purple-600 to-pink-600',
    isNew: true,
  },
  {
    id: 'aprendizaje-ia',
    icon: GraduationCap,
    label: 'Aprendizaje IA',
    shortLabel: 'Aprende',
    color: 'text-emerald-500',
    activeColor: 'bg-gradient-to-r from-emerald-600 to-teal-600',
    isNew: true,
  },
  {
    id: 'conexiones',
    icon: Plug,
    label: 'Conexiones',
    shortLabel: 'Conex.',
    color: 'text-orange-500',
    activeColor: 'bg-gradient-to-r from-orange-500 to-amber-500',
    isNew: true,
  },
  {
    id: 'admin',
    icon: ShieldCheck,
    label: 'Admin',
    shortLabel: 'Admin',
    color: 'text-rose-500',
    activeColor: 'bg-gradient-to-r from-rose-500 to-pink-600',
    isNew: true,
  },
];

export const TabNavigationNew: React.FC<TabNavigationNewProps> = ({
  currentTab,
  onTabChange,
  notifications = {},
}) => {
  return (
    <div className="w-full">
      {/* Desktop Navigation */}
      <div className="hidden md:block">
        <div className="flex bg-white dark:bg-navy-900 rounded-2xl shadow-lg border border-slate-200 dark:border-navy-700 p-1.5 gap-1">
          {tabs.map((tab) => {
            const isActive = currentTab === tab.id;
            const Icon = tab.icon;
            const notificationCount = notifications[tab.id];

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  flex-1 flex items-center justify-center gap-2.5
                  px-4 py-3.5
                  text-sm font-bold
                  rounded-xl
                  transition-all duration-200
                  relative
                  ${
                    isActive
                      ? `${tab.activeColor} text-white shadow-lg`
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-800'
                  }
                `}
              >
                <Icon className={`w-5 h-5 ${isActive ? '' : tab.color}`} />
                <span className="truncate">{tab.label}</span>
                {tab.isNew && !isActive && (
                  <span className="px-1.5 py-0.5 text-[9px] font-bold bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full">
                    NEW
                  </span>
                )}

                {notificationCount && notificationCount > 0 && (
                  <span
                    className={`
                      absolute -top-1 -right-1
                      min-w-[20px] h-5 px-1.5
                      flex items-center justify-center
                      text-xs font-bold
                      rounded-full
                      ${isActive ? 'bg-white text-slate-800' : 'bg-red-500 text-white'}
                    `}
                  >
                    {notificationCount > 99 ? '99+' : notificationCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        <div className="flex bg-white dark:bg-navy-900 rounded-xl shadow-lg border border-slate-200 dark:border-navy-700 p-1 gap-0.5 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = currentTab === tab.id;
            const Icon = tab.icon;
            const notificationCount = notifications[tab.id];

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  flex-1 min-w-[60px] flex flex-col items-center justify-center gap-1
                  px-2 py-2.5
                  text-[10px] font-bold
                  rounded-lg
                  transition-all duration-200
                  relative
                  ${
                    isActive
                      ? `${tab.activeColor} text-white shadow-md`
                      : 'text-slate-500 dark:text-slate-400'
                  }
                `}
              >
                <Icon className={`w-5 h-5 ${isActive ? '' : tab.color}`} />
                <span className="truncate">{tab.shortLabel}</span>

                {notificationCount && notificationCount > 0 && (
                  <span
                    className={`
                      absolute top-0.5 right-0.5
                      min-w-[16px] h-4 px-1
                      flex items-center justify-center
                      text-[9px] font-bold
                      rounded-full
                      ${isActive ? 'bg-white text-slate-800' : 'bg-red-500 text-white'}
                    `}
                  >
                    {notificationCount > 99 ? '99+' : notificationCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TabNavigationNew;
