/**
 * Aplicação do motorista.
 * Orquestra mapa em modo de navegação, rota canônica, posição e instruções,
 * espera do passageiro e controles operacionais da corrida.
 */

import { APP_CONFIG } from './config.js';
import { renderDriverShell } from './driverShell.js';
import { audioService } from './services/audioService.js';
import { calculateBearing, calculateDistance, formatDistance } from '../../shared/utils/geoUtils.js';
import { GpsNavigationEngine } from './services/gpsNavigationEngine.js';
import { MapManager } from './components/mapManager.js';
import { NavigationBar } from './components/navigationBar.js';
import { Speedometer } from './components/speedometer.js';
import { RideSheet } from './components/rideSheet.js';
import { addFastClickListener } from '../../shared/utils/domUtils.js';
import { adaptCanonicalRoute } from '../../shared/integration/tripContract.js';
import { createDemoVehiclePosition, DEMO_CANONICAL_ROUTE } from '../../shared/simulation/demoTrip.js';
import { findStopCoordinateIndices } from '../../shared/map/routeLegs.js';
import { hasArrivedAtScheduledStop } from './utils/stopArrival.js';
import './styles/main.css';
import './styles/map.css';
import './styles/navigation.css';
import './styles/rideSheet.css';

// Estado global da aplicação
const appState = {
  currentDestination: null,
  navigationDestination: null,
  currentVehiclePos: null,
  routeStart: null,
  routeStartReached: false,
  approachVisualShown: false,
  activeRouteData: null,
  isRecalculating: false,
  rerouteCount: 0,
  isSoundActive: true,
  userCurrentGps: null,
  stationarySince: null,
  stationaryAnchor: null,
  stationaryTimeoutId: null,
  stationaryPromptDismissed: false,
  lastGpsState: null,
  isWaitingForPassenger: false,
  waitingStartedAt: null,
  waitingAnchor: null,
  lastWaitingMinute: -1,
  routeVersion: 0,
  latestVehicleTimestamp: 0,
  tripStatus: 'in_progress',
  pendingCommands: new Map(),
  arrivalPromptShown: false,
  arrivalPromptDismissedUntil: 0,
  scheduledStops: [],
  stopCoordinateIndices: [],
  nextScheduledStopIndex: 0,
  promptedStopIds: new Set()
};

const simulatorState = {
  enabled: false,
  isPlaying: false,
  timerId: null,
  position: null,
  coordIndex: 0,
  speedKmH: 45,
  tickMs: 700
};

// Componentes
let mapManager;
let navigationBar;
let speedometer;
let rideSheet;
let gpsEngine;
let tripBridge;
let isEmbedded = false;

function showOfflineAlert(message, title = 'Dispositivo offline') {
  const banner = document.getElementById('offline-alert-banner');
  const text = document.getElementById('offline-banner-text');
  const titleElement = banner?.querySelector('.offline-banner-title');
  if (titleElement) titleElement.textContent = title;
  if (text && message) {
    text.textContent = message;
  }
  if (banner) {
    banner.classList.add('show');
  }
}

function hideOfflineAlert() {
  const banner = document.getElementById('offline-alert-banner');
  if (banner) {
    banner.classList.remove('show');
  }
}

function hideStationaryPrompt() {
  const prompt = document.getElementById('stationary-prompt');
  if (prompt) prompt.hidden = true;
}

function showStationaryPrompt({ stop = null, stopIndex = null } = {}) {
  if (
    appState.isWaitingForPassenger
    || (appState.stationaryPromptDismissed && !stop)
  ) return;
  const prompt = document.getElementById('stationary-prompt');
  const description = document.getElementById('stationary-prompt-description');
  const title = document.getElementById('stationary-prompt-title');
  if (stop) {
    if (description) {
      description.textContent = `Você chegou à parada ${Number(stopIndex) + 1}: ${stop.label}.`;
    }
    if (title) title.textContent = 'Deseja entrar no modo de parada?';
  } else {
    if (description) description.textContent = 'Notamos que você está parado há mais de 5 minutos.';
    if (title) title.textContent = 'Deseja entrar no modo de parada?';
  }
  if (prompt) prompt.hidden = false;
  audioService.speak(
    stop
      ? `Você chegou à parada ${Number(stopIndex) + 1}. Deseja entrar no modo de parada?`
      : 'Deseja entrar no modo de parada?',
    true
  );
}

function monitorScheduledStopArrival(state) {
  if (appState.isWaitingForPassenger || !appState.scheduledStops.length) return;
  if (!document.getElementById('stationary-prompt')?.hidden) return;

  while (
    appState.nextScheduledStopIndex < appState.scheduledStops.length
    && appState.promptedStopIds.has(
      appState.scheduledStops[appState.nextScheduledStopIndex].id
    )
  ) {
    appState.nextScheduledStopIndex++;
  }

  const stopIndex = appState.nextScheduledStopIndex;
  const stop = appState.scheduledStops[stopIndex];
  if (!stop) return;

  const distanceToStop = calculateDistance(
    state.position[0],
    state.position[1],
    Number(stop.lat),
    Number(stop.lng)
  );
  const coordinateIndex = appState.stopCoordinateIndices[stopIndex];
  const arrived = hasArrivedAtScheduledStop({
    distanceToStopMeters: distanceToStop,
    speedKmH: state.speedKmH,
    closestCoordIndex: state.closestCoordIndex,
    stopCoordinateIndex: coordinateIndex,
    thresholdMeters: APP_CONFIG.stopArrivalThresholdMeters,
    maxSpeedKmH: APP_CONFIG.stopArrivalMaxSpeedKmH
  });

  if (!arrived) return;
  appState.promptedStopIds.add(stop.id);
  appState.nextScheduledStopIndex++;
  resetStationaryTracking(false);
  showStationaryPrompt({ stop, stopIndex });
}

function clearStationaryTimeout() {
  if (appState.stationaryTimeoutId !== null) {
    window.clearTimeout(appState.stationaryTimeoutId);
    appState.stationaryTimeoutId = null;
  }
}

function resetStationaryTracking(resetDismissal = true) {
  clearStationaryTimeout();
  appState.stationarySince = null;
  appState.stationaryAnchor = null;
  if (resetDismissal) appState.stationaryPromptDismissed = false;
}

function isStationaryPromptEligible(state) {
  return Boolean(
    appState.activeRouteData
    && !state.isOffRoute
    && state.remainingDistanceMeters > 40
  );
}

function scheduleStationaryPrompt() {
  clearStationaryTimeout();
  const elapsed = Date.now() - appState.stationarySince;
  const delay = Math.max(0, APP_CONFIG.stationaryPromptDelayMs - elapsed);

  appState.stationaryTimeoutId = window.setTimeout(() => {
    appState.stationaryTimeoutId = null;
    const state = appState.lastGpsState;
    if (
      state
      && appState.stationarySince
      && Date.now() - appState.stationarySince >= APP_CONFIG.stationaryPromptDelayMs
      && isStationaryPromptEligible(state)
      && state.speedKmH <= APP_CONFIG.stationarySpeedThresholdKmH
    ) {
      showStationaryPrompt();
    }
  }, delay);
}

function enterPassengerWaitingMode(announce = true) {
  hideStationaryPrompt();
  resetStationaryTracking(false);
  appState.isWaitingForPassenger = true;
  appState.waitingStartedAt = Date.now();
  appState.waitingAnchor = appState.currentVehiclePos ? [...appState.currentVehiclePos] : null;
  appState.lastWaitingMinute = 0;
  rideSheet?.setStatus('waiting', 0);
  updateWaitingModeVisual(0);
  if (announce) audioService.speak('Corrida pausada. Aguardando o passageiro.', true);
}

function requestPassengerWaitingMode() {
  if (!isEmbedded) {
    enterPassengerWaitingMode(true);
    return;
  }
  hideStationaryPrompt();
  const eventId = tripBridge?.send('waiting.confirmed', {});
  if (eventId) appState.pendingCommands.set(eventId, 'waiting.confirmed');
}

function updateWaitingModeVisual(waitingMinutes) {
  const card = document.getElementById('waiting-mode-card');
  const duration = document.getElementById('waiting-mode-duration');
  const uiOverlay = document.querySelector('.ui-overlay');
  if (card) card.hidden = false;
  if (duration) {
    duration.textContent = waitingMinutes > 0
      ? `Aguardando passageiro · ${waitingMinutes} min`
      : 'Aguardando passageiro · iniciado agora';
  }
  uiOverlay?.classList.add('passenger-waiting');
}

function hideWaitingModeVisual() {
  const card = document.getElementById('waiting-mode-card');
  const uiOverlay = document.querySelector('.ui-overlay');
  if (card) card.hidden = true;
  uiOverlay?.classList.remove('passenger-waiting');
}

function exitPassengerWaitingMode(announce = true) {
  const wasWaiting = appState.isWaitingForPassenger;
  appState.isWaitingForPassenger = false;
  appState.waitingStartedAt = null;
  appState.waitingAnchor = null;
  appState.lastWaitingMinute = -1;
  hideStationaryPrompt();
  resetStationaryTracking(true);
  rideSheet?.setStatus('transit');
  hideWaitingModeVisual();
  if (announce && wasWaiting) audioService.speak('Corrida retomada.', true);
}

function requestPassengerWaitingResume() {
  if (!isEmbedded) {
    exitPassengerWaitingMode(true);
    return;
  }
  if ([...appState.pendingCommands.values()].includes('waiting.resumeRequested')) return;
  const eventId = tripBridge?.send('waiting.resumeRequested', {});
  if (eventId) appState.pendingCommands.set(eventId, 'waiting.resumeRequested');
}

function monitorStationaryVehicle(state) {
  const speedKmH = Number(state.speedKmH) || 0;
  const movementDistanceThreshold = Math.max(
    20,
    Math.min((Number(state.accuracyMeters) || 0) * 1.5, 40)
  );

  if (appState.isWaitingForPassenger) {
    const movedFromWaitingPoint = appState.waitingAnchor
      ? calculateDistance(
          appState.waitingAnchor[0],
          appState.waitingAnchor[1],
          state.position[0],
          state.position[1]
        )
      : 0;

    if (speedKmH >= APP_CONFIG.waitingResumeSpeedKmH || movedFromWaitingPoint >= movementDistanceThreshold) {
      requestPassengerWaitingResume();
      return;
    }

    const waitingMinutes = Math.floor((Date.now() - appState.waitingStartedAt) / 60000);
    if (waitingMinutes !== appState.lastWaitingMinute) {
      appState.lastWaitingMinute = waitingMinutes;
      rideSheet.setStatus('waiting', waitingMinutes);
      updateWaitingModeVisual(waitingMinutes);
    }
    return;
  }

  if (!isStationaryPromptEligible(state)) {
    hideStationaryPrompt();
    resetStationaryTracking(true);
    return;
  }

  const movedFromStopPoint = appState.stationaryAnchor
    ? calculateDistance(
        appState.stationaryAnchor[0],
        appState.stationaryAnchor[1],
        state.position[0],
        state.position[1]
      )
    : 0;
  const vehicleIsMoving = speedKmH > APP_CONFIG.stationarySpeedThresholdKmH
    || movedFromStopPoint >= movementDistanceThreshold;

  if (vehicleIsMoving) {
    hideStationaryPrompt();
    resetStationaryTracking(true);
    return;
  }

  if (!appState.stationarySince) {
    appState.stationarySince = Date.now();
    appState.stationaryAnchor = [...state.position];
    scheduleStationaryPrompt();
  }
}

function updateSimulatorUI(statusText) {
  const status = document.getElementById('simulator-status');
  const playButton = document.getElementById('btn-simulator-play');
  const pauseButton = document.getElementById('btn-simulator-pause');
  const gpsButton = document.getElementById('btn-simulator-gps');
  if (status) status.textContent = statusText;
  if (playButton) playButton.disabled = simulatorState.isPlaying;
  if (pauseButton) pauseButton.disabled = !simulatorState.enabled || !simulatorState.isPlaying;
  if (gpsButton) gpsButton.disabled = !simulatorState.enabled;
}

function nearestRouteCoordinateIndex(position, coordinates) {
  if (!position || !coordinates?.length) return 0;
  let nearestIndex = 0;
  let smallestDistance = Infinity;
  coordinates.forEach((coordinate, index) => {
    const distance = calculateDistance(position[0], position[1], coordinate[0], coordinate[1]);
    if (distance < smallestDistance) {
      smallestDistance = distance;
      nearestIndex = index;
    }
  });
  return nearestIndex;
}

function advanceSimulatorPosition(distanceMeters) {
  const coordinates = appState.activeRouteData?.coordinates || [];
  if (!coordinates.length || !simulatorState.position) return null;

  let current = simulatorState.position;
  let currentIndex = simulatorState.coordIndex;
  let remaining = distanceMeters;

  for (let index = currentIndex + 1; index < coordinates.length; index++) {
    const next = coordinates[index];
    const segmentDistance = calculateDistance(current[0], current[1], next[0], next[1]);
    if (segmentDistance > 0 && remaining <= segmentDistance) {
      const fraction = remaining / segmentDistance;
      simulatorState.coordIndex = Math.max(currentIndex, index - 1);
      return [
        current[0] + (next[0] - current[0]) * fraction,
        current[1] + (next[1] - current[1]) * fraction
      ];
    }

    remaining -= segmentDistance;
    current = next;
    currentIndex = index;
    simulatorState.coordIndex = index;
  }

  return coordinates[coordinates.length - 1];
}

function enableNavigationSimulator() {
  const coordinates = appState.activeRouteData?.coordinates;
  if (!coordinates?.length) {
    alert('Calcule uma rota antes de iniciar o simulador.');
    return false;
  }

  if (!simulatorState.enabled) {
    simulatorState.enabled = true;
    simulatorState.coordIndex = nearestRouteCoordinateIndex(appState.currentVehiclePos, coordinates);
    simulatorState.position = [...coordinates[simulatorState.coordIndex]];
    gpsEngine.currentPosition = [...simulatorState.position];
    gpsEngine.gpsUpdateIntervalMs = simulatorState.tickMs;
  }
  return true;
}

function playNavigationSimulator() {
  if (!enableNavigationSimulator() || simulatorState.isPlaying) return;
  simulatorState.isPlaying = true;
  updateSimulatorUI('Em movimento');

  simulatorState.timerId = window.setInterval(() => {
    const previousPosition = simulatorState.position;
    const distancePerTick = simulatorState.speedKmH / 3.6 * (simulatorState.tickMs / 1000);
    const nextPosition = advanceSimulatorPosition(distancePerTick);
    if (!nextPosition || !previousPosition) {
      pauseNavigationSimulator();
      return;
    }

    const movedDistance = calculateDistance(
      previousPosition[0], previousPosition[1], nextPosition[0], nextPosition[1]
    );
    if (movedDistance < 0.2) {
      pauseNavigationSimulator();
      updateSimulatorUI('Fim da rota');
      return;
    }

    const bearing = calculateBearing(
      previousPosition[0], previousPosition[1], nextPosition[0], nextPosition[1]
    );
    simulatorState.position = nextPosition;
    gpsEngine.currentPosition = [...nextPosition];
    gpsEngine.currentBearing = bearing;
    gpsEngine.currentSpeedKmH = simulatorState.speedKmH;
    gpsEngine.processGpsUpdate(nextPosition, bearing, simulatorState.speedKmH, 3);
  }, simulatorState.tickMs);
}

function pauseNavigationSimulator() {
  if (simulatorState.timerId !== null) {
    window.clearInterval(simulatorState.timerId);
    simulatorState.timerId = null;
  }
  simulatorState.isPlaying = false;
  updateSimulatorUI(simulatorState.enabled ? 'Parado' : 'Pronto para simular');

  if (simulatorState.enabled && simulatorState.position) {
    gpsEngine.currentSpeedKmH = 0;
    gpsEngine.processGpsUpdate(
      simulatorState.position,
      gpsEngine.currentBearing,
      0,
      3
    );
  }
}

function testPassengerWaitingPrompt() {
  if (!enableNavigationSimulator()) return;
  pauseNavigationSimulator();
  appState.stationaryPromptDismissed = false;
  appState.stationarySince = Date.now() - APP_CONFIG.stationaryPromptDelayMs;
  appState.stationaryAnchor = [...simulatorState.position];
  showStationaryPrompt();
}

function resetNavigationSimulator() {
  pauseNavigationSimulator();
  simulatorState.enabled = false;
  simulatorState.position = null;
  simulatorState.coordIndex = 0;
  if (appState.isWaitingForPassenger) exitPassengerWaitingMode(false);
  resetStationaryTracking(true);
  appState.tripStatus = 'in_progress';
  appState.currentVehiclePos = null;
  appState.routeStart = null;
  appState.routeStartReached = false;
  appState.approachVisualShown = false;
  mapManager.clearCurrentLocationApproach();
  appState.arrivalPromptShown = false;
  appState.arrivalPromptDismissedUntil = 0;
  appState.routeVersion = 0;
  appState.latestVehicleTimestamp = 0;
  gpsEngine.currentPosition = null;
  document.getElementById('trip-complete-overlay')?.setAttribute('hidden', '');
  applyAuthoritativeRoute(DEMO_CANONICAL_ROUTE, { initial: true });
  applyVehiclePosition(createDemoVehiclePosition());
  updateSimulatorUI('Pronto para simular');
}

function initializeNavigationSimulator() {
  const panel = document.getElementById('navigation-simulator');
  if (panel) panel.hidden = isEmbedded;
  updateSimulatorUI(isEmbedded ? 'Posição do aplicativo' : 'Pronto para simular');
}

/**
 * Inicialização dos Componentes
 */
async function initializeApp(options = {}) {
  tripBridge = options.tripBridge;
  isEmbedded = Boolean(tripBridge?.isEmbedded());
  document.documentElement.dataset.runtime = isEmbedded ? 'flutter' : 'standalone';

  // 1. Carrega o destino ativo do cache persistente ou padrão
  const savedDest = APP_CONFIG.defaultRoute.destination;
  appState.currentDestination = savedDest;

  const fallbackCenter = [savedDest.lat, savedDest.lng];

  // 2. Inicializa o Mapa em Modo 3D Waze
  mapManager = new MapManager('map-container', {
    onCameraModeChange: (isFollowing) => updateRecenterButton(isFollowing)
  });
  mapManager.init(fallbackCenter, 19.3);

  // 3. Inicializa o Topo Waze
  navigationBar = new NavigationBar('waze-top-bar');
  navigationBar.render();

  // 4. Inicializa o Velocímetro
  speedometer = new Speedometer('speedometer-widget', {
    speedLimit: null
  });
  speedometer.init();

  // 5. Inicializa o Card Inferior
  rideSheet = new RideSheet('ride-bottom-sheet', {
    controlledStatus: isEmbedded,
    onStatusChange: (status) => {
      if (status === 'waiting') {
        requestPassengerWaitingMode();
      } else {
        requestPassengerWaitingResume();
      }
    }
  });
  rideSheet.setRouteInfo(
    'Minha Localização Atual (GPS)',
    appState.currentDestination.name || 'Destino Selecionado'
  );

  // 6. Inicializa o motor que processa a posição nativa ou simulada.
  gpsEngine = new GpsNavigationEngine({
    onUpdate: (state) => handleGpsUpdate(state),
    onOffRoute: (offRoutePos, distance) => handleOffRouteDetected(offRoutePos, distance),
    onStepChange: (step, dist) => handleStepChange(step, dist),
    onDestinationReached: () => handleDestinationReached()
  });

  // Conecta botões e eventos
  setupUIEventListeners();
  initializeNavigationSimulator();

  if (isEmbedded) {
    configureEmbeddedDriverUi();
    tripBridge.subscribe(handleFlutterTripMessage);
    showOfflineAlert('Sincronizando rota e posição do veículo…', 'Carregando corrida');
  } else {
    applyAuthoritativeRoute(DEMO_CANONICAL_ROUTE, { initial: true });
    applyVehiclePosition(createDemoVehiclePosition());
    hideOfflineAlert();
  }
}

function configureEmbeddedDriverUi() {
  document.getElementById('navigation-simulator')?.setAttribute('hidden', '');
}

function toDestination(waypoint) {
  return {
    id: waypoint.id,
    name: waypoint.label,
    address: waypoint.label,
    lat: waypoint.lat,
    lng: waypoint.lng
  };
}

function applyAuthoritativeRoute(canonicalRoute, { initial = false } = {}) {
  if (canonicalRoute.version <= appState.routeVersion) return false;
  const routeData = adaptCanonicalRoute(canonicalRoute);
  appState.routeVersion = canonicalRoute.version;
  appState.activeRouteData = routeData;
  appState.currentDestination = toDestination(canonicalRoute.destination);
  appState.navigationDestination = { ...canonicalRoute.destination };
  appState.arrivalPromptShown = false;
  appState.arrivalPromptDismissedUntil = 0;
  if (initial) appState.promptedStopIds.clear();

  const origin = [canonicalRoute.origin.lat, canonicalRoute.origin.lng];
  const destination = [canonicalRoute.destination.lat, canonicalRoute.destination.lng];
  appState.routeStart = origin;
  if (initial) {
    appState.routeStartReached = false;
    appState.approachVisualShown = false;
    mapManager.clearCurrentLocationApproach();
  }
  mapManager.drawRoute(
    routeData.coordinates,
    routeData.trafficSections,
    canonicalRoute.stops
  );
  mapManager.setOriginMarker(origin);
  mapManager.setDestinationMarker(destination);
  mapManager.setStopMarkers(canonicalRoute.stops);
  gpsEngine.setRoute(routeData);
  rideSheet.setRouteInfo(
    canonicalRoute.origin.label,
    canonicalRoute.destination.label,
    canonicalRoute.stops
  );
  rideSheet.updateMetrics(routeData.distanceMeters, routeData.durationSeconds);
  if (routeData.steps.length) {
    navigationBar.update(routeData.steps[0], routeData.steps[0].distanceMeters, routeData.steps[1]);
  }
  if (initial && !appState.currentVehiclePos) {
    const nextCoordinate = routeData.coordinates[1] || destination;
    const initialBearing = calculateBearing(
      origin[0], origin[1], nextCoordinate[0], nextCoordinate[1]
    );
    // Mantém a direção inicial da rota enquanto o veículo ainda está parado.
    // Sem isso, o primeiro heartbeat de baixa velocidade restaurava o norte (0°).
    gpsEngine.currentBearing = initialBearing;
    mapManager.updateVehiclePosition(origin, initialBearing, 0);
    mapManager.setView(origin, 16);
  }
  appState.activeRouteData.stops = canonicalRoute.stops;
  appState.scheduledStops = [...canonicalRoute.stops]
    .sort((a, b) => Number(a.sequence) - Number(b.sequence));
  appState.stopCoordinateIndices = findStopCoordinateIndices(
    routeData.coordinates,
    appState.scheduledStops
  );
  appState.nextScheduledStopIndex = 0;
  return true;
}

function applyVehiclePosition(position) {
  const timestamp = Date.parse(position.timestamp);
  if (!Number.isFinite(timestamp) || timestamp <= appState.latestVehicleTimestamp) return;
  const previousTimestamp = appState.latestVehicleTimestamp;
  appState.latestVehicleTimestamp = timestamp;
  const coordinates = [position.lat, position.lng];
  const speedKmH = Math.max(0, Number(position.speed) || 0) * 3.6;
  const suppliedHeading = Number(position.heading);
  const stableHeading = speedKmH >= 8 && Number.isFinite(suppliedHeading)
    ? suppliedHeading
    : (Number(gpsEngine.currentBearing) || 0);
  appState.userCurrentGps = coordinates;

  if (appState.routeStart && !appState.routeStartReached) {
    const distanceToStart = calculateDistance(
      coordinates[0], coordinates[1], appState.routeStart[0], appState.routeStart[1]
    );
    const accuracy = Math.max(0, Number(position.accuracy) || 0);
    const arrivalThreshold = Math.max(
      APP_CONFIG.routeStartArrivalThresholdMeters,
      Math.min(accuracy * 1.5, 100)
    );

    if (distanceToStart > arrivalThreshold) {
      mapManager.showCurrentLocationApproach(coordinates, appState.routeStart, {
        fitBounds: !appState.approachVisualShown
      });
      appState.approachVisualShown = true;
      return;
    }

    appState.routeStartReached = true;
    appState.approachVisualShown = false;
    mapManager.clearCurrentLocationApproach();
    mapManager.setFollowVehicle(true);
    updateRecenterButton(true);
  }

  if (!appState.currentVehiclePos) {
    appState.currentVehiclePos = coordinates;
    mapManager.updateVehiclePosition(coordinates, stableHeading);
    mapManager.setView(coordinates, 19.3);
  }
  if (previousTimestamp) {
    gpsEngine.gpsUpdateIntervalMs = Math.min(2500, Math.max(400, timestamp - previousTimestamp));
  }
  gpsEngine.currentPosition = coordinates;
  gpsEngine.currentBearing = stableHeading;
  gpsEngine.currentSpeedKmH = speedKmH;
  gpsEngine.processGpsUpdate(
    coordinates,
    stableHeading,
    speedKmH,
    Math.max(0, Number(position.accuracy) || 0)
  );
}

function applyWaitingState(waiting, announce = false) {
  if (waiting.active) {
    const wasWaiting = appState.isWaitingForPassenger;
    enterPassengerWaitingMode(announce && !wasWaiting);
    appState.waitingStartedAt = waiting.startedAt ? Date.parse(waiting.startedAt) : Date.now();
    const minutes = Math.max(0, Math.floor((Date.now() - appState.waitingStartedAt) / 60000));
    appState.lastWaitingMinute = minutes;
    rideSheet?.setStatus('waiting', minutes);
    updateWaitingModeVisual(minutes);
  } else {
    exitPassengerWaitingMode(announce);
  }
}

function applyTripStatus(status) {
  appState.tripStatus = status;
  if (status === 'finished' || status === 'completed') {
    hideStationaryPrompt();
    exitPassengerWaitingMode(false);
    rideSheet?.setStatus('paused');
    hideOfflineAlert();
    document.getElementById('trip-finish-prompt')?.setAttribute('hidden', '');
    const completion = document.getElementById('trip-complete-overlay');
    if (completion) completion.hidden = false;
  }
}

function handleFlutterTripMessage(message) {
  const { type, payload } = message;
  if (type === 'trip.bootstrap') {
    if (payload.role !== 'driver') {
      showOfflineAlert('Os dados recebidos não pertencem à visão do motorista.');
      return;
    }
    applyAuthoritativeRoute(payload.route, { initial: true });
    if (payload.vehiclePosition) applyVehiclePosition(payload.vehiclePosition);
    applyWaitingState(payload.waiting, false);
    applyTripStatus(payload.tripStatus);
    if (payload.tripStatus !== 'finished' && payload.tripStatus !== 'completed') hideOfflineAlert();
  } else if (type === 'vehicle.location') {
    applyVehiclePosition(payload);
  } else if (type === 'route.replaced') {
    if (applyAuthoritativeRoute(payload)) {
      appState.isRecalculating = false;
      gpsEngine?.finishRerouting();
      document.getElementById('reroute-banner')?.classList.remove('show');
      hideOfflineAlert();
    }
  } else if (type === 'waiting.changed') {
    applyWaitingState(payload, true);
  } else if (type === 'trip.statusChanged') {
    applyTripStatus(payload.tripStatus);
  } else if (type === 'connection.changed') {
    if (payload.connected) hideOfflineAlert();
    else showOfflineAlert('A posição será sincronizada quando a internet voltar.', 'Sem conexão');
  } else if (type === 'command.succeeded') {
    appState.pendingCommands.delete(payload.commandEventId);
    if (payload.commandType === 'route.rerouteRequested') {
      appState.isRecalculating = false;
      gpsEngine?.finishRerouting();
      document.getElementById('reroute-banner')?.classList.remove('show');
    }
  } else if (type === 'command.failed') {
    appState.pendingCommands.delete(payload.commandEventId);
    if (payload.commandType === 'route.rerouteRequested') {
      appState.isRecalculating = false;
      gpsEngine?.finishRerouting();
      document.getElementById('reroute-banner')?.classList.remove('show');
    }
    if (payload.commandType === 'trip.finishRequested') {
      const prompt = document.getElementById('trip-finish-prompt');
      if (prompt) prompt.hidden = false;
    }
    showOfflineAlert(payload.reason || 'Não foi possível executar a ação.', 'Falha ao atualizar a corrida');
  }
}

/**
 * Trata as atualizações em tempo real vindas do sensor GPS
 */
function handleGpsUpdate(state) {
  const {
    position,
    bearing,
    speedKmH,
    remainingDistanceMeters,
    remainingDurationSeconds,
    activeStep,
    nextStep,
    distanceToStep,
    remainingCoordinates,
    closestCoordIndex,
    displayPosition,
    displayCoordIndex
  } = state;

  appState.currentVehiclePos = position;
  appState.lastGpsState = state;

  const visualPosition = displayPosition || position;
  const visualCoordIndex = Number.isInteger(displayCoordIndex) ? displayCoordIndex : closestCoordIndex;
  mapManager.updateVehiclePosition(visualPosition, bearing, visualCoordIndex);
  mapManager.updateRemainingRoute(remainingCoordinates, visualCoordIndex);
  speedometer.setSpeed(speedKmH);

  if (activeStep) {
    navigationBar.update(activeStep, distanceToStep, nextStep);
  }

  rideSheet.updateMetrics(remainingDistanceMeters, remainingDurationSeconds);
  monitorScheduledStopArrival(state);
  monitorStationaryVehicle(state);
}

/**
 * Quando a navegação entra em uma nova manobra
 */
function handleStepChange(step, distance) {
  if (appState.isWaitingForPassenger) return;
  audioService.playTurnChime();
  audioService.speak(step.instruction);
}

/**
 * Detecta desvio confirmado e delega o recálculo ao mobile/backend.
 */
async function handleOffRouteDetected(currentVehiclePos, deviationDistance) {
  if (appState.isWaitingForPassenger) {
    gpsEngine?.finishRerouting();
    return;
  }
  if (appState.isRecalculating) {
    gpsEngine?.finishRerouting();
    return;
  }
  appState.isRecalculating = true;
  appState.rerouteCount++;

  const banner = document.getElementById('reroute-banner');

  if (isEmbedded) {
    console.log(`⚠️ Desvio detectado (${Math.round(deviationDistance)}m da rota). Solicitando novo trajeto...`);
    banner?.classList.add('show');
    audioService.playRerouteChime();
    audioService.speak('Você saiu da rota. Recalculando...', true);
    const eventId = tripBridge?.send('route.rerouteRequested', {
      deviationDistanceMeters: Math.max(0, Math.round(deviationDistance)),
      position: {
        lat: currentVehiclePos[0],
        lng: currentVehiclePos[1],
        accuracy: Number(appState.lastGpsState?.accuracyMeters) || 0,
        speed: (Number(appState.lastGpsState?.speedKmH) || 0) / 3.6,
        heading: Number(appState.lastGpsState?.bearing) || 0,
        timestamp: new Date().toISOString()
      }
    });
    if (eventId) appState.pendingCommands.set(eventId, 'route.rerouteRequested');
    else {
      appState.isRecalculating = false;
      gpsEngine?.finishRerouting();
      banner?.classList.remove('show');
      showOfflineAlert('Não foi possível solicitar o recálculo ao aplicativo.');
    }
    return;
  }

  // O simulador usa uma rota fixa e não possui provedor de recálculo.
  gpsEngine?.finishRerouting();
  appState.isRecalculating = false;
  banner?.classList.remove('show');
}

/**
 * Chegada ao Destino
 */
function handleDestinationReached() {
  if (
    appState.arrivalPromptShown
    || Date.now() < appState.arrivalPromptDismissedUntil
    || appState.tripStatus === 'finished'
    || appState.tripStatus === 'completed'
  ) return;
  appState.arrivalPromptShown = true;
  hideStationaryPrompt();
  resetStationaryTracking(true);
  audioService.playArrivalFanfare();
  audioService.speak('Você chegou ao seu destino.', true);
  const prompt = document.getElementById('trip-finish-prompt');
  if (prompt) prompt.hidden = false;
}

function requestTripFinish() {
  const prompt = document.getElementById('trip-finish-prompt');
  if (prompt) prompt.hidden = true;
  if (!isEmbedded) {
    applyTripStatus('finished');
    return;
  }
  const eventId = tripBridge?.send('trip.finishRequested', {});
  if (eventId) {
    appState.pendingCommands.set(eventId, 'trip.finishRequested');
  } else {
    if (prompt) prompt.hidden = false;
    showOfflineAlert('Não foi possível solicitar o encerramento.', 'Falha ao finalizar');
  }
}

/**
 * Alterna som / voz
 */
function toggleAudio(button) {
  const isMuted = audioService.toggleMute();
  appState.isSoundActive = !isMuted;
  if (button) {
    button.classList.toggle('active', appState.isSoundActive);
  }
}

function createExternalNavigationPayload(provider) {
  const destination = appState.navigationDestination;
  if (!destination) return null;

  return {
    provider,
    destination: {
      id: String(destination.id),
      sequence: Number.isInteger(destination.sequence) ? destination.sequence : 0,
      kind: 'destination',
      label: destination.label || appState.currentDestination?.name || 'Destino',
      lat: Number(destination.lat),
      lng: Number(destination.lng)
    },
    ...(appState.userCurrentGps
      ? { origin: { lat: appState.userCurrentGps[0], lng: appState.userCurrentGps[1] } }
      : {})
  };
}

function openExternalNavigation(provider) {
  const payload = createExternalNavigationPayload(provider);
  if (!payload) return;

  if (isEmbedded) {
    tripBridge?.send('external.navigationRequested', payload);
    return;
  }

  const destination = `${payload.destination.lat},${payload.destination.lng}`;
  const url = provider === 'waze'
    ? `https://waze.com/ul?ll=${encodeURIComponent(destination)}&navigate=yes`
    : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=driving${payload.origin ? `&origin=${encodeURIComponent(`${payload.origin.lat},${payload.origin.lng}`)}` : ''}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Atualiza a visibilidade do botão de recentralizar câmera
 * (Aparece apenas quando o mapa NÃO estiver centralizado no veículo/GPS)
 */
function updateRecenterButton(isFollowing) {
  const btn = document.getElementById('fab-recenter');
  if (btn) {
    if (isFollowing) {
      btn.classList.remove('visible');
    } else {
      btn.classList.add('visible');
    }
  }
}

/**
 * Configuração dos Eventos da Interface
 */
function setupUIEventListeners() {
  addFastClickListener(document.getElementById('btn-resume-waiting'), () => {
    requestPassengerWaitingResume();
  });

  addFastClickListener(document.getElementById('btn-simulator-play'), playNavigationSimulator);
  addFastClickListener(document.getElementById('btn-simulator-pause'), pauseNavigationSimulator);
  addFastClickListener(document.getElementById('btn-simulator-waiting'), testPassengerWaitingPrompt);
  addFastClickListener(document.getElementById('btn-simulator-gps'), resetNavigationSimulator);

  addFastClickListener(document.getElementById('btn-stationary-no'), () => {
    hideStationaryPrompt();
    clearStationaryTimeout();
    appState.stationaryPromptDismissed = true;
  });

  addFastClickListener(document.getElementById('btn-stationary-yes'), () => {
    requestPassengerWaitingMode();
  });

  addFastClickListener(document.getElementById('btn-finish-no'), () => {
    const prompt = document.getElementById('trip-finish-prompt');
    if (prompt) prompt.hidden = true;
    appState.arrivalPromptShown = false;
    appState.arrivalPromptDismissedUntil = Date.now() + 60000;
  });

  addFastClickListener(document.getElementById('btn-finish-yes'), requestTripFinish);
  addFastClickListener(document.getElementById('btn-complete-close'), () => {
    const completion = document.getElementById('trip-complete-overlay');
    if (completion) completion.hidden = true;
  });

  addFastClickListener(document.getElementById('fab-recenter'), () => {
    if (!appState.routeStartReached && appState.userCurrentGps && appState.routeStart) {
      mapManager.fitApproachBounds(appState.userCurrentGps, appState.routeStart);
      return;
    }
    mapManager.setFollowVehicle(true);
    updateRecenterButton(true);
    if (appState.currentVehiclePos) {
      mapManager.setView(appState.currentVehiclePos, 19.3, { animate: true });
    }
  });

  addFastClickListener(document.getElementById('btn-sound-nav'), () => {
    const button = document.getElementById('btn-sound-nav');
    toggleAudio(button);
    button?.setAttribute('aria-pressed', String(appState.isSoundActive));
    button?.setAttribute('aria-label', appState.isSoundActive
      ? 'Silenciar instruções de voz'
      : 'Ativar instruções de voz');
    button?.setAttribute('title', appState.isSoundActive
      ? 'Silenciar instruções'
      : 'Ativar instruções');
  });

  addFastClickListener(document.getElementById('btn-waze-nav'), () => {
    openExternalNavigation('waze');
  });

  addFastClickListener(document.getElementById('btn-google-maps-nav'), () => {
    openExternalNavigation('google_maps');
  });

}

export function mountDriverApp(options = {}) {
  document.documentElement.dataset.appRole = 'driver';

  const startDriverApp = async () => {
    renderDriverShell(document.getElementById('app'));
    document.title = 'Navegação do Motorista - Sistema de Frotas';
    await initializeApp(options);
  };

  if (document.readyState === 'loading') {
    return new Promise((resolve, reject) => {
      window.addEventListener('DOMContentLoaded', () => startDriverApp().then(resolve, reject), { once: true });
    });
  }

  return startDriverApp();
}
