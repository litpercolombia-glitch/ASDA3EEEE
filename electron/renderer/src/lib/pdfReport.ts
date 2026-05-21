/**
 * pdfReport — genera PDF de informe diario con jsPDF + autoTable.
 */
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { RondaSnapshot, KPIsDia } from '../stores/rondaStore';
import type { User } from '../stores/teamStore';

const GOLD = '#D4AF37';
const NAVY = '#0A0E27';
const CREAM = '#F5F2E8';

export function generateDailyReport(params: {
  fecha: string;
  rondas: RondaSnapshot[];
  users: User[];
  kpis: KPIsDia;
  tagline?: string;
}) {
  const { fecha, rondas, users, kpis, tagline = 'Calidad en cada detalle' } = params;
  const userById = new Map(users.map((u) => [u.id, u]));

  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();

  // ===== Header con marca =====
  doc.setFillColor(NAVY);
  doc.rect(0, 0, pageW, 110, 'F');
  doc.setTextColor(GOLD);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.text('LITPER DESK', 40, 50);
  doc.setFontSize(11);
  doc.setTextColor(CREAM);
  doc.text(tagline, 40, 70);
  doc.setFontSize(10);
  doc.text(`Informe diario · ${fecha}`, 40, 90);

  // ===== KPIs cards =====
  let y = 140;
  doc.setTextColor(NAVY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Resumen del día', 40, y);
  y += 20;

  const cards: Array<[string, string, string]> = [
    ['Tasa de entrega', `${(kpis.tasa * 100).toFixed(1)}%`, kpis.cumpleMeta ? 'Cumple meta' : 'Bajo meta'],
    ['CPA logístico', `$${Math.round(kpis.cpaCOP).toLocaleString('es-CO')}`, 'COP / pedido'],
    ['Racha actual', `${kpis.rachaActual} días`, kpis.rachaActual >= 3 ? '🔥 buena' : 'a mejorar'],
    ['Mejor hora', kpis.bestHour ?? '–', 'pico de productividad'],
  ];

  const cardW = (pageW - 80 - 30) / 4;
  const cardH = 70;
  cards.forEach(([label, value, footer], i) => {
    const x = 40 + i * (cardW + 10);
    doc.setDrawColor(GOLD);
    doc.setLineWidth(0.8);
    doc.roundedRect(x, y, cardW, cardH, 6, 6, 'D');
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.setFont('helvetica', 'normal');
    doc.text(label, x + 10, y + 18);
    doc.setFontSize(18);
    doc.setTextColor(NAVY);
    doc.setFont('helvetica', 'bold');
    doc.text(value, x + 10, y + 42);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.setFont('helvetica', 'normal');
    doc.text(footer, x + 10, y + 60);
  });
  y += cardH + 30;

  // ===== Tabla de rondas =====
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(NAVY);
  doc.text('Rondas guardadas', 40, y);
  y += 12;

  const rondaRows = rondas.map((r) => {
    const user = userById.get(r.userId);
    const tasa = r.counters.iniciales > 0
      ? `${((r.counters.realizado / r.counters.iniciales) * 100).toFixed(0)}%`
      : '–';
    return [
      String(r.numero),
      user?.name ?? '—',
      new Date(r.endedAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
      String(r.counters.iniciales),
      String(r.counters.realizado),
      String(r.counters.cancelado),
      String(r.counters.agendado),
      String(r.counters.dificiles),
      String(r.counters.pendientes),
      String(r.counters.revisado),
      String(r.counters.novedades),
      tasa,
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [['#', 'Operador', 'Hora', 'Ini', 'OK', 'Can', 'Age', 'Dif', 'Pen', 'Rev', 'Nov', 'Tasa']],
    body: rondaRows,
    theme: 'striped',
    headStyles: { fillColor: [10, 14, 39], textColor: [212, 175, 55] },
    styles: { fontSize: 8 },
    margin: { left: 40, right: 40 },
  });

  // ===== Footer =====
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `LITPER OFICIAL · ${tagline} · Generado por LITPER DESK`,
      40,
      doc.internal.pageSize.getHeight() - 20,
    );
    doc.text(
      `${p} / ${totalPages}`,
      pageW - 60,
      doc.internal.pageSize.getHeight() - 20,
    );
  }

  doc.save(`litper-desk-informe-${fecha}.pdf`);
}
