// components/admin/FinanceCenter/IncomeManager.tsx
// Gestor de Ingresos - Carga de documentos Dropi y entradas manuales

import React, { useState, useCallback } from 'react';
import {
  Upload,
  FileSpreadsheet,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Download,
  Calendar,
  DollarSign,
  Package,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Eye,
} from 'lucide-react';
import {
  useFinanceStore,
  formatCurrency,
  getMonthName,
  type Income,
} from '../../../services/financeService';
import * as XLSX from 'xlsx';

// ============================================
// TIPOS
// ============================================
interface IncomeFormData {
  source: 'dropi' | 'manual' | 'other';
  description: string;
  grossSales: number;
  productCost: number;
  shippingCost: number;
  returnsCost: number;
  commissions: number;
  ordersCount: number;
  deliveredCount: number;
  returnedCount: number;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export const IncomeManager: React.FC = () => {
  const {
    incomes,
    selectedMonth,
    setSelectedMonth,
    addIncome,
    deleteIncome,
    importDropiData,
  } = useFinanceStore();

  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [lastImport, setLastImport] = useState<Income | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Filtrar ingresos del mes seleccionado
  const monthIncomes = incomes.filter((i) => i.month === selectedMonth);

  // Totales del mes
  const totals = monthIncomes.reduce(
    (acc, i) => ({
      grossSales: acc.grossSales + i.grossSales,
      netSales: acc.netSales + i.netSales,
      profit: acc.profit + i.profit,
      orders: acc.orders + i.ordersCount,
      delivered: acc.delivered + i.deliveredCount,
      returned: acc.returned + i.returnedCount,
    }),
    { grossSales: 0, netSales: 0, profit: 0, orders: 0, delivered: 0, returned: 0 }
  );

  // ============================================
  // HANDLERS DE ARCHIVO
  // ============================================

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      processFile(files[0]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setError(null);

    try {
      const extension = file.name.split('.').pop()?.toLowerCase();

      if (!['xlsx', 'xls', 'csv'].includes(extension || '')) {
        throw new Error('Formato no soportado. Use archivos Excel (.xlsx, .xls) o CSV');
      }

      const data = await readExcelFile(file);

      if (!data || data.length === 0) {
        throw new Error('El archivo está vacío o no tiene datos válidos');
      }

      // Verificar que sea un archivo de Dropi
      const headers = Object.keys(data[0]).map((h) => h.toUpperCase());
      const dropiKeywords = ['VALOR FACTURADO', 'GANANCIA', 'ESTADO GUIA', 'TRANSPORTADORA', 'FLETE'];
      const isDropiFile = dropiKeywords.some((kw) =>
        headers.some((h) => h.includes(kw))
      );

      if (!isDropiFile) {
        throw new Error(
          'Este archivo no parece ser de Dropi. Verifique que contenga columnas como: Valor Facturado, Ganancia, Estado Guía'
        );
      }

      // Importar datos
      const income = importDropiData(data, file.name);
      setLastImport(income);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error procesando archivo');
    } finally {
      setIsProcessing(false);
    }
  };

  const readExcelFile = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(sheet);
          resolve(jsonData);
        } catch (err) {
          reject(new Error('Error leyendo archivo Excel'));
        }
      };

      reader.onerror = () => reject(new Error('Error leyendo archivo'));
      reader.readAsBinaryString(file);
    });
  };

  // ============================================
  // FORMULARIO MANUAL
  // ============================================

  const ManualIncomeForm: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [formData, setFormData] = useState<IncomeFormData>({
      source: 'manual',
      description: '',
      grossSales: 0,
      productCost: 0,
      shippingCost: 0,
      returnsCost: 0,
      commissions: 0,
      ordersCount: 0,
      deliveredCount: 0,
      returnedCount: 0,
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const netSales = formData.grossSales - formData.returnsCost;
      const profit =
        netSales -
        formData.productCost -
        formData.shippingCost -
        formData.commissions;

      addIncome({
        ...formData,
        netSales,
        profit,
        date: new Date().toISOString().slice(0, 10),
        month: selectedMonth,
      });
      onClose();
    };

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-navy-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-slate-200 dark:border-navy-700">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
              Agregar Ingreso Manual
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Descripción
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-700 text-slate-800 dark:text-white"
                placeholder="Ej: Ventas semana 1"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Ventas Brutas
                </label>
                <input
                  type="number"
                  value={formData.grossSales || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, grossSales: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-slate-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-700 text-slate-800 dark:text-white"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Costo Productos
                </label>
                <input
                  type="number"
                  value={formData.productCost || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, productCost: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-slate-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-700 text-slate-800 dark:text-white"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Costo Fletes
                </label>
                <input
                  type="number"
                  value={formData.shippingCost || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, shippingCost: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-slate-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-700 text-slate-800 dark:text-white"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Costo Devoluciones
                </label>
                <input
                  type="number"
                  value={formData.returnsCost || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, returnsCost: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-slate-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-700 text-slate-800 dark:text-white"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Total Pedidos
                </label>
                <input
                  type="number"
                  value={formData.ordersCount || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, ordersCount: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-slate-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-700 text-slate-800 dark:text-white"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Entregados
                </label>
                <input
                  type="number"
                  value={formData.deliveredCount || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      deliveredCount: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-700 text-slate-800 dark:text-white"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Devueltos
                </label>
                <input
                  type="number"
                  value={formData.returnedCount || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      returnedCount: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-700 text-slate-800 dark:text-white"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-slate-300 dark:border-navy-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-navy-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                Guardar
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="space-y-6">
      {/* Header con selector de mes */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-green-500" />
            Ingresos - {getMonthName(selectedMonth)} {selectedMonth.split('-')[0]}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Carga tus archivos de Dropi o agrega ingresos manualmente
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 border border-slate-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-700 text-slate-800 dark:text-white"
          />
          <button
            onClick={() => setShowManualForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Agregar Manual
          </button>
        </div>
      </div>

      {/* Zona de carga de archivos */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-2xl p-8 text-center transition-all
          ${
            isDragging
              ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
              : 'border-slate-300 dark:border-navy-600 hover:border-green-400'
          }
          ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isProcessing}
        />

        <div className="flex flex-col items-center gap-4">
          {isProcessing ? (
            <>
              <RefreshCw className="w-12 h-12 text-green-500 animate-spin" />
              <p className="text-slate-600 dark:text-slate-300 font-medium">
                Procesando archivo de Dropi...
              </p>
            </>
          ) : (
            <>
              <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-full">
                <Upload className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-slate-800 dark:text-white font-medium">
                  Arrastra tu archivo de Dropi aquí
                </p>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                  o haz clic para seleccionar (Excel, CSV)
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <FileSpreadsheet className="w-4 h-4" />
                <span>Formatos: .xlsx, .xls, .csv</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Última importación exitosa */}
      {lastImport && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-green-800 dark:text-green-300">
                Importación exitosa
              </p>
              <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                {lastImport.fileName} - {lastImport.ordersCount} pedidos procesados
              </p>
              <div className="grid grid-cols-3 gap-4 mt-3">
                <div>
                  <p className="text-xs text-green-600 dark:text-green-400">Ventas</p>
                  <p className="font-semibold text-green-800 dark:text-green-300">
                    {formatCurrency(lastImport.grossSales)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-green-600 dark:text-green-400">Ganancia</p>
                  <p className="font-semibold text-green-800 dark:text-green-300">
                    {formatCurrency(lastImport.profit)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-green-600 dark:text-green-400">Entregados</p>
                  <p className="font-semibold text-green-800 dark:text-green-300">
                    {lastImport.deliveredCount} / {lastImport.ordersCount}
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setLastImport(null)}
              className="text-green-500 hover:text-green-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Resumen del mes */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-navy-800 rounded-xl p-4 border border-slate-200 dark:border-navy-700">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm mb-1">
            <DollarSign className="w-4 h-4" />
            Ventas Brutas
          </div>
          <p className="text-2xl font-bold text-slate-800 dark:text-white">
            {formatCurrency(totals.grossSales)}
          </p>
        </div>

        <div className="bg-white dark:bg-navy-800 rounded-xl p-4 border border-slate-200 dark:border-navy-700">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm mb-1">
            <TrendingUp className="w-4 h-4" />
            Ganancia
          </div>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {formatCurrency(totals.profit)}
          </p>
        </div>

        <div className="bg-white dark:bg-navy-800 rounded-xl p-4 border border-slate-200 dark:border-navy-700">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm mb-1">
            <Package className="w-4 h-4" />
            Pedidos
          </div>
          <p className="text-2xl font-bold text-slate-800 dark:text-white">
            {totals.orders.toLocaleString()}
          </p>
        </div>

        <div className="bg-white dark:bg-navy-800 rounded-xl p-4 border border-slate-200 dark:border-navy-700">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm mb-1">
            <CheckCircle className="w-4 h-4" />
            Tasa Entrega
          </div>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {totals.orders > 0
              ? ((totals.delivered / totals.orders) * 100).toFixed(1)
              : 0}
            %
          </p>
        </div>
      </div>

      {/* Lista de ingresos */}
      <div className="bg-white dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-navy-700 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-navy-700">
          <h3 className="font-semibold text-slate-800 dark:text-white">
            Registros del Mes ({monthIncomes.length})
          </h3>
        </div>

        {monthIncomes.length === 0 ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No hay ingresos registrados este mes</p>
            <p className="text-sm mt-1">Carga un archivo de Dropi para comenzar</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-navy-700">
            {monthIncomes.map((income) => (
              <div
                key={income.id}
                className="p-4 hover:bg-slate-50 dark:hover:bg-navy-700/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        income.source === 'dropi'
                          ? 'bg-purple-100 dark:bg-purple-900/30'
                          : 'bg-blue-100 dark:bg-blue-900/30'
                      }`}
                    >
                      <FileSpreadsheet
                        className={`w-5 h-5 ${
                          income.source === 'dropi'
                            ? 'text-purple-600 dark:text-purple-400'
                            : 'text-blue-600 dark:text-blue-400'
                        }`}
                      />
                    </div>
                    <div>
                      <p className="font-medium text-slate-800 dark:text-white">
                        {income.description}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {income.date} • {income.ordersCount} pedidos •{' '}
                        {income.deliveredCount} entregados
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="font-semibold text-slate-800 dark:text-white">
                        {formatCurrency(income.grossSales)}
                      </p>
                      <p className="text-sm text-green-600 dark:text-green-400">
                        +{formatCurrency(income.profit)}
                      </p>
                    </div>

                    <button
                      onClick={() => deleteIncome(income.id)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de formulario manual */}
      {showManualForm && <ManualIncomeForm onClose={() => setShowManualForm(false)} />}
    </div>
  );
};

export default IncomeManager;
