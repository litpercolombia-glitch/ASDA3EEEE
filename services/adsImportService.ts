// services/adsImportService.ts
// Importador de gastos de Facebook/TikTok Ads
// CSV import + atribucion de gasto por producto/campaña

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useDropshippingStore } from './dropshippingService';

// ============================================
// TYPES
// ============================================

export type AdPlatform = 'facebook' | 'instagram' | 'tiktok' | 'google' | 'otro';

export interface AdCampaign {
  id: string;
  platform: AdPlatform;
  campaignName: string;
  adSetName?: string;
  adName?: string;

  // Metrics
  spend: number;           // Gasto total
  impressions: number;
  clicks: number;
  conversions: number;     // Compras/leads
  revenue: number;         // Ingreso atribuido por la plataforma

  // Calculated
  cpc: number;             // Cost per Click
  ctr: number;             // Click Through Rate
  cpa: number;             // Cost per Acquisition
  roas: number;            // Return on Ad Spend

  // Product attribution
  productoAsociado?: string;  // Producto al que se atribuye este gasto

  // Period
  fecha: string;           // YYYY-MM-DD
  mes: string;             // YYYY-MM

  createdAt: string;
}

export interface AdsMonthlyStats {
  mes: string;
  totalSpend: number;
  totalConversions: number;
  totalRevenue: number;
  avgCPA: number;
  avgROAS: number;
  byPlatform: Record<AdPlatform, { spend: number; conversions: number; roas: number }>;
  byProduct: Record<string, { spend: number; conversions: number; cpa: number; roas: number }>;
}

// ============================================
// CSV COLUMN MAPPINGS
// ============================================

// Facebook/Meta Ads Manager CSV columns
const META_COLUMN_MAP: Record<string, string> = {
  // English
  'campaign name': 'campaignName',
  'ad set name': 'adSetName',
  'ad name': 'adName',
  'amount spent': 'spend',
  'amount spent (cop)': 'spend',
  'impressions': 'impressions',
  'link clicks': 'clicks',
  'clicks (all)': 'clicks',
  'results': 'conversions',
  'purchases': 'conversions',
  'purchase roas': 'roas',
  'cost per result': 'cpa',
  'cost per purchase': 'cpa',
  'ctr (link click-through rate)': 'ctr',
  'cpc (cost per link click)': 'cpc',
  'website purchase roas': 'roas',
  'purchase conversion value': 'revenue',
  'reporting starts': 'fecha',
  'reporting ends': 'fecha',
  'day': 'fecha',

  // Spanish (Meta en español)
  'nombre de la campaña': 'campaignName',
  'nombre del conjunto de anuncios': 'adSetName',
  'nombre del anuncio': 'adName',
  'importe gastado': 'spend',
  'importe gastado (cop)': 'spend',
  'impresiones': 'impressions',
  'clics en el enlace': 'clicks',
  'clics (todos)': 'clicks',
  'resultados': 'conversions',
  'compras': 'conversions',
  'costo por resultado': 'cpa',
  'costo por compra': 'cpa',
  'valor de conversión de compras': 'revenue',
  'inicio de los informes': 'fecha',
  'día': 'fecha',
};

// TikTok Ads CSV columns
const TIKTOK_COLUMN_MAP: Record<string, string> = {
  'campaign': 'campaignName',
  'campaign name': 'campaignName',
  'ad group': 'adSetName',
  'ad group name': 'adSetName',
  'ad': 'adName',
  'ad name': 'adName',
  'cost': 'spend',
  'total cost': 'spend',
  'impression': 'impressions',
  'impressions': 'impressions',
  'click': 'clicks',
  'clicks': 'clicks',
  'conversion': 'conversions',
  'conversions': 'conversions',
  'complete payment': 'conversions',
  'total complete payment value': 'revenue',
  'cost per conversion': 'cpa',
  'cost per complete payment': 'cpa',
  'ctr': 'ctr',
  'cpc': 'cpc',
  'date': 'fecha',
};

function detectPlatform(headers: string[]): AdPlatform {
  const joined = headers.join(' ').toLowerCase();
  if (joined.includes('nombre de la campaña') || joined.includes('campaign name') && joined.includes('amount spent')) return 'facebook';
  if (joined.includes('ad group') && joined.includes('complete payment')) return 'tiktok';
  if (joined.includes('campaign') && joined.includes('cost per click')) return 'google';
  return 'facebook'; // Default
}

function getColumnMap(platform: AdPlatform): Record<string, string> {
  switch (platform) {
    case 'tiktok': return TIKTOK_COLUMN_MAP;
    default: return META_COLUMN_MAP;
  }
}

// ============================================
// STORE
// ============================================

interface AdsState {
  campaigns: AdCampaign[];
  isLoading: boolean;

  // Actions
  importCSV: (rows: any[], headers: string[]) => number;
  importManual: (campaign: Omit<AdCampaign, 'id' | 'createdAt' | 'cpc' | 'ctr' | 'cpa' | 'roas'>) => void;
  deleteCampaign: (id: string) => void;
  clearMonth: (mes: string) => void;
  setProductAttribution: (campaignId: string, productoNombre: string) => void;
  bulkSetProductAttribution: (campaignIds: string[], productoNombre: string) => void;

  // Analytics
  getMonthlyStats: (mes?: string) => AdsMonthlyStats;
  syncAdsToDropshipping: (mes?: string) => void;
}

export const useAdsStore = create<AdsState>()(
  persist(
    (set, get) => ({
      campaigns: [],
      isLoading: false,

      importCSV: (rows, headers) => {
        const platform = detectPlatform(headers);
        const colMap = getColumnMap(platform);

        // Build header mapping
        const headerMapping: Record<number, string> = {};
        headers.forEach((h, i) => {
          const key = h.toLowerCase().trim();
          if (colMap[key]) headerMapping[i] = colMap[key];
        });

        const newCampaigns: AdCampaign[] = [];

        for (const row of rows) {
          try {
            const mapped: Record<string, any> = {};
            if (Array.isArray(row)) {
              row.forEach((val: any, i: number) => {
                if (headerMapping[i]) mapped[headerMapping[i]] = val;
              });
            } else {
              // Object row - match keys
              for (const [key, val] of Object.entries(row)) {
                const normalKey = key.toLowerCase().trim();
                if (colMap[normalKey]) mapped[colMap[normalKey]] = val;
              }
            }

            const spend = parseFloat(String(mapped.spend || 0).replace(/[,$]/g, '')) || 0;
            if (spend <= 0) continue; // Skip zero spend

            const impressions = parseInt(String(mapped.impressions || 0).replace(/,/g, '')) || 0;
            const clicks = parseInt(String(mapped.clicks || 0).replace(/,/g, '')) || 0;
            const conversions = parseInt(String(mapped.conversions || 0).replace(/,/g, '')) || 0;
            const revenue = parseFloat(String(mapped.revenue || 0).replace(/[,$]/g, '')) || 0;

            const fecha = mapped.fecha || new Date().toISOString().slice(0, 10);

            const campaign: AdCampaign = {
              id: `ad_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
              platform,
              campaignName: String(mapped.campaignName || 'Sin nombre'),
              adSetName: mapped.adSetName || undefined,
              adName: mapped.adName || undefined,
              spend,
              impressions,
              clicks,
              conversions,
              revenue,
              cpc: clicks > 0 ? spend / clicks : 0,
              ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
              cpa: conversions > 0 ? spend / conversions : 0,
              roas: spend > 0 ? revenue / spend : 0,
              fecha: String(fecha).slice(0, 10),
              mes: String(fecha).slice(0, 7),
              createdAt: new Date().toISOString(),
            };

            newCampaigns.push(campaign);
          } catch { /* skip bad rows */ }
        }

        if (newCampaigns.length > 0) {
          set((state) => ({ campaigns: [...state.campaigns, ...newCampaigns] }));
        }

        return newCampaigns.length;
      },

      importManual: (data) => {
        const cpc = data.clicks > 0 ? data.spend / data.clicks : 0;
        const ctr = data.impressions > 0 ? (data.clicks / data.impressions) * 100 : 0;
        const cpa = data.conversions > 0 ? data.spend / data.conversions : 0;
        const roas = data.spend > 0 ? data.revenue / data.spend : 0;

        const campaign: AdCampaign = {
          ...data,
          id: `ad_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          cpc, ctr, cpa, roas,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({ campaigns: [...state.campaigns, campaign] }));
      },

      deleteCampaign: (id) => set((state) => ({
        campaigns: state.campaigns.filter((c) => c.id !== id),
      })),

      clearMonth: (mes) => set((state) => ({
        campaigns: state.campaigns.filter((c) => c.mes !== mes),
      })),

      setProductAttribution: (campaignId, productoNombre) => set((state) => ({
        campaigns: state.campaigns.map((c) =>
          c.id === campaignId ? { ...c, productoAsociado: productoNombre } : c
        ),
      })),

      bulkSetProductAttribution: (ids, productoNombre) => set((state) => ({
        campaigns: state.campaigns.map((c) =>
          ids.includes(c.id) ? { ...c, productoAsociado: productoNombre } : c
        ),
      })),

      // ============================
      // ANALYTICS
      // ============================

      getMonthlyStats: (mes) => {
        const targetMes = mes || useDropshippingStore.getState().selectedMonth;
        const campaigns = get().campaigns.filter((c) => c.mes === targetMes);

        const totalSpend = campaigns.reduce((s, c) => s + c.spend, 0);
        const totalConversions = campaigns.reduce((s, c) => s + c.conversions, 0);
        const totalRevenue = campaigns.reduce((s, c) => s + c.revenue, 0);

        // By platform
        const byPlatform: Record<string, { spend: number; conversions: number; roas: number }> = {};
        for (const c of campaigns) {
          if (!byPlatform[c.platform]) byPlatform[c.platform] = { spend: 0, conversions: 0, roas: 0 };
          byPlatform[c.platform].spend += c.spend;
          byPlatform[c.platform].conversions += c.conversions;
        }
        for (const p of Object.values(byPlatform)) {
          p.roas = p.spend > 0 ? totalRevenue / p.spend : 0; // Simplified
        }

        // By product
        const byProduct: Record<string, { spend: number; conversions: number; cpa: number; roas: number }> = {};
        for (const c of campaigns) {
          const prod = c.productoAsociado || 'Sin atribuir';
          if (!byProduct[prod]) byProduct[prod] = { spend: 0, conversions: 0, cpa: 0, roas: 0 };
          byProduct[prod].spend += c.spend;
          byProduct[prod].conversions += c.conversions;
        }
        for (const [, v] of Object.entries(byProduct)) {
          v.cpa = v.conversions > 0 ? v.spend / v.conversions : 0;
          v.roas = v.spend > 0 ? totalRevenue / v.spend : 0; // Simplified
        }

        return {
          mes: targetMes,
          totalSpend,
          totalConversions,
          totalRevenue,
          avgCPA: totalConversions > 0 ? totalSpend / totalConversions : 0,
          avgROAS: totalSpend > 0 ? totalRevenue / totalSpend : 0,
          byPlatform: byPlatform as any,
          byProduct,
        };
      },

      // ============================
      // SYNC ADS COST TO DROPSHIPPING ORDERS
      // ============================

      syncAdsToDropshipping: (mes) => {
        const targetMes = mes || useDropshippingStore.getState().selectedMonth;
        const stats = get().getMonthlyStats(targetMes);
        const dsStore = useDropshippingStore.getState();
        const pedidos = dsStore.pedidos.filter((p) => p.mes === targetMes);

        if (pedidos.length === 0 || stats.totalSpend === 0) return;

        // Strategy: distribute ad spend proportionally
        // If product is attributed, assign to those orders
        // Otherwise, distribute evenly across all orders

        const productSpend = new Map<string, number>();
        let unattributedSpend = 0;

        for (const [prod, data] of Object.entries(stats.byProduct) as [string, { spend: number; conversions: number; cpa: number; roas: number }][]) {
          if (prod === 'Sin atribuir') {
            unattributedSpend += data.spend;
          } else {
            productSpend.set(prod.toUpperCase().trim(), data.spend);
          }
        }

        // Count orders per product for attribution
        const ordersByProduct = new Map<string, string[]>();
        for (const p of pedidos) {
          const key = p.productoNombre.toUpperCase().trim();
          if (!ordersByProduct.has(key)) ordersByProduct.set(key, []);
          ordersByProduct.get(key)!.push(p.id);
        }

        // Distribute attributed spend per product
        for (const [product, spend] of productSpend) {
          const orderIds = ordersByProduct.get(product) || [];
          if (orderIds.length === 0) {
            unattributedSpend += spend; // No matching orders, add to unattributed
            continue;
          }
          const perOrder = spend / orderIds.length;
          for (const id of orderIds) {
            dsStore.updatePedido(id, { costoPublicidad: perOrder });
          }
        }

        // Distribute unattributed spend evenly across all remaining orders
        if (unattributedSpend > 0) {
          const unattributedOrders = pedidos.filter(
            (p) => !productSpend.has(p.productoNombre.toUpperCase().trim())
          );
          if (unattributedOrders.length > 0) {
            const perOrder = unattributedSpend / unattributedOrders.length;
            for (const p of unattributedOrders) {
              dsStore.updatePedido(p.id, { costoPublicidad: perOrder });
            }
          }
        }
      },
    }),
    {
      name: 'litper-ads-store',
      partialize: (state) => ({ campaigns: state.campaigns }),
    }
  )
);
