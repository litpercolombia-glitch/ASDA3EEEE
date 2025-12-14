// components/auth/UserProfilePanel.tsx
// Panel de perfil de usuario con información y configuraciones
import React, { useState } from 'react';
import {
  User,
  Mail,
  Shield,
  Calendar,
  Clock,
  LogOut,
  Settings,
  Bell,
  Moon,
  Sun,
  Key,
  Camera,
  Edit3,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  History,
  Activity,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { User as UserType } from '../../services/authService';

interface UserProfilePanelProps {
  onClose?: () => void;
  compact?: boolean;
}

export const UserProfilePanel: React.FC<UserProfilePanelProps> = ({
  onClose,
  compact = false,
}) => {
  const { user, logout, updateProfile, changePassword, isLoading, error, clearError } = useAuthStore();

  const [isEditing, setIsEditing] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [editedName, setEditedName] = useState(user?.nombre || '');
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: '',
  });
  const [showPasswords, setShowPasswords] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  if (!user) return null;

  const handleUpdateProfile = async () => {
    if (editedName.trim()) {
      const success = await updateProfile({ nombre: editedName });
      if (success) {
        setIsEditing(false);
        setSuccessMessage('Perfil actualizado correctamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    }
  };

  const handleChangePassword = async () => {
    clearError();

    if (passwordData.new !== passwordData.confirm) {
      return;
    }

    if (passwordData.new.length < 6) {
      return;
    }

    const success = await changePassword(passwordData.current, passwordData.new);
    if (success) {
      setShowChangePassword(false);
      setPasswordData({ current: '', new: '', confirm: '' });
      setSuccessMessage('Contraseña actualizada correctamente');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const getRoleBadge = (rol: string) => {
    switch (rol) {
      case 'admin':
        return { label: 'Administrador', color: 'purple', icon: Shield };
      case 'operador':
        return { label: 'Operador', color: 'blue', icon: User };
      case 'viewer':
        return { label: 'Visor', color: 'slate', icon: Eye };
      default:
        return { label: rol, color: 'slate', icon: User };
    }
  };

  const roleBadge = getRoleBadge(user.rol);
  const RoleIcon = roleBadge.icon;

  // Modo compacto (para header)
  if (compact) {
    return (
      <div className="flex items-center gap-3 p-2">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold">
          {user.nombre.charAt(0).toUpperCase()}
        </div>
        <div className="hidden md:block">
          <p className="font-medium text-slate-800 dark:text-white text-sm">{user.nombre}</p>
          <p className="text-xs text-slate-500">{user.email}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-700 overflow-hidden">
      {/* Header */}
      <div className="relative p-6 bg-gradient-to-r from-purple-600 to-indigo-600">
        {/* Fondo decorativo */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-1/2 -translate-x-1/2"></div>
        </div>

        <div className="relative flex items-start justify-between">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-3xl font-bold border-2 border-white/30">
                {user.nombre.charAt(0).toUpperCase()}
              </div>
              <button className="absolute -bottom-1 -right-1 p-1.5 bg-white rounded-lg shadow-lg hover:bg-slate-50 transition-colors">
                <Camera className="w-4 h-4 text-slate-600" />
              </button>
            </div>

            <div>
              {isEditing ? (
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg px-3 py-1.5 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
                  autoFocus
                />
              ) : (
                <h2 className="text-xl font-bold text-white">{user.nombre}</h2>
              )}
              <p className="text-purple-200 text-sm mt-0.5">{user.email}</p>
              <div className={`inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full bg-${roleBadge.color}-500/20 text-white text-xs font-medium`}>
                <RoleIcon className="w-3.5 h-3.5" />
                {roleBadge.label}
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleUpdateProfile}
                  disabled={isLoading}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-colors"
                >
                  <Save className="w-5 h-5" />
                </button>
                <button
                  onClick={() => { setIsEditing(false); setEditedName(user.nombre); }}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-colors"
              >
                <Edit3 className="w-5 h-5" />
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mensajes */}
      {successMessage && (
        <div className="mx-6 mt-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-500" />
          <p className="text-sm text-emerald-700 dark:text-emerald-400">{successMessage}</p>
        </div>
      )}

      {error && (
        <div className="mx-6 mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Contenido */}
      <div className="p-6 space-y-6">
        {/* Información de la cuenta */}
        <div>
          <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-purple-500" />
            Información de la Cuenta
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-navy-800 rounded-lg">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-600 dark:text-slate-400">Email</span>
              </div>
              <span className="text-sm font-medium text-slate-800 dark:text-white">{user.email}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-navy-800 rounded-lg">
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-600 dark:text-slate-400">Miembro desde</span>
              </div>
              <span className="text-sm font-medium text-slate-800 dark:text-white">
                {new Date(user.createdAt).toLocaleDateString('es-CO', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>

            {user.lastLogin && (
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-navy-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-600 dark:text-slate-400">Última sesión</span>
                </div>
                <span className="text-sm font-medium text-slate-800 dark:text-white">
                  {new Date(user.lastLogin).toLocaleString('es-CO')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Cambiar contraseña */}
        <div>
          <button
            onClick={() => setShowChangePassword(!showChangePassword)}
            className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-navy-800 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-700 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Key className="w-5 h-5 text-amber-500" />
              <span className="font-medium text-slate-800 dark:text-white">Cambiar contraseña</span>
            </div>
            <Settings className={`w-5 h-5 text-slate-400 transition-transform ${showChangePassword ? 'rotate-90' : ''}`} />
          </button>

          {showChangePassword && (
            <div className="mt-4 p-4 bg-slate-50 dark:bg-navy-800 rounded-lg space-y-4 animate-fade-in">
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                  Contraseña actual
                </label>
                <div className="relative">
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    value={passwordData.current}
                    onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-600 rounded-lg
                      focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                  Nueva contraseña
                </label>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={passwordData.new}
                  onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-600 rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    value={passwordData.confirm}
                    onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-600 rounded-lg
                      focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(!showPasswords)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPasswords ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {passwordData.new && passwordData.confirm && passwordData.new !== passwordData.confirm && (
                <p className="text-red-500 text-sm">Las contraseñas no coinciden</p>
              )}

              <button
                onClick={handleChangePassword}
                disabled={isLoading || !passwordData.current || !passwordData.new || passwordData.new !== passwordData.confirm}
                className="w-full py-2.5 bg-purple-500 text-white font-medium rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Actualizando...' : 'Actualizar contraseña'}
              </button>
            </div>
          )}
        </div>

        {/* Cerrar sesión */}
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors font-medium"
        >
          <LogOut className="w-5 h-5" />
          Cerrar sesión
        </button>
      </div>
    </div>
  );
};

export default UserProfilePanel;
