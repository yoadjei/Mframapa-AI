import React, { useState } from 'react';
import { X, Satellite, Server, Cpu, Heart, ChevronDown, ChevronUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
    { name: 'Jan', val: 4000 },
    { name: 'Feb', val: 3000 },
    { name: 'Mar', val: 2000 },
    { name: 'Apr', val: 2780 },
    { name: 'May', val: 1890 },
    { name: 'Jun', val: 2390 },
    { name: 'Jul', val: 3490 },
];

const AboutModal = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState(0);

    const tabs = [
        { id: 0, title: "How It Works", icon: Satellite },
        { id: 1, title: "The Data", icon: Server },
        { id: 2, title: "The Model", icon: Cpu },
        { id: 3, title: "Impact", icon: Heart },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300"
                onClick={onClose}
            ></div>

            <div className="relative z-10 w-full max-w-4xl h-[80vh] bg-[#0A0F1C] border border-white/10 rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden animate-in zoom-in-95 duration-300">

                {/* Close Button Mobile */}
                <button onClick={onClose} className="absolute top-4 right-4 md:hidden p-2 text-gray-400 z-50">
                    <X className="w-6 h-6" />
                </button>

                {/* Sidebar Navigation */}
                <div className="w-full md:w-64 bg-white/5 border-r border-white/5 p-6 flex flex-col gap-2">
                    <h2 className="text-xl font-display font-bold text-white mb-6 pl-2 hidden md:block">Science</h2>
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.title}
                        </button>
                    ))}

                    <div className="mt-auto hidden md:block">
                        <div className="p-4 rounded-xl bg-accent-500/10 border border-accent-500/20">
                            <h4 className="text-xs font-bold text-accent-400 uppercase mb-2">Paper Available</h4>
                            <p className="text-[10px] text-gray-400 leading-relaxed mb-3">
                                Read our full methodology on arXiv regarding satellite-ground fusion.
                            </p>
                            <button className="text-xs font-bold text-white underline decoration-accent-500/50 hover:decoration-accent-500">Read Paper &rarr;</button>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 p-8 md:p-12 overflow-y-auto custom-scrollbar relative">
                    <button onClick={onClose} className="absolute top-8 right-8 hidden md:block p-2 rounded-full hover:bg-white/5 text-gray-500 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>

                    {activeTab === 0 && (
                        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                            <h3 className="text-3xl font-display font-bold text-white">Understanding the Pipeline</h3>
                            <p className="text-gray-400 text-lg leading-relaxed">
                                Traditional sensors are expensive. We use satellites to fill the gaps.
                            </p>

                            <div className="grid gap-6">
                                <div className="p-6 rounded-2xl bg-white/5 border border-white/5 flex gap-4">
                                    <div className="w-12 h-12 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 font-bold">1</div>
                                    <div>
                                        <h4 className="text-white font-bold text-lg mb-2">Satellite Acquisition</h4>
                                        <p className="text-sm text-gray-400">NASA MODIS & Sentinel-5P satellites pass over Africa daily, measuring Aerosol Optical Depth (light scattering by dust/smoke).</p>
                                    </div>
                                </div>
                                <div className="p-6 rounded-2xl bg-white/5 border border-white/5 flex gap-4">
                                    <div className="w-12 h-12 rounded-full bg-primary-500/20 text-primary-400 flex items-center justify-center shrink-0 font-bold">2</div>
                                    <div>
                                        <h4 className="text-white font-bold text-lg mb-2">Ground Calibration</h4>
                                        <p className="text-sm text-gray-400">Our model learns the relationship between what satellites "see" and what ground sensors measure in 6 reference countries.</p>
                                    </div>
                                </div>
                                <div className="p-6 rounded-2xl bg-white/5 border border-white/5 flex gap-4">
                                    <div className="w-12 h-12 rounded-full bg-accent-500/20 text-accent-400 flex items-center justify-center shrink-0 font-bold">3</div>
                                    <div>
                                        <h4 className="text-white font-bold text-lg mb-2">Universal Inference</h4>
                                        <p className="text-sm text-gray-400">The trained XGBoost model can then predict PM2.5 levels for any GPS coordinate, even without a local sensor.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 1 && (
                        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                            <h3 className="text-3xl font-display font-bold text-white">The Data Landscape</h3>
                            <div className="aspect-video w-full rounded-2xl border border-white/10 bg-white/5 overflow-hidden p-6 relative">
                                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Training Data Growth</h4>
                                <ResponsiveContainer width="100%" height="80%">
                                    <AreaChart data={data}>
                                        <defs>
                                            <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#00FFB3" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#00FFB3" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="name" stroke="#334155" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#334155" fontSize={12} tickLine={false} axisLine={false} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                                            itemStyle={{ color: '#fff' }}
                                        />
                                        <Area type="monotone" dataKey="val" stroke="#00FFB3" strokeWidth={3} fillOpacity={1} fill="url(#colorVal)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                    <div className="text-2xl font-black text-white">200k+</div>
                                    <div className="text-xs text-gray-500 uppercase">Hourly Readings</div>
                                </div>
                                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                    <div className="text-2xl font-black text-white">54</div>
                                    <div className="text-xs text-gray-500 uppercase">Nations Modeled</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Placeholder for other tabs if time permits, or they just show generic text */}
                    {activeTab > 1 && (
                        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 flex flex-col items-center justify-center h-full text-center">
                            <Cpu className="w-16 h-16 text-white/10 mb-4" />
                            <h3 className="text-2xl font-bold text-white">Content Module Loading...</h3>
                            <p className="text-gray-500">Detailed methodology regarding XGBoost feature importance analysis coming soon.</p>
                        </div>
                    )}

                </div>

            </div>
        </div>
    );
};

export default AboutModal;
