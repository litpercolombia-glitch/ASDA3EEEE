import React, { useState } from 'react';
import {
  AlertTriangle,
  Phone,
  Package,
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  XCircle,
  AlertCircle,
  Info,
  CheckCircle,
  RefreshCw,
} from 'lucide-react';
import { ErrorTrackingEntry, TrackingErrorType, CarrierName } from '../../types';

interface ErrorTrackingTableProps {
  errors: ErrorTrackingEntry[];
  onRetryGuide?: (error: ErrorTrackingEntry) => void;
  onMarkResolved?: (errorId: string, note?: string) => void;
  title?: string;
  showBatchInfo?: boolean;
}

const ERROR_TYPE_CONFIG: Record<
  TrackingErrorType,
  { label: string; icon: React.ReactNode; color: string; bgColor: string }
> = {
  CARRIER_NOT_DETECTED: {
    label: 'Transportadora no detectada',
    icon: <Package className="w-4 h-4" />,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
  INVALID_GUIDE_FORMAT: {
    label: 'Formato de guía inválido',
    icon: <XCircle className="w-4 h-4" />,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
  PHONE_NOT_FOUND: {
    label: 'Teléfono no encontrado',
    icon: <Phone className="w-4 h-4" />,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
  },
  DUPLICATE_GUIDE: {
    label: 'Guía duplicada',
    icon: <Copy className="w-4 h-4" />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  TRACKING_API_ERROR: {
    label: 'Error de API de tracking',
    icon: <ExternalLink className="w-4 h-4" />,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
  PARSE_ERROR: {
    label: 'Error al procesar datos',
    icon: <AlertCircle className="w-4 h-4" />,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
  STATUS_UNKNOWN: {
    label: 'Estado desconocido',
    icon: <Info className="w-4 h-4" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  DATA_INCOMPLETE: {
    label: 'Datos incompletos',
    icon: <AlertTriangle className="w-4 h-4" />,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
  },
};

const ErrorTrackingTable: React.FC<ErrorTrackingTableProps> = ({
  errors,
  onRetryGuide,
  onMarkResolved,
  title = 'Guías con Errores',
  showBatchInfo = true,
}) => {
  const [expandedErrors, setExpandedErrors] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<TrackingErrorType | 'ALL'>('ALL');
  const [showResolved, setShowResolved] = useState(false);

  const filteredErrors = errors.filter((error) => {
    if (!showResolved && error.resolved) return false;
    if (filterType === 'ALL') return true;
    return error.errorType === filterType;
  });

  const errorTypeCounts = errors.reduce(
    (acc, error) => {
      if (!error.resolved) {
        acc[error.errorType] = (acc[error.errorType] || 0) + 1;
      }
      return acc;
    },
    {} as Record<TrackingErrorType, number>
  );

  const toggleExpanded = (id: string) => {
    setExpandedErrors((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatPhone = (phone?: string) => {
    if (!phone) return 'N/A';
    // Format Colombian phone: +57 300 123 4567
    if (phone.startsWith('+57')) {
      return phone.replace(/(\+57)(\d{3})(\d{3})(\d{4})/, '$1 $2 $3 $4');
    }
    return phone;
  };

  const getWhatsAppLink = (phone?: string, guideNumber?: string) => {
    if (!phone) return null;
    const formattedPhone = phone.replace(/\D/g, '');
    const message = encodeURIComponent(
      `Hola, tengo una consulta sobre la guía ${guideNumber || 'N/A'}. ¿Podrían ayudarme?`
    );
    return `https://wa.me/${formattedPhone}?text=${message}`;
  };

  if (errors.length === 0) {
    return null;
  }

  const unresolvedCount = errors.filter((e) => !e.resolved).length;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-red-200 dark:border-red-800 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{title}</h3>
              <p className="text-red-100 text-sm">
                {unresolvedCount} guía{unresolvedCount !== 1 ? 's' : ''} con problemas de{' '}
                {errors.length} total
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-white/80 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={showResolved}
                onChange={(e) => setShowResolved(e.target.checked)}
                className="rounded border-white/30 bg-white/20 text-red-600 focus:ring-red-500"
              />
              Mostrar resueltos
            </label>
          </div>
        </div>
      </div>

      {/* Filter Pills */}
      <div className="px-6 py-3 bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-800 flex flex-wrap gap-2">
        <button
          onClick={() => setFilterType('ALL')}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
            filterType === 'ALL'
              ? 'bg-red-600 text-white'
              : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-red-100'
          }`}
        >
          Todos ({unresolvedCount})
        </button>
        {Object.entries(errorTypeCounts).map(([type, count]) => {
          const config = ERROR_TYPE_CONFIG[type as TrackingErrorType];
          return (
            <button
              key={type}
              onClick={() => setFilterType(type as TrackingErrorType)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
                filterType === type
                  ? 'bg-red-600 text-white'
                  : `${config.bgColor} ${config.color} hover:opacity-80`
              }`}
            >
              {config.icon}
              {config.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                Error
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                # Guía
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                Teléfono
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                Razón
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
            {filteredErrors.map((error) => {
              const config = ERROR_TYPE_CONFIG[error.errorType];
              const isExpanded = expandedErrors.has(error.id);
              const whatsappLink = getWhatsAppLink(error.phone, error.guideNumber);

              return (
                <React.Fragment key={error.id}>
                  <tr
                    className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                      error.resolved ? 'opacity-50' : ''
                    }`}
                  >
                    {/* Error Type */}
                    <td className="px-4 py-3">
                      <div
                        className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg ${config.bgColor} ${config.color}`}
                      >
                        {config.icon}
                        <span className="text-sm font-medium">{config.label}</span>
                      </div>
                      {error.resolved && (
                        <span className="ml-2 inline-flex items-center gap-1 text-green-600 text-xs">
                          <CheckCircle className="w-3 h-3" />
                          Resuelto
                        </span>
                      )}
                    </td>

                    {/* Guide Number */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-gray-900 dark:text-white">
                          {error.guideNumber || 'N/A'}
                        </span>
                        {error.guideNumber && (
                          <button
                            onClick={() => copyToClipboard(error.guideNumber, `guide-${error.id}`)}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                            title="Copiar guía"
                          >
                            {copiedId === `guide-${error.id}` ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4 text-gray-400" />
                            )}
                          </button>
                        )}
                      </div>
                      {error.attemptedCarrier && error.attemptedCarrier !== CarrierName.UNKNOWN && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {error.attemptedCarrier}
                        </span>
                      )}
                    </td>

                    {/* Phone */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-gray-700 dark:text-gray-300">
                          {formatPhone(error.phone)}
                        </span>
                        {error.phone && (
                          <>
                            <button
                              onClick={() => copyToClipboard(error.phone!, `phone-${error.id}`)}
                              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                              title="Copiar teléfono"
                            >
                              {copiedId === `phone-${error.id}` ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <Copy className="w-4 h-4 text-gray-400" />
                              )}
                            </button>
                            {whatsappLink && (
                              <a
                                href={whatsappLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 hover:bg-green-100 dark:hover:bg-green-900/30 rounded transition-colors"
                                title="Abrir WhatsApp"
                              >
                                <Phone className="w-4 h-4 text-green-500" />
                              </a>
                            )}
                          </>
                        )}
                      </div>
                    </td>

                    {/* Reason */}
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                        {error.errorReason}
                      </p>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        {onRetryGuide && !error.resolved && (
                          <button
                            onClick={() => onRetryGuide(error)}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                            title="Reintentar"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        )}
                        {onMarkResolved && !error.resolved && (
                          <button
                            onClick={() => onMarkResolved(error.id)}
                            className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                            title="Marcar como resuelto"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => toggleExpanded(error.id)}
                          className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                          title={isExpanded ? 'Contraer' : 'Expandir'}
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <tr className="bg-gray-50 dark:bg-gray-700/30">
                      <td colSpan={5} className="px-6 py-4">
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">ID de Carga:</span>
                              <p className="font-mono text-gray-900 dark:text-white">
                                {error.batchId}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Fecha:</span>
                              <p className="text-gray-900 dark:text-white">
                                {new Date(error.timestamp).toLocaleString('es-CO')}
                              </p>
                            </div>
                            {error.attemptedCarrier && (
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">
                                  Transportadora detectada:
                                </span>
                                <p className="text-gray-900 dark:text-white">
                                  {error.attemptedCarrier}
                                </p>
                              </div>
                            )}
                            {error.resolutionNote && (
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">
                                  Nota de resolución:
                                </span>
                                <p className="text-gray-900 dark:text-white">
                                  {error.resolutionNote}
                                </p>
                              </div>
                            )}
                          </div>

                          {error.rawData && (
                            <div className="mt-3">
                              <span className="text-gray-500 dark:text-gray-400 text-sm">
                                Datos originales:
                              </span>
                              <pre className="mt-1 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs font-mono text-gray-700 dark:text-gray-300 overflow-x-auto">
                                {error.rawData}
                              </pre>
                            </div>
                          )}

                          <div className="flex justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                            {error.guideNumber && (
                              <a
                                href={`https://t.17track.net/es#nums=${error.guideNumber}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                              >
                                <ExternalLink className="w-4 h-4" />
                                Buscar en 17Track
                              </a>
                            )}
                            {whatsappLink && (
                              <a
                                href={whatsappLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
                              >
                                <Phone className="w-4 h-4" />
                                Contactar por WhatsApp
                              </a>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer Summary */}
      {filteredErrors.length === 0 && (
        <div className="px-6 py-8 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-400">
            {showResolved
              ? 'No hay errores que mostrar con los filtros actuales'
              : 'Todos los errores han sido resueltos'}
          </p>
        </div>
      )}

      {filteredErrors.length > 0 && (
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              Mostrando {filteredErrors.length} de {errors.length} errores
            </span>
            <div className="flex items-center gap-4">
              <span className="text-gray-500">
                Pendientes: <strong className="text-red-600">{unresolvedCount}</strong>
              </span>
              <span className="text-gray-500">
                Resueltos:{' '}
                <strong className="text-green-600">
                  {errors.filter((e) => e.resolved).length}
                </strong>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ErrorTrackingTable;
