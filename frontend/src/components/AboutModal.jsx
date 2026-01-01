import React, { useState } from 'react';
import { X, Satellite, Info, AlertTriangle, Users } from 'lucide-react';

const AboutModal = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState(0);

    const tabs = [
        { id: 0, title: "Overview", icon: Info },
        { id: 1, title: "How It Works", icon: Satellite },
        { id: 2, title: "Limitations", icon: AlertTriangle },
        { id: 3, title: "Who It's For", icon: Users },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300"
                onClick={onClose}
            ></div>

            <div className="relative z-10 w-full max-w-4xl h-[80vh] bg-white dark:bg-[#0A0F1C] border border-gray-200 dark:border-white/10 rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden animate-in zoom-in-95 duration-300">

                {/* Close Button Mobile */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 md:hidden p-2 text-gray-400 hover:text-white z-[60] bg-black/5 dark:bg-white/10 backdrop-blur-md rounded-full transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Sidebar Navigation */}
                <div className="w-full md:w-64 bg-gray-50 dark:bg-white/5 border-r border-gray-200 dark:border-white/5 p-6 pt-14 md:pt-6 flex flex-col gap-2">
                    <h2 className="text-xl font-display font-bold text-gray-900 dark:text-white mb-6 pl-2 hidden md:block">About</h2>
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-primary-500/10 text-primary-500 dark:text-primary-400 border border-primary-500/20' : 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-white/5 hover:text-black dark:hover:text-white'}`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.title}
                        </button>
                    ))}


                </div>

                {/* Content Area */}
                <div className="flex-1 p-8 md:p-12 overflow-y-auto custom-scrollbar relative">
                    <button onClick={onClose} className="absolute top-8 right-8 hidden md:block p-2 rounded-full hover:bg-white/5 text-gray-500 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>

                    {activeTab === 0 && (
                        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                            <h3 className="text-3xl font-display font-bold text-gray-900 dark:text-white">About Mframapa AI</h3>

                            <div className="p-6 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5">
                                <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-3">What We Do</h4>
                                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                    Mframapa AI estimates daily PM2.5 concentrations across all 54 African nations and translates them into color-coded AQI categories (Good, Moderate, Unhealthy, etc.). Predictions update daily as new satellite data becomes available.
                                </p>
                            </div>

                            <div className="p-6 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5">
                                <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-3">The Problem</h4>
                                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                    Most African cities lack public air quality monitors. Mframapa AI provides air quality estimates for unmonitored regions.
                                </p>
                            </div>
                        </div>
                    )}

                    {activeTab === 1 && (
                        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                            <h3 className="text-3xl font-display font-bold text-gray-900 dark:text-white">How It Works</h3>
                            <p className="text-gray-400 text-lg leading-relaxed">
                                Leveraging satellite data and machine learning to infer air quality without ground sensors.
                            </p>

                            <div className="grid gap-6">
                                <div className="p-6 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 flex gap-4">
                                    <div className="w-12 h-12 rounded-full bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 font-bold">1</div>
                                    <div>
                                        <h4 className="text-gray-900 dark:text-white font-bold text-lg mb-2">Satellites as Sensors</h4>
                                        <p className="text-sm text-gray-400">We use ESA Sentinel-5P (NO₂) and NASA MERRA-2 (aerosol optical depth) to observe atmospheric conditions daily.</p>
                                    </div>
                                </div>
                                <div className="p-6 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 flex gap-4">
                                    <div className="w-12 h-12 rounded-full bg-primary-500/10 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0 font-bold">2</div>
                                    <div>
                                        <h4 className="text-gray-900 dark:text-white font-bold text-lg mb-2">Ground Calibration</h4>
                                        <p className="text-sm text-gray-400">The model learns from 425 physical monitoring stations across 29 African countries.</p>
                                    </div>
                                </div>
                                <div className="p-6 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 flex gap-4">
                                    <div className="w-12 h-12 rounded-full bg-accent-500/10 dark:bg-accent-500/20 text-accent-600 dark:text-accent-400 flex items-center justify-center shrink-0 font-bold">3</div>
                                    <div>
                                        <h4 className="text-gray-900 dark:text-white font-bold text-lg mb-2">Continental Inference</h4>
                                        <p className="text-sm text-gray-400">An XGBoost model translates satellite observations into ground-level PM2.5 estimates for any location.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 2 && (
                        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                            <h3 className="text-3xl font-display font-bold text-gray-900 dark:text-white">Limitations</h3>
                            <p className="text-gray-400 text-lg leading-relaxed">
                                While powerful, satellite-based estimation has constraints you should be aware of.
                            </p>

                            <div className="grid gap-4">
                                <div className="p-6 rounded-2xl bg-yellow-500/10 border border-yellow-500/20">
                                    <h4 className="text-yellow-600 dark:text-yellow-400 font-bold text-lg mb-2">Cloud Blindness</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Satellites cannot measure through thick clouds.</p>
                                </div>
                                <div className="p-6 rounded-2xl bg-yellow-500/10 border border-yellow-500/20">
                                    <h4 className="text-yellow-600 dark:text-yellow-400 font-bold text-lg mb-2">Temporal Gaps</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">One daily satellite pass may miss short pollution spikes.</p>
                                </div>
                                <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20">
                                    <h4 className="text-red-600 dark:text-red-400 font-bold text-lg mb-2">Not for Medical/Legal Use</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Estimates are not certified measurements.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 3 && (
                        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                            <h3 className="text-3xl font-display font-bold text-gray-900 dark:text-white">Who It's For</h3>
                            <div className="grid gap-6">
                                <div className="p-6 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 rounded-lg bg-green-500/10 text-green-500">
                                            <Users className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Citizens</h4>
                                            <p className="text-gray-600 dark:text-gray-400 text-sm">Checking air quality before outdoor activities.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 rounded-lg bg-blue-500/10 text-blue-500">
                                            <Info className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Researchers</h4>
                                            <p className="text-gray-600 dark:text-gray-400 text-sm">Identifying pollution patterns.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 rounded-lg bg-purple-500/10 text-purple-500">
                                            <AlertTriangle className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Advocacy Groups</h4>
                                            <p className="text-gray-600 dark:text-gray-400 text-sm">Building evidence for policy.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </div>

            </div>
        </div>
    );
};

export default AboutModal;
