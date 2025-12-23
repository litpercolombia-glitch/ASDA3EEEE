// ============================================
// LITPER COMMAND CENTER - TABS SERVICE
// Sistema de pestañas guardables con persistencia
// ============================================

// ============================================
// TIPOS
// ============================================

export interface TabConfig {
  id: string;
  name: string;
  icon: string;
  type: 'dashboard' | 'chat' | 'report' | 'custom';
  position: number;
  isPinned: boolean;
  isCloseable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardWidget {
  id: string;
  type: 'stat_card' | 'chart' | 'table' | 'list' | 'map' | 'timeline' | 'progress' | 'custom';
  title: string;
  gridPosition: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  config: WidgetConfig;
  refreshInterval?: number; // segundos
}

export interface WidgetConfig {
  dataSource: 'guias' | 'ciudades' | 'finanzas' | 'alertas' | 'custom';
  query?: Record<string, unknown>;
  chartType?: 'bar' | 'line' | 'pie' | 'doughnut' | 'area';
  filters?: Record<string, unknown>;
  colors?: string[];
  showLegend?: boolean;
  customComponent?: string;
}

export interface DashboardTab extends TabConfig {
  type: 'dashboard';
  widgets: DashboardWidget[];
  layout: 'grid' | 'freeform';
  gridColumns: number;
  theme: 'dark' | 'light' | 'auto';
}

export interface ChatTab extends TabConfig {
  type: 'chat';
  conversationId: string;
  lastMessage?: string;
  unreadCount: number;
}

export interface ReportTab extends TabConfig {
  type: 'report';
  reportType: 'daily' | 'weekly' | 'monthly' | 'custom';
  dateRange?: {
    start: string;
    end: string;
  };
  exportFormat?: 'pdf' | 'excel' | 'csv';
}

export type Tab = DashboardTab | ChatTab | ReportTab | TabConfig;

export interface TabState {
  tabs: Tab[];
  activeTabId: string;
  lastSyncedAt: string;
}

// ============================================
// STORAGE KEYS
// ============================================

const STORAGE_KEYS = {
  TABS: 'litper_command_center_tabs',
  ACTIVE_TAB: 'litper_command_center_active_tab',
  WIDGETS: 'litper_command_center_widgets',
};

// ============================================
// DEFAULT TABS
// ============================================

const DEFAULT_TABS: Tab[] = [
  {
    id: 'main-chat',
    name: 'Chat IA',
    icon: '💬',
    type: 'chat',
    position: 0,
    isPinned: true,
    isCloseable: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    conversationId: 'main',
    unreadCount: 0,
  } as ChatTab,
  {
    id: 'main-dashboard',
    name: 'Dashboard',
    icon: '📊',
    type: 'dashboard',
    position: 1,
    isPinned: true,
    isCloseable: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    widgets: getDefaultWidgets(),
    layout: 'grid',
    gridColumns: 4,
    theme: 'dark',
  } as DashboardTab,
];

function getDefaultWidgets(): DashboardWidget[] {
  return [
    {
      id: 'widget-guias-hoy',
      type: 'stat_card',
      title: 'Guías Hoy',
      gridPosition: { x: 0, y: 0, width: 1, height: 1 },
      config: {
        dataSource: 'guias',
        query: { filter: 'today' },
      },
    },
    {
      id: 'widget-tasa-entrega',
      type: 'progress',
      title: 'Tasa de Entrega',
      gridPosition: { x: 1, y: 0, width: 1, height: 1 },
      config: {
        dataSource: 'guias',
        query: { metric: 'delivery_rate' },
      },
    },
    {
      id: 'widget-ventas',
      type: 'stat_card',
      title: 'Ventas Hoy',
      gridPosition: { x: 2, y: 0, width: 1, height: 1 },
      config: {
        dataSource: 'guias',
        query: { metric: 'sales_today' },
      },
    },
    {
      id: 'widget-alertas',
      type: 'stat_card',
      title: 'Alertas',
      gridPosition: { x: 3, y: 0, width: 1, height: 1 },
      config: {
        dataSource: 'alertas',
        query: { filter: 'unread' },
      },
    },
    {
      id: 'widget-ciudades-chart',
      type: 'chart',
      title: 'Semáforo de Ciudades',
      gridPosition: { x: 0, y: 1, width: 2, height: 2 },
      config: {
        dataSource: 'ciudades',
        chartType: 'pie',
        colors: ['#10b981', '#fbbf24', '#f97316', '#ef4444'],
        showLegend: true,
      },
      refreshInterval: 60,
    },
    {
      id: 'widget-guias-estado',
      type: 'chart',
      title: 'Guías por Estado',
      gridPosition: { x: 2, y: 1, width: 2, height: 2 },
      config: {
        dataSource: 'guias',
        chartType: 'bar',
        query: { groupBy: 'estado' },
      },
      refreshInterval: 30,
    },
    {
      id: 'widget-transportadoras',
      type: 'table',
      title: 'Top Transportadoras',
      gridPosition: { x: 0, y: 3, width: 2, height: 2 },
      config: {
        dataSource: 'guias',
        query: { groupBy: 'transportadora', limit: 5 },
      },
    },
    {
      id: 'widget-alertas-lista',
      type: 'list',
      title: 'Alertas Recientes',
      gridPosition: { x: 2, y: 3, width: 2, height: 2 },
      config: {
        dataSource: 'alertas',
        query: { limit: 5 },
      },
      refreshInterval: 30,
    },
  ];
}

// ============================================
// SERVICIO DE TABS
// ============================================

export const tabsService = {
  /**
   * Obtener todas las tabs guardadas
   */
  getTabs(): Tab[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.TABS);
      if (stored) {
        return JSON.parse(stored);
      }
      return DEFAULT_TABS;
    } catch (error) {
      console.error('Error loading tabs:', error);
      return DEFAULT_TABS;
    }
  },

  /**
   * Guardar tabs
   */
  saveTabs(tabs: Tab[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.TABS, JSON.stringify(tabs));
    } catch (error) {
      console.error('Error saving tabs:', error);
    }
  },

  /**
   * Obtener tab activa
   */
  getActiveTabId(): string {
    try {
      return localStorage.getItem(STORAGE_KEYS.ACTIVE_TAB) || 'main-chat';
    } catch {
      return 'main-chat';
    }
  },

  /**
   * Establecer tab activa
   */
  setActiveTab(tabId: string): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_TAB, tabId);
    } catch (error) {
      console.error('Error setting active tab:', error);
    }
  },

  /**
   * Crear nueva tab
   */
  createTab(config: Partial<Tab>): Tab {
    const tabs = this.getTabs();
    const maxPosition = Math.max(...tabs.map(t => t.position), -1);

    const newTab: Tab = {
      id: `tab-${Date.now()}`,
      name: config.name || 'Nueva Tab',
      icon: config.icon || '📁',
      type: config.type || 'custom',
      position: maxPosition + 1,
      isPinned: false,
      isCloseable: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...config,
    };

    tabs.push(newTab);
    this.saveTabs(tabs);
    return newTab;
  },

  /**
   * Crear tab de dashboard personalizado
   */
  createDashboard(name: string, widgets: DashboardWidget[] = []): DashboardTab {
    const dashboard: DashboardTab = {
      id: `dashboard-${Date.now()}`,
      name,
      icon: '📊',
      type: 'dashboard',
      position: this.getTabs().length,
      isPinned: false,
      isCloseable: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      widgets: widgets.length > 0 ? widgets : getDefaultWidgets(),
      layout: 'grid',
      gridColumns: 4,
      theme: 'dark',
    };

    const tabs = this.getTabs();
    tabs.push(dashboard);
    this.saveTabs(tabs);
    return dashboard;
  },

  /**
   * Crear tab de reporte
   */
  createReport(name: string, reportType: ReportTab['reportType'], dateRange?: { start: string; end: string }): ReportTab {
    const report: ReportTab = {
      id: `report-${Date.now()}`,
      name,
      icon: '📄',
      type: 'report',
      position: this.getTabs().length,
      isPinned: false,
      isCloseable: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      reportType,
      dateRange,
    };

    const tabs = this.getTabs();
    tabs.push(report);
    this.saveTabs(tabs);
    return report;
  },

  /**
   * Actualizar tab
   */
  updateTab(tabId: string, updates: Partial<Tab>): Tab | null {
    const tabs = this.getTabs();
    const index = tabs.findIndex(t => t.id === tabId);

    if (index === -1) return null;

    tabs[index] = {
      ...tabs[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.saveTabs(tabs);
    return tabs[index];
  },

  /**
   * Eliminar tab
   */
  deleteTab(tabId: string): boolean {
    const tabs = this.getTabs();
    const tab = tabs.find(t => t.id === tabId);

    if (!tab || !tab.isCloseable) return false;

    const filtered = tabs.filter(t => t.id !== tabId);
    this.saveTabs(filtered);

    // Si era la tab activa, activar la primera
    if (this.getActiveTabId() === tabId) {
      this.setActiveTab(filtered[0]?.id || 'main-chat');
    }

    return true;
  },

  /**
   * Mover tab a nueva posición
   */
  moveTab(tabId: string, newPosition: number): void {
    const tabs = this.getTabs();
    const tab = tabs.find(t => t.id === tabId);

    if (!tab) return;

    const oldPosition = tab.position;
    tabs.forEach(t => {
      if (t.id === tabId) {
        t.position = newPosition;
      } else if (oldPosition < newPosition) {
        if (t.position > oldPosition && t.position <= newPosition) {
          t.position--;
        }
      } else {
        if (t.position >= newPosition && t.position < oldPosition) {
          t.position++;
        }
      }
    });

    this.saveTabs(tabs);
  },

  /**
   * Fijar/Desfijar tab
   */
  togglePin(tabId: string): Tab | null {
    const tabs = this.getTabs();
    const tab = tabs.find(t => t.id === tabId);

    if (!tab) return null;

    tab.isPinned = !tab.isPinned;
    tab.updatedAt = new Date().toISOString();
    this.saveTabs(tabs);
    return tab;
  },

  /**
   * Renombrar tab
   */
  renameTab(tabId: string, newName: string): Tab | null {
    return this.updateTab(tabId, { name: newName });
  },

  /**
   * Cambiar icono de tab
   */
  setTabIcon(tabId: string, icon: string): Tab | null {
    return this.updateTab(tabId, { icon });
  },

  /**
   * Actualizar widgets de un dashboard
   */
  updateDashboardWidgets(tabId: string, widgets: DashboardWidget[]): DashboardTab | null {
    const tabs = this.getTabs();
    const tab = tabs.find(t => t.id === tabId) as DashboardTab | undefined;

    if (!tab || tab.type !== 'dashboard') return null;

    tab.widgets = widgets;
    tab.updatedAt = new Date().toISOString();
    this.saveTabs(tabs);
    return tab;
  },

  /**
   * Añadir widget a dashboard
   */
  addWidgetToDashboard(tabId: string, widget: DashboardWidget): DashboardTab | null {
    const tabs = this.getTabs();
    const tab = tabs.find(t => t.id === tabId) as DashboardTab | undefined;

    if (!tab || tab.type !== 'dashboard') return null;

    tab.widgets.push(widget);
    tab.updatedAt = new Date().toISOString();
    this.saveTabs(tabs);
    return tab;
  },

  /**
   * Eliminar widget de dashboard
   */
  removeWidgetFromDashboard(tabId: string, widgetId: string): DashboardTab | null {
    const tabs = this.getTabs();
    const tab = tabs.find(t => t.id === tabId) as DashboardTab | undefined;

    if (!tab || tab.type !== 'dashboard') return null;

    tab.widgets = tab.widgets.filter(w => w.id !== widgetId);
    tab.updatedAt = new Date().toISOString();
    this.saveTabs(tabs);
    return tab;
  },

  /**
   * Duplicar tab
   */
  duplicateTab(tabId: string): Tab | null {
    const tabs = this.getTabs();
    const original = tabs.find(t => t.id === tabId);

    if (!original) return null;

    const duplicate: Tab = {
      ...JSON.parse(JSON.stringify(original)),
      id: `${original.type}-${Date.now()}`,
      name: `${original.name} (copia)`,
      position: tabs.length,
      isPinned: false,
      isCloseable: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    tabs.push(duplicate);
    this.saveTabs(tabs);
    return duplicate;
  },

  /**
   * Exportar configuración de tabs
   */
  exportConfig(): string {
    const state: TabState = {
      tabs: this.getTabs(),
      activeTabId: this.getActiveTabId(),
      lastSyncedAt: new Date().toISOString(),
    };
    return JSON.stringify(state, null, 2);
  },

  /**
   * Importar configuración de tabs
   */
  importConfig(configJson: string): boolean {
    try {
      const state: TabState = JSON.parse(configJson);
      if (!state.tabs || !Array.isArray(state.tabs)) {
        throw new Error('Configuración inválida');
      }

      this.saveTabs(state.tabs);
      if (state.activeTabId) {
        this.setActiveTab(state.activeTabId);
      }
      return true;
    } catch (error) {
      console.error('Error importing tabs config:', error);
      return false;
    }
  },

  /**
   * Restaurar a configuración por defecto
   */
  resetToDefaults(): void {
    this.saveTabs(DEFAULT_TABS);
    this.setActiveTab('main-chat');
  },

  /**
   * Obtener tabs ordenadas por posición
   */
  getSortedTabs(): Tab[] {
    return this.getTabs().sort((a, b) => {
      // Primero las fijadas
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      // Luego por posición
      return a.position - b.position;
    });
  },
};

// ============================================
// WIDGET TEMPLATES
// ============================================

export const WIDGET_TEMPLATES: DashboardWidget[] = [
  {
    id: 'template-stat-card',
    type: 'stat_card',
    title: 'Métrica',
    gridPosition: { x: 0, y: 0, width: 1, height: 1 },
    config: { dataSource: 'guias' },
  },
  {
    id: 'template-chart-bar',
    type: 'chart',
    title: 'Gráfico de Barras',
    gridPosition: { x: 0, y: 0, width: 2, height: 2 },
    config: { dataSource: 'guias', chartType: 'bar' },
  },
  {
    id: 'template-chart-pie',
    type: 'chart',
    title: 'Gráfico Circular',
    gridPosition: { x: 0, y: 0, width: 2, height: 2 },
    config: { dataSource: 'ciudades', chartType: 'pie' },
  },
  {
    id: 'template-chart-line',
    type: 'chart',
    title: 'Gráfico de Líneas',
    gridPosition: { x: 0, y: 0, width: 2, height: 2 },
    config: { dataSource: 'finanzas', chartType: 'line' },
  },
  {
    id: 'template-table',
    type: 'table',
    title: 'Tabla de Datos',
    gridPosition: { x: 0, y: 0, width: 2, height: 2 },
    config: { dataSource: 'guias' },
  },
  {
    id: 'template-list',
    type: 'list',
    title: 'Lista',
    gridPosition: { x: 0, y: 0, width: 1, height: 2 },
    config: { dataSource: 'alertas' },
  },
  {
    id: 'template-progress',
    type: 'progress',
    title: 'Indicador de Progreso',
    gridPosition: { x: 0, y: 0, width: 1, height: 1 },
    config: { dataSource: 'guias' },
  },
];

export default tabsService;
