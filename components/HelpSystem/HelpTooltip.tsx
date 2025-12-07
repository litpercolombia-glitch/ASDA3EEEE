/**
 * SISTEMA DE AYUDA CONTEXTUAL - HelpTooltip
 * ==========================================
 *
 * Componente que muestra tooltips de ayuda cuando el usuario
 * pasa el mouse sobre elementos de la interfaz.
 *
 * EJEMPLO DE USO:
 *
 * <HelpTooltip
 *   title="Cargar Conocimiento"
 *   content="Sube archivos, enlaces web o videos de YouTube"
 *   steps={[
 *     "Click en 'Cargar'",
 *     "Selecciona tipo de fuente",
 *     "Pega URL o sube archivo"
 *   ]}
 *   tips={[
 *     "PDFs con texto funcionan mejor",
 *     "Videos necesitan subtítulos"
 *   ]}
 * >
 *   <button>Cargar Conocimiento</button>
 * </HelpTooltip>
 *
 * @author Litper IA System
 * @version 1.0.0
 */

import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { HelpCircle, Lightbulb, CheckCircle, Info, X } from 'lucide-react';

// ==================== TIPOS ====================

export interface HelpTooltipProps {
  /** Elemento hijo que activará el tooltip */
  children: ReactNode;

  /** Título del tooltip (opcional) */
  title?: string;

  /** Contenido descriptivo principal */
  content?: string;

  /** Lista de pasos a seguir */
  steps?: string[];

  /** Lista de tips/consejos */
  tips?: string[];

  /** Posición del tooltip */
  position?: 'top' | 'bottom' | 'left' | 'right' | 'auto';

  /** Icono a mostrar */
  icon?: 'help' | 'info' | 'lightbulb' | 'none';

  /** Tamaño del icono */
  iconSize?: number;

  /** Ancho máximo del tooltip */
  maxWidth?: number;

  /** Mostrar siempre el icono (no solo en hover) */
  alwaysShowIcon?: boolean;

  /** Delay antes de mostrar (ms) */
  delay?: number;

  /** Clase CSS adicional para el tooltip */
  className?: string;

  /** Si el tooltip es interactivo (se puede hacer click) */
  interactive?: boolean;

  /** Callback cuando se muestra */
  onShow?: () => void;

  /** Callback cuando se oculta */
  onHide?: () => void;
}

// ==================== COMPONENTE ====================

const HelpTooltip: React.FC<HelpTooltipProps> = ({
  children,
  title,
  content,
  steps = [],
  tips = [],
  position = 'auto',
  icon = 'help',
  iconSize = 14,
  maxWidth = 350,
  alwaysShowIcon = false,
  delay = 200,
  className = '',
  interactive = false,
  onShow,
  onHide,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [actualPosition, setActualPosition] = useState(position);
  const [tooltipCoords, setTooltipCoords] = useState({ top: 0, left: 0 });

  const wrapperRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Calcular posición del tooltip
  const calculatePosition = () => {
    if (!wrapperRef.current || !tooltipRef.current) return;

    const wrapperRect = wrapperRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;

    let finalPosition = position;
    let top = 0;
    let left = 0;

    // Auto-determinar posición si es 'auto'
    if (position === 'auto') {
      const spaceAbove = wrapperRect.top;
      const spaceBelow = viewportHeight - wrapperRect.bottom;
      const spaceLeft = wrapperRect.left;
      const spaceRight = viewportWidth - wrapperRect.right;

      if (spaceAbove > tooltipRect.height + 20) {
        finalPosition = 'top';
      } else if (spaceBelow > tooltipRect.height + 20) {
        finalPosition = 'bottom';
      } else if (spaceRight > tooltipRect.width + 20) {
        finalPosition = 'right';
      } else {
        finalPosition = 'left';
      }
    }

    // Calcular coordenadas según posición
    switch (finalPosition) {
      case 'top':
        top = wrapperRect.top + scrollY - tooltipRect.height - 10;
        left = wrapperRect.left + scrollX + wrapperRect.width / 2 - tooltipRect.width / 2;
        break;
      case 'bottom':
        top = wrapperRect.bottom + scrollY + 10;
        left = wrapperRect.left + scrollX + wrapperRect.width / 2 - tooltipRect.width / 2;
        break;
      case 'left':
        top = wrapperRect.top + scrollY + wrapperRect.height / 2 - tooltipRect.height / 2;
        left = wrapperRect.left + scrollX - tooltipRect.width - 10;
        break;
      case 'right':
        top = wrapperRect.top + scrollY + wrapperRect.height / 2 - tooltipRect.height / 2;
        left = wrapperRect.right + scrollX + 10;
        break;
    }

    // Asegurar que no se salga de la pantalla
    if (left < 10) left = 10;
    if (left + tooltipRect.width > viewportWidth - 10) {
      left = viewportWidth - tooltipRect.width - 10;
    }
    if (top < scrollY + 10) top = scrollY + 10;

    setActualPosition(finalPosition as 'top' | 'bottom' | 'left' | 'right');
    setTooltipCoords({ top, left });
  };

  // Mostrar tooltip
  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
      onShow?.();
    }, delay);
  };

  // Ocultar tooltip
  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (!interactive || !isHovering) {
      setIsVisible(false);
      onHide?.();
    }
  };

  // Handlers
  const handleMouseEnter = () => {
    setIsHovering(true);
    showTooltip();
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    if (!interactive) {
      hideTooltip();
    } else {
      // Pequeño delay para permitir moverse al tooltip
      setTimeout(() => {
        if (!isHovering) {
          hideTooltip();
        }
      }, 100);
    }
  };

  const handleTooltipMouseEnter = () => {
    if (interactive) {
      setIsHovering(true);
    }
  };

  const handleTooltipMouseLeave = () => {
    if (interactive) {
      setIsHovering(false);
      hideTooltip();
    }
  };

  // Recalcular posición cuando cambia visibilidad
  useEffect(() => {
    if (isVisible) {
      // Usar requestAnimationFrame para asegurar que el DOM está listo
      requestAnimationFrame(() => {
        calculatePosition();
      });
    }
  }, [isVisible]);

  // Recalcular en resize
  useEffect(() => {
    const handleResize = () => {
      if (isVisible) {
        calculatePosition();
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize);
    };
  }, [isVisible]);

  // Limpiar timeout
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Renderizar icono
  const renderIcon = () => {
    if (icon === 'none') return null;

    const IconComponent = {
      help: HelpCircle,
      info: Info,
      lightbulb: Lightbulb,
    }[icon];

    return (
      <span
        className={`
          inline-flex items-center justify-center
          transition-opacity duration-200
          ${alwaysShowIcon ? 'opacity-60' : 'opacity-0 group-hover:opacity-60'}
          text-gray-400 hover:text-blue-500
          cursor-help ml-1
        `}
      >
        <IconComponent size={iconSize} />
      </span>
    );
  };

  // Sin contenido, solo renderizar children
  if (!title && !content && steps.length === 0 && tips.length === 0) {
    return <>{children}</>;
  }

  return (
    <div
      ref={wrapperRef}
      className="relative inline-flex items-center group"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Elemento original */}
      <div className="inline-flex items-center">
        {children}
        {renderIcon()}
      </div>

      {/* Tooltip */}
      {isVisible && (
        <div
          ref={tooltipRef}
          className={`
            fixed z-[10000]
            bg-white dark:bg-gray-800
            border border-gray-200 dark:border-gray-700
            rounded-lg shadow-xl
            p-4
            animate-tooltip-appear
            ${className}
          `}
          style={{
            top: tooltipCoords.top,
            left: tooltipCoords.left,
            maxWidth: maxWidth,
            minWidth: 220,
          }}
          onMouseEnter={handleTooltipMouseEnter}
          onMouseLeave={handleTooltipMouseLeave}
        >
          {/* Flecha del tooltip */}
          <div
            className={`
              absolute w-3 h-3
              bg-white dark:bg-gray-800
              border-gray-200 dark:border-gray-700
              transform rotate-45
              ${actualPosition === 'top' ? 'bottom-[-7px] left-1/2 -translate-x-1/2 border-r border-b' : ''}
              ${actualPosition === 'bottom' ? 'top-[-7px] left-1/2 -translate-x-1/2 border-l border-t' : ''}
              ${actualPosition === 'left' ? 'right-[-7px] top-1/2 -translate-y-1/2 border-r border-t' : ''}
              ${actualPosition === 'right' ? 'left-[-7px] top-1/2 -translate-y-1/2 border-l border-b' : ''}
            `}
          />

          {/* Título */}
          {title && (
            <div className="flex items-center gap-2 mb-2 pb-2 border-b-2 border-blue-500">
              <Lightbulb size={18} className="text-blue-500" />
              <span className="font-semibold text-gray-800 dark:text-white">
                {title}
              </span>
            </div>
          )}

          {/* Contenido principal */}
          {content && (
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 leading-relaxed">
              {content}
            </p>
          )}

          {/* Pasos */}
          {steps.length > 0 && (
            <div className="mb-3">
              <div className="flex items-center gap-1 text-xs font-semibold text-gray-700 dark:text-gray-200 mb-2">
                <CheckCircle size={14} className="text-green-500" />
                Pasos:
              </div>
              <ol className="list-decimal list-inside space-y-1">
                {steps.map((step, index) => (
                  <li
                    key={index}
                    className="text-xs text-gray-600 dark:text-gray-400"
                  >
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Tips */}
          {tips.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/30 rounded-md p-2">
              <div className="flex items-center gap-1 text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">
                <Lightbulb size={14} />
                Tips:
              </div>
              <ul className="space-y-1">
                {tips.map((tip, index) => (
                  <li
                    key={index}
                    className="text-xs text-blue-600 dark:text-blue-400 flex items-start gap-1"
                  >
                    <span className="text-blue-400">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Estilos de animación */}
      <style>{`
        @keyframes tooltip-appear {
          from {
            opacity: 0;
            transform: translateY(-5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-tooltip-appear {
          animation: tooltip-appear 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

// ==================== COMPONENTES ADICIONALES ====================

/**
 * HelpBadge - Insignia de ayuda que se puede colocar en cualquier lugar
 */
export const HelpBadge: React.FC<{
  title: string;
  content: string;
  steps?: string[];
  tips?: string[];
}> = (props) => {
  return (
    <HelpTooltip {...props} alwaysShowIcon icon="help">
      <span className="sr-only">Ayuda</span>
    </HelpTooltip>
  );
};

/**
 * InfoBadge - Insignia de información
 */
export const InfoBadge: React.FC<{
  title?: string;
  content: string;
}> = (props) => {
  return (
    <HelpTooltip {...props} alwaysShowIcon icon="info">
      <span className="sr-only">Información</span>
    </HelpTooltip>
  );
};

/**
 * TipBadge - Insignia de consejo
 */
export const TipBadge: React.FC<{
  tip: string;
}> = ({ tip }) => {
  return (
    <HelpTooltip content={tip} alwaysShowIcon icon="lightbulb">
      <span className="sr-only">Consejo</span>
    </HelpTooltip>
  );
};

// ==================== EXPORT ====================

export default HelpTooltip;

// Named exports para uso flexible
export { HelpTooltip };
