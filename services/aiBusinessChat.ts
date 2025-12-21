// services/aiBusinessChat.ts
// AI Chat con Business Intelligence - LITPER PRO Enterprise

import { financeServiceEnterprise } from './financeServiceEnterprise';
import { permissionService } from './permissionService';
import { integrationManager } from './integrations/IntegrationManager';
import { EstadoResultados, CategoriaGasto, CATEGORIAS_GASTO } from '../types/finance';

// ==================== TIPOS ====================

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  skillUsed?: string;
  data?: unknown;
  actions?: ChatAction[];
}

export interface ChatAction {
  id: string;
  label: string;
  icon: string;
  action: () => void;
}

export interface BusinessSkill {
  id: string;
  nombre: string;
  descripcion: string;
  categoria: 'finanzas' | 'logistica' | 'reportes' | 'analisis' | 'acciones';
  icono: string;
  triggers: string[];
  ejemplos: string[];
  permisosRequeridos: string[];
  ejecutar: (params: SkillParams) => Promise<SkillResult>;
}

export interface SkillParams {
  query: string;
  periodo?: string;
  contexto?: Record<string, unknown>;
}

export interface SkillResult {
  mensaje: string;
  datos?: unknown;
  grafico?: {
    tipo: 'bar' | 'line' | 'pie' | 'table';
    data: unknown;
  };
  acciones?: ChatAction[];
}

export interface BusinessContext {
  empresa: string;
  pais: string;
  periodoActual: string;
  financiero: EstadoResultados;
  operativo: {
    guiasPendientes: number;
    novedadesAbiertas: number;
    tasaEntrega: number;
  };
  usuario: {
    nombre: string;
    rol: string;
  };
}

// ==================== SKILLS DE NEGOCIO ====================

const BUSINESS_SKILLS: BusinessSkill[] = [
  // === FINANZAS ===
  {
    id: 'consulta_pyg',
    nombre: 'Consultar P&G',
    descripcion: 'Consulta el Estado de Pérdidas y Ganancias',
    categoria: 'finanzas',
    icono: '📊',
    triggers: ['perdidas', 'ganancias', 'utilidad', 'margen', 'cuanto gane', 'pyg', 'p&g', 'estado de resultados'],
    ejemplos: ['¿Cuánto gané este mes?', '¿Cuál es mi margen neto?', 'Estado de resultados de noviembre'],
    permisosRequeridos: ['finanzas.verPyG'],
    ejecutar: async (params) => {
      const periodo = params.periodo || new Date().toISOString().substring(0, 7);
      const pyg = financeServiceEnterprise.calcularEstadoResultados(periodo);

      const nombreMes = new Date(periodo + '-01').toLocaleDateString('es', { month: 'long', year: 'numeric' });

      let mensaje = `📊 **Estado de Resultados - ${nombreMes}**\n\n`;
      mensaje += `💰 **Ventas Netas:** $${pyg.ventasNetas.toLocaleString()}\n`;
      mensaje += `📈 **Utilidad Bruta:** $${pyg.utilidadBruta.toLocaleString()} (${pyg.margenBruto.toFixed(1)}%)\n`;
      mensaje += `💵 **Utilidad Neta:** $${pyg.utilidadNeta.toLocaleString()} (${pyg.margenNeto.toFixed(1)}%)\n\n`;

      if (pyg.vsAnterior.ventasNetas !== 0) {
        const tendencia = pyg.vsAnterior.utilidadNeta > 0 ? '📈' : '📉';
        mensaje += `${tendencia} **vs Mes Anterior:** ${pyg.vsAnterior.utilidadNeta > 0 ? '+' : ''}${pyg.vsAnterior.utilidadNeta.toFixed(1)}% en utilidad\n`;
      }

      if (pyg.roas > 0) {
        mensaje += `\n📢 **ROAS:** ${pyg.roas.toFixed(2)}x`;
      }

      return {
        mensaje,
        datos: pyg,
        grafico: {
          tipo: 'bar',
          data: {
            labels: ['Ventas', 'Costo Ventas', 'Gastos Op.', 'Utilidad Neta'],
            values: [pyg.ventasNetas, pyg.totalCostoVentas, pyg.totalGastosOperativos, pyg.utilidadNeta],
          },
        },
      };
    },
  },
  {
    id: 'analisis_gastos',
    nombre: 'Analizar Gastos',
    descripcion: 'Desglose detallado de gastos por categoría',
    categoria: 'finanzas',
    icono: '💸',
    triggers: ['gastos', 'donde gasto', 'reducir costos', 'categorias', 'desglose'],
    ejemplos: ['¿En qué estoy gastando más?', '¿Cuánto gasté en publicidad?', 'Desglose de gastos'],
    permisosRequeridos: ['finanzas.verGastos'],
    ejecutar: async (params) => {
      const periodo = params.periodo || new Date().toISOString().substring(0, 7);
      const gastosPorCategoria = financeServiceEnterprise.getGastosPorCategoria(periodo);
      const totalGastos = Object.values(gastosPorCategoria).reduce((a, b) => a + b, 0);

      const nombreMes = new Date(periodo + '-01').toLocaleDateString('es', { month: 'long', year: 'numeric' });

      let mensaje = `💸 **Desglose de Gastos - ${nombreMes}**\n\n`;
      mensaje += `📊 **Total Gastos:** $${totalGastos.toLocaleString()}\n\n`;

      const categoriasSorted = Object.entries(gastosPorCategoria)
        .filter(([_, monto]) => monto > 0)
        .sort(([, a], [, b]) => b - a);

      categoriasSorted.forEach(([cat, monto]) => {
        const info = CATEGORIAS_GASTO[cat as CategoriaGasto];
        const porcentaje = totalGastos > 0 ? ((monto / totalGastos) * 100).toFixed(1) : 0;
        mensaje += `${info.icono} **${info.nombre}:** $${monto.toLocaleString()} (${porcentaje}%)\n`;
      });

      // Alertas
      const pyg = financeServiceEnterprise.calcularEstadoResultados(periodo);
      if (gastosPorCategoria.publicidad > pyg.ventasNetas * 0.15) {
        mensaje += `\n⚠️ **Alerta:** Gastos de publicidad superan el 15% de ventas`;
      }

      return {
        mensaje,
        datos: gastosPorCategoria,
        grafico: {
          tipo: 'pie',
          data: {
            labels: categoriasSorted.map(([cat]) => CATEGORIAS_GASTO[cat as CategoriaGasto].nombre),
            values: categoriasSorted.map(([, monto]) => monto),
          },
        },
      };
    },
  },
  {
    id: 'tendencia_ventas',
    nombre: 'Tendencia de Ventas',
    descripcion: 'Análisis de tendencia histórica de ventas',
    categoria: 'finanzas',
    icono: '📈',
    triggers: ['tendencia', 'historico', 'crecimiento', 'evolucion', 'ultimos meses'],
    ejemplos: ['¿Cómo van las ventas?', 'Tendencia de los últimos 6 meses', '¿Estoy creciendo?'],
    permisosRequeridos: ['finanzas.verIngresos'],
    ejecutar: async (params) => {
      const tendencia = financeServiceEnterprise.getTendenciaHistorica(6);

      let mensaje = `📈 **Tendencia de Últimos 6 Meses**\n\n`;

      tendencia.forEach((mes, index) => {
        const nombreMes = new Date(mes.periodo + '-01').toLocaleDateString('es', { month: 'short' });
        const cambio = index > 0 ? ((mes.ventas - tendencia[index - 1].ventas) / (tendencia[index - 1].ventas || 1)) * 100 : 0;
        const emoji = cambio > 5 ? '🟢' : cambio < -5 ? '🔴' : '🟡';

        mensaje += `${emoji} **${nombreMes}:** $${mes.ventas.toLocaleString()} `;
        if (index > 0 && cambio !== 0) {
          mensaje += `(${cambio > 0 ? '+' : ''}${cambio.toFixed(1)}%)`;
        }
        mensaje += '\n';
      });

      // Calcular crecimiento total
      const primero = tendencia[0]?.ventas || 0;
      const ultimo = tendencia[tendencia.length - 1]?.ventas || 0;
      const crecimientoTotal = primero > 0 ? ((ultimo - primero) / primero) * 100 : 0;

      mensaje += `\n📊 **Crecimiento 6 meses:** ${crecimientoTotal > 0 ? '+' : ''}${crecimientoTotal.toFixed(1)}%`;

      return {
        mensaje,
        datos: tendencia,
        grafico: {
          tipo: 'line',
          data: {
            labels: tendencia.map((m) => m.periodo),
            values: tendencia.map((m) => m.ventas),
          },
        },
      };
    },
  },

  // === LOGÍSTICA ===
  {
    id: 'estado_envios',
    nombre: 'Estado de Envíos',
    descripcion: 'Resumen del estado de envíos y guías',
    categoria: 'logistica',
    icono: '📦',
    triggers: ['envios', 'guias', 'pendientes', 'entregas', 'logistica', 'paquetes'],
    ejemplos: ['¿Cuántas guías pendientes hay?', 'Estado de entregas', '¿Cómo va la logística?'],
    permisosRequeridos: ['semaforo.acceso'],
    ejecutar: async () => {
      // Obtener datos de localStorage (shipments)
      const shipmentsRaw = localStorage.getItem('shipments');
      const shipments = shipmentsRaw ? JSON.parse(shipmentsRaw) : [];

      const total = shipments.length;
      const entregados = shipments.filter((s: any) => s.status === 'delivered').length;
      const enTransito = shipments.filter((s: any) => s.status === 'in_transit').length;
      const pendientes = shipments.filter((s: any) => s.status === 'pending').length;
      const problemas = shipments.filter((s: any) => ['exception', 'returned'].includes(s.status)).length;

      const tasaEntrega = total > 0 ? ((entregados / total) * 100).toFixed(1) : 0;

      let mensaje = `📦 **Estado de Envíos**\n\n`;
      mensaje += `📊 **Total Guías:** ${total}\n`;
      mensaje += `✅ **Entregados:** ${entregados} (${tasaEntrega}%)\n`;
      mensaje += `🚚 **En Tránsito:** ${enTransito}\n`;
      mensaje += `⏳ **Pendientes:** ${pendientes}\n`;

      if (problemas > 0) {
        mensaje += `\n⚠️ **Con Problemas:** ${problemas}`;
      }

      return {
        mensaje,
        datos: { total, entregados, enTransito, pendientes, problemas, tasaEntrega },
        grafico: {
          tipo: 'pie',
          data: {
            labels: ['Entregados', 'En Tránsito', 'Pendientes', 'Problemas'],
            values: [entregados, enTransito, pendientes, problemas],
          },
        },
      };
    },
  },

  // === REPORTES ===
  {
    id: 'resumen_ejecutivo',
    nombre: 'Resumen Ejecutivo',
    descripcion: 'Resumen completo del negocio',
    categoria: 'reportes',
    icono: '📋',
    triggers: ['resumen', 'ejecutivo', 'overview', 'general', 'todo', 'negocio'],
    ejemplos: ['Dame un resumen del negocio', '¿Cómo va todo?', 'Resumen ejecutivo'],
    permisosRequeridos: ['dashboard.ver'],
    ejecutar: async () => {
      const periodo = new Date().toISOString().substring(0, 7);
      const resumen = financeServiceEnterprise.getResumenFinanciero(periodo);
      const nombreMes = new Date(periodo + '-01').toLocaleDateString('es', { month: 'long', year: 'numeric' });

      let mensaje = `📋 **Resumen Ejecutivo - ${nombreMes}**\n\n`;

      // Financiero
      mensaje += `💰 **FINANCIERO**\n`;
      mensaje += `   Ventas: $${resumen.ventasNetas.toLocaleString()}\n`;
      mensaje += `   Utilidad: $${resumen.utilidadNeta.toLocaleString()}\n`;
      mensaje += `   Margen: ${resumen.margenNeto.toFixed(1)}%\n`;
      mensaje += `   ROAS: ${resumen.roas.toFixed(2)}x\n\n`;

      // Operativo
      mensaje += `📦 **OPERATIVO**\n`;
      mensaje += `   Órdenes: ${resumen.totalOrdenes}\n`;
      mensaje += `   Ticket Promedio: $${resumen.ticketPromedio.toLocaleString()}\n\n`;

      // Tendencias
      const tendenciaVentas = resumen.tendencia.ventas === 'up' ? '📈' : resumen.tendencia.ventas === 'down' ? '📉' : '➡️';
      mensaje += `${tendenciaVentas} **Tendencia Ventas:** ${resumen.cambioVsMesAnterior.ventas > 0 ? '+' : ''}${resumen.cambioVsMesAnterior.ventas.toFixed(1)}% vs mes anterior\n`;

      // Alertas
      if (resumen.alertas.length > 0) {
        mensaje += `\n⚠️ **ALERTAS:**\n`;
        resumen.alertas.forEach((alerta) => {
          const icon = alerta.tipo === 'danger' ? '🔴' : alerta.tipo === 'warning' ? '🟡' : '🔵';
          mensaje += `   ${icon} ${alerta.mensaje}\n`;
        });
      }

      return {
        mensaje,
        datos: resumen,
      };
    },
  },

  // === ACCIONES ===
  {
    id: 'registrar_gasto',
    nombre: 'Registrar Gasto',
    descripcion: 'Registra un nuevo gasto en el sistema',
    categoria: 'acciones',
    icono: '➕',
    triggers: ['registrar gasto', 'agregar gasto', 'nuevo gasto', 'añadir gasto'],
    ejemplos: ['Registrar gasto de $500,000 en publicidad', 'Agregar pago de nómina $2,000,000'],
    permisosRequeridos: ['finanzas.crearGastos'],
    ejecutar: async (params) => {
      // Parsear el query para extraer monto y categoría
      const montoMatch = params.query.match(/\$?([\d,\.]+)/);
      const monto = montoMatch ? parseFloat(montoMatch[1].replace(/,/g, '')) : 0;

      // Detectar categoría
      let categoria: CategoriaGasto = 'otros';
      const queryLower = params.query.toLowerCase();

      if (queryLower.includes('publicidad') || queryLower.includes('ads') || queryLower.includes('facebook') || queryLower.includes('google')) {
        categoria = 'publicidad';
      } else if (queryLower.includes('nomina') || queryLower.includes('salario') || queryLower.includes('sueldo')) {
        categoria = 'nomina';
      } else if (queryLower.includes('plataforma') || queryLower.includes('software') || queryLower.includes('shopify')) {
        categoria = 'plataformas';
      } else if (queryLower.includes('envio') || queryLower.includes('logistica') || queryLower.includes('transporte')) {
        categoria = 'logistica';
      }

      if (monto > 0) {
        const gasto = financeServiceEnterprise.crearGasto({
          categoria,
          subcategoria: '',
          descripcion: params.query,
          monto,
          tipoGasto: 'variable',
          deducible: false,
          esRecurrente: false,
          tieneComprobante: false,
          fecha: new Date().toISOString().split('T')[0],
        });

        return {
          mensaje: `✅ **Gasto Registrado**\n\n💵 **Monto:** $${monto.toLocaleString()}\n📂 **Categoría:** ${CATEGORIAS_GASTO[categoria].nombre}\n🆔 **ID:** ${gasto.id}`,
          datos: gasto,
        };
      }

      return {
        mensaje: `❌ No pude detectar el monto del gasto. Por favor especifica el monto, por ejemplo:\n\n"Registrar gasto de $500,000 en publicidad"`,
      };
    },
  },
  {
    id: 'buscar_archivo',
    nombre: 'Buscar Archivo',
    descripcion: 'Busca el origen de un registro financiero',
    categoria: 'acciones',
    icono: '🔍',
    triggers: ['buscar archivo', 'de donde', 'origen', 'excel', 'importado'],
    ejemplos: ['¿De dónde salió el ingreso del día 15?', 'Buscar archivo de gastos'],
    permisosRequeridos: ['finanzas.verHistorialCompleto'],
    ejecutar: async () => {
      const archivos = financeServiceEnterprise.getArchivos();

      if (archivos.length === 0) {
        return {
          mensaje: `📁 No hay archivos importados en el sistema.`,
        };
      }

      let mensaje = `📁 **Archivos Importados**\n\n`;

      archivos.slice(0, 10).forEach((archivo) => {
        const fecha = new Date(archivo.fechaSubida).toLocaleDateString('es');
        mensaje += `📄 **${archivo.nombre}**\n`;
        mensaje += `   Tipo: ${archivo.tipo} | Registros: ${archivo.registrosImportados}\n`;
        mensaje += `   Monto: $${archivo.montoTotal.toLocaleString()} | Fecha: ${fecha}\n`;
        mensaje += `   Subido por: ${archivo.subidoPor}\n\n`;
      });

      return {
        mensaje,
        datos: archivos,
      };
    },
  },
];

// ==================== AI BUSINESS CHAT SERVICE ====================

class AIBusinessChatService {
  private conversacion: ChatMessage[] = [];
  private contexto: BusinessContext | null = null;
  private listeners: Set<(messages: ChatMessage[]) => void> = new Set();

  constructor() {
    this.loadConversacion();
    this.actualizarContexto();
  }

  private loadConversacion(): void {
    try {
      const saved = localStorage.getItem('litper_ai_chat');
      if (saved) {
        const data = JSON.parse(saved);
        this.conversacion = data.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp),
        }));
      }
    } catch (error) {
      console.error('[AIBusinessChat] Error cargando conversación:', error);
    }
  }

  private saveConversacion(): void {
    // Mantener solo los últimos 100 mensajes
    const mensajesToSave = this.conversacion.slice(-100);
    localStorage.setItem('litper_ai_chat', JSON.stringify(mensajesToSave));
  }

  private actualizarContexto(): void {
    const usuario = permissionService.getUsuarioActual();
    const periodo = new Date().toISOString().substring(0, 7);
    const pyg = financeServiceEnterprise.calcularEstadoResultados(periodo);

    this.contexto = {
      empresa: 'LITPER',
      pais: 'CO',
      periodoActual: periodo,
      financiero: pyg,
      operativo: {
        guiasPendientes: 0,
        novedadesAbiertas: 0,
        tasaEntrega: 95,
      },
      usuario: {
        nombre: usuario?.nombre || 'Usuario',
        rol: usuario?.rolId || 'viewer',
      },
    };
  }

  // ==================== CHAT ====================

  /**
   * Enviar mensaje al chat
   */
  async enviarMensaje(texto: string): Promise<ChatMessage> {
    this.actualizarContexto();

    // Agregar mensaje del usuario
    const mensajeUsuario: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: texto,
      timestamp: new Date(),
    };
    this.conversacion.push(mensajeUsuario);

    // Detectar skill apropiado
    const skill = this.detectarSkill(texto);

    let respuesta: ChatMessage;

    if (skill) {
      // Verificar permisos
      const tienePermisos = this.verificarPermisos(skill);

      if (!tienePermisos) {
        respuesta = {
          id: `msg_${Date.now() + 1}`,
          role: 'assistant',
          content: `❌ No tienes permisos para realizar esta acción.\n\nSe requiere: ${skill.permisosRequeridos.join(', ')}`,
          timestamp: new Date(),
        };
      } else {
        // Ejecutar skill
        const resultado = await skill.ejecutar({
          query: texto,
          periodo: this.contexto?.periodoActual,
          contexto: this.contexto as unknown as Record<string, unknown>,
        });

        respuesta = {
          id: `msg_${Date.now() + 1}`,
          role: 'assistant',
          content: resultado.mensaje,
          timestamp: new Date(),
          skillUsed: skill.id,
          data: resultado.datos,
          actions: resultado.acciones,
        };
      }
    } else {
      // Respuesta por defecto usando IA
      respuesta = await this.generarRespuestaIA(texto);
    }

    this.conversacion.push(respuesta);
    this.saveConversacion();
    this.notifyListeners();

    return respuesta;
  }

  /**
   * Detectar skill apropiado basado en el mensaje
   */
  private detectarSkill(texto: string): BusinessSkill | null {
    const textoLower = texto.toLowerCase();

    for (const skill of BUSINESS_SKILLS) {
      for (const trigger of skill.triggers) {
        if (textoLower.includes(trigger.toLowerCase())) {
          return skill;
        }
      }
    }

    return null;
  }

  /**
   * Verificar si el usuario tiene permisos para el skill
   */
  private verificarPermisos(skill: BusinessSkill): boolean {
    if (permissionService.esSuperAdmin()) return true;

    for (const permiso of skill.permisosRequeridos) {
      const [modulo, accion] = permiso.split('.');
      if (!permissionService.tienePermiso(modulo as any, accion)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Generar respuesta usando IA externa
   */
  private async generarRespuestaIA(texto: string): Promise<ChatMessage> {
    try {
      // Intentar usar integración de IA
      if (integrationManager.hasAnyProvider()) {
        const respuesta = await integrationManager.chat([
          {
            role: 'system',
            content: `Eres el asistente de negocio de LITPER PRO. Tienes acceso a los siguientes datos del negocio:
            - Ventas del mes: $${this.contexto?.financiero.ventasNetas.toLocaleString() || 0}
            - Utilidad neta: $${this.contexto?.financiero.utilidadNeta.toLocaleString() || 0}
            - Margen neto: ${this.contexto?.financiero.margenNeto.toFixed(1) || 0}%

            Responde de manera concisa y útil sobre temas de negocio, finanzas y logística.`,
            timestamp: new Date(),
          },
          {
            role: 'user',
            content: texto,
            timestamp: new Date(),
          },
        ]);

        return {
          id: `msg_${Date.now() + 1}`,
          role: 'assistant',
          content: respuesta.content,
          timestamp: new Date(),
        };
      }
    } catch (error) {
      console.error('[AIBusinessChat] Error con IA:', error);
    }

    // Respuesta por defecto si no hay IA disponible
    return {
      id: `msg_${Date.now() + 1}`,
      role: 'assistant',
      content: this.generarRespuestaLocal(texto),
      timestamp: new Date(),
    };
  }

  /**
   * Generar respuesta local sin IA
   */
  private generarRespuestaLocal(texto: string): string {
    const textoLower = texto.toLowerCase();

    if (textoLower.includes('hola') || textoLower.includes('buenos')) {
      return `¡Hola ${this.contexto?.usuario.nombre}! 👋\n\nSoy tu asistente de negocio. Puedo ayudarte con:\n\n📊 **Finanzas:** "¿Cuánto gané este mes?"\n📦 **Logística:** "Estado de envíos"\n📈 **Análisis:** "Tendencia de ventas"\n➕ **Acciones:** "Registrar gasto"\n\n¿En qué puedo ayudarte?`;
    }

    if (textoLower.includes('ayuda') || textoLower.includes('que puedes')) {
      return `Puedo ayudarte con:\n\n**FINANZAS:**\n- Estado de Pérdidas y Ganancias\n- Desglose de gastos\n- Tendencia de ventas\n\n**LOGÍSTICA:**\n- Estado de envíos\n- Guías pendientes\n\n**ACCIONES:**\n- Registrar gastos\n- Buscar archivos\n\nPrueba preguntar: "¿Cuánto gané este mes?"`;
    }

    return `No estoy seguro de cómo ayudarte con eso. 🤔\n\nPrueba preguntar:\n- "¿Cuánto gané este mes?"\n- "Desglose de gastos"\n- "Estado de envíos"\n- "Resumen ejecutivo"`;
  }

  // ==================== CONVERSACIÓN ====================

  /**
   * Obtener conversación
   */
  getConversacion(): ChatMessage[] {
    return [...this.conversacion];
  }

  /**
   * Limpiar conversación
   */
  limpiarConversacion(): void {
    this.conversacion = [];
    this.saveConversacion();
    this.notifyListeners();
  }

  /**
   * Obtener skills disponibles
   */
  getSkills(): BusinessSkill[] {
    return BUSINESS_SKILLS.filter((skill) => this.verificarPermisos(skill));
  }

  /**
   * Obtener ejemplos de preguntas
   */
  getEjemplos(): string[] {
    const skills = this.getSkills();
    const ejemplos: string[] = [];

    skills.forEach((skill) => {
      ejemplos.push(...skill.ejemplos.slice(0, 1));
    });

    return ejemplos.slice(0, 8);
  }

  // ==================== SUBSCRIPCIONES ====================

  subscribe(listener: (messages: ChatMessage[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.conversacion));
  }
}

// Singleton
export const aiBusinessChat = new AIBusinessChatService();
export default aiBusinessChat;
