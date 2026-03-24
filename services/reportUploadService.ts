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
  | 'pedidos_report'
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

// ============================================
// TIPOS - MÉTRICAS DE PEDIDOS
// ============================================

export const META_MINUTOS_POR_PEDIDO = 3;

export interface RondaReportData {
  numero: number;
  horaInicio: string;
  horaFin: string;
  duracionMinutos: number;
  pedidosRealizados: number;
  pedidosCancelados: number;
  pedidosAgendados: number;
  tiempoPorPedido: number;
  cumpleMeta: boolean;
}

export interface PedidosResumen {
  totalPedidos: number;
  totalCancelados: number;
  totalAgendados: number;
  totalRondas: number;
  tiempoTotalMinutos: number;
  tiempoPromedioPorPedido: number;
  pedidosPorHora: number;
  tasaCancelacion: number;
  tasaAgendamiento: number;
  pedidosDentroMeta: number;
  pedidosFueraMeta: number;
  porcentajeCumplimiento: number;
  metaDiaria: number;
  cumplimientoMetaDiaria: number;
}

export interface PedidosReportData {
  id: string;
  fecha: string;
  colaboradorId: string;
  colaboradorNombre: string;
  rondas: RondaReportData[];
  resumen: PedidosResumen;
  submittedAt: string;
}

export type SemaforoColor = 'green' | 'yellow' | 'red';

export function getSemaforoColor(tiempoPorPedido: number): SemaforoColor {
  if (tiempoPorPedido <= META_MINUTOS_POR_PEDIDO) return 'green';
  if (tiempoPorPedido <= 4) return 'yellow';
  return 'red';
}

export const SEMAFORO_CONFIG: Record<SemaforoColor, { label: string; color: string; bgColor: string; borderColor: string }> = {
  green: { label: 'En Meta', color: 'text-green-400', bgColor: 'bg-green-500/20', borderColor: 'border-green-500/50' },
  yellow: { label: 'Atención', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20', borderColor: 'border-yellow-500/50' },
  red: { label: 'Fuera de Meta', color: 'text-red-400', bgColor: 'bg-red-500/20', borderColor: 'border-red-500/50' },
};

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
  pedidos_report: { label: 'Reporte de Pedidos', icon: 'Package', color: 'orange' },
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

// ============================================
// SHAREABLE UPLOAD LINKS
// ============================================

export interface ShareableUploadLink {
  id: string;
  token: string;
  name: string;
  description: string;
  category: ReportCategory | 'any';
  createdBy: string;
  createdByName: string;
  createdAt: string;
  expiresAt: string | null;
  maxUploads: number | null;
  currentUploads: number;
  isActive: boolean;
  requiresName: boolean;
  requiresEmail: boolean;
}

const LINKS_STORAGE_KEY = 'litper_upload_links';

function loadLinks(): ShareableUploadLink[] {
  try {
    const data = localStorage.getItem(LINKS_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveLinks(links: ShareableUploadLink[]): void {
  localStorage.setItem(LINKS_STORAGE_KEY, JSON.stringify(links));
}

function generateToken(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let token = '';
  for (let i = 0; i < 12; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

export function createUploadLink(
  config: Omit<ShareableUploadLink, 'id' | 'token' | 'createdAt' | 'currentUploads'>
): ShareableUploadLink {
  const links = loadLinks();
  const newLink: ShareableUploadLink = {
    ...config,
    id: uuidv4(),
    token: generateToken(),
    createdAt: new Date().toISOString(),
    currentUploads: 0,
  };
  links.unshift(newLink);
  saveLinks(links);
  return newLink;
}

export function getUploadLinks(): ShareableUploadLink[] {
  return loadLinks();
}

export function getUploadLinkByToken(token: string): ShareableUploadLink | null {
  const link = loadLinks().find(l => l.token === token);
  if (!link) return null;
  if (!link.isActive) return null;
  if (link.expiresAt && new Date(link.expiresAt) < new Date()) return null;
  if (link.maxUploads !== null && link.currentUploads >= link.maxUploads) return null;
  return link;
}

export function incrementLinkUploads(token: string): void {
  const links = loadLinks();
  const index = links.findIndex(l => l.token === token);
  if (index !== -1) {
    links[index].currentUploads++;
    saveLinks(links);
  }
}

export function toggleUploadLink(id: string): void {
  const links = loadLinks();
  const index = links.findIndex(l => l.id === id);
  if (index !== -1) {
    links[index].isActive = !links[index].isActive;
    saveLinks(links);
  }
}

export function deleteUploadLink(id: string): boolean {
  const links = loadLinks();
  const filtered = links.filter(l => l.id !== id);
  if (filtered.length === links.length) return false;
  saveLinks(filtered);
  return true;
}

export function buildShareableUrl(token: string): string {
  const base = window.location.origin + window.location.pathname;
  return `${base}?upload=${token}`;
}

export function getTokenFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get('upload');
}

// ============================================
// PEDIDOS REPORTS - STORAGE & CRUD
// ============================================

const PEDIDOS_STORAGE_KEY = 'litper_pedidos_reports';

function loadPedidosReports(): PedidosReportData[] {
  try {
    const data = localStorage.getItem(PEDIDOS_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function savePedidosReports(reports: PedidosReportData[]): void {
  localStorage.setItem(PEDIDOS_STORAGE_KEY, JSON.stringify(reports));
}

export function calcularResumenPedidos(rondas: RondaReportData[], metaDiaria: number): PedidosResumen {
  const totalPedidos = rondas.reduce((s, r) => s + r.pedidosRealizados, 0);
  const totalCancelados = rondas.reduce((s, r) => s + r.pedidosCancelados, 0);
  const totalAgendados = rondas.reduce((s, r) => s + r.pedidosAgendados, 0);
  const tiempoTotalMinutos = rondas.reduce((s, r) => s + r.duracionMinutos, 0);
  const tiempoPromedioPorPedido = totalPedidos > 0 ? tiempoTotalMinutos / totalPedidos : 0;
  const pedidosPorHora = tiempoTotalMinutos > 0 ? (totalPedidos / tiempoTotalMinutos) * 60 : 0;
  const pedidosDentroMeta = rondas.filter(r => r.cumpleMeta).length;
  const pedidosFueraMeta = rondas.length - pedidosDentroMeta;

  return {
    totalPedidos,
    totalCancelados,
    totalAgendados,
    totalRondas: rondas.length,
    tiempoTotalMinutos,
    tiempoPromedioPorPedido: Math.round(tiempoPromedioPorPedido * 100) / 100,
    pedidosPorHora: Math.round(pedidosPorHora * 10) / 10,
    tasaCancelacion: totalPedidos + totalCancelados > 0
      ? Math.round((totalCancelados / (totalPedidos + totalCancelados)) * 100)
      : 0,
    tasaAgendamiento: totalPedidos > 0
      ? Math.round((totalAgendados / totalPedidos) * 100)
      : 0,
    pedidosDentroMeta,
    pedidosFueraMeta,
    porcentajeCumplimiento: rondas.length > 0
      ? Math.round((pedidosDentroMeta / rondas.length) * 100)
      : 0,
    metaDiaria,
    cumplimientoMetaDiaria: metaDiaria > 0
      ? Math.round((totalPedidos / metaDiaria) * 100)
      : 0,
  };
}

export function calcularTiempoPorPedido(duracionMinutos: number, pedidosRealizados: number): number {
  return pedidosRealizados > 0 ? Math.round((duracionMinutos / pedidosRealizados) * 100) / 100 : 0;
}

export function crearRondaData(
  numero: number,
  duracionMinutos: number,
  pedidosRealizados: number,
  pedidosCancelados: number,
  pedidosAgendados: number,
  horaInicio?: string,
  horaFin?: string
): RondaReportData {
  const tiempoPorPedido = calcularTiempoPorPedido(duracionMinutos, pedidosRealizados);
  return {
    numero,
    horaInicio: horaInicio || '',
    horaFin: horaFin || '',
    duracionMinutos,
    pedidosRealizados,
    pedidosCancelados,
    pedidosAgendados,
    tiempoPorPedido,
    cumpleMeta: tiempoPorPedido <= META_MINUTOS_POR_PEDIDO && pedidosRealizados > 0,
  };
}

export function submitPedidosReport(data: Omit<PedidosReportData, 'id' | 'submittedAt'>): PedidosReportData {
  const reports = loadPedidosReports();
  const newReport: PedidosReportData = {
    ...data,
    id: uuidv4(),
    submittedAt: new Date().toISOString(),
  };
  reports.unshift(newReport);
  savePedidosReports(reports);
  return newReport;
}

export function getAllPedidosReports(): PedidosReportData[] {
  return loadPedidosReports();
}

export function getPedidosReportsByUser(userId: string): PedidosReportData[] {
  return loadPedidosReports().filter(r => r.colaboradorId === userId);
}

export function getPedidosMetrics(filters?: { fecha?: string; userId?: string; days?: number }) {
  let reports = loadPedidosReports();

  if (filters?.userId) {
    reports = reports.filter(r => r.colaboradorId === filters.userId);
  }
  if (filters?.fecha) {
    reports = reports.filter(r => r.fecha === filters.fecha);
  }
  if (filters?.days) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - filters.days);
    reports = reports.filter(r => new Date(r.fecha) >= cutoff);
  }

  const allRondas = reports.flatMap(r => r.rondas);
  const totalPedidos = allRondas.reduce((s, r) => s + r.pedidosRealizados, 0);
  const totalCancelados = allRondas.reduce((s, r) => s + r.pedidosCancelados, 0);
  const totalAgendados = allRondas.reduce((s, r) => s + r.pedidosAgendados, 0);
  const tiempoTotal = allRondas.reduce((s, r) => s + r.duracionMinutos, 0);
  const rondasEnMeta = allRondas.filter(r => r.cumpleMeta).length;

  return {
    totalReportes: reports.length,
    totalPedidos,
    totalCancelados,
    totalAgendados,
    totalRondas: allRondas.length,
    tiempoPromedioPorPedido: totalPedidos > 0 ? Math.round((tiempoTotal / totalPedidos) * 100) / 100 : 0,
    pedidosPorHora: tiempoTotal > 0 ? Math.round(((totalPedidos / tiempoTotal) * 60) * 10) / 10 : 0,
    tasaCancelacion: totalPedidos + totalCancelados > 0
      ? Math.round((totalCancelados / (totalPedidos + totalCancelados)) * 100) : 0,
    porcentajeCumplimientoMeta: allRondas.length > 0
      ? Math.round((rondasEnMeta / allRondas.length) * 100) : 0,
    colaboradoresUnicos: new Set(reports.map(r => r.colaboradorId)).size,
  };
}

export function getPedidosRanking(): Array<{
  colaboradorId: string;
  colaboradorNombre: string;
  totalPedidos: number;
  tiempoPromedio: number;
  semaforoColor: SemaforoColor;
  tasaCancelacion: number;
  totalReportes: number;
  ultimoReporte: string | null;
  streak: number;
}> {
  const reports = loadPedidosReports();
  const userMap = new Map<string, PedidosReportData[]>();

  reports.forEach(r => {
    const arr = userMap.get(r.colaboradorId) || [];
    arr.push(r);
    userMap.set(r.colaboradorId, arr);
  });

  return Array.from(userMap.entries()).map(([colaboradorId, userReports]) => {
    const allRondas = userReports.flatMap(r => r.rondas);
    const totalPedidos = allRondas.reduce((s, r) => s + r.pedidosRealizados, 0);
    const totalCancelados = allRondas.reduce((s, r) => s + r.pedidosCancelados, 0);
    const tiempoTotal = allRondas.reduce((s, r) => s + r.duracionMinutos, 0);
    const tiempoPromedio = totalPedidos > 0 ? tiempoTotal / totalPedidos : 0;

    // Calculate streak: consecutive days meeting the goal
    const sortedDates = [...new Set(userReports.map(r => r.fecha))].sort().reverse();
    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    for (let i = 0; i < sortedDates.length; i++) {
      const dateReports = userReports.filter(r => r.fecha === sortedDates[i]);
      const dayRondas = dateReports.flatMap(r => r.rondas);
      const dayPedidos = dayRondas.reduce((s, r) => s + r.pedidosRealizados, 0);
      const dayTiempo = dayRondas.reduce((s, r) => s + r.duracionMinutos, 0);
      const dayPromedio = dayPedidos > 0 ? dayTiempo / dayPedidos : 999;

      if (dayPromedio <= META_MINUTOS_POR_PEDIDO && dayPedidos > 0) {
        streak++;
      } else {
        break;
      }

      // Check consecutive days
      if (i < sortedDates.length - 1) {
        const current = new Date(sortedDates[i]);
        const next = new Date(sortedDates[i + 1]);
        const diffDays = (current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays > 1) break;
      }
    }

    return {
      colaboradorId,
      colaboradorNombre: userReports[0]?.colaboradorNombre || 'Sin nombre',
      totalPedidos,
      tiempoPromedio: Math.round(tiempoPromedio * 100) / 100,
      semaforoColor: getSemaforoColor(tiempoPromedio),
      tasaCancelacion: totalPedidos + totalCancelados > 0
        ? Math.round((totalCancelados / (totalPedidos + totalCancelados)) * 100) : 0,
      totalReportes: userReports.length,
      ultimoReporte: userReports.sort((a, b) =>
        new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      )[0]?.submittedAt || null,
      streak,
    };
  }).sort((a, b) => a.tiempoPromedio - b.tiempoPromedio);
}

export function getPedidosTrend(userId?: string, days: number = 30): Array<{
  fecha: string;
  totalPedidos: number;
  tiempoPromedio: number;
  cumpleMeta: boolean;
}> {
  let reports = loadPedidosReports();
  if (userId) {
    reports = reports.filter(r => r.colaboradorId === userId);
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  reports = reports.filter(r => new Date(r.fecha) >= cutoff);

  const byDate = new Map<string, PedidosReportData[]>();
  reports.forEach(r => {
    const arr = byDate.get(r.fecha) || [];
    arr.push(r);
    byDate.set(r.fecha, arr);
  });

  return Array.from(byDate.entries())
    .map(([fecha, dateReports]) => {
      const allRondas = dateReports.flatMap(r => r.rondas);
      const totalPedidos = allRondas.reduce((s, r) => s + r.pedidosRealizados, 0);
      const tiempoTotal = allRondas.reduce((s, r) => s + r.duracionMinutos, 0);
      const tiempoPromedio = totalPedidos > 0 ? tiempoTotal / totalPedidos : 0;

      return {
        fecha,
        totalPedidos,
        tiempoPromedio: Math.round(tiempoPromedio * 100) / 100,
        cumpleMeta: tiempoPromedio <= META_MINUTOS_POR_PEDIDO && totalPedidos > 0,
      };
    })
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
}
