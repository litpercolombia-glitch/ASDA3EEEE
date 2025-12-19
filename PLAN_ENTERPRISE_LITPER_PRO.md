# LITPER PRO ENTERPRISE - Plan de Transformacion Nivel Amazon

## Vision General

Transformar LITPER PRO en una plataforma enterprise de clase mundial con:
- Sistema de permisos granular por funcionalidad
- Centro financiero completamente funcional con P&L real
- Chat IA con conocimiento del negocio y skills especializados
- Panel administrativo profesional con herramientas reales
- Seguridad y control de acceso nivel enterprise

---

## FASE 1: SISTEMA DE SEGURIDAD Y PERMISOS (Prioridad Alta)

### 1.1 Nuevo Sistema de Usuarios (Sin Email Obligatorio)

```typescript
interface Usuario {
  id: string;
  username: string;           // Identificador unico (obligatorio)
  nombre: string;             // Nombre completo
  pin?: string;               // PIN de 4-6 digitos (alternativa a password)
  password?: string;          // Password tradicional (opcional)
  email?: string;             // OPCIONAL - solo si quiere notificaciones
  telefono?: string;          // OPCIONAL
  avatar: string;             // Avatar/foto
  rolId: string;              // Rol asignado
  permisosPersonalizados?: PermisosGranulares; // Override de permisos
  estado: 'activo' | 'inactivo' | 'suspendido';
  metadata: {
    createdAt: string;
    createdBy: string;        // Quien lo creo
    lastLogin?: string;
    loginCount: number;
    deviceFingerprints: string[]; // Dispositivos autorizados
  };
}
```

### 1.2 Sistema de Permisos Granulares

```typescript
// Cada modulo/funcionalidad tiene su propio permiso
interface PermisosGranulares {
  // === MODULOS PRINCIPALES ===
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
    verTodosUsuarios: boolean;  // O solo el suyo
    importarDatos: boolean;
    verEstadisticas: boolean;
  };

  // === FINANZAS ===
  finanzas: {
    acceso: boolean;
    verIngresos: boolean;
    verGastos: boolean;
    verPyG: boolean;           // Perdidas y Ganancias
    crearIngresos: boolean;
    crearGastos: boolean;
    editarRegistros: boolean;
    eliminarRegistros: boolean;
    verHistorialCompleto: boolean;
    exportarReportes: boolean;
    configurarMetas: boolean;
  };

  // === CLIENTES/CRM ===
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

  // === SOPORTE ===
  soporte: {
    acceso: boolean;
    verTickets: boolean;
    responderTickets: boolean;
    escalarTickets: boolean;
    verMetricas: boolean;
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
```

### 1.3 Roles Predefinidos

```typescript
const ROLES_DEFAULT = {
  superadmin: {
    nombre: 'Super Administrador',
    descripcion: 'Acceso total al sistema',
    permisos: '* (todos)',
    color: '#FF0000'
  },
  admin: {
    nombre: 'Administrador',
    descripcion: 'Gestiona operaciones y equipo',
    permisos: 'Todo excepto configuracion critica',
    color: '#8B5CF6'
  },
  gerente_finanzas: {
    nombre: 'Gerente de Finanzas',
    descripcion: 'Control total de area financiera',
    permisos: 'Finanzas completo + reportes financieros',
    color: '#10B981'
  },
  gerente_operaciones: {
    nombre: 'Gerente de Operaciones',
    descripcion: 'Control de logistica y procesos',
    permisos: 'Semaforo, guias, novedades, procesos',
    color: '#3B82F6'
  },
  vendedor: {
    nombre: 'Vendedor',
    descripcion: 'Gestion de ventas y clientes',
    permisos: 'CRM, pedidos basico',
    color: '#F59E0B'
  },
  operador: {
    nombre: 'Operador',
    descripcion: 'Trabajo operativo diario',
    permisos: 'Semaforo ver, procesos propio usuario',
    color: '#6B7280'
  },
  viewer: {
    nombre: 'Solo Lectura',
    descripcion: 'Solo puede ver informacion',
    permisos: 'Ver todo sin editar',
    color: '#9CA3AF'
  }
};
```

### 1.4 UI de Gestion de Permisos

```
+----------------------------------------------------------+
|  GESTION DE USUARIOS Y PERMISOS                          |
+----------------------------------------------------------+
|                                                          |
|  [+ Crear Usuario]  [+ Crear Rol]  [Auditoria]          |
|                                                          |
|  USUARIOS ACTIVOS (9)                                    |
|  +------------------------------------------------------+
|  | Avatar | Nombre    | Usuario | Rol        | Estado   |
|  |--------|-----------|---------|------------|----------|
|  | [IMG]  | Catalina  | cata01  | Admin      | Activo   |
|  | [IMG]  | Jimmy     | jimmy   | Operador   | Activo   |
|  | [IMG]  | Karen     | karen   | Vendedor   | Activo   |
|  +------------------------------------------------------+
|                                                          |
|  AL HACER CLIC EN USUARIO:                              |
|  +------------------------------------------------------+
|  |  PERMISOS DE: Catalina                               |
|  |                                                       |
|  |  Usar permisos del rol: [x] Admin                    |
|  |  [ ] Personalizar permisos                           |
|  |                                                       |
|  |  MODULOS:                                            |
|  |  +--------------------------------------------------+|
|  |  | Dashboard          [x] Ver  [x] KPIs             ||
|  |  | Semaforo           [x] Ver  [x] Editar  [ ] Asig ||
|  |  | Guias              [x] Todo                       ||
|  |  | Finanzas           [x] Ver  [ ] Editar  [ ] PyG  ||
|  |  | Procesos           [x] Ver todos  [x] Importar   ||
|  |  | CRM                [x] Ver  [x] Editar           ||
|  |  | Reportes           [x] Ver  [ ] Crear            ||
|  |  | Admin              [ ] Acceso                     ||
|  |  +--------------------------------------------------+|
|  +------------------------------------------------------+
+----------------------------------------------------------+
```

---

## FASE 2: CENTRO FINANCIERO PROFESIONAL

### 2.1 Arquitectura de Datos Financieros

```typescript
// === INGRESOS ===
interface Ingreso {
  id: string;
  tipo: 'venta' | 'servicio' | 'devolucion_proveedor' | 'otro';
  fuente: 'dropi' | 'shopify' | 'manual' | 'api';

  // Datos de venta
  ordenId?: string;
  cliente?: string;
  productos: ProductoVendido[];

  // Montos
  ventaBruta: number;
  descuentos: number;
  ventaNeta: number;

  // Costos directos (se restan)
  costoProducto: number;
  costoEnvio: number;
  comisionPlataforma: number;
  comisionPasarela: number;

  // Resultado
  utilidadBruta: number;   // ventaNeta - costos directos

  // Metadata
  fecha: string;
  mes: string;             // YYYY-MM
  archivoOrigen?: string;  // Excel de donde se importo
  notas?: string;
  createdAt: string;
  createdBy: string;
}

// === GASTOS ===
interface Gasto {
  id: string;
  categoria: CategoriaGasto;
  subcategoria: string;

  descripcion: string;
  monto: number;

  // Clasificacion
  tipoGasto: 'fijo' | 'variable' | 'extraordinario';
  deducible: boolean;

  // Recurrencia
  esRecurrente: boolean;
  frecuencia?: 'diario' | 'semanal' | 'quincenal' | 'mensual' | 'anual';
  proximoPago?: string;

  // Comprobante
  tieneComprobante: boolean;
  comprobanteUrl?: string;
  numeroFactura?: string;

  // Metadata
  proveedor?: string;
  fecha: string;
  mes: string;
  createdAt: string;
  createdBy: string;
}

type CategoriaGasto =
  | 'publicidad'           // Meta Ads, Google Ads, TikTok, Influencers
  | 'nomina'               // Salarios, prestaciones
  | 'plataformas'          // Shopify, apps, herramientas
  | 'logistica'            // Envios adicionales, almacenamiento
  | 'oficina'              // Renta, servicios, internet
  | 'bancarios'            // Comisiones, intereses
  | 'impuestos'            // IVA, renta, otros
  | 'inventario'           // Compra de productos
  | 'marketing_otros'      // Diseno, contenido, otros
  | 'legal'                // Contadores, abogados
  | 'tecnologia'           // Servidores, dominios, software
  | 'otros';

// === ESTADO DE RESULTADOS (P&G) ===
interface EstadoResultados {
  periodo: string;         // YYYY-MM

  // INGRESOS
  ventasBrutas: number;
  descuentos: number;
  devoluciones: number;
  ventasNetas: number;     // = brutas - descuentos - devoluciones

  // COSTO DE VENTAS
  costoProductos: number;
  costoEnvios: number;
  comisionesPlataforma: number;
  comisionesPasarela: number;
  totalCostoVentas: number;

  // UTILIDAD BRUTA
  utilidadBruta: number;   // = ventasNetas - costoVentas
  margenBruto: number;     // = utilidadBruta / ventasNetas * 100

  // GASTOS OPERATIVOS
  gastosPublicidad: number;
  gastosNomina: number;
  gastosPlataformas: number;
  gastosOficina: number;
  gastosLogistica: number;
  otrosGastosOperativos: number;
  totalGastosOperativos: number;

  // UTILIDAD OPERATIVA (EBITDA)
  utilidadOperativa: number; // = utilidadBruta - gastosOperativos
  margenOperativo: number;

  // OTROS GASTOS
  gastosFinancieros: number;  // Intereses, comisiones bancarias
  impuestos: number;
  depreciacion: number;

  // UTILIDAD NETA
  utilidadNeta: number;    // = utilidadOperativa - otros gastos
  margenNeto: number;      // = utilidadNeta / ventasNetas * 100

  // METRICAS ADICIONALES
  roas: number;            // Return on Ad Spend
  cpa: number;             // Costo por Adquisicion
  aov: number;             // Average Order Value
  ltv: number;             // Lifetime Value estimado

  // COMPARATIVAS
  vsAnterior: {
    ventasNetas: number;   // % cambio
    utilidadNeta: number;
    margenNeto: number;
  };
}
```

### 2.2 Dashboard Financiero Mejorado

```
+------------------------------------------------------------------+
|  CENTRO FINANCIERO - Diciembre 2024                              |
+------------------------------------------------------------------+
|                                                                  |
|  RESUMEN EJECUTIVO                                               |
|  +------------+  +------------+  +------------+  +------------+  |
|  | VENTAS     |  | UTILIDAD   |  | MARGEN     |  | ROAS       |  |
|  | $45.2M     |  | $12.8M     |  | 28.3%      |  | 3.2x       |  |
|  | +12% vs ant|  | +8% vs ant |  | +2.1 pts   |  | +0.4       |  |
|  +------------+  +------------+  +------------+  +------------+  |
|                                                                  |
|  [Ingresos] [Gastos] [P&G] [Flujo Caja] [Proyecciones] [Config] |
|                                                                  |
+------------------------------------------------------------------+
|                                                                  |
|  ESTADO DE PERDIDAS Y GANANCIAS - Diciembre 2024                |
|  +--------------------------------------------------------------+|
|  | CONCEPTO                          |   MONTO   |      %      ||
|  |-----------------------------------|-----------|-------------||
|  | INGRESOS                          |           |             ||
|  |   Ventas Brutas                   | $52,340,000|   115.8%   ||
|  |   (-) Descuentos                  | -$3,120,000|    -6.9%   ||
|  |   (-) Devoluciones                | -$4,020,000|    -8.9%   ||
|  |   = VENTAS NETAS                  | $45,200,000|   100.0%   ||
|  |-----------------------------------|-----------|-------------||
|  | COSTO DE VENTAS                   |           |             ||
|  |   Costo de Productos              | $18,080,000|    40.0%   ||
|  |   Costo de Envios                 |  $4,520,000|    10.0%   ||
|  |   Comisiones Plataforma           |  $2,260,000|     5.0%   ||
|  |   Comisiones Pasarela             |  $1,356,000|     3.0%   ||
|  |   = TOTAL COSTO VENTAS            | $26,216,000|    58.0%   ||
|  |-----------------------------------|-----------|-------------||
|  | = UTILIDAD BRUTA                  | $18,984,000|    42.0%   ||
|  |-----------------------------------|-----------|-------------||
|  | GASTOS OPERATIVOS                 |           |             ||
|  |   Publicidad                      |  $3,500,000|     7.7%   ||
|  |   Nomina                          |  $1,200,000|     2.7%   ||
|  |   Plataformas y Software          |    $350,000|     0.8%   ||
|  |   Oficina y Servicios             |    $280,000|     0.6%   ||
|  |   Otros Operativos                |    $156,000|     0.3%   ||
|  |   = TOTAL GASTOS OPERATIVOS       |  $5,486,000|    12.1%   ||
|  |-----------------------------------|-----------|-------------||
|  | = UTILIDAD OPERATIVA (EBITDA)     | $13,498,000|    29.9%   ||
|  |-----------------------------------|-----------|-------------||
|  | OTROS GASTOS                      |           |             ||
|  |   Gastos Financieros              |    $180,000|     0.4%   ||
|  |   Impuestos                       |    $518,000|     1.1%   ||
|  |   = TOTAL OTROS                   |    $698,000|     1.5%   ||
|  |-----------------------------------|-----------|-------------||
|  | = UTILIDAD NETA                   | $12,800,000|    28.3%   ||
|  +--------------------------------------------------------------+|
|                                                                  |
|  [Exportar PDF] [Exportar Excel] [Comparar Periodos] [Detalles] |
|                                                                  |
+------------------------------------------------------------------+
```

### 2.3 Trazabilidad de Archivos

```typescript
interface ArchivoFinanciero {
  id: string;
  nombre: string;
  tipo: 'dropi' | 'gastos' | 'nomina' | 'banco' | 'otro';
  fechaSubida: string;
  subidoPor: string;

  // Datos extraidos
  registrosImportados: number;
  periodosCubiertos: string[];  // ['2024-11', '2024-12']
  montoTotal: number;

  // Trazabilidad
  registrosIds: string[];       // IDs de ingresos/gastos creados

  // Estado
  estado: 'procesando' | 'completado' | 'error' | 'parcial';
  errores?: string[];
}

// Al ver un registro financiero, mostrar:
// "Importado desde: dropi_diciembre_2024.xlsx el 15/12/2024 por Admin"
```

---

## FASE 3: CHAT IA CON INTELIGENCIA DE NEGOCIO

### 3.1 Arquitectura del Asistente

```typescript
interface AsistenteIA {
  // Contexto del negocio
  contexto: {
    empresa: string;
    industria: 'ecommerce' | 'servicios' | 'retail';
    pais: 'CO' | 'EC' | 'CL';

    // Datos en tiempo real
    financiero: EstadoResultados;
    operativo: {
      guiasPendientes: number;
      novedadesAbiertas: number;
      tasaEntrega: number;
    };
    equipo: {
      usuariosActivos: number;
      rondasHoy: number;
    };
  };

  // Skills disponibles
  skills: Skill[];

  // Memoria de conversacion
  memoria: {
    conversacionActual: Mensaje[];
    contextosPrevios: ResumenConversacion[];
    preferenciasUsuario: Record<string, any>;
  };
}

interface Skill {
  id: string;
  nombre: string;
  descripcion: string;
  categoria: 'finanzas' | 'logistica' | 'reportes' | 'analisis' | 'acciones';

  // Cuando activar
  triggers: string[];        // Palabras clave
  ejemplos: string[];        // Ejemplos de uso

  // Que hace
  ejecutar: (params: any) => Promise<ResultadoSkill>;

  // Permisos requeridos
  permisosRequeridos: string[];
}
```

### 3.2 Skills del Asistente

```typescript
const SKILLS_ASISTENTE: Skill[] = [
  // === FINANZAS ===
  {
    id: 'consulta_pyg',
    nombre: 'Consultar P&G',
    categoria: 'finanzas',
    triggers: ['perdidas', 'ganancias', 'utilidad', 'margen', 'cuanto gane'],
    ejemplos: [
      'Cuanto gane este mes?',
      'Cual es mi margen neto?',
      'Comparar utilidad con mes anterior'
    ],
    ejecutar: async (params) => {
      // Obtiene P&G del periodo solicitado
      // Genera resumen ejecutivo
      // Incluye graficos si aplica
    }
  },
  {
    id: 'analisis_gastos',
    nombre: 'Analizar Gastos',
    categoria: 'finanzas',
    triggers: ['gastos', 'donde gasto', 'reducir costos', 'publicidad'],
    ejemplos: [
      'En que estoy gastando mas?',
      'Cuanto gaste en publicidad?',
      'Desglose de gastos fijos'
    ]
  },
  {
    id: 'flujo_caja',
    nombre: 'Proyeccion Flujo de Caja',
    categoria: 'finanzas',
    triggers: ['flujo', 'liquidez', 'efectivo', 'puedo pagar'],
    ejemplos: [
      'Tengo liquidez para pagar nomina?',
      'Proyeccion de flujo proximos 30 dias'
    ]
  },

  // === LOGISTICA ===
  {
    id: 'estado_envios',
    nombre: 'Estado de Envios',
    categoria: 'logistica',
    triggers: ['envios', 'guias', 'pendientes', 'novedades', 'entregas'],
    ejemplos: [
      'Cuantas guias pendientes hay?',
      'Novedades criticas del dia',
      'Tasa de entrega esta semana'
    ]
  },
  {
    id: 'problemas_transportadora',
    nombre: 'Analisis Transportadoras',
    categoria: 'logistica',
    triggers: ['transportadora', 'coordinadora', 'servientrega', 'problemas'],
    ejemplos: [
      'Cual transportadora tiene mas problemas?',
      'Comparar tiempos de entrega por transportadora'
    ]
  },

  // === REPORTES ===
  {
    id: 'generar_reporte',
    nombre: 'Generar Reporte',
    categoria: 'reportes',
    triggers: ['reporte', 'informe', 'resumen', 'exportar'],
    ejemplos: [
      'Genera reporte de ventas del mes',
      'Necesito un informe para inversionistas',
      'Exportar P&G en PDF'
    ]
  },

  // === ANALISIS ===
  {
    id: 'tendencias',
    nombre: 'Analisis de Tendencias',
    categoria: 'analisis',
    triggers: ['tendencia', 'crecimiento', 'proyeccion', 'prediccion'],
    ejemplos: [
      'Como va el crecimiento vs año pasado?',
      'Proyeccion de ventas diciembre'
    ]
  },
  {
    id: 'alertas_negocio',
    nombre: 'Alertas del Negocio',
    categoria: 'analisis',
    triggers: ['alertas', 'problemas', 'atencion', 'urgente'],
    ejemplos: [
      'Hay algo que requiera mi atencion?',
      'Alertas criticas del negocio'
    ]
  },

  // === ACCIONES ===
  {
    id: 'registrar_gasto',
    nombre: 'Registrar Gasto',
    categoria: 'acciones',
    triggers: ['registrar gasto', 'agregar gasto', 'nuevo gasto'],
    ejemplos: [
      'Registrar gasto de $500,000 en publicidad',
      'Agregar pago de nomina'
    ]
  },
  {
    id: 'buscar_archivo',
    nombre: 'Buscar en Archivos',
    categoria: 'acciones',
    triggers: ['archivo', 'excel', 'documento', 'donde esta'],
    ejemplos: [
      'De donde salio el ingreso de $2M del 15?',
      'Buscar archivo de gastos noviembre'
    ]
  }
];
```

### 3.3 Interfaz del Chat

```
+------------------------------------------------------------------+
|  ASISTENTE IA - LITPER PRO                               [_][X]  |
+------------------------------------------------------------------+
|                                                                  |
|  Hola! Soy tu asistente de negocio. Tengo acceso a:             |
|  - Datos financieros en tiempo real                             |
|  - Estado de operaciones y logistica                            |
|  - Historial de archivos importados                             |
|                                                                  |
|  SKILLS DISPONIBLES:                                            |
|  [Finanzas] [Logistica] [Reportes] [Analisis] [Acciones]       |
|                                                                  |
+------------------------------------------------------------------+
|                                                                  |
|  Usuario: Cuanto gane este mes?                                 |
|                                                                  |
|  Asistente: Basado en los datos de Diciembre 2024:             |
|                                                                  |
|  +----------------------------------------------------------+  |
|  | RESUMEN FINANCIERO - Diciembre 2024                      |  |
|  |                                                          |  |
|  | Ventas Netas:      $45,200,000                          |  |
|  | Utilidad Bruta:    $18,984,000  (42.0%)                 |  |
|  | Utilidad Neta:     $12,800,000  (28.3%)                 |  |
|  |                                                          |  |
|  | vs Noviembre: +8.2% en utilidad neta                    |  |
|  |                                                          |  |
|  | Fuentes de datos:                                        |  |
|  | - dropi_dic_2024.xlsx (234 ordenes)                     |  |
|  | - gastos_dic_2024.xlsx (45 registros)                   |  |
|  +----------------------------------------------------------+  |
|                                                                  |
|  [Ver P&G Completo] [Desglosar Gastos] [Comparar Meses]        |
|                                                                  |
|  Usuario: De donde salio el ingreso grande del dia 15?          |
|                                                                  |
|  Asistente: El 15 de diciembre hubo un ingreso de $3,450,000:  |
|                                                                  |
|  Origen: dropi_dic_2024.xlsx                                    |
|  Subido por: Admin el 16/12/2024                                |
|  Detalle: 28 ordenes entregadas                                 |
|  - Orden #12345: $450,000 (Cliente: Juan Perez)                |
|  - Orden #12346: $320,000 (Cliente: Maria Garcia)              |
|  ... [Ver todas las ordenes]                                    |
|                                                                  |
+------------------------------------------------------------------+
|  Escribe tu pregunta...                              [Enviar]   |
+------------------------------------------------------------------+
```

---

## FASE 4: PANEL ADMINISTRATIVO ENTERPRISE

### 4.1 Estructura del Admin Panel

```typescript
const ADMIN_SECTIONS = {
  // Centro de Control
  dashboard: {
    nombre: 'Centro de Control',
    icono: 'LayoutDashboard',
    subsecciones: ['KPIs', 'Alertas', 'Actividad Reciente']
  },

  // Operaciones
  operaciones: {
    nombre: 'Operaciones',
    icono: 'Truck',
    subsecciones: ['Semaforo', 'Guias', 'Novedades', 'Transportadoras']
  },

  // Finanzas
  finanzas: {
    nombre: 'Finanzas',
    icono: 'DollarSign',
    subsecciones: ['Dashboard', 'Ingresos', 'Gastos', 'P&G', 'Flujo de Caja', 'Metas']
  },

  // CRM
  crm: {
    nombre: 'Clientes',
    icono: 'Users',
    subsecciones: ['Directorio', 'Segmentos', 'Comunicaciones', 'Historial']
  },

  // Marketing
  marketing: {
    nombre: 'Marketing',
    icono: 'Megaphone',
    subsecciones: ['Campanas', 'ROAS', 'Creativos', 'Audiencias']
  },

  // Reportes
  reportes: {
    nombre: 'Reportes',
    icono: 'FileText',
    subsecciones: ['Ventas', 'Logistica', 'Financiero', 'Custom', 'Programados']
  },

  // Equipo
  equipo: {
    nombre: 'Equipo',
    icono: 'UserCog',
    subsecciones: ['Usuarios', 'Roles', 'Permisos', 'Actividad', 'Procesos']
  },

  // Inteligencia
  inteligencia: {
    nombre: 'Inteligencia IA',
    icono: 'Brain',
    subsecciones: ['Asistente', 'Predicciones', 'Patrones', 'Insights']
  },

  // Integraciones
  integraciones: {
    nombre: 'Integraciones',
    icono: 'Plug',
    subsecciones: ['APIs', 'Webhooks', 'Dropi', 'Shopify', 'Transportadoras']
  },

  // Configuracion
  configuracion: {
    nombre: 'Configuracion',
    icono: 'Settings',
    subsecciones: ['General', 'Seguridad', 'Notificaciones', 'Backup', 'Logs']
  }
};
```

### 4.2 Herramientas Funcionales

```typescript
// Cada herramienta es completamente funcional
const HERRAMIENTAS_ADMIN = {
  // === IMPORTACION DE DATOS ===
  importador: {
    soporta: ['xlsx', 'csv', 'json', 'pdf'],
    plantillas: {
      dropi: 'Ventas de Dropi',
      gastos: 'Registro de Gastos',
      nomina: 'Pago de Nomina',
      inventario: 'Stock de Productos'
    },
    validacion: true,
    previsualizacion: true,
    mapeoColumnas: true
  },

  // === EXPORTACION ===
  exportador: {
    formatos: ['xlsx', 'csv', 'pdf', 'json'],
    reportes: {
      pyg: 'Estado de Resultados',
      ventas: 'Reporte de Ventas',
      logistica: 'Reporte Logistico',
      equipo: 'Productividad del Equipo'
    },
    programable: true,  // Envio automatico
    destinatarios: true // Email/WhatsApp
  },

  // === BACKUP Y RESTAURACION ===
  backup: {
    automatico: true,
    frecuencia: ['diario', 'semanal', 'mensual'],
    almacenamiento: ['local', 'drive', 'dropbox'],
    restaurar: true,
    versionado: true
  },

  // === AUDITORIA ===
  auditoria: {
    registra: [
      'login/logout',
      'cambios_datos',
      'exportaciones',
      'cambios_permisos',
      'eliminaciones'
    ],
    busqueda: true,
    exportable: true,
    retencion: '1 ano'
  }
};
```

---

## FASE 5: CRONOGRAMA DE IMPLEMENTACION

### Sprint 1 (Semana 1-2): Seguridad y Permisos
- [ ] Nuevo modelo de Usuario (sin email obligatorio)
- [ ] Sistema de permisos granulares
- [ ] UI de gestion de usuarios y roles
- [ ] Middleware de verificacion de permisos
- [ ] Login por username/PIN

### Sprint 2 (Semana 3-4): Centro Financiero
- [ ] Nuevo modelo de datos financieros
- [ ] Dashboard P&G funcional
- [ ] Importador de Excel mejorado con trazabilidad
- [ ] Graficos y comparativas
- [ ] Exportacion de reportes PDF/Excel

### Sprint 3 (Semana 5-6): Asistente IA
- [ ] Arquitectura del asistente con contexto
- [ ] Skills de finanzas (P&G, gastos, flujo)
- [ ] Skills de logistica (estado, alertas)
- [ ] Skills de reportes y acciones
- [ ] Memoria de conversacion

### Sprint 4 (Semana 7-8): Admin Panel Enterprise
- [ ] Reorganizacion de secciones
- [ ] Herramientas funcionales
- [ ] Sistema de backup
- [ ] Auditoria completa
- [ ] Integraciones mejoradas

### Sprint 5 (Semana 9-10): Pulido y QA
- [ ] Testing de permisos
- [ ] Testing de flujos financieros
- [ ] Optimizacion de rendimiento
- [ ] Documentacion
- [ ] Training del equipo

---

## ARQUITECTURA TECNICA

```
+------------------------------------------------------------------+
|                        LITPER PRO ENTERPRISE                      |
+------------------------------------------------------------------+
|                                                                  |
|  FRONTEND (React + TypeScript)                                   |
|  +------------------------------------------------------------+  |
|  |  UI Components  |  Zustand Stores  |  Services Layer       |  |
|  +------------------------------------------------------------+  |
|                              |                                   |
|                              v                                   |
|  +------------------------------------------------------------+  |
|  |                    MIDDLEWARE LAYER                         |  |
|  |  - Permission Guard (verifica permisos antes de render)    |  |
|  |  - Auth Guard (verifica sesion activa)                     |  |
|  |  - Audit Logger (registra acciones)                        |  |
|  +------------------------------------------------------------+  |
|                              |                                   |
|                              v                                   |
|  +------------------------------------------------------------+  |
|  |                    DATA LAYER                               |  |
|  |  - LocalStorage (datos persistentes)                       |  |
|  |  - IndexedDB (archivos grandes, cache)                     |  |
|  |  - API Externa (futuro backend)                            |  |
|  +------------------------------------------------------------+  |
|                              |                                   |
|                              v                                   |
|  +------------------------------------------------------------+  |
|  |                    AI LAYER                                 |  |
|  |  - Claude API (asistente inteligente)                      |  |
|  |  - ML Models (predicciones)                                |  |
|  |  - Business Context (datos del negocio)                    |  |
|  +------------------------------------------------------------+  |
|                                                                  |
+------------------------------------------------------------------+
```

---

## METRICAS DE EXITO

| Metrica | Actual | Objetivo |
|---------|--------|----------|
| Tiempo crear usuario | N/A | < 30 segundos |
| Precision P&G | ~70% | 99% |
| Respuesta IA | N/A | < 3 segundos |
| Adopcion permisos | 0% | 100% |
| Satisfaccion usuario | N/A | > 4.5/5 |

---

## PROXIMOS PASOS

1. **Aprobar el plan** - Confirmar prioridades
2. **Crear rama de desarrollo** - `feature/enterprise-v2`
3. **Iniciar Sprint 1** - Sistema de permisos
4. **Reviews semanales** - Validar avances

---

*Plan creado: Diciembre 2024*
*Version: 1.0*
*Autor: Claude AI + Equipo LITPER*
