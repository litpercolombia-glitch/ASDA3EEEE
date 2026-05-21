/**
 * NovedadPopup — selector de sub-tipo de novedad con 1-tap.
 * Aparece cuando el operador presiona "+1" en el contador Novedades.
 * Objetivo: <5s para registrar.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { NOVEDAD_CATALOGO, type TipoNovedad } from '../stores/novedadesStore';

interface NovedadPopupProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: { tipo: TipoNovedad; pedidoRef?: string; nota?: string }) => void;
}

export function NovedadPopup({ open, onClose, onSubmit }: NovedadPopupProps) {
  const [tipo, setTipo] = useState<TipoNovedad | null>(null);
  const [pedidoRef, setPedidoRef] = useState('');
  const [nota, setNota] = useState('');

  function handleSelect(t: TipoNovedad) {
    setTipo(t);
    // Auto-submit si no quiere agregar ref/nota
    if (!pedidoRef && !nota) {
      onSubmit({ tipo: t });
      reset();
    }
  }

  function handleSubmit() {
    if (!tipo) return;
    onSubmit({
      tipo,
      pedidoRef: pedidoRef.trim() || undefined,
      nota: nota.trim() || undefined,
    });
    reset();
  }

  function reset() {
    setTipo(null);
    setPedidoRef('');
    setNota('');
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-litper-navy-950/80 backdrop-blur-md p-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={reset}
        >
          <motion.div
            className="halo-panel w-full max-w-sm overflow-hidden"
            initial={{ scale: 0.85, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.85, y: 20 }}
            transition={{ type: 'spring', stiffness: 360, damping: 24 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-litper-gold-500/15">
              <span className="text-lg">🆕</span>
              <h2 className="font-brand text-sm text-litper-gold-500 flex-1">Nueva novedad</h2>
              <button onClick={reset} className="ghost-btn p-1" aria-label="Cerrar">
                <X size={12} />
              </button>
            </div>

            {/* Grid de sub-tipos */}
            <div className="p-2 grid grid-cols-2 gap-1.5">
              {NOVEDAD_CATALOGO.map((cat) => (
                <button
                  key={cat.tipo}
                  onClick={() => handleSelect(cat.tipo)}
                  className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[11px] border transition-all
                    ${tipo === cat.tipo
                      ? 'border-litper-gold-500/60 bg-litper-gold-500/10 text-litper-cream scale-[1.02]'
                      : 'border-litper-gold-500/10 bg-litper-navy-800/40 text-litper-cream-muted hover:border-litper-gold-500/30 hover:text-litper-cream'}
                  `}
                  style={tipo === cat.tipo ? { borderColor: cat.color } : undefined}
                >
                  <span className="text-sm">{cat.emoji}</span>
                  <span className="truncate">{cat.label}</span>
                </button>
              ))}
            </div>

            {/* Ref + nota opcionales */}
            <div className="px-3 pb-2 space-y-1.5">
              <input
                type="text"
                placeholder="Pedido # (opcional)"
                value={pedidoRef}
                onChange={(e) => setPedidoRef(e.target.value)}
                className="w-full px-2 py-1 text-[11px] bg-litper-navy-800/70 border border-litper-gold-500/15
                           rounded text-litper-cream placeholder-litper-cream-muted/50
                           focus:outline-none focus:border-litper-gold-500/60"
              />
              <input
                type="text"
                placeholder="Nota (opcional)"
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && tipo && handleSubmit()}
                className="w-full px-2 py-1 text-[11px] bg-litper-navy-800/70 border border-litper-gold-500/15
                           rounded text-litper-cream placeholder-litper-cream-muted/50
                           focus:outline-none focus:border-litper-gold-500/60"
              />
            </div>

            {/* Footer */}
            <div className="flex items-center gap-1 px-3 py-2 border-t border-litper-gold-500/15">
              <span className="flex-1 text-[10px] text-litper-cream-muted">
                {tipo ? '✓ Listo. Enter para guardar.' : 'Click 1 vez para guardar rápido.'}
              </span>
              <button onClick={reset} className="ghost-btn px-2 py-1 text-[10px]">Cancelar</button>
              <button
                onClick={handleSubmit}
                disabled={!tipo}
                className="gold-btn px-3 py-1 text-[11px] disabled:opacity-40"
              >
                Guardar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
