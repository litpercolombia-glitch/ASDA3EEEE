import Anthropic from '@anthropic-ai/sdk';
import { API_CONFIG } from '../config/constants';
import { AnalyticsReport } from './analyticsService';
import { Shipment } from '../types';

export interface PredictiveInsights {
  predictions: string[];
  strategicSuggestions: string[];
  riskAlerts: string[];
}

/**
 * Genera predicciones y sugerencias usando Claude AI
 */
export async function generatePredictiveInsights(
  report: AnalyticsReport,
  recentShipments: Shipment[]
): Promise<PredictiveInsights> {
  const client = new Anthropic({
    apiKey: API_CONFIG.CLAUDE_API_KEY,
    dangerouslyAllowBrowser: true,
  });

  // Preparar datos para el análisis
  const analyticsData = {
    semana: report.weekNumber,
    año: report.year,
    metricas: {
      totalGuias: report.metrics.totalShipments,
      entregasExitosas: report.metrics.successfulDeliveries,
      tasaExito: report.metrics.successRate,
      fallos: report.metrics.failures,
      tasaFallos: report.metrics.failureRate,
      tiempoPromedioEntrega: report.metrics.averageDeliveryTime,
      mejorTransportadora: report.metrics.bestCarrier,
      peorTransportadora: report.metrics.worstCarrier,
    },
    zonasCriticas: report.criticalZones,
    rutasRetrasadas: report.delayedRoutes,
    datosRecientes: recentShipments.slice(0, 10).map((s) => ({
      transportadora: s.carrier,
      estado: s.status,
      destino: s.destination,
      tiempoEstimado: s.estimatedDelivery,
    })),
  };

  const prompt = `Eres un experto en logística y análisis predictivo para LITPER SEGUIMIENTO DE GUÍAS, una empresa colombiana de seguimiento logístico.

**DATOS ANALÍTICOS DE LA SEMANA ${report.weekNumber} - ${report.year}:**

${JSON.stringify(analyticsData, null, 2)}

**TU MISIÓN:**
Genera un análisis predictivo profesional con:

1. **PREDICCIONES PARA LA PRÓXIMA SEMANA** (3-5 predicciones específicas):
   - Analiza patrones y tendencias
   - Considera estacionalidad, zonas críticas, transportadoras
   - Sé específico con porcentajes y zonas geográficas
   - Incluye factores externos relevantes (clima, festivos, etc.)

2. **SUGERENCIAS ESTRATÉGICAS** (3-5 recomendaciones accionables):
   - Proporciona acciones concretas para mejorar operaciones
   - Prioriza mejoras de mayor impacto
   - Enfócate en reducir fallos y tiempos de entrega
   - Incluye recomendaciones por transportadora y zona

3. **ALERTAS DE RIESGO** (2-4 alertas importantes):
   - Identifica riesgos inminentes
   - Señala patrones preocupantes
   - Recomienda monitoreo preventivo

**FORMATO DE RESPUESTA (JSON):**
{
  "predictions": [
    "Predicción 1 con datos específicos",
    "Predicción 2 con porcentajes y zonas",
    "..."
  ],
  "strategicSuggestions": [
    "Sugerencia accionable 1",
    "Sugerencia accionable 2",
    "..."
  ],
  "riskAlerts": [
    "Alerta de riesgo 1",
    "Alerta de riesgo 2",
    "..."
  ]
}

**IMPORTANTE:**
- Usa español colombiano profesional
- Sé preciso con datos y porcentajes
- Menciona ciudades y transportadoras específicas cuando sea relevante
- Las predicciones deben ser realistas y basadas en los datos
- Las sugerencias deben ser accionables inmediatamente`;

  try {
    const message = await client.messages.create({
      model: API_CONFIG.CLAUDE_MODELS.DEFAULT,
      max_tokens: 2000,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = message.content[0];
    if (content.type === 'text') {
      // Intentar parsear JSON de la respuesta
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const insights = JSON.parse(jsonMatch[0]) as PredictiveInsights;
        return insights;
      }

      // Fallback: parsear manualmente si no está en JSON
      return parseInsightsFromText(content.text);
    }

    throw new Error('No se recibió contenido de texto de Claude');
  } catch (error) {
    console.error('Error generando insights predictivos:', error);

    // Retornar insights básicos en caso de error
    return {
      predictions: [
        `Basado en la tasa de éxito actual del ${report.metrics.successRate}%, se espera un comportamiento similar la próxima semana.`,
        `La transportadora ${report.metrics.worstCarrier.name} podría seguir presentando dificultades con ${report.metrics.worstCarrier.failureCount} fallos recientes.`,
        `Las zonas críticas identificadas (${report.criticalZones.map((z) => z.city).join(', ')}) requieren monitoreo continuo.`,
      ],
      strategicSuggestions: [
        `Priorizar entregas con ${report.metrics.bestCarrier.name} que tiene ${report.metrics.bestCarrier.successRate}% de éxito.`,
        `Implementar alertas tempranas para envíos que superen ${report.metrics.averageDeliveryTime + 2} días.`,
        `Revisar estrategia de asignación de transportadoras en zonas críticas.`,
      ],
      riskAlerts: [
        `Alto índice de fallos (${report.metrics.failureRate}%) requiere atención inmediata.`,
        `Rutas retrasadas detectadas: monitorear tiempos de entrega estrechamente.`,
      ],
    };
  }
}

/**
 * Parsea insights del texto cuando no está en formato JSON
 */
function parseInsightsFromText(text: string): PredictiveInsights {
  const predictions: string[] = [];
  const strategicSuggestions: string[] = [];
  const riskAlerts: string[] = [];

  const lines = text.split('\n').filter((line) => line.trim());

  let currentSection: 'predictions' | 'suggestions' | 'alerts' | null = null;

  for (const line of lines) {
    const trimmed = line.trim();

    // Detectar secciones
    if (
      trimmed.toLowerCase().includes('predicción') ||
      trimmed.toLowerCase().includes('próxima semana')
    ) {
      currentSection = 'predictions';
      continue;
    } else if (
      trimmed.toLowerCase().includes('sugerencia') ||
      trimmed.toLowerCase().includes('estratégica') ||
      trimmed.toLowerCase().includes('recomendación')
    ) {
      currentSection = 'suggestions';
      continue;
    } else if (
      trimmed.toLowerCase().includes('alerta') ||
      trimmed.toLowerCase().includes('riesgo')
    ) {
      currentSection = 'alerts';
      continue;
    }

    // Agregar contenido a la sección actual
    if (currentSection && trimmed.length > 20) {
      // Ignorar líneas muy cortas
      const cleanLine = trimmed.replace(/^[-*•]\s*/, '').replace(/^\d+\.\s*/, '');

      if (cleanLine.length > 10) {
        if (currentSection === 'predictions') {
          predictions.push(cleanLine);
        } else if (currentSection === 'suggestions') {
          strategicSuggestions.push(cleanLine);
        } else if (currentSection === 'alerts') {
          riskAlerts.push(cleanLine);
        }
      }
    }
  }

  return {
    predictions:
      predictions.length > 0
        ? predictions
        : ['Análisis en progreso. Datos insuficientes para predicciones precisas.'],
    strategicSuggestions:
      strategicSuggestions.length > 0
        ? strategicSuggestions
        : [
            'Continuar monitoreando el desempeño de las transportadoras.',
            'Implementar alertas automáticas para retrasos.',
          ],
    riskAlerts:
      riskAlerts.length > 0
        ? riskAlerts
        : ['Monitorear de cerca las métricas de la próxima semana.'],
  };
}

/**
 * Genera un resumen ejecutivo en texto natural usando Claude
 */
export async function generateExecutiveSummary(report: AnalyticsReport): Promise<string> {
  const client = new Anthropic({
    apiKey: API_CONFIG.CLAUDE_API_KEY,
    dangerouslyAllowBrowser: true,
  });

  const prompt = `Como experto en logística, genera un resumen ejecutivo profesional (2-3 párrafos) para el siguiente reporte de LITPER SEGUIMIENTO DE GUÍAS:

**DATOS DE LA SEMANA ${report.weekNumber} - ${report.year}:**
- Total guías: ${report.metrics.totalShipments}
- Entregas exitosas: ${report.metrics.successfulDeliveries} (${report.metrics.successRate}%)
- Fallos: ${report.metrics.failures} (${report.metrics.failureRate}%)
- Tiempo promedio: ${report.metrics.averageDeliveryTime} días
- Mejor transportadora: ${report.metrics.bestCarrier.name} (${report.metrics.bestCarrier.successRate}%)
- Peor transportadora: ${report.metrics.worstCarrier.name} (${report.metrics.worstCarrier.failureCount} fallos)
- Zonas críticas: ${report.criticalZones.map((z) => z.city).join(', ')}

El resumen debe ser conciso, profesional y destacar lo más importante. Usa español colombiano.`;

  try {
    const message = await client.messages.create({
      model: API_CONFIG.CLAUDE_MODELS.DEFAULT,
      max_tokens: 500,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = message.content[0];
    if (content.type === 'text') {
      return content.text.trim();
    }

    return generateFallbackSummary(report);
  } catch (error) {
    console.error('Error generando resumen ejecutivo:', error);
    return generateFallbackSummary(report);
  }
}

/**
 * Genera un resumen ejecutivo básico como fallback
 */
function generateFallbackSummary(report: AnalyticsReport): string {
  return `Durante la semana ${report.weekNumber} de ${report.year}, LITPER procesó ${report.metrics.totalShipments} guías con una tasa de éxito del ${report.metrics.successRate}%. Se registraron ${report.metrics.failures} fallos (${report.metrics.failureRate}%), con un tiempo promedio de entrega de ${report.metrics.averageDeliveryTime} días. La transportadora ${report.metrics.bestCarrier.name} destacó con ${report.metrics.bestCarrier.successRate}% de entregas exitosas, mientras que ${report.metrics.worstCarrier.name} presentó ${report.metrics.worstCarrier.failureCount} fallos. Las zonas críticas identificadas incluyen ${report.criticalZones.map((z) => z.city).join(', ')}, requiriendo atención especial para la próxima semana.`;
}
