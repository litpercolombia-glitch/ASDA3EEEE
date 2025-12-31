import React, { useState } from 'react';
import { Package, Clock, Download, Sunrise, Trash2 } from 'lucide-react';
import { useAppStore, calcularTotDevoluciones, Bloque } from '../stores/appStore';
import { exportarBloque } from '../utils/excelExport';

const BlocksPanel: React.FC = () => {
  const { getBloquesHoy, iniciarNuevoDia, procesoActivo } = useAppStore();
  const [confirmNuevoDia, setConfirmNuevoDia] = useState(false);

  const bloquesHoy = getBloquesHoy().reverse(); // Más reciente primero

  const handleNuevoDia = () => {
    if (confirmNuevoDia) {
      iniciarNuevoDia();
      setConfirmNuevoDia(false);
    } else {
      setConfirmNuevoDia(true);
      setTimeout(() => setConfirmNuevoDia(false), 3000);
    }
  };

  const formatDuracion = (segundos: number): string => {
    const mins = Math.floor(segundos / 60);
    return `${mins} min`;
  };

  const renderBloqueGuias = (bloque: Bloque) => {
    const c = bloque.contadoresGuias!;
    return (
      <div className="flex items-center gap-2 text-xs">
        <span className="text-green-400">✓{c.realizado}</span>
        <span className="text-red-400">✗{c.cancelados}</span>
        <span className="text-blue-400">📅{c.agendados}</span>
        <span className="text-orange-400">⚠️{c.dificiles}</span>
        <span className="text-yellow-400">⏳{c.pedidoPendiente}</span>
        <span className="text-purple-400">👁️{c.revisado}</span>
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
        <span className="text-purple-400">👁️{c.novedadesRevisadas}</span>
        <span className="text-yellow-400">⏳{c.novedadesFinalePendientes}</span>
        <span className="text-pink-400">📊{tot}</span>
      </div>
    );
  };

  return (
    <div className="px-4 py-3 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Package className="w-4 h-4 text-primary-400" />
          Bloques de hoy
        </h3>
        <span className="text-xs text-dark-400">
          {bloquesHoy.length} bloques
        </span>
      </div>

      {/* Lista de bloques */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {bloquesHoy.length === 0 ? (
          <div className="text-center py-8 text-dark-500">
            <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No hay bloques aún</p>
            <p className="text-xs">Presiona reiniciar para crear uno</p>
          </div>
        ) : (
          bloquesHoy.map((bloque, index) => (
            <div
              key={bloque.id}
              className="bg-dark-700/50 rounded-lg p-3 border-l-2"
              style={{
                borderColor: bloque.tipoProceso === 'guias' ? '#F97316' : '#3B82F6',
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">
                    Bloque #{bloquesHoy.length - index}
                  </span>
                  <span className="text-lg">
                    {bloque.tipoProceso === 'guias' ? '📦' : '📋'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-dark-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {bloque.horaInicio} - {bloque.horaFin}
                  </span>
                  <button
                    onClick={() => exportarBloque(bloque)}
                    className="p-1 rounded hover:bg-dark-600 text-dark-400 hover:text-green-400 transition-colors"
                    title="Exportar bloque"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {bloque.tipoProceso === 'guias'
                ? renderBloqueGuias(bloque)
                : renderBloqueNovedad(bloque)}

              <div className="flex items-center justify-between mt-2 pt-2 border-t border-dark-600">
                <span className="text-xs text-dark-400">
                  {formatDuracion(bloque.tiempoTotal)}
                </span>
                <span className="text-xs text-dark-400">
                  {bloque.promedioMinuto}/min
                </span>
                {bloque.porcentajeExito !== undefined && (
                  <span className="text-xs text-green-400">
                    {bloque.porcentajeExito}% éxito
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Botón Nuevo Día */}
      <button
        onClick={handleNuevoDia}
        className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${
          confirmNuevoDia
            ? 'bg-red-600 hover:bg-red-500 text-white'
            : 'bg-dark-700 hover:bg-dark-600 text-dark-300 hover:text-white'
        }`}
      >
        <Sunrise className="w-5 h-5" />
        {confirmNuevoDia ? 'Confirmar nuevo día' : 'Iniciar nuevo día'}
      </button>
    </div>
  );
};

export default BlocksPanel;
