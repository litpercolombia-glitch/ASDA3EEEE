import { useEffect, useMemo, useState } from 'react';
import {
  Pause, Play, RotateCcw, Save, Search, Pin, Minus, X,
  Activity, Plug, Download, FileText, RefreshCw, ChevronRight,
} from 'lucide-react';
import { TeamPicker } from './components/TeamPicker';
import { CounterCell } from './components/CounterCell';
import { LitperLogo } from './components/LitperLogo';
import { ModeBar } from './components/ModeBar';
import { MetricasInline } from './components/MetricasInline';
import { ConexionesModal } from './components/ConexionesModal';
import { AuroraBackground } from './components/AuroraBackground';
import { ParticlesOverlay } from './components/ParticlesOverlay';
import {
  useRondaStore, formatTime, timerColor, computeKPIs, semaforoColor,
  type CounterKey,
} from './stores/rondaStore';
import { useUIStore, MODE_SIZES, type WindowMode } from './stores/uiStore';
import { useTeamStore } from './stores/teamStore';
import { TAGLINE } from './theme/tokens';
import { exportRondasToExcel } from './lib/excelExport';
import { generateDailyReport } from './lib/pdfReport';

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
  shortLabel: string;
  emoji: string;
  accent: 'verde' | 'rojo' | 'amarillo' | 'gold' | 'azul';
}

const COUNTERS: CounterDef[] = [
  { key: 'iniciales',  label: 'Iniciales',  shortLabel: 'Ini', emoji: '📞', accent: 'gold' },
  { key: 'realizado',  label: 'Realizado',  shortLabel: 'OK',  emoji: '✅', accent: 'verde' },
  { key: 'cancelado',  label: 'Cancelado',  shortLabel: 'Can', emoji: '❌', accent: 'rojo' },
  { key: 'agendado',   label: 'Agendado',   shortLabel: 'Age', emoji: '📅', accent: 'amarillo' },
  { key: 'dificiles',  label: 'Difíciles',  shortLabel: 'Dif', emoji: '⚠️', accent: 'amarillo' },
  { key: 'pendientes', label: 'Pendientes', shortLabel: 'Pen', emoji: '⏳', accent: 'gold' },
  { key: 'revisado',   label: 'Revisado',   shortLabel: 'Rev', emoji: '👁', accent: 'gold' },
  { key: 'novedades',  label: 'Novedades',  shortLabel: 'Nov', emoji: '🆕', accent: 'azul' },
];

export function App() {
  const ronda = useRondaStore();
  const { mode, setMode, openConexiones } = useUIStore();
  const { users, activeUserId } = useTeamStore();
  const [pinned, setPinned] = useState(true);

  const activeUser = users.find((u) => u.id === activeUserId) ?? users[0];
  const kpis = useMemo(
    () => computeKPIs(ronda.rondasHoy, ronda.counters, ronda.diasCerrados),
    [ronda.rondasHoy, ronda.counters, ronda.diasCerrados],
  );
  const semaforo = semaforoColor(kpis.tasa);
  const tcolor = timerColor(ronda.remainingSec, ronda.durationSec);
  const inRed = tcolor.pulse;

  const sparkValues = useMemo(
    () => ronda.rondasHoy.map((r) => r.counters.realizado),
    [ronda.rondasHoy],
  );

  // Tick del timer cada segundo cuando esta running.
  useEffect(() => {
    if (ronda.state !== 'running') return;
    const id = setInterval(() => ronda.tick(), 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ronda.state]);

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
          if (activeUser) ronda.saveRonda(activeUser.id);
          break;
        case 'open-search':
          // TODO Fase 4
          break;
        case 'open-semaforo':
          // TODO Fase 3
          break;
        case 'open-conexiones':
          openConexiones();
          break;
        case 'mode-micro':
          setMode('micro');
          break;
        case 'mode-mini':
          setMode('mini');
          break;
        case 'mode-halo':
          setMode('halo');
          break;
        case 'mode-comando':
          setMode('comando');
          break;
      }
    });
    return off;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeUser?.id]);

  // Al montar, aplicar el tamaño persistido del modo guardado.
  useEffect(() => {
    const size = MODE_SIZES[mode];
    window.litperDesk?.invoke('window:set-size', size).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function togglePin() {
    const next = !pinned;
    setPinned(next);
    window.litperDesk?.invoke('window:set-always-on-top', { pinned: next });
  }

  function handleSaveRonda() {
    if (!activeUser) return;
    ronda.saveRonda(activeUser.id);
  }

  function handleReiniciarDia() {
    if (confirm('¿Reiniciar el día? Esto borra todas las rondas de hoy sin guardar histórico.')) {
      ronda.reiniciarDia();
    }
  }

  function handleFinalizarDia() {
    if (ronda.rondasHoy.length === 0) {
      alert('No hay rondas guardadas hoy.');
      return;
    }
    if (!confirm(`¿Finalizar día?\n${ronda.rondasHoy.length} rondas, tasa ${(kpis.tasa * 100).toFixed(1)}%.\nSe generará un PDF y se cerrará el día.`)) return;

    generateDailyReport({
      fecha: ronda.fechaActual,
      rondas: ronda.rondasHoy,
      users,
      kpis,
    });
    exportRondasToExcel(ronda.rondasHoy, users, kpis, ronda.fechaActual);
    ronda.finalizarDia();
  }

  function handleExcel() {
    if (ronda.rondasHoy.length === 0 && Object.values(ronda.counters).every((v) => v === 0)) {
      alert('No hay datos para exportar todavía.');
      return;
    }
    exportRondasToExcel(ronda.rondasHoy, users, kpis, ronda.fechaActual);
  }

  return (
    <div className="cq-halo h-screen p-2 relative">
      <div className="halo-panel h-full flex flex-col overflow-hidden relative">
        <AuroraBackground semaforo={semaforo} />
        <ParticlesOverlay active={inRed} />

        <div className="relative z-10 flex flex-col h-full">
          <HeaderBar
            pinned={pinned}
            onPin={togglePin}
            onMinimize={() => window.litperDesk?.invoke('window:minimize')}
            onHide={() => window.litperDesk?.invoke('window:hide')}
            semaforo={semaforo}
            mode={mode}
          />

          {mode !== 'micro' && (
            <div className="px-3 py-2 border-b border-litper-gold-500/10 relative z-10">
              <TeamPicker />
            </div>
          )}

          {mode === 'micro' && <MicroBody />}
          {mode === 'mini' && <MiniBody />}
          {mode === 'halo' && <HaloBody activeUserId={activeUser?.id ?? ''} sparkValues={sparkValues} kpis={kpis} onSaveRonda={handleSaveRonda} onReiniciar={handleReiniciarDia} onExcel={handleExcel} onFinalizar={handleFinalizarDia} onConexiones={openConexiones} />}
          {mode === 'comando' && <ComandoBody activeUserId={activeUser?.id ?? ''} sparkValues={sparkValues} kpis={kpis} onSaveRonda={handleSaveRonda} onReiniciar={handleReiniciarDia} onExcel={handleExcel} onFinalizar={handleFinalizarDia} onConexiones={openConexiones} />}
        </div>
      </div>

      <ConexionesModal />
    </div>
  );
}

// ============================================================================
// HeaderBar (común a todos los modos)
// ============================================================================
interface HeaderBarProps {
  pinned: boolean;
  onPin: () => void;
  onMinimize: () => void;
  onHide: () => void;
  semaforo: 'verde' | 'amarillo' | 'rojo';
  mode: WindowMode;
}

function HeaderBar({ pinned, onPin, onMinimize, onHide, semaforo, mode }: HeaderBarProps) {
  const compact = mode === 'micro';

  return (
    <header
      className={`app-drag relative z-10 flex items-center gap-2 border-b border-litper-gold-500/10 ${compact ? 'px-2 py-1' : 'px-3 py-2'}`}
    >
      <LitperLogo size={compact ? 18 : 22} />
      {!compact && (
        <div className="flex-1 min-w-0">
          <div className="font-brand text-[13px] text-litper-gold-500 leading-none">LITPER DESK</div>
          <div className="text-[9px] text-litper-cream-muted leading-none mt-0.5 truncate">{TAGLINE}</div>
        </div>
      )}
      {compact && <div className="flex-1 min-w-0" />}

      <ModeBar />
      <SemaforoPin status={semaforo} />

      <div className="flex items-center gap-0.5 app-no-drag">
        <button
          onClick={onPin}
          className={`p-1 rounded transition-colors ${pinned ? 'text-litper-gold-500' : 'text-litper-cream-muted'} hover:bg-litper-navy-800`}
          aria-label="Siempre encima"
          title="Siempre encima"
        >
          <Pin size={12} />
        </button>
        <button onClick={onMinimize} className="ghost-btn p-1" aria-label="Minimizar">
          <Minus size={12} />
        </button>
        <button onClick={onHide} className="ghost-btn p-1" aria-label="Cerrar a tray">
          <X size={12} />
        </button>
      </div>
    </header>
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
      className={`app-no-drag w-3 h-3 rounded-full ${color} ${pulse} ring-2 ring-litper-navy-950 hover:scale-110 transition-transform`}
      aria-label={`Semáforo: ${status}`}
      title={`Semáforo: ${status}. F1 para abrir`}
    />
  );
}

// ============================================================================
// MICRO (220×88) — solo timer + 1 contador rápido
// ============================================================================
function MicroBody() {
  const ronda = useRondaStore();
  const tc = timerColor(ronda.remainingSec, ronda.durationSec);

  return (
    <div className="relative z-10 flex-1 flex items-center justify-between px-2 pb-1 gap-2 app-no-drag">
      <div className={`timer-display text-xl ${tc.text}`}>{formatTime(ronda.remainingSec)}</div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => ronda.bumpCounter('realizado', 1)}
          onContextMenu={(e) => { e.preventDefault(); ronda.bumpCounter('realizado', 5); }}
          className="px-2 py-1 bg-semaforo-verde/15 text-semaforo-verde rounded font-mono font-bold text-sm hover:bg-semaforo-verde/25"
          title="Realizado +1 / click derecho +5"
        >
          ✅ {ronda.counters.realizado}
        </button>
        {ronda.state === 'running' ? (
          <button onClick={() => ronda.pauseTimer()} className="ghost-btn p-1">
            <Pause size={12} />
          </button>
        ) : (
          <button onClick={() => ronda.startTimer()} className="gold-btn px-1.5 py-1">
            <Play size={12} />
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// MINI (340×320) — timer + 4 contadores principales
// ============================================================================
function MiniBody() {
  const ronda = useRondaStore();
  const tc = timerColor(ronda.remainingSec, ronda.durationSec);
  const main = COUNTERS.filter((c) => ['iniciales', 'realizado', 'cancelado', 'novedades'].includes(c.key));

  return (
    <div className="relative z-10 flex-1 flex flex-col gap-2 px-2 pb-2 app-no-drag">
      <div className="flex items-center justify-center gap-2 mt-1">
        <div className={`timer-display text-2xl ${tc.text} ${tc.pulse ? 'animate-pulse-red' : ''}`}>{formatTime(ronda.remainingSec)}</div>
        {ronda.state === 'running' ? (
          <button onClick={() => ronda.pauseTimer()} className="ghost-btn px-2 py-1 text-xs flex items-center gap-1">
            <Pause size={11} />
          </button>
        ) : (
          <button onClick={() => ronda.state === 'paused' ? ronda.resumeTimer() : ronda.startTimer()} className="gold-btn px-2 py-1 text-xs flex items-center gap-1">
            <Play size={11} />
          </button>
        )}
        <button onClick={() => ronda.resetTimer()} className="ghost-btn px-1.5 py-1"><RotateCcw size={11} /></button>
      </div>

      <div className="grid grid-cols-2 gap-1.5 flex-1">
        {main.map((c) => (
          <CounterCell
            key={c.key}
            label={c.shortLabel}
            emoji={c.emoji}
            counterKey={c.key}
            value={ronda.counters[c.key]}
            accent={c.accent}
            compact
            onBump={(d) => ronda.bumpCounter(c.key, d)}
            onSet={(v) => ronda.setCounter(c.key, v)}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// HALO (380×620) — los 8 contadores + métricas + acciones
// ============================================================================
interface BodyProps {
  activeUserId: string;
  sparkValues: number[];
  kpis: ReturnType<typeof computeKPIs>;
  onSaveRonda: () => void;
  onReiniciar: () => void;
  onExcel: () => void;
  onFinalizar: () => void;
  onConexiones: () => void;
}

function HaloBody({ kpis, sparkValues, onSaveRonda, onReiniciar, onExcel, onFinalizar, onConexiones }: BodyProps) {
  const ronda = useRondaStore();
  const tc = timerColor(ronda.remainingSec, ronda.durationSec);

  return (
    <>
      {/* Timer */}
      <div className="relative z-10 px-3 py-3 flex flex-col items-center gap-2 app-no-drag">
        <div className="text-[10px] uppercase tracking-wider text-litper-cream-muted">
          Ronda #{ronda.rondaNumero} · {ronda.fechaActual}
        </div>
        <div className={`timer-display text-4xl ${tc.text} ${tc.pulse ? 'animate-pulse-red' : ''} px-4 py-1 rounded-lg ${tc.bg}`}>
          {formatTime(ronda.remainingSec)}
        </div>
        <div className="flex items-center gap-1.5">
          {ronda.state === 'running' ? (
            <button onClick={() => ronda.pauseTimer()} className="ghost-btn px-2 py-1 text-xs flex items-center gap-1">
              <Pause size={12} /> Pausa
            </button>
          ) : (
            <button onClick={() => ronda.state === 'paused' ? ronda.resumeTimer() : ronda.startTimer()} className="gold-btn px-3 py-1 text-xs flex items-center gap-1">
              <Play size={12} />
              {ronda.state === 'paused' ? 'Reanudar' : 'Iniciar'}
            </button>
          )}
          <button onClick={() => ronda.resetTimer()} className="ghost-btn px-2 py-1 text-xs flex items-center gap-1" title="Reset timer">
            <RotateCcw size={12} />
          </button>
          <button className="ghost-btn p-1" title="Buscador (Ctrl+K)">
            <Search size={12} />
          </button>
        </div>
      </div>

      {/* 8 contadores */}
      <div className="relative z-10 px-3 grid grid-cols-2 gap-1.5 overflow-y-auto">
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

      {/* Métricas inline */}
      <div className="relative z-10 px-3 pt-2">
        <MetricasInline kpis={kpis} sparkValues={sparkValues} />
      </div>

      {/* Acciones */}
      <div className="relative z-10 px-3 pt-2 pb-2 flex items-center gap-1.5 app-no-drag">
        <button onClick={onSaveRonda} className="gold-btn flex-1 px-3 py-1.5 text-xs flex items-center justify-center gap-1.5">
          <Save size={12} />
          Guardar ronda
        </button>
        <div className="flex items-center gap-0.5 text-[10px] text-litper-cream-muted">
          <Activity size={10} />
          <span>{ronda.counters.realizado}/{ronda.counters.iniciales || '–'}</span>
        </div>
      </div>

      {/* Botones secundarios */}
      <div className="relative z-10 px-3 pb-2 grid grid-cols-2 gap-1 text-[10px] app-no-drag">
        <ActionBtn icon={<RefreshCw size={10} />} label="Reiniciar día" onClick={onReiniciar} />
        <ActionBtn icon={<Download size={10} />} label="Excel" onClick={onExcel} />
        <ActionBtn icon={<Plug size={10} />} label="Conexiones" onClick={onConexiones} />
        <ActionBtn icon={<FileText size={10} />} label="Finalizar día" onClick={onFinalizar} highlight />
      </div>
    </>
  );
}

function ActionBtn({ icon, label, onClick, highlight }: { icon: React.ReactNode; label: string; onClick: () => void; highlight?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 px-2 py-1.5 rounded transition-colors ${highlight
        ? 'bg-litper-gold-500/10 text-litper-gold-500 hover:bg-litper-gold-500/20 border border-litper-gold-500/30'
        : 'bg-litper-navy-800/40 text-litper-cream-muted hover:text-litper-cream hover:bg-litper-navy-800/70 border border-litper-gold-500/10'}`}
    >
      {icon}
      <span className="truncate">{label}</span>
    </button>
  );
}

// ============================================================================
// COMANDO (1280×800) — workbench expandido
// ============================================================================
function ComandoBody(props: BodyProps) {
  const ronda = useRondaStore();
  const tc = timerColor(ronda.remainingSec, ronda.durationSec);

  return (
    <div className="relative z-10 flex-1 flex overflow-hidden">
      {/* Sidebar */}
      <aside className="w-48 border-r border-litper-gold-500/10 p-3 space-y-1 overflow-y-auto">
        {[
          'Rondas hoy', 'Equipo', 'Semáforo', 'Marketing', 'Inbox',
          'Knowledge', 'Reportes', 'Conexiones', 'Ajustes',
        ].map((label, i) => (
          <button
            key={label}
            className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-[11px] ${i === 0 ? 'bg-litper-gold-500/10 text-litper-gold-500' : 'text-litper-cream-muted hover:text-litper-cream hover:bg-litper-navy-800/50'}`}
            onClick={label === 'Conexiones' ? props.onConexiones : undefined}
          >
            <span>{label}</span>
            <ChevronRight size={10} />
          </button>
        ))}
      </aside>

      {/* Centro */}
      <main className="flex-1 p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-litper-cream-muted">
              Ronda #{ronda.rondaNumero} · {ronda.fechaActual}
            </div>
            <div className={`timer-display text-5xl ${tc.text} ${tc.pulse ? 'animate-pulse-red' : ''}`}>
              {formatTime(ronda.remainingSec)}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {ronda.state === 'running' ? (
              <button onClick={() => ronda.pauseTimer()} className="ghost-btn px-3 py-2 flex items-center gap-2">
                <Pause size={14} /> Pausa
              </button>
            ) : (
              <button onClick={() => ronda.state === 'paused' ? ronda.resumeTimer() : ronda.startTimer()} className="gold-btn px-4 py-2 flex items-center gap-2">
                <Play size={14} />
                {ronda.state === 'paused' ? 'Reanudar' : 'Iniciar'}
              </button>
            )}
            <button onClick={() => ronda.resetTimer()} className="ghost-btn p-2"><RotateCcw size={14} /></button>
          </div>
        </div>

        {/* Counters grid wider */}
        <div className="grid grid-cols-4 gap-2 mb-4">
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

        <div className="mb-4">
          <MetricasInline kpis={props.kpis} sparkValues={props.sparkValues} />
        </div>

        <div className="flex items-center gap-2">
          <button onClick={props.onSaveRonda} className="gold-btn px-4 py-2 flex items-center gap-2 text-sm">
            <Save size={14} /> Guardar ronda
          </button>
          <button onClick={props.onReiniciar} className="ghost-btn px-3 py-2 flex items-center gap-2 text-xs">
            <RefreshCw size={12} /> Reiniciar día
          </button>
          <button onClick={props.onExcel} className="ghost-btn px-3 py-2 flex items-center gap-2 text-xs">
            <Download size={12} /> Excel
          </button>
          <button onClick={props.onFinalizar} className="ghost-btn px-3 py-2 flex items-center gap-2 text-xs border border-litper-gold-500/30 text-litper-gold-500">
            <FileText size={12} /> Finalizar día
          </button>
        </div>
      </main>

      {/* Coach panel */}
      <aside className="w-64 border-l border-litper-gold-500/10 p-3 overflow-y-auto">
        <div className="space-y-3">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-litper-gold-500 mb-1">Coach IA</div>
            <div className="text-[11px] text-litper-cream-muted p-2 bg-litper-navy-800/40 rounded border border-litper-gold-500/10">
              Disponible en Sprint 3 — conectado a Anthropic SDK + brain backend.
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-litper-gold-500 mb-1">Top 5 ciudades 🚦</div>
            <div className="text-[11px] text-litper-cream-muted p-2 bg-litper-navy-800/40 rounded border border-litper-gold-500/10">
              Disponible en Sprint 1 — conectado a Supabase semáforo Realtime.
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-litper-gold-500 mb-1">Rondas hoy</div>
            <div className="text-[11px] text-litper-cream space-y-1">
              {useRondaStore.getState().rondasHoy.length === 0 ? (
                <div className="text-litper-cream-muted">Sin rondas guardadas todavía.</div>
              ) : (
                useRondaStore.getState().rondasHoy.slice(-5).reverse().map((r) => (
                  <div key={r.id} className="flex items-center justify-between px-2 py-1 bg-litper-navy-800/40 rounded">
                    <span>#{r.numero}</span>
                    <span className="font-mono">{r.counters.realizado}/{r.counters.iniciales}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
