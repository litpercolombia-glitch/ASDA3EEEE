import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Bloque, ContadoresGuias, ContadoresNovedad, calcularTotDevoluciones } from '../stores/appStore';
import { TipoProceso } from '../config/processConfig';

// Obtener fecha formateada para nombre de archivo
const getFechaArchivo = (): string => {
  return new Date().toISOString().split('T')[0];
};

// Calcular % éxito para Guías
const calcularPorcentajeExito = (c: ContadoresGuias): string => {
  const total = c.realizado + c.cancelados;
  if (total === 0) return '0%';
  return `${Math.round((c.realizado / total) * 1000) / 10}%`;
};

// Calcular % solucionado para Novedad
const calcularPorcentajeSolucionado = (c: ContadoresNovedad): string => {
  if (c.novedadesIniciales === 0) return '0%';
  return `${Math.round((c.novedadesSolucionadas / c.novedadesIniciales) * 1000) / 10}%`;
};

// Formatear duración en minutos
const formatearDuracion = (segundos: number): string => {
  const minutos = Math.floor(segundos / 60);
  return `${minutos} min`;
};

// Exportar bloques de Guías
export const exportarGuias = (bloques: Bloque[], soloHoy: boolean = true) => {
  const bloquesGuias = bloques.filter(b => b.tipoProceso === 'guias');
  const fecha = getFechaArchivo();

  if (bloquesGuias.length === 0) {
    alert('No hay bloques de Guías para exportar');
    return;
  }

  // Hoja 1: Resumen
  const resumenData = bloquesGuias.reduce((acc, b) => {
    const c = b.contadoresGuias!;
    return {
      realizado: acc.realizado + c.realizado,
      cancelados: acc.cancelados + c.cancelados,
      agendados: acc.agendados + c.agendados,
      dificiles: acc.dificiles + c.dificiles,
      pedidoPendiente: acc.pedidoPendiente + c.pedidoPendiente,
      revisado: acc.revisado + c.revisado,
    };
  }, { realizado: 0, cancelados: 0, agendados: 0, dificiles: 0, pedidoPendiente: 0, revisado: 0 });

  const resumen = [{
    'Fecha': fecha,
    'Bloques': bloquesGuias.length,
    'Realizado': resumenData.realizado,
    'Cancelados': resumenData.cancelados,
    'Agendados': resumenData.agendados,
    'Difíciles': resumenData.dificiles,
    'Pendiente': resumenData.pedidoPendiente,
    'Revisado': resumenData.revisado,
    '% Éxito': calcularPorcentajeExito(resumenData as ContadoresGuias),
  }];

  // Hoja 2: Detalle por bloque
  const detalle = bloquesGuias.map((b, i) => {
    const c = b.contadoresGuias!;
    return {
      '#': i + 1,
      'Inicio': b.horaInicio,
      'Fin': b.horaFin,
      'Duración': formatearDuracion(b.tiempoTotal),
      'Realizado': c.realizado,
      'Cancelados': c.cancelados,
      'Agendados': c.agendados,
      'Difíciles': c.dificiles,
      'Pendiente': c.pedidoPendiente,
      'Revisado': c.revisado,
      'Prom/min': b.promedioMinuto,
      '% Éxito': calcularPorcentajeExito(c),
    };
  });

  // Crear workbook
  const wb = XLSX.utils.book_new();

  const wsResumen = XLSX.utils.json_to_sheet(resumen);
  XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');

  const wsDetalle = XLSX.utils.json_to_sheet(detalle);
  XLSX.utils.book_append_sheet(wb, wsDetalle, 'Detalle Bloques');

  // Guardar archivo
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/octet-stream' });
  saveAs(blob, `LITPER_Guias_${fecha}.xlsx`);

  return { bloques: bloquesGuias.length, registros: resumenData.realizado };
};

// Exportar bloques de Novedad
export const exportarNovedad = (bloques: Bloque[], soloHoy: boolean = true) => {
  const bloquesNovedad = bloques.filter(b => b.tipoProceso === 'novedad');
  const fecha = getFechaArchivo();

  if (bloquesNovedad.length === 0) {
    alert('No hay bloques de Novedad para exportar');
    return;
  }

  // Hoja 1: Resumen
  const resumenData = bloquesNovedad.reduce((acc, b) => {
    const c = b.contadoresNovedad!;
    return {
      novedadesIniciales: acc.novedadesIniciales + c.novedadesIniciales,
      novedadesSolucionadas: acc.novedadesSolucionadas + c.novedadesSolucionadas,
      novedadesRevisadas: acc.novedadesRevisadas + c.novedadesRevisadas,
      novedadesFinalePendientes: acc.novedadesFinalePendientes + c.novedadesFinalePendientes,
      devolucionLitper: acc.devolucionLitper + c.devolucionLitper,
      devolucion3Intentos: acc.devolucion3Intentos + c.devolucion3Intentos,
      devolucionErrorTransportadora: acc.devolucionErrorTransportadora + c.devolucionErrorTransportadora,
      devolucionProveedor: acc.devolucionProveedor + c.devolucionProveedor,
    };
  }, {
    novedadesIniciales: 0,
    novedadesSolucionadas: 0,
    novedadesRevisadas: 0,
    novedadesFinalePendientes: 0,
    devolucionLitper: 0,
    devolucion3Intentos: 0,
    devolucionErrorTransportadora: 0,
    devolucionProveedor: 0,
  });

  const resumen = [{
    'Fecha': fecha,
    'Bloques': bloquesNovedad.length,
    'Iniciales': resumenData.novedadesIniciales,
    'Solucionadas': resumenData.novedadesSolucionadas,
    'Revisadas': resumenData.novedadesRevisadas,
    'Pendientes': resumenData.novedadesFinalePendientes,
    'Dev.LITPER': resumenData.devolucionLitper,
    'Dev.3Int': resumenData.devolucion3Intentos,
    'Dev.Transp': resumenData.devolucionErrorTransportadora,
    'Dev.Prov': resumenData.devolucionProveedor,
    'TOT Dev': calcularTotDevoluciones(resumenData as ContadoresNovedad),
    '% Solucionado': calcularPorcentajeSolucionado(resumenData as ContadoresNovedad),
  }];

  // Hoja 2: Detalle por bloque
  const detalle = bloquesNovedad.map((b, i) => {
    const c = b.contadoresNovedad!;
    return {
      '#': i + 1,
      'Inicio': b.horaInicio,
      'Fin': b.horaFin,
      'Duración': formatearDuracion(b.tiempoTotal),
      'Iniciales': c.novedadesIniciales,
      'Solucionadas': c.novedadesSolucionadas,
      'Revisadas': c.novedadesRevisadas,
      'Pendientes': c.novedadesFinalePendientes,
      'Dev.LITPER': c.devolucionLitper,
      'Dev.3Int': c.devolucion3Intentos,
      'Dev.Transp': c.devolucionErrorTransportadora,
      'Dev.Prov': c.devolucionProveedor,
      'TOT Dev': calcularTotDevoluciones(c),
    };
  });

  // Crear workbook
  const wb = XLSX.utils.book_new();

  const wsResumen = XLSX.utils.json_to_sheet(resumen);
  XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');

  const wsDetalle = XLSX.utils.json_to_sheet(detalle);
  XLSX.utils.book_append_sheet(wb, wsDetalle, 'Detalle Bloques');

  // Guardar archivo
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/octet-stream' });
  saveAs(blob, `LITPER_Novedad_${fecha}.xlsx`);

  return { bloques: bloquesNovedad.length, registros: resumenData.novedadesIniciales };
};

// Exportar ambos procesos
export const exportarTodo = (bloques: Bloque[]) => {
  const fecha = getFechaArchivo();
  const wb = XLSX.utils.book_new();

  // Guías
  const bloquesGuias = bloques.filter(b => b.tipoProceso === 'guias');
  if (bloquesGuias.length > 0) {
    const detalleGuias = bloquesGuias.map((b, i) => {
      const c = b.contadoresGuias!;
      return {
        '#': i + 1,
        'Inicio': b.horaInicio,
        'Fin': b.horaFin,
        'Realizado': c.realizado,
        'Cancelados': c.cancelados,
        'Agendados': c.agendados,
        'Difíciles': c.dificiles,
        'Pendiente': c.pedidoPendiente,
        'Revisado': c.revisado,
        '% Éxito': calcularPorcentajeExito(c),
      };
    });
    const wsGuias = XLSX.utils.json_to_sheet(detalleGuias);
    XLSX.utils.book_append_sheet(wb, wsGuias, 'Guías');
  }

  // Novedad
  const bloquesNovedad = bloques.filter(b => b.tipoProceso === 'novedad');
  if (bloquesNovedad.length > 0) {
    const detalleNovedad = bloquesNovedad.map((b, i) => {
      const c = b.contadoresNovedad!;
      return {
        '#': i + 1,
        'Inicio': b.horaInicio,
        'Fin': b.horaFin,
        'Iniciales': c.novedadesIniciales,
        'Solucionadas': c.novedadesSolucionadas,
        'Revisadas': c.novedadesRevisadas,
        'Pendientes': c.novedadesFinalePendientes,
        'TOT Dev': calcularTotDevoluciones(c),
      };
    });
    const wsNovedad = XLSX.utils.json_to_sheet(detalleNovedad);
    XLSX.utils.book_append_sheet(wb, wsNovedad, 'Novedad');
  }

  if (bloquesGuias.length === 0 && bloquesNovedad.length === 0) {
    alert('No hay bloques para exportar');
    return;
  }

  // Guardar archivo
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/octet-stream' });
  saveAs(blob, `LITPER_Completo_${fecha}.xlsx`);

  return { bloques: bloquesGuias.length + bloquesNovedad.length };
};

// Exportar un bloque individual
export const exportarBloque = (bloque: Bloque) => {
  const fecha = getFechaArchivo();
  const wb = XLSX.utils.book_new();

  let data: any[];
  let nombreArchivo: string;

  if (bloque.tipoProceso === 'guias') {
    const c = bloque.contadoresGuias!;
    data = [{
      'Bloque': bloque.id,
      'Fecha': bloque.fecha,
      'Inicio': bloque.horaInicio,
      'Fin': bloque.horaFin,
      'Duración': formatearDuracion(bloque.tiempoTotal),
      'Realizado': c.realizado,
      'Cancelados': c.cancelados,
      'Agendados': c.agendados,
      'Difíciles': c.dificiles,
      'Pendiente': c.pedidoPendiente,
      'Revisado': c.revisado,
      '% Éxito': calcularPorcentajeExito(c),
      'Prom/min': bloque.promedioMinuto,
    }];
    nombreArchivo = `LITPER_Guias_Bloque_${fecha}.xlsx`;
  } else {
    const c = bloque.contadoresNovedad!;
    data = [{
      'Bloque': bloque.id,
      'Fecha': bloque.fecha,
      'Inicio': bloque.horaInicio,
      'Fin': bloque.horaFin,
      'Duración': formatearDuracion(bloque.tiempoTotal),
      'Iniciales': c.novedadesIniciales,
      'Solucionadas': c.novedadesSolucionadas,
      'Revisadas': c.novedadesRevisadas,
      'Pendientes': c.novedadesFinalePendientes,
      'Dev.LITPER': c.devolucionLitper,
      'Dev.3Int': c.devolucion3Intentos,
      'Dev.Transp': c.devolucionErrorTransportadora,
      'Dev.Prov': c.devolucionProveedor,
      'TOT Dev': calcularTotDevoluciones(c),
    }];
    nombreArchivo = `LITPER_Novedad_Bloque_${fecha}.xlsx`;
  }

  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, 'Bloque');

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/octet-stream' });
  saveAs(blob, nombreArchivo);
};
