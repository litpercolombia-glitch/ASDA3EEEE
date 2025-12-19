// components/UserManager.tsx
// Panel de administración de usuarios

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';

interface User {
  id: string;
  email: string;
  nombre: string;
  rol: 'admin' | 'operador' | 'viewer';
  avatar?: string;
  activo: boolean;
  createdAt: string;
  lastLogin?: string;
}

interface UserManagerProps {
  onUserSelect?: (user: User) => void;
}

export const UserManager: React.FC<UserManagerProps> = ({ onUserSelect }) => {
  const { user: currentUser, isAdmin } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({
    email: '',
    nombre: '',
    password: '',
    rol: 'operador' as User['rol'],
  });
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);

  // Cargar usuarios
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    try {
      const data = localStorage.getItem('litper_users');
      if (data) {
        const usersData = JSON.parse(data);
        const usersList = Object.values(usersData) as User[];
        setUsers(usersList.sort((a, b) => a.nombre.localeCompare(b.nombre)));
      }
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    }
  };

  const handleAddUser = () => {
    if (!newUser.email || !newUser.nombre || !newUser.password) {
      setMensaje({ tipo: 'error', texto: 'Todos los campos son requeridos' });
      return;
    }

    // Verificar email único
    if (users.some(u => u.email.toLowerCase() === newUser.email.toLowerCase())) {
      setMensaje({ tipo: 'error', texto: 'Ya existe un usuario con ese email' });
      return;
    }

    const user: User = {
      id: `user_${Date.now()}`,
      email: newUser.email.toLowerCase(),
      nombre: newUser.nombre,
      rol: newUser.rol,
      activo: true,
      createdAt: new Date().toISOString(),
    };

    // Guardar
    const data = localStorage.getItem('litper_users') || '{}';
    const usersData = JSON.parse(data);
    usersData[user.email] = { ...user, password: newUser.password };
    localStorage.setItem('litper_users', JSON.stringify(usersData));

    setMensaje({ tipo: 'success', texto: `Usuario ${user.nombre} creado exitosamente` });
    setNewUser({ email: '', nombre: '', password: '', rol: 'operador' });
    setShowAddUser(false);
    loadUsers();
  };

  const handleToggleActivo = (user: User) => {
    if (user.email === currentUser?.email) {
      setMensaje({ tipo: 'error', texto: 'No puedes desactivarte a ti mismo' });
      return;
    }

    const data = localStorage.getItem('litper_users') || '{}';
    const usersData = JSON.parse(data);

    if (usersData[user.email]) {
      usersData[user.email].activo = !usersData[user.email].activo;
      localStorage.setItem('litper_users', JSON.stringify(usersData));
      loadUsers();
      setMensaje({
        tipo: 'success',
        texto: `Usuario ${user.nombre} ${usersData[user.email].activo ? 'activado' : 'desactivado'}`,
      });
    }
  };

  const handleChangeRole = (user: User, newRole: User['rol']) => {
    if (user.email === currentUser?.email) {
      setMensaje({ tipo: 'error', texto: 'No puedes cambiar tu propio rol' });
      return;
    }

    const data = localStorage.getItem('litper_users') || '{}';
    const usersData = JSON.parse(data);

    if (usersData[user.email]) {
      usersData[user.email].rol = newRole;
      localStorage.setItem('litper_users', JSON.stringify(usersData));
      loadUsers();
      setMensaje({ tipo: 'success', texto: `Rol de ${user.nombre} cambiado a ${newRole}` });
    }
  };

  const handleDeleteUser = (user: User) => {
    if (user.email === currentUser?.email) {
      setMensaje({ tipo: 'error', texto: 'No puedes eliminarte a ti mismo' });
      return;
    }

    if (!confirm(`¿Eliminar al usuario ${user.nombre}?`)) return;

    const data = localStorage.getItem('litper_users') || '{}';
    const usersData = JSON.parse(data);
    delete usersData[user.email];
    localStorage.setItem('litper_users', JSON.stringify(usersData));

    loadUsers();
    setMensaje({ tipo: 'success', texto: `Usuario ${user.nombre} eliminado` });
  };

  const getRolColor = (rol: User['rol']): string => {
    switch (rol) {
      case 'admin':
        return '#ef4444';
      case 'operador':
        return '#3b82f6';
      case 'viewer':
        return '#22c55e';
      default:
        return '#64748b';
    }
  };

  const getRolIcon = (rol: User['rol']): string => {
    switch (rol) {
      case 'admin':
        return '👑';
      case 'operador':
        return '👷';
      case 'viewer':
        return '👁️';
      default:
        return '👤';
    }
  };

  if (!isAdmin()) {
    return (
      <div className="user-manager-restricted">
        <span>🔒</span>
        <p>Solo los administradores pueden gestionar usuarios</p>
      </div>
    );
  }

  return (
    <div className="user-manager">
      <div className="manager-header">
        <h2>👥 Gestión de Usuarios</h2>
        <button className="btn-add" onClick={() => setShowAddUser(true)}>
          ➕ Agregar Usuario
        </button>
      </div>

      {/* Mensaje */}
      {mensaje && (
        <div className={`mensaje ${mensaje.tipo}`}>
          {mensaje.texto}
          <button onClick={() => setMensaje(null)}>✕</button>
        </div>
      )}

      {/* Formulario de nuevo usuario */}
      {showAddUser && (
        <div className="add-user-form">
          <h3>Nuevo Usuario</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Nombre</label>
              <input
                type="text"
                placeholder="Nombre completo"
                value={newUser.nombre}
                onChange={(e) => setNewUser({ ...newUser, nombre: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                placeholder="email@empresa.com"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Contraseña</label>
              <input
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Rol</label>
              <select
                value={newUser.rol}
                onChange={(e) => setNewUser({ ...newUser, rol: e.target.value as User['rol'] })}
              >
                <option value="viewer">👁️ Viewer - Solo ver</option>
                <option value="operador">👷 Operador - Cargar y ver</option>
                <option value="admin">👑 Admin - Todo</option>
              </select>
            </div>
          </div>
          <div className="form-actions">
            <button className="btn-cancel" onClick={() => setShowAddUser(false)}>
              Cancelar
            </button>
            <button className="btn-save" onClick={handleAddUser}>
              Crear Usuario
            </button>
          </div>
        </div>
      )}

      {/* Permisos por rol */}
      <div className="roles-info">
        <div className="rol-card">
          <span className="rol-icon">👑</span>
          <span className="rol-name">Admin</span>
          <span className="rol-permisos">Todo: cargar, editar, eliminar, usuarios</span>
        </div>
        <div className="rol-card">
          <span className="rol-icon">👷</span>
          <span className="rol-name">Operador</span>
          <span className="rol-permisos">Cargar guías, ver todas las cargas</span>
        </div>
        <div className="rol-card">
          <span className="rol-icon">👁️</span>
          <span className="rol-name">Viewer</span>
          <span className="rol-permisos">Solo ver guías y reportes</span>
        </div>
      </div>

      {/* Lista de usuarios */}
      <div className="users-list">
        {users.map((user) => (
          <div
            key={user.id}
            className={`user-card ${!user.activo ? 'inactivo' : ''} ${
              user.email === currentUser?.email ? 'current' : ''
            }`}
          >
            <div className="user-avatar">
              {user.avatar ? (
                <img src={user.avatar} alt={user.nombre} />
              ) : (
                <span>{user.nombre.charAt(0).toUpperCase()}</span>
              )}
            </div>

            <div className="user-info">
              <div className="user-name">
                {user.nombre}
                {user.email === currentUser?.email && (
                  <span className="tag-tu">(Tú)</span>
                )}
              </div>
              <div className="user-email">{user.email}</div>
              <div className="user-meta">
                <span
                  className="user-rol"
                  style={{ backgroundColor: getRolColor(user.rol) }}
                >
                  {getRolIcon(user.rol)} {user.rol}
                </span>
                <span className="user-status">
                  {user.activo ? '🟢 Activo' : '🔴 Inactivo'}
                </span>
              </div>
            </div>

            <div className="user-actions">
              {user.email !== currentUser?.email && (
                <>
                  <select
                    value={user.rol}
                    onChange={(e) => handleChangeRole(user, e.target.value as User['rol'])}
                    className="select-rol"
                  >
                    <option value="viewer">Viewer</option>
                    <option value="operador">Operador</option>
                    <option value="admin">Admin</option>
                  </select>

                  <button
                    className={`btn-toggle ${user.activo ? '' : 'activar'}`}
                    onClick={() => handleToggleActivo(user)}
                  >
                    {user.activo ? '🔒 Desactivar' : '🔓 Activar'}
                  </button>

                  <button
                    className="btn-delete"
                    onClick={() => handleDeleteUser(user)}
                  >
                    🗑️
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .user-manager {
          background: white;
          border-radius: 16px;
          padding: 1.5rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .user-manager-restricted {
          text-align: center;
          padding: 3rem;
          color: #64748b;
        }

        .user-manager-restricted span {
          font-size: 3rem;
          display: block;
          margin-bottom: 1rem;
        }

        .manager-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .manager-header h2 {
          margin: 0;
          font-size: 1.25rem;
          color: #1e293b;
        }

        .btn-add {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-size: 0.875rem;
          cursor: pointer;
        }

        .mensaje {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          margin-bottom: 1rem;
        }

        .mensaje.success {
          background: #dcfce7;
          color: #166534;
        }

        .mensaje.error {
          background: #fee2e2;
          color: #dc2626;
        }

        .mensaje button {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 1rem;
        }

        .add-user-form {
          background: #f8fafc;
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .add-user-form h3 {
          margin: 0 0 1rem 0;
          font-size: 1rem;
          color: #1e293b;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .form-group label {
          display: block;
          font-size: 0.75rem;
          font-weight: 600;
          color: #475569;
          margin-bottom: 0.375rem;
        }

        .form-group input,
        .form-group select {
          width: 100%;
          padding: 0.625rem;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          font-size: 0.875rem;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
        }

        .btn-cancel {
          background: #f1f5f9;
          color: #475569;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
        }

        .btn-save {
          background: #22c55e;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
        }

        .roles-info {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }

        .rol-card {
          background: #f8fafc;
          padding: 0.75rem;
          border-radius: 8px;
          text-align: center;
        }

        .rol-icon {
          font-size: 1.5rem;
          display: block;
        }

        .rol-name {
          display: block;
          font-weight: 600;
          font-size: 0.875rem;
          color: #1e293b;
          margin: 0.25rem 0;
        }

        .rol-permisos {
          font-size: 0.6875rem;
          color: #64748b;
        }

        .users-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .user-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: #f8fafc;
          border-radius: 12px;
          border: 1px solid transparent;
          transition: all 0.15s ease;
        }

        .user-card:hover {
          border-color: #e2e8f0;
        }

        .user-card.current {
          background: #eff6ff;
          border-color: #bfdbfe;
        }

        .user-card.inactivo {
          opacity: 0.6;
        }

        .user-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #6366f1);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
          font-size: 1.25rem;
          overflow: hidden;
        }

        .user-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .user-info {
          flex: 1;
        }

        .user-name {
          font-weight: 600;
          color: #1e293b;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .tag-tu {
          font-size: 0.6875rem;
          background: #3b82f6;
          color: white;
          padding: 0.125rem 0.375rem;
          border-radius: 4px;
          font-weight: normal;
        }

        .user-email {
          font-size: 0.8125rem;
          color: #64748b;
        }

        .user-meta {
          display: flex;
          gap: 0.5rem;
          margin-top: 0.375rem;
        }

        .user-rol {
          font-size: 0.6875rem;
          padding: 0.125rem 0.5rem;
          border-radius: 9999px;
          color: white;
        }

        .user-status {
          font-size: 0.6875rem;
          color: #64748b;
        }

        .user-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .select-rol {
          padding: 0.375rem 0.5rem;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          font-size: 0.75rem;
        }

        .btn-toggle {
          padding: 0.375rem 0.625rem;
          border: none;
          border-radius: 6px;
          font-size: 0.75rem;
          cursor: pointer;
          background: #fef3c7;
          color: #d97706;
        }

        .btn-toggle.activar {
          background: #dcfce7;
          color: #166534;
        }

        .btn-delete {
          padding: 0.375rem;
          background: #fee2e2;
          border: none;
          border-radius: 6px;
          cursor: pointer;
        }

        @media (max-width: 768px) {
          .form-grid {
            grid-template-columns: 1fr;
          }

          .roles-info {
            grid-template-columns: 1fr;
          }

          .user-card {
            flex-wrap: wrap;
          }

          .user-actions {
            width: 100%;
            justify-content: flex-end;
            margin-top: 0.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default UserManager;
