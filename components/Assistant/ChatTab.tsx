import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Loader2, Bot, User, Lightbulb, RefreshCw, Package, Phone, Truck, MapPin, Clock, AlertTriangle } from 'lucide-react';
import { Shipment, ShipmentStatus, CarrierName } from '../../types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  knowledgeUsed?: string[];
  guias?: Shipment[]; // Para mostrar lista de guías
}

interface ChatTabProps {
  shipmentsContext?: Shipment[];
}

// API URL del backend
const API_BASE = import.meta.env.VITE_ML_API_URL || 'http://localhost:8000';

// ===========================================
// RESPUESTAS LOCALES INTELIGENTES
// ===========================================
const RESPUESTAS_LOCALES: Record<string, string> = {
  'hola': 'Hola! Soy el asistente de Litper. Estoy aqui para ayudarte con:\n\n- Consultar tus guias y envios\n- Explicar procesos de logistica\n- Resolver dudas sobre la app\n\nQue necesitas?',
  'ayuda': 'Claro! Puedo ayudarte con:\n\n**Guias:**\n- "Lista de guias" - Ver todas tus guias\n- "Guias pendientes" - Ver guias sin entregar\n- "Guias con novedad" - Ver guias problemáticas\n\n**Procesos:**\n- "Como funciona el semaforo?"\n- "Como proceso una novedad?"\n- "Como cargo un archivo Excel?"\n\nQue quieres saber?',
  'semaforo': '**Sistema de Semaforo de Rutas**\n\nEl semaforo clasifica las rutas segun su tasa de exito:\n\n🟢 **VERDE** (+75%): Ruta excelente, ideal para contraentrega\n🟡 **AMARILLO** (65-75%): Buen rendimiento, monitorear tiempos\n🟠 **NARANJA** (50-65%): Alerta, confirmar datos del cliente\n🔴 **ROJO** (<50%): Critica, exigir PREPAGO obligatorio\n\nSube un archivo Excel con datos de entregas y devoluciones para calcular el semaforo de cada ruta.',
  'novedad': '**Proceso de Novedades**\n\n1. **Identificar** - Revisar el estado de la guia en tracking\n2. **Contactar** - Llamar al cliente para coordinar\n3. **Gestionar** - Reprogramar entrega o devolver\n4. **Registrar** - Documentar la accion tomada\n\n**Tips:**\n- Contacta al cliente maximo 24h despues de la novedad\n- Usa WhatsApp para coordinar entregas\n- Si no contesta en 3 intentos, considerar devolucion',
  'excel': '**Cargar Archivo Excel**\n\n1. Ve a la pestaña "Semaforo" o "Modo Admin"\n2. Haz clic en "Cargar Archivo"\n3. Selecciona tu Excel con formato:\n   - Hoja 1: Tasa de entregas (tabla pivote)\n   - Hoja 2: Tiempo promedio\n\n**Columnas requeridas:**\n- Ciudad\n- Transportadora\n- Entregas\n- Devoluciones\n- Total',
  'transportadora': '**Transportadoras Disponibles**\n\n- **Coordinadora**: Alta confiabilidad, tiempos estables\n- **Inter Rapidisimo**: Buena cobertura nacional\n- **Envia**: Precios competitivos\n- **TCC**: Especializado en carga pesada\n- **Veloces**: Rapido en zonas urbanas\n\nConsulta el semaforo para ver el rendimiento por ciudad.',
  'predicciones': '**Sistema de Predicciones ML**\n\nNuestro sistema analiza:\n\n- 📅 **Temporada**: Navidad, lluvias, etc.\n- 📆 **Dia de semana**: Impacto de fines de semana\n- 🎉 **Festivos**: Colombia tiene 17 festivos\n- 📊 **Historico**: Rendimiento pasado de la ruta\n\nEl ML calcula la probabilidad de exito para cada envio.',
  'proceso': '**Procesos Principales de Litper**\n\n1. **Seguimiento de Guias** - Monitorear estado de envios\n2. **Novedades** - Resolver problemas de entrega\n3. **Semaforo** - Evaluar rutas por rendimiento\n4. **Predicciones** - Estimar probabilidad de exito\n5. **Chat en Vivo** - Atender clientes por WhatsApp\n6. **Modo Admin** - Gestion avanzada del sistema',
};

// Detectar intención del usuario
const detectarIntencion = (mensaje: string): { tipo: string; query?: string } => {
  const msgLower = mensaje.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Intenciones de listar guías
  if (msgLower.includes('lista') || msgLower.includes('guias') || msgLower.includes('envios') || msgLower.includes('pedidos')) {
    if (msgLower.includes('pendiente') || msgLower.includes('sin entregar')) {
      return { tipo: 'LISTAR_GUIAS_PENDIENTES' };
    }
    if (msgLower.includes('novedad') || msgLower.includes('problema')) {
      return { tipo: 'LISTAR_GUIAS_NOVEDAD' };
    }
    if (msgLower.includes('entregad')) {
      return { tipo: 'LISTAR_GUIAS_ENTREGADAS' };
    }
    return { tipo: 'LISTAR_TODAS_GUIAS' };
  }

  // Buscar guía específica
  const guiaMatch = msgLower.match(/guia\s*[:#]?\s*(\d+)/);
  if (guiaMatch) {
    return { tipo: 'BUSCAR_GUIA', query: guiaMatch[1] };
  }

  // Otras intenciones
  for (const keyword of Object.keys(RESPUESTAS_LOCALES)) {
    if (msgLower.includes(keyword)) {
      return { tipo: 'RESPUESTA_LOCAL', query: keyword };
    }
  }

  return { tipo: 'GENERAL' };
};

// Generar respuesta local inteligente
const generarRespuestaLocal = (mensaje: string, shipments: Shipment[]): { content: string; guias?: Shipment[] } => {
  const intencion = detectarIntencion(mensaje);

  switch (intencion.tipo) {
    case 'LISTAR_TODAS_GUIAS':
      if (shipments.length === 0) {
        return { content: 'No tienes guias cargadas actualmente. Carga un archivo Excel o agrega guias manualmente.' };
      }
      return {
        content: `**Lista de Guias (${shipments.length} total)**\n\nAqui estan tus guias:`,
        guias: shipments.slice(0, 20)
      };

    case 'LISTAR_GUIAS_PENDIENTES':
      const pendientes = shipments.filter(s => s.status !== ShipmentStatus.DELIVERED);
      if (pendientes.length === 0) {
        return { content: 'No tienes guias pendientes. Todas han sido entregadas!' };
      }
      return {
        content: `**Guias Pendientes (${pendientes.length})**\n\nEstas guias aun no se han entregado:`,
        guias: pendientes.slice(0, 20)
      };

    case 'LISTAR_GUIAS_NOVEDAD':
      const conNovedad = shipments.filter(s => s.status === ShipmentStatus.ISSUE);
      if (conNovedad.length === 0) {
        return { content: 'No tienes guias con novedad actualmente.' };
      }
      return {
        content: `**Guias con Novedad (${conNovedad.length})**\n\nEstas guias requieren atencion:`,
        guias: conNovedad.slice(0, 20)
      };

    case 'LISTAR_GUIAS_ENTREGADAS':
      const entregadas = shipments.filter(s => s.status === ShipmentStatus.DELIVERED);
      if (entregadas.length === 0) {
        return { content: 'No tienes guias entregadas registradas.' };
      }
      return {
        content: `**Guias Entregadas (${entregadas.length})**`,
        guias: entregadas.slice(0, 20)
      };

    case 'BUSCAR_GUIA':
      const guia = shipments.find(s => s.id.includes(intencion.query || ''));
      if (guia) {
        return {
          content: `**Guia encontrada:**`,
          guias: [guia]
        };
      }
      return { content: `No encontre ninguna guia con el numero "${intencion.query}".` };

    case 'RESPUESTA_LOCAL':
      return { content: RESPUESTAS_LOCALES[intencion.query || 'ayuda'] };

    default:
      return {
        content: 'Entiendo tu pregunta. Puedo ayudarte con:\n\n- **"Lista de guias"** - Ver tus envios\n- **"Guias pendientes"** - Ver sin entregar\n- **"Como funciona el semaforo?"** - Info del sistema\n- **"Ayuda"** - Ver todas las opciones\n\nQue necesitas?'
      };
  }
};

export const ChatTab: React.FC<ChatTabProps> = ({ shipmentsContext = [] }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hola! Soy el asistente de Litper. Puedo ayudarte con:\n\n- Como usar la app\n- Procesos de logistica\n- Resolver tus dudas\n- Ejecutar acciones\n\nQue necesitas?',
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([
    'Como funciona el semaforo?',
    'Como proceso una novedad?',
    'Cuales son los procesos principales?',
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getCurrentScreen = (): string => {
    // Detectar pantalla actual basado en URL o estado
    const path = window.location.pathname;
    if (path.includes('seguimiento')) return 'seguimiento';
    if (path.includes('novedades')) return 'novedades';
    if (path.includes('semaforo')) return 'semaforo';
    if (path.includes('pedidos')) return 'pedidos';
    return 'home';
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Preparar historial para la API
      const historial = messages.slice(-10).map((m) => ({
        rol: m.role === 'user' ? 'user' : 'assistant',
        contenido: m.content,
      }));

      const response = await fetch(`${API_BASE}/api/assistant/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mensaje: input,
          conversacion_id: conversationId,
          pantalla_actual: getCurrentScreen(),
          historial,
          usar_conocimiento: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Error en la respuesta');
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.respuesta,
        timestamp: new Date(),
        knowledgeUsed: data.conocimiento_usado,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setConversationId(data.conversacion_id);

      // Actualizar sugerencias si hay
      if (data.sugerencias && data.sugerencias.length > 0) {
        setSuggestions(data.sugerencias);
      }
    } catch (error) {
      console.error('Error conectando con servidor:', error);

      // Fallback inteligente usando respuestas locales
      const localResponse = generarRespuestaLocal(input, shipmentsContext);

      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: localResponse.content,
        timestamp: new Date(),
        guias: localResponse.guias,
      };
      setMessages((prev) => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
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
        content: 'Chat reiniciado. En que puedo ayudarte?',
        timestamp: new Date(),
      },
    ]);
    setConversationId(null);
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
                    : 'bg-gradient-to-br from-purple-500 to-blue-600 text-white'
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
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                {/* Lista de guías si existen */}
                {message.guias && message.guias.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {message.guias.map((guia) => (
                      <GuiaCard key={guia.id} guia={guia} />
                    ))}
                    {message.guias.length >= 20 && (
                      <p className="text-xs text-slate-500 text-center mt-2">
                        Mostrando las primeras 20 guias...
                      </p>
                    )}
                  </div>
                )}

                {/* Knowledge indicator */}
                {message.knowledgeUsed && message.knowledgeUsed.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-200 dark:border-navy-600">
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <BookIcon className="w-3 h-3" />
                      Basado en {message.knowledgeUsed.length} fuentes
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
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-slate-100 dark:bg-navy-800 rounded-2xl rounded-bl-md p-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <span className="text-sm text-slate-500">Pensando...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && messages.length < 3 && (
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
                className="px-3 py-1.5 text-xs bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-slate-600 dark:text-slate-300 rounded-full transition-colors"
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

          <div className="flex-1 flex items-center gap-2 bg-slate-100 dark:bg-navy-800 rounded-xl px-4 py-2 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
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
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
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

// Componente de tarjeta de guía
const GuiaCard: React.FC<{ guia: Shipment }> = ({ guia }) => {
  const getStatusColor = (status: ShipmentStatus) => {
    switch (status) {
      case ShipmentStatus.DELIVERED:
        return 'bg-emerald-100 text-emerald-700 border-emerald-300';
      case ShipmentStatus.IN_TRANSIT:
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case ShipmentStatus.IN_OFFICE:
        return 'bg-purple-100 text-purple-700 border-purple-300';
      case ShipmentStatus.ISSUE:
        return 'bg-red-100 text-red-700 border-red-300';
      case ShipmentStatus.PENDING:
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const handleWhatsApp = () => {
    if (guia.phone) {
      const message = encodeURIComponent(
        `Hola! Le escribo de Litper sobre su pedido con guia ${guia.id}. Estado actual: ${guia.status}. Podemos coordinar la entrega?`
      );
      window.open(`https://wa.me/57${guia.phone}?text=${message}`, '_blank');
    }
  };

  return (
    <div className="bg-white dark:bg-navy-900 rounded-lg p-3 border border-slate-200 dark:border-navy-700 text-left">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <Package className="w-4 h-4 text-slate-500 flex-shrink-0" />
          <span className="font-mono font-bold text-slate-800 dark:text-white text-sm truncate">
            {guia.id}
          </span>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusColor(guia.status)}`}>
          {guia.status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        {guia.phone && (
          <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
            <Phone className="w-3 h-3" />
            <span>{guia.phone}</span>
            <button
              onClick={handleWhatsApp}
              className="ml-1 p-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
              title="WhatsApp"
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </button>
          </div>
        )}
        {guia.carrier && (
          <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
            <Truck className="w-3 h-3" />
            <span>{guia.carrier}</span>
          </div>
        )}
        {guia.detailedInfo?.destination && (
          <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400 col-span-2">
            <MapPin className="w-3 h-3" />
            <span className="truncate">{guia.detailedInfo.destination}</span>
          </div>
        )}
        {guia.detailedInfo?.daysInTransit !== undefined && (
          <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
            <Clock className="w-3 h-3" />
            <span>{guia.detailedInfo.daysInTransit} dias</span>
          </div>
        )}
      </div>

      {/* Último evento */}
      {guia.detailedInfo?.events && guia.detailedInfo.events.length > 0 && (
        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-navy-700">
          <p className="text-[10px] text-slate-500 truncate">
            {guia.detailedInfo.events[guia.detailedInfo.events.length - 1].description}
          </p>
        </div>
      )}
    </div>
  );
};

// Mini icon component
const BookIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

export default ChatTab;
