import React from 'react';
import { Download, RotateCcw, X } from 'lucide-react';
import { useAppStore, calcularTotDevoluciones } from '../../stores/appStore';
import { PROCESO_GUIAS, PROCESO_NOVEDAD } from '../../config/processConfig';
import Timer from '../Timer';

const CompactLayout: React.FC = () => {
  const {
    procesoActivo,
    contadoresGuias,
    contadoresNovedad,
    incrementarContador,
    decrementarContador,
    finalizarBloque,
    setMostrarModalExportar,
    setProcesoActivo,
  } = useAppStore();

  const proceso = procesoActivo === 'guias' ? PROCESO_GUIAS : PROCESO_NOVEDAD;
  const contadores = procesoActivo === 'guias' ? contadoresGuias : contadoresNovedad;

  const getValor = (campoId: string): number => {
    if (campoId === 'totDevoluciones' && procesoActivo === 'novedad') {
      return calcularTotDevoluciones(contadoresNovedad);
    }
    return (contadores as any)[campoId] || 0;
  };

  return (
    <div className="h-screen flex items-center bg-dark-900 px-3 drag-region">
      {/* Proceso */}
      <button
        onClick={() => setProcesoActivo(procesoActivo === 'guias' ? 'novedad' : 'guias')}
        className="text-lg mr-2 no-drag"
      >
        {proceso.icono}
      </button>

      {/* Timer */}
      <div className="mr-3 no-drag">
        <Timer compact />
      </div>

      {/* Contadores */}
      <div className="flex items-center gap-2 flex-1 overflow-x-auto no-drag">
        {proceso.campos.slice(0, 6).map((campo) => {
          const valor = getValor(campo.id);
          return (
            <div
              key={campo.id}
              className="flex items-center gap-0.5 text-xs"
              title={campo.label}
            >
              <span style={{ color: campo.color }}>{campo.icono}</span>
              <span className="font-bold text-white tabular-nums">{valor}</span>
              {!campo.esCalculado && (
                <div className="flex flex-col gap-0.5 ml-0.5">
                  <button
                    onClick={() => incrementarContador(campo.id)}
                    className="w-4 h-3 rounded bg-dark-700 hover:bg-green-600/30 text-[8px] text-green-400"
                  >
                    +
                  </button>
                  <button
                    onClick={() => decrementarContador(campo.id)}
                    disabled={valor <= 0}
                    className="w-4 h-3 rounded bg-dark-700 hover:bg-red-600/30 text-[8px] text-red-400 disabled:opacity-30"
                  >
                    -
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-1 ml-2 no-drag">
        <button
          onClick={() => finalizarBloque()}
          className="p-1.5 rounded bg-primary-600 hover:bg-primary-500 text-white transition-all"
          title="Reiniciar (R)"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <button
          onClick={() => setMostrarModalExportar(true)}
          className="p-1.5 rounded bg-green-600/20 text-green-400 hover:bg-green-600/30 transition-all"
          title="Exportar (E)"
        >
          <Download className="w-4 h-4" />
        </button>
        <button className="p-1.5 rounded hover:bg-red-600/50 text-dark-400 hover:text-white transition-all">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default CompactLayout;
