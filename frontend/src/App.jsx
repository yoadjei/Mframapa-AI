import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { MapPin, Activity, Search, AlertTriangle, CloudRain, Info, Share2, Globe, Zap } from 'lucide-react';
import Map, { Marker, NavigationControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Using Real Token
const MAPBOX_TOKEN = "pk.eyJ1IjoieW9hZGplaSIsImEiOiJjbWprcjI4b3QyNHBpM2Nxem4xM2VwNWF4In0.z6NbrlGRmQdT-vlYk5bjMw";

function App() {
  const [viewState, setViewState] = useState({
    longitude: 18.0, // Center over Africa roughly
    latitude: 5.0,
    zoom: 1.8,       // Globe view level
    bearing: 0,
    pitch: 0
  });

  const [searchCity, setSearchCity] = useState('');
  const [locationData, setLocationData] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [appMode, setAppMode] = useState('landing'); // 'landing' | 'monitoring'
  const mapRef = useRef(null);

  // Auto-rotate globe in landing mode
  useEffect(() => {
    if (appMode !== 'landing') return;
    const interval = setInterval(() => {
      setViewState(prev => ({
        ...prev,
        longitude: prev.longitude + 0.05
      }));
    }, 50);
    return () => clearInterval(interval);
  }, [appMode]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchCity) return;
    setLoading(true);
    setError(null);
    setPrediction(null);

    try {
      // 1. Resolve Location
      const locRes = await axios.get(`/api/resolve-location?city=${searchCity}`);
      setLocationData(locRes.data);

      // 2. Transition to Monitoring Mode
      setAppMode('monitoring');

      // 3. Cinematic Fly-To
      if (mapRef.current) {
        mapRef.current.flyTo({
          center: [locRes.data.lon, locRes.data.lat],
          zoom: 12.5,     // Closer street view
          duration: 6000, // Cinematic 6s flight
          pitch: 55,      // Steep 3D angle
          bearing: -20,   // Slight rotation
          essential: true
        });
      }

      // 4. Get AI Prediction
      const predRes = await axios.get(`/api/predict`, {
        params: { lat: locRes.data.lat, lon: locRes.data.lon, name: locRes.data.name }
      });
      setPrediction(predRes.data);

    } catch (err) {
      setError(err.response?.data?.detail || "Could not locate city. Try 'Accra' or 'Lagos'.");
    } finally {
      setLoading(false);
    }
  };

  const shareOnWhatsApp = () => {
    if (!prediction) return;
    const text = `🌍 *Mframapa AI Report* \n📍 Location: ${prediction.location.name} \n💨 PM2.5 Level: ${prediction.pm25} (${prediction.aqi_category}) \n\nCheck your area now!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="h-screen w-full flex flex-col bg-gray-900 text-white overflow-hidden font-sans relative selection:bg-accent-500/30">

      {/* Background Atmosphere (CSS) */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-800 via-gray-900 to-black pointer-events-none z-0"></div>

      {/* --- LAYER 1: 3D MAP --- */}
      <div className="absolute inset-0 z-0">
        <Map
          ref={mapRef}
          {...viewState}
          onMove={evt => setViewState(evt.viewState)}
          style={{ width: '100%', height: '100%' }}
          mapStyle="mapbox://styles/mapbox/dark-v11"
          mapboxAccessToken={MAPBOX_TOKEN}
          projection="globe" // <--- THE MAGIC LINE
          fog={{
            "range": [0.5, 10],
            "color": "#1f2937", // Matching gray-800
            "horizon-blend": 0.1,
            "star-intensity": 0.6 // Cinematic Stars
          }}
          terrain={{ source: 'mapbox-dem', exaggeration: 1.5 }}
        >
          {locationData && (
            <Marker longitude={locationData.lon} latitude={locationData.lat} anchor="bottom">
              <div className="relative group">
                <MapPin className="h-12 w-12 text-accent-500 drop-shadow-[0_0_20px_rgba(34,197,94,0.8)] animate-bounce" />
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-6 h-2 bg-accent-500/50 blur-md rounded-full"></div>
              </div>
            </Marker>
          )}
        </Map>
      </div>

      {/* --- LAYER 2: ORBITAL LANDING UI --- */}
      {appMode === 'landing' && (
        <div className="relative z-10 flex flex-col items-center justify-center h-full pointer-events-none">
          <div className="pointer-events-auto text-center space-y-8 animate-in fade-in zoom-in duration-1000">

            {/* Hero Text */}
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Globe className="w-12 h-12 text-accent-400 animate-pulse-slow" />
                <span className="px-3 py-1 rounded-full border border-accent-500/30 bg-accent-500/10 text-accent-400 text-xs font-bold tracking-widest uppercase shadow-[0_0_15px_rgba(34,197,94,0.2)]">
                  Sentinel System Online
                </span>
              </div>
              <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 drop-shadow-2xl">
                Mframapa<span className="text-accent-500">.AI</span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-400 font-light tracking-wide">
                Environmental Intelligence for <span className="text-white font-medium">Africa</span>
              </p>
            </div>

            {/* Central Command Search */}
            <form onSubmit={handleSearch} className="relative w-full max-w-lg mx-auto transform transition-all hover:scale-105">
              <input
                type="text"
                placeholder="Enter city (e.g. Accra, Lagos, Nairobi)..."
                className="w-full pl-6 pr-16 py-5 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full text-lg text-white placeholder-gray-400 shadow-2xl focus:outline-none focus:ring-2 focus:ring-accent-500/50 transition-all"
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                autoFocus
              />
              <button
                type="submit"
                disabled={loading}
                className="absolute right-2 top-2 bottom-2 aspect-square rounded-full bg-accent-500 hover:bg-accent-400 text-black flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(34,197,94,0.4)]"
              >
                {loading ? <Activity className="animate-spin w-6 h-6" /> : <Search className="w-6 h-6" />}
              </button>
            </form>

            <div className="grid grid-cols-3 gap-8 pt-8 opacity-60">
              <div className="flex flex-col items-center gap-2">
                <CloudRain className="w-6 h-6 text-blue-400" />
                <span className="text-xs font-mono uppercase">Atmosphere</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Zap className="w-6 h-6 text-yellow-400" />
                <span className="text-xs font-mono uppercase">Real-Time</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Globe className="w-6 h-6 text-green-400" />
                <span className="text-xs font-mono uppercase">Global</span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* --- LAYER 3: MONITORING HUD --- */}
      {appMode === 'monitoring' && (
        <>
          {/* Top Bar (Search Relocated) */}
          <div className="absolute top-0 left-0 right-0 p-6 z-20 flex justify-between items-start pointer-events-none">

            {/* Brand */}
            <div className="pointer-events-auto glass px-6 py-3 rounded-2xl flex items-center gap-3 cursor-pointer hover:bg-white/5 transition-colors" onClick={() => setAppMode('landing')}>
              <CloudRain className="text-accent-400 h-6 w-6" />
              <span className="font-bold text-xl tracking-tight">Mframapa</span>
            </div>

            {/* Quick Search */}
            <form onSubmit={handleSearch} className="pointer-events-auto glass rounded-2xl p-1.5 flex gap-2 animate-in slide-in-from-top-10 duration-700">
              <input
                type="text"
                placeholder="Search another city..."
                className="bg-transparent border-none focus:outline-none text-white px-4 py-2 w-64 text-sm font-medium"
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
              />
              <button type="submit" className="bg-gray-800 hover:bg-gray-700 p-2 rounded-xl text-accent-400 transition-colors">
                <Search className="w-4 h-4" />
              </button>
            </form>

          </div>

          {/* Results Panel */}
          {prediction && (
            <div className="absolute top-28 right-6 w-full max-w-md z-20 animate-in slide-in-from-right-20 duration-500 pointer-events-none">
              <div className="pointer-events-auto glass rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative group">

                {/* Scanner Line Effect */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-accent-500/50 to-transparent opacity-0 group-hover:opacity-100 animate-scan"></div>

                {/* Header Section */}
                <div className="p-8 bg-gradient-to-br from-gray-900/80 to-black/80">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 text-accent-400 mb-2">
                        <MapPin className="w-4 h-4" />
                        <span className="text-xs font-bold tracking-widest uppercase">{prediction.location.name}</span>
                      </div>
                      <h2 className="text-4xl font-black text-white leading-none">{prediction.aqi_category}</h2>
                    </div>
                    {/* Share Button */}
                    <button
                      onClick={shareOnWhatsApp}
                      className="p-3 rounded-full bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white transition-all border border-green-500/30 flex items-center gap-2 group/btn"
                    >
                      <Share2 className="w-5 h-5" />
                      <span className="w-0 overflow-hidden group-hover/btn:w-12 transition-all duration-300 text-xs font-bold whitespace-nowrap">Share</span>
                    </button>
                  </div>

                  {/* Big Number */}
                  <div className="mt-8 flex items-baseline gap-4">
                    <span className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                      {prediction.pm25}
                    </span>
                    <div className="flex flex-col">
                      <span className="text-gray-400 font-bold">PM2.5</span>
                      <span className="text-xs text-gray-600">µg/m³</span>
                    </div>
                  </div>
                </div>

                {/* Factors Grid */}
                <div className="p-6 grid grid-cols-2 gap-4 bg-black/40 backdrop-blur-md">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-accent-500/30 transition-colors">
                    <div className="flex items-center gap-2 text-gray-400 mb-2">
                      <Zap className="w-4 h-4" />
                      <span className="text-xs font-medium">NO₂ Level</span>
                    </div>
                    <span className="text-xl font-bold text-white">{prediction.factors.satellite_no2}</span>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-accent-500/30 transition-colors">
                    <div className="flex items-center gap-2 text-gray-400 mb-2">
                      <CloudRain className="w-4 h-4" />
                      <span className="text-xs font-medium">Dust (AOD)</span>
                    </div>
                    <span className="text-xl font-bold text-white">{prediction.factors.satellite_aod}</span>
                  </div>
                </div>

                {/* AI Insight */}
                <div className="p-6 border-t border-white/5 bg-gray-900/50">
                  <div className="flex gap-4">
                    <div className="min-w-[4px] bg-accent-500 rounded-full"></div>
                    <div>
                      <h4 className="text-sm font-bold text-accent-400 mb-1 flex items-center gap-2">
                        <Info className="w-4 h-4" /> Health Insight
                      </h4>
                      <p className="text-sm text-gray-300 leading-relaxed opacity-80">
                        {prediction.pm25 > 35
                          ? "Air quality is degraded. Signatures suggest elevated urban pollution. Recommended to wear masks particularly in high traffic zones."
                          : "Air quality is excellent. Satellite telemetry confirms clear atmospheric conditions. Perfect for outdoor activities."}
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}
        </>
      )}

      {/* Global Error Toast */}
      {error && (
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5">
          <div className="bg-red-500/90 backdrop-blur-xl text-white px-6 py-4 rounded-2xl shadow-[0_0_30px_rgba(239,68,68,0.4)] flex items-center gap-4 border border-red-400/50">
            <AlertTriangle className="h-6 w-6" />
            <span className="font-semibold tracking-wide">{error}</span>
            <button onClick={() => setError(null)} className="opacity-50 hover:opacity-100 transition">✕</button>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
