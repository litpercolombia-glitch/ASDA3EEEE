// components/ProAssistant/QuickTextsPanel.tsx
// Panel de Textos Rápidos con Subflujos para reducir devolución del 15% al 8%
import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  AlertCircle,
  Phone,
  ShieldAlert,
  Building2,
  BarChart3,
  Clock,
  Truck,
  TrendingUp,
  Brain,
  Zap,
  X,
  ChevronDown,
  MessageSquare,
  FileSpreadsheet,
  PhoneCall,
  MapPin,
  AlertTriangle,
  Ban,
  ArrowRight,
  Users,
  Bell,
  Calendar,
  Download,
  Target,
  Sparkles,
  Copy,
  CheckCircle,
} from 'lucide-react';
import { Shipment, ShipmentStatus, ShipmentRiskLevel, CarrierName } from '../../types';

// ============================================
// INTERFACES Y TIPOS
// ============================================

interface QuickTextOption {
  id: string;
  label: string;
  count?: number;
  impact?: string;
  recoveryRate?: number;
  icon?: React.ReactNode;
  action: () => void;
  colorClass?: string;
}

interface QuickTextChip {
  id: string;
  label: string;
  icon: React.ReactNode;
  colorClass: string;
  bgClass: string;
  options: QuickTextOption[];
}

interface QuickTextsPanelProps {
  shipments: Shipment[];
  onAction: (actionType: string, data?: any) => void;
  onFilterGuides: (filter: string, guides: Shipment[]) => void;
}

// ============================================
// FUNCIONES DE CÁLCULO
// ============================================

const calculateImpact = (guideCount: number, totalGuides: number, recoveryRate: number = 0.8): string => {
  if (totalGuides === 0) return '0%';
  const impact = (guideCount * recoveryRate) / totalGuides * 100;
  return `-${impact.toFixed(1)}%`;
};

const getDaysSinceLastMovement = (shipment: Shipment): number => {
  if (!shipment.detailedInfo?.events?.[0]?.date) return 0;
  const lastDate = new Date(shipment.detailedInfo.events[0].date);
  const now = new Date();
  return Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

const QuickTextsPanel: React.FC<QuickTextsPanelProps> = ({
  shipments,
  onAction,
  onFilterGuides,
}) => {
  const [activeChipId, setActiveChipId] = useState<string | null>(null);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setActiveChipId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Calcular métricas en tiempo real
  const metrics = useMemo(() => {
    const total = shipments.length;

    // Guías por estado de novedad
    const withNovelty = shipments.filter(s =>
      s.status === ShipmentStatus.ISSUE ||
      (s.detailedInfo?.rawStatus && !s.detailedInfo.rawStatus.includes('ENTREG'))
    );

    // Reclamo en Oficina
    const reclamoOficina = shipments.filter(s =>
      s.status === ShipmentStatus.IN_OFFICE ||
      s.detailedInfo?.rawStatus?.toUpperCase().includes('RECLAM') ||
      s.detailedInfo?.rawStatus?.toUpperCase().includes('OFICINA') ||
      s.detailedInfo?.rawStatus?.toUpperCase().includes('RETIRAR')
    );

    // Sin movimiento por días
    const sinMovimiento5d = shipments.filter(s => {
      const days = getDaysSinceLastMovement(s);
      return days >= 5 && s.status !== ShipmentStatus.DELIVERED;
    });

    const sinMovimiento3d = shipments.filter(s => {
      const days = getDaysSinceLastMovement(s);
      return days >= 3 && days < 5 && s.status !== ShipmentStatus.DELIVERED;
    });

    // Por tipo de novedad
    const noEstaba = shipments.filter(s => {
      const raw = s.detailedInfo?.rawStatus?.toUpperCase() || '';
      return raw.includes('NO ESTABA') || raw.includes('NADIE') || raw.includes('NO SE LOGRA');
    });

    const direccionErrada = shipments.filter(s => {
      const raw = s.detailedInfo?.rawStatus?.toUpperCase() || '';
      return raw.includes('DIRECCI') || raw.includes('NO EXISTE') || raw.includes('NOMENCLATURA');
    });

    const rechazado = shipments.filter(s => {
      const raw = s.detailedInfo?.rawStatus?.toUpperCase() || '';
      return raw.includes('RECHAZ') || raw.includes('REHUS') || raw.includes('NO RECIBE');
    });

    const noCancelaValor = shipments.filter(s => {
      const raw = s.detailedInfo?.rawStatus?.toUpperCase() || '';
      return raw.includes('NO CANCEL') || raw.includes('NO PAGA') || raw.includes('VALOR');
    });

    const desconocePedido = shipments.filter(s => {
      const raw = s.detailedInfo?.rawStatus?.toUpperCase() || '';
      return raw.includes('DESCONOCE') || raw.includes('NO PIDIO');
    });

    // Por tiempo de novedad
    const novedades24h = withNovelty.filter(s => getDaysSinceLastMovement(s) < 1);
    const novedades24_48h = withNovelty.filter(s => {
      const days = getDaysSinceLastMovement(s);
      return days >= 1 && days < 2;
    });
    const novedades48_72h = withNovelty.filter(s => {
      const days = getDaysSinceLastMovement(s);
      return days >= 2 && days < 3;
    });
    const novedades72h = withNovelty.filter(s => getDaysSinceLastMovement(s) >= 3);

    // Por transportadora
    const byCarrier: Record<string, Shipment[]> = {};
    shipments.forEach(s => {
      const carrier = s.carrier || CarrierName.UNKNOWN;
      if (!byCarrier[carrier]) byCarrier[carrier] = [];
      byCarrier[carrier].push(s);
    });

    // Transportadora con más devoluciones
    const carrierReturns: Record<string, number> = {};
    withNovelty.forEach(s => {
      const carrier = s.carrier || CarrierName.UNKNOWN;
      carrierReturns[carrier] = (carrierReturns[carrier] || 0) + 1;
    });
    const worstCarrier = Object.entries(carrierReturns)
      .sort((a, b) => b[1] - a[1])[0];

    // Ciudades con problemas
    const cityProblems: Record<string, number> = {};
    withNovelty.forEach(s => {
      const city = s.detailedInfo?.destination || 'Desconocida';
      cityProblems[city] = (cityProblems[city] || 0) + 1;
    });
    const topProblemCities = Object.entries(cityProblems)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // En reparto hoy
    const enReparto = shipments.filter(s =>
      s.status === ShipmentStatus.IN_TRANSIT ||
      s.detailedInfo?.rawStatus?.toUpperCase().includes('REPARTO')
    );

    // Guías con alto valor (COD)
    const altoValor = shipments.filter(s =>
      s.detailedInfo?.declaredValue && s.detailedInfo.declaredValue > 100000
    );

    // Entregados
    const entregados = shipments.filter(s => s.status === ShipmentStatus.DELIVERED);
    const tasaDevolucion = total > 0 ? ((total - entregados.length) / total * 100) : 0;

    // Recuperables (todas las novedades activas)
    const recuperables = [...new Set([
      ...reclamoOficina,
      ...noEstaba,
      ...direccionErrada,
      ...noCancelaValor,
    ])];

    return {
      total,
      withNovelty,
      reclamoOficina,
      sinMovimiento5d,
      sinMovimiento3d,
      noEstaba,
      direccionErrada,
      rechazado,
      noCancelaValor,
      desconocePedido,
      novedades24h,
      novedades24_48h,
      novedades48_72h,
      novedades72h,
      byCarrier,
      worstCarrier,
      topProblemCities,
      enReparto,
      altoValor,
      entregados,
      tasaDevolucion,
      recuperables,
    };
  }, [shipments]);

  // Copiar teléfono
  const copyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedPhone(phone);
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  // ============================================
  // DEFINICIÓN DE CHIPS Y SUBFLUJOS
  // ============================================

  const quickTextChips: QuickTextChip[] = useMemo(() => [
    // 1. CRÍTICOS HOY
    {
      id: 'criticos',
      label: '🔴 CRÍTICOS HOY',
      icon: <AlertCircle className="w-4 h-4" />,
      colorClass: 'text-red-400',
      bgClass: 'bg-red-500/20 border-red-500/30 hover:bg-red-500/30',
      options: [
        {
          id: 'reclamo-oficina-3d',
          label: `Reclamo en Oficina +3 días`,
          count: metrics.reclamoOficina.filter(s => getDaysSinceLastMovement(s) >= 3).length,
          impact: calculateImpact(
            metrics.reclamoOficina.filter(s => getDaysSinceLastMovement(s) >= 3).length,
            metrics.total, 0.7
          ),
          recoveryRate: 70,
          icon: <Building2 className="w-4 h-4 text-red-400" />,
          action: () => onFilterGuides('reclamo-oficina-3d', metrics.reclamoOficina.filter(s => getDaysSinceLastMovement(s) >= 3)),
        },
        {
          id: 'sin-movimiento-5d',
          label: `Sin movimiento +5 días`,
          count: metrics.sinMovimiento5d.length,
          impact: calculateImpact(metrics.sinMovimiento5d.length, metrics.total, 0.5),
          recoveryRate: 50,
          icon: <Clock className="w-4 h-4 text-red-400" />,
          action: () => onFilterGuides('sin-movimiento-5d', metrics.sinMovimiento5d),
        },
        {
          id: 'no-estaba-sin-gestion',
          label: `Novedad "No estaba" sin gestión`,
          count: metrics.noEstaba.length,
          impact: calculateImpact(metrics.noEstaba.length, metrics.total, 0.8),
          recoveryRate: 80,
          icon: <Users className="w-4 h-4 text-orange-400" />,
          action: () => onFilterGuides('no-estaba', metrics.noEstaba),
        },
        {
          id: 'rechazado-recuperables',
          label: `Novedad "Rechazado" recuperables`,
          count: metrics.rechazado.length,
          impact: calculateImpact(metrics.rechazado.length, metrics.total, 0.5),
          recoveryRate: 50,
          icon: <Ban className="w-4 h-4 text-red-400" />,
          action: () => onFilterGuides('rechazado', metrics.rechazado),
        },
        {
          id: 'llamar-todos-criticos',
          label: `Programar llamadas a todos`,
          count: metrics.recuperables.length,
          icon: <PhoneCall className="w-4 h-4 text-green-400" />,
          action: () => onAction('schedule-calls', { guides: metrics.recuperables, type: 'criticos' }),
          colorClass: 'text-green-400',
        },
      ],
    },

    // 2. RESCATAR GUÍAS
    {
      id: 'rescatar',
      label: '📞 RESCATAR GUÍAS',
      icon: <Phone className="w-4 h-4" />,
      colorClass: 'text-green-400',
      bgClass: 'bg-green-500/20 border-green-500/30 hover:bg-green-500/30',
      options: [
        {
          id: 'llamar-reclamo-oficina',
          label: `Llamar "Reclamo en Oficina"`,
          count: metrics.reclamoOficina.length,
          impact: calculateImpact(metrics.reclamoOficina.length, metrics.total, 0.7),
          icon: <Building2 className="w-4 h-4 text-orange-400" />,
          action: () => onAction('call-guides', { guides: metrics.reclamoOficina, reason: 'reclamo-oficina' }),
        },
        {
          id: 'llamar-no-estaba',
          label: `Llamar "No estaba"`,
          count: metrics.noEstaba.length,
          impact: calculateImpact(metrics.noEstaba.length, metrics.total, 0.8),
          icon: <Users className="w-4 h-4 text-yellow-400" />,
          action: () => onAction('call-guides', { guides: metrics.noEstaba, reason: 'reagendar' }),
        },
        {
          id: 'llamar-direccion-errada',
          label: `Llamar "Dirección errada"`,
          count: metrics.direccionErrada.length,
          impact: calculateImpact(metrics.direccionErrada.length, metrics.total, 0.9),
          icon: <MapPin className="w-4 h-4 text-red-400" />,
          action: () => onAction('call-guides', { guides: metrics.direccionErrada, reason: 'corregir-direccion' }),
        },
        {
          id: 'llamar-no-cancela',
          label: `Llamar "No canceló valor"`,
          count: metrics.noCancelaValor.length,
          impact: calculateImpact(metrics.noCancelaValor.length, metrics.total, 0.7),
          icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
          action: () => onAction('call-guides', { guides: metrics.noCancelaValor, reason: 'confirmar-pago' }),
        },
        {
          id: 'whatsapp-antes-devolver',
          label: `WhatsApp antes de devolver`,
          count: metrics.recuperables.length,
          icon: <MessageSquare className="w-4 h-4 text-green-400" />,
          action: () => onAction('whatsapp-mass', { guides: metrics.recuperables }),
          colorClass: 'text-green-400',
        },
      ],
    },

    // 3. PREVENIR DEVOLUCIONES
    {
      id: 'prevenir',
      label: '🚫 PREVENIR DEVOLUCIONES',
      icon: <ShieldAlert className="w-4 h-4" />,
      colorClass: 'text-orange-400',
      bgClass: 'bg-orange-500/20 border-orange-500/30 hover:bg-orange-500/30',
      options: [
        {
          id: 'reparto-hoy',
          label: `Guías en reparto hoy`,
          count: metrics.enReparto.length,
          icon: <Truck className="w-4 h-4 text-blue-400" />,
          action: () => onAction('confirm-availability', { guides: metrics.enReparto }),
        },
        {
          id: 'cod-alto-valor',
          label: `Guías COD alto valor`,
          count: metrics.altoValor.length,
          icon: <Target className="w-4 h-4 text-amber-400" />,
          action: () => onFilterGuides('alto-valor', metrics.altoValor),
        },
        {
          id: 'destinos-problematicos',
          label: `Destinos problemáticos`,
          count: metrics.topProblemCities.reduce((acc, c) => acc + c[1], 0),
          icon: <MapPin className="w-4 h-4 text-red-400" />,
          action: () => onAction('show-problem-cities', { cities: metrics.topProblemCities }),
        },
        {
          id: 'segundo-intento',
          label: `Segundo intento pendiente`,
          count: metrics.noEstaba.length,
          icon: <ArrowRight className="w-4 h-4 text-purple-400" />,
          action: () => onFilterGuides('segundo-intento', metrics.noEstaba),
        },
      ],
    },

    // 4. CIUDADES RIESGOSAS
    {
      id: 'ciudades',
      label: '🏙️ CIUDADES RIESGOSAS',
      icon: <Building2 className="w-4 h-4" />,
      colorClass: 'text-yellow-400',
      bgClass: 'bg-yellow-500/20 border-yellow-500/30 hover:bg-yellow-500/30',
      options: [
        {
          id: 'ciudades-20-devolucion',
          label: `Ver ciudades con +20% devolución`,
          count: metrics.topProblemCities.length,
          icon: <BarChart3 className="w-4 h-4 text-yellow-400" />,
          action: () => onAction('show-risky-cities', { threshold: 20 }),
        },
        {
          id: 'bloquear-ciudad',
          label: `Bloquear ciudad temporalmente`,
          icon: <Ban className="w-4 h-4 text-red-400" />,
          action: () => onAction('block-city-modal', {}),
        },
        {
          id: 'cambiar-transportadora',
          label: `Cambiar transportadora sugerida`,
          icon: <Truck className="w-4 h-4 text-blue-400" />,
          action: () => onAction('suggest-carrier-change', {}),
        },
        {
          id: 'historial-fallos',
          label: `Ver historial de fallos por ciudad`,
          icon: <TrendingUp className="w-4 h-4 text-purple-400" />,
          action: () => onAction('city-failure-history', {}),
        },
        {
          id: 'exportar-analisis',
          label: `Exportar análisis`,
          icon: <Download className="w-4 h-4 text-emerald-400" />,
          action: () => onAction('export-city-analysis', {}),
          colorClass: 'text-emerald-400',
        },
      ],
    },

    // 5. NOVEDADES POR TIPO
    {
      id: 'novedades-tipo',
      label: '📊 NOVEDADES POR TIPO',
      icon: <BarChart3 className="w-4 h-4" />,
      colorClass: 'text-blue-400',
      bgClass: 'bg-blue-500/20 border-blue-500/30 hover:bg-blue-500/30',
      options: [
        {
          id: 'novedad-no-estaba',
          label: `"No estaba" (Recuperable 80%)`,
          count: metrics.noEstaba.length,
          recoveryRate: 80,
          icon: <Users className="w-4 h-4 text-green-400" />,
          action: () => onFilterGuides('no-estaba', metrics.noEstaba),
        },
        {
          id: 'novedad-direccion',
          label: `"Dirección errada" (Recuperable 90%)`,
          count: metrics.direccionErrada.length,
          recoveryRate: 90,
          icon: <MapPin className="w-4 h-4 text-emerald-400" />,
          action: () => onFilterGuides('direccion-errada', metrics.direccionErrada),
        },
        {
          id: 'novedad-rechazado',
          label: `"Rechazó pedido" (Recuperable 50%)`,
          count: metrics.rechazado.length,
          recoveryRate: 50,
          icon: <Ban className="w-4 h-4 text-amber-400" />,
          action: () => onFilterGuides('rechazado', metrics.rechazado),
        },
        {
          id: 'novedad-no-cancela',
          label: `"No cancela valor" (Recuperable 70%)`,
          count: metrics.noCancelaValor.length,
          recoveryRate: 70,
          icon: <AlertTriangle className="w-4 h-4 text-orange-400" />,
          action: () => onFilterGuides('no-cancela', metrics.noCancelaValor),
        },
        {
          id: 'novedad-desconoce',
          label: `"Desconoce pedido" (Verificar fraude)`,
          count: metrics.desconocePedido.length,
          icon: <AlertCircle className="w-4 h-4 text-red-400" />,
          action: () => onFilterGuides('desconoce', metrics.desconocePedido),
          colorClass: 'text-red-400',
        },
      ],
    },

    // 6. GESTIÓN POR TIEMPO
    {
      id: 'gestion-tiempo',
      label: '⏰ GESTIÓN POR TIEMPO',
      icon: <Clock className="w-4 h-4" />,
      colorClass: 'text-purple-400',
      bgClass: 'bg-purple-500/20 border-purple-500/30 hover:bg-purple-500/30',
      options: [
        {
          id: 'novedades-24h',
          label: `Novedades <24h (90% recuperable)`,
          count: metrics.novedades24h.length,
          recoveryRate: 90,
          icon: <Clock className="w-4 h-4 text-green-400" />,
          action: () => onFilterGuides('novedades-24h', metrics.novedades24h),
          colorClass: 'text-green-400',
        },
        {
          id: 'novedades-24-48h',
          label: `Novedades 24-48h (70% recuperable)`,
          count: metrics.novedades24_48h.length,
          recoveryRate: 70,
          icon: <Clock className="w-4 h-4 text-yellow-400" />,
          action: () => onFilterGuides('novedades-24-48h', metrics.novedades24_48h),
          colorClass: 'text-yellow-400',
        },
        {
          id: 'novedades-48-72h',
          label: `Novedades 48-72h (50% recuperable)`,
          count: metrics.novedades48_72h.length,
          recoveryRate: 50,
          icon: <Clock className="w-4 h-4 text-orange-400" />,
          action: () => onFilterGuides('novedades-48-72h', metrics.novedades48_72h),
          colorClass: 'text-orange-400',
        },
        {
          id: 'novedades-72h',
          label: `Novedades +72h (Última oportunidad)`,
          count: metrics.novedades72h.length,
          recoveryRate: 30,
          icon: <AlertCircle className="w-4 h-4 text-red-400" />,
          action: () => onFilterGuides('novedades-72h', metrics.novedades72h),
          colorClass: 'text-red-400',
        },
      ],
    },

    // 7. TRANSPORTADORA FALLANDO
    {
      id: 'transportadora',
      label: '🚚 TRANSPORTADORA FALLANDO',
      icon: <Truck className="w-4 h-4" />,
      colorClass: 'text-cyan-400',
      bgClass: 'bg-cyan-500/20 border-cyan-500/30 hover:bg-cyan-500/30',
      options: [
        {
          id: 'mas-devoluciones-hoy',
          label: `¿Cuál tiene más devoluciones hoy?`,
          count: metrics.worstCarrier ? metrics.worstCarrier[1] : 0,
          icon: <BarChart3 className="w-4 h-4 text-red-400" />,
          action: () => onAction('carrier-ranking', {}),
        },
        {
          id: 'comparar-tasa',
          label: `Comparar tasa por transportadora`,
          icon: <TrendingUp className="w-4 h-4 text-blue-400" />,
          action: () => onAction('carrier-comparison', {}),
        },
        {
          id: 'rutas-problematicas',
          label: `Rutas problemáticas por carrier`,
          icon: <MapPin className="w-4 h-4 text-orange-400" />,
          action: () => onAction('carrier-routes', {}),
        },
        {
          id: 'sugerir-cambio',
          label: `Sugerir cambio de transportadora`,
          icon: <ArrowRight className="w-4 h-4 text-green-400" />,
          action: () => onAction('suggest-carrier', {}),
        },
        {
          id: 'reportar-transportadora',
          label: `Reportar a transportadora`,
          icon: <FileSpreadsheet className="w-4 h-4 text-amber-400" />,
          action: () => onAction('carrier-report', {}),
        },
      ],
    },

    // 8. MI PROGRESO
    {
      id: 'progreso',
      label: '📈 MI PROGRESO',
      icon: <TrendingUp className="w-4 h-4" />,
      colorClass: 'text-emerald-400',
      bgClass: 'bg-emerald-500/20 border-emerald-500/30 hover:bg-emerald-500/30',
      options: [
        {
          id: 'tasa-hoy-meta',
          label: `Tasa devolución hoy vs meta 8%`,
          count: Math.round(metrics.tasaDevolucion),
          icon: <Target className="w-4 h-4 text-amber-400" />,
          action: () => onAction('show-rate-gauge', { current: metrics.tasaDevolucion, target: 8 }),
        },
        {
          id: 'comparar-semana',
          label: `Comparar esta semana vs anterior`,
          icon: <BarChart3 className="w-4 h-4 text-blue-400" />,
          action: () => onAction('weekly-comparison', {}),
        },
        {
          id: 'guias-rescatadas',
          label: `Guías rescatadas este mes`,
          icon: <CheckCircle className="w-4 h-4 text-green-400" />,
          action: () => onAction('rescued-guides', {}),
        },
        {
          id: 'dinero-salvado',
          label: `Dinero salvado por gestión`,
          icon: <TrendingUp className="w-4 h-4 text-emerald-400" />,
          action: () => onAction('money-saved', {}),
        },
        {
          id: 'proyeccion',
          label: `Proyección fin de mes`,
          icon: <Brain className="w-4 h-4 text-purple-400" />,
          action: () => onAction('monthly-projection', {}),
        },
      ],
    },

    // 9. RECOMENDACIÓN IA
    {
      id: 'recomendacion-ia',
      label: '🧠 RECOMENDACIÓN IA',
      icon: <Brain className="w-4 h-4" />,
      colorClass: 'text-amber-400',
      bgClass: 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-500/30 hover:from-amber-500/30 hover:to-orange-500/30',
      options: [
        {
          id: 'que-hacer-hoy',
          label: `¿Qué debo hacer primero hoy?`,
          icon: <Sparkles className="w-4 h-4 text-amber-400" />,
          action: () => onAction('ai-priority', {}),
        },
        {
          id: 'ciudad-evitar',
          label: `¿Qué ciudad evitar esta semana?`,
          icon: <Ban className="w-4 h-4 text-red-400" />,
          action: () => onAction('ai-city-avoid', {}),
        },
        {
          id: 'transportadora-ruta',
          label: `¿Qué transportadora usar para X ruta?`,
          icon: <Truck className="w-4 h-4 text-blue-400" />,
          action: () => onAction('ai-carrier-suggest', {}),
        },
        {
          id: 'mejorar-tasa',
          label: `¿Cómo mejorar mi tasa 1%?`,
          icon: <TrendingUp className="w-4 h-4 text-green-400" />,
          action: () => onAction('ai-improve-rate', {}),
        },
        {
          id: 'analisis-devolucion',
          label: `Análisis de por qué devuelven`,
          icon: <Brain className="w-4 h-4 text-purple-400" />,
          action: () => onAction('ai-return-analysis', {}),
        },
      ],
    },

    // 10. ACCIONES MASIVAS
    {
      id: 'acciones-masivas',
      label: '⚡ ACCIONES MASIVAS',
      icon: <Zap className="w-4 h-4" />,
      colorClass: 'text-red-400',
      bgClass: 'bg-gradient-to-r from-red-500/20 to-orange-500/20 border-red-500/30 hover:from-red-500/30 hover:to-orange-500/30',
      options: [
        {
          id: 'llamar-todos-recuperables',
          label: `Llamar TODOS los recuperables`,
          count: metrics.recuperables.length,
          impact: calculateImpact(metrics.recuperables.length, metrics.total, 0.75),
          icon: <PhoneCall className="w-4 h-4 text-green-400" />,
          action: () => onAction('mass-call', { guides: metrics.recuperables }),
        },
        {
          id: 'whatsapp-todos-reparto',
          label: `WhatsApp a TODOS en reparto`,
          count: metrics.enReparto.length,
          icon: <MessageSquare className="w-4 h-4 text-green-400" />,
          action: () => onAction('whatsapp-mass', { guides: metrics.enReparto }),
        },
        {
          id: 'exportar-criticos',
          label: `Exportar críticos para gestión manual`,
          count: metrics.recuperables.length,
          icon: <Download className="w-4 h-4 text-blue-400" />,
          action: () => onAction('export-critical', { guides: metrics.recuperables }),
        },
        {
          id: 'notificar-equipo',
          label: `Notificar equipo sobre urgentes`,
          icon: <Bell className="w-4 h-4 text-amber-400" />,
          action: () => onAction('notify-team', { guides: metrics.recuperables }),
        },
        {
          id: 'programar-seguimiento',
          label: `Programar seguimiento mañana`,
          icon: <Calendar className="w-4 h-4 text-purple-400" />,
          action: () => onAction('schedule-followup', {}),
        },
      ],
    },
  ], [metrics, onAction, onFilterGuides]);

  // ============================================
  // RENDERIZADO
  // ============================================

  const handleChipClick = (chipId: string) => {
    setActiveChipId(activeChipId === chipId ? null : chipId);
  };

  const handleOptionClick = (option: QuickTextOption) => {
    option.action();
    setActiveChipId(null);
  };

  return (
    <div ref={panelRef} className="relative">
      {/* Métricas rápidas visibles */}
      <div className="flex items-center gap-2 mb-3 px-1 text-[10px]">
        <div className="flex items-center gap-1 px-2 py-1 bg-slate-800/50 rounded-lg">
          <span className="text-slate-400">Tasa:</span>
          <span className={metrics.tasaDevolucion > 12 ? 'text-red-400 font-bold' : metrics.tasaDevolucion > 8 ? 'text-amber-400 font-bold' : 'text-green-400 font-bold'}>
            {metrics.tasaDevolucion.toFixed(1)}%
          </span>
          <span className="text-slate-500">(meta: 8%)</span>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 bg-slate-800/50 rounded-lg">
          <AlertCircle className="w-3 h-3 text-red-400" />
          <span className="text-red-400 font-bold">{metrics.recuperables.length}</span>
          <span className="text-slate-400">en riesgo</span>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 bg-slate-800/50 rounded-lg">
          <TrendingUp className="w-3 h-3 text-emerald-400" />
          <span className="text-slate-400">Potencial:</span>
          <span className="text-emerald-400 font-bold">
            {calculateImpact(metrics.recuperables.length, metrics.total, 0.75)}
          </span>
        </div>
      </div>

      {/* Chips de textos rápidos */}
      <div className="flex flex-wrap gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700">
        {quickTextChips.map((chip) => (
          <div key={chip.id} className="relative">
            {/* Chip button */}
            <button
              onClick={() => handleChipClick(chip.id)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5
                rounded-full text-xs font-medium
                border transition-all duration-200
                ${chip.bgClass}
                ${activeChipId === chip.id ? 'ring-2 ring-offset-1 ring-offset-slate-900' : ''}
              `}
            >
              <span className={chip.colorClass}>{chip.icon}</span>
              <span className="text-slate-200 whitespace-nowrap">{chip.label}</span>
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${activeChipId === chip.id ? 'rotate-180' : ''}`} />
            </button>

            {/* Subflujo desplegable */}
            {activeChipId === chip.id && (
              <div
                className="absolute top-full left-0 mt-2 z-50
                  w-[320px] max-h-[300px] overflow-y-auto
                  bg-slate-800/95 backdrop-blur-sm
                  rounded-xl border border-slate-700/50
                  shadow-xl shadow-black/30
                  animate-in fade-in slide-in-from-top-2 duration-150"
              >
                {/* Header del subflujo */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-slate-700/50">
                  <span className="text-xs font-bold text-slate-300">{chip.label}</span>
                  <button
                    onClick={() => setActiveChipId(null)}
                    className="p-1 hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <X className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>

                {/* Opciones */}
                <div className="p-2 space-y-1">
                  {chip.options.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleOptionClick(option)}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2.5
                        rounded-lg text-left
                        hover:bg-slate-700/70 transition-all duration-150
                        group
                      `}
                    >
                      {/* Ícono */}
                      <div className="flex-shrink-0">
                        {option.icon}
                      </div>

                      {/* Contenido */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-medium ${option.colorClass || 'text-slate-200'}`}>
                            {option.label}
                          </span>
                        </div>
                        {/* Impacto y tasa de recuperación */}
                        {(option.impact || option.recoveryRate) && (
                          <div className="flex items-center gap-2 mt-0.5">
                            {option.recoveryRate && (
                              <span className="text-[10px] text-slate-500">
                                Recuperable: {option.recoveryRate}%
                              </span>
                            )}
                            {option.impact && (
                              <span className="text-[10px] text-emerald-400 font-medium">
                                Impacto: {option.impact}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Contador */}
                      {option.count !== undefined && (
                        <div className="flex-shrink-0">
                          <span className={`
                            px-2 py-0.5 rounded-full text-[10px] font-bold
                            ${option.count > 10 ? 'bg-red-500/20 text-red-400' :
                              option.count > 5 ? 'bg-amber-500/20 text-amber-400' :
                              'bg-slate-600/50 text-slate-300'}
                          `}>
                            {option.count}
                          </span>
                        </div>
                      )}

                      {/* Flecha */}
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>

                {/* Footer con impacto total */}
                {chip.options.some(o => o.count) && (
                  <div className="px-3 py-2 border-t border-slate-700/50 bg-slate-900/50">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-400">
                        Rescatar guías = menos devolución
                      </span>
                      <span className="text-emerald-400 font-bold">
                        Potencial total: {calculateImpact(
                          chip.options.reduce((acc, o) => acc + (o.count || 0), 0),
                          metrics.total,
                          0.7
                        )}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Estilos para scrollbar */}
      <style>{`
        .scrollbar-thin::-webkit-scrollbar {
          height: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: rgba(51, 65, 85, 0.3);
          border-radius: 10px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(100, 116, 139, 0.5);
          border-radius: 10px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: rgba(100, 116, 139, 0.7);
        }
      `}</style>
    </div>
  );
};

export default QuickTextsPanel;
