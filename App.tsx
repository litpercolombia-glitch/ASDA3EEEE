import React, { useState, useEffect } from 'react';
import { Shipment, ShipmentStatus, CarrierName, AITrackingResult, ReportStats } from './types';
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
  generateInlineChatReport,
  parsePhoneRegistry,
  getShipmentRecommendation,
} from './services/logisticsService';
import { DetailedShipmentCard } from './components/DetailedShipmentCard';
import { GeneralReport } from './components/GeneralReport';
import { EvidenceModal } from './components/EvidenceModal';
import { AssistantPanel } from './components/AssistantPanel';
import { BatchTrackingModal } from './components/BatchTrackingModal';
import { AlertDashboard } from './components/AlertDashboard';
import { QuickReferencePanel } from './components/QuickReferencePanel';
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
} from 'lucide-react';

const App: React.FC = () => {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [phoneRegistry, setPhoneRegistry] = useState<Record<string, string>>({});

  const [viewMode, setViewMode] = useState<'SIMPLE' | 'DETAILED' | 'ALERTS'>('SIMPLE');
  const [activeInputTab, setActiveInputTab] = useState<'REPORT' | 'PHONES' | 'SUMMARY'>('PHONES'); // Default to Phones
  const [inputCarrier, setInputCarrier] = useState<CarrierName | 'AUTO'>('AUTO');

  const [inputText, setInputText] = useState('');
  const [filterDate, setFilterDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [filterCarrier, setFilterCarrier] = useState<string>('ALL');
  const [specialFilter, setSpecialFilter] = useState<
    'ALL' | 'ISSUES' | 'LONG_TRANSIT' | 'UNTRACKED'
  >('ALL');
  const [filterStatus, setFilterStatus] = useState<ShipmentStatus | null>(null); // New filter state

  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false); // For Alert clicks
  const [darkMode, setDarkMode] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // New Search & Batch State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeBatchId, setActiveBatchId] = useState<string>('ALL');

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

    // Determine if we need to force a carrier
    const forcedCarrier = inputCarrier !== 'AUTO' ? inputCarrier : undefined;

    if (activeInputTab === 'PHONES') {
      const newPhones = parsePhoneRegistry(inputText);

      // Update Registry State
      setPhoneRegistry((prev) => {
        const updated = { ...prev, ...newPhones };
        return updated;
      });

      // Also attempt to update existing shipments if matches found
      const mergedShipments = mergePhoneNumbers(inputText, shipments);
      const countDiff =
        mergedShipments.filter((s) => s.phone).length - shipments.filter((s) => s.phone).length;

      setShipments(mergedShipments);

      if (Object.keys(newPhones).length > 0) {
        setNotification(
          `${Object.keys(newPhones).length} celulares registrados. ${countDiff > 0 ? countDiff + ' guías actualizadas.' : 'Ahora cargue el reporte.'}`
        );
        setInputText('');
        // Suggest moving to Report tab
        setActiveInputTab('REPORT');
      } else {
        setNotification('No se encontraron celulares válidos.');
      }
    } else if (activeInputTab === 'REPORT') {
      // Pass phoneRegistry to parser to auto-link phones during creation
      // Pass forcedCarrier to override detection
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
        setViewMode('DETAILED');
        setNotification(`Carga exitosa: ${newShipments.length} guías añadidas y vinculadas.`);
        setInputText('');
        if (newShipments[0].batchId) {
          setActiveBatchId(newShipments[0].batchId);
        }
        // Auto-advance to SUMMARY tab
        setActiveInputTab('SUMMARY');
      } else {
        alert('No se detectaron guías en el reporte. Verifique el formato.');
      }
    } else if (activeInputTab === 'SUMMARY') {
      // Pass phoneRegistry AND existing shipments to parser to avoid duplicates
      // Pass forcedCarrier
      const { shipments: newSummaryShipments } = parseSummaryInput(
        inputText,
        phoneRegistry,
        shipments,
        forcedCarrier
      );

      if (newSummaryShipments.length > 0) {
        setShipments((prev) => [...prev, ...newSummaryShipments]);
        setViewMode('DETAILED');

        // Logic to check completeness
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
        // Even if no NEW shipments, give feedback
        setNotification('Resumen procesado. No se encontraron guías nuevas faltantes.');
        setInputText('');
      }
    }
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

  const handleAssistantReport = (): string => {
    // Filter for Untracked guides for the assistant report if the filter is active, otherwise all
    const guidesToReport =
      specialFilter === 'UNTRACKED' ? shipments.filter((s) => s.source === 'SUMMARY') : shipments;
    return generateInlineChatReport(guidesToReport);
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
        // Also restore registry if possible (mock logic here as registry isn't saved in json currently)
        // But loading shipments will have phones attached so it's fine.
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

  // --- FILTERING LOGIC ---
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

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-navy-950 text-slate-900 dark:text-slate-100 font-sans pb-32 transition-colors duration-300 relative">
      <header className="bg-navy-900 text-white shadow-2xl sticky top-0 z-30 border-b border-gold-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className="bg-gradient-to-br from-gold-500 to-gold-700 p-2.5 rounded-xl shadow-lg transform hover:rotate-6 transition-transform cursor-pointer border border-gold-300"
              onClick={() => {
                setShipments([]);
                setViewMode('SIMPLE');
              }}
            >
              <Crown className="w-6 h-6 text-navy-900" />
            </div>
            <div className="hidden md:block">
              <h1 className="text-xl font-serif font-bold tracking-tight text-white leading-tight">
                LITPER <span className="text-gold-500">SEGUIMIENTO DE GUIA</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-medium tracking-[0.2em] uppercase">
                Gestión Logística Premium
              </p>
            </div>
          </div>

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
                  {viewMode === 'ALERTS' ? 'Ver Tablero' : 'Centro Alertas'}
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

      {notification && (
        <div className="fixed top-24 right-4 z-50 bg-emerald-500 text-white px-6 py-3 rounded-lg shadow-xl animate-in fade-in slide-in-from-right-10 flex items-center gap-3">
          <CheckCircle className="w-5 h-5" />
          <span className="font-bold text-sm">{notification}</span>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* INPUT SECTION */}
        {viewMode !== 'ALERTS' && (
          <section className="bg-white dark:bg-navy-900 rounded-2xl shadow-lg border border-slate-200 dark:border-navy-800 overflow-hidden">
            <div className="flex border-b border-slate-200 dark:border-navy-800 overflow-x-auto">
              <button
                onClick={() => setActiveInputTab('PHONES')}
                className={`flex-1 min-w-[150px] py-4 text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${activeInputTab === 'PHONES' ? 'bg-white dark:bg-navy-900 text-emerald-600 border-b-4 border-emerald-500' : 'bg-slate-50 dark:bg-navy-950 text-slate-400 hover:text-slate-600'}`}
              >
                <div
                  className={`p-1.5 rounded-full ${activeInputTab === 'PHONES' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}
                >
                  <Smartphone className="w-4 h-4" />
                </div>
                1. Asociar Celulares
              </button>
              <button
                onClick={() => setActiveInputTab('REPORT')}
                className={`flex-1 min-w-[150px] py-4 text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${activeInputTab === 'REPORT' ? 'bg-white dark:bg-navy-900 text-orange-600 border-b-4 border-orange-500' : 'bg-slate-50 dark:bg-navy-950 text-slate-400 hover:text-slate-600'}`}
              >
                <div
                  className={`p-1.5 rounded-full ${activeInputTab === 'REPORT' ? 'bg-orange-100 text-orange-600' : 'bg-slate-200 text-slate-500'}`}
                >
                  <ClipboardList className="w-4 h-4" />
                </div>
                2. Cargar Reporte
              </button>
              <button
                onClick={() => setActiveInputTab('SUMMARY')}
                className={`flex-1 min-w-[150px] py-4 text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${activeInputTab === 'SUMMARY' ? 'bg-white dark:bg-navy-900 text-blue-600 border-b-4 border-blue-500' : 'bg-slate-50 dark:bg-navy-950 text-slate-400 hover:text-slate-600'}`}
              >
                <div
                  className={`p-1.5 rounded-full ${activeInputTab === 'SUMMARY' ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-500'}`}
                >
                  <LayoutList className="w-4 h-4" />
                </div>
                3. Resumen Guías
              </button>
            </div>

            <div>
              {/* NEW: Carrier Selection Buttons */}
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
                              ? `text-white shadow-md transform scale-105 ${
                                  c === CarrierName.INTER_RAPIDISIMO
                                    ? 'bg-orange-500 border-orange-500'
                                    : c === CarrierName.ENVIA
                                      ? 'bg-red-600 border-red-600'
                                      : c === CarrierName.COORDINADORA
                                        ? 'bg-blue-600 border-blue-600'
                                        : c === CarrierName.TCC
                                          ? 'bg-yellow-500 border-yellow-500'
                                          : 'bg-emerald-600 border-emerald-600'
                                }`
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
          </section>
        )}

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

        {viewMode === 'ALERTS' && (
          <AlertDashboard
            shipments={shipments}
            onSelectShipment={(s) => {
              setSelectedShipment(s);
              setIsDetailModalOpen(true);
            }}
          />
        )}

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
                        ? 'Guías No Vinculadas'
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

            {/* LIST OF GUIDES */}
            {specialFilter === 'UNTRACKED' ? (
              // TABLE VIEW FOR UNTRACKED GUIDES
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
                        <th className="px-6 py-4 font-bold">Días después despacho</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredShipments.map((shipment) => (
                        <tr
                          key={shipment.id}
                          className="bg-white dark:bg-navy-900 border-b border-slate-100 dark:border-navy-800 hover:bg-slate-50 dark:hover:bg-navy-800/50"
                        >
                          <td className="px-6 py-4 font-bold text-orange-600">{shipment.id}</td>
                          <td className="px-6 py-4 font-mono">{shipment.phone || '3000000000'}</td>
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
              // STANDARD CARD VIEW (Now using Compact Row by default)
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

            {/* ... Error section ... */}
            {errorShipments.length > 0 && specialFilter !== 'UNTRACKED' && (
              <div className="mt-12 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-200 dark:border-red-900 p-6">
                <h3 className="text-lg font-bold text-red-800 dark:text-red-400 flex items-center gap-2 mb-4">
                  <AlertOctagon className="w-6 h-6" />
                  Guías con Errores o Sin Información ({errorShipments.length})
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-red-700 uppercase bg-red-100 dark:bg-red-900/50">
                      <tr>
                        <th className="px-6 py-3">Guía</th>
                        <th className="px-6 py-3">Transportadora</th>
                        <th className="px-6 py-3">Error Detectado</th>
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
                            {s.detailedInfo?.errorDetails?.join(', ') ||
                              'Formato irreconocible o sin eventos'}
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

        {/* ... Simple View, Footer, Modals ... */}
        {viewMode === 'SIMPLE' && (
          <div className="text-center py-12 text-slate-400">
            <Package className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p>Cargue un reporte para ver el detalle de las guías.</p>
          </div>
        )}
      </main>

      <footer className="bg-white dark:bg-navy-900 border-t border-slate-200 dark:border-navy-800 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <p className="text-slate-500 text-xs">© 2025 Litper Logística - Versión Premium 2.1</p>
          <div
            className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold transition-colors ${isOnline ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'}`}
          >
            {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {isOnline ? 'Sistema Conectado' : 'Modo Offline (Solo Lectura)'}
          </div>
        </div>
      </footer>

      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-4">
        <button
          onClick={() => setIsAssistantOpen(true)}
          className="bg-navy-900 hover:bg-navy-800 text-gold-500 border-2 border-gold-500 p-4 rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-105"
          title="Abrir Chat Asistente"
        >
          <Sparkles className="w-6 h-6" />
        </button>
      </div>

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
        onGenerateReport={handleAssistantReport}
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
