// ============================================
// PROFIT CALCULATOR - Calculadora de Rentabilidad Dropshipping
// "Antes de vender, sabe si vas a ganar"
// ============================================

import React, { useState, useMemo } from 'react';
import {
  Calculator,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Info,
  BarChart3,
} from 'lucide-react';
import { useDropshippingStore, formatCOP } from '../../../services/dropshippingService';
import type { CalculadoraInput } from '../../../types/dropshipping';

export const ProfitCalculator: React.FC = () => {
  const { calcularRentabilidad } = useDropshippingStore();

  const [input, setInput] = useState<CalculadoraInput>({
    precioVenta: 89900,
    costoProducto: 35000,
    costoEnvio: 12000,
    comisionPlataforma: 3000,
    comisionCOD: 2500,
    costoPublicidadPorVenta: 15000,
    tasaRechazoEstimada: 20,
    costoDevolucionPromedio: 8000,
  });

  const resultado = useMemo(() => calcularRentabilidad(input), [input, calcularRentabilidad]);

  const updateField = (field: keyof CalculadoraInput, value: string) => {
    setInput((prev) => ({ ...prev, [field]: Number(value) || 0 }));
  };

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* INPUT SIDE */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-navy-800 rounded-2xl border border-slate-200 dark:border-navy-700 p-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-blue-500" />
              Datos del Producto
            </h3>

            <div className="space-y-4">
              <InputField
                label="Precio de Venta"
                value={input.precioVenta}
                onChange={(v) => updateField('precioVenta', v)}
                prefix="$"
                hint="Lo que paga el cliente"
              />
              <InputField
                label="Costo del Producto"
                value={input.costoProducto}
                onChange={(v) => updateField('costoProducto', v)}
                prefix="$"
                hint="Lo que pagas al proveedor (Dropi)"
              />
              <InputField
                label="Costo de Envio"
                value={input.costoEnvio}
                onChange={(v) => updateField('costoEnvio', v)}
                prefix="$"
                hint="Flete de la transportadora"
              />
              <InputField
                label="Comision Plataforma"
                value={input.comisionPlataforma}
                onChange={(v) => updateField('comisionPlataforma', v)}
                prefix="$"
                hint="Comision de Dropi/Shopify"
              />
              <InputField
                label="Comision COD (Recaudo)"
                value={input.comisionCOD}
                onChange={(v) => updateField('comisionCOD', v)}
                prefix="$"
                hint="Fee por cobrar contra entrega"
              />
            </div>
          </div>

          <div className="bg-white dark:bg-navy-800 rounded-2xl border border-slate-200 dark:border-navy-700 p-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-500" />
              Publicidad y Rechazos
            </h3>

            <div className="space-y-4">
              <InputField
                label="Costo de Ads por Venta (CPA)"
                value={input.costoPublicidadPorVenta}
                onChange={(v) => updateField('costoPublicidadPorVenta', v)}
                prefix="$"
                hint="Cuanto gastas en publicidad por cada venta"
              />
              <InputField
                label="Tasa de Rechazo Estimada"
                value={input.tasaRechazoEstimada}
                onChange={(v) => updateField('tasaRechazoEstimada', v)}
                suffix="%"
                hint="% de pedidos que rechazan en puerta"
              />
              <InputField
                label="Costo de Devolucion Promedio"
                value={input.costoDevolucionPromedio}
                onChange={(v) => updateField('costoDevolucionPromedio', v)}
                prefix="$"
                hint="Flete de retorno cuando rechazan"
              />
            </div>
          </div>
        </div>

        {/* RESULTS SIDE */}
        <div className="space-y-4">
          {/* Main verdict */}
          <div className={`rounded-2xl border-2 p-6 ${
            resultado.esRentable
              ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-300 dark:border-emerald-700'
              : 'bg-red-50 dark:bg-red-900/10 border-red-300 dark:border-red-700'
          }`}>
            <div className="flex items-center gap-3 mb-4">
              {resultado.esRentable ? (
                <CheckCircle className="w-8 h-8 text-emerald-500" />
              ) : (
                <AlertTriangle className="w-8 h-8 text-red-500" />
              )}
              <div>
                <h3 className={`text-xl font-black ${resultado.esRentable ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
                  {resultado.esRentable ? 'RENTABLE' : 'NO RENTABLE'}
                </h3>
                <p className="text-sm text-slate-500">Con {input.tasaRechazoEstimada}% de rechazo</p>
              </div>
            </div>

            {resultado.alerta && (
              <div className={`p-3 rounded-xl text-sm ${
                resultado.esRentable
                  ? 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
                  : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
              }`}>
                <AlertTriangle className="w-4 h-4 inline mr-2" />
                {resultado.alerta}
              </div>
            )}
          </div>

          {/* Per-order breakdown */}
          <div className="bg-white dark:bg-navy-800 rounded-2xl border border-slate-200 dark:border-navy-700 p-6">
            <h3 className="text-sm font-bold text-slate-500 mb-4 uppercase tracking-wider">
              Por Pedido Entregado
            </h3>

            <div className="space-y-3">
              <ResultRow label="Precio de Venta" value={formatCOP(input.precioVenta)} color="text-slate-800 dark:text-white" />
              <ResultRow label="- Costo Producto" value={`-${formatCOP(input.costoProducto)}`} color="text-slate-600 dark:text-slate-300" />
              <ResultRow label="- Envio" value={`-${formatCOP(input.costoEnvio)}`} color="text-slate-600 dark:text-slate-300" />
              <ResultRow label="- Comisiones" value={`-${formatCOP(input.comisionPlataforma + input.comisionCOD)}`} color="text-slate-600 dark:text-slate-300" />
              <ResultRow label="- Publicidad (CPA)" value={`-${formatCOP(input.costoPublicidadPorVenta)}`} color="text-purple-500" />

              <div className="border-t border-slate-200 dark:border-navy-700 pt-3">
                <ResultRow
                  label="= Utilidad sin rechazos"
                  value={formatCOP(resultado.utilidadPorPedido)}
                  color={resultado.utilidadPorPedido >= 0 ? 'text-emerald-600 font-bold' : 'text-red-600 font-bold'}
                  bold
                />
                <p className="text-xs text-slate-400 text-right">Margen: {resultado.margenPorPedido.toFixed(1)}%</p>
              </div>

              <div className="bg-red-50 dark:bg-red-900/10 rounded-xl p-3 mt-2">
                <ResultRow
                  label="- Costo prorrateado rechazos"
                  value={`-${formatCOP(resultado.utilidadPorPedido - resultado.utilidadRealPorPedido)}`}
                  color="text-red-500"
                />
                <p className="text-xs text-red-400 mt-1">
                  Por cada 100 pedidos, {input.tasaRechazoEstimada} son rechazados.
                  El costo de esos rechazos se reparte entre los {100 - input.tasaRechazoEstimada} entregados.
                </p>
              </div>

              <div className="border-t-2 border-slate-300 dark:border-navy-600 pt-3">
                <ResultRow
                  label="= UTILIDAD REAL por pedido"
                  value={formatCOP(resultado.utilidadRealPorPedido)}
                  color={resultado.utilidadRealPorPedido >= 0 ? 'text-emerald-600' : 'text-red-600'}
                  bold
                />
                <p className={`text-xs text-right font-bold ${resultado.margenRealPorPedido >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  Margen REAL: {resultado.margenRealPorPedido.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          {/* Sensitivity analysis */}
          <div className="bg-white dark:bg-navy-800 rounded-2xl border border-slate-200 dark:border-navy-700 p-6">
            <h3 className="text-sm font-bold text-slate-500 mb-4 uppercase tracking-wider flex items-center gap-2">
              <Info className="w-4 h-4" />
              Sensibilidad al Rechazo
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Como cambia tu margen si la tasa de rechazo sube o baja
            </p>

            <div className="space-y-2">
              <SensitivityBar label="5% rechazo" margin={resultado.margenSiRechazo5} />
              <SensitivityBar label="10% rechazo" margin={resultado.margenSiRechazo10} />
              <SensitivityBar label="20% rechazo" margin={resultado.margenSiRechazo20} highlight={input.tasaRechazoEstimada === 20} />
              <SensitivityBar label="30% rechazo" margin={resultado.margenSiRechazo30} />
            </div>
          </div>

          {/* Quick projection */}
          {resultado.esRentable && resultado.ventasDiariasNecesarias > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-200 dark:border-blue-800 p-6">
              <h3 className="text-sm font-bold text-blue-600 dark:text-blue-400 mb-2">
                Proyeccion Rapida
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Para ganar <strong>$1.000.000 COP/mes</strong> necesitas vender{' '}
                <strong className="text-blue-600">{resultado.ventasDiariasNecesarias} pedidos/dia</strong>{' '}
                (entregados, no totales).
              </p>
              <p className="text-xs text-slate-400 mt-2">
                Con {input.tasaRechazoEstimada}% de rechazo, necesitas generar ~{Math.ceil(resultado.ventasDiariasNecesarias / (1 - input.tasaRechazoEstimada / 100))} pedidos totales/dia.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================
// SUB-COMPONENTS
// ============================================

const InputField: React.FC<{
  label: string;
  value: number;
  onChange: (value: string) => void;
  prefix?: string;
  suffix?: string;
  hint?: string;
}> = ({ label, value, onChange, prefix, suffix, hint }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
      {label}
    </label>
    <div className="relative">
      {prefix && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">
          {prefix}
        </span>
      )}
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-xl py-2.5 text-sm font-medium text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
          prefix ? 'pl-7' : 'pl-3'
        } ${suffix ? 'pr-8' : 'pr-3'}`}
      />
      {suffix && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">
          {suffix}
        </span>
      )}
    </div>
    {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
  </div>
);

const ResultRow: React.FC<{
  label: string;
  value: string;
  color: string;
  bold?: boolean;
}> = ({ label, value, color, bold }) => (
  <div className="flex justify-between items-center">
    <span className={`text-sm ${bold ? 'font-bold text-slate-800 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>
      {label}
    </span>
    <span className={`text-sm ${color} ${bold ? 'text-lg font-black' : 'font-medium'}`}>{value}</span>
  </div>
);

const SensitivityBar: React.FC<{
  label: string;
  margin: number;
  highlight?: boolean;
}> = ({ label, margin, highlight }) => (
  <div className={`flex items-center gap-3 p-2 rounded-lg ${highlight ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' : ''}`}>
    <span className="w-24 text-xs text-slate-500 font-medium">{label}</span>
    <div className="flex-1 bg-slate-100 dark:bg-navy-700 rounded-full h-3 relative">
      <div
        className={`h-3 rounded-full transition-all ${margin >= 15 ? 'bg-emerald-500' : margin >= 5 ? 'bg-amber-500' : margin >= 0 ? 'bg-orange-500' : 'bg-red-500'}`}
        style={{ width: `${Math.min(100, Math.max(2, margin + 10))}%` }}
      />
    </div>
    <span className={`w-16 text-right text-xs font-bold ${margin >= 10 ? 'text-emerald-500' : margin >= 0 ? 'text-amber-500' : 'text-red-500'}`}>
      {margin.toFixed(1)}%
    </span>
  </div>
);

export default ProfitCalculator;
