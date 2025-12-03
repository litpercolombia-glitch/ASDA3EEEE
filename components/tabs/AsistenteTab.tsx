import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  RefreshCw,
  Trash2,
  Package,
  AlertTriangle,
  TrendingUp,
  Clock,
  User,
  ChevronRight,
  Loader2,
  FileBarChart,
  Activity,
  MapPin,
} from 'lucide-react';
import { Shipment, ShipmentStatus, CarrierName } from '../../types';
import { MensajeAsistente, STORAGE_KEYS } from '../../types/logistics';
import { detectarGuiasRetrasadas, detectarPatrones } from '../../utils/patternDetection';
import { saveTabData, loadTabData } from '../../utils/tabStorage';
import { v4 as uuidv4 } from 'uuid';

interface AsistenteTabProps {
  shipments: Shipment[];
}

// Quick action buttons
const quickActions = [
  {
    id: 'resumen',
    icon: FileBarChart,
    label: 'Resumen del día',
    prompt: '¿Cuál es el resumen del estado de mis guías hoy?',
  },
  {
    id: 'alertas',
    icon: AlertTriangle,
    label: 'Ver alertas',
    prompt: '¿Cuáles son las guías más urgentes que debo atender?',
  },
  {
    id: 'transportadora',
    icon: TrendingUp,
    label: 'Mejor transportadora',
    prompt: '¿Cuál es la transportadora con mejor rendimiento?',
  },
  {
    id: 'patrones',
    icon: Activity,
    label: 'Patrones detectados',
    prompt: '¿Qué patrones problemáticos has detectado en mis envíos?',
  },
];

export const AsistenteTab: React.FC<AsistenteTabProps> = ({ shipments }) => {
  const [mensajes, setMensajes] = useState<MensajeAsistente[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load saved messages
  useEffect(() => {
    const saved = loadTabData<MensajeAsistente[]>(STORAGE_KEYS.ASISTENTE, []);
    if (saved.length > 0) {
      setMensajes(saved);
    } else {
      // Add welcome message
      setMensajes([
        {
          id: uuidv4(),
          rol: 'assistant',
          contenido: `¡Hola! Soy tu asistente de logística. Puedo ayudarte con:

• Analizar el estado de tus guías
• Identificar problemas y patrones
• Recomendar acciones para mejorar entregas
• Responder preguntas sobre transportadoras

¿En qué puedo ayudarte hoy?`,
          timestamp: new Date(),
        },
      ]);
    }
  }, []);

  // Save messages when they change
  useEffect(() => {
    if (mensajes.length > 0) {
      saveTabData(STORAGE_KEYS.ASISTENTE, mensajes);
    }
  }, [mensajes]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  // Generate context from shipments
  const contexto = useMemo(() => {
    if (shipments.length === 0) {
      return 'No hay guías cargadas actualmente.';
    }

    const total = shipments.length;
    const entregadas = shipments.filter((s) => s.status === ShipmentStatus.DELIVERED).length;
    const enTransito = shipments.filter((s) => s.status === ShipmentStatus.IN_TRANSIT).length;
    const enOficina = shipments.filter((s) => s.status === ShipmentStatus.IN_OFFICE).length;
    const novedades = shipments.filter((s) => s.status === ShipmentStatus.ISSUE).length;

    const guiasRetrasadas = detectarGuiasRetrasadas(shipments);
    const patrones = detectarPatrones(shipments);

    return `
GUÍAS ACTIVAS: ${total}
- Entregadas: ${entregadas} (${((entregadas / total) * 100).toFixed(0)}%)
- En tránsito: ${enTransito}
- En oficina: ${enOficina}
- Con novedad: ${novedades}
- Retrasadas (+2 días): ${guiasRetrasadas.length}
  - Críticas (+5 días): ${guiasRetrasadas.filter((g) => g.nivelAlerta === 'CRITICO').length}
  - Alerta (3-4 días): ${guiasRetrasadas.filter((g) => g.nivelAlerta === 'ALTO').length}

TRANSPORTADORAS:
${Object.values(CarrierName)
  .filter((c) => c !== CarrierName.UNKNOWN)
  .map((carrier) => {
    const carrierShipments = shipments.filter((s) => s.carrier === carrier);
    const carrierDelivered = carrierShipments.filter((s) => s.status === ShipmentStatus.DELIVERED).length;
    const rate = carrierShipments.length > 0 ? ((carrierDelivered / carrierShipments.length) * 100).toFixed(0) : 0;
    return `- ${carrier}: ${carrierShipments.length} guías (${rate}% éxito)`;
  })
  .join('\n')}

PATRONES DETECTADOS: ${patrones.length}
${patrones.slice(0, 3).map((p) => `- ${p.titulo}: ${p.descripcion}`).join('\n')}

GUÍAS URGENTES:
${guiasRetrasadas
  .filter((g) => g.nivelAlerta === 'CRITICO')
  .slice(0, 5)
  .map((g) => `- ${g.guia.id} (${g.diasSinMovimiento} días sin movimiento) - ${g.ultimoEstado}`)
  .join('\n') || 'Ninguna crítica'}
`;
  }, [shipments]);

  // Generate AI response with organized, clear, and dynamic responses
  const generateResponse = async (userMessage: string): Promise<string> => {
    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const lowerMessage = userMessage.toLowerCase();
    const guiasRetrasadas = detectarGuiasRetrasadas(shipments);
    const patrones = detectarPatrones(shipments);

    const total = shipments.length;
    const entregadas = shipments.filter((s) => s.status === ShipmentStatus.DELIVERED).length;
    const enTransito = shipments.filter((s) => s.status === ShipmentStatus.IN_TRANSIT).length;
    const enOficina = shipments.filter((s) => s.status === ShipmentStatus.IN_OFFICE).length;
    const conNovedad = shipments.filter((s) => s.status === ShipmentStatus.ISSUE).length;
    const criticas = guiasRetrasadas.filter((g) => g.nivelAlerta === 'CRITICO');
    const altas = guiasRetrasadas.filter((g) => g.nivelAlerta === 'ALTO');
    const rate = total > 0 ? ((entregadas / total) * 100).toFixed(0) : 0;

    // Check for specific queries
    if (lowerMessage.includes('resumen') || lowerMessage.includes('estado') || lowerMessage.includes('dia') || lowerMessage.includes('día')) {
      let response = `📊 **RESUMEN DEL DÍA**\n\n`;
      response += `**Estado General:** ${total} guías activas\n\n`;

      response += `📦 **DISTRIBUCIÓN POR ESTADO:**\n`;
      response += `• ✅ Entregadas: ${entregadas} (${rate}%)\n`;
      response += `• 🚚 En tránsito: ${enTransito}\n`;
      response += `• 📍 En oficina: ${enOficina}\n`;
      response += `• ⚠️ Con novedad: ${conNovedad}\n\n`;

      if (guiasRetrasadas.length > 0) {
        response += `⏰ **ALERTAS ACTIVAS:**\n`;
        response += `• 🔴 Críticas (+5 días): ${criticas.length}\n`;
        response += `• 🟠 Alta prioridad (3-4 días): ${altas.length}\n`;
        response += `• 🟡 Seguimiento (2 días): ${guiasRetrasadas.filter((g) => g.nivelAlerta === 'MEDIO').length}\n\n`;
      }

      response += `💡 **RECOMENDACIÓN:**\n`;
      if (criticas.length > 0) {
        response += `Tienes ${criticas.length} guía(s) crítica(s) que requieren atención INMEDIATA.\n`;
        response += `Prioridad: ${criticas.slice(0, 2).map(g => g.guia.id).join(', ')}`;
      } else if (altas.length > 0) {
        response += `Hay ${altas.length} guía(s) en alerta que debes atender hoy para evitar que pasen a críticas.`;
      } else if (guiasRetrasadas.length > 0) {
        response += `Las guías están fluyendo bien. Mantén monitoreo de las ${guiasRetrasadas.length} con retraso leve.`;
      } else {
        response += `¡Todo bajo control! No hay guías con retraso. Continúa el monitoreo regular.`;
      }

      return response;
    }

    if (lowerMessage.includes('urgente') || lowerMessage.includes('atender') || lowerMessage.includes('alerta') || lowerMessage.includes('critica') || lowerMessage.includes('crítica')) {
      if (criticas.length === 0 && altas.length === 0) {
        return `✅ **¡TODO EN ORDEN!**

No hay guías urgentes que requieran atención inmediata.

**Estado actual:**
• ${guiasRetrasadas.length} guías en seguimiento (retraso leve)
• ${total - guiasRetrasadas.length} guías fluyendo normalmente

💡 **Recomendación:**
Aprovecha para revisar las guías en oficina (${enOficina}) y enviar recordatorios a clientes que deben retirar.`;
      }

      let response = `🔴 **GUÍAS URGENTES**\n\n`;

      if (criticas.length > 0) {
        response += `**CRÍTICAS - Acción inmediata (${criticas.length}):**\n`;
        criticas.slice(0, 5).forEach((g, idx) => {
          const ciudad = g.guia.detailedInfo?.destination || 'N/A';
          response += `\n${idx + 1}. **${g.guia.id}** - ${g.ultimoEstado}\n`;
          response += `   • ${g.diasSinMovimiento} días sin movimiento | ${ciudad}\n`;
          response += `   • Acción: ${g.recomendacionIA}\n`;
          response += `   • Riesgo: ${g.diasSinMovimiento >= 7 ? '90%' : '80%'} probabilidad de devolución\n`;
        });
        if (criticas.length > 5) {
          response += `\n   + ${criticas.length - 5} guías críticas más...\n`;
        }
      }

      if (altas.length > 0) {
        response += `\n**🟠 ALERTA - Atender hoy (${altas.length}):**\n`;
        altas.slice(0, 3).forEach((g, idx) => {
          response += `${idx + 1}. ${g.guia.id} - ${g.ultimoEstado} (${g.diasSinMovimiento}d)\n`;
        });
        if (altas.length > 3) {
          response += `   + ${altas.length - 3} más en alerta...\n`;
        }
      }

      response += `\n💡 **PRIORIZACIÓN:**\n`;
      response += `1. Resuelve primero las ${criticas.length} críticas\n`;
      response += `2. Luego atiende las ${altas.length} en alerta\n`;
      response += `3. Las críticas +5 días se devuelven automáticamente`;

      return response;
    }

    if (lowerMessage.includes('transportadora') || lowerMessage.includes('mejor') || lowerMessage.includes('carrier') || lowerMessage.includes('rendimiento')) {
      const carrierStats = Object.values(CarrierName)
        .filter((c) => c !== CarrierName.UNKNOWN)
        .map((carrier) => {
          const cs = shipments.filter((s) => s.carrier === carrier);
          const delivered = cs.filter((s) => s.status === ShipmentStatus.DELIVERED).length;
          const issues = cs.filter((s) => s.status === ShipmentStatus.ISSUE).length;
          return {
            name: carrier,
            total: cs.length,
            delivered,
            issues,
            rate: cs.length > 0 ? (delivered / cs.length) * 100 : 0,
          };
        })
        .filter((c) => c.total > 0)
        .sort((a, b) => b.rate - a.rate);

      if (carrierStats.length === 0) {
        return '📊 No hay datos suficientes de transportadoras para analizar.\n\nCarga guías para ver el rendimiento por transportadora.';
      }

      const best = carrierStats[0];
      const worst = carrierStats[carrierStats.length - 1];

      let response = `📊 **RENDIMIENTO DE TRANSPORTADORAS**\n\n`;

      response += `🥇 **MEJOR RENDIMIENTO:**\n`;
      response += `${best.name} - ${best.rate.toFixed(0)}% éxito\n`;
      response += `• ${best.delivered}/${best.total} entregas | ${best.issues} novedades\n\n`;

      response += `📋 **RANKING COMPLETO:**\n`;
      carrierStats.forEach((c, i) => {
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '  ';
        const status = c.rate >= 75 ? '🟢' : c.rate >= 65 ? '🟡' : c.rate >= 50 ? '🟠' : '🔴';
        response += `${medal} ${c.name}: ${status} ${c.rate.toFixed(0)}% (${c.delivered}/${c.total})\n`;
      });

      if (worst.rate < 65) {
        response += `\n⚠️ **ALERTA:**\n`;
        response += `${worst.name} tiene rendimiento crítico (${worst.rate.toFixed(0)}%).\n`;
        response += `Considera evaluar alternativas para esta transportadora.`;
      }

      response += `\n\n💡 **RECOMENDACIÓN:**\n`;
      response += `Prioriza envíos con ${best.name} para zonas importantes y clientes VIP.`;

      return response;
    }

    if (lowerMessage.includes('patron') || lowerMessage.includes('problema') || lowerMessage.includes('detecta')) {
      if (patrones.length === 0) {
        return `✅ **SIN PATRONES PROBLEMÁTICOS**

No se han detectado patrones significativos en tus envíos actuales.

**Indicadores saludables:**
• No hay acumulación de retrasos por zona
• Las transportadoras mantienen rendimiento aceptable
• No hay bloqueos sistemáticos

💡 Continúa el monitoreo regular para mantener estos buenos indicadores.`;
      }

      let response = `🔍 **PATRONES DETECTADOS (${patrones.length})**\n\n`;

      const criticos = patrones.filter(p => p.impacto === 'CRITICO');
      const altos = patrones.filter(p => p.impacto === 'ALTO');
      const otros = patrones.filter(p => p.impacto === 'MEDIO' || p.impacto === 'BAJO');

      if (criticos.length > 0) {
        response += `**🔴 CRÍTICOS (${criticos.length}):**\n`;
        criticos.forEach((p) => {
          response += `\n• **${p.titulo}**\n`;
          response += `  ${p.descripcion}\n`;
          response += `  → Acción: ${p.recomendacion}\n`;
          response += `  → Afecta: ${p.datosApoyo.cantidad} guías (${p.datosApoyo.porcentaje.toFixed(1)}%)\n`;
        });
      }

      if (altos.length > 0) {
        response += `\n**🟠 ALERTA (${altos.length}):**\n`;
        altos.forEach((p) => {
          response += `• ${p.titulo} - ${p.datosApoyo.cantidad} guías\n`;
          response += `  → ${p.recomendacion}\n`;
        });
      }

      if (otros.length > 0) {
        response += `\n**🟡 SEGUIMIENTO (${otros.length}):**\n`;
        otros.slice(0, 2).forEach((p) => {
          response += `• ${p.titulo}\n`;
        });
      }

      response += `\n💡 **PLAN DE ACCIÓN:**\n`;
      response += `1. Resuelve patrones críticos primero\n`;
      response += `2. Implementa las recomendaciones de cada patrón\n`;
      response += `3. Los patrones críticos pueden causar +40% devoluciones`;

      return response;
    }

    // Query about specific shipment
    if (lowerMessage.match(/[a-z]{2,4}[-\s]?\d{5,}/i)) {
      const guiaMatch = lowerMessage.match(/[a-z]{2,4}[-\s]?\d{5,}/i);
      if (guiaMatch) {
        const guiaId = guiaMatch[0].toUpperCase().replace(/\s/g, '-');
        const guia = shipments.find(s => s.id.toUpperCase().includes(guiaId) || guiaId.includes(s.id.toUpperCase()));

        if (guia) {
          const retrasada = guiasRetrasadas.find(g => g.guia.id === guia.id);
          let response = `📦 **GUÍA ${guia.id}**\n\n`;
          response += `**Estado:** ${guia.status}\n`;
          response += `**Transportadora:** ${guia.carrier}\n`;
          if (guia.detailedInfo?.destination) response += `**Destino:** ${guia.detailedInfo.destination}\n`;
          if (guia.phone) response += `**Teléfono:** ${guia.phone}\n`;

          if (retrasada) {
            response += `\n⚠️ **ALERTA:** ${retrasada.diasSinMovimiento} días sin movimiento\n`;
            response += `**Nivel:** ${retrasada.nivelAlerta}\n`;
            response += `**Recomendación:** ${retrasada.recomendacionIA}`;
          } else {
            response += `\n✅ Esta guía está fluyendo normalmente.`;
          }

          return response;
        }
      }
    }

    // Default response with context
    let response = `Basándome en el contexto actual:\n\n`;
    response += `**📊 Resumen rápido:**\n`;
    response += `• ${total} guías activas | ${rate}% éxito\n`;
    response += `• ${criticas.length + altas.length} requieren atención urgente\n`;
    response += `• ${patrones.length} patrones detectados\n\n`;

    response += `**¿En qué puedo ayudarte?**\n`;
    response += `• "Resumen del día" - Ver estado general\n`;
    response += `• "Guías urgentes" - Ver críticas y alertas\n`;
    response += `• "Mejor transportadora" - Ranking de rendimiento\n`;
    response += `• "Patrones detectados" - Análisis de problemas\n`;
    response += `• Escribe un número de guía para ver su estado\n\n`;

    response += `💡 Usa los botones de sugerencias rápidas o escribe tu pregunta.`;

    return response;
  };

  // Handle send message
  const handleSend = async (message?: string) => {
    const texto = message || inputValue.trim();
    if (!texto || isLoading) return;

    // Add user message
    const userMessage: MensajeAsistente = {
      id: uuidv4(),
      rol: 'user',
      contenido: texto,
      timestamp: new Date(),
    };

    setMensajes((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await generateResponse(texto);

      const assistantMessage: MensajeAsistente = {
        id: uuidv4(),
        rol: 'assistant',
        contenido: response,
        timestamp: new Date(),
      };

      setMensajes((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: MensajeAsistente = {
        id: uuidv4(),
        rol: 'assistant',
        contenido: 'Lo siento, hubo un error al procesar tu mensaje. Por favor intenta de nuevo.',
        timestamp: new Date(),
      };
      setMensajes((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle clear chat
  const handleClear = () => {
    if (confirm('¿Estás seguro de que deseas limpiar el historial de conversación?')) {
      setMensajes([
        {
          id: uuidv4(),
          rol: 'assistant',
          contenido: '¡Conversación reiniciada! ¿En qué puedo ayudarte?',
          timestamp: new Date(),
        },
      ]);
    }
  };

  return (
    <div className="h-[calc(100vh-280px)] min-h-[500px] flex flex-col bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-700 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 dark:border-navy-700 flex items-center justify-between bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-slate-800 dark:text-white">Asistente IA Litper</h2>
            <p className="text-xs text-slate-500">
              {shipments.length > 0
                ? `Analizando ${shipments.length} guías`
                : 'Sin datos cargados'}
            </p>
          </div>
        </div>

        <button
          onClick={handleClear}
          className="p-2 hover:bg-white/50 dark:hover:bg-navy-800 rounded-lg transition-colors"
          title="Limpiar conversación"
        >
          <Trash2 className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {mensajes.map((mensaje) => (
          <div
            key={mensaje.id}
            className={`flex ${mensaje.rol === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                mensaje.rol === 'user'
                  ? 'bg-gradient-to-br from-pink-500 to-purple-600 text-white'
                  : 'bg-slate-100 dark:bg-navy-800 text-slate-800 dark:text-slate-200'
              }`}
            >
              {mensaje.rol === 'assistant' && (
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-200 dark:border-navy-700">
                  <Bot className="w-4 h-4 text-purple-500" />
                  <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                    Asistente IA
                  </span>
                </div>
              )}
              <div className="text-sm whitespace-pre-wrap">{mensaje.contenido}</div>
              <p
                className={`text-xs mt-2 ${
                  mensaje.rol === 'user' ? 'text-white/70' : 'text-slate-400'
                }`}
              >
                {new Date(mensaje.timestamp).toLocaleTimeString('es-CO', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 dark:bg-navy-800 rounded-2xl px-4 py-3 flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />
              <span className="text-sm text-slate-500">Pensando...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-2 border-t border-slate-200 dark:border-navy-700 overflow-x-auto">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 flex-shrink-0">Sugerencias:</span>
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={() => handleSend(action.prompt)}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 rounded-full text-xs font-medium text-slate-600 dark:text-slate-300 transition-colors flex-shrink-0 disabled:opacity-50"
            >
              <action.icon className="w-3 h-3" />
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-200 dark:border-navy-700">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Escribe tu pregunta..."
            disabled={isLoading}
            className="flex-1 px-4 py-3 bg-slate-100 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
          />
          <button
            onClick={() => handleSend()}
            disabled={!inputValue.trim() || isLoading}
            className="p-3 bg-gradient-to-br from-pink-500 to-purple-600 text-white rounded-xl hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AsistenteTab;
