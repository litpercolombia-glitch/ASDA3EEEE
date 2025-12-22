/**
 * GAMIFICATION PANEL COMPONENT
 * Panel de puntos, niveles y logros - Modo Juego
 */

import React, { useState, useEffect } from 'react';
import {
  Trophy, Star, Flame, Target, ChevronRight, Lock, Gift, Sparkles,
  Zap, Award, Crown, Gamepad2, Calendar, CheckCircle2, Circle,
  TrendingUp, Medal, Rocket, Shield, Swords
} from 'lucide-react';
import { useProcesosStore } from '../stores/procesosStore';
import { LOGROS_DISPONIBLES, NIVELES, COLORES_DISPONIBLES, AVATARES_DISPONIBLES } from '../types';
import Modal from '../../../shared/modals/Modal';

// Desafíos diarios
interface DesafioDiario {
  id: string;
  titulo: string;
  descripcion: string;
  objetivo: number;
  progreso: number;
  xpRecompensa: number;
  icono: React.ReactNode;
  tipo: 'guias' | 'novedades' | 'rondas' | 'racha';
  completado: boolean;
}

const generarDesafiosDiarios = (perfil: any): DesafioDiario[] => {
  const hoy = new Date().toISOString().split('T')[0];

  return [
    {
      id: 'guias-10',
      titulo: 'Guías del Día',
      descripcion: 'Completa 10 guías hoy',
      objetivo: 10,
      progreso: Math.min(perfil?.guiasHoy || 0, 10),
      xpRecompensa: 50,
      icono: <Target className="w-5 h-5 text-emerald-400" />,
      tipo: 'guias',
      completado: (perfil?.guiasHoy || 0) >= 10,
    },
    {
      id: 'rondas-3',
      titulo: 'Triple Ronda',
      descripcion: 'Completa 3 rondas hoy',
      objetivo: 3,
      progreso: Math.min(perfil?.rondasHoy || 0, 3),
      xpRecompensa: 30,
      icono: <Rocket className="w-5 h-5 text-blue-400" />,
      tipo: 'rondas',
      completado: (perfil?.rondasHoy || 0) >= 3,
    },
    {
      id: 'racha-mantener',
      titulo: 'En Llamas',
      descripcion: 'Mantén tu racha activa',
      objetivo: 1,
      progreso: perfil?.rachaActual > 0 ? 1 : 0,
      xpRecompensa: 20,
      icono: <Flame className="w-5 h-5 text-orange-400" />,
      tipo: 'racha',
      completado: perfil?.rachaActual > 0,
    },
    {
      id: 'guias-25',
      titulo: 'Campeón del Día',
      descripcion: 'Completa 25 guías hoy',
      objetivo: 25,
      progreso: Math.min(perfil?.guiasHoy || 0, 25),
      xpRecompensa: 100,
      icono: <Crown className="w-5 h-5 text-amber-400" />,
      tipo: 'guias',
      completado: (perfil?.guiasHoy || 0) >= 25,
    },
  ];
};

interface GamificationPanelProps {
  className?: string;
}

const GamificationPanel: React.FC<GamificationPanelProps> = ({ className = '' }) => {
  const { usuarioActual, getPerfilGamificacion, getNivelActual, actualizarUsuario, rondas } = useProcesosStore();
  const [showRewardsModal, setShowRewardsModal] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'logros' | 'avatares' | 'colores'>('logros');
  const [activeSection, setActiveSection] = useState<'perfil' | 'desafios' | 'logros'>('perfil');
  const [showLevelUp, setShowLevelUp] = useState(false);

  if (!usuarioActual) {
    return (
      <div className={`bg-slate-800 rounded-xl p-6 ${className}`}>
        <div className="text-center py-12">
          <Gamepad2 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">Selecciona un usuario para ver su perfil</p>
          <p className="text-slate-500 text-sm mt-2">¡Empieza a ganar XP y desbloquear logros!</p>
        </div>
      </div>
    );
  }

  const perfil = getPerfilGamificacion(usuarioActual.id);
  if (!perfil) return null;

  // Calcular guías y rondas de hoy
  const hoy = new Date().toISOString().split('T')[0];
  const rondasHoy = rondas.filter(r => r.fecha === hoy && r.usuarioId === usuarioActual.id);
  const guiasHoy = rondasHoy.reduce((acc, r) => acc + (r.realizado || 0), 0);

  // Enriquecer perfil con datos de hoy
  const perfilEnriquecido = {
    ...perfil,
    guiasHoy,
    rondasHoy: rondasHoy.length,
  };

  const desafios = generarDesafiosDiarios(perfilEnriquecido);
  const desafiosCompletados = desafios.filter(d => d.completado).length;

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
      {/* Header con título de Modo Juego */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Gamepad2 className="w-6 h-6 text-amber-400" />
          Modo Juego
        </h2>
        <div className="flex items-center gap-2 text-sm">
          <Zap className="w-4 h-4 text-amber-400" />
          <span className="text-amber-400 font-bold">{perfil.xp} XP</span>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-2 bg-slate-800 rounded-xl p-1">
        <button
          onClick={() => setActiveSection('perfil')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1 ${
            activeSection === 'perfil'
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-700'
          }`}
        >
          <Crown className="w-4 h-4" />
          Perfil
        </button>
        <button
          onClick={() => setActiveSection('desafios')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1 ${
            activeSection === 'desafios'
              ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-700'
          }`}
        >
          <Swords className="w-4 h-4" />
          Desafíos
          {desafiosCompletados > 0 && (
            <span className="bg-emerald-500 text-white text-xs px-1.5 rounded-full">
              {desafiosCompletados}/{desafios.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveSection('logros')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1 ${
            activeSection === 'logros'
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-700'
          }`}
        >
          <Trophy className="w-4 h-4" />
          Logros
        </button>
      </div>

      {/* SECTION: Perfil */}
      {activeSection === 'perfil' && (
        <>
          {/* Profile Card */}
          <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/10 rounded-xl p-4 border border-amber-500/30 relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full -mr-16 -mt-16" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-orange-500/10 rounded-full -ml-12 -mb-12" />

            <div className="flex items-center gap-4 relative">
              {/* Avatar */}
              <div className="relative">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center text-4xl shadow-lg ring-4 ring-amber-500/30"
                  style={{
                    backgroundColor: COLORES_DISPONIBLES.find((c) => c.id === usuarioActual.color)?.hex + '40',
                  }}
                >
                  {usuarioActual.avatar}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full px-2.5 py-1 text-xs font-bold text-white shadow-lg flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  {nivelActual.nivel}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white">{usuarioActual.nombre}</h3>
                <p className="text-amber-400 font-medium flex items-center gap-1">
                  <Award className="w-4 h-4" />
                  {nivelActual.nombre}
                </p>

                {/* XP Progress */}
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span className="flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-400" />
                      {perfil.xp} XP
                    </span>
                    {siguienteNivel && (
                      <span>{siguienteNivel.xpRequerido} XP</span>
                    )}
                  </div>
                  <div className="h-3 bg-slate-700 rounded-full overflow-hidden shadow-inner">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 transition-all duration-500 relative"
                      style={{ width: `${progresoNivel}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
                    </div>
                  </div>
                  {siguienteNivel && (
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {xpParaSiguiente} XP para nivel {siguienteNivel.nivel}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid - Mejorado */}
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-gradient-to-br from-orange-500/20 to-red-500/10 rounded-xl p-3 text-center border border-orange-500/20">
              <Flame className="w-6 h-6 text-orange-400 mx-auto mb-1" />
              <p className="text-2xl font-bold text-white">{perfil.rachaActual}</p>
              <p className="text-xs text-orange-300">Racha</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-500/20 to-green-500/10 rounded-xl p-3 text-center border border-emerald-500/20">
              <Target className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
              <p className="text-2xl font-bold text-white">{perfil.guiasTotales}</p>
              <p className="text-xs text-emerald-300">Guías Total</p>
            </div>
            <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/10 rounded-xl p-3 text-center border border-blue-500/20">
              <Calendar className="w-6 h-6 text-blue-400 mx-auto mb-1" />
              <p className="text-2xl font-bold text-white">{guiasHoy}</p>
              <p className="text-xs text-blue-300">Hoy</p>
            </div>
            <div className="bg-gradient-to-br from-amber-500/20 to-yellow-500/10 rounded-xl p-3 text-center border border-amber-500/20">
              <Trophy className="w-6 h-6 text-amber-400 mx-auto mb-1" />
              <p className="text-2xl font-bold text-white">{logrosDesbloqueados.length}</p>
              <p className="text-xs text-amber-300">Logros</p>
            </div>
          </div>

          {/* Racha Info */}
          {perfil.rachaActual > 0 && (
            <div className="bg-gradient-to-r from-orange-500/20 to-red-500/10 rounded-xl p-4 border border-orange-500/30">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-500/30 rounded-xl flex items-center justify-center">
                  <Flame className="w-7 h-7 text-orange-400 animate-pulse" />
                </div>
                <div>
                  <p className="text-white font-bold">¡{perfil.rachaActual} días en racha!</p>
                  <p className="text-orange-300 text-sm">Sigue así para desbloquear más recompensas</p>
                </div>
                {perfil.rachaActual >= 7 && (
                  <div className="ml-auto bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                    +50% XP BONUS
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick view de recompensas */}
          <button
            onClick={() => setShowRewardsModal(true)}
            className="w-full bg-slate-800 hover:bg-slate-700 rounded-xl p-4 border border-slate-700 transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Gift className="w-6 h-6 text-purple-400" />
                <div className="text-left">
                  <p className="text-white font-medium">Tienda de Recompensas</p>
                  <p className="text-slate-400 text-sm">Avatares, colores y más</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" />
            </div>
          </button>
        </>
      )}

      {/* SECTION: Desafíos Diarios */}
      {activeSection === 'desafios' && (
        <>
          <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/10 rounded-xl p-4 border border-blue-500/30">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Swords className="w-5 h-5 text-blue-400" />
                <h3 className="text-white font-bold">Desafíos del Día</h3>
              </div>
              <div className="text-sm text-slate-400">
                {desafiosCompletados}/{desafios.length} completados
              </div>
            </div>

            {/* Progress bar de desafíos */}
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden mb-4">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500"
                style={{ width: `${(desafiosCompletados / desafios.length) * 100}%` }}
              />
            </div>

            {/* Lista de desafíos */}
            <div className="space-y-3">
              {desafios.map((desafio) => (
                <div
                  key={desafio.id}
                  className={`p-3 rounded-xl border transition-all ${
                    desafio.completado
                      ? 'bg-emerald-500/20 border-emerald-500/30'
                      : 'bg-slate-800/50 border-slate-700/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      desafio.completado ? 'bg-emerald-500/30' : 'bg-slate-700/50'
                    }`}>
                      {desafio.completado ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        desafio.icono
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className={`font-medium ${desafio.completado ? 'text-emerald-400' : 'text-white'}`}>
                          {desafio.titulo}
                        </p>
                        <span className="text-amber-400 text-sm font-bold">
                          +{desafio.xpRecompensa} XP
                        </span>
                      </div>
                      <p className="text-slate-400 text-sm">{desafio.descripcion}</p>
                      {/* Progress bar individual */}
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              desafio.completado
                                ? 'bg-emerald-400'
                                : 'bg-blue-400'
                            }`}
                            style={{ width: `${(desafio.progreso / desafio.objetivo) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-500">
                          {desafio.progreso}/{desafio.objetivo}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bonus info */}
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-white font-medium">Completa todos los desafíos</p>
                <p className="text-slate-400 text-sm">
                  Gana +{desafios.reduce((acc, d) => acc + d.xpRecompensa, 0)} XP total
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* SECTION: Logros */}
      {activeSection === 'logros' && (
        <>
          {/* Recent Achievements */}
          <div className="bg-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-white flex items-center gap-2">
                <Medal className="w-5 h-5 text-amber-400" />
                Logros Desbloqueados
              </h4>
              <span className="text-slate-400 text-sm">
                {logrosDesbloqueados.length}/{LOGROS_DISPONIBLES.length}
              </span>
            </div>

            {/* Unlocked Achievements */}
            {logrosDesbloqueados.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {logrosDesbloqueados.map((logro) => (
                  <div
                    key={logro.id}
                    className="bg-gradient-to-br from-amber-500/20 to-orange-500/10 rounded-lg p-3 border border-amber-500/30"
                    title={logro.descripcion}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{logro.icono}</span>
                      <div>
                        <p className="text-sm text-white font-medium">{logro.nombre}</p>
                        <p className="text-xs text-amber-400">+{logro.xpRecompensa} XP</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm text-center py-4">
                Aún no has desbloqueado logros
              </p>
            )}
          </div>

          {/* Locked Achievements */}
          {logrosBloqueados.length > 0 && (
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
              <h4 className="font-semibold text-slate-400 flex items-center gap-2 mb-3">
                <Lock className="w-4 h-4" />
                Por Desbloquear
              </h4>
              <div className="space-y-2">
                {logrosBloqueados.slice(0, 5).map((logro) => (
                  <div
                    key={logro.id}
                    className="flex items-center gap-3 p-2 rounded-lg bg-slate-700/30 opacity-60"
                  >
                    <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
                      <Lock className="w-4 h-4 text-slate-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-slate-400">{logro.nombre}</p>
                      <p className="text-xs text-slate-500">{logro.descripcion}</p>
                    </div>
                    <span className="text-amber-400/50 text-xs">+{logro.xpRecompensa} XP</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setShowRewardsModal(true)}
                className="w-full mt-3 py-2 text-center text-slate-400 hover:text-white text-sm transition-colors"
              >
                Ver todos los logros →
              </button>
            </div>
          )}
        </>
      )}

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
