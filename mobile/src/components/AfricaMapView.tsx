import React, { useMemo, useRef } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { City } from '../store/useStore';
import { MAPBOX_TOKEN } from '../utils/constants';

export type MapPressEvent = { lat: number; lon: number };

interface AfricaMapViewProps {
  cities: City[];
  isDark: boolean;
  liteMode?: boolean;
  selectedCity?: City | null;
  onMapPress: (event: MapPressEvent) => void;
  flyTo?: { lat: number; lon: number; zoom?: number } | null;
}

function buildMapHtml(
  token: string,
  cities: City[],
  isDark: boolean,
  liteMode: boolean,
  selected?: City | null
): string {
  const markerLimit = liteMode ? 40 : Math.min(cities.length, 500);
  const markers = cities.slice(0, markerLimit);
  const style = isDark ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11';
  const selectedJson = selected
    ? JSON.stringify({ lat: selected.lat, lon: selected.lon, name: selected.name })
    : 'null';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <link href="https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.css" rel="stylesheet" />
  <script src="https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; background: #0b1220; }
    .city-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: rgba(52, 211, 153, 0.92);
      box-shadow: 0 0 18px rgba(16, 185, 129, 0.75);
      cursor: pointer;
    }
    .selected-pin {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: #fff;
      border: 3px solid #34d399;
      box-shadow: 0 0 14px rgba(255,255,255,0.6);
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    mapboxgl.accessToken = ${JSON.stringify(token)};
    const cities = ${JSON.stringify(markers)};
    const selected = ${selectedJson};

    const map = new mapboxgl.Map({
      container: 'map',
      style: ${JSON.stringify(style)},
      center: [17.5, 4.5],
      zoom: 2.2,
      pitch: 22,
      projection: 'globe',
      attributionControl: false,
    });

    map.on('load', () => {
      map.setFog({
        range: [0.5, 10],
        color: ${isDark ? "'#0b1220'" : "'#eff6ff'"},
        'horizon-blend': 0.2,
      });
      cities.forEach((city) => {
        const el = document.createElement('div');
        el.className = 'city-dot';
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'cityPress',
            lat: city.lat,
            lon: city.lon,
            name: city.name,
          }));
        });
        new mapboxgl.Marker({ element: el, anchor: 'center' })
          .setLngLat([city.lon, city.lat])
          .addTo(map);
      });
      if (selected) {
        const pin = document.createElement('div');
        pin.className = 'selected-pin';
        new mapboxgl.Marker({ element: pin, anchor: 'center' })
          .setLngLat([selected.lon, selected.lat])
          .addTo(map);
        map.flyTo({ center: [selected.lon, selected.lat], zoom: 11.5, pitch: 40, duration: 1200 });
      }
    });

    map.on('click', (e) => {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'mapPress',
        lat: e.lngLat.lat,
        lon: e.lngLat.lng,
      }));
    });

    window.flyToCoords = (lat, lon, zoom) => {
      map.flyTo({ center: [lon, lat], zoom: zoom || 11.5, pitch: 40, duration: 1200 });
    };
  </script>
</body>
</html>`;
}

export function AfricaMapView({
  cities,
  isDark,
  liteMode = false,
  selectedCity,
  onMapPress,
  flyTo,
}: AfricaMapViewProps) {
  const webRef = useRef<WebView>(null);

  const html = useMemo(
    () => buildMapHtml(MAPBOX_TOKEN, cities, isDark, liteMode, selectedCity),
    [cities, isDark, liteMode, selectedCity?.lat, selectedCity?.lon]
  );

  React.useEffect(() => {
    if (flyTo && webRef.current) {
      webRef.current.injectJavaScript(
        `window.flyToCoords(${flyTo.lat}, ${flyTo.lon}, ${flyTo.zoom ?? 11.5}); true;`
      );
    }
  }, [flyTo?.lat, flyTo?.lon, flyTo?.zoom]);

  function onMessage(event: WebViewMessageEvent) {
    try {
      const data = JSON.parse(event.nativeEvent.data) as {
        type: string;
        lat: number;
        lon: number;
        name?: string;
      };
      if (data.type === 'mapPress' || data.type === 'cityPress') {
        onMapPress({ lat: data.lat, lon: data.lon });
      }
    } catch {
      // ignore malformed messages
    }
  }

  if (!MAPBOX_TOKEN) {
    return (
      <View style={styles.fallback}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <WebView
      ref={webRef}
      source={{ html }}
      style={styles.webview}
      onMessage={onMessage}
      originWhitelist={['*']}
      scrollEnabled={false}
      javaScriptEnabled
      domStorageEnabled
      setSupportMultipleWindows={false}
    />
  );
}

const styles = StyleSheet.create({
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
