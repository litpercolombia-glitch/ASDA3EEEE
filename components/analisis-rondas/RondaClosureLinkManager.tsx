/**
 * Gestión de Links de Cierre de Ronda
 * Admin crea links para que operadores envíen su cierre de ronda
 * Incluye: vista de cierres recibidos, revisión, discrepancias
 */

import React, { useState, useMemo } from 'react';
import {
  Link2,
  Plus,
  Copy,
  CheckCircle,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Clock,
  X,
  Calendar,
  AlertTriangle,
  Eye,
  Camera,
  MessageSquare,
  Flag,
  FileText,
  Shield,
  Users,
  ClipboardCheck,
} from 'lucide-react';
import { getOperadores, RONDA_PRESETS } from '../../constants/analisis-rondas';
import {
  RondaClosureLink,
  RondaClosure,
  createClosureLink,
  getClosureLinks,
  getClosures,
  toggleClosureLink,
  deleteClosureLink,
  buildClosureUrl,
  reviewClosure,
  getRequiredEvidence,
  getClosureStats,
} from '../../services/rondaReportBridgeService';

export const RondaClosureLinkManager: React.FC = () => {
  const operadores = getOperadores();
  const [links, setLinks] = useState<RondaClosureLink[]>(() => getClosureLinks());
  const [closures, setClosures] = useState<RondaClosure[]>(() => getClosures());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [viewingClosure, setViewingClosure] = useState<RondaClosure | null>(null);
  const [reviewNote, setReviewNote] = useState('');

  // Create form
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formOperator, setFormOperator] = useState<string>('any');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formExpires, setFormExpires] = useState('');
  const [formReqCancelaciones, setFormReqCancelaciones] = useState(false);
  const [formReqNovedades, setFormReqNovedades] = useState(false);
  const [formReqRendimiento, setFormReqRendimiento] = useState(false);
  const [formReqPhotos, setFormReqPhotos] = useState(false);
  const [formMinPhotos, setFormMinPhotos] = useState(1);

  const stats = useMemo(() => getClosureStats(), [closures]);

  const refresh = () => {
    setLinks(getClosureLinks());
    setClosures(getClosures());
  };

  const handleCreate = () => {
    if (!formName.trim()) return;
    const op = operadores.find(o => o.id === formOperator);
    createClosureLink({
      name: formName.trim(),
      description: formDesc.trim(),
      operatorId: formOperator,
      operatorName: op?.nombre || 'Cualquiera',
      date: formDate,
      createdBy: 'admin',
      createdByName: 'Admin',
      expiresAt: formExpires ? new Date(formExpires + 'T23:59:59').toISOString() : null,
      isActive: true,
      requireExplanationCancelaciones: formReqCancelaciones,
      requireExplanationNovedades: formReqNovedades,
      requireExplanationRendimiento: formReqRendimiento,
      requirePhotos: formReqPhotos,
      minPhotos: formMinPhotos,
    });
    refresh();
    setShowCreate(false);
    setFormName('');
    setFormDesc('');
    setFormOperator('any');
  };

  const handleCopy = (link: RondaClosureLink) => {
    navigator.clipboard.writeText(buildClosureUrl(link.token)).then(() => {
      setCopiedId(link.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleReview = (closureId: string, status: 'reviewed' | 'flagged') => {
    reviewClosure(closureId, status, reviewNote, 'Admin');
    setViewingClosure(null);
    setReviewNote('');
    refresh();
  };

  const pendingClosures = closures.filter(c => c.status === 'submitted');

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-navy-700 p-4 text-center">
          <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.total}</p>
          <p className="text-xs text-slate-500">Cierres Totales</p>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800 p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
          <p className="text-xs text-amber-500">Por Revisar</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{stats.withDiscrepancies}</p>
          <p className="text-xs text-red-500">Con Discrepancias</p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800 p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">{stats.withEvidence}</p>
          <p className="text-xs text-emerald-500">Con Evidencia</p>
        </div>
      </div>

      {/* Pending closures */}
      {pendingClosures.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800 p-4">
          <h4 className="font-semibold text-amber-700 dark:text-amber-400 mb-3 flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4" />
            Cierres Pendientes de Revisión ({pendingClosures.length})
          </h4>
          <div className="space-y-2">
            {pendingClosures.map(c => (
              <div key={c.id} className="flex items-center justify-between p-3 bg-white dark:bg-navy-800 rounded-lg border border-amber-200 dark:border-amber-700">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{operadores.find(o => o.nombre.toUpperCase() === c.operatorName.toUpperCase())?.icono || '👤'}</span>
                  <div>
                    <p className="font-medium text-sm text-slate-700 dark:text-slate-300">{c.operatorName} - {c.date}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>{c.selfReportedRealizadas} guías</span>
                      {c.evidence.length > 0 && <span className="flex items-center gap-0.5"><Camera className="w-3 h-3" />{c.evidence.length}</span>}
                      {c.discrepancies.length > 0 && <span className="text-red-500">{c.discrepancies.length} disc.</span>}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setViewingClosure(c)}
                  className="px-3 py-1.5 bg-amber-100 dark:bg-amber-800 text-amber-700 dark:text-amber-300 rounded-lg text-xs font-medium hover:bg-amber-200 dark:hover:bg-amber-700 flex items-center gap-1"
                >
                  <Eye className="w-3 h-3" /> Revisar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Links management */}
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
          <Link2 className="w-4 h-4 text-indigo-500" />
          Links de Cierre ({links.length})
        </h4>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-1"
        >
          <Plus className="w-4 h-4" /> Crear Link
        </button>
      </div>

      {links.length === 0 ? (
        <div className="text-center py-8 bg-slate-50 dark:bg-navy-700/50 rounded-xl">
          <Link2 className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <p className="text-slate-500 text-sm">No hay links creados. Crea uno para que los operadores envíen su cierre.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {links.map(link => (
            <div key={link.id} className={`bg-white dark:bg-navy-800 rounded-xl border p-4 ${link.isActive ? 'border-slate-200 dark:border-navy-700' : 'border-slate-200/50 dark:border-navy-700/50 opacity-60'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm text-slate-800 dark:text-white">{link.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                      {link.operatorName}
                    </span>
                    <span className="text-xs text-slate-400">{link.date}</span>
                    {link.usedAt && <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600">Usado</span>}
                    {!link.isActive && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Desactivado</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 px-2 py-1.5 bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-navy-600 rounded-lg text-xs text-slate-500 truncate font-mono">
                      {buildClosureUrl(link.token)}
                    </div>
                    <button
                      onClick={() => handleCopy(link)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium ${
                        copiedId === link.id ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'
                      }`}
                    >
                      {copiedId === link.id ? <><CheckCircle className="w-3 h-3 inline mr-1" />Copiado</> : <><Copy className="w-3 h-3 inline mr-1" />Copiar</>}
                    </button>
                  </div>
                  {/* Requirements badges */}
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {link.requireExplanationCancelaciones && <span className="text-[10px] px-1.5 py-0.5 bg-red-50 text-red-500 rounded">Expl. Cancel.</span>}
                    {link.requireExplanationNovedades && <span className="text-[10px] px-1.5 py-0.5 bg-orange-50 text-orange-500 rounded">Expl. Novedades</span>}
                    {link.requireExplanationRendimiento && <span className="text-[10px] px-1.5 py-0.5 bg-amber-50 text-amber-500 rounded">Expl. Rendimiento</span>}
                    {link.requirePhotos && <span className="text-[10px] px-1.5 py-0.5 bg-purple-50 text-purple-500 rounded">Min {link.minPhotos} fotos</span>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { toggleClosureLink(link.id); refresh(); }}
                    className={`p-1.5 rounded-lg ${link.isActive ? 'text-emerald-500 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-50'}`}>
                    {link.isActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                  </button>
                  <button onClick={() => { deleteClosureLink(link.id); refresh(); }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-navy-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-navy-700 shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-navy-700">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-indigo-500" />
                Crear Link de Cierre de Ronda
              </h3>
              <button onClick={() => setShowCreate(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-navy-700 rounded-lg">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Nombre *</label>
                <input type="text" value={formName} onChange={e => setFormName(e.target.value)}
                  placeholder="Ej: Cierre Ronda ANGIE 26-Feb"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-navy-900 border border-slate-300 dark:border-navy-600 rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Operador</label>
                <select value={formOperator} onChange={e => setFormOperator(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-navy-900 border border-slate-300 dark:border-navy-600 rounded-lg text-sm">
                  <option value="any">Cualquiera (elige al abrir)</option>
                  {operadores.map(op => (
                    <option key={op.id} value={op.id}>{op.icono} {op.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Fecha Ronda</label>
                  <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-navy-900 border border-slate-300 dark:border-navy-600 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Expira</label>
                  <input type="date" value={formExpires} onChange={e => setFormExpires(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-navy-900 border border-slate-300 dark:border-navy-600 rounded-lg text-sm" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-2">
                  Requerimientos (Cierre Inteligente)
                </label>
                <div className="space-y-2">
                  {[
                    { label: 'Explicar cancelaciones', state: formReqCancelaciones, set: setFormReqCancelaciones },
                    { label: 'Explicar novedades', state: formReqNovedades, set: setFormReqNovedades },
                    { label: 'Explicar bajo rendimiento', state: formReqRendimiento, set: setFormReqRendimiento },
                  ].map(item => (
                    <label key={item.label} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
                      <input type="checkbox" checked={item.state} onChange={e => item.set(e.target.checked)}
                        className="w-4 h-4 text-indigo-600 rounded" />
                      {item.label}
                    </label>
                  ))}
                  <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
                    <input type="checkbox" checked={formReqPhotos} onChange={e => setFormReqPhotos(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded" />
                    Fotos obligatorias
                    {formReqPhotos && (
                      <input type="number" min="1" max="10" value={formMinPhotos} onChange={e => setFormMinPhotos(parseInt(e.target.value) || 1)}
                        className="w-14 px-2 py-1 bg-slate-50 dark:bg-navy-900 border border-slate-300 dark:border-navy-600 rounded text-xs ml-1" />
                    )}
                  </label>
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-slate-200 dark:border-navy-700">
              <button onClick={() => setShowCreate(false)}
                className="flex-1 px-4 py-2 border border-slate-300 dark:border-navy-600 text-slate-600 dark:text-slate-400 rounded-lg text-sm">
                Cancelar
              </button>
              <button onClick={handleCreate} disabled={!formName.trim()}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                Crear Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review closure modal */}
      {viewingClosure && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-navy-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-navy-700 shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-navy-700">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white">Revisar Cierre de Ronda</h3>
                <p className="text-sm text-slate-500">{viewingClosure.operatorName} - {viewingClosure.date}</p>
              </div>
              <button onClick={() => setViewingClosure(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-navy-700 rounded-lg">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {/* Self-reported data */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 mb-2">DATOS REPORTADOS POR OPERADOR</h4>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { label: 'Guías', value: viewingClosure.selfReportedGuias },
                    { label: 'Realizadas', value: viewingClosure.selfReportedRealizadas },
                    { label: 'Canceladas', value: viewingClosure.selfReportedCanceladas },
                    { label: 'Novedades', value: viewingClosure.selfReportedNovedades },
                    { label: 'Pendientes', value: viewingClosure.selfReportedPendientes },
                  ].map(d => (
                    <div key={d.label} className="text-center p-2 bg-slate-50 dark:bg-navy-700 rounded-lg">
                      <p className="text-lg font-bold text-slate-800 dark:text-white">{d.value}</p>
                      <p className="text-[10px] text-slate-500">{d.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Discrepancies */}
              {viewingClosure.discrepancies.length > 0 && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                  <h4 className="text-xs font-bold text-red-600 mb-2 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> DISCREPANCIAS DETECTADAS
                  </h4>
                  {viewingClosure.discrepancies.map(d => (
                    <div key={d.id} className="text-sm text-red-600 flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${d.severity === 'high' ? 'bg-red-500' : d.severity === 'medium' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                      {d.field}: Reportado {d.selfReported} vs CSV {d.csvValue} (dif: {d.difference})
                    </div>
                  ))}
                </div>
              )}

              {/* Explanations */}
              {(viewingClosure.explanationCancelaciones || viewingClosure.explanationNovedades || viewingClosure.explanationBajoRendimiento) && (
                <div>
                  <h4 className="text-xs font-bold text-slate-500 mb-2">EXPLICACIONES</h4>
                  {viewingClosure.explanationCancelaciones && (
                    <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg mb-2">
                      <p className="text-xs font-medium text-red-600">Cancelaciones:</p>
                      <p className="text-sm text-red-500">{viewingClosure.explanationCancelaciones}</p>
                    </div>
                  )}
                  {viewingClosure.explanationNovedades && (
                    <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg mb-2">
                      <p className="text-xs font-medium text-orange-600">Novedades:</p>
                      <p className="text-sm text-orange-500">{viewingClosure.explanationNovedades}</p>
                    </div>
                  )}
                  {viewingClosure.explanationBajoRendimiento && (
                    <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                      <p className="text-xs font-medium text-amber-600">Bajo Rendimiento:</p>
                      <p className="text-sm text-amber-500">{viewingClosure.explanationBajoRendimiento}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Evidence */}
              {viewingClosure.evidence.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-500 mb-2">EVIDENCIA ({viewingClosure.evidence.length})</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {viewingClosure.evidence.map(ev => (
                      <div key={ev.id} className="p-2 bg-slate-50 dark:bg-navy-700 rounded-lg">
                        {ev.type === 'photo' && ev.fileData && (
                          <img src={ev.fileData} alt="" className="w-full h-24 object-cover rounded-lg mb-1" />
                        )}
                        {ev.type === 'note' && (
                          <div className="flex items-start gap-1 text-xs">
                            <MessageSquare className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" />
                            <span className="text-slate-600 dark:text-slate-400">{ev.note}</span>
                          </div>
                        )}
                        {ev.type === 'document' && (
                          <div className="flex items-center gap-1 text-xs">
                            <FileText className="w-3 h-3 text-blue-500" />
                            <span className="text-slate-600 dark:text-slate-400 truncate">{ev.fileName}</span>
                          </div>
                        )}
                        <p className="text-[10px] text-slate-400 mt-1">{ev.category}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Checklist */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 mb-2">CHECKLIST DE CIERRE</h4>
                <div className="grid grid-cols-2 gap-1">
                  {[
                    { key: 'vehicleOk', label: 'Vehículo OK' },
                    { key: 'documentsDelivered', label: 'Documentos entregados' },
                    { key: 'cashCollected', label: 'Dinero entregado' },
                    { key: 'devolutionsReturned', label: 'Devoluciones' },
                    { key: 'novedadesReported', label: 'Novedades reportadas' },
                    { key: 'equipmentReturned', label: 'Equipo devuelto' },
                  ].map(item => (
                    <div key={item.key} className={`text-xs p-1.5 rounded flex items-center gap-1 ${
                      viewingClosure.checklist[item.key as keyof typeof viewingClosure.checklist]
                        ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20'
                        : 'text-red-600 bg-red-50 dark:bg-red-900/20'
                    }`}>
                      {viewingClosure.checklist[item.key as keyof typeof viewingClosure.checklist]
                        ? <CheckCircle className="w-3 h-3" />
                        : <X className="w-3 h-3" />
                      }
                      {item.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* General comment */}
              {viewingClosure.generalComment && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                  <h4 className="text-xs font-bold text-blue-600 mb-1">Comentario General</h4>
                  <p className="text-sm text-blue-500">{viewingClosure.generalComment}</p>
                </div>
              )}

              {/* Admin review */}
              {viewingClosure.status === 'submitted' && (
                <div className="border-t border-slate-200 dark:border-navy-700 pt-4">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Nota del Admin</label>
                  <textarea
                    value={reviewNote}
                    onChange={e => setReviewNote(e.target.value)}
                    placeholder="Comentario sobre el cierre..."
                    rows={2}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-navy-900 border border-slate-300 dark:border-navy-600 rounded-lg text-sm resize-none"
                  />
                  <div className="flex gap-3 mt-3">
                    <button
                      onClick={() => handleReview(viewingClosure.id, 'reviewed')}
                      className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 flex items-center justify-center gap-1"
                    >
                      <CheckCircle className="w-4 h-4" /> Aprobar
                    </button>
                    <button
                      onClick={() => handleReview(viewingClosure.id, 'flagged')}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 flex items-center justify-center gap-1"
                    >
                      <Flag className="w-4 h-4" /> Flaggear
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RondaClosureLinkManager;
