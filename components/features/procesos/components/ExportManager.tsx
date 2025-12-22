/**
 * EXPORT MANAGER COMPONENT
 * Exportar datos de rondas a Excel de forma organizada
 */

import React, { useState } from 'react';
import {
  Download,
  FileSpreadsheet,
  Calendar,
  Users,
  Package,
  AlertTriangle,
  CheckCircle,
  Loader2,
  X,
} from 'lucide-react';
import { useProcesosStore } from '../stores/procesosStore';

interface ExportManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

const API_URL = 'http://localhost:8000/api/tracker';

const ExportManager: React.FC<ExportManagerProps> = ({ isOpen, onClose }) => {
  const { usuarios, rondas } = useProcesosStore();
  const [loading, setLoading] = useState(false);
  const [exportType, setExportType] = useState<'todo' | 'usuario' | 'fecha'>('todo');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [fechaInicio, setFechaInicio] = useState(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0]);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const exportarExcel = async () => {
    setLoading(true);
    try {
      let url = `${API_URL}/exportar/excel?`;

      if (exportType === 'usuario' && selectedUser) {
        url += `usuario_id=${selectedUser}&`;
      }

      url += `fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`;

      const response = await fetch(url);

      if (response.ok) {
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `LITPER_Rondas_${fechaInicio}_${fechaFin}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(downloadUrl);
        a.remove();
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        // Fallback: generar CSV localmente
        exportarCSVLocal();
      }
    } catch (error) {
      console.warn('Error exportando desde backend, usando fallback local:', error);
      exportarCSVLocal();
    }
    setLoading(false);
  };

  const exportarCSVLocal = () => {
    // Filtrar rondas según selección
    let rondasFiltradas = [...rondas];

    if (exportType === 'usuario' && selectedUser) {
      rondasFiltradas = rondasFiltradas.filter(r => r.usuarioId === selectedUser);
    }

    rondasFiltradas = rondasFiltradas.filter(r => {
      const fecha = r.fecha;
      return fecha >= fechaInicio && fecha <= fechaFin;
    });

    // Generar CSV
    const headers = [
      'Fecha',
      'Usuario',
      'Ronda',
      'Proceso',
      'Hora Inicio',
      'Hora Fin',
      'Tiempo (min)',
      'Realizadas',
      'Canceladas',
      'Agendadas',
      'Difíciles',
      'Pendientes',
    ];

    const rows = rondasFiltradas.map(ronda => {
      const usuario = usuarios.find(u => u.id === ronda.usuarioId);
      return [
        ronda.fecha,
        usuario?.nombre || 'Desconocido',
        ronda.numeroRonda || 1,
        'Guías',
        ronda.horaInicio || '',
        ronda.horaFin || '',
        Math.round(ronda.tiempoTotal / 60),
        ronda.realizado,
        ronda.cancelado,
        ronda.agendado || 0,
        ronda.dificiles || 0,
        ronda.pendientes || 0,
      ].join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LITPER_Rondas_${fechaInicio}_${fechaFin}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const totalRondas = rondas.filter(r => {
    const enRango = r.fecha >= fechaInicio && r.fecha <= fechaFin;
    const delUsuario = exportType !== 'usuario' || !selectedUser || r.usuarioId === selectedUser;
    return enRango && delUsuario;
  }).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-800 rounded-2xl w-full max-w-lg mx-4 shadow-2xl border border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            Exportar Datos
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Tipo de exportación */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Tipo de exportación
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setExportType('todo')}
                className={`p-3 rounded-xl text-center transition-colors ${
                  exportType === 'todo'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                <Package className="w-5 h-5 mx-auto mb-1" />
                <span className="text-sm">Todo</span>
              </button>
              <button
                onClick={() => setExportType('usuario')}
                className={`p-3 rounded-xl text-center transition-colors ${
                  exportType === 'usuario'
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                <Users className="w-5 h-5 mx-auto mb-1" />
                <span className="text-sm">Por Usuario</span>
              </button>
              <button
                onClick={() => setExportType('fecha')}
                className={`p-3 rounded-xl text-center transition-colors ${
                  exportType === 'fecha'
                    ? 'bg-amber-500 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                <Calendar className="w-5 h-5 mx-auto mb-1" />
                <span className="text-sm">Por Fecha</span>
              </button>
            </div>
          </div>

          {/* Selector de usuario */}
          {exportType === 'usuario' && (
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Seleccionar Usuario
              </label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Todos los usuarios</option>
                {usuarios.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.avatar} {u.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Rango de fechas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Fecha Inicio
              </label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Fecha Fin
              </label>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Preview */}
          <div className="bg-slate-700/50 rounded-xl p-4">
            <h4 className="text-sm font-medium text-slate-400 mb-2">Resumen</h4>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-emerald-400">{totalRondas}</p>
                <p className="text-xs text-slate-400">Rondas a exportar</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-400">
                  {exportType === 'usuario' && selectedUser
                    ? usuarios.find(u => u.id === selectedUser)?.nombre || '1'
                    : usuarios.length}
                </p>
                <p className="text-xs text-slate-400">
                  {exportType === 'usuario' && selectedUser ? 'Usuario' : 'Usuarios'}
                </p>
              </div>
            </div>
          </div>

          {/* Success message */}
          {success && (
            <div className="bg-emerald-500/20 border border-emerald-500/50 rounded-lg p-3 flex items-center gap-2 text-emerald-400">
              <CheckCircle className="w-5 h-5" />
              <span>Archivo exportado exitosamente</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700">
          <button
            onClick={exportarExcel}
            disabled={loading || totalRondas === 0}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Exportar Excel
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportManager;
