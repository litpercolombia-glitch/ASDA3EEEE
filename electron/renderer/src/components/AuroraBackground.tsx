import { motion } from 'framer-motion';

/**
 * AuroraBackground — fondo animado de gradientes que se mueven suavemente.
 * Intensidad reactiva al estado del semaforo (mas vivo si rojo).
 */
export function AuroraBackground({ semaforo }: { semaforo: 'verde' | 'amarillo' | 'rojo' }) {
  const intensity = semaforo === 'rojo' ? 0.55 : semaforo === 'amarillo' ? 0.4 : 0.3;
  const hue = semaforo === 'rojo' ? '#C0392B' : semaforo === 'amarillo' ? '#F4C842' : '#1F2A5C';

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-panel">
      <motion.div
        className="absolute -top-40 -left-40 h-80 w-80 rounded-full blur-3xl"
        style={{ background: `radial-gradient(circle, ${hue} 0%, transparent 70%)`, opacity: intensity }}
        animate={{ x: [0, 80, -20, 0], y: [0, -30, 40, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full blur-3xl"
        style={{ background: `radial-gradient(circle, #D4AF37 0%, transparent 70%)`, opacity: 0.22 }}
        animate={{ x: [0, -60, 30, 0], y: [0, 40, -20, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, #38BDF8 0%, transparent 70%)', opacity: 0.12 }}
        animate={{ scale: [1, 1.2, 0.9, 1] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}
