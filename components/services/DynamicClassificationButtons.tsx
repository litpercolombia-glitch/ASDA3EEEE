import React, { useState, useMemo } from 'react';
import {
  Package,
  Truck,
  CheckCircle,
  AlertTriangle,
  Clock,
  Building,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  X,
  Phone,
  ExternalLink,
  Eye,
  Copy,
  Filter,
} from 'lucide-react';
import {
  Shipment,
  ShipmentStatus,
  ShipmentRiskLevel,
  CarrierName,
  ClassificationCategory,
  ClassificationSummary,
} from '../../types';

interface DynamicClassificationButtonsProps {
  shipments: Shipment[];
  onGuideClick?: (shipment: Shipment) => void;
  title?: string;
  showAllButton?: boolean;
}

// Configuration for status categories
const STATUS_CONFIG: Record<
  ShipmentStatus,
  { icon: React.ReactNode; color: string; bgColor: string; borderColor: string }
> = {
  [ShipmentStatus.DELIVERED]: {
    icon: <CheckCircle className="w-5 h-5" />,
    color: 'text-green-600',
    bgColor: 'bg-green-50 hover:bg-green-100',
    borderColor: 'border-green-200',
  },
  [ShipmentStatus.IN_TRANSIT]: {
    icon: <Truck className="w-5 h-5" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 hover:bg-blue-100',
    borderColor: 'border-blue-200',
  },
  [ShipmentStatus.IN_OFFICE]: {
    icon: <Building className="w-5 h-5" />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 hover:bg-purple-100',
    borderColor: 'border-purple-200',
  },
  [ShipmentStatus.PENDING]: {
    icon: <Clock className="w-5 h-5" />,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50 hover:bg-yellow-100',
    borderColor: 'border-yellow-200',
  },
  [ShipmentStatus.ISSUE]: {
    icon: <AlertCircle className="w-5 h-5" />,
    color: 'text-red-600',
    bgColor: 'bg-red-50 hover:bg-red-100',
    borderColor: 'border-red-200',
  },
};

// Configuration for risk levels
const RISK_CONFIG: Record<
  ShipmentRiskLevel,
  { icon: React.ReactNode; color: string; bgColor: string; borderColor: string; label: string }
> = {
  [ShipmentRiskLevel.URGENT]: {
    icon: <AlertTriangle className="w-5 h-5" />,
    color: 'text-red-600',
    bgColor: 'bg-red-50 hover:bg-red-100',
    borderColor: 'border-red-300',
    label: 'Urgente',
  },
  [ShipmentRiskLevel.ATTENTION]: {
    icon: <AlertCircle className="w-5 h-5" />,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 hover:bg-orange-100',
    borderColor: 'border-orange-300',
    label: 'Atención',
  },
  [ShipmentRiskLevel.WATCH]: {
    icon: <Eye className="w-5 h-5" />,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50 hover:bg-yellow-100',
    borderColor: 'border-yellow-300',
    label: 'Seguimiento',
  },
  [ShipmentRiskLevel.NORMAL]: {
    icon: <CheckCircle className="w-5 h-5" />,
    color: 'text-green-600',
    bgColor: 'bg-green-50 hover:bg-green-100',
    borderColor: 'border-green-300',
    label: 'Normal',
  },
};

// Configuration for carriers
const CARRIER_CONFIG: Record<CarrierName, { color: string; bgColor: string; borderColor: string }> =
  {
    [CarrierName.INTER_RAPIDISIMO]: {
      color: 'text-red-600',
      bgColor: 'bg-red-50 hover:bg-red-100',
      borderColor: 'border-red-200',
    },
    [CarrierName.ENVIA]: {
      color: 'text-green-600',
      bgColor: 'bg-green-50 hover:bg-green-100',
      borderColor: 'border-green-200',
    },
    [CarrierName.COORDINADORA]: {
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 hover:bg-blue-100',
      borderColor: 'border-blue-200',
    },
    [CarrierName.TCC]: {
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 hover:bg-orange-100',
      borderColor: 'border-orange-200',
    },
    [CarrierName.VELOCES]: {
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 hover:bg-purple-100',
      borderColor: 'border-purple-200',
    },
    [CarrierName.UNKNOWN]: {
      color: 'text-gray-600',
      bgColor: 'bg-gray-50 hover:bg-gray-100',
      borderColor: 'border-gray-200',
    },
  };

const DynamicClassificationButtons: React.FC<DynamicClassificationButtonsProps> = ({
  shipments,
  onGuideClick,
  title = 'Clasificación de Guías',
  showAllButton = true,
}) => {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'status' | 'risk' | 'carrier'>('status');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Build classification summary
  const classification = useMemo<ClassificationSummary>(() => {
    // By Status
    const byStatus: ClassificationCategory[] = Object.values(ShipmentStatus)
      .map((status) => {
        const guides = shipments.filter((s) => s.status === status);
        const config = STATUS_CONFIG[status];
        return {
          id: `status-${status}`,
          label: status,
          color: config.color,
          bgColor: config.bgColor,
          count: guides.length,
          guides,
        };
      })
      .filter((cat) => cat.count > 0);

    // By Risk
    const byRisk: ClassificationCategory[] = Object.values(ShipmentRiskLevel)
      .map((risk) => {
        const guides = shipments.filter((s) => s.riskAnalysis?.level === risk);
        const config = RISK_CONFIG[risk];
        return {
          id: `risk-${risk}`,
          label: config.label,
          color: config.color,
          bgColor: config.bgColor,
          count: guides.length,
          guides,
        };
      })
      .filter((cat) => cat.count > 0);

    // By Carrier
    const byCarrier: ClassificationCategory[] = Object.values(CarrierName)
      .map((carrier) => {
        const guides = shipments.filter((s) => s.carrier === carrier);
        const config = CARRIER_CONFIG[carrier];
        return {
          id: `carrier-${carrier}`,
          label: carrier,
          color: config.color,
          bgColor: config.bgColor,
          count: guides.length,
          guides,
        };
      })
      .filter((cat) => cat.count > 0);

    return {
      byStatus,
      byRisk,
      byCarrier,
      total: shipments.length,
      timestamp: new Date().toISOString(),
    };
  }, [shipments]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategory((prev) => (prev === categoryId ? null : categoryId));
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getWhatsAppLink = (phone?: string, guideNumber?: string) => {
    if (!phone) return null;
    const formattedPhone = phone.replace(/\D/g, '');
    const message = encodeURIComponent(
      `Hola, consulta sobre la guía ${guideNumber}. ¿Podrían ayudarme con el estado de mi envío?`
    );
    return `https://wa.me/${formattedPhone}?text=${message}`;
  };

  const getTrackingUrl = (guideNumber: string) => {
    return `https://t.17track.net/es#nums=${guideNumber}`;
  };

  const renderCategoryButton = (category: ClassificationCategory, config: any) => {
    const isExpanded = expandedCategory === category.id;

    return (
      <div key={category.id} className="w-full">
        <button
          onClick={() => toggleCategory(category.id)}
          className={`w-full flex items-center justify-between p-4 rounded-xl border-2 ${config.bgColor} ${config.borderColor} transition-all duration-200 ${
            isExpanded ? 'ring-2 ring-offset-2 ring-blue-500' : ''
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={config.color}>{config.icon}</div>
            <span className={`font-semibold ${config.color}`}>{category.label}</span>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 rounded-full text-sm font-bold ${config.color} bg-white/80`}
            >
              {category.count}
            </span>
            {isExpanded ? (
              <ChevronUp className={`w-5 h-5 ${config.color}`} />
            ) : (
              <ChevronDown className={`w-5 h-5 ${config.color}`} />
            )}
          </div>
        </button>

        {/* Expanded Guide List */}
        {isExpanded && (
          <div className="mt-2 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-900 dark:text-white">
                {category.count} Guías - {category.label}
              </h4>
              <button
                onClick={() => setExpandedCategory(null)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {category.guides.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No hay guías en esta categoría</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {category.guides.map((shipment) => {
                  const whatsappLink = getWhatsAppLink(shipment.phone, shipment.id);

                  return (
                    <div
                      key={shipment.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                      onClick={() => onGuideClick?.(shipment)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-gray-900 dark:text-white">
                            {shipment.id}
                          </span>
                          <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-600 rounded text-gray-600 dark:text-gray-300">
                            {shipment.carrier}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                          {shipment.detailedInfo?.destination && (
                            <span>{shipment.detailedInfo.destination}</span>
                          )}
                          {shipment.detailedInfo?.daysInTransit !== undefined && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {shipment.detailedInfo.daysInTransit} días
                            </span>
                          )}
                          {shipment.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {shipment.phone}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(shipment.id, shipment.id);
                          }}
                          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                          title="Copiar guía"
                        >
                          {copiedId === shipment.id ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4 text-gray-400" />
                          )}
                        </button>

                        <a
                          href={getTrackingUrl(shipment.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                          title="Ver en 17Track"
                        >
                          <ExternalLink className="w-4 h-4 text-blue-500" />
                        </a>

                        {whatsappLink && (
                          <a
                            href={whatsappLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-2 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                            title="Contactar por WhatsApp"
                          >
                            <Phone className="w-4 h-4 text-green-500" />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Summary Footer */}
            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600 flex items-center justify-between text-sm">
              <span className="text-gray-500">
                Total: <strong>{category.count}</strong> guías
              </span>
              {category.guides.some((g) => g.phone) && (
                <span className="text-gray-500">
                  Con teléfono: <strong>{category.guides.filter((g) => g.phone).length}</strong>
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const currentCategories =
    activeTab === 'status'
      ? classification.byStatus
      : activeTab === 'risk'
        ? classification.byRisk
        : classification.byCarrier;

  const getCurrentConfig = (category: ClassificationCategory) => {
    if (activeTab === 'status') {
      const status = category.label as ShipmentStatus;
      return STATUS_CONFIG[status];
    } else if (activeTab === 'risk') {
      const riskLevel = Object.values(ShipmentRiskLevel).find(
        (r) => RISK_CONFIG[r].label === category.label
      );
      return riskLevel ? RISK_CONFIG[riskLevel] : RISK_CONFIG[ShipmentRiskLevel.NORMAL];
    } else {
      const carrier = category.label as CarrierName;
      return { ...CARRIER_CONFIG[carrier], icon: <Package className="w-5 h-5" /> };
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Filter className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{title}</h3>
              <p className="text-indigo-100 text-sm">
                {classification.total} guías cargadas • Click para ver detalles
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => {
            setActiveTab('status');
            setExpandedCategory(null);
          }}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'status'
              ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          Por Estado
        </button>
        <button
          onClick={() => {
            setActiveTab('risk');
            setExpandedCategory(null);
          }}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'risk'
              ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          Por Riesgo
        </button>
        <button
          onClick={() => {
            setActiveTab('carrier');
            setExpandedCategory(null);
          }}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'carrier'
              ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          Por Transportadora
        </button>
      </div>

      {/* Category Buttons */}
      <div className="p-4 space-y-3">
        {showAllButton && (
          <button
            onClick={() => toggleCategory('all')}
            className={`w-full flex items-center justify-between p-4 rounded-xl border-2 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 border-gray-300 dark:border-gray-500 hover:from-gray-100 hover:to-gray-150 transition-all duration-200 ${
              expandedCategory === 'all' ? 'ring-2 ring-offset-2 ring-blue-500' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              <Package className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              <span className="font-semibold text-gray-700 dark:text-gray-200">
                TODAS LAS GUÍAS
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full text-sm font-bold bg-gray-200 dark:bg-gray-500 text-gray-700 dark:text-white">
                {classification.total}
              </span>
              {expandedCategory === 'all' ? (
                <ChevronUp className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              )}
            </div>
          </button>
        )}

        {/* Show all guides when "TODAS" is expanded */}
        {expandedCategory === 'all' && (
          <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-900 dark:text-white">
                {shipments.length} Guías - Todas
              </h4>
              <button
                onClick={() => setExpandedCategory(null)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {shipments.map((shipment) => {
                const whatsappLink = getWhatsAppLink(shipment.phone, shipment.id);
                const statusConfig = STATUS_CONFIG[shipment.status];

                return (
                  <div
                    key={shipment.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                    onClick={() => onGuideClick?.(shipment)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-gray-900 dark:text-white">
                          {shipment.id}
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-600 rounded text-gray-600 dark:text-gray-300">
                          {shipment.carrier}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${statusConfig.bgColor} ${statusConfig.color}`}
                        >
                          {shipment.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {shipment.detailedInfo?.destination && (
                          <span>{shipment.detailedInfo.destination}</span>
                        )}
                        {shipment.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {shipment.phone}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(shipment.id, shipment.id);
                        }}
                        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                        title="Copiar guía"
                      >
                        {copiedId === shipment.id ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-400" />
                        )}
                      </button>

                      <a
                        href={getTrackingUrl(shipment.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                        title="Ver en 17Track"
                      >
                        <ExternalLink className="w-4 h-4 text-blue-500" />
                      </a>

                      {whatsappLink && (
                        <a
                          href={whatsappLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                          title="Contactar por WhatsApp"
                        >
                          <Phone className="w-4 h-4 text-green-500" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Dynamic Category Buttons */}
        {currentCategories.map((category) =>
          renderCategoryButton(category, getCurrentConfig(category))
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-600">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>
            Última actualización:{' '}
            {new Date(classification.timestamp).toLocaleString('es-CO', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
          <span>{currentCategories.length} categorías con datos</span>
        </div>
      </div>
    </div>
  );
};

export default DynamicClassificationButtons;
