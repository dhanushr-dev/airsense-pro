
import React, { useState, useRef, useEffect } from 'react';
import { Search, MapPin, Loader2, X, ArrowRight, Globe } from 'lucide-react';
import { searchLocations } from '../services/api';
import { GeoLocation } from '../types';

interface SearchBarProps {
  onLocationSelect: (lat: number, lon: number) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onLocationSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeoLocation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        // Clicked outside
        if (!query) {
            // If empty, just collapse
            setIsExpanded(false);
        }
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [query]);

  // Auto-focus input when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setIsLoading(true);
    setShowDropdown(true);
    const locations = await searchLocations(query);
    setResults(locations);
    setIsLoading(false);
  };

  const handleSelect = (loc: GeoLocation) => {
    onLocationSelect(loc.lat, loc.lon);
    setQuery('');
    setShowDropdown(false);
    setResults([]);
    setIsExpanded(false); // Collapse after selection
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  const handleCollapse = () => {
    setQuery('');
    setShowDropdown(false);
    setIsExpanded(false);
  };

  return (
    <div 
      ref={searchRef} 
      className={`relative h-12 transition-all duration-500 ease-in-out flex items-center justify-end md:justify-center ${isExpanded ? 'w-full max-w-md' : 'w-12'}`}
    >
      {/* Collapsed State: Icon Button */}
      <button
        onClick={() => setIsExpanded(true)}
        className={`absolute inset-0 w-12 h-12 bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white rounded-xl border border-white/10 shadow-lg flex items-center justify-center transition-all duration-300 z-10 ${isExpanded ? 'opacity-0 scale-0 pointer-events-none' : 'opacity-100 scale-100'}`}
        title="Search Location"
      >
        <Search size={20} />
      </button>

      {/* Expanded State: Input Form */}
      <div className={`w-full transition-all duration-300 transform origin-center ${isExpanded ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
        <form onSubmit={handleSearch} className="relative group z-20">
          {/* Glow Effect */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl opacity-30 group-focus-within:opacity-100 transition duration-500 blur-md"></div>
          
          <div className="relative flex items-center bg-slate-900 rounded-xl overflow-hidden border border-white/10 shadow-xl h-12">
            <button
              type="submit"
              className="absolute left-0 top-0 h-full w-12 flex items-center justify-center text-slate-400 group-focus-within:text-blue-400 transition-colors"
            >
              <Search size={18} />
            </button>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search city..."
              className="w-full bg-transparent border-none py-3 pl-12 pr-10 text-white placeholder-slate-400 focus:outline-none focus:ring-0 transition-all text-sm font-medium h-full"
            />
            {query ? (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-3 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-all"
              >
                <X size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCollapse}
                className="absolute right-3 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                title="Close Search"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Dropdown Results */}
      {showDropdown && (query.length > 0) && isExpanded && (
        <div className="absolute top-full left-0 right-0 mt-3 bg-slate-950 border border-white/20 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 ring-1 ring-black/50 z-[5000]">
          {isLoading ? (
            <div className="p-8 flex flex-col items-center justify-center text-slate-400 gap-3">
              <Loader2 className="animate-spin text-blue-500" size={28} />
              <span className="text-xs font-medium tracking-wide uppercase">Searching...</span>
            </div>
          ) : results.length > 0 ? (
            <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
              <div className="px-4 py-3 text-xs font-bold text-blue-400 uppercase tracking-widest bg-slate-900 border-b border-white/10 sticky top-0 z-10">
                Search Results
              </div>
              <ul>
                {results.map((loc, idx) => (
                  <li key={`${loc.lat}-${loc.lon}-${idx}`}>
                    <button
                      onClick={() => handleSelect(loc)}
                      className="w-full text-left group flex items-center p-4 hover:bg-slate-800 transition-colors border-b border-white/5 last:border-none gap-4"
                    >
                      
                      <div className="shrink-0 w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all text-slate-400 border border-white/10 group-hover:border-blue-500 shadow-lg">
                        <Globe size={18} />
                      </div>
                      
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <span className="text-lg font-bold text-white group-hover:text-blue-200 transition-colors truncate leading-tight">
                          {loc.name}
                        </span>
                        <div className="flex items-center text-sm text-slate-400 font-medium mt-0.5">
                          <span className="truncate">
                             {loc.state && <span className="text-slate-300">{loc.state}, </span>}
                             <span className="uppercase tracking-wider font-semibold text-slate-500 group-hover:text-slate-400">{loc.country}</span>
                          </span>
                        </div>
                      </div>
                      
                      <div
                        className="shrink-0 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-lg transition-all shadow-md group-hover:shadow-blue-500/30 flex items-center gap-2 whitespace-nowrap"
                      >
                        Get Data
                        <ArrowRight size={12} />
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-500 border border-white/5">
                <MapPin size={20} />
              </div>
              <p className="text-base text-slate-200 font-semibold">No matches found</p>
              <p className="text-xs text-slate-500 mt-1">Try checking the spelling or searching for a nearby city.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
