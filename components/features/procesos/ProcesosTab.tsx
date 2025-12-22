/**
 * PROCESOS TAB 2.0
 * Módulo principal de gestión de procesos con gamificación
 */

import React, { useState } from 'react';
import { Settings, Shield, User, Timer, Sparkles, LayoutDashboard } from 'lucide-react';
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
  const { usuarioActual, vistaAdmin, toggleVistaAdmin } = useProcesosStore();
  const [activeTab, setActiveTab] = useState<TabView>('trabajo');

  const getColorHex = (colorId: string) =>
    COLORES_DISPONIBLES.find((c) => c.id === colorId)?.hex || '#8B5CF6';

  const userColor = usuarioActual ? getColorHex(usuarioActual.color) : '#8B5CF6';

  const tabs: Array<{ id: TabView; label: string; icon: React.ReactNode; adminOnly?: boolean }> = [
    { id: 'trabajo', label: 'Trabajo', icon: <Timer className="w-4 h-4" /> },
    { id: 'gamificacion', label: 'Logros', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'admin', label: 'Admin', icon: <LayoutDashboard className="w-4 h-4" />, adminOnly: true },
  ];

  const visibleTabs = tabs.filter((tab) => !tab.adminOnly || (tab.adminOnly && vistaAdmin));

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="bg-slate-800/80 backdrop-blur-lg border-b border-slate-700/50 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Title & User */}
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                Procesos 2.0
              </h1>

              {usuarioActual && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-700/50 rounded-full">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-sm"
                    style={{ backgroundColor: `${userColor}40` }}
                  >
                    {usuarioActual.avatar}
                  </div>
                  <span className="text-sm text-white">{usuarioActual.nombre}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleVistaAdmin}
                className={`p-2 rounded-lg transition-colors ${
                  vistaAdmin
                    ? 'bg-amber-500 text-white'
                    : 'bg-slate-700 text-slate-400 hover:text-white'
                }`}
                title={vistaAdmin ? 'Vista Admin activa' : 'Activar Vista Admin'}
              >
                <Shield className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-3">
            {visibleTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-amber-500 text-white'
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* User Selection (always visible) */}
        <div className="mb-6">
          <UserManager />
        </div>

        {/* Tab Content */}
        {activeTab === 'trabajo' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Timer Column */}
            <div className="lg:col-span-1">
              <div className="bg-slate-800 rounded-xl p-6 sticky top-32">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Timer className="w-5 h-5 text-amber-400" />
                  Cronometro
                </h3>
                <CountdownTimer />
              </div>
            </div>

            {/* Work Column */}
            <div className="lg:col-span-2 space-y-6">
              {usuarioActual ? (
                <>
                  <RoundForm />
                </>
              ) : (
                <div className="bg-slate-800 rounded-xl p-12 text-center">
                  <User className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Selecciona un usuario
                  </h3>
                  <p className="text-slate-400">
                    Escoge tu usuario de la lista de arriba para comenzar
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'gamificacion' && (
          <div className="max-w-2xl mx-auto">
            <GamificationPanel />
          </div>
        )}

        {activeTab === 'admin' && vistaAdmin && (
          <AdminDashboard />
        )}
      </main>

      {/* Floating Notes */}
      <FloatingNotes />
    </div>
  );
};

export default ProcesosTab;
