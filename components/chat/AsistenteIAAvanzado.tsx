/**
 * 🤖 AsistenteIAAvanzado - Chat Inteligente con todas las capacidades
 * Integra análisis, reportes, ML y gestión de procesos LITPER
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
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
  Bookmark,
  Share2,
  ChevronDown,
  ChevronUp,
  X,
  Plus,
  Mic,
  Image,
  Paperclip,
  Calendar,
  DollarSign,
  Star,
  Award,
  Lightbulb,
  AlertCircle,
  Info,
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Shipment } from '../../types';
import { mlApi } from '../../lib/api-config';
import { askAssistant, analyzeDelayPatterns } from '../../services/claudeService';

// Tipos
interface MensajeChat {
  id: string;
  rol: 'user' | 'assistant' | 'system';
  contenido: string;
  timestamp: Date;
  tipo?: 'texto' | 'tabla' | 'lista' | 'accion' | 'guias' | 'estadisticas' | 'reporte';
  datos?: any;
  acciones?: AccionRapida[];
  expandido?: boolean;
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

interface AsistenteIAAvanzadoProps {
  shipments?: Shipment[];
  onNavigate?: (tab: string) => void;
}

// Categorías de consulta
const CATEGORIAS_CONSULTA: CategoriaConsulta[] = [
  {
    id: 'guias',
    nombre: 'Guías',
    icono: '📦',
    color: 'from-blue-500 to-cyan-600',
    ejemplos: ['Lista todas las guías', 'Guías en reparto', 'Guías retrasadas'],
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
    ejemplos: ['Resumen del día', 'Métricas de entrega', 'Comparar transportadoras'],
  },
  {
    id: 'transportadoras',
    nombre: 'Transportadoras',
    icono: '🚚',
    color: 'from-purple-500 to-pink-600',
    ejemplos: ['Mejor transportadora', 'Rendimiento TCC', 'Comparar tiempos'],
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
    ejemplos: ['Proceso de novedades', 'Cómo crear pedido', 'Flujo de seguimiento'],
  },
];

// Datos de ejemplo
const GUIAS_EJEMPLO: GuiaInfo[] = [
  { id: '8001234567890', estado: 'EN REPARTO', transportadora: 'Interrapidísimo', ciudad: 'Bogotá', telefono: '3001234567', diasTransito: 2, nivelRiesgo: 'BAJO', ultimaActualizacion: '2024-12-08 10:30' },
  { id: '8009876543210', estado: 'EN OFICINA', transportadora: 'Coordinadora', ciudad: 'Medellín', telefono: '3109876543', diasTransito: 4, nivelRiesgo: 'ALTO', ultimaActualizacion: '2024-12-06 15:45' },
  { id: '9001122334455', estado: 'NOVEDAD', transportadora: 'Envía', ciudad: 'Cali', telefono: '3201122334', diasTransito: 3, nivelRiesgo: 'MEDIO', ultimaActualizacion: '2024-12-07 09:15' },
  { id: '7005566778899', estado: 'EN TRÁNSITO', transportadora: 'Servientrega', ciudad: 'Barranquilla', telefono: '3155566778', diasTransito: 1, nivelRiesgo: 'BAJO', ultimaActualizacion: '2024-12-08 08:00' },
  { id: '8002233445566', estado: 'DEVUELTO', transportadora: 'TCC', ciudad: 'Cartagena', telefono: '3182233445', diasTransito: 7, nivelRiesgo: 'CRITICO', ultimaActualizacion: '2024-12-01 14:20' },
  { id: '9003344556677', estado: 'ENTREGADO', transportadora: 'Coordinadora', ciudad: 'Bogotá', telefono: '3193344556', diasTransito: 2, nivelRiesgo: 'BAJO', ultimaActualizacion: '2024-12-07 16:00' },
  { id: '8004455667788', estado: 'EN REPARTO', transportadora: 'Interrapidísimo', ciudad: 'Cali', telefono: '3204455667', diasTransito: 3, nivelRiesgo: 'MEDIO', ultimaActualizacion: '2024-12-08 09:45' },
  { id: '7006677889900', estado: 'NOVEDAD', transportadora: 'TCC', ciudad: 'Medellín', telefono: '3156677889', diasTransito: 5, nivelRiesgo: 'ALTO', ultimaActualizacion: '2024-12-05 11:30' },
];

// Estadísticas de transportadoras
const TRANSPORTADORAS_STATS = [
  { nombre: 'Coordinadora', guias: 4521, entregadas: 4298, retrasos: 156, tasaExito: 95.1, tiempoProm: 2.3 },
  { nombre: 'Servientrega', guias: 3892, entregadas: 3543, retrasos: 234, tasaExito: 91.0, tiempoProm: 2.8 },
  { nombre: 'Interrapidísimo', guias: 2987, entregadas: 2689, retrasos: 198, tasaExito: 90.0, tiempoProm: 3.1 },
  { nombre: 'Envía', guias: 2156, entregadas: 1897, retrasos: 178, tasaExito: 88.0, tiempoProm: 3.5 },
  { nombre: 'TCC', guias: 1845, entregadas: 1567, retrasos: 189, tasaExito: 85.0, tiempoProm: 4.2 },
];

export const AsistenteIAAvanzado: React.FC<AsistenteIAAvanzadoProps> = ({
  shipments = [],
  onNavigate,
}) => {
  const [mensajes, setMensajes] = useState<MensajeChat[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mlActivo, setMlActivo] = useState(true);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string | null>(null);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Mensaje de bienvenida
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

**¿Qué necesitas saber?** Puedes preguntarme con texto normal o usar las categorías de abajo.`,
      timestamp: new Date(),
      tipo: 'texto',
      acciones: [
        { id: 'guias-hoy', label: 'Ver guías de hoy', icon: '📦', comando: 'Muéstrame las guías de hoy', tipo: 'info' },
        { id: 'resumen', label: 'Resumen del día', icon: '📊', comando: 'Dame el resumen del día', tipo: 'info' },
        { id: 'novedades', label: 'Novedades activas', icon: '🚨', comando: 'Lista las novedades activas', tipo: 'info' },
        { id: 'prediccion', label: 'Predicciones ML', icon: '🧠', comando: 'Muéstrame las predicciones de retraso', tipo: 'info' },
      ],
    };
    setMensajes([welcomeMessage]);
  }, []);

  // Scroll automático
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  // Generar respuesta inteligente
  const generateResponse = useCallback(async (userMessage: string): Promise<MensajeChat> => {
    const lowerMessage = userMessage.toLowerCase();

    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 800));

    // ============ CONSULTAS DE GUÍAS ============
    if (lowerMessage.includes('guía') || lowerMessage.includes('guias') || lowerMessage.includes('lista')) {
      // Guías retrasadas
      if (lowerMessage.includes('retrasad') || lowerMessage.includes('retraso') || lowerMessage.includes('demora')) {
        const retrasadas = GUIAS_EJEMPLO.filter(g =>
          g.diasTransito > 3 || g.nivelRiesgo === 'ALTO' || g.nivelRiesgo === 'CRITICO'
        );
        return {
          id: uuidv4(),
          rol: 'assistant',
          contenido: `⚠️ **GUÍAS RETRASADAS (${retrasadas.length})**

Estas guías necesitan atención prioritaria. Haz clic en cualquiera para ver detalles o tomar acción:`,
          timestamp: new Date(),
          tipo: 'guias',
          datos: { guias: retrasadas, filtro: 'retrasadas' },
          acciones: [
            { id: 'contactar-todos', label: 'Contactar todos los clientes', icon: '📞', comando: 'Contactar clientes de guías retrasadas', tipo: 'accion' },
            { id: 'crear-tickets', label: 'Crear tickets masivos', icon: '🎫', comando: 'Crear tickets para guías retrasadas', tipo: 'accion' },
          ],
          confianza: 0.95,
        };
      }

      // Guías en reparto
      if (lowerMessage.includes('reparto')) {
        const enReparto = GUIAS_EJEMPLO.filter(g => g.estado === 'EN REPARTO');
        return {
          id: uuidv4(),
          rol: 'assistant',
          contenido: `🚚 **GUÍAS EN REPARTO HOY (${enReparto.length})**

Estas guías están en camino para entrega. El estado se actualiza cada 30 minutos:`,
          timestamp: new Date(),
          tipo: 'guias',
          datos: { guias: enReparto, filtro: 'en-reparto' },
          acciones: [
            { id: 'notificar-clientes', label: 'Notificar clientes', icon: '📱', comando: 'Enviar notificación de reparto', tipo: 'accion' },
          ],
          confianza: 0.98,
        };
      }

      // Guías en oficina
      if (lowerMessage.includes('oficina')) {
        const enOficina = GUIAS_EJEMPLO.filter(g => g.estado === 'EN OFICINA');
        return {
          id: uuidv4(),
          rol: 'assistant',
          contenido: `📍 **GUÍAS EN OFICINA (${enOficina.length})**

Estas guías esperan ser reclamadas. Recuerda:
- 0-3 días: Enviar plantilla "Reclamo en Oficina"
- +3 días: Enviar plantilla "No Oficina" con imagen de guía`,
          timestamp: new Date(),
          tipo: 'guias',
          datos: { guias: enOficina, filtro: 'en-oficina' },
          acciones: [
            { id: 'llamar-todos', label: 'Llamar a todos', icon: '📞', comando: 'Iniciar llamadas a clientes en oficina', tipo: 'accion' },
            { id: 'enviar-plantilla', label: 'Enviar plantilla', icon: '📝', comando: 'Enviar plantilla de oficina', tipo: 'accion' },
          ],
          confianza: 0.97,
        };
      }

      // Todas las guías
      return {
        id: uuidv4(),
        rol: 'assistant',
        contenido: `📦 **LISTADO DE GUÍAS (${GUIAS_EJEMPLO.length} total)**

| Estado | Cantidad | % |
|--------|----------|---|
| 🚚 En Reparto | ${GUIAS_EJEMPLO.filter(g => g.estado === 'EN REPARTO').length} | ${((GUIAS_EJEMPLO.filter(g => g.estado === 'EN REPARTO').length / GUIAS_EJEMPLO.length) * 100).toFixed(1)}% |
| 📍 En Oficina | ${GUIAS_EJEMPLO.filter(g => g.estado === 'EN OFICINA').length} | ${((GUIAS_EJEMPLO.filter(g => g.estado === 'EN OFICINA').length / GUIAS_EJEMPLO.length) * 100).toFixed(1)}% |
| 🚨 Con Novedad | ${GUIAS_EJEMPLO.filter(g => g.estado === 'NOVEDAD').length} | ${((GUIAS_EJEMPLO.filter(g => g.estado === 'NOVEDAD').length / GUIAS_EJEMPLO.length) * 100).toFixed(1)}% |
| 🔄 En Tránsito | ${GUIAS_EJEMPLO.filter(g => g.estado === 'EN TRÁNSITO').length} | ${((GUIAS_EJEMPLO.filter(g => g.estado === 'EN TRÁNSITO').length / GUIAS_EJEMPLO.length) * 100).toFixed(1)}% |
| ✅ Entregadas | ${GUIAS_EJEMPLO.filter(g => g.estado === 'ENTREGADO').length} | ${((GUIAS_EJEMPLO.filter(g => g.estado === 'ENTREGADO').length / GUIAS_EJEMPLO.length) * 100).toFixed(1)}% |

Haz clic para ver detalles de cada guía:`,
        timestamp: new Date(),
        tipo: 'guias',
        datos: { guias: GUIAS_EJEMPLO, filtro: 'todas' },
        acciones: [
          { id: 'ver-retrasadas', label: 'Ver retrasadas', icon: '⚠️', comando: 'Muéstrame las guías retrasadas', tipo: 'info' },
          { id: 'exportar', label: 'Exportar Excel', icon: '📥', comando: 'Exportar listado a Excel', tipo: 'accion' },
        ],
        confianza: 0.99,
      };
    }

    // ============ CONSULTAS DE NOVEDADES ============
    if (lowerMessage.includes('novedad')) {
      const novedades = GUIAS_EJEMPLO.filter(g => g.estado === 'NOVEDAD');

      if (lowerMessage.includes('cómo') || lowerMessage.includes('como') || lowerMessage.includes('resolver') || lowerMessage.includes('proceso')) {
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
                  │               │
               SÍ ▼            NO ▼
         ┌─────────────┐  ┌─────────────┐
         │ Coordinar   │  │ 2-3 intentos│
         │ día/jornada │  │ + plantilla │
         │ Registrar   │  │ + pendiente │
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
            { id: 'ver-novedades', label: 'Ver novedades activas', icon: '🚨', comando: 'Lista las novedades activas', tipo: 'info' },
            { id: 'ejemplo', label: 'Ver ejemplo práctico', icon: '💡', comando: 'Dame un ejemplo de resolución de novedad', tipo: 'info' },
          ],
          confianza: 0.96,
        };
      }

      return {
        id: uuidv4(),
        rol: 'assistant',
        contenido: `🚨 **NOVEDADES ACTIVAS (${novedades.length})**

Estas novedades requieren gestión. Recuerda seguir el orden de la lista:`,
        timestamp: new Date(),
        tipo: 'guias',
        datos: { guias: novedades, filtro: 'novedades' },
        acciones: [
          { id: 'proceso', label: 'Ver proceso', icon: '📋', comando: 'Cómo resolver una novedad', tipo: 'info' },
          { id: 'resolver-todas', label: 'Resolver en lote', icon: '✅', comando: 'Resolver novedades en lote', tipo: 'accion' },
        ],
        confianza: 0.94,
      };
    }

    // ============ CONSULTAS DE ESTADÍSTICAS ============
    if (lowerMessage.includes('resumen') || lowerMessage.includes('estadística') || lowerMessage.includes('métrica') || lowerMessage.includes('día')) {
      const stats = {
        total: GUIAS_EJEMPLO.length,
        entregadas: GUIAS_EJEMPLO.filter(g => g.estado === 'ENTREGADO').length,
        enReparto: GUIAS_EJEMPLO.filter(g => g.estado === 'EN REPARTO').length,
        enOficina: GUIAS_EJEMPLO.filter(g => g.estado === 'EN OFICINA').length,
        novedades: GUIAS_EJEMPLO.filter(g => g.estado === 'NOVEDAD').length,
        criticas: GUIAS_EJEMPLO.filter(g => g.nivelRiesgo === 'CRITICO').length,
        promedioDias: (GUIAS_EJEMPLO.reduce((acc, g) => acc + g.diasTransito, 0) / GUIAS_EJEMPLO.length).toFixed(1),
      };
      const tasaEntrega = ((stats.entregadas / stats.total) * 100).toFixed(1);

      return {
        id: uuidv4(),
        rol: 'assistant',
        contenido: `📊 **RESUMEN DEL DÍA - ${new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}**

| Métrica | Valor | Estado |
|---------|-------|--------|
| 📦 Total guías | ${stats.total} | - |
| ✅ Entregadas | ${stats.entregadas} | ${Number(tasaEntrega) >= 85 ? '🟢' : '🟡'} |
| 🚚 En reparto | ${stats.enReparto} | - |
| 📍 En oficina | ${stats.enOficina} | ${stats.enOficina > 2 ? '🟡' : '🟢'} |
| 🚨 Con novedad | ${stats.novedades} | ${stats.novedades > 0 ? '🟠' : '🟢'} |
| 🔴 Críticas | ${stats.criticas} | ${stats.criticas > 0 ? '🔴' : '🟢'} |

**📈 INDICADORES CLAVE:**
- Tasa de entrega: **${tasaEntrega}%** ${Number(tasaEntrega) >= 85 ? '✅ Cumple meta' : '⚠️ Por debajo de meta (85%)'}
- Tiempo promedio: **${stats.promedioDias} días**
- Meta del mes: **85% entregas exitosas**

${stats.criticas > 0 ? `\n⚠️ **ALERTA:** Hay ${stats.criticas} guía(s) en estado CRÍTICO que requieren atención INMEDIATA.` : '\n✅ No hay alertas críticas en este momento.'}`,
        timestamp: new Date(),
        tipo: 'estadisticas',
        datos: stats,
        acciones: [
          { id: 'ver-criticas', label: 'Ver críticas', icon: '🔴', comando: 'Muéstrame las guías críticas', tipo: 'info' },
          { id: 'comparar', label: 'Comparar con ayer', icon: '📈', comando: 'Compara con el día anterior', tipo: 'info' },
          { id: 'exportar', label: 'Generar reporte', icon: '📄', comando: 'Generar reporte del día', tipo: 'accion' },
        ],
        confianza: 0.98,
      };
    }

    // ============ CONSULTAS DE TRANSPORTADORAS ============
    if (lowerMessage.includes('transportadora') || lowerMessage.includes('mejor') || lowerMessage.includes('comparar') || lowerMessage.includes('ranking')) {
      const mejor = TRANSPORTADORAS_STATS.reduce((a, b) => a.tasaExito > b.tasaExito ? a : b);
      const peor = TRANSPORTADORAS_STATS.reduce((a, b) => a.tasaExito < b.tasaExito ? a : b);

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
- **Mejor rendimiento:** ${mejor.nombre} con ${mejor.tasaExito}% de éxito
- **A mejorar:** ${peor.nombre} tiene la tasa más baja (${peor.tasaExito}%)
- **Más económica:** Envía con menor costo promedio
- **Más rápida:** Coordinadora con ${mejor.tiempoProm} días promedio`,
        timestamp: new Date(),
        tipo: 'tabla',
        datos: { transportadoras: TRANSPORTADORAS_STATS },
        acciones: [
          { id: 'detalles', label: 'Ver detalles', icon: '🔍', comando: `Dame detalles de ${mejor.nombre}`, tipo: 'info' },
          { id: 'tendencia', label: 'Ver tendencia', icon: '📈', comando: 'Tendencia de transportadoras del mes', tipo: 'info' },
        ],
        confianza: 0.97,
      };
    }

    // ============ CONSULTAS DE ML ============
    if (lowerMessage.includes('machine') || lowerMessage.includes('ml') || lowerMessage.includes('predicción') || lowerMessage.includes('prediccion') || lowerMessage.includes('patrón') || lowerMessage.includes('patron') || lowerMessage.includes('modelo')) {
      return {
        id: uuidv4(),
        rol: 'assistant',
        contenido: `🧠 **SISTEMA DE MACHINE LEARNING**

**📊 MODELOS ACTIVOS:**

| Modelo | Accuracy | Estado | Predicciones |
|--------|----------|--------|--------------|
| Predictor Retrasos | 92.3% | 🟢 Activo | 1,247 hoy |
| Detector Novedades | 87.6% | 🟢 Activo | 892 hoy |
| Optimizador Rutas | 89.1% | 🟢 Activo | 456 hoy |

**🔍 PATRONES DETECTADOS HOY:**

🔴 **CRÍTICO:** Acumulación en oficinas Medellín
   - 8 guías con +3 días
   - Riesgo: 80% devolución
   - Acción: Contactar urgente

🟠 **ALTO:** Retrasos ruta Barranquilla
   - 5 guías sin movimiento
   - Causa: Congestión en bodega TCC

🟡 **MEDIO:** Incremento novedades zona norte
   - +23% vs semana anterior
   - Causa: Direcciones incompletas

**💡 INSIGHT ML:** Implementando las acciones recomendadas se puede reducir la tasa de devolución en un **40%**.`,
        timestamp: new Date(),
        tipo: 'reporte',
        datos: { mlActivo: true },
        acciones: [
          { id: 'resolver-patron', label: 'Resolver patrón crítico', icon: '🔴', comando: 'Resolver el patrón crítico', tipo: 'accion' },
          { id: 'dashboard-ml', label: 'Dashboard ML', icon: '📊', comando: 'Abrir dashboard de ML', tipo: 'navegacion' },
          { id: 'entrenar', label: 'Reentrenar modelos', icon: '🔄', comando: 'Reentrenar los modelos ML', tipo: 'accion' },
        ],
        confianza: 0.93,
      };
    }

    // ============ CONSULTAS DE PROCESOS ============
    if (lowerMessage.includes('proceso') || lowerMessage.includes('flujo') || lowerMessage.includes('cómo') || lowerMessage.includes('como')) {
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

**¿Qué proceso necesitas conocer?**

Puedo explicarte paso a paso cualquiera de estos procesos con diagramas de flujo, reglas y ejemplos prácticos.`,
        timestamp: new Date(),
        tipo: 'lista',
        acciones: [
          { id: 'p01', label: 'P01: Seguimiento', icon: '📦', comando: 'Explícame el proceso de seguimiento de guías', tipo: 'info' },
          { id: 'p02', label: 'P02: Novedades', icon: '🚨', comando: 'Explícame el proceso de novedades', tipo: 'info' },
          { id: 'p04', label: 'P04: Chat en Vivo', icon: '💬', comando: 'Explícame el proceso de chat en vivo', tipo: 'info' },
        ],
        confianza: 0.99,
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

Haz clic en cualquier plantilla para copiarla al portapapeles.`,
        timestamp: new Date(),
        tipo: 'lista',
        acciones: [
          { id: 'copiar-reparto', label: 'Copiar REPARTO', icon: '📋', comando: 'Copiar plantilla de reparto', tipo: 'accion' },
          { id: 'copiar-oficina', label: 'Copiar OFICINA', icon: '📋', comando: 'Copiar plantilla de oficina', tipo: 'accion' },
          { id: 'copiar-novedad', label: 'Copiar NOVEDAD', icon: '📋', comando: 'Copiar plantilla de novedad', tipo: 'accion' },
        ],
        confianza: 0.99,
      };
    }

    // ============ RESPUESTA POR DEFECTO ============
    return {
      id: uuidv4(),
      rol: 'assistant',
      contenido: `Entiendo tu consulta. Déjame ver cómo puedo ayudarte.

**Puedo asistirte con:**
- 📦 **Guías:** Lista, busca o filtra por estado
- 🚨 **Novedades:** Ver activas o aprender a resolverlas
- 📊 **Estadísticas:** Resumen del día, métricas, comparativas
- 🚚 **Transportadoras:** Rankings, rendimiento, recomendaciones
- 🧠 **ML:** Predicciones, patrones, estado de modelos
- 📋 **Procesos:** Flujos paso a paso de LITPER

**Ejemplos de consultas:**
- "Muéstrame las guías retrasadas"
- "¿Cuál es el resumen del día?"
- "¿Cómo resuelvo una novedad?"
- "¿Cuál es la mejor transportadora?"

¿Qué información específica necesitas?`,
      timestamp: new Date(),
      tipo: 'texto',
      acciones: [
        { id: 'guias', label: 'Ver guías', icon: '📦', comando: 'Lista las guías', tipo: 'info' },
        { id: 'resumen', label: 'Resumen', icon: '📊', comando: 'Dame el resumen del día', tipo: 'info' },
        { id: 'novedades', label: 'Novedades', icon: '🚨', comando: 'Lista las novedades', tipo: 'info' },
        { id: 'ml', label: 'Sistema ML', icon: '🧠', comando: 'Estado del sistema ML', tipo: 'info' },
      ],
      confianza: 0.85,
    };
  }, []);

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

    setMensajes(prev => [...prev, userMessage]);
    setInputValue('');
    setMostrarSugerencias(false);
    setIsLoading(true);

    try {
      const response = await generateResponse(texto);
      setMensajes(prev => [...prev, response]);
    } catch (error) {
      setMensajes(prev => [...prev, {
        id: uuidv4(),
        rol: 'assistant',
        contenido: '❌ Lo siento, hubo un error procesando tu solicitud. Por favor intenta de nuevo.',
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Limpiar chat
  const handleClear = () => {
    if (confirm('¿Limpiar el historial de conversación?')) {
      setMensajes([{
        id: uuidv4(),
        rol: 'assistant',
        contenido: '¡Conversación reiniciada! 🔄 ¿En qué puedo ayudarte?',
        timestamp: new Date(),
        acciones: [
          { id: 'guias', label: 'Ver guías', icon: '📦', comando: 'Lista las guías', tipo: 'info' },
          { id: 'resumen', label: 'Resumen', icon: '📊', comando: 'Dame el resumen del día', tipo: 'info' },
        ],
      }]);
      setMostrarSugerencias(true);
    }
  };

  // Renderizar tarjeta de guía clickeable
  const renderGuiaCard = (guia: GuiaInfo) => {
    const riesgoColors = {
      BAJO: 'border-green-200 bg-green-50',
      MEDIO: 'border-yellow-200 bg-yellow-50',
      ALTO: 'border-orange-200 bg-orange-50',
      CRITICO: 'border-red-200 bg-red-50',
    };

    const estadoColors: Record<string, string> = {
      'EN REPARTO': 'bg-blue-100 text-blue-700',
      'EN OFICINA': 'bg-orange-100 text-orange-700',
      'NOVEDAD': 'bg-red-100 text-red-700',
      'EN TRÁNSITO': 'bg-cyan-100 text-cyan-700',
      'ENTREGADO': 'bg-green-100 text-green-700',
      'DEVUELTO': 'bg-gray-100 text-gray-700',
    };

    return (
      <div
        key={guia.id}
        className={`bg-white dark:bg-gray-800 rounded-xl p-4 border-2 ${riesgoColors[guia.nivelRiesgo]} dark:border-gray-700 hover:shadow-lg transition-all cursor-pointer group`}
        onClick={() => handleSend(`Dame detalles de la guía ${guia.id}`)}
      >
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="font-bold text-gray-800 dark:text-white font-mono text-sm">{guia.id}</p>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Truck className="w-3 h-3" />
              {guia.transportadora}
            </p>
          </div>
          <span className={`px-2 py-1 rounded-lg text-xs font-bold ${estadoColors[guia.estado] || 'bg-gray-100 text-gray-700'}`}>
            {guia.estado}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {guia.ciudad}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {guia.diasTransito}d
          </span>
        </div>

        {guia.telefono && (
          <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
            <button
              onClick={(e) => {
                e.stopPropagation();
                window.open(`https://wa.me/57${guia.telefono}?text=Hola! Le escribo de Litper sobre su pedido con guía ${guia.id}.`, '_blank');
              }}
              className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600 transition-colors"
            >
              <MessageCircle className="w-3 h-3" />
              WhatsApp
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(guia.id);
              }}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-300 transition-colors"
            >
              <Copy className="w-3 h-3" />
              Copiar
            </button>
          </div>
        )}

        <div className="mt-2 flex items-center justify-end text-indigo-500 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
          <span>Ver detalles</span>
          <ChevronRight className="w-3 h-3" />
        </div>
      </div>
    );
  };

  // Renderizar mensaje
  const renderMessage = (mensaje: MensajeChat) => {
    if (mensaje.rol === 'user') {
      return (
        <div key={mensaje.id} className="flex justify-end mb-4">
          <div className="max-w-[85%] bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl rounded-br-sm px-4 py-3 shadow-lg">
            <p className="text-sm">{mensaje.contenido}</p>
            <p className="text-xs text-white/60 mt-1 text-right">
              {new Date(mensaje.timestamp).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
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
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Asistente LITPER</span>
            {mensaje.confianza && (
              <span className="text-xs text-gray-400 ml-auto">
                {(mensaje.confianza * 100).toFixed(0)}% confianza
              </span>
            )}
          </div>

          <div className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap prose prose-sm max-w-none">
            {mensaje.contenido}
          </div>

          {/* Renderizar guías si hay datos */}
          {mensaje.tipo === 'guias' && mensaje.datos?.guias && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto">
              {mensaje.datos.guias.map((guia: GuiaInfo) => renderGuiaCard(guia))}
            </div>
          )}

          {/* Renderizar acciones rápidas */}
          {mensaje.acciones && mensaje.acciones.length > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
              <p className="text-xs text-gray-400 mb-2">Acciones sugeridas:</p>
              <div className="flex flex-wrap gap-2">
                {mensaje.acciones.map(accion => (
                  <button
                    key={accion.id}
                    onClick={() => handleSend(accion.comando)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      accion.tipo === 'accion'
                        ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300'
                        : accion.tipo === 'navegacion'
                        ? 'bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300'
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
            {new Date(mensaje.timestamp).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
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
                <span className={`w-2 h-2 rounded-full ${mlActivo ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                ML {mlActivo ? 'Activo' : 'Inactivo'}
              </span>
              <span>•</span>
              <span>Claude AI + Sistema ML</span>
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
            title="Limpiar conversación"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Categorías de consulta */}
      {mostrarSugerencias && (
        <div className="px-4 py-3 bg-indigo-50 dark:bg-indigo-900/20 border-b border-indigo-100 dark:border-indigo-800">
          <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-2">CONSULTAS RÁPIDAS:</p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIAS_CONSULTA.map(cat => (
              <button
                key={cat.id}
                onClick={() => {
                  setCategoriaSeleccionada(cat.id === categoriaSeleccionada ? null : cat.id);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  categoriaSeleccionada === cat.id
                    ? `bg-gradient-to-r ${cat.color} text-white shadow-lg`
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <span>{cat.icono}</span>
                {cat.nombre}
              </button>
            ))}
          </div>

          {/* Ejemplos de la categoría seleccionada */}
          {categoriaSeleccionada && (
            <div className="mt-2 flex flex-wrap gap-2">
              {CATEGORIAS_CONSULTA.find(c => c.id === categoriaSeleccionada)?.ejemplos.map((ejemplo, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(ejemplo)}
                  className="px-3 py-1.5 bg-white dark:bg-gray-800 rounded-lg text-xs text-gray-600 dark:text-gray-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                >
                  "{ejemplo}"
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Messages Area */}
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

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMostrarSugerencias(!mostrarSugerencias)}
            className="p-2 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
          >
            {mostrarSugerencias ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>

          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Escribe tu pregunta o selecciona una consulta rápida..."
            disabled={isLoading}
            className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 transition-all"
          />

          <button
            onClick={() => handleSend()}
            disabled={!inputValue.trim() || isLoading}
            className="p-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-center text-gray-400 mt-2">
          Powered by Claude AI + Machine Learning • Presiona Enter para enviar
        </p>
      </div>
    </div>
  );
};

export default AsistenteIAAvanzado;
