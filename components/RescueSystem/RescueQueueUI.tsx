// components/RescueSystem/RescueQueueUI.tsx
// Sistema de Cola de Rescate integrado con datos locales

import React, { useState, useMemo } from 'react';
import {
  Shield,
  Phone,
  MessageCircle,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Filter,
  Download,
  PhoneCall,
  X,
  Truck,
  User,
  Calendar,
  Target,
  Zap,
  FileText,
} from 'lucide-react';

// Tipos de novedad y sus probabilidades de recuperación
const NOVELTY_CONFIG: Record<string, { label: string; probability: number; color: string; icon: string }> = {
  'NO_ESTABA': { label: 'No estaba', probability: 0.80, color: 'amber', icon: '🏠' },
  'DIRECCION_ERRADA': { label: 'Dirección errada', probability: 0.90, color: 'blue', icon: '📍' },
  'TELEFONO_ERRADO': { label: 'Teléfono errado', probability: 0.70, color: 'purple', icon: '📱' },
  'RECHAZADO': { label: 'Rechazado', probability: 0.30, color: 'red', icon: '🚫' },
  'ZONA_DIFICIL': { label: 'Zona difícil', probability: 0.60, color: 'orange', icon: '🗺️' },
  'CERRADO': { label: 'Cerrado', probability: 0.85, color: 'slate', icon: '🚪' },
  'PAGO_CONTRAENTREGA': { label: 'Pago contraentrega', probability: 0.75, color: 'emerald', icon: '💰' },
  'OTRO': { label: 'Otro', probability: 0.50, color: 'gray', icon: '❓' },
};

// Scripts de llamada por tipo
const CALL_SCRIPTS: Record<string, string> = {
  'NO_ESTABA': `Hola, buenos días/tardes. Le llamo de [EMPRESA] respecto a su pedido con guía {guia}.

Intentamos entregárselo pero no lo encontramos en la dirección. ¿Cuándo podría estar disponible para recibirlo?

SI RESPONDE HORARIO: "Perfecto, reprogramamos para ese horario. ¿La dirección {direccion} es correcta?"

SI SOLICITA CAMBIO: "Entendido, ¿cuál sería la nueva dirección?"`,

  'DIRECCION_ERRADA': `Hola, buenos días/tardes. Le llamo de [EMPRESA] respecto a su pedido con guía {guia}.

El repartidor no pudo ubicar la dirección registrada. ¿Podría confirmarme la dirección completa con referencias?

TOMAR NOTA DE: Barrio, calle/carrera, número, apartamento, referencias cercanas.`,

  'RECHAZADO': `Hola, buenos días/tardes. Le llamo de [EMPRESA] respecto a su pedido con guía {guia}.

Vemos que el pedido fue rechazado. ¿Hubo algún inconveniente que podamos resolver?

ESCUCHAR Y OFRECER: Cambio de producto, devolución de dinero, reagendar entrega.`,

  'PAGO_CONTRAENTREGA': `Hola, buenos días/tardes. Le llamo de [EMPRESA] respecto a su pedido con guía {guia}.

El pedido tiene pago contraentrega. ¿Tiene disponibilidad para recibirlo y realizar el pago?

CONFIRMAR: Valor exacto, forma de pago (efectivo), fecha disponible.`,
};

// Templates de WhatsApp
const WHATSAPP_TEMPLATES: Record<string, string> = {
  'NO_ESTABA': `Hola {nombre}! 👋

No pudimos entregarte tu pedido con guía *{guia}*.

📍 Motivo: No te encontramos en la dirección.

Por favor confirma:
1️⃣ ¿Cuándo estarás disponible?
2️⃣ ¿La dirección es correcta?

Responde este mensaje para coordinar 🚚`,

  'DIRECCION_ERRADA': `Hola {nombre}! 👋

Tu pedido *{guia}* no pudo ser entregado.

📍 Motivo: No pudimos ubicar la dirección.

Por favor envíanos:
• Dirección completa
• Barrio
• Referencias (cerca de qué queda)

¡Queremos que recibas tu pedido! 📦`,

  'RECHAZADO': `Hola {nombre}! 👋

Vimos que tu pedido *{guia}* fue rechazado al momento de la entrega.

¿Hubo algún inconveniente? Queremos ayudarte a resolverlo.

Responde y un asesor te contactará 🤝`,

  'PAGO_CONTRAENTREGA': `Hola {nombre}! 👋

Tu pedido *{guia}* está pendiente de entrega.

💰 Recuerda que tiene pago contraentrega.

¿Cuándo podemos llevártelo?

Responde con tu disponibilidad 📅`,
};

interface RescueGuide {
  numeroGuia: string;
  telefono?: string;
  nombreCliente?: string;
  ciudadDestino: string;
  direccion?: string;
  tipoNovedad: string;
  descripcionNovedad?: string;
  diasSinMovimiento: number;
  transportadora: string;
  estadoActual: string;
}

interface RescueQueueUIProps {
  guias: RescueGuide[];
  onMarkRecovered?: (guia: string) => void;
  onMarkLost?: (guia: string) => void;
}

type Priority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

const getPriority = (dias: number): Priority => {
  if (dias >= 6) return 'CRITICAL';
  if (dias >= 4) return 'HIGH';
  if (dias >= 2) return 'MEDIUM';
  return 'LOW';
};

const getPriorityConfig = (priority: Priority) => {
  const configs = {
    CRITICAL: { color: 'red', label: 'Crítico', icon: '🔴', order: 0 },
    HIGH: { color: 'orange', label: 'Alto', icon: '🟠', order: 1 },
    MEDIUM: { color: 'amber', label: 'Medio', icon: '🟡', order: 2 },
    LOW: { color: 'green', label: 'Bajo', icon: '🟢', order: 3 },
  };
  return configs[priority];
};

const detectNoveltyType = (descripcion: string): string => {
  const desc = descripcion.toLowerCase();
  if (desc.includes('no estaba') || desc.includes('ausente')) return 'NO_ESTABA';
  if (desc.includes('direccion') || desc.includes('dirección') || desc.includes('ubicar')) return 'DIRECCION_ERRADA';
  if (desc.includes('telefono') || desc.includes('teléfono')) return 'TELEFONO_ERRADO';
  if (desc.includes('rechaz')) return 'RECHAZADO';
  if (desc.includes('zona') || desc.includes('dificil')) return 'ZONA_DIFICIL';
  if (desc.includes('cerrado')) return 'CERRADO';
  if (desc.includes('pago') || desc.includes('contraentrega')) return 'PAGO_CONTRAENTREGA';
  return 'OTRO';
};

export const RescueQueueUI: React.FC<RescueQueueUIProps> = ({
  guias,
  onMarkRecovered,
  onMarkLost,
}) => {
  const [filterPriority, setFilterPriority] = useState<Priority | 'ALL'>('ALL');
  const [expandedGuia, setExpandedGuia] = useState<string | null>(null);
  const [showCallScript, setShowCallScript] = useState<string | null>(null);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Procesar guías para rescate
  const rescueQueue = useMemo(() => {
    return guias
      .filter(g => g.tipoNovedad || g.descripcionNovedad || g.diasSinMovimiento > 3)
      .map(g => {
        const noveltyType = g.tipoNovedad || detectNoveltyType(g.descripcionNovedad || g.estadoActual || '');
        const noveltyConfig = NOVELTY_CONFIG[noveltyType] || NOVELTY_CONFIG['OTRO'];
        const priority = getPriority(g.diasSinMovimiento);

        // Ajustar probabilidad por días
        let probability = noveltyConfig.probability;
        if (g.diasSinMovimiento > 5) probability *= 0.8;
        if (g.diasSinMovimiento > 7) probability *= 0.7;

        return {
          ...g,
          noveltyType,
          noveltyConfig,
          priority,
          priorityConfig: getPriorityConfig(priority),
          recoveryProbability: Math.round(probability * 100),
        };
      })
      .sort((a, b) => {
        const orderA = a.priorityConfig.order;
        const orderB = b.priorityConfig.order;
        if (orderA !== orderB) return orderA - orderB;
        return b.recoveryProbability - a.recoveryProbability;
      });
  }, [guias]);

  // Filtrar
  const filteredQueue = useMemo(() => {
    if (filterPriority === 'ALL') return rescueQueue;
    return rescueQueue.filter(g => g.priority === filterPriority);
  }, [rescueQueue, filterPriority]);

  // Stats
  const stats = useMemo(() => ({
    total: rescueQueue.length,
    critical: rescueQueue.filter(g => g.priority === 'CRITICAL').length,
    high: rescueQueue.filter(g => g.priority === 'HIGH').length,
    medium: rescueQueue.filter(g => g.priority === 'MEDIUM').length,
    low: rescueQueue.filter(g => g.priority === 'LOW').length,
    avgProbability: rescueQueue.length > 0
      ? Math.round(rescueQueue.reduce((sum, g) => sum + g.recoveryProbability, 0) / rescueQueue.length)
      : 0,
  }), [rescueQueue]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const generateWhatsAppUrl = (phone: string, message: string): string => {
    const cleanPhone = phone.replace(/\D/g, '');
    const fullPhone = cleanPhone.startsWith('57') ? cleanPhone : `57${cleanPhone}`;
    return `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`;
  };

  const generateMessage = (guia: typeof rescueQueue[0], template: string): string => {
    return template
      .replace('{nombre}', guia.nombreCliente || 'Cliente')
      .replace('{guia}', guia.numeroGuia)
      .replace('{direccion}', guia.direccion || 'la dirección registrada');
  };

  const exportToCSV = () => {
    const headers = ['Guía', 'Cliente', 'Teléfono', 'Ciudad', 'Transportadora', 'Novedad', 'Días', 'Prioridad', 'Prob. Recuperación'];
    const rows = filteredQueue.map(g => [
      g.numeroGuia,
      g.nombreCliente || '',
      g.telefono || '',
      g.ciudadDestino,
      g.transportadora,
      g.noveltyConfig.label,
      g.diasSinMovimiento,
      g.priorityConfig.label,
      `${g.recoveryProbability}%`
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rescate_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (rescueQueue.length === 0) {
    return (
      <div className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-700 p-8 text-center">
        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-emerald-600" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
          ¡Sin guías para rescatar!
        </h3>
        <p className="text-slate-500 dark:text-slate-400">
          No hay guías con novedades o retrasos significativos en este momento.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header con stats */}
      <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-xl p-4 text-white">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Cola de Rescate</h3>
              <p className="text-sm opacity-90">{stats.total} guías pendientes de gestión</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 bg-red-600/50 rounded-full text-sm font-bold">
              🔴 {stats.critical} críticas
            </span>
            <span className="px-3 py-1 bg-orange-600/50 rounded-full text-sm font-bold">
              🟠 {stats.high} altas
            </span>
            <span className="px-3 py-1 bg-amber-600/50 rounded-full text-sm font-bold">
              🟡 {stats.medium} medias
            </span>
            <span className="px-3 py-1 bg-green-600/50 rounded-full text-sm font-bold">
              🟢 {stats.low} bajas
            </span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Target className="w-4 h-4" />
            <span>Probabilidad promedio de recuperación: <strong>{stats.avgProbability}%</strong></span>
          </div>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
          <Filter className="w-4 h-4" /> Filtrar:
        </span>
        {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map(priority => (
          <button
            key={priority}
            onClick={() => setFilterPriority(priority)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              filterPriority === priority
                ? 'bg-slate-800 dark:bg-white text-white dark:text-slate-800'
                : 'bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-navy-700'
            }`}
          >
            {priority === 'ALL' ? 'Todas' : getPriorityConfig(priority).icon + ' ' + getPriorityConfig(priority).label}
          </button>
        ))}
      </div>

      {/* Lista de guías */}
      <div className="space-y-2">
        {filteredQueue.map(guia => (
          <div
            key={guia.numeroGuia}
            className={`bg-white dark:bg-navy-900 rounded-xl border-2 transition-all ${
              guia.priority === 'CRITICAL' ? 'border-red-300 dark:border-red-800' :
              guia.priority === 'HIGH' ? 'border-orange-300 dark:border-orange-800' :
              guia.priority === 'MEDIUM' ? 'border-amber-300 dark:border-amber-800' :
              'border-slate-200 dark:border-navy-700'
            }`}
          >
            {/* Row principal */}
            <div
              className="p-4 cursor-pointer"
              onClick={() => setExpandedGuia(expandedGuia === guia.numeroGuia ? null : guia.numeroGuia)}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-2xl">{guia.priorityConfig.icon}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-800 dark:text-white">
                        {guia.numeroGuia}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium bg-${guia.noveltyConfig.color}-100 dark:bg-${guia.noveltyConfig.color}-900/30 text-${guia.noveltyConfig.color}-700 dark:text-${guia.noveltyConfig.color}-400`}>
                        {guia.noveltyConfig.icon} {guia.noveltyConfig.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-sm text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {guia.nombreCliente || 'Sin nombre'}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {guia.ciudadDestino}
                      </span>
                      <span className="flex items-center gap-1">
                        <Truck className="w-3 h-3" />
                        {guia.transportadora}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-sm">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span className={`font-bold ${guia.diasSinMovimiento >= 5 ? 'text-red-600' : 'text-slate-600 dark:text-slate-300'}`}>
                        {guia.diasSinMovimiento} días
                      </span>
                    </div>
                    <div className="text-xs text-slate-400">
                      {guia.recoveryProbability}% prob.
                    </div>
                  </div>

                  {/* Acciones rápidas */}
                  <div className="flex items-center gap-1">
                    {guia.telefono && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowWhatsAppModal(guia.numeroGuia);
                          }}
                          className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                          title="Enviar WhatsApp"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowCallScript(guia.numeroGuia);
                          }}
                          className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                          title="Ver script de llamada"
                        >
                          <Phone className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    {expandedGuia === guia.numeroGuia ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Detalles expandidos */}
            {expandedGuia === guia.numeroGuia && (
              <div className="px-4 pb-4 pt-2 border-t border-slate-100 dark:border-navy-800">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Teléfono:</span>
                      <span className="ml-2 font-medium text-slate-800 dark:text-white">
                        {guia.telefono || 'No registrado'}
                      </span>
                      {guia.telefono && (
                        <button
                          onClick={() => copyToClipboard(guia.telefono!, guia.numeroGuia + '-phone')}
                          className="ml-2 text-slate-400 hover:text-slate-600"
                        >
                          {copiedText === guia.numeroGuia + '-phone' ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>
                    <div className="text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Dirección:</span>
                      <span className="ml-2 font-medium text-slate-800 dark:text-white">
                        {guia.direccion || 'No registrada'}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Estado actual:</span>
                      <span className="ml-2 font-medium text-slate-800 dark:text-white">
                        {guia.estadoActual}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    {onMarkRecovered && (
                      <button
                        onClick={() => onMarkRecovered(guia.numeroGuia)}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Recuperada
                      </button>
                    )}
                    {onMarkLost && (
                      <button
                        onClick={() => onMarkLost(guia.numeroGuia)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                        Perdida
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Modal WhatsApp */}
            {showWhatsAppModal === guia.numeroGuia && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowWhatsAppModal(null)}>
                <div className="bg-white dark:bg-navy-900 rounded-2xl max-w-lg w-full shadow-2xl" onClick={e => e.stopPropagation()}>
                  <div className="bg-green-500 p-4 rounded-t-2xl text-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <MessageCircle className="w-6 h-6" />
                        <div>
                          <h3 className="font-bold">WhatsApp para {guia.nombreCliente}</h3>
                          <p className="text-sm opacity-90">{guia.telefono}</p>
                        </div>
                      </div>
                      <button onClick={() => setShowWhatsAppModal(null)} className="p-1 hover:bg-white/20 rounded">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="bg-slate-50 dark:bg-navy-800 rounded-lg p-4 mb-4">
                      <pre className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300 font-sans">
                        {generateMessage(guia, WHATSAPP_TEMPLATES[guia.noveltyType] || WHATSAPP_TEMPLATES['NO_ESTABA'])}
                      </pre>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => copyToClipboard(
                          generateMessage(guia, WHATSAPP_TEMPLATES[guia.noveltyType] || WHATSAPP_TEMPLATES['NO_ESTABA']),
                          'wa-msg'
                        )}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-200 dark:bg-navy-700 text-slate-700 dark:text-slate-200 rounded-lg font-medium hover:bg-slate-300 dark:hover:bg-navy-600 transition-colors"
                      >
                        {copiedText === 'wa-msg' ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        Copiar mensaje
                      </button>
                      <a
                        href={generateWhatsAppUrl(
                          guia.telefono!,
                          generateMessage(guia, WHATSAPP_TEMPLATES[guia.noveltyType] || WHATSAPP_TEMPLATES['NO_ESTABA'])
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Abrir WhatsApp
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Script de Llamada */}
            {showCallScript === guia.numeroGuia && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowCallScript(null)}>
                <div className="bg-white dark:bg-navy-900 rounded-2xl max-w-lg w-full shadow-2xl" onClick={e => e.stopPropagation()}>
                  <div className="bg-blue-500 p-4 rounded-t-2xl text-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Phone className="w-6 h-6" />
                        <div>
                          <h3 className="font-bold">Script de Llamada</h3>
                          <p className="text-sm opacity-90">{guia.nombreCliente} - {guia.telefono}</p>
                        </div>
                      </div>
                      <button onClick={() => setShowCallScript(null)} className="p-1 hover:bg-white/20 rounded">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="mb-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium bg-${guia.noveltyConfig.color}-100 text-${guia.noveltyConfig.color}-700`}>
                        {guia.noveltyConfig.icon} {guia.noveltyConfig.label}
                      </span>
                    </div>
                    <div className="bg-slate-50 dark:bg-navy-800 rounded-lg p-4 mb-4">
                      <pre className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300 font-sans leading-relaxed">
                        {(CALL_SCRIPTS[guia.noveltyType] || CALL_SCRIPTS['NO_ESTABA'])
                          .replace('{guia}', guia.numeroGuia)
                          .replace('{direccion}', guia.direccion || 'la dirección registrada')
                          .replace('{nombre}', guia.nombreCliente || 'Cliente')}
                      </pre>
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 mb-4">
                      <h4 className="font-bold text-amber-800 dark:text-amber-400 text-sm mb-2 flex items-center gap-2">
                        <Zap className="w-4 h-4" /> Tips
                      </h4>
                      <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-1">
                        <li>• Hablar pausado y amable</li>
                        <li>• Tomar nota de lo que diga el cliente</li>
                        <li>• Confirmar datos antes de colgar</li>
                      </ul>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => copyToClipboard(
                          (CALL_SCRIPTS[guia.noveltyType] || CALL_SCRIPTS['NO_ESTABA'])
                            .replace('{guia}', guia.numeroGuia)
                            .replace('{direccion}', guia.direccion || 'la dirección registrada'),
                          'call-script'
                        )}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-200 dark:bg-navy-700 text-slate-700 dark:text-slate-200 rounded-lg font-medium hover:bg-slate-300 dark:hover:bg-navy-600 transition-colors"
                      >
                        {copiedText === 'call-script' ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        Copiar script
                      </button>
                      <a
                        href={`tel:${guia.telefono}`}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                      >
                        <PhoneCall className="w-4 h-4" />
                        Llamar
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RescueQueueUI;
