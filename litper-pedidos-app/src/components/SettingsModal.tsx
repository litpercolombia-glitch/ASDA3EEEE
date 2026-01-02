import React, { useState } from 'react';
import { X, User, Clock, Plus, Trash2, Check } from 'lucide-react';
import { useAppStore, COLORES_USUARIO, AVATARES, TIEMPOS_PRESET } from '../stores/appStore';

interface SettingsModalProps {
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const {
    usuarios,
    usuarioActual,
    agregarUsuario,
    eliminarUsuario,
    seleccionarUsuario,
    configTimer,
    setConfigTimer,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'usuario' | 'timer'>('usuario');
  const [showNewUser, setShowNewUser] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserAvatar, setNewUserAvatar] = useState('😊');
  const [newUserColor, setNewUserColor] = useState(COLORES_USUARIO[0].hex);

  const handleAddUser = () => {
    if (!newUserName.trim()) return;

    agregarUsuario({
      nombre: newUserName.trim(),
      avatar: newUserAvatar,
      color: newUserColor,
      metaDiaria: 100,
      rol: 'usuario',
    });

    setNewUserName('');
    setNewUserAvatar('😊');
    setNewUserColor(COLORES_USUARIO[0].hex);
    setShowNewUser(false);
  };

  const handleSelectUser = (userId: string) => {
    seleccionarUsuario(userId);
  };

  const handleDeleteUser = (userId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('¿Eliminar este usuario?')) {
      eliminarUsuario(userId);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-800 rounded-xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl border border-dark-700">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-dark-700">
          <h2 className="text-lg font-bold text-white">⚙️ Configuración</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-dark-700 text-dark-400 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-dark-700">
          <button
            onClick={() => setActiveTab('usuario')}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-all ${
              activeTab === 'usuario'
                ? 'text-primary-400 border-b-2 border-primary-400'
                : 'text-dark-400 hover:text-white'
            }`}
          >
            <User className="w-4 h-4 inline mr-2" />
            Usuario
          </button>
          <button
            onClick={() => setActiveTab('timer')}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-all ${
              activeTab === 'timer'
                ? 'text-primary-400 border-b-2 border-primary-400'
                : 'text-dark-400 hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4 inline mr-2" />
            Timer
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'usuario' && (
            <div className="space-y-4">
              {/* Usuario actual */}
              <div>
                <h3 className="text-sm font-medium text-dark-400 mb-2">Usuario Actual</h3>
                {usuarioActual ? (
                  <div className="p-3 bg-dark-700 rounded-lg flex items-center gap-3">
                    <span className="text-2xl" style={{ color: usuarioActual.color }}>
                      {usuarioActual.avatar}
                    </span>
                    <div>
                      <p className="font-medium text-white">{usuarioActual.nombre}</p>
                      <p className="text-xs text-dark-400">Activo</p>
                    </div>
                    <Check className="w-5 h-5 text-green-400 ml-auto" />
                  </div>
                ) : (
                  <div className="p-3 bg-dark-700/50 rounded-lg text-center text-dark-400">
                    Sin usuario seleccionado
                  </div>
                )}
              </div>

              {/* Lista de usuarios */}
              <div>
                <h3 className="text-sm font-medium text-dark-400 mb-2">Usuarios Disponibles</h3>
                <div className="space-y-2">
                  {usuarios.map((usuario) => (
                    <div
                      key={usuario.id}
                      onClick={() => handleSelectUser(usuario.id)}
                      className={`p-3 rounded-lg flex items-center gap-3 cursor-pointer transition-all ${
                        usuarioActual?.id === usuario.id
                          ? 'bg-primary-500/20 border border-primary-500/50'
                          : 'bg-dark-700/50 hover:bg-dark-700'
                      }`}
                    >
                      <span className="text-xl" style={{ color: usuario.color }}>
                        {usuario.avatar}
                      </span>
                      <span className="font-medium text-white flex-1">{usuario.nombre}</span>
                      <button
                        onClick={(e) => handleDeleteUser(usuario.id, e)}
                        className="p-1 rounded hover:bg-red-500/20 text-dark-500 hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  {usuarios.length === 0 && !showNewUser && (
                    <p className="text-sm text-dark-500 text-center py-4">
                      No hay usuarios. Crea uno nuevo.
                    </p>
                  )}
                </div>
              </div>

              {/* Crear nuevo usuario */}
              {showNewUser ? (
                <div className="p-4 bg-dark-700 rounded-lg space-y-3">
                  <h4 className="text-sm font-medium text-white">Nuevo Usuario</h4>

                  <input
                    type="text"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="Nombre del usuario"
                    className="w-full px-3 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:border-primary-500"
                  />

                  <div>
                    <p className="text-xs text-dark-400 mb-2">Avatar</p>
                    <div className="flex flex-wrap gap-2">
                      {AVATARES.map((avatar) => (
                        <button
                          key={avatar}
                          onClick={() => setNewUserAvatar(avatar)}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-all ${
                            newUserAvatar === avatar
                              ? 'bg-primary-500 ring-2 ring-primary-400'
                              : 'bg-dark-800 hover:bg-dark-600'
                          }`}
                        >
                          {avatar}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-dark-400 mb-2">Color</p>
                    <div className="flex flex-wrap gap-2">
                      {COLORES_USUARIO.map((color) => (
                        <button
                          key={color.id}
                          onClick={() => setNewUserColor(color.hex)}
                          className={`w-8 h-8 rounded-lg transition-all ${
                            newUserColor === color.hex ? 'ring-2 ring-white' : ''
                          }`}
                          style={{ backgroundColor: color.hex }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setShowNewUser(false)}
                      className="flex-1 px-4 py-2 bg-dark-600 hover:bg-dark-500 text-white rounded-lg text-sm font-medium transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleAddUser}
                      disabled={!newUserName.trim()}
                      className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-all"
                    >
                      Crear
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowNewUser(true)}
                  className="w-full px-4 py-3 bg-dark-700/50 hover:bg-dark-700 text-dark-400 hover:text-white rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Crear Usuario
                </button>
              )}
            </div>
          )}

          {activeTab === 'timer' && (
            <div className="space-y-4">
              {/* Duración del timer */}
              <div>
                <h3 className="text-sm font-medium text-dark-400 mb-2">Duración (minutos)</h3>
                <div className="grid grid-cols-3 gap-2">
                  {TIEMPOS_PRESET.map((tiempo) => (
                    <button
                      key={tiempo}
                      onClick={() => setConfigTimer({ duracionMinutos: tiempo })}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        configTimer.duracionMinutos === tiempo
                          ? 'bg-primary-500 text-white'
                          : 'bg-dark-700 text-dark-400 hover:text-white hover:bg-dark-600'
                      }`}
                    >
                      {tiempo} min
                    </button>
                  ))}
                </div>
              </div>

              {/* Alertas */}
              <div>
                <h3 className="text-sm font-medium text-dark-400 mb-3">Alertas de Color</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-yellow-400">🟡 Amarillo</span>
                    <span className="text-sm text-dark-400">&lt; {configTimer.alertaAmarilla}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-orange-400">🟠 Naranja</span>
                    <span className="text-sm text-dark-400">&lt; {configTimer.alertaNaranja}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-red-400">🔴 Rojo</span>
                    <span className="text-sm text-dark-400">&lt; {configTimer.alertaRoja}%</span>
                  </div>
                </div>
              </div>

              {/* Sonido */}
              <div>
                <h3 className="text-sm font-medium text-dark-400 mb-2">Sonido al Finalizar</h3>
                <button
                  onClick={() => setConfigTimer({ sonidoFinal: !configTimer.sonidoFinal })}
                  className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    configTimer.sonidoFinal
                      ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                      : 'bg-dark-700 text-dark-400'
                  }`}
                >
                  {configTimer.sonidoFinal ? '🔔 Sonido Activado' : '🔕 Sonido Desactivado'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-dark-700">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg font-medium transition-all"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
