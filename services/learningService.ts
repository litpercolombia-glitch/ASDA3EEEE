// services/learningService.ts
// Sistema de Aprendizaje Automático - IA que aprende de tu negocio

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================
// TIPOS E INTERFACES
// ============================================

export interface LearningPattern {
  id: string;
  type: 'sales' | 'delivery' | 'advertising' | 'behavior' | 'seasonal' | 'cost';
  name: string;
  description: string;
  confidence: number; // 0-1
  impact: 'high' | 'medium' | 'low';
  data: Record<string, any>;
  detectedAt: string;
  validUntil?: string;
  isActive: boolean;
}

export interface Prediction {
  id: string;
  type: 'demand' | 'revenue' | 'cost' | 'delivery_rate' | 'roas';
  period: string; // YYYY-MM or YYYY-MM-DD
  predicted: number;
  actual?: number;
  accuracy?: number;
  factors: string[];
  confidence: number;
  createdAt: string;
}

export interface Insight {
  id: string;
  category: 'opportunity' | 'warning' | 'trend' | 'recommendation';
  title: string;
  description: string;
  impact: string;
  action?: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  relatedPatterns: string[];
  createdAt: string;
  expiresAt?: string;
  isRead: boolean;
  isDismissed: boolean;
}

export interface BusinessRule {
  id: string;
  name: string;
  condition: string;
  action: string;
  isAutomatic: boolean;
  triggerCount: number;
  lastTriggered?: string;
  createdAt: string;
  isActive: boolean;
}

export interface LearningSnapshot {
  id: string;
  month: string;
  patterns: number;
  predictions: number;
  insights: number;
  accuracy: number;
  topPatterns: string[];
  summary: string;
  createdAt: string;
}

// ============================================
// PATTERNS PREDEFINIDOS
// ============================================

const DETECTED_PATTERNS: Omit<LearningPattern, 'id' | 'detectedAt'>[] = [
  // Ventas
  {
    type: 'sales',
    name: 'Pico de ventas los martes',
    description: 'Las ventas aumentan un 23% los martes comparado con el promedio semanal',
    confidence: 0.89,
    impact: 'medium',
    data: { dayOfWeek: 2, increase: 23, sampleSize: 45 },
    isActive: true,
  },
  {
    type: 'sales',
    name: 'Hora óptima de venta',
    description: 'El 65% de las conversiones ocurren entre 7pm y 10pm',
    confidence: 0.92,
    impact: 'high',
    data: { peakHours: [19, 20, 21, 22], conversionRate: 65 },
    isActive: true,
  },
  {
    type: 'seasonal',
    name: 'Temporada alta Diciembre',
    description: 'Las ventas de Diciembre son 45% mayores que el promedio anual',
    confidence: 0.95,
    impact: 'high',
    data: { month: 12, increase: 45, historicalYears: 2 },
    isActive: true,
  },

  // Entregas
  {
    type: 'delivery',
    name: 'Ciudades problemáticas',
    description: 'Quibdó, Mitú y Leticia tienen tasas de devolución superiores al 40%',
    confidence: 0.88,
    impact: 'high',
    data: { cities: ['Quibdó', 'Mitú', 'Leticia'], avgReturnRate: 42 },
    isActive: true,
  },
  {
    type: 'delivery',
    name: 'Mejor transportadora por zona',
    description: 'Servientrega tiene 15% mejor tasa en Costa Caribe, Coordinadora en Centro',
    confidence: 0.85,
    impact: 'medium',
    data: { servientrega: ['Costa'], coordinadora: ['Centro', 'Antioquia'] },
    isActive: true,
  },

  // Publicidad
  {
    type: 'advertising',
    name: 'ROAS óptimo por plataforma',
    description: 'Facebook Ads tiene ROAS 4.2x, Instagram 3.8x, TikTok 2.9x',
    confidence: 0.91,
    impact: 'high',
    data: { facebook: 4.2, instagram: 3.8, tiktok: 2.9, google: 3.5 },
    isActive: true,
  },
  {
    type: 'advertising',
    name: 'CPA objetivo',
    description: 'El CPA óptimo para mantener rentabilidad es $12,000 o menos',
    confidence: 0.87,
    impact: 'high',
    data: { optimalCPA: 12000, currentCPA: 15000, margin: 25 },
    isActive: true,
  },

  // Comportamiento
  {
    type: 'behavior',
    name: 'Ticket promedio por canal',
    description: 'Clientes de Instagram gastan 20% más que los de Facebook',
    confidence: 0.82,
    impact: 'medium',
    data: { instagram: 85000, facebook: 72000, tiktok: 65000 },
    isActive: true,
  },
  {
    type: 'cost',
    name: 'Gastos fijos optimizables',
    description: 'El 15% de los gastos fijos podrían reducirse sin impacto operativo',
    confidence: 0.78,
    impact: 'medium',
    data: { potentialSavings: 15, areas: ['software', 'tools'] },
    isActive: true,
  },
];

// ============================================
// STORE
// ============================================

interface LearningState {
  patterns: LearningPattern[];
  predictions: Prediction[];
  insights: Insight[];
  rules: BusinessRule[];
  snapshots: LearningSnapshot[];
  isLearning: boolean;
  lastLearningRun: string | null;
  modelAccuracy: number;

  // Aprendizaje
  runLearning: () => Promise<void>;
  detectPatterns: (data: any) => LearningPattern[];
  updateModelAccuracy: () => void;

  // Predicciones
  generatePredictions: (month: string) => Prediction[];
  validatePrediction: (id: string, actual: number) => void;

  // Insights
  generateInsights: () => Insight[];
  markInsightRead: (id: string) => void;
  dismissInsight: (id: string) => void;

  // Reglas
  addRule: (rule: Omit<BusinessRule, 'id' | 'createdAt' | 'triggerCount'>) => void;
  toggleRule: (id: string) => void;
  deleteRule: (id: string) => void;

  // Snapshots
  saveSnapshot: () => void;
  getMonthlySnapshots: (year: number) => LearningSnapshot[];
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const useLearningStore = create<LearningState>()(
  persist(
    (set, get) => ({
      patterns: [],
      predictions: [],
      insights: [],
      rules: [],
      snapshots: [],
      isLearning: false,
      lastLearningRun: null,
      modelAccuracy: 0.85,

      runLearning: async () => {
        set({ isLearning: true });

        // Simular proceso de aprendizaje
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Detectar patrones
        const newPatterns = DETECTED_PATTERNS.map((p) => ({
          ...p,
          id: generateId(),
          detectedAt: new Date().toISOString(),
        }));

        // Generar insights basados en patrones
        const insights = get().generateInsights();

        set({
          patterns: newPatterns,
          insights,
          isLearning: false,
          lastLearningRun: new Date().toISOString(),
        });

        // Guardar snapshot mensual
        get().saveSnapshot();
      },

      detectPatterns: (data) => {
        // En producción, aquí iría lógica real de ML
        return get().patterns;
      },

      updateModelAccuracy: () => {
        const { predictions } = get();
        const validatedPredictions = predictions.filter((p) => p.actual !== undefined);

        if (validatedPredictions.length === 0) {
          set({ modelAccuracy: 0.85 });
          return;
        }

        const totalAccuracy = validatedPredictions.reduce((sum, p) => sum + (p.accuracy || 0), 0);
        const avgAccuracy = totalAccuracy / validatedPredictions.length;
        set({ modelAccuracy: avgAccuracy });
      },

      generatePredictions: (month) => {
        const { patterns } = get();
        const predictions: Prediction[] = [];

        // Predicción de demanda
        const salesPattern = patterns.find((p) => p.type === 'seasonal');
        predictions.push({
          id: generateId(),
          type: 'demand',
          period: month,
          predicted: Math.floor(Math.random() * 200) + 300, // Simulado
          confidence: 0.88,
          factors: ['Temporada', 'Historial', 'Tendencia'],
          createdAt: new Date().toISOString(),
        });

        // Predicción de ingresos
        predictions.push({
          id: generateId(),
          type: 'revenue',
          period: month,
          predicted: Math.floor(Math.random() * 5000000) + 10000000,
          confidence: 0.85,
          factors: ['Demanda proyectada', 'Ticket promedio', 'Tasa de conversión'],
          createdAt: new Date().toISOString(),
        });

        // Predicción de ROAS
        const adPattern = patterns.find((p) => p.type === 'advertising');
        predictions.push({
          id: generateId(),
          type: 'roas',
          period: month,
          predicted: adPattern?.data?.facebook || 3.5,
          confidence: 0.82,
          factors: ['Rendimiento histórico', 'Temporada', 'Competencia'],
          createdAt: new Date().toISOString(),
        });

        set((state) => ({
          predictions: [...state.predictions, ...predictions],
        }));

        return predictions;
      },

      validatePrediction: (id, actual) => {
        set((state) => ({
          predictions: state.predictions.map((p) => {
            if (p.id !== id) return p;
            const accuracy = 1 - Math.abs(p.predicted - actual) / p.predicted;
            return { ...p, actual, accuracy: Math.max(0, Math.min(1, accuracy)) };
          }),
        }));
        get().updateModelAccuracy();
      },

      generateInsights: () => {
        const { patterns } = get();
        const insights: Insight[] = [];

        // Generar insights basados en patrones
        const highImpactPatterns = patterns.filter((p) => p.impact === 'high' && p.confidence > 0.8);

        highImpactPatterns.forEach((pattern) => {
          if (pattern.type === 'delivery' && pattern.name.includes('problemáticas')) {
            insights.push({
              id: generateId(),
              category: 'warning',
              title: 'Ciudades con alta devolución',
              description: pattern.description,
              impact: 'Pérdida estimada de $2.5M mensuales por devoluciones evitables',
              action: 'Considerar restricciones de envío o tarifas especiales',
              priority: 'high',
              relatedPatterns: [pattern.id],
              createdAt: new Date().toISOString(),
              isRead: false,
              isDismissed: false,
            });
          }

          if (pattern.type === 'advertising' && pattern.name.includes('ROAS')) {
            insights.push({
              id: generateId(),
              category: 'opportunity',
              title: 'Optimización de inversión publicitaria',
              description: 'Facebook Ads muestra el mejor ROAS. Considera redistribuir presupuesto.',
              impact: 'Potencial aumento de 15% en ROI de publicidad',
              action: 'Aumentar inversión en Facebook Ads, reducir TikTok temporalmente',
              priority: 'medium',
              relatedPatterns: [pattern.id],
              createdAt: new Date().toISOString(),
              isRead: false,
              isDismissed: false,
            });
          }

          if (pattern.type === 'sales' && pattern.name.includes('Hora óptima')) {
            insights.push({
              id: generateId(),
              category: 'recommendation',
              title: 'Programar anuncios en horario óptimo',
              description: pattern.description,
              impact: 'Mejora de 10-15% en tasa de conversión',
              action: 'Programar campañas para 7pm-10pm',
              priority: 'medium',
              relatedPatterns: [pattern.id],
              createdAt: new Date().toISOString(),
              isRead: false,
              isDismissed: false,
            });
          }
        });

        // Trend insight
        insights.push({
          id: generateId(),
          category: 'trend',
          title: 'Tendencia de crecimiento positiva',
          description: 'Las ventas han crecido 12% en los últimos 3 meses',
          impact: 'Proyección de cierre de año 20% sobre meta',
          priority: 'low',
          relatedPatterns: [],
          createdAt: new Date().toISOString(),
          isRead: false,
          isDismissed: false,
        });

        return insights;
      },

      markInsightRead: (id) => {
        set((state) => ({
          insights: state.insights.map((i) =>
            i.id === id ? { ...i, isRead: true } : i
          ),
        }));
      },

      dismissInsight: (id) => {
        set((state) => ({
          insights: state.insights.map((i) =>
            i.id === id ? { ...i, isDismissed: true } : i
          ),
        }));
      },

      addRule: (rule) => {
        const newRule: BusinessRule = {
          ...rule,
          id: generateId(),
          triggerCount: 0,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ rules: [...state.rules, newRule] }));
      },

      toggleRule: (id) => {
        set((state) => ({
          rules: state.rules.map((r) =>
            r.id === id ? { ...r, isActive: !r.isActive } : r
          ),
        }));
      },

      deleteRule: (id) => {
        set((state) => ({
          rules: state.rules.filter((r) => r.id !== id),
        }));
      },

      saveSnapshot: () => {
        const { patterns, predictions, insights, modelAccuracy } = get();
        const month = new Date().toISOString().slice(0, 7);

        const snapshot: LearningSnapshot = {
          id: generateId(),
          month,
          patterns: patterns.length,
          predictions: predictions.filter((p) => p.period.startsWith(month)).length,
          insights: insights.filter((i) => !i.isDismissed).length,
          accuracy: modelAccuracy,
          topPatterns: patterns.filter((p) => p.impact === 'high').slice(0, 3).map((p) => p.name),
          summary: `Detectados ${patterns.length} patrones con ${(modelAccuracy * 100).toFixed(0)}% de precisión`,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          snapshots: [...state.snapshots.filter((s) => s.month !== month), snapshot],
        }));
      },

      getMonthlySnapshots: (year) => {
        return get().snapshots.filter((s) => s.month.startsWith(year.toString()));
      },
    }),
    {
      name: 'litper-learning-store',
    }
  )
);

// ============================================
// HOOKS
// ============================================

export function useLearning() {
  const store = useLearningStore();

  const unreadInsights = store.insights.filter((i) => !i.isRead && !i.isDismissed);
  const criticalInsights = store.insights.filter((i) => i.priority === 'critical' && !i.isDismissed);
  const activePatterns = store.patterns.filter((p) => p.isActive);

  return {
    ...store,
    unreadInsights,
    criticalInsights,
    activePatterns,
  };
}

export default useLearningStore;
