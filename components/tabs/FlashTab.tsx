import React, { useState, useEffect } from 'react';
import { Country } from '../../types/country';
import {
  FlashProfile,
  FlashShipment,
  FlashStats,
  FlashRecipient,
  FlashAddress,
  FlashProduct,
} from '../../types/flash';
import {
  getFlashProfiles,
  createFlashProfile,
  deleteFlashProfile,
  toggleProfileFavorite,
  createFlashShipment,
  getFlashShipments,
  getFlashStats,
  formatTimeSaved,
  calculateMonthlySavings,
  getMostUsedProfiles,
  getFavoriteProfiles,
} from '../../services/flashService';
import { getCarriersByCountry, getCitiesByCountry, formatCurrency } from '../../services/countryService';
import { recordFlashShipment } from '../../services/gamificationService';
import {
  Zap,
  Plus,
  Star,
  Clock,
  Package,
  MapPin,
  Phone,
  User,
  Trash2,
  Edit,
  Check,
  X,
  ChevronRight,
  Timer,
  TrendingUp,
  Sparkles,
  Send,
  AlertCircle,
  Settings,
} from 'lucide-react';

interface FlashTabProps {
  country: Country;
}

const FlashTab: React.FC<FlashTabProps> = ({ country }) => {
  const [profiles, setProfiles] = useState<FlashProfile[]>([]);
  const [shipments, setShipments] = useState<FlashShipment[]>([]);
  const [stats, setStats] = useState<FlashStats | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<FlashProfile | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [recentShipment, setRecentShipment] = useState<FlashShipment | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const carriers = getCarriersByCountry(country);
  const cities = getCitiesByCountry(country);

  useEffect(() => {
    loadData();
  }, [country]);

  const loadData = () => {
    setProfiles(getFlashProfiles(country));
    setShipments(getFlashShipments().slice(0, 10));
    setStats(getFlashStats());
  };

  const handleCreateShipment = (profile: FlashProfile) => {
    setSelectedProfile(profile);
    setShowConfirmModal(true);
  };

  const confirmShipment = () => {
    if (!selectedProfile) return;

    const shipment = createFlashShipment(selectedProfile, country);
    recordFlashShipment();

    setRecentShipment(shipment);
    setShowConfirmModal(false);
    setShowSuccess(true);
    loadData();

    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleDeleteProfile = (profileId: string) => {
    if (window.confirm('¿Eliminar este perfil Flash?')) {
      deleteFlashProfile(profileId);
      loadData();
    }
  };

  const handleToggleFavorite = (profileId: string) => {
    toggleProfileFavorite(profileId);
    loadData();
  };

  const monthlySavings = calculateMonthlySavings();
  const favoriteProfiles = getFavoriteProfiles(country);
  const mostUsed = getMostUsedProfiles(country, 3);

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,...')] opacity-10" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Zap className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Litper Flash</h2>
              <p className="text-white/80 text-sm">Envíos en 2 clicks y 8 segundos</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 text-white/70 text-sm mb-1">
                <Package className="w-4 h-4" />
                <span>Perfiles</span>
              </div>
              <div className="text-2xl font-bold">{profiles.length}</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 text-white/70 text-sm mb-1">
                <Send className="w-4 h-4" />
                <span>Envíos Flash</span>
              </div>
              <div className="text-2xl font-bold">{stats?.totalShipments || 0}</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 text-white/70 text-sm mb-1">
                <Timer className="w-4 h-4" />
                <span>Tiempo Ahorrado</span>
              </div>
              <div className="text-2xl font-bold">
                {formatTimeSaved(stats?.totalTimeSaved || 0)}
              </div>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 text-white/70 text-sm mb-1">
                <TrendingUp className="w-4 h-4" />
                <span>Ahorro Estimado</span>
              </div>
              <div className="text-2xl font-bold">
                {formatCurrency(country, monthlySavings.estimatedMoneySaved)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Access - Favorites */}
      {favoriteProfiles.length > 0 && (
        <div>
          <h3 className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-white mb-4">
            <Star className="w-5 h-5 text-yellow-500" />
            Acceso Rápido
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            {favoriteProfiles.map((profile) => (
              <button
                key={profile.id}
                onClick={() => handleCreateShipment(profile)}
                className="group relative bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl p-6 border-2 border-yellow-200 dark:border-yellow-800 hover:border-yellow-400 dark:hover:border-yellow-600 transition-all hover:shadow-lg hover:shadow-yellow-500/20 text-left"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-3xl">{profile.emoji}</span>
                  <Zap className="w-6 h-6 text-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <h4 className="font-bold text-slate-800 dark:text-white text-lg mb-1">
                  {profile.name}
                </h4>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {profile.address.city} • {carriers.find((c) => c.id === profile.carrierId)?.name}
                </p>
                <div className="mt-3 text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                  Click para enviar al instante →
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* All Profiles */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">
            Todos los Perfiles
          </h3>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-lg font-bold text-sm hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            Nuevo Perfil
          </button>
        </div>

        {profiles.length === 0 ? (
          <div className="bg-white dark:bg-navy-900 rounded-xl p-12 text-center border border-slate-200 dark:border-navy-800">
            <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-orange-500" />
            </div>
            <h4 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
              Crea tu primer perfil Flash
            </h4>
            <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto">
              Guarda tus rutas frecuentes y crea guías completas en 2 clicks.
              Ahorra hasta 4 minutos por envío.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all"
            >
              <Plus className="w-5 h-5" />
              Crear Perfil
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {profiles.map((profile) => (
              <div
                key={profile.id}
                className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-800 overflow-hidden group hover:shadow-lg transition-all"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{profile.emoji}</span>
                      <div>
                        <h4 className="font-bold text-slate-800 dark:text-white">
                          {profile.name}
                        </h4>
                        <p className="text-xs text-slate-400">
                          {profile.usageCount} usos
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleFavorite(profile.id)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        profile.isFavorite
                          ? 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30'
                          : 'text-slate-400 hover:text-yellow-500 hover:bg-yellow-50'
                      }`}
                    >
                      <Star className={`w-4 h-4 ${profile.isFavorite ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <User className="w-4 h-4 text-slate-400" />
                      <span>{profile.recipient.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span className="truncate">{profile.address.city}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <Package className="w-4 h-4 text-slate-400" />
                      <span>{carriers.find((c) => c.id === profile.carrierId)?.name}</span>
                    </div>
                  </div>
                </div>

                <div className="flex border-t border-slate-100 dark:border-navy-800">
                  <button
                    onClick={() => handleCreateShipment(profile)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold text-sm hover:from-orange-600 hover:to-red-600 transition-all"
                  >
                    <Zap className="w-4 h-4" />
                    Enviar Ahora
                  </button>
                  <button
                    onClick={() => handleDeleteProfile(profile.id)}
                    className="px-4 py-3 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Shipments */}
      {shipments.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">
            Envíos Recientes
          </h3>
          <div className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-800 divide-y divide-slate-100 dark:divide-navy-800">
            {shipments.slice(0, 5).map((shipment) => (
              <div key={shipment.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                    <Zap className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <div className="font-medium text-slate-800 dark:text-white">
                      {shipment.profileName}
                    </div>
                    <div className="text-sm text-slate-500">
                      {shipment.recipient.name} • {shipment.address.city}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono text-slate-400">
                    {shipment.guideNumber}
                  </div>
                  <div className="text-xs text-slate-500">
                    {new Date(shipment.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Profile Modal */}
      {showCreateModal && (
        <CreateProfileModal
          country={country}
          carriers={carriers}
          cities={cities}
          onClose={() => setShowCreateModal(false)}
          onCreate={(profile) => {
            loadData();
            setShowCreateModal(false);
          }}
        />
      )}

      {/* Confirm Shipment Modal */}
      {showConfirmModal && selectedProfile && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-navy-900 rounded-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                Confirmar Envío Flash
              </h3>
              <p className="text-slate-500 dark:text-slate-400">
                ¿Crear guía con el perfil "{selectedProfile.name}"?
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-navy-800 rounded-xl p-4 mb-6 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Destinatario</span>
                <span className="font-medium text-slate-800 dark:text-white">
                  {selectedProfile.recipient.name}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Ciudad</span>
                <span className="font-medium text-slate-800 dark:text-white">
                  {selectedProfile.address.city}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Transportadora</span>
                <span className="font-medium text-slate-800 dark:text-white">
                  {carriers.find((c) => c.id === selectedProfile.carrierId)?.name}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-navy-700 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-navy-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmShipment}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Zap className="w-5 h-5" />
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {showSuccess && recentShipment && (
        <div className="fixed bottom-4 right-4 bg-emerald-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-right-10 z-50">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Check className="w-6 h-6" />
          </div>
          <div>
            <div className="font-bold">¡Guía creada en 8 segundos!</div>
            <div className="text-sm text-white/80">{recentShipment.guideNumber}</div>
          </div>
        </div>
      )}
    </div>
  );
};

// Create Profile Modal Component
interface CreateProfileModalProps {
  country: Country;
  carriers: any[];
  cities: string[];
  onClose: () => void;
  onCreate: (profile: FlashProfile) => void;
}

const CreateProfileModal: React.FC<CreateProfileModalProps> = ({
  country,
  carriers,
  cities,
  onClose,
  onCreate,
}) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('📦');
  const [carrierId, setCarrierId] = useState(carriers[0]?.id || '');
  const [serviceId, setServiceId] = useState('');
  const [recipient, setRecipient] = useState<FlashRecipient>({
    name: '',
    phone: '',
    email: '',
  });
  const [address, setAddress] = useState<FlashAddress>({
    street: '',
    city: cities[0] || '',
    country,
  });

  const selectedCarrier = carriers.find((c) => c.id === carrierId);

  useEffect(() => {
    if (selectedCarrier && selectedCarrier.services.length > 0) {
      setServiceId(selectedCarrier.services[0].id);
    }
  }, [carrierId]);

  const handleCreate = () => {
    if (!name || !recipient.name || !recipient.phone || !address.street) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    const profile = createFlashProfile(name, country, carrierId, serviceId, recipient, address, {
      emoji,
    });
    onCreate(profile);
  };

  const emojis = ['📦', '🚀', '⚡', '🏪', '👔', '💄', '🎁', '📱', '🖥️', '👟', '🍕', '💊'];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-navy-900 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-navy-900 px-6 py-4 border-b border-slate-200 dark:border-navy-800 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">
              Nuevo Perfil Flash
            </h3>
            <p className="text-sm text-slate-500">Paso {step} de 3</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-navy-800 rounded-lg"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="p-6">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Nombre del Perfil
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Express Bogotá, Medellín Standard"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Emoji
                </label>
                <div className="flex flex-wrap gap-2">
                  {emojis.map((e) => (
                    <button
                      key={e}
                      onClick={() => setEmoji(e)}
                      className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${
                        emoji === e
                          ? 'bg-orange-100 dark:bg-orange-900/30 ring-2 ring-orange-500'
                          : 'bg-slate-100 dark:bg-navy-800 hover:bg-slate-200'
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Transportadora
                </label>
                <select
                  value={carrierId}
                  onChange={(e) => setCarrierId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-slate-800 dark:text-white"
                >
                  {carriers.map((carrier) => (
                    <option key={carrier.id} value={carrier.id}>
                      {carrier.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedCarrier && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Tipo de Servicio
                  </label>
                  <select
                    value={serviceId}
                    onChange={(e) => setServiceId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-slate-800 dark:text-white"
                  >
                    {selectedCarrier.services.map((service: any) => (
                      <option key={service.id} value={service.id}>
                        {service.name} ({service.avgDays === 0 ? 'Mismo día' : `${service.avgDays} días`})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Recipient */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Nombre del Destinatario *
                </label>
                <input
                  type="text"
                  value={recipient.name}
                  onChange={(e) => setRecipient({ ...recipient, name: e.target.value })}
                  placeholder="Nombre completo"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Teléfono *
                </label>
                <input
                  type="tel"
                  value={recipient.phone}
                  onChange={(e) => setRecipient({ ...recipient, phone: e.target.value })}
                  placeholder="3001234567"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Email (opcional)
                </label>
                <input
                  type="email"
                  value={recipient.email}
                  onChange={(e) => setRecipient({ ...recipient, email: e.target.value })}
                  placeholder="correo@ejemplo.com"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Step 3: Address */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Ciudad *
                </label>
                <select
                  value={address.city}
                  onChange={(e) => setAddress({ ...address, city: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-slate-800 dark:text-white"
                >
                  {cities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Dirección *
                </label>
                <input
                  type="text"
                  value={address.street}
                  onChange={(e) => setAddress({ ...address, street: e.target.value })}
                  placeholder="Calle, número, edificio, apto"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Barrio (opcional)
                </label>
                <input
                  type="text"
                  value={address.neighborhood || ''}
                  onChange={(e) => setAddress({ ...address, neighborhood: e.target.value })}
                  placeholder="Nombre del barrio"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Instrucciones de Entrega (opcional)
                </label>
                <textarea
                  value={address.reference || ''}
                  onChange={(e) => setAddress({ ...address, reference: e.target.value })}
                  placeholder="Ej: Edificio azul, portería 24h, llamar antes"
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                />
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-navy-700 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-navy-800 transition-colors"
              >
                Atrás
              </button>
            )}
            {step < 3 ? (
              <button
                onClick={() => setStep(step + 1)}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                Siguiente
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleCreate}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                Crear Perfil
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlashTab;
