// components/layout/AppLayout.tsx
// Layout principal con sidebar

import React from 'react';
import {
  Search,
  Bell,
  Moon,
  Sun,
  Globe,
  ChevronDown,
} from 'lucide-react';
import { Sidebar } from './Sidebar';
import { useLayoutStore } from '../../stores/layoutStore';

// ============================================
// TOP BAR
// ============================================

function TopBar() {
  const [isDark, setIsDark] = React.useState(true);
  const [country, setCountry] = React.useState<'CO' | 'EC' | 'CL'>('CO');

  const countries = {
    CO: { name: 'Colombia', flag: '🇨🇴' },
    EC: { name: 'Ecuador', flag: '🇪🇨' },
    CL: { name: 'Chile', flag: '🇨🇱' },
  };

  return (
    <header className="h-14 bg-gray-900/95 border-b border-gray-800 flex items-center justify-between px-4 sticky top-0 z-40 backdrop-blur-sm">
      {/* Search */}
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar guías, clientes, campañas..."
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 ml-4">
        {/* Country Selector */}
        <button className="flex items-center gap-2 px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl hover:bg-gray-700 transition-colors">
          <span className="text-lg">{countries[country].flag}</span>
          <span className="text-sm text-white">{country}</span>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </button>

        {/* Notifications */}
        <button className="relative p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={() => setIsDark(!isDark)}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-colors"
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>
    </header>
  );
}

// ============================================
// APP LAYOUT
// ============================================

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { sidebarCollapsed } = useLayoutStore();

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <TopBar />

        {/* Content Area */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
