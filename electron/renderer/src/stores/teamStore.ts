/**
 * teamStore — Zustand store con los operadores de Litper.
 *
 * Seed inicial con los 7 operadores actuales. Permite agregar más
 * con `addUser()`. La asignación de color es automática y no se repite
 * mientras haya colores disponibles en TEAM_COLOR_PALETTE.
 *
 * En Fase 2 esto se sincronizará con Supabase (`team.users` table)
 * via Realtime. Por ahora es solo local + persistencia en localStorage.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TEAM_COLOR_PALETTE } from '../theme/tokens';

export type Role = 'admin' | 'supervisor' | 'operator';

export interface User {
  id: string;
  name: string;
  role: Role;
  color: string;
  initials: string;
  active: boolean;
  createdAt: string;
}

interface TeamState {
  users: User[];
  activeUserId: string | null;
  addUser: (input: { name: string; role: Role }) => User;
  removeUser: (id: string) => void;
  updateUser: (id: string, patch: Partial<User>) => void;
  setActive: (id: string) => void;
}

const SEED_USERS: User[] = [
  { id: 'jefer',    name: 'Jefer',    role: 'admin',      color: TEAM_COLOR_PALETTE[0], initials: 'JF', active: true, createdAt: '2026-05-09' },
  { id: 'catalina', name: 'Catalina', role: 'admin',      color: TEAM_COLOR_PALETTE[1], initials: 'CT', active: true, createdAt: '2026-05-09' },
  { id: 'jimmy',    name: 'Jimmy',    role: 'supervisor', color: TEAM_COLOR_PALETTE[2], initials: 'JM', active: true, createdAt: '2026-05-09' },
  { id: 'felipe',   name: 'Felipe',   role: 'operator',   color: TEAM_COLOR_PALETTE[3], initials: 'FL', active: true, createdAt: '2026-05-09' },
  { id: 'angie',    name: 'Angie',    role: 'operator',   color: TEAM_COLOR_PALETTE[4], initials: 'AN', active: true, createdAt: '2026-05-09' },
  { id: 'karen',    name: 'Karen',    role: 'operator',   color: TEAM_COLOR_PALETTE[5], initials: 'KR', active: true, createdAt: '2026-05-09' },
  { id: 'erika',    name: 'Erika',    role: 'operator',   color: TEAM_COLOR_PALETTE[6], initials: 'ER', active: true, createdAt: '2026-05-09' },
];

function pickNextColor(existingColors: Set<string>): string {
  for (const c of TEAM_COLOR_PALETTE) {
    if (!existingColors.has(c)) return c;
  }
  // Si todos los 16 colores ya están usados, volvemos a empezar.
  return TEAM_COLOR_PALETTE[existingColors.size % TEAM_COLOR_PALETTE.length];
}

function makeInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function makeId(name: string, existing: Set<string>): string {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'user';
  if (!existing.has(base)) return base;
  let n = 2;
  while (existing.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

export const useTeamStore = create<TeamState>()(
  persist(
    (set, get) => ({
      users: SEED_USERS,
      activeUserId: SEED_USERS[0].id,

      addUser: ({ name, role }) => {
        const state = get();
        const colors = new Set(state.users.map((u) => u.color));
        const ids = new Set(state.users.map((u) => u.id));
        const newUser: User = {
          id: makeId(name, ids),
          name: name.trim(),
          role,
          color: pickNextColor(colors),
          initials: makeInitials(name),
          active: true,
          createdAt: new Date().toISOString().slice(0, 10),
        };
        set({ users: [...state.users, newUser] });
        return newUser;
      },

      removeUser: (id) => {
        set((s) => {
          const filtered = s.users.filter((u) => u.id !== id);
          const newActive = s.activeUserId === id
            ? (filtered[0]?.id ?? null)
            : s.activeUserId;
          return { users: filtered, activeUserId: newActive };
        });
      },

      updateUser: (id, patch) => {
        set((s) => ({
          users: s.users.map((u) => (u.id === id ? { ...u, ...patch } : u)),
        }));
      },

      setActive: (id) => set({ activeUserId: id }),
    }),
    {
      name: 'litper-desk:team',
      version: 1,
    },
  ),
);
