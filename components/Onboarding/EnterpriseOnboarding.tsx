import React, { useState, useCallback, useRef } from 'react';
import {
  User,
  Building2,
  Settings2,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Upload,
  Camera,
  MapPin,
  Phone,
  Mail,
  FileText,
  Package,
  Truck,
  ShoppingCart,
  Code,
  Sparkles,
  ArrowRight,
  Check,
  X,
  Globe,
  Briefcase,
  Hash,
  Building,
  Factory,
  Store,
  Boxes,
  FileBox,
  Snowflake,
  Link2,
} from 'lucide-react';
import {
  useCompanyStore,
  CompanyRole,
  IndustrySector,
  ShippingVolume,
  CarrierOption,
  ProductType,
  IntegrationType,
  roleLabels,
  sectorLabels,
  volumeLabels,
  carrierLabels,
  productTypeLabels,
  integrationLabels,
} from '../../stores/companyStore';

// ============================================
// ENTERPRISE ONBOARDING - Professional 4-Step Flow
// ============================================

interface EnterpriseOnboardingProps {
  onComplete: () => void;
}

// Avatar colors palette
const avatarColors = [
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#ef4444', // Red
  '#f97316', // Orange
  '#eab308', // Yellow
  '#22c55e', // Green
  '#14b8a6', // Teal
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
];

// Step indicator component
const StepIndicator: React.FC<{
  currentStep: number;
  totalSteps: number;
  stepsCompleted: Record<string, boolean>;
}> = ({ currentStep, totalSteps, stepsCompleted }) => {
  const steps = [
    { key: 'profile', label: 'Perfil', icon: User },
    { key: 'company', label: 'Empresa', icon: Building2 },
    { key: 'preferences', label: 'Preferencias', icon: Settings2 },
    { key: 'finished', label: 'Finalizar', icon: CheckCircle2 },
  ];

  const completedCount = Object.values(stepsCompleted).filter(Boolean).length;
  const percentage = Math.round((completedCount / totalSteps) * 100);

  return (
    <div className="w-full mb-8">
      {/* Progress bar */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-slate-400">
          Paso {currentStep} de {totalSteps}
        </span>
        <span className="text-sm font-medium text-slate-300">
          {percentage}% completado
        </span>
      </div>
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden mb-6">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500 ease-out"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        />
      </div>

      {/* Step dots */}
      <div className="flex justify-between">
        {steps.map((step, index) => {
          const stepNum = index + 1;
          const isActive = currentStep === stepNum;
          const isCompleted = stepsCompleted[step.key];
          const Icon = step.icon;

          return (
            <div key={step.key} className="flex flex-col items-center">
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
                  ${isCompleted
                    ? 'bg-emerald-500 text-white'
                    : isActive
                      ? 'bg-indigo-500 text-white ring-4 ring-indigo-500/30'
                      : 'bg-slate-800 text-slate-500'
                  }
                `}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </div>
              <span
                className={`
                  text-xs mt-2 font-medium transition-colors
                  ${isActive ? 'text-white' : 'text-slate-500'}
                `}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Input field component
const InputField: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: React.ElementType;
  type?: string;
  required?: boolean;
  error?: string;
}> = ({ label, value, onChange, placeholder, icon: Icon, type = 'text', required, error }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-slate-300 mb-2">
      {label}
      {required && <span className="text-red-400 ml-1">*</span>}
    </label>
    <div className="relative">
      {Icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
          <Icon className="w-5 h-5" />
        </div>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`
          w-full px-4 py-3 ${Icon ? 'pl-11' : ''} bg-slate-800/50 border rounded-xl
          text-white placeholder-slate-500 outline-none transition-all duration-200
          focus:ring-2 focus:ring-indigo-500/50
          ${error ? 'border-red-500' : 'border-slate-700 hover:border-slate-600 focus:border-indigo-500'}
        `}
      />
    </div>
    {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
  </div>
);

// Select field component
const SelectField: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  icon?: React.ElementType;
  required?: boolean;
}> = ({ label, value, onChange, options, placeholder, icon: Icon, required }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-slate-300 mb-2">
      {label}
      {required && <span className="text-red-400 ml-1">*</span>}
    </label>
    <div className="relative">
      {Icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 z-10">
          <Icon className="w-5 h-5" />
        </div>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`
          w-full px-4 py-3 ${Icon ? 'pl-11' : ''} bg-slate-800/50 border border-slate-700 rounded-xl
          text-white outline-none transition-all duration-200 appearance-none cursor-pointer
          hover:border-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50
        `}
      >
        {placeholder && (
          <option value="" className="bg-slate-900">
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-slate-900">
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 rotate-90 pointer-events-none" />
    </div>
  </div>
);

// Checkbox option component
const CheckboxOption: React.FC<{
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  icon?: React.ElementType;
}> = ({ label, checked, onChange, icon: Icon }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={`
      flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200
      ${checked
        ? 'bg-indigo-500/20 border-indigo-500 text-white'
        : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
      }
    `}
  >
    <div
      className={`
        w-5 h-5 rounded border-2 flex items-center justify-center transition-all
        ${checked ? 'bg-indigo-500 border-indigo-500' : 'border-slate-600'}
      `}
    >
      {checked && <Check className="w-3 h-3 text-white" />}
    </div>
    {Icon && <Icon className="w-4 h-4" />}
    <span className="text-sm font-medium">{label}</span>
  </button>
);

// Radio option component for volume selection
const VolumeOption: React.FC<{
  label: string;
  value: string;
  selected: boolean;
  onChange: () => void;
}> = ({ label, selected, onChange }) => (
  <button
    type="button"
    onClick={onChange}
    className={`
      px-4 py-3 rounded-xl border transition-all duration-200 text-sm font-medium
      ${selected
        ? 'bg-indigo-500/20 border-indigo-500 text-white'
        : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
      }
    `}
  >
    {label}
  </button>
);

// ============================================
// STEP 1: Profile Configuration
// ============================================
const ProfileStep: React.FC = () => {
  const { userProfile, updateUserProfile, completeProfileStep } = useCompanyStore();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!userProfile.fullName.trim()) {
      newErrors.fullName = 'El nombre es requerido';
    }
    if (!userProfile.role) {
      newErrors.role = 'Selecciona tu rol';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (validate()) {
      completeProfileStep();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateUserProfile({ avatarUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const getInitials = () => {
    if (!userProfile.fullName) return 'U';
    const names = userProfile.fullName.trim().split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  const roleOptions = Object.entries(roleLabels).map(([value, label]) => ({
    value,
    label,
  }));

  return (
    <div className="animate-fadeIn">
      <div className="text-center mb-8">
        <div className="w-14 h-14 bg-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <User className="w-7 h-7 text-indigo-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Configura tu perfil</h2>
        <p className="text-slate-400">Cuéntanos sobre ti para personalizar tu experiencia</p>
      </div>

      {/* Avatar */}
      <div className="flex flex-col items-center mb-8">
        <div className="relative group">
          {userProfile.avatarUrl ? (
            <img
              src={userProfile.avatarUrl}
              alt="Avatar"
              className="w-24 h-24 rounded-2xl object-cover"
            />
          ) : (
            <div
              className="w-24 h-24 rounded-2xl flex items-center justify-center text-3xl font-bold text-white"
              style={{ backgroundColor: userProfile.avatarColor }}
            >
              {getInitials()}
            </div>
          )}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Camera className="w-6 h-6 text-white" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>
        <p className="text-sm text-slate-500 mt-2">Foto de perfil (opcional)</p>

        {/* Color selector */}
        {!userProfile.avatarUrl && (
          <div className="flex gap-2 mt-4">
            {avatarColors.map((color) => (
              <button
                key={color}
                onClick={() => updateUserProfile({ avatarColor: color })}
                className={`
                  w-6 h-6 rounded-full transition-transform hover:scale-110
                  ${userProfile.avatarColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900' : ''}
                `}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Form fields */}
      <InputField
        label="Nombre completo"
        value={userProfile.fullName}
        onChange={(value) => updateUserProfile({ fullName: value })}
        placeholder="Ej: María García López"
        icon={User}
        required
        error={errors.fullName}
      />

      <SelectField
        label="Cargo en la empresa"
        value={userProfile.role}
        onChange={(value) => updateUserProfile({ role: value as CompanyRole })}
        options={roleOptions}
        placeholder="Selecciona tu rol"
        icon={Briefcase}
        required
      />
      {errors.role && <p className="mt-[-12px] mb-4 text-xs text-red-400">{errors.role}</p>}

      <button
        onClick={handleContinue}
        className="w-full mt-6 px-6 py-4 bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-semibold rounded-xl
          hover:from-indigo-600 hover:to-violet-600 transition-all duration-200 flex items-center justify-center gap-2"
      >
        Continuar
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
};

// ============================================
// STEP 2: Company Configuration
// ============================================
const CompanyStep: React.FC = () => {
  const { company, updateCompany, completeCompanyStep, prevStep } = useCompanyStore();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const logoInputRef = useRef<HTMLInputElement>(null);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!company.name.trim()) newErrors.name = 'El nombre de la empresa es requerido';
    if (!company.city.trim()) newErrors.city = 'La ciudad es requerida';
    if (!company.email.trim()) newErrors.email = 'El email es requerido';
    if (company.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(company.email)) {
      newErrors.email = 'Email inválido';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (validate()) {
      completeCompanyStep();
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateCompany({ logoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const sectorOptions = Object.entries(sectorLabels).map(([value, label]) => ({
    value,
    label,
  }));

  const countryOptions = [
    { value: 'Colombia', label: 'Colombia' },
    { value: 'México', label: 'México' },
    { value: 'Perú', label: 'Perú' },
    { value: 'Chile', label: 'Chile' },
    { value: 'Ecuador', label: 'Ecuador' },
    { value: 'Argentina', label: 'Argentina' },
  ];

  return (
    <div className="animate-fadeIn">
      <div className="text-center mb-8">
        <div className="w-14 h-14 bg-violet-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Building2 className="w-7 h-7 text-violet-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Configura tu empresa</h2>
        <p className="text-slate-400">Información de tu organización</p>
      </div>

      {/* Logo upload */}
      <div className="flex items-center gap-4 mb-6 p-4 bg-slate-800/30 rounded-xl border border-slate-700">
        {company.logoUrl ? (
          <img src={company.logoUrl} alt="Logo" className="w-16 h-16 rounded-xl object-contain bg-white" />
        ) : (
          <div className="w-16 h-16 rounded-xl bg-slate-700 flex items-center justify-center">
            <Building className="w-8 h-8 text-slate-500" />
          </div>
        )}
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-300">Logo de la empresa</p>
          <p className="text-xs text-slate-500">PNG, JPG (opcional)</p>
        </div>
        <button
          onClick={() => logoInputRef.current?.click()}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Upload className="w-4 h-4" />
        </button>
        <input
          ref={logoInputRef}
          type="file"
          accept="image/*"
          onChange={handleLogoUpload}
          className="hidden"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <InputField
            label="Nombre de la empresa"
            value={company.name}
            onChange={(value) => updateCompany({ name: value })}
            placeholder="Ej: Mi Empresa S.A.S"
            icon={Building2}
            required
            error={errors.name}
          />
        </div>

        <InputField
          label="NIT / ID Fiscal"
          value={company.taxId}
          onChange={(value) => updateCompany({ taxId: value })}
          placeholder="Ej: 900123456-1"
          icon={Hash}
        />

        <SelectField
          label="Sector / Industria"
          value={company.sector}
          onChange={(value) => updateCompany({ sector: value as IndustrySector })}
          options={sectorOptions}
          placeholder="Selecciona el sector"
          icon={Factory}
        />

        <SelectField
          label="País"
          value={company.country}
          onChange={(value) => updateCompany({ country: value })}
          options={countryOptions}
          icon={Globe}
        />

        <InputField
          label="Ciudad"
          value={company.city}
          onChange={(value) => updateCompany({ city: value })}
          placeholder="Ej: Bogotá"
          icon={MapPin}
          required
          error={errors.city}
        />

        <div className="md:col-span-2">
          <InputField
            label="Dirección"
            value={company.address}
            onChange={(value) => updateCompany({ address: value })}
            placeholder="Ej: Calle 100 # 15-20, Oficina 502"
            icon={MapPin}
          />
        </div>

        <InputField
          label="Teléfono empresa"
          value={company.phone}
          onChange={(value) => updateCompany({ phone: value })}
          placeholder="Ej: +57 1 234 5678"
          icon={Phone}
          type="tel"
        />

        <InputField
          label="Email empresa"
          value={company.email}
          onChange={(value) => updateCompany({ email: value })}
          placeholder="Ej: contacto@miempresa.com"
          icon={Mail}
          type="email"
          required
          error={errors.email}
        />
      </div>

      <div className="flex gap-4 mt-6">
        <button
          onClick={prevStep}
          className="px-6 py-4 bg-slate-800 text-slate-300 font-medium rounded-xl hover:bg-slate-700 transition-colors flex items-center gap-2"
        >
          <ChevronLeft className="w-5 h-5" />
          Atrás
        </button>
        <button
          onClick={handleContinue}
          className="flex-1 px-6 py-4 bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-semibold rounded-xl
            hover:from-indigo-600 hover:to-violet-600 transition-all duration-200 flex items-center justify-center gap-2"
        >
          Continuar
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

// ============================================
// STEP 3: Operation Preferences
// ============================================
const PreferencesStep: React.FC = () => {
  const { preferences, updatePreferences, completePreferencesStep, prevStep } = useCompanyStore();

  const handleCarrierToggle = (carrier: CarrierOption) => {
    const current = preferences.carriers;
    const updated = current.includes(carrier)
      ? current.filter((c) => c !== carrier)
      : [...current, carrier];
    updatePreferences({ carriers: updated });
  };

  const handleProductToggle = (product: ProductType) => {
    const current = preferences.productTypes;
    const updated = current.includes(product)
      ? current.filter((p) => p !== product)
      : [...current, product];
    updatePreferences({ productTypes: updated });
  };

  const handleIntegrationToggle = (integration: IntegrationType) => {
    const current = preferences.integrations;
    const updated = current.includes(integration)
      ? current.filter((i) => i !== integration)
      : [...current, integration];
    updatePreferences({ integrations: updated });
  };

  const carrierIcons: Record<CarrierOption, React.ElementType> = {
    servientrega: Truck,
    coordinadora: Truck,
    envia: Truck,
    tcc: Truck,
    interrapidisimo: Truck,
    otro: Truck,
  };

  const productIcons: Record<ProductType, React.ElementType> = {
    paqueteria: Package,
    documentos: FileText,
    fragil: Boxes,
    refrigerado: Snowflake,
    otro: FileBox,
  };

  const integrationIcons: Record<IntegrationType, React.ElementType> = {
    shopify: ShoppingCart,
    woocommerce: Store,
    api_propia: Code,
    manual: Upload,
  };

  return (
    <div className="animate-fadeIn">
      <div className="text-center mb-8">
        <div className="w-14 h-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Settings2 className="w-7 h-7 text-emerald-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Preferencias de operación</h2>
        <p className="text-slate-400">Personaliza cómo usarás LITPER</p>
      </div>

      {/* Shipping Volume */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
          <Package className="w-4 h-4" />
          Volumen de envíos mensuales
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
          {Object.entries(volumeLabels).map(([value, label]) => (
            <VolumeOption
              key={value}
              label={label}
              value={value}
              selected={preferences.shippingVolume === value}
              onChange={() => updatePreferences({ shippingVolume: value as ShippingVolume })}
            />
          ))}
        </div>
      </div>

      {/* Carriers */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
          <Truck className="w-4 h-4" />
          Transportadoras principales
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {Object.entries(carrierLabels).map(([value, label]) => (
            <CheckboxOption
              key={value}
              label={label}
              checked={preferences.carriers.includes(value as CarrierOption)}
              onChange={() => handleCarrierToggle(value as CarrierOption)}
              icon={carrierIcons[value as CarrierOption]}
            />
          ))}
        </div>
      </div>

      {/* Product Types */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
          <Boxes className="w-4 h-4" />
          Tipo de productos
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {Object.entries(productTypeLabels).map(([value, label]) => (
            <CheckboxOption
              key={value}
              label={label}
              checked={preferences.productTypes.includes(value as ProductType)}
              onChange={() => handleProductToggle(value as ProductType)}
              icon={productIcons[value as ProductType]}
            />
          ))}
        </div>
      </div>

      {/* Integrations */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
          <Link2 className="w-4 h-4" />
          Integración deseada
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {Object.entries(integrationLabels).map(([value, label]) => (
            <CheckboxOption
              key={value}
              label={label}
              checked={preferences.integrations.includes(value as IntegrationType)}
              onChange={() => handleIntegrationToggle(value as IntegrationType)}
              icon={integrationIcons[value as IntegrationType]}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-4 mt-6">
        <button
          onClick={prevStep}
          className="px-6 py-4 bg-slate-800 text-slate-300 font-medium rounded-xl hover:bg-slate-700 transition-colors flex items-center gap-2"
        >
          <ChevronLeft className="w-5 h-5" />
          Atrás
        </button>
        <button
          onClick={completePreferencesStep}
          className="flex-1 px-6 py-4 bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-semibold rounded-xl
            hover:from-indigo-600 hover:to-violet-600 transition-all duration-200 flex items-center justify-center gap-2"
        >
          Continuar
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

// ============================================
// STEP 4: Completion
// ============================================
const CompletionStep: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const { userProfile, company, preferences, completeOnboarding, prevStep } = useCompanyStore();
  const [showConfetti, setShowConfetti] = useState(true);

  const handleComplete = () => {
    completeOnboarding();
    onComplete();
  };

  // Confetti particles
  const confettiColors = ['#6366f1', '#8b5cf6', '#ec4899', '#22c55e', '#f97316', '#eab308'];

  return (
    <div className="animate-fadeIn text-center">
      {/* Confetti Animation */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-20px',
                backgroundColor: confettiColors[Math.floor(Math.random() * confettiColors.length)],
                width: `${Math.random() * 10 + 5}px`,
                height: `${Math.random() * 10 + 5}px`,
                borderRadius: Math.random() > 0.5 ? '50%' : '0',
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${Math.random() * 2 + 2}s`,
              }}
            />
          ))}
        </div>
      )}

      <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/30">
        <Sparkles className="w-10 h-10 text-white" />
      </div>

      <h2 className="text-3xl font-bold text-white mb-3">¡Todo listo!</h2>
      <p className="text-slate-400 mb-8 max-w-md mx-auto">
        Tu cuenta ha sido configurada correctamente. Estás listo para comenzar a usar LITPER.
      </p>

      {/* Summary */}
      <div className="bg-slate-800/50 rounded-2xl p-6 mb-8 text-left max-w-lg mx-auto border border-slate-700">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
          Resumen de configuración
        </h3>

        <div className="space-y-4">
          {/* Profile */}
          <div className="flex items-center gap-4 p-3 bg-slate-900/50 rounded-xl">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold text-white"
              style={{ backgroundColor: userProfile.avatarColor }}
            >
              {userProfile.fullName
                ? userProfile.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
                : 'U'}
            </div>
            <div>
              <p className="font-medium text-white">{userProfile.fullName || 'Usuario'}</p>
              <p className="text-sm text-slate-400">
                {roleLabels[userProfile.role as CompanyRole] || 'Sin rol'}
              </p>
            </div>
          </div>

          {/* Company */}
          <div className="flex items-center gap-4 p-3 bg-slate-900/50 rounded-xl">
            <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-violet-400" />
            </div>
            <div>
              <p className="font-medium text-white">{company.name || 'Empresa'}</p>
              <p className="text-sm text-slate-400">
                {company.city}, {company.country}
              </p>
            </div>
          </div>

          {/* Preferences Summary */}
          {preferences.shippingVolume && (
            <div className="flex items-center gap-4 p-3 bg-slate-900/50 rounded-xl">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Package className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="font-medium text-white">
                  {volumeLabels[preferences.shippingVolume]} / mes
                </p>
                <p className="text-sm text-slate-400">
                  {preferences.carriers.length} transportadoras
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-4 max-w-lg mx-auto">
        <button
          onClick={prevStep}
          className="px-6 py-4 bg-slate-800 text-slate-300 font-medium rounded-xl hover:bg-slate-700 transition-colors flex items-center gap-2"
        >
          <ChevronLeft className="w-5 h-5" />
          Atrás
        </button>
        <button
          onClick={handleComplete}
          className="flex-1 px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl
            hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 flex items-center justify-center gap-2
            shadow-lg shadow-emerald-500/30"
        >
          Ir al Dashboard
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {/* CSS for confetti animation */}
      <style>{`
        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti 3s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out;
        }
      `}</style>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
export const EnterpriseOnboarding: React.FC<EnterpriseOnboardingProps> = ({ onComplete }) => {
  const { currentStep, stepsCompleted, setShowEnterpriseOnboarding } = useCompanyStore();

  const handleClose = () => {
    setShowEnterpriseOnboarding(false);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <ProfileStep />;
      case 2:
        return <CompanyStep />;
      case 3:
        return <PreferencesStep />;
      case 4:
        return <CompletionStep onComplete={onComplete} />;
      default:
        return <ProfileStep />;
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/50 via-slate-950 to-violet-950/50" />

      {/* Decorative elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />

      {/* Main content */}
      <div className="relative w-full max-w-2xl">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute -top-12 right-0 text-slate-500 hover:text-slate-300 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-800 p-8 shadow-2xl">
          {/* Step indicator */}
          <StepIndicator
            currentStep={currentStep}
            totalSteps={4}
            stepsCompleted={stepsCompleted}
          />

          {/* Step content */}
          {renderStep()}
        </div>

        {/* Footer */}
        <p className="text-center text-slate-600 text-sm mt-6">
          Plataforma Enterprise de Logística con IA
        </p>
      </div>
    </div>
  );
};

export default EnterpriseOnboarding;
