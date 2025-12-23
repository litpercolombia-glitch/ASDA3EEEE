// ============================================
// LITPER COMMAND CENTER - CLAUDE AI SERVICE
// Servicio de IA conversacional con Claude
// ============================================

import { guiasService, ciudadesService, alertasService } from './supabaseService';

// ============================================
// CONFIGURACIÓN
// ============================================

const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY || '';
const CLAUDE_MODEL = 'claude-sonnet-4-20250514';
const MAX_TOKENS = 4096;

// ============================================
// TIPOS
// ============================================

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ClaudeResponse {
  content: string;
  artifacts?: Artifact[];
  suggestions?: string[];
  skillUsed?: string;
  tokensUsed?: number;
}

export interface Artifact {
  type: 'chart' | 'table' | 'report' | 'action' | 'alert';
  title: string;
  data: Record<string, unknown>;
  actions?: ArtifactAction[];
}

export interface ArtifactAction {
  label: string;
  action: string;
  params?: Record<string, unknown>;
}

export interface SkillContext {
  guias: Awaited<ReturnType<typeof guiasService.getHoy>>;
  ciudades: Awaited<ReturnType<typeof ciudadesService.getAll>>;
  alertas: Awaited<ReturnType<typeof alertasService.getNoLeidas>>;
  stats: {
    totalGuiasHoy: number;
    entregadas: number;
    enTransito: number;
    novedades: number;
    tasaEntrega: number;
    ventasHoy: number;
  };
}

// ============================================
// SYSTEM PROMPT
// ============================================

const getSystemPrompt = () => `Eres LITPER AI, el asistente inteligente del Centro de Comando de Litper, una empresa de logística en Colombia.

## TU ROL
- Eres experto en logística, envíos y gestión de guías
- Tienes acceso en tiempo real a todos los datos del negocio
- Puedes analizar, recomendar y ejecutar acciones
- Hablas español colombiano de forma profesional pero amigable

## DATOS QUE TIENES ACCESO
- Guías y envíos (estados, ciudades, transportadoras)
- Estadísticas de ciudades (tasa de entrega, semáforo)
- Finanzas (ingresos, gastos, márgenes)
- Alertas y notificaciones
- Historial de cargas

## SKILLS DISPONIBLES
1. **[GUIAS]** - Buscar, analizar y gestionar guías
2. **[CIUDADES]** - Monitorear ciudades, pausar/reanudar envíos
3. **[FINANZAS]** - Analizar ingresos, gastos, márgenes
4. **[REPORTES]** - Generar informes y estadísticas
5. **[ALERTAS]** - Configurar y enviar alertas WhatsApp
6. **[AUTOMATIZAR]** - Crear reglas de automatización

## FORMATO DE RESPUESTAS
- Usa markdown para formatear
- Usa emojis relevantes pero sin exceso
- Para datos usa tablas cuando sea apropiado
- Sé conciso pero completo
- Siempre ofrece acciones siguientes

## CONTEXTO ACTUAL
Fecha: ${new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
Hora: ${new Date().toLocaleTimeString('es-CO')}
`;

// ============================================
// FUNCIONES AUXILIARES
// ============================================

async function getBusinessContext(): Promise<SkillContext> {
  try {
    const [guias, ciudades, alertas] = await Promise.all([
      guiasService.getHoy(),
      ciudadesService.getAll(),
      alertasService.getNoLeidas(),
    ]);

    const entregadas = guias.filter(g => g.estado?.toLowerCase().includes('entregad')).length;
    const enTransito = guias.filter(g => g.estado?.toLowerCase().includes('transito')).length;
    const novedades = guias.filter(g => g.tiene_novedad).length;
    const ventasHoy = guias.reduce((sum, g) => sum + (g.valor_declarado || 0), 0);
    const tasaEntrega = guias.length > 0 ? (entregadas / guias.length) * 100 : 0;

    return {
      guias,
      ciudades,
      alertas,
      stats: {
        totalGuiasHoy: guias.length,
        entregadas,
        enTransito,
        novedades,
        tasaEntrega,
        ventasHoy,
      },
    };
  } catch (error) {
    console.error('Error getting business context:', error);
    return {
      guias: [],
      ciudades: [],
      alertas: [],
      stats: {
        totalGuiasHoy: 0,
        entregadas: 0,
        enTransito: 0,
        novedades: 0,
        tasaEntrega: 0,
        ventasHoy: 0,
      },
    };
  }
}

function formatContextForPrompt(context: SkillContext): string {
  const { stats, ciudades, alertas } = context;

  const ciudadesCriticas = ciudades
    .filter(c => c.tasa_entrega < 70 && c.total_guias > 0)
    .sort((a, b) => a.tasa_entrega - b.tasa_entrega)
    .slice(0, 5);

  return `
## DATOS EN TIEMPO REAL (${new Date().toLocaleTimeString('es-CO')})

### Resumen del Día
- Total guías: ${stats.totalGuiasHoy}
- Entregadas: ${stats.entregadas} (${stats.tasaEntrega.toFixed(1)}%)
- En tránsito: ${stats.enTransito}
- Con novedad: ${stats.novedades}
- Ventas: $${stats.ventasHoy.toLocaleString('es-CO')}

### Alertas Pendientes: ${alertas.length}
${alertas.slice(0, 3).map(a => `- [${a.tipo}] ${a.titulo}`).join('\n') || 'Sin alertas'}

### Ciudades Críticas (${ciudadesCriticas.length})
${ciudadesCriticas.map(c => `- ${c.ciudad}: ${c.tasa_entrega.toFixed(1)}% (${c.total_guias} guías)`).join('\n') || 'Todas las ciudades OK'}
`;
}

function parseArtifacts(content: string): { cleanContent: string; artifacts: Artifact[] } {
  const artifacts: Artifact[] = [];
  const artifactRegex = /```artifact:(\w+):([^\n]+)\n([\s\S]*?)```/g;

  let match;
  let cleanContent = content;

  while ((match = artifactRegex.exec(content)) !== null) {
    const [fullMatch, type, title, dataStr] = match;
    try {
      const data = JSON.parse(dataStr.trim());
      artifacts.push({
        type: type as Artifact['type'],
        title,
        data,
      });
      cleanContent = cleanContent.replace(fullMatch, `📊 **${title}** [Ver abajo]`);
    } catch {
      // Si no es JSON válido, dejarlo como está
    }
  }

  return { cleanContent, artifacts };
}

function generateSuggestions(content: string): string[] {
  const suggestions: string[] = [];

  if (content.toLowerCase().includes('ciudad') || content.toLowerCase().includes('semáforo')) {
    suggestions.push('¿Debería pausar alguna ciudad?');
    suggestions.push('Compara transportadoras por ciudad');
  }

  if (content.toLowerCase().includes('guía') || content.toLowerCase().includes('envío')) {
    suggestions.push('Muestra las guías con más días en tránsito');
    suggestions.push('¿Cuáles guías tienen novedad?');
  }

  if (content.toLowerCase().includes('venta') || content.toLowerCase().includes('ingreso')) {
    suggestions.push('¿Cuál es el ticket promedio?');
    suggestions.push('Compara con el mes anterior');
  }

  if (suggestions.length < 2) {
    suggestions.push('Dame el resumen del día');
    suggestions.push('¿Hay alertas pendientes?');
  }

  return suggestions.slice(0, 3);
}

// ============================================
// SERVICIO PRINCIPAL
// ============================================

export const claudeService = {
  isConfigured(): boolean {
    return !!ANTHROPIC_API_KEY;
  },

  async chat(
    messages: ClaudeMessage[],
    includeContext: boolean = true
  ): Promise<ClaudeResponse> {
    if (!ANTHROPIC_API_KEY) {
      throw new Error('Claude API Key no configurada');
    }

    let contextPrompt = '';
    if (includeContext) {
      const context = await getBusinessContext();
      contextPrompt = formatContextForPrompt(context);
    }

    const fullSystemPrompt = getSystemPrompt() + contextPrompt;

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: CLAUDE_MODEL,
          max_tokens: MAX_TOKENS,
          system: fullSystemPrompt,
          messages: messages.map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Error en la API de Claude');
      }

      const data = await response.json();
      const rawContent = data.content[0]?.text || '';

      const { cleanContent, artifacts } = parseArtifacts(rawContent);

      let skillUsed: string | undefined;
      const skillMatch = rawContent.match(/\[(\w+)\]/);
      if (skillMatch) {
        skillUsed = skillMatch[1].toLowerCase();
      }

      const suggestions = generateSuggestions(rawContent);

      return {
        content: cleanContent,
        artifacts: artifacts.length > 0 ? artifacts : undefined,
        suggestions,
        skillUsed,
        tokensUsed: data.usage?.output_tokens,
      };
    } catch (error) {
      console.error('Error calling Claude API:', error);
      throw error;
    }
  },

  async quickCommand(command: string): Promise<ClaudeResponse> {
    const quickCommands: Record<string, string> = {
      'resumen': '¿Cómo va el día de hoy? Dame un resumen completo.',
      'ciudades': '¿Cuáles ciudades tienen problemas de entrega?',
      'alertas': '¿Hay alertas pendientes? Muéstrame las más importantes.',
      'guias': '¿Cuántas guías llevo hoy y cuál es su estado?',
      'ventas': '¿Cómo van las ventas de hoy?',
      'novedades': 'Analiza las novedades pendientes y recomienda acciones.',
    };

    const prompt = quickCommands[command] || command;
    return this.chat([{ role: 'user', content: prompt }]);
  },

  async analyzeFile(
    fileName: string,
    fileContent: string,
    fileType: string
  ): Promise<ClaudeResponse> {
    const prompt = `He subido un archivo llamado "${fileName}" de tipo ${fileType}.

Contenido del archivo:
\`\`\`
${fileContent.slice(0, 10000)}
\`\`\`
${fileContent.length > 10000 ? '\n(Contenido truncado por tamaño)' : ''}

Por favor:
1. Analiza qué tipo de datos contiene
2. Identifica las columnas/campos relevantes
3. Sugiere qué acciones puedo hacer con estos datos
4. Si son guías, ofrece importarlas
5. Si son finanzas, ofrece analizarlas`;

    return this.chat([{ role: 'user', content: prompt }]);
  },

  async executeAction(
    action: string,
    params: Record<string, unknown>
  ): Promise<{ success: boolean; message: string; data?: unknown }> {
    try {
      switch (action) {
        case 'pausar_ciudad': {
          const ciudadId = params.ciudadId as string;
          await ciudadesService.pausar(ciudadId);
          return { success: true, message: 'Ciudad pausada correctamente' };
        }

        case 'reanudar_ciudad': {
          const ciudadId = params.ciudadId as string;
          await ciudadesService.reanudar(ciudadId);
          return { success: true, message: 'Ciudad reanudada correctamente' };
        }

        case 'crear_alerta': {
          const alerta = await alertasService.create({
            tipo: (params.tipo as 'critica' | 'advertencia' | 'info' | 'exito') || 'info',
            titulo: params.titulo as string,
            mensaje: params.mensaje as string,
            fuente: 'LITPER_AI',
            leida: false,
          });
          return { success: true, message: 'Alerta creada', data: alerta };
        }

        case 'marcar_alertas_leidas': {
          await alertasService.marcarTodasLeidas();
          return { success: true, message: 'Alertas marcadas como leídas' };
        }

        default:
          return { success: false, message: `Acción no reconocida: ${action}` };
      }
    } catch (error) {
      console.error('Error executing action:', error);
      return { success: false, message: `Error ejecutando acción: ${error}` };
    }
  },
};

export default claudeService;
