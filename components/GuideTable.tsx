// components/GuideTable.tsx
// Tabla de guías con paginación y numeración

import React, { useMemo } from 'react';
import { usePagination, PageSize } from '../hooks/usePagination';

export interface GuideRow {
  id: string;
  guia: string;
  estado: string;
  transportadora: string;
  ciudadDestino: string;
  telefono?: string;
  dias: number;
  tieneNovedad?: boolean;
  fechaCarga?: string;
  cargaId?: string;
  cargaNumero?: number;
}

interface GuideTableProps {
  guides: GuideRow[];
  onGuideClick?: (guide: GuideRow) => void;
  onGuideSelect?: (guideIds: string[]) => void;
  selectable?: boolean;
  selectedIds?: string[];
  showCargaInfo?: boolean;
  emptyMessage?: string;
}

export const GuideTable: React.FC<GuideTableProps> = ({
  guides,
  onGuideClick,
  onGuideSelect,
  selectable = false,
  selectedIds = [],
  showCargaInfo = false,
  emptyMessage = 'No hay guías cargadas',
}) => {
  const pagination = usePagination(guides, 50);

  const handleSelectAll = () => {
    if (!onGuideSelect) return;

    const currentPageIds = pagination.paginatedItems.map(g => g.id);
    const allSelected = currentPageIds.every(id => selectedIds.includes(id));

    if (allSelected) {
      // Deseleccionar página actual
      onGuideSelect(selectedIds.filter(id => !currentPageIds.includes(id)));
    } else {
      // Seleccionar página actual
      const newSelection = [...new Set([...selectedIds, ...currentPageIds])];
      onGuideSelect(newSelection);
    }
  };

  const handleSelectOne = (guideId: string) => {
    if (!onGuideSelect) return;

    if (selectedIds.includes(guideId)) {
      onGuideSelect(selectedIds.filter(id => id !== guideId));
    } else {
      onGuideSelect([...selectedIds, guideId]);
    }
  };

  const getStatusColor = (estado: string, tieneNovedad?: boolean): string => {
    if (tieneNovedad) return '#ef4444';
    const lower = estado.toLowerCase();
    if (lower.includes('entregado')) return '#22c55e';
    if (lower.includes('tránsito') || lower.includes('transito')) return '#f59e0b';
    if (lower.includes('reparto')) return '#3b82f6';
    if (lower.includes('novedad') || lower.includes('devuelto')) return '#ef4444';
    if (lower.includes('oficina')) return '#8b5cf6';
    return '#64748b';
  };

  const allOnPageSelected = pagination.paginatedItems.length > 0 &&
    pagination.paginatedItems.every(g => selectedIds.includes(g.id));

  if (guides.length === 0) {
    return (
      <div className="guide-table-empty">
        <span className="empty-icon">📭</span>
        <p>{emptyMessage}</p>
        <style>{`
          .guide-table-empty {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 3rem;
            color: #64748b;
            background: #f8fafc;
            border-radius: 12px;
            border: 2px dashed #e2e8f0;
          }
          .empty-icon { font-size: 3rem; margin-bottom: 1rem; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="guide-table-container">
      {/* Header con controles */}
      <div className="table-header">
        <div className="header-left">
          <span className="total-count">
            📊 <strong>{pagination.totalItems}</strong> guías totales
          </span>
          {selectedIds.length > 0 && (
            <span className="selected-count">
              ✓ {selectedIds.length} seleccionadas
            </span>
          )}
        </div>
        <div className="header-right">
          <span className="page-size-label">Por página:</span>
          <select
            value={pagination.pageSize}
            onChange={(e) => pagination.setPageSize(Number(e.target.value) as PageSize)}
            className="page-size-select"
          >
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* Tabla */}
      <div className="table-wrapper">
        <table className="guide-table">
          <thead>
            <tr>
              {selectable && (
                <th className="col-checkbox">
                  <input
                    type="checkbox"
                    checked={allOnPageSelected}
                    onChange={handleSelectAll}
                    title="Seleccionar toda la página"
                  />
                </th>
              )}
              <th className="col-number">#</th>
              <th className="col-guia">GUÍA</th>
              <th className="col-estado">ESTADO</th>
              <th className="col-transport">TRANSPORT.</th>
              <th className="col-ciudad">CIUDAD</th>
              <th className="col-telefono">TELÉFONO</th>
              <th className="col-dias">DÍAS</th>
              {showCargaInfo && <th className="col-carga">CARGA</th>}
            </tr>
          </thead>
          <tbody>
            {pagination.paginatedItems.map((guide, index) => {
              const globalIndex = pagination.startIndex + index + 1;
              const isSelected = selectedIds.includes(guide.id);

              return (
                <tr
                  key={guide.id}
                  className={`
                    ${isSelected ? 'selected' : ''}
                    ${guide.tieneNovedad ? 'has-issue' : ''}
                  `}
                  onClick={() => onGuideClick?.(guide)}
                >
                  {selectable && (
                    <td className="col-checkbox" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectOne(guide.id)}
                      />
                    </td>
                  )}
                  <td className="col-number">
                    <span className="row-number">{globalIndex}</span>
                  </td>
                  <td className="col-guia">
                    <span className="guia-number">{guide.guia}</span>
                  </td>
                  <td className="col-estado">
                    <span
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(guide.estado, guide.tieneNovedad) }}
                    >
                      {guide.tieneNovedad && '⚠️ '}
                      {guide.estado}
                    </span>
                  </td>
                  <td className="col-transport">{guide.transportadora}</td>
                  <td className="col-ciudad">{guide.ciudadDestino}</td>
                  <td className="col-telefono">
                    {guide.telefono ? (
                      <a href={`tel:${guide.telefono}`} onClick={(e) => e.stopPropagation()}>
                        📞 {guide.telefono}
                      </a>
                    ) : (
                      <span className="no-phone">-</span>
                    )}
                  </td>
                  <td className="col-dias">
                    <span className={`days-badge ${guide.dias > 5 ? 'delayed' : ''}`}>
                      {guide.dias}d
                    </span>
                  </td>
                  {showCargaInfo && (
                    <td className="col-carga">
                      {guide.cargaNumero ? `#${guide.cargaNumero}` : '-'}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="pagination-container">
        <div className="pagination-info">
          Mostrando {pagination.startIndex + 1}-{pagination.endIndex} de {pagination.totalItems}
        </div>
        <div className="pagination-controls">
          <button
            onClick={pagination.firstPage}
            disabled={!pagination.hasPreviousPage}
            className="pagination-btn"
            title="Primera página"
          >
            ⏮️
          </button>
          <button
            onClick={pagination.previousPage}
            disabled={!pagination.hasPreviousPage}
            className="pagination-btn"
          >
            ◀️ Anterior
          </button>

          <div className="page-numbers">
            {pagination.pageNumbers.map((pageNum, idx) => (
              pageNum === -1 ? (
                <span key={`ellipsis-${idx}`} className="ellipsis">...</span>
              ) : (
                <button
                  key={pageNum}
                  onClick={() => pagination.setPage(pageNum)}
                  className={`page-btn ${pageNum === pagination.currentPage ? 'active' : ''}`}
                >
                  {pageNum}
                </button>
              )
            ))}
          </div>

          <button
            onClick={pagination.nextPage}
            disabled={!pagination.hasNextPage}
            className="pagination-btn"
          >
            Siguiente ▶️
          </button>
          <button
            onClick={pagination.lastPage}
            disabled={!pagination.hasNextPage}
            className="pagination-btn"
            title="Última página"
          >
            ⏭️
          </button>
        </div>
      </div>

      <style>{`
        .guide-table-container {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          overflow: hidden;
        }

        .table-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .total-count {
          font-size: 0.875rem;
          color: #475569;
        }

        .selected-count {
          font-size: 0.75rem;
          color: #3b82f6;
          background: #eff6ff;
          padding: 0.25rem 0.5rem;
          border-radius: 9999px;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .page-size-label {
          font-size: 0.875rem;
          color: #64748b;
        }

        .page-size-select {
          padding: 0.375rem 0.75rem;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          background: white;
          font-size: 0.875rem;
          cursor: pointer;
        }

        .table-wrapper {
          overflow-x: auto;
        }

        .guide-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.875rem;
        }

        .guide-table th {
          background: #f1f5f9;
          padding: 0.75rem 1rem;
          text-align: left;
          font-weight: 600;
          color: #475569;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 2px solid #e2e8f0;
          white-space: nowrap;
        }

        .guide-table td {
          padding: 0.75rem 1rem;
          border-bottom: 1px solid #f1f5f9;
          color: #1e293b;
        }

        .guide-table tr {
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .guide-table tbody tr:hover {
          background: #f8fafc;
        }

        .guide-table tr.selected {
          background: #eff6ff;
        }

        .guide-table tr.has-issue {
          background: #fef2f2;
        }

        .guide-table tr.has-issue:hover {
          background: #fee2e2;
        }

        .col-checkbox {
          width: 40px;
          text-align: center;
        }

        .col-number {
          width: 50px;
          text-align: center;
        }

        .row-number {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 2rem;
          height: 1.5rem;
          background: #e2e8f0;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 600;
          color: #64748b;
        }

        .col-guia {
          width: 140px;
        }

        .guia-number {
          font-family: 'Monaco', 'Menlo', monospace;
          font-weight: 600;
          color: #1e293b;
        }

        .col-estado {
          width: 150px;
        }

        .status-badge {
          display: inline-block;
          padding: 0.25rem 0.625rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 500;
          color: white;
          white-space: nowrap;
        }

        .col-transport {
          width: 120px;
          font-size: 0.8125rem;
        }

        .col-ciudad {
          width: 120px;
        }

        .col-telefono {
          width: 120px;
        }

        .col-telefono a {
          color: #3b82f6;
          text-decoration: none;
        }

        .col-telefono a:hover {
          text-decoration: underline;
        }

        .no-phone {
          color: #94a3b8;
        }

        .col-dias {
          width: 60px;
          text-align: center;
        }

        .days-badge {
          display: inline-block;
          padding: 0.125rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 600;
          background: #f1f5f9;
          color: #475569;
        }

        .days-badge.delayed {
          background: #fef3c7;
          color: #d97706;
        }

        .col-carga {
          width: 70px;
          text-align: center;
          font-size: 0.75rem;
          color: #64748b;
        }

        .pagination-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          background: #f8fafc;
          border-top: 1px solid #e2e8f0;
        }

        .pagination-info {
          font-size: 0.875rem;
          color: #64748b;
        }

        .pagination-controls {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .pagination-btn {
          padding: 0.5rem 0.75rem;
          border: 1px solid #e2e8f0;
          background: white;
          border-radius: 6px;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .pagination-btn:hover:not(:disabled) {
          background: #f1f5f9;
          border-color: #cbd5e1;
        }

        .pagination-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .page-numbers {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .page-btn {
          min-width: 2rem;
          height: 2rem;
          padding: 0;
          border: 1px solid #e2e8f0;
          background: white;
          border-radius: 6px;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .page-btn:hover {
          background: #f1f5f9;
        }

        .page-btn.active {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }

        .ellipsis {
          padding: 0 0.5rem;
          color: #94a3b8;
        }

        @media (max-width: 768px) {
          .table-header {
            flex-direction: column;
            gap: 0.75rem;
            align-items: flex-start;
          }

          .pagination-container {
            flex-direction: column;
            gap: 1rem;
          }

          .pagination-controls {
            flex-wrap: wrap;
            justify-content: center;
          }

          .col-transport,
          .col-carga {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default GuideTable;
