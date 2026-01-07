// components/layout/AppLayout.tsx
// Layout principal con sidebar - Versión funcional completa

import React, { useState } from 'react';
import {
  Search,
  Bell,
  Moon,
  Sun,
  Globe,
  ChevronDown,
  Upload,
  X,
  Check,
  AlertTriangle,
  FileSpreadsheet,
  FileText,
  Smartphone,
  LayoutList,
  FileUp,
  Save,
  Download,
} from 'lucide-react';
import { Sidebar } from './Sidebar';
import { useLayoutStore } from '../../stores/layoutStore';
import { Country } from '../../types/country';

// ============================================
// TIPOS
// ============================================

interface TopBarProps {
  selectedCountry: Country;
  onCountryChange: () => void;
  darkMode: boolean;
  onDarkModeToggle: () => void;
  onLoadData: () => void;
  showLoadData: boolean;
  notificationCount?: number;
  onNotificationsClick: () => void;
  onExportSession: () => void;
  onImportSession: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExportExcel: () => void;
  shipmentsCount: number;
}

interface AppLayoutProps {
  children: React.ReactNode;
  selectedCountry: Country;
  onCountryChange: () => void;
  darkMode: boolean;
  onDarkModeToggle: () => void;
  onLoadData: () => void;
  showLoadData: boolean;
  notificationCount?: number;
  onNotificationsClick: () => void;
  onExportSession: () => void;
  onImportSession: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExportExcel: () => void;
  shipmentsCount: number;
  onLogout: () => void;
  onOpenChat: () => void;
  onOpenHelp: () => void;
  userName?: string;
  userEmail?: string;
}

// ============================================
// TOP BAR
// ============================================

function TopBar({
  selectedCountry,
  onCountryChange,
  darkMode,
  onDarkModeToggle,
  onLoadData,
  showLoadData,
  notificationCount = 0,
  onNotificationsClick,
  onExportSession,
  onImportSession,
  onExportExcel,
  shipmentsCount,
}: TopBarProps) {
  const countryFlags: Record<string, string> = {
    'Colombia': '🇨🇴',
    'Ecuador': '🇪🇨',
    'Chile': '🇨🇱',
  };

  return (
    <header className="h-14 bg-gray-900/95 border-b border-gray-800 flex items-center justify-between px-4 sticky top-0 z-40 backdrop-blur-sm">
      {/* Search */}
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar guías, clientes, campañas... (Ctrl+K)"
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 ml-4">
        {/* Load Data Button */}
        <button
          onClick={onLoadData}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl font-medium text-sm transition-all ${
            showLoadData
              ? 'bg-blue-600 text-white'
              : 'bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-700 hover:to-green-700'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span className="hidden sm:inline">Cargar Guías</span>
        </button>

        {/* Session Controls */}
        <div className="hidden md:flex items-center gap-1 bg-gray-800 border border-gray-700 rounded-xl p-1">
          <button
            onClick={onExportSession}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            title="Guardar Sesión"
          >
            <Save className="w-4 h-4" />
          </button>
          <label className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg cursor-pointer transition-colors" title="Cargar Sesión">
            <Download className="w-4 h-4" />
            <input type="file" accept=".json" onChange={onImportSession} className="hidden" />
          </label>
          {shipmentsCount > 0 && (
            <button
              onClick={onExportExcel}
              className="p-2 text-emerald-400 hover:text-emerald-300 hover:bg-gray-700 rounded-lg transition-colors"
              title="Descargar Excel"
            >
              <FileSpreadsheet className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Country Selector */}
        <button
          onClick={onCountryChange}
          className="flex items-center gap-2 px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl hover:bg-gray-700 hover:border-gray-600 transition-all"
        >
          <span className="text-lg">{countryFlags[selectedCountry] || '🌎'}</span>
          <span className="text-sm text-white hidden sm:inline">{selectedCountry?.slice(0, 2).toUpperCase() || 'CO'}</span>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </button>

        {/* Notifications */}
        <button
          onClick={onNotificationsClick}
          className="relative p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-colors"
        >
          <Bell className="w-5 h-5" />
          {notificationCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold bg-red-500 text-white rounded-full">
              {notificationCount > 99 ? '99+' : notificationCount}
            </span>
          )}
        </button>

        {/* Theme Toggle */}
        <button
          onClick={onDarkModeToggle}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-colors"
          title={darkMode ? 'Modo claro' : 'Modo oscuro'}
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>
    </header>
  );
}

// ============================================
// APP LAYOUT
// ============================================

export function AppLayout({
  children,
  selectedCountry,
  onCountryChange,
  darkMode,
  onDarkModeToggle,
  onLoadData,
  showLoadData,
  notificationCount,
  onNotificationsClick,
  onExportSession,
  onImportSession,
  onExportExcel,
  shipmentsCount,
  onLogout,
  onOpenChat,
  onOpenHelp,
  userName,
  userEmail,
}: AppLayoutProps) {
  return (
    <div className={`flex h-screen overflow-hidden ${darkMode ? 'bg-gray-950' : 'bg-gray-100'}`}>
      {/* Sidebar */}
      <Sidebar
        onLogout={onLogout}
        onOpenChat={onOpenChat}
        onOpenHelp={onOpenHelp}
        userName={userName}
        userEmail={userEmail}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <TopBar
          selectedCountry={selectedCountry}
          onCountryChange={onCountryChange}
          darkMode={darkMode}
          onDarkModeToggle={onDarkModeToggle}
          onLoadData={onLoadData}
          showLoadData={showLoadData}
          notificationCount={notificationCount}
          onNotificationsClick={onNotificationsClick}
          onExportSession={onExportSession}
          onImportSession={onImportSession}
          onExportExcel={onExportExcel}
          shipmentsCount={shipmentsCount}
        />

        {/* Content Area */}
        <main className={`flex-1 overflow-auto ${darkMode ? 'bg-gray-950' : 'bg-gray-50'}`}>
          {children}
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
