// services/teamSecurityService.ts
// Sistema de Seguridad y Gestión de Equipo para LITPER PRO

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================
// TIPOS
// ============================================

export interface TeamMember {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  rol: string;
  avatar?: string;
  permisos: UserPermissions;
  estado: 'activo' | 'inactivo' | 'suspendido';
  ultimoAcceso?: string;
  horarioPermitido?: { inicio: string; fin: string; dias: number[] };
  createdAt: string;
}

export interface UserPermissions {
  dashboard: boolean;
  pedidos: PermissionLevel;
  clientes: PermissionLevel;
  finanzas: PermissionLevel;
  reportes: PermissionLevel;
  marketing: PermissionLevel;
  soporte: PermissionLevel;
  configuracion: PermissionLevel;
  equipo: PermissionLevel;
}

export type PermissionLevel = 'ninguno' | 'ver' | 'editar' | 'admin';

export interface Role {
  id: string;
  nombre: string;
  descripcion: string;
  permisos: UserPermissions;
  color: string;
  isDefault: boolean;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  accion: string;
  modulo: string;
  detalle: string;
  ip: string;
  dispositivo: string;
  createdAt: string;
}

export interface SecuritySettings {
  requiere2FA: boolean;
  tiempoSesion: number;
  intentosMaximos: number;
  bloqueoTiempo: number;
  passwordMinLength: number;
  passwordRequireSpecial: boolean;
  backupAutomatico: boolean;
  frecuenciaBackup: 'diario' | 'semanal' | 'mensual';
}

// ============================================
// DATOS POR DEFECTO
// ============================================

const DEFAULT_ROLES: Role[] = [
  {
    id: 'role-admin',
    nombre: 'Administrador',
    descripcion: 'Acceso total al sistema',
    permisos: { dashboard: true, pedidos: 'admin', clientes: 'admin', finanzas: 'admin', reportes: 'admin', marketing: 'admin', soporte: 'admin', configuracion: 'admin', equipo: 'admin' },
    color: '#EF4444',
    isDefault: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'role-vendedor',
    nombre: 'Vendedor',
    descripcion: 'Gestión de ventas y clientes',
    permisos: { dashboard: true, pedidos: 'editar', clientes: 'editar', finanzas: 'ninguno', reportes: 'ver', marketing: 'ninguno', soporte: 'ver', configuracion: 'ninguno', equipo: 'ninguno' },
    color: '#10B981',
    isDefault: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'role-soporte',
    nombre: 'Soporte',
    descripcion: 'Atención al cliente',
    permisos: { dashboard: true, pedidos: 'ver', clientes: 'ver', finanzas: 'ninguno', reportes: 'ninguno', marketing: 'ninguno', soporte: 'admin', configuracion: 'ninguno', equipo: 'ninguno' },
    color: '#3B82F6',
    isDefault: false,
    createdAt: new Date().toISOString(),
  },
];

const SAMPLE_TEAM: TeamMember[] = [
  {
    id: 'user-admin',
    nombre: 'Administrador Principal',
    email: 'admin@litper.com',
    telefono: '3001234567',
    rol: 'role-admin',
    permisos: DEFAULT_ROLES[0].permisos,
    estado: 'activo',
    ultimoAcceso: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
];

const SAMPLE_LOGS: ActivityLog[] = [
  { id: 'log-1', userId: 'user-admin', userName: 'Administrador', accion: 'login', modulo: 'auth', detalle: 'Inicio de sesión', ip: '192.168.1.1', dispositivo: 'Chrome', createdAt: new Date().toISOString() },
];

const DEFAULT_SECURITY: SecuritySettings = {
  requiere2FA: false,
  tiempoSesion: 480,
  intentosMaximos: 5,
  bloqueoTiempo: 30,
  passwordMinLength: 8,
  passwordRequireSpecial: true,
  backupAutomatico: true,
  frecuenciaBackup: 'diario',
};

// ============================================
// STORE
// ============================================

interface SecurityState {
  team: TeamMember[];
  roles: Role[];
  activityLogs: ActivityLog[];
  securitySettings: SecuritySettings;

  addMember: (member: Omit<TeamMember, 'id' | 'createdAt'>) => void;
  updateMember: (id: string, updates: Partial<TeamMember>) => void;
  deleteMember: (id: string) => void;
  addRole: (role: Omit<Role, 'id' | 'createdAt'>) => void;
  updateRole: (id: string, updates: Partial<Role>) => void;
  deleteRole: (id: string) => void;
  logActivity: (log: Omit<ActivityLog, 'id' | 'createdAt'>) => void;
  updateSecuritySettings: (updates: Partial<SecuritySettings>) => void;
  getActiveMembers: () => TeamMember[];
  getRecentActivity: (limit: number) => ActivityLog[];
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const useSecurityStore = create<SecurityState>()(
  persist(
    (set, get) => ({
      team: SAMPLE_TEAM,
      roles: DEFAULT_ROLES,
      activityLogs: SAMPLE_LOGS,
      securitySettings: DEFAULT_SECURITY,

      addMember: (member) => {
        const newMember: TeamMember = { ...member, id: generateId(), createdAt: new Date().toISOString() };
        set((state) => ({ team: [...state.team, newMember] }));
      },
      updateMember: (id, updates) => set((state) => ({ team: state.team.map((m) => m.id === id ? { ...m, ...updates } : m) })),
      deleteMember: (id) => set((state) => ({ team: state.team.filter((m) => m.id !== id) })),
      addRole: (role) => {
        const newRole: Role = { ...role, id: generateId(), createdAt: new Date().toISOString() };
        set((state) => ({ roles: [...state.roles, newRole] }));
      },
      updateRole: (id, updates) => set((state) => ({ roles: state.roles.map((r) => r.id === id ? { ...r, ...updates } : r) })),
      deleteRole: (id) => set((state) => ({ roles: state.roles.filter((r) => r.id !== id) })),
      logActivity: (log) => {
        const newLog: ActivityLog = { ...log, id: generateId(), createdAt: new Date().toISOString() };
        set((state) => ({ activityLogs: [newLog, ...state.activityLogs].slice(0, 500) }));
      },
      updateSecuritySettings: (updates) => set((state) => ({ securitySettings: { ...state.securitySettings, ...updates } })),
      getActiveMembers: () => get().team.filter((m) => m.estado === 'activo'),
      getRecentActivity: (limit) => get().activityLogs.slice(0, limit),
    }),
    { name: 'litper-security-store' }
  )
);

export function useSecurity() {
  const store = useSecurityStore();
  return { ...store, activeMembers: store.getActiveMembers(), recentActivity: store.getRecentActivity(50) };
}

export default useSecurityStore;
