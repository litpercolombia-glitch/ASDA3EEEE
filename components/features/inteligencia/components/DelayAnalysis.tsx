/**
 * DELAY ANALYSIS
 *
 * Componente para analisis de retrasos en envios.
 */

import React from 'react';
import { Clock, AlertTriangle, DollarSign, Truck } from 'lucide-react';
import { DelayAnalysis as DelayData, DelayReport } from '../types';
import { formatCurrency, formatNumber } from '../../../../utils/formatters';

interface DelayAnalysisProps {
  delays: DelayData[];
  report: DelayReport;
  isLoading?: boolean;
  onViewShipment?: (shipmentId: string) => void;
}

const DelayAnalysisComponent: React.FC<DelayAnalysisProps> = ({
  delays,
  report,
  isLoading = false,
  onViewShipment,
}) => {
  if (isLoading) {
    return (
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
        <div className="animate-pulse">
          <div className="h-6 bg-slate-700 rounded w-40 mb-4" />
          <div className="grid grid-cols-2 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
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
        <div className="p-2 bg-red-500/20 rounded-lg">
          <Clock className="w-5 h-5 text-red-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Analisis de Retrasos</h3>
          <p className="text-sm text-slate-400">
            {report.totalDelays} envios con retraso
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-slate-900/50 rounded-lg text-center">
          <AlertTriangle className="w-6 h-6 text-red-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-white">{report.totalDelays}</div>
          <div className="text-xs text-slate-400">Total Retrasos</div>
        </div>
        <div className="p-4 bg-slate-900/50 rounded-lg text-center">
          <Clock className="w-6 h-6 text-amber-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-white">{report.avgDelayDays.toFixed(1)}d</div>
          <div className="text-xs text-slate-400">Promedio Dias</div>
        </div>
        <div className="p-4 bg-slate-900/50 rounded-lg text-center col-span-2">
          <Truck className="w-6 h-6 text-blue-400 mx-auto mb-2" />
          <div className="text-lg font-bold text-white">
            {report.carrierPerformance[0]?.carrier || 'N/A'}
          </div>
          <div className="text-xs text-slate-400">Mayor tasa de retraso</div>
        </div>
      </div>

      {/* Top Reasons */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-slate-300 mb-3">Principales Razones</h4>
        <div className="space-y-2">
          {report.topReasons.slice(0, 5).map((reason, index) => (
            <div key={reason.reason} className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-slate-700 text-slate-300 text-xs flex items-center justify-center">
                {index + 1}
              </span>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">{reason.reason}</span>
                  <span className="text-sm text-slate-400">{reason.count}</span>
                </div>
                <div className="mt-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 rounded-full"
                    style={{ width: `${(reason.count / report.totalDelays) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Delays */}
      <div>
        <h4 className="text-sm font-medium text-slate-300 mb-3">Retrasos Recientes</h4>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {delays.slice(0, 10).map((delay) => (
            <div
              key={delay.shipment.id}
              className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg hover:bg-slate-900 transition-colors cursor-pointer"
              onClick={() => onViewShipment?.(delay.shipment.id)}
            >
              <div>
                <span className="font-mono text-sm text-white">
                  {delay.shipment.id.slice(0, 15)}...
                </span>
                <p className="text-xs text-slate-400">{delay.delayReason}</p>
              </div>
              <div className="text-right">
                <div className="text-sm text-red-400">{delay.delayDays} dias</div>
                <div className="text-xs text-slate-500">
                  {formatCurrency(delay.estimatedCost)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DelayAnalysisComponent;
