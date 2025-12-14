import React, { useState } from 'react';
import {
  X,
  Download,
  MessageCircle,
  RefreshCw,
  Phone,
  MapPin,
  Clock,
  Package,
  ChevronRight,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  Truck,
} from 'lucide-react';
import { Shipment, ShipmentStatus } from '../types';
import { getTrackingUrl, getWhatsAppTemplate } from '../services/logisticsService';
import { getActualStatus, STATUS_CONFIG, NormalizedStatus } from '../utils/statusHelpers';

interface GuiasDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  guias: Shipment[];
  title: string;
  filterStatus?: string;
}

const GuiaRow: React.FC<{ guia: Shipment }> = ({ guia }) => {
  const normalizedStatus = getActualStatus(guia);
  const config = STATUS_CONFIG[normalizedStatus];
  const daysInTransit = guia.detailedInfo?.daysInTransit || 0;
  const lastEvent = guia.detailedInfo?.events?.[0];

  const handleWhatsApp = () => {
    if (!guia.phone) {
      alert('Esta guía no tiene número de teléfono asociado');
      return;
    }
    const template = getWhatsAppTemplate(guia);
    const encoded = encodeURIComponent(template);
    window.open(`https://wa.me/57${guia.phone}?text=${encoded}`, '_blank');
  };

  const handleTrack = () => {
    const url = getTrackingUrl(guia.carrier, guia.id);
    window.open(url, '_blank');
  };

  return (
    <div
      className={`bg-white dark:bg-slate-800 rounded-xl p-4 border-l-4 ${config.borderColor} shadow-sm hover:shadow-md transition-all`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Guide Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${config.bgColor}`}
            >
              {config.icon} {config.label}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{guia.carrier}</span>
          </div>

          <h4 className="font-bold text-slate-800 dark:text-white text-lg mb-1">#{guia.id}</h4>

          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
            {guia.phone && (
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" />
                {guia.phone}
              </span>
            )}
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

          {lastEvent && (
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
              {lastEvent.date.replace('T', ' ')} - {lastEvent.description}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {guia.phone && (
            <button
              onClick={handleWhatsApp}
              className="flex items-center gap-1.5 px-3 py-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg text-xs font-bold hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </button>
          )}
          <button
            onClick={handleTrack}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-bold hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Rastrear
          </button>
        </div>
      </div>
    </div>
  );
};

export const GuiasDetailModal: React.FC<GuiasDetailModalProps> = ({
  isOpen,
  onClose,
  guias,
  title,
  filterStatus,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredGuias = guias.filter((g) => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        g.id.toLowerCase().includes(term) ||
        g.phone?.includes(term) ||
        g.detailedInfo?.destination?.toLowerCase().includes(term)
      );
    }
    return true;
  });

  const handleExportList = () => {
    const csvContent = [
      ['Guía', 'Teléfono', 'Estado', 'Destino', 'Días', 'Último Evento'].join(','),
      ...filteredGuias.map((g) =>
        [
          g.id,
          g.phone || '',
          g.status,
          g.detailedInfo?.destination || '',
          g.detailedInfo?.daysInTransit || 0,
          g.detailedInfo?.events?.[0]?.description || '',
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `guias_${filterStatus || 'todas'}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleWhatsAppMasivo = () => {
    const guiasWithPhone = filteredGuias.filter((g) => g.phone);
    if (guiasWithPhone.length === 0) {
      alert('No hay guías con número de teléfono para enviar mensajes.');
      return;
    }
    // Just open the first one as a starting point
    const firstGuia = guiasWithPhone[0];
    const template = getWhatsAppTemplate(firstGuia);
    const encoded = encodeURIComponent(template);
    window.open(`https://wa.me/57${firstGuia.phone}?text=${encoded}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-slate-900 p-6 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Package className="w-6 h-6" />
                {title}
              </h2>
              <p className="text-blue-200 text-sm mt-1">{filteredGuias.length} guías encontradas</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Search */}
          <div className="mt-4">
            <input
              type="text"
              placeholder="Buscar por guía, teléfono o destino..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/30"
            />
          </div>
        </div>

        {/* List of Guides */}
        <div className="p-4 overflow-y-auto max-h-[calc(85vh-220px)] space-y-3">
          {filteredGuias.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Package className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p>No se encontraron guías</p>
            </div>
          ) : (
            filteredGuias.map((guia) => <GuiaRow key={guia.id} guia={guia} />)
          )}
        </div>

        {/* Footer with actions */}
        <div className="border-t border-slate-200 dark:border-slate-700 p-4 flex flex-wrap gap-3 justify-end bg-slate-50 dark:bg-slate-800/50">
          <button
            onClick={handleExportList}
            className="flex items-center gap-2 px-4 py-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl font-bold text-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            Exportar Lista
          </button>
          <button
            onClick={handleWhatsAppMasivo}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp Masivo
          </button>
        </div>
      </div>
    </div>
  );
};

export default GuiasDetailModal;
