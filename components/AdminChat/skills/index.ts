// ============================================
// REGISTRO DE SKILLS - ADMIN CHAT
// ============================================

import { Skill, SkillContext, SkillResult, ParsedCommand } from '../types';

// ============================================
// UTILIDADES DE PARSING
// ============================================

export function parseCommand(input: string): ParsedCommand {
  const trimmed = input.trim();

  // Si no empieza con /, no es un skill
  if (!trimmed.startsWith('/')) {
    return {
      isSkill: false,
      params: {},
      rawArgs: trimmed
    };
  }

  // Extraer el nombre del skill y argumentos
  const parts = trimmed.slice(1).split(/\s+/);
  const skillName = parts[0]?.toLowerCase();
  const rawArgs = parts.slice(1).join(' ');

  // Parsear argumentos
  const params: Record<string, any> = {};

  // Detectar subcomando (segunda palabra sin -)
  if (parts[1] && !parts[1].startsWith('-')) {
    params.subcommand = parts[1];
  }

  // Parsear flags tipo --nombre valor
  const flagRegex = /--(\w+)\s+([^\s-]+|"[^"]+"|'[^']+')/g;
  let match;
  while ((match = flagRegex.exec(rawArgs)) !== null) {
    params[match[1]] = match[2].replace(/^["']|["']$/g, '');
  }

  // Parsear períodos de tiempo comunes
  const timePatterns = [
    { pattern: /\bhoy\b/i, value: 'hoy' },
    { pattern: /\bayer\b/i, value: 'ayer' },
    { pattern: /\bsemana\b/i, value: 'semana' },
    { pattern: /\bmes\b/i, value: 'mes' },
    { pattern: /\b(\d+)\s*d[ií]as?\b/i, value: 'custom' },
  ];

  for (const { pattern, value } of timePatterns) {
    if (pattern.test(rawArgs)) {
      params.periodo = value;
      break;
    }
  }

  return {
    isSkill: true,
    skillName,
    subcommand: params.subcommand,
    params,
    rawArgs
  };
}

// Buscar skill por nombre o alias
export function findSkill(name: string): Skill | undefined {
  const lowerName = name.toLowerCase();

  for (const skill of Object.values(SKILLS)) {
    if (skill.name === lowerName) return skill;
    if (skill.aliases?.includes(lowerName)) return skill;
  }

  return undefined;
}

// Ejecutar skill
export async function executeSkill(
  skillName: string,
  params: Record<string, any>,
  context: Partial<SkillContext> = {}
): Promise<SkillResult> {
  const skill = findSkill(skillName);

  if (!skill) {
    return {
      type: 'alert',
      data: {
        type: 'error',
        title: 'Skill no encontrado',
        message: `El comando /${skillName} no existe. Usa /ayuda para ver los comandos disponibles.`
      }
    };
  }

  const fullContext: SkillContext = {
    params,
    rawInput: params.rawArgs || '',
    api: context.api || defaultApi,
    user: context.user,
    previousMessages: context.previousMessages
  };

  try {
    return await skill.execute(fullContext);
  } catch (error: any) {
    return {
      type: 'alert',
      data: {
        type: 'error',
        title: 'Error ejecutando skill',
        message: error.message || 'Ocurrió un error inesperado'
      }
    };
  }
}

// API por defecto
const defaultApi = {
  get: async (url: string, params?: Record<string, any>) => {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    const response = await fetch(url + queryString);
    return response.json();
  },
  post: async (url: string, data?: any) => {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  }
};

// ============================================
// DEFINICIÓN DE TODOS LOS SKILLS
// ============================================

export const SKILLS: Record<string, Skill> = {

  // ═══════════════════════════════════════════
  // ❓ AYUDA
  // ═══════════════════════════════════════════
  ayuda: {
    name: 'ayuda',
    aliases: ['help', '?'],
    icon: '❓',
    description: 'Muestra ayuda y comandos disponibles',
    category: 'ayuda',
    examples: ['/ayuda', '/ayuda reporte', '/help'],
    execute: async (ctx: SkillContext): Promise<SkillResult> => {
      const { params } = ctx;

      // Si piden ayuda de un skill específico
      if (params.subcommand) {
        const skill = findSkill(params.subcommand);
        if (skill) {
          return {
            type: 'card',
            title: `Ayuda: /${skill.name}`,
            content: skill.description,
            data: {
              icon: skill.icon,
              subcommands: skill.subcommands,
              examples: skill.examples,
              parameters: skill.parameters
            },
            actions: [
              { label: `Ejecutar /${skill.name}`, action: 'execute_skill', params: { skill: skill.name } }
            ]
          };
        }
      }

      // Lista completa de skills
      const skillsByCategory: Record<string, Skill[]> = {};
      for (const skill of Object.values(SKILLS)) {
        if (!skillsByCategory[skill.category]) {
          skillsByCategory[skill.category] = [];
        }
        skillsByCategory[skill.category].push(skill);
      }

      return {
        type: 'list',
        title: '📚 Comandos Disponibles',
        content: 'Usa /comando para ejecutar o /ayuda comando para más detalles.',
        data: {
          categories: skillsByCategory,
          totalSkills: Object.keys(SKILLS).length
        }
      };
    }
  },

  // ═══════════════════════════════════════════
  // 📊 DASHBOARD
  // ═══════════════════════════════════════════
  dashboard: {
    name: 'dashboard',
    aliases: ['dash', 'inicio', 'home'],
    icon: '📊',
    description: 'Muestra el dashboard con métricas clave',
    category: 'reportes',
    examples: ['/dashboard', '/dash', '/dashboard kpis'],
    execute: async (ctx: SkillContext): Promise<SkillResult> => {
      try {
        // Obtener datos del dashboard
        const [resumen, kpis, tendencias] = await Promise.all([
          ctx.api.get('/dashboard/resumen'),
          ctx.api.get('/dashboard/kpis-avanzados'),
          ctx.api.get('/dashboard/tendencias', { dias: 7 })
        ]);

        const stats = resumen.estadisticas_generales || {};

        return {
          type: 'report',
          title: '📊 Dashboard - Resumen Ejecutivo',
          data: {
            cards: [
              {
                title: 'Total Guías',
                value: stats.total_guias || 0,
                icon: '📦',
                color: 'blue'
              },
              {
                title: 'Tasa Entrega',
                value: `${stats.tasa_entrega || 0}%`,
                icon: '✅',
                color: stats.tasa_entrega >= 90 ? 'green' : stats.tasa_entrega >= 80 ? 'yellow' : 'red'
              },
              {
                title: 'En Retraso',
                value: stats.guias_en_retraso || 0,
                icon: '⚠️',
                color: 'orange'
              },
              {
                title: 'Con Novedad',
                value: stats.guias_con_novedad || 0,
                icon: '🔔',
                color: 'yellow'
              }
            ],
            kpis: kpis,
            transportadoras: resumen.rendimiento_transportadoras || [],
            tendencias: tendencias,
            alertas: resumen.alertas_pendientes || 0
          },
          actions: [
            { label: '📈 Ver tendencias', action: 'execute_skill', params: { skill: 'reporte', args: 'tendencias' } },
            { label: '🚚 Ver transportadoras', action: 'execute_skill', params: { skill: 'transportadora', args: 'comparar' } },
            { label: '⚠️ Ver alertas', action: 'execute_skill', params: { skill: 'alertas' } }
          ]
        };
      } catch (error: any) {
        return {
          type: 'alert',
          data: {
            type: 'error',
            title: 'Error cargando dashboard',
            message: error.message || 'No se pudo conectar con el servidor'
          }
        };
      }
    }
  },

  // ═══════════════════════════════════════════
  // 📈 REPORTE
  // ═══════════════════════════════════════════
  reporte: {
    name: 'reporte',
    aliases: ['report', 'informe'],
    icon: '📈',
    description: 'Genera reportes financieros y operativos',
    category: 'reportes',
    subcommands: {
      'financiero': 'Reporte de ingresos, gastos, márgenes',
      'operativo': 'Reporte de entregas, novedades, tiempos',
      'transportadoras': 'Rendimiento por transportadora',
      'ciudades': 'Análisis por ciudad de destino',
      'tendencias': 'Tendencias de los últimos días'
    },
    parameters: [
      { name: 'periodo', type: 'select', options: ['hoy', 'ayer', 'semana', 'mes'], default: 'semana' },
      { name: 'tipo', type: 'select', options: ['financiero', 'operativo', 'completo'], default: 'completo' }
    ],
    examples: ['/reporte', '/reporte financiero', '/reporte semana', '/reporte transportadoras'],
    execute: async (ctx: SkillContext): Promise<SkillResult> => {
      const { params, api } = ctx;
      const tipo = params.subcommand || params.tipo || 'completo';
      const periodo = params.periodo || 'semana';

      try {
        const [resumen, tendencias, transportadoras] = await Promise.all([
          api.get('/dashboard/resumen'),
          api.get('/dashboard/tendencias', { dias: periodo === 'semana' ? 7 : periodo === 'mes' ? 30 : 1 }),
          api.get('/dashboard/transportadoras')
        ]);

        const stats = resumen.estadisticas_generales || {};

        // Intentar obtener análisis de IA
        let analisisIA = null;
        try {
          const iaResponse = await api.post('/api/brain/think', {
            pregunta: `Analiza estos datos de logística y dame 3 insights clave:
              - Total guías: ${stats.total_guias}
              - Tasa entrega: ${stats.tasa_entrega}%
              - Retrasos: ${stats.guias_en_retraso}
              - Novedades: ${stats.guias_con_novedad}
              Sé conciso y práctico.`
          });
          analisisIA = iaResponse.respuesta || iaResponse.pensamiento;
        } catch {
          // IA no disponible, continuar sin ella
        }

        return {
          type: 'report',
          title: `📈 Reporte ${tipo.charAt(0).toUpperCase() + tipo.slice(1)} - ${periodo}`,
          data: {
            periodo,
            tipo,
            resumen: {
              total_guias: stats.total_guias || 0,
              entregadas: stats.guias_entregadas || 0,
              tasa_entrega: stats.tasa_entrega || 0,
              en_retraso: stats.guias_en_retraso || 0,
              con_novedad: stats.guias_con_novedad || 0,
              tasa_retraso: stats.tasa_retraso || 0
            },
            transportadoras: transportadoras || [],
            tendencias: tendencias,
            analisisIA,
            generadoEn: new Date().toISOString()
          },
          actions: [
            { label: '📥 Exportar PDF', action: 'exportar', params: { formato: 'pdf', tipo: 'reporte' } },
            { label: '📊 Exportar Excel', action: 'exportar', params: { formato: 'excel', tipo: 'reporte' } },
            { label: '📧 Enviar por email', action: 'enviar', params: { tipo: 'email', contenido: 'reporte' } }
          ]
        };
      } catch (error: any) {
        return {
          type: 'alert',
          data: {
            type: 'error',
            title: 'Error generando reporte',
            message: error.message
          }
        };
      }
    }
  },

  // ═══════════════════════════════════════════
  // 📦 GUÍAS
  // ═══════════════════════════════════════════
  guias: {
    name: 'guias',
    aliases: ['guia', 'envios', 'shipments'],
    icon: '📦',
    description: 'Busca y gestiona guías de envío',
    category: 'operaciones',
    subcommands: {
      'buscar': 'Buscar guía por número',
      'novedad': 'Guías con novedades',
      'retraso': 'Guías retrasadas',
      'hoy': 'Guías de hoy',
      'pendientes': 'Guías sin entregar'
    },
    examples: ['/guias', '/guias buscar COO123', '/guias novedad', '/guias retraso'],
    execute: async (ctx: SkillContext): Promise<SkillResult> => {
      const { params, api, rawInput } = ctx;
      const subcommand = params.subcommand || 'pendientes';

      try {
        // Buscar guía específica
        if (subcommand === 'buscar' || /^[A-Z]{3}\d+/.test(rawInput)) {
          const numeroGuia = rawInput.match(/[A-Z]{3}\d+/)?.[0] || params.numero;

          if (numeroGuia) {
            const resultado = await api.post('/ml/predecir', { numero_guia: numeroGuia });

            return {
              type: 'card',
              title: `📦 Guía ${numeroGuia}`,
              data: {
                numero: numeroGuia,
                ...resultado,
                prediccion: {
                  probabilidad_retraso: resultado.probabilidad_retraso,
                  nivel_riesgo: resultado.nivel_riesgo,
                  dias_estimados: resultado.dias_estimados_entrega
                }
              },
              actions: [
                { label: '🔍 Ver tracking', action: 'tracking', params: { guia: numeroGuia } },
                { label: '📨 Notificar cliente', action: 'enviar', params: { tipo: 'whatsapp', guia: numeroGuia } }
              ]
            };
          }
        }

        // Obtener lista según subcomando
        const resumen = await api.get('/dashboard/resumen');
        const stats = resumen.estadisticas_generales || {};

        let titulo = '📦 Guías';
        let filtro = '';
        let cantidad = 0;

        switch (subcommand) {
          case 'novedad':
            titulo = '🔔 Guías con Novedad';
            cantidad = stats.guias_con_novedad || 0;
            filtro = 'novedad';
            break;
          case 'retraso':
            titulo = '⚠️ Guías en Retraso';
            cantidad = stats.guias_en_retraso || 0;
            filtro = 'retraso';
            break;
          case 'hoy':
            titulo = '📅 Guías de Hoy';
            cantidad = stats.total_guias || 0;
            filtro = 'hoy';
            break;
          default:
            titulo = '📦 Guías Pendientes';
            cantidad = (stats.total_guias || 0) - (stats.guias_entregadas || 0);
            filtro = 'pendientes';
        }

        return {
          type: 'table',
          title: `${titulo} (${cantidad})`,
          data: {
            filtro,
            cantidad,
            estadisticas: stats,
            mensaje: `Se encontraron ${cantidad} guías con filtro "${filtro}".`
          },
          actions: [
            { label: '📥 Exportar lista', action: 'exportar', params: { tipo: 'guias', filtro } },
            { label: '🔄 Actualizar', action: 'execute_skill', params: { skill: 'guias', args: subcommand } },
            { label: '📊 Ver estadísticas', action: 'execute_skill', params: { skill: 'dashboard' } }
          ]
        };
      } catch (error: any) {
        return {
          type: 'alert',
          data: {
            type: 'error',
            title: 'Error buscando guías',
            message: error.message
          }
        };
      }
    }
  },

  // ═══════════════════════════════════════════
  // 🔍 TRACKING
  // ═══════════════════════════════════════════
  tracking: {
    name: 'tracking',
    aliases: ['track', 'rastrear', 'seguimiento'],
    icon: '🔍',
    description: 'Rastrea una guía en tiempo real',
    category: 'operaciones',
    examples: ['/tracking COO123456', '/track SER789'],
    execute: async (ctx: SkillContext): Promise<SkillResult> => {
      const { rawInput, api } = ctx;
      const numeroGuia = rawInput.match(/[A-Z0-9]+/)?.[0];

      if (!numeroGuia) {
        return {
          type: 'alert',
          data: {
            type: 'warning',
            title: 'Número de guía requerido',
            message: 'Usa: /tracking NUMERO_GUIA'
          }
        };
      }

      try {
        const resultado = await api.post('/ml/predecir', { numero_guia: numeroGuia });

        return {
          type: 'card',
          title: `🔍 Tracking: ${numeroGuia}`,
          data: {
            numero: numeroGuia,
            estado: resultado.estado || 'En proceso',
            prediccion: {
              probabilidad_retraso: resultado.probabilidad_retraso,
              nivel_riesgo: resultado.nivel_riesgo,
              fecha_estimada: resultado.fecha_estimada_entrega
            },
            factores: resultado.factores_riesgo || [],
            acciones: resultado.acciones_recomendadas || []
          },
          actions: [
            { label: '📨 Notificar cliente', action: 'enviar', params: { tipo: 'whatsapp', guia: numeroGuia } },
            { label: '⚠️ Crear alerta', action: 'crear_alerta', params: { guia: numeroGuia } }
          ]
        };
      } catch (error: any) {
        return {
          type: 'alert',
          data: {
            type: 'error',
            title: 'Error en tracking',
            message: error.message
          }
        };
      }
    }
  },

  // ═══════════════════════════════════════════
  // 💰 FINANZAS
  // ═══════════════════════════════════════════
  finanzas: {
    name: 'finanzas',
    aliases: ['finance', 'dinero', 'plata'],
    icon: '💰',
    description: 'Análisis financiero detallado',
    category: 'finanzas',
    subcommands: {
      'resumen': 'Resumen P&L',
      'ingresos': 'Detalle de ingresos',
      'gastos': 'Detalle de gastos',
      'margen': 'Análisis de márgenes'
    },
    examples: ['/finanzas', '/finanzas resumen', '/finanzas margen'],
    execute: async (ctx: SkillContext): Promise<SkillResult> => {
      const { params, api } = ctx;

      try {
        // Intentar obtener reporte financiero del admin
        const reporte = await api.get('/admin/financial/latest').catch(() => null);
        const kpis = await api.get('/dashboard/kpis-avanzados');

        const financiero = reporte?.reporte || {
          resumen: {
            total_facturado: 0,
            ganancia_bruta: 0,
            margen_bruto: kpis.otif_score || 0,
            total_fletes: kpis.costo_por_entrega || 0
          }
        };

        return {
          type: 'report',
          title: '💰 Análisis Financiero',
          data: {
            cards: [
              {
                title: 'Facturado',
                value: `$${(financiero.resumen?.total_facturado || 0).toLocaleString()}`,
                icon: '💵',
                color: 'green'
              },
              {
                title: 'Ganancia',
                value: `$${(financiero.resumen?.ganancia_bruta || 0).toLocaleString()}`,
                icon: '📈',
                color: 'blue'
              },
              {
                title: 'Margen',
                value: `${financiero.resumen?.margen_bruto || 0}%`,
                icon: '📊',
                color: financiero.resumen?.margen_bruto >= 20 ? 'green' : 'orange'
              },
              {
                title: 'Costo/Entrega',
                value: `$${(kpis.costo_por_entrega || 0).toLocaleString()}`,
                icon: '🚚',
                color: 'purple'
              }
            ],
            kpis: {
              otif: kpis.otif_score,
              nps: kpis.nps_logistico,
              eficiencia: kpis.eficiencia_ruta,
              primera_entrega: kpis.tasa_primera_entrega
            },
            alertas: financiero.alertas || [],
            recomendaciones: financiero.recomendaciones || {}
          },
          actions: [
            { label: '📥 Exportar P&L', action: 'exportar', params: { tipo: 'financiero', formato: 'excel' } },
            { label: '📊 Ver tendencias', action: 'execute_skill', params: { skill: 'reporte', args: 'tendencias' } }
          ]
        };
      } catch (error: any) {
        return {
          type: 'alert',
          data: {
            type: 'error',
            title: 'Error en finanzas',
            message: error.message
          }
        };
      }
    }
  },

  // ═══════════════════════════════════════════
  // ⚠️ ALERTAS
  // ═══════════════════════════════════════════
  alertas: {
    name: 'alertas',
    aliases: ['alerts', 'avisos', 'notificaciones'],
    icon: '⚠️',
    description: 'Gestiona alertas del sistema',
    category: 'operaciones',
    subcommands: {
      'ver': 'Ver alertas activas',
      'criticas': 'Solo alertas críticas',
      'resolver': 'Marcar alerta como resuelta'
    },
    examples: ['/alertas', '/alertas criticas', '/alertas resolver 123'],
    execute: async (ctx: SkillContext): Promise<SkillResult> => {
      const { params, api } = ctx;

      try {
        const alertas = await api.get('/alertas/listar', { activas: true });

        const criticas = alertas.filter((a: any) => a.severidad === 'CRITICA');
        const advertencias = alertas.filter((a: any) => a.severidad === 'ADVERTENCIA');

        return {
          type: 'list',
          title: `⚠️ Alertas Activas (${alertas.length})`,
          data: {
            total: alertas.length,
            criticas: criticas.length,
            advertencias: advertencias.length,
            alertas: params.subcommand === 'criticas' ? criticas : alertas
          },
          actions: [
            { label: '🔄 Actualizar', action: 'execute_skill', params: { skill: 'alertas' } },
            { label: '✅ Resolver todas', action: 'resolver_alertas', params: { todas: true } }
          ]
        };
      } catch (error: any) {
        return {
          type: 'alert',
          data: {
            type: 'error',
            title: 'Error cargando alertas',
            message: error.message
          }
        };
      }
    }
  },

  // ═══════════════════════════════════════════
  // 🚚 TRANSPORTADORA
  // ═══════════════════════════════════════════
  transportadora: {
    name: 'transportadora',
    aliases: ['carrier', 'transportadoras', 'carriers'],
    icon: '🚚',
    description: 'Info y rendimiento de transportadoras',
    category: 'operaciones',
    subcommands: {
      'comparar': 'Comparar todas las transportadoras',
      'mejor': 'Transportadora con mejor rendimiento',
      'peor': 'Transportadora con peor rendimiento'
    },
    examples: ['/transportadora', '/transportadora Coordinadora', '/transportadora comparar'],
    execute: async (ctx: SkillContext): Promise<SkillResult> => {
      const { params, api, rawInput } = ctx;

      try {
        const transportadoras = await api.get('/dashboard/transportadoras');

        // Si piden una específica
        const nombreBuscado = rawInput.replace(/comparar|mejor|peor/gi, '').trim();
        if (nombreBuscado && params.subcommand !== 'comparar') {
          const encontrada = transportadoras.find((t: any) =>
            t.nombre?.toLowerCase().includes(nombreBuscado.toLowerCase())
          );

          if (encontrada) {
            return {
              type: 'card',
              title: `🚚 ${encontrada.nombre}`,
              data: {
                ...encontrada,
                eficiencia: 100 - (encontrada.tasa_retraso || 0)
              },
              actions: [
                { label: '📊 Ver guías', action: 'execute_skill', params: { skill: 'guias', args: encontrada.nombre } },
                { label: '📈 Tendencias', action: 'ver_tendencias', params: { transportadora: encontrada.nombre } }
              ]
            };
          }
        }

        // Comparar todas
        const ordenadas = [...transportadoras].sort((a: any, b: any) =>
          (a.tasa_retraso || 0) - (b.tasa_retraso || 0)
        );

        return {
          type: 'table',
          title: '🚚 Comparativa de Transportadoras',
          data: {
            headers: ['Transportadora', 'Guías', 'Entregadas', 'Tasa Retraso', 'Tiempo Prom.'],
            rows: ordenadas.map((t: any) => [
              t.nombre,
              t.total_guias || 0,
              t.total_guias - (t.retrasos || 0),
              `${t.tasa_retraso || 0}%`,
              `${t.tiempo_promedio_dias || 0} días`
            ]),
            mejor: ordenadas[0]?.nombre,
            peor: ordenadas[ordenadas.length - 1]?.nombre
          },
          actions: [
            { label: '📥 Exportar', action: 'exportar', params: { tipo: 'transportadoras' } }
          ]
        };
      } catch (error: any) {
        return {
          type: 'alert',
          data: {
            type: 'error',
            title: 'Error',
            message: error.message
          }
        };
      }
    }
  },

  // ═══════════════════════════════════════════
  // 👥 CLIENTES
  // ═══════════════════════════════════════════
  clientes: {
    name: 'clientes',
    aliases: ['clients', 'customers', 'crm'],
    icon: '👥',
    description: 'Gestión de clientes',
    category: 'clientes',
    subcommands: {
      'buscar': 'Buscar cliente',
      'top': 'Mejores clientes',
      'inactivos': 'Clientes sin compras recientes'
    },
    examples: ['/clientes', '/clientes top 10', '/clientes buscar juan'],
    execute: async (ctx: SkillContext): Promise<SkillResult> => {
      const { params } = ctx;

      // Por ahora retornamos datos de ejemplo
      return {
        type: 'table',
        title: '👥 Gestión de Clientes',
        content: 'Módulo de CRM disponible próximamente.',
        data: {
          mensaje: 'El sistema de clientes está en desarrollo.',
          funcionalidades: [
            'Búsqueda de clientes',
            'Historial de compras',
            'Segmentación automática',
            'Valor de vida (LTV)'
          ]
        },
        actions: [
          { label: '📊 Ver dashboard', action: 'execute_skill', params: { skill: 'dashboard' } }
        ]
      };
    }
  },

  // ═══════════════════════════════════════════
  // 📤 EXPORTAR
  // ═══════════════════════════════════════════
  exportar: {
    name: 'exportar',
    aliases: ['export', 'descargar', 'download'],
    icon: '📤',
    description: 'Exporta datos a diferentes formatos',
    category: 'operaciones',
    subcommands: {
      'excel': 'Exportar a Excel',
      'pdf': 'Exportar a PDF',
      'csv': 'Exportar a CSV'
    },
    examples: ['/exportar excel', '/exportar pdf reporte', '/exportar guias'],
    execute: async (ctx: SkillContext): Promise<SkillResult> => {
      const { params, api } = ctx;
      const formato = params.subcommand || 'excel';

      try {
        const resultado = await api.post('/reportes/generar', {
          tipo: formato.toUpperCase(),
          filtros: params
        });

        return {
          type: 'card',
          title: `📤 Exportación ${formato.toUpperCase()}`,
          data: {
            id: resultado.id,
            estado: resultado.estado,
            url: resultado.url_descarga,
            mensaje: resultado.mensaje
          },
          actions: [
            { label: '⬇️ Descargar', action: 'download', params: { url: resultado.url_descarga } },
            { label: '📧 Enviar por email', action: 'enviar', params: { tipo: 'email', archivo: resultado.id } }
          ]
        };
      } catch (error: any) {
        return {
          type: 'alert',
          data: {
            type: 'error',
            title: 'Error exportando',
            message: error.message
          }
        };
      }
    }
  },

  // ═══════════════════════════════════════════
  // 📨 ENVIAR
  // ═══════════════════════════════════════════
  enviar: {
    name: 'enviar',
    aliases: ['send', 'mensaje', 'notificar'],
    icon: '📨',
    description: 'Envía mensajes y notificaciones',
    category: 'operaciones',
    subcommands: {
      'whatsapp': 'Enviar por WhatsApp',
      'email': 'Enviar por email',
      'masivo': 'Envío masivo'
    },
    examples: ['/enviar whatsapp 3001234567', '/enviar email test@mail.com'],
    execute: async (ctx: SkillContext): Promise<SkillResult> => {
      const { params, rawInput } = ctx;
      const tipo = params.subcommand || 'whatsapp';

      // Extraer número o email
      const telefono = rawInput.match(/\d{10}/)?.[0];
      const email = rawInput.match(/[\w.-]+@[\w.-]+\.\w+/)?.[0];

      return {
        type: 'card',
        title: `📨 Enviar ${tipo}`,
        content: tipo === 'whatsapp'
          ? `Enviar mensaje por WhatsApp${telefono ? ` a ${telefono}` : ''}`
          : `Enviar email${email ? ` a ${email}` : ''}`,
        data: {
          tipo,
          destino: telefono || email || 'No especificado',
          plantillas: [
            'Actualización de envío',
            'Confirmación de entrega',
            'Notificación de novedad',
            'Mensaje personalizado'
          ]
        },
        actions: [
          { label: '✉️ Enviar ahora', action: 'enviar_mensaje', params: { tipo, destino: telefono || email } },
          { label: '📝 Editar mensaje', action: 'editar_mensaje', params: { tipo } }
        ]
      };
    }
  },

  // ═══════════════════════════════════════════
  // 🔮 PREDECIR
  // ═══════════════════════════════════════════
  predecir: {
    name: 'predecir',
    aliases: ['predict', 'prediccion', 'ml'],
    icon: '🔮',
    description: 'Predicciones con Machine Learning',
    category: 'operaciones',
    subcommands: {
      'retraso': 'Predecir si habrá retraso',
      'demanda': 'Predecir demanda',
      'riesgo': 'Evaluar riesgo de guías'
    },
    examples: ['/predecir retraso COO123', '/predecir demanda', '/predecir riesgo'],
    execute: async (ctx: SkillContext): Promise<SkillResult> => {
      const { params, api, rawInput } = ctx;

      try {
        // Predecir retraso de guía específica
        const numeroGuia = rawInput.match(/[A-Z]{3}\d+/)?.[0];

        if (numeroGuia) {
          const prediccion = await api.post('/ml/predecir', { numero_guia: numeroGuia });

          return {
            type: 'card',
            title: `🔮 Predicción: ${numeroGuia}`,
            data: {
              guia: numeroGuia,
              probabilidad_retraso: prediccion.probabilidad_retraso,
              nivel_riesgo: prediccion.nivel_riesgo,
              dias_estimados: prediccion.dias_estimados_entrega,
              fecha_estimada: prediccion.fecha_estimada_entrega,
              factores: prediccion.factores_riesgo || [],
              acciones: prediccion.acciones_recomendadas || [],
              confianza: prediccion.confianza
            },
            actions: [
              { label: '📨 Notificar cliente', action: 'enviar', params: { guia: numeroGuia } },
              { label: '⚠️ Crear alerta', action: 'crear_alerta', params: { guia: numeroGuia, riesgo: prediccion.nivel_riesgo } }
            ]
          };
        }

        // Estado general de predicciones
        const estado = await api.get('/ml/estado-entrenamiento');
        const metricas = await api.get('/ml/metricas');

        return {
          type: 'card',
          title: '🔮 Sistema de Predicciones ML',
          data: {
            estado: estado,
            metricas: metricas,
            modelos: ['ModeloRetrasos', 'ModeloNovedades']
          },
          actions: [
            { label: '🧠 Entrenar modelos', action: 'execute_skill', params: { skill: 'entrenar' } },
            { label: '📊 Ver métricas', action: 'ver_metricas_ml' }
          ]
        };
      } catch (error: any) {
        return {
          type: 'alert',
          data: {
            type: 'error',
            title: 'Error en predicción',
            message: error.message
          }
        };
      }
    }
  },

  // ═══════════════════════════════════════════
  // 🧠 ENTRENAR
  // ═══════════════════════════════════════════
  entrenar: {
    name: 'entrenar',
    aliases: ['train', 'training', 'aprender'],
    icon: '🧠',
    description: 'Entrena los modelos de Machine Learning',
    category: 'configuracion',
    examples: ['/entrenar', '/entrenar modelos'],
    execute: async (ctx: SkillContext): Promise<SkillResult> => {
      const { api } = ctx;

      try {
        const resultado = await api.post('/ml/entrenar');

        return {
          type: 'card',
          title: '🧠 Entrenamiento de Modelos',
          data: {
            exito: resultado.exito,
            mensaje: resultado.mensaje,
            metricas: resultado.metricas,
            modelos_entrenados: Object.keys(resultado.metricas || {})
          },
          actions: [
            { label: '📊 Ver métricas', action: 'execute_skill', params: { skill: 'predecir' } },
            { label: '🔄 Entrenar de nuevo', action: 'execute_skill', params: { skill: 'entrenar' } }
          ]
        };
      } catch (error: any) {
        return {
          type: 'alert',
          data: {
            type: 'error',
            title: 'Error entrenando',
            message: error.message
          }
        };
      }
    }
  },

  // ═══════════════════════════════════════════
  // ⚙️ CONFIG
  // ═══════════════════════════════════════════
  config: {
    name: 'config',
    aliases: ['configuracion', 'settings', 'ajustes'],
    icon: '⚙️',
    description: 'Configuración del sistema',
    category: 'configuracion',
    subcommands: {
      'ver': 'Ver configuración actual',
      'apis': 'Configurar API keys',
      'notificaciones': 'Configurar notificaciones'
    },
    examples: ['/config', '/config apis', '/config notificaciones'],
    execute: async (ctx: SkillContext): Promise<SkillResult> => {
      const { api } = ctx;

      try {
        const config = await api.get('/config');

        return {
          type: 'card',
          title: '⚙️ Configuración del Sistema',
          data: {
            configuraciones: config,
            secciones: [
              { nombre: 'APIs', icono: '🔑', estado: 'Configurado' },
              { nombre: 'Notificaciones', icono: '🔔', estado: 'Activo' },
              { nombre: 'ML', icono: '🧠', estado: 'Entrenado' },
              { nombre: 'Integraciones', icono: '🔗', estado: 'Conectado' }
            ]
          },
          actions: [
            { label: '🔑 APIs', action: 'config_apis' },
            { label: '🔔 Notificaciones', action: 'config_notificaciones' },
            { label: '🧠 ML', action: 'config_ml' }
          ]
        };
      } catch (error: any) {
        return {
          type: 'alert',
          data: {
            type: 'error',
            title: 'Error cargando config',
            message: error.message
          }
        };
      }
    }
  }
};

// Exportar lista de skills para UI
export const SKILL_LIST = Object.values(SKILLS);
export const SKILL_CATEGORIES = [...new Set(SKILL_LIST.map(s => s.category))];
