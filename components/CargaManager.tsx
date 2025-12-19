// components/CargaManager.tsx
// Panel de gestión de cargas

import React, { useEffect, useState } from 'react';
import { useCargaStore } from '../stores/cargaStore';
import { Carga, CargaResumen } from '../types/carga.types';
import { cargaService } from '../services/cargaService';

interface CargaManagerProps {
  usuarioId: string;
  usuarioNombre: string;
  onCargaChange?: (carga: Carga | null) => void;
}

export const CargaManager: React.FC<CargaManagerProps> = ({
  usuarioId,
  usuarioNombre,
  onCargaChange,
}) => {
  const {
    cargaActual,
    historial,
    vistaActual,
    ultimoGuardado,
    isLoading,
    error,
    crearNuevaCarga,
    cargarCarga,
    cerrarCargaActual,
    iniciarNuevoDia,
    setVista,
    cargarHistorial,
    limpiarError,
  } = useCargaStore();

  const [showHistorial, setShowHistorial] = useState(false);

  // Inicializar carga al montar
  useEffect(() => {
    const cargaGuardadaId = cargaService.getCargaActualId();
    if (cargaGuardadaId) {
      cargarCarga(cargaGuardadaId);
    } else {
      const carga = cargaService.getOCrearCargaHoy(usuarioId, usuarioNombre);
      cargarCarga(carga.id);
    }
  }, [usuarioId, usuarioNombre]);

  // Notificar cambios
  useEffect(() => {
    onCargaChange?.(cargaActual);
  }, [cargaActual, onCargaChange]);

  // Cargar historial cuando se abre
  useEffect(() => {
    if (showHistorial) {
      cargarHistorial();
    }
  }, [showHistorial]);

  const handleNuevaCarga = () => {
    if (confirm('¿Crear una nueva carga? La carga actual seguirá guardada.')) {
      crearNuevaCarga(usuarioId, usuarioNombre);
    }
  };

  const handleNuevoDia = () => {
    if (confirm('¿Iniciar nuevo día? Se cerrará la carga actual.')) {
      iniciarNuevoDia(usuarioId, usuarioNombre);
    }
  };

  const handleCerrarCarga = () => {
    if (confirm('¿Cerrar esta carga? No se podrá editar después.')) {
      cerrarCargaActual();
    }
  };

  const handleAbrirCarga = (cargaId: string) => {
    cargarCarga(cargaId);
    setShowHistorial(false);
  };

  return (
    <div className="carga-manager">
      {/* Barra de estado de carga */}
      <div className="carga-status-bar">
        <div className="status-left">
          <span className="carga-icon">📦</span>
          {cargaActual ? (
            <>
              <span className="carga-nombre">{cargaActual.nombre}</span>
              <span className={`carga-estado estado-${cargaActual.estado}`}>
                {cargaActual.estado === 'activa' ? '🟢 Activa' : '🔒 Cerrada'}
              </span>
              <span className="carga-guias">
                {cargaActual.totalGuias} guías
              </span>
            </>
          ) : (
            <span className="sin-carga">Sin carga activa</span>
          )}
        </div>

        <div className="status-right">
          {ultimoGuardado && (
            <span className="ultimo-guardado">
              💾 Guardado: {ultimoGuardado.toLocaleTimeString()}
            </span>
          )}
          <span className="usuario-actual">
            👤 {usuarioNombre}
          </span>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="carga-actions">
        <button
          className="btn btn-primary"
          onClick={handleNuevaCarga}
          disabled={isLoading}
        >
          ➕ Nueva Carga
        </button>

        <button
          className="btn btn-secondary"
          onClick={handleNuevoDia}
          disabled={isLoading}
        >
          📅 Nuevo Día
        </button>

        {cargaActual?.estado === 'activa' && (
          <button
            className="btn btn-warning"
            onClick={handleCerrarCarga}
            disabled={isLoading}
          >
            🔒 Cerrar Carga
          </button>
        )}

        <button
          className="btn btn-outline"
          onClick={() => setShowHistorial(!showHistorial)}
        >
          📁 {showHistorial ? 'Ocultar' : 'Ver'} Historial
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="carga-error">
          <span>⚠️ {error}</span>
          <button onClick={limpiarError}>✕</button>
        </div>
      )}

      {/* Estadísticas de carga actual */}
      {cargaActual && (
        <div className="carga-stats-mini">
          <div className="stat">
            <span className="stat-value">{cargaActual.stats.entregadas}</span>
            <span className="stat-label">Entregadas</span>
          </div>
          <div className="stat">
            <span className="stat-value">{cargaActual.stats.enTransito}</span>
            <span className="stat-label">En tránsito</span>
          </div>
          <div className="stat warning">
            <span className="stat-value">{cargaActual.stats.conNovedad}</span>
            <span className="stat-label">Con novedad</span>
          </div>
          <div className="stat">
            <span className="stat-value">{cargaActual.stats.porcentajeEntrega}%</span>
            <span className="stat-label">% Entrega</span>
          </div>
        </div>
      )}

      {/* Panel de historial */}
      {showHistorial && (
        <div className="historial-panel">
          <h3>📁 Cargas Guardadas</h3>

          {isLoading ? (
            <div className="loading">Cargando historial...</div>
          ) : historial && historial.fechas.length > 0 ? (
            <div className="historial-lista">
              {historial.fechas.map((dia) => (
                <div key={dia.fecha} className="historial-dia">
                  <div className="dia-header">
                    <span className="dia-fecha">
                      📅 {formatearFechaLarga(dia.fecha)}
                    </span>
                    <span className="dia-stats">
                      {dia.totalCargas} cargas • {dia.totalGuias} guías
                    </span>
                  </div>

                  <div className="dia-cargas">
                    {dia.cargas.map((carga) => (
                      <div
                        key={carga.id}
                        className={`carga-item ${
                          carga.id === cargaActual?.id ? 'activa' : ''
                        }`}
                        onClick={() => handleAbrirCarga(carga.id)}
                      >
                        <div className="carga-item-info">
                          <span className="carga-item-nombre">
                            {carga.estado === 'activa' ? '📦' : '📁'} Carga #{carga.numeroCarga}
                          </span>
                          <span className="carga-item-user">
                            por {carga.usuarioNombre}
                          </span>
                        </div>
                        <div className="carga-item-stats">
                          <span className="guias-count">{carga.totalGuias} guías</span>
                          {carga.stats.conNovedad > 0 && (
                            <span className="novedad-count">
                              ⚠️ {carga.stats.conNovedad}
                            </span>
                          )}
                        </div>
                        <button className="btn-abrir">Abrir →</button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="historial-vacio">
              <span>📭</span>
              <p>No hay cargas guardadas</p>
            </div>
          )}
        </div>
      )}

      <style>{`
        .carga-manager {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .carga-status-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1rem;
          background: linear-gradient(135deg, #1e293b, #334155);
          border-radius: 10px;
          color: white;
          margin-bottom: 1rem;
        }

        .status-left {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .carga-icon {
          font-size: 1.25rem;
        }

        .carga-nombre {
          font-weight: 600;
          font-size: 0.9375rem;
        }

        .carga-estado {
          font-size: 0.75rem;
          padding: 0.125rem 0.5rem;
          border-radius: 9999px;
        }

        .estado-activa {
          background: rgba(34, 197, 94, 0.2);
          color: #86efac;
        }

        .estado-cerrada {
          background: rgba(148, 163, 184, 0.2);
          color: #cbd5e1;
        }

        .carga-guias {
          font-size: 0.75rem;
          background: rgba(255, 255, 255, 0.1);
          padding: 0.125rem 0.5rem;
          border-radius: 4px;
        }

        .sin-carga {
          color: #94a3b8;
          font-style: italic;
        }

        .status-right {
          display: flex;
          align-items: center;
          gap: 1rem;
          font-size: 0.75rem;
          color: #94a3b8;
        }

        .carga-actions {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1rem;
          flex-wrap: wrap;
        }

        .btn {
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
          border: none;
        }

        .btn-primary {
          background: #3b82f6;
          color: white;
        }

        .btn-primary:hover {
          background: #2563eb;
        }

        .btn-secondary {
          background: #6366f1;
          color: white;
        }

        .btn-secondary:hover {
          background: #4f46e5;
        }

        .btn-warning {
          background: #f59e0b;
          color: white;
        }

        .btn-warning:hover {
          background: #d97706;
        }

        .btn-outline {
          background: transparent;
          border: 1px solid #e2e8f0;
          color: #475569;
        }

        .btn-outline:hover {
          background: #f8fafc;
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .carga-error {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1rem;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          color: #dc2626;
          margin-bottom: 1rem;
        }

        .carga-error button {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 1rem;
        }

        .carga-stats-mini {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .stat {
          background: #f8fafc;
          padding: 0.75rem;
          border-radius: 8px;
          text-align: center;
        }

        .stat.warning {
          background: #fef3c7;
        }

        .stat-value {
          display: block;
          font-size: 1.25rem;
          font-weight: 700;
          color: #1e293b;
        }

        .stat-label {
          font-size: 0.6875rem;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .historial-panel {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 1rem;
          margin-top: 1rem;
          max-height: 400px;
          overflow-y: auto;
        }

        .historial-panel h3 {
          margin: 0 0 1rem 0;
          font-size: 1rem;
          color: #1e293b;
        }

        .historial-dia {
          margin-bottom: 1rem;
        }

        .dia-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem;
          background: #f1f5f9;
          border-radius: 6px;
          margin-bottom: 0.5rem;
        }

        .dia-fecha {
          font-weight: 600;
          font-size: 0.875rem;
          color: #1e293b;
        }

        .dia-stats {
          font-size: 0.75rem;
          color: #64748b;
        }

        .dia-cargas {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          padding-left: 1rem;
        }

        .carga-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.625rem 0.75rem;
          background: #f8fafc;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
          border: 1px solid transparent;
        }

        .carga-item:hover {
          background: #eff6ff;
          border-color: #bfdbfe;
        }

        .carga-item.activa {
          background: #eff6ff;
          border-color: #3b82f6;
        }

        .carga-item-info {
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
        }

        .carga-item-nombre {
          font-weight: 500;
          font-size: 0.875rem;
          color: #1e293b;
        }

        .carga-item-user {
          font-size: 0.6875rem;
          color: #64748b;
        }

        .carga-item-stats {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .guias-count {
          font-size: 0.75rem;
          color: #475569;
          background: #e2e8f0;
          padding: 0.125rem 0.375rem;
          border-radius: 4px;
        }

        .novedad-count {
          font-size: 0.75rem;
          color: #d97706;
        }

        .btn-abrir {
          background: none;
          border: none;
          color: #3b82f6;
          font-size: 0.75rem;
          cursor: pointer;
        }

        .historial-vacio {
          text-align: center;
          padding: 2rem;
          color: #64748b;
        }

        .historial-vacio span {
          font-size: 2rem;
          display: block;
          margin-bottom: 0.5rem;
        }

        .loading {
          text-align: center;
          padding: 2rem;
          color: #64748b;
        }

        @media (max-width: 768px) {
          .carga-status-bar {
            flex-direction: column;
            gap: 0.75rem;
            align-items: flex-start;
          }

          .carga-stats-mini {
            grid-template-columns: repeat(2, 1fr);
          }

          .carga-actions {
            flex-direction: column;
          }

          .btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

function formatearFechaLarga(fechaStr: string): string {
  const fecha = new Date(fechaStr + 'T12:00:00');
  return fecha.toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default CargaManager;
