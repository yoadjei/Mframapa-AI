import React, { useState, useEffect } from 'react';
import { Search, Loader2 } from 'lucide-react';

const SearchBar = ({ onSearch, isSearching }) => {
    const [query, setQuery] = useState('');
    const [recentSearches] = useState(['Lagos, NG', 'Nairobi, KE', 'Accra, GH']); // Mock for now

    const handleSearch = (e) => {
        e.preventDefault();
        if (query.trim()) {
            onSearch(query);
        }
    };

    return (
        <div className="absolute top-24 left-6 z-40 w-full max-w-sm md:max-w-md animate-in slide-in-from-left duration-700 pointer-events-auto">

            {/* Glass Card Container */}
            <div className="glass rounded-2xl p-4 space-y-3 bg-white/80 dark:bg-[rgba(10,15,28,0.8)] backdrop-blur-xl border border-gray-200 dark:border-white/10 shadow-2xl transition-all focus-within:shadow-[0_0_20px_rgba(0,255,179,0.2)]">

                {/* Input Form with Primary Border */}
                <form onSubmit={handleSearch} className="relative flex items-center rounded-xl border border-primary-500 overflow-hidden bg-white/50 dark:bg-black/20">
                    <Search className="absolute left-3 w-5 h-5 text-primary-500" />

                    <input
                        type="text"
                        className="w-full bg-transparent border-0 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-0 pl-10 pr-10 py-3 text-base"
                        placeholder="Search any African city..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />

                    {/* Loading Indicator */}
                    {isSearching && (
                        <div className="absolute right-3">
                            <Loader2 className="w-4 h-4 text-primary-500 animate-spin" />
                        </div>
                    )}
                </form>

                {/* Possible Autocomplete/Recent Section */}
                {/* For now, just a divider and some quick links if focused or always */}
                <div className="pt-2 border-t border-gray-200 dark:border-white/5">
                    <div className="flex gap-2 text-xs text-gray-500 overflow-x-auto pb-1">
                        {recentSearches.map(city => (
                            <button
                                key={city}
                                onClick={() => { setQuery(city); onSearch(city); }}
                                className="whitespace-nowrap px-2 py-1 rounded bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
                            >
                                {city}
                            </button>
                        ))}
                    </div>
                </div>

            </div>

        </div>
    );
};

export default SearchBar;
