// components/maps/TrackingMap.tsx
// Mapa de Tracking en Tiempo Real - Estilo Amazon Logistics
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  MapPin,
  Package,
  Truck,
  CheckCircle,
  AlertTriangle,
  Clock,
  Navigation,
  Maximize2,
  Minimize2,
  Layers,
  Filter,
  RefreshCw,
  Search,
  X,
  ChevronRight,
  Phone,
  MessageSquare,
  Building2,
  Home,
  Route,
  Target,
  Zap,
  Eye,
  EyeOff,
} from 'lucide-react';

// ============================================
// TYPES
// ============================================
export interface MapLocation {
  lat: number;
  lng: number;
}

export interface TrackingPoint {
  id: string;
  guideNumber: string;
  location: MapLocation;
  status: 'delivered' | 'in_transit' | 'pending' | 'issue' | 'in_office';
  carrier: string;
  city: string;
  lastUpdate: Date;
  destination?: MapLocation;
  phone?: string;
  customerName?: string;
  estimatedDelivery?: Date;
  route?: MapLocation[];
}

interface MapFilters {
  status: string[];
  carriers: string[];
  showRoutes: boolean;
  showClusters: boolean;
}

// ============================================
// COLOMBIA CITIES COORDINATES (Sample)
// ============================================
const COLOMBIA_CITIES: Record<string, MapLocation> = {
  'BOGOTA': { lat: 4.7110, lng: -74.0721 },
  'MEDELLIN': { lat: 6.2442, lng: -75.5812 },
  'CALI': { lat: 3.4516, lng: -76.5320 },
  'BARRANQUILLA': { lat: 10.9685, lng: -74.7813 },
  'CARTAGENA': { lat: 10.3910, lng: -75.4794 },
  'BUCARAMANGA': { lat: 7.1193, lng: -73.1227 },
  'CUCUTA': { lat: 7.8891, lng: -72.4967 },
  'PEREIRA': { lat: 4.8133, lng: -75.6961 },
  'MANIZALES': { lat: 5.0689, lng: -75.5174 },
  'IBAGUE': { lat: 4.4389, lng: -75.2322 },
  'SANTA MARTA': { lat: 11.2404, lng: -74.2110 },
  'VILLAVICENCIO': { lat: 4.1420, lng: -73.6266 },
  'PASTO': { lat: 1.2136, lng: -77.2811 },
  'NEIVA': { lat: 2.9273, lng: -75.2819 },
  'ARMENIA': { lat: 4.5339, lng: -75.6811 },
};

// ============================================
// HELPER FUNCTIONS
// ============================================
const getStatusColor = (status: TrackingPoint['status']): string => {
  const colors = {
    delivered: '#10b981',
    in_transit: '#3b82f6',
    pending: '#f59e0b',
    issue: '#ef4444',
    in_office: '#8b5cf6',
  };
  return colors[status] || '#6b7280';
};

const getStatusLabel = (status: TrackingPoint['status']): string => {
  const labels = {
    delivered: 'Entregado',
    in_transit: 'En Tránsito',
    pending: 'Pendiente',
    issue: 'Con Novedad',
    in_office: 'En Oficina',
  };
  return labels[status] || status;
};

const getStatusIcon = (status: TrackingPoint['status']) => {
  const icons = {
    delivered: CheckCircle,
    in_transit: Truck,
    pending: Clock,
    issue: AlertTriangle,
    in_office: Building2,
  };
  return icons[status] || Package;
};

// Get approximate coordinates for a city
const getCityCoordinates = (cityName: string): MapLocation => {
  const normalized = cityName.toUpperCase().trim();

  // Try exact match first
  if (COLOMBIA_CITIES[normalized]) {
    return COLOMBIA_CITIES[normalized];
  }

  // Try partial match
  for (const [city, coords] of Object.entries(COLOMBIA_CITIES)) {
    if (normalized.includes(city) || city.includes(normalized)) {
      return coords;
    }
  }

  // Default to Bogotá with some randomness
  return {
    lat: 4.7110 + (Math.random() - 0.5) * 0.1,
    lng: -74.0721 + (Math.random() - 0.5) * 0.1,
  };
};

// ============================================
// MAP MARKER COMPONENT (SVG-based)
// ============================================
interface MapMarkerProps {
  point: TrackingPoint;
  isSelected: boolean;
  onClick: () => void;
  scale?: number;
}

const MapMarker: React.FC<MapMarkerProps> = ({ point, isSelected, onClick, scale = 1 }) => {
  const color = getStatusColor(point.status);
  const Icon = getStatusIcon(point.status);

  return (
    <button
      onClick={onClick}
      className={`absolute transform -translate-x-1/2 -translate-y-full transition-all duration-200 ${
        isSelected ? 'z-20 scale-125' : 'z-10 hover:scale-110'
      }`}
      style={{
        filter: isSelected ? 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
      }}
    >
      {/* Marker Pin */}
      <div className="relative">
        <svg width={40 * scale} height={52 * scale} viewBox="0 0 40 52" fill="none">
          <path
            d="M20 0C8.954 0 0 8.954 0 20c0 14.5 20 32 20 32s20-17.5 20-32C40 8.954 31.046 0 20 0z"
            fill={color}
          />
          <circle cx="20" cy="20" r="12" fill="white" />
        </svg>
        <div
          className="absolute top-2 left-1/2 -translate-x-1/2 p-1.5 rounded-full"
          style={{ backgroundColor: color }}
        >
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>

      {/* Pulse animation for in-transit */}
      {point.status === 'in_transit' && (
        <div
          className="absolute top-5 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full animate-ping opacity-30"
          style={{ backgroundColor: color }}
        />
      )}
    </button>
  );
};

// ============================================
// MAP INFO CARD
// ============================================
interface MapInfoCardProps {
  point: TrackingPoint;
  onClose: () => void;
  onCall?: (phone: string) => void;
  onWhatsApp?: (phone: string) => void;
  onViewDetails?: (guideNumber: string) => void;
}

const MapInfoCard: React.FC<MapInfoCardProps> = ({
  point,
  onClose,
  onCall,
  onWhatsApp,
  onViewDetails,
}) => {
  const Icon = getStatusIcon(point.status);
  const color = getStatusColor(point.status);

  return (
    <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-white dark:bg-navy-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-navy-700 overflow-hidden z-30 animate-slide-up">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 dark:border-navy-800">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-xl"
              style={{ backgroundColor: `${color}20` }}
            >
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white">
                {point.guideNumber}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {point.carrier}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-navy-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-500 dark:text-slate-400">Estado</span>
          <span
            className="px-2.5 py-1 rounded-full text-xs font-bold text-white"
            style={{ backgroundColor: color }}
          >
            {getStatusLabel(point.status)}
          </span>
        </div>

        {/* City */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-500 dark:text-slate-400">Ciudad</span>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {point.city}
          </span>
        </div>

        {/* Customer */}
        {point.customerName && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500 dark:text-slate-400">Cliente</span>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
              {point.customerName}
            </span>
          </div>
        )}

        {/* Last Update */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-500 dark:text-slate-400">Última actualización</span>
          <span className="text-sm text-slate-600 dark:text-slate-300">
            {new Date(point.lastUpdate).toLocaleString('es-CO', {
              hour: '2-digit',
              minute: '2-digit',
              day: '2-digit',
              month: 'short',
            })}
          </span>
        </div>

        {/* Estimated Delivery */}
        {point.estimatedDelivery && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500 dark:text-slate-400">Entrega estimada</span>
            <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
              {new Date(point.estimatedDelivery).toLocaleDateString('es-CO')}
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-4 pt-0 flex gap-2">
        {point.phone && (
          <>
            <button
              onClick={() => onCall?.(point.phone!)}
              className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              <Phone className="w-4 h-4" />
              Llamar
            </button>
            <button
              onClick={() => onWhatsApp?.(point.phone!)}
              className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              WhatsApp
            </button>
          </>
        )}
        <button
          onClick={() => onViewDetails?.(point.guideNumber)}
          className="flex-1 py-2 bg-accent-500 hover:bg-accent-600 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 transition-colors"
        >
          <Eye className="w-4 h-4" />
          Detalles
        </button>
      </div>
    </div>
  );
};

// ============================================
// MAIN TRACKING MAP COMPONENT
// ============================================
interface TrackingMapProps {
  shipments: any[];
  onSelectGuide?: (guideNumber: string) => void;
  className?: string;
  initialCenter?: MapLocation;
  initialZoom?: number;
}

export const TrackingMap: React.FC<TrackingMapProps> = ({
  shipments,
  onSelectGuide,
  className = '',
  initialCenter = COLOMBIA_CITIES['BOGOTA'],
  initialZoom = 6,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<TrackingPoint | null>(null);
  const [filters, setFilters] = useState<MapFilters>({
    status: [],
    carriers: [],
    showRoutes: false,
    showClusters: true,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mapCenter, setMapCenter] = useState(initialCenter);
  const [zoom, setZoom] = useState(initialZoom);

  // Convert shipments to tracking points
  const trackingPoints = useMemo<TrackingPoint[]>(() => {
    return shipments.map((shipment) => {
      const city = shipment.detailedInfo?.city || 'BOGOTA';
      const location = getCityCoordinates(city);

      // Map status
      let status: TrackingPoint['status'] = 'pending';
      if (shipment.status === 'DELIVERED') status = 'delivered';
      else if (shipment.status === 'IN_TRANSIT') status = 'in_transit';
      else if (shipment.status === 'EXCEPTION' || shipment.status === 'RETURNED') status = 'issue';
      else if (shipment.status === 'IN_OFFICE') status = 'in_office';

      return {
        id: shipment.id,
        guideNumber: shipment.id,
        location,
        status,
        carrier: shipment.carrier || 'UNKNOWN',
        city,
        lastUpdate: shipment.detailedInfo?.lastUpdate || new Date(),
        phone: shipment.phone,
        customerName: shipment.detailedInfo?.customerName,
      };
    });
  }, [shipments]);

  // Filter points
  const filteredPoints = useMemo(() => {
    let points = trackingPoints;

    if (filters.status.length > 0) {
      points = points.filter((p) => filters.status.includes(p.status));
    }

    if (filters.carriers.length > 0) {
      points = points.filter((p) => filters.carriers.includes(p.carrier));
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      points = points.filter(
        (p) =>
          p.guideNumber.toLowerCase().includes(query) ||
          p.city.toLowerCase().includes(query) ||
          p.carrier.toLowerCase().includes(query)
      );
    }

    return points;
  }, [trackingPoints, filters, searchQuery]);

  // Get unique carriers
  const carriers = useMemo(() => {
    return Array.from(new Set(trackingPoints.map((p) => p.carrier)));
  }, [trackingPoints]);

  // Status counts
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      delivered: 0,
      in_transit: 0,
      pending: 0,
      issue: 0,
      in_office: 0,
    };
    trackingPoints.forEach((p) => {
      counts[p.status]++;
    });
    return counts;
  }, [trackingPoints]);

  // Handle marker click
  const handleMarkerClick = useCallback((point: TrackingPoint) => {
    setSelectedPoint(point);
    setMapCenter(point.location);
  }, []);

  // Handle actions
  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const handleWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/57${cleanPhone}`, '_blank');
  };

  // Calculate marker positions (simple projection)
  const getMarkerPosition = useCallback(
    (location: MapLocation, containerWidth: number, containerHeight: number) => {
      // Simple mercator-like projection for Colombia
      const latRange = { min: -4, max: 13 }; // Colombia latitude range
      const lngRange = { min: -82, max: -66 }; // Colombia longitude range

      const x = ((location.lng - lngRange.min) / (lngRange.max - lngRange.min)) * containerWidth;
      const y = ((latRange.max - location.lat) / (latRange.max - latRange.min)) * containerHeight;

      return { x, y };
    },
    []
  );

  return (
    <div
      className={`relative bg-slate-100 dark:bg-navy-950 rounded-2xl overflow-hidden ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''
      } ${className}`}
      style={{ height: isFullscreen ? '100vh' : '600px' }}
    >
      {/* Map Background (Stylized) */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-navy-900 dark:to-navy-950">
        {/* Grid lines */}
        <svg className="absolute inset-0 w-full h-full opacity-20 dark:opacity-10">
          <defs>
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-blue-300 dark:text-slate-600" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Colombia silhouette hint */}
        <div className="absolute inset-0 flex items-center justify-center opacity-5 dark:opacity-10">
          <MapPin className="w-96 h-96 text-slate-400" />
        </div>
      </div>

      {/* Map Markers */}
      <div className="absolute inset-0" id="map-container">
        {filteredPoints.map((point) => {
          const container = document.getElementById('map-container');
          if (!container) return null;

          const pos = getMarkerPosition(
            point.location,
            container.offsetWidth || 800,
            container.offsetHeight || 600
          );

          return (
            <div
              key={point.id}
              style={{
                position: 'absolute',
                left: `${Math.min(Math.max(pos.x, 20), (container.offsetWidth || 800) - 20)}px`,
                top: `${Math.min(Math.max(pos.y, 40), (container.offsetHeight || 600) - 20)}px`,
              }}
            >
              <MapMarker
                point={point}
                isSelected={selectedPoint?.id === point.id}
                onClick={() => handleMarkerClick(point)}
              />
            </div>
          );
        })}
      </div>

      {/* Top Controls */}
      <div className="absolute top-4 left-4 right-4 flex items-center gap-2 z-20">
        {/* Search */}
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar guía, ciudad..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
          />
        </div>

        {/* Filter Button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`p-2.5 rounded-xl transition-colors ${
            showFilters || filters.status.length > 0 || filters.carriers.length > 0
              ? 'bg-accent-500 text-white'
              : 'bg-white dark:bg-navy-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-navy-700'
          }`}
        >
          <Filter className="w-5 h-5" />
        </button>

        {/* Fullscreen Button */}
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="p-2.5 bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl text-slate-600 dark:text-slate-300"
        >
          {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="absolute top-20 left-4 w-72 bg-white dark:bg-navy-900 rounded-xl shadow-lg border border-slate-200 dark:border-navy-700 p-4 z-20 animate-fade-in">
          <h4 className="font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filtros
          </h4>

          {/* Status Filters */}
          <div className="mb-4">
            <p className="text-xs font-medium text-slate-500 uppercase mb-2">Estado</p>
            <div className="flex flex-wrap gap-2">
              {(['delivered', 'in_transit', 'pending', 'issue', 'in_office'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    setFilters((prev) => ({
                      ...prev,
                      status: prev.status.includes(status)
                        ? prev.status.filter((s) => s !== status)
                        : [...prev.status, status],
                    }));
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
                    filters.status.includes(status)
                      ? 'text-white'
                      : 'bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300'
                  }`}
                  style={{
                    backgroundColor: filters.status.includes(status) ? getStatusColor(status) : undefined,
                  }}
                >
                  {getStatusLabel(status)}
                  <span className="opacity-70">({statusCounts[status]})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Carrier Filters */}
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase mb-2">Transportadora</p>
            <div className="flex flex-wrap gap-2">
              {carriers.slice(0, 6).map((carrier) => (
                <button
                  key={carrier}
                  onClick={() => {
                    setFilters((prev) => ({
                      ...prev,
                      carriers: prev.carriers.includes(carrier)
                        ? prev.carriers.filter((c) => c !== carrier)
                        : [...prev.carriers, carrier],
                    }));
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    filters.carriers.includes(carrier)
                      ? 'bg-accent-500 text-white'
                      : 'bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {carrier}
                </button>
              ))}
            </div>
          </div>

          {/* Clear Filters */}
          {(filters.status.length > 0 || filters.carriers.length > 0) && (
            <button
              onClick={() => setFilters({ status: [], carriers: [], showRoutes: false, showClusters: true })}
              className="mt-3 w-full py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white dark:bg-navy-900 rounded-xl shadow-lg border border-slate-200 dark:border-navy-700 p-3 z-10">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Leyenda</p>
        <div className="space-y-1.5">
          {(['delivered', 'in_transit', 'pending', 'issue'] as const).map((status) => {
            const Icon = getStatusIcon(status);
            return (
              <div key={status} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getStatusColor(status) }}
                />
                <Icon className="w-3 h-3" style={{ color: getStatusColor(status) }} />
                <span className="text-xs text-slate-600 dark:text-slate-300">
                  {getStatusLabel(status)} ({statusCounts[status]})
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats Badge */}
      <div className="absolute top-4 right-20 bg-white dark:bg-navy-900 rounded-xl shadow-lg border border-slate-200 dark:border-navy-700 px-4 py-2 z-10">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-lg font-bold text-slate-800 dark:text-white">{filteredPoints.length}</p>
            <p className="text-xs text-slate-500">Guías</p>
          </div>
          <div className="h-8 w-px bg-slate-200 dark:bg-navy-700" />
          <div className="text-center">
            <p className="text-lg font-bold text-emerald-500">{statusCounts.delivered}</p>
            <p className="text-xs text-slate-500">Entregadas</p>
          </div>
          <div className="h-8 w-px bg-slate-200 dark:bg-navy-700" />
          <div className="text-center">
            <p className="text-lg font-bold text-blue-500">{statusCounts.in_transit}</p>
            <p className="text-xs text-slate-500">En Tránsito</p>
          </div>
        </div>
      </div>

      {/* Selected Point Info Card */}
      {selectedPoint && (
        <MapInfoCard
          point={selectedPoint}
          onClose={() => setSelectedPoint(null)}
          onCall={handleCall}
          onWhatsApp={handleWhatsApp}
          onViewDetails={onSelectGuide}
        />
      )}

      {/* Empty State */}
      {filteredPoints.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <MapPin className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-600 dark:text-slate-300">
              No hay guías para mostrar
            </h3>
            <p className="text-sm text-slate-400 mt-1">
              {searchQuery || filters.status.length > 0
                ? 'Prueba ajustando los filtros'
                : 'Carga guías para verlas en el mapa'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackingMap;
