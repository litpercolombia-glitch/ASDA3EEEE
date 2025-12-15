/**
 * GAMIFICATION PANEL COMPONENT
 * Panel de puntos, niveles y logros
 */

import React, { useState } from 'react';
import { Trophy, Star, Flame, Target, ChevronRight, Lock, Gift, Sparkles } from 'lucide-react';
import { useProcesosStore } from '../stores/procesosStore';
import { LOGROS_DISPONIBLES, NIVELES, COLORES_DISPONIBLES, AVATARES_DISPONIBLES } from '../types';
import Modal from '../../../shared/modals/Modal';

interface GamificationPanelProps {
  className?: string;
}

const GamificationPanel: React.FC<GamificationPanelProps> = ({ className = '' }) => {
  const { usuarioActual, getPerfilGamificacion, getNivelActual, actualizarUsuario } = useProcesosStore();
  const [showRewardsModal, setShowRewardsModal] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'logros' | 'avatares' | 'colores'>('logros');

  if (!usuarioActual) {
    return (
      <div className={`bg-slate-800 rounded-xl p-6 ${className}`}>
        <p className="text-slate-400 text-center">Selecciona un usuario para ver su perfil</p>
      </div>
    );
  }

  const perfil = getPerfilGamificacion(usuarioActual.id);
  if (!perfil) return null;

  const nivelActual = getNivelActual(perfil.xp);
  const siguienteNivel = NIVELES.find((n) => n.nivel === nivelActual.nivel + 1);
  const xpParaSiguiente = siguienteNivel ? siguienteNivel.xpRequerido - perfil.xp : 0;
  const progresoNivel = siguienteNivel
    ? ((perfil.xp - nivelActual.xpRequerido) / (siguienteNivel.xpRequerido - nivelActual.xpRequerido)) * 100
    : 100;

  const logrosDesbloqueados = LOGROS_DISPONIBLES.filter((l) => perfil.logroIds.includes(l.id));
  const logrosBloqueados = LOGROS_DISPONIBLES.filter((l) => !perfil.logroIds.includes(l.id));

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Profile Card */}
      <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/10 rounded-xl p-4 border border-amber-500/30">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="relative">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
              style={{
                backgroundColor: COLORES_DISPONIBLES.find((c) => c.id === usuarioActual.color)?.hex + '40',
              }}
            >
              {usuarioActual.avatar}
            </div>
            <div className="absolute -bottom-1 -right-1 bg-amber-500 rounded-full px-2 py-0.5 text-xs font-bold text-white">
              {nivelActual.nivel}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white">{usuarioActual.nombre}</h3>
            <p className="text-amber-400 text-sm">{nivelActual.nombre}</p>

            {/* XP Progress */}
            <div className="mt-2">
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>{perfil.xp} XP</span>
                {siguienteNivel && <span>{siguienteNivel.xpRequerido} XP</span>}
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                  style={{ width: `${progresoNivel}%` }}
                />
              </div>
              {siguienteNivel && (
                <p className="text-xs text-slate-500 mt-1">{xpParaSiguiente} XP para nivel {siguienteNivel.nivel}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-800 rounded-xl p-3 text-center">
          <Flame className="w-6 h-6 text-orange-400 mx-auto mb-1" />
          <p className="text-2xl font-bold text-white">{perfil.rachaActual}</p>
          <p className="text-xs text-slate-400">Racha</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-3 text-center">
          <Target className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
          <p className="text-2xl font-bold text-white">{perfil.guiasTotales}</p>
          <p className="text-xs text-slate-400">Guias</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-3 text-center">
          <Trophy className="w-6 h-6 text-amber-400 mx-auto mb-1" />
          <p className="text-2xl font-bold text-white">{logrosDesbloqueados.length}</p>
          <p className="text-xs text-slate-400">Logros</p>
        </div>
      </div>

      {/* Recent Achievements */}
      <div className="bg-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-white flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-400" />
            Logros
          </h4>
          <button
            onClick={() => setShowRewardsModal(true)}
            className="text-amber-400 text-sm flex items-center gap-1 hover:text-amber-300"
          >
            Ver todos
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Unlocked Achievements */}
        {logrosDesbloqueados.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {logrosDesbloqueados.slice(0, 6).map((logro) => (
              <div
                key={logro.id}
                className="bg-gradient-to-br from-amber-500/20 to-orange-500/10 rounded-lg p-2 flex items-center gap-2 border border-amber-500/30"
                title={logro.descripcion}
              >
                <span className="text-xl">{logro.icono}</span>
                <span className="text-sm text-white">{logro.nombre}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-sm text-center py-4">
            Aun no has desbloqueado logros
          </p>
        )}

        {/* Locked Preview */}
        {logrosBloqueados.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-700">
            <p className="text-xs text-slate-500 mb-2">Proximos logros:</p>
            <div className="flex gap-2 overflow-x-auto">
              {logrosBloqueados.slice(0, 4).map((logro) => (
                <div
                  key={logro.id}
                  className="flex-shrink-0 bg-slate-700/50 rounded-lg p-2 flex items-center gap-2 opacity-50"
                  title={logro.descripcion}
                >
                  <Lock className="w-4 h-4 text-slate-500" />
                  <span className="text-sm text-slate-400">{logro.nombre}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Rewards Modal */}
      <Modal
        isOpen={showRewardsModal}
        onClose={() => setShowRewardsModal(false)}
        title="Recompensas"
        size="lg"
      >
        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setSelectedTab('logros')}
            className={`flex-1 py-2 rounded-lg text-sm transition-colors ${
              selectedTab === 'logros'
                ? 'bg-amber-500 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <Trophy className="w-4 h-4 inline mr-1" />
            Logros
          </button>
          <button
            onClick={() => setSelectedTab('avatares')}
            className={`flex-1 py-2 rounded-lg text-sm transition-colors ${
              selectedTab === 'avatares'
                ? 'bg-amber-500 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <Sparkles className="w-4 h-4 inline mr-1" />
            Avatares
          </button>
          <button
            onClick={() => setSelectedTab('colores')}
            className={`flex-1 py-2 rounded-lg text-sm transition-colors ${
              selectedTab === 'colores'
                ? 'bg-amber-500 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <Gift className="w-4 h-4 inline mr-1" />
            Colores
          </button>
        </div>

        {/* Logros Tab */}
        {selectedTab === 'logros' && (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {LOGROS_DISPONIBLES.map((logro) => {
              const desbloqueado = perfil.logroIds.includes(logro.id);
              return (
                <div
                  key={logro.id}
                  className={`p-3 rounded-lg flex items-center gap-3 ${
                    desbloqueado
                      ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/10 border border-amber-500/30'
                      : 'bg-slate-700/50 opacity-60'
                  }`}
                >
                  <div className="text-3xl">{desbloqueado ? logro.icono : '🔒'}</div>
                  <div className="flex-1">
                    <h5 className="font-medium text-white">{logro.nombre}</h5>
                    <p className="text-sm text-slate-400">{logro.descripcion}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-amber-400 text-sm">+{logro.xpRecompensa} XP</span>
                    {desbloqueado && (
                      <p className="text-xs text-emerald-400">Desbloqueado</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Avatares Tab */}
        {selectedTab === 'avatares' && (
          <div className="grid grid-cols-4 gap-3 max-h-[400px] overflow-y-auto">
            {AVATARES_DISPONIBLES.map((avatar) => {
              const desbloqueado = perfil.avatarDesbloqueados.includes(avatar);
              const seleccionado = usuarioActual.avatar === avatar;

              return (
                <button
                  key={avatar}
                  onClick={() => {
                    if (desbloqueado) {
                      actualizarUsuario(usuarioActual.id, { avatar });
                    }
                  }}
                  disabled={!desbloqueado}
                  className={`p-4 rounded-xl text-3xl transition-all ${
                    seleccionado
                      ? 'bg-amber-500 ring-2 ring-amber-400 scale-110'
                      : desbloqueado
                      ? 'bg-slate-700 hover:bg-slate-600'
                      : 'bg-slate-800 opacity-40 cursor-not-allowed'
                  }`}
                >
                  {desbloqueado ? avatar : '🔒'}
                </button>
              );
            })}
          </div>
        )}

        {/* Colores Tab */}
        {selectedTab === 'colores' && (
          <div className="grid grid-cols-4 gap-3 max-h-[400px] overflow-y-auto">
            {COLORES_DISPONIBLES.map((color) => {
              const desbloqueado = perfil.coloresDesbloqueados.includes(color.id);
              const seleccionado = usuarioActual.color === color.id;

              return (
                <button
                  key={color.id}
                  onClick={() => {
                    if (desbloqueado) {
                      actualizarUsuario(usuarioActual.id, { color: color.id });
                    }
                  }}
                  disabled={!desbloqueado}
                  className={`p-4 rounded-xl flex flex-col items-center gap-2 transition-all ${
                    seleccionado
                      ? 'ring-2 ring-white scale-105'
                      : desbloqueado
                      ? 'hover:scale-105'
                      : 'opacity-40 cursor-not-allowed'
                  }`}
                  style={{ backgroundColor: desbloqueado ? color.hex : '#374151' }}
                >
                  <span className="text-2xl">{desbloqueado ? color.emoji : '🔒'}</span>
                  <span className="text-xs text-white font-medium">{color.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default GamificationPanel;
