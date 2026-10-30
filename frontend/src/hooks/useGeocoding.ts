import { useState, useCallback, useRef } from 'react';
import api from '../lib/api';
import type { GeocodingResult } from '../types';

export function useGeocoding() {
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback((query: string) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (!query.trim() || query.trim().length < 3) {
      setResults([]);
      return;
    }

    debounceTimer.current = setTimeout(async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.get<GeocodingResult[]>('/api/geocode', {
          params: { q: query },
        });
        setResults(response.data);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Geocoding search failed';
        setError(message);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return { search, results, isLoading, error, clearResults };
}
