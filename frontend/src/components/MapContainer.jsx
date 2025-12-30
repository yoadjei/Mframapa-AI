import React, { useMemo } from 'react';
import Map, { Marker, Layer, Source } from 'react-map-gl';
import { MapPin } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = "pk.eyJ1IjoieW9hZGplaSIsImEiOiJjbWprcjI4b3QyNHBpM2Nxem4xM2VwNWF4In0.z6NbrlGRmQdT-vlYk5bjMw";

const MapContainer = ({ viewState, onMove, mapRef, locationData, isDark }) => {

    // Generate "Virtual Network" Data
    const { stations, arcs } = useMemo(() => {
        const points = [];
        const arcFeatures = [];
        const count = 40;

        // Bounds for Africa approximations
        const minLon = -15, maxLon = 45;
        const minLat = -30, maxLat = 30;

        // Generate Points
        for (let i = 0; i < count; i++) {
            points.push({
                id: i,
                lon: minLon + Math.random() * (maxLon - minLon),
                lat: minLat + Math.random() * (maxLat - minLat),
                delay: Math.random() * 2
            });
        }

        // Generate Connecting Arcs (Simple geodesics)
        for (let i = 0; i < count - 1; i++) {
            if (Math.random() > 0.7) { // Only connect some
                arcFeatures.push({
                    type: 'Feature',
                    geometry: {
                        type: 'LineString',
                        coordinates: [
                            [points[i].lon, points[i].lat],
                            [points[i + 1].lon, points[i + 1].lat]
                        ]
                    }
                });
            }
        }

        return { stations: points, arcs: { type: 'FeatureCollection', features: arcFeatures } };
    }, []);

    return (
        <div className="absolute inset-0 z-0 bg-gray-50 dark:bg-gray-900">
            <Map
                ref={mapRef}
                {...viewState}
                onMove={onMove}
                style={{ width: '100%', height: '100%' }}
                mapStyle={isDark ? "mapbox://styles/mapbox/dark-v11" : "mapbox://styles/mapbox/light-v11"}
                mapboxAccessToken={MAPBOX_TOKEN}
                projection="globe"
                fog={{
                    "range": [0.5, 10],
                    "color": isDark ? "#0A0F1C" : "#eff6ff", // Deep Space vs Blue-50
                    "horizon-blend": 0.2,
                    "high-color": isDark ? "#1e293b" : "#bfdbfe",
                    "space-color": isDark ? "#000000" : "#dbeafe",
                    "star-intensity": isDark ? 0.8 : 0.0
                }}
                terrain={{ source: 'mapbox-dem', exaggeration: 1.5 }}
            >
                {/* Network Connections Layer */}
                <Source id="arcs" type="geojson" data={arcs}>
                    <Layer
                        id="arc-layer"
                        type="line"
                        paint={{
                            'line-color': '#00FFB3',
                            'line-width': 1,
                            'line-opacity': 0.2,
                            'line-blur': 1
                        }}
                    />
                </Source>

                {/* Active Search Marker */}
                {locationData && (
                    <Marker longitude={locationData.lon} latitude={locationData.lat} anchor="bottom">
                        <div className="relative group">
                            <MapPin className="h-12 w-12 text-primary-500 drop-shadow-[0_0_20px_rgba(34,197,94,0.8)] animate-bounce" />
                            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-6 h-2 bg-primary-500/50 blur-md rounded-full"></div>
                        </div>
                    </Marker>
                )}

                {/* Virtual Stations (Pulsing Nodes) */}
                {!locationData && stations.map(station => (
                    <Marker key={station.id} longitude={station.lon} latitude={station.lat} anchor="center">
                        <div className="relative">
                            <div
                                className="w-1.5 h-1.5 bg-primary-400 rounded-full shadow-[0_0_8px_#00FFB3]"
                            ></div>
                            <div
                                className="absolute inset-0 bg-primary-500 rounded-full animate-ping opacity-40"
                                style={{ animationDelay: `${station.delay}s`, animationDuration: '3s' }}
                            ></div>
                        </div>
                    </Marker>
                ))}
            </Map>
        </div>
    );
};

export default MapContainer;
