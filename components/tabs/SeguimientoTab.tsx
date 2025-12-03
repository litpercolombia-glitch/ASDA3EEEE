import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
  Package,
  Search,
  Filter,
  AlertTriangle,
  Clock,
  MapPin,
  Phone,
  RefreshCw,
  Camera,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Copy,
  Check,
  Truck,
  Calendar,
  AlertCircle,
  Bot,
  Download,
} from 'lucide-react';
import { Shipment, ShipmentStatus, CarrierName } from '../../types';
import { GuiaRetrasada, AlertLevel } from '../../types/logistics';
import {
  detectarGuiasRetrasadas,
  calcularDiasSinMovimiento,
  getUltimaFechaEvento,
} from '../../utils/patternDetection';
import { toPng } from 'html-to-image';

interface SeguimientoTabProps {
  shipments: Shipment[];
  onRefresh?: () => void;
}

const AlertBadge: React.FC<{ level: AlertLevel; count: number; onClick: () => void }> = ({
  level,
  count,
  onClick,
}) => {
  const config = {
    CRITICO: {
      bg: 'bg-red-100 dark:bg-red-900/30',
      border: 'border-red-200 dark:border-red-800',
      text: 'text-red-700 dark:text-red-400',
      icon: '🔴',
      label: 'CRÍTICAS',
      desc: '(5+ días sin movimiento)',
    },
    ALTO: {
      bg: 'bg-orange-100 dark:bg-orange-900/30',
      border: 'border-orange-200 dark:border-orange-800',
      text: 'text-orange-700 dark:text-orange-400',
      icon: '🟠',
      label: 'ALERTA',
      desc: '(3-4 días sin movimiento)',
    },
    MEDIO: {
      bg: 'bg-yellow-100 dark:bg-yellow-900/30',
      border: 'border-yellow-200 dark:border-yellow-800',
      text: 'text-yellow-700 dark:text-yellow-400',
      icon: '🟡',
      label: 'SEGUIMIENTO',
      desc: '(2 días sin movimiento)',
    },
    BAJO: {
      bg: 'bg-green-100 dark:bg-green-900/30',
      border: 'border-green-200 dark:border-green-800',
      text: 'text-green-700 dark:text-green-400',
      icon: '🟢',
      label: 'NORMAL',
      desc: '(menos de 2 días)',
    },
  };

  const c = config[level];

  return (
    <button
      onClick={onClick}
      className={`flex-1 ${c.bg} ${c.border} border rounded-xl p-4 text-left hover:shadow-md transition-all`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{c.icon}</span>
        <span className={`text-2xl font-bold ${c.text}`}>{count}</span>
      </div>
      <p className={`font-bold text-sm ${c.text}`}>
        {count} guías {c.label}
      </p>
      <p className="text-xs text-slate-500 dark:text-slate-400">{c.desc}</p>
    </button>
  );
};

const GuiaCard: React.FC<{
  guiaRetrasada: GuiaRetrasada;
  onCapture: (id: string) => void;
}> = ({ guiaRetrasada, onCapture }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const { guia, diasSinMovimiento, ultimoEstado, ultimaFecha, nivelAlerta, recomendacionIA } =
    guiaRetrasada;

  const alertColors = {
    CRITICO: 'border-l-red-500 bg-red-50/50 dark:bg-red-900/10',
    ALTO: 'border-l-orange-500 bg-orange-50/50 dark:bg-orange-900/10',
    MEDIO: 'border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-900/10',
    BAJO: 'border-l-green-500 bg-green-50/50 dark:bg-green-900/10',
  };

  const events = guia.detailedInfo?.events || [];
  const sortedEvents = [...events].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const handleCopyGuia = () => {
    navigator.clipboard.writeText(guia.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    if (guia.phone) {
      const message = encodeURIComponent(
        `Hola! Le escribo de Litper sobre su pedido con guía ${guia.id}. El estado actual es: ${ultimoEstado}. ¿Podemos coordinar la entrega?`
      );
      window.open(`https://wa.me/57${guia.phone}?text=${message}`, '_blank');
    }
  };

  const handleCapture = async () => {
    if (cardRef.current) {
      try {
        const dataUrl = await toPng(cardRef.current, {
          backgroundColor: '#ffffff',
          quality: 1,
          pixelRatio: 2,
        });

        // Try to copy to clipboard
        try {
          const blob = await (await fetch(dataUrl)).blob();
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
          alert('Imagen copiada al portapapeles');
        } catch {
          // Fallback: download
          const link = document.createElement('a');
          link.download = `historial-${guia.id}-${Date.now()}.png`;
          link.href = dataUrl;
          link.click();
        }
      } catch (err) {
        console.error('Error capturing:', err);
      }
    }
  };

  return (
    <div
      ref={cardRef}
      className={`bg-white dark:bg-navy-900 rounded-xl border-l-4 ${alertColors[nivelAlerta]} border border-slate-200 dark:border-navy-700 overflow-hidden transition-all`}
    >
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${
                nivelAlerta === 'CRITICO'
                  ? 'bg-red-100 text-red-600'
                  : nivelAlerta === 'ALTO'
                    ? 'bg-orange-100 text-orange-600'
                    : nivelAlerta === 'MEDIO'
                      ? 'bg-yellow-100 text-yellow-600'
                      : 'bg-green-100 text-green-600'
              }`}
            >
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800 dark:text-white">{guia.id}</span>
                <button
                  onClick={handleCopyGuia}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <Truck className="w-3 h-3" />
                {guia.carrier}
              </p>
            </div>
          </div>

          <div className="text-right">
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                nivelAlerta === 'CRITICO'
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400'
                  : nivelAlerta === 'ALTO'
                    ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400'
                    : nivelAlerta === 'MEDIO'
                      ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400'
                      : 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400'
              }`}
            >
              <Clock className="w-3 h-3" />
              {diasSinMovimiento} días sin movimiento
            </div>
          </div>
        </div>

        {/* Info row */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400 mb-3">
          {guia.phone && (
            <span className="flex items-center gap-1">
              <Phone className="w-4 h-4" />
              {guia.phone}
            </span>
          )}
          {guia.detailedInfo?.destination && (
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {guia.detailedInfo.destination}
            </span>
          )}
          {guia.detailedInfo?.declaredValue && (
            <span className="flex items-center gap-1 font-medium text-emerald-600">
              ${guia.detailedInfo.declaredValue.toLocaleString()}
            </span>
          )}
        </div>

        {/* Current status */}
        <div className="bg-slate-50 dark:bg-navy-950 rounded-lg p-3 mb-3">
          <p className="text-xs text-slate-500 mb-1">ESTADO ACTUAL</p>
          <p className="font-medium text-slate-800 dark:text-white flex items-center gap-2">
            <MapPin className="w-4 h-4 text-amber-500" />
            {ultimoEstado}
          </p>
        </div>

        {/* AI Recommendation */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-100 dark:border-blue-800">
          <div className="flex items-start gap-2">
            <Bot className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-blue-700 dark:text-blue-400 mb-1">
                RECOMENDACIÓN IA
              </p>
              <p className="text-sm text-blue-800 dark:text-blue-300">{recomendacionIA}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 mt-4">
          {guia.phone && (
            <button
              onClick={handleWhatsApp}
              className="flex items-center gap-2 px-3 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </button>
          )}
          <button
            onClick={handleCapture}
            className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-navy-700 transition-colors"
          >
            <Camera className="w-4 h-4" />
            Capturar
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-navy-700 transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            Historial
          </button>
        </div>
      </div>

      {/* Expanded History */}
      {isExpanded && (
        <div className="border-t border-slate-200 dark:border-navy-700 p-4 bg-slate-50 dark:bg-navy-950">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-slate-700 dark:text-white text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Historial de Eventos
            </h4>
            <button
              onClick={handleCapture}
              className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
            >
              <Camera className="w-3 h-3" />
              Capturar imagen
            </button>
          </div>

          {sortedEvents.length > 0 ? (
            <div className="space-y-3">
              {sortedEvents.map((event, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        idx === 0
                          ? 'bg-amber-500'
                          : 'bg-slate-300 dark:bg-slate-600'
                      }`}
                    />
                    {idx < sortedEvents.length - 1 && (
                      <div className="w-0.5 h-full min-h-[20px] bg-slate-200 dark:bg-slate-700" />
                    )}
                  </div>
                  <div className="flex-1 pb-3">
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                      <span>{new Date(event.date).toLocaleDateString('es-CO')}</span>
                      <span>
                        {new Date(event.date).toLocaleTimeString('es-CO', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300">{event.description}</p>
                    {event.location && (
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />
                        {event.location}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 text-center py-4">No hay eventos registrados</p>
          )}
        </div>
      )}
    </div>
  );
};

export const SeguimientoTab: React.FC<SeguimientoTabProps> = ({ shipments, onRefresh }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAlertLevel, setFilterAlertLevel] = useState<AlertLevel | 'ALL'>('ALL');
  const [filterTransportadora, setFilterTransportadora] = useState<CarrierName | 'ALL'>('ALL');

  // Calculate delayed shipments
  const guiasRetrasadas = useMemo(() => {
    return detectarGuiasRetrasadas(shipments);
  }, [shipments]);

  // Count by alert level
  const alertCounts = useMemo(() => {
    const counts = { CRITICO: 0, ALTO: 0, MEDIO: 0, BAJO: 0 };
    guiasRetrasadas.forEach((g) => {
      counts[g.nivelAlerta]++;
    });
    return counts;
  }, [guiasRetrasadas]);

  // Filter shipments
  const filteredGuias = useMemo(() => {
    return guiasRetrasadas.filter((gr) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesId = gr.guia.id.toLowerCase().includes(query);
        const matchesPhone = gr.guia.phone?.includes(query);
        const matchesCity = gr.guia.detailedInfo?.destination?.toLowerCase().includes(query);
        if (!matchesId && !matchesPhone && !matchesCity) return false;
      }

      // Alert level filter
      if (filterAlertLevel !== 'ALL' && gr.nivelAlerta !== filterAlertLevel) {
        return false;
      }

      // Carrier filter
      if (filterTransportadora !== 'ALL' && gr.guia.carrier !== filterTransportadora) {
        return false;
      }

      return true;
    });
  }, [guiasRetrasadas, searchQuery, filterAlertLevel, filterTransportadora]);

  // Get unique carriers
  const carriers = useMemo(() => {
    const unique = new Set(shipments.map((s) => s.carrier));
    return Array.from(unique).filter((c) => c !== CarrierName.UNKNOWN);
  }, [shipments]);

  const handleCapture = (id: string) => {
    // This will be handled by each card
    console.log('Capture requested for:', id);
  };

  if (shipments.length === 0) {
    return (
      <div className="bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-700 p-12 text-center">
        <div className="w-20 h-20 bg-slate-100 dark:bg-navy-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <Package className="w-10 h-10 text-slate-400" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
          No hay guías cargadas
        </h3>
        <p className="text-slate-500 dark:text-slate-400 mb-4">
          Carga un reporte para comenzar el seguimiento de guías
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <Package className="w-8 h-8 text-emerald-500" />
            Seguimiento de Guías
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {shipments.length} guías totales • {guiasRetrasadas.length} requieren atención
          </p>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-navy-800 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-navy-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </button>
        )}
      </div>

      {/* Alert Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <AlertBadge
          level="CRITICO"
          count={alertCounts.CRITICO}
          onClick={() => setFilterAlertLevel(filterAlertLevel === 'CRITICO' ? 'ALL' : 'CRITICO')}
        />
        <AlertBadge
          level="ALTO"
          count={alertCounts.ALTO}
          onClick={() => setFilterAlertLevel(filterAlertLevel === 'ALTO' ? 'ALL' : 'ALTO')}
        />
        <AlertBadge
          level="MEDIO"
          count={alertCounts.MEDIO}
          onClick={() => setFilterAlertLevel(filterAlertLevel === 'MEDIO' ? 'ALL' : 'MEDIO')}
        />
        <AlertBadge
          level="BAJO"
          count={alertCounts.BAJO}
          onClick={() => setFilterAlertLevel(filterAlertLevel === 'BAJO' ? 'ALL' : 'BAJO')}
        />
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-700 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por guía, teléfono o ciudad..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Carrier filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={filterTransportadora}
              onChange={(e) => setFilterTransportadora(e.target.value as CarrierName | 'ALL')}
              className="px-4 py-2.5 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">Todas las transportadoras</option>
              {carriers.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active filters */}
        {(filterAlertLevel !== 'ALL' || filterTransportadora !== 'ALL' || searchQuery) && (
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-200 dark:border-navy-700">
            <span className="text-xs text-slate-500">Filtros activos:</span>
            {filterAlertLevel !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-xs">
                {filterAlertLevel}
                <button onClick={() => setFilterAlertLevel('ALL')}>×</button>
              </span>
            )}
            {filterTransportadora !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs">
                {filterTransportadora}
                <button onClick={() => setFilterTransportadora('ALL')}>×</button>
              </span>
            )}
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full text-xs">
                "{searchQuery}"
                <button onClick={() => setSearchQuery('')}>×</button>
              </span>
            )}
            <button
              onClick={() => {
                setFilterAlertLevel('ALL');
                setFilterTransportadora('ALL');
                setSearchQuery('');
              }}
              className="text-xs text-slate-500 hover:text-slate-700 underline"
            >
              Limpiar todos
            </button>
          </div>
        )}
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>
          Mostrando {filteredGuias.length} de {guiasRetrasadas.length} guías con retraso
        </span>
      </div>

      {/* Shipment cards */}
      <div className="space-y-4">
        {filteredGuias.map((gr) => (
          <GuiaCard key={gr.guia.id} guiaRetrasada={gr} onCapture={handleCapture} />
        ))}

        {filteredGuias.length === 0 && (
          <div className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-700 p-12 text-center">
            {guiasRetrasadas.length === 0 ? (
              <>
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
                  ¡Todo en orden!
                </h3>
                <p className="text-slate-500">No hay guías retrasadas en este momento</p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-slate-100 dark:bg-navy-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
                  Sin resultados
                </h3>
                <p className="text-slate-500 mb-4">
                  No se encontraron guías con los filtros seleccionados
                </p>
                <button
                  onClick={() => {
                    setFilterAlertLevel('ALL');
                    setFilterTransportadora('ALL');
                    setSearchQuery('');
                  }}
                  className="text-emerald-500 hover:text-emerald-600 font-medium"
                >
                  Limpiar filtros
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SeguimientoTab;
