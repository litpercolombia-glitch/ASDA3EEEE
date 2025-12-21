// services/trackingService.ts
// Servicio de Tracking de Productividad - LITPER PRO Enterprise
// Importa y analiza datos del Excel LITPER TRACKER

import * as XLSX from 'xlsx';

// ==================== TIPOS ====================

export interface RondaTracking {
  id: string;
  fecha: string;
  usuario: string;
  ronda: number;
  horaInicio: string;
  horaFin: string;
  tiempoMinutos: number;
  // Métricas de guías
  iniciales: number;
  realizadas: number;
  canceladas: number;
  agendadas: number;
  dificiles: number;
  pendientes: number;
  revisadas: number;
}

export interface NovedadTracking {
  id: string;
  fecha: string;
  usuario: string;
  ronda: number;
  horaInicio: string;
  horaFin: string;
  tiempoMinutos: number;
  revisadas: number;
  solucionadas: number;
  devolucion: number;
  cliente: number;
  transportadora: number;
  litper: number;
}

export interface ResumenUsuario {
  usuario: string;
  totalRondas: number;
  totalGuiasRealizadas: number;
  totalGuiasCanceladas: number;
  totalNovedadesSolucionadas: number;
  tiempoTotalMinutos: number;
  promedioGuiasPorRonda: number;
  tasaExito: number; // % realizadas vs total
  tasaCancelacion: number;
  mejorDia: string;
  peorDia: string;
  horasMasProductivas: string[];
  tendencia: 'mejorando' | 'estable' | 'decayendo';
}

export interface AnalisisProductividad {
  periodo: string;
  totalUsuarios: number;
  totalRondas: number;
  totalGuiasRealizadas: number;
  totalNovedadesSolucionadas: number;
  promedioGuiasPorUsuario: number;
  usuarioTop: string;
  usuarioMejorando: string;
  alertas: AlertaProductividad[];
  recomendacionesIA: string[];
}

export interface AlertaProductividad {
  tipo: 'warning' | 'danger' | 'success' | 'info';
  usuario: string;
  mensaje: string;
  metrica: string;
  valor: number;
}

// ==================== TRACKING SERVICE ====================

class TrackingService {
  private rondas: RondaTracking[] = [];
  private novedades: NovedadTracking[] = [];
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadData();
  }

  // ==================== PERSISTENCIA ====================

  private loadData(): void {
    try {
      const rondasRaw = localStorage.getItem('litper_tracking_rondas');
      const novedadesRaw = localStorage.getItem('litper_tracking_novedades');

      if (rondasRaw) this.rondas = JSON.parse(rondasRaw);
      if (novedadesRaw) this.novedades = JSON.parse(novedadesRaw);
    } catch (error) {
      console.error('[TrackingService] Error cargando datos:', error);
    }
  }

  private saveData(): void {
    localStorage.setItem('litper_tracking_rondas', JSON.stringify(this.rondas));
    localStorage.setItem('litper_tracking_novedades', JSON.stringify(this.novedades));
    this.notifyListeners();
  }

  // ==================== IMPORTACIÓN EXCEL ====================

  async importarExcel(file: File): Promise<{ success: boolean; message: string; rondas: number; novedades: number }> {
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

      let rondasImportadas = 0;
      let novedadesImportadas = 0;
      let seccionActual: 'rondas' | 'novedades' | null = null;

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        if (!row || row.length === 0) continue;

        const firstCell = String(row[0] || '').toLowerCase();

        // Detectar sección
        if (firstCell.includes('fecha') && String(row[1] || '').toLowerCase().includes('usuario')) {
          // Detectar si es sección de rondas o novedades
          if (String(row[6] || '').toLowerCase().includes('iniciales')) {
            seccionActual = 'rondas';
          } else if (String(row[6] || '').toLowerCase().includes('revisadas')) {
            seccionActual = 'novedades';
          }
          continue;
        }

        // Saltar filas de encabezado o errores
        if (firstCell.includes('#error') || firstCell.includes('total') || !row[0]) continue;

        // Parsear fecha
        const fechaRaw = row[0];
        let fecha = '';
        if (typeof fechaRaw === 'number') {
          // Excel date serial
          const excelDate = new Date((fechaRaw - 25569) * 86400 * 1000);
          fecha = excelDate.toISOString().split('T')[0];
        } else if (typeof fechaRaw === 'string') {
          fecha = fechaRaw;
        }

        if (!fecha || !row[1]) continue;

        const usuario = String(row[1]).toUpperCase().trim();
        const ronda = parseInt(row[2]) || 1;

        if (seccionActual === 'rondas' && row.length >= 12) {
          const rondaData: RondaTracking = {
            id: `ronda_${fecha}_${usuario}_${ronda}_${Date.now()}`,
            fecha,
            usuario,
            ronda,
            horaInicio: this.parseHora(row[3]),
            horaFin: this.parseHora(row[4]),
            tiempoMinutos: parseInt(row[5]) || 0,
            iniciales: parseInt(row[6]) || 0,
            realizadas: parseInt(row[7]) || 0,
            canceladas: parseInt(row[8]) || 0,
            agendadas: parseInt(row[9]) || 0,
            dificiles: parseInt(row[10]) || 0,
            pendientes: parseInt(row[11]) || 0,
            revisadas: parseInt(row[12]) || 0,
          };

          // Evitar duplicados
          const existe = this.rondas.some(r =>
            r.fecha === rondaData.fecha &&
            r.usuario === rondaData.usuario &&
            r.ronda === rondaData.ronda
          );

          if (!existe) {
            this.rondas.push(rondaData);
            rondasImportadas++;
          }
        } else if (seccionActual === 'novedades' && row.length >= 11) {
          const novedadData: NovedadTracking = {
            id: `novedad_${fecha}_${usuario}_${ronda}_${Date.now()}`,
            fecha,
            usuario,
            ronda,
            horaInicio: this.parseHora(row[3]),
            horaFin: this.parseHora(row[4]),
            tiempoMinutos: parseInt(row[5]) || 0,
            revisadas: parseInt(row[6]) || 0,
            solucionadas: parseInt(row[7]) || 0,
            devolucion: parseInt(row[8]) || 0,
            cliente: parseInt(row[9]) || 0,
            transportadora: parseInt(row[10]) || 0,
            litper: parseInt(row[11]) || 0,
          };

          const existe = this.novedades.some(n =>
            n.fecha === novedadData.fecha &&
            n.usuario === novedadData.usuario &&
            n.ronda === novedadData.ronda
          );

          if (!existe) {
            this.novedades.push(novedadData);
            novedadesImportadas++;
          }
        }
      }

      this.saveData();

      return {
        success: true,
        message: `Importados: ${rondasImportadas} rondas, ${novedadesImportadas} novedades`,
        rondas: rondasImportadas,
        novedades: novedadesImportadas,
      };
    } catch (error: any) {
      console.error('[TrackingService] Error importando:', error);
      return {
        success: false,
        message: `Error: ${error.message}`,
        rondas: 0,
        novedades: 0,
      };
    }
  }

  private parseHora(value: any): string {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number') {
      // Excel time fraction
      const hours = Math.floor(value * 24);
      const minutes = Math.floor((value * 24 * 60) % 60);
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
    return String(value);
  }

  // ==================== CONSULTAS ====================

  getRondas(filtros?: { usuario?: string; fechaDesde?: string; fechaHasta?: string }): RondaTracking[] {
    let resultado = [...this.rondas];

    if (filtros?.usuario) {
      resultado = resultado.filter(r => r.usuario === filtros.usuario.toUpperCase());
    }
    if (filtros?.fechaDesde) {
      resultado = resultado.filter(r => r.fecha >= filtros.fechaDesde!);
    }
    if (filtros?.fechaHasta) {
      resultado = resultado.filter(r => r.fecha <= filtros.fechaHasta!);
    }

    return resultado.sort((a, b) => {
      const fechaCompare = b.fecha.localeCompare(a.fecha);
      if (fechaCompare !== 0) return fechaCompare;
      return a.ronda - b.ronda;
    });
  }

  getNovedades(filtros?: { usuario?: string }): NovedadTracking[] {
    let resultado = [...this.novedades];

    if (filtros?.usuario) {
      resultado = resultado.filter(n => n.usuario === filtros.usuario.toUpperCase());
    }

    return resultado.sort((a, b) => b.fecha.localeCompare(a.fecha));
  }

  getUsuarios(): string[] {
    const usuarios = new Set<string>();
    this.rondas.forEach(r => usuarios.add(r.usuario));
    this.novedades.forEach(n => usuarios.add(n.usuario));
    return Array.from(usuarios).sort();
  }

  // ==================== ANÁLISIS POR USUARIO ====================

  getResumenUsuario(usuario: string): ResumenUsuario {
    const rondas = this.getRondas({ usuario });
    const novedades = this.getNovedades({ usuario });

    const totalGuiasRealizadas = rondas.reduce((sum, r) => sum + r.realizadas, 0);
    const totalGuiasCanceladas = rondas.reduce((sum, r) => sum + r.canceladas, 0);
    const totalNovedadesSolucionadas = novedades.reduce((sum, n) => sum + n.solucionadas, 0);
    const tiempoTotal = rondas.reduce((sum, r) => sum + r.tiempoMinutos, 0);

    // Agrupar por día
    const porDia: Record<string, number> = {};
    rondas.forEach(r => {
      porDia[r.fecha] = (porDia[r.fecha] || 0) + r.realizadas;
    });

    const dias = Object.entries(porDia).sort((a, b) => b[1] - a[1]);
    const mejorDia = dias[0]?.[0] || '';
    const peorDia = dias[dias.length - 1]?.[0] || '';

    // Horas más productivas
    const porHora: Record<string, number> = {};
    rondas.forEach(r => {
      if (r.horaInicio) {
        const hora = r.horaInicio.split(':')[0];
        porHora[hora] = (porHora[hora] || 0) + r.realizadas;
      }
    });
    const horasMasProductivas = Object.entries(porHora)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([h]) => `${h}:00`);

    // Tendencia (últimas 2 semanas vs anteriores)
    const ahora = new Date();
    const hace2Semanas = new Date(ahora.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const hace4Semanas = new Date(ahora.getTime() - 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const reciente = rondas.filter(r => r.fecha >= hace2Semanas);
    const anterior = rondas.filter(r => r.fecha >= hace4Semanas && r.fecha < hace2Semanas);

    const promedioReciente = reciente.length > 0
      ? reciente.reduce((s, r) => s + r.realizadas, 0) / reciente.length
      : 0;
    const promedioAnterior = anterior.length > 0
      ? anterior.reduce((s, r) => s + r.realizadas, 0) / anterior.length
      : 0;

    let tendencia: 'mejorando' | 'estable' | 'decayendo' = 'estable';
    if (promedioAnterior > 0) {
      const cambio = ((promedioReciente - promedioAnterior) / promedioAnterior) * 100;
      if (cambio > 10) tendencia = 'mejorando';
      else if (cambio < -10) tendencia = 'decayendo';
    }

    const totalIntentos = totalGuiasRealizadas + totalGuiasCanceladas;

    return {
      usuario,
      totalRondas: rondas.length,
      totalGuiasRealizadas,
      totalGuiasCanceladas,
      totalNovedadesSolucionadas,
      tiempoTotalMinutos: tiempoTotal,
      promedioGuiasPorRonda: rondas.length > 0 ? totalGuiasRealizadas / rondas.length : 0,
      tasaExito: totalIntentos > 0 ? (totalGuiasRealizadas / totalIntentos) * 100 : 0,
      tasaCancelacion: totalIntentos > 0 ? (totalGuiasCanceladas / totalIntentos) * 100 : 0,
      mejorDia,
      peorDia,
      horasMasProductivas,
      tendencia,
    };
  }

  // ==================== ANÁLISIS GLOBAL ====================

  getAnalisisProductividad(periodo?: string): AnalisisProductividad {
    const usuarios = this.getUsuarios();
    const todasRondas = this.getRondas();
    const todasNovedades = this.getNovedades();

    // Resumenes por usuario
    const resumenes = usuarios.map(u => this.getResumenUsuario(u));

    // Top performer
    const usuarioTop = resumenes.sort((a, b) => b.totalGuiasRealizadas - a.totalGuiasRealizadas)[0]?.usuario || '';

    // Más mejorando
    const mejorando = resumenes.filter(r => r.tendencia === 'mejorando');
    const usuarioMejorando = mejorando[0]?.usuario || '';

    // Alertas
    const alertas: AlertaProductividad[] = [];

    resumenes.forEach(r => {
      // Alta tasa de cancelación
      if (r.tasaCancelacion > 20) {
        alertas.push({
          tipo: 'warning',
          usuario: r.usuario,
          mensaje: `${r.usuario} tiene tasa de cancelación alta (${r.tasaCancelacion.toFixed(1)}%)`,
          metrica: 'tasaCancelacion',
          valor: r.tasaCancelacion,
        });
      }

      // Bajo rendimiento
      if (r.promedioGuiasPorRonda < 3 && r.totalRondas >= 5) {
        alertas.push({
          tipo: 'danger',
          usuario: r.usuario,
          mensaje: `${r.usuario} tiene promedio bajo de guías por ronda (${r.promedioGuiasPorRonda.toFixed(1)})`,
          metrica: 'promedioGuiasPorRonda',
          valor: r.promedioGuiasPorRonda,
        });
      }

      // Mejorando
      if (r.tendencia === 'mejorando') {
        alertas.push({
          tipo: 'success',
          usuario: r.usuario,
          mensaje: `${r.usuario} está mejorando su rendimiento`,
          metrica: 'tendencia',
          valor: 1,
        });
      }

      // Decayendo
      if (r.tendencia === 'decayendo') {
        alertas.push({
          tipo: 'warning',
          usuario: r.usuario,
          mensaje: `${r.usuario} muestra tendencia a la baja`,
          metrica: 'tendencia',
          valor: -1,
        });
      }
    });

    // Recomendaciones IA
    const recomendacionesIA = this.generarRecomendaciones(resumenes, alertas);

    const totalGuiasRealizadas = todasRondas.reduce((s, r) => s + r.realizadas, 0);
    const totalNovedadesSolucionadas = todasNovedades.reduce((s, n) => s + n.solucionadas, 0);

    return {
      periodo: periodo || new Date().toISOString().substring(0, 7),
      totalUsuarios: usuarios.length,
      totalRondas: todasRondas.length,
      totalGuiasRealizadas,
      totalNovedadesSolucionadas,
      promedioGuiasPorUsuario: usuarios.length > 0 ? totalGuiasRealizadas / usuarios.length : 0,
      usuarioTop,
      usuarioMejorando,
      alertas,
      recomendacionesIA,
    };
  }

  private generarRecomendaciones(resumenes: ResumenUsuario[], alertas: AlertaProductividad[]): string[] {
    const recomendaciones: string[] = [];

    // Basado en horarios
    const horasPopulares: Record<string, number> = {};
    resumenes.forEach(r => {
      r.horasMasProductivas.forEach(h => {
        horasPopulares[h] = (horasPopulares[h] || 0) + 1;
      });
    });
    const mejorHora = Object.entries(horasPopulares).sort((a, b) => b[1] - a[1])[0];
    if (mejorHora) {
      recomendaciones.push(`La hora más productiva del equipo es ${mejorHora[0]}. Considerar asignar tareas críticas en ese horario.`);
    }

    // Basado en alertas
    const alertasCancelacion = alertas.filter(a => a.metrica === 'tasaCancelacion');
    if (alertasCancelacion.length > 0) {
      recomendaciones.push(`${alertasCancelacion.length} usuario(s) tienen alta tasa de cancelación. Revisar calidad de leads o capacitación.`);
    }

    // Top performer
    const top = resumenes[0];
    if (top && top.totalGuiasRealizadas > 0) {
      recomendaciones.push(`${top.usuario} es el top performer. Considerar como mentor o para tareas complejas.`);
    }

    // Balanceo de carga
    if (resumenes.length >= 2) {
      const max = Math.max(...resumenes.map(r => r.totalRondas));
      const min = Math.min(...resumenes.map(r => r.totalRondas));
      if (max > min * 2) {
        recomendaciones.push(`Hay desbalance en carga de trabajo. Considerar redistribuir tareas.`);
      }
    }

    return recomendaciones;
  }

  // ==================== ESTADÍSTICAS PARA GRÁFICOS ====================

  getEstadisticasPorDia(usuario?: string): { fecha: string; realizadas: number; canceladas: number }[] {
    const rondas = this.getRondas({ usuario });
    const porDia: Record<string, { realizadas: number; canceladas: number }> = {};

    rondas.forEach(r => {
      if (!porDia[r.fecha]) {
        porDia[r.fecha] = { realizadas: 0, canceladas: 0 };
      }
      porDia[r.fecha].realizadas += r.realizadas;
      porDia[r.fecha].canceladas += r.canceladas;
    });

    return Object.entries(porDia)
      .map(([fecha, data]) => ({ fecha, ...data }))
      .sort((a, b) => a.fecha.localeCompare(b.fecha));
  }

  getEstadisticasPorUsuario(): { usuario: string; realizadas: number; canceladas: number; novedades: number }[] {
    const usuarios = this.getUsuarios();

    return usuarios.map(usuario => {
      const rondas = this.getRondas({ usuario });
      const novedades = this.getNovedades({ usuario });

      return {
        usuario,
        realizadas: rondas.reduce((s, r) => s + r.realizadas, 0),
        canceladas: rondas.reduce((s, r) => s + r.canceladas, 0),
        novedades: novedades.reduce((s, n) => s + n.solucionadas, 0),
      };
    }).sort((a, b) => b.realizadas - a.realizadas);
  }

  // ==================== UTILIDADES ====================

  limpiarDatos(): void {
    this.rondas = [];
    this.novedades = [];
    this.saveData();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }
}

// Singleton
export const trackingService = new TrackingService();
export default trackingService;
