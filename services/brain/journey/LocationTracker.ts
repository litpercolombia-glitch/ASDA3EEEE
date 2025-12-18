// services/brain/journey/LocationTracker.ts
// Rastrea ubicaciones y calcula rutas de envíos

import { ShipmentEvent, DataSource } from '../types/brain.types';

export interface LocationPoint {
  name: string;
  normalizedName: string;
  timestamp: Date;
  source: DataSource;
  coordinates?: {
    lat: number;
    lng: number;
  };
  type: 'origin' | 'transit' | 'distribution' | 'destination' | 'current';
}

export interface LocationHistory {
  points: LocationPoint[];
  origin: LocationPoint | null;
  destination: LocationPoint | null;
  currentLocation: LocationPoint | null;
  totalStops: number;
  estimatedProgress: number; // 0-100
  route: string[]; // Lista de ciudades en orden
}

// Coordenadas aproximadas de ciudades colombianas principales
const COLOMBIA_CITIES: Record<string, { lat: number; lng: number; department: string }> = {
  bogota: { lat: 4.711, lng: -74.0721, department: 'Cundinamarca' },
  medellin: { lat: 6.2442, lng: -75.5812, department: 'Antioquia' },
  cali: { lat: 3.4516, lng: -76.532, department: 'Valle del Cauca' },
  barranquilla: { lat: 10.9685, lng: -74.7813, department: 'Atlántico' },
  cartagena: { lat: 10.3997, lng: -75.5144, department: 'Bolívar' },
  bucaramanga: { lat: 7.1254, lng: -73.1198, department: 'Santander' },
  cucuta: { lat: 7.8939, lng: -72.5078, department: 'Norte de Santander' },
  pereira: { lat: 4.8133, lng: -75.6961, department: 'Risaralda' },
  manizales: { lat: 5.0689, lng: -75.5174, department: 'Caldas' },
  ibague: { lat: 4.4389, lng: -75.2322, department: 'Tolima' },
  santa_marta: { lat: 11.2404, lng: -74.199, department: 'Magdalena' },
  villavicencio: { lat: 4.142, lng: -73.6266, department: 'Meta' },
  pasto: { lat: 1.2136, lng: -77.2811, department: 'Nariño' },
  monteria: { lat: 8.7479, lng: -75.8814, department: 'Córdoba' },
  neiva: { lat: 2.9273, lng: -75.2819, department: 'Huila' },
  armenia: { lat: 4.534, lng: -75.6811, department: 'Quindío' },
  popayan: { lat: 2.4419, lng: -76.6061, department: 'Cauca' },
  sincelejo: { lat: 9.3047, lng: -75.3978, department: 'Sucre' },
  valledupar: { lat: 10.4631, lng: -73.2532, department: 'Cesar' },
  tunja: { lat: 5.5353, lng: -73.3678, department: 'Boyacá' },
};

class LocationTrackerService {
  /**
   * Extraer historial de ubicaciones de eventos
   */
  extractFromEvents(events: ShipmentEvent[]): LocationHistory {
    const points: LocationPoint[] = [];

    events.forEach((event, index) => {
      if (event.location) {
        const point = this.createLocationPoint(event, index, events.length);
        if (point) points.push(point);
      }
    });

    // Determinar origen, destino y actual
    const origin = points.find(p => p.type === 'origin') || points[0] || null;
    const destination = points.find(p => p.type === 'destination') || null;
    const currentLocation = points[points.length - 1] || null;

    // Calcular progreso estimado
    const progress = this.calculateProgress(points, events);

    // Generar ruta de ciudades
    const route = this.generateRoute(points);

    return {
      points,
      origin,
      destination,
      currentLocation,
      totalStops: points.length,
      estimatedProgress: progress,
      route,
    };
  }

  /**
   * Crear punto de ubicación desde evento
   */
  private createLocationPoint(
    event: ShipmentEvent,
    index: number,
    totalEvents: number
  ): LocationPoint | null {
    if (!event.location) return null;

    const normalized = this.normalizeLocation(event.location);
    const coordinates = this.getCoordinates(normalized);
    const type = this.determineLocationType(event, index, totalEvents);

    return {
      name: event.location,
      normalizedName: normalized,
      timestamp: event.timestamp,
      source: event.source,
      coordinates,
      type,
    };
  }

  /**
   * Normalizar nombre de ubicación
   */
  normalizeLocation(location: string): string {
    return location
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
      .replace(/[^a-z0-9\s]/g, '') // Solo alfanuméricos
      .trim()
      .replace(/\s+/g, '_');
  }

  /**
   * Obtener coordenadas aproximadas
   */
  private getCoordinates(normalizedLocation: string): { lat: number; lng: number } | undefined {
    // Buscar en ciudades conocidas
    for (const [city, data] of Object.entries(COLOMBIA_CITIES)) {
      if (normalizedLocation.includes(city)) {
        return { lat: data.lat, lng: data.lng };
      }
    }
    return undefined;
  }

  /**
   * Determinar tipo de ubicación
   */
  private determineLocationType(
    event: ShipmentEvent,
    index: number,
    totalEvents: number
  ): LocationPoint['type'] {
    // Primer evento con ubicación = origen
    if (index === 0) return 'origin';

    // Último evento = actual
    if (index === totalEvents - 1) return 'current';

    // Basado en estado
    if (event.status === 'delivered') return 'destination';
    if (event.status === 'in_distribution' || event.status === 'out_for_delivery') {
      return 'distribution';
    }

    return 'transit';
  }

  /**
   * Calcular progreso estimado del envío
   */
  private calculateProgress(
    points: LocationPoint[],
    events: ShipmentEvent[]
  ): number {
    if (events.length === 0) return 0;

    const lastEvent = events[events.length - 1];

    // Progreso basado en estado
    const statusProgress: Record<string, number> = {
      pending: 5,
      picked_up: 15,
      in_transit: 40,
      in_distribution: 65,
      out_for_delivery: 85,
      in_office: 90,
      delivered: 100,
      issue: 50,
      returned: 100,
      cancelled: 100,
    };

    return statusProgress[lastEvent.status] || 30;
  }

  /**
   * Generar ruta de ciudades
   */
  private generateRoute(points: LocationPoint[]): string[] {
    const cities: string[] = [];
    const seen = new Set<string>();

    points.forEach(point => {
      // Extraer ciudad del nombre
      const city = this.extractCity(point.name);
      if (city && !seen.has(city.toLowerCase())) {
        seen.add(city.toLowerCase());
        cities.push(city);
      }
    });

    return cities;
  }

  /**
   * Extraer nombre de ciudad de una ubicación
   */
  private extractCity(location: string): string | null {
    // Buscar en ciudades conocidas
    const normalized = this.normalizeLocation(location);
    for (const city of Object.keys(COLOMBIA_CITIES)) {
      if (normalized.includes(city)) {
        // Capitalizar primera letra
        return city.charAt(0).toUpperCase() + city.slice(1);
      }
    }

    // Si no encontró, usar la primera parte antes de coma
    const parts = location.split(',');
    return parts[0]?.trim() || null;
  }

  /**
   * Calcular distancia entre dos puntos
   */
  calculateDistance(
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number }
  ): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = this.toRad(point2.lat - point1.lat);
    const dLon = this.toRad(point2.lng - point1.lng);
    const lat1 = this.toRad(point1.lat);
    const lat2 = this.toRad(point2.lat);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  private toRad(value: number): number {
    return (value * Math.PI) / 180;
  }

  /**
   * Obtener información de ciudad colombiana
   */
  getCityInfo(cityName: string): {
    name: string;
    department: string;
    coordinates: { lat: number; lng: number };
  } | null {
    const normalized = this.normalizeLocation(cityName);
    for (const [city, data] of Object.entries(COLOMBIA_CITIES)) {
      if (normalized.includes(city)) {
        return {
          name: city.charAt(0).toUpperCase() + city.slice(1),
          department: data.department,
          coordinates: { lat: data.lat, lng: data.lng },
        };
      }
    }
    return null;
  }
}

// Singleton
export const locationTracker = new LocationTrackerService();
export default locationTracker;
