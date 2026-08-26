import {
  DEFAULT_ROUTE,
  THEME_COLORS
} from '../../shared/config/routeConfig.js';

export const APP_CONFIG = Object.freeze({
  defaultRoute: DEFAULT_ROUTE,
  deviationThresholdMeters: 45,
  rerouteConfirmationReadings: 2,
  rerouteRetryCooldownMs: 5000,
  stationaryPromptDelayMs: 5 * 60 * 1000,
  stationarySpeedThresholdKmH: 3,
  waitingResumeSpeedKmH: 5,
  defaultSpeedKmH: 50,
  routeStartArrivalThresholdMeters: 60,

  colors: THEME_COLORS
});
