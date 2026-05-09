import { useEffect, useState } from 'react';
import { Pause, Play, RotateCcw, Save, Search, Pin, Minus, X, Activity } from 'lucide-react';
import { TeamPicker } from './components/TeamPicker';
import { CounterCell } from './components/CounterCell';
import { LitperLogo } from './components/LitperLogo';
import {
  useRondaStore,
  formatTime,
  timerColor,
  type CounterKey,
} from './stores/rondaStore';
import { TAGLINE } from './theme/tokens';

declare global {
  interface Window {
    litperDesk?: {
      invoke: (channel: string, payload?: unknown) => Promise<unknown>;
      on: (event: string, callback: (...args: unknown[]) => void) => () => void;
      isElectron: boolean;
    };
  }
}

interface CounterDef {
  key: CounterKey;
  label: string;
  emoji: string;
  accent: 'verde' | 'rojo' | 'amarillo' | 'gold';
}

const COUNTERS: CounterDef[] = [
  { key: 'iniciales',  label: 'Iniciales',  emoji: '📞', accent: 'gold' },
  { key: 'realizado',  label: 'Realizado',  emoji: '✅', accent: 'verde' },
  { key: 'cancelado',  label: 'Cancelado',  emoji: '❌', accent: 'rojo' },
  { key: 'agendado',   label: 'Agendado',   emoji: '📅', accent: 'amarillo' },
  { key: 'dificiles',  label: 'Difíciles',  emoji: '⚠️', accent: 'amarillo' },
  { key: 'pendientes', label: 'Pendientes', emoji: '⏳', accent: 'gold' },
  { key: 'revisado',   label: 'Revisado',   emoji: '👁️', accent: 'gold' },
];

export function App() {
  const ronda = useRondaStore();
  const tcolor = timerColor(ronda.remainingSec, ronda.durationSec);
  const [pinned, setPinned] = useState(true);
  const [semaforoStatus] = useState<'verde' | 'amarillo' | 'rojo'>('amarillo');

  // Tick del timer cada segundo cuando está running.
  useEffect(() => {
    if (ronda.state !== 'running') return;
    const id = setInterval(() => ronda.tick(), 1000);
    return () => clearInterval(id);
  }, [ronda.state, ronda]);

  // Atajos enviados desde main process.
  useEffect(() => {
    if (!window.litperDesk) return;
    const off = window.litperDesk.on('shortcut', (action) => {
      switch (action) {
        case 'toggle-timer':
          if (ronda.state === 'running') ronda.pauseTimer();
          else if (ronda.state === 'paused') ronda.resumeTimer();
          else ronda.startTimer();
          break;
        case 'save-round':
          ronda.saveRonda();
          break;
        case 'open-search':
          // TODO Fase 4
          break;
        case 'open-semaforo':
          // TODO Fase 3
          break;
      }
    });
    return off;
  }, [ronda]);

  function togglePin() {
    const next = !pinned;
    setPinned(next);
    window.litperDesk?.invoke('window:set-always-on-top', { pinned: next });
  }

  function minimize() {
    window.litperDesk?.invoke('window:minimize');
  }

  function hide() {
    window.litperDesk?.invoke('window:hide');
  }

  return (
    <div className="cq-halo h-screen p-2">
      <div className="halo-panel h-full flex flex-col overflow-hidden">

        {/* ===== HEADER (drag) ===== */}
        <header className="app-drag flex items-center gap-2 px-3 py-2
                           border-b border-litper-gold-500/10">
          <LitperLogo size={22} />
          <div className="flex-1 min-w-0">
            <div className="font-brand text-[13px] text-litper-gold-500 leading-none">
              LITPER DESK
            </div>
            <div className="text-[9px] text-litper-cream-muted leading-none mt-0.5 truncate">
              {TAGLINE}
            </div>
          </div>

          <SemaforoPin status={semaforoStatus} />

          <div className="flex items-center gap-0.5 app-no-drag">
            <button
              type="button"
              onClick={togglePin}
              className={`p-1 rounded transition-colors ${
                pinned ? 'text-litper-gold-500' : 'text-litper-cream-muted'
              } hover:bg-litper-navy-800`}
              aria-label="Siempre encima"
              title="Siempre encima"
            >
              <Pin size={13} />
            </button>
            <button
              type="button"
              onClick={minimize}
              className="ghost-btn p-1"
              aria-label="Minimizar"
            >
              <Minus size={13} />
            </button>
            <button
              type="button"
              onClick={hide}
              className="ghost-btn p-1"
              aria-label="Cerrar a tray"
            >
              <X size={13} />
            </button>
          </div>
        </header>

        {/* ===== TEAM PICKER ===== */}
        <div className="px-3 py-2 border-b border-litper-gold-500/10">
          <TeamPicker />
        </div>

        {/* ===== TIMER ===== */}
        <div className="px-3 py-3 flex flex-col items-center gap-2 app-no-drag">
          <div className="text-[10px] uppercase tracking-wider text-litper-cream-muted">
            Ronda #{ronda.rondaNumero}
          </div>
          <div
            className={`timer-display text-4xl ${tcolor.text} ${
              tcolor.pulse ? 'animate-pulse-red' : ''
            } px-4 py-1 rounded-lg ${tcolor.bg}`}
          >
            {formatTime(ronda.remainingSec)}
          </div>
          <div className="flex items-center gap-1.5">
            {ronda.state === 'running' ? (
              <button
                type="button"
                onClick={() => ronda.pauseTimer()}
                className="ghost-btn px-2 py-1 text-xs flex items-center gap-1"
              >
                <Pause size={12} /> Pausa
              </button>
            ) : (
              <button
                type="button"
                onClick={() =>
                  ronda.state === 'paused' ? ronda.resumeTimer() : ronda.startTimer()
                }
                className="gold-btn px-3 py-1 text-xs flex items-center gap-1"
              >
                <Play size={12} />
                {ronda.state === 'paused' ? 'Reanudar' : 'Iniciar'}
              </button>
            )}
            <button
              type="button"
              onClick={() => ronda.resetTimer()}
              className="ghost-btn px-2 py-1 text-xs flex items-center gap-1"
              aria-label="Reset timer"
              title="Reiniciar"
            >
              <RotateCcw size={12} />
            </button>
            <button
              type="button"
              onClick={() => {
                /* abrir Ctrl+K */
              }}
              className="ghost-btn p-1"
              title="Buscar (Ctrl+K)"
              aria-label="Buscar"
            >
              <Search size={12} />
            </button>
          </div>
        </div>

        {/* ===== COUNTERS (grid container-query) ===== */}
        <div
          className="px-3 pb-2 grid gap-1.5 overflow-y-auto flex-1
                     [grid-template-columns:repeat(auto-fill,minmax(140px,1fr))]
                     [@container_halo(max-width:340px)]:grid-cols-1"
        >
          {COUNTERS.map((c) => (
            <CounterCell
              key={c.key}
              label={c.label}
              emoji={c.emoji}
              counterKey={c.key}
              value={ronda.counters[c.key]}
              accent={c.accent}
              onBump={(d) => ronda.bumpCounter(c.key, d)}
              onSet={(v) => ronda.setCounter(c.key, v)}
            />
          ))}
        </div>

        {/* ===== FOOTER ===== */}
        <footer className="px-3 py-2 border-t border-litper-gold-500/10
                           flex items-center gap-2 app-no-drag">
          <button
            type="button"
            onClick={() => ronda.saveRonda()}
            className="gold-btn flex-1 px-3 py-1.5 text-xs flex items-center justify-center gap-1.5"
          >
            <Save size={12} />
            Guardar ronda
          </button>
          <div className="flex items-center gap-1 text-[10px] text-litper-cream-muted">
            <Activity size={10} />
            <span>{ronda.counters.realizado}/{ronda.counters.iniciales || '–'}</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

function SemaforoPin({ status }: { status: 'verde' | 'amarillo' | 'rojo' }) {
  const color = {
    verde: 'bg-semaforo-verde',
    amarillo: 'bg-semaforo-amarillo',
    rojo: 'bg-semaforo-rojo',
  }[status];
  const pulse = status === 'rojo' ? 'animate-pulse-red' : '';
  return (
    <button
      type="button"
      className={`app-no-drag w-3 h-3 rounded-full ${color} ${pulse}
                  ring-2 ring-litper-navy-950
                  hover:scale-110 transition-transform`}
      aria-label={`Semáforo: ${status}`}
      title={`Semáforo: ${status}. F1 para abrir`}
    />
  );
}
