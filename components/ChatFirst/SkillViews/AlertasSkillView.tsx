// components/ChatFirst/SkillViews/AlertasSkillView.tsx
// Vista simplificada de Alertas/Semaforo - Solo lo esencial
import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  MapPin,
  TrendingUp,
  TrendingDown,
  Bell,
  BellOff,
  Eye,
  ChevronRight,
  Activity,
} from 'lucide-react';
import { Shipment, ShipmentStatus } from '../../../types';

interface AlertasSkillViewProps {
  shipments: Shipment[];
  onCityClick?: (city: string) => void;
  onChatQuery?: (query: string) => void;
}

interface CityAlert {
  city: string;
  total: number;
  delivered: number;
  issues: number;
  inTransit: number;
  avgDays: number;
  score: number;
  status: 'VERDE' | 'AMARILLO' | 'NARANJA' | 'ROJO';
  trend: 'up' | 'down' | 'stable';
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'ROJO': return 'bg-red-500';
    case 'NARANJA': return 'bg-orange-500';
    case 'AMARILLO': return 'bg-amber-500';
    case 'VERDE': return 'bg-emerald-500';
    default: return 'bg-slate-500';
  }
};

const getStatusBg = (status: string) => {
  switch (status) {
    case 'ROJO': return 'bg-red-500/10 border-red-500/30';
    case 'NARANJA': return 'bg-orange-500/10 border-orange-500/30';
    case 'AMARILLO': return 'bg-amber-500/10 border-amber-500/30';
    case 'VERDE': return 'bg-emerald-500/10 border-emerald-500/30';
    default: return 'bg-slate-500/10 border-slate-500/30';
  }
};

export const AlertasSkillView: React.FC<AlertasSkillViewProps> = ({
  shipments,
  onCityClick,
  onChatQuery,
}) => {
  const [showAll, setShowAll] = useState(false);
  const [mutedCities, setMutedCities] = useState<Set<string>>(new Set());

  // Calcular alertas por ciudad
  const cityAlerts = useMemo((): CityAlert[] => {
    const cityMap = new Map<string, Shipment[]>();

    shipments.forEach(shipment => {
      const city = shipment.detailedInfo?.destination?.split(',')[0]?.trim() || 'Sin ciudad';
      if (!cityMap.has(city)) cityMap.set(city, []);
      cityMap.get(city)!.push(shipment);
    });

    const alerts: CityAlert[] = [];

    cityMap.forEach((cityShipments, city) => {
      const total = cityShipments.length;
      const delivered = cityShipments.filter(s => s.status === ShipmentStatus.DELIVERED).length;
      const issues = cityShipments.filter(s =>
        s.status === ShipmentStatus.ISSUE || s.status === ShipmentStatus.EXCEPTION
      ).length;
      const inTransit = cityShipments.filter(s => s.status === ShipmentStatus.IN_TRANSIT).length;

      const avgDays = cityShipments.reduce((sum, s) =>
        sum + (s.detailedInfo?.daysInTransit || 0), 0
      ) / total;

      // Calcular score (0-100)
      const deliveryRate = total > 0 ? (delivered / total) * 100 : 0;
      const issueRate = total > 0 ? (issues / total) * 100 : 0;
      const transitPenalty = Math.min(avgDays * 5, 30);

      const score = Math.max(0, Math.min(100,
        deliveryRate * 0.5 - issueRate * 0.3 - transitPenalty
      ));

      // Determinar status
      let status: CityAlert['status'] = 'VERDE';
      if (score < 30 || issueRate > 30) status = 'ROJO';
      else if (score < 50 || issueRate > 20) status = 'NARANJA';
      else if (score < 70 || issueRate > 10) status = 'AMARILLO';

      // Trend (simulado - en produccion seria historico)
      const trend: CityAlert['trend'] = issueRate > 15 ? 'down' : deliveryRate > 70 ? 'up' : 'stable';

      alerts.push({
        city,
        total,
        delivered,
        issues,
        inTransit,
        avgDays: Math.round(avgDays * 10) / 10,
        score: Math.round(score),
        status,
        trend,
      });
    });

    // Ordenar por status (rojos primero) y luego por issues
    return alerts.sort((a, b) => {
      const statusOrder = { ROJO: 0, NARANJA: 1, AMARILLO: 2, VERDE: 3 };
      if (statusOrder[a.status] !== statusOrder[b.status]) {
        return statusOrder[a.status] - statusOrder[b.status];
      }
      return b.issues - a.issues;
    });
  }, [shipments]);

  // Stats globales
  const globalStats = useMemo(() => {
    const critical = cityAlerts.filter(c => c.status === 'ROJO').length;
    const warning = cityAlerts.filter(c => c.status === 'NARANJA' || c.status === 'AMARILLO').length;
    const healthy = cityAlerts.filter(c => c.status === 'VERDE').length;
    const totalIssues = cityAlerts.reduce((sum, c) => sum + c.issues, 0);
    return { critical, warning, healthy, totalIssues, totalCities: cityAlerts.length };
  }, [cityAlerts]);

  // Ciudades a mostrar
  const visibleCities = showAll ? cityAlerts : cityAlerts.slice(0, 8);

  const toggleMute = (city: string) => {
    const newMuted = new Set(mutedCities);
    if (newMuted.has(city)) {
      newMuted.delete(city);
    } else {
      newMuted.add(city);
    }
    setMutedCities(newMuted);
  };

  return (
    <div className="space-y-4">
      {/* Global Alert Summary */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-red-500/20 border border-red-500/30 p-3 rounded-xl text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-2xl font-bold text-red-400">{globalStats.critical}</span>
          </div>
          <p className="text-xs text-red-300">Criticas</p>
        </div>
        <div className="bg-amber-500/20 border border-amber-500/30 p-3 rounded-xl text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            <span className="text-2xl font-bold text-amber-400">{globalStats.warning}</span>
          </div>
          <p className="text-xs text-amber-300">Atencion</p>
        </div>
        <div className="bg-emerald-500/20 border border-emerald-500/30 p-3 rounded-xl text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span className="text-2xl font-bold text-emerald-400">{globalStats.healthy}</span>
          </div>
          <p className="text-xs text-emerald-300">Saludables</p>
        </div>
        <div className="bg-slate-500/20 border border-slate-500/30 p-3 rounded-xl text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Activity className="w-4 h-4 text-slate-400" />
            <span className="text-2xl font-bold text-white">{globalStats.totalIssues}</span>
          </div>
          <p className="text-xs text-slate-400">Novedades</p>
        </div>
      </div>

      {/* AI Insight */}
      {globalStats.critical > 0 && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-300 font-medium">
                {globalStats.critical} ciudad{globalStats.critical > 1 ? 'es' : ''} requiere{globalStats.critical === 1 ? '' : 'n'} atencion inmediata
              </p>
              <p className="text-xs text-red-400 mt-1">
                {cityAlerts.filter(c => c.status === 'ROJO').slice(0, 3).map(c => c.city).join(', ')}
                {globalStats.critical > 3 && ` y ${globalStats.critical - 3} mas`}
              </p>
              <button
                onClick={() => onChatQuery?.('Que esta pasando con las ciudades criticas?')}
                className="mt-2 text-xs text-red-300 hover:text-red-200 flex items-center gap-1"
              >
                Analizar con IA <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* City List */}
      <div className="space-y-2 max-h-[350px] overflow-y-auto pr-2">
        {visibleCities.map((city) => (
          <button
            key={city.city}
            onClick={() => onCityClick?.(city.city)}
            className={`w-full p-3 rounded-xl border ${getStatusBg(city.status)} text-left transition-all hover:scale-[1.01] ${
              mutedCities.has(city.city) ? 'opacity-50' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${getStatusColor(city.status)}`} />
                <div>
                  <p className="font-medium text-white flex items-center gap-2">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    {city.city}
                  </p>
                  <p className="text-xs text-slate-400">
                    {city.total} envios | {city.issues} novedades | ~{city.avgDays}d promedio
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {city.trend === 'down' && <TrendingDown className="w-4 h-4 text-red-400" />}
                {city.trend === 'up' && <TrendingUp className="w-4 h-4 text-emerald-400" />}
                <span className={`text-lg font-bold ${
                  city.status === 'ROJO' ? 'text-red-400' :
                  city.status === 'NARANJA' ? 'text-orange-400' :
                  city.status === 'AMARILLO' ? 'text-amber-400' :
                  'text-emerald-400'
                }`}>
                  {city.score}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleMute(city.city);
                  }}
                  className="p-1 hover:bg-white/10 rounded"
                >
                  {mutedCities.has(city.city) ? (
                    <BellOff className="w-4 h-4 text-slate-500" />
                  ) : (
                    <Bell className="w-4 h-4 text-slate-400" />
                  )}
                </button>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Show More / Less */}
      {cityAlerts.length > 8 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full py-2 text-center text-sm text-accent-400 hover:text-accent-300"
        >
          {showAll ? 'Ver menos' : `Ver todas (${cityAlerts.length} ciudades)`}
        </button>
      )}

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10">
        <button
          onClick={() => onChatQuery?.('Genera alerta para ciudades criticas')}
          className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-xs text-red-300"
        >
          Alertar equipo
        </button>
        <button
          onClick={() => onChatQuery?.('Que ciudades debo pausar hoy?')}
          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-slate-300"
        >
          Recomendacion pausas
        </button>
        <button
          onClick={() => onChatQuery?.('Compara rendimiento por transportadora')}
          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-slate-300"
        >
          Por transportadora
        </button>
      </div>
    </div>
  );
};

export default AlertasSkillView;
