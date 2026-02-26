// components/ReportUpload/AdminReportsView.tsx
// Vista Admin: Dashboard consolidado de todos los reportes de todas las personas

import React, { useState, useMemo } from 'react';
import {
  FileText,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Search,
  Filter,
  Eye,
  MessageSquare,
  TrendingUp,
  BarChart3,
  Download,
  ChevronDown,
  ChevronUp,
  X,
  Tag,
  Calendar,
  File,
  Image,
  FileSpreadsheet,
  Shield,
  Inbox,
  Check,
} from 'lucide-react';
import { useReportUploadStore } from '../../stores/reportUploadStore';
import { useAuthStore } from '../../stores/authStore';
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

  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'compliance'>('all');
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
      default: return <FileText className="w-4 h-4 text-gray-400" />;
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="w-5 h-5 text-purple-400" />;
    if (type.includes('spreadsheet') || type.includes('excel') || type.includes('csv'))
      return <FileSpreadsheet className="w-5 h-5 text-green-400" />;
    if (type.includes('pdf')) return <FileText className="w-5 h-5 text-red-400" />;
    return <File className="w-5 h-5 text-gray-400" />;
  };

  const statCards = [
    { label: 'Total Reportes', value: stats.total, icon: FileText, color: 'from-indigo-500 to-blue-600' },
    { label: 'Este Mes', value: stats.thisMonth, icon: Calendar, color: 'from-purple-500 to-violet-600' },
    { label: 'Pendientes', value: stats.pendingReview, icon: Clock, color: 'from-amber-500 to-orange-600' },
    { label: 'Personas', value: stats.uniqueUsers, icon: Users, color: 'from-emerald-500 to-teal-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-gradient-to-br from-indigo-500/30 to-purple-500/30 rounded-xl">
          <Shield className="w-8 h-8 text-indigo-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Gestión de Reportes</h2>
          <p className="text-gray-400">Administra todos los reportes de tu equipo</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <div key={i} className="bg-gray-800/50 rounded-xl border border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">{card.label}</p>
                <p className="text-3xl font-bold text-white mt-1">{card.value}</p>
              </div>
              <div className={`p-3 bg-gradient-to-br ${card.color} rounded-xl opacity-80`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Compliance Rate Bar */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-300 font-medium">Tasa de Cumplimiento (este mes)</span>
          <span className="text-2xl font-bold text-white">{stats.complianceRate}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${
              stats.complianceRate >= 80 ? 'bg-gradient-to-r from-green-500 to-emerald-400' :
              stats.complianceRate >= 50 ? 'bg-gradient-to-r from-yellow-500 to-amber-400' :
              'bg-gradient-to-r from-red-500 to-rose-400'
            }`}
            style={{ width: `${stats.complianceRate}%` }}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-700 pb-2">
        {[
          { id: 'all', label: 'Todos los Reportes', icon: FileText, count: stats.total },
          { id: 'pending', label: 'Pendientes de Revisión', icon: Clock, count: stats.pendingReview },
          { id: 'compliance', label: 'Cumplimiento por Persona', icon: Users, count: compliance.length },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.count > 0 && (
              <span className={`px-2 py-0.5 text-xs rounded-full ${
                activeTab === tab.id ? 'bg-indigo-500' : 'bg-gray-600'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Compliance Tab */}
      {activeTab === 'compliance' ? (
        <div className="space-y-3">
          {compliance.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No hay datos de cumplimiento aún</p>
            </div>
          ) : (
            compliance.map(person => (
              <div key={person.userId} className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
                <button
                  onClick={() => setExpandedUser(expandedUser === person.userId ? null : person.userId)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-700/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-500/30 rounded-full flex items-center justify-center text-indigo-300 font-bold">
                      {person.userName.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-left">
                      <p className="text-white font-medium">{person.userName}</p>
                      <p className="text-xs text-gray-500">
                        Último envío: {person.lastSubmission
                          ? new Date(person.lastSubmission).toLocaleDateString('es-CO')
                          : 'Nunca'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-bold text-white">{person.totalReports}</p>
                      <p className="text-xs text-gray-500">reportes</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-emerald-400">{person.thisMonth}</p>
                      <p className="text-xs text-gray-500">este mes</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${person.approvedRate >= 70 ? 'text-green-400' : person.approvedRate >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {person.approvedRate}%
                      </p>
                      <p className="text-xs text-gray-500">aprobados</p>
                    </div>
                    {expandedUser === person.userId ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </button>
                {expandedUser === person.userId && (
                  <div className="border-t border-gray-700 p-4 space-y-2">
                    {getAll().filter(r => r.userId === person.userId)
                      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
                      .slice(0, 5)
                      .map(report => (
                        <div key={report.id} className="flex items-center justify-between py-2 px-3 bg-gray-700/30 rounded-lg">
                          <div className="flex items-center gap-2">
                            {getFileIcon(report.fileType)}
                            <span className="text-sm text-white">{report.title}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`flex items-center gap-1 px-2 py-0.5 text-xs rounded-full ${STATUS_CONFIG[report.status].bgColor} ${STATUS_CONFIG[report.status].color}`}>
                              {getStatusIcon(report.status)}
                              {STATUS_CONFIG[report.status].label}
                            </span>
                            <span className="text-xs text-gray-500">
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
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por título, persona o email..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            {activeTab === 'all' && (
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as ReportStatus | 'all')}
                className="px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                <Inbox className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">
                  {activeTab === 'pending' ? 'No hay reportes pendientes de revisión' : 'No hay reportes'}
                </p>
              </div>
            ) : (
              reports.map(report => (
                <div key={report.id} className="bg-gray-800/50 rounded-xl border border-gray-700 p-4 hover:border-gray-600 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="p-2 bg-gray-700/50 rounded-lg flex-shrink-0">
                        {getFileIcon(report.fileType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-medium text-white">{report.title}</h4>
                          <span className={`flex items-center gap-1 px-2 py-0.5 text-xs rounded-full ${STATUS_CONFIG[report.status].bgColor} ${STATUS_CONFIG[report.status].color}`}>
                            {getStatusIcon(report.status)}
                            {STATUS_CONFIG[report.status].label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-5 h-5 bg-indigo-500/30 rounded-full flex items-center justify-center text-indigo-300 text-[10px] font-bold">
                            {report.userName.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm text-gray-300">{report.userName}</span>
                          <span className="text-xs text-gray-500">{report.userEmail}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
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
                              className="flex items-center gap-1 px-3 py-1.5 bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30 text-sm"
                              title="Marcar en revisión"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Revisar
                            </button>
                          )}
                          <button
                            onClick={() => { setReviewingReport(report); setReviewComment(''); }}
                            className="flex items-center gap-1 px-3 py-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg hover:bg-indigo-500/30 text-sm"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            Evaluar
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => setReviewingReport(report)}
                        className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg"
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl w-full max-w-lg max-h-[85vh] overflow-hidden border border-gray-700">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h3 className="text-lg font-bold text-white">Revisar Reporte</h3>
              <button onClick={() => { setReviewingReport(null); setReviewComment(''); }} className="p-1.5 hover:bg-gray-700 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto max-h-[calc(85vh-140px)] space-y-4">
              {/* Report Info */}
              <div className="bg-gray-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-500/30 rounded-full flex items-center justify-center text-indigo-300 font-bold">
                    {reviewingReport.userName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white font-medium">{reviewingReport.userName}</p>
                    <p className="text-xs text-gray-500">{reviewingReport.userEmail}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">Título</p>
                  <p className="text-white">{reviewingReport.title}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">Descripción</p>
                  <p className="text-white text-sm">{reviewingReport.description || 'Sin descripción'}</p>
                </div>
                <div className="flex items-center gap-3">
                  {getFileIcon(reviewingReport.fileType)}
                  <span className="text-white text-sm">{reviewingReport.fileName}</span>
                  <span className="text-gray-500 text-xs">({formatFileSize(reviewingReport.fileSize)})</span>
                </div>
                <div className="text-xs text-gray-500">
                  Enviado: {new Date(reviewingReport.submittedAt).toLocaleString('es-CO')}
                </div>
              </div>

              {/* Image Preview */}
              {reviewingReport.fileType.startsWith('image/') && reviewingReport.fileData && (
                <div className="rounded-xl overflow-hidden border border-gray-700">
                  <img src={reviewingReport.fileData} alt={reviewingReport.title} className="w-full" />
                </div>
              )}

              {/* Review Actions */}
              {(reviewingReport.status === 'submitted' || reviewingReport.status === 'under_review') && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                      Comentario de Revisión
                    </label>
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Escribe un comentario (obligatorio para rechazar)..."
                      rows={3}
                      className="w-full px-4 py-2.5 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleReject(reviewingReport)}
                      disabled={!reviewComment.trim()}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      Rechazar
                    </button>
                    <button
                      onClick={() => handleApprove(reviewingReport)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
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
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-red-500/10 border-red-500/30'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    {getStatusIcon(reviewingReport.status)}
                    <span className="text-sm font-medium text-white">
                      {reviewingReport.status === 'approved' ? 'Aprobado' : 'Rechazado'}
                    </span>
                    {reviewingReport.reviewedBy && (
                      <span className="text-xs text-gray-400">por {reviewingReport.reviewedBy}</span>
                    )}
                  </div>
                  {reviewingReport.adminComment && (
                    <p className="text-sm text-gray-300 mt-1">{reviewingReport.adminComment}</p>
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
