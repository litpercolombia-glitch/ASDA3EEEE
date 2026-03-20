// ============================================
// ADS IMPORTER
// Import Facebook/TikTok Ads CSV + atribucion por producto
// ============================================

import React, { useRef, useMemo, useState } from 'react';
import {
  Upload,
  DollarSign,
  Target,
  TrendingUp,
  Trash2,
  Link2,
  FileSpreadsheet,
  BarChart3,
} from 'lucide-react';
import { useAdsStore } from '../../../services/adsImportService';
import { useDropshippingStore, formatCOP } from '../../../services/dropshippingService';

export const AdsImporter: React.FC = () => {
  const fileRef = useRef<HTMLInputElement>(null);
  const { campaigns, importCSV, deleteCampaign, clearMonth, setProductAttribution, syncAdsToDropshipping } = useAdsStore();
  const { selectedMonth, pedidos } = useDropshippingStore();
  const stats = useAdsStore((s) => s.getMonthlyStats(selectedMonth));
  const [synced, setSynced] = useState(false);

  const monthCampaigns = useMemo(
    () => campaigns.filter((c) => c.mes === selectedMonth),
    [campaigns, selectedMonth]
  );

  const productNames = useMemo(() => {
    const names = new Set(pedidos.filter((p) => p.mes === selectedMonth).map((p) => p.productoNombre));
    return Array.from(names);
  }, [pedidos, selectedMonth]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const XLSX = await import('xlsx');
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      if (jsonData.length < 2) {
        alert('Archivo vacio o sin datos.');
        return;
      }

      const headers = (jsonData[0] as string[]).map((h) => String(h || ''));
      const rows = jsonData.slice(1);
      const count = importCSV(rows as any[], headers);
      alert(`Se importaron ${count} registros de ads.`);
    } catch {
      alert('Error al importar. Verifica el formato del archivo.');
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSync = () => {
    syncAdsToDropshipping(selectedMonth);
    setSynced(true);
    setTimeout(() => setSynced(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={DollarSign} label="Gasto Total" value={formatCOP(stats.totalSpend)} color="red" />
        <StatCard icon={Target} label="Conversiones" value={String(stats.totalConversions)} color="blue" />
        <StatCard icon={TrendingUp} label="ROAS" value={`${stats.avgROAS.toFixed(1)}x`} color={stats.avgROAS >= 3 ? 'emerald' : 'amber'} />
        <StatCard icon={BarChart3} label="CPA Promedio" value={formatCOP(stats.avgCPA)} color="purple" />
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-all shadow-lg shadow-blue-500/30"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Importar CSV de Ads
        </button>
        <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleFileUpload} className="hidden" />

        {monthCampaigns.length > 0 && (
          <>
            <button
              onClick={handleSync}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                synced
                  ? 'bg-emerald-500 text-white'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
              }`}
            >
              <Link2 className="w-4 h-4" />
              {synced ? 'Sincronizado!' : 'Sincronizar con Pedidos'}
            </button>
            <button
              onClick={() => { if (confirm('Borrar todos los ads de este mes?')) clearMonth(selectedMonth); }}
              className="flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl font-medium transition-all dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:text-red-400"
            >
              <Trash2 className="w-4 h-4" />
              Limpiar Mes
            </button>
          </>
        )}
      </div>

      {/* Info box */}
      <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-sm text-blue-700 dark:text-blue-400">
        <strong>Como funciona:</strong> Exporta tu reporte de Facebook Ads Manager o TikTok Ads como CSV/Excel.
        Sube el archivo aqui. Detectamos las columnas automaticamente (gasto, impresiones, clics, conversiones).
        Luego asigna cada campana a un producto y dale "Sincronizar" para distribuir el gasto en tus pedidos.
      </div>

      {/* Campaigns table */}
      {monthCampaigns.length > 0 ? (
        <div className="bg-white dark:bg-navy-800 rounded-2xl border border-slate-200 dark:border-navy-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-900">
                  <th className="text-left p-3 text-slate-500 font-medium">Campana</th>
                  <th className="text-center p-3 text-slate-500 font-medium">Plataforma</th>
                  <th className="text-right p-3 text-slate-500 font-medium">Gasto</th>
                  <th className="text-center p-3 text-slate-500 font-medium">Clics</th>
                  <th className="text-center p-3 text-slate-500 font-medium">Conv.</th>
                  <th className="text-center p-3 text-slate-500 font-medium">CPA</th>
                  <th className="text-center p-3 text-slate-500 font-medium">ROAS</th>
                  <th className="text-center p-3 text-slate-500 font-medium">Producto</th>
                  <th className="text-center p-3 text-slate-500 font-medium w-10"></th>
                </tr>
              </thead>
              <tbody>
                {monthCampaigns.map((c) => (
                  <tr key={c.id} className="border-b border-slate-100 dark:border-navy-700/50 hover:bg-slate-50 dark:hover:bg-navy-700/30">
                    <td className="p-3">
                      <p className="font-medium text-slate-800 dark:text-white text-xs">{c.campaignName}</p>
                      {c.adSetName && <p className="text-xs text-slate-400">{c.adSetName}</p>}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        c.platform === 'facebook' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                        c.platform === 'tiktok' ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' :
                        c.platform === 'google' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {c.platform}
                      </span>
                    </td>
                    <td className="p-3 text-right font-medium text-slate-800 dark:text-white">{formatCOP(c.spend)}</td>
                    <td className="p-3 text-center text-slate-600 dark:text-slate-300">{c.clicks.toLocaleString()}</td>
                    <td className="p-3 text-center font-medium text-emerald-600">{c.conversions}</td>
                    <td className="p-3 text-center text-slate-600 dark:text-slate-300">{formatCOP(c.cpa)}</td>
                    <td className="p-3 text-center">
                      <span className={`font-bold ${c.roas >= 3 ? 'text-emerald-500' : c.roas >= 2 ? 'text-amber-500' : 'text-red-500'}`}>
                        {c.roas.toFixed(1)}x
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <select
                        value={c.productoAsociado || ''}
                        onChange={(e) => setProductAttribution(c.id, e.target.value)}
                        className="text-xs bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-lg px-2 py-1 max-w-[140px]"
                      >
                        <option value="">Sin atribuir</option>
                        {productNames.map((name) => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => deleteCampaign(c.id)}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-white dark:bg-navy-800 rounded-2xl border border-slate-200 dark:border-navy-700">
          <Upload className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400 mb-2">Sin datos de ads para este mes</p>
          <p className="text-xs text-slate-400">Importa un CSV de Facebook Ads Manager o TikTok Ads</p>
        </div>
      )}

      {/* Platform breakdown */}
      {Object.keys(stats.byPlatform).length > 0 && (
        <div className="bg-white dark:bg-navy-800 rounded-2xl border border-slate-200 dark:border-navy-700 p-6">
          <h3 className="text-sm font-bold text-slate-500 mb-4 uppercase tracking-wider">Gasto por Plataforma</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(stats.byPlatform).map(([platform, data]) => (
              <div key={platform} className="text-center p-3 bg-slate-50 dark:bg-navy-900 rounded-xl">
                <p className="text-xs text-slate-400 capitalize mb-1">{platform}</p>
                <p className="text-lg font-bold text-slate-800 dark:text-white">{formatCOP(data.spend)}</p>
                <p className="text-xs text-slate-400">{data.conversions} conv.</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// SUB-COMPONENTS
// ============================================

const StatCard: React.FC<{
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
}> = ({ icon: Icon, label, value, color }) => (
  <div className={`bg-${color}-50 dark:bg-${color}-900/10 border border-${color}-200 dark:border-${color}-800 rounded-xl p-4`}>
    <Icon className={`w-5 h-5 text-${color}-500 mb-2`} />
    <p className="text-xl font-black text-slate-800 dark:text-white">{value}</p>
    <p className="text-xs text-slate-500">{label}</p>
  </div>
);

export default AdsImporter;
