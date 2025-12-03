import React, { useState, useEffect } from 'react';
import { CarrierName, Shipment } from '../types';
import {
  Smartphone,
  ClipboardList,
  LayoutList,
  FileSpreadsheet,
  CheckCircle,
  ArrowRight,
  AlertCircle,
  Info,
  Sparkles,
  FileUp,
  AlertTriangle,
  Package,
  Phone,
  MapPin,
  Database,
  Zap,
  ChevronRight,
} from 'lucide-react';

interface GuideLoadingWizardProps {
  activeInputTab: 'PHONES' | 'REPORT' | 'SUMMARY' | 'EXCEL';
  onTabChange: (tab: 'PHONES' | 'REPORT' | 'SUMMARY' | 'EXCEL') => void;
  phoneRegistryCount: number;
  shipmentsCount: number;
  inputCarrier: CarrierName | 'AUTO';
  onCarrierChange: (carrier: CarrierName | 'AUTO') => void;
  inputText: string;
  onInputChange: (text: string) => void;
  onProcess: () => void;
  onExcelUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isExcelLoading: boolean;
  xlsxLoaded: boolean;
}

interface StepStatus {
  completed: boolean;
  count: number;
  description: string;
}

export const GuideLoadingWizard: React.FC<GuideLoadingWizardProps> = ({
  activeInputTab,
  onTabChange,
  phoneRegistryCount,
  shipmentsCount,
  inputCarrier,
  onCarrierChange,
  inputText,
  onInputChange,
  onProcess,
  onExcelUpload,
  isExcelLoading,
  xlsxLoaded,
}) => {
  // Calculate step statuses
  const steps: Record<string, StepStatus> = {
    PHONES: {
      completed: phoneRegistryCount > 0,
      count: phoneRegistryCount,
      description: phoneRegistryCount > 0
        ? `${phoneRegistryCount} celulares registrados`
        : 'Sin celulares cargados',
    },
    REPORT: {
      completed: shipmentsCount > 0,
      count: shipmentsCount,
      description: shipmentsCount > 0
        ? `${shipmentsCount} guías con detalle`
        : 'Sin reportes cargados',
    },
    SUMMARY: {
      completed: shipmentsCount > 0,
      count: 0,
      description: 'Actualización masiva opcional',
    },
  };

  // Progress percentage
  const progressSteps = [steps.PHONES.completed, steps.REPORT.completed].filter(Boolean).length;
  const progressPercentage = (progressSteps / 2) * 100;

  const StepIndicator: React.FC<{
    step: 'PHONES' | 'REPORT' | 'SUMMARY';
    number: number;
    label: string;
    icon: React.ReactNode;
    color: string;
    isActive: boolean;
    status: StepStatus;
  }> = ({ step, number, label, icon, color, isActive, status }) => {
    const isCompleted = status.completed;
    const isCurrent = activeInputTab === step;

    return (
      <button
        onClick={() => onTabChange(step)}
        className={`relative flex-1 group transition-all duration-300 ${isCurrent ? 'scale-105' : 'hover:scale-102'}`}
      >
        <div
          className={`
            flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-300
            ${isCurrent
              ? `${color} border-current shadow-lg`
              : isCompleted
                ? 'bg-white dark:bg-navy-900 border-emerald-300 dark:border-emerald-700'
                : 'bg-slate-50 dark:bg-navy-950 border-slate-200 dark:border-navy-800 hover:border-slate-300'
            }
          `}
        >
          {/* Step Number Badge */}
          <div
            className={`
              absolute -top-3 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
              ${isCurrent
                ? 'bg-white dark:bg-navy-800 text-slate-700 dark:text-white shadow-md'
                : isCompleted
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-300 dark:bg-navy-700 text-slate-600 dark:text-slate-400'
              }
            `}
          >
            {isCompleted && !isCurrent ? <CheckCircle className="w-4 h-4" /> : number}
          </div>

          {/* Icon */}
          <div
            className={`
              p-3 rounded-xl mb-2 transition-all
              ${isCurrent
                ? 'bg-white/20 dark:bg-navy-800/50'
                : isCompleted
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                  : 'bg-slate-100 dark:bg-navy-800 text-slate-400'
              }
            `}
          >
            {icon}
          </div>

          {/* Label */}
          <span
            className={`
              text-sm font-bold mb-1
              ${isCurrent
                ? 'text-white'
                : isCompleted
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-slate-600 dark:text-slate-400'
              }
            `}
          >
            {label}
          </span>

          {/* Status */}
          <span
            className={`
              text-[10px] font-medium
              ${isCurrent
                ? 'text-white/80'
                : isCompleted
                  ? 'text-emerald-600/70 dark:text-emerald-400/70'
                  : 'text-slate-400'
              }
            `}
          >
            {status.description}
          </span>
        </div>

        {/* Connector Arrow */}
        {step !== 'SUMMARY' && (
          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 hidden md:block">
            <ChevronRight
              className={`w-5 h-5 ${isCompleted ? 'text-emerald-400' : 'text-slate-300 dark:text-navy-700'}`}
            />
          </div>
        )}
      </button>
    );
  };

  return (
    <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-lg border border-slate-200 dark:border-navy-800 overflow-hidden">
      {/* Header with Progress */}
      <div className="bg-gradient-to-r from-slate-50 to-white dark:from-navy-950 dark:to-navy-900 p-4 border-b border-slate-100 dark:border-navy-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white">Carga Inteligente de Guías</h3>
              <p className="text-xs text-slate-500">Flujo secuencial de 3 pasos para máxima precisión</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 bg-slate-100 dark:bg-navy-800 px-3 py-1.5 rounded-lg">
            <Zap className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
              {progressPercentage.toFixed(0)}% completado
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-slate-200 dark:bg-navy-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Steps Navigation */}
      <div className="p-4 bg-slate-50/50 dark:bg-navy-950/50">
        <div className="grid grid-cols-3 gap-3 md:gap-6 relative">
          <StepIndicator
            step="PHONES"
            number={1}
            label="Celulares"
            icon={<Smartphone className="w-5 h-5" />}
            color="bg-emerald-600 text-white"
            isActive={activeInputTab === 'PHONES'}
            status={steps.PHONES}
          />
          <StepIndicator
            step="REPORT"
            number={2}
            label="Reporte"
            icon={<ClipboardList className="w-5 h-5" />}
            color="bg-orange-500 text-white"
            isActive={activeInputTab === 'REPORT'}
            status={steps.REPORT}
          />
          <StepIndicator
            step="SUMMARY"
            number={3}
            label="Resumen"
            icon={<LayoutList className="w-5 h-5" />}
            color="bg-blue-600 text-white"
            isActive={activeInputTab === 'SUMMARY'}
            status={steps.SUMMARY}
          />
        </div>
      </div>

      {/* Excel Alternative Tab */}
      <div className="px-4 pb-2">
        <button
          onClick={() => onTabChange('EXCEL')}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all border-2 border-dashed ${
            activeInputTab === 'EXCEL'
              ? 'bg-purple-100 dark:bg-purple-900/20 border-purple-400 text-purple-700 dark:text-purple-400'
              : 'bg-white dark:bg-navy-900 border-slate-200 dark:border-navy-700 text-slate-500 hover:border-purple-300 hover:text-purple-600'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          Alternativa: Cargar desde Excel
        </button>
      </div>

      {/* Instructions Panel */}
      <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 border-t border-blue-100 dark:border-blue-900/30">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0">
            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-xs text-blue-700 dark:text-blue-300">
            {activeInputTab === 'PHONES' && (
              <>
                <strong>Paso 1:</strong> Pegue las columnas [Guía] y [Celular] desde Excel/Sheets.
                El sistema detectará automáticamente cuál es cuál. Este "diccionario" de celulares
                se usará para enriquecer los reportes que cargue después.
              </>
            )}
            {activeInputTab === 'REPORT' && (
              <>
                <strong>Paso 2:</strong> Pegue el reporte completo copiado desde el sistema de la transportadora (Inter, Envía, Coordinadora).
                Incluye historial, fechas y estados. Los celulares del Paso 1 se vinculan automáticamente.
              </>
            )}
            {activeInputTab === 'SUMMARY' && (
              <>
                <strong>Paso 3 (Opcional):</strong> Si tiene guías que no estaban en el reporte detallado,
                pegue aquí el resumen de 17TRACK. Las guías duplicadas se ignorarán.
              </>
            )}
            {activeInputTab === 'EXCEL' && (
              <>
                <strong>Carga Alternativa:</strong> Suba un archivo Excel con columnas: GUIA, ESTADO, TELEFONO, TRANSPORTADORA, DESTINO, DIAS.
                El sistema normalizará los datos automáticamente.
              </>
            )}
          </div>
        </div>
      </div>

      {/* Input Content */}
      {activeInputTab === 'EXCEL' ? (
        <div className="p-6">
          <div className="max-w-lg mx-auto text-center">
            <div className="bg-gradient-to-br from-purple-500 to-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <FileUp className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
              Cargar Guías desde Excel
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">
              Sube un archivo Excel (.xlsx, .xls) con tus guías
            </p>

            <div className="bg-slate-50 dark:bg-navy-950 rounded-xl p-6 mb-6">
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
                Columnas recomendadas:
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs text-left">
                <div className="bg-white dark:bg-navy-900 px-3 py-2 rounded-lg">
                  <span className="text-purple-600 font-bold">GUIA</span> - Número de guía
                </div>
                <div className="bg-white dark:bg-navy-900 px-3 py-2 rounded-lg">
                  <span className="text-purple-600 font-bold">ESTADO</span> - Estado actual
                </div>
                <div className="bg-white dark:bg-navy-900 px-3 py-2 rounded-lg">
                  <span className="text-purple-600 font-bold">TELEFONO</span> - Celular cliente
                </div>
                <div className="bg-white dark:bg-navy-900 px-3 py-2 rounded-lg">
                  <span className="text-purple-600 font-bold">TRANSPORTADORA</span> - Carrier
                </div>
                <div className="bg-white dark:bg-navy-900 px-3 py-2 rounded-lg">
                  <span className="text-purple-600 font-bold">DESTINO</span> - Ciudad destino
                </div>
                <div className="bg-white dark:bg-navy-900 px-3 py-2 rounded-lg">
                  <span className="text-purple-600 font-bold">DIAS</span> - Días en tránsito
                </div>
              </div>
            </div>

            <label
              className={`
                inline-flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-lg cursor-pointer
                transition-all transform hover:scale-105 shadow-lg
                ${isExcelLoading
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white hover:shadow-xl'
                }
              `}
            >
              {isExcelLoading ? (
                <>
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <FileUp className="w-6 h-6" />
                  Seleccionar Archivo Excel
                </>
              )}
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={onExcelUpload}
                disabled={isExcelLoading}
                className="hidden"
              />
            </label>

            {!xlsxLoaded && (
              <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-yellow-700 dark:text-yellow-400 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Cargando librería Excel...
              </div>
            )}
          </div>
        </div>
      ) : (
        <div>
          {/* Carrier Selection (for REPORT and SUMMARY) */}
          {(activeInputTab === 'REPORT' || activeInputTab === 'SUMMARY') && (
            <div className="px-6 pt-4 pb-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase mr-2">
                  Transportadora:
                </span>
                <button
                  onClick={() => onCarrierChange('AUTO')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                    inputCarrier === 'AUTO'
                      ? 'bg-slate-700 text-white border-slate-700 shadow-md'
                      : 'bg-slate-100 dark:bg-navy-800 text-slate-500 dark:text-slate-400 border-transparent hover:bg-slate-200'
                  }`}
                >
                  AUTO (Detectar)
                </button>
                {Object.values(CarrierName)
                  .filter((c) => c !== CarrierName.UNKNOWN)
                  .map((c) => (
                    <button
                      key={c}
                      onClick={() => onCarrierChange(c)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                        inputCarrier === c
                          ? `text-white shadow-md transform scale-105 ${
                              c === CarrierName.INTER_RAPIDISIMO
                                ? 'bg-orange-500 border-orange-500'
                                : c === CarrierName.ENVIA
                                  ? 'bg-red-600 border-red-600'
                                  : c === CarrierName.COORDINADORA
                                    ? 'bg-blue-600 border-blue-600'
                                    : c === CarrierName.TCC
                                      ? 'bg-yellow-500 border-yellow-500'
                                      : 'bg-emerald-600 border-emerald-600'
                            }`
                          : 'bg-slate-50 dark:bg-navy-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-navy-700 hover:bg-white dark:hover:bg-navy-700'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* Text Input Area */}
          <div className="flex gap-0 flex-col lg:flex-row h-auto">
            <div className="flex-1 p-4 md:p-6">
              <textarea
                className="w-full h-40 lg:h-48 border-2 border-dashed border-slate-300 dark:border-navy-700 rounded-xl p-4 font-mono text-xs md:text-sm focus:border-orange-500 focus:bg-orange-50/10 dark:focus:bg-navy-950 outline-none transition-all resize-none bg-slate-50 dark:bg-navy-950 text-slate-600 dark:text-slate-300 placeholder:text-slate-400"
                placeholder={
                  activeInputTab === 'PHONES'
                    ? 'Pegue aquí las columnas: [Guía] [Celular] o viceversa...\n\nEjemplo:\n123456789\t3001234567\n987654321\t3109876543'
                    : activeInputTab === 'REPORT'
                      ? 'Pegue aquí el texto del reporte detallado (Guía, Estatus, País, Eventos...)\n\nFormato esperado:\nNúmero: 123456789\nEstatus del paquete: En tránsito\nPaís: Colombia -> Colombia\n2025-12-01 10:30 BOGOTA CUND COL En Centro Logístico'
                      : 'Pegue aquí el resumen de 17TRACK (ID, País, Evento, Estado...)\n\nFormato tabulado de la tabla de resultados de 17TRACK'
                }
                value={inputText}
                onChange={(e) => onInputChange(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-4 justify-start min-w-[200px] p-4 md:p-6 pt-0 lg:pt-6 bg-slate-50 dark:bg-navy-950/50 border-l border-slate-100 dark:border-navy-800">
              <button
                onClick={onProcess}
                disabled={!inputText.trim()}
                className={`w-full text-white px-6 py-3.5 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 ${
                  !inputText.trim()
                    ? 'bg-slate-300 cursor-not-allowed'
                    : activeInputTab === 'REPORT'
                      ? 'bg-orange-600 hover:bg-orange-700 shadow-orange-500/30 active:scale-95'
                      : activeInputTab === 'PHONES'
                        ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/30 active:scale-95'
                        : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30 active:scale-95'
                }`}
              >
                {activeInputTab === 'PHONES' && (
                  <>
                    <Smartphone className="w-5 h-5" />
                    Guardar Celulares
                  </>
                )}
                {activeInputTab === 'REPORT' && (
                  <>
                    <ClipboardList className="w-5 h-5" />
                    Procesar Reporte
                  </>
                )}
                {activeInputTab === 'SUMMARY' && (
                  <>
                    <LayoutList className="w-5 h-5" />
                    Cargar Resumen
                  </>
                )}
              </button>

              {/* Status Indicators */}
              <div className="space-y-2">
                {activeInputTab === 'PHONES' && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Phone className="w-3 h-3" />
                    <span>Registrados: <strong className="text-emerald-600">{phoneRegistryCount}</strong></span>
                  </div>
                )}
                {(activeInputTab === 'REPORT' || activeInputTab === 'SUMMARY') && (
                  <>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Package className="w-3 h-3" />
                      <span>Guías cargadas: <strong className="text-blue-600">{shipmentsCount}</strong></span>
                    </div>
                    {phoneRegistryCount > 0 && (
                      <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-lg">
                        <CheckCircle className="w-3 h-3" />
                        <span>{phoneRegistryCount} celulares listos para vincular</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Next Step Hint */}
              {activeInputTab === 'PHONES' && phoneRegistryCount > 0 && (
                <button
                  onClick={() => onTabChange('REPORT')}
                  className="flex items-center justify-center gap-2 text-xs text-orange-600 hover:text-orange-700 font-medium py-2 px-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg transition-colors"
                >
                  Siguiente: Cargar Reporte
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
              {activeInputTab === 'REPORT' && shipmentsCount > 0 && (
                <button
                  onClick={() => onTabChange('SUMMARY')}
                  className="flex items-center justify-center gap-2 text-xs text-blue-600 hover:text-blue-700 font-medium py-2 px-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg transition-colors"
                >
                  Opcional: Cargar Resumen
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
