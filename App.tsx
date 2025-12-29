import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Shipment, ShipmentStatus, CarrierName, AITrackingResult } from './types';
import { MainTabNew, SemaforoExcelData } from './types/logistics';
import { Country } from './types/country';
import {
  detectCarrier,
  saveShipments,
  loadShipments,
  parseDetailedInput,
  exportToExcel,
  mergePhoneNumbers,
  exportSessionData,
  importSessionData,
  parseSummaryInput,
  parsePhoneRegistry,
} from './services/logisticsService';
import { getSelectedCountry, hasSelectedCountry } from './services/countryService';
import { getUserProfile } from './services/gamificationService';
import { useShipmentExcelParser } from './hooks/useShipmentExcelParser';
import {
  TabNavigationNew,
  SeguimientoTab,
  SemaforoTabNew,
  PrediccionesTab,
  MLSystemTab,
  DemandTab,
  GamificationTab,
  ProcesosLitperTab,
  CentroNegocioTab,
} from './components/tabs';
import { CiudadAgentesTab } from './components/tabs/CiudadAgentesTab';
import { InteligenciaLogisticaTab } from './components/tabs/InteligenciaLogisticaTab';
import { TrackingOrdenesTab } from './components/tabs/TrackingOrdenesTab';
import { AsistenteIAUnificado } from './components/tabs/AsistenteIAUnificado';
// Nuevos tabs unificados
import { OperacionesUnificadoTab } from './components/tabs/OperacionesUnificadoTab';
import { InteligenciaIAUnificadoTab } from './components/tabs/InteligenciaIAUnificadoTab';
import { AnalisisUnificadoTab } from './components/tabs/AnalisisUnificadoTab';
import { ProBubbleV4 } from './components/ProAssistant';
import UniversalSearch from './components/search/UniversalSearch';
// Cerebro IA - Dashboard con Chatea Pro, Webhooks y Analytics
import { AIBrainDashboard } from './components/brain/AIBrainDashboard';
import { AuthWrapper, UserProfilePanel } from './components/auth';
import { EnhancedGuideTable } from './components/tables';
import { AdminPanelPro } from './components/Admin/AdminPanelPro';
import CountrySelector from './components/CountrySelector';
// Chat-First Design System
import { ChatCommandCenter } from './components/ChatFirst';
import { detectarGuiasRetrasadas } from './utils/patternDetection';
import {
  Crown,
  Search,
  Moon,
  Sun,
  Download,
  Save,
  Upload,
  Wifi,
  WifiOff,
  List,
  FileText,
  Smartphone,
  LayoutList,
  FileSpreadsheet,
  FileUp,
  AlertTriangle,
  CheckCircle,
  X,
  Home,
  Globe,
  Trophy,
  Package,
  TrendingUp,
  ChevronDown,
  Menu,
  Bell,
  User,
  Settings,
  HelpCircle,
  BarChart3,
  Clock,
  MapPin,
  Shield,
  Sparkles,
  ArrowRight,
  Activity,
  Target,
  Brain,
  Bot,
  Truck,
  Box,
  DollarSign,
  Users,
  Star,
  ChevronRight,
  Layers,
  PieChart,
  LineChart,
  Calendar,
} from 'lucide-react';

// ============================================
// PREMIUM HOMEPAGE DASHBOARD COMPONENT
// ============================================
interface DashboardProps {
  shipments: Shipment[];
  onNavigate: (tab: MainTabNew) => void;
  country: Country;
  userProfile: any;
}

const PremiumDashboard: React.FC<DashboardProps> = ({ shipments, onNavigate, country, userProfile }) => {
  const stats = useMemo(() => {
    const total = shipments.length;
    const delivered = shipments.filter(s => s.status === ShipmentStatus.DELIVERED).length;
    const inTransit = shipments.filter(s => s.status === ShipmentStatus.IN_TRANSIT).length;
    const pending = shipments.filter(s => s.status === ShipmentStatus.PENDING).length;
    const issues = shipments.filter(s => s.status === ShipmentStatus.EXCEPTION || s.status === ShipmentStatus.RETURNED).length;
    const deliveryRate = total > 0 ? Math.round((delivered / total) * 100) : 0;

    return { total, delivered, inTransit, pending, issues, deliveryRate };
  }, [shipments]);

  const quickActions = [
    { id: 'seguimiento', icon: Package, label: 'Seguimiento', desc: 'Rastrear envíos', color: 'from-emerald-500 to-teal-600', emoji: '📦' },
    { id: 'demanda', icon: TrendingUp, label: 'Predicción IA', desc: 'Análisis predictivo', color: 'from-purple-500 to-violet-600', emoji: '📈', isNew: true },
    { id: 'inteligencia-logistica', icon: BarChart3, label: 'Intel. Logística', desc: 'Inteligencia operativa', color: 'from-cyan-500 to-blue-600', emoji: '📊', isNew: true },
    { id: 'ml', icon: Brain, label: 'Sistema ML', desc: 'Machine Learning', color: 'from-cyan-600 to-indigo-600', emoji: '🧠' },
  ];

  const features = [
    { id: 'semaforo', icon: Activity, label: 'Semáforo', desc: 'Control de entregas en tiempo real', color: 'bg-amber-500' },
    { id: 'predicciones', icon: Target, label: 'Análisis', desc: 'Estadísticas y métricas avanzadas', color: 'bg-teal-500' },
    { id: 'reporte', icon: BarChart3, label: 'Reporte IA', desc: 'Informes inteligentes automatizados', color: 'bg-blue-500' },
    { id: 'asistente', icon: Bot, label: 'Asistente IA', desc: 'Soporte inteligente 24/7', color: 'bg-pink-500' },
    { id: 'gamificacion', icon: Trophy, label: 'Logros', desc: 'Sistema de recompensas', color: 'bg-indigo-500' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-navy-900 via-navy-800 to-corporate-900 p-8 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-accent-500/20 to-transparent rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-corporate-500/20 to-transparent rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-4xl">👑</span>
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold">
                  Bienvenido a <span className="bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">LITPER PRO</span>
                </h1>
                <p className="text-slate-300 text-lg">Plataforma Enterprise de Logística con IA</p>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full backdrop-blur">
                <MapPin className="w-4 h-4 text-accent-400" />
                <span className="font-medium">{country}</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full">
                <Trophy className="w-4 h-4 text-yellow-400" />
                <span className="font-bold">{userProfile.totalXP} XP</span>
                <span className="text-xs text-slate-300">Nivel {userProfile.level}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="text-center px-6 py-4 bg-white/10 rounded-2xl backdrop-blur">
              <p className="text-4xl font-bold text-accent-400">{stats.total}</p>
              <p className="text-sm text-slate-300">Envíos Totales</p>
            </div>
            <div className="text-center px-6 py-4 bg-white/10 rounded-2xl backdrop-blur">
              <p className="text-4xl font-bold text-emerald-400">{stats.deliveryRate}%</p>
              <p className="text-sm text-slate-300">Tasa de Entrega</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Envíos', value: stats.total, icon: Box, color: 'bg-slate-600', textColor: 'text-slate-600', emoji: '📊' },
          { label: 'Entregados', value: stats.delivered, icon: CheckCircle, color: 'bg-emerald-500', textColor: 'text-emerald-600', emoji: '✅' },
          { label: 'En Tránsito', value: stats.inTransit, icon: Truck, color: 'bg-blue-500', textColor: 'text-blue-600', emoji: '🚚' },
          { label: 'Pendientes', value: stats.pending, icon: Clock, color: 'bg-amber-500', textColor: 'text-amber-600', emoji: '⏳' },
          { label: 'Incidencias', value: stats.issues, icon: AlertTriangle, color: 'bg-red-500', textColor: 'text-red-600', emoji: '⚠️' },
        ].map((stat, idx) => (
          <div key={idx} className="card-premium bg-white dark:bg-navy-900 rounded-2xl p-5 shadow-card border border-slate-100 dark:border-navy-800">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{stat.label}</p>
                <p className={`text-3xl font-bold ${stat.textColor} dark:text-white`}>{stat.value}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-xl text-white`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs text-slate-400">
              <span>{stat.emoji}</span>
              <span>Actualizado ahora</span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions - Main Features */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-accent-500" />
              Acciones Rápidas
            </h2>
            <p className="text-slate-500 dark:text-slate-400">Accede a las funciones principales</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={() => onNavigate(action.id as MainTabNew)}
              className="group relative overflow-hidden rounded-2xl p-6 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-90 group-hover:opacity-100 transition-opacity`} />
              <div className="relative z-10 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur">
                    <action.icon className="w-7 h-7" />
                  </div>
                  {action.isNew && (
                    <span className="px-3 py-1 bg-white text-xs font-bold rounded-full text-slate-800 animate-bounce-subtle">
                      ✨ NUEVO
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold mb-1">{action.emoji} {action.label}</h3>
                <p className="text-sm text-white/80">{action.desc}</p>
                <div className="mt-4 flex items-center gap-2 text-sm font-medium">
                  <span>Acceder</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* All Features Grid */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Layers className="w-6 h-6 text-corporate-500" />
              Todas las Herramientas
            </h2>
            <p className="text-slate-500 dark:text-slate-400">Explora todas las funcionalidades disponibles</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {features.map((feature) => (
            <button
              key={feature.id}
              onClick={() => onNavigate(feature.id as MainTabNew)}
              className="card-premium group bg-white dark:bg-navy-900 rounded-2xl p-5 text-left shadow-card border border-slate-100 dark:border-navy-800 hover:border-corporate-300 dark:hover:border-corporate-700"
            >
              <div className={`${feature.color} w-12 h-12 rounded-xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}>
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 dark:text-white mb-1">{feature.label}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{feature.desc}</p>
              <div className="mt-3 flex items-center gap-1 text-corporate-500 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                <span>Abrir</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Info Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-gradient-to-r from-corporate-600 to-corporate-700 rounded-2xl p-6 text-white">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">🔒 Plataforma Segura y Confiable</h3>
              <p className="text-corporate-100 text-sm">
                LITPER utiliza tecnología de punta con inteligencia artificial para garantizar
                el seguimiento preciso de tus envíos. Más de 10,000 empresas confían en nosotros.
              </p>
              <div className="mt-4 flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="text-sm font-medium">4.9/5 Rating</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span className="text-sm font-medium">10K+ Usuarios</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-accent-500 to-accent-600 rounded-2xl p-6 text-white">
          <div className="flex flex-col h-full justify-between">
            <div>
              <p className="text-accent-100 text-sm font-medium mb-1">💎 LITPER PREMIUM</p>
              <h3 className="text-2xl font-bold">Sistema Pro v4.0</h3>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center text-sm">🚀</div>
                <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center text-sm">🤖</div>
                <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center text-sm">📊</div>
              </div>
              <span className="text-sm">+50 funciones IA</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// MAIN APP COMPONENT
// ============================================
const App: React.FC = () => {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [phoneRegistry, setPhoneRegistry] = useState<Record<string, string>>({});

  // Country selection
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [showCountrySelector, setShowCountrySelector] = useState(false);

  // Main tab navigation
  const [currentTab, setCurrentTab] = useState<MainTabNew | 'home'>('home');
  const [showDataInput, setShowDataInput] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Input state
  const [activeInputTab, setActiveInputTab] = useState<'PHONES' | 'REPORT' | 'SUMMARY' | 'EXCEL'>('PHONES');
  const [inputCarrier, setInputCarrier] = useState<CarrierName | 'AUTO'>('AUTO');
  const [inputText, setInputText] = useState('');

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showUniversalSearch, setShowUniversalSearch] = useState(false);

  // Excel parser hook
  const {
    parseExcelFile,
    isLoading: isExcelLoading,
    xlsxLoaded,
  } = useShipmentExcelParser();

  // Load data on mount
  useEffect(() => {
    const savedCountry = getSelectedCountry();
    // Usar Colombia por defecto si no hay país guardado
    setSelectedCountry(savedCountry || 'CO');
    setShowCountrySelector(false);

    const data = loadShipments();
    if (data.length > 0) {
      setShipments(data);
    }
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDarkMode(true);
    }

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Keyboard shortcut: Ctrl+K para búsqueda universal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowUniversalSearch(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    saveShipments(shipments);
  }, [shipments]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleCountrySelected = (country: Country) => {
    setSelectedCountry(country);
    setShowCountrySelector(false);
  };

  const userProfile = getUserProfile();

  const guiasRetrasadas = detectarGuiasRetrasadas(shipments);
  const alertasCriticas = guiasRetrasadas.filter((g) => g.nivelAlerta === 'CRITICO').length;

  const tabNotifications = {
    seguimiento: alertasCriticas,
    demanda: 0,
    gamificacion: userProfile.activeChallenges.filter(c => !c.completed).length,
    'inteligencia-logistica': guiasRetrasadas.filter(g => g.diasSinMovimiento > 5).length,
    semaforo: 0,
    predicciones: 0,
    reporte: 0,
    asistente: 0,
    ml: 0,
    'procesos-litper': 0,
    'ciudad-agentes': 0,
    'aprendizaje-ia': 0,
    'cerebro-ia': 0,
  };

  const handleProcessInput = () => {
    if (!inputText.trim()) return;

    const forcedCarrier = inputCarrier !== 'AUTO' ? inputCarrier : undefined;

    if (activeInputTab === 'PHONES') {
      const newPhones = parsePhoneRegistry(inputText);
      setPhoneRegistry((prev) => ({ ...prev, ...newPhones }));
      const mergedShipments = mergePhoneNumbers(inputText, shipments);
      const countDiff = mergedShipments.filter((s) => s.phone).length - shipments.filter((s) => s.phone).length;
      setShipments(mergedShipments);

      if (Object.keys(newPhones).length > 0) {
        setNotification(`✅ ${Object.keys(newPhones).length} celulares registrados. ${countDiff > 0 ? countDiff + ' guías actualizadas.' : ''}`);
        setInputText('');
        setActiveInputTab('REPORT');
      } else {
        setNotification('⚠️ No se encontraron celulares válidos.');
      }
    } else if (activeInputTab === 'REPORT') {
      const { shipments: newShipments } = parseDetailedInput(inputText, phoneRegistry, forcedCarrier);
      if (newShipments.length > 0) {
        setShipments((prev) => {
          const ids = new Set(newShipments.map((s) => s.id));
          return [...prev.filter((s) => !ids.has(s.id)), ...newShipments];
        });
        setNotification(`✅ ${newShipments.length} guías cargadas exitosamente`);
        setInputText('');
        setActiveInputTab('SUMMARY');
      } else {
        setNotification('⚠️ No se detectaron guías en el reporte');
      }
    } else if (activeInputTab === 'SUMMARY') {
      const { shipments: newSummaryShipments } = parseSummaryInput(inputText, phoneRegistry, shipments, forcedCarrier);
      if (newSummaryShipments.length > 0) {
        setShipments((prev) => [...prev, ...newSummaryShipments]);
        setNotification(`✅ ${newSummaryShipments.length} guías nuevas añadidas`);
        setInputText('');
        setShowDataInput(false);
      } else {
        setNotification('ℹ️ No se encontraron guías nuevas');
        setInputText('');
      }
    }
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await parseExcelFile(file, phoneRegistry);

    if (result.success && result.shipments.length > 0) {
      setShipments((prev) => {
        const ids = new Set(result.shipments.map((s) => s.id));
        return [...prev.filter((s) => !ids.has(s.id)), ...result.shipments];
      });
      setNotification(`✅ ${result.shipments.length} guías cargadas desde Excel`);
      setShowDataInput(false);
    } else if (result.error) {
      setNotification(`❌ Error: ${result.error}`);
    }
    e.target.value = '';
  };

  const handleDownloadExcel = () => exportToExcel(shipments);
  const handleExportSession = () => exportSessionData(shipments);

  const handleImportSession = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const loadedData = await importSessionData(file);
        setShipments(loadedData);
        setNotification(`✅ Sesión cargada: ${loadedData.length} guías`);
      } catch (err) {
        setNotification('❌ Error cargando sesión');
      }
    }
  };

  const handleSemaforoDataLoaded = (data: SemaforoExcelData) => {
    setNotification('✅ Datos del semáforo cargados');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* ============================================ */}
      {/* PREMIUM HEADER - Amazon Style */}
      {/* ============================================ */}
      <header className="sticky top-0 z-50">
        {/* Top Bar */}
        <div className="bg-gradient-to-r from-navy-900 via-navy-800 to-navy-900 text-white">
          <div className="max-w-[1600px] mx-auto px-4 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo Section */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setCurrentTab('home')}
                  className="flex items-center gap-3 hover:opacity-90 transition-opacity group"
                >
                  <div className="relative">
                    <div className="bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600 p-2.5 rounded-xl shadow-lg shadow-yellow-500/30 group-hover:shadow-yellow-500/50 transition-all">
                      <Crown className="w-6 h-6 text-white drop-shadow-lg" />
                      {/* Destellos del logo */}
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full animate-ping opacity-75" />
                      <div className="absolute -top-0.5 -left-0.5 w-1.5 h-1.5 bg-yellow-200 rounded-full animate-pulse" />
                      <div className="absolute -bottom-0.5 -right-0.5 w-1 h-1 bg-yellow-300 rounded-full animate-pulse delay-150" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-navy-900 animate-pulse" />
                    {/* Brillos adicionales */}
                    <div className="absolute top-0 left-1/2 w-8 h-8 bg-gradient-to-b from-yellow-300/30 to-transparent rounded-full blur-sm -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <div className="hidden sm:block">
                    <h1 className="text-xl font-bold tracking-tight">
                      LITPER<span className="bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent"> PRO</span>
                    </h1>
                    <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase -mt-0.5">
                      👑 Enterprise Logistics
                    </p>
                  </div>
                </button>
              </div>

              {/* Center Search Bar */}
              <div className="hidden md:flex flex-1 max-w-xl mx-8">
                <div className="relative w-full">
                  <input
                    type="text"
                    placeholder="🔍 Buscar guías, clientes, transportadoras..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-11 pl-5 pr-14 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:bg-white/15 focus:border-accent-400 focus:outline-none transition-all text-sm"
                  />
                  <button className="absolute right-1 top-1 h-9 px-4 bg-gradient-to-r from-accent-500 to-accent-600 text-white rounded-lg font-medium text-sm hover:from-accent-600 hover:to-accent-700 transition-all">
                    <Search className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Right Actions */}
              <div className="flex items-center gap-2 lg:gap-3">
                {/* Country Selector */}
                <button
                  onClick={() => setShowCountrySelector(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/15 rounded-lg text-sm transition-all border border-white/10"
                >
                  <Globe className="w-4 h-4 text-accent-400" />
                  <span className="hidden lg:inline text-slate-300">{selectedCountry}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {/* XP Badge */}
                <button
                  onClick={() => setCurrentTab('gamificacion')}
                  className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-lg text-sm font-bold transition-all shadow-lg"
                >
                  <Trophy className="w-4 h-4 text-yellow-400" />
                  <span className="hidden sm:inline">{userProfile.totalXP}</span>
                  <span className="text-xs text-purple-200">XP</span>
                </button>

                {/* Load Data Button */}
                <button
                  onClick={() => setShowDataInput(!showDataInput)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                    showDataInput
                      ? 'bg-accent-500 text-white'
                      : 'bg-white/10 text-white border border-white/20 hover:bg-white/15'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  <span className="hidden lg:inline">{showDataInput ? 'Cerrar' : 'Cargar'}</span>
                </button>

                {/* Session Controls */}
                <div className="hidden lg:flex items-center gap-1 bg-white/10 rounded-lg p-1">
                  <button
                    onClick={handleExportSession}
                    className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                    title="Guardar Sesión"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                  <label className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-md cursor-pointer transition-colors" title="Cargar Sesión">
                    <Download className="w-4 h-4" />
                    <input type="file" accept=".json" onChange={handleImportSession} className="hidden" />
                  </label>
                  {shipments.length > 0 && (
                    <button
                      onClick={handleDownloadExcel}
                      className="p-2 text-emerald-400 hover:text-emerald-300 hover:bg-white/10 rounded-md transition-colors"
                      title="Descargar Excel"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Dark Mode Toggle */}
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="p-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white transition-all"
                >
                  {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>

                {/* Mobile Menu */}
                <button
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="lg:hidden p-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-white"
                >
                  <Menu className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Bar */}
        <div className="bg-gradient-to-r from-navy-800 to-navy-700 border-t border-white/5">
          <div className="max-w-[1600px] mx-auto px-4 lg:px-8">
            <div className="flex items-center gap-1 h-12 overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setCurrentTab('home')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  currentTab === 'home'
                    ? 'bg-accent-500 text-white'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Home className="w-4 h-4" />
                <span>Inicio</span>
              </button>

              {[
                // Navegación simplificada: 6 tabs principales
                { id: 'operaciones', icon: Package, label: '📦 Operaciones', isNew: false },
                { id: 'inteligencia-ia', icon: Brain, label: '🧠 Inteligencia', isNew: false },
                { id: 'cerebro-ia', icon: Sparkles, label: '🤖 Cerebro IA', isNew: true },
                { id: 'negocio', icon: Users, label: '💼 Negocio', isNew: false },
                { id: 'admin', icon: Shield, label: '⚙️ Config', isNew: false },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id as MainTabNew)}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                    currentTab === item.id
                      ? 'bg-white/20 text-white'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span>{item.label}</span>
                  {item.isNew && (
                    <span className="px-1.5 py-0.5 text-[9px] font-bold bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full">
                      NEW
                    </span>
                  )}
                  {tabNotifications[item.id as MainTabNew] > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold bg-red-500 text-white rounded-full">
                      {tabNotifications[item.id as MainTabNew]}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-24 right-4 z-50 max-w-sm animate-slide-up">
          <div className="flex items-center gap-3 px-5 py-4 bg-white dark:bg-navy-800 rounded-xl shadow-2xl border border-slate-200 dark:border-navy-700">
            <div className="flex-shrink-0">
              {notification.includes('✅') ? (
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                </div>
              ) : notification.includes('❌') ? (
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <X className="w-5 h-5 text-red-600" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
              )}
            </div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{notification}</p>
            <button
              onClick={() => setNotification(null)}
              className="ml-auto p-1 hover:bg-slate-100 dark:hover:bg-navy-700 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-4 lg:px-8 py-8">
        {/* Data Input Section */}
        {showDataInput && (
          <section className="mb-8 bg-white dark:bg-navy-900 rounded-2xl shadow-xl border border-slate-200 dark:border-navy-800 overflow-hidden animate-slide-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-navy-800 bg-slate-50 dark:bg-navy-950">
              <div>
                <h2 className="font-bold text-lg text-slate-800 dark:text-white">📥 Centro de Carga de Datos</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Importa tus guías desde múltiples fuentes</p>
              </div>
              <button
                onClick={() => setShowDataInput(false)}
                className="p-2 hover:bg-slate-200 dark:hover:bg-navy-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Input tabs */}
            <div className="flex border-b border-slate-200 dark:border-navy-800">
              {[
                { id: 'PHONES', icon: Smartphone, label: '1. Celulares', color: 'emerald' },
                { id: 'REPORT', icon: FileText, label: '2. Reporte', color: 'orange' },
                { id: 'SUMMARY', icon: LayoutList, label: '3. Resumen', color: 'blue' },
                { id: 'EXCEL', icon: FileSpreadsheet, label: '4. Excel', color: 'purple' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveInputTab(tab.id as any)}
                  className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-all border-b-3 ${
                    activeInputTab === tab.id
                      ? `text-${tab.color}-600 border-${tab.color}-500 bg-${tab.color}-50 dark:bg-${tab.color}-900/10`
                      : 'text-slate-400 border-transparent hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-navy-800'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            {activeInputTab === 'EXCEL' ? (
              <div className="p-8">
                <div className="max-w-lg mx-auto text-center">
                  <div className="bg-gradient-to-br from-purple-500 to-blue-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-xl">
                    <FileUp className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                    📊 Importar desde Excel
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 mb-6">
                    Sube un archivo Excel (.xlsx, .xls) con tus guías
                  </p>

                  <label className={`inline-flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-lg cursor-pointer transition-all transform hover:scale-105 shadow-xl ${
                    isExcelLoading
                      ? 'bg-slate-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white'
                  }`}>
                    {isExcelLoading ? (
                      <>
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      <>
                        <FileUp className="w-6 h-6" />
                        Seleccionar Archivo
                      </>
                    )}
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleExcelUpload}
                      disabled={isExcelLoading}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            ) : (
              <div className="p-6">
                {(activeInputTab === 'REPORT' || activeInputTab === 'SUMMARY') && (
                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 uppercase">Transportadora:</span>
                    <button
                      onClick={() => setInputCarrier('AUTO')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        inputCarrier === 'AUTO'
                          ? 'bg-navy-800 text-white'
                          : 'bg-slate-100 dark:bg-navy-800 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      🔄 AUTO
                    </button>
                    {Object.values(CarrierName)
                      .filter((c) => c !== CarrierName.UNKNOWN)
                      .map((c) => (
                        <button
                          key={c}
                          onClick={() => setInputCarrier(c)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            inputCarrier === c
                              ? 'bg-accent-500 text-white'
                              : 'bg-slate-100 dark:bg-navy-800 text-slate-500 hover:bg-slate-200'
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                  </div>
                )}

                <div className="flex flex-col lg:flex-row gap-4">
                  <textarea
                    className="flex-1 h-48 border-2 border-dashed border-slate-300 dark:border-navy-700 rounded-xl p-4 font-mono text-sm focus:border-accent-500 focus:bg-accent-50/10 outline-none transition-all resize-none bg-slate-50 dark:bg-navy-950"
                    placeholder={
                      activeInputTab === 'PHONES'
                        ? '📱 Pegue aquí las columnas: [Guía] [Celular]...'
                        : activeInputTab === 'REPORT'
                          ? '📄 Pegue aquí el texto del reporte detallado...'
                          : '📋 Pegue aquí el resumen de 17TRACK...'
                    }
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                  />

                  <div className="lg:w-48 flex flex-col gap-3">
                    <button
                      onClick={handleProcessInput}
                      className={`w-full text-white px-6 py-4 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 ${
                        activeInputTab === 'REPORT'
                          ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700'
                          : activeInputTab === 'PHONES'
                            ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700'
                            : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                      }`}
                    >
                      {activeInputTab === 'PHONES' ? '📱 Guardar' : activeInputTab === 'REPORT' ? '📄 Cargar' : '📋 Procesar'}
                    </button>
                    {activeInputTab === 'PHONES' && (
                      <p className="text-xs text-center text-slate-400">
                        📊 Registrados: {Object.keys(phoneRegistry).length}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Tab Content */}
        <div className="min-h-[600px]">
          {/* ====================================== */}
          {/* CHAT-FIRST COMMAND CENTER (NEW) */}
          {/* ====================================== */}
          {currentTab === 'home' && (
            <ChatCommandCenter
              shipments={shipments}
              criticalCities={[]} // TODO: Connect to real critical cities data
              onNavigateToTab={(tab) => setCurrentTab(tab as MainTabNew)}
              onRefreshData={() => {
                // Trigger data refresh
                setNotification('Datos actualizados');
              }}
            />
          )}

          {/* ====================================== */}
          {/* DASHBOARD CLASICO (Legacy - accesible desde menu) */}
          {/* ====================================== */}
          {currentTab === 'dashboard-legacy' && (
            <PremiumDashboard
              shipments={shipments}
              onNavigate={(tab) => setCurrentTab(tab)}
              country={selectedCountry}
              userProfile={userProfile}
            />
          )}

          {/* ====================================== */}
          {/* CENTRO DE NEGOCIO - HERRAMIENTAS OPERATIVAS */}
          {/* ====================================== */}
          {currentTab === 'negocio' && <CentroNegocioTab />}

          {/* ====================================== */}
          {/* NUEVOS TABS UNIFICADOS */}
          {/* ====================================== */}
          {currentTab === 'operaciones' && (
            <OperacionesUnificadoTab
              shipments={shipments}
              onShipmentsLoaded={(newShipments) => setShipments(newShipments)}
              onSemaforoDataLoaded={handleSemaforoDataLoaded}
            />
          )}
          {currentTab === 'inteligencia-ia' && (
            <InteligenciaIAUnificadoTab
              shipments={shipments}
              selectedCountry={selectedCountry}
            />
          )}
          {currentTab === 'analisis' && (
            <AnalisisUnificadoTab
              shipments={shipments}
              selectedCountry={selectedCountry}
            />
          )}
          {currentTab === 'cerebro-ia' && <AIBrainDashboard />}
          {currentTab === 'procesos-litper' && <ProcesosLitperTab selectedCountry={selectedCountry} />}
          {currentTab === 'admin' && <AdminPanelPro />}

          {/* ====================================== */}
          {/* LEGACY TABS (Para compatibilidad) */}
          {/* ====================================== */}
          {currentTab === 'seguimiento' && (
            <SeguimientoTab
              shipments={shipments}
              onRestoreShipments={(restoredShipments) => setShipments(restoredShipments)}
            />
          )}
          {currentTab === 'demanda' && <DemandTab country={selectedCountry} />}
          {currentTab === 'gamificacion' && <GamificationTab />}
          {currentTab === 'semaforo' && <SemaforoTabNew onDataLoaded={handleSemaforoDataLoaded} />}
          {currentTab === 'predicciones' && <PrediccionesTab shipments={shipments} />}
          {currentTab === 'asistente' && <AsistenteIAUnificado shipments={shipments} />}
          {currentTab === 'ml' && <MLSystemTab />}
          {currentTab === 'ciudad-agentes' && <CiudadAgentesTab selectedCountry={selectedCountry} />}
          {currentTab === 'inteligencia-logistica' && <InteligenciaLogisticaTab />}
          {currentTab === 'tracking-ordenes' && <TrackingOrdenesTab />}
        </div>
      </main>

      {/* ============================================ */}
      {/* PREMIUM FOOTER */}
      {/* ============================================ */}
      <footer className="bg-gradient-to-r from-navy-900 via-navy-800 to-navy-900 text-white border-t border-navy-700 mt-16">
        <div className="max-w-[1600px] mx-auto px-4 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="relative bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600 p-2.5 rounded-xl shadow-lg shadow-yellow-500/20">
                  <Crown className="w-6 h-6 text-white drop-shadow" />
                  <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-white rounded-full animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">LITPER<span className="bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent"> PRO</span></h3>
                  <p className="text-xs text-slate-400">👑 Enterprise Logistics</p>
                </div>
              </div>
              <p className="text-sm text-slate-400 mb-4">
                Plataforma enterprise de gestión logística inteligente con IA para empresas de alto rendimiento.
              </p>
              <div className="flex items-center gap-2">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${
                  isOnline
                    ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-700'
                    : 'bg-red-900/30 text-red-400 border border-red-700'
                }`}>
                  {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                  {isOnline ? '🟢 Conectado' : '🔴 Offline'}
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-bold text-white mb-4">🚀 Plataforma</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><button onClick={() => setCurrentTab('seguimiento')} className="hover:text-accent-400 transition-colors">📦 Seguimiento</button></li>
                <li><button onClick={() => setCurrentTab('demanda')} className="hover:text-accent-400 transition-colors">📈 Predicción</button></li>
                <li><button onClick={() => setCurrentTab('inteligencia-logistica')} className="hover:text-accent-400 transition-colors">📊 Intel. Logística</button></li>
                <li><button onClick={() => setCurrentTab('ml')} className="hover:text-accent-400 transition-colors">🧠 Sistema ML</button></li>
              </ul>
            </div>

            {/* Tools */}
            <div>
              <h4 className="font-bold text-white mb-4">🛠️ Herramientas</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><button onClick={() => setCurrentTab('semaforo')} className="hover:text-accent-400 transition-colors">🚦 Semáforo</button></li>
                <li><button onClick={() => setCurrentTab('predicciones')} className="hover:text-accent-400 transition-colors">🎯 Análisis</button></li>
                <li><button onClick={() => setCurrentTab('asistente')} className="hover:text-accent-400 transition-colors">🤖 Asistente IA</button></li>
              </ul>
            </div>

            {/* Stats */}
            <div>
              <h4 className="font-bold text-white mb-4">📊 Tu Sesión</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Guías cargadas</span>
                  <span className="font-bold text-accent-400">{shipments.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Nivel XP</span>
                  <span className="font-bold text-purple-400">{userProfile.level}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Puntos totales</span>
                  <span className="font-bold text-yellow-400">{userProfile.totalXP} XP</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-navy-700 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-500">
              © 2025 LITPER PRO Enterprise Logistics. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-4">
              <span className="text-xs text-slate-500">Sistema Enterprise v5.0</span>
              <span className="text-xs px-2 py-1 bg-gradient-to-r from-yellow-500 to-amber-500 text-white rounded-full font-bold flex items-center gap-1">
                👑 ENTERPRISE
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* Búsqueda Universal (Ctrl+K) */}
      <UniversalSearch
        shipments={shipments}
        isOpen={showUniversalSearch}
        onClose={() => setShowUniversalSearch(false)}
        onNavigate={(tab) => setCurrentTab(tab as MainTabNew | 'home')}
      />

      {/* Floating AI Assistant PRO Button - V4 con Chat IA y Modos */}
      <ProBubbleV4
        shipments={shipments}
        onNavigateToTab={(tab) => setCurrentTab(tab as MainTabNew)}
        onExportData={handleDownloadExcel}
      />
    </div>
  );
};

// Exportar App envuelto en AuthWrapper para requerir autenticación
const AppWithAuth: React.FC = () => (
  <AuthWrapper>
    <App />
  </AuthWrapper>
);

export default AppWithAuth;
