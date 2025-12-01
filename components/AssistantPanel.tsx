import React, { useState, useRef, useEffect } from 'react';
import { askAssistant } from '../services/geminiService';
import { GeminiChatMessage, Shipment } from '../types';
import {
  Send,
  MapPin,
  Search,
  Bot,
  Mic,
  Loader2,
  X,
  Image as ImageIcon,
  FileSpreadsheet,
  MessageSquarePlus,
} from 'lucide-react';

interface AssistantPanelProps {
  isOpen: boolean;
  onClose: () => void;
  shipmentsContext: Shipment[];
  onGenerateReport?: () => string; // Modified to return the string
}

export const AssistantPanel: React.FC<AssistantPanelProps> = ({
  isOpen,
  onClose,
  shipmentsContext,
  onGenerateReport,
}) => {
  const [messages, setMessages] = useState<(GeminiChatMessage & { image?: string })[]>([
    {
      role: 'model',
      text: 'Hola, soy tu asistente de Litper Logística. Puedo ayudarte a rastrear guías, redactar mensajes o generar imágenes para marketing.',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = { role: 'user' as const, text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Get location if possible for Maps Grounding
    let location: GeolocationCoordinates | undefined;
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
      });
      location = pos.coords;
    } catch (e) {
      console.log('Location not available');
    }

    const response = await askAssistant(userMsg.text, shipmentsContext, location);

    setMessages((prev) => [...prev, { role: 'model', text: response.text, image: response.image }]);
    setIsLoading(false);
  };

  const handleGenerateReportClick = () => {
    if (onGenerateReport) {
      const reportText = onGenerateReport();
      setMessages((prev) => [
        ...prev,
        { role: 'user', text: 'Generar reporte masivo de guías.' },
        { role: 'model', text: reportText },
      ]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white dark:bg-navy-950 shadow-2xl transform transition-transform z-40 flex flex-col border-l border-slate-200 dark:border-navy-800">
      <div className="p-4 bg-navy-900 text-white flex justify-between items-center shadow-md border-b border-navy-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-gold-500 rounded-lg text-navy-900">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-sm">Asistente Litper</h2>
            <p className="text-[10px] text-slate-400">Gemini Pro Integrado</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-navy-950">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl p-3 text-sm shadow-sm mb-1 ${
                m.role === 'user'
                  ? 'bg-navy-800 text-white rounded-br-none border border-navy-700'
                  : 'bg-white dark:bg-navy-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-navy-800 rounded-bl-none overflow-x-auto'
              }`}
            >
              <div className="whitespace-pre-wrap font-mono text-xs">{m.text}</div>
            </div>
            {m.image && (
              <div className="max-w-[85%] rounded-xl overflow-hidden shadow-lg border-2 border-gold-500/50 mt-1">
                <img src={m.image} alt="Generated" className="w-full h-auto" />
                <div className="bg-navy-900 text-gold-500 text-[10px] px-2 py-1 flex items-center gap-1 font-bold uppercase">
                  <ImageIcon className="w-3 h-3" /> Imagen Generada
                </div>
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-navy-900 p-3 rounded-2xl rounded-bl-none border border-slate-200 dark:border-navy-800 shadow-sm">
              <Loader2 className="w-4 h-4 animate-spin text-gold-500" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions Footer */}
      <div className="p-2 bg-slate-50 dark:bg-navy-950 border-t border-slate-100 dark:border-navy-800 flex gap-2 overflow-x-auto">
        {onGenerateReport && (
          <button
            onClick={handleGenerateReportClick}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold whitespace-nowrap hover:bg-emerald-200 transition-colors border border-emerald-200"
          >
            <MessageSquarePlus className="w-3 h-3" /> Reporte Masivo (Chat)
          </button>
        )}
      </div>

      <div className="p-4 bg-white dark:bg-navy-900 border-t border-slate-100 dark:border-navy-800">
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-navy-950 rounded-xl px-4 py-3 border border-transparent focus-within:ring-2 focus-within:ring-gold-500 focus-within:bg-white dark:focus-within:bg-navy-800 transition-all">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pregunta o escribe 'Crear imagen...'"
            className="flex-1 bg-transparent outline-none text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
          />
          <button
            onClick={handleSend}
            disabled={isLoading}
            className="text-navy-600 dark:text-gold-500 hover:text-navy-800 dark:hover:text-gold-300"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
