import React from 'react';
import { Wifi, Server, Cpu } from 'lucide-react';

const DataPanel = () => {
    return (
        <div className="absolute bottom-0 left-0 right-0 p-6 z-20 flex justify-center pointer-events-none hidden md:flex">
            <div className="grid grid-cols-3 gap-4 pointer-events-auto">

                {/* Card 1: Satellite */}
                <div className="glass px-5 py-3 rounded-2xl flex items-center gap-4 min-w-[200px] hover:translate-y-[-2px] transition-transform duration-300">
                    <div className="relative">
                        <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
                        <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-50"></div>
                    </div>
                    <div>
                        <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-widest font-bold mb-0.5">Satellite Feed</div>
                        <div className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            Active <span className="text-gray-400 dark:text-gray-500 font-normal text-xs">• 3h ago</span>
                        </div>
                    </div>
                </div>

                {/* Card 2: Ground Stations */}
                <div className="glass px-5 py-3 rounded-2xl flex items-center gap-4 min-w-[200px] hover:translate-y-[-2px] transition-transform duration-300">
                    <div className="p-1.5 bg-primary-500/10 rounded-lg text-primary-500">
                        <Server className="w-4 h-4" />
                    </div>
                    <div>
                        <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-widest font-bold mb-0.5">Ground Truth</div>
                        <div className="text-sm font-bold text-gray-900 dark:text-white">
                            6 Reference Nations <span className="text-gray-400 dark:text-gray-500 font-normal text-xs ml-1">(Powering 54)</span>
                        </div>
                    </div>
                </div>

                {/* Card 3: Predictions */}
                <div className="glass px-5 py-3 rounded-2xl flex items-center gap-4 min-w-[200px] hover:translate-y-[-2px] transition-transform duration-300">
                    <div className="p-1.5 bg-accent-500/10 rounded-lg text-accent-500">
                        <Cpu className="w-4 h-4" />
                    </div>
                    <div>
                        <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-widest font-bold mb-0.5">Today's Inference</div>
                        <div className="text-sm font-bold text-gray-900 dark:text-white">
                            1,247 <span className="text-green-600 dark:text-green-400 font-normal text-xs ml-1">91% Val.</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default DataPanel;
