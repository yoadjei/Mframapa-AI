import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
// generateInsight removed
import { Share2, MapPin, Activity, AlertTriangle, Wind, Info, ExternalLink, Twitter, Linkedin, Link, MessageCircle, X, ChevronDown, ChevronUp, Droplets, Thermometer, Gauge, Check } from 'lucide-react';

const PredictionCard = ({ prediction, onClose }) => {
    const { t, language } = useLanguage();
    const [showShare, setShowShare] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [showCopyToast, setShowCopyToast] = useState(false);
    // Get static localized insight based on AQI
    const getInsightKey = (category) => {
        const cat = (category || 'Moderate').toLowerCase();
        if (cat.includes('good')) return 'insight.good';
        if (cat.includes('moderate')) return 'insight.moderate';
        if (cat.includes('sensitive')) return 'insight.sensitive';
        if (cat.includes('hazardous')) return 'insight.hazardous';
        return 'insight.unhealthy'; // Default for 'Unhealthy'
    };

    if (!prediction) return null;

    const insightKey = getInsightKey(prediction.aqi_category);

    // Colors based on spec
    const getAQIColor = (aqi) => {
        const val = prediction.pm25;
        if (val <= 12) return '#10B981'; // Green
        if (val <= 35) return '#FBBF24'; // Yellow
        if (val <= 55) return '#F97316'; // Orange
        if (val <= 150) return '#EF4444'; // Red
        return '#A855F7'; // Purple
    };

    const aqiColor = getAQIColor(prediction.pm25);

    const getHealthMessage = (pm25) => {
        if (pm25 <= 12) return { text: t('advice.good'), icon: Activity };
        if (pm25 <= 35) return { text: t('advice.moderate'), icon: Info };
        if (pm25 <= 55) return { text: t('advice.sensitive'), icon: AlertTriangle };
        return { text: t('advice.unhealthy'), icon: AlertTriangle };
    };

    const health = getHealthMessage(prediction.pm25);
    const HealthIcon = health.icon;

    const shareText = `${t('card.checking')} ${prediction.location.name}. ${t('card.pm25_label')} ${Math.round(prediction.pm25)} ${t('card.unit')}. #MframapaAI`;
    const shareUrl = "https://mframapa.ai"; // Placeholder URL

    const handleShare = (platform) => {
        let url = '';
        switch (platform) {
            case 'twitter':
                url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
                break;
            case 'whatsapp':
                url = `https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`;
                break;
            case 'linkedin':
                url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`; // LinkedIn mostly ignores text param
                break;
            case 'copy':
                navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
                setShowShare(false);
                setShowCopyToast(true);
                setTimeout(() => setShowCopyToast(false), 2000);
                return;
            default:
                return;
        }
        window.open(url, '_blank');
        setShowShare(false);
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 md:absolute md:top-24 md:right-6 md:bottom-auto md:left-auto w-full md:w-96 animate-in slide-in-from-bottom duration-500">

            {/* Glass Panel */}
            <div className="glass-card p-6 md:rounded-2xl rounded-t-3xl text-gray-900 dark:text-white relative overflow-visible group transition-all duration-300 shadow-[0_-10px_40px_rgba(0,0,0,0.2)] md:shadow-none border-t border-gray-200 dark:border-white/10 md:border-t-0">

                {/* Glow behind */}
                <div
                    className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-[60px] opacity-20 pointer-events-none"
                    style={{ backgroundColor: aqiColor }}
                ></div>

                {/* Header */}
                <div className="flex justify-between items-start mb-6 relative z-10">
                    <div>
                        <h2 className="text-2xl font-bold leading-tight">{prediction.location.name}</h2>
                        <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-xs mt-1 font-mono">
                            <MapPin className="w-3 h-3" />
                            {Number(prediction.location.lat).toFixed(4)}, {Number(prediction.location.lon).toFixed(4)}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Hero Number */}
                <div className="flex items-end gap-3 mb-6 relative z-10">
                    <span
                        className="text-6xl font-black tracking-tighter leading-none"
                        style={{ color: aqiColor }}
                    >
                        {Math.round(prediction.pm25)}
                    </span>
                    <div className="flex flex-col mb-1">
                        <span className="text-sm font-bold text-gray-400 dark:text-gray-300">{t('card.pm25_label')}</span>
                        <span className="text-xs text-gray-500">{t('card.unit')}</span>
                    </div>
                </div>

                {prediction.uncertainty?.pm25_lower != null &&
                    prediction.uncertainty?.pm25_upper != null && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 -mt-2">
                        {t('card.uncertainty_range')}:{' '}
                        {Math.round(prediction.uncertainty.pm25_lower)} –{' '}
                        {Math.round(prediction.uncertainty.pm25_upper)} {t('card.unit')}
                        <span className="block text-[10px] mt-1 opacity-70">
                            ~{Math.round((prediction.uncertainty.coverage || 0.9) * 100)}% {t('card.coverage')}{' '}
                            ({prediction.uncertainty.method || '—'})
                        </span>
                    </p>
                )}

                {/* Badge */}
                <div
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide mb-6 shadow-sm"
                    style={{ backgroundColor: `${aqiColor}20`, color: aqiColor, border: `1px solid ${aqiColor}40` }}
                >
                    <div className={`w-2 h-2 rounded-full animate-pulse`} style={{ backgroundColor: aqiColor }}></div>
                    {t(`aqi.${prediction.aqi_category.toLowerCase().split(' ')[0]}`) || prediction.aqi_category}
                </div>

                {/* Health Advisory */}
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 mb-6 hover:border-gray-300 dark:hover:border-white/10 transition-colors">
                    <div className="flex gap-3">
                        <div className="mt-0.5">
                            <HealthIcon className="w-5 h-5 text-gray-400 dark:text-gray-300" />
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed font-light">
                            {health.text}
                        </p>
                    </div>
                </div>

                {/* Footer info / Actions */}
                <div className="flex justify-between items-end border-t border-gray-100 dark:border-white/5 pt-4 relative">
                    <div>
                        <div className="flex items-center gap-1.5 text-[10px] text-primary-600 dark:text-primary-400 uppercase tracking-wider font-bold mb-1">
                            <Wind className="w-3 h-3" />
                            {t('card.satellite_derived')}
                        </div>
                        <div className="text-[10px] text-gray-400 dark:text-gray-500">
                            {t('card.updated_now')}
                        </div>
                    </div>

                    <div className="flex gap-2 relative">
                        {/* Share Button & Menu */}
                        <div className="relative">
                            <button
                                onClick={() => setShowShare(!showShare)}
                                className={`p-2 rounded-lg border hover:border-primary-500/50 transition-all ${showShare ? 'bg-primary-500/10 text-primary-500 border-primary-500/50' : 'border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                                title={t('card.share')}
                            >
                                <Share2 className="w-4 h-4" />
                            </button>

                            {/* Share Dropdown */}
                            {showShare && (
                                <div className="absolute bottom-full right-0 mb-2 w-48 bg-white dark:bg-[#1a2035] border border-gray-200 dark:border-white/10 rounded-xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 z-30">
                                    <div className="p-1">
                                        <button onClick={() => handleShare('whatsapp')} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-green-500/10 hover:text-green-500 rounded-lg transition-colors">
                                            <MessageCircle className="w-4 h-4" /> {t('share.whatsapp')}
                                        </button>
                                        <button onClick={() => handleShare('twitter')} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-500/10 hover:text-blue-400 rounded-lg transition-colors">
                                            <Twitter className="w-4 h-4" /> {t('share.twitter')}
                                        </button>
                                        <button onClick={() => handleShare('linkedin')} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-600/10 hover:text-blue-600 rounded-lg transition-colors">
                                            <Linkedin className="w-4 h-4" /> {t('share.linkedin')}
                                        </button>
                                        <div className="h-px bg-gray-100 dark:bg-white/5 my-1"></div>
                                        <button onClick={() => handleShare('copy')} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors">
                                            <Link className="w-4 h-4" /> {t('share.copy')}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Details Button */}
                        <button
                            onClick={() => setShowDetails(!showDetails)}
                            className={`p-2 rounded-lg border hover:border-primary-500/50 transition-all ${showDetails ? 'bg-primary-500/10 text-primary-500 border-primary-500/50' : 'border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                            title={t('card.details')}
                        >
                            {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                {showDetails && (
                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/5 animate-in slide-in-from-top-2 duration-300">
                        <h4 className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-3 tracking-wider">{t('card.details')}</h4>

                        <div className="grid grid-cols-2 gap-3">
                            {/* Humidity */}
                            <div className="bg-gray-50 dark:bg-white/5 p-3 rounded-xl border border-gray-100 dark:border-white/5">
                                <div className="flex items-center gap-2 mb-1 text-blue-500">
                                    <Droplets className="w-4 h-4" />
                                    <span className="text-xs font-bold">{t('weather.humidity')}</span>
                                </div>
                                <div className="text-lg font-bold">{prediction.weather?.humidity || 65}%</div>
                            </div>

                            {/* Temp */}
                            <div className="bg-gray-50 dark:bg-white/5 p-3 rounded-xl border border-gray-100 dark:border-white/5">
                                <div className="flex items-center gap-2 mb-1 text-orange-500">
                                    <Thermometer className="w-4 h-4" />
                                    <span className="text-xs font-bold">{t('weather.temp')}</span>
                                </div>
                                <div className="text-lg font-bold">{prediction.weather?.temp || 28}°C</div>
                            </div>

                            {/* Pressure */}
                            <div className="bg-gray-50 dark:bg-white/5 p-3 rounded-xl border border-gray-100 dark:border-white/5">
                                <div className="flex items-center gap-2 mb-1 text-purple-500">
                                    <Gauge className="w-4 h-4" />
                                    <span className="text-xs font-bold">{t('weather.pressure')}</span>
                                </div>
                                <div className="text-lg font-bold">{prediction.weather?.pressure || 1012} hPa</div>
                            </div>

                            {/* Wind */}
                            <div className="bg-gray-50 dark:bg-white/5 p-3 rounded-xl border border-gray-100 dark:border-white/5">
                                <div className="flex items-center gap-2 mb-1 text-gray-500 dark:text-gray-400">
                                    <Wind className="w-4 h-4" />
                                    <span className="text-xs font-bold">{t('weather.wind')}</span>
                                </div>
                                <div className="text-lg font-bold">{prediction.weather?.wind || 12} km/h</div>
                            </div>
                        </div>

                        <div className="mt-3 bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl">
                            <h5 className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-1">{t('card.insight_title')}</h5>
                            <p className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed">
                                {t(insightKey) || t('advice.unhealthy')}
                            </p>
                        </div>
                    </div>
                )}

            </div>

            {/* Copy Toast Overlay */}
            {showCopyToast && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/20 dark:bg-black/20 backdrop-blur-sm rounded-2xl animate-in fade-in duration-200">
                    <div className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 font-bold transform scale-100 animate-in zoom-in-95">
                        <div className="bg-green-500 rounded-full p-1">
                            <Check className="w-3 h-3 text-white" />
                        </div>
                        {t('share.copied')}
                    </div>
                </div>
            )}

        </div>
    );
};

export default PredictionCard;
