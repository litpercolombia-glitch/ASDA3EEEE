import React from 'react';
import { useAppStore, calcularTotDevoluciones } from '../stores/appStore';
import { PROCESO_GUIAS, PROCESO_NOVEDAD } from '../config/processConfig';
import CounterButton from './CounterButton';

interface QuickCountersProps {
  compact?: boolean;
  showGroups?: boolean;
}

const QuickCounters: React.FC<QuickCountersProps> = ({ compact = false, showGroups = true }) => {
  const {
    procesoActivo,
    contadoresGuias,
    contadoresNovedad,
    incrementarContador,
    decrementarContador,
  } = useAppStore();

  const proceso = procesoActivo === 'guias' ? PROCESO_GUIAS : PROCESO_NOVEDAD;
  const contadores = procesoActivo === 'guias' ? contadoresGuias : contadoresNovedad;

  const getValor = (campoId: string): number => {
    if (campoId === 'totDevoluciones' && procesoActivo === 'novedad') {
      return calcularTotDevoluciones(contadoresNovedad);
    }
    return (contadores as any)[campoId] || 0;
  };

  if (compact) {
    return (
      <div className="flex items-center gap-3 flex-wrap">
        {proceso.campos.map((campo) => (
          <CounterButton
            key={campo.id}
            id={campo.id}
            label={campo.label}
            labelCorto={campo.labelCorto}
            icono={campo.icono}
            color={campo.color}
            valor={getValor(campo.id)}
            esCalculado={campo.esCalculado}
            compact={true}
            onIncrement={incrementarContador}
            onDecrement={decrementarContador}
          />
        ))}
      </div>
    );
  }

  // Vista con grupos (para Novedad)
  if (showGroups && proceso.grupos) {
    return (
      <div className="space-y-3">
        {proceso.grupos.map((grupo) => (
          <div key={grupo} className="space-y-1">
            <h4 className="text-xs font-semibold text-dark-400 uppercase tracking-wider px-1">
              {grupo}
            </h4>
            <div className="space-y-1">
              {proceso.campos
                .filter((campo) => campo.grupo === grupo)
                .map((campo) => (
                  <CounterButton
                    key={campo.id}
                    id={campo.id}
                    label={campo.label}
                    labelCorto={campo.labelCorto}
                    icono={campo.icono}
                    color={campo.color}
                    valor={getValor(campo.id)}
                    esCalculado={campo.esCalculado}
                    onIncrement={incrementarContador}
                    onDecrement={decrementarContador}
                  />
                ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Vista simple (para Guías)
  return (
    <div className="space-y-1">
      {proceso.campos.map((campo) => (
        <CounterButton
          key={campo.id}
          id={campo.id}
          label={campo.label}
          labelCorto={campo.labelCorto}
          icono={campo.icono}
          color={campo.color}
          valor={getValor(campo.id)}
          esCalculado={campo.esCalculado}
          onIncrement={incrementarContador}
          onDecrement={decrementarContador}
        />
      ))}
    </div>
  );
};

export default QuickCounters;
