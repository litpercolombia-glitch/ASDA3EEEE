// components/ReportUpload/MyReportsPanel.tsx
// Panel donde cada usuario ve sus reportes subidos
// Design System: Linear meets Stripe on Dark Logistics (LS V2)

import React, { useState, useMemo } from 'react';
import {
  FileText,
  Upload,
  Search,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  Tag,
  X,
  File,
  Image,
  FileSpreadsheet,
  Inbox,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useReportUploadStore } from '../../stores/reportUploadStore';
import {
  UserReport,
  ReportCategory,
  ReportStatus,
  REPORT_CATEGORIES,
  STATUS_CONFIG,
  formatFileSize,
} from '../../services/reportUploadService';

interface MyReportsPanelProps {
  onOpenUploadModal: () => void;
}

export function MyReportsPanel({ onOpenUploadModal }: MyReportsPanelProps) {
  const { user } = useAuthStore();
  const { getByUser, filterStatus, filterCategory, searchQuery, setFilterStatus, setFilterCategory, setSearchQuery } = useReportUploadStore();

  const [viewingReport, setViewingReport] = useState<UserReport | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'status'>('date');

  const reports = useMemo(() => {
    if (!user) return [];
    let items = getByUser(user.id);

    if (filterStatus !== 'all') {
      items = items.filter(r => r.status === filterStatus);
    }
    if (filterCategory !== 'all') {
      items = items.filter(r => r.category === filterCategory);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(r =>
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    items.sort((a, b) => {
      if (sortBy === 'date') return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
      return a.status.localeCompare(b.status);
    });

    return items;
  }, [user, getByUser, filterStatus, filterCategory, searchQuery, sortBy]);

  const statusCounts = useMemo(() => {
    if (!user) return {};
    const all = getByUser(user.id);
    const counts: Record<string, number> = { all: all.length };
    all.forEach(r => { counts[r.status] = (counts[r.status] || 0) + 1; });
    return counts;
  }, [user, getByUser]);

  const getStatusIcon = (status: ReportStatus) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-400" />;
      case 'under_review': return <AlertCircle className="w-4 h-4 text-yellow-400" />;
      case 'submitted': return <Clock className="w-4 h-4 text-blue-400" />;
      default: return <FileText className="w-4 h-4 text-[#64748b]" />;
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="w-5 h-5 text-purple-400" />;
    if (type.includes('spreadsheet') || type.includes('excel') || type.includes('csv'))
      return <FileSpreadsheet className="w-5 h-5 text-green-400" />;
    if (type.includes('pdf')) return <FileText className="w-5 h-5 text-red-400" />;
    return <File className="w-5 h-5 text-[#64748b]" />;
  };

  const getBadgeClass = (status: ReportStatus) => {
    switch (status) {
      case 'approved': return 'ls-badge ls-badge-green';
      case 'rejected': return 'ls-badge ls-badge-red';
      case 'under_review': return 'ls-badge ls-badge-amber';
      case 'submitted': return 'ls-badge ls-badge-blue';
      default: return 'ls-badge ls-badge-gray';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[rgba(0,245,255,0.12)] rounded-xl">
            <FileText className="w-7 h-7 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Mis Reportes</h2>
            <p className="text-[#94a3b8] text-sm">
              {statusCounts['all'] || 0} reportes en total
            </p>
          </div>
        </div>
        <button
          onClick={onOpenUploadModal}
          className="ls-btn-primary flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          Subir Reporte
        </button>
      </div>

      {/* Status Pills */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'submitted', 'under_review', 'approved', 'rejected'] as const).map(status => {
          const config = status === 'all'
            ? { label: 'Todos', color: 'text-white', bgColor: 'bg-white/[0.04]' }
            : STATUS_CONFIG[status];
          const count = statusCounts[status] || 0;
          return (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`ls-pill ${
                filterStatus === status
                  ? 'active'
                  : `${config.bgColor} ${config.color} hover:opacity-80`
              }`}
            >
              {status !== 'all' && getStatusIcon(status as ReportStatus)}
              {config.label}
              {count > 0 && (
                <span className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${
                  filterStatus === status ? 'bg-[rgba(0,245,255,0.2)]' : 'bg-white/[0.06]'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por título, descripción o etiqueta..."
            className="ls-input w-full pl-10"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value as ReportCategory | 'all')}
          className="ls-select"
        >
          <option value="all">Todas las categorías</option>
          {(Object.entries(REPORT_CATEGORIES) as [ReportCategory, typeof REPORT_CATEGORIES[ReportCategory]][]).map(([key, config]) => (
            <option key={key} value={key}>{config.label}</option>
          ))}
        </select>
      </div>

      {/* Reports List */}
      <div className="space-y-3">
        {reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-4 bg-white/[0.04] rounded-full mb-4">
              <Inbox className="w-10 h-10 text-[#64748b]" />
            </div>
            <h3 className="text-lg font-medium text-[#f1f5f9] mb-2">
              {statusCounts['all'] === 0 ? 'No tienes reportes aún' : 'Sin resultados'}
            </h3>
            <p className="text-[#64748b] mb-4 max-w-sm">
              {statusCounts['all'] === 0
                ? 'Sube tu primer reporte para que quede registrado en el sistema.'
                : 'Intenta cambiar los filtros o la búsqueda.'}
            </p>
            {statusCounts['all'] === 0 && (
              <button
                onClick={onOpenUploadModal}
                className="ls-btn-primary flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Subir Primer Reporte
              </button>
            )}
          </div>
        ) : (
          reports.map(report => (
            <div
              key={report.id}
              className="ls-card p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="p-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-lg flex-shrink-0">
                    {getFileIcon(report.fileType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-medium text-white truncate">{report.title}</h4>
                      <span className={getBadgeClass(report.status)}>
                        {getStatusIcon(report.status)}
                        {STATUS_CONFIG[report.status].label}
                      </span>
                      {report.version > 1 && (
                        <span className="ls-badge ls-badge-purple">
                          v{report.version}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[#94a3b8] mt-1 line-clamp-1">{report.description || 'Sin descripción'}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-[#64748b] flex-wrap">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(report.submittedAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {REPORT_CATEGORIES[report.category]?.label || report.category}
                      </span>
                      <span>{report.fileName} ({formatFileSize(report.fileSize)})</span>
                    </div>
                    {report.tags.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        {report.tags.map((tag, i) => (
                          <span key={i} className="px-2 py-0.5 text-xs bg-white/[0.06] border border-[rgba(255,255,255,0.06)] text-[#94a3b8] rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    {report.adminComment && (
                      <div className={`mt-2 p-2 rounded-lg text-sm ${
                        report.status === 'rejected'
                          ? 'bg-[rgba(248,113,113,0.1)] border border-[rgba(248,113,113,0.25)] text-red-300'
                          : 'bg-[rgba(74,222,128,0.1)] border border-[rgba(74,222,128,0.25)] text-green-300'
                      }`}>
                        <span className="font-medium">Admin: </span>{report.adminComment}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setViewingReport(report)}
                  className="ls-btn-secondary flex items-center gap-1.5 text-sm flex-shrink-0 !py-1.5 !px-3"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Ver
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* View Report Detail Modal */}
      {viewingReport && (
        <div className="fixed inset-0 ls-modal-overlay flex items-center justify-center z-50 p-4">
          <div className="ls-modal w-full max-w-lg max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[rgba(255,255,255,0.06)]">
              <h3 className="text-lg font-semibold text-white truncate pr-4">{viewingReport.title}</h3>
              <button onClick={() => setViewingReport(null)} className="p-1.5 hover:bg-white/[0.06] rounded-lg">
                <X className="w-5 h-5 text-[#64748b]" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto max-h-[calc(80vh-64px)] space-y-4">
              <div className="flex items-center gap-2">
                <span className={getBadgeClass(viewingReport.status)}>
                  {getStatusIcon(viewingReport.status)}
                  {STATUS_CONFIG[viewingReport.status].label}
                </span>
                <span className="text-sm text-[#94a3b8]">
                  v{viewingReport.version}
                </span>
              </div>

              <div className="ls-card-elevated p-4 space-y-3">
                <div>
                  <p className="text-xs text-[#64748b] uppercase tracking-wider mb-1">Categoría</p>
                  <p className="text-white text-sm">{REPORT_CATEGORIES[viewingReport.category]?.label}</p>
                </div>
                <div>
                  <p className="text-xs text-[#64748b] uppercase tracking-wider mb-1">Descripción</p>
                  <p className="text-white text-sm">{viewingReport.description || 'Sin descripción'}</p>
                </div>
                <div>
                  <p className="text-xs text-[#64748b] uppercase tracking-wider mb-1">Periodo</p>
                  <p className="text-white text-sm">
                    {new Date(viewingReport.period.start).toLocaleDateString('es-CO')} - {new Date(viewingReport.period.end).toLocaleDateString('es-CO')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#64748b] uppercase tracking-wider mb-1">Archivo</p>
                  <div className="flex items-center gap-2">
                    {getFileIcon(viewingReport.fileType)}
                    <span className="text-white text-sm">{viewingReport.fileName}</span>
                    <span className="text-[#64748b] text-xs">({formatFileSize(viewingReport.fileSize)})</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-[#64748b] uppercase tracking-wider mb-1">Enviado</p>
                  <p className="text-white text-sm">
                    {new Date(viewingReport.submittedAt).toLocaleString('es-CO')}
                  </p>
                </div>
              </div>

              {viewingReport.fileType.startsWith('image/') && viewingReport.fileData && (
                <div className="rounded-xl overflow-hidden border border-[rgba(255,255,255,0.06)]">
                  <img src={viewingReport.fileData} alt={viewingReport.title} className="w-full" />
                </div>
              )}

              {viewingReport.adminComment && (
                <div className={`p-4 rounded-xl border ${
                  viewingReport.status === 'rejected'
                    ? 'bg-[rgba(248,113,113,0.1)] border-[rgba(248,113,113,0.25)]'
                    : 'bg-[rgba(74,222,128,0.1)] border-[rgba(74,222,128,0.25)]'
                }`}>
                  <p className="text-xs text-[#94a3b8] uppercase tracking-wider mb-1">Comentario del Administrador</p>
                  <p className={`text-sm ${viewingReport.status === 'rejected' ? 'text-red-300' : 'text-green-300'}`}>
                    {viewingReport.adminComment}
                  </p>
                </div>
              )}

              {viewingReport.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {viewingReport.tags.map((tag, i) => (
                    <span key={i} className="flex items-center gap-1 px-2.5 py-1 text-xs bg-white/[0.04] text-[#94a3b8] rounded-full border border-[rgba(255,255,255,0.06)]">
                      <Tag className="w-3 h-3" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyReportsPanel;
