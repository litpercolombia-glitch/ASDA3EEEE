/**
 * StockAdjustmentModal
 *
 * Modal para ajustar el stock de productos.
 * Soporta: entrada, salida, ajuste, transferencia entre almacenes.
 */

import React, { useState, useEffect } from 'react';
import {
  Package,
  ArrowUpCircle,
  ArrowDownCircle,
  RefreshCw,
  ArrowRightLeft,
  X,
  Save,
  Loader2,
  AlertTriangle,
  Warehouse,
  FileText,
  Hash,
} from 'lucide-react';
import type { Product, InventoryItem, Warehouse as WarehouseType, MovementType } from '@/types/inventory.types';

type AdjustmentType = 'in' | 'out' | 'adjustment' | 'transfer';

interface StockAdjustmentModalProps {
  product: Product;
  currentStock: InventoryItem | null;
  warehouses: WarehouseType[];
  currentWarehouseId: string;
  onSave: (data: {
    type: MovementType;
    quantity: number;
    warehouseId: string;
    destinationWarehouseId?: string;
    reason: string;
    reference?: string;
    notes?: string;
  }) => Promise<void>;
  onClose: () => void;
  isLoading?: boolean;
}

const ADJUSTMENT_TYPES: { value: AdjustmentType; label: string; icon: React.ReactNode; color: string }[] = [
  {
    value: 'in',
    label: 'Entrada',
    icon: <ArrowUpCircle className="w-5 h-5" />,
    color: 'text-green-600 bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800',
  },
  {
    value: 'out',
    label: 'Salida',
    icon: <ArrowDownCircle className="w-5 h-5" />,
    color: 'text-red-600 bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800',
  },
  {
    value: 'adjustment',
    label: 'Ajuste',
    icon: <RefreshCw className="w-5 h-5" />,
    color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800',
  },
  {
    value: 'transfer',
    label: 'Transferencia',
    icon: <ArrowRightLeft className="w-5 h-5" />,
    color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800',
  },
];

const REASONS = {
  in: [
    'Compra de proveedor',
    'Devolución de cliente',
    'Producción terminada',
    'Ajuste de inventario',
    'Transferencia entrante',
    'Otro',
  ],
  out: [
    'Venta',
    'Devolución a proveedor',
    'Producto dañado',
    'Producto vencido',
    'Uso interno',
    'Merma',
    'Ajuste de inventario',
    'Otro',
  ],
  adjustment: [
    'Conteo físico',
    'Corrección de error',
    'Auditoría',
    'Diferencia de sistema',
    'Otro',
  ],
  transfer: [
    'Reabastecimiento',
    'Consolidación de almacenes',
    'Reubicación',
    'Otro',
  ],
};

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  product,
  currentStock,
  warehouses,
  currentWarehouseId,
  onSave,
  onClose,
  isLoading = false,
}) => {
  const [adjustmentType, setAdjustmentType] = useState<AdjustmentType>('in');
  const [quantity, setQuantity] = useState('');
  const [newStockLevel, setNewStockLevel] = useState('');
  const [warehouseId, setWarehouseId] = useState(currentWarehouseId);
  const [destinationWarehouseId, setDestinationWarehouseId] = useState('');
  const [reason, setReason] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const currentQuantity = currentStock?.quantityOnHand || 0;

  // Actualizar cantidad cuando cambia el nuevo nivel de stock (para ajustes)
  useEffect(() => {
    if (adjustmentType === 'adjustment' && newStockLevel !== '') {
      const newLevel = parseInt(newStockLevel) || 0;
      const diff = newLevel - currentQuantity;
      setQuantity(Math.abs(diff).toString());
    }
  }, [newStockLevel, adjustmentType, currentQuantity]);

  // Calcular el stock resultante
  const calculateResultingStock = (): number => {
    const qty = parseInt(quantity) || 0;

    switch (adjustmentType) {
      case 'in':
        return currentQuantity + qty;
      case 'out':
      case 'transfer':
        return currentQuantity - qty;
      case 'adjustment':
        return parseInt(newStockLevel) || 0;
      default:
        return currentQuantity;
    }
  };

  // Validar
  const validate = (): boolean => {
    setError('');

    const qty = parseInt(quantity) || 0;

    if (adjustmentType === 'adjustment') {
      const newLevel = parseInt(newStockLevel);
      if (isNaN(newLevel) || newLevel < 0) {
        setError('El nuevo nivel de stock debe ser un número válido mayor o igual a 0');
        return false;
      }
    } else {
      if (qty <= 0) {
        setError('La cantidad debe ser mayor a 0');
        return false;
      }

      if ((adjustmentType === 'out' || adjustmentType === 'transfer') && qty > currentQuantity) {
        setError(`No hay suficiente stock. Disponible: ${currentQuantity}`);
        return false;
      }
    }

    if (!reason) {
      setError('Selecciona un motivo');
      return false;
    }

    if (adjustmentType === 'transfer') {
      if (!destinationWarehouseId) {
        setError('Selecciona el almacén destino');
        return false;
      }
      if (destinationWarehouseId === warehouseId) {
        setError('El almacén destino debe ser diferente al origen');
        return false;
      }
    }

    return true;
  };

  // Guardar
  const handleSave = async () => {
    if (!validate()) return;

    const qty = parseInt(quantity) || 0;

    // Mapear tipo de ajuste a tipo de movimiento
    const movementTypeMap: Record<AdjustmentType, MovementType> = {
      in: 'purchase',
      out: 'sale',
      adjustment: 'adjustment',
      transfer: 'transfer_out',
    };

    // Ajustar según el motivo específico
    let movementType = movementTypeMap[adjustmentType];
    if (adjustmentType === 'in' && reason === 'Devolución de cliente') {
      movementType = 'return';
    } else if (adjustmentType === 'out' && reason === 'Producto dañado') {
      movementType = 'damaged';
    }

    await onSave({
      type: movementType,
      quantity: adjustmentType === 'adjustment'
        ? parseInt(newStockLevel) - currentQuantity
        : (adjustmentType === 'out' || adjustmentType === 'transfer' ? -qty : qty),
      warehouseId,
      destinationWarehouseId: adjustmentType === 'transfer' ? destinationWarehouseId : undefined,
      reason,
      reference: reference || undefined,
      notes: notes || undefined,
    });
  };

  const resultingStock = calculateResultingStock();
  const stockDifference = resultingStock - currentQuantity;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Ajustar Stock
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {product.name} ({product.sku})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Stock actual */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Stock Actual</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">
              {currentQuantity}
              <span className="text-lg font-normal text-slate-500 ml-1">
                {product.unitOfMeasure === 'unit' ? 'unidades' : product.unitOfMeasure}
              </span>
            </p>
          </div>

          {/* Tipo de ajuste */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Tipo de Movimiento
            </label>
            <div className="grid grid-cols-4 gap-2">
              {ADJUSTMENT_TYPES.map(type => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => {
                    setAdjustmentType(type.value);
                    setReason('');
                    setQuantity('');
                    setNewStockLevel('');
                  }}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    adjustmentType === type.value
                      ? type.color + ' border-current'
                      : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600'
                  }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    {type.icon}
                    <span className="text-xs font-medium">{type.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Cantidad o nuevo nivel */}
          {adjustmentType === 'adjustment' ? (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Nuevo Nivel de Stock
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="number"
                  value={newStockLevel}
                  onChange={(e) => setNewStockLevel(e.target.value)}
                  placeholder="0"
                  min="0"
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                  autoFocus
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Cantidad
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0"
                  min="1"
                  max={adjustmentType === 'out' || adjustmentType === 'transfer' ? currentQuantity : undefined}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* Almacén destino (para transferencias) */}
          {adjustmentType === 'transfer' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Almacén Destino
              </label>
              <div className="relative">
                <Warehouse className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={destinationWarehouseId}
                  onChange={(e) => setDestinationWarehouseId(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                >
                  <option value="">Seleccionar almacén...</option>
                  {warehouses
                    .filter(w => w.id !== warehouseId && w.isActive)
                    .map(w => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.code})
                      </option>
                    ))}
                </select>
              </div>
            </div>
          )}

          {/* Motivo */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Motivo *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccionar motivo...</option>
              {REASONS[adjustmentType].map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Referencia */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Referencia (Opcional)
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Ej: Factura #12345, OC-0001"
                className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Notas (Opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Observaciones adicionales..."
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Preview del resultado */}
          {(quantity || newStockLevel) && (
            <div className={`p-4 rounded-xl ${
              stockDifference >= 0
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Stock Resultante:
                </span>
                <div className="flex items-center gap-2">
                  <span className={`text-2xl font-bold ${
                    stockDifference >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {resultingStock}
                  </span>
                  <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${
                    stockDifference >= 0
                      ? 'bg-green-200 dark:bg-green-800 text-green-700 dark:text-green-300'
                      : 'bg-red-200 dark:bg-red-800 text-red-700 dark:text-red-300'
                  }`}>
                    {stockDifference >= 0 ? '+' : ''}{stockDifference}
                  </span>
                </div>
              </div>

              {/* Alertas */}
              {resultingStock < 0 && (
                <div className="mt-2 flex items-center gap-2 text-red-600 text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span>El stock no puede ser negativo</span>
                </div>
              )}
              {resultingStock < product.minStockLevel && resultingStock >= 0 && (
                <div className="mt-2 flex items-center gap-2 text-amber-600 text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span>El stock quedará por debajo del mínimo ({product.minStockLevel})</span>
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-6 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading || resultingStock < 0}
            className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Aplicar Ajuste
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StockAdjustmentModal;
