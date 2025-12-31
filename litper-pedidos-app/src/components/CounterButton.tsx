import React, { useState, useRef } from 'react';
import { Minus, Plus } from 'lucide-react';

interface CounterButtonProps {
  id: string;
  label: string;
  labelCorto: string;
  icono: string;
  color: string;
  valor: number;
  esCalculado?: boolean;
  compact?: boolean;
  onIncrement: (id: string, cantidad?: number) => void;
  onDecrement: (id: string, cantidad?: number) => void;
}

const CounterButton: React.FC<CounterButtonProps> = ({
  id,
  label,
  labelCorto,
  icono,
  color,
  valor,
  esCalculado = false,
  compact = false,
  onIncrement,
  onDecrement,
}) => {
  const [animating, setAnimating] = useState<'up' | 'down' | null>(null);
  const holdTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const holdIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleIncrement = () => {
    if (esCalculado) return;
    setAnimating('up');
    onIncrement(id);
    setTimeout(() => setAnimating(null), 200);
  };

  const handleDecrement = () => {
    if (esCalculado || valor <= 0) return;
    setAnimating('down');
    onDecrement(id);
    setTimeout(() => setAnimating(null), 200);
  };

  // Long press para incrementar +5
  const handleMouseDown = (action: 'inc' | 'dec') => {
    if (esCalculado) return;

    holdTimeoutRef.current = setTimeout(() => {
      holdIntervalRef.current = setInterval(() => {
        if (action === 'inc') {
          onIncrement(id, 1);
        } else if (valor > 0) {
          onDecrement(id, 1);
        }
      }, 100);
    }, 500);
  };

  const handleMouseUp = () => {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
    }
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        <span style={{ color }} className="text-sm">{icono}</span>
        <span
          className={`font-bold text-sm tabular-nums transition-transform ${
            animating === 'up' ? 'scale-125 text-green-400' :
            animating === 'down' ? 'scale-75 text-red-400' : 'text-white'
          }`}
        >
          {valor}
        </span>
        {!esCalculado && (
          <>
            <button
              onClick={handleIncrement}
              onMouseDown={() => handleMouseDown('inc')}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className="w-5 h-5 rounded bg-dark-700 hover:bg-green-600/30 flex items-center justify-center text-green-400 transition-all"
            >
              <Plus className="w-3 h-3" />
            </button>
            <button
              onClick={handleDecrement}
              onMouseDown={() => handleMouseDown('dec')}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              disabled={valor <= 0}
              className="w-5 h-5 rounded bg-dark-700 hover:bg-red-600/30 flex items-center justify-center text-red-400 transition-all disabled:opacity-30"
            >
              <Minus className="w-3 h-3" />
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-between p-2 rounded-lg transition-all ${
        esCalculado ? 'bg-dark-800/50' : 'bg-dark-700/50 hover:bg-dark-700'
      }`}
      style={{ borderLeft: `3px solid ${color}` }}
    >
      <div className="flex items-center gap-2">
        <span className="text-lg">{icono}</span>
        <span className="text-sm text-dark-300">{label}</span>
      </div>

      <div className="flex items-center gap-2">
        {!esCalculado && (
          <button
            onClick={handleDecrement}
            onMouseDown={() => handleMouseDown('dec')}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            disabled={valor <= 0}
            className="w-7 h-7 rounded-md bg-dark-600 hover:bg-red-600/30 flex items-center justify-center text-red-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Minus className="w-4 h-4" />
          </button>
        )}

        <span
          className={`min-w-[3rem] text-center text-xl font-bold tabular-nums transition-all duration-200 ${
            animating === 'up' ? 'scale-125 text-green-400' :
            animating === 'down' ? 'scale-75 text-red-400' : 'text-white'
          } ${esCalculado ? 'text-pink-400' : ''}`}
        >
          {valor}
        </span>

        {!esCalculado && (
          <button
            onClick={handleIncrement}
            onMouseDown={() => handleMouseDown('inc')}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="w-7 h-7 rounded-md bg-dark-600 hover:bg-green-600/30 flex items-center justify-center text-green-400 transition-all"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}

        {esCalculado && (
          <span className="text-xs text-dark-500 ml-1">(auto)</span>
        )}
      </div>
    </div>
  );
};

export default CounterButton;
