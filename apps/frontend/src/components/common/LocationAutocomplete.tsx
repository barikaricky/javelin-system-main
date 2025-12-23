import { useState, useEffect, useRef } from 'react';
import { Building2, X, MapPin } from 'lucide-react';
import axios from 'axios';
import { getApiBaseURL } from '../../lib/api';

interface Location {
  _id: string;
  locationName: string;
  city: string;
  state: string;
  address?: string;
}

interface LocationAutocompleteProps {
  value?: string;
  onLocationSelect: (location: Location) => void;
  placeholder?: string;
  className?: string;
  error?: string;
  filterActive?: boolean;
}

export const LocationAutocomplete = ({ 
  value = '', 
  onLocationSelect, 
  placeholder = 'Search for a location...',
  className = '',
  error,
  filterActive = false
}: LocationAutocompleteProps) => {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<Location[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const searchLocations = async () => {
      if (query.trim().length < 1) {
        setSuggestions([]);
        setIsOpen(false);
        return;
      }

      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const API_URL = getApiBaseURL();
        const params = new URLSearchParams();
        params.append('search', query.trim());
        if (filterActive) params.append('isActive', 'true');
        
        const response = await axios.get(
          `${API_URL}/api/locations?${params.toString()}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        setSuggestions(response.data.locations || []);
        setIsOpen(true);
        setSelectedIndex(-1);
      } catch (error) {
        console.error('Error searching locations:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchLocations, 300);
    return () => clearTimeout(debounceTimer);
  }, [query, filterActive]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === 'Enter') {
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleSelect = (location: Location) => {
    setQuery(`${location.locationName} - ${location.city}, ${location.state}`);
    onLocationSelect(location);
    setIsOpen(false);
    setSuggestions([]);
    setSelectedIndex(-1);
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setIsOpen(false);
    onLocationSelect({ _id: '', locationName: '', city: '', state: '', address: '' });
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div className="relative">
        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 z-10" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (query.trim().length >= 1 && suggestions.length > 0) {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          className={`w-full pl-10 pr-10 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
            error ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}

      {loading && (
        <div className="absolute right-12 top-1/2 -translate-y-1/2">
          <div className="animate-spin h-5 w-5 border-2 border-purple-600 border-t-transparent rounded-full"></div>
        </div>
      )}

      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((location, index) => (
            <button
              key={location._id}
              type="button"
              onClick={() => handleSelect(location)}
              className={`w-full px-4 py-3 text-left hover:bg-purple-50 transition-colors flex items-start gap-3 ${
                index === selectedIndex ? 'bg-purple-100' : ''
              }`}
            >
              <Building2 className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 truncate">{location.locationName}</div>
                <div className="flex items-center gap-2 text-sm text-gray-500 mt-0.5">
                  <MapPin className="h-3 w-3" />
                  <span>{location.city}, {location.state}</span>
                </div>
                {location.address && (
                  <div className="text-xs text-gray-400 mt-1 truncate">{location.address}</div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {isOpen && query.trim().length >= 1 && !loading && suggestions.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500 text-sm">
          No locations found
        </div>
      )}
    </div>
  );
};

