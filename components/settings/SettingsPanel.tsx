// components/settings/SettingsPanel.tsx
// Panel de Configuración Premium - Estilo Notion/Stripe/Linear
import React, { useState } from 'react';
import {
  User,
  Shield,
  Users,
  Palette,
  Link2,
  CreditCard,
  Bell,
  Globe,
  Clock,
  Camera,
  Mail,
  Lock,
  Smartphone,
  Key,
  Monitor,
  MapPin,
  LogOut,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  ChevronRight,
  Search,
  MoreHorizontal,
  Crown,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Laptop,
  Fingerprint,
  History,
  AlertTriangle,
  CheckCircle,
  Info,
  Settings,
  Webhook,
  Truck,
  Database,
  Download,
  Upload,
  RefreshCw,
  Copy,
  ExternalLink,
  QrCode,
} from 'lucide-react';

// Tipos
interface Session {
  id: string;
  device: string;
  browser: string;
  location: string;
  ip: string;
  lastActive: string;
  isCurrent: boolean;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'operator' | 'viewer';
  status: 'active' | 'pending' | 'inactive';
  lastAccess: string;
  avatar?: string;
}

interface ActivityLog {
  id: string;
  action: string;
  description: string;
  timestamp: string;
  icon: 'login' | 'password' | 'device' | 'settings';
}

type SettingsSection = 'profile' | 'security' | 'team' | 'appearance' | 'integrations' | 'billing';
type Theme = 'dark' | 'light' | 'system';
type AccentColor = 'orange' | 'blue' | 'purple' | 'green' | 'pink' | 'cyan';

// Datos de ejemplo
const MOCK_SESSIONS: Session[] = [
  { id: '1', device: 'MacBook Pro', browser: 'Chrome 120', location: 'Bogotá, Colombia', ip: '192.168.1.***', lastActive: 'Ahora', isCurrent: true },
  { id: '2', device: 'iPhone 15', browser: 'Safari Mobile', location: 'Bogotá, Colombia', ip: '192.168.1.***', lastActive: 'Hace 2 horas', isCurrent: false },
  { id: '3', device: 'Windows PC', browser: 'Edge 120', location: 'Medellín, Colombia', ip: '10.0.0.***', lastActive: 'Hace 1 día', isCurrent: false },
];

const MOCK_TEAM: TeamMember[] = [
  { id: '1', name: 'Dayana García', email: 'dayana@litper.com', role: 'admin', status: 'active', lastAccess: 'Hace 5 min' },
  { id: '2', name: 'Carlos López', email: 'carlos@litper.com', role: 'operator', status: 'active', lastAccess: 'Hace 1 hora' },
  { id: '3', name: 'María Rodríguez', email: 'maria@litper.com', role: 'viewer', status: 'pending', lastAccess: 'Nunca' },
];

const MOCK_ACTIVITY: ActivityLog[] = [
  { id: '1', action: 'Inicio de sesión exitoso', description: 'Chrome en MacBook Pro', timestamp: 'Hace 5 minutos', icon: 'login' },
  { id: '2', action: 'Contraseña actualizada', description: 'Cambio de contraseña exitoso', timestamp: 'Hace 2 días', icon: 'password' },
  { id: '3', action: 'Nuevo dispositivo detectado', description: 'iPhone 15 - Bogotá', timestamp: 'Hace 1 semana', icon: 'device' },
  { id: '4', action: '2FA activado', description: 'Autenticación por SMS', timestamp: 'Hace 2 semanas', icon: 'settings' },
];

const ACCENT_COLORS: { id: AccentColor; name: string; color: string; class: string }[] = [
  { id: 'orange', name: 'Naranja LITPER', color: '#f97316', class: 'bg-orange-500' },
  { id: 'blue', name: 'Azul', color: '#3b82f6', class: 'bg-blue-500' },
  { id: 'purple', name: 'Púrpura', color: '#8b5cf6', class: 'bg-purple-500' },
  { id: 'green', name: 'Verde', color: '#10b981', class: 'bg-emerald-500' },
  { id: 'pink', name: 'Rosa', color: '#ec4899', class: 'bg-pink-500' },
  { id: 'cyan', name: 'Cyan', color: '#06b6d4', class: 'bg-cyan-500' },
];

const ROLE_CONFIG = {
  admin: { label: 'Administrador', color: 'amber', permissions: 'Acceso completo' },
  operator: { label: 'Operador', color: 'blue', permissions: 'Seguimiento y gestión' },
  viewer: { label: 'Visualizador', color: 'slate', permissions: 'Solo lectura' },
};

export const SettingsPanel: React.FC = () => {
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile');
  const [theme, setTheme] = useState<Theme>('dark');
  const [accentColor, setAccentColor] = useState<AccentColor>('orange');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [compactMode, setCompactMode] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    weekly: true,
  });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [searchTeam, setSearchTeam] = useState('');

  const sections = [
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'security', label: 'Seguridad', icon: Shield },
    { id: 'team', label: 'Equipo', icon: Users },
    { id: 'appearance', label: 'Apariencia', icon: Palette },
    { id: 'integrations', label: 'Integraciones', icon: Link2 },
    { id: 'billing', label: 'Facturación', icon: CreditCard },
  ];

  const renderProfile = () => (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Perfil Personal</h2>
        <p className="text-white/50">Administra tu información personal y preferencias</p>
      </div>

      {/* Avatar y nombre */}
      <div className="flex items-start gap-6 p-6 bg-white/[0.02] rounded-2xl border border-white/[0.05]">
        <div className="relative group">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white text-3xl font-bold">
            DG
          </div>
          <button className="absolute inset-0 bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Camera className="w-6 h-6 text-white" />
          </button>
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-white mb-1">Dayana García</h3>
          <p className="text-white/50 mb-4">dayana@litper.com</p>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-sm font-medium">
              Admin
            </span>
            <span className="text-white/30 text-sm">• Último acceso: Hace 5 min</span>
          </div>
        </div>
        <button className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-white transition-colors">
          <Edit3 className="w-4 h-4" />
        </button>
      </div>

      {/* Información personal */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Información Personal</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.05]">
            <label className="block text-sm text-white/50 mb-2">Nombre completo</label>
            <input
              type="text"
              defaultValue="Dayana García"
              className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500/50"
            />
          </div>
          <div className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.05]">
            <label className="block text-sm text-white/50 mb-2">Correo electrónico</label>
            <input
              type="email"
              defaultValue="dayana@litper.com"
              className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500/50"
            />
          </div>
          <div className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.05]">
            <label className="block text-sm text-white/50 mb-2">Teléfono</label>
            <input
              type="tel"
              defaultValue="+57 300 123 4567"
              className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500/50"
            />
          </div>
          <div className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.05]">
            <label className="block text-sm text-white/50 mb-2">Empresa</label>
            <input
              type="text"
              defaultValue="LITPER Colombia"
              className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500/50"
            />
          </div>
        </div>
      </div>

      {/* Preferencias regionales */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Preferencias Regionales</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.05]">
            <label className="block text-sm text-white/50 mb-2 flex items-center gap-2">
              <Globe className="w-4 h-4" /> Idioma
            </label>
            <select className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500/50">
              <option value="es">Español (Colombia)</option>
              <option value="en">English (US)</option>
              <option value="pt">Português (Brasil)</option>
            </select>
          </div>
          <div className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.05]">
            <label className="block text-sm text-white/50 mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Zona horaria
            </label>
            <select className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500/50">
              <option value="bogota">Bogotá (UTC-5)</option>
              <option value="mexico">Ciudad de México (UTC-6)</option>
              <option value="lima">Lima (UTC-5)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notificaciones */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Bell className="w-5 h-5" /> Notificaciones
        </h3>

        <div className="space-y-3">
          {[
            { key: 'email', label: 'Notificaciones por email', desc: 'Recibe alertas de envíos en tu correo' },
            { key: 'push', label: 'Notificaciones push', desc: 'Alertas en tiempo real en el navegador' },
            { key: 'sms', label: 'Notificaciones SMS', desc: 'Mensajes de texto para alertas críticas' },
            { key: 'weekly', label: 'Resumen semanal', desc: 'Reporte de rendimiento cada lunes' },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl border border-white/[0.05]">
              <div>
                <p className="text-white font-medium">{item.label}</p>
                <p className="text-sm text-white/40">{item.desc}</p>
              </div>
              <button
                onClick={() => setNotifications({ ...notifications, [item.key]: !notifications[item.key as keyof typeof notifications] })}
                className={`relative w-12 h-7 rounded-full transition-colors ${
                  notifications[item.key as keyof typeof notifications] ? 'bg-amber-500' : 'bg-white/10'
                }`}
              >
                <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
                  notifications[item.key as keyof typeof notifications] ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSecurity = () => (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Seguridad</h2>
        <p className="text-white/50">Protege tu cuenta y gestiona el acceso</p>
      </div>

      {/* Contraseña */}
      <div className="p-6 bg-white/[0.02] rounded-2xl border border-white/[0.05] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-amber-500/20">
              <Lock className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Contraseña</h3>
              <p className="text-sm text-white/40">Última actualización: hace 30 días</p>
            </div>
          </div>
          <button className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-white transition-colors">
            Cambiar
          </button>
        </div>
      </div>

      {/* 2FA */}
      <div className="p-6 bg-white/[0.02] rounded-2xl border border-white/[0.05] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-emerald-500/20">
              <Smartphone className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Autenticación de dos factores (2FA)</h3>
              <p className="text-sm text-white/40">
                {twoFactorEnabled ? 'Activo - SMS al +57 ***4567' : 'Inactivo - Recomendado activar'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {twoFactorEnabled && (
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-sm">
                Activo
              </span>
            )}
            <button
              onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
              className={`px-4 py-2 rounded-xl transition-colors ${
                twoFactorEnabled
                  ? 'bg-white/[0.05] hover:bg-white/[0.1] text-white'
                  : 'bg-amber-500 hover:bg-amber-600 text-white'
              }`}
            >
              {twoFactorEnabled ? 'Configurar' : 'Activar'}
            </button>
          </div>
        </div>

        {/* Métodos 2FA */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 border-t border-white/[0.05]">
          {[
            { icon: Smartphone, label: 'SMS', active: true },
            { icon: Mail, label: 'Email', active: false },
            { icon: Key, label: 'App Authenticator', active: false },
          ].map((method) => (
            <button
              key={method.label}
              className={`p-4 rounded-xl border transition-all ${
                method.active
                  ? 'bg-amber-500/10 border-amber-500/30'
                  : 'bg-white/[0.02] border-white/[0.05] hover:border-white/[0.1]'
              }`}
            >
              <method.icon className={`w-5 h-5 mb-2 ${method.active ? 'text-amber-400' : 'text-white/40'}`} />
              <p className={`text-sm font-medium ${method.active ? 'text-amber-400' : 'text-white/60'}`}>
                {method.label}
              </p>
              {method.active && <Check className="w-4 h-4 text-amber-400 mt-1" />}
            </button>
          ))}
        </div>
      </div>

      {/* Sesiones activas */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Monitor className="w-5 h-5" /> Sesiones Activas
          </h3>
          <button className="text-sm text-red-400 hover:text-red-300 transition-colors">
            Cerrar todas las demás
          </button>
        </div>

        <div className="space-y-3">
          {MOCK_SESSIONS.map((session) => (
            <div
              key={session.id}
              className={`p-4 rounded-xl border transition-all ${
                session.isCurrent
                  ? 'bg-amber-500/5 border-amber-500/20'
                  : 'bg-white/[0.02] border-white/[0.05]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${session.isCurrent ? 'bg-amber-500/20' : 'bg-white/[0.05]'}`}>
                    <Monitor className={`w-5 h-5 ${session.isCurrent ? 'text-amber-400' : 'text-white/40'}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-white font-medium">{session.device}</p>
                      {session.isCurrent && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs">
                          Sesión actual
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-white/40">{session.browser}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-white/30">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {session.location}
                      </span>
                      <span>IP: {session.ip}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-white/50">{session.lastActive}</p>
                  {!session.isCurrent && (
                    <button className="mt-2 text-sm text-red-400 hover:text-red-300 transition-colors flex items-center gap-1">
                      <LogOut className="w-3 h-3" /> Cerrar
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Historial de actividad */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <History className="w-5 h-5" /> Historial de Actividad
        </h3>

        <div className="space-y-2">
          {MOCK_ACTIVITY.map((activity) => (
            <div key={activity.id} className="flex items-center gap-4 p-4 bg-white/[0.02] rounded-xl border border-white/[0.05]">
              <div className={`p-2 rounded-lg ${
                activity.icon === 'login' ? 'bg-emerald-500/20' :
                activity.icon === 'password' ? 'bg-amber-500/20' :
                activity.icon === 'device' ? 'bg-blue-500/20' : 'bg-purple-500/20'
              }`}>
                {activity.icon === 'login' && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                {activity.icon === 'password' && <Lock className="w-4 h-4 text-amber-400" />}
                {activity.icon === 'device' && <Smartphone className="w-4 h-4 text-blue-400" />}
                {activity.icon === 'settings' && <Settings className="w-4 h-4 text-purple-400" />}
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">{activity.action}</p>
                <p className="text-sm text-white/40">{activity.description}</p>
              </div>
              <p className="text-sm text-white/30">{activity.timestamp}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderTeam = () => (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Gestión de Equipo</h2>
          <p className="text-white/50">Administra los miembros y permisos de tu equipo</p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Invitar miembro
        </button>
      </div>

      {/* Búsqueda */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
        <input
          type="text"
          value={searchTeam}
          onChange={(e) => setSearchTeam(e.target.value)}
          placeholder="Buscar por nombre o email..."
          className="w-full pl-12 pr-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-amber-500/50"
        />
      </div>

      {/* Tabla de miembros */}
      <div className="bg-white/[0.02] rounded-2xl border border-white/[0.05] overflow-hidden">
        {/* Header de tabla */}
        <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/[0.05] text-sm text-white/50 font-medium">
          <div className="col-span-4">Miembro</div>
          <div className="col-span-2">Rol</div>
          <div className="col-span-2">Estado</div>
          <div className="col-span-2">Último acceso</div>
          <div className="col-span-2 text-right">Acciones</div>
        </div>

        {/* Filas */}
        {MOCK_TEAM.filter(m =>
          m.name.toLowerCase().includes(searchTeam.toLowerCase()) ||
          m.email.toLowerCase().includes(searchTeam.toLowerCase())
        ).map((member) => (
          <div key={member.id} className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/[0.05] hover:bg-white/[0.02] transition-colors">
            <div className="col-span-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold">
                {member.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <p className="text-white font-medium">{member.name}</p>
                <p className="text-sm text-white/40">{member.email}</p>
              </div>
            </div>
            <div className="col-span-2 flex items-center">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                member.role === 'admin' ? 'bg-amber-500/20 text-amber-400' :
                member.role === 'operator' ? 'bg-blue-500/20 text-blue-400' :
                'bg-slate-500/20 text-slate-400'
              }`}>
                {ROLE_CONFIG[member.role].label}
              </span>
            </div>
            <div className="col-span-2 flex items-center">
              <span className={`px-3 py-1 rounded-full text-sm ${
                member.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' :
                member.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {member.status === 'active' ? 'Activo' : member.status === 'pending' ? 'Pendiente' : 'Inactivo'}
              </span>
            </div>
            <div className="col-span-2 flex items-center text-white/50">
              {member.lastAccess}
            </div>
            <div className="col-span-2 flex items-center justify-end gap-2">
              <button className="p-2 rounded-lg hover:bg-white/[0.05] text-white/40 hover:text-white transition-colors">
                <Edit3 className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Roles y permisos */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Roles y Permisos</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(ROLE_CONFIG).map(([key, config]) => (
            <div key={key} className="p-5 bg-white/[0.02] rounded-xl border border-white/[0.05]">
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg bg-${config.color}-500/20`}>
                  {key === 'admin' && <Crown className="w-5 h-5 text-amber-400" />}
                  {key === 'operator' && <Users className="w-5 h-5 text-blue-400" />}
                  {key === 'viewer' && <Eye className="w-5 h-5 text-slate-400" />}
                </div>
                <h4 className="text-white font-semibold">{config.label}</h4>
              </div>
              <p className="text-sm text-white/40 mb-4">{config.permissions}</p>
              <ul className="space-y-2 text-sm text-white/60">
                {key === 'admin' && (
                  <>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Gestionar equipo</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Configuración</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Facturación</li>
                  </>
                )}
                {key === 'operator' && (
                  <>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Ver envíos</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Editar estados</li>
                    <li className="flex items-center gap-2"><X className="w-4 h-4 text-red-400" /> Sin acceso a config</li>
                  </>
                )}
                {key === 'viewer' && (
                  <>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Ver dashboard</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Ver reportes</li>
                    <li className="flex items-center gap-2"><X className="w-4 h-4 text-red-400" /> Sin edición</li>
                  </>
                )}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAppearance = () => (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Apariencia</h2>
        <p className="text-white/50">Personaliza la interfaz según tus preferencias</p>
      </div>

      {/* Tema */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Tema</h3>

        <div className="grid grid-cols-3 gap-4">
          {[
            { id: 'dark', label: 'Oscuro', icon: Moon, desc: 'Ideal para uso nocturno' },
            { id: 'light', label: 'Claro', icon: Sun, desc: 'Mayor visibilidad diurna' },
            { id: 'system', label: 'Sistema', icon: Laptop, desc: 'Sigue el tema del SO' },
          ].map((option) => (
            <button
              key={option.id}
              onClick={() => setTheme(option.id as Theme)}
              className={`p-5 rounded-xl border text-left transition-all ${
                theme === option.id
                  ? 'bg-amber-500/10 border-amber-500/30'
                  : 'bg-white/[0.02] border-white/[0.05] hover:border-white/[0.1]'
              }`}
            >
              <option.icon className={`w-6 h-6 mb-3 ${theme === option.id ? 'text-amber-400' : 'text-white/40'}`} />
              <p className={`font-semibold mb-1 ${theme === option.id ? 'text-amber-400' : 'text-white'}`}>
                {option.label}
              </p>
              <p className="text-sm text-white/40">{option.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Color de acento */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Color de Acento</h3>

        <div className="flex flex-wrap gap-3">
          {ACCENT_COLORS.map((color) => (
            <button
              key={color.id}
              onClick={() => setAccentColor(color.id)}
              className={`p-4 rounded-xl border transition-all flex items-center gap-3 ${
                accentColor === color.id
                  ? 'bg-white/[0.05] border-white/20'
                  : 'bg-white/[0.02] border-white/[0.05] hover:border-white/[0.1]'
              }`}
            >
              <div className={`w-6 h-6 rounded-full ${color.class}`} />
              <span className={`text-sm font-medium ${accentColor === color.id ? 'text-white' : 'text-white/60'}`}>
                {color.name}
              </span>
              {accentColor === color.id && <Check className="w-4 h-4 text-white" />}
            </button>
          ))}
        </div>
      </div>

      {/* Opciones de interfaz */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Opciones de Interfaz</h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl border border-white/[0.05]">
            <div>
              <p className="text-white font-medium">Sidebar colapsado por defecto</p>
              <p className="text-sm text-white/40">El menú lateral iniciará minimizado</p>
            </div>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className={`relative w-12 h-7 rounded-full transition-colors ${
                sidebarCollapsed ? 'bg-amber-500' : 'bg-white/10'
              }`}
            >
              <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
                sidebarCollapsed ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl border border-white/[0.05]">
            <div>
              <p className="text-white font-medium">Modo compacto</p>
              <p className="text-sm text-white/40">Reduce el espaciado entre elementos</p>
            </div>
            <button
              onClick={() => setCompactMode(!compactMode)}
              className={`relative w-12 h-7 rounded-full transition-colors ${
                compactMode ? 'bg-amber-500' : 'bg-white/10'
              }`}
            >
              <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
                compactMode ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
        </div>
      </div>

      {/* Atajos de teclado */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Atajos de Teclado</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { keys: ['⌘', 'K'], action: 'Búsqueda rápida' },
            { keys: ['⌘', 'B'], action: 'Toggle sidebar' },
            { keys: ['⌘', '/'], action: 'Abrir ayuda' },
            { keys: ['⌘', 'N'], action: 'Nueva guía' },
            { keys: ['⌘', 'E'], action: 'Exportar Excel' },
            { keys: ['Esc'], action: 'Cerrar modal' },
          ].map((shortcut) => (
            <div key={shortcut.action} className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl border border-white/[0.05]">
              <span className="text-white/60">{shortcut.action}</span>
              <div className="flex items-center gap-1">
                {shortcut.keys.map((key, idx) => (
                  <React.Fragment key={idx}>
                    <kbd className="px-2 py-1 rounded bg-white/[0.1] text-white/80 text-sm font-mono">
                      {key}
                    </kbd>
                    {idx < shortcut.keys.length - 1 && <span className="text-white/30">+</span>}
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderIntegrations = () => (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Integraciones</h2>
        <p className="text-white/50">Conecta tus servicios y APIs</p>
      </div>

      {/* Transportadoras */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Truck className="w-5 h-5" /> Transportadoras
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { name: 'Coordinadora', status: 'connected', lastSync: 'Hace 5 min' },
            { name: 'Servientrega', status: 'connected', lastSync: 'Hace 10 min' },
            { name: 'Interrapidísimo', status: 'pending', lastSync: null },
            { name: 'TCC', status: 'disconnected', lastSync: null },
          ].map((carrier) => (
            <div key={carrier.name} className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.05] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  carrier.status === 'connected' ? 'bg-emerald-500/20' :
                  carrier.status === 'pending' ? 'bg-amber-500/20' : 'bg-white/[0.05]'
                }`}>
                  <Truck className={`w-5 h-5 ${
                    carrier.status === 'connected' ? 'text-emerald-400' :
                    carrier.status === 'pending' ? 'text-amber-400' : 'text-white/40'
                  }`} />
                </div>
                <div>
                  <p className="text-white font-medium">{carrier.name}</p>
                  <p className="text-sm text-white/40">
                    {carrier.status === 'connected' ? `Sincronizado ${carrier.lastSync}` :
                     carrier.status === 'pending' ? 'Configuración pendiente' : 'No conectado'}
                  </p>
                </div>
              </div>
              <button className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                carrier.status === 'connected'
                  ? 'bg-white/[0.05] hover:bg-white/[0.1] text-white'
                  : 'bg-amber-500 hover:bg-amber-600 text-white'
              }`}>
                {carrier.status === 'connected' ? 'Configurar' : 'Conectar'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Webhooks */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Webhook className="w-5 h-5" /> Webhooks
          </h3>
          <button className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-white text-sm transition-colors flex items-center gap-2">
            <Plus className="w-4 h-4" /> Agregar webhook
          </button>
        </div>

        <div className="p-6 bg-white/[0.02] rounded-xl border border-white/[0.05]">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-emerald-500/20">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-white font-medium">Notificación de entregas</p>
              <p className="text-sm text-white/40">https://api.tuapp.com/webhooks/delivery</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 text-xs">POST</span>
            <span className="text-white/30 text-sm">Último evento: hace 2 min</span>
          </div>
        </div>
      </div>

      {/* API Keys */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Key className="w-5 h-5" /> API Keys
          </h3>
          <button className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-white text-sm transition-colors flex items-center gap-2">
            <Plus className="w-4 h-4" /> Nueva API Key
          </button>
        </div>

        <div className="p-6 bg-white/[0.02] rounded-xl border border-white/[0.05]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-white font-medium">Production Key</p>
              <p className="text-sm text-white/40">Creada el 15 de Enero, 2026</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-lg hover:bg-white/[0.05] text-white/40 hover:text-white transition-colors">
                <Copy className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-white/[0.03] rounded-lg font-mono text-sm text-white/60">
            <span>sk_live_••••••••••••••••••••4567</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBilling = () => (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Facturación</h2>
        <p className="text-white/50">Gestiona tu plan y métodos de pago</p>
      </div>

      {/* Plan actual */}
      <div className="p-6 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-2xl border border-amber-500/30">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-amber-500">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Plan Enterprise</h3>
              <p className="text-white/60">Facturación anual</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-white">$299</p>
            <p className="text-white/60">/mes</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="px-4 py-2 rounded-xl bg-white text-amber-600 font-medium hover:bg-white/90 transition-colors">
            Cambiar plan
          </button>
          <button className="px-4 py-2 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-colors">
            Ver facturas
          </button>
        </div>
      </div>

      {/* Uso actual */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Uso del Mes</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Guías procesadas', value: '45,230', limit: '100,000', percent: 45 },
            { label: 'Usuarios activos', value: '12', limit: '50', percent: 24 },
            { label: 'Almacenamiento', value: '2.3 GB', limit: '10 GB', percent: 23 },
          ].map((item) => (
            <div key={item.label} className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.05]">
              <p className="text-white/50 text-sm mb-2">{item.label}</p>
              <p className="text-2xl font-bold text-white mb-1">{item.value}</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
                <span className="text-xs text-white/40">{item.limit}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Método de pago */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Método de Pago</h3>

        <div className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.05] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-blue-400 rounded flex items-center justify-center text-white font-bold text-xs">
              VISA
            </div>
            <div>
              <p className="text-white font-medium">•••• •••• •••• 4242</p>
              <p className="text-sm text-white/40">Expira 12/2027</p>
            </div>
          </div>
          <button className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-white text-sm transition-colors">
            Cambiar
          </button>
        </div>
      </div>

      {/* Historial de pagos */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Historial de Pagos</h3>

        <div className="space-y-2">
          {[
            { date: 'Enero 2026', amount: '$299.00', status: 'paid' },
            { date: 'Diciembre 2025', amount: '$299.00', status: 'paid' },
            { date: 'Noviembre 2025', amount: '$299.00', status: 'paid' },
          ].map((payment, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl border border-white/[0.05]">
              <div>
                <p className="text-white font-medium">{payment.date}</p>
                <p className="text-sm text-white/40">Plan Enterprise</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-white font-medium">{payment.amount}</span>
                <span className="px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs">
                  Pagado
                </span>
                <button className="text-white/40 hover:text-white transition-colors">
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a1a] text-white">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Configuración</h1>
          <p className="text-white/50">Administra tu cuenta y preferencias</p>
        </div>

        <div className="flex gap-8">
          {/* Sidebar de navegación */}
          <div className="w-64 flex-shrink-0">
            <nav className="space-y-1 sticky top-6">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id as SettingsSection)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                    activeSection === section.id
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : 'text-white/60 hover:bg-white/[0.05] hover:text-white'
                  }`}
                >
                  <section.icon className="w-5 h-5" />
                  <span className="font-medium">{section.label}</span>
                  {activeSection === section.id && (
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Contenido principal */}
          <div className="flex-1 min-w-0">
            {activeSection === 'profile' && renderProfile()}
            {activeSection === 'security' && renderSecurity()}
            {activeSection === 'team' && renderTeam()}
            {activeSection === 'appearance' && renderAppearance()}
            {activeSection === 'integrations' && renderIntegrations()}
            {activeSection === 'billing' && renderBilling()}
          </div>
        </div>
      </div>

      {/* Modal de invitación */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a2e] rounded-2xl w-full max-w-md border border-white/10 shadow-2xl">
            <div className="p-6 border-b border-white/10">
              <h3 className="text-xl font-bold text-white">Invitar miembro</h3>
              <p className="text-white/50 text-sm mt-1">Envía una invitación por email</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-white/60 mb-2">Email</label>
                <input
                  type="email"
                  placeholder="correo@empresa.com"
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-amber-500/50"
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">Rol</label>
                <select className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50">
                  <option value="viewer">Visualizador</option>
                  <option value="operator">Operador</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
            </div>
            <div className="p-6 border-t border-white/10 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowInviteModal(false)}
                className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-white transition-colors"
              >
                Cancelar
              </button>
              <button className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-medium transition-colors">
                Enviar invitación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPanel;
