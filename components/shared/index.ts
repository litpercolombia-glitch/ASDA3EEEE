/**
 * SHARED COMPONENTS
 *
 * Componentes reutilizables en toda la aplicacion.
 * Estos componentes son "tontos" (presentacionales) y no tienen logica de negocio.
 *
 * USO:
 * import { Card, StatCard, DataTable, Modal, Button } from '@/components/shared'
 */

// ============================================
// CARDS
// ============================================

export { default as Card } from './cards/Card';
export { default as StatCard } from './cards/StatCard';
export { default as MetricCard } from './cards/MetricCard';

// ============================================
// TABLES
// ============================================

export { default as DataTable } from './tables/DataTable';
export { default as SimpleTable } from './tables/SimpleTable';

// ============================================
// MODALS
// ============================================

export { default as Modal } from './modals/Modal';
export { default as ConfirmModal } from './modals/ConfirmModal';

// ============================================
// FORMS
// ============================================

export { default as Input } from './forms/Input';
export { default as Select } from './forms/Select';
export { default as Button } from './forms/Button';
export { default as SearchInput } from './forms/SearchInput';

// ============================================
// FEEDBACK
// ============================================

export { default as LoadingSpinner } from './feedback/LoadingSpinner';
export { default as EmptyState } from './feedback/EmptyState';
export { default as ErrorState } from './feedback/ErrorState';
