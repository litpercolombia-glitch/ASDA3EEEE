// components/CargaPage.tsx
// Página principal de cargas con todos los módulos integrados

import React, { useState, useEffect, useMemo } from 'react';
import { useCargaStore } from '../stores/cargaStore';
import { useAuthStore } from '../stores/authStore';
import { GuideTable, GuideRow } from './GuideTable';
import { CargaManager } from './CargaManager';
import { CargaFilters } from './CargaFilters';
import { TeamActivity } from './TeamActivity';
import { useCargaBrainIntegration } from '../hooks/useCargaBrainIntegration';
import { useFilteredShipments, useFilterOptionsFromItems } from '../hooks/useFilteredShipments';
import { GuiaCarga } from '../types/carga.types';

export const CargaPage: React.FC = () => {
  const { user } = useAuthStore();
  const { cargaActual, agregarGuias, isLoading } = useCargaStore();
  const { sincronizarConCerebro, analizarCargaActual, obtenerJourneyGuia } = useCargaBrainIntegration();

  const [selectedGuiaIds, setSelectedGuiaIds] = useState<string[]>([]);
  const [showTimeline, setShowTimeline] = useState<string | null>(null);

  // Obtener guías de la carga actual
  const guias = cargaActual?.guias || [];

  // Filtros y búsqueda
  const { resultado, filtros, setFiltro, limpiarFiltros, buscar } = useFilteredShipments(guias);
  const filterOptions = useFilterOptionsFromItems(guias);

  // Convertir GuiaCarga a GuideRow para la tabla
  const guideRows: GuideRow[] = useMemo(() => {
    return resultado.items.map(guia => ({
      id: guia.id,
      guia: guia.numeroGuia,
      estado: guia.estado,
      transportadora: guia.transportadora,
      ciudadDestino: guia.ciudadDestino,
      telefono: guia.telefono,
      dias: guia.diasTransito,
      tieneNovedad: guia.tieneNovedad,
      cargaId: cargaActual?.id,
      cargaNumero: cargaActual?.numeroCarga,
    }));
  }, [resultado.items, cargaActual]);

  const handleGuideClick = (guide: GuideRow) => {
    setShowTimeline(guide.guia);
  };

  const handleGuideSelect = (ids: string[]) => {
    setSelectedGuiaIds(ids);
  };

  const handleAnalizar = () => {
    analizarCargaActual();
  };

  if (!user) {
    return (
      <div className="carga-page-login">
        <span>🔐</span>
        <p>Inicia sesión para acceder a las cargas</p>
      </div>
    );
  }

  return (
    <div className="carga-page">
      {/* Header con actividad del equipo */}
      <div className="page-header">
        <div className="header-left">
          <h1>📦 Cargar Guías</h1>
          <TeamActivity compact />
        </div>
        <div className="header-right">
          <button
            className="btn-analizar"
            onClick={handleAnalizar}
            disabled={guias.length < 5}
            title={guias.length < 5 ? 'Se necesitan al menos 5 guías' : 'Analizar con IA'}
          >
            🧠 Analizar con IA
          </button>
        </div>
      </div>

      {/* Gestor de cargas */}
      <CargaManager
        usuarioId={user.id}
        usuarioNombre={user.nombre}
      />

      {/* Filtros */}
      <CargaFilters
        filtros={filtros}
        onFiltrosChange={setFiltro as any}
        transportadoras={filterOptions.transportadoras}
        ciudades={filterOptions.ciudades}
        onBuscarGuia={buscar}
        compact
      />

      {/* Estadísticas rápidas */}
      {resultado.totalOriginal > 0 && (
        <div className="stats-bar">
          <div className="stat-item">
            <span className="stat-value">{resultado.estadisticas.porEstado['Entregado'] || 0}</span>
            <span className="stat-label">Entregadas</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{resultado.estadisticas.porEstado['En Tránsito'] || 0}</span>
            <span className="stat-label">En tránsito</span>
          </div>
          <div className="stat-item warning">
            <span className="stat-value">{resultado.estadisticas.conNovedad}</span>
            <span className="stat-label">Con novedad</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{resultado.totalFiltrados}</span>
            <span className="stat-label">
              {resultado.totalFiltrados !== resultado.totalOriginal
                ? `de ${resultado.totalOriginal}`
                : 'Total'}
            </span>
          </div>
        </div>
      )}

      {/* Tabla de guías */}
      <GuideTable
        guides={guideRows}
        onGuideClick={handleGuideClick}
        onGuideSelect={handleGuideSelect}
        selectedIds={selectedGuiaIds}
        selectable
        showCargaInfo={false}
        emptyMessage="Carga las guías usando las pestañas de arriba"
      />

      {/* Modal de Timeline */}
      {showTimeline && (
        <div className="timeline-modal-overlay" onClick={() => setShowTimeline(null)}>
          <div className="timeline-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📍 Timeline de Guía {showTimeline}</h3>
              <button onClick={() => setShowTimeline(null)}>✕</button>
            </div>
            <div className="modal-content">
              {(() => {
                const journey = obtenerJourneyGuia(showTimeline);
                if (!journey) {
                  return <p>No hay datos de timeline disponibles</p>;
                }

                return (
                  <div className="journey-timeline">
                    <div className="journey-header">
                      <span className="journey-icon">{journey.currentState.statusIcon}</span>
                      <div>
                        <span className="journey-status">{journey.currentState.statusLabel}</span>
                        <span className="journey-progress">{journey.currentState.progress}% completado</span>
                      </div>
                    </div>

                    <div className="journey-progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${journey.currentState.progress}%` }}
                      />
                    </div>

                    <div className="journey-events">
                      {journey.timeline.steps.map((step, index) => (
                        <div
                          key={step.id}
                          className={`event-item ${step.isCurrent ? 'current' : ''} ${step.isCompleted ? 'completed' : ''}`}
                        >
                          <span className="event-icon">{step.statusIcon}</span>
                          <div className="event-content">
                            <span className="event-title">{step.title}</span>
                            <span className="event-desc">{step.description}</span>
                            <span className="event-time">{step.relativeTime}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .carga-page {
          max-width: 1400px;
          margin: 0 auto;
          padding: 1.5rem;
        }

        .carga-page-login {
          text-align: center;
          padding: 4rem;
          color: #64748b;
        }

        .carga-page-login span {
          font-size: 4rem;
          display: block;
          margin-bottom: 1rem;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 2rem;
        }

        .page-header h1 {
          margin: 0;
          font-size: 1.5rem;
          color: #1e293b;
        }

        .btn-analizar {
          background: linear-gradient(135deg, #8b5cf6, #6366f1);
          color: white;
          border: none;
          padding: 0.625rem 1.25rem;
          border-radius: 8px;
          font-size: 0.9375rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-analizar:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
        }

        .btn-analizar:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .stats-bar {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .stat-item {
          background: #f8fafc;
          padding: 0.75rem;
          border-radius: 8px;
          text-align: center;
        }

        .stat-item.warning {
          background: #fef3c7;
        }

        .stat-value {
          display: block;
          font-size: 1.5rem;
          font-weight: 700;
          color: #1e293b;
        }

        .stat-label {
          font-size: 0.75rem;
          color: #64748b;
        }

        .timeline-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .timeline-modal {
          background: white;
          border-radius: 16px;
          width: 90%;
          max-width: 500px;
          max-height: 80vh;
          overflow: hidden;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid #e2e8f0;
        }

        .modal-header h3 {
          margin: 0;
          font-size: 1rem;
          color: #1e293b;
        }

        .modal-header button {
          background: none;
          border: none;
          font-size: 1.25rem;
          cursor: pointer;
          color: #64748b;
        }

        .modal-content {
          padding: 1.5rem;
          overflow-y: auto;
          max-height: calc(80vh - 60px);
        }

        .journey-timeline {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .journey-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .journey-icon {
          font-size: 2.5rem;
        }

        .journey-status {
          display: block;
          font-weight: 600;
          color: #1e293b;
        }

        .journey-progress {
          display: block;
          font-size: 0.8125rem;
          color: #64748b;
        }

        .journey-progress-bar {
          height: 8px;
          background: #e2e8f0;
          border-radius: 4px;
          margin-bottom: 1.5rem;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #3b82f6, #22c55e);
          border-radius: 4px;
        }

        .journey-events {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .event-item {
          display: flex;
          gap: 0.75rem;
          padding: 0.75rem;
          border-radius: 8px;
          background: #f8fafc;
          opacity: 0.7;
        }

        .event-item.completed {
          opacity: 1;
        }

        .event-item.current {
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          opacity: 1;
        }

        .event-icon {
          font-size: 1.25rem;
        }

        .event-content {
          flex: 1;
        }

        .event-title {
          display: block;
          font-weight: 600;
          color: #1e293b;
          font-size: 0.875rem;
        }

        .event-desc {
          display: block;
          font-size: 0.8125rem;
          color: #64748b;
          margin: 0.125rem 0;
        }

        .event-time {
          font-size: 0.75rem;
          color: #94a3b8;
        }

        @media (max-width: 768px) {
          .page-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }

          .header-left {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }

          .stats-bar {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
};

export default CargaPage;
