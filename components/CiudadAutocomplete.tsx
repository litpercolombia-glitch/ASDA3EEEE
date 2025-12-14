/**
 * CiudadAutocomplete.tsx
 * Componente de autocompletado inteligente para ciudades de Colombia
 */

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { MapPin, Search, X, Check, ChevronDown, Building2, Users, Star } from 'lucide-react';
import {
  CiudadColombia,
  buscarCiudades,
  CIUDADES_COLOMBIA,
  getCiudadesCapitales,
} from '../data/ciudadesColombia';

interface CiudadAutocompleteProps {
  value: string;
  onChange: (ciudad: CiudadColombia | null) => void;
  onSelect?: (ciudad: CiudadColombia) => void;
  placeholder?: string;
  className?: string;
  showDepartamento?: boolean;
  showPoblacion?: boolean;
  maxSuggestions?: number;
  disabled?: boolean;
}

export const CiudadAutocomplete: React.FC<CiudadAutocompleteProps> = ({
  value,
  onChange,
  onSelect,
  placeholder = 'Buscar ciudad...',
  className = '',
  showDepartamento = true,
  showPoblacion = false,
  maxSuggestions = 8,
  disabled = false,
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Buscar ciudades basado en el input
  const sugerencias = useMemo(() => {
    if (!inputValue || inputValue.length < 2) {
      // Mostrar capitales si no hay búsqueda
      return getCiudadesCapitales().slice(0, maxSuggestions);
    }
    return buscarCiudades(inputValue, maxSuggestions);
  }, [inputValue, maxSuggestions]);

  // Sincronizar con prop value
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Scroll al elemento resaltado
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const item = listRef.current.children[highlightedIndex] as HTMLElement;
      if (item) {
        item.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInputValue(newValue);
      setIsOpen(true);
      setHighlightedIndex(-1);

      if (!newValue.trim()) {
        onChange(null);
      }
    },
    [onChange]
  );

  const handleSelect = useCallback(
    (ciudad: CiudadColombia) => {
      setInputValue(ciudad.nombre);
      setIsOpen(false);
      setHighlightedIndex(-1);
      onChange(ciudad);
      onSelect?.(ciudad);
      inputRef.current?.blur();
    },
    [onChange, onSelect]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) {
        if (e.key === 'ArrowDown' || e.key === 'Enter') {
          setIsOpen(true);
        }
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex((prev) => (prev < sugerencias.length - 1 ? prev + 1 : prev));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;
        case 'Enter':
          e.preventDefault();
          if (highlightedIndex >= 0 && sugerencias[highlightedIndex]) {
            handleSelect(sugerencias[highlightedIndex]);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          setHighlightedIndex(-1);
          break;
      }
    },
    [isOpen, sugerencias, highlightedIndex, handleSelect]
  );

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    setIsOpen(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    // Delay para permitir clicks en las sugerencias
    setTimeout(() => setIsOpen(false), 200);
  }, []);

  const handleClear = useCallback(() => {
    setInputValue('');
    onChange(null);
    inputRef.current?.focus();
  }, [onChange]);

  const formatPoblacion = (poblacion: number) => {
    if (poblacion >= 1000000) {
      return `${(poblacion / 1000000).toFixed(1)}M`;
    }
    if (poblacion >= 1000) {
      return `${(poblacion / 1000).toFixed(0)}K`;
    }
    return poblacion.toString();
  };

  return (
    <div className={`relative ${className}`}>
      {/* Input */}
      <div
        className={`relative flex items-center ${
          isFocused
            ? 'ring-2 ring-indigo-500 border-indigo-500'
            : 'border-slate-300 dark:border-slate-600'
        } border rounded-xl bg-white dark:bg-slate-800 transition-all`}
      >
        <div className="absolute left-3 pointer-events-none">
          <MapPin className={`w-5 h-5 ${isFocused ? 'text-indigo-500' : 'text-slate-400'}`} />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full pl-10 pr-10 py-3 bg-transparent text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none text-sm"
          autoComplete="off"
        />

        {/* Botones de acción */}
        <div className="absolute right-2 flex items-center gap-1">
          {inputValue && (
            <button
              onClick={handleClear}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              type="button"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            type="button"
          >
            <ChevronDown
              className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* Lista de sugerencias */}
      {isOpen && (
        <ul
          ref={listRef}
          className="absolute z-50 w-full mt-1 max-h-64 overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl"
        >
          {sugerencias.length === 0 ? (
            <li className="px-4 py-3 text-sm text-slate-500 text-center">
              No se encontraron ciudades
            </li>
          ) : (
            <>
              {!inputValue && (
                <li className="px-4 py-2 text-xs text-slate-400 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
                  <Star className="w-3 h-3 text-amber-500" />
                  Capitales de departamento
                </li>
              )}
              {sugerencias.map((ciudad, index) => (
                <li
                  key={`${ciudad.nombre}-${ciudad.departamento}`}
                  onClick={() => handleSelect(ciudad)}
                  className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors ${
                    highlightedIndex === index
                      ? 'bg-indigo-50 dark:bg-indigo-900/30'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  } ${index !== sugerencias.length - 1 ? 'border-b border-slate-100 dark:border-slate-700' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        ciudad.esCapital
                          ? 'bg-amber-100 dark:bg-amber-900/30'
                          : 'bg-slate-100 dark:bg-slate-700'
                      }`}
                    >
                      {ciudad.esCapital ? (
                        <Star className="w-4 h-4 text-amber-500" />
                      ) : (
                        <MapPin className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-white text-sm">
                        {ciudad.nombre}
                        {ciudad.esCapital && (
                          <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded">
                            CAPITAL
                          </span>
                        )}
                      </p>
                      {showDepartamento && (
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {ciudad.departamento}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {showPoblacion && ciudad.poblacion && (
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {formatPoblacion(ciudad.poblacion)}
                      </span>
                    )}
                    {highlightedIndex === index && <Check className="w-4 h-4 text-indigo-500" />}
                  </div>
                </li>
              ))}
            </>
          )}
        </ul>
      )}
    </div>
  );
};

// Componente de selector múltiple de ciudades
interface CiudadMultiSelectProps {
  selectedCities: CiudadColombia[];
  onChange: (cities: CiudadColombia[]) => void;
  maxSelections?: number;
  className?: string;
}

export const CiudadMultiSelect: React.FC<CiudadMultiSelectProps> = ({
  selectedCities,
  onChange,
  maxSelections = 10,
  className = '',
}) => {
  const [searchValue, setSearchValue] = useState('');

  const handleSelect = (ciudad: CiudadColombia) => {
    if (selectedCities.length >= maxSelections) return;
    if (
      selectedCities.some(
        (c) => c.nombre === ciudad.nombre && c.departamento === ciudad.departamento
      )
    )
      return;

    onChange([...selectedCities, ciudad]);
    setSearchValue('');
  };

  const handleRemove = (ciudad: CiudadColombia) => {
    onChange(
      selectedCities.filter(
        (c) => !(c.nombre === ciudad.nombre && c.departamento === ciudad.departamento)
      )
    );
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Ciudades seleccionadas */}
      {selectedCities.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedCities.map((ciudad) => (
            <span
              key={`${ciudad.nombre}-${ciudad.departamento}`}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg text-sm"
            >
              <MapPin className="w-3 h-3" />
              {ciudad.nombre}
              <button
                onClick={() => handleRemove(ciudad)}
                className="p-0.5 hover:bg-indigo-200 dark:hover:bg-indigo-800 rounded transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Buscador */}
      {selectedCities.length < maxSelections && (
        <CiudadAutocomplete
          value={searchValue}
          onChange={() => {}}
          onSelect={handleSelect}
          placeholder={`Agregar ciudad (${selectedCities.length}/${maxSelections})...`}
          showDepartamento
          showPoblacion
        />
      )}
    </div>
  );
};

export default CiudadAutocomplete;
