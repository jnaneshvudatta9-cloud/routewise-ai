import React, { useState, useRef, useEffect } from 'react';
import { Search, Loader2, MapPin, X, AlertCircle } from 'lucide-react';
import { useGeocoding } from '../../hooks/useGeocoding';
import type { GeocodingResult, Location } from '../../types';

interface AddressSearchProps {
  value: string;
  placeholder?: string;
  onSelect: (location: Location) => void;
  label?: string;
  className?: string;
}

export function AddressSearch({
  value,
  placeholder = 'Search for an address...',
  onSelect,
  label,
  className = '',
}: AddressSearchProps) {
  const { search, results, isLoading, error, clearResults } = useGeocoding();
  const [inputValue, setInputValue] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync external value
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        clearResults();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [clearResults]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    if (val.trim().length >= 3) {
      search(val);
      setIsOpen(true);
    } else {
      clearResults();
      setIsOpen(false);
    }
  };

  const handleSelect = (result: GeocodingResult) => {
    setInputValue(result.displayName);
    setIsOpen(false);
    clearResults();
    onSelect({
      lat: result.lat,
      lon: result.lon,
      name: result.displayName,
    });
  };

  const handleClear = () => {
    setInputValue('');
    clearResults();
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      )}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {isLoading ? (
            <Loader2 className="h-4 w-4 text-indigo-500 animate-spin" />
          ) : (
            <Search className="h-4 w-4 text-gray-400" />
          )}
        </div>
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          className="input-field pl-10 pr-8"
          placeholder={placeholder}
        />
        {inputValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Error */}
      {error && !isOpen && (
        <div className="mt-1 flex items-center gap-1 text-xs text-red-600">
          <AlertCircle className="h-3 w-3" />
          <span>{error}</span>
        </div>
      )}

      {/* Dropdown */}
      {isOpen && results.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-auto">
          {results.map((result, index) => (
            <li key={index}>
              <button
                type="button"
                onClick={() => handleSelect(result)}
                className="w-full flex items-start gap-2 px-3 py-2.5 text-left hover:bg-indigo-50 transition-colors border-b border-gray-100 last:border-0"
              >
                <MapPin className="h-4 w-4 text-indigo-500 mt-0.5 shrink-0" />
                <span className="text-sm text-gray-700 line-clamp-2">{result.displayName}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {isOpen && isLoading && results.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-center text-sm text-gray-500">
          Searching...
        </div>
      )}

      {isOpen && !isLoading && results.length === 0 && inputValue.length >= 3 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-center text-sm text-gray-500">
          No results found
        </div>
      )}
    </div>
  );
}
