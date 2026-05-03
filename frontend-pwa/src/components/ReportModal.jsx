import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { X, Send, MapPin, Smile, Frown, Meh, AlertTriangle } from 'lucide-react';
import { submitReport } from '../services/api';

const ReportModal = ({ onClose }) => {
    const { t } = useLanguage();
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);
    const [userLocation, setUserLocation] = useState(null);
    const [comment, setComment] = useState('');

    // Get user location on mount
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setUserLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
                () => setUserLocation({ lat: 5.6, lon: -0.2 }) // Default to Accra
            );
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        const lat = userLocation?.lat || 5.6;
        const lon = userLocation?.lon || -0.2;

        try {
            await submitReport(lat, lon, selectedCategory, comment || null);
            setSuccess(true);
            setTimeout(onClose, 2000);
        } catch (err) {
            console.error('Report failed:', err);
            setError(err.message);
            setSubmitting(false);
        }
    };

    const categories = [
        {
            label: t('aqi.good'),
            apiKey: 'good',
            icon: Smile,
            color: 'text-green-400',
            bg: 'bg-green-400/10 border-green-400/20',
            clue: t('report.clue.good')
        },
        {
            label: t('aqi.moderate'),
            apiKey: 'moderate',
            icon: Meh,
            color: 'text-yellow-400',
            bg: 'bg-yellow-400/10 border-yellow-400/20',
            clue: t('report.clue.moderate')
        },
        {
            label: t('aqi.unhealthy'),
            apiKey: 'bad',
            icon: Frown,
            color: 'text-orange-400',
            bg: 'bg-orange-400/10 border-orange-400/20',
            clue: t('report.clue.unhealthy')
        },
        {
            label: t('aqi.hazardous'),
            apiKey: 'very_bad',
            icon: AlertTriangle,
            color: 'text-red-400',
            bg: 'bg-red-400/10 border-red-400/20',
            clue: t('report.clue.hazardous')
        },
    ];

    const [selectedCategory, setSelectedCategory] = useState('good');

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
                        <h2 className="text-xl font-display font-bold text-gray-900 dark:text-white">{t('report.title')}</h2>
                        <p className="text-xs text-gray-400">{t('report.subtitle')}</p>
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
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('report.success_title')}</h3>
                        <p className="text-gray-400">{t('report.success_desc')}</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">

                        {/* Location Mock */}
                        <div className="bg-gray-50 dark:bg-white/5 p-3 rounded-xl border border-gray-200 dark:border-white/5 flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                            <MapPin className="w-4 h-4 text-primary-400" />
                            <span>{t('report.location_mock')}</span>
                        </div>

                        {/* Perception Selector */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">{t('report.label_feel')}</label>
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                {categories.map((cat) => (
                                    <button
                                        key={cat.apiKey}
                                        type="button"
                                        onClick={() => setSelectedCategory(cat.apiKey)}
                                        className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all duration-200 ${selectedCategory === cat.apiKey
                                            ? `${cat.bg} border-current ring-1 ring-white/20`
                                            : 'bg-gray-50 dark:bg-white/5 border-transparent hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'
                                            }`}
                                    >
                                        <cat.icon className={`w-6 h-6 ${selectedCategory === cat.apiKey ? cat.color : 'text-current'}`} />
                                        <span className={`text-xs font-medium ${selectedCategory === cat.apiKey ? 'text-gray-900 dark:text-white' : 'text-current'}`}>
                                            {cat.label}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            {/* Clue Panel */}
                            <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/10 text-center animate-in fade-in duration-300">
                                <p className="text-xs text-gray-600 dark:text-blue-200">
                                    <span className="font-bold text-blue-500 dark:text-blue-400 mr-2">Guide:</span>
                                    {categories.find(c => c.apiKey === selectedCategory)?.clue}
                                </p>
                            </div>
                        </div>

                        {/* Comment */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{t('report.label_obs')}</label>
                            <textarea
                                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-sm"
                                rows="3"
                                placeholder={t('report.placeholder_obs')}
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
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
                                    <span>{t('report.submit')}</span>
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
