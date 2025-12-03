import React, { useState, useMemo } from 'react';
import {
  FileBarChart,
  Package,
  CheckCircle,
  Truck,
  AlertTriangle,
  Clock,
  Bot,
  Download,
  RefreshCw,
  ChevronRight,
  X,
  TrendingUp,
  TrendingDown,
  Minus,
  MapPin,
  Phone,
  MessageCircle,
  BarChart3,
  Activity,
  FileSpreadsheet,
} from 'lucide-react';
import { Shipment, ShipmentStatus, CarrierName } from '../../types';
import { ReporteIA, PatronDetectado, GuiaRetrasada } from '../../types/logistics';
import { detectarPatrones, detectarGuiasRetrasadas } from '../../utils/patternDetection';

interface ReporteIATabProps {
  shipments: Shipment[];
}

// Modal to show shipments
const GuiasModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  guias: Shipment[];
}> = ({ isOpen, onClose, title, guias }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-navy-900 rounded-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden shadow-2xl">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-navy-700 flex items-center justify-between">
          <h3 className="font-bold text-lg text-slate-800 dark:text-white">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-navy-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
          {guias.length === 0 ? (
            <p className="text-center text-slate-500 py-8">No hay guías en esta categoría</p>
          ) : (
            <div className="space-y-3">
              {guias.map((guia) => (
                <div
                  key={guia.id}
                  className="bg-slate-50 dark:bg-navy-950 rounded-xl p-4 border border-slate-200 dark:border-navy-700"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-white">{guia.id}</p>
                      <p className="text-sm text-slate-500 flex items-center gap-1">
                        <Truck className="w-3 h-3" />
                        {guia.carrier}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-bold ${
                        guia.status === ShipmentStatus.DELIVERED
                          ? 'bg-emerald-100 text-emerald-700'
                          : guia.status === ShipmentStatus.ISSUE
                            ? 'bg-red-100 text-red-700'
                            : guia.status === ShipmentStatus.IN_OFFICE
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {guia.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    {guia.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {guia.phone}
                      </span>
                    )}
                    {guia.detailedInfo?.destination && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {guia.detailedInfo.destination}
                      </span>
                    )}
                    {guia.detailedInfo?.daysInTransit && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {guia.detailedInfo.daysInTransit} días
                      </span>
                    )}
                  </div>

                  {guia.phone && (
                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-navy-700">
                      <button
                        onClick={() => {
                          const msg = encodeURIComponent(
                            `Hola! Le escribo de Litper sobre su pedido con guía ${guia.id}.`
                          );
                          window.open(`https://wa.me/57${guia.phone}?text=${msg}`, '_blank');
                        }}
                        className="flex items-center gap-2 px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600 transition-colors"
                      >
                        <MessageCircle className="w-3 h-3" />
                        WhatsApp
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Metric card component
const MetricCard: React.FC<{
  value: number;
  label: string;
  icon: React.ElementType;
  color: string;
  onClick: () => void;
}> = ({ value, label, icon: Icon, color, onClick }) => {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-600',
    amber: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-600',
    orange: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-600',
    red: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600',
  };

  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-xl border ${colorClasses[color]} transition-all hover:shadow-md hover:scale-105 text-center`}
    >
      <Icon className={`w-6 h-6 mx-auto mb-2 ${colorClasses[color].split(' ').pop()}`} />
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{label}</p>
    </button>
  );
};

export const ReporteIATab: React.FC<ReporteIATabProps> = ({ shipments }) => {
  const [selectedGuias, setSelectedGuias] = useState<Shipment[]>([]);
  const [modalTitle, setModalTitle] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Calculate stats
  const stats = useMemo(() => {
    const total = shipments.length;
    const delivered = shipments.filter((s) => s.status === ShipmentStatus.DELIVERED).length;
    const inTransit = shipments.filter((s) => s.status === ShipmentStatus.IN_TRANSIT).length;
    const inOffice = shipments.filter((s) => s.status === ShipmentStatus.IN_OFFICE).length;
    const issues = shipments.filter((s) => s.status === ShipmentStatus.ISSUE).length;
    const pending = shipments.filter((s) => s.status === ShipmentStatus.PENDING).length;

    return {
      total,
      delivered,
      inTransit,
      inOffice,
      issues,
      pending,
      deliveryRate: total > 0 ? (delivered / total) * 100 : 0,
    };
  }, [shipments]);

  // Get delayed shipments
  const guiasRetrasadas = useMemo(() => {
    return detectarGuiasRetrasadas(shipments);
  }, [shipments]);

  // Get patterns
  const patrones = useMemo(() => {
    return detectarPatrones(shipments);
  }, [shipments]);

  // Calculate carrier performance
  const carrierPerformance = useMemo(() => {
    const byCarrier: Record<
      string,
      { total: number; delivered: number; avgDays: number; daysSum: number }
    > = {};

    shipments.forEach((s) => {
      if (!byCarrier[s.carrier]) {
        byCarrier[s.carrier] = { total: 0, delivered: 0, avgDays: 0, daysSum: 0 };
      }
      byCarrier[s.carrier].total++;
      if (s.status === ShipmentStatus.DELIVERED) {
        byCarrier[s.carrier].delivered++;
      }
      byCarrier[s.carrier].daysSum += s.detailedInfo?.daysInTransit || 0;
    });

    return Object.entries(byCarrier)
      .map(([name, data]) => ({
        name,
        total: data.total,
        delivered: data.delivered,
        rate: data.total > 0 ? (data.delivered / data.total) * 100 : 0,
        avgDays: data.total > 0 ? data.daysSum / data.total : 0,
      }))
      .sort((a, b) => b.rate - a.rate);
  }, [shipments]);

  // Prioritized actions
  const acciones = useMemo(() => {
    const acc: Array<{
      prioridad: 1 | 2 | 3;
      titulo: string;
      descripcion: string;
      guias: Shipment[];
      accion: string;
    }> = [];

    // Priority 1: Issues
    const guiasConNovedad = shipments.filter((s) => s.status === ShipmentStatus.ISSUE);
    if (guiasConNovedad.length > 0) {
      acc.push({
        prioridad: 1,
        titulo: `Resolver ${guiasConNovedad.length} novedades urgentes`,
        descripcion: 'Guías con problemas reportados que requieren atención inmediata',
        guias: guiasConNovedad,
        accion: 'Contactar cliente y transportadora',
      });
    }

    // Priority 2: In office
    const enOficina = shipments.filter((s) => s.status === ShipmentStatus.IN_OFFICE);
    if (enOficina.length > 0) {
      acc.push({
        prioridad: 2,
        titulo: `Contactar ${enOficina.length} clientes con guía en oficina`,
        descripcion: 'Guías esperando ser recogidas por el cliente',
        guias: enOficina,
        accion: 'Enviar recordatorio de retiro',
      });
    }

    // Priority 3: Critical delays
    const criticas = guiasRetrasadas.filter((g) => g.nivelAlerta === 'CRITICO');
    if (criticas.length > 0) {
      acc.push({
        prioridad: 3,
        titulo: `Monitorear ${criticas.length} guías críticas (+5 días)`,
        descripcion: 'Posible pérdida de paquete',
        guias: criticas.map((g) => g.guia),
        accion: 'Escalar con transportadora',
      });
    }

    return acc;
  }, [shipments, guiasRetrasadas]);

  // Handle metric click
  const handleMetricClick = (status: ShipmentStatus | 'ALL') => {
    if (status === 'ALL') {
      setSelectedGuias(shipments);
      setModalTitle('Todas las Guías');
    } else {
      const filtered = shipments.filter((s) => s.status === status);
      setSelectedGuias(filtered);
      setModalTitle(`Guías: ${status}`);
    }
    setIsModalOpen(true);
  };

  // Generate executive summary
  const resumenEjecutivo = useMemo(() => {
    const criticas = guiasRetrasadas.filter((g) => g.nivelAlerta === 'CRITICO').length;
    const issues = shipments.filter((s) => s.status === ShipmentStatus.ISSUE).length;

    if (stats.total === 0) {
      return 'No hay guías cargadas para generar reporte.';
    }

    let summary = `De ${stats.total} guías activas, ${stats.delivered} (${stats.deliveryRate.toFixed(0)}%) están entregadas.`;

    if (criticas > 0 || issues > 0) {
      summary += ` Se detectaron ${criticas + issues} guías que requieren atención inmediata.`;
    }

    if (stats.deliveryRate >= 80) {
      summary += ' El rendimiento general es excelente.';
    } else if (stats.deliveryRate >= 60) {
      summary += ' El rendimiento general es aceptable pero puede mejorar.';
    } else {
      summary += ' El rendimiento general está por debajo del objetivo.';
    }

    return summary;
  }, [stats, guiasRetrasadas, shipments]);

  if (shipments.length === 0) {
    return (
      <div className="bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-700 p-12 text-center">
        <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileBarChart className="w-10 h-10 text-blue-500" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
          Sin datos para reportar
        </h3>
        <p className="text-slate-500 dark:text-slate-400 mb-4">
          Carga guías en la pestaña de Inicio para generar el reporte IA
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
            <FileBarChart className="w-8 h-8 text-blue-500" />
            Reporte IA
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Generado: {new Date().toLocaleDateString('es-CO')} {new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-navy-800 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-navy-700 transition-colors">
            <Download className="w-4 h-4" />
            Exportar PDF
          </button>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-6">
        <h3 className="font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
          <Bot className="w-5 h-5 text-blue-500" />
          Resumen Ejecutivo
        </h3>
        <p className="text-slate-700 dark:text-slate-300">{resumenEjecutivo}</p>
      </div>

      {/* Key Metrics */}
      <div>
        <h3 className="font-bold text-slate-700 dark:text-white mb-3 text-sm flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          MÉTRICAS CLAVE (Click para ver guías)
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <MetricCard
            value={stats.total}
            label="TOTAL"
            icon={Package}
            color="blue"
            onClick={() => handleMetricClick('ALL' as any)}
          />
          <MetricCard
            value={stats.delivered}
            label="ENTREGADO"
            icon={CheckCircle}
            color="emerald"
            onClick={() => handleMetricClick(ShipmentStatus.DELIVERED)}
          />
          <MetricCard
            value={stats.inTransit}
            label="EN CAMINO"
            icon={Truck}
            color="amber"
            onClick={() => handleMetricClick(ShipmentStatus.IN_TRANSIT)}
          />
          <MetricCard
            value={stats.inOffice}
            label="EN OFICINA"
            icon={MapPin}
            color="orange"
            onClick={() => handleMetricClick(ShipmentStatus.IN_OFFICE)}
          />
          <MetricCard
            value={stats.issues}
            label="NOVEDAD"
            icon={AlertTriangle}
            color="red"
            onClick={() => handleMetricClick(ShipmentStatus.ISSUE)}
          />
          <MetricCard
            value={stats.pending}
            label="PENDIENTE"
            icon={Clock}
            color="blue"
            onClick={() => handleMetricClick(ShipmentStatus.PENDING)}
          />
        </div>
      </div>

      {/* Priority Actions */}
      {acciones.length > 0 && (
        <div>
          <h3 className="font-bold text-slate-700 dark:text-white mb-3 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            ACCIONES PRIORITARIAS
          </h3>
          <div className="space-y-3">
            {acciones.map((accion, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setSelectedGuias(accion.guias);
                  setModalTitle(accion.titulo);
                  setIsModalOpen(true);
                }}
                className={`w-full text-left p-4 rounded-xl border transition-all hover:shadow-md ${
                  accion.prioridad === 1
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    : accion.prioridad === 2
                      ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
                      : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-lg ${
                        accion.prioridad === 1 ? '🔴' : accion.prioridad === 2 ? '🟠' : '🟡'
                      }`}
                    >
                      {accion.prioridad === 1 ? '🔴' : accion.prioridad === 2 ? '🟠' : '🟡'}
                    </span>
                    <div>
                      <p className="font-bold text-slate-800 dark:text-white">{accion.titulo}</p>
                      <p className="text-sm text-slate-500">{accion.descripcion}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Carrier Performance */}
      {carrierPerformance.length > 0 && (
        <div>
          <h3 className="font-bold text-slate-700 dark:text-white mb-3 text-sm flex items-center gap-2">
            <Truck className="w-4 h-4" />
            RENDIMIENTO POR TRANSPORTADORA
          </h3>
          <div className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-navy-950">
                  <tr>
                    <th className="px-4 py-3 text-left font-bold text-slate-600 dark:text-slate-400">
                      Transportadora
                    </th>
                    <th className="px-4 py-3 text-center font-bold text-slate-600 dark:text-slate-400">
                      Total
                    </th>
                    <th className="px-4 py-3 text-center font-bold text-slate-600 dark:text-slate-400">
                      Entregadas
                    </th>
                    <th className="px-4 py-3 text-center font-bold text-slate-600 dark:text-slate-400">
                      Tasa Éxito
                    </th>
                    <th className="px-4 py-3 text-center font-bold text-slate-600 dark:text-slate-400">
                      Días Prom.
                    </th>
                    <th className="px-4 py-3 text-center font-bold text-slate-600 dark:text-slate-400">
                      Tendencia
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {carrierPerformance.map((carrier) => (
                    <tr
                      key={carrier.name}
                      className="border-t border-slate-100 dark:border-navy-700"
                    >
                      <td className="px-4 py-3 font-medium text-slate-800 dark:text-white">
                        {carrier.name}
                      </td>
                      <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-400">
                        {carrier.total}
                      </td>
                      <td className="px-4 py-3 text-center text-emerald-600">{carrier.delivered}</td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`font-bold ${
                            carrier.rate >= 80
                              ? 'text-emerald-600'
                              : carrier.rate >= 60
                                ? 'text-yellow-600'
                                : 'text-red-600'
                          }`}
                        >
                          {carrier.rate.toFixed(0)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-400">
                        {carrier.avgDays.toFixed(1)}d
                      </td>
                      <td className="px-4 py-3 text-center">
                        {carrier.rate >= 80 ? (
                          <TrendingUp className="w-4 h-4 text-emerald-500 mx-auto" />
                        ) : carrier.rate >= 60 ? (
                          <Minus className="w-4 h-4 text-slate-400 mx-auto" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-500 mx-auto" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Detected Patterns */}
      {patrones.length > 0 && (
        <div>
          <h3 className="font-bold text-slate-700 dark:text-white mb-3 text-sm flex items-center gap-2">
            <Activity className="w-4 h-4" />
            PATRONES DETECTADOS
          </h3>
          <div className="space-y-3">
            {patrones.slice(0, 4).map((patron) => (
              <div
                key={patron.id}
                className={`p-4 rounded-xl border ${
                  patron.impacto === 'CRITICO'
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    : patron.impacto === 'ALTO'
                      ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
                      : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-lg">
                    {patron.impacto === 'CRITICO'
                      ? '🔴'
                      : patron.impacto === 'ALTO'
                        ? '🟠'
                        : '🟡'}
                  </span>
                  <div className="flex-1">
                    <p className="font-bold text-slate-800 dark:text-white">{patron.titulo}</p>
                    <p className="text-sm text-slate-500 mb-2">{patron.descripcion}</p>
                    <div className="flex items-center gap-2">
                      <ChevronRight className="w-4 h-4 text-amber-500" />
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        {patron.recomendacion}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      <GuiasModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalTitle}
        guias={selectedGuias}
      />
    </div>
  );
};

export default ReporteIATab;
