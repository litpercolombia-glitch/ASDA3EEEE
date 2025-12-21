import React, { useState } from 'react';
import { Minus, Plus } from 'lucide-react';

interface QuickCounterProps {
  label: string;
  icon: string;
  value: number;
  color: string;
  onIncrement: (amount: number) => void;
  onDecrement: (amount: number) => void;
  onChange: (value: number) => void;
}

const QuickCounter: React.FC<QuickCounterProps> = ({
  label,
  icon,
  value,
  color,
  onIncrement,
  onDecrement,
  onChange,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value.toString());

  const colorClasses: Record<string, string> = {
    slate: 'text-slate-400',
    emerald: 'text-emerald-400',
    red: 'text-red-400',
    blue: 'text-blue-400',
    orange: 'text-orange-400',
    yellow: 'text-yellow-400',
    purple: 'text-purple-400',
  };

  const bgClasses: Record<string, string> = {
    slate: 'bg-slate-500/10',
    emerald: 'bg-emerald-500/10',
    red: 'bg-red-500/10',
    blue: 'bg-blue-500/10',
    orange: 'bg-orange-500/10',
    yellow: 'bg-yellow-500/10',
    purple: 'bg-purple-500/10',
  };

  // Click izquierdo: +1/-1, Click derecho: +5/-5
  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault();
    const amount = e.button === 2 ? 5 : 1;
    onIncrement(amount);
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault();
    const amount = e.button === 2 ? 5 : 1;
    onDecrement(amount);
  };

  const handleValueClick = () => {
    setEditValue(value.toString());
    setIsEditing(true);
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value);
  };

  const handleValueBlur = () => {
    const newValue = parseInt(editValue) || 0;
    onChange(Math.max(0, newValue));
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleValueBlur();
    }
    if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  // Prevenir menu contextual
  const preventContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  return (
    <div
      className={`flex items-center justify-between px-2 py-1.5 rounded-lg ${bgClasses[color]} transition-colors`}
    >
      {/* Label */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-base">{icon}</span>
        <span className={`text-xs font-medium ${colorClasses[color]} truncate`}>
          {label}
        </span>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1">
        {/* Decrement */}
        <button
          onClick={handleDecrement}
          onContextMenu={handleDecrement}
          onMouseDown={preventContextMenu}
          className="w-7 h-7 flex items-center justify-center bg-dark-600 hover:bg-dark-500 rounded text-slate-300 hover:text-white transition-colors active:scale-95"
          title="Click: -1 | Click derecho: -5"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        {/* Value */}
        {isEditing ? (
          <input
            type="number"
            value={editValue}
            onChange={handleValueChange}
            onBlur={handleValueBlur}
            onKeyDown={handleKeyDown}
            className="w-12 h-7 text-center bg-dark-600 text-white font-bold text-sm rounded border-2 border-amber-500 outline-none"
            autoFocus
            min="0"
          />
        ) : (
          <button
            onClick={handleValueClick}
            className="w-12 h-7 text-center bg-dark-600 hover:bg-dark-500 text-white font-bold text-sm rounded transition-colors"
            title="Click para editar"
          >
            {value}
          </button>
        )}

        {/* Increment */}
        <button
          onClick={handleIncrement}
          onContextMenu={handleIncrement}
          onMouseDown={preventContextMenu}
          className="w-7 h-7 flex items-center justify-center bg-dark-600 hover:bg-dark-500 rounded text-slate-300 hover:text-white transition-colors active:scale-95"
          title="Click: +1 | Click derecho: +5"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default QuickCounter;
