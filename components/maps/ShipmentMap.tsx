// components/maps/ShipmentMap.tsx
// Real-time Shipment Map - SVG Colombia Map with city-level shipment visualization
import React, { useState, useMemo, useCallback } from 'react';
import {
  MapPin,
  Package,
  Truck,
  CheckCircle,
  AlertTriangle,
  Clock,
  ChevronRight,
  X,
  BarChart3,
  Eye,
  Filter,
} from 'lucide-react';
import { Shipment } from '../../types';

// ============================================
// TYPES
// ============================================
type MapStatus = 'delivered' | 'in_transit' | 'pending' | 'exception';

interface CityInfo {
  name: string;
  displayName: string;
  x: number; // SVG x position (0-100 scale)
  y: number; // SVG y position (0-100 scale)
}

interface CityShipmentData {
  city: CityInfo;
  shipments: Shipment[];
  statusBreakdown: Record<MapStatus, number>;
  total: number;
  dominantStatus: MapStatus;
}

interface ShipmentMapProps {
  shipments: Shipment[];
  onSelectShipment?: (s: Shipment) => void;
}

// ============================================
// COLOMBIAN CITIES - positions on simplified SVG map
// x/y are percentages within the SVG viewBox
// ============================================
const COLOMBIAN_CITIES: CityInfo[] = [
  { name: 'BOGOTA', displayName: 'Bogotá', x: 50, y: 55 },
  { name: 'MEDELLIN', displayName: 'Medellín', x: 38, y: 42 },
  { name: 'CALI', displayName: 'Cali', x: 32, y: 62 },
  { name: 'BARRANQUILLA', displayName: 'Barranquilla', x: 42, y: 14 },
  { name: 'CARTAGENA', displayName: 'Cartagena', x: 34, y: 16 },
  { name: 'BUCARAMANGA', displayName: 'Bucaramanga', x: 52, y: 34 },
  { name: 'PEREIRA', displayName: 'Pereira', x: 36, y: 52 },
  { name: 'MANIZALES', displayName: 'Manizales', x: 38, y: 49 },
  { name: 'CUCUTA', displayName: 'Cúcuta', x: 56, y: 28 },
  { name: 'IBAGUE', displayName: 'Ibagué', x: 42, y: 56 },
  { name: 'SANTA MARTA', displayName: 'Santa Marta', x: 48, y: 10 },
  { name: 'VILLAVICENCIO', displayName: 'Villavicencio', x: 56, y: 58 },
  { name: 'PASTO', displayName: 'Pasto', x: 30, y: 78 },
  { name: 'NEIVA', displayName: 'Neiva', x: 40, y: 66 },
  { name: 'ARMENIA', displayName: 'Armenia', x: 35, y: 54 },
];

// ============================================
// STATUS HELPERS
// ============================================
const STATUS_COLORS: Record<MapStatus, string> = {
  delivered: '#10b981',
  in_transit: '#3b82f6',
  pending: '#f59e0b',
  exception: '#ef4444',
};

const STATUS_BG: Record<MapStatus, string> = {
  delivered: 'bg-emerald-500',
  in_transit: 'bg-blue-500',
  pending: 'bg-amber-500',
  exception: 'bg-red-500',
};

const STATUS_BG_LIGHT: Record<MapStatus, string> = {
  delivered: 'bg-emerald-50 dark:bg-emerald-900/20',
  in_transit: 'bg-blue-50 dark:bg-blue-900/20',
  pending: 'bg-amber-50 dark:bg-amber-900/20',
  exception: 'bg-red-50 dark:bg-red-900/20',
};

const STATUS_TEXT: Record<MapStatus, string> = {
  delivered: 'text-emerald-700 dark:text-emerald-400',
  in_transit: 'text-blue-700 dark:text-blue-400',
  pending: 'text-amber-700 dark:text-amber-400',
  exception: 'text-red-700 dark:text-red-400',
};

const STATUS_LABELS: Record<MapStatus, string> = {
  delivered: 'Entregado',
  in_transit: 'En Tránsito',
  pending: 'Pendiente',
  exception: 'Novedad',
};

const getStatusIcon = (status: MapStatus) => {
  const icons = {
    delivered: CheckCircle,
    in_transit: Truck,
    pending: Clock,
    exception: AlertTriangle,
  };
  return icons[status] || Package;
};

const mapShipmentStatus = (shipment: Shipment): MapStatus => {
  const statusStr = String(shipment.status).toUpperCase();
  if (statusStr.includes('ENTREGADO') || statusStr.includes('DELIVERED')) return 'delivered';
  if (statusStr.includes('REPARTO') || statusStr.includes('TRANSIT') || statusStr.includes('TRÁNSITO')) return 'in_transit';
  if (statusStr.includes('NOVEDAD') || statusStr.includes('ISSUE') || statusStr.includes('EXCEPTION')) return 'exception';
  return 'pending';
};

const extractCity = (shipment: Shipment): string => {
  const dest = shipment.detailedInfo?.destination || '';
  return dest.toUpperCase().trim();
};

// ============================================
// COLOMBIA SVG OUTLINE
// ============================================
const ColombiaSVG: React.FC<{ className?: string }> = ({ className }) => (
  <path
    className={className}
    d="M 34 5 Q 30 8, 28 12 Q 25 16, 22 20 Q 20 25, 18 30 Q 16 36, 15 42
       Q 14 48, 16 54 Q 18 60, 20 66 Q 22 72, 25 78 Q 27 82, 30 85
       Q 33 87, 35 84 Q 37 80, 38 76 Q 39 72, 40 68 Q 42 64, 45 60
       Q 48 56, 52 54 Q 56 52, 60 48 Q 64 44, 66 40 Q 68 36, 68 32
       Q 68 28, 66 24 Q 64 20, 60 16 Q 56 12, 52 10 Q 48 8, 44 6
       Q 40 4, 34 5 Z"
    fill="currentColor"
    fillOpacity="0.05"
    stroke="currentColor"
    strokeOpacity="0.15"
    strokeWidth="0.5"
  />
);

// ============================================
// CITY DOT COMPONENT
// ============================================
interface CityDotProps {
  data: CityShipmentData;
  isSelected: boolean;
  onClick: () => void;
}

const CityDot: React.FC<CityDotProps> = ({ data, isSelected, onClick }) => {
  const { city, total, dominantStatus } = data;
  const color = STATUS_COLORS[dominantStatus];
  const radius = Math.min(3.5 + Math.log2(total + 1) * 1.5, 8);

  return (
    <g
      className="cursor-pointer transition-all duration-200"
      onClick={onClick}
      style={{ filter: isSelected ? 'drop-shadow(0 0 6px rgba(0,0,0,0.3))' : undefined }}
    >
      {/* Pulse ring for active cities */}
      {total > 0 && (
        <circle
          cx={city.x}
          cy={city.y}
          r={radius + 2}
          fill={color}
          opacity={0.2}
          className={dominantStatus === 'in_transit' ? 'animate-ping' : ''}
        >
          <animate
            attributeName="r"
            from={radius + 1}
            to={radius + 4}
            dur="2s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            from="0.3"
            to="0"
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>
      )}

      {/* Main dot */}
      <circle
        cx={city.x}
        cy={city.y}
        r={isSelected ? radius + 1.5 : radius}
        fill={color}
        stroke="white"
        strokeWidth={isSelected ? 1.2 : 0.8}
        className="transition-all duration-200"
      />

      {/* Count badge */}
      {total > 0 && (
        <>
          <rect
            x={city.x + radius - 1}
            y={city.y - radius - 4}
            width={total >= 100 ? 10 : total >= 10 ? 8 : 6}
            height={5}
            rx={2.5}
            fill="#1e293b"
            stroke="white"
            strokeWidth={0.4}
          />
          <text
            x={city.x + radius + (total >= 100 ? 4 : total >= 10 ? 3 : 2)}
            y={city.y - radius - 0.8}
            textAnchor="middle"
            fill="white"
            fontSize="3"
            fontWeight="bold"
          >
            {total}
          </text>
        </>
      )}

      {/* City label */}
      <text
        x={city.x}
        y={city.y + radius + 4}
        textAnchor="middle"
        fill={isSelected ? color : '#64748b'}
        fontSize={isSelected ? '3' : '2.5'}
        fontWeight={isSelected ? 'bold' : 'normal'}
        className="transition-all duration-200"
      >
        {city.displayName}
      </text>
    </g>
  );
};

// ============================================
// MAIN SHIPMENT MAP COMPONENT
// ============================================
const ShipmentMap: React.FC<ShipmentMapProps> = ({ shipments, onSelectShipment }) => {
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<MapStatus | null>(null);

  // Group shipments by city
  const cityData = useMemo<Map<string, CityShipmentData>>(() => {
    const map = new Map<string, CityShipmentData>();

    // Initialize all cities
    COLOMBIAN_CITIES.forEach((city) => {
      map.set(city.name, {
        city,
        shipments: [],
        statusBreakdown: { delivered: 0, in_transit: 0, pending: 0, exception: 0 },
        total: 0,
        dominantStatus: 'pending',
      });
    });

    // Assign shipments to cities
    shipments.forEach((shipment) => {
      const cityName = extractCity(shipment);
      const status = mapShipmentStatus(shipment);

      // Find matching city
      let matched: string | null = null;
      for (const city of COLOMBIAN_CITIES) {
        if (
          cityName.includes(city.name) ||
          city.name.includes(cityName) ||
          cityName.includes(city.displayName.toUpperCase())
        ) {
          matched = city.name;
          break;
        }
      }

      // Default to Bogota if no match
      if (!matched) matched = 'BOGOTA';

      const entry = map.get(matched)!;
      entry.shipments.push(shipment);
      entry.statusBreakdown[status]++;
      entry.total++;
    });

    // Calculate dominant status for each city
    map.forEach((entry) => {
      if (entry.total === 0) return;
      let maxCount = 0;
      let dominant: MapStatus = 'pending';
      // Priority: exception > pending > in_transit > delivered
      const priority: MapStatus[] = ['exception', 'pending', 'in_transit', 'delivered'];
      for (const status of priority) {
        if (entry.statusBreakdown[status] > 0 && entry.statusBreakdown[status] >= maxCount) {
          // Exception always wins if any exist
          if (status === 'exception' && entry.statusBreakdown[status] > 0) {
            dominant = status;
            break;
          }
          maxCount = entry.statusBreakdown[status];
          dominant = status;
        }
      }
      entry.dominantStatus = dominant;
    });

    return map;
  }, [shipments]);

  // Top cities sorted by shipment count
  const topCities = useMemo(() => {
    return Array.from(cityData.values())
      .filter((c) => c.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [cityData]);

  // Global status totals
  const globalStats = useMemo(() => {
    const stats: Record<MapStatus, number> = { delivered: 0, in_transit: 0, pending: 0, exception: 0 };
    shipments.forEach((s) => {
      stats[mapShipmentStatus(s)]++;
    });
    return stats;
  }, [shipments]);

  // Selected city's shipments (optionally filtered by status)
  const selectedCityShipments = useMemo(() => {
    if (!selectedCity) return [];
    const data = cityData.get(selectedCity);
    if (!data) return [];
    if (!statusFilter) return data.shipments;
    return data.shipments.filter((s) => mapShipmentStatus(s) === statusFilter);
  }, [selectedCity, cityData, statusFilter]);

  const selectedCityData = selectedCity ? cityData.get(selectedCity) : null;

  const handleCityClick = useCallback((cityName: string) => {
    setSelectedCity((prev) => (prev === cityName ? null : cityName));
    setStatusFilter(null);
  }, []);

  return (
    <div className="flex flex-col lg:flex-row gap-4 w-full">
      {/* Map Panel */}
      <div className="flex-1 min-w-0">
        {/* Header Stats */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-700 shadow-sm">
            <MapPin className="w-4 h-4 text-accent-500" />
            <span className="text-sm font-bold text-slate-800 dark:text-white">
              {shipments.length}
            </span>
            <span className="text-xs text-slate-500">envíos</span>
          </div>
          {(['delivered', 'in_transit', 'pending', 'exception'] as MapStatus[]).map((status) => {
            const Icon = getStatusIcon(status);
            return (
              <button
                key={status}
                onClick={() => setStatusFilter(statusFilter === status ? null : status)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                  statusFilter === status
                    ? `${STATUS_BG[status]} text-white border-transparent shadow-md`
                    : 'bg-white dark:bg-navy-900 border-slate-200 dark:border-navy-700 text-slate-600 dark:text-slate-300 hover:shadow-sm'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{STATUS_LABELS[status]}</span>
                <span className="opacity-75">({globalStats[status]})</span>
              </button>
            );
          })}
        </div>

        {/* SVG Map */}
        <div className="relative bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-navy-900 dark:via-navy-950 dark:to-navy-900 rounded-2xl border border-slate-200 dark:border-navy-700 overflow-hidden shadow-lg">
          {/* Grid background */}
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full">
              <defs>
                <pattern id="shipment-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.3" className="text-slate-400 dark:text-slate-600" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#shipment-grid)" />
            </svg>
          </div>

          <svg
            viewBox="0 0 100 100"
            className="w-full relative z-10"
            style={{ minHeight: '450px', maxHeight: '650px' }}
          >
            {/* Colombia outline */}
            <ColombiaSVG className="text-blue-400 dark:text-slate-500" />

            {/* Connection lines between cities with shipments */}
            {topCities.length > 1 &&
              topCities.slice(0, 5).map((cityA, i) =>
                topCities.slice(i + 1, 5).map((cityB) => (
                  <line
                    key={`${cityA.city.name}-${cityB.city.name}`}
                    x1={cityA.city.x}
                    y1={cityA.city.y}
                    x2={cityB.city.x}
                    y2={cityB.city.y}
                    stroke="#94a3b8"
                    strokeWidth="0.15"
                    strokeDasharray="1,1"
                    opacity={0.4}
                  />
                ))
              )}

            {/* City dots */}
            {Array.from(cityData.values()).map((data) => (
              <CityDot
                key={data.city.name}
                data={data}
                isSelected={selectedCity === data.city.name}
                onClick={() => handleCityClick(data.city.name)}
              />
            ))}
          </svg>

          {/* Legend overlay */}
          <div className="absolute bottom-3 left-3 bg-white/90 dark:bg-navy-900/90 backdrop-blur-sm rounded-xl p-2.5 border border-slate-200/50 dark:border-navy-700/50">
            <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Estado
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {(['delivered', 'in_transit', 'pending', 'exception'] as MapStatus[]).map((status) => (
                <div key={status} className="flex items-center gap-1.5">
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: STATUS_COLORS[status] }}
                  />
                  <span className="text-[10px] text-slate-600 dark:text-slate-300">
                    {STATUS_LABELS[status]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Side Panel */}
      <div className="lg:w-80 flex-shrink-0 space-y-4">
        {/* Top Cities List */}
        <div className="bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-700 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-navy-800">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-accent-500" />
              Ciudades Principales
            </h3>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {topCities.length === 0 ? (
              <div className="p-4 text-center text-sm text-slate-400">
                Sin envíos activos
              </div>
            ) : (
              topCities.map((data, index) => (
                <button
                  key={data.city.name}
                  onClick={() => handleCityClick(data.city.name)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all hover:bg-slate-50 dark:hover:bg-navy-800 ${
                    selectedCity === data.city.name
                      ? 'bg-accent-50 dark:bg-accent-900/20 border-l-2 border-accent-500'
                      : 'border-l-2 border-transparent'
                  }`}
                >
                  <span className="text-xs font-mono text-slate-400 w-5">
                    {index + 1}.
                  </span>
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: STATUS_COLORS[data.dominantStatus] }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                      {data.city.displayName}
                    </p>
                    <div className="flex gap-2 mt-0.5">
                      {(['delivered', 'in_transit', 'pending', 'exception'] as MapStatus[]).map(
                        (status) =>
                          data.statusBreakdown[status] > 0 && (
                            <span
                              key={status}
                              className="text-[10px] font-medium"
                              style={{ color: STATUS_COLORS[status] }}
                            >
                              {data.statusBreakdown[status]}
                            </span>
                          )
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-bold text-slate-800 dark:text-white">
                      {data.total}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Selected City Detail Panel */}
        {selectedCityData && selectedCityData.total > 0 && (
          <div className="bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-700 shadow-sm overflow-hidden">
            {/* City Header */}
            <div className="px-4 py-3 border-b border-slate-100 dark:border-navy-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" style={{ color: STATUS_COLORS[selectedCityData.dominantStatus] }} />
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                  {selectedCityData.city.displayName}
                </h3>
                <span className="text-xs text-slate-500">
                  ({selectedCityData.total} envíos)
                </span>
              </div>
              <button
                onClick={() => setSelectedCity(null)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-navy-800 rounded-lg transition-colors"
              >
                <X className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>

            {/* Status Breakdown */}
            <div className="px-4 py-2 flex gap-1.5 border-b border-slate-100 dark:border-navy-800">
              {(['delivered', 'in_transit', 'pending', 'exception'] as MapStatus[]).map((status) => {
                const count = selectedCityData.statusBreakdown[status];
                if (count === 0) return null;
                return (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(statusFilter === status ? null : status)}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-all ${
                      statusFilter === status
                        ? `${STATUS_BG[status]} text-white`
                        : `${STATUS_BG_LIGHT[status]} ${STATUS_TEXT[status]}`
                    }`}
                  >
                    {STATUS_LABELS[status]}
                    <span className="font-bold">{count}</span>
                  </button>
                );
              })}
            </div>

            {/* Shipment List */}
            <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-navy-800">
              {selectedCityShipments.map((shipment) => {
                const status = mapShipmentStatus(shipment);
                const Icon = getStatusIcon(status);
                return (
                  <button
                    key={shipment.id}
                    onClick={() => onSelectShipment?.(shipment)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-navy-800 transition-colors"
                  >
                    <div
                      className="p-1.5 rounded-lg flex-shrink-0"
                      style={{ backgroundColor: `${STATUS_COLORS[status]}15` }}
                    >
                      <Icon className="w-3.5 h-3.5" style={{ color: STATUS_COLORS[status] }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate font-mono">
                        {shipment.id}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        {String(shipment.carrier)} · {String(shipment.status)}
                      </p>
                    </div>
                    <Eye className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  </button>
                );
              })}
              {selectedCityShipments.length === 0 && (
                <div className="p-4 text-center text-xs text-slate-400">
                  <Filter className="w-4 h-4 mx-auto mb-1 opacity-50" />
                  Sin envíos con este filtro
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShipmentMap;
