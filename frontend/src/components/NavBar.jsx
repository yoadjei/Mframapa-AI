import React, { useState, useEffect } from 'react';
import { CloudRain, Menu, X, Github, Mail, Sun, Moon } from 'lucide-react';

const NavBar = ({ setAppMode, appMode, onOpenAbout, onOpenReport, toggleTheme, onReset }) => {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <>
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'py-4 bg-white/80 dark:bg-[#0A0F1C]/80 backdrop-blur-md border-b border-gray-200 dark:border-white/5' : 'py-6 bg-transparent'}`}>
                <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">

                    {/* Brand */}
                    <div
                        className="flex items-center gap-3 cursor-pointer group"
                        onClick={() => window.location.reload()}
                    >
                        <div className="relative">
                            <CloudRain className="text-primary-500 h-8 w-8 group-hover:scale-110 transition-transform duration-300" />
                            <div className="absolute inset-0 bg-primary-500/30 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </div>
                        <span className="font-display font-bold text-2xl tracking-tight text-gray-900 dark:text-white transition-colors">
                            Mframapa<span className="text-primary-500 text-sm align-top ml-0.5 shadow-primary-500/50 drop-shadow-lg">AI</span>
                        </span>
                    </div>

                    {/* Desktop Links */}
                    <div className="hidden md:flex items-center gap-8">
                        <button onClick={onReset} className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors">Map</button>
                        <button onClick={onOpenReport} className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors">Report</button>
                        <button onClick={onOpenAbout} className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors">Data</button>
                        <button onClick={onOpenAbout} className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors">About</button>

                        <div className="h-4 w-px bg-gray-300 dark:bg-white/10"></div>

                        <button
                            onClick={toggleTheme}
                            className="group relative p-2 rounded-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-primary-500/50 hover:bg-gray-200 dark:hover:bg-white/10 transition-all duration-300 overflow-hidden"
                            title="Toggle Theme"
                        >
                            {/* Glow Effect */}
                            <div className="absolute inset-0 bg-primary-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                            <div className="relative z-10">
                                <Sun className="w-5 h-5 text-yellow-400 hidden dark:block animate-in zoom-in spin-in-90 duration-300" />
                                <Moon className="w-5 h-5 text-blue-300 block dark:hidden animate-in zoom-in spin-in-90 duration-300" />
                            </div>
                        </button>
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button
                        className="md:hidden text-gray-300 hover:text-white"
                        onClick={() => setMobileMenuOpen(true)}
                    >
                        <Menu className="w-8 h-8" />
                    </button>

                </div>
            </nav>

            {/* Mobile Full Screen Menu */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-[60] bg-[#0A0F1C]/95 backdrop-blur-xl flex flex-col p-8 animate-in slide-in-from-right duration-300">
                    <div className="flex justify-end mb-12">
                        <button onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-full bg-white/5 text-gray-300">
                            <X className="w-8 h-8" />
                        </button>
                    </div>

                    <div className="flex flex-col gap-8 text-3xl font-display font-bold text-white">
                        <button onClick={() => { onReset(); setMobileMenuOpen(false); }} className="text-left py-2 hover:text-primary-500 transition-colors">Map</button>
                        <button onClick={() => { onOpenReport(); setMobileMenuOpen(false); }} className="text-left py-2 hover:text-primary-500 transition-colors">Report</button>
                        <button onClick={() => { onOpenAbout(); setMobileMenuOpen(false); }} className="text-left py-2 hover:text-primary-500 transition-colors">Data</button>
                        <button onClick={() => { onOpenAbout(); setMobileMenuOpen(false); }} className="text-left py-2 hover:text-primary-500 transition-colors">About</button>

                        <div className="h-px bg-white/10 my-4"></div>

                        <button
                            onClick={() => { toggleTheme(); }}
                            className="flex items-center gap-4 text-left py-2 hover:text-primary-500 transition-colors"
                        >
                            {/* Icon */}
                            <div className="p-2 rounded-full bg-white/5 border border-white/10">
                                <Sun className="w-6 h-6 text-yellow-400 hidden dark:block" />
                                <Moon className="w-6 h-6 text-blue-300 block dark:hidden" />
                            </div>
                            <span className="text-xl font-medium text-gray-300">Switch Theme</span>
                        </button>
                    </div>
                </div>
            )}
        </>
    )
};

export default NavBar;
