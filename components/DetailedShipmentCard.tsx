import React, { useRef, useState } from 'react';
import { Shipment, ShipmentStatus, AITrackingResult } from '../types';
import {
  getLogisticsTemplates,
  CHATEA_PRO_URL,
  getShipmentRecommendation,
  generateClaimPDF,
} from '../services/logisticsService';
import { trackShipmentWithAI } from '../services/claudeService';
import {
  Truck,
  CheckCircle,
  AlertTriangle,
  MapPin,
  Copy,
  Image as ImageIcon,
  MessageCircle,
  Clock,
  FileText,
  Smartphone,
  Package,
  History,
  Box,
  Siren,
  Ticket,
  Loader2,
  Lightbulb,
  Scale,
  ChevronDown,
  ChevronUp,
  Map,
  ExternalLink,
  Lock,
  Sparkles,
  Calendar,
  ArrowRight,
} from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import { CarrierName } from '../types';

interface DetailedShipmentCardProps {
  shipment: Shipment;
  index: number;
  onUpdateSmartTracking: (id: string, result: AITrackingResult) => void;
}

export const DetailedShipmentCard: React.FC<DetailedShipmentCardProps> = ({
  shipment,
  index,
  onUpdateSmartTracking,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false); // Default collapsed
  const [isCopying, setIsCopying] = useState(false);
  const [isImageCopying, setIsImageCopying] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [activeTab, setActiveTab] = useState<'SUMMARY' | 'HISTORY'>('SUMMARY');

  const info = shipment.detailedInfo;
  if (!info) return null;

  const lastEvent = info.events[0];
  const eventsChronological = [...info.events];

  const recommendation = getShipmentRecommendation(shipment);

  // Alert Logic Calculation
  const getAlerts = () => {
    if (shipment.status === ShipmentStatus.IN_OFFICE) {
      const arrivalDate = new Date(lastEvent?.date || new Date().toISOString());
      const today = new Date();
      const diffTime = Math.abs(today.getTime() - arrivalDate.getTime());
      const daysInOffice = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (daysInOffice > 4) {
        return {
          type: 'CRITICAL',
          msg: `URGENTE: ${daysInOffice} DÍAS EN OFICINA. ¡GENERAR TICKET YA!`,
        };
      } else {
        return { type: 'INFO', msg: `Guía en oficina (${daysInOffice} días). Pendiente retiro.` };
      }
    }
    if (shipment.status === ShipmentStatus.ISSUE) {
      return { type: 'WARNING', msg: `NOVEDAD ACTIVA: ${info.rawStatus}` };
    }
    return null;
  };

  const shipmentAlert = getAlerts();
  const templates = getLogisticsTemplates(shipment);

  // --- AI TRACKING LOGIC ---
  const handleSmartTrack = async () => {
    setIsTracking(true);
    try {
      const result = await trackShipmentWithAI(shipment.carrier, shipment.id);
      onUpdateSmartTracking(shipment.id, result);
    } catch (e) {
      console.error(e);
    } finally {
      setIsTracking(false);
    }
  };

  // --- CAPTURE LOGIC ---

  const generateImage = async (): Promise<Blob | null> => {
    if (!cardRef.current) return null;
    try {
      const dataUrl = await htmlToImage.toPng(cardRef.current, {
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        cacheBust: true,
      });
      const blob = await (await fetch(dataUrl)).blob();
      return blob;
    } catch (error) {
      console.error('Error generating image:', error);
      return null;
    }
  };

  const handleCopyImage = async () => {
    setIsImageCopying(true);
    setActiveTab('HISTORY');
    setTimeout(async () => {
      const blob = await generateImage();
      if (blob) {
        try {
          const item = new ClipboardItem({ 'image/png': blob });
          await navigator.clipboard.write([item]);
          alert('Imagen del Historial copiada al portapapeles.');
        } catch (err) {
          alert('Error copiando imagen. Tu navegador podría no soportarlo.');
        }
      }
      setIsImageCopying(false);
    }, 500);
  };

  const handleCopyAll = async () => {
    setIsImageCopying(true);
    setActiveTab('HISTORY');
    setTimeout(async () => {
      try {
        const blob = await generateImage();
        const text =
          `📋 *RESUMEN DE ENVÍO*\n` +
          `Guía: ${shipment.id}\n` +
          `Estado: ${shipment.status}\n` +
          `📱 Celular: ${shipment.phone || 'N/A'}\n` +
          `📍 ${info.origin} -> ${info.destination}`;

        const items: Record<string, Blob> = {};
        if (blob) items['image/png'] = blob;
        items['text/plain'] = new Blob([text], { type: 'text/plain' });

        await navigator.clipboard.write([new ClipboardItem(items)]);
        alert('Imagen y Texto copiados al portapapeles.');
      } catch (error) {
        console.error(error);
        alert(
          'Tu navegador no soporta copiar imagen y texto simultáneamente. Se copiará solo la imagen.'
        );
        const blob = await generateImage();
        if (blob) {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        }
      }
      setIsImageCopying(false);
    }, 500);
  };

  const handleSmartContact = async () => {
    setIsCopying(true);
    setActiveTab('HISTORY');
    setTimeout(async () => {
      try {
        const blob = await generateImage();
        if (blob) {
          const item = new ClipboardItem({ 'image/png': blob });
          await navigator.clipboard.write([item]);
        }
        const message = templates.clientTemplate;
        const phone = shipment.phone || '';
        const url = `https://wa.me/57${phone}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
      } catch (error) {
        console.error('Error in smart contact:', error);
      } finally {
        setIsCopying(false);
      }
    }, 500);
  };

  const handleChateaPro = () => {
    if (shipment.phone) {
      navigator.clipboard.writeText(shipment.phone);
      alert('Celular copiado: ' + shipment.phone);
    } else {
      alert('No hay celular registrado para copiar.');
    }
    window.open(CHATEA_PRO_URL, '_blank');
  };

  const handleCopyTemplate = () => {
    navigator.clipboard.writeText(templates.clientTemplate);
    alert('Plantilla de WhatsApp copiada.');
  };

  const handleCopyTicket = () => {
    navigator.clipboard.writeText(templates.ticketTemplate);
    alert(`Ticket tipo ${templates.ticketType} copiado.`);
  };

  const handleCopyText = () => {
    const text =
      `📋 *RESUMEN DE ENVÍO*\n` +
      `Guía: ${shipment.id}\n` +
      `Transportadora: ${shipment.carrier}\n` +
      `📱 Celular: ${shipment.phone || 'No registrado'}\n` +
      `Estado: ${shipment.status} (${info.rawStatus})\n` +
      `📍 Ruta: ${info.origin} -> ${info.destination}\n` +
      `📅 Último Movimiento: ${lastEvent?.description || ''} (${lastEvent?.date.split('T')[0]})`;
    navigator.clipboard.writeText(text);
    alert('Texto copiado al portapapeles.');
  };

  const handleGeneratePDF = () => {
    generateClaimPDF(shipment);
  };

  const copyToClipboard = (text?: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
  };

  const getStatusColor = (status: ShipmentStatus) => {
    switch (status) {
      case ShipmentStatus.DELIVERED:
        return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case ShipmentStatus.ISSUE:
        return 'text-red-600 bg-red-50 border-red-200';
      case ShipmentStatus.IN_TRANSIT:
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case ShipmentStatus.IN_OFFICE:
        return 'text-amber-600 bg-amber-50 border-amber-200';
      default:
        return 'text-orange-600 bg-orange-50 border-orange-200';
    }
  };

  // HISTORY RENDERERS
  const RenderInterHistory = () => (
    <div className="p-0 bg-white dark:bg-navy-900 text-slate-800 dark:text-slate-200 font-sans">
      <div className="p-4 md:p-6 border-b border-slate-100 dark:border-navy-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 rounded-full px-4 py-2 w-full md:w-80 flex items-center justify-between">
          <span className="font-mono font-bold text-slate-800 dark:text-slate-200 tracking-wider text-lg">
            {shipment.id}
          </span>
          <button className="bg-navy-900 dark:bg-white text-white dark:text-navy-900 text-xs font-bold px-3 py-1.5 rounded-full">
            Rastrear
          </button>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1">
            GUÍA - SIN NOVEDAD
          </p>
          <h2 className="text-3xl font-bold text-orange-500 tracking-tight">{shipment.id}</h2>
          {shipment.phone && <p className="text-xs text-slate-400 mt-1">{shipment.phone}</p>}
        </div>
      </div>

      <div className="flex flex-col md:flex-row">
        <div className="md:w-1/3 p-6 md:p-8 flex flex-col justify-between border-r border-slate-100 dark:border-navy-800 order-2 md:order-1">
          <div className="space-y-8">
            <div className="hidden md:block text-right">
              <span className="text-xs font-bold text-slate-900 dark:text-white underline decoration-2 decoration-slate-900 underline-offset-4 cursor-pointer">
                Ver menos estados
              </span>
            </div>
            <div className="mt-8 md:mt-0">
              <div className="mb-6">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">ORIGEN</p>
                <p className="text-lg font-bold text-orange-600 dark:text-orange-500 leading-tight">
                  {info.origin.replace('COL', '')}
                </p>
              </div>
              <div className="w-full h-px bg-slate-100 dark:bg-navy-800 mb-6"></div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">DESTINO</p>
                <p className="text-lg font-bold text-orange-600 dark:text-orange-500 leading-tight">
                  {info.destination.replace('COL', '')}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-8">
            <button className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-6 rounded-full shadow-lg shadow-orange-500/20 transition-all text-sm">
              Ver más detalle
            </button>
          </div>
        </div>

        <div className="md:w-2/3 p-6 md:p-8 order-1 md:order-2">
          <div className="relative pl-2 md:pl-4 border-l-2 border-slate-200 dark:border-navy-800 space-y-10 py-2">
            {eventsChronological.map((event, idx) => (
              <div key={idx} className="relative pl-6">
                <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-orange-200 border-2 border-white dark:border-navy-900 dark:bg-orange-900/50"></div>
                <div className="group">
                  <p className="text-[10px] text-slate-500 font-medium mb-0.5">Paso por</p>
                  <p className="text-sm md:text-base font-bold text-slate-800 dark:text-slate-200 mb-1">
                    {event.description}
                  </p>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs text-slate-400">
                    <span>Fecha: {event.date.split('T')[0]}</span>
                    <span className="hidden sm:inline text-slate-300">|</span>
                    <span className="uppercase">Ciudad: {event.location}</span>
                  </div>
                </div>
              </div>
            ))}
            <div className="relative pl-6 mt-8">
              <div className="absolute -left-[2px] top-0 bottom-0 w-1 bg-emerald-500 rounded-full"></div>
              <div className="bg-slate-50 dark:bg-navy-950 p-5 rounded-r-2xl rounded-bl-2xl border border-slate-100 dark:border-navy-800">
                <div className="absolute -left-[20px] top-6 w-10 h-10 bg-emerald-500 rounded-full border-4 border-white dark:border-navy-900 flex items-center justify-center text-white shadow-md z-10">
                  <Box className="w-5 h-5" />
                </div>
                <div className="ml-4">
                  <p className="text-xs text-slate-500 mb-1">Estado actual de tu envío</p>
                  <p className="text-xl font-black text-slate-900 dark:text-white leading-tight mb-2">
                    {info.rawStatus || lastEvent.description}
                  </p>
                  <p className="text-xs text-slate-400">
                    Fecha estimada de entrega: {info.estimatedDelivery || 'Por confirmar'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const RenderEnviaHistory = () => (
    <div className="bg-white p-0 font-sans text-gray-800">
      <div className="bg-red-600 text-white p-4 flex justify-between items-center shadow-md">
        <div className="font-bold text-lg tracking-wide uppercase">Envía - Rastreo</div>
        <div className="text-sm font-medium opacity-90">{shipment.id}</div>
      </div>
      <div className="p-6 md:p-8">
        <div className="flex flex-wrap gap-6 mb-8 border-b border-gray-100 pb-6">
          <div className="flex-1 min-w-[150px]">
            <p className="text-xs text-red-500 font-bold uppercase mb-1">Origen</p>
            <p className="text-lg font-bold text-gray-800">{info.origin.replace('COL', '')}</p>
          </div>
          <div className="flex-1 min-w-[150px]">
            <p className="text-xs text-red-500 font-bold uppercase mb-1">Destino</p>
            <p className="text-lg font-bold text-gray-800">{info.destination.replace('COL', '')}</p>
          </div>
          <div className="flex-1 min-w-[150px]">
            <p className="text-xs text-red-500 font-bold uppercase mb-1">Estado Actual</p>
            <p className="text-lg font-bold text-gray-800">{info.rawStatus}</p>
          </div>
        </div>
        <div className="relative">
          <div className="absolute left-[15px] top-2 bottom-0 w-0.5 bg-gray-200"></div>
          <div className="space-y-8">
            {eventsChronological.map((event, idx) => (
              <div key={idx} className="relative flex gap-6">
                <div
                  className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-4 border-white shadow-sm ${idx === 0 ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-400'}`}
                >
                  {idx === 0 ? (
                    <MapPin className="w-4 h-4" />
                  ) : (
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  )}
                </div>
                <div
                  className={`flex-1 p-4 rounded-lg border ${idx === 0 ? 'bg-red-50 border-red-100' : 'bg-white border-gray-100 shadow-sm'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <p
                      className={`font-bold text-sm ${idx === 0 ? 'text-red-700' : 'text-gray-800'}`}
                    >
                      {event.description}
                    </p>
                    <span className="text-xs font-mono text-gray-400 shrink-0 ml-2">
                      {event.date.split('T')[0]}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 uppercase flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {event.location}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="bg-gray-50 p-3 text-center border-t border-gray-200">
        <p className="text-[10px] text-gray-400 font-bold uppercase">
          Servicio de Mensajería y Mercancías
        </p>
      </div>
    </div>
  );

  const RenderCoordinadoraHistory = () => (
    <div className="bg-slate-50 font-sans text-slate-800">
      <div className="bg-blue-800 p-5 flex justify-between items-center text-white shadow-lg">
        <div>
          <h2 className="font-bold text-xl tracking-tight italic">Coordinadora</h2>
          <p className="text-[10px] opacity-80 uppercase tracking-widest">Recogida y Entrega</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-blue-200">Guía de Rastreo</p>
          <p className="font-mono font-bold text-lg">{shipment.id}</p>
        </div>
      </div>
      <div className="bg-yellow-400 px-6 py-3 flex flex-wrap justify-between items-center gap-4 shadow-sm relative z-10">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-blue-900 uppercase">Estado:</span>
          <span className="font-bold text-blue-900 text-sm bg-yellow-300/50 px-2 py-0.5 rounded border border-yellow-500/30">
            {info.rawStatus}
          </span>
        </div>
        <div className="text-xs font-bold text-blue-900 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Entrega Aprox: {info.estimatedDelivery || 'Pendiente'}
        </div>
      </div>
      <div className="p-6 md:p-8 bg-white min-h-[400px]">
        <div className="flex items-center justify-between mb-8 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="text-center">
            <p className="text-xs text-slate-400 font-bold mb-1">ORIGEN</p>
            <p className="font-bold text-blue-900 text-lg">{info.origin.replace('COL', '')}</p>
          </div>
          <div className="flex-1 px-4 flex flex-col items-center">
            <div className="w-full h-0.5 bg-blue-200 relative">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-100 p-1.5 rounded-full border border-blue-300 text-blue-600">
                <Truck className="w-4 h-4" />
              </div>
            </div>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-400 font-bold mb-1">DESTINO</p>
            <p className="font-bold text-blue-900 text-lg">{info.destination.replace('COL', '')}</p>
          </div>
        </div>
        <div className="space-y-0">
          {eventsChronological.map((event, idx) => (
            <div key={idx} className="flex group">
              <div className="w-24 py-4 text-right pr-4 border-r border-blue-100">
                <p className="font-bold text-xs text-slate-600">{event.date.split('T')[0]}</p>
                <p className="text-[10px] text-slate-400">{event.date.split('T')[1]}</p>
              </div>
              <div className="flex-1 py-4 pl-4 relative">
                <div className="absolute -left-[5px] top-6 w-2.5 h-2.5 rounded-full bg-blue-600 ring-4 ring-white"></div>
                <p className="font-bold text-sm text-blue-900 mb-1">{event.description}</p>
                <p className="text-xs text-slate-500 uppercase">{event.location}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const isRestricted =
    shipment.smartTracking?.statusSummary.toLowerCase().includes('validación') ||
    shipment.smartTracking?.statusSummary.toLowerCase().includes('manual') ||
    shipment.smartTracking?.statusSummary.toLowerCase().includes('protegido');

  return (
    <div className="bg-white dark:bg-navy-900 rounded-lg shadow-sm border border-slate-200 dark:border-navy-700 overflow-hidden mb-1 transition-all hover:shadow-md animate-in fade-in duration-300">
      {/* 1. COMPACT ROW - The default view */}
      <div
        className="flex items-center justify-between p-2.5 gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-navy-800 transition-colors h-14"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3 flex-1 overflow-hidden">
          <span className="text-[10px] text-slate-400 font-mono min-w-[20px] hidden sm:block">
            #{index + 1}
          </span>

          {/* Guide */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              copyToClipboard(shipment.id);
            }}
            className="flex items-center gap-1.5 min-w-[110px] hover:text-orange-500 transition-colors group"
            title="Click para copiar guía"
          >
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-sm">
              {shipment.id}
            </span>
            <Copy className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100" />
          </div>

          {/* Phone - Now prominently next to guide */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              copyToClipboard(shipment.phone);
            }}
            className="flex items-center gap-1.5 min-w-[100px] hover:text-blue-500 transition-colors group"
            title="Click para copiar celular"
          >
            <Smartphone className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-mono text-sm text-slate-600 dark:text-slate-300">
              {shipment.phone || '---'}
            </span>
            <Copy className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100" />
          </div>

          {/* Status Badge */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              copyToClipboard(shipment.status);
            }}
            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border whitespace-nowrap hidden sm:block ${getStatusColor(shipment.status)}`}
            title="Click para copiar estado"
          >
            {shipment.status}
          </div>

          {/* Recommendation Preview */}
          <div className="hidden lg:block text-xs text-slate-400 italic truncate ml-2 max-w-[280px]">
            {recommendation}
          </div>
        </div>

        {/* Expand Button */}
        <button
          className={`p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-navy-700 text-slate-500 transition-transform duration-200 flex-shrink-0 ${isExpanded ? 'rotate-180 bg-slate-100 dark:bg-navy-800' : ''}`}
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {/* 2. EXPANDED FULL CONTENT */}
      {isExpanded && (
        <div className="border-t border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-950 p-4">
          <div className="mb-4">
            <div className="flex gap-2 mb-0 px-2 justify-center md:justify-start">
              <button
                onClick={() => setActiveTab('SUMMARY')}
                className={`px-6 py-3 rounded-t-xl text-sm font-bold flex items-center gap-2 transition-all ${
                  activeTab === 'SUMMARY'
                    ? 'bg-white dark:bg-navy-900 text-orange-600 border-t border-x border-slate-200 dark:border-navy-700 shadow-sm relative top-[1px] z-10'
                    : 'bg-slate-100 dark:bg-navy-950 text-slate-500 hover:bg-slate-200 dark:hover:bg-navy-800 opacity-80'
                }`}
              >
                <Package className="w-4 h-4" /> Resumen Operativo
              </button>
              <button
                onClick={() => setActiveTab('HISTORY')}
                className={`px-6 py-3 rounded-t-xl text-sm font-bold flex items-center gap-2 transition-all ${
                  activeTab === 'HISTORY'
                    ? 'bg-white dark:bg-navy-900 text-orange-600 border-t border-x border-slate-200 dark:border-navy-700 shadow-sm relative top-[1px] z-10'
                    : 'bg-slate-100 dark:bg-navy-950 text-slate-500 hover:bg-slate-200 dark:hover:bg-navy-800 opacity-80'
                }`}
              >
                <History className="w-4 h-4" /> Historial Completo
              </button>
            </div>

            <div
              ref={cardRef}
              className="bg-white dark:bg-navy-900 rounded-2xl shadow-xl border border-slate-200 dark:border-navy-700 overflow-hidden relative"
            >
              {activeTab === 'SUMMARY' && (
                <div className="p-6 md:p-8">
                  {/* AI TRACKING SECTION (New) */}
                  <div className="mb-6">
                    {isTracking ? (
                      <div className="h-20 bg-white dark:bg-slate-800 rounded-xl border border-purple-100 dark:border-purple-900 shadow-sm flex items-center justify-center text-purple-500 gap-3">
                        <Loader2 className="w-6 h-6 animate-spin" />
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
                        <div
                          className={`p-2 text-white flex justify-between items-center ${
                            isRestricted
                              ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                              : 'bg-gradient-to-r from-purple-600 to-indigo-600'
                          }`}
                        >
                          <span className="text-[10px] font-bold tracking-widest uppercase opacity-90 flex items-center gap-2">
                            <Sparkles className="w-3 h-3" />
                            {isRestricted ? 'ACCIÓN REQUERIDA' : 'LIVE TRACKING'}
                          </span>
                          <span className="text-[10px] font-mono opacity-80 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {shipment.smartTracking.lastUpdate}
                          </span>
                        </div>
                        <div className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
                          <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">
                              Estado Detectado
                            </p>
                            <p className="text-slate-800 dark:text-white font-bold text-base leading-tight">
                              {shipment.smartTracking.statusSummary}
                            </p>
                          </div>
                          <div className="flex-1 border-l border-slate-100 dark:border-slate-700 pl-4">
                            <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">
                              Recomendación Logística
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-snug">
                              {shipment.smartTracking.recommendation}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={handleSmartTrack}
                        className="w-full py-3 rounded-xl border border-dashed border-purple-200 dark:border-purple-900 bg-purple-50/50 dark:bg-purple-900/10 text-purple-600 dark:text-purple-400 font-bold text-xs flex items-center justify-center gap-2 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                      >
                        <Sparkles className="w-4 h-4" />
                        Analizar Estado con IA (Gemini)
                      </button>
                    )}
                  </div>

                  {/* ALERT SECTION */}
                  {shipmentAlert && (
                    <div
                      className={`mb-6 p-4 rounded-xl border-l-4 shadow-sm flex items-start gap-4 hover:scale-[1.01] transition-transform duration-300 ${
                        shipmentAlert.type === 'CRITICAL'
                          ? 'bg-red-50 dark:bg-red-900/10 border-red-500 text-red-800'
                          : shipmentAlert.type === 'WARNING'
                            ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-500 text-amber-800'
                            : 'bg-blue-50 dark:bg-blue-900/10 border-blue-500 text-blue-800'
                      }`}
                    >
                      <div
                        className={`p-2 rounded-full ${
                          shipmentAlert.type === 'CRITICAL'
                            ? 'bg-red-100 text-red-600'
                            : shipmentAlert.type === 'WARNING'
                              ? 'bg-amber-100 text-amber-600'
                              : 'bg-blue-100 text-blue-600'
                        }`}
                      >
                        <Siren
                          className={`w-6 h-6 ${shipmentAlert.type === 'CRITICAL' ? 'animate-pulse' : ''}`}
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-black text-sm uppercase tracking-wider mb-1">
                          {shipmentAlert.type === 'CRITICAL'
                            ? 'ALERTA CRÍTICA DE TIEMPO'
                            : shipmentAlert.type === 'WARNING'
                              ? 'ATENCIÓN REQUERIDA'
                              : 'INFORMACIÓN LOGÍSTICA'}
                        </h4>
                        <p className="font-bold text-sm md:text-base leading-tight">
                          {shipmentAlert.msg}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-slate-100 dark:border-navy-800 pb-4 gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          Guía de Transporte
                        </span>
                        <span className="bg-slate-100 dark:bg-navy-800 text-slate-500 dark:text-slate-300 text-[10px] px-2 py-0.5 rounded-md font-bold">
                          #{index + 1}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
                          {shipment.id}
                        </h2>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-lg border border-indigo-100 dark:border-indigo-800 text-xs font-bold animate-pulse">
                          <Lightbulb className="w-3.5 h-3.5" />
                          {recommendation}
                        </div>
                      </div>
                    </div>
                    <div
                      className={`px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 border shadow-sm ${getStatusColor(shipment.status)}`}
                    >
                      {shipment.status === ShipmentStatus.DELIVERED ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : shipment.status === ShipmentStatus.IN_TRANSIT ? (
                        <Truck className="w-4 h-4" />
                      ) : shipment.status === ShipmentStatus.ISSUE ? (
                        <AlertTriangle className="w-4 h-4" />
                      ) : (
                        <Box className="w-4 h-4" />
                      )}
                      {shipment.status}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* RUTA */}
                    <div className="bg-slate-50 dark:bg-navy-950 rounded-2xl p-6 border border-slate-100 dark:border-navy-800 relative group overflow-hidden hover:scale-[1.02] hover:shadow-lg transition-all duration-300">
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Map className="w-24 h-24 text-slate-900 dark:text-white" />
                      </div>
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                        Ruta Logística
                      </h3>

                      <div className="space-y-6 relative z-10">
                        <div className="flex items-start gap-3">
                          <div className="mt-1">
                            <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-navy-600 border-2 border-white dark:border-navy-800 shadow-sm"></div>
                            <div className="w-0.5 h-10 bg-slate-200 dark:bg-navy-700 mx-auto my-1"></div>
                            <div className="w-3 h-3 rounded-full bg-orange-500 border-2 border-white dark:border-navy-800 shadow-sm shadow-orange-500/50"></div>
                          </div>
                          <div className="flex-1 space-y-4">
                            <div>
                              <p className="text-xs text-slate-500 uppercase font-semibold">
                                Origen
                              </p>
                              <p className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-none">
                                {info.origin}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 uppercase font-semibold">
                                Destino
                              </p>
                              <p className="text-xl font-black text-orange-600 dark:text-orange-500 leading-none">
                                {info.destination}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="pt-4 border-t border-slate-200 dark:border-navy-800 flex items-center gap-3">
                          <div className="p-2 bg-white dark:bg-navy-900 rounded-lg shadow-sm border border-slate-100 dark:border-navy-700">
                            <Truck className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">
                              Operador
                            </p>
                            <p className="text-sm font-bold text-slate-800 dark:text-white">
                              {shipment.carrier}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* TIEMPOS Y ESTADO */}
                    <div className="bg-slate-50 dark:bg-navy-950 rounded-2xl p-6 border border-slate-100 dark:border-navy-800 relative group overflow-hidden hover:scale-[1.02] hover:shadow-lg transition-all duration-300">
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Clock className="w-24 h-24 text-slate-900 dark:text-white" />
                      </div>
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                        Tiempos & Estado
                      </h3>

                      <div className="space-y-4 relative z-10">
                        <div className="flex items-end gap-2">
                          <span className="text-5xl font-black text-slate-800 dark:text-white tracking-tighter">
                            {info.daysInTransit}
                          </span>
                          <span className="text-sm font-bold text-slate-500 pb-2 uppercase">
                            Días en proceso
                          </span>
                        </div>

                        <div
                          className={`p-4 rounded-xl border-l-4 shadow-sm bg-white dark:bg-navy-900 ${
                            shipment.status === ShipmentStatus.DELIVERED
                              ? 'border-emerald-500'
                              : shipment.status === ShipmentStatus.ISSUE
                                ? 'border-red-500'
                                : 'border-blue-500'
                          }`}
                        >
                          <p className="text-[10px] font-bold uppercase opacity-70 mb-1 text-slate-500">
                            Último Movimiento (Estado Actual)
                          </p>
                          <p className="text-sm font-bold leading-tight text-slate-900 dark:text-white">
                            {lastEvent?.description || info.rawStatus}
                          </p>
                          <p className="text-xs font-mono mt-2 opacity-60 text-slate-500">
                            {lastEvent?.date.replace('T', ' ')}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* GESTION & TEMPLATES */}
                    <div className="bg-slate-50 dark:bg-navy-950 rounded-2xl p-6 border border-slate-100 dark:border-navy-800 relative group overflow-hidden flex flex-col justify-between hover:scale-[1.02] hover:shadow-lg transition-all duration-300">
                      <div>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                          Gestión & Plantillas
                        </h3>

                        <div className="space-y-3">
                          <button
                            onClick={handleChateaPro}
                            className="w-full py-2.5 px-3 bg-navy-900 hover:bg-navy-800 text-gold-500 rounded-lg text-xs font-bold flex items-center justify-between group/btn transition-all shadow-md"
                          >
                            <span className="flex items-center gap-2">
                              <Smartphone className="w-4 h-4" /> Chatea Pro
                            </span>
                            <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                          </button>

                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={handleCopyTemplate}
                              className="py-2 px-2 bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-slate-600 dark:text-slate-300 hover:text-orange-600 hover:border-orange-300 rounded-lg text-[10px] font-bold flex flex-col items-center gap-1 transition-all shadow-sm"
                            >
                              <Copy className="w-4 h-4" />
                              Copiar Plantilla
                            </button>
                            <button
                              onClick={handleCopyTicket}
                              className="py-2 px-2 bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-slate-600 dark:text-slate-300 hover:text-orange-600 hover:border-orange-300 rounded-lg text-[10px] font-bold flex flex-col items-center gap-1 transition-all shadow-sm"
                            >
                              <Ticket className="w-4 h-4" />
                              Copiar Ticket
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-navy-800 space-y-2">
                        <button
                          onClick={handleCopyAll}
                          className="w-full py-2.5 rounded-xl border border-slate-300 dark:border-navy-700 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 dark:hover:bg-navy-800 transition-colors flex items-center justify-center gap-2"
                        >
                          <Copy className="w-4 h-4" /> Copiar Todo (Img + Txt)
                        </button>

                        {(shipment.status === ShipmentStatus.ISSUE ||
                          shipment.status === ShipmentStatus.IN_OFFICE) && (
                          <button
                            onClick={handleGeneratePDF}
                            className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all"
                          >
                            <Scale className="w-4 h-4" /> Generar Reclamo (PDF)
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'HISTORY' && (
                <>
                  {shipment.carrier === CarrierName.ENVIA && <RenderEnviaHistory />}
                  {shipment.carrier === CarrierName.COORDINADORA && <RenderCoordinadoraHistory />}
                  {shipment.carrier !== CarrierName.ENVIA &&
                    shipment.carrier !== CarrierName.COORDINADORA && <RenderInterHistory />}
                </>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={handleCopyText}
                className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 text-slate-600 dark:text-slate-300 hover:text-orange-600 hover:border-orange-200 px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm flex items-center gap-2 transition-all"
              >
                <FileText className="w-4 h-4" /> Copiar Texto
              </button>
              <button
                onClick={handleCopyImage}
                disabled={isImageCopying}
                className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 text-slate-600 dark:text-slate-300 hover:text-orange-600 hover:border-orange-200 px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm flex items-center gap-2 transition-all"
              >
                {isImageCopying ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ImageIcon className="w-4 h-4" />
                )}
                Copiar Imagen
              </button>
              <button
                onClick={handleSmartContact}
                disabled={isCopying}
                className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-orange-500/20 transform hover:-translate-y-0.5 transition-all flex items-center gap-2"
              >
                {isCopying ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <MessageCircle className="w-4 h-4" />
                )}
                Contactar Cliente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
