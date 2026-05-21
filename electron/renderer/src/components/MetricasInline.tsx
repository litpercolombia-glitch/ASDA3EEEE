import { TrendingUp, TrendingDown, Flame, Target, Gauge, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatCOP, semaforoColor, type KPIsDia } from '../stores/rondaStore';
import { Sparkline } from './Sparkline';

interface MetricasInlineProps {
  kpis: KPIsDia;
  sparkValues: number[];
  /** Layout vertical o horizontal */
  layout?: 'compact' | 'normal' | 'expanded';
}

export function MetricasInline({ kpis, sparkValues, layout = 'normal' }: MetricasInlineProps) {
  const semColor = semaforoColor(kpis.tasa);
  const tasaPct = (kpis.tasa * 100).toFixed(1);
  const tasaColorClass = {
    verde: 'text-semaforo-verde border-semaforo-verde/40',
    amarillo: 'text-semaforo-amarillo border-semaforo-amarillo/40',
    rojo: 'text-semaforo-rojo border-semaforo-rojo/40',
  }[semColor];

  const scoreColor = kpis.score >= 80 ? 'text-semaforo-verde' : kpis.score >= 60 ? 'text-semaforo-amarillo' : 'text-semaforo-rojo';
  const horasTrabajadas = (kpis.minutosTrabajados / 60).toFixed(1);
  const horasRestantes = (kpis.minutosRestantesJornada / 60).toFixed(1);

  return (
    <div className="space-y-1.5">
      {/* Fila 1: las 4 cards principales */}
      <div className="grid grid-cols-4 gap-1">
        <Card label="Tasa" icon={<Target size={10} />} className={tasaColorClass}>
          <div className="flex items-center gap-0.5">
            <span className="font-mono font-bold tabular-nums text-xs">{tasaPct}%</span>
            {kpis.cumpleMeta ? (
              <TrendingUp size={10} className="text-semaforo-verde" />
            ) : (
              <TrendingDown size={10} className="text-semaforo-rojo" />
            )}
          </div>
        </Card>

        <Card label="CPA" icon={<></>} className="text-litper-gold-500 border-litper-gold-500/30">
          <span className="font-mono font-bold tabular-nums text-xs">{formatCOP(kpis.cpaCOP)}</span>
        </Card>

        <Card label="Score" icon={<Gauge size={10} />} className={`${scoreColor} border-current/30`}>
          <motion.span
            className="font-mono font-bold tabular-nums text-xs"
            key={Math.round(kpis.score)}
            initial={{ scale: 1.3 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 14 }}
          >
            {kpis.score.toFixed(0)}
          </motion.span>
        </Card>

        <Card
          label="Racha"
          icon={<Flame size={10} className={kpis.rachaActual >= 3 ? 'text-orange-400' : 'text-litper-cream-muted'} />}
          className="text-litper-cream border-litper-gold-500/20"
        >
          <span className="font-mono font-bold tabular-nums text-xs">{kpis.rachaActual}d</span>
        </Card>
      </div>

      {/* Fila 2: totales del día */}
      {layout !== 'compact' && (
        <div className="px-2 py-1 rounded-lg bg-litper-navy-800/40 border border-litper-gold-500/10 text-[10px] text-litper-cream/85 flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span><span className="text-semaforo-verde font-mono font-bold">{kpis.totalRealizado}</span> realizados</span>
          <span className="text-litper-cream-muted">·</span>
          <span><span className="text-litper-gold-500 font-mono font-bold">{kpis.totalRondas}</span> rondas</span>
          <span className="text-litper-cream-muted">·</span>
          <span><span className="text-litper-gold-500 font-mono font-bold">{kpis.totalPendientes}</span> pendientes</span>
          {kpis.totalNovedades > 0 && (
            <>
              <span className="text-litper-cream-muted">·</span>
              <span><span className="text-sky-400 font-mono font-bold">{kpis.totalNovedades}</span> novedades</span>
            </>
          )}
        </div>
      )}

      {/* Fila 3: velocidad + estimación */}
      {layout === 'expanded' && (
        <div className="px-2 py-1 rounded-lg bg-litper-navy-800/40 border border-litper-gold-500/10 text-[10px] text-litper-cream/85 flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <Zap size={9} className="text-litper-gold-500" />
          <span><span className="font-mono font-bold text-litper-gold-500">{kpis.velocidadPedPorMin.toFixed(2)}</span> ped/min</span>
          <span className="text-litper-cream-muted">·</span>
          <span>~<span className="font-mono font-bold">{Math.round(kpis.estimacionCierre)}</span> al cierre</span>
          <span className="text-litper-cream-muted">·</span>
          <span><span className="font-mono">{horasTrabajadas}h</span> / {horasRestantes}h restantes</span>
          {kpis.bestHour && (
            <>
              <span className="text-litper-cream-muted">·</span>
              <span>mejor: <span className="font-mono font-bold">{kpis.bestHour}</span></span>
            </>
          )}
        </div>
      )}

      {/* Sparkline */}
      {sparkValues.length > 0 && layout !== 'compact' && (
        <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-litper-navy-800/40 border border-litper-gold-500/10">
          <span className="text-[9px] uppercase tracking-wider text-litper-cream-muted">últimas rondas</span>
          <div className="flex-1" />
          <Sparkline values={sparkValues.slice(-12)} width={120} height={18} />
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
    <div className={`flex flex-col gap-0.5 px-1.5 py-1 rounded bg-litper-navy-800/50 border ${className}`}>
      <div className="flex items-center gap-0.5 text-[8px] uppercase tracking-wider text-litper-cream-muted">
        {icon}
        <span>{label}</span>
      </div>
      <div>{children}</div>
    </div>
  );
}
