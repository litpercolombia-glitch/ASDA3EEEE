/**
 * TableArtifact - Tabla de datos profesional
 * Con sorting, filtros, paginacion y export
 */

import React, { useState, useMemo } from 'react';
import {
  ChevronUp,
  ChevronDown,
  Download,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  FileSpreadsheet,
} from 'lucide-react';
import { colors, radius, shadows, transitions } from '../../../styles/theme';
import { Button } from '../UI/Button';
import { Input } from '../UI/Input';

// ============================================
// TYPES
// ============================================

export interface TableColumn {
  key: string;
  label: string;
  type?: 'string' | 'number' | 'date' | 'currency' | 'status';
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: any) => React.ReactNode;
}

export interface TableArtifactProps {
  title?: string;
  columns: TableColumn[];
  rows: Record<string, any>[];
  pageSize?: number;
  searchable?: boolean;
  exportable?: boolean;
  selectable?: boolean;
  onRowClick?: (row: any) => void;
  onExport?: (format: 'csv' | 'excel') => void;
  compact?: boolean;
}

// ============================================
// UTILS
// ============================================

const formatValue = (value: any, type?: string): React.ReactNode => {
  if (value === null || value === undefined) return '-';

  switch (type) {
    case 'currency':
      return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
      }).format(value);

    case 'number':
      return new Intl.NumberFormat('es-CO').format(value);

    case 'date':
      try {
        return new Date(value).toLocaleDateString('es-CO');
      } catch {
        return value;
      }

    case 'status':
      const statusColors: Record<string, string> = {
        entregado: colors.success.default,
        'en transito': colors.info.default,
        'con novedad': colors.warning.default,
        devuelto: colors.error.default,
        pendiente: colors.text.tertiary,
      };
      const statusColor = statusColors[value.toLowerCase()] || colors.text.secondary;
      return (
        <span
          style={{
            padding: '0.25rem 0.5rem',
            borderRadius: radius.full,
            backgroundColor: statusColor + '20',
            color: statusColor,
            fontSize: '0.75rem',
            fontWeight: 500,
          }}
        >
          {value}
        </span>
      );

    default:
      return value;
  }
};

// ============================================
// COMPONENT
// ============================================

export const TableArtifact: React.FC<TableArtifactProps> = ({
  title,
  columns,
  rows,
  pageSize = 10,
  searchable = true,
  exportable = true,
  selectable = false,
  onRowClick,
  onExport,
  compact = false,
}) => {
  // State
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  // Filter and sort data
  const processedData = useMemo(() => {
    let data = [...rows];

    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      data = data.filter((row) =>
        columns.some((col) => {
          const value = row[col.key];
          return value?.toString().toLowerCase().includes(query);
        })
      );
    }

    // Sort
    if (sortColumn) {
      data.sort((a, b) => {
        const aVal = a[sortColumn];
        const bVal = b[sortColumn];

        if (aVal === bVal) return 0;
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;

        const comparison = aVal < bVal ? -1 : 1;
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return data;
  }, [rows, columns, searchQuery, sortColumn, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(processedData.length / pageSize);
  const paginatedData = processedData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Handlers
  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const handleSelectAll = () => {
    if (selectedRows.size === paginatedData.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(paginatedData.map((_, idx) => idx)));
    }
  };

  const handleSelectRow = (idx: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(idx)) {
      newSelected.delete(idx);
    } else {
      newSelected.add(idx);
    }
    setSelectedRows(newSelected);
  };

  const handleExport = (format: 'csv' | 'excel') => {
    if (onExport) {
      onExport(format);
      return;
    }

    // Default CSV export
    if (format === 'csv') {
      const header = columns.map((c) => c.label).join(',');
      const dataRows = processedData.map((row) =>
        columns.map((c) => `"${row[c.key] || ''}"`).join(',')
      );
      const csv = [header, ...dataRows].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title || 'export'}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // ============================================
  // STYLES
  // ============================================

  const containerStyles: React.CSSProperties = {
    backgroundColor: colors.bg.tertiary,
    borderRadius: radius.xl,
    border: `1px solid ${colors.border.light}`,
    overflow: 'hidden',
  };

  const headerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: compact ? '0.75rem' : '1rem',
    borderBottom: `1px solid ${colors.border.light}`,
    gap: '1rem',
    flexWrap: 'wrap',
  };

  const titleStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: compact ? '0.875rem' : '1rem',
    fontWeight: 600,
    color: colors.text.primary,
  };

  const actionsStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  };

  const tableContainerStyles: React.CSSProperties = {
    overflowX: 'auto',
  };

  const tableStyles: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: compact ? '0.8125rem' : '0.875rem',
  };

  const thStyles = (col: TableColumn): React.CSSProperties => ({
    padding: compact ? '0.625rem 0.75rem' : '0.75rem 1rem',
    textAlign: col.align || 'left',
    fontWeight: 600,
    color: colors.text.secondary,
    backgroundColor: colors.bg.secondary,
    borderBottom: `1px solid ${colors.border.default}`,
    whiteSpace: 'nowrap',
    cursor: col.sortable !== false ? 'pointer' : 'default',
    userSelect: 'none',
    width: col.width,
    transition: `background-color ${transitions.fast}`,
  });

  const tdStyles = (col: TableColumn): React.CSSProperties => ({
    padding: compact ? '0.5rem 0.75rem' : '0.75rem 1rem',
    textAlign: col.align || 'left',
    color: colors.text.primary,
    borderBottom: `1px solid ${colors.border.light}`,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '200px',
  });

  const paginationStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: compact ? '0.5rem 0.75rem' : '0.75rem 1rem',
    borderTop: `1px solid ${colors.border.light}`,
    fontSize: '0.8125rem',
    color: colors.text.secondary,
  };

  const pageButtonStyles = (disabled: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.375rem',
    backgroundColor: 'transparent',
    border: `1px solid ${colors.border.default}`,
    borderRadius: radius.md,
    color: disabled ? colors.text.muted : colors.text.secondary,
    cursor: disabled ? 'default' : 'pointer',
    opacity: disabled ? 0.5 : 1,
  });

  return (
    <div style={containerStyles}>
      {/* Header */}
      <div style={headerStyles}>
        <div style={titleStyles}>
          <FileSpreadsheet size={18} style={{ color: colors.brand.primary }} />
          {title || 'Datos'}
          <span style={{ fontWeight: 400, color: colors.text.tertiary }}>
            ({processedData.length} registros)
          </span>
        </div>

        <div style={actionsStyles}>
          {searchable && (
            <div style={{ width: '200px' }}>
              <Input
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                icon={Search}
                size="sm"
              />
            </div>
          )}

          {exportable && (
            <Button
              variant="ghost"
              size="sm"
              icon={Download}
              onClick={() => handleExport('csv')}
            >
              Exportar
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div style={tableContainerStyles}>
        <table style={tableStyles}>
          <thead>
            <tr>
              {selectable && (
                <th style={{ ...thStyles({ key: '', label: '' }), width: '40px' }}>
                  <input
                    type="checkbox"
                    checked={selectedRows.size === paginatedData.length && paginatedData.length > 0}
                    onChange={handleSelectAll}
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={thStyles(col)}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                  onMouseEnter={(e) => {
                    if (col.sortable !== false) {
                      e.currentTarget.style.backgroundColor = colors.bg.hover;
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = colors.bg.secondary;
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    {col.label}
                    {sortColumn === col.key && (
                      sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  style={{
                    padding: '2rem',
                    textAlign: 'center',
                    color: colors.text.tertiary,
                  }}
                >
                  No hay datos disponibles
                </td>
              </tr>
            ) : (
              paginatedData.map((row, idx) => (
                <tr
                  key={idx}
                  onClick={() => onRowClick?.(row)}
                  style={{
                    cursor: onRowClick ? 'pointer' : 'default',
                    backgroundColor: selectedRows.has(idx) ? colors.brand.primary + '10' : 'transparent',
                    transition: `background-color ${transitions.fast}`,
                  }}
                  onMouseEnter={(e) => {
                    if (!selectedRows.has(idx)) {
                      e.currentTarget.style.backgroundColor = colors.bg.hover;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!selectedRows.has(idx)) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  {selectable && (
                    <td style={tdStyles({ key: '', label: '' })}>
                      <input
                        type="checkbox"
                        checked={selectedRows.has(idx)}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleSelectRow(idx);
                        }}
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key} style={tdStyles(col)}>
                      {col.render
                        ? col.render(row[col.key], row)
                        : formatValue(row[col.key], col.type)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={paginationStyles}>
          <span>
            Mostrando {(currentPage - 1) * pageSize + 1} -{' '}
            {Math.min(currentPage * pageSize, processedData.length)} de{' '}
            {processedData.length}
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              style={pageButtonStyles(currentPage === 1)}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={16} />
            </button>

            <span>
              Pagina {currentPage} de {totalPages}
            </span>

            <button
              style={pageButtonStyles(currentPage === totalPages)}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableArtifact;
