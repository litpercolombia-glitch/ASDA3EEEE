/**
 * Formulario de Cierre de Ronda - Accesible por link público
 * El operador llena datos + evidencia + checklist al final de su ronda
 * Cierre inteligente: pide evidencia obligatoria según anomalías
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  Upload,
  CheckCircle,
  AlertTriangle,
  Camera,
  FileText,
  Trash2,
  Loader2,
  User,
  Package,
  XCircle,
  Clock,
  ClipboardCheck,
  MessageSquare,
  Image,
  Shield,
  ChevronDown,
  ChevronUp,
  Plus,
} from 'lucide-react';
import {
  RondaClosureLink,
  RondaEvidence,
  RondaClosureChecklist,
  submitClosure,
  markClosureLinkUsed,
} from '../../services/rondaReportBridgeService';
import { USUARIOS_OPERADORES } from '../../constants/analisis-rondas';

interface RondaClosureFormProps {
  closureLink: RondaClosureLink;
}

export const RondaClosureForm: React.FC<RondaClosureFormProps> = ({ closureLink }) => {
  // Operator selection (if link is for 'any')
  const [selectedOperator, setSelectedOperator] = useState(
    closureLink.operatorId !== 'any' ? closureLink.operatorId : ''
  );
  const [operatorName, setOperatorName] = useState(
    closureLink.operatorId !== 'any' ? closureLink.operatorName : ''
  );

  // Self-reported numbers
  const [guiasIniciales, setGuiasIniciales] = useState('');
  const [guiasRealizadas, setGuiasRealizadas] = useState('');
  const [canceladas, setCanceladas] = useState('');
  const [novedades, setNovedades] = useState('');
  const [pendientes, setPendientes] = useState('');

  // Explanations
  const [explCancelaciones, setExplCancelaciones] = useState('');
  const [explNovedades, setExplNovedades] = useState('');
  const [explRendimiento, setExplRendimiento] = useState('');

  // Evidence
  const [evidence, setEvidence] = useState<RondaEvidence[]>([]);
  const [noteText, setNoteText] = useState('');
  const [noteCategory, setNoteCategory] = useState<RondaEvidence['category']>('general');

  // Checklist
  const [checklist, setChecklist] = useState<RondaClosureChecklist>({
    vehicleOk: false,
    documentsDelivered: false,
    cashCollected: false,
    devolutionsReturned: false,
    novedadesReported: false,
    equipmentReturned: false,
  });

  // General comment
  const [generalComment, setGeneralComment] = useState('');

  // UI state
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showChecklist, setShowChecklist] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) return; // max 5MB per file
      const reader = new FileReader();
      reader.onload = (ev) => {
        const newEvidence: RondaEvidence = {
          id: crypto.randomUUID?.() || Date.now().toString(),
          type: file.type.startsWith('image/') ? 'photo' : 'document',
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          fileData: ev.target?.result as string,
          category: 'general',
          timestamp: new Date().toISOString(),
        };
        setEvidence(prev => [...prev, newEvidence]);
      };
      reader.readAsDataURL(file);
    });
    if (e.target) e.target.value = '';
  }, []);

  const addNote = () => {
    if (!noteText.trim()) return;
    const note: RondaEvidence = {
      id: crypto.randomUUID?.() || Date.now().toString(),
      type: 'note',
      note: noteText.trim(),
      category: noteCategory,
      timestamp: new Date().toISOString(),
    };
    setEvidence(prev => [...prev, note]);
    setNoteText('');
  };

  const removeEvidence = (id: string) => {
    setEvidence(prev => prev.filter(e => e.id !== id));
  };

  const photoCount = evidence.filter(e => e.type === 'photo').length;

  const handleSubmit = async () => {
    // Validations
    if (!selectedOperator && closureLink.operatorId === 'any') {
      setError('Selecciona tu nombre');
      return;
    }
    if (!guiasIniciales || !guiasRealizadas) {
      setError('Completa al menos guías iniciales y realizadas');
      return;
    }
    if (closureLink.requireExplanationCancelaciones && !explCancelaciones.trim()) {
      setError('Debes explicar las cancelaciones (es obligatorio por anomalía detectada)');
      return;
    }
    if (closureLink.requireExplanationNovedades && !explNovedades.trim()) {
      setError('Debes explicar las novedades (es obligatorio por anomalía detectada)');
      return;
    }
    if (closureLink.requireExplanationRendimiento && !explRendimiento.trim()) {
      setError('Debes explicar el bajo rendimiento (es obligatorio por anomalía detectada)');
      return;
    }
    if (closureLink.requirePhotos && photoCount < closureLink.minPhotos) {
      setError(`Debes adjuntar al menos ${closureLink.minPhotos} foto(s) como evidencia`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const name = operatorName || USUARIOS_OPERADORES.find(u => u.id === selectedOperator)?.nombre || selectedOperator;

      submitClosure({
        operatorId: selectedOperator || closureLink.operatorId,
        operatorName: name,
        date: closureLink.date,
        linkToken: closureLink.token,
        selfReportedGuias: parseInt(guiasIniciales) || 0,
        selfReportedRealizadas: parseInt(guiasRealizadas) || 0,
        selfReportedCanceladas: parseInt(canceladas) || 0,
        selfReportedNovedades: parseInt(novedades) || 0,
        selfReportedPendientes: parseInt(pendientes) || 0,
        explanationCancelaciones: explCancelaciones.trim() || undefined,
        explanationNovedades: explNovedades.trim() || undefined,
        explanationBajoRendimiento: explRendimiento.trim() || undefined,
        evidence,
        checklist,
        generalComment: generalComment.trim(),
        csvMetrics: undefined,
        reviewedAt: undefined,
        reviewedBy: undefined,
        adminNotes: undefined,
      });

      markClosureLinkUsed(closureLink.token);
      setSuccess(true);
    } catch {
      setError('Error al enviar. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-950 flex items-center justify-center p-4">
        <div className="bg-gray-900/80 backdrop-blur-xl rounded-3xl border border-gray-700/50 p-12 max-w-md w-full text-center shadow-2xl">
          <div className="p-5 bg-green-500/20 rounded-full w-fit mx-auto mb-6">
            <CheckCircle className="w-16 h-16 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Cierre de Ronda Enviado</h2>
          <p className="text-gray-400 mb-4">
            Tu cierre de ronda para el {closureLink.date} ha sido registrado.
          </p>
          <p className="text-gray-500 text-sm">
            {evidence.length} evidencia(s) adjuntas - El admin revisará tu cierre pronto.
          </p>
        </div>
      </div>
    );
  }

  const hasAnomalyRequirements = closureLink.requireExplanationCancelaciones ||
    closureLink.requireExplanationNovedades ||
    closureLink.requireExplanationRendimiento ||
    closureLink.requirePhotos;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-950 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div className="bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/30 rounded-2xl">
              <ClipboardCheck className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{closureLink.name}</h1>
              <p className="text-sm text-gray-400">{closureLink.description || 'Cierre de ronda'}</p>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Fecha: {closureLink.date} - Solicitado por {closureLink.createdByName}
              </p>
            </div>
          </div>

          {/* Anomaly warnings */}
          {hasAnomalyRequirements && (
            <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
              <div className="flex items-center gap-2 text-amber-400 text-sm font-medium mb-1">
                <AlertTriangle className="w-4 h-4" />
                Se detectaron anomalías - campos obligatorios adicionales
              </div>
              <ul className="text-xs text-amber-300/80 space-y-0.5 ml-6">
                {closureLink.requireExplanationCancelaciones && <li>- Explicar cancelaciones</li>}
                {closureLink.requireExplanationNovedades && <li>- Explicar novedades</li>}
                {closureLink.requireExplanationRendimiento && <li>- Explicar bajo rendimiento</li>}
                {closureLink.requirePhotos && <li>- Adjuntar min. {closureLink.minPhotos} foto(s)</li>}
              </ul>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300 text-sm">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Operator selection */}
        {closureLink.operatorId === 'any' && (
          <div className="bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-6">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
              <User className="w-4 h-4" />
              Selecciona tu nombre <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {USUARIOS_OPERADORES.map(op => (
                <button
                  key={op.id}
                  onClick={() => { setSelectedOperator(op.id); setOperatorName(op.nombre); }}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    selectedOperator === op.id
                      ? 'border-emerald-500 bg-emerald-500/20 text-white'
                      : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  <div className="text-2xl mb-1">{op.icono}</div>
                  <div className="text-xs font-medium">{op.nombre}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Self-reported numbers */}
        <div className="bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-6">
          <h3 className="flex items-center gap-2 text-white font-medium mb-4">
            <Package className="w-5 h-5 text-blue-400" />
            Datos de la Ronda
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: 'Guías Iniciales', value: guiasIniciales, set: setGuiasIniciales, required: true, color: 'blue' },
              { label: 'Realizadas', value: guiasRealizadas, set: setGuiasRealizadas, required: true, color: 'green' },
              { label: 'Canceladas', value: canceladas, set: setCanceladas, required: false, color: 'red' },
              { label: 'Novedades', value: novedades, set: setNovedades, required: false, color: 'amber' },
              { label: 'Pendientes', value: pendientes, set: setPendientes, required: false, color: 'orange' },
            ].map(field => (
              <div key={field.label}>
                <label className="text-xs text-gray-400 mb-1 block">
                  {field.label} {field.required && <span className="text-red-400">*</span>}
                </label>
                <input
                  type="number"
                  min="0"
                  value={field.value}
                  onChange={(e) => field.set(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2.5 bg-gray-800 border border-gray-600 rounded-xl text-white text-center text-lg font-bold placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Explanations (conditionally required) */}
        {(closureLink.requireExplanationCancelaciones || closureLink.requireExplanationNovedades || closureLink.requireExplanationRendimiento) && (
          <div className="bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-amber-500/30 p-6">
            <h3 className="flex items-center gap-2 text-amber-400 font-medium mb-4">
              <MessageSquare className="w-5 h-5" />
              Explicaciones Requeridas
            </h3>
            <div className="space-y-4">
              {closureLink.requireExplanationCancelaciones && (
                <div>
                  <label className="text-sm text-gray-300 mb-1.5 block">
                    Explicación de cancelaciones <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={explCancelaciones}
                    onChange={(e) => setExplCancelaciones(e.target.value)}
                    placeholder="Explica por qué hubo cancelaciones..."
                    rows={2}
                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                  />
                </div>
              )}
              {closureLink.requireExplanationNovedades && (
                <div>
                  <label className="text-sm text-gray-300 mb-1.5 block">
                    Explicación de novedades <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={explNovedades}
                    onChange={(e) => setExplNovedades(e.target.value)}
                    placeholder="Explica las novedades encontradas..."
                    rows={2}
                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                  />
                </div>
              )}
              {closureLink.requireExplanationRendimiento && (
                <div>
                  <label className="text-sm text-gray-300 mb-1.5 block">
                    Explicación de bajo rendimiento <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={explRendimiento}
                    onChange={(e) => setExplRendimiento(e.target.value)}
                    placeholder="Explica qué afectó tu rendimiento hoy..."
                    rows={2}
                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Evidence upload */}
        <div className="bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-6">
          <h3 className="flex items-center gap-2 text-white font-medium mb-4">
            <Camera className="w-5 h-5 text-purple-400" />
            Evidencia
            {closureLink.requirePhotos && (
              <span className="text-xs text-amber-400 ml-2">
                (min. {closureLink.minPhotos} fotos requeridas - tienes {photoCount})
              </span>
            )}
          </h3>

          {/* Photo upload */}
          <div className="flex gap-3 mb-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-600 rounded-xl text-gray-400 hover:border-purple-500 hover:text-purple-400 transition-colors"
            >
              <Image className="w-5 h-5" />
              Subir Foto / Documento
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {/* Note */}
          <div className="flex gap-2 mb-4">
            <select
              value={noteCategory}
              onChange={(e) => setNoteCategory(e.target.value as RondaEvidence['category'])}
              className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="general">General</option>
              <option value="novedad">Novedad</option>
              <option value="cancelacion">Cancelación</option>
              <option value="incidencia">Incidencia</option>
            </select>
            <input
              type="text"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Agregar nota..."
              className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              onKeyDown={(e) => e.key === 'Enter' && addNote()}
            />
            <button
              onClick={addNote}
              disabled={!noteText.trim()}
              className="px-3 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Evidence list */}
          {evidence.length > 0 && (
            <div className="space-y-2">
              {evidence.map(ev => (
                <div key={ev.id} className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-xl">
                  {ev.type === 'photo' && ev.fileData && (
                    <img src={ev.fileData} alt="" className="w-12 h-12 object-cover rounded-lg" />
                  )}
                  {ev.type === 'document' && <FileText className="w-8 h-8 text-blue-400" />}
                  {ev.type === 'note' && <MessageSquare className="w-8 h-8 text-amber-400" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">
                      {ev.type === 'note' ? ev.note : ev.fileName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {ev.category} - {ev.type === 'note' ? 'Nota' : `${((ev.fileSize || 0) / 1024).toFixed(0)} KB`}
                    </p>
                  </div>
                  <button
                    onClick={() => removeEvidence(ev.id)}
                    className="p-1.5 hover:bg-red-500/20 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Checklist */}
        <div className="bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-6">
          <button
            onClick={() => setShowChecklist(!showChecklist)}
            className="w-full flex items-center justify-between"
          >
            <h3 className="flex items-center gap-2 text-white font-medium">
              <ClipboardCheck className="w-5 h-5 text-cyan-400" />
              Checklist de Cierre
              <span className="text-xs text-gray-500">
                ({Object.values(checklist).filter(Boolean).length}/6)
              </span>
            </h3>
            {showChecklist ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>

          {showChecklist && (
            <div className="mt-4 space-y-2">
              {[
                { key: 'vehicleOk' as const, label: 'Vehículo en buen estado / estacionado' },
                { key: 'documentsDelivered' as const, label: 'Documentos/planillas entregados' },
                { key: 'cashCollected' as const, label: 'Dinero recaudado entregado / no aplica' },
                { key: 'devolutionsReturned' as const, label: 'Devoluciones regresadas a bodega' },
                { key: 'novedadesReported' as const, label: 'Novedades reportadas al supervisor' },
                { key: 'equipmentReturned' as const, label: 'Equipo/escáner devuelto' },
              ].map(item => (
                <label
                  key={item.key}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    checklist[item.key]
                      ? 'border-emerald-500/50 bg-emerald-500/10'
                      : 'border-gray-700 bg-gray-800/30 hover:border-gray-600'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checklist[item.key]}
                    onChange={(e) => setChecklist(prev => ({ ...prev, [item.key]: e.target.checked }))}
                    className="w-4 h-4 text-emerald-600 bg-gray-700 border-gray-600 rounded focus:ring-emerald-500"
                  />
                  <span className={`text-sm ${checklist[item.key] ? 'text-emerald-300' : 'text-gray-400'}`}>
                    {item.label}
                  </span>
                  {checklist[item.key] && <CheckCircle className="w-4 h-4 text-emerald-400 ml-auto" />}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* General comment */}
        <div className="bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-6">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
            <MessageSquare className="w-4 h-4" />
            Comentario General (opcional)
          </label>
          <textarea
            value={generalComment}
            onChange={(e) => setGeneralComment(e.target.value)}
            placeholder="Algo más que quieras reportar sobre tu ronda de hoy..."
            rows={3}
            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold text-lg shadow-lg shadow-emerald-500/25"
        >
          {isSubmitting ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Enviando...</>
          ) : (
            <><ClipboardCheck className="w-5 h-5" /> Enviar Cierre de Ronda</>
          )}
        </button>

        <p className="text-center text-xs text-gray-500">
          Powered by LITPER PRO - Sistema de Control de Rondas
        </p>
      </div>
    </div>
  );
};

export default RondaClosureForm;
