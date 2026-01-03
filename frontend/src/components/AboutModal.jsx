import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { X, Satellite, Info, AlertTriangle, Users } from 'lucide-react';

const AboutModal = ({ onClose }) => {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState(0);

    const tabs = [
        { id: 0, title: t('about.tab.overview'), icon: Info },
        { id: 1, title: t('about.tab.how_it_works'), icon: Satellite },
        { id: 2, title: t('about.tab.limitations'), icon: AlertTriangle },
        { id: 3, title: t('about.tab.who_its_for'), icon: Users },
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
                    <h2 className="text-xl font-display font-bold text-gray-900 dark:text-white mb-6 pl-2 hidden md:block">{t('nav.about')}</h2>
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
                            <h3 className="text-3xl font-display font-bold text-gray-900 dark:text-white">{t('about.title')}</h3>

                            <div className="p-6 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5">
                                <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{t('about.overview.what_we_do')}</h4>
                                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                    {t('about.overview.desc')}
                                </p>
                            </div>

                            <div className="p-6 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5">
                                <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{t('about.overview.problem')}</h4>
                                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                    {t('about.overview.problem_desc')}
                                </p>
                            </div>
                        </div>
                    )}

                    {activeTab === 1 && (
                        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                            <h3 className="text-3xl font-display font-bold text-gray-900 dark:text-white">{t('about.tab.how_it_works')}</h3>
                            <p className="text-gray-400 text-lg leading-relaxed">
                                {t('about.how.intro')}
                            </p>

                            <div className="grid gap-6">
                                <div className="p-6 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 flex gap-4">
                                    <div className="w-12 h-12 rounded-full bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 font-bold">1</div>
                                    <div>
                                        <h4 className="text-gray-900 dark:text-white font-bold text-lg mb-2">{t('about.how.step1.title')}</h4>
                                        <p className="text-sm text-gray-400">{t('about.how.step1.desc')}</p>
                                    </div>
                                </div>
                                <div className="p-6 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 flex gap-4">
                                    <div className="w-12 h-12 rounded-full bg-primary-500/10 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0 font-bold">2</div>
                                    <div>
                                        <h4 className="text-gray-900 dark:text-white font-bold text-lg mb-2">{t('about.how.step2.title')}</h4>
                                        <p className="text-sm text-gray-400">{t('about.how.step2.desc')}</p>
                                    </div>
                                </div>
                                <div className="p-6 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 flex gap-4">
                                    <div className="w-12 h-12 rounded-full bg-accent-500/10 dark:bg-accent-500/20 text-accent-600 dark:text-accent-400 flex items-center justify-center shrink-0 font-bold">3</div>
                                    <div>
                                        <h4 className="text-gray-900 dark:text-white font-bold text-lg mb-2">{t('about.how.step3.title')}</h4>
                                        <p className="text-sm text-gray-400">{t('about.how.step3.desc')}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 2 && (
                        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                            <h3 className="text-3xl font-display font-bold text-gray-900 dark:text-white">{t('about.tab.limitations')}</h3>
                            <p className="text-gray-400 text-lg leading-relaxed">
                                {t('about.limit.intro')}
                            </p>

                            <div className="grid gap-4">
                                <div className="p-6 rounded-2xl bg-yellow-500/10 border border-yellow-500/20">
                                    <h4 className="text-yellow-600 dark:text-yellow-400 font-bold text-lg mb-2">{t('about.limit.cloud')}</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('about.limit.cloud_desc')}</p>
                                </div>
                                <div className="p-6 rounded-2xl bg-yellow-500/10 border border-yellow-500/20">
                                    <h4 className="text-yellow-600 dark:text-yellow-400 font-bold text-lg mb-2">{t('about.limit.gap')}</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('about.limit.gap_desc')}</p>
                                </div>
                                <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20">
                                    <h4 className="text-red-600 dark:text-red-400 font-bold text-lg mb-2">{t('about.limit.legal')}</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('about.limit.legal_desc')}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 3 && (
                        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                            <h3 className="text-3xl font-display font-bold text-gray-900 dark:text-white">{t('about.tab.who_its_for')}</h3>
                            <div className="grid gap-6">
                                <div className="p-6 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 rounded-lg bg-green-500/10 text-green-500">
                                            <Users className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{t('about.who.citizens')}</h4>
                                            <p className="text-gray-600 dark:text-gray-400 text-sm">{t('about.who.citizens_desc')}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 rounded-lg bg-blue-500/10 text-blue-500">
                                            <Info className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{t('about.who.researchers')}</h4>
                                            <p className="text-gray-600 dark:text-gray-400 text-sm">{t('about.who.researchers_desc')}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 rounded-lg bg-purple-500/10 text-purple-500">
                                            <AlertTriangle className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{t('about.who.advocacy')}</h4>
                                            <p className="text-gray-600 dark:text-gray-400 text-sm">{t('about.who.advocacy_desc')}</p>
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
