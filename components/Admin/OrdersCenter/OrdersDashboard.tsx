// components/Admin/OrdersCenter/OrdersDashboard.tsx
// Dashboard de Gestión de Pedidos

import React, { useState, useMemo } from 'react';
import {
  Package,
  Search,
  Filter,
  Plus,
  Eye,
  Clock,
  CheckCircle,
  Truck,
  MapPin,
  XCircle,
  RotateCcw,
  AlertTriangle,
  MessageCircle,
  ChevronRight,
  ChevronDown,
  Settings,
  Zap,
  FileText,
  X,
  Phone,
  Mail,
  DollarSign,
  Calendar,
  Navigation,
  Bike,
  Send
} from 'lucide-react';
import { useOrders, type Order, type OrderStatus, ORDER_STATUS_CONFIG } from '../../../services/ordersService';

export function OrdersDashboard() {
  const {
    orders,
    statusConfig,
    automations,
    messageTemplates,
    changeStatus,
    addNote,
    toggleAutomation,
    searchOrders,
    statusStats,
    pendingOrders,
    ordersWithIssues,
    activeAutomations,
  } = useOrders();

  const [activeTab, setActiveTab] = useState<'pedidos' | 'pipeline' | 'automatizaciones' | 'plantillas'>('pedidos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'todos'>('todos');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newNote, setNewNote] = useState('');

  const filteredOrders = useMemo(() => {
    let result = orders;

    if (searchQuery) {
      result = searchOrders(searchQuery);
    }

    if (selectedStatus !== 'todos') {
      result = result.filter(o => o.estado === selectedStatus);
    }

    return result;
  }, [orders, searchQuery, selectedStatus]);

  const getStatusIcon = (status: OrderStatus) => {
    const icons: Record<OrderStatus, React.ReactNode> = {
      pendiente: <Clock className="w-4 h-4" />,
      confirmado: <CheckCircle className="w-4 h-4" />,
      en_preparacion: <Package className="w-4 h-4" />,
      enviado: <Truck className="w-4 h-4" />,
      en_transito: <Navigation className="w-4 h-4" />,
      en_ciudad_destino: <MapPin className="w-4 h-4" />,
      en_reparto: <Bike className="w-4 h-4" />,
      entregado: <CheckCircle className="w-4 h-4" />,
      devolucion: <RotateCcw className="w-4 h-4" />,
      cancelado: <XCircle className="w-4 h-4" />,
      reembolsado: <DollarSign className="w-4 h-4" />,
    };
    return icons[status];
  };

  const getStatusColor = (status: OrderStatus) => {
    const config = statusConfig.find(c => c.id === status);
    return config?.color || '#6B7280';
  };

  const getStatusName = (status: OrderStatus) => {
    const config = statusConfig.find(c => c.id === status);
    return config?.nombre || status;
  };

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    changeStatus(orderId, newStatus);
  };

  const handleAddNote = () => {
    if (!selectedOrder || !newNote.trim()) return;
    addNote(selectedOrder.id, {
      contenido: newNote,
      tipo: 'interna',
      creadoPor: 'Admin',
    });
    setNewNote('');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Pipeline view data
  const pipelineStages: OrderStatus[] = ['pendiente', 'confirmado', 'en_preparacion', 'enviado', 'en_transito', 'entregado'];

  const tabs = [
    { id: 'pedidos', label: 'Todos los Pedidos', icon: Package, count: orders.length },
    { id: 'pipeline', label: 'Pipeline', icon: ChevronRight },
    { id: 'automatizaciones', label: 'Automatizaciones', icon: Zap, count: activeAutomations.length },
    { id: 'plantillas', label: 'Plantillas', icon: FileText, count: messageTemplates.length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-orange-500/20 rounded-xl">
            <Package className="w-8 h-8 text-orange-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Gestión de Pedidos</h2>
            <p className="text-gray-400">Control total de tus órdenes</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {ordersWithIssues.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-500/20 text-red-400 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
              {ordersWithIssues.length} con problemas
            </div>
          )}
          <button className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
            <Plus className="w-4 h-4" />
            Nuevo Pedido
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {['pendiente', 'confirmado', 'enviado', 'en_transito', 'entregado', 'devolucion'].map((status) => (
          <button
            key={status}
            onClick={() => setSelectedStatus(status as OrderStatus)}
            className={`p-3 rounded-xl border transition-all ${
              selectedStatus === status
                ? 'border-orange-500 bg-orange-500/10'
                : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className="p-1.5 rounded-lg"
                style={{ backgroundColor: `${getStatusColor(status as OrderStatus)}20` }}
              >
                <span style={{ color: getStatusColor(status as OrderStatus) }}>
                  {getStatusIcon(status as OrderStatus)}
                </span>
              </div>
              <span className="text-sm text-gray-400">{getStatusName(status as OrderStatus)}</span>
            </div>
            <p className="text-2xl font-bold text-white">{statusStats[status as OrderStatus]}</p>
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-700 pb-2 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-orange-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.count !== undefined && (
              <span className={`px-2 py-0.5 text-xs rounded-full ${
                activeTab === tab.id ? 'bg-orange-500' : 'bg-gray-600'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="min-h-[500px]">
        {/* Pedidos Tab */}
        {activeTab === 'pedidos' && (
          <div className="space-y-4">
            {/* Search */}
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por número, cliente, guía..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as any)}
                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
              >
                <option value="todos">Todos los estados</option>
                {statusConfig.map((config) => (
                  <option key={config.id} value={config.id}>
                    {config.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Orders List */}
            <div className="space-y-3">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className={`p-4 bg-gray-800/50 rounded-xl border transition-all cursor-pointer hover:border-orange-500/50 ${
                    order.isPriority ? 'border-yellow-500/50' : 'border-gray-700'
                  }`}
                  onClick={() => setSelectedOrder(order)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: `${getStatusColor(order.estado)}20` }}
                      >
                        <span style={{ color: getStatusColor(order.estado) }}>
                          {getStatusIcon(order.estado)}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-white">{order.numeroOrden}</h4>
                          {order.isPriority && (
                            <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-xs">
                              Prioritario
                            </span>
                          )}
                          {order.hasIssue && (
                            <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-xs flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              {order.issueType}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-400 mt-1">
                          <span>{order.customerName}</span>
                          <span>•</span>
                          <span>{order.ciudad}</span>
                          <span>•</span>
                          <span>{formatDate(order.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-400">{formatCurrency(order.total)}</p>
                      <p
                        className="text-sm font-medium"
                        style={{ color: getStatusColor(order.estado) }}
                      >
                        {getStatusName(order.estado)}
                      </p>
                    </div>
                  </div>

                  {/* Quick Info */}
                  {order.guia && (
                    <div className="mt-3 pt-3 border-t border-gray-700 flex items-center gap-4 text-sm">
                      <span className="text-gray-400">
                        Guía: <span className="text-white font-mono">{order.guia}</span>
                      </span>
                      <span className="text-gray-400">
                        Transportadora: <span className="text-white">{order.transportadora}</span>
                      </span>
                    </div>
                  )}
                </div>
              ))}

              {filteredOrders.length === 0 && (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 mx-auto text-gray-600 mb-4" />
                  <p className="text-gray-400">No se encontraron pedidos</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pipeline Tab */}
        {activeTab === 'pipeline' && (
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-max">
              {pipelineStages.map((stage) => {
                const stageOrders = orders.filter(o => o.estado === stage);
                return (
                  <div key={stage} className="w-72 flex-shrink-0">
                    <div
                      className="p-3 rounded-t-xl flex items-center justify-between"
                      style={{ backgroundColor: `${getStatusColor(stage)}20` }}
                    >
                      <div className="flex items-center gap-2">
                        <span style={{ color: getStatusColor(stage) }}>
                          {getStatusIcon(stage)}
                        </span>
                        <span className="font-medium text-white">{getStatusName(stage)}</span>
                      </div>
                      <span
                        className="px-2 py-0.5 rounded text-sm font-bold"
                        style={{ backgroundColor: getStatusColor(stage), color: 'white' }}
                      >
                        {stageOrders.length}
                      </span>
                    </div>
                    <div className="bg-gray-800/30 rounded-b-xl p-2 min-h-[400px] space-y-2">
                      {stageOrders.map((order) => (
                        <div
                          key={order.id}
                          onClick={() => setSelectedOrder(order)}
                          className="p-3 bg-gray-800 rounded-lg border border-gray-700 hover:border-orange-500/50 cursor-pointer transition-all"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-mono text-sm text-white">{order.numeroOrden}</span>
                            <span className="text-sm font-bold text-green-400">{formatCurrency(order.total)}</span>
                          </div>
                          <p className="text-sm text-gray-400 truncate">{order.customerName}</p>
                          <p className="text-xs text-gray-500 mt-1">{order.ciudad}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Automatizaciones Tab */}
        {activeTab === 'automatizaciones' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-gray-400">{automations.length} automatizaciones configuradas</p>
              <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                <Plus className="w-4 h-4" />
                Nueva Automatización
              </button>
            </div>

            <div className="space-y-3">
              {automations.map((auto) => (
                <div
                  key={auto.id}
                  className={`p-4 rounded-xl border ${
                    auto.isActive ? 'border-green-500/50 bg-green-500/5' : 'border-gray-700 bg-gray-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${auto.isActive ? 'bg-green-500/20' : 'bg-gray-700'}`}>
                        <Zap className={`w-5 h-5 ${auto.isActive ? 'text-green-400' : 'text-gray-400'}`} />
                      </div>
                      <div>
                        <h4 className="font-medium text-white">{auto.nombre}</h4>
                        <p className="text-sm text-gray-400">{auto.descripcion}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleAutomation(auto.id)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${
                        auto.isActive
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-gray-700 text-gray-400'
                      }`}
                    >
                      {auto.isActive ? 'Activa' : 'Inactiva'}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="p-3 bg-gray-700/50 rounded-lg">
                      <p className="text-gray-400 mb-1">Trigger:</p>
                      <code className="text-orange-400">{auto.trigger.tipo}</code>
                    </div>
                    <div className="p-3 bg-gray-700/50 rounded-lg">
                      <p className="text-gray-400 mb-1">Acciones:</p>
                      <p className="text-white">{auto.acciones.length} configuradas</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Plantillas Tab */}
        {activeTab === 'plantillas' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-gray-400">{messageTemplates.length} plantillas de mensaje</p>
              <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                <Plus className="w-4 h-4" />
                Nueva Plantilla
              </button>
            </div>

            <div className="grid gap-4">
              {messageTemplates.map((template) => (
                <div
                  key={template.id}
                  className={`p-4 rounded-xl border ${
                    template.isActive ? 'border-purple-500/50 bg-purple-500/5' : 'border-gray-700 bg-gray-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: `${getStatusColor(template.estado)}20` }}
                      >
                        <MessageCircle
                          className="w-5 h-5"
                          style={{ color: getStatusColor(template.estado) }}
                        />
                      </div>
                      <div>
                        <h4 className="font-medium text-white">{template.nombre}</h4>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <span>Estado: {getStatusName(template.estado)}</span>
                          <span>•</span>
                          <span className="capitalize">{template.canal}</span>
                        </div>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${
                      template.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'
                    }`}>
                      {template.isActive ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>

                  <div className="p-3 bg-gray-700/50 rounded-lg">
                    <p className="text-sm text-gray-300 whitespace-pre-wrap">{template.mensaje}</p>
                  </div>

                  <div className="flex gap-1 mt-3">
                    {template.variables.map((v, i) => (
                      <code key={i} className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-xs">
                        {`{{${v}}}`}
                      </code>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden border border-gray-700">
            {/* Header */}
            <div
              className="p-4 flex items-center justify-between"
              style={{ backgroundColor: `${getStatusColor(selectedOrder.estado)}20` }}
            >
              <div className="flex items-center gap-3">
                <span style={{ color: getStatusColor(selectedOrder.estado) }}>
                  {getStatusIcon(selectedOrder.estado)}
                </span>
                <div>
                  <h3 className="font-bold text-white">{selectedOrder.numeroOrden}</h3>
                  <span
                    className="text-sm font-medium"
                    style={{ color: getStatusColor(selectedOrder.estado) }}
                  >
                    {getStatusName(selectedOrder.estado)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 hover:bg-white/10 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto max-h-[calc(90vh-150px)]">
              {/* Customer & Shipping */}
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-gray-700/50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-400 mb-3">Cliente</h4>
                  <p className="font-medium text-white mb-2">{selectedOrder.customerName}</p>
                  <div className="space-y-1 text-sm text-gray-400">
                    <p className="flex items-center gap-2">
                      <Phone className="w-3 h-3" />
                      {selectedOrder.customerPhone}
                    </p>
                    <p className="flex items-center gap-2">
                      <Mail className="w-3 h-3" />
                      {selectedOrder.customerEmail}
                    </p>
                  </div>
                </div>
                <div className="p-4 bg-gray-700/50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-400 mb-3">Envío</h4>
                  <p className="text-white mb-1">{selectedOrder.direccion}</p>
                  <p className="text-sm text-gray-400">{selectedOrder.ciudad}, {selectedOrder.departamento}</p>
                  {selectedOrder.guia && (
                    <p className="text-sm text-orange-400 mt-2">
                      Guía: <span className="font-mono">{selectedOrder.guia}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Products */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-400 mb-3">Productos</h4>
                <div className="space-y-2">
                  {selectedOrder.productos.map((prod) => (
                    <div key={prod.id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                      <div>
                        <p className="text-white">{prod.nombre}</p>
                        <p className="text-sm text-gray-400">SKU: {prod.sku} × {prod.cantidad}</p>
                      </div>
                      <p className="font-medium text-green-400">{formatCurrency(prod.precioTotal)}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 p-3 bg-gray-700/50 rounded-lg flex justify-between">
                  <span className="font-medium text-white">Total</span>
                  <span className="font-bold text-green-400 text-lg">{formatCurrency(selectedOrder.total)}</span>
                </div>
              </div>

              {/* Status Change */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-400 mb-3">Cambiar Estado</h4>
                <div className="flex flex-wrap gap-2">
                  {statusConfig
                    .find(c => c.id === selectedOrder.estado)
                    ?.siguientesEstados.map((nextStatus) => (
                      <button
                        key={nextStatus}
                        onClick={() => handleStatusChange(selectedOrder.id, nextStatus)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-600 hover:border-orange-500 transition-colors"
                        style={{ color: getStatusColor(nextStatus) }}
                      >
                        {getStatusIcon(nextStatus)}
                        {getStatusName(nextStatus)}
                      </button>
                    ))}
                </div>
              </div>

              {/* Timeline */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-400 mb-3">Timeline</h4>
                <div className="space-y-3">
                  {selectedOrder.timeline.map((event, idx) => (
                    <div key={event.id} className="flex gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${getStatusColor(event.estado)}20` }}
                      >
                        <span style={{ color: getStatusColor(event.estado) }}>
                          {getStatusIcon(event.estado)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-white">{event.descripcion}</p>
                        <p className="text-xs text-gray-500">{formatDate(event.fecha)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-3">Notas</h4>
                <div className="space-y-2 mb-3">
                  {selectedOrder.notas.map((note) => (
                    <div key={note.id} className="p-3 bg-gray-700/50 rounded-lg">
                      <p className="text-sm text-white">{note.contenido}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {note.creadoPor} • {formatDate(note.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Agregar nota..."
                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddNote()}
                  />
                  <button
                    onClick={handleAddNote}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrdersDashboard;
