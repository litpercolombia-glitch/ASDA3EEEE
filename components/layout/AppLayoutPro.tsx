// components/layout/AppLayoutPro.tsx
// Layout profesional estilo Linear/Stripe

import React, { useState, useCallback } from 'react';
import { Shipment } from '../../types';
import { HeaderPro } from './HeaderPro';
import { SidebarPro, SidebarSection } from './SidebarPro';
import { CommandPalette, useCommandPalette } from '../CommandPalette';
import { StripeDashboard } from '../dashboard/StripeDashboard';

// ============================================
// TIPOS
// ============================================

interface AppLayoutProProps {
  children: React.ReactNode;
  shipments: Shipment[];
  onLogout: () => void;
  onNewGuide: () => void;
  onUploadExcel: () => void;
  onGenerateReport: () => void;
  userName?: string;
  userEmail?: string;
  notifications?: number;
  pendingShipments?: number;
  recentGuides?: { id: string; label: string }[];
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export function AppLayoutPro({
  children,
  shipments,
  onLogout,
  onNewGuide,
  onUploadExcel,
  onGenerateReport,
  userName,
  userEmail,
  notifications = 0,
  pendingShipments = 0,
  recentGuides = [],
}: AppLayoutProProps) {
  const [activeSection, setActiveSection] = useState<SidebarSection>('inicio');
  const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Keyboard shortcut for command palette
  useCommandPalette(() => setCommandPaletteOpen(true));

  // Navigation handler
  const handleNavigate = useCallback((section: string) => {
    // Mapear string a SidebarSection
    const sectionMap: Record<string, SidebarSection> = {
      'inicio': 'inicio',
      'home': 'inicio',
      'envios': 'envios',
      'tracking': 'tracking',
      'clientes': 'clientes',
      'reportes': 'reportes',
      'ia-assistant': 'ia-assistant',
      'configuracion': 'configuracion',
      'upload': 'envios',
    };

    const mappedSection = sectionMap[section] || 'inicio';
    setActiveSection(mappedSection);
  }, []);

  // Renderizar contenido según sección activa
  const renderContent = () => {
    if (activeSection === 'inicio') {
      return (
        <StripeDashboard
          shipments={shipments}
          onNavigate={handleNavigate}
        />
      );
    }

    // Para otras secciones, renderizar children
    return children;
  };

  return (
    <div className="h-screen flex bg-[#0a0a0f] overflow-hidden">
      {/* Sidebar */}
      <SidebarPro
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        pendingCount={pendingShipments}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <HeaderPro
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
          onNewGuide={onNewGuide}
          onLogout={onLogout}
          userName={userName}
          userEmail={userEmail}
          notifications={notifications}
        />

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          {renderContent()}
        </main>
      </div>

      {/* Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onNewGuide={onNewGuide}
        onUploadExcel={onUploadExcel}
        onGenerateReport={onGenerateReport}
        onNavigate={handleNavigate}
        recentGuides={recentGuides}
      />
    </div>
  );
}

export default AppLayoutPro;
