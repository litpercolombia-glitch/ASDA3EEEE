// components/settings/UserProfileSettings.tsx
// Panel de configuración de perfil de usuario profesional

import React, { useState, useRef } from 'react';
import {
  User,
  Mail,
  Phone,
  Building2,
  Briefcase,
  MapPin,
  Globe,
  Camera,
  Save,
  X,
  Check,
  Bell,
  Volume2,
  Moon,
  Sun,
  Palette,
  Shield,
  Key,
  Trash2,
  LogOut,
  ChevronRight,
  Sparkles,
  Crown,
} from 'lucide-react';
import {
  useUserProfileStore,
  Gender,
  AVATAR_COLORS,
  getGenderLabel,
} from '../../services/userProfileService';

interface UserProfileSettingsProps {
  onClose?: () => void;
  onLogout?: () => void;
}

export const UserProfileSettings: React.FC<UserProfileSettingsProps> = ({
  onClose,
  onLogout,
}) => {
  const { profile, updateProfile, setAvatarColor, getInitials } = useUserProfileStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'notifications' | 'security'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [saved, setSaved] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    nombre: profile?.nombre || '',
    apellido: profile?.apellido || '',
    email: profile?.email || '',
    telefono: profile?.telefono || '',
    empresa: profile?.empresa || '',
    cargo: profile?.cargo || '',
    ciudad: profile?.ciudad || '',
    genero: profile?.genero || 'prefer_not_say' as Gender,
  });

  const handleSave = () => {
    updateProfile(formData);
    setIsEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateProfile({ avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const selectedColor = AVATAR_COLORS.find(c => c.id === profile?.avatarColor) || AVATAR_COLORS[0];

  const tabs = [
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'preferences', label: 'Preferencias', icon: Palette },
    { id: 'notifications', label: 'Notificaciones', icon: Bell },
    { id: 'security', label: 'Seguridad', icon: Shield },
  ];

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-700 overflow-hidden max-w-4xl w-full mx-auto shadow-2xl">
      {/* Header */}
      <div className="relative p-6 border-b border-gray-700">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-cyan-500/10" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
              {profile?.avatar ? (
                <img
                  src={profile.avatar}
                  alt="Avatar"
                  className="w-20 h-20 rounded-2xl object-cover border-4 border-gray-700 group-hover:border-amber-500 transition-colors"
                />
              ) : (
                <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${selectedColor.bg} flex items-center justify-center border-4 border-gray-700 group-hover:border-amber-500 transition-all group-hover:scale-105`}>
                  <span className="text-2xl font-bold text-white">{getInitials()}</span>
                </div>
              )}
              <div className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                {profile?.nombre || 'Usuario'}
                <Crown className="w-5 h-5 text-amber-500" />
              </h2>
              <p className="text-gray-400 text-sm">{profile?.email || 'usuario@litper.co'}</p>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 mt-1 bg-amber-500/20 text-amber-400 text-xs font-medium rounded-full">
                <Sparkles className="w-3 h-3" />
                LITPER PRO
              </span>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700 bg-gray-800/50">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-4 px-4 flex items-center justify-center gap-2 font-medium transition-all ${
              activeTab === tab.id
                ? 'text-amber-400 border-b-2 border-amber-500 bg-amber-500/10'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-6 max-h-[500px] overflow-y-auto">
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Información Personal</h3>
              <button
                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all ${
                  isEditing
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {isEditing ? (
                  <>
                    <Save className="w-4 h-4" />
                    Guardar
                  </>
                ) : (
                  <>
                    <span>Editar</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            {saved && (
              <div className="flex items-center gap-2 p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-emerald-400">
                <Check className="w-5 h-5" />
                <span>Cambios guardados correctamente</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  Nombre
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  disabled={!isEditing}
                  className={`w-full px-4 py-3 rounded-xl border ${
                    isEditing
                      ? 'bg-gray-800 border-gray-600 text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
                      : 'bg-gray-800/50 border-gray-700 text-gray-300'
                  } transition-all`}
                />
              </div>

              {/* Apellido */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Apellido
                </label>
                <input
                  type="text"
                  value={formData.apellido}
                  onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                  disabled={!isEditing}
                  className={`w-full px-4 py-3 rounded-xl border ${
                    isEditing
                      ? 'bg-gray-800 border-gray-600 text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
                      : 'bg-gray-800/50 border-gray-700 text-gray-300'
                  } transition-all`}
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={!isEditing}
                  className={`w-full px-4 py-3 rounded-xl border ${
                    isEditing
                      ? 'bg-gray-800 border-gray-600 text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
                      : 'bg-gray-800/50 border-gray-700 text-gray-300'
                  } transition-all`}
                />
              </div>

              {/* Teléfono */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  <Phone className="w-4 h-4 inline mr-2" />
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  disabled={!isEditing}
                  className={`w-full px-4 py-3 rounded-xl border ${
                    isEditing
                      ? 'bg-gray-800 border-gray-600 text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
                      : 'bg-gray-800/50 border-gray-700 text-gray-300'
                  } transition-all`}
                />
              </div>

              {/* Empresa */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  <Building2 className="w-4 h-4 inline mr-2" />
                  Empresa
                </label>
                <input
                  type="text"
                  value={formData.empresa}
                  onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                  disabled={!isEditing}
                  className={`w-full px-4 py-3 rounded-xl border ${
                    isEditing
                      ? 'bg-gray-800 border-gray-600 text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
                      : 'bg-gray-800/50 border-gray-700 text-gray-300'
                  } transition-all`}
                />
              </div>

              {/* Cargo */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  <Briefcase className="w-4 h-4 inline mr-2" />
                  Cargo
                </label>
                <input
                  type="text"
                  value={formData.cargo}
                  onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                  disabled={!isEditing}
                  className={`w-full px-4 py-3 rounded-xl border ${
                    isEditing
                      ? 'bg-gray-800 border-gray-600 text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
                      : 'bg-gray-800/50 border-gray-700 text-gray-300'
                  } transition-all`}
                />
              </div>

              {/* Ciudad */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  <MapPin className="w-4 h-4 inline mr-2" />
                  Ciudad
                </label>
                <input
                  type="text"
                  value={formData.ciudad}
                  onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                  disabled={!isEditing}
                  className={`w-full px-4 py-3 rounded-xl border ${
                    isEditing
                      ? 'bg-gray-800 border-gray-600 text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
                      : 'bg-gray-800/50 border-gray-700 text-gray-300'
                  } transition-all`}
                />
              </div>

              {/* Género */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Género
                </label>
                <select
                  value={formData.genero}
                  onChange={(e) => setFormData({ ...formData, genero: e.target.value as Gender })}
                  disabled={!isEditing}
                  className={`w-full px-4 py-3 rounded-xl border ${
                    isEditing
                      ? 'bg-gray-800 border-gray-600 text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
                      : 'bg-gray-800/50 border-gray-700 text-gray-300'
                  } transition-all`}
                >
                  <option value="male">Masculino</option>
                  <option value="female">Femenino</option>
                  <option value="other">Otro</option>
                  <option value="prefer_not_say">Prefiero no decir</option>
                </select>
              </div>
            </div>

            {/* Avatar Color */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-3">
                Color de Avatar
              </label>
              <div className="flex flex-wrap gap-3">
                {AVATAR_COLORS.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => setAvatarColor(color.id)}
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color.bg} transition-all transform hover:scale-110 ${
                      profile?.avatarColor === color.id
                        ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-900 scale-110'
                        : ''
                    }`}
                  >
                    {profile?.avatarColor === color.id && (
                      <Check className="w-5 h-5 text-white mx-auto" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Preferences Tab */}
        {activeTab === 'preferences' && (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-lg font-bold text-white">Preferencias de Aplicación</h3>

            <div className="space-y-4">
              {/* Tema */}
              <div className="flex items-center justify-between p-4 bg-gray-800 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-700 rounded-lg">
                    <Moon className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Tema Oscuro</p>
                    <p className="text-sm text-gray-400">Interfaz en modo oscuro</p>
                  </div>
                </div>
                <button className="w-12 h-6 bg-amber-500 rounded-full relative">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                </button>
              </div>

              {/* Idioma */}
              <div className="flex items-center justify-between p-4 bg-gray-800 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-700 rounded-lg">
                    <Globe className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Idioma</p>
                    <p className="text-sm text-gray-400">Español (Colombia)</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-500" />
              </div>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-lg font-bold text-white">Configuración de Notificaciones</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-800 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-700 rounded-lg">
                    <Bell className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Notificaciones Push</p>
                    <p className="text-sm text-gray-400">Recibir alertas en tiempo real</p>
                  </div>
                </div>
                <button className="w-12 h-6 bg-amber-500 rounded-full relative">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-800 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-700 rounded-lg">
                    <Mail className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Notificaciones Email</p>
                    <p className="text-sm text-gray-400">Resumen diario por correo</p>
                  </div>
                </div>
                <button className="w-12 h-6 bg-amber-500 rounded-full relative">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-800 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-700 rounded-lg">
                    <Volume2 className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Sonidos</p>
                    <p className="text-sm text-gray-400">Sonido en alertas</p>
                  </div>
                </div>
                <button className="w-12 h-6 bg-gray-600 rounded-full relative">
                  <div className="absolute left-1 top-1 w-4 h-4 bg-gray-400 rounded-full" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-lg font-bold text-white">Seguridad de la Cuenta</h3>

            <div className="space-y-4">
              <button className="w-full flex items-center justify-between p-4 bg-gray-800 rounded-xl hover:bg-gray-700 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-700 rounded-lg">
                    <Key className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-white font-medium">Cambiar Contraseña</p>
                    <p className="text-sm text-gray-400">Actualizar credenciales</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-500" />
              </button>

              {onLogout && (
                <button
                  onClick={onLogout}
                  className="w-full flex items-center justify-between p-4 bg-red-500/10 border border-red-500/30 rounded-xl hover:bg-red-500/20 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-500/20 rounded-lg">
                      <LogOut className="w-5 h-5 text-red-400" />
                    </div>
                    <div className="text-left">
                      <p className="text-red-400 font-medium">Cerrar Sesión</p>
                      <p className="text-sm text-red-400/70">Salir de la cuenta</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-red-400" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* CSS */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default UserProfileSettings;
