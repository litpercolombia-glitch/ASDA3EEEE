// components/RescueSystem/RescueQueuePanel.tsx
// Sistema de Rescate de Guías Automatizado - Reduce devolución del 15% al 8%
import React, { useState, useMemo, useCallback } from 'react';
import {
  Phone,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  Users,
  MapPin,
  Building2,
  Ban,
  ArrowRight,
  Download,
  Play,
  Pause,
  RefreshCw,
  Filter,
  X,
  Zap,
  Target,
  DollarSign,
  PhoneCall,
  Calendar,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { Shipment, ShipmentStatus, CarrierName } from '../../types';
import * as XLSX from 'xlsx';

// ============================================
// INTERFACES
// ============================================

interface RescueableGuide {
  shipment: Shipment;
  noveltyType: string;
  recoveryProbability: number;
  daysInNovelty: number;
  suggestedAction: string;
  whatsappTemplate: string;
  callScript: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  estimatedValue: number;
  status: 'pending' | 'in_progress' | 'contacted' | 'rescued' | 'lost';
}

interface RescueStats {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  totalPotentialValue: number;
  estimatedRescue: number;
  impactOnReturnRate: number;
}

interface RescueQueuePanelProps {
  shipments: Shipment[];
  onAction?: (action: string, guides: RescueableGuide[]) => void;
}

// ============================================
// CONSTANTES DE CLASIFICACIÓN
// ============================================

const NOVELTY_RECOVERY_RATES: Record<string, { rate: number; action: string; template: string; script: string }> = {
  'NO_ESTABA': {
    rate: 80,
    action: 'Reagendar entrega',
    template: 'Hola {nombre}! Tu pedido con guía {guia} no pudo ser entregado porque no había nadie. ¿Podrías indicarnos el mejor horario para reagendar?',
    script: 'Buenos días, le llamamos de {empresa} respecto a su pedido {guia}. Intentamos entregarlo pero no lo encontramos. ¿Podemos reagendar para hoy o mañana?',
  },
  'DIRECCION_ERRADA': {
    rate: 90,
    action: 'Corregir dirección',
    template: 'Hola {nombre}! Tu pedido {guia} tiene un problema con la dirección. ¿Podrías enviarnos la dirección completa con barrio y referencias?',
    script: 'Buenos días, necesitamos confirmar la dirección de entrega para el pedido {guia}. La dirección registrada parece estar incompleta.',
  },
  'RECHAZO_PEDIDO': {
    rate: 50,
    action: 'Llamar cliente - Confirmar',
    template: 'Hola {nombre}! Vimos que no pudiste recibir tu pedido {guia}. ¿Hay algún problema? Estamos para ayudarte.',
    script: 'Buenos días, le llamamos porque su pedido {guia} fue rechazado en la entrega. ¿Podemos ayudarle con alguna duda sobre el producto?',
  },
  'NO_CANCELA_VALOR': {
    rate: 70,
    action: 'Confirmar forma de pago',
    template: 'Hola {nombre}! Tu pedido {guia} no pudo ser entregado por el pago. ¿Tendrás el valor exacto de ${valor} para el repartidor?',
    script: 'Buenos días, su pedido {guia} requiere pago contraentrega de ${valor}. ¿Podemos confirmar que tendrá el dinero disponible?',
  },
  'DESCONOCE_PEDIDO': {
    rate: 30,
    action: 'Verificar fraude - Llamar',
    template: 'Hola! Tenemos un pedido a tu nombre con guía {guia}. ¿Confirmas que lo solicitaste?',
    script: 'Buenos días, necesitamos verificar un pedido a su nombre con guía {guia}. ¿Usted realizó esta compra?',
  },
  'RECLAMO_OFICINA': {
    rate: 70,
    action: 'Urgente - Llamar para recoger',
    template: 'URGENTE: Tu pedido {guia} está en la oficina de {transportadora}. Tienes máximo 5 días para recogerlo antes de que lo devuelvan.',
    script: 'URGENTE: Su pedido {guia} está en la oficina de {transportadora}. Necesita recogerlo antes de {fecha_limite} o será devuelto.',
  },
  'SIN_MOVIMIENTO': {
    rate: 50,
    action: 'Contactar transportadora',
    template: 'Hola {nombre}! Tu pedido {guia} lleva varios días sin actualización. Estamos gestionando con la transportadora.',
    script: 'Pedido {guia} sin movimiento por {dias} días. Contactar a {transportadora} para verificar ubicación.',
  },
};

const TIME_RECOVERY_RATES: Record<string, number> = {
  'LESS_24H': 90,
  '24_48H': 70,
  '48_72H': 50,
  'MORE_72H': 30,
};

// ============================================
// FUNCIONES AUXILIARES
// ============================================

const detectNoveltyType = (shipment: Shipment): string => {
  const raw = shipment.detailedInfo?.rawStatus?.toUpperCase() || '';
  const status = shipment.status;

  if (status === ShipmentStatus.IN_OFFICE || raw.includes('RECLAM') || raw.includes('OFICINA') || raw.includes('RETIRAR')) {
    return 'RECLAMO_OFICINA';
  }
  if (raw.includes('NO ESTABA') || raw.includes('NADIE') || raw.includes('NO SE LOGRA') || raw.includes('AUSENTE')) {
    return 'NO_ESTABA';
  }
  if (raw.includes('DIRECCI') || raw.includes('NO EXISTE') || raw.includes('NOMENCLATURA') || raw.includes('INCOMPLETA')) {
    return 'DIRECCION_ERRADA';
  }
  if (raw.includes('RECHAZ') || raw.includes('REHUS') || raw.includes('NO RECIBE') || raw.includes('DEVOLVER')) {
    return 'RECHAZO_PEDIDO';
  }
  if (raw.includes('NO CANCEL') || raw.includes('NO PAGA') || raw.includes('DINERO') || raw.includes('EFECTIVO')) {
    return 'NO_CANCELA_VALOR';
  }
  if (raw.includes('DESCONOCE') || raw.includes('NO PIDIO') || raw.includes('NO SOLICITO')) {
    return 'DESCONOCE_PEDIDO';
  }

  // Default: sin movimiento
  return 'SIN_MOVIMIENTO';
};

const getDaysSinceLastUpdate = (shipment: Shipment): number => {
  const lastEvent = shipment.detailedInfo?.events?.[0];
  if (!lastEvent?.date) return shipment.detailedInfo?.daysInTransit || 0;

  const lastDate = new Date(lastEvent.date);
  const now = new Date();
  return Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
};

const calculatePriority = (probability: number, days: number): RescueableGuide['priority'] => {
  if (probability >= 80 || days >= 5) return 'CRITICAL';
  if (probability >= 60 || days >= 3) return 'HIGH';
  if (probability >= 40) return 'MEDIUM';
  return 'LOW';
};

const getTimeRecoveryMultiplier = (days: number): number => {
  if (days < 1) return TIME_RECOVERY_RATES['LESS_24H'] / 100;
  if (days < 2) return TIME_RECOVERY_RATES['24_48H'] / 100;
  if (days < 3) return TIME_RECOVERY_RATES['48_72H'] / 100;
  return TIME_RECOVERY_RATES['MORE_72H'] / 100;
};

// ============================================
// COMPONENTE DE GUÍA RESCATABLE
// ============================================

const RescueGuideCard: React.FC<{
  guide: RescueableGuide;
  onCall: () => void;
  onWhatsApp: () => void;
  onCopyPhone: () => void;
  onMarkStatus: (status: RescueableGuide['status']) => void;
}> = ({ guide, onCall, onWhatsApp, onCopyPhone, onMarkStatus }) => {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const priorityColors = {
    CRITICAL: 'border-red-500/50 bg-red-500/5',
    HIGH: 'border-orange-500/50 bg-orange-500/5',
    MEDIUM: 'border-amber-500/50 bg-amber-500/5',
    LOW: 'border-slate-500/50 bg-slate-500/5',
  };

  const priorityBadges = {
    CRITICAL: 'bg-red-500/20 text-red-400',
    HIGH: 'bg-orange-500/20 text-orange-400',
    MEDIUM: 'bg-amber-500/20 text-amber-400',
    LOW: 'bg-slate-500/20 text-slate-400',
  };

  const handleCopy = () => {
    onCopyPhone();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`rounded-xl border ${priorityColors[guide.priority]} p-3 transition-all duration-200 hover:shadow-lg`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-white font-mono font-bold text-sm">{guide.shipment.id}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${priorityBadges[guide.priority]}`}>
              {guide.priority}
            </span>
          </div>
          {guide.shipment.phone && (
            <div className="flex items-center gap-2">
              <Phone className="w-3 h-3 text-green-400" />
              <span className="text-green-400 font-mono text-xs">{guide.shipment.phone}</span>
              <button
                onClick={handleCopy}
                className={`p-0.5 rounded ${copied ? 'text-emerald-400' : 'text-slate-400 hover:text-white'}`}
              >
                {copied ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          )}
        </div>

        {/* Recovery Probability Gauge */}
        <div className="flex flex-col items-center">
          <div className="relative w-12 h-12">
            <svg className="w-12 h-12 transform -rotate-90">
              <circle
                cx="24"
                cy="24"
                r="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                className="text-slate-700"
              />
              <circle
                cx="24"
                cy="24"
                r="20"
                fill="none"
                stroke={guide.recoveryProbability >= 70 ? '#22c55e' : guide.recoveryProbability >= 50 ? '#f59e0b' : '#ef4444'}
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${guide.recoveryProbability * 1.26} 126`}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
              {guide.recoveryProbability}%
            </span>
          </div>
          <span className="text-[9px] text-slate-400">Recuperable</span>
        </div>
      </div>

      {/* Info */}
      <div className="flex items-center gap-2 flex-wrap mb-2 text-[10px]">
        <span className="flex items-center gap-1 px-2 py-0.5 bg-slate-700/50 rounded-full text-slate-300">
          <AlertCircle className="w-3 h-3" />
          {guide.noveltyType.replace(/_/g, ' ')}
        </span>
        <span className="flex items-center gap-1 px-2 py-0.5 bg-slate-700/50 rounded-full text-slate-300">
          <Clock className="w-3 h-3" />
          {guide.daysInNovelty}d sin mov.
        </span>
        {guide.shipment.detailedInfo?.destination && (
          <span className="flex items-center gap-1 px-2 py-0.5 bg-slate-700/50 rounded-full text-slate-300">
            <MapPin className="w-3 h-3" />
            {guide.shipment.detailedInfo.destination}
          </span>
        )}
      </div>

      {/* Suggested Action */}
      <div className="p-2 bg-slate-800/50 rounded-lg mb-2">
        <p className="text-xs text-slate-400 mb-1">Acción sugerida:</p>
        <p className="text-sm text-amber-400 font-medium">{guide.suggestedAction}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {guide.shipment.phone && (
          <>
            <button
              onClick={onCall}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-xs font-medium transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              Llamar
            </button>
            <button
              onClick={onWhatsApp}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg text-xs font-medium transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              WhatsApp
            </button>
          </>
        )}
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-2 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-slate-400 transition-colors"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-slate-700/50 space-y-3">
          {/* WhatsApp Template */}
          <div>
            <p className="text-[10px] text-slate-400 mb-1">Plantilla WhatsApp:</p>
            <div className="p-2 bg-slate-800 rounded-lg text-xs text-slate-300">
              {guide.whatsappTemplate
                .replace('{guia}', guide.shipment.id)
                .replace('{nombre}', 'Cliente')
                .replace('{transportadora}', guide.shipment.carrier)}
            </div>
          </div>

          {/* Call Script */}
          <div>
            <p className="text-[10px] text-slate-400 mb-1">Script de llamada:</p>
            <div className="p-2 bg-slate-800 rounded-lg text-xs text-slate-300">
              {guide.callScript
                .replace('{guia}', guide.shipment.id)
                .replace('{empresa}', 'Litper')
                .replace('{transportadora}', guide.shipment.carrier)
                .replace('{dias}', String(guide.daysInNovelty))}
            </div>
          </div>

          {/* Status Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onMarkStatus('contacted')}
              className="flex-1 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded text-[10px] font-medium"
            >
              Contactado
            </button>
            <button
              onClick={() => onMarkStatus('rescued')}
              className="flex-1 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded text-[10px] font-medium"
            >
              Rescatado
            </button>
            <button
              onClick={() => onMarkStatus('lost')}
              className="flex-1 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded text-[10px] font-medium"
            >
              Perdido
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

const RescueQueuePanel: React.FC<RescueQueuePanelProps> = ({ shipments, onAction }) => {
  const [filter, setFilter] = useState<'all' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'contacted' | 'rescued' | 'lost'>('all');
  const [guideStatuses, setGuideStatuses] = useState<Record<string, RescueableGuide['status']>>({});

  // Generar cola de rescate
  const rescueQueue = useMemo((): RescueableGuide[] => {
    return shipments
      .filter(s =>
        s.status === ShipmentStatus.ISSUE ||
        s.status === ShipmentStatus.IN_OFFICE ||
        (s.status !== ShipmentStatus.DELIVERED && getDaysSinceLastUpdate(s) >= 3)
      )
      .map(shipment => {
        const noveltyType = detectNoveltyType(shipment);
        const config = NOVELTY_RECOVERY_RATES[noveltyType] || NOVELTY_RECOVERY_RATES['SIN_MOVIMIENTO'];
        const days = getDaysSinceLastUpdate(shipment);
        const timeMultiplier = getTimeRecoveryMultiplier(days);
        const recoveryProbability = Math.round(config.rate * timeMultiplier);
        const priority = calculatePriority(recoveryProbability, days);
        const estimatedValue = shipment.detailedInfo?.declaredValue || 50000;

        return {
          shipment,
          noveltyType,
          recoveryProbability,
          daysInNovelty: days,
          suggestedAction: config.action,
          whatsappTemplate: config.template,
          callScript: config.script,
          priority,
          estimatedValue,
          status: guideStatuses[shipment.id] || 'pending',
        };
      })
      .sort((a, b) => {
        // Ordenar por prioridad y probabilidad
        const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        return b.recoveryProbability - a.recoveryProbability;
      });
  }, [shipments, guideStatuses]);

  // Filtrar cola
  const filteredQueue = useMemo(() => {
    return rescueQueue.filter(g => {
      if (filter !== 'all' && g.priority !== filter) return false;
      if (statusFilter !== 'all' && g.status !== statusFilter) return false;
      return true;
    });
  }, [rescueQueue, filter, statusFilter]);

  // Calcular estadísticas
  const stats = useMemo((): RescueStats => {
    const total = rescueQueue.length;
    const critical = rescueQueue.filter(g => g.priority === 'CRITICAL').length;
    const high = rescueQueue.filter(g => g.priority === 'HIGH').length;
    const medium = rescueQueue.filter(g => g.priority === 'MEDIUM').length;
    const low = rescueQueue.filter(g => g.priority === 'LOW').length;
    const totalPotentialValue = rescueQueue.reduce((sum, g) => sum + g.estimatedValue, 0);
    const estimatedRescue = rescueQueue.reduce((sum, g) => sum + (g.estimatedValue * g.recoveryProbability / 100), 0);
    const impactOnReturnRate = shipments.length > 0
      ? (rescueQueue.filter(g => g.recoveryProbability >= 50).length * 0.75 / shipments.length) * 100
      : 0;

    return { total, critical, high, medium, low, totalPotentialValue, estimatedRescue, impactOnReturnRate };
  }, [rescueQueue, shipments.length]);

  // Handlers
  const handleCall = useCallback((guide: RescueableGuide) => {
    if (guide.shipment.phone) {
      window.open(`tel:${guide.shipment.phone}`, '_self');
    }
  }, []);

  const handleWhatsApp = useCallback((guide: RescueableGuide) => {
    if (guide.shipment.phone) {
      const message = encodeURIComponent(
        guide.whatsappTemplate
          .replace('{guia}', guide.shipment.id)
          .replace('{nombre}', 'Cliente')
          .replace('{transportadora}', guide.shipment.carrier)
      );
      window.open(`https://wa.me/57${guide.shipment.phone.replace(/\D/g, '')}?text=${message}`, '_blank');
    }
  }, []);

  const handleCopyPhone = useCallback((phone: string) => {
    navigator.clipboard.writeText(phone);
  }, []);

  const handleMarkStatus = useCallback((guideId: string, status: RescueableGuide['status']) => {
    setGuideStatuses(prev => ({ ...prev, [guideId]: status }));
  }, []);

  const handleExportQueue = useCallback(() => {
    const data = filteredQueue.map(g => ({
      'Guía': g.shipment.id,
      'Teléfono': g.shipment.phone || 'N/A',
      'Tipo Novedad': g.noveltyType,
      'Probabilidad Rescate': `${g.recoveryProbability}%`,
      'Días en Novedad': g.daysInNovelty,
      'Prioridad': g.priority,
      'Acción Sugerida': g.suggestedAction,
      'Estado': g.status,
      'Ciudad': g.shipment.detailedInfo?.destination || 'N/A',
      'Transportadora': g.shipment.carrier,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Cola de Rescate');
    XLSX.writeFile(wb, `cola_rescate_${new Date().toISOString().split('T')[0]}.xlsx`);
  }, [filteredQueue]);

  const handleMassCall = useCallback(() => {
    const withPhone = filteredQueue.filter(g => g.shipment.phone);
    onAction?.('mass-call', withPhone);
  }, [filteredQueue, onAction]);

  const handleMassWhatsApp = useCallback(() => {
    const withPhone = filteredQueue.filter(g => g.shipment.phone);
    // Abrir Chatea Pro con la lista
    window.open('https://chateapro.app/flow/f140677#/livechat', '_blank');
    onAction?.('mass-whatsapp', withPhone);
  }, [filteredQueue, onAction]);

  return (
    <div className="flex flex-col h-full">
      {/* Header Stats */}
      <div className="p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-b border-slate-700/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">Sistema de Rescate</h3>
              <p className="text-xs text-slate-400">{stats.total} guías recuperables</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportQueue}
              className="p-2 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors"
              title="Exportar Excel"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Impact Stats */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="p-2 bg-slate-800/50 rounded-lg text-center">
            <p className="text-lg font-bold text-emerald-400">-{stats.impactOnReturnRate.toFixed(1)}%</p>
            <p className="text-[9px] text-slate-400">Impacto en Tasa</p>
          </div>
          <div className="p-2 bg-slate-800/50 rounded-lg text-center">
            <p className="text-lg font-bold text-amber-400">{stats.total}</p>
            <p className="text-[9px] text-slate-400">Guías a Rescatar</p>
          </div>
          <div className="p-2 bg-slate-800/50 rounded-lg text-center">
            <p className="text-lg font-bold text-green-400">${(stats.estimatedRescue / 1000).toFixed(0)}K</p>
            <p className="text-[9px] text-slate-400">Valor Recuperable</p>
          </div>
        </div>

        {/* Priority Filters */}
        <div className="flex items-center gap-1 flex-wrap">
          {['all', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-2 py-1 rounded-full text-[10px] font-medium transition-colors ${
                filter === f
                  ? f === 'CRITICAL' ? 'bg-red-500 text-white' :
                    f === 'HIGH' ? 'bg-orange-500 text-white' :
                    f === 'MEDIUM' ? 'bg-amber-500 text-white' :
                    f === 'LOW' ? 'bg-slate-500 text-white' :
                    'bg-amber-500 text-white'
                  : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {f === 'all' ? `Todos (${stats.total})` :
               f === 'CRITICAL' ? `Críticos (${stats.critical})` :
               f === 'HIGH' ? `Altos (${stats.high})` :
               f === 'MEDIUM' ? `Medios (${stats.medium})` :
               `Bajos (${stats.low})`}
            </button>
          ))}
        </div>
      </div>

      {/* Mass Actions */}
      <div className="p-2 border-b border-slate-700/50 flex items-center gap-2">
        <button
          onClick={handleMassCall}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-xs font-medium transition-colors"
        >
          <PhoneCall className="w-4 h-4" />
          Llamar Todos ({filteredQueue.filter(g => g.shipment.phone).length})
        </button>
        <button
          onClick={handleMassWhatsApp}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg text-xs font-medium transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
          WhatsApp Masivo
        </button>
      </div>

      {/* Queue List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredQueue.length === 0 ? (
          <div className="text-center py-8">
            <Zap className="w-12 h-12 mx-auto text-slate-600 mb-3" />
            <p className="text-slate-400 text-sm">No hay guías para rescatar con estos filtros</p>
          </div>
        ) : (
          filteredQueue.map(guide => (
            <RescueGuideCard
              key={guide.shipment.id}
              guide={guide}
              onCall={() => handleCall(guide)}
              onWhatsApp={() => handleWhatsApp(guide)}
              onCopyPhone={() => handleCopyPhone(guide.shipment.phone || '')}
              onMarkStatus={(status) => handleMarkStatus(guide.shipment.id, status)}
            />
          ))
        )}
      </div>

      {/* Footer Summary */}
      <div className="p-3 border-t border-slate-700/50 bg-slate-900/80">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <span className="text-slate-400">
              Mostrando: <span className="text-white font-bold">{filteredQueue.length}</span>
            </span>
            <span className="text-slate-400">
              Con teléfono: <span className="text-green-400 font-bold">
                {filteredQueue.filter(g => g.shipment.phone).length}
              </span>
            </span>
          </div>
          <span className="text-emerald-400 font-bold">
            Rescatar = -{stats.impactOnReturnRate.toFixed(1)}% devolución
          </span>
        </div>
      </div>
    </div>
  );
};

export default RescueQueuePanel;
