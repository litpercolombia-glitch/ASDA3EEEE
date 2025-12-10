// components/ProAssistant/tabs/ProChatTab.tsx
// Tab de Chat inteligente con Textos Rápidos y Subflujos para reducir devolución al 8%
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send,
  Mic,
  Sparkles,
  Package,
  Phone,
  FileText,
  Loader2,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  MapPin,
  Truck,
  Clock,
  ChevronRight,
  Download,
  MessageSquare,
  BarChart3,
  X,
  Copy,
  ExternalLink,
  PhoneCall,
  AlertCircle,
  Users,
  Search,
  Filter,
} from 'lucide-react';
import { useProAssistantStore, ProMessage } from '../../../stores/proAssistantStore';
import { Shipment, ShipmentStatus, CarrierName } from '../../../types';
import QuickTextsPanel from '../QuickTextsPanel';
import * as XLSX from 'xlsx';

// ============================================
// COMPONENTE DE BURBUJA DE MENSAJE
// ============================================
const MessageBubble: React.FC<{ message: ProMessage }> = ({ message }) => {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <div className="px-3 py-1 bg-slate-800/50 rounded-full text-xs text-slate-400">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[85%] ${isUser ? 'order-2' : 'order-1'}`}>
        {/* Avatar */}
        {!isUser && (
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <span className="text-xs text-slate-400 font-medium">PRO</span>
          </div>
        )}

        {/* Mensaje */}
        <div
          className={`
            rounded-2xl px-4 py-3
            ${
              isUser
                ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-tr-sm'
                : 'bg-slate-800 text-slate-200 rounded-tl-sm'
            }
          `}
        >
          {/* Contenido con formato basico */}
          <div className="text-sm whitespace-pre-wrap">
            {message.content.split('\n').map((line, i) => {
              // Negritas
              if (line.includes('**')) {
                const parts = line.split(/\*\*(.*?)\*\*/g);
                return (
                  <p key={i} className="mb-1">
                    {parts.map((part, j) =>
                      j % 2 === 1 ? (
                        <strong key={j} className="font-bold">{part}</strong>
                      ) : (
                        part
                      )
                    )}
                  </p>
                );
              }
              // Listas
              if (line.startsWith('- ')) {
                return (
                  <p key={i} className="mb-1 flex items-start gap-2">
                    <span className="text-amber-400">•</span>
                    {line.substring(2)}
                  </p>
                );
              }
              return <p key={i} className="mb-1">{line}</p>;
            })}
          </div>

          {/* Accion ejecutada */}
          {message.action && (
            <div className="mt-3 p-3 bg-slate-900/50 rounded-xl border border-slate-700/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-300">{message.action.label}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  message.action.status === 'completed'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : message.action.status === 'error'
                    ? 'bg-red-500/20 text-red-400'
                    : message.action.status === 'executing'
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-slate-500/20 text-slate-400'
                }`}>
                  {message.action.status === 'completed' && <CheckCircle className="w-3 h-3 inline mr-1" />}
                  {message.action.status === 'error' && <AlertTriangle className="w-3 h-3 inline mr-1" />}
                  {message.action.status === 'executing' && <Loader2 className="w-3 h-3 inline mr-1 animate-spin" />}
                  {message.action.status}
                </span>
              </div>
              {message.action.result && (
                <div className="text-xs text-slate-400">
                  {JSON.stringify(message.action.result, null, 2).substring(0, 200)}...
                </div>
              )}
            </div>
          )}

          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-3 space-y-2">
              {message.attachments.map((att, i) => (
                <div key={i} className="p-3 bg-slate-900/50 rounded-xl border border-slate-700/50">
                  {att.type === 'card' && (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-white">{att.data.title}</p>
                        <p className="text-xs text-slate-400">{att.data.subtitle}</p>
                      </div>
                      <span className="text-2xl font-bold text-amber-400">{att.data.value}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Timestamp */}
        <div className={`text-[10px] text-slate-500 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
          {new Date(message.timestamp).toLocaleTimeString('es-CO', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
    </div>
  );
};

// ============================================
// SUGERENCIAS RAPIDAS
// ============================================
const QuickSuggestions: React.FC<{
  suggestions: string[];
  onSelect: (suggestion: string) => void;
}> = ({ suggestions, onSelect }) => {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {suggestions.map((suggestion, i) => (
        <button
          key={i}
          onClick={() => onSelect(suggestion)}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700
            text-slate-300 text-xs rounded-full
            border border-slate-700 hover:border-amber-500/50
            transition-all duration-200
            flex items-center gap-1"
        >
          <ChevronRight className="w-3 h-3 text-amber-400" />
          {suggestion}
        </button>
      ))}
    </div>
  );
};

// ============================================
// MODAL DE LISTA DE GUÍAS CON TELÉFONO COPIABLE
// ============================================
interface GuideListModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  guides: Shipment[];
  onCallGuide: (guide: Shipment) => void;
  onWhatsApp: (guide: Shipment) => void;
}

const GuideListModal: React.FC<GuideListModalProps> = ({
  isOpen,
  onClose,
  title,
  guides,
  onCallGuide,
  onWhatsApp,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredGuides = guides.filter(g => {
    const term = searchTerm.toLowerCase();
    return (
      g.id.toLowerCase().includes(term) ||
      g.phone?.toLowerCase().includes(term) ||
      g.detailedInfo?.destination?.toLowerCase().includes(term) ||
      g.detailedInfo?.rawStatus?.toLowerCase().includes(term)
    );
  });

  const copyToClipboard = (text: string, type: 'guide' | 'phone', id: string) => {
    navigator.clipboard.writeText(text);
    if (type === 'guide') {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } else {
      setCopiedPhone(id);
      setTimeout(() => setCopiedPhone(null), 2000);
    }
  };

  const exportToExcel = () => {
    const data = filteredGuides.map(g => ({
      'Número Guía': g.id,
      'Teléfono': g.phone || 'N/A',
      'Estado': g.detailedInfo?.rawStatus || g.status,
      'Destino': g.detailedInfo?.destination || 'N/A',
      'Transportadora': g.carrier,
      'Días sin movimiento': g.detailedInfo?.daysInTransit || 0,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Guías');
    XLSX.writeFile(wb, `guias_${title.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[80vh] bg-slate-900 rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">{title}</h3>
              <p className="text-xs text-slate-400">{filteredGuides.length} guías encontradas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Search and Actions */}
        <div className="px-4 py-3 border-b border-slate-700/50 flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por guía, teléfono, ciudad..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
            />
          </div>
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 px-3 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            Excel
          </button>
        </div>

        {/* Lista de guías */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredGuides.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No se encontraron guías</p>
            </div>
          ) : (
            filteredGuides.map((guide) => (
              <div
                key={guide.id}
                className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Info principal */}
                  <div className="flex-1 min-w-0">
                    {/* Número de guía + Teléfono (LADO A LADO) */}
                    <div className="flex items-center gap-3 mb-2">
                      {/* Guía */}
                      <div className="flex items-center gap-2">
                        <span className="text-white font-mono font-bold text-sm">{guide.id}</span>
                        <button
                          onClick={() => copyToClipboard(guide.id, 'guide', guide.id)}
                          className={`p-1 rounded transition-colors ${
                            copiedId === guide.id
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'hover:bg-slate-700 text-slate-400'
                          }`}
                          title="Copiar número de guía"
                        >
                          {copiedId === guide.id ? (
                            <CheckCircle className="w-3.5 h-3.5" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      {/* Separador */}
                      <span className="text-slate-600">|</span>

                      {/* Teléfono */}
                      {guide.phone ? (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-green-400" />
                          <span className="text-green-400 font-mono text-sm">{guide.phone}</span>
                          <button
                            onClick={() => copyToClipboard(guide.phone!, 'phone', guide.id)}
                            className={`p-1 rounded transition-colors ${
                              copiedPhone === guide.id
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'hover:bg-slate-700 text-slate-400'
                            }`}
                            title="Copiar teléfono"
                          >
                            {copiedPhone === guide.id ? (
                              <CheckCircle className="w-3.5 h-3.5" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-xs italic">Sin teléfono</span>
                      )}
                    </div>

                    {/* Estado y detalles */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        guide.status === ShipmentStatus.DELIVERED
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : guide.status === ShipmentStatus.ISSUE
                          ? 'bg-red-500/20 text-red-400'
                          : guide.status === ShipmentStatus.IN_OFFICE
                          ? 'bg-orange-500/20 text-orange-400'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {guide.detailedInfo?.rawStatus || guide.status}
                      </span>

                      {guide.detailedInfo?.destination && (
                        <span className="flex items-center gap-1 text-[10px] text-slate-400">
                          <MapPin className="w-3 h-3" />
                          {guide.detailedInfo.destination}
                        </span>
                      )}

                      <span className="flex items-center gap-1 text-[10px] text-slate-400">
                        <Truck className="w-3 h-3" />
                        {guide.carrier}
                      </span>

                      {guide.detailedInfo?.daysInTransit && guide.detailedInfo.daysInTransit > 0 && (
                        <span className={`flex items-center gap-1 text-[10px] ${
                          guide.detailedInfo.daysInTransit > 5 ? 'text-red-400' :
                          guide.detailedInfo.daysInTransit > 3 ? 'text-amber-400' :
                          'text-slate-400'
                        }`}>
                          <Clock className="w-3 h-3" />
                          {guide.detailedInfo.daysInTransit} días
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-1">
                    {guide.phone && (
                      <>
                        <button
                          onClick={() => onCallGuide(guide)}
                          className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                          title="Llamar"
                        >
                          <PhoneCall className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onWhatsApp(guide)}
                          className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
                          title="WhatsApp"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    <a
                      href={`https://t.17track.net/es#nums=${guide.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-slate-700/50 text-slate-400 rounded-lg hover:bg-slate-700 hover:text-white transition-colors"
                      title="Ver tracking"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer con resumen */}
        <div className="px-4 py-3 border-t border-slate-700/50 bg-slate-900/80">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-4">
              <span className="text-slate-400">
                Total: <span className="text-white font-bold">{filteredGuides.length}</span>
              </span>
              <span className="text-slate-400">
                Con teléfono: <span className="text-green-400 font-bold">
                  {filteredGuides.filter(g => g.phone).length}
                </span>
              </span>
            </div>
            <button
              onClick={() => {
                filteredGuides.filter(g => g.phone).forEach(g => onCallGuide(g));
              }}
              className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-400 hover:to-orange-400 transition-all font-medium"
            >
              <PhoneCall className="w-4 h-4" />
              Llamar a todos ({filteredGuides.filter(g => g.phone).length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
const ProChatTab: React.FC = () => {
  const {
    messages,
    addMessage,
    isTyping,
    setIsTyping,
    setIsProcessing,
    shipmentsContext,
    addTask,
    updateTask,
  } = useProAssistantStore();

  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalGuides, setModalGuides] = useState<Shipment[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll al final
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Focus input
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Handler para filtrar guías desde QuickTexts
  const handleFilterGuides = useCallback((filter: string, guides: Shipment[]) => {
    const filterLabels: Record<string, string> = {
      'reclamo-oficina-3d': 'Reclamo en Oficina +3 días',
      'sin-movimiento-5d': 'Sin movimiento +5 días',
      'no-estaba': 'Novedad: No estaba',
      'rechazado': 'Novedad: Rechazado',
      'direccion-errada': 'Dirección errada',
      'no-cancela': 'No cancela valor',
      'desconoce': 'Desconoce pedido',
      'novedades-24h': 'Novedades <24h',
      'novedades-24-48h': 'Novedades 24-48h',
      'novedades-48-72h': 'Novedades 48-72h',
      'novedades-72h': 'Novedades +72h',
      'alto-valor': 'Alto valor COD',
      'segundo-intento': 'Segundo intento pendiente',
    };

    setModalTitle(filterLabels[filter] || filter);
    setModalGuides(guides);
    setShowGuideModal(true);

    // Agregar mensaje al chat
    addMessage({
      role: 'assistant',
      content: `Encontré **${guides.length}** guías con el filtro "${filterLabels[filter] || filter}".\n\nAbriendo lista para gestión...`,
      suggestions: ['Exportar a Excel', 'Llamar a todos', 'Ver otro filtro'],
    });
  }, [addMessage]);

  // Handler para acciones desde QuickTexts
  const handleAction = useCallback((actionType: string, data?: any) => {
    setIsProcessing(true);

    switch (actionType) {
      case 'schedule-calls':
        addMessage({
          role: 'assistant',
          content: `Programando **${data.guides.length}** llamadas automáticas para hoy (2-6 PM)...\n\n**Tipo:** ${data.type}\n**Impacto estimado:** Rescatar hasta el 75% de estas guías`,
          action: {
            type: 'schedule-calls',
            label: 'Programar Llamadas',
            data: data,
            status: 'executing',
          },
          suggestions: ['Ver progreso', 'Cancelar llamadas', 'Ajustar horario'],
        });

        // Simular ejecución
        setTimeout(() => {
          addMessage({
            role: 'assistant',
            content: `✅ **${data.guides.length} llamadas programadas exitosamente**\n\nHorario: Hoy 2:00 PM - 6:00 PM\nSistema: IA con voz natural\n\n¿Quieres ver el otro grupo de críticos?`,
            suggestions: ['Ver otros críticos', 'Reporte del día', 'Configurar llamadas'],
          });
          setIsProcessing(false);
        }, 2000);
        break;

      case 'call-guides':
        const reason = data.reason === 'reclamo-oficina' ? 'recoger su paquete en oficina' :
                       data.reason === 'reagendar' ? 'reagendar entrega' :
                       data.reason === 'corregir-direccion' ? 'confirmar dirección' :
                       data.reason === 'confirmar-pago' ? 'confirmar forma de pago' :
                       'verificar información';

        addMessage({
          role: 'assistant',
          content: `Iniciando llamadas a **${data.guides.length}** clientes para ${reason}...\n\n🤖 Sistema de llamadas IA activado`,
          action: {
            type: 'call-guides',
            label: `Llamando ${data.guides.length} guías`,
            data: data,
            status: 'executing',
          },
        });
        setIsProcessing(false);
        break;

      case 'whatsapp-mass':
        addMessage({
          role: 'assistant',
          content: `Preparando envío masivo de WhatsApp a **${data.guides.length}** clientes...\n\n📱 Conectando con Chatea Pro...`,
          action: {
            type: 'whatsapp-mass',
            label: 'WhatsApp Masivo',
            data: data,
            status: 'executing',
          },
          suggestions: ['Ver plantilla', 'Personalizar mensaje', 'Cancelar'],
        });

        // Abrir Chatea Pro
        setTimeout(() => {
          window.open('https://chateapro.app/flow/f140677#/livechat', '_blank');
          setIsProcessing(false);
        }, 1500);
        break;

      case 'confirm-availability':
        addMessage({
          role: 'assistant',
          content: `Enviando confirmación de disponibilidad por WhatsApp a **${data.guides.length}** clientes en reparto hoy...\n\n📍 "¿Estará disponible para recibir su pedido hoy?"`,
          suggestions: ['Ver respuestas', 'Reenviar sin respuesta', 'Marcar como confirmado'],
        });
        setIsProcessing(false);
        break;

      case 'show-problem-cities':
        addMessage({
          role: 'assistant',
          content: `**TOP CIUDADES PROBLEMÁTICAS:**\n\n${data.cities.map((c: [string, number], i: number) => `${i + 1}. **${c[0]}**: ${c[1]} novedades`).join('\n')}\n\n🚫 Considera bloquear envíos a estas ciudades temporalmente.`,
          suggestions: ['Bloquear ciudad', 'Ver historial', 'Cambiar transportadora'],
        });
        setIsProcessing(false);
        break;

      case 'show-risky-cities':
        addMessage({
          role: 'assistant',
          content: `Analizando ciudades con tasa de devolución superior al ${data.threshold}%...\n\n📊 Generando ranking...`,
          suggestions: ['Exportar análisis', 'Ver detalle', 'Recomendar bloqueo'],
        });
        setIsProcessing(false);
        break;

      case 'carrier-ranking':
        addMessage({
          role: 'assistant',
          content: `**RANKING DE TRANSPORTADORAS HOY:**\n\nAnalizando datos en tiempo real...`,
          suggestions: ['Comparar semana', 'Ver rutas', 'Sugerir cambio'],
        });
        setIsProcessing(false);
        break;

      case 'show-rate-gauge':
        const current = data.current;
        const target = data.target;
        const diff = current - target;
        const status = current <= target ? '✅ EN META' : current <= target + 4 ? '⚠️ CERCA' : '🔴 ALERTA';

        addMessage({
          role: 'assistant',
          content: `**TASA DE DEVOLUCIÓN HOY**\n\n${status}\n\n📊 **Actual:** ${current.toFixed(1)}%\n🎯 **Meta:** ${target}%\n${diff > 0 ? `📉 **Diferencia:** +${diff.toFixed(1)}% por mejorar` : `📈 **Superando meta por:** ${Math.abs(diff).toFixed(1)}%`}`,
          suggestions: ['¿Cómo mejorar?', 'Ver historial', 'Guías a rescatar'],
        });
        setIsProcessing(false);
        break;

      case 'ai-priority':
        addMessage({
          role: 'assistant',
          content: `**🧠 RECOMENDACIÓN IA - PRIORIDADES HOY:**\n\n1. **URGENTE:** Gestionar guías en Reclamo en Oficina +3 días\n2. **ALTA:** Llamar clientes con "No estaba" antes de 48h\n3. **MEDIA:** Confirmar direcciones erróneas\n4. **PREVENTIVA:** Enviar WhatsApp a envíos en reparto\n\n💡 Empezar por el punto 1 puede reducir tu tasa un 2%`,
          suggestions: ['Ejecutar punto 1', 'Ver todas las guías', 'Otro análisis'],
        });
        setIsProcessing(false);
        break;

      case 'ai-improve-rate':
        addMessage({
          role: 'assistant',
          content: `**📈 PLAN PARA MEJORAR 1% TU TASA:**\n\n1. Gestiona las guías en "Reclamo en Oficina" (Impacto: -0.5%)\n2. Llama a "No estaba" en las primeras 24h (Impacto: -0.3%)\n3. Confirma direcciones antes de despachar a ciudades rojas (Impacto: -0.2%)\n\n⏱️ Tiempo estimado: 2-3 horas de gestión\n💰 Dinero salvado estimado: $150,000 COP`,
          suggestions: ['Empezar ahora', 'Ver detalle', 'Programar para mañana'],
        });
        setIsProcessing(false);
        break;

      case 'export-critical':
        const ws = XLSX.utils.json_to_sheet(data.guides.map((g: Shipment) => ({
          'Guía': g.id,
          'Teléfono': g.phone || 'N/A',
          'Estado': g.detailedInfo?.rawStatus || g.status,
          'Ciudad': g.detailedInfo?.destination || 'N/A',
          'Transportadora': g.carrier,
          'Días': g.detailedInfo?.daysInTransit || 0,
        })));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Críticos');
        XLSX.writeFile(wb, `guias_criticas_${new Date().toISOString().split('T')[0]}.xlsx`);

        addMessage({
          role: 'assistant',
          content: `✅ **Excel exportado exitosamente**\n\n📄 ${data.guides.length} guías críticas listas para gestión manual`,
          suggestions: ['Ver otra lista', 'Programar llamadas', 'Reporte completo'],
        });
        setIsProcessing(false);
        break;

      default:
        addMessage({
          role: 'assistant',
          content: `Ejecutando acción: ${actionType}...`,
        });
        setIsProcessing(false);
    }
  }, [addMessage, setIsProcessing]);

  // Llamar a una guía
  const handleCallGuide = useCallback((guide: Shipment) => {
    if (guide.phone) {
      window.open(`tel:${guide.phone}`, '_self');
    }
  }, []);

  // WhatsApp a una guía
  const handleWhatsAppGuide = useCallback((guide: Shipment) => {
    if (guide.phone) {
      const message = encodeURIComponent(
        `Hola! Te escribimos de Litper respecto a tu pedido con guía ${guide.id}. ¿Podrías confirmar tu disponibilidad para la entrega?`
      );
      window.open(`https://wa.me/57${guide.phone.replace(/\D/g, '')}?text=${message}`, '_blank');
    }
  }, []);

  // Procesar mensaje del usuario
  const processUserMessage = async (text: string) => {
    const lowerText = text.toLowerCase();

    // Agregar mensaje del usuario
    addMessage({
      role: 'user',
      content: text,
    });

    setIsTyping(true);
    setIsProcessing(true);

    // Simular delay de procesamiento
    await new Promise((r) => setTimeout(r, 800 + Math.random() * 800));

    // ============================================
    // LOGICA DE INTENCIONES Y RESPUESTAS
    // ============================================

    // CRÍTICOS / URGENTES
    if (lowerText.includes('critico') || lowerText.includes('urgente') || lowerText.includes('prioridad')) {
      const criticos = shipmentsContext.filter(s =>
        s.status === ShipmentStatus.ISSUE ||
        s.status === ShipmentStatus.IN_OFFICE
      );

      addMessage({
        role: 'assistant',
        content: `Tienes **${criticos.length}** guías críticas que requieren atención inmediata.\n\n💡 **Usa los textos rápidos arriba** para gestionar por categoría:\n- 🔴 CRÍTICOS HOY\n- 📞 RESCATAR GUÍAS\n- ⚡ ACCIONES MASIVAS`,
        suggestions: ['Ver críticos', 'Llamar a todos', 'Recomendación IA'],
      });
    }

    // NOVEDADES
    else if (lowerText.includes('novedad') || lowerText.includes('novedades')) {
      const novedadesGuias = shipmentsContext.filter(
        (s) => s.status === ShipmentStatus.ISSUE
      );

      let response = `Encontré **${novedadesGuias.length}** guías con novedad activa.\n\n`;
      response += `💡 Usa los **textos rápidos** para filtrar por tipo de novedad o tiempo.`;

      addMessage({
        role: 'assistant',
        content: response,
        suggestions: ['Por tipo de novedad', 'Por tiempo', 'Llamar a todos'],
        attachments: novedadesGuias.length > 0 ? [{
          type: 'card',
          data: {
            title: 'Total Novedades',
            subtitle: 'Guías con incidencias',
            value: novedadesGuias.length,
          },
        }] : undefined,
      });
    }

    // RECLAMO EN OFICINA
    else if (lowerText.includes('reclamo') || lowerText.includes('oficina')) {
      const reclamoGuias = shipmentsContext.filter(
        (s) => s.status === ShipmentStatus.IN_OFFICE
      );

      setModalTitle('Reclamo en Oficina');
      setModalGuides(reclamoGuias);
      setShowGuideModal(true);

      addMessage({
        role: 'assistant',
        content: `Tengo **${reclamoGuias.length}** guías en Reclamo en Oficina.\n\n⚠️ Alta probabilidad de devolución si no se gestionan pronto.\n\nAbriendo lista detallada...`,
        suggestions: ['Programar llamadas', 'Enviar WhatsApp', 'Exportar'],
      });
    }

    // REPORTE
    else if (lowerText.includes('reporte') || lowerText.includes('informe') || lowerText.includes('resumen')) {
      const total = shipmentsContext.length;
      const entregados = shipmentsContext.filter((s) => s.status === ShipmentStatus.DELIVERED).length;
      const enTransito = shipmentsContext.filter((s) => s.status === ShipmentStatus.IN_TRANSIT).length;
      const conNovedad = shipmentsContext.filter((s) => s.status === ShipmentStatus.ISSUE).length;
      const enOficina = shipmentsContext.filter((s) => s.status === ShipmentStatus.IN_OFFICE).length;

      const tasaEntrega = total > 0 ? Math.round((entregados / total) * 100) : 0;
      const tasaDevolucion = total > 0 ? Math.round(((conNovedad + enOficina) / total) * 100) : 0;

      addMessage({
        role: 'assistant',
        content: `**📊 REPORTE DEL DÍA**\n\n- **Total guías**: ${total}\n- **Entregados**: ${entregados} (${tasaEntrega}%)\n- **En tránsito**: ${enTransito}\n- **Con novedad**: ${conNovedad}\n- **En oficina**: ${enOficina}\n\n📉 **Tasa de devolución**: ${tasaDevolucion}% (meta: 8%)`,
        suggestions: ['Ver novedades', 'Exportar Excel', 'Análisis IA'],
        action: {
          type: 'generate_report',
          label: 'Reporte Generado',
          data: { total, entregados, enTransito, conNovedad },
          status: 'completed',
        },
      });
    }

    // AYUDA / SALUDO
    else if (lowerText.includes('hola') || lowerText.includes('ayuda') || lowerText.includes('help')) {
      addMessage({
        role: 'assistant',
        content: `¡Hola! Soy tu asistente PRO de Litper.\n\n**Objetivo:** Reducir devolución del 15% al 8%\n\n🎯 **Usa los textos rápidos arriba** para:\n- Ver críticos y rescatar guías\n- Prevenir devoluciones\n- Analizar transportadoras y ciudades\n- Obtener recomendaciones IA\n\n¿Qué necesitas gestionar hoy?`,
        suggestions: ['Críticos de hoy', 'Mi progreso', 'Recomendación IA'],
      });
    }

    // RESPUESTA POR DEFECTO
    else {
      addMessage({
        role: 'assistant',
        content: `Entiendo tu consulta.\n\n📦 **${shipmentsContext.length}** guías cargadas\n\n💡 **Tip:** Usa los textos rápidos de colores arriba para acciones rápidas y efectivas.\n\n¿Qué más necesitas?`,
        suggestions: ['Ver críticos', 'Generar reporte', 'Recomendación IA'],
      });
    }

    setIsTyping(false);
    setIsProcessing(false);
  };

  // Enviar mensaje
  const handleSend = () => {
    if (!inputValue.trim()) return;
    processUserMessage(inputValue.trim());
    setInputValue('');
  };

  // Enter para enviar
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Obtener ultima sugerencia
  const lastMessage = messages[messages.length - 1];
  const suggestions = lastMessage?.role === 'assistant' ? lastMessage.suggestions : [];

  return (
    <div className="flex flex-col h-full">
      {/* ============================================ */}
      {/* TEXTOS RÁPIDOS CON SUBFLUJOS */}
      {/* ============================================ */}
      <div className="px-4 py-3 border-b border-slate-700/50 bg-slate-900/70">
        <QuickTextsPanel
          shipments={shipmentsContext}
          onAction={handleAction}
          onFilterGuides={handleFilterGuides}
        />
      </div>

      {/* ============================================ */}
      {/* AREA DE MENSAJES */}
      {/* ============================================ */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {/* Indicador de escritura */}
        {isTyping && (
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <div className="bg-slate-800 rounded-2xl px-4 py-3 rounded-tl-sm">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '100ms' }} />
                <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ============================================ */}
      {/* SUGERENCIAS RAPIDAS */}
      {/* ============================================ */}
      {suggestions && suggestions.length > 0 && !isTyping && (
        <div className="px-4 pb-2">
          <QuickSuggestions
            suggestions={suggestions}
            onSelect={(s) => processUserMessage(s)}
          />
        </div>
      )}

      {/* ============================================ */}
      {/* INPUT DE MENSAJE */}
      {/* ============================================ */}
      <div className="p-4 border-t border-slate-700/50 bg-slate-900/50">
        <div className="flex items-center gap-2">
          {/* Boton de voz */}
          <button
            onClick={() => setIsListening(!isListening)}
            className={`p-3 rounded-xl transition-all ${
              isListening
                ? 'bg-red-500 text-white animate-pulse'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
            }`}
            title="Entrada por voz"
          >
            <Mic className="w-5 h-5" />
          </button>

          {/* Input de texto */}
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Escribe tu mensaje o usa los textos rápidos..."
              disabled={isTyping}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700
                rounded-xl text-white placeholder-slate-500
                focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30
                disabled:opacity-50 disabled:cursor-not-allowed
                text-sm"
            />
          </div>

          {/* Boton de enviar */}
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isTyping}
            className={`p-3 rounded-xl transition-all ${
              inputValue.trim() && !isTyping
                ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-white hover:from-amber-400 hover:to-orange-400 shadow-lg shadow-orange-500/30'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
            title="Enviar mensaje"
          >
            {isTyping ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* ============================================ */}
      {/* MODAL DE LISTA DE GUÍAS */}
      {/* ============================================ */}
      <GuideListModal
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
        title={modalTitle}
        guides={modalGuides}
        onCallGuide={handleCallGuide}
        onWhatsApp={handleWhatsAppGuide}
      />
    </div>
  );
};

export default ProChatTab;
