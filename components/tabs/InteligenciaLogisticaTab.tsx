import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  Package,
  Search,
  AlertTriangle,
  Clock,
  MapPin,
  ChevronDown,
  ChevronUp,
  Truck,
  Calendar,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Eye,
  TrendingUp,
  TrendingDown,
  BarChart3,
  FileSpreadsheet,
  Bell,
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
  Timer,
  AlertOctagon,
  ShieldAlert,
  Info,
  ChevronRight,
  X,
  Upload,
  FileUp,
  Table,
  Phone,
  Copy,
  CheckCircle,
  MessageSquare,
  PhoneCall,
  Target,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';

// =====================================
// INTERFACES
// =====================================
interface EventoLogistico {
  fecha: string;
  ubicacion: string;
  descripcion: string;
}

interface GuiaLogistica {
  numeroGuia: string;
  telefono?: string;
  transportadora: string;
  ciudadOrigen: string;
  ciudadDestino: string;
  estadoActual: string;
  diasTranscurridos: number;
  tieneNovedad: boolean;
  ultimos2Estados: EventoLogistico[];
  historialCompleto: EventoLogistico[];
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
  if (statusLower.includes('reparto') || statusLower.includes('tránsito') || statusLower.includes('transito') || statusLower.includes('viajando') || statusLower.includes('camino')) {
    return { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800', dot: 'bg-blue-500' };
  }
  if (statusLower.includes('oficina') || statusLower.includes('centro') || statusLower.includes('recogido')) {
    return { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-800', dot: 'bg-purple-500' };
  }
  if (statusLower.includes('novedad') || statusLower.includes('devuelto') || statusLower.includes('rechaz') || statusLower.includes('alerta') || statusLower.includes('no logramos')) {
    return { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-400', border: 'border-red-200 dark:border-red-800', dot: 'bg-red-500' };
  }
  if (statusLower.includes('pendiente') || statusLower.includes('reclamo')) {
    return { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800', dot: 'bg-amber-500' };
  }
  return { bg: 'bg-slate-50 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-400', border: 'border-slate-200 dark:border-slate-700', dot: 'bg-slate-400' };
};

const formatDate = (dateStr: string): string => {
  try {
    // Manejar formato "2025-11-29 10:20"
    const parts = dateStr.split(' ');
    if (parts.length >= 2) {
      const datePart = parts[0];
      const timePart = parts[1];
      const [year, month, day] = datePart.split('-');
      const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
      return `${day} de ${months[parseInt(month) - 1]} de ${year}, ${timePart}`;
    }
    return dateStr;
  } catch {
    return dateStr;
  }
};

// =====================================
// PARSER DE TEXTO DE TRACKING
// =====================================
const parseTrackingText = (text: string, phoneRegistry?: Map<string, string>): GuiaLogistica[] => {
  const guias: GuiaLogistica[] = [];
  const blocks = text.split('======================================').filter(b => b.trim());

  for (const block of blocks) {
    const lines = block.trim().split('\n').filter(l => l.trim());
    if (lines.length < 3) continue;

    let numeroGuia = '';
    let estadoPaquete = '';
    let diasTranscurridos = 0;
    let ciudadOrigen = 'Colombia';
    let ciudadDestino = 'Desconocido';
    let transportadora = '';
    const eventos: EventoLogistico[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Número de guía
      if (line.startsWith('Número:')) {
        numeroGuia = line.replace('Número:', '').trim();
      }
      // Estatus del paquete
      else if (line.startsWith('Estatus del paquete:')) {
        const match = line.match(/Estatus del paquete:\s*(.+?)\s*\((\d+)\s*Días?\)/i);
        if (match) {
          estadoPaquete = match[1].trim();
          diasTranscurridos = parseInt(match[2]);
        } else {
          estadoPaquete = line.replace('Estatus del paquete:', '').trim();
        }
      }
      // País (ruta)
      else if (line.startsWith('País:')) {
        const rutaMatch = line.match(/País:\s*(.+?)\s*->\s*(.+)/);
        if (rutaMatch) {
          ciudadOrigen = rutaMatch[1].trim();
          ciudadDestino = rutaMatch[2].trim();
        }
      }
      // Transportadora
      else if (line.includes('(') && line.includes(')') && !line.match(/^\d{4}-\d{2}-\d{2}/)) {
        transportadora = line.split('(')[0].trim();
      }
      // Eventos de tracking (líneas que empiezan con fecha)
      else if (line.match(/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/)) {
        const eventoMatch = line.match(/^(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})\s+(.+?)\s+(.+)$/);
        if (eventoMatch) {
          eventos.push({
            fecha: eventoMatch[1],
            ubicacion: eventoMatch[2].trim(),
            descripcion: eventoMatch[3].trim(),
          });
        }
      }
    }

    if (numeroGuia) {
      // Detectar novedad
      const tieneNovedad = estadoPaquete.toLowerCase().includes('alerta') ||
                          estadoPaquete.toLowerCase().includes('novedad') ||
                          estadoPaquete.toLowerCase().includes('devuelto') ||
                          eventos.some(e => e.descripcion.toLowerCase().includes('devuelto') ||
                                           e.descripcion.toLowerCase().includes('no logramos'));

      // Determinar estado actual basado en el último evento
      let estadoActual = estadoPaquete;
      if (eventos.length > 0) {
        const ultimoEvento = eventos[0].descripcion.toLowerCase();
        if (ultimoEvento.includes('entregado')) estadoActual = 'Entregado';
        else if (ultimoEvento.includes('devuelto')) estadoActual = 'Tu envío Fue devuelto';
        else if (ultimoEvento.includes('centro logístico destino') || ultimoEvento.includes('recoger')) estadoActual = 'En Centro Logístico Destino';
        else if (ultimoEvento.includes('viajando') || ultimoEvento.includes('camino')) estadoActual = 'En Reparto';
        else if (ultimoEvento.includes('recibimos')) estadoActual = 'Recibido';
      }

      // Buscar teléfono en el registro
      const telefono = phoneRegistry?.get(numeroGuia);

      guias.push({
        numeroGuia,
        telefono,
        transportadora: transportadora || 'Desconocido',
        ciudadOrigen,
        ciudadDestino,
        estadoActual,
        diasTranscurridos,
        tieneNovedad,
        ultimos2Estados: eventos.slice(0, 2),
        historialCompleto: eventos,
      });
    }
  }

  return guias;
};

// Parser de registro de teléfonos
// Formatos soportados:
// - guía,teléfono (CSV)
// - guía teléfono (separado por espacio/tab)
// - teléfono guía (detecta automáticamente)
const parsePhoneRegistry = (text: string): Map<string, string> => {
  const registry = new Map<string, string>();
  const lines = text.trim().split('\n').filter(l => l.trim());

  for (const line of lines) {
    // Limpiar la línea
    const cleanLine = line.trim();
    if (!cleanLine) continue;

    // Detectar separador (coma, tab, o espacios)
    let parts: string[] = [];
    if (cleanLine.includes(',')) {
      parts = cleanLine.split(',').map(p => p.trim());
    } else if (cleanLine.includes('\t')) {
      parts = cleanLine.split('\t').map(p => p.trim());
    } else {
      parts = cleanLine.split(/\s+/).map(p => p.trim());
    }

    if (parts.length >= 2) {
      const part1 = parts[0].replace(/\D/g, ''); // Solo dígitos
      const part2 = parts[1].replace(/\D/g, '');

      // Detectar cuál es guía y cuál es teléfono
      // Guías suelen tener 12+ dígitos, teléfonos colombianos 10 dígitos
      let guia = '';
      let telefono = '';

      if (part1.length >= 10 && part1.length <= 11) {
        // part1 parece teléfono
        telefono = part1;
        guia = part2;
      } else if (part2.length >= 10 && part2.length <= 11) {
        // part2 parece teléfono
        guia = part1;
        telefono = part2;
      } else if (part1.length > part2.length) {
        // El más largo es probablemente la guía
        guia = part1;
        telefono = part2;
      } else {
        guia = part2;
        telefono = part1;
      }

      if (guia && telefono) {
        registry.set(guia, telefono);
      }
    }
  }

  return registry;
};

// =====================================
// COMPONENTE PRINCIPAL
// =====================================
export const InteligenciaLogisticaTab: React.FC = () => {
  // Estados
  const [guiasLogisticas, setGuiasLogisticas] = useState<GuiaLogistica[]>([]);
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
  const [isLoading, setIsLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [phoneInput, setPhoneInput] = useState(''); // Registro de teléfonos
  const [copiedGuide, setCopiedGuide] = useState<string | null>(null);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Función para copiar al portapapeles
  const copyToClipboard = (text: string, type: 'guide' | 'phone', id: string) => {
    navigator.clipboard.writeText(text);
    if (type === 'guide') {
      setCopiedGuide(id);
      setTimeout(() => setCopiedGuide(null), 2000);
    } else {
      setCopiedPhone(id);
      setTimeout(() => setCopiedPhone(null), 2000);
    }
  };

  // Abrir WhatsApp
  const openWhatsApp = (phone: string, guideNumber: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const message = encodeURIComponent(
      `Hola! Te contactamos respecto a tu pedido con guía ${guideNumber}. ¿Podrías confirmar tu disponibilidad para la entrega?`
    );
    window.open(`https://wa.me/57${cleanPhone}?text=${message}`, '_blank');
  };

  // Llamar
  const makeCall = (phone: string) => {
    window.open(`tel:${phone}`, '_self');
  };

  // Cargar datos desde texto
  const handleLoadFromText = () => {
    if (!textInput.trim()) return;
    setIsLoading(true);
    try {
      // Parsear registro de teléfonos si existe
      const phoneRegistry = phoneInput.trim() ? parsePhoneRegistry(phoneInput) : undefined;
      const guias = parseTrackingText(textInput, phoneRegistry);
      setGuiasLogisticas(guias);
      setShowUploadModal(false);
      setTextInput('');
      setPhoneInput('');
    } catch (error) {
      console.error('Error parsing text:', error);
      alert('Error al procesar el texto. Verifica el formato.');
    } finally {
      setIsLoading(false);
    }
  };

  // Actualizar teléfonos de guías existentes
  const handleUpdatePhones = () => {
    if (!phoneInput.trim() || guiasLogisticas.length === 0) return;
    const phoneRegistry = parsePhoneRegistry(phoneInput);
    const updatedGuias = guiasLogisticas.map(guia => ({
      ...guia,
      telefono: phoneRegistry.get(guia.numeroGuia) || guia.telefono
    }));
    setGuiasLogisticas(updatedGuias);
    setPhoneInput('');
    alert(`Teléfonos actualizados: ${phoneRegistry.size} registros procesados`);
  };

  // Cargar datos desde archivo Excel/TXT
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const text = await file.text();
      const guias = parseTrackingText(text);
      setGuiasLogisticas(guias);
      setShowUploadModal(false);
    } catch (error) {
      console.error('Error reading file:', error);
      alert('Error al leer el archivo.');
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Estadísticas en tiempo real
  const estadisticas = useMemo(() => {
    const total = guiasLogisticas.length;
    const entregadas = guiasLogisticas.filter(g =>
      g.estadoActual.toLowerCase().includes('entregado')
    ).length;
    const enReparto = guiasLogisticas.filter(g =>
      g.estadoActual.toLowerCase().includes('reparto') || g.estadoActual.toLowerCase().includes('viajando')
    ).length;
    const conNovedad = guiasLogisticas.filter(g => g.tieneNovedad).length;
    const enCentro = guiasLogisticas.filter(g =>
      g.estadoActual.toLowerCase().includes('centro') || g.estadoActual.toLowerCase().includes('oficina')
    ).length;
    const devueltas = guiasLogisticas.filter(g =>
      g.estadoActual.toLowerCase().includes('devuelto')
    ).length;

    const tasaEntrega = total > 0 ? Math.round((entregadas / total) * 100) : 0;
    const tasaDevolucion = total > 0 ? Math.round((devueltas / total) * 1000) / 10 : 0; // 1 decimal

    const guiasEntregadas = guiasLogisticas.filter(g =>
      g.estadoActual.toLowerCase().includes('entregado')
    );
    const promedioDiasEntrega = guiasEntregadas.length > 0
      ? Math.round(guiasEntregadas.reduce((acc, g) => acc + g.diasTranscurridos, 0) / guiasEntregadas.length)
      : 0;

    // Guías en riesgo: guías que pueden ser rescatadas (con novedad recuperable o en situación crítica)
    // Incluye: guías con novedad, en centro/oficina sin recoger, sin movimiento >48h
    const guiasEnRiesgo = guiasLogisticas.filter(g => {
      const estado = g.estadoActual.toLowerCase();
      const esEntregado = estado.includes('entregado');
      const esDevuelto = estado.includes('devuelto');
      if (esEntregado || esDevuelto) return false;

      // Criterios de riesgo rescatable
      const tieneNovedadRecuperable = g.tieneNovedad;
      const enCentroSinRecoger = estado.includes('centro') || estado.includes('oficina') || estado.includes('reclamo');
      const sinMovimientoMucho = g.diasTranscurridos > 2;
      const intentoFallido = estado.includes('no logramos') || estado.includes('no estaba');

      return tieneNovedadRecuperable || enCentroSinRecoger || sinMovimientoMucho || intentoFallido;
    }).length;

    return {
      totalActivas: total - entregadas - devueltas,
      tasaEntrega,
      tasaDevolucion,
      conNovedadSinResolver: conNovedad,
      enReclamoOficina: enCentro,
      promedioDiasEntrega,
      total,
      entregadas,
      enReparto,
      devueltas,
      guiasEnRiesgo,
      metaDevolucion: 8 // Meta fija de 8%
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
        titulo: `${sinMovimiento5Dias.length} guías con +5 días`,
        descripcion: 'Guías que requieren acción inmediata',
        guiasAfectadas: sinMovimiento5Dias.map(g => g.numeroGuia),
        accion: 'Contactar transportadora urgente',
        icono: AlertOctagon
      });
    }

    // Alertas URGENTES: Guías devueltas
    const devueltas = guiasLogisticas.filter(g =>
      g.estadoActual.toLowerCase().includes('devuelto')
    );
    if (devueltas.length > 0) {
      alertasGeneradas.push({
        id: 'urgente-devueltas',
        tipo: 'urgente',
        titulo: `${devueltas.length} guías devueltas`,
        descripcion: 'Envíos que fueron devueltos',
        guiasAfectadas: devueltas.map(g => g.numeroGuia),
        accion: 'Gestionar reenvío o contactar cliente',
        icono: ShieldAlert
      });
    }

    // Alertas ATENCIÓN: Novedades
    const novedades = guiasLogisticas.filter(g => g.tieneNovedad && !g.estadoActual.toLowerCase().includes('devuelto'));
    if (novedades.length > 0) {
      alertasGeneradas.push({
        id: 'atencion-novedades',
        tipo: 'atencion',
        titulo: `${novedades.length} guías con novedad`,
        descripcion: 'Novedades que necesitan gestión',
        guiasAfectadas: novedades.map(g => g.numeroGuia),
        accion: 'Gestionar novedad',
        icono: AlertTriangle
      });
    }

    return alertasGeneradas;
  }, [guiasLogisticas]);

  // Análisis de patrones
  const patrones = useMemo((): PatronAnalisis[] => {
    if (guiasLogisticas.length === 0) return [];

    const transportadorasCount: Record<string, { total: number; entregadas: number }> = {};
    const ciudadesProblemas: Record<string, number> = {};

    guiasLogisticas.forEach(g => {
      // Transportadoras
      if (!transportadorasCount[g.transportadora]) {
        transportadorasCount[g.transportadora] = { total: 0, entregadas: 0 };
      }
      transportadorasCount[g.transportadora].total++;
      if (g.estadoActual.toLowerCase().includes('entregado')) {
        transportadorasCount[g.transportadora].entregadas++;
      }

      // Ciudades problemáticas
      if (g.tieneNovedad || g.diasTranscurridos > 5) {
        ciudadesProblemas[g.ciudadDestino] = (ciudadesProblemas[g.ciudadDestino] || 0) + 1;
      }
    });

    const mejorTransportadora = Object.entries(transportadorasCount)
      .filter(([, d]) => d.total >= 2)
      .sort((a, b) => (b[1].entregadas / b[1].total) - (a[1].entregadas / a[1].total))[0];

    const peorTransportadora = Object.entries(transportadorasCount)
      .filter(([, d]) => d.total >= 2)
      .sort((a, b) => (a[1].entregadas / a[1].total) - (b[1].entregadas / b[1].total))[0];

    const ciudadProblematica = Object.entries(ciudadesProblemas).sort((a, b) => b[1] - a[1])[0];

    return [
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
    ];
  }, [guiasLogisticas]);

  // Recomendaciones IA
  const recomendaciones = useMemo((): RecomendacionIA[] => {
    if (guiasLogisticas.length === 0) return [];
    const recs: RecomendacionIA[] = [];

    const guiasUrgentes = guiasLogisticas.filter(g =>
      g.diasTranscurridos > 3 && !g.estadoActual.toLowerCase().includes('entregado')
    ).length;

    if (guiasUrgentes > 0) {
      recs.push({
        id: 'rec-llamadas-urgentes',
        texto: `${guiasUrgentes} guías requieren seguimiento urgente hoy`,
        impacto: 'alto',
        guiasRelacionadas: guiasUrgentes
      });
    }

    const devueltas = guiasLogisticas.filter(g => g.estadoActual.toLowerCase().includes('devuelto')).length;
    if (devueltas > 0) {
      recs.push({
        id: 'rec-devueltas',
        texto: `Hay ${devueltas} guías devueltas pendientes de gestión`,
        impacto: 'alto',
        guiasRelacionadas: devueltas
      });
    }

    if (estadisticas.tasaEntrega < 70 && guiasLogisticas.length >= 5) {
      recs.push({
        id: 'rec-tasa-baja',
        texto: `Tasa de entrega baja (${estadisticas.tasaEntrega}%), revisar procesos`,
        impacto: 'medio'
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

    if (activeMetricFilter) {
      switch (activeMetricFilter) {
        case 'activas':
          resultado = resultado.filter(g =>
            !g.estadoActual.toLowerCase().includes('entregado') &&
            !g.estadoActual.toLowerCase().includes('devuelto')
          );
          break;
        case 'conNovedad':
          resultado = resultado.filter(g => g.tieneNovedad);
          break;
        case 'enCentro':
          resultado = resultado.filter(g =>
            g.estadoActual.toLowerCase().includes('centro') ||
            g.estadoActual.toLowerCase().includes('oficina')
          );
          break;
      }
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      resultado = resultado.filter(g =>
        g.numeroGuia.toLowerCase().includes(query) ||
        g.ciudadDestino.toLowerCase().includes(query) ||
        g.transportadora.toLowerCase().includes(query)
      );
    }

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
      resultado = resultado.filter(g => g.tieneNovedad);
    } else if (filtroNovedad === 'SIN') {
      resultado = resultado.filter(g => !g.tieneNovedad);
    }

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
    const fechaExport = new Date().toLocaleDateString('es-CO').replace(/\//g, '-');

    // Hoja 1: Resumen
    const datosResumen = guiasFiltradas.map(g => ({
      'Número de Guía': g.numeroGuia,
      'Teléfono': g.telefono || 'N/A',
      'Transportadora': g.transportadora,
      'Ciudad Origen': g.ciudadOrigen,
      'Ciudad Destino': g.ciudadDestino,
      'Estado Actual': g.estadoActual,
      'Días Transcurridos': g.diasTranscurridos,
      'Novedad': g.tieneNovedad ? 'Sí' : 'No',
      'Último Estado': g.ultimos2Estados[0]?.descripcion || '',
      'Fecha Último Estado': g.ultimos2Estados[0]?.fecha || '',
      'Ubicación': g.ultimos2Estados[0]?.ubicacion || '',
    }));

    // Hoja 2: Historial detallado
    const datosHistorial: any[] = [];
    guiasFiltradas.forEach(g => {
      g.historialCompleto.forEach((evento, idx) => {
        datosHistorial.push({
          'Número de Guía': g.numeroGuia,
          'Transportadora': g.transportadora,
          'Orden': idx + 1,
          'Fecha': evento.fecha,
          'Ubicación': evento.ubicacion,
          'Descripción': evento.descripcion,
        });
      });
    });

    // Hoja 3: Estadísticas
    const datosEstadisticas = [
      { 'Métrica': 'Total de Guías', 'Valor': guiasFiltradas.length },
      { 'Métrica': 'Guías Entregadas', 'Valor': estadisticas.entregadas },
      { 'Métrica': 'Tasa de Entrega', 'Valor': `${estadisticas.tasaEntrega}%` },
      { 'Métrica': 'Guías con Novedad', 'Valor': estadisticas.conNovedadSinResolver },
      { 'Métrica': 'Promedio Días Entrega', 'Valor': estadisticas.promedioDiasEntrega },
      { 'Métrica': 'Fecha de Generación', 'Valor': new Date().toLocaleString('es-CO') },
    ];

    const wb = XLSX.utils.book_new();
    const wsResumen = XLSX.utils.json_to_sheet(datosResumen);
    const wsHistorial = XLSX.utils.json_to_sheet(datosHistorial);
    const wsEstadisticas = XLSX.utils.json_to_sheet(datosEstadisticas);

    wsResumen['!cols'] = [
      { wch: 18 }, { wch: 18 }, { wch: 15 }, { wch: 20 }, { wch: 25 },
      { wch: 8 }, { wch: 8 }, { wch: 40 }, { wch: 18 }, { wch: 25 },
    ];

    XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen Logístico');
    XLSX.utils.book_append_sheet(wb, wsHistorial, 'Historial Detallado');
    XLSX.utils.book_append_sheet(wb, wsEstadisticas, 'Estadísticas');

    XLSX.writeFile(wb, `Inteligencia_Logistica_${fechaExport}.xlsx`);
  }, [guiasFiltradas, estadisticas]);

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
      doc.text(`${index + 1}. [${alerta.tipo.toUpperCase()}] ${alerta.titulo}`, 20, y);
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

  // Vista cuando no hay datos
  if (guiasLogisticas.length === 0) {
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
        </div>

        {/* Panel de carga */}
        <div className="bg-white dark:bg-navy-900 rounded-2xl border-2 border-dashed border-slate-300 dark:border-navy-600 p-12 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-cyan-100 to-blue-100 dark:from-cyan-900/30 dark:to-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <Upload className="w-10 h-10 text-cyan-600 dark:text-cyan-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
            Cargar Datos de Tracking
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto">
            Carga un archivo con los datos de seguimiento de guías o pega el texto directamente
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-bold hover:from-cyan-600 hover:to-blue-700 transition-all shadow-lg"
            >
              <FileUp className="w-5 h-5" />
              Cargar Datos
            </button>
          </div>
        </div>

        {/* Modal de carga */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-navy-900 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-navy-700">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <FileUp className="w-5 h-5 text-cyan-500" />
                  Cargar Datos de Tracking
                </h3>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-navy-800 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 space-y-4">
                {/* Subir archivo */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Subir archivo (.txt)
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,.csv"
                    onChange={handleFileUpload}
                    className="w-full px-4 py-3 border-2 border-dashed border-slate-300 dark:border-navy-600 rounded-xl cursor-pointer hover:border-cyan-400 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-cyan-500 file:text-white file:font-medium"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex-1 h-px bg-slate-200 dark:bg-navy-700"></div>
                  <span className="text-sm text-slate-400">o pega el texto</span>
                  <div className="flex-1 h-px bg-slate-200 dark:bg-navy-700"></div>
                </div>

                {/* Pegar texto */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Pegar datos de tracking
                  </label>
                  <textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder={`Número:  240040701342
Estatus del paquete:  Entregado (4 Días)
País:  Colombia -> Desconocido
Inter Rapidisimo (INTER RAPIDÍSIMO):
2025-11-29 10:20 ROZO PAL VALL Tú envío fue entregado
2025-11-28 09:53 ROZO PAL VALL En Centro Logístico Destino
======================================`}
                    className="w-full h-40 px-4 py-3 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-xl text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                {/* Registro de teléfonos */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-green-500" />
                      Registro de teléfonos (opcional)
                    </div>
                  </label>
                  <textarea
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder={`240040759898,3176544064
240040759899,3185223311
240040759900 3123456789`}
                    className="w-full h-24 px-4 py-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Formato: guía,teléfono o guía teléfono (uno por línea)
                  </p>
                </div>

                <button
                  onClick={handleLoadFromText}
                  disabled={!textInput.trim() || isLoading}
                  className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                    textInput.trim() && !isLoading
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Cargar Datos
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

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
            {guiasLogisticas.length} guías cargadas - Vista de solo lectura
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-medium transition-all"
          >
            <Upload className="w-4 h-4" />
            Cargar Datos
          </button>
          <button
            onClick={exportarExcel}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-all"
          >
            <Table className="w-4 h-4" />
            Exportar Excel
          </button>
          <button
            onClick={exportarAlertasPDF}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-all"
          >
            <FileText className="w-4 h-4" />
            Alertas PDF
          </button>
          <button
            onClick={() => setGuiasLogisticas([])}
            className="flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-navy-700 text-slate-600 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-300 dark:hover:bg-navy-600 transition-all"
          >
            <X className="w-4 h-4" />
            Limpiar
          </button>
        </div>
      </div>

      {/* ====================================== */}
      {/* BARRA DE PROGRESO GLOBAL - Devoluciones */}
      {/* ====================================== */}
      {(() => {
        // Determinar color según tasa de devolución
        const tasa = estadisticas.tasaDevolucion;
        const meta = estadisticas.metaDevolucion;
        let colorClasses = {
          bg: 'bg-emerald-500',
          bgLight: 'bg-emerald-100 dark:bg-emerald-900/30',
          text: 'text-emerald-600 dark:text-emerald-400',
          border: 'border-emerald-200 dark:border-emerald-800',
          glow: 'shadow-emerald-500/20',
          label: 'En Meta'
        };

        if (tasa >= 12) {
          colorClasses = {
            bg: 'bg-red-500',
            bgLight: 'bg-red-100 dark:bg-red-900/30',
            text: 'text-red-600 dark:text-red-400',
            border: 'border-red-200 dark:border-red-800',
            glow: 'shadow-red-500/20',
            label: 'Crítico'
          };
        } else if (tasa >= 10) {
          colorClasses = {
            bg: 'bg-amber-500',
            bgLight: 'bg-amber-100 dark:bg-amber-900/30',
            text: 'text-amber-600 dark:text-amber-400',
            border: 'border-amber-200 dark:border-amber-800',
            glow: 'shadow-amber-500/20',
            label: 'Alerta'
          };
        }

        // Calcular porcentaje visual (máximo 100% basado en un límite de 20% para la barra)
        const maxVisual = 20;
        const porcentajeVisual = Math.min((tasa / maxVisual) * 100, 100);
        const porcentajeMeta = (meta / maxVisual) * 100;

        return (
          <div className={`relative overflow-hidden rounded-xl border-2 ${colorClasses.border} ${colorClasses.bgLight} p-4 shadow-lg ${colorClasses.glow}`}>
            {/* Fondo con patrón */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0.1)_1px,transparent_1px)] bg-[length:20px_20px]"></div>
            </div>

            <div className="relative z-10">
              {/* Header de la barra */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${colorClasses.bg} shadow-lg`}>
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-white text-lg">
                      Tasa de Devoluciones
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Objetivo: Reducir del 15% al 8%
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2 bg-white/50 dark:bg-black/20 px-3 py-1.5 rounded-lg">
                    <AlertTriangle className={`w-4 h-4 ${colorClasses.text}`} />
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                      Guías en riesgo: <span className={`font-bold ${colorClasses.text}`}>{estadisticas.guiasEnRiesgo}</span>
                    </span>
                  </div>
                  <span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${colorClasses.bg} text-white`}>
                    {colorClasses.label}
                  </span>
                </div>
              </div>

              {/* Barra de progreso principal */}
              <div className="relative">
                {/* Fondo de la barra */}
                <div className="h-8 bg-slate-200 dark:bg-navy-700 rounded-full overflow-hidden relative">
                  {/* Barra de progreso actual */}
                  <div
                    className={`absolute inset-y-0 left-0 ${colorClasses.bg} transition-all duration-1000 ease-out rounded-full flex items-center justify-end pr-2`}
                    style={{ width: `${porcentajeVisual}%` }}
                  >
                    {porcentajeVisual > 20 && (
                      <span className="text-white text-sm font-bold drop-shadow">
                        {tasa}%
                      </span>
                    )}
                  </div>

                  {/* Indicador de meta */}
                  <div
                    className="absolute inset-y-0 w-1 bg-emerald-600 dark:bg-emerald-400 z-10"
                    style={{ left: `${porcentajeMeta}%` }}
                  >
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-white dark:bg-navy-800 px-1.5 py-0.5 rounded shadow-sm">
                        Meta {meta}%
                      </span>
                    </div>
                  </div>

                  {/* Bloques visuales estilo ASCII */}
                  <div className="absolute inset-0 flex items-center px-2 pointer-events-none">
                    {Array.from({ length: 20 }).map((_, i) => {
                      const blockPercent = ((i + 1) / 20) * 100;
                      const isFilled = blockPercent <= porcentajeVisual;
                      return (
                        <div
                          key={i}
                          className={`flex-1 h-4 mx-0.5 rounded-sm transition-all duration-500 ${
                            isFilled ? 'bg-white/30' : 'bg-slate-300/30 dark:bg-navy-600/30'
                          }`}
                          style={{ transitionDelay: `${i * 30}ms` }}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Info inferior */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-3 gap-2">
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-slate-500 dark:text-slate-400">
                    Devoluciones: <span className={`font-bold ${colorClasses.text}`}>{estadisticas.tasaDevolucion}%</span>
                  </span>
                  <span className="text-slate-400 dark:text-slate-500">|</span>
                  <span className="text-slate-500 dark:text-slate-400">
                    Meta: <span className="font-bold text-emerald-600 dark:text-emerald-400">{meta}%</span>
                  </span>
                  <span className="text-slate-400 dark:text-slate-500">|</span>
                  <span className="text-slate-500 dark:text-slate-400">
                    Diferencia: <span className={`font-bold ${tasa > meta ? colorClasses.text : 'text-emerald-600'}`}>
                      {tasa > meta ? `+${(tasa - meta).toFixed(1)}%` : `${(tasa - meta).toFixed(1)}%`}
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-emerald-500"></div>
                    <span>&lt;10%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-amber-500"></div>
                    <span>10-12%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-red-500"></div>
                    <span>&gt;12%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

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

        <div className="p-4 rounded-xl border bg-white dark:bg-navy-900 border-slate-200 dark:border-navy-700">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Tasa Entrega</span>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{estadisticas.tasaEntrega}%</p>
        </div>

        <div className="p-4 rounded-xl border bg-white dark:bg-navy-900 border-slate-200 dark:border-navy-700">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-5 h-5 text-red-500" />
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Devolución</span>
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
          onClick={() => handleMetricClick('enCentro')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            activeMetricFilter === 'enCentro'
              ? 'bg-purple-100 dark:bg-purple-900/40 border-purple-400 ring-2 ring-purple-400'
              : 'bg-white dark:bg-navy-900 border-slate-200 dark:border-navy-700 hover:border-purple-300'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="w-5 h-5 text-purple-500" />
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">En Centro</span>
          </div>
          <p className="text-2xl font-bold text-purple-600">{estadisticas.enReclamoOficina}</p>
        </div>

        <div className="p-4 rounded-xl border bg-white dark:bg-navy-900 border-slate-200 dark:border-navy-700">
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
              </div>
            </div>
            {showAlertas ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>

          {showAlertas && (
            <div className="px-4 pb-4 space-y-3">
              {alertas.map(alerta => {
                const AlertIcon = alerta.icono;
                const colors: Record<string, string> = {
                  critico: 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700',
                  urgente: 'bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700',
                  atencion: 'bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700',
                  advertencia: 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700',
                };
                const textColors: Record<string, string> = {
                  critico: 'text-red-700 dark:text-red-400',
                  urgente: 'text-orange-700 dark:text-orange-400',
                  atencion: 'text-amber-700 dark:text-amber-400',
                  advertencia: 'text-blue-700 dark:text-blue-400',
                };

                return (
                  <div key={alerta.id} className={`p-4 rounded-lg border ${colors[alerta.tipo]} flex items-start gap-4`}>
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
      {patrones.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-700 p-5">
            <div className="flex items-center gap-2 mb-4">
              <PieChart className="w-5 h-5 text-purple-500" />
              <h3 className="font-bold text-slate-800 dark:text-white">Análisis de Patrones</h3>
            </div>
            <div className="space-y-3">
              {patrones.map((patron, idx) => {
                const Icon = patron.icono;
                return (
                  <div key={idx} className="p-3 rounded-lg bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-slate-500" />
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
                    <p className="text-lg font-bold text-slate-800 dark:text-white mt-1">{patron.valor}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{patron.detalle}</p>
                  </div>
                );
              })}
            </div>
          </div>

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
                  const impactoColors: Record<string, string> = {
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
                              <span className="text-xs text-slate-400">{rec.guiasRelacionadas} guías</span>
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
      )}

      {/* Filtros */}
      <div className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-700 p-4">
        <div className="flex flex-wrap items-center gap-4">
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

          <select
            value={filtroNovedad}
            onChange={(e) => setFiltroNovedad(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="ALL">Con/Sin Novedad</option>
            <option value="CON">Con Novedad</option>
            <option value="SIN">Sin Novedad</option>
          </select>

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
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase cursor-pointer hover:bg-slate-100 dark:hover:bg-navy-700" onClick={() => handleSort('numeroGuia')}>
                  <div className="flex items-center gap-1">
                    Guía
                    {sortColumn === 'numeroGuia' && (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                  </div>
                </th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase cursor-pointer hover:bg-slate-100 dark:hover:bg-navy-700" onClick={() => handleSort('transportadora')}>
                  <div className="flex items-center gap-1">
                    Transportadora
                    {sortColumn === 'transportadora' && (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                  </div>
                </th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Ruta</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase cursor-pointer hover:bg-slate-100 dark:hover:bg-navy-700" onClick={() => handleSort('estadoActual')}>
                  <div className="flex items-center gap-1">
                    Estado
                    {sortColumn === 'estadoActual' && (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                  </div>
                </th>
                <th className="text-center px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase cursor-pointer hover:bg-slate-100 dark:hover:bg-navy-700" onClick={() => handleSort('diasTranscurridos')}>
                  <div className="flex items-center justify-center gap-1">
                    Días
                    {sortColumn === 'diasTranscurridos' && (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                  </div>
                </th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Últimos Estados</th>
                <th className="text-center px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Ver</th>
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
                          <div className="space-y-1.5">
                            {/* Número de guía con botón de copiar */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-bold text-slate-800 dark:text-white">{guia.numeroGuia}</span>
                              <button
                                onClick={() => copyToClipboard(guia.numeroGuia, 'guide', guia.numeroGuia)}
                                className={`p-1 rounded transition-all ${
                                  copiedGuide === guia.numeroGuia
                                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'
                                    : 'hover:bg-slate-100 dark:hover:bg-navy-700 text-slate-400'
                                }`}
                                title="Copiar número de guía"
                              >
                                {copiedGuide === guia.numeroGuia ? (
                                  <CheckCircle className="w-3.5 h-3.5" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                              {guia.tieneNovedad && (
                                <span className="px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs rounded font-medium">
                                  Novedad
                                </span>
                              )}
                            </div>

                            {/* Teléfono con acciones */}
                            {guia.telefono && (
                              <div className="flex items-center gap-2">
                                <Phone className="w-3.5 h-3.5 text-green-500" />
                                <span className="font-mono text-sm text-green-600 dark:text-green-400">{guia.telefono}</span>
                                <button
                                  onClick={() => copyToClipboard(guia.telefono!, 'phone', guia.numeroGuia)}
                                  className={`p-1 rounded transition-all ${
                                    copiedPhone === guia.numeroGuia
                                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'
                                      : 'hover:bg-slate-100 dark:hover:bg-navy-700 text-slate-400'
                                  }`}
                                  title="Copiar teléfono"
                                >
                                  {copiedPhone === guia.numeroGuia ? (
                                    <CheckCircle className="w-3 h-3" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                                <button
                                  onClick={() => makeCall(guia.telefono!)}
                                  className="p-1 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                                  title="Llamar"
                                >
                                  <PhoneCall className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => openWhatsApp(guia.telefono!, guia.numeroGuia)}
                                  className="p-1 rounded bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                                  title="WhatsApp"
                                >
                                  <MessageSquare className="w-3 h-3" />
                                </button>
                              </div>
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
                          <div className="flex items-center justify-center gap-2">
                            <Clock className={`w-4 h-4 ${guia.diasTranscurridos > 5 ? 'text-red-500' : guia.diasTranscurridos > 3 ? 'text-amber-500' : 'text-slate-400'}`} />
                            <span className={`font-bold ${guia.diasTranscurridos > 5 ? 'text-red-600' : guia.diasTranscurridos > 3 ? 'text-amber-600' : 'text-slate-600 dark:text-slate-300'}`}>
                              {guia.diasTranscurridos}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            {guia.ultimos2Estados.slice(0, 2).map((estado, idx) => (
                              <div key={idx} className="flex items-start gap-2 text-xs">
                                <span className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${idx === 0 ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                                <div>
                                  <span className="text-slate-400 font-mono">{formatDate(estado.fecha)}</span>
                                  <p className="text-slate-600 dark:text-slate-400 truncate max-w-[200px]" title={estado.descripcion}>
                                    {estado.descripcion}
                                  </p>
                                </div>
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

                      {isExpanded && (
                        <tr className="bg-cyan-50/50 dark:bg-cyan-900/10">
                          <td colSpan={7} className="px-4 py-4">
                            <div className="bg-white dark:bg-navy-800 rounded-lg p-4 border border-cyan-200 dark:border-cyan-800">
                              <h4 className="font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-cyan-500" />
                                Historial Completo de Movimientos
                                <span className="text-xs bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 px-2 py-0.5 rounded-full">
                                  {guia.historialCompleto.length} eventos
                                </span>
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
                                            {formatDate(evento.fecha)}
                                          </span>
                                          {idx === 0 && (
                                            <span className="px-1.5 py-0.5 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 text-xs rounded">
                                              Actual
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
                                          {evento.descripcion}
                                        </p>
                                        <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                                          <MapPin className="w-3 h-3" />
                                          {evento.ubicacion}
                                        </p>
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

      {/* Modal de carga */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-navy-900 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-navy-700">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <FileUp className="w-5 h-5 text-cyan-500" />
                Cargar Datos de Tracking
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-navy-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Subir archivo (.txt)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.csv"
                  onChange={handleFileUpload}
                  className="w-full px-4 py-3 border-2 border-dashed border-slate-300 dark:border-navy-600 rounded-xl cursor-pointer hover:border-cyan-400 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-cyan-500 file:text-white file:font-medium"
                />
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-slate-200 dark:bg-navy-700"></div>
                <span className="text-sm text-slate-400">o pega el texto</span>
                <div className="flex-1 h-px bg-slate-200 dark:bg-navy-700"></div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Pegar datos de tracking
                </label>
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder={`Número:  240040701342
Estatus del paquete:  Entregado (4 Días)
País:  Colombia -> Desconocido
Inter Rapidisimo (INTER RAPIDÍSIMO):
2025-11-29 10:20 ROZO PAL VALL Tú envío fue entregado
======================================`}
                  className="w-full h-40 px-4 py-3 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-xl text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              {/* Registro de teléfonos */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-green-500" />
                    Registro de teléfonos (opcional)
                  </div>
                </label>
                <textarea
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder={`240040759898,3176544064
240040759899,3185223311
240040759900 3123456789`}
                  className="w-full h-24 px-4 py-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Formato: guía,teléfono o guía teléfono (uno por línea)
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleLoadFromText}
                  disabled={!textInput.trim() || isLoading}
                  className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                    textInput.trim() && !isLoading
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Cargar Datos
                    </>
                  )}
                </button>
                {guiasLogisticas.length > 0 && phoneInput.trim() && (
                  <button
                    onClick={handleUpdatePhones}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold bg-green-500 hover:bg-green-600 text-white transition-all"
                    title="Solo actualizar teléfonos sin recargar guías"
                  >
                    <Phone className="w-5 h-5" />
                    Solo Teléfonos
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer info */}
      <div className="text-center text-sm text-slate-400">
        <p>Vista de solo lectura - Datos independientes del módulo de Seguimiento</p>
      </div>
    </div>
  );
};

export default InteligenciaLogisticaTab;
