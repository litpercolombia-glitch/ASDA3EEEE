/**
 * useAppState Hook
 *
 * Centraliza el estado de la aplicación conectando con los stores existentes.
 * Elimina la necesidad de 15+ useState en App.tsx.
 *
 * ANTES: App.tsx tenía 15+ useState locales
 * AHORA: Un solo hook que conecta con Zustand stores
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Shipment, CarrierName } from '../types';
import { MainTabNew } from '../types/logistics';
import { Country } from '../types/country';
import { useUIStore } from '../stores/uiStore';
import { useShipmentStore } from '../stores/shipmentStore';
import {
  saveShipments,
  loadShipments,
  parseDetailedInput,
  mergePhoneNumbers,
  parseSummaryInput,
  parsePhoneRegistry,
} from '../services/logisticsService';
import { getSelectedCountry, setSelectedCountry as saveCountry } from '../services/countryService';
import { getUserProfile } from '../services/gamificationService';
import { detectarGuiasRetrasadas } from '../utils/patternDetection';

// ============================================
// TIPOS
// ============================================

export type InputTabType = 'PHONES' | 'REPORT' | 'SUMMARY' | 'EXCEL';

export interface DataInputState {
  isOpen: boolean;
  activeTab: InputTabType;
  carrier: CarrierName | 'AUTO';
  text: string;
}

export interface AppState {
  // Country
  country: Country | null;
  showCountrySelector: boolean;

  // Data Input Modal
  dataInput: DataInputState;

  // Phone Registry
  phoneRegistry: Record<string, string>;

  // Network
  isOnline: boolean;
}

export interface AppActions {
  // Country
  selectCountry: (country: Country) => void;
  openCountrySelector: () => void;
  closeCountrySelector: () => void;

  // Data Input
  openDataInput: () => void;
  closeDataInput: () => void;
  setInputTab: (tab: InputTabType) => void;
  setInputCarrier: (carrier: CarrierName | 'AUTO') => void;
  setInputText: (text: string) => void;
  processInput: () => void;
  handleExcelUpload: (file: File, phoneRegistry: Record<string, string>) => Promise<void>;
}

export interface AppComputed {
  userProfile: ReturnType<typeof getUserProfile>;
  guiasRetrasadas: ReturnType<typeof detectarGuiasRetrasadas>;
  alertasCriticas: number;
  tabNotifications: Record<string, number>;
}

// ============================================
// HOOK
// ============================================

export function useAppState() {
  // ========== Connect to existing stores ==========
  const uiStore = useUIStore();
  const shipmentStore = useShipmentStore();

  // ========== Local state (only what's not in stores) ==========
  const [country, setCountry] = useState<Country | null>(null);
  const [showCountrySelector, setShowCountrySelector] = useState(false);
  const [phoneRegistry, setPhoneRegistry] = useState<Record<string, string>>({});
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Data input modal state
  const [dataInput, setDataInput] = useState<DataInputState>({
    isOpen: false,
    activeTab: 'PHONES',
    carrier: 'AUTO',
    text: '',
  });

  // ========== Initialize on mount ==========
  useEffect(() => {
    // Load country
    const savedCountry = getSelectedCountry();
    if (savedCountry) {
      setCountry(savedCountry);
    } else {
      setShowCountrySelector(true);
    }

    // Load shipments into store
    const data = loadShipments();
    if (data.length > 0) {
      shipmentStore.setShipments(data);
    }

    // Network listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // ========== Sync shipments to localStorage ==========
  useEffect(() => {
    if (shipmentStore.shipments.length > 0) {
      saveShipments(shipmentStore.shipments);
    }
  }, [shipmentStore.shipments]);

  // ========== Computed values ==========
  // getUserProfile needs to be called fresh to get updated profile data
  const userProfile = getUserProfile();

  const guiasRetrasadas = useMemo(
    () => detectarGuiasRetrasadas(shipmentStore.shipments),
    [shipmentStore.shipments]
  );

  const alertasCriticas = useMemo(
    () => guiasRetrasadas.filter((g) => g.nivelAlerta === 'CRITICO').length,
    [guiasRetrasadas]
  );

  const tabNotifications = useMemo(
    () => ({
      seguimiento: alertasCriticas,
      demanda: 0,
      gamificacion: userProfile.activeChallenges.filter((c) => !c.completed).length,
      'inteligencia-logistica': guiasRetrasadas.filter((g) => g.diasSinMovimiento > 5).length,
      semaforo: 0,
      predicciones: 0,
      reporte: 0,
      asistente: 0,
      ml: 0,
      'procesos-litper': 0,
      'ciudad-agentes': 0,
      'aprendizaje-ia': 0,
    }),
    [alertasCriticas, userProfile.activeChallenges, guiasRetrasadas]
  );

  // ========== Actions ==========
  const selectCountry = useCallback((selectedCountry: Country) => {
    setCountry(selectedCountry);
    saveCountry(selectedCountry);
    setShowCountrySelector(false);
  }, []);

  const openCountrySelector = useCallback(() => setShowCountrySelector(true), []);
  const closeCountrySelector = useCallback(() => setShowCountrySelector(false), []);

  const openDataInput = useCallback(() => {
    setDataInput((prev) => ({ ...prev, isOpen: true }));
  }, []);

  const closeDataInput = useCallback(() => {
    setDataInput((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const setInputTab = useCallback((tab: InputTabType) => {
    setDataInput((prev) => ({ ...prev, activeTab: tab }));
  }, []);

  const setInputCarrier = useCallback((carrier: CarrierName | 'AUTO') => {
    setDataInput((prev) => ({ ...prev, carrier }));
  }, []);

  const setInputText = useCallback((text: string) => {
    setDataInput((prev) => ({ ...prev, text }));
  }, []);

  const processInput = useCallback(() => {
    const { activeTab, carrier, text } = dataInput;
    if (!text.trim()) return;

    const forcedCarrier = carrier !== 'AUTO' ? carrier : undefined;
    const shipments = shipmentStore.shipments;

    if (activeTab === 'PHONES') {
      const newPhones = parsePhoneRegistry(text);
      setPhoneRegistry((prev) => ({ ...prev, ...newPhones }));
      const mergedShipments = mergePhoneNumbers(text, shipments);
      const countDiff =
        mergedShipments.filter((s) => s.phone).length - shipments.filter((s) => s.phone).length;
      shipmentStore.setShipments(mergedShipments);

      if (Object.keys(newPhones).length > 0) {
        uiStore.addNotification({
          type: 'success',
          title: `${Object.keys(newPhones).length} celulares registrados`,
          message: countDiff > 0 ? `${countDiff} guías actualizadas` : undefined,
        });
        setDataInput((prev) => ({ ...prev, text: '', activeTab: 'REPORT' }));
      } else {
        uiStore.addNotification({
          type: 'warning',
          title: 'No se encontraron celulares válidos',
        });
      }
    } else if (activeTab === 'REPORT') {
      const { shipments: newShipments } = parseDetailedInput(text, phoneRegistry, forcedCarrier);
      if (newShipments.length > 0) {
        const ids = new Set(newShipments.map((s) => s.id));
        shipmentStore.setShipments([
          ...shipments.filter((s) => !ids.has(s.id)),
          ...newShipments,
        ]);
        uiStore.addNotification({
          type: 'success',
          title: `${newShipments.length} guías cargadas exitosamente`,
        });
        setDataInput((prev) => ({ ...prev, text: '', activeTab: 'SUMMARY' }));
      } else {
        uiStore.addNotification({
          type: 'warning',
          title: 'No se detectaron guías en el reporte',
        });
      }
    } else if (activeTab === 'SUMMARY') {
      const { shipments: newSummaryShipments } = parseSummaryInput(
        text,
        phoneRegistry,
        shipments,
        forcedCarrier
      );
      if (newSummaryShipments.length > 0) {
        shipmentStore.addShipments(newSummaryShipments);
        uiStore.addNotification({
          type: 'success',
          title: `${newSummaryShipments.length} guías nuevas añadidas`,
        });
        setDataInput({ isOpen: false, activeTab: 'PHONES', carrier: 'AUTO', text: '' });
      } else {
        uiStore.addNotification({
          type: 'info',
          title: 'No se encontraron guías nuevas',
        });
        setDataInput((prev) => ({ ...prev, text: '' }));
      }
    }
  }, [dataInput, phoneRegistry, shipmentStore, uiStore]);

  // ========== Return combined state ==========
  return {
    // From UI Store
    currentTab: uiStore.activeTab as MainTabNew | 'home',
    setCurrentTab: uiStore.setActiveTab,
    darkMode: uiStore.theme === 'dark',
    toggleDarkMode: uiStore.toggleTheme,
    showMobileMenu: uiStore.mobileMenuOpen,
    toggleMobileMenu: uiStore.toggleMobileMenu,
    searchQuery: uiStore.searchQuery,
    setSearchQuery: uiStore.setSearchQuery,
    showUniversalSearch: uiStore.searchOpen,
    setShowUniversalSearch: (show: boolean) =>
      show ? uiStore.toggleSearch() : uiStore.closeSearch(),
    addNotification: uiStore.addNotification,

    // From Shipment Store
    shipments: shipmentStore.shipments,
    setShipments: shipmentStore.setShipments,
    addShipments: shipmentStore.addShipments,

    // Local state
    country,
    showCountrySelector,
    phoneRegistry,
    isOnline,
    dataInput,

    // Actions
    selectCountry,
    openCountrySelector,
    closeCountrySelector,
    openDataInput,
    closeDataInput,
    setInputTab,
    setInputCarrier,
    setInputText,
    processInput,

    // Computed
    userProfile,
    guiasRetrasadas,
    alertasCriticas,
    tabNotifications,
  };
}

export default useAppState;
