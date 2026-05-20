import { Minus, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import type { CounterKey } from '../stores/rondaStore';

interface CounterCellProps {
  label: string;
  emoji: string;
  value: number;
  counterKey: CounterKey;
  accent?: 'verde' | 'rojo' | 'amarillo' | 'gold' | 'azul';
  compact?: boolean;
  onBump: (delta: number) => void;
  onSet: (value: number) => void;
}

const ACCENT_CLASSES: Record<NonNullable<CounterCellProps['accent']>, string> = {
  verde: 'text-semaforo-verde',
  rojo: 'text-semaforo-rojo',
  amarillo: 'text-semaforo-amarillo',
  gold: 'text-litper-gold-500',
  azul: 'text-sky-400',
};

export function CounterCell({
  label,
  emoji,
  value,
  accent = 'gold',
  compact = false,
  onBump,
  onSet,
}: CounterCellProps) {
  const [flash, setFlash] = useState(0);

  function bump(delta: number) {
    onBump(delta);
    setFlash((n) => n + 1);
  }

  function handleWheel(e: React.WheelEvent) {
    e.preventDefault();
    bump(e.deltaY < 0 ? 1 : -1);
  }

  function handlePlusContext(e: React.MouseEvent) {
    e.preventDefault();
    bump(5);
  }

  function handleMinusContext(e: React.MouseEvent) {
    e.preventDefault();
    bump(-5);
  }

  function handleValueClick() {
    const raw = prompt(`${label}: nuevo valor`, String(value));
    if (raw == null) return;
    const n = parseInt(raw, 10);
    if (!Number.isNaN(n) && n >= 0) onSet(n);
  }

  return (
    <div
      className={`counter-cell ${compact ? 'px-2 py-1' : 'px-3 py-2'}`}
      onWheel={handleWheel}
    >
      <div
        className={`flex items-center gap-1.5 truncate ${compact ? 'text-[10px]' : 'text-[11px]'} text-litper-cream/85`}
      >
        <span aria-hidden>{emoji}</span>
        <span>{label}</span>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => bump(-1)}
          onContextMenu={handleMinusContext}
          className="w-5 h-5 rounded grid place-items-center text-litper-cream-muted hover:text-litper-cream hover:bg-litper-navy-700/50 transition-colors"
          aria-label={`Restar a ${label}`}
        >
          <Minus size={12} />
        </button>
        <button
          type="button"
          onClick={handleValueClick}
          className={`min-w-[2ch] text-center font-mono font-bold tabular-nums ${ACCENT_CLASSES[accent]} cursor-text hover:underline relative`}
          title="Click para editar"
        >
          <AnimatePresence mode="popLayout">
            <motion.span
              key={`${value}-${flash}`}
              initial={{ scale: 1.6, y: -4, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.8, y: 4, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 18 }}
              className="inline-block"
            >
              {value}
            </motion.span>
          </AnimatePresence>
        </button>
        <button
          type="button"
          onClick={() => bump(1)}
          onContextMenu={handlePlusContext}
          className="w-5 h-5 rounded grid place-items-center text-litper-cream-muted hover:text-litper-gold-500 hover:bg-litper-navy-700/50 transition-colors"
          aria-label={`Sumar a ${label}`}
        >
          <Plus size={12} />
        </button>
      </div>
    </div>
  );
}
