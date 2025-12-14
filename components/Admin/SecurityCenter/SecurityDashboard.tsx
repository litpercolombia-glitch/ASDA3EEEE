// components/Admin/SecurityCenter/SecurityDashboard.tsx
import React, { useState } from 'react';
import { Shield, Users, UserPlus, Settings, History, Lock, Key, Eye, Edit2, Trash2, Check, X, Activity } from 'lucide-react';
import { useSecurity, type TeamMember, type Role, type ActivityLog } from '../../../services/teamSecurityService';

export function SecurityDashboard() {
  const { team, roles, activityLogs, securitySettings, addMember, updateMember, deleteMember, addRole, updateSecuritySettings, activeMembers, recentActivity } = useSecurity();
  const [activeTab, setActiveTab] = useState<'equipo' | 'roles' | 'actividad' | 'seguridad'>('equipo');
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [newMember, setNewMember] = useState({ nombre: '', email: '', telefono: '', rol: 'role-vendedor' });

  const getRoleInfo = (roleId: string) => roles.find(r => r.id === roleId);

  const handleAddMember = () => {
    if (!newMember.nombre || !newMember.email) return;
    const role = getRoleInfo(newMember.rol);
    addMember({ ...newMember, permisos: role?.permisos || roles[0].permisos, estado: 'activo' });
    setNewMember({ nombre: '', email: '', telefono: '', rol: 'role-vendedor' });
    setShowMemberModal(false);
  };

  const tabs = [
    { id: 'equipo', label: 'Equipo', icon: Users, count: activeMembers.length },
    { id: 'roles', label: 'Roles', icon: Key, count: roles.length },
    { id: 'actividad', label: 'Actividad', icon: History },
    { id: 'seguridad', label: 'Seguridad', icon: Shield },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-500/20 rounded-xl">
            <Shield className="w-8 h-8 text-red-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Seguridad y Equipo</h2>
            <p className="text-gray-400">Gestión de usuarios, roles y permisos</p>
          </div>
        </div>
        <button onClick={() => setShowMemberModal(true)} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
          <UserPlus className="w-4 h-4" />Agregar Usuario
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700">
          <div className="flex items-center justify-between">
            <div><p className="text-2xl font-bold text-white">{activeMembers.length}</p><p className="text-xs text-gray-400">Usuarios Activos</p></div>
            <div className="p-2 bg-green-500/20 rounded-lg"><Users className="w-5 h-5 text-green-400" /></div>
          </div>
        </div>
        <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700">
          <div className="flex items-center justify-between">
            <div><p className="text-2xl font-bold text-white">{roles.length}</p><p className="text-xs text-gray-400">Roles</p></div>
            <div className="p-2 bg-purple-500/20 rounded-lg"><Key className="w-5 h-5 text-purple-400" /></div>
          </div>
        </div>
        <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700">
          <div className="flex items-center justify-between">
            <div><p className="text-2xl font-bold text-white">{activityLogs.length}</p><p className="text-xs text-gray-400">Registros</p></div>
            <div className="p-2 bg-blue-500/20 rounded-lg"><Activity className="w-5 h-5 text-blue-400" /></div>
          </div>
        </div>
        <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700">
          <div className="flex items-center justify-between">
            <div><p className="text-2xl font-bold text-white">{securitySettings.requiere2FA ? 'Sí' : 'No'}</p><p className="text-xs text-gray-400">2FA Requerido</p></div>
            <div className="p-2 bg-red-500/20 rounded-lg"><Lock className="w-5 h-5 text-red-400" /></div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-700 pb-2">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${activeTab === tab.id ? 'bg-red-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}>
            <tab.icon className="w-4 h-4" />{tab.label}
            {tab.count !== undefined && <span className={`px-2 py-0.5 text-xs rounded-full ${activeTab === tab.id ? 'bg-red-500' : 'bg-gray-600'}`}>{tab.count}</span>}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {activeTab === 'equipo' && (
          <div className="space-y-3">
            {team.map((member) => {
              const role = getRoleInfo(member.rol);
              return (
                <div key={member.id} className="p-4 bg-gray-800/50 rounded-xl border border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                        {member.nombre.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-white">{member.nombre}</h4>
                          <span className={`px-2 py-0.5 rounded text-xs ${member.estado === 'activo' ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                            {member.estado}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-medium" style={{ color: role?.color }}>{role?.nombre}</p>
                        <p className="text-xs text-gray-500">{member.ultimoAcceso ? `Último: ${new Date(member.ultimoAcceso).toLocaleDateString()}` : 'Nunca'}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => deleteMember(member.id)} className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'roles' && (
          <div className="grid md:grid-cols-2 gap-4">
            {roles.map((role) => (
              <div key={role.id} className="p-4 rounded-xl border border-gray-700 bg-gray-800/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: role.color }} />
                    <h4 className="font-medium text-white">{role.nombre}</h4>
                    {role.isDefault && <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs">Default</span>}
                  </div>
                </div>
                <p className="text-sm text-gray-400 mb-3">{role.descripcion}</p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {Object.entries(role.permisos).filter(([k]) => k !== 'dashboard').map(([perm, level]) => (
                    <div key={perm} className="flex items-center justify-between p-1.5 bg-gray-700/50 rounded">
                      <span className="text-gray-400 capitalize">{perm}</span>
                      <span className={`${level === 'admin' ? 'text-green-400' : level === 'editar' ? 'text-blue-400' : level === 'ver' ? 'text-yellow-400' : 'text-gray-500'}`}>
                        {level === 'ninguno' ? '—' : level.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'actividad' && (
          <div className="space-y-3">
            {recentActivity.map((log) => (
              <div key={log.id} className="flex items-center gap-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                <div className="p-2 bg-gray-700 rounded-lg"><Activity className="w-4 h-4 text-gray-400" /></div>
                <div className="flex-1">
                  <p className="text-white"><span className="text-blue-400">{log.userName}</span> • {log.accion}</p>
                  <p className="text-sm text-gray-400">{log.detalle}</p>
                </div>
                <div className="text-right text-xs text-gray-500">
                  <p>{new Date(log.createdAt).toLocaleString()}</p>
                  <p>{log.ip}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'seguridad' && (
          <div className="space-y-6">
            <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700">
              <h3 className="font-medium text-white mb-4">Configuración de Seguridad</h3>
              <div className="space-y-4">
                <label className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg cursor-pointer">
                  <div>
                    <p className="text-white">Autenticación de 2 Factores</p>
                    <p className="text-sm text-gray-400">Requerir 2FA para todos los usuarios</p>
                  </div>
                  <input type="checkbox" checked={securitySettings.requiere2FA}
                    onChange={(e) => updateSecuritySettings({ requiere2FA: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-600 text-red-600 focus:ring-red-500" />
                </label>
                <div className="p-3 bg-gray-700/50 rounded-lg">
                  <label className="block text-white mb-2">Tiempo de Sesión (minutos)</label>
                  <input type="number" value={securitySettings.tiempoSesion}
                    onChange={(e) => updateSecuritySettings({ tiempoSesion: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" />
                </div>
                <div className="p-3 bg-gray-700/50 rounded-lg">
                  <label className="block text-white mb-2">Intentos Máximos de Login</label>
                  <input type="number" value={securitySettings.intentosMaximos}
                    onChange={(e) => updateSecuritySettings({ intentosMaximos: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" />
                </div>
                <label className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg cursor-pointer">
                  <div>
                    <p className="text-white">Backup Automático</p>
                    <p className="text-sm text-gray-400">Frecuencia: {securitySettings.frecuenciaBackup}</p>
                  </div>
                  <input type="checkbox" checked={securitySettings.backupAutomatico}
                    onChange={(e) => updateSecuritySettings({ backupAutomatico: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-600 text-red-600 focus:ring-red-500" />
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Member Modal */}
      {showMemberModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Agregar Usuario</h3>
            <div className="space-y-4">
              <input type="text" value={newMember.nombre} onChange={(e) => setNewMember({ ...newMember, nombre: e.target.value })}
                placeholder="Nombre completo" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" />
              <input type="email" value={newMember.email} onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                placeholder="Email" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" />
              <input type="tel" value={newMember.telefono} onChange={(e) => setNewMember({ ...newMember, telefono: e.target.value })}
                placeholder="Teléfono" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" />
              <select value={newMember.rol} onChange={(e) => setNewMember({ ...newMember, rol: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white">
                {roles.map((role) => <option key={role.id} value={role.id}>{role.nombre}</option>)}
              </select>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowMemberModal(false)} className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700">Cancelar</button>
              <button onClick={handleAddMember} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Agregar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SecurityDashboard;
