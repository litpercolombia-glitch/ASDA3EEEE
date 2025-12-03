import React, { useState } from 'react';
import { Sparkles, FileSpreadsheet, TrafficCone } from 'lucide-react';

export type AppView = 'main' | 'predictive-report' | 'predictive-system' | 'traffic-light';

interface AppNavigatorProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  hasShipments: boolean;
}

export function AppNavigator({ currentView, onViewChange, hasShipments }: AppNavigatorProps) {
  // Si estamos en una vista secundaria, no mostramos el navegador
  if (currentView !== 'main') {
    return null;
  }

  return (
    <div className="hidden sm:flex items-center gap-2">
      <button
        onClick={() => onViewChange('predictive-report')}
        disabled={!hasShipments}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm ${
          hasShipments
            ? 'bg-purple-600 hover:bg-purple-700 text-white border border-purple-500'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
        title={hasShipments ? 'Reporte Predictivo con IA' : 'Necesitas guías cargadas'}
      >
        <Sparkles className="w-4 h-4" />
        Reporte IA
      </button>

      <button
        onClick={() => onViewChange('predictive-system')}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg text-sm font-bold transition-all shadow-sm"
        title="Sistema de Predicción Logística"
      >
        <FileSpreadsheet className="w-4 h-4" />
        Predicción
      </button>

      <button
        onClick={() => onViewChange('traffic-light')}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-lg text-sm font-bold transition-all shadow-sm"
        title="Semáforo de Ciudad"
      >
        <TrafficCone className="w-4 h-4" />
        Semáforo
      </button>
    </div>
  );
}
