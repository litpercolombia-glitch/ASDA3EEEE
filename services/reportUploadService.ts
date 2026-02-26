// services/reportUploadService.ts
// Servicio de Subida de Reportes por Persona - LITPER PRO

import { v4 as uuidv4 } from 'uuid';

// ============================================
// TIPOS E INTERFACES
// ============================================

export type ReportCategory =
  | 'daily_operations'
  | 'weekly_summary'
  | 'incident_report'
  | 'delivery_report'
  | 'financial_report'
  | 'custom';

export type ReportStatus = 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected';

export interface UserReport {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  title: string;
  description: string;
  category: ReportCategory;
  period: { start: string; end: string };
  fileData: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  status: ReportStatus;
  adminComment?: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  version: number;
  previousVersionId?: string;
  tags: string[];
}

export interface ReportDeadline {
  id: string;
  category: ReportCategory;
  name: string;
  dueDate: string;
  isRecurring: boolean;
  frequency?: 'daily' | 'weekly' | 'monthly';
}

export const REPORT_CATEGORIES: Record<ReportCategory, { label: string; icon: string; color: string }> = {
  daily_operations: { label: 'Operaciones Diarias', icon: 'ClipboardList', color: 'blue' },
  weekly_summary: { label: 'Resumen Semanal', icon: 'Calendar', color: 'purple' },
  incident_report: { label: 'Reporte de Incidencias', icon: 'AlertTriangle', color: 'red' },
  delivery_report: { label: 'Reporte de Entregas', icon: 'Truck', color: 'green' },
  financial_report: { label: 'Reporte Financiero', icon: 'DollarSign', color: 'amber' },
  custom: { label: 'Personalizado', icon: 'FileText', color: 'gray' },
};

export const STATUS_CONFIG: Record<ReportStatus, { label: string; color: string; bgColor: string }> = {
  draft: { label: 'Borrador', color: 'text-gray-400', bgColor: 'bg-gray-500/20' },
  submitted: { label: 'Enviado', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  under_review: { label: 'En Revisión', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
  approved: { label: 'Aprobado', color: 'text-green-400', bgColor: 'bg-green-500/20' },
  rejected: { label: 'Rechazado', color: 'text-red-400', bgColor: 'bg-red-500/20' },
};

// ============================================
// STORAGE HELPERS
// ============================================

const STORAGE_KEY = 'litper_user_reports';
const DEADLINES_KEY = 'litper_report_deadlines';

function loadReports(): UserReport[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveReports(reports: UserReport[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
}

function loadDeadlines(): ReportDeadline[] {
  try {
    const data = localStorage.getItem(DEADLINES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveDeadlines(deadlines: ReportDeadline[]): void {
  localStorage.setItem(DEADLINES_KEY, JSON.stringify(deadlines));
}

// ============================================
// CRUD OPERATIONS
// ============================================

export function submitReport(
  report: Omit<UserReport, 'id' | 'submittedAt' | 'status' | 'version'>
): UserReport {
  const reports = loadReports();
  const newReport: UserReport = {
    ...report,
    id: uuidv4(),
    status: 'submitted',
    submittedAt: new Date().toISOString(),
    version: 1,
  };
  reports.unshift(newReport);
  saveReports(reports);
  return newReport;
}

export function updateReportStatus(
  reportId: string,
  status: ReportStatus,
  adminComment?: string,
  reviewedBy?: string
): UserReport | null {
  const reports = loadReports();
  const index = reports.findIndex(r => r.id === reportId);
  if (index === -1) return null;

  reports[index] = {
    ...reports[index],
    status,
    adminComment: adminComment || reports[index].adminComment,
    reviewedAt: new Date().toISOString(),
    reviewedBy: reviewedBy || reports[index].reviewedBy,
  };
  saveReports(reports);
  return reports[index];
}

export function deleteReport(reportId: string): boolean {
  const reports = loadReports();
  const filtered = reports.filter(r => r.id !== reportId);
  if (filtered.length === reports.length) return false;
  saveReports(filtered);
  return true;
}

export function resubmitReport(
  reportId: string,
  updates: Partial<Pick<UserReport, 'title' | 'description' | 'fileData' | 'fileName' | 'fileType' | 'fileSize'>>
): UserReport | null {
  const reports = loadReports();
  const index = reports.findIndex(r => r.id === reportId);
  if (index === -1) return null;

  reports[index] = {
    ...reports[index],
    ...updates,
    status: 'submitted',
    version: reports[index].version + 1,
    submittedAt: new Date().toISOString(),
    adminComment: undefined,
    reviewedAt: undefined,
    reviewedBy: undefined,
  };
  saveReports(reports);
  return reports[index];
}

// ============================================
// QUERIES
// ============================================

export function getReportsByUser(userId: string): UserReport[] {
  return loadReports().filter(r => r.userId === userId);
}

export function getAllReports(): UserReport[] {
  return loadReports();
}

export function getReportById(reportId: string): UserReport | null {
  return loadReports().find(r => r.id === reportId) || null;
}

export function getReportStats() {
  const reports = loadReports();
  const now = new Date();
  const thisMonth = reports.filter(r => {
    const d = new Date(r.submittedAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const byStatus: Record<ReportStatus, number> = {
    draft: 0,
    submitted: 0,
    under_review: 0,
    approved: 0,
    rejected: 0,
  };
  reports.forEach(r => { byStatus[r.status]++; });

  const uniqueUsers = new Set(reports.map(r => r.userId));
  const usersWithReportsThisMonth = new Set(thisMonth.map(r => r.userId));

  return {
    total: reports.length,
    thisMonth: thisMonth.length,
    byStatus,
    uniqueUsers: uniqueUsers.size,
    complianceRate: uniqueUsers.size > 0
      ? Math.round((usersWithReportsThisMonth.size / uniqueUsers.size) * 100)
      : 0,
    pendingReview: byStatus.submitted + byStatus.under_review,
  };
}

export function getComplianceByUser(): Array<{
  userId: string;
  userName: string;
  totalReports: number;
  thisMonth: number;
  lastSubmission: string | null;
  approvedRate: number;
}> {
  const reports = loadReports();
  const now = new Date();
  const userMap = new Map<string, UserReport[]>();

  reports.forEach(r => {
    const arr = userMap.get(r.userId) || [];
    arr.push(r);
    userMap.set(r.userId, arr);
  });

  return Array.from(userMap.entries()).map(([userId, userReports]) => {
    const thisMonth = userReports.filter(r => {
      const d = new Date(r.submittedAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const approved = userReports.filter(r => r.status === 'approved').length;
    const sorted = [...userReports].sort((a, b) =>
      new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );

    return {
      userId,
      userName: userReports[0]?.userName || 'Sin nombre',
      totalReports: userReports.length,
      thisMonth: thisMonth.length,
      lastSubmission: sorted[0]?.submittedAt || null,
      approvedRate: userReports.length > 0 ? Math.round((approved / userReports.length) * 100) : 0,
    };
  });
}

// ============================================
// DEADLINES
// ============================================

export function getDeadlines(): ReportDeadline[] {
  return loadDeadlines();
}

export function addDeadline(deadline: Omit<ReportDeadline, 'id'>): ReportDeadline {
  const deadlines = loadDeadlines();
  const newDeadline: ReportDeadline = { ...deadline, id: uuidv4() };
  deadlines.push(newDeadline);
  saveDeadlines(deadlines);
  return newDeadline;
}

export function deleteDeadline(id: string): boolean {
  const deadlines = loadDeadlines();
  const filtered = deadlines.filter(d => d.id !== id);
  if (filtered.length === deadlines.length) return false;
  saveDeadlines(filtered);
  return true;
}

// ============================================
// FILE HELPERS
// ============================================

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export const ACCEPTED_FILE_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'image/png',
  'image/jpeg',
  'image/webp',
  'text/plain',
  'text/csv',
];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function validateFile(file: File): { valid: boolean; error?: string } {
  if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
    return { valid: false, error: 'Tipo de archivo no soportado. Use PDF, Excel, imágenes o texto.' };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'El archivo excede el límite de 10MB.' };
  }
  return { valid: true };
}
