import { Minus, Plus } from 'lucide-react';
import type { CounterKey } from '../stores/rondaStore';

interface CounterCellProps {
  label: string;
  emoji: string;
  value: number;
  counterKey: CounterKey;
  accent?: 'verde' | 'rojo' | 'amarillo' | 'gold';
  onBump: (delta: number) => void;
  onSet: (value: number) => void;
}

const ACCENT_CLASSES: Record<NonNullable<CounterCellProps['accent']>, string> = {
  verde: 'text-semaforo-verde',
  rojo: 'text-semaforo-rojo',
  amarillo: 'text-semaforo-amarillo',
  gold: 'text-litper-gold-500',
};

export function CounterCell({
  label,
  emoji,
  value,
  accent = 'gold',
  onBump,
  onSet,
}: CounterCellProps) {
  function handleWheel(e: React.WheelEvent) {
    e.preventDefault();
    onBump(e.deltaY < 0 ? 1 : -1);
  }

  function handlePlusContext(e: React.MouseEvent) {
    e.preventDefault();
    onBump(5);
  }

  function handleMinusContext(e: React.MouseEvent) {
    e.preventDefault();
    onBump(-5);
  }

  function handleValueClick() {
    const raw = prompt(`${label}: nuevo valor`, String(value));
    if (raw == null) return;
    const n = parseInt(raw, 10);
    if (!Number.isNaN(n) && n >= 0) onSet(n);
  }

  return (
    <div className="counter-cell" onWheel={handleWheel}>
      <div className="flex items-center gap-1.5 text-[11px] text-litper-cream/85 truncate">
        <span aria-hidden>{emoji}</span>
        <span>{label}</span>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onBump(-1)}
          onContextMenu={handleMinusContext}
          className="w-5 h-5 rounded grid place-items-center
                     text-litper-cream-muted hover:text-litper-cream
                     hover:bg-litper-navy-700/50"
          aria-label={`Restar a ${label}`}
        >
          <Minus size={12} />
        </button>
        <button
          type="button"
          onClick={handleValueClick}
          className={`min-w-[2ch] text-center font-mono font-bold tabular-nums
                      ${ACCENT_CLASSES[accent]} hover:underline cursor-text`}
          title="Click para editar valor"
        >
          {value}
        </button>
        <button
          type="button"
          onClick={() => onBump(1)}
          onContextMenu={handlePlusContext}
          className="w-5 h-5 rounded grid place-items-center
                     text-litper-cream-muted hover:text-litper-gold-500
                     hover:bg-litper-navy-700/50"
          aria-label={`Sumar a ${label}`}
        >
          <Plus size={12} />
        </button>
      </div>
    </div>
  );
}
