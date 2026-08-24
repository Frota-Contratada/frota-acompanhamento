import {
  DEFAULT_ROUTE,
  PRESET_ROUTES,
  THEME_COLORS,
  TOMTOM_CONFIG
} from '../../shared/config/routeConfig.js';

export const APP_CONFIG = Object.freeze({
  defaultRoute: DEFAULT_ROUTE,
  presetRoutes: PRESET_ROUTES,

  deviationThresholdMeters: 45,
  rerouteConfirmationReadings: 2,
  rerouteRetryCooldownMs: 5000,
  stationaryPromptDelayMs: 5 * 60 * 1000,
  stationarySpeedThresholdKmH: 3,
  waitingResumeSpeedKmH: 5,
  defaultSpeedKmH: 50,

  colors: THEME_COLORS,
  tomtom: TOMTOM_CONFIG
});
