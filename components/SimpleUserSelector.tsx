// components/SimpleUserSelector.tsx
// Selector simple de usuarios con crear/eliminar

import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  ChevronDown,
  Plus,
  Trash2,
  Check,
  X,
  Users,
  UserPlus,
} from 'lucide-react';
import {
  SimpleUser,
  obtenerUsuarios,
  crearUsuario,
  eliminarUsuario,
  setUsuarioActual,
  getUsuarioActual,
  getOCrearUsuarioDefault,
} from '../services/simpleUserService';

interface SimpleUserSelectorProps {
  onUserChange?: (user: SimpleUser) => void;
  compact?: boolean;
}

export const SimpleUserSelector: React.FC<SimpleUserSelectorProps> = ({
  onUserChange,
  compact = false,
}) => {
  const [usuarios, setUsuarios] = useState<SimpleUser[]>([]);
  const [usuarioActual, setUsuarioActualState] = useState<SimpleUser | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [showCrear, setShowCrear] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cargar usuarios al montar
  useEffect(() => {
    cargarUsuarios();
  }, []);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowCrear(false);
        setConfirmDelete(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus en input al mostrar crear
  useEffect(() => {
    if (showCrear && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showCrear]);

  const cargarUsuarios = () => {
    const lista = obtenerUsuarios();
    setUsuarios(lista);

    // Obtener o crear usuario actual
    const actual = getOCrearUsuarioDefault();
    setUsuarioActualState(actual);
    onUserChange?.(actual);

    // Recargar lista por si se creó uno nuevo
    setUsuarios(obtenerUsuarios());
  };

  const handleSeleccionarUsuario = (user: SimpleUser) => {
    setUsuarioActual(user.id);
    setUsuarioActualState(user);
    onUserChange?.(user);
    setIsOpen(false);
  };

  const handleCrearUsuario = () => {
    if (!nuevoNombre.trim()) return;

    const nuevo = crearUsuario(nuevoNombre.trim());
    setUsuarios(obtenerUsuarios());
    setUsuarioActualState(nuevo);
    onUserChange?.(nuevo);
    setNuevoNombre('');
    setShowCrear(false);
    setIsOpen(false);
  };

  const handleEliminarUsuario = (userId: string) => {
    if (confirmDelete === userId) {
      eliminarUsuario(userId);
      const lista = obtenerUsuarios();
      setUsuarios(lista);
      setConfirmDelete(null);

      // Si eliminamos el usuario actual, seleccionar otro
      if (usuarioActual?.id === userId) {
        const nuevo = getOCrearUsuarioDefault();
        setUsuarioActualState(nuevo);
        onUserChange?.(nuevo);
        setUsuarios(obtenerUsuarios());
      }
    } else {
      setConfirmDelete(userId);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCrearUsuario();
    } else if (e.key === 'Escape') {
      setShowCrear(false);
      setNuevoNombre('');
    }
  };

  if (compact) {
    return (
      <div ref={dropdownRef} className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-navy-800 rounded-lg hover:bg-slate-200 dark:hover:bg-navy-700 transition-colors"
        >
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
            style={{ backgroundColor: usuarioActual?.color || '#6b7280' }}
          >
            {usuarioActual?.nombre?.charAt(0).toUpperCase() || '?'}
          </div>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300 max-w-[100px] truncate">
            {usuarioActual?.nombre || 'Usuario'}
          </span>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-navy-900 rounded-xl shadow-xl border border-slate-200 dark:border-navy-700 z-50 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 bg-slate-50 dark:bg-navy-950 border-b border-slate-200 dark:border-navy-700">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Usuarios ({usuarios.length})
                </span>
                <button
                  onClick={() => setShowCrear(true)}
                  className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors"
                  title="Crear nuevo usuario"
                >
                  <UserPlus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Crear nuevo usuario */}
            {showCrear && (
              <div className="p-3 border-b border-slate-200 dark:border-navy-700 bg-emerald-50 dark:bg-emerald-900/20">
                <div className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={nuevoNombre}
                    onChange={(e) => setNuevoNombre(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Nombre del usuario..."
                    className="flex-1 px-3 py-2 text-sm bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    maxLength={30}
                  />
                  <button
                    onClick={handleCrearUsuario}
                    disabled={!nuevoNombre.trim()}
                    className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setShowCrear(false);
                      setNuevoNombre('');
                    }}
                    className="p-2 bg-slate-200 dark:bg-navy-700 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-300 dark:hover:bg-navy-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Lista de usuarios */}
            <div className="max-h-[250px] overflow-y-auto">
              {usuarios.map((user) => (
                <div
                  key={user.id}
                  className={`flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-navy-800 transition-colors ${
                    usuarioActual?.id === user.id ? 'bg-cyan-50 dark:bg-cyan-900/20' : ''
                  }`}
                >
                  <button
                    onClick={() => handleSeleccionarUsuario(user)}
                    className="flex items-center gap-3 flex-1"
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                      style={{ backgroundColor: user.color }}
                    >
                      {user.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {user.nombre}
                      </p>
                      <p className="text-xs text-slate-400">
                        {new Date(user.ultimoAcceso).toLocaleDateString('es-CO')}
                      </p>
                    </div>
                    {usuarioActual?.id === user.id && (
                      <Check className="w-4 h-4 text-cyan-500 ml-auto" />
                    )}
                  </button>

                  {/* Botón eliminar */}
                  {usuarios.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEliminarUsuario(user.id);
                      }}
                      className={`ml-2 p-1.5 rounded-lg transition-colors ${
                        confirmDelete === user.id
                          ? 'bg-red-500 text-white'
                          : 'text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                      }`}
                      title={confirmDelete === user.id ? 'Confirmar eliminar' : 'Eliminar usuario'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}

              {usuarios.length === 0 && (
                <div className="px-4 py-6 text-center text-slate-400 text-sm">
                  No hay usuarios creados
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Versión completa (no compacta)
  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2.5 bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl hover:border-cyan-500 transition-colors"
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
          style={{ backgroundColor: usuarioActual?.color || '#6b7280' }}
        >
          {usuarioActual?.nombre?.charAt(0).toUpperCase() || '?'}
        </div>
        <div className="text-left">
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
            {usuarioActual?.nombre || 'Seleccionar Usuario'}
          </p>
          <p className="text-xs text-slate-400">Operador activo</p>
        </div>
        <ChevronDown className={`w-5 h-5 text-slate-400 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-72 bg-white dark:bg-navy-900 rounded-xl shadow-xl border border-slate-200 dark:border-navy-700 z-50 overflow-hidden">
          {/* Contenido igual que versión compacta */}
          <div className="px-4 py-3 bg-slate-50 dark:bg-navy-950 border-b border-slate-200 dark:border-navy-700">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Usuarios ({usuarios.length})
              </span>
              <button
                onClick={() => setShowCrear(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white text-xs font-bold rounded-lg hover:bg-emerald-600 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Nuevo
              </button>
            </div>
          </div>

          {showCrear && (
            <div className="p-3 border-b border-slate-200 dark:border-navy-700 bg-emerald-50 dark:bg-emerald-900/20">
              <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 mb-2">
                Ingresa el nombre del nuevo usuario:
              </p>
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Ej: Juan Pérez"
                  className="flex-1 px-3 py-2 text-sm bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  maxLength={30}
                />
                <button
                  onClick={handleCrearUsuario}
                  disabled={!nuevoNombre.trim()}
                  className="px-3 py-2 bg-emerald-500 text-white text-sm font-bold rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Crear
                </button>
              </div>
            </div>
          )}

          <div className="max-h-[300px] overflow-y-auto">
            {usuarios.map((user) => (
              <div
                key={user.id}
                className={`flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-navy-800 transition-colors cursor-pointer ${
                  usuarioActual?.id === user.id ? 'bg-cyan-50 dark:bg-cyan-900/20 border-l-4 border-cyan-500' : ''
                }`}
                onClick={() => handleSeleccionarUsuario(user)}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: user.color }}
                  >
                    {user.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-slate-700 dark:text-slate-300">
                      {user.nombre}
                    </p>
                    <p className="text-xs text-slate-400">
                      Último acceso: {new Date(user.ultimoAcceso).toLocaleString('es-CO', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {usuarioActual?.id === user.id && (
                    <span className="px-2 py-1 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 text-xs font-bold rounded-lg">
                      Activo
                    </span>
                  )}
                  {usuarios.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEliminarUsuario(user.id);
                      }}
                      className={`p-2 rounded-lg transition-colors ${
                        confirmDelete === user.id
                          ? 'bg-red-500 text-white'
                          : 'text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                      }`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleUserSelector;
