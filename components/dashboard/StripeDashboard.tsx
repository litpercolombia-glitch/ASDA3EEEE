// components/dashboard/StripeDashboard.tsx
// Dashboard con 4 KPIs estilo Stripe - Diseño minimalista profesional

import React, { useMemo } from 'react';
import {
  Package,
  CheckCircle,
  Truck,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ArrowRight,
} from 'lucide-react';
import { Shipment, ShipmentStatus } from '../../types';
import { CitySemaphore } from './CitySemaphore';

// ============================================
// TIPOS
// ============================================

interface StripeDashboardProps {
  shipments: Shipment[];
  onNavigate: (section: string) => void;
}

interface KPICardProps {
  title: string;
  value: string | number;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon: React.ElementType;
  iconColor: string;
  onClick?: () => void;
}

// ============================================
// KPI CARD COMPONENT
// ============================================

function KPICard({ title, value, trend, icon: Icon, iconColor, onClick }: KPICardProps) {
  return (
    <button
      onClick={onClick}
      className="flex-1 min-w-[200px] p-6 bg-[#1a1a1f] border border-white/5 rounded-2xl text-left hover:border-white/10 hover:bg-[#1f1f25] transition-all group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2.5 rounded-xl ${iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm font-medium ${trend.isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
            {trend.isPositive ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span>{trend.isPositive ? '+' : ''}{trend.value}%</span>
          </div>
        )}
      </div>

      <p className="text-4xl font-semibold text-white mb-1 tabular-nums">
        {value}
      </p>
      <p className="text-sm text-white/40">{title}</p>

      <div className="mt-4 flex items-center gap-1 text-sm text-[#FF6B35] opacity-0 group-hover:opacity-100 transition-opacity">
        Ver detalles
        <ArrowRight className="w-4 h-4" />
      </div>
    </button>
  );
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function isDelivered(status: string): boolean {
  return (
    status === ShipmentStatus.DELIVERED ||
    status?.toLowerCase() === 'delivered' ||
    status?.toLowerCase() === 'entregado'
  );
}

function isInTransit(status: string): boolean {
  return (
    status === ShipmentStatus.IN_TRANSIT ||
    status?.toLowerCase() === 'in_transit' ||
    status?.toLowerCase() === 'en reparto'
  );
}

function isIssue(status: string): boolean {
  return (
    status === ShipmentStatus.ISSUE ||
    status?.toLowerCase() === 'issue' ||
    status?.toLowerCase() === 'novedad'
  );
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export function StripeDashboard({ shipments, onNavigate }: StripeDashboardProps) {
  const stats = useMemo(() => {
    const total = shipments.length;
    const delivered = shipments.filter(s => isDelivered(s.status)).length;
    const inTransit = shipments.filter(s => isInTransit(s.status)).length;
    const issues = shipments.filter(s => isIssue(s.status)).length;
    const deliveryRate = total > 0 ? Math.round((delivered / total) * 100) : 0;

    // Calcular trends (mock - en producción vendría de datos históricos)
    const deliveryTrend = 12; // +12% vs ayer
    const issueTrend = -3; // -3% vs ayer

    return {
      total,
      delivered,
      inTransit,
      issues,
      deliveryRate,
      deliveryTrend,
      issueTrend,
    };
  }, [shipments]);

  // Calcular datos por ciudad para el semáforo
  const cityData = useMemo(() => {
    const cityMap: Record<string, { total: number; delivered: number }> = {};

    shipments.forEach(s => {
      const city = s.detailedInfo?.city ||
        s.detailedInfo?.destination?.split(',')[0]?.trim() ||
        'Sin ciudad';

      if (!cityMap[city]) {
        cityMap[city] = { total: 0, delivered: 0 };
      }
      cityMap[city].total++;
      if (isDelivered(s.status)) {
        cityMap[city].delivered++;
      }
    });

    return Object.entries(cityMap)
      .map(([city, data]) => ({
        city,
        total: data.total,
        delivered: data.delivered,
        deliveryRate: data.total > 0 ? Math.round((data.delivered / data.total) * 100) : 0,
      }))
      .filter(c => c.total >= 3) // Solo ciudades con 3+ envíos
      .sort((a, b) => b.total - a.total)
      .slice(0, 12); // Top 12 ciudades
  }, [shipments]);

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Dashboard</h1>
        <p className="text-white/40 text-sm">Resumen de operaciones en tiempo real</p>
      </div>

      {/* KPIs Grid */}
      <div className="flex flex-wrap gap-4">
        <KPICard
          title="Total Envíos"
          value={stats.total.toLocaleString()}
          icon={Package}
          iconColor="bg-[#FF6B35]/10 text-[#FF6B35]"
          onClick={() => onNavigate('envios')}
        />
        <KPICard
          title="Tasa de Entrega"
          value={`${stats.deliveryRate}%`}
          trend={{ value: stats.deliveryTrend, isPositive: true }}
          icon={CheckCircle}
          iconColor="bg-emerald-500/10 text-emerald-400"
          onClick={() => onNavigate('envios?filter=delivered')}
        />
        <KPICard
          title="En Tránsito"
          value={stats.inTransit.toLocaleString()}
          icon={Truck}
          iconColor="bg-blue-500/10 text-blue-400"
          onClick={() => onNavigate('tracking')}
        />
        <KPICard
          title="Requieren Atención"
          value={stats.issues.toLocaleString()}
          trend={stats.issues > 0 ? { value: Math.abs(stats.issueTrend), isPositive: stats.issueTrend < 0 } : undefined}
          icon={AlertTriangle}
          iconColor="bg-red-500/10 text-red-400"
          onClick={() => onNavigate('envios?filter=issues')}
        />
      </div>

      {/* City Semaphore */}
      {cityData.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Semáforo de Ciudades</h2>
              <p className="text-sm text-white/40">Tasa de entrega por ciudad</p>
            </div>
            <button
              onClick={() => onNavigate('reportes')}
              className="flex items-center gap-1 text-sm text-[#FF6B35] hover:text-[#FF6B35]/80 transition-colors"
            >
              Ver reporte completo
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <CitySemaphore cities={cityData} />
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickActionCard
          title="Cargar Guías"
          description="Importar desde Excel"
          onClick={() => onNavigate('upload')}
        />
        <QuickActionCard
          title="Generar Reporte"
          description="Exportar métricas del día"
          onClick={() => onNavigate('reportes')}
        />
        <QuickActionCard
          title="Asistente IA"
          description="Consultar con inteligencia artificial"
          onClick={() => onNavigate('ia-assistant')}
          highlight
        />
      </div>
    </div>
  );
}

// ============================================
// QUICK ACTION CARD
// ============================================

function QuickActionCard({
  title,
  description,
  onClick,
  highlight = false,
}: {
  title: string;
  description: string;
  onClick: () => void;
  highlight?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        p-4 rounded-xl text-left transition-all group
        ${highlight
          ? 'bg-gradient-to-br from-[#FF6B35]/20 to-orange-600/10 border border-[#FF6B35]/20 hover:border-[#FF6B35]/40'
          : 'bg-[#1a1a1f] border border-white/5 hover:border-white/10'
        }
      `}
    >
      <h3 className={`font-medium mb-1 ${highlight ? 'text-[#FF6B35]' : 'text-white'}`}>
        {title}
      </h3>
      <p className="text-sm text-white/40">{description}</p>
      <ArrowRight className={`w-4 h-4 mt-2 opacity-0 group-hover:opacity-100 transition-opacity ${highlight ? 'text-[#FF6B35]' : 'text-white/40'}`} />
    </button>
  );
}

export default StripeDashboard;
