/**
 * PATTERN DETECTION
 *
 * Componente para mostrar patrones detectados en los envios.
 */

import React from 'react';
import { Lightbulb, TrendingUp, TrendingDown, Minus, ChevronRight } from 'lucide-react';
import { DetectedPattern } from '../types';

interface PatternDetectionProps {
  patterns: DetectedPattern[];
  isLoading?: boolean;
  onPatternClick?: (pattern: DetectedPattern) => void;
}

const PatternDetection: React.FC<PatternDetectionProps> = ({
  patterns,
  isLoading = false,
  onPatternClick,
}) => {
  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'positive':
        return <TrendingUp className="w-4 h-4 text-emerald-400" />;
      case 'negative':
        return <TrendingDown className="w-4 h-4 text-red-400" />;
      default:
        return <Minus className="w-4 h-4 text-slate-400" />;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      delay: 'Retraso',
      carrier: 'Transportadora',
      route: 'Ruta',
      seasonal: 'Estacional',
    };
    return labels[type] || type;
  };

  if (isLoading) {
    return (
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
        <div className="animate-pulse">
          <div className="h-6 bg-slate-700 rounded w-48 mb-4" />
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-slate-700 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-amber-500/20 rounded-lg">
          <Lightbulb className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Patrones Detectados</h3>
          <p className="text-sm text-slate-400">
            {patterns.length} patrones identificados
          </p>
        </div>
      </div>

      {/* Patterns List */}
      <div className="space-y-4">
        {patterns.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <Lightbulb className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No se han detectado patrones aun</p>
            <p className="text-sm">Carga mas datos para analizar</p>
          </div>
        ) : (
          patterns.map((pattern) => (
            <div
              key={pattern.id}
              className="p-4 bg-slate-900/50 rounded-lg border border-slate-700/50 hover:border-amber-500/30 transition-colors cursor-pointer"
              onClick={() => onPatternClick?.(pattern)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {getImpactIcon(pattern.impact)}
                    <span className="font-medium text-white">{pattern.title}</span>
                    <span className="text-xs px-2 py-0.5 bg-slate-700 rounded text-slate-300">
                      {getTypeLabel(pattern.type)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 mb-2">{pattern.description}</p>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span>Frecuencia: {pattern.frequency}x</span>
                    <span>Afecta: {pattern.affectedShipments} envios</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-500" />
              </div>

              {pattern.recommendation && (
                <div className="mt-3 p-2 bg-amber-500/10 rounded border border-amber-500/20">
                  <p className="text-xs text-amber-300">
                    <strong>Recomendacion:</strong> {pattern.recommendation}
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PatternDetection;
