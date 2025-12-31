import { useEffect, useCallback } from 'react';
import { useAppStore } from '../stores/appStore';
import { PROCESO_GUIAS, PROCESO_NOVEDAD } from '../config/processConfig';

export const useKeyboardShortcuts = () => {
  const {
    procesoActivo,
    setProcesoActivo,
    incrementarContador,
    decrementarContador,
    finalizarBloque,
    setMostrarModalExportar,
    setViewLayout,
    viewLayout,
  } = useAppStore();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ignorar si está escribiendo en un input
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }

    const key = e.key.toLowerCase();
    const isShift = e.shiftKey;

    // Atajos globales
    switch (key) {
      case 'r':
        if (!isShift) {
          e.preventDefault();
          finalizarBloque();
        }
        break;
      case 'e':
        if (!isShift) {
          e.preventDefault();
          setMostrarModalExportar(true);
        }
        break;
      case 'g':
        e.preventDefault();
        setProcesoActivo('guias');
        break;
      case 'n':
        e.preventDefault();
        setProcesoActivo('novedad');
        break;
      case 'f1':
        e.preventDefault();
        setViewLayout('widget');
        break;
      case 'f2':
        e.preventDefault();
        setViewLayout('sidebar');
        break;
      case 'f3':
        e.preventDefault();
        setViewLayout('compact');
        break;
    }

    // Atajos numéricos para contadores
    const proceso = procesoActivo === 'guias' ? PROCESO_GUIAS : PROCESO_NOVEDAD;
    const numKey = parseInt(key);

    if (!isNaN(numKey) && numKey >= 1 && numKey <= 9) {
      const campo = proceso.campos[numKey - 1];
      if (campo && !campo.esCalculado) {
        e.preventDefault();
        if (isShift) {
          decrementarContador(campo.id);
        } else {
          incrementarContador(campo.id);
        }
      }
    }
  }, [procesoActivo, incrementarContador, decrementarContador, finalizarBloque, setMostrarModalExportar, setProcesoActivo, setViewLayout]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
};

export default useKeyboardShortcuts;
