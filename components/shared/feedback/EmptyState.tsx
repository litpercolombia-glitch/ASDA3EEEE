/**
 * EMPTY STATE COMPONENT
 */

import React from 'react';
import { Package, Search, FileX, Inbox, LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: LucideIcon | 'package' | 'search' | 'file' | 'inbox';
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No hay datos',
  description = 'No se encontraron resultados',
  icon = 'inbox',
  action,
  className = '',
}) => {
  const getIcon = () => {
    if (typeof icon !== 'string') {
      const CustomIcon = icon;
      return <CustomIcon className="w-16 h-16 text-slate-600" />;
    }

    const icons = {
      package: Package,
      search: Search,
      file: FileX,
      inbox: Inbox,
    };

    const IconComponent = icons[icon];
    return <IconComponent className="w-16 h-16 text-slate-600" />;
  };

  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 ${className}`}>
      <div className="mb-4 opacity-50">{getIcon()}</div>
      <h3 className="text-lg font-medium text-slate-300 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 text-center max-w-md mb-6">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
