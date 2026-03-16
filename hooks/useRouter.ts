// hooks/useRouter.ts
// Lightweight URL routing - syncs browser URL with layout store
// Inspired by Linear's clean URL structure

import { useEffect, useCallback } from 'react';
import { useLayoutStore, MainSection } from '../stores/layoutStore';

const SECTION_ROUTES: Record<string, MainSection> = {
  '': 'inicio',
  'inicio': 'inicio',
  'operaciones': 'operaciones',
  'inteligencia': 'inteligencia',
  'cerebro-ia': 'cerebro-ia',
  'negocio': 'negocio',
  'marketing': 'marketing',
  'config': 'config',
  'enterprise': 'enterprise',
};

const SECTION_TO_PATH: Record<MainSection, string> = {
  'inicio': '/',
  'operaciones': '/operaciones',
  'inteligencia': '/inteligencia',
  'cerebro-ia': '/cerebro-ia',
  'negocio': '/negocio',
  'marketing': '/marketing',
  'config': '/config',
  'enterprise': '/enterprise',
};

function getSectionFromPath(pathname: string): MainSection {
  const clean = pathname.replace(/^\//, '').split('/')[0];
  return SECTION_ROUTES[clean] || 'inicio';
}

export function useRouter() {
  const { activeSection, setActiveSection } = useLayoutStore();

  // Sync URL → Store on mount and popstate
  useEffect(() => {
    const syncFromURL = () => {
      const section = getSectionFromPath(window.location.pathname);
      if (section !== activeSection) {
        setActiveSection(section);
      }
    };

    syncFromURL();
    window.addEventListener('popstate', syncFromURL);
    return () => window.removeEventListener('popstate', syncFromURL);
  }, []); // Only on mount

  // Sync Store → URL when section changes
  useEffect(() => {
    const targetPath = SECTION_TO_PATH[activeSection] || '/';
    if (window.location.pathname !== targetPath) {
      window.history.pushState({ section: activeSection }, '', targetPath);
    }
  }, [activeSection]);

  const navigate = useCallback((section: MainSection) => {
    setActiveSection(section);
  }, [setActiveSection]);

  return { activeSection, navigate };
}

export { SECTION_TO_PATH, SECTION_ROUTES };
