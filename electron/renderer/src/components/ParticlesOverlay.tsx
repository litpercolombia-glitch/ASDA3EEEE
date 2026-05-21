import { motion } from 'framer-motion';
import { useMemo } from 'react';

/**
 * ParticlesOverlay — partículas doradas flotantes; solo se renderiza
 * cuando el timer entra en zona roja (<10% restante).
 */
export function ParticlesOverlay({ active }: { active: boolean }) {
  const particles = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 2 + Math.random() * 4,
        duration: 4 + Math.random() * 6,
        delay: Math.random() * 2,
      })),
    [],
  );

  if (!active) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-panel">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-litper-gold-400"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, boxShadow: '0 0 8px rgba(244, 200, 66, 0.8)' }}
          animate={{ y: [0, -50, 0], opacity: [0, 1, 0] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}
