import { Crown } from 'lucide-react';

/**
 * Logo placeholder de LITPER (LP + corona en oro).
 * Cuando llegue el .ico/.png oficial generado por Canva, este componente
 * se reemplaza por <img src="/icon-32.png" />.
 */
export function LitperLogo({ size = 24 }: { size?: number }) {
  return (
    <div
      className="relative inline-flex items-center justify-center font-brand font-bold text-litper-gold-500"
      style={{ width: size, height: size }}
      aria-label="LITPER"
    >
      <Crown
        size={size * 0.55}
        className="absolute -top-0.5 left-1/2 -translate-x-1/2 fill-litper-gold-500 stroke-litper-gold-600"
        strokeWidth={1.5}
      />
      <span style={{ fontSize: size * 0.48, letterSpacing: '-0.05em' }} className="mt-1">
        LP
      </span>
    </div>
  );
}
