// types/permissions.ts
// Sistema de Permisos Granulares - LITPER PRO Enterprise

// ==================== PERMISOS GRANULARES ====================

export interface PermisosGranulares {
  // === DASHBOARD ===
  dashboard: {
    ver: boolean;
    kpiFinanciero: boolean;
    kpiOperativo: boolean;
    kpiEquipo: boolean;
  };

  // === LOGISTICA ===
  semaforo: {
    acceso: boolean;
    editarEstados: boolean;
    contactarCliente: boolean;
    asignarTransportadora: boolean;
  };
  guias: {
    ver: boolean;
    crear: boolean;
    editar: boolean;
    eliminar: boolean;
    importarExcel: boolean;
    exportar: boolean;
  };
  novedades: {
    ver: boolean;
    gestionar: boolean;
    escalar: boolean;
  };

  // === PROCESOS (Rondas) ===
  procesos: {
    acceso: boolean;
    verTodosUsuarios: boolean;
    importarDatos: boolean;
    verEstadisticas: boolean;
  };

  // === FINANZAS ===
  finanzas: {
    acceso: boolean;
    verIngresos: boolean;
    verGastos: boolean;
    verPyG: boolean;
    crearIngresos: boolean;
    crearGastos: boolean;
    editarRegistros: boolean;
    eliminarRegistros: boolean;
    verHistorialCompleto: boolean;
    exportarReportes: boolean;
    configurarMetas: boolean;
  };

  // === CRM ===
  crm: {
    acceso: boolean;
    verClientes: boolean;
    crearClientes: boolean;
    editarClientes: boolean;
    verHistorialCompras: boolean;
    enviarComunicaciones: boolean;
  };

  // === REPORTES ===
  reportes: {
    acceso: boolean;
    reporteVentas: boolean;
    reporteLogistica: boolean;
    reporteFinanciero: boolean;
    reporteEquipo: boolean;
    crearReportesPersonalizados: boolean;
    programarReportes: boolean;
  };

  // === MARKETING ===
  marketing: {
    acceso: boolean;
    verCampanas: boolean;
    crearCampanas: boolean;
    verROAS: boolean;
    gestionarPresupuesto: boolean;
  };

  // === INTELIGENCIA IA ===
  inteligenciaIA: {
    acceso: boolean;
    chatAsistente: boolean;
    predicciones: boolean;
    analisisAvanzado: boolean;
    entrenarModelos: boolean;
  };

  // === INTEGRACIONES ===
  integraciones: {
    acceso: boolean;
    conectarAPIs: boolean;
    configurarWebhooks: boolean;
    verLogs: boolean;
  };

  // === ADMINISTRACION ===
  admin: {
    acceso: boolean;
    gestionarUsuarios: boolean;
    gestionarRoles: boolean;
    verAuditoria: boolean;
    configuracionGlobal: boolean;
    backupRestaurar: boolean;
  };
}

// ==================== USUARIO ENTERPRISE ====================

export interface UsuarioEnterprise {
  id: string;
  username: string;
  nombre: string;
  pin?: string;
  password?: string;
  email?: string;
  telefono?: string;
  avatar: string;
  clase?: string; // RPG class
  rolId: string;
  permisosPersonalizados?: Partial<PermisosGranulares>;
  estado: 'activo' | 'inactivo' | 'suspendido';
  departamento?: string;
  metadata: {
    createdAt: string;
    createdBy: string;
    lastLogin?: string;
    loginCount: number;
    deviceFingerprints: string[];
  };
}

// ==================== ROLES ====================

export interface RolEnterprise {
  id: string;
  nombre: string;
  descripcion: string;
  color: string;
  icono: string;
  permisos: PermisosGranulares;
  esEditable: boolean;
  esSistema: boolean;
  createdAt: string;
  updatedAt: string;
}

export type RolPredefinido =
  | 'superadmin'
  | 'admin'
  | 'gerente_finanzas'
  | 'gerente_operaciones'
  | 'vendedor'
  | 'operador'
  | 'viewer';

// ==================== PERMISOS DEFAULT POR ROL ====================

export const PERMISOS_COMPLETOS: PermisosGranulares = {
  dashboard: { ver: true, kpiFinanciero: true, kpiOperativo: true, kpiEquipo: true },
  semaforo: { acceso: true, editarEstados: true, contactarCliente: true, asignarTransportadora: true },
  guias: { ver: true, crear: true, editar: true, eliminar: true, importarExcel: true, exportar: true },
  novedades: { ver: true, gestionar: true, escalar: true },
  procesos: { acceso: true, verTodosUsuarios: true, importarDatos: true, verEstadisticas: true },
  finanzas: { acceso: true, verIngresos: true, verGastos: true, verPyG: true, crearIngresos: true, crearGastos: true, editarRegistros: true, eliminarRegistros: true, verHistorialCompleto: true, exportarReportes: true, configurarMetas: true },
  crm: { acceso: true, verClientes: true, crearClientes: true, editarClientes: true, verHistorialCompras: true, enviarComunicaciones: true },
  reportes: { acceso: true, reporteVentas: true, reporteLogistica: true, reporteFinanciero: true, reporteEquipo: true, crearReportesPersonalizados: true, programarReportes: true },
  marketing: { acceso: true, verCampanas: true, crearCampanas: true, verROAS: true, gestionarPresupuesto: true },
  inteligenciaIA: { acceso: true, chatAsistente: true, predicciones: true, analisisAvanzado: true, entrenarModelos: true },
  integraciones: { acceso: true, conectarAPIs: true, configurarWebhooks: true, verLogs: true },
  admin: { acceso: true, gestionarUsuarios: true, gestionarRoles: true, verAuditoria: true, configuracionGlobal: true, backupRestaurar: true },
};

export const PERMISOS_VACIO: PermisosGranulares = {
  dashboard: { ver: false, kpiFinanciero: false, kpiOperativo: false, kpiEquipo: false },
  semaforo: { acceso: false, editarEstados: false, contactarCliente: false, asignarTransportadora: false },
  guias: { ver: false, crear: false, editar: false, eliminar: false, importarExcel: false, exportar: false },
  novedades: { ver: false, gestionar: false, escalar: false },
  procesos: { acceso: false, verTodosUsuarios: false, importarDatos: false, verEstadisticas: false },
  finanzas: { acceso: false, verIngresos: false, verGastos: false, verPyG: false, crearIngresos: false, crearGastos: false, editarRegistros: false, eliminarRegistros: false, verHistorialCompleto: false, exportarReportes: false, configurarMetas: false },
  crm: { acceso: false, verClientes: false, crearClientes: false, editarClientes: false, verHistorialCompras: false, enviarComunicaciones: false },
  reportes: { acceso: false, reporteVentas: false, reporteLogistica: false, reporteFinanciero: false, reporteEquipo: false, crearReportesPersonalizados: false, programarReportes: false },
  marketing: { acceso: false, verCampanas: false, crearCampanas: false, verROAS: false, gestionarPresupuesto: false },
  inteligenciaIA: { acceso: false, chatAsistente: false, predicciones: false, analisisAvanzado: false, entrenarModelos: false },
  integraciones: { acceso: false, conectarAPIs: false, configurarWebhooks: false, verLogs: false },
  admin: { acceso: false, gestionarUsuarios: false, gestionarRoles: false, verAuditoria: false, configuracionGlobal: false, backupRestaurar: false },
};

// ==================== ROLES PREDEFINIDOS ====================

export const ROLES_DEFAULT: Record<RolPredefinido, Omit<RolEnterprise, 'id' | 'createdAt' | 'updatedAt'>> = {
  superadmin: {
    nombre: 'Super Administrador',
    descripcion: 'Acceso total al sistema',
    color: '#DC2626',
    icono: '👑',
    permisos: PERMISOS_COMPLETOS,
    esEditable: false,
    esSistema: true,
  },
  admin: {
    nombre: 'Administrador',
    descripcion: 'Gestiona operaciones y equipo',
    color: '#8B5CF6',
    icono: '⚡',
    permisos: {
      ...PERMISOS_COMPLETOS,
      admin: { ...PERMISOS_COMPLETOS.admin, configuracionGlobal: false, backupRestaurar: false },
    },
    esEditable: true,
    esSistema: true,
  },
  gerente_finanzas: {
    nombre: 'Gerente de Finanzas',
    descripcion: 'Control total del área financiera',
    color: '#10B981',
    icono: '💰',
    permisos: {
      ...PERMISOS_VACIO,
      dashboard: { ver: true, kpiFinanciero: true, kpiOperativo: false, kpiEquipo: false },
      finanzas: PERMISOS_COMPLETOS.finanzas,
      reportes: { ...PERMISOS_VACIO.reportes, acceso: true, reporteFinanciero: true, reporteVentas: true },
      inteligenciaIA: { ...PERMISOS_VACIO.inteligenciaIA, acceso: true, chatAsistente: true },
    },
    esEditable: true,
    esSistema: true,
  },
  gerente_operaciones: {
    nombre: 'Gerente de Operaciones',
    descripcion: 'Control de logística y procesos',
    color: '#3B82F6',
    icono: '📦',
    permisos: {
      ...PERMISOS_VACIO,
      dashboard: { ver: true, kpiFinanciero: false, kpiOperativo: true, kpiEquipo: true },
      semaforo: PERMISOS_COMPLETOS.semaforo,
      guias: PERMISOS_COMPLETOS.guias,
      novedades: PERMISOS_COMPLETOS.novedades,
      procesos: PERMISOS_COMPLETOS.procesos,
      reportes: { ...PERMISOS_VACIO.reportes, acceso: true, reporteLogistica: true, reporteEquipo: true },
      inteligenciaIA: { ...PERMISOS_VACIO.inteligenciaIA, acceso: true, chatAsistente: true, predicciones: true },
    },
    esEditable: true,
    esSistema: true,
  },
  vendedor: {
    nombre: 'Vendedor',
    descripcion: 'Gestión de ventas y clientes',
    color: '#F59E0B',
    icono: '🛒',
    permisos: {
      ...PERMISOS_VACIO,
      dashboard: { ver: true, kpiFinanciero: false, kpiOperativo: false, kpiEquipo: false },
      crm: PERMISOS_COMPLETOS.crm,
      guias: { ...PERMISOS_VACIO.guias, ver: true, crear: true },
      inteligenciaIA: { ...PERMISOS_VACIO.inteligenciaIA, acceso: true, chatAsistente: true },
    },
    esEditable: true,
    esSistema: true,
  },
  operador: {
    nombre: 'Operador',
    descripcion: 'Trabajo operativo diario',
    color: '#6B7280',
    icono: '🔧',
    permisos: {
      ...PERMISOS_VACIO,
      dashboard: { ver: true, kpiFinanciero: false, kpiOperativo: true, kpiEquipo: false },
      semaforo: { acceso: true, editarEstados: true, contactarCliente: true, asignarTransportadora: false },
      guias: { ver: true, crear: false, editar: false, eliminar: false, importarExcel: false, exportar: true },
      novedades: { ver: true, gestionar: true, escalar: false },
      procesos: { acceso: true, verTodosUsuarios: false, importarDatos: false, verEstadisticas: false },
    },
    esEditable: true,
    esSistema: true,
  },
  viewer: {
    nombre: 'Solo Lectura',
    descripcion: 'Solo puede ver información',
    color: '#9CA3AF',
    icono: '👁️',
    permisos: {
      ...PERMISOS_VACIO,
      dashboard: { ver: true, kpiFinanciero: true, kpiOperativo: true, kpiEquipo: true },
      semaforo: { acceso: true, editarEstados: false, contactarCliente: false, asignarTransportadora: false },
      guias: { ver: true, crear: false, editar: false, eliminar: false, importarExcel: false, exportar: true },
      novedades: { ver: true, gestionar: false, escalar: false },
      procesos: { acceso: true, verTodosUsuarios: true, importarDatos: false, verEstadisticas: true },
      finanzas: { ...PERMISOS_VACIO.finanzas, acceso: true, verIngresos: true, verGastos: true, verPyG: true },
      reportes: { acceso: true, reporteVentas: true, reporteLogistica: true, reporteFinanciero: true, reporteEquipo: true, crearReportesPersonalizados: false, programarReportes: false },
    },
    esEditable: true,
    esSistema: true,
  },
};

// ==================== USUARIOS DEFAULT (9 LITPER) ====================

export const USUARIOS_DEFAULT: UsuarioEnterprise[] = [
  { id: '1', username: 'catalina', nombre: 'CATALINA', pin: '1234', avatar: '⚔️', clase: 'Paladín', rolId: 'admin', departamento: 'Operaciones', estado: 'activo', metadata: { createdAt: new Date().toISOString(), createdBy: 'system', loginCount: 0, deviceFingerprints: [] } },
  { id: '2', username: 'angie', nombre: 'ANGIE', pin: '1234', avatar: '🏹', clase: 'Arquera', rolId: 'gerente_operaciones', departamento: 'Logística', estado: 'activo', metadata: { createdAt: new Date().toISOString(), createdBy: 'system', loginCount: 0, deviceFingerprints: [] } },
  { id: '3', username: 'carolina', nombre: 'CAROLINA', pin: '1234', avatar: '🔮', clase: 'Maga', rolId: 'gerente_operaciones', departamento: 'Logística', estado: 'activo', metadata: { createdAt: new Date().toISOString(), createdBy: 'system', loginCount: 0, deviceFingerprints: [] } },
  { id: '4', username: 'alejandra', nombre: 'ALEJANDRA', pin: '1234', avatar: '🛡️', clase: 'Escudera', rolId: 'operador', departamento: 'Operaciones', estado: 'activo', metadata: { createdAt: new Date().toISOString(), createdBy: 'system', loginCount: 0, deviceFingerprints: [] } },
  { id: '5', username: 'evan', nombre: 'EVAN', pin: '1234', avatar: '⚡', clase: 'Mago Rayo', rolId: 'operador', departamento: 'Logística', estado: 'activo', metadata: { createdAt: new Date().toISOString(), createdBy: 'system', loginCount: 0, deviceFingerprints: [] } },
  { id: '6', username: 'jimmy', nombre: 'JIMMY', pin: '1234', avatar: '🗡️', clase: 'Espadachín', rolId: 'gerente_operaciones', departamento: 'Operaciones', estado: 'activo', metadata: { createdAt: new Date().toISOString(), createdBy: 'system', loginCount: 0, deviceFingerprints: [] } },
  { id: '7', username: 'felipe', nombre: 'FELIPE', pin: '1234', avatar: '🧪', clase: 'Alquimista', rolId: 'operador', departamento: 'Logística', estado: 'activo', metadata: { createdAt: new Date().toISOString(), createdBy: 'system', loginCount: 0, deviceFingerprints: [] } },
  { id: '8', username: 'norma', nombre: 'NORMA', pin: '1234', avatar: '📿', clase: 'Sacerdotisa', rolId: 'gerente_finanzas', departamento: 'Finanzas', estado: 'activo', metadata: { createdAt: new Date().toISOString(), createdBy: 'system', loginCount: 0, deviceFingerprints: [] } },
  { id: '9', username: 'karen', nombre: 'KAREN', pin: '1234', avatar: '🎭', clase: 'Pícara', rolId: 'vendedor', departamento: 'Ventas', estado: 'activo', metadata: { createdAt: new Date().toISOString(), createdBy: 'system', loginCount: 0, deviceFingerprints: [] } },
];

// ==================== AUDITORIA ====================

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: 'login' | 'logout' | 'create' | 'update' | 'delete' | 'export' | 'import' | 'view' | 'permission_change';
  module: keyof PermisosGranulares;
  details: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}
