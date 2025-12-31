import React, { useState } from 'react';
import { X, Download, FileSpreadsheet, Check } from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import { exportarGuias, exportarNovedad, exportarTodo } from '../utils/excelExport';

type ExportOption = 'guias' | 'novedad' | 'ambos';

const ExportModal: React.FC = () => {
  const { mostrarModalExportar, setMostrarModalExportar, getBloquesHoy } = useAppStore();
  const [opcion, setOpcion] = useState<ExportOption>('guias');
  const [exportado, setExportado] = useState(false);
  const [resultado, setResultado] = useState<{ bloques: number; registros?: number } | null>(null);

  if (!mostrarModalExportar) return null;

  const bloquesHoy = getBloquesHoy();
  const bloquesGuias = bloquesHoy.filter(b => b.tipoProceso === 'guias').length;
  const bloquesNovedad = bloquesHoy.filter(b => b.tipoProceso === 'novedad').length;

  const handleExportar = () => {
    let res;

    switch (opcion) {
      case 'guias':
        res = exportarGuias(bloquesHoy);
        break;
      case 'novedad':
        res = exportarNovedad(bloquesHoy);
        break;
      case 'ambos':
        res = exportarTodo(bloquesHoy);
        break;
    }

    if (res) {
      setResultado(res);
      setExportado(true);
      setTimeout(() => {
        setExportado(false);
        setResultado(null);
        setMostrarModalExportar(false);
      }, 2000);
    }
  };

  const handleClose = () => {
    setExportado(false);
    setResultado(null);
    setMostrarModalExportar(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-dark-800 rounded-xl p-4 w-80 shadow-2xl border border-dark-700">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-green-400" />
            <h3 className="text-lg font-semibold text-white">Exportar a Excel</h3>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded hover:bg-dark-700 text-dark-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {exportado ? (
          // Confirmación de éxito
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-3">
              <Check className="w-8 h-8 text-green-400" />
            </div>
            <h4 className="text-lg font-semibold text-white mb-1">Excel descargado!</h4>
            {resultado && (
              <p className="text-sm text-dark-400">
                {resultado.bloques} bloques exportados
              </p>
            )}
          </div>
        ) : (
          <>
            {/* Opciones */}
            <div className="space-y-2 mb-4">
              <label
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                  opcion === 'guias'
                    ? 'bg-primary-500/20 border border-primary-500'
                    : 'bg-dark-700 border border-transparent hover:border-dark-600'
                }`}
              >
                <input
                  type="radio"
                  name="exportOption"
                  checked={opcion === 'guias'}
                  onChange={() => setOpcion('guias')}
                  className="hidden"
                />
                <span className="text-lg">📦</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">Generación de Guías</p>
                  <p className="text-xs text-dark-400">{bloquesGuias} bloques hoy</p>
                </div>
              </label>

              <label
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                  opcion === 'novedad'
                    ? 'bg-primary-500/20 border border-primary-500'
                    : 'bg-dark-700 border border-transparent hover:border-dark-600'
                }`}
              >
                <input
                  type="radio"
                  name="exportOption"
                  checked={opcion === 'novedad'}
                  onChange={() => setOpcion('novedad')}
                  className="hidden"
                />
                <span className="text-lg">📋</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">Novedad</p>
                  <p className="text-xs text-dark-400">{bloquesNovedad} bloques hoy</p>
                </div>
              </label>

              <label
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                  opcion === 'ambos'
                    ? 'bg-primary-500/20 border border-primary-500'
                    : 'bg-dark-700 border border-transparent hover:border-dark-600'
                }`}
              >
                <input
                  type="radio"
                  name="exportOption"
                  checked={opcion === 'ambos'}
                  onChange={() => setOpcion('ambos')}
                  className="hidden"
                />
                <span className="text-lg">📊</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">Ambos procesos</p>
                  <p className="text-xs text-dark-400">{bloquesHoy.length} bloques en total</p>
                </div>
              </label>
            </div>

            {/* Botón de descarga */}
            <button
              onClick={handleExportar}
              disabled={bloquesHoy.length === 0}
              className="w-full flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-500 disabled:bg-dark-600 disabled:text-dark-400 text-white font-medium rounded-lg transition-all"
            >
              <Download className="w-5 h-5" />
              Descargar Excel
            </button>

            {bloquesHoy.length === 0 && (
              <p className="text-xs text-center text-dark-500 mt-2">
                No hay bloques para exportar hoy
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ExportModal;
