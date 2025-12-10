// ============================================
// PREDICCIÓN ANTICIPATORIA DE DEMANDA
// ============================================

import { Country } from './country';

export interface DemandPrediction {
  date: string;
  dayOfWeek: string;
  predictedVolume: number;
  confidenceLevel: number; // 0-100
  confidenceRange: {
    min: number;
    max: number;
  };
  isHighDemand: boolean;
  isPeak: boolean;
  factors: DemandFactor[];
}

export interface DemandFactor {
  type: 'seasonal' | 'event' | 'historical' | 'trend' | 'calendar';
  name: string;
  impact: number; // -100 a 100 (negativo reduce, positivo aumenta)
  description: string;
}

export interface CityDemandPrediction {
  city: string;
  country: Country;
  predictedVolume: number;
  percentage: number; // del total
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
}

export interface DemandAlert {
  id: string;
  type: 'peak' | 'low' | 'event' | 'trend';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  date: string;
  predictedImpact: number; // porcentaje de cambio
  recommendations: string[];
  dismissed: boolean;
  createdAt: string;
}

export interface SeasonalPattern {
  name: string;
  startDate: string;
  endDate: string;
  averageIncrease: number; // porcentaje
  affectedCities: string[];
  description: string;
  recommendations: string[];
}

export interface DemandForecast {
  country: Country;
  generatedAt: string;
  periodStart: string;
  periodEnd: string;
  totalPredictedVolume: number;
  averageDailyVolume: number;
  peakDay: {
    date: string;
    volume: number;
  };
  lowDay: {
    date: string;
    volume: number;
  };
  dailyPredictions: DemandPrediction[];
  cityBreakdown: CityDemandPrediction[];
  alerts: DemandAlert[];
  seasonalPatterns: SeasonalPattern[];
  estimatedBudget: {
    total: number;
    perDay: number;
    breakdown: {
      carrierId: string;
      carrierName: string;
      amount: number;
      percentage: number;
    }[];
  };
}

export interface HistoricalDataPoint {
  date: string;
  volume: number;
  revenue: number;
  topCities: { city: string; count: number }[];
  topCarriers: { carrier: string; count: number }[];
  dayOfWeek: number;
  isHoliday: boolean;
  eventName?: string;
}

export interface DemandAnalyticsConfig {
  lookbackDays: number; // Días de historial a analizar
  forecastDays: number; // Días a predecir
  confidenceThreshold: number; // Umbral de confianza mínimo
  peakThreshold: number; // % sobre promedio para considerar pico
  lowThreshold: number; // % bajo promedio para considerar bajo
}

// Eventos especiales por país
export const SPECIAL_EVENTS: Record<Country, { date: string; name: string; impact: number }[]> = {
  COLOMBIA: [
    { date: '2025-11-29', name: 'Black Friday', impact: 180 },
    { date: '2025-12-01', name: 'Cyber Monday', impact: 150 },
    { date: '2025-12-24', name: 'Nochebuena', impact: 200 },
    { date: '2025-12-31', name: 'Fin de Año', impact: 120 },
    { date: '2025-05-11', name: 'Día de la Madre', impact: 250 },
    { date: '2025-06-15', name: 'Día del Padre', impact: 130 },
    { date: '2025-09-20', name: 'Día del Amor y Amistad', impact: 180 },
    { date: '2025-10-31', name: 'Halloween', impact: 90 },
  ],
  ECUADOR: [
    { date: '2025-11-29', name: 'Black Friday', impact: 160 },
    { date: '2025-12-24', name: 'Nochebuena', impact: 190 },
    { date: '2025-05-11', name: 'Día de la Madre', impact: 220 },
    { date: '2025-06-15', name: 'Día del Padre', impact: 120 },
    { date: '2025-02-12', name: 'Carnaval', impact: 100 },
    { date: '2025-11-02', name: 'Día de los Difuntos', impact: 80 },
  ],
  CHILE: [
    { date: '2025-11-29', name: 'Black Friday', impact: 170 },
    { date: '2025-12-01', name: 'Cyber Monday', impact: 200 },
    { date: '2025-12-24', name: 'Nochebuena', impact: 180 },
    { date: '2025-05-11', name: 'Día de la Madre', impact: 230 },
    { date: '2025-09-18', name: 'Fiestas Patrias', impact: 140 },
    { date: '2025-05-21', name: 'Día de las Glorias Navales', impact: 60 },
  ],
};

// Configuración por defecto
export const DEFAULT_DEMAND_CONFIG: DemandAnalyticsConfig = {
  lookbackDays: 365,
  forecastDays: 30,
  confidenceThreshold: 70,
  peakThreshold: 50,
  lowThreshold: -30,
};
