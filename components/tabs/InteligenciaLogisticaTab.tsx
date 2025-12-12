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
  Brain,
  Sun,
  Cloud,
  Snowflake,
  Shield,
  Save,
  FolderOpen,
  Trash2,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import { SessionComparisonUI, DashboardManana } from '../intelligence';
import { RescueQueueUI } from '../RescueSystem';
import { GitCompare, Sunrise } from 'lucide-react';

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
  guiasDetalle?: GuiaLogistica[];
  analisisIA?: string;
  accionRecomendada?: string;
}

// Interface para sesiones guardadas
interface SesionGuardada {
  id: string;
  fecha: string;
  hora: string;
  nombre: string;
  totalGuias: number;
  guias: GuiaLogistica[];
}

// =====================================
// FUNCIONES DE ANÁLISIS ML
// =====================================
const FESTIVOS_COLOMBIA_IL = [
  '2025-01-01', '2025-01-06', '2025-03-24', '2025-04-17', '2025-04-18',
  '2025-05-01', '2025-06-02', '2025-06-23', '2025-06-30', '2025-07-20',
  '2025-08-07', '2025-08-18', '2025-10-13', '2025-11-03', '2025-11-17',
  '2025-12-08', '2025-12-25',
  '2026-01-01', '2026-01-12', '2026-03-23', '2026-04-02', '2026-04-03',
];

const getSeasonInfoIL = (): { season: string; impact: number; icon: React.ReactNode; color: string } => {
  const month = new Date().getMonth();
  if (month >= 10 || month <= 1) {
    return { season: 'Alta (Navidad)', impact: -15, icon: <Snowflake className="w-3.5 h-3.5" />, color: 'text-blue-500' };
  }
  if (month >= 3 && month <= 5) {
    return { season: 'Lluvias', impact: -10, icon: <Cloud className="w-3.5 h-3.5" />, color: 'text-slate-500' };
  }
  if (month >= 6 && month <= 8) {
    return { season: 'Seca', impact: 5, icon: <Sun className="w-3.5 h-3.5" />, color: 'text-yellow-500' };
  }
  return { season: 'Normal', impact: 0, icon: <Sun className="w-3.5 h-3.5" />, color: 'text-amber-500' };
};

const isNearHolidayIL = (): boolean => {
  const today = new Date();
  const threeDaysBefore = new Date(today);
  threeDaysBefore.setDate(today.getDate() - 3);
  const threeDaysAfter = new Date(today);
  threeDaysAfter.setDate(today.getDate() + 3);

  return FESTIVOS_COLOMBIA_IL.some(holiday => {
    const h = new Date(holiday);
    return h >= threeDaysBefore && h <= threeDaysAfter;
  });
};

interface AnomaliaIL {
  guia: GuiaLogistica;
  tipo: 'SIN_MOVIMIENTO' | 'TRANSITO_LARGO' | 'OFICINA_MUCHO' | 'NOVEDAD_ABIERTA';
  severidad: 'CRITICO' | 'ALTO' | 'MEDIO';
  descripcion: string;
  recomendacion: string;
}

const detectarAnomaliasIL = (guias: GuiaLogistica[]): AnomaliaIL[] => {
  const anomalias: AnomaliaIL[] = [];

  guias.forEach(g => {
    if (g.estadoActual.toLowerCase().includes('entregado')) return;

    // Sin movimiento > 3 días
    if (g.diasTranscurridos >= 3) {
      const ultimoEvento = g.ultimos2Estados[0]?.descripcion?.toLowerCase() || '';
      if (!ultimoEvento.includes('entregado')) {
        anomalias.push({
          guia: g,
          tipo: 'SIN_MOVIMIENTO',
          severidad: g.diasTranscurridos >= 5 ? 'CRITICO' : 'ALTO',
          descripcion: `${g.diasTranscurridos} días sin movimiento`,
          recomendacion: 'Contactar transportadora urgente'
        });
      }
    }

    // En oficina/centro mucho tiempo
    const estado = g.estadoActual.toLowerCase();
    if ((estado.includes('oficina') || estado.includes('centro')) && g.diasTranscurridos >= 3) {
      anomalias.push({
        guia: g,
        tipo: 'OFICINA_MUCHO',
        severidad: g.diasTranscurridos >= 5 ? 'CRITICO' : 'MEDIO',
        descripcion: `${g.diasTranscurridos} días en oficina sin retiro`,
        recomendacion: 'Llamar cliente para coordinar retiro'
      });
    }

    // Novedad sin gestión
    if (g.tieneNovedad && g.diasTranscurridos >= 2) {
      anomalias.push({
        guia: g,
        tipo: 'NOVEDAD_ABIERTA',
        severidad: 'ALTO',
        descripcion: 'Novedad abierta sin resolver',
        recomendacion: 'Gestionar novedad con transportadora'
      });
    }
  });

  const orden = { CRITICO: 0, ALTO: 1, MEDIO: 2 };
  return anomalias.sort((a, b) => orden[a.severidad] - orden[b.severidad]);
};

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
  const [selectedAlerta, setSelectedAlerta] = useState<string | null>(null);
  const [selectedRecomendacion, setSelectedRecomendacion] = useState<string | null>(null);
  const [showAlertaModal, setShowAlertaModal] = useState(false);
  const [showRecomendacionModal, setShowRecomendacionModal] = useState(false);
  const [sesionesGuardadas, setSesionesGuardadas] = useState<SesionGuardada[]>([]);
  const [showSesionesModal, setShowSesionesModal] = useState(false);
  const [showComparisonPanel, setShowComparisonPanel] = useState(false);
  const [showRescuePanel, setShowRescuePanel] = useState(false);
  const [showDashboardManana, setShowDashboardManana] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cargar sesiones guardadas al iniciar
  useEffect(() => {
    const sesionesStorage = localStorage.getItem('inteligencia_logistica_sesiones');
    if (sesionesStorage) {
      try {
        const sesiones = JSON.parse(sesionesStorage);
        setSesionesGuardadas(sesiones);
      } catch (e) {
        console.error('Error al cargar sesiones:', e);
      }
    }
  }, []);

  // Guardar sesión actual
  const guardarSesion = () => {
    if (guiasLogisticas.length === 0) {
      alert('No hay guías para guardar');
      return;
    }

    const ahora = new Date();
    const fecha = ahora.toLocaleDateString('es-CO', { year: 'numeric', month: '2-digit', day: '2-digit' });
    const hora = ahora.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

    const nuevaSesion: SesionGuardada = {
      id: `sesion_${Date.now()}`,
      fecha,
      hora,
      nombre: `Sesión ${fecha} ${hora}`,
      totalGuias: guiasLogisticas.length,
      guias: guiasLogisticas,
    };

    const nuevasSesiones = [nuevaSesion, ...sesionesGuardadas];
    setSesionesGuardadas(nuevasSesiones);
    localStorage.setItem('inteligencia_logistica_sesiones', JSON.stringify(nuevasSesiones));
    alert(`Sesión guardada: ${nuevaSesion.nombre}`);
  };

  // Cargar una sesión
  const cargarSesion = (sesion: SesionGuardada) => {
    setGuiasLogisticas(sesion.guias);
    setShowSesionesModal(false);
    alert(`Sesión cargada: ${sesion.nombre}`);
  };

  // Eliminar una sesión
  const eliminarSesion = (id: string) => {
    const nuevasSesiones = sesionesGuardadas.filter(s => s.id !== id);
    setSesionesGuardadas(nuevasSesiones);
    localStorage.setItem('inteligencia_logistica_sesiones', JSON.stringify(nuevasSesiones));
  };

  // Obtener sesiones agrupadas por fecha
  const sesionesAgrupadas = useMemo(() => {
    const grupos: Record<string, SesionGuardada[]> = {};
    sesionesGuardadas.forEach(sesion => {
      if (!grupos[sesion.fecha]) {
        grupos[sesion.fecha] = [];
      }
      grupos[sesion.fecha].push(sesion);
    });
    return grupos;
  }, [sesionesGuardadas]);

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

  // Parsear archivo Excel
  const parseExcelFile = async (file: File): Promise<GuiaLogistica[]> => {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

    const guias: GuiaLogistica[] = [];

    // Detectar columnas por encabezados (primera fila)
    const headers = jsonData[0]?.map((h: any) => String(h).toLowerCase().trim()) || [];

    // Mapeo flexible de columnas
    const colMap = {
      guia: headers.findIndex((h: string) => h.includes('guia') || h.includes('guía') || h.includes('numero') || h.includes('número') || h.includes('tracking')),
      telefono: headers.findIndex((h: string) => h.includes('telefono') || h.includes('teléfono') || h.includes('celular') || h.includes('phone') || h.includes('movil')),
      transportadora: headers.findIndex((h: string) => h.includes('transportadora') || h.includes('carrier') || h.includes('empresa')),
      origen: headers.findIndex((h: string) => h.includes('origen') || h.includes('from') || h.includes('remitente')),
      destino: headers.findIndex((h: string) => h.includes('destino') || h.includes('ciudad') || h.includes('to') || h.includes('destinatario')),
      estado: headers.findIndex((h: string) => h.includes('estado') || h.includes('status') || h.includes('estatus')),
      dias: headers.findIndex((h: string) => h.includes('dias') || h.includes('días') || h.includes('days') || h.includes('tiempo')),
      novedad: headers.findIndex((h: string) => h.includes('novedad') || h.includes('issue') || h.includes('problema')),
      cliente: headers.findIndex((h: string) => h.includes('cliente') || h.includes('nombre') || h.includes('customer')),
    };

    // Si no hay encabezados reconocidos, intentar usar índices por defecto
    if (colMap.guia === -1) colMap.guia = 0;
    if (colMap.estado === -1 && headers.length > 1) colMap.estado = 1;
    if (colMap.destino === -1 && headers.length > 2) colMap.destino = 2;

    // Procesar filas (empezar desde 1 si hay encabezados)
    const startRow = headers.some((h: string) => h.includes('guia') || h.includes('estado') || h.includes('tracking')) ? 1 : 0;

    for (let i = startRow; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (!row || row.length === 0) continue;

      const numeroGuia = String(row[colMap.guia] || '').trim();
      if (!numeroGuia || numeroGuia.length < 5) continue;

      const estadoActual = String(row[colMap.estado] || 'Pendiente').trim();
      const ciudadDestino = String(row[colMap.destino] || 'Desconocido').trim();
      const transportadora = String(row[colMap.transportadora] || 'Desconocido').trim();
      const telefono = colMap.telefono !== -1 ? String(row[colMap.telefono] || '').trim() : undefined;
      const diasTranscurridos = colMap.dias !== -1 ? parseInt(String(row[colMap.dias] || '0')) || 0 : 0;
      const ciudadOrigen = colMap.origen !== -1 ? String(row[colMap.origen] || 'Colombia').trim() : 'Colombia';

      // Detectar novedad
      const tieneNovedad =
        estadoActual.toLowerCase().includes('novedad') ||
        estadoActual.toLowerCase().includes('devuelto') ||
        estadoActual.toLowerCase().includes('rechaz') ||
        estadoActual.toLowerCase().includes('problema') ||
        (colMap.novedad !== -1 && row[colMap.novedad]);

      guias.push({
        numeroGuia,
        telefono: telefono || undefined,
        transportadora,
        ciudadOrigen,
        ciudadDestino,
        estadoActual,
        diasTranscurridos,
        tieneNovedad,
        ultimos2Estados: [],
        historialCompleto: [],
      });
    }

    return guias;
  };

  // Cargar datos desde archivo Excel/TXT
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const fileName = file.name.toLowerCase();
      let guias: GuiaLogistica[] = [];

      if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        // Archivo Excel
        guias = await parseExcelFile(file);
      } else {
        // Archivo de texto (TXT/CSV)
        const text = await file.text();
        const phoneRegistry = phoneInput.trim() ? parsePhoneRegistry(phoneInput) : undefined;
        guias = parseTrackingText(text, phoneRegistry);
      }

      if (guias.length === 0) {
        alert('No se encontraron guías en el archivo. Verifica el formato.');
      } else {
        setGuiasLogisticas(guias);
        setShowUploadModal(false);
        alert(`${guias.length} guías cargadas correctamente`);
      }
    } catch (error) {
      console.error('Error reading file:', error);
      alert('Error al leer el archivo. Verifica el formato.');
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

  // Recomendaciones IA - Mejoradas con análisis detallado
  const recomendaciones = useMemo((): RecomendacionIA[] => {
    if (guiasLogisticas.length === 0) return [];
    const recs: RecomendacionIA[] = [];

    // Guías urgentes (más de 3 días sin entregar)
    const guiasUrgentesData = guiasLogisticas.filter(g =>
      g.diasTranscurridos > 3 && !g.estadoActual.toLowerCase().includes('entregado')
    );

    if (guiasUrgentesData.length > 0) {
      const transportadorasAfectadas = [...new Set(guiasUrgentesData.map(g => g.transportadora))];
      const ciudadesAfectadas = [...new Set(guiasUrgentesData.map(g => g.ciudadDestino))];
      recs.push({
        id: 'rec-llamadas-urgentes',
        texto: `${guiasUrgentesData.length} guías requieren seguimiento urgente hoy`,
        impacto: 'alto',
        guiasRelacionadas: guiasUrgentesData.length,
        guiasDetalle: guiasUrgentesData,
        analisisIA: `Análisis de IA: Se detectaron ${guiasUrgentesData.length} envíos con más de 3 días sin entrega. Las transportadoras involucradas son: ${transportadorasAfectadas.join(', ')}. Ciudades de destino más afectadas: ${ciudadesAfectadas.slice(0, 3).join(', ')}. El promedio de días de estas guías es ${Math.round(guiasUrgentesData.reduce((acc, g) => acc + g.diasTranscurridos, 0) / guiasUrgentesData.length)} días.`,
        accionRecomendada: 'Contactar inmediatamente a las transportadoras y clientes para acelerar entregas'
      });
    }

    // Guías devueltas
    const devueltasData = guiasLogisticas.filter(g => g.estadoActual.toLowerCase().includes('devuelto'));
    if (devueltasData.length > 0) {
      const razonesComunes = devueltasData.map(g => g.ultimos2Estados[0]?.descripcion || 'Sin información').slice(0, 5);
      recs.push({
        id: 'rec-devueltas',
        texto: `Hay ${devueltasData.length} guías devueltas pendientes de gestión`,
        impacto: 'alto',
        guiasRelacionadas: devueltasData.length,
        guiasDetalle: devueltasData,
        analisisIA: `Análisis de IA: ${devueltasData.length} paquetes fueron devueltos. Esto representa el ${estadisticas.tasaDevolucion}% de devoluciones. Razones detectadas en últimos movimientos: ${[...new Set(razonesComunes)].join('; ')}. Impacto económico estimado: alto.`,
        accionRecomendada: 'Contactar clientes para reprogramar envíos y verificar direcciones'
      });
    }

    // Guías en centro/oficina mucho tiempo
    const enCentroData = guiasLogisticas.filter(g =>
      (g.estadoActual.toLowerCase().includes('centro') || g.estadoActual.toLowerCase().includes('oficina')) &&
      g.diasTranscurridos >= 2
    );
    if (enCentroData.length > 0) {
      recs.push({
        id: 'rec-en-centro',
        texto: `${enCentroData.length} guías en centro/oficina esperando retiro`,
        impacto: 'medio',
        guiasRelacionadas: enCentroData.length,
        guiasDetalle: enCentroData,
        analisisIA: `Análisis de IA: ${enCentroData.length} paquetes están en centros logísticos o oficinas de entrega sin ser recogidos. El tiempo promedio de espera es ${Math.round(enCentroData.reduce((acc, g) => acc + g.diasTranscurridos, 0) / enCentroData.length)} días. ${enCentroData.filter(g => g.telefono).length} de estas guías tienen teléfono disponible para contacto.`,
        accionRecomendada: 'Llamar a clientes para coordinar retiro antes de que sean devueltas'
      });
    }

    // Guías con novedad sin resolver
    const conNovedadData = guiasLogisticas.filter(g =>
      g.tieneNovedad &&
      !g.estadoActual.toLowerCase().includes('devuelto') &&
      !g.estadoActual.toLowerCase().includes('entregado')
    );
    if (conNovedadData.length > 0) {
      recs.push({
        id: 'rec-novedades',
        texto: `${conNovedadData.length} guías con novedad requieren gestión`,
        impacto: 'alto',
        guiasRelacionadas: conNovedadData.length,
        guiasDetalle: conNovedadData,
        analisisIA: `Análisis de IA: Se detectaron ${conNovedadData.length} envíos con novedades activas sin resolver. Las novedades más comunes incluyen intentos de entrega fallidos y problemas de dirección. El ${Math.round((conNovedadData.filter(g => g.telefono).length / conNovedadData.length) * 100)}% tienen teléfono para gestión directa.`,
        accionRecomendada: 'Gestionar novedades con transportadoras y contactar clientes'
      });
    }

    // Tasa de entrega baja
    if (estadisticas.tasaEntrega < 70 && guiasLogisticas.length >= 5) {
      const sinEntregar = guiasLogisticas.filter(g => !g.estadoActual.toLowerCase().includes('entregado'));
      recs.push({
        id: 'rec-tasa-baja',
        texto: `Tasa de entrega baja (${estadisticas.tasaEntrega}%), revisar procesos`,
        impacto: 'medio',
        guiasRelacionadas: sinEntregar.length,
        guiasDetalle: sinEntregar,
        analisisIA: `Análisis de IA: La tasa de entrega actual es del ${estadisticas.tasaEntrega}%, por debajo del objetivo del 70%. De ${guiasLogisticas.length} guías totales, ${sinEntregar.length} aún no han sido entregadas. Las transportadoras con peor rendimiento deben ser evaluadas. Recomendación: revisar tiempos de despacho y zonas de cobertura.`,
        accionRecomendada: 'Evaluar transportadoras y optimizar rutas de entrega'
      });
    }

    // Transportadora problemática
    const transportadorasStats: Record<string, { total: number; entregadas: number; problemas: number }> = {};
    guiasLogisticas.forEach(g => {
      if (!transportadorasStats[g.transportadora]) {
        transportadorasStats[g.transportadora] = { total: 0, entregadas: 0, problemas: 0 };
      }
      transportadorasStats[g.transportadora].total++;
      if (g.estadoActual.toLowerCase().includes('entregado')) {
        transportadorasStats[g.transportadora].entregadas++;
      }
      if (g.tieneNovedad || g.diasTranscurridos > 5) {
        transportadorasStats[g.transportadora].problemas++;
      }
    });

    const peorTransportadora = Object.entries(transportadorasStats)
      .filter(([, stats]) => stats.total >= 3)
      .sort((a, b) => (a[1].entregadas / a[1].total) - (b[1].entregadas / b[1].total))[0];

    if (peorTransportadora && (peorTransportadora[1].entregadas / peorTransportadora[1].total) < 0.5) {
      const guiasProblematicas = guiasLogisticas.filter(g => g.transportadora === peorTransportadora[0]);
      recs.push({
        id: 'rec-transportadora-problematica',
        texto: `${peorTransportadora[0]} tiene ${Math.round((peorTransportadora[1].entregadas / peorTransportadora[1].total) * 100)}% de entrega`,
        impacto: 'medio',
        guiasRelacionadas: peorTransportadora[1].total,
        guiasDetalle: guiasProblematicas,
        analisisIA: `Análisis de IA: La transportadora ${peorTransportadora[0]} tiene el rendimiento más bajo con solo ${Math.round((peorTransportadora[1].entregadas / peorTransportadora[1].total) * 100)}% de entregas exitosas de ${peorTransportadora[1].total} guías. ${peorTransportadora[1].problemas} guías presentan problemas. Se recomienda evaluar alternativas o escalar con el proveedor.`,
        accionRecomendada: 'Contactar transportadora para mejorar servicio o evaluar alternativas'
      });
    }

    return recs.slice(0, 6);
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

  // Manejar click en alertas para mostrar detalle
  const handleAlertaClick = (alertaId: string) => {
    setSelectedAlerta(alertaId);
    setShowAlertaModal(true);
  };

  // Manejar click en recomendaciones para mostrar detalle
  const handleRecomendacionClick = (recId: string) => {
    setSelectedRecomendacion(recId);
    setShowRecomendacionModal(true);
  };

  // Obtener guías de alerta seleccionada
  const getGuiasDeAlerta = useCallback((alertaId: string): GuiaLogistica[] => {
    const alerta = alertas.find(a => a.id === alertaId);
    if (!alerta) return [];
    return guiasLogisticas.filter(g => alerta.guiasAfectadas.includes(g.numeroGuia));
  }, [alertas, guiasLogisticas]);

  // Obtener recomendación seleccionada
  const getRecomendacionSeleccionada = useCallback(() => {
    return recomendaciones.find(r => r.id === selectedRecomendacion);
  }, [recomendaciones, selectedRecomendacion]);

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
            {sesionesGuardadas.length > 0 && (
              <button
                onClick={() => setShowSesionesModal(true)}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-bold hover:from-amber-600 hover:to-orange-700 transition-all shadow-lg"
              >
                <FolderOpen className="w-5 h-5" />
                Sesiones Guardadas ({sesionesGuardadas.length})
              </button>
            )}
          </div>
        </div>

        {/* Panel de sesiones guardadas preview */}
        {sesionesGuardadas.length > 0 && (
          <div className="bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-700 p-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-amber-500" />
              Sesiones Recientes
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sesionesGuardadas.slice(0, 6).map((sesion) => (
                <button
                  key={sesion.id}
                  onClick={() => cargarSesion(sesion)}
                  className="flex flex-col p-4 bg-slate-50 dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-navy-700 hover:border-amber-400 dark:hover:border-amber-500 transition-all text-left group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-slate-800 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      {sesion.fecha}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {sesion.hora}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-cyan-500" />
                    <span className="text-sm text-slate-600 dark:text-slate-300">
                      {sesion.totalGuias} guías
                    </span>
                  </div>
                </button>
              ))}
            </div>
            {sesionesGuardadas.length > 6 && (
              <button
                onClick={() => setShowSesionesModal(true)}
                className="mt-4 text-sm text-amber-600 dark:text-amber-400 hover:underline"
              >
                Ver todas las sesiones ({sesionesGuardadas.length})
              </button>
            )}
          </div>
        )}

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
                    Subir archivo (Excel, TXT, CSV)
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,.csv,.xlsx,.xls"
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
            onClick={() => setShowDashboardManana(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg font-medium transition-all shadow-lg"
            title="Dashboard de predicciones del día"
          >
            <Sunrise className="w-4 h-4" />
            Mi Día
          </button>
          <button
            onClick={guardarSesion}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-all"
          >
            <Save className="w-4 h-4" />
            Guardar Sesión
          </button>
          <button
            onClick={() => setShowSesionesModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-all"
          >
            <FolderOpen className="w-4 h-4" />
            Sesiones ({sesionesGuardadas.length})
          </button>
          <button
            onClick={() => setShowComparisonPanel(true)}
            disabled={sesionesGuardadas.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-400 text-white rounded-lg font-medium transition-all"
            title="Comparar sesiones para detectar guías estancadas"
          >
            <GitCompare className="w-4 h-4" />
            Comparar
          </button>
          <button
            onClick={() => setShowRescuePanel(true)}
            disabled={guiasLogisticas.filter(g => g.tieneNovedad).length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-slate-400 text-white rounded-lg font-medium transition-all"
            title="Cola de rescate para guías con novedad"
          >
            <Shield className="w-4 h-4" />
            Rescate ({guiasLogisticas.filter(g => g.tieneNovedad).length})
          </button>
          <button
            onClick={exportarExcel}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-all"
          >
            <Table className="w-4 h-4" />
            Exportar Excel
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

      {/* ====================================== */}
      {/* PANEL DE ANÁLISIS ML COMPACTO */}
      {/* ====================================== */}
      {(() => {
        const total = guiasLogisticas.length;
        if (total === 0) return null;

        const anomalias = detectarAnomaliasIL(guiasLogisticas);
        const anomaliasCriticas = anomalias.filter(a => a.severidad === 'CRITICO').length;
        const anomaliasAltas = anomalias.filter(a => a.severidad === 'ALTO').length;
        const season = getSeasonInfoIL();
        const nearHoliday = isNearHolidayIL();

        // Score de salud logística
        let scoreBase = 70;
        scoreBase += (estadisticas.tasaEntrega - 50) * 0.3;
        scoreBase -= estadisticas.guiasEnRiesgo * 0.5;
        scoreBase -= anomaliasCriticas * 5;
        scoreBase += season.impact;
        if (nearHoliday) scoreBase -= 10;
        const score = Math.min(100, Math.max(0, Math.round(scoreBase)));

        const getScoreColor = (s: number) => {
          if (s >= 80) return 'text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30';
          if (s >= 60) return 'text-amber-500 bg-amber-100 dark:bg-amber-900/30';
          return 'text-red-500 bg-red-100 dark:bg-red-900/30';
        };

        const getScoreLabel = (s: number) => {
          if (s >= 80) return 'Excelente';
          if (s >= 60) return 'Regular';
          return 'Crítico';
        };

        return (
          <div className="bg-gradient-to-r from-slate-50 to-cyan-50 dark:from-navy-900 dark:to-navy-800 rounded-xl border border-slate-200 dark:border-navy-700 p-3">
            <div className="flex flex-wrap items-center gap-3 justify-between">
              {/* Score de Salud */}
              <div className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold ${getScoreColor(score)}`}>
                  <Brain className="w-4 h-4" />
                  <span className="text-lg">{score}</span>
                  <span className="text-xs font-normal">/ 100</span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-medium">{getScoreLabel(score)}</span>
                </div>
              </div>

              {/* Indicadores Rápidos */}
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <Target className={`w-3.5 h-3.5 ${estadisticas.tasaEntrega >= 70 ? 'text-emerald-500' : 'text-amber-500'}`} />
                  <span className="text-slate-600 dark:text-slate-300">
                    <span className="font-bold">{estadisticas.tasaEntrega}%</span> entrega
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-blue-500" />
                  <span className="text-slate-600 dark:text-slate-300">
                    <span className="font-bold">{estadisticas.totalActivas}</span> activas
                  </span>
                </div>

                {estadisticas.guiasEnRiesgo > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-orange-500" />
                    <span className="text-orange-600 dark:text-orange-400">
                      <span className="font-bold">{estadisticas.guiasEnRiesgo}</span> en riesgo
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-1.5">
                  <span className={season.color}>{season.icon}</span>
                  <span className="text-slate-500 dark:text-slate-400">{season.season}</span>
                  {nearHoliday && (
                    <span className="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded text-[10px] font-medium">
                      Festivo
                    </span>
                  )}
                </div>
              </div>

              {/* Anomalías */}
              {(anomaliasCriticas > 0 || anomaliasAltas > 0) && (
                <div className="flex items-center gap-2">
                  {anomaliasCriticas > 0 && (
                    <span className="flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-xs font-medium">
                      <Zap className="w-3 h-3" />
                      {anomaliasCriticas} críticos
                    </span>
                  )}
                  {anomaliasAltas > 0 && (
                    <span className="flex items-center gap-1 px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg text-xs font-medium">
                      <AlertCircle className="w-3 h-3" />
                      {anomaliasAltas} alertas
                    </span>
                  )}
                </div>
              )}
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

      {/* Sistema de Alertas - BOTONES DINÁMICOS CLICKEABLES */}
      {alertas.length > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-amber-50 dark:from-red-900/20 dark:to-amber-900/20 rounded-xl border border-red-200 dark:border-red-800 overflow-hidden">
          <div className="p-4 border-b border-red-200 dark:border-red-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500 rounded-lg animate-pulse">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white">
                  {alertas.length} Alertas Activas - Click para ver detalles
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Haz clic en cada alerta para ver las guías afectadas</p>
              </div>
            </div>
          </div>

          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {alertas.map(alerta => {
              const AlertIcon = alerta.icono;
              const colors: Record<string, string> = {
                critico: 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700 hover:bg-red-200 dark:hover:bg-red-900/50',
                urgente: 'bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700 hover:bg-orange-200 dark:hover:bg-orange-900/50',
                atencion: 'bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700 hover:bg-amber-200 dark:hover:bg-amber-900/50',
                advertencia: 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 hover:bg-blue-200 dark:hover:bg-blue-900/50',
              };
              const textColors: Record<string, string> = {
                critico: 'text-red-700 dark:text-red-400',
                urgente: 'text-orange-700 dark:text-orange-400',
                atencion: 'text-amber-700 dark:text-amber-400',
                advertencia: 'text-blue-700 dark:text-blue-400',
              };
              const iconBg: Record<string, string> = {
                critico: 'bg-red-500',
                urgente: 'bg-orange-500',
                atencion: 'bg-amber-500',
                advertencia: 'bg-blue-500',
              };

              return (
                <button
                  key={alerta.id}
                  onClick={() => handleAlertaClick(alerta.id)}
                  className={`p-4 rounded-xl border-2 ${colors[alerta.tipo]} cursor-pointer transition-all transform hover:scale-[1.02] hover:shadow-lg text-left w-full`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 ${iconBg[alerta.tipo]} rounded-lg`}>
                      <AlertIcon className="w-4 h-4 text-white" />
                    </div>
                    <span className={`text-xs font-bold uppercase ${textColors[alerta.tipo]}`}>
                      {alerta.tipo}
                    </span>
                  </div>
                  <h4 className={`font-bold text-lg ${textColors[alerta.tipo]}`}>{alerta.titulo}</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{alerta.descripcion}</p>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-current/10">
                    <span className="flex items-center gap-1 text-xs font-medium bg-white/60 dark:bg-black/20 px-2 py-1 rounded-full">
                      <Package className="w-3 h-3" />
                      {alerta.guiasAfectadas.length} guías
                    </span>
                    <span className="flex items-center gap-1 text-xs font-bold text-cyan-600 dark:text-cyan-400">
                      Ver lista <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
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

          {/* Recomendaciones IA - BOTONES DINÁMICOS CLICKEABLES */}
          <div className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-700 p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white">Recomendaciones IA</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Click en cada recomendación para ver análisis completo</p>
              </div>
            </div>
            <div className="space-y-3">
              {recomendaciones.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Lightbulb className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p>Sin recomendaciones por ahora</p>
                </div>
              ) : (
                recomendaciones.map(rec => {
                  const impactoColors: Record<string, { bg: string; border: string; hover: string; text: string; icon: string }> = {
                    alto: {
                      bg: 'bg-red-50 dark:bg-red-900/20',
                      border: 'border-red-200 dark:border-red-800',
                      hover: 'hover:bg-red-100 dark:hover:bg-red-900/40',
                      text: 'text-red-700 dark:text-red-400',
                      icon: 'bg-red-500'
                    },
                    medio: {
                      bg: 'bg-amber-50 dark:bg-amber-900/20',
                      border: 'border-amber-200 dark:border-amber-800',
                      hover: 'hover:bg-amber-100 dark:hover:bg-amber-900/40',
                      text: 'text-amber-700 dark:text-amber-400',
                      icon: 'bg-amber-500'
                    },
                    bajo: {
                      bg: 'bg-blue-50 dark:bg-blue-900/20',
                      border: 'border-blue-200 dark:border-blue-800',
                      hover: 'hover:bg-blue-100 dark:hover:bg-blue-900/40',
                      text: 'text-blue-700 dark:text-blue-400',
                      icon: 'bg-blue-500'
                    },
                  };
                  const colors = impactoColors[rec.impacto];
                  return (
                    <button
                      key={rec.id}
                      onClick={() => handleRecomendacionClick(rec.id)}
                      className={`w-full p-4 rounded-xl border-2 ${colors.bg} ${colors.border} ${colors.hover} cursor-pointer transition-all transform hover:scale-[1.01] hover:shadow-md text-left`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 ${colors.icon} rounded-lg flex-shrink-0`}>
                          <Zap className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-bold uppercase ${colors.text}`}>
                              Impacto {rec.impacto}
                            </span>
                            {rec.guiasRelacionadas && (
                              <span className="text-xs bg-white/60 dark:bg-black/20 px-2 py-0.5 rounded-full">
                                {rec.guiasRelacionadas} guías
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-medium text-slate-800 dark:text-white">{rec.texto}</p>
                          {rec.accionRecomendada && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
                              {rec.accionRecomendada}
                            </p>
                          )}
                          <div className="flex items-center gap-1 mt-2 text-xs font-bold text-cyan-600 dark:text-cyan-400">
                            <Brain className="w-3 h-3" />
                            Ver análisis IA completo <ChevronRight className="w-3 h-3" />
                          </div>
                        </div>
                      </div>
                    </button>
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
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Fecha
                  </div>
                </th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                  <div className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" />
                    Teléfono
                  </div>
                </th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase cursor-pointer hover:bg-slate-100 dark:hover:bg-navy-700" onClick={() => handleSort('numeroGuia')}>
                  <div className="flex items-center gap-1">
                    <Package className="w-3.5 h-3.5" />
                    Número Guía
                    {sortColumn === 'numeroGuia' && (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                  </div>
                </th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase cursor-pointer hover:bg-slate-100 dark:hover:bg-navy-700" onClick={() => handleSort('estadoActual')}>
                  <div className="flex items-center gap-1">
                    Estatus
                    {sortColumn === 'estadoActual' && (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                  </div>
                </th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase cursor-pointer hover:bg-slate-100 dark:hover:bg-navy-700" onClick={() => handleSort('ciudadDestino')}>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    Ciudad Destino
                    {sortColumn === 'ciudadDestino' && (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                  </div>
                </th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase cursor-pointer hover:bg-slate-100 dark:hover:bg-navy-700" onClick={() => handleSort('transportadora')}>
                  <div className="flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5" />
                    Transportadora
                    {sortColumn === 'transportadora' && (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                  </div>
                </th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                  <div className="flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5" />
                    Último Movimiento
                  </div>
                </th>
                <th className="text-center px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                  <div className="flex items-center justify-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Hora
                  </div>
                </th>
                <th className="text-center px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Ver</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
              {guiasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                    <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No hay guías que mostrar</p>
                    <p className="text-sm">Ajusta los filtros o carga nuevos datos</p>
                  </td>
                </tr>
              ) : (
                guiasFiltradas.map(guia => {
                  const statusColors = getStatusColor(guia.estadoActual);
                  const isExpanded = expandedGuia === guia.numeroGuia;
                  const ultimoMovimiento = guia.ultimos2Estados[0];
                  const fechaUltimo = ultimoMovimiento?.fecha?.split(' ')[0] || 'N/A';
                  const horaUltimo = ultimoMovimiento?.fecha?.split(' ')[1] || 'N/A';

                  return (
                    <React.Fragment key={guia.numeroGuia}>
                      <tr className={`hover:bg-slate-50 dark:hover:bg-navy-800/50 ${isExpanded ? 'bg-cyan-50 dark:bg-cyan-900/20' : ''}`}>
                        {/* FECHA */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-blue-500" />
                            <span className="font-mono text-sm text-slate-700 dark:text-slate-300">{fechaUltimo}</span>
                          </div>
                        </td>

                        {/* TELÉFONO */}
                        <td className="px-4 py-3">
                          {guia.telefono ? (
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-sm text-green-600 dark:text-green-400">{guia.telefono}</span>
                              <button
                                onClick={() => copyToClipboard(guia.telefono!, 'phone', guia.numeroGuia)}
                                className={`p-1 rounded transition-all ${
                                  copiedPhone === guia.numeroGuia
                                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'
                                    : 'hover:bg-slate-100 dark:hover:bg-navy-700 text-slate-400'
                                }`}
                                title="Copiar"
                              >
                                {copiedPhone === guia.numeroGuia ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                              </button>
                              <button
                                onClick={() => makeCall(guia.telefono!)}
                                className="p-1 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 hover:bg-blue-200 transition-colors"
                                title="Llamar"
                              >
                                <PhoneCall className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => openWhatsApp(guia.telefono!, guia.numeroGuia)}
                                className="p-1 rounded bg-green-100 dark:bg-green-900/30 text-green-600 hover:bg-green-200 transition-colors"
                                title="WhatsApp"
                              >
                                <MessageSquare className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">Sin teléfono</span>
                          )}
                        </td>

                        {/* NÚMERO DE GUÍA */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-800 dark:text-white">{guia.numeroGuia}</span>
                            <button
                              onClick={() => copyToClipboard(guia.numeroGuia, 'guide', guia.numeroGuia)}
                              className={`p-1 rounded transition-all ${
                                copiedGuide === guia.numeroGuia
                                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'
                                  : 'hover:bg-slate-100 dark:hover:bg-navy-700 text-slate-400'
                              }`}
                              title="Copiar"
                            >
                              {copiedGuide === guia.numeroGuia ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                            {guia.tieneNovedad && (
                              <span className="px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs rounded font-medium">
                                Novedad
                              </span>
                            )}
                          </div>
                        </td>

                        {/* ESTATUS */}
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${statusColors.bg} ${statusColors.text} border ${statusColors.border}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusColors.dot}`}></span>
                            {guia.estadoActual}
                          </span>
                        </td>

                        {/* CIUDAD DESTINO */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-purple-500" />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{guia.ciudadDestino}</span>
                          </div>
                        </td>

                        {/* TRANSPORTADORA */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Truck className="w-4 h-4 text-slate-400" />
                            <span className="text-sm text-slate-600 dark:text-slate-300">{guia.transportadora}</span>
                          </div>
                        </td>

                        {/* ÚLTIMO MOVIMIENTO */}
                        <td className="px-4 py-3">
                          {ultimoMovimiento ? (
                            <div className="max-w-[200px]">
                              <p className="text-sm text-slate-700 dark:text-slate-300 truncate" title={ultimoMovimiento.descripcion}>
                                {ultimoMovimiento.descripcion}
                              </p>
                              <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3" />
                                {ultimoMovimiento.ubicacion}
                              </p>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">Sin información</span>
                          )}
                        </td>

                        {/* HORA DE ÚLTIMO MOVIMIENTO */}
                        <td className="px-4 py-3 text-center">
                          <span className="font-mono text-sm font-bold text-slate-700 dark:text-slate-300">{horaUltimo}</span>
                        </td>

                        {/* VER */}
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
                        <tr className="bg-gradient-to-r from-cyan-50/50 to-blue-50/50 dark:from-cyan-900/10 dark:to-blue-900/10">
                          <td colSpan={9} className="px-4 py-4">
                            <div className="space-y-4">
                              {/* RESUMEN DE LA GUÍA */}
                              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                                {/* Card Info Principal */}
                                <div className="lg:col-span-1 bg-white dark:bg-navy-800 rounded-xl p-4 border border-cyan-200 dark:border-cyan-800 shadow-sm">
                                  <h4 className="font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2 text-sm">
                                    <Package className="w-4 h-4 text-cyan-500" />
                                    Información General
                                  </h4>
                                  <div className="space-y-3">
                                    {/* Días en tránsito */}
                                    <div className={`p-3 rounded-lg ${
                                      guia.diasTranscurridos > 5
                                        ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                                        : guia.diasTranscurridos > 3
                                        ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
                                        : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                                    }`}>
                                      <div className="flex items-center justify-between">
                                        <span className="text-xs text-slate-500 dark:text-slate-400">Días en tránsito</span>
                                        <span className={`text-2xl font-bold ${
                                          guia.diasTranscurridos > 5 ? 'text-red-600 dark:text-red-400' :
                                          guia.diasTranscurridos > 3 ? 'text-amber-600 dark:text-amber-400' :
                                          'text-green-600 dark:text-green-400'
                                        }`}>
                                          {guia.diasTranscurridos}
                                        </span>
                                      </div>
                                      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                        {guia.diasTranscurridos > 5 ? '⚠️ Requiere atención urgente' :
                                         guia.diasTranscurridos > 3 ? '⏰ Monitorear de cerca' :
                                         '✅ Tiempo normal'}
                                      </div>
                                    </div>

                                    {/* Ruta */}
                                    <div className="flex items-center gap-2 text-sm">
                                      <MapPin className="w-4 h-4 text-purple-500" />
                                      <span className="text-slate-600 dark:text-slate-300">
                                        {guia.ciudadOrigen} → <span className="font-bold">{guia.ciudadDestino}</span>
                                      </span>
                                    </div>

                                    {/* Transportadora */}
                                    <div className="flex items-center gap-2 text-sm">
                                      <Truck className="w-4 h-4 text-blue-500" />
                                      <span className="text-slate-600 dark:text-slate-300 font-medium">{guia.transportadora}</span>
                                    </div>

                                    {/* Estado con novedad */}
                                    <div className="flex items-center gap-2">
                                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${statusColors.bg} ${statusColors.text}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${statusColors.dot}`}></span>
                                        {guia.estadoActual}
                                      </span>
                                      {guia.tieneNovedad && (
                                        <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs rounded-lg font-medium flex items-center gap-1">
                                          <AlertTriangle className="w-3 h-3" />
                                          Novedad
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Acciones rápidas */}
                                  <div className="mt-4 pt-3 border-t border-slate-200 dark:border-navy-700">
                                    <p className="text-xs text-slate-400 mb-2">Acciones rápidas</p>
                                    <div className="flex flex-wrap gap-2">
                                      {guia.telefono && (
                                        <>
                                          <button
                                            onClick={() => makeCall(guia.telefono!)}
                                            className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-xs hover:bg-blue-200 transition-colors"
                                          >
                                            <PhoneCall className="w-3 h-3" />
                                            Llamar
                                          </button>
                                          <button
                                            onClick={() => openWhatsApp(guia.telefono!, guia.numeroGuia)}
                                            className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg text-xs hover:bg-green-200 transition-colors"
                                          >
                                            <MessageSquare className="w-3 h-3" />
                                            WhatsApp
                                          </button>
                                        </>
                                      )}
                                      <a
                                        href={`https://t.17track.net/es#nums=${guia.numeroGuia}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg text-xs hover:bg-purple-200 transition-colors"
                                      >
                                        <Eye className="w-3 h-3" />
                                        17Track
                                      </a>
                                    </div>
                                  </div>
                                </div>

                                {/* Timeline de Movimientos */}
                                <div className="lg:col-span-3 bg-white dark:bg-navy-800 rounded-xl p-4 border border-cyan-200 dark:border-cyan-800 shadow-sm">
                                  <h4 className="font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2 text-sm">
                                    <Activity className="w-4 h-4 text-cyan-500" />
                                    Timeline de Movimientos
                                    <span className="text-xs bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 px-2 py-0.5 rounded-full">
                                      {guia.historialCompleto.length} eventos
                                    </span>
                                  </h4>
                                  {guia.historialCompleto.length === 0 ? (
                                    <div className="text-center py-8">
                                      <Activity className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                                      <p className="text-sm text-slate-400">No hay historial de movimientos disponible</p>
                                    </div>
                                  ) : (
                                    <div className="relative">
                                      {/* Línea vertical del timeline */}
                                      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-cyan-500 via-blue-400 to-slate-200 dark:to-slate-700"></div>

                                      <div className="space-y-1 max-h-80 overflow-y-auto pr-2">
                                        {guia.historialCompleto.map((evento, idx) => {
                                          const esEntregado = evento.descripcion.toLowerCase().includes('entregado');
                                          const esNovedad = evento.descripcion.toLowerCase().includes('devuelto') ||
                                                           evento.descripcion.toLowerCase().includes('no logramos') ||
                                                           evento.descripcion.toLowerCase().includes('rechaz');
                                          const esEnReparto = evento.descripcion.toLowerCase().includes('reparto') ||
                                                              evento.descripcion.toLowerCase().includes('viajando');

                                          return (
                                            <div key={idx} className={`flex items-start gap-4 p-3 rounded-lg transition-colors ${
                                              idx === 0 ? 'bg-cyan-50 dark:bg-cyan-900/20' : 'hover:bg-slate-50 dark:hover:bg-navy-700/50'
                                            }`}>
                                              {/* Punto del timeline */}
                                              <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                                idx === 0
                                                  ? esEntregado ? 'bg-emerald-500' :
                                                    esNovedad ? 'bg-red-500' :
                                                    esEnReparto ? 'bg-blue-500' :
                                                    'bg-cyan-500'
                                                  : 'bg-slate-200 dark:bg-slate-700'
                                              }`}>
                                                {idx === 0 ? (
                                                  esEntregado ? <CheckCircle className="w-4 h-4 text-white" /> :
                                                  esNovedad ? <AlertTriangle className="w-4 h-4 text-white" /> :
                                                  esEnReparto ? <Truck className="w-4 h-4 text-white" /> :
                                                  <Activity className="w-4 h-4 text-white" />
                                                ) : (
                                                  <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500"></span>
                                                )}
                                              </div>

                                              {/* Contenido */}
                                              <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                  <span className="font-mono text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-navy-700 px-2 py-0.5 rounded">
                                                    {formatDate(evento.fecha)}
                                                  </span>
                                                  {idx === 0 && (
                                                    <span className={`px-2 py-0.5 text-xs font-bold rounded ${
                                                      esEntregado ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' :
                                                      esNovedad ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' :
                                                      'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400'
                                                    }`}>
                                                      {esEntregado ? '✓ ENTREGADO' : esNovedad ? '⚠ NOVEDAD' : '● ACTUAL'}
                                                    </span>
                                                  )}
                                                </div>
                                                <p className={`text-sm mt-1 ${idx === 0 ? 'font-medium text-slate-800 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                                                  {evento.descripcion}
                                                </p>
                                                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                                  <MapPin className="w-3 h-3" />
                                                  {evento.ubicacion}
                                                </p>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
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
                  Subir archivo (Excel, TXT, CSV)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.csv,.xlsx,.xls"
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

      {/* ====================================== */}
      {/* MODAL DE ALERTA - Lista de guías afectadas */}
      {/* ====================================== */}
      {showAlertaModal && selectedAlerta && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAlertaModal(false)}>
          <div className="bg-white dark:bg-navy-900 rounded-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {(() => {
              const alerta = alertas.find(a => a.id === selectedAlerta);
              const guiasDeAlerta = getGuiasDeAlerta(selectedAlerta);
              if (!alerta) return null;

              const AlertIcon = alerta.icono;
              const colorBg: Record<string, string> = {
                critico: 'bg-red-500',
                urgente: 'bg-orange-500',
                atencion: 'bg-amber-500',
                advertencia: 'bg-blue-500',
              };

              return (
                <>
                  {/* Header del modal */}
                  <div className={`${colorBg[alerta.tipo]} p-4 text-white`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <AlertIcon className="w-6 h-6" />
                        <div>
                          <span className="text-xs font-bold uppercase opacity-80">{alerta.tipo}</span>
                          <h3 className="text-lg font-bold">{alerta.titulo}</h3>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowAlertaModal(false)}
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <p className="mt-2 text-sm opacity-90">{alerta.descripcion}</p>
                    <div className="flex items-center gap-4 mt-3">
                      <span className="flex items-center gap-1 text-xs bg-white/20 px-2 py-1 rounded">
                        <Package className="w-3 h-3" />
                        {guiasDeAlerta.length} guías afectadas
                      </span>
                      <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded">
                        Acción: {alerta.accion}
                      </span>
                    </div>
                  </div>

                  {/* Lista de guías */}
                  <div className="p-4 max-h-[60vh] overflow-y-auto">
                    <h4 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                      <Package className="w-5 h-5 text-cyan-500" />
                      Lista de Guías Afectadas
                    </h4>

                    {guiasDeAlerta.length === 0 ? (
                      <div className="text-center py-8 text-slate-400">
                        <Package className="w-12 h-12 mx-auto mb-2 opacity-30" />
                        <p>No hay guías para mostrar</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {guiasDeAlerta.map((guia) => {
                          const statusColors = getStatusColor(guia.estadoActual);
                          const ultimoMovimiento = guia.ultimos2Estados[0];

                          return (
                            <div key={guia.numeroGuia} className="p-4 bg-slate-50 dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-navy-700">
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {/* Columna 1: Fecha y Teléfono */}
                                <div>
                                  <div className="text-xs text-slate-500 dark:text-slate-400 uppercase font-medium mb-1">Fecha / Teléfono</div>
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <Calendar className="w-4 h-4 text-blue-500" />
                                      <span className="font-mono text-sm">{ultimoMovimiento?.fecha?.split(' ')[0] || 'N/A'}</span>
                                    </div>
                                    {guia.telefono ? (
                                      <div className="flex items-center gap-2">
                                        <Phone className="w-4 h-4 text-green-500" />
                                        <span className="font-mono text-sm text-green-600 dark:text-green-400">{guia.telefono}</span>
                                        <button
                                          onClick={() => openWhatsApp(guia.telefono!, guia.numeroGuia)}
                                          className="p-1 rounded bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 transition-colors"
                                          title="WhatsApp"
                                        >
                                          <MessageSquare className="w-3 h-3" />
                                        </button>
                                      </div>
                                    ) : (
                                      <span className="text-xs text-slate-400">Sin teléfono</span>
                                    )}
                                  </div>
                                </div>

                                {/* Columna 2: Número de Guía y Estatus */}
                                <div>
                                  <div className="text-xs text-slate-500 dark:text-slate-400 uppercase font-medium mb-1">Guía / Estatus</div>
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono font-bold text-slate-800 dark:text-white">{guia.numeroGuia}</span>
                                      <button
                                        onClick={() => copyToClipboard(guia.numeroGuia, 'guide', guia.numeroGuia)}
                                        className="p-1 rounded hover:bg-slate-200 dark:hover:bg-navy-700 text-slate-400"
                                        title="Copiar"
                                      >
                                        <Copy className="w-3 h-3" />
                                      </button>
                                    </div>
                                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium ${statusColors.bg} ${statusColors.text}`}>
                                      <span className={`w-1.5 h-1.5 rounded-full ${statusColors.dot}`}></span>
                                      {guia.estadoActual}
                                    </span>
                                  </div>
                                </div>

                                {/* Columna 3: Ciudad Destino y Transportadora */}
                                <div>
                                  <div className="text-xs text-slate-500 dark:text-slate-400 uppercase font-medium mb-1">Destino / Transportadora</div>
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <MapPin className="w-4 h-4 text-purple-500" />
                                      <span className="text-sm font-medium">{guia.ciudadDestino}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Truck className="w-4 h-4 text-slate-400" />
                                      <span className="text-sm">{guia.transportadora}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Columna 4: Último Movimiento y Hora */}
                                <div>
                                  <div className="text-xs text-slate-500 dark:text-slate-400 uppercase font-medium mb-1">Último Movimiento</div>
                                  {ultimoMovimiento ? (
                                    <div className="space-y-1">
                                      <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2">{ultimoMovimiento.descripcion}</p>
                                      <div className="flex items-center gap-2 text-xs text-slate-400">
                                        <Clock className="w-3 h-3" />
                                        <span>{ultimoMovimiento.fecha?.split(' ')[1] || 'N/A'}</span>
                                        <span>• {guia.diasTranscurridos} días</span>
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-xs text-slate-400">Sin información</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* ====================================== */}
      {/* MODAL DE RECOMENDACIÓN IA - Análisis detallado */}
      {/* ====================================== */}
      {showRecomendacionModal && selectedRecomendacion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowRecomendacionModal(false)}>
          <div className="bg-white dark:bg-navy-900 rounded-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {(() => {
              const rec = getRecomendacionSeleccionada();
              if (!rec) return null;

              const impactoColors: Record<string, { bg: string; text: string }> = {
                alto: { bg: 'bg-gradient-to-r from-red-500 to-rose-600', text: 'text-red-600 dark:text-red-400' },
                medio: { bg: 'bg-gradient-to-r from-amber-500 to-orange-600', text: 'text-amber-600 dark:text-amber-400' },
                bajo: { bg: 'bg-gradient-to-r from-blue-500 to-cyan-600', text: 'text-blue-600 dark:text-blue-400' },
              };
              const colors = impactoColors[rec.impacto];

              return (
                <>
                  {/* Header del modal */}
                  <div className={`${colors.bg} p-4 text-white`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                          <Brain className="w-6 h-6" />
                        </div>
                        <div>
                          <span className="text-xs font-bold uppercase opacity-80">Recomendación IA - Impacto {rec.impacto}</span>
                          <h3 className="text-lg font-bold">{rec.texto}</h3>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowRecomendacionModal(false)}
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    {rec.accionRecomendada && (
                      <div className="mt-3 p-3 bg-white/10 rounded-lg">
                        <div className="flex items-center gap-2 text-xs font-bold mb-1">
                          <Zap className="w-4 h-4" />
                          Acción Recomendada
                        </div>
                        <p className="text-sm">{rec.accionRecomendada}</p>
                      </div>
                    )}
                  </div>

                  {/* Contenido del modal */}
                  <div className="p-4 max-h-[60vh] overflow-y-auto space-y-4">
                    {/* Análisis de IA */}
                    {rec.analisisIA && (
                      <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="p-2 bg-purple-500 rounded-lg">
                            <Brain className="w-4 h-4 text-white" />
                          </div>
                          <h4 className="font-bold text-purple-700 dark:text-purple-400">Análisis de Inteligencia Artificial</h4>
                        </div>
                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{rec.analisisIA}</p>
                      </div>
                    )}

                    {/* Lista de guías relacionadas */}
                    {rec.guiasDetalle && rec.guiasDetalle.length > 0 && (
                      <>
                        <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                          <Package className="w-5 h-5 text-cyan-500" />
                          Guías Relacionadas ({rec.guiasDetalle.length})
                        </h4>

                        <div className="space-y-3">
                          {rec.guiasDetalle.map((guia) => {
                            const statusColors = getStatusColor(guia.estadoActual);
                            const ultimoMovimiento = guia.ultimos2Estados[0];

                            return (
                              <div key={guia.numeroGuia} className="p-4 bg-slate-50 dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-navy-700">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                  {/* Columna 1: Fecha y Teléfono */}
                                  <div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400 uppercase font-medium mb-1">Fecha / Teléfono</div>
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-blue-500" />
                                        <span className="font-mono text-sm">{ultimoMovimiento?.fecha?.split(' ')[0] || 'N/A'}</span>
                                      </div>
                                      {guia.telefono ? (
                                        <div className="flex items-center gap-2">
                                          <Phone className="w-4 h-4 text-green-500" />
                                          <span className="font-mono text-sm text-green-600 dark:text-green-400">{guia.telefono}</span>
                                          <button
                                            onClick={() => openWhatsApp(guia.telefono!, guia.numeroGuia)}
                                            className="p-1 rounded bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 transition-colors"
                                            title="WhatsApp"
                                          >
                                            <MessageSquare className="w-3 h-3" />
                                          </button>
                                        </div>
                                      ) : (
                                        <span className="text-xs text-slate-400">Sin teléfono</span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Columna 2: Número de Guía y Estatus */}
                                  <div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400 uppercase font-medium mb-1">Guía / Estatus</div>
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <span className="font-mono font-bold text-slate-800 dark:text-white">{guia.numeroGuia}</span>
                                        <button
                                          onClick={() => copyToClipboard(guia.numeroGuia, 'guide', guia.numeroGuia)}
                                          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-navy-700 text-slate-400"
                                          title="Copiar"
                                        >
                                          <Copy className="w-3 h-3" />
                                        </button>
                                      </div>
                                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium ${statusColors.bg} ${statusColors.text}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${statusColors.dot}`}></span>
                                        {guia.estadoActual}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Columna 3: Ciudad Destino y Transportadora */}
                                  <div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400 uppercase font-medium mb-1">Destino / Transportadora</div>
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-purple-500" />
                                        <span className="text-sm font-medium">{guia.ciudadDestino}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Truck className="w-4 h-4 text-slate-400" />
                                        <span className="text-sm">{guia.transportadora}</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Columna 4: Último Movimiento y Hora */}
                                  <div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400 uppercase font-medium mb-1">Último Movimiento</div>
                                    {ultimoMovimiento ? (
                                      <div className="space-y-1">
                                        <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2">{ultimoMovimiento.descripcion}</p>
                                        <div className="flex items-center gap-2 text-xs text-slate-400">
                                          <Clock className="w-3 h-3" />
                                          <span>{ultimoMovimiento.fecha?.split(' ')[1] || 'N/A'}</span>
                                          <span>• {guia.diasTranscurridos} días</span>
                                        </div>
                                      </div>
                                    ) : (
                                      <span className="text-xs text-slate-400">Sin información</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* ====================================== */}
      {/* MODAL DE SESIONES GUARDADAS */}
      {/* ====================================== */}
      {showSesionesModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowSesionesModal(false)}>
          <div className="bg-white dark:bg-navy-900 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <FolderOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Sesiones Guardadas</h3>
                    <p className="text-sm opacity-90">{sesionesGuardadas.length} sesiones disponibles</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSesionesModal(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Contenido */}
            <div className="p-4 max-h-[60vh] overflow-y-auto">
              {sesionesGuardadas.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <FolderOpen className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="font-medium text-lg">No hay sesiones guardadas</p>
                  <p className="text-sm mt-2">Carga datos y presiona "Guardar Sesión" para crear una</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(sesionesAgrupadas).map(([fecha, sesiones]) => (
                    <div key={fecha} className="space-y-2">
                      {/* Fecha como encabezado */}
                      <div className="flex items-center gap-2 py-2 border-b border-slate-200 dark:border-navy-700">
                        <Calendar className="w-4 h-4 text-amber-500" />
                        <span className="font-bold text-slate-700 dark:text-slate-300">{fecha}</span>
                        <span className="text-xs text-slate-400 bg-slate-100 dark:bg-navy-800 px-2 py-0.5 rounded-full">
                          {sesiones.length} {sesiones.length === 1 ? 'sesión' : 'sesiones'}
                        </span>
                      </div>

                      {/* Sesiones de esa fecha */}
                      <div className="space-y-2 pl-6">
                        {sesiones.map((sesion) => (
                          <div
                            key={sesion.id}
                            className="flex items-center justify-between p-3 bg-slate-50 dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-navy-700 hover:border-amber-300 dark:hover:border-amber-700 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                              </div>
                              <div>
                                <p className="font-medium text-slate-800 dark:text-white">{sesion.hora}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                  <Package className="w-3 h-3" />
                                  {sesion.totalGuias} guías
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => cargarSesion(sesion)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-sm font-medium transition-colors"
                              >
                                <FolderOpen className="w-3.5 h-3.5" />
                                Cargar
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm('¿Eliminar esta sesión?')) {
                                    eliminarSesion(sesion.id);
                                  }
                                }}
                                className="p-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                title="Eliminar sesión"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {sesionesGuardadas.length > 0 && (
              <div className="p-4 border-t border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800">
                <button
                  onClick={() => {
                    if (confirm('¿Eliminar TODAS las sesiones guardadas?')) {
                      setSesionesGuardadas([]);
                      localStorage.removeItem('inteligencia_logistica_sesiones');
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-sm font-medium transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Eliminar todas las sesiones
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====================================== */}
      {/* MODAL DE COMPARACIÓN DE SESIONES */}
      {/* ====================================== */}
      {showComparisonPanel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowComparisonPanel(false)}>
          <div className="bg-white dark:bg-navy-900 rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <GitCompare className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Comparación de Sesiones</h3>
                    <p className="text-sm opacity-90">Detecta guías estancadas, resueltas y nuevas</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowComparisonPanel(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 max-h-[75vh] overflow-y-auto">
              <SessionComparisonUI
                sesiones={sesionesGuardadas}
                guiasActuales={guiasLogisticas}
                onSendToRescue={(guias) => {
                  setShowComparisonPanel(false);
                  setShowRescuePanel(true);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ====================================== */}
      {/* MODAL DE COLA DE RESCATE */}
      {/* ====================================== */}
      {showRescuePanel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowRescuePanel(false)}>
          <div className="bg-white dark:bg-navy-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500 to-orange-600 text-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Cola de Rescate</h3>
                    <p className="text-sm opacity-90">{guiasLogisticas.filter(g => g.tieneNovedad).length} guías con novedad para rescatar</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowRescuePanel(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 max-h-[75vh] overflow-y-auto">
              <RescueQueueUI
                guias={guiasLogisticas.filter(g => g.tieneNovedad).map(g => ({
                  numeroGuia: g.numeroGuia,
                  telefono: g.telefono,
                  ciudadDestino: g.ciudadDestino,
                  tipoNovedad: g.estadoActual,
                  descripcionNovedad: g.ultimos2Estados[0]?.descripcion || g.estadoActual,
                  diasSinMovimiento: g.diasTranscurridos,
                  transportadora: g.transportadora,
                  estadoActual: g.estadoActual,
                }))}
              />
            </div>
          </div>
        </div>
      )}

      {/* ====================================== */}
      {/* MODAL DE DASHBOARD DE MAÑANA */}
      {/* ====================================== */}
      {showDashboardManana && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDashboardManana(false)}>
          <div className="bg-slate-100 dark:bg-navy-950 rounded-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <Sunrise className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Dashboard de Mañana</h3>
                    <p className="text-sm opacity-90">Planifica tu día con predicciones inteligentes</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDashboardManana(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[calc(95vh-80px)] overflow-y-auto">
              <DashboardManana
                guias={guiasLogisticas}
                sesionesGuardadas={sesionesGuardadas}
                onOpenRescue={() => {
                  setShowDashboardManana(false);
                  setShowRescuePanel(true);
                }}
                onOpenComparison={() => {
                  setShowDashboardManana(false);
                  setShowComparisonPanel(true);
                }}
                onFilterGuias={(filter) => {
                  setShowDashboardManana(false);
                  // Apply filter logic here if needed
                  if (filter.diasMin) {
                    setFiltroDias(filter.diasMin.toString());
                  }
                  if (filter.tieneNovedad) {
                    setFiltroNovedad('SI');
                  }
                }}
                onWhatsAppMasivo={(guias) => {
                  // Generate CSV or show WhatsApp links
                  const contactables = guias.filter(g => g.telefono);
                  if (contactables.length > 0) {
                    alert(`Se generarán ${contactables.length} mensajes de WhatsApp`);
                    // Could open first one as demo
                    const first = contactables[0];
                    if (first.telefono) {
                      const phone = first.telefono.replace(/\D/g, '');
                      window.open(`https://wa.me/57${phone}?text=Hola! Sobre su pedido ${first.numeroGuia}...`, '_blank');
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InteligenciaLogisticaTab;
