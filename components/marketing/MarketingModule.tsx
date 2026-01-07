// components/marketing/MarketingModule.tsx
// Módulo completo de Marketing Tracking

import React, { useState } from 'react';
import {
  LayoutDashboard,
  Facebook,
  Chrome,
  Music2,
  Link2,
  Webhook,
  Zap,
  Receipt,
  DollarSign,
  FileText,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
} from 'lucide-react';
import { MarketingDashboard } from './dashboard/MarketingDashboard';
import { PlatformConnectorList, PlatformConnector } from './shared/PlatformConnector';
import { useMarketingStore } from '../../stores/marketingStore';

// ============================================
// TIPOS
// ============================================

type TabId =
  | 'resumen'
  | 'meta'
  | 'google'
  | 'tiktok'
  | 'utm'
  | 'integraciones'
  | 'reglas'
  | 'tasas'
  | 'gastos'
  | 'informes'
  | 'notificaciones';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ElementType;
  badge?: number;
  isNew?: boolean;
}

// ============================================
// CONFIGURACIÓN DE TABS
// ============================================

const TABS: Tab[] = [
  { id: 'resumen', label: 'Resumen', icon: LayoutDashboard },
  { id: 'meta', label: 'Meta', icon: Facebook },
  { id: 'google', label: 'Google', icon: Chrome },
  { id: 'tiktok', label: 'TikTok', icon: Music2 },
  { id: 'utm', label: 'UTMs', icon: Link2 },
  { id: 'integraciones', label: 'Integraciones', icon: Webhook },
  { id: 'reglas', label: 'Reglas', icon: Zap },
  { id: 'tasas', label: 'Tasas', icon: Receipt },
  { id: 'gastos', label: 'Gastos', icon: DollarSign },
  { id: 'informes', label: 'Informes', icon: FileText },
  { id: 'notificaciones', label: 'Notificaciones', icon: Bell },
];

// ============================================
// COMPONENTES PLACEHOLDER
// ============================================

function PlaceholderTab({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="p-4 bg-gray-700/50 rounded-full mb-4">
        <Settings className="w-12 h-12 text-gray-500" />
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400 max-w-md">{description}</p>
      <button className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
        Próximamente
      </button>
    </div>
  );
}

function MetaTab() {
  const { connections } = useMarketingStore();
  const isConnected = connections.meta.isConnected;

  if (!isConnected) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <h3 className="text-xl font-semibold text-white mb-2">Conecta tu cuenta de Meta Ads</h3>
          <p className="text-gray-400 mb-6">
            Conecta tu cuenta para ver campañas, conjuntos y anuncios de Facebook e Instagram
          </p>
        </div>
        <PlatformConnector platform="meta" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PlatformConnector platform="meta" compact />

      {/* Tabs de Meta */}
      <div className="flex gap-2 border-b border-gray-700">
        {['Cuentas', 'Campañas', 'Conjuntos', 'Anuncios'].map((tab) => (
          <button
            key={tab}
            className="px-4 py-2 text-gray-400 hover:text-white border-b-2 border-transparent hover:border-blue-500 transition-colors"
          >
            {tab}
          </button>
        ))}
      </div>

      <PlaceholderTab
        title="Campañas de Meta Ads"
        description="Aquí verás todas tus campañas de Facebook e Instagram con métricas en tiempo real"
      />
    </div>
  );
}

function GoogleTab() {
  const { connections } = useMarketingStore();
  const isConnected = connections.google.isConnected;

  if (!isConnected) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <h3 className="text-xl font-semibold text-white mb-2">Conecta tu cuenta de Google Ads</h3>
          <p className="text-gray-400 mb-6">
            Conecta tu cuenta para ver campañas de Search, Display, YouTube y Shopping
          </p>
        </div>
        <PlatformConnector platform="google" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PlatformConnector platform="google" compact />

      {/* Tabs de Google */}
      <div className="flex gap-2 border-b border-gray-700">
        {['Cuentas', 'Campañas', 'Grupos', 'Anuncios'].map((tab) => (
          <button
            key={tab}
            className="px-4 py-2 text-gray-400 hover:text-white border-b-2 border-transparent hover:border-red-500 transition-colors"
          >
            {tab}
          </button>
        ))}
      </div>

      <PlaceholderTab
        title="Campañas de Google Ads"
        description="Aquí verás todas tus campañas de Google con métricas en tiempo real"
      />
    </div>
  );
}

function TikTokTab() {
  const { connections } = useMarketingStore();
  const isConnected = connections.tiktok.isConnected;

  if (!isConnected) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <h3 className="text-xl font-semibold text-white mb-2">Conecta tu cuenta de TikTok Ads</h3>
          <p className="text-gray-400 mb-6">
            Conecta tu cuenta para ver tus campañas de TikTok For Business
          </p>
        </div>
        <PlatformConnector platform="tiktok" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PlatformConnector platform="tiktok" compact />

      {/* Tabs de TikTok */}
      <div className="flex gap-2 border-b border-gray-700">
        {['Cuentas', 'Campañas', 'Grupos', 'Anuncios'].map((tab) => (
          <button
            key={tab}
            className="px-4 py-2 text-gray-400 hover:text-white border-b-2 border-transparent hover:border-pink-500 transition-colors"
          >
            {tab}
          </button>
        ))}
      </div>

      <PlaceholderTab
        title="Campañas de TikTok Ads"
        description="Aquí verás todas tus campañas de TikTok con métricas en tiempo real"
      />
    </div>
  );
}

function IntegrationsTab() {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-white">Conexiones de Plataformas</h3>
      <PlatformConnectorList />

      <div className="border-t border-gray-700 pt-6 mt-6">
        <h3 className="text-xl font-semibold text-white mb-4">Webhooks</h3>
        <PlaceholderTab
          title="Configurar Webhooks"
          description="Conecta Hotmart, Kiwify, Shopify y más para recibir ventas automáticamente"
        />
      </div>
    </div>
  );
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export function MarketingModule() {
  const [activeTab, setActiveTab] = useState<TabId>('resumen');
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'resumen':
        return <MarketingDashboard />;
      case 'meta':
        return <MetaTab />;
      case 'google':
        return <GoogleTab />;
      case 'tiktok':
        return <TikTokTab />;
      case 'integraciones':
        return <IntegrationsTab />;
      case 'utm':
        return (
          <PlaceholderTab
            title="Sistema de UTMs"
            description="Rastrea el origen de tus ventas con parámetros UTM personalizados"
          />
        );
      case 'reglas':
        return (
          <PlaceholderTab
            title="Reglas de Automatización"
            description="Crea reglas para pausar, activar o ajustar campañas automáticamente"
          />
        );
      case 'tasas':
        return (
          <PlaceholderTab
            title="Tasas y Honorarios"
            description="Configura impuestos, tasas de pasarelas y costos de productos"
          />
        );
      case 'gastos':
        return (
          <PlaceholderTab
            title="Gestión de Gastos"
            description="Registra gastos adicionales para calcular tu ganancia real"
          />
        );
      case 'informes':
        return (
          <PlaceholderTab
            title="Informes y Reportes"
            description="Genera reportes personalizados y programa envíos automáticos"
          />
        );
      case 'notificaciones':
        return (
          <PlaceholderTab
            title="Configuración de Notificaciones"
            description="Configura alertas por WhatsApp, email y push notifications"
          />
        );
      default:
        return <MarketingDashboard />;
    }
  };

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div
        className={`flex-shrink-0 border-r border-gray-700 bg-gray-900/50 transition-all ${
          isSidebarCollapsed ? 'w-16' : 'w-56'
        }`}
      >
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          {!isSidebarCollapsed && (
            <h2 className="text-lg font-bold text-white">Marketing</h2>
          )}
          <button
            onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
            className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
          >
            {isSidebarCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </button>
        </div>

        <nav className="p-2 space-y-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
                title={isSidebarCollapsed ? tab.label : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!isSidebarCollapsed && (
                  <>
                    <span className="flex-1 text-left text-sm">{tab.label}</span>
                    {tab.badge && (
                      <span className="px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">
                        {tab.badge}
                      </span>
                    )}
                    {tab.isNew && (
                      <span className="px-2 py-0.5 text-xs bg-green-500 text-white rounded-full">
                        Nuevo
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </nav>

        {/* Help */}
        {!isSidebarCollapsed && (
          <div className="absolute bottom-4 left-4 right-4">
            <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white transition-colors">
              <HelpCircle className="w-4 h-4" />
              Ayuda y tutoriales
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">{renderContent()}</div>
    </div>
  );
}

export default MarketingModule;
