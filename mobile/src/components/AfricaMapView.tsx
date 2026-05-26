import React, { useMemo, useRef } from 'react';
import { StyleSheet, View, Text, Platform } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { City } from '../store/useStore';
import { MAPBOX_TOKEN } from '../utils/constants';
import { useTranslation } from '../hooks/useTranslation';
export type MapPressEvent = { lat: number; lon: number; name?: string; isWater?: boolean };

export type MapMarker = {
  name: string;
  lat: number;
  lon: number;
  /** 0–1 intensity for heatmap layer */
  weight?: number;
  /** Marker fill color (markers variant) */
  color?: string;
};

export type AfricaMapVariant = 'markers' | 'heatmap';

interface AfricaMapViewProps {
  cities?: City[];
  markers?: MapMarker[];
  variant?: AfricaMapVariant;
  isDark: boolean;
  liteMode?: boolean;
  selectedCity?: City | MapMarker | null;
  onMapPress: (event: MapPressEvent) => void;
  flyTo?: {
    lat: number;
    lon: number;
    zoom?: number;
    pitch?: number;
    /** Bumps when the same coords are requested again (e.g. re-tap locate). */
    key?: number;
    showUserMarker?: boolean;
  } | null;
}

function cityToMarker(city: City): MapMarker {
  return {
    name: city.name,
    lat: city.lat,
    lon: city.lon,
    color: '#34d399',
    weight: 0.35,
  };
}

function buildMapHtml(
  token: string,
  markers: MapMarker[],
  isDark: boolean,
  variant: AfricaMapVariant,
  selected?: MapMarker | null
): string {
  const style = isDark ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11';
  const selectedJson = selected
    ? JSON.stringify({ lat: selected.lat, lon: selected.lon, name: selected.name })
    : 'null';
  const heatFeatures = markers.map((m) => ({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [m.lon, m.lat] },
    properties: { weight: m.weight ?? 0.4 },
  }));

  const markerScript =
    variant === 'heatmap'
      ? `
    map.addSource('aqi-heat', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: ${JSON.stringify(heatFeatures)},
      },
    });
    map.addLayer({
      id: 'aqi-heat-layer',
      type: 'heatmap',
      source: 'aqi-heat',
      maxzoom: 9,
      paint: {
        'heatmap-weight': ['get', 'weight'],
        'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 9, 3],
        'heatmap-color': [
          'interpolate', ['linear'], ['heatmap-density'],
          0, 'rgba(0,200,150,0)',
          0.15, '#00C896',
          0.35, '#F5C518',
          0.55, '#FF8C00',
          0.75, '#E53935',
          1, '#9C27B0',
        ],
        'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 18, 9, 40],
        'heatmap-opacity': 0.88,
      },
    });`
      : `
    markers.forEach((city) => {
      const el = document.createElement('div');
      el.className = 'city-dot';
      el.style.background = city.color || 'rgba(52, 211, 153, 0.92)';
      el.style.boxShadow = '0 0 14px ' + (city.color || 'rgba(16, 185, 129, 0.75)');
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
    });`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <link href="https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.css" rel="stylesheet" />
  <script src="https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden;
      overscroll-behavior: none;
      touch-action: none;
      -webkit-user-select: none;
      user-select: none;
    }
    #map {
      width: 100%;
      height: 100%;
      background: #0b1220;
      touch-action: none;
    }
    .city-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
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
    .user-loc {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #3b82f6;
      border: 3px solid #fff;
      box-shadow: 0 0 0 6px rgba(59, 130, 246, 0.35), 0 2px 8px rgba(0,0,0,0.35);
    }
    .mapboxgl-ctrl-attrib { font-size: 10px; opacity: 0.65; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    mapboxgl.accessToken = ${JSON.stringify(token)};
    const markers = ${JSON.stringify(markers)};
    const selected = ${selectedJson};

    const map = new mapboxgl.Map({
      container: 'map',
      style: ${JSON.stringify(style)},
      center: [17.5, 4.5],
      zoom: ${variant === 'heatmap' ? 2.4 : 2.2},
      pitch: ${variant === 'heatmap' ? 0 : 22},
      projection: 'globe',
      attributionControl: true,
      minZoom: 1.2,
      maxZoom: 18,
      touchPitch: true,
      touchZoomRotate: true,
      dragPan: true,
      scrollZoom: true,
      boxZoom: false,
      cooperativeGestures: false,
    });

    map.touchZoomRotate.enable();
    map.dragPan.enable();
    map.scrollZoom.enable();
    map.doubleClickZoom.enable();

    map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-left');
    map.addControl(new mapboxgl.NavigationControl({ showCompass: true, visualizePitch: true }), 'top-right');

    let suppressTap = false;
    const armSuppressTap = () => { suppressTap = true; };
    const releaseSuppressTap = () => {
      setTimeout(() => { suppressTap = false; }, 80);
    };
    map.on('dragstart', armSuppressTap);
    map.on('zoomstart', armSuppressTap);
    map.on('rotatestart', armSuppressTap);
    map.on('dragend', releaseSuppressTap);
    map.on('zoomend', releaseSuppressTap);
    map.on('rotateend', releaseSuppressTap);

    map.on('load', () => {
      map.setFog({
        range: [0.5, 10],
        color: ${isDark ? "'#0b1220'" : "'#eff6ff'"},
        'horizon-blend': 0.2,
      });
      ${markerScript}
      if (selected && ${variant === 'markers' ? 'true' : 'false'}) {
        const pin = document.createElement('div');
        pin.className = 'selected-pin';
        new mapboxgl.Marker({ element: pin, anchor: 'center' })
          .setLngLat([selected.lon, selected.lat])
          .addTo(map);
        map.flyTo({ center: [selected.lon, selected.lat], zoom: 11.5, pitch: 40, duration: 1200 });
      }
    });

    map.on('click', (e) => {
      if (suppressTap) return;
      const waterFeatures = map.queryRenderedFeatures(e.point, { layers: ['water'] });
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'mapPress',
        lat: e.lngLat.lat,
        lon: e.lngLat.lng,
        isWater: waterFeatures.length > 0,
      }));
    });

    let userMarker = null;
    window.flyToCoords = (lat, lon, zoom, pitch, showUser) => {
      const run = () => {
        map.flyTo({
          center: [lon, lat],
          zoom: zoom ?? 15,
          pitch: pitch ?? 50,
          bearing: 0,
          duration: 1400,
          essential: true,
        });
        if (showUser) {
          if (userMarker) userMarker.remove();
          const el = document.createElement('div');
          el.className = 'user-loc';
          userMarker = new mapboxgl.Marker({ element: el, anchor: 'center' })
            .setLngLat([lon, lat])
            .addTo(map);
        }
      };
      if (map.loaded()) run();
      else map.once('load', run);
    };
  </script>
</body>
</html>`;
}

export function AfricaMapView({
  cities = [],
  markers: markersProp,
  variant = 'markers',
  isDark,
  liteMode = false,
  selectedCity,
  onMapPress,
  flyTo,
}: AfricaMapViewProps) {
  const webRef = useRef<WebView>(null);
  const { t } = useTranslation();

  const markers = useMemo(() => {
    if (markersProp?.length) return markersProp;
    const limit = liteMode ? 40 : Math.min(cities.length, 500);
    return cities.slice(0, limit).map(cityToMarker);
  }, [markersProp, cities, liteMode]);

  const selectedMarker = useMemo((): MapMarker | null => {
    if (!selectedCity) return null;
    if ('country' in selectedCity) {
      return cityToMarker(selectedCity);
    }
    return selectedCity;
  }, [selectedCity]);

  const html = useMemo(
    () => buildMapHtml(MAPBOX_TOKEN, markers, isDark, variant, selectedMarker),
    [markers, isDark, variant, selectedMarker?.lat, selectedMarker?.lon]
  );

  React.useEffect(() => {
    if (!flyTo || !webRef.current) return;
    const zoom = flyTo.zoom ?? 15;
    const pitch = flyTo.pitch ?? 50;
    const showUser = flyTo.showUserMarker ? 'true' : 'false';
    webRef.current.injectJavaScript(
      `window.flyToCoords(${flyTo.lat}, ${flyTo.lon}, ${zoom}, ${pitch}, ${showUser}); true;`
    );
  }, [flyTo?.lat, flyTo?.lon, flyTo?.zoom, flyTo?.pitch, flyTo?.key, flyTo?.showUserMarker]);

  function onMessage(event: WebViewMessageEvent) {
    try {
      const data = JSON.parse(event.nativeEvent.data) as {
        type: string;
        lat: number;
        lon: number;
        name?: string;
        isWater?: boolean;
      };
      if (data.type === 'mapPress' || data.type === 'cityPress') {
        onMapPress({ lat: data.lat, lon: data.lon, name: data.name, isWater: data.isWater });
      }
    } catch {
      // ignore malformed messages
    }
  }

  if (!MAPBOX_TOKEN) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackText}>{t('map.mapbox_token_required')}</Text>
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
      scrollEnabled
      bounces={false}
      overScrollMode="never"
      nestedScrollEnabled={Platform.OS === 'android'}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      allowsInlineMediaPlayback
      javaScriptEnabled
      domStorageEnabled
      setSupportMultipleWindows={false}
      androidLayerType="hardware"
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
    padding: 24,
  },
  fallbackText: {
    fontSize: 13,
    textAlign: 'center',
    opacity: 0.7,
  },
});
