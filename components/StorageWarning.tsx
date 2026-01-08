/**
 * LITPER - Storage Warning Component
 * Muestra advertencia cuando los datos se guardan solo localmente.
 */

import React, { useEffect, useState } from 'react';
import { healthApi } from '../services/unifiedApiService';
import { storage } from '../services/storageService';

// ==================== TIPOS ====================

interface StorageWarningProps {
  /** Posición del warning */
  position?: 'top' | 'bottom' | 'floating';
  /** Callback cuando se cierra */
  onDismiss?: () => void;
  /** Mostrar siempre (ignorar preferencia guardada) */
  forceShow?: boolean;
  /** Clase CSS adicional */
  className?: string;
}

type WarningType = 'offline' | 'backend-unavailable' | 'local-only' | null;

// ==================== COMPONENTE ====================

export const StorageWarning: React.FC<StorageWarningProps> = ({
  position = 'top',
  onDismiss,
  forceShow = false,
  className = '',
}) => {
  const [warningType, setWarningType] = useState<WarningType>(null);
  const [dismissed, setDismissed] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkStorageStatus();

    // Re-check cada 30 segundos
    const interval = setInterval(checkStorageStatus, 30000);

    // Escuchar cambios de conexión
    window.addEventListener('online', checkStorageStatus);
    window.addEventListener('offline', () => setWarningType('offline'));

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', checkStorageStatus);
      window.removeEventListener('offline', () => setWarningType('offline'));
    };
  }, []);

  const checkStorageStatus = async (): Promise<void> => {
    setChecking(true);

    try {
      // Verificar si hay preferencia de no mostrar
      if (!forceShow) {
        const dismissedUntil = localStorage.getItem('litper_warning_dismissed');
        if (dismissedUntil) {
          const until = new Date(dismissedUntil);
          if (until > new Date()) {
            setDismissed(true);
            setChecking(false);
            return;
          }
        }
      }

      // Verificar conexión a internet
      if (!navigator.onLine) {
        setWarningType('offline');
        setChecking(false);
        return;
      }

      // Verificar backend
      const isBackendAvailable = await healthApi.isAvailable();
      if (!isBackendAvailable) {
        setWarningType('backend-unavailable');
        setChecking(false);
        return;
      }

      // Verificar si hay datos pendientes de sync
      const syncStatus = storage.getSyncStatus();
      if (syncStatus.pendingCount > 0) {
        setWarningType('local-only');
        setChecking(false);
        return;
      }

      // Todo está bien
      setWarningType(null);
    } catch (error) {
      setWarningType('backend-unavailable');
    } finally {
      setChecking(false);
    }
  };

  const handleDismiss = (permanent: boolean = false): void => {
    setDismissed(true);

    if (permanent) {
      // No mostrar por 24 horas
      const until = new Date();
      until.setHours(until.getHours() + 24);
      localStorage.setItem('litper_warning_dismissed', until.toISOString());
    }

    onDismiss?.();
  };

  const handleRetry = (): void => {
    checkStorageStatus();
  };

  // No mostrar si está checking, dismissed, o no hay warning
  if (checking || dismissed || !warningType) {
    return null;
  }

  const getWarningContent = (): {
    icon: string;
    title: string;
    message: string;
    color: string;
  } => {
    switch (warningType) {
      case 'offline':
        return {
          icon: '📴',
          title: 'Sin conexión a internet',
          message: 'Los cambios se guardarán localmente y se sincronizarán cuando vuelvas a estar en línea.',
          color: '#6b7280',
        };
      case 'backend-unavailable':
        return {
          icon: '⚠️',
          title: 'Servidor no disponible',
          message: 'No se puede conectar al servidor. Los datos se guardan solo en este navegador.',
          color: '#f97316',
        };
      case 'local-only':
        return {
          icon: '💾',
          title: 'Datos pendientes de sincronizar',
          message: `Hay ${storage.getSyncStatus().pendingCount} cambios guardados localmente esperando sincronización.`,
          color: '#3b82f6',
        };
      default:
        return {
          icon: '⚠️',
          title: 'Modo local',
          message: 'Los datos se guardan solo en este navegador.',
          color: '#f97316',
        };
    }
  };

  const content = getWarningContent();

  const getPositionStyles = (): React.CSSProperties => {
    switch (position) {
      case 'top':
        return {
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
        };
      case 'bottom':
        return {
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
        };
      case 'floating':
        return {
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          maxWidth: '400px',
          zIndex: 9999,
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        };
      default:
        return {};
    }
  };

  return (
    <div
      className={`storage-warning ${className}`}
      style={{
        ...getPositionStyles(),
        backgroundColor: `${content.color}15`,
        borderBottom: position !== 'floating' ? `2px solid ${content.color}` : 'none',
        border: position === 'floating' ? `1px solid ${content.color}30` : undefined,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 16px',
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        {/* Icono */}
        <span style={{ fontSize: '24px' }}>{content.icon}</span>

        {/* Contenido */}
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontWeight: 600,
              color: content.color,
              marginBottom: '2px',
            }}
          >
            {content.title}
          </div>
          <div style={{ fontSize: '13px', color: '#6b7280' }}>
            {content.message}
          </div>
        </div>

        {/* Acciones */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {warningType !== 'offline' && (
            <button
              onClick={handleRetry}
              style={{
                padding: '6px 12px',
                backgroundColor: content.color,
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500,
              }}
            >
              Reintentar
            </button>
          )}
          <button
            onClick={() => handleDismiss(false)}
            style={{
              padding: '6px 12px',
              backgroundColor: 'transparent',
              color: '#6b7280',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            Cerrar
          </button>
          <button
            onClick={() => handleDismiss(true)}
            style={{
              padding: '6px',
              backgroundColor: 'transparent',
              color: '#9ca3af',
              border: 'none',
              cursor: 'pointer',
              fontSize: '11px',
            }}
            title="No mostrar por 24 horas"
          >
            No mostrar
          </button>
        </div>
      </div>
    </div>
  );
};

// ==================== COMPONENTE SIMPLE (BANNER) ====================

export const StorageModeBanner: React.FC<{ className?: string }> = ({ className }) => {
  const [isLocalMode, setIsLocalMode] = useState(false);

  useEffect(() => {
    const check = async () => {
      const isAvailable = await healthApi.isAvailable();
      setIsLocalMode(!isAvailable || !navigator.onLine);
    };
    check();

    window.addEventListener('online', check);
    window.addEventListener('offline', check);

    return () => {
      window.removeEventListener('online', check);
      window.removeEventListener('offline', check);
    };
  }, []);

  if (!isLocalMode) return null;

  return (
    <div
      className={className}
      style={{
        backgroundColor: '#fef3c7',
        color: '#92400e',
        padding: '8px 16px',
        fontSize: '13px',
        textAlign: 'center',
        fontWeight: 500,
      }}
    >
      ⚠️ Modo local - Los datos se guardan solo en este navegador
    </div>
  );
};

export default StorageWarning;
