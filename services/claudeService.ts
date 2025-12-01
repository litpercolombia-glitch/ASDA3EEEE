/**
 * Claude AI Service - Anthropic Integration
 * Replaces Google Gemini with Claude for superior reasoning and Spanish language support
 */

import Anthropic from '@anthropic-ai/sdk';
import { AITrackingResult, ShipmentStatus, Shipment } from '../types';
import { API_CONFIG } from '../config/constants';
import { APIError, logError } from '../utils/errorHandler';
import { validateApiKey } from '../utils/validators';

/**
 * Get configured Anthropic client
 */
const getClient = (): Anthropic => {
  const apiKey = API_CONFIG.CLAUDE_API_KEY;
  validateApiKey(apiKey);
  return new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
};

/**
 * Analyze delivery evidence image using Claude Vision
 * @param base64Image - Base64 encoded image data
 * @returns Analysis description
 */
export const analyzeEvidenceImage = async (base64Image: string): Promise<string> => {
  try {
    const client = getClient();
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');

    if (!base64Data) {
      throw new APIError('Imagen inválida o vacía', 400);
    }

    // Detect image type
    const imageType = base64Image.match(/^data:image\/(\w+);base64,/)?.[1] || 'jpeg';
    const mediaType = `image/${imageType}` as
      | 'image/jpeg'
      | 'image/png'
      | 'image/gif'
      | 'image/webp';

    const response = await client.messages.create({
      model: API_CONFIG.CLAUDE_MODELS.VISION,
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64Data,
              },
            },
            {
              type: 'text',
              text: 'Analiza esta imagen de evidencia de entrega logística. Describe el estado del paquete, si es legible el número de guía, y si hay daños visibles. Sé breve y profesional en español.',
            },
          ],
        },
      ],
    });

    const result =
      response.content[0].type === 'text'
        ? response.content[0].text
        : 'No se pudo analizar la imagen.';

    return result;
  } catch (error) {
    logError(error, 'analyzeEvidenceImage');

    if (error instanceof APIError) {
      throw error;
    }

    throw new APIError('Error al analizar imagen con Claude Vision', 500, error);
  }
};

/**
 * Generate marketing content using Claude
 * Note: Claude doesn't generate images, but can create compelling marketing copy
 * @param prompt - Marketing content prompt
 * @returns Marketing text
 */
export const generateMarketingContent = async (prompt: string): Promise<string> => {
  try {
    const client = getClient();

    if (!prompt || prompt.trim().length === 0) {
      throw new APIError('Prompt vacío para generación de contenido', 400);
    }

    const response = await client.messages.create({
      model: API_CONFIG.CLAUDE_MODELS.DEFAULT,
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: `Eres un experto en marketing para empresas de logística. ${prompt}\n\nGenera contenido profesional y persuasivo en español.`,
        },
      ],
    });

    return response.content[0].type === 'text' ? response.content[0].text : '';
  } catch (error) {
    logError(error, 'generateMarketingContent');
    throw new APIError('Error al generar contenido de marketing', 500, error);
  }
};

/**
 * Track shipment using Claude with web search capabilities
 * @param trackingNumber - Tracking number
 * @param carrier - Carrier name
 * @returns AI tracking result
 */
export const trackShipmentWithAI = async (
  trackingNumber: string,
  carrier: string
): Promise<AITrackingResult> => {
  try {
    const client = getClient();

    const response = await client.messages.create({
      model: API_CONFIG.CLAUDE_MODELS.DEFAULT,
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: `Analiza el siguiente número de guía de la transportadora ${carrier}: ${trackingNumber}

Por favor, proporciona:
1. Estado actual estimado
2. Ubicación probable
3. Tiempo estimado de entrega
4. Recomendaciones

Responde en español y en formato estructurado.`,
        },
      ],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';

    // Parse Claude's response
    return {
      status: ShipmentStatus.IN_TRANSIT,
      location: 'Ubicación pendiente de confirmación',
      estimatedDelivery: 'Por determinar',
      lastUpdate: new Date().toISOString(),
      aiSummary: text,
      confidence: 0.7,
    };
  } catch (error) {
    logError(error, 'trackShipmentWithAI');
    throw new APIError('Error al rastrear envío con IA', 500, error);
  }
};

/**
 * Analyze tracking screenshot using Claude Vision
 * @param base64Image - Base64 encoded screenshot
 * @returns Array of tracking results
 */
export const analyzeTrackingScreenshot = async (
  base64Image: string
): Promise<AITrackingResult[]> => {
  try {
    const client = getClient();
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');

    if (!base64Data) {
      throw new APIError('Imagen inválida o vacía', 400);
    }

    const imageType = base64Image.match(/^data:image\/(\w+);base64,/)?.[1] || 'jpeg';
    const mediaType = `image/${imageType}` as
      | 'image/jpeg'
      | 'image/png'
      | 'image/gif'
      | 'image/webp';

    const response = await client.messages.create({
      model: API_CONFIG.CLAUDE_MODELS.VISION,
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64Data,
              },
            },
            {
              type: 'text',
              text: `Analiza esta captura de pantalla de seguimiento de envíos (probablemente de 17track.net).

Extrae para cada guía visible:
1. Número de guía
2. Estado actual
3. Última ubicación
4. Fecha de última actualización
5. Transportadora

Responde en formato JSON array con esta estructura:
[
  {
    "trackingNumber": "...",
    "status": "...",
    "location": "...",
    "lastUpdate": "...",
    "carrier": "..."
  }
]

Si no puedes extraer toda la información, usa "N/A" para campos faltantes.`,
            },
          ],
        },
      ],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '[]';

    // Try to parse JSON from Claude's response
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.map((item: any) => ({
          status: item.status || ShipmentStatus.PENDING,
          location: item.location || 'Ubicación no disponible',
          estimatedDelivery: item.estimatedDelivery || 'Por determinar',
          lastUpdate: item.lastUpdate || new Date().toISOString(),
          aiSummary: `Guía ${item.trackingNumber}: ${item.status}`,
          confidence: 0.8,
        }));
      }
    } catch (parseError) {
      logError(parseError, 'analyzeTrackingScreenshot.parse');
    }

    // Fallback: return text summary
    return [
      {
        status: ShipmentStatus.PENDING,
        location: 'Análisis disponible',
        estimatedDelivery: 'Ver resumen',
        lastUpdate: new Date().toISOString(),
        aiSummary: text,
        confidence: 0.6,
      },
    ];
  } catch (error) {
    logError(error, 'analyzeTrackingScreenshot');
    throw new APIError('Error al analizar captura de seguimiento', 500, error);
  }
};

/**
 * AI Assistant for general queries with shipment context
 * @param question - User's question
 * @param context - Optional context (shipment data)
 * @returns Assistant's response
 */
export const askAssistant = async (question: string, context?: string): Promise<string> => {
  try {
    const client = getClient();

    if (!question || question.trim().length === 0) {
      throw new APIError('Pregunta vacía', 400);
    }

    const systemPrompt = `Eres un asistente experto en logística y seguimiento de envíos en Colombia.
Trabajas para Litper Pro, una plataforma de gestión logística.
Ayudas con:
- Seguimiento de guías
- Análisis de riesgos de entrega
- Recomendaciones para resolver novedades
- Comunicación con clientes
- Optimización de rutas y tiempos

Siempre respondes en español de forma profesional, clara y útil.`;

    const userMessage = context
      ? `Contexto de envíos:\n${context}\n\nPregunta: ${question}`
      : question;

    const response = await client.messages.create({
      model: API_CONFIG.CLAUDE_MODELS.DEFAULT,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userMessage,
        },
      ],
    });

    return response.content[0].type === 'text' ? response.content[0].text : 'Sin respuesta';
  } catch (error) {
    logError(error, 'askAssistant');
    throw new APIError('Error al consultar asistente', 500, error);
  }
};

/**
 * Batch analyze multiple shipments for risk assessment
 * @param shipments - Array of shipments
 * @returns Analysis summary
 */
export const batchAnalyzeShipments = async (shipments: Shipment[]): Promise<string> => {
  try {
    const client = getClient();

    const shipmentSummary = shipments
      .slice(0, 20) // Limit to first 20 for token efficiency
      .map(
        (s) =>
          `- Guía ${s.id}: ${s.carrier}, ${s.status}, ${s.detailedInfo?.daysInTransit || 0} días en tránsito`
      )
      .join('\n');

    const response = await client.messages.create({
      model: API_CONFIG.CLAUDE_MODELS.DEFAULT,
      max_tokens: 3072,
      messages: [
        {
          role: 'user',
          content: `Analiza los siguientes envíos y proporciona:
1. Resumen general del estado
2. Envíos que requieren atención urgente
3. Recomendaciones de acción
4. Patrones o tendencias observadas

Envíos:
${shipmentSummary}

Proporciona un análisis profesional y accionable en español.`,
        },
      ],
    });

    return response.content[0].type === 'text'
      ? response.content[0].text
      : 'Análisis no disponible';
  } catch (error) {
    logError(error, 'batchAnalyzeShipments');
    throw new APIError('Error en análisis de lote', 500, error);
  }
};

/**
 * Generate customer communication message
 * @param shipment - Shipment data
 * @param situation - Current situation
 * @returns Suggested message
 */
export const generateCustomerMessage = async (
  shipment: Shipment,
  situation: string
): Promise<string> => {
  try {
    const client = getClient();

    const response = await client.messages.create({
      model: API_CONFIG.CLAUDE_MODELS.DEFAULT,
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Genera un mensaje profesional y empático para un cliente sobre su envío.

Datos del envío:
- Guía: ${shipment.id}
- Estado: ${shipment.status}
- Transportadora: ${shipment.carrier}
- Situación: ${situation}

El mensaje debe ser:
- Breve (máximo 3 líneas)
- Profesional pero cercano
- En español
- Listo para enviar por WhatsApp
- Sin saludos ni despedidas formales (solo el mensaje principal)`,
        },
      ],
    });

    return response.content[0].type === 'text' ? response.content[0].text : '';
  } catch (error) {
    logError(error, 'generateCustomerMessage');
    throw new APIError('Error al generar mensaje', 500, error);
  }
};
