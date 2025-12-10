import React, { useState, useMemo, useCallback } from 'react';
import {
  Package,
  Search,
  Filter,
  AlertTriangle,
  Clock,
  MapPin,
  Phone,
  ChevronDown,
  ChevronUp,
  Truck,
  Calendar,
  AlertCircle,
  Download,
  CheckCircle2,
  XCircle,
  Eye,
  TrendingUp,
  TrendingDown,
  BarChart3,
  FileSpreadsheet,
  Bell,
  Target,
  Lightbulb,
  Activity,
  Zap,
  Award,
  PieChart,
  RefreshCw,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Building2,
  Users,
  Timer,
  AlertOctagon,
  ShieldAlert,
  Info,
  ChevronRight,
  X,
} from 'lucide-react';
import { Shipment, ShipmentStatus, CarrierName, ShipmentEvent } from '../../types';
import { AlertLevel } from '../../types/logistics';
import {
  detectarGuiasRetrasadas,
  calcularDiasSinMovimiento,
} from '../../utils/patternDetection';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';

interface InteligenciaLogisticaTabProps {
  shipments: Shipment[];
}

// =====================================
// INTERFACES
// =====================================
interface GuiaLogistica {
  guia: Shipment;
  numeroGuia: string;
  transportadora: string;
  ciudadOrigen: string;
  ciudadDestino: string;
  estadoActual: string;
  diasTranscurridos: number;
  novedad: string | null;
  novedadSolucionada: boolean;
  ultimos2Estados: { fecha: string; estado: string; ubicacion: string }[];
  historialCompleto: ShipmentEvent[];
}

interface AlertaLogistica {
  id: string;
  tipo: 'critico' | 'urgente' | 'atencion' | 'advertencia';
  titulo: string;
  descripcion: string;
  guiasAfectadas: string[];
  accion: string;
  icono: React.ElementType;
}

interface PatronAnalisis {
  titulo: string;
  valor: string;
  detalle: string;
  tendencia?: 'up' | 'down' | 'stable';
  icono: React.ElementType;
  color: string;
}

interface RecomendacionIA {
  id: string;
  texto: string;
  impacto: 'alto' | 'medio' | 'bajo';
  guiasRelacionadas?: number;
}

// =====================================
// HELPERS
// =====================================
const getStatusColor = (status: string): { bg: string; text: string; border: string; dot: string } => {
  const statusLower = status.toLowerCase();

  if (statusLower.includes('entregado') || statusLower === 'delivered') {
    return { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800', dot: 'bg-emerald-500' };
  }
  if (statusLower.includes('reparto') || statusLower.includes('tránsito') || statusLower.includes('transito')) {
    return { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800', dot: 'bg-blue-500' };
  }
  if (statusLower.includes('oficina') || statusLower.includes('centro')) {
    return { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-800', dot: 'bg-purple-500' };
  }
  if (statusLower.includes('novedad') || statusLower.includes('devuelto') || statusLower.includes('rechaz')) {
    return { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-400', border: 'border-red-200 dark:border-red-800', dot: 'bg-red-500' };
  }
  if (statusLower.includes('pendiente') || statusLower.includes('reclamo')) {
    return { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800', dot: 'bg-amber-500' };
  }
  return { bg: 'bg-slate-50 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-400', border: 'border-slate-200 dark:border-slate-700', dot: 'bg-slate-400' };
};

const formatDate = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return dateStr;
  }
};

// =====================================
// COMPONENTE PRINCIPAL
// =====================================
export const InteligenciaLogisticaTab: React.FC<InteligenciaLogisticaTabProps> = ({ shipments }) => {
  // Estados
  const [searchQuery, setSearchQuery] = useState('');
  const [filtroTransportadora, setFiltroTransportadora] = useState<string>('ALL');
  const [filtroEstado, setFiltroEstado] = useState<string>('ALL');
  const [filtroCiudad, setFiltroCiudad] = useState<string>('ALL');
  const [filtroDias, setFiltroDias] = useState<string>('ALL');
  const [filtroNovedad, setFiltroNovedad] = useState<string>('ALL');
  const [expandedGuia, setExpandedGuia] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<string>('diasTranscurridos');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [activeMetricFilter, setActiveMetricFilter] = useState<string | null>(null);
  const [showAlertas, setShowAlertas] = useState(true);

  // Procesar guías con información logística
  const guiasLogisticas = useMemo((): GuiaLogistica[] => {
    return shipments.map(shipment => {
      const eventos = shipment.detailedInfo?.events || [];
      const diasTranscurridos = shipment.detailedInfo?.daysInTransit || calcularDiasSinMovimiento(shipment);

      // Obtener últimos 2 estados
      const ultimos2Estados = eventos.slice(0, 2).map(e => ({
        fecha: e.date,
        estado: e.description,
        ubicacion: e.location
      }));

      // Detectar novedad
      const estadoActual = shipment.detailedInfo?.rawStatus || shipment.status;
      const tieneNovedad = estadoActual.toLowerCase().includes('novedad') ||
                          estadoActual.toLowerCase().includes('devuelto') ||
                          estadoActual.toLowerCase().includes('rechaz');

      return {
        guia: shipment,
        numeroGuia: shipment.id,
        transportadora: shipment.carrier,
        ciudadOrigen: shipment.detailedInfo?.origin || 'N/A',
        ciudadDestino: shipment.detailedInfo?.destination || 'N/A',
        estadoActual: estadoActual,
        diasTranscurridos,
        novedad: tieneNovedad ? estadoActual : null,
        novedadSolucionada: false,
        ultimos2Estados,
        historialCompleto: eventos,
      };
    });
  }, [shipments]);

  // Estadísticas en tiempo real
  const estadisticas = useMemo(() => {
    const total = guiasLogisticas.length;
    const entregadas = guiasLogisticas.filter(g =>
      g.estadoActual.toLowerCase().includes('entregado')
    ).length;
    const enReparto = guiasLogisticas.filter(g =>
      g.estadoActual.toLowerCase().includes('reparto')
    ).length;
    const conNovedad = guiasLogisticas.filter(g => g.novedad !== null).length;
    const enReclamo = guiasLogisticas.filter(g =>
      g.estadoActual.toLowerCase().includes('reclamo') ||
      g.estadoActual.toLowerCase().includes('oficina')
    ).length;
    const devueltas = guiasLogisticas.filter(g =>
      g.estadoActual.toLowerCase().includes('devuelto')
    ).length;

    const tasaEntrega = total > 0 ? Math.round((entregadas / total) * 100) : 0;
    const tasaDevolucion = total > 0 ? Math.round((devueltas / total) * 100) : 0;

    const guiasEntregadas = guiasLogisticas.filter(g =>
      g.estadoActual.toLowerCase().includes('entregado')
    );
    const promedioDiasEntrega = guiasEntregadas.length > 0
      ? Math.round(guiasEntregadas.reduce((acc, g) => acc + g.diasTranscurridos, 0) / guiasEntregadas.length)
      : 0;

    return {
      totalActivas: total - entregadas - devueltas,
      tasaEntrega,
      tasaDevolucion,
      conNovedadSinResolver: conNovedad,
      enReclamoOficina: enReclamo,
      promedioDiasEntrega,
      total,
      entregadas,
      enReparto,
      devueltas
    };
  }, [guiasLogisticas]);

  // Generar alertas automáticas
  const alertas = useMemo((): AlertaLogistica[] => {
    const alertasGeneradas: AlertaLogistica[] = [];

    // Alertas CRÍTICAS: Guías sin movimiento > 5 días
    const sinMovimiento5Dias = guiasLogisticas.filter(g =>
      g.diasTranscurridos > 5 && !g.estadoActual.toLowerCase().includes('entregado')
    );
    if (sinMovimiento5Dias.length > 0) {
      alertasGeneradas.push({
        id: 'critico-sin-movimiento',
        tipo: 'critico',
        titulo: `${sinMovimiento5Dias.length} guías sin movimiento (+5 días)`,
        descripcion: 'Guías estancadas que requieren acción inmediata',
        guiasAfectadas: sinMovimiento5Dias.map(g => g.numeroGuia),
        accion: 'Contactar transportadora urgente',
        icono: AlertOctagon
      });
    }

    // Alertas URGENTES: Reclamo en oficina > 3 días
    const reclamoOficina3Dias = guiasLogisticas.filter(g =>
      (g.estadoActual.toLowerCase().includes('reclamo') || g.estadoActual.toLowerCase().includes('oficina')) &&
      g.diasTranscurridos > 3
    );
    if (reclamoOficina3Dias.length > 0) {
      alertasGeneradas.push({
        id: 'urgente-reclamo-oficina',
        tipo: 'urgente',
        titulo: `${reclamoOficina3Dias.length} guías en Reclamo/Oficina (+3 días)`,
        descripcion: 'Cliente debe recoger o gestionar novedad',
        guiasAfectadas: reclamoOficina3Dias.map(g => g.numeroGuia),
        accion: 'Llamar al cliente',
        icono: ShieldAlert
      });
    }

    // Alertas ATENCIÓN: Novedades sin solucionar > 24h
    const novedadesSinResolver = guiasLogisticas.filter(g =>
      g.novedad !== null && g.diasTranscurridos > 1
    );
    if (novedadesSinResolver.length > 0) {
      alertasGeneradas.push({
        id: 'atencion-novedades',
        tipo: 'atencion',
        titulo: `${novedadesSinResolver.length} novedades sin resolver (+24h)`,
        descripcion: 'Novedades que necesitan gestión',
        guiasAfectadas: novedadesSinResolver.map(g => g.numeroGuia),
        accion: 'Gestionar novedad',
        icono: AlertTriangle
      });
    }

    // Alertas ADVERTENCIA: Ciudades con baja tasa de entrega
    const ciudadesConGuias: Record<string, { total: number; entregadas: number }> = {};
    guiasLogisticas.forEach(g => {
      const ciudad = g.ciudadDestino;
      if (!ciudadesConGuias[ciudad]) ciudadesConGuias[ciudad] = { total: 0, entregadas: 0 };
      ciudadesConGuias[ciudad].total++;
      if (g.estadoActual.toLowerCase().includes('entregado')) {
        ciudadesConGuias[ciudad].entregadas++;
      }
    });

    const ciudadesProblematicas = Object.entries(ciudadesConGuias)
      .filter(([, data]) => data.total >= 3 && (data.entregadas / data.total) < 0.5)
      .map(([ciudad]) => ciudad);

    if (ciudadesProblematicas.length > 0) {
      alertasGeneradas.push({
        id: 'advertencia-ciudades',
        tipo: 'advertencia',
        titulo: `${ciudadesProblematicas.length} ciudades con tasa de entrega <50%`,
        descripcion: `Ciudades: ${ciudadesProblematicas.slice(0, 3).join(', ')}${ciudadesProblematicas.length > 3 ? '...' : ''}`,
        guiasAfectadas: guiasLogisticas
          .filter(g => ciudadesProblematicas.includes(g.ciudadDestino))
          .map(g => g.numeroGuia),
        accion: 'Revisar rutas',
        icono: Info
      });
    }

    return alertasGeneradas;
  }, [guiasLogisticas]);

  // Análisis de patrones
  const patrones = useMemo((): PatronAnalisis[] => {
    const transportadorasCount: Record<string, { total: number; entregadas: number; tiempoTotal: number }> = {};
    const novedadesCount: Record<string, number> = {};
    const diasSemanaEntregas: Record<string, number> = { Lun: 0, Mar: 0, Mie: 0, Jue: 0, Vie: 0, Sab: 0, Dom: 0 };

    guiasLogisticas.forEach(g => {
      // Transportadoras
      if (!transportadorasCount[g.transportadora]) {
        transportadorasCount[g.transportadora] = { total: 0, entregadas: 0, tiempoTotal: 0 };
      }
      transportadorasCount[g.transportadora].total++;
      if (g.estadoActual.toLowerCase().includes('entregado')) {
        transportadorasCount[g.transportadora].entregadas++;
        transportadorasCount[g.transportadora].tiempoTotal += g.diasTranscurridos;
      }

      // Novedades
      if (g.novedad) {
        const tipoNovedad = g.novedad.split(' ').slice(0, 2).join(' ');
        novedadesCount[tipoNovedad] = (novedadesCount[tipoNovedad] || 0) + 1;
      }
    });

    // Mejor transportadora (mayor tasa de entrega)
    const mejorTransportadora = Object.entries(transportadorasCount)
      .filter(([, d]) => d.total >= 2)
      .sort((a, b) => (b[1].entregadas / b[1].total) - (a[1].entregadas / a[1].total))[0];

    // Transportadora con más retrasos
    const peorTransportadora = Object.entries(transportadorasCount)
      .filter(([, d]) => d.total >= 2)
      .sort((a, b) => (a[1].entregadas / a[1].total) - (b[1].entregadas / b[1].total))[0];

    // Ciudad más problemática
    const ciudadesProblemas: Record<string, number> = {};
    guiasLogisticas.forEach(g => {
      if (g.novedad || g.diasTranscurridos > 5) {
        ciudadesProblemas[g.ciudadDestino] = (ciudadesProblemas[g.ciudadDestino] || 0) + 1;
      }
    });
    const ciudadProblematica = Object.entries(ciudadesProblemas).sort((a, b) => b[1] - a[1])[0];

    // Novedad más frecuente
    const novedadFrecuente = Object.entries(novedadesCount).sort((a, b) => b[1] - a[1])[0];

    const patronesResult: PatronAnalisis[] = [
      {
        titulo: 'Mejor Transportadora',
        valor: mejorTransportadora ? mejorTransportadora[0] : 'N/A',
        detalle: mejorTransportadora ? `${Math.round((mejorTransportadora[1].entregadas / mejorTransportadora[1].total) * 100)}% entrega` : '',
        tendencia: 'up',
        icono: Award,
        color: 'emerald'
      },
      {
        titulo: 'Más Retrasos',
        valor: peorTransportadora ? peorTransportadora[0] : 'N/A',
        detalle: peorTransportadora ? `${Math.round((peorTransportadora[1].entregadas / peorTransportadora[1].total) * 100)}% entrega` : '',
        tendencia: 'down',
        icono: TrendingDown,
        color: 'red'
      },
      {
        titulo: 'Ciudad Problemática',
        valor: ciudadProblematica ? ciudadProblematica[0] : 'N/A',
        detalle: ciudadProblematica ? `${ciudadProblematica[1]} incidencias` : '',
        tendencia: 'down',
        icono: MapPin,
        color: 'amber'
      },
      {
        titulo: 'Novedad Frecuente',
        valor: novedadFrecuente ? novedadFrecuente[0] : 'N/A',
        detalle: novedadFrecuente ? `${novedadFrecuente[1]} casos` : '',
        tendencia: 'stable',
        icono: AlertCircle,
        color: 'purple'
      },
    ];

    return patronesResult;
  }, [guiasLogisticas]);

  // Recomendaciones IA
  const recomendaciones = useMemo((): RecomendacionIA[] => {
    const recs: RecomendacionIA[] = [];

    // Analizar patrones y generar recomendaciones
    const transportadorasStats: Record<string, { total: number; entregadas: number; ciudad: string }> = {};
    guiasLogisticas.forEach(g => {
      const key = `${g.transportadora}-${g.ciudadDestino}`;
      if (!transportadorasStats[key]) {
        transportadorasStats[key] = { total: 0, entregadas: 0, ciudad: g.ciudadDestino };
      }
      transportadorasStats[key].total++;
      if (g.estadoActual.toLowerCase().includes('entregado')) {
        transportadorasStats[key].entregadas++;
      }
    });

    // Recomendación por baja tasa de entrega
    Object.entries(transportadorasStats)
      .filter(([, d]) => d.total >= 3 && (d.entregadas / d.total) < 0.4)
      .slice(0, 2)
      .forEach(([key, data]) => {
        const [transportadora, ciudad] = key.split('-');
        recs.push({
          id: `rec-evitar-${key}`,
          texto: `Considera evitar ${transportadora} para ${ciudad}, tasa de entrega ${Math.round((data.entregadas / data.total) * 100)}%`,
          impacto: 'alto',
          guiasRelacionadas: data.total
        });
      });

    // Guías que requieren llamada urgente
    const guiasUrgentes = guiasLogisticas.filter(g =>
      g.diasTranscurridos > 3 &&
      !g.estadoActual.toLowerCase().includes('entregado') &&
      (g.estadoActual.toLowerCase().includes('oficina') || g.estadoActual.toLowerCase().includes('novedad'))
    ).length;

    if (guiasUrgentes > 0) {
      recs.push({
        id: 'rec-llamadas-urgentes',
        texto: `${guiasUrgentes} guías requieren llamada urgente hoy`,
        impacto: 'alto',
        guiasRelacionadas: guiasUrgentes
      });
    }

    // Comparación de transportadoras
    const transportadorasTiempo: Record<string, { total: number; tiempoTotal: number }> = {};
    guiasLogisticas.forEach(g => {
      if (g.estadoActual.toLowerCase().includes('entregado')) {
        if (!transportadorasTiempo[g.transportadora]) {
          transportadorasTiempo[g.transportadora] = { total: 0, tiempoTotal: 0 };
        }
        transportadorasTiempo[g.transportadora].total++;
        transportadorasTiempo[g.transportadora].tiempoTotal += g.diasTranscurridos;
      }
    });

    const transportadorasOrdenadas = Object.entries(transportadorasTiempo)
      .filter(([, d]) => d.total >= 2)
      .map(([t, d]) => ({ transportadora: t, promedio: d.tiempoTotal / d.total }))
      .sort((a, b) => a.promedio - b.promedio);

    if (transportadorasOrdenadas.length >= 2) {
      const mejor = transportadorasOrdenadas[0];
      const peor = transportadorasOrdenadas[transportadorasOrdenadas.length - 1];
      const diferencia = Math.round(peor.promedio - mejor.promedio);
      if (diferencia >= 1) {
        recs.push({
          id: 'rec-comparativa',
          texto: `${mejor.transportadora} entrega ${diferencia} días más rápido que ${peor.transportadora} en promedio`,
          impacto: 'medio'
        });
      }
    }

    // Tendencia general
    const guiasActivas = guiasLogisticas.filter(g => !g.estadoActual.toLowerCase().includes('entregado')).length;
    if (guiasActivas > 10 && estadisticas.conNovedadSinResolver > guiasActivas * 0.3) {
      recs.push({
        id: 'rec-novedades-alta',
        texto: `Alto porcentaje de novedades (${Math.round((estadisticas.conNovedadSinResolver / guiasActivas) * 100)}%), revisar proceso de validación de direcciones`,
        impacto: 'medio',
        guiasRelacionadas: estadisticas.conNovedadSinResolver
      });
    }

    return recs.slice(0, 5);
  }, [guiasLogisticas, estadisticas]);

  // Obtener opciones únicas para filtros
  const opcionesFiltros = useMemo(() => {
    const transportadoras = [...new Set(guiasLogisticas.map(g => g.transportadora))].filter(Boolean);
    const estados = [...new Set(guiasLogisticas.map(g => g.estadoActual))].filter(Boolean);
    const ciudades = [...new Set(guiasLogisticas.map(g => g.ciudadDestino))].filter(Boolean);
    return { transportadoras, estados, ciudades };
  }, [guiasLogisticas]);

  // Filtrar guías
  const guiasFiltradas = useMemo(() => {
    let resultado = [...guiasLogisticas];

    // Filtro por métrica activa
    if (activeMetricFilter) {
      switch (activeMetricFilter) {
        case 'activas':
          resultado = resultado.filter(g =>
            !g.estadoActual.toLowerCase().includes('entregado') &&
            !g.estadoActual.toLowerCase().includes('devuelto')
          );
          break;
        case 'conNovedad':
          resultado = resultado.filter(g => g.novedad !== null);
          break;
        case 'enReclamo':
          resultado = resultado.filter(g =>
            g.estadoActual.toLowerCase().includes('reclamo') ||
            g.estadoActual.toLowerCase().includes('oficina')
          );
          break;
      }
    }

    // Búsqueda
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      resultado = resultado.filter(g =>
        g.numeroGuia.toLowerCase().includes(query) ||
        g.ciudadDestino.toLowerCase().includes(query) ||
        g.transportadora.toLowerCase().includes(query)
      );
    }

    // Filtros
    if (filtroTransportadora !== 'ALL') {
      resultado = resultado.filter(g => g.transportadora === filtroTransportadora);
    }
    if (filtroEstado !== 'ALL') {
      resultado = resultado.filter(g => g.estadoActual === filtroEstado);
    }
    if (filtroCiudad !== 'ALL') {
      resultado = resultado.filter(g => g.ciudadDestino === filtroCiudad);
    }
    if (filtroDias !== 'ALL') {
      const dias = parseInt(filtroDias);
      resultado = resultado.filter(g => g.diasTranscurridos >= dias);
    }
    if (filtroNovedad === 'CON') {
      resultado = resultado.filter(g => g.novedad !== null);
    } else if (filtroNovedad === 'SIN') {
      resultado = resultado.filter(g => g.novedad === null);
    }

    // Ordenamiento
    resultado.sort((a, b) => {
      let comparison = 0;
      switch (sortColumn) {
        case 'diasTranscurridos':
          comparison = a.diasTranscurridos - b.diasTranscurridos;
          break;
        case 'transportadora':
          comparison = a.transportadora.localeCompare(b.transportadora);
          break;
        case 'ciudadDestino':
          comparison = a.ciudadDestino.localeCompare(b.ciudadDestino);
          break;
        case 'estadoActual':
          comparison = a.estadoActual.localeCompare(b.estadoActual);
          break;
        default:
          comparison = a.numeroGuia.localeCompare(b.numeroGuia);
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return resultado;
  }, [guiasLogisticas, searchQuery, filtroTransportadora, filtroEstado, filtroCiudad, filtroDias, filtroNovedad, sortColumn, sortDirection, activeMetricFilter]);

  // Exportar a Excel
  const exportarExcel = useCallback(() => {
    const datosExport = guiasFiltradas.map(g => ({
      'Número de Guía': g.numeroGuia,
      'Transportadora': g.transportadora,
      'Ciudad Origen': g.ciudadOrigen,
      'Ciudad Destino': g.ciudadDestino,
      'Estado Actual': g.estadoActual,
      'Días Transcurridos': g.diasTranscurridos,
      'Novedad': g.novedad || 'Sin novedad',
      'Último Estado 1': g.ultimos2Estados[0]?.estado || '',
      'Fecha Estado 1': g.ultimos2Estados[0]?.fecha || '',
      'Último Estado 2': g.ultimos2Estados[1]?.estado || '',
      'Fecha Estado 2': g.ultimos2Estados[1]?.fecha || '',
    }));

    const ws = XLSX.utils.json_to_sheet(datosExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inteligencia Logística');
    XLSX.writeFile(wb, `inteligencia_logistica_${new Date().toISOString().split('T')[0]}.xlsx`);
  }, [guiasFiltradas]);

  // Exportar alertas a PDF
  const exportarAlertasPDF = useCallback(() => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Reporte de Alertas Logísticas', 20, 20);
    doc.setFontSize(10);
    doc.text(`Generado: ${new Date().toLocaleString('es-CO')}`, 20, 30);

    let y = 45;
    alertas.forEach((alerta, index) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(12);
      doc.setTextColor(alerta.tipo === 'critico' ? 255 : alerta.tipo === 'urgente' ? 200 : 100, 0, 0);
      doc.text(`${index + 1}. [${alerta.tipo.toUpperCase()}] ${alerta.titulo}`, 20, y);
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      y += 7;
      doc.text(`   ${alerta.descripcion}`, 20, y);
      y += 7;
      doc.text(`   Acción: ${alerta.accion}`, 20, y);
      y += 7;
      doc.text(`   Guías afectadas: ${alerta.guiasAfectadas.length}`, 20, y);
      y += 12;
    });

    doc.save(`alertas_logisticas_${new Date().toISOString().split('T')[0]}.pdf`);
  }, [alertas]);

  // Manejar click en métricas
  const handleMetricClick = (metricId: string) => {
    setActiveMetricFilter(activeMetricFilter === metricId ? null : metricId);
  };

  // Manejar ordenamiento
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  // Limpiar filtros
  const limpiarFiltros = () => {
    setSearchQuery('');
    setFiltroTransportadora('ALL');
    setFiltroEstado('ALL');
    setFiltroCiudad('ALL');
    setFiltroDias('ALL');
    setFiltroNovedad('ALL');
    setActiveMetricFilter(null);
  };

  const tieneFilrosActivos = searchQuery || filtroTransportadora !== 'ALL' || filtroEstado !== 'ALL' || filtroCiudad !== 'ALL' || filtroDias !== 'ALL' || filtroNovedad !== 'ALL' || activeMetricFilter;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl">
              <Activity className="w-6 h-6 text-white" />
            </div>
            Inteligencia Logística
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Vista operativa de análisis de guías - Solo lectura
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportarExcel}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Exportar Excel
          </button>
          <button
            onClick={exportarAlertasPDF}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-all"
          >
            <FileText className="w-4 h-4" />
            Alertas PDF
          </button>
        </div>
      </div>

      {/* Panel de Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div
          onClick={() => handleMetricClick('activas')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            activeMetricFilter === 'activas'
              ? 'bg-blue-100 dark:bg-blue-900/40 border-blue-400 ring-2 ring-blue-400'
              : 'bg-white dark:bg-navy-900 border-slate-200 dark:border-navy-700 hover:border-blue-300'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-5 h-5 text-blue-500" />
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Guías Activas</span>
          </div>
          <p className="text-2xl font-bold text-slate-800 dark:text-white">{estadisticas.totalActivas}</p>
        </div>

        <div
          className="p-4 rounded-xl border bg-white dark:bg-navy-900 border-slate-200 dark:border-navy-700"
        >
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Tasa Entrega</span>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{estadisticas.tasaEntrega}%</p>
        </div>

        <div
          className="p-4 rounded-xl border bg-white dark:bg-navy-900 border-slate-200 dark:border-navy-700"
        >
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-5 h-5 text-red-500" />
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Tasa Devolución</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{estadisticas.tasaDevolucion}%</p>
        </div>

        <div
          onClick={() => handleMetricClick('conNovedad')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            activeMetricFilter === 'conNovedad'
              ? 'bg-amber-100 dark:bg-amber-900/40 border-amber-400 ring-2 ring-amber-400'
              : 'bg-white dark:bg-navy-900 border-slate-200 dark:border-navy-700 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Con Novedad</span>
          </div>
          <p className="text-2xl font-bold text-amber-600">{estadisticas.conNovedadSinResolver}</p>
        </div>

        <div
          onClick={() => handleMetricClick('enReclamo')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            activeMetricFilter === 'enReclamo'
              ? 'bg-purple-100 dark:bg-purple-900/40 border-purple-400 ring-2 ring-purple-400'
              : 'bg-white dark:bg-navy-900 border-slate-200 dark:border-navy-700 hover:border-purple-300'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="w-5 h-5 text-purple-500" />
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">En Oficina</span>
          </div>
          <p className="text-2xl font-bold text-purple-600">{estadisticas.enReclamoOficina}</p>
        </div>

        <div
          className="p-4 rounded-xl border bg-white dark:bg-navy-900 border-slate-200 dark:border-navy-700"
        >
          <div className="flex items-center gap-2 mb-2">
            <Timer className="w-5 h-5 text-cyan-500" />
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Prom. Días</span>
          </div>
          <p className="text-2xl font-bold text-cyan-600">{estadisticas.promedioDiasEntrega}</p>
        </div>
      </div>

      {/* Sistema de Alertas */}
      {alertas.length > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-amber-50 dark:from-red-900/20 dark:to-amber-900/20 rounded-xl border border-red-200 dark:border-red-800 overflow-hidden">
          <button
            onClick={() => setShowAlertas(!showAlertas)}
            className="w-full flex items-center justify-between p-4 hover:bg-white/50 dark:hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500 rounded-lg">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-slate-800 dark:text-white">
                  {alertas.length} Alertas Activas
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {alertas.filter(a => a.tipo === 'critico').length} críticas,
                  {alertas.filter(a => a.tipo === 'urgente').length} urgentes
                </p>
              </div>
            </div>
            {showAlertas ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>

          {showAlertas && (
            <div className="px-4 pb-4 space-y-3">
              {alertas.map(alerta => {
                const AlertIcon = alerta.icono;
                const colors = {
                  critico: 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700',
                  urgente: 'bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700',
                  atencion: 'bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700',
                  advertencia: 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700',
                };
                const textColors = {
                  critico: 'text-red-700 dark:text-red-400',
                  urgente: 'text-orange-700 dark:text-orange-400',
                  atencion: 'text-amber-700 dark:text-amber-400',
                  advertencia: 'text-blue-700 dark:text-blue-400',
                };

                return (
                  <div
                    key={alerta.id}
                    className={`p-4 rounded-lg border ${colors[alerta.tipo]} flex items-start gap-4`}
                  >
                    <AlertIcon className={`w-5 h-5 ${textColors[alerta.tipo]} flex-shrink-0 mt-0.5`} />
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-bold ${textColors[alerta.tipo]}`}>{alerta.titulo}</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{alerta.descripcion}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs bg-white/50 dark:bg-black/20 px-2 py-1 rounded">
                          {alerta.guiasAfectadas.length} guías
                        </span>
                        <span className={`text-xs font-medium ${textColors[alerta.tipo]}`}>
                          {alerta.accion}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Análisis de Patrones y Recomendaciones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Patrones */}
        <div className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-700 p-5">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-5 h-5 text-purple-500" />
            <h3 className="font-bold text-slate-800 dark:text-white">Análisis de Patrones</h3>
          </div>
          <div className="space-y-3">
            {patrones.map((patron, idx) => {
              const Icon = patron.icono;
              return (
                <div key={idx} className={`p-3 rounded-lg bg-${patron.color}-50 dark:bg-${patron.color}-900/20 border border-${patron.color}-200 dark:border-${patron.color}-800`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 text-${patron.color}-600 dark:text-${patron.color}-400`} />
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{patron.titulo}</span>
                    </div>
                    {patron.tendencia && (
                      <span className="text-xs">
                        {patron.tendencia === 'up' && <ArrowUpRight className="w-4 h-4 text-emerald-500" />}
                        {patron.tendencia === 'down' && <ArrowDownRight className="w-4 h-4 text-red-500" />}
                        {patron.tendencia === 'stable' && <Minus className="w-4 h-4 text-slate-400" />}
                      </span>
                    )}
                  </div>
                  <p className={`text-lg font-bold text-${patron.color}-700 dark:text-${patron.color}-300 mt-1`}>{patron.valor}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{patron.detalle}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recomendaciones IA */}
        <div className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-700 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-slate-800 dark:text-white">Recomendaciones IA</h3>
          </div>
          <div className="space-y-3">
            {recomendaciones.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Lightbulb className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>Sin recomendaciones por ahora</p>
              </div>
            ) : (
              recomendaciones.map(rec => {
                const impactoColors = {
                  alto: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                  medio: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
                  bajo: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                };
                return (
                  <div key={rec.id} className="p-3 rounded-lg bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700">
                    <div className="flex items-start gap-3">
                      <Zap className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-slate-700 dark:text-slate-300">{rec.texto}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`text-xs px-2 py-0.5 rounded font-medium ${impactoColors[rec.impacto]}`}>
                            Impacto {rec.impacto}
                          </span>
                          {rec.guiasRelacionadas && (
                            <span className="text-xs text-slate-400">
                              {rec.guiasRelacionadas} guías
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-700 p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Búsqueda */}
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por número de guía, ciudad..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {/* Filtro Transportadora */}
          <select
            value={filtroTransportadora}
            onChange={(e) => setFiltroTransportadora(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="ALL">Todas Transportadoras</option>
            {opcionesFiltros.transportadoras.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          {/* Filtro Estado */}
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="ALL">Todos Estados</option>
            {opcionesFiltros.estados.map(e => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>

          {/* Filtro Ciudad */}
          <select
            value={filtroCiudad}
            onChange={(e) => setFiltroCiudad(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="ALL">Todas Ciudades</option>
            {opcionesFiltros.ciudades.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Filtro Días */}
          <select
            value={filtroDias}
            onChange={(e) => setFiltroDias(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="ALL">Todos Días</option>
            <option value="3">+3 días</option>
            <option value="5">+5 días</option>
            <option value="7">+7 días</option>
            <option value="10">+10 días</option>
          </select>

          {/* Filtro Novedad */}
          <select
            value={filtroNovedad}
            onChange={(e) => setFiltroNovedad(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="ALL">Con/Sin Novedad</option>
            <option value="CON">Con Novedad</option>
            <option value="SIN">Sin Novedad</option>
          </select>

          {/* Limpiar filtros */}
          {tieneFilrosActivos && (
            <button
              onClick={limpiarFiltros}
              className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-sm font-medium transition-colors"
            >
              <X className="w-4 h-4" />
              Limpiar
            </button>
          )}
        </div>

        <div className="mt-3 text-sm text-slate-500 dark:text-slate-400">
          Mostrando {guiasFiltradas.length} de {guiasLogisticas.length} guías
        </div>
      </div>

      {/* Tabla de Guías */}
      <div className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 dark:bg-navy-800 border-b border-slate-200 dark:border-navy-700">
                <th
                  className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase cursor-pointer hover:bg-slate-100 dark:hover:bg-navy-700"
                  onClick={() => handleSort('numeroGuia')}
                >
                  <div className="flex items-center gap-1">
                    Guía
                    {sortColumn === 'numeroGuia' && (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                  </div>
                </th>
                <th
                  className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase cursor-pointer hover:bg-slate-100 dark:hover:bg-navy-700"
                  onClick={() => handleSort('transportadora')}
                >
                  <div className="flex items-center gap-1">
                    Transportadora
                    {sortColumn === 'transportadora' && (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                  </div>
                </th>
                <th
                  className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase cursor-pointer hover:bg-slate-100 dark:hover:bg-navy-700"
                  onClick={() => handleSort('ciudadDestino')}
                >
                  <div className="flex items-center gap-1">
                    Ruta
                    {sortColumn === 'ciudadDestino' && (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                  </div>
                </th>
                <th
                  className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase cursor-pointer hover:bg-slate-100 dark:hover:bg-navy-700"
                  onClick={() => handleSort('estadoActual')}
                >
                  <div className="flex items-center gap-1">
                    Estado
                    {sortColumn === 'estadoActual' && (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                  </div>
                </th>
                <th
                  className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase cursor-pointer hover:bg-slate-100 dark:hover:bg-navy-700"
                  onClick={() => handleSort('diasTranscurridos')}
                >
                  <div className="flex items-center gap-1">
                    Días
                    {sortColumn === 'diasTranscurridos' && (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                  </div>
                </th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                  Últimos Estados
                </th>
                <th className="text-center px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                  Ver
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
              {guiasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No hay guías que mostrar</p>
                    <p className="text-sm">Ajusta los filtros o carga nuevos datos</p>
                  </td>
                </tr>
              ) : (
                guiasFiltradas.map(guia => {
                  const statusColors = getStatusColor(guia.estadoActual);
                  const isExpanded = expandedGuia === guia.numeroGuia;

                  return (
                    <React.Fragment key={guia.numeroGuia}>
                      <tr className={`hover:bg-slate-50 dark:hover:bg-navy-800/50 ${isExpanded ? 'bg-cyan-50 dark:bg-cyan-900/20' : ''}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-800 dark:text-white">{guia.numeroGuia}</span>
                            {guia.novedad && (
                              <span className="px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs rounded font-medium">
                                Novedad
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Truck className="w-4 h-4 text-slate-400" />
                            <span className="text-sm text-slate-600 dark:text-slate-300">{guia.transportadora}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-300">
                            <span>{guia.ciudadOrigen}</span>
                            <ChevronRight className="w-3 h-3 text-slate-400" />
                            <span className="font-medium">{guia.ciudadDestino}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${statusColors.bg} ${statusColors.text} border ${statusColors.border}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusColors.dot}`}></span>
                            {guia.estadoActual}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Clock className={`w-4 h-4 ${guia.diasTranscurridos > 5 ? 'text-red-500' : guia.diasTranscurridos > 3 ? 'text-amber-500' : 'text-slate-400'}`} />
                            <span className={`font-bold ${guia.diasTranscurridos > 5 ? 'text-red-600' : guia.diasTranscurridos > 3 ? 'text-amber-600' : 'text-slate-600 dark:text-slate-300'}`}>
                              {guia.diasTranscurridos}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            {guia.ultimos2Estados.slice(0, 2).map((estado, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-xs">
                                <span className="text-slate-400 font-mono">{formatDate(estado.fecha)}</span>
                                <span className="text-slate-600 dark:text-slate-400 truncate max-w-[200px]">
                                  {estado.estado}
                                </span>
                              </div>
                            ))}
                            {guia.ultimos2Estados.length === 0 && (
                              <span className="text-xs text-slate-400">Sin información</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => setExpandedGuia(isExpanded ? null : guia.numeroGuia)}
                            className={`p-2 rounded-lg transition-colors ${
                              isExpanded
                                ? 'bg-cyan-500 text-white'
                                : 'bg-slate-100 dark:bg-navy-700 text-slate-600 dark:text-slate-300 hover:bg-cyan-100 dark:hover:bg-cyan-900/30'
                            }`}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>

                      {/* Fila expandida con historial completo */}
                      {isExpanded && (
                        <tr className="bg-cyan-50/50 dark:bg-cyan-900/10">
                          <td colSpan={7} className="px-4 py-4">
                            <div className="bg-white dark:bg-navy-800 rounded-lg p-4 border border-cyan-200 dark:border-cyan-800">
                              <h4 className="font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-cyan-500" />
                                Historial Completo de Movimientos
                              </h4>
                              {guia.historialCompleto.length === 0 ? (
                                <p className="text-sm text-slate-400">No hay historial de movimientos disponible</p>
                              ) : (
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                  {guia.historialCompleto.map((evento, idx) => (
                                    <div key={idx} className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-navy-700/50">
                                      <div className={`w-2 h-2 rounded-full mt-2 ${idx === 0 ? 'bg-cyan-500' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                          <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                                            {formatDate(evento.date)}
                                          </span>
                                          {evento.isRecent && (
                                            <span className="px-1.5 py-0.5 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 text-xs rounded">
                                              Reciente
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
                                          {evento.description}
                                        </p>
                                        {evento.location && (
                                          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                                            <MapPin className="w-3 h-3" />
                                            {evento.location}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer info */}
      <div className="text-center text-sm text-slate-400">
        <p>Vista de solo lectura - Los datos se sincronizan con el módulo de Seguimiento de Guías</p>
      </div>
    </div>
  );
};

export default InteligenciaLogisticaTab;
