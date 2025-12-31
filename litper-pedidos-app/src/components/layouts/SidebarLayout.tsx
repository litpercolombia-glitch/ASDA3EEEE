import React from 'react';
import { Download, RotateCcw, Settings, Minimize2, Square, X } from 'lucide-react';
import { useAppStore, calcularTotDevoluciones } from '../../stores/appStore';
import { PROCESO_GUIAS, PROCESO_NOVEDAD } from '../../config/processConfig';
import ProcessSelector from '../ProcessSelector';
import Timer from '../Timer';
import CounterButton from '../CounterButton';

const SidebarLayout: React.FC = () => {
  const {
    procesoActivo,
    contadoresGuias,
    contadoresNovedad,
    incrementarContador,
    decrementarContador,
    finalizarBloque,
    setMostrarModalExportar,
    usuarioActual,
    numeroBloqueHoy,
    ultimoAutoGuardado,
    toggleModoAdmin,
    modoAdmin,
  } = useAppStore();

  const proceso = procesoActivo === 'guias' ? PROCESO_GUIAS : PROCESO_NOVEDAD;
  const contadores = procesoActivo === 'guias' ? contadoresGuias : contadoresNovedad;

  const getValor = (campoId: string): number => {
    if (campoId === 'totDevoluciones' && procesoActivo === 'novedad') {
      return calcularTotDevoluciones(contadoresNovedad);
    }
    return (contadores as any)[campoId] || 0;
  };

  // Calcular total del día
  const totalHoy = procesoActivo === 'guias'
    ? contadoresGuias.realizado
    : contadoresNovedad.novedadesSolucionadas;

  return (
    <div className="h-screen flex flex-col bg-dark-900">
      {/* Barra superior con controles de ventana */}
      <div className="flex items-center justify-between px-3 py-2 bg-dark-800 border-b border-dark-700 drag-region">
        <div className="flex items-center gap-3 no-drag">
          <span className="text-sm font-bold text-primary-400">LITPER</span>
          <ProcessSelector compact />
        </div>

        <div className="flex items-center gap-3 no-drag">
          {/* Usuario */}
          {usuarioActual && (
            <div className="flex items-center gap-1">
              <span className="text-lg">{usuarioActual.avatar}</span>
              <span className="text-sm text-dark-300">{usuarioActual.nombre}</span>
            </div>
          )}

          {/* Timer compacto */}
          <Timer compact />

          {/* Botón exportar */}
          <button
            onClick={() => setMostrarModalExportar(true)}
            className="p-2 rounded-lg bg-green-600/20 text-green-400 hover:bg-green-600/30 transition-all"
            title="Exportar a Excel (E)"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Admin */}
          <button
            onClick={toggleModoAdmin}
            className={`p-2 rounded-lg transition-all ${
              modoAdmin ? 'bg-blue-600/20 text-blue-400' : 'bg-dark-700 text-dark-400'
            }`}
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Controles de ventana */}
          <div className="flex items-center gap-1 ml-2">
            <button className="p-1 rounded hover:bg-dark-700 text-dark-400">
              <Minimize2 className="w-4 h-4" />
            </button>
            <button className="p-1 rounded hover:bg-dark-700 text-dark-400">
              <Square className="w-3 h-3" />
            </button>
            <button className="p-1 rounded hover:bg-red-600/50 text-dark-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Contadores en línea */}
      <div className="flex items-center gap-2 px-3 py-2 bg-dark-800/50 overflow-x-auto">
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

        {/* Separador */}
        <div className="w-px h-6 bg-dark-600 mx-2" />

        {/* Botón reiniciar */}
        <button
          onClick={() => finalizarBloque()}
          className="flex items-center gap-1 px-3 py-1.5 bg-primary-600 hover:bg-primary-500 text-white rounded-lg font-medium text-sm transition-all"
        >
          <RotateCcw className="w-4 h-4" />
          Reiniciar
        </button>
      </div>

      {/* Barra inferior con info */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-dark-800 border-t border-dark-700 text-xs text-dark-400">
        <span>Bloque #{numeroBloqueHoy}</span>
        <span>Hoy: {totalHoy} {procesoActivo === 'guias' ? 'realizados' : 'solucionadas'}</span>
        <span className="flex items-center gap-1">
          {ultimoAutoGuardado && (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
              Auto-guardado
            </>
          )}
        </span>
      </div>
    </div>
  );
};

export default SidebarLayout;
