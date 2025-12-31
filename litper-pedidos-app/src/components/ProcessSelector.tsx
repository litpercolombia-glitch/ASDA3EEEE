import React from 'react';
import { useAppStore } from '../stores/appStore';
import { PROCESO_GUIAS, PROCESO_NOVEDAD, TipoProceso } from '../config/processConfig';

interface ProcessSelectorProps {
  compact?: boolean;
}

const ProcessSelector: React.FC<ProcessSelectorProps> = ({ compact = false }) => {
  const { procesoActivo, setProcesoActivo } = useAppStore();

  const procesos = [PROCESO_GUIAS, PROCESO_NOVEDAD];

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {procesos.map((p) => (
          <button
            key={p.id}
            onClick={() => setProcesoActivo(p.id)}
            className={`px-2 py-1 rounded text-sm font-medium transition-all ${
              procesoActivo === p.id
                ? 'bg-primary-500 text-white'
                : 'bg-dark-700 text-dark-400 hover:text-white'
            }`}
          >
            {p.icono}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex bg-dark-800/50 rounded-lg p-1">
      {procesos.map((p) => (
        <button
          key={p.id}
          onClick={() => setProcesoActivo(p.id)}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all no-drag ${
            procesoActivo === p.id
              ? 'bg-primary-500 text-white shadow-lg'
              : 'text-dark-400 hover:text-white hover:bg-dark-700'
          }`}
        >
          <span>{p.icono}</span>
          <span>{p.nombre}</span>
        </button>
      ))}
    </div>
  );
};

export default ProcessSelector;
