/**
 * Panel de Gestión de Operadores
 * Permite agregar, editar y eliminar operadores sin tocar código
 */

import React, { useState } from 'react';
import {
  Users,
  Plus,
  Trash2,
  Edit3,
  X,
  Check,
  RotateCcw,
  Palette,
} from 'lucide-react';
import { UsuarioOperador } from '../../types/analisis-rondas';
import {
  getOperadores,
  addOperador,
  updateOperador,
  removeOperador,
  resetOperadores,
} from '../../constants/analisis-rondas';

const ICON_OPTIONS = ['👑', '🌸', '🌿', '⚡', '🎯', '🌺', '🦋', '🔥', '💎', '🚀', '🌟', '🎪', '🎭', '🎨', '🦅'];
const COLOR_OPTIONS = ['#8b5cf6', '#ec4899', '#10b981', '#3b82f6', '#14b8a6', '#f43f5e', '#06b6d4', '#d946ef', '#f9a8d4', '#f59e0b', '#84cc16', '#ef4444', '#6366f1', '#a855f7', '#0ea5e9'];

export const OperadorManager: React.FC = () => {
  const [operadores, setOperadores] = useState<UsuarioOperador[]>(() => getOperadores());
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form
  const [formNombre, setFormNombre] = useState('');
  const [formIcono, setFormIcono] = useState('👤');
  const [formColor, setFormColor] = useState('#3b82f6');

  const refresh = () => setOperadores(getOperadores());

  const handleAdd = () => {
    if (!formNombre.trim()) return;
    const id = formNombre.trim().toLowerCase().replace(/\s+/g, '_');
    addOperador({ id, nombre: formNombre.trim().toUpperCase(), icono: formIcono, color: formColor });
    refresh();
    setShowAdd(false);
    setFormNombre('');
    setFormIcono('👤');
    setFormColor('#3b82f6');
  };

  const handleUpdate = (id: string) => {
    if (!formNombre.trim()) return;
    updateOperador(id, { nombre: formNombre.trim().toUpperCase(), icono: formIcono, color: formColor });
    refresh();
    setEditingId(null);
  };

  const handleRemove = (id: string) => {
    removeOperador(id);
    refresh();
  };

  const handleReset = () => {
    resetOperadores();
    refresh();
  };

  const startEdit = (op: UsuarioOperador) => {
    setEditingId(op.id);
    setFormNombre(op.nombre);
    setFormIcono(op.icono || '👤');
    setFormColor(op.color || '#3b82f6');
  };

  return (
    <div className="bg-white dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-navy-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-500" />
          Gestión de Operadores ({operadores.length})
        </h3>
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 border border-slate-300 dark:border-navy-600 rounded-lg hover:bg-slate-50 dark:hover:bg-navy-700 flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
          <button
            onClick={() => { setShowAdd(true); setEditingId(null); setFormNombre(''); }}
            className="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> Agregar
          </button>
        </div>
      </div>

      {/* Operator list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-4">
        {operadores.map(op => (
          <div
            key={op.id}
            className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-navy-600 bg-slate-50 dark:bg-navy-700/50 group"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ backgroundColor: `${op.color}20` }}
            >
              {op.icono}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-slate-800 dark:text-white text-sm truncate">{op.nombre}</p>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: op.color }} />
                <span className="text-xs text-slate-400">{op.color}</span>
              </div>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => startEdit(op)}
                className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg"
              >
                <Edit3 className="w-3.5 h-3.5 text-blue-500" />
              </button>
              <button
                onClick={() => handleRemove(op.id)}
                className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-500" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit form */}
      {(showAdd || editingId) && (
        <div className="border border-indigo-200 dark:border-indigo-800 rounded-xl p-4 bg-indigo-50 dark:bg-indigo-900/20">
          <h4 className="text-sm font-medium text-indigo-700 dark:text-indigo-400 mb-3">
            {editingId ? 'Editar Operador' : 'Nuevo Operador'}
          </h4>
          <div className="space-y-3">
            <input
              type="text"
              value={formNombre}
              onChange={(e) => setFormNombre(e.target.value)}
              placeholder="Nombre del operador"
              className="w-full px-3 py-2 bg-white dark:bg-navy-800 border border-slate-300 dark:border-navy-600 rounded-lg text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div>
              <p className="text-xs text-slate-500 mb-1">Avatar:</p>
              <div className="flex flex-wrap gap-1">
                {ICON_OPTIONS.map(icon => (
                  <button
                    key={icon}
                    onClick={() => setFormIcono(icon)}
                    className={`w-8 h-8 rounded-lg text-lg flex items-center justify-center ${
                      formIcono === icon ? 'bg-indigo-200 dark:bg-indigo-800 ring-2 ring-indigo-500' : 'hover:bg-slate-200 dark:hover:bg-navy-600'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Palette className="w-3 h-3" /> Color:</p>
              <div className="flex flex-wrap gap-1">
                {COLOR_OPTIONS.map(color => (
                  <button
                    key={color}
                    onClick={() => setFormColor(color)}
                    className={`w-7 h-7 rounded-full border-2 ${
                      formColor === color ? 'border-white ring-2 ring-indigo-500' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setShowAdd(false); setEditingId(null); }}
                className="flex-1 px-3 py-2 border border-slate-300 dark:border-navy-600 text-slate-600 dark:text-slate-400 rounded-lg text-sm hover:bg-slate-100 dark:hover:bg-navy-700"
              >
                Cancelar
              </button>
              <button
                onClick={() => editingId ? handleUpdate(editingId) : handleAdd()}
                disabled={!formNombre.trim()}
                className="flex-1 px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                {editingId ? 'Guardar' : 'Agregar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OperadorManager;
