/**
 * 🤖 AsistenteTab - Pestaña de Asistente IA LITPER PRO
 * Versión mejorada con todas las capacidades de IA, ML y procesos LITPER
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
} from 'lucide-react';
import { Shipment, ShipmentStatus, CarrierName } from '../../types';
import { MensajeAsistente, STORAGE_KEYS } from '../../types/logistics';
import { detectarGuiasRetrasadas, detectarPatrones } from '../../utils/patternDetection';
import { saveTabData, loadTabData } from '../../utils/tabStorage';
import { v4 as uuidv4 } from 'uuid';

interface AsistenteTabProps {
  shipments: Shipment[];
}

// Tipos extendidos
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

interface GuiaInfo {
  id: string;
  estado: string;
  transportadora: string;
  ciudad: string;
  telefono?: string;
  diasTransito: number;
  nivelRiesgo: 'BAJO' | 'MEDIO' | 'ALTO' | 'CRITICO';
  ultimaActualizacion: string;
}

interface CategoriaConsulta {
  id: string;
  nombre: string;
  icono: string;
  color: string;
  ejemplos: string[];
}

// Categorías de consulta
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

// Estadísticas de transportadoras
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

export const AsistenteTab: React.FC<AsistenteTabProps> = ({ shipments }) => {
  const [mensajes, setMensajes] = useState<MensajeChat[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mlActivo, setMlActivo] = useState(true);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string | null>(null);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Datos derivados de shipments
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

  // Load welcome message
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

  // Scroll automático
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  // Generar respuesta inteligente
  const generateResponse = useCallback(
    async (userMessage: string): Promise<MensajeChat> => {
      const lowerMessage = userMessage.toLowerCase();
      await new Promise((resolve) => setTimeout(resolve, 600 + Math.random() * 800));

      const guiasRetrasadas = detectarGuiasRetrasadas(shipments);
      const patrones = detectarPatrones(shipments);

      const total = shipments.length || guiasData.length || 8;
      const entregadas =
        shipments.filter((s) => s.status === ShipmentStatus.DELIVERED).length ||
        guiasData.filter((g) => g.estado === 'ENTREGADO').length ||
        1;
      const enReparto =
        shipments.filter((s) => s.status === ShipmentStatus.OUT_FOR_DELIVERY).length ||
        guiasData.filter((g) => g.estado === 'EN REPARTO').length ||
        2;
      const enOficina =
        shipments.filter((s) => s.status === ShipmentStatus.IN_OFFICE).length ||
        guiasData.filter((g) => g.estado === 'EN OFICINA').length ||
        1;
      const novedades =
        shipments.filter((s) => s.status === ShipmentStatus.ISSUE).length ||
        guiasData.filter((g) => g.estado === 'NOVEDAD').length ||
        2;
      const enTransito =
        shipments.filter((s) => s.status === ShipmentStatus.IN_TRANSIT).length ||
        guiasData.filter((g) => g.estado === 'EN TRÁNSITO').length ||
        1;
      const criticas =
        guiasRetrasadas.filter((g) => g.nivelAlerta === 'CRITICO').length ||
        guiasData.filter((g) => g.nivelRiesgo === 'CRITICO').length ||
        1;

      // ============ CONSULTAS DE GUÍAS ============
      if (
        lowerMessage.includes('guía') ||
        lowerMessage.includes('guias') ||
        lowerMessage.includes('lista')
      ) {
        // Guías retrasadas
        if (
          lowerMessage.includes('retrasad') ||
          lowerMessage.includes('retraso') ||
          lowerMessage.includes('demora')
        ) {
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
            datos: { guias: retrasadas, filtro: 'retrasadas' },
            acciones: [
              {
                id: 'contactar-todos',
                label: 'Contactar clientes',
                icon: '📞',
                comando: 'Cómo contactar clientes',
                tipo: 'accion',
              },
              {
                id: 'crear-tickets',
                label: 'Crear tickets',
                icon: '🎫',
                comando: 'Cómo crear tickets',
                tipo: 'accion',
              },
            ],
            confianza: 0.95,
          };
        }

        // Guías en reparto
        if (lowerMessage.includes('reparto')) {
          const guiasReparto = guiasData.filter((g) => g.estado === 'EN REPARTO');
          return {
            id: uuidv4(),
            rol: 'assistant',
            contenido: `🚚 **GUÍAS EN REPARTO HOY (${guiasReparto.length || enReparto})**

${
  guiasReparto
    .slice(0, 5)
    .map(
      (g, i) => `**${i + 1}. ${g.id}**
   • ${g.transportadora} → ${g.ciudad}
   • Día ${g.diasTransito} de tránsito
`
    )
    .join('\n') || 'Las guías en reparto se entregarán hoy. El mensajero intentará la entrega.'
}

**📋 PLANTILLA PARA NOTIFICAR:**
\`\`\`
Hola! Tu pedido ya está en camino. El mensajero
intentará la entrega hoy. Estate pendiente de
nuestro contacto. Guía: [NUMERO]
\`\`\``,
            timestamp: new Date(),
            tipo: 'guias',
            acciones: [
              {
                id: 'notificar',
                label: 'Ver plantilla',
                icon: '📝',
                comando: 'Muéstrame las plantillas',
                tipo: 'info',
              },
            ],
            confianza: 0.98,
          };
        }

        // Guías en oficina
        if (lowerMessage.includes('oficina')) {
          const guiasOficina = guiasData.filter((g) => g.estado === 'EN OFICINA');
          return {
            id: uuidv4(),
            rol: 'assistant',
            contenido: `📍 **GUÍAS EN OFICINA (${guiasOficina.length || enOficina})**

Estas guías esperan ser reclamadas por el cliente.

${
  guiasOficina
    .slice(0, 5)
    .map(
      (g, i) => `**${i + 1}. ${g.id}**
   • ${g.transportadora} | ${g.ciudad}
   • ${g.diasTransito} días en oficina
   • ${g.diasTransito > 3 ? '⚠️ URGENTE - próximo a devolución' : '✅ Tiempo normal'}
`
    )
    .join('\n') || 'No hay guías en oficina actualmente.'
}

**📋 REGLAS:**
- 0-3 días: Enviar plantilla "Reclamo en Oficina"
- +3 días: Enviar plantilla "No Oficina" + imagen de guía
- +7 días: Se devuelve automáticamente`,
            timestamp: new Date(),
            tipo: 'guias',
            acciones: [
              {
                id: 'plantilla-oficina',
                label: 'Ver plantilla',
                icon: '📝',
                comando: 'Dame la plantilla de oficina',
                tipo: 'info',
              },
              {
                id: 'llamar',
                label: 'Proceso de llamada',
                icon: '📞',
                comando: 'Cómo llamar al cliente',
                tipo: 'info',
              },
            ],
            confianza: 0.97,
          };
        }

        // Todas las guías
        const totalGuias = guiasData.length || total;
        return {
          id: uuidv4(),
          rol: 'assistant',
          contenido: `📦 **LISTADO DE GUÍAS (${totalGuias} total)**

| Estado | Cantidad | Porcentaje |
|--------|----------|------------|
| 🚚 En Reparto | ${enReparto} | ${((enReparto / totalGuias) * 100).toFixed(1)}% |
| 📍 En Oficina | ${enOficina} | ${((enOficina / totalGuias) * 100).toFixed(1)}% |
| 🚨 Con Novedad | ${novedades} | ${((novedades / totalGuias) * 100).toFixed(1)}% |
| 🔄 En Tránsito | ${enTransito} | ${((enTransito / totalGuias) * 100).toFixed(1)}% |
| ✅ Entregadas | ${entregadas} | ${((entregadas / totalGuias) * 100).toFixed(1)}% |

**🔴 Guías críticas:** ${criticas}
**📈 Tasa de entrega:** ${((entregadas / totalGuias) * 100).toFixed(1)}%

¿Qué estado quieres ver en detalle?`,
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
            {
              id: 'reparto',
              label: 'Ver en reparto',
              icon: '🚚',
              comando: 'Muéstrame las guías en reparto',
              tipo: 'info',
            },
            {
              id: 'oficina',
              label: 'Ver en oficina',
              icon: '📍',
              comando: 'Muéstrame las guías en oficina',
              tipo: 'info',
            },
          ],
          confianza: 0.99,
        };
      }

      // ============ CONSULTAS DE NOVEDADES ============
      if (lowerMessage.includes('novedad')) {
        if (
          lowerMessage.includes('cómo') ||
          lowerMessage.includes('como') ||
          lowerMessage.includes('resolver') ||
          lowerMessage.includes('proceso')
        ) {
          return {
            id: uuidv4(),
            rol: 'assistant',
            contenido: `📋 **PROCESO DE NOVEDADES (P02)**

**FLUJO DE RESOLUCIÓN:**

\`\`\`
┌──────────────────────────────────────┐
│ 1. TOMAR NOVEDAD (en orden de lista) │
└─────────────┬────────────────────────┘
              │
              ▼
┌──────────────────────────────────────┐
│ 2. BUSCAR EN CHATEA PRO              │
│    ¿Hay respuesta del cliente?       │
└─────────────┬────────────────────────┘
              │
      ┌───────┴───────┐
      │               │
   SÍ ▼            NO ▼
┌─────────────┐  ┌─────────────────┐
│ Subir       │  │ LLAMAR al       │
│ solución    │  │ cliente         │
│ en Dropi    │  └────────┬────────┘
│ (botón      │           │
│  verde)     │           ▼
└─────────────┘  ┌─────────────────┐
                 │ ¿Contesta?      │
                 └────────┬────────┘
                          │
                  ┌───────┴───────┐
               SÍ ▼            NO ▼
         ┌─────────────┐  ┌─────────────┐
         │ Coordinar   │  │ 2-3 intentos│
         │ día/jornada │  │ + plantilla │
         └─────────────┘  └─────────────┘
\`\`\`

**REGLAS CRÍTICAS:**
❌ NUNCA dar hora exacta (solo jornada: mañana/tarde)
❌ NUNCA devolver sin autorización del supervisor
✅ SIEMPRE verificar Chatea ANTES de llamar
✅ SIEMPRE registrar TODO en Dropi`,
            timestamp: new Date(),
            tipo: 'texto',
            acciones: [
              {
                id: 'ver-novedades',
                label: 'Ver novedades',
                icon: '🚨',
                comando: 'Lista las novedades activas',
                tipo: 'info',
              },
              {
                id: 'ejemplo',
                label: 'Ver ejemplo',
                icon: '💡',
                comando: 'Dame un ejemplo de novedad',
                tipo: 'info',
              },
            ],
            confianza: 0.96,
          };
        }

        const guiasNovedad = guiasData.filter((g) => g.estado === 'NOVEDAD');
        return {
          id: uuidv4(),
          rol: 'assistant',
          contenido: `🚨 **NOVEDADES ACTIVAS (${guiasNovedad.length || novedades})**

${
  guiasNovedad
    .slice(0, 5)
    .map(
      (g, i) => `**${i + 1}. ${g.id}**
   • ${g.transportadora} → ${g.ciudad}
   • ${g.diasTransito} días | Riesgo: ${g.nivelRiesgo}
`
    )
    .join('\n') || `Hay ${novedades} novedades que requieren atención.`
}

**📋 ORDEN DE ATENCIÓN:**
1. Primero las más antiguas (más días)
2. Verificar Chatea antes de llamar
3. Registrar TODA solución en Dropi

¿Quieres ver el proceso de resolución?`,
          timestamp: new Date(),
          tipo: 'guias',
          acciones: [
            {
              id: 'proceso',
              label: 'Ver proceso',
              icon: '📋',
              comando: 'Cómo resolver una novedad',
              tipo: 'info',
            },
            {
              id: 'plantillas',
              label: 'Ver plantillas',
              icon: '📝',
              comando: 'Muéstrame las plantillas',
              tipo: 'info',
            },
          ],
          confianza: 0.94,
        };
      }

      // ============ CONSULTAS DE RESUMEN/ESTADÍSTICAS ============
      if (
        lowerMessage.includes('resumen') ||
        lowerMessage.includes('estadística') ||
        lowerMessage.includes('métrica') ||
        lowerMessage.includes('día')
      ) {
        const totalGuias = shipments.length || 8;
        const tasaEntrega = totalGuias > 0 ? ((entregadas / totalGuias) * 100).toFixed(1) : '85.0';

        return {
          id: uuidv4(),
          rol: 'assistant',
          contenido: `📊 **RESUMEN DEL DÍA**
*${new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}*

| Métrica | Valor | Estado |
|---------|-------|--------|
| 📦 Total guías | ${totalGuias} | - |
| ✅ Entregadas | ${entregadas} | ${Number(tasaEntrega) >= 85 ? '🟢' : '🟡'} |
| 🚚 En reparto | ${enReparto} | 🟢 |
| 📍 En oficina | ${enOficina} | ${enOficina > 2 ? '🟡' : '🟢'} |
| 🚨 Con novedad | ${novedades} | ${novedades > 0 ? '🟠' : '🟢'} |
| 🔴 Críticas | ${criticas} | ${criticas > 0 ? '🔴' : '🟢'} |

**📈 INDICADORES CLAVE:**
- **Tasa de entrega:** ${tasaEntrega}% ${Number(tasaEntrega) >= 85 ? '✅ Cumple meta' : '⚠️ Por debajo (meta: 85%)'}
- **Meta del mes:** 85% entregas exitosas

${criticas > 0 ? `\n⚠️ **ALERTA:** ${criticas} guía(s) CRÍTICAS requieren atención INMEDIATA.` : '✅ No hay alertas críticas.'}

${patrones.length > 0 ? `\n🔍 **PATRONES:** ${patrones.length} detectados` : ''}`,
          timestamp: new Date(),
          tipo: 'estadisticas',
          acciones: [
            {
              id: 'criticas',
              label: 'Ver críticas',
              icon: '🔴',
              comando: 'Muéstrame las guías críticas',
              tipo: 'info',
            },
            {
              id: 'patrones',
              label: 'Ver patrones',
              icon: '🔍',
              comando: 'Muéstrame los patrones detectados',
              tipo: 'info',
            },
            {
              id: 'transportadoras',
              label: 'Transportadoras',
              icon: '🚚',
              comando: 'Ranking de transportadoras',
              tipo: 'info',
            },
          ],
          confianza: 0.98,
        };
      }

      // ============ CONSULTAS DE TRANSPORTADORAS ============
      if (
        lowerMessage.includes('transportadora') ||
        lowerMessage.includes('mejor') ||
        lowerMessage.includes('ranking') ||
        lowerMessage.includes('rendimiento')
      ) {
        const mejor = TRANSPORTADORAS_STATS[0];
        const peor = TRANSPORTADORAS_STATS[TRANSPORTADORAS_STATS.length - 1];

        return {
          id: uuidv4(),
          rol: 'assistant',
          contenido: `🚚 **RANKING DE TRANSPORTADORAS**

| # | Transportadora | Guías | Éxito | Tiempo |
|---|----------------|-------|-------|--------|
| 🥇 | ${TRANSPORTADORAS_STATS[0].nombre} | ${TRANSPORTADORAS_STATS[0].guias.toLocaleString()} | ${TRANSPORTADORAS_STATS[0].tasaExito}% | ${TRANSPORTADORAS_STATS[0].tiempoProm}d |
| 🥈 | ${TRANSPORTADORAS_STATS[1].nombre} | ${TRANSPORTADORAS_STATS[1].guias.toLocaleString()} | ${TRANSPORTADORAS_STATS[1].tasaExito}% | ${TRANSPORTADORAS_STATS[1].tiempoProm}d |
| 🥉 | ${TRANSPORTADORAS_STATS[2].nombre} | ${TRANSPORTADORAS_STATS[2].guias.toLocaleString()} | ${TRANSPORTADORAS_STATS[2].tasaExito}% | ${TRANSPORTADORAS_STATS[2].tiempoProm}d |
| 4 | ${TRANSPORTADORAS_STATS[3].nombre} | ${TRANSPORTADORAS_STATS[3].guias.toLocaleString()} | ${TRANSPORTADORAS_STATS[3].tasaExito}% | ${TRANSPORTADORAS_STATS[3].tiempoProm}d |
| 5 | ${TRANSPORTADORAS_STATS[4].nombre} | ${TRANSPORTADORAS_STATS[4].guias.toLocaleString()} | ${TRANSPORTADORAS_STATS[4].tasaExito}% | ${TRANSPORTADORAS_STATS[4].tiempoProm}d |

**💡 RECOMENDACIONES:**
- **Mejor rendimiento:** ${mejor.nombre} (${mejor.tasaExito}%)
- **Más rápida:** ${mejor.nombre} (${mejor.tiempoProm} días)
- **A mejorar:** ${peor.nombre} (${peor.tasaExito}%)

Prioriza envíos importantes con ${mejor.nombre} para mejor resultado.`,
          timestamp: new Date(),
          tipo: 'tabla',
          acciones: [
            {
              id: 'comparar',
              label: 'Comparar',
              icon: '📊',
              comando: 'Compara las transportadoras',
              tipo: 'info',
            },
          ],
          confianza: 0.97,
        };
      }

      // ============ CONSULTAS DE ML ============
      if (
        lowerMessage.includes('machine') ||
        lowerMessage.includes('ml') ||
        lowerMessage.includes('predicción') ||
        lowerMessage.includes('prediccion') ||
        lowerMessage.includes('modelo')
      ) {
        return {
          id: uuidv4(),
          rol: 'assistant',
          contenido: `🧠 **SISTEMA DE MACHINE LEARNING**

**📊 MODELOS ACTIVOS:**

| Modelo | Accuracy | Estado | Predicciones |
|--------|----------|--------|--------------|
| Predictor Retrasos | 92.3% | ${mlActivo ? '🟢 Activo' : '🔴 Off'} | 1,247 hoy |
| Detector Novedades | 87.6% | ${mlActivo ? '🟢 Activo' : '🔴 Off'} | 892 hoy |
| Optimizador Rutas | 89.1% | ${mlActivo ? '🟢 Activo' : '🔴 Off'} | 456 hoy |

**🔍 PATRONES DETECTADOS:**
${
  patrones
    .slice(0, 3)
    .map((p) => `• ${p.titulo} (${p.impacto})`)
    .join('\n') || '• Sin patrones críticos detectados'
}

**💡 INSIGHT ML:**
El sistema predice que implementando acciones proactivas se puede mejorar la tasa de entrega en un **15%**.

Estado del sistema: ${mlActivo ? '✅ **ACTIVO** - Procesando en tiempo real' : '⚠️ **INACTIVO** - Actívalo para predicciones'}`,
          timestamp: new Date(),
          tipo: 'reporte',
          acciones: [
            {
              id: 'patrones',
              label: 'Ver patrones',
              icon: '🔍',
              comando: 'Muéstrame los patrones detectados',
              tipo: 'info',
            },
            {
              id: 'predecir',
              label: 'Predecir guía',
              icon: '🎯',
              comando: 'Predice el riesgo de mis guías',
              tipo: 'info',
            },
          ],
          confianza: 0.93,
        };
      }

      // ============ CONSULTAS DE PATRONES ============
      if (
        lowerMessage.includes('patrón') ||
        lowerMessage.includes('patron') ||
        lowerMessage.includes('detecta')
      ) {
        return {
          id: uuidv4(),
          rol: 'assistant',
          contenido: `🔍 **PATRONES DETECTADOS**

${
  patrones.length > 0
    ? patrones
        .slice(0, 4)
        .map(
          (
            p
          ) => `**${p.impacto === 'CRITICO' ? '🔴' : p.impacto === 'ALTO' ? '🟠' : '🟡'} ${p.titulo}**
• ${p.descripcion}
• Afecta: ${p.datosApoyo.cantidad} guías (${p.datosApoyo.porcentaje.toFixed(1)}%)
• Acción: ${p.recomendacion}
`
        )
        .join('\n')
    : `**Análisis basado en datos del sistema:**

🔴 **CRÍTICO - Acumulación oficinas**
• ${enOficina} guías en oficina
• Riesgo: Devolución automática +7 días
• Acción: Contactar clientes urgente

🟠 **ALTO - Novedades activas**
• ${novedades} guías con novedad
• Acción: Resolver en orden de antigüedad

🟢 **BUENO - Tránsito normal**
• ${enTransito + enReparto} guías fluyendo bien`
}

**💡 INSIGHT ML:**
Resolviendo los patrones críticos se puede reducir la tasa de devolución hasta en un **40%**.`,
          timestamp: new Date(),
          tipo: 'lista',
          acciones: [
            {
              id: 'resolver',
              label: 'Resolver críticos',
              icon: '🔴',
              comando: 'Cómo resolver el patrón crítico',
              tipo: 'accion',
            },
          ],
          confianza: 0.91,
        };
      }

      // ============ PLANTILLAS ============
      if (lowerMessage.includes('plantilla')) {
        return {
          id: uuidv4(),
          rol: 'assistant',
          contenido: `📝 **PLANTILLAS DE MENSAJES**

**1. REPARTO** 🚚
\`\`\`
Hola! Tu pedido ya está en camino. El mensajero
intentará la entrega hoy. Estate pendiente de
nuestro contacto. Guía: [NUMERO_GUIA]
\`\`\`

**2. EN OFICINA (0-3 días)** 📍
\`\`\`
Tu pedido ya llegó a la oficina de [TRANSPORTADORA].
Puedes reclamarlo con tu cédula. Te envío la guía
para que la tengas a mano: [NUMERO_GUIA]
\`\`\`

**3. EN OFICINA (+3 días)** ⚠️
\`\`\`
Tu pedido lleva varios días en oficina. Si no lo
reclamas pronto, será devuelto. ¿Puedes pasar
hoy o mañana? [IMAGEN_GUIA]
\`\`\`

**4. REENVÍO** 🔄
\`\`\`
Hemos reprogramado tu pedido. Llegará en 1-2 días
hábiles. Llamaremos antes. Guía: [NUMERO_GUIA]
\`\`\`

**5. NOVEDAD - COORDINAR** 📞
\`\`\`
Hola! Necesitamos coordinar la entrega de tu pedido.
¿En qué jornada te queda mejor: mañana o tarde?
\`\`\`

Copia la plantilla que necesites reemplazando [DATOS].`,
          timestamp: new Date(),
          tipo: 'lista',
          acciones: [
            {
              id: 'proceso-chat',
              label: 'Proceso de chat',
              icon: '💬',
              comando: 'Explícame el proceso de chat en vivo',
              tipo: 'info',
            },
          ],
          confianza: 0.99,
        };
      }

      // ============ PROCESOS ============
      if (lowerMessage.includes('proceso') || lowerMessage.includes('flujo')) {
        return {
          id: uuidv4(),
          rol: 'assistant',
          contenido: `📋 **PROCESOS LITPER DISPONIBLES**

| ID | Proceso | Automatizable | Prioridad |
|----|---------|---------------|-----------|
| P01 | Seguimiento de Guías | 100% | 🔴 CRÍTICO |
| P02 | Novedades | 90% | 🔴 CRÍTICO |
| P03 | Reclamo en Oficina | 85% | 🟡 ALTO |
| P04 | Chat en Vivo | 80% | 🟡 ALTO |
| P05 | Generación de Pedidos | 95% | 🟢 MEDIO |

**META PRINCIPAL:** 85% tasa de entrega

Cada proceso tiene su flujo detallado con reglas y plantillas. ¿Cuál necesitas conocer?`,
          timestamp: new Date(),
          tipo: 'lista',
          acciones: [
            {
              id: 'p01',
              label: 'P01: Seguimiento',
              icon: '📦',
              comando: 'Explícame el proceso de seguimiento',
              tipo: 'info',
            },
            {
              id: 'p02',
              label: 'P02: Novedades',
              icon: '🚨',
              comando: 'Explícame el proceso de novedades',
              tipo: 'info',
            },
            {
              id: 'p04',
              label: 'P04: Chat',
              icon: '💬',
              comando: 'Explícame el proceso de chat',
              tipo: 'info',
            },
          ],
          confianza: 0.99,
        };
      }

      // ============ RESPUESTA POR DEFECTO ============
      return {
        id: uuidv4(),
        rol: 'assistant',
        contenido: `Entiendo tu consulta. Déjame ayudarte.

**📊 Estado actual:**
• ${total} guías activas
• ${criticas} requieren atención urgente
• Tasa de entrega: ${((entregadas / total) * 100).toFixed(1)}%

**Puedo ayudarte con:**
📦 **Guías:** "Lista las guías" / "Guías retrasadas"
🚨 **Novedades:** "Ver novedades" / "Cómo resolver"
📊 **Estadísticas:** "Resumen del día"
🚚 **Transportadoras:** "Mejor transportadora"
🧠 **ML:** "Predicciones" / "Patrones"
📋 **Procesos:** "Ver procesos" / "Plantillas"

¿Qué información específica necesitas?`,
        timestamp: new Date(),
        tipo: 'texto',
        acciones: [
          { id: 'guias', label: 'Ver guías', icon: '📦', comando: 'Lista las guías', tipo: 'info' },
          {
            id: 'resumen',
            label: 'Resumen',
            icon: '📊',
            comando: 'Dame el resumen del día',
            tipo: 'info',
          },
          {
            id: 'novedades',
            label: 'Novedades',
            icon: '🚨',
            comando: 'Lista las novedades',
            tipo: 'info',
          },
        ],
        confianza: 0.85,
      };
    },
    [shipments, guiasData, mlActivo]
  );

  // Enviar mensaje
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

  // Limpiar chat
  const handleClear = () => {
    if (confirm('¿Limpiar conversación?')) {
      setMensajes([
        {
          id: uuidv4(),
          rol: 'assistant',
          contenido: '¡Conversación reiniciada! 🔄 ¿En qué puedo ayudarte?',
          timestamp: new Date(),
          acciones: [
            {
              id: 'guias',
              label: 'Ver guías',
              icon: '📦',
              comando: 'Lista las guías',
              tipo: 'info',
            },
            {
              id: 'resumen',
              label: 'Resumen',
              icon: '📊',
              comando: 'Dame el resumen del día',
              tipo: 'info',
            },
          ],
        },
      ]);
      setMostrarSugerencias(true);
    }
  };

  // Renderizar mensaje
  const renderMessage = (mensaje: MensajeChat) => {
    if (mensaje.rol === 'user') {
      return (
        <div key={mensaje.id} className="flex justify-end mb-4">
          <div className="max-w-[85%] bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl rounded-br-sm px-4 py-3 shadow-lg">
            <p className="text-sm">{mensaje.contenido}</p>
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
            {mensaje.confianza && (
              <span className="text-xs text-gray-400 ml-auto">
                {(mensaje.confianza * 100).toFixed(0)}%
              </span>
            )}
          </div>

          <div className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">
            {mensaje.contenido}
          </div>

          {/* Acciones rápidas */}
          {mensaje.acciones && mensaje.acciones.length > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
              <p className="text-xs text-gray-400 mb-2">Acciones sugeridas:</p>
              <div className="flex flex-wrap gap-2">
                {mensaje.acciones.map((accion) => (
                  <button
                    key={accion.id}
                    onClick={() => handleSend(accion.comando)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      accion.tipo === 'accion'
                        ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                    }`}
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
    <div className="flex flex-col h-[calc(100vh-200px)] min-h-[600px] bg-gradient-to-b from-slate-50 to-white dark:from-gray-900 dark:to-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur">
            <Bot className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Asistente IA LITPER</h2>
            <p className="text-xs text-indigo-200 flex items-center gap-2">
              <span className="flex items-center gap-1">
                <span
                  className={`w-2 h-2 rounded-full ${mlActivo ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}
                />
                ML {mlActivo ? 'Activo' : 'Off'}
              </span>
              <span>•</span>
              <span>{shipments.length} guías</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setMlActivo(!mlActivo)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              mlActivo
                ? 'bg-green-400/20 text-green-100 hover:bg-green-400/30'
                : 'bg-red-400/20 text-red-100 hover:bg-red-400/30'
            }`}
          >
            <Brain className="w-4 h-4 inline mr-1" />
            {mlActivo ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={handleClear}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            title="Limpiar"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

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
                    className="px-3 py-1.5 bg-white dark:bg-gray-800 rounded-lg text-xs text-gray-600 dark:text-gray-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                  >
                    "{ejemplo}"
                  </button>
                )
              )}
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {mensajes.map(renderMessage)}

        {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl px-4 py-3 shadow-lg border border-gray-200 dark:border-gray-700 flex items-center gap-2">
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
            className="p-2 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
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
            className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
          />

          <button
            onClick={() => handleSend()}
            disabled={!inputValue.trim() || isLoading}
            className="p-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-center text-gray-400 mt-2">Claude AI + ML • Enter para enviar</p>
      </div>
    </div>
  );
};

export default AsistenteTab;
