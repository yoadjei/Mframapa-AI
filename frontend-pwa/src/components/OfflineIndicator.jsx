import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBackOnline, setShowBackOnline] = useState(false);

  useEffect(() => {
    const handleOffline = () => {
      setIsOnline(false);
      setShowBackOnline(false);
    };

    const handleOnline = () => {
      setIsOnline(true);
      setShowBackOnline(true);
      const timer = setTimeout(() => setShowBackOnline(false), 3000);
      return () => clearTimeout(timer);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  if (isOnline && !showBackOnline) return null;

  if (showBackOnline) {
    return (
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] transition-all duration-300 animate-in slide-in-from-bottom-4">
        <div className="flex items-center gap-2 px-5 py-3 rounded-2xl shadow-lg bg-emerald-500 dark:bg-emerald-600 text-white font-medium text-sm">
          <Wifi className="h-4 w-4 shrink-0" />
          <span>Back online</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] transition-all duration-300">
      <div className="flex items-center justify-center gap-2 px-4 py-3 bg-amber-400 dark:bg-amber-500 text-amber-900 dark:text-amber-950 font-medium text-sm shadow-lg">
        <WifiOff className="h-4 w-4 shrink-0" />
        <span>You're offline — showing cached data</span>
      </div>
    </div>
  );
}
