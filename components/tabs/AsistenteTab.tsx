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

  // Generate AI response (simulated - in production would call Claude API)
  const generateResponse = async (userMessage: string): Promise<string> => {
    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const lowerMessage = userMessage.toLowerCase();
    const guiasRetrasadas = detectarGuiasRetrasadas(shipments);
    const patrones = detectarPatrones(shipments);

    // Check for specific queries
    if (lowerMessage.includes('resumen') || lowerMessage.includes('estado')) {
      const total = shipments.length;
      const entregadas = shipments.filter((s) => s.status === ShipmentStatus.DELIVERED).length;
      const rate = total > 0 ? ((entregadas / total) * 100).toFixed(0) : 0;

      return `📊 **Resumen del día:**

De ${total} guías activas:
• ✅ ${entregadas} entregadas (${rate}%)
• 🚚 ${shipments.filter((s) => s.status === ShipmentStatus.IN_TRANSIT).length} en tránsito
• 📦 ${shipments.filter((s) => s.status === ShipmentStatus.IN_OFFICE).length} en oficina
• ⚠️ ${shipments.filter((s) => s.status === ShipmentStatus.ISSUE).length} con novedad

${guiasRetrasadas.length > 0 ? `\n⏰ **Alertas:** ${guiasRetrasadas.filter((g) => g.nivelAlerta === 'CRITICO').length} guías críticas que requieren atención inmediata.` : ''}

💡 **Recomendación:** ${guiasRetrasadas.length > 0 ? 'Prioriza las guías críticas antes de que cumplan más días sin movimiento.' : '¡Todo está bajo control! Continúa el monitoreo regular.'}`;
    }

    if (lowerMessage.includes('urgente') || lowerMessage.includes('atender') || lowerMessage.includes('alerta')) {
      const criticas = guiasRetrasadas.filter((g) => g.nivelAlerta === 'CRITICO');
      const altas = guiasRetrasadas.filter((g) => g.nivelAlerta === 'ALTO');

      if (criticas.length === 0 && altas.length === 0) {
        return `✅ **¡Todo en orden!**

No hay guías urgentes que requieran atención inmediata. Las guías están fluyendo con normalidad.

💡 **Recomendación:** Aprovecha para revisar las guías en oficina y enviar recordatorios a los clientes.`;
      }

      let response = '🔴 **Guías más urgentes:**\n\n';

      if (criticas.length > 0) {
        response += '**CRÍTICAS (Acción inmediata):**\n';
        criticas.slice(0, 3).forEach((g, idx) => {
          response += `${idx + 1}. **${g.guia.id}** - ${g.ultimoEstado} (${g.diasSinMovimiento} días)\n`;
          response += `   → ${g.recomendacionIA}\n\n`;
        });
      }

      if (altas.length > 0) {
        response += '**🟠 ALERTA (Atender hoy):**\n';
        altas.slice(0, 3).forEach((g, idx) => {
          response += `${idx + 1}. **${g.guia.id}** - ${g.ultimoEstado} (${g.diasSinMovimiento} días)\n`;
        });
      }

      response += `\n💡 **Recomendación:** Resuelve primero las ${criticas.length} críticas. Tienen 80% de probabilidad de devolución si no actúas hoy.`;

      return response;
    }

    if (lowerMessage.includes('transportadora') || lowerMessage.includes('mejor')) {
      const carrierStats = Object.values(CarrierName)
        .filter((c) => c !== CarrierName.UNKNOWN)
        .map((carrier) => {
          const cs = shipments.filter((s) => s.carrier === carrier);
          const delivered = cs.filter((s) => s.status === ShipmentStatus.DELIVERED).length;
          return {
            name: carrier,
            total: cs.length,
            delivered,
            rate: cs.length > 0 ? (delivered / cs.length) * 100 : 0,
          };
        })
        .filter((c) => c.total > 0)
        .sort((a, b) => b.rate - a.rate);

      if (carrierStats.length === 0) {
        return 'No hay datos suficientes de transportadoras para analizar.';
      }

      const best = carrierStats[0];
      const worst = carrierStats[carrierStats.length - 1];

      return `📊 **Rendimiento por transportadora:**

🥇 **Mejor:** ${best.name}
   • ${best.total} guías | ${best.rate.toFixed(0)}% éxito

🥈 **Ranking completo:**
${carrierStats.map((c, i) => `   ${i + 1}. ${c.name}: ${c.rate.toFixed(0)}% (${c.delivered}/${c.total})`).join('\n')}

${worst.rate < 70 ? `\n⚠️ **Atención:** ${worst.name} tiene bajo rendimiento (${worst.rate.toFixed(0)}%). Considera evaluar alternativas.` : ''}

💡 **Recomendación:** Prioriza envíos con ${best.name} para zonas importantes.`;
    }

    if (lowerMessage.includes('patron') || lowerMessage.includes('problema')) {
      if (patrones.length === 0) {
        return '✅ No se han detectado patrones problemáticos significativos en tus envíos actuales.';
      }

      let response = `🔍 **Patrones detectados (${patrones.length}):**\n\n`;

      patrones.slice(0, 4).forEach((p, idx) => {
        const icon = p.impacto === 'CRITICO' ? '🔴' : p.impacto === 'ALTO' ? '🟠' : '🟡';
        response += `${icon} **${p.titulo}**\n`;
        response += `   ${p.descripcion}\n`;
        response += `   → ${p.recomendacion}\n\n`;
      });

      response += '💡 **Acción recomendada:** Enfócate primero en los patrones críticos para evitar más devoluciones.';

      return response;
    }

    // Default response
    return `Basándome en tu pregunta y los datos actuales:

${contexto.split('\n').slice(0, 8).join('\n')}

¿Puedes ser más específico? Puedo ayudarte con:
• Estado y resumen de guías
• Guías urgentes que atender
• Rendimiento de transportadoras
• Patrones y problemas detectados

Escribe tu pregunta o usa los botones de sugerencias rápidas.`;
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
