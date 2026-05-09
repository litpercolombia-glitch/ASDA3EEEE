import { useState } from 'react';
import { ChevronDown, Plus, X, Shield, Crown } from 'lucide-react';
import { useTeamStore, type Role } from '../stores/teamStore';

const ROLE_ICON: Record<Role, React.ComponentType<{ size?: number; className?: string }>> = {
  admin: Crown,
  supervisor: Shield,
  operator: () => null as unknown as React.ReactElement,
};

const ROLE_LABEL: Record<Role, string> = {
  admin: 'Admin',
  supervisor: 'Supervisor',
  operator: 'Operador',
};

export function TeamPicker() {
  const { users, activeUserId, setActive, addUser, removeUser } = useTeamStore();
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<Role>('operator');

  const active = users.find((u) => u.id === activeUserId) ?? users[0];
  if (!active) return null;

  function submitNew() {
    if (!newName.trim()) return;
    const u = addUser({ name: newName.trim(), role: newRole });
    setActive(u.id);
    setNewName('');
    setNewRole('operator');
    setAdding(false);
    setOpen(false);
  }

  return (
    <div className="relative app-no-drag">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-2 py-1 rounded-lg
                   hover:bg-litper-navy-800/60 transition-colors"
        aria-label="Cambiar operador"
      >
        <Avatar user={active} />
        <div className="flex flex-col items-start leading-tight">
          <span className="text-xs text-litper-cream font-medium">{active.name}</span>
          <span className="text-[10px] text-litper-cream-muted">{ROLE_LABEL[active.role]}</span>
        </div>
        <ChevronDown size={14} className="text-litper-cream-muted" />
      </button>

      {open && (
        <div
          className="absolute left-0 top-full mt-1 w-64 z-50
                     halo-panel py-2 max-h-80 overflow-y-auto"
        >
          <div className="px-3 pb-1 text-[10px] uppercase tracking-wider text-litper-cream-muted">
            Equipo Litper
          </div>
          {users.map((u) => {
            const Icon = ROLE_ICON[u.role];
            return (
              <button
                key={u.id}
                type="button"
                onClick={() => {
                  setActive(u.id);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-1.5
                            hover:bg-litper-navy-800
                            ${u.id === active.id ? 'bg-litper-navy-800/70' : ''}`}
              >
                <Avatar user={u} size={28} />
                <div className="flex-1 text-left">
                  <div className="text-sm text-litper-cream">{u.name}</div>
                  <div className="text-[10px] text-litper-cream-muted flex items-center gap-1">
                    {Icon && <Icon size={10} className="text-litper-gold-500" />}
                    {ROLE_LABEL[u.role]}
                  </div>
                </div>
                {users.length > 1 && u.id !== active.id && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`¿Eliminar a ${u.name}?`)) removeUser(u.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded
                               text-litper-cream-muted hover:text-litper-red-500"
                    aria-label={`Eliminar ${u.name}`}
                  >
                    <X size={12} />
                  </button>
                )}
              </button>
            );
          })}

          <div className="border-t border-litper-gold-500/10 mt-1 pt-1">
            {!adding ? (
              <button
                type="button"
                onClick={() => setAdding(true)}
                className="w-full flex items-center gap-2 px-3 py-1.5
                           text-litper-gold-500 hover:bg-litper-navy-800"
              >
                <Plus size={14} />
                <span className="text-sm">Agregar operador</span>
              </button>
            ) : (
              <div className="px-3 py-2 space-y-2">
                <input
                  autoFocus
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && submitNew()}
                  placeholder="Nombre"
                  className="w-full px-2 py-1 text-sm bg-litper-navy-800
                             border border-litper-gold-500/20 rounded
                             text-litper-cream
                             focus:outline-none focus:border-litper-gold-500"
                />
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as Role)}
                  className="w-full px-2 py-1 text-sm bg-litper-navy-800
                             border border-litper-gold-500/20 rounded
                             text-litper-cream
                             focus:outline-none focus:border-litper-gold-500"
                >
                  <option value="operator">Operador</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="admin">Admin</option>
                </select>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={submitNew}
                    disabled={!newName.trim()}
                    className="flex-1 gold-btn px-2 py-1 text-xs disabled:opacity-40"
                  >
                    Agregar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAdding(false);
                      setNewName('');
                    }}
                    className="ghost-btn px-2 py-1 text-xs"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Avatar({ user, size = 32 }: { user: { name: string; color: string; initials: string }; size?: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-full font-mono font-bold
                 text-[11px] text-litper-navy-950 shrink-0"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${user.color}, ${user.color}cc)`,
        boxShadow: `0 0 0 2px ${user.color}33`,
      }}
      title={user.name}
    >
      {user.initials}
    </div>
  );
}
