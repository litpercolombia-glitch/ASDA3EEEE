// components/search/AdvancedSearch.tsx
// Búsqueda Avanzada estilo Amazon - Autocompletado, Historial, Sugerencias
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Search,
  X,
  Clock,
  TrendingUp,
  Package,
  Truck,
  MapPin,
  Phone,
  User,
  ArrowRight,
  Sparkles,
  History,
  Star,
  Filter,
  ChevronRight,
  Hash,
  Building2,
} from 'lucide-react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================
// TYPES
// ============================================
export interface SearchResult {
  id: string;
  type: 'guide' | 'carrier' | 'city' | 'customer' | 'phone';
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  metadata?: Record<string, any>;
}

export interface SearchSuggestion {
  text: string;
  type: 'recent' | 'popular' | 'suggestion';
  count?: number;
}

// ============================================
// SEARCH STORE
// ============================================
interface SearchState {
  recentSearches: string[];
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
  removeRecentSearch: (query: string) => void;
}

export const useSearchStore = create<SearchState>()(
  persist(
    (set) => ({
      recentSearches: [],

      addRecentSearch: (query) => {
        set((state) => ({
          recentSearches: [
            query,
            ...state.recentSearches.filter((s) => s !== query),
          ].slice(0, 10),
        }));
      },

      clearRecentSearches: () => {
        set({ recentSearches: [] });
      },

      removeRecentSearch: (query) => {
        set((state) => ({
          recentSearches: state.recentSearches.filter((s) => s !== query),
        }));
      },
    }),
    {
      name: 'litper-search-history',
    }
  )
);

// ============================================
// POPULAR SEARCHES (simulated)
// ============================================
const POPULAR_SEARCHES = [
  { text: 'En tránsito', count: 1250 },
  { text: 'Entregado', count: 980 },
  { text: 'Con novedad', count: 456 },
  { text: 'Servientrega', count: 823 },
  { text: 'Coordinadora', count: 654 },
  { text: 'Bogotá', count: 1100 },
  { text: 'Medellín', count: 890 },
];

// ============================================
// ADVANCED SEARCH COMPONENT
// ============================================
interface AdvancedSearchProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  onResultSelect?: (result: SearchResult) => void;
  shipments?: any[];
  className?: string;
  variant?: 'default' | 'compact' | 'expanded';
}

export const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  placeholder = 'Buscar guías, clientes, transportadoras...',
  onSearch,
  onResultSelect,
  shipments = [],
  className = '',
  variant = 'default',
}) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { recentSearches, addRecentSearch, clearRecentSearches, removeRecentSearch } = useSearchStore();

  // Debounced query for search
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  // Generate search results
  const searchResults = useMemo<SearchResult[]>(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) return [];

    const q = debouncedQuery.toLowerCase();
    const results: SearchResult[] = [];

    // Search in shipments
    shipments.forEach((shipment) => {
      // Match guide number
      if (shipment.id?.toLowerCase().includes(q)) {
        results.push({
          id: shipment.id,
          type: 'guide',
          title: shipment.id,
          subtitle: `${shipment.carrier} - ${shipment.status}`,
          icon: <Package className="w-4 h-4" />,
          metadata: shipment,
        });
      }

      // Match phone
      if (shipment.phone?.includes(q)) {
        results.push({
          id: `phone-${shipment.phone}`,
          type: 'phone',
          title: shipment.phone,
          subtitle: `Asociado a ${shipment.id}`,
          icon: <Phone className="w-4 h-4" />,
          metadata: shipment,
        });
      }

      // Match city
      if (shipment.detailedInfo?.city?.toLowerCase().includes(q)) {
        const existingCity = results.find(
          (r) => r.type === 'city' && r.title.toLowerCase() === shipment.detailedInfo.city.toLowerCase()
        );
        if (!existingCity) {
          results.push({
            id: `city-${shipment.detailedInfo.city}`,
            type: 'city',
            title: shipment.detailedInfo.city,
            subtitle: 'Ciudad de destino',
            icon: <MapPin className="w-4 h-4" />,
          });
        }
      }
    });

    // Match carriers
    const carriers = ['SERVIENTREGA', 'COORDINADORA', 'INTERRAPIDISIMO', 'ENVIA', 'TCC', 'DEPRISA'];
    carriers.forEach((carrier) => {
      if (carrier.toLowerCase().includes(q)) {
        const count = shipments.filter((s) => s.carrier === carrier).length;
        results.push({
          id: `carrier-${carrier}`,
          type: 'carrier',
          title: carrier,
          subtitle: `${count} guías`,
          icon: <Truck className="w-4 h-4" />,
        });
      }
    });

    return results.slice(0, 10);
  }, [debouncedQuery, shipments]);

  // Suggestions when no query
  const suggestions = useMemo<SearchSuggestion[]>(() => {
    const items: SearchSuggestion[] = [];

    // Recent searches first
    recentSearches.slice(0, 5).forEach((text) => {
      items.push({ text, type: 'recent' });
    });

    // Popular searches
    POPULAR_SEARCHES.slice(0, 5).forEach(({ text, count }) => {
      if (!items.find((i) => i.text.toLowerCase() === text.toLowerCase())) {
        items.push({ text, type: 'popular', count });
      }
    });

    return items;
  }, [recentSearches]);

  // Handle search submission
  const handleSearch = useCallback(
    (searchQuery: string) => {
      if (!searchQuery.trim()) return;

      addRecentSearch(searchQuery);
      onSearch?.(searchQuery);
      setIsFocused(false);
      setSelectedIndex(-1);
    },
    [addRecentSearch, onSearch]
  );

  // Handle result selection
  const handleResultSelect = useCallback(
    (result: SearchResult) => {
      addRecentSearch(result.title);
      onResultSelect?.(result);
      setQuery(result.title);
      setIsFocused(false);
      setSelectedIndex(-1);
    },
    [addRecentSearch, onResultSelect]
  );

  // Handle suggestion click
  const handleSuggestionClick = useCallback(
    (suggestion: SearchSuggestion) => {
      setQuery(suggestion.text);
      handleSearch(suggestion.text);
    },
    [handleSearch]
  );

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const items = query ? searchResults : suggestions;
      const maxIndex = items.length - 1;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => (prev < maxIndex ? prev + 1 : 0));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : maxIndex));
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0) {
            if (query && searchResults[selectedIndex]) {
              handleResultSelect(searchResults[selectedIndex]);
            } else if (!query && suggestions[selectedIndex]) {
              handleSuggestionClick(suggestions[selectedIndex]);
            }
          } else {
            handleSearch(query);
          }
          break;
        case 'Escape':
          setIsFocused(false);
          setSelectedIndex(-1);
          break;
      }
    },
    [query, searchResults, suggestions, selectedIndex, handleSearch, handleResultSelect, handleSuggestionClick]
  );

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showDropdown = isFocused && (query ? searchResults.length > 0 : suggestions.length > 0);

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div
        className={`relative flex items-center bg-white/10 border border-white/20 rounded-xl transition-all ${
          isFocused ? 'bg-white/15 border-accent-400 ring-2 ring-accent-400/20' : ''
        } ${variant === 'compact' ? 'h-10' : 'h-11'}`}
      >
        <Search className={`absolute left-4 w-5 h-5 text-slate-400 ${isFocused ? 'text-accent-400' : ''}`} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedIndex(-1);
          }}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full h-full pl-12 pr-20 bg-transparent text-white placeholder-slate-400 focus:outline-none text-sm"
        />

        {/* Clear button */}
        {query && (
          <button
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            className="absolute right-14 p-1 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Search button */}
        <button
          onClick={() => handleSearch(query)}
          className="absolute right-1 top-1 bottom-1 px-4 bg-gradient-to-r from-accent-500 to-accent-600 text-white rounded-lg font-medium text-sm hover:from-accent-600 hover:to-accent-700 transition-all flex items-center gap-1"
        >
          <Search className="w-4 h-4" />
        </button>
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-navy-900 rounded-xl shadow-2xl border border-slate-200 dark:border-navy-700 overflow-hidden z-50 animate-fade-in"
        >
          {/* Search Results */}
          {query && searchResults.length > 0 && (
            <div className="py-2">
              <div className="px-4 py-2 text-xs font-medium text-slate-400 uppercase">
                Resultados
              </div>
              {searchResults.map((result, index) => (
                <button
                  key={result.id}
                  onClick={() => handleResultSelect(result)}
                  className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-colors ${
                    index === selectedIndex
                      ? 'bg-accent-50 dark:bg-accent-900/20'
                      : 'hover:bg-slate-50 dark:hover:bg-navy-800'
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg ${
                      result.type === 'guide'
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                        : result.type === 'carrier'
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'
                        : result.type === 'city'
                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600'
                        : result.type === 'phone'
                        ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                    }`}
                  >
                    {result.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 dark:text-white truncate">
                      {result.title}
                    </p>
                    {result.subtitle && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                        {result.subtitle}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              ))}
            </div>
          )}

          {/* Suggestions (when no query) */}
          {!query && suggestions.length > 0 && (
            <>
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div className="py-2 border-b border-slate-100 dark:border-navy-800">
                  <div className="px-4 py-2 flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400 uppercase flex items-center gap-1">
                      <History className="w-3 h-3" />
                      Búsquedas recientes
                    </span>
                    <button
                      onClick={clearRecentSearches}
                      className="text-xs text-accent-500 hover:text-accent-600 font-medium"
                    >
                      Limpiar
                    </button>
                  </div>
                  {suggestions
                    .filter((s) => s.type === 'recent')
                    .map((suggestion, index) => (
                      <div
                        key={suggestion.text}
                        className={`group flex items-center ${
                          index === selectedIndex
                            ? 'bg-accent-50 dark:bg-accent-900/20'
                            : ''
                        }`}
                      >
                        <button
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="flex-1 px-4 py-2.5 flex items-center gap-3 text-left hover:bg-slate-50 dark:hover:bg-navy-800 transition-colors"
                        >
                          <Clock className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-700 dark:text-slate-200">
                            {suggestion.text}
                          </span>
                        </button>
                        <button
                          onClick={() => removeRecentSearch(suggestion.text)}
                          className="p-2 mr-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                </div>
              )}

              {/* Popular Searches */}
              <div className="py-2">
                <div className="px-4 py-2 text-xs font-medium text-slate-400 uppercase flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Búsquedas populares
                </div>
                {suggestions
                  .filter((s) => s.type === 'popular')
                  .map((suggestion, idx) => {
                    const adjustedIndex = recentSearches.length + idx;
                    return (
                      <button
                        key={suggestion.text}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className={`w-full px-4 py-2.5 flex items-center gap-3 text-left transition-colors ${
                          adjustedIndex === selectedIndex
                            ? 'bg-accent-50 dark:bg-accent-900/20'
                            : 'hover:bg-slate-50 dark:hover:bg-navy-800'
                        }`}
                      >
                        <Star className="w-4 h-4 text-amber-400" />
                        <span className="flex-1 text-slate-700 dark:text-slate-200">
                          {suggestion.text}
                        </span>
                        {suggestion.count && (
                          <span className="text-xs text-slate-400 bg-slate-100 dark:bg-navy-700 px-2 py-0.5 rounded-full">
                            {suggestion.count.toLocaleString()}
                          </span>
                        )}
                      </button>
                    );
                  })}
              </div>
            </>
          )}

          {/* No Results */}
          {query && searchResults.length === 0 && debouncedQuery.length >= 2 && (
            <div className="p-8 text-center">
              <Search className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-600 dark:text-slate-300 font-medium">
                No se encontraron resultados
              </p>
              <p className="text-sm text-slate-400 mt-1">
                Intenta con otros términos de búsqueda
              </p>
            </div>
          )}

          {/* Search Tips */}
          {!query && (
            <div className="px-4 py-3 bg-slate-50 dark:bg-navy-950 border-t border-slate-100 dark:border-navy-800">
              <p className="text-xs text-slate-400 flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-accent-500" />
                <span>
                  Tip: Busca por número de guía, teléfono, ciudad o transportadora
                </span>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdvancedSearch;
