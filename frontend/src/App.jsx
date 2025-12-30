import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { AlertTriangle } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';

// Components
import NavBar from './components/NavBar';
import HeroSection from './components/HeroSection';
import MapContainer from './components/MapContainer';
import PredictionCard from './components/PredictionCard';
import DataPanel from './components/DataPanel';
import AboutModal from './components/AboutModal';
import SearchBar from './components/SearchBar';

function App() {
  const [viewState, setViewState] = useState({
    longitude: 18.0,
    latitude: 5.0,
    zoom: 1.8,
    bearing: 0,
    pitch: 0
  });

  const [locationData, setLocationData] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [appMode, setAppMode] = useState('landing'); // 'landing' | 'monitoring'
  const [showAbout, setShowAbout] = useState(false);
  const [isDark, setIsDark] = useState(true); // Default to Dark Mode
  const mapRef = useRef(null);

  // Sync theme with HTML class
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  // Auto-rotate globe in landing mode
  useEffect(() => {
    if (appMode !== 'landing') return;
    const interval = setInterval(() => {
      setViewState(prev => ({
        ...prev,
        longitude: prev.longitude + 0.02 // Slower rotation
      }));
    }, 50);
    return () => clearInterval(interval);
  }, [appMode]);

  const handleStart = () => {
    setAppMode('monitoring');
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [18.0, 5.0],
        zoom: 3,
        duration: 2000,
        pitch: 45
      });
    }
  };

  const handleSearch = async (city) => {
    setLoading(true);
    setError(null);
    setPrediction(null);

    // If searching from hero, switch mode first
    if (appMode === 'landing') {
      setAppMode('monitoring');
    }

    try {
      let locationResult = null;

      // 1. Resolve Location
      // Priority 1: Backend API
      try {
        const realRes = await axios.get(`/api/resolve-location?city=${city}`);
        locationResult = realRes.data;
      } catch (e) {
        console.warn("Backend unreachable, trying Mapbox Geocoding directly");

        // Priority 2: Mapbox Geocoding API (Frontend Fallback)
        try {
          const token = "pk.eyJ1IjoieW9hZGplaSIsImEiOiJjbWprcjI4b3QyNHBpM2Nxem4xM2VwNWF4In0.z6NbrlGRmQdT-vlYk5bjMw";
          const mapboxRes = await axios.get(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(city)}.json?access_token=${token}&limit=1`);

          if (mapboxRes.data.features && mapboxRes.data.features.length > 0) {
            const feature = mapboxRes.data.features[0];
            locationResult = {
              lat: feature.center[1],
              lon: feature.center[0],
              name: feature.place_name,
              is_africa: true
            };
          }
        } catch (mapboxErr) {
          console.error("Mapbox geocoding failed", mapboxErr);
        }
      }

      // If still no location, ensure we don't show a random one unless it's a hard error
      if (!locationResult) {
        throw new Error("City not found");
      }

      setLocationData(locationResult);

      // 2. Cinematic Fly-To
      if (mapRef.current) {
        mapRef.current.flyTo({
          center: [locationResult.lon, locationResult.lat],
          zoom: 12.5,
          duration: 4000,
          pitch: 55,
          bearing: -20,
          essential: true
        });
      }

      // 3. Get AI Prediction
      // const predRes = await axios.get(`/api/predict`, { params: ... });
      // Mocking for UI demo (Randomized data)
      const mockPred = {
        location: locationResult,
        pm25: Math.floor(Math.random() * 60) + 10,
        aqi_category: "Moderate",
        factors: { satellite_no2: "Low", satellite_aod: "0.42" },
        timestamp: new Date().toISOString()
      };

      // Update Category/Color based on PM2.5
      if (mockPred.pm25 <= 12) mockPred.aqi_category = "Good";
      else if (mockPred.pm25 <= 35) mockPred.aqi_category = "Moderate";
      else if (mockPred.pm25 <= 55) mockPred.aqi_category = "Unhealthy for Sensitive Groups";
      else mockPred.aqi_category = "Unhealthy";

      setTimeout(() => {
        setPrediction(mockPred);
        setLoading(false);
      }, 1500);

    } catch (err) {
      console.error(err);
      setError("Could not locate city. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex flex-col bg-gray-50 dark:bg-background text-gray-900 dark:text-white overflow-hidden font-sans relative selection:bg-primary-500/30">

      {/* Background Atmosphere - Dark Mode Only */}
      <div className="absolute inset-0 bg-nebula pointer-events-none z-0 opacity-0 dark:opacity-80"></div>

      {/* Light Mode Plain Background */}
      <div className="absolute inset-0 bg-gray-50 pointer-events-none z-0 opacity-100 dark:opacity-0"></div>

      {/* --- LAYER 1: 3D MAP --- */}
      <MapContainer
        viewState={viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapRef={mapRef}
        locationData={locationData}
        isDark={isDark}
      />

      {/* --- LAYER 2: UI OVERLAYS --- */}
      <NavBar
        setAppMode={setAppMode}
        appMode={appMode}
        onOpenAbout={() => setShowAbout(true)}
        isDark={isDark}
        toggleTheme={toggleTheme}
      />

      {/* Landing Mode */}
      {appMode === 'landing' && (
        <HeroSection onStart={handleStart} />
      )}

      {/* Monitoring Mode UI */}
      {appMode === 'monitoring' && (
        <>
          <SearchBar onSearch={handleSearch} isSearching={loading} />
          <PredictionCard prediction={prediction} onClose={() => setPrediction(null)} />
          <DataPanel />
        </>
      )}

      {/* Modals */}
      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}

      {/* Global Toast */}
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
