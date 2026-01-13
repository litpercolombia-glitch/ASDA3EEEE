// services/pdfService.ts
// Generador de Reportes PDF Profesionales - Estilo Enterprise
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// ============================================
// TYPES
// ============================================
export interface PDFReportData {
  title: string;
  subtitle?: string;
  date: Date;
  company?: string;
  logo?: string;
  sections: PDFSection[];
  footer?: string;
}

export interface PDFSection {
  type: 'header' | 'summary' | 'table' | 'chart' | 'text' | 'metrics' | 'divider';
  title?: string;
  data?: any;
}

export interface ShipmentReportData {
  shipments: any[];
  dateRange?: { start: Date; end: Date };
  carrier?: string;
  status?: string;
}

// ============================================
// PDF STYLES
// ============================================
const PDF_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    color: #1e293b;
    line-height: 1.5;
  }

  .pdf-container {
    width: 210mm;
    min-height: 297mm;
    padding: 20mm;
    background: white;
  }

  .pdf-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding-bottom: 20px;
    border-bottom: 3px solid #f59e0b;
    margin-bottom: 30px;
  }

  .pdf-logo {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .pdf-logo-icon {
    width: 50px;
    height: 50px;
    background: linear-gradient(135deg, #f59e0b, #d97706);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 24px;
    font-weight: bold;
  }

  .pdf-logo-text h1 {
    font-size: 24px;
    font-weight: 700;
    color: #0f172a;
  }

  .pdf-logo-text p {
    font-size: 11px;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .pdf-meta {
    text-align: right;
  }

  .pdf-meta h2 {
    font-size: 18px;
    color: #0f172a;
    margin-bottom: 4px;
  }

  .pdf-meta p {
    font-size: 12px;
    color: #64748b;
  }

  .pdf-title {
    text-align: center;
    margin-bottom: 30px;
  }

  .pdf-title h1 {
    font-size: 28px;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 8px;
  }

  .pdf-title p {
    font-size: 14px;
    color: #64748b;
  }

  .pdf-metrics {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 30px;
  }

  .pdf-metric-card {
    background: linear-gradient(135deg, #f8fafc, #f1f5f9);
    border-radius: 12px;
    padding: 20px;
    text-align: center;
    border: 1px solid #e2e8f0;
  }

  .pdf-metric-card.highlight {
    background: linear-gradient(135deg, #fef3c7, #fde68a);
    border-color: #f59e0b;
  }

  .pdf-metric-value {
    font-size: 32px;
    font-weight: 700;
    color: #0f172a;
  }

  .pdf-metric-label {
    font-size: 12px;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-top: 4px;
  }

  .pdf-section {
    margin-bottom: 30px;
  }

  .pdf-section-title {
    font-size: 16px;
    font-weight: 600;
    color: #0f172a;
    padding-bottom: 10px;
    border-bottom: 2px solid #e2e8f0;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .pdf-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 11px;
  }

  .pdf-table th {
    background: #0f172a;
    color: white;
    padding: 12px 8px;
    text-align: left;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .pdf-table th:first-child {
    border-radius: 8px 0 0 0;
  }

  .pdf-table th:last-child {
    border-radius: 0 8px 0 0;
  }

  .pdf-table td {
    padding: 10px 8px;
    border-bottom: 1px solid #e2e8f0;
  }

  .pdf-table tr:nth-child(even) {
    background: #f8fafc;
  }

  .pdf-table tr:last-child td:first-child {
    border-radius: 0 0 0 8px;
  }

  .pdf-table tr:last-child td:last-child {
    border-radius: 0 0 8px 0;
  }

  .pdf-status {
    display: inline-block;
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
  }

  .pdf-status.delivered { background: #d1fae5; color: #065f46; }
  .pdf-status.in-transit { background: #dbeafe; color: #1e40af; }
  .pdf-status.pending { background: #fef3c7; color: #92400e; }
  .pdf-status.issue { background: #fee2e2; color: #991b1b; }

  .pdf-summary-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }

  .pdf-summary-item {
    display: flex;
    justify-content: space-between;
    padding: 12px 0;
    border-bottom: 1px dashed #e2e8f0;
  }

  .pdf-summary-label {
    color: #64748b;
    font-size: 13px;
  }

  .pdf-summary-value {
    font-weight: 600;
    color: #0f172a;
    font-size: 13px;
  }

  .pdf-footer {
    margin-top: 40px;
    padding-top: 20px;
    border-top: 1px solid #e2e8f0;
    text-align: center;
    font-size: 10px;
    color: #94a3b8;
  }

  .pdf-footer p {
    margin-bottom: 4px;
  }

  .pdf-divider {
    height: 1px;
    background: linear-gradient(to right, transparent, #e2e8f0, transparent);
    margin: 30px 0;
  }

  .pdf-chart-placeholder {
    background: #f8fafc;
    border: 2px dashed #e2e8f0;
    border-radius: 12px;
    padding: 40px;
    text-align: center;
    color: #94a3b8;
  }

  .pdf-watermark {
    position: fixed;
    bottom: 20mm;
    right: 20mm;
    font-size: 10px;
    color: #cbd5e1;
    transform: rotate(-45deg);
    opacity: 0.5;
  }

  @media print {
    .pdf-container {
      width: 100%;
      padding: 15mm;
    }

    .pdf-table {
      page-break-inside: avoid;
    }

    .pdf-section {
      page-break-inside: avoid;
    }
  }
`;

// ============================================
// HTML GENERATORS
// ============================================

const generateHeader = (data: PDFReportData): string => `
  <div class="pdf-header">
    <div class="pdf-logo">
      <div class="pdf-logo-icon">👑</div>
      <div class="pdf-logo-text">
        <h1>LITPER PRO</h1>
        <p>Enterprise Logistics</p>
      </div>
    </div>
    <div class="pdf-meta">
      <h2>${data.title}</h2>
      <p>Generado: ${new Date(data.date).toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })}</p>
      ${data.company ? `<p>${data.company}</p>` : ''}
    </div>
  </div>
`;

const generateMetrics = (metrics: { label: string; value: string | number; highlight?: boolean }[]): string => `
  <div class="pdf-metrics">
    ${metrics.map((m) => `
      <div class="pdf-metric-card ${m.highlight ? 'highlight' : ''}">
        <div class="pdf-metric-value">${m.value}</div>
        <div class="pdf-metric-label">${m.label}</div>
      </div>
    `).join('')}
  </div>
`;

const generateTable = (
  headers: string[],
  rows: (string | number)[][],
  title?: string
): string => `
  <div class="pdf-section">
    ${title ? `<div class="pdf-section-title">📋 ${title}</div>` : ''}
    <table class="pdf-table">
      <thead>
        <tr>
          ${headers.map((h) => `<th>${h}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${rows.map((row) => `
          <tr>
            ${row.map((cell) => `<td>${cell}</td>`).join('')}
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
`;

const generateSummary = (items: { label: string; value: string }[], title?: string): string => `
  <div class="pdf-section">
    ${title ? `<div class="pdf-section-title">📊 ${title}</div>` : ''}
    <div class="pdf-summary-grid">
      ${items.map((item) => `
        <div class="pdf-summary-item">
          <span class="pdf-summary-label">${item.label}</span>
          <span class="pdf-summary-value">${item.value}</span>
        </div>
      `).join('')}
    </div>
  </div>
`;

const generateFooter = (text?: string): string => `
  <div class="pdf-footer">
    <p>${text || 'Documento generado automáticamente por LITPER PRO'}</p>
    <p>© ${new Date().getFullYear()} LITPER PRO - Enterprise Logistics Platform</p>
    <p>www.litper.com</p>
  </div>
`;

const getStatusClass = (status: string): string => {
  const statusMap: Record<string, string> = {
    DELIVERED: 'delivered',
    IN_TRANSIT: 'in-transit',
    PENDING: 'pending',
    EXCEPTION: 'issue',
    RETURNED: 'issue',
  };
  return statusMap[status] || 'pending';
};

const getStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    DELIVERED: 'Entregado',
    IN_TRANSIT: 'En Tránsito',
    PENDING: 'Pendiente',
    EXCEPTION: 'Novedad',
    RETURNED: 'Devuelto',
  };
  return statusMap[status] || status;
};

// ============================================
// REPORT GENERATORS
// ============================================

export const generateShipmentReport = (data: ShipmentReportData): string => {
  const { shipments, dateRange, carrier, status } = data;

  // Calculate metrics
  const total = shipments.length;
  const delivered = shipments.filter((s) => s.status === 'DELIVERED').length;
  const inTransit = shipments.filter((s) => s.status === 'IN_TRANSIT').length;
  const issues = shipments.filter((s) => s.status === 'EXCEPTION' || s.status === 'RETURNED').length;
  const deliveryRate = total > 0 ? Math.round((delivered / total) * 100) : 0;

  // Carrier breakdown
  const carrierCounts: Record<string, number> = {};
  shipments.forEach((s) => {
    carrierCounts[s.carrier] = (carrierCounts[s.carrier] || 0) + 1;
  });

  // City breakdown
  const cityCounts: Record<string, number> = {};
  shipments.forEach((s) => {
    const city = s.detailedInfo?.city || 'Sin ciudad';
    cityCounts[city] = (cityCounts[city] || 0) + 1;
  });

  const topCities = Object.entries(cityCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Generate HTML
  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reporte de Guías - LITPER PRO</title>
      <style>${PDF_STYLES}</style>
    </head>
    <body>
      <div class="pdf-container">
        ${generateHeader({
          title: 'Reporte de Guías',
          subtitle: carrier ? `Transportadora: ${carrier}` : undefined,
          date: new Date(),
        })}

        <div class="pdf-title">
          <h1>📦 Reporte de Seguimiento de Guías</h1>
          <p>
            ${dateRange
              ? `Período: ${new Date(dateRange.start).toLocaleDateString('es-CO')} - ${new Date(dateRange.end).toLocaleDateString('es-CO')}`
              : `Fecha: ${new Date().toLocaleDateString('es-CO')}`
            }
            ${carrier ? ` | Transportadora: ${carrier}` : ''}
            ${status ? ` | Estado: ${status}` : ''}
          </p>
        </div>

        ${generateMetrics([
          { label: 'Total Guías', value: total },
          { label: 'Entregadas', value: delivered },
          { label: 'En Tránsito', value: inTransit },
          { label: 'Tasa de Entrega', value: `${deliveryRate}%`, highlight: true },
        ])}

        <div class="pdf-divider"></div>

        ${generateSummary([
          { label: 'Total de guías procesadas', value: total.toString() },
          { label: 'Guías entregadas', value: `${delivered} (${deliveryRate}%)` },
          { label: 'Guías en tránsito', value: inTransit.toString() },
          { label: 'Guías con novedad', value: issues.toString() },
          { label: 'Transportadoras activas', value: Object.keys(carrierCounts).length.toString() },
          { label: 'Ciudades de destino', value: Object.keys(cityCounts).length.toString() },
        ], 'Resumen General')}

        ${generateTable(
          ['#', 'Guía', 'Transportadora', 'Estado', 'Ciudad', 'Días'],
          shipments.slice(0, 50).map((s, i) => [
            i + 1,
            s.id,
            s.carrier,
            `<span class="pdf-status ${getStatusClass(s.status)}">${getStatusText(s.status)}</span>`,
            s.detailedInfo?.city || 'N/A',
            s.detailedInfo?.daysInTransit || 0,
          ]),
          `Detalle de Guías (${Math.min(shipments.length, 50)} de ${total})`
        )}

        ${generateSummary(
          Object.entries(carrierCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([carrier, count]) => ({
              label: carrier,
              value: `${count} guías (${Math.round((count / total) * 100)}%)`,
            })),
          'Distribución por Transportadora'
        )}

        ${generateSummary(
          topCities.map(([city, count]) => ({
            label: city,
            value: `${count} guías`,
          })),
          'Top 5 Ciudades de Destino'
        )}

        ${generateFooter()}
      </div>
    </body>
    </html>
  `;

  return html;
};

export const generateDailyReport = (shipments: any[], date: Date = new Date()): string => {
  const today = date.toISOString().split('T')[0];

  // Filter today's activity
  const todayShipments = shipments.filter((s) => {
    const lastUpdate = s.detailedInfo?.lastUpdate;
    return lastUpdate && new Date(lastUpdate).toISOString().split('T')[0] === today;
  });

  const delivered = todayShipments.filter((s) => s.status === 'DELIVERED').length;
  const newIssues = todayShipments.filter((s) => s.status === 'EXCEPTION').length;

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Reporte Diario - LITPER PRO</title>
      <style>${PDF_STYLES}</style>
    </head>
    <body>
      <div class="pdf-container">
        ${generateHeader({
          title: 'Reporte Diario',
          date: new Date(),
        })}

        <div class="pdf-title">
          <h1>📅 Reporte Diario de Operaciones</h1>
          <p>${date.toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        ${generateMetrics([
          { label: 'Actividad del Día', value: todayShipments.length },
          { label: 'Entregas Hoy', value: delivered, highlight: true },
          { label: 'Nuevas Novedades', value: newIssues },
          { label: 'Total en Sistema', value: shipments.length },
        ])}

        ${generateSummary([
          { label: 'Fecha del reporte', value: date.toLocaleDateString('es-CO') },
          { label: 'Guías con actividad hoy', value: todayShipments.length.toString() },
          { label: 'Entregas completadas', value: delivered.toString() },
          { label: 'Nuevas novedades', value: newIssues.toString() },
        ], 'Actividad del Día')}

        ${todayShipments.length > 0 ? generateTable(
          ['Guía', 'Transportadora', 'Estado', 'Ciudad'],
          todayShipments.slice(0, 30).map((s) => [
            s.id,
            s.carrier,
            `<span class="pdf-status ${getStatusClass(s.status)}">${getStatusText(s.status)}</span>`,
            s.detailedInfo?.city || 'N/A',
          ]),
          'Guías con Actividad Hoy'
        ) : '<p style="text-align: center; color: #64748b; padding: 40px;">No hay actividad registrada para hoy</p>'}

        ${generateFooter()}
      </div>
    </body>
    </html>
  `;

  return html;
};

// ============================================
// REPORTE DE RENDIMIENTO
// ============================================
export const generatePerformanceReport = (shipments: any[]): string => {
  const total = shipments.length;
  const delivered = shipments.filter((s) => s.status === 'DELIVERED').length;
  const inTransit = shipments.filter((s) => s.status === 'IN_TRANSIT').length;
  const issues = shipments.filter((s) => s.status === 'EXCEPTION' || s.status === 'RETURNED' || s.status === 'ISSUE').length;
  const deliveryRate = total > 0 ? Math.round((delivered / total) * 100) : 0;
  const issueRate = total > 0 ? Math.round((issues / total) * 100) : 0;

  // Calcular tiempos promedio
  const deliveredShipments = shipments.filter(s => s.status === 'DELIVERED' && s.detailedInfo?.daysInTransit);
  const avgDeliveryDays = deliveredShipments.length > 0
    ? Math.round(deliveredShipments.reduce((acc, s) => acc + (s.detailedInfo?.daysInTransit || 0), 0) / deliveredShipments.length * 10) / 10
    : 0;

  // Distribución por días en tránsito
  const dayDistribution: Record<string, number> = { '1-2 días': 0, '3-4 días': 0, '5-6 días': 0, '7+ días': 0 };
  shipments.forEach(s => {
    const days = s.detailedInfo?.daysInTransit || 0;
    if (days <= 2) dayDistribution['1-2 días']++;
    else if (days <= 4) dayDistribution['3-4 días']++;
    else if (days <= 6) dayDistribution['5-6 días']++;
    else dayDistribution['7+ días']++;
  });

  // Guías críticas (más de 5 días)
  const criticalShipments = shipments.filter(s => (s.detailedInfo?.daysInTransit || 0) >= 5);

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Reporte de Rendimiento - LITPER PRO</title>
      <style>${PDF_STYLES}</style>
    </head>
    <body>
      <div class="pdf-container">
        ${generateHeader({
          title: 'Reporte de Rendimiento',
          date: new Date(),
        })}

        <div class="pdf-title">
          <h1>📊 Análisis de Rendimiento Logístico</h1>
          <p>Métricas de eficiencia y tiempos de entrega</p>
        </div>

        ${generateMetrics([
          { label: 'Tasa de Entrega', value: `${deliveryRate}%`, highlight: true },
          { label: 'Tasa de Novedades', value: `${issueRate}%` },
          { label: 'Tiempo Promedio', value: `${avgDeliveryDays} días` },
          { label: 'Guías Críticas', value: criticalShipments.length },
        ])}

        <div class="pdf-divider"></div>

        ${generateSummary([
          { label: 'Total de guías analizadas', value: total.toString() },
          { label: 'Entregas exitosas', value: `${delivered} (${deliveryRate}%)` },
          { label: 'En tránsito actualmente', value: inTransit.toString() },
          { label: 'Con novedad/problema', value: `${issues} (${issueRate}%)` },
          { label: 'Tiempo promedio de entrega', value: `${avgDeliveryDays} días` },
          { label: 'Guías con más de 5 días', value: criticalShipments.length.toString() },
        ], 'Indicadores Clave de Rendimiento (KPIs)')}

        ${generateSummary(
          Object.entries(dayDistribution).map(([range, count]) => ({
            label: range,
            value: `${count} guías (${total > 0 ? Math.round((count / total) * 100) : 0}%)`,
          })),
          'Distribución por Tiempo en Tránsito'
        )}

        ${criticalShipments.length > 0 ? generateTable(
          ['#', 'Guía', 'Transportadora', 'Días', 'Estado', 'Ciudad'],
          criticalShipments.slice(0, 20).map((s, i) => [
            i + 1,
            s.id,
            s.carrier,
            s.detailedInfo?.daysInTransit || 0,
            `<span class="pdf-status ${getStatusClass(s.status)}">${getStatusText(s.status)}</span>`,
            s.detailedInfo?.city || 'N/A',
          ]),
          `Guías Críticas - Más de 5 días (${criticalShipments.length} total)`
        ) : ''}

        ${generateFooter()}
      </div>
    </body>
    </html>
  `;

  return html;
};

// ============================================
// REPORTE POR TRANSPORTADORA
// ============================================
export const generateCarrierReport = (shipments: any[]): string => {
  const total = shipments.length;

  // Agrupar por transportadora
  const carrierData: Record<string, {
    total: number;
    delivered: number;
    inTransit: number;
    issues: number;
    totalDays: number;
    deliveredCount: number;
  }> = {};

  shipments.forEach(s => {
    const carrier = s.carrier || 'Sin Transportadora';
    if (!carrierData[carrier]) {
      carrierData[carrier] = { total: 0, delivered: 0, inTransit: 0, issues: 0, totalDays: 0, deliveredCount: 0 };
    }
    carrierData[carrier].total++;
    if (s.status === 'DELIVERED') {
      carrierData[carrier].delivered++;
      carrierData[carrier].deliveredCount++;
      carrierData[carrier].totalDays += s.detailedInfo?.daysInTransit || 0;
    }
    if (s.status === 'IN_TRANSIT') carrierData[carrier].inTransit++;
    if (s.status === 'EXCEPTION' || s.status === 'ISSUE' || s.status === 'RETURNED') carrierData[carrier].issues++;
  });

  // Calcular métricas y ordenar por rendimiento
  const carrierMetrics = Object.entries(carrierData).map(([name, data]) => {
    const deliveryRate = data.total > 0 ? Math.round((data.delivered / data.total) * 100) : 0;
    const avgDays = data.deliveredCount > 0 ? Math.round((data.totalDays / data.deliveredCount) * 10) / 10 : 0;
    const score = deliveryRate - (data.issues / data.total * 50) - (avgDays > 5 ? 10 : 0);
    return { name, ...data, deliveryRate, avgDays, score };
  }).sort((a, b) => b.score - a.score);

  // Top performer
  const topPerformer = carrierMetrics[0];

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Reporte por Transportadora - LITPER PRO</title>
      <style>${PDF_STYLES}</style>
    </head>
    <body>
      <div class="pdf-container">
        ${generateHeader({
          title: 'Reporte por Transportadora',
          date: new Date(),
        })}

        <div class="pdf-title">
          <h1>🚚 Análisis Comparativo de Transportadoras</h1>
          <p>Ranking y métricas de rendimiento por carrier</p>
        </div>

        ${generateMetrics([
          { label: 'Transportadoras', value: carrierMetrics.length },
          { label: 'Total Guías', value: total },
          { label: 'Mejor Rendimiento', value: topPerformer ? topPerformer.name.substring(0, 12) : 'N/A', highlight: true },
          { label: 'Mejor Tasa', value: topPerformer ? `${topPerformer.deliveryRate}%` : 'N/A' },
        ])}

        <div class="pdf-divider"></div>

        ${generateTable(
          ['#', 'Transportadora', 'Total', 'Entregadas', 'Tasa', 'Novedades', 'Prom. Días'],
          carrierMetrics.map((c, i) => [
            i + 1,
            c.name,
            c.total,
            c.delivered,
            `<span style="color: ${c.deliveryRate >= 80 ? '#10b981' : c.deliveryRate >= 60 ? '#f59e0b' : '#ef4444'}; font-weight: bold;">${c.deliveryRate}%</span>`,
            c.issues,
            c.avgDays || 'N/A',
          ]),
          'Ranking de Transportadoras'
        )}

        ${generateSummary(
          carrierMetrics.slice(0, 6).map(c => ({
            label: c.name,
            value: `${c.deliveryRate}% entrega | ${c.avgDays} días prom.`,
          })),
          'Resumen de Métricas por Carrier'
        )}

        ${generateFooter()}
      </div>
    </body>
    </html>
  `;

  return html;
};

// ============================================
// REPORTE POR CIUDAD
// ============================================
export const generateCityReport = (shipments: any[]): string => {
  const total = shipments.length;

  // Agrupar por ciudad
  const cityData: Record<string, {
    total: number;
    delivered: number;
    inTransit: number;
    issues: number;
  }> = {};

  shipments.forEach(s => {
    const city = s.detailedInfo?.destination || s.detailedInfo?.city || 'Sin Ciudad';
    if (!cityData[city]) {
      cityData[city] = { total: 0, delivered: 0, inTransit: 0, issues: 0 };
    }
    cityData[city].total++;
    if (s.status === 'DELIVERED') cityData[city].delivered++;
    if (s.status === 'IN_TRANSIT') cityData[city].inTransit++;
    if (s.status === 'EXCEPTION' || s.status === 'ISSUE' || s.status === 'RETURNED') cityData[city].issues++;
  });

  // Calcular métricas y ordenar por volumen
  const cityMetrics = Object.entries(cityData).map(([name, data]) => {
    const deliveryRate = data.total > 0 ? Math.round((data.delivered / data.total) * 100) : 0;
    const issueRate = data.total > 0 ? Math.round((data.issues / data.total) * 100) : 0;
    const status = deliveryRate >= 80 ? 'VERDE' : deliveryRate >= 60 ? 'AMARILLO' : issueRate >= 20 ? 'ROJO' : 'NARANJA';
    return { name, ...data, deliveryRate, issueRate, status };
  }).sort((a, b) => b.total - a.total);

  // Ciudades problemáticas
  const problemCities = cityMetrics.filter(c => c.status === 'ROJO' || c.issueRate >= 15);

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Reporte por Ciudad - LITPER PRO</title>
      <style>${PDF_STYLES}</style>
    </head>
    <body>
      <div class="pdf-container">
        ${generateHeader({
          title: 'Reporte por Ciudad',
          date: new Date(),
        })}

        <div class="pdf-title">
          <h1>🌍 Análisis Geográfico de Entregas</h1>
          <p>Distribución y rendimiento por ciudad destino</p>
        </div>

        ${generateMetrics([
          { label: 'Ciudades', value: cityMetrics.length },
          { label: 'Total Guías', value: total },
          { label: 'Ciudades Críticas', value: problemCities.length },
          { label: 'Top Ciudad', value: cityMetrics[0]?.name.substring(0, 12) || 'N/A', highlight: true },
        ])}

        <div class="pdf-divider"></div>

        ${generateTable(
          ['#', 'Ciudad', 'Total', 'Entregadas', 'Tasa', 'Novedades', 'Estado'],
          cityMetrics.slice(0, 15).map((c, i) => [
            i + 1,
            c.name,
            c.total,
            c.delivered,
            `${c.deliveryRate}%`,
            c.issues,
            `<span class="pdf-status ${c.status === 'VERDE' ? 'delivered' : c.status === 'ROJO' ? 'issue' : 'pending'}">${c.status}</span>`,
          ]),
          'Top 15 Ciudades por Volumen'
        )}

        ${problemCities.length > 0 ? generateSummary(
          problemCities.slice(0, 8).map(c => ({
            label: c.name,
            value: `${c.issueRate}% novedades | ${c.deliveryRate}% entrega`,
          })),
          '⚠️ Ciudades que Requieren Atención'
        ) : ''}

        ${generateSummary([
          { label: 'Ciudades con buen rendimiento (>80%)', value: cityMetrics.filter(c => c.deliveryRate >= 80).length.toString() },
          { label: 'Ciudades en riesgo (60-80%)', value: cityMetrics.filter(c => c.deliveryRate >= 60 && c.deliveryRate < 80).length.toString() },
          { label: 'Ciudades críticas (<60%)', value: cityMetrics.filter(c => c.deliveryRate < 60).length.toString() },
          { label: 'Porcentaje de cobertura nacional', value: `${cityMetrics.length} ciudades` },
        ], 'Resumen de Cobertura Geográfica')}

        ${generateFooter()}
      </div>
    </body>
    </html>
  `;

  return html;
};

// ============================================
// REPORTE EJECUTIVO
// ============================================
export const generateExecutiveReport = (shipments: any[]): string => {
  const total = shipments.length;
  const delivered = shipments.filter((s) => s.status === 'DELIVERED').length;
  const inTransit = shipments.filter((s) => s.status === 'IN_TRANSIT').length;
  const issues = shipments.filter((s) => s.status === 'EXCEPTION' || s.status === 'RETURNED' || s.status === 'ISSUE').length;
  const deliveryRate = total > 0 ? Math.round((delivered / total) * 100) : 0;

  // Carrier breakdown
  const carrierCounts: Record<string, { total: number; delivered: number }> = {};
  shipments.forEach((s) => {
    if (!carrierCounts[s.carrier]) {
      carrierCounts[s.carrier] = { total: 0, delivered: 0 };
    }
    carrierCounts[s.carrier].total++;
    if (s.status === 'DELIVERED') carrierCounts[s.carrier].delivered++;
  });

  const topCarriers = Object.entries(carrierCounts)
    .map(([name, data]) => ({ name, ...data, rate: Math.round((data.delivered / data.total) * 100) }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  // City breakdown
  const cityCounts: Record<string, number> = {};
  shipments.forEach((s) => {
    const city = s.detailedInfo?.destination || s.detailedInfo?.city || 'Sin ciudad';
    cityCounts[city] = (cityCounts[city] || 0) + 1;
  });
  const topCities = Object.entries(cityCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Critical items
  const criticalCount = shipments.filter(s => (s.detailedInfo?.daysInTransit || 0) >= 5).length;

  // Calculate trend indicators (simulated for now)
  const deliveryTrend = deliveryRate >= 75 ? '↑' : deliveryRate >= 60 ? '→' : '↓';
  const issueTrend = (issues / total * 100) <= 10 ? '↓ (bueno)' : (issues / total * 100) <= 20 ? '→' : '↑ (revisar)';

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Reporte Ejecutivo - LITPER PRO</title>
      <style>${PDF_STYLES}</style>
    </head>
    <body>
      <div class="pdf-container">
        ${generateHeader({
          title: 'Reporte Ejecutivo',
          date: new Date(),
        })}

        <div class="pdf-title">
          <h1>👔 Resumen Ejecutivo de Operaciones</h1>
          <p>Visión general para toma de decisiones estratégicas</p>
        </div>

        ${generateMetrics([
          { label: 'Guías Totales', value: total },
          { label: 'Tasa de Éxito', value: `${deliveryRate}%`, highlight: true },
          { label: 'Alertas Activas', value: criticalCount },
          { label: 'Transportadoras', value: Object.keys(carrierCounts).length },
        ])}

        <div class="pdf-divider"></div>

        ${generateSummary([
          { label: 'Entregas exitosas', value: `${delivered} guías (${deliveryRate}%)` },
          { label: 'En proceso de entrega', value: `${inTransit} guías` },
          { label: 'Con novedades activas', value: `${issues} guías (${Math.round((issues/total)*100)}%)` },
          { label: 'Requieren atención urgente', value: `${criticalCount} guías` },
          { label: 'Tendencia de entrega', value: deliveryTrend },
          { label: 'Tendencia de novedades', value: issueTrend },
        ], '📈 Indicadores Principales')}

        ${generateSummary(
          topCarriers.map(c => ({
            label: c.name,
            value: `${c.total} guías | ${c.rate}% éxito`,
          })),
          '🚚 Top 5 Transportadoras'
        )}

        ${generateSummary(
          topCities.map(([city, count]) => ({
            label: city,
            value: `${count} guías (${Math.round((count/total)*100)}%)`,
          })),
          '🌍 Top 5 Ciudades de Destino'
        )}

        <div class="pdf-section">
          <div class="pdf-section-title">💡 Recomendaciones</div>
          <ul style="padding-left: 20px; color: #334155; font-size: 12px; line-height: 1.8;">
            ${criticalCount > 0 ? `<li><strong>Urgente:</strong> ${criticalCount} guías con más de 5 días requieren seguimiento inmediato.</li>` : ''}
            ${deliveryRate < 75 ? `<li><strong>Mejorar:</strong> Tasa de entrega por debajo del objetivo (75%). Revisar procesos.</li>` : `<li><strong>Mantener:</strong> Excelente tasa de entrega (${deliveryRate}%). Continuar con buenas prácticas.</li>`}
            ${issues > total * 0.15 ? `<li><strong>Atención:</strong> Alto porcentaje de novedades. Analizar causas raíz.</li>` : ''}
            <li><strong>Seguimiento:</strong> Monitorear transportadoras con bajo rendimiento para optimizar rutas.</li>
          </ul>
        </div>

        ${generateFooter()}
      </div>
    </body>
    </html>
  `;

  return html;
};

// ============================================
// PDF GENERATION METHODS
// ============================================

export const openPDFInNewTab = (html: string): void => {
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  }
};

export const printPDF = (html: string): void => {
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  }
};

export const downloadPDF = async (html: string, filename: string = 'reporte.pdf'): Promise<void> => {
  // Create a temporary container
  const container = document.createElement('div');
  container.innerHTML = html;
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  document.body.appendChild(container);

  try {
    const pdfContainer = container.querySelector('.pdf-container') as HTMLElement;
    if (!pdfContainer) {
      throw new Error('PDF container not found');
    }

    const canvas = await html2canvas(pdfContainer, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    // Calculate PDF dimensions (A4)
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Create PDF with jsPDF
    const pdf = new jsPDF({
      orientation: imgHeight > pageHeight ? 'portrait' : 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const imgData = canvas.toDataURL('image/png', 1.0);

    // Handle multi-page PDFs
    let heightLeft = imgHeight;
    let position = 0;
    let pageCount = 0;

    // Add first page
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    pageCount++;

    // Add additional pages if needed
    while (heightLeft > 0) {
      position = -pageHeight * pageCount;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      pageCount++;
    }

    // Download the PDF
    pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
};

// Descargar PDF usando el diálogo de impresión nativo (mejor calidad)
export const downloadPDFNative = (html: string, filename: string = 'reporte.pdf'): void => {
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(`
      ${html}
      <script>
        window.onload = function() {
          document.title = '${filename.replace('.pdf', '')}';
          setTimeout(function() {
            window.print();
          }, 500);
        };
      </script>
    `);
    printWindow.document.close();
  }
};

// ============================================
// QUICK REPORT FUNCTIONS
// ============================================

export const quickShipmentReport = (shipments: any[]): void => {
  const html = generateShipmentReport({ shipments });
  openPDFInNewTab(html);
};

export const quickDailyReport = (shipments: any[]): void => {
  const html = generateDailyReport(shipments);
  openPDFInNewTab(html);
};

export const printShipmentReport = (shipments: any[]): void => {
  const html = generateShipmentReport({ shipments });
  printPDF(html);
};

export default {
  generateShipmentReport,
  generateDailyReport,
  generatePerformanceReport,
  generateCarrierReport,
  generateCityReport,
  generateExecutiveReport,
  openPDFInNewTab,
  printPDF,
  downloadPDF,
  quickShipmentReport,
  quickDailyReport,
  printShipmentReport,
};
