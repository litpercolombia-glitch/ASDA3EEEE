/**
 * CONTENIDO DE AYUDA PREDEFINIDO
 * ================================
 *
 * Textos de ayuda para cada sección y funcionalidad de la app.
 * Centralizado aquí para fácil mantenimiento.
 *
 * USO:
 * import { helpContent } from '@/components/HelpSystem';
 *
 * <HelpTooltip {...helpContent.cargarArchivo}>
 *   <button>Cargar</button>
 * </HelpTooltip>
 */

export interface HelpContentItem {
  title?: string;
  content?: string;
  steps?: string[];
  tips?: string[];
}

// ==================== BIBLIOTECA DE CONOCIMIENTO ====================

export const knowledgeLibraryHelp = {
  // Página principal
  biblioteca: {
    title: 'Biblioteca de Conocimiento',
    content: 'Carga y gestiona información desde múltiples fuentes. Los agentes IA usarán este conocimiento para darte mejores respuestas.',
    tips: [
      'Mientras más información agregues, más inteligentes serán tus agentes',
      'El sistema clasifica automáticamente todo el contenido',
      'Puedes buscar por palabras clave o frases completas'
    ]
  },

  // Cargar archivo
  cargarArchivo: {
    title: 'Cargar Archivo',
    content: 'Sube documentos PDF, DOCX, TXT y más. El sistema extraerá el texto y lo clasificará automáticamente.',
    steps: [
      'Click en "Seleccionar archivo" o arrastra un archivo',
      'Espera mientras se procesa',
      'El sistema mostrará el resultado de la clasificación'
    ],
    tips: [
      'PDFs con texto (no escaneos) funcionan mejor',
      'Documentos de hasta 50MB',
      'Formatos: PDF, DOCX, TXT, MD, CSV, JSON'
    ]
  },

  // Cargar desde web
  cargarWeb: {
    title: 'Cargar desde Web',
    content: 'Extrae contenido de cualquier página web. Ideal para documentación, blogs y artículos.',
    steps: [
      'Copia la URL de la página',
      'Pégala en el campo',
      'Click en "Cargar"',
      'El sistema extraerá el contenido automáticamente'
    ],
    tips: [
      'Funciona con artículos, documentación, blogs',
      'Si la página requiere login, márcalo y proporciona credenciales',
      'El sistema solo guarda el texto, no imágenes'
    ]
  },

  // Cargar desde YouTube
  cargarYouTube: {
    title: 'Cargar desde YouTube',
    content: 'Extrae la transcripción completa de videos de YouTube. Incluye timestamps cada minuto.',
    steps: [
      'Copia el link del video de YouTube',
      'Pégalo en el campo',
      'Click en "Extraer"',
      'El sistema transcribirá todo el video'
    ],
    tips: [
      'Solo funciona con videos que tengan subtítulos',
      'Videos en español, inglés y portugués',
      'La transcripción incluye timestamps para navegación'
    ]
  },

  // Búsqueda
  busqueda: {
    title: 'Búsqueda Semántica',
    content: 'Busca por significado, no solo palabras exactas. Escribe frases completas para mejores resultados.',
    steps: [
      'Escribe tu pregunta o tema de búsqueda',
      'Los resultados aparecerán ordenados por relevancia',
      'Click en un resultado para ver el contenido completo'
    ],
    tips: [
      'Usa frases completas: "cómo rastrear envíos" en vez de "rastrear"',
      'Puedes filtrar por categoría',
      'El porcentaje indica qué tan relevante es el resultado'
    ]
  },

  // Categorías
  categorias: {
    title: 'Categorías',
    content: 'El contenido se clasifica automáticamente en categorías relevantes para Litper.',
    tips: [
      'Logística: Envíos, tracking, novedades',
      'Dropshipping: Proveedores, productos, clientes',
      'Tecnología: APIs, integraciones',
      'Operaciones: Procesos, KPIs',
      'Legal: Regulaciones, contratos',
      'Mercados: Colombia, Chile, Ecuador'
    ]
  }
};

// ==================== SISTEMA ML ====================

export const mlSystemHelp = {
  // Dashboard ML
  dashboard: {
    title: 'Dashboard ML',
    content: 'Visualiza el estado de los modelos de machine learning y sus métricas de rendimiento.',
    tips: [
      'Verde = modelo funcionando correctamente',
      'Amarillo = modelo necesita reentrenamiento',
      'Rojo = modelo no disponible'
    ]
  },

  // Predicciones
  predicciones: {
    title: 'Predicciones de Retraso',
    content: 'El sistema predice la probabilidad de retraso para cada envío basándose en datos históricos.',
    steps: [
      'Selecciona una guía o carga datos',
      'El sistema analizará patrones',
      'Verás la probabilidad de retraso (0-100%)'
    ],
    tips: [
      'Predicciones con >70% de confianza son más fiables',
      'Los factores de riesgo te ayudan a entender por qué',
      'Usa las acciones recomendadas para mitigar riesgos'
    ]
  },

  // Entrenamiento
  entrenamiento: {
    title: 'Entrenar Modelos',
    content: 'Reentrena los modelos de ML con los datos más recientes para mejorar la precisión.',
    steps: [
      'Asegúrate de tener suficientes datos históricos',
      'Click en "Entrenar modelos"',
      'Espera mientras el sistema procesa',
      'Verifica las nuevas métricas'
    ],
    tips: [
      'Mínimo 100 registros para entrenar',
      'El entrenamiento puede tomar varios minutos',
      'Los modelos se guardan automáticamente',
      'El sistema reentrena automáticamente cada semana'
    ]
  },

  // Métricas
  metricas: {
    title: 'Métricas del Modelo',
    content: 'Indicadores de rendimiento del modelo de predicción.',
    tips: [
      'Accuracy: % de predicciones correctas',
      'Precision: % de retrasos predichos que fueron reales',
      'Recall: % de retrasos reales que fueron predichos',
      'F1 Score: Balance entre Precision y Recall'
    ]
  }
};

// ==================== SEGUIMIENTO ====================

export const seguimientoHelp = {
  // Vista general
  general: {
    title: 'Seguimiento de Envíos',
    content: 'Monitorea todos tus envíos en tiempo real. Filtra por estado, transportadora o ciudad.',
    tips: [
      'Los colores indican el estado: Verde=OK, Amarillo=Pendiente, Rojo=Problema',
      'Click en una guía para ver detalles completos',
      'Usa los filtros para encontrar envíos específicos'
    ]
  },

  // Filtros
  filtros: {
    title: 'Filtros de Búsqueda',
    content: 'Filtra los envíos por diferentes criterios para encontrar lo que buscas.',
    steps: [
      'Selecciona uno o más filtros',
      'Los resultados se actualizan automáticamente',
      'Puedes combinar múltiples filtros'
    ],
    tips: [
      'Busca por número de guía, cliente o ciudad',
      'Filtra por transportadora para análisis específicos',
      'Usa el filtro de fecha para rangos específicos'
    ]
  },

  // Tracking masivo
  trackingMasivo: {
    title: 'Tracking Masivo',
    content: 'Rastrea hasta 40 guías a la vez copiando y pegando los números.',
    steps: [
      'Click en "Tracking Masivo"',
      'Pega los números de guía (uno por línea)',
      'Click en "Rastrear"',
      'Los resultados aparecerán en la tabla'
    ],
    tips: [
      'Máximo 40 guías por consulta',
      'Acepta números separados por comas o líneas',
      'Los resultados se guardan automáticamente'
    ]
  },

  // Detalle de guía
  detalleGuia: {
    title: 'Detalle de Guía',
    content: 'Información completa sobre un envío específico.',
    tips: [
      'Ver historial de movimientos',
      'Analizar predicción de retraso',
      'Registrar novedades',
      'Enviar mensaje al cliente'
    ]
  }
};

// ==================== SEMÁFORO DE CIUDADES ====================

export const semaforoHelp = {
  general: {
    title: 'Semáforo de Ciudades',
    content: 'Visualiza el estado de las entregas por ciudad usando un sistema de colores.',
    tips: [
      'Verde: Ciudad con buen rendimiento (>90% a tiempo)',
      'Amarillo: Ciudad con rendimiento moderado (70-90%)',
      'Rojo: Ciudad con problemas (<70% a tiempo)',
      'Click en una ciudad para ver detalles'
    ]
  },

  ciudadDetalle: {
    title: 'Detalle de Ciudad',
    content: 'Estadísticas detalladas de envíos para una ciudad específica.',
    tips: [
      'Ver transportadoras activas en la ciudad',
      'Analizar tiempos promedio de entrega',
      'Identificar patrones de novedades',
      'Comparar con otras ciudades'
    ]
  }
};

// ==================== CHAT INTELIGENTE ====================

export const chatHelp = {
  general: {
    title: 'Chat Inteligente',
    content: 'Pregunta cualquier cosa sobre tus envíos en lenguaje natural. El asistente IA analizará tus datos y responderá.',
    steps: [
      'Escribe tu pregunta en el campo de texto',
      'Presiona Enter o click en enviar',
      'El asistente analizará tus datos y responderá'
    ],
    tips: [
      'Pregunta sobre estadísticas: "¿Cuántos envíos en retraso hay?"',
      'Busca guías: "Dame información de la guía 123456"',
      'Analiza transportadoras: "¿Cuál es la mejor transportadora?"',
      'Pide acciones: "Genera un reporte de la semana"'
    ]
  },

  ejemplos: {
    title: 'Ejemplos de Preguntas',
    content: 'Aquí tienes algunos ejemplos de lo que puedes preguntar:',
    tips: [
      '"¿Cuántos envíos tengo pendientes?"',
      '"Muestra las guías en Bogotá"',
      '"¿Qué transportadora tiene más retrasos?"',
      '"Dame el resumen de hoy"',
      '"¿Cuál es el estado de la guía 12345?"'
    ]
  }
};

// ==================== CARGA DE DATOS ====================

export const cargaDatosHelp = {
  excel: {
    title: 'Cargar Excel',
    content: 'Importa datos de envíos desde archivos Excel (.xlsx, .xls).',
    steps: [
      'Prepara tu archivo Excel con las columnas requeridas',
      'Click en "Cargar archivo"',
      'Selecciona tu archivo',
      'Mapea las columnas si es necesario',
      'Click en "Procesar"'
    ],
    tips: [
      'Columnas requeridas: Número de guía, Destinatario, Ciudad',
      'El sistema detecta automáticamente la transportadora',
      'Máximo 10,000 filas por archivo',
      'Formatos soportados: .xlsx, .xls'
    ]
  },

  wizard: {
    title: 'Asistente de Carga',
    content: 'El asistente te guía paso a paso para cargar datos correctamente.',
    steps: [
      'Paso 1: Selecciona el tipo de datos',
      'Paso 2: Sube tu archivo',
      'Paso 3: Verifica el mapeo de columnas',
      'Paso 4: Procesa y confirma'
    ],
    tips: [
      'Puedes volver a pasos anteriores si necesitas corregir algo',
      'El preview muestra cómo se verán tus datos',
      'Los errores se muestran claramente para corrección'
    ]
  }
};

// ==================== CIUDAD DE AGENTES ====================

export const agentesHelp = {
  general: {
    title: 'Ciudad de Agentes IA',
    content: 'Sistema de agentes inteligentes que trabajan coordinadamente para optimizar tus operaciones.',
    tips: [
      'Cada distrito tiene agentes especializados',
      'Los agentes aprenden de los datos históricos',
      'Puedes ver las tareas que están ejecutando',
      'Los agentes generan recomendaciones automáticas'
    ]
  },

  distritos: {
    title: 'Distritos de la Ciudad',
    content: 'La ciudad está dividida en distritos especializados.',
    tips: [
      'Distrito de Operaciones: Gestión de envíos',
      'Distrito de Novedades: Resolución de problemas',
      'Distrito de Órdenes: Procesamiento de pedidos',
      'Distrito de Tracking: Seguimiento en tiempo real'
    ]
  },

  tareas: {
    title: 'Tareas de Agentes',
    content: 'Los agentes ejecutan tareas automáticamente para optimizar operaciones.',
    tips: [
      'Las tareas se priorizan por urgencia',
      'Puedes ver el progreso de cada tarea',
      'Los resultados se guardan en el historial',
      'Algunas tareas requieren tu aprobación'
    ]
  }
};

// ==================== REPORTES ====================

export const reportesHelp = {
  general: {
    title: 'Reportes',
    content: 'Genera reportes detallados de tus operaciones logísticas.',
    steps: [
      'Selecciona el tipo de reporte',
      'Configura los filtros (fecha, transportadora, etc.)',
      'Click en "Generar"',
      'Descarga o comparte el reporte'
    ],
    tips: [
      'Reportes disponibles: PDF, Excel, CSV',
      'Puedes programar reportes automáticos',
      'Los reportes incluyen gráficos y estadísticas',
      'Comparte directamente con tu equipo'
    ]
  },

  kpis: {
    title: 'KPIs y Métricas',
    content: 'Indicadores clave de rendimiento para monitorear tu operación.',
    tips: [
      'OTIF: Porcentaje de entregas a tiempo y completas',
      'NPS Logístico: Satisfacción del cliente',
      'Tasa de Primera Entrega: Éxito sin novedades',
      'Tiempo de Ciclo: Promedio de días de entrega'
    ]
  }
};

// ==================== FUNCIÓN HELPER ====================

/**
 * Obtiene el contenido de ayuda para una sección específica.
 *
 * @param section - Nombre de la sección (ej: 'knowledgeLibrary', 'mlSystem')
 * @param key - Clave del contenido dentro de la sección
 * @returns Objeto con el contenido de ayuda o undefined si no existe
 */
export const getHelpForSection = (
  section: string,
  key: string
): HelpContentItem | undefined => {
  const sections: Record<string, Record<string, HelpContentItem>> = {
    knowledgeLibrary: knowledgeLibraryHelp,
    mlSystem: mlSystemHelp,
    seguimiento: seguimientoHelp,
    semaforo: semaforoHelp,
    chat: chatHelp,
    cargaDatos: cargaDatosHelp,
    agentes: agentesHelp,
    reportes: reportesHelp,
  };

  return sections[section]?.[key];
};

// Export todo el contenido como objeto único
export const helpContent = {
  ...knowledgeLibraryHelp,
  ...mlSystemHelp,
  ...seguimientoHelp,
  ...semaforoHelp,
  ...chatHelp,
  ...cargaDatosHelp,
  ...agentesHelp,
  ...reportesHelp,
};

export default helpContent;
