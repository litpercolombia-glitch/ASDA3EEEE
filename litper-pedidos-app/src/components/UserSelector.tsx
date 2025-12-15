import React from 'react';
import { User, ChevronDown } from 'lucide-react';
import { useAppStore, COLORES_USUARIO } from '../stores/appStore';

const UserSelector: React.FC = () => {
  const { usuarios, usuarioActual, seleccionarUsuario, getTotalHoy } = useAppStore();
  const [isOpen, setIsOpen] = React.useState(false);

  const getColorHex = (colorId: string) =>
    COLORES_USUARIO.find((c) => c.id === colorId)?.hex || '#F97316';

  const usuariosActivos = usuarios.filter((u) => u.activo);

  if (usuariosActivos.length === 0) {
    return (
      <div className="px-4 py-3 text-center text-dark-400 text-sm">
        No hay usuarios. Activa modo Admin para crear.
      </div>
    );
  }

  return (
    <div className="px-4 pb-3">
      {/* Dropdown button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 bg-dark-800 rounded-lg border border-dark-700 hover:border-primary-500/50 transition-all no-drag"
      >
        {usuarioActual ? (
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
              style={{ backgroundColor: `${getColorHex(usuarioActual.color)}30` }}
            >
              {usuarioActual.avatar}
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-white">{usuarioActual.nombre}</p>
              <p className="text-xs text-dark-400">
                {getTotalHoy(usuarioActual.id)} / {usuarioActual.metaDiaria} hoy
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-dark-400">
            <User className="w-5 h-5" />
            <span className="text-sm">Seleccionar usuario</span>
          </div>
        )}
        <ChevronDown
          className={`w-4 h-4 text-dark-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="mt-2 bg-dark-800 rounded-lg border border-dark-700 overflow-hidden animate-fade-in">
          {usuariosActivos.map((usuario) => {
            const isSelected = usuarioActual?.id === usuario.id;
            const colorHex = getColorHex(usuario.color);
            const totalHoy = getTotalHoy(usuario.id);
            const progreso = (totalHoy / usuario.metaDiaria) * 100;

            return (
              <button
                key={usuario.id}
                onClick={() => {
                  seleccionarUsuario(usuario.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 transition-all no-drag ${
                  isSelected
                    ? 'bg-primary-500/10 border-l-2 border-primary-500'
                    : 'hover:bg-dark-700/50 border-l-2 border-transparent'
                }`}
              >
                {/* Avatar */}
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-lg flex-shrink-0"
                  style={{ backgroundColor: `${colorHex}30` }}
                >
                  {usuario.avatar}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-white truncate">{usuario.nombre}</p>
                    {usuario.rol === 'admin' && (
                      <span className="badge badge-primary text-[10px]">Admin</span>
                    )}
                  </div>
                  {/* Progress bar mini */}
                  <div className="mt-1 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-dark-700 rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all"
                        style={{
                          width: `${Math.min(100, progreso)}%`,
                          backgroundColor: progreso >= 100 ? '#10B981' : colorHex,
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-dark-400 flex-shrink-0">
                      {totalHoy}/{usuario.metaDiaria}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default UserSelector;
