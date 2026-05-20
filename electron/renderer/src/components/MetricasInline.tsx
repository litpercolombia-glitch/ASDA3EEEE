import { TrendingUp, TrendingDown, Flame, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatCOP, semaforoColor, type KPIsDia } from '../stores/rondaStore';
import { Sparkline } from './Sparkline';

interface MetricasInlineProps {
  kpis: KPIsDia;
  sparkValues: number[]; // realizado por ronda para el sparkline
}

export function MetricasInline({ kpis, sparkValues }: MetricasInlineProps) {
  const semColor = semaforoColor(kpis.tasa);
  const tasaPct = (kpis.tasa * 100).toFixed(1);
  const colorClass = {
    verde: 'text-semaforo-verde border-semaforo-verde/40',
    amarillo: 'text-semaforo-amarillo border-semaforo-amarillo/40',
    rojo: 'text-semaforo-rojo border-semaforo-rojo/40',
  }[semColor];

  return (
    <div className="grid grid-cols-3 gap-1.5">
      <Card label="Tasa" icon={<Target size={11} />} className={colorClass}>
        <div className="flex items-center gap-1">
          <span className="font-mono font-bold tabular-nums">{tasaPct}%</span>
          {kpis.cumpleMeta ? <TrendingUp size={11} className="text-semaforo-verde" /> : <TrendingDown size={11} className="text-semaforo-rojo" />}
        </div>
      </Card>

      <Card label="CPA" icon={<></>} className="text-litper-gold-500 border-litper-gold-500/30">
        <span className="font-mono font-bold tabular-nums text-sm">{formatCOP(kpis.cpaCOP)}</span>
      </Card>

      <Card
        label="Racha"
        icon={<Flame size={11} className={kpis.rachaActual >= 3 ? 'text-orange-400' : 'text-litper-cream-muted'} />}
        className="text-litper-cream border-litper-gold-500/20"
      >
        <div className="flex items-center gap-1">
          <motion.span
            className="font-mono font-bold tabular-nums"
            key={kpis.rachaActual}
            initial={{ scale: 1.4 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 12 }}
          >
            {kpis.rachaActual}
          </motion.span>
          <span className="text-[9px] text-litper-cream-muted">días</span>
        </div>
      </Card>

      {sparkValues.length > 0 && (
        <div className="col-span-3 flex items-center gap-2 px-2 py-1.5 rounded-lg bg-litper-navy-800/40 border border-litper-gold-500/10">
          <span className="text-[9px] uppercase tracking-wider text-litper-cream-muted">últimas rondas</span>
          <div className="flex-1" />
          <Sparkline values={sparkValues.slice(-12)} width={120} height={20} />
        </div>
      )}
    </div>
  );
}

interface CardProps {
  label: string;
  icon: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

function Card({ label, icon, className = '', children }: CardProps) {
  return (
    <div className={`flex flex-col gap-0.5 px-2 py-1.5 rounded-lg bg-litper-navy-800/50 border ${className}`}>
      <div className="flex items-center gap-1 text-[9px] uppercase tracking-wider text-litper-cream-muted">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-sm">{children}</div>
    </div>
  );
}
