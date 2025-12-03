import React from 'react';
import { Shipment, ShipmentStatus } from '../types';
import { X, Copy, Check } from 'lucide-react';
import { getShipmentRecommendation } from '../services/logisticsService';

interface QuickReferencePanelProps {
  isOpen: boolean;
  onClose: () => void;
  shipments: Shipment[];
}

export const QuickReferencePanel: React.FC<QuickReferencePanelProps> = ({
  isOpen,
  onClose,
  shipments,
}) => {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-white dark:bg-navy-950 shadow-2xl transform transition-transform z-50 flex flex-col border-l border-slate-200 dark:border-navy-800">
      <div className="p-4 bg-navy-900 text-white flex justify-between items-center shadow-md border-b border-navy-800">
        <h2 className="font-bold text-sm">Referencia Rápida</h2>
        <button
          onClick={onClose}
          className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 bg-slate-50 dark:bg-navy-950">
        <div className="space-y-2">
          {shipments.map((s, idx) => {
            const rec = getShipmentRecommendation(s);
            return (
              <div
                key={s.id}
                className="bg-white dark:bg-navy-900 p-3 rounded-lg border border-slate-200 dark:border-navy-800 shadow-sm text-xs"
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    #{idx + 1} {s.id}
                  </span>
                  <button
                    onClick={() => handleCopy(s.id, `id-${s.id}`)}
                    className="text-slate-400 hover:text-blue-500"
                  >
                    {copiedId === `id-${s.id}` ? (
                      <Check className="w-3 h-3 text-green-500" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
                <div className="flex justify-between items-start mb-1">
                  <span className="text-slate-500">Tel: {s.phone || 'N/A'}</span>
                  {s.phone && (
                    <button
                      onClick={() => handleCopy(s.phone!, `phone-${s.id}`)}
                      className="text-slate-400 hover:text-blue-500"
                    >
                      {copiedId === `phone-${s.id}` ? (
                        <Check className="w-3 h-3 text-green-500" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  )}
                </div>
                <div
                  className={`mt-2 p-1.5 rounded bg-slate-50 dark:bg-navy-950 border ${s.status === ShipmentStatus.ISSUE ? 'border-red-200 text-red-700' : 'border-slate-100 text-slate-600'}`}
                >
                  <p className="font-bold mb-0.5">{s.status}</p>
                  <p className="opacity-80 italic leading-tight">{rec}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
