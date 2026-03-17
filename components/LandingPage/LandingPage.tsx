import React from "react";
import {
  Package,
  Brain,
  MessageCircle,
  BarChart3,
  Shield,
  Zap,
  Check,
  ArrowRight,
  Truck,
  Star,
} from "lucide-react";

interface LandingPageProps {
  onLogin: () => void;
  onRegister: () => void;
}

const stats = [
  { value: "5+", label: "Transportadoras" },
  { value: "10,000+", label: "Envios" },
  { value: "99.9%", label: "Uptime" },
  { value: "IA", label: "Predictiva" },
];

const features = [
  {
    icon: Package,
    title: "Tracking Multi-Carrier",
    description:
      "Rastrea envios de todas las transportadoras colombianas en un solo lugar. Coordinadora, Servientrega, TCC, Envia y mas.",
  },
  {
    icon: Brain,
    title: "IA Predictiva",
    description:
      "Anticipa retrasos, optimiza rutas y predice tiempos de entrega con precision usando inteligencia artificial avanzada.",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp Automatico",
    description:
      "Notificaciones automaticas a tus clientes por WhatsApp con actualizaciones en tiempo real de sus envios.",
  },
  {
    icon: BarChart3,
    title: "Dashboard Analytics",
    description:
      "Visualiza metricas clave, identifica cuellos de botella y toma decisiones basadas en datos en tiempo real.",
  },
  {
    icon: Zap,
    title: "Cerebro Autonomo",
    description:
      "Motor de automatizacion que toma decisiones inteligentes para optimizar toda tu cadena logistica sin intervencion manual.",
  },
  {
    icon: Shield,
    title: "Gestion de Riesgo",
    description:
      "Detecta anomalias, previene perdidas y protege tus envios con monitoreo continuo y alertas inteligentes.",
  },
];

const pricingTiers = [
  {
    name: "Starter",
    price: "Gratis",
    period: "",
    description: "Perfecto para emprendedores que inician",
    features: [
      "100 guias/mes",
      "1 transportadora",
      "Tracking basico",
      "Dashboard simple",
      "Soporte por email",
    ],
    cta: "Comenzar Gratis",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$149,000",
    period: "COP/mes",
    description: "Para negocios en crecimiento",
    features: [
      "5,000 guias/mes",
      "Todas las transportadoras",
      "IA predictiva",
      "WhatsApp automatico",
      "Dashboard analytics avanzado",
      "Soporte prioritario",
    ],
    cta: "Empezar con Pro",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "$499,000",
    period: "COP/mes",
    description: "Para operaciones a gran escala",
    features: [
      "Guias ilimitadas",
      "API completa",
      "Soporte prioritario 24/7",
      "SLA garantizado",
      "Cerebro autonomo",
      "Integraciones personalizadas",
      "Account manager dedicado",
    ],
    cta: "Contactar Ventas",
    highlighted: false,
  },
];

const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onRegister }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Truck className="h-7 w-7 text-emerald-400" />
            <span className="text-xl font-bold tracking-tight">
              Envi<span className="text-emerald-400">IA</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onLogin}
              className="rounded-lg px-5 py-2 text-sm font-medium text-slate-300 transition-colors hover:text-white"
            >
              Iniciar Sesion
            </button>
            <button
              onClick={onRegister}
              className="rounded-lg bg-emerald-500 px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-500/25"
            >
              Registrarse
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative flex min-h-screen items-center justify-center px-6 pt-20">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-1/4 h-96 w-96 -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="absolute right-1/4 top-1/3 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="absolute bottom-1/4 left-1/4 h-72 w-72 rounded-full bg-violet-500/8 blur-3xl" />
        </div>

        <div className="relative z-10 mx-auto max-w-5xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-sm text-emerald-400">
            <Star className="h-4 w-4" />
            <span>La plataforma #1 de logistica inteligente en Colombia</span>
          </div>

          <h1 className="mb-6 text-5xl font-extrabold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
            <span className="bg-gradient-to-r from-white via-emerald-200 to-emerald-400 bg-clip-text text-transparent">
              Plataforma de Logistica
            </span>
            <br />
            <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent">
              con IA para Colombia
            </span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-slate-400 sm:text-xl">
            Rastrea, predice y optimiza todos tus envios en un solo lugar.
            Conecta con las principales transportadoras colombianas y lleva tu
            logistica al siguiente nivel con inteligencia artificial.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <button
              onClick={onRegister}
              className="group flex items-center gap-2 rounded-xl bg-emerald-500 px-8 py-3.5 text-lg font-semibold text-white transition-all hover:bg-emerald-400 hover:shadow-xl hover:shadow-emerald-500/25"
            >
              Comenzar Gratis
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </button>
            <button
              onClick={onLogin}
              className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/50 px-8 py-3.5 text-lg font-semibold text-slate-300 transition-all hover:border-slate-600 hover:bg-slate-800/50 hover:text-white"
            >
              Ya tengo cuenta
            </button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative border-y border-slate-800/60 bg-slate-900/40 py-16">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 px-6 sm:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-extrabold text-emerald-400 sm:text-4xl">
                {stat.value}
              </div>
              <div className="mt-1 text-sm font-medium text-slate-400">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Todo lo que necesitas para tu{" "}
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                logistica
              </span>
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-slate-400">
              Herramientas poderosas impulsadas por inteligencia artificial para
              optimizar cada aspecto de tus envios.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="group rounded-2xl border border-slate-800/60 bg-slate-900/40 p-7 transition-all hover:border-emerald-500/30 hover:bg-slate-900/60 hover:shadow-lg hover:shadow-emerald-500/5"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 transition-colors group-hover:bg-emerald-500/20">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-lg font-bold">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-400">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Planes que se adaptan a tu{" "}
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                negocio
              </span>
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-slate-400">
              Desde emprendedores hasta grandes empresas, tenemos el plan
              perfecto para ti.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {pricingTiers.map((tier) => (
              <div
                key={tier.name}
                className={`relative rounded-2xl border p-8 transition-all ${
                  tier.highlighted
                    ? "border-emerald-500/50 bg-gradient-to-b from-emerald-500/10 to-slate-900/80 shadow-xl shadow-emerald-500/10"
                    : "border-slate-800/60 bg-slate-900/40 hover:border-slate-700"
                }`}
              >
                {tier.highlighted && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-4 py-1 text-xs font-bold uppercase tracking-wider text-white">
                    Mas Popular
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-lg font-bold">{tier.name}</h3>
                  <p className="mt-1 text-sm text-slate-400">
                    {tier.description}
                  </p>
                </div>

                <div className="mb-6">
                  <span className="text-4xl font-extrabold">{tier.price}</span>
                  {tier.period && (
                    <span className="ml-1 text-sm text-slate-400">
                      {tier.period}
                    </span>
                  )}
                </div>

                <ul className="mb-8 space-y-3">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                      <span className="text-sm text-slate-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={onRegister}
                  className={`w-full rounded-xl py-3 text-sm font-semibold transition-all ${
                    tier.highlighted
                      ? "bg-emerald-500 text-white hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-500/25"
                      : "border border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-600 hover:bg-slate-700/50 hover:text-white"
                  }`}
                >
                  {tier.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="border-t border-slate-800/60 py-24 px-6">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center justify-center rounded-full bg-emerald-500/10 p-4">
            <Truck className="h-10 w-10 text-emerald-400" />
          </div>
          <h2 className="mb-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Empieza a rastrear tus envios{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              hoy
            </span>
          </h2>
          <p className="mx-auto mb-8 max-w-xl text-lg text-slate-400">
            Unete a miles de negocios colombianos que ya optimizan su logistica
            con inteligencia artificial.
          </p>
          <button
            onClick={onRegister}
            className="group inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-8 py-3.5 text-lg font-semibold text-white transition-all hover:bg-emerald-400 hover:shadow-xl hover:shadow-emerald-500/25"
          >
            Crear Cuenta Gratis
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-8 px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Truck className="h-4 w-4" />
            <span>
              EnviIA &copy; {new Date().getFullYear()}. Todos los derechos
              reservados.
            </span>
          </div>
          <div className="text-sm text-slate-600">Hecho en Colombia</div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
