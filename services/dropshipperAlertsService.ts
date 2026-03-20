// services/dropshipperAlertsService.ts
// Motor de Alertas Inteligentes para Dropshippers
// Detecta problemas → genera alerta → envia via Chatea Pro

import { useDropshippingStore } from './dropshippingService';
import type { CODAnalyticsPorCiudad, ProductScorecard } from '../types/dropshipping';

// ============================================
// TYPES
// ============================================

export type AlertSeverity = 'critical' | 'warning' | 'info' | 'success';
export type AlertCategory =
  | 'rechazo_alto'
  | 'ciudad_roja'
  | 'producto_perdedor'
  | 'margen_bajo'
  | 'proveedor_lento'
  | 'roas_bajo'
  | 'meta_alcanzada'
  | 'tendencia_positiva';

export interface DropshipperAlert {
  id: string;
  category: AlertCategory;
  severity: AlertSeverity;
  title: string;
  message: string;
  detail?: string;
  data?: Record<string, any>;
  actionLabel?: string;
  actionView?: string; // Navigate to this view
  createdAt: string;
  read: boolean;
  sentViaWhatsApp: boolean;
}

export interface AlertRule {
  id: string;
  name: string;
  category: AlertCategory;
  enabled: boolean;
  condition: (context: AlertContext) => boolean;
  generateAlert: (context: AlertContext) => Omit<DropshipperAlert, 'id' | 'createdAt' | 'read' | 'sentViaWhatsApp'>;
  whatsappTemplate?: (context: AlertContext) => string;
}

interface AlertContext {
  resumen: ReturnType<ReturnType<typeof useDropshippingStore.getState>['getResumenMensual']>;
  ciudades: CODAnalyticsPorCiudad[];
  productos: ReturnType<ReturnType<typeof useDropshippingStore.getState>['getAnalyticsPorProducto']>;
  scorecards: ProductScorecard[];
  suppliers: ReturnType<ReturnType<typeof useDropshippingStore.getState>['getSupplierScores']>;
}

// ============================================
// DEFAULT RULES
// ============================================

const DEFAULT_RULES: AlertRule[] = [
  {
    id: 'rechazo_general_alto',
    name: 'Tasa de rechazo general alta',
    category: 'rechazo_alto',
    enabled: true,
    condition: (ctx) => ctx.resumen.tasaRechazoGeneral > 20 && ctx.resumen.totalPedidos >= 10,
    generateAlert: (ctx) => ({
      category: 'rechazo_alto',
      severity: ctx.resumen.tasaRechazoGeneral > 30 ? 'critical' : 'warning',
      title: `Tasa de rechazo en ${ctx.resumen.tasaRechazoGeneral.toFixed(1)}%`,
      message: `${ctx.resumen.rechazados} de ${ctx.resumen.totalPedidos} pedidos fueron rechazados este mes. Esto te cuesta ${formatCOP(ctx.resumen.dineroQuemadoEnRechazos)} en envios perdidos.`,
      actionLabel: 'Ver Analytics COD',
      actionView: 'cod_analytics',
    }),
    whatsappTemplate: (ctx) =>
      `🚨 *ALERTA RECHAZOS*\n\nTu tasa de rechazo esta en *${ctx.resumen.tasaRechazoGeneral.toFixed(1)}%*\n${ctx.resumen.rechazados} pedidos rechazados de ${ctx.resumen.totalPedidos}\nDinero quemado: *${formatCOP(ctx.resumen.dineroQuemadoEnRechazos)}*\n\n💡 Revisa las ciudades con mas rechazo y considera pausar envios a zonas rojas.`,
  },
  {
    id: 'ciudad_roja',
    name: 'Ciudad con tasa de rechazo critica',
    category: 'ciudad_roja',
    enabled: true,
    condition: (ctx) => ctx.ciudades.some((c) => c.recomendacion === 'rojo' && c.totalPedidos >= 5),
    generateAlert: (ctx) => {
      const rojas = ctx.ciudades.filter((c) => c.recomendacion === 'rojo' && c.totalPedidos >= 5);
      const peor = rojas.sort((a, b) => b.tasaRechazo - a.tasaRechazo)[0];
      return {
        category: 'ciudad_roja',
        severity: 'critical',
        title: `${rojas.length} ciudad(es) en ROJO`,
        message: `${peor.ciudad} tiene ${peor.tasaRechazo.toFixed(1)}% de rechazo (${peor.rechazados}/${peor.totalPedidos}). Perdida: ${formatCOP(peor.perdidaPorRechazos)}.`,
        detail: rojas.map((c) => `${c.ciudad}: ${c.tasaRechazo.toFixed(1)}% rechazo`).join(', '),
        actionLabel: 'Ver Ciudades',
        actionView: 'cod_analytics',
      };
    },
    whatsappTemplate: (ctx) => {
      const rojas = ctx.ciudades.filter((c) => c.recomendacion === 'rojo' && c.totalPedidos >= 5);
      return `🔴 *CIUDADES EN ROJO*\n\n${rojas.map((c) => `• ${c.ciudad}: ${c.tasaRechazo.toFixed(1)}% rechazo (${c.rechazados} de ${c.totalPedidos})`).join('\n')}\n\n💡 Considera confirmar pedidos por WhatsApp antes de enviar a estas ciudades o pausar ads para estas zonas.`;
    },
  },
  {
    id: 'producto_perdedor',
    name: 'Producto perdiendo dinero',
    category: 'producto_perdedor',
    enabled: true,
    condition: (ctx) => ctx.scorecards.some((s) => s.categoria === 'perdedor' && s.totalPedidos >= 5),
    generateAlert: (ctx) => {
      const perdedores = ctx.scorecards.filter((s) => s.categoria === 'perdedor' && s.totalPedidos >= 5);
      return {
        category: 'producto_perdedor',
        severity: 'warning',
        title: `${perdedores.length} producto(s) perdiendo dinero`,
        message: `${perdedores.map((p) => p.productoNombre).join(', ')} tienen margen negativo. Total perdido: ${formatCOP(perdedores.reduce((s, p) => s + Math.abs(p.utilidadTotalGenerada), 0))}.`,
        actionLabel: 'Ver Scorecard',
        actionView: 'product_scorecard',
      };
    },
    whatsappTemplate: (ctx) => {
      const perdedores = ctx.scorecards.filter((s) => s.categoria === 'perdedor' && s.totalPedidos >= 5);
      return `⚠️ *PRODUCTOS EN ROJO*\n\n${perdedores.map((p) => `• ${p.productoNombre}: margen ${p.margenNetoPromedio.toFixed(1)}%, ${p.tasaEntrega.toFixed(0)}% entrega`).join('\n')}\n\n💡 Reemplaza estos productos o ajusta el precio de venta.`;
    },
  },
  {
    id: 'margen_bajo',
    name: 'Margen neto bajo',
    category: 'margen_bajo',
    enabled: true,
    condition: (ctx) => ctx.resumen.margenNeto < 10 && ctx.resumen.margenNeto > -100 && ctx.resumen.totalPedidos >= 10,
    generateAlert: (ctx) => ({
      category: 'margen_bajo',
      severity: ctx.resumen.margenNeto < 0 ? 'critical' : 'warning',
      title: ctx.resumen.margenNeto < 0 ? 'ESTAS PERDIENDO DINERO' : `Margen neto bajo: ${ctx.resumen.margenNeto.toFixed(1)}%`,
      message: `Tu utilidad neta es ${formatCOP(ctx.resumen.utilidadNeta)} con margen de ${ctx.resumen.margenNeto.toFixed(1)}%. ${ctx.resumen.margenNeto < 0 ? 'Cada venta te cuesta dinero.' : 'Cualquier aumento en rechazos te pone en rojo.'}`,
      actionLabel: 'Ver Calculadora',
      actionView: 'profit_calculator',
    }),
    whatsappTemplate: (ctx) =>
      `${ctx.resumen.margenNeto < 0 ? '🚨' : '⚠️'} *MARGEN ${ctx.resumen.margenNeto < 0 ? 'NEGATIVO' : 'BAJO'}*\n\nUtilidad: ${formatCOP(ctx.resumen.utilidadNeta)}\nMargen: ${ctx.resumen.margenNeto.toFixed(1)}%\nVentas: ${formatCOP(ctx.resumen.ventasBrutas)}\n\n💡 Revisa costos de envio, comisiones, y gasto en publicidad.`,
  },
  {
    id: 'roas_bajo',
    name: 'ROAS bajo',
    category: 'roas_bajo',
    enabled: true,
    condition: (ctx) => ctx.resumen.roas > 0 && ctx.resumen.roas < 2 && ctx.resumen.costoPublicidad > 0,
    generateAlert: (ctx) => ({
      category: 'roas_bajo',
      severity: ctx.resumen.roas < 1 ? 'critical' : 'warning',
      title: `ROAS en ${ctx.resumen.roas.toFixed(1)}x`,
      message: `Por cada $1 en publicidad recuperas $${ctx.resumen.roas.toFixed(2)}. ${ctx.resumen.roas < 1 ? 'Estas perdiendo dinero en ads.' : 'Meta minima: 3x.'} Gasto: ${formatCOP(ctx.resumen.costoPublicidad)}.`,
      actionLabel: 'Ver Analytics',
      actionView: 'cod_analytics',
    }),
    whatsappTemplate: (ctx) =>
      `📉 *ROAS BAJO: ${ctx.resumen.roas.toFixed(1)}x*\n\nGasto en ads: ${formatCOP(ctx.resumen.costoPublicidad)}\nVentas generadas: ${formatCOP(ctx.resumen.ventasBrutas)}\n\n💡 Optimiza tus campanas o pausa las de peor rendimiento. Meta: 3x minimo.`,
  },
  {
    id: 'proveedor_lento',
    name: 'Proveedor con bajo cumplimiento',
    category: 'proveedor_lento',
    enabled: true,
    condition: (ctx) => ctx.suppliers.some((s) => s.estado === 'malo' && s.totalPedidos >= 5),
    generateAlert: (ctx) => {
      const malos = ctx.suppliers.filter((s) => s.estado === 'malo' && s.totalPedidos >= 5);
      return {
        category: 'proveedor_lento',
        severity: 'warning',
        title: `${malos.length} proveedor(es) con problemas`,
        message: `${malos.map((s) => `${s.proveedorNombre} (score: ${s.score}, cumplimiento: ${s.tasaCumplimiento.toFixed(0)}%)`).join('. ')}`,
        actionLabel: 'Ver Proveedores',
        actionView: 'supplier_monitor',
      };
    },
  },
  {
    id: 'meta_entrega',
    name: 'Meta de entrega alcanzada',
    category: 'meta_alcanzada',
    enabled: true,
    condition: (ctx) => ctx.resumen.tasaEntregaGeneral >= 80 && ctx.resumen.totalPedidos >= 20,
    generateAlert: (ctx) => ({
      category: 'meta_alcanzada',
      severity: 'success',
      title: `Tasa de entrega: ${ctx.resumen.tasaEntregaGeneral.toFixed(1)}%!`,
      message: `Excelente! ${ctx.resumen.entregados} de ${ctx.resumen.totalPedidos} pedidos entregados. Tu operacion esta saludable.`,
      actionLabel: 'Ver Resumen',
      actionView: 'cod_analytics',
    }),
  },
];

// ============================================
// FORMATTER
// ============================================

function formatCOP(n: number): string {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
}

// ============================================
// ALERT ENGINE
// ============================================

let alertHistory: DropshipperAlert[] = [];
const STORAGE_KEY = 'litper-dropshipper-alerts';

function loadAlerts(): DropshipperAlert[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) alertHistory = JSON.parse(saved);
  } catch { /* ignore */ }
  return alertHistory;
}

function saveAlerts(): void {
  try {
    // Keep last 100 alerts
    alertHistory = alertHistory.slice(-100);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(alertHistory));
  } catch { /* ignore */ }
}

/**
 * Run all alert rules and generate alerts
 */
export function evaluateAlerts(): DropshipperAlert[] {
  const store = useDropshippingStore.getState();
  const context: AlertContext = {
    resumen: store.getResumenMensual(),
    ciudades: store.getAnalyticsPorCiudad(),
    productos: store.getAnalyticsPorProducto(),
    scorecards: store.getProductScorecards(),
    suppliers: store.getSupplierScores(),
  };

  const newAlerts: DropshipperAlert[] = [];

  for (const rule of DEFAULT_RULES) {
    if (!rule.enabled) continue;

    try {
      if (rule.condition(context)) {
        // Check if we already have a recent alert of this type (avoid spam)
        const recentSame = alertHistory.find(
          (a) => a.category === rule.category && Date.now() - new Date(a.createdAt).getTime() < 24 * 60 * 60 * 1000
        );
        if (recentSame) continue;

        const alertData = rule.generateAlert(context);
        const alert: DropshipperAlert = {
          ...alertData,
          id: `alert_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          createdAt: new Date().toISOString(),
          read: false,
          sentViaWhatsApp: false,
        };

        newAlerts.push(alert);
        alertHistory.push(alert);
      }
    } catch { /* skip broken rules */ }
  }

  saveAlerts();
  return newAlerts;
}

/**
 * Get WhatsApp message for an alert
 */
export function getAlertWhatsAppMessage(alertId: string): string | null {
  const store = useDropshippingStore.getState();
  const context: AlertContext = {
    resumen: store.getResumenMensual(),
    ciudades: store.getAnalyticsPorCiudad(),
    productos: store.getAnalyticsPorProducto(),
    scorecards: store.getProductScorecards(),
    suppliers: store.getSupplierScores(),
  };

  const alert = alertHistory.find((a) => a.id === alertId);
  if (!alert) return null;

  const rule = DEFAULT_RULES.find((r) => r.category === alert.category);
  if (!rule?.whatsappTemplate) return null;

  return rule.whatsappTemplate(context);
}

/**
 * Send alert via Chatea Pro WhatsApp
 */
export async function sendAlertViaWhatsApp(alertId: string, phone: string): Promise<boolean> {
  const message = getAlertWhatsAppMessage(alertId);
  if (!message) return false;

  try {
    const apiKey = import.meta.env.VITE_CHATEA_API_KEY || '';
    if (!apiKey) {
      // Fallback: open wa.me URL
      const encoded = encodeURIComponent(message);
      const cleanPhone = phone.replace(/\D/g, '');
      window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank');
      markAlertSentWhatsApp(alertId);
      return true;
    }

    const baseUrl = 'https://chateapro.app/api';
    await fetch(`${baseUrl}/send-message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ phone, message }),
    });

    markAlertSentWhatsApp(alertId);
    return true;
  } catch {
    return false;
  }
}

// ============================================
// ALERT MANAGEMENT
// ============================================

export function getAlerts(): DropshipperAlert[] {
  return loadAlerts();
}

export function getUnreadAlerts(): DropshipperAlert[] {
  return loadAlerts().filter((a) => !a.read);
}

export function markAlertRead(id: string): void {
  const alert = alertHistory.find((a) => a.id === id);
  if (alert) { alert.read = true; saveAlerts(); }
}

export function markAlertSentWhatsApp(id: string): void {
  const alert = alertHistory.find((a) => a.id === id);
  if (alert) { alert.sentViaWhatsApp = true; saveAlerts(); }
}

export function markAllRead(): void {
  alertHistory.forEach((a) => { a.read = true; });
  saveAlerts();
}

export function clearAlerts(): void {
  alertHistory = [];
  saveAlerts();
}

export function getRules(): AlertRule[] {
  return DEFAULT_RULES;
}
