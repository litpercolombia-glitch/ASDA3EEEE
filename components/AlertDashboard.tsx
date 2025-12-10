import React, { useState, useMemo } from 'react';
import { Shipment, ShipmentRiskLevel, CarrierName, ShipmentStatus } from '../types';
import {
  Siren,
  AlertTriangle,
  Eye,
  CheckCircle,
  MapPin,
  Truck,
  Phone,
  Clock,
  MessageCircle,
  RefreshCw,
  Filter,
  X,
  PhoneCall,
  MapPinOff,
  Building2,
  TrendingDown,
  Package,
  FileText,
  Copy,
  ExternalLink,
  Zap,
} from 'lucide-react';
import {
  getWhatsAppTemplate,
  getLogisticsTemplates,
  getTrackingUrl,
} from '../services/logisticsService';

interface AlertDashboardProps {
  shipments: Shipment[];
  onSelectShipment?: (shipment: Shipment) => void;
}

// Plantillas WhatsApp Inteligentes por tipo de problema
const getSmartWhatsAppTemplate = (shipment: Shipment): { message: string; actionType: string } => {
  const { riskAnalysis, detailedInfo, id, carrier } = shipment;
  const reason = (riskAnalysis?.reason || '').toUpperCase();
  const rawStatus = (detailedInfo?.rawStatus || '').toUpperCase();
  const destination = detailedInfo?.destination || 'tu ciudad';

  // 🔴 URGENTE: Cliente no contesta
  if (
    reason.includes('NO CONTESTA') ||
    rawStatus.includes('NO CONTESTA') ||
    rawStatus.includes('NO RESPONDE')
  ) {
    return {
      message: `🚨 *URGENTE - Pedido en riesgo de devolución*\n\nHola! Hemos intentado contactarte varias veces para la entrega de tu pedido.\n\n📦 *Guía:* ${id}\n🚚 *Transportadora:* ${carrier}\n📍 *Destino:* ${destination}\n\n⚠️ *Si no confirmamos en las próximas horas, el paquete será devuelto.*\n\n¿Podrías confirmar:\n1️⃣ Tu disponibilidad para recibir\n2️⃣ Un número donde te puedan contactar\n3️⃣ Alguna referencia adicional de la dirección\n\n¡Gracias!`,
      actionType: 'CONTACTO_URGENTE',
    };
  }

  // 🔴 URGENTE: Problema de dirección
  if (
    reason.includes('DIRECCION') ||
    rawStatus.includes('DIRECCION') ||
    rawStatus.includes('NOMENCLATURA') ||
    rawStatus.includes('NO EXISTE')
  ) {
    return {
      message: `📍 *Problema con la dirección de entrega*\n\nHola! La transportadora reporta que hay un problema con la dirección de tu pedido.\n\n📦 *Guía:* ${id}\n🚚 *Transportadora:* ${carrier}\n\n❓ *Por favor confirma:*\n• Dirección completa (incluyendo barrio)\n• Referencias del lugar\n• Número de contacto para el mensajero\n\n⚠️ *Sin esta información no pueden realizar la entrega.*\n\n¡Gracias por tu pronta respuesta!`,
      actionType: 'CORREGIR_DIRECCION',
    };
  }

  // ⚠️ ATENCIÓN: En oficina (devolución inminente)
  if (
    shipment.status === ShipmentStatus.IN_OFFICE ||
    rawStatus.includes('OFICINA') ||
    rawStatus.includes('DISPONIBLE')
  ) {
    return {
      message: `🏢 *Tu pedido está en oficina*\n\nHola! Tu pedido ya llegó y está disponible para retiro.\n\n📦 *Guía:* ${id}\n🚚 *Transportadora:* ${carrier}\n📍 *Ubicación:* Oficina de ${carrier} en ${destination}\n\n⏰ *IMPORTANTE:* Tienes *5 días hábiles* para reclamarlo antes de que sea devuelto.\n\n📋 *Lleva:*\n• Cédula original\n• Número de guía\n\n¿Necesitas que solicitemos una extensión o un nuevo intento de entrega?`,
      actionType: 'RETIRO_OFICINA',
    };
  }

  // ⚠️ ATENCIÓN: Rechazo o intento fallido
  if (
    reason.includes('RECHAZ') ||
    reason.includes('FALLIDO') ||
    rawStatus.includes('RECHAZ') ||
    rawStatus.includes('NO RECIBE')
  ) {
    return {
      message: `📦 *Intento de entrega fallido*\n\nHola! La transportadora intentó entregar tu pedido pero no fue posible.\n\n📦 *Guía:* ${id}\n🚚 *Transportadora:* ${carrier}\n📍 *Destino:* ${destination}\n\n🔄 *Motivo reportado:* ${detailedInfo?.rawStatus || 'No especificado'}\n\n¿Podrías confirmar:\n1️⃣ Día y horario preferido para el nuevo intento\n2️⃣ Si alguien más puede recibir\n3️⃣ Alguna indicación adicional\n\n¡Coordinamos de inmediato!`,
      actionType: 'REPROGRAMAR_ENTREGA',
    };
  }

  // 🟡 SEGUIMIENTO: Zona periférica
  if (reason.includes('ZONA') || reason.includes('PERIFÉRICA')) {
    return {
      message: `📍 *Confirmación de dirección*\n\nHola! Tu pedido va en camino a una zona que requiere referencias adicionales.\n\n📦 *Guía:* ${id}\n🚚 *Transportadora:* ${carrier}\n📍 *Destino:* ${destination}\n\n¿Podrías confirmar referencias como:\n• Conjunto/edificio\n• Local cercano conocido\n• Color de la fachada\n• Indicaciones para el mensajero\n\n¡Así aseguramos la entrega exitosa!`,
      actionType: 'CONFIRMAR_REFERENCIAS',
    };
  }

  // 🔴 URGENTE: Sin movimiento > 72h
  if (reason.includes('72H') || reason.includes('SIN MOVIMIENTO')) {
    return {
      message: `⏰ *Actualización de tu pedido*\n\nHola! Estamos haciendo seguimiento a tu envío que lleva tiempo sin actualización.\n\n📦 *Guía:* ${id}\n🚚 *Transportadora:* ${carrier}\n📍 *Destino:* ${destination}\n⏱️ *Tiempo:* ${riskAnalysis?.timeLabel || 'Varios días'}\n\nYa estamos gestionando con la transportadora. Te mantendremos informado.\n\n¿Tienes alguna novedad o cambio en la dirección de entrega?`,
      actionType: 'SEGUIMIENTO_DEMORA',
    };
  }

  // Default: Template estándar
  return {
    message: getWhatsAppTemplate(shipment),
    actionType: 'GENERAL',
  };
};

// Icono según tipo de problema
const getProblemIcon = (shipment: Shipment) => {
  const reason = (shipment.riskAnalysis?.reason || '').toUpperCase();
  const rawStatus = (shipment.detailedInfo?.rawStatus || '').toUpperCase();

  if (reason.includes('NO CONTESTA') || rawStatus.includes('NO CONTESTA')) {
    return <PhoneCall className="w-5 h-5" />;
  }
  if (reason.includes('DIRECCION') || rawStatus.includes('DIRECCION')) {
    return <MapPinOff className="w-5 h-5" />;
  }
  if (shipment.status === ShipmentStatus.IN_OFFICE || rawStatus.includes('OFICINA')) {
    return <Building2 className="w-5 h-5" />;
  }
  if (reason.includes('RECHAZ') || rawStatus.includes('RECHAZ')) {
    return <TrendingDown className="w-5 h-5" />;
  }
  return <AlertTriangle className="w-5 h-5" />;
};

export const AlertDashboard: React.FC<AlertDashboardProps> = ({ shipments, onSelectShipment }) => {
  const [filterCity, setFilterCity] = useState<
    'ALL' | 'BOGOTA' | 'MEDELLIN' | 'CALI' | 'BARRANQUILLA' | 'BUCARAMANGA' | 'OTROS'
  >('ALL');
  const [filterCarrier, setFilterCarrier] = useState<CarrierName | 'ALL'>('ALL');
  const [filterRisk, setFilterRisk] = useState<ShipmentRiskLevel | 'ALL'>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Categorize Shipments by Risk
  const riskCounts = useMemo(
    () => ({
      urgent: shipments.filter((s) => s.riskAnalysis?.level === ShipmentRiskLevel.URGENT),
      attention: shipments.filter((s) => s.riskAnalysis?.level === ShipmentRiskLevel.ATTENTION),
      watch: shipments.filter((s) => s.riskAnalysis?.level === ShipmentRiskLevel.WATCH),
      normal: shipments.filter((s) => s.riskAnalysis?.level === ShipmentRiskLevel.NORMAL),
    }),
    [shipments]
  );

  // Get unique carriers from shipments
  const availableCarriers = useMemo(() => {
    const carriers = new Set(shipments.map((s) => s.carrier));
    return Array.from(carriers).filter((c) => c !== CarrierName.UNKNOWN);
  }, [shipments]);

  // Get unique cities from shipments
  const availableCities = useMemo(() => {
    const cities: Record<string, number> = {};
    shipments.forEach((s) => {
      const dest = (s.detailedInfo?.destination || '').toUpperCase();
      if (dest.includes('BOGOTA')) cities['BOGOTA'] = (cities['BOGOTA'] || 0) + 1;
      else if (dest.includes('MEDELLIN') || dest.includes('ENVIGADO'))
        cities['MEDELLIN'] = (cities['MEDELLIN'] || 0) + 1;
      else if (dest.includes('CALI')) cities['CALI'] = (cities['CALI'] || 0) + 1;
      else if (dest.includes('BARRANQUILLA'))
        cities['BARRANQUILLA'] = (cities['BARRANQUILLA'] || 0) + 1;
      else if (dest.includes('BUCARAMANGA'))
        cities['BUCARAMANGA'] = (cities['BUCARAMANGA'] || 0) + 1;
      else cities['OTROS'] = (cities['OTROS'] || 0) + 1;
    });
    return cities;
  }, [shipments]);

  const filteredList = useMemo(() => {
    return shipments.filter((s) => {
      // Risk Filter
      if (filterRisk !== 'ALL' && s.riskAnalysis?.level !== filterRisk) return false;

      // City Filter
      const dest = (s.detailedInfo?.destination || '').toUpperCase();
      if (filterCity === 'BOGOTA' && !dest.includes('BOGOTA')) return false;
      if (filterCity === 'MEDELLIN' && !dest.includes('MEDELLIN') && !dest.includes('ENVIGADO'))
        return false;
      if (filterCity === 'CALI' && !dest.includes('CALI')) return false;
      if (filterCity === 'BARRANQUILLA' && !dest.includes('BARRANQUILLA')) return false;
      if (filterCity === 'BUCARAMANGA' && !dest.includes('BUCARAMANGA')) return false;
      if (filterCity === 'OTROS') {
        const isMainCity =
          dest.includes('BOGOTA') ||
          dest.includes('MEDELLIN') ||
          dest.includes('CALI') ||
          dest.includes('BARRANQUILLA') ||
          dest.includes('BUCARAMANGA');
        if (isMainCity) return false;
      }

      // Carrier Filter
      if (filterCarrier !== 'ALL' && s.carrier !== filterCarrier) return false;

      // Default: Only show Alertable items if no specific risk filter is selected
      if (filterRisk === 'ALL') {
        return s.riskAnalysis?.level !== ShipmentRiskLevel.NORMAL;
      }

      return true;
    });
  }, [shipments, filterRisk, filterCity, filterCarrier]);

  // Active filters count
  const activeFiltersCount = [
    filterRisk !== 'ALL' ? 1 : 0,
    filterCity !== 'ALL' ? 1 : 0,
    filterCarrier !== 'ALL' ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const clearAllFilters = () => {
    setFilterRisk('ALL');
    setFilterCity('ALL');
    setFilterCarrier('ALL');
  };

  const handleWhatsApp = (e: React.MouseEvent, shipment: Shipment) => {
    e.stopPropagation();
    const { message } = getSmartWhatsAppTemplate(shipment);
    const url = `https://wa.me/57${shipment.phone || ''}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleCopyGuide = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenTracking = (e: React.MouseEvent, shipment: Shipment) => {
    e.stopPropagation();
    const url = getTrackingUrl(shipment.carrier, shipment.id);
    window.open(url, '_blank');
  };

  const AlertCard: React.FC<{ shipment: Shipment }> = ({ shipment }) => {
    const risk = shipment.riskAnalysis;
    const { actionType } = getSmartWhatsAppTemplate(shipment);

    const colorClass =
      risk?.level === ShipmentRiskLevel.URGENT
        ? 'border-red-500 bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-900/20 dark:to-red-950/10'
        : risk?.level === ShipmentRiskLevel.ATTENTION
          ? 'border-amber-500 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-950/10'
          : risk?.level === ShipmentRiskLevel.WATCH
            ? 'border-yellow-400 bg-gradient-to-br from-yellow-50 to-yellow-100/50 dark:from-yellow-900/20 dark:to-yellow-950/10'
            : 'border-emerald-400 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-950/10';

    const badgeColor =
      risk?.level === ShipmentRiskLevel.URGENT
        ? 'bg-red-500 text-white shadow-red-500/30'
        : risk?.level === ShipmentRiskLevel.ATTENTION
          ? 'bg-amber-500 text-white shadow-amber-500/30'
          : risk?.level === ShipmentRiskLevel.WATCH
            ? 'bg-yellow-500 text-white shadow-yellow-500/30'
            : 'bg-emerald-500 text-white shadow-emerald-500/30';

    const actionButtonLabel =
      {
        CONTACTO_URGENTE: '🚨 Llamar YA',
        CORREGIR_DIRECCION: '📍 Solicitar Dirección',
        RETIRO_OFICINA: '🏢 Notificar Retiro',
        REPROGRAMAR_ENTREGA: '🔄 Reprogramar',
        CONFIRMAR_REFERENCIAS: '📋 Pedir Referencias',
        SEGUIMIENTO_DEMORA: '⏰ Informar Estado',
        GENERAL: '💬 Contactar',
      }[actionType] || '💬 Contactar';

    return (
      <div
        onClick={() => onSelectShipment && onSelectShipment(shipment)}
        className={`rounded-2xl border-l-4 p-5 shadow-md relative hover:shadow-xl hover:scale-[1.01] transition-all cursor-pointer ${colorClass}`}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span
                className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm ${badgeColor}`}
              >
                {risk?.level}
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-navy-700 text-slate-600 dark:text-slate-300">
                {shipment.carrier}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => handleCopyGuide(e, shipment.id)}
                className="text-sm font-mono font-bold text-slate-700 dark:text-slate-200 hover:text-blue-600 flex items-center gap-1 transition-colors"
                title="Copiar guía"
              >
                #{shipment.id}
                {copiedId === shipment.id ? (
                  <CheckCircle className="w-3 h-3 text-emerald-500" />
                ) : (
                  <Copy className="w-3 h-3 opacity-50" />
                )}
              </button>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            {risk?.timeLabel && (
              <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-bold text-xs bg-white/80 dark:bg-navy-800/80 px-2 py-1 rounded-lg">
                <Clock className="w-3 h-3" /> {risk.timeLabel}
              </div>
            )}
            <div className="p-1.5 rounded-lg bg-white/50 dark:bg-navy-800/50 text-slate-500">
              {getProblemIcon(shipment)}
            </div>
          </div>
        </div>

        {/* Destination */}
        <div className="flex items-center gap-2 mb-3 text-sm">
          <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <span className="font-semibold text-slate-700 dark:text-slate-200 truncate">
            {shipment.detailedInfo?.destination || 'Colombia'}
          </span>
        </div>

        {/* Risk Info */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white/60 dark:bg-navy-800/60 rounded-lg p-2.5">
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Motivo</p>
            <p className="font-medium text-slate-700 dark:text-slate-200 text-xs leading-tight line-clamp-2">
              {risk?.reason}
            </p>
          </div>
          <div className="bg-white/60 dark:bg-navy-800/60 rounded-lg p-2.5">
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Acción</p>
            <p className="font-bold text-slate-800 dark:text-white text-xs leading-tight line-clamp-2">
              {risk?.action}
            </p>
          </div>
        </div>

        {/* Status Quote */}
        {shipment.detailedInfo?.rawStatus && (
          <p className="text-[11px] text-slate-500 dark:text-slate-400 italic mb-4 border-t border-slate-200/50 dark:border-slate-700/50 pt-2 line-clamp-2">
            "{shipment.detailedInfo.rawStatus}"
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={(e) => handleWhatsApp(e, shipment)}
            disabled={!shipment.phone}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all ${
              shipment.phone
                ? 'bg-green-500 hover:bg-green-600 text-white hover:shadow-md active:scale-95'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            {shipment.phone ? actionButtonLabel : 'Sin teléfono'}
          </button>

          <button
            onClick={(e) => handleOpenTracking(e, shipment)}
            className="p-2.5 bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl text-slate-500 hover:text-blue-600 hover:border-blue-300 transition-all hover:shadow-sm"
            title="Ver tracking en 17Track"
          >
            <ExternalLink className="w-4 h-4" />
          </button>

          <button
            onClick={() => onSelectShipment && onSelectShipment(shipment)}
            className="p-2.5 bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl text-slate-500 hover:text-purple-600 hover:border-purple-300 transition-all hover:shadow-sm"
            title="Ver detalles completos"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      {/* HEADER - Risk Intelligence Dashboard */}
      <div className="bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 text-white p-6 rounded-2xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <Siren className="w-40 h-40" />
        </div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl"></div>

        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-3 mb-1">
                <div className="p-2 bg-red-500/20 rounded-xl">
                  <Siren className="w-7 h-7 text-red-400 animate-pulse" />
                </div>
                CENTRO DE ALERTAS
              </h2>
              <p className="text-sm text-slate-400">
                Inteligencia Operativa Proactiva •{' '}
                {new Date().toLocaleDateString('es-CO', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </p>
            </div>

            {/* Risk Counters - Clickable Filters */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() =>
                  setFilterRisk(
                    filterRisk === ShipmentRiskLevel.URGENT ? 'ALL' : ShipmentRiskLevel.URGENT
                  )
                }
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  filterRisk === ShipmentRiskLevel.URGENT
                    ? 'bg-red-500 shadow-lg shadow-red-500/30 scale-105'
                    : 'bg-navy-700/50 hover:bg-navy-700'
                }`}
              >
                <div className="text-2xl font-black text-red-400">{riskCounts.urgent.length}</div>
                <div className="text-left">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-red-300">
                    Urgentes
                  </div>
                  <div className="text-[9px] text-red-400/60">🔴 Resolver ya</div>
                </div>
              </button>

              <button
                onClick={() =>
                  setFilterRisk(
                    filterRisk === ShipmentRiskLevel.ATTENTION ? 'ALL' : ShipmentRiskLevel.ATTENTION
                  )
                }
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  filterRisk === ShipmentRiskLevel.ATTENTION
                    ? 'bg-amber-500 shadow-lg shadow-amber-500/30 scale-105'
                    : 'bg-navy-700/50 hover:bg-navy-700'
                }`}
              >
                <div className="text-2xl font-black text-amber-400">
                  {riskCounts.attention.length}
                </div>
                <div className="text-left">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                    Atención
                  </div>
                  <div className="text-[9px] text-amber-400/60">⚠️ Hoy</div>
                </div>
              </button>

              <button
                onClick={() =>
                  setFilterRisk(
                    filterRisk === ShipmentRiskLevel.WATCH ? 'ALL' : ShipmentRiskLevel.WATCH
                  )
                }
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  filterRisk === ShipmentRiskLevel.WATCH
                    ? 'bg-yellow-500 shadow-lg shadow-yellow-500/30 scale-105'
                    : 'bg-navy-700/50 hover:bg-navy-700'
                }`}
              >
                <div className="text-2xl font-black text-yellow-400">{riskCounts.watch.length}</div>
                <div className="text-left">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-yellow-300">
                    Seguimiento
                  </div>
                  <div className="text-[9px] text-yellow-400/60">🟡 Monitorear</div>
                </div>
              </button>

              <button
                onClick={() =>
                  setFilterRisk(
                    filterRisk === ShipmentRiskLevel.NORMAL ? 'ALL' : ShipmentRiskLevel.NORMAL
                  )
                }
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  filterRisk === ShipmentRiskLevel.NORMAL
                    ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30 scale-105'
                    : 'bg-navy-700/50 hover:bg-navy-700'
                }`}
              >
                <div className="text-2xl font-black text-emerald-400">
                  {riskCounts.normal.length}
                </div>
                <div className="text-left">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                    Normal
                  </div>
                  <div className="text-[9px] text-emerald-400/60">🟢 OK</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* FILTROS CRUZADOS */}
      <div className="bg-white dark:bg-navy-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-navy-800">
        <div className="flex flex-col gap-4">
          {/* Filter Header */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              Filtros Cruzados
              {activeFiltersCount > 0 && (
                <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold px-2 py-0.5 rounded-full">
                  {activeFiltersCount} activos
                </span>
              )}
            </span>
            {activeFiltersCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="text-xs text-slate-500 hover:text-red-500 flex items-center gap-1 transition-colors"
              >
                <X className="w-3 h-3" /> Limpiar filtros
              </button>
            )}
          </div>

          {/* Active Filter Tags */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap gap-2">
              {filterRisk !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-navy-800 dark:to-navy-700 rounded-full text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-navy-600">
                  Riesgo: {filterRisk}
                  <button
                    onClick={() => setFilterRisk('ALL')}
                    className="ml-1 text-red-400 hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filterCity !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-navy-800 dark:to-navy-700 rounded-full text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-navy-600">
                  Ciudad: {filterCity}
                  <button
                    onClick={() => setFilterCity('ALL')}
                    className="ml-1 text-red-400 hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filterCarrier !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-navy-800 dark:to-navy-700 rounded-full text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-navy-600">
                  Transportadora: {filterCarrier}
                  <button
                    onClick={() => setFilterCarrier('ALL')}
                    className="ml-1 text-red-400 hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          )}

          {/* Filter Rows */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* City Filter */}
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Ciudad
              </p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setFilterCity('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                    filterCity === 'ALL'
                      ? 'bg-navy-800 text-white border-navy-800 shadow-sm'
                      : 'bg-slate-50 dark:bg-navy-950 text-slate-500 border-slate-200 dark:border-navy-700 hover:border-navy-400'
                  }`}
                >
                  Todas
                </button>
                {Object.entries(availableCities).map(([city, count]) => (
                  <button
                    key={city}
                    onClick={() => setFilterCity(city as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1.5 ${
                      filterCity === city
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-slate-50 dark:bg-navy-950 text-slate-500 border-slate-200 dark:border-navy-700 hover:border-blue-400'
                    }`}
                  >
                    {city}
                    <span
                      className={`text-[10px] px-1.5 rounded-full ${
                        filterCity === city ? 'bg-blue-500' : 'bg-slate-200 dark:bg-navy-700'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Carrier Filter */}
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 flex items-center gap-1">
                <Truck className="w-3 h-3" /> Transportadora
              </p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setFilterCarrier('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                    filterCarrier === 'ALL'
                      ? 'bg-navy-800 text-white border-navy-800 shadow-sm'
                      : 'bg-slate-50 dark:bg-navy-950 text-slate-500 border-slate-200 dark:border-navy-700 hover:border-navy-400'
                  }`}
                >
                  Todas
                </button>
                {availableCarriers.map((carrier) => {
                  const count = shipments.filter((s) => s.carrier === carrier).length;
                  const carrierColors: Record<string, string> = {
                    [CarrierName.INTER_RAPIDISIMO]: 'bg-orange-500 border-orange-500',
                    [CarrierName.ENVIA]: 'bg-red-600 border-red-600',
                    [CarrierName.COORDINADORA]: 'bg-blue-600 border-blue-600',
                    [CarrierName.TCC]: 'bg-yellow-500 border-yellow-500 text-navy-900',
                    [CarrierName.VELOCES]: 'bg-emerald-600 border-emerald-600',
                  };
                  return (
                    <button
                      key={carrier}
                      onClick={() => setFilterCarrier(carrier)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1.5 ${
                        filterCarrier === carrier
                          ? `${carrierColors[carrier] || 'bg-purple-600 border-purple-600'} text-white shadow-sm`
                          : 'bg-slate-50 dark:bg-navy-950 text-slate-500 border-slate-200 dark:border-navy-700 hover:border-purple-400'
                      }`}
                    >
                      {carrier}
                      <span
                        className={`text-[10px] px-1.5 rounded-full ${
                          filterCarrier === carrier
                            ? 'bg-white/20'
                            : 'bg-slate-200 dark:bg-navy-700'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between px-2">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Mostrando{' '}
          <span className="font-bold text-slate-700 dark:text-slate-200">
            {filteredList.length}
          </span>{' '}
          alertas
          {activeFiltersCount > 0 &&
            ` de ${shipments.filter((s) => s.riskAnalysis?.level !== ShipmentRiskLevel.NORMAL).length} totales`}
        </p>
        {filteredList.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Zap className="w-3 h-3" />
            Click en las tarjetas para ver detalles
          </div>
        )}
      </div>

      {/* ALERTS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredList.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white dark:bg-navy-900 rounded-2xl border-2 border-dashed border-slate-200 dark:border-navy-800">
            <div className="inline-flex p-4 bg-emerald-100 dark:bg-emerald-900/20 rounded-full mb-4">
              <CheckCircle className="w-12 h-12 text-emerald-500" />
            </div>
            <p className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-1">
              ¡Todo bajo control!
            </p>
            <p className="text-sm text-slate-400 mb-4">
              No hay alertas activas para los filtros seleccionados.
            </p>
            {activeFiltersCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="text-sm text-blue-500 hover:text-blue-600 font-medium"
              >
                Ver todas las alertas →
              </button>
            )}
          </div>
        ) : (
          filteredList.map((s) => <AlertCard key={s.id} shipment={s} />)
        )}
      </div>
    </div>
  );
};
