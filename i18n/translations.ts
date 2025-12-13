// i18n/translations.ts
// Sistema de Internacionalización - Multi-idioma (ES, EN, PT)

export type Locale = 'es' | 'en' | 'pt';

export interface TranslationKeys {
  // Common
  common: {
    loading: string;
    error: string;
    success: string;
    cancel: string;
    save: string;
    delete: string;
    edit: string;
    search: string;
    filter: string;
    clear: string;
    close: string;
    back: string;
    next: string;
    previous: string;
    submit: string;
    confirm: string;
    yes: string;
    no: string;
    all: string;
    none: string;
    select: string;
    download: string;
    upload: string;
    export: string;
    import: string;
    refresh: string;
    settings: string;
    help: string;
    logout: string;
    login: string;
    register: string;
  };

  // Navigation
  nav: {
    home: string;
    dashboard: string;
    operations: string;
    intelligence: string;
    analysis: string;
    processes: string;
    config: string;
    tracking: string;
    reports: string;
    notifications: string;
    profile: string;
  };

  // Shipments
  shipments: {
    title: string;
    guide: string;
    guides: string;
    carrier: string;
    status: string;
    city: string;
    phone: string;
    customer: string;
    date: string;
    days: string;
    daysInTransit: string;
    lastUpdate: string;
    history: string;
    details: string;
    noResults: string;
    loadData: string;
  };

  // Status
  status: {
    delivered: string;
    inTransit: string;
    pending: string;
    exception: string;
    returned: string;
    inOffice: string;
    unknown: string;
  };

  // Dashboard
  dashboard: {
    welcome: string;
    overview: string;
    totalShipments: string;
    deliveryRate: string;
    inTransitCount: string;
    issuesCount: string;
    recentActivity: string;
    quickActions: string;
    analytics: string;
    performance: string;
  };

  // Auth
  auth: {
    welcomeBack: string;
    signIn: string;
    signUp: string;
    email: string;
    password: string;
    confirmPassword: string;
    name: string;
    forgotPassword: string;
    noAccount: string;
    haveAccount: string;
    termsAccept: string;
    loginSuccess: string;
    loginError: string;
    logoutSuccess: string;
    sessionExpired: string;
  };

  // Notifications
  notifications: {
    title: string;
    markAllRead: string;
    noNotifications: string;
    delivery: string;
    update: string;
    alert: string;
    clearAll: string;
  };

  // Filters
  filters: {
    title: string;
    byStatus: string;
    byCarrier: string;
    byCity: string;
    byDate: string;
    dateRange: string;
    from: string;
    to: string;
    apply: string;
    reset: string;
  };

  // Reports
  reports: {
    title: string;
    generate: string;
    daily: string;
    weekly: string;
    monthly: string;
    custom: string;
    shipmentReport: string;
    performanceReport: string;
    exportPDF: string;
    exportExcel: string;
    print: string;
  };

  // Maps
  maps: {
    title: string;
    tracking: string;
    legend: string;
    zoom: string;
    fullscreen: string;
    exitFullscreen: string;
    noData: string;
  };

  // Errors
  errors: {
    general: string;
    network: string;
    unauthorized: string;
    notFound: string;
    validation: string;
    required: string;
    invalidEmail: string;
    passwordMismatch: string;
    tryAgain: string;
  };

  // Success messages
  success: {
    saved: string;
    deleted: string;
    updated: string;
    uploaded: string;
    exported: string;
    imported: string;
  };

  // Time
  time: {
    now: string;
    minutesAgo: string;
    hoursAgo: string;
    daysAgo: string;
    today: string;
    yesterday: string;
    thisWeek: string;
    thisMonth: string;
  };
}

// ============================================
// SPANISH (Default)
// ============================================
export const es: TranslationKeys = {
  common: {
    loading: 'Cargando...',
    error: 'Error',
    success: 'Éxito',
    cancel: 'Cancelar',
    save: 'Guardar',
    delete: 'Eliminar',
    edit: 'Editar',
    search: 'Buscar',
    filter: 'Filtrar',
    clear: 'Limpiar',
    close: 'Cerrar',
    back: 'Volver',
    next: 'Siguiente',
    previous: 'Anterior',
    submit: 'Enviar',
    confirm: 'Confirmar',
    yes: 'Sí',
    no: 'No',
    all: 'Todos',
    none: 'Ninguno',
    select: 'Seleccionar',
    download: 'Descargar',
    upload: 'Cargar',
    export: 'Exportar',
    import: 'Importar',
    refresh: 'Actualizar',
    settings: 'Configuración',
    help: 'Ayuda',
    logout: 'Cerrar sesión',
    login: 'Iniciar sesión',
    register: 'Registrarse',
  },
  nav: {
    home: 'Inicio',
    dashboard: 'Dashboard',
    operations: 'Operaciones',
    intelligence: 'Inteligencia IA',
    analysis: 'Análisis',
    processes: 'Procesos',
    config: 'Configuración',
    tracking: 'Seguimiento',
    reports: 'Reportes',
    notifications: 'Notificaciones',
    profile: 'Perfil',
  },
  shipments: {
    title: 'Envíos',
    guide: 'Guía',
    guides: 'Guías',
    carrier: 'Transportadora',
    status: 'Estado',
    city: 'Ciudad',
    phone: 'Teléfono',
    customer: 'Cliente',
    date: 'Fecha',
    days: 'Días',
    daysInTransit: 'Días en tránsito',
    lastUpdate: 'Última actualización',
    history: 'Historial',
    details: 'Detalles',
    noResults: 'No se encontraron guías',
    loadData: 'Cargar datos',
  },
  status: {
    delivered: 'Entregado',
    inTransit: 'En Tránsito',
    pending: 'Pendiente',
    exception: 'Con Novedad',
    returned: 'Devuelto',
    inOffice: 'En Oficina',
    unknown: 'Desconocido',
  },
  dashboard: {
    welcome: 'Bienvenido',
    overview: 'Resumen General',
    totalShipments: 'Total de Envíos',
    deliveryRate: 'Tasa de Entrega',
    inTransitCount: 'En Tránsito',
    issuesCount: 'Con Novedad',
    recentActivity: 'Actividad Reciente',
    quickActions: 'Acciones Rápidas',
    analytics: 'Analíticas',
    performance: 'Rendimiento',
  },
  auth: {
    welcomeBack: 'Bienvenido de nuevo',
    signIn: 'Iniciar Sesión',
    signUp: 'Crear Cuenta',
    email: 'Correo electrónico',
    password: 'Contraseña',
    confirmPassword: 'Confirmar contraseña',
    name: 'Nombre completo',
    forgotPassword: '¿Olvidaste tu contraseña?',
    noAccount: '¿No tienes cuenta?',
    haveAccount: '¿Ya tienes cuenta?',
    termsAccept: 'Acepto los términos y condiciones',
    loginSuccess: 'Sesión iniciada correctamente',
    loginError: 'Error al iniciar sesión',
    logoutSuccess: 'Sesión cerrada',
    sessionExpired: 'Tu sesión ha expirado',
  },
  notifications: {
    title: 'Notificaciones',
    markAllRead: 'Marcar todo como leído',
    noNotifications: 'No hay notificaciones',
    delivery: 'Entrega',
    update: 'Actualización',
    alert: 'Alerta',
    clearAll: 'Limpiar todo',
  },
  filters: {
    title: 'Filtros',
    byStatus: 'Por estado',
    byCarrier: 'Por transportadora',
    byCity: 'Por ciudad',
    byDate: 'Por fecha',
    dateRange: 'Rango de fechas',
    from: 'Desde',
    to: 'Hasta',
    apply: 'Aplicar',
    reset: 'Restablecer',
  },
  reports: {
    title: 'Reportes',
    generate: 'Generar reporte',
    daily: 'Diario',
    weekly: 'Semanal',
    monthly: 'Mensual',
    custom: 'Personalizado',
    shipmentReport: 'Reporte de Guías',
    performanceReport: 'Reporte de Rendimiento',
    exportPDF: 'Exportar PDF',
    exportExcel: 'Exportar Excel',
    print: 'Imprimir',
  },
  maps: {
    title: 'Mapa',
    tracking: 'Seguimiento en Mapa',
    legend: 'Leyenda',
    zoom: 'Zoom',
    fullscreen: 'Pantalla completa',
    exitFullscreen: 'Salir de pantalla completa',
    noData: 'No hay datos para mostrar en el mapa',
  },
  errors: {
    general: 'Ha ocurrido un error',
    network: 'Error de conexión',
    unauthorized: 'No autorizado',
    notFound: 'No encontrado',
    validation: 'Error de validación',
    required: 'Este campo es requerido',
    invalidEmail: 'Correo electrónico inválido',
    passwordMismatch: 'Las contraseñas no coinciden',
    tryAgain: 'Intenta de nuevo',
  },
  success: {
    saved: 'Guardado correctamente',
    deleted: 'Eliminado correctamente',
    updated: 'Actualizado correctamente',
    uploaded: 'Cargado correctamente',
    exported: 'Exportado correctamente',
    imported: 'Importado correctamente',
  },
  time: {
    now: 'Ahora',
    minutesAgo: 'hace {n} minutos',
    hoursAgo: 'hace {n} horas',
    daysAgo: 'hace {n} días',
    today: 'Hoy',
    yesterday: 'Ayer',
    thisWeek: 'Esta semana',
    thisMonth: 'Este mes',
  },
};

// ============================================
// ENGLISH
// ============================================
export const en: TranslationKeys = {
  common: {
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    search: 'Search',
    filter: 'Filter',
    clear: 'Clear',
    close: 'Close',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    submit: 'Submit',
    confirm: 'Confirm',
    yes: 'Yes',
    no: 'No',
    all: 'All',
    none: 'None',
    select: 'Select',
    download: 'Download',
    upload: 'Upload',
    export: 'Export',
    import: 'Import',
    refresh: 'Refresh',
    settings: 'Settings',
    help: 'Help',
    logout: 'Logout',
    login: 'Login',
    register: 'Register',
  },
  nav: {
    home: 'Home',
    dashboard: 'Dashboard',
    operations: 'Operations',
    intelligence: 'AI Intelligence',
    analysis: 'Analysis',
    processes: 'Processes',
    config: 'Settings',
    tracking: 'Tracking',
    reports: 'Reports',
    notifications: 'Notifications',
    profile: 'Profile',
  },
  shipments: {
    title: 'Shipments',
    guide: 'Guide',
    guides: 'Guides',
    carrier: 'Carrier',
    status: 'Status',
    city: 'City',
    phone: 'Phone',
    customer: 'Customer',
    date: 'Date',
    days: 'Days',
    daysInTransit: 'Days in transit',
    lastUpdate: 'Last update',
    history: 'History',
    details: 'Details',
    noResults: 'No shipments found',
    loadData: 'Load data',
  },
  status: {
    delivered: 'Delivered',
    inTransit: 'In Transit',
    pending: 'Pending',
    exception: 'Exception',
    returned: 'Returned',
    inOffice: 'At Office',
    unknown: 'Unknown',
  },
  dashboard: {
    welcome: 'Welcome',
    overview: 'Overview',
    totalShipments: 'Total Shipments',
    deliveryRate: 'Delivery Rate',
    inTransitCount: 'In Transit',
    issuesCount: 'With Issues',
    recentActivity: 'Recent Activity',
    quickActions: 'Quick Actions',
    analytics: 'Analytics',
    performance: 'Performance',
  },
  auth: {
    welcomeBack: 'Welcome back',
    signIn: 'Sign In',
    signUp: 'Sign Up',
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm password',
    name: 'Full name',
    forgotPassword: 'Forgot password?',
    noAccount: "Don't have an account?",
    haveAccount: 'Already have an account?',
    termsAccept: 'I accept the terms and conditions',
    loginSuccess: 'Logged in successfully',
    loginError: 'Login failed',
    logoutSuccess: 'Logged out',
    sessionExpired: 'Your session has expired',
  },
  notifications: {
    title: 'Notifications',
    markAllRead: 'Mark all as read',
    noNotifications: 'No notifications',
    delivery: 'Delivery',
    update: 'Update',
    alert: 'Alert',
    clearAll: 'Clear all',
  },
  filters: {
    title: 'Filters',
    byStatus: 'By status',
    byCarrier: 'By carrier',
    byCity: 'By city',
    byDate: 'By date',
    dateRange: 'Date range',
    from: 'From',
    to: 'To',
    apply: 'Apply',
    reset: 'Reset',
  },
  reports: {
    title: 'Reports',
    generate: 'Generate report',
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    custom: 'Custom',
    shipmentReport: 'Shipment Report',
    performanceReport: 'Performance Report',
    exportPDF: 'Export PDF',
    exportExcel: 'Export Excel',
    print: 'Print',
  },
  maps: {
    title: 'Map',
    tracking: 'Map Tracking',
    legend: 'Legend',
    zoom: 'Zoom',
    fullscreen: 'Fullscreen',
    exitFullscreen: 'Exit fullscreen',
    noData: 'No data to display on map',
  },
  errors: {
    general: 'An error occurred',
    network: 'Network error',
    unauthorized: 'Unauthorized',
    notFound: 'Not found',
    validation: 'Validation error',
    required: 'This field is required',
    invalidEmail: 'Invalid email address',
    passwordMismatch: 'Passwords do not match',
    tryAgain: 'Please try again',
  },
  success: {
    saved: 'Saved successfully',
    deleted: 'Deleted successfully',
    updated: 'Updated successfully',
    uploaded: 'Uploaded successfully',
    exported: 'Exported successfully',
    imported: 'Imported successfully',
  },
  time: {
    now: 'Now',
    minutesAgo: '{n} minutes ago',
    hoursAgo: '{n} hours ago',
    daysAgo: '{n} days ago',
    today: 'Today',
    yesterday: 'Yesterday',
    thisWeek: 'This week',
    thisMonth: 'This month',
  },
};

// ============================================
// PORTUGUESE
// ============================================
export const pt: TranslationKeys = {
  common: {
    loading: 'Carregando...',
    error: 'Erro',
    success: 'Sucesso',
    cancel: 'Cancelar',
    save: 'Salvar',
    delete: 'Excluir',
    edit: 'Editar',
    search: 'Buscar',
    filter: 'Filtrar',
    clear: 'Limpar',
    close: 'Fechar',
    back: 'Voltar',
    next: 'Próximo',
    previous: 'Anterior',
    submit: 'Enviar',
    confirm: 'Confirmar',
    yes: 'Sim',
    no: 'Não',
    all: 'Todos',
    none: 'Nenhum',
    select: 'Selecionar',
    download: 'Baixar',
    upload: 'Carregar',
    export: 'Exportar',
    import: 'Importar',
    refresh: 'Atualizar',
    settings: 'Configurações',
    help: 'Ajuda',
    logout: 'Sair',
    login: 'Entrar',
    register: 'Registrar',
  },
  nav: {
    home: 'Início',
    dashboard: 'Painel',
    operations: 'Operações',
    intelligence: 'Inteligência IA',
    analysis: 'Análise',
    processes: 'Processos',
    config: 'Configurações',
    tracking: 'Rastreamento',
    reports: 'Relatórios',
    notifications: 'Notificações',
    profile: 'Perfil',
  },
  shipments: {
    title: 'Envios',
    guide: 'Guia',
    guides: 'Guias',
    carrier: 'Transportadora',
    status: 'Status',
    city: 'Cidade',
    phone: 'Telefone',
    customer: 'Cliente',
    date: 'Data',
    days: 'Dias',
    daysInTransit: 'Dias em trânsito',
    lastUpdate: 'Última atualização',
    history: 'Histórico',
    details: 'Detalhes',
    noResults: 'Nenhuma guia encontrada',
    loadData: 'Carregar dados',
  },
  status: {
    delivered: 'Entregue',
    inTransit: 'Em Trânsito',
    pending: 'Pendente',
    exception: 'Com Problema',
    returned: 'Devolvido',
    inOffice: 'No Escritório',
    unknown: 'Desconhecido',
  },
  dashboard: {
    welcome: 'Bem-vindo',
    overview: 'Visão Geral',
    totalShipments: 'Total de Envios',
    deliveryRate: 'Taxa de Entrega',
    inTransitCount: 'Em Trânsito',
    issuesCount: 'Com Problemas',
    recentActivity: 'Atividade Recente',
    quickActions: 'Ações Rápidas',
    analytics: 'Análises',
    performance: 'Desempenho',
  },
  auth: {
    welcomeBack: 'Bem-vindo de volta',
    signIn: 'Entrar',
    signUp: 'Criar Conta',
    email: 'E-mail',
    password: 'Senha',
    confirmPassword: 'Confirmar senha',
    name: 'Nome completo',
    forgotPassword: 'Esqueceu a senha?',
    noAccount: 'Não tem conta?',
    haveAccount: 'Já tem conta?',
    termsAccept: 'Aceito os termos e condições',
    loginSuccess: 'Login realizado com sucesso',
    loginError: 'Erro ao fazer login',
    logoutSuccess: 'Logout realizado',
    sessionExpired: 'Sua sessão expirou',
  },
  notifications: {
    title: 'Notificações',
    markAllRead: 'Marcar tudo como lido',
    noNotifications: 'Sem notificações',
    delivery: 'Entrega',
    update: 'Atualização',
    alert: 'Alerta',
    clearAll: 'Limpar tudo',
  },
  filters: {
    title: 'Filtros',
    byStatus: 'Por status',
    byCarrier: 'Por transportadora',
    byCity: 'Por cidade',
    byDate: 'Por data',
    dateRange: 'Período',
    from: 'De',
    to: 'Até',
    apply: 'Aplicar',
    reset: 'Redefinir',
  },
  reports: {
    title: 'Relatórios',
    generate: 'Gerar relatório',
    daily: 'Diário',
    weekly: 'Semanal',
    monthly: 'Mensal',
    custom: 'Personalizado',
    shipmentReport: 'Relatório de Guias',
    performanceReport: 'Relatório de Desempenho',
    exportPDF: 'Exportar PDF',
    exportExcel: 'Exportar Excel',
    print: 'Imprimir',
  },
  maps: {
    title: 'Mapa',
    tracking: 'Rastreamento no Mapa',
    legend: 'Legenda',
    zoom: 'Zoom',
    fullscreen: 'Tela cheia',
    exitFullscreen: 'Sair da tela cheia',
    noData: 'Sem dados para exibir no mapa',
  },
  errors: {
    general: 'Ocorreu um erro',
    network: 'Erro de conexão',
    unauthorized: 'Não autorizado',
    notFound: 'Não encontrado',
    validation: 'Erro de validação',
    required: 'Este campo é obrigatório',
    invalidEmail: 'E-mail inválido',
    passwordMismatch: 'As senhas não coincidem',
    tryAgain: 'Tente novamente',
  },
  success: {
    saved: 'Salvo com sucesso',
    deleted: 'Excluído com sucesso',
    updated: 'Atualizado com sucesso',
    uploaded: 'Carregado com sucesso',
    exported: 'Exportado com sucesso',
    imported: 'Importado com sucesso',
  },
  time: {
    now: 'Agora',
    minutesAgo: 'há {n} minutos',
    hoursAgo: 'há {n} horas',
    daysAgo: 'há {n} dias',
    today: 'Hoje',
    yesterday: 'Ontem',
    thisWeek: 'Esta semana',
    thisMonth: 'Este mês',
  },
};

// ============================================
// TRANSLATIONS MAP
// ============================================
export const translations: Record<Locale, TranslationKeys> = {
  es,
  en,
  pt,
};

export default translations;
