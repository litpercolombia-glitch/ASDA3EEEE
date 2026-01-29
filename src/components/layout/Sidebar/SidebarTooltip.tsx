/**
 * SidebarTooltip - LITPER PRO
 *
 * Tooltips para modo colapsado del sidebar
 * Con animaciones suaves y soporte para atajos
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface SidebarTooltipProps {
  content: React.ReactNode;
  shortcut?: string;
  children: React.ReactNode;
  side?: 'right' | 'left' | 'top' | 'bottom';
  align?: 'start' | 'center' | 'end';
  delayDuration?: number;
  disabled?: boolean;
  className?: string;
}

export const SidebarTooltip: React.FC<SidebarTooltipProps> = ({
  content,
  shortcut,
  children,
  side = 'right',
  align = 'center',
  delayDuration = 300,
  disabled = false,
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const calculatePosition = useCallback(() => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const padding = 8;

    let top = 0;
    let left = 0;

    switch (side) {
      case 'right':
        left = triggerRect.right + padding;
        break;
      case 'left':
        left = triggerRect.left - tooltipRect.width - padding;
        break;
      case 'top':
        top = triggerRect.top - tooltipRect.height - padding;
        break;
      case 'bottom':
        top = triggerRect.bottom + padding;
        break;
    }

    // Horizontal sides
    if (side === 'right' || side === 'left') {
      switch (align) {
        case 'start':
          top = triggerRect.top;
          break;
        case 'center':
          top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
          break;
        case 'end':
          top = triggerRect.bottom - tooltipRect.height;
          break;
      }
    }

    // Vertical sides
    if (side === 'top' || side === 'bottom') {
      switch (align) {
        case 'start':
          left = triggerRect.left;
          break;
        case 'center':
          left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
          break;
        case 'end':
          left = triggerRect.right - tooltipRect.width;
          break;
      }
    }

    // Boundary checks
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (left < padding) left = padding;
    if (left + tooltipRect.width > viewportWidth - padding) {
      left = viewportWidth - tooltipRect.width - padding;
    }
    if (top < padding) top = padding;
    if (top + tooltipRect.height > viewportHeight - padding) {
      top = viewportHeight - tooltipRect.height - padding;
    }

    setPosition({ top, left });
  }, [side, align]);

  const showTooltip = useCallback(() => {
    if (disabled) return;
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delayDuration);
  }, [delayDuration, disabled]);

  const hideTooltip = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  }, []);

  useEffect(() => {
    if (isVisible) {
      calculatePosition();
    }
  }, [isVisible, calculatePosition]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        className={className}
      >
        {children}
      </div>

      {isVisible &&
        createPortal(
          <div
            ref={tooltipRef}
            role="tooltip"
            className={`
              fixed z-[9999] px-3 py-2
              bg-slate-800 border border-slate-700
              rounded-lg shadow-xl
              text-sm text-white
              pointer-events-none
              animate-tooltipIn
              max-w-xs
            `}
            style={{
              top: position.top,
              left: position.left,
            }}
          >
            <div className="flex items-center gap-3">
              <span className="font-medium">{content}</span>
              {shortcut && (
                <kbd
                  className="
                    px-1.5 py-0.5 text-[10px] font-mono
                    bg-slate-700 border border-slate-600
                    rounded text-slate-300
                  "
                >
                  {shortcut}
                </kbd>
              )}
            </div>

            {/* Arrow */}
            <div
              className={`
                absolute w-2 h-2 bg-slate-800 border-slate-700
                transform rotate-45
                ${side === 'right' ? 'left-[-5px] border-l border-b' : ''}
                ${side === 'left' ? 'right-[-5px] border-r border-t' : ''}
                ${side === 'top' ? 'bottom-[-5px] border-r border-b' : ''}
                ${side === 'bottom' ? 'top-[-5px] border-l border-t' : ''}
              `}
              style={{
                ...(side === 'right' || side === 'left'
                  ? { top: '50%', marginTop: '-4px' }
                  : { left: '50%', marginLeft: '-4px' }),
              }}
            />

            <style>{`
              @keyframes tooltipIn {
                from {
                  opacity: 0;
                  transform: scale(0.96);
                }
                to {
                  opacity: 1;
                  transform: scale(1);
                }
              }
              .animate-tooltipIn {
                animation: tooltipIn 0.15s ease-out;
              }
            `}</style>
          </div>,
          document.body
        )}
    </>
  );
};

// Simple tooltip wrapper for collapsed sidebar items
interface CollapsedTooltipProps {
  label: string;
  shortcut?: string;
  children: React.ReactNode;
  isCollapsed: boolean;
}

export const CollapsedTooltip: React.FC<CollapsedTooltipProps> = ({
  label,
  shortcut,
  children,
  isCollapsed,
}) => {
  if (!isCollapsed) {
    return <>{children}</>;
  }

  return (
    <SidebarTooltip content={label} shortcut={shortcut} side="right" align="center">
      {children}
    </SidebarTooltip>
  );
};

export default SidebarTooltip;
