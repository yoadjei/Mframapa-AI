import React, { useMemo, useState } from 'react';
import Map, { Marker, Layer, Source } from 'react-map-gl';
import { MapPin } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';
import { africanCities } from '../data/africanCities';

const MAPBOX_TOKEN = "pk.eyJ1IjoieW9hZGplaSIsImEiOiJjbWprcjI4b3QyNHBpM2Nxem4xM2VwNWF4In0.z6NbrlGRmQdT-vlYk5bjMw";

const MapContainer = ({ viewState, onMove, mapRef, locationData, isDark, onClick }) => {
    const [cursor, setCursor] = useState('auto');

    // Generate "Virtual Network" Data
    const { stationsGeoJSON, arcs } = useMemo(() => {
        const points = africanCities.map((city, index) => ({
            ...city,
            id: index, // Ensure numeric ID for feature state if needed, though properties are easier
        }));

        const featureCollection = {
            type: 'FeatureCollection',
            features: points.map(p => ({
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [p.lon, p.lat] },
                properties: p
            }))
        };

        const arcFeatures = [];
        // Generate Connecting Arcs (Simple geodesics between random cities)
        for (let i = 0; i < points.length; i++) {
            // Connect to 1-2 other random points to create a web
            if (Math.random() > 0.8) {
                const targetIndex = Math.floor(Math.random() * points.length);
                if (targetIndex !== i) {
                    arcFeatures.push({
                        type: 'Feature',
                        geometry: {
                            type: 'LineString',
                            coordinates: [
                                [points[i].lon, points[i].lat],
                                [points[targetIndex].lon, points[targetIndex].lat]
                            ]
                        }
                    });
                }
            }
        }

        return { stationsGeoJSON: featureCollection, arcs: { type: 'FeatureCollection', features: arcFeatures } };
    }, []);

    const handleMapClick = (event) => {
        const feature = event.features && event.features[0];
        if (feature && feature.layer.id === 'station-points') {
            // Clicked a city dot
            const cityData = feature.properties;
            // Mapbox normalizes properties, need to ensure numbers are numbers if used for math, 
            // but for passing to App, the text fields are most important, and lat/lon are needed.
            // GeoJSON coordinates strictly used for location.
            const [lon, lat] = feature.geometry.coordinates;

            onClick({
                lngLat: { lng: lon, lat: lat },
                zoomLevel: 14,
                city: { ...cityData, lat, lon }
            });
        } else {
            // Background click
            onClick({ lngLat: event.lngLat });
        }
    };

    return (
        <div className="absolute inset-0 z-0 bg-gray-50 dark:bg-gray-900">
            <Map
                ref={mapRef}
                {...viewState}
                onMove={onMove}
                onClick={handleMapClick}
                onMouseEnter={(e) => {
                    if (e.features?.length > 0) setCursor('pointer');
                }}
                onMouseLeave={() => setCursor('auto')}
                interactiveLayerIds={!locationData ? ['station-points'] : []}
                cursor={cursor}
                style={{ width: '100%', height: '100%' }}
                mapStyle={isDark ? "mapbox://styles/mapbox/dark-v11" : "mapbox://styles/mapbox/light-v11"}
                mapboxAccessToken={MAPBOX_TOKEN}
                projection="globe"
                fog={{
                    "range": [0.5, 10],
                    "color": isDark ? "#0A0F1C" : "#eff6ff",
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

                {/* Virtual Stations (Optimized Layer) */}
                {!locationData && (
                    <Source id="stations-source" type="geojson" data={stationsGeoJSON}>
                        <Layer
                            id="station-points"
                            type="circle"
                            paint={{
                                'circle-radius': 5,
                                'circle-color': '#00FFB3',
                                'circle-opacity': 0.9,
                                'circle-stroke-width': 2,
                                'circle-stroke-color': '#00FFB3',
                                'circle-stroke-opacity': 0.3,
                                // Add a subtle pulse-like glow using halo
                                'circle-blur': 0.2
                            }}
                        />
                    </Source>
                )}

                {/* Active Search Marker */}
                {locationData && (
                    <Marker longitude={locationData.lon} latitude={locationData.lat} anchor="bottom">
                        <div className="relative group">
                            <MapPin className="h-12 w-12 text-gray-900 dark:text-white drop-shadow-2xl animate-bounce" />
                            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-6 h-2 bg-black/50 dark:bg-white/50 blur-md rounded-full"></div>
                        </div>
                    </Marker>
                )}
            </Map>
        </div>
    );
};

export default MapContainer;
