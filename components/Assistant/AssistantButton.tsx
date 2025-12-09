import React, { useState } from 'react';
import { MessageCircle, X, Sparkles } from 'lucide-react';
import { AssistantPanelNew } from './AssistantPanelNew';

interface AssistantButtonProps {
  shipmentsContext?: any[];
  className?: string;
}

export const AssistantButton: React.FC<AssistantButtonProps> = ({
  shipmentsContext = [],
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasNotification, setHasNotification] = useState(true);

  const handleOpen = () => {
    setIsOpen(true);
    setHasNotification(false);
  };

  return (
    <>
      {/* Boton flotante */}
      <button
        onClick={isOpen ? () => setIsOpen(false) : handleOpen}
        className={`
          fixed bottom-6 right-6 z-50
          w-14 h-14
          bg-gradient-to-br from-blue-600 to-purple-600
          hover:from-blue-700 hover:to-purple-700
          text-white rounded-full
          shadow-lg shadow-blue-500/30
          flex items-center justify-center
          transition-all duration-300
          hover:scale-110 hover:shadow-xl hover:shadow-blue-500/40
          group
          ${className}
        `}
        title={isOpen ? 'Cerrar Asistente' : 'Abrir Asistente Litper'}
      >
        {isOpen ? (
          <X className="w-6 h-6 transition-transform group-hover:rotate-90" />
        ) : (
          <>
            <Sparkles className="w-6 h-6" />
            {/* Indicador de notificacion */}
            {hasNotification && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse" />
            )}
          </>
        )}

        {/* Efecto de brillo */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>

      {/* Panel del asistente */}
      {isOpen && (
        <AssistantPanelNew
          onClose={() => setIsOpen(false)}
          shipmentsContext={shipmentsContext}
        />
      )}
    </>
  );
};

export default AssistantButton;
