// components/marketing/MarketingTab.tsx
// Pestaña de Marketing para el menú principal (fuera de Admin)

import React from 'react';
import { TrendingUp } from 'lucide-react';
import { MarketingModule } from './MarketingModule';

// ============================================
// COMPONENTE TAB
// ============================================

export function MarketingTab() {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-700 bg-gray-900/50">
        <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
          <TrendingUp className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Marketing Tracking</h1>
          <p className="text-sm text-gray-400">
            Sistema de seguimiento de publicidad digital
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <MarketingModule />
      </div>
    </div>
  );
}

// ============================================
// EXPORTS
// ============================================

export { MarketingModule } from './MarketingModule';
export { MarketingDashboard } from './dashboard/MarketingDashboard';
export { PlatformConnector, PlatformConnectorList, PlatformConnectionStatus } from './shared/PlatformConnector';

export default MarketingTab;
