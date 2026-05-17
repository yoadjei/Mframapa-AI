import { LEGAL_SECTIONS } from '../content/legal';

const base: Record<string, string> = {
  'app.name': 'Mframapa',

  'tab.home': 'Home',
  'tab.search': 'Search',
  'tab.map': 'Locations',
  'tab.alerts': 'Alerts',
  'tab.settings': 'Settings',

  'home.title': 'Mframapa',
  'home.subtitle': 'African Air Quality Intelligence',
  'home.locate': 'Use My Location',
  'home.tap_map': 'Search a city or tap the map to get air quality data',
  'home.loading': 'Fetching air quality data...',
  'home.track': 'Track the air around you',
  'home.empty_title': 'Check air quality instantly',
  'home.empty_sub': 'Use your location or search for any African city.',
  'home.action_check': 'Check now',
  'home.action_alerts': 'Alerts',
  'home.action_alerts_sub': 'Manage updates',
  'home.action_search_sub': 'Pick a city',

  'aqi.good': 'Good',
  'aqi.moderate': 'Moderate',
  'aqi.sensitive': 'Unhealthy for Sensitive Groups',
  'aqi.unhealthy': 'Unhealthy',
  'aqi.very_unhealthy': 'Very Unhealthy',
  'aqi.hazardous': 'Hazardous',

  'advice.good': 'Air quality is satisfactory. Enjoy outdoor activities.',
  'advice.moderate': 'Unusually sensitive people should consider reducing prolonged exertion.',
  'advice.sensitive': 'Sensitive groups should limit prolonged outdoor exertion.',
  'advice.unhealthy':
    'Everyone may experience health effects. Sensitive groups face serious risk.',
  'advice.very_unhealthy': 'Health alert: everyone may experience serious health effects.',
  'advice.hazardous': 'Everyone should avoid all outdoor activities.',

  'weather.temp': 'Temp',
  'weather.humidity': 'Humidity',
  'weather.wind': 'Wind',
  'weather.range': 'Range',

  'card.current_city': 'Current city',
  'card.pm25': 'PM2.5',
  'card.today': 'Today',
  'card.aqi_level': 'AQI level',
  'card.main_pollutant': 'Main pollutant',
  'card.weather_suffix': '{{temp}}°C weather',
  'card.insight_title': 'AI Insight',
  'card.factors_title': 'Contributing factors',
  'card.health_guidance': 'Health guidance',
  'card.model_prefix': 'Model: {{model}}',
  'card.meta': '{{city}} · {{day}}, {{time}}',

  'search.title': 'Search',
  'search.placeholder': 'Search African cities...',
  'search.locate': 'Use my location',
  'search.no_results': 'No cities found. Try a different name.',
  'search.recent': 'Recent searches',
  'search.searching': 'Searching…',

  'map.title': 'Map',
  'map.loading': 'Checking air quality…',
  'map.recent': 'Recent checks',
  'map.no_recent': 'No recent checks yet',
  'map.empty_tap': 'Tap a city to check air quality',

  'alerts.title': 'Notifications',
  'alerts.toggle_title': 'AQI notifications',
  'alerts.toggle_sub': 'Get alerted when air quality changes in the cities you follow.',
  'alerts.mark_all': 'Mark all read',
  'alerts.empty_title': 'No alerts yet',
  'alerts.empty_on': "You'll see incoming AQI alerts here.",
  'alerts.empty_off': 'Turn notifications on to receive AQI alerts.',
  'alerts.default_title': 'AQI Alert',

  'settings.title': 'Settings',
  'settings.theme': 'Theme',
  'settings.language': 'Language',
  'settings.select_language': 'Select language',
  'settings.dark': 'Dark',
  'settings.light': 'Light',
  'settings.system': 'System',
  'settings.about': 'About',
  'settings.appearance': 'Appearance',
  'settings.preferences': 'Preferences',
  'settings.notifications': 'Notifications',
  'settings.notifications_sub': 'Air quality alerts',
  'settings.privacy': 'Privacy mode',
  'settings.privacy_sub': 'Keep personal data hidden',
  'settings.lite': 'Lite mode',
  'settings.lite_sub': 'Fewer map markers, less data',
  'settings.sign_out': 'Sign out',
  'settings.made_with': 'Made with love for Africa',
  'settings.version': 'Version 2.0.0',
  'settings.about.privacy': 'Privacy Policy',
  'settings.about.terms': 'Terms of Service',
  'settings.about.licenses': 'Open Source Licenses',
  'settings.about.contact': 'Contact & Feedback',
  'settings.about.credits': 'Credits & Attribution',
  'settings.region.international': 'International',
  'settings.region.west_africa': 'West Africa',
  'settings.region.east_africa': 'East Africa',
  'settings.region.central_southern': 'Central & Southern Africa',

  'offline.banner': 'Offline',
  'offline.cached_data': 'You are offline — showing your last saved reading',

  'error.location': 'Could not get your location. Please enable location permissions.',
  'error.prediction': 'Failed to fetch air quality data. Please try again.',
  'error.network': 'Could not reach the server. Check your connection and try again.',
  'error.outside_africa': 'Sorry, Mframapa AI only covers African nations.',
  'error.cached_fallback': 'Showing your last saved reading.',
  'error.city_not_found': 'City not found in supported African cities',
  'error.location_permission': 'Location permission denied.',
  'error.location_unknown': 'Could not determine your location.',
};

const legal: Record<string, string> = {};
for (const section of LEGAL_SECTIONS) {
  legal[`legal.${section.id}.title`] = section.title;
  legal[`legal.${section.id}.body`] = section.body;
}

const en: Record<string, string> = { ...base, ...legal };

export default en;

/** Canonical English bundle for Gemini translation (all UI keys). */
export const EN_STRINGS: Record<string, string> = en;
