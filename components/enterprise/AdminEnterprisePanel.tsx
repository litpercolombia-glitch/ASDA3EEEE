// components/enterprise/AdminEnterprisePanel.tsx
// Panel Administrativo Enterprise - LITPER PRO

import React, { useState, useEffect } from 'react';
import {
  Users, Shield, Key, Eye, EyeOff, Plus, Edit3, Trash2, Check, X,
  Crown, Settings, Database, FileText, Download, Upload, RefreshCw,
  Lock, Unlock, UserPlus, AlertTriangle, Activity, Clock, Search
} from 'lucide-react';
import { permissionService } from '../../services/permissionService';
import {
  UsuarioEnterprise,
  RolEnterprise,
  PermisosGranulares,
  AuditLog,
  ROLES_DEFAULT,
} from '../../types/permissions';

// ==================== TIPOS ====================

type TabAdmin = 'usuarios' | 'roles' | 'auditoria' | 'config';

interface UsuarioFormData {
  username: string;
  nombre: string;
  pin: string;
  email: string;
  telefono: string;
  avatar: string;
  clase: string;
  rolId: string;
  departamento: string;
}

// ==================== COMPONENTE PRINCIPAL ====================

export const AdminEnterprisePanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabAdmin>('usuarios');
  const [usuarios, setUsuarios] = useState<UsuarioEnterprise[]>([]);
  const [roles, setRoles] = useState<RolEnterprise[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [selectedUsuario, setSelectedUsuario] = useState<UsuarioEnterprise | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
    const unsubscribe = permissionService.subscribe(loadData);
    return unsubscribe;
  }, []);

  const loadData = () => {
    setUsuarios(permissionService.getUsuarios());
    setRoles(permissionService.getRoles());
    setAuditLogs(permissionService.getAuditLogs());
  };

  const tabs = [
    { id: 'usuarios' as TabAdmin, label: 'Usuarios', icon: Users, count: usuarios.length },
    { id: 'roles' as TabAdmin, label: 'Roles', icon: Shield, count: roles.length },
    { id: 'auditoria' as TabAdmin, label: 'Auditoría', icon: Activity, count: auditLogs.length },
    { id: 'config' as TabAdmin, label: 'Configuración', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Crown className="w-8 h-8 text-yellow-500" />
          Panel Administrativo Enterprise
        </h1>
        <p className="text-gray-400 mt-1">Gestión de usuarios, roles y permisos</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-700 pb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            <tab.icon className="w-5 h-5" />
            {tab.label}
            {tab.count !== undefined && (
              <span className="ml-1 px-2 py-0.5 text-xs bg-black/30 rounded-full">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'usuarios' && (
        <UsuariosTab
          usuarios={usuarios}
          roles={roles}
          selectedUsuario={selectedUsuario}
          setSelectedUsuario={setSelectedUsuario}
          showForm={showForm}
          setShowForm={setShowForm}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onRefresh={loadData}
        />
      )}
      {activeTab === 'roles' && <RolesTab roles={roles} usuarios={usuarios} onRefresh={loadData} />}
      {activeTab === 'auditoria' && <AuditoriaTab logs={auditLogs} usuarios={usuarios} />}
      {activeTab === 'config' && <ConfigTab onRefresh={loadData} />}
    </div>
  );
};

// ==================== TAB: USUARIOS ====================

const UsuariosTab: React.FC<{
  usuarios: UsuarioEnterprise[];
  roles: RolEnterprise[];
  selectedUsuario: UsuarioEnterprise | null;
  setSelectedUsuario: (u: UsuarioEnterprise | null) => void;
  showForm: boolean;
  setShowForm: (show: boolean) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onRefresh: () => void;
}> = ({ usuarios, roles, selectedUsuario, setSelectedUsuario, showForm, setShowForm, searchTerm, setSearchTerm, onRefresh }) => {
  const [formData, setFormData] = useState<UsuarioFormData>({
    username: '',
    nombre: '',
    pin: '',
    email: '',
    telefono: '',
    avatar: '👤',
    clase: '',
    rolId: 'operador',
    departamento: '',
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  const usuariosFiltrados = usuarios.filter(
    (u) =>
      u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = () => {
    if (editingId) {
      permissionService.actualizarUsuario(editingId, formData);
    } else {
      permissionService.crearUsuario({
        ...formData,
        estado: 'activo',
      });
    }
    resetForm();
    onRefresh();
  };

  const resetForm = () => {
    setFormData({
      username: '',
      nombre: '',
      pin: '',
      email: '',
      telefono: '',
      avatar: '👤',
      clase: '',
      rolId: 'operador',
      departamento: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (usuario: UsuarioEnterprise) => {
    setFormData({
      username: usuario.username,
      nombre: usuario.nombre,
      pin: usuario.pin || '',
      email: usuario.email || '',
      telefono: usuario.telefono || '',
      avatar: usuario.avatar,
      clase: usuario.clase || '',
      rolId: usuario.rolId,
      departamento: usuario.departamento || '',
    });
    setEditingId(usuario.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este usuario?')) {
      permissionService.eliminarUsuario(id);
      onRefresh();
    }
  };

  const handleToggleEstado = (id: string, estadoActual: string) => {
    const nuevoEstado = estadoActual === 'activo' ? 'inactivo' : 'activo';
    permissionService.cambiarEstadoUsuario(id, nuevoEstado as any);
    onRefresh();
  };

  const avatares = ['⚔️', '🏹', '🔮', '🛡️', '⚡', '🗡️', '🧪', '📿', '🎭', '👑', '🎯', '🔥', '💎', '🌟'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Lista de usuarios */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex justify-between items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar usuario..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg"
          >
            <UserPlus className="w-5 h-5" />
            Nuevo Usuario
          </button>
        </div>

        <div className="bg-gray-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left">Usuario</th>
                <th className="px-4 py-3 text-left">Rol</th>
                <th className="px-4 py-3 text-left">Estado</th>
                <th className="px-4 py-3 text-left">Último Login</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {usuariosFiltrados.map((usuario) => {
                const rol = roles.find((r) => r.id === usuario.rolId);
                return (
                  <tr
                    key={usuario.id}
                    className={`hover:bg-gray-700/50 cursor-pointer ${
                      selectedUsuario?.id === usuario.id ? 'bg-purple-900/30' : ''
                    }`}
                    onClick={() => setSelectedUsuario(usuario)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{usuario.avatar}</span>
                        <div>
                          <div className="font-medium">{usuario.nombre}</div>
                          <div className="text-sm text-gray-400">@{usuario.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="px-2 py-1 rounded-full text-sm"
                        style={{ backgroundColor: rol?.color + '30', color: rol?.color }}
                      >
                        {rol?.icono} {rol?.nombre}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleEstado(usuario.id, usuario.estado);
                        }}
                        className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm ${
                          usuario.estado === 'activo'
                            ? 'bg-green-500/20 text-green-400'
                            : usuario.estado === 'inactivo'
                            ? 'bg-gray-500/20 text-gray-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {usuario.estado === 'activo' ? (
                          <Unlock className="w-3 h-3" />
                        ) : (
                          <Lock className="w-3 h-3" />
                        )}
                        {usuario.estado}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-sm">
                      {usuario.metadata.lastLogin
                        ? new Date(usuario.metadata.lastLogin).toLocaleDateString('es')
                        : 'Nunca'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(usuario);
                          }}
                          className="p-1 hover:bg-gray-600 rounded"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(usuario.id);
                          }}
                          className="p-1 hover:bg-red-600 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Panel lateral */}
      <div className="space-y-4">
        {showForm ? (
          <div className="bg-gray-800 rounded-xl p-4">
            <h3 className="text-lg font-bold mb-4">
              {editingId ? 'Editar Usuario' : 'Nuevo Usuario'}
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Username</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                    placeholder="usuario123"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">PIN</label>
                  <input
                    type="password"
                    value={formData.pin}
                    onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                    placeholder="****"
                    maxLength={6}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Nombre completo</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                  placeholder="Juan Pérez"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Avatar</label>
                <div className="flex flex-wrap gap-2">
                  {avatares.map((av) => (
                    <button
                      key={av}
                      type="button"
                      onClick={() => setFormData({ ...formData, avatar: av })}
                      className={`text-2xl p-2 rounded-lg ${
                        formData.avatar === av ? 'bg-purple-600' : 'bg-gray-700 hover:bg-gray-600'
                      }`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Rol</label>
                <select
                  value={formData.rolId}
                  onChange={(e) => setFormData({ ...formData, rolId: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                >
                  {roles.map((rol) => (
                    <option key={rol.id} value={rol.id}>
                      {rol.icono} {rol.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Departamento</label>
                <input
                  type="text"
                  value={formData.departamento}
                  onChange={(e) => setFormData({ ...formData, departamento: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                  placeholder="Operaciones"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSubmit}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg"
                >
                  <Check className="w-5 h-5" />
                  {editingId ? 'Guardar' : 'Crear'}
                </button>
                <button
                  onClick={resetForm}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ) : selectedUsuario ? (
          <UsuarioDetail usuario={selectedUsuario} roles={roles} onUpdate={onRefresh} />
        ) : (
          <div className="bg-gray-800 rounded-xl p-6 text-center text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Selecciona un usuario para ver sus detalles y permisos</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ==================== DETALLE DE USUARIO ====================

const UsuarioDetail: React.FC<{
  usuario: UsuarioEnterprise;
  roles: RolEnterprise[];
  onUpdate: () => void;
}> = ({ usuario, roles, onUpdate }) => {
  const rol = roles.find((r) => r.id === usuario.rolId);
  const permisos = permissionService.esSuperAdmin()
    ? rol?.permisos
    : usuario.permisosPersonalizados || rol?.permisos;

  return (
    <div className="bg-gray-800 rounded-xl p-4 space-y-4">
      <div className="flex items-center gap-4">
        <span className="text-4xl">{usuario.avatar}</span>
        <div>
          <h3 className="text-xl font-bold">{usuario.nombre}</h3>
          <p className="text-gray-400">@{usuario.username}</p>
          {usuario.clase && <p className="text-sm text-purple-400">{usuario.clase}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-400">Rol:</span>
          <span className="ml-2" style={{ color: rol?.color }}>
            {rol?.icono} {rol?.nombre}
          </span>
        </div>
        <div>
          <span className="text-gray-400">Depto:</span>
          <span className="ml-2">{usuario.departamento || '-'}</span>
        </div>
        <div>
          <span className="text-gray-400">Logins:</span>
          <span className="ml-2">{usuario.metadata.loginCount}</span>
        </div>
        <div>
          <span className="text-gray-400">Creado:</span>
          <span className="ml-2">{new Date(usuario.metadata.createdAt).toLocaleDateString('es')}</span>
        </div>
      </div>

      <div className="border-t border-gray-700 pt-4">
        <h4 className="font-medium mb-2 flex items-center gap-2">
          <Key className="w-4 h-4" />
          Permisos del Rol
        </h4>
        <div className="max-h-60 overflow-y-auto space-y-2">
          {permisos &&
            Object.entries(permisos).map(([modulo, acciones]) => {
              const tieneAlguno = Object.values(acciones).some((v) => v === true);
              if (!tieneAlguno) return null;

              return (
                <div key={modulo} className="bg-gray-700/50 rounded p-2">
                  <div className="font-medium text-sm capitalize">{modulo}</div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {Object.entries(acciones)
                      .filter(([, v]) => v === true)
                      .map(([accion]) => (
                        <span key={accion} className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">
                          {accion}
                        </span>
                      ))}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};

// ==================== TAB: ROLES ====================

const RolesTab: React.FC<{
  roles: RolEnterprise[];
  usuarios: UsuarioEnterprise[];
  onRefresh: () => void;
}> = ({ roles, usuarios, onRefresh }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {roles.map((rol) => {
        const usuariosConRol = usuarios.filter((u) => u.rolId === rol.id).length;
        const permisosActivos = Object.values(rol.permisos)
          .flatMap((m) => Object.values(m))
          .filter((v) => v === true).length;

        return (
          <div key={rol.id} className="bg-gray-800 rounded-xl p-4 border-l-4" style={{ borderColor: rol.color }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{rol.icono}</span>
                <div>
                  <h3 className="font-bold">{rol.nombre}</h3>
                  <p className="text-sm text-gray-400">{rol.descripcion}</p>
                </div>
              </div>
              {rol.esSistema && (
                <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded">Sistema</span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm text-gray-400">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {usuariosConRol} usuarios
              </div>
              <div className="flex items-center gap-1">
                <Key className="w-4 h-4" />
                {permisosActivos} permisos
              </div>
            </div>

            {rol.esEditable && (
              <div className="mt-4 flex gap-2">
                <button className="flex-1 px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm">
                  <Edit3 className="w-4 h-4 inline mr-1" />
                  Editar
                </button>
              </div>
            )}
          </div>
        );
      })}

      <button className="bg-gray-800 rounded-xl p-4 border-2 border-dashed border-gray-600 hover:border-purple-500 flex flex-col items-center justify-center text-gray-400 hover:text-purple-400 transition-colors">
        <Plus className="w-8 h-8 mb-2" />
        <span>Crear Rol Personalizado</span>
      </button>
    </div>
  );
};

// ==================== TAB: AUDITORIA ====================

const AuditoriaTab: React.FC<{
  logs: AuditLog[];
  usuarios: UsuarioEnterprise[];
}> = ({ logs, usuarios }) => {
  const [filtro, setFiltro] = useState<string>('');

  const logsFiltrados = filtro
    ? logs.filter((l) => l.action === filtro || l.module === filtro)
    : logs;

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'login':
        return '🔓';
      case 'logout':
        return '🔒';
      case 'create':
        return '➕';
      case 'update':
        return '✏️';
      case 'delete':
        return '🗑️';
      case 'export':
        return '📤';
      case 'import':
        return '📥';
      case 'permission_change':
        return '🔑';
      default:
        return '📝';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFiltro('')}
          className={`px-3 py-1 rounded-full text-sm ${
            filtro === '' ? 'bg-purple-600' : 'bg-gray-700 hover:bg-gray-600'
          }`}
        >
          Todos
        </button>
        {['login', 'logout', 'create', 'update', 'delete', 'permission_change'].map((action) => (
          <button
            key={action}
            onClick={() => setFiltro(action)}
            className={`px-3 py-1 rounded-full text-sm ${
              filtro === action ? 'bg-purple-600' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            {getActionIcon(action)} {action}
          </button>
        ))}
      </div>

      <div className="bg-gray-800 rounded-xl overflow-hidden">
        <div className="max-h-[600px] overflow-y-auto">
          <table className="w-full">
            <thead className="bg-gray-700 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left">Fecha/Hora</th>
                <th className="px-4 py-3 text-left">Usuario</th>
                <th className="px-4 py-3 text-left">Acción</th>
                <th className="px-4 py-3 text-left">Módulo</th>
                <th className="px-4 py-3 text-left">Detalles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {logsFiltrados.slice(0, 100).map((log) => (
                <tr key={log.id} className="hover:bg-gray-700/50">
                  <td className="px-4 py-3 text-sm">
                    <div>{new Date(log.timestamp).toLocaleDateString('es')}</div>
                    <div className="text-gray-400">{new Date(log.timestamp).toLocaleTimeString('es')}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium">{log.userName}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2">
                      {getActionIcon(log.action)}
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{log.module}</td>
                  <td className="px-4 py-3 text-sm text-gray-300">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ==================== TAB: CONFIGURACIÓN ====================

const ConfigTab: React.FC<{ onRefresh: () => void }> = ({ onRefresh }) => {
  const handleExport = () => {
    const config = permissionService.exportConfig();
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `litper_config_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleReset = () => {
    if (confirm('¿Estás seguro de resetear todos los usuarios y roles a valores por defecto?')) {
      permissionService.reset();
      onRefresh();
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Database className="w-5 h-5" />
          Backup y Restauración
        </h3>
        <div className="space-y-4">
          <button
            onClick={handleExport}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg"
          >
            <Download className="w-5 h-5" />
            Exportar Configuración
          </button>
          <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg">
            <Upload className="w-5 h-5" />
            Importar Configuración
          </button>
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          Zona de Peligro
        </h3>
        <div className="space-y-4">
          <button
            onClick={handleReset}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 rounded-lg"
          >
            <RefreshCw className="w-5 h-5" />
            Resetear a Valores por Defecto
          </button>
          <p className="text-sm text-gray-400">
            Esto eliminará todos los usuarios y roles personalizados, restaurando los valores iniciales del sistema.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminEnterprisePanel;
