// components/Admin/CRMCenter/CRMDashboard.tsx
// Dashboard CRM Completo

import React, { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Crown,
  Repeat,
  AlertTriangle,
  UserX,
  Search,
  Filter,
  Plus,
  Eye,
  Edit2,
  Trash2,
  Tag,
  MessageCircle,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  TrendingUp,
  Heart,
  Star,
  Settings,
  X,
  Check,
  ChevronRight,
  Clock,
  Sparkles,
  Bell,
  FileText
} from 'lucide-react';
import { useCRM, type Customer, type CustomerSegment, type SegmentRule } from '../../../services/crmService';

export function CRMDashboard() {
  const {
    customers,
    segmentRules,
    customFields,
    alerts,
    noteTemplates,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    addSegmentRule,
    updateSegmentRule,
    deleteSegmentRule,
    addNote,
    addTag,
    removeTag,
    runSegmentation,
    generateAlerts,
    markAlertRead,
    dismissAlert,
    searchCustomers,
    getCustomersBySegment,
    activeAlerts,
    unreadAlerts,
    segmentStats,
  } = useCRM();

  const [activeTab, setActiveTab] = useState<'clientes' | 'segmentos' | 'alertas' | 'config'>('clientes');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSegment, setSelectedSegment] = useState<CustomerSegment | 'todos'>('todos');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showSegmentModal, setShowSegmentModal] = useState(false);
  const [editingSegment, setEditingSegment] = useState<SegmentRule | null>(null);

  // Nuevo cliente form
  const [newCustomer, setNewCustomer] = useState({
    nombre: '',
    email: '',
    telefono: '',
    whatsapp: '',
    ciudad: '',
    direccion: '',
  });

  // Nuevo segmento form
  const [newSegment, setNewSegment] = useState({
    nombre: '',
    segmento: 'potencial' as CustomerSegment,
    condiciones: [{ campo: 'totalCompras', operador: 'mayor', valor: 0 }],
    color: '#3B82F6',
    descripcion: '',
  });

  // Nueva nota
  const [newNote, setNewNote] = useState('');
  const [newTag, setNewTag] = useState('');

  const filteredCustomers = useMemo(() => {
    let result = customers;

    if (searchQuery) {
      result = searchCustomers(searchQuery);
    }

    if (selectedSegment !== 'todos') {
      result = result.filter(c => c.segmento === selectedSegment);
    }

    return result;
  }, [customers, searchQuery, selectedSegment]);

  const getSegmentInfo = (segment: CustomerSegment) => {
    const info: Record<CustomerSegment, { color: string; icon: React.ReactNode; label: string }> = {
      vip: { color: 'text-yellow-500 bg-yellow-500/20', icon: <Crown className="w-4 h-4" />, label: 'VIP' },
      frecuente: { color: 'text-green-500 bg-green-500/20', icon: <Repeat className="w-4 h-4" />, label: 'Frecuente' },
      ocasional: { color: 'text-blue-500 bg-blue-500/20', icon: <Users className="w-4 h-4" />, label: 'Ocasional' },
      nuevo: { color: 'text-cyan-500 bg-cyan-500/20', icon: <UserPlus className="w-4 h-4" />, label: 'Nuevo' },
      en_riesgo: { color: 'text-orange-500 bg-orange-500/20', icon: <AlertTriangle className="w-4 h-4" />, label: 'En Riesgo' },
      perdido: { color: 'text-red-500 bg-red-500/20', icon: <UserX className="w-4 h-4" />, label: 'Perdido' },
      potencial: { color: 'text-purple-500 bg-purple-500/20', icon: <Star className="w-4 h-4" />, label: 'Potencial' },
    };
    return info[segment];
  };

  const handleAddCustomer = () => {
    if (!newCustomer.nombre || !newCustomer.telefono) return;

    addCustomer({
      ...newCustomer,
      documento: '',
      departamento: '',
      codigoPostal: '',
      whatsapp: newCustomer.whatsapp || newCustomer.telefono,
      segmento: 'nuevo',
      tags: [],
      totalCompras: 0,
      cantidadPedidos: 0,
      ticketPromedio: 0,
      ltv: 0,
      ultimaCompra: '',
      primeraCompra: new Date().toISOString(),
      diasSinComprar: 0,
      productosComprados: [],
      categoriasPreferidas: [],
      canalAdquisicion: 'manual',
      ultimoContacto: new Date().toISOString(),
      preferenciaComunicacion: 'whatsapp',
      horarioPreferido: '',
      camposPersonalizados: {},
      notas: [],
      estado: 'activo',
      riesgoChurn: 0,
    });

    setNewCustomer({ nombre: '', email: '', telefono: '', whatsapp: '', ciudad: '', direccion: '' });
    setShowCustomerModal(false);
  };

  const handleAddNote = () => {
    if (!selectedCustomer || !newNote.trim()) return;
    addNote(selectedCustomer.id, {
      contenido: newNote,
      tipo: 'general',
      creadoPor: 'Admin',
    });
    setNewNote('');
  };

  const handleAddTag = () => {
    if (!selectedCustomer || !newTag.trim()) return;
    addTag(selectedCustomer.id, newTag.toLowerCase());
    setNewTag('');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const tabs = [
    { id: 'clientes', label: 'Clientes', icon: Users, count: customers.length },
    { id: 'segmentos', label: 'Segmentos', icon: Filter, count: segmentRules.length },
    { id: 'alertas', label: 'Alertas', icon: Bell, count: unreadAlerts.length },
    { id: 'config', label: 'Configuración', icon: Settings },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500/20 rounded-xl">
            <Users className="w-8 h-8 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">CRM de Clientes</h2>
            <p className="text-gray-400">Gestiona y conoce a tus clientes</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { runSegmentation(); generateAlerts(); }}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <Sparkles className="w-4 h-4" />
            Analizar IA
          </button>
          <button
            onClick={() => setShowCustomerModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <UserPlus className="w-4 h-4" />
            Nuevo Cliente
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {Object.entries(segmentStats).map(([segment, count]) => {
          const info = getSegmentInfo(segment as CustomerSegment);
          return (
            <button
              key={segment}
              onClick={() => setSelectedSegment(segment as CustomerSegment)}
              className={`p-3 rounded-xl border transition-all ${
                selectedSegment === segment
                  ? 'border-indigo-500 bg-indigo-500/10'
                  : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
              }`}
            >
              <div className={`inline-flex p-2 rounded-lg ${info.color} mb-2`}>
                {info.icon}
              </div>
              <p className="text-2xl font-bold text-white">{count}</p>
              <p className="text-xs text-gray-400">{info.label}</p>
            </button>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-700 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className={`px-2 py-0.5 text-xs rounded-full ${
                activeTab === tab.id ? 'bg-indigo-500' : 'bg-gray-600'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="min-h-[500px]">
        {/* Clientes Tab */}
        {activeTab === 'clientes' && (
          <div className="space-y-4">
            {/* Search & Filters */}
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por nombre, email, teléfono..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <select
                value={selectedSegment}
                onChange={(e) => setSelectedSegment(e.target.value as any)}
                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
              >
                <option value="todos">Todos los segmentos</option>
                {Object.keys(segmentStats).map((seg) => (
                  <option key={seg} value={seg}>
                    {getSegmentInfo(seg as CustomerSegment).label}
                  </option>
                ))}
              </select>
            </div>

            {/* Customer List */}
            <div className="grid gap-3">
              {filteredCustomers.map((customer) => {
                const segInfo = getSegmentInfo(customer.segmento);
                return (
                  <div
                    key={customer.id}
                    className="p-4 bg-gray-800/50 rounded-xl border border-gray-700 hover:border-indigo-500/50 cursor-pointer transition-all"
                    onClick={() => setSelectedCustomer(customer)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {customer.nombre.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-white">{customer.nombre}</h4>
                            <span className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 ${segInfo.color}`}>
                              {segInfo.icon}
                              {segInfo.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-400 mt-1">
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {customer.telefono}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {customer.ciudad}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {customer.diasSinComprar}d sin comprar
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-400">{formatCurrency(customer.totalCompras)}</p>
                        <p className="text-sm text-gray-400">{customer.cantidadPedidos} pedidos</p>
                      </div>
                    </div>

                    {/* Tags */}
                    {customer.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {customer.tags.map((tag, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-gray-700 rounded text-xs text-gray-300">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Risk indicator */}
                    {customer.riesgoChurn > 50 && (
                      <div className="mt-3 flex items-center gap-2 text-orange-400 text-sm">
                        <AlertTriangle className="w-4 h-4" />
                        Riesgo de pérdida: {customer.riesgoChurn}%
                      </div>
                    )}
                  </div>
                );
              })}

              {filteredCustomers.length === 0 && (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 mx-auto text-gray-600 mb-4" />
                  <p className="text-gray-400">No se encontraron clientes</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Segmentos Tab */}
        {activeTab === 'segmentos' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-gray-400">{segmentRules.length} reglas de segmentación</p>
              <button
                onClick={() => setShowSegmentModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Plus className="w-4 h-4" />
                Nueva Regla
              </button>
            </div>

            <div className="grid gap-4">
              {segmentRules.map((rule) => (
                <div
                  key={rule.id}
                  className={`p-4 rounded-xl border ${
                    rule.isActive ? 'border-green-500/50 bg-green-500/5' : 'border-gray-700 bg-gray-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: rule.color }}
                      />
                      <h4 className="font-medium text-white">{rule.nombre}</h4>
                      <span className={`px-2 py-0.5 text-xs rounded ${
                        rule.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'
                      }`}>
                        {rule.isActive ? 'Activa' : 'Inactiva'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateSegmentRule(rule.id, { isActive: !rule.isActive })}
                        className={`p-2 rounded-lg ${
                          rule.isActive ? 'text-green-400 hover:bg-green-500/20' : 'text-gray-400 hover:bg-gray-700'
                        }`}
                      >
                        {rule.isActive ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => deleteSegmentRule(rule.id)}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-gray-400 mb-3">{rule.descripcion}</p>

                  <div className="space-y-2">
                    <p className="text-xs text-gray-500 uppercase">Condiciones ({rule.operador}):</p>
                    {rule.condiciones.map((cond, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <code className="px-2 py-1 bg-gray-700 rounded text-indigo-400">{cond.campo}</code>
                        <span className="text-gray-400">{cond.operador}</span>
                        <code className="px-2 py-1 bg-gray-700 rounded text-green-400">{cond.valor}</code>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-700 text-sm text-gray-400">
                    Asigna a: <span className="text-white">{getSegmentInfo(rule.segmento).label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Alertas Tab */}
        {activeTab === 'alertas' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-gray-400">{activeAlerts.length} alertas activas</p>
              <button
                onClick={generateAlerts}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                <Sparkles className="w-4 h-4" />
                Generar Alertas IA
              </button>
            </div>

            <div className="space-y-3">
              {activeAlerts.map((alert) => {
                const customer = customers.find(c => c.id === alert.customerId);
                return (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-xl border ${
                      !alert.isRead ? 'border-orange-500/50 bg-orange-500/5' : 'border-gray-700 bg-gray-800/50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${
                          alert.prioridad === 'alta' ? 'bg-red-500/20 text-red-400' :
                          alert.prioridad === 'media' ? 'bg-orange-500/20 text-orange-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          <Bell className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-white">{alert.mensaje}</p>
                          <p className="text-sm text-green-400 mt-1">
                            💡 {alert.accionSugerida}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(alert.createdAt).toLocaleString('es-CO')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!alert.isRead && (
                          <button
                            onClick={() => markAlertRead(alert.id)}
                            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => dismissAlert(alert.id)}
                          className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {activeAlerts.length === 0 && (
                <div className="text-center py-12">
                  <Bell className="w-12 h-12 mx-auto text-gray-600 mb-4" />
                  <p className="text-gray-400">No hay alertas activas</p>
                  <button
                    onClick={generateAlerts}
                    className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                  >
                    Analizar Clientes
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Config Tab */}
        {activeTab === 'config' && (
          <div className="space-y-6">
            {/* Note Templates */}
            <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-4">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                Plantillas de Notas
              </h3>
              <div className="space-y-3">
                {noteTemplates.map((template) => (
                  <div key={template.id} className="p-3 bg-gray-700/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-white">{template.nombre}</span>
                      <span className="px-2 py-0.5 bg-gray-600 rounded text-xs text-gray-300">
                        {template.tipo}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 whitespace-pre-wrap">{template.contenido}</p>
                    <div className="flex gap-1 mt-2">
                      {template.variables.map((v, i) => (
                        <code key={i} className="px-1.5 py-0.5 bg-indigo-500/20 text-indigo-400 rounded text-xs">
                          {`{{${v}}}`}
                        </code>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Fields */}
            <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-4">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5 text-green-400" />
                Campos Personalizados
              </h3>
              <p className="text-gray-400 text-sm">
                Agrega campos personalizados para almacenar información específica de tus clientes (talla, color favorito, etc.)
              </p>
              <button className="mt-3 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
                <Plus className="w-4 h-4 inline mr-2" />
                Agregar Campo
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-gray-700">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                  {selectedCustomer.nombre.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-white">{selectedCustomer.nombre}</h3>
                  <span className={`px-2 py-0.5 rounded text-xs ${getSegmentInfo(selectedCustomer.segmento).color}`}>
                    {getSegmentInfo(selectedCustomer.segmento).label}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-2 hover:bg-gray-700 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto max-h-[calc(90vh-150px)]">
              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-2 text-gray-300">
                  <Phone className="w-4 h-4 text-gray-500" />
                  {selectedCustomer.telefono}
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <Mail className="w-4 h-4 text-gray-500" />
                  {selectedCustomer.email || 'Sin email'}
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <MessageCircle className="w-4 h-4 text-gray-500" />
                  {selectedCustomer.whatsapp}
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  {selectedCustomer.ciudad}
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-3 bg-gray-700/50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-400">{formatCurrency(selectedCustomer.totalCompras)}</p>
                  <p className="text-xs text-gray-400">Total Compras</p>
                </div>
                <div className="p-3 bg-gray-700/50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-blue-400">{selectedCustomer.cantidadPedidos}</p>
                  <p className="text-xs text-gray-400">Pedidos</p>
                </div>
                <div className="p-3 bg-gray-700/50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-purple-400">{formatCurrency(selectedCustomer.ticketPromedio)}</p>
                  <p className="text-xs text-gray-400">Ticket Promedio</p>
                </div>
              </div>

              {/* Tags */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-400 mb-2">Etiquetas</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedCustomer.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-indigo-500/20 text-indigo-400 rounded-lg text-sm flex items-center gap-1"
                    >
                      #{tag}
                      <button
                        onClick={() => removeTag(selectedCustomer.id, tag)}
                        className="hover:text-red-400"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="+ tag"
                      className="w-20 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm text-white"
                      onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-2">Notas</h4>
                <div className="space-y-2 mb-3">
                  {selectedCustomer.notas.map((note) => (
                    <div key={note.id} className="p-3 bg-gray-700/50 rounded-lg">
                      <p className="text-sm text-white">{note.contenido}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {note.creadoPor} • {new Date(note.createdAt).toLocaleString('es-CO')}
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
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Agregar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Nuevo Cliente</h3>
            <div className="space-y-4">
              <input
                type="text"
                value={newCustomer.nombre}
                onChange={(e) => setNewCustomer({ ...newCustomer, nombre: e.target.value })}
                placeholder="Nombre completo *"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              />
              <input
                type="tel"
                value={newCustomer.telefono}
                onChange={(e) => setNewCustomer({ ...newCustomer, telefono: e.target.value })}
                placeholder="Teléfono *"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              />
              <input
                type="email"
                value={newCustomer.email}
                onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                placeholder="Email"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              />
              <input
                type="text"
                value={newCustomer.ciudad}
                onChange={(e) => setNewCustomer({ ...newCustomer, ciudad: e.target.value })}
                placeholder="Ciudad"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              />
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCustomerModal(false)}
                className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddCustomer}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CRMDashboard;
