/**
 * 📊 ANÁLISIS DE RONDAS LITPER - TAB PRINCIPAL
 * Sistema de control y métricas de rondas logísticas
 * Integrado en Operaciones > Inteligencia Logística
 */

import React, { useState, useCallback, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
  AuthState,
  MetricasGlobales,
  MetricasUsuario,
  RondaCSV,
  AlertaGlobal,
  AlertaPersonal,
  Recomendacion,
  ReporteHistorico,
  EstadoRendimiento,
  MetricasAvanzadasUsuario,
  Anomalia,
  Problema,
  EstadoSemaforo,
  NivelRacha,
} from '../../types/analisis-rondas';
import {
  USUARIOS_OPERADORES,
  ADMIN_CONFIG,
  UMBRALES,
  STORAGE_KEYS,
  CSV_HEADERS,
  MENSAJES_RECOMENDACION,
  METRICAS_AVANZADAS,
  SEMAFORO,
} from '../../constants/analisis-rondas';
import { LoginSelector } from '../analisis-rondas/LoginSelector';
import { OperadorDashboard } from '../analisis-rondas/OperadorDashboard';
import { AdminDashboard } from '../analisis-rondas/AdminDashboard';
import { timerDataDisponible, importarRondasComoCSV } from '../../services/timerIntegrationService';

// ===== HELPERS =====
const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const saveToStorage = <T,>(key: string, data: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving to storage:', error);
  }
};

// ===== PROCESADOR CSV =====
// Headers esperados del formato LITPER TRACKER
const LITPER_HEADERS = ['fecha', 'usuario', 'ronda', 'hora inicio', 'hora fin', 'tiempo', 'iniciales', 'realizadas'];

const findHeader = (headers: string[], possibleNames: string[]): number => {
  const normalizedHeaders = headers.map(h => String(h || '').toLowerCase().trim().replace(/[_\s()]/g, ''));
  for (const name of possibleNames) {
    const normalizedName = name.toLowerCase().trim().replace(/[_\s()]/g, '');
    const index = normalizedHeaders.findIndex(h => h.includes(normalizedName) || normalizedName.includes(h));
    if (index !== -1) return index;
  }
  return -1;
};

// Detectar si una fila es la fila de headers
const isHeaderRow = (row: any[]): boolean => {
  if (!row || row.length < 5) return false;
  const rowStr = row.map(cell => String(cell || '').toLowerCase()).join(' ');
  // Debe contener al menos 3 de estos términos
  const matches = LITPER_HEADERS.filter(h => rowStr.includes(h));
  return matches.length >= 3;
};

// Detectar si una fila es válida (tiene datos)
const isValidDataRow = (row: any[]): boolean => {
  if (!row || row.length < 5) return false;
  const firstCell = String(row[0] || '').trim();
  // Ignorar filas vacías, #ERROR!, títulos, y resúmenes
  if (!firstCell) return false;
  if (firstCell.includes('#ERROR')) return false;
  if (firstCell.includes('LITPER')) return false;
  if (firstCell.includes('Usuario:')) return false;
  if (firstCell.includes('Total')) return false;
  // Verificar si parece una fecha (YYYY-MM-DD o DD/MM/YYYY)
  if (/^\d{4}-\d{2}-\d{2}$/.test(firstCell)) return true;
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(firstCell)) return true;
  // Verificar si el segundo campo es un nombre de usuario conocido
  const secondCell = String(row[1] || '').toUpperCase().trim();
  const knownUsers = ['ANGIE', 'CATALINA', 'FELIPE', 'EVAN', 'NORMAN', 'ALEJANDRA', 'KAREN', 'JIMMY', 'CAROLINA'];
  if (knownUsers.includes(secondCell)) return true;
  return false;
};

const parseCSVData = (data: any[], headers: string[]): RondaCSV[] => {
  const rondas: RondaCSV[] = [];
  const seenKeys = new Set<string>();

  // Encontrar índices de columnas
  const indices = {
    usuario: findHeader(headers, CSV_HEADERS.USUARIO),
    fecha: findHeader(headers, CSV_HEADERS.FECHA),
    horaInicio: findHeader(headers, CSV_HEADERS.HORA_INICIO),
    horaFin: findHeader(headers, CSV_HEADERS.HORA_FIN),
    ronda: findHeader(headers, CSV_HEADERS.RONDA),
    guiasIniciales: findHeader(headers, CSV_HEADERS.GUIAS_INICIALES),
    guiasRealizadas: findHeader(headers, CSV_HEADERS.GUIAS_REALIZADAS),
    canceladas: findHeader(headers, CSV_HEADERS.CANCELADAS),
    agendadas: findHeader(headers, CSV_HEADERS.AGENDADAS),
    pendientes: findHeader(headers, CSV_HEADERS.PENDIENTES),
    tiempo: findHeader(headers, CSV_HEADERS.TIEMPO),
    novedades: findHeader(headers, CSV_HEADERS.NOVEDADES),
  };

  for (const row of data) {
    if (!row || typeof row !== 'object') continue;

    const values = Object.values(row) as any[];

    const usuario = indices.usuario >= 0 ? String(values[indices.usuario] || '').toUpperCase().trim() : '';
    const fecha = indices.fecha >= 0 ? String(values[indices.fecha] || '') : new Date().toISOString().split('T')[0];
    const rondaNum = indices.ronda >= 0 ? parseInt(values[indices.ronda]) || 1 : 1;

    if (!usuario) continue;

    // Deduplicación
    const key = `${usuario}-${fecha}-${rondaNum}`;
    if (seenKeys.has(key)) continue;
    seenKeys.add(key);

    const ronda: RondaCSV = {
      usuario,
      fecha,
      horaInicio: indices.horaInicio >= 0 ? String(values[indices.horaInicio] || '00:00') : '00:00',
      horaFin: indices.horaFin >= 0 ? String(values[indices.horaFin] || '00:00') : '00:00',
      rondaNumero: rondaNum,
      guiasIniciales: indices.guiasIniciales >= 0 ? parseInt(values[indices.guiasIniciales]) || 0 : 0,
      guiasRealizadas: indices.guiasRealizadas >= 0 ? parseInt(values[indices.guiasRealizadas]) || 0 : 0,
      canceladas: indices.canceladas >= 0 ? parseInt(values[indices.canceladas]) || 0 : 0,
      agendadas: indices.agendadas >= 0 ? parseInt(values[indices.agendadas]) || 0 : 0,
      pendientes: indices.pendientes >= 0 ? parseInt(values[indices.pendientes]) || 0 : 0,
      tiempoRegistro: indices.tiempo >= 0 ? parseFloat(values[indices.tiempo]) || 0 : 0,
      novedades: indices.novedades >= 0 ? parseInt(values[indices.novedades]) || 0 : 0,
    };

    rondas.push(ronda);
  }

  return rondas;
};

const calcularEstado = (tasaExito: number): EstadoRendimiento => {
  if (tasaExito >= UMBRALES.EXCELENTE) return 'excelente';
  if (tasaExito >= UMBRALES.BUENO) return 'bueno';
  if (tasaExito >= UMBRALES.REGULAR) return 'regular';
  return 'bajo';
};

// ===== MÉTRICAS AVANZADAS =====

// Calcular eficiencia: (Guías × 3) / Tiempo Real × 100
const calcularEficiencia = (guiasRealizadas: number, tiempoTotal: number): number => {
  if (tiempoTotal <= 0) return 0;
  const tiempoEsperado = guiasRealizadas * METRICAS_AVANZADAS.TIEMPO_POR_GUIA;
  return (tiempoEsperado / tiempoTotal) * 100;
};

const calcularEstadoEficiencia = (eficiencia: number): EstadoRendimiento => {
  if (eficiencia >= METRICAS_AVANZADAS.EFICIENCIA_EXCELENTE) return 'excelente';
  if (eficiencia >= METRICAS_AVANZADAS.EFICIENCIA_BUENA) return 'bueno';
  if (eficiencia >= METRICAS_AVANZADAS.EFICIENCIA_REGULAR) return 'regular';
  return 'bajo';
};

// Calcular semáforo basado en eficiencia + tasa de éxito
const calcularSemaforo = (eficiencia: number, tasaExito: number): EstadoSemaforo => {
  if (eficiencia <= 0 && tasaExito <= 0) return 'gris';
  if (eficiencia >= SEMAFORO.VERDE.minEficiencia && tasaExito >= SEMAFORO.VERDE.minTasa) return 'verde';
  if (eficiencia >= SEMAFORO.AMARILLO.minEficiencia && tasaExito >= SEMAFORO.AMARILLO.minTasa) return 'amarillo';
  return 'rojo';
};

// Calcular nivel de racha (días consecutivos con tasa >= 70%)
const calcularNivelRacha = (diasRacha: number): { nivel: NivelRacha; icono: string } => {
  if (diasRacha >= METRICAS_AVANZADAS.RACHA_DIAS.FUEGO) {
    return { nivel: 'fuego', icono: '🔥🔥🔥' };
  }
  if (diasRacha >= METRICAS_AVANZADAS.RACHA_DIAS.CALIENTE) {
    return { nivel: 'caliente', icono: '🔥🔥' };
  }
  if (diasRacha >= METRICAS_AVANZADAS.RACHA_DIAS.ENCENDIDO) {
    return { nivel: 'encendido', icono: '🔥' };
  }
  if (diasRacha >= METRICAS_AVANZADAS.RACHA_DIAS.INICIO) {
    return { nivel: 'inicio', icono: '✨' };
  }
  return { nivel: 'ninguno', icono: '💤' };
};

// Calcular racha de días consecutivos
const calcularRacha = (rondas: RondaCSV[], usuario: string): { dias: number; nivel: NivelRacha; icono: string } => {
  const rondasUsuario = rondas.filter(r => r.usuario === usuario);
  if (rondasUsuario.length === 0) return { dias: 0, ...calcularNivelRacha(0) };

  // Agrupar por fecha
  const porFecha = new Map<string, { iniciales: number; realizadas: number }>();
  rondasUsuario.forEach(r => {
    const existing = porFecha.get(r.fecha) || { iniciales: 0, realizadas: 0 };
    porFecha.set(r.fecha, {
      iniciales: existing.iniciales + r.guiasIniciales,
      realizadas: existing.realizadas + r.guiasRealizadas,
    });
  });

  // Calcular tasa por día y ordenar fechas
  const fechasOrdenadas = Array.from(porFecha.entries())
    .map(([fecha, data]) => ({
      fecha,
      tasa: data.iniciales > 0 ? (data.realizadas / data.iniciales) * 100 : 0,
    }))
    .sort((a, b) => b.fecha.localeCompare(a.fecha)); // Más reciente primero

  // Contar días consecutivos con tasa >= 70%
  let diasConsecutivos = 0;
  for (const dia of fechasOrdenadas) {
    if (dia.tasa >= METRICAS_AVANZADAS.RACHA_MINIMA_TASA) {
      diasConsecutivos++;
    } else {
      break;
    }
  }

  return { dias: diasConsecutivos, ...calcularNivelRacha(diasConsecutivos) };
};

// Calcular métricas avanzadas para un usuario
const calcularMetricasAvanzadas = (rondas: RondaCSV[], usuario: string, tasaExito: number): MetricasAvanzadasUsuario => {
  const rondasUsuario = rondas.filter(r => r.usuario === usuario);
  const guiasRealizadas = rondasUsuario.reduce((sum, r) => sum + r.guiasRealizadas, 0);
  const tiempoTotal = rondasUsuario.reduce((sum, r) => sum + r.tiempoRegistro, 0);

  // Eficiencia
  const eficiencia = calcularEficiencia(guiasRealizadas, tiempoTotal);
  const eficienciaEstado = calcularEstadoEficiencia(eficiencia);

  // Semáforo
  const semaforo = calcularSemaforo(eficiencia, tasaExito);

  // Racha
  const racha = calcularRacha(rondas, usuario);

  // Meta diaria (usando datos del día más reciente)
  const fechaHoy = rondasUsuario[0]?.fecha || new Date().toISOString().split('T')[0];
  const rondasHoy = rondasUsuario.filter(r => r.fecha === fechaHoy);
  const guiasHoy = rondasHoy.reduce((sum, r) => sum + r.guiasRealizadas, 0);
  const progreso = (guiasHoy / METRICAS_AVANZADAS.META_DIARIA_GUIAS) * 100;
  const guiasFaltantes = METRICAS_AVANZADAS.META_DIARIA_GUIAS - guiasHoy;
  const ritmoActual = tiempoTotal > 0 ? guiasRealizadas / (tiempoTotal / 60) : METRICAS_AVANZADAS.GUIAS_POR_HORA_ESPERADAS;
  const horasRestantes = guiasFaltantes > 0 && ritmoActual > 0 ? guiasFaltantes / ritmoActual : 0;

  // Análisis por horario
  const guiasPorHora: { hora: string; guias: number; eficiencia: number }[] = [];
  const horasMap = new Map<string, { guias: number; tiempo: number }>();
  rondasUsuario.forEach(r => {
    const hora = r.horaInicio?.split(':')[0] || '00';
    const existing = horasMap.get(hora) || { guias: 0, tiempo: 0 };
    horasMap.set(hora, {
      guias: existing.guias + r.guiasRealizadas,
      tiempo: existing.tiempo + r.tiempoRegistro,
    });
  });
  horasMap.forEach((data, hora) => {
    guiasPorHora.push({
      hora: `${hora}:00`,
      guias: data.guias,
      eficiencia: data.tiempo > 0 ? calcularEficiencia(data.guias, data.tiempo) : 0,
    });
  });
  guiasPorHora.sort((a, b) => a.hora.localeCompare(b.hora));

  const mejorHora = guiasPorHora.reduce((best, curr) =>
    curr.eficiencia > (best?.eficiencia || 0) ? curr : best, guiasPorHora[0])?.hora || 'N/A';
  const peorHora = guiasPorHora.filter(h => h.guias > 0).reduce((worst, curr) =>
    curr.eficiencia < (worst?.eficiencia || 999) ? curr : worst, guiasPorHora[0])?.hora || 'N/A';

  // Resumen del día (3 números principales)
  const resumenDia = {
    numero1: { valor: Math.round(eficiencia), label: 'Eficiencia', icono: '⚡' },
    numero2: { valor: guiasHoy, label: 'Guías hoy', icono: '📦' },
    numero3: { valor: racha.dias, label: 'Días racha', icono: racha.icono },
  };

  return {
    eficiencia,
    eficienciaEstado,
    metaDiaria: {
      guiasHoy,
      metaGuias: METRICAS_AVANZADAS.META_DIARIA_GUIAS,
      progreso: Math.min(progreso, 100),
      horasRestantes: Math.max(0, horasRestantes),
    },
    racha,
    semaforo,
    analisisPorHorario: {
      mejorHora,
      peorHora,
      guiasPorHora,
    },
    resumenDia,
  };
};

// Detectar anomalías en los datos
const detectarAnomalias = (rondas: RondaCSV[]): Anomalia[] => {
  const anomalias: Anomalia[] = [];

  rondas.forEach((r, index) => {
    // Tiempo imposible (muy rápido)
    if (r.guiasRealizadas > 0 && r.tiempoRegistro > 0) {
      const tiempoPorGuia = r.tiempoRegistro / r.guiasRealizadas;
      if (tiempoPorGuia < METRICAS_AVANZADAS.TIEMPO_MINIMO_GUIA) {
        anomalias.push({
          id: `anom-tiempo-${index}`,
          tipo: 'tiempo_imposible',
          usuario: r.usuario,
          descripcion: `Tiempo por guía muy bajo: ${tiempoPorGuia.toFixed(2)} min (mín: ${METRICAS_AVANZADAS.TIEMPO_MINIMO_GUIA} min)`,
          valor: tiempoPorGuia,
          valorEsperado: METRICAS_AVANZADAS.TIEMPO_POR_GUIA,
          severidad: 'alta',
          fecha: r.fecha,
          ronda: r.rondaNumero,
        });
      }
    }

    // Guías cero con tiempo registrado
    if (r.guiasRealizadas === 0 && r.tiempoRegistro > 10) {
      anomalias.push({
        id: `anom-guias-${index}`,
        tipo: 'guias_cero',
        usuario: r.usuario,
        descripcion: `${r.tiempoRegistro} min registrados sin guías realizadas`,
        valor: 0,
        valorEsperado: Math.floor(r.tiempoRegistro / METRICAS_AVANZADAS.TIEMPO_POR_GUIA),
        severidad: 'media',
        fecha: r.fecha,
        ronda: r.rondaNumero,
      });
    }

    // Eficiencia anormalmente alta (>200%)
    if (r.guiasRealizadas > 0 && r.tiempoRegistro > 0) {
      const eficiencia = calcularEficiencia(r.guiasRealizadas, r.tiempoRegistro);
      if (eficiencia > 200) {
        anomalias.push({
          id: `anom-efic-${index}`,
          tipo: 'eficiencia_anormal',
          usuario: r.usuario,
          descripcion: `Eficiencia anormalmente alta: ${eficiencia.toFixed(0)}%`,
          valor: eficiencia,
          valorEsperado: 100,
          severidad: 'media',
          fecha: r.fecha,
          ronda: r.rondaNumero,
        });
      }
    }
  });

  return anomalias;
};

// Identificar top 3 problemas del día
const identificarTop3Problemas = (metricas: MetricasGlobales, anomalias: Anomalia[]): Problema[] => {
  const problemas: Problema[] = [];

  // Problema 1: Usuarios con bajo rendimiento
  const usuariosBajos = metricas.ranking.filter(u => u.estado === 'bajo');
  if (usuariosBajos.length > 0) {
    problemas.push({
      id: 'prob-rendimiento',
      titulo: `${usuariosBajos.length} usuario(s) con rendimiento crítico`,
      descripcion: `Tasa de éxito por debajo del 50%`,
      usuariosAfectados: usuariosBajos.map(u => u.usuario),
      impacto: usuariosBajos.length * 20,
      categoria: 'rendimiento',
      icono: '📉',
    });
  }

  // Problema 2: Alto ratio de novedades
  if (metricas.ratioNovedades > UMBRALES.ALERTA_NOVEDADES) {
    problemas.push({
      id: 'prob-novedades',
      titulo: `Alto ratio de novedades: ${metricas.ratioNovedades.toFixed(1)}%`,
      descripcion: `Supera el umbral de ${UMBRALES.ALERTA_NOVEDADES}%`,
      usuariosAfectados: metricas.ranking.filter(u =>
        u.totalGuiasIniciales > 0 && (u.novedades / u.totalGuiasIniciales) * 100 > UMBRALES.ALERTA_NOVEDADES
      ).map(u => u.usuario),
      impacto: Math.min(metricas.ratioNovedades * 5, 100),
      categoria: 'novedades',
      icono: '⚠️',
    });
  }

  // Problema 3: Anomalías detectadas
  if (anomalias.length > 0) {
    const usuariosConAnomalias = [...new Set(anomalias.map(a => a.usuario))];
    problemas.push({
      id: 'prob-anomalias',
      titulo: `${anomalias.length} anomalía(s) en datos`,
      descripcion: `Tiempos imposibles o datos inconsistentes`,
      usuariosAfectados: usuariosConAnomalias,
      impacto: Math.min(anomalias.length * 10, 100),
      categoria: 'anomalias',
      icono: '🔍',
    });
  }

  // Problema 4: Rondas con tiempo cero
  if (metricas.rondasConTiempoCero > 0) {
    problemas.push({
      id: 'prob-tiempo',
      titulo: `${metricas.rondasConTiempoCero} rondas sin tiempo registrado`,
      descripcion: `Posible error de registro`,
      usuariosAfectados: [],
      impacto: metricas.rondasConTiempoCero * 5,
      categoria: 'tiempo',
      icono: '⏱️',
    });
  }

  // Ordenar por impacto y tomar top 3
  return problemas.sort((a, b) => b.impacto - a.impacto).slice(0, 3);
};

const calcularMetricasUsuario = (rondas: RondaCSV[], usuario: string): MetricasUsuario => {
  const rondasUsuario = rondas.filter(r => r.usuario === usuario);

  const totalRondas = rondasUsuario.length;
  const totalGuiasIniciales = rondasUsuario.reduce((sum, r) => sum + r.guiasIniciales, 0);
  const guiasRealizadas = rondasUsuario.reduce((sum, r) => sum + r.guiasRealizadas, 0);
  const canceladas = rondasUsuario.reduce((sum, r) => sum + r.canceladas, 0);
  const agendadas = rondasUsuario.reduce((sum, r) => sum + r.agendadas, 0);
  const pendientes = rondasUsuario.reduce((sum, r) => sum + r.pendientes, 0);
  const novedades = rondasUsuario.reduce((sum, r) => sum + r.novedades, 0);
  const tiempoTotal = rondasUsuario.reduce((sum, r) => sum + r.tiempoRegistro, 0);

  const tasaExito = totalGuiasIniciales > 0 ? (guiasRealizadas / totalGuiasIniciales) * 100 : 0;
  const guiasPorHora = tiempoTotal > 0 ? (guiasRealizadas / (tiempoTotal / 60)) : 0;
  const tiempoPromedio = totalRondas > 0 ? tiempoTotal / totalRondas : 0;

  const estado = calcularEstado(tasaExito);

  // Generar alertas personales
  const alertas: AlertaPersonal[] = [];

  if (tasaExito < UMBRALES.ALERTA_RENDIMIENTO) {
    alertas.push({
      id: `${usuario}-rend`,
      tipo: 'urgente',
      mensaje: `Tu rendimiento (${tasaExito.toFixed(1)}%) está por debajo del ${UMBRALES.ALERTA_RENDIMIENTO}%`,
      accion: 'Revisa las rutas asignadas',
      icono: '⚠️',
    });
  }

  const ratioPendientes = totalGuiasIniciales > 0 ? (pendientes / totalGuiasIniciales) * 100 : 0;
  if (ratioPendientes > UMBRALES.ALERTA_PENDIENTES) {
    alertas.push({
      id: `${usuario}-pend`,
      tipo: 'atencion',
      mensaje: `Tienes ${pendientes} guías pendientes (${ratioPendientes.toFixed(1)}%)`,
      accion: 'Prioriza las guías pendientes',
      icono: '📋',
    });
  }

  const rondasTiempoCero = rondasUsuario.filter(r => r.tiempoRegistro < UMBRALES.TIEMPO_MINIMO_RONDA);
  if (rondasTiempoCero.length > 0) {
    alertas.push({
      id: `${usuario}-tiempo`,
      tipo: 'info',
      mensaje: `${rondasTiempoCero.length} ronda(s) con tiempo = 0 (posible error)`,
      accion: 'Verifica los registros',
      icono: '⏱️',
    });
  }

  // Calcular métricas avanzadas
  const avanzadas = calcularMetricasAvanzadas(rondas, usuario, tasaExito);

  return {
    usuario,
    totalRondas,
    totalGuiasIniciales,
    guiasRealizadas,
    canceladas,
    agendadas,
    pendientes,
    novedades,
    tasaExito,
    guiasPorHora,
    tiempoPromedio,
    tiempoTotal,
    estado,
    alertas,
    tendencia: 'estable', // Se actualiza después con calcularTendenciaDesdeHistorico
    avanzadas,
  };
};

const calcularMetricasGlobales = (rondas: RondaCSV[], duplicadosEliminados: number): MetricasGlobales => {
  // Obtener usuarios únicos
  const usuariosUnicos = [...new Set(rondas.map(r => r.usuario))];

  // Calcular métricas por usuario
  const ranking = usuariosUnicos
    .map(usuario => calcularMetricasUsuario(rondas, usuario))
    .sort((a, b) => b.tasaExito - a.tasaExito);

  // Totales globales
  const totalGuiasProcesadas = rondas.reduce((sum, r) => sum + r.guiasIniciales, 0);
  const totalGuiasRealizadas = rondas.reduce((sum, r) => sum + r.guiasRealizadas, 0);
  const totalNovedades = rondas.reduce((sum, r) => sum + r.novedades, 0);
  const totalCanceladas = rondas.reduce((sum, r) => sum + r.canceladas, 0);
  const rondasConTiempoCero = rondas.filter(r => r.tiempoRegistro < UMBRALES.TIEMPO_MINIMO_RONDA).length;

  const tasaExitoEquipo = totalGuiasProcesadas > 0
    ? (totalGuiasRealizadas / totalGuiasProcesadas) * 100
    : 0;
  const ratioNovedades = totalGuiasProcesadas > 0
    ? (totalNovedades / totalGuiasProcesadas) * 100
    : 0;
  const ratioCancelaciones = totalGuiasProcesadas > 0
    ? (totalCanceladas / totalGuiasProcesadas) * 100
    : 0;

  // Distribución de estados
  const distribucionEstados = {
    excelente: ranking.filter(u => u.estado === 'excelente').length,
    bueno: ranking.filter(u => u.estado === 'bueno').length,
    regular: ranking.filter(u => u.estado === 'regular').length,
    bajo: ranking.filter(u => u.estado === 'bajo').length,
  };

  // Métricas avanzadas globales
  const tiempoTotalEquipo = rondas.reduce((sum, r) => sum + r.tiempoRegistro, 0);
  const eficienciaEquipo = calcularEficiencia(totalGuiasRealizadas, tiempoTotalEquipo);

  // Detectar anomalías
  const anomalias = detectarAnomalias(rondas);

  // Distribución semáforo
  const semaforoEquipo = {
    verde: ranking.filter(u => u.avanzadas?.semaforo === 'verde').length,
    amarillo: ranking.filter(u => u.avanzadas?.semaforo === 'amarillo').length,
    rojo: ranking.filter(u => u.avanzadas?.semaforo === 'rojo').length,
    gris: ranking.filter(u => u.avanzadas?.semaforo === 'gris' || !u.avanzadas).length,
  };

  const metricasBase: MetricasGlobales = {
    fecha: new Date().toISOString(),
    tasaExitoEquipo,
    totalGuiasProcesadas,
    totalGuiasRealizadas,
    totalRondas: rondas.length,
    usuariosActivos: usuariosUnicos.length,
    ratioNovedades,
    ratioCancelaciones,
    duplicadosDetectados: duplicadosEliminados,
    rondasConTiempoCero,
    ranking,
    distribucionEstados,
    metaEquipo: UMBRALES.META_EXITO_EQUIPO,
    eficienciaEquipo,
    anomalias,
    semaforoEquipo,
  };

  // Identificar top 3 problemas (necesita metricas para calcular)
  const top3Problemas = identificarTop3Problemas(metricasBase, anomalias);

  return {
    ...metricasBase,
    top3Problemas,
  };
};

const generarAlertasGlobales = (metricas: MetricasGlobales): AlertaGlobal[] => {
  const alertas: AlertaGlobal[] = [];

  // Tasa de éxito baja
  if (metricas.tasaExitoEquipo < metricas.metaEquipo) {
    alertas.push({
      id: 'tasa-baja',
      tipo: metricas.tasaExitoEquipo < 50 ? 'critico' : 'urgente',
      titulo: 'Tasa de éxito por debajo del objetivo',
      descripcion: `El equipo tiene ${metricas.tasaExitoEquipo.toFixed(1)}% vs meta de ${metricas.metaEquipo}%`,
      valor: metricas.tasaExitoEquipo,
      umbral: metricas.metaEquipo,
      icono: '📉',
    });
  }

  // Ratio de novedades alto
  if (metricas.ratioNovedades > UMBRALES.ALERTA_NOVEDADES) {
    alertas.push({
      id: 'novedades-altas',
      tipo: 'atencion',
      titulo: 'Alto ratio de novedades',
      descripcion: `${metricas.ratioNovedades.toFixed(1)}% de novedades (umbral: ${UMBRALES.ALERTA_NOVEDADES}%)`,
      valor: metricas.ratioNovedades,
      umbral: UMBRALES.ALERTA_NOVEDADES,
      icono: '⚠️',
    });
  }

  // Usuarios con bajo rendimiento
  const usuariosBajos = metricas.ranking.filter(u => u.estado === 'bajo');
  if (usuariosBajos.length > 0) {
    alertas.push({
      id: 'usuarios-bajos',
      tipo: 'atencion',
      titulo: `${usuariosBajos.length} usuario(s) con rendimiento bajo`,
      descripcion: usuariosBajos.map(u => u.usuario).join(', '),
      usuariosAfectados: usuariosBajos.map(u => u.usuario),
      icono: '👥',
    });
  }

  // Rondas con tiempo cero
  if (metricas.rondasConTiempoCero > 0) {
    alertas.push({
      id: 'tiempo-cero',
      tipo: 'info',
      titulo: `${metricas.rondasConTiempoCero} ronda(s) con tiempo = 0`,
      descripcion: 'Posible error de registro o problema técnico',
      valor: metricas.rondasConTiempoCero,
      icono: '⏱️',
    });
  }

  // Duplicados detectados
  if (metricas.duplicadosDetectados > 0) {
    alertas.push({
      id: 'duplicados',
      tipo: 'info',
      titulo: `${metricas.duplicadosDetectados} registros duplicados eliminados`,
      descripcion: 'Los duplicados fueron filtrados automáticamente',
      valor: metricas.duplicadosDetectados,
      icono: '🔄',
    });
  }

  return alertas;
};

const generarRecomendaciones = (metricas: MetricasGlobales): Recomendacion[] => {
  const recomendaciones: Recomendacion[] = [];

  // Tasa de éxito crítica
  if (metricas.tasaExitoEquipo < UMBRALES.BUENO) {
    recomendaciones.push({
      id: 'rec-tasa',
      prioridad: metricas.tasaExitoEquipo < UMBRALES.REGULAR ? 'alta' : 'media',
      titulo: MENSAJES_RECOMENDACION.TASA_BAJA.titulo,
      descripcion: `Tasa actual: ${metricas.tasaExitoEquipo.toFixed(1)}%. ${MENSAJES_RECOMENDACION.TASA_BAJA.descripcion}`,
      accion: MENSAJES_RECOMENDACION.TASA_BAJA.accion,
      categoria: 'rendimiento',
      icono: '📊',
    });
  }

  // Novedades altas
  if (metricas.ratioNovedades > UMBRALES.ALERTA_NOVEDADES) {
    recomendaciones.push({
      id: 'rec-novedades',
      prioridad: metricas.ratioNovedades > 10 ? 'alta' : 'media',
      titulo: MENSAJES_RECOMENDACION.NOVEDADES_ALTAS.titulo,
      descripcion: `Ratio actual: ${metricas.ratioNovedades.toFixed(1)}%. ${MENSAJES_RECOMENDACION.NOVEDADES_ALTAS.descripcion}`,
      accion: MENSAJES_RECOMENDACION.NOVEDADES_ALTAS.accion,
      categoria: 'novedades',
      icono: '🔍',
    });
  }

  // Usuarios con bajo rendimiento
  const usuariosBajos = metricas.ranking.filter(u => u.estado === 'bajo');
  if (usuariosBajos.length > 0) {
    recomendaciones.push({
      id: 'rec-usuarios',
      prioridad: usuariosBajos.length >= 3 ? 'alta' : 'media',
      titulo: `${MENSAJES_RECOMENDACION.USUARIOS_BAJOS.titulo}: ${usuariosBajos.map(u => u.usuario).join(', ')}`,
      descripcion: MENSAJES_RECOMENDACION.USUARIOS_BAJOS.descripcion,
      accion: MENSAJES_RECOMENDACION.USUARIOS_BAJOS.accion,
      categoria: 'capacitacion',
      icono: '👥',
    });
  }

  // Rondas con tiempo cero
  if (metricas.rondasConTiempoCero > 0) {
    recomendaciones.push({
      id: 'rec-tiempo',
      prioridad: 'baja',
      titulo: MENSAJES_RECOMENDACION.TIEMPO_CERO.titulo,
      descripcion: `Se detectaron ${metricas.rondasConTiempoCero} rondas. ${MENSAJES_RECOMENDACION.TIEMPO_CERO.descripcion}`,
      accion: MENSAJES_RECOMENDACION.TIEMPO_CERO.accion,
      categoria: 'investigacion',
      icono: '🔧',
    });
  }

  // Desequilibrio de carga
  if (metricas.ranking.length >= 2) {
    const maxGuias = Math.max(...metricas.ranking.map(u => u.totalGuiasIniciales));
    const minGuias = Math.min(...metricas.ranking.map(u => u.totalGuiasIniciales));
    if (maxGuias > minGuias * 2 && minGuias > 0) {
      recomendaciones.push({
        id: 'rec-carga',
        prioridad: 'media',
        titulo: MENSAJES_RECOMENDACION.REDISTRIBUIR.titulo,
        descripcion: MENSAJES_RECOMENDACION.REDISTRIBUIR.descripcion,
        accion: MENSAJES_RECOMENDACION.REDISTRIBUIR.accion,
        categoria: 'redistribucion',
        icono: '⚖️',
      });
    }
  }

  return recomendaciones;
};

// ===== TENDENCIA DESDE HISTÓRICO =====
const calcularTendenciaDesdeHistorico = (
  usuario: string,
  tasaActual: number,
  historico: ReporteHistorico[]
): 'mejorando' | 'estable' | 'empeorando' => {
  // Tomar últimos 3-5 reportes que contengan este usuario
  const reportesConUsuario = historico
    .filter(r => r.metricas.ranking.some(u => u.usuario === usuario))
    .slice(0, 5);

  if (reportesConUsuario.length < 2) return 'estable';

  const tasasAnteriores = reportesConUsuario.map(r => {
    const u = r.metricas.ranking.find(u => u.usuario === usuario);
    return u?.tasaExito || 0;
  });

  const promedioAnterior = tasasAnteriores.reduce((s, t) => s + t, 0) / tasasAnteriores.length;
  const diferencia = tasaActual - promedioAnterior;

  if (diferencia > 5) return 'mejorando';
  if (diferencia < -5) return 'empeorando';
  return 'estable';
};

// Aplicar tendencias al ranking usando histórico
const aplicarTendencias = (metricas: MetricasGlobales, historico: ReporteHistorico[]): MetricasGlobales => {
  if (historico.length < 2) return metricas;

  const rankingConTendencia = metricas.ranking.map(u => ({
    ...u,
    tendencia: calcularTendenciaDesdeHistorico(u.usuario, u.tasaExito, historico),
  }));

  return { ...metricas, ranking: rankingConTendencia };
};

// Yield al hilo principal para no bloquear UI (fix INP)
const yieldToMain = (): Promise<void> => {
  return new Promise(resolve => {
    if ('scheduler' in window && 'yield' in (window as any).scheduler) {
      (window as any).scheduler.yield().then(resolve);
    } else {
      setTimeout(resolve, 0);
    }
  });
};

// ===== COMPONENTE PRINCIPAL =====
export const AnalisisRondasTab: React.FC = () => {
  // Estados
  const [authState, setAuthState] = useState<AuthState>(() =>
    loadFromStorage(STORAGE_KEYS.SESION, {
      usuario: null,
      esAdmin: false,
      autenticado: false,
    })
  );
  const [datos, setDatos] = useState<MetricasGlobales | null>(() =>
    loadFromStorage(STORAGE_KEYS.ULTIMO_REPORTE, null)
  );
  const [historico, setHistorico] = useState<ReporteHistorico[]>(() =>
    loadFromStorage(STORAGE_KEYS.HISTORICO, [])
  );
  const [alertasGlobales, setAlertasGlobales] = useState<AlertaGlobal[]>([]);
  const [recomendaciones, setRecomendaciones] = useState<Recomendacion[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasTimerData] = useState(() => timerDataDisponible());

  // Persistir sesión
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.SESION, authState);
  }, [authState]);

  // Persistir datos
  useEffect(() => {
    if (datos) {
      saveToStorage(STORAGE_KEYS.ULTIMO_REPORTE, datos);
    }
  }, [datos]);

  // Persistir histórico
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.HISTORICO, historico);
  }, [historico]);

  // Procesar archivo CSV/Excel
  const procesarArchivo = useCallback(async (file: File) => {
    setCargando(true);
    setError(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

      if (jsonData.length < 2) {
        throw new Error('El archivo está vacío o no tiene datos válidos');
      }

      console.log('📊 Procesando archivo LITPER TRACKER...');
      console.log('Total filas en archivo:', jsonData.length);

      // Buscar la fila de headers (puede no ser la primera)
      let headerRowIndex = -1;
      for (let i = 0; i < Math.min(jsonData.length, 20); i++) {
        if (isHeaderRow(jsonData[i])) {
          headerRowIndex = i;
          console.log('✅ Headers encontrados en fila:', i, jsonData[i]);
          break;
        }
      }

      // Si no encontramos headers, usar la primera fila no vacía con múltiples columnas
      if (headerRowIndex === -1) {
        for (let i = 0; i < Math.min(jsonData.length, 10); i++) {
          const row = jsonData[i];
          if (row && row.length >= 5 && row[0] && !String(row[0]).includes('#ERROR')) {
            headerRowIndex = i;
            console.log('⚠️ Usando fila como headers (fallback):', i);
            break;
          }
        }
      }

      if (headerRowIndex === -1) {
        throw new Error('No se encontraron headers válidos en el archivo');
      }

      const headers = (jsonData[headerRowIndex] as any[]).map(h => String(h || ''));
      console.log('📋 Headers:', headers);

      // Filtrar solo las filas de datos válidas (después de los headers)
      const validDataRows: any[][] = [];
      for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (isValidDataRow(row)) {
          validDataRows.push(row);
        }
      }

      console.log('📊 Filas de datos válidas:', validDataRows.length);

      // Convertir rows a objetos
      const dataRows = validDataRows.map(row => {
        const obj: Record<string, any> = {};
        row.forEach((cell, i) => {
          obj[headers[i] || `col${i}`] = cell;
        });
        return obj;
      });

      const totalRegistrosOriginales = dataRows.length;
      const rondas = parseCSVData(dataRows, headers);
      const duplicadosEliminados = totalRegistrosOriginales - rondas.length;

      console.log('✅ Rondas procesadas:', rondas.length);
      console.log('🔄 Duplicados eliminados:', duplicadosEliminados);

      if (rondas.length === 0) {
        throw new Error('No se encontraron datos válidos en el archivo');
      }

      // Calcular métricas (con yields para no bloquear UI - fix INP)
      await yieldToMain();
      const metricasBase = calcularMetricasGlobales(rondas, duplicadosEliminados);

      await yieldToMain();
      const metricas = aplicarTendencias(metricasBase, historico);

      await yieldToMain();
      const alertas = generarAlertasGlobales(metricas);
      const recs = generarRecomendaciones(metricas);

      setDatos(metricas);
      setAlertasGlobales(alertas);
      setRecomendaciones(recs);

      // Guardar en histórico
      const nuevoReporte: ReporteHistorico = {
        id: Date.now().toString(),
        fecha: new Date().toISOString(),
        archivoNombre: file.name,
        metricas,
        alertas,
        recomendaciones: recs,
      };

      setHistorico(prev => [nuevoReporte, ...prev].slice(0, 30)); // Max 30 reportes

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar el archivo');
      console.error('Error procesando archivo:', err);
    } finally {
      setCargando(false);
    }
  }, [historico]);

  // Exportar a Excel
  const exportarExcel = useCallback(() => {
    if (!datos) return;

    const wb = XLSX.utils.book_new();

    // Hoja de resumen
    const resumenData = [
      ['REPORTE DE ANÁLISIS DE RONDAS LITPER'],
      ['Fecha:', new Date(datos.fecha).toLocaleString()],
      [''],
      ['MÉTRICAS GLOBALES'],
      ['Tasa de Éxito del Equipo', `${datos.tasaExitoEquipo.toFixed(1)}%`],
      ['Meta del Equipo', `${datos.metaEquipo}%`],
      ['Total Guías Procesadas', datos.totalGuiasProcesadas],
      ['Total Guías Realizadas', datos.totalGuiasRealizadas],
      ['Total Rondas', datos.totalRondas],
      ['Usuarios Activos', datos.usuariosActivos],
      ['Ratio de Novedades', `${datos.ratioNovedades.toFixed(1)}%`],
      ['Duplicados Eliminados', datos.duplicadosDetectados],
    ];
    const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);
    XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');

    // Hoja de ranking
    const rankingData = [
      ['#', 'Usuario', 'Tasa Éxito', 'Guías Realizadas', 'Guías Iniciales', 'Rondas', 'G/Hora', 'Estado'],
      ...datos.ranking.map((u, i) => [
        i + 1,
        u.usuario,
        `${u.tasaExito.toFixed(1)}%`,
        u.guiasRealizadas,
        u.totalGuiasIniciales,
        u.totalRondas,
        u.guiasPorHora.toFixed(1),
        u.estado.toUpperCase(),
      ]),
    ];
    const wsRanking = XLSX.utils.aoa_to_sheet(rankingData);
    XLSX.utils.book_append_sheet(wb, wsRanking, 'Ranking');

    // Hoja de recomendaciones
    const recsData = [
      ['Prioridad', 'Título', 'Descripción', 'Acción'],
      ...recomendaciones.map(r => [r.prioridad.toUpperCase(), r.titulo, r.descripcion, r.accion]),
    ];
    const wsRecs = XLSX.utils.aoa_to_sheet(recsData);
    XLSX.utils.book_append_sheet(wb, wsRecs, 'Recomendaciones');

    // Descargar
    XLSX.writeFile(wb, `Analisis_Rondas_${new Date().toISOString().split('T')[0]}.xlsx`);
  }, [datos, recomendaciones]);

  // Exportar a PDF (simple HTML to print)
  const exportarPDF = useCallback(() => {
    if (!datos) return;
    window.print();
  }, [datos]);

  // Logout
  const handleLogout = useCallback(() => {
    setAuthState({
      usuario: null,
      esAdmin: false,
      autenticado: false,
    });
  }, []);

  // Handlers de exportación
  const handleExportar = useCallback((tipo: 'excel' | 'pdf') => {
    if (tipo === 'excel') {
      exportarExcel();
    } else {
      exportarPDF();
    }
  }, [exportarExcel, exportarPDF]);

  // Importar datos del timer
  const importarDesdeTimer = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const rondas = importarRondasComoCSV();
      if (rondas.length === 0) {
        throw new Error('No se encontraron rondas en la app del timer');
      }

      await yieldToMain();
      const metricasBase = calcularMetricasGlobales(rondas, 0);

      await yieldToMain();
      const metricas = aplicarTendencias(metricasBase, historico);

      await yieldToMain();
      const alertas = generarAlertasGlobales(metricas);
      const recs = generarRecomendaciones(metricas);

      setDatos(metricas);
      setAlertasGlobales(alertas);
      setRecomendaciones(recs);

      const nuevoReporte: ReporteHistorico = {
        id: Date.now().toString(),
        fecha: new Date().toISOString(),
        archivoNombre: `Timer Import (${rondas.length} rondas)`,
        metricas,
        alertas,
        recomendaciones: recs,
      };
      setHistorico(prev => [nuevoReporte, ...prev].slice(0, 30));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al importar del timer');
    } finally {
      setCargando(false);
    }
  }, [historico]);

  // ===== RENDER =====

  // Si hay error, mostrarlo
  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
          <div className="text-4xl mb-4">❌</div>
          <h3 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-2">
            Error al procesar
          </h3>
          <p className="text-red-600 dark:text-red-300 mb-4">{error}</p>
          <button
            onClick={() => setError(null)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Intentar de nuevo
          </button>
        </div>
      </div>
    );
  }

  // Si no está autenticado, mostrar login
  if (!authState.autenticado) {
    return <LoginSelector onLogin={setAuthState} />;
  }

  // Si es admin, mostrar dashboard completo
  if (authState.esAdmin) {
    return (
      <AdminDashboard
        datos={datos}
        historico={historico}
        alertas={alertasGlobales}
        recomendaciones={recomendaciones}
        onCargarCSV={procesarArchivo}
        onImportarTimer={importarDesdeTimer}
        timerDisponible={hasTimerData}
        onLogout={handleLogout}
        onExportar={handleExportar}
        cargando={cargando}
      />
    );
  }

  // Si es operador, mostrar vista personal
  return (
    <OperadorDashboard
      usuario={authState.usuario!}
      datos={datos}
      onCargarCSV={procesarArchivo}
      onImportarTimer={importarDesdeTimer}
      timerDisponible={hasTimerData}
      onLogout={handleLogout}
      cargando={cargando}
    />
  );
};

export default AnalisisRondasTab;
