import React, { useState } from 'react';
import { Shipment, ShipmentStatus, CarrierName, AITrackingResult } from '../types';
import { getTrackingUrl } from '../services/logisticsService';
import { trackShipmentWithAI } from '../services/geminiService';
import {
  Camera,
  ExternalLink,
  MessageCircle,
  CheckCircle,
  AlertTriangle,
  Truck,
  Home,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Loader2,
  Clock,
  Info,
  ShieldCheck,
  Lock,
} from 'lucide-react';

interface ShipmentRowProps {
  shipment: Shipment;
  onUpdateStatus: (id: string, status: ShipmentStatus) => void;
  onOpenEvidence: (shipment: Shipment) => void;
  onToggleCheck: (id: string) => void;
  onUpdateSmartTracking: (id: string, result: AITrackingResult) => void;
}

const statusColors: Record<ShipmentStatus, string> = {
  [ShipmentStatus.DELIVERED]:
    'bg-emerald-100 text-emerald-800 border-emerald-200 ring-emerald-500 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-800',
  [ShipmentStatus.IN_TRANSIT]:
    'bg-blue-100 text-blue-800 border-blue-200 ring-blue-500 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-800',
  [ShipmentStatus.IN_OFFICE]:
    'bg-amber-100 text-amber-800 border-amber-200 ring-amber-500 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-800',
  [ShipmentStatus.ISSUE]:
    'bg-rose-100 text-rose-800 border-rose-200 ring-rose-500 dark:bg-rose-900/50 dark:text-rose-300 dark:border-rose-800',
  [ShipmentStatus.PENDING]:
    'bg-slate-100 text-slate-800 border-slate-200 ring-slate-400 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
};

const statusIcons: Record<ShipmentStatus, React.ReactNode> = {
  [ShipmentStatus.DELIVERED]: <CheckCircle className="w-4 h-4" />,
  [ShipmentStatus.IN_TRANSIT]: <Truck className="w-4 h-4" />,
  [ShipmentStatus.IN_OFFICE]: <Home className="w-4 h-4" />,
  [ShipmentStatus.ISSUE]: <AlertTriangle className="w-4 h-4" />,
  [ShipmentStatus.PENDING]: <div className="w-3 h-3 rounded-full border-2 border-current" />,
};

export const ShipmentRow: React.FC<ShipmentRowProps> = ({
  shipment,
  onUpdateStatus,
  onOpenEvidence,
  onToggleCheck,
  onUpdateSmartTracking,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTracking, setIsTracking] = useState(false);

  const handleTrackingClick = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    onToggleCheck(shipment.id);
    navigator.clipboard.writeText(shipment.id);
    window.open(getTrackingUrl(shipment.carrier, shipment.id), '_blank');
  };

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `Hola! Tu pedido con guía *${shipment.id}* de *${shipment.carrier}* está actualmente: *${shipment.status}*.`;
    const url = shipment.phone
      ? `https://wa.me/57${shipment.phone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleSmartTrack = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsTracking(true);
    setIsExpanded(true);

    // Simulate "checking" the row visually
    if (!shipment.checkStatus) onToggleCheck(shipment.id);

    const result = await trackShipmentWithAI(shipment.carrier, shipment.id);
    onUpdateSmartTracking(shipment.id, result);
    setIsTracking(false);
  };

  const isRestricted =
    shipment.smartTracking?.statusSummary.toLowerCase().includes('validación') ||
    shipment.smartTracking?.statusSummary.toLowerCase().includes('manual') ||
    shipment.smartTracking?.statusSummary.toLowerCase().includes('protegido');

  return (
    <>
      <tr
        className={`group border-b border-gray-100 dark:border-slate-800 transition-all duration-300 cursor-pointer
            ${
              shipment.checkStatus
                ? 'bg-slate-50/80 dark:bg-slate-900/50 opacity-75 grayscale-[0.3]'
                : 'bg-white dark:bg-slate-900 hover:bg-indigo-50/30 dark:hover:bg-slate-800/80'
            }`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <td className="p-4">
          <div className="flex flex-col">
            <span
              className={`font-mono font-bold text-base tracking-wide flex items-center gap-2 ${shipment.checkStatus ? 'text-slate-500 dark:text-slate-500' : 'text-slate-800 dark:text-slate-200'}`}
            >
              {shipment.id}
              {shipment.smartTracking && <ShieldCheck className="w-3 h-3 text-purple-500" />}
            </span>
            {shipment.phone && (
              <span className="text-xs text-slate-400 mt-1 flex items-center gap-1 font-medium">
                📱 {shipment.phone}
              </span>
            )}
          </div>
        </td>
        <td className="p-4">
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider shadow-sm border ${
              shipment.carrier === CarrierName.INTER_RAPIDISIMO
                ? 'bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800'
                : shipment.carrier === CarrierName.ENVIA
                  ? 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800'
                  : shipment.carrier === CarrierName.COORDINADORA
                    ? 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'
                    : shipment.carrier === CarrierName.TCC
                      ? 'bg-yellow-50 text-yellow-700 border-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800'
                      : 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
            }`}
          >
            {shipment.carrier}
          </span>
        </td>
        <td className="p-4" onClick={(e) => e.stopPropagation()}>
          <div className="flex flex-wrap gap-1.5">
            {(Object.values(ShipmentStatus) as ShipmentStatus[]).map((status) => (
              <button
                key={status}
                onClick={() => onUpdateStatus(shipment.id, status)}
                title={status}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 shadow-sm ${
                  shipment.status === status
                    ? `${statusColors[status]} ring-2 ring-offset-2 dark:ring-offset-slate-900 scale-110 shadow-md`
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300'
                }`}
              >
                {statusIcons[status]}
              </button>
            ))}
          </div>
        </td>
        <td className="p-4" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenEvidence(shipment)}
              className={`relative p-2 rounded-lg transition-all duration-200 group/btn border ${
                shipment.evidenceImage
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800'
                  : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700'
              }`}
              title="Evidencia Fotográfica"
            >
              <Camera className="w-4 h-4" />
              {shipment.aiAnalysis && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-purple-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse" />
              )}
            </button>
            <button
              onClick={handleSmartTrack}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm border ${
                shipment.smartTracking
                  ? 'bg-purple-50 text-purple-700 border-purple-100 hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-purple-300 hover:text-purple-600 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 dark:hover:border-purple-500'
              }`}
            >
              {isTracking ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              {shipment.smartTracking ? 'Ver Reporte' : 'IA Track'}
            </button>
          </div>
        </td>
        <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-end gap-2">
            <button
              onClick={handleTrackingClick}
              className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800 dark:hover:text-indigo-400 transition-colors"
              title="Web Oficial"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
            <button
              onClick={handleWhatsApp}
              className="p-2 rounded-lg text-slate-400 hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-900/20 dark:hover:text-green-400 transition-colors"
              title="WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
            </button>
            <div className="p-2 text-slate-300 dark:text-slate-600">
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </div>
        </td>
      </tr>

      {/* Expanded Logic AI Analysis Panel */}
      {isExpanded && (
        <tr className="bg-slate-50/50 dark:bg-slate-900/50">
          <td colSpan={5} className="p-0">
            <div className="overflow-hidden animate-in slide-in-from-top-2 duration-300">
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-100 dark:border-slate-800">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Info className="w-4 h-4 text-indigo-500" /> Detalles de Gestión
                  </h3>
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-2 text-sm text-slate-600 dark:text-slate-300">
                    <p>
                      <strong className="text-slate-800 dark:text-slate-200">
                        Transportadora:
                      </strong>{' '}
                      {shipment.carrier}
                    </p>
                    <p>
                      <strong className="text-slate-800 dark:text-slate-200">Estado Local:</strong>{' '}
                      {shipment.status}
                    </p>
                    <p>
                      <strong className="text-slate-800 dark:text-slate-200">Teléfono:</strong>{' '}
                      {shipment.phone || 'No registrado'}
                    </p>
                    <div className="pt-2">
                      <textarea
                        className="w-full text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-slate-200 placeholder-slate-400"
                        placeholder="Agregar notas internas..."
                        rows={2}
                        defaultValue={shipment.notes}
                      />
                    </div>
                  </div>
                </div>

                {/* AI Smart Tracking Analysis (Ticket Style) */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600" /> Rastreo Inteligente
                  </h3>
                  {isTracking ? (
                    <div className="h-40 bg-white dark:bg-slate-800 rounded-xl border border-purple-100 dark:border-purple-900 shadow-sm flex flex-col items-center justify-center text-purple-500 gap-3">
                      <Loader2 className="w-8 h-8 animate-spin" />
                      <span className="text-sm font-medium">
                        Conectando con {shipment.carrier}...
                      </span>
                    </div>
                  ) : shipment.smartTracking ? (
                    <div
                      className={`bg-white dark:bg-slate-800 rounded-xl border shadow-sm overflow-hidden relative ${
                        isRestricted
                          ? 'border-amber-200 dark:border-amber-800'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {/* Decorative 'ticket' holes */}
                      <div className="absolute -left-2 top-1/2 w-4 h-4 bg-slate-50 dark:bg-slate-900/50 rounded-full" />
                      <div className="absolute -right-2 top-1/2 w-4 h-4 bg-slate-50 dark:bg-slate-900/50 rounded-full" />

                      <div
                        className={`p-3 text-white flex justify-between items-center ${
                          isRestricted
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                            : 'bg-gradient-to-r from-purple-600 to-indigo-600'
                        }`}
                      >
                        <span className="text-xs font-bold tracking-widest uppercase opacity-90 flex items-center gap-2">
                          {isRestricted ? <Lock className="w-3 h-3" /> : null}
                          {isRestricted ? 'ACCIÓN REQUERIDA' : 'LIVE TRACKING'}
                        </span>
                        <span className="text-[10px] font-mono opacity-80 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {shipment.smartTracking.lastUpdate}
                        </span>
                      </div>
                      <div className="p-5 space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">
                              Estado Detectado
                            </p>
                            <p className="text-slate-800 dark:text-white font-bold text-lg leading-tight">
                              {shipment.smartTracking.statusSummary}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">
                              Tiempo
                            </p>
                            <p className="text-slate-600 dark:text-slate-300 font-mono text-sm">
                              {shipment.smartTracking.timeElapsed}
                            </p>
                          </div>
                        </div>

                        <div
                          className={`p-3 rounded-lg border-l-4 ${
                            isRestricted
                              ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-600 border-l-amber-500'
                              : 'bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-700 border-l-purple-500'
                          }`}
                        >
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase mb-1">
                            Recomendación Logística
                          </p>
                          <p className="text-sm text-slate-700 dark:text-slate-300 leading-snug">
                            {shipment.smartTracking.recommendation}
                          </p>

                          {isRestricted && (
                            <button
                              onClick={(e) => handleTrackingClick(e)}
                              className="mt-3 w-full bg-amber-100 hover:bg-amber-200 dark:bg-amber-800/40 dark:hover:bg-amber-800/60 text-amber-800 dark:text-amber-200 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Abrir Rastreo Oficial Ahora
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-40 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 gap-2 p-6 text-center">
                      <p className="text-sm">Sin reporte digital generado.</p>
                      <button
                        onClick={handleSmartTrack}
                        className="text-indigo-600 dark:text-indigo-400 font-bold text-sm hover:underline"
                      >
                        Generar Reporte Digital
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};
