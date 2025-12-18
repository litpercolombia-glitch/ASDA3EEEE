/**
 * EXCEL IMPORTER COMPONENT
 * Importar datos desde archivos Excel exportados del desktop
 */

import React, { useState, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  Users,
  Package,
  AlertTriangle,
  CheckCircle,
  X,
  Loader2,
  Eye,
  ArrowRight,
} from 'lucide-react';
import { useProcesosStore } from '../stores/procesosStore';

interface ExcelImporterProps {
  isOpen: boolean;
  onClose: () => void;
}

interface RondaImportada {
  fecha: string;
  ronda: number;
  horaInicio: string;
  horaFin: string;
  tiempoUsado: number;
  tipo: 'guias' | 'novedades';
  // Guías
  pedidosIniciales?: number;
  realizado?: number;
  cancelado?: number;
  agendado?: number;
  dificiles?: number;
  pendientes?: number;
  revisado?: number;
  // Novedades
  revisadas?: number;
  solucionadas?: number;
  devolucion?: number;
  cliente?: number;
  transportadora?: number;
  litper?: number;
}

const API_URL = 'http://localhost:8000/api/tracker';

const ExcelImporter: React.FC<ExcelImporterProps> = ({ isOpen, onClose }) => {
  const { usuarios, agregarRonda } = useProcesosStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<'upload' | 'config' | 'preview' | 'done'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [proceso, setProceso] = useState<'guias' | 'novedades'>('guias');
  const [rondasImportadas, setRondasImportadas] = useState<RondaImportada[]>([]);
  const [loading, setLoading] = useState(false);
  const [importedCount, setImportedCount] = useState(0);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setLoading(true);

    try {
      // Intentar parsear el archivo (CSV o Excel)
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());

      if (lines.length < 2) {
        alert('El archivo está vacío o no tiene datos válidos');
        setLoading(false);
        return;
      }

      // Parsear headers
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

      // Parsear datos
      const rondas: RondaImportada[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        if (values.length < 3) continue;

        const ronda: RondaImportada = {
          fecha: values[headers.indexOf('fecha')] || new Date().toISOString().split('T')[0],
          ronda: parseInt(values[headers.indexOf('ronda')]) || i,
          horaInicio: values[headers.indexOf('hora inicio')] || values[headers.indexOf('horainicio')] || '',
          horaFin: values[headers.indexOf('hora fin')] || values[headers.indexOf('horafin')] || '',
          tiempoUsado: parseInt(values[headers.indexOf('tiempo (min)')] || values[headers.indexOf('tiempo')]) || 30,
          tipo: proceso,
          realizado: parseInt(values[headers.indexOf('realizadas')] || values[headers.indexOf('realizado')]) || 0,
          cancelado: parseInt(values[headers.indexOf('canceladas')] || values[headers.indexOf('cancelado')]) || 0,
          agendado: parseInt(values[headers.indexOf('agendadas')] || values[headers.indexOf('agendado')]) || 0,
          dificiles: parseInt(values[headers.indexOf('difíciles')] || values[headers.indexOf('dificiles')]) || 0,
          pendientes: parseInt(values[headers.indexOf('pendientes')]) || 0,
        };

        rondas.push(ronda);
      }

      setRondasImportadas(rondas);
      setStep('config');
    } catch (error) {
      console.error('Error parseando archivo:', error);
      alert('Error al leer el archivo. Asegúrate de que sea un CSV válido.');
    }

    setLoading(false);
  };

  const handleImport = async () => {
    if (!selectedUser) {
      alert('Por favor selecciona un usuario');
      return;
    }

    setLoading(true);
    let count = 0;

    for (const ronda of rondasImportadas) {
      try {
        // Agregar al store local
        agregarRonda({
          usuarioId: selectedUser,
          numeroRonda: ronda.ronda,
          fecha: ronda.fecha,
          horaInicio: ronda.horaInicio,
          horaFin: ronda.horaFin,
          tiempoTotal: ronda.tiempoUsado * 60,
          pedidosIniciales: ronda.pedidosIniciales || 0,
          realizado: ronda.realizado || 0,
          cancelado: ronda.cancelado || 0,
          agendado: ronda.agendado || 0,
          dificiles: ronda.dificiles || 0,
          pendientes: ronda.pendientes || 0,
          tipoNovedad: null,
        });

        // También enviar al backend
        const endpoint = proceso === 'guias' ? '/rondas/guias' : '/rondas/novedades';
        await fetch(`${API_URL}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            usuario_id: selectedUser,
            usuario_nombre: usuarios.find(u => u.id === selectedUser)?.nombre || 'Importado',
            numero: ronda.ronda,
            fecha: ronda.fecha,
            hora_inicio: ronda.horaInicio,
            hora_fin: ronda.horaFin,
            tiempo_usado: ronda.tiempoUsado,
            tipo: proceso,
            ...ronda,
          }),
        });

        count++;
      } catch (error) {
        console.warn('Error importando ronda:', error);
      }
    }

    setImportedCount(count);
    setStep('done');
    setLoading(false);
  };

  const resetImporter = () => {
    setStep('upload');
    setSelectedFile(null);
    setSelectedUser('');
    setRondasImportadas([]);
    setImportedCount(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-800 rounded-2xl w-full max-w-lg mx-4 shadow-2xl border border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-400" />
            Importar Datos
          </h2>
          <button
            onClick={() => {
              resetImporter();
              onClose();
            }}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Step: Upload */}
          {step === 'upload' && (
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-600 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-500/5 transition-all"
              >
                <FileSpreadsheet className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                <p className="text-white font-medium mb-2">
                  Arrastra un archivo o haz clic para seleccionar
                </p>
                <p className="text-sm text-slate-400">
                  Formatos: CSV, Excel (.xlsx, .xls)
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="bg-slate-700/50 rounded-lg p-3 text-sm text-slate-400">
                <p className="font-medium text-slate-300 mb-1">Formato esperado:</p>
                <p>Fecha, Ronda, Hora Inicio, Hora Fin, Tiempo (min), Realizadas, Canceladas, ...</p>
              </div>
            </div>
          )}

          {/* Step: Config */}
          {step === 'config' && (
            <div className="space-y-4">
              <div className="bg-emerald-500/20 border border-emerald-500/50 rounded-lg p-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <div>
                  <p className="text-emerald-400 font-medium">Archivo cargado</p>
                  <p className="text-sm text-slate-400">{selectedFile?.name} - {rondasImportadas.length} rondas encontradas</p>
                </div>
              </div>

              {/* Seleccionar usuario */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  ¿A qué usuario pertenecen estos datos?
                </label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full px-3 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar usuario...</option>
                  {usuarios.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.avatar} {u.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Seleccionar proceso */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  ¿Qué tipo de proceso son?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setProceso('guias')}
                    className={`p-4 rounded-xl text-center transition-colors ${
                      proceso === 'guias'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    <Package className="w-8 h-8 mx-auto mb-2" />
                    <span className="font-medium">Guías</span>
                  </button>
                  <button
                    onClick={() => setProceso('novedades')}
                    className={`p-4 rounded-xl text-center transition-colors ${
                      proceso === 'novedades'
                        ? 'bg-amber-500 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
                    <span className="font-medium">Novedades</span>
                  </button>
                </div>
              </div>

              {/* Preview button */}
              <button
                onClick={() => setStep('preview')}
                disabled={!selectedUser}
                className="w-full py-3 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-700 disabled:opacity-50 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <Eye className="w-4 h-4" />
                Ver Vista Previa
              </button>
            </div>
          )}

          {/* Step: Preview */}
          {step === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-white">Vista Previa de Datos</h3>
                <button
                  onClick={() => setStep('config')}
                  className="text-sm text-blue-400 hover:text-blue-300"
                >
                  ← Volver
                </button>
              </div>

              <div className="max-h-64 overflow-y-auto bg-slate-900 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-slate-700 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left text-slate-300">Fecha</th>
                      <th className="px-3 py-2 text-left text-slate-300">Ronda</th>
                      <th className="px-3 py-2 text-left text-slate-300">Realizadas</th>
                      <th className="px-3 py-2 text-left text-slate-300">Tiempo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {rondasImportadas.slice(0, 10).map((ronda, i) => (
                      <tr key={i} className="hover:bg-slate-800">
                        <td className="px-3 py-2 text-slate-400">{ronda.fecha}</td>
                        <td className="px-3 py-2 text-slate-400">#{ronda.ronda}</td>
                        <td className="px-3 py-2 text-emerald-400">{ronda.realizado || 0}</td>
                        <td className="px-3 py-2 text-slate-400">{ronda.tiempoUsado}min</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {rondasImportadas.length > 10 && (
                  <p className="text-center text-slate-500 py-2 text-sm">
                    +{rondasImportadas.length - 10} rondas más
                  </p>
                )}
              </div>

              <div className="bg-slate-700/50 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Resumen</p>
                  <p className="text-sm text-slate-400">
                    {rondasImportadas.length} rondas → {usuarios.find(u => u.id === selectedUser)?.nombre}
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-500" />
              </div>
            </div>
          )}

          {/* Step: Done */}
          {step === 'done' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">¡Importación Exitosa!</h3>
              <p className="text-slate-400 mb-6">
                Se importaron {importedCount} rondas correctamente
              </p>
              <button
                onClick={() => {
                  resetImporter();
                  onClose();
                }}
                className="px-6 py-3 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-colors"
              >
                Cerrar
              </button>
            </div>
          )}
        </div>

        {/* Footer - Import button */}
        {step === 'preview' && (
          <div className="p-4 border-t border-slate-700">
            <button
              onClick={handleImport}
              disabled={loading}
              className="w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Importar {rondasImportadas.length} Rondas
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExcelImporter;
