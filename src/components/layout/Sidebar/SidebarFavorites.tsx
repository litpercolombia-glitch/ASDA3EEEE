/**
 * SidebarFavorites - LITPER PRO
 *
 * Lista de favoritos con drag & drop nativo
 * Inspirado en Linear, Notion y Figma
 */

import React, { useState, useRef, useCallback } from 'react';
import { Star, GripVertical, Plus, X } from 'lucide-react';
import { useSidebarStore, SidebarFavorite } from '../../../stores/sidebarStore';
import { SidebarCompactItem } from './SidebarItem';
import { SidebarTooltip } from './SidebarTooltip';

interface SidebarFavoritesProps {
  isCollapsed?: boolean;
  className?: string;
}

export const SidebarFavorites: React.FC<SidebarFavoritesProps> = ({
  isCollapsed = false,
  className = '',
}) => {
  const { favorites, reorderFavorites, removeFavorite } = useSidebarStore();
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());

    // Add drag image
    const element = e.currentTarget as HTMLElement;
    element.style.opacity = '0.5';
  }, []);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    const element = e.currentTarget as HTMLElement;
    element.style.opacity = '1';
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, dropIndex: number) => {
      e.preventDefault();
      const dragIndex = draggedIndex;

      if (dragIndex !== null && dragIndex !== dropIndex) {
        reorderFavorites(dragIndex, dropIndex);
      }

      setDraggedIndex(null);
      setDragOverIndex(null);
    },
    [draggedIndex, reorderFavorites]
  );

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  if (favorites.length === 0) {
    if (isCollapsed) return null;

    return (
      <div className={`px-3 py-2 ${className}`}>
        <div
          className="
            flex flex-col items-center justify-center
            py-4 px-3 rounded-lg
            border border-dashed border-slate-700/50
            text-center
          "
        >
          <Star className="w-5 h-5 text-slate-600 mb-2" />
          <p className="text-xs text-slate-500">
            Sin favoritos
          </p>
          <p className="text-[10px] text-slate-600 mt-0.5">
            Agrega páginas con ★
          </p>
        </div>
      </div>
    );
  }

  // Collapsed mode - show only icons
  if (isCollapsed) {
    return (
      <div className={`px-2 py-2 ${className}`}>
        <div className="flex flex-col items-center gap-1">
          {favorites.slice(0, 5).map((fav) => (
            <SidebarTooltip key={fav.id} content={fav.label} side="right">
              <button
                className="
                  w-8 h-8 rounded-lg
                  flex items-center justify-center
                  text-slate-500 hover:text-white
                  hover:bg-white/5
                  transition-colors duration-200
                "
              >
                {fav.color ? (
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: fav.color }}
                  />
                ) : (
                  <Star className="w-4 h-4" />
                )}
              </button>
            </SidebarTooltip>
          ))}
          {favorites.length > 5 && (
            <span className="text-[10px] text-slate-600">
              +{favorites.length - 5}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`py-1 ${className}`}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="
          w-full flex items-center gap-2
          h-7 px-3
          text-[11px] font-semibold uppercase tracking-wider
          text-slate-500 hover:text-slate-400
          transition-colors duration-200
        "
      >
        <Star className="w-3 h-3" />
        <span className="flex-1 text-left">Favoritos</span>
        <span className="text-[10px] text-slate-600">{favorites.length}</span>
        <svg
          className={`w-3 h-3 transition-transform ${isExpanded ? '' : '-rotate-90'}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Favorites list */}
      {isExpanded && (
        <div className="mt-1 space-y-0.5 px-2">
          {favorites.map((fav, index) => (
            <div
              key={fav.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragLeave={handleDragLeave}
              className={`
                group relative flex items-center
                rounded-md
                transition-all duration-150
                ${dragOverIndex === index ? 'bg-blue-500/10 border-t-2 border-blue-500' : ''}
                ${draggedIndex === index ? 'opacity-50' : ''}
              `}
            >
              {/* Drag handle */}
              <div
                className="
                  absolute left-0 top-1/2 -translate-y-1/2
                  opacity-0 group-hover:opacity-100
                  cursor-grab active:cursor-grabbing
                  p-1 text-slate-600 hover:text-slate-400
                  transition-opacity duration-200
                "
              >
                <GripVertical className="w-3 h-3" />
              </div>

              {/* Favorite item */}
              <div className="flex-1 pl-4">
                <FavoriteItem
                  favorite={fav}
                  onRemove={() => removeFavorite(fav.id)}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Individual favorite item
interface FavoriteItemProps {
  favorite: SidebarFavorite;
  onClick?: () => void;
  onRemove?: () => void;
}

const FavoriteItem: React.FC<FavoriteItemProps> = ({
  favorite,
  onClick,
  onRemove,
}) => {
  return (
    <div
      className="
        group/item flex items-center gap-2
        h-7 px-2 rounded-md
        text-sm text-slate-400
        hover:text-white hover:bg-white/5
        cursor-pointer
        transition-all duration-200
      "
      onClick={onClick}
    >
      {/* Color indicator or icon */}
      {favorite.color ? (
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: favorite.color }}
        />
      ) : (
        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 flex-shrink-0" />
      )}

      {/* Label */}
      <span className="flex-1 truncate text-xs">{favorite.label}</span>

      {/* Remove button */}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="
            opacity-0 group-hover/item:opacity-100
            p-0.5 rounded text-slate-500 hover:text-red-400
            transition-all duration-200
          "
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};

// Add to favorites button
interface AddToFavoritesProps {
  itemId: string;
  itemLabel: string;
  itemIcon?: string;
  itemPath?: string;
  itemColor?: string;
}

export const AddToFavoritesButton: React.FC<AddToFavoritesProps> = ({
  itemId,
  itemLabel,
  itemIcon,
  itemPath,
  itemColor,
}) => {
  const { favorites, addFavorite, removeFavorite } = useSidebarStore();
  const isFavorite = favorites.some((f) => f.id === itemId);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFavorite) {
      removeFavorite(itemId);
    } else {
      addFavorite({
        id: itemId,
        type: 'page',
        label: itemLabel,
        icon: itemIcon || '',
        path: itemPath,
        color: itemColor,
      });
    }
  };

  return (
    <button
      onClick={handleToggle}
      className={`
        p-1 rounded
        transition-all duration-200
        ${
          isFavorite
            ? 'text-amber-400'
            : 'text-slate-500 hover:text-amber-400 opacity-0 group-hover:opacity-100'
        }
      `}
      title={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
    >
      <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
    </button>
  );
};

export default SidebarFavorites;
