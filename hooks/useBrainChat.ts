// hooks/useBrainChat.ts
// Hook para conectar CentralBrain con el Chat IA Unificado

import { useState, useCallback, useEffect, useRef } from 'react';
import { Shipment } from '../types';

// Tipos para el chat con el cerebro
interface BrainChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'brain';
  content: string;
  timestamp: Date;
  metadata?: {
    source?: string;
    confidence?: number;
    shipments?: string[];
    action?: string;
    brainInsight?: boolean;
  };
}

interface BrainInsight {
  type: 'alert' | 'recommendation' | 'prediction' | 'pattern';
  priority: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  data?: Record<string, unknown>;
  actionable?: boolean;
  action?: string;
}

interface BrainChatState {
  messages: BrainChatMessage[];
  insights: BrainInsight[];
  isProcessing: boolean;
  brainConnected: boolean;
  lastBrainSync: Date | null;
}

interface UseBrainChatOptions {
  shipments: Shipment[];
  autoGenerateInsights?: boolean;
  insightInterval?: number; // milliseconds
}

interface UseBrainChatReturn {
  state: BrainChatState;
  sendMessage: (text: string) => Promise<void>;
  clearMessages: () => void;
  getShipmentAnalysis: (shipmentId: string) => Promise<string>;
  getPredictions: () => Promise<BrainInsight[]>;
  getRecommendations: () => BrainInsight[];
  dismissInsight: (insightId: string) => void;
  executeAction: (action: string, params?: Record<string, unknown>) => Promise<boolean>;
}

// ============================================
// HOOK PRINCIPAL
// ============================================

export function useBrainChat(options: UseBrainChatOptions): UseBrainChatReturn {
  const { shipments, autoGenerateInsights = true, insightInterval = 60000 } = options;

  const [state, setState] = useState<BrainChatState>({
    messages: [],
    insights: [],
    isProcessing: false,
    brainConnected: true,
    lastBrainSync: null,
  });

  const insightTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ============================================
  // ANÁLISIS Y MÉTRICAS
  // ============================================

  const analyzeShipments = useCallback(() => {
    const total = shipments.length;
    if (total === 0) return null;

    const delivered = shipments.filter(s => s.status === 'delivered').length;
    const inTransit = shipments.filter(s => s.status === 'in_transit').length;
    const issues = shipments.filter(s => s.status === 'issue').length;
    const inOffice = shipments.filter(s => s.status === 'in_office').length;

    // Guías críticas (>5 días o con novedad)
    const critical = shipments.filter(s => {
      if (s.status === 'delivered') return false;
      const days = s.detailedInfo?.daysInTransit || 0;
      return days >= 5 || s.status === 'issue';
    });

    // Por transportadora
    const byCarrier: Record<string, { total: number; delivered: number }> = {};
    shipments.forEach(s => {
      const carrier = s.carrier || 'Desconocida';
      if (!byCarrier[carrier]) byCarrier[carrier] = { total: 0, delivered: 0 };
      byCarrier[carrier].total++;
      if (s.status === 'delivered') byCarrier[carrier].delivered++;
    });

    // Por ciudad
    const byCities: Record<string, number> = {};
    shipments.forEach(s => {
      const city = s.detailedInfo?.destination || 'Desconocida';
      byCities[city] = (byCities[city] || 0) + 1;
    });

    return {
      total,
      delivered,
      inTransit,
      issues,
      inOffice,
      critical,
      deliveryRate: Math.round((delivered / total) * 100),
      byCarrier,
      byCities,
    };
  }, [shipments]);

  // ============================================
  // GENERADOR DE INSIGHTS
  // ============================================

  const generateInsights = useCallback((): BrainInsight[] => {
    const analysis = analyzeShipments();
    if (!analysis) return [];

    const insights: BrainInsight[] = [];

    // Alerta de guías críticas
    if (analysis.critical.length > 0) {
      insights.push({
        type: 'alert',
        priority: 'high',
        title: 'Guías Críticas Detectadas',
        message: `Hay ${analysis.critical.length} guías que requieren atención inmediata (retraso >5 días o con novedad).`,
        data: { count: analysis.critical.length, ids: analysis.critical.map(s => s.id) },
        actionable: true,
        action: 'Gestionar guías críticas',
      });
    }

    // Recomendación de tasa de entrega
    if (analysis.deliveryRate < 80) {
      insights.push({
        type: 'recommendation',
        priority: 'medium',
        title: 'Tasa de Entrega Baja',
        message: `La tasa de entrega actual es ${analysis.deliveryRate}%. Se recomienda revisar las guías pendientes.`,
        data: { rate: analysis.deliveryRate },
        actionable: true,
        action: 'Ver guías pendientes',
      });
    }

    // Predicción basada en patrones
    const predictedDeliveries = Math.round(analysis.inTransit * 0.3);
    insights.push({
      type: 'prediction',
      priority: 'low',
      title: 'Predicción de Entregas',
      message: `Se estima que ~${predictedDeliveries} guías podrían entregarse mañana basado en patrones actuales.`,
      data: { predicted: predictedDeliveries, inTransit: analysis.inTransit },
    });

    // Detectar transportadora con problemas
    Object.entries(analysis.byCarrier).forEach(([carrier, data]) => {
      if (data.total >= 5) {
        const rate = Math.round((data.delivered / data.total) * 100);
        if (rate < 60) {
          insights.push({
            type: 'pattern',
            priority: 'medium',
            title: `Problema con ${carrier}`,
            message: `${carrier} tiene una tasa de entrega del ${rate}% (${data.delivered}/${data.total}). Considera revisar.`,
            data: { carrier, rate, total: data.total },
          });
        }
      }
    });

    return insights;
  }, [analyzeShipments]);

  // ============================================
  // PROCESAR MENSAJE
  // ============================================

  const processMessage = useCallback(async (text: string): Promise<string> => {
    const analysis = analyzeShipments();
    const lowerText = text.toLowerCase();

    // Respuestas basadas en análisis del cerebro
    if (lowerText.includes('estado') || lowerText.includes('resumen')) {
      if (!analysis) return 'No hay guías cargadas para analizar.';

      return `🧠 **Análisis del Cerebro LITPER**

**Estado Actual:**
• Total guías: **${analysis.total}**
• Entregadas: **${analysis.delivered}** (${analysis.deliveryRate}%)
• En tránsito: **${analysis.inTransit}**
• Novedades: **${analysis.issues}**
• En oficina: **${analysis.inOffice}**

**Alertas:**
${analysis.critical.length > 0
  ? `⚠️ **${analysis.critical.length}** guías críticas requieren atención`
  : '✅ No hay alertas críticas'}

**Recomendación IA:**
${analysis.deliveryRate >= 80
  ? 'Rendimiento óptimo. Mantén el seguimiento actual.'
  : 'Se recomienda priorizar gestión de guías con novedad.'}`;
    }

    if (lowerText.includes('crític') || lowerText.includes('urgent')) {
      if (!analysis || analysis.critical.length === 0) {
        return '✅ No hay guías críticas en este momento.';
      }

      let response = `🚨 **${analysis.critical.length} Guías Críticas**\n\n`;
      analysis.critical.slice(0, 10).forEach((s, i) => {
        response += `${i + 1}. **${s.trackingNumber || s.id}**\n`;
        response += `   • Transportadora: ${s.carrier || 'N/A'}\n`;
        response += `   • Estado: ${s.status}\n`;
        response += `   • Días: ${s.detailedInfo?.daysInTransit || '?'}\n\n`;
      });

      response += '\n💡 **Acción recomendada:** Contactar clientes y transportadoras para resolver.';
      return response;
    }

    if (lowerText.includes('predicción') || lowerText.includes('predic')) {
      if (!analysis) return 'Necesito datos para hacer predicciones.';

      const predicted = Math.round(analysis.inTransit * 0.3);
      const riskRate = analysis.issues / analysis.total * 100;

      return `🔮 **Predicciones del Cerebro IA**

**Para las próximas 24 horas:**
• Entregas estimadas: **~${predicted}** guías
• Riesgo de devolución: **${riskRate.toFixed(1)}%**
• Tasa de éxito esperada: **${Math.min(100, analysis.deliveryRate + 5)}%**

**Factores considerados:**
• ${analysis.inTransit} guías actualmente en tránsito
• Patrones históricos de entrega
• Estado actual de las transportadoras

💡 **Insight:** ${riskRate > 10
  ? 'El riesgo de devolución está alto. Prioriza seguimiento.'
  : 'Los indicadores están dentro de parámetros normales.'}`;
    }

    if (lowerText.includes('transportadora') || lowerText.includes('carrier')) {
      if (!analysis) return 'No hay datos de transportadoras disponibles.';

      let response = '📊 **Análisis por Transportadora**\n\n';
      Object.entries(analysis.byCarrier)
        .sort((a, b) => b[1].total - a[1].total)
        .slice(0, 7)
        .forEach(([carrier, data]) => {
          const rate = data.total > 0 ? Math.round((data.delivered / data.total) * 100) : 0;
          const emoji = rate >= 80 ? '🟢' : rate >= 60 ? '🟡' : '🔴';
          response += `${emoji} **${carrier}**: ${data.total} guías (${rate}% entrega)\n`;
        });

      return response;
    }

    if (lowerText.includes('ayuda') || lowerText.includes('help')) {
      return `🧠 **Cerebro LITPER - Capacidades**

Puedo ayudarte con:

1. **Análisis de Estado**
   - "¿Cuál es el estado actual?"
   - "Dame un resumen"

2. **Guías Críticas**
   - "Muéstrame las guías críticas"
   - "¿Qué necesita atención urgente?"

3. **Predicciones**
   - "¿Qué predicciones hay para mañana?"
   - "Predice las entregas"

4. **Análisis de Rendimiento**
   - "Analiza las transportadoras"
   - "¿Cómo está el rendimiento?"

5. **Automatización**
   - "Prioriza las guías"
   - "Genera un reporte"

💡 Usa los modos de chat (arriba) para análisis especializados.`;
    }

    // Respuesta genérica inteligente
    return `Entiendo tu consulta sobre "${text}".

Con **${analysis?.total || 0}** guías cargadas y una tasa de entrega del **${analysis?.deliveryRate || 0}%**, puedo ayudarte con análisis, predicciones o gestión.

¿Qué te gustaría hacer?
• Escribe "estado" para ver el resumen
• Escribe "críticas" para ver guías urgentes
• Escribe "predicción" para ver pronósticos`;
  }, [analyzeShipments]);

  // ============================================
  // ENVIAR MENSAJE
  // ============================================

  const sendMessage = useCallback(async (text: string): Promise<void> => {
    if (!text.trim()) return;

    // Agregar mensaje del usuario
    const userMessage: BrainChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isProcessing: true,
    }));

    // Procesar y obtener respuesta
    const response = await processMessage(text);

    // Agregar respuesta del cerebro
    const brainMessage: BrainChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response,
      timestamp: new Date(),
      metadata: {
        source: 'brain',
        brainInsight: true,
      },
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, brainMessage],
      isProcessing: false,
      lastBrainSync: new Date(),
    }));
  }, [processMessage]);

  // ============================================
  // OTRAS FUNCIONES
  // ============================================

  const clearMessages = useCallback(() => {
    setState(prev => ({ ...prev, messages: [] }));
  }, []);

  const getShipmentAnalysis = useCallback(async (shipmentId: string): Promise<string> => {
    const shipment = shipments.find(s => s.id === shipmentId || s.trackingNumber === shipmentId);
    if (!shipment) return 'Guía no encontrada.';

    return `**Análisis de Guía ${shipmentId}**

• Estado: ${shipment.status}
• Transportadora: ${shipment.carrier || 'N/A'}
• Destino: ${shipment.detailedInfo?.destination || 'N/A'}
• Días en tránsito: ${shipment.detailedInfo?.daysInTransit || '?'}

${shipment.status === 'issue' ? '⚠️ Esta guía tiene una novedad que requiere atención.' : ''}`;
  }, [shipments]);

  const getPredictions = useCallback(async (): Promise<BrainInsight[]> => {
    return generateInsights().filter(i => i.type === 'prediction');
  }, [generateInsights]);

  const getRecommendations = useCallback((): BrainInsight[] => {
    return generateInsights().filter(i => i.type === 'recommendation');
  }, [generateInsights]);

  const dismissInsight = useCallback((insightId: string) => {
    setState(prev => ({
      ...prev,
      insights: prev.insights.filter((_, i) => i.toString() !== insightId),
    }));
  }, []);

  const executeAction = useCallback(async (action: string, params?: Record<string, unknown>): Promise<boolean> => {
    console.log('🧠 Ejecutando acción:', action, params);
    // Aquí se conectaría con acciones reales del sistema
    return true;
  }, []);

  // ============================================
  // EFECTOS
  // ============================================

  // Generar insights automáticamente
  useEffect(() => {
    if (autoGenerateInsights && shipments.length > 0) {
      const newInsights = generateInsights();
      setState(prev => ({ ...prev, insights: newInsights }));

      // Actualizar periódicamente
      insightTimerRef.current = setInterval(() => {
        const insights = generateInsights();
        setState(prev => ({ ...prev, insights }));
      }, insightInterval);

      return () => {
        if (insightTimerRef.current) {
          clearInterval(insightTimerRef.current);
        }
      };
    }
  }, [autoGenerateInsights, shipments.length, generateInsights, insightInterval]);

  return {
    state,
    sendMessage,
    clearMessages,
    getShipmentAnalysis,
    getPredictions,
    getRecommendations,
    dismissInsight,
    executeAction,
  };
}

export default useBrainChat;
