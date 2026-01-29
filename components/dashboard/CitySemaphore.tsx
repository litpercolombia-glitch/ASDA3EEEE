// components/dashboard/CitySemaphore.tsx
// Semáforo de Ciudades - Grid de cards con tasa de entrega

import React from 'react';
import { MapPin, TrendingUp, TrendingDown } from 'lucide-react';

// ============================================
// TIPOS
// ============================================

interface CityData {
  city: string;
  total: number;
  delivered: number;
  deliveryRate: number;
}

interface CitySemaphoreProps {
  cities: CityData[];
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getSemaphoreColor(rate: number): {
  bg: string;
  text: string;
  border: string;
  indicator: string;
} {
  if (rate >= 80) {
    return {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/20',
      indicator: 'bg-emerald-500',
    };
  }
  if (rate >= 60) {
    return {
      bg: 'bg-yellow-500/10',
      text: 'text-yellow-400',
      border: 'border-yellow-500/20',
      indicator: 'bg-yellow-500',
    };
  }
  return {
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    border: 'border-red-500/20',
    indicator: 'bg-red-500',
  };
}

function getSemaphoreLabel(rate: number): string {
  if (rate >= 80) return 'Óptimo';
  if (rate >= 60) return 'Regular';
  return 'Crítico';
}

// ============================================
// CITY CARD COMPONENT
// ============================================

function CityCard({ city, total, delivered, deliveryRate }: CityData) {
  const colors = getSemaphoreColor(deliveryRate);
  const label = getSemaphoreLabel(deliveryRate);

  return (
    <div
      className={`
        p-4 rounded-xl border transition-all hover:scale-[1.02]
        ${colors.bg} ${colors.border}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <MapPin className={`w-4 h-4 ${colors.text}`} />
          <h3 className="text-sm font-medium text-white truncate max-w-[120px]">
            {city}
          </h3>
        </div>
        <div className={`w-2.5 h-2.5 rounded-full ${colors.indicator}`} />
      </div>

      {/* Rate */}
      <p className={`text-3xl font-semibold mb-1 tabular-nums ${colors.text}`}>
        {deliveryRate}%
      </p>

      {/* Stats */}
      <div className="flex items-center justify-between text-xs text-white/40">
        <span>{delivered}/{total} entregas</span>
        <span className={colors.text}>{label}</span>
      </div>
    </div>
  );
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export function CitySemaphore({ cities }: CitySemaphoreProps) {
  if (cities.length === 0) {
    return (
      <div className="p-8 text-center text-white/30 bg-[#1a1a1f] rounded-2xl border border-white/5">
        No hay datos de ciudades disponibles
      </div>
    );
  }

  // Ordenar por tasa de entrega (peores primero para visibilidad)
  const sortedCities = [...cities].sort((a, b) => a.deliveryRate - b.deliveryRate);

  // Estadísticas generales
  const totalDelivered = cities.reduce((acc, c) => acc + c.delivered, 0);
  const totalShipments = cities.reduce((acc, c) => acc + c.total, 0);
  const overallRate = totalShipments > 0 ? Math.round((totalDelivered / totalShipments) * 100) : 0;
  const criticalCities = cities.filter(c => c.deliveryRate < 60).length;
  const optimalCities = cities.filter(c => c.deliveryRate >= 80).length;

  return (
    <div className="space-y-4">
      {/* Summary Bar */}
      <div className="flex flex-wrap gap-4 p-4 bg-[#1a1a1f] rounded-xl border border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#FF6B35]/10 rounded-lg flex items-center justify-center">
            <span className="text-lg font-bold text-[#FF6B35]">{overallRate}%</span>
          </div>
          <div>
            <p className="text-xs text-white/40">Tasa general</p>
            <p className="text-sm font-medium text-white">{totalDelivered}/{totalShipments}</p>
          </div>
        </div>

        <div className="h-10 w-px bg-white/10" />

        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-sm text-white/60">{optimalCities} óptimas</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <span className="text-sm text-white/60">{cities.length - optimalCities - criticalCities} regulares</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-sm text-white/60">{criticalCities} críticas</span>
        </div>
      </div>

      {/* City Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {sortedCities.map((city) => (
          <CityCard
            key={city.city}
            city={city.city}
            total={city.total}
            delivered={city.delivered}
            deliveryRate={city.deliveryRate}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-xs text-white/40">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span>≥80% Óptimo</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
          <span>60-79% Regular</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <span>&lt;60% Crítico</span>
        </div>
      </div>
    </div>
  );
}

export default CitySemaphore;
