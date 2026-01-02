import React from 'react';
import { X, Download, Clock, Package } from 'lucide-react';
import { useAppStore, calcularTotDevoluciones, Bloque } from '../stores/appStore';
import { exportarBloque, exportarTodo } from '../utils/excelExport';

interface BlocksModalProps {
  onClose: () => void;
}

const BlocksModal: React.FC<BlocksModalProps> = ({ onClose }) => {
  const { getBloquesHoy } = useAppStore();
  const bloquesHoy = getBloquesHoy().reverse();

  const formatDuracion = (segundos: number): string => {
    const mins = Math.floor(segundos / 60);
    return `${mins}m`;
  };

  const renderBloqueGuias = (bloque: Bloque) => {
    const c = bloque.contadoresGuias!;
    return (
      <div className="flex items-center gap-2 text-xs flex-wrap">
        <span className="text-green-400">✓{c.realizado}</span>
        <span className="text-red-400">✗{c.cancelados}</span>
        <span className="text-blue-400">📅{c.agendados}</span>
        <span className="text-orange-400">⚠{c.dificiles}</span>
        <span className="text-yellow-400">⏳{c.pedidoPendiente}</span>
        <span className="text-purple-400">👁{c.revisado}</span>
      </div>
    );
  };

  const renderBloqueNovedad = (bloque: Bloque) => {
    const c = bloque.contadoresNovedad!;
    const tot = calcularTotDevoluciones(c);
    return (
      <div className="flex items-center gap-2 text-xs flex-wrap">
        <span className="text-blue-400">📋{c.novedadesIniciales}</span>
        <span className="text-green-400">✅{c.novedadesSolucionadas}</span>
        <span className="text-purple-400">👁{c.novedadesRevisadas}</span>
        <span className="text-yellow-400">⏳{c.novedadesFinalePendientes}</span>
        <span className="text-pink-400">📊{tot}</span>
      </div>
    );
  };

  const handleExportarTodo = () => {
    if (bloquesHoy.length > 0) {
      exportarTodo(bloquesHoy);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-dark-800 rounded-xl w-[340px] max-h-[400px] shadow-2xl border border-dark-700 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-dark-700">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-primary-400" />
            <h3 className="text-base font-semibold text-white">Bloques de Hoy</h3>
            <span className="text-xs bg-dark-700 px-2 py-0.5 rounded-full text-dark-300">
              {bloquesHoy.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-dark-700 text-dark-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lista de bloques */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {bloquesHoy.length === 0 ? (
            <div className="text-center py-8 text-dark-500">
              <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No hay bloques aún</p>
              <p className="text-xs">Presiona REINICIAR para crear uno</p>
            </div>
          ) : (
            bloquesHoy.map((bloque, index) => (
              <div
                key={bloque.id}
                className="bg-dark-700/50 rounded-lg p-3"
                style={{
                  borderLeft: `3px solid ${bloque.tipoProceso === 'guias' ? '#F97316' : '#3B82F6'}`,
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">
                      #{bloquesHoy.length - index}
                    </span>
                    <span>{bloque.tipoProceso === 'guias' ? '📦' : '📋'}</span>
                    <span className="text-xs text-dark-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {bloque.horaInicio}-{bloque.horaFin}
                    </span>
                  </div>
                  <button
                    onClick={() => exportarBloque(bloque)}
                    className="p-1.5 rounded hover:bg-dark-600 text-dark-400 hover:text-green-400 transition-colors"
                    title="Exportar bloque"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>

                {bloque.tipoProceso === 'guias'
                  ? renderBloqueGuias(bloque)
                  : renderBloqueNovedad(bloque)}

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-dark-600 text-xs text-dark-400">
                  <span>{formatDuracion(bloque.tiempoTotal)}</span>
                  <span>{bloque.promedioMinuto}/min</span>
                  {bloque.porcentajeExito !== undefined && (
                    <span className="text-green-400">{bloque.porcentajeExito}%</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-dark-700 flex gap-2">
          <button
            onClick={handleExportarTodo}
            disabled={bloquesHoy.length === 0}
            className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-600 hover:bg-green-500 disabled:bg-dark-600 disabled:text-dark-400 text-white font-medium rounded-lg transition-all"
          >
            <Download className="w-4 h-4" />
            Exportar Todo
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-dark-700 hover:bg-dark-600 text-white rounded-lg transition-all"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default BlocksModal;
