/**
 * LIVE METRIC CARD COMPONENT
 * Tarjeta con número animado y tendencia
 */

import React, { useEffect, useState, useRef } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface LiveMetricCardProps {
  title: string;
  value: number;
  previousValue?: number;
  icon: React.ReactNode;
  color: 'emerald' | 'amber' | 'blue' | 'purple' | 'red';
  suffix?: string;
  prefix?: string;
}

const colorClasses = {
  emerald: {
    bg: 'from-emerald-500/20 to-emerald-600/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
  },
  amber: {
    bg: 'from-amber-500/20 to-amber-600/10',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
  },
  blue: {
    bg: 'from-blue-500/20 to-blue-600/10',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
  },
  purple: {
    bg: 'from-purple-500/20 to-purple-600/10',
    border: 'border-purple-500/30',
    text: 'text-purple-400',
  },
  red: {
    bg: 'from-red-500/20 to-red-600/10',
    border: 'border-red-500/30',
    text: 'text-red-400',
  },
};

const LiveMetricCard: React.FC<LiveMetricCardProps> = ({
  title,
  value,
  previousValue,
  icon,
  color,
  suffix = '',
  prefix = '',
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const prevValueRef = useRef(value);

  // Animate number change
  useEffect(() => {
    if (value !== prevValueRef.current) {
      setIsAnimating(true);
      const start = prevValueRef.current;
      const end = value;
      const duration = 500;
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
        const current = Math.round(start + (end - start) * eased);
        setDisplayValue(current);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setIsAnimating(false);
          prevValueRef.current = value;
        }
      };

      requestAnimationFrame(animate);
    } else {
      setDisplayValue(value);
    }
  }, [value]);

  const change = previousValue !== undefined ? value - previousValue : 0;
  const changePercent = previousValue && previousValue > 0
    ? Math.round((change / previousValue) * 100)
    : 0;

  const classes = colorClasses[color];

  return (
    <div
      className={`bg-gradient-to-br ${classes.bg} rounded-xl p-4 border ${classes.border} transition-all duration-300 ${
        isAnimating ? 'scale-105' : ''
      }`}
    >
      <div className={`${classes.text} mb-2`}>{icon}</div>
      <p className={`text-3xl font-bold text-white transition-all ${isAnimating ? 'text-amber-400' : ''}`}>
        {prefix}{displayValue.toLocaleString()}{suffix}
      </p>
      <div className="flex items-center justify-between mt-1">
        <p className="text-sm text-slate-400">{title}</p>
        {previousValue !== undefined && change !== 0 && (
          <div className={`flex items-center gap-1 text-xs ${change > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {change > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span>{change > 0 ? '+' : ''}{changePercent}%</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveMetricCard;
