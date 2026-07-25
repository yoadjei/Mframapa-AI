/** Screens pushed on the Profile stack — shared by ProfileScreen links and the + menu. */
export type ProfileMenuItem = {
  id: string;
  labelKey: string;
  screen: string;
};

/** Account-related links shown on the Profile tab (identity + tier live on the screen). */
export const PROFILE_MENU_ITEMS: ProfileMenuItem[] = [
  { id: 'settings', labelKey: 'screen.profile.link_settings', screen: 'Settings' },
];

/** Product screens reachable from the + menu (not duplicated on Profile). */
export const MORE_MENU_ITEMS: ProfileMenuItem[] = [
  { id: 'saved', labelKey: 'screen.profile.link_saved_locations', screen: 'SavedLocations' },
  { id: 'activity', labelKey: 'screen.profile.link_activity_feed', screen: 'ActivityFeed' },
  { id: 'ai', labelKey: 'screen.profile.link_ai_insights', screen: 'AIInsights' },
  { id: 'prediction', labelKey: 'screen.profile.link_prediction', screen: 'PredictionDashboard' },
  { id: 'country', labelKey: 'screen.profile.link_country', screen: 'CountryExplorer' },
  { id: 'compare', labelKey: 'screen.profile.link_compare', screen: 'CompareCities' },
  { id: 'trust', labelKey: 'screen.profile.link_trust', screen: 'TrustTransparency' },
  { id: 'export', labelKey: 'screen.profile.link_export', screen: 'ExportCentre' },
  { id: 'about', labelKey: 'screen.profile.link_about', screen: 'AboutLegal' },
  { id: 'feedback', labelKey: 'screen.profile.link_feedback', screen: 'FeedbackForm' },
];
