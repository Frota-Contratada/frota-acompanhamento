import { DEFAULT_ROUTE } from '../../shared/config/routeConfig.js';
import { RouteSetupScreen } from '../../shared/components/routeSetupScreen.js';
import { storageService } from '../../shared/services/storageService.js';
import { fetchTomTomRoute } from '../../shared/services/tomtomService.js';
import {
  calculateBearing,
  calculateDistance,
  minDistanceToPolyline
} from '../../shared/utils/geoUtils.js';
import { addFastClickListener } from '../../shared/utils/domUtils.js';
import { PassengerMapManager } from './components/passengerMapManager.js';
import { PassengerRideCard } from './components/passengerRideCard.js';
import { renderPassengerShell } from './passengerShell.js';
import './styles/passenger.css';
import '../../shared/styles/setupScreen.css';

const passengerState = {
  destination: null,
  vehiclePosition: null,
  vehicleBearing: 0,
  routeData: null,
  routeGeometryDistance: 0,
  routeRemainingByIndex: [],
  watchId: null,
  offRouteReadings: 0,
  isRecalculating: false,
  lastRerouteAt: 0
};

const simulatorState = {
  enabled: false,
  playing: false,
  timerId: null,
  position: null,
  coordinateIndex: 0,
  speedKmH: 48,
  tickMs: 600
};

let mapManager;
let rideCard;
let setupScreen;

async function initializePassengerApp() {
  passengerState.destination = storageService.loadActiveDestination() || DEFAULT_ROUTE.destination;
  const fallbackCenter = [passengerState.destination.lat, passengerState.destination.lng];

  mapManager = new PassengerMapManager('passenger-map', {
    onOverviewChange: updateOverviewButton
  });
  mapManager.init(fallbackCenter, 13);

  rideCard = new PassengerRideCard('passenger-ride-card');
  rideCard.setRouteInfo('Localização atual do veículo', passengerState.destination.name);
  updateDestinationTitle();

  setupScreen = new RouteSetupScreen('setup-page-container', {
    profile: 'passenger',
    onStartRoute: async (routeConfig) => {
      passengerState.destination = routeConfig.destination;
      storageService.saveActiveDestination(routeConfig.destination);
      rideCard.setRouteInfo('Localização atual do veículo', routeConfig.destination.name);
      updateDestinationTitle();
      await calculateAndApplyRoute(passengerState.vehiclePosition || [routeConfig.origin.lat, routeConfig.origin.lng]);
    }
  });
  setupScreen.init();
  setupScreen.setDestination(passengerState.destination);

  bindPassengerEvents();
  initializeSimulatorPanel();
  requestVehicleLocationAndRoute();
}

function updateDestinationTitle() {
  const element = document.getElementById('passenger-destination-name');
  if (element) element.textContent = passengerState.destination?.name || 'Destino da corrida';
}

function requestVehicleLocationAndRoute() {
  if (!('geolocation' in navigator)) {
    showAlert('Este navegador não possui suporte à localização.');
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const coordinates = [position.coords.latitude, position.coords.longitude];
      passengerState.vehiclePosition = coordinates;
      mapManager.updateVehiclePosition(coordinates, passengerState.vehicleBearing, false);
      await calculateAndApplyRoute(coordinates);
      startVehicleTracking();
    },
    (error) => {
      console.warn('Não foi possível obter a localização inicial do veículo:', error);
      showAlert('Permita o acesso à localização para acompanhar o veículo neste protótipo.');
    },
    { enableHighAccuracy: true, timeout: 12000, maximumAge: 15000 }
  );
}

function startVehicleTracking() {
  if (passengerState.watchId !== null || !('geolocation' in navigator)) return;

  passengerState.watchId = navigator.geolocation.watchPosition(
    (position) => {
      if (simulatorState.enabled) return;
      const coordinates = [position.coords.latitude, position.coords.longitude];
      const speedKmH = Number.isFinite(position.coords.speed) ? position.coords.speed * 3.6 : 0;
      updateVehicle(coordinates, position.coords.heading, speedKmH);
    },
    (error) => {
      if (!simulatorState.enabled) {
        console.warn('Falha ao atualizar localização do veículo:', error);
        showAlert('O sinal de localização está temporariamente indisponível.');
      }
    },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 3000 }
  );
}

function updateVehicle(position, sensorBearing = null, speedKmH = 0) {
  const previous = passengerState.vehiclePosition;
  const movedMeters = previous
    ? calculateDistance(previous[0], previous[1], position[0], position[1])
    : 0;

  let bearing = passengerState.vehicleBearing;
  if (Number.isFinite(sensorBearing) && speedKmH >= 7) {
    bearing = sensorBearing;
  } else if (previous && movedMeters >= 6 && speedKmH >= 4) {
    bearing = calculateBearing(previous[0], previous[1], position[0], position[1]);
  }

  passengerState.vehiclePosition = position;
  passengerState.vehicleBearing = bearing;
  mapManager.updateVehiclePosition(position, bearing, true);
  updateRouteProgress(position);
  monitorRouteDeviation(position);
  hideAlert();
}

async function calculateAndApplyRoute(startPosition, { keepViewport = false } = {}) {
  if (!startPosition || !passengerState.destination || passengerState.isRecalculating) return null;
  passengerState.isRecalculating = true;

  try {
    const destination = [passengerState.destination.lat, passengerState.destination.lng];
    const routeData = await fetchTomTomRoute(startPosition, destination);
    if (!routeData || routeData.success === false) {
      showAlert(routeData?.message || 'Não foi possível carregar a rota da corrida.');
      return null;
    }

    passengerState.routeData = routeData;
    passengerState.offRouteReadings = 0;
    prepareRouteProgress(routeData.coordinates);

    const status = document.querySelector('.passenger-eyebrow');
    if (status) status.textContent = 'Corrida em andamento';

    mapManager.drawRoute(routeData.coordinates, routeData.trafficSections);
    mapManager.setOriginMarker(startPosition);
    mapManager.setDestinationMarker(destination);
    mapManager.updateVehiclePosition(startPosition, passengerState.vehicleBearing, false);
    rideCard.updateMetrics(
      routeData.distanceMeters,
      routeData.durationSeconds,
      routeData.trafficDelaySeconds
    );

    if (!keepViewport) mapManager.showRouteOverview();
    hideAlert();
    return routeData;
  } catch (error) {
    console.error('Falha ao carregar a corrida do passageiro:', error);
    showAlert('Não foi possível atualizar a rota. Verifique sua conexão.');
    return null;
  } finally {
    passengerState.isRecalculating = false;
  }
}

function prepareRouteProgress(coordinates) {
  const remaining = new Array(coordinates.length).fill(0);
  let accumulated = 0;
  for (let index = coordinates.length - 2; index >= 0; index--) {
    accumulated += calculateDistance(
      coordinates[index][0],
      coordinates[index][1],
      coordinates[index + 1][0],
      coordinates[index + 1][1]
    );
    remaining[index] = accumulated;
  }
  passengerState.routeGeometryDistance = accumulated;
  passengerState.routeRemainingByIndex = remaining;
}

function updateRouteProgress(position) {
  const routeData = passengerState.routeData;
  if (!routeData?.coordinates?.length || passengerState.routeGeometryDistance <= 0) return;

  const match = minDistanceToPolyline(position, routeData.coordinates, 80);
  const geometryRemaining = passengerState.routeRemainingByIndex[match.closestIndex] || 0;
  const progressRatio = Math.max(0, Math.min(1, geometryRemaining / passengerState.routeGeometryDistance));
  const remainingDistance = routeData.distanceMeters * progressRatio;
  const remainingDuration = routeData.durationSeconds * progressRatio;
  const remainingTrafficDelay = routeData.trafficDelaySeconds * progressRatio;

  rideCard.updateMetrics(remainingDistance, remainingDuration, remainingTrafficDelay);

  if (remainingDistance <= 35) {
    const status = document.querySelector('.passenger-eyebrow');
    if (status) status.textContent = 'Veículo chegou ao destino';
  }
}

function monitorRouteDeviation(position) {
  if (simulatorState.enabled || passengerState.isRecalculating || !passengerState.routeData) return;
  const match = minDistanceToPolyline(position, passengerState.routeData.coordinates, 80);
  passengerState.offRouteReadings = match.isOffRoute ? passengerState.offRouteReadings + 1 : 0;

  const cooldownElapsed = Date.now() - passengerState.lastRerouteAt > 10000;
  if (passengerState.offRouteReadings >= 3 && cooldownElapsed) {
    passengerState.lastRerouteAt = Date.now();
    passengerState.offRouteReadings = 0;
    calculateAndApplyRoute(position, { keepViewport: !mapManager.isOverview });
  }
}

function updateOverviewButton(isOverview) {
  const button = document.getElementById('passenger-recenter');
  if (!button) return;
  const shouldShow = !isOverview;
  button.classList.toggle('visible', shouldShow);
  button.disabled = !shouldShow;
  button.setAttribute('aria-hidden', String(!shouldShow));
}

function showAlert(message) {
  const alert = document.getElementById('passenger-alert');
  const text = document.getElementById('passenger-alert-text');
  if (text) text.textContent = message;
  if (alert) alert.hidden = false;
}

function hideAlert() {
  const alert = document.getElementById('passenger-alert');
  if (alert) alert.hidden = true;
}

function bindPassengerEvents() {
  addFastClickListener(document.getElementById('passenger-new-route'), () => {
    pauseSimulator();
    setupScreen.setDestination(passengerState.destination);
    setupScreen.show();
  });

  addFastClickListener(document.getElementById('passenger-recenter'), () => {
    mapManager.showRouteOverview();
  });

  addFastClickListener(document.getElementById('passenger-alert-retry'), () => {
    hideAlert();
    if (passengerState.vehiclePosition) calculateAndApplyRoute(passengerState.vehiclePosition);
    else requestVehicleLocationAndRoute();
  });

  addFastClickListener(document.getElementById('passenger-simulator-play'), playSimulator);
  addFastClickListener(document.getElementById('passenger-simulator-pause'), pauseSimulator);
  addFastClickListener(document.getElementById('passenger-simulator-gps'), returnToGps);

  window.addEventListener('offline', () => showAlert('Você perdeu a conexão com a internet.'));
  window.addEventListener('online', () => {
    hideAlert();
    if (passengerState.vehiclePosition) {
      calculateAndApplyRoute(passengerState.vehiclePosition, { keepViewport: !mapManager.isOverview });
    }
  });
}

function initializeSimulatorPanel() {
  const panel = document.getElementById('passenger-simulator');
  const enabledByQuery = new URLSearchParams(window.location.search).get('simulator') === '1';
  if (panel) panel.hidden = !(import.meta.env.DEV || enabledByQuery);
  updateSimulatorUi('GPS real');
}

function enableSimulator() {
  const coordinates = passengerState.routeData?.coordinates;
  if (!coordinates?.length) return false;
  if (simulatorState.enabled) return true;

  simulatorState.enabled = true;
  const match = minDistanceToPolyline(
    passengerState.vehiclePosition || coordinates[0],
    coordinates,
    Infinity
  );
  simulatorState.coordinateIndex = match.closestIndex;
  simulatorState.position = [...coordinates[simulatorState.coordinateIndex]];
  passengerState.vehiclePosition = [...simulatorState.position];
  mapManager.updateVehiclePosition(simulatorState.position, passengerState.vehicleBearing, false);
  return true;
}

function playSimulator() {
  if (!enableSimulator() || simulatorState.playing) return;
  simulatorState.playing = true;
  updateSimulatorUi('Em movimento');

  simulatorState.timerId = window.setInterval(() => {
    const next = advanceSimulator(simulatorState.speedKmH / 3.6 * (simulatorState.tickMs / 1000));
    if (!next) {
      pauseSimulator();
      return;
    }
    updateVehicle(next.position, next.bearing, simulatorState.speedKmH);
  }, simulatorState.tickMs);
}

function advanceSimulator(distanceMeters) {
  const coordinates = passengerState.routeData?.coordinates || [];
  if (!simulatorState.position || simulatorState.coordinateIndex >= coordinates.length - 1) return null;

  let current = simulatorState.position;
  let remaining = distanceMeters;
  let index = simulatorState.coordinateIndex;

  while (index < coordinates.length - 1) {
    const target = coordinates[index + 1];
    const segmentDistance = calculateDistance(current[0], current[1], target[0], target[1]);
    if (segmentDistance > remaining && segmentDistance > 0) {
      const fraction = remaining / segmentDistance;
      const position = [
        current[0] + (target[0] - current[0]) * fraction,
        current[1] + (target[1] - current[1]) * fraction
      ];
      simulatorState.position = position;
      simulatorState.coordinateIndex = index;
      return {
        position,
        bearing: calculateBearing(current[0], current[1], target[0], target[1])
      };
    }
    remaining -= segmentDistance;
    current = target;
    index++;
  }

  simulatorState.position = [...coordinates[coordinates.length - 1]];
  simulatorState.coordinateIndex = coordinates.length - 1;
  return { position: simulatorState.position, bearing: passengerState.vehicleBearing };
}

function pauseSimulator() {
  if (simulatorState.timerId !== null) window.clearInterval(simulatorState.timerId);
  simulatorState.timerId = null;
  simulatorState.playing = false;
  updateSimulatorUi(simulatorState.enabled ? 'Pausado' : 'GPS real');
}

function returnToGps() {
  pauseSimulator();
  simulatorState.enabled = false;
  simulatorState.position = null;
  simulatorState.coordinateIndex = 0;
  updateSimulatorUi('GPS real');
  requestCurrentGpsUpdate();
}

function requestCurrentGpsUpdate() {
  navigator.geolocation?.getCurrentPosition(
    (position) => updateVehicle(
      [position.coords.latitude, position.coords.longitude],
      position.coords.heading,
      Number.isFinite(position.coords.speed) ? position.coords.speed * 3.6 : 0
    ),
    () => showAlert('Não foi possível voltar ao GPS agora.'),
    { enableHighAccuracy: true, timeout: 12000, maximumAge: 3000 }
  );
}

function updateSimulatorUi(statusText) {
  const status = document.getElementById('passenger-simulator-status');
  const play = document.getElementById('passenger-simulator-play');
  const pause = document.getElementById('passenger-simulator-pause');
  const gps = document.getElementById('passenger-simulator-gps');
  if (status) status.textContent = statusText;
  if (play) play.disabled = simulatorState.playing;
  if (pause) pause.disabled = !simulatorState.playing;
  if (gps) gps.disabled = !simulatorState.enabled;
}

export function mountPassengerApp() {
  document.documentElement.dataset.appRole = 'passenger';

  const start = () => {
    renderPassengerShell(document.getElementById('app'));
    document.title = 'Acompanhar Corrida - Sistema de Frotas';
    initializePassengerApp();
  };

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', start, { once: true });
    return;
  }
  start();
}
