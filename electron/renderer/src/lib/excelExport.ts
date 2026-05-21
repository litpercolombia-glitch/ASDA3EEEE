/**
 * excelExport — genera .xlsx con todas las rondas del día.
 */
import * as XLSX from 'xlsx';
import type { RondaSnapshot, KPIsDia } from '../stores/rondaStore';
import type { User } from '../stores/teamStore';

export function exportRondasToExcel(
  rondas: RondaSnapshot[],
  users: User[],
  kpis: KPIsDia,
  fecha: string,
) {
  const userById = new Map(users.map((u) => [u.id, u]));

  const rows = rondas.map((r) => {
    const user = userById.get(r.userId);
    return {
      'Ronda #': r.numero,
      Operador: user?.name ?? r.userId,
      Rol: user?.role ?? '',
      'Inicio': new Date(r.startedAt).toLocaleTimeString('es-CO'),
      'Fin': new Date(r.endedAt).toLocaleTimeString('es-CO'),
      Iniciales: r.counters.iniciales,
      Realizado: r.counters.realizado,
      Cancelado: r.counters.cancelado,
      Agendado: r.counters.agendado,
      'Difíciles': r.counters.dificiles,
      Pendientes: r.counters.pendientes,
      Revisado: r.counters.revisado,
      Novedades: r.counters.novedades,
      'Tasa': r.counters.iniciales > 0
        ? `${((r.counters.realizado / r.counters.iniciales) * 100).toFixed(1)}%`
        : '–',
    };
  });

  const wb = XLSX.utils.book_new();

  // Hoja 1: rondas detalle
  const ws1 = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws1, 'Rondas');

  // Hoja 2: KPIs del día
  const kpiRows = [
    { Métrica: 'Fecha', Valor: fecha },
    { Métrica: 'Rondas guardadas', Valor: rondas.length },
    { Métrica: 'Iniciales totales', Valor: kpis.totalIniciales },
    { Métrica: 'Realizado totales', Valor: kpis.totalRealizado },
    { Métrica: 'Tasa del día', Valor: `${(kpis.tasa * 100).toFixed(1)}%` },
    { Métrica: 'CPA logístico', Valor: `$${Math.round(kpis.cpaCOP).toLocaleString('es-CO')} COP` },
    { Métrica: 'Cumple meta 80.5%', Valor: kpis.cumpleMeta ? 'Sí' : 'No' },
    { Métrica: 'Racha actual', Valor: kpis.rachaActual },
    { Métrica: 'Mejor hora', Valor: kpis.bestHour ?? '–' },
  ];
  const ws2 = XLSX.utils.json_to_sheet(kpiRows);
  XLSX.utils.book_append_sheet(wb, ws2, 'KPIs');

  const filename = `litper-desk-${fecha}.xlsx`;
  XLSX.writeFile(wb, filename);
}
