// components/ReviewReportPanel.tsx
// Panel de informe de revisión de guías

import React, { useMemo } from 'react';
import { ReviewedBadge, ReviewedCounter } from './ReviewedBadge';
import { cargaService } from '../services/cargaService';
import { downloadExcel } from '../utils/excelParser';
import { GuiaCarga } from '../types/carga.types';

interface ReviewReportPanelProps {
  cargaId: string;
  onFilterChange?: (filter: 'todas' | 'revisadas' | 'pendientes') => void;
  currentFilter?: 'todas' | 'revisadas' | 'pendientes';
  compact?: boolean;
}

export const ReviewReportPanel: React.FC<ReviewReportPanelProps> = ({
  cargaId,
  onFilterChange,
  currentFilter = 'todas',
  compact = false,
}) => {
  const informe = useMemo(() => {
    return cargaService.getInformeRevision(cargaId);
  }, [cargaId]);

  const handleExportarInforme = () => {
    const datosExport = [
      // Agregar todas las guías con su estado de revisión
      ...informe.guiasRevisadas.map(g => ({
        GUIA: g.numeroGuia,
        ESTADO: g.estado,
        TRANSPORTADORA: g.transportadora,
        CIUDAD: g.ciudadDestino,
        TELEFONO: g.telefono || '',
        DIAS: g.diasTransito,
        REVISADA: 'SI',
        REVISADO_POR: g.revisadoPor || '',
        FECHA_REVISION: g.fechaRevision
          ? new Date(g.fechaRevision).toLocaleString('es-CO')
          : '',
      })),
      ...informe.guiasPendientes.map(g => ({
        GUIA: g.numeroGuia,
        ESTADO: g.estado,
        TRANSPORTADORA: g.transportadora,
        CIUDAD: g.ciudadDestino,
        TELEFONO: g.telefono || '',
        DIAS: g.diasTransito,
        REVISADA: 'NO',
        REVISADO_POR: '',
        FECHA_REVISION: '',
      })),
    ];

    const fecha = new Date().toISOString().split('T')[0];
    downloadExcel(datosExport, `informe_revision_${fecha}.xlsx`, 'Informe');
  };

  if (compact) {
    return (
      <div className="review-report-compact">
        <ReviewedCounter
          revisadas={informe.revisadas}
          total={informe.totalGuias}
        />

        <div className="compact-filters">
          <button
            className={`filter-btn ${currentFilter === 'todas' ? 'active' : ''}`}
            onClick={() => onFilterChange?.('todas')}
          >
            Todas
          </button>
          <button
            className={`filter-btn revisadas ${currentFilter === 'revisadas' ? 'active' : ''}`}
            onClick={() => onFilterChange?.('revisadas')}
          >
            Revisadas
          </button>
          <button
            className={`filter-btn pendientes ${currentFilter === 'pendientes' ? 'active' : ''}`}
            onClick={() => onFilterChange?.('pendientes')}
          >
            Pendientes
          </button>
        </div>

        <style>{`
          .review-report-compact {
            display: flex;
            align-items: center;
            gap: 1rem;
            flex-wrap: wrap;
          }

          .compact-filters {
            display: flex;
            gap: 0.25rem;
          }

          .filter-btn {
            padding: 0.375rem 0.75rem;
            border: 1px solid #e2e8f0;
            background: white;
            border-radius: 6px;
            font-size: 0.75rem;
            font-weight: 500;
            color: #64748b;
            cursor: pointer;
            transition: all 0.15s ease;
          }

          .filter-btn:hover {
            background: #f8fafc;
            border-color: #cbd5e1;
          }

          .filter-btn.active {
            background: #f1f5f9;
            border-color: #94a3b8;
            color: #1e293b;
          }

          .filter-btn.revisadas.active {
            background: #d1fae5;
            border-color: #10b981;
            color: #059669;
          }

          .filter-btn.pendientes.active {
            background: #fef3c7;
            border-color: #f59e0b;
            color: #d97706;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="review-report-panel">
      {/* Header */}
      <div className="panel-header">
        <div className="header-title">
          <ReviewedBadge revisada={informe.revisadas === informe.totalGuias && informe.totalGuias > 0} size="md" showTooltip={false} animated={false} />
          <h3>Informe de Revisión</h3>
        </div>
        <button className="export-btn" onClick={handleExportarInforme}>
          Exportar
        </button>
      </div>

      {/* Estadísticas principales */}
      <div className="stats-grid">
        <div className="stat-card revisadas">
          <div className="stat-icon">
            <ReviewedBadge revisada={true} size="lg" showTooltip={false} animated={false} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{informe.revisadas}</span>
            <span className="stat-label">Revisadas</span>
          </div>
        </div>

        <div className="stat-card pendientes">
          <div className="stat-icon">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
              <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div className="stat-content">
            <span className="stat-value">{informe.pendientes}</span>
            <span className="stat-label">Pendientes</span>
          </div>
        </div>

        <div className="stat-card porcentaje">
          <div className="stat-icon">
            <span className="percentage-text">{informe.porcentajeRevision}%</span>
          </div>
          <div className="stat-content">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${informe.porcentajeRevision}%` }}
              />
            </div>
            <span className="stat-label">Progreso</span>
          </div>
        </div>
      </div>

      {/* Por transportadora */}
      {Object.keys(informe.porTransportadora).length > 0 && (
        <div className="transportadoras-section">
          <h4>Por Transportadora</h4>
          <div className="transportadoras-list">
            {Object.entries(informe.porTransportadora).map(([transp, stats]) => {
              const total = stats.revisadas + stats.pendientes;
              const porcentaje = Math.round((stats.revisadas / total) * 100);

              return (
                <div key={transp} className="transportadora-item">
                  <div className="transp-header">
                    <span className="transp-name">{transp}</span>
                    <span className="transp-stats">
                      <strong>{stats.revisadas}</strong>/{total}
                    </span>
                  </div>
                  <div className="transp-progress">
                    <div
                      className="transp-progress-fill"
                      style={{ width: `${porcentaje}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="filter-section">
        <span className="filter-label">Filtrar:</span>
        <div className="filter-buttons">
          <button
            className={`filter-btn ${currentFilter === 'todas' ? 'active' : ''}`}
            onClick={() => onFilterChange?.('todas')}
          >
            Todas ({informe.totalGuias})
          </button>
          <button
            className={`filter-btn revisadas ${currentFilter === 'revisadas' ? 'active' : ''}`}
            onClick={() => onFilterChange?.('revisadas')}
          >
            Revisadas ({informe.revisadas})
          </button>
          <button
            className={`filter-btn pendientes ${currentFilter === 'pendientes' ? 'active' : ''}`}
            onClick={() => onFilterChange?.('pendientes')}
          >
            Pendientes ({informe.pendientes})
          </button>
        </div>
      </div>

      <style>{`
        .review-report-panel {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          padding: 1.25rem;
          border: 1px solid #e2e8f0;
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .header-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .header-title h3 {
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
          color: #1e293b;
        }

        .export-btn {
          padding: 0.5rem 1rem;
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          font-size: 0.8125rem;
          font-weight: 500;
          color: #475569;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .export-btn:hover {
          background: #e2e8f0;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.75rem;
          margin-bottom: 1.25rem;
        }

        .stat-card {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.875rem;
          border-radius: 10px;
          background: #f8fafc;
        }

        .stat-card.revisadas {
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
        }

        .stat-card.pendientes {
          background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
          color: #d97706;
        }

        .stat-card.porcentaje {
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
        }

        .stat-icon {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .percentage-text {
          font-size: 1.125rem;
          font-weight: 700;
          color: #3b82f6;
        }

        .stat-content {
          flex: 1;
        }

        .stat-value {
          display: block;
          font-size: 1.5rem;
          font-weight: 700;
          color: #1e293b;
          line-height: 1.2;
        }

        .stat-card.revisadas .stat-value {
          color: #059669;
        }

        .stat-card.pendientes .stat-value {
          color: #d97706;
        }

        .stat-label {
          font-size: 0.75rem;
          color: #64748b;
          font-weight: 500;
        }

        .progress-bar {
          height: 6px;
          background: #cbd5e1;
          border-radius: 3px;
          overflow: hidden;
          margin-bottom: 0.25rem;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #3b82f6, #0095f6);
          border-radius: 3px;
          transition: width 0.3s ease;
        }

        .transportadoras-section {
          margin-bottom: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #e2e8f0;
        }

        .transportadoras-section h4 {
          margin: 0 0 0.75rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: #475569;
        }

        .transportadoras-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .transportadora-item {
          padding: 0.5rem 0.75rem;
          background: #f8fafc;
          border-radius: 6px;
        }

        .transp-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.375rem;
        }

        .transp-name {
          font-size: 0.8125rem;
          font-weight: 500;
          color: #1e293b;
        }

        .transp-stats {
          font-size: 0.75rem;
          color: #64748b;
        }

        .transp-progress {
          height: 4px;
          background: #e2e8f0;
          border-radius: 2px;
          overflow: hidden;
        }

        .transp-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #22c55e, #10b981);
          border-radius: 2px;
          transition: width 0.3s ease;
        }

        .filter-section {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding-top: 1rem;
          border-top: 1px solid #e2e8f0;
        }

        .filter-label {
          font-size: 0.8125rem;
          font-weight: 500;
          color: #64748b;
        }

        .filter-buttons {
          display: flex;
          gap: 0.375rem;
        }

        .filter-btn {
          padding: 0.5rem 0.875rem;
          border: 1px solid #e2e8f0;
          background: white;
          border-radius: 6px;
          font-size: 0.8125rem;
          font-weight: 500;
          color: #64748b;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .filter-btn:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
        }

        .filter-btn.active {
          background: #f1f5f9;
          border-color: #94a3b8;
          color: #1e293b;
        }

        .filter-btn.revisadas.active {
          background: #d1fae5;
          border-color: #10b981;
          color: #059669;
        }

        .filter-btn.pendientes.active {
          background: #fef3c7;
          border-color: #f59e0b;
          color: #d97706;
        }

        @media (max-width: 640px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }

          .filter-section {
            flex-direction: column;
            align-items: flex-start;
          }

          .filter-buttons {
            width: 100%;
          }

          .filter-btn {
            flex: 1;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
};

export default ReviewReportPanel;
