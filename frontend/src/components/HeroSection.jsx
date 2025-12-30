import React from 'react';
import { ArrowRight, Activity, Wind, Database } from 'lucide-react';

const HeroSection = ({ onStart }) => {
    return (
        <div className="relative z-10 flex flex-col justify-center min-h-screen px-6 md:px-12 max-w-7xl mx-auto w-full pointer-events-none">

            {/* Main Content Container - Pointer Events Auto for Interaction */}
            <div className="pointer-events-auto max-w-4xl space-y-10 pt-20">

                {/* Animated Headline */}
                <h1 className="text-6xl md:text-8xl font-display font-black tracking-tighter leading-[0.9] animate-in slide-in-from-bottom-5 duration-1000 fade-in">
                    <span className="text-gray-900 dark:text-white block transition-colors">Breathe Informed.</span>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-accent-500 text-glow">
                        Anywhere in Africa.
                    </span>
                </h1>

                {/* Subheadline */}
                <p className="text-xl md:text-2xl text-gray-600 dark:text-white/70 font-light max-w-2xl animate-in slide-in-from-bottom-5 duration-1000 delay-200 fade-in transition-colors">
                    AI-powered air quality predictions for <span className="text-gray-900 dark:text-white font-medium">54 nations</span>. No sensors required.
                </p>

                {/* CTA Button */}
                <div className="animate-in slide-in-from-bottom-5 duration-1000 delay-300 fade-in">
                    <button
                        onClick={onStart}
                        className="group relative px-8 h-14 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 text-black font-bold text-lg tracking-wide shadow-[0_8px_32px_rgba(0,255,179,0.3)] hover:shadow-[0_8px_32px_rgba(0,255,179,0.5)] transition-all duration-300 transform hover:-translate-y-0.5 flex items-center gap-3 overflow-hidden"
                    >
                        <span className="relative z-10">Explore the Map</span>
                        <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                    </button>
                </div>

            </div>

        </div>
    );
};

export default HeroSection;
