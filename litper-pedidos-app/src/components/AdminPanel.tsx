import React, { useState } from 'react';
import { UserPlus, Trash2, Edit2, Check, Crown, User, Save } from 'lucide-react';
import { useAppStore, COLORES_USUARIO, AVATARES, Usuario } from '../stores/appStore';

interface UserFormData {
  nombre: string;
  avatar: string;
  color: string;
  metaDiaria: number;
  rol: 'usuario' | 'admin';
}

const defaultFormData: UserFormData = {
  nombre: '',
  avatar: '😊',
  color: 'orange',
  metaDiaria: 50,
  rol: 'usuario',
};

const AdminPanel: React.FC = () => {
  const { usuarios, agregarUsuario, actualizarUsuario, eliminarUsuario } = useAppStore();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<UserFormData>(defaultFormData);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const getColorHex = (colorId: string) =>
    COLORES_USUARIO.find((c) => c.id === colorId)?.hex || '#F97316';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre.trim()) return;

    if (editingId) {
      actualizarUsuario(editingId, formData);
    } else {
      agregarUsuario(formData);
    }

    setShowForm(false);
    setEditingId(null);
    setFormData(defaultFormData);
  };

  const handleEdit = (usuario: Usuario) => {
    setFormData({
      nombre: usuario.nombre,
      avatar: usuario.avatar,
      color: usuario.color,
      metaDiaria: usuario.metaDiaria,
      rol: usuario.rol,
    });
    setEditingId(usuario.id);
    setShowForm(true);
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

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(defaultFormData);
  };

  return (
    <div className="px-4 py-3 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Crown className="w-4 h-4 text-primary-400" />
          Panel Admin
        </h3>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1 px-2 py-1 bg-primary-500 text-white rounded-lg text-xs hover:bg-primary-600 transition-colors no-drag"
          >
            <UserPlus className="w-3 h-3" />
            Nuevo
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card space-y-3 animate-fade-in">
          {/* Nombre */}
          <div>
            <label className="block text-xs text-dark-400 mb-1">Nombre</label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent no-drag"
              placeholder="Nombre del usuario"
              required
            />
          </div>

          {/* Avatar */}
          <div>
            <label className="block text-xs text-dark-400 mb-1">Avatar</label>
            <div className="flex flex-wrap gap-1.5">
              {AVATARES.map((avatar) => (
                <button
                  key={avatar}
                  type="button"
                  onClick={() => setFormData({ ...formData, avatar })}
                  className={`w-8 h-8 rounded-lg text-base flex items-center justify-center transition-all no-drag ${
                    formData.avatar === avatar
                      ? 'bg-primary-500 scale-110 ring-2 ring-primary-400'
                      : 'bg-dark-700 hover:bg-dark-600'
                  }`}
                >
                  {avatar}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="block text-xs text-dark-400 mb-1">Color</label>
            <div className="flex flex-wrap gap-1.5">
              {COLORES_USUARIO.map((color) => (
                <button
                  key={color.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: color.id })}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all no-drag ${
                    formData.color === color.id ? 'ring-2 ring-white scale-110' : ''
                  }`}
                  style={{ backgroundColor: color.hex }}
                >
                  {formData.color === color.id && <Check className="w-4 h-4 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Meta y Rol */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-dark-400 mb-1">Meta diaria</label>
              <input
                type="number"
                value={formData.metaDiaria}
                onChange={(e) => setFormData({ ...formData, metaDiaria: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white text-sm no-drag"
                min="1"
                max="500"
              />
            </div>
            <div>
              <label className="block text-xs text-dark-400 mb-1">Rol</label>
              <select
                value={formData.rol}
                onChange={(e) => setFormData({ ...formData, rol: e.target.value as 'usuario' | 'admin' })}
                className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white text-sm no-drag"
              >
                <option value="usuario">Usuario</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 py-2 bg-dark-700 text-dark-300 rounded-lg text-sm hover:bg-dark-600 transition-colors no-drag"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2 bg-primary-500 text-white rounded-lg text-sm hover:bg-primary-600 transition-colors flex items-center justify-center gap-1 no-drag"
            >
              <Save className="w-3.5 h-3.5" />
              {editingId ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </form>
      )}

      {/* Users List */}
      <div className="space-y-2">
        {usuarios.map((usuario) => {
          const colorHex = getColorHex(usuario.color);

          return (
            <div
              key={usuario.id}
              className="card flex items-center gap-3 py-2.5"
            >
              {/* Avatar */}
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
                style={{ backgroundColor: `${colorHex}30` }}
              >
                {usuario.avatar}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-white truncate">{usuario.nombre}</p>
                  {usuario.rol === 'admin' && (
                    <Crown className="w-3 h-3 text-primary-400 flex-shrink-0" />
                  )}
                </div>
                <p className="text-xs text-dark-400">Meta: {usuario.metaDiaria}</p>
              </div>

              {/* Actions */}
              <div className="flex gap-1 no-drag">
                <button
                  onClick={() => handleEdit(usuario)}
                  className="p-1.5 rounded-md bg-dark-700 text-dark-300 hover:text-white hover:bg-dark-600 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(usuario.id)}
                  className={`p-1.5 rounded-md transition-colors ${
                    confirmDelete === usuario.id
                      ? 'bg-accent-red text-white'
                      : 'bg-dark-700 text-dark-300 hover:text-accent-red hover:bg-accent-red/20'
                  }`}
                >
                  {confirmDelete === usuario.id ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          );
        })}

        {usuarios.length === 0 && (
          <div className="text-center py-6 text-dark-500">
            <User className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No hay usuarios</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
