import React, { useState, useMemo } from 'react';
import {
  Activity,
  RefreshCw,
  CheckCircle,
  Truck,
  MapPin,
  AlertTriangle,
  Phone,
  Clock,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  ExternalLink,
  Package,
  Lightbulb,
} from 'lucide-react';
import { Shipment, ShipmentStatus } from '../types';
import {
  getActualStatus,
  STATUS_CONFIG,
  NormalizedStatus,
  groupBySemaforo,
  SemaforoColor,
  getHoursSinceUpdate,
} from '../utils/statusHelpers';
import { getTrackingUrl, getWhatsAppTemplate } from '../services/logisticsService';
import { GuiasDetailModal } from './GuiasDetailModal';

interface SemaforoTabProps {
  shipments: Shipment[];
}

interface FilterButtonProps {
  label: string;
  count: number;
  color: 'all' | SemaforoColor;
  active: boolean;
  onClick: () => void;
}

const FilterButton: React.FC<FilterButtonProps> = ({ label, count, color, active, onClick }) => {
  const colorStyles = {
    all: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600',
    green:
      'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700',
    yellow:
      'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700',
    orange:
      'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border-orange-300 dark:border-orange-700',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-300 dark:border-red-700',
  };

  const emoji = {
    all: '📋',
    green: '🟢',
    yellow: '🟡',
    orange: '🟠',
    red: '🔴',
  };

  return (
    <button
      onClick={onClick}
      className={`
        flex-1 min-w-[100px] flex flex-col items-center justify-center gap-1
        p-4 rounded-xl border-2 transition-all duration-200
        ${colorStyles[color]}
        ${active ? 'ring-2 ring-offset-2 ring-blue-500 scale-105 shadow-lg' : 'hover:scale-102'}
      `}
    >
      <span className="text-2xl">{emoji[color]}</span>
      <span className="text-2xl font-bold">{count}</span>
      <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
    </button>
  );
};

const GuiaCard: React.FC<{ guia: Shipment; expanded: boolean; onToggle: () => void }> = ({
  guia,
  expanded,
  onToggle,
}) => {
  const normalizedStatus = getActualStatus(guia);
  const config = STATUS_CONFIG[normalizedStatus];
  const daysInTransit = guia.detailedInfo?.daysInTransit || 0;
  const lastEvent = guia.detailedInfo?.events?.[0];
  const hoursSinceUpdate = Math.floor(getHoursSinceUpdate(guia));

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!guia.phone) {
      alert('Esta guía no tiene número de teléfono asociado');
      return;
    }
    const template = getWhatsAppTemplate(guia);
    const encoded = encodeURIComponent(template);
    window.open(`https://wa.me/57${guia.phone}?text=${encoded}`, '_blank');
  };

  const handleTrack = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = getTrackingUrl(guia.carrier, guia.id);
    window.open(url, '_blank');
  };

  return (
    <div
      className={`bg-white dark:bg-slate-800 rounded-xl border-l-4 ${config.borderColor} shadow-sm hover:shadow-md transition-all cursor-pointer`}
      onClick={onToggle}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          {/* Left side */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{config.icon}</span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${config.bgColor}`}
              >
                {config.label}
              </span>
              {hoursSinceUpdate > 48 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold">
                  <Clock className="w-3 h-3" />
                  +48h
                </span>
              )}
            </div>

            <h4 className="font-bold text-slate-800 dark:text-white truncate">#{guia.id}</h4>

            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-slate-500 dark:text-slate-400">
              <span>{guia.carrier}</span>
              {guia.detailedInfo?.destination && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {guia.detailedInfo.destination}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {daysInTransit} días
              </span>
            </div>

            {guia.detailedInfo?.rawStatus && (
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                {guia.detailedInfo.rawStatus}
              </p>
            )}
          </div>

          {/* Right side - actions */}
          <div className="flex items-center gap-2">
            {guia.phone && (
              <button
                onClick={handleWhatsApp}
                className="p-2 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
                title="WhatsApp"
              >
                <MessageCircle className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={handleTrack}
              className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
              title="Rastrear"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
            {expanded ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </div>
        </div>

        {/* Expanded content */}
        {expanded && lastEvent && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
            <h5 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-3">
              Historial de Eventos
            </h5>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {guia.detailedInfo?.events?.slice(0, 5).map((event, idx) => (
                <div key={idx} className="flex gap-3 text-sm">
                  <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-2" />
                  <div>
                    <p className="text-slate-700 dark:text-slate-300">{event.description}</p>
                    <p className="text-xs text-slate-400">
                      {event.date.replace('T', ' ')} - {event.location}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {guia.phone && (
              <div className="mt-4 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <Phone className="w-4 h-4" />
                <span>{guia.phone}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

interface SectionProps {
  title: string;
  color: SemaforoColor;
  guias: Shipment[];
  defaultOpen?: boolean;
}

const Section: React.FC<SectionProps> = ({ title, color, guias, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [expandedGuia, setExpandedGuia] = useState<string | null>(null);

  const colorStyles = {
    green: {
      bg: 'bg-green-50 dark:bg-green-900/10',
      border: 'border-green-200 dark:border-green-800',
      text: 'text-green-700 dark:text-green-400',
    },
    yellow: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/10',
      border: 'border-yellow-200 dark:border-yellow-800',
      text: 'text-yellow-700 dark:text-yellow-400',
    },
    orange: {
      bg: 'bg-orange-50 dark:bg-orange-900/10',
      border: 'border-orange-200 dark:border-orange-800',
      text: 'text-orange-700 dark:text-orange-400',
    },
    red: {
      bg: 'bg-red-50 dark:bg-red-900/10',
      border: 'border-red-200 dark:border-red-800',
      text: 'text-red-700 dark:text-red-400',
    },
  };

  const emoji = { green: '🟢', yellow: '🟡', orange: '🟠', red: '🔴' };

  if (guias.length === 0) return null;

  return (
    <div
      className={`rounded-2xl ${colorStyles[color].bg} border ${colorStyles[color].border} overflow-hidden`}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{emoji[color]}</span>
          <h3 className={`font-bold text-lg ${colorStyles[color].text}`}>
            {title} ({guias.length})
          </h3>
        </div>
        {isOpen ? (
          <ChevronUp className={`w-5 h-5 ${colorStyles[color].text}`} />
        ) : (
          <ChevronDown className={`w-5 h-5 ${colorStyles[color].text}`} />
        )}
      </button>

      {isOpen && (
        <div className="px-4 pb-4 space-y-2">
          {guias.map((guia) => (
            <GuiaCard
              key={guia.id}
              guia={guia}
              expanded={expandedGuia === guia.id}
              onToggle={() => setExpandedGuia(expandedGuia === guia.id ? null : guia.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Onboarding component
const SemaforoOnboarding: React.FC = () => (
  <div className="max-w-2xl mx-auto text-center py-12">
    <div className="bg-gradient-to-br from-orange-500 to-red-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
      <Activity className="w-10 h-10 text-white" />
    </div>

    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">Semáforo de Guías</h2>

    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 mb-8 text-left">
      <p className="text-slate-600 dark:text-slate-300 mb-4">
        Vista rápida del estado de todos tus envíos:
      </p>

      <ul className="space-y-3">
        <li className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
          <span className="text-xl">🟢</span>
          <span>
            <strong>VERDE</strong> → Entregado / Sin problemas
          </span>
        </li>
        <li className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
          <span className="text-xl">🟡</span>
          <span>
            <strong>AMARILLO</strong> → En tránsito / Requiere seguimiento
          </span>
        </li>
        <li className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
          <span className="text-xl">🟠</span>
          <span>
            <strong>NARANJA</strong> → En oficina / Atención requerida
          </span>
        </li>
        <li className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
          <span className="text-xl">🔴</span>
          <span>
            <strong>ROJO</strong> → Novedad / Acción urgente
          </span>
        </li>
      </ul>

      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-2">
          <Lightbulb className="w-4 h-4 text-blue-500 mt-0.5" />
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Haz click en cualquier color para filtrar las guías
          </p>
        </div>
      </div>
    </div>

    <div className="text-slate-500 dark:text-slate-400">
      <Package className="w-16 h-16 mx-auto mb-4 opacity-20" />
      <p>Carga guías para ver el semáforo</p>
    </div>
  </div>
);

export const SemaforoTab: React.FC<SemaforoTabProps> = ({ shipments }) => {
  const [activeFilter, setActiveFilter] = useState<'all' | SemaforoColor>('all');

  const semaforoGroups = useMemo(() => groupBySemaforo(shipments), [shipments]);

  const filteredGuias = useMemo(() => {
    if (activeFilter === 'all') return shipments;
    return semaforoGroups[activeFilter] || [];
  }, [activeFilter, shipments, semaforoGroups]);

  if (shipments.length === 0) {
    return <SemaforoOnboarding />;
  }

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Activity className="w-7 h-7 text-orange-600" />
            Semáforo de Guías
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {shipments.length} guías activas
          </p>
        </div>
        <button
          onClick={() => setActiveFilter('all')}
          className="flex items-center gap-2 px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-bold text-sm transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Mostrar Todos
        </button>
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-3">
        <FilterButton
          label="Todos"
          count={shipments.length}
          color="all"
          active={activeFilter === 'all'}
          onClick={() => setActiveFilter('all')}
        />
        <FilterButton
          label="Entregado"
          count={semaforoGroups.green.length}
          color="green"
          active={activeFilter === 'green'}
          onClick={() => setActiveFilter('green')}
        />
        <FilterButton
          label="En Tránsito"
          count={semaforoGroups.yellow.length}
          color="yellow"
          active={activeFilter === 'yellow'}
          onClick={() => setActiveFilter('yellow')}
        />
        <FilterButton
          label="En Oficina"
          count={semaforoGroups.orange.length}
          color="orange"
          active={activeFilter === 'orange'}
          onClick={() => setActiveFilter('orange')}
        />
        <FilterButton
          label="Novedad"
          count={semaforoGroups.red.length}
          color="red"
          active={activeFilter === 'red'}
          onClick={() => setActiveFilter('red')}
        />
      </div>

      {/* Sections */}
      {activeFilter === 'all' ? (
        <div className="space-y-6">
          <Section title="🔴 URGENTE" color="red" guias={semaforoGroups.red} defaultOpen={true} />
          <Section
            title="🟠 ATENCIÓN"
            color="orange"
            guias={semaforoGroups.orange}
            defaultOpen={true}
          />
          <Section title="🟡 EN SEGUIMIENTO" color="yellow" guias={semaforoGroups.yellow} />
          <Section title="🟢 COMPLETADOS" color="green" guias={semaforoGroups.green} />
        </div>
      ) : (
        <div className="space-y-2">
          {filteredGuias.map((guia) => (
            <GuiaCard key={guia.id} guia={guia} expanded={false} onToggle={() => {}} />
          ))}
          {filteredGuias.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <Package className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p>No hay guías en esta categoría</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SemaforoTab;
