// ============================================
// LITPER - GUIDE TIMELINE VISUALIZATION
// Visualización de Timeline Histórico de Guía
// ============================================

import React, { useState, useMemo } from 'react';
import {
  Package,
  Clock,
  MapPin,
  Truck,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Phone,
  MessageSquare,
  Copy,
  ExternalLink,
  Calendar,
  Timer,
  AlertCircle,
  Info,
  ArrowRight,
  Building2,
  User,
  DollarSign,
} from 'lucide-react';
import { CarrierName } from '../../types';
import {
  LinkedGuide,
  GuideHistoryEvent,
  NoveltyRecord,
  getCarrierStatusInfo,
} from '../../types/intelligenceModule';

interface GuideTimelineProps {
  guide: LinkedGuide;
  onClose?: () => void;
  onContactClient?: (phone: string) => void;
  onResolveNovelty?: (noveltyId: string) => void;
}

const EventIcon: React.FC<{ status: string; carrierStatus: string }> = ({ status, carrierStatus }) => {
  const lowerStatus = (status + carrierStatus).toLowerCase();

  if (lowerStatus.includes('entregado') || lowerStatus.includes('entrega exitosa')) {
    return <CheckCircle className="w-4 h-4 text-green-500" />;
  }
  if (lowerStatus.includes('novedad') || lowerStatus.includes('fallido') || lowerStatus.includes('devolución')) {
    return <AlertTriangle className="w-4 h-4 text-red-500" />;
  }
  if (lowerStatus.includes('reparto') || lowerStatus.includes('distribución')) {
    return <Truck className="w-4 h-4 text-blue-500" />;
  }
  if (lowerStatus.includes('oficina') || lowerStatus.includes('punto') || lowerStatus.includes('bodega')) {
    return <Building2 className="w-4 h-4 text-amber-500" />;
  }
  if (lowerStatus.includes('tránsito') || lowerStatus.includes('viajando')) {
    return <Package className="w-4 h-4 text-blue-400" />;
  }
  if (lowerStatus.includes('generada') || lowerStatus.includes('admitida')) {
    return <Clock className="w-4 h-4 text-gray-400" />;
  }

  return <Package className="w-4 h-4 text-gray-400" />;
};

const getEventColor = (status: string, carrierStatus: string): string => {
  const lowerStatus = (status + carrierStatus).toLowerCase();

  if (lowerStatus.includes('entregado') || lowerStatus.includes('entrega exitosa')) {
    return 'border-green-500 bg-green-50';
  }
  if (lowerStatus.includes('novedad') || lowerStatus.includes('fallido') || lowerStatus.includes('devolución')) {
    return 'border-red-500 bg-red-50';
  }
  if (lowerStatus.includes('reparto') || lowerStatus.includes('distribución')) {
    return 'border-blue-500 bg-blue-50';
  }
  if (lowerStatus.includes('oficina') || lowerStatus.includes('punto') || lowerStatus.includes('bodega')) {
    return 'border-amber-500 bg-amber-50';
  }

  return 'border-gray-300 bg-gray-50';
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-CO', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDuration = (daysInStatus: number): string => {
  if (daysInStatus === 0) return 'Mismo día';
  if (daysInStatus === 1) return '1 día';
  return `${daysInStatus} días`;
};

export const GuideTimeline: React.FC<GuideTimelineProps> = ({
  guide,
  onClose,
  onContactClient,
  onResolveNovelty,
}) => {
  const [expandedEvent, setExpandedEvent] = useState<number | null>(null);
  const [showAllEvents, setShowAllEvents] = useState(false);

  const riskLevel = useMemo(() => {
    if (guide.scoreRiesgo >= 80) return { label: 'CRÍTICO', color: 'text-red-600 bg-red-100' };
    if (guide.scoreRiesgo >= 60) return { label: 'ALTO', color: 'text-orange-600 bg-orange-100' };
    if (guide.scoreRiesgo >= 40) return { label: 'MEDIO', color: 'text-amber-600 bg-amber-100' };
    return { label: 'BAJO', color: 'text-green-600 bg-green-100' };
  }, [guide.scoreRiesgo]);

  const visibleEvents = showAllEvents ? guide.historial : guide.historial.slice(0, 5);
  const hasMoreEvents = guide.historial.length > 5;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg max-h-[90vh] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-amber-50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-800 flex items-center gap-2">
                Guía #{guide.guia}
                <button
                  onClick={() => copyToClipboard(guide.guia)}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                  title="Copiar número de guía"
                >
                  <Copy className="w-3.5 h-3.5 text-gray-400" />
                </button>
              </h2>
              <p className="text-sm text-gray-500">{guide.transportadora}</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <XCircle className="w-5 h-5 text-gray-400" />
            </button>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-white/80 rounded-lg p-2.5 text-center">
            <div className="text-xs text-gray-500 mb-0.5">Score Riesgo</div>
            <div className={`text-lg font-bold ${riskLevel.color} px-2 py-0.5 rounded inline-block`}>
              {guide.scoreRiesgo}
            </div>
          </div>
          <div className="bg-white/80 rounded-lg p-2.5 text-center">
            <div className="text-xs text-gray-500 mb-0.5">Tiempo Tránsito</div>
            <div className="text-lg font-bold text-gray-700">{guide.tiempoTotalTransito}</div>
          </div>
          <div className="bg-white/80 rounded-lg p-2.5 text-center">
            <div className="text-xs text-gray-500 mb-0.5">Intentos</div>
            <div className={`text-lg font-bold ${guide.intentosEntrega >= 2 ? 'text-red-600' : 'text-gray-700'}`}>
              {guide.intentosEntrega}
            </div>
          </div>
          <div className="bg-white/80 rounded-lg p-2.5 text-center">
            <div className="text-xs text-gray-500 mb-0.5">Novedades</div>
            <div className={`text-lg font-bold ${guide.novedadesRegistradas.filter(n => n.estado !== 'RESUELTA').length > 0 ? 'text-amber-600' : 'text-gray-700'}`}>
              {guide.novedadesRegistradas.filter(n => n.estado !== 'RESUELTA').length}
            </div>
          </div>
        </div>
      </div>

      {/* Guide Info */}
      <div className="p-4 border-b border-gray-100 bg-gray-50">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-400" />
            <div>
              <span className="text-gray-500">Ruta:</span>{' '}
              <span className="font-medium text-gray-700">
                {guide.ciudadOrigen || 'Origen'} <ArrowRight className="w-3 h-3 inline" /> {guide.ciudadDestino || 'Destino'}
              </span>
            </div>
          </div>
          {guide.telefono && (
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-400" />
              <div>
                <span className="text-gray-500">Teléfono:</span>{' '}
                <span className="font-medium text-gray-700">{guide.telefono}</span>
                {onContactClient && (
                  <button
                    onClick={() => onContactClient(guide.telefono!)}
                    className="ml-2 text-green-600 hover:text-green-700"
                  >
                    <MessageSquare className="w-4 h-4 inline" />
                  </button>
                )}
              </div>
            </div>
          )}
          {guide.cliente && (
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" />
              <div>
                <span className="text-gray-500">Cliente:</span>{' '}
                <span className="font-medium text-gray-700">{guide.cliente}</span>
              </div>
            </div>
          )}
          {guide.valorRecaudo && (
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-gray-400" />
              <div>
                <span className="text-gray-500">Recaudo:</span>{' '}
                <span className="font-medium text-gray-700">
                  ${guide.valorRecaudo.toLocaleString('es-CO')} COP
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Open Novelties Alert */}
      {guide.novedadesRegistradas.some(n => n.estado === 'PENDIENTE' || n.estado === 'EN_GESTION') && (
        <div className="mx-4 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-amber-800 text-sm">Novedades Pendientes</p>
              <div className="mt-2 space-y-2">
                {guide.novedadesRegistradas
                  .filter(n => n.estado === 'PENDIENTE' || n.estado === 'EN_GESTION')
                  .map(n => (
                    <div key={n.id} className="flex items-center justify-between bg-white p-2 rounded border border-amber-100">
                      <div>
                        <span className="text-sm font-medium text-gray-700">{n.tipo}</span>
                        <p className="text-xs text-gray-500">{formatDate(n.fechaRegistro)}</p>
                      </div>
                      {onResolveNovelty && (
                        <button
                          onClick={() => onResolveNovelty(n.id)}
                          className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium rounded transition-colors"
                        >
                          Gestionar
                        </button>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4 text-gray-400" />
          <h3 className="font-semibold text-gray-700 text-sm">Historial de Eventos</h3>
          <span className="text-xs text-gray-400">({guide.historial.length} eventos)</span>
        </div>

        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-[15px] top-0 bottom-0 w-0.5 bg-gray-200" />

          {/* Events */}
          <div className="space-y-4">
            {visibleEvents.map((event, index) => {
              const statusInfo = getCarrierStatusInfo(guide.transportadora as CarrierName, event.carrierStatus);
              const isExpanded = expandedEvent === index;

              return (
                <div key={index} className="relative pl-10">
                  {/* Timeline Dot */}
                  <div className={`absolute left-0 w-8 h-8 rounded-full border-2 flex items-center justify-center ${getEventColor(event.status, event.carrierStatus)}`}>
                    <EventIcon status={event.status} carrierStatus={event.carrierStatus} />
                  </div>

                  {/* Event Card */}
                  <div
                    className={`border rounded-lg p-3 transition-all cursor-pointer hover:shadow-md ${
                      index === 0 ? 'border-orange-200 bg-orange-50' : 'border-gray-200 bg-white'
                    }`}
                    onClick={() => setExpandedEvent(isExpanded ? null : index)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {index === 0 && (
                            <span className="px-1.5 py-0.5 bg-orange-500 text-white text-[10px] font-medium rounded">
                              ACTUAL
                            </span>
                          )}
                          <span className="font-medium text-gray-800 text-sm">
                            {event.carrierStatus || event.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(event.timestamp)}
                          </span>
                          {event.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {event.location}
                            </span>
                          )}
                          {event.daysInStatus > 0 && (
                            <span className="flex items-center gap-1">
                              <Timer className="w-3 h-3" />
                              {formatDuration(event.daysInStatus)}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                        {statusInfo && (
                          <div className="p-2 bg-blue-50 rounded-lg">
                            <div className="flex items-start gap-2">
                              <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="text-xs font-medium text-blue-700">Significado:</p>
                                <p className="text-xs text-blue-600">{statusInfo.meaning}</p>
                                <p className="text-xs text-blue-500 mt-1">
                                  Tiempo esperado: {statusInfo.expectedDays} días
                                  {statusInfo.alertAfterDays > 0 && ` • Alerta después de: ${statusInfo.alertAfterDays} días`}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`px-2 py-0.5 text-xs rounded ${
                            event.source === 'AUTO' ? 'bg-gray-100 text-gray-600' :
                            event.source === 'MANUAL' ? 'bg-blue-100 text-blue-600' :
                            'bg-green-100 text-green-600'
                          }`}>
                            {event.source === 'AUTO' ? 'Automático' : event.source === 'MANUAL' ? 'Manual' : 'API Carrier'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Show More/Less */}
          {hasMoreEvents && (
            <button
              onClick={() => setShowAllEvents(!showAllEvents)}
              className="w-full mt-4 py-2 text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1 transition-colors"
            >
              {showAllEvents ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Mostrar menos
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  Mostrar {guide.historial.length - 5} eventos más
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
        <div className="text-xs text-gray-400">
          Creada: {formatDate(guide.fechaCreacion)} • Última actualización: {formatDate(guide.fechaUltimaActualizacion)}
        </div>
        <div className="flex items-center gap-2">
          {guide.telefono && onContactClient && (
            <button
              onClick={() => onContactClient(guide.telefono!)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              WhatsApp
            </button>
          )}
          <a
            href={`https://t.17track.net/es#nums=${guide.guia}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            17Track
          </a>
        </div>
      </div>
    </div>
  );
};

export default GuideTimeline;
