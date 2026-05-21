import { Minimize2, LayoutGrid, Maximize2, Square } from 'lucide-react';
import { motion } from 'framer-motion';
import { useUIStore, type WindowMode } from '../stores/uiStore';

const MODES: Array<{ mode: WindowMode; icon: React.ComponentType<{ size?: number }>; title: string; shortcut: string }> = [
  { mode: 'micro', icon: Square, title: 'Micro', shortcut: 'Ctrl+Shift+1' },
  { mode: 'mini', icon: Minimize2, title: 'Mini', shortcut: 'Ctrl+Shift+2' },
  { mode: 'halo', icon: LayoutGrid, title: 'Halo', shortcut: 'Ctrl+Shift+3' },
  { mode: 'comando', icon: Maximize2, title: 'Comando', shortcut: 'Ctrl+Shift+4' },
];

export function ModeBar() {
  const mode = useUIStore((s) => s.mode);
  const setMode = useUIStore((s) => s.setMode);

  return (
    <div className="app-no-drag flex items-center gap-0.5 px-1 py-0.5 rounded-md bg-litper-navy-800/50 border border-litper-gold-500/10">
      {MODES.map((m) => {
        const Icon = m.icon;
        const active = mode === m.mode;
        return (
          <button
            key={m.mode}
            onClick={() => setMode(m.mode)}
            className={`relative p-1 rounded transition-colors ${active ? 'text-litper-gold-500' : 'text-litper-cream-muted hover:text-litper-cream'}`}
            title={`${m.title} (${m.shortcut})`}
            aria-label={m.title}
          >
            {active && (
              <motion.div
                layoutId="mode-pill"
                className="absolute inset-0 bg-litper-gold-500/15 rounded"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
            <Icon size={11} />
          </button>
        );
      })}
    </div>
  );
}
