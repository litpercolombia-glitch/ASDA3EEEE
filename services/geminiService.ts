import { GoogleGenAI, Type } from '@google/genai';
import { AITrackingResult, ShipmentStatus, Shipment } from '../types';
import { API_CONFIG } from '../config/constants';
import { APIError, logError } from '../utils/errorHandler';
import { validateApiKey } from '../utils/validators';
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
 * Get configured GoogleGenAI instance
 */
const getAI = (): GoogleGenAI => {
  const apiKey = getGeminiApiKey();
  validateApiKey(apiKey);
  return new GoogleGenAI({ apiKey });
};

/**
 * Analyze delivery evidence image using Gemini Vision
 * @param base64Image - Base64 encoded image data
 * @returns Analysis description
 */
export const analyzeEvidenceImage = async (base64Image: string): Promise<string> => {
  try {
    const ai = getAI();
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');

    if (!base64Data) {
      throw new APIError('Imagen inválida o vacía', 400);
    }

    const response = await ai.models.generateContent({
      model: API_CONFIG.GEMINI_MODELS.VISION,
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
          {
            text: 'Analiza esta imagen de evidencia de entrega logística. Describe el estado del paquete, si es legible la guía, y si hay daños visibles. Sé breve y profesional.',
          },
        ],
      },
    });

    const result = response.text || 'No se pudo analizar la imagen.';
    return result;
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
    const ai = getAI();

    if (!base64Audio) {
      throw new APIError('Audio inválido o vacío', 400);
    }

    const response = await ai.models.generateContent({
      model: API_CONFIG.GEMINI_MODELS.FLASH,
      contents: {
        parts: [
          { inlineData: { mimeType: 'audio/wav', data: base64Audio } },
          { text: 'Transcribe this audio strictly verbatim.' },
        ],
      },
    });

    return response.text || '';
  } catch (error) {
    logError(error, 'transcribeAudio');
    throw new APIError('Error en transcripción de audio', 500, error);
  }
};

/**
 * Generate marketing image using Gemini
 * @param prompt - Image generation prompt
 * @returns Base64 encoded image or null
 */
export const generateMarketingImage = async (prompt: string): Promise<string | null> => {
  try {
    const ai = getAI();

    if (!prompt || prompt.trim().length === 0) {
      throw new APIError('Prompt vacío para generación de imagen', 400);
    }

    const response = await ai.models.generateContent({
      model: API_CONFIG.GEMINI_MODELS.IMAGE,
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: '1:1',
          imageSize: '1K',
        },
      },
    });

    // Loop through parts to find the image
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }

    return null;
  } catch (error) {
    logError(error, 'generateMarketingImage');
    return null;
  }
};

// 4. General Assistance with Context and Image Capabilities
export const askAssistant = async (
  query: string,
  shipmentsContext?: Shipment[],
  location?: GeolocationCoordinates
): Promise<{ text: string; image?: string }> => {
  try {
    const ai = getAI();

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

    const fullPrompt = `${systemContext}Usuario pregunta: "${query}"`;

    let toolConfig = undefined;
    let tools = undefined;

    // Use Maps Grounding if the query asks about location
    if (
      query.toLowerCase().includes('donde') ||
      query.toLowerCase().includes('ubicacion') ||
      query.toLowerCase().includes('oficina')
    ) {
      tools = [{ googleMaps: {} }];
      if (location) {
        toolConfig = {
          retrievalConfig: {
            latLng: {
              latitude: location.latitude,
              longitude: location.longitude,
            },
          },
        };
      }
    } else {
      // Use Search Grounding for other queries
      tools = [{ googleSearch: {} }];
    }

    const response = await ai.models.generateContent({
      model: API_CONFIG.GEMINI_MODELS.PRO,
      contents: fullPrompt,
      config: {
        tools: tools,
        toolConfig: toolConfig,
        systemInstruction:
          "Eres un asistente experto de 'Litper Logística'. Ayuda con rastreo, redacción de mensajes para clientes y ubicación de oficinas. Si el usuario pide crear o generar una imagen, indica en tu respuesta '[GENERAR_IMAGEN: descripción detallada]'.",
      },
    });

    let text = response.text || 'Lo siento, no pude procesar eso.';

    // Check for grounding chunks to append links
    const grounding = response.candidates?.[0]?.groundingMetadata;
    if (grounding?.groundingChunks) {
      const links = grounding.groundingChunks
        .map((c: any) => c.web?.uri || c.maps?.uri)
        .filter(Boolean);
      if (links.length > 0) {
        text += `\n\nFuentes:\n${links.join('\n')}`;
      }
    }

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
    return { text: 'Error consultando al asistente Gemini.' };
  }
};

// 5. Smart Logistics Tracking (Gemini 2.5 Flash with Search)
export const trackShipmentWithAI = async (
  carrier: string,
  guideId: string
): Promise<AITrackingResult> => {
  try {
    const ai = getAI();

    const prompt = `
            ACTÚA COMO UN ANALISTA DE LOGÍSTICA SENIOR DE "LITPER LOGÍSTICA".
            
            TAREA: Investigar el estado real de la guía "${guideId}" de la transportadora "${carrier}".
            
            PROCEDIMIENTO DE INVESTIGACIÓN:
            1. Usa Google Search para buscar "rastreo ${carrier} ${guideId}" o "estado guía ${guideId}".
            2. Analiza los fragmentos de búsqueda (snippets) buscando palabras clave de estado como: "Entregado", "En Camino", "En Reparto", "Novedad".
            
            MANEJO DE SEGURIDAD Y 17TRACK:
            - Si los resultados son páginas de login, CAPTCHA, o "rastreo oficial", ES NORMAL.
            - NO INVENTES UN ESTADO.
            - Si no hay información pública clara en los snippets de Google, marca el estado como "Requiere Validación Manual".
            
            FORMATO DE RESPUESTA JSON (ESTRICTO):
            {
                "statusSummary": "Estado corto (Máx 4 palabras). Ej: 'Entregado', 'En Tránsito', 'Validación Manual Requerida'",
                "timeElapsed": "Tiempo transcurrido o 'Desconocido'",
                "recommendation": "Acción sugerida. Si requiere validación, di: 'Abrir 17TRACK para validar estado.'",
                "lastUpdate": "Fecha encontrada o 'Hoy'"
            }
        `;

    const response = await ai.models.generateContent({
      model: API_CONFIG.GEMINI_MODELS.PRO,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: 'application/json',
      },
    });

    let cleanText = response.text || '{}';
    // CRITICAL FIX: Clean markdown wrappers often returned by LLMs
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
      statusSummary: 'Error Conexión IA',
      timeElapsed: '-',
      recommendation: 'Intente rastrear manualmente usando el botón de 17TRACK.',
      lastUpdate: 'Ahora',
    };
  }
};

// 6. Bulk Tracking from Screenshot (Gemini 3 Pro Vision)
export const parseTrackingScreenshot = async (
  base64Image: string
): Promise<{ id: string; status: ShipmentStatus; rawStatus: string }[]> => {
  try {
    const ai = getAI();
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');

    const prompt = `
            Eres un asistente de automatización logística.
            Analiza esta captura de pantalla de un sitio de rastreo de envíos (17TRACK).
            
            TAREA:
            1. Identifica todos los números de guía visibles.
            2. Identifica el estado actual de cada guía (Ej: "Entregado", "En tránsito", "Devuelto", "No encontrado").
            3. Mapea el estado visual a uno de estos estados ESTÁNDAR:
               - 'Entregado' (Si dice Delivered, Entregado, Finalizado, Entregado al destinatario)
               - 'En Reparto' (Si dice Out for delivery, En reparto, En distribución, En manos del mensajero)
               - 'En Oficina' (Si dice Available for pickup, En agencia, En bodega, Listo para retirar)
               - 'Novedad' (Si dice Failed attempt, Retenido, Devolución, Alert, Expired, Error en entrega)
               - 'Pendiente' (Si dice Not found, Info received, En tránsito normal, Desconocido)

            FORMATO JSON ARRAY:
            [
              { "id": "123456...", "status": "Entregado", "rawStatus": "Delivered" },
              ...
            ]
            
            Solo devuelve el JSON puro, sin markdown.
        `;

    const response = await ai.models.generateContent({
      model: API_CONFIG.GEMINI_MODELS.VISION,
      contents: {
        parts: [{ inlineData: { mimeType: 'image/png', data: base64Data } }, { text: prompt }],
      },
    });

    let cleanText = response.text || '[]';
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
