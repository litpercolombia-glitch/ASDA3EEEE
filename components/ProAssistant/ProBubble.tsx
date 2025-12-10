// components/ProAssistant/ProBubble.tsx
// Burbuja flotante PRO premium para el asistente LITPER
import React, { useEffect, useState } from 'react';
import { Sparkles, X, Zap, Crown } from 'lucide-react';
import { useProAssistantStore } from '../../stores/proAssistantStore';
import ProPanel from './ProPanel';

interface ProBubbleProps {
  shipmentsContext?: any[];
}

const ProBubble: React.FC<ProBubbleProps> = ({ shipmentsContext = [] }) => {
  const {
    isOpen,
    setIsOpen,
    notifications,
    clearNotifications,
    isProcessing,
    setShipmentsContext,
  } = useProAssistantStore();

  const [isAnimating, setIsAnimating] = useState(false);
  const [showPulse, setShowPulse] = useState(true);

  // Actualizar contexto de shipments
  useEffect(() => {
    setShipmentsContext(shipmentsContext);
  }, [shipmentsContext, setShipmentsContext]);

  // Animacion de pulso cada 3 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isOpen) {
        setShowPulse(true);
        setTimeout(() => setShowPulse(false), 1500);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isOpen]);

  const handleClick = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);

    if (!isOpen) {
      clearNotifications();
    }
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* ============================================ */}
      {/* EFECTO GLOW DE FONDO */}
      {/* ============================================ */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-[9997] pointer-events-none">
          {/* Glow pulsante */}
          <div
            className={`absolute inset-0 w-16 h-16 rounded-2xl
              bg-gradient-to-br from-amber-400 via-orange-500 to-red-500
              blur-xl opacity-40
              ${showPulse ? 'animate-ping' : 'animate-pulse'}`}
            style={{ animationDuration: showPulse ? '1.5s' : '3s' }}
          />
        </div>
      )}

      {/* ============================================ */}
      {/* BOTON FLOTANTE PRO */}
      {/* ============================================ */}
      <button
        onClick={handleClick}
        className={`
          fixed bottom-6 right-6 z-[9999]
          w-16 h-16
          rounded-2xl
          bg-gradient-to-br from-amber-400 via-orange-500 to-red-500
          shadow-2xl shadow-orange-500/40
          cursor-pointer
          transition-all duration-300 ease-out
          hover:scale-110 hover:shadow-orange-500/60
          hover:from-amber-300 hover:via-orange-400 hover:to-red-400
          active:scale-95
          flex flex-col items-center justify-center
          border-2 border-amber-300/50
          overflow-hidden
          group
          ${isAnimating ? 'scale-90' : ''}
          ${isProcessing ? 'animate-pulse' : ''}
        `}
        title={isOpen ? 'Cerrar Asistente PRO' : 'Abrir Asistente PRO Litper'}
        aria-label={isOpen ? 'Cerrar asistente' : 'Abrir asistente PRO'}
      >
        {/* Efecto shine que recorre el boton */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent
            opacity-0 group-hover:opacity-100
            -translate-x-full group-hover:translate-x-full
            transition-transform duration-700 ease-in-out"
          style={{ transform: 'skewX(-20deg)' }}
        />

        {/* Particulas de brillo */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1 right-2 w-1.5 h-1.5 bg-white/60 rounded-full animate-pulse" />
          <div className="absolute top-3 left-2 w-1 h-1 bg-yellow-200/80 rounded-full animate-pulse delay-150" />
          <div className="absolute bottom-2 right-3 w-1 h-1 bg-white/50 rounded-full animate-pulse delay-300" />
        </div>

        {/* Contenido del boton */}
        {isOpen ? (
          <X className="w-7 h-7 text-white drop-shadow-lg transition-transform group-hover:rotate-90" />
        ) : (
          <>
            {/* Texto PRO */}
            <span className="text-white font-black text-[10px] tracking-widest drop-shadow-lg uppercase">
              PRO
            </span>

            {/* Icono */}
            {isProcessing ? (
              <Zap className="w-6 h-6 text-white drop-shadow-lg animate-pulse" />
            ) : (
              <Sparkles className="w-6 h-6 text-white drop-shadow-lg group-hover:animate-spin"
                style={{ animationDuration: '2s' }} />
            )}
          </>
        )}

        {/* Badge de notificaciones */}
        {notifications > 0 && !isOpen && (
          <div
            className="absolute -top-1 -right-1 min-w-[22px] h-[22px] px-1
              bg-red-500 rounded-full
              text-white text-xs font-bold
              flex items-center justify-center
              animate-bounce shadow-lg shadow-red-500/50
              border-2 border-white"
          >
            {notifications > 99 ? '99+' : notifications}
          </div>
        )}

        {/* Indicador de procesamiento */}
        {isProcessing && !isOpen && (
          <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-10 h-1 bg-white/30 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full animate-pulse" style={{ width: '60%' }} />
          </div>
        )}
      </button>

      {/* ============================================ */}
      {/* PANEL DEL ASISTENTE */}
      {/* ============================================ */}
      {isOpen && <ProPanel />}

      {/* ============================================ */}
      {/* ESTILOS CSS ADICIONALES */}
      {/* ============================================ */}
      <style>{`
        @keyframes pro-shine {
          0% {
            transform: translateX(-100%) skewX(-20deg);
          }
          100% {
            transform: translateX(200%) skewX(-20deg);
          }
        }

        @keyframes pro-glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(251, 191, 36, 0.5),
                        0 0 40px rgba(249, 115, 22, 0.3),
                        0 0 60px rgba(239, 68, 68, 0.2);
          }
          50% {
            box-shadow: 0 0 30px rgba(251, 191, 36, 0.7),
                        0 0 60px rgba(249, 115, 22, 0.5),
                        0 0 90px rgba(239, 68, 68, 0.3);
          }
        }

        .pro-bubble-glow {
          animation: pro-glow 3s ease-in-out infinite;
        }
      `}</style>
    </>
  );
};

export default ProBubble;
