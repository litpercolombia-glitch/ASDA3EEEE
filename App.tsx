import React, { useState, useEffect, useCallback } from 'react';
import { Shipment, ShipmentStatus, CarrierName, AITrackingResult, ReportStats, ErrorTrackingEntry, TrackingErrorType } from './types';
import {
  detectCarrier,
  saveShipments,
  loadShipments,
  parseDetailedInput,
  exportToExcel,
  mergePhoneNumbers,
  exportSessionData,
  importSessionData,
  calculateStats,
  parseSummaryInput,
  parsePhoneRegistry,
  getShipmentRecommendation,
} from './services/logisticsService';
import {
  LoadSummaryView,
  LoadHistoryPage,
  ErrorTrackingTable,
  DynamicClassificationButtons,
  AIDelayPatternAnalysis
} from './components/services';
import { DetailedShipmentCard } from './components/DetailedShipmentCard';
import { GeneralReport } from './components/GeneralReport';
import { EvidenceModal } from './components/EvidenceModal';
import { AssistantPanel } from './components/AssistantPanel';
import { BatchTrackingModal } from './components/BatchTrackingModal';
import { AlertDashboard } from './components/AlertDashboard';
import { QuickReferencePanel } from './components/QuickReferencePanel';
import { PredictiveSystemPanel } from './components/PredictiveSystemPanel';
import { TabNavigation, MainTab } from './components/TabNavigation';
import { AIReportTab } from './components/AIReportTab';
import { SemaforoTab } from './components/SemaforoTab';
import { GuiasDetailModal } from './components/GuiasDetailModal';
import { GuideLoadingWizard } from './components/GuideLoadingWizard';
import { useShipmentExcelParser } from './hooks/useShipmentExcelParser';
import {
  Package,
  Search,
  Calendar,
  Sparkles,
  FileSpreadsheet,
  Box,
  Moon,
  Sun,
  Info,
  ScanLine,
  FileText,
  Download,
  Truck,
  Filter,
  Crown,
  CheckCircle,
  Smartphone,
  ClipboardList,
  ArrowRight,
  AlertOctagon,
  Siren,
  Upload,
  Save,
  Wifi,
  WifiOff,
  X,
  List,
  LayoutList,
  Link,
  Home,
  BarChart3,
  Target,
  Activity,
  FileUp,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react';

const App: React.FC = () => {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [phoneRegistry, setPhoneRegistry] = useState<Record<string, string>>({});

  // Main tab navigation
  const [currentTab, setCurrentTab] = useState<MainTab>('home');

  const [viewMode, setViewMode] = useState<'SIMPLE' | 'DETAILED' | 'ALERTS'>('SIMPLE');
  const [activeInputTab, setActiveInputTab] = useState<'REPORT' | 'PHONES' | 'SUMMARY' | 'EXCEL'>('PHONES');
  const [inputCarrier, setInputCarrier] = useState<CarrierName | 'AUTO'>('AUTO');

  const [inputText, setInputText] = useState('');
  const [filterDate, setFilterDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [filterCarrier, setFilterCarrier] = useState<string>('ALL');
  const [specialFilter, setSpecialFilter] = useState<
    'ALL' | 'ISSUES' | 'LONG_TRANSIT' | 'UNTRACKED'
  >('ALL');
  const [filterStatus, setFilterStatus] = useState<ShipmentStatus | null>(null);

  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeBatchId, setActiveBatchId] = useState<string>('ALL');

  // Error tracking state
  const [trackingErrors, setTrackingErrors] = useState<ErrorTrackingEntry[]>([]);
  const [showLoadSummary, setShowLoadSummary] = useState(false);
  const [lastBatchId, setLastBatchId] = useState<string | null>(null);
  const [lastBatchDate, setLastBatchDate] = useState<string>(new Date().toISOString());
  const [showHistory, setShowHistory] = useState(false);

  // Excel parser hook
  const { parseExcelFile, isLoading: isExcelLoading, xlsxLoaded, parseResult: excelResult, reset: resetExcel } = useShipmentExcelParser();

  // Load data on mount
  useEffect(() => {
    const data = loadShipments();
    if (data.length > 0) {
      setShipments(data);
      setViewMode('DETAILED');
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
      const { shipments: newShipments, errors: parseErrors } = parseDetailedInput(
        inputText,
        phoneRegistry,
        forcedCarrier
      );

      // Create error tracking entries for any errors found
      const batchId = newShipments[0]?.batchId || `batch-${Date.now()}`;
      const batchDate = new Date().toISOString();

      const newErrorEntries: ErrorTrackingEntry[] = (parseErrors || []).map((err, idx) => ({
        id: `error-${batchId}-${idx}`,
        guideNumber: err.guideNumber || 'N/A',
        phone: err.phone,
        errorType: err.type as TrackingErrorType || 'PARSE_ERROR',
        errorReason: err.reason || 'Error al procesar',
        rawData: err.rawData,
        timestamp: batchDate,
        batchId,
        attemptedCarrier: err.carrier,
        resolved: false,
      }));

      if (newErrorEntries.length > 0) {
        setTrackingErrors(prev => [...prev, ...newErrorEntries]);
      }

      if (newShipments.length > 0) {
        setShipments((prev) => {
          const ids = new Set(newShipments.map((s) => s.id));
          const filteredPrev = prev.filter((s) => !ids.has(s.id));
          return [...filteredPrev, ...newShipments];
        });
        setViewMode('DETAILED');
        setNotification(`Carga exitosa: ${newShipments.length} guías añadidas y vinculadas.${newErrorEntries.length > 0 ? ` (${newErrorEntries.length} errores)` : ''}`);
        setInputText('');
        if (newShipments[0].batchId) {
          setActiveBatchId(newShipments[0].batchId);
          setLastBatchId(newShipments[0].batchId);
        }
        setLastBatchDate(batchDate);
        setShowLoadSummary(true);
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
        setViewMode('DETAILED');

        const totalShipments = shipments.length + newSummaryShipments.length;
        const expected = Object.keys(phoneRegistry).length;

        if (expected > 0 && totalShipments >= expected) {
          setNotification(
            `Resumen cargado. Total: ${totalShipments} guías (Esperadas: ${expected}). Completado.`
          );
        } else {
          setNotification(`Resumen cargado. ${newSummaryShipments.length} guías nuevas añadidas.`);
        }
        setInputText('');
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
      setViewMode('DETAILED');
      setNotification(`✅ ${result.shipments.length} guías cargadas desde Excel`);

      if (result.shipments[0]?.batchId) {
        setActiveBatchId(result.shipments[0].batchId);
      }
    } else if (result.error) {
      alert(`Error: ${result.error}`);
    }

    // Reset file input
    e.target.value = '';
  };

  const handleUpdateStatus = (id: string, status: ShipmentStatus) => {
    setShipments((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
  };

  const handleToggleCheck = (id: string) => {
    setShipments((prev) => prev.map((s) => (s.id === id ? { ...s, checkStatus: true } : s)));
  };

  const handleSaveEvidence = (id: string, imageData: string, analysis?: string) => {
    setShipments((prev) =>
      prev.map((s) => (s.id === id ? { ...s, evidenceImage: imageData, aiAnalysis: analysis } : s))
    );
  };

  const handleUpdateSmartTracking = (id: string, result: AITrackingResult) => {
    setShipments((prev) => prev.map((s) => (s.id === id ? { ...s, smartTracking: result } : s)));
  };

  const handleBatchUpdate = (updates: { id: string; status: ShipmentStatus }[]) => {
    setShipments((prev) =>
      prev.map((s) => {
        const update = updates.find((u) => u.id === s.id || s.id.includes(u.id));
        if (update) {
          return { ...s, status: update.status, checkStatus: true };
        }
        return s;
      })
    );
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
        setViewMode('DETAILED');
        setNotification(`Sesión cargada: ${loadedData.length} guías.`);
      } catch (err) {
        alert('Error cargando sesión.');
      }
    }
  };

  const handleSpecialFilter = (
    filterType: 'ALL' | 'ISSUES' | 'LONG_TRANSIT' | 'UNTRACKED' | ShipmentStatus
  ) => {
    if (Object.values(ShipmentStatus).includes(filterType as ShipmentStatus)) {
      setFilterStatus(filterType as ShipmentStatus);
      setSpecialFilter('ALL');
    } else {
      setSpecialFilter(filterType as 'ALL' | 'ISSUES' | 'LONG_TRANSIT' | 'UNTRACKED');
      setFilterStatus(null);
    }
    setFilterCarrier('ALL');
    window.scrollTo({ top: 800, behavior: 'smooth' });
  };

  // Filtering logic
  const filteredShipments = shipments.filter((s) => {
    if (activeBatchId !== 'ALL' && s.batchId !== activeBatchId) return false;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!s.id.toLowerCase().includes(query) && !s.phone?.includes(query)) return false;
    }

    if (viewMode === 'DETAILED') {
      const matchesCarrier = filterCarrier === 'ALL' || s.carrier === filterCarrier;

      let matchesSpecial = true;
      if (specialFilter === 'ISSUES') {
        matchesSpecial = s.status === ShipmentStatus.ISSUE;
      } else if (specialFilter === 'LONG_TRANSIT') {
        matchesSpecial =
          (s.detailedInfo?.daysInTransit || 0) > 5 && s.status !== ShipmentStatus.DELIVERED;
      } else if (specialFilter === 'UNTRACKED') {
        matchesSpecial = s.source === 'SUMMARY';
      }

      let matchesStatus = true;
      if (filterStatus) {
        matchesStatus = s.status === filterStatus;
      }

      return matchesCarrier && matchesSpecial && matchesStatus && !s.detailedInfo?.hasErrors;
    }
    return s.dateKey === filterDate && (filterCarrier === 'ALL' || s.carrier === filterCarrier);
  });

  const errorShipments = shipments.filter(
    (s) => s.detailedInfo?.hasErrors || s.detailedInfo?.events.length === 0
  );
  const currentStats = calculateStats(filteredShipments);
  const uniqueBatches = Array.from(new Set(shipments.map((s) => s.batchId))).filter(Boolean);

  // Render different tabs based on currentTab
  if (currentTab === 'predict') {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-navy-950">
        <PredictiveSystemPanel onClose={() => setCurrentTab('home')} />
      </div>
    );
  }

  // Main view
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-navy-950 text-slate-900 dark:text-slate-100 font-sans pb-32 transition-colors duration-300 relative">
      {/* Header */}
      <header className="bg-navy-900 text-white shadow-2xl sticky top-0 z-30 border-b border-gold-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className="bg-gradient-to-br from-gold-500 to-gold-700 p-2.5 rounded-xl shadow-lg transform hover:rotate-6 transition-transform cursor-pointer border border-gold-300"
              onClick={() => {
                setShipments([]);
                setViewMode('SIMPLE');
                setCurrentTab('home');
              }}
            >
              <Crown className="w-6 h-6 text-navy-900" />
            </div>
            <div className="hidden md:block">
              <h1 className="text-xl font-serif font-bold tracking-tight text-white leading-tight">
                LITPER <span className="text-gold-500">LOGÍSTICA</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-medium tracking-[0.2em] uppercase">
                Gestión Premium de Envíos
              </p>
            </div>
          </div>

          {/* Search bar */}
          {shipments.length > 0 && (
            <div className="hidden md:flex items-center bg-navy-800 rounded-lg px-3 py-2 border border-navy-700 mx-4 w-64 focus-within:ring-2 focus-within:ring-gold-500 transition-all">
              <Search className="w-4 h-4 text-slate-400 mr-2" />
              <input
                type="text"
                placeholder="Buscar guía o teléfono..."
                className="bg-transparent border-none outline-none text-sm text-white placeholder-slate-500 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          )}

          {/* Header actions */}
          <div className="flex items-center gap-2 md:gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 text-slate-300 hover:text-white hover:bg-navy-800 rounded-lg"
              title="Referencia Rápida"
            >
              <List className="w-5 h-5" />
            </button>

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
                onClick={() => setViewMode(viewMode === 'ALERTS' ? 'DETAILED' : 'ALERTS')}
                className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm ${viewMode === 'ALERTS' ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-navy-800 text-red-400 hover:bg-navy-700 border border-red-900/50'}`}
              >
                <Siren className={`w-4 h-4 ${viewMode !== 'ALERTS' ? 'animate-pulse' : ''}`} />
                <span className="hidden md:inline">
                  {viewMode === 'ALERTS' ? 'Ver Tablero' : 'Alertas'}
                </span>
              </button>
            )}

            <button
              onClick={handleDownloadExcel}
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-navy-800 hover:bg-navy-700 text-gold-500 border border-navy-700 rounded-lg text-sm font-bold transition-all shadow-sm"
              title="Descargar Base de Datos Excel"
            >
              <Download className="w-4 h-4" />
              Excel
            </button>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-full bg-navy-800 hover:bg-navy-700 transition-colors text-slate-400 hover:text-gold-400"
              title={darkMode ? 'Activar Modo Claro' : 'Activar Modo Oscuro'}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile search */}
        {shipments.length > 0 && (
          <div className="md:hidden px-4 pb-4">
            <div className="flex items-center bg-navy-800 rounded-lg px-3 py-2 border border-navy-700 w-full">
              <Search className="w-4 h-4 text-slate-400 mr-2" />
              <input
                type="text"
                placeholder="Buscar guía o teléfono..."
                className="bg-transparent border-none outline-none text-sm text-white placeholder-slate-500 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        )}
      </header>

      {/* Notification */}
      {notification && (
        <div className="fixed top-24 right-4 z-50 bg-emerald-500 text-white px-6 py-3 rounded-lg shadow-xl animate-in fade-in slide-in-from-right-10 flex items-center gap-3">
          <CheckCircle className="w-5 h-5" />
          <span className="font-bold text-sm">{notification}</span>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Tab Navigation */}
        <TabNavigation
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          hasShipments={shipments.length > 0}
        />

        {/* HOME TAB */}
        {currentTab === 'home' && viewMode !== 'ALERTS' && (
          <>
            {/* Show Load Summary when a batch was just loaded */}
            {showLoadSummary && lastBatchId && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    Resumen de Última Carga
                  </h2>
                  <button
                    onClick={() => setShowLoadSummary(false)}
                    className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  >
                    Cerrar resumen
                  </button>
                </div>
                <LoadSummaryView
                  shipments={shipments.filter(s => s.batchId === lastBatchId)}
                  errors={trackingErrors.filter(e => e.batchId === lastBatchId)}
                  batchId={lastBatchId}
                  batchDate={lastBatchDate}
                  onGuideClick={(shipment) => {
                    setSelectedShipment(shipment);
                    setIsDetailModalOpen(true);
                  }}
                  onRetryError={(error) => {
                    setNotification(`Reintentando guía ${error.guideNumber}...`);
                  }}
                  onMarkErrorResolved={(errorId, note) => {
                    setTrackingErrors(prev =>
                      prev.map(e => e.id === errorId ? { ...e, resolved: true, resolutionNote: note } : e)
                    );
                    setNotification('Error marcado como resuelto');
                  }}
                  onViewHistory={() => setShowHistory(true)}
                />
              </div>
            )}

            {/* Show History View */}
            {showHistory && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                    Historial de Cargas
                  </h2>
                  <button
                    onClick={() => setShowHistory(false)}
                    className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  >
                    Cerrar historial
                  </button>
                </div>
                <LoadHistoryPage
                  shipments={shipments}
                  errors={trackingErrors}
                  onGuideClick={(shipment) => {
                    setSelectedShipment(shipment);
                    setIsDetailModalOpen(true);
                  }}
                  onRetryError={(error) => {
                    setNotification(`Reintentando guía ${error.guideNumber}...`);
                  }}
                  onMarkErrorResolved={(errorId, note) => {
                    setTrackingErrors(prev =>
                      prev.map(e => e.id === errorId ? { ...e, resolved: true, resolutionNote: note } : e)
                    );
                    setNotification('Error marcado como resuelto');
                  }}
                />
              </div>
            )}

            {/* INPUT SECTION - Guide Loading Wizard */}
            {!showHistory && (
              <GuideLoadingWizard
                activeInputTab={activeInputTab}
                onTabChange={setActiveInputTab}
                phoneRegistryCount={Object.keys(phoneRegistry).length}
                shipmentsCount={shipments.length}
                inputCarrier={inputCarrier}
                onCarrierChange={setInputCarrier}
                inputText={inputText}
                onInputChange={setInputText}
                onProcess={handleProcessInput}
                onExcelUpload={handleExcelUpload}
                isExcelLoading={isExcelLoading}
                xlsxLoaded={xlsxLoaded}
              />
            )}

            {/* Batch selector */}
            {uniqueBatches.length > 0 && viewMode === 'DETAILED' && (
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                <span className="text-xs font-bold uppercase text-slate-500 flex-shrink-0">
                  Hojas de Carga:
                </span>
                <button
                  onClick={() => setActiveBatchId('ALL')}
                  className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors flex-shrink-0 ${activeBatchId === 'ALL' ? 'bg-navy-900 text-white border-navy-900' : 'bg-white dark:bg-navy-900 text-slate-500 border-slate-200'}`}
                >
                  Todas
                </button>
                {uniqueBatches.map((bId, idx) => (
                  <button
                    key={bId}
                    onClick={() => setActiveBatchId(bId as string)}
                    className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors flex-shrink-0 ${activeBatchId === bId ? 'bg-orange-500 text-white border-orange-500' : 'bg-white dark:bg-navy-900 text-slate-500 border-slate-200'}`}
                  >
                    Lote #{idx + 1}
                  </button>
                ))}
              </div>
            )}

            {/* Detailed view */}
            {viewMode === 'DETAILED' && (
              <section className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                {currentStats && <GeneralReport stats={currentStats} onFilter={handleSpecialFilter} />}

                <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-slate-200 dark:border-navy-800 pb-4">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-orange-500" />
                    Guías Gestionadas ({filteredShipments.length})
                    {specialFilter !== 'ALL' && (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full border border-red-200">
                        Filtro:{' '}
                        {specialFilter === 'ISSUES'
                          ? 'Novedades'
                          : specialFilter === 'UNTRACKED'
                            ? 'No Vinculadas'
                            : 'Más de 5 días'}
                      </span>
                    )}
                    {filterStatus && (
                      <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full border border-purple-200">
                        Estado: {filterStatus}
                      </span>
                    )}
                  </h3>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        setFilterCarrier('ALL');
                        setSpecialFilter('ALL');
                        setFilterStatus(null);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${filterCarrier === 'ALL' && specialFilter === 'ALL' && !filterStatus ? 'bg-navy-900 text-white border-navy-900' : 'bg-white dark:bg-navy-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-navy-700 hover:border-gold-500'}`}
                    >
                      TODAS
                    </button>
                    {Object.values(CarrierName)
                      .filter((c) => c !== CarrierName.UNKNOWN)
                      .map((c) => (
                        <button
                          key={c}
                          onClick={() => {
                            setFilterCarrier(c);
                            setSpecialFilter('ALL');
                            setFilterStatus(null);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${filterCarrier === c ? 'bg-gold-500 text-navy-900 border-gold-500 shadow-md' : 'bg-white dark:bg-navy-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-navy-700 hover:border-gold-500'}`}
                        >
                          {c.toUpperCase()}
                        </button>
                      ))}
                  </div>
                </div>

                {/* List of guides */}
                {specialFilter === 'UNTRACKED' ? (
                  <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-sm border border-slate-200 dark:border-navy-800 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-navy-950 border-b border-slate-200 dark:border-navy-800">
                          <tr>
                            <th className="px-6 py-4 font-bold">Guía</th>
                            <th className="px-6 py-4 font-bold">Celular</th>
                            <th className="px-6 py-4 font-bold">Fechas / Status</th>
                            <th className="px-6 py-4 font-bold">Status</th>
                            <th className="px-6 py-4 font-bold">Recomendaciones</th>
                            <th className="px-6 py-4 font-bold">Días</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredShipments.map((shipment) => (
                            <tr
                              key={shipment.id}
                              className="bg-white dark:bg-navy-900 border-b border-slate-100 dark:border-navy-800 hover:bg-slate-50 dark:hover:bg-navy-800/50"
                            >
                              <td className="px-6 py-4 font-bold text-orange-600">{shipment.id}</td>
                              <td className="px-6 py-4 font-mono">{shipment.phone || '-'}</td>
                              <td
                                className="px-6 py-4 max-w-xs"
                                title={shipment.detailedInfo?.rawStatus}
                              >
                                <span className="font-mono text-xs opacity-70 block">
                                  {shipment.detailedInfo?.events[0]?.date.replace('T', ' ')}
                                </span>
                                <span className="text-xs">{shipment.detailedInfo?.rawStatus}</span>
                              </td>
                              <td className="px-6 py-4">
                                <span
                                  className={`px-2 py-1 rounded text-xs font-bold ${
                                    shipment.status === ShipmentStatus.DELIVERED
                                      ? 'bg-emerald-100 text-emerald-700'
                                      : shipment.status === ShipmentStatus.ISSUE
                                        ? 'bg-red-100 text-red-700'
                                        : 'bg-blue-100 text-blue-700'
                                  }`}
                                >
                                  {shipment.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 italic text-xs">
                                {getShipmentRecommendation(shipment)}
                              </td>
                              <td className="px-6 py-4 font-bold">
                                ({shipment.detailedInfo?.daysInTransit} Días)
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-1">
                    {filteredShipments.map((shipment, index) => (
                      <DetailedShipmentCard
                        key={shipment.id}
                        shipment={shipment}
                        index={index}
                        onUpdateSmartTracking={handleUpdateSmartTracking}
                      />
                    ))}
                    {filteredShipments.length === 0 && (
                      <div className="text-center py-12 text-slate-400 border-2 border-dashed border-slate-200 dark:border-navy-800 rounded-xl">
                        <p>No se encontraron guías con el filtro seleccionado.</p>
                        <button
                          onClick={() => {
                            setSpecialFilter('ALL');
                            setFilterStatus(null);
                          }}
                          className="text-indigo-500 hover:underline mt-2 text-sm font-bold"
                        >
                          Ver todas
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Error shipments */}
                {errorShipments.length > 0 && specialFilter !== 'UNTRACKED' && (
                  <div className="mt-12 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-200 dark:border-red-900 p-6">
                    <h3 className="text-lg font-bold text-red-800 dark:text-red-400 flex items-center gap-2 mb-4">
                      <AlertOctagon className="w-6 h-6" />
                      Guías con Errores ({errorShipments.length})
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs text-red-700 uppercase bg-red-100 dark:bg-red-900/50">
                          <tr>
                            <th className="px-6 py-3">Guía</th>
                            <th className="px-6 py-3">Transportadora</th>
                            <th className="px-6 py-3">Error</th>
                          </tr>
                        </thead>
                        <tbody>
                          {errorShipments.map((s) => (
                            <tr
                              key={s.id}
                              className="bg-white dark:bg-navy-950 border-b border-red-100 dark:border-red-900"
                            >
                              <td className="px-6 py-4 font-bold">{s.id}</td>
                              <td className="px-6 py-4">{s.carrier}</td>
                              <td className="px-6 py-4 text-red-600">
                                {s.detailedInfo?.errorDetails?.join(', ') || 'Sin eventos'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Simple view (empty state) */}
            {viewMode === 'SIMPLE' && (
              <div className="text-center py-12 text-slate-400">
                <Package className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p>Cargue un reporte para ver el detalle de las guías.</p>
              </div>
            )}
          </>
        )}

        {/* Alert Dashboard */}
        {currentTab === 'home' && viewMode === 'ALERTS' && (
          <AlertDashboard
            shipments={shipments}
            onSelectShipment={(s) => {
              setSelectedShipment(s);
              setIsDetailModalOpen(true);
            }}
          />
        )}

        {/* AI REPORT TAB */}
        {currentTab === 'report' && (
          <AIReportTab
            shipments={shipments}
            onNavigateToSemaforo={() => setCurrentTab('semaforo')}
          />
        )}

        {/* SEMAFORO TAB */}
        {currentTab === 'semaforo' && (
          <SemaforoTab shipments={shipments} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-navy-900 border-t border-slate-200 dark:border-navy-800 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <p className="text-slate-500 text-xs">© 2025 Litper Logística - Versión Premium 3.0</p>
          <div
            className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold transition-colors ${isOnline ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'}`}
          >
            {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {isOnline ? 'Sistema Conectado' : 'Modo Offline'}
          </div>
        </div>
      </footer>

      {/* Floating action buttons */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-4">
        <button
          onClick={() => setIsAssistantOpen(true)}
          className="bg-navy-900 hover:bg-navy-800 text-gold-500 border-2 border-gold-500 p-4 rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-105"
          title="Abrir Chat Asistente"
        >
          <Sparkles className="w-6 h-6" />
        </button>
      </div>

      {/* Modals */}
      {selectedShipment && !isDetailModalOpen && (
        <EvidenceModal
          shipment={selectedShipment}
          onClose={() => setSelectedShipment(null)}
          onSave={handleSaveEvidence}
        />
      )}

      {selectedShipment && isDetailModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="bg-white dark:bg-navy-900 rounded-2xl relative">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="absolute top-4 right-4 z-10 p-2 bg-slate-100 hover:bg-slate-200 rounded-full"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
              <DetailedShipmentCard
                shipment={selectedShipment}
                index={0}
                onUpdateSmartTracking={handleUpdateSmartTracking}
              />
            </div>
          </div>
        </div>
      )}

      {isBatchModalOpen && (
        <BatchTrackingModal
          shipments={filteredShipments}
          onClose={() => setIsBatchModalOpen(false)}
          onUpdateBatch={handleBatchUpdate}
        />
      )}

      <AssistantPanel
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        shipmentsContext={shipments}
        onGenerateReport={() => ''}
      />

      <QuickReferencePanel
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        shipments={filteredShipments}
      />
    </div>
  );
};

export default App;
