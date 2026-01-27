/**
 * Executive Dashboard
 *
 * Dashboard ejecutivo principal de LITPER PRO.
 * Proporciona una vista unificada de KPIs críticos del negocio
 * con actualizaciones en tiempo real.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useExecutiveDashboardStore } from '../../stores/executiveDashboardStore';
import { PeriodType } from '../../types/executiveDashboard.types';

// Componentes
import { KPIGrid, HighlightKPIGrid, SingleRowKPIs } from './KPIGrid';
import {
  RevenueTrendChart,
  DeliveryTrendChart,
  OperationsFunnelChart,
  StatusDonutChart,
} from './Charts';
import { CarrierPerformanceTable, CityPerformanceTable, CompactCarrierList } from './PerformanceTable';
import { AlertsPanel, CompactAlertsWidget, AlertBanner } from './AlertsPanel';
import { ActivityFeedComponent, CompactActivityWidget, LiveTicker } from './ActivityFeed';

// ============================================
// HEADER COMPONENT
// ============================================

interface DashboardHeaderProps {
  lastRefresh: Date | null;
  isRefreshing: boolean;
  period: PeriodType;
  autoRefresh: boolean;
  onRefresh: () => void;
  onPeriodChange: (period: PeriodType) => void;
  onToggleAutoRefresh: () => void;
  onToggleCompact: () => void;
  compactMode: boolean;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  lastRefresh,
  isRefreshing,
  period,
  autoRefresh,
  onRefresh,
  onPeriodChange,
  onToggleAutoRefresh,
  onToggleCompact,
  compactMode,
}) => {
  const periods: { value: PeriodType; label: string }[] = [
    { value: 'today', label: 'Hoy' },
    { value: 'yesterday', label: 'Ayer' },
    { value: 'last_7_days', label: '7 días' },
    { value: 'last_30_days', label: '30 días' },
    { value: 'this_month', label: 'Este mes' },
    { value: 'this_quarter', label: 'Trimestre' },
  ];

  return (
    <header className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-700/50 px-6 py-4 sticky top-0 z-10">
      <div className="flex items-center justify-between">
        {/* Title & Status */}
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <span>📊</span> Dashboard Ejecutivo
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Vista en tiempo real del negocio
            </p>
          </div>

          {/* Live Indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-full">
            <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-emerald-500 animate-pulse' : 'bg-gray-500'}`} />
            <span className="text-xs text-gray-400">
              {autoRefresh ? 'En vivo' : 'Pausado'}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          {/* Period Selector */}
          <div className="flex items-center bg-slate-800 rounded-lg p-1">
            {periods.map((p) => (
              <button
                key={p.value}
                onClick={() => onPeriodChange(p.value)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  period === p.value
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleCompact}
              className={`p-2 rounded-lg transition-colors ${
                compactMode
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-gray-400 hover:text-white'
              }`}
              title={compactMode ? 'Vista expandida' : 'Vista compacta'}
            >
              {compactMode ? '⬜' : '🔳'}
            </button>

            <button
              onClick={onToggleAutoRefresh}
              className={`p-2 rounded-lg transition-colors ${
                autoRefresh
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-gray-400 hover:text-white'
              }`}
              title={autoRefresh ? 'Pausar auto-refresh' : 'Activar auto-refresh'}
            >
              {autoRefresh ? '⏸️' : '▶️'}
            </button>

            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-2 bg-slate-800 text-gray-400 hover:text-white rounded-lg transition-colors disabled:opacity-50"
              title="Actualizar"
            >
              <span className={isRefreshing ? 'animate-spin' : ''}>🔄</span>
            </button>
          </div>

          {/* Last Update */}
          {lastRefresh && (
            <span className="text-xs text-gray-500">
              Actualizado: {lastRefresh.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      </div>
    </header>
  );
};

// ============================================
// LOADING SKELETON
// ============================================

const DashboardSkeleton: React.FC = () => (
  <div className="animate-pulse space-y-6">
    {/* KPI Grid Skeleton */}
    <div className="grid grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-32 bg-slate-800/50 rounded-xl" />
      ))}
    </div>

    {/* Charts Skeleton */}
    <div className="grid grid-cols-2 gap-6">
      <div className="h-80 bg-slate-800/50 rounded-xl" />
      <div className="h-80 bg-slate-800/50 rounded-xl" />
    </div>

    {/* Tables Skeleton */}
    <div className="grid grid-cols-2 gap-6">
      <div className="h-64 bg-slate-800/50 rounded-xl" />
      <div className="h-64 bg-slate-800/50 rounded-xl" />
    </div>
  </div>
);

// ============================================
// ERROR STATE
// ============================================

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({ message, onRetry }) => (
  <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
    <span className="text-6xl mb-4">⚠️</span>
    <h2 className="text-xl font-semibold text-white mb-2">Error al cargar el dashboard</h2>
    <p className="text-gray-400 mb-4">{message}</p>
    <button
      onClick={onRetry}
      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
    >
      Reintentar
    </button>
  </div>
);

// ============================================
// MAIN DASHBOARD COMPONENT
// ============================================

export const ExecutiveDashboard: React.FC = () => {
  // Store state
  const {
    kpis,
    revenueTrend,
    deliveryTrend,
    operationsFunnel,
    carrierPerformance,
    cityPerformance,
    statusDistribution,
    alertsSummary,
    activityFeed,
    isLoading,
    isRefreshing,
    error,
    lastRefresh,
    filters,
    autoRefresh,
    refreshInterval,
    compactMode,
    loadDashboard,
    refreshDashboard,
    setPeriod,
    toggleAutoRefresh,
    toggleCompactMode,
    acknowledgeAlert,
    dismissAlert,
    clearError,
  } = useExecutiveDashboardStore();

  // Local state
  const [activeTab, setActiveTab] = useState<'overview' | 'operations' | 'analytics'>('overview');

  // Initial load
  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refreshDashboard();
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refreshDashboard]);

  // Callbacks
  const handlePeriodChange = useCallback((period: PeriodType) => {
    setPeriod(period);
  }, [setPeriod]);

  const handleCarrierClick = useCallback((carrierId: string) => {
    console.log('Carrier clicked:', carrierId);
    // Navegar a detalle del carrier
  }, []);

  const handleCityClick = useCallback((cityCode: string) => {
    console.log('City clicked:', cityCode);
    // Navegar a detalle de la ciudad
  }, []);

  // Critical alerts banner
  const criticalAlert = alertsSummary?.alerts.find(
    (a) => (a.severity === 'critical' || a.severity === 'emergency') && a.status === 'new'
  );

  // Error state
  if (error && !kpis) {
    return (
      <div className="min-h-screen bg-slate-900">
        <DashboardHeader
          lastRefresh={lastRefresh}
          isRefreshing={isRefreshing}
          period={filters.period}
          autoRefresh={autoRefresh}
          onRefresh={refreshDashboard}
          onPeriodChange={handlePeriodChange}
          onToggleAutoRefresh={toggleAutoRefresh}
          onToggleCompact={toggleCompactMode}
          compactMode={compactMode}
        />
        <div className="p-6">
          <ErrorState message={error} onRetry={() => { clearError(); loadDashboard(); }} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Live Ticker */}
      {activityFeed && activityFeed.events.length > 0 && (
        <LiveTicker events={activityFeed.events.slice(0, 5)} />
      )}

      {/* Critical Alert Banner */}
      {criticalAlert && (
        <div className="px-6 pt-4">
          <AlertBanner
            alert={criticalAlert}
            onDismiss={() => dismissAlert(criticalAlert.id)}
            onAction={() => acknowledgeAlert(criticalAlert.id)}
          />
        </div>
      )}

      {/* Header */}
      <DashboardHeader
        lastRefresh={lastRefresh}
        isRefreshing={isRefreshing}
        period={filters.period}
        autoRefresh={autoRefresh}
        onRefresh={refreshDashboard}
        onPeriodChange={handlePeriodChange}
        onToggleAutoRefresh={toggleAutoRefresh}
        onToggleCompact={toggleCompactMode}
        compactMode={compactMode}
      />

      {/* Main Content */}
      <main className="p-6">
        {isLoading && !kpis ? (
          <DashboardSkeleton />
        ) : kpis ? (
          <div className="space-y-6">
            {/* Compact Mode: Single Row KPIs */}
            {compactMode && <SingleRowKPIs kpis={kpis} />}

            {/* Full Mode: Highlight KPIs */}
            {!compactMode && <HighlightKPIGrid kpis={kpis} />}

            {/* Tab Navigation */}
            <div className="flex items-center gap-4 border-b border-slate-700/50 pb-2">
              {[
                { id: 'overview', label: 'Resumen', icon: '📊' },
                { id: 'operations', label: 'Operaciones', icon: '📦' },
                { id: 'analytics', label: 'Análisis', icon: '📈' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Row 1: Revenue Trend + Status Distribution */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    {revenueTrend && <RevenueTrendChart data={revenueTrend} />}
                  </div>
                  <div>
                    {statusDistribution && <StatusDonutChart data={statusDistribution} />}
                  </div>
                </div>

                {/* Row 2: Alerts + Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    {alertsSummary && (
                      <AlertsPanel
                        alertsSummary={alertsSummary}
                        onAcknowledge={acknowledgeAlert}
                        onDismiss={dismissAlert}
                        maxVisible={4}
                      />
                    )}
                  </div>
                  <div>
                    {activityFeed && (
                      <ActivityFeedComponent feed={activityFeed} maxItems={6} />
                    )}
                  </div>
                </div>

                {/* Row 3: Top Carriers */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <CompactCarrierList carriers={carrierPerformance} limit={5} />
                  <div className="lg:col-span-2">
                    {operationsFunnel && <OperationsFunnelChart data={operationsFunnel} />}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'operations' && (
              <div className="space-y-6">
                {/* Delivery Trend */}
                {deliveryTrend && <DeliveryTrendChart data={deliveryTrend} />}

                {/* Operations Funnel */}
                {operationsFunnel && <OperationsFunnelChart data={operationsFunnel} />}

                {/* Carrier Performance Table */}
                <CarrierPerformanceTable
                  carriers={carrierPerformance}
                  onCarrierClick={handleCarrierClick}
                />

                {/* City Performance Table */}
                <CityPerformanceTable
                  cities={cityPerformance}
                  onCityClick={handleCityClick}
                />
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="space-y-6">
                {/* Full KPI Grid */}
                <KPIGrid
                  kpis={kpis}
                  compactMode={false}
                  visibleCategories={['financial', 'operations', 'customer', 'risk', 'marketing', 'inventory']}
                />

                {/* Trends */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {revenueTrend && <RevenueTrendChart data={revenueTrend} showComparison={true} />}
                  {deliveryTrend && <DeliveryTrendChart data={deliveryTrend} />}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-700/50 px-6 py-4 bg-slate-900/80">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>LITPER PRO - Dashboard Ejecutivo v1.0</span>
          <span>
            Datos actualizados cada {refreshInterval} segundos
          </span>
        </div>
      </footer>
    </div>
  );
};

export default ExecutiveDashboard;
