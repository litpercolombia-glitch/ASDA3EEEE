import React, { useState, useEffect, useRef } from 'react';
import { Shipment, ShipmentStatus } from '../types';
import { X, Upload, Wand2, Loader2, Download, FileText } from 'lucide-react';
import { analyzeEvidenceImage } from '../services/geminiService';
import * as ReactDOMServer from 'react-dom/server';

interface EvidenceModalProps {
  shipment: Shipment;
  onClose: () => void;
  onSave: (id: string, imageData: string, analysis?: string) => void;
}

export const EvidenceModal: React.FC<EvidenceModalProps> = ({ shipment, onClose, onSave }) => {
  const [image, setImage] = useState<string | null>(shipment.evidenceImage || null);
  const [analysis, setAnalysis] = useState<string | null>(shipment.aiAnalysis || null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
         if (event.target?.result) setImage(event.target.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!image) return;
    setIsAnalyzing(true);
    const result = await analyzeEvidenceImage(image);
    setAnalysis(result);
    setIsAnalyzing(false);
  };

  const handleSave = () => {
    if (image) {
      onSave(shipment.id, image, analysis || undefined);
    }
    onClose();
  };

  // Generate SVG Card Code
  const downloadCard = () => {
      if(!image) return;

      const svgContent = (
          <svg width="600" height="800" xmlns="http://www.w3.org/2000/svg" style={{ fontFamily: 'Arial, sans-serif' }}>
              <rect width="100%" height="100%" fill="#ffffff" />
              <rect width="100%" height="10" fill={shipment.status === ShipmentStatus.DELIVERED ? "#22c55e" : "#ef4444"} />
              
              <text x="40" y="60" fontSize="24" fontWeight="bold" fill="#333">REPORTE DE NOVEDAD</text>
              <text x="40" y="90" fontSize="16" fill="#666">Litper Logística</text>
              
              <text x="40" y="140" fontSize="14" fill="#888">GUÍA:</text>
              <text x="40" y="165" fontSize="20" fontWeight="bold" fill="#000">{shipment.id}</text>
              
              <text x="300" y="140" fontSize="14" fill="#888">ESTADO:</text>
              <text x="300" y="165" fontSize="20" fontWeight="bold" fill={shipment.status === ShipmentStatus.DELIVERED ? "#22c55e" : "#ef4444"}>{shipment.status}</text>
              
              <text x="40" y="210" fontSize="14" fill="#888">FECHA:</text>
              <text x="40" y="235" fontSize="16" fill="#000">{new Date().toLocaleDateString()}</text>

              {/* Image Embedding in SVG */}
              <image href={image} x="40" y="260" height="300" width="520" preserveAspectRatio="xMidYMid slice" />
              
              <rect x="40" y="580" width="520" height="180" fill="#f8fafc" rx="10" />
              <text x="60" y="610" fontSize="14" fontWeight="bold" fill="#475569">Análisis IA:</text>
              
              {/* Very basic text wrapping for SVG */}
              <foreignObject x="60" y="620" width="480" height="130">
                  <div xmlns="http://www.w3.org/1999/xhtml" style={{ fontSize: '14px', color: '#334155' }}>
                      {analysis || "Sin análisis automático."}
                  </div>
              </foreignObject>
          </svg>
      );

      const svgString = ReactDOMServer.renderToStaticMarkup(svgContent);
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Reporte_${shipment.id}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800" ref={modalRef}>
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-900 z-10">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Evidencia Fotográfica - {shipment.id}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400"><X className="w-5 h-5" /></button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-xl min-h-[300px] flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-950 relative overflow-hidden group">
            {image ? (
              <img src={image} alt="Evidence" className="w-full h-auto max-h-[500px] object-contain" />
            ) : (
              <div className="text-center p-8">
                <Upload className="w-12 h-12 text-gray-400 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-gray-500 dark:text-slate-400 font-medium">Pegue (Ctrl+V) su imagen aquí</p>
                <p className="text-sm text-gray-400 dark:text-slate-500 mb-4">o suba un archivo</p>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileUpload} 
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-slate-800 dark:file:text-blue-400" 
                />
              </div>
            )}
          </div>

          {image && (
            <div className="flex flex-col gap-4">
               <div className="flex gap-2">
                   <button 
                     onClick={handleAnalyze} 
                     disabled={isAnalyzing}
                     className="flex-1 flex items-center justify-center gap-2 bg-purple-600 text-white py-2.5 px-4 rounded-xl hover:bg-purple-700 disabled:opacity-50 transition-colors shadow-lg shadow-purple-900/20 font-medium"
                   >
                     {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                     Analizar con Gemini
                   </button>
                   
                   <button 
                      onClick={downloadCard}
                      className="flex-1 flex items-center justify-center gap-2 bg-slate-800 dark:bg-slate-700 text-white py-2.5 px-4 rounded-xl hover:bg-slate-900 dark:hover:bg-slate-600 transition-colors font-medium"
                   >
                       <Download className="w-4 h-4" />
                       Descargar Ficha
                   </button>
               </div>

               {analysis && (
                   <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl border border-purple-100 dark:border-purple-800">
                       <h4 className="text-xs font-bold text-purple-800 dark:text-purple-300 uppercase mb-2 flex items-center gap-1">
                           <FileText className="w-3 h-3"/> Análisis IA
                       </h4>
                       <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed">{analysis}</p>
                   </div>
               )}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 flex justify-end gap-3 sticky bottom-0 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-white font-medium">Cancelar</button>
          <button onClick={handleSave} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm">
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
};