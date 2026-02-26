// components/ReportUpload/ShareableLinkManager.tsx
// Panel admin para crear y gestionar links compartibles de subida de reportes

import React, { useState, useMemo } from 'react';
import {
  Link2,
  Plus,
  Copy,
  CheckCircle,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  Clock,
  Users,
  Shield,
  X,
  Calendar,
  AlertTriangle,
  Share2,
  QrCode,
  Eye,
  FileText,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import {
  ShareableUploadLink,
  ReportCategory,
  REPORT_CATEGORIES,
  createUploadLink,
  getUploadLinks,
  toggleUploadLink,
  deleteUploadLink,
  buildShareableUrl,
} from '../../services/reportUploadService';

export function ShareableLinkManager() {
  const { user } = useAuthStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [links, setLinks] = useState<ShareableUploadLink[]>(() => getUploadLinks());

  // Create form
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState<ReportCategory | 'any'>('any');
  const [formExpires, setFormExpires] = useState('');
  const [formMaxUploads, setFormMaxUploads] = useState('');
  const [formRequiresName, setFormRequiresName] = useState(true);
  const [formRequiresEmail, setFormRequiresEmail] = useState(true);

  const refreshLinks = () => setLinks(getUploadLinks());

  const handleCreate = () => {
    if (!formName.trim() || !user) return;

    createUploadLink({
      name: formName.trim(),
      description: formDescription.trim(),
      category: formCategory,
      createdBy: user.id,
      createdByName: user.nombre,
      expiresAt: formExpires ? new Date(formExpires).toISOString() : null,
      maxUploads: formMaxUploads ? parseInt(formMaxUploads) : null,
      isActive: true,
      requiresName: formRequiresName,
      requiresEmail: formRequiresEmail,
    });

    refreshLinks();
    setShowCreateModal(false);
    setFormName('');
    setFormDescription('');
    setFormCategory('any');
    setFormExpires('');
    setFormMaxUploads('');
    setFormRequiresName(true);
    setFormRequiresEmail(true);
  };

  const handleCopyLink = (link: ShareableUploadLink) => {
    const url = buildShareableUrl(link.token);
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(link.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleToggle = (id: string) => {
    toggleUploadLink(id);
    refreshLinks();
  };

  const handleDelete = (id: string) => {
    deleteUploadLink(id);
    refreshLinks();
  };

  const isExpired = (link: ShareableUploadLink) => {
    return link.expiresAt && new Date(link.expiresAt) < new Date();
  };

  const isMaxedOut = (link: ShareableUploadLink) => {
    return link.maxUploads !== null && link.currentUploads >= link.maxUploads;
  };

  const activeLinks = links.filter(l => l.isActive && !isExpired(l) && !isMaxedOut(l));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-indigo-500/30 to-purple-500/30 rounded-xl">
            <Share2 className="w-7 h-7 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Links Compartibles</h2>
            <p className="text-gray-400 text-sm">
              Genera links para que las personas suban sus reportes sin necesidad de login
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all font-medium shadow-lg shadow-indigo-500/25"
        >
          <Plus className="w-4 h-4" />
          Crear Nuevo Link
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-4 text-center">
          <p className="text-2xl font-bold text-white">{links.length}</p>
          <p className="text-xs text-gray-400">Links Totales</p>
        </div>
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-4 text-center">
          <p className="text-2xl font-bold text-green-400">{activeLinks.length}</p>
          <p className="text-xs text-gray-400">Activos</p>
        </div>
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-4 text-center">
          <p className="text-2xl font-bold text-indigo-400">
            {links.reduce((sum, l) => sum + l.currentUploads, 0)}
          </p>
          <p className="text-xs text-gray-400">Envíos Totales</p>
        </div>
      </div>

      {/* Links List */}
      <div className="space-y-3">
        {links.length === 0 ? (
          <div className="text-center py-12 bg-gray-800/30 rounded-xl border border-gray-700">
            <Link2 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-2">No tienes links creados</p>
            <p className="text-sm text-gray-500 mb-4">Crea un link y compártelo para que las personas suban sus reportes</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
            >
              Crear Primer Link
            </button>
          </div>
        ) : (
          links.map(link => {
            const expired = isExpired(link);
            const maxed = isMaxedOut(link);
            const disabled = !link.isActive || expired || maxed;

            return (
              <div
                key={link.id}
                className={`bg-gray-800/50 rounded-xl border p-4 transition-colors ${
                  disabled ? 'border-gray-700/50 opacity-60' : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-medium text-white">{link.name}</h4>
                      {!link.isActive && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-gray-500/20 text-gray-400">Desactivado</span>
                      )}
                      {expired && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-red-500/20 text-red-400">Expirado</span>
                      )}
                      {maxed && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-amber-500/20 text-amber-400">Límite alcanzado</span>
                      )}
                      {!disabled && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-green-500/20 text-green-400">Activo</span>
                      )}
                    </div>
                    {link.description && (
                      <p className="text-sm text-gray-400 mt-1">{link.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Creado: {new Date(link.createdAt).toLocaleDateString('es-CO')}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {link.currentUploads} envíos {link.maxUploads !== null && `/ ${link.maxUploads} máx`}
                      </span>
                      {link.expiresAt && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Expira: {new Date(link.expiresAt).toLocaleDateString('es-CO')}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {link.requiresName ? 'Nombre requerido' : 'Nombre opcional'}
                      </span>
                    </div>

                    {/* Link URL */}
                    <div className="mt-3 flex items-center gap-2">
                      <div className="flex-1 px-3 py-2 bg-gray-900/80 border border-gray-600 rounded-lg text-sm text-gray-300 truncate font-mono">
                        {buildShareableUrl(link.token)}
                      </div>
                      <button
                        onClick={() => handleCopyLink(link)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          copiedId === link.id
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30'
                        }`}
                      >
                        {copiedId === link.id ? (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Copiado
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            Copiar
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleToggle(link.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        link.isActive
                          ? 'text-green-400 hover:bg-green-500/20'
                          : 'text-gray-500 hover:bg-gray-700'
                      }`}
                      title={link.isActive ? 'Desactivar' : 'Activar'}
                    >
                      {link.isActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={() => handleDelete(link.id)}
                      className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/20 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden border border-gray-700 shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/30 rounded-xl">
                  <Link2 className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Crear Link Compartible</h3>
                  <p className="text-sm text-gray-400">Las personas podrán subir reportes con este link</p>
                </div>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-gray-700 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto max-h-[calc(90vh-160px)] space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Nombre del Link <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ej: Reportes Equipo Logística Febrero"
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Descripción (visible para quien abre el link)
                </label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Ej: Sube tu reporte semanal de entregas aquí"
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Categoría de Reporte
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as ReportCategory | 'any')}
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="any">Cualquiera (la persona elige)</option>
                  {(Object.entries(REPORT_CATEGORIES) as [ReportCategory, typeof REPORT_CATEGORIES[ReportCategory]][]).map(
                    ([key, config]) => (
                      <option key={key} value={key}>{config.label}</option>
                    )
                  )}
                </select>
              </div>

              {/* Expiration */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Fecha de Expiración
                  </label>
                  <input
                    type="date"
                    value={formExpires}
                    onChange={(e) => setFormExpires(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Dejar vacío = sin expiración</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Máximo de Envíos
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formMaxUploads}
                    onChange={(e) => setFormMaxUploads(e.target.value)}
                    placeholder="Ilimitado"
                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Dejar vacío = ilimitado</p>
                </div>
              </div>

              {/* Requirements */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Campos Requeridos
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 px-4 py-3 bg-gray-800 rounded-xl border border-gray-700 cursor-pointer hover:border-gray-600 transition-colors">
                    <input
                      type="checkbox"
                      checked={formRequiresName}
                      onChange={(e) => setFormRequiresName(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 bg-gray-700 border-gray-600 rounded focus:ring-indigo-500"
                    />
                    <div>
                      <p className="text-sm text-white font-medium">Nombre obligatorio</p>
                      <p className="text-xs text-gray-500">La persona debe escribir su nombre</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 px-4 py-3 bg-gray-800 rounded-xl border border-gray-700 cursor-pointer hover:border-gray-600 transition-colors">
                    <input
                      type="checkbox"
                      checked={formRequiresEmail}
                      onChange={(e) => setFormRequiresEmail(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 bg-gray-700 border-gray-600 rounded focus:ring-indigo-500"
                    />
                    <div>
                      <p className="text-sm text-white font-medium">Correo obligatorio</p>
                      <p className="text-xs text-gray-500">La persona debe escribir su email</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-5 border-t border-gray-700 bg-gray-800/50">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-600 text-gray-300 rounded-xl hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={!formName.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition-all font-medium"
              >
                <Link2 className="w-4 h-4" />
                Crear Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ShareableLinkManager;
