import React, { useState } from 'react';
import { Shipment, ShipmentRiskLevel, CarrierName } from '../types';
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
} from 'lucide-react';
import { getWhatsAppTemplate } from '../services/logisticsService';

interface AlertDashboardProps {
  shipments: Shipment[];
  onSelectShipment?: (shipment: Shipment) => void;
}

export const AlertDashboard: React.FC<AlertDashboardProps> = ({ shipments, onSelectShipment }) => {
  const [filterCity, setFilterCity] = useState<'ALL' | 'BOGOTA' | 'MEDELLIN' | 'CALI' | 'OTROS'>(
    'ALL'
  );
  const [filterCarrier, setFilterCarrier] = useState<string>('ALL');
  const [filterRisk, setFilterRisk] = useState<ShipmentRiskLevel | 'ALL'>('ALL');

  // Categorize Shipments by Risk
  const urgent = shipments.filter((s) => s.riskAnalysis?.level === ShipmentRiskLevel.URGENT);
  const attention = shipments.filter((s) => s.riskAnalysis?.level === ShipmentRiskLevel.ATTENTION);
  const watch = shipments.filter((s) => s.riskAnalysis?.level === ShipmentRiskLevel.WATCH);
  const normal = shipments.filter((s) => s.riskAnalysis?.level === ShipmentRiskLevel.NORMAL);

  const filteredList = shipments.filter((s) => {
    // Risk Filter
    if (filterRisk !== 'ALL' && s.riskAnalysis?.level !== filterRisk) return false;

    // City Filter
    const dest = (s.detailedInfo?.destination || '').toUpperCase();
    if (filterCity === 'BOGOTA' && !dest.includes('BOGOTA')) return false;
    if (filterCity === 'MEDELLIN' && !dest.includes('MEDELLIN') && !dest.includes('ENVIGADO'))
      return false;
    if (filterCity === 'CALI' && !dest.includes('CALI')) return false;
    if (
      filterCity === 'OTROS' &&
      (dest.includes('BOGOTA') || dest.includes('MEDELLIN') || dest.includes('CALI'))
    )
      return false;

    // Carrier Filter
    if (filterCarrier !== 'ALL' && s.carrier !== filterCarrier) return false;

    // Default: Only show Alertable items if no specific risk filter is selected
    if (filterRisk === 'ALL') {
      return s.riskAnalysis?.level !== ShipmentRiskLevel.NORMAL;
    }

    return true;
  });

  const handleWhatsApp = (e: React.MouseEvent, shipment: Shipment) => {
    e.stopPropagation();
    const template = getWhatsAppTemplate(shipment);
    const url = `https://wa.me/57${shipment.phone || ''}?text=${encodeURIComponent(template)}`;
    window.open(url, '_blank');
  };

  const AlertCard: React.FC<{ shipment: Shipment }> = ({ shipment }) => {
    const risk = shipment.riskAnalysis;
    const colorClass =
      risk?.level === ShipmentRiskLevel.URGENT
        ? 'border-red-500 bg-red-50 dark:bg-red-900/10'
        : risk?.level === ShipmentRiskLevel.ATTENTION
          ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/10'
          : 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/10';

    const badgeColor =
      risk?.level === ShipmentRiskLevel.URGENT
        ? 'bg-red-500 text-white'
        : risk?.level === ShipmentRiskLevel.ATTENTION
          ? 'bg-amber-500 text-white'
          : 'bg-yellow-400 text-navy-900';

    return (
      <div
        onClick={() => onSelectShipment && onSelectShipment(shipment)}
        className={`rounded-xl border-l-4 p-5 shadow-sm relative hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer ${colorClass}`}
      >
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${badgeColor}`}
              >
                {risk?.level}
              </span>
              <span className="text-xs font-mono text-slate-500">#{shipment.id}</span>
            </div>
            <h4 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-400" />
              {shipment.detailedInfo?.destination}
            </h4>
          </div>
          {risk?.timeLabel && (
            <div className="text-right">
              <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-bold text-sm">
                <Clock className="w-4 h-4" /> {risk.timeLabel}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-4 mb-4 text-sm">
          <div className="flex-1">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Motivo</p>
            <p className="font-medium text-slate-800 dark:text-slate-200 leading-tight">
              {risk?.reason}
            </p>
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Acción Sugerida</p>
            <p className="font-bold text-slate-900 dark:text-white leading-tight">{risk?.action}</p>
          </div>
        </div>

        {shipment.detailedInfo?.rawStatus && (
          <p className="text-xs text-slate-500 italic mb-4 border-t border-slate-200 dark:border-slate-700 pt-2 line-clamp-2">
            "{shipment.detailedInfo.rawStatus}"
          </p>
        )}

        <div className="flex gap-2 mt-2">
          <button
            onClick={(e) => handleWhatsApp(e, shipment)}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-colors"
          >
            <MessageCircle className="w-4 h-4" /> WhatsApp Cliente
          </button>
          <div className="p-2 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-lg text-slate-400 flex items-center justify-center">
            <Eye className="w-4 h-4" />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      {/* HEADER */}
      <div className="bg-navy-900 text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row justify-between items-center gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
          <Siren className="w-32 h-32" />
        </div>
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <Siren className="w-8 h-8 text-red-500 animate-pulse" />
            CENTRO DE ALERTAS LITPER
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Inteligencia Operativa Proactiva - {new Date().toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-4">
          <div
            className="text-center cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => setFilterRisk('URGENTE')}
          >
            <div className="text-3xl font-black text-red-500">{urgent.length}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-red-300">
              Urgentes
            </div>
          </div>
          <div className="w-px bg-navy-700 h-10"></div>
          <div
            className="text-center cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => setFilterRisk('ATTENTION')}
          >
            <div className="text-3xl font-black text-amber-500">{attention.length}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
              Atención
            </div>
          </div>
          <div className="w-px bg-navy-700 h-10"></div>
          <div
            className="text-center cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => setFilterRisk('NORMAL')}
          >
            <div className="text-3xl font-black text-emerald-500">{normal.length}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
              Normal
            </div>
          </div>
        </div>
      </div>

      {/* FILTERS */}
      <div className="flex flex-wrap gap-4 items-center bg-white dark:bg-navy-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-navy-800">
        <span className="text-xs font-bold uppercase text-slate-500 mr-2 flex items-center gap-1">
          <Filter className="w-3 h-3" /> Filtros de Riesgo:
        </span>

        {filterRisk !== 'ALL' && (
          <button
            onClick={() => setFilterRisk('ALL')}
            className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-xs font-bold flex items-center gap-2 hover:bg-slate-200"
          >
            {filterRisk} <span className="text-red-500">×</span>
          </button>
        )}

        <div className="h-6 w-px bg-slate-200 dark:bg-navy-700 mx-2 hidden md:block"></div>

        <div className="flex gap-2">
          {['ALL', 'BOGOTA', 'MEDELLIN', 'CALI', 'OTROS'].map((city) => (
            <button
              key={city}
              onClick={() => setFilterCity(city as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                filterCity === city
                  ? 'bg-navy-800 text-white border-navy-800'
                  : 'bg-slate-50 dark:bg-navy-950 text-slate-500 border-slate-200 dark:border-navy-700'
              }`}
            >
              {city === 'ALL' ? 'Todas las Ciudades' : city}
            </button>
          ))}
        </div>
      </div>

      {/* ALERTS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredList.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 bg-white dark:bg-navy-900 rounded-2xl border-2 border-dashed border-slate-200 dark:border-navy-800">
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-emerald-100" />
            <p className="text-lg font-medium">¡Todo bajo control!</p>
            <p className="text-sm">No hay alertas activas para los filtros seleccionados.</p>
          </div>
        ) : (
          filteredList.map((s) => <AlertCard key={s.id} shipment={s} />)
        )}
      </div>
    </div>
  );
};
