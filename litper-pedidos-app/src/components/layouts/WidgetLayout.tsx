import React, { useState } from 'react';
import { Download, BarChart3, Package, Settings, Minimize2, X, RotateCcw, Sunrise, Clock } from 'lucide-react';
import { useAppStore, calcularTotDevoluciones } from '../../stores/appStore';
import { PROCESO_GUIAS, PROCESO_NOVEDAD } from '../../config/processConfig';
import ProcessSelector from '../ProcessSelector';
import Timer from '../Timer';
import CounterButton from '../CounterButton';
import BlocksPanel from '../BlocksPanel';
import ViewSwitcher from '../ViewSwitcher';

type TabView = 'contadores' | 'bloques' | 'stats';

const WidgetLayout: React.FC = () => {
  const {
    procesoActivo,
    contadoresGuias,
    contadoresNovedad,
    incrementarContador,
    decrementarContador,
    finalizarBloque,
    setMostrarModalExportar,
    numeroBloqueHoy,
    ultimoAutoGuardado,
    iniciarNuevoDia,
    getBloquesHoy,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<TabView>('contadores');
  const [confirmNuevoDia, setConfirmNuevoDia] = useState(false);

  const proceso = procesoActivo === 'guias' ? PROCESO_GUIAS : PROCESO_NOVEDAD;
  const contadores = procesoActivo === 'guias' ? contadoresGuias : contadoresNovedad;

  const getValor = (campoId: string): number => {
    if (campoId === 'totDevoluciones' && procesoActivo === 'novedad') {
      return calcularTotDevoluciones(contadoresNovedad);
    }
    return (contadores as any)[campoId] || 0;
  };

  // Calcular totales
  const totalHoy = procesoActivo === 'guias'
    ? contadoresGuias.realizado
    : contadoresNovedad.novedadesSolucionadas;

  const bloquesHoy = getBloquesHoy();

  const handleNuevoDia = () => {
    if (confirmNuevoDia) {
      iniciarNuevoDia();
      setConfirmNuevoDia(false);
    } else {
      setConfirmNuevoDia(true);
      setTimeout(() => setConfirmNuevoDia(false), 3000);
    }
  };

  const tabs: Array<{ id: TabView; label: string; icon: React.ReactNode }> = [
    { id: 'contadores', label: 'Contadores', icon: <Package className="w-4 h-4" /> },
    { id: 'bloques', label: `Bloques (${bloquesHoy.length})`, icon: <Clock className="w-4 h-4" /> },
    { id: 'stats', label: 'Stats', icon: <BarChart3 className="w-4 h-4" /> },
  ];

  // Renderizar contadores por grupo
  const renderContadores = () => {
    if (proceso.grupos) {
      return (
        <div className="space-y-4">
          {proceso.grupos.map((grupo) => (
            <div key={grupo}>
              <h4 className="text-xs font-semibold text-dark-400 uppercase mb-2 px-1">{grupo}</h4>
              <div className="grid grid-cols-2 gap-2">
                {proceso.campos
                  .filter((c) => c.grupo === grupo)
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
                      compact={false}
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

    return (
      <div className="grid grid-cols-2 gap-2">
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
            compact={false}
            onIncrement={incrementarContador}
            onDecrement={decrementarContador}
          />
        ))}
      </div>
    );
  };

  // Renderizar estadísticas
  const renderStats = () => {
    const totalOperaciones = procesoActivo === 'guias'
      ? Object.values(contadoresGuias).reduce((a, b) => a + b, 0)
      : Object.values(contadoresNovedad).reduce((a, b) => a + b, 0);

    const porcentajeExito = procesoActivo === 'guias'
      ? contadoresGuias.realizado + contadoresGuias.cancelados > 0
        ? Math.round((contadoresGuias.realizado / (contadoresGuias.realizado + contadoresGuias.cancelados)) * 100)
        : 0
      : 0;

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-dark-700/50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-white">{totalOperaciones}</p>
            <p className="text-xs text-dark-400">Total bloque</p>
          </div>
          <div className="bg-dark-700/50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-primary-400">{bloquesHoy.length}</p>
            <p className="text-xs text-dark-400">Bloques hoy</p>
          </div>
          {procesoActivo === 'guias' && (
            <>
              <div className="bg-dark-700/50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-green-400">{porcentajeExito}%</p>
                <p className="text-xs text-dark-400">% Éxito</p>
              </div>
              <div className="bg-dark-700/50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-blue-400">{totalHoy}</p>
                <p className="text-xs text-dark-400">Realizados hoy</p>
              </div>
            </>
          )}
        </div>

        {/* Resumen de contadores */}
        <div className="bg-dark-700/30 rounded-lg p-3">
          <h4 className="text-sm font-semibold text-white mb-2">Resumen actual</h4>
          <div className="space-y-1">
            {proceso.campos.map((campo) => (
              <div key={campo.id} className="flex items-center justify-between text-sm">
                <span className="text-dark-400 flex items-center gap-2">
                  <span>{campo.icono}</span>
                  {campo.labelCorto}
                </span>
                <span className="text-white font-medium">{getValor(campo.id)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-b from-dark-900 to-dark-950 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-dark-800/80 border-b border-dark-700 drag-region">
        <div className="flex items-center gap-3 no-drag">
          <span className="text-lg font-bold text-primary-400">📦 LITPER</span>
          <span className="text-xs text-dark-500">v2.0</span>
        </div>
        <div className="flex items-center gap-2 no-drag">
          <button
            onClick={() => setMostrarModalExportar(true)}
            className="p-2 rounded-lg bg-green-600/20 text-green-400 hover:bg-green-600/30 transition-all"
            title="Exportar Excel (E)"
          >
            <Download className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1 ml-2">
            <button className="p-1.5 rounded hover:bg-dark-700 text-dark-400">
              <Minimize2 className="w-4 h-4" />
            </button>
            <button className="p-1.5 rounded hover:bg-red-600/50 text-dark-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* View Switcher */}
      <div className="px-4 py-2">
        <ViewSwitcher />
      </div>

      {/* Process Selector */}
      <div className="px-4 py-2">
        <ProcessSelector />
      </div>

      {/* Timer */}
      <div className="px-4 py-2">
        <Timer />
      </div>

      {/* Tabs */}
      <div className="px-4 pb-2">
        <div className="flex bg-dark-800/50 rounded-lg p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-primary-500 text-white'
                  : 'text-dark-400 hover:text-white hover:bg-dark-700/50'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {activeTab === 'contadores' && (
          <div className="animate-fade-in space-y-4">
            {renderContadores()}

            {/* Botón Reiniciar */}
            <button
              onClick={() => finalizarBloque()}
              className="w-full py-3 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-glow"
            >
              <RotateCcw className="w-5 h-5" />
              Reiniciar Bloque (R)
            </button>
          </div>
        )}

        {activeTab === 'bloques' && (
          <div className="animate-fade-in">
            <BlocksPanel />
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="animate-fade-in">
            {renderStats()}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-dark-800/50 border-t border-dark-700/50">
        <div className="flex items-center justify-between text-xs">
          <span className="text-dark-400">
            Bloque #{numeroBloqueHoy} • Hoy: {totalHoy} {procesoActivo === 'guias' ? 'realizados' : 'solucionadas'}
          </span>
          <div className="flex items-center gap-3">
            {ultimoAutoGuardado && (
              <span className="text-dark-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                Guardado
              </span>
            )}
            <button
              onClick={handleNuevoDia}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-all ${
                confirmNuevoDia
                  ? 'bg-red-600 text-white'
                  : 'bg-dark-700 text-dark-400 hover:text-white'
              }`}
            >
              <Sunrise className="w-3 h-3" />
              {confirmNuevoDia ? 'Confirmar' : 'Nuevo día'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WidgetLayout;
