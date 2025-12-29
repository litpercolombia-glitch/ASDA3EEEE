import React from 'react';
import { Plus, Minus, Save } from 'lucide-react';
import { useAppStore, CAMPOS_CONTADOR, CampoContador } from '../stores/appStore';

interface QuickCountersProps {
  mode: 'compact' | 'normal' | 'sidebar';
}

const QuickCounters: React.FC<QuickCountersProps> = ({ mode }) => {
  const { contadores, incrementar, decrementar, guardarRonda, getTotalContadores, usuarioActual } = useAppStore();

  const total = getTotalContadores();

  // MODO COMPACTO - Solo botones con iniciales
  if (mode === 'compact') {
    return (
      <div className="px-2 py-2">
        {/* Total */}
        <div className="text-center mb-2">
          <span className="text-xs text-dark-400">Total: </span>
          <span className="text-sm font-bold text-white">{total}</span>
        </div>

        {/* Grid de botones */}
        <div className="grid grid-cols-6 gap-1 mb-2">
          {CAMPOS_CONTADOR.map((campo) => (
            <button
              key={campo.key}
              onClick={() => incrementar(campo.key as CampoContador)}
              className={`${campo.bgColor} hover:opacity-80 text-white text-xs font-bold rounded p-1 transition-all active:scale-95`}
              title={`${campo.label}: ${contadores[campo.key as CampoContador]}`}
            >
              {campo.inicial}
            </button>
          ))}
        </div>

        {/* Contadores */}
        <div className="grid grid-cols-6 gap-1 mb-2">
          {CAMPOS_CONTADOR.map((campo) => (
            <div
              key={`count-${campo.key}`}
              className="text-center text-xs font-mono text-dark-300"
            >
              {contadores[campo.key as CampoContador]}
            </div>
          ))}
        </div>

        {/* Botón guardar */}
        {usuarioActual && (
          <button
            onClick={guardarRonda}
            className="w-full py-1.5 bg-primary-500 hover:bg-primary-600 text-white text-xs font-medium rounded flex items-center justify-center gap-1 transition-all"
          >
            <Save className="w-3 h-3" />
            Guardar
          </button>
        )}
      </div>
    );
  }

  // MODO SIDEBAR - Vertical estrecho
  if (mode === 'sidebar') {
    return (
      <div className="flex flex-col gap-1 p-1">
        {/* Total */}
        <div className="text-center py-1 border-b border-dark-700">
          <span className="text-[10px] text-dark-500">Total</span>
          <div className="text-lg font-bold text-white">{total}</div>
        </div>

        {/* Campos */}
        {CAMPOS_CONTADOR.map((campo) => (
          <div key={campo.key} className="flex flex-col items-center">
            <span className="text-[10px] text-dark-500">{campo.inicial}</span>
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => decrementar(campo.key as CampoContador)}
                className="w-5 h-5 rounded bg-dark-700 hover:bg-dark-600 text-dark-400 hover:text-white flex items-center justify-center transition-all"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span
                className="w-6 text-center text-sm font-bold"
                style={{ color: campo.color }}
              >
                {contadores[campo.key as CampoContador]}
              </span>
              <button
                onClick={() => incrementar(campo.key as CampoContador)}
                className={`w-5 h-5 rounded ${campo.bgColor} hover:opacity-80 text-white flex items-center justify-center transition-all`}
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}

        {/* Guardar */}
        {usuarioActual && (
          <button
            onClick={guardarRonda}
            className="mt-1 p-2 bg-primary-500 hover:bg-primary-600 text-white rounded flex items-center justify-center transition-all"
            title="Guardar Ronda"
          >
            <Save className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  // MODO NORMAL - Completo con +/-
  return (
    <div className="px-4 py-3">
      {/* Header con total */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-dark-400">Contadores</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-dark-500">Total:</span>
          <span className="text-lg font-bold text-primary-400">{total}</span>
        </div>
      </div>

      {/* Grid de contadores */}
      <div className="space-y-2">
        {CAMPOS_CONTADOR.map((campo) => (
          <div
            key={campo.key}
            className="flex items-center justify-between bg-dark-800/50 rounded-lg px-3 py-2"
          >
            {/* Label */}
            <div className="flex items-center gap-2">
              <span
                className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold text-white"
                style={{ backgroundColor: campo.color }}
              >
                {campo.inicial}
              </span>
              <span className="text-sm text-dark-300">{campo.label}</span>
            </div>

            {/* Controles */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => decrementar(campo.key as CampoContador)}
                className="w-8 h-8 rounded-lg bg-dark-700 hover:bg-dark-600 text-dark-400 hover:text-white flex items-center justify-center transition-all active:scale-95"
              >
                <Minus className="w-4 h-4" />
              </button>

              <span
                className="w-12 text-center text-xl font-bold tabular-nums"
                style={{ color: campo.color }}
              >
                {contadores[campo.key as CampoContador]}
              </span>

              <button
                onClick={() => incrementar(campo.key as CampoContador)}
                className={`w-8 h-8 rounded-lg ${campo.bgColor} hover:opacity-80 text-white flex items-center justify-center transition-all active:scale-95`}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Botón guardar */}
      {usuarioActual && (
        <button
          onClick={guardarRonda}
          className="w-full mt-4 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          <Save className="w-5 h-5" />
          Guardar Ronda
        </button>
      )}
    </div>
  );
};

export default QuickCounters;
