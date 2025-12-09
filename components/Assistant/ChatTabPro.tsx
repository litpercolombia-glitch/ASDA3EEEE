// ============================================
// LITPER PRO - CHAT TAB PROFESIONAL
// Asistente con base de conocimiento integrada
// ============================================

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send, Loader2, Bot, User, Lightbulb, RefreshCw, Package, Phone, Truck, MapPin,
  Clock, AlertTriangle, Brain, BookOpen, Sparkles, FileText, Database,
  ChevronDown, ChevronRight, Star, Zap, History, Search
} from 'lucide-react';
import { Shipment, ShipmentStatus } from '../../types';
import { documentProcessor, KnowledgeEntry, ProcessedDocument } from '../../services/documentProcessingService';
import Anthropic from '@anthropic-ai/sdk';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  knowledgeUsed?: KnowledgeEntry[];
  documentsUsed?: ProcessedDocument[];
  guias?: Shipment[];
  isThinking?: boolean;
}

interface ChatTabProProps {
  shipmentsContext?: Shipment[];
}

// API URL del backend
const API_BASE = import.meta.env.VITE_ML_API_URL || 'http://localhost:8000';

// ===========================================
// CONOCIMIENTO BASE INTEGRADO
// ===========================================
const CONOCIMIENTO_LITPER: Record<string, { respuesta: string; tags: string[] }> = {
  'semaforo': {
    respuesta: `**🚦 Sistema de Semáforo de Rutas LITPER PRO**

El semáforo clasifica las rutas según su tasa de éxito histórica:

🟢 **VERDE** (+75%): Ruta excelente
• Ideal para contraentrega
• Alta probabilidad de éxito
• Priorizar estos envíos

🟡 **AMARILLO** (65-75%): Buen rendimiento
• Monitorear tiempos de entrega
• Confirmar datos antes de enviar

🟠 **NARANJA** (50-65%): Alerta
• Confirmar datos del cliente obligatorio
• Considerar prepago parcial
• Seguimiento activo requerido

🔴 **ROJO** (<50%): Ruta crítica
• **EXIGIR PREPAGO OBLIGATORIO**
• Alto riesgo de devolución
• Evaluar si vale la pena enviar

**💡 Consejo:** Carga tu archivo Excel con datos históricos para calcular el semáforo automáticamente.`,
    tags: ['semaforo', 'rutas', 'entregas', 'exito', 'color']
  },

  'novedad': {
    respuesta: `**📋 Gestión de Novedades LITPER PRO**

**Proceso estándar de novedades:**

1️⃣ **IDENTIFICAR** (Inmediato)
   • Revisar estado en tracking
   • Clasificar tipo de novedad
   • Priorizar según urgencia

2️⃣ **CONTACTAR** (Máx. 24h)
   • Llamar al cliente
   • Si no contesta, WhatsApp
   • Máximo 3 intentos

3️⃣ **GESTIONAR** (Según caso)
   • Reprogramar entrega
   • Cambiar dirección
   • Autorizar devolución

4️⃣ **REGISTRAR** (Siempre)
   • Documentar acción tomada
   • Actualizar estado en sistema
   • Notificar al vendedor

**⚠️ Tipos de novedad críticos:**
• Dirección incorrecta → Contactar inmediato
• Cliente ausente → Reprogramar
• Rechazado → Evaluar devolución
• Zona de riesgo → Confirmar entrega segura`,
    tags: ['novedad', 'novedades', 'problemas', 'gestion', 'entrega']
  },

  'excel': {
    respuesta: `**📊 Carga de Archivos Excel**

**Formatos soportados:**
• .xlsx (Excel moderno)
• .xls (Excel clásico)

**Tipos de archivos:**

1️⃣ **Reporte de Semáforo**
   Columnas requeridas:
   • Ciudad
   • Entregas (exitosas)
   • Devoluciones
   • Total envíos

2️⃣ **Reporte Financiero (Dropi)**
   Columnas detectadas:
   • Valor Facturado
   • Ganancia
   • Estado Guía
   • Transportadora

3️⃣ **Lista de Guías**
   Columnas opcionales:
   • Número guía
   • Destinatario
   • Teléfono
   • Ciudad
   • Estado

**🚀 Proceso automático:**
1. Carga el archivo
2. Sistema detecta tipo
3. Análisis IA del contenido
4. Resumen y recomendaciones
5. Guardar en base de conocimiento`,
    tags: ['excel', 'archivo', 'cargar', 'xlsx', 'formato']
  },

  'predicciones': {
    respuesta: `**🔮 Sistema de Predicciones ML**

LITPER PRO usa Machine Learning para predecir éxito de entregas:

**Variables analizadas:**

📅 **Temporada**
• Navidad: +15% devoluciones
• Día de madre: +20% ventas
• Temporada de lluvias: -10% entregas

📆 **Día de la semana**
• Lunes-Miércoles: Mejor rendimiento
• Viernes: Entregas aceleradas
• Sábados: Variable por zona

🎉 **Festivos Colombia**
• 17 festivos nacionales
• Afecta tiempos de entrega
• Planificar con anticipación

📊 **Datos históricos**
• Rendimiento pasado de la ruta
• Comportamiento del cliente
• Historial de transportadora

**Resultado:**
• Probabilidad de éxito (%)
• Recomendación de acción
• Nivel de riesgo`,
    tags: ['prediccion', 'ml', 'inteligencia', 'artificial', 'machine', 'learning']
  },

  'transportadoras': {
    respuesta: `**🚚 Transportadoras Disponibles**

**Coordinadora**
• Cobertura: Nacional
• Fortaleza: Confiabilidad
• Tiempo: 2-4 días

**Inter Rapidísimo**
• Cobertura: Nacional
• Fortaleza: Velocidad
• Tiempo: 1-3 días

**Envía**
• Cobertura: Nacional
• Fortaleza: Precio
• Tiempo: 3-5 días

**TCC**
• Cobertura: Nacional
• Fortaleza: Carga pesada
• Tiempo: 2-4 días

**Servientrega**
• Cobertura: Amplia
• Fortaleza: Puntos de recogida
• Tiempo: 2-4 días

**💡 Usa el semáforo para ver rendimiento por ciudad de cada transportadora.**`,
    tags: ['transportadora', 'envio', 'coordinadora', 'interrapidisimo', 'tcc', 'envia']
  },

  'dropi': {
    respuesta: `**💰 Integración con Dropi**

LITPER PRO se conecta con Dropi para:

**Funciones disponibles:**
• Importar pedidos automáticamente
• Sincronizar estados de guías
• Descargar reportes financieros
• Calcular ganancias en tiempo real

**Reporte Financiero:**
Columnas que analizamos:
• Valor Facturado
• Precio Flete
• Ganancia
• Estado de Guía
• Transportadora

**Métricas calculadas:**
• Ventas totales
• Ganancia neta
• Margen de utilidad
• Tasa de entrega
• Tasa de devolución
• Ticket promedio

**📊 Carga tu reporte Excel de Dropi para análisis completo.**`,
    tags: ['dropi', 'dropshipping', 'financiero', 'ganancia', 'reporte']
  },

  'ayuda': {
    respuesta: `**🤖 Asistente LITPER PRO**

Soy tu asistente inteligente con acceso a:

**📚 Base de Conocimiento**
• Procesos y procedimientos
• Mejores prácticas
• Documentos procesados

**🔧 Funciones disponibles:**
• "Lista de guías" - Ver tus envíos
• "Guías pendientes" - Sin entregar
• "Guías con novedad" - Problemas
• "Semáforo" - Sistema de rutas
• "Novedades" - Gestión de problemas
• "Predicciones" - ML y análisis

**💡 Puedo ayudarte con:**
• Consultas sobre logística
• Análisis de documentos
• Recomendaciones basadas en datos
• Explicar funciones de la app

**Pregúntame lo que necesites!**`,
    tags: ['ayuda', 'help', 'funciones', 'comandos']
  }
};

// Detectar intención del usuario
const detectarIntencion = (mensaje: string): { tipo: string; query?: string; tema?: string } => {
  const msgLower = mensaje.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Buscar en conocimiento base
  for (const [tema, info] of Object.entries(CONOCIMIENTO_LITPER)) {
    if (info.tags.some(tag => msgLower.includes(tag))) {
      return { tipo: 'CONOCIMIENTO', tema };
    }
  }

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

  // Buscar documentos procesados
  if (msgLower.includes('documento') || msgLower.includes('archivo') || msgLower.includes('procesado')) {
    return { tipo: 'BUSCAR_DOCUMENTOS' };
  }

  // Buscar en base de conocimiento
  if (msgLower.includes('conocimiento') || msgLower.includes('aprendido') || msgLower.includes('base')) {
    return { tipo: 'BUSCAR_CONOCIMIENTO' };
  }

  return { tipo: 'GENERAL' };
};

// Generar respuesta usando IA si está disponible
const generarRespuestaIA = async (
  mensaje: string,
  contexto: {
    shipments: Shipment[];
    knowledge: KnowledgeEntry[];
    documents: ProcessedDocument[];
  }
): Promise<{ content: string; knowledgeUsed?: KnowledgeEntry[]; documentsUsed?: ProcessedDocument[] }> => {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

  if (!apiKey) {
    // Fallback a respuesta local
    return generarRespuestaLocal(mensaje, contexto);
  }

  try {
    const anthropic = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

    // Buscar conocimiento relevante
    const relevantKnowledge = documentProcessor.searchKnowledge(mensaje).slice(0, 3);
    const relevantDocs = contexto.documents.filter(d =>
      d.rawContent.toLowerCase().includes(mensaje.toLowerCase().split(' ')[0])
    ).slice(0, 2);

    // Construir contexto
    let contextInfo = '';
    if (relevantKnowledge.length > 0) {
      contextInfo += '\n\nCONOCIMIENTO RELEVANTE:\n';
      relevantKnowledge.forEach(k => {
        contextInfo += `- ${k.title}: ${k.summary}\n`;
      });
    }
    if (relevantDocs.length > 0) {
      contextInfo += '\n\nDOCUMENTOS RELEVANTES:\n';
      relevantDocs.forEach(d => {
        if (d.aiAnalysis) {
          contextInfo += `- ${d.fileName}: ${d.aiAnalysis.summary}\n`;
        }
      });
    }
    if (contexto.shipments.length > 0) {
      const stats = {
        total: contexto.shipments.length,
        delivered: contexto.shipments.filter(s => s.status === ShipmentStatus.DELIVERED).length,
        pending: contexto.shipments.filter(s => s.status !== ShipmentStatus.DELIVERED).length,
        issues: contexto.shipments.filter(s => s.status === ShipmentStatus.ISSUE).length,
      };
      contextInfo += `\n\nESTADÍSTICAS DE GUÍAS: ${stats.total} total, ${stats.delivered} entregadas, ${stats.pending} pendientes, ${stats.issues} con novedad`;
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: `Eres el asistente virtual de LITPER PRO, una plataforma de gestión logística para dropshipping en Colombia.
Tu rol es ayudar a los usuarios con:
- Consultas sobre sus envíos y guías
- Explicar procesos de logística
- Dar recomendaciones basadas en datos
- Responder preguntas sobre la plataforma

Responde siempre en español, de manera concisa y profesional.
Usa markdown para formatear tus respuestas.
Si tienes contexto relevante, úsalo para dar respuestas más precisas.
${contextInfo}`,
      messages: [{ role: 'user', content: mensaje }]
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';

    return {
      content: text,
      knowledgeUsed: relevantKnowledge.length > 0 ? relevantKnowledge : undefined,
      documentsUsed: relevantDocs.length > 0 ? relevantDocs : undefined
    };
  } catch (error) {
    console.error('Error con IA:', error);
    return generarRespuestaLocal(mensaje, contexto);
  }
};

// Generar respuesta local (fallback)
const generarRespuestaLocal = (
  mensaje: string,
  contexto: {
    shipments: Shipment[];
    knowledge: KnowledgeEntry[];
    documents: ProcessedDocument[];
  }
): { content: string; knowledgeUsed?: KnowledgeEntry[]; documentsUsed?: ProcessedDocument[] } => {
  const intencion = detectarIntencion(mensaje);

  switch (intencion.tipo) {
    case 'CONOCIMIENTO':
      if (intencion.tema && CONOCIMIENTO_LITPER[intencion.tema]) {
        return { content: CONOCIMIENTO_LITPER[intencion.tema].respuesta };
      }
      break;

    case 'LISTAR_TODAS_GUIAS':
      if (contexto.shipments.length === 0) {
        return { content: '📦 No tienes guías cargadas actualmente.\n\nPuedes cargar un archivo Excel o agregar guías manualmente desde la pestaña de Seguimiento.' };
      }
      return {
        content: `**📦 Lista de Guías (${contexto.shipments.length} total)**\n\nAquí están tus guías actuales:`,
      };

    case 'LISTAR_GUIAS_PENDIENTES':
      const pendientes = contexto.shipments.filter(s => s.status !== ShipmentStatus.DELIVERED);
      if (pendientes.length === 0) {
        return { content: '✅ ¡Excelente! No tienes guías pendientes. Todas han sido entregadas.' };
      }
      return {
        content: `**⏳ Guías Pendientes (${pendientes.length})**\n\nEstas guías aún no se han entregado:`,
      };

    case 'LISTAR_GUIAS_NOVEDAD':
      const conNovedad = contexto.shipments.filter(s => s.status === ShipmentStatus.ISSUE);
      if (conNovedad.length === 0) {
        return { content: '✅ ¡Bien! No tienes guías con novedad actualmente.' };
      }
      return {
        content: `**⚠️ Guías con Novedad (${conNovedad.length})**\n\nEstas guías requieren atención inmediata:`,
      };

    case 'LISTAR_GUIAS_ENTREGADAS':
      const entregadas = contexto.shipments.filter(s => s.status === ShipmentStatus.DELIVERED);
      if (entregadas.length === 0) {
        return { content: '📊 No tienes guías entregadas registradas aún.' };
      }
      return {
        content: `**✅ Guías Entregadas (${entregadas.length})**\n\n¡Buen trabajo!`,
      };

    case 'BUSCAR_GUIA':
      const guia = contexto.shipments.find(s => s.id.includes(intencion.query || ''));
      if (guia) {
        return { content: `**📦 Guía encontrada:**` };
      }
      return { content: `❌ No encontré ninguna guía con el número "${intencion.query}".` };

    case 'BUSCAR_DOCUMENTOS':
      if (contexto.documents.length === 0) {
        return { content: '📄 No hay documentos procesados aún.\n\nVe al **Panel Admin Pro** para cargar y procesar archivos Excel o URLs.' };
      }
      const docList = contexto.documents.slice(0, 5).map(d =>
        `• **${d.fileName}** - ${d.aiAnalysis?.summary || 'Sin análisis'}`
      ).join('\n');
      return {
        content: `**📄 Documentos Procesados (${contexto.documents.length})**\n\n${docList}`,
        documentsUsed: contexto.documents.slice(0, 3)
      };

    case 'BUSCAR_CONOCIMIENTO':
      if (contexto.knowledge.length === 0) {
        return { content: '📚 La base de conocimiento está vacía.\n\nProcesa documentos y guárdalos en la base de conocimiento desde el Panel Admin Pro.' };
      }
      const knowledgeList = contexto.knowledge.slice(0, 5).map(k =>
        `• **${k.title}** - ${k.summary}`
      ).join('\n');
      return {
        content: `**📚 Base de Conocimiento (${contexto.knowledge.length} entradas)**\n\n${knowledgeList}`,
        knowledgeUsed: contexto.knowledge.slice(0, 3)
      };

    default:
      // Buscar en base de conocimiento
      const searchResults = documentProcessor.searchKnowledge(mensaje);
      if (searchResults.length > 0) {
        return {
          content: `Encontré información relevante:\n\n**${searchResults[0].title}**\n\n${searchResults[0].content}`,
          knowledgeUsed: [searchResults[0]]
        };
      }

      return {
        content: `🤖 Entiendo tu pregunta. Puedo ayudarte con:\n\n` +
          `• **"Semáforo"** - Sistema de rutas\n` +
          `• **"Novedades"** - Gestión de problemas\n` +
          `• **"Predicciones"** - ML y análisis\n` +
          `• **"Lista de guías"** - Ver envíos\n` +
          `• **"Documentos"** - Ver procesados\n` +
          `• **"Ayuda"** - Todas las opciones\n\n` +
          `¿Qué información necesitas?`
      };
  }

  return { content: CONOCIMIENTO_LITPER['ayuda'].respuesta };
};

export const ChatTabPro: React.FC<ChatTabProProps> = ({ shipmentsContext = [] }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `**🤖 Bienvenido al Asistente LITPER PRO**

Soy tu asistente inteligente con acceso a:
• 📚 Base de conocimiento
• 📄 Documentos procesados
• 📊 Datos de tus guías

**¿En qué puedo ayudarte hoy?**`,
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [showContext, setShowContext] = useState(false);

  const suggestions = [
    { icon: '🚦', text: '¿Cómo funciona el semáforo?' },
    { icon: '📋', text: '¿Cómo proceso una novedad?' },
    { icon: '🔮', text: '¿Cómo funcionan las predicciones?' },
    { icon: '📊', text: 'Ver documentos procesados' },
  ];

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Obtener contexto
  const knowledge = documentProcessor.getKnowledge();
  const documents = documentProcessor.getProcessedDocuments();

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
    setInput('');
    setIsLoading(true);
    setShowSuggestions(false);

    try {
      // Primero intentar con el backend
      const response = await fetch(`${API_BASE}/api/assistant/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mensaje: input,
          usar_conocimiento: true,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.respuesta,
          timestamp: new Date(),
          knowledgeUsed: data.conocimiento_usado,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        throw new Error('Backend no disponible');
      }
    } catch {
      // Fallback a IA local o respuestas locales
      const localResponse = await generarRespuestaIA(input, {
        shipments: shipmentsContext,
        knowledge,
        documents,
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: localResponse.content,
        timestamp: new Date(),
        knowledgeUsed: localResponse.knowledgeUsed,
        documentsUsed: localResponse.documentsUsed,
      };
      setMessages((prev) => [...prev, assistantMessage]);
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
        content: '🔄 Chat reiniciado. ¿En qué puedo ayudarte?',
        timestamp: new Date(),
      },
    ]);
    setShowSuggestions(true);
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 to-blue-50 dark:from-navy-950 dark:to-navy-900">
      {/* Header con contexto */}
      <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Asistente LITPER PRO</h3>
              <p className="text-sm text-white/80">Con IA y Base de Conocimiento</p>
            </div>
          </div>
          <button
            onClick={() => setShowContext(!showContext)}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            title="Ver contexto"
          >
            <Database className="w-5 h-5" />
          </button>
        </div>

        {/* Panel de contexto expandible */}
        {showContext && (
          <div className="mt-4 p-3 bg-white/10 rounded-xl grid grid-cols-3 gap-3 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold">{shipmentsContext.length}</div>
              <div className="text-white/70">Guías</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{documents.length}</div>
              <div className="text-white/70">Documentos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{knowledge.length}</div>
              <div className="text-white/70">Conocimiento</div>
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`flex gap-3 max-w-[90%] ${
                message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              {/* Avatar */}
              <div
                className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center shadow-lg ${
                  message.role === 'user'
                    ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                    : 'bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 text-white'
                }`}
              >
                {message.role === 'user' ? (
                  <User className="w-5 h-5" />
                ) : (
                  <Sparkles className="w-5 h-5" />
                )}
              </div>

              {/* Message bubble */}
              <div
                className={`rounded-2xl p-4 shadow-sm ${
                  message.role === 'user'
                    ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-md'
                    : 'bg-white dark:bg-navy-800 text-slate-800 dark:text-slate-200 rounded-bl-md border border-slate-100 dark:border-navy-700'
                }`}
              >
                <div className="text-sm whitespace-pre-wrap prose prose-sm dark:prose-invert max-w-none">
                  {message.content.split('\n').map((line, i) => (
                    <React.Fragment key={i}>
                      {line.startsWith('**') && line.endsWith('**') ? (
                        <strong>{line.replace(/\*\*/g, '')}</strong>
                      ) : line.startsWith('• ') ? (
                        <div className="flex gap-2 ml-2">
                          <span>•</span>
                          <span>{line.substring(2)}</span>
                        </div>
                      ) : (
                        line
                      )}
                      {i < message.content.split('\n').length - 1 && <br />}
                    </React.Fragment>
                  ))}
                </div>

                {/* Knowledge indicator */}
                {message.knowledgeUsed && message.knowledgeUsed.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-navy-600">
                    <div className="flex items-center gap-2 text-xs text-purple-600 dark:text-purple-400">
                      <BookOpen className="w-4 h-4" />
                      <span className="font-medium">
                        Basado en {message.knowledgeUsed.length} fuente(s) de conocimiento
                      </span>
                    </div>
                  </div>
                )}

                {/* Documents indicator */}
                {message.documentsUsed && message.documentsUsed.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-200 dark:border-navy-600">
                    <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                      <FileText className="w-4 h-4" />
                      <span className="font-medium">
                        Usando {message.documentsUsed.length} documento(s) procesado(s)
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                <Sparkles className="w-5 h-5 text-white animate-pulse" />
              </div>
              <div className="bg-white dark:bg-navy-800 rounded-2xl rounded-bl-md p-4 border border-slate-100 dark:border-navy-700 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-sm text-slate-500">Analizando con IA...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {showSuggestions && messages.length < 3 && (
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 mb-3 text-sm text-slate-500 dark:text-slate-400">
            <Lightbulb className="w-4 h-4 text-yellow-500" />
            <span className="font-medium">Sugerencias rápidas:</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => handleSuggestionClick(suggestion.text)}
                className="flex items-center gap-2 px-4 py-3 text-sm bg-white dark:bg-navy-800 hover:bg-slate-50 dark:hover:bg-navy-700 text-slate-700 dark:text-slate-300 rounded-xl transition-all border border-slate-200 dark:border-navy-600 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-sm text-left"
              >
                <span className="text-lg">{suggestion.icon}</span>
                <span className="text-xs">{suggestion.text}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900">
        <div className="flex items-center gap-3">
          <button
            onClick={handleClearChat}
            className="p-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800 rounded-xl transition-all"
            title="Reiniciar chat"
          >
            <RefreshCw className="w-5 h-5" />
          </button>

          <div className="flex-1 flex items-center gap-3 bg-slate-100 dark:bg-navy-800 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-purple-500 transition-all">
            <Search className="w-5 h-5 text-slate-400" />
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
              className={`p-2 rounded-xl transition-all ${
                input.trim() && !isLoading
                  ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:shadow-lg hover:scale-105'
                  : 'text-slate-400 cursor-not-allowed'
              }`}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatTabPro;
