// ============================================
// CENTRO DE NEGOCIO - HERRAMIENTAS OPERATIVAS
// Acceso directo para el equipo logístico
// ============================================

import React, { useState } from 'react';
import {
  Users,
  Package,
  MessageSquare,
  Megaphone,
  Bell,
  Target,
  Zap,
  Activity,
  ChevronRight,
  Search,
  TrendingUp,
  ShoppingCart,
  Headphones,
  Mail,
  BarChart3,
} from 'lucide-react';

// Importar los dashboards
import { CRMDashboard } from '../Admin/CRMCenter';
import { OrdersDashboard } from '../Admin/OrdersCenter';
import { SupportDashboard } from '../Admin/SupportCenter';
import { MarketingDashboard } from '../Admin/MarketingCenter';
import { NotificationsDashboard } from '../Admin/NotificationsCenter';

type BusinessModule = 'inicio' | 'crm' | 'pedidos' | 'soporte' | 'marketing' | 'notificaciones';

export const CentroNegocioTab: React.FC = () => {
  const [activeModule, setActiveModule] = useState<BusinessModule>('inicio');
  const [searchQuery, setSearchQuery] = useState('');

  const modules = [
    {
      id: 'crm' as BusinessModule,
      icon: Users,
      label: 'CRM Clientes',
      description: 'Gestiona clientes, segmentos y seguimiento',
      color: 'from-rose-500 to-pink-600',
      bgColor: 'bg-rose-500',
      stats: { label: 'Clientes', value: '0' },
      features: ['Segmentación automática', 'Alertas de clientes', 'Notas y plantillas'],
    },
    {
      id: 'pedidos' as BusinessModule,
      icon: Package,
      label: 'Pedidos',
      description: 'Control de pedidos y estados de envío',
      color: 'from-teal-500 to-emerald-600',
      bgColor: 'bg-teal-500',
      stats: { label: 'Activos', value: '0' },
      features: ['Pipeline de estados', 'Automatizaciones', 'Mensajes automáticos'],
    },
    {
      id: 'soporte' as BusinessModule,
      icon: Headphones,
      label: 'Soporte',
      description: 'Tickets, respuestas rápidas y chatbot',
      color: 'from-cyan-500 to-blue-600',
      bgColor: 'bg-cyan-500',
      stats: { label: 'Tickets', value: '0' },
      features: ['Sistema de tickets', 'Respuestas rápidas', 'Chatbot IA'],
    },
    {
      id: 'marketing' as BusinessModule,
      icon: Megaphone,
      label: 'Marketing',
      description: 'Campañas y automatización de mensajes',
      color: 'from-violet-500 to-purple-600',
      bgColor: 'bg-violet-500',
      stats: { label: 'Campañas', value: '0' },
      features: ['Plantillas personalizables', 'Flujos automáticos', 'Multi-canal'],
    },
    {
      id: 'notificaciones' as BusinessModule,
      icon: Bell,
      label: 'Alertas',
      description: 'Notificaciones y reglas de alerta',
      color: 'from-amber-500 to-orange-600',
      bgColor: 'bg-amber-500',
      stats: { label: 'Activas', value: '0' },
      features: ['Reglas personalizadas', 'Múltiples canales', 'Horarios silenciosos'],
    },
  ];

  // Pantalla de inicio con acceso rápido
  if (activeModule === 'inicio') {
    return (
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-8 text-white">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />

          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-4 bg-white/20 rounded-2xl backdrop-blur">
                <ShoppingCart className="w-10 h-10" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Centro de Negocio</h1>
                <p className="text-white/80">Herramientas operativas para tu equipo</p>
              </div>
            </div>

            {/* Búsqueda rápida */}
            <div className="max-w-xl mt-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar cliente, pedido, ticket..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-5 py-4 pl-12 bg-white/20 backdrop-blur border border-white/30 rounded-2xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
              </div>
            </div>
          </div>
        </div>

        {/* Accesos Rápidos */}
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            Acceso Rápido
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {modules.map((module) => (
              <button
                key={module.id}
                onClick={() => setActiveModule(module.id)}
                className="group relative overflow-hidden rounded-2xl p-6 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${module.color} text-white shadow-lg`}>
                    <module.icon className="w-6 h-6" />
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-1 transition-all" />
                </div>

                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">
                  {module.label}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                  {module.description}
                </p>

                {/* Features */}
                <div className="space-y-1">
                  {module.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-400">
                      <div className={`w-1.5 h-1.5 rounded-full ${module.bgColor}`} />
                      {feature}
                    </div>
                  ))}
                </div>

                {/* Hover gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${module.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
              </button>
            ))}
          </div>
        </div>

        {/* Resumen del día */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: 'Pedidos Hoy', value: '0', icon: Package, color: 'text-teal-600', bg: 'bg-teal-50 dark:bg-teal-900/20' },
            { label: 'Tickets Abiertos', value: '0', icon: Headphones, color: 'text-cyan-600', bg: 'bg-cyan-50 dark:bg-cyan-900/20' },
            { label: 'Clientes Nuevos', value: '0', icon: Users, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-900/20' },
            { label: 'Mensajes Enviados', value: '0', icon: Mail, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-900/20' },
            { label: 'Alertas Activas', value: '0', icon: Bell, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
          ].map((stat, idx) => (
            <div key={idx} className={`${stat.bg} rounded-2xl p-5 border border-slate-100 dark:border-navy-700`}>
              <div className="flex items-center justify-between mb-2">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                <span className={`text-2xl font-bold ${stat.color}`}>{stat.value}</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Tips */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-6 border border-indigo-100 dark:border-indigo-800">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
              <Target className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white mb-2">
                Tip del día
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Usa el <strong>CRM</strong> para segmentar clientes automáticamente.
                Los clientes VIP se identifican cuando superan cierto monto de compras.
                Configura las reglas en la sección de segmentos.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Renderizar el módulo seleccionado
  return (
    <div className="animate-fade-in">
      {/* Breadcrumb / Back button */}
      <div className="mb-6">
        <button
          onClick={() => setActiveModule('inicio')}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
        >
          <ChevronRight className="w-4 h-4 rotate-180" />
          <span>Volver al Centro de Negocio</span>
        </button>
      </div>

      {/* Module Content */}
      <div className="bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-700 overflow-hidden">
        {activeModule === 'crm' && <CRMDashboard />}
        {activeModule === 'pedidos' && <OrdersDashboard />}
        {activeModule === 'soporte' && <SupportDashboard />}
        {activeModule === 'marketing' && <MarketingDashboard />}
        {activeModule === 'notificaciones' && <NotificationsDashboard />}
      </div>
    </div>
  );
};

export default CentroNegocioTab;
