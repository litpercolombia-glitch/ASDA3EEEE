/**
 * USER MANAGER COMPONENT
 * Gestión de usuarios con colores y avatares
 */

import React, { useState } from 'react';
import { UserPlus, Trash2, Edit2, Check, X, Crown, User } from 'lucide-react';
import { useProcesosStore } from '../stores/procesosStore';
import { COLORES_DISPONIBLES, AVATARES_DISPONIBLES, SONIDOS_DISPONIBLES } from '../types';
import Modal from '../../../shared/modals/Modal';

interface UserFormData {
  nombre: string;
  avatar: string;
  color: string;
  sonido: string;
  metaDiaria: number;
  rol: 'usuario' | 'admin';
}

const initialFormData: UserFormData = {
  nombre: '',
  avatar: '😊',
  color: COLORES_DISPONIBLES[0].id,
  sonido: 'bell',
  metaDiaria: 50,
  rol: 'usuario',
};

const UserManager: React.FC = () => {
  const { usuarios, usuarioActual, agregarUsuario, eliminarUsuario, actualizarUsuario, seleccionarUsuario, vistaAdmin } = useProcesosStore();

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<UserFormData>(initialFormData);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const getColorHex = (colorId: string) => {
    return COLORES_DISPONIBLES.find(c => c.id === colorId)?.hex || '#8B5CF6';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre.trim()) return;

    if (editingId) {
      actualizarUsuario(editingId, formData);
    } else {
      agregarUsuario(formData);
    }

    setShowModal(false);
    setEditingId(null);
    setFormData(initialFormData);
  };

  const handleEdit = (usuario: typeof usuarios[0]) => {
    setFormData({
      nombre: usuario.nombre,
      avatar: usuario.avatar,
      color: usuario.color,
      sonido: usuario.sonido,
      metaDiaria: usuario.metaDiaria,
      rol: usuario.rol,
    });
    setEditingId(usuario.id);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirmDelete === id) {
      eliminarUsuario(id);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <User className="w-5 h-5 text-amber-400" />
          Usuarios
        </h3>
        {vistaAdmin && (
          <button
            onClick={() => {
              setFormData(initialFormData);
              setEditingId(null);
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-3 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-sm"
          >
            <UserPlus className="w-4 h-4" />
            Agregar
          </button>
        )}
      </div>

      {/* User Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {usuarios.map((usuario) => {
          const isSelected = usuarioActual?.id === usuario.id;
          const colorHex = getColorHex(usuario.color);

          return (
            <div
              key={usuario.id}
              onClick={() => seleccionarUsuario(usuario.id)}
              className={`
                relative p-4 rounded-xl cursor-pointer transition-all duration-200
                ${isSelected
                  ? 'ring-2 ring-offset-2 ring-offset-slate-900 scale-105'
                  : 'hover:scale-102 hover:bg-slate-700/50'
                }
                bg-slate-800 border border-slate-700/50
              `}
              style={{
                borderColor: isSelected ? colorHex : undefined,
                boxShadow: isSelected ? `0 0 20px ${colorHex}40` : undefined,
              }}
            >
              {/* Admin Badge */}
              {usuario.rol === 'admin' && (
                <div className="absolute -top-2 -right-2 bg-amber-500 rounded-full p-1">
                  <Crown className="w-3 h-3 text-white" />
                </div>
              )}

              {/* Avatar */}
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-2xl mx-auto mb-2"
                style={{ backgroundColor: `${colorHex}30` }}
              >
                {usuario.avatar}
              </div>

              {/* Name */}
              <p className="text-center text-white font-medium truncate">{usuario.nombre}</p>

              {/* Meta */}
              <p className="text-center text-xs text-slate-400">Meta: {usuario.metaDiaria}</p>

              {/* Actions (Admin only) */}
              {vistaAdmin && (
                <div className="absolute top-2 right-2 flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(usuario);
                    }}
                    className="p-1.5 bg-slate-700/80 rounded-lg hover:bg-blue-500 transition-colors"
                    title="Editar"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-slate-300" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(usuario.id);
                    }}
                    className={`p-1.5 rounded-lg transition-colors ${
                      confirmDelete === usuario.id
                        ? 'bg-red-500 text-white animate-pulse'
                        : 'bg-slate-700/80 hover:bg-red-500 text-slate-300'
                    }`}
                    title={confirmDelete === usuario.id ? 'Click para confirmar' : 'Eliminar'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Selected indicator */}
              {isSelected && (
                <div
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full"
                  style={{ backgroundColor: colorHex }}
                />
              )}
            </div>
          );
        })}

        {/* Empty state */}
        {usuarios.length === 0 && (
          <div className="col-span-full text-center py-8 text-slate-500">
            <User className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No hay usuarios</p>
            {vistaAdmin && <p className="text-sm">Haz clic en "Agregar" para crear uno</p>}
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingId(null);
          setFormData(initialFormData);
        }}
        title={editingId ? 'Editar Usuario' : 'Nuevo Usuario'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Nombre</label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="Nombre del usuario"
              required
            />
          </div>

          {/* Avatar */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Avatar</label>
            <div className="flex flex-wrap gap-2">
              {AVATARES_DISPONIBLES.map((avatar) => (
                <button
                  key={avatar}
                  type="button"
                  onClick={() => setFormData({ ...formData, avatar })}
                  className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${
                    formData.avatar === avatar
                      ? 'bg-amber-500 scale-110'
                      : 'bg-slate-700 hover:bg-slate-600'
                  }`}
                >
                  {avatar}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Color</label>
            <div className="flex flex-wrap gap-2">
              {COLORES_DISPONIBLES.map((color) => (
                <button
                  key={color.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: color.id })}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                    formData.color === color.id ? 'ring-2 ring-white scale-110' : ''
                  }`}
                  style={{ backgroundColor: color.hex }}
                >
                  {formData.color === color.id && <Check className="w-5 h-5 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Sonido */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Sonido de alerta</label>
            <div className="flex flex-wrap gap-2">
              {SONIDOS_DISPONIBLES.map((sonido) => (
                <button
                  key={sonido.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, sonido: sonido.id })}
                  className={`px-3 py-2 rounded-lg text-sm flex items-center gap-1 transition-all ${
                    formData.sonido === sonido.id
                      ? 'bg-amber-500 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  <span>{sonido.emoji}</span>
                  <span>{sonido.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Meta Diaria */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Meta Diaria</label>
            <input
              type="number"
              value={formData.metaDiaria}
              onChange={(e) => setFormData({ ...formData, metaDiaria: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              min="1"
              max="500"
            />
          </div>

          {/* Rol */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Rol</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, rol: 'usuario' })}
                className={`flex-1 py-2 rounded-lg text-sm flex items-center justify-center gap-2 transition-all ${
                  formData.rol === 'usuario'
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                <User className="w-4 h-4" />
                Usuario
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, rol: 'admin' })}
                className={`flex-1 py-2 rounded-lg text-sm flex items-center justify-center gap-2 transition-all ${
                  formData.rol === 'admin'
                    ? 'bg-amber-500 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                <Crown className="w-4 h-4" />
                Admin
              </button>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowModal(false);
                setEditingId(null);
                setFormData(initialFormData);
              }}
              className="flex-1 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
            >
              {editingId ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UserManager;
