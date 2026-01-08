// components/tabs/RutasTab.tsx
// Gestión completa de rutas de entrega

import React, { useState, useMemo } from 'react';
import {
  Route,
  Plus,
  MapPin,
  Truck,
  User,
  Clock,
  Calendar,
  ChevronRight,
  MoreVertical,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Package,
  Navigation,
  Target,
  Zap,
  Filter,
  Search,
  ArrowUpDown,
  GripVertical,
  Phone,
  AlertTriangle,
  TrendingUp,
  BarChart3,
} from 'lucide-react';
import { useRutasStore, Ruta, Parada, Conductor } from '../../stores/rutasStore';
import { Shipment } from '../../types';

interface RutasTabProps {
  shipments: Shipment[];
}

// ============================================
// COMPONENTE ESTADÍSTICAS
// ============================================

function EstadisticasRutas() {
  const { getEstadisticas } = useRutasStore();
  const stats = getEstadisticas();

  const cards = [
    { label: 'Total Rutas', value: stats.total, icon: Route, color: 'from-blue-500 to-cyan-500', bg: 'bg-blue-500/10' },
    { label: 'Planificadas', value: stats.planificadas, icon: Calendar, color: 'from-amber-500 to-orange-500', bg: 'bg-amber-500/10' },
    { label: 'En Progreso', value: stats.enProgreso, icon: Truck, color: 'from-green-500 to-emerald-500', bg: 'bg-green-500/10' },
    { label: 'Completadas', value: stats.completadas, icon: CheckCircle, color: 'from-purple-500 to-pink-500', bg: 'bg-purple-500/10' },
    { label: 'Paradas Hoy', value: stats.paradasHoy, icon: MapPin, color: 'from-red-500 to-rose-500', bg: 'bg-red-500/10' },
    { label: 'Entregas Hoy', value: stats.entregasHoy, icon: Package, color: 'from-teal-500 to-cyan-500', bg: 'bg-teal-500/10' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((card, idx) => (
        <div key={idx} className={`${card.bg} rounded-xl p-4 border border-gray-700/50`}>
          <div className="flex items-center gap-2 mb-2">
            <card.icon className={`w-4 h-4 bg-gradient-to-r ${card.color} bg-clip-text text-transparent`} style={{ color: card.color.includes('blue') ? '#3b82f6' : card.color.includes('amber') ? '#f59e0b' : card.color.includes('green') ? '#22c55e' : card.color.includes('purple') ? '#a855f7' : card.color.includes('red') ? '#ef4444' : '#14b8a6' }} />
            <span className="text-xs text-gray-400">{card.label}</span>
          </div>
          <p className={`text-2xl font-bold bg-gradient-to-r ${card.color} bg-clip-text text-transparent`}>
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}

// ============================================
// MODAL CREAR/EDITAR RUTA
// ============================================

interface ModalRutaProps {
  ruta?: Ruta | null;
  onClose: () => void;
  onSave: (datos: Partial<Ruta>) => void;
}

function ModalRuta({ ruta, onClose, onSave }: ModalRutaProps) {
  const { conductores, zonas } = useRutasStore();
  const [nombre, setNombre] = useState(ruta?.nombre || '');
  const [fecha, setFecha] = useState(ruta?.fecha || new Date().toISOString().split('T')[0]);
  const [zona, setZona] = useState(ruta?.zona || zonas[0]?.nombre || '');
  const [conductor, setConductor] = useState(ruta?.conductor || '');
  const [vehiculo, setVehiculo] = useState(ruta?.vehiculo || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      nombre,
      fecha,
      zona,
      conductor,
      vehiculo,
      estado: ruta?.estado || 'planificada',
      paradas: ruta?.paradas || [],
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl max-w-lg w-full border border-gray-700 shadow-2xl animate-fade-in-scale">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Route className="w-6 h-6 text-amber-400" />
            {ruta ? 'Editar Ruta' : 'Nueva Ruta'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Nombre de la Ruta</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Ruta Norte AM"
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Fecha</label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Zona</label>
              <select
                value={zona}
                onChange={(e) => setZona(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
              >
                {zonas.map((z) => (
                  <option key={z.id} value={z.nombre}>{z.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Conductor</label>
              <select
                value={conductor}
                onChange={(e) => {
                  setConductor(e.target.value);
                  const cond = conductores.find(c => c.nombre === e.target.value);
                  if (cond) setVehiculo(cond.vehiculo);
                }}
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
              >
                <option value="">Sin asignar</option>
                {conductores.filter(c => c.estado === 'disponible').map((c) => (
                  <option key={c.id} value={c.nombre}>{c.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Vehiculo</label>
              <input
                type="text"
                value={vehiculo}
                onChange={(e) => setVehiculo(e.target.value)}
                placeholder="Moto / Furgon"
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-gray-800 text-white rounded-xl hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 transition-colors font-medium"
            >
              {ruta ? 'Guardar Cambios' : 'Crear Ruta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================
// TARJETA DE RUTA
// ============================================

interface TarjetaRutaProps {
  ruta: Ruta;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onIniciar: () => void;
  isSelected: boolean;
}

function TarjetaRuta({ ruta, onSelect, onEdit, onDelete, onIniciar, isSelected }: TarjetaRutaProps) {
  const [showMenu, setShowMenu] = useState(false);

  const estadoConfig = {
    planificada: { color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Planificada', icon: Calendar },
    en_progreso: { color: 'text-green-400', bg: 'bg-green-500/10', label: 'En Progreso', icon: Truck },
    completada: { color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Completada', icon: CheckCircle },
    cancelada: { color: 'text-red-400', bg: 'bg-red-500/10', label: 'Cancelada', icon: XCircle },
  };

  const config = estadoConfig[ruta.estado];
  const Icon = config.icon;
  const entregadas = ruta.paradas.filter(p => p.estado === 'entregado').length;
  const progreso = ruta.paradas.length > 0 ? (entregadas / ruta.paradas.length) * 100 : 0;

  return (
    <div
      onClick={onSelect}
      className={`
        relative p-4 rounded-xl border cursor-pointer transition-all
        ${isSelected
          ? 'bg-amber-500/10 border-amber-500/50 shadow-lg shadow-amber-500/10'
          : 'bg-gray-800/50 border-gray-700/50 hover:bg-gray-800 hover:border-gray-600'
        }
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Route className="w-4 h-4 text-amber-400" />
            {ruta.nombre}
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">{ruta.zona}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 text-xs font-medium rounded-lg ${config.bg} ${config.color} flex items-center gap-1`}>
            <Icon className="w-3 h-3" />
            {config.label}
          </span>
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
              className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-full mt-1 w-40 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-20 py-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); onEdit(); setShowMenu(false); }}
                    className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" /> Editar
                  </button>
                  {ruta.estado === 'planificada' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onIniciar(); setShowMenu(false); }}
                      className="w-full px-3 py-2 text-left text-sm text-green-400 hover:bg-gray-700 flex items-center gap-2"
                    >
                      <Play className="w-4 h-4" /> Iniciar
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(); setShowMenu(false); }}
                    className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-gray-700 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" /> Eliminar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
        <div className="flex items-center gap-2 text-gray-400">
          <Calendar className="w-3.5 h-3.5" />
          <span>{new Date(ruta.fecha).toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-400">
          <MapPin className="w-3.5 h-3.5" />
          <span>{ruta.paradas.length} paradas</span>
        </div>
        {ruta.conductor && (
          <div className="flex items-center gap-2 text-gray-400">
            <User className="w-3.5 h-3.5" />
            <span className="truncate">{ruta.conductor}</span>
          </div>
        )}
        {ruta.vehiculo && (
          <div className="flex items-center gap-2 text-gray-400">
            <Truck className="w-3.5 h-3.5" />
            <span>{ruta.vehiculo}</span>
          </div>
        )}
      </div>

      {/* Progreso */}
      {ruta.paradas.length > 0 && (
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-400">Progreso</span>
            <span className="text-white font-medium">{entregadas}/{ruta.paradas.length}</span>
          </div>
          <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-300"
              style={{ width: `${progreso}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// PANEL DE PARADAS
// ============================================

interface PanelParadasProps {
  ruta: Ruta;
  shipments: Shipment[];
  onClose: () => void;
}

function PanelParadas({ ruta, shipments, onClose }: PanelParadasProps) {
  const { actualizarParada, agregarParada, eliminarParada, actualizarRuta } = useRutasStore();
  const [busqueda, setBusqueda] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const guiasDisponibles = useMemo(() => {
    const guiasEnRutas = new Set(ruta.paradas.map(p => p.guiaId));
    return shipments.filter(s =>
      !guiasEnRutas.has(s.id) &&
      (s.status === 'Pendiente' || s.status === 'En Reparto') &&
      (busqueda === '' ||
        s.id.toLowerCase().includes(busqueda.toLowerCase()) ||
        s.detailedInfo?.destination?.toLowerCase().includes(busqueda.toLowerCase())
      )
    );
  }, [shipments, ruta.paradas, busqueda]);

  const handleAgregarGuia = (shipment: Shipment) => {
    agregarParada(ruta.id, {
      guiaId: shipment.id,
      direccion: shipment.detailedInfo?.destination || 'Sin direccion',
      ciudad: shipment.detailedInfo?.destination?.split(',')[0] || 'Sin ciudad',
      cliente: shipment.phone || 'Cliente',
      telefono: shipment.phone,
      estado: 'pendiente',
    });
    setShowAddModal(false);
  };

  const handleCambiarEstado = (paradaId: string, nuevoEstado: Parada['estado']) => {
    actualizarParada(ruta.id, paradaId, { estado: nuevoEstado });
  };

  const handleFinalizarRuta = () => {
    actualizarRuta(ruta.id, { estado: 'completada', horaFin: new Date().toISOString() });
  };

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 bg-gradient-to-r from-amber-600/10 to-orange-600/10">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white flex items-center gap-2">
              <Navigation className="w-5 h-5 text-amber-400" />
              {ruta.nombre}
            </h3>
            <p className="text-sm text-gray-400">{ruta.paradas.length} paradas - {ruta.zona}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3 py-1.5 bg-amber-500/20 text-amber-400 rounded-lg text-sm font-medium hover:bg-amber-500/30 transition-colors flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Agregar
            </button>
            {ruta.estado === 'en_progreso' && (
              <button
                onClick={handleFinalizarRuta}
                className="px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg text-sm font-medium hover:bg-green-500/30 transition-colors flex items-center gap-1"
              >
                <CheckCircle className="w-4 h-4" /> Finalizar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Lista de paradas */}
      <div className="max-h-[500px] overflow-y-auto">
        {ruta.paradas.length === 0 ? (
          <div className="p-8 text-center">
            <MapPin className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No hay paradas en esta ruta</p>
            <p className="text-sm text-gray-500">Agrega guias para crear el recorrido</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {ruta.paradas.map((parada, idx) => (
              <div key={parada.id} className="p-4 hover:bg-gray-800/50 transition-colors">
                <div className="flex items-start gap-3">
                  {/* Numero de orden */}
                  <div className={`
                    w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm
                    ${parada.estado === 'entregado' ? 'bg-green-500/20 text-green-400' :
                      parada.estado === 'en_camino' ? 'bg-amber-500/20 text-amber-400' :
                      parada.estado === 'fallido' ? 'bg-red-500/20 text-red-400' :
                      'bg-gray-700 text-gray-400'}
                  `}>
                    {parada.estado === 'entregado' ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">{parada.direccion}</p>
                    <p className="text-sm text-gray-400">{parada.ciudad}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Package className="w-3 h-3" /> {parada.guiaId}
                      </span>
                      {parada.telefono && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {parada.telefono}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-1">
                    {parada.estado === 'pendiente' && (
                      <button
                        onClick={() => handleCambiarEstado(parada.id, 'en_camino')}
                        className="p-1.5 text-amber-400 hover:bg-amber-500/20 rounded-lg"
                        title="En camino"
                      >
                        <Truck className="w-4 h-4" />
                      </button>
                    )}
                    {(parada.estado === 'pendiente' || parada.estado === 'en_camino') && (
                      <>
                        <button
                          onClick={() => handleCambiarEstado(parada.id, 'entregado')}
                          className="p-1.5 text-green-400 hover:bg-green-500/20 rounded-lg"
                          title="Marcar entregado"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleCambiarEstado(parada.id, 'fallido')}
                          className="p-1.5 text-red-400 hover:bg-red-500/20 rounded-lg"
                          title="Marcar fallido"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => eliminarParada(ruta.id, parada.id)}
                      className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal agregar guía */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl max-w-lg w-full border border-gray-700 shadow-2xl">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h3 className="font-bold text-white">Agregar Guia a la Ruta</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar por guia o direccion..."
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {guiasDisponibles.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">No hay guias disponibles</p>
                ) : (
                  guiasDisponibles.slice(0, 20).map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleAgregarGuia(s)}
                      className="w-full p-3 bg-gray-800 hover:bg-gray-700 rounded-xl text-left transition-colors"
                    >
                      <p className="font-medium text-white">{s.id}</p>
                      <p className="text-sm text-gray-400 truncate">{s.detailedInfo?.destination || 'Sin direccion'}</p>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function RutasTab({ shipments }: RutasTabProps) {
  const {
    rutas,
    rutaSeleccionada,
    filtroEstado,
    agregarRuta,
    actualizarRuta,
    eliminarRuta,
    seleccionarRuta,
    setFiltroEstado,
    getRutasFiltradas,
  } = useRutasStore();

  const [showModal, setShowModal] = useState(false);
  const [rutaEditar, setRutaEditar] = useState<Ruta | null>(null);
  const [busqueda, setBusqueda] = useState('');

  const rutasFiltradas = useMemo(() => {
    let resultado = getRutasFiltradas();
    if (busqueda) {
      resultado = resultado.filter(r =>
        r.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        r.zona.toLowerCase().includes(busqueda.toLowerCase()) ||
        r.conductor?.toLowerCase().includes(busqueda.toLowerCase())
      );
    }
    return resultado;
  }, [getRutasFiltradas, busqueda, filtroEstado, rutas]);

  const handleGuardarRuta = (datos: Partial<Ruta>) => {
    if (rutaEditar) {
      actualizarRuta(rutaEditar.id, datos);
    } else {
      agregarRuta(datos as Omit<Ruta, 'id' | 'createdAt' | 'updatedAt'>);
    }
    setRutaEditar(null);
  };

  const handleIniciarRuta = (ruta: Ruta) => {
    actualizarRuta(ruta.id, { estado: 'en_progreso', horaInicio: new Date().toISOString() });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
              <Route className="w-5 h-5 text-white" />
            </div>
            Gestion de Rutas
          </h1>
          <p className="text-gray-400 mt-1">Planifica y optimiza tus rutas de entrega</p>
        </div>
        <button
          onClick={() => { setRutaEditar(null); setShowModal(true); }}
          className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium hover:from-amber-600 hover:to-orange-600 transition-colors flex items-center gap-2 shadow-lg shadow-amber-500/20"
        >
          <Plus className="w-5 h-5" />
          Nueva Ruta
        </button>
      </div>

      {/* Estadísticas */}
      <EstadisticasRutas />

      {/* Filtros */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar rutas..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
          />
        </div>
        <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-xl p-1">
          {(['todas', 'planificada', 'en_progreso', 'completada'] as const).map((estado) => (
            <button
              key={estado}
              onClick={() => setFiltroEstado(estado)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filtroEstado === estado
                  ? 'bg-amber-500 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {estado === 'todas' ? 'Todas' : estado === 'planificada' ? 'Planificadas' : estado === 'en_progreso' ? 'En Progreso' : 'Completadas'}
            </button>
          ))}
        </div>
      </div>

      {/* Contenido principal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lista de rutas */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-400" />
            Rutas ({rutasFiltradas.length})
          </h2>
          {rutasFiltradas.length === 0 ? (
            <div className="bg-gray-800/50 rounded-xl p-8 text-center border border-gray-700/50">
              <Route className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No hay rutas</p>
              <p className="text-sm text-gray-500">Crea una nueva ruta para empezar</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
              {rutasFiltradas.map((ruta) => (
                <TarjetaRuta
                  key={ruta.id}
                  ruta={ruta}
                  isSelected={rutaSeleccionada?.id === ruta.id}
                  onSelect={() => seleccionarRuta(ruta)}
                  onEdit={() => { setRutaEditar(ruta); setShowModal(true); }}
                  onDelete={() => eliminarRuta(ruta.id)}
                  onIniciar={() => handleIniciarRuta(ruta)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Panel de paradas */}
        <div>
          {rutaSeleccionada ? (
            <PanelParadas
              ruta={rutaSeleccionada}
              shipments={shipments}
              onClose={() => seleccionarRuta(null)}
            />
          ) : (
            <div className="bg-gray-800/50 rounded-xl p-8 text-center border border-gray-700/50 h-full flex flex-col items-center justify-center">
              <Target className="w-12 h-12 text-gray-600 mb-3" />
              <p className="text-gray-400">Selecciona una ruta</p>
              <p className="text-sm text-gray-500">Para ver y gestionar sus paradas</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <ModalRuta
          ruta={rutaEditar}
          onClose={() => { setShowModal(false); setRutaEditar(null); }}
          onSave={handleGuardarRuta}
        />
      )}
    </div>
  );
}
