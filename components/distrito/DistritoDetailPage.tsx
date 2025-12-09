/**
 * 🏢 DistritoDetailPage - Página de detalle de distrito con chat inteligente
 * Cada distrito se abre en una nueva pestaña con su propio asistente IA
 */

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  Bot,
  Send,
  ArrowLeft,
  Sparkles,
  RefreshCw,
  Trash2,
  Package,
  AlertTriangle,
  TrendingUp,
  Clock,
  ChevronRight,
  Loader2,
  FileBarChart,
  Activity,
  MapPin,
  Phone,
  MessageCircle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Table,
  List,
  Search,
  Filter,
  Download,
  Eye,
  Zap,
  Target,
  Users,
  Brain,
  Settings,
  Play,
  Pause,
  BarChart3,
  PieChart,
  Truck,
  Building2,
  Globe,
  HelpCircle,
  Copy,
  Share2,
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

// Tipos
interface MensajeChat {
  id: string;
  rol: 'user' | 'assistant' | 'system';
  contenido: string;
  timestamp: Date;
  tipo?: 'texto' | 'tabla' | 'lista' | 'accion' | 'guias';
  datos?: any;
  acciones?: AccionRapida[];
}

interface AccionRapida {
  id: string;
  label: string;
  icon: string;
  comando: string;
  tipo: 'info' | 'accion' | 'navegacion';
}

interface GuiaInfo {
  id: string;
  estado: string;
  transportadora: string;
  ciudad: string;
  telefono?: string;
  diasTransito: number;
  nivelRiesgo: 'BAJO' | 'MEDIO' | 'ALTO' | 'CRITICO';
  ultimaActualizacion: string;
}

interface DistritoConfig {
  id: string;
  nombre: string;
  icono: string;
  color: string;
  colorBg: string;
  descripcion: string;
  procesos: string[];
  capacidades: string[];
}

interface DistritoDetailPageProps {
  distritoId: string;
  paisSeleccionado: string;
  onClose?: () => void;
}

// Configuración de distritos
const DISTRITOS_CONFIG: Record<string, DistritoConfig> = {
  tracking: {
    id: 'tracking',
    nombre: 'Distrito de Rastreo',
    icono: '📦',
    color: 'from-blue-500 to-cyan-600',
    colorBg: 'bg-blue-50 dark:bg-blue-900/20',
    descripcion: 'Seguimiento de guías y rastreo en tiempo real',
    procesos: ['P01: Seguimiento de Guías'],
    capacidades: ['Rastrear guías', 'Detectar retrasos', 'Notificar estados', 'Crear tickets'],
  },
  orders: {
    id: 'orders',
    nombre: 'Distrito de Pedidos',
    icono: '🛒',
    color: 'from-green-500 to-emerald-600',
    colorBg: 'bg-green-50 dark:bg-green-900/20',
    descripcion: 'Gestión de pedidos y procesamiento de órdenes',
    procesos: ['P05: Generación de Pedidos'],
    capacidades: ['Crear pedidos', 'Validar datos', 'Procesar órdenes', 'Gestionar inventario'],
  },
  crisis: {
    id: 'crisis',
    nombre: 'Distrito de Crisis',
    icono: '🚨',
    color: 'from-red-500 to-orange-600',
    colorBg: 'bg-red-50 dark:bg-red-900/20',
    descripcion: 'Manejo de novedades y resolución de problemas',
    procesos: ['P02: Novedades', 'P03: Reclamo en Oficina'],
    capacidades: ['Resolver novedades', 'Gestionar reclamos', 'Escalar casos', 'Coordinar entregas'],
  },
  communications: {
    id: 'communications',
    nombre: 'Distrito de Comunicaciones',
    icono: '💬',
    color: 'from-purple-500 to-pink-600',
    colorBg: 'bg-purple-50 dark:bg-purple-900/20',
    descripcion: 'Chat en vivo y comunicación con clientes',
    procesos: ['P04: Chat en Vivo'],
    capacidades: ['Responder chats', 'Enviar plantillas', 'Gestionar tableros', 'Automatizar respuestas'],
  },
  quality: {
    id: 'quality',
    nombre: 'Distrito de Calidad',
    icono: '✅',
    color: 'from-teal-500 to-green-600',
    colorBg: 'bg-teal-50 dark:bg-teal-900/20',
    descripcion: 'Control de calidad y garantías',
    procesos: ['Gestión de Garantías'],
    capacidades: ['Verificar entregas', 'Procesar garantías', 'Validar evidencias', 'Auditar procesos'],
  },
  intelligence: {
    id: 'intelligence',
    nombre: 'Distrito de Inteligencia',
    icono: '🧠',
    color: 'from-indigo-500 to-purple-600',
    colorBg: 'bg-indigo-50 dark:bg-indigo-900/20',
    descripcion: 'Análisis e inteligencia artificial',
    procesos: ['Análisis de Patrones', 'Predicción ML'],
    capacidades: ['Analizar datos', 'Detectar patrones', 'Predecir retrasos', 'Generar reportes'],
  },
  automation: {
    id: 'automation',
    nombre: 'Distrito de Automatización',
    icono: '⚙️',
    color: 'from-gray-500 to-slate-600',
    colorBg: 'bg-gray-50 dark:bg-gray-900/20',
    descripcion: 'Automatización de procesos',
    procesos: ['Workflows Automáticos'],
    capacidades: ['Ejecutar flujos', 'Programar tareas', 'Integrar sistemas', 'Monitorear procesos'],
  },
};

// Datos de ejemplo para demostración
const GUIAS_EJEMPLO: GuiaInfo[] = [
  { id: '8001234567890', estado: 'EN REPARTO', transportadora: 'Interrapidísimo', ciudad: 'Bogotá', telefono: '3001234567', diasTransito: 2, nivelRiesgo: 'BAJO', ultimaActualizacion: '2024-12-08 10:30' },
  { id: '8009876543210', estado: 'EN OFICINA', transportadora: 'Coordinadora', ciudad: 'Medellín', telefono: '3109876543', diasTransito: 4, nivelRiesgo: 'ALTO', ultimaActualizacion: '2024-12-06 15:45' },
  { id: '9001122334455', estado: 'NOVEDAD', transportadora: 'Envía', ciudad: 'Cali', telefono: '3201122334', diasTransito: 3, nivelRiesgo: 'MEDIO', ultimaActualizacion: '2024-12-07 09:15' },
  { id: '7005566778899', estado: 'EN TRÁNSITO', transportadora: 'Servientrega', ciudad: 'Barranquilla', telefono: '3155566778', diasTransito: 1, nivelRiesgo: 'BAJO', ultimaActualizacion: '2024-12-08 08:00' },
  { id: '8002233445566', estado: 'DEVUELTO', transportadora: 'TCC', ciudad: 'Cartagena', telefono: '3182233445', diasTransito: 7, nivelRiesgo: 'CRITICO', ultimaActualizacion: '2024-12-01 14:20' },
];

// Componente principal
export const DistritoDetailPage: React.FC<DistritoDetailPageProps> = ({
  distritoId,
  paisSeleccionado,
  onClose,
}) => {
  const config = DISTRITOS_CONFIG[distritoId] || DISTRITOS_CONFIG.tracking;

  const [mensajes, setMensajes] = useState<MensajeChat[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [vistaActiva, setVistaActiva] = useState<'chat' | 'guias' | 'metricas' | 'procesos'>('chat');
  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS');
  const [guiasSeleccionadas, setGuiasSeleccionadas] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mensaje de bienvenida
  useEffect(() => {
    const welcomeMessage: MensajeChat = {
      id: uuidv4(),
      rol: 'assistant',
      contenido: `¡Hola! Soy el asistente IA del **${config.nombre}** ${config.icono}

Estoy aquí para ayudarte con:
${config.capacidades.map(c => `• ${c}`).join('\n')}

**Procesos que manejo:**
${config.procesos.map(p => `📋 ${p}`).join('\n')}

¿En qué puedo ayudarte hoy?`,
      timestamp: new Date(),
      acciones: getAccionesRapidas(distritoId),
    };
    setMensajes([welcomeMessage]);
  }, [distritoId, config]);

  // Scroll automático
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  // Obtener acciones rápidas según el distrito
  function getAccionesRapidas(distrito: string): AccionRapida[] {
    const accionesBase: AccionRapida[] = [
      { id: 'listar-guias', label: 'Listar guías', icon: '📋', comando: 'Muéstrame todas las guías', tipo: 'info' },
      { id: 'resumen', label: 'Resumen del día', icon: '📊', comando: '¿Cuál es el resumen del día?', tipo: 'info' },
    ];

    const accionesPorDistrito: Record<string, AccionRapida[]> = {
      tracking: [
        ...accionesBase,
        { id: 'retrasadas', label: 'Guías retrasadas', icon: '⚠️', comando: 'Muéstrame las guías retrasadas', tipo: 'info' },
        { id: 'en-reparto', label: 'En reparto', icon: '🚚', comando: 'Lista las guías en reparto', tipo: 'info' },
      ],
      crisis: [
        ...accionesBase,
        { id: 'novedades', label: 'Ver novedades', icon: '🚨', comando: 'Muéstrame las novedades activas', tipo: 'info' },
        { id: 'resolver', label: 'Resolver novedad', icon: '✅', comando: '¿Cómo resuelvo una novedad?', tipo: 'accion' },
      ],
      communications: [
        ...accionesBase,
        { id: 'plantillas', label: 'Ver plantillas', icon: '📝', comando: 'Muéstrame las plantillas de mensaje', tipo: 'info' },
        { id: 'sin-respuesta', label: 'Chats pendientes', icon: '💬', comando: 'Lista los chats sin respuesta', tipo: 'info' },
      ],
      orders: [
        ...accionesBase,
        { id: 'pendientes', label: 'Pedidos pendientes', icon: '🛒', comando: 'Lista los pedidos pendientes', tipo: 'info' },
        { id: 'crear', label: 'Crear pedido', icon: '➕', comando: '¿Cómo creo un nuevo pedido?', tipo: 'accion' },
      ],
      intelligence: [
        ...accionesBase,
        { id: 'patrones', label: 'Ver patrones', icon: '🔍', comando: 'Muéstrame los patrones detectados', tipo: 'info' },
        { id: 'prediccion', label: 'Predicción ML', icon: '🎯', comando: 'Dame predicciones de retraso', tipo: 'info' },
      ],
      quality: [
        ...accionesBase,
        { id: 'garantias', label: 'Garantías', icon: '🔄', comando: 'Lista las solicitudes de garantía', tipo: 'info' },
        { id: 'verificar', label: 'Verificar entrega', icon: '✅', comando: '¿Cómo verifico una entrega?', tipo: 'accion' },
      ],
      automation: [
        ...accionesBase,
        { id: 'workflows', label: 'Ver workflows', icon: '⚙️', comando: 'Muéstrame los workflows activos', tipo: 'info' },
        { id: 'ejecutar', label: 'Ejecutar tarea', icon: '▶️', comando: '¿Qué tareas puedo automatizar?', tipo: 'accion' },
      ],
    };

    return accionesPorDistrito[distrito] || accionesBase;
  }

  // Generar respuesta del asistente
  const generateResponse = useCallback(async (userMessage: string): Promise<MensajeChat> => {
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700));

    const lowerMessage = userMessage.toLowerCase();

    // Detectar intención y generar respuesta apropiada
    if (lowerMessage.includes('guía') || lowerMessage.includes('guias') || lowerMessage.includes('lista')) {
      if (lowerMessage.includes('retrasad') || lowerMessage.includes('retraso')) {
        const retrasadas = GUIAS_EJEMPLO.filter(g => g.diasTransito > 3 || g.nivelRiesgo === 'ALTO' || g.nivelRiesgo === 'CRITICO');
        return {
          id: uuidv4(),
          rol: 'assistant',
          contenido: `⚠️ **GUÍAS RETRASADAS (${retrasadas.length})**\n\nHaz clic en cualquier guía para ver más detalles o tomar acción:`,
          timestamp: new Date(),
          tipo: 'guias',
          datos: retrasadas,
        };
      }

      if (lowerMessage.includes('reparto')) {
        const enReparto = GUIAS_EJEMPLO.filter(g => g.estado === 'EN REPARTO');
        return {
          id: uuidv4(),
          rol: 'assistant',
          contenido: `🚚 **GUÍAS EN REPARTO (${enReparto.length})**\n\nEstas guías están listas para entrega hoy:`,
          timestamp: new Date(),
          tipo: 'guias',
          datos: enReparto,
        };
      }

      if (lowerMessage.includes('oficina')) {
        const enOficina = GUIAS_EJEMPLO.filter(g => g.estado === 'EN OFICINA');
        return {
          id: uuidv4(),
          rol: 'assistant',
          contenido: `📍 **GUÍAS EN OFICINA (${enOficina.length})**\n\nEstas guías esperan ser reclamadas por el cliente:`,
          timestamp: new Date(),
          tipo: 'guias',
          datos: enOficina,
        };
      }

      // Listar todas las guías
      return {
        id: uuidv4(),
        rol: 'assistant',
        contenido: `📋 **TODAS LAS GUÍAS (${GUIAS_EJEMPLO.length})**\n\nHaz clic en cualquier guía para ver detalles o realizar acciones:`,
        timestamp: new Date(),
        tipo: 'guias',
        datos: GUIAS_EJEMPLO,
      };
    }

    if (lowerMessage.includes('novedad')) {
      const novedades = GUIAS_EJEMPLO.filter(g => g.estado === 'NOVEDAD');
      return {
        id: uuidv4(),
        rol: 'assistant',
        contenido: `🚨 **NOVEDADES ACTIVAS (${novedades.length})**

Para resolver una novedad:
1. Busca al cliente en Chatea Pro
2. Si hay respuesta → Sube solución a Dropi
3. Si no hay respuesta → Llama al cliente
4. Coordina día y jornada (mañana/tarde)
5. Registra en Dropi con el botón verde

**REGLAS IMPORTANTES:**
❌ NUNCA dar hora exacta (solo jornada)
❌ NUNCA devolver sin autorización
✅ SIEMPRE verificar Chatea antes de llamar`,
        timestamp: new Date(),
        tipo: 'guias',
        datos: novedades,
        acciones: [
          { id: 'resolver-todas', label: 'Resolver todas', icon: '✅', comando: 'Resolver novedades', tipo: 'accion' },
          { id: 'llamar-cliente', label: 'Llamar cliente', icon: '📞', comando: 'Contactar cliente', tipo: 'accion' },
        ],
      };
    }

    if (lowerMessage.includes('resumen') || lowerMessage.includes('estado') || lowerMessage.includes('día')) {
      const stats = {
        total: GUIAS_EJEMPLO.length,
        enReparto: GUIAS_EJEMPLO.filter(g => g.estado === 'EN REPARTO').length,
        enOficina: GUIAS_EJEMPLO.filter(g => g.estado === 'EN OFICINA').length,
        novedades: GUIAS_EJEMPLO.filter(g => g.estado === 'NOVEDAD').length,
        criticas: GUIAS_EJEMPLO.filter(g => g.nivelRiesgo === 'CRITICO').length,
      };

      return {
        id: uuidv4(),
        rol: 'assistant',
        contenido: `📊 **RESUMEN DEL DÍA - ${config.nombre}**

| Métrica | Cantidad | Estado |
|---------|----------|--------|
| Total guías | ${stats.total} | 📦 |
| En reparto | ${stats.enReparto} | 🚚 |
| En oficina | ${stats.enOficina} | 📍 |
| Con novedad | ${stats.novedades} | ⚠️ |
| Críticas | ${stats.criticas} | 🔴 |

**📈 TASA DE ÉXITO:** 85%
**⏱️ TIEMPO PROMEDIO:** 2.8 días

💡 **RECOMENDACIÓN:** ${stats.criticas > 0
  ? `Hay ${stats.criticas} guía(s) crítica(s) que requieren atención INMEDIATA.`
  : 'Todo bajo control. Continúa el monitoreo regular.'}`,
        timestamp: new Date(),
        tipo: 'tabla',
        acciones: [
          { id: 'ver-criticas', label: 'Ver críticas', icon: '🔴', comando: 'Muéstrame las guías críticas', tipo: 'info' },
          { id: 'exportar', label: 'Exportar Excel', icon: '📥', comando: 'Exportar reporte', tipo: 'accion' },
        ],
      };
    }

    if (lowerMessage.includes('plantilla')) {
      return {
        id: uuidv4(),
        rol: 'assistant',
        contenido: `📝 **PLANTILLAS DISPONIBLES**

**1. REPARTO:**
\`\`\`
Hola! Tu pedido ya está en camino. El mensajero
intentará la entrega hoy. Estate pendiente de
nuestro contacto.
\`\`\`

**2. EN OFICINA (0-3 días):**
\`\`\`
Tu pedido ya llegó a la oficina de [TRANSPORTADORA].
Puedes reclamarlo presentando tu cédula. Te envío
la guía para que la tengas a mano.
\`\`\`

**3. EN OFICINA (+3 días):**
\`\`\`
Tu pedido lleva varios días en oficina. Si no lo
reclamas pronto, será devuelto. ¿Puedes pasar hoy
o mañana a recogerlo?
\`\`\`

**4. REENVÍO:**
\`\`\`
Hemos reprogramado el envío de tu pedido. Llegará
en 1-2 días hábiles. Llamaremos antes de la entrega.
\`\`\`

Haz clic en cualquier plantilla para copiarla.`,
        timestamp: new Date(),
        tipo: 'lista',
        acciones: [
          { id: 'copiar-reparto', label: 'Copiar REPARTO', icon: '📋', comando: 'Copiar plantilla reparto', tipo: 'accion' },
          { id: 'copiar-oficina', label: 'Copiar OFICINA', icon: '📋', comando: 'Copiar plantilla oficina', tipo: 'accion' },
        ],
      };
    }

    if (lowerMessage.includes('patrón') || lowerMessage.includes('patron') || lowerMessage.includes('detecta')) {
      return {
        id: uuidv4(),
        rol: 'assistant',
        contenido: `🔍 **PATRONES DETECTADOS**

**🔴 CRÍTICO - Acumulación en oficinas Medellín**
• 8 guías llevan +3 días en oficina
• Transportadora: Coordinadora
• **Acción:** Contactar clientes urgente
• **Riesgo:** 80% probabilidad de devolución

**🟠 ALTO - Retrasos ruta Barranquilla**
• 5 guías con +2 días sin movimiento
• Transportadora: TCC
• **Acción:** Escalar con transportadora

**🟡 MEDIO - Incremento novedades zona norte**
• +23% novedades vs semana anterior
• Causa: Direcciones incompletas
• **Acción:** Mejorar validación de direcciones

💡 **INSIGHT ML:** Implementando acciones recomendadas se puede reducir la tasa de devolución en un 40%.`,
        timestamp: new Date(),
        tipo: 'lista',
        acciones: [
          { id: 'resolver-patron', label: 'Resolver patrón crítico', icon: '🔴', comando: 'Resolver patrón crítico', tipo: 'accion' },
          { id: 'ver-detalles', label: 'Ver análisis completo', icon: '📊', comando: 'Análisis detallado de patrones', tipo: 'info' },
        ],
      };
    }

    if (lowerMessage.includes('cómo') || lowerMessage.includes('como') || lowerMessage.includes('proceso')) {
      const procesoInfo = config.procesos[0] || 'Proceso general';
      return {
        id: uuidv4(),
        rol: 'assistant',
        contenido: `📋 **PROCESO: ${procesoInfo}**

**FLUJO DE TRABAJO:**

\`\`\`
INICIO
  │
  ▼
┌─────────────────────────┐
│ 1. Identificar caso     │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ 2. Verificar información│
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ 3. Tomar acción         │
│    según el tablero     │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ 4. Registrar en sistema │
└───────────┬─────────────┘
            │
            ▼
       FIN / SIGUIENTE
\`\`\`

**REGLAS CLAVE:**
✅ SIEMPRE verificar antes de actuar
✅ SIEMPRE registrar todo
❌ NUNCA inventar información
❌ NUNCA devolver sin autorización

¿Necesitas ayuda con algún paso específico?`,
        timestamp: new Date(),
        tipo: 'texto',
        acciones: [
          { id: 'ver-ejemplo', label: 'Ver ejemplo', icon: '💡', comando: 'Dame un ejemplo práctico', tipo: 'info' },
          { id: 'practicar', label: 'Practicar', icon: '🎯', comando: 'Quiero practicar el proceso', tipo: 'accion' },
        ],
      };
    }

    // Respuesta por defecto contextual
    return {
      id: uuidv4(),
      rol: 'assistant',
      contenido: `Entiendo tu consulta. Como asistente del **${config.nombre}**, puedo ayudarte con:

${config.capacidades.map(c => `• ${c}`).join('\n')}

**Consultas sugeridas:**
• "Muéstrame las guías retrasadas"
• "¿Cuál es el resumen del día?"
• "Lista las novedades activas"
• "¿Cómo resuelvo una novedad?"

¿Qué información necesitas?`,
      timestamp: new Date(),
      acciones: getAccionesRapidas(distritoId),
    };
  }, [config, distritoId]);

  // Enviar mensaje
  const handleSend = async (message?: string) => {
    const texto = message || inputValue.trim();
    if (!texto || isLoading) return;

    const userMessage: MensajeChat = {
      id: uuidv4(),
      rol: 'user',
      contenido: texto,
      timestamp: new Date(),
    };

    setMensajes(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await generateResponse(texto);
      setMensajes(prev => [...prev, response]);
    } catch (error) {
      setMensajes(prev => [...prev, {
        id: uuidv4(),
        rol: 'assistant',
        contenido: 'Lo siento, hubo un error. Por favor intenta de nuevo.',
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Limpiar chat
  const handleClear = () => {
    if (confirm('¿Limpiar el historial de conversación?')) {
      setMensajes([{
        id: uuidv4(),
        rol: 'assistant',
        contenido: '¡Conversación reiniciada! ¿En qué puedo ayudarte?',
        timestamp: new Date(),
        acciones: getAccionesRapidas(distritoId),
      }]);
    }
  };

  // Renderizar guía clickeable
  const renderGuiaCard = (guia: GuiaInfo) => {
    const riesgoColors = {
      BAJO: 'bg-green-100 text-green-700 border-green-200',
      MEDIO: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      ALTO: 'bg-orange-100 text-orange-700 border-orange-200',
      CRITICO: 'bg-red-100 text-red-700 border-red-200',
    };

    return (
      <button
        key={guia.id}
        onClick={() => handleSend(`Dame información de la guía ${guia.id}`)}
        className="w-full text-left bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-indigo-300 transition-all group"
      >
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="font-bold text-gray-800 dark:text-white font-mono">{guia.id}</p>
            <p className="text-sm text-gray-500 flex items-center gap-1">
              <Truck className="w-3 h-3" />
              {guia.transportadora}
            </p>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-bold ${riesgoColors[guia.nivelRiesgo]}`}>
            {guia.nivelRiesgo}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mb-3">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {guia.ciudad}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {guia.diasTransito}d
          </span>
          <span className={`px-2 py-0.5 rounded ${
            guia.estado === 'EN REPARTO' ? 'bg-blue-100 text-blue-700' :
            guia.estado === 'EN OFICINA' ? 'bg-orange-100 text-orange-700' :
            guia.estado === 'NOVEDAD' ? 'bg-red-100 text-red-700' :
            guia.estado === 'DEVUELTO' ? 'bg-gray-100 text-gray-700' :
            'bg-green-100 text-green-700'
          }`}>
            {guia.estado}
          </span>
        </div>

        {guia.telefono && (
          <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
            <button
              onClick={(e) => {
                e.stopPropagation();
                window.open(`https://wa.me/57${guia.telefono}?text=Hola! Le escribo de Litper sobre su pedido con guía ${guia.id}.`, '_blank');
              }}
              className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600 transition-colors"
            >
              <MessageCircle className="w-3 h-3" />
              WhatsApp
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                window.open(`tel:${guia.telefono}`, '_self');
              }}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white rounded-lg text-xs font-medium hover:bg-blue-600 transition-colors"
            >
              <Phone className="w-3 h-3" />
              Llamar
            </button>
          </div>
        )}

        <div className="mt-2 flex items-center gap-1 text-indigo-500 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
          <span>Ver detalles</span>
          <ChevronRight className="w-3 h-3" />
        </div>
      </button>
    );
  };

  // Renderizar mensaje
  const renderMessage = (mensaje: MensajeChat) => {
    if (mensaje.rol === 'user') {
      return (
        <div key={mensaje.id} className="flex justify-end">
          <div className="max-w-[85%] bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl px-4 py-3">
            <div className="text-sm">{mensaje.contenido}</div>
            <p className="text-xs text-white/70 mt-1">
              {new Date(mensaje.timestamp).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      );
    }

    return (
      <div key={mensaje.id} className="flex justify-start">
        <div className="max-w-[90%] bg-slate-100 dark:bg-gray-800 rounded-2xl px-4 py-3">
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-200 dark:border-gray-700">
            <Bot className="w-4 h-4 text-indigo-500" />
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
              Asistente {config.nombre}
            </span>
          </div>

          <div className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
            {mensaje.contenido}
          </div>

          {/* Renderizar guías si hay datos */}
          {mensaje.tipo === 'guias' && mensaje.datos && (
            <div className="mt-4 grid grid-cols-1 gap-3">
              {mensaje.datos.map((guia: GuiaInfo) => renderGuiaCard(guia))}
            </div>
          )}

          {/* Renderizar acciones rápidas */}
          {mensaje.acciones && mensaje.acciones.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-gray-700">
              <p className="text-xs text-slate-400 mb-2">Acciones rápidas:</p>
              <div className="flex flex-wrap gap-2">
                {mensaje.acciones.map(accion => (
                  <button
                    key={accion.id}
                    onClick={() => handleSend(accion.comando)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      accion.tipo === 'accion'
                        ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                        : 'bg-slate-200 dark:bg-gray-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300'
                    }`}
                  >
                    <span>{accion.icon}</span>
                    {accion.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-slate-400 mt-2">
            {new Date(mensaje.timestamp).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900">
      {/* Header */}
      <div className={`bg-gradient-to-r ${config.color} text-white sticky top-0 z-50`}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <div className="flex items-center gap-3">
                <div className="text-4xl">{config.icono}</div>
                <div>
                  <h1 className="text-2xl font-bold">{config.nombre}</h1>
                  <p className="text-sm text-white/80">{config.descripcion}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium capitalize">
                {paisSeleccionado}
              </span>
              <span className="px-3 py-1 bg-green-400/30 rounded-full text-sm font-medium flex items-center gap-1">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                Sistema ML Activo
              </span>
            </div>
          </div>

          {/* Sub-navegación */}
          <div className="flex gap-2 mt-4">
            {[
              { id: 'chat', label: 'Chat Asistente', icon: MessageCircle },
              { id: 'guias', label: 'Guías', icon: Package },
              { id: 'metricas', label: 'Métricas', icon: BarChart3 },
              { id: 'procesos', label: 'Procesos', icon: Settings },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setVistaActiva(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  vistaActiva === tab.id
                    ? 'bg-white text-gray-800'
                    : 'bg-white/20 hover:bg-white/30'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {vistaActiva === 'chat' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
            {/* Chat header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 bg-gradient-to-br ${config.color} rounded-xl flex items-center justify-center`}>
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-800 dark:text-white">Chat Inteligente</h2>
                  <p className="text-xs text-slate-500">Powered by Claude AI + ML</p>
                </div>
              </div>
              <button
                onClick={handleClear}
                className="p-2 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Limpiar conversación"
              >
                <Trash2 className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Messages */}
            <div className="h-[500px] overflow-y-auto p-4 space-y-4">
              {mensajes.map(renderMessage)}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 dark:bg-gray-700 rounded-2xl px-4 py-3 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                    <span className="text-sm text-slate-500">Analizando...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-slate-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Escribe tu pregunta o comando..."
                  disabled={isLoading}
                  className="flex-1 px-4 py-3 bg-slate-100 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!inputValue.trim() || isLoading}
                  className={`p-3 bg-gradient-to-br ${config.color} text-white rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all`}
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {vistaActiva === 'guias' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Listado de Guías</h2>
              <div className="flex items-center gap-2">
                <select
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value)}
                  className="px-4 py-2 border border-slate-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                >
                  <option value="TODOS">Todos los estados</option>
                  <option value="EN REPARTO">En Reparto</option>
                  <option value="EN OFICINA">En Oficina</option>
                  <option value="NOVEDAD">Con Novedad</option>
                  <option value="EN TRÁNSITO">En Tránsito</option>
                </select>
                <button className="px-4 py-2 bg-indigo-500 text-white rounded-lg flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Exportar
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {GUIAS_EJEMPLO
                .filter(g => filtroEstado === 'TODOS' || g.estado === filtroEstado)
                .map(renderGuiaCard)}
            </div>
          </div>
        )}

        {vistaActiva === 'metricas' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Guías', value: GUIAS_EJEMPLO.length, icon: Package, color: 'blue' },
              { label: 'En Reparto', value: GUIAS_EJEMPLO.filter(g => g.estado === 'EN REPARTO').length, icon: Truck, color: 'green' },
              { label: 'Con Novedad', value: GUIAS_EJEMPLO.filter(g => g.estado === 'NOVEDAD').length, icon: AlertTriangle, color: 'red' },
              { label: 'Tasa Éxito', value: '85%', icon: TrendingUp, color: 'indigo' },
            ].map((stat, idx) => (
              <div key={idx} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <stat.icon className={`w-8 h-8 text-${stat.color}-500`} />
                  <span className={`text-3xl font-bold text-${stat.color}-600`}>{stat.value}</span>
                </div>
                <p className="text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        {vistaActiva === 'procesos' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Procesos del Distrito</h2>
            <div className="space-y-4">
              {config.procesos.map((proceso, idx) => (
                <div key={idx} className="p-4 bg-slate-50 dark:bg-gray-700 rounded-xl">
                  <h3 className="font-bold text-slate-800 dark:text-white mb-2">{proceso}</h3>
                  <p className="text-sm text-slate-500">Haz clic para ver el flujo detallado del proceso.</p>
                  <button
                    onClick={() => {
                      setVistaActiva('chat');
                      handleSend(`Explícame el proceso ${proceso}`);
                    }}
                    className="mt-3 px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm"
                  >
                    Ver proceso
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DistritoDetailPage;
