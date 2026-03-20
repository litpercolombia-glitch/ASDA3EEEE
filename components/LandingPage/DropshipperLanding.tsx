// ============================================
// DROPSHIPPER LANDING PAGE
// Landing page especializada para dropshippers
// ============================================

import React from 'react';
import {
  TrendingUp,
  Calculator,
  BarChart3,
  Star,
  Truck,
  DollarSign,
  ShieldCheck,
  Zap,
  Check,
  ArrowRight,
  AlertTriangle,
  Package,
  MapPin,
  Target,
} from 'lucide-react';

interface DropshipperLandingProps {
  onLogin: () => void;
  onRegister: () => void;
}

// ============================================
// DATA
// ============================================

const painPoints = [
  { emoji: '💸', stat: '25-40%', text: 'de pedidos COD son rechazados en puerta' },
  { emoji: '📉', stat: '15%', text: 'de rentabilidad mensual se pierde por devoluciones' },
  { emoji: '🤷', stat: '90%', text: 'de dropshippers no conocen su margen REAL' },
  { emoji: '🔥', stat: '$0', text: 'herramientas que calculen rentabilidad COD en LATAM' },
];

const features = [
  {
    icon: BarChart3,
    title: 'Analytics COD',
    description: 'Tasa de rechazo por ciudad, transportadora y producto. Semaforo inteligente que te dice donde enviar y donde NO.',
    gradient: 'from-blue-500 to-indigo-500',
  },
  {
    icon: Calculator,
    title: 'Calculadora de Rentabilidad',
    description: 'Calcula tu ganancia REAL incluyendo envios, devoluciones, comisiones, y publicidad. Con analisis de sensibilidad al rechazo.',
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    icon: Star,
    title: 'Scorecard de Productos',
    description: 'Ranking automatico: cuales escalar, mantener, optimizar o eliminar. Basado en margen neto real, no bruto.',
    gradient: 'from-amber-500 to-orange-500',
  },
  {
    icon: Truck,
    title: 'Monitor de Proveedores',
    description: 'Calificacion de cumplimiento, tiempos de despacho, y tasa de devolucion por proveedor. Score de 0 a 100.',
    gradient: 'from-purple-500 to-violet-500',
  },
  {
    icon: AlertTriangle,
    title: 'Alertas Inteligentes',
    description: 'Notificaciones automaticas cuando un producto pierde dinero, una ciudad entra en rojo, o tu margen baja. Via WhatsApp.',
    gradient: 'from-red-500 to-pink-500',
  },
  {
    icon: Target,
    title: 'Import de Ads',
    description: 'Importa CSV de Facebook/TikTok Ads y ve tu ROAS real por producto. Atribuye gasto de ads a cada pedido automaticamente.',
    gradient: 'from-cyan-500 to-blue-500',
  },
];

const plans = [
  {
    name: 'Gratis',
    price: '$0',
    period: 'para siempre',
    description: 'Empieza a entender tu negocio',
    color: 'slate',
    features: [
      'Calculadora de rentabilidad',
      'Hasta 50 pedidos/mes',
      'Import Excel manual',
      'Dashboard basico',
    ],
    cta: 'Empezar Gratis',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$49.900',
    period: 'COP/mes',
    description: 'Para dropshippers serios',
    color: 'blue',
    features: [
      'Todo lo de Gratis +',
      'Pedidos ilimitados',
      'Analytics COD completo',
      'Product Scorecard',
      'Supplier Monitor',
      'Import CSV de Ads',
      'Alertas WhatsApp',
      'Sync automatico con Dropi',
      'Soporte prioritario',
    ],
    cta: 'Probar 7 Dias Gratis',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: '$199.000',
    period: 'COP/mes',
    description: 'Para operaciones grandes',
    color: 'purple',
    features: [
      'Todo lo de Pro +',
      'API de integracion',
      'Multi-tienda',
      'Dashboard equipo',
      'Reportes automaticos',
      'Soporte 24/7',
      'Onboarding personalizado',
    ],
    cta: 'Contactar Ventas',
    highlighted: false,
  },
];

const testimonials = [
  {
    text: 'Descubri que estaba perdiendo $800K al mes enviando a 3 ciudades con 40% de rechazo. Las pause y mi margen subio de 8% a 22%.',
    name: 'Carlos M.',
    role: 'Dropshipper, Bogota',
  },
  {
    text: 'La calculadora de rentabilidad me mostro que 2 de mis 5 productos me costaban dinero. Los reemplace y mi utilidad se duplico.',
    name: 'Andrea P.',
    role: 'Dropshipper, Medellin',
  },
  {
    text: 'Antes no sabia mi CPA real por producto. Ahora se exactamente cuanto invertir en ads y en que producto.',
    name: 'Diego R.',
    role: 'Dropshipper, Cali',
  },
];

// ============================================
// COMPONENT
// ============================================

export const DropshipperLanding: React.FC<DropshipperLandingProps> = ({ onLogin, onRegister }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black">Drop<span className="text-blue-400">Intel</span></span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onLogin} className="px-4 py-2 text-slate-300 hover:text-white font-medium transition-colors">
              Iniciar Sesion
            </button>
            <button onClick={onRegister} className="px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/30">
              Empezar Gratis
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="pt-32 pb-20 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 via-transparent to-transparent" />
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-full mb-6">
            <Zap className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-blue-300 font-medium">Complemento perfecto para Chatea Pro</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
            Sabe si estas{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
              ganando
            </span>{' '}
            o{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-pink-400">
              perdiendo
            </span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
            Chatea Pro te ayuda a <strong className="text-white">vender</strong>. Nosotros te ayudamos a saber si estas{' '}
            <strong className="text-emerald-400">ganando</strong>. Analytics COD, rentabilidad real, y scorecards de productos para dropshippers en Colombia.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={onRegister}
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold text-lg rounded-2xl transition-all shadow-xl shadow-blue-500/30 flex items-center gap-2"
            >
              Empezar Gratis <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={onLogin}
              className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold text-lg rounded-2xl transition-all border border-slate-700"
            >
              Ya tengo cuenta
            </button>
          </div>
        </div>
      </section>

      {/* PAIN POINTS */}
      <section className="py-16 px-6 bg-slate-900/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-center text-2xl font-bold text-slate-400 mb-10">El problema que nadie te cuenta</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {painPoints.map((p, i) => (
              <div key={i} className="text-center p-6 bg-slate-800/50 border border-slate-700/50 rounded-2xl">
                <span className="text-3xl mb-3 block">{p.emoji}</span>
                <p className="text-3xl font-black text-white mb-2">{p.stat}</p>
                <p className="text-sm text-slate-400">{p.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">
              Todo lo que necesitas para{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                ganar mas
              </span>
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              6 modulos diseñados para el dropshipper colombiano que vende contra entrega
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="group p-6 bg-slate-800/30 border border-slate-700/50 rounded-2xl hover:border-slate-600 transition-all">
                  <div className={`inline-flex p-3 bg-gradient-to-br ${f.gradient} rounded-xl mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
                  <p className="text-sm text-slate-400">{f.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-16 px-6 bg-slate-900/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-center text-2xl font-bold text-slate-400 mb-10">Lo que dicen nuestros usuarios</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="p-6 bg-slate-800/50 border border-slate-700/50 rounded-2xl">
                <p className="text-slate-300 text-sm mb-4 italic">"{t.text}"</p>
                <div>
                  <p className="font-bold text-white text-sm">{t.name}</p>
                  <p className="text-xs text-slate-500">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">Precios simples</h2>
            <p className="text-slate-400">Empieza gratis. Escala cuando quieras.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan, i) => (
              <div
                key={i}
                className={`relative p-8 rounded-2xl border ${
                  plan.highlighted
                    ? 'bg-gradient-to-b from-blue-500/10 to-slate-900 border-blue-500/50 shadow-xl shadow-blue-500/10'
                    : 'bg-slate-800/30 border-slate-700/50'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-blue-500 text-white text-xs font-bold rounded-full">
                    MAS POPULAR
                  </div>
                )}
                <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                <p className="text-sm text-slate-400 mb-4">{plan.description}</p>
                <div className="mb-6">
                  <span className="text-4xl font-black text-white">{plan.price}</span>
                  <span className="text-slate-400 ml-2">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                      <span className="text-slate-300">{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={onRegister}
                  className={`w-full py-3 rounded-xl font-bold transition-all ${
                    plan.highlighted
                      ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                      : 'bg-slate-700 hover:bg-slate-600 text-white'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-black mb-4">
            Deja de adivinar.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
              Empieza a saber.
            </span>
          </h2>
          <p className="text-slate-400 mb-8">
            Cada dia que vendes sin saber tu margen real, es un dia que podrias estar perdiendo dinero sin darte cuenta.
          </p>
          <button
            onClick={onRegister}
            className="px-10 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold text-lg rounded-2xl transition-all shadow-xl shadow-blue-500/30"
          >
            Empezar Gratis Ahora
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-8 px-6 border-t border-slate-800">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            <span>DropIntel 2026</span>
          </div>
          <p>Complemento para Chatea Pro. No somos competencia, somos tu cerebro financiero.</p>
        </div>
      </footer>
    </div>
  );
};

export default DropshipperLanding;
