import { DEFAULT_ROUTE } from '../../shared/config/routeConfig.js';
import {
  calculateBearing,
  calculateDistance,
  minDistanceToPolyline
} from '../../shared/utils/geoUtils.js';
import { addFastClickListener } from '../../shared/utils/domUtils.js';
import { adaptCanonicalRoute } from '../../shared/integration/tripContract.js';
import { createDemoVehiclePosition, DEMO_CANONICAL_ROUTE } from '../../shared/simulation/demoTrip.js';
import { PassengerMapManager } from './components/passengerMapManager.js';
import { PassengerRideCard } from './components/passengerRideCard.js';
import { renderPassengerShell } from './passengerShell.js';
import './styles/passenger.css';

const passengerState = {
  destination: null,
  vehiclePosition: null,
  vehicleBearing: 0,
  routeData: null,
  routeGeometryDistance: 0,
  routeRemainingByIndex: [],
  routeVersion: 0,
  latestVehicleTimestamp: 0,
  tripStatus: 'in_progress',
  waiting: false
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
let tripBridge;
let isEmbedded = false;

async function initializePassengerApp(options = {}) {
  tripBridge = options.tripBridge;
  isEmbedded = Boolean(tripBridge?.isEmbedded());
  document.documentElement.dataset.runtime = isEmbedded ? 'flutter' : 'standalone';
  passengerState.destination = DEFAULT_ROUTE.destination;
  const fallbackCenter = [passengerState.destination.lat, passengerState.destination.lng];

  mapManager = new PassengerMapManager('passenger-map', {
    onOverviewChange: updateOverviewButton
  });
  mapManager.init(fallbackCenter, 13);

  rideCard = new PassengerRideCard('passenger-ride-card');
  rideCard.setRouteInfo('Localização atual do veículo', passengerState.destination.name);

  bindPassengerEvents();
  initializeSimulatorPanel();
  if (isEmbedded) {
    configureEmbeddedPassengerUi();
    tripBridge.subscribe(handleFlutterTripMessage);
    showAlert('Sincronizando rota e posição do veículo…', 'Carregando corrida');
  } else {
    applyAuthoritativeRoute(DEMO_CANONICAL_ROUTE, { initial: true });
    applyAuthoritativeVehicle(createDemoVehiclePosition(), { animate: false });
    hideAlert();
  }
}

function configureEmbeddedPassengerUi() {
  document.getElementById('passenger-simulator')?.setAttribute('hidden', '');
}

function applyAuthoritativeRoute(canonicalRoute, { initial = false } = {}) {
  if (canonicalRoute.version <= passengerState.routeVersion) return false;
  const routeData = adaptCanonicalRoute(canonicalRoute);
  passengerState.routeVersion = canonicalRoute.version;
  passengerState.routeData = routeData;
  passengerState.destination = {
    id: canonicalRoute.destination.id,
    name: canonicalRoute.destination.label,
    address: canonicalRoute.destination.label,
    lat: canonicalRoute.destination.lat,
    lng: canonicalRoute.destination.lng
  };
  prepareRouteProgress(routeData.coordinates);
  mapManager.drawRoute(
    routeData.coordinates,
    routeData.trafficSections,
    canonicalRoute.stops
  );
  mapManager.setOriginMarker([canonicalRoute.origin.lat, canonicalRoute.origin.lng]);
  mapManager.setDestinationMarker([canonicalRoute.destination.lat, canonicalRoute.destination.lng]);
  mapManager.setStopMarkers(canonicalRoute.stops);
  rideCard.setRouteInfo(
    canonicalRoute.origin.label,
    canonicalRoute.destination.label,
    canonicalRoute.stops
  );
  rideCard.updateMetrics(routeData.distanceMeters, routeData.durationSeconds, routeData.trafficDelaySeconds);
  if (initial || mapManager.isOverview) mapManager.showRouteOverview();
  return true;
}

function applyAuthoritativeVehicle(position, { animate = true } = {}) {
  const timestamp = Date.parse(position.timestamp);
  if (!Number.isFinite(timestamp) || timestamp <= passengerState.latestVehicleTimestamp) return;
  passengerState.latestVehicleTimestamp = timestamp;
  updateVehicle(
    [position.lat, position.lng],
    Number(position.heading) || 0,
    Math.max(0, Number(position.speed) || 0) * 3.6,
    { animate }
  );
}

function setPassengerTripStatus(status) {
  passengerState.tripStatus = status;
}

function handleFlutterTripMessage(message) {
  const { type, payload } = message;
  if (type === 'trip.bootstrap') {
    if (payload.role !== 'passenger') {
      showAlert('Os dados recebidos não pertencem à visão do passageiro.');
      return;
    }
    applyAuthoritativeRoute(payload.route, { initial: true });
    passengerState.waiting = payload.waiting.active;
    setPassengerTripStatus(payload.tripStatus);
    if (payload.vehiclePosition) applyAuthoritativeVehicle(payload.vehiclePosition, { animate: false });
    hideAlert();
  } else if (type === 'vehicle.location') {
    applyAuthoritativeVehicle(payload);
  } else if (type === 'passenger.location') {
    // A posição do passageiro é auxiliar e nunca representa o veículo.
  } else if (type === 'route.replaced') {
    if (applyAuthoritativeRoute(payload)) hideAlert();
  } else if (type === 'waiting.changed') {
    passengerState.waiting = payload.active;
  } else if (type === 'trip.statusChanged') {
    setPassengerTripStatus(payload.tripStatus);
  } else if (type === 'connection.changed') {
    if (payload.connected) hideAlert();
    else showAlert('Exibindo a última posição recebida do veículo.', 'Sem conexão');
  } else if (type === 'command.failed') {
    showAlert(payload.reason || 'Não foi possível atualizar a corrida.');
  }
}

function updateVehicle(position, sensorBearing = null, speedKmH = 0, options = {}) {
  const previous = passengerState.vehiclePosition;
  const movedMeters = previous
    ? calculateDistance(previous[0], previous[1], position[0], position[1])
    : 0;
  const routeBearing = getRouteBearingAtPosition(position);

  let bearing = passengerState.vehicleBearing;
  if (Number.isFinite(routeBearing)) {
    // Enquanto o veículo estiver sobre a rota, a geometria canônica é a
    // referência mais estável e mantém a seta alinhada mesmo quando parado.
    bearing = routeBearing;
  } else if (Number.isFinite(sensorBearing) && speedKmH >= 7) {
    bearing = sensorBearing;
  } else if (previous && movedMeters >= 6 && speedKmH >= 4) {
    bearing = calculateBearing(previous[0], previous[1], position[0], position[1]);
  }

  passengerState.vehiclePosition = position;
  passengerState.vehicleBearing = bearing;
  mapManager.updateVehiclePosition(position, bearing, options.animate !== false);
  updateRouteProgress(position);
  hideAlert();
}

function getRouteBearingAtPosition(position) {
  const coordinates = passengerState.routeData?.coordinates;
  if (!position || !coordinates || coordinates.length < 2) return null;

  const match = minDistanceToPolyline(position, coordinates, 80);
  if (match.isOffRoute) return null;

  const segmentIndex = Math.min(match.closestIndex, coordinates.length - 2);
  const segmentStart = coordinates[segmentIndex];
  const segmentEnd = coordinates[segmentIndex + 1];
  return calculateBearing(
    segmentStart[0], segmentStart[1], segmentEnd[0], segmentEnd[1]
  );
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
  mapManager.updateRouteProgress(match.closestIndex);
  const geometryRemaining = passengerState.routeRemainingByIndex[match.closestIndex] || 0;
  const progressRatio = Math.max(0, Math.min(1, geometryRemaining / passengerState.routeGeometryDistance));
  const remainingDistance = routeData.distanceMeters * progressRatio;
  const remainingDuration = routeData.durationSeconds * progressRatio;
  const remainingTrafficDelay = routeData.trafficDelaySeconds * progressRatio;

  rideCard.updateMetrics(remainingDistance, remainingDuration, remainingTrafficDelay);

}

function updateOverviewButton(isOverview) {
  const button = document.getElementById('passenger-recenter');
  if (!button) return;
  const shouldShow = !isOverview;
  button.classList.toggle('visible', shouldShow);
  button.disabled = !shouldShow;
  button.setAttribute('aria-hidden', String(!shouldShow));
}

function showAlert(message, title = 'Não foi possível atualizar a corrida') {
  const alert = document.getElementById('passenger-alert');
  const text = document.getElementById('passenger-alert-text');
  const titleElement = document.getElementById('passenger-alert-title');
  if (titleElement) titleElement.textContent = title;
  if (text) text.textContent = message;
  if (alert) alert.hidden = false;
}

function hideAlert() {
  const alert = document.getElementById('passenger-alert');
  if (alert) alert.hidden = true;
}

function bindPassengerEvents() {
  addFastClickListener(document.getElementById('passenger-recenter'), () => {
    mapManager.showRouteOverview();
  });

  addFastClickListener(document.getElementById('passenger-simulator-play'), playSimulator);
  addFastClickListener(document.getElementById('passenger-simulator-pause'), pauseSimulator);
  addFastClickListener(document.getElementById('passenger-simulator-gps'), resetSimulator);
}

function initializeSimulatorPanel() {
  const panel = document.getElementById('passenger-simulator');
  if (panel) panel.hidden = isEmbedded;
  updateSimulatorUi(isEmbedded ? 'Posição do aplicativo' : 'Pronto para simular');
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
  updateSimulatorUi(simulatorState.enabled ? 'Pausado' : 'Pronto para simular');
}

function resetSimulator() {
  pauseSimulator();
  simulatorState.enabled = false;
  simulatorState.position = null;
  simulatorState.coordinateIndex = 0;
  passengerState.routeVersion = 0;
  passengerState.latestVehicleTimestamp = 0;
  applyAuthoritativeRoute(DEMO_CANONICAL_ROUTE, { initial: true });
  applyAuthoritativeVehicle(createDemoVehiclePosition(), { animate: false });
  updateSimulatorUi('Pronto para simular');
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

export function mountPassengerApp(options = {}) {
  document.documentElement.dataset.appRole = 'passenger';

  const start = async () => {
    renderPassengerShell(document.getElementById('app'));
    document.title = 'Acompanhar Corrida - Sistema de Frotas';
    await initializePassengerApp(options);
  };

  if (document.readyState === 'loading') {
    return new Promise((resolve, reject) => {
      window.addEventListener('DOMContentLoaded', () => start().then(resolve, reject), { once: true });
    });
  }
  return start();
}
