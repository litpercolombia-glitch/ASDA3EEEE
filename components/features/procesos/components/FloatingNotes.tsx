/**
 * FLOATING NOTES COMPONENT
 * Notas flotantes estilo sticky notes de Windows
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, X, Pin, PinOff, Minimize2, Maximize2, GripVertical, Eye, EyeOff } from 'lucide-react';
import { useProcesosStore } from '../stores/procesosStore';
import { NotaFlotante } from '../types';

const NOTE_COLORS = {
  default: { bg: 'bg-slate-700', header: 'bg-slate-600', text: 'text-slate-100' },
  yellow: { bg: 'bg-yellow-200', header: 'bg-yellow-300', text: 'text-yellow-900' },
  green: { bg: 'bg-green-200', header: 'bg-green-300', text: 'text-green-900' },
  red: { bg: 'bg-red-200', header: 'bg-red-300', text: 'text-red-900' },
  blue: { bg: 'bg-blue-200', header: 'bg-blue-300', text: 'text-blue-900' },
};

interface FloatingNoteProps {
  nota: NotaFlotante;
  onUpdate: (id: string, datos: Partial<NotaFlotante>) => void;
  onDelete: (id: string) => void;
}

const FloatingNote: React.FC<FloatingNoteProps> = ({ nota, onUpdate, onDelete }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const noteRef = useRef<HTMLDivElement>(null);

  const colors = NOTE_COLORS[nota.color];

  // Handle drag
  const handleMouseDown = (e: React.MouseEvent) => {
    if (nota.bloqueada) return;
    if ((e.target as HTMLElement).closest('.no-drag')) return;

    setIsDragging(true);
    setDragOffset({
      x: e.clientX - nota.posicion.x,
      y: e.clientY - nota.posicion.y,
    });
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging && !nota.bloqueada) {
        onUpdate(nota.id, {
          posicion: {
            x: Math.max(0, e.clientX - dragOffset.x),
            y: Math.max(0, e.clientY - dragOffset.y),
          },
        });
      }
    },
    [isDragging, dragOffset, nota.id, nota.bloqueada, onUpdate]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  if (nota.oculta) return null;

  if (nota.minimizada) {
    return (
      <div
        ref={noteRef}
        className={`fixed z-40 ${colors.bg} rounded-lg shadow-lg cursor-pointer hover:scale-105 transition-transform`}
        style={{
          left: nota.posicion.x,
          top: nota.posicion.y,
          width: '48px',
          height: '48px',
        }}
        onClick={() => onUpdate(nota.id, { minimizada: false })}
      >
        <div className={`w-full h-full ${colors.header} rounded-lg flex items-center justify-center`}>
          <span className="text-xl">📝</span>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={noteRef}
      className={`fixed z-40 ${colors.bg} rounded-lg shadow-2xl overflow-hidden`}
      style={{
        left: nota.posicion.x,
        top: nota.posicion.y,
        width: nota.tamaño.width,
        height: nota.tamaño.height,
        cursor: isDragging ? 'grabbing' : 'default',
      }}
    >
      {/* Header */}
      <div
        className={`${colors.header} px-2 py-1 flex items-center justify-between cursor-grab active:cursor-grabbing`}
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-1">
          <GripVertical className="w-3 h-3 opacity-50" />
          <span className="text-xs font-medium truncate max-w-[100px]">
            {nota.contenido.split('\n')[0].substring(0, 15) || 'Nota'}
          </span>
        </div>

        <div className="flex items-center gap-0.5 no-drag">
          {/* Color picker */}
          <div className="relative group">
            <button className="p-1 hover:bg-black/10 rounded">
              <div className="w-3 h-3 rounded-full border border-black/20" style={{ backgroundColor: NOTE_COLORS[nota.color].bg.replace('bg-', '') }} />
            </button>
            <div className="absolute right-0 top-full mt-1 hidden group-hover:flex gap-1 bg-slate-800 p-1 rounded shadow-lg z-50">
              {(Object.keys(NOTE_COLORS) as Array<keyof typeof NOTE_COLORS>).map((color) => (
                <button
                  key={color}
                  onClick={() => onUpdate(nota.id, { color })}
                  className={`w-4 h-4 rounded-full ${NOTE_COLORS[color].bg} border border-black/20 hover:scale-110 transition-transform`}
                />
              ))}
            </div>
          </div>

          {/* Pin */}
          <button
            onClick={() => onUpdate(nota.id, { bloqueada: !nota.bloqueada })}
            className={`p-1 hover:bg-black/10 rounded ${nota.bloqueada ? 'text-amber-600' : ''}`}
          >
            {nota.bloqueada ? <Pin className="w-3 h-3" /> : <PinOff className="w-3 h-3" />}
          </button>

          {/* Minimize */}
          <button
            onClick={() => onUpdate(nota.id, { minimizada: true })}
            className="p-1 hover:bg-black/10 rounded"
          >
            <Minimize2 className="w-3 h-3" />
          </button>

          {/* Close */}
          <button
            onClick={() => onDelete(nota.id)}
            className="p-1 hover:bg-red-500 hover:text-white rounded"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Content */}
      <textarea
        value={nota.contenido}
        onChange={(e) => onUpdate(nota.id, { contenido: e.target.value })}
        className={`w-full h-[calc(100%-28px)] p-2 ${colors.bg} ${colors.text} resize-none focus:outline-none text-sm`}
        placeholder="Escribe tu nota aqui..."
        disabled={nota.bloqueada}
      />

      {/* Resize handle */}
      {!nota.bloqueada && (
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize no-drag"
          onMouseDown={(e) => {
            e.stopPropagation();
            setIsResizing(true);
          }}
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 text-slate-500">
            <path fill="currentColor" d="M22 22H20V20H22V22M22 18H20V16H22V18M18 22H16V20H18V22M18 18H16V16H18V18M14 22H12V20H14V22M22 14H20V12H22V14Z" />
          </svg>
        </div>
      )}
    </div>
  );
};

interface FloatingNotesContainerProps {
  className?: string;
}

const FloatingNotesContainer: React.FC<FloatingNotesContainerProps> = ({ className = '' }) => {
  const { usuarioActual, notas, mostrarNotas, agregarNota, actualizarNota, eliminarNota, toggleNotas, getNotasUsuario } = useProcesosStore();

  const userNotas = usuarioActual ? getNotasUsuario(usuarioActual.id) : [];

  const handleAddNote = () => {
    if (!usuarioActual) return;

    agregarNota({
      usuarioId: usuarioActual.id,
      contenido: '',
      color: 'yellow',
      posicion: { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 },
      tamaño: { width: 200, height: 200 },
      siempreVisible: false,
      bloqueada: false,
      minimizada: false,
      oculta: false,
    });
  };

  return (
    <div className={className}>
      {/* Controls */}
      <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2">
        <button
          onClick={toggleNotas}
          className={`p-3 rounded-full shadow-lg transition-all ${
            mostrarNotas
              ? 'bg-amber-500 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          {mostrarNotas ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
        </button>

        {mostrarNotas && usuarioActual && (
          <button
            onClick={handleAddNote}
            className="p-3 rounded-full bg-yellow-400 text-yellow-900 shadow-lg hover:bg-yellow-300 transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Notes */}
      {mostrarNotas &&
        userNotas.map((nota) => (
          <FloatingNote
            key={nota.id}
            nota={nota}
            onUpdate={actualizarNota}
            onDelete={eliminarNota}
          />
        ))}

      {/* Empty state hint */}
      {mostrarNotas && userNotas.length === 0 && usuarioActual && (
        <div className="fixed bottom-20 right-4 z-40 bg-slate-800 text-slate-300 px-4 py-2 rounded-lg text-sm shadow-lg">
          Haz clic en + para crear una nota
        </div>
      )}
    </div>
  );
};

export default FloatingNotesContainer;
