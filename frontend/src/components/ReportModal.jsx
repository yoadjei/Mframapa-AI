import React, { useState } from 'react';
import { X, Send, MapPin, Smile, Frown, Meh, AlertTriangle } from 'lucide-react';

const ReportModal = ({ onClose }) => {
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitting(true);
        // Simulate API call
        setTimeout(() => {
            setSubmitting(false);
            setSuccess(true);
            setTimeout(onClose, 2000);
        }, 1500);
    };

    const categories = [
        {
            label: 'Good',
            icon: Smile,
            color: 'text-green-400',
            bg: 'bg-green-400/10 border-green-400/20',
            clue: "Air feels fresh. No visible haze. Visibility is clear."
        },
        {
            label: 'Moderate',
            icon: Meh,
            color: 'text-yellow-400',
            bg: 'bg-yellow-400/10 border-yellow-400/20',
            clue: "Air is acceptable. Very faint haze might be visible on distant horizons."
        },
        {
            label: 'Unhealthy',
            icon: Frown,
            color: 'text-orange-400',
            bg: 'bg-orange-400/10 border-orange-400/20',
            clue: "Visible smog/smoke. Slight irritation in throat/eyes or distinct odor."
        },
        {
            label: 'Hazardous',
            icon: AlertTriangle,
            color: 'text-red-400',
            bg: 'bg-red-400/10 border-red-400/20',
            clue: "Heavy smoke/dust. Poor visibility. Breathing feels difficult or heavy."
        },
    ];

    const [selectedCategory, setSelectedCategory] = useState(categories[0].label);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300"
                onClick={onClose}
            ></div>

            <div className="relative z-10 w-full max-w-md bg-white dark:bg-[#0A0F1C] border border-gray-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">

                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-white/5 flex justify-between items-center bg-gray-50 dark:bg-white/5">
                    <div>
                        <h2 className="text-xl font-display font-bold text-gray-900 dark:text-white">Report Air Quality</h2>
                        <p className="text-xs text-gray-400">Contribute to the community data layer.</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {success ? (
                    <div className="p-12 flex flex-col items-center justify-center text-center animate-in zoom-in duration-300">
                        <div className="w-16 h-16 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center mb-4">
                            <Send className="w-8 h-8" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Report Sent!</h3>
                        <p className="text-gray-400">Thank you for contributing to Mframapa AI.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">

                        {/* Location Mock */}
                        <div className="bg-gray-50 dark:bg-white/5 p-3 rounded-xl border border-gray-200 dark:border-white/5 flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                            <MapPin className="w-4 h-4 text-primary-400" />
                            <span>Using inferred location from map center</span>
                        </div>

                        {/* Perception Selector */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">How does the air feel?</label>
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                {categories.map((cat) => (
                                    <button
                                        key={cat.label}
                                        type="button"
                                        onClick={() => setSelectedCategory(cat.label)}
                                        className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all duration-200 ${selectedCategory === cat.label
                                            ? `${cat.bg} border-current ring-1 ring-white/20`
                                            : 'bg-gray-50 dark:bg-white/5 border-transparent hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'
                                            }`}
                                    >
                                        <cat.icon className={`w-6 h-6 ${selectedCategory === cat.label ? cat.color : 'text-current'}`} />
                                        <span className={`text-xs font-medium ${selectedCategory === cat.label ? 'text-gray-900 dark:text-white' : 'text-current'}`}>
                                            {cat.label}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            {/* Clue Panel */}
                            <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/10 text-center animate-in fade-in duration-300">
                                <p className="text-xs text-gray-600 dark:text-blue-200">
                                    <span className="font-bold text-blue-500 dark:text-blue-400 mr-2">Guide:</span>
                                    {categories.find(c => c.label === selectedCategory)?.clue}
                                </p>
                            </div>
                        </div>

                        {/* Comment */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Observations (Optional)</label>
                            <textarea
                                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-sm"
                                rows="3"
                                placeholder="e.g. Smell of smoke, visible haze..."
                            ></textarea>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-4 rounded-xl bg-primary-500 hover:bg-primary-400 text-black font-bold shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? (
                                <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></span>
                            ) : (
                                <>
                                    <span>Submit Report</span>
                                    <Send className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ReportModal;
