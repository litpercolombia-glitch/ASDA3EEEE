// ============================================
// LITPER PRO - ENTERPRISE ADMIN DASHBOARD
// Sistema de Administracion Empresarial TOP GLOBAL
// Dashboard Ejecutivo de Nivel Mundial
// ============================================

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  // Icons principales
  Crown,
  Building2,
  Globe2,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  Key,
  Fingerprint,
  Eye,
  EyeOff,
  Users,
  UserPlus,
  UserCheck,
  UserX,
  UsersRound,

  // Analytics & Charts
  BarChart3,
  LineChart,
  PieChart,
  TrendingUp,
  TrendingDown,
  Activity,
  Gauge,
  Target,
  Crosshair,

  // Business & Finance
  DollarSign,
  Wallet,
  CreditCard,
  Receipt,
  Banknote,
  CircleDollarSign,
  BadgeDollarSign,
  Calculator,

  // Operations
  Settings,
  Settings2,
  Cog,
  Wrench,
  SlidersHorizontal,
  ToggleLeft,
  ToggleRight,

  // Data & Storage
  Database,
  HardDrive,
  Server,
  Cloud,
  CloudUpload,
  CloudDownload,
  Archive,
  FolderOpen,
  FileText,
  FileSpreadsheet,
  FilePieChart,
  FileBarChart,

  // Communication
  Bell,
  BellRing,
  MessageSquare,
  Mail,
  Send,
  Inbox,
  MessagesSquare,

  // Navigation & UI
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  ArrowLeft,
  ArrowUpRight,
  ArrowDownRight,
  ExternalLink,
  Link,
  Link2,

  // Status & Alerts
  CheckCircle,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  AlertCircle,
  AlertOctagon,
  Info,
  HelpCircle,

  // Time & Calendar
  Clock,
  Calendar,
  CalendarDays,
  Timer,
  Hourglass,
  History,

  // Location
  MapPin,
  Map,
  Navigation,
  Compass,

  // Network & API
  Network,
  Wifi,
  WifiOff,
  Signal,
  Webhook,
  Plug,
  Unplug,
  Radio,
  Satellite,

  // AI & ML
  Brain,
  Sparkles,
  Zap,
  Bot,
  Cpu,
  Workflow,
  GitBranch,

  // Misc
  Package,
  Truck,
  Box,
  Boxes,
  Layers,
  Layers3,
  LayoutDashboard,
  LayoutGrid,
  Grid3X3,
  Table,
  List,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  RefreshCw,
  Loader2,
  Download,
  Upload,
  Copy,
  Clipboard,
  ClipboardCheck,
  Trash2,
  Edit,
  Save,
  X,
  Plus,
  Minus,
  MoreVertical,
  MoreHorizontal,
  Maximize,
  Minimize,
  Expand,
  Shrink,
  Monitor,
  Laptop,
  Smartphone,
  TabletSmartphone,
  Award,
  Medal,
  Trophy,
  Star,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Bookmark,
  Flag,
  Tag,
  Tags,
  Hash,
  AtSign,
  Percent,
  Power,
  PowerOff,
  LogOut,
  LogIn,
  Home,
  Building,
  Factory,
  Landmark,
  Store,
  Briefcase,
  BadgeCheck,
  Verified,
  Rocket,
  Plane,
  Ship,
  Train,
  Car,
  Bike,
  Footprints,
  Route,
  Milestone,
  Flame,
  Lightbulb,
  Sun,
  Moon,
  SunMoon,
  Palette,
  Paintbrush,
  Wand2,
  Magic,
  Gem,
  Diamond,
  Gift,
  PartyPopper,
  Confetti,
  Cake,
} from 'lucide-react';

// ============================================
// TIPOS E INTERFACES ENTERPRISE
// ============================================

interface EnterpriseStats {
  totalEmpresas: number;
  totalUsuarios: number;
  totalSucursales: number;
  totalTransacciones: number;
  ingresosMensuales: number;
  crecimientoMensual: number;
  tasaRetencion: number;
  satisfaccionCliente: number;
  uptime: number;
  alertasActivas: number;
  ticketsAbiertos: number;
  apiCallsHoy: number;
}

interface Empresa {
  id: string;
  nombre: string;
  rut: string;
  logo?: string;
  plan: 'starter' | 'professional' | 'enterprise' | 'unlimited';
  estado: 'activo' | 'suspendido' | 'pendiente' | 'trial';
  fechaCreacion: string;
  ultimoAcceso: string;
  usuarios: number;
  sucursales: number;
  enviosMes: number;
  facturacionMes: number;
  pais: string;
  industria: string;
  contacto: {
    nombre: string;
    email: string;
    telefono: string;
  };
  metricas: {
    tasaEntrega: number;
    satisfaccion: number;
    tiempoPromedio: number;
  };
}

interface Sucursal {
  id: string;
  empresaId: string;
  nombre: string;
  ciudad: string;
  pais: string;
  direccion: string;
  estado: 'activo' | 'inactivo';
  responsable: string;
  empleados: number;
  enviosDiarios: number;
}

interface UsuarioEnterprise {
  id: string;
  nombre: string;
  email: string;
  empresaId: string;
  rol: 'super_admin' | 'admin_empresa' | 'gerente' | 'supervisor' | 'operador' | 'viewer';
  permisos: string[];
  estado: 'activo' | 'inactivo' | 'bloqueado';
  ultimoAcceso: string;
  mfa: boolean;
  sesionesActivas: number;
}

interface AlertaGlobal {
  id: string;
  tipo: 'critico' | 'alto' | 'medio' | 'bajo' | 'info';
  categoria: 'seguridad' | 'operaciones' | 'finanzas' | 'sistema' | 'compliance';
  titulo: string;
  mensaje: string;
  empresaId?: string;
  timestamp: string;
  leida: boolean;
  accionRequerida: boolean;
}

interface MetricaGlobal {
  id: string;
  nombre: string;
  valor: number;
  unidad: string;
  tendencia: 'up' | 'down' | 'stable';
  cambio: number;
  meta?: number;
  historico: number[];
}

interface ComplianceRule {
  id: string;
  nombre: string;
  descripcion: string;
  categoria: 'gdpr' | 'pci' | 'sox' | 'hipaa' | 'iso27001' | 'local';
  estado: 'cumple' | 'parcial' | 'no_cumple' | 'pendiente';
  ultimaAuditoria: string;
  proximaAuditoria: string;
  responsable: string;
  evidencias: number;
}

interface APIEndpoint {
  id: string;
  nombre: string;
  metodo: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  estado: 'activo' | 'deprecado' | 'beta';
  version: string;
  llamadasHoy: number;
  latenciaPromedio: number;
  tasaError: number;
}

interface AutomationRule {
  id: string;
  nombre: string;
  descripcion: string;
  trigger: string;
  acciones: string[];
  estado: 'activo' | 'pausado' | 'borrador';
  ejecuciones: number;
  ultimaEjecucion: string;
  tasaExito: number;
}

// ============================================
// DATOS SIMULADOS ENTERPRISE
// ============================================

const generarEstadisticasGlobales = (): EnterpriseStats => ({
  totalEmpresas: 847,
  totalUsuarios: 12453,
  totalSucursales: 2156,
  totalTransacciones: 1847293,
  ingresosMensuales: 2847562000,
  crecimientoMensual: 23.5,
  tasaRetencion: 94.7,
  satisfaccionCliente: 4.8,
  uptime: 99.97,
  alertasActivas: 12,
  ticketsAbiertos: 47,
  apiCallsHoy: 8472156,
});

const generarEmpresas = (): Empresa[] => [
  {
    id: 'emp-001',
    nombre: 'MegaCorp Logistics',
    rut: '900.123.456-7',
    plan: 'enterprise',
    estado: 'activo',
    fechaCreacion: '2023-01-15',
    ultimoAcceso: '2025-02-02T10:30:00',
    usuarios: 245,
    sucursales: 32,
    enviosMes: 45670,
    facturacionMes: 567000000,
    pais: 'Colombia',
    industria: 'E-commerce',
    contacto: {
      nombre: 'Carlos Rodriguez',
      email: 'carlos@megacorp.co',
      telefono: '+57 301 234 5678',
    },
    metricas: {
      tasaEntrega: 96.5,
      satisfaccion: 4.7,
      tiempoPromedio: 2.3,
    },
  },
  {
    id: 'emp-002',
    nombre: 'FastShip Internacional',
    rut: '901.234.567-8',
    plan: 'unlimited',
    estado: 'activo',
    fechaCreacion: '2022-06-20',
    ultimoAcceso: '2025-02-02T09:45:00',
    usuarios: 512,
    sucursales: 78,
    enviosMes: 128450,
    facturacionMes: 1234000000,
    pais: 'Mexico',
    industria: 'Retail',
    contacto: {
      nombre: 'Maria Gonzalez',
      email: 'maria@fastship.mx',
      telefono: '+52 55 1234 5678',
    },
    metricas: {
      tasaEntrega: 98.2,
      satisfaccion: 4.9,
      tiempoPromedio: 1.8,
    },
  },
  {
    id: 'emp-003',
    nombre: 'Dropper Express',
    rut: '902.345.678-9',
    plan: 'professional',
    estado: 'activo',
    fechaCreacion: '2024-03-10',
    ultimoAcceso: '2025-02-01T16:20:00',
    usuarios: 67,
    sucursales: 8,
    enviosMes: 8920,
    facturacionMes: 89000000,
    pais: 'Colombia',
    industria: 'Dropshipping',
    contacto: {
      nombre: 'Juan Martinez',
      email: 'juan@dropperexpress.co',
      telefono: '+57 315 987 6543',
    },
    metricas: {
      tasaEntrega: 91.3,
      satisfaccion: 4.2,
      tiempoPromedio: 3.1,
    },
  },
  {
    id: 'emp-004',
    nombre: 'TechDelivery SA',
    rut: '903.456.789-0',
    plan: 'enterprise',
    estado: 'trial',
    fechaCreacion: '2025-01-20',
    ultimoAcceso: '2025-02-02T08:15:00',
    usuarios: 23,
    sucursales: 3,
    enviosMes: 1250,
    facturacionMes: 0,
    pais: 'Chile',
    industria: 'Tecnologia',
    contacto: {
      nombre: 'Pablo Silva',
      email: 'pablo@techdelivery.cl',
      telefono: '+56 9 8765 4321',
    },
    metricas: {
      tasaEntrega: 94.0,
      satisfaccion: 4.5,
      tiempoPromedio: 2.0,
    },
  },
];

const generarAlertas = (): AlertaGlobal[] => [
  {
    id: 'alert-001',
    tipo: 'critico',
    categoria: 'seguridad',
    titulo: 'Intento de acceso no autorizado',
    mensaje: 'Se detectaron 50+ intentos de login fallidos desde IP 45.32.178.xxx',
    timestamp: '2025-02-02T10:45:00',
    leida: false,
    accionRequerida: true,
  },
  {
    id: 'alert-002',
    tipo: 'alto',
    categoria: 'operaciones',
    titulo: 'Retraso masivo en zona norte',
    mensaje: 'Mas de 200 envios con retraso >48h en Bogota Norte',
    timestamp: '2025-02-02T09:30:00',
    leida: false,
    accionRequerida: true,
  },
  {
    id: 'alert-003',
    tipo: 'medio',
    categoria: 'finanzas',
    titulo: 'Facturacion pendiente',
    mensaje: '3 empresas con facturas vencidas por mas de 30 dias',
    timestamp: '2025-02-02T08:00:00',
    leida: true,
    accionRequerida: true,
  },
  {
    id: 'alert-004',
    tipo: 'bajo',
    categoria: 'sistema',
    titulo: 'Actualizacion disponible',
    mensaje: 'Nueva version v4.2.1 disponible para instalacion',
    timestamp: '2025-02-01T23:00:00',
    leida: true,
    accionRequerida: false,
  },
  {
    id: 'alert-005',
    tipo: 'info',
    categoria: 'compliance',
    titulo: 'Auditoria programada',
    mensaje: 'Auditoria ISO 27001 programada para el 15 de febrero',
    timestamp: '2025-02-01T12:00:00',
    leida: true,
    accionRequerida: false,
  },
];

const generarComplianceRules = (): ComplianceRule[] => [
  {
    id: 'comp-001',
    nombre: 'Proteccion de Datos Personales',
    descripcion: 'Cumplimiento de la Ley 1581 de 2012 - Habeas Data',
    categoria: 'local',
    estado: 'cumple',
    ultimaAuditoria: '2025-01-15',
    proximaAuditoria: '2025-04-15',
    responsable: 'Diana Lopez',
    evidencias: 24,
  },
  {
    id: 'comp-002',
    nombre: 'ISO 27001 - Seguridad de Informacion',
    descripcion: 'Sistema de gestion de seguridad de la informacion',
    categoria: 'iso27001',
    estado: 'cumple',
    ultimaAuditoria: '2024-11-20',
    proximaAuditoria: '2025-02-20',
    responsable: 'Carlos Mendez',
    evidencias: 156,
  },
  {
    id: 'comp-003',
    nombre: 'PCI-DSS',
    descripcion: 'Estandar de seguridad de datos para tarjetas de pago',
    categoria: 'pci',
    estado: 'parcial',
    ultimaAuditoria: '2024-12-10',
    proximaAuditoria: '2025-03-10',
    responsable: 'Roberto Jimenez',
    evidencias: 89,
  },
  {
    id: 'comp-004',
    nombre: 'GDPR - Proteccion de Datos UE',
    descripcion: 'Reglamento General de Proteccion de Datos europeo',
    categoria: 'gdpr',
    estado: 'cumple',
    ultimaAuditoria: '2025-01-05',
    proximaAuditoria: '2025-07-05',
    responsable: 'Ana Martinez',
    evidencias: 67,
  },
];

// ============================================
// COLORES Y ESTILOS ENTERPRISE
// ============================================

const ENTERPRISE_COLORS = {
  primary: '#6366F1', // Indigo
  secondary: '#8B5CF6', // Purple
  accent: '#F59E0B', // Amber
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  gold: '#D4AF37',
  platinum: '#E5E4E2',
  diamond: '#B9F2FF',
  background: {
    dark: '#0A0F1E',
    card: '#111827',
    elevated: '#1F2937',
  },
  border: {
    default: 'rgba(99, 102, 241, 0.2)',
    hover: 'rgba(99, 102, 241, 0.5)',
  },
};

// ============================================
// SUBCOMPONENTES ENTERPRISE
// ============================================

// Componente de estadistica individual
const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  trend?: { value: number; direction: 'up' | 'down' };
  subtitle?: string;
  onClick?: () => void;
}> = ({ title, value, icon: Icon, color, trend, subtitle, onClick }) => (
  <div
    onClick={onClick}
    className={`relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700/50 hover:border-indigo-500/50 transition-all duration-300 group ${onClick ? 'cursor-pointer hover:scale-[1.02]' : ''}`}
  >
    {/* Efecto de brillo */}
    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${color} opacity-10 rounded-full blur-3xl transform translate-x-8 -translate-y-8 group-hover:opacity-20 transition-opacity`} />

    <div className="relative z-10">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl bg-gradient-to-br ${color} shadow-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
            trend.direction === 'up'
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'bg-red-500/20 text-red-400'
          }`}>
            {trend.direction === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trend.value}%
          </div>
        )}
      </div>

      <p className="text-sm text-slate-400 mb-1">{title}</p>
      <p className="text-3xl font-bold text-white">{value}</p>
      {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
    </div>
  </div>
);

// Componente de alerta
const AlertCard: React.FC<{ alerta: AlertaGlobal; onAction?: () => void }> = ({ alerta, onAction }) => {
  const getAlertStyles = (tipo: AlertaGlobal['tipo']) => {
    switch (tipo) {
      case 'critico': return { bg: 'bg-red-500/10', border: 'border-red-500/50', icon: AlertOctagon, color: 'text-red-500' };
      case 'alto': return { bg: 'bg-orange-500/10', border: 'border-orange-500/50', icon: AlertTriangle, color: 'text-orange-500' };
      case 'medio': return { bg: 'bg-amber-500/10', border: 'border-amber-500/50', icon: AlertCircle, color: 'text-amber-500' };
      case 'bajo': return { bg: 'bg-blue-500/10', border: 'border-blue-500/50', icon: Info, color: 'text-blue-500' };
      default: return { bg: 'bg-slate-500/10', border: 'border-slate-500/50', icon: Info, color: 'text-slate-500' };
    }
  };

  const styles = getAlertStyles(alerta.tipo);
  const IconComponent = styles.icon;

  return (
    <div className={`${styles.bg} ${styles.border} border rounded-xl p-4 hover:scale-[1.01] transition-transform`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${styles.bg}`}>
          <IconComponent className={`w-5 h-5 ${styles.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-bold text-white text-sm truncate">{alerta.titulo}</h4>
            {!alerta.leida && (
              <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
            )}
          </div>
          <p className="text-xs text-slate-400 line-clamp-2">{alerta.mensaje}</p>
          <div className="flex items-center gap-4 mt-2">
            <span className="text-xs text-slate-500">
              {new Date(alerta.timestamp).toLocaleString('es-CO')}
            </span>
            {alerta.accionRequerida && (
              <button
                onClick={onAction}
                className={`text-xs font-bold ${styles.color} hover:underline`}
              >
                Tomar accion
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente de empresa
const EmpresaCard: React.FC<{ empresa: Empresa; onClick?: () => void }> = ({ empresa, onClick }) => {
  const getPlanBadge = (plan: Empresa['plan']) => {
    switch (plan) {
      case 'unlimited': return { color: 'from-amber-500 to-yellow-500', label: 'UNLIMITED', icon: Crown };
      case 'enterprise': return { color: 'from-purple-500 to-indigo-500', label: 'ENTERPRISE', icon: Building2 };
      case 'professional': return { color: 'from-blue-500 to-cyan-500', label: 'PROFESSIONAL', icon: Briefcase };
      default: return { color: 'from-slate-500 to-slate-600', label: 'STARTER', icon: Rocket };
    }
  };

  const getEstadoBadge = (estado: Empresa['estado']) => {
    switch (estado) {
      case 'activo': return { color: 'bg-emerald-500/20 text-emerald-400', label: 'Activo' };
      case 'trial': return { color: 'bg-amber-500/20 text-amber-400', label: 'Trial' };
      case 'suspendido': return { color: 'bg-red-500/20 text-red-400', label: 'Suspendido' };
      default: return { color: 'bg-slate-500/20 text-slate-400', label: 'Pendiente' };
    }
  };

  const planBadge = getPlanBadge(empresa.plan);
  const estadoBadge = getEstadoBadge(empresa.estado);
  const PlanIcon = planBadge.icon;

  return (
    <div
      onClick={onClick}
      className="bg-slate-800/50 hover:bg-slate-800 rounded-2xl p-5 border border-slate-700/50 hover:border-indigo-500/50 transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${planBadge.color} flex items-center justify-center shadow-lg`}>
            <PlanIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-white group-hover:text-indigo-400 transition-colors">
              {empresa.nombre}
            </h3>
            <p className="text-xs text-slate-400">{empresa.industria} - {empresa.pais}</p>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-bold ${estadoBadge.color}`}>
          {estadoBadge.label}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center p-2 bg-slate-900/50 rounded-lg">
          <p className="text-lg font-bold text-white">{empresa.usuarios}</p>
          <p className="text-xs text-slate-500">Usuarios</p>
        </div>
        <div className="text-center p-2 bg-slate-900/50 rounded-lg">
          <p className="text-lg font-bold text-white">{empresa.sucursales}</p>
          <p className="text-xs text-slate-500">Sucursales</p>
        </div>
        <div className="text-center p-2 bg-slate-900/50 rounded-lg">
          <p className="text-lg font-bold text-emerald-400">{empresa.metricas.tasaEntrega}%</p>
          <p className="text-xs text-slate-500">Entrega</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-700/50">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Package className="w-3 h-3" />
          <span>{empresa.enviosMes.toLocaleString()} envios/mes</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
          <span>Ver detalles</span>
          <ArrowRight className="w-3 h-3" />
        </div>
      </div>
    </div>
  );
};

// Componente de compliance
const ComplianceCard: React.FC<{ rule: ComplianceRule }> = ({ rule }) => {
  const getStatusStyles = (estado: ComplianceRule['estado']) => {
    switch (estado) {
      case 'cumple': return { color: 'bg-emerald-500', text: 'text-emerald-400', label: 'Cumple' };
      case 'parcial': return { color: 'bg-amber-500', text: 'text-amber-400', label: 'Parcial' };
      case 'no_cumple': return { color: 'bg-red-500', text: 'text-red-400', label: 'No Cumple' };
      default: return { color: 'bg-slate-500', text: 'text-slate-400', label: 'Pendiente' };
    }
  };

  const getCategoryIcon = (categoria: ComplianceRule['categoria']) => {
    switch (categoria) {
      case 'gdpr': return Globe2;
      case 'pci': return CreditCard;
      case 'sox': return Landmark;
      case 'hipaa': return ShieldCheck;
      case 'iso27001': return Shield;
      default: return FileText;
    }
  };

  const status = getStatusStyles(rule.estado);
  const CategoryIcon = getCategoryIcon(rule.categoria);

  return (
    <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50 hover:border-slate-600 transition-all">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-slate-700/50 rounded-lg">
          <CategoryIcon className="w-5 h-5 text-indigo-400" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-bold text-white text-sm">{rule.nombre}</h4>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${status.text} bg-slate-700/50`}>
              {status.label}
            </span>
          </div>
          <p className="text-xs text-slate-400 mb-2 line-clamp-1">{rule.descripcion}</p>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>Proxima: {new Date(rule.proximaAuditoria).toLocaleDateString('es-CO')}</span>
            </div>
            <div className="flex items-center gap-1">
              <FileText className="w-3 h-3" />
              <span>{rule.evidencias} evidencias</span>
            </div>
          </div>
        </div>
        <div className={`w-3 h-3 rounded-full ${status.color}`} />
      </div>
    </div>
  );
};

// ============================================
// SUBMODULOS DEL DASHBOARD
// ============================================

// 1. Command Center - Vista Ejecutiva
const CommandCenterModule: React.FC<{ stats: EnterpriseStats; alertas: AlertaGlobal[] }> = ({ stats, alertas }) => (
  <div className="space-y-6">
    {/* Header del Command Center */}
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-900 p-8 border border-indigo-500/30">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,...')] opacity-5" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-500/20 to-transparent rounded-full blur-3xl" />

      <div className="relative z-10">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-4 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl shadow-xl shadow-amber-500/30">
            <Crown className="w-10 h-10 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-3">
              ENTERPRISE COMMAND CENTER
              <span className="px-3 py-1 bg-gradient-to-r from-amber-500 to-amber-600 text-xs rounded-full font-bold">
                GLOBAL
              </span>
            </h1>
            <p className="text-indigo-200 text-lg">Centro de Control Ejecutivo - Vision 360</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
            <p className="text-3xl font-black text-white">{stats.totalEmpresas}</p>
            <p className="text-xs text-indigo-200">Empresas</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
            <p className="text-3xl font-black text-white">{(stats.totalUsuarios / 1000).toFixed(1)}K</p>
            <p className="text-xs text-indigo-200">Usuarios</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
            <p className="text-3xl font-black text-emerald-400">{stats.uptime}%</p>
            <p className="text-xs text-indigo-200">Uptime</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
            <p className="text-3xl font-black text-amber-400">+{stats.crecimientoMensual}%</p>
            <p className="text-xs text-indigo-200">Crecimiento</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
            <p className="text-3xl font-black text-white">{(stats.apiCallsHoy / 1000000).toFixed(1)}M</p>
            <p className="text-xs text-indigo-200">API Calls</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
            <p className="text-3xl font-black text-white">{stats.satisfaccionCliente}</p>
            <p className="text-xs text-indigo-200">NPS Score</p>
          </div>
        </div>
      </div>
    </div>

    {/* Metricas Financieras */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Ingresos Mensuales"
        value={`$${(stats.ingresosMensuales / 1000000000).toFixed(1)}B`}
        icon={CircleDollarSign}
        color="from-emerald-500 to-emerald-600"
        trend={{ value: stats.crecimientoMensual, direction: 'up' }}
        subtitle="COP - Acumulado mensual"
      />
      <StatCard
        title="Transacciones"
        value={(stats.totalTransacciones / 1000000).toFixed(2) + 'M'}
        icon={Activity}
        color="from-blue-500 to-blue-600"
        trend={{ value: 18.3, direction: 'up' }}
        subtitle="Procesadas este mes"
      />
      <StatCard
        title="Tasa de Retencion"
        value={stats.tasaRetencion + '%'}
        icon={UsersRound}
        color="from-purple-500 to-purple-600"
        trend={{ value: 2.1, direction: 'up' }}
        subtitle="Clientes activos"
      />
      <StatCard
        title="Alertas Activas"
        value={stats.alertasActivas}
        icon={BellRing}
        color="from-red-500 to-red-600"
        subtitle={`${stats.ticketsAbiertos} tickets abiertos`}
      />
    </div>

    {/* Alertas Criticas */}
    <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-700/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-500/20 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-white">Alertas Globales</h2>
        </div>
        <button className="text-sm text-indigo-400 hover:text-indigo-300 font-medium">
          Ver todas
        </button>
      </div>
      <div className="grid gap-3">
        {alertas.slice(0, 4).map((alerta) => (
          <AlertCard key={alerta.id} alerta={alerta} />
        ))}
      </div>
    </div>
  </div>
);

// 2. Multi-Enterprise Management
const MultiEnterpriseModule: React.FC<{ empresas: Empresa[] }> = ({ empresas }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState<string>('all');
  const [filterEstado, setFilterEstado] = useState<string>('all');

  const filteredEmpresas = useMemo(() => {
    return empresas.filter(emp => {
      const matchesSearch = emp.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           emp.industria.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPlan = filterPlan === 'all' || emp.plan === filterPlan;
      const matchesEstado = filterEstado === 'all' || emp.estado === filterEstado;
      return matchesSearch && matchesPlan && matchesEstado;
    });
  }, [empresas, searchTerm, filterPlan, filterEstado]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Building2 className="w-7 h-7 text-indigo-400" />
            Gestion Multi-Empresa
          </h2>
          <p className="text-slate-400">Administra todas las empresas de la plataforma</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-2 transition-colors">
            <Plus className="w-4 h-4" />
            Nueva Empresa
          </button>
          <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold flex items-center gap-2 transition-colors">
            <Download className="w-4 h-4" />
            Exportar
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-slate-800/50 rounded-xl">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar empresa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
          />
        </div>
        <select
          value={filterPlan}
          onChange={(e) => setFilterPlan(e.target.value)}
          className="px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:border-indigo-500 outline-none"
        >
          <option value="all">Todos los planes</option>
          <option value="unlimited">Unlimited</option>
          <option value="enterprise">Enterprise</option>
          <option value="professional">Professional</option>
          <option value="starter">Starter</option>
        </select>
        <select
          value={filterEstado}
          onChange={(e) => setFilterEstado(e.target.value)}
          className="px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:border-indigo-500 outline-none"
        >
          <option value="all">Todos los estados</option>
          <option value="activo">Activo</option>
          <option value="trial">Trial</option>
          <option value="suspendido">Suspendido</option>
          <option value="pendiente">Pendiente</option>
        </select>
      </div>

      {/* Stats rapidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Empresas', value: empresas.length, icon: Building2, color: 'from-indigo-500 to-indigo-600' },
          { label: 'Activas', value: empresas.filter(e => e.estado === 'activo').length, icon: CheckCircle2, color: 'from-emerald-500 to-emerald-600' },
          { label: 'En Trial', value: empresas.filter(e => e.estado === 'trial').length, icon: Clock, color: 'from-amber-500 to-amber-600' },
          { label: 'Enterprise+', value: empresas.filter(e => ['enterprise', 'unlimited'].includes(e.plan)).length, icon: Crown, color: 'from-purple-500 to-purple-600' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-slate-800/50 rounded-xl p-4 flex items-center gap-4">
            <div className={`p-3 rounded-lg bg-gradient-to-br ${stat.color}`}>
              <stat.icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-slate-400">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Lista de empresas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEmpresas.map((empresa) => (
          <EmpresaCard key={empresa.id} empresa={empresa} />
        ))}
      </div>
    </div>
  );
};

// 3. Global Analytics
const GlobalAnalyticsModule: React.FC = () => {
  const metricas = [
    { nombre: 'Envios Totales', valor: 2847293, tendencia: 'up' as const, cambio: 23.5 },
    { nombre: 'Tasa de Entrega', valor: 96.8, tendencia: 'up' as const, cambio: 1.2 },
    { nombre: 'Tiempo Promedio', valor: 2.4, tendencia: 'down' as const, cambio: -8.5 },
    { nombre: 'Satisfaccion', valor: 4.7, tendencia: 'up' as const, cambio: 0.3 },
    { nombre: 'Devoluciones', valor: 3.2, tendencia: 'down' as const, cambio: -15.2 },
    { nombre: 'Costo por Envio', valor: 8450, tendencia: 'down' as const, cambio: -5.8 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <BarChart3 className="w-7 h-7 text-indigo-400" />
            Analytics Global
          </h2>
          <p className="text-slate-400">Metricas y KPIs en tiempo real de toda la plataforma</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 bg-slate-700 text-slate-300 rounded-lg text-sm hover:bg-slate-600">
            Hoy
          </button>
          <button className="px-3 py-1.5 bg-slate-700 text-slate-300 rounded-lg text-sm hover:bg-slate-600">
            7D
          </button>
          <button className="px-3 py-1.5 bg-indigo-500 text-white rounded-lg text-sm font-bold">
            30D
          </button>
          <button className="px-3 py-1.5 bg-slate-700 text-slate-300 rounded-lg text-sm hover:bg-slate-600">
            YTD
          </button>
        </div>
      </div>

      {/* Metricas principales */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {metricas.map((metrica, idx) => (
          <div key={idx} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <p className="text-xs text-slate-400 mb-2">{metrica.nombre}</p>
            <p className="text-2xl font-bold text-white">
              {typeof metrica.valor === 'number' && metrica.valor > 1000
                ? (metrica.valor / 1000000).toFixed(2) + 'M'
                : metrica.valor}
              {metrica.nombre.includes('Tasa') || metrica.nombre.includes('Satisfaccion') ? '' : metrica.nombre.includes('Costo') ? ' COP' : ''}
            </p>
            <div className={`flex items-center gap-1 text-xs mt-1 ${
              metrica.tendencia === 'up' ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {metrica.tendencia === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(metrica.cambio)}%
            </div>
          </div>
        ))}
      </div>

      {/* Graficos simulados */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <LineChart className="w-5 h-5 text-indigo-400" />
            Tendencia de Envios
          </h3>
          <div className="h-64 flex items-end gap-2">
            {[45, 52, 48, 61, 58, 67, 72, 68, 75, 82, 78, 89].map((val, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-lg transition-all hover:from-indigo-500 hover:to-indigo-300"
                  style={{ height: `${val}%` }}
                />
                <span className="text-xs text-slate-500">{idx + 1}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-indigo-400" />
            Distribucion por Pais
          </h3>
          <div className="flex items-center justify-center h-64">
            <div className="relative w-48 h-48">
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#1e293b" strokeWidth="20" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="#6366f1" strokeWidth="20" strokeDasharray="150 251.2" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="#8b5cf6" strokeWidth="20" strokeDasharray="60 251.2" strokeDashoffset="-150" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="#a855f7" strokeWidth="20" strokeDasharray="30 251.2" strokeDashoffset="-210" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">847</p>
                  <p className="text-xs text-slate-400">Empresas</p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-center gap-4 mt-4">
            {[
              { label: 'Colombia', color: 'bg-indigo-500', value: '60%' },
              { label: 'Mexico', color: 'bg-purple-500', value: '24%' },
              { label: 'Otros', color: 'bg-fuchsia-500', value: '16%' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${item.color}`} />
                <span className="text-xs text-slate-300">{item.label} ({item.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Performers */}
      <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          Top Empresas del Mes
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-slate-400 border-b border-slate-700">
                <th className="pb-3 font-medium">#</th>
                <th className="pb-3 font-medium">Empresa</th>
                <th className="pb-3 font-medium">Envios</th>
                <th className="pb-3 font-medium">Tasa Entrega</th>
                <th className="pb-3 font-medium">Satisfaccion</th>
                <th className="pb-3 font-medium">Facturacion</th>
              </tr>
            </thead>
            <tbody>
              {[
                { pos: 1, nombre: 'FastShip Internacional', envios: '128.4K', tasa: '98.2%', sat: '4.9', fact: '$1.23B' },
                { pos: 2, nombre: 'MegaCorp Logistics', envios: '45.6K', tasa: '96.5%', sat: '4.7', fact: '$567M' },
                { pos: 3, nombre: 'Express Delivery CO', envios: '34.2K', tasa: '95.8%', sat: '4.6', fact: '$342M' },
                { pos: 4, nombre: 'QuickShip MX', envios: '28.9K', tasa: '94.3%', sat: '4.5', fact: '$289M' },
                { pos: 5, nombre: 'Dropper Express', envios: '8.9K', tasa: '91.3%', sat: '4.2', fact: '$89M' },
              ].map((row) => (
                <tr key={row.pos} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                  <td className="py-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      row.pos === 1 ? 'bg-amber-500 text-white' :
                      row.pos === 2 ? 'bg-slate-400 text-white' :
                      row.pos === 3 ? 'bg-amber-700 text-white' :
                      'bg-slate-700 text-slate-300'
                    }`}>
                      {row.pos}
                    </span>
                  </td>
                  <td className="py-3 font-medium text-white">{row.nombre}</td>
                  <td className="py-3 text-slate-300">{row.envios}</td>
                  <td className="py-3">
                    <span className="text-emerald-400 font-medium">{row.tasa}</span>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <span className="text-slate-300">{row.sat}</span>
                    </div>
                  </td>
                  <td className="py-3 text-slate-300 font-medium">{row.fact}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// 4. Compliance & Governance
const ComplianceModule: React.FC<{ rules: ComplianceRule[] }> = ({ rules }) => {
  const complianceScore = useMemo(() => {
    const cumple = rules.filter(r => r.estado === 'cumple').length;
    return Math.round((cumple / rules.length) * 100);
  }, [rules]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <ShieldCheck className="w-7 h-7 text-emerald-400" />
            Compliance & Governance
          </h2>
          <p className="text-slate-400">Cumplimiento normativo y auditorias</p>
        </div>
        <button className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold flex items-center gap-2 transition-colors">
          <FileText className="w-4 h-4" />
          Generar Reporte
        </button>
      </div>

      {/* Score Global */}
      <div className="bg-gradient-to-r from-emerald-900/50 to-teal-900/50 rounded-2xl p-6 border border-emerald-500/30">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-emerald-300 text-sm font-medium mb-1">Score de Cumplimiento Global</p>
            <p className="text-5xl font-black text-white">{complianceScore}%</p>
            <p className="text-emerald-400 text-sm mt-1">Nivel: Excelente</p>
          </div>
          <div className="w-32 h-32 relative">
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
              <circle cx="50" cy="50" r="40" fill="none" stroke="#1e293b" strokeWidth="12" />
              <circle
                cx="50" cy="50" r="40" fill="none"
                stroke="#10b981" strokeWidth="12"
                strokeDasharray={`${complianceScore * 2.51} 251.2`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <ShieldCheck className="w-10 h-10 text-emerald-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Resumen por categoria */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { nombre: 'GDPR', estado: 'cumple', icon: Globe2 },
          { nombre: 'PCI-DSS', estado: 'parcial', icon: CreditCard },
          { nombre: 'ISO 27001', estado: 'cumple', icon: Shield },
          { nombre: 'SOX', estado: 'pendiente', icon: Landmark },
          { nombre: 'HIPAA', estado: 'cumple', icon: Heart },
          { nombre: 'Local', estado: 'cumple', icon: MapPin },
        ].map((cat, idx) => (
          <div key={idx} className="bg-slate-800/50 rounded-xl p-4 text-center border border-slate-700/50">
            <cat.icon className="w-6 h-6 mx-auto mb-2 text-slate-400" />
            <p className="text-sm font-bold text-white mb-1">{cat.nombre}</p>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
              cat.estado === 'cumple' ? 'bg-emerald-500/20 text-emerald-400' :
              cat.estado === 'parcial' ? 'bg-amber-500/20 text-amber-400' :
              'bg-slate-500/20 text-slate-400'
            }`}>
              {cat.estado === 'cumple' ? 'OK' : cat.estado === 'parcial' ? 'Parcial' : 'Pendiente'}
            </span>
          </div>
        ))}
      </div>

      {/* Lista de reglas */}
      <div className="grid gap-3">
        {rules.map((rule) => (
          <ComplianceCard key={rule.id} rule={rule} />
        ))}
      </div>
    </div>
  );
};

// 5. Security Operations Center (SOC)
const SecurityModule: React.FC = () => {
  const [securityEvents] = useState([
    { tipo: 'login_fallido', cantidad: 156, tendencia: 'up', riesgo: 'medio' },
    { tipo: 'acceso_api', cantidad: 8472156, tendencia: 'stable', riesgo: 'bajo' },
    { tipo: 'cambio_permisos', cantidad: 23, tendencia: 'down', riesgo: 'bajo' },
    { tipo: 'exportacion_datos', cantidad: 89, tendencia: 'up', riesgo: 'medio' },
    { tipo: 'sesiones_activas', cantidad: 3421, tendencia: 'stable', riesgo: 'bajo' },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Shield className="w-7 h-7 text-red-400" />
            Security Operations Center
          </h2>
          <p className="text-slate-400">Monitoreo de seguridad en tiempo real</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm font-bold">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            Sistema Protegido
          </span>
        </div>
      </div>

      {/* Estado de seguridad */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-900/30 to-emerald-800/30 rounded-2xl p-6 border border-emerald-500/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-emerald-500/20 rounded-xl">
              <ShieldCheck className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <p className="text-emerald-300 text-sm">Nivel de Amenaza</p>
              <p className="text-2xl font-bold text-white">BAJO</p>
            </div>
          </div>
          <p className="text-sm text-emerald-200">No se detectan amenazas activas</p>
        </div>

        <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/30 rounded-2xl p-6 border border-blue-500/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-500/20 rounded-xl">
              <Lock className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <p className="text-blue-300 text-sm">MFA Habilitado</p>
              <p className="text-2xl font-bold text-white">94.7%</p>
            </div>
          </div>
          <p className="text-sm text-blue-200">11,789 de 12,453 usuarios</p>
        </div>

        <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/30 rounded-2xl p-6 border border-purple-500/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-purple-500/20 rounded-xl">
              <Key className="w-8 h-8 text-purple-400" />
            </div>
            <div>
              <p className="text-purple-300 text-sm">API Keys Activas</p>
              <p className="text-2xl font-bold text-white">1,847</p>
            </div>
          </div>
          <p className="text-sm text-purple-200">23 rotadas esta semana</p>
        </div>
      </div>

      {/* Eventos de seguridad */}
      <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-400" />
          Eventos de Seguridad (24h)
        </h3>
        <div className="space-y-3">
          {securityEvents.map((event, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-8 rounded-full ${
                  event.riesgo === 'alto' ? 'bg-red-500' :
                  event.riesgo === 'medio' ? 'bg-amber-500' : 'bg-emerald-500'
                }`} />
                <div>
                  <p className="font-medium text-white capitalize">
                    {event.tipo.replace(/_/g, ' ')}
                  </p>
                  <p className="text-xs text-slate-400">Riesgo: {event.riesgo}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-white">
                  {event.cantidad.toLocaleString()}
                </p>
                <div className={`flex items-center gap-1 text-xs ${
                  event.tendencia === 'up' ? 'text-red-400' :
                  event.tendencia === 'down' ? 'text-emerald-400' : 'text-slate-400'
                }`}>
                  {event.tendencia === 'up' ? <TrendingUp className="w-3 h-3" /> :
                   event.tendencia === 'down' ? <TrendingDown className="w-3 h-3" /> :
                   <Activity className="w-3 h-3" />}
                  {event.tendencia}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Acciones rapidas de seguridad */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Rotar API Keys', icon: RefreshCw, color: 'from-purple-500 to-purple-600' },
          { label: 'Forzar MFA', icon: Fingerprint, color: 'from-blue-500 to-blue-600' },
          { label: 'Revocar Sesiones', icon: LogOut, color: 'from-amber-500 to-amber-600' },
          { label: 'Auditoria Completa', icon: FileBarChart, color: 'from-emerald-500 to-emerald-600' },
        ].map((action, idx) => (
          <button
            key={idx}
            className={`p-4 rounded-xl bg-gradient-to-br ${action.color} hover:opacity-90 transition-opacity flex items-center gap-3`}
          >
            <action.icon className="w-5 h-5 text-white" />
            <span className="text-sm font-bold text-white">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

// 6. User Management Enterprise
const UserManagementModule: React.FC = () => {
  const [users] = useState<UsuarioEnterprise[]>([
    { id: 'u1', nombre: 'Carlos Admin', email: 'carlos@litper.co', empresaId: 'emp-001', rol: 'super_admin', permisos: ['all'], estado: 'activo', ultimoAcceso: '2025-02-02T10:30:00', mfa: true, sesionesActivas: 2 },
    { id: 'u2', nombre: 'Maria Gerente', email: 'maria@megacorp.co', empresaId: 'emp-001', rol: 'gerente', permisos: ['read', 'write', 'reports'], estado: 'activo', ultimoAcceso: '2025-02-02T09:15:00', mfa: true, sesionesActivas: 1 },
    { id: 'u3', nombre: 'Juan Operador', email: 'juan@megacorp.co', empresaId: 'emp-001', rol: 'operador', permisos: ['read', 'write'], estado: 'activo', ultimoAcceso: '2025-02-02T08:00:00', mfa: false, sesionesActivas: 1 },
    { id: 'u4', nombre: 'Ana Viewer', email: 'ana@megacorp.co', empresaId: 'emp-001', rol: 'viewer', permisos: ['read'], estado: 'inactivo', ultimoAcceso: '2025-01-28T14:30:00', mfa: false, sesionesActivas: 0 },
  ]);

  const getRolBadge = (rol: UsuarioEnterprise['rol']) => {
    const roles = {
      super_admin: { color: 'bg-red-500/20 text-red-400', label: 'Super Admin' },
      admin_empresa: { color: 'bg-purple-500/20 text-purple-400', label: 'Admin Empresa' },
      gerente: { color: 'bg-indigo-500/20 text-indigo-400', label: 'Gerente' },
      supervisor: { color: 'bg-blue-500/20 text-blue-400', label: 'Supervisor' },
      operador: { color: 'bg-emerald-500/20 text-emerald-400', label: 'Operador' },
      viewer: { color: 'bg-slate-500/20 text-slate-400', label: 'Viewer' },
    };
    return roles[rol] || roles.viewer;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Users className="w-7 h-7 text-indigo-400" />
            Gestion de Usuarios Enterprise
          </h2>
          <p className="text-slate-400">Administra usuarios, roles y permisos</p>
        </div>
        <button className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-2 transition-colors">
          <UserPlus className="w-4 h-4" />
          Nuevo Usuario
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Usuarios"
          value="12,453"
          icon={Users}
          color="from-indigo-500 to-indigo-600"
          trend={{ value: 8.3, direction: 'up' }}
        />
        <StatCard
          title="Activos Ahora"
          value="3,421"
          icon={UserCheck}
          color="from-emerald-500 to-emerald-600"
          subtitle="Sesiones activas"
        />
        <StatCard
          title="MFA Habilitado"
          value="94.7%"
          icon={Shield}
          color="from-purple-500 to-purple-600"
          trend={{ value: 2.1, direction: 'up' }}
        />
        <StatCard
          title="Bloqueados"
          value="23"
          icon={UserX}
          color="from-red-500 to-red-600"
          subtitle="Por seguridad"
        />
      </div>

      {/* Tabla de usuarios */}
      <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden">
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar usuario..."
              className="pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-indigo-500 outline-none w-64"
            />
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 bg-slate-700 text-slate-300 rounded-lg text-sm hover:bg-slate-600 flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filtros
            </button>
            <button className="px-3 py-1.5 bg-slate-700 text-slate-300 rounded-lg text-sm hover:bg-slate-600 flex items-center gap-2">
              <Download className="w-4 h-4" />
              Exportar
            </button>
          </div>
        </div>
        <table className="w-full">
          <thead className="bg-slate-900/50">
            <tr className="text-left text-xs text-slate-400">
              <th className="py-3 px-4 font-medium">Usuario</th>
              <th className="py-3 px-4 font-medium">Rol</th>
              <th className="py-3 px-4 font-medium">Estado</th>
              <th className="py-3 px-4 font-medium">MFA</th>
              <th className="py-3 px-4 font-medium">Ultimo Acceso</th>
              <th className="py-3 px-4 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const rolBadge = getRolBadge(user.rol);
              return (
                <tr key={user.id} className="border-t border-slate-700/50 hover:bg-slate-700/30">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
                        {user.nombre.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-white">{user.nombre}</p>
                        <p className="text-xs text-slate-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${rolBadge.color}`}>
                      {rolBadge.label}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`flex items-center gap-1 text-xs font-medium ${
                      user.estado === 'activo' ? 'text-emerald-400' :
                      user.estado === 'bloqueado' ? 'text-red-400' : 'text-slate-400'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${
                        user.estado === 'activo' ? 'bg-emerald-500' :
                        user.estado === 'bloqueado' ? 'bg-red-500' : 'bg-slate-500'
                      }`} />
                      {user.estado}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {user.mfa ? (
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <ShieldAlert className="w-5 h-5 text-amber-400" />
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-400">
                    {new Date(user.ultimoAcceso).toLocaleString('es-CO')}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-1.5 hover:bg-slate-600 rounded-lg text-slate-400 hover:text-white">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 hover:bg-slate-600 rounded-lg text-slate-400 hover:text-white">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// 7. Automation Center
const AutomationModule: React.FC = () => {
  const automations: AutomationRule[] = [
    { id: 'auto-1', nombre: 'Alerta Retraso Critico', descripcion: 'Notificar cuando envio supere 72h sin movimiento', trigger: 'envio.sin_movimiento > 72h', acciones: ['notificar_cliente', 'notificar_soporte', 'crear_ticket'], estado: 'activo', ejecuciones: 1847, ultimaEjecucion: '2025-02-02T10:15:00', tasaExito: 99.2 },
    { id: 'auto-2', nombre: 'Facturacion Automatica', descripcion: 'Generar facturas el 1ro de cada mes', trigger: 'cron: 0 0 1 * *', acciones: ['generar_factura', 'enviar_email', 'actualizar_crm'], estado: 'activo', ejecuciones: 847, ultimaEjecucion: '2025-02-01T00:00:00', tasaExito: 100 },
    { id: 'auto-3', nombre: 'Bloqueo por Inactividad', descripcion: 'Bloquear usuarios sin acceso en 90 dias', trigger: 'usuario.ultimo_acceso > 90d', acciones: ['bloquear_usuario', 'notificar_admin'], estado: 'pausado', ejecuciones: 234, ultimaEjecucion: '2025-01-15T06:00:00', tasaExito: 100 },
    { id: 'auto-4', nombre: 'Reporte Semanal', descripcion: 'Enviar reporte de KPIs cada lunes', trigger: 'cron: 0 8 * * 1', acciones: ['generar_reporte', 'enviar_stakeholders'], estado: 'activo', ejecuciones: 52, ultimaEjecucion: '2025-01-27T08:00:00', tasaExito: 98.1 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Workflow className="w-7 h-7 text-indigo-400" />
            Centro de Automatizacion
          </h2>
          <p className="text-slate-400">Reglas y flujos automatizados</p>
        </div>
        <button className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-2 transition-colors">
          <Plus className="w-4 h-4" />
          Nueva Regla
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Reglas Activas"
          value={automations.filter(a => a.estado === 'activo').length}
          icon={Zap}
          color="from-amber-500 to-amber-600"
        />
        <StatCard
          title="Ejecuciones Hoy"
          value="2,847"
          icon={Activity}
          color="from-emerald-500 to-emerald-600"
          trend={{ value: 12.3, direction: 'up' }}
        />
        <StatCard
          title="Tasa de Exito"
          value="99.4%"
          icon={CheckCircle2}
          color="from-blue-500 to-blue-600"
        />
        <StatCard
          title="Tiempo Ahorrado"
          value="847h"
          icon={Clock}
          color="from-purple-500 to-purple-600"
          subtitle="Este mes"
        />
      </div>

      {/* Lista de automatizaciones */}
      <div className="space-y-4">
        {automations.map((auto) => (
          <div key={auto.id} className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50 hover:border-indigo-500/50 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl ${
                  auto.estado === 'activo' ? 'bg-emerald-500/20' : 'bg-slate-600/50'
                }`}>
                  <Workflow className={`w-6 h-6 ${
                    auto.estado === 'activo' ? 'text-emerald-400' : 'text-slate-400'
                  }`} />
                </div>
                <div>
                  <h3 className="font-bold text-white flex items-center gap-2">
                    {auto.nombre}
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      auto.estado === 'activo' ? 'bg-emerald-500/20 text-emerald-400' :
                      auto.estado === 'pausado' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-slate-500/20 text-slate-400'
                    }`}>
                      {auto.estado}
                    </span>
                  </h3>
                  <p className="text-sm text-slate-400">{auto.descripcion}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white">
                  <Edit className="w-4 h-4" />
                </button>
                <button className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white">
                  {auto.estado === 'activo' ? <ToggleRight className="w-5 h-5 text-emerald-400" /> : <ToggleLeft className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-900/50 rounded-lg">
              <div>
                <p className="text-xs text-slate-500 mb-1">Trigger</p>
                <code className="text-xs text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded">
                  {auto.trigger}
                </code>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Ejecuciones</p>
                <p className="font-bold text-white">{auto.ejecuciones.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Tasa Exito</p>
                <p className="font-bold text-emerald-400">{auto.tasaExito}%</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Ultima Ejecucion</p>
                <p className="text-sm text-slate-300">
                  {new Date(auto.ultimaEjecucion).toLocaleString('es-CO')}
                </p>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <p className="text-xs text-slate-500">Acciones:</p>
              {auto.acciones.map((accion, idx) => (
                <span key={idx} className="px-2 py-0.5 bg-slate-700/50 rounded text-xs text-slate-300">
                  {accion}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

type EnterpriseTab =
  | 'command-center'
  | 'empresas'
  | 'analytics'
  | 'compliance'
  | 'security'
  | 'users'
  | 'automation'
  | 'api'
  | 'billing';

export const EnterpriseAdminDashboard: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<EnterpriseTab>('command-center');

  // Datos
  const [stats] = useState(generarEstadisticasGlobales);
  const [empresas] = useState(generarEmpresas);
  const [alertas] = useState(generarAlertas);
  const [complianceRules] = useState(generarComplianceRules);

  // Autenticacion
  const handleLogin = () => {
    if (password === 'Enterprise2025!') {
      setIsAuthenticated(true);
      setError('');
      localStorage.setItem('enterprise_admin_token', 'enterprise_' + Date.now());
    } else {
      setError('Credenciales invalidas');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('enterprise_admin_token');
  };

  // Verificar token al cargar
  useEffect(() => {
    const token = localStorage.getItem('enterprise_admin_token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  // Pantalla de login
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl p-8 border border-indigo-500/20 shadow-2xl shadow-indigo-500/10">
            {/* Logo */}
            <div className="text-center mb-8">
              <div className="w-24 h-24 mx-auto mb-6 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl transform rotate-6 shadow-xl shadow-amber-500/30" />
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center">
                  <Crown className="w-12 h-12 text-white" />
                </div>
              </div>
              <h1 className="text-3xl font-black text-white mb-2">
                ENTERPRISE <span className="text-amber-400">ADMIN</span>
              </h1>
              <p className="text-indigo-300">Centro de Administracion Global</p>
              <div className="flex items-center justify-center gap-2 mt-3">
                <span className="px-3 py-1 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-bold rounded-full">
                  TOP GLOBAL
                </span>
                <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 text-xs font-bold rounded-full">
                  v4.0
                </span>
              </div>
            </div>

            {/* Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-indigo-200 mb-2">
                  Contrasena Enterprise
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                    placeholder="••••••••••••"
                    className="w-full px-4 py-4 pl-12 bg-slate-800/50 border border-indigo-500/30 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  />
                  <Lock className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <button
                onClick={handleLogin}
                className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold rounded-xl transition-all shadow-xl shadow-amber-500/30 flex items-center justify-center gap-2"
              >
                <Crown className="w-5 h-5" />
                Acceder al Enterprise Admin
              </button>
            </div>

            <p className="text-center text-xs text-indigo-400/50 mt-6">
              Acceso restringido - Solo administradores globales
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Tabs de navegacion
  const tabs: { id: EnterpriseTab; label: string; icon: React.ElementType; color: string }[] = [
    { id: 'command-center', label: 'Command Center', icon: LayoutDashboard, color: 'from-amber-500 to-amber-600' },
    { id: 'empresas', label: 'Multi-Empresa', icon: Building2, color: 'from-indigo-500 to-indigo-600' },
    { id: 'analytics', label: 'Analytics Global', icon: BarChart3, color: 'from-purple-500 to-purple-600' },
    { id: 'compliance', label: 'Compliance', icon: ShieldCheck, color: 'from-emerald-500 to-emerald-600' },
    { id: 'security', label: 'Security SOC', icon: Shield, color: 'from-red-500 to-red-600' },
    { id: 'users', label: 'Usuarios', icon: Users, color: 'from-blue-500 to-blue-600' },
    { id: 'automation', label: 'Automatizacion', icon: Workflow, color: 'from-cyan-500 to-cyan-600' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl shadow-lg shadow-amber-500/30">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black text-white flex items-center gap-2">
                  LITPER <span className="text-amber-400">ENTERPRISE</span>
                  <span className="px-2 py-0.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-bold rounded-full">
                    GLOBAL
                  </span>
                </h1>
                <p className="text-xs text-slate-400">Sistema de Administracion Empresarial TOP GLOBAL</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                Sistema Online
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Salir
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-800 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1 overflow-x-auto pb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 whitespace-nowrap border-b-2 transition-all ${
                  activeTab === tab.id
                    ? 'border-amber-500 text-white'
                    : 'border-transparent text-slate-400 hover:text-white hover:border-slate-600'
                }`}
              >
                <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-amber-400' : ''}`} />
                <span className="font-medium text-sm">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'command-center' && <CommandCenterModule stats={stats} alertas={alertas} />}
        {activeTab === 'empresas' && <MultiEnterpriseModule empresas={empresas} />}
        {activeTab === 'analytics' && <GlobalAnalyticsModule />}
        {activeTab === 'compliance' && <ComplianceModule rules={complianceRules} />}
        {activeTab === 'security' && <SecurityModule />}
        {activeTab === 'users' && <UserManagementModule />}
        {activeTab === 'automation' && <AutomationModule />}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-800 bg-slate-900/50 mt-8">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <p>LITPER Enterprise Admin v4.0 - Sistema de Administracion Global</p>
            <p>Ultimo sync: {new Date().toLocaleString('es-CO')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnterpriseAdminDashboard;
