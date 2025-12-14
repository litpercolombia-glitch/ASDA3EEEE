// ============================================
// LITPER - AI RECOMMENDATION ENGINE
// Motor de Recomendaciones Automáticas para Novedades
// ============================================

import Anthropic from '@anthropic-ai/sdk';
import { CarrierName } from '../types';
import {
  LinkedGuide,
  NoveltyRecommendation,
  AIRecommendationResult,
  COORDINADORA_NOVELTIES,
} from '../types/intelligenceModule';
import { CLAUDE_CONFIG } from '../config/constants';

// ============================================
// RECOMMENDATION MATRIX
// Based on Coordinadora/Dropi specifications
// ============================================

const RECOMMENDATION_MATRIX: Record<string, NoveltyRecommendation> = {
  // Coordinadora novelties
  'DIRECCION_INCOMPLETA': {
    noveltyType: 'DIRECCIÓN INCOMPLETA',
    automaticRecommendation: 'Solicitar: Barrio + Punto referencia + Celular alterno',
    whatsappTemplate: `Hola {nombre_cliente} 👋

Tenemos una novedad con tu pedido (Guía: {guia}).

La transportadora nos indica que la dirección está incompleta. Para poder entregarte necesitamos:

📍 Dirección completa con barrio
🏠 Punto de referencia (edificio, conjunto, local)
📱 Celular alterno de contacto

Por favor responde con estos datos para agendar tu entrega lo antes posible. ¡Gracias!`,
    ticketTemplate: `SOLUCIÓN DIRECCIÓN INCOMPLETA
------------------------------------------
Guía: {guia}
Cliente confirma dirección:
{direccion_completa}
Barrio: {barrio}
Punto de referencia: {referencia}
Teléfono alterno: {telefono_alterno}

Favor intentar nueva entrega.`,
    doNot: ['Volver a ofrecer sin nueva dirección', 'Enviar a la misma dirección incompleta'],
  },

  'NO_SE_LOCALIZA_DIRECCION': {
    noveltyType: 'NO SE LOCALIZA DIRECCIÓN DEL DESTINATARIO',
    automaticRecommendation: 'Verificar dirección en Google Maps antes de reenviar',
    whatsappTemplate: `Hola {nombre_cliente} 👋

El mensajero no pudo ubicar la dirección de tu pedido (Guía: {guia}).

Por favor, ayúdanos con:

📍 Dirección exacta verificada
🏠 Referencias claras (cerca de qué queda)
🗺️ Si es posible, envíanos la ubicación de Google Maps

¡Queremos que tu pedido llegue pronto!`,
    ticketTemplate: `SOLUCIÓN DIRECCIÓN NO LOCALIZADA
------------------------------------------
Guía: {guia}
Nueva dirección verificada:
{direccion_completa}
Referencias adicionales: {referencias}
Coordenadas/Link Google Maps: {coordenadas}

Favor validar antes de nuevo intento.`,
    doNot: ['Enviar a la misma dirección', 'No validar con Google Maps'],
  },

  'NO_CONOCEN_DESTINATARIO': {
    noveltyType: 'EN DIRECCIÓN DE ENTREGA NO CONOCEN DESTINATARIO',
    automaticRecommendation: 'Confirmar nombre de quien recibe + documento',
    whatsappTemplate: `Hola {nombre_cliente} 👋

El mensajero visitó la dirección pero nos indicaron que no conocen a {nombre_destinatario}.

Para entregar tu pedido (Guía: {guia}) necesitamos confirmar:

👤 Nombre completo de quien recibirá
🪪 Documento de identidad
📍 Confirmar si la dirección es correcta

¡Gracias por tu ayuda!`,
    ticketTemplate: `SOLUCIÓN NO CONOCEN DESTINATARIO
------------------------------------------
Guía: {guia}
Persona que recibirá: {nombre_receptor}
Documento: {documento}
Dirección confirmada: {direccion}

Favor intentar nueva entrega.`,
    doNot: ['Enviar sin validar datos', 'Usar la misma información'],
  },

  'SOLICITA_OTRA_DIRECCION': {
    noveltyType: 'NO SE ENTREGA, DESTINATARIO SOLICITA OTRA DIRECCIÓN',
    automaticRecommendation: 'Validar nueva dirección + costo adicional si aplica',
    whatsappTemplate: `Hola {nombre_cliente} 👋

Recibimos tu solicitud de cambio de dirección para el pedido (Guía: {guia}).

Por favor confirma la nueva dirección completa:

📍 Dirección nueva
🏘️ Barrio y ciudad
🏠 Referencias

⚠️ Nota: El cambio de dirección puede tener un costo adicional de envío si es a otra ciudad.

¿Confirmas el cambio?`,
    ticketTemplate: `SOLICITUD CAMBIO DE DIRECCIÓN
------------------------------------------
Guía: {guia}
Nueva dirección: {direccion_nueva}
Ciudad: {ciudad}
Barrio: {barrio}

Cliente acepta costo adicional: SI/NO
Valor adicional: {valor_adicional}`,
    doNot: ['Cambiar sin confirmar costo', 'Usar dirección anterior'],
  },

  'NO_CANCELA_RECAUDO': {
    noveltyType: 'NO CANCELA RECAUDO (RCE)',
    automaticRecommendation: 'Confirmar monto exacto + fecha disponibilidad dinero',
    whatsappTemplate: `Hola {nombre_cliente} 👋

El mensajero intentó entregar tu pedido (Guía: {guia}) pero no fue posible completar el pago.

💰 Monto a pagar: {monto} COP

Por favor confirma:
📅 ¿Qué día tendrás el dinero disponible?
💵 Recuerda tener el monto exacto en efectivo

¡Agendaremos tu entrega para ese día!`,
    ticketTemplate: `SOLUCIÓN RECAUDO PENDIENTE
------------------------------------------
Guía: {guia}
Monto a recaudar: {monto}
Cliente confirma disponibilidad: {fecha}
Jornada preferida: {jornada}

Agendar nuevo intento para fecha indicada.`,
    doNot: ['Enviar sin confirmar fecha', 'No validar monto exacto'],
  },

  'SE_VISITA_NO_SE_LOGRA': {
    noveltyType: 'SE VISITA, NO SE LOGRA ENTREGA',
    automaticRecommendation: 'Agendar cita específica: día + jornada (AM/PM)',
    whatsappTemplate: `Hola {nombre_cliente} 👋

El mensajero visitó tu dirección pero no encontró a nadie para recibir el pedido (Guía: {guia}).

Para asegurar la entrega, ayúdanos con:

📅 ¿Qué día te encuentras en casa?
🕐 ¿Mañana o tarde?
📱 ¿Hay alguien más que pueda recibir?

⚠️ Importante: Después de 3 intentos, el paquete se devuelve.

¡Queremos que recibas tu pedido!`,
    ticketTemplate: `CITA PROGRAMADA PARA ENTREGA
------------------------------------------
Guía: {guia}
Día agendado: {fecha}
Jornada: {jornada}
Persona que recibe: {receptor}
Teléfono de contacto: {telefono}

AUTORIZACIÓN TERCER INTENTO: {si_no}`,
    doNot: ['Enviar sin agendar', 'No confirmar disponibilidad'],
  },

  'SOLICITA_INVENTARIO': {
    noveltyType: 'DESTINATARIO SOLICITA INVENTARIO',
    automaticRecommendation: 'Informar política: No se abre antes de pago',
    whatsappTemplate: `Hola {nombre_cliente} 👋

Entendemos que quieres revisar tu pedido (Guía: {guia}) antes de pagar.

⚠️ Por política de la transportadora, los paquetes no pueden abrirse antes del pago.

Sin embargo, te garantizamos:
✅ El producto está sellado de fábrica
✅ Si hay algún problema, tienes derecho a devolución
✅ Puedes contactarnos para cualquier reclamo

¿Aceptas recibir el pedido con estas condiciones?`,
    ticketTemplate: `CLIENTE SOLICITA INVENTARIO
------------------------------------------
Guía: {guia}
Política informada: No se abre antes de pago
Cliente acepta recibir: SI/NO

Si acepta, proceder con entrega normal.`,
    doNot: ['Autorizar apertura antes de pago', 'No informar política'],
  },

  'PEDIDO_CANCELADO': {
    noveltyType: 'PEDIDO CANCELADO',
    automaticRecommendation: 'Validar motivo + ofrecer descuento si aplica',
    whatsappTemplate: `Hola {nombre_cliente} 👋

Nos informan que deseas cancelar tu pedido (Guía: {guia}).

Antes de proceder, ¿podrías contarnos el motivo?
1️⃣ Ya no lo necesito
2️⃣ Encontré mejor precio
3️⃣ Demora en la entrega
4️⃣ Otro motivo

🎁 Si el motivo es el precio, podemos ofrecerte un descuento especial.

¿Qué te parece?`,
    ticketTemplate: `SOLICITUD CANCELACIÓN DE PEDIDO
------------------------------------------
Guía: {guia}
Motivo de cancelación: {motivo}
Se ofreció descuento: SI/NO
Cliente confirma cancelación: SI/NO

Si confirma, proceder con devolución.`,
    doNot: ['Cancelar sin validar', 'No intentar recuperar venta'],
  },

  'ZONA_NO_CUBIERTA': {
    noveltyType: 'SECTOR DE LA POBLACIÓN QUE NO SE CUBRE',
    automaticRecommendation: 'Ofrecer punto Coordinadora más cercano + dirección',
    whatsappTemplate: `Hola {nombre_cliente} 👋

Tu pedido (Guía: {guia}) tiene como destino una zona que la transportadora no cubre directamente (fincas, veredas o zonas rurales).

🏢 La opción más cercana para retirarlo es:

📍 Oficina: {oficina_cercana}
🗺️ Dirección: {direccion_oficina}
🕐 Horario: {horario}

¿Te queda bien recogerlo allí? O si tienes una dirección urbana alternativa, compártela con nosotros.`,
    ticketTemplate: `ZONA NO CUBIERTA - PUNTO ALTERNATIVO
------------------------------------------
Guía: {guia}
Zona original: {zona_original}
Punto Coordinadora ofrecido: {punto}
Dirección alternativa cliente: {direccion_alt}

Proceder según respuesta del cliente.`,
    doNot: ['Enviar a zona no cubierta', 'No ofrecer alternativa'],
  },

  'PUNTO_DROOP': {
    noveltyType: 'EN PUNTO DROOP',
    automaticRecommendation: 'Informar dirección oficina + horario de atención',
    whatsappTemplate: `Hola {nombre_cliente} 👋

Tu pedido (Guía: {guia}) ya está disponible para retiro en oficina.

📍 Oficina: {nombre_oficina}
🗺️ Dirección: {direccion_oficina}
🕐 Horario: {horario}
📄 Documentos: Llevar cédula original

⚠️ Tienes 5 días hábiles para reclamarlo antes de que sea devuelto.

¿Necesitas más información?`,
    ticketTemplate: `PAQUETE EN PUNTO DROOP
------------------------------------------
Guía: {guia}
Punto: {punto}
Dirección: {direccion}
Horario: {horario}
Fecha límite retiro: {fecha_limite}

Cliente informado, esperando retiro.`,
    doNot: ['No informar fecha límite', 'No dar dirección exacta'],
  },
};

// Map of novelty keywords to recommendation keys
const NOVELTY_KEYWORD_MAP: Record<string, string> = {
  'direccion incompleta': 'DIRECCION_INCOMPLETA',
  'incompleta': 'DIRECCION_INCOMPLETA',
  'falta direccion': 'DIRECCION_INCOMPLETA',
  'no se localiza': 'NO_SE_LOCALIZA_DIRECCION',
  'no localiza': 'NO_SE_LOCALIZA_DIRECCION',
  'direccion errada': 'NO_SE_LOCALIZA_DIRECCION',
  'no existe direccion': 'NO_SE_LOCALIZA_DIRECCION',
  'no conocen': 'NO_CONOCEN_DESTINATARIO',
  'desconocen': 'NO_CONOCEN_DESTINATARIO',
  'no reconocen': 'NO_CONOCEN_DESTINATARIO',
  'otra direccion': 'SOLICITA_OTRA_DIRECCION',
  'cambio direccion': 'SOLICITA_OTRA_DIRECCION',
  'no cancela': 'NO_CANCELA_RECAUDO',
  'sin dinero': 'NO_CANCELA_RECAUDO',
  'no tiene efectivo': 'NO_CANCELA_RECAUDO',
  'recaudo': 'NO_CANCELA_RECAUDO',
  'no se logra': 'SE_VISITA_NO_SE_LOGRA',
  'cerrado': 'SE_VISITA_NO_SE_LOGRA',
  'nadie sale': 'SE_VISITA_NO_SE_LOGRA',
  'no contesta': 'SE_VISITA_NO_SE_LOGRA',
  'inventario': 'SOLICITA_INVENTARIO',
  'abrir paquete': 'SOLICITA_INVENTARIO',
  'cancelado': 'PEDIDO_CANCELADO',
  'no quiere': 'PEDIDO_CANCELADO',
  'devolver': 'PEDIDO_CANCELADO',
  'zona no cubierta': 'ZONA_NO_CUBIERTA',
  'zona roja': 'ZONA_NO_CUBIERTA',
  'vereda': 'ZONA_NO_CUBIERTA',
  'finca': 'ZONA_NO_CUBIERTA',
  'punto droop': 'PUNTO_DROOP',
  'reclame en oficina': 'PUNTO_DROOP',
  'disponible para retiro': 'PUNTO_DROOP',
};

// ============================================
// CLAUDE API CLIENT
// ============================================

let anthropicClient: Anthropic | null = null;

const getAnthropicClient = (): Anthropic => {
  if (!anthropicClient) {
    anthropicClient = new Anthropic({
      apiKey: CLAUDE_CONFIG.API_KEY,
      dangerouslyAllowBrowser: true,
    });
  }
  return anthropicClient;
};

// ============================================
// RECOMMENDATION FUNCTIONS
// ============================================

/**
 * Find the best matching recommendation key for a novelty description
 */
const findRecommendationKey = (noveltyDescription: string): string | null => {
  const lowerDesc = noveltyDescription.toLowerCase();

  for (const [keyword, key] of Object.entries(NOVELTY_KEYWORD_MAP)) {
    if (lowerDesc.includes(keyword)) {
      return key;
    }
  }

  return null;
};

/**
 * Fill template variables with guide data
 */
const fillTemplate = (template: string, guide: LinkedGuide, extraData?: Record<string, string>): string => {
  let result = template;

  // Replace standard variables
  const replacements: Record<string, string> = {
    '{guia}': guide.guia,
    '{nombre_cliente}': guide.cliente || 'Cliente',
    '{nombre_destinatario}': guide.cliente || 'Destinatario',
    '{monto}': guide.valorRecaudo?.toLocaleString('es-CO') || '0',
    '{telefono}': guide.telefono || '',
    '{direccion}': guide.ciudadDestino || '',
    ...extraData,
  };

  for (const [key, value] of Object.entries(replacements)) {
    result = result.replace(new RegExp(key, 'g'), value);
  }

  return result;
};

/**
 * Get recommendation from matrix (fallback)
 */
export const getMatrixRecommendation = (
  noveltyDescription: string,
  guide: LinkedGuide
): AIRecommendationResult | null => {
  const key = findRecommendationKey(noveltyDescription);

  if (!key || !RECOMMENDATION_MATRIX[key]) {
    return null;
  }

  const rec = RECOMMENDATION_MATRIX[key];

  return {
    recommendation: rec.automaticRecommendation,
    confidence: 0.85,
    source: 'MATRIX',
    templates: {
      whatsapp: fillTemplate(rec.whatsappTemplate, guide),
      ticket: fillTemplate(rec.ticketTemplate, guide),
    },
    suggestedActions: rec.doNot.map(d => `NO: ${d}`),
    estimatedResolutionTime: '2-4 horas',
  };
};

/**
 * Get AI-powered recommendation using Claude
 */
export const getAIRecommendation = async (
  noveltyDescription: string,
  guide: LinkedGuide,
  context?: string
): Promise<AIRecommendationResult> => {
  // First, try to get from matrix
  const matrixRec = getMatrixRecommendation(noveltyDescription, guide);

  try {
    const client = getAnthropicClient();

    const prompt = `Eres un experto en logística de última milla en Colombia, especializado en la gestión de novedades para empresas de dropshipping que trabajan con transportadoras como Coordinadora, Interrapidísimo y Envía.

CONTEXTO DE LA GUÍA:
- Número de guía: ${guide.guia}
- Transportadora: ${guide.transportadora}
- Ciudad destino: ${guide.ciudadDestino || 'No especificada'}
- Valor del recaudo: ${guide.valorRecaudo ? `$${guide.valorRecaudo.toLocaleString('es-CO')} COP` : 'Sin recaudo'}
- Intentos de entrega: ${guide.intentosEntrega}
- Score de riesgo: ${guide.scoreRiesgo}/100
- Cliente: ${guide.cliente || 'No especificado'}
- Teléfono: ${guide.telefono || 'No disponible'}

NOVEDAD REPORTADA:
"${noveltyDescription}"

${context ? `CONTEXTO ADICIONAL: ${context}` : ''}

${matrixRec ? `RECOMENDACIÓN BASE (de matriz predefinida): ${matrixRec.recommendation}` : ''}

Por favor proporciona:

1. RECOMENDACIÓN ESPECÍFICA: Una recomendación concisa y accionable para resolver esta novedad.

2. MENSAJE WHATSAPP: Un mensaje profesional pero amigable para enviar al cliente, usando emojis apropiados.

3. TICKET PARA TRANSPORTADORA: Un template de ticket para escalar a la transportadora si es necesario.

4. ACCIONES SUGERIDAS: Lista de 3-5 acciones específicas a tomar.

5. QUÉ NO HACER: Lista de errores comunes a evitar.

6. TIEMPO ESTIMADO DE RESOLUCIÓN: Estimación realista.

Responde en formato JSON:
{
  "recommendation": "string",
  "whatsappMessage": "string",
  "ticketTemplate": "string",
  "suggestedActions": ["string"],
  "doNotDo": ["string"],
  "estimatedTime": "string",
  "confidence": number (0-1)
}`;

    const response = await client.messages.create({
      model: CLAUDE_CONFIG.MODELS.HAIKU,
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    });

    const textContent = response.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude');
    }

    // Parse JSON from response
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON from response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      recommendation: parsed.recommendation || matrixRec?.recommendation || 'Contactar al cliente para resolver la novedad',
      confidence: parsed.confidence || 0.9,
      source: 'AI',
      templates: {
        whatsapp: parsed.whatsappMessage || matrixRec?.templates.whatsapp || '',
        ticket: parsed.ticketTemplate || matrixRec?.templates.ticket || '',
        escalation: parsed.ticketTemplate,
      },
      suggestedActions: [
        ...(parsed.suggestedActions || []),
        ...(parsed.doNotDo?.map((d: string) => `NO: ${d}`) || []),
      ],
      estimatedResolutionTime: parsed.estimatedTime || '2-4 horas',
    };

  } catch (error) {
    console.error('Error getting AI recommendation:', error);

    // Fall back to matrix recommendation
    if (matrixRec) {
      return matrixRec;
    }

    // Ultimate fallback
    return {
      recommendation: 'Contactar al cliente para obtener más información sobre la novedad y encontrar una solución.',
      confidence: 0.5,
      source: 'FALLBACK',
      templates: {
        whatsapp: `Hola 👋\n\nTenemos una novedad con tu pedido (Guía: ${guide.guia}). Por favor contáctanos para solucionarlo.\n\n¡Gracias!`,
        ticket: `NOVEDAD PENDIENTE\nGuía: ${guide.guia}\nNovedad: ${noveltyDescription}\n\nRequiere atención.`,
      },
      suggestedActions: [
        'Contactar al cliente por WhatsApp',
        'Verificar información en el sistema de la transportadora',
        'Escalar si no hay respuesta en 24h',
      ],
      estimatedResolutionTime: '4-8 horas',
    };
  }
};

/**
 * Get recommendation (tries AI first, falls back to matrix)
 */
export const getRecommendation = async (
  noveltyDescription: string,
  guide: LinkedGuide,
  useAI: boolean = true,
  context?: string
): Promise<AIRecommendationResult> => {
  if (useAI) {
    return getAIRecommendation(noveltyDescription, guide, context);
  }

  const matrixRec = getMatrixRecommendation(noveltyDescription, guide);
  if (matrixRec) {
    return matrixRec;
  }

  // Fallback
  return {
    recommendation: 'Contactar al cliente para resolver la novedad',
    confidence: 0.3,
    source: 'FALLBACK',
    templates: {
      whatsapp: `Hola, tenemos una novedad con tu pedido (Guía: ${guide.guia}). Por favor contáctanos.`,
      ticket: `Guía: ${guide.guia} - Novedad pendiente de gestión`,
    },
    suggestedActions: ['Contactar cliente', 'Verificar con transportadora'],
    estimatedResolutionTime: 'Por definir',
  };
};

/**
 * Get all available novelty types for dropdown/selection
 */
export const getNoveltyTypes = (): { key: string; label: string; description: string }[] => {
  return Object.entries(RECOMMENDATION_MATRIX).map(([key, rec]) => ({
    key,
    label: rec.noveltyType,
    description: rec.automaticRecommendation,
  }));
};

/**
 * Get quick action buttons for a novelty
 */
export const getQuickActions = (noveltyType: string): {
  label: string;
  action: 'whatsapp' | 'ticket' | 'escalate' | 'resolve';
  icon: string;
}[] => {
  const actions = [
    { label: 'Enviar WhatsApp', action: 'whatsapp' as const, icon: '💬' },
    { label: 'Crear Ticket', action: 'ticket' as const, icon: '📋' },
  ];

  // Add specific actions based on novelty type
  const key = findRecommendationKey(noveltyType);

  if (key === 'PUNTO_DROOP' || key === 'ZONA_NO_CUBIERTA') {
    actions.push({ label: 'Informar Oficina', action: 'escalate' as const, icon: '📍' });
  }

  if (key === 'PEDIDO_CANCELADO') {
    actions.push({ label: 'Ofrecer Descuento', action: 'escalate' as const, icon: '🎁' });
  }

  if (key === 'SE_VISITA_NO_SE_LOGRA') {
    actions.push({ label: 'Agendar Cita', action: 'escalate' as const, icon: '📅' });
  }

  actions.push({ label: 'Marcar Resuelta', action: 'resolve' as const, icon: '✅' });

  return actions;
};

/**
 * Get Coordinadora specific novelty info
 */
export const getCoordinadoraNoveltyInfo = (noveltyType: string): {
  meaning: string;
  resolution: string;
  doNot: string;
  whoResolves: string;
} | null => {
  const novelty = COORDINADORA_NOVELTIES.find(
    n => n.novelty.toLowerCase().includes(noveltyType.toLowerCase()) ||
         noveltyType.toLowerCase().includes(n.novelty.toLowerCase())
  );

  if (!novelty) return null;

  return {
    meaning: novelty.meaning,
    resolution: novelty.resolution,
    doNot: novelty.doNot,
    whoResolves: novelty.whoResolves,
  };
};

/**
 * Batch generate recommendations for multiple guides
 */
export const batchGetRecommendations = async (
  guides: LinkedGuide[],
  useAI: boolean = false
): Promise<Map<string, AIRecommendationResult>> => {
  const results = new Map<string, AIRecommendationResult>();

  for (const guide of guides) {
    // Get the most recent open novelty
    const openNovelty = guide.novedadesRegistradas.find(
      n => n.estado === 'PENDIENTE' || n.estado === 'EN_GESTION'
    );

    if (openNovelty) {
      const rec = await getRecommendation(
        openNovelty.descripcion,
        guide,
        useAI
      );
      results.set(guide.guia, rec);
    }
  }

  return results;
};

/**
 * Generate a summary report of recommendations
 */
export const generateRecommendationSummary = (
  recommendations: Map<string, AIRecommendationResult>
): {
  total: number;
  bySource: Record<string, number>;
  avgConfidence: number;
  commonActions: string[];
} => {
  const values = Array.from(recommendations.values());

  const bySource = values.reduce((acc, rec) => {
    acc[rec.source] = (acc[rec.source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const avgConfidence = values.length > 0
    ? values.reduce((sum, rec) => sum + rec.confidence, 0) / values.length
    : 0;

  // Count action frequency
  const actionCount: Record<string, number> = {};
  values.forEach(rec => {
    rec.suggestedActions.forEach(action => {
      actionCount[action] = (actionCount[action] || 0) + 1;
    });
  });

  const commonActions = Object.entries(actionCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([action]) => action);

  return {
    total: values.length,
    bySource,
    avgConfidence: Math.round(avgConfidence * 100) / 100,
    commonActions,
  };
};
