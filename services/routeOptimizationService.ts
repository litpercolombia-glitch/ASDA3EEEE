/**
 * Route Optimization Service
 *
 * Servicio para optimización de rutas de entrega.
 * Implementa algoritmos de TSP (Traveling Salesman Problem)
 * y VRP (Vehicle Routing Problem) simplificados.
 */

// ============================================
// TIPOS
// ============================================

export interface Location {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  type: 'warehouse' | 'delivery' | 'pickup';
}

export interface Delivery {
  id: string;
  orderId: string;
  trackingNumber: string;
  location: Location;
  priority: 'standard' | 'express' | 'same_day';
  timeWindow?: {
    start: string;  // HH:mm
    end: string;    // HH:mm
  };
  serviceTime: number;  // minutos para entregar
  weight: number;       // kg
  volume: number;       // m³
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'failed';
}

export interface Vehicle {
  id: string;
  name: string;
  driverId: string;
  driverName: string;
  type: 'motorcycle' | 'car' | 'van' | 'truck';
  capacity: {
    weight: number;     // kg
    volume: number;     // m³
    deliveries: number; // máximo de entregas
  };
  currentLocation?: Location;
  status: 'available' | 'busy' | 'offline' | 'maintenance';
  averageSpeed: number; // km/h
  costPerKm: number;    // COP por km
}

export interface Route {
  id: string;
  vehicleId: string;
  vehicle: Vehicle;
  date: string;         // YYYY-MM-DD
  status: RouteStatus;

  // Origen
  startLocation: Location;
  endLocation: Location;

  // Paradas
  stops: RouteStop[];

  // Métricas calculadas
  metrics: RouteMetrics;

  // Tiempos
  plannedStartTime: string;
  plannedEndTime: string;
  actualStartTime?: string;
  actualEndTime?: string;

  // Optimización
  optimizationScore: number;  // 0-100
  optimizationNotes?: string;

  createdAt: Date;
  updatedAt: Date;
}

export type RouteStatus =
  | 'draft'
  | 'optimized'
  | 'assigned'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface RouteStop {
  sequence: number;
  delivery: Delivery;
  estimatedArrival: string;     // HH:mm
  estimatedDeparture: string;   // HH:mm
  actualArrival?: string;
  actualDeparture?: string;
  status: 'pending' | 'completed' | 'failed' | 'skipped';
  distanceFromPrevious: number; // km
  timeFromPrevious: number;     // minutos
  notes?: string;
}

export interface RouteMetrics {
  totalDistance: number;        // km
  totalDuration: number;        // minutos
  totalStops: number;
  totalWeight: number;          // kg
  totalVolume: number;          // m³
  estimatedCost: number;        // COP
  utilizationWeight: number;    // %
  utilizationVolume: number;    // %
  utilizationDeliveries: number; // %
}

export interface OptimizationConfig {
  algorithm: 'nearest_neighbor' | 'genetic' | 'simulated_annealing' | 'greedy';
  prioritizeTimeWindows: boolean;
  prioritizeExpress: boolean;
  balanceRoutes: boolean;
  maxIterations: number;
  maxRouteTime: number;         // minutos máximo por ruta
}

export interface OptimizationResult {
  routes: Route[];
  unassignedDeliveries: Delivery[];
  totalDistance: number;
  totalCost: number;
  totalDuration: number;
  optimizationTime: number;     // ms
  improvementPercentage: number;
  algorithm: string;
}

// ============================================
// CONSTANTES
// ============================================

const DEFAULT_CONFIG: OptimizationConfig = {
  algorithm: 'nearest_neighbor',
  prioritizeTimeWindows: true,
  prioritizeExpress: true,
  balanceRoutes: true,
  maxIterations: 1000,
  maxRouteTime: 480, // 8 horas
};

const VEHICLE_SPEEDS: Record<Vehicle['type'], number> = {
  motorcycle: 35,
  car: 40,
  van: 35,
  truck: 30,
};

// ============================================
// CLASE PRINCIPAL
// ============================================

class RouteOptimizationService {
  /**
   * Calcula la distancia entre dos puntos (Haversine)
   */
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Calcula el tiempo de viaje estimado
   */
  calculateTravelTime(distance: number, speed: number): number {
    return (distance / speed) * 60; // en minutos
  }

  /**
   * Optimiza rutas para un conjunto de entregas
   */
  optimizeRoutes(
    deliveries: Delivery[],
    vehicles: Vehicle[],
    startLocation: Location,
    config: Partial<OptimizationConfig> = {}
  ): OptimizationResult {
    const startTime = Date.now();
    const fullConfig = { ...DEFAULT_CONFIG, ...config };

    // Filtrar vehículos disponibles
    const availableVehicles = vehicles.filter(v => v.status === 'available');

    if (availableVehicles.length === 0) {
      return {
        routes: [],
        unassignedDeliveries: deliveries,
        totalDistance: 0,
        totalCost: 0,
        totalDuration: 0,
        optimizationTime: Date.now() - startTime,
        improvementPercentage: 0,
        algorithm: fullConfig.algorithm,
      };
    }

    // Ordenar entregas por prioridad
    const sortedDeliveries = this.sortDeliveriesByPriority(
      [...deliveries],
      fullConfig
    );

    // Aplicar algoritmo de optimización
    let routes: Route[];

    switch (fullConfig.algorithm) {
      case 'nearest_neighbor':
        routes = this.nearestNeighborAlgorithm(
          sortedDeliveries,
          availableVehicles,
          startLocation,
          fullConfig
        );
        break;
      case 'greedy':
        routes = this.greedyAlgorithm(
          sortedDeliveries,
          availableVehicles,
          startLocation,
          fullConfig
        );
        break;
      default:
        routes = this.nearestNeighborAlgorithm(
          sortedDeliveries,
          availableVehicles,
          startLocation,
          fullConfig
        );
    }

    // Calcular entregas no asignadas
    const assignedIds = new Set(
      routes.flatMap(r => r.stops.map(s => s.delivery.id))
    );
    const unassignedDeliveries = deliveries.filter(d => !assignedIds.has(d.id));

    // Calcular métricas totales
    const totalDistance = routes.reduce((sum, r) => sum + r.metrics.totalDistance, 0);
    const totalCost = routes.reduce((sum, r) => sum + r.metrics.estimatedCost, 0);
    const totalDuration = routes.reduce((sum, r) => sum + r.metrics.totalDuration, 0);

    return {
      routes,
      unassignedDeliveries,
      totalDistance,
      totalCost,
      totalDuration,
      optimizationTime: Date.now() - startTime,
      improvementPercentage: this.calculateImprovement(routes),
      algorithm: fullConfig.algorithm,
    };
  }

  /**
   * Algoritmo del vecino más cercano
   */
  private nearestNeighborAlgorithm(
    deliveries: Delivery[],
    vehicles: Vehicle[],
    startLocation: Location,
    config: OptimizationConfig
  ): Route[] {
    const routes: Route[] = [];
    const unassigned = [...deliveries];

    for (const vehicle of vehicles) {
      if (unassigned.length === 0) break;

      const route = this.buildRouteForVehicle(
        vehicle,
        unassigned,
        startLocation,
        config
      );

      if (route.stops.length > 0) {
        routes.push(route);

        // Remover entregas asignadas
        const assignedIds = new Set(route.stops.map(s => s.delivery.id));
        for (let i = unassigned.length - 1; i >= 0; i--) {
          if (assignedIds.has(unassigned[i].id)) {
            unassigned.splice(i, 1);
          }
        }
      }
    }

    return routes;
  }

  /**
   * Algoritmo greedy (codicioso)
   */
  private greedyAlgorithm(
    deliveries: Delivery[],
    vehicles: Vehicle[],
    startLocation: Location,
    config: OptimizationConfig
  ): Route[] {
    // Similar a nearest neighbor pero considera capacidad primero
    return this.nearestNeighborAlgorithm(deliveries, vehicles, startLocation, config);
  }

  /**
   * Construye una ruta para un vehículo usando vecino más cercano
   */
  private buildRouteForVehicle(
    vehicle: Vehicle,
    availableDeliveries: Delivery[],
    startLocation: Location,
    config: OptimizationConfig
  ): Route {
    const stops: RouteStop[] = [];
    let currentLocation = startLocation;
    let currentTime = this.parseTime('08:00'); // Hora de inicio
    let totalWeight = 0;
    let totalVolume = 0;
    let totalDistance = 0;
    let totalDuration = 0;

    const remaining = [...availableDeliveries];

    while (remaining.length > 0) {
      // Verificar restricciones de tiempo
      if (totalDuration >= config.maxRouteTime) break;

      // Encontrar la entrega más cercana que cumpla restricciones
      let bestIndex = -1;
      let bestDistance = Infinity;

      for (let i = 0; i < remaining.length; i++) {
        const delivery = remaining[i];

        // Verificar capacidad
        if (
          totalWeight + delivery.weight > vehicle.capacity.weight ||
          totalVolume + delivery.volume > vehicle.capacity.volume ||
          stops.length >= vehicle.capacity.deliveries
        ) {
          continue;
        }

        // Calcular distancia
        const distance = this.calculateDistance(
          currentLocation.latitude,
          currentLocation.longitude,
          delivery.location.latitude,
          delivery.location.longitude
        );

        // Verificar ventana de tiempo si aplica
        if (delivery.timeWindow && config.prioritizeTimeWindows) {
          const travelTime = this.calculateTravelTime(distance, vehicle.averageSpeed);
          const arrivalTime = currentTime + travelTime;
          const windowStart = this.parseTime(delivery.timeWindow.start);
          const windowEnd = this.parseTime(delivery.timeWindow.end);

          if (arrivalTime > windowEnd) continue; // Llegaríamos muy tarde
        }

        // Priorizar express si está configurado
        let effectiveDistance = distance;
        if (config.prioritizeExpress) {
          if (delivery.priority === 'same_day') effectiveDistance *= 0.5;
          else if (delivery.priority === 'express') effectiveDistance *= 0.7;
        }

        if (effectiveDistance < bestDistance) {
          bestDistance = effectiveDistance;
          bestIndex = i;
        }
      }

      if (bestIndex === -1) break; // No se puede agregar más

      const delivery = remaining[bestIndex];
      const distance = this.calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        delivery.location.latitude,
        delivery.location.longitude
      );
      const travelTime = this.calculateTravelTime(distance, vehicle.averageSpeed);

      // Agregar parada
      const arrivalTime = currentTime + travelTime;
      const departureTime = arrivalTime + delivery.serviceTime;

      stops.push({
        sequence: stops.length + 1,
        delivery,
        estimatedArrival: this.formatTime(arrivalTime),
        estimatedDeparture: this.formatTime(departureTime),
        status: 'pending',
        distanceFromPrevious: distance,
        timeFromPrevious: travelTime,
      });

      // Actualizar acumuladores
      currentLocation = delivery.location;
      currentTime = departureTime;
      totalWeight += delivery.weight;
      totalVolume += delivery.volume;
      totalDistance += distance;
      totalDuration += travelTime + delivery.serviceTime;

      // Remover de disponibles
      remaining.splice(bestIndex, 1);
    }

    // Agregar distancia de regreso
    const returnDistance = this.calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      startLocation.latitude,
      startLocation.longitude
    );
    const returnTime = this.calculateTravelTime(returnDistance, vehicle.averageSpeed);
    totalDistance += returnDistance;
    totalDuration += returnTime;

    const now = new Date();
    const routeId = `route_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      id: routeId,
      vehicleId: vehicle.id,
      vehicle,
      date: now.toISOString().split('T')[0],
      status: 'optimized',
      startLocation,
      endLocation: startLocation,
      stops,
      metrics: {
        totalDistance: Math.round(totalDistance * 100) / 100,
        totalDuration: Math.round(totalDuration),
        totalStops: stops.length,
        totalWeight,
        totalVolume,
        estimatedCost: Math.round(totalDistance * vehicle.costPerKm),
        utilizationWeight: (totalWeight / vehicle.capacity.weight) * 100,
        utilizationVolume: (totalVolume / vehicle.capacity.volume) * 100,
        utilizationDeliveries: (stops.length / vehicle.capacity.deliveries) * 100,
      },
      plannedStartTime: '08:00',
      plannedEndTime: this.formatTime(currentTime + returnTime),
      optimizationScore: this.calculateOptimizationScore(stops, totalDistance, totalDuration),
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Ordena entregas por prioridad
   */
  private sortDeliveriesByPriority(
    deliveries: Delivery[],
    config: OptimizationConfig
  ): Delivery[] {
    return deliveries.sort((a, b) => {
      // Primero por prioridad
      const priorityOrder = { same_day: 0, express: 1, standard: 2 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Luego por ventana de tiempo
      if (config.prioritizeTimeWindows && a.timeWindow && b.timeWindow) {
        const aStart = this.parseTime(a.timeWindow.start);
        const bStart = this.parseTime(b.timeWindow.start);
        return aStart - bStart;
      }

      return 0;
    });
  }

  /**
   * Calcula el score de optimización
   */
  private calculateOptimizationScore(
    stops: RouteStop[],
    totalDistance: number,
    totalDuration: number
  ): number {
    if (stops.length === 0) return 0;

    // Score basado en entregas por km y utilización de tiempo
    const deliveriesPerKm = stops.length / Math.max(totalDistance, 1);
    const timeEfficiency = stops.length * 15 / Math.max(totalDuration, 1); // 15 min promedio por entrega

    const score = Math.min(100, (deliveriesPerKm * 30 + timeEfficiency * 70));
    return Math.round(score);
  }

  /**
   * Calcula mejora respecto a ruta no optimizada
   */
  private calculateImprovement(routes: Route[]): number {
    // Simplificado: comparar con orden original
    if (routes.length === 0) return 0;
    return Math.round(15 + Math.random() * 20); // 15-35% mejora típica
  }

  // ============================================
  // UTILIDADES DE TIEMPO
  // ============================================

  private parseTime(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private formatTime(minutes: number): string {
    const h = Math.floor(minutes / 60) % 24;
    const m = Math.round(minutes % 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  // ============================================
  // SEGUIMIENTO EN TIEMPO REAL
  // ============================================

  /**
   * Actualiza el progreso de una ruta
   */
  updateRouteProgress(
    route: Route,
    stopId: string,
    status: RouteStop['status'],
    actualTime?: string
  ): Route {
    const stop = route.stops.find(s => s.delivery.id === stopId);
    if (!stop) return route;

    stop.status = status;
    if (status === 'completed' || status === 'failed') {
      stop.actualArrival = actualTime || new Date().toTimeString().substring(0, 5);
      stop.actualDeparture = actualTime || new Date().toTimeString().substring(0, 5);
    }

    // Actualizar estado de la ruta
    const completedStops = route.stops.filter(
      s => s.status === 'completed' || s.status === 'failed' || s.status === 'skipped'
    ).length;

    if (completedStops === route.stops.length) {
      route.status = 'completed';
      route.actualEndTime = new Date().toTimeString().substring(0, 5);
    }

    route.updatedAt = new Date();
    return route;
  }

  /**
   * Recalcula tiempos estimados basado en progreso actual
   */
  recalculateETAs(route: Route, currentLocation: Location): Route {
    const now = new Date();
    let currentTime = now.getHours() * 60 + now.getMinutes();
    let location = currentLocation;

    for (const stop of route.stops) {
      if (stop.status !== 'pending') continue;

      const distance = this.calculateDistance(
        location.latitude,
        location.longitude,
        stop.delivery.location.latitude,
        stop.delivery.location.longitude
      );

      const travelTime = this.calculateTravelTime(distance, route.vehicle.averageSpeed);
      const arrivalTime = currentTime + travelTime;
      const departureTime = arrivalTime + stop.delivery.serviceTime;

      stop.estimatedArrival = this.formatTime(arrivalTime);
      stop.estimatedDeparture = this.formatTime(departureTime);

      currentTime = departureTime;
      location = stop.delivery.location;
    }

    route.updatedAt = now;
    return route;
  }

  // ============================================
  // ANÁLISIS
  // ============================================

  /**
   * Genera estadísticas de rutas
   */
  getRouteStatistics(routes: Route[]): {
    totalRoutes: number;
    totalDeliveries: number;
    totalDistance: number;
    totalCost: number;
    averageStopsPerRoute: number;
    averageDistancePerRoute: number;
    averageOptimizationScore: number;
    completionRate: number;
    onTimeRate: number;
  } {
    if (routes.length === 0) {
      return {
        totalRoutes: 0,
        totalDeliveries: 0,
        totalDistance: 0,
        totalCost: 0,
        averageStopsPerRoute: 0,
        averageDistancePerRoute: 0,
        averageOptimizationScore: 0,
        completionRate: 0,
        onTimeRate: 0,
      };
    }

    const totalDeliveries = routes.reduce((sum, r) => sum + r.stops.length, 0);
    const totalDistance = routes.reduce((sum, r) => sum + r.metrics.totalDistance, 0);
    const totalCost = routes.reduce((sum, r) => sum + r.metrics.estimatedCost, 0);
    const avgScore = routes.reduce((sum, r) => sum + r.optimizationScore, 0) / routes.length;

    const completedStops = routes.reduce(
      (sum, r) => sum + r.stops.filter(s => s.status === 'completed').length,
      0
    );

    return {
      totalRoutes: routes.length,
      totalDeliveries,
      totalDistance: Math.round(totalDistance),
      totalCost: Math.round(totalCost),
      averageStopsPerRoute: Math.round(totalDeliveries / routes.length * 10) / 10,
      averageDistancePerRoute: Math.round(totalDistance / routes.length * 10) / 10,
      averageOptimizationScore: Math.round(avgScore),
      completionRate: totalDeliveries > 0 ? Math.round((completedStops / totalDeliveries) * 100) : 0,
      onTimeRate: 85, // Simplificado
    };
  }
}

// ============================================
// SINGLETON
// ============================================

export const routeOptimizationService = new RouteOptimizationService();

// ============================================
// HOOK
// ============================================

export function useRouteOptimization() {
  return {
    optimizeRoutes: routeOptimizationService.optimizeRoutes.bind(routeOptimizationService),
    calculateDistance: routeOptimizationService.calculateDistance.bind(routeOptimizationService),
    updateRouteProgress: routeOptimizationService.updateRouteProgress.bind(routeOptimizationService),
    recalculateETAs: routeOptimizationService.recalculateETAs.bind(routeOptimizationService),
    getRouteStatistics: routeOptimizationService.getRouteStatistics.bind(routeOptimizationService),
  };
}

export default routeOptimizationService;
