import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Wifi, Server, Cpu } from 'lucide-react';

const DataPanel = () => {
    const { t } = useLanguage();
    const [inferenceCount, setInferenceCount] = useState(1247);
    const [accuracy, setAccuracy] = useState(91.4);
    const [timeAgo, setTimeAgo] = useState('Just now');
    const [activeStations, setActiveStations] = useState(29);

    useEffect(() => {
        // Simulate real-time inference counter
        const inferenceInterval = setInterval(() => {
            setInferenceCount(prev => prev + Math.floor(Math.random() * 3));

            // Occasionally fluctuate accuracy slightly
            if (Math.random() > 0.7) {
                setAccuracy(prev => {
                    const change = (Math.random() - 0.5) * 0.4;
                    return Math.max(85, Math.min(99, prev + change));
                });
            }
        }, 2000);

        // Simulate satellite feed updates
        const feedInterval = setInterval(() => {
            const states = ['Just now', '1m ago', '2m ago', 'Just now', 'Updating...'];
            setTimeAgo(prev => {
                const currentIndex = states.indexOf(prev);
                return states[(currentIndex + 1) % states.length];
            });
        }, 5000);

        return () => {
            clearInterval(inferenceInterval);
            clearInterval(feedInterval);
        };
    }, []);

    return (
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 z-10 flex justify-center pointer-events-none">
            <div className="flex md:grid md:grid-cols-3 gap-4 pointer-events-auto overflow-x-auto md:overflow-visible w-full md:w-auto pb-safe snap-x snap-mandatory px-2 no-scrollbar">

                {/* Card 1: Satellite */}
                <div className="glass px-5 py-3 rounded-2xl flex items-center gap-4 min-w-[260px] md:min-w-[200px] hover:translate-y-[-2px] transition-transform duration-300 snap-center shrink-0">
                    <div className="relative">
                        <div className={`w-2.5 h-2.5 rounded-full ${timeAgo === 'Updating...' ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                        <div className={`absolute inset-0 rounded-full animate-ping opacity-50 ${timeAgo === 'Updating...' ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                    </div>
                    <div>
                        <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-widest font-bold mb-0.5">{t('footer.satellite_feed')}</div>
                        <div className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            {t('footer.active')} <span className="text-gray-400 dark:text-gray-500 font-normal text-xs">• {timeAgo}</span>
                        </div>
                    </div>
                </div>

                {/* Card 2: Ground Stations */}
                <div className="glass px-5 py-3 rounded-2xl flex items-center gap-4 min-w-[260px] md:min-w-[200px] hover:translate-y-[-2px] transition-transform duration-300 snap-center shrink-0">
                    <div className="p-1.5 bg-primary-500/10 rounded-lg text-primary-500">
                        <Server className="w-4 h-4" />
                    </div>
                    <div>
                        <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-widest font-bold mb-0.5">{t('footer.ground_truth')}</div>
                        <div className="text-sm font-bold text-gray-900 dark:text-white">
                            {activeStations} {t('footer.reference_nations')}
                        </div>
                    </div>
                </div>

                {/* Card 3: Predictions */}
                <div className="glass px-5 py-3 rounded-2xl flex items-center gap-4 min-w-[260px] md:min-w-[200px] hover:translate-y-[-2px] transition-transform duration-300 snap-center shrink-0">
                    <div className="p-1.5 bg-accent-500/10 rounded-lg text-accent-500">
                        <Cpu className="w-4 h-4" />
                    </div>
                    <div>
                        <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-widest font-bold mb-0.5">{t('footer.inference')}</div>
                        <div className="text-sm font-bold text-gray-900 dark:text-white">
                            {inferenceCount.toLocaleString()} <span className={`font-normal text-xs ml-1 ${accuracy > 90 ? 'text-green-600 dark:text-green-400' : 'text-yellow-500'}`}>{accuracy.toFixed(1)}% {t('footer.val')}</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default DataPanel;
