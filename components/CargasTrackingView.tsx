import React, { useState, useMemo, useCallback } from 'react';
import {
  Package,
  Trash2,
  ChevronDown,
  ChevronUp,
  Phone,
  Truck,
  MapPin,
  Clock,
  Calendar,
  ArrowRight,
  Copy,
  Check,
  MessageCircle,
  Search,
  Filter,
  AlertCircle,
  FileSpreadsheet,
  X,
  History,
  ExternalLink,
} from 'lucide-react';
import { Shipment, ShipmentStatus, CarrierName, ShipmentEvent } from '../types';
import { HojaCarga } from '../services/globalStorageService';

// =====================================
// INTERFACES
// =====================================

interface CargasTrackingViewProps {
  hojas: HojaCarga[];
  onDeleteHoja: (hojaId: string) => void;
  onDeleteGuia: (hojaId: string, guiaId: string) => void;
  onRestoreHoja?: (hoja: HojaCarga) => void;
}

interface GuiaConEstados {
  guia: Shipment;
  ultimosEstados: ShipmentEvent[];
  todosLosEstados: ShipmentEvent[];
}

// =====================================
// UTILIDADES DE COLOR Y ESTADO
// =====================================

const getStatusColor = (status: string): { bg: string; text: string; border: string } => {
  const statusLower = status.toLowerCase();

  if (statusLower.includes('entregado') || statusLower === 'delivered' || status === ShipmentStatus.DELIVERED) {
    return { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', border: 'border-green-300 dark:border-green-700' };
  }
  if (statusLower.includes('tránsito') || statusLower.includes('transito') || statusLower.includes('reparto') || status === ShipmentStatus.IN_TRANSIT) {
    return { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-300 dark:border-blue-700' };
  }
  if (statusLower.includes('oficina') || status === ShipmentStatus.IN_OFFICE) {
    return { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400', border: 'border-purple-300 dark:border-purple-700' };
  }
  if (statusLower.includes('novedad') || statusLower.includes('rechazado') || statusLower.includes('devuelto') || statusLower.includes('problema') || status === ShipmentStatus.ISSUE) {
    return { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', border: 'border-red-300 dark:border-red-700' };
  }
  if (statusLower.includes('pendiente') || status === ShipmentStatus.PENDING) {
    return { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', border: 'border-yellow-300 dark:border-yellow-700' };
  }
  return { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-400', border: 'border-gray-300 dark:border-gray-700' };
};

const getStatusIcon = (status: string): string => {
  const statusLower = status.toLowerCase();

  if (statusLower.includes('entregado') || statusLower === 'delivered') return '✅';
  if (statusLower.includes('tránsito') || statusLower.includes('transito') || statusLower.includes('reparto')) return '🚚';
  if (statusLower.includes('oficina')) return '🏢';
  if (statusLower.includes('novedad') || statusLower.includes('rechazado') || statusLower.includes('devuelto') || statusLower.includes('problema')) return '⚠️';
  if (statusLower.includes('pendiente')) return '⏳';
  return '📦';
};

const formatDateTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDateShort = (dateStr: string): string => {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
};

// =====================================
// MODAL DE CONFIRMACIÓN PARA ELIMINAR CARGA
// =====================================

const DeleteConfirmModal: React.FC<{
  isOpen: boolean;
  hojaName: string;
  guiaCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ isOpen, hojaName, guiaCount, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-navy-900 rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 animate-in fade-in zoom-in duration-200">
        <div className="text-center">
          {/* Icon */}
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>

          {/* Title */}
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
            Eliminar Carga Completa
          </h3>

          {/* Message */}
          <p className="text-slate-600 dark:text-slate-400 mb-2">
            ¿Estás seguro de eliminar esta carga?
          </p>
          <p className="text-sm bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 px-4 py-2 rounded-lg mb-6">
            <strong>"{hojaName}"</strong>
            <br />
            Se eliminarán <strong>{guiaCount.toLocaleString()}</strong> guías de esta carga
          </p>

          {/* Buttons */}
          <div className="flex gap-3 justify-center">
            <button
              onClick={onCancel}
              className="px-6 py-2.5 bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-navy-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className="px-6 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// =====================================
// BADGE DE ESTADO
// =====================================

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const colors = getStatusColor(status);
  const icon = getStatusIcon(status);

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${colors.bg} ${colors.text} border ${colors.border}`}>
      <span>{icon}</span>
      <span className="truncate max-w-[100px]">{status}</span>
    </span>
  );
};

// =====================================
// VISTA DE ÚLTIMOS 2 ESTADOS (SUBFILA)
// =====================================

const UltimosEstadosView: React.FC<{
  estados: ShipmentEvent[];
}> = ({ estados }) => {
  if (estados.length === 0) {
    return (
      <div className="text-xs text-slate-400 italic py-1">
        Sin eventos registrados
      </div>
    );
  }

  return (
    <div className="space-y-1 py-1">
      {estados.slice(0, 2).map((evento, idx) => (
        <div
          key={idx}
          className={`flex items-start gap-2 text-xs ${
            idx === 0
              ? 'text-emerald-700 dark:text-emerald-400 font-medium'
              : 'text-slate-500 dark:text-slate-500'
          }`}
        >
          <span className={`flex-shrink-0 w-1.5 h-1.5 rounded-full mt-1.5 ${
            idx === 0 ? 'bg-emerald-500' : 'bg-slate-400'
          }`} />
          <div className="flex-1 min-w-0">
            <span className="font-mono text-[10px] mr-2 opacity-70">
              {formatDateShort(evento.date)}
            </span>
            <span className="truncate">{evento.description}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

// =====================================
// TIMELINE COMPLETO (VISTA EXPANDIDA)
// =====================================

const TimelineCompleto: React.FC<{
  eventos: ShipmentEvent[];
  guiaId: string;
}> = ({ eventos, guiaId }) => {
  if (eventos.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <History className="w-8 h-8 mx-auto mb-2 text-slate-400" />
        <p className="text-sm">No hay historial de movimientos</p>
      </div>
    );
  }

  return (
    <div className="relative pl-4">
      {/* Línea vertical del timeline */}
      <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-emerald-400 via-blue-400 to-slate-300 dark:from-emerald-600 dark:via-blue-600 dark:to-slate-600" />

      <div className="space-y-3">
        {eventos.map((evento, idx) => (
          <div key={`${guiaId}-${idx}`} className="relative flex items-start gap-3">
            {/* Punto del timeline */}
            <div className={`relative z-10 flex-shrink-0 w-4 h-4 rounded-full border-2 ${
              idx === 0
                ? 'bg-emerald-500 border-emerald-300 dark:border-emerald-700 shadow-lg shadow-emerald-500/30'
                : 'bg-white dark:bg-navy-900 border-slate-300 dark:border-slate-600'
            }`} />

            {/* Contenido del evento */}
            <div className={`flex-1 pb-3 ${
              idx === 0
                ? 'bg-gradient-to-r from-emerald-50 to-transparent dark:from-emerald-900/20 dark:to-transparent -ml-1 pl-2 rounded-lg'
                : ''
            }`}>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-mono ${
                  idx === 0
                    ? 'text-emerald-700 dark:text-emerald-400 font-bold'
                    : 'text-slate-500 dark:text-slate-500'
                }`}>
                  {formatDateShort(evento.date)}
                </span>
                {idx === 0 && (
                  <span className="px-1.5 py-0.5 bg-emerald-500 text-white text-[10px] font-bold rounded">
                    ÚLTIMO
                  </span>
                )}
              </div>

              <p className={`text-sm ${
                idx === 0
                  ? 'text-emerald-800 dark:text-emerald-300 font-medium'
                  : 'text-slate-700 dark:text-slate-300'
              }`}>
                {evento.description}
              </p>

              {evento.location && evento.location !== 'Ubicación Logística' && (
                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {evento.location}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// =====================================
// FILA DE GUÍA INDIVIDUAL
// =====================================

const GuiaRow: React.FC<{
  guia: GuiaConEstados;
  onDelete: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}> = ({ guia, onDelete, isExpanded, onToggleExpand }) => {
  const [copiedGuia, setCopiedGuia] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  const shipment = guia.guia;
  const origen = shipment.detailedInfo?.origin || 'Colombia';
  const destino = shipment.detailedInfo?.destination || 'Desconocido';
  const dias = shipment.detailedInfo?.daysInTransit || 0;

  const handleCopyGuia = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(shipment.id);
    setCopiedGuia(true);
    setTimeout(() => setCopiedGuia(false), 1500);
  };

  const handleCopyPhone = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (shipment.phone) {
      navigator.clipboard.writeText(shipment.phone);
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 1500);
    }
  };

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (shipment.phone) {
      const message = encodeURIComponent(
        `Hola! Le escribo sobre su pedido con guía ${shipment.id}. Estado actual: ${shipment.status}. ¿Podemos coordinar la entrega?`
      );
      window.open(`https://wa.me/57${shipment.phone}?text=${message}`, '_blank');
    }
  };

  const handleDeleteGuia = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  return (
    <div className={`border-b border-slate-100 dark:border-navy-800 ${
      isExpanded ? 'bg-blue-50 dark:bg-blue-900/10' : 'hover:bg-slate-50 dark:hover:bg-navy-800/50'
    }`}>
      {/* Fila Principal */}
      <div
        className="px-4 py-3 cursor-pointer"
        onClick={onToggleExpand}
      >
        <div className="flex items-start gap-4">
          {/* Número de Guía */}
          <div className="flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-slate-800 dark:text-white text-sm">
                {shipment.id}
              </span>
              <button
                onClick={handleCopyGuia}
                className="p-1 hover:bg-slate-200 dark:hover:bg-navy-700 rounded transition-colors"
                title="Copiar guía"
              >
                {copiedGuia ? (
                  <Check className="w-3.5 h-3.5 text-green-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                )}
              </button>
            </div>
          </div>

          {/* Teléfono */}
          <div className="flex-shrink-0 min-w-[140px]">
            {shipment.phone ? (
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-mono text-xs text-slate-600 dark:text-slate-400">
                  {shipment.phone}
                </span>
                <button
                  onClick={handleCopyPhone}
                  className="p-0.5 hover:bg-slate-200 dark:hover:bg-navy-700 rounded"
                >
                  {copiedPhone ? (
                    <Check className="w-3 h-3 text-green-500" />
                  ) : (
                    <Copy className="w-3 h-3 text-slate-400" />
                  )}
                </button>
                <button
                  onClick={handleWhatsApp}
                  className="p-1 bg-green-500 text-white rounded hover:bg-green-600"
                  title="WhatsApp"
                >
                  <MessageCircle className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <span className="text-xs text-slate-400 italic flex items-center gap-1">
                <Phone className="w-3 h-3" />
                Sin teléfono
              </span>
            )}
          </div>

          {/* Transportadora */}
          <div className="hidden md:flex items-center gap-1.5 flex-shrink-0 min-w-[120px]">
            <Truck className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-600 dark:text-slate-400 truncate">
              {shipment.carrier}
            </span>
          </div>

          {/* Estado */}
          <div className="flex-shrink-0">
            <StatusBadge status={shipment.status} />
          </div>

          {/* Ruta */}
          <div className="hidden lg:flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 flex-shrink-0">
            <span className="truncate max-w-[80px]">{origen}</span>
            <ArrowRight className="w-3 h-3 text-slate-400 flex-shrink-0" />
            <span className="truncate max-w-[80px]">{destino}</span>
          </div>

          {/* Días */}
          <div className="flex-shrink-0">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
              dias > 5 ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400' :
              dias > 3 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400' :
              dias > 1 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400' :
              'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400'
            }`}>
              <Clock className="w-3 h-3" />
              {dias}d
            </span>
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Botón eliminar guía individual (sin confirmación) */}
            <button
              onClick={handleDeleteGuia}
              className="p-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
              title="Eliminar guía"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {/* Botón expandir */}
            <button
              onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}
              className="p-1.5 bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 rounded hover:bg-slate-200 dark:hover:bg-navy-700"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Subfila: Últimos 2 Estados (siempre visible) */}
        <div className="mt-2 ml-0 md:ml-4 border-l-2 border-slate-200 dark:border-navy-700 pl-3">
          <UltimosEstadosView estados={guia.ultimosEstados} />
        </div>
      </div>

      {/* Vista Expandida: Timeline Completo */}
      {isExpanded && (
        <div className="px-4 pb-4 bg-slate-50 dark:bg-navy-950 border-t border-slate-200 dark:border-navy-700">
          <div className="pt-4">
            <div className="flex items-center gap-2 mb-4">
              <History className="w-4 h-4 text-blue-500" />
              <h4 className="font-bold text-slate-800 dark:text-white text-sm">
                Historial Completo de Movimientos
              </h4>
              <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs rounded-full">
                {guia.todosLosEstados.length} eventos
              </span>
            </div>
            <TimelineCompleto eventos={guia.todosLosEstados} guiaId={shipment.id} />
          </div>
        </div>
      )}
    </div>
  );
};

// =====================================
// SECCIÓN DE UNA CARGA (HOJA)
// =====================================

const CargaSection: React.FC<{
  hoja: HojaCarga;
  onDeleteHoja: () => void;
  onDeleteGuia: (guiaId: string) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}> = ({ hoja, onDeleteHoja, onDeleteGuia, isExpanded, onToggleExpand }) => {
  const [expandedGuiaId, setExpandedGuiaId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Procesar guías con sus estados
  const guiasConEstados: GuiaConEstados[] = useMemo(() => {
    return hoja.guias.map(guia => {
      const eventos = guia.detailedInfo?.events || [];
      const eventosOrdenados = [...eventos].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      return {
        guia,
        ultimosEstados: eventosOrdenados.slice(0, 2),
        todosLosEstados: eventosOrdenados,
      };
    });
  }, [hoja.guias]);

  // Filtrar guías
  const guiasFiltradas = useMemo(() => {
    if (!searchQuery) return guiasConEstados;

    const query = searchQuery.toLowerCase();
    return guiasConEstados.filter(g =>
      g.guia.id.toLowerCase().includes(query) ||
      g.guia.phone?.includes(query) ||
      g.guia.carrier.toLowerCase().includes(query) ||
      g.guia.detailedInfo?.destination?.toLowerCase().includes(query)
    );
  }, [guiasConEstados, searchQuery]);

  // Estadísticas rápidas
  const stats = useMemo(() => {
    const total = hoja.guias.length;
    const entregados = hoja.guias.filter(g => g.status === ShipmentStatus.DELIVERED).length;
    const novedades = hoja.guias.filter(g => g.status === ShipmentStatus.ISSUE).length;
    const enTransito = hoja.guias.filter(g => g.status === ShipmentStatus.IN_TRANSIT).length;

    return { total, entregados, novedades, enTransito };
  }, [hoja.guias]);

  const handleConfirmDelete = () => {
    setShowDeleteModal(false);
    onDeleteHoja();
  };

  return (
    <div className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-700 overflow-hidden shadow-sm">
      {/* Header de la Carga */}
      <div
        className="bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 px-4 py-3 cursor-pointer"
        onClick={onToggleExpand}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <FileSpreadsheet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">
                {hoja.nombre}
              </h3>
              <div className="flex items-center gap-3 text-indigo-100 text-xs mt-0.5">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDateTime(hoja.fechaCreacion)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Stats rápidas */}
            <div className="hidden md:flex items-center gap-2">
              <span className="px-2 py-1 bg-white/20 rounded-full text-xs text-white font-medium">
                {stats.total} guías
              </span>
              <span className="px-2 py-1 bg-green-500/30 rounded-full text-xs text-white font-medium">
                {stats.entregados} entregados
              </span>
              {stats.novedades > 0 && (
                <span className="px-2 py-1 bg-red-500/30 rounded-full text-xs text-white font-medium">
                  {stats.novedades} novedades
                </span>
              )}
            </div>

            {/* Botón eliminar carga */}
            <button
              onClick={(e) => { e.stopPropagation(); setShowDeleteModal(true); }}
              className="p-2 bg-white/10 hover:bg-red-500 text-white rounded-lg transition-colors"
              title="Eliminar carga completa"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {/* Botón expandir/colapsar */}
            <button
              onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}
              className="p-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Contenido expandido */}
      {isExpanded && (
        <div>
          {/* Barra de búsqueda */}
          <div className="px-4 py-3 bg-slate-50 dark:bg-navy-950 border-b border-slate-200 dark:border-navy-700">
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar guía, teléfono, ciudad..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <span className="text-xs text-slate-500">
                {guiasFiltradas.length} de {hoja.guias.length} guías
              </span>
            </div>
          </div>

          {/* Lista de guías */}
          <div className="max-h-[600px] overflow-y-auto">
            {guiasFiltradas.length === 0 ? (
              <div className="p-8 text-center">
                <Search className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-slate-500">No se encontraron guías</p>
              </div>
            ) : (
              guiasFiltradas.map((guia) => (
                <GuiaRow
                  key={guia.guia.id}
                  guia={guia}
                  onDelete={() => onDeleteGuia(guia.guia.id)}
                  isExpanded={expandedGuiaId === guia.guia.id}
                  onToggleExpand={() => setExpandedGuiaId(
                    expandedGuiaId === guia.guia.id ? null : guia.guia.id
                  )}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* Modal de confirmación */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        hojaName={hoja.nombre}
        guiaCount={hoja.cantidadGuias}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
};

// =====================================
// COMPONENTE PRINCIPAL
// =====================================

export const CargasTrackingView: React.FC<CargasTrackingViewProps> = ({
  hojas,
  onDeleteHoja,
  onDeleteGuia,
  onRestoreHoja,
}) => {
  const [expandedHojaId, setExpandedHojaId] = useState<string | null>(
    hojas.length > 0 ? hojas[0].id : null
  );

  // Ordenar hojas por fecha (más reciente primero)
  const hojasOrdenadas = useMemo(() => {
    return [...hojas].sort((a, b) =>
      new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime()
    );
  }, [hojas]);

  if (hojas.length === 0) {
    return (
      <div className="bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-700 p-12 text-center">
        <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileSpreadsheet className="w-10 h-10 text-indigo-500" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
          No hay cargas registradas
        </h3>
        <p className="text-slate-500 dark:text-slate-400">
          Carga un archivo Excel para crear tu primera hoja de seguimiento
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
            <Package className="w-6 h-6 text-indigo-500" />
            Seguimiento por Cargas
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {hojas.length} cargas • Ordenadas por fecha de carga (más reciente arriba)
          </p>
        </div>
      </div>

      {/* Lista de Cargas */}
      <div className="space-y-4">
        {hojasOrdenadas.map((hoja) => (
          <CargaSection
            key={hoja.id}
            hoja={hoja}
            onDeleteHoja={() => onDeleteHoja(hoja.id)}
            onDeleteGuia={(guiaId) => onDeleteGuia(hoja.id, guiaId)}
            isExpanded={expandedHojaId === hoja.id}
            onToggleExpand={() => setExpandedHojaId(
              expandedHojaId === hoja.id ? null : hoja.id
            )}
          />
        ))}
      </div>
    </div>
  );
};

export default CargasTrackingView;
