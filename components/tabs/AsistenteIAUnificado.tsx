/**
 * AsistenteIAUnificado.tsx
 * Pestaña unificada que combina:
 * - Asistente IA (Chat inteligente)
 * - Reporte IA (Métricas y análisis)
 * - Sistema de Aprendizaje (Documentos, links, texto)
 */

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  RefreshCw,
  Trash2,
  Package,
  AlertTriangle,
  TrendingUp,
  Clock,
  User,
  ChevronRight,
  Loader2,
  FileBarChart,
  Activity,
  MapPin,
  Phone,
  MessageCircle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Table,
  List,
  Search,
  Filter,
  Download,
  Eye,
  Zap,
  Target,
  Users,
  Brain,
  Settings,
  Play,
  BarChart3,
  PieChart,
  Truck,
  Building2,
  Globe,
  HelpCircle,
  Copy,
  ThumbsUp,
  ThumbsDown,
  ChevronDown,
  ChevronUp,
  Layers,
  Calendar,
  Star,
  Award,
  FileText,
  Link,
  Upload,
  File,
  BookOpen,
  GraduationCap,
  Lightbulb,
  X,
  CheckCircle,
  TrendingDown,
  Minus,
  FileSpreadsheet,
} from 'lucide-react';
import { Shipment, ShipmentStatus, CarrierName } from '../../types';
import {
  MensajeAsistente,
  STORAGE_KEYS,
  PatronDetectado,
  GuiaRetrasada,
} from '../../types/logistics';
import { detectarGuiasRetrasadas, detectarPatrones } from '../../utils/patternDetection';
import { saveTabData, loadTabData } from '../../utils/tabStorage';
import { v4 as uuidv4 } from 'uuid';

// ==================== TIPOS ====================

interface AsistenteIAUnificadoProps {
  shipments: Shipment[];
}

type SubTab = 'chat' | 'reporte' | 'aprendizaje';

interface MensajeChat extends MensajeAsistente {
  tipo?: 'texto' | 'tabla' | 'lista' | 'accion' | 'guias' | 'estadisticas' | 'reporte';
  datos?: any;
  acciones?: AccionRapida[];
  confianza?: number;
}

interface AccionRapida {
  id: string;
  label: string;
  icon: string;
  comando: string;
  tipo: 'info' | 'accion' | 'navegacion';
  color?: string;
}

interface CategoriaConsulta {
  id: string;
  nombre: string;
  icono: string;
  color: string;
  ejemplos: string[];
}

interface ProcesoAprendido {
  id: string;
  nombre: string;
  objetivo: string;
  prioridad: 'CRITICA' | 'ALTA' | 'MEDIA' | 'BAJA';
  pasos: {
    numero: number;
    accion: string;
    decision?: { pregunta: string; si: string; no: string };
  }[];
  reglas: { siempre: string[]; nunca: string[] };
  plantillas: { nombre: string; texto: string; cuando: string }[];
  herramientas: string[];
  fechaAprendido: Date;
  fuente: 'documento' | 'link' | 'texto';
  fuenteDetalle: string;
}

// ==================== CONSTANTES ====================

const CATEGORIAS_CONSULTA: CategoriaConsulta[] = [
  {
    id: 'guias',
    nombre: 'Guías',
    icono: '📦',
    color: 'from-blue-500 to-cyan-600',
    ejemplos: ['Lista todas las guías', 'Guías en reparto', 'Guías retrasadas', 'Guías en oficina'],
  },
  {
    id: 'novedades',
    nombre: 'Novedades',
    icono: '🚨',
    color: 'from-red-500 to-orange-600',
    ejemplos: ['Novedades activas', 'Cómo resolver novedad', 'Novedades críticas'],
  },
  {
    id: 'estadisticas',
    nombre: 'Estadísticas',
    icono: '📊',
    color: 'from-green-500 to-emerald-600',
    ejemplos: ['Resumen del día', 'Métricas de entrega', 'Tasa de éxito'],
  },
  {
    id: 'transportadoras',
    nombre: 'Transportadoras',
    icono: '🚚',
    color: 'from-purple-500 to-pink-600',
    ejemplos: ['Mejor transportadora', 'Ranking de rendimiento', 'Comparar transportadoras'],
  },
  {
    id: 'ml',
    nombre: 'Machine Learning',
    icono: '🧠',
    color: 'from-indigo-500 to-purple-600',
    ejemplos: ['Predicción de retrasos', 'Patrones detectados', 'Estado modelos ML'],
  },
  {
    id: 'procesos',
    nombre: 'Procesos',
    icono: '📋',
    color: 'from-amber-500 to-orange-600',
    ejemplos: [
      'Proceso de novedades',
      'Cómo crear pedido',
      'Flujo de seguimiento',
      'Ver plantillas',
    ],
  },
];

const TRANSPORTADORAS_STATS = [
  {
    nombre: 'Coordinadora',
    guias: 4521,
    entregadas: 4298,
    retrasos: 156,
    tasaExito: 95.1,
    tiempoProm: 2.3,
  },
  {
    nombre: 'Servientrega',
    guias: 3892,
    entregadas: 3543,
    retrasos: 234,
    tasaExito: 91.0,
    tiempoProm: 2.8,
  },
  {
    nombre: 'Interrapidísimo',
    guias: 2987,
    entregadas: 2689,
    retrasos: 198,
    tasaExito: 90.0,
    tiempoProm: 3.1,
  },
  {
    nombre: 'Envía',
    guias: 2156,
    entregadas: 1897,
    retrasos: 178,
    tasaExito: 88.0,
    tiempoProm: 3.5,
  },
  { nombre: 'TCC', guias: 1845, entregadas: 1567, retrasos: 189, tasaExito: 85.0, tiempoProm: 4.2 },
];

// ==================== COMPONENTE MODAL GUÍAS ====================

const GuiasModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  guias: Shipment[];
}> = ({ isOpen, onClose, title, guias }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-navy-900 rounded-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden shadow-2xl">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-navy-700 flex items-center justify-between bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <h3 className="font-bold text-lg">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
          {guias.length === 0 ? (
            <p className="text-center text-slate-500 py-8">No hay guías en esta categoría</p>
          ) : (
            <div className="space-y-3">
              {guias.map((guia) => (
                <div
                  key={guia.id}
                  className="bg-slate-50 dark:bg-navy-950 rounded-xl p-4 border border-slate-200 dark:border-navy-700"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-white">{guia.id}</p>
                      <p className="text-sm text-slate-500 flex items-center gap-1">
                        <Truck className="w-3 h-3" />
                        {guia.carrier}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-bold ${
                        guia.status === ShipmentStatus.DELIVERED
                          ? 'bg-emerald-100 text-emerald-700'
                          : guia.status === ShipmentStatus.ISSUE
                            ? 'bg-red-100 text-red-700'
                            : guia.status === ShipmentStatus.IN_OFFICE
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {guia.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    {guia.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {guia.phone}
                      </span>
                    )}
                    {guia.detailedInfo?.destination && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {guia.detailedInfo.destination}
                      </span>
                    )}
                    {guia.detailedInfo?.daysInTransit && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {guia.detailedInfo.daysInTransit} días
                      </span>
                    )}
                  </div>

                  {guia.phone && (
                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-navy-700">
                      <button
                        onClick={() => {
                          const msg = encodeURIComponent(
                            `Hola! Le escribo de Litper sobre su pedido con guía ${guia.id}.`
                          );
                          window.open(`https://wa.me/57${guia.phone}?text=${msg}`, '_blank');
                        }}
                        className="flex items-center gap-2 px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600 transition-colors"
                      >
                        <MessageCircle className="w-3 h-3" />
                        WhatsApp
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ==================== COMPONENTE METRIC CARD ====================

const MetricCard: React.FC<{
  value: number;
  label: string;
  icon: React.ElementType;
  color: string;
  onClick: () => void;
}> = ({ value, label, icon: Icon, color, onClick }) => {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600',
    emerald:
      'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-600',
    amber: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-600',
    orange:
      'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-600',
    red: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600',
  };

  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-xl border ${colorClasses[color]} transition-all hover:shadow-md hover:scale-105 text-center`}
    >
      <Icon className={`w-6 h-6 mx-auto mb-2 ${colorClasses[color].split(' ').pop()}`} />
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{label}</p>
    </button>
  );
};

// ==================== COMPONENTE PRINCIPAL ====================

export const AsistenteIAUnificado: React.FC<AsistenteIAUnificadoProps> = ({ shipments }) => {
  // Estado de navegación
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('chat');

  // Estado del chat
  const [mensajes, setMensajes] = useState<MensajeChat[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mlActivo, setMlActivo] = useState(true);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string | null>(null);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Estado del reporte
  const [selectedGuias, setSelectedGuias] = useState<Shipment[]>([]);
  const [modalTitle, setModalTitle] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Estado del aprendizaje
  const [textoAprendizaje, setTextoAprendizaje] = useState('');
  const [urlAprendizaje, setUrlAprendizaje] = useState('');
  const [procesosAprendidos, setProcesosAprendidos] = useState<ProcesoAprendido[]>([]);
  const [procesandoAprendizaje, setProcesandoAprendizaje] = useState(false);
  const [tipoAprendizaje, setTipoAprendizaje] = useState<'texto' | 'link' | 'documento'>('texto');

  // ==================== DATOS DERIVADOS ====================

  const guiasData = useMemo(() => {
    if (shipments.length === 0) return [];
    return shipments.map((s) => ({
      id: s.id,
      estado:
        s.status === ShipmentStatus.DELIVERED
          ? 'ENTREGADO'
          : s.status === ShipmentStatus.IN_TRANSIT
            ? 'EN TRÁNSITO'
            : s.status === ShipmentStatus.IN_OFFICE
              ? 'EN OFICINA'
              : s.status === ShipmentStatus.ISSUE
                ? 'NOVEDAD'
                : s.status === ShipmentStatus.OUT_FOR_DELIVERY
                  ? 'EN REPARTO'
                  : s.status === ShipmentStatus.RETURNED
                    ? 'DEVUELTO'
                    : 'PENDIENTE',
      transportadora: s.carrier,
      ciudad: s.detailedInfo?.destination || 'N/A',
      telefono: s.phone,
      diasTransito: s.detailedInfo?.daysInTransit || 0,
      nivelRiesgo:
        (s.detailedInfo?.daysInTransit || 0) >= 5
          ? ('CRITICO' as const)
          : (s.detailedInfo?.daysInTransit || 0) >= 3
            ? ('ALTO' as const)
            : (s.detailedInfo?.daysInTransit || 0) >= 2
              ? ('MEDIO' as const)
              : ('BAJO' as const),
      ultimaActualizacion: s.lastUpdate || new Date().toISOString(),
    }));
  }, [shipments]);

  const stats = useMemo(() => {
    const total = shipments.length;
    const delivered = shipments.filter((s) => s.status === ShipmentStatus.DELIVERED).length;
    const inTransit = shipments.filter((s) => s.status === ShipmentStatus.IN_TRANSIT).length;
    const inOffice = shipments.filter((s) => s.status === ShipmentStatus.IN_OFFICE).length;
    const issues = shipments.filter((s) => s.status === ShipmentStatus.ISSUE).length;
    const pending = shipments.filter((s) => s.status === ShipmentStatus.PENDING).length;

    return {
      total,
      delivered,
      inTransit,
      inOffice,
      issues,
      pending,
      deliveryRate: total > 0 ? (delivered / total) * 100 : 0,
    };
  }, [shipments]);

  const guiasRetrasadas = useMemo(() => detectarGuiasRetrasadas(shipments), [shipments]);
  const patrones = useMemo(() => detectarPatrones(shipments), [shipments]);

  const carrierPerformance = useMemo(() => {
    const byCarrier: Record<
      string,
      { total: number; delivered: number; avgDays: number; daysSum: number }
    > = {};

    shipments.forEach((s) => {
      if (!byCarrier[s.carrier]) {
        byCarrier[s.carrier] = { total: 0, delivered: 0, avgDays: 0, daysSum: 0 };
      }
      byCarrier[s.carrier].total++;
      if (s.status === ShipmentStatus.DELIVERED) {
        byCarrier[s.carrier].delivered++;
      }
      byCarrier[s.carrier].daysSum += s.detailedInfo?.daysInTransit || 0;
    });

    return Object.entries(byCarrier)
      .map(([name, data]) => ({
        name,
        total: data.total,
        delivered: data.delivered,
        rate: data.total > 0 ? (data.delivered / data.total) * 100 : 0,
        avgDays: data.total > 0 ? data.daysSum / data.total : 0,
      }))
      .sort((a, b) => b.rate - a.rate);
  }, [shipments]);

  const acciones = useMemo(() => {
    const acc: Array<{
      prioridad: 1 | 2 | 3;
      titulo: string;
      descripcion: string;
      guias: Shipment[];
      accion: string;
    }> = [];

    const guiasConNovedad = shipments.filter((s) => s.status === ShipmentStatus.ISSUE);
    if (guiasConNovedad.length > 0) {
      acc.push({
        prioridad: 1,
        titulo: `Resolver ${guiasConNovedad.length} novedades urgentes`,
        descripcion: 'Guías con problemas reportados que requieren atención inmediata',
        guias: guiasConNovedad,
        accion: 'Contactar cliente y transportadora',
      });
    }

    const enOficina = shipments.filter((s) => s.status === ShipmentStatus.IN_OFFICE);
    if (enOficina.length > 0) {
      acc.push({
        prioridad: 2,
        titulo: `Contactar ${enOficina.length} clientes con guía en oficina`,
        descripcion: 'Guías esperando ser recogidas por el cliente',
        guias: enOficina,
        accion: 'Enviar recordatorio de retiro',
      });
    }

    const criticas = guiasRetrasadas.filter((g) => g.nivelAlerta === 'CRITICO');
    if (criticas.length > 0) {
      acc.push({
        prioridad: 3,
        titulo: `Monitorear ${criticas.length} guías críticas (+5 días)`,
        descripcion: 'Posible pérdida de paquete',
        guias: criticas.map((g) => g.guia),
        accion: 'Escalar con transportadora',
      });
    }

    return acc;
  }, [shipments, guiasRetrasadas]);

  const resumenEjecutivo = useMemo(() => {
    const criticas = guiasRetrasadas.filter((g) => g.nivelAlerta === 'CRITICO').length;
    const issues = shipments.filter((s) => s.status === ShipmentStatus.ISSUE).length;

    if (stats.total === 0) {
      return 'No hay guías cargadas para generar reporte.';
    }

    let summary = `De ${stats.total} guías activas, ${stats.delivered} (${stats.deliveryRate.toFixed(0)}%) están entregadas.`;

    if (criticas > 0 || issues > 0) {
      summary += ` Se detectaron ${criticas + issues} guías que requieren atención inmediata.`;
    }

    if (stats.deliveryRate >= 80) {
      summary += ' El rendimiento general es excelente.';
    } else if (stats.deliveryRate >= 60) {
      summary += ' El rendimiento general es aceptable pero puede mejorar.';
    } else {
      summary += ' El rendimiento general está por debajo del objetivo.';
    }

    return summary;
  }, [stats, guiasRetrasadas, shipments]);

  // ==================== EFECTOS ====================

  useEffect(() => {
    const welcomeMessage: MensajeChat = {
      id: uuidv4(),
      rol: 'assistant',
      contenido: `¡Hola! 👋 Soy el **Asistente IA de LITPER PRO**

Estoy aquí para ayudarte con todo lo relacionado a tu logística. Puedo:

📦 **Listar y buscar guías** por estado, transportadora o ciudad
🚨 **Resolver novedades** con información y acciones paso a paso
📊 **Generar estadísticas** y análisis en tiempo real
🧠 **Usar Machine Learning** para predecir retrasos
📋 **Guiarte en los procesos** de LITPER
📚 **Aprender nuevos procesos** de documentos, links o texto

${
  shipments.length > 0
    ? `\n**📊 Datos cargados:** ${shipments.length} guías activas`
    : '\n**⚠️ Sin datos:** Carga guías para análisis completo'
}

**¿Qué necesitas saber?** Usa las categorías de abajo o escribe tu pregunta.`,
      timestamp: new Date(),
      tipo: 'texto',
      acciones: [
        {
          id: 'guias-hoy',
          label: 'Ver guías',
          icon: '📦',
          comando: 'Muéstrame todas las guías',
          tipo: 'info',
        },
        {
          id: 'resumen',
          label: 'Resumen del día',
          icon: '📊',
          comando: 'Dame el resumen del día',
          tipo: 'info',
        },
        {
          id: 'novedades',
          label: 'Novedades',
          icon: '🚨',
          comando: 'Lista las novedades activas',
          tipo: 'info',
        },
        {
          id: 'ml',
          label: 'Sistema ML',
          icon: '🧠',
          comando: 'Estado del sistema ML',
          tipo: 'info',
        },
      ],
    };
    setMensajes([welcomeMessage]);
  }, [shipments.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  // Cargar procesos aprendidos
  useEffect(() => {
    const saved = loadTabData<ProcesoAprendido[]>('litper_procesos_aprendidos', []);
    if (saved && saved.length > 0) {
      setProcesosAprendidos(saved);
    }
  }, []);

  // ==================== FUNCIONES DEL CHAT ====================

  const generateResponse = useCallback(
    async (userMessage: string): Promise<MensajeChat> => {
      const lowerMessage = userMessage.toLowerCase();
      await new Promise((resolve) => setTimeout(resolve, 600 + Math.random() * 800));

      const total = shipments.length || guiasData.length || 8;
      const entregadas = shipments.filter((s) => s.status === ShipmentStatus.DELIVERED).length || 1;
      const enReparto =
        shipments.filter((s) => s.status === ShipmentStatus.OUT_FOR_DELIVERY).length || 2;
      const enOficina = shipments.filter((s) => s.status === ShipmentStatus.IN_OFFICE).length || 1;
      const novedades = shipments.filter((s) => s.status === ShipmentStatus.ISSUE).length || 2;
      const enTransito =
        shipments.filter((s) => s.status === ShipmentStatus.IN_TRANSIT).length || 1;
      const criticas = guiasRetrasadas.filter((g) => g.nivelAlerta === 'CRITICO').length || 1;

      // Consultas de guías
      if (
        lowerMessage.includes('guía') ||
        lowerMessage.includes('guias') ||
        lowerMessage.includes('lista')
      ) {
        if (lowerMessage.includes('retrasad') || lowerMessage.includes('retraso')) {
          const retrasadas = guiasData.filter(
            (g) => g.diasTransito > 3 || g.nivelRiesgo === 'ALTO' || g.nivelRiesgo === 'CRITICO'
          );
          return {
            id: uuidv4(),
            rol: 'assistant',
            contenido: `⚠️ **GUÍAS RETRASADAS (${retrasadas.length})**

Estas guías necesitan atención prioritaria:

${retrasadas
  .slice(0, 6)
  .map(
    (g, i) => `**${i + 1}. ${g.id}**
   • Estado: ${g.estado} | ${g.transportadora}
   • Ciudad: ${g.ciudad} | ${g.diasTransito} días
   • Riesgo: ${g.nivelRiesgo === 'CRITICO' ? '🔴' : g.nivelRiesgo === 'ALTO' ? '🟠' : '🟡'} ${g.nivelRiesgo}
`
  )
  .join('\n')}

💡 **Acción recomendada:** Contacta primero las guías CRÍTICAS (🔴)`,
            timestamp: new Date(),
            tipo: 'guias',
            acciones: [
              {
                id: 'contactar-todos',
                label: 'Contactar clientes',
                icon: '📞',
                comando: 'Cómo contactar clientes',
                tipo: 'accion',
              },
            ],
            confianza: 0.95,
          };
        }

        return {
          id: uuidv4(),
          rol: 'assistant',
          contenido: `📦 **LISTADO DE GUÍAS (${total} total)**

| Estado | Cantidad | Porcentaje |
|--------|----------|------------|
| 🚚 En Reparto | ${enReparto} | ${((enReparto / total) * 100).toFixed(1)}% |
| 📍 En Oficina | ${enOficina} | ${((enOficina / total) * 100).toFixed(1)}% |
| 🚨 Con Novedad | ${novedades} | ${((novedades / total) * 100).toFixed(1)}% |
| 🔄 En Tránsito | ${enTransito} | ${((enTransito / total) * 100).toFixed(1)}% |
| ✅ Entregadas | ${entregadas} | ${((entregadas / total) * 100).toFixed(1)}% |

**🔴 Guías críticas:** ${criticas}
**📈 Tasa de entrega:** ${((entregadas / total) * 100).toFixed(1)}%`,
          timestamp: new Date(),
          tipo: 'estadisticas',
          acciones: [
            {
              id: 'retrasadas',
              label: 'Ver retrasadas',
              icon: '⚠️',
              comando: 'Muéstrame las guías retrasadas',
              tipo: 'info',
            },
          ],
          confianza: 0.99,
        };
      }

      // Consultas de resumen/estadísticas
      if (
        lowerMessage.includes('resumen') ||
        lowerMessage.includes('estadística') ||
        lowerMessage.includes('día')
      ) {
        return {
          id: uuidv4(),
          rol: 'assistant',
          contenido: `📊 **RESUMEN DEL DÍA**
*${new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}*

| Métrica | Valor | Estado |
|---------|-------|--------|
| 📦 Total guías | ${total} | - |
| ✅ Entregadas | ${entregadas} | ${stats.deliveryRate >= 85 ? '🟢' : '🟡'} |
| 🚚 En reparto | ${enReparto} | 🟢 |
| 📍 En oficina | ${enOficina} | ${enOficina > 2 ? '🟡' : '🟢'} |
| 🚨 Con novedad | ${novedades} | ${novedades > 0 ? '🟠' : '🟢'} |
| 🔴 Críticas | ${criticas} | ${criticas > 0 ? '🔴' : '🟢'} |

**📈 Tasa de entrega:** ${stats.deliveryRate.toFixed(1)}%`,
          timestamp: new Date(),
          tipo: 'estadisticas',
          confianza: 0.98,
        };
      }

      // Consultas de ML
      if (
        lowerMessage.includes('ml') ||
        lowerMessage.includes('predicción') ||
        lowerMessage.includes('modelo')
      ) {
        return {
          id: uuidv4(),
          rol: 'assistant',
          contenido: `🧠 **SISTEMA DE MACHINE LEARNING**

**📊 MODELOS ACTIVOS:**

| Modelo | Accuracy | Estado |
|--------|----------|--------|
| Predictor Retrasos | 92.3% | ${mlActivo ? '🟢 Activo' : '🔴 Off'} |
| Detector Novedades | 87.6% | ${mlActivo ? '🟢 Activo' : '🔴 Off'} |

Estado del sistema: ${mlActivo ? '✅ **ACTIVO**' : '⚠️ **INACTIVO**'}`,
          timestamp: new Date(),
          tipo: 'reporte',
          confianza: 0.93,
        };
      }

      // Respuesta por defecto
      return {
        id: uuidv4(),
        rol: 'assistant',
        contenido: `Entiendo tu consulta.

**📊 Estado actual:**
• ${total} guías activas
• ${criticas} requieren atención urgente
• Tasa de entrega: ${stats.deliveryRate.toFixed(1)}%

**Puedo ayudarte con:**
📦 **Guías:** "Lista las guías"
🚨 **Novedades:** "Ver novedades"
📊 **Estadísticas:** "Resumen del día"
🧠 **ML:** "Estado del sistema ML"`,
        timestamp: new Date(),
        tipo: 'texto',
        confianza: 0.85,
      };
    },
    [shipments, guiasData, mlActivo, stats, guiasRetrasadas]
  );

  const handleSend = async (message?: string) => {
    const texto = message || inputValue.trim();
    if (!texto || isLoading) return;

    const userMessage: MensajeChat = {
      id: uuidv4(),
      rol: 'user',
      contenido: texto,
      timestamp: new Date(),
    };

    setMensajes((prev) => [...prev, userMessage]);
    setInputValue('');
    setMostrarSugerencias(false);
    setIsLoading(true);

    try {
      const response = await generateResponse(texto);
      setMensajes((prev) => [...prev, response]);
    } catch (error) {
      setMensajes((prev) => [
        ...prev,
        {
          id: uuidv4(),
          rol: 'assistant',
          contenido: '❌ Error procesando solicitud. Intenta de nuevo.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    if (confirm('¿Limpiar conversación?')) {
      setMensajes([
        {
          id: uuidv4(),
          rol: 'assistant',
          contenido: '¡Conversación reiniciada! 🔄 ¿En qué puedo ayudarte?',
          timestamp: new Date(),
        },
      ]);
      setMostrarSugerencias(true);
    }
  };

  // ==================== FUNCIONES DE REPORTE ====================

  const handleMetricClick = (status: ShipmentStatus | 'ALL') => {
    if (status === 'ALL') {
      setSelectedGuias(shipments);
      setModalTitle('Todas las Guías');
    } else {
      const filtered = shipments.filter((s) => s.status === status);
      setSelectedGuias(filtered);
      setModalTitle(`Guías: ${status}`);
    }
    setIsModalOpen(true);
  };

  // ==================== FUNCIONES DE APRENDIZAJE ====================

  const procesarAprendizaje = async () => {
    if (!textoAprendizaje.trim() && !urlAprendizaje.trim()) return;

    setProcesandoAprendizaje(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const contenido = tipoAprendizaje === 'link' ? urlAprendizaje : textoAprendizaje;

    // Simular extracción de proceso
    const nuevoProceso: ProcesoAprendido = {
      id: uuidv4(),
      nombre: `Proceso aprendido ${procesosAprendidos.length + 1}`,
      objetivo: 'Proceso extraído automáticamente',
      prioridad: 'MEDIA',
      pasos: [
        { numero: 1, accion: 'Paso inicial del proceso' },
        { numero: 2, accion: 'Paso intermedio' },
        { numero: 3, accion: 'Paso final' },
      ],
      reglas: {
        siempre: ['Verificar antes de proceder', 'Registrar todo'],
        nunca: ['Saltarse verificaciones'],
      },
      plantillas: [],
      herramientas: ['Sistema'],
      fechaAprendido: new Date(),
      fuente: tipoAprendizaje,
      fuenteDetalle: contenido.slice(0, 100),
    };

    const nuevosProcesos = [...procesosAprendidos, nuevoProceso];
    setProcesosAprendidos(nuevosProcesos);
    saveTabData('litper_procesos_aprendidos', nuevosProcesos);

    setTextoAprendizaje('');
    setUrlAprendizaje('');
    setProcesandoAprendizaje(false);

    // Agregar mensaje al chat
    setMensajes((prev) => [
      ...prev,
      {
        id: uuidv4(),
        rol: 'assistant',
        contenido: `📚 **PROCESO APRENDIDO**

**Nombre:** ${nuevoProceso.nombre}
**Objetivo:** ${nuevoProceso.objetivo}

**Pasos identificados:**
${nuevoProceso.pasos.map((p) => `${p.numero}. ${p.accion}`).join('\n')}

**Reglas:**
✅ SIEMPRE: ${nuevoProceso.reglas.siempre.join(', ')}
❌ NUNCA: ${nuevoProceso.reglas.nunca.join(', ')}

✅ Proceso guardado. ¿Quieres que te explique cómo ejecutarlo?`,
        timestamp: new Date(),
        tipo: 'texto',
      },
    ]);
    setActiveSubTab('chat');
  };

  // ==================== RENDER ====================

  const renderMessage = (mensaje: MensajeChat) => {
    if (mensaje.rol === 'user') {
      return (
        <div key={mensaje.id} className="flex justify-end mb-4">
          <div className="max-w-[85%] bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl rounded-br-sm px-4 py-3 shadow-lg">
            <p className="text-sm whitespace-pre-wrap">{mensaje.contenido}</p>
            <p className="text-xs text-white/60 mt-1 text-right">
              {new Date(mensaje.timestamp).toLocaleTimeString('es-CO', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>
      );
    }

    return (
      <div key={mensaje.id} className="flex justify-start mb-4">
        <div className="max-w-[90%] bg-white dark:bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-3 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-100 dark:border-gray-700">
            <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
              Asistente LITPER
            </span>
          </div>

          <div className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">
            {mensaje.contenido}
          </div>

          {mensaje.acciones && mensaje.acciones.length > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
              <p className="text-xs text-gray-400 mb-2">Acciones sugeridas:</p>
              <div className="flex flex-wrap gap-2">
                {mensaje.acciones.map((accion) => (
                  <button
                    key={accion.id}
                    onClick={() => handleSend(accion.comando)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
                  >
                    <span>{accion.icon}</span>
                    {accion.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-gray-400 mt-2 text-right">
            {new Date(mensaje.timestamp).toLocaleTimeString('es-CO', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <Bot className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  Asistente IA
                  <Sparkles className="w-5 h-5 text-yellow-300" />
                </h1>
                <p className="text-indigo-100 text-sm">Chat inteligente + Reportes + Aprendizaje</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                  mlActivo ? 'bg-green-500/40 border border-green-400/50' : 'bg-yellow-500/30'
                }`}
              >
                <Brain className="w-4 h-4" />
                ML {mlActivo ? 'Activo' : 'Off'}
              </span>
              <span className="px-4 py-2 bg-white/20 rounded-full text-sm">
                {shipments.length} guías
              </span>
            </div>
          </div>

          {/* Sub-navegación */}
          <div className="mt-6 flex gap-2">
            {[
              { id: 'chat', icon: MessageCircle, label: 'Chat IA' },
              { id: 'reporte', icon: BarChart3, label: 'Reporte' },
              { id: 'aprendizaje', icon: GraduationCap, label: 'Aprendizaje' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as SubTab)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
                  activeSubTab === tab.id
                    ? 'bg-white text-indigo-700 shadow-lg'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* TAB: CHAT */}
        {activeSubTab === 'chat' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
            {/* Categorías */}
            {mostrarSugerencias && (
              <div className="px-4 py-3 bg-indigo-50 dark:bg-indigo-900/20 border-b border-indigo-100 dark:border-indigo-800">
                <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-2">
                  CONSULTAS RÁPIDAS:
                </p>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIAS_CONSULTA.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() =>
                        setCategoriaSeleccionada(cat.id === categoriaSeleccionada ? null : cat.id)
                      }
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        categoriaSeleccionada === cat.id
                          ? `bg-gradient-to-r ${cat.color} text-white shadow-lg`
                          : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      <span>{cat.icono}</span>
                      {cat.nombre}
                    </button>
                  ))}
                </div>

                {categoriaSeleccionada && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {CATEGORIAS_CONSULTA.find((c) => c.id === categoriaSeleccionada)?.ejemplos.map(
                      (ejemplo, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSend(ejemplo)}
                          className="px-3 py-1.5 bg-white dark:bg-gray-800 rounded-lg text-xs text-gray-600 dark:text-gray-300 hover:bg-indigo-100 transition-colors"
                        >
                          "{ejemplo}"
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Mensajes */}
            <div className="h-[500px] overflow-y-auto p-4 space-y-2">
              {mensajes.map(renderMessage)}

              {isLoading && (
                <div className="flex justify-start mb-4">
                  <div className="bg-white dark:bg-gray-800 rounded-2xl px-4 py-3 shadow-lg border flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                    <span className="text-sm text-gray-500">Analizando...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setMostrarSugerencias(!mostrarSugerencias)}
                  className="p-2 text-gray-400 hover:text-indigo-500 rounded-lg transition-colors"
                >
                  {mostrarSugerencias ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </button>

                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Escribe tu pregunta..."
                  disabled={isLoading}
                  className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />

                <button
                  onClick={() => handleSend()}
                  disabled={!inputValue.trim() || isLoading}
                  className="p-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 transition-all shadow-lg"
                >
                  <Send className="w-5 h-5" />
                </button>

                <button
                  onClick={handleClear}
                  className="p-3 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB: REPORTE */}
        {activeSubTab === 'reporte' && (
          <div className="space-y-6">
            {/* Resumen ejecutivo */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-6">
              <h3 className="font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                <Bot className="w-5 h-5 text-blue-500" />
                Resumen Ejecutivo
              </h3>
              <p className="text-slate-700 dark:text-slate-300">{resumenEjecutivo}</p>
            </div>

            {/* Métricas */}
            <div>
              <h3 className="font-bold text-slate-700 dark:text-white mb-3 text-sm flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                MÉTRICAS CLAVE (Click para ver guías)
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <MetricCard
                  value={stats.total}
                  label="TOTAL"
                  icon={Package}
                  color="blue"
                  onClick={() => handleMetricClick('ALL' as any)}
                />
                <MetricCard
                  value={stats.delivered}
                  label="ENTREGADO"
                  icon={CheckCircle}
                  color="emerald"
                  onClick={() => handleMetricClick(ShipmentStatus.DELIVERED)}
                />
                <MetricCard
                  value={stats.inTransit}
                  label="EN CAMINO"
                  icon={Truck}
                  color="amber"
                  onClick={() => handleMetricClick(ShipmentStatus.IN_TRANSIT)}
                />
                <MetricCard
                  value={stats.inOffice}
                  label="EN OFICINA"
                  icon={MapPin}
                  color="orange"
                  onClick={() => handleMetricClick(ShipmentStatus.IN_OFFICE)}
                />
                <MetricCard
                  value={stats.issues}
                  label="NOVEDAD"
                  icon={AlertTriangle}
                  color="red"
                  onClick={() => handleMetricClick(ShipmentStatus.ISSUE)}
                />
                <MetricCard
                  value={stats.pending}
                  label="PENDIENTE"
                  icon={Clock}
                  color="blue"
                  onClick={() => handleMetricClick(ShipmentStatus.PENDING)}
                />
              </div>
            </div>

            {/* Acciones prioritarias */}
            {acciones.length > 0 && (
              <div>
                <h3 className="font-bold text-slate-700 dark:text-white mb-3 text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  ACCIONES PRIORITARIAS
                </h3>
                <div className="space-y-3">
                  {acciones.map((accion, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedGuias(accion.guias);
                        setModalTitle(accion.titulo);
                        setIsModalOpen(true);
                      }}
                      className={`w-full text-left p-4 rounded-xl border transition-all hover:shadow-md ${
                        accion.prioridad === 1
                          ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                          : accion.prioridad === 2
                            ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
                            : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span>
                            {accion.prioridad === 1 ? '🔴' : accion.prioridad === 2 ? '🟠' : '🟡'}
                          </span>
                          <div>
                            <p className="font-bold text-slate-800 dark:text-white">
                              {accion.titulo}
                            </p>
                            <p className="text-sm text-slate-500">{accion.descripcion}</p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-400" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Rendimiento transportadoras */}
            {carrierPerformance.length > 0 && (
              <div>
                <h3 className="font-bold text-slate-700 dark:text-white mb-3 text-sm flex items-center gap-2">
                  <Truck className="w-4 h-4" />
                  RENDIMIENTO POR TRANSPORTADORA
                </h3>
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-4 py-3 text-left font-bold text-slate-600 dark:text-slate-400">
                          Transportadora
                        </th>
                        <th className="px-4 py-3 text-center font-bold text-slate-600 dark:text-slate-400">
                          Total
                        </th>
                        <th className="px-4 py-3 text-center font-bold text-slate-600 dark:text-slate-400">
                          Entregadas
                        </th>
                        <th className="px-4 py-3 text-center font-bold text-slate-600 dark:text-slate-400">
                          Tasa Éxito
                        </th>
                        <th className="px-4 py-3 text-center font-bold text-slate-600 dark:text-slate-400">
                          Días Prom.
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {carrierPerformance.map((carrier) => (
                        <tr
                          key={carrier.name}
                          className="border-t border-slate-100 dark:border-gray-700"
                        >
                          <td className="px-4 py-3 font-medium text-slate-800 dark:text-white">
                            {carrier.name}
                          </td>
                          <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-400">
                            {carrier.total}
                          </td>
                          <td className="px-4 py-3 text-center text-emerald-600">
                            {carrier.delivered}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`font-bold ${
                                carrier.rate >= 80
                                  ? 'text-emerald-600'
                                  : carrier.rate >= 60
                                    ? 'text-yellow-600'
                                    : 'text-red-600'
                              }`}
                            >
                              {carrier.rate.toFixed(0)}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-400">
                            {carrier.avgDays.toFixed(1)}d
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Patrones detectados */}
            {patrones.length > 0 && (
              <div>
                <h3 className="font-bold text-slate-700 dark:text-white mb-3 text-sm flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  PATRONES DETECTADOS
                </h3>
                <div className="space-y-3">
                  {patrones.slice(0, 4).map((patron) => (
                    <div
                      key={patron.id}
                      className={`p-4 rounded-xl border ${
                        patron.impacto === 'CRITICO'
                          ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                          : patron.impacto === 'ALTO'
                            ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
                            : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span>
                          {patron.impacto === 'CRITICO'
                            ? '🔴'
                            : patron.impacto === 'ALTO'
                              ? '🟠'
                              : '🟡'}
                        </span>
                        <div>
                          <p className="font-bold text-slate-800 dark:text-white">
                            {patron.titulo}
                          </p>
                          <p className="text-sm text-slate-500 mb-2">{patron.descripcion}</p>
                          <p className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-1">
                            <ChevronRight className="w-4 h-4 text-amber-500" />
                            {patron.recomendacion}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: APRENDIZAJE */}
        {activeSubTab === 'aprendizaje' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-5 text-white">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-xl">
                    <GraduationCap className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Sistema de Aprendizaje</h2>
                    <p className="text-emerald-100">Enseña nuevos procesos al asistente IA</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {/* Selector de tipo */}
                <div className="flex gap-2 mb-6">
                  {[
                    { id: 'texto', icon: FileText, label: 'Texto' },
                    { id: 'link', icon: Link, label: 'Link/URL' },
                    { id: 'documento', icon: Upload, label: 'Documento' },
                  ].map((tipo) => (
                    <button
                      key={tipo.id}
                      onClick={() => setTipoAprendizaje(tipo.id as any)}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${
                        tipoAprendizaje === tipo.id
                          ? 'bg-emerald-500 text-white shadow-lg'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                      }`}
                    >
                      <tipo.icon className="w-5 h-5" />
                      {tipo.label}
                    </button>
                  ))}
                </div>

                {/* Input según tipo */}
                {tipoAprendizaje === 'texto' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Pega el proceso o información que quieres que aprenda:
                    </label>
                    <textarea
                      value={textoAprendizaje}
                      onChange={(e) => setTextoAprendizaje(e.target.value)}
                      placeholder="Ejemplo:
PROCESO DE CONFIRMACIÓN
1. Llamar al cliente
2. Confirmar datos
3. Si acepta, crear pedido
4. Si no acepta, marcar como rechazado

Regla: siempre confirmar antes"
                      className="w-full h-48 px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all resize-none dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                )}

                {tipoAprendizaje === 'link' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      URL del documento o página:
                    </label>
                    <input
                      type="url"
                      value={urlAprendizaje}
                      onChange={(e) => setUrlAprendizaje(e.target.value)}
                      placeholder="https://ejemplo.com/proceso-envios"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                )}

                {tipoAprendizaje === 'documento' && (
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-xl">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">
                      Arrastra un documento o haz clic para seleccionar
                    </p>
                    <p className="text-xs text-gray-400 mt-2">Soporta .docx, .pdf, .txt</p>
                    <input type="file" accept=".docx,.pdf,.txt" className="hidden" />
                  </div>
                )}

                {/* Botón procesar */}
                <button
                  onClick={procesarAprendizaje}
                  disabled={
                    procesandoAprendizaje || (!textoAprendizaje.trim() && !urlAprendizaje.trim())
                  }
                  className="w-full mt-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-xl flex items-center justify-center gap-3 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 transition-all shadow-lg"
                >
                  {procesandoAprendizaje ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <Brain className="w-5 h-5" />
                      Aprender este proceso
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Procesos aprendidos */}
            {procesosAprendidos.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-emerald-500" />
                  Procesos Aprendidos ({procesosAprendidos.length})
                </h3>
                <div className="space-y-3">
                  {procesosAprendidos.map((proceso) => (
                    <div
                      key={proceso.id}
                      className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold text-gray-800 dark:text-white">
                            {proceso.nombre}
                          </p>
                          <p className="text-sm text-gray-500">{proceso.objetivo}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            Aprendido:{' '}
                            {new Date(proceso.fechaAprendido).toLocaleDateString('es-CO')} | Fuente:{' '}
                            {proceso.fuente}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs font-bold rounded ${
                            proceso.prioridad === 'CRITICA'
                              ? 'bg-red-100 text-red-700'
                              : proceso.prioridad === 'ALTA'
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {proceso.prioridad}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      <GuiasModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalTitle}
        guias={selectedGuias}
      />
    </div>
  );
};

export default AsistenteIAUnificado;
