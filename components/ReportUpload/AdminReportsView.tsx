// components/ReportUpload/AdminReportsView.tsx
// Vista Admin: Dashboard consolidado de todos los reportes de todas las personas
// Design System: Linear meets Stripe on Dark Logistics (LS V2)

import React, { useState, useMemo } from 'react';
import {
  FileText,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Search,
  Eye,
  MessageSquare,
  Calendar,
  File,
  Image,
  FileSpreadsheet,
  Shield,
  Inbox,
  Check,
  Link2,
  X,
  Tag,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useReportUploadStore } from '../../stores/reportUploadStore';
import { useAuthStore } from '../../stores/authStore';
import { ShareableLinkManager } from './ShareableLinkManager';
import {
  UserReport,
  ReportCategory,
  ReportStatus,
  REPORT_CATEGORIES,
  STATUS_CONFIG,
  formatFileSize,
} from '../../services/reportUploadService';

export function AdminReportsView() {
  const { user } = useAuthStore();
  const { getAll, getStats, getCompliance, updateStatus } = useReportUploadStore();

  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'compliance' | 'links'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<ReportStatus | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<ReportCategory | 'all'>('all');
  const [reviewingReport, setReviewingReport] = useState<UserReport | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  const stats = useMemo(() => getStats(), [getAll]);
  const compliance = useMemo(() => getCompliance(), [getAll]);

  const reports = useMemo(() => {
    let items = getAll();

    if (activeTab === 'pending') {
      items = items.filter(r => r.status === 'submitted' || r.status === 'under_review');
    }

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
        r.userName.toLowerCase().includes(q) ||
        r.userEmail.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q)
      );
    }

    items.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    return items;
  }, [getAll, activeTab, filterStatus, filterCategory, searchQuery]);

  const handleApprove = (report: UserReport) => {
    updateStatus(report.id, 'approved', reviewComment || 'Aprobado', user?.nombre);
    setReviewingReport(null);
    setReviewComment('');
  };

  const handleReject = (report: UserReport) => {
    if (!reviewComment.trim()) return;
    updateStatus(report.id, 'rejected', reviewComment, user?.nombre);
    setReviewingReport(null);
    setReviewComment('');
  };

  const handleMarkUnderReview = (reportId: string) => {
    updateStatus(reportId, 'under_review', undefined, user?.nombre);
  };

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

  const statCards = [
    { label: 'Total Reportes', value: stats.total, icon: FileText, gradient: 'from-[rgba(0,245,255,0.15)] to-[rgba(14,165,233,0.08)]' },
    { label: 'Este Mes', value: stats.thisMonth, icon: Calendar, gradient: 'from-[rgba(168,85,247,0.15)] to-[rgba(139,92,246,0.08)]' },
    { label: 'Pendientes', value: stats.pendingReview, icon: Clock, gradient: 'from-[rgba(251,191,36,0.15)] to-[rgba(245,158,11,0.08)]' },
    { label: 'Personas', value: stats.uniqueUsers, icon: Users, gradient: 'from-[rgba(74,222,128,0.15)] to-[rgba(34,197,94,0.08)]' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-[rgba(0,245,255,0.12)] rounded-xl">
          <Shield className="w-8 h-8 text-cyan-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Gestión de Reportes</h2>
          <p className="text-[#94a3b8]">Administra todos los reportes de tu equipo</p>
        </div>
      </div>

      {/* Stats Cards - Bento Grid */}
      <div className="ls-bento">
        {statCards.map((card, i) => (
          <div key={i} className="ls-metric-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#94a3b8] text-sm">{card.label}</p>
                <p className="text-3xl font-bold text-white mt-1">{card.value}</p>
              </div>
              <div className={`p-3 bg-gradient-to-br ${card.gradient} rounded-xl`}>
                <card.icon className="w-6 h-6 text-white/80" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Compliance Rate Bar */}
      <div className="ls-card p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[#f1f5f9] font-medium">Tasa de Cumplimiento (este mes)</span>
          <span className="text-2xl font-bold text-white">{stats.complianceRate}%</span>
        </div>
        <div className="ls-progress-track">
          <div
            className={`ls-progress-fill ${
              stats.complianceRate >= 80 ? 'bg-gradient-to-r from-green-500 to-emerald-400' :
              stats.complianceRate >= 50 ? 'bg-gradient-to-r from-yellow-500 to-amber-400' :
              'bg-gradient-to-r from-red-500 to-rose-400'
            }`}
            style={{ width: `${stats.complianceRate}%` }}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[rgba(255,255,255,0.06)] pb-2">
        {[
          { id: 'all', label: 'Todos los Reportes', icon: FileText, count: stats.total },
          { id: 'pending', label: 'Pendientes de Revisión', icon: Clock, count: stats.pendingReview },
          { id: 'compliance', label: 'Cumplimiento por Persona', icon: Users, count: compliance.length },
          { id: 'links', label: 'Links Compartibles', icon: Link2, count: 0 },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`ls-tab ${activeTab === tab.id ? 'active' : ''}`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.count > 0 && (
              <span className={`px-2 py-0.5 text-xs rounded-full ${
                activeTab === tab.id ? 'bg-[rgba(0,245,255,0.2)]' : 'bg-white/[0.06]'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Compliance Tab */}
      {activeTab === 'links' ? (
        <ShareableLinkManager />
      ) : activeTab === 'compliance' ? (
        <div className="space-y-3">
          {compliance.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-[#64748b] mx-auto mb-4" />
              <p className="text-[#94a3b8]">No hay datos de cumplimiento aún</p>
            </div>
          ) : (
            compliance.map(person => (
              <div key={person.userId} className="ls-card overflow-hidden">
                <button
                  onClick={() => setExpandedUser(expandedUser === person.userId ? null : person.userId)}
                  className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[rgba(0,245,255,0.12)] rounded-full flex items-center justify-center text-cyan-300 font-bold">
                      {person.userName.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-left">
                      <p className="text-white font-medium">{person.userName}</p>
                      <p className="text-xs text-[#64748b]">
                        Último envío: {person.lastSubmission
                          ? new Date(person.lastSubmission).toLocaleDateString('es-CO')
                          : 'Nunca'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-bold text-white">{person.totalReports}</p>
                      <p className="text-xs text-[#64748b]">reportes</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-emerald-400">{person.thisMonth}</p>
                      <p className="text-xs text-[#64748b]">este mes</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${person.approvedRate >= 70 ? 'text-green-400' : person.approvedRate >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {person.approvedRate}%
                      </p>
                      <p className="text-xs text-[#64748b]">aprobados</p>
                    </div>
                    {expandedUser === person.userId ? <ChevronUp className="w-4 h-4 text-[#64748b]" /> : <ChevronDown className="w-4 h-4 text-[#64748b]" />}
                  </div>
                </button>
                {expandedUser === person.userId && (
                  <div className="border-t border-[rgba(255,255,255,0.06)] p-4 space-y-2">
                    {getAll().filter(r => r.userId === person.userId)
                      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
                      .slice(0, 5)
                      .map(report => (
                        <div key={report.id} className="flex items-center justify-between py-2 px-3 bg-white/[0.02] rounded-lg">
                          <div className="flex items-center gap-2">
                            {getFileIcon(report.fileType)}
                            <span className="text-sm text-white">{report.title}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={getBadgeClass(report.status)}>
                              {getStatusIcon(report.status)}
                              {STATUS_CONFIG[report.status].label}
                            </span>
                            <span className="text-xs text-[#64748b]">
                              {new Date(report.submittedAt).toLocaleDateString('es-CO')}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      ) : (
        /* All / Pending Reports */
        <>
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por título, persona o email..."
                className="ls-input w-full pl-10"
              />
            </div>
            {activeTab === 'all' && (
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as ReportStatus | 'all')}
                className="ls-select"
              >
                <option value="all">Todos los estados</option>
                {(Object.entries(STATUS_CONFIG) as [ReportStatus, typeof STATUS_CONFIG[ReportStatus]][]).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            )}
          </div>

          {/* Reports Table */}
          <div className="space-y-3">
            {reports.length === 0 ? (
              <div className="text-center py-12">
                <Inbox className="w-12 h-12 text-[#64748b] mx-auto mb-4" />
                <p className="text-[#94a3b8]">
                  {activeTab === 'pending' ? 'No hay reportes pendientes de revisión' : 'No hay reportes'}
                </p>
              </div>
            ) : (
              reports.map(report => (
                <div key={report.id} className="ls-card p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="p-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-lg flex-shrink-0">
                        {getFileIcon(report.fileType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-medium text-white">{report.title}</h4>
                          <span className={getBadgeClass(report.status)}>
                            {getStatusIcon(report.status)}
                            {STATUS_CONFIG[report.status].label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-5 h-5 bg-[rgba(0,245,255,0.12)] rounded-full flex items-center justify-center text-cyan-300 text-[10px] font-bold">
                            {report.userName.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm text-[#f1f5f9]">{report.userName}</span>
                          <span className="text-xs text-[#64748b]">{report.userEmail}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-xs text-[#64748b]">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(report.submittedAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span>{REPORT_CATEGORIES[report.category]?.label}</span>
                          <span>{formatFileSize(report.fileSize)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {(report.status === 'submitted' || report.status === 'under_review') && (
                        <>
                          {report.status === 'submitted' && (
                            <button
                              onClick={() => handleMarkUnderReview(report.id)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-[rgba(251,191,36,0.15)] text-yellow-400 border border-[rgba(251,191,36,0.25)] rounded-lg hover:bg-[rgba(251,191,36,0.25)] text-sm transition-colors"
                              title="Marcar en revisión"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Revisar
                            </button>
                          )}
                          <button
                            onClick={() => { setReviewingReport(report); setReviewComment(''); }}
                            className="flex items-center gap-1 px-3 py-1.5 bg-[rgba(0,245,255,0.1)] text-cyan-400 border border-[rgba(0,245,255,0.2)] rounded-lg hover:bg-[rgba(0,245,255,0.18)] text-sm transition-colors"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            Evaluar
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => setReviewingReport(report)}
                        className="p-1.5 text-[#64748b] hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors"
                        title="Ver detalle"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Review Modal */}
      {reviewingReport && (
        <div className="fixed inset-0 ls-modal-overlay flex items-center justify-center z-50 p-4">
          <div className="ls-modal w-full max-w-lg max-h-[85vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[rgba(255,255,255,0.06)]">
              <h3 className="text-lg font-semibold text-white">Revisar Reporte</h3>
              <button onClick={() => { setReviewingReport(null); setReviewComment(''); }} className="p-1.5 hover:bg-white/[0.06] rounded-lg">
                <X className="w-5 h-5 text-[#64748b]" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto max-h-[calc(85vh-140px)] space-y-4">
              {/* Report Info */}
              <div className="ls-card-elevated p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[rgba(0,245,255,0.12)] rounded-full flex items-center justify-center text-cyan-300 font-bold">
                    {reviewingReport.userName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white font-medium">{reviewingReport.userName}</p>
                    <p className="text-xs text-[#64748b]">{reviewingReport.userEmail}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-[#64748b] uppercase tracking-wider mb-1">Título</p>
                  <p className="text-white">{reviewingReport.title}</p>
                </div>
                <div>
                  <p className="text-xs text-[#64748b] uppercase tracking-wider mb-1">Descripción</p>
                  <p className="text-white text-sm">{reviewingReport.description || 'Sin descripción'}</p>
                </div>
                <div className="flex items-center gap-3">
                  {getFileIcon(reviewingReport.fileType)}
                  <span className="text-white text-sm">{reviewingReport.fileName}</span>
                  <span className="text-[#64748b] text-xs">({formatFileSize(reviewingReport.fileSize)})</span>
                </div>
                <div className="text-xs text-[#64748b]">
                  Enviado: {new Date(reviewingReport.submittedAt).toLocaleString('es-CO')}
                </div>
              </div>

              {/* Image Preview */}
              {reviewingReport.fileType.startsWith('image/') && reviewingReport.fileData && (
                <div className="rounded-xl overflow-hidden border border-[rgba(255,255,255,0.06)]">
                  <img src={reviewingReport.fileData} alt={reviewingReport.title} className="w-full" />
                </div>
              )}

              {/* Review Actions */}
              {(reviewingReport.status === 'submitted' || reviewingReport.status === 'under_review') && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-[#94a3b8] mb-1.5">
                      Comentario de Revisión
                    </label>
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Escribe un comentario (obligatorio para rechazar)..."
                      rows={3}
                      className="ls-input w-full resize-none"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleReject(reviewingReport)}
                      disabled={!reviewComment.trim()}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[rgba(248,113,113,0.15)] text-red-400 border border-[rgba(248,113,113,0.3)] rounded-xl hover:bg-[rgba(248,113,113,0.25)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      Rechazar
                    </button>
                    <button
                      onClick={() => handleApprove(reviewingReport)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:from-emerald-600 hover:to-green-700 transition-colors shadow-[0_0_20px_rgba(74,222,128,0.15)]"
                    >
                      <Check className="w-4 h-4" />
                      Aprobar
                    </button>
                  </div>
                </div>
              )}

              {/* Already reviewed */}
              {(reviewingReport.status === 'approved' || reviewingReport.status === 'rejected') && (
                <div className={`p-4 rounded-xl border ${
                  reviewingReport.status === 'approved'
                    ? 'bg-[rgba(74,222,128,0.1)] border-[rgba(74,222,128,0.25)]'
                    : 'bg-[rgba(248,113,113,0.1)] border-[rgba(248,113,113,0.25)]'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    {getStatusIcon(reviewingReport.status)}
                    <span className="text-sm font-medium text-white">
                      {reviewingReport.status === 'approved' ? 'Aprobado' : 'Rechazado'}
                    </span>
                    {reviewingReport.reviewedBy && (
                      <span className="text-xs text-[#94a3b8]">por {reviewingReport.reviewedBy}</span>
                    )}
                  </div>
                  {reviewingReport.adminComment && (
                    <p className="text-sm text-[#f1f5f9] mt-1">{reviewingReport.adminComment}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminReportsView;
