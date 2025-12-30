import React from 'react';
import { Share2, MapPin, Activity, AlertTriangle, Wind, Info, ExternalLink } from 'lucide-react';

const PredictionCard = ({ prediction, onClose }) => {
    if (!prediction) return null;

    // Colors based on spec
    const getAQIColor = (aqi) => {
        // Assuming aqi matches spec ranges. Using pm25 just to be safe if aqi missing
        const val = prediction.pm25;
        if (val <= 12) return '#10B981'; // Green
        if (val <= 35) return '#FBBF24'; // Yellow
        if (val <= 55) return '#F97316'; // Orange
        if (val <= 150) return '#EF4444'; // Red
        return '#A855F7'; // Purple
    };

    const aqiColor = getAQIColor(prediction.pm25);

    const getHealthMessage = (pm25) => {
        if (pm25 <= 12) return { text: "Air quality is good. Enjoy outdoor activities!", icon: Activity };
        if (pm25 <= 35) return { text: "Moderate quality. Sensitive individuals should limit prolonged exposure.", icon: Info };
        if (pm25 <= 55) return { text: "Unhealthy for sensitive groups.", icon: AlertTriangle };
        return { text: "Air quality is degraded. Reduce outdoor activity.", icon: AlertTriangle };
    };

    const health = getHealthMessage(prediction.pm25);
    const HealthIcon = health.icon;

    return (
        <div className="absolute top-24 right-6 w-80 md:w-96 z-20 animate-in slide-in-from-right-10 duration-500">

            {/* Glass Panel */}
            <div className="glass-card p-6 text-gray-900 dark:text-white relative overflow-hidden group">

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
                        ✕
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
                        <span className="text-sm font-bold text-gray-400 dark:text-gray-300">PM2.5</span>
                        <span className="text-xs text-gray-500">µg/m³</span>
                    </div>
                </div>

                {/* Badge */}
                <div
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide mb-6 shadow-sm"
                    style={{ backgroundColor: `${aqiColor}20`, color: aqiColor, border: `1px solid ${aqiColor}40` }}
                >
                    <div className={`w-2 h-2 rounded-full animate-pulse`} style={{ backgroundColor: aqiColor }}></div>
                    {prediction.aqi_category}
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

                {/* Footer info */}
                <div className="flex justify-between items-end border-t border-gray-100 dark:border-white/5 pt-4">
                    <div>
                        <div className="flex items-center gap-1.5 text-[10px] text-primary-600 dark:text-primary-400 uppercase tracking-wider font-bold mb-1">
                            <Wind className="w-3 h-3" />
                            Satellite Derived
                        </div>
                        <div className="text-[10px] text-gray-400 dark:text-gray-500">
                            Updated just now
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button className="p-2 rounded-lg border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5 hover:border-primary-500/50 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all" title="Share">
                            <Share2 className="w-4 h-4" />
                        </button>
                        <button className="p-2 rounded-lg border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5 hover:border-primary-500/50 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all" title="Details">
                            <ExternalLink className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default PredictionCard;
