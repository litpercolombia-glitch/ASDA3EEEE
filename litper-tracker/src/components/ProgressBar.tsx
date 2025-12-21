import React from 'react';

interface ProgressBarProps {
  current: number;
  target: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ current, target }) => {
  const percentage = target > 0 ? Math.min(100, (current / target) * 100) : 0;

  const getColor = () => {
    if (percentage >= 100) return 'from-emerald-500 to-emerald-400';
    if (percentage >= 75) return 'from-amber-500 to-amber-400';
    return 'from-blue-500 to-blue-400';
  };

  return (
    <div className="bg-dark-700 rounded-lg p-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-slate-400">Hoy</span>
        <span className="text-xs font-medium text-white">
          ✅ {current}/{target} ({Math.round(percentage)}%)
        </span>
      </div>
      <div className="h-2 bg-dark-600 rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${getColor()} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {percentage >= 100 && (
        <p className="text-emerald-400 text-xs text-center mt-1">
          Meta cumplida!
        </p>
      )}
    </div>
  );
};

export default ProgressBar;
