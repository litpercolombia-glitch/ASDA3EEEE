import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
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
  ChevronLeft,
  X,
  Upload,
  FileUp,
  Table,
  Folder,
  FolderOpen,
  History,
  GitCompare,
  Download,
  Trash2,
  Plus,
  Save,
  ArrowRight,
  Target,
  Users,
  Phone,
  MessageSquare,
} from 'lucide-react';
import * as XLSX from 'xlsx';

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

interface Sesion {
  id: string;
  nombre: string;
  fecha: string;
  fechaCreacion: string;
  guias: GuiaLogistica[];
  totalGuias: number;
  entregadas: number;
  enReparto: number;
  conNovedad: number;
  devueltas: number;
}

interface ComparacionSesiones {
  sesionAnterior: Sesion;
  sesionActual: Sesion;
  guiasNuevas: GuiaLogistica[];
  guiasDesaparecidas: string[];
  cambiosEstado: {
    guia: GuiaLogistica;
    estadoAnterior: string;
    estadoActual: string;
    mejora: boolean;
  }[];
  guiasEstancadas: GuiaLogistica[];
  guiasEntregadasHoy: GuiaLogistica[];
  metricas: {
    variacionEntregas: number;
    variacionNovedades: number;
    variacionDevoluciones: number;
  };
}

interface AlertaLogistica {
  id: string;
  tipo: 'critico' | 'urgente' | 'atencion' | 'info';
  titulo: string;
  descripcion: string;
  guiasAfectadas: string[];
  accion: string;
  icono: React.ElementType;
}

// =====================================
// CONSTANTES
// =====================================
const STORAGE_KEY = 'litper_inteligencia_logistica_sesiones';
const MAX_SESIONES = 30;

// =====================================
// HELPERS
// =====================================
const getStatusColor = (
  status: string
): { bg: string; text: string; border: string; dot: string } => {
  const statusLower = status.toLowerCase();
  if (statusLower.includes('entregado') || statusLower === 'delivered') {
    return {
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      text: 'text-emerald-700 dark:text-emerald-400',
      border: 'border-emerald-200 dark:border-emerald-800',
      dot: 'bg-emerald-500',
    };
  }
  if (
    statusLower.includes('reparto') ||
    statusLower.includes('tránsito') ||
    statusLower.includes('transito') ||
    statusLower.includes('viajando')
  ) {
    return {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      text: 'text-blue-700 dark:text-blue-400',
      border: 'border-blue-200 dark:border-blue-800',
      dot: 'bg-blue-500',
    };
  }
  if (
    statusLower.includes('oficina') ||
    statusLower.includes('centro') ||
    statusLower.includes('recogido')
  ) {
    return {
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      text: 'text-purple-700 dark:text-purple-400',
      border: 'border-purple-200 dark:border-purple-800',
      dot: 'bg-purple-500',
    };
  }
  if (
    statusLower.includes('novedad') ||
    statusLower.includes('devuelto') ||
    statusLower.includes('rechaz') ||
    statusLower.includes('alerta')
  ) {
    return {
      bg: 'bg-red-50 dark:bg-red-900/20',
      text: 'text-red-700 dark:text-red-400',
      border: 'border-red-200 dark:border-red-800',
      dot: 'bg-red-500',
    };
  }
  if (statusLower.includes('pendiente') || statusLower.includes('reclamo')) {
    return {
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      text: 'text-amber-700 dark:text-amber-400',
      border: 'border-amber-200 dark:border-amber-800',
      dot: 'bg-amber-500',
    };
  }
  return {
    bg: 'bg-slate-50 dark:bg-slate-800',
    text: 'text-slate-700 dark:text-slate-400',
    border: 'border-slate-200 dark:border-slate-700',
    dot: 'bg-slate-400',
  };
};

const formatDateForSession = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, '0');
  const months = [
    'Ene',
    'Feb',
    'Mar',
    'Abr',
    'May',
    'Jun',
    'Jul',
    'Ago',
    'Sep',
    'Oct',
    'Nov',
    'Dic',
  ];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

const formatDateTime = (dateStr: string): string => {
  try {
    const parts = dateStr.split(' ');
    if (parts.length >= 2) {
      const datePart = parts[0];
      const timePart = parts[1];
      const [year, month, day] = datePart.split('-');
      const months = [
        'ene',
        'feb',
        'mar',
        'abr',
        'may',
        'jun',
        'jul',
        'ago',
        'sep',
        'oct',
        'nov',
        'dic',
      ];
      return `${day} ${months[parseInt(month) - 1]}, ${timePart}`;
    }
    return dateStr;
  } catch {
    return dateStr;
  }
};

// =====================================
// PARSER DE EXCEL
// =====================================
const parseExcelFile = async (file: File): Promise<GuiaLogistica[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

        const guias: GuiaLogistica[] = [];
        const headers = jsonData[0] || [];

        // Buscar índices de columnas
        const findColumnIndex = (names: string[]) => {
          return headers.findIndex((h: any) =>
            names.some((name) => String(h).toLowerCase().includes(name.toLowerCase()))
          );
        };

        const guiaIdx = findColumnIndex(['guia', 'numero', 'tracking', 'n°', 'id']);
        const estadoIdx = findColumnIndex(['estado', 'status', 'estatus']);
        const transportadoraIdx = findColumnIndex(['transportadora', 'carrier', 'empresa']);
        const ciudadIdx = findColumnIndex(['ciudad', 'destino', 'city']);
        const diasIdx = findColumnIndex(['dias', 'days', 'tiempo']);
        const telefonoIdx = findColumnIndex(['telefono', 'celular', 'phone', 'tel']);
        const novedadIdx = findColumnIndex(['novedad', 'issue', 'problema']);

        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || row.length === 0) continue;

          const numeroGuia = guiaIdx >= 0 ? String(row[guiaIdx] || '') : '';
          if (!numeroGuia) continue;

          const estadoActual = estadoIdx >= 0 ? String(row[estadoIdx] || 'Pendiente') : 'Pendiente';
          const transportadora =
            transportadoraIdx >= 0
              ? String(row[transportadoraIdx] || 'Desconocido')
              : 'Desconocido';
          const ciudadDestino =
            ciudadIdx >= 0 ? String(row[ciudadIdx] || 'Desconocido') : 'Desconocido';
          const diasTranscurridos = diasIdx >= 0 ? parseInt(String(row[diasIdx] || '0')) || 0 : 0;
          const telefono = telefonoIdx >= 0 ? String(row[telefonoIdx] || '') : '';
          const tieneNovedad =
            novedadIdx >= 0
              ? Boolean(row[novedadIdx])
              : estadoActual.toLowerCase().includes('novedad') ||
                estadoActual.toLowerCase().includes('devuelto');

          guias.push({
            numeroGuia,
            telefono,
            transportadora,
            ciudadOrigen: 'Colombia',
            ciudadDestino,
            estadoActual,
            diasTranscurridos,
            tieneNovedad,
            ultimos2Estados: [],
            historialCompleto: [],
          });
        }

        resolve(guias);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsBinaryString(file);
  });
};

// =====================================
// PARSER DE TEXTO
// =====================================
const parseTrackingText = (text: string): GuiaLogistica[] => {
  const guias: GuiaLogistica[] = [];
  const blocks = text.split('======================================').filter((b) => b.trim());

  for (const block of blocks) {
    const lines = block
      .trim()
      .split('\n')
      .filter((l) => l.trim());
    if (lines.length < 3) continue;

    let numeroGuia = '';
    let estadoPaquete = '';
    let diasTranscurridos = 0;
    let ciudadOrigen = 'Colombia';
    let ciudadDestino = 'Desconocido';
    let transportadora = '';
    const eventos: EventoLogistico[] = [];

    for (const line of lines) {
      const trimmedLine = line.trim();

      if (trimmedLine.startsWith('Número:')) {
        numeroGuia = trimmedLine.replace('Número:', '').trim();
      } else if (trimmedLine.startsWith('Estatus del paquete:')) {
        const match = trimmedLine.match(/Estatus del paquete:\s*(.+?)\s*\((\d+)\s*Días?\)/i);
        if (match) {
          estadoPaquete = match[1].trim();
          diasTranscurridos = parseInt(match[2]);
        } else {
          estadoPaquete = trimmedLine.replace('Estatus del paquete:', '').trim();
        }
      } else if (trimmedLine.startsWith('País:')) {
        const rutaMatch = trimmedLine.match(/País:\s*(.+?)\s*->\s*(.+)/);
        if (rutaMatch) {
          ciudadOrigen = rutaMatch[1].trim();
          ciudadDestino = rutaMatch[2].trim();
        }
      } else if (
        trimmedLine.includes('(') &&
        trimmedLine.includes(')') &&
        !trimmedLine.match(/^\d{4}-\d{2}-\d{2}/)
      ) {
        transportadora = trimmedLine.split('(')[0].trim();
      } else if (trimmedLine.match(/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/)) {
        const eventoMatch = trimmedLine.match(/^(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})\s+(.+?)\s+(.+)$/);
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
      const tieneNovedad =
        estadoPaquete.toLowerCase().includes('alerta') ||
        estadoPaquete.toLowerCase().includes('novedad') ||
        estadoPaquete.toLowerCase().includes('devuelto') ||
        eventos.some((e) => e.descripcion.toLowerCase().includes('devuelto'));

      guias.push({
        numeroGuia,
        transportadora: transportadora || 'Desconocido',
        ciudadOrigen,
        ciudadDestino,
        estadoActual: estadoPaquete || 'Pendiente',
        diasTranscurridos,
        tieneNovedad,
        ultimos2Estados: eventos.slice(0, 2),
        historialCompleto: eventos,
      });
    }
  }

  return guias;
};

// =====================================
// STORAGE HELPERS
// =====================================
const loadSesiones = (): Sesion[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const saveSesiones = (sesiones: Sesion[]) => {
  try {
    // Mantener solo las últimas MAX_SESIONES sesiones
    const sesionesLimitadas = sesiones.slice(-MAX_SESIONES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sesionesLimitadas));
  } catch (e) {
    console.error('Error saving sesiones:', e);
  }
};

// =====================================
// COMPARACIÓN DE SESIONES
// =====================================
const compararSesiones = (anterior: Sesion, actual: Sesion): ComparacionSesiones => {
  const guiasAnteriores = new Map(anterior.guias.map((g) => [g.numeroGuia, g]));
  const guiasActuales = new Map(actual.guias.map((g) => [g.numeroGuia, g]));

  // Guías nuevas (no existían ayer)
  const guiasNuevas = actual.guias.filter((g) => !guiasAnteriores.has(g.numeroGuia));

  // Guías desaparecidas (existían ayer pero no hoy)
  const guiasDesaparecidas = anterior.guias
    .filter((g) => !guiasActuales.has(g.numeroGuia))
    .map((g) => g.numeroGuia);

  // Cambios de estado
  const cambiosEstado: ComparacionSesiones['cambiosEstado'] = [];
  const guiasEstancadas: GuiaLogistica[] = [];
  const guiasEntregadasHoy: GuiaLogistica[] = [];

  actual.guias.forEach((guiaActual) => {
    const guiaAnterior = guiasAnteriores.get(guiaActual.numeroGuia);
    if (guiaAnterior) {
      if (guiaAnterior.estadoActual !== guiaActual.estadoActual) {
        const mejora =
          guiaActual.estadoActual.toLowerCase().includes('entregado') ||
          (guiaActual.estadoActual.toLowerCase().includes('reparto') &&
            !guiaAnterior.estadoActual.toLowerCase().includes('reparto'));

        cambiosEstado.push({
          guia: guiaActual,
          estadoAnterior: guiaAnterior.estadoActual,
          estadoActual: guiaActual.estadoActual,
          mejora,
        });

        if (
          guiaActual.estadoActual.toLowerCase().includes('entregado') &&
          !guiaAnterior.estadoActual.toLowerCase().includes('entregado')
        ) {
          guiasEntregadasHoy.push(guiaActual);
        }
      } else {
        // Mismo estado, verificar si está estancada
        if (
          guiaActual.diasTranscurridos >= 2 &&
          !guiaActual.estadoActual.toLowerCase().includes('entregado')
        ) {
          guiasEstancadas.push(guiaActual);
        }
      }
    }
  });

  // Métricas comparativas
  const variacionEntregas = actual.entregadas - anterior.entregadas;
  const variacionNovedades = actual.conNovedad - anterior.conNovedad;
  const variacionDevoluciones = actual.devueltas - anterior.devueltas;

  return {
    sesionAnterior: anterior,
    sesionActual: actual,
    guiasNuevas,
    guiasDesaparecidas,
    cambiosEstado,
    guiasEstancadas,
    guiasEntregadasHoy,
    metricas: {
      variacionEntregas,
      variacionNovedades,
      variacionDevoluciones,
    },
  };
};

// =====================================
// COMPONENTE PRINCIPAL
// =====================================
export const InteligenciaLogisticaTab: React.FC = () => {
  // Estados de sesiones
  const [sesiones, setSesiones] = useState<Sesion[]>([]);
  const [sesionActiva, setSesionActiva] = useState<Sesion | null>(null);
  const [comparacion, setComparacion] = useState<ComparacionSesiones | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);

  // Estados de UI
  const [searchQuery, setSearchQuery] = useState('');
  const [filtroTransportadora, setFiltroTransportadora] = useState<string>('ALL');
  const [filtroEstado, setFiltroEstado] = useState<string>('ALL');
  const [expandedGuia, setExpandedGuia] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [vistaActiva, setVistaActiva] = useState<'tabla' | 'comparacion' | 'timeline'>('tabla');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cargar sesiones al montar
  useEffect(() => {
    const sesionesGuardadas = loadSesiones();
    setSesiones(sesionesGuardadas);
    if (sesionesGuardadas.length > 0) {
      const ultimaSesion = sesionesGuardadas[sesionesGuardadas.length - 1];
      setSesionActiva(ultimaSesion);

      // Comparar con sesión anterior si existe
      if (sesionesGuardadas.length > 1) {
        const sesionAnterior = sesionesGuardadas[sesionesGuardadas.length - 2];
        setComparacion(compararSesiones(sesionAnterior, ultimaSesion));
      }
    }
  }, []);

  // Crear nueva sesión desde datos
  const crearSesion = useCallback((guias: GuiaLogistica[]) => {
    const fecha = new Date();
    const fechaStr = formatDateForSession(fecha);

    const entregadas = guias.filter((g) =>
      g.estadoActual.toLowerCase().includes('entregado')
    ).length;
    const enReparto = guias.filter((g) => g.estadoActual.toLowerCase().includes('reparto')).length;
    const conNovedad = guias.filter((g) => g.tieneNovedad).length;
    const devueltas = guias.filter((g) => g.estadoActual.toLowerCase().includes('devuelto')).length;

    const nuevaSesion: Sesion = {
      id: `sesion-${Date.now()}`,
      nombre: `Sesión ${fechaStr}`,
      fecha: fechaStr,
      fechaCreacion: fecha.toISOString(),
      guias,
      totalGuias: guias.length,
      entregadas,
      enReparto,
      conNovedad,
      devueltas,
    };

    setSesiones((prev) => {
      const nuevasSesiones = [...prev, nuevaSesion];
      saveSesiones(nuevasSesiones);

      // Calcular comparación con sesión anterior
      if (prev.length > 0) {
        const sesionAnterior = prev[prev.length - 1];
        setComparacion(compararSesiones(sesionAnterior, nuevaSesion));
      }

      return nuevasSesiones;
    });

    setSesionActiva(nuevaSesion);
    return nuevaSesion;
  }, []);

  // Cargar archivo
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      let guias: GuiaLogistica[];

      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        guias = await parseExcelFile(file);
      } else {
        const text = await file.text();
        guias = parseTrackingText(text);
      }

      if (guias.length > 0) {
        crearSesion(guias);
        setShowUploadModal(false);
      } else {
        alert('No se encontraron guías en el archivo.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al procesar el archivo.');
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Cargar desde texto
  const handleLoadFromText = () => {
    if (!textInput.trim()) return;
    setIsLoading(true);
    try {
      const guias = parseTrackingText(textInput);
      if (guias.length > 0) {
        crearSesion(guias);
        setShowUploadModal(false);
        setTextInput('');
      } else {
        alert('No se encontraron guías en el texto.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al procesar el texto.');
    } finally {
      setIsLoading(false);
    }
  };

  // Seleccionar sesión
  const seleccionarSesion = (sesion: Sesion) => {
    setSesionActiva(sesion);

    // Buscar sesión anterior para comparación
    const idx = sesiones.findIndex((s) => s.id === sesion.id);
    if (idx > 0) {
      setComparacion(compararSesiones(sesiones[idx - 1], sesion));
    } else {
      setComparacion(null);
    }
  };

  // Eliminar sesión
  const eliminarSesion = (sesionId: string) => {
    if (!confirm('¿Eliminar esta sesión?')) return;

    setSesiones((prev) => {
      const nuevas = prev.filter((s) => s.id !== sesionId);
      saveSesiones(nuevas);

      if (sesionActiva?.id === sesionId) {
        setSesionActiva(nuevas[nuevas.length - 1] || null);
      }

      return nuevas;
    });
  };

  // Guías de la sesión activa
  const guiasActivas = sesionActiva?.guias || [];

  // Filtrado
  const guiasFiltradas = useMemo(() => {
    return guiasActivas.filter((g) => {
      if (
        searchQuery &&
        !g.numeroGuia.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !g.ciudadDestino.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      if (filtroTransportadora !== 'ALL' && g.transportadora !== filtroTransportadora) return false;
      if (filtroEstado !== 'ALL') {
        const estado = g.estadoActual.toLowerCase();
        if (filtroEstado === 'entregado' && !estado.includes('entregado')) return false;
        if (filtroEstado === 'reparto' && !estado.includes('reparto')) return false;
        if (filtroEstado === 'novedad' && !g.tieneNovedad) return false;
        if (filtroEstado === 'devuelto' && !estado.includes('devuelto')) return false;
      }
      return true;
    });
  }, [guiasActivas, searchQuery, filtroTransportadora, filtroEstado]);

  // Estadísticas
  const estadisticas = useMemo(() => {
    const total = guiasActivas.length;
    const entregadas = guiasActivas.filter((g) =>
      g.estadoActual.toLowerCase().includes('entregado')
    ).length;
    const enReparto = guiasActivas.filter((g) =>
      g.estadoActual.toLowerCase().includes('reparto')
    ).length;
    const conNovedad = guiasActivas.filter((g) => g.tieneNovedad).length;
    const devueltas = guiasActivas.filter((g) =>
      g.estadoActual.toLowerCase().includes('devuelto')
    ).length;
    const tasaEntrega = total > 0 ? Math.round((entregadas / total) * 100) : 0;

    return { total, entregadas, enReparto, conNovedad, devueltas, tasaEntrega };
  }, [guiasActivas]);

  // Transportadoras únicas
  const transportadoras = useMemo(() => {
    return [...new Set(guiasActivas.map((g) => g.transportadora))].filter(Boolean);
  }, [guiasActivas]);

  // Alertas basadas en comparación
  const alertas = useMemo((): AlertaLogistica[] => {
    const alertasGeneradas: AlertaLogistica[] = [];

    if (comparacion) {
      // Guías estancadas
      if (comparacion.guiasEstancadas.length > 0) {
        alertasGeneradas.push({
          id: 'estancadas',
          tipo: 'critico',
          titulo: `${comparacion.guiasEstancadas.length} guías estancadas`,
          descripcion: 'Mismo estado por 2+ días',
          guiasAfectadas: comparacion.guiasEstancadas.map((g) => g.numeroGuia),
          accion: 'Gestionar urgente',
          icono: AlertOctagon,
        });
      }

      // Guías entregadas hoy (positivo)
      if (comparacion.guiasEntregadasHoy.length > 0) {
        alertasGeneradas.push({
          id: 'entregadas-hoy',
          tipo: 'info',
          titulo: `${comparacion.guiasEntregadasHoy.length} entregas nuevas`,
          descripcion: 'Guías entregadas desde ayer',
          guiasAfectadas: comparacion.guiasEntregadasHoy.map((g) => g.numeroGuia),
          accion: 'Ver detalle',
          icono: CheckCircle2,
        });
      }

      // Guías con novedad que empeoraron
      const empeoradas = comparacion.cambiosEstado.filter((c) => !c.mejora);
      if (empeoradas.length > 0) {
        alertasGeneradas.push({
          id: 'empeoradas',
          tipo: 'urgente',
          titulo: `${empeoradas.length} guías empeoraron`,
          descripcion: 'Cambio de estado negativo',
          guiasAfectadas: empeoradas.map((c) => c.guia.numeroGuia),
          accion: 'Investigar',
          icono: TrendingDown,
        });
      }
    }

    // Alertas generales (sin comparación)
    const sinMovimiento5Dias = guiasActivas.filter(
      (g) => g.diasTranscurridos > 5 && !g.estadoActual.toLowerCase().includes('entregado')
    );
    if (sinMovimiento5Dias.length > 0) {
      alertasGeneradas.push({
        id: 'sin-movimiento-5',
        tipo: 'critico',
        titulo: `${sinMovimiento5Dias.length} guías +5 días`,
        descripcion: 'Sin movimiento crítico',
        guiasAfectadas: sinMovimiento5Dias.map((g) => g.numeroGuia),
        accion: 'Contactar urgente',
        icono: Clock,
      });
    }

    return alertasGeneradas;
  }, [comparacion, guiasActivas]);

  // Exportar comparación
  const exportarComparacion = () => {
    if (!comparacion || !sesionActiva) return;

    const wb = XLSX.utils.book_new();

    // Hoja 1: Resumen
    const resumen = [
      ['COMPARACIÓN DE SESIONES'],
      [''],
      ['Sesión Anterior', comparacion.sesionAnterior.nombre],
      ['Sesión Actual', comparacion.sesionActual.nombre],
      [''],
      ['MÉTRICAS'],
      ['Variación Entregas', comparacion.metricas.variacionEntregas],
      ['Variación Novedades', comparacion.metricas.variacionNovedades],
      ['Variación Devoluciones', comparacion.metricas.variacionDevoluciones],
      [''],
      ['TOTALES'],
      ['Guías Nuevas', comparacion.guiasNuevas.length],
      ['Guías Desaparecidas', comparacion.guiasDesaparecidas.length],
      ['Guías con Cambio de Estado', comparacion.cambiosEstado.length],
      ['Guías Estancadas', comparacion.guiasEstancadas.length],
      ['Entregas Nuevas', comparacion.guiasEntregadasHoy.length],
    ];
    const wsResumen = XLSX.utils.aoa_to_sheet(resumen);
    XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');

    // Hoja 2: Cambios de Estado
    const cambios = [
      ['Guía', 'Estado Anterior', 'Estado Actual', 'Mejoró'],
      ...comparacion.cambiosEstado.map((c) => [
        c.guia.numeroGuia,
        c.estadoAnterior,
        c.estadoActual,
        c.mejora ? 'Sí' : 'No',
      ]),
    ];
    const wsCambios = XLSX.utils.aoa_to_sheet(cambios);
    XLSX.utils.book_append_sheet(wb, wsCambios, 'Cambios Estado');

    // Hoja 3: Guías Estancadas
    const estancadas = [
      ['Guía', 'Estado', 'Días', 'Transportadora', 'Ciudad'],
      ...comparacion.guiasEstancadas.map((g) => [
        g.numeroGuia,
        g.estadoActual,
        g.diasTranscurridos,
        g.transportadora,
        g.ciudadDestino,
      ]),
    ];
    const wsEstancadas = XLSX.utils.aoa_to_sheet(estancadas);
    XLSX.utils.book_append_sheet(wb, wsEstancadas, 'Estancadas');

    XLSX.writeFile(wb, `Comparacion_${sesionActiva.fecha}.xlsx`);
  };

  // =====================================
  // RENDER
  // =====================================
  return (
    <div className="flex h-full">
      {/* Sidebar de Sesiones */}
      <div
        className={`${showSidebar ? 'w-72' : 'w-0'} transition-all duration-300 overflow-hidden border-r border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-950`}
      >
        <div className="p-4 h-full flex flex-col">
          {/* Header Sidebar */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <History className="w-5 h-5 text-cyan-500" />
              Sesiones
            </h3>
            <button
              onClick={() => setShowUploadModal(true)}
              className="p-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Lista de Sesiones */}
          <div className="flex-1 overflow-y-auto space-y-2">
            {sesiones.length === 0 ? (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                <Folder className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No hay sesiones</p>
                <p className="text-xs mt-1">Carga un archivo para crear una</p>
              </div>
            ) : (
              sesiones
                .slice()
                .reverse()
                .map((sesion) => (
                  <button
                    key={sesion.id}
                    onClick={() => seleccionarSesion(sesion)}
                    className={`w-full text-left p-3 rounded-xl transition-all ${
                      sesionActiva?.id === sesion.id
                        ? 'bg-cyan-500 text-white shadow-lg'
                        : 'bg-white dark:bg-navy-900 hover:bg-cyan-50 dark:hover:bg-navy-800 border border-slate-200 dark:border-navy-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {sesionActiva?.id === sesion.id ? (
                          <FolderOpen className="w-4 h-4" />
                        ) : (
                          <Folder className="w-4 h-4 text-slate-400" />
                        )}
                        <span className="font-medium text-sm">{sesion.nombre}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          eliminarSesion(sesion.id);
                        }}
                        className={`p-1 rounded hover:bg-white/20 ${
                          sesionActiva?.id === sesion.id
                            ? 'text-white/70'
                            : 'text-slate-400 hover:text-red-500'
                        }`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <div
                      className={`mt-2 text-xs ${sesionActiva?.id === sesion.id ? 'text-white/80' : 'text-slate-500'}`}
                    >
                      <div className="flex justify-between">
                        <span>{sesion.totalGuias} guías</span>
                        <span>{sesion.entregadas} entregadas</span>
                      </div>
                    </div>
                  </button>
                ))
            )}
          </div>

          {/* Info de sesiones */}
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-navy-700 text-xs text-slate-500">
            <p>Últimas {MAX_SESIONES} sesiones guardadas</p>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-navy-800 rounded-lg transition-colors"
              >
                {showSidebar ? (
                  <ChevronLeft className="w-5 h-5" />
                ) : (
                  <ChevronRight className="w-5 h-5" />
                )}
              </button>
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <BarChart3 className="w-6 h-6 text-cyan-500" />
                  Inteligencia Logística
                </h2>
                {sesionActiva && <p className="text-sm text-slate-500">{sesionActiva.nombre}</p>}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-medium transition-colors"
              >
                <Upload className="w-4 h-4" />
                Cargar Datos
              </button>
              {comparacion && (
                <button
                  onClick={exportarComparacion}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Exportar
                </button>
              )}
            </div>
          </div>

          {/* Métricas rápidas */}
          {sesionActiva && (
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
              {[
                { label: 'Total', value: estadisticas.total, color: 'bg-slate-500', icon: Package },
                {
                  label: 'Entregadas',
                  value: estadisticas.entregadas,
                  color: 'bg-emerald-500',
                  icon: CheckCircle2,
                  delta: comparacion?.metricas.variacionEntregas,
                },
                {
                  label: 'En Reparto',
                  value: estadisticas.enReparto,
                  color: 'bg-blue-500',
                  icon: Truck,
                },
                {
                  label: 'Con Novedad',
                  value: estadisticas.conNovedad,
                  color: 'bg-amber-500',
                  icon: AlertTriangle,
                  delta: comparacion?.metricas.variacionNovedades,
                },
                {
                  label: 'Devueltas',
                  value: estadisticas.devueltas,
                  color: 'bg-red-500',
                  icon: XCircle,
                  delta: comparacion?.metricas.variacionDevoluciones,
                },
                {
                  label: 'Tasa Entrega',
                  value: `${estadisticas.tasaEntrega}%`,
                  color: 'bg-purple-500',
                  icon: Target,
                },
              ].map((stat, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50 dark:bg-navy-800 rounded-xl p-3 border border-slate-200 dark:border-navy-700"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-500">{stat.label}</span>
                    <stat.icon className={`w-4 h-4 ${stat.color.replace('bg-', 'text-')}`} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-slate-800 dark:text-white">
                      {stat.value}
                    </span>
                    {stat.delta !== undefined && stat.delta !== 0 && (
                      <span
                        className={`text-xs font-bold flex items-center ${stat.delta > 0 ? 'text-emerald-500' : 'text-red-500'}`}
                      >
                        {stat.delta > 0 ? (
                          <ArrowUpRight className="w-3 h-3" />
                        ) : (
                          <ArrowDownRight className="w-3 h-3" />
                        )}
                        {Math.abs(stat.delta)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Alertas y Comparación */}
        {alertas.length > 0 && (
          <div className="p-4 bg-slate-50 dark:bg-navy-950 border-b border-slate-200 dark:border-navy-700">
            <div className="flex items-center gap-2 mb-3">
              <Bell className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-slate-800 dark:text-white">Alertas del Día</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {alertas.map((alerta) => {
                const Icon = alerta.icono;
                const colors = {
                  critico:
                    'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400',
                  urgente:
                    'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400',
                  atencion:
                    'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400',
                  info: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400',
                };
                return (
                  <div key={alerta.id} className={`p-3 rounded-xl border ${colors[alerta.tipo]}`}>
                    <div className="flex items-start gap-2">
                      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-sm">{alerta.titulo}</h4>
                        <p className="text-xs opacity-80">{alerta.descripcion}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Filtros */}
        {sesionActiva && (
          <div className="p-4 bg-white dark:bg-navy-900 border-b border-slate-200 dark:border-navy-700">
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar guía o ciudad..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <select
                value={filtroTransportadora}
                onChange={(e) => setFiltroTransportadora(e.target.value)}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="ALL">Todas las transportadoras</option>
                {transportadoras.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="ALL">Todos los estados</option>
                <option value="entregado">Entregado</option>
                <option value="reparto">En Reparto</option>
                <option value="novedad">Con Novedad</option>
                <option value="devuelto">Devuelto</option>
              </select>
            </div>
          </div>
        )}

        {/* Tabla de Guías */}
        <div className="flex-1 overflow-auto p-4">
          {!sesionActiva ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-3xl flex items-center justify-center mb-6 shadow-xl">
                <BarChart3 className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                Inteligencia Logística
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md">
                Carga un archivo Excel o de texto para comenzar a analizar tus guías. El sistema
                creará sesiones automáticamente y comparará los datos entre días.
              </p>
              <button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
              >
                <Upload className="w-5 h-5" />
                Cargar Primera Sesión
              </button>
            </div>
          ) : guiasFiltradas.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No se encontraron guías con los filtros actuales</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-700 overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-navy-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">
                      Guía
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">
                      Transportadora
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">
                      Destino
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">
                      Días
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
                  {guiasFiltradas.map((guia) => {
                    const statusColors = getStatusColor(guia.estadoActual);
                    const cambio = comparacion?.cambiosEstado.find(
                      (c) => c.guia.numeroGuia === guia.numeroGuia
                    );

                    return (
                      <React.Fragment key={guia.numeroGuia}>
                        <tr className="hover:bg-slate-50 dark:hover:bg-navy-800/50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-slate-800 dark:text-white">
                                {guia.numeroGuia}
                              </span>
                              {guia.tieneNovedad && (
                                <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] font-bold rounded">
                                  NOVEDAD
                                </span>
                              )}
                              {cambio && (
                                <span
                                  className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                                    cambio.mejora
                                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                                      : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                  }`}
                                >
                                  {cambio.mejora ? 'MEJORÓ' : 'EMPEORÓ'}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                            {guia.transportadora}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                            {guia.ciudadDestino}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusColors.bg} ${statusColors.text}`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${statusColors.dot}`}
                              ></span>
                              {guia.estadoActual}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`font-bold ${guia.diasTranscurridos > 5 ? 'text-red-500' : guia.diasTranscurridos > 3 ? 'text-amber-500' : 'text-slate-600 dark:text-slate-400'}`}
                            >
                              {guia.diasTranscurridos}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() =>
                                setExpandedGuia(
                                  expandedGuia === guia.numeroGuia ? null : guia.numeroGuia
                                )
                              }
                              className="p-2 hover:bg-slate-100 dark:hover:bg-navy-700 rounded-lg transition-colors"
                            >
                              <Eye className="w-4 h-4 text-slate-400" />
                            </button>
                          </td>
                        </tr>
                        {expandedGuia === guia.numeroGuia && (
                          <tr>
                            <td colSpan={6} className="bg-slate-50 dark:bg-navy-800/50 px-4 py-4">
                              <div className="space-y-3">
                                <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                  <History className="w-4 h-4 text-cyan-500" />
                                  Historial de la Guía
                                </h4>
                                {guia.historialCompleto.length > 0 ? (
                                  <div className="space-y-2">
                                    {guia.historialCompleto.map((evento, idx) => (
                                      <div key={idx} className="flex items-start gap-3 text-sm">
                                        <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-cyan-500"></div>
                                        <div>
                                          <span className="text-slate-500 dark:text-slate-400">
                                            {formatDateTime(evento.fecha)}
                                          </span>
                                          <span className="mx-2 text-slate-300 dark:text-slate-600">
                                            •
                                          </span>
                                          <span className="font-medium text-slate-700 dark:text-slate-300">
                                            {evento.ubicacion}
                                          </span>
                                          <p className="text-slate-600 dark:text-slate-400">
                                            {evento.descripcion}
                                          </p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-slate-500 text-sm">
                                    No hay historial detallado disponible
                                  </p>
                                )}
                                {cambio && (
                                  <div className="mt-4 p-3 bg-white dark:bg-navy-900 rounded-lg border border-slate-200 dark:border-navy-700">
                                    <h5 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                                      <GitCompare className="w-4 h-4 text-purple-500" />
                                      Cambio vs Sesión Anterior
                                    </h5>
                                    <div className="flex items-center gap-3 text-sm">
                                      <span className="text-slate-500">
                                        {cambio.estadoAnterior}
                                      </span>
                                      <ArrowRight className="w-4 h-4 text-slate-400" />
                                      <span
                                        className={
                                          cambio.mejora
                                            ? 'text-emerald-600 font-bold'
                                            : 'text-red-600 font-bold'
                                        }
                                      >
                                        {cambio.estadoActual}
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Carga */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-navy-900 rounded-2xl w-full max-w-2xl shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-navy-700">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Upload className="w-6 h-6 text-cyan-500" />
                Cargar Nueva Sesión
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-navy-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Subir Archivo */}
              <div>
                <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
                  Subir Archivo Excel o TXT
                </h4>
                <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-300 dark:border-navy-600 rounded-xl cursor-pointer hover:border-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-900/10 transition-all">
                  <FileUp className="w-12 h-12 text-slate-400 mb-3" />
                  <span className="text-slate-600 dark:text-slate-400 font-medium">
                    Click para seleccionar archivo
                  </span>
                  <span className="text-xs text-slate-400 mt-1">Formatos: .xlsx, .xls, .txt</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={isLoading}
                  />
                </label>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-navy-700"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="px-4 bg-white dark:bg-navy-900 text-sm text-slate-500">o</span>
                </div>
              </div>

              {/* Pegar Texto */}
              <div>
                <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-500" />
                  Pegar Texto de Tracking
                </h4>
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Pega aquí el texto de tracking de 17TRACK..."
                  className="w-full h-40 p-4 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 text-slate-800 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono text-sm"
                  disabled={isLoading}
                />
                <button
                  onClick={handleLoadFromText}
                  disabled={!textInput.trim() || isLoading}
                  className="mt-3 w-full py-3 bg-purple-500 hover:bg-purple-600 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white font-bold rounded-xl transition-colors"
                >
                  {isLoading ? 'Procesando...' : 'Cargar desde Texto'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InteligenciaLogisticaTab;
