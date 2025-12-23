// components/chat/ChateaAITab.tsx
// Tab de Chatea AI - Conexión con Chatea Pro API y WhatsApp

import React, { useState, useEffect, useRef } from 'react';
import {
  MessageCircle,
  Send,
  Phone,
  Users,
  ShoppingCart,
  RefreshCw,
  ExternalLink,
  CheckCircle,
  Clock,
  AlertCircle,
  Search,
  Filter,
  MoreVertical,
  Image,
  Paperclip,
  Smile,
  Mic,
  X,
} from 'lucide-react';
import { integrationManager } from '../../services/integrations/IntegrationManager';

interface ChateaChat {
  id: string;
  customerName: string;
  customerPhone: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  status: 'active' | 'waiting' | 'resolved';
  avatar?: string;
}

interface ChateaMessage {
  id: string;
  content: string;
  direction: 'incoming' | 'outgoing';
  timestamp: Date;
  status: 'sent' | 'delivered' | 'read';
  type: 'text' | 'image' | 'document';
}

interface ChateaAITabProps {
  compact?: boolean;
}

export const ChateaAITab: React.FC<ChateaAITabProps> = ({ compact = false }) => {
  const [chats, setChats] = useState<ChateaChat[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChateaChat | null>(null);
  const [messages, setMessages] = useState<ChateaMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'waiting' | 'resolved'>('all');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkConnection();
    loadChats();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const checkConnection = async () => {
    const chateaProvider = integrationManager.getChateaProvider();
    if (chateaProvider) {
      const connected = await chateaProvider.testConnection();
      setIsConnected(connected);
    }
  };

  const loadChats = async () => {
    setIsLoading(true);
    try {
      const chateaProvider = integrationManager.getChateaProvider();
      if (chateaProvider) {
        const chatList = await chateaProvider.getChats();
        setChats(chatList || []);
      } else {
        // Demo data cuando no hay conexión
        setChats([
          {
            id: '1',
            customerName: 'Maria García',
            customerPhone: '+57 300 123 4567',
            lastMessage: 'Hola, quiero saber el estado de mi pedido',
            lastMessageTime: new Date(Date.now() - 5 * 60000),
            unreadCount: 2,
            status: 'active',
          },
          {
            id: '2',
            customerName: 'Carlos Rodríguez',
            customerPhone: '+57 310 987 6543',
            lastMessage: 'Gracias por la información!',
            lastMessageTime: new Date(Date.now() - 30 * 60000),
            unreadCount: 0,
            status: 'resolved',
          },
          {
            id: '3',
            customerName: 'Ana López',
            customerPhone: '+57 320 555 1234',
            lastMessage: 'Mi paquete no ha llegado',
            lastMessageTime: new Date(Date.now() - 2 * 3600000),
            unreadCount: 1,
            status: 'waiting',
          },
        ]);
      }
    } catch (error) {
      console.error('Error loading chats:', error);
    }
    setIsLoading(false);
  };

  const loadMessages = async (chatId: string) => {
    try {
      const chateaProvider = integrationManager.getChateaProvider();
      if (chateaProvider) {
        const chatMessages = await chateaProvider.getChatMessages(chatId);
        setMessages(chatMessages || []);
      } else {
        // Demo messages
        setMessages([
          {
            id: '1',
            content: 'Hola, quiero saber el estado de mi pedido',
            direction: 'incoming',
            timestamp: new Date(Date.now() - 10 * 60000),
            status: 'read',
            type: 'text',
          },
          {
            id: '2',
            content: 'Hola! Claro, déjame verificar. ¿Cuál es tu número de guía?',
            direction: 'outgoing',
            timestamp: new Date(Date.now() - 8 * 60000),
            status: 'read',
            type: 'text',
          },
          {
            id: '3',
            content: 'Es el 123456789',
            direction: 'incoming',
            timestamp: new Date(Date.now() - 5 * 60000),
            status: 'read',
            type: 'text',
          },
        ]);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSelectChat = (chat: ChateaChat) => {
    setSelectedChat(chat);
    loadMessages(chat.id);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !selectedChat) return;

    const newMessage: ChateaMessage = {
      id: Date.now().toString(),
      content: inputMessage,
      direction: 'outgoing',
      timestamp: new Date(),
      status: 'sent',
      type: 'text',
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputMessage('');

    try {
      const chateaProvider = integrationManager.getChateaProvider();
      if (chateaProvider) {
        await chateaProvider.sendMessage(selectedChat.customerPhone, inputMessage);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const filteredChats = chats.filter((chat) => {
    const matchesSearch =
      chat.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.customerPhone.includes(searchQuery);
    const matchesFilter = filter === 'all' || chat.status === filter;
    return matchesSearch && matchesFilter;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <div className="w-2 h-2 bg-green-500 rounded-full" />;
      case 'waiting':
        return <Clock className="w-3 h-3 text-amber-500" />;
      case 'resolved':
        return <CheckCircle className="w-3 h-3 text-slate-400" />;
      default:
        return null;
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return new Date(date).toLocaleDateString();
  };

  // Vista sin chat seleccionado
  if (!selectedChat) {
    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-navy-700">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                <MessageCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white">Chatea AI</h3>
                <p className="text-xs text-slate-500">WhatsApp Business</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  isConnected
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {isConnected ? 'Conectado' : 'Desconectado'}
              </span>
              <button
                onClick={loadChats}
                className="p-2 hover:bg-slate-100 dark:hover:bg-navy-800 rounded-lg"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar chat..."
                className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-navy-800 rounded-lg text-sm"
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as typeof filter)}
              className="px-3 py-2 bg-slate-100 dark:bg-navy-800 rounded-lg text-sm"
            >
              <option value="all">Todos</option>
              <option value="active">Activos</option>
              <option value="waiting">Esperando</option>
              <option value="resolved">Resueltos</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 p-4 border-b border-slate-200 dark:border-navy-700">
          <div className="text-center p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
            <p className="text-lg font-bold text-emerald-600">
              {chats.filter((c) => c.status === 'active').length}
            </p>
            <p className="text-xs text-slate-500">Activos</p>
          </div>
          <div className="text-center p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
            <p className="text-lg font-bold text-amber-600">
              {chats.filter((c) => c.status === 'waiting').length}
            </p>
            <p className="text-xs text-slate-500">Esperando</p>
          </div>
          <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-lg font-bold text-blue-600">
              {chats.reduce((sum, c) => sum + c.unreadCount, 0)}
            </p>
            <p className="text-xs text-slate-500">Sin leer</p>
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-auto">
          {filteredChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <MessageCircle className="w-12 h-12 mb-3 opacity-30" />
              <p>No hay chats</p>
              {!isConnected && (
                <p className="text-xs mt-2">Configura tu API de Chatea</p>
              )}
            </div>
          ) : (
            filteredChats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => handleSelectChat(chat)}
                className="w-full p-4 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-navy-800 border-b border-slate-100 dark:border-navy-700 text-left transition-colors"
              >
                {/* Avatar */}
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0">
                  {chat.customerName.charAt(0)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-800 dark:text-white truncate">
                      {chat.customerName}
                    </span>
                    <span className="text-xs text-slate-400 shrink-0">
                      {formatTime(chat.lastMessageTime)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-500 truncate">{chat.lastMessage}</p>
                    <div className="flex items-center gap-2 shrink-0">
                      {getStatusIcon(chat.status)}
                      {chat.unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 bg-emerald-500 text-white text-xs font-bold rounded-full">
                          {chat.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Quick Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-navy-700">
          <div className="grid grid-cols-3 gap-2">
            <button className="flex flex-col items-center gap-1 p-3 bg-slate-100 dark:bg-navy-800 rounded-xl hover:bg-slate-200 dark:hover:bg-navy-700 transition-colors">
              <Users className="w-5 h-5 text-blue-500" />
              <span className="text-xs">Clientes</span>
            </button>
            <button className="flex flex-col items-center gap-1 p-3 bg-slate-100 dark:bg-navy-800 rounded-xl hover:bg-slate-200 dark:hover:bg-navy-700 transition-colors">
              <ShoppingCart className="w-5 h-5 text-purple-500" />
              <span className="text-xs">Pedidos</span>
            </button>
            <button className="flex flex-col items-center gap-1 p-3 bg-slate-100 dark:bg-navy-800 rounded-xl hover:bg-slate-200 dark:hover:bg-navy-700 transition-colors">
              <ExternalLink className="w-5 h-5 text-emerald-500" />
              <span className="text-xs">Chatea Pro</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Vista con chat seleccionado
  return (
    <div className="h-full flex flex-col">
      {/* Chat Header */}
      <div className="p-3 border-b border-slate-200 dark:border-navy-700 flex items-center gap-3">
        <button
          onClick={() => setSelectedChat(null)}
          className="p-2 hover:bg-slate-100 dark:hover:bg-navy-800 rounded-lg"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white font-bold">
          {selectedChat.customerName.charAt(0)}
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-slate-800 dark:text-white">
            {selectedChat.customerName}
          </h4>
          <p className="text-xs text-slate-500">{selectedChat.customerPhone}</p>
        </div>
        <button className="p-2 hover:bg-slate-100 dark:hover:bg-navy-800 rounded-lg">
          <Phone className="w-4 h-4 text-emerald-500" />
        </button>
        <button className="p-2 hover:bg-slate-100 dark:hover:bg-navy-800 rounded-lg">
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-4 space-y-3 bg-slate-50 dark:bg-navy-950">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.direction === 'outgoing' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                msg.direction === 'outgoing'
                  ? 'bg-emerald-500 text-white rounded-br-md'
                  : 'bg-white dark:bg-navy-800 text-slate-800 dark:text-white rounded-bl-md shadow-sm'
              }`}
            >
              <p className="text-sm">{msg.content}</p>
              <div
                className={`flex items-center justify-end gap-1 mt-1 ${
                  msg.direction === 'outgoing' ? 'text-emerald-100' : 'text-slate-400'
                }`}
              >
                <span className="text-xs">
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                {msg.direction === 'outgoing' && (
                  <CheckCircle className="w-3 h-3" />
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900">
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-slate-100 dark:hover:bg-navy-800 rounded-full">
            <Smile className="w-5 h-5 text-slate-400" />
          </button>
          <button className="p-2 hover:bg-slate-100 dark:hover:bg-navy-800 rounded-full">
            <Paperclip className="w-5 h-5 text-slate-400" />
          </button>
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Escribe un mensaje..."
            className="flex-1 px-4 py-2 bg-slate-100 dark:bg-navy-800 rounded-full text-sm"
          />
          {inputMessage ? (
            <button
              onClick={handleSendMessage}
              className="p-2 bg-emerald-500 hover:bg-emerald-600 rounded-full text-white"
            >
              <Send className="w-5 h-5" />
            </button>
          ) : (
            <button className="p-2 hover:bg-slate-100 dark:hover:bg-navy-800 rounded-full">
              <Mic className="w-5 h-5 text-slate-400" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChateaAITab;
