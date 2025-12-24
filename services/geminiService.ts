import { AITrackingResult, ShipmentStatus, Shipment } from '../types';
import { API_CONFIG } from '../config/constants';
import { APIError, logError } from '../utils/errorHandler';
import { useAIConfigStore } from './aiConfigService';

/**
 * Get Gemini API Key (from config store or env)
 */
const getGeminiApiKey = (): string => {
  // Primero intentar desde el store de configuración
  const storedKey = useAIConfigStore.getState().providers.gemini.apiKey;
  if (storedKey) return storedKey;

  // Fallback a variable de entorno
  return API_CONFIG.GEMINI_API_KEY;
};

/**
 * Analyze delivery evidence image using Gemini Vision
 * @param base64Image - Base64 encoded image data
 * @returns Analysis description
 */
export const analyzeEvidenceImage = async (base64Image: string): Promise<string> => {
  try {
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      throw new APIError('Gemini API Key no configurada', 401);
    }

    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');

    if (!base64Data) {
      throw new APIError('Imagen inválida o vacía', 400);
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${API_CONFIG.GEMINI_MODELS.VISION}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
              { text: 'Analiza esta imagen de evidencia de entrega logística. Describe el estado del paquete, si es legible la guía, y si hay daños visibles. Sé breve y profesional.' }
            ]
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 500,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new APIError(error.error?.message || 'Error en Gemini Vision', response.status);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No se pudo analizar la imagen.';
  } catch (error) {
    logError(error, 'analyzeEvidenceImage');

    if (error instanceof APIError) {
      throw error;
    }

    throw new APIError('Error al analizar imagen con Gemini Vision', 500, error);
  }
};

/**
 * Transcribe audio using Gemini
 * @param base64Audio - Base64 encoded audio data
 * @returns Transcription text
 */
export const transcribeAudio = async (base64Audio: string): Promise<string> => {
  try {
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      throw new APIError('Gemini API Key no configurada', 401);
    }

    if (!base64Audio) {
      throw new APIError('Audio inválido o vacío', 400);
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${API_CONFIG.GEMINI_MODELS.FLASH}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { inlineData: { mimeType: 'audio/wav', data: base64Audio } },
              { text: 'Transcribe este audio de forma literal en español. Solo responde con la transcripción, sin explicaciones adicionales.' }
            ]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new APIError(error.error?.message || 'Error en transcripción', response.status);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  } catch (error) {
    logError(error, 'transcribeAudio');
    throw new APIError('Error en transcripción de audio', 500, error);
  }
};

/**
 * Generate marketing image using Gemini
 * Note: Standard Gemini API doesn't support image generation.
 * This function returns null - image generation requires Imagen API.
 * @param prompt - Image generation prompt
 * @returns null (image generation not available with standard API)
 */
export const generateMarketingImage = async (_prompt: string): Promise<string | null> => {
  // Image generation requires Imagen API, not standard Gemini
  // Returning null gracefully
  console.log('Image generation not available with standard Gemini API');
  return null;
};

// 4. General Assistance with Context and Image Capabilities
export const askAssistant = async (
  query: string,
  shipmentsContext?: Shipment[],
  _location?: GeolocationCoordinates
): Promise<{ text: string; image?: string }> => {
  try {
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      console.warn('Gemini API Key no configurada');
      return { text: '' };
    }

    // Context Injection
    let systemContext = '';
    if (shipmentsContext && shipmentsContext.length > 0) {
      const summary = shipmentsContext
        .slice(0, 50)
        .map(
          (s) =>
            `Guía: ${s.id}, Transportadora: ${s.carrier}, Estado: ${s.status}, Tel: ${s.phone || 'N/A'}`
        )
        .join('\n');
      systemContext = `CONTEXTO DE ENVÍOS ACTUALES (Usa esto para responder si preguntan por guías específicas):\n${summary}\n\n`;
    }

    const fullPrompt = `Eres un asistente experto de 'Litper Logística' en Colombia. Ayuda con rastreo, redacción de mensajes para clientes y gestión de envíos. Responde de forma profesional y concisa en español.\n\n${systemContext}Usuario pregunta: "${query}"`;

    // Use direct REST API call for better browser compatibility
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${API_CONFIG.GEMINI_MODELS.FLASH}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('Gemini API error:', error);
      return { text: '' };
    }

    const data = await response.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Lo siento, no pude procesar eso.';

    // Check for image generation intent from the model's text
    const imageMatch = text.match(/\[GENERAR_IMAGEN:\s*(.*?)\]/);
    let generatedImageUrl = undefined;

    if (imageMatch) {
      const imagePrompt = imageMatch[1];
      text = text.replace(imageMatch[0], '(Generando imagen...)');
      generatedImageUrl = (await generateMarketingImage(imagePrompt)) || undefined;
    }

    return { text, image: generatedImageUrl };
  } catch (error) {
    console.error('Assistant error:', error);
    return { text: '' };
  }
};

// 5. Smart Logistics Tracking
export const trackShipmentWithAI = async (
  carrier: string,
  guideId: string
): Promise<AITrackingResult> => {
  try {
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      return {
        statusSummary: 'Validación Manual Requerida',
        timeElapsed: '-',
        recommendation: 'API Key no configurada. Use 17TRACK para rastrear.',
        lastUpdate: 'Ahora',
      };
    }

    const prompt = `Eres un asistente de logística colombiana experto.

TAREA: Proporciona una guía de rastreo para la guía "${guideId}" de la transportadora "${carrier}".

Basándote en tu conocimiento de transportadoras colombianas (Inter Rapidísimo, Envía, Coordinadora, TCC, Servientrega), responde en formato JSON:

{
  "statusSummary": "Estado sugerido basado en el tipo de transportadora",
  "timeElapsed": "Tiempo estimado típico para esta transportadora",
  "recommendation": "Pasos para rastrear esta guía (incluye URL si conoces el portal de rastreo)",
  "lastUpdate": "Ahora"
}

Responde SOLO el JSON, sin markdown.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${API_CONFIG.GEMINI_MODELS.FLASH}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 500,
          },
        }),
      }
    );

    if (!response.ok) {
      console.error('Gemini tracking API error');
      return {
        statusSummary: 'Validación Manual Requerida',
        timeElapsed: '-',
        recommendation: 'Abrir 17TRACK para validar estado.',
        lastUpdate: 'Ahora',
      };
    }

    const data = await response.json();
    let cleanText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    cleanText = cleanText
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    const result = JSON.parse(cleanText);

    return {
      statusSummary: result.statusSummary || 'Verificación Pendiente',
      timeElapsed: result.timeElapsed || '-',
      recommendation: result.recommendation || 'Consulte directamente en 17TRACK.',
      lastUpdate: result.lastUpdate || 'Reciente',
    };
  } catch (error) {
    console.error('Tracking error:', error);
    return {
      statusSummary: 'Validación Manual Requerida',
      timeElapsed: '-',
      recommendation: 'Intente rastrear manualmente usando el botón de 17TRACK.',
      lastUpdate: 'Ahora',
    };
  }
};

// 6. Bulk Tracking from Screenshot (Gemini Vision)
export const parseTrackingScreenshot = async (
  base64Image: string
): Promise<{ id: string; status: ShipmentStatus; rawStatus: string }[]> => {
  try {
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      console.warn('Gemini API Key no configurada para análisis de imagen');
      return [];
    }

    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');

    const prompt = `Eres un asistente de automatización logística.
Analiza esta captura de pantalla de un sitio de rastreo de envíos (17TRACK).

TAREA:
1. Identifica todos los números de guía visibles.
2. Identifica el estado actual de cada guía (Ej: "Entregado", "En tránsito", "Devuelto", "No encontrado").
3. Mapea el estado visual a uno de estos estados ESTÁNDAR:
   - 'Entregado' (Si dice Delivered, Entregado, Finalizado)
   - 'En Reparto' (Si dice Out for delivery, En reparto)
   - 'En Oficina' (Si dice Available for pickup, En agencia)
   - 'Novedad' (Si dice Failed attempt, Retenido, Devolución)
   - 'Pendiente' (Si dice Not found, Info received, En tránsito)

Responde SOLO con un JSON array, sin markdown:
[{"id": "123456", "status": "Entregado", "rawStatus": "Delivered"}]`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${API_CONFIG.GEMINI_MODELS.VISION}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { inlineData: { mimeType: 'image/png', data: base64Data } },
              { text: prompt }
            ]
          }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!response.ok) {
      console.error('Gemini Vision API error');
      return [];
    }

    const data = await response.json();
    let cleanText = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
    cleanText = cleanText
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    return JSON.parse(cleanText);
  } catch (error) {
    console.error('Screenshot parsing error:', error);
    return [];
  }
};
