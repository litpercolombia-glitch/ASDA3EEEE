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
  List,
  LayoutGrid,
  CheckCircle2,
  XCircle,
  Eye,
  ClipboardCopy,
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

// =====================================
// RESUMEN DE VALIDACIÓN DE CARGA
// =====================================
const LoadingSummary: React.FC<{
  shipments: Shipment[];
  onStatusFilter: (status: string) => void;
}> = ({ shipments, onStatusFilter }) => {
  // Agrupar por status
  const statusGroups = useMemo(() => {
    const groups: Record<string, Shipment[]> = {};
    shipments.forEach((s) => {
      const status = s.status || 'SIN_ESTADO';
      if (!groups[status]) groups[status] = [];
      groups[status].push(s);
    });
    return groups;
  }, [shipments]);

  // Validaciones
  const guiasConTelefono = shipments.filter((s) => s.phone).length;
  const guiasSinTelefono = shipments.filter((s) => !s.phone).length;
  const guiasConDestino = shipments.filter((s) => s.detailedInfo?.destination).length;
  const guiasConHistorial = shipments.filter((s) => s.detailedInfo?.events && s.detailedInfo.events.length > 0).length;

  // Status con colores
  const statusColors: Record<string, { bg: string; text: string; icon: string }> = {
    DELIVERED: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', icon: '✅' },
    IN_TRANSIT: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', icon: '🚚' },
    RETURNED: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', icon: '↩️' },
    ISSUE: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400', icon: '⚠️' },
    IN_OFFICE: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', icon: '📦' },
    PENDING: { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-400', icon: '⏳' },
    SIN_ESTADO: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-400', icon: '❓' },
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      DELIVERED: 'Entregado',
      IN_TRANSIT: 'En Tránsito',
      RETURNED: 'Devuelto',
      ISSUE: 'Con Novedad',
      IN_OFFICE: 'En Oficina',
      PENDING: 'Pendiente',
      SIN_ESTADO: 'Sin Estado',
    };
    return labels[status] || status;
  };

  return (
    <div className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-700 p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
        <h3 className="font-bold text-slate-800 dark:text-white">Resumen de Carga</h3>
        <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full ml-auto">
          {shipments.length} guías totales
        </span>
      </div>

      {/* Validación de datos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4 text-xs">
        <div className={`p-2 rounded-lg ${guiasSinTelefono === 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
          <div className="flex items-center gap-1">
            <Phone className="w-3 h-3" />
            <span className={guiasSinTelefono === 0 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}>
              {guiasConTelefono} con teléfono
            </span>
          </div>
          {guiasSinTelefono > 0 && (
            <span className="text-red-500 text-xs">⚠️ {guiasSinTelefono} sin teléfono</span>
          )}
        </div>
        <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
          <div className="flex items-center gap-1 text-blue-700 dark:text-blue-400">
            <MapPin className="w-3 h-3" />
            <span>{guiasConDestino} con destino</span>
          </div>
        </div>
        <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20">
          <div className="flex items-center gap-1 text-purple-700 dark:text-purple-400">
            <Calendar className="w-3 h-3" />
            <span>{guiasConHistorial} con historial</span>
          </div>
        </div>
        <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20">
          <div className="flex items-center gap-1 text-amber-700 dark:text-amber-400">
            <Truck className="w-3 h-3" />
            <span>{new Set(shipments.map(s => s.carrier)).size} transportadoras</span>
          </div>
        </div>
      </div>

      {/* Clasificación por Status */}
      <div className="border-t border-slate-200 dark:border-navy-700 pt-3">
        <p className="text-xs text-slate-500 mb-2 font-medium">CLASIFICACIÓN POR STATUS (click para filtrar):</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(statusGroups)
            .sort((a, b) => b[1].length - a[1].length)
            .map(([status, guias]) => {
              const colors = statusColors[status] || statusColors.SIN_ESTADO;
              return (
                <button
                  key={status}
                  onClick={() => onStatusFilter(status)}
                  className={`${colors.bg} ${colors.text} px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 hover:opacity-80 transition-opacity border border-transparent hover:border-current`}
                >
                  <span>{colors.icon}</span>
                  <span>{getStatusLabel(status)}</span>
                  <span className="font-bold bg-white/50 dark:bg-black/20 px-1.5 rounded">{guias.length}</span>
                </button>
              );
            })}
        </div>
      </div>
    </div>
  );
};

// =====================================
// BADGE DE ALERTA
// =====================================
const AlertBadge: React.FC<{ level: AlertLevel; count: number; onClick: () => void; active: boolean }> = ({
  level,
  count,
  onClick,
  active,
}) => {
  const config = {
    CRITICO: {
      bg: 'bg-red-100 dark:bg-red-900/30',
      border: 'border-red-200 dark:border-red-800',
      text: 'text-red-700 dark:text-red-400',
      icon: '🔴',
      label: 'CRÍTICAS',
      desc: '(5+ días)',
    },
    ALTO: {
      bg: 'bg-orange-100 dark:bg-orange-900/30',
      border: 'border-orange-200 dark:border-orange-800',
      text: 'text-orange-700 dark:text-orange-400',
      icon: '🟠',
      label: 'ALERTA',
      desc: '(3-4 días)',
    },
    MEDIO: {
      bg: 'bg-yellow-100 dark:bg-yellow-900/30',
      border: 'border-yellow-200 dark:border-yellow-800',
      text: 'text-yellow-700 dark:text-yellow-400',
      icon: '🟡',
      label: 'SEGUIMIENTO',
      desc: '(2 días)',
    },
    BAJO: {
      bg: 'bg-green-100 dark:bg-green-900/30',
      border: 'border-green-200 dark:border-green-800',
      text: 'text-green-700 dark:text-green-400',
      icon: '🟢',
      label: 'NORMAL',
      desc: '(< 2 días)',
    },
  };

  const c = config[level];

  return (
    <button
      onClick={onClick}
      className={`flex-1 ${c.bg} ${c.border} border rounded-lg p-2 text-left hover:shadow-md transition-all ${active ? 'ring-2 ring-offset-1 ring-amber-500' : ''}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-lg">{c.icon}</span>
        <span className={`text-xl font-bold ${c.text}`}>{count}</span>
      </div>
      <p className={`font-bold text-xs ${c.text}`}>{c.label}</p>
    </button>
  );
};

// =====================================
// TARJETA COMPACTA DE GUÍA (para vista comprimida)
// =====================================
const CompactGuiaRow: React.FC<{
  guiaRetrasada: GuiaRetrasada;
  onExpand: () => void;
}> = ({ guiaRetrasada, onExpand }) => {
  const [copiedGuia, setCopiedGuia] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const { guia, diasSinMovimiento, ultimoEstado, nivelAlerta } = guiaRetrasada;

  const alertColors = {
    CRITICO: 'border-l-red-500 bg-red-50/30 dark:bg-red-900/10',
    ALTO: 'border-l-orange-500 bg-orange-50/30 dark:bg-orange-900/10',
    MEDIO: 'border-l-yellow-500 bg-yellow-50/30 dark:bg-yellow-900/10',
    BAJO: 'border-l-green-500 bg-green-50/30 dark:bg-green-900/10',
  };

  const alertBadgeColors = {
    CRITICO: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400',
    ALTO: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400',
    MEDIO: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400',
    BAJO: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400',
  };

  const handleCopyGuia = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(guia.id);
    setCopiedGuia(true);
    setTimeout(() => setCopiedGuia(false), 1500);
  };

  const handleCopyPhone = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (guia.phone) {
      navigator.clipboard.writeText(guia.phone);
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 1500);
    }
  };

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (guia.phone) {
      const message = encodeURIComponent(
        `Hola! Le escribo de Litper sobre su pedido con guía ${guia.id}. El estado actual es: ${ultimoEstado}. ¿Podemos coordinar la entrega?`
      );
      window.open(`https://wa.me/57${guia.phone}?text=${message}`, '_blank');
    }
  };

  return (
    <div
      className={`border-l-4 ${alertColors[nivelAlerta]} border border-slate-200 dark:border-navy-700 rounded-lg p-2 hover:shadow-md transition-all cursor-pointer`}
      onClick={onExpand}
    >
      <div className="flex items-center gap-2">
        {/* Guía con botón de copiar */}
        <div className="flex items-center gap-1 min-w-[140px]">
          <Package className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <span className="font-mono font-bold text-sm text-slate-800 dark:text-white truncate">
            {guia.id}
          </span>
          <button
            onClick={handleCopyGuia}
            className="p-1 hover:bg-slate-200 dark:hover:bg-navy-700 rounded transition-colors flex-shrink-0"
            title="Copiar número de guía"
          >
            {copiedGuia ? (
              <Check className="w-3.5 h-3.5 text-green-500" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>
        </div>

        {/* Teléfono con botón de copiar */}
        <div className="flex items-center gap-1 min-w-[120px]">
          <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          {guia.phone ? (
            <>
              <span className="font-mono text-xs text-slate-600 dark:text-slate-400">
                {guia.phone}
              </span>
              <button
                onClick={handleCopyPhone}
                className="p-1 hover:bg-slate-200 dark:hover:bg-navy-700 rounded transition-colors flex-shrink-0"
                title="Copiar teléfono"
              >
                {copiedPhone ? (
                  <Check className="w-3.5 h-3.5 text-green-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                )}
              </button>
            </>
          ) : (
            <span className="text-xs text-slate-400 italic">Sin tel.</span>
          )}
        </div>

        {/* Transportadora */}
        <div className="hidden md:flex items-center gap-1 min-w-[80px]">
          <Truck className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <span className="text-xs text-slate-600 dark:text-slate-400 truncate">
            {guia.carrier}
          </span>
        </div>

        {/* Destino */}
        <div className="hidden lg:flex items-center gap-1 flex-1 min-w-[100px]">
          <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <span className="text-xs text-slate-600 dark:text-slate-400 truncate">
            {guia.detailedInfo?.destination || '-'}
          </span>
        </div>

        {/* Estado (comprimido) */}
        <div className="flex-1 min-w-[150px] max-w-[200px] hidden xl:block">
          <p className="text-xs text-slate-600 dark:text-slate-400 truncate" title={ultimoEstado}>
            {ultimoEstado.substring(0, 40)}{ultimoEstado.length > 40 ? '...' : ''}
          </p>
        </div>

        {/* Días sin movimiento */}
        <div className={`px-2 py-0.5 rounded-full text-xs font-bold ${alertBadgeColors[nivelAlerta]} flex items-center gap-1 flex-shrink-0`}>
          <Clock className="w-3 h-3" />
          {diasSinMovimiento}d
        </div>

        {/* Acciones rápidas */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {guia.phone && (
            <button
              onClick={handleWhatsApp}
              className="p-1.5 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
              title="Enviar WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onExpand(); }}
            className="p-1.5 bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 rounded hover:bg-slate-200 dark:hover:bg-navy-700 transition-colors"
            title="Ver detalles"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

// =====================================
// TARJETA EXPANDIDA DE GUÍA
// =====================================
const ExpandedGuiaCard: React.FC<{
  guiaRetrasada: GuiaRetrasada;
  onCollapse: () => void;
}> = ({ guiaRetrasada, onCollapse }) => {
  const [copiedGuia, setCopiedGuia] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
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
    setCopiedGuia(true);
    setTimeout(() => setCopiedGuia(false), 2000);
  };

  const handleCopyPhone = () => {
    if (guia.phone) {
      navigator.clipboard.writeText(guia.phone);
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
    }
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

        try {
          const blob = await (await fetch(dataUrl)).blob();
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
          alert('Imagen copiada al portapapeles');
        } catch {
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
      className={`bg-white dark:bg-navy-900 rounded-xl border-l-4 ${alertColors[nivelAlerta]} border border-slate-200 dark:border-navy-700 overflow-hidden transition-all shadow-lg`}
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
                  className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 dark:hover:bg-navy-800 rounded"
                  title="Copiar número de guía"
                >
                  {copiedGuia ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <Truck className="w-3 h-3" />
                {guia.carrier}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
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
              {diasSinMovimiento} días
            </div>
            <button
              onClick={onCollapse}
              className="p-1 hover:bg-slate-100 dark:hover:bg-navy-800 rounded"
            >
              <ChevronUp className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Info row con botones de copiar */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400 mb-3">
          {guia.phone && (
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-navy-950 px-2 py-1 rounded">
              <Phone className="w-4 h-4" />
              <span className="font-mono">{guia.phone}</span>
              <button
                onClick={handleCopyPhone}
                className="p-0.5 hover:bg-slate-200 dark:hover:bg-navy-800 rounded ml-1"
                title="Copiar teléfono"
              >
                {copiedPhone ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
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
        </div>
      </div>

      {/* History */}
      <div className="border-t border-slate-200 dark:border-navy-700 p-4 bg-slate-50 dark:bg-navy-950">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-bold text-slate-700 dark:text-white text-sm flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Historial de Eventos
          </h4>
        </div>

        {sortedEvents.length > 0 ? (
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {sortedEvents.slice(0, 5).map((event, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs">
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${idx === 0 ? 'bg-amber-500' : 'bg-slate-300'}`} />
                <div>
                  <span className="text-slate-500">
                    {new Date(event.date).toLocaleDateString('es-CO')} -
                  </span>
                  <span className="text-slate-700 dark:text-slate-300 ml-1">{event.description}</span>
                </div>
              </div>
            ))}
            {sortedEvents.length > 5 && (
              <p className="text-xs text-slate-400 text-center">+{sortedEvents.length - 5} eventos más</p>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-500 text-center py-2">No hay eventos registrados</p>
        )}
      </div>
    </div>
  );
};

// =====================================
// COMPONENTE PRINCIPAL
// =====================================
export const SeguimientoTab: React.FC<SeguimientoTabProps> = ({ shipments, onRefresh }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAlertLevel, setFilterAlertLevel] = useState<AlertLevel | 'ALL'>('ALL');
  const [filterTransportadora, setFilterTransportadora] = useState<CarrierName | 'ALL'>('ALL');
  const [filterStatus, setFilterStatus] = useState<string | 'ALL'>('ALL');
  const [viewMode, setViewMode] = useState<'compact' | 'expanded'>('compact');
  const [expandedGuia, setExpandedGuia] = useState<string | null>(null);

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

      // Status filter
      if (filterStatus !== 'ALL' && gr.guia.status !== filterStatus) {
        return false;
      }

      return true;
    });
  }, [guiasRetrasadas, searchQuery, filterAlertLevel, filterTransportadora, filterStatus]);

  // Get unique carriers
  const carriers = useMemo(() => {
    const unique = new Set(shipments.map((s) => s.carrier));
    return Array.from(unique).filter((c) => c !== CarrierName.UNKNOWN);
  }, [shipments]);

  const handleStatusFilter = (status: string) => {
    setFilterStatus(filterStatus === status ? 'ALL' : status);
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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-emerald-500" />
            Seguimiento de Guías
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {shipments.length} totales • {guiasRetrasadas.length} requieren atención
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-navy-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('compact')}
              className={`p-1.5 rounded ${viewMode === 'compact' ? 'bg-white dark:bg-navy-700 shadow-sm' : ''}`}
              title="Vista compacta"
            >
              <List className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            </button>
            <button
              onClick={() => setViewMode('expanded')}
              className={`p-1.5 rounded ${viewMode === 'expanded' ? 'bg-white dark:bg-navy-700 shadow-sm' : ''}`}
              title="Vista expandida"
            >
              <LayoutGrid className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            </button>
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-navy-800 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-navy-700 transition-colors text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Actualizar
            </button>
          )}
        </div>
      </div>

      {/* Resumen de Validación de Carga */}
      <LoadingSummary shipments={shipments} onStatusFilter={handleStatusFilter} />

      {/* Alert Summary (más compacto) */}
      <div className="grid grid-cols-4 gap-2">
        <AlertBadge
          level="CRITICO"
          count={alertCounts.CRITICO}
          onClick={() => setFilterAlertLevel(filterAlertLevel === 'CRITICO' ? 'ALL' : 'CRITICO')}
          active={filterAlertLevel === 'CRITICO'}
        />
        <AlertBadge
          level="ALTO"
          count={alertCounts.ALTO}
          onClick={() => setFilterAlertLevel(filterAlertLevel === 'ALTO' ? 'ALL' : 'ALTO')}
          active={filterAlertLevel === 'ALTO'}
        />
        <AlertBadge
          level="MEDIO"
          count={alertCounts.MEDIO}
          onClick={() => setFilterAlertLevel(filterAlertLevel === 'MEDIO' ? 'ALL' : 'MEDIO')}
          active={filterAlertLevel === 'MEDIO'}
        />
        <AlertBadge
          level="BAJO"
          count={alertCounts.BAJO}
          onClick={() => setFilterAlertLevel(filterAlertLevel === 'BAJO' ? 'ALL' : 'BAJO')}
          active={filterAlertLevel === 'BAJO'}
        />
      </div>

      {/* Filters (más compacto) */}
      <div className="bg-white dark:bg-navy-900 rounded-lg border border-slate-200 dark:border-navy-700 p-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar guía, teléfono o ciudad..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Carrier filter */}
          <div className="flex items-center gap-2">
            <select
              value={filterTransportadora}
              onChange={(e) => setFilterTransportadora(e.target.value as CarrierName | 'ALL')}
              className="px-3 py-2 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
        {(filterAlertLevel !== 'ALL' || filterTransportadora !== 'ALL' || searchQuery || filterStatus !== 'ALL') && (
          <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-slate-200 dark:border-navy-700">
            <span className="text-xs text-slate-500">Filtros:</span>
            {filterAlertLevel !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-xs">
                {filterAlertLevel}
                <button onClick={() => setFilterAlertLevel('ALL')}>×</button>
              </span>
            )}
            {filterTransportadora !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs">
                {filterTransportadora}
                <button onClick={() => setFilterTransportadora('ALL')}>×</button>
              </span>
            )}
            {filterStatus !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs">
                {filterStatus}
                <button onClick={() => setFilterStatus('ALL')}>×</button>
              </span>
            )}
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full text-xs">
                "{searchQuery}"
                <button onClick={() => setSearchQuery('')}>×</button>
              </span>
            )}
            <button
              onClick={() => {
                setFilterAlertLevel('ALL');
                setFilterTransportadora('ALL');
                setFilterStatus('ALL');
                setSearchQuery('');
              }}
              className="text-xs text-slate-500 hover:text-slate-700 underline"
            >
              Limpiar
            </button>
          </div>
        )}
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>
          Mostrando {filteredGuias.length} de {guiasRetrasadas.length} guías
        </span>
        <span className="text-slate-400">
          Click en una guía para ver detalles
        </span>
      </div>

      {/* Shipment list */}
      <div className="space-y-2">
        {filteredGuias.map((gr) => (
          expandedGuia === gr.guia.id ? (
            <ExpandedGuiaCard
              key={gr.guia.id}
              guiaRetrasada={gr}
              onCollapse={() => setExpandedGuia(null)}
            />
          ) : (
            <CompactGuiaRow
              key={gr.guia.id}
              guiaRetrasada={gr}
              onExpand={() => setExpandedGuia(gr.guia.id)}
            />
          )
        ))}

        {filteredGuias.length === 0 && (
          <div className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-700 p-8 text-center">
            {guiasRetrasadas.length === 0 ? (
              <>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Check className="w-6 h-6 text-green-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">
                  ¡Todo en orden!
                </h3>
                <p className="text-slate-500 text-sm">No hay guías retrasadas</p>
              </>
            ) : (
              <>
                <div className="w-12 h-12 bg-slate-100 dark:bg-navy-800 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Search className="w-6 h-6 text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">
                  Sin resultados
                </h3>
                <p className="text-slate-500 text-sm mb-3">
                  No se encontraron guías con los filtros seleccionados
                </p>
                <button
                  onClick={() => {
                    setFilterAlertLevel('ALL');
                    setFilterTransportadora('ALL');
                    setFilterStatus('ALL');
                    setSearchQuery('');
                  }}
                  className="text-emerald-500 hover:text-emerald-600 font-medium text-sm"
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
