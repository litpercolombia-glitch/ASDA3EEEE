// services/permissionService.ts
// Servicio de Permisos Granulares - LITPER PRO Enterprise

import {
  PermisosGranulares,
  UsuarioEnterprise,
  RolEnterprise,
  AuditLog,
  ROLES_DEFAULT,
  USUARIOS_DEFAULT,
  PERMISOS_COMPLETOS,
  PERMISOS_VACIO,
  RolPredefinido,
} from '../types/permissions';

// ==================== STORAGE KEYS ====================
const STORAGE_KEYS = {
  USUARIOS: 'litper_usuarios_enterprise',
  ROLES: 'litper_roles_enterprise',
  USUARIO_ACTUAL: 'litper_usuario_actual',
  AUDIT_LOG: 'litper_audit_log',
  SESSION: 'litper_session',
};

// ==================== PERMISSION SERVICE ====================

class PermissionService {
  private usuarios: Map<string, UsuarioEnterprise> = new Map();
  private roles: Map<string, RolEnterprise> = new Map();
  private usuarioActual: UsuarioEnterprise | null = null;
  private auditLogs: AuditLog[] = [];
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadFromStorage();
  }

  // ==================== INICIALIZACIÓN ====================

  private loadFromStorage(): void {
    try {
      // Cargar usuarios
      const savedUsuarios = localStorage.getItem(STORAGE_KEYS.USUARIOS);
      if (savedUsuarios) {
        const usuarios = JSON.parse(savedUsuarios) as UsuarioEnterprise[];
        usuarios.forEach((u) => this.usuarios.set(u.id, u));
      } else {
        // Inicializar con usuarios default
        USUARIOS_DEFAULT.forEach((u) => this.usuarios.set(u.id, u));
        this.saveUsuarios();
      }

      // Cargar roles
      const savedRoles = localStorage.getItem(STORAGE_KEYS.ROLES);
      if (savedRoles) {
        const roles = JSON.parse(savedRoles) as RolEnterprise[];
        roles.forEach((r) => this.roles.set(r.id, r));
      } else {
        // Inicializar con roles default
        Object.entries(ROLES_DEFAULT).forEach(([id, rol]) => {
          const rolCompleto: RolEnterprise = {
            ...rol,
            id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          this.roles.set(id, rolCompleto);
        });
        this.saveRoles();
      }

      // Cargar usuario actual
      const savedUsuarioActual = localStorage.getItem(STORAGE_KEYS.USUARIO_ACTUAL);
      if (savedUsuarioActual) {
        const usuarioId = JSON.parse(savedUsuarioActual);
        this.usuarioActual = this.usuarios.get(usuarioId) || null;
      }

      // Cargar audit logs
      const savedAuditLogs = localStorage.getItem(STORAGE_KEYS.AUDIT_LOG);
      if (savedAuditLogs) {
        this.auditLogs = JSON.parse(savedAuditLogs);
      }
    } catch (error) {
      console.error('[PermissionService] Error cargando datos:', error);
    }
  }

  private saveUsuarios(): void {
    const usuarios = Array.from(this.usuarios.values());
    localStorage.setItem(STORAGE_KEYS.USUARIOS, JSON.stringify(usuarios));
  }

  private saveRoles(): void {
    const roles = Array.from(this.roles.values());
    localStorage.setItem(STORAGE_KEYS.ROLES, JSON.stringify(roles));
  }

  private saveAuditLogs(): void {
    // Mantener solo los últimos 1000 logs
    const logsToSave = this.auditLogs.slice(-1000);
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOG, JSON.stringify(logsToSave));
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener());
  }

  // ==================== AUTENTICACIÓN ====================

  /**
   * Login por username y PIN
   */
  login(username: string, pin: string): { success: boolean; usuario?: UsuarioEnterprise; error?: string } {
    const usuario = Array.from(this.usuarios.values()).find(
      (u) => u.username.toLowerCase() === username.toLowerCase()
    );

    if (!usuario) {
      return { success: false, error: 'Usuario no encontrado' };
    }

    if (usuario.estado !== 'activo') {
      return { success: false, error: 'Usuario inactivo o suspendido' };
    }

    if (usuario.pin !== pin && usuario.password !== pin) {
      return { success: false, error: 'PIN o contraseña incorrectos' };
    }

    // Login exitoso
    this.usuarioActual = usuario;
    usuario.metadata.lastLogin = new Date().toISOString();
    usuario.metadata.loginCount++;

    localStorage.setItem(STORAGE_KEYS.USUARIO_ACTUAL, JSON.stringify(usuario.id));
    this.saveUsuarios();

    // Registrar en audit log
    this.logAction('login', 'admin', `Usuario ${usuario.nombre} inició sesión`);

    this.notifyListeners();
    return { success: true, usuario };
  }

  /**
   * Login rápido por selección (para demo)
   */
  loginRapido(usuarioId: string): { success: boolean; usuario?: UsuarioEnterprise } {
    const usuario = this.usuarios.get(usuarioId);
    if (!usuario || usuario.estado !== 'activo') {
      return { success: false };
    }

    this.usuarioActual = usuario;
    usuario.metadata.lastLogin = new Date().toISOString();
    usuario.metadata.loginCount++;

    localStorage.setItem(STORAGE_KEYS.USUARIO_ACTUAL, JSON.stringify(usuario.id));
    this.saveUsuarios();

    this.logAction('login', 'admin', `Login rápido: ${usuario.nombre}`);
    this.notifyListeners();

    return { success: true, usuario };
  }

  /**
   * Cerrar sesión
   */
  logout(): void {
    if (this.usuarioActual) {
      this.logAction('logout', 'admin', `Usuario ${this.usuarioActual.nombre} cerró sesión`);
    }

    this.usuarioActual = null;
    localStorage.removeItem(STORAGE_KEYS.USUARIO_ACTUAL);
    this.notifyListeners();
  }

  /**
   * Obtener usuario actual
   */
  getUsuarioActual(): UsuarioEnterprise | null {
    return this.usuarioActual;
  }

  /**
   * Verificar si hay sesión activa
   */
  isLoggedIn(): boolean {
    return this.usuarioActual !== null;
  }

  // ==================== VERIFICACIÓN DE PERMISOS ====================

  /**
   * Obtener permisos efectivos del usuario actual
   */
  getPermisosActuales(): PermisosGranulares {
    if (!this.usuarioActual) {
      return PERMISOS_VACIO;
    }

    const rol = this.roles.get(this.usuarioActual.rolId);
    if (!rol) {
      return PERMISOS_VACIO;
    }

    // Combinar permisos del rol con personalizados
    if (this.usuarioActual.permisosPersonalizados) {
      return this.mergePermisos(rol.permisos, this.usuarioActual.permisosPersonalizados);
    }

    return rol.permisos;
  }

  /**
   * Verificar un permiso específico
   */
  tienePermiso(modulo: keyof PermisosGranulares, accion: string): boolean {
    const permisos = this.getPermisosActuales();
    const moduloPermisos = permisos[modulo] as Record<string, boolean>;

    if (!moduloPermisos) return false;
    return moduloPermisos[accion] === true;
  }

  /**
   * Verificar acceso a un módulo completo
   */
  tieneAccesoModulo(modulo: keyof PermisosGranulares): boolean {
    const permisos = this.getPermisosActuales();
    const moduloPermisos = permisos[modulo] as Record<string, boolean>;

    if (!moduloPermisos) return false;

    // Si tiene 'acceso' o 'ver', tiene acceso al módulo
    return moduloPermisos.acceso === true || moduloPermisos.ver === true;
  }

  /**
   * Verificar si es superadmin
   */
  esSuperAdmin(): boolean {
    return this.usuarioActual?.rolId === 'superadmin';
  }

  /**
   * Verificar si es admin o superior
   */
  esAdmin(): boolean {
    return this.usuarioActual?.rolId === 'superadmin' || this.usuarioActual?.rolId === 'admin';
  }

  private mergePermisos(base: PermisosGranulares, override: Partial<PermisosGranulares>): PermisosGranulares {
    const resultado = JSON.parse(JSON.stringify(base)) as PermisosGranulares;

    for (const modulo of Object.keys(override) as (keyof PermisosGranulares)[]) {
      if (override[modulo]) {
        resultado[modulo] = {
          ...resultado[modulo],
          ...(override[modulo] as Record<string, boolean>),
        };
      }
    }

    return resultado;
  }

  // ==================== GESTIÓN DE USUARIOS ====================

  /**
   * Obtener todos los usuarios
   */
  getUsuarios(): UsuarioEnterprise[] {
    return Array.from(this.usuarios.values());
  }

  /**
   * Obtener usuario por ID
   */
  getUsuario(id: string): UsuarioEnterprise | undefined {
    return this.usuarios.get(id);
  }

  /**
   * Crear usuario
   */
  crearUsuario(datos: Omit<UsuarioEnterprise, 'id' | 'metadata'>): UsuarioEnterprise {
    const id = `user_${Date.now()}`;
    const usuario: UsuarioEnterprise = {
      ...datos,
      id,
      metadata: {
        createdAt: new Date().toISOString(),
        createdBy: this.usuarioActual?.id || 'system',
        loginCount: 0,
        deviceFingerprints: [],
      },
    };

    this.usuarios.set(id, usuario);
    this.saveUsuarios();
    this.logAction('create', 'admin', `Usuario creado: ${usuario.nombre}`);
    this.notifyListeners();

    return usuario;
  }

  /**
   * Actualizar usuario
   */
  actualizarUsuario(id: string, datos: Partial<UsuarioEnterprise>): UsuarioEnterprise | null {
    const usuario = this.usuarios.get(id);
    if (!usuario) return null;

    const actualizado = {
      ...usuario,
      ...datos,
      id, // Asegurar que el ID no cambie
      metadata: {
        ...usuario.metadata,
        ...datos.metadata,
      },
    };

    this.usuarios.set(id, actualizado);
    this.saveUsuarios();
    this.logAction('update', 'admin', `Usuario actualizado: ${actualizado.nombre}`);
    this.notifyListeners();

    return actualizado;
  }

  /**
   * Eliminar usuario
   */
  eliminarUsuario(id: string): boolean {
    const usuario = this.usuarios.get(id);
    if (!usuario) return false;

    // No permitir eliminar al usuario actual
    if (this.usuarioActual?.id === id) {
      return false;
    }

    this.usuarios.delete(id);
    this.saveUsuarios();
    this.logAction('delete', 'admin', `Usuario eliminado: ${usuario.nombre}`);
    this.notifyListeners();

    return true;
  }

  /**
   * Cambiar estado de usuario
   */
  cambiarEstadoUsuario(id: string, estado: UsuarioEnterprise['estado']): boolean {
    const usuario = this.usuarios.get(id);
    if (!usuario) return false;

    usuario.estado = estado;
    this.saveUsuarios();
    this.logAction('update', 'admin', `Estado de ${usuario.nombre} cambiado a: ${estado}`);
    this.notifyListeners();

    return true;
  }

  /**
   * Cambiar rol de usuario
   */
  cambiarRolUsuario(usuarioId: string, rolId: string): boolean {
    const usuario = this.usuarios.get(usuarioId);
    if (!usuario) return false;

    const rol = this.roles.get(rolId);
    if (!rol) return false;

    usuario.rolId = rolId;
    usuario.permisosPersonalizados = undefined; // Resetear personalizados
    this.saveUsuarios();
    this.logAction('permission_change', 'admin', `Rol de ${usuario.nombre} cambiado a: ${rol.nombre}`);
    this.notifyListeners();

    return true;
  }

  /**
   * Establecer permisos personalizados
   */
  setPermisosPersonalizados(usuarioId: string, permisos: Partial<PermisosGranulares>): boolean {
    const usuario = this.usuarios.get(usuarioId);
    if (!usuario) return false;

    usuario.permisosPersonalizados = permisos;
    this.saveUsuarios();
    this.logAction('permission_change', 'admin', `Permisos personalizados para: ${usuario.nombre}`);
    this.notifyListeners();

    return true;
  }

  // ==================== GESTIÓN DE ROLES ====================

  /**
   * Obtener todos los roles
   */
  getRoles(): RolEnterprise[] {
    return Array.from(this.roles.values());
  }

  /**
   * Obtener rol por ID
   */
  getRol(id: string): RolEnterprise | undefined {
    return this.roles.get(id);
  }

  /**
   * Crear rol personalizado
   */
  crearRol(datos: Omit<RolEnterprise, 'id' | 'createdAt' | 'updatedAt' | 'esSistema'>): RolEnterprise {
    const id = `rol_${Date.now()}`;
    const rol: RolEnterprise = {
      ...datos,
      id,
      esSistema: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.roles.set(id, rol);
    this.saveRoles();
    this.logAction('create', 'admin', `Rol creado: ${rol.nombre}`);
    this.notifyListeners();

    return rol;
  }

  /**
   * Actualizar rol
   */
  actualizarRol(id: string, datos: Partial<RolEnterprise>): RolEnterprise | null {
    const rol = this.roles.get(id);
    if (!rol || !rol.esEditable) return null;

    const actualizado = {
      ...rol,
      ...datos,
      id, // Asegurar que el ID no cambie
      esSistema: rol.esSistema, // No cambiar si es de sistema
      updatedAt: new Date().toISOString(),
    };

    this.roles.set(id, actualizado);
    this.saveRoles();
    this.logAction('update', 'admin', `Rol actualizado: ${actualizado.nombre}`);
    this.notifyListeners();

    return actualizado;
  }

  /**
   * Eliminar rol
   */
  eliminarRol(id: string): boolean {
    const rol = this.roles.get(id);
    if (!rol || rol.esSistema) return false;

    // Verificar que no haya usuarios con este rol
    const usuariosConRol = Array.from(this.usuarios.values()).filter((u) => u.rolId === id);
    if (usuariosConRol.length > 0) return false;

    this.roles.delete(id);
    this.saveRoles();
    this.logAction('delete', 'admin', `Rol eliminado: ${rol.nombre}`);
    this.notifyListeners();

    return true;
  }

  // ==================== AUDIT LOG ====================

  /**
   * Registrar acción en audit log
   */
  logAction(
    action: AuditLog['action'],
    module: keyof PermisosGranulares,
    details: string,
    metadata?: Record<string, unknown>
  ): void {
    const log: AuditLog = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: this.usuarioActual?.id || 'anonymous',
      userName: this.usuarioActual?.nombre || 'Anónimo',
      action,
      module,
      details,
      metadata,
    };

    this.auditLogs.push(log);
    this.saveAuditLogs();
  }

  /**
   * Obtener audit logs
   */
  getAuditLogs(filtro?: {
    userId?: string;
    action?: AuditLog['action'];
    module?: keyof PermisosGranulares;
    desde?: string;
    hasta?: string;
  }): AuditLog[] {
    let logs = [...this.auditLogs];

    if (filtro?.userId) {
      logs = logs.filter((l) => l.userId === filtro.userId);
    }
    if (filtro?.action) {
      logs = logs.filter((l) => l.action === filtro.action);
    }
    if (filtro?.module) {
      logs = logs.filter((l) => l.module === filtro.module);
    }
    if (filtro?.desde) {
      logs = logs.filter((l) => l.timestamp >= filtro.desde!);
    }
    if (filtro?.hasta) {
      logs = logs.filter((l) => l.timestamp <= filtro.hasta!);
    }

    return logs.reverse(); // Más recientes primero
  }

  // ==================== SUBSCRIPCIONES ====================

  /**
   * Suscribirse a cambios
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // ==================== UTILIDADES ====================

  /**
   * Resetear a valores por defecto
   */
  reset(): void {
    this.usuarios.clear();
    this.roles.clear();
    this.auditLogs = [];

    USUARIOS_DEFAULT.forEach((u) => this.usuarios.set(u.id, u));

    Object.entries(ROLES_DEFAULT).forEach(([id, rol]) => {
      const rolCompleto: RolEnterprise = {
        ...rol,
        id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.roles.set(id, rolCompleto);
    });

    this.logout();
    this.saveUsuarios();
    this.saveRoles();
    this.saveAuditLogs();
    this.notifyListeners();
  }

  /**
   * Exportar configuración
   */
  exportConfig(): { usuarios: UsuarioEnterprise[]; roles: RolEnterprise[] } {
    return {
      usuarios: Array.from(this.usuarios.values()),
      roles: Array.from(this.roles.values()),
    };
  }

  /**
   * Importar configuración
   */
  importConfig(config: { usuarios: UsuarioEnterprise[]; roles: RolEnterprise[] }): void {
    this.usuarios.clear();
    this.roles.clear();

    config.roles.forEach((r) => this.roles.set(r.id, r));
    config.usuarios.forEach((u) => this.usuarios.set(u.id, u));

    this.saveUsuarios();
    this.saveRoles();
    this.notifyListeners();
  }
}

// Singleton
export const permissionService = new PermissionService();
export default permissionService;
