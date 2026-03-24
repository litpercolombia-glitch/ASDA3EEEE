// stores/reportUploadStore.ts
// Estado global para el sistema de subida de reportes

import { create } from 'zustand';
import {
  UserReport,
  ReportStatus,
  ReportCategory,
  submitReport,
  updateReportStatus,
  deleteReport,
  resubmitReport,
  getReportsByUser,
  getAllReports,
  getReportStats,
  getComplianceByUser,
  getAllPedidosReports,
  getPedidosMetrics,
  getPedidosRanking,
  getPedidosTrend,
} from '../services/reportUploadService';

interface ReportUploadState {
  // UI State
  isModalOpen: boolean;
  isSubmitting: boolean;
  selectedReport: UserReport | null;
  filterStatus: ReportStatus | 'all';
  filterCategory: ReportCategory | 'all';
  searchQuery: string;

  // Actions - UI
  openModal: () => void;
  closeModal: () => void;
  setSelectedReport: (report: UserReport | null) => void;
  setFilterStatus: (status: ReportStatus | 'all') => void;
  setFilterCategory: (category: ReportCategory | 'all') => void;
  setSearchQuery: (query: string) => void;

  // Actions - CRUD
  submit: (report: Omit<UserReport, 'id' | 'submittedAt' | 'status' | 'version'>) => UserReport;
  updateStatus: (reportId: string, status: ReportStatus, comment?: string, reviewedBy?: string) => UserReport | null;
  remove: (reportId: string) => boolean;
  resubmit: (reportId: string, updates: Partial<Pick<UserReport, 'title' | 'description' | 'fileData' | 'fileName' | 'fileType' | 'fileSize'>>) => UserReport | null;

  // Queries
  getByUser: (userId: string) => UserReport[];
  getAll: () => UserReport[];
  getStats: () => ReturnType<typeof getReportStats>;
  getCompliance: () => ReturnType<typeof getComplianceByUser>;

  // Pedidos Queries
  getAllPedidos: () => ReturnType<typeof getAllPedidosReports>;
  getPedidosMetrics: (filters?: Parameters<typeof getPedidosMetrics>[0]) => ReturnType<typeof getPedidosMetrics>;
  getPedidosRanking: () => ReturnType<typeof getPedidosRanking>;
  getPedidosTrend: (userId?: string, days?: number) => ReturnType<typeof getPedidosTrend>;
}

export const useReportUploadStore = create<ReportUploadState>()((set) => ({
  // Initial state
  isModalOpen: false,
  isSubmitting: false,
  selectedReport: null,
  filterStatus: 'all',
  filterCategory: 'all',
  searchQuery: '',

  // UI Actions
  openModal: () => set({ isModalOpen: true }),
  closeModal: () => set({ isModalOpen: false, isSubmitting: false }),
  setSelectedReport: (report) => set({ selectedReport: report }),
  setFilterStatus: (status) => set({ filterStatus: status }),
  setFilterCategory: (category) => set({ filterCategory: category }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  // CRUD Actions
  submit: (report) => {
    set({ isSubmitting: true });
    const newReport = submitReport(report);
    set({ isSubmitting: false, isModalOpen: false });
    return newReport;
  },

  updateStatus: (reportId, status, comment, reviewedBy) => {
    return updateReportStatus(reportId, status, comment, reviewedBy);
  },

  remove: (reportId) => {
    return deleteReport(reportId);
  },

  resubmit: (reportId, updates) => {
    return resubmitReport(reportId, updates);
  },

  // Queries
  getByUser: (userId) => getReportsByUser(userId),
  getAll: () => getAllReports(),
  getStats: () => getReportStats(),
  getCompliance: () => getComplianceByUser(),

  // Pedidos Queries
  getAllPedidos: () => getAllPedidosReports(),
  getPedidosMetrics: (filters) => getPedidosMetrics(filters),
  getPedidosRanking: () => getPedidosRanking(),
  getPedidosTrend: (userId, days) => getPedidosTrend(userId, days),
}));
