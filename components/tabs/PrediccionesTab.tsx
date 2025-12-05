import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Target,
  Search,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle,
  Bot,
  FileSpreadsheet,
  Truck,
  MapPin,
  BarChart3,
  Percent,
  Clock,
  Package,
  RefreshCw,
  ChevronRight,
  Lightbulb,
  Shield,
  XCircle,
  Activity,
  Brain,
  Zap,
  Calendar,
  Sun,
  Cloud,
  Snowflake,
  Flame,
  AlertCircle,
  MessageSquare,
  Send,
  Database,
  Cpu,
  LineChart,
  PieChart,
  ArrowRight,
  Eye,
  History,
  Settings,
  Sparkles,
  X,
  Phone,
  User,
  Hash,
  FileText,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Info,
  Star,
  TrendingUp as TrendUp,
} from 'lucide-react';
import { Shipment, ShipmentStatus, CarrierName } from '../../types';
import {
  AnalisisPrediccion,
  PatronDetectado,
  CiudadSemaforo,
  SemaforoExcelData,
  STORAGE_KEYS,
  AlertLevel,
  GuiaRetrasada,
} from '../../types/logistics';
import {
  detectarPatrones,
  generarPrediccion,
  procesarExcelParaSemaforo,
  detectarGuiasRetrasadas,
  calcularDiasSinMovimiento,
} from '../../utils/patternDetection';
import { loadTabData, saveTabData } from '../../utils/tabStorage';

interface PrediccionesTabProps {
  shipments: Shipment[];
}

// Colombian holidays 2025-2026
const FESTIVOS_COLOMBIA = [
  '2025-01-01', '2025-01-06', '2025-03-24', '2025-04-17', '2025-04-18',
  '2025-05-01', '2025-06-02', '2025-06-23', '2025-06-30', '2025-07-20',
  '2025-08-07', '2025-08-18', '2025-10-13', '2025-11-03', '2025-11-17',
  '2025-12-08', '2025-12-25',
  '2026-01-01', '2026-01-12', '2026-03-23', '2026-04-02', '2026-04-03',
];

// Season impacts for Colombia
const getSeasonImpact = (date: Date): { season: string; impact: number; icon: React.ReactNode } => {
  const month = date.getMonth();
  if (month >= 10 || month <= 1) {
    return { season: 'Alta (Navidad)', impact: -15, icon: <Snowflake className="w-4 h-4 text-blue-400" /> };
  }
  if (month >= 3 && month <= 5) {
    return { season: 'Lluvias', impact: -10, icon: <Cloud className="w-4 h-4 text-slate-400" /> };
  }
  if (month >= 6 && month <= 8) {
    return { season: 'Seca', impact: 5, icon: <Sun className="w-4 h-4 text-yellow-400" /> };
  }
  return { season: 'Normal', impact: 0, icon: <Sun className="w-4 h-4 text-amber-400" /> };
};

// Day of week impact
const getDayImpact = (date: Date): { day: string; impact: number } => {
  const dayOfWeek = date.getDay();
  if (dayOfWeek === 0) return { day: 'Domingo', impact: -20 };
  if (dayOfWeek === 6) return { day: 'Sábado', impact: -10 };
  if (dayOfWeek === 1) return { day: 'Lunes', impact: -5 };
  if (dayOfWeek === 5) return { day: 'Viernes', impact: -5 };
  return { day: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][dayOfWeek], impact: 0 };
};

// Check if date is near a holiday
const isNearHoliday = (date: Date): boolean => {
  const dateStr = date.toISOString().split('T')[0];
  const threeDaysBefore = new Date(date);
  threeDaysBefore.setDate(date.getDate() - 3);
  const threeDaysAfter = new Date(date);
  threeDaysAfter.setDate(date.getDate() + 3);

  return FESTIVOS_COLOMBIA.some(holiday => {
    const h = new Date(holiday);
    return h >= threeDaysBefore && h <= threeDaysAfter;
  });
};

// Calculate ML-like prediction score
const calculateMLScore = (
  baseScore: number,
  carrier: CarrierName,
  city: string,
  historicalData?: CiudadSemaforo
): { score: number; factors: { name: string; impact: number; description: string }[] } => {
  const factors: { name: string; impact: number; description: string }[] = [];
  let score = baseScore;

  const today = new Date();

  const season = getSeasonImpact(today);
  factors.push({ name: 'Temporada', impact: season.impact, description: season.season });
  score += season.impact;

  const day = getDayImpact(today);
  factors.push({ name: 'Día de semana', impact: day.impact, description: day.day });
  score += day.impact;

  if (isNearHoliday(today)) {
    factors.push({ name: 'Festivo cercano', impact: -15, description: 'Próximo a día festivo' });
    score -= 15;
  }

  const carrierScores: Record<string, number> = {
    [CarrierName.COORDINADORA]: 8,
    [CarrierName.INTER_RAPIDISIMO]: 5,
    [CarrierName.ENVIA]: 3,
    [CarrierName.TCC]: 6,
    [CarrierName.VELOCES]: 4,
  };
  const carrierBonus = carrierScores[carrier] || 0;
  factors.push({ name: 'Transportadora', impact: carrierBonus, description: `${carrier} (histórico)` });
  score += carrierBonus;

  if (historicalData) {
    const historyBonus = Math.round((historicalData.tasaExito - 70) / 2);
    factors.push({ name: 'Histórico ruta', impact: historyBonus, description: `${historicalData.tasaExito.toFixed(0)}% éxito` });
    score += historyBonus;
  }

  const problematicCities = ['TUMACO', 'QUIBDO', 'LETICIA', 'MITÚ', 'PUERTO CARREÑO'];
  if (problematicCities.includes(city.toUpperCase())) {
    factors.push({ name: 'Zona de riesgo', impact: -20, description: 'Ciudad con alta tasa de devolución' });
    score -= 20;
  }

  return { score: Math.min(100, Math.max(0, score)), factors };
};

// Enhanced Anomaly detection with full shipment info
interface Anomaly {
  shipment: Shipment;
  type: 'NO_UPDATE' | 'STUCK_IN_TRANSIT' | 'OFFICE_TOO_LONG' | 'UNUSUAL_PATTERN';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  description: string;
  expectedBehavior: string;
  recommendation: string;
  aiRecommendation: string;
}

const detectAnomalies = (shipments: Shipment[]): Anomaly[] => {
  const anomalies: Anomaly[] = [];

  shipments.forEach(s => {
    if (s.status === ShipmentStatus.DELIVERED) return;

    const daysSinceUpdate = calcularDiasSinMovimiento(s);
    const daysInTransit = s.detailedInfo?.daysInTransit || 0;

    if (daysSinceUpdate >= 3 && s.status === ShipmentStatus.IN_TRANSIT) {
      anomalies.push({
        shipment: s,
        type: 'NO_UPDATE',
        severity: daysSinceUpdate >= 5 ? 'CRITICAL' : 'HIGH',
        description: `${daysSinceUpdate} días sin actualización en tránsito`,
        expectedBehavior: 'Actualización cada 24-48h máximo',
        recommendation: 'Contactar transportadora URGENTE. Posible pérdida.',
        aiRecommendation: generateAIRecommendation(s, 'NO_UPDATE', daysSinceUpdate),
      });
    }

    if (daysInTransit > 7 && s.status !== ShipmentStatus.DELIVERED) {
      anomalies.push({
        shipment: s,
        type: 'STUCK_IN_TRANSIT',
        severity: daysInTransit > 10 ? 'CRITICAL' : 'HIGH',
        description: `${daysInTransit} días en tránsito sin entrega`,
        expectedBehavior: 'Entrega normal: 3-5 días',
        recommendation: 'Iniciar proceso de reclamación. Alta probabilidad de pérdida.',
        aiRecommendation: generateAIRecommendation(s, 'STUCK_IN_TRANSIT', daysInTransit),
      });
    }

    if (s.status === ShipmentStatus.IN_OFFICE && daysSinceUpdate >= 3) {
      anomalies.push({
        shipment: s,
        type: 'OFFICE_TOO_LONG',
        severity: daysSinceUpdate >= 5 ? 'CRITICAL' : 'MEDIUM',
        description: `${daysSinceUpdate} días en oficina sin retiro`,
        expectedBehavior: 'Retiro en 1-2 días después de llegada a oficina',
        recommendation: 'Llamar al cliente urgente. Se devolverá automáticamente en 5 días.',
        aiRecommendation: generateAIRecommendation(s, 'OFFICE_TOO_LONG', daysSinceUpdate),
      });
    }

    if (s.status === ShipmentStatus.ISSUE && daysSinceUpdate >= 2) {
      anomalies.push({
        shipment: s,
        type: 'UNUSUAL_PATTERN',
        severity: 'HIGH',
        description: 'Guía con novedad sin gestión reciente',
        expectedBehavior: 'Novedades deben resolverse en 24-48h',
        recommendation: 'Verificar tipo de novedad y coordinar solución.',
        aiRecommendation: generateAIRecommendation(s, 'UNUSUAL_PATTERN', daysSinceUpdate),
      });
    }
  });

  const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2 };
  return anomalies.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
};

// Generate AI recommendation based on shipment data
const generateAIRecommendation = (shipment: Shipment, type: string, days: number): string => {
  const carrier = shipment.carrier;
  const destination = shipment.detailedInfo?.destination || 'destino desconocido';

  switch (type) {
    case 'NO_UPDATE':
      return `Esta guía de ${carrier} hacia ${destination} lleva ${days} días sin movimiento. Recomiendo: 1) Llamar a ${carrier} con el número de guía ${shipment.id}. 2) Si no hay respuesta en 24h, escalar a supervisor. 3) Preparar documentación para posible reclamación.`;
    case 'STUCK_IN_TRANSIT':
      return `Envío atascado por ${days} días. Para ${carrier}: 1) Verificar en sistema si hay novedad no reportada. 2) Contactar al cliente ${shipment.phone || ''} para confirmar disponibilidad. 3) Considerar cambio de transportadora para futuros envíos a ${destination}.`;
    case 'OFFICE_TOO_LONG':
      return `Paquete esperando en oficina de ${carrier} por ${days} días. Acción urgente: 1) Llamar al cliente ${shipment.phone || ''} inmediatamente. 2) Ofrecer reprogramación de entrega. 3) Si no contesta en 48h, preparar devolución controlada.`;
    case 'UNUSUAL_PATTERN':
      return `Novedad sin resolver en guía ${shipment.id}. Verificar: 1) Tipo de novedad en portal de ${carrier}. 2) Contactar cliente para resolver. 3) Documentar para análisis de patrones.`;
    default:
      return 'Revisar guía manualmente y contactar transportadora.';
  }
};

// Get top cities by shipment volume
const getTopCities = (shipments: Shipment[], semaforoData: CiudadSemaforo[]): string[] => {
  const cityCount: Record<string, number> = {};

  shipments.forEach(s => {
    const city = s.detailedInfo?.destination?.toUpperCase();
    if (city) {
      cityCount[city] = (cityCount[city] || 0) + 1;
    }
  });

  semaforoData.forEach(s => {
    const city = s.ciudad.toUpperCase();
    cityCount[city] = (cityCount[city] || 0) + s.total;
  });

  return Object.entries(cityCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([city]) => city);
};

// Smart carrier recommendation
interface CarrierRecommendation {
  carrier: CarrierName;
  score: number;
  reasons: string[];
  avgDeliveryTime: number;
  successRate: number;
  priceIndex: number;
}

const getSmartCarrierRecommendation = (
  city: string,
  historicalData: CiudadSemaforo[],
  currentShipments: Shipment[]
): CarrierRecommendation[] => {
  const recommendations: CarrierRecommendation[] = [];

  const cityData = historicalData.filter(d =>
    d.ciudad.toUpperCase().includes(city.toUpperCase())
  );

  const priceIndex: Record<string, number> = {
    [CarrierName.COORDINADORA]: 3,
    [CarrierName.INTER_RAPIDISIMO]: 2,
    [CarrierName.ENVIA]: 4,
    [CarrierName.TCC]: 3,
    [CarrierName.VELOCES]: 2,
  };

  const carriers = [CarrierName.COORDINADORA, CarrierName.INTER_RAPIDISIMO, CarrierName.ENVIA, CarrierName.TCC, CarrierName.VELOCES];

  carriers.forEach(carrier => {
    const carrierHistorical = cityData.find(d => d.transportadora.toUpperCase().includes(carrier.toUpperCase()));

    const reasons: string[] = [];
    let score = 50;

    if (carrierHistorical) {
      const successRate = carrierHistorical.tasaExito;
      score += (successRate - 70) * 0.5;
      if (successRate >= 80) reasons.push(`Alta tasa de éxito (${successRate.toFixed(0)}%)`);
      if (successRate < 60) reasons.push(`⚠️ Baja tasa de éxito (${successRate.toFixed(0)}%)`);

      const avgTime = carrierHistorical.tiempoPromedio;
      if (avgTime <= 3) {
        score += 10;
        reasons.push('Entrega rápida (≤3 días)');
      }
      if (avgTime > 5) {
        score -= 10;
        reasons.push(`⚠️ Tiempo de entrega alto (${avgTime}d)`);
      }

      recommendations.push({
        carrier,
        score: Math.min(100, Math.max(0, score)),
        reasons,
        avgDeliveryTime: avgTime,
        successRate,
        priceIndex: priceIndex[carrier] || 3,
      });
    } else {
      recommendations.push({
        carrier,
        score: 50,
        reasons: ['Sin datos históricos para esta ruta'],
        avgDeliveryTime: 5,
        successRate: 70,
        priceIndex: priceIndex[carrier] || 3,
      });
    }
  });

  return recommendations.sort((a, b) => b.score - a.score);
};

// Chat message interface
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  data?: any;
}

// Shipment Detail Modal Component
interface ShipmentDetailModalProps {
  shipment: Shipment;
  onClose: () => void;
  aiRecommendation?: string;
}

const ShipmentDetailModal: React.FC<ShipmentDetailModalProps> = ({ shipment, onClose, aiRecommendation }) => {
  const statusColors: Record<ShipmentStatus, string> = {
    [ShipmentStatus.DELIVERED]: 'bg-emerald-500',
    [ShipmentStatus.IN_TRANSIT]: 'bg-blue-500',
    [ShipmentStatus.IN_OFFICE]: 'bg-amber-500',
    [ShipmentStatus.ISSUE]: 'bg-red-500',
    [ShipmentStatus.PENDING]: 'bg-slate-500',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-navy-900 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className={`${statusColors[shipment.status]} px-6 py-4 text-white`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Package className="w-5 h-5" />
                Guía: {shipment.id}
              </h3>
              <p className="text-white/80 text-sm flex items-center gap-2 mt-1">
                <Truck className="w-4 h-4" />
                {shipment.carrier} • {shipment.status}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Info Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 dark:bg-navy-950 rounded-xl p-4">
              <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                <Hash className="w-4 h-4" />
                Número de Guía
              </div>
              <p className="font-bold text-slate-800 dark:text-white text-lg">{shipment.id}</p>
            </div>

            <div className="bg-slate-50 dark:bg-navy-950 rounded-xl p-4">
              <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                <Phone className="w-4 h-4" />
                Teléfono Cliente
              </div>
              <p className="font-bold text-slate-800 dark:text-white text-lg">
                {shipment.phone || 'No disponible'}
              </p>
              {shipment.phone && (
                <a
                  href={`https://wa.me/57${shipment.phone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-green-600 hover:underline flex items-center gap-1 mt-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  Abrir WhatsApp
                </a>
              )}
            </div>

            <div className="bg-slate-50 dark:bg-navy-950 rounded-xl p-4">
              <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                <MapPin className="w-4 h-4" />
                Origen
              </div>
              <p className="font-bold text-slate-800 dark:text-white">
                {shipment.detailedInfo?.origin || 'No disponible'}
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-navy-950 rounded-xl p-4">
              <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                <MapPin className="w-4 h-4" />
                Destino
              </div>
              <p className="font-bold text-slate-800 dark:text-white">
                {shipment.detailedInfo?.destination || 'No disponible'}
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-navy-950 rounded-xl p-4">
              <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                <Clock className="w-4 h-4" />
                Días en Tránsito
              </div>
              <p className="font-bold text-slate-800 dark:text-white text-lg">
                {shipment.detailedInfo?.daysInTransit || 0} días
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-navy-950 rounded-xl p-4">
              <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                <Calendar className="w-4 h-4" />
                Fecha Estimada
              </div>
              <p className="font-bold text-slate-800 dark:text-white">
                {shipment.detailedInfo?.estimatedDelivery || 'No disponible'}
              </p>
            </div>
          </div>

          {/* Status History */}
          {shipment.detailedInfo?.events && shipment.detailedInfo.events.length > 0 && (
            <div className="bg-slate-50 dark:bg-navy-950 rounded-xl p-4">
              <h4 className="font-bold text-slate-700 dark:text-white mb-3 flex items-center gap-2">
                <History className="w-4 h-4" />
                Historial de Estados
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {shipment.detailedInfo.events.map((event, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-3 p-2 rounded-lg ${
                      event.isRecent ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      event.isRecent ? 'bg-blue-500' : 'bg-slate-300'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-700 dark:text-white">
                        {event.description}
                      </p>
                      <p className="text-xs text-slate-500">
                        {event.date} • {event.location}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Raw Status */}
          {shipment.detailedInfo?.rawStatus && (
            <div className="bg-slate-50 dark:bg-navy-950 rounded-xl p-4">
              <h4 className="font-bold text-slate-700 dark:text-white mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Estado Completo
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                {shipment.detailedInfo.rawStatus}
              </p>
            </div>
          )}

          {/* AI Recommendation */}
          {aiRecommendation && (
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                  <Brain className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-bold text-purple-700 dark:text-purple-300 mb-2">
                    Recomendación IA Personalizada
                  </h4>
                  <p className="text-sm text-purple-800 dark:text-purple-200">
                    {aiRecommendation}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          {shipment.notes && (
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
              <h4 className="font-bold text-amber-700 dark:text-amber-300 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Notas
              </h4>
              <p className="text-sm text-amber-800 dark:text-amber-200">
                {shipment.notes}
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-200 dark:border-navy-700 px-6 py-4 flex gap-3">
          {shipment.phone && (
            <a
              href={`tel:${shipment.phone}`}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
            >
              <Phone className="w-4 h-4" />
              Llamar Cliente
            </a>
          )}
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-navy-700 transition-colors font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

// Pattern Detail Modal
interface PatternDetailModalProps {
  pattern: PatronDetectado;
  onClose: () => void;
  onSelectShipment: (shipment: Shipment) => void;
}

const PatternDetailModal: React.FC<PatternDetailModalProps> = ({ pattern, onClose, onSelectShipment }) => {
  const impactColors = {
    CRITICO: 'bg-red-500',
    ALTO: 'bg-orange-500',
    MEDIO: 'bg-yellow-500',
    BAJO: 'bg-green-500',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-navy-900 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className={`${impactColors[pattern.impacto]} px-6 py-4 text-white`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold">{pattern.titulo}</h3>
              <p className="text-white/80 text-sm mt-1">
                Impacto: {pattern.impacto} • {pattern.datosApoyo.cantidad} guías afectadas
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Description */}
          <div className="bg-slate-50 dark:bg-navy-950 rounded-xl p-4">
            <h4 className="font-bold text-slate-700 dark:text-white mb-2">Descripción del Patrón</h4>
            <p className="text-slate-600 dark:text-slate-300">{pattern.descripcion}</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-blue-600">{pattern.datosApoyo.cantidad}</p>
              <p className="text-sm text-slate-500">Guías Afectadas</p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-purple-600">{pattern.datosApoyo.porcentaje.toFixed(1)}%</p>
              <p className="text-sm text-slate-500">Del Total</p>
            </div>
          </div>

          {/* AI Recommendation */}
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
            <div className="flex items-start gap-3">
              <Brain className="w-5 h-5 text-purple-600 mt-0.5" />
              <div>
                <h4 className="font-bold text-purple-700 dark:text-purple-300 mb-1">Recomendación IA</h4>
                <p className="text-sm text-purple-800 dark:text-purple-200">{pattern.recomendacion}</p>
              </div>
            </div>
          </div>

          {/* Affected Shipments */}
          <div>
            <h4 className="font-bold text-slate-700 dark:text-white mb-3 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Guías Afectadas ({pattern.guiasAfectadas.length})
            </h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {pattern.guiasAfectadas.map((shipment, idx) => (
                <button
                  key={shipment.id}
                  onClick={() => onSelectShipment(shipment)}
                  className="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-navy-950 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-bold text-slate-700 dark:text-white">
                      {shipment.id}
                    </span>
                    <span className="text-xs px-2 py-1 bg-slate-200 dark:bg-navy-700 rounded text-slate-600 dark:text-slate-300">
                      {shipment.carrier}
                    </span>
                    <span className="text-xs text-slate-500">
                      {shipment.detailedInfo?.destination || 'Sin destino'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {shipment.phone && (
                      <span className="text-xs text-slate-400">{shipment.phone}</span>
                    )}
                    <Eye className="w-4 h-4 text-blue-500" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main component
export const PrediccionesTab: React.FC<PrediccionesTabProps> = ({ shipments }) => {
  const [activeSection, setActiveSection] = useState<'overview' | 'predictions' | 'anomalies' | 'recommendations' | 'chat'>('overview');
  const [searchCity, setSearchCity] = useState('');
  const [searchCarrier, setSearchCarrier] = useState<CarrierName | ''>('');
  const [semaforoData, setSemaforoData] = useState<CiudadSemaforo[]>([]);
  const [hasHistoricalData, setHasHistoricalData] = useState(false);
  const [currentPrediction, setCurrentPrediction] = useState<AnalisisPrediccion | null>(null);
  const [mlFactors, setMlFactors] = useState<{ name: string; impact: number; description: string }[]>([]);

  // Modal states
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [selectedShipmentAIRec, setSelectedShipmentAIRec] = useState<string | undefined>();
  const [selectedPattern, setSelectedPattern] = useState<PatronDetectado | null>(null);
  const [expandedAnomalyId, setExpandedAnomalyId] = useState<string | null>(null);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Top cities for quick predictions
  const topCities = useMemo(() => getTopCities(shipments, semaforoData), [shipments, semaforoData]);

  // Load historical data
  useEffect(() => {
    const saved = loadTabData<{
      data: SemaforoExcelData;
      uploadDate: string;
      fileName: string;
    } | null>(STORAGE_KEYS.SEMAFORO, null);

    if (saved?.data) {
      const processed = procesarExcelParaSemaforo(saved.data);
      setSemaforoData(processed);
      setHasHistoricalData(true);
    }

    const chatHistory = loadTabData<ChatMessage[]>('litper_predictions_chat', []);
    if (chatHistory.length > 0) {
      setChatMessages(chatHistory);
    }
  }, []);

  // Save chat history
  useEffect(() => {
    if (chatMessages.length > 0) {
      saveTabData('litper_predictions_chat', chatMessages);
    }
  }, [chatMessages]);

  // Detect patterns and anomalies
  const patrones = useMemo(() => detectarPatrones(shipments), [shipments]);
  const anomalies = useMemo(() => detectAnomalies(shipments), [shipments]);
  const guiasRetrasadas = useMemo(() => detectarGuiasRetrasadas(shipments), [shipments]);

  // Get unique cities and carriers
  const { cities, carriers } = useMemo(() => {
    const citySet = new Set<string>();
    const carrierSet = new Set<CarrierName>();

    shipments.forEach((s) => {
      if (s.detailedInfo?.destination) {
        citySet.add(s.detailedInfo.destination.toUpperCase());
      }
      if (s.carrier !== CarrierName.UNKNOWN) {
        carrierSet.add(s.carrier);
      }
    });

    semaforoData.forEach((c) => {
      citySet.add(c.ciudad.toUpperCase());
    });

    return {
      cities: Array.from(citySet).sort(),
      carriers: Array.from(carrierSet),
    };
  }, [shipments, semaforoData]);

  // Handle prediction
  const handlePredict = (city?: string, carrier?: CarrierName) => {
    const targetCity = city || searchCity;
    const targetCarrier = carrier || searchCarrier;

    if (!targetCity || !targetCarrier) return;

    setSearchCity(targetCity);
    setSearchCarrier(targetCarrier);

    const historico = semaforoData.find(
      (c) =>
        c.ciudad.toUpperCase() === targetCity.toUpperCase() &&
        c.transportadora.toUpperCase() === targetCarrier.toUpperCase()
    );

    const prediction = generarPrediccion(targetCity, targetCarrier, shipments, historico);

    const { score, factors } = calculateMLScore(
      prediction.probabilidadExito,
      targetCarrier as CarrierName,
      targetCity,
      historico
    );

    prediction.probabilidadExito = score;
    setCurrentPrediction(prediction);
    setMlFactors(factors);
    setActiveSection('predictions');
  };

  // Handle opening shipment detail from anomaly
  const handleOpenShipmentFromAnomaly = (anomaly: Anomaly) => {
    setSelectedShipment(anomaly.shipment);
    setSelectedShipmentAIRec(anomaly.aiRecommendation);
  };

  // Handle opening shipment from pattern
  const handleOpenShipmentFromPattern = (shipment: Shipment) => {
    setSelectedPattern(null);
    setSelectedShipment(shipment);
    setSelectedShipmentAIRec(undefined);
  };

  // Smart chat response
  const handleChatSubmit = useCallback(async () => {
    if (!chatInput.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: chatInput,
      timestamp: new Date(),
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsTyping(true);

    await new Promise(resolve => setTimeout(resolve, 1500));

    let response = '';
    const input = chatInput.toLowerCase();

    if (input.includes('resumen') || input.includes('estado') || input.includes('general')) {
      const delivered = shipments.filter(s => s.status === ShipmentStatus.DELIVERED).length;
      const inTransit = shipments.filter(s => s.status === ShipmentStatus.IN_TRANSIT).length;
      const issues = shipments.filter(s => s.status === ShipmentStatus.ISSUE).length;
      response = `📊 **Resumen Actual:**\n\n- Total guías: ${shipments.length}\n- Entregadas: ${delivered} (${((delivered/shipments.length)*100).toFixed(1)}%)\n- En tránsito: ${inTransit}\n- Con novedad: ${issues}\n- Anomalías detectadas: ${anomalies.length}\n\n${anomalies.length > 0 ? `⚠️ Hay ${anomalies.filter(a => a.severity === 'CRITICAL').length} anomalías críticas que requieren atención inmediata.` : '✅ No hay anomalías críticas.'}`;
    }
    else if (input.includes('mejor') && input.includes('transportadora')) {
      const carrierStats = carriers.map(c => {
        const carrierShipments = shipments.filter(s => s.carrier === c);
        const delivered = carrierShipments.filter(s => s.status === ShipmentStatus.DELIVERED).length;
        return {
          carrier: c,
          total: carrierShipments.length,
          rate: carrierShipments.length > 0 ? (delivered / carrierShipments.length) * 100 : 0
        };
      }).filter(c => c.total >= 3).sort((a, b) => b.rate - a.rate);

      if (carrierStats.length > 0) {
        response = `🏆 **Ranking de Transportadoras (datos actuales):**\n\n${carrierStats.map((c, i) =>
          `${i + 1}. **${c.carrier}**: ${c.rate.toFixed(0)}% efectividad (${c.total} guías)`
        ).join('\n')}\n\n💡 Recomendación: ${carrierStats[0].carrier} tiene el mejor rendimiento actual.`;
      } else {
        response = 'No hay suficientes datos para determinar la mejor transportadora. Se necesitan al menos 3 guías por transportadora.';
      }
    }
    else if (input.includes('retraso') || input.includes('retrasad')) {
      response = `⏰ **Guías Retrasadas:**\n\n- Total retrasadas: ${guiasRetrasadas.length}\n- Críticas (5+ días): ${guiasRetrasadas.filter(g => g.nivelAlerta === 'CRITICO').length}\n- Altas (3-4 días): ${guiasRetrasadas.filter(g => g.nivelAlerta === 'ALTO').length}\n- Medias (2 días): ${guiasRetrasadas.filter(g => g.nivelAlerta === 'MEDIO').length}\n\n${guiasRetrasadas.length > 0 ? `🚨 Las guías más críticas son: ${guiasRetrasadas.slice(0, 3).map(g => g.guia.id).join(', ')}` : '✅ No hay guías retrasadas.'}`;
    }
    else if (input.includes('alerta') || input.includes('anomal')) {
      const critical = anomalies.filter(a => a.severity === 'CRITICAL');
      const high = anomalies.filter(a => a.severity === 'HIGH');
      response = `🚨 **Alertas y Anomalías:**\n\n- Críticas: ${critical.length}\n- Altas: ${high.length}\n- Total: ${anomalies.length}\n\n${critical.length > 0 ? `⚠️ **Acciones urgentes:**\n${critical.slice(0, 3).map(a => `- ${a.shipment.id}: ${a.description}`).join('\n')}` : '✅ No hay alertas críticas.'}`;
    }
    else if (input.includes('patrón') || input.includes('pattern') || input.includes('tendencia')) {
      response = `📈 **Patrones Detectados:**\n\n${patrones.length > 0 ? patrones.slice(0, 5).map(p =>
        `- **${p.titulo}** (${p.impacto}): ${p.descripcion}`
      ).join('\n\n') : 'No se han detectado patrones significativos con los datos actuales.'}`;
    }
    else if (input.includes('ayuda') || input.includes('help') || input.includes('qué puedes')) {
      response = `🤖 **Soy tu Asistente de Predicciones Logísticas**\n\nPuedo ayudarte con:\n\n📊 **Análisis:**\n- "Dame un resumen general"\n- "¿Cuáles son las alertas actuales?"\n- "¿Qué patrones has detectado?"\n\n🚚 **Transportadoras:**\n- "¿Cuál es la mejor transportadora?"\n\n⏰ **Seguimiento:**\n- "¿Hay guías retrasadas?"\n- "¿Cuántas anomalías hay?"\n\n💡 Mis respuestas se basan en tus datos reales de ${shipments.length} guías${hasHistoricalData ? ` y ${semaforoData.length} rutas históricas` : ''}.`;
    }
    else {
      response = `Entiendo tu consulta sobre "${chatInput.substring(0, 50)}..."\n\nBasándome en los datos actuales:\n- ${shipments.length} guías activas\n- ${anomalies.length} anomalías detectadas\n- ${patrones.length} patrones identificados\n\n¿Podrías ser más específico? Prueba con:\n- "Resumen general"\n- "Mejor transportadora"\n- "Guías retrasadas"\n- "Alertas"`;
    }

    const assistantMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response,
      timestamp: new Date(),
    };

    setChatMessages(prev => [...prev, assistantMessage]);
    setIsTyping(false);
  }, [chatInput, shipments, anomalies, patrones, guiasRetrasadas, semaforoData, hasHistoricalData, carriers]);

  // Carrier recommendations for selected city
  const carrierRecommendations = useMemo(() => {
    if (!searchCity) return [];
    return getSmartCarrierRecommendation(searchCity, semaforoData, shipments);
  }, [searchCity, semaforoData, shipments]);

  // Stats summary
  const stats = useMemo(() => {
    const delivered = shipments.filter(s => s.status === ShipmentStatus.DELIVERED).length;
    const inTransit = shipments.filter(s => s.status === ShipmentStatus.IN_TRANSIT).length;
    const issues = shipments.filter(s => s.status === ShipmentStatus.ISSUE).length;
    const inOffice = shipments.filter(s => s.status === ShipmentStatus.IN_OFFICE).length;

    return {
      total: shipments.length,
      delivered,
      inTransit,
      issues,
      inOffice,
      successRate: shipments.length > 0 ? (delivered / shipments.length) * 100 : 0,
      criticalAnomalies: anomalies.filter(a => a.severity === 'CRITICAL').length,
      highAnomalies: anomalies.filter(a => a.severity === 'HIGH').length,
    };
  }, [shipments, anomalies]);

  // Empty state
  if (shipments.length === 0 && !hasHistoricalData) {
    return (
      <div className="bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-700 p-12 text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Brain className="w-10 h-10 text-white" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
          Sistema de Predicciones IA
        </h3>
        <p className="text-slate-500 dark:text-slate-400 mb-4 max-w-md mx-auto">
          Carga guías en Seguimiento o un Excel histórico en Semáforo para activar el sistema de predicciones inteligentes.
        </p>
        <div className="flex items-center justify-center gap-4 text-sm text-slate-400">
          <span className="flex items-center gap-1"><Database className="w-4 h-4" /> Sin datos actuales</span>
          <span className="flex items-center gap-1"><History className="w-4 h-4" /> Sin histórico</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with ML branding */}
      <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Brain className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                Sistema de Predicciones IA
                <Sparkles className="w-5 h-5 text-yellow-300" />
              </h2>
              <p className="text-purple-100 text-sm">
                Análisis predictivo con datos locales • {shipments.length} guías • {semaforoData.length} rutas históricas
              </p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <div className="bg-white/20 rounded-lg px-4 py-2 text-center">
              <p className="text-2xl font-bold">{stats.successRate.toFixed(0)}%</p>
              <p className="text-xs text-purple-200">Tasa de éxito</p>
            </div>
            <div className="bg-white/20 rounded-lg px-4 py-2 text-center">
              <p className="text-2xl font-bold">{stats.criticalAnomalies}</p>
              <p className="text-xs text-purple-200">Alertas críticas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Section Navigation */}
      <div className="flex overflow-x-auto gap-2 pb-2">
        {[
          { id: 'overview', label: 'Vista General', icon: PieChart },
          { id: 'predictions', label: 'Predicciones', icon: Target },
          { id: 'anomalies', label: 'Anomalías', icon: AlertTriangle },
          { id: 'recommendations', label: 'Recomendaciones', icon: Lightbulb },
          { id: 'chat', label: 'Chat IA', icon: MessageSquare },
        ].map(section => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
              activeSection === section.id
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-white dark:bg-navy-900 text-slate-600 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-navy-800'
            }`}
          >
            <section.icon className="w-4 h-4" />
            {section.label}
            {section.id === 'anomalies' && stats.criticalAnomalies > 0 && (
              <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {stats.criticalAnomalies}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Overview Section */}
      {activeSection === 'overview' && (
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-navy-900 rounded-xl p-4 border border-slate-200 dark:border-navy-700">
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-5 h-5 text-blue-500" />
                <span className="text-sm text-slate-500">Total Guías</span>
              </div>
              <p className="text-3xl font-bold text-slate-800 dark:text-white">{stats.total}</p>
            </div>
            <div className="bg-white dark:bg-navy-900 rounded-xl p-4 border border-slate-200 dark:border-navy-700">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <span className="text-sm text-slate-500">Entregadas</span>
              </div>
              <p className="text-3xl font-bold text-emerald-600">{stats.delivered}</p>
            </div>
            <div className="bg-white dark:bg-navy-900 rounded-xl p-4 border border-slate-200 dark:border-navy-700">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                <span className="text-sm text-slate-500">Anomalías</span>
              </div>
              <p className="text-3xl font-bold text-amber-600">{anomalies.length}</p>
            </div>
            <div className="bg-white dark:bg-navy-900 rounded-xl p-4 border border-slate-200 dark:border-navy-700">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-5 h-5 text-purple-500" />
                <span className="text-sm text-slate-500">Patrones</span>
              </div>
              <p className="text-3xl font-bold text-purple-600">{patrones.length}</p>
            </div>
          </div>

          {/* Quick Predictions - Top Cities */}
          {topCities.length > 0 && (
            <div className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-700 p-4">
              <h3 className="font-bold text-slate-700 dark:text-white text-sm mb-3 flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500" />
                CIUDADES MÁS UTILIZADAS - PREDICCIÓN RÁPIDA
              </h3>
              <div className="flex flex-wrap gap-2">
                {topCities.slice(0, 8).map(city => (
                  <button
                    key={city}
                    onClick={() => handlePredict(city, carriers[0] || CarrierName.COORDINADORA)}
                    className="px-3 py-2 bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 text-purple-700 dark:text-purple-300 rounded-lg text-sm font-medium hover:from-purple-200 hover:to-indigo-200 dark:hover:from-purple-900/50 dark:hover:to-indigo-900/50 transition-all flex items-center gap-2"
                  >
                    <MapPin className="w-3 h-3" />
                    {city}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Data Sources */}
          <div className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-700 p-4">
            <h3 className="font-bold text-slate-700 dark:text-white text-sm mb-3 flex items-center gap-2">
              <Database className="w-4 h-4" />
              FUENTES DE DATOS (MODO LOCAL - SIN BACKEND)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3 border border-emerald-200 dark:border-emerald-800">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-white">
                    {shipments.length} guías cargadas localmente
                  </p>
                  <p className="text-xs text-slate-500">Datos de Seguimiento (sin necesidad de backend)</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-slate-50 dark:bg-navy-950 rounded-lg p-3">
                {hasHistoricalData ? (
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                ) : (
                  <Info className="w-5 h-5 text-amber-500" />
                )}
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-white">
                    {hasHistoricalData ? `${semaforoData.length} rutas históricas` : 'Sin datos históricos'}
                  </p>
                  <p className="text-xs text-slate-500">Carga Excel en Semáforo para más precisión</p>
                </div>
              </div>
            </div>
          </div>

          {/* Top Patterns - DYNAMIC */}
          {patrones.length > 0 && (
            <div className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-700 p-4">
              <h3 className="font-bold text-slate-700 dark:text-white text-sm mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                PATRONES DETECTADOS (Click para ver guías)
              </h3>
              <div className="space-y-3">
                {patrones.slice(0, 5).map((patron) => (
                  <button
                    key={patron.id}
                    onClick={() => setSelectedPattern(patron)}
                    className={`w-full rounded-lg p-3 border-l-4 text-left transition-all hover:shadow-md ${
                      patron.impacto === 'CRITICO' ? 'bg-red-50 dark:bg-red-900/10 border-l-red-500 hover:bg-red-100' :
                      patron.impacto === 'ALTO' ? 'bg-orange-50 dark:bg-orange-900/10 border-l-orange-500 hover:bg-orange-100' :
                      patron.impacto === 'MEDIO' ? 'bg-yellow-50 dark:bg-yellow-900/10 border-l-yellow-500 hover:bg-yellow-100' :
                      'bg-green-50 dark:bg-green-900/10 border-l-green-500 hover:bg-green-100'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-800 dark:text-white text-sm">{patron.titulo}</p>
                          <span className="text-xs bg-slate-200 dark:bg-navy-700 px-2 py-0.5 rounded-full text-slate-600 dark:text-slate-300">
                            {patron.datosApoyo.cantidad} guías
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{patron.descripcion}</p>
                        <p className="text-xs text-purple-600 dark:text-purple-400 mt-2 flex items-center gap-1">
                          <Brain className="w-3 h-3" />
                          {patron.recomendacion.substring(0, 80)}...
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2 py-1 rounded ${
                          patron.impacto === 'CRITICO' ? 'bg-red-100 text-red-700' :
                          patron.impacto === 'ALTO' ? 'bg-orange-100 text-orange-700' :
                          patron.impacto === 'MEDIO' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {patron.impacto}
                        </span>
                        <Eye className="w-4 h-4 text-slate-400" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Predictions Section */}
      {activeSection === 'predictions' && (
        <div className="space-y-6">
          {/* Quick City Buttons */}
          <div className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-700 p-4">
            <h3 className="font-bold text-slate-700 dark:text-white text-sm mb-3 flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" />
              CIUDADES MÁS UTILIZADAS
            </h3>
            <div className="flex flex-wrap gap-2">
              {topCities.slice(0, 10).map(city => (
                <button
                  key={city}
                  onClick={() => {
                    setSearchCity(city);
                    if (searchCarrier) handlePredict(city, searchCarrier);
                  }}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                    searchCity === city
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-navy-700'
                  }`}
                >
                  <MapPin className="w-3 h-3" />
                  {city}
                </button>
              ))}
            </div>
          </div>

          {/* Prediction Form */}
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl border border-purple-200 dark:border-purple-800 p-6">
            <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-500" />
              Predicción Personalizada por Ruta
            </h3>

            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1">
                <label className="text-xs text-slate-500 mb-1 block">Ciudad Destino</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    list="cities-list"
                    value={searchCity}
                    onChange={(e) => setSearchCity(e.target.value.toUpperCase())}
                    placeholder="Buscar ciudad..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <datalist id="cities-list">
                    {cities.map((city) => (
                      <option key={city} value={city} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="flex-1">
                <label className="text-xs text-slate-500 mb-1 block">Transportadora</label>
                <select
                  value={searchCarrier}
                  onChange={(e) => setSearchCarrier(e.target.value as CarrierName)}
                  className="w-full px-4 py-2.5 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Seleccionar transportadora...</option>
                  {[CarrierName.COORDINADORA, CarrierName.INTER_RAPIDISIMO, CarrierName.ENVIA, CarrierName.TCC, CarrierName.VELOCES].map((carrier) => (
                    <option key={carrier} value={carrier}>{carrier}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => handlePredict()}
                  disabled={!searchCity || !searchCarrier}
                  className="px-6 py-2.5 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  <Cpu className="w-4 h-4" />
                  Calcular
                </button>
              </div>
            </div>

            {/* Prediction Result */}
            {currentPrediction && (
              <div className="mt-6 bg-white dark:bg-navy-900 rounded-xl p-6 border border-slate-200 dark:border-navy-700">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-slate-400" />
                      {currentPrediction.ciudad}
                    </h4>
                    <p className="text-sm text-slate-500 flex items-center gap-1">
                      <Truck className="w-4 h-4" />
                      {currentPrediction.transportadora}
                    </p>
                  </div>

                  {/* ML Score Gauge */}
                  <div className="text-center">
                    <div className={`w-24 h-24 rounded-full flex items-center justify-center text-white font-bold text-2xl ${
                      currentPrediction.probabilidadExito >= 70 ? 'bg-gradient-to-br from-emerald-400 to-green-600' :
                      currentPrediction.probabilidadExito >= 50 ? 'bg-gradient-to-br from-yellow-400 to-amber-600' :
                      'bg-gradient-to-br from-red-400 to-rose-600'
                    }`}>
                      {currentPrediction.probabilidadExito.toFixed(0)}%
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Prob. de éxito</p>
                  </div>
                </div>

                {/* ML Factors Breakdown */}
                <div className="mb-4">
                  <p className="text-sm font-bold text-slate-700 dark:text-white mb-2 flex items-center gap-2">
                    <Brain className="w-4 h-4 text-purple-500" />
                    Factores del Modelo ML
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {mlFactors.map((factor, idx) => (
                      <div key={idx} className="bg-slate-50 dark:bg-navy-950 rounded-lg p-2 text-center">
                        <p className="text-xs text-slate-500">{factor.name}</p>
                        <p className={`text-sm font-bold ${factor.impact >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {factor.impact >= 0 ? '+' : ''}{factor.impact}%
                        </p>
                        <p className="text-[10px] text-slate-400">{factor.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div className="bg-slate-50 dark:bg-navy-950 rounded-lg p-3 text-center">
                    <p className="text-xs text-slate-500">Guías Activas</p>
                    <p className="text-xl font-bold text-slate-800 dark:text-white">{currentPrediction.guiasActivas}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-navy-950 rounded-lg p-3 text-center">
                    <p className="text-xs text-slate-500">Retrasadas</p>
                    <p className={`text-xl font-bold ${currentPrediction.guiasRetrasadas > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                      {currentPrediction.guiasRetrasadas}
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-navy-950 rounded-lg p-3 text-center">
                    <p className="text-xs text-slate-500">Éxito Histórico</p>
                    <p className="text-xl font-bold text-blue-600">{currentPrediction.tasaExitoHistorica.toFixed(0)}%</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-navy-950 rounded-lg p-3 text-center">
                    <p className="text-xs text-slate-500">Tiempo Est.</p>
                    <p className="text-xl font-bold text-purple-600">{currentPrediction.tiempoEstimado}d</p>
                  </div>
                </div>

                {/* Recommendations */}
                {currentPrediction.recomendaciones.length > 0 && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-100 dark:border-blue-800">
                    <p className="text-sm font-bold text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-1">
                      <Lightbulb className="w-4 h-4" />
                      Recomendaciones IA
                    </p>
                    <ul className="space-y-1">
                      {currentPrediction.recomendaciones.map((rec, idx) => (
                        <li key={idx} className="text-xs text-blue-800 dark:text-blue-200 flex items-start gap-1">
                          <ChevronRight className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Carrier Recommendations for City */}
            {searchCity && carrierRecommendations.length > 0 && (
              <div className="mt-4 bg-white dark:bg-navy-900 rounded-xl p-4 border border-slate-200 dark:border-navy-700">
                <h4 className="font-bold text-slate-700 dark:text-white text-sm mb-3 flex items-center gap-2">
                  <Truck className="w-4 h-4" />
                  Ranking de Transportadoras para {searchCity}
                </h4>
                <div className="space-y-2">
                  {carrierRecommendations.slice(0, 5).map((rec, idx) => (
                    <button
                      key={rec.carrier}
                      onClick={() => handlePredict(searchCity, rec.carrier)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${
                        idx === 0 ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800' :
                        'bg-slate-50 dark:bg-navy-950 hover:bg-slate-100 dark:hover:bg-navy-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          idx === 0 ? 'bg-emerald-500 text-white' :
                          idx === 1 ? 'bg-slate-400 text-white' :
                          idx === 2 ? 'bg-amber-600 text-white' :
                          'bg-slate-300 text-slate-600'
                        }`}>
                          {idx + 1}
                        </span>
                        <div className="text-left">
                          <p className="font-bold text-slate-800 dark:text-white">{rec.carrier}</p>
                          <p className="text-xs text-slate-500">{rec.reasons.slice(0, 2).join(' • ')}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-bold ${rec.score >= 70 ? 'text-emerald-600' : rec.score >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                          {rec.score.toFixed(0)}
                        </p>
                        <p className="text-xs text-slate-400">Score</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Anomalies Section - DYNAMIC */}
      {activeSection === 'anomalies' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-700 p-4">
            <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Detección Temprana de Anomalías
              <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs px-2 py-1 rounded-full ml-2">
                {anomalies.length} detectadas
              </span>
            </h3>

            {anomalies.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <p className="text-slate-600 dark:text-slate-400">No se detectaron anomalías</p>
                <p className="text-sm text-slate-400">Todas las guías siguen patrones normales</p>
              </div>
            ) : (
              <div className="space-y-3">
                {anomalies.map((anomaly, idx) => {
                  const isExpanded = expandedAnomalyId === `${anomaly.shipment.id}-${idx}`;
                  return (
                    <div
                      key={`${anomaly.shipment.id}-${idx}`}
                      className={`rounded-xl border-l-4 overflow-hidden ${
                        anomaly.severity === 'CRITICAL' ? 'bg-red-50 dark:bg-red-900/10 border-l-red-500' :
                        anomaly.severity === 'HIGH' ? 'bg-orange-50 dark:bg-orange-900/10 border-l-orange-500' :
                        'bg-yellow-50 dark:bg-yellow-900/10 border-l-yellow-500'
                      }`}
                    >
                      {/* Header - Clickable */}
                      <button
                        onClick={() => setExpandedAnomalyId(isExpanded ? null : `${anomaly.shipment.id}-${idx}`)}
                        className="w-full p-4 text-left"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold px-2 py-1 rounded ${
                              anomaly.severity === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                              anomaly.severity === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {anomaly.severity === 'CRITICAL' ? '🔴 CRÍTICO' :
                               anomaly.severity === 'HIGH' ? '🟠 ALTO' : '🟡 MEDIO'}
                            </span>
                            <span className="text-xs text-slate-500 bg-slate-100 dark:bg-navy-800 px-2 py-1 rounded">
                              {anomaly.type.replace('_', ' ')}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm text-slate-600 dark:text-slate-400">
                              {anomaly.shipment.id}
                            </span>
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </div>
                        </div>

                        <p className="font-bold text-slate-800 dark:text-white mb-1">{anomaly.description}</p>
                        <p className="text-xs text-slate-500">{anomaly.shipment.carrier} • {anomaly.shipment.detailedInfo?.destination || 'Sin destino'}</p>
                      </button>

                      {/* Expanded Content */}
                      {isExpanded && (
                        <div className="px-4 pb-4 space-y-3">
                          {/* Quick Info */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            <div className="bg-white/50 dark:bg-navy-900/50 rounded-lg p-2 text-center">
                              <p className="text-xs text-slate-500">Teléfono</p>
                              <p className="font-bold text-slate-700 dark:text-white text-sm">
                                {anomaly.shipment.phone || 'N/A'}
                              </p>
                            </div>
                            <div className="bg-white/50 dark:bg-navy-900/50 rounded-lg p-2 text-center">
                              <p className="text-xs text-slate-500">Días en tránsito</p>
                              <p className="font-bold text-slate-700 dark:text-white text-sm">
                                {anomaly.shipment.detailedInfo?.daysInTransit || 0}
                              </p>
                            </div>
                            <div className="bg-white/50 dark:bg-navy-900/50 rounded-lg p-2 text-center">
                              <p className="text-xs text-slate-500">Origen</p>
                              <p className="font-bold text-slate-700 dark:text-white text-sm truncate">
                                {anomaly.shipment.detailedInfo?.origin || 'N/A'}
                              </p>
                            </div>
                            <div className="bg-white/50 dark:bg-navy-900/50 rounded-lg p-2 text-center">
                              <p className="text-xs text-slate-500">Destino</p>
                              <p className="font-bold text-slate-700 dark:text-white text-sm truncate">
                                {anomaly.shipment.detailedInfo?.destination || 'N/A'}
                              </p>
                            </div>
                          </div>

                          {/* Behavior & Recommendation */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <div className="bg-white/50 dark:bg-navy-900/50 rounded-lg p-3">
                              <p className="text-xs text-slate-500 mb-1">Comportamiento esperado:</p>
                              <p className="text-sm text-slate-700 dark:text-slate-300">{anomaly.expectedBehavior}</p>
                            </div>
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                              <p className="text-xs text-blue-600 dark:text-blue-400 font-bold mb-1">💡 Acción recomendada:</p>
                              <p className="text-sm text-blue-800 dark:text-blue-200">{anomaly.recommendation}</p>
                            </div>
                          </div>

                          {/* AI Recommendation */}
                          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
                            <div className="flex items-start gap-2">
                              <Brain className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs font-bold text-purple-700 dark:text-purple-300 mb-1">Recomendación IA Personalizada:</p>
                                <p className="text-sm text-purple-800 dark:text-purple-200">{anomaly.aiRecommendation}</p>
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2 pt-2">
                            <button
                              onClick={() => handleOpenShipmentFromAnomaly(anomaly)}
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                            >
                              <Eye className="w-4 h-4" />
                              Ver Guía Completa
                            </button>
                            {anomaly.shipment.phone && (
                              <a
                                href={`https://wa.me/57${anomaly.shipment.phone.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                              >
                                <Phone className="w-4 h-4" />
                                WhatsApp
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recommendations Section */}
      {activeSection === 'recommendations' && (
        <div className="space-y-6">
          {/* Global AI Recommendations */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-6">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-xl">
                <Bot className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-800 dark:text-white mb-3">
                  Recomendaciones Inteligentes del Sistema
                </h3>
                <div className="space-y-3">
                  {stats.criticalAnomalies > 0 && (
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-200 dark:border-red-800">
                      <p className="text-sm font-bold text-red-700 dark:text-red-400 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        {stats.criticalAnomalies} anomalías críticas requieren atención inmediata
                      </p>
                    </div>
                  )}

                  {patrones.filter(p => p.impacto === 'CRITICO' || p.impacto === 'ALTO').slice(0, 3).map((patron) => (
                    <button
                      key={patron.id}
                      onClick={() => setSelectedPattern(patron)}
                      className="w-full text-left bg-white dark:bg-navy-900 rounded-lg p-3 border border-slate-200 dark:border-navy-700 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-bold text-slate-700 dark:text-white mb-1 flex items-center gap-2">
                            {patron.titulo}
                            <span className="text-xs bg-slate-100 dark:bg-navy-800 px-2 py-0.5 rounded">
                              {patron.datosApoyo.cantidad} guías
                            </span>
                          </p>
                          <p className="text-xs text-slate-500">{patron.recomendacion}</p>
                        </div>
                        <Eye className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      </div>
                    </button>
                  ))}

                  <div className="bg-white dark:bg-navy-900 rounded-lg p-3 border border-slate-200 dark:border-navy-700">
                    <p className="text-sm font-bold text-slate-700 dark:text-white mb-1">📅 Optimización de despachos</p>
                    <p className="text-xs text-slate-500">
                      Priorizar despachos martes a jueves para mejor rendimiento. Los lunes y viernes tienen mayor congestión.
                    </p>
                  </div>

                  {semaforoData.filter(s => s.semaforo === 'ROJO').length > 0 && (
                    <div className="bg-white dark:bg-navy-900 rounded-lg p-3 border border-slate-200 dark:border-navy-700">
                      <p className="text-sm font-bold text-slate-700 dark:text-white mb-1">🔴 Rutas de alto riesgo</p>
                      <p className="text-xs text-slate-500">
                        Exigir prepago para las {semaforoData.filter(s => s.semaforo === 'ROJO').length} rutas en estado crítico.
                        Ciudades: {semaforoData.filter(s => s.semaforo === 'ROJO').slice(0, 3).map(s => s.ciudad).join(', ')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Best and worst routes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {semaforoData.filter(c => c.semaforo === 'VERDE').length > 0 && (
              <div className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-700 p-4">
                <h4 className="font-bold text-emerald-700 dark:text-emerald-400 mb-3 flex items-center gap-2">
                  ✅ Mejores Rutas Históricas
                </h4>
                <div className="space-y-2">
                  {semaforoData
                    .filter(c => c.semaforo === 'VERDE')
                    .sort((a, b) => b.tasaExito - a.tasaExito)
                    .slice(0, 5)
                    .map((ruta, idx) => (
                      <button
                        key={`${ruta.ciudad}-${ruta.transportadora}-${idx}`}
                        onClick={() => handlePredict(ruta.ciudad, ruta.transportadora as CarrierName)}
                        className="w-full flex items-center justify-between bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-2 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-all"
                      >
                        <div className="text-left">
                          <p className="font-bold text-sm text-slate-800 dark:text-white">{ruta.ciudad}</p>
                          <p className="text-xs text-slate-500">{ruta.transportadora}</p>
                        </div>
                        <span className="text-emerald-600 font-bold">{ruta.tasaExito.toFixed(0)}%</span>
                      </button>
                    ))}
                </div>
              </div>
            )}

            {semaforoData.filter(c => c.semaforo === 'ROJO').length > 0 && (
              <div className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-700 p-4">
                <h4 className="font-bold text-red-700 dark:text-red-400 mb-3 flex items-center gap-2">
                  🔴 Rutas Problemáticas
                </h4>
                <div className="space-y-2">
                  {semaforoData
                    .filter(c => c.semaforo === 'ROJO')
                    .sort((a, b) => a.tasaExito - b.tasaExito)
                    .slice(0, 5)
                    .map((ruta, idx) => (
                      <button
                        key={`${ruta.ciudad}-${ruta.transportadora}-${idx}`}
                        onClick={() => handlePredict(ruta.ciudad, ruta.transportadora as CarrierName)}
                        className="w-full flex items-center justify-between bg-red-50 dark:bg-red-900/20 rounded-lg p-2 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all"
                      >
                        <div className="text-left">
                          <p className="font-bold text-sm text-slate-800 dark:text-white">{ruta.ciudad}</p>
                          <p className="text-xs text-slate-500">{ruta.transportadora} • {ruta.tasaDevolucion.toFixed(0)}% devolución</p>
                        </div>
                        <span className="text-red-600 font-bold">{ruta.tasaExito.toFixed(0)}%</span>
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chat Section */}
      {activeSection === 'chat' && (
        <div className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-700 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <Bot className="w-5 h-5" />
              <span className="font-bold">Asistente de Predicciones IA (Modo Local)</span>
            </div>
            <button
              onClick={() => setChatMessages([])}
              className="text-white/70 hover:text-white text-xs flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Limpiar chat
            </button>
          </div>

          {/* Chat messages */}
          <div className="h-[400px] overflow-y-auto p-4 space-y-4">
            {chatMessages.length === 0 && (
              <div className="text-center py-8">
                <Bot className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                <p className="text-slate-600 dark:text-slate-400 font-medium">¡Hola! Soy tu asistente de predicciones.</p>
                <p className="text-sm text-slate-400 mt-2">
                  Puedo analizar tus {shipments.length} guías y {semaforoData.length} rutas históricas.
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {['Dame un resumen', 'Mejor transportadora', 'Guías retrasadas', 'Alertas'].map(q => (
                    <button
                      key={q}
                      onClick={() => {
                        setChatInput(q);
                        setTimeout(() => handleChatSubmit(), 100);
                      }}
                      className="px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {chatMessages.map(msg => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-purple-600 text-white rounded-tr-none'
                      : 'bg-slate-100 dark:bg-navy-800 text-slate-800 dark:text-slate-200 rounded-tl-none'
                  }`}
                >
                  <div className="whitespace-pre-wrap text-sm">
                    {msg.content.split('\n').map((line, i) => (
                      <p key={i} className={line.startsWith('**') ? 'font-bold' : ''}>
                        {line.replace(/\*\*/g, '')}
                      </p>
                    ))}
                  </div>
                  <p className={`text-[10px] mt-1 ${msg.role === 'user' ? 'text-purple-200' : 'text-slate-400'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-slate-100 dark:bg-navy-800 rounded-2xl rounded-tl-none px-4 py-3">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Chat input */}
          <div className="border-t border-slate-200 dark:border-navy-700 p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleChatSubmit()}
                placeholder="Escribe tu pregunta..."
                className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={handleChatSubmit}
                disabled={!chatInput.trim() || isTyping}
                className="px-4 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {selectedShipment && (
        <ShipmentDetailModal
          shipment={selectedShipment}
          onClose={() => {
            setSelectedShipment(null);
            setSelectedShipmentAIRec(undefined);
          }}
          aiRecommendation={selectedShipmentAIRec}
        />
      )}

      {selectedPattern && (
        <PatternDetailModal
          pattern={selectedPattern}
          onClose={() => setSelectedPattern(null)}
          onSelectShipment={handleOpenShipmentFromPattern}
        />
      )}
    </div>
  );
};

export default PrediccionesTab;
