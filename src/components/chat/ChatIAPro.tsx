/**
 * ChatIAPro - LITPER PRO
 *
 * Chat IA Premium tipo Claude.ai con skills de logística,
 * markdown rendering, voz y respuestas accionables
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Send,
  Mic,
  MicOff,
  Plus,
  MessageSquare,
  Sparkles,
  Package,
  Truck,
  User,
  AlertTriangle,
  BarChart3,
  MapPin,
  Globe,
  HelpCircle,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Trash2,
  ChevronDown,
  ChevronRight,
  Search,
  Clock,
  X,
  Loader2,
  Bot,
  Zap,
  FileText,
  TrendingUp,
  CheckCircle,
  XCircle,
  Info,
  ArrowRight,
  ExternalLink,
  Hash,
  Calendar,
  DollarSign,
  Phone,
  Mail,
  Building,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  skill?: SkillType;
  actions?: ActionButton[];
  data?: unknown;
  isTyping?: boolean;
}

interface ActionButton {
  id: string;
  label: string;
  variant: 'primary' | 'secondary' | 'success' | 'danger';
  action: () => void;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

type SkillType =
  | 'pedidos'
  | 'tracking'
  | 'cliente'
  | 'novedad'
  | 'reporte'
  | 'ciudades'
  | 'transportadoras'
  | 'ayuda'
  | 'general';

interface SkillConfig {
  name: string;
  icon: React.ReactNode;
  description: string;
  examples: string[];
  color: string;
}

// ============================================================================
// SKILLS CONFIGURATION
// ============================================================================

const SKILLS: Record<SkillType, SkillConfig> = {
  pedidos: {
    name: 'Pedidos',
    icon: <Package className="w-4 h-4" />,
    description: 'Buscar y gestionar pedidos',
    examples: ['/pedidos pendientes', '/pedidos hoy', '/pedidos cliente:Juan'],
    color: '#3b82f6',
  },
  tracking: {
    name: 'Tracking',
    icon: <Truck className="w-4 h-4" />,
    description: 'Rastrear envíos por guía',
    examples: ['/tracking 123456789', '/tracking COO-2024-001'],
    color: '#10b981',
  },
  cliente: {
    name: 'Cliente',
    icon: <User className="w-4 h-4" />,
    description: 'Información de clientes',
    examples: ['/cliente Juan Pérez', '/cliente 3001234567'],
    color: '#8b5cf6',
  },
  novedad: {
    name: 'Novedad',
    icon: <AlertTriangle className="w-4 h-4" />,
    description: 'Gestionar novedades y devoluciones',
    examples: ['/novedad 123456', '/novedad pendientes'],
    color: '#f59e0b',
  },
  reporte: {
    name: 'Reporte',
    icon: <BarChart3 className="w-4 h-4" />,
    description: 'Generar reportes',
    examples: ['/reporte diario', '/reporte semanal', '/reporte ventas'],
    color: '#ec4899',
  },
  ciudades: {
    name: 'Ciudades',
    icon: <MapPin className="w-4 h-4" />,
    description: 'Semáforo de entregabilidad',
    examples: ['/ciudades', '/ciudades Bogotá', '/ciudades críticas'],
    color: '#14b8a6',
  },
  transportadoras: {
    name: 'Transportadoras',
    icon: <Globe className="w-4 h-4" />,
    description: 'Estado de transportadoras',
    examples: ['/transportadoras', '/transportadoras Coordinadora'],
    color: '#6366f1',
  },
  ayuda: {
    name: 'Ayuda',
    icon: <HelpCircle className="w-4 h-4" />,
    description: 'Ver comandos disponibles',
    examples: ['/ayuda', '/ayuda pedidos'],
    color: '#71717a',
  },
  general: {
    name: 'General',
    icon: <MessageSquare className="w-4 h-4" />,
    description: 'Consultas generales',
    examples: [],
    color: '#3b82f6',
  },
};

// ============================================================================
// MOCK DATA FOR DEMO
// ============================================================================

const MOCK_PEDIDOS = [
  { id: 'PED-001', cliente: 'Juan Pérez', ciudad: 'Bogotá', estado: 'En tránsito', valor: 150000 },
  { id: 'PED-002', cliente: 'María García', ciudad: 'Medellín', estado: 'Entregado', valor: 85000 },
  { id: 'PED-003', cliente: 'Carlos López', ciudad: 'Cali', estado: 'Pendiente', valor: 220000 },
  { id: 'PED-004', cliente: 'Ana Martínez', ciudad: 'Barranquilla', estado: 'Novedad', valor: 95000 },
  { id: 'PED-005', cliente: 'Luis Rodríguez', ciudad: 'Cartagena', estado: 'En tránsito', valor: 175000 },
];

const MOCK_CIUDADES = [
  { ciudad: 'Bogotá', entregabilidad: 92, pedidos: 450, color: 'green' },
  { ciudad: 'Medellín', entregabilidad: 88, pedidos: 280, color: 'green' },
  { ciudad: 'Cali', entregabilidad: 75, pedidos: 180, color: 'yellow' },
  { ciudad: 'Barranquilla', entregabilidad: 68, pedidos: 120, color: 'yellow' },
  { ciudad: 'Bucaramanga', entregabilidad: 55, pedidos: 85, color: 'red' },
];

const MOCK_TRANSPORTADORAS = [
  { nombre: 'Coordinadora', estado: 'Operativo', entregas: 156, onTime: 94 },
  { nombre: 'Servientrega', estado: 'Operativo', entregas: 98, onTime: 91 },
  { nombre: 'Interrapidísimo', estado: 'Demoras', entregas: 45, onTime: 78 },
  { nombre: 'Envía', estado: 'Operativo', entregas: 72, onTime: 89 },
];

// ============================================================================
// SKILL PROCESSORS
// ============================================================================

const processSkill = (skill: SkillType, query: string): { content: string; data?: unknown; actions?: ActionButton[] } => {
  switch (skill) {
    case 'pedidos': {
      const filtered = MOCK_PEDIDOS.filter(p =>
        query === '' ||
        p.cliente.toLowerCase().includes(query.toLowerCase()) ||
        p.estado.toLowerCase().includes(query.toLowerCase()) ||
        p.ciudad.toLowerCase().includes(query.toLowerCase())
      );
      return {
        content: `Encontré **${filtered.length} pedidos** ${query ? `que coinciden con "${query}"` : 'recientes'}:\n\n` +
          filtered.map(p => `- **${p.id}** | ${p.cliente} | ${p.ciudad} | ${p.estado} | $${p.valor.toLocaleString()}`).join('\n'),
        data: filtered,
        actions: [
          { id: 'export', label: 'Exportar a Excel', variant: 'secondary', action: () => console.log('Export') },
          { id: 'filter', label: 'Filtrar más', variant: 'secondary', action: () => console.log('Filter') },
        ],
      };
    }

    case 'tracking': {
      const guia = query.trim() || 'COO-2024-12345';
      return {
        content: `## 📦 Tracking: ${guia}\n\n` +
          `**Estado:** En tránsito 🚚\n` +
          `**Transportadora:** Coordinadora\n` +
          `**Origen:** Bogotá\n` +
          `**Destino:** Medellín\n` +
          `**Fecha estimada:** Mañana, 10:00 AM\n\n` +
          `### Historial:\n` +
          `- ✅ 28/01 08:00 - Recogido en origen\n` +
          `- ✅ 28/01 14:30 - En centro de distribución\n` +
          `- 🔄 29/01 06:00 - En ruta hacia destino\n` +
          `- ⏳ Pendiente - Entrega al destinatario`,
        actions: [
          { id: 'notify', label: 'Notificar cliente', variant: 'primary', action: () => console.log('Notify') },
          { id: 'contact', label: 'Contactar transportadora', variant: 'secondary', action: () => console.log('Contact') },
        ],
      };
    }

    case 'cliente': {
      const nombre = query.trim() || 'Juan Pérez';
      return {
        content: `## 👤 Cliente: ${nombre}\n\n` +
          `**Teléfono:** 300 123 4567\n` +
          `**Email:** juan.perez@email.com\n` +
          `**Ciudad:** Bogotá\n` +
          `**Dirección:** Calle 123 #45-67, Chapinero\n\n` +
          `### Estadísticas:\n` +
          `- 📦 **12** pedidos totales\n` +
          `- ✅ **10** entregados (83%)\n` +
          `- ❌ **2** devueltos\n` +
          `- 💰 **$1,850,000** en compras`,
        actions: [
          { id: 'call', label: 'Llamar', variant: 'primary', action: () => console.log('Call') },
          { id: 'whatsapp', label: 'WhatsApp', variant: 'success', action: () => console.log('WhatsApp') },
          { id: 'history', label: 'Ver historial', variant: 'secondary', action: () => console.log('History') },
        ],
      };
    }

    case 'novedad': {
      return {
        content: `## ⚠️ Novedades Activas\n\n` +
          `Hay **8 novedades** pendientes de gestión:\n\n` +
          `| Guía | Tipo | Ciudad | Días |\n` +
          `|------|------|--------|------|\n` +
          `| COO-001 | Dirección incorrecta | Bogotá | 2 |\n` +
          `| SER-045 | No recibe | Medellín | 1 |\n` +
          `| INT-089 | Rehusado | Cali | 3 |\n` +
          `| COO-112 | Cerrado | Barranquilla | 1 |\n\n` +
          `> 💡 **Recomendación:** Prioriza las novedades de más de 2 días para evitar devoluciones.`,
        actions: [
          { id: 'gestionar', label: 'Gestionar todas', variant: 'primary', action: () => console.log('Manage') },
          { id: 'reprogramar', label: 'Reprogramar entregas', variant: 'secondary', action: () => console.log('Reschedule') },
        ],
      };
    }

    case 'reporte': {
      const tipo = query.trim() || 'diario';
      return {
        content: `## 📊 Reporte ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}\n\n` +
          `### KPIs Principales\n` +
          `- 📦 **127** pedidos procesados\n` +
          `- ✅ **94** entregas exitosas (74%)\n` +
          `- ❌ **18** devoluciones (14%)\n` +
          `- 🔄 **15** en tránsito\n\n` +
          `### Por Transportadora\n` +
          `- Coordinadora: 45 envíos (96% on-time)\n` +
          `- Servientrega: 38 envíos (92% on-time)\n` +
          `- Inter: 25 envíos (78% on-time)\n\n` +
          `### Facturación\n` +
          `- 💰 **$12,450,000** en ventas\n` +
          `- 📈 +15% vs ayer`,
        actions: [
          { id: 'download', label: 'Descargar Excel', variant: 'primary', action: () => console.log('Download') },
          { id: 'share', label: 'Compartir', variant: 'secondary', action: () => console.log('Share') },
        ],
      };
    }

    case 'ciudades': {
      const ciudadQuery = query.trim().toLowerCase();
      const filtered = ciudadQuery
        ? MOCK_CIUDADES.filter(c => c.ciudad.toLowerCase().includes(ciudadQuery))
        : MOCK_CIUDADES;

      return {
        content: `## 🚦 Semáforo de Ciudades\n\n` +
          filtered.map(c => {
            const emoji = c.color === 'green' ? '🟢' : c.color === 'yellow' ? '🟡' : '🔴';
            return `${emoji} **${c.ciudad}** - ${c.entregabilidad}% entregabilidad (${c.pedidos} pedidos)`;
          }).join('\n') +
          `\n\n> 💡 Las ciudades en rojo requieren atención especial o cambio de transportadora.`,
        data: filtered,
        actions: [
          { id: 'details', label: 'Ver detalles', variant: 'secondary', action: () => console.log('Details') },
          { id: 'optimize', label: 'Optimizar rutas', variant: 'primary', action: () => console.log('Optimize') },
        ],
      };
    }

    case 'transportadoras': {
      return {
        content: `## 🚚 Estado de Transportadoras\n\n` +
          MOCK_TRANSPORTADORAS.map(t => {
            const emoji = t.estado === 'Operativo' ? '✅' : '⚠️';
            return `${emoji} **${t.nombre}**\n   Estado: ${t.estado} | Entregas hoy: ${t.entregas} | On-time: ${t.onTime}%`;
          }).join('\n\n') +
          `\n\n> ⚠️ **Interrapidísimo** presenta demoras. Considera reasignar envíos críticos.`,
        data: MOCK_TRANSPORTADORAS,
        actions: [
          { id: 'contact-all', label: 'Contactar todas', variant: 'secondary', action: () => console.log('Contact all') },
          { id: 'reasign', label: 'Reasignar envíos', variant: 'primary', action: () => console.log('Reasign') },
        ],
      };
    }

    case 'ayuda': {
      return {
        content: `## 💡 Comandos Disponibles\n\n` +
          Object.entries(SKILLS)
            .filter(([key]) => key !== 'general')
            .map(([key, skill]) => `**/${key}** - ${skill.description}\n   Ejemplos: ${skill.examples.join(', ')}`)
            .join('\n\n') +
          `\n\n---\n` +
          `También puedes escribir cualquier pregunta en lenguaje natural y te ayudaré. 🤖`,
      };
    }

    default:
      return {
        content: 'Lo siento, no entendí tu consulta. Escribe **/ayuda** para ver los comandos disponibles.',
      };
  }
};

// ============================================================================
// MARKDOWN RENDERER
// ============================================================================

const renderMarkdown = (text: string): React.ReactNode => {
  const lines = text.split('\n');

  return lines.map((line, i) => {
    // Headers
    if (line.startsWith('## ')) {
      return <h2 key={i} className="text-lg font-bold text-white mt-4 mb-2">{line.slice(3)}</h2>;
    }
    if (line.startsWith('### ')) {
      return <h3 key={i} className="text-base font-semibold text-zinc-200 mt-3 mb-1">{line.slice(4)}</h3>;
    }

    // Blockquotes
    if (line.startsWith('> ')) {
      return (
        <div key={i} className="border-l-2 border-blue-500 pl-3 py-1 my-2 text-sm text-zinc-400 bg-blue-500/5 rounded-r">
          {renderInline(line.slice(2))}
        </div>
      );
    }

    // Tables
    if (line.startsWith('|')) {
      const cells = line.split('|').filter(c => c.trim());
      const isHeader = lines[i + 1]?.startsWith('|---');
      return (
        <div key={i} className={`grid grid-cols-${cells.length} gap-2 py-1 text-sm ${isHeader ? 'font-semibold text-zinc-300 border-b border-zinc-700' : 'text-zinc-400'}`}>
          {cells.map((cell, j) => <span key={j} className="truncate">{cell.trim()}</span>)}
        </div>
      );
    }
    if (line.startsWith('|---')) return null;

    // Horizontal rules
    if (line === '---') {
      return <hr key={i} className="border-zinc-800 my-3" />;
    }

    // List items
    if (line.startsWith('- ')) {
      return <li key={i} className="text-sm text-zinc-300 ml-4 list-disc">{renderInline(line.slice(2))}</li>;
    }

    // Empty lines
    if (line.trim() === '') {
      return <div key={i} className="h-2" />;
    }

    // Regular paragraphs
    return <p key={i} className="text-sm text-zinc-300">{renderInline(line)}</p>;
  });
};

const renderInline = (text: string): React.ReactNode => {
  // Bold
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
    }
    // Italic
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i} className="italic">{part.slice(1, -1)}</em>;
    }
    // Code
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className="px-1 py-0.5 bg-zinc-800 rounded text-blue-400 text-xs">{part.slice(1, -1)}</code>;
    }
    return part;
  });
};

// ============================================================================
// TYPING INDICATOR
// ============================================================================

const TypingIndicator: React.FC = () => (
  <div className="flex items-center gap-1 px-4 py-3">
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-2 h-2 rounded-full bg-blue-400"
          style={{
            animation: 'bounce 1.4s infinite ease-in-out both',
            animationDelay: `${i * 0.16}s`,
          }}
        />
      ))}
    </div>
    <span className="text-xs text-zinc-500 ml-2">LITPER IA está escribiendo...</span>
  </div>
);

// ============================================================================
// MESSAGE COMPONENT
// ============================================================================

const MessageBubble: React.FC<{
  message: Message;
  onCopy: () => void;
  onRetry?: () => void;
}> = ({ message, onCopy, onRetry }) => {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    onCopy();
    setTimeout(() => setCopied(false), 2000);
  };

  const isUser = message.role === 'user';
  const skill = message.skill ? SKILLS[message.skill] : null;

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[85%] ${isUser ? 'order-2' : 'order-1'}`}>
        {/* Avatar and header for assistant */}
        {!isUser && (
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{
                background: skill?.color ? `${skill.color}20` : 'rgba(59, 130, 246, 0.1)',
              }}
            >
              {skill?.icon || <Sparkles className="w-4 h-4 text-blue-400" />}
            </div>
            <span className="text-xs font-medium text-zinc-400">
              LITPER IA {skill && skill.name !== 'General' && `• ${skill.name}`}
            </span>
            <span className="text-xs text-zinc-600">
              {message.timestamp.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        )}

        {/* Message bubble */}
        <div
          className={`rounded-2xl px-4 py-3 ${isUser ? 'rounded-tr-md' : 'rounded-tl-md'}`}
          style={{
            background: isUser
              ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
              : '#12121a',
            border: isUser ? 'none' : '1px solid rgba(63, 63, 70, 0.5)',
          }}
        >
          {message.isTyping ? (
            <TypingIndicator />
          ) : (
            <div className={isUser ? 'text-white text-sm' : ''}>
              {isUser ? message.content : renderMarkdown(message.content)}
            </div>
          )}
        </div>

        {/* Action buttons */}
        {!isUser && message.actions && message.actions.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {message.actions.map((action) => (
              <button
                key={action.id}
                onClick={action.action}
                className={`
                  px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                  ${action.variant === 'primary'
                    ? 'bg-blue-600 hover:bg-blue-500 text-white'
                    : action.variant === 'success'
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : action.variant === 'danger'
                        ? 'bg-red-600 hover:bg-red-500 text-white'
                        : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                  }
                `}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}

        {/* Message actions for assistant */}
        {!isUser && !message.isTyping && (
          <div className="flex items-center gap-1 mt-2 opacity-0 hover:opacity-100 transition-opacity">
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-md text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
              title="Copiar"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => setFeedback('up')}
              className={`p-1.5 rounded-md transition-colors ${feedback === 'up' ? 'text-green-400 bg-green-500/10' : 'text-zinc-500 hover:text-white hover:bg-zinc-800'}`}
              title="Útil"
            >
              <ThumbsUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setFeedback('down')}
              className={`p-1.5 rounded-md transition-colors ${feedback === 'down' ? 'text-red-400 bg-red-500/10' : 'text-zinc-500 hover:text-white hover:bg-zinc-800'}`}
              title="No útil"
            >
              <ThumbsDown className="w-3.5 h-3.5" />
            </button>
            {onRetry && (
              <button
                onClick={onRetry}
                className="p-1.5 rounded-md text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
                title="Regenerar"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Timestamp for user */}
        {isUser && (
          <div className="text-right mt-1">
            <span className="text-xs text-zinc-500">
              {message.timestamp.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// SKILLS BAR
// ============================================================================

const SkillsBar: React.FC<{ onSelectSkill: (skill: string) => void }> = ({ onSelectSkill }) => {
  const skills = Object.entries(SKILLS).filter(([key]) => key !== 'general');

  return (
    <div className="flex items-center gap-2 px-4 py-3 overflow-x-auto scrollbar-hide">
      {skills.map(([key, skill]) => (
        <button
          key={key}
          onClick={() => onSelectSkill(`/${key} `)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all hover:scale-105"
          style={{
            background: `${skill.color}15`,
            color: skill.color,
            border: `1px solid ${skill.color}30`,
          }}
        >
          {skill.icon}
          {skill.name}
        </button>
      ))}
    </div>
  );
};

// ============================================================================
// VOICE INPUT
// ============================================================================

const useVoiceInput = (onResult: (text: string) => void) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Timeout de 30 segundos para evitar que se cuelgue
  const VOICE_TIMEOUT_MS = 30000;

  const stopListening = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  }, []);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'es-CO';

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        onResult(transcript);
        stopListening();
      };

      recognition.onerror = () => {
        stopListening();
      };

      recognition.onend = () => {
        stopListening();
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [onResult, stopListening]);

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) return;

    if (isListening) {
      stopListening();
    } else {
      recognitionRef.current.start();
      setIsListening(true);
      // Timeout de 30 segundos para evitar que la grabación se cuelgue
      timeoutRef.current = setTimeout(() => {
        console.warn('Voice recognition timeout after 30 seconds');
        stopListening();
      }, VOICE_TIMEOUT_MS);
    }
  }, [isListening, stopListening]);

  return { isListening, isSupported, toggleListening };
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const ChatIAPro: React.FC = () => {
  // State
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const saved = localStorage.getItem('litper-chat-conversations');
    return saved ? JSON.parse(saved) : [];
  });
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showSkills, setShowSkills] = useState(true);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Current conversation
  const currentConversation = useMemo(() =>
    conversations.find(c => c.id === currentConversationId),
    [conversations, currentConversationId]
  );

  const messages = currentConversation?.messages || [];

  // Voice input
  const handleVoiceResult = useCallback((text: string) => {
    setInput(prev => prev + text);
  }, []);

  const { isListening, isSupported, toggleListening } = useVoiceInput(handleVoiceResult);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Save conversations
  useEffect(() => {
    localStorage.setItem('litper-chat-conversations', JSON.stringify(conversations));
  }, [conversations]);

  // Parse skill from input
  const parseInput = (text: string): { skill: SkillType; query: string } => {
    const skillMatch = text.match(/^\/(\w+)\s*(.*)/);
    if (skillMatch) {
      const [, skillName, query] = skillMatch;
      if (skillName in SKILLS) {
        return { skill: skillName as SkillType, query };
      }
    }
    return { skill: 'general', query: text };
  };

  // Create new conversation
  const createConversation = () => {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      title: 'Nueva conversación',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setConversations(prev => [newConversation, ...prev]);
    setCurrentConversationId(newConversation.id);
  };

  // Delete conversation
  const deleteConversation = (id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id));
    if (currentConversationId === id) {
      setCurrentConversationId(null);
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!input.trim()) return;

    // Ensure we have a conversation
    let convId = currentConversationId;
    if (!convId) {
      const newConversation: Conversation = {
        id: Date.now().toString(),
        title: input.slice(0, 30) + (input.length > 30 ? '...' : ''),
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setConversations(prev => [newConversation, ...prev]);
      convId = newConversation.id;
      setCurrentConversationId(convId);
    }

    const { skill, query } = parseInput(input);

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
      skill,
    };

    setConversations(prev => prev.map(c =>
      c.id === convId
        ? { ...c, messages: [...c.messages, userMessage], updatedAt: new Date() }
        : c
    ));

    setInput('');
    setIsTyping(true);

    // Simulate AI response
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

    const response = skill === 'general'
      ? {
          content: `Entendido. Para ayudarte mejor con "${query}", puedo:\n\n` +
            `- Buscar pedidos relacionados\n` +
            `- Verificar el estado de envíos\n` +
            `- Generar un reporte\n\n` +
            `Escribe **/ayuda** para ver todos los comandos disponibles.`,
        }
      : processSkill(skill, query);

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response.content,
      timestamp: new Date(),
      skill,
      actions: response.actions,
      data: response.data,
    };

    setConversations(prev => prev.map(c =>
      c.id === convId
        ? { ...c, messages: [...c.messages, assistantMessage], updatedAt: new Date() }
        : c
    ));

    setIsTyping(false);
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Select skill
  const selectSkill = (skillCommand: string) => {
    setInput(skillCommand);
    inputRef.current?.focus();
  };

  return (
    <div className="flex h-screen" style={{ background: '#0a0a0f' }}>
      {/* Sidebar - Conversation History */}
      {showSidebar && (
        <div
          className="w-72 flex flex-col border-r"
          style={{
            background: '#0d0d14',
            borderColor: 'rgba(63, 63, 70, 0.5)',
          }}
        >
          {/* Sidebar Header */}
          <div className="p-4 border-b" style={{ borderColor: 'rgba(63, 63, 70, 0.5)' }}>
            <button
              onClick={createConversation}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90"
              style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              }}
            >
              <Plus className="w-4 h-4" />
              Nueva conversación
            </button>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto p-2">
            {conversations.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                <p className="text-sm text-zinc-500">Sin conversaciones</p>
                <p className="text-xs text-zinc-600 mt-1">Inicia una nueva para comenzar</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setCurrentConversationId(conv.id)}
                  className={`
                    w-full flex items-start gap-3 p-3 rounded-xl mb-1 text-left transition-all group
                    ${currentConversationId === conv.id
                      ? 'bg-blue-500/10 border border-blue-500/20'
                      : 'hover:bg-zinc-800/50 border border-transparent'
                    }
                  `}
                >
                  <MessageSquare className={`w-4 h-4 mt-0.5 flex-shrink-0 ${currentConversationId === conv.id ? 'text-blue-400' : 'text-zinc-500'}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${currentConversationId === conv.id ? 'text-white' : 'text-zinc-300'}`}>
                      {conv.title}
                    </p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {conv.messages.length} mensajes • {new Date(conv.updatedAt).toLocaleDateString('es-CO')}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConversation(conv.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded text-zinc-500 hover:text-red-400 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </button>
              ))
            )}
          </div>

          {/* Sidebar Footer */}
          <div className="p-4 border-t" style={{ borderColor: 'rgba(63, 63, 70, 0.5)' }}>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>LITPER IA Pro</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: 'rgba(63, 63, 70, 0.5)' }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              {showSidebar ? <ChevronRight className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)' }}
              >
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-base font-semibold text-white">Chat IA Pro</h1>
                <p className="text-xs text-zinc-500">Asistente de logística inteligente</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSkills(!showSkills)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${showSkills ? 'bg-blue-500/10 text-blue-400' : 'bg-zinc-800 text-zinc-400'}`}
            >
              <Zap className="w-3.5 h-3.5 inline mr-1" />
              Skills
            </button>
          </div>
        </div>

        {/* Skills Bar */}
        {showSkills && (
          <div style={{ borderBottom: '1px solid rgba(63, 63, 70, 0.5)' }}>
            <SkillsBar onSelectSkill={selectSkill} />
          </div>
        )}

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
                style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)' }}
              >
                <Sparkles className="w-10 h-10 text-blue-400" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">¿En qué puedo ayudarte?</h2>
              <p className="text-sm text-zinc-500 mb-6 text-center max-w-md">
                Soy tu asistente de logística. Puedo buscar pedidos, rastrear envíos, gestionar novedades y mucho más.
              </p>
              <div className="grid grid-cols-2 gap-3 max-w-lg">
                {[
                  { icon: <Package className="w-4 h-4" />, label: 'Ver pedidos de hoy', cmd: '/pedidos hoy' },
                  { icon: <Truck className="w-4 h-4" />, label: 'Rastrear un envío', cmd: '/tracking ' },
                  { icon: <MapPin className="w-4 h-4" />, label: 'Semáforo de ciudades', cmd: '/ciudades' },
                  { icon: <BarChart3 className="w-4 h-4" />, label: 'Reporte del día', cmd: '/reporte diario' },
                ].map((item, i) => (
                  <button
                    key={i}
                    onClick={() => selectSkill(item.cmd)}
                    className="flex items-center gap-3 p-4 rounded-xl text-left transition-all hover:scale-[1.02]"
                    style={{
                      background: '#12121a',
                      border: '1px solid rgba(63, 63, 70, 0.5)',
                    }}
                  >
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                      {item.icon}
                    </div>
                    <span className="text-sm text-zinc-300">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  onCopy={() => {}}
                />
              ))}
              {isTyping && (
                <div className="flex justify-start mb-4">
                  <div
                    className="rounded-2xl rounded-tl-md px-4 py-3"
                    style={{
                      background: '#12121a',
                      border: '1px solid rgba(63, 63, 70, 0.5)',
                    }}
                  >
                    <TypingIndicator />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="px-6 pb-6">
          <div
            className="flex items-end gap-3 p-3 rounded-2xl"
            style={{
              background: '#12121a',
              border: '1px solid rgba(63, 63, 70, 0.5)',
            }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Escribe un mensaje o usa /comando..."
              rows={1}
              className="flex-1 bg-transparent text-white text-sm resize-none outline-none placeholder:text-zinc-500"
              style={{
                minHeight: '24px',
                maxHeight: '120px',
              }}
            />

            <div className="flex items-center gap-2">
              {/* Voice Button */}
              {isSupported && (
                <button
                  onClick={toggleListening}
                  className={`
                    p-2 rounded-xl transition-all
                    ${isListening
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                    }
                  `}
                  title={isListening ? 'Detener' : 'Hablar'}
                >
                  {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
              )}

              {/* Send Button */}
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isTyping}
                className="p-2 rounded-xl text-white transition-all disabled:opacity-50"
                style={{
                  background: input.trim() && !isTyping
                    ? 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)'
                    : 'rgba(63, 63, 70, 0.5)',
                }}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>

          <p className="text-xs text-zinc-600 text-center mt-2">
            Escribe <span className="text-zinc-400">/ayuda</span> para ver los comandos disponibles
          </p>
        </div>
      </div>

      {/* Inject animations */}
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default ChatIAPro;

// Type declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}
