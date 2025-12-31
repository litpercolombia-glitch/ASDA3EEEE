import React from 'react';
import { BarChart3, TrendingUp, Clock, Target, Package, CheckCircle } from 'lucide-react';
import { useAppStore, COLORES_USUARIO, calcularTotDevoluciones } from '../stores/appStore';

const StatsPanel: React.FC = () => {
  const { usuarios, getBloquesHoy, procesoActivo } = useAppStore();

  const bloquesHoy = getBloquesHoy();
  const bloquesProceso = bloquesHoy.filter(b => b.tipoProceso === procesoActivo);

  // Stats para Guías
  const statsGuias = bloquesHoy
    .filter(b => b.tipoProceso === 'guias')
    .reduce((acc, b) => {
      const c = b.contadoresGuias!;
      return {
        realizado: acc.realizado + c.realizado,
        cancelados: acc.cancelados + c.cancelados,
        agendados: acc.agendados + c.agendados,
        dificiles: acc.dificiles + c.dificiles,
        pedidoPendiente: acc.pedidoPendiente + c.pedidoPendiente,
        revisado: acc.revisado + c.revisado,
      };
    }, { realizado: 0, cancelados: 0, agendados: 0, dificiles: 0, pedidoPendiente: 0, revisado: 0 });

  // Stats para Novedad
  const statsNovedad = bloquesHoy
    .filter(b => b.tipoProceso === 'novedad')
    .reduce((acc, b) => {
      const c = b.contadoresNovedad!;
      return {
        novedadesIniciales: acc.novedadesIniciales + c.novedadesIniciales,
        novedadesSolucionadas: acc.novedadesSolucionadas + c.novedadesSolucionadas,
        novedadesRevisadas: acc.novedadesRevisadas + c.novedadesRevisadas,
        novedadesFinalePendientes: acc.novedadesFinalePendientes + c.novedadesFinalePendientes,
        devolucionLitper: acc.devolucionLitper + c.devolucionLitper,
        devolucion3Intentos: acc.devolucion3Intentos + c.devolucion3Intentos,
        devolucionErrorTransportadora: acc.devolucionErrorTransportadora + c.devolucionErrorTransportadora,
        devolucionProveedor: acc.devolucionProveedor + c.devolucionProveedor,
      };
    }, {
      novedadesIniciales: 0,
      novedadesSolucionadas: 0,
      novedadesRevisadas: 0,
      novedadesFinalePendientes: 0,
      devolucionLitper: 0,
      devolucion3Intentos: 0,
      devolucionErrorTransportadora: 0,
      devolucionProveedor: 0,
    });

  const totDevoluciones = calcularTotDevoluciones(statsNovedad);
  const porcentajeExito = statsGuias.realizado + statsGuias.cancelados > 0
    ? Math.round((statsGuias.realizado / (statsGuias.realizado + statsGuias.cancelados)) * 100)
    : 0;
  const porcentajeSolucionado = statsNovedad.novedadesIniciales > 0
    ? Math.round((statsNovedad.novedadesSolucionadas / statsNovedad.novedadesIniciales) * 100)
    : 0;

  return (
    <div className="px-4 py-3 space-y-4">
      {/* Header */}
      <h3 className="text-sm font-semibold text-white flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-primary-400" />
        Estadísticas del día
      </h3>

      {/* Stats Guías */}
      {bloquesHoy.some(b => b.tipoProceso === 'guias') && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-dark-400 flex items-center gap-1">
            📦 Generación de Guías
          </h4>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-dark-700/50 rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-green-400">{statsGuias.realizado}</p>
              <p className="text-[10px] text-dark-400">Realizados</p>
            </div>
            <div className="bg-dark-700/50 rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-red-400">{statsGuias.cancelados}</p>
              <p className="text-[10px] text-dark-400">Cancelados</p>
            </div>
            <div className="bg-dark-700/50 rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-blue-400">{statsGuias.agendados}</p>
              <p className="text-[10px] text-dark-400">Agendados</p>
            </div>
            <div className="bg-dark-700/50 rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-orange-400">{statsGuias.dificiles}</p>
              <p className="text-[10px] text-dark-400">Difíciles</p>
            </div>
            <div className="bg-dark-700/50 rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-yellow-400">{statsGuias.pedidoPendiente}</p>
              <p className="text-[10px] text-dark-400">Pendientes</p>
            </div>
            <div className="bg-dark-700/50 rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-purple-400">{statsGuias.revisado}</p>
              <p className="text-[10px] text-dark-400">Revisados</p>
            </div>
          </div>
          <div className="bg-green-500/10 rounded-lg p-2 flex items-center justify-between">
            <span className="text-xs text-green-400">% Éxito</span>
            <span className="text-lg font-bold text-green-400">{porcentajeExito}%</span>
          </div>
        </div>
      )}

      {/* Stats Novedad */}
      {bloquesHoy.some(b => b.tipoProceso === 'novedad') && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-dark-400 flex items-center gap-1">
            📋 Novedad
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-dark-700/50 rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-blue-400">{statsNovedad.novedadesIniciales}</p>
              <p className="text-[10px] text-dark-400">Iniciales</p>
            </div>
            <div className="bg-dark-700/50 rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-green-400">{statsNovedad.novedadesSolucionadas}</p>
              <p className="text-[10px] text-dark-400">Solucionadas</p>
            </div>
            <div className="bg-dark-700/50 rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-purple-400">{statsNovedad.novedadesRevisadas}</p>
              <p className="text-[10px] text-dark-400">Revisadas</p>
            </div>
            <div className="bg-dark-700/50 rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-yellow-400">{statsNovedad.novedadesFinalePendientes}</p>
              <p className="text-[10px] text-dark-400">Pendientes</p>
            </div>
          </div>
          <div className="bg-pink-500/10 rounded-lg p-2 flex items-center justify-between">
            <span className="text-xs text-pink-400">TOT Devoluciones</span>
            <span className="text-lg font-bold text-pink-400">{totDevoluciones}</span>
          </div>
          <div className="bg-green-500/10 rounded-lg p-2 flex items-center justify-between">
            <span className="text-xs text-green-400">% Solucionado</span>
            <span className="text-lg font-bold text-green-400">{porcentajeSolucionado}%</span>
          </div>
        </div>
      )}

      {/* Resumen general */}
      <div className="bg-dark-800 rounded-lg p-3">
        <h4 className="text-xs font-medium text-dark-400 mb-2">Resumen</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-primary-400" />
            <div>
              <p className="text-sm font-bold text-white">{bloquesHoy.length}</p>
              <p className="text-[10px] text-dark-400">Bloques hoy</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-400" />
            <div>
              <p className="text-sm font-bold text-white">
                {Math.round(bloquesHoy.reduce((acc, b) => acc + b.tiempoTotal, 0) / 60)} min
              </p>
              <p className="text-[10px] text-dark-400">Tiempo total</p>
            </div>
          </div>
        </div>
      </div>

      {bloquesHoy.length === 0 && (
        <div className="text-center py-6 text-dark-500">
          <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Sin datos aún</p>
        </div>
      )}
    </div>
  );
};

export default StatsPanel;
