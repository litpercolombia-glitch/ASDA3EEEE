import React, { useState, useEffect } from 'react';
import { Shipment, ShipmentStatus } from '../types';
import { generateBulkTrackingUrl } from '../services/logisticsService';
import { parseTrackingScreenshot } from '../services/geminiService';
import { X, ExternalLink, Image as ImageIcon, CheckCircle, ArrowRight, Loader2, Save } from 'lucide-react';

interface BatchTrackingModalProps {
  shipments: Shipment[];
  onClose: () => void;
  onUpdateBatch: (updates: {id: string, status: ShipmentStatus}[]) => void;
}

export const BatchTrackingModal: React.FC<BatchTrackingModalProps> = ({ shipments, onClose, onUpdateBatch }) => {
  const [image, setImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectedUpdates, setDetectedUpdates] = useState<{id: string, status: ShipmentStatus, rawStatus: string}[]>([]);
  const [step, setStep] = useState(1);

  // Generate URL for the filtered shipments
  const trackingUrl = generateBulkTrackingUrl(shipments);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onload = (event) => {
              if (event.target?.result) {
                setImage(event.target.result as string);
                handleAnalyze(event.target.result as string);
              }
            };
            reader.readAsDataURL(blob);
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleAnalyze = async (base64Img: string) => {
    setIsProcessing(true);
    setStep(2);
    const results = await parseTrackingScreenshot(base64Img);
    
    // Filter results to only include IDs that exist in our provided shipments list (optional, but safer)
    // Actually, we trust the ID matching.
    setDetectedUpdates(results);
    setIsProcessing(false);
  };

  const handleApplyUpdates = () => {
    onUpdateBatch(detectedUpdates.map(u => ({ id: u.id, status: u.status })));
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded">17TRACK</span>
              Rastreo Masivo IA
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Actualiza múltiples guías usando Inteligencia Visual</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-500"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                
                {/* Step 1: Action */}
                <div className="space-y-6">
                    <div className="relative pl-8 border-l-2 border-slate-200 dark:border-slate-700">
                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-indigo-500 ring-4 ring-white dark:ring-slate-900"></div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Paso 1: Abrir Rastreo</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                            Generamos un enlace inteligente con las <strong>{Math.min(shipments.length, 40)} guías</strong> visibles.
                        </p>
                        <a 
                            href={trackingUrl} 
                            target="_blank" 
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/30"
                        >
                            <ExternalLink className="w-5 h-5" />
                            Abrir en 17TRACK
                        </a>
                    </div>

                    <div className="relative pl-8 border-l-2 border-slate-200 dark:border-slate-700 pb-2">
                        <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full ring-4 ring-white dark:ring-slate-900 ${step >= 2 ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-700'}`}></div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Paso 2: Capturar y Pegar</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                            En la página de 17TRACK, toma una captura de pantalla (Win+Shift+S) donde se vean las guías y sus estados. Luego presiona <strong>Ctrl + V</strong> aquí.
                        </p>
                        
                        <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                            image 
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10' 
                            : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50'
                        }`}>
                             {image ? (
                                 <div className="flex flex-col items-center">
                                     <img src={image} alt="Pasted" className="h-32 object-contain mb-3 rounded shadow-sm opacity-80" />
                                     <p className="text-emerald-600 dark:text-emerald-400 font-bold text-sm flex items-center gap-2">
                                         <CheckCircle className="w-4 h-4" /> Imagen capturada
                                     </p>
                                 </div>
                             ) : (
                                 <div className="flex flex-col items-center py-4">
                                     <div className="p-4 bg-white dark:bg-slate-800 rounded-full shadow-sm mb-3">
                                         <ImageIcon className="w-8 h-8 text-slate-400" />
                                     </div>
                                     <p className="text-slate-600 dark:text-slate-300 font-medium">Pegar Pantallazo (Ctrl+V)</p>
                                 </div>
                             )}
                        </div>
                    </div>
                </div>

                {/* Step 3: Results */}
                <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 flex flex-col h-full">
                    <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Resultados del Análisis</h3>
                    
                    <div className="flex-1 overflow-y-auto min-h-[200px] space-y-2 pr-2">
                        {isProcessing ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                <Loader2 className="w-8 h-8 animate-spin mb-3 text-indigo-500" />
                                <p className="text-sm">Gemini Vision está leyendo los estados...</p>
                            </div>
                        ) : detectedUpdates.length > 0 ? (
                            detectedUpdates.map((update, idx) => (
                                <div key={idx} className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 flex justify-between items-center shadow-sm">
                                    <div>
                                        <p className="font-mono font-bold text-slate-800 dark:text-slate-200 text-sm">{update.id}</p>
                                        <p className="text-xs text-slate-400">Detectado: "{update.rawStatus}"</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <ArrowRight className="w-3 h-3 text-slate-300" />
                                        <span className={`text-xs font-bold px-2 py-1 rounded border ${
                                            update.status === ShipmentStatus.DELIVERED ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                            update.status === ShipmentStatus.ISSUE ? 'bg-red-50 text-red-700 border-red-100' :
                                            'bg-blue-50 text-blue-700 border-blue-100'
                                        }`}>
                                            {update.status}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                                <p className="text-sm text-center px-6">Los resultados aparecerán aquí después de pegar la imagen.</p>
                            </div>
                        )}
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                        <button 
                            onClick={handleApplyUpdates}
                            disabled={detectedUpdates.length === 0}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            Actualizar {detectedUpdates.length} Guías
                        </button>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};