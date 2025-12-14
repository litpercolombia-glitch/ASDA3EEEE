// components/Admin/MarketingCenter/MarketingDashboard.tsx
import React, { useState } from 'react';
import { Megaphone, Mail, MessageCircle, Zap, FileText, Plus, Play, Pause, Edit2, Trash2, Send, Users, TrendingUp, Clock, X, Settings } from 'lucide-react';
import { useMarketing, type Campaign, type MessageTemplate, type AutomationFlow } from '../../../services/marketingService';

export function MarketingDashboard() {
  const { campaigns, templates, flows, toggleFlow, activeFlows, activeCampaigns } = useMarketing();
  const [activeTab, setActiveTab] = useState<'campanas' | 'plantillas' | 'flujos'>('plantillas');
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);

  const tabs = [
    { id: 'campanas', label: 'Campañas', icon: Megaphone, count: campaigns.length },
    { id: 'plantillas', label: 'Plantillas', icon: FileText, count: templates.length },
    { id: 'flujos', label: 'Automatizaciones', icon: Zap, count: activeFlows.length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-pink-500/20 rounded-xl">
            <Megaphone className="w-8 h-8 text-pink-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Marketing Automatizado</h2>
            <p className="text-gray-400">Campañas, plantillas y flujos automáticos</p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700">
          <Plus className="w-4 h-4" />
          Nueva Campaña
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg"><Send className="w-5 h-5 text-green-400" /></div>
            <div>
              <p className="text-2xl font-bold text-white">{templates.reduce((s, t) => s + t.usageCount, 0)}</p>
              <p className="text-xs text-gray-400">Mensajes Enviados</p>
            </div>
          </div>
        </div>
        <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg"><Users className="w-5 h-5 text-blue-400" /></div>
            <div>
              <p className="text-2xl font-bold text-white">{flows.reduce((s, f) => s + f.ejecutados, 0)}</p>
              <p className="text-xs text-gray-400">Flujos Ejecutados</p>
            </div>
          </div>
        </div>
        <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg"><Zap className="w-5 h-5 text-purple-400" /></div>
            <div>
              <p className="text-2xl font-bold text-white">{activeFlows.length}</p>
              <p className="text-xs text-gray-400">Flujos Activos</p>
            </div>
          </div>
        </div>
        <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-pink-500/20 rounded-lg"><TrendingUp className="w-5 h-5 text-pink-400" /></div>
            <div>
              <p className="text-2xl font-bold text-white">{templates.length}</p>
              <p className="text-xs text-gray-400">Plantillas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-700 pb-2">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${activeTab === tab.id ? 'bg-pink-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}>
            <tab.icon className="w-4 h-4" />{tab.label}
            {tab.count > 0 && <span className={`px-2 py-0.5 text-xs rounded-full ${activeTab === tab.id ? 'bg-pink-500' : 'bg-gray-600'}`}>{tab.count}</span>}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {/* Plantillas */}
        {activeTab === 'plantillas' && (
          <div className="grid md:grid-cols-2 gap-4">
            {templates.map((template) => (
              <div key={template.id} onClick={() => setSelectedTemplate(template)}
                className={`p-4 rounded-xl border cursor-pointer transition-all hover:border-pink-500/50 ${template.isActive ? 'border-green-500/50 bg-green-500/5' : 'border-gray-700 bg-gray-800/50'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-pink-400" />
                    <h4 className="font-medium text-white">{template.nombre}</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-xs rounded ${template.canal === 'whatsapp' ? 'bg-green-500/20 text-green-400' : template.canal === 'email' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                      {template.canal}
                    </span>
                    <span className="text-xs text-gray-400">{template.usageCount} usos</span>
                  </div>
                </div>
                <p className="text-sm text-gray-400 line-clamp-2 mb-3">{template.contenido}</p>
                <div className="flex gap-1">
                  {template.variables.slice(0, 3).map((v, i) => (
                    <code key={i} className="px-1.5 py-0.5 bg-pink-500/20 text-pink-400 rounded text-xs">{`{{${v}}}`}</code>
                  ))}
                  {template.variables.length > 3 && <span className="text-xs text-gray-500">+{template.variables.length - 3}</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Flujos */}
        {activeTab === 'flujos' && (
          <div className="space-y-4">
            {flows.map((flow) => (
              <div key={flow.id} className={`p-4 rounded-xl border ${flow.isActive ? 'border-green-500/50 bg-green-500/5' : 'border-gray-700 bg-gray-800/50'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${flow.isActive ? 'bg-green-500/20' : 'bg-gray-700'}`}>
                      <Zap className={`w-5 h-5 ${flow.isActive ? 'text-green-400' : 'text-gray-400'}`} />
                    </div>
                    <div>
                      <h4 className="font-medium text-white">{flow.nombre}</h4>
                      <p className="text-sm text-gray-400">{flow.descripcion}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-400">{flow.ejecutados} ejecutados</span>
                    <button onClick={() => toggleFlow(flow.id)}
                      className={`px-3 py-1.5 rounded-lg text-sm ${flow.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                      {flow.isActive ? <><Pause className="w-3 h-3 inline mr-1" />Pausar</> : <><Play className="w-3 h-3 inline mr-1" />Activar</>}
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500">Trigger:</span>
                  <code className="px-2 py-0.5 bg-gray-700 rounded text-pink-400">{flow.trigger.tipo}</code>
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-400">{flow.pasos.length} pasos</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Campañas */}
        {activeTab === 'campanas' && (
          <div className="text-center py-12">
            <Megaphone className="w-12 h-12 mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400 mb-4">Crea tu primera campaña de marketing</p>
            <button className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700">
              <Plus className="w-4 h-4 inline mr-2" />Nueva Campaña
            </button>
          </div>
        )}
      </div>

      {/* Template Detail Modal */}
      {selectedTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl w-full max-w-lg border border-gray-700">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h3 className="font-bold text-white">{selectedTemplate.nombre}</h3>
              <button onClick={() => setSelectedTemplate(null)} className="p-1 hover:bg-gray-700 rounded"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <span className={`px-2 py-1 rounded text-sm ${selectedTemplate.canal === 'whatsapp' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                  {selectedTemplate.canal}
                </span>
                <span className="px-2 py-1 bg-gray-700 rounded text-sm text-gray-300">{selectedTemplate.categoria}</span>
              </div>
              <div className="p-4 bg-gray-700/50 rounded-lg mb-4">
                <p className="text-white whitespace-pre-wrap">{selectedTemplate.contenido}</p>
              </div>
              <div className="mb-4">
                <p className="text-sm text-gray-400 mb-2">Variables disponibles:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedTemplate.variables.map((v, i) => (
                    <code key={i} className="px-2 py-1 bg-pink-500/20 text-pink-400 rounded text-sm">{`{{${v}}}`}</code>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <button className="flex-1 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700">
                  <Edit2 className="w-4 h-4 inline mr-2" />Editar
                </button>
                <button className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700">
                  <Send className="w-4 h-4 inline mr-2" />Usar Ahora
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MarketingDashboard;
