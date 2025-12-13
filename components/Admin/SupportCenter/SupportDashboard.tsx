// components/Admin/SupportCenter/SupportDashboard.tsx
import React, { useState } from 'react';
import { Headphones, MessageSquare, Clock, CheckCircle, AlertTriangle, Search, Plus, X, Send, User, Phone, Mail, Tag, Bot, FileText } from 'lucide-react';
import { useSupport, type Ticket, type TicketStatus, type TicketPriority } from '../../../services/supportService';

export function SupportDashboard() {
  const { tickets, quickResponses, chatbotFlows, changeStatus, addMessage, stats, openTickets } = useSupport();
  const [activeTab, setActiveTab] = useState<'tickets' | 'respuestas' | 'chatbot'>('tickets');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const getStatusColor = (status: TicketStatus) => {
    const colors: Record<TicketStatus, string> = {
      abierto: '#EF4444', en_progreso: '#F59E0B', esperando_cliente: '#3B82F6', resuelto: '#10B981', cerrado: '#6B7280'
    };
    return colors[status];
  };

  const getPriorityColor = (priority: TicketPriority) => {
    const colors: Record<TicketPriority, string> = {
      baja: '#6B7280', media: '#3B82F6', alta: '#F59E0B', urgente: '#EF4444'
    };
    return colors[priority];
  };

  const handleSendMessage = () => {
    if (!selectedTicket || !newMessage.trim()) return;
    addMessage(selectedTicket.id, { tipo: 'agente', contenido: newMessage, creadoPor: 'Admin' });
    setNewMessage('');
  };

  const tabs = [
    { id: 'tickets', label: 'Tickets', icon: MessageSquare, count: openTickets.length },
    { id: 'respuestas', label: 'Respuestas Rápidas', icon: FileText, count: quickResponses.length },
    { id: 'chatbot', label: 'Chatbot', icon: Bot },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-cyan-500/20 rounded-xl">
            <Headphones className="w-8 h-8 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Centro de Soporte</h2>
            <p className="text-gray-400">Gestión de tickets y atención al cliente</p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700">
          <Plus className="w-4 h-4" />Nuevo Ticket
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700">
          <div className="flex items-center justify-between">
            <div><p className="text-2xl font-bold text-white">{stats.abiertos}</p><p className="text-xs text-gray-400">Abiertos</p></div>
            <div className="p-2 bg-red-500/20 rounded-lg"><AlertTriangle className="w-5 h-5 text-red-400" /></div>
          </div>
        </div>
        <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700">
          <div className="flex items-center justify-between">
            <div><p className="text-2xl font-bold text-white">{stats.resueltos}</p><p className="text-xs text-gray-400">Resueltos</p></div>
            <div className="p-2 bg-green-500/20 rounded-lg"><CheckCircle className="w-5 h-5 text-green-400" /></div>
          </div>
        </div>
        <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700">
          <div className="flex items-center justify-between">
            <div><p className="text-2xl font-bold text-white">{stats.tiempoPromedioRespuesta}h</p><p className="text-xs text-gray-400">Tiempo Respuesta</p></div>
            <div className="p-2 bg-blue-500/20 rounded-lg"><Clock className="w-5 h-5 text-blue-400" /></div>
          </div>
        </div>
        <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700">
          <div className="flex items-center justify-between">
            <div><p className="text-2xl font-bold text-white">{stats.total}</p><p className="text-xs text-gray-400">Total Tickets</p></div>
            <div className="p-2 bg-purple-500/20 rounded-lg"><MessageSquare className="w-5 h-5 text-purple-400" /></div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-700 pb-2">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${activeTab === tab.id ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}>
            <tab.icon className="w-4 h-4" />{tab.label}
            {tab.count !== undefined && <span className={`px-2 py-0.5 text-xs rounded-full ${activeTab === tab.id ? 'bg-cyan-500' : 'bg-gray-600'}`}>{tab.count}</span>}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {activeTab === 'tickets' && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar tickets..." className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" />
            </div>
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <div key={ticket.id} onClick={() => setSelectedTicket(ticket)}
                  className="p-4 bg-gray-800/50 rounded-xl border border-gray-700 hover:border-cyan-500/50 cursor-pointer transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm text-cyan-400">{ticket.numero}</span>
                      <span className="px-2 py-0.5 rounded text-xs" style={{ backgroundColor: `${getStatusColor(ticket.estado)}20`, color: getStatusColor(ticket.estado) }}>
                        {ticket.estado}
                      </span>
                      <span className="px-2 py-0.5 rounded text-xs" style={{ backgroundColor: `${getPriorityColor(ticket.prioridad)}20`, color: getPriorityColor(ticket.prioridad) }}>
                        {ticket.prioridad}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                  </div>
                  <h4 className="font-medium text-white mb-1">{ticket.asunto}</h4>
                  <p className="text-sm text-gray-400">{ticket.customerName} • {ticket.categoria}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'respuestas' && (
          <div className="grid md:grid-cols-2 gap-4">
            {quickResponses.map((response) => (
              <div key={response.id} className={`p-4 rounded-xl border ${response.isActive ? 'border-green-500/50 bg-green-500/5' : 'border-gray-700 bg-gray-800/50'}`}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-white">{response.nombre}</h4>
                  <span className="text-xs text-gray-400">{response.usageCount} usos</span>
                </div>
                <p className="text-sm text-gray-400 line-clamp-3 mb-3">{response.contenido}</p>
                <div className="flex flex-wrap gap-1">
                  {response.atajos.map((a, i) => <code key={i} className="px-1.5 py-0.5 bg-cyan-500/20 text-cyan-400 rounded text-xs">{a}</code>)}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'chatbot' && (
          <div className="space-y-4">
            {chatbotFlows.map((flow) => (
              <div key={flow.id} className={`p-6 rounded-xl border ${flow.isActive ? 'border-green-500/50 bg-green-500/5' : 'border-gray-700 bg-gray-800/50'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Bot className="w-6 h-6 text-cyan-400" />
                    <div>
                      <h4 className="font-medium text-white">{flow.nombre}</h4>
                      <p className="text-sm text-gray-400">{flow.descripcion}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-lg text-sm ${flow.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                    {flow.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <div className="p-4 bg-gray-700/50 rounded-lg mb-4">
                  <p className="text-white">{flow.preguntaInicial}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {flow.opciones.map((opt) => (
                    <div key={opt.id} className="p-3 bg-gray-700/30 rounded-lg text-sm text-gray-300">{opt.texto}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-gray-700">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-cyan-400">{selectedTicket.numero}</span>
                  <span className="px-2 py-0.5 rounded text-xs" style={{ backgroundColor: `${getStatusColor(selectedTicket.estado)}20`, color: getStatusColor(selectedTicket.estado) }}>
                    {selectedTicket.estado}
                  </span>
                </div>
                <h3 className="font-bold text-white mt-1">{selectedTicket.asunto}</h3>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="p-2 hover:bg-gray-700 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              <div className="flex items-center gap-4 mb-4 p-3 bg-gray-700/50 rounded-lg">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium text-white">{selectedTicket.customerName}</p>
                  <p className="text-sm text-gray-400">{selectedTicket.customerPhone} • {selectedTicket.customerEmail}</p>
                </div>
              </div>
              <div className="space-y-3 mb-4">
                {selectedTicket.mensajes.map((msg) => (
                  <div key={msg.id} className={`p-3 rounded-lg ${msg.tipo === 'cliente' ? 'bg-gray-700/50 ml-0 mr-12' : 'bg-cyan-500/20 ml-12 mr-0'}`}>
                    <p className="text-white text-sm">{msg.contenido}</p>
                    <p className="text-xs text-gray-500 mt-1">{msg.creadoPor} • {new Date(msg.createdAt).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 border-t border-gray-700">
              <div className="flex gap-2">
                <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Escribe tu respuesta..." className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} />
                <button onClick={handleSendMessage} className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SupportDashboard;
