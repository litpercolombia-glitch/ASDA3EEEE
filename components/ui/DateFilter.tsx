import React from 'react';
import { Calendar, Clock } from 'lucide-react';

export type FiltroFecha = 'hoy' | 'ayer' | '7dias' | '14dias' | '30dias' | 'todo';

interface DateFilterProps {
  value: FiltroFecha;
  onChange: (filtro: FiltroFecha) => void;
  showCount?: boolean;
  count?: number;
  className?: string;
  compact?: boolean;
}

interface FiltroConfig {
  fechaInicio: Date;
  fechaFin: Date;
}

// Funcion para calcular el rango de fechas
export function calcularRangoFecha(filtro: FiltroFecha): FiltroConfig {
  const hoy = new Date();
  hoy.setHours(23, 59, 59, 999);

  const inicio = new Date();
  inicio.setHours(0, 0, 0, 0);

  switch (filtro) {
    case 'hoy':
      return { fechaInicio: inicio, fechaFin: hoy };

    case 'ayer': {
      const ayer = new Date(inicio);
      ayer.setDate(ayer.getDate() - 1);
      const finAyer = new Date(ayer);
      finAyer.setHours(23, 59, 59, 999);
      return { fechaInicio: ayer, fechaFin: finAyer };
    }

    case '7dias': {
      const hace7 = new Date(inicio);
      hace7.setDate(hace7.getDate() - 7);
      return { fechaInicio: hace7, fechaFin: hoy };
    }

    case '14dias': {
      const hace14 = new Date(inicio);
      hace14.setDate(hace14.getDate() - 14);
      return { fechaInicio: hace14, fechaFin: hoy };
    }

    case '30dias': {
      const hace30 = new Date(inicio);
      hace30.setDate(hace30.getDate() - 30);
      return { fechaInicio: hace30, fechaFin: hoy };
    }

    case 'todo':
    default:
      return { fechaInicio: new Date(2020, 0, 1), fechaFin: hoy };
  }
}

// Funcion para formatear fecha para mostrar
export function formatearRangoFecha(filtro: FiltroFecha): string {
  const { fechaInicio, fechaFin } = calcularRangoFecha(filtro);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
    });
  };

  switch (filtro) {
    case 'hoy':
      return formatDate(fechaFin);
    case 'ayer':
      return formatDate(fechaInicio);
    default:
      return `${formatDate(fechaInicio)} - ${formatDate(fechaFin)}`;
  }
}

const opciones: { valor: FiltroFecha; label: string; shortLabel: string }[] = [
  { valor: 'hoy', label: 'Hoy', shortLabel: 'Hoy' },
  { valor: 'ayer', label: 'Ayer', shortLabel: 'Ayer' },
  { valor: '7dias', label: '7 dias', shortLabel: '7d' },
  { valor: '14dias', label: '14 dias', shortLabel: '14d' },
  { valor: '30dias', label: '30 dias', shortLabel: '30d' },
  { valor: 'todo', label: 'Todo', shortLabel: 'Todo' },
];

export const DateFilter: React.FC<DateFilterProps> = ({
  value,
  onChange,
  showCount = false,
  count = 0,
  className = '',
  compact = false,
}) => {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center gap-3 ${className}`}>
      {/* Label */}
      <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
        <Calendar className="w-4 h-4 text-slate-400" />
        <span>Periodo:</span>
      </div>

      {/* Opciones */}
      <div className="flex flex-wrap gap-1.5 bg-slate-100 dark:bg-navy-800 p-1 rounded-xl">
        {opciones.map((op) => (
          <button
            key={op.valor}
            onClick={() => onChange(op.valor)}
            className={`
              px-3 py-1.5 rounded-lg text-sm font-medium transition-all
              ${
                value === op.valor
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-navy-700'
              }
            `}
          >
            {compact ? op.shortLabel : op.label}
          </button>
        ))}
      </div>

      {/* Fecha mostrada */}
      <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <Clock className="w-3 h-3" />
        <span>{formatearRangoFecha(value)}</span>
      </div>

      {/* Contador */}
      {showCount && (
        <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium">
          <span>{count.toLocaleString()}</span>
          <span className="text-xs text-blue-500">registros</span>
        </div>
      )}
    </div>
  );
};

// Version compacta para espacios reducidos
export const DateFilterCompact: React.FC<{
  value: FiltroFecha;
  onChange: (filtro: FiltroFecha) => void;
}> = ({ value, onChange }) => {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as FiltroFecha)}
      className="px-3 py-2 text-sm border border-slate-200 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {opciones.map((op) => (
        <option key={op.valor} value={op.valor}>
          {op.label}
        </option>
      ))}
    </select>
  );
};

// Hook para usar con filtrado de datos
export function useDateFilter(initialValue: FiltroFecha = 'hoy') {
  const [filtro, setFiltro] = React.useState<FiltroFecha>(initialValue);
  const rango = calcularRangoFecha(filtro);

  const filtrarPorFecha = <T extends { fecha?: Date | string }>(
    datos: T[],
    campoFecha: keyof T = 'fecha' as keyof T
  ): T[] => {
    return datos.filter((item) => {
      const fecha = item[campoFecha];
      if (!fecha) return filtro === 'todo';

      const fechaItem = typeof fecha === 'string' ? new Date(fecha) : fecha;
      return fechaItem >= rango.fechaInicio && fechaItem <= rango.fechaFin;
    });
  };

  return {
    filtro,
    setFiltro,
    rango,
    filtrarPorFecha,
    formatoMostrar: formatearRangoFecha(filtro),
  };
}

export default DateFilter;
