import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Search, Loader2, MapPin, Crosshair } from 'lucide-react';
import axios from 'axios';

const MAPBOX_TOKEN = "pk.eyJ1IjoieW9hZGplaSIsImEiOiJjbWprcjI4b3QyNHBpM2Nxem4xM2VwNWF4In0.z6NbrlGRmQdT-vlYk5bjMw";

const AFRICAN_COUNTRY_CODES = [
    'dz', 'ao', 'bj', 'bw', 'bf', 'bi', 'cm', 'cv', 'cf', 'td', 'km', 'cg', 'cd', 'ci',
    'dj', 'eg', 'gq', 'er', 'sz', 'et', 'ga', 'gm', 'gh', 'gn', 'gw', 'ke', 'ls', 'lr',
    'ly', 'mg', 'mw', 'ml', 'mr', 'mu', 'ma', 'mz', 'na', 'ne', 'ng', 'rw', 'st', 'sn',
    'sc', 'sl', 'so', 'za', 'ss', 'sd', 'tz', 'tg', 'tn', 'ug', 'zm', 'zw'
];

const SearchBar = ({ onSearch, onLocate, isSearching, initialQuery }) => {
    const { t } = useLanguage();
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);

    useEffect(() => {
        if (initialQuery !== undefined && initialQuery !== null) {
            setQuery(initialQuery);
        }
    }, [initialQuery]);

    // Debounce and Fetch Suggestions
    useEffect(() => {
        const fetchSuggestions = async () => {
            if (query.length < 3) {
                setSuggestions([]);
                return;
            }

            setLoadingSuggestions(true);
            try {
                // Restricted to Africa approximate bbox: -26,-38,60,38
                const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&bbox=-26,-38,60,38&types=country,region,district,place,locality&limit=10`;
                const res = await axios.get(url);

                if (res.data.features) {
                    const filtered = res.data.features.filter(feature => {
                        // Check if the feature itself is a country
                        if (feature.id.startsWith('country.') && feature.properties?.short_code) {
                            return AFRICAN_COUNTRY_CODES.includes(feature.properties.short_code.toLowerCase());
                        }

                        // Check context for country
                        if (feature.context) {
                            const countryContext = feature.context.find(c => c.id.startsWith('country.'));
                            if (countryContext && countryContext.short_code) {
                                return AFRICAN_COUNTRY_CODES.includes(countryContext.short_code.toLowerCase());
                            }
                        }
                        return false;
                    });
                    setSuggestions(filtered.slice(0, 5));
                }
            } catch (error) {
                console.error("Error fetching suggestions:", error);
            } finally {
                setLoadingSuggestions(false);
            }
        };

        const timeoutId = setTimeout(() => {
            fetchSuggestions();
        }, 100); // 100ms debounce

        return () => clearTimeout(timeoutId);
    }, [query]);

    const handleSearch = (e) => {
        e.preventDefault();
        setShowSuggestions(false);
        if (query.trim()) {
            onSearch(query);
        }
    };

    const handleSuggestionClick = (placeName) => {
        setQuery(placeName);
        setShowSuggestions(false);
        onSearch(placeName);
    };

    return (
        <div className="absolute top-28 md:top-24 left-4 right-4 md:left-6 md:right-auto z-40 w-auto md:w-full md:max-w-md animate-in slide-in-from-left duration-700 pointer-events-auto">

            {/* Glass Card Container */}
            <div className="glass rounded-2xl p-4 space-y-3 bg-white/80 dark:bg-[#0A0F1C]/80 backdrop-blur-xl border border-gray-200 dark:border-white/10 shadow-2xl transition-all focus-within:shadow-[0_0_20px_rgba(0,255,179,0.2)]">

                {/* Input Form with Primary Border */}
                <form onSubmit={handleSearch} className="relative flex items-center rounded-xl border border-primary-500 overflow-visible bg-white/50 dark:bg-black/20">
                    <Search className="absolute left-3 w-5 h-5 text-primary-500" />

                    <input
                        type="text"
                        className="w-full bg-transparent border-0 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-0 pl-10 pr-20 py-3 text-base outline-none"
                        placeholder={t('search.placeholder')}
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setShowSuggestions(true);
                        }}
                        onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                        // Delay blur to allow click on suggestion
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    />

                    {/* Action Buttons */}
                    <div className="absolute right-3 flex items-center gap-2">
                        {isSearching ? (
                            <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
                        ) : (
                            <button
                                type="button"
                                onClick={onLocate}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-primary-500 hover:bg-primary-500/10 transition-colors"
                                title={t('search.locate')}
                            >
                                <MapPin className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </form>

                {/* Suggestions Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 mx-4 bg-white/80 dark:bg-[#0A0F1C]/80 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                        {loadingSuggestions && (
                            <div className="p-2 flex justify-center">
                                <Loader2 className="w-4 h-4 text-primary-500 animate-spin" />
                            </div>
                        )}
                        {!loadingSuggestions && suggestions.map((suggestion) => (
                            <button
                                key={suggestion.id}
                                onMouseDown={(e) => {
                                    e.preventDefault(); // Prevent input blur
                                    handleSuggestionClick(suggestion.place_name);
                                }}
                                className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 flex items-center gap-3 transition-colors border-b border-gray-100 dark:border-white/5 last:border-0"
                            >
                                <MapPin className="w-4 h-4 text-gray-400" />
                                <span className="truncate">{suggestion.place_name}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

        </div>
    );
};

export default SearchBar;
