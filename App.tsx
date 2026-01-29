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
import GoogleSheetsTab from './components/tabs/GoogleSheetsTab';
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
// Nuevo Layout con Sidebar estilo ChatGPT
import { AppLayout } from './components/layout';
import { useLayoutStore } from './stores/layoutStore';
// Marketing Tracking System
import { MarketingView } from './components/marketing';
// Auth service for logout
import { logout as authLogout, getCurrentUser } from './services/authService';
// User Profile & Onboarding
import { UserOnboarding } from './components/onboarding';
import { useUserProfileStore } from './services/userProfileService';
import { UserProfileSettings } from './components/settings';
// Enhanced Excel Upload with column config
import { EnhancedExcelUpload } from './components/upload';
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

  // Main tab navigation (legacy support)
  const [currentTab, setCurrentTab] = useState<MainTabNew | 'home'>('home');
  const [showDataInput, setShowDataInput] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Nuevo sistema de navegación con Sidebar
  const {
    activeSection,
    setActiveSection,
    activeOperacionesTab,
    setOperacionesTab,
    activeInteligenciaTab,
    setInteligenciaTab,
    activeCerebroIATab,
    setCerebroIATab,
    activeNegocioTab,
    setNegocioTab,
    activeInicioTab,
    setInicioTab,
  } = useLayoutStore();

  // Estado para mostrar/ocultar el chat IA (ProBubble)
  const [showProBubble, setShowProBubble] = useState(false);
  const [showNotificationsPanel, setShowNotificationsPanel] = useState(false);
  const [showUserSettings, setShowUserSettings] = useState(false);

  // User Profile Store
  const { profile, isOnboardingComplete } = useUserProfileStore();

  // Obtener usuario actual
  const currentUser = getCurrentUser();

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
    if (savedCountry) {
      setSelectedCountry(savedCountry);
      setShowCountrySelector(false);
    } else {
      setShowCountrySelector(true);
    }

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
    try {
      saveShipments(shipments);
    } catch (error) {
      console.error('Error guardando shipments:', error);
      // Si el almacenamiento está lleno, mostrar notificación
      if (error instanceof Error && error.message.includes('lleno')) {
        setNotification('⚠️ Almacenamiento lleno. Exporta tus datos para liberar espacio.');
      }
    }
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

    try {
      const result = await parseExcelFile(file, phoneRegistry);

      if (result.success && result.shipments.length > 0) {
        // Limitar la cantidad de guías para evitar problemas de memoria
        const maxGuias = 5000;
        const guiasToAdd = result.shipments.slice(0, maxGuias);

        if (result.shipments.length > maxGuias) {
          setNotification(`⚠️ Se cargaron las primeras ${maxGuias} guías de ${result.shipments.length}. Exporta los datos antes de cargar más.`);
        }

        setShipments((prev) => {
          const ids = new Set(guiasToAdd.map((s) => s.id));
          return [...prev.filter((s) => !ids.has(s.id)), ...guiasToAdd];
        });

        if (result.shipments.length <= maxGuias) {
          setNotification(`✅ ${guiasToAdd.length} guías cargadas desde Excel`);
        }
        setShowDataInput(false);
      } else if (result.error) {
        setNotification(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error cargando Excel:', error);
      setNotification('❌ Error inesperado al procesar el archivo. Intenta con un archivo más pequeño.');
    } finally {
      e.target.value = '';
    }
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

  // Handler para logout
  const handleLogout = () => {
    authLogout();
    window.location.reload();
  };

  // Handler para abrir chat IA
  const handleOpenChat = () => {
    setShowProBubble(true);
  };

  // Handler para abrir ayuda
  const handleOpenHelp = () => {
    // El modal de ayuda se maneja dentro del Sidebar
  };

  // Handler para notificaciones
  const handleNotificationsClick = () => {
    setShowNotificationsPanel(!showNotificationsPanel);
    setNotification('📬 Panel de notificaciones');
  };

  // Mostrar selector de país si no hay país seleccionado
  if (showCountrySelector || !selectedCountry) {
    return <CountrySelector onCountrySelected={handleCountrySelected} />;
  }

  // Mostrar onboarding si el usuario no ha completado el registro
  if (!isOnboardingComplete) {
    return (
      <UserOnboarding
        country={selectedCountry}
        onComplete={() => {
          // El onboarding se marca como completado automáticamente
          // cuando el usuario termina el flujo
        }}
      />
    );
  }

  // Función para renderizar contenido según la sección activa del sidebar
  const renderSidebarContent = () => {
    switch (activeSection) {
      case 'inicio':
        return (
          <ChatCommandCenter
            shipments={shipments}
            criticalCities={[]}
            onNavigateToTab={(tab) => setCurrentTab(tab as MainTabNew)}
            onRefreshData={() => setNotification('Datos actualizados')}
          />
        );
      case 'operaciones':
        // Si está seleccionado Google Sheets, mostrar ese tab directamente
        if (activeOperacionesTab === 'google-sheets') {
          return <GoogleSheetsTab shipments={shipments} />;
        }
        return (
          <OperacionesUnificadoTab
            shipments={shipments}
            onShipmentsLoaded={(newShipments) => setShipments(newShipments)}
            onSemaforoDataLoaded={handleSemaforoDataLoaded}
            activeSubTab={activeOperacionesTab}
            onSubTabChange={setOperacionesTab}
          />
        );
      case 'inteligencia':
        return (
          <InteligenciaIAUnificadoTab
            shipments={shipments}
            selectedCountry={selectedCountry}
            activeSubTab={activeInteligenciaTab}
            onSubTabChange={setInteligenciaTab}
          />
        );
      case 'cerebro-ia':
        return (
          <AIBrainDashboard
            activeSubTab={activeCerebroIATab}
            onSubTabChange={setCerebroIATab}
          />
        );
      case 'negocio':
        return (
          <CentroNegocioTab
            activeSubTab={activeNegocioTab}
            onSubTabChange={setNegocioTab}
          />
        );
      case 'marketing':
        return <MarketingView />;
      case 'config':
        return <AdminPanelPro />;
      default:
        return (
          <ChatCommandCenter
            shipments={shipments}
            criticalCities={[]}
            onNavigateToTab={(tab) => setCurrentTab(tab as MainTabNew)}
            onRefreshData={() => setNotification('Datos actualizados')}
          />
        );
    }
  };

  return (
    <AppLayout
      selectedCountry={selectedCountry}
      onCountryChange={() => setShowCountrySelector(true)}
      darkMode={darkMode}
      onDarkModeToggle={() => setDarkMode(!darkMode)}
      onLoadData={() => setShowDataInput(!showDataInput)}
      showLoadData={showDataInput}
      notificationCount={alertasCriticas}
      onNotificationsClick={handleNotificationsClick}
      onExportSession={handleExportSession}
      onImportSession={handleImportSession}
      onExportExcel={handleDownloadExcel}
      shipmentsCount={shipments.length}
      shipments={shipments}
      onLogout={handleLogout}
      onOpenChat={handleOpenChat}
      onOpenHelp={handleOpenHelp}
      userName={currentUser?.nombre || 'Usuario'}
      userEmail={currentUser?.email || 'user@litper.co'}
    >
      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 max-w-sm animate-slide-up">
          <div className="flex items-center gap-3 px-5 py-4 bg-gray-800 rounded-xl shadow-2xl border border-gray-700">
            <div className="flex-shrink-0">
              {notification.includes('✅') ? (
                <div className="w-10 h-10 rounded-full bg-emerald-900/30 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                </div>
              ) : notification.includes('❌') ? (
                <div className="w-10 h-10 rounded-full bg-red-900/30 flex items-center justify-center">
                  <X className="w-5 h-5 text-red-400" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-amber-900/30 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                </div>
              )}
            </div>
            <p className="text-sm font-medium text-white">{notification}</p>
            <button
              onClick={() => setNotification(null)}
              className="ml-auto p-1 hover:bg-gray-700 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      )}

      {/* Data Input Modal */}
      {showDataInput && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl max-w-2xl w-full border border-gray-700 shadow-2xl max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
              <div>
                <h2 className="font-bold text-lg text-white">📥 Cargar Guías</h2>
                <p className="text-sm text-gray-400">Importa tus guías desde múltiples fuentes</p>
              </div>
              <button
                onClick={() => setShowDataInput(false)}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Input tabs */}
            <div className="flex border-b border-gray-700">
              {[
                { id: 'PHONES', icon: Smartphone, label: '1. Celulares', color: 'emerald' },
                { id: 'REPORT', icon: FileText, label: '2. Reporte', color: 'orange' },
                { id: 'SUMMARY', icon: LayoutList, label: '3. Resumen', color: 'blue' },
                { id: 'EXCEL', icon: FileSpreadsheet, label: '4. Excel', color: 'purple' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveInputTab(tab.id as any)}
                  className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-all border-b-2 ${
                    activeInputTab === tab.id
                      ? `text-${tab.color}-400 border-${tab.color}-500 bg-${tab.color}-500/10`
                      : 'text-gray-400 border-transparent hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            {activeInputTab === 'EXCEL' ? (
              <EnhancedExcelUpload
                onUploadComplete={({ sessionName, rows, columnMapping }) => {
                  // Procesar los datos mapeados
                  const processedShipments = rows.map((row, idx) => {
                    const shipment: Partial<Shipment> = {
                      id: `upload_${Date.now()}_${idx}`,
                    };

                    columnMapping.forEach((col) => {
                      if (col.enabled && col.mappedTo && row[col.excelColumn] !== undefined) {
                        const value = row[col.excelColumn];
                        switch (col.mappedTo) {
                          case 'trackingNumber':
                            shipment.trackingNumber = String(value);
                            shipment.id = String(value) || shipment.id;
                            break;
                          case 'phone':
                            shipment.phone = String(value);
                            break;
                          case 'status':
                            shipment.status = String(value) as any;
                            break;
                          case 'carrier':
                            shipment.carrier = String(value) as any;
                            break;
                          case 'destinationCity':
                            shipment.destinationCity = String(value);
                            break;
                          case 'recipientName':
                            shipment.recipientName = String(value);
                            break;
                          case 'recipientPhone':
                            shipment.recipientPhone = String(value);
                            break;
                          case 'lastUpdate':
                            shipment.lastUpdate = String(value);
                            break;
                          case 'lastMovement':
                            // Store in history if exists
                            if (!shipment.history) shipment.history = [];
                            shipment.history.push({ description: String(value), timestamp: new Date() });
                            break;
                          case 'daysInTransit':
                            shipment.daysInTransit = parseInt(String(value)) || 0;
                            break;
                          case 'value':
                            shipment.declaredValue = parseFloat(String(value).replace(/[^0-9.-]/g, '')) || 0;
                            break;
                          case 'address':
                            shipment.address = String(value);
                            break;
                        }
                      }
                    });

                    return shipment as Shipment;
                  }).filter(s => s.trackingNumber); // Solo guías con número válido

                  // Agregar al estado
                  setShipments((prev) => {
                    const ids = new Set(processedShipments.map((s) => s.id));
                    return [...prev.filter((s) => !ids.has(s.id)), ...processedShipments];
                  });

                  setNotification(`✅ ${sessionName}: ${processedShipments.length} guías cargadas`);
                  setShowDataInput(false);
                }}
                onCancel={() => setShowDataInput(false)}
              />
            ) : (
              <div className="p-6">
                {(activeInputTab === 'REPORT' || activeInputTab === 'SUMMARY') && (
                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-gray-500 uppercase">Transportadora:</span>
                    <button
                      onClick={() => setInputCarrier('AUTO')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        inputCarrier === 'AUTO'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
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
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                  </div>
                )}

                <div className="flex flex-col gap-4">
                  <textarea
                    className="w-full h-48 border border-gray-700 rounded-xl p-4 font-mono text-sm text-white bg-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all resize-none"
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

                  <div className="flex items-center gap-4">
                    <button
                      onClick={handleProcessInput}
                      className={`flex-1 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 ${
                        activeInputTab === 'REPORT'
                          ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700'
                          : activeInputTab === 'PHONES'
                            ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700'
                            : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                      }`}
                    >
                      {activeInputTab === 'PHONES' ? '📱 Guardar Celulares' : activeInputTab === 'REPORT' ? '📄 Cargar Reporte' : '📋 Procesar Resumen'}
                    </button>
                    {activeInputTab === 'PHONES' && (
                      <div className="text-sm text-gray-400">
                        📊 Registrados: <span className="text-white font-bold">{Object.keys(phoneRegistry).length}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content - Controlado por Sidebar */}
      <main className="min-h-[600px] p-6">
        {renderSidebarContent()}
      </main>

      {/* Legacy tabs support - these can still be triggered via links */}
      {currentTab !== 'home' && currentTab === 'seguimiento' && (
        <div className="p-6">
          <SeguimientoTab
            shipments={shipments}
            onRestoreShipments={(restoredShipments) => setShipments(restoredShipments)}
          />
        </div>
      )}
      {currentTab === 'demanda' && <div className="p-6"><DemandTab country={selectedCountry} /></div>}
      {currentTab === 'gamificacion' && <div className="p-6"><GamificationTab /></div>}
      {currentTab === 'semaforo' && <div className="p-6"><SemaforoTabNew onDataLoaded={handleSemaforoDataLoaded} /></div>}
      {currentTab === 'predicciones' && <div className="p-6"><PrediccionesTab shipments={shipments} /></div>}
      {currentTab === 'asistente' && <div className="p-6"><AsistenteIAUnificado shipments={shipments} /></div>}
      {currentTab === 'ml' && <div className="p-6"><MLSystemTab /></div>}
      {currentTab === 'ciudad-agentes' && <div className="p-6"><CiudadAgentesTab selectedCountry={selectedCountry} /></div>}
      {currentTab === 'inteligencia-logistica' && <div className="p-6"><InteligenciaLogisticaTab /></div>}
      {currentTab === 'tracking-ordenes' && <div className="p-6"><TrackingOrdenesTab /></div>}

      {/* Legacy Dashboard - can be accessed from quick actions */}
      {currentTab === 'dashboard-legacy' && (
        <div className="p-6">
          <PremiumDashboard
            shipments={shipments}
            onNavigate={(tab) => setCurrentTab(tab)}
            country={selectedCountry}
            userProfile={userProfile}
          />
        </div>
      )}

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
        forceOpen={showProBubble}
        onForceOpenHandled={() => setShowProBubble(false)}
      />
    </AppLayout>
  );
};

// Exportar App envuelto en AuthWrapper para requerir autenticación
const AppWithAuth: React.FC = () => (
  <AuthWrapper>
    <App />
  </AuthWrapper>
);

export default AppWithAuth;
