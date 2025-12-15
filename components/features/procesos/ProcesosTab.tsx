/**
 * PROCESOS TAB 2.0 - VERSIÓN FINAL
 * Con selección de usuario, autenticación admin y reportes completos
 * SIN ranking visible para usuarios
 */

import React, { useState, useEffect } from 'react';
import {
  Shield,
  User,
  Timer,
  LogOut,
  Lock,
  UserPlus,
  Edit2,
  Trash2,
  Check,
  X,
  Play,
  Pause,
  RotateCcw,
  Save,
  ClipboardList,
  BarChart3,
  Users,
  Calendar,
  FileText,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Target,
  Clock,
} from 'lucide-react';
import {
  useProcesosStore,
  ADMIN_PASSWORD,
  COLORES_USUARIO,
  AVATARES,
  type Usuario,
  type RondaCompleta,
  type ReporteDiario,
  type ReporteSemanal,
  type ReporteMensual,
  type EstadisticasUsuario,
} from './stores/procesosStore';

// ============================================
// COMPONENTES AUXILIARES
// ============================================

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const getTimerColor = (percentage: number) => {
  if (percentage > 50) return 'text-emerald-400';
  if (percentage > 25) return 'text-amber-400';
  if (percentage > 10) return 'text-orange-400';
  return 'text-red-400';
};

const getColorHex = (colorId: string) =>
  COLORES_USUARIO.find((c) => c.id === colorId)?.hex || '#8B5CF6';

// ============================================
// PANTALLA DE SELECCIÓN DE USUARIO
// ============================================

const PantallaSeleccion: React.FC = () => {
  const { usuarios, seleccionarUsuario, loginAdmin, adminAutenticado } = useProcesosStore();
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginAdmin(password)) {
      setShowAdminLogin(false);
      setPassword('');
      setError('');
    } else {
      setError('Contraseña incorrecta');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent mb-2">
            Procesos 2.0
          </h1>
          <p className="text-slate-400">Selecciona tu usuario para comenzar</p>
        </div>

        {/* User Grid */}
        {usuarios.filter(u => u.activo).length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-8">
            {usuarios.filter(u => u.activo).map((usuario) => (
              <button
                key={usuario.id}
                onClick={() => seleccionarUsuario(usuario.id)}
                className="p-4 bg-slate-800 rounded-xl border border-slate-700 hover:border-amber-500/50 hover:bg-slate-700/50 transition-all duration-200 group"
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-3xl mx-auto mb-3 transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${getColorHex(usuario.color)}30` }}
                >
                  {usuario.avatar}
                </div>
                <p className="text-white font-medium text-center truncate">{usuario.nombre}</p>
                <p className="text-xs text-slate-500 text-center">Meta: {usuario.metaDiaria}</p>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-slate-800 rounded-xl mb-8">
            <User className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 mb-2">No hay usuarios registrados</p>
            <p className="text-sm text-slate-500">El administrador debe crear usuarios primero</p>
          </div>
        )}

        {/* Admin Button */}
        <div className="text-center">
          <button
            onClick={() => setShowAdminLogin(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-400 rounded-lg hover:bg-slate-700 hover:text-white transition-colors"
          >
            <Shield className="w-4 h-4" />
            Acceso Administrador
          </button>
        </div>
      </div>

      {/* Admin Login Modal */}
      {showAdminLogin && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-sm border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-amber-400" />
                Acceso Admin
              </h3>
              <button
                onClick={() => {
                  setShowAdminLogin(false);
                  setPassword('');
                  setError('');
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAdminLogin}>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder="Contraseña"
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500 focus:border-transparent mb-3"
                autoFocus
              />
              {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
              <button
                type="submit"
                className="w-full py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium"
              >
                Entrar
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// PANTALLA DE TRABAJO (USUARIO)
// ============================================

const PantallaTrabajo: React.FC = () => {
  const {
    usuarioActual,
    cerrarSesionUsuario,
    configCronometro,
    estadoCronometro,
    tiempoRestante,
    rondaActualNumero,
    iniciarCronometro,
    pausarCronometro,
    resetearCronometro,
    tick,
    setTiempo,
    guardarRonda,
    getRondasHoy,
    getTotalHoy,
    getProgresoMeta,
  } = useProcesosStore();

  const [showRoundModal, setShowRoundModal] = useState(false);
  const [formData, setFormData] = useState({
    pedidosIniciales: 0,
    realizado: 0,
    cancelado: 0,
    agendado: 0,
    dificiles: 0,
    pendientes: 0,
    revisado: 0,
    notas: '',
  });

  // Timer tick
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (estadoCronometro === 'running') {
      interval = setInterval(tick, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [estadoCronometro, tick]);

  if (!usuarioActual) return null;

  const rondasHoy = getRondasHoy(usuarioActual.id);
  const totalHoy = getTotalHoy(usuarioActual.id);
  const progresoMeta = getProgresoMeta(usuarioActual.id);
  const timerPercentage = (tiempoRestante / (configCronometro.duracionMinutos * 60)) * 100;

  const handleGuardarRonda = (e: React.FormEvent) => {
    e.preventDefault();
    guardarRonda({
      usuarioId: usuarioActual.id,
      horaInicio: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
      tiempoUsado: configCronometro.duracionMinutos - Math.floor(tiempoRestante / 60),
      ...formData,
    });
    setFormData({
      pedidosIniciales: 0,
      realizado: 0,
      cancelado: 0,
      agendado: 0,
      dificiles: 0,
      pendientes: 0,
      revisado: 0,
      notas: '',
    });
    setShowRoundModal(false);
  };

  const tiempoOptions = [15, 20, 25, 30, 35, 40, 45];

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="bg-slate-800/80 backdrop-blur-lg border-b border-slate-700/50 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                Procesos 2.0
              </h1>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-700/50 rounded-full">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-lg"
                  style={{ backgroundColor: `${getColorHex(usuarioActual.color)}40` }}
                >
                  {usuarioActual.avatar}
                </div>
                <span className="text-white font-medium">{usuarioActual.nombre}</span>
              </div>
            </div>
            <button
              onClick={cerrarSesionUsuario}
              className="flex items-center gap-2 px-3 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 hover:text-white transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Timer Column */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800 rounded-xl p-6 sticky top-24">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Timer className="w-5 h-5 text-amber-400" />
                Cronómetro - Ronda #{rondaActualNumero}
              </h3>

              {/* Timer Display */}
              <div className="text-center mb-6">
                <p className={`text-6xl font-mono font-bold ${getTimerColor(timerPercentage)}`}>
                  {formatTime(tiempoRestante)}
                </p>
              </div>

              {/* Time Selection */}
              {estadoCronometro === 'idle' && (
                <div className="flex flex-wrap gap-2 mb-4 justify-center">
                  {tiempoOptions.map((min) => (
                    <button
                      key={min}
                      onClick={() => setTiempo(min)}
                      className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                        configCronometro.duracionMinutos === min
                          ? 'bg-amber-500 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {min}m
                    </button>
                  ))}
                </div>
              )}

              {/* Controls */}
              <div className="flex gap-2 justify-center">
                {estadoCronometro === 'idle' && (
                  <button
                    onClick={iniciarCronometro}
                    className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                  >
                    <Play className="w-5 h-5" />
                    Iniciar
                  </button>
                )}
                {estadoCronometro === 'running' && (
                  <button
                    onClick={pausarCronometro}
                    className="flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                  >
                    <Pause className="w-5 h-5" />
                    Pausar
                  </button>
                )}
                {estadoCronometro === 'paused' && (
                  <>
                    <button
                      onClick={iniciarCronometro}
                      className="flex items-center gap-2 px-4 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                    >
                      <Play className="w-5 h-5" />
                      Continuar
                    </button>
                    <button
                      onClick={resetearCronometro}
                      className="flex items-center gap-2 px-4 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-500 transition-colors"
                    >
                      <RotateCcw className="w-5 h-5" />
                    </button>
                  </>
                )}
                {estadoCronometro === 'finished' && (
                  <button
                    onClick={() => setShowRoundModal(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors animate-pulse"
                  >
                    <Save className="w-5 h-5" />
                    Registrar Ronda
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Work Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress Bar */}
            <div className="bg-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">Tu progreso de hoy</span>
                <span className="text-sm font-medium text-white">
                  {totalHoy} / {usuarioActual.metaDiaria}
                </span>
              </div>
              <div className="h-4 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    progresoMeta >= 100
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                      : progresoMeta >= 75
                      ? 'bg-gradient-to-r from-amber-500 to-amber-400'
                      : 'bg-gradient-to-r from-blue-500 to-blue-400'
                  }`}
                  style={{ width: `${Math.min(100, progresoMeta)}%` }}
                />
              </div>
              {progresoMeta >= 100 && (
                <p className="text-emerald-400 text-sm mt-2 text-center font-medium">
                  ¡Meta cumplida! Excelente trabajo
                </p>
              )}
            </div>

            {/* Today's Rounds */}
            <div className="bg-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-white flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-amber-400" />
                  Mis rondas de hoy
                </h4>
                <button
                  onClick={() => setShowRoundModal(true)}
                  className="text-sm text-amber-400 hover:text-amber-300"
                >
                  + Nueva ronda
                </button>
              </div>

              {rondasHoy.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {rondasHoy.map((ronda) => (
                    <div
                      key={ronda.id}
                      className="bg-slate-700/50 rounded-lg p-3"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-amber-500/20 rounded-full flex items-center justify-center text-amber-400 font-bold text-sm">
                            {ronda.numero}
                          </div>
                          <div>
                            <p className="text-white text-sm font-medium">
                              Ronda #{ronda.numero}
                            </p>
                            <p className="text-xs text-slate-400">{ronda.horaInicio} - {ronda.horaFin}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-emerald-400 font-bold">{ronda.realizado}</p>
                          <p className="text-xs text-slate-400">realizadas</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="bg-slate-600/50 rounded px-2 py-1">
                          <span className="text-slate-400">Iniciales:</span>{' '}
                          <span className="text-white">{ronda.pedidosIniciales}</span>
                        </div>
                        <div className="bg-slate-600/50 rounded px-2 py-1">
                          <span className="text-red-400">Cancel:</span>{' '}
                          <span className="text-white">{ronda.cancelado}</span>
                        </div>
                        <div className="bg-slate-600/50 rounded px-2 py-1">
                          <span className="text-blue-400">Agend:</span>{' '}
                          <span className="text-white">{ronda.agendado}</span>
                        </div>
                        <div className="bg-slate-600/50 rounded px-2 py-1">
                          <span className="text-orange-400">Difíc:</span>{' '}
                          <span className="text-white">{ronda.dificiles}</span>
                        </div>
                        <div className="bg-slate-600/50 rounded px-2 py-1">
                          <span className="text-yellow-400">Pend:</span>{' '}
                          <span className="text-white">{ronda.pendientes}</span>
                        </div>
                        <div className="bg-slate-600/50 rounded px-2 py-1">
                          <span className="text-purple-400">Revis:</span>{' '}
                          <span className="text-white">{ronda.revisado}</span>
                        </div>
                      </div>
                      {ronda.notas && (
                        <p className="text-xs text-slate-400 mt-2 italic">"{ronda.notas}"</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No hay rondas registradas hoy</p>
                  <p className="text-xs">¡Inicia el cronómetro para comenzar!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Round Modal */}
      {showRoundModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-lg border border-slate-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                Registrar Ronda #{rondaActualNumero}
              </h3>
              <button
                onClick={() => setShowRoundModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarRonda} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Pedidos Iniciales</label>
                  <input
                    type="number"
                    value={formData.pedidosIniciales}
                    onChange={(e) => setFormData({ ...formData, pedidosIniciales: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm text-emerald-400 mb-1">Realizados ✓</label>
                  <input
                    type="number"
                    value={formData.realizado}
                    onChange={(e) => setFormData({ ...formData, realizado: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-700 border border-emerald-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm text-red-400 mb-1">Cancelados</label>
                  <input
                    type="number"
                    value={formData.cancelado}
                    onChange={(e) => setFormData({ ...formData, cancelado: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm text-blue-400 mb-1">Agendados</label>
                  <input
                    type="number"
                    value={formData.agendado}
                    onChange={(e) => setFormData({ ...formData, agendado: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm text-orange-400 mb-1">Difíciles</label>
                  <input
                    type="number"
                    value={formData.dificiles}
                    onChange={(e) => setFormData({ ...formData, dificiles: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm text-yellow-400 mb-1">Pendientes</label>
                  <input
                    type="number"
                    value={formData.pendientes}
                    onChange={(e) => setFormData({ ...formData, pendientes: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-purple-400 mb-1">Revisados</label>
                <input
                  type="number"
                  value={formData.revisado}
                  onChange={(e) => setFormData({ ...formData, revisado: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Notas (opcional)</label>
                <textarea
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white resize-none"
                  rows={2}
                  placeholder="Observaciones de la ronda..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRoundModal(false)}
                  className="flex-1 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// PANTALLA DE ADMINISTRADOR
// ============================================

type AdminTab = 'usuarios' | 'reportes' | 'analisis';

const PantallaAdmin: React.FC = () => {
  const {
    usuarios,
    rondas,
    logoutAdmin,
    agregarUsuario,
    editarUsuario,
    eliminarUsuario,
    getReporteDiario,
    getReporteSemanal,
    getReporteMensual,
    getEstadisticasUsuario,
  } = useProcesosStore();

  const [activeTab, setActiveTab] = useState<AdminTab>('usuarios');
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  const [userForm, setUserForm] = useState({
    nombre: '',
    avatar: AVATARES[0],
    color: COLORES_USUARIO[0].id,
    metaDiaria: 50,
  });

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.nombre.trim()) return;

    if (editingUser) {
      editarUsuario(editingUser.id, userForm);
    } else {
      agregarUsuario(userForm);
    }

    setShowUserModal(false);
    setEditingUser(null);
    setUserForm({ nombre: '', avatar: AVATARES[0], color: COLORES_USUARIO[0].id, metaDiaria: 50 });
  };

  const handleEditUser = (user: Usuario) => {
    setEditingUser(user);
    setUserForm({
      nombre: user.nombre,
      avatar: user.avatar,
      color: user.color,
      metaDiaria: user.metaDiaria,
    });
    setShowUserModal(true);
  };

  const handleDeleteUser = (id: string) => {
    if (confirmDelete === id) {
      eliminarUsuario(id);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  };

  // Reports data
  const reporteDiario = getReporteDiario(selectedDate);
  const reporteSemanal = getReporteSemanal();
  const reporteMensual = getReporteMensual();
  const estadisticasUsuario = selectedUserId ? getEstadisticasUsuario(selectedUserId) : null;

  const tabs: Array<{ id: AdminTab; label: string; icon: React.ReactNode }> = [
    { id: 'usuarios', label: 'Usuarios', icon: <Users className="w-4 h-4" /> },
    { id: 'reportes', label: 'Reportes', icon: <FileText className="w-4 h-4" /> },
    { id: 'analisis', label: 'Análisis', icon: <BarChart3 className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="bg-slate-800/80 backdrop-blur-lg border-b border-slate-700/50 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                Panel Admin
              </h1>
              <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-full">
                ADMINISTRADOR
              </span>
            </div>
            <button
              onClick={logoutAdmin}
              className="flex items-center gap-2 px-3 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 hover:text-white transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Salir
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-3">
            {tabs.map((tab) => (
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

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* USUARIOS TAB */}
        {activeTab === 'usuarios' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Gestión de Usuarios</h2>
              <button
                onClick={() => {
                  setEditingUser(null);
                  setUserForm({ nombre: '', avatar: AVATARES[0], color: COLORES_USUARIO[0].id, metaDiaria: 50 });
                  setShowUserModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                Nuevo Usuario
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {usuarios.map((user) => (
                <div
                  key={user.id}
                  className={`bg-slate-800 rounded-xl p-4 border ${
                    user.activo ? 'border-slate-700' : 'border-red-500/30 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                        style={{ backgroundColor: `${getColorHex(user.color)}30` }}
                      >
                        {user.avatar}
                      </div>
                      <div>
                        <p className="font-medium text-white">{user.nombre}</p>
                        <p className="text-xs text-slate-400">Meta: {user.metaDiaria}/día</p>
                        {!user.activo && <p className="text-xs text-red-400">Inactivo</p>}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="p-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
                      >
                        <Edit2 className="w-4 h-4 text-slate-300" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          confirmDelete === user.id
                            ? 'bg-red-500 text-white'
                            : 'bg-slate-700 hover:bg-red-500/50 text-slate-300'
                        }`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500">
                    Creado: {new Date(user.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
              {usuarios.length === 0 && (
                <div className="col-span-full text-center py-12 bg-slate-800 rounded-xl">
                  <Users className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-400">No hay usuarios</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* REPORTES TAB */}
        {activeTab === 'reportes' && (
          <div className="space-y-6">
            {/* Date selector */}
            <div className="flex items-center gap-4">
              <label className="text-slate-400">Fecha:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
              />
            </div>

            {/* Daily Report */}
            <div className="bg-slate-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-400" />
                Reporte Diario - {selectedDate}
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <p className="text-slate-400 text-xs">Usuarios Activos</p>
                  <p className="text-2xl font-bold text-white">{reporteDiario.usuariosActivos}</p>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <p className="text-slate-400 text-xs">Total Rondas</p>
                  <p className="text-2xl font-bold text-white">{reporteDiario.totalRondas}</p>
                </div>
                <div className="bg-emerald-500/20 rounded-lg p-3">
                  <p className="text-emerald-400 text-xs">Realizados</p>
                  <p className="text-2xl font-bold text-emerald-400">{reporteDiario.totalRealizado}</p>
                </div>
                <div className="bg-red-500/20 rounded-lg p-3">
                  <p className="text-red-400 text-xs">Cancelados</p>
                  <p className="text-2xl font-bold text-red-400">{reporteDiario.totalCancelado}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                  <p className="text-blue-400 text-xs">Agendados</p>
                  <p className="text-xl font-bold text-white">{reporteDiario.totalAgendado}</p>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                  <p className="text-orange-400 text-xs">Difíciles</p>
                  <p className="text-xl font-bold text-white">{reporteDiario.totalDificiles}</p>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                  <p className="text-yellow-400 text-xs">Pendientes</p>
                  <p className="text-xl font-bold text-white">{reporteDiario.totalPendientes}</p>
                </div>
              </div>

              {/* Per User */}
              {reporteDiario.porUsuario.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-slate-400 mb-2">Detalle por Usuario</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-700/50">
                        <tr>
                          <th className="px-3 py-2 text-left text-slate-400">Usuario</th>
                          <th className="px-3 py-2 text-center text-slate-400">Rondas</th>
                          <th className="px-3 py-2 text-center text-emerald-400">Real.</th>
                          <th className="px-3 py-2 text-center text-red-400">Cancel.</th>
                          <th className="px-3 py-2 text-center text-blue-400">Agend.</th>
                          <th className="px-3 py-2 text-center text-orange-400">Difíc.</th>
                          <th className="px-3 py-2 text-center text-yellow-400">Pend.</th>
                          <th className="px-3 py-2 text-center text-purple-400">Revis.</th>
                          <th className="px-3 py-2 text-center text-slate-400">Meta</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700">
                        {reporteDiario.porUsuario.map((r) => (
                          <tr key={r.usuario.id}>
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-2">
                                <span>{r.usuario.avatar}</span>
                                <span className="text-white">{r.usuario.nombre}</span>
                              </div>
                            </td>
                            <td className="px-3 py-2 text-center text-white">{r.rondas}</td>
                            <td className="px-3 py-2 text-center text-emerald-400 font-medium">{r.realizado}</td>
                            <td className="px-3 py-2 text-center text-red-400">{r.cancelado}</td>
                            <td className="px-3 py-2 text-center text-blue-400">{r.agendado}</td>
                            <td className="px-3 py-2 text-center text-orange-400">{r.dificiles}</td>
                            <td className="px-3 py-2 text-center text-yellow-400">{r.pendientes}</td>
                            <td className="px-3 py-2 text-center text-purple-400">{r.revisado}</td>
                            <td className="px-3 py-2 text-center">
                              <span
                                className={`${
                                  r.progresoMeta >= 100
                                    ? 'text-emerald-400'
                                    : r.progresoMeta >= 75
                                    ? 'text-amber-400'
                                    : 'text-slate-400'
                                }`}
                              >
                                {r.progresoMeta}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Weekly Report */}
            <div className="bg-slate-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-400" />
                Reporte Semanal
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <p className="text-slate-400 text-xs">Días Trabajados</p>
                  <p className="text-2xl font-bold text-white">{reporteSemanal.diasTrabajados}</p>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <p className="text-slate-400 text-xs">Total Rondas</p>
                  <p className="text-2xl font-bold text-white">{reporteSemanal.totalRondas}</p>
                </div>
                <div className="bg-emerald-500/20 rounded-lg p-3">
                  <p className="text-emerald-400 text-xs">Total Realizado</p>
                  <p className="text-2xl font-bold text-emerald-400">{reporteSemanal.totalRealizado}</p>
                </div>
                <div className="bg-blue-500/20 rounded-lg p-3">
                  <p className="text-blue-400 text-xs">Promedio Diario</p>
                  <p className="text-2xl font-bold text-blue-400">{reporteSemanal.promedioDiario}</p>
                </div>
              </div>
              {reporteSemanal.mejorDia.fecha && (
                <div className="mt-4 flex gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <span className="text-slate-400">Mejor día:</span>
                    <span className="text-white">{reporteSemanal.mejorDia.fecha} ({reporteSemanal.mejorDia.total})</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingDown className="w-4 h-4 text-red-400" />
                    <span className="text-slate-400">Día más bajo:</span>
                    <span className="text-white">{reporteSemanal.peorDia.fecha} ({reporteSemanal.peorDia.total})</span>
                  </div>
                </div>
              )}
            </div>

            {/* Monthly Report */}
            <div className="bg-slate-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-400" />
                Reporte Mensual - {reporteMensual.mes} {reporteMensual.año}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <p className="text-slate-400 text-xs">Total Rondas</p>
                  <p className="text-2xl font-bold text-white">{reporteMensual.totalRondas}</p>
                </div>
                <div className="bg-emerald-500/20 rounded-lg p-3">
                  <p className="text-emerald-400 text-xs">Total Realizado</p>
                  <p className="text-2xl font-bold text-emerald-400">{reporteMensual.totalRealizado}</p>
                </div>
                <div className="bg-red-500/20 rounded-lg p-3">
                  <p className="text-red-400 text-xs">Tasa Cancelación</p>
                  <p className="text-2xl font-bold text-red-400">{reporteMensual.tasaCancelacion}%</p>
                </div>
                <div className="bg-purple-500/20 rounded-lg p-3">
                  <p className="text-purple-400 text-xs">Mejor Día</p>
                  <p className="text-lg font-bold text-purple-400">{reporteMensual.mejorDiaSemana}</p>
                </div>
              </div>
              {reporteMensual.mejorUsuario && (
                <div className="mt-4 flex items-center gap-2 text-sm">
                  <span className="text-amber-400">🏆</span>
                  <span className="text-slate-400">Mejor del mes:</span>
                  <span className="text-white">
                    {reporteMensual.mejorUsuario.usuario.nombre} ({reporteMensual.mejorUsuario.total} realizados)
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ANALISIS TAB */}
        {activeTab === 'analisis' && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <label className="text-slate-400">Seleccionar Usuario:</label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
              >
                <option value="">-- Seleccionar --</option>
                {usuarios.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.avatar} {u.nombre}
                  </option>
                ))}
              </select>
            </div>

            {estadisticasUsuario && selectedUserId && (
              <div className="bg-slate-800 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-3xl"
                    style={{ backgroundColor: `${getColorHex(estadisticasUsuario.usuario.color)}30` }}
                  >
                    {estadisticasUsuario.usuario.avatar}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">{estadisticasUsuario.usuario.nombre}</h3>
                    <p className="text-sm text-slate-400">Estadísticas completas</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <p className="text-slate-400 text-xs mb-1">Total Rondas</p>
                    <p className="text-3xl font-bold text-white">{estadisticasUsuario.totalRondas}</p>
                  </div>
                  <div className="bg-emerald-500/20 rounded-lg p-4">
                    <p className="text-emerald-400 text-xs mb-1">Total Realizado</p>
                    <p className="text-3xl font-bold text-emerald-400">{estadisticasUsuario.totalRealizado}</p>
                  </div>
                  <div className="bg-red-500/20 rounded-lg p-4">
                    <p className="text-red-400 text-xs mb-1">Total Cancelado</p>
                    <p className="text-3xl font-bold text-red-400">{estadisticasUsuario.totalCancelado}</p>
                  </div>
                  <div className="bg-blue-500/20 rounded-lg p-4">
                    <p className="text-blue-400 text-xs mb-1">Total Agendado</p>
                    <p className="text-3xl font-bold text-blue-400">{estadisticasUsuario.totalAgendado}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-slate-700/50 rounded-lg p-3">
                    <p className="text-slate-400 text-xs">Promedio/Ronda</p>
                    <p className="text-xl font-bold text-white">{estadisticasUsuario.promedioGuiasPorRonda}</p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-3">
                    <p className="text-slate-400 text-xs">Tiempo Prom.</p>
                    <p className="text-xl font-bold text-white">{estadisticasUsuario.tiempoPromedioRonda}min</p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-3">
                    <p className="text-slate-400 text-xs">Tasa Cancel.</p>
                    <p className={`text-xl font-bold ${estadisticasUsuario.tasaCancelacion > 10 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {estadisticasUsuario.tasaCancelacion}%
                    </p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-3">
                    <p className="text-slate-400 text-xs">Días Trabajados</p>
                    <p className="text-xl font-bold text-white">{estadisticasUsuario.diasTrabajados}</p>
                  </div>
                </div>

                {estadisticasUsuario.mejorDia && (
                  <div className="bg-amber-500/20 rounded-lg p-4 flex items-center gap-3">
                    <span className="text-2xl">🏆</span>
                    <div>
                      <p className="text-amber-400 text-sm">Mejor día</p>
                      <p className="text-white font-medium">
                        {estadisticasUsuario.mejorDia.fecha} - {estadisticasUsuario.mejorDia.total} realizados
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!selectedUserId && (
              <div className="text-center py-12 bg-slate-800 rounded-xl">
                <BarChart3 className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                <p className="text-slate-400">Selecciona un usuario para ver sus estadísticas</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
              </h3>
              <button
                onClick={() => {
                  setShowUserModal(false);
                  setEditingUser(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Nombre</label>
                <input
                  type="text"
                  value={userForm.nombre}
                  onChange={(e) => setUserForm({ ...userForm, nombre: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                  placeholder="Nombre del usuario"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Avatar</label>
                <div className="flex flex-wrap gap-2">
                  {AVATARES.map((avatar) => (
                    <button
                      key={avatar}
                      type="button"
                      onClick={() => setUserForm({ ...userForm, avatar })}
                      className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${
                        userForm.avatar === avatar
                          ? 'bg-amber-500 scale-110'
                          : 'bg-slate-700 hover:bg-slate-600'
                      }`}
                    >
                      {avatar}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Color</label>
                <div className="flex flex-wrap gap-2">
                  {COLORES_USUARIO.map((color) => (
                    <button
                      key={color.id}
                      type="button"
                      onClick={() => setUserForm({ ...userForm, color: color.id })}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                        userForm.color === color.id ? 'ring-2 ring-white scale-110' : ''
                      }`}
                      style={{ backgroundColor: color.hex }}
                    >
                      {userForm.color === color.id && <Check className="w-5 h-5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Meta Diaria</label>
                <input
                  type="number"
                  value={userForm.metaDiaria}
                  onChange={(e) => setUserForm({ ...userForm, metaDiaria: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                  min="1"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowUserModal(false);
                    setEditingUser(null);
                  }}
                  className="flex-1 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                >
                  {editingUser ? 'Guardar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

const ProcesosTab: React.FC = () => {
  const { pantallaActual, adminAutenticado, usuarioActual } = useProcesosStore();

  // Admin autenticado -> Panel Admin
  if (adminAutenticado) {
    return <PantallaAdmin />;
  }

  // Usuario seleccionado -> Pantalla de trabajo
  if (usuarioActual && pantallaActual === 'trabajo') {
    return <PantallaTrabajo />;
  }

  // Por defecto -> Selección de usuario
  return <PantallaSeleccion />;
};

export default ProcesosTab;
