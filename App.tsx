import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Shipment, ShipmentStatus, CarrierName, AITrackingResult } from './types';
import { SemaforoExcelData } from './types/logistics';
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
import { SemaforoTabNew } from './components/tabs';
// Nuevos tabs unificados
import { OperacionesUnificadoTab } from './components/tabs/OperacionesUnificadoTab';
import { InteligenciaIAUnificadoTab } from './components/tabs/InteligenciaIAUnificadoTab';
import { ProBubbleV4 } from './components/ProAssistant';
import UniversalSearch from './components/search/UniversalSearch';
import { AuthWrapper } from './components/auth';
import { AdminPanelPro } from './components/Admin/AdminPanelPro';
import { DropshipperHub } from './components/Admin/DropshipperCenter';
import CountrySelector from './components/CountrySelector';
// Chat-First Design System
import { ChatCommandCenter } from './components/ChatFirst';
import { detectarGuiasRetrasadas } from './utils/patternDetection';
// Nuevo Layout con Sidebar estilo ChatGPT
import { AppLayout } from './components/layout';
import { useLayoutStore, MainSection } from './stores/layoutStore';
// Auth service for logout
import { logout as authLogout, getCurrentUser } from './services/authService';
// URL Routing - sync browser URL with sidebar navigation
import { useRouter } from './hooks/useRouter';
// New components - Phase 2
import ShipmentMap from './components/maps/ShipmentMap';
import ExecutiveDashboard from './components/Dashboard/ExecutiveDashboard';
import LandingPage from './components/LandingPage/LandingPage';
import { DropshipperLanding } from './components/LandingPage/DropshipperLanding';
import PublicTrackingPage from './components/PublicTracking/PublicTrackingPage';
// User Profile
import { useUserProfileStore } from './services/userProfileService';
// Enhanced Excel Upload with column config
import { EnhancedExcelUpload } from './components/upload';
// Report Upload System
import { ReportUploadModal, MyReportsPanel, PublicUploadPage } from './components/ReportUpload';
import { useReportUploadStore } from './stores/reportUploadStore';
import { getTokenFromUrl, getUploadLinkByToken } from './services/reportUploadService';
import {
  CheckCircle,
  X,
  AlertTriangle,
  Smartphone,
  FileText,
  LayoutList,
  FileSpreadsheet,
} from 'lucide-react';

// ============================================
// MAIN APP COMPONENT
// ============================================
const App: React.FC = () => {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [phoneRegistry, setPhoneRegistry] = useState<Record<string, string>>({});

  // Country selection
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [showCountrySelector, setShowCountrySelector] = useState(false);

  const [showDataInput, setShowDataInput] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Nuevo sistema de navegación con Sidebar
  const {
    activeSection,
    setActiveSection,
    activeOperacionesTab,
    setOperacionesTab,
    activeReportesTab,
    setReportesTab,
    activeInicioTab,
    setInicioTab,
  } = useLayoutStore();

  // Estado para mostrar/ocultar el chat IA (ProBubble)
  const [showProBubble, setShowProBubble] = useState(false);
  const [showNotificationsPanel, setShowNotificationsPanel] = useState(false);

  // User Profile Store
  const { profile, isOnboardingComplete } = useUserProfileStore();

  // Report Upload Store
  const { isModalOpen: isReportModalOpen, openModal: openReportModal, closeModal: closeReportModal } = useReportUploadStore();

  // URL Routing - syncs browser URL <-> sidebar section
  useRouter();

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
      if (error instanceof Error && error.message.includes('lleno')) {
        setNotification('Almacenamiento lleno. Exporta tus datos para liberar espacio.');
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

  // Legacy tab navigation mapping -> sidebar sections
  const handleLegacyNavigate = (tab: string) => {
    const mapping: Record<string, MainSection> = {
      'seguimiento': 'operaciones',
      'semaforo': 'semaforo',
      'operaciones': 'operaciones',
      'analisis': 'reportes',
      'reportes': 'reportes',
      'inteligencia-ia': 'reportes',
      'config': 'config',
      'admin': 'config',
    };
    const section = mapping[tab] || 'inicio';
    setActiveSection(section);
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
        setNotification(`${Object.keys(newPhones).length} celulares registrados. ${countDiff > 0 ? countDiff + ' guías actualizadas.' : ''}`);
        setInputText('');
        setActiveInputTab('REPORT');
      } else {
        setNotification('No se encontraron celulares válidos.');
      }
    } else if (activeInputTab === 'REPORT') {
      const { shipments: newShipments } = parseDetailedInput(inputText, phoneRegistry, forcedCarrier);
      if (newShipments.length > 0) {
        setShipments((prev) => {
          const ids = new Set(newShipments.map((s) => s.id));
          return [...prev.filter((s) => !ids.has(s.id)), ...newShipments];
        });
        setNotification(`${newShipments.length} guías cargadas exitosamente`);
        setInputText('');
        setActiveInputTab('SUMMARY');
      } else {
        setNotification('No se detectaron guías en el reporte');
      }
    } else if (activeInputTab === 'SUMMARY') {
      const { shipments: newSummaryShipments } = parseSummaryInput(inputText, phoneRegistry, shipments, forcedCarrier);
      if (newSummaryShipments.length > 0) {
        setShipments((prev) => [...prev, ...newSummaryShipments]);
        setNotification(`${newSummaryShipments.length} guías nuevas añadidas`);
        setInputText('');
        setShowDataInput(false);
      } else {
        setNotification('No se encontraron guías nuevas');
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
        const maxGuias = 5000;
        const guiasToAdd = result.shipments.slice(0, maxGuias);

        if (result.shipments.length > maxGuias) {
          setNotification(`Se cargaron las primeras ${maxGuias} guías de ${result.shipments.length}. Exporta los datos antes de cargar más.`);
        }

        setShipments((prev) => {
          const ids = new Set(guiasToAdd.map((s) => s.id));
          return [...prev.filter((s) => !ids.has(s.id)), ...guiasToAdd];
        });

        if (result.shipments.length <= maxGuias) {
          setNotification(`${guiasToAdd.length} guías cargadas desde Excel`);
        }
        setShowDataInput(false);
      } else if (result.error) {
        setNotification(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error cargando Excel:', error);
      setNotification('Error inesperado al procesar el archivo. Intenta con un archivo más pequeño.');
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
        setNotification(`Sesión cargada: ${loadedData.length} guías`);
      } catch (err) {
        setNotification('Error cargando sesión');
      }
    }
  };

  const handleSemaforoDataLoaded = (data: SemaforoExcelData) => {
    setNotification('Datos del semáforo cargados');
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
    setNotification('Panel de notificaciones');
  };

  // Mostrar selector de país si no hay país seleccionado
  if (showCountrySelector || !selectedCountry) {
    return <CountrySelector onCountrySelected={handleCountrySelected} />;
  }

  // Función para renderizar contenido según la sección activa del sidebar
  const renderSidebarContent = () => {
    switch (activeSection) {
      case 'inicio':
        if (activeInicioTab === 'ejecutivo') {
          return <ExecutiveDashboard />;
        }
        return (
          <ChatCommandCenter
            shipments={shipments}
            criticalCities={[]}
            onNavigateToTab={handleLegacyNavigate}
            onRefreshData={() => setNotification('Datos actualizados')}
          />
        );
      case 'operaciones':
        if (activeOperacionesTab === 'mapa') {
          return <ShipmentMap shipments={shipments} />;
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
      case 'semaforo':
        return <SemaforoTabNew onDataLoaded={handleSemaforoDataLoaded} />;
      case 'reportes':
        if (activeReportesTab === 'reportes') {
          return (
            <div className="p-6">
              <MyReportsPanel onOpenUploadModal={openReportModal} />
            </div>
          );
        }
        return (
          <InteligenciaIAUnificadoTab
            shipments={shipments}
            selectedCountry={selectedCountry}
            activeSubTab={activeReportesTab}
            onSubTabChange={setReportesTab}
          />
        );
      case 'dropshipper':
        return <DropshipperHub />;
      case 'config':
        return <AdminPanelPro />;
      default:
        return (
          <ChatCommandCenter
            shipments={shipments}
            criticalCities={[]}
            onNavigateToTab={handleLegacyNavigate}
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
      onUploadReport={openReportModal}
      userName={currentUser?.nombre || 'Usuario'}
      userEmail={currentUser?.email || 'user@litper.co'}
    >
      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 max-w-sm animate-slide-up">
          <div className="flex items-center gap-3 px-5 py-4 bg-gray-800 rounded-xl shadow-2xl border border-gray-700">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-amber-900/30 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
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
                <h2 className="font-bold text-lg text-white">Cargar Guías</h2>
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
                  }).filter(s => s.trackingNumber);

                  setShipments((prev) => {
                    const ids = new Set(processedShipments.map((s) => s.id));
                    return [...prev.filter((s) => !ids.has(s.id)), ...processedShipments];
                  });

                  setNotification(`${sessionName}: ${processedShipments.length} guías cargadas`);
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
                      AUTO
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
                        ? 'Pegue aquí las columnas: [Guía] [Celular]...'
                        : activeInputTab === 'REPORT'
                          ? 'Pegue aquí el texto del reporte detallado...'
                          : 'Pegue aquí el resumen de 17TRACK...'
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
                      {activeInputTab === 'PHONES' ? 'Guardar Celulares' : activeInputTab === 'REPORT' ? 'Cargar Reporte' : 'Procesar Resumen'}
                    </button>
                    {activeInputTab === 'PHONES' && (
                      <div className="text-sm text-gray-400">
                        Registrados: <span className="text-white font-bold">{Object.keys(phoneRegistry).length}</span>
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

      {/* Búsqueda Universal (Ctrl+K) */}
      <UniversalSearch
        shipments={shipments}
        isOpen={showUniversalSearch}
        onClose={() => setShowUniversalSearch(false)}
        onNavigate={handleLegacyNavigate}
      />

      {/* Floating AI Assistant PRO Button - V4 con Chat IA y Modos */}
      <ProBubbleV4
        shipments={shipments}
        onNavigateToTab={handleLegacyNavigate}
        onExportData={handleDownloadExcel}
        forceOpen={showProBubble}
        onForceOpenHandled={() => setShowProBubble(false)}
      />

      {/* Report Upload Modal - Accessible from anywhere */}
      <ReportUploadModal isOpen={isReportModalOpen} onClose={closeReportModal} />
    </AppLayout>
  );
};

// Exportar App envuelto en AuthWrapper para requerir autenticación
// Con sistema de Onboarding Enterprise integrado
import {
  SplashScreen,
  WelcomeModal,
  OnboardingChecklist,
  EnterpriseOnboarding,
} from './components/Onboarding';
import { useOnboardingStore } from './stores/onboardingStore';
import { useCompanyStore } from './stores/companyStore';

const AppWithOnboarding: React.FC = () => {
  // Old onboarding store (for splash/welcome)
  const {
    showSplash,
    setShowSplash,
    showWelcome,
    setShowWelcome,
    hideWelcomeForever,
  } = useOnboardingStore();

  // New company store (for enterprise onboarding)
  const {
    showEnterpriseOnboarding,
    setShowEnterpriseOnboarding,
    isOnboardingComplete,
    getCompletionPercentage,
  } = useCompanyStore();

  // Initialize onboarding on first load
  const [initialized, setInitialized] = React.useState(false);

  React.useEffect(() => {
    if (!initialized) {
      setInitialized(true);

      // Check if we should show welcome (for returning users)
      const hasSeenWelcomeThisSession = sessionStorage.getItem('litper-welcome-shown');

      if (!hasSeenWelcomeThisSession && !hideWelcomeForever) {
        // Show splash first for a nice entry
        setShowSplash(true);

        setTimeout(() => {
          setShowSplash(false);
          setShowWelcome(true);
          sessionStorage.setItem('litper-welcome-shown', 'true');
        }, 2500);
      }

      // Show enterprise onboarding if not complete (after welcome)
      const percentage = getCompletionPercentage();
      if (percentage < 100 && !isOnboardingComplete) {
        setTimeout(() => {
          // Show the checklist widget automatically
          // User can click it to open the full onboarding
        }, 3500);
      }
    }
  }, [initialized, hideWelcomeForever, isOnboardingComplete, getCompletionPercentage, setShowSplash, setShowWelcome]);

  return (
    <>
      {/* Splash Screen - Shows on entry */}
      {showSplash && (
        <SplashScreen
          onComplete={() => setShowSplash(false)}
          duration={2500}
        />
      )}

      {/* Welcome Modal - Shows after splash */}
      <WelcomeModal
        isOpen={showWelcome}
        onClose={() => setShowWelcome(false)}
      />

      {/* Enterprise Onboarding - Full-screen wizard */}
      {showEnterpriseOnboarding && (
        <EnterpriseOnboarding
          onComplete={() => setShowEnterpriseOnboarding(false)}
        />
      )}

      {/* Main App */}
      <App />

      {/* Onboarding Checklist - Floating widget (uses companyStore) */}
      {!isOnboardingComplete && <OnboardingChecklist />}
    </>
  );
};

const AppWithAuth: React.FC = () => (
  <AuthWrapper>
    <AppWithOnboarding />
  </AuthWrapper>
);

// ============================================
// PUBLIC UPLOAD ROUTE DETECTOR
// If URL has ?upload=TOKEN, show public page (no login required)
// ============================================
const AppRoot: React.FC = () => {
  const [publicUploadToken] = React.useState(() => getTokenFromUrl());
  const [uploadLink] = React.useState(() =>
    publicUploadToken ? getUploadLinkByToken(publicUploadToken) : null
  );

  // If valid upload link detected, show public upload page (bypasses auth)
  if (publicUploadToken && uploadLink) {
    return <PublicUploadPage uploadLink={uploadLink} />;
  }

  // If invalid/expired token, show error
  if (publicUploadToken && !uploadLink) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 flex items-center justify-center p-4">
        <div className="bg-gray-900/80 backdrop-blur-xl rounded-3xl border border-gray-700/50 p-12 max-w-md w-full text-center shadow-2xl">
          <div className="p-5 bg-red-500/20 rounded-full w-fit mx-auto mb-6">
            <AlertTriangle className="w-16 h-16 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Link No Válido</h2>
          <p className="text-gray-400 mb-6">
            Este link de subida de reportes no existe, ha expirado, o ya alcanzó el límite de envíos.
          </p>
          <p className="text-sm text-gray-500">Contacta al administrador para obtener un nuevo link.</p>
        </div>
      </div>
    );
  }

  // Public landing page (no auth required)
  if (window.location.pathname === '/landing') {
    return <LandingPage />;
  }

  // Dropshipper landing page
  if (window.location.pathname === '/dropshipper-landing') {
    return (
      <DropshipperLanding
        onLogin={() => { window.location.href = '/'; }}
        onRegister={() => { window.location.href = '/'; }}
      />
    );
  }

  // Public tracking page (no auth required)
  if (window.location.pathname.startsWith('/tracking')) {
    return <PublicTrackingPage />;
  }

  // Normal app flow
  return <AppWithAuth />;
};

export default AppRoot;
