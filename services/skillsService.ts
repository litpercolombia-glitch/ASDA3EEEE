// ============================================
// LITPER COMMAND CENTER - SKILLS SERVICE
// Sistema de habilidades para el Copilot IA
// ============================================

import { guiasService, ciudadesService, finanzasService, alertasService, cargasService, DBGuia, DBCiudadStats } from './supabaseService';
import { webSearchService, weatherService } from './webSearchService';
import { chateaService } from './chateaService';

// ============================================
// TIPOS
// ============================================

export interface SkillResult {
  success: boolean;
  data?: unknown;
  message: string;
  artifacts?: SkillArtifact[];
  actions?: SkillAction[];
  suggestions?: string[];
}

export interface SkillArtifact {
  type: 'table' | 'chart' | 'card' | 'list' | 'map' | 'timeline';
  title: string;
  data: unknown;
}

export interface SkillAction {
  id: string;
  label: string;
  icon: string;
  action: string;
  params?: Record<string, unknown>;
  confirmRequired?: boolean;
}

export interface SkillDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'logistica' | 'finanzas' | 'comunicacion' | 'analisis' | 'automatizacion' | 'web';
  keywords: string[];
  execute: (params: Record<string, unknown>) => Promise<SkillResult>;
}

// ============================================
// UTILIDADES
// ============================================

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function getEstadoEmoji(estado: string): string {
  const lower = estado.toLowerCase();
  if (lower.includes('entregad')) return '✅';
  if (lower.includes('transito') || lower.includes('ruta')) return '🚚';
  if (lower.includes('novedad')) return '⚠️';
  if (lower.includes('devolu') || lower.includes('retorno')) return '↩️';
  if (lower.includes('pend')) return '📋';
  return '📦';
}

function getCiudadEmoji(status: string): string {
  switch (status) {
    case 'verde': return '🟢';
    case 'amarillo': return '🟡';
    case 'naranja': return '🟠';
    case 'rojo': return '🔴';
    default: return '⚪';
  }
}

// ============================================
// SKILLS DE LOGÍSTICA
// ============================================

const guiasSkill: SkillDefinition = {
  id: 'guias',
  name: 'Guías',
  description: 'Buscar, analizar y gestionar guías de envío',
  icon: '📦',
  category: 'logistica',
  keywords: ['guia', 'guías', 'envio', 'envíos', 'paquete', 'tracking', 'rastreo', 'numero'],

  async execute(params): Promise<SkillResult> {
    try {
      const action = params.action as string || 'resumen';
      const filtro = params.filtro as string;

      if (action === 'buscar' && filtro) {
        const guias = await guiasService.getAll(100);
        const filtered = guias.filter(g =>
          g.numero_guia.includes(filtro) ||
          g.nombre_cliente?.toLowerCase().includes(filtro.toLowerCase()) ||
          g.ciudad_destino.toLowerCase().includes(filtro.toLowerCase())
        );

        return {
          success: true,
          message: `Encontré ${filtered.length} guía(s) que coinciden con "${filtro}"`,
          data: filtered,
          artifacts: [{
            type: 'table',
            title: `Resultados de búsqueda: ${filtro}`,
            data: {
              columns: ['Guía', 'Cliente', 'Ciudad', 'Estado', 'Valor'],
              rows: filtered.slice(0, 10).map(g => [
                g.numero_guia,
                g.nombre_cliente || 'N/A',
                g.ciudad_destino,
                `${getEstadoEmoji(g.estado)} ${g.estado}`,
                formatCurrency(g.valor_declarado),
              ]),
            },
          }],
          suggestions: ['Ver detalles de una guía', '¿Cuántas guías hay hoy?', 'Buscar otra guía'],
        };
      }

      // Resumen general
      const guiasHoy = await guiasService.getHoy();
      const stats = await guiasService.getStats();

      const porEstado: Record<string, number> = {};
      guiasHoy.forEach(g => {
        const estado = g.estado || 'Sin estado';
        porEstado[estado] = (porEstado[estado] || 0) + 1;
      });

      const novedades = guiasHoy.filter(g => g.tiene_novedad);
      const masValiosas = [...guiasHoy].sort((a, b) => b.valor_declarado - a.valor_declarado).slice(0, 5);

      return {
        success: true,
        message: `📦 **Resumen de Guías Hoy**\n\n` +
          `- Total: **${guiasHoy.length}** guías\n` +
          `- ✅ Entregadas: **${stats.entregadas}** (${formatPercent(stats.tasaEntrega)})\n` +
          `- 🚚 En tránsito: **${stats.enTransito}**\n` +
          `- ⚠️ Con novedad: **${stats.conNovedad}**\n` +
          `- ↩️ Devueltas: **${stats.devueltas}**\n\n` +
          `💰 Valor total: **${formatCurrency(guiasHoy.reduce((s, g) => s + g.valor_declarado, 0))}**`,
        data: { guiasHoy, stats, porEstado },
        artifacts: [
          {
            type: 'chart',
            title: 'Distribución por Estado',
            data: {
              type: 'pie',
              labels: Object.keys(porEstado),
              values: Object.values(porEstado),
            },
          },
          {
            type: 'table',
            title: 'Guías Más Valiosas',
            data: {
              columns: ['Guía', 'Ciudad', 'Estado', 'Valor'],
              rows: masValiosas.map(g => [
                g.numero_guia,
                g.ciudad_destino,
                g.estado,
                formatCurrency(g.valor_declarado),
              ]),
            },
          },
        ],
        actions: [
          { id: 'ver_novedades', label: 'Ver Novedades', icon: '⚠️', action: 'ver_novedades' },
          { id: 'exportar', label: 'Exportar a Excel', icon: '📊', action: 'exportar_guias' },
        ],
        suggestions: novedades.length > 0
          ? [`Ver las ${novedades.length} guías con novedad`, 'Analizar por transportadora', 'Ver guías atrasadas']
          : ['Analizar por transportadora', 'Ver guías atrasadas', 'Buscar una guía específica'],
      };
    } catch (error) {
      return {
        success: false,
        message: `Error al obtener guías: ${error}`,
      };
    }
  },
};

const ciudadesSkill: SkillDefinition = {
  id: 'ciudades',
  name: 'Ciudades',
  description: 'Monitorear semáforo de ciudades y gestionar envíos por zona',
  icon: '🗺️',
  category: 'logistica',
  keywords: ['ciudad', 'ciudades', 'semaforo', 'zona', 'region', 'departamento', 'pausar', 'reanudar'],

  async execute(params): Promise<SkillResult> {
    try {
      const action = params.action as string || 'resumen';
      const ciudadId = params.ciudadId as string;

      if (action === 'pausar' && ciudadId) {
        await ciudadesService.pausar(ciudadId);
        return {
          success: true,
          message: `✅ Ciudad pausada correctamente. Ya no se aceptarán envíos a esta zona.`,
          actions: [
            { id: 'reanudar', label: 'Reanudar Ciudad', icon: '▶️', action: 'reanudar_ciudad', params: { ciudadId } },
          ],
        };
      }

      if (action === 'reanudar' && ciudadId) {
        await ciudadesService.reanudar(ciudadId);
        return {
          success: true,
          message: `✅ Ciudad reanudada. Se aceptan envíos nuevamente.`,
        };
      }

      // Resumen de ciudades
      const ciudades = await ciudadesService.getAll();
      const criticas = ciudades.filter(c => c.status === 'rojo' || c.status === 'naranja');
      const pausadas = ciudades.filter(c => c.pausado);

      const porStatus = {
        verde: ciudades.filter(c => c.status === 'verde').length,
        amarillo: ciudades.filter(c => c.status === 'amarillo').length,
        naranja: ciudades.filter(c => c.status === 'naranja').length,
        rojo: ciudades.filter(c => c.status === 'rojo').length,
      };

      // Obtener clima para ciudades críticas
      let weatherInfo = '';
      if (criticas.length > 0 && criticas.length <= 3) {
        for (const ciudad of criticas.slice(0, 3)) {
          const weather = await weatherService.getWeather(ciudad.ciudad);
          if (weather) {
            weatherInfo += `\n🌤️ **${ciudad.ciudad}**: ${weather.temperatura}°C, ${weather.condicion}`;
            if (weather.alertas.length > 0) {
              weatherInfo += ` ${weather.alertas.join(', ')}`;
            }
          }
        }
      }

      return {
        success: true,
        message: `🗺️ **Semáforo de Ciudades**\n\n` +
          `- 🟢 Verde: **${porStatus.verde}** ciudades\n` +
          `- 🟡 Amarillo: **${porStatus.amarillo}** ciudades\n` +
          `- 🟠 Naranja: **${porStatus.naranja}** ciudades\n` +
          `- 🔴 Rojo: **${porStatus.rojo}** ciudades\n` +
          `- ⏸️ Pausadas: **${pausadas.length}** ciudades\n` +
          (weatherInfo ? `\n**Clima en ciudades críticas:**${weatherInfo}` : ''),
        data: { ciudades, criticas, pausadas, porStatus },
        artifacts: [
          {
            type: 'table',
            title: 'Ciudades Críticas',
            data: {
              columns: ['Ciudad', 'Estado', 'Tasa Entrega', 'Total Guías', 'Acción'],
              rows: criticas.slice(0, 10).map(c => [
                `${getCiudadEmoji(c.status)} ${c.ciudad}`,
                c.status.toUpperCase(),
                formatPercent(c.tasa_entrega),
                c.total_guias.toString(),
                c.pausado ? '⏸️ Pausada' : '▶️ Activa',
              ]),
            },
          },
        ],
        actions: criticas.length > 0
          ? criticas.slice(0, 3).map(c => ({
              id: `pausar_${c.id}`,
              label: c.pausado ? `Reanudar ${c.ciudad}` : `Pausar ${c.ciudad}`,
              icon: c.pausado ? '▶️' : '⏸️',
              action: c.pausado ? 'reanudar_ciudad' : 'pausar_ciudad',
              params: { ciudadId: c.id },
              confirmRequired: true,
            }))
          : [],
        suggestions: criticas.length > 0
          ? [`Pausar ${criticas[0]?.ciudad}`, 'Ver transportadora recomendada', 'Analizar histórico']
          : ['Ver todas las ciudades', 'Comparar transportadoras', 'Ver estadísticas por departamento'],
      };
    } catch (error) {
      return {
        success: false,
        message: `Error al obtener ciudades: ${error}`,
      };
    }
  },
};

const novedadesSkill: SkillDefinition = {
  id: 'novedades',
  name: 'Novedades',
  description: 'Gestionar y resolver novedades de envíos',
  icon: '⚠️',
  category: 'logistica',
  keywords: ['novedad', 'novedades', 'problema', 'incidencia', 'devolucion', 'fallido'],

  async execute(): Promise<SkillResult> {
    try {
      const guias = await guiasService.getAll(500);
      const novedades = guias.filter(g => g.tiene_novedad);

      const porTipo: Record<string, DBGuia[]> = {};
      novedades.forEach(g => {
        const tipo = g.tipo_novedad || 'Sin clasificar';
        if (!porTipo[tipo]) porTipo[tipo] = [];
        porTipo[tipo].push(g);
      });

      const tiposOrdenados = Object.entries(porTipo).sort((a, b) => b[1].length - a[1].length);

      return {
        success: true,
        message: `⚠️ **Novedades Pendientes: ${novedades.length}**\n\n` +
          tiposOrdenados.slice(0, 5).map(([tipo, guias]) =>
            `- **${tipo}**: ${guias.length} guías`
          ).join('\n') +
          `\n\n💰 Valor en riesgo: **${formatCurrency(novedades.reduce((s, g) => s + g.valor_declarado, 0))}**`,
        data: { novedades, porTipo },
        artifacts: [{
          type: 'table',
          title: 'Novedades Recientes',
          data: {
            columns: ['Guía', 'Tipo', 'Ciudad', 'Días', 'Valor'],
            rows: novedades.slice(0, 15).map(g => [
              g.numero_guia,
              g.tipo_novedad || 'N/A',
              g.ciudad_destino,
              `${g.dias_transito} días`,
              formatCurrency(g.valor_declarado),
            ]),
          },
        }],
        actions: [
          { id: 'exportar', label: 'Exportar Lista', icon: '📊', action: 'exportar_novedades' },
          { id: 'notificar', label: 'Notificar Clientes', icon: '📱', action: 'notificar_novedades', confirmRequired: true },
        ],
        suggestions: ['¿Cómo resolver novedades de dirección?', 'Ver guías con más días', 'Contactar clientes afectados'],
      };
    } catch (error) {
      return {
        success: false,
        message: `Error al obtener novedades: ${error}`,
      };
    }
  },
};

// ============================================
// SKILLS DE FINANZAS
// ============================================

const finanzasSkill: SkillDefinition = {
  id: 'finanzas',
  name: 'Finanzas',
  description: 'Analizar ingresos, gastos, márgenes y rentabilidad',
  icon: '💰',
  category: 'finanzas',
  keywords: ['finanzas', 'dinero', 'ingreso', 'gasto', 'margen', 'utilidad', 'rentabilidad', 'ventas'],

  async execute(params): Promise<SkillResult> {
    try {
      const mes = params.mes as string || new Date().toISOString().slice(0, 7);

      const resumen = await finanzasService.getResumenMes(mes);
      const registros = await finanzasService.getByMes(mes);
      const guiasHoy = await guiasService.getHoy();

      const ventasHoy = guiasHoy.reduce((s, g) => s + g.valor_declarado, 0);
      const gananciaHoy = guiasHoy.reduce((s, g) => s + g.ganancia, 0);

      // Agrupar gastos por categoría
      const gastosPorCategoria: Record<string, number> = {};
      registros.filter(r => r.tipo === 'gasto').forEach(r => {
        gastosPorCategoria[r.categoria] = (gastosPorCategoria[r.categoria] || 0) + r.monto;
      });

      return {
        success: true,
        message: `💰 **Resumen Financiero - ${mes}**\n\n` +
          `**Mes Actual:**\n` +
          `- 💵 Ingresos: **${formatCurrency(resumen.ingresos)}**\n` +
          `- 📤 Gastos: **${formatCurrency(resumen.gastos)}**\n` +
          `- 📈 Utilidad: **${formatCurrency(resumen.utilidad)}**\n` +
          `- 📊 Margen: **${formatPercent(resumen.margen)}**\n\n` +
          `**Hoy:**\n` +
          `- 🛒 Ventas: **${formatCurrency(ventasHoy)}**\n` +
          `- 💎 Ganancia: **${formatCurrency(gananciaHoy)}**`,
        data: { resumen, registros, ventasHoy, gananciaHoy },
        artifacts: [
          {
            type: 'chart',
            title: 'Ingresos vs Gastos',
            data: {
              type: 'bar',
              labels: ['Ingresos', 'Gastos', 'Utilidad'],
              values: [resumen.ingresos, resumen.gastos, resumen.utilidad],
              colors: ['#10b981', '#ef4444', '#8b5cf6'],
            },
          },
          {
            type: 'chart',
            title: 'Distribución de Gastos',
            data: {
              type: 'pie',
              labels: Object.keys(gastosPorCategoria),
              values: Object.values(gastosPorCategoria),
            },
          },
        ],
        actions: [
          { id: 'agregar_ingreso', label: 'Agregar Ingreso', icon: '➕', action: 'agregar_finanza', params: { tipo: 'ingreso' } },
          { id: 'agregar_gasto', label: 'Agregar Gasto', icon: '➖', action: 'agregar_finanza', params: { tipo: 'gasto' } },
          { id: 'exportar', label: 'Exportar Reporte', icon: '📊', action: 'exportar_finanzas' },
        ],
        suggestions: ['¿Cuál es mi gasto más alto?', 'Comparar con mes anterior', 'Proyección del mes'],
      };
    } catch (error) {
      return {
        success: false,
        message: `Error al obtener finanzas: ${error}`,
      };
    }
  },
};

// ============================================
// SKILLS DE COMUNICACIÓN
// ============================================

const whatsappSkill: SkillDefinition = {
  id: 'whatsapp',
  name: 'WhatsApp',
  description: 'Enviar notificaciones y mensajes por WhatsApp',
  icon: '📱',
  category: 'comunicacion',
  keywords: ['whatsapp', 'mensaje', 'notificacion', 'sms', 'contactar', 'enviar'],

  async execute(params): Promise<SkillResult> {
    try {
      const action = params.action as string || 'status';
      const telefono = params.telefono as string;
      const mensaje = params.mensaje as string;

      if (action === 'enviar' && telefono && mensaje) {
        await chateaService.enviarMensaje(telefono, mensaje);
        return {
          success: true,
          message: `✅ Mensaje enviado a ${telefono}`,
          actions: [
            { id: 'ver_conversacion', label: 'Ver Conversación', icon: '💬', action: 'ver_conversacion', params: { telefono } },
          ],
        };
      }

      // Estado del servicio
      const configured = chateaService.isConfigured();

      return {
        success: true,
        message: configured
          ? `📱 **WhatsApp Business**\n\nServicio configurado y listo para enviar mensajes.`
          : `⚠️ **WhatsApp no configurado**\n\nConfigura las credenciales de Chatea en el archivo .env`,
        data: { configured },
        actions: configured
          ? [
              { id: 'enviar_prueba', label: 'Enviar Prueba', icon: '📤', action: 'enviar_whatsapp_prueba' },
              { id: 'notificar_novedades', label: 'Notificar Novedades', icon: '⚠️', action: 'notificar_novedades', confirmRequired: true },
            ]
          : [],
        suggestions: ['Enviar mensaje de prueba', 'Notificar clientes con novedad', 'Ver plantillas de mensajes'],
      };
    } catch (error) {
      return {
        success: false,
        message: `Error con WhatsApp: ${error}`,
      };
    }
  },
};

const alertasSkill: SkillDefinition = {
  id: 'alertas',
  name: 'Alertas',
  description: 'Ver y gestionar alertas del sistema',
  icon: '🔔',
  category: 'comunicacion',
  keywords: ['alerta', 'alertas', 'notificacion', 'aviso', 'urgente', 'critico'],

  async execute(): Promise<SkillResult> {
    try {
      const noLeidas = await alertasService.getNoLeidas();
      const recientes = await alertasService.getRecientes(20);

      const porTipo = {
        critica: noLeidas.filter(a => a.tipo === 'critica').length,
        advertencia: noLeidas.filter(a => a.tipo === 'advertencia').length,
        info: noLeidas.filter(a => a.tipo === 'info').length,
        exito: noLeidas.filter(a => a.tipo === 'exito').length,
      };

      const tipoEmoji: Record<string, string> = {
        critica: '🔴',
        advertencia: '🟠',
        info: '🔵',
        exito: '🟢',
      };

      return {
        success: true,
        message: `🔔 **Alertas Pendientes: ${noLeidas.length}**\n\n` +
          (noLeidas.length > 0
            ? noLeidas.slice(0, 5).map(a =>
                `${tipoEmoji[a.tipo]} **${a.titulo}**\n   ${a.mensaje.slice(0, 100)}...`
              ).join('\n\n')
            : '✅ No hay alertas pendientes'),
        data: { noLeidas, recientes, porTipo },
        artifacts: noLeidas.length > 0 ? [{
          type: 'list',
          title: 'Alertas No Leídas',
          data: noLeidas.map(a => ({
            icon: tipoEmoji[a.tipo],
            title: a.titulo,
            subtitle: a.mensaje,
            timestamp: a.created_at,
          })),
        }] : [],
        actions: noLeidas.length > 0
          ? [
              { id: 'marcar_leidas', label: 'Marcar Todas Leídas', icon: '✓', action: 'marcar_alertas_leidas' },
            ]
          : [],
        suggestions: ['Crear nueva alerta', 'Ver historial de alertas', 'Configurar alertas automáticas'],
      };
    } catch (error) {
      return {
        success: false,
        message: `Error al obtener alertas: ${error}`,
      };
    }
  },
};

// ============================================
// SKILLS DE ANÁLISIS
// ============================================

const reportesSkill: SkillDefinition = {
  id: 'reportes',
  name: 'Reportes',
  description: 'Generar informes y estadísticas detalladas',
  icon: '📊',
  category: 'analisis',
  keywords: ['reporte', 'informe', 'estadistica', 'analisis', 'grafico', 'dashboard'],

  async execute(params): Promise<SkillResult> {
    try {
      const tipo = params.tipo as string || 'general';

      const [guiasHoy, ciudades, cargas, alertas] = await Promise.all([
        guiasService.getHoy(),
        ciudadesService.getAll(),
        cargasService.getActivas(),
        alertasService.getNoLeidas(),
      ]);

      const stats = await guiasService.getStats();
      const mesActual = new Date().toISOString().slice(0, 7);
      const finanzas = await finanzasService.getResumenMes(mesActual);

      // Estadísticas por transportadora
      const porTransportadora: Record<string, { total: number; entregadas: number }> = {};
      guiasHoy.forEach(g => {
        if (!porTransportadora[g.transportadora]) {
          porTransportadora[g.transportadora] = { total: 0, entregadas: 0 };
        }
        porTransportadora[g.transportadora].total++;
        if (g.estado?.toLowerCase().includes('entregad')) {
          porTransportadora[g.transportadora].entregadas++;
        }
      });

      const transportadoras = Object.entries(porTransportadora).map(([nombre, data]) => ({
        nombre,
        total: data.total,
        tasa: data.total > 0 ? (data.entregadas / data.total) * 100 : 0,
      })).sort((a, b) => b.total - a.total);

      return {
        success: true,
        message: `📊 **Reporte Ejecutivo**\n\n` +
          `**Operaciones (Hoy)**\n` +
          `- 📦 Guías: ${guiasHoy.length}\n` +
          `- ✅ Tasa Entrega: ${formatPercent(stats.tasaEntrega)}\n` +
          `- 🏙️ Ciudades Críticas: ${ciudades.filter(c => c.status === 'rojo').length}\n` +
          `- 📋 Cargas Activas: ${cargas.length}\n\n` +
          `**Finanzas (${mesActual})**\n` +
          `- 💵 Ingresos: ${formatCurrency(finanzas.ingresos)}\n` +
          `- 📊 Margen: ${formatPercent(finanzas.margen)}\n\n` +
          `**Top Transportadoras:**\n` +
          transportadoras.slice(0, 3).map(t => `- ${t.nombre}: ${t.total} guías (${formatPercent(t.tasa)})`).join('\n'),
        data: { stats, finanzas, transportadoras, ciudades },
        artifacts: [
          {
            type: 'chart',
            title: 'Rendimiento por Transportadora',
            data: {
              type: 'bar',
              labels: transportadoras.slice(0, 5).map(t => t.nombre),
              values: transportadoras.slice(0, 5).map(t => t.tasa),
            },
          },
          {
            type: 'card',
            title: 'KPIs Principales',
            data: [
              { label: 'Tasa Entrega', value: formatPercent(stats.tasaEntrega), trend: 'up' },
              { label: 'Margen', value: formatPercent(finanzas.margen), trend: 'stable' },
              { label: 'Alertas', value: alertas.length.toString(), trend: alertas.length > 5 ? 'down' : 'up' },
            ],
          },
        ],
        actions: [
          { id: 'exportar_pdf', label: 'Exportar PDF', icon: '📄', action: 'exportar_reporte_pdf' },
          { id: 'enviar_email', label: 'Enviar por Email', icon: '📧', action: 'enviar_reporte_email' },
        ],
        suggestions: ['Reporte por fecha', 'Comparar con semana anterior', 'Ver tendencias'],
      };
    } catch (error) {
      return {
        success: false,
        message: `Error al generar reporte: ${error}`,
      };
    }
  },
};

// ============================================
// SKILLS WEB
// ============================================

const webSearchSkill: SkillDefinition = {
  id: 'web',
  name: 'Buscar Web',
  description: 'Buscar información en internet',
  icon: '🌐',
  category: 'web',
  keywords: ['buscar', 'internet', 'web', 'google', 'informacion', 'consulta'],

  async execute(params): Promise<SkillResult> {
    try {
      const query = params.query as string;

      if (!query) {
        return {
          success: false,
          message: '❓ ¿Qué deseas buscar en internet?',
          suggestions: ['Buscar tarifas transportadoras Colombia', 'Días festivos Colombia 2024', 'Regulaciones envíos Colombia'],
        };
      }

      const results = await webSearchService.search(query, 8);

      if (results.results.length === 0) {
        return {
          success: true,
          message: `No encontré resultados para "${query}". Intenta con otros términos.`,
          suggestions: ['Reformular búsqueda', 'Buscar términos relacionados'],
        };
      }

      return {
        success: true,
        message: `🌐 **Resultados para "${query}"**\n\n` +
          results.results.slice(0, 5).map((r, i) =>
            `${i + 1}. **${r.title}**\n   ${r.snippet.slice(0, 150)}...\n   🔗 ${r.source}`
          ).join('\n\n') +
          `\n\n⏱️ Búsqueda completada en ${results.searchTime}ms`,
        data: results,
        artifacts: [{
          type: 'list',
          title: 'Resultados de Búsqueda',
          data: results.results.map(r => ({
            title: r.title,
            subtitle: r.snippet,
            url: r.url,
            source: r.source,
          })),
        }],
        suggestions: ['Buscar más información', 'Refinar búsqueda', 'Buscar sobre logística Colombia'],
      };
    } catch (error) {
      return {
        success: false,
        message: `Error en búsqueda web: ${error}`,
      };
    }
  },
};

const climaSkill: SkillDefinition = {
  id: 'clima',
  name: 'Clima',
  description: 'Consultar clima de ciudades (útil para logística)',
  icon: '🌤️',
  category: 'web',
  keywords: ['clima', 'tiempo', 'lluvia', 'temperatura', 'pronostico'],

  async execute(params): Promise<SkillResult> {
    try {
      const ciudad = params.ciudad as string;

      if (!ciudad) {
        // Mostrar clima de principales ciudades
        const ciudadesPrincipales = ['Bogotá', 'Medellín', 'Cali', 'Barranquilla'];
        const weatherMap = await weatherService.getMultipleWeather(ciudadesPrincipales);

        let message = '🌤️ **Clima en Principales Ciudades**\n\n';
        for (const [c, w] of weatherMap.entries()) {
          if (w) {
            message += `**${c}**: ${w.temperatura}°C, ${w.condicion}\n`;
            if (w.alertas.length > 0) {
              message += `   ${w.alertas.join(', ')}\n`;
            }
          }
        }

        return {
          success: true,
          message,
          data: { weatherMap: Object.fromEntries(weatherMap) },
          suggestions: ['Clima en Bogotá', 'Clima en ciudades críticas', '¿Lloverá hoy?'],
        };
      }

      const weather = await weatherService.getWeather(ciudad);

      if (!weather) {
        return {
          success: false,
          message: `No pude obtener el clima para "${ciudad}"`,
          suggestions: ['Verificar nombre de ciudad', 'Intentar con ciudad cercana'],
        };
      }

      return {
        success: true,
        message: `🌤️ **Clima en ${weather.ciudad}**\n\n` +
          `🌡️ Temperatura: **${weather.temperatura}°C**\n` +
          `☁️ Condición: **${weather.condicion}**\n` +
          `💧 Humedad: **${weather.humedad}%**\n` +
          `💨 Viento: **${weather.viento} km/h**\n` +
          (weather.alertas.length > 0 ? `\n⚠️ **Alertas:**\n${weather.alertas.join('\n')}` : ''),
        data: weather,
        suggestions: weather.alertas.length > 0
          ? ['¿Afecta las entregas?', 'Ver ciudades alternativas']
          : ['Ver clima en otras ciudades', 'Pronóstico semanal'],
      };
    } catch (error) {
      return {
        success: false,
        message: `Error al obtener clima: ${error}`,
      };
    }
  },
};

// ============================================
// REGISTRO DE SKILLS
// ============================================

export const SKILLS_REGISTRY: SkillDefinition[] = [
  guiasSkill,
  ciudadesSkill,
  novedadesSkill,
  finanzasSkill,
  whatsappSkill,
  alertasSkill,
  reportesSkill,
  webSearchSkill,
  climaSkill,
];

// ============================================
// SERVICIO DE SKILLS
// ============================================

export const skillsService = {
  /**
   * Obtener todos los skills disponibles
   */
  getAll(): SkillDefinition[] {
    return SKILLS_REGISTRY;
  },

  /**
   * Obtener skill por ID
   */
  getById(id: string): SkillDefinition | undefined {
    return SKILLS_REGISTRY.find(s => s.id === id);
  },

  /**
   * Obtener skills por categoría
   */
  getByCategory(category: SkillDefinition['category']): SkillDefinition[] {
    return SKILLS_REGISTRY.filter(s => s.category === category);
  },

  /**
   * Detectar skill relevante basado en mensaje
   */
  detectSkill(message: string): SkillDefinition | null {
    const lowerMessage = message.toLowerCase();

    for (const skill of SKILLS_REGISTRY) {
      for (const keyword of skill.keywords) {
        if (lowerMessage.includes(keyword)) {
          return skill;
        }
      }
    }

    return null;
  },

  /**
   * Ejecutar skill
   */
  async execute(skillId: string, params: Record<string, unknown> = {}): Promise<SkillResult> {
    const skill = this.getById(skillId);

    if (!skill) {
      return {
        success: false,
        message: `Skill "${skillId}" no encontrado`,
      };
    }

    return skill.execute(params);
  },

  /**
   * Ejecutar skill detectado automáticamente
   */
  async autoExecute(message: string): Promise<SkillResult | null> {
    const skill = this.detectSkill(message);

    if (!skill) {
      return null;
    }

    // Extraer parámetros del mensaje si es posible
    const params: Record<string, unknown> = {};

    // Detectar si es búsqueda web
    if (skill.id === 'web') {
      const searchMatch = message.match(/busca(?:r)?\s+(.+)/i);
      if (searchMatch) {
        params.query = searchMatch[1];
      }
    }

    // Detectar si es clima
    if (skill.id === 'clima') {
      const ciudadMatch = message.match(/clima\s+(?:en\s+)?(\w+)/i);
      if (ciudadMatch) {
        params.ciudad = ciudadMatch[1];
      }
    }

    return skill.execute(params);
  },
};

export default skillsService;
