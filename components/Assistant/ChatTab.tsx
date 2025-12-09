import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Bot, User, Lightbulb, RefreshCw, Package, AlertTriangle, CheckCircle } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  knowledgeUsed?: string[];
}

interface ChatTabProps {
  shipmentsContext?: any[];
}

// Base de conocimiento local para respuestas inteligentes
const KNOWLEDGE_BASE: Record<string, { keywords: string[]; response: string; sources: string[] }> = {
  semaforo: {
    keywords: ['semaforo', 'semáforo', 'colores', 'verde', 'amarillo', 'rojo', 'naranja'],
    response: `El **Semáforo de Rutas** evalúa el rendimiento de cada ciudad/transportadora:

🟢 **VERDE** (Score ≥75): Ruta excelente, priorizar envíos
🟡 **AMARILLO** (Score 65-74): Ruta buena, monitorear
🟠 **NARANJA** (Score 50-64): Ruta con alertas, revisar
🔴 **ROJO** (Score <50): Ruta crítica, evitar o gestionar

El score se calcula con:
- 40% Tasa de entrega
- 30% Tiempo promedio
- 20% Volumen histórico
- 10% Consistencia

**Tip:** Sube un Excel con tus datos de entregas para ver el análisis completo.`,
    sources: ['Manual de Semáforo', 'Guía de Rutas']
  },
  novedad: {
    keywords: ['novedad', 'novedades', 'problema', 'devolución', 'devolucion', 'rechazado', 'no entregado'],
    response: `Para gestionar una **novedad** sigue estos pasos:

1. **Identificar el tipo:**
   - 📦 Dirección incorrecta
   - 📞 No contesta
   - 🚫 Rechazado
   - 💰 No tiene dinero
   - 🔄 Reprogramar

2. **Acciones recomendadas:**
   - Contactar al cliente vía WhatsApp
   - Verificar datos de entrega
   - Coordinar nueva fecha
   - Escalar a transportadora si es necesario

3. **En el sistema:**
   - Ve a Seguimiento → Busca la guía
   - Revisa el historial de eventos
   - Usa el botón de WhatsApp para contactar

**Tip:** Las guías con más de 3 días sin movimiento requieren atención urgente.`,
    sources: ['Proceso de Novedades', 'SLA Transportadoras']
  },
  seguimiento: {
    keywords: ['seguimiento', 'tracking', 'rastreo', 'rastrear', 'guía', 'guia', 'donde está', 'donde esta'],
    response: `Para hacer **seguimiento** de guías:

1. **Carga tus guías:**
   - Pestaña "Seguimiento"
   - Carga Excel o pega los datos
   - El sistema detecta automáticamente la transportadora

2. **Información disponible:**
   - 📍 Estado actual
   - 📅 Días en tránsito
   - 📱 Teléfono del cliente
   - 🚚 Transportadora
   - 📋 Historial de eventos

3. **Acciones rápidas:**
   - 📋 Copiar número de guía
   - 💬 Enviar WhatsApp al cliente
   - 📸 Capturar historial como imagen

**Colores de estado:**
- ✅ Verde: Entregado
- 🔵 Azul: En tránsito
- 🟣 Morado: En oficina
- 🔴 Rojo: Novedad`,
    sources: ['Guía de Seguimiento', 'Manual de Usuario']
  },
  prediccion: {
    keywords: ['predicción', 'prediccion', 'análisis', 'analisis', 'ia', 'inteligencia', 'machine learning', 'ml'],
    response: `El sistema de **Predicción IA** te ayuda a:

1. **Análisis de patrones:**
   - Detecta guías con riesgo de devolución
   - Identifica ciudades problemáticas
   - Sugiere mejores transportadoras

2. **Tablero de Alertas:**
   - Guías sin movimiento > 3 días
   - Rutas con baja tasa de entrega
   - Novedades recurrentes

3. **Recomendaciones:**
   - Qué transportadora usar por ciudad
   - Horarios óptimos de entrega
   - Clientes a contactar preventivamente

**Para usar:** Carga tus datos en Seguimiento y el sistema generará insights automáticamente.`,
    sources: ['Sistema ML', 'Análisis Predictivo']
  },
  proceso: {
    keywords: ['proceso', 'procesos', 'flujo', 'pasos', 'como', 'cómo'],
    response: `Los **procesos principales** de Litper son:

1. **📦 Gestión de Pedidos:**
   - Crear pedido → Asignar transportadora → Generar guía

2. **🚚 Seguimiento:**
   - Cargar guías → Monitorear estados → Gestionar novedades

3. **📊 Análisis:**
   - Subir Excel → Ver semáforo → Tomar decisiones

4. **💬 Comunicación:**
   - Chat en vivo → WhatsApp automático → Notificaciones

5. **📈 Reportes:**
   - Financiero → Rendimiento → Exportar

¿Sobre cuál proceso necesitas más información?`,
    sources: ['Manual de Procesos', 'Guía Operativa']
  },
  guias: {
    keywords: ['lista de guías', 'lista de guias', 'mis guías', 'mis guias', 'mostrar guías', 'mostrar guias', 'ver guías', 'ver guias'],
    response: `Para ver la **lista de guías** completa:

1. Ve a la pestaña **Seguimiento**
2. Ahí encontrarás todas las guías cargadas con:
   - Número de guía
   - Celular del cliente
   - Estado actual
   - Transportadora
   - Días en tránsito
   - Última actualización

**Filtros disponibles:**
- Por estado (Entregado, En tránsito, Novedad, etc.)
- Por transportadora
- Por búsqueda de texto

**Acciones:**
- Copiar datos
- Enviar WhatsApp
- Ver historial detallado
- Exportar a Excel`,
    sources: ['Sistema de Seguimiento']
  },
  transportadora: {
    keywords: ['transportadora', 'coordinadora', 'servientrega', 'interrapidisimo', 'envia', 'tcc', '472'],
    response: `**Transportadoras soportadas:**

🚚 **Coordinadora** - Cobertura nacional
🚚 **Servientrega** - Envíos express
🚚 **Inter Rapidísimo** - Económico
🚚 **Envía** - Buena cobertura urbana
🚚 **TCC** - Carga pesada
🚚 **472** - Envíos especiales

**Para comparar:**
- Ve al Semáforo y sube tu Excel
- El sistema te mostrará:
  - Tasa de entrega por transportadora
  - Tiempo promedio
  - Ciudades recomendadas

**Tip:** Usa varias transportadoras según la ciudad para optimizar entregas.`,
    sources: ['Directorio de Transportadoras', 'Análisis de Rendimiento']
  },
  conexiones: {
    keywords: ['conexion', 'conexión', 'integración', 'integracion', 'n8n', 'webhook', 'api', 'dropi', 'chatea'],
    response: `Las **Conexiones** permiten integrar Litper con:

🔌 **N8N** - Automatización de flujos
   - Configura tu URL de webhook
   - Recibe eventos automáticos

💬 **Chatea Pro** - WhatsApp Business
   - API Key + Webhook URL
   - Mensajes automáticos a clientes

🛒 **Dropi** - Dropshipping
   - API Key + Store ID
   - Sincronización de pedidos

**Webhooks de Litper:**
- /api/webhook/orden-nueva
- /api/webhook/estado-guia
- /api/webhook/novedad
- /api/webhook/chat-entrante

**Para configurar:** Ve a la pestaña Conexiones en el panel Admin.`,
    sources: ['Guía de Integraciones', 'API Documentation']
  }
};

// Función para encontrar la mejor respuesta
function findBestResponse(input: string, shipmentsContext?: any[]): { response: string; sources: string[] } {
  const lowerInput = input.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Buscar en la base de conocimiento
  for (const [key, data] of Object.entries(KNOWLEDGE_BASE)) {
    for (const keyword of data.keywords) {
      const normalizedKeyword = keyword.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (lowerInput.includes(normalizedKeyword)) {
        // Si piden lista de guías y hay contexto, agregar info
        if (key === 'guias' && shipmentsContext && shipmentsContext.length > 0) {
          const guiasList = shipmentsContext.slice(0, 10).map((s: any) => {
            const estado = s.status || 'Pendiente';
            const telefono = s.phone || 'Sin teléfono';
            return `• **${s.trackingNumber || s.id}** | ${telefono} | ${estado}`;
          }).join('\n');

          return {
            response: `📦 **Tienes ${shipmentsContext.length} guías cargadas:**\n\n${guiasList}${shipmentsContext.length > 10 ? `\n\n...y ${shipmentsContext.length - 10} más. Ve a Seguimiento para ver todas.` : ''}\n\n${data.response}`,
            sources: data.sources
          };
        }
        return { response: data.response, sources: data.sources };
      }
    }
  }

  // Respuesta por defecto
  return {
    response: `Entiendo tu pregunta. Aquí hay algunas cosas que puedo ayudarte:

📦 **Seguimiento** - "¿Cómo rastreo mis guías?"
🚦 **Semáforo** - "¿Cómo funciona el semáforo?"
📋 **Novedades** - "¿Cómo proceso una novedad?"
📊 **Predicciones** - "¿Qué análisis puedo hacer?"
🔌 **Conexiones** - "¿Cómo integro con N8N?"
🚚 **Transportadoras** - "¿Qué transportadoras hay?"

¿Sobre cuál tema necesitas información?`,
    sources: ['Asistente Litper']
  };
}

export const ChatTab: React.FC<ChatTabProps> = ({ shipmentsContext = [] }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `¡Hola! Soy el asistente de **Litper Logística** 🚀

Puedo ayudarte con:
• 📦 Seguimiento de guías
• 🚦 Uso del semáforo
• 📋 Gestión de novedades
• 📊 Análisis y predicciones
• 🔌 Configurar conexiones
• 🚚 Info de transportadoras

${shipmentsContext.length > 0 ? `\n📊 Tienes **${shipmentsContext.length} guías** cargadas. Pregúntame sobre ellas!\n` : ''}
¿En qué puedo ayudarte?`,
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([
    '¿Cómo funciona el semáforo?',
    '¿Cómo proceso una novedad?',
    'Mostrar mis guías',
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    // Simular delay de "pensando"
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

    // Obtener respuesta local inteligente
    const { response, sources } = findBestResponse(currentInput, shipmentsContext);

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response,
      timestamp: new Date(),
      knowledgeUsed: sources,
    };

    setMessages((prev) => [...prev, assistantMessage]);

    // Actualizar sugerencias basadas en el contexto
    updateSuggestions(currentInput);

    setIsLoading(false);
  };

  const updateSuggestions = (lastInput: string) => {
    const lowerInput = lastInput.toLowerCase();

    if (lowerInput.includes('semaforo') || lowerInput.includes('semáforo')) {
      setSuggestions(['¿Cómo interpreto los colores?', '¿Cómo subo un Excel?', '¿Qué es el score?']);
    } else if (lowerInput.includes('novedad')) {
      setSuggestions(['¿Cómo contacto al cliente?', '¿Cuándo escalar a transportadora?', 'Ver guías con novedad']);
    } else if (lowerInput.includes('guia') || lowerInput.includes('guía')) {
      setSuggestions(['¿Cómo exporto a Excel?', '¿Cómo envío WhatsApp?', 'Ver tablero de alertas']);
    } else {
      setSuggestions(['¿Cómo funciona el semáforo?', '¿Cómo proceso una novedad?', 'Ver mis guías']);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: '¡Chat reiniciado! ¿En qué puedo ayudarte?',
        timestamp: new Date(),
      },
    ]);
    setSuggestions(['¿Cómo funciona el semáforo?', '¿Cómo proceso una novedad?', 'Ver mis guías']);
  };

  // Renderizar contenido con formato markdown básico
  const renderContent = (content: string) => {
    return content.split('\n').map((line, i) => {
      // Negrita
      let formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // Código inline
      formattedLine = formattedLine.replace(/`(.*?)`/g, '<code class="bg-slate-200 dark:bg-navy-700 px-1 rounded">$1</code>');

      return (
        <span key={i} className="block" dangerouslySetInnerHTML={{ __html: formattedLine || '&nbsp;' }} />
      );
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`flex gap-2 max-w-[85%] ${
                message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              {/* Avatar */}
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gradient-to-br from-orange-500 to-amber-600 text-white'
                }`}
              >
                {message.role === 'user' ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>

              {/* Message bubble */}
              <div
                className={`rounded-2xl p-3 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-md'
                    : 'bg-slate-100 dark:bg-navy-800 text-slate-800 dark:text-slate-200 rounded-bl-md'
                }`}
              >
                <div className="text-sm whitespace-pre-wrap">
                  {renderContent(message.content)}
                </div>

                {/* Knowledge indicator */}
                {message.knowledgeUsed && message.knowledgeUsed.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-200 dark:border-navy-600">
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      Fuentes: {message.knowledgeUsed.join(', ')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-slate-100 dark:bg-navy-800 rounded-2xl rounded-bl-md p-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                  <span className="text-sm text-slate-500">Pensando...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && messages.length < 4 && (
        <div className="px-4 pb-2">
          <div className="flex items-center gap-2 mb-2 text-xs text-slate-500 dark:text-slate-400">
            <Lightbulb className="w-3 h-3" />
            <span>Sugerencias:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => handleSuggestionClick(suggestion)}
                className="px-3 py-1.5 text-xs bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/40 text-orange-600 dark:text-orange-400 rounded-full transition-colors border border-orange-200 dark:border-orange-800"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900">
        <div className="flex items-center gap-2">
          <button
            onClick={handleClearChat}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800 rounded-lg transition-colors"
            title="Reiniciar chat"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <div className="flex-1 flex items-center gap-2 bg-slate-100 dark:bg-navy-800 rounded-xl px-4 py-2 focus-within:ring-2 focus-within:ring-orange-500 transition-all">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Escribe tu pregunta..."
              className="flex-1 bg-transparent border-none outline-none text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className={`p-2 rounded-lg transition-all ${
                input.trim() && !isLoading
                  ? 'bg-orange-500 text-white hover:bg-orange-600'
                  : 'text-slate-400 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatTab;
