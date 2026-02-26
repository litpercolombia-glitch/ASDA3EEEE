// services/rondaReportBridgeService.ts
// Servicio puente: conecta Análisis de Rondas con Subida de Reportes
// Permite vincular reportes/evidencia de operadores con sus métricas de rondas

import { v4 as uuidv4 } from 'uuid';

// ============================================
// TIPOS
// ============================================

export type EvidenceType = 'photo' | 'document' | 'note';
export type ClosureStatus = 'pending' | 'submitted' | 'reviewed' | 'flagged';

export interface RondaEvidence {
  id: string;
  type: EvidenceType;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  fileData?: string; // base64
  note?: string;
  category: 'novedad' | 'cancelacion' | 'incidencia' | 'general';
  timestamp: string;
}

export interface RondaClosureChecklist {
  vehicleOk: boolean;
  documentsDelivered: boolean;
  cashCollected: boolean;
  devolutionsReturned: boolean;
  novedadesReported: boolean;
  equipmentReturned: boolean;
}

export interface RondaClosure {
  id: string;
  operatorId: string;
  operatorName: string;
  date: string;
  linkToken?: string; // si fue por link compartido

  // Datos auto-reportados por el operador
  selfReportedGuias: number;
  selfReportedRealizadas: number;
  selfReportedCanceladas: number;
  selfReportedNovedades: number;
  selfReportedPendientes: number;

  // Explicaciones obligatorias (según anomalías)
  explanationCancelaciones?: string;
  explanationNovedades?: string;
  explanationBajoRendimiento?: string;

  // Evidencia adjunta
  evidence: RondaEvidence[];

  // Checklist de cierre
  checklist: RondaClosureChecklist;

  // Comentario general
  generalComment: string;

  // Estado
  status: ClosureStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  adminNotes?: string;

  // Métricas calculadas del CSV (si disponibles, se cruzan)
  csvMetrics?: {
    tasaExito: number;
    eficiencia: number;
    guiasRealizadas: number;
    totalRondas: number;
  };

  // Discrepancias detectadas automáticamente
  discrepancies: Discrepancy[];
}

export interface Discrepancy {
  id: string;
  field: string;
  selfReported: number;
  csvValue: number;
  difference: number;
  severity: 'low' | 'medium' | 'high';
  explanation?: string;
}

export interface RondaClosureLink {
  id: string;
  token: string;
  name: string;
  description: string;
  operatorId: string | 'any'; // específico o cualquiera
  operatorName: string;
  date: string; // fecha de la ronda
  createdBy: string;
  createdByName: string;
  createdAt: string;
  expiresAt: string | null;
  isActive: boolean;
  usedAt?: string;

  // Requerimientos basados en anomalías
  requireExplanationCancelaciones: boolean;
  requireExplanationNovedades: boolean;
  requireExplanationRendimiento: boolean;
  requirePhotos: boolean;
  minPhotos: number;
}

export interface OperatorTimeline {
  operatorId: string;
  operatorName: string;
  entries: TimelineEntry[];
}

export interface TimelineEntry {
  id: string;
  date: string;
  type: 'closure' | 'csv_upload' | 'alert' | 'report' | 'review';
  title: string;
  description: string;
  icon: string;
  color: string;
  data?: RondaClosure | null;
  hasDiscrepancies?: boolean;
  discrepancyCount?: number;
}

// ============================================
// STORAGE
// ============================================

const CLOSURES_KEY = 'litper_ronda_closures';
const CLOSURE_LINKS_KEY = 'litper_ronda_closure_links';

function loadClosures(): RondaClosure[] {
  try {
    const data = localStorage.getItem(CLOSURES_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

function saveClosures(closures: RondaClosure[]): void {
  localStorage.setItem(CLOSURES_KEY, JSON.stringify(closures));
}

function loadClosureLinks(): RondaClosureLink[] {
  try {
    const data = localStorage.getItem(CLOSURE_LINKS_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

function saveClosureLinks(links: RondaClosureLink[]): void {
  localStorage.setItem(CLOSURE_LINKS_KEY, JSON.stringify(links));
}

function generateToken(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let token = 'RC-';
  for (let i = 0; i < 10; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// ============================================
// CLOSURE LINKS (para compartir con operadores)
// ============================================

export function createClosureLink(
  config: Omit<RondaClosureLink, 'id' | 'token' | 'createdAt'>
): RondaClosureLink {
  const links = loadClosureLinks();
  const newLink: RondaClosureLink = {
    ...config,
    id: uuidv4(),
    token: generateToken(),
    createdAt: new Date().toISOString(),
  };
  links.unshift(newLink);
  saveClosureLinks(links);
  return newLink;
}

export function getClosureLinks(): RondaClosureLink[] {
  return loadClosureLinks();
}

export function getClosureLinkByToken(token: string): RondaClosureLink | null {
  const link = loadClosureLinks().find(l => l.token === token);
  if (!link) return null;
  if (!link.isActive) return null;
  if (link.expiresAt && new Date(link.expiresAt) < new Date()) return null;
  if (link.usedAt) return null; // ya fue usado
  return link;
}

export function markClosureLinkUsed(token: string): void {
  const links = loadClosureLinks();
  const idx = links.findIndex(l => l.token === token);
  if (idx !== -1) {
    links[idx].usedAt = new Date().toISOString();
    saveClosureLinks(links);
  }
}

export function toggleClosureLink(id: string): void {
  const links = loadClosureLinks();
  const idx = links.findIndex(l => l.id === id);
  if (idx !== -1) {
    links[idx].isActive = !links[idx].isActive;
    saveClosureLinks(links);
  }
}

export function deleteClosureLink(id: string): boolean {
  const links = loadClosureLinks();
  const filtered = links.filter(l => l.id !== id);
  if (filtered.length === links.length) return false;
  saveClosureLinks(filtered);
  return true;
}

export function buildClosureUrl(token: string): string {
  const base = window.location.origin + window.location.pathname;
  return `${base}?ronda=${token}`;
}

export function getClosureTokenFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get('ronda');
}

// ============================================
// CLOSURES (cierres de ronda)
// ============================================

export function submitClosure(
  closure: Omit<RondaClosure, 'id' | 'submittedAt' | 'status' | 'discrepancies'>
): RondaClosure {
  const closures = loadClosures();
  const newClosure: RondaClosure = {
    ...closure,
    id: uuidv4(),
    status: 'submitted',
    submittedAt: new Date().toISOString(),
    discrepancies: [],
  };

  // Auto-detectar discrepancias si hay métricas del CSV
  if (newClosure.csvMetrics) {
    newClosure.discrepancies = detectDiscrepancies(newClosure);
  }

  closures.unshift(newClosure);
  saveClosures(closures);
  return newClosure;
}

export function getClosures(): RondaClosure[] {
  return loadClosures();
}

export function getClosuresByOperator(operatorId: string): RondaClosure[] {
  return loadClosures().filter(c =>
    c.operatorId.toUpperCase() === operatorId.toUpperCase() ||
    c.operatorName.toUpperCase() === operatorId.toUpperCase()
  );
}

export function getClosuresByDate(date: string): RondaClosure[] {
  return loadClosures().filter(c => c.date === date);
}

export function reviewClosure(
  closureId: string,
  status: 'reviewed' | 'flagged',
  adminNotes: string,
  reviewedBy: string
): RondaClosure | null {
  const closures = loadClosures();
  const idx = closures.findIndex(c => c.id === closureId);
  if (idx === -1) return null;

  closures[idx] = {
    ...closures[idx],
    status,
    adminNotes,
    reviewedBy,
    reviewedAt: new Date().toISOString(),
  };
  saveClosures(closures);
  return closures[idx];
}

// Vincular métricas del CSV a un cierre existente
export function linkCsvMetrics(
  closureId: string,
  metrics: RondaClosure['csvMetrics']
): RondaClosure | null {
  const closures = loadClosures();
  const idx = closures.findIndex(c => c.id === closureId);
  if (idx === -1) return null;

  closures[idx].csvMetrics = metrics;
  closures[idx].discrepancies = detectDiscrepancies(closures[idx]);
  saveClosures(closures);
  return closures[idx];
}

// ============================================
// DETECCIÓN DE DISCREPANCIAS
// ============================================

function detectDiscrepancies(closure: RondaClosure): Discrepancy[] {
  const discs: Discrepancy[] = [];
  if (!closure.csvMetrics) return discs;

  const csv = closure.csvMetrics;

  // Guías realizadas: operador vs CSV
  if (closure.selfReportedRealizadas > 0 && csv.guiasRealizadas > 0) {
    const diff = Math.abs(closure.selfReportedRealizadas - csv.guiasRealizadas);
    if (diff > 0) {
      discs.push({
        id: uuidv4(),
        field: 'Guías Realizadas',
        selfReported: closure.selfReportedRealizadas,
        csvValue: csv.guiasRealizadas,
        difference: diff,
        severity: diff > 5 ? 'high' : diff > 2 ? 'medium' : 'low',
      });
    }
  }

  return discs;
}

// ============================================
// DETERMINACIÓN DE REQUERIMIENTOS POR ANOMALÍAS
// ============================================

export function getRequiredEvidence(
  operatorMetrics?: { tasaExito: number; novedades: number; canceladas: number; guiasIniciales: number }
): {
  requireExplanationCancelaciones: boolean;
  requireExplanationNovedades: boolean;
  requireExplanationRendimiento: boolean;
  requirePhotos: boolean;
  minPhotos: number;
  reasons: string[];
} {
  const result = {
    requireExplanationCancelaciones: false,
    requireExplanationNovedades: false,
    requireExplanationRendimiento: false,
    requirePhotos: false,
    minPhotos: 0,
    reasons: [] as string[],
  };

  if (!operatorMetrics) return result;

  // Tasa de éxito < 70% → pedir explicación de bajo rendimiento
  if (operatorMetrics.tasaExito < 70) {
    result.requireExplanationRendimiento = true;
    result.reasons.push(`Tasa de éxito baja (${operatorMetrics.tasaExito.toFixed(1)}%)`);
  }

  // Novedades > 5% → pedir fotos obligatorias
  const novedadRate = operatorMetrics.guiasIniciales > 0
    ? (operatorMetrics.novedades / operatorMetrics.guiasIniciales) * 100
    : 0;
  if (novedadRate > 5) {
    result.requireExplanationNovedades = true;
    result.requirePhotos = true;
    result.minPhotos = Math.min(operatorMetrics.novedades, 3);
    result.reasons.push(`Novedades altas (${novedadRate.toFixed(1)}%)`);
  }

  // Cancelaciones > 3 → pedir explicación
  if (operatorMetrics.canceladas > 3) {
    result.requireExplanationCancelaciones = true;
    result.reasons.push(`${operatorMetrics.canceladas} cancelaciones`);
  }

  return result;
}

// ============================================
// TIMELINE POR OPERADOR (Historial Cruzado)
// ============================================

export function getOperatorTimeline(operatorId: string): TimelineEntry[] {
  const closures = getClosuresByOperator(operatorId);
  const entries: TimelineEntry[] = [];

  // Cierres de ronda
  closures.forEach(c => {
    const hasDisc = c.discrepancies.length > 0;
    entries.push({
      id: c.id,
      date: c.submittedAt,
      type: 'closure',
      title: `Cierre de ronda - ${c.date}`,
      description: `${c.selfReportedRealizadas} guías reportadas, ${c.evidence.length} evidencias`,
      icon: hasDisc ? '⚠️' : '✅',
      color: hasDisc ? 'amber' : 'green',
      data: c,
      hasDiscrepancies: hasDisc,
      discrepancyCount: c.discrepancies.length,
    });

    // Alertas por discrepancias
    c.discrepancies.forEach(d => {
      entries.push({
        id: d.id,
        date: c.submittedAt,
        type: 'alert',
        title: `Discrepancia: ${d.field}`,
        description: `Reportado: ${d.selfReported} vs CSV: ${d.csvValue} (dif: ${d.difference})`,
        icon: d.severity === 'high' ? '🔴' : d.severity === 'medium' ? '🟡' : '🟢',
        color: d.severity === 'high' ? 'red' : d.severity === 'medium' ? 'amber' : 'green',
        data: null,
      });
    });

    // Reviews
    if (c.reviewedAt) {
      entries.push({
        id: `review-${c.id}`,
        date: c.reviewedAt,
        type: 'review',
        title: `Revisado por ${c.reviewedBy || 'Admin'}`,
        description: c.adminNotes || 'Sin comentarios',
        icon: c.status === 'flagged' ? '🚩' : '✔️',
        color: c.status === 'flagged' ? 'red' : 'blue',
        data: null,
      });
    }
  });

  // Ordenar por fecha desc
  entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return entries;
}

// ============================================
// ESTADÍSTICAS DE CIERRES
// ============================================

export function getClosureStats() {
  const closures = loadClosures();
  const now = new Date();
  const thisMonth = closures.filter(c => {
    const d = new Date(c.submittedAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const pending = closures.filter(c => c.status === 'submitted').length;
  const reviewed = closures.filter(c => c.status === 'reviewed').length;
  const flagged = closures.filter(c => c.status === 'flagged').length;
  const withDiscrepancies = closures.filter(c => c.discrepancies.length > 0).length;
  const withEvidence = closures.filter(c => c.evidence.length > 0).length;

  const uniqueOperators = new Set(closures.map(c => c.operatorName));

  return {
    total: closures.length,
    thisMonth: thisMonth.length,
    pending,
    reviewed,
    flagged,
    withDiscrepancies,
    withEvidence,
    uniqueOperators: uniqueOperators.size,
    complianceRate: uniqueOperators.size > 0
      ? Math.round((new Set(thisMonth.map(c => c.operatorName)).size / uniqueOperators.size) * 100)
      : 0,
  };
}
