/**
 * Tests para hooks/useAppState.ts
 *
 * Verifica que el hook centralizado de estado funciona correctamente.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAppState } from '../../hooks/useAppState';

// Mock de los stores
vi.mock('../../stores/uiStore', () => ({
  useUIStore: () => ({
    activeTab: 'seguimiento',
    setActiveTab: vi.fn(),
    theme: 'dark',
    toggleTheme: vi.fn(),
    mobileMenuOpen: false,
    toggleMobileMenu: vi.fn(),
    searchQuery: '',
    setSearchQuery: vi.fn(),
    searchOpen: false,
    toggleSearch: vi.fn(),
    closeSearch: vi.fn(),
    addNotification: vi.fn(),
  }),
}));

vi.mock('../../stores/shipmentStore', () => ({
  useShipmentStore: () => ({
    shipments: [],
    setShipments: vi.fn(),
    addShipments: vi.fn(),
  }),
}));

// Mock de servicios
vi.mock('../../services/logisticsService', () => ({
  saveShipments: vi.fn(),
  loadShipments: vi.fn(() => []),
  parseDetailedInput: vi.fn(() => ({ shipments: [] })),
  mergePhoneNumbers: vi.fn((text, shipments) => shipments),
  parseSummaryInput: vi.fn(() => ({ shipments: [] })),
  parsePhoneRegistry: vi.fn(() => ({})),
}));

vi.mock('../../services/countryService', () => ({
  getSelectedCountry: vi.fn(() => null),
  setSelectedCountry: vi.fn(),
}));

vi.mock('../../services/gamificationService', () => ({
  getUserProfile: vi.fn(() => ({
    level: 1,
    totalXP: 0,
    activeChallenges: [],
  })),
}));

vi.mock('../../utils/patternDetection', () => ({
  detectarGuiasRetrasadas: vi.fn(() => []),
}));

describe('useAppState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================
  // Initial State tests
  // ============================================
  describe('initial state', () => {
    it('should return current tab from UI store', () => {
      const { result } = renderHook(() => useAppState());

      expect(result.current.currentTab).toBe('seguimiento');
    });

    it('should return dark mode state from UI store', () => {
      const { result } = renderHook(() => useAppState());

      expect(result.current.darkMode).toBe(true);
    });

    it('should return shipments from shipment store', () => {
      const { result } = renderHook(() => useAppState());

      expect(result.current.shipments).toEqual([]);
    });

    it('should initialize with closed data input', () => {
      const { result } = renderHook(() => useAppState());

      expect(result.current.dataInput.isOpen).toBe(false);
    });

    it('should initialize with empty phone registry', () => {
      const { result } = renderHook(() => useAppState());

      expect(result.current.phoneRegistry).toEqual({});
    });

    it('should provide user profile', () => {
      const { result } = renderHook(() => useAppState());

      expect(result.current.userProfile).toBeDefined();
      expect(result.current.userProfile.level).toBe(1);
    });
  });

  // ============================================
  // Country Selection tests
  // ============================================
  describe('country selection', () => {
    it('should initially have no country selected', () => {
      const { result } = renderHook(() => useAppState());

      expect(result.current.country).toBeNull();
    });

    it('should select country correctly', () => {
      const { result } = renderHook(() => useAppState());

      act(() => {
        result.current.selectCountry('Colombia' as any);
      });

      expect(result.current.country).toBe('Colombia');
      expect(result.current.showCountrySelector).toBe(false);
    });

    it('should open country selector', () => {
      const { result } = renderHook(() => useAppState());

      act(() => {
        result.current.openCountrySelector();
      });

      expect(result.current.showCountrySelector).toBe(true);
    });

    it('should close country selector', () => {
      const { result } = renderHook(() => useAppState());

      act(() => {
        result.current.openCountrySelector();
      });

      act(() => {
        result.current.closeCountrySelector();
      });

      expect(result.current.showCountrySelector).toBe(false);
    });
  });

  // ============================================
  // Data Input Modal tests
  // ============================================
  describe('data input modal', () => {
    it('should open data input modal', () => {
      const { result } = renderHook(() => useAppState());

      act(() => {
        result.current.openDataInput();
      });

      expect(result.current.dataInput.isOpen).toBe(true);
    });

    it('should close data input modal', () => {
      const { result } = renderHook(() => useAppState());

      act(() => {
        result.current.openDataInput();
      });

      act(() => {
        result.current.closeDataInput();
      });

      expect(result.current.dataInput.isOpen).toBe(false);
    });

    it('should set input tab', () => {
      const { result } = renderHook(() => useAppState());

      act(() => {
        result.current.setInputTab('REPORT');
      });

      expect(result.current.dataInput.activeTab).toBe('REPORT');
    });

    it('should set input carrier', () => {
      const { result } = renderHook(() => useAppState());

      act(() => {
        result.current.setInputCarrier('COORDINADORA' as any);
      });

      expect(result.current.dataInput.carrier).toBe('COORDINADORA');
    });

    it('should set input text', () => {
      const { result } = renderHook(() => useAppState());

      act(() => {
        result.current.setInputText('12345678901');
      });

      expect(result.current.dataInput.text).toBe('12345678901');
    });
  });

  // ============================================
  // Computed values tests
  // ============================================
  describe('computed values', () => {
    it('should compute guiasRetrasadas', () => {
      const { result } = renderHook(() => useAppState());

      expect(result.current.guiasRetrasadas).toBeDefined();
      expect(Array.isArray(result.current.guiasRetrasadas)).toBe(true);
    });

    it('should compute alertasCriticas', () => {
      const { result } = renderHook(() => useAppState());

      expect(typeof result.current.alertasCriticas).toBe('number');
    });

    it('should compute tabNotifications', () => {
      const { result } = renderHook(() => useAppState());

      expect(result.current.tabNotifications).toBeDefined();
      expect(typeof result.current.tabNotifications.seguimiento).toBe('number');
    });
  });

  // ============================================
  // Network status tests
  // ============================================
  describe('network status', () => {
    it('should initialize with navigator.onLine status', () => {
      const { result } = renderHook(() => useAppState());

      expect(typeof result.current.isOnline).toBe('boolean');
    });
  });

  // ============================================
  // Store integration tests
  // ============================================
  describe('store integration', () => {
    it('should have setCurrentTab function', () => {
      const { result } = renderHook(() => useAppState());

      expect(typeof result.current.setCurrentTab).toBe('function');
    });

    it('should have toggleDarkMode function', () => {
      const { result } = renderHook(() => useAppState());

      expect(typeof result.current.toggleDarkMode).toBe('function');
    });

    it('should have setShipments function', () => {
      const { result } = renderHook(() => useAppState());

      expect(typeof result.current.setShipments).toBe('function');
    });

    it('should have addNotification function', () => {
      const { result } = renderHook(() => useAppState());

      expect(typeof result.current.addNotification).toBe('function');
    });
  });

  // ============================================
  // Process Input tests
  // ============================================
  describe('processInput', () => {
    it('should have processInput function', () => {
      const { result } = renderHook(() => useAppState());

      expect(typeof result.current.processInput).toBe('function');
    });

    it('should do nothing when input text is empty', () => {
      const { result } = renderHook(() => useAppState());

      // Ensure text is empty
      expect(result.current.dataInput.text).toBe('');

      // Should not throw
      act(() => {
        result.current.processInput();
      });
    });
  });
});
