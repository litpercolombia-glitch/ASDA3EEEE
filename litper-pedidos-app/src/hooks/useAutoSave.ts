import { useEffect, useRef } from 'react';
import { useAppStore } from '../stores/appStore';
import { AUTO_SAVE_INTERVAL } from '../config/processConfig';

export const useAutoSave = () => {
  const { guardarProgreso, bloqueIniciadoEn, autoGuardadoActivo } = useAppStore();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!autoGuardadoActivo || !bloqueIniciadoEn) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Guardar cada 30 segundos
    intervalRef.current = setInterval(() => {
      guardarProgreso();
    }, AUTO_SAVE_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoGuardadoActivo, bloqueIniciadoEn, guardarProgreso]);

  return null;
};

export default useAutoSave;
