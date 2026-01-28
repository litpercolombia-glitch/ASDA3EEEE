/**
 * CustomerPortalDashboard
 *
 * Dashboard principal del portal de autoservicio para clientes.
 */

import React, { useState, useEffect } from 'react';
import {
  Package,
  Truck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Search,
  MapPin,
  Calendar,
  ChevronRight,
  Bell,
  User,
  Settings,
  HelpCircle,
  FileText,
  ExternalLink,
  MessageSquare,
  Box,
  ArrowRight,
  RefreshCw,
  Eye,
} from 'lucide-react';
import type {
  PortalCustomer,
  CustomerShipment,
  CustomerOrder,
  PortalNotification,
  ShipmentStatus,
} from '@/types/customerPortal.types';

interface CustomerPortalDashboardProps {
  customer: PortalCustomer;
  onTrack?: (trackingNumber: string) => void;
  onViewShipment?: (shipment: CustomerShipment) => void;
  onViewOrder?: (order: CustomerOrder) => void;
  onRequestReturn?: (orderId: string) => void;
  onContactSupport?: () => void;
}

// Mock data for demo
const MOCK_SHIPMENTS: CustomerShipment[] = [
  {
    id: '1',
    trackingNumber: 'LP-2024-001234',
    orderNumber: 'ORD-5678',
    status: 'in_transit',
    carrier: 'Servientrega',
    originCity: 'Bogotá',
    destinationCity: 'Medellín',
    destinationAddress: 'Calle 10 # 20-30, Apto 501',
    recipientName: 'Juan Pérez',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    shippedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    estimatedDelivery: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    deliveredAt: null,
    packageInfo: { weight: 2.5, description: 'Electrónicos' },
    events: [],
    currentLocation: 'Centro de distribución Medellín',
    documents: {},
    actions: { canRequestReturn: false, canChangeAddress: true, canReschedule: true, canAddInstructions: true },
  },
  {
    id: '2',
    trackingNumber: 'LP-2024-001235',
    orderNumber: 'ORD-5679',
    status: 'out_for_delivery',
    carrier: 'Coordinadora',
    originCity: 'Cali',
    destinationCity: 'Bogotá',
    destinationAddress: 'Carrera 7 # 45-67',
    recipientName: 'Juan Pérez',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    shippedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    estimatedDelivery: new Date(),
    deliveredAt: null,
    packageInfo: { weight: 1.2, description: 'Ropa' },
    events: [],
    currentLocation: 'En reparto',
    documents: {},
    actions: { canRequestReturn: false, canChangeAddress: false, canReschedule: false, canAddInstructions: true },
  },
];

const STATUS_CONFIG: Record<ShipmentStatus, {
  label: string;
  color: string;
  bgColor: string;
  icon: React.ReactNode;
}> = {
  pending: { label: 'Pendiente', color: 'text-slate-600', bgColor: 'bg-slate-100', icon: <Clock className="w-4 h-4" /> },
  picked_up: { label: 'Recogido', color: 'text-blue-600', bgColor: 'bg-blue-100', icon: <Package className="w-4 h-4" /> },
  in_transit: { label: 'En tránsito', color: 'text-amber-600', bgColor: 'bg-amber-100', icon: <Truck className="w-4 h-4" /> },
  in_customs: { label: 'En aduana', color: 'text-purple-600', bgColor: 'bg-purple-100', icon: <FileText className="w-4 h-4" /> },
  out_for_delivery: { label: 'En reparto', color: 'text-cyan-600', bgColor: 'bg-cyan-100', icon: <MapPin className="w-4 h-4" /> },
  delivered: { label: 'Entregado', color: 'text-green-600', bgColor: 'bg-green-100', icon: <CheckCircle2 className="w-4 h-4" /> },
  failed_attempt: { label: 'Intento fallido', color: 'text-orange-600', bgColor: 'bg-orange-100', icon: <AlertTriangle className="w-4 h-4" /> },
  returned: { label: 'Devuelto', color: 'text-red-600', bgColor: 'bg-red-100', icon: <RotateCcw className="w-4 h-4" /> },
  exception: { label: 'Excepción', color: 'text-rose-600', bgColor: 'bg-rose-100', icon: <AlertTriangle className="w-4 h-4" /> },
  cancelled: { label: 'Cancelado', color: 'text-slate-400', bgColor: 'bg-slate-200', icon: <Clock className="w-4 h-4" /> },
};

export const CustomerPortalDashboard: React.FC<CustomerPortalDashboardProps> = ({
  customer,
  onTrack,
  onViewShipment,
  onViewOrder,
  onRequestReturn,
  onContactSupport,
}) => {
  const [trackingInput, setTrackingInput] = useState('');
  const [shipments] = useState<CustomerShipment[]>(MOCK_SHIPMENTS);
  const [isLoading, setIsLoading] = useState(false);

  // Formatear fecha
  const formatDate = (date: Date | null): string => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Formatear fecha relativa
  const formatRelativeDate = (date: Date | null): string => {
    if (!date) return '-';
    const now = new Date();
    const d = new Date(date);
    const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Mañana';
    if (diffDays === -1) return 'Ayer';
    if (diffDays > 0 && diffDays <= 7) return `En ${diffDays} días`;
    if (diffDays < 0 && diffDays >= -7) return `Hace ${Math.abs(diffDays)} días`;

    return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
  };

  // Buscar tracking
  const handleTrack = () => {
    if (trackingInput.trim()) {
      onTrack?.(trackingInput.trim());
    }
  };

  const activeShipments = shipments.filter(s =>
    !['delivered', 'returned', 'cancelled'].includes(s.status)
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                L
              </div>
              <span className="font-semibold text-slate-900 dark:text-white">
                LITPER PRO
              </span>
            </div>

            <div className="flex items-center gap-4">
              <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>

              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 hidden sm:block">
                  {customer.firstName}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            ¡Hola, {customer.firstName}! 👋
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Aquí puedes ver el estado de tus envíos y gestionar tus pedidos.
          </p>
        </div>

        {/* Quick Track */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 mb-8 text-white">
          <h2 className="text-lg font-semibold mb-4">Rastrear un envío</h2>
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300" />
              <input
                type="text"
                value={trackingInput}
                onChange={(e) => setTrackingInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleTrack()}
                placeholder="Ingresa tu número de guía..."
                className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
            </div>
            <button
              onClick={handleTrack}
              className="px-6 py-3 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-colors"
            >
              Rastrear
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <Truck className="w-5 h-5 text-amber-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {activeShipments.length}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Envíos activos
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {customer.stats.completedDeliveries}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Entregados
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Box className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {customer.stats.totalOrders}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Pedidos totales
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <RotateCcw className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {customer.stats.returnRequests}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Devoluciones
            </p>
          </div>
        </div>

        {/* Active Shipments */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 mb-8">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 dark:text-white">
              Envíos en curso
            </h3>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
              Ver todos
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {activeShipments.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400">
                No tienes envíos activos
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {activeShipments.map((shipment) => {
                const statusConfig = STATUS_CONFIG[shipment.status];

                return (
                  <div
                    key={shipment.id}
                    className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                    onClick={() => onViewShipment?.(shipment)}
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={`p-3 rounded-xl ${statusConfig.bgColor} dark:bg-opacity-30`}>
                        <span className={statusConfig.color}>{statusConfig.icon}</span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {shipment.trackingNumber}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${statusConfig.bgColor} ${statusConfig.color}`}>
                            {statusConfig.label}
                          </span>
                        </div>

                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                          {shipment.originCity} → {shipment.destinationCity}
                        </p>

                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {shipment.currentLocation}
                          </span>
                          {shipment.estimatedDelivery && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Entrega: {formatRelativeDate(shipment.estimatedDelivery)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewShipment?.(shipment);
                          }}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <ChevronRight className="w-5 h-5 text-slate-300" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => onTrack?.('')}
            className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 transition-colors text-left group"
          >
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg w-fit mb-3 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
              <Search className="w-5 h-5 text-blue-600" />
            </div>
            <p className="font-medium text-slate-900 dark:text-white">Rastrear envío</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Consulta el estado de tu paquete
            </p>
          </button>

          <button
            onClick={onRequestReturn}
            className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700 transition-colors text-left group"
          >
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg w-fit mb-3 group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
              <RotateCcw className="w-5 h-5 text-purple-600" />
            </div>
            <p className="font-medium text-slate-900 dark:text-white">Devoluciones</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Solicita una devolución
            </p>
          </button>

          <button
            onClick={onContactSupport}
            className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-green-300 dark:hover:border-green-700 transition-colors text-left group"
          >
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg w-fit mb-3 group-hover:bg-green-200 dark:group-hover:bg-green-900/50 transition-colors">
              <MessageSquare className="w-5 h-5 text-green-600" />
            </div>
            <p className="font-medium text-slate-900 dark:text-white">Soporte</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Contáctanos para ayuda
            </p>
          </button>

          <button
            className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-700 transition-colors text-left group"
          >
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg w-fit mb-3 group-hover:bg-amber-200 dark:group-hover:bg-amber-900/50 transition-colors">
              <HelpCircle className="w-5 h-5 text-amber-600" />
            </div>
            <p className="font-medium text-slate-900 dark:text-white">Ayuda</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Preguntas frecuentes
            </p>
          </button>
        </div>
      </main>
    </div>
  );
};

export default CustomerPortalDashboard;
