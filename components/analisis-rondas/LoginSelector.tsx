/**
 * 🔐 LOGIN SELECTOR - ANÁLISIS DE RONDAS LITPER
 * Selector de usuario para operadores + login admin
 */

import React, { useState } from 'react';
import {
  User,
  Crown,
  Lock,
  LogIn,
  Users,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { AuthState, LoginSelectorProps } from '../../types/analisis-rondas';
import { USUARIOS_OPERADORES, ADMIN_CONFIG, ICONOS } from '../../constants/analisis-rondas';

export const LoginSelector: React.FC<LoginSelectorProps> = ({ onLogin }) => {
  const [modoAdmin, setModoAdmin] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<string>('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [intentos, setIntentos] = useState(0);

  const handleLoginOperador = () => {
    if (!usuarioSeleccionado) {
      setError('Selecciona un usuario');
      return;
    }

    onLogin({
      usuario: usuarioSeleccionado,
      esAdmin: false,
      autenticado: true,
    });
  };

  const handleLoginAdmin = () => {
    if (password === ADMIN_CONFIG.password) {
      onLogin({
        usuario: ADMIN_CONFIG.username,
        esAdmin: true,
        autenticado: true,
      });
    } else {
      setIntentos(prev => prev + 1);
      setError(`Contraseña incorrecta${intentos >= 2 ? ' (Intento ' + (intentos + 1) + ')' : ''}`);
      setPassword('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (modoAdmin) {
        handleLoginAdmin();
      } else if (usuarioSeleccionado) {
        handleLoginOperador();
      }
    }
  };

  return (
    <div className="min-h-[600px] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 mb-4 shadow-lg">
            <Users className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
            Análisis de Rondas LITPER
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Sistema de control y métricas de rondas logísticas
          </p>
        </div>

        {/* Card principal */}
        <div className="bg-white dark:bg-navy-800 rounded-2xl shadow-xl border border-slate-200 dark:border-navy-700 overflow-hidden">
          {/* Tabs de modo */}
          <div className="flex border-b border-slate-200 dark:border-navy-700">
            <button
              onClick={() => { setModoAdmin(false); setError(null); }}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                !modoAdmin
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-b-2 border-emerald-500'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-navy-700'
              }`}
            >
              <User className="w-4 h-4" />
              Operador
            </button>
            <button
              onClick={() => { setModoAdmin(true); setError(null); }}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                modoAdmin
                  ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-b-2 border-amber-500'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-navy-700'
              }`}
            >
              <Crown className="w-4 h-4" />
              Admin
            </button>
          </div>

          <div className="p-6">
            {/* Error message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {!modoAdmin ? (
              /* Modo Operador */
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Selecciona tu usuario
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {USUARIOS_OPERADORES.map((usuario) => (
                      <button
                        key={usuario.id}
                        onClick={() => { setUsuarioSeleccionado(usuario.nombre); setError(null); }}
                        className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                          usuarioSeleccionado === usuario.nombre
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 ring-2 ring-emerald-500/20'
                            : 'border-slate-200 dark:border-navy-600 hover:border-emerald-300 dark:hover:border-emerald-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="text-lg mb-1">
                          {usuarioSeleccionado === usuario.nombre ? '✅' : '👤'}
                        </div>
                        {usuario.nombre}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleLoginOperador}
                  disabled={!usuarioSeleccionado}
                  className={`w-full py-3 px-4 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2 ${
                    usuarioSeleccionado
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg hover:shadow-xl'
                      : 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed'
                  }`}
                >
                  <LogIn className="w-5 h-5" />
                  Ingresar como {usuarioSeleccionado || 'Operador'}
                </button>

                <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-4">
                  {ICONOS.USUARIO} Los operadores solo ven sus propias métricas
                </p>
              </div>
            ) : (
              /* Modo Admin */
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 mb-3">
                    <ShieldCheck className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Acceso completo al sistema de control
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    <Lock className="w-4 h-4 inline mr-1" />
                    Contraseña de administrador
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(null); }}
                    onKeyPress={handleKeyPress}
                    placeholder="Ingresa la contraseña"
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-navy-600 bg-white dark:bg-navy-900 text-slate-800 dark:text-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all outline-none"
                    autoFocus
                  />
                </div>

                <button
                  onClick={handleLoginAdmin}
                  disabled={!password}
                  className={`w-full py-3 px-4 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2 ${
                    password
                      ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-lg hover:shadow-xl'
                      : 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed'
                  }`}
                >
                  <Crown className="w-5 h-5" />
                  Acceso Admin
                </button>

                <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-4">
                  {ICONOS.ADMIN} El admin tiene acceso a todas las métricas, ranking y recomendaciones
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-6">
          Sistema de Análisis de Rondas Logísticas v1.0
        </p>
      </div>
    </div>
  );
};

export default LoginSelector;
