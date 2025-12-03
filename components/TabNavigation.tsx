import React from 'react';
import { Home, BarChart3, Target, Activity, Settings } from 'lucide-react';

export type MainTab = 'home' | 'report' | 'predict' | 'semaforo';

interface TabNavigationProps {
  currentTab: MainTab;
  onTabChange: (tab: MainTab) => void;
  hasShipments: boolean;
}

interface TabButtonProps {
  active: boolean;
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

const TabButton: React.FC<TabButtonProps> = ({ active, icon: Icon, label, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`
      flex-1 min-w-[140px] max-w-[200px]
      flex items-center justify-center gap-2
      px-6 py-3.5
      text-sm font-bold
      rounded-xl
      transition-all duration-200
      ${disabled
        ? 'text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-50'
        : active
          ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-lg ring-1 ring-black/5 dark:ring-white/10'
          : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'}
    `}
  >
    <Icon className="w-5 h-5" />
    <span className="hidden sm:inline">{label}</span>
  </button>
);

export const TabNavigation: React.FC<TabNavigationProps> = ({
  currentTab,
  onTabChange,
  hasShipments
}) => {
  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="flex gap-2 p-1.5 bg-slate-100 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700/50">
        <TabButton
          active={currentTab === 'home'}
          icon={Home}
          label="Inicio"
          onClick={() => onTabChange('home')}
        />
        <TabButton
          active={currentTab === 'report'}
          icon={BarChart3}
          label="Reporte IA"
          onClick={() => onTabChange('report')}
          disabled={!hasShipments}
        />
        <TabButton
          active={currentTab === 'predict'}
          icon={Target}
          label="Predicción"
          onClick={() => onTabChange('predict')}
        />
        <TabButton
          active={currentTab === 'semaforo'}
          icon={Activity}
          label="Semáforo"
          onClick={() => onTabChange('semaforo')}
          disabled={!hasShipments}
        />
      </div>
    </div>
  );
};

export default TabNavigation;
