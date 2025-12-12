// components/intelligence/DashboardManana.tsx
// Dashboard de Mañana - Predicción inteligente del día logístico
import React, { useMemo, useState } from 'react';
import {
  Sun,
  Cloud,
  CloudRain,
  Calendar,
  Clock,
  Package,
  Truck,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Target,
  Phone,
  MessageSquare,
  Shield,
  Zap,
  Brain,
  ChevronRight,
  ChevronDown,
  Building2,
  MapPin,
  Timer,
  Star,
  Award,
  Coffee,
  Sunrise,
  Bell,
  Activity,
  BarChart3,
  Users,
  DollarSign,
  RefreshCw,
  Eye,
  ArrowRight,
  Sparkles,
  Flag,
} from 'lucide-react';

// ============================================
// TIPOS E INTERFACES
// ============================================

interface GuiaLogistica {
  numeroGuia: string;
  transportadora: string;
  estadoActual: string;
  ciudadDestino: string;
  ciudadOrigen?: string;
  diasTranscurridos: number;
  tieneNovedad: boolean;
  telefono?: string;
  ultimos2Estados: { fecha: string; ubicacion: string; descripcion: string }[];
  historialCompleto?: { fecha: string; ubicacion: string; descripcion: string }[];
  valorDeclarado?: number;
}

interface PrediccionDia {
  entregasEsperadas: number;
  posiblesNovedades: number;
  guiasCriticas: number;
  probabilidadExito: number;
  horasPico: string[];
  recomendaciones: Recomendacion[];
  alertasUrgentes: AlertaUrgente[];
  metaDelDia: MetaDia;
}

interface Recomendacion {
  id: string;
  tipo: 'accion' | 'insight' | 'warning' | 'tip';
  prioridad: 'alta' | 'media' | 'baja';
  titulo: string;
  descripcion: string;
  impacto: string;
  accion?: () => void;
  icono: React.ReactNode;
}

interface AlertaUrgente {
  id: string;
  tipo: 'critica' | 'oficina' | 'estancada' | 'vencimiento';
  cantidad: number;
  mensaje: string;
  guias: string[];
}

interface MetaDia {
  entregas: number;
  rescates: number;
  llamadas: number;
  mensajes: number;
}

interface TimelineEvent {
  hora: string;
  tipo: 'entrega' | 'novedad' | 'llamada' | 'revision';
  titulo: string;
  descripcion: string;
  prioridad: 'alta' | 'media' | 'baja';
  completado?: boolean;
}

interface DashboardMananaProps {
  guias: GuiaLogistica[];
  sesionesGuardadas?: any[];
  onOpenRescue?: () => void;
  onOpenComparison?: () => void;
  onFilterGuias?: (filter: any) => void;
  onWhatsAppMasivo?: (guias: GuiaLogistica[]) => void;
}

// ============================================
// UTILIDADES
// ============================================

const getFechaHoy = () => {
  const hoy = new Date();
  const opciones: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  return hoy.toLocaleDateString('es-CO', opciones);
};

const getHoraActual = () => {
  return new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
};

const getSaludo = () => {
  const hora = new Date().getHours();
  if (hora < 12) return { texto: 'Buenos días', emoji: '☀️', icono: <Sunrise className="w-5 h-5" /> };
  if (hora < 18) return { texto: 'Buenas tardes', emoji: '🌤️', icono: <Sun className="w-5 h-5" /> };
  return { texto: 'Buenas noches', emoji: '🌙', icono: <Cloud className="w-5 h-5" /> };
};

const esDiaFestivo = () => {
  const hoy = new Date();
  const dia = hoy.getDay();
  // Domingos
  if (dia === 0) return { esFestivo: true, mensaje: 'Domingo - Operaciones reducidas' };
  // Sábados
  if (dia === 6) return { esFestivo: false, mensaje: 'Sábado - Media jornada' };
  return { esFestivo: false, mensaje: null };
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

const DashboardManana: React.FC<DashboardMananaProps> = ({
  guias,
  sesionesGuardadas = [],
  onOpenRescue,
  onOpenComparison,
  onFilterGuias,
  onWhatsAppMasivo,
}) => {
  const [expandedSection, setExpandedSection] = useState<string | null>('prediccion');
  const [showAllRecommendations, setShowAllRecommendations] = useState(false);

  // ============================================
  // CÁLCULOS Y PREDICCIONES
  // ============================================

  const prediccion = useMemo((): PrediccionDia => {
    if (guias.length === 0) {
      return {
        entregasEsperadas: 0,
        posiblesNovedades: 0,
        guiasCriticas: 0,
        probabilidadExito: 0,
        horasPico: [],
        recomendaciones: [],
        alertasUrgentes: [],
        metaDelDia: { entregas: 0, rescates: 0, llamadas: 0, mensajes: 0 },
      };
    }

    // Clasificar guías
    const enReparto = guias.filter(g =>
      g.estadoActual?.toLowerCase().includes('reparto') ||
      g.estadoActual?.toLowerCase().includes('distribución') ||
      g.estadoActual?.toLowerCase().includes('ruta')
    );

    const enOficina = guias.filter(g =>
      g.estadoActual?.toLowerCase().includes('oficina') ||
      g.estadoActual?.toLowerCase().includes('reclam')
    );

    const conNovedad = guias.filter(g => g.tieneNovedad);

    const criticas = guias.filter(g =>
      g.diasTranscurridos >= 5 &&
      !g.estadoActual?.toLowerCase().includes('entregado')
    );

    const estancadas = guias.filter(g =>
      g.diasTranscurridos >= 3 &&
      g.diasTranscurridos < 5 &&
      !g.estadoActual?.toLowerCase().includes('entregado')
    );

    const sinMovimiento24h = guias.filter(g => {
      if (!g.ultimos2Estados || g.ultimos2Estados.length < 2) return false;
      const ultimoEvento = new Date(g.ultimos2Estados[0]?.fecha);
      const ahora = new Date();
      const diff = (ahora.getTime() - ultimoEvento.getTime()) / (1000 * 60 * 60);
      return diff > 24;
    });

    // Calcular entregas esperadas (guías en reparto + % de las que están en tránsito)
    const enTransito = guias.filter(g =>
      g.estadoActual?.toLowerCase().includes('tránsito') ||
      g.estadoActual?.toLowerCase().includes('viaj')
    );
    const entregasEsperadas = enReparto.length + Math.floor(enTransito.length * 0.3);

    // Probabilidad de éxito
    const tasaActual = guias.length > 0
      ? ((guias.length - conNovedad.length) / guias.length) * 100
      : 100;
    const probabilidadExito = Math.min(95, Math.max(50, tasaActual - criticas.length));

    // Recomendaciones
    const recomendaciones: Recomendacion[] = [];

    if (criticas.length > 0) {
      recomendaciones.push({
        id: 'criticas',
        tipo: 'warning',
        prioridad: 'alta',
        titulo: `${criticas.length} guías críticas requieren acción`,
        descripcion: `Guías con más de 5 días sin entregar. Riesgo alto de devolución.`,
        impacto: `Puedes salvar hasta $${(criticas.length * 15000).toLocaleString()} en devoluciones`,
        icono: <AlertTriangle className="w-5 h-5 text-red-500" />,
        accion: () => onFilterGuias?.({ diasMin: 5 }),
      });
    }

    if (enOficina.length > 0) {
      recomendaciones.push({
        id: 'oficina',
        tipo: 'accion',
        prioridad: 'alta',
        titulo: `${enOficina.length} guías en reclamo en oficina`,
        descripcion: `Clientes esperando en oficina. Gestión urgente antes de devolución.`,
        impacto: `90% de probabilidad de rescate si contactas hoy`,
        icono: <Building2 className="w-5 h-5 text-amber-500" />,
        accion: () => onFilterGuias?.({ estado: 'oficina' }),
      });
    }

    if (sinMovimiento24h.length > 5) {
      recomendaciones.push({
        id: 'sin-movimiento',
        tipo: 'insight',
        prioridad: 'media',
        titulo: `${sinMovimiento24h.length} guías sin movimiento +24h`,
        descripcion: `Estas guías podrían tener problemas. Revisa con transportadora.`,
        impacto: `Prevenir ${Math.floor(sinMovimiento24h.length * 0.3)} posibles novedades`,
        icono: <Timer className="w-5 h-5 text-orange-500" />,
      });
    }

    if (conNovedad.length > 0 && conNovedad.filter(g => g.telefono).length > 0) {
      const conTelefono = conNovedad.filter(g => g.telefono);
      recomendaciones.push({
        id: 'whatsapp-masivo',
        tipo: 'accion',
        prioridad: 'media',
        titulo: `WhatsApp masivo: ${conTelefono.length} clientes con novedad`,
        descripcion: `Contacta todos los clientes con novedad de una vez.`,
        impacto: `Ahorra 2+ horas de gestión manual`,
        icono: <MessageSquare className="w-5 h-5 text-emerald-500" />,
        accion: () => onWhatsAppMasivo?.(conTelefono),
      });
    }

    if (sesionesGuardadas.length >= 2) {
      recomendaciones.push({
        id: 'comparar',
        tipo: 'tip',
        prioridad: 'baja',
        titulo: `Compara con sesión anterior`,
        descripcion: `Detecta guías estancadas comparando con ayer.`,
        impacto: `Identifica problemas ocultos`,
        icono: <Activity className="w-5 h-5 text-indigo-500" />,
        accion: onOpenComparison,
      });
    }

    // Tip del día
    const hora = new Date().getHours();
    if (hora < 10) {
      recomendaciones.push({
        id: 'tip-manana',
        tipo: 'tip',
        prioridad: 'baja',
        titulo: `Mejor momento para llamadas`,
        descripcion: `Las llamadas antes de las 10am tienen 40% más de contacto exitoso.`,
        impacto: `Aprovecha las primeras horas`,
        icono: <Coffee className="w-5 h-5 text-amber-600" />,
      });
    }

    // Alertas urgentes
    const alertasUrgentes: AlertaUrgente[] = [];

    if (criticas.length > 0) {
      alertasUrgentes.push({
        id: 'alert-criticas',
        tipo: 'critica',
        cantidad: criticas.length,
        mensaje: `${criticas.length} guías a punto de devolución`,
        guias: criticas.slice(0, 5).map(g => g.numeroGuia),
      });
    }

    if (enOficina.length > 0) {
      alertasUrgentes.push({
        id: 'alert-oficina',
        tipo: 'oficina',
        cantidad: enOficina.length,
        mensaje: `${enOficina.length} esperando en oficina`,
        guias: enOficina.slice(0, 5).map(g => g.numeroGuia),
      });
    }

    // Meta del día
    const metaDelDia: MetaDia = {
      entregas: entregasEsperadas,
      rescates: Math.min(conNovedad.length, 10),
      llamadas: Math.min(criticas.length + enOficina.length, 15),
      mensajes: Math.min(conNovedad.filter(g => g.telefono).length, 20),
    };

    return {
      entregasEsperadas,
      posiblesNovedades: Math.floor(entregasEsperadas * 0.15),
      guiasCriticas: criticas.length,
      probabilidadExito,
      horasPico: ['9:00-11:00', '14:00-16:00'],
      recomendaciones,
      alertasUrgentes,
      metaDelDia,
    };
  }, [guias, sesionesGuardadas, onFilterGuias, onOpenComparison, onWhatsAppMasivo]);

  // Timeline del día
  const timeline = useMemo((): TimelineEvent[] => {
    const eventos: TimelineEvent[] = [];
    const hora = new Date().getHours();

    if (hora < 9) {
      eventos.push({
        hora: '08:00',
        tipo: 'revision',
        titulo: 'Revisión matutina',
        descripcion: 'Cargar datos frescos y revisar novedades de la noche',
        prioridad: 'alta',
        completado: hora >= 8,
      });
    }

    if (prediccion.alertasUrgentes.length > 0) {
      eventos.push({
        hora: '09:00',
        tipo: 'llamada',
        titulo: 'Gestión de críticos',
        descripcion: `Llamar ${prediccion.metaDelDia.llamadas} clientes prioritarios`,
        prioridad: 'alta',
        completado: hora >= 11,
      });
    }

    eventos.push({
      hora: '10:00',
      tipo: 'entrega',
      titulo: 'Pico de entregas AM',
      descripcion: `Se esperan ~${Math.floor(prediccion.entregasEsperadas * 0.4)} entregas`,
      prioridad: 'media',
      completado: hora >= 12,
    });

    if (prediccion.metaDelDia.mensajes > 0) {
      eventos.push({
        hora: '11:00',
        tipo: 'llamada',
        titulo: 'WhatsApp masivo',
        descripcion: `Enviar mensajes a ${prediccion.metaDelDia.mensajes} clientes`,
        prioridad: 'media',
        completado: false,
      });
    }

    eventos.push({
      hora: '14:00',
      tipo: 'revision',
      titulo: 'Revisión de medio día',
      descripcion: 'Comparar con sesión de la mañana, detectar estancados',
      prioridad: 'media',
      completado: hora >= 14,
    });

    eventos.push({
      hora: '15:00',
      tipo: 'entrega',
      titulo: 'Pico de entregas PM',
      descripcion: `Se esperan ~${Math.floor(prediccion.entregasEsperadas * 0.4)} entregas`,
      prioridad: 'media',
      completado: hora >= 17,
    });

    if (prediccion.guiasCriticas > 5) {
      eventos.push({
        hora: '16:00',
        tipo: 'novedad',
        titulo: 'Segunda ronda de rescate',
        descripcion: 'Reintentar contacto con no contestados',
        prioridad: 'alta',
        completado: false,
      });
    }

    eventos.push({
      hora: '18:00',
      tipo: 'revision',
      titulo: 'Cierre del día',
      descripcion: 'Guardar sesión, revisar métricas finales',
      prioridad: 'baja',
      completado: hora >= 18,
    });

    return eventos;
  }, [prediccion]);

  // Estadísticas rápidas
  const stats = useMemo(() => {
    const total = guias.length;
    const entregadas = guias.filter(g =>
      g.estadoActual?.toLowerCase().includes('entregado')
    ).length;
    const conNovedad = guias.filter(g => g.tieneNovedad).length;
    const conTelefono = guias.filter(g => g.telefono).length;

    return {
      total,
      entregadas,
      conNovedad,
      conTelefono,
      tasaEntrega: total > 0 ? (entregadas / total) * 100 : 0,
      coberturaTelefono: total > 0 ? (conTelefono / total) * 100 : 0,
    };
  }, [guias]);

  const saludo = getSaludo();
  const festivo = esDiaFestivo();

  // ============================================
  // RENDERIZADO
  // ============================================

  if (guias.length === 0) {
    return (
      <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-navy-900 dark:to-navy-800 rounded-2xl p-8 text-center">
        <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center">
          <Sunrise className="w-10 h-10 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
          {saludo.emoji} {saludo.texto}
        </h3>
        <p className="text-slate-500 dark:text-slate-400 mb-4">
          Carga datos para ver las predicciones del día
        </p>
        <p className="text-sm text-slate-400">{getFechaHoy()}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ============================================ */}
      {/* HEADER CON SALUDO Y FECHA */}
      {/* ============================================ */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-6 text-white relative overflow-hidden">
        {/* Decoraciones de fondo */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white/20 rounded-xl">
                  {saludo.icono}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{saludo.emoji} {saludo.texto}</h2>
                  <p className="text-white/80 text-sm">{getFechaHoy()}</p>
                </div>
              </div>
              {festivo.mensaje && (
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-sm mt-2">
                  <Calendar className="w-4 h-4" />
                  {festivo.mensaje}
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="text-center px-4 py-2 bg-white/20 rounded-xl">
                <p className="text-3xl font-bold">{prediccion.entregasEsperadas}</p>
                <p className="text-xs text-white/80">Entregas esperadas</p>
              </div>
              <div className="text-center px-4 py-2 bg-white/20 rounded-xl">
                <p className="text-3xl font-bold">{prediccion.probabilidadExito.toFixed(0)}%</p>
                <p className="text-xs text-white/80">Prob. éxito</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* ALERTAS URGENTES */}
      {/* ============================================ */}
      {prediccion.alertasUrgentes.length > 0 && (
        <div className="space-y-3">
          {prediccion.alertasUrgentes.map((alerta) => (
            <div
              key={alerta.id}
              className={`
                flex items-center justify-between p-4 rounded-xl border-l-4
                ${alerta.tipo === 'critica'
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-500'
                  : 'bg-amber-50 dark:bg-amber-900/20 border-amber-500'
                }
              `}
            >
              <div className="flex items-center gap-3">
                <div className={`
                  p-2 rounded-lg
                  ${alerta.tipo === 'critica' ? 'bg-red-100 dark:bg-red-900/40' : 'bg-amber-100 dark:bg-amber-900/40'}
                `}>
                  {alerta.tipo === 'critica' ? (
                    <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  ) : (
                    <Building2 className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  )}
                </div>
                <div>
                  <p className={`font-bold ${alerta.tipo === 'critica' ? 'text-red-700 dark:text-red-300' : 'text-amber-700 dark:text-amber-300'}`}>
                    {alerta.mensaje}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {alerta.guias.slice(0, 3).join(', ')}{alerta.guias.length > 3 ? '...' : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onFilterGuias?.(alerta.tipo === 'critica' ? { diasMin: 5 } : { estado: 'oficina' })}
                className={`
                  px-4 py-2 rounded-lg font-medium text-sm transition-colors
                  ${alerta.tipo === 'critica'
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-amber-600 hover:bg-amber-700 text-white'
                  }
                `}
              >
                Gestionar
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ============================================ */}
      {/* GRID PRINCIPAL */}
      {/* ============================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COLUMNA IZQUIERDA - Métricas y Meta */}
        <div className="space-y-6">
          {/* Meta del día */}
          <div className="bg-white dark:bg-navy-900 rounded-2xl p-5 border border-slate-200 dark:border-navy-700">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-indigo-500" />
              <h3 className="font-bold text-slate-800 dark:text-white">Meta del Día</h3>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Entregas', value: prediccion.metaDelDia.entregas, icon: <Package className="w-4 h-4" />, color: 'emerald' },
                { label: 'Rescates', value: prediccion.metaDelDia.rescates, icon: <Shield className="w-4 h-4" />, color: 'purple' },
                { label: 'Llamadas', value: prediccion.metaDelDia.llamadas, icon: <Phone className="w-4 h-4" />, color: 'blue' },
                { label: 'Mensajes', value: prediccion.metaDelDia.mensajes, icon: <MessageSquare className="w-4 h-4" />, color: 'amber' },
              ].map((meta) => (
                <div key={meta.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg bg-${meta.color}-100 dark:bg-${meta.color}-900/30 text-${meta.color}-600 dark:text-${meta.color}-400`}>
                      {meta.icon}
                    </div>
                    <span className="text-sm text-slate-600 dark:text-slate-400">{meta.label}</span>
                  </div>
                  <span className="font-bold text-slate-800 dark:text-white">{meta.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Estadísticas rápidas */}
          <div className="bg-white dark:bg-navy-900 rounded-2xl p-5 border border-slate-200 dark:border-navy-700">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-cyan-500" />
              <h3 className="font-bold text-slate-800 dark:text-white">Resumen Actual</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-navy-800 rounded-xl text-center">
                <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.total}</p>
                <p className="text-xs text-slate-500">Total guías</p>
              </div>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-center">
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.tasaEntrega.toFixed(0)}%</p>
                <p className="text-xs text-slate-500">Tasa entrega</p>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-center">
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.conNovedad}</p>
                <p className="text-xs text-slate-500">Con novedad</p>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-center">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.coberturaTelefono.toFixed(0)}%</p>
                <p className="text-xs text-slate-500">Con teléfono</p>
              </div>
            </div>
          </div>

          {/* Horas pico */}
          <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl p-5 text-white">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5" />
              <h3 className="font-bold">Horas Pico</h3>
            </div>
            <div className="space-y-2">
              {prediccion.horasPico.map((hora, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 bg-white/20 rounded-lg">
                  <Zap className="w-4 h-4" />
                  <span className="font-medium">{hora}</span>
                  <span className="text-xs text-white/70">- Mayor actividad</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* COLUMNA CENTRAL - Timeline */}
        <div className="bg-white dark:bg-navy-900 rounded-2xl p-5 border border-slate-200 dark:border-navy-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-500" />
              <h3 className="font-bold text-slate-800 dark:text-white">Timeline del Día</h3>
            </div>
            <span className="text-sm text-slate-500">{getHoraActual()}</span>
          </div>

          <div className="space-y-4">
            {timeline.map((evento, idx) => (
              <div key={idx} className="relative flex gap-4">
                {/* Línea conectora */}
                {idx < timeline.length - 1 && (
                  <div className="absolute left-[18px] top-10 w-0.5 h-full bg-slate-200 dark:bg-navy-700" />
                )}

                {/* Indicador */}
                <div className={`
                  relative z-10 w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0
                  ${evento.completado
                    ? 'bg-emerald-100 dark:bg-emerald-900/30'
                    : evento.prioridad === 'alta'
                      ? 'bg-red-100 dark:bg-red-900/30'
                      : 'bg-slate-100 dark:bg-navy-800'
                  }
                `}>
                  {evento.completado ? (
                    <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  ) : evento.tipo === 'entrega' ? (
                    <Package className="w-4 h-4 text-blue-500" />
                  ) : evento.tipo === 'llamada' ? (
                    <Phone className="w-4 h-4 text-amber-500" />
                  ) : evento.tipo === 'novedad' ? (
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                  ) : (
                    <Eye className="w-4 h-4 text-purple-500" />
                  )}
                </div>

                {/* Contenido */}
                <div className={`flex-1 pb-4 ${evento.completado ? 'opacity-60' : ''}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-400">{evento.hora}</span>
                    {evento.prioridad === 'alta' && !evento.completado && (
                      <span className="px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px] rounded-full font-bold">
                        PRIORITARIO
                      </span>
                    )}
                  </div>
                  <h4 className={`font-medium text-sm ${evento.completado ? 'line-through text-slate-400' : 'text-slate-800 dark:text-white'}`}>
                    {evento.titulo}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {evento.descripcion}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* COLUMNA DERECHA - Recomendaciones */}
        <div className="bg-white dark:bg-navy-900 rounded-2xl p-5 border border-slate-200 dark:border-navy-700">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-5 h-5 text-pink-500" />
            <h3 className="font-bold text-slate-800 dark:text-white">Recomendaciones IA</h3>
          </div>

          <div className="space-y-3">
            {prediccion.recomendaciones
              .slice(0, showAllRecommendations ? undefined : 4)
              .map((rec) => (
                <div
                  key={rec.id}
                  className={`
                    p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md
                    ${rec.prioridad === 'alta'
                      ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10'
                      : rec.prioridad === 'media'
                        ? 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10'
                        : 'border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800'
                    }
                  `}
                  onClick={rec.accion}
                >
                  <div className="flex items-start gap-3">
                    <div className={`
                      p-2 rounded-lg flex-shrink-0
                      ${rec.prioridad === 'alta'
                        ? 'bg-red-100 dark:bg-red-900/30'
                        : rec.prioridad === 'media'
                          ? 'bg-amber-100 dark:bg-amber-900/30'
                          : 'bg-slate-100 dark:bg-navy-700'
                      }
                    `}>
                      {rec.icono}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm text-slate-800 dark:text-white">
                        {rec.titulo}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {rec.descripcion}
                      </p>
                      <div className="flex items-center gap-1 mt-2 text-xs text-emerald-600 dark:text-emerald-400">
                        <Sparkles className="w-3 h-3" />
                        {rec.impacto}
                      </div>
                    </div>
                    {rec.accion && (
                      <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
                    )}
                  </div>
                </div>
              ))}

            {prediccion.recomendaciones.length > 4 && (
              <button
                onClick={() => setShowAllRecommendations(!showAllRecommendations)}
                className="w-full py-2 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium flex items-center justify-center gap-1"
              >
                {showAllRecommendations ? 'Ver menos' : `Ver ${prediccion.recomendaciones.length - 4} más`}
                <ChevronDown className={`w-4 h-4 transition-transform ${showAllRecommendations ? 'rotate-180' : ''}`} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* ACCIONES RÁPIDAS */}
      {/* ============================================ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={onOpenRescue}
          className="flex items-center gap-3 p-4 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl text-white hover:shadow-lg transition-all group"
        >
          <Shield className="w-6 h-6" />
          <div className="text-left">
            <p className="font-bold">Cola de Rescate</p>
            <p className="text-xs text-white/80">{stats.conNovedad} guías pendientes</p>
          </div>
          <ArrowRight className="w-5 h-5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>

        <button
          onClick={onOpenComparison}
          className="flex items-center gap-3 p-4 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl text-white hover:shadow-lg transition-all group"
        >
          <Activity className="w-6 h-6" />
          <div className="text-left">
            <p className="font-bold">Comparar Sesiones</p>
            <p className="text-xs text-white/80">{sesionesGuardadas.length} guardadas</p>
          </div>
          <ArrowRight className="w-5 h-5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>

        <button
          onClick={() => onWhatsAppMasivo?.(guias.filter(g => g.tieneNovedad && g.telefono))}
          className="flex items-center gap-3 p-4 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl text-white hover:shadow-lg transition-all group"
        >
          <MessageSquare className="w-6 h-6" />
          <div className="text-left">
            <p className="font-bold">WhatsApp Masivo</p>
            <p className="text-xs text-white/80">{guias.filter(g => g.tieneNovedad && g.telefono).length} contactables</p>
          </div>
          <ArrowRight className="w-5 h-5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>

        <button
          onClick={() => onFilterGuias?.({ diasMin: 5 })}
          className="flex items-center gap-3 p-4 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl text-white hover:shadow-lg transition-all group"
        >
          <AlertTriangle className="w-6 h-6" />
          <div className="text-left">
            <p className="font-bold">Ver Críticas</p>
            <p className="text-xs text-white/80">{prediccion.guiasCriticas} urgentes</p>
          </div>
          <ArrowRight className="w-5 h-5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      </div>
    </div>
  );
};

export default DashboardManana;
