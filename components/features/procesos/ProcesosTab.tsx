/**
 * PROCESOS TAB 2.0
 * Módulo principal de gestión de procesos con gamificación
 */

import React, { useState } from 'react';
import { Settings, Shield, User, Timer, Sparkles, LayoutDashboard, Gamepad2, FileSpreadsheet } from 'lucide-react';
import { useProcesosStore } from './stores/procesosStore';
import {
  UserManager,
  CountdownTimer,
  FloatingNotes,
  GamificationPanel,
  AdminDashboard,
  RoundForm,
} from './components';
import { COLORES_DISPONIBLES } from './types';

type TabView = 'trabajo' | 'gamificacion' | 'admin';

const ProcesosTab: React.FC = () => {
  const { usuarioActual, vistaAdmin, toggleVistaAdmin, isOnline } = useProcesosStore();
  const [activeTab, setActiveTab] = useState<TabView>('trabajo');

  const getColorHex = (colorId: string) =>
    COLORES_DISPONIBLES.find((c) => c.id === colorId)?.hex || '#8B5CF6';

  const userColor = usuarioActual ? getColorHex(usuarioActual.color) : '#8B5CF6';

  const tabs: Array<{ id: TabView; label: string; icon: React.ReactNode; adminOnly?: boolean }> = [
    { id: 'trabajo', label: 'Trabajo', icon: <Timer className="w-4 h-4" /> },
    { id: 'gamificacion', label: 'Modo Juego', icon: <Gamepad2 className="w-4 h-4" /> },
    { id: 'admin', label: 'Admin', icon: <LayoutDashboard className="w-4 h-4" />, adminOnly: true },
  ];

  const visibleTabs = tabs.filter((tab) => !tab.adminOnly || (tab.adminOnly && vistaAdmin));

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="bg-slate-800/80 backdrop-blur-lg border-b border-slate-700/50 sticky top-0 z-30">
        <div className="w-full px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Title & User */}
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                🚀 Procesos 2.0
              </h1>

              {/* Online/Offline indicator */}
              <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${
                isOnline ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
              }`}>
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-red-400'}`} />
                {isOnline ? 'Online' : 'Offline'}
              </div>

              {usuarioActual && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-700/50 rounded-full border border-slate-600">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
                    style={{ backgroundColor: `${userColor}40` }}
                  >
                    {usuarioActual.avatar}
                  </div>
                  <span className="text-sm font-medium text-white">{usuarioActual.nombre}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleVistaAdmin}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  vistaAdmin
                    ? 'bg-amber-500 text-white'
                    : 'bg-slate-700 text-slate-400 hover:text-white hover:bg-slate-600'
                }`}
                title={vistaAdmin ? 'Vista Admin activa' : 'Activar Vista Admin'}
              >
                <Shield className="w-5 h-5" />
                <span className="text-sm font-medium hidden sm:inline">
                  {vistaAdmin ? 'Admin' : 'Modo Admin'}
                </span>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-4">
            {visibleTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content - Fullscreen */}
      <main className="w-full px-6 py-6">
        {/* User Selection (always visible) */}
        <div className="mb-6">
          <UserManager />
        </div>

        {/* Tab Content */}
        {activeTab === 'trabajo' && (
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* Timer Column */}
            <div className="xl:col-span-1">
              <div className="bg-slate-800 rounded-2xl p-6 sticky top-32 border border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Timer className="w-5 h-5 text-amber-400" />
                  Cronómetro
                </h3>
                <CountdownTimer />
              </div>
            </div>

            {/* Work Column */}
            <div className="xl:col-span-3 space-y-6">
              {usuarioActual ? (
                <>
                  <RoundForm />
                </>
              ) : (
                <div className="bg-slate-800 rounded-2xl p-12 text-center border border-slate-700">
                  <div className="w-20 h-20 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-6">
                    <User className="w-10 h-10 text-slate-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">
                    Selecciona tu usuario
                  </h3>
                  <p className="text-slate-400 text-lg">
                    Escoge tu usuario de la lista de arriba para comenzar a trabajar
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'gamificacion' && (
          <div className="w-full">
            <GamificationPanel />
          </div>
        )}

        {activeTab === 'admin' && vistaAdmin && (
          <div className="w-full">
            <AdminDashboard />
          </div>
        )}
      </main>

      {/* Floating Notes */}
      <FloatingNotes />
    </div>
  );
};

export default ProcesosTab;
