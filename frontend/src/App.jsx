import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { AlertTriangle } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';
import NavBar from './components/NavBar';
import HeroSection from './components/HeroSection';
import MapContainer from './components/MapContainer';
import PredictionCard from './components/PredictionCard';
import DataPanel from './components/DataPanel';
import AboutModal from './components/AboutModal';
import ReportModal from './components/ReportModal';
import SearchBar from './components/SearchBar';

const AFRICAN_COUNTRY_CODES = [
  'dz', 'ao', 'bj', 'bw', 'bf', 'bi', 'cm', 'cv', 'cf', 'td', 'km', 'cg', 'cd', 'ci',
  'dj', 'eg', 'gq', 'er', 'sz', 'et', 'ga', 'gm', 'gh', 'gn', 'gw', 'ke', 'ls', 'lr',
  'ly', 'mg', 'mw', 'ml', 'mr', 'mu', 'ma', 'mz', 'na', 'ne', 'ng', 'rw', 'st', 'sn',
  'sc', 'sl', 'so', 'za', 'ss', 'sd', 'tz', 'tg', 'tn', 'ug', 'zm', 'zw'
];

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
  const [showReport, setShowReport] = useState(false);
  const [isDark, setIsDark] = useState(true);
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
        longitude: prev.longitude + 0.02
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

  const handleResetView = () => {
    setAppMode('monitoring');
    setLocationData(null);
    setPrediction(null);
    setError(null);

    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [18.0, 5.0],
        zoom: 3,
        duration: 2000,
        pitch: 45
      });
    }
  };

  const isLocationInAfrica = (lon, lat) => {
    return (
      lon >= -26 && lon <= 60 &&
      lat >= -38 && lat <= 38
    );
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
          // Add bbox parameter to prioritize Africa
          const mapboxRes = await axios.get(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(city)}.json?access_token=${token}&limit=1`);

          if (mapboxRes.data.features && mapboxRes.data.features.length > 0) {
            const feature = mapboxRes.data.features[0];
            const [lon, lat] = feature.center;

            if (!isLocationInAfrica(lon, lat)) {
              throw new Error("Sorry, Mframapa AI only covers African nations.");
            }

            locationResult = {
              lat: lat,
              lon: lon,
              name: feature.place_name,
              is_africa: true
            };
          }
        } catch (mapboxErr) {
          // Forward the specific Africa error if it was thrown above
          if (mapboxErr.message.includes("African nations")) {
            throw mapboxErr;
          }
          console.error("Mapbox geocoding failed", mapboxErr);
        }
      }

      // If still no location, ensure we don't show a random one unless it's a hard error
      if (!locationResult) {
        throw new Error("City not found or outside coverage.");
      }

      setLocationData(locationResult);

      // 2. Cinematic Fly-To
      if (mapRef.current) {
        mapRef.current.flyTo({
          center: [locationResult.lon, locationResult.lat],
          zoom: 15.5,
          duration: 1500,
          pitch: 60,
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
      }, 200);

    } catch (err) {
      console.error(err);
      setError(err.message || "Could not locate city. Please try again.");
      setLoading(false);
    }
  };

  const handleMapClick = async ({ lngLat, zoomLevel, city }) => {
    // If in landing mode, switch to monitoring
    if (appMode === 'landing') {
      setAppMode('monitoring');
    }

    // Clear previous states
    setError(null);
    setPrediction(null);
    setLoading(true);

    const { lng, lat } = lngLat;

    // Direct City Selection (No Geocoding needed)
    if (city) {
      const newLocation = {
        lat: city.lat,
        lon: city.lon,
        name: city.name,
        is_africa: true
      };
      setLocationData(newLocation);

      if (mapRef.current) {
        mapRef.current.flyTo({
          center: [city.lon, city.lat],
          zoom: zoomLevel || 15,
          duration: 1500,
          pitch: 60,
          bearing: -20,
          essential: true
        });
      }

      const mockPred = {
        location: newLocation,
        pm25: Math.floor(Math.random() * 60) + 8,
        aqi_category: "Moderate",
        factors: { satellite_no2: "Low", satellite_aod: (Math.random()).toFixed(2) },
        timestamp: new Date().toISOString(),
        weather: {
          humidity: Math.floor(Math.random() * (85 - 45) + 45),
          temp: Math.floor(Math.random() * (34 - 22) + 22),
          pressure: Math.floor(Math.random() * (1016 - 1005) + 1005),
          wind: Math.floor(Math.random() * 18) + 3
        }
      };

      if (mockPred.pm25 <= 12) mockPred.aqi_category = "Good";
      else if (mockPred.pm25 <= 35) mockPred.aqi_category = "Moderate";
      else if (mockPred.pm25 <= 55) mockPred.aqi_category = "Sensitive";
      else mockPred.aqi_category = "Unhealthy";

      setTimeout(() => {
        setPrediction(mockPred);
        setLoading(false);
      }, 500);
      return;
    }

    try {
      const token = "pk.eyJ1IjoieW9hZGplaSIsImEiOiJjbWprcjI4b3QyNHBpM2Nxem4xM2VwNWF4In0.z6NbrlGRmQdT-vlYk5bjMw";
      // Fetch most specific location (no types filter)
      const mapboxRes = await axios.get(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}&limit=1`);

      if (!mapboxRes.data.features || mapboxRes.data.features.length === 0) {
        throw new Error("Location not found. Please click on a land mass.");
      }

      const feature = mapboxRes.data.features[0];

      // Validate Country Code
      let isAfrica = false;
      const selfCode = feature.id.startsWith('country.') ? feature.properties?.short_code : null;
      const contextCode = feature.context?.find(c => c.id.startsWith('country.'))?.short_code;
      const codeToCheck = selfCode || contextCode;

      if (codeToCheck && AFRICAN_COUNTRY_CODES.includes(codeToCheck.toLowerCase())) {
        isAfrica = true;
      }

      if (!isAfrica) {
        throw new Error("Sorry, we currently only support locations within Africa.");
      }

      // Use specific place name
      const locationName = feature.place_name;

      const newLocation = {
        lat,
        lon: lng,
        name: locationName,
        is_africa: true
      };
      setLocationData(newLocation);

      // Fly to location
      if (mapRef.current) {
        mapRef.current.flyTo({
          center: [lng, lat],
          zoom: zoomLevel || 17,
          duration: 1500,
          pitch: 60,
          bearing: -20,
          essential: true
        });
      }

      // Mock Prediction
      const mockPred = {
        location: newLocation,
        pm25: Math.floor(Math.random() * 60) + 8,
        aqi_category: "Moderate",
        factors: { satellite_no2: "Low", satellite_aod: (Math.random()).toFixed(2) },
        timestamp: new Date().toISOString(),
        weather: {
          humidity: Math.floor(Math.random() * (85 - 45) + 45),
          temp: Math.floor(Math.random() * (34 - 22) + 22),
          pressure: Math.floor(Math.random() * (1016 - 1005) + 1005),
          wind: Math.floor(Math.random() * 18) + 3
        }
      };

      if (mockPred.pm25 <= 12) mockPred.aqi_category = "Good";
      else if (mockPred.pm25 <= 35) mockPred.aqi_category = "Moderate";
      else if (mockPred.pm25 <= 55) mockPred.aqi_category = "Sensitive";
      else mockPred.aqi_category = "Unhealthy";

      setTimeout(() => {
        setPrediction(mockPred);
        setLoading(false);
      }, 500);

    } catch (e) {
      console.warn("Map Click Error:", e);
      setError(e.message || "Could not retrieve location. Please try again.");
      setLoading(false);
    }
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { longitude, latitude } = position.coords;
        // Reuse handleMapClick logic by simulating call with deeper zoom
        handleMapClick({ lngLat: { lng: longitude, lat: latitude }, zoomLevel: 17 });
      },
      (err) => {
        console.error(err);
        setError("Unable to retrieve your location");
        setLoading(false);
      }
    );
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
        onClick={handleMapClick}
      />

      {/* --- LAYER 2: UI OVERLAYS --- */}
      <NavBar
        setAppMode={setAppMode}
        appMode={appMode}
        onOpenAbout={() => setShowAbout(true)}
        onOpenReport={() => setShowReport(true)}
        isDark={isDark}
        toggleTheme={toggleTheme}
        onReset={handleResetView}
      />

      {/* Landing Mode */}
      {appMode === 'landing' && (
        <HeroSection onStart={handleStart} />
      )}

      {/* Monitoring Mode UI */}
      {appMode === 'monitoring' && (
        <>
          <SearchBar
            onSearch={handleSearch}
            onLocate={handleLocateMe}
            isSearching={loading}
            initialQuery={locationData && locationData.name ? locationData.name : ''}
          />
          <PredictionCard prediction={prediction} onClose={() => setPrediction(null)} />
          <DataPanel />
        </>
      )}

      {/* Modals */}
      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
      {showReport && <ReportModal onClose={() => setShowReport(false)} />}

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
