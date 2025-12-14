// ============================================
// SERVICIO DE PREDICCIÓN DE DEMANDA
// ============================================

import { v4 as uuidv4 } from 'uuid';
import {
  DemandPrediction,
  DemandForecast,
  DemandAlert,
  CityDemandPrediction,
  HistoricalDataPoint,
  SeasonalPattern,
  SPECIAL_EVENTS,
  DEFAULT_DEMAND_CONFIG,
  DemandAnalyticsConfig,
} from '../types/demand';
import { Country, MAIN_CITIES } from '../types/country';

const HISTORICAL_KEY = 'litper_demand_historical';
const FORECAST_KEY = 'litper_demand_forecast';
const ALERTS_KEY = 'litper_demand_alerts';

// ============================================
// DATOS HISTÓRICOS
// ============================================

export const getHistoricalData = (country: Country): HistoricalDataPoint[] => {
  try {
    const data = localStorage.getItem(`${HISTORICAL_KEY}_${country}`);
    if (data) {
      return JSON.parse(data);
    }
    // Generar datos demo si no hay historial
    return generateDemoHistoricalData(country);
  } catch {
    return generateDemoHistoricalData(country);
  }
};

export const saveHistoricalData = (country: Country, data: HistoricalDataPoint[]): void => {
  try {
    localStorage.setItem(`${HISTORICAL_KEY}_${country}`, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving historical data:', e);
  }
};

export const addHistoricalDataPoint = (country: Country, dataPoint: HistoricalDataPoint): void => {
  const data = getHistoricalData(country);
  data.push(dataPoint);
  // Mantener solo último año
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const filtered = data.filter((d) => new Date(d.date) > oneYearAgo);
  saveHistoricalData(country, filtered);
};

// ============================================
// GENERACIÓN DE PRONÓSTICOS
// ============================================

export const generateDemandForecast = (
  country: Country,
  config: DemandAnalyticsConfig = DEFAULT_DEMAND_CONFIG
): DemandForecast => {
  const historical = getHistoricalData(country);
  const dailyPredictions = generateDailyPredictions(country, historical, config);
  const cityBreakdown = generateCityBreakdown(country, historical, dailyPredictions);
  const alerts = generateAlerts(country, dailyPredictions);
  const seasonalPatterns = detectSeasonalPatterns(country, historical);
  const estimatedBudget = calculateEstimatedBudget(country, dailyPredictions);

  const totalPredictedVolume = dailyPredictions.reduce((sum, d) => sum + d.predictedVolume, 0);
  const peakDay = dailyPredictions.reduce((max, d) =>
    d.predictedVolume > max.predictedVolume ? d : max
  );
  const lowDay = dailyPredictions.reduce((min, d) =>
    d.predictedVolume < min.predictedVolume ? d : min
  );

  const forecast: DemandForecast = {
    country,
    generatedAt: new Date().toISOString(),
    periodStart: dailyPredictions[0]?.date || new Date().toISOString(),
    periodEnd: dailyPredictions[dailyPredictions.length - 1]?.date || new Date().toISOString(),
    totalPredictedVolume,
    averageDailyVolume: Math.round(totalPredictedVolume / dailyPredictions.length),
    peakDay: {
      date: peakDay?.date || '',
      volume: peakDay?.predictedVolume || 0,
    },
    lowDay: {
      date: lowDay?.date || '',
      volume: lowDay?.predictedVolume || 0,
    },
    dailyPredictions,
    cityBreakdown,
    alerts,
    seasonalPatterns,
    estimatedBudget,
  };

  // Guardar pronóstico
  saveForecast(country, forecast);

  return forecast;
};

const generateDailyPredictions = (
  country: Country,
  historical: HistoricalDataPoint[],
  config: DemandAnalyticsConfig
): DemandPrediction[] => {
  const predictions: DemandPrediction[] = [];
  const today = new Date();
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  // Calcular promedios históricos por día de la semana
  const dayAverages = calculateDayAverages(historical);
  const overallAverage =
    historical.length > 0
      ? historical.reduce((sum, d) => sum + d.volume, 0) / historical.length
      : 50;

  for (let i = 0; i < config.forecastDays; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    const dayOfWeek = date.getDay();

    // Base prediction from historical day-of-week average
    const basePrediction = dayAverages[dayOfWeek] || overallAverage;

    // Apply factors
    const factors = calculateDemandFactors(country, date, historical);
    let totalImpact = factors.reduce((sum, f) => sum + f.impact, 0);
    totalImpact = Math.max(-50, Math.min(100, totalImpact)); // Cap impact

    const predictedVolume = Math.max(1, Math.round(basePrediction * (1 + totalImpact / 100)));

    // Calculate confidence
    const dataPoints = historical.filter((h) => new Date(h.date).getDay() === dayOfWeek).length;
    const confidence = Math.min(95, 50 + dataPoints * 2);

    const variance = predictedVolume * 0.15;
    const isHighDemand = predictedVolume > overallAverage * 1.3;
    const isPeak = predictedVolume > overallAverage * 1.5;

    predictions.push({
      date: dateStr,
      dayOfWeek: dayNames[dayOfWeek],
      predictedVolume,
      confidenceLevel: confidence,
      confidenceRange: {
        min: Math.round(predictedVolume - variance),
        max: Math.round(predictedVolume + variance),
      },
      isHighDemand,
      isPeak,
      factors,
    });
  }

  return predictions;
};

const calculateDayAverages = (historical: HistoricalDataPoint[]): number[] => {
  const dayTotals = [0, 0, 0, 0, 0, 0, 0];
  const dayCounts = [0, 0, 0, 0, 0, 0, 0];

  historical.forEach((d) => {
    const day = new Date(d.date).getDay();
    dayTotals[day] += d.volume;
    dayCounts[day] += 1;
  });

  return dayTotals.map((total, i) => (dayCounts[i] > 0 ? total / dayCounts[i] : 50));
};

const calculateDemandFactors = (
  country: Country,
  date: Date,
  historical: HistoricalDataPoint[]
): DemandPrediction['factors'] => {
  const factors: DemandPrediction['factors'] = [];
  const dateStr = date.toISOString().split('T')[0];
  const dayOfWeek = date.getDay();

  // Factor: Día de la semana
  if (dayOfWeek === 5) {
    factors.push({
      type: 'historical',
      name: 'Viernes Alto',
      impact: 25,
      description: 'Históricamente los viernes tienen mayor demanda',
    });
  } else if (dayOfWeek === 0) {
    factors.push({
      type: 'historical',
      name: 'Domingo Bajo',
      impact: -30,
      description: 'Los domingos tienen menor actividad comercial',
    });
  } else if (dayOfWeek === 6) {
    factors.push({
      type: 'historical',
      name: 'Sábado Moderado',
      impact: -15,
      description: 'Los sábados tienen actividad reducida',
    });
  }

  // Factor: Eventos especiales
  const events = SPECIAL_EVENTS[country];
  const event = events.find((e) => {
    const eventDate = new Date(e.date);
    const diff = Math.abs(eventDate.getTime() - date.getTime());
    const daysDiff = diff / (1000 * 60 * 60 * 24);
    return daysDiff <= 3; // Dentro de 3 días del evento
  });

  if (event) {
    factors.push({
      type: 'event',
      name: event.name,
      impact: event.impact,
      description: `Evento especial: ${event.name}`,
    });
  }

  // Factor: Fin de mes (más compras)
  const dayOfMonth = date.getDate();
  if (dayOfMonth >= 25 || dayOfMonth <= 5) {
    factors.push({
      type: 'calendar',
      name: 'Quincena/Fin de Mes',
      impact: 20,
      description: 'Mayor actividad por pagos de nómina',
    });
  }

  // Factor: Temporada (basado en mes)
  const month = date.getMonth();
  if (month === 10 || month === 11) {
    // Noviembre y Diciembre
    factors.push({
      type: 'seasonal',
      name: 'Temporada Alta',
      impact: 40,
      description: 'Temporada navideña con alta demanda',
    });
  } else if (month === 0 || month === 1) {
    // Enero y Febrero
    factors.push({
      type: 'seasonal',
      name: 'Post-Navidad',
      impact: -20,
      description: 'Menor demanda después de fiestas',
    });
  }

  // Factor: Tendencia (basado en últimas semanas)
  if (historical.length >= 14) {
    const lastTwoWeeks = historical.slice(-14);
    const prevTwoWeeks = historical.slice(-28, -14);
    if (prevTwoWeeks.length > 0) {
      const recentAvg = lastTwoWeeks.reduce((s, d) => s + d.volume, 0) / lastTwoWeeks.length;
      const prevAvg = prevTwoWeeks.reduce((s, d) => s + d.volume, 0) / prevTwoWeeks.length;
      const trendPct = ((recentAvg - prevAvg) / prevAvg) * 100;

      if (Math.abs(trendPct) > 10) {
        factors.push({
          type: 'trend',
          name: trendPct > 0 ? 'Tendencia Alcista' : 'Tendencia Bajista',
          impact: Math.round(trendPct / 2),
          description: `${Math.abs(Math.round(trendPct))}% ${trendPct > 0 ? 'incremento' : 'decremento'} en últimas semanas`,
        });
      }
    }
  }

  return factors;
};

const generateCityBreakdown = (
  country: Country,
  historical: HistoricalDataPoint[],
  predictions: DemandPrediction[]
): CityDemandPrediction[] => {
  const cities = MAIN_CITIES[country].slice(0, 10);
  const totalVolume = predictions.reduce((sum, p) => sum + p.predictedVolume, 0);

  // Distribución típica por ciudad (simulada basada en población)
  const cityWeights: Record<string, number> = {
    // Colombia
    Bogotá: 35,
    Medellín: 18,
    Cali: 12,
    Barranquilla: 8,
    Cartagena: 6,
    // Ecuador
    Quito: 32,
    Guayaquil: 35,
    Cuenca: 10,
    'Santo Domingo': 5,
    Machala: 4,
    // Chile
    Santiago: 45,
    Valparaíso: 12,
    Concepción: 10,
    Antofagasta: 5,
    'Viña del Mar': 6,
  };

  // Calcular tendencia por ciudad
  return cities.map((city, index) => {
    const weight = cityWeights[city] || 15 - index;
    const percentage = weight;
    const predictedVolume = Math.round((totalVolume * percentage) / 100);

    // Simular tendencia
    const trends: ('up' | 'down' | 'stable')[] = ['up', 'down', 'stable'];
    const trend = trends[index % 3];
    const trendPercentage =
      trend === 'stable' ? 0 : trend === 'up' ? Math.random() * 15 : -Math.random() * 10;

    return {
      city,
      country,
      predictedVolume,
      percentage,
      trend,
      trendPercentage: Math.round(trendPercentage),
    };
  });
};

const generateAlerts = (country: Country, predictions: DemandPrediction[]): DemandAlert[] => {
  const alerts: DemandAlert[] = [];
  const avgVolume = predictions.reduce((sum, p) => sum + p.predictedVolume, 0) / predictions.length;

  predictions.forEach((pred) => {
    // Alerta de pico
    if (pred.isPeak) {
      alerts.push({
        id: uuidv4(),
        type: 'peak',
        severity: pred.predictedVolume > avgVolume * 2 ? 'critical' : 'warning',
        title: `Pico de demanda: ${pred.dayOfWeek} ${formatDate(pred.date)}`,
        description: `Se esperan ${pred.predictedVolume} envíos, ${Math.round(((pred.predictedVolume - avgVolume) / avgVolume) * 100)}% sobre el promedio`,
        date: pred.date,
        predictedImpact: Math.round(((pred.predictedVolume - avgVolume) / avgVolume) * 100),
        recommendations: [
          'Reservar capacidad adicional con transportadoras',
          'Preparar personal de apoyo',
          'Verificar stock de materiales de empaque',
          'Negociar tarifas por volumen',
        ],
        dismissed: false,
        createdAt: new Date().toISOString(),
      });
    }

    // Alerta de evento
    pred.factors
      .filter((f) => f.type === 'event')
      .forEach((event) => {
        const existingAlert = alerts.find((a) => a.title.includes(event.name));
        if (!existingAlert) {
          alerts.push({
            id: uuidv4(),
            type: 'event',
            severity: event.impact > 150 ? 'critical' : 'warning',
            title: `Evento: ${event.name}`,
            description: `Impacto esperado: +${event.impact}% en volumen de envíos`,
            date: pred.date,
            predictedImpact: event.impact,
            recommendations: [
              `Prepararse con 15 días de anticipación`,
              'Negociar tarifas especiales por volumen garantizado',
              'Contratar personal temporal si es necesario',
              'Comprar materiales de empaque con anticipación',
            ],
            dismissed: false,
            createdAt: new Date().toISOString(),
          });
        }
      });
  });

  return alerts;
};

const detectSeasonalPatterns = (
  country: Country,
  historical: HistoricalDataPoint[]
): SeasonalPattern[] => {
  const patterns: SeasonalPattern[] = [];
  const events = SPECIAL_EVENTS[country];

  // Agregar patrones basados en eventos conocidos
  events.forEach((event) => {
    const startDate = new Date(event.date);
    startDate.setDate(startDate.getDate() - 7);
    const endDate = new Date(event.date);
    endDate.setDate(endDate.getDate() + 3);

    patterns.push({
      name: event.name,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      averageIncrease: event.impact,
      affectedCities: MAIN_CITIES[country].slice(0, 5),
      description: `Temporada de ${event.name} con incremento significativo en envíos`,
      recommendations: [
        'Aumentar inventario de materiales',
        'Coordinar con transportadoras',
        'Planificar turnos extendidos',
      ],
    });
  });

  return patterns.slice(0, 5); // Limitar a 5 patrones
};

const calculateEstimatedBudget = (
  country: Country,
  predictions: DemandPrediction[]
): DemandForecast['estimatedBudget'] => {
  const totalVolume = predictions.reduce((sum, p) => sum + p.predictedVolume, 0);

  // Precios promedio por envío por país
  const avgPrices: Record<Country, number> = {
    COLOMBIA: 12000, // COP
    ECUADOR: 5, // USD
    CHILE: 4500, // CLP
  };

  const avgPrice = avgPrices[country];
  const total = totalVolume * avgPrice;
  const perDay = total / predictions.length;

  // Distribución estimada por transportadora
  const breakdown = [
    { carrierId: 'main', carrierName: 'Principal', amount: total * 0.45, percentage: 45 },
    { carrierId: 'secondary', carrierName: 'Secundaria', amount: total * 0.3, percentage: 30 },
    { carrierId: 'express', carrierName: 'Express', amount: total * 0.15, percentage: 15 },
    { carrierId: 'other', carrierName: 'Otros', amount: total * 0.1, percentage: 10 },
  ];

  return {
    total: Math.round(total),
    perDay: Math.round(perDay),
    breakdown,
  };
};

// ============================================
// ALMACENAMIENTO
// ============================================

export const saveForecast = (country: Country, forecast: DemandForecast): void => {
  try {
    localStorage.setItem(`${FORECAST_KEY}_${country}`, JSON.stringify(forecast));
  } catch (e) {
    console.error('Error saving forecast:', e);
  }
};

export const getSavedForecast = (country: Country): DemandForecast | null => {
  try {
    const data = localStorage.getItem(`${FORECAST_KEY}_${country}`);
    if (data) {
      const forecast = JSON.parse(data);
      // Verificar si el pronóstico es reciente (menos de 24 horas)
      const generatedAt = new Date(forecast.generatedAt);
      const now = new Date();
      const hoursDiff = (now.getTime() - generatedAt.getTime()) / (1000 * 60 * 60);
      if (hoursDiff < 24) {
        return forecast;
      }
    }
    return null;
  } catch {
    return null;
  }
};

export const getDemandAlerts = (country: Country): DemandAlert[] => {
  const forecast = getSavedForecast(country);
  if (forecast) {
    return forecast.alerts.filter((a) => !a.dismissed);
  }
  return [];
};

export const dismissAlert = (country: Country, alertId: string): void => {
  const forecast = getSavedForecast(country);
  if (forecast) {
    const alert = forecast.alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.dismissed = true;
      saveForecast(country, forecast);
    }
  }
};

// ============================================
// DATOS DEMO
// ============================================

const generateDemoHistoricalData = (country: Country): HistoricalDataPoint[] => {
  const data: HistoricalDataPoint[] = [];
  const cities = MAIN_CITIES[country];
  const today = new Date();

  for (let i = 365; i > 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dayOfWeek = date.getDay();

    // Base volume con variación por día
    let baseVolume = 50;
    if (dayOfWeek === 5) baseVolume = 75; // Viernes
    if (dayOfWeek === 0) baseVolume = 25; // Domingo
    if (dayOfWeek === 6) baseVolume = 35; // Sábado

    // Variación por temporada
    const month = date.getMonth();
    if (month === 10 || month === 11) baseVolume *= 1.5; // Nov-Dic

    // Variación aleatoria
    const variation = 0.7 + Math.random() * 0.6;
    const volume = Math.round(baseVolume * variation);

    data.push({
      date: date.toISOString().split('T')[0],
      volume,
      revenue: volume * (country === 'COLOMBIA' ? 12000 : country === 'ECUADOR' ? 5 : 4500),
      topCities: cities.slice(0, 3).map((city, idx) => ({
        city,
        count: Math.round(volume * (0.4 - idx * 0.1)),
      })),
      topCarriers: [
        { carrier: 'Principal', count: Math.round(volume * 0.5) },
        { carrier: 'Secundaria', count: Math.round(volume * 0.3) },
      ],
      dayOfWeek,
      isHoliday: false,
    });
  }

  return data;
};

// ============================================
// UTILIDADES
// ============================================

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es', { day: 'numeric', month: 'short' });
};

export const getNextPeakDays = (country: Country, limit: number = 5): DemandPrediction[] => {
  const forecast = getSavedForecast(country) || generateDemandForecast(country);
  return forecast.dailyPredictions.filter((p) => p.isPeak || p.isHighDemand).slice(0, limit);
};

export const getWeeklyForecast = (country: Country): DemandPrediction[] => {
  const forecast = getSavedForecast(country) || generateDemandForecast(country);
  return forecast.dailyPredictions.slice(0, 7);
};
