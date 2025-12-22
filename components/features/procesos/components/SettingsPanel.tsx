/**
 * SETTINGS PANEL COMPONENT
 * Panel de configuración para themes, sonidos y sync
 */

import React, { useState } from 'react';
import {
  Settings,
  Palette,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  RefreshCw,
  Check,
  Moon,
  Sun,
  CloudOff,
  Cloud,
  X,
} from 'lucide-react';
import { useProcesosStore, TEMAS_DISPONIBLES, SONIDOS_DISPONIBLES, ThemeType } from '../stores/procesosStore';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose }) => {
  const {
    themeConfig,
    sonidoConfig,
    isOnline,
    syncQueue,
    lastSyncTime,
    setTheme,
    setSonidoConfig,
    reproducirSonido,
    processSyncQueue,
    clearSyncQueue,
  } = useProcesosStore();

  const [activeTab, setActiveTab] = useState<'theme' | 'sonidos' | 'sync'>('theme');

  if (!isOpen) return null;

  const temas: { id: ThemeType; nombre: string; icono: React.ReactNode }[] = [
    { id: 'dark', nombre: 'Oscuro', icono: <Moon className="w-4 h-4" /> },
    { id: 'light', nombre: 'Claro', icono: <Sun className="w-4 h-4" /> },
    { id: 'blue', nombre: 'Azul', icono: <Palette className="w-4 h-4" /> },
    { id: 'green', nombre: 'Verde', icono: <Palette className="w-4 h-4" /> },
    { id: 'purple', nombre: 'Morado', icono: <Palette className="w-4 h-4" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-800 rounded-2xl w-full max-w-lg mx-4 shadow-2xl border border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-400" />
            Configuración
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700">
          <button
            onClick={() => setActiveTab('theme')}
            className={`flex-1 py-3 px-4 font-medium flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'theme'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Palette className="w-4 h-4" />
            Tema
          </button>
          <button
            onClick={() => setActiveTab('sonidos')}
            className={`flex-1 py-3 px-4 font-medium flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'sonidos'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            Sonidos
          </button>
          <button
            onClick={() => setActiveTab('sync')}
            className={`flex-1 py-3 px-4 font-medium flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'sync'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            Sync
          </button>
        </div>

        {/* Content */}
        <div className="p-4 max-h-96 overflow-y-auto">
          {/* Theme Tab */}
          {activeTab === 'theme' && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-slate-400 uppercase">Seleccionar Tema</h3>
              <div className="grid grid-cols-2 gap-3">
                {temas.map((tema) => {
                  const colores = TEMAS_DISPONIBLES[tema.id];
                  return (
                    <button
                      key={tema.id}
                      onClick={() => setTheme(tema.id)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        themeConfig.tema === tema.id
                          ? 'border-blue-500 ring-2 ring-blue-500/20'
                          : 'border-slate-600 hover:border-slate-500'
                      }`}
                      style={{ backgroundColor: colores.secondary }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2" style={{ color: colores.text }}>
                          {tema.icono}
                          <span className="font-medium">{tema.nombre}</span>
                        </div>
                        {themeConfig.tema === tema.id && (
                          <Check className="w-4 h-4 text-blue-400" />
                        )}
                      </div>
                      <div className="flex gap-1">
                        <div
                          className="w-6 h-3 rounded"
                          style={{ backgroundColor: colores.primary }}
                        />
                        <div
                          className="w-6 h-3 rounded"
                          style={{ backgroundColor: colores.bg }}
                        />
                        <div
                          className="w-6 h-3 rounded"
                          style={{ backgroundColor: colores.text }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sonidos Tab */}
          {activeTab === 'sonidos' && (
            <div className="space-y-6">
              {/* Toggle sonidos */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {sonidoConfig.habilitado ? (
                    <Volume2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <VolumeX className="w-5 h-5 text-slate-500" />
                  )}
                  <span className="text-white font-medium">Sonidos habilitados</span>
                </div>
                <button
                  onClick={() => setSonidoConfig({ habilitado: !sonidoConfig.habilitado })}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    sonidoConfig.habilitado ? 'bg-emerald-500' : 'bg-slate-600'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      sonidoConfig.habilitado ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              {/* Volumen */}
              <div>
                <label className="text-sm text-slate-400 block mb-2">
                  Volumen: {Math.round(sonidoConfig.volumen * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={sonidoConfig.volumen}
                  onChange={(e) => setSonidoConfig({ volumen: parseFloat(e.target.value) })}
                  className="w-full accent-blue-500"
                />
              </div>

              {/* Sonido Fin */}
              <div>
                <label className="text-sm text-slate-400 block mb-2">Sonido al finalizar</label>
                <div className="grid grid-cols-2 gap-2">
                  {SONIDOS_DISPONIBLES.map((sonido) => (
                    <button
                      key={sonido.id}
                      onClick={() => {
                        setSonidoConfig({ sonidoFin: sonido.id });
                        reproducirSonido('fin');
                      }}
                      className={`p-2 rounded-lg text-sm transition-colors ${
                        sonidoConfig.sonidoFin === sonido.id
                          ? 'bg-blue-500 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {sonido.nombre}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sonido Alerta */}
              <div>
                <label className="text-sm text-slate-400 block mb-2">Sonido de alerta</label>
                <div className="grid grid-cols-2 gap-2">
                  {SONIDOS_DISPONIBLES.map((sonido) => (
                    <button
                      key={sonido.id}
                      onClick={() => {
                        setSonidoConfig({ sonidoAlerta: sonido.id });
                        reproducirSonido('alerta');
                      }}
                      className={`p-2 rounded-lg text-sm transition-colors ${
                        sonidoConfig.sonidoAlerta === sonido.id
                          ? 'bg-amber-500 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {sonido.nombre}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sonido Logro */}
              <div>
                <label className="text-sm text-slate-400 block mb-2">Sonido de logro</label>
                <div className="grid grid-cols-2 gap-2">
                  {SONIDOS_DISPONIBLES.map((sonido) => (
                    <button
                      key={sonido.id}
                      onClick={() => {
                        setSonidoConfig({ sonidoLogro: sonido.id });
                        reproducirSonido('logro');
                      }}
                      className={`p-2 rounded-lg text-sm transition-colors ${
                        sonidoConfig.sonidoLogro === sonido.id
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {sonido.nombre}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Sync Tab */}
          {activeTab === 'sync' && (
            <div className="space-y-6">
              {/* Estado de conexión */}
              <div className={`p-4 rounded-xl ${isOnline ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                <div className="flex items-center gap-3">
                  {isOnline ? (
                    <Cloud className="w-8 h-8 text-emerald-400" />
                  ) : (
                    <CloudOff className="w-8 h-8 text-red-400" />
                  )}
                  <div>
                    <h4 className={`font-medium ${isOnline ? 'text-emerald-400' : 'text-red-400'}`}>
                      {isOnline ? 'Conectado' : 'Sin conexión'}
                    </h4>
                    <p className="text-sm text-slate-400">
                      {isOnline
                        ? 'Los datos se sincronizan automáticamente'
                        : 'Los datos se guardarán localmente'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Cola de sincronización */}
              <div className="bg-slate-700/50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-white">Cola de sincronización</h4>
                  <span className="text-sm text-slate-400">
                    {syncQueue.length} pendientes
                  </span>
                </div>

                {syncQueue.length > 0 ? (
                  <div className="space-y-2">
                    {syncQueue.slice(0, 5).map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2 bg-slate-600/50 rounded-lg text-sm"
                      >
                        <span className="text-slate-300">
                          {item.tipo.replace('_', ' ')}
                        </span>
                        <span className="text-slate-500">
                          Intentos: {item.intentos}
                        </span>
                      </div>
                    ))}
                    {syncQueue.length > 5 && (
                      <p className="text-sm text-slate-500 text-center">
                        +{syncQueue.length - 5} más
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 text-center py-4">
                    No hay elementos pendientes
                  </p>
                )}

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={processSyncQueue}
                    disabled={!isOnline || syncQueue.length === 0}
                    className="flex-1 py-2 px-4 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Sincronizar ahora
                  </button>
                  {syncQueue.length > 0 && (
                    <button
                      onClick={clearSyncQueue}
                      className="py-2 px-4 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg font-medium transition-colors"
                    >
                      Limpiar
                    </button>
                  )}
                </div>
              </div>

              {/* Última sincronización */}
              {lastSyncTime && (
                <div className="text-center text-sm text-slate-500">
                  Última sincronización:{' '}
                  {new Date(lastSyncTime).toLocaleString()}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
