/**
 * Sparkline — gráfico SVG minimalista de una serie de valores.
 * Sin libs externas (más liviano que recharts para uso simple).
 */
interface SparklineProps {
  values: number[];
  width?: number;
  height?: number;
  stroke?: string;
  fill?: string;
}

export function Sparkline({
  values,
  width = 80,
  height = 24,
  stroke = '#D4AF37',
  fill = 'rgba(212, 175, 55, 0.15)',
}: SparklineProps) {
  if (values.length === 0) {
    return <div className="text-[9px] text-litper-cream-muted">sin datos</div>;
  }
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const stepX = width / Math.max(values.length - 1, 1);
  const points = values
    .map((v, i) => `${(i * stepX).toFixed(1)},${(height - ((v - min) / range) * height).toFixed(1)}`)
    .join(' ');
  const area = `M0,${height} L${points} L${width},${height} Z`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden>
      <path d={area} fill={fill} />
      <polyline points={points} fill="none" stroke={stroke} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
