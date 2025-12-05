import React, { useState, useEffect, useCallback } from 'react';
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
  ReporteIATab,
  AsistenteTab,
  MLSystemTab,
  FlashTab,
  DemandTab,
  GamificationTab,
} from './components/tabs';
import CountrySelector from './components/CountrySelector';
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
} from 'lucide-react';

const AppNew: React.FC = () => {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [phoneRegistry, setPhoneRegistry] = useState<Record<string, string>>({});

  // Country selection
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [showCountrySelector, setShowCountrySelector] = useState(false);

  // Main tab navigation
  const [currentTab, setCurrentTab] = useState<MainTabNew>('seguimiento');
  const [showDataInput, setShowDataInput] = useState(false);

  // Input state
  const [activeInputTab, setActiveInputTab] = useState<'PHONES' | 'REPORT' | 'SUMMARY' | 'EXCEL'>('PHONES');
  const [inputCarrier, setInputCarrier] = useState<CarrierName | 'AUTO'>('AUTO');
  const [inputText, setInputText] = useState('');

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Excel parser hook
  const {
    parseExcelFile,
    isLoading: isExcelLoading,
    xlsxLoaded,
  } = useShipmentExcelParser();

  // Load data on mount
  useEffect(() => {
    // Check for saved country
    const savedCountry = getSelectedCountry();
    if (savedCountry) {
      setSelectedCountry(savedCountry);
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

  useEffect(() => {
    saveShipments(shipments);
  }, [shipments]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Handle country selection
  const handleCountrySelected = (country: Country) => {
    setSelectedCountry(country);
    setShowCountrySelector(false);
  };

  // Get gamification profile for XP display
  const userProfile = getUserProfile();

  // Calculate notifications for tabs
  const tabNotifications = {
    seguimiento: detectarGuiasRetrasadas(shipments).filter((g) => g.nivelAlerta === 'CRITICO').length,
    flash: 0,
    demanda: 0,
    gamificacion: userProfile.activeChallenges.filter(c => !c.completed).length,
    semaforo: 0,
    predicciones: 0,
    reporte: 0,
    asistente: 0,
    ml: 0,
  };

  const handleProcessInput = () => {
    if (!inputText.trim()) return;

    const forcedCarrier = inputCarrier !== 'AUTO' ? inputCarrier : undefined;

    if (activeInputTab === 'PHONES') {
      const newPhones = parsePhoneRegistry(inputText);

      setPhoneRegistry((prev) => {
        const updated = { ...prev, ...newPhones };
        return updated;
      });

      const mergedShipments = mergePhoneNumbers(inputText, shipments);
      const countDiff =
        mergedShipments.filter((s) => s.phone).length - shipments.filter((s) => s.phone).length;

      setShipments(mergedShipments);

      if (Object.keys(newPhones).length > 0) {
        setNotification(
          `${Object.keys(newPhones).length} celulares registrados. ${countDiff > 0 ? countDiff + ' guías actualizadas.' : 'Ahora cargue el reporte.'}`
        );
        setInputText('');
        setActiveInputTab('REPORT');
      } else {
        setNotification('No se encontraron celulares válidos.');
      }
    } else if (activeInputTab === 'REPORT') {
      const { shipments: newShipments } = parseDetailedInput(
        inputText,
        phoneRegistry,
        forcedCarrier
      );
      if (newShipments.length > 0) {
        setShipments((prev) => {
          const ids = new Set(newShipments.map((s) => s.id));
          const filteredPrev = prev.filter((s) => !ids.has(s.id));
          return [...filteredPrev, ...newShipments];
        });
        setNotification(`✅ ${newShipments.length} guías cargadas. Revisa el resumen para validar.`);
        setInputText('');
        // Pasar al paso 3 (SUMMARY) para validar las guías cargadas
        setActiveInputTab('SUMMARY');
      } else {
        alert('No se detectaron guías en el reporte. Verifique el formato.');
      }
    } else if (activeInputTab === 'SUMMARY') {
      const { shipments: newSummaryShipments } = parseSummaryInput(
        inputText,
        phoneRegistry,
        shipments,
        forcedCarrier
      );

      if (newSummaryShipments.length > 0) {
        setShipments((prev) => [...prev, ...newSummaryShipments]);
        setNotification(`Resumen cargado. ${newSummaryShipments.length} guías nuevas añadidas.`);
        setInputText('');
        setShowDataInput(false);
      } else {
        setNotification('Resumen procesado. No se encontraron guías nuevas faltantes.');
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
        const filteredPrev = prev.filter((s) => !ids.has(s.id));
        return [...filteredPrev, ...result.shipments];
      });
      setNotification(`✅ ${result.shipments.length} guías cargadas desde Excel`);
      setShowDataInput(false);
    } else if (result.error) {
      alert(`Error: ${result.error}`);
    }

    e.target.value = '';
  };

  const handleDownloadExcel = () => {
    exportToExcel(shipments);
  };

  const handleExportSession = () => {
    exportSessionData(shipments);
  };

  const handleImportSession = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const loadedData = await importSessionData(file);
        setShipments(loadedData);
        setNotification(`Sesión cargada: ${loadedData.length} guías.`);
      } catch (err) {
        alert('Error cargando sesión.');
      }
    }
  };

  const handleSemaforoDataLoaded = (data: SemaforoExcelData) => {
    setNotification('Datos del semáforo cargados exitosamente');
  };

  // Show country selector if no country is selected
  if (showCountrySelector || !selectedCountry) {
    return <CountrySelector onCountrySelected={handleCountrySelected} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-navy-950 text-slate-900 dark:text-slate-100 font-sans pb-8 transition-colors duration-300 relative">
      {/* Header */}
      <header className="bg-navy-900 text-white shadow-2xl sticky top-0 z-30 border-b border-gold-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className="bg-gradient-to-br from-gold-500 to-gold-700 p-2.5 rounded-xl shadow-lg transform hover:rotate-6 transition-transform cursor-pointer border border-gold-300"
              onClick={() => {
                setShipments([]);
                setCurrentTab('seguimiento');
              }}
            >
              <Crown className="w-6 h-6 text-navy-900" />
            </div>
            <div className="hidden md:block">
              <h1 className="text-xl font-serif font-bold tracking-tight text-white leading-tight">
                LITPER <span className="text-gold-500">LOGÍSTICA</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-medium tracking-[0.2em] uppercase">
                Sistema Pro de Gestión
              </p>
            </div>
          </div>

          {/* Header actions */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Country Selector */}
            <button
              onClick={() => setShowCountrySelector(true)}
              className="flex items-center gap-2 px-3 py-2 bg-navy-800 hover:bg-navy-700 rounded-lg text-sm border border-navy-700 transition-all"
              title="Cambiar país"
            >
              <Globe className="w-4 h-4 text-gold-500" />
              <span className="hidden md:inline text-slate-300">
                {selectedCountry === 'COLOMBIA' ? '🇨🇴' : selectedCountry === 'ECUADOR' ? '🇪🇨' : '🇨🇱'}
              </span>
            </button>

            {/* XP Badge */}
            <button
              onClick={() => setCurrentTab('gamificacion')}
              className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-lg text-sm font-bold transition-all shadow-lg"
              title="Ver logros"
            >
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span className="text-white">{userProfile.totalXP} XP</span>
            </button>

            {/* Data Input Toggle */}
            <button
              onClick={() => setShowDataInput(!showDataInput)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                showDataInput
                  ? 'bg-gold-500 text-navy-900'
                  : 'bg-navy-800 text-gold-500 border border-navy-700 hover:bg-navy-700'
              }`}
            >
              <Home className="w-4 h-4" />
              <span className="hidden md:inline">{showDataInput ? 'Cerrar' : 'Cargar Datos'}</span>
            </button>

            {/* Session controls */}
            <div className="hidden lg:flex items-center gap-2 bg-navy-800 p-1 rounded-lg border border-navy-700">
              <button
                onClick={handleExportSession}
                className="p-1.5 text-slate-300 hover:text-white"
                title="Guardar Sesión"
              >
                <Save className="w-4 h-4" />
              </button>
              <label
                className="p-1.5 text-slate-300 hover:text-white cursor-pointer"
                title="Cargar Sesión"
              >
                <Upload className="w-4 h-4" />
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportSession}
                  className="hidden"
                />
              </label>
            </div>

            {shipments.length > 0 && (
              <button
                onClick={handleDownloadExcel}
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-navy-800 hover:bg-navy-700 text-gold-500 border border-navy-700 rounded-lg text-sm font-bold transition-all shadow-sm"
                title="Descargar Base de Datos Excel"
              >
                <Download className="w-4 h-4" />
                Excel
              </button>
            )}

            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-full bg-navy-800 hover:bg-navy-700 transition-colors text-slate-400 hover:text-gold-400"
              title={darkMode ? 'Activar Modo Claro' : 'Activar Modo Oscuro'}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Notification */}
      {notification && (
        <div className="fixed top-24 right-4 z-50 bg-emerald-500 text-white px-6 py-3 rounded-lg shadow-xl animate-in fade-in slide-in-from-right-10 flex items-center gap-3">
          <CheckCircle className="w-5 h-5" />
          <span className="font-bold text-sm">{notification}</span>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Data Input Section (Collapsible) */}
        {showDataInput && (
          <section className="bg-white dark:bg-navy-900 rounded-2xl shadow-lg border border-slate-200 dark:border-navy-800 overflow-hidden animate-in slide-in-from-top-4 duration-300">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-navy-800">
              <h2 className="font-bold text-slate-800 dark:text-white">Cargar Datos de Guías</h2>
              <button
                onClick={() => setShowDataInput(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-navy-800 rounded-lg"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Input tabs */}
            <div className="flex border-b border-slate-200 dark:border-navy-800 overflow-x-auto">
              <button
                onClick={() => setActiveInputTab('PHONES')}
                className={`flex-1 min-w-[130px] py-4 text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                  activeInputTab === 'PHONES'
                    ? 'bg-white dark:bg-navy-900 text-emerald-600 border-b-4 border-emerald-500'
                    : 'bg-slate-50 dark:bg-navy-950 text-slate-400 hover:text-slate-600'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span className="hidden sm:inline">1. Celulares</span>
              </button>
              <button
                onClick={() => setActiveInputTab('REPORT')}
                className={`flex-1 min-w-[130px] py-4 text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                  activeInputTab === 'REPORT'
                    ? 'bg-white dark:bg-navy-900 text-orange-600 border-b-4 border-orange-500'
                    : 'bg-slate-50 dark:bg-navy-950 text-slate-400 hover:text-slate-600'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">2. Reporte</span>
              </button>
              <button
                onClick={() => setActiveInputTab('SUMMARY')}
                className={`flex-1 min-w-[130px] py-4 text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                  activeInputTab === 'SUMMARY'
                    ? 'bg-white dark:bg-navy-900 text-blue-600 border-b-4 border-blue-500'
                    : 'bg-slate-50 dark:bg-navy-950 text-slate-400 hover:text-slate-600'
                }`}
              >
                <LayoutList className="w-4 h-4" />
                <span className="hidden sm:inline">3. Resumen</span>
              </button>
              <button
                onClick={() => setActiveInputTab('EXCEL')}
                className={`flex-1 min-w-[130px] py-4 text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                  activeInputTab === 'EXCEL'
                    ? 'bg-white dark:bg-navy-900 text-purple-600 border-b-4 border-purple-500'
                    : 'bg-slate-50 dark:bg-navy-950 text-slate-400 hover:text-slate-600'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span className="hidden sm:inline">4. Excel</span>
              </button>
            </div>

            {/* Excel Upload Tab */}
            {activeInputTab === 'EXCEL' ? (
              <div className="p-6">
                <div className="max-w-lg mx-auto text-center">
                  <div className="bg-gradient-to-br from-purple-500 to-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <FileUp className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                    Cargar Guías desde Excel
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">
                    Sube un archivo Excel (.xlsx, .xls) con tus guías
                  </p>

                  <label
                    className={`
                    inline-flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-lg cursor-pointer
                    transition-all transform hover:scale-105 shadow-lg
                    ${
                      isExcelLoading
                        ? 'bg-slate-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white hover:shadow-xl'
                    }
                  `}
                  >
                    {isExcelLoading ? (
                      <>
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      <>
                        <FileUp className="w-6 h-6" />
                        Seleccionar Archivo Excel
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

                  {!xlsxLoaded && (
                    <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-yellow-700 dark:text-yellow-400 text-sm flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Cargando librería Excel...
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Text input tabs */
              <div>
                {/* Carrier Selection */}
                {(activeInputTab === 'REPORT' || activeInputTab === 'SUMMARY') && (
                  <div className="px-6 pt-4 pb-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-slate-400 uppercase mr-2">
                        Transportadora:
                      </span>
                      <button
                        onClick={() => setInputCarrier('AUTO')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                          inputCarrier === 'AUTO'
                            ? 'bg-slate-700 text-white border-slate-700 shadow-md'
                            : 'bg-slate-100 dark:bg-navy-800 text-slate-500 dark:text-slate-400 border-transparent hover:bg-slate-200'
                        }`}
                      >
                        AUTO (Detectar)
                      </button>
                      {Object.values(CarrierName)
                        .filter((c) => c !== CarrierName.UNKNOWN)
                        .map((c) => (
                          <button
                            key={c}
                            onClick={() => setInputCarrier(c)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                              inputCarrier === c
                                ? 'text-white shadow-md transform scale-105 bg-orange-500 border-orange-500'
                                : 'bg-slate-50 dark:bg-navy-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-navy-700 hover:bg-white dark:hover:bg-navy-700'
                            }`}
                          >
                            {c}
                          </button>
                        ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-0 flex-col lg:flex-row h-auto">
                  <div className="flex-1 p-4 md:p-6">
                    <textarea
                      className="w-full h-40 lg:h-48 border-2 border-dashed border-slate-300 dark:border-navy-700 rounded-xl p-4 font-mono text-xs md:text-sm focus:border-orange-500 focus:bg-orange-50/10 dark:focus:bg-navy-950 outline-none transition-all resize-none bg-slate-50 dark:bg-navy-950 text-slate-600 dark:text-slate-300 placeholder:text-slate-400"
                      placeholder={
                        activeInputTab === 'PHONES'
                          ? 'Pegue aquí las columnas: [Guía] [Celular] o viceversa...'
                          : activeInputTab === 'REPORT'
                            ? 'Pegue aquí el texto del reporte detallado (Guía, Estatus, País, Eventos...)'
                            : 'Pegue aquí el resumen de 17TRACK (ID, País, Evento, Estado...)'
                      }
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-4 justify-start min-w-[200px] p-4 md:p-6 pt-0 lg:pt-6 bg-slate-50 dark:bg-navy-950/50 border-l border-slate-100 dark:border-navy-800">
                    <button
                      onClick={handleProcessInput}
                      className={`w-full text-white px-6 py-3.5 rounded-xl font-bold transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 ${
                        activeInputTab === 'REPORT'
                          ? 'bg-orange-600 hover:bg-orange-700 shadow-orange-500/30'
                          : activeInputTab === 'PHONES'
                            ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/30'
                            : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30'
                      }`}
                    >
                      {activeInputTab === 'REPORT' ? (
                        <FileText className="w-5 h-5" />
                      ) : activeInputTab === 'PHONES' ? (
                        <Smartphone className="w-5 h-5" />
                      ) : (
                        <LayoutList className="w-5 h-5" />
                      )}
                      {activeInputTab === 'REPORT'
                        ? 'Añadir a Lote'
                        : activeInputTab === 'PHONES'
                          ? 'Guardar Celulares'
                          : 'Cargar Resumen'}
                    </button>
                    <p className="text-xs text-slate-400 text-center">
                      {activeInputTab === 'PHONES' &&
                        `Registrados: ${Object.keys(phoneRegistry).length}`}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Tab Navigation */}
        <TabNavigationNew
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          notifications={tabNotifications}
        />

        {/* Tab Content */}
        <div className="min-h-[500px]">
          {currentTab === 'seguimiento' && <SeguimientoTab shipments={shipments} />}

          {currentTab === 'flash' && <FlashTab country={selectedCountry} />}

          {currentTab === 'demanda' && <DemandTab country={selectedCountry} />}

          {currentTab === 'gamificacion' && <GamificationTab />}

          {currentTab === 'semaforo' && (
            <SemaforoTabNew onDataLoaded={handleSemaforoDataLoaded} />
          )}

          {currentTab === 'predicciones' && <PrediccionesTab shipments={shipments} />}

          {currentTab === 'reporte' && <ReporteIATab shipments={shipments} />}

          {currentTab === 'asistente' && <AsistenteTab shipments={shipments} />}

          {currentTab === 'ml' && <MLSystemTab />}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-navy-900 border-t border-slate-200 dark:border-navy-800 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <p className="text-slate-500 text-xs">© 2025 Litper Logística - Sistema Pro v4.0</p>
          <div
            className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold transition-colors ${
              isOnline
                ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
            }`}
          >
            {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {isOnline ? 'Sistema Conectado' : 'Modo Offline'}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AppNew;
