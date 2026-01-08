/**
 * LITPER - Sync Status Component
 * Indicador visual del estado de sincronización.
 */

import React, { useEffect, useState } from 'react';
import {
  syncService,
  SyncStatus as SyncStatusType,
  formatSyncTime,
} from '../services/syncService';

// ==================== TIPOS ====================

interface SyncStatusProps {
  /** Mostrar versión compacta */
  compact?: boolean;
  /** Mostrar detalles al hover */
  showDetails?: boolean;
  /** Clase CSS adicional */
  className?: string;
}

// ==================== COMPONENTE ====================

export const SyncStatusIndicator: React.FC<SyncStatusProps> = ({
  compact = false,
  showDetails = true,
  className = '',
}) => {
  const [status, setStatus] = useState<SyncStatusType>(syncService.getStatus());
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const unsubscribe = syncService.onStatusChange(setStatus);
    return unsubscribe;
  }, []);

  const getStatusIcon = (): string => {
    switch (status.status) {
      case 'syncing':
      case 'reconnecting':
        return '🔄';
      case 'synced':
        return '✅';
      case 'offline':
        return '📴';
      case 'error':
        return '❌';
      default:
        return '⏳';
    }
  };

  const getStatusText = (): string => {
    switch (status.status) {
      case 'syncing':
        return 'Sincronizando...';
      case 'reconnecting':
        return 'Reconectando...';
      case 'synced':
        return compact ? 'OK' : `Sincronizado ${formatSyncTime(status.lastSync)}`;
      case 'offline':
        return 'Sin conexión';
      case 'error':
        return compact ? 'Error' : `Error: ${status.error}`;
      default:
        return 'Esperando...';
    }
  };

  const getStatusColor = (): string => {
    switch (status.status) {
      case 'syncing':
      case 'reconnecting':
        return '#3b82f6'; // blue
      case 'synced':
        return '#22c55e'; // green
      case 'offline':
        return '#6b7280'; // gray
      case 'error':
        return '#ef4444'; // red
      default:
        return '#6b7280'; // gray
    }
  };

  const handleForceSync = (): void => {
    syncService.sync();
  };

  return (
    <div
      className={`sync-status ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: compact ? '4px 8px' : '8px 12px',
        borderRadius: '6px',
        backgroundColor: `${getStatusColor()}15`,
        border: `1px solid ${getStatusColor()}30`,
        cursor: showDetails ? 'pointer' : 'default',
        position: 'relative',
        fontSize: compact ? '12px' : '14px',
      }}
      onMouseEnter={() => showDetails && setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Icono animado */}
      <span
        style={{
          animation: status.status === 'syncing' || status.status === 'reconnecting'
            ? 'spin 1s linear infinite'
            : 'none',
        }}
      >
        {getStatusIcon()}
      </span>

      {/* Texto de estado */}
      <span style={{ color: getStatusColor(), fontWeight: 500 }}>
        {getStatusText()}
      </span>

      {/* Badge de cambios pendientes */}
      {status.changesPending > 0 && (
        <span
          style={{
            backgroundColor: '#f97316',
            color: 'white',
            padding: '2px 6px',
            borderRadius: '10px',
            fontSize: '11px',
            fontWeight: 600,
          }}
        >
          {status.changesPending}
        </span>
      )}

      {/* Tooltip con detalles */}
      {showTooltip && showDetails && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: '8px',
            padding: '12px',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            minWidth: '220px',
            zIndex: 1000,
          }}
        >
          <div style={{ fontSize: '12px', color: '#6b7280' }}>
            <div style={{ marginBottom: '8px' }}>
              <strong>Estado:</strong> {status.status}
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>Última sync:</strong>{' '}
              {status.lastSync
                ? status.lastSync.toLocaleTimeString()
                : 'Nunca'}
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>Próxima sync:</strong>{' '}
              {status.nextSync
                ? status.nextSync.toLocaleTimeString()
                : '-'}
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>Cambios pendientes:</strong> {status.changesPending}
            </div>
            {status.error && (
              <div style={{ color: '#ef4444', marginBottom: '8px' }}>
                <strong>Error:</strong> {status.error}
              </div>
            )}

            {/* Botón de forzar sync */}
            <button
              onClick={handleForceSync}
              disabled={status.status === 'syncing'}
              style={{
                width: '100%',
                padding: '6px 12px',
                backgroundColor: status.status === 'syncing' ? '#d1d5db' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: status.status === 'syncing' ? 'not-allowed' : 'pointer',
                fontSize: '12px',
                fontWeight: 500,
              }}
            >
              {status.status === 'syncing' ? 'Sincronizando...' : 'Sincronizar ahora'}
            </button>
          </div>
        </div>
      )}

      {/* Estilos de animación */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

// ==================== COMPONENTE SIMPLE ====================

export const SyncStatusBadge: React.FC<{ className?: string }> = ({ className }) => {
  const [status, setStatus] = useState<SyncStatusType>(syncService.getStatus());

  useEffect(() => {
    const unsubscribe = syncService.onStatusChange(setStatus);
    return unsubscribe;
  }, []);

  const getColor = (): string => {
    switch (status.status) {
      case 'synced':
        return '#22c55e';
      case 'syncing':
      case 'reconnecting':
        return '#3b82f6';
      case 'offline':
        return '#6b7280';
      case 'error':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  return (
    <span
      className={className}
      style={{
        display: 'inline-block',
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: getColor(),
        animation: status.status === 'syncing' ? 'pulse 1s infinite' : 'none',
      }}
      title={`Sync: ${status.status}`}
    >
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </span>
  );
};

export default SyncStatusIndicator;
