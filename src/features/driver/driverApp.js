/**
 * Aplicação do motorista.
 * Orquestra mapa em modo de navegação, roteamento TomTom, GPS, instruções,
 * espera do passageiro e controles operacionais da corrida.
 */

import { APP_CONFIG } from './config.js';
import { renderDriverShell } from './driverShell.js';
import { fetchTomTomRoute } from '../../shared/services/tomtomService.js';
import { audioService } from './services/audioService.js';
import { calculateBearing, calculateDistance, formatDistance } from '../../shared/utils/geoUtils.js';
import { storageService } from '../../shared/services/storageService.js';
import { GpsNavigationEngine } from './services/gpsNavigationEngine.js';
import { MapManager } from './components/mapManager.js';
import { NavigationBar } from './components/navigationBar.js';
import { Speedometer } from './components/speedometer.js';
import { RideSheet } from './components/rideSheet.js';
import { RouteSetupScreen } from '../../shared/components/routeSetupScreen.js';
import { addFastClickListener } from '../../shared/utils/domUtils.js';
import './styles/main.css';
import './styles/map.css';
import './styles/navigation.css';
import './styles/rideSheet.css';
import '../../shared/styles/setupScreen.css';

// Estado global da aplicação
const appState = {
  currentDestination: null,
  currentVehiclePos: null,
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
  lastWaitingMinute: -1
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
let setupScreen;
let gpsEngine;

function showOfflineAlert(message) {
  const banner = document.getElementById('offline-alert-banner');
  const text = document.getElementById('offline-banner-text');
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

function showStationaryPrompt() {
  if (appState.isWaitingForPassenger || appState.stationaryPromptDismissed) return;
  const prompt = document.getElementById('stationary-prompt');
  if (prompt) prompt.hidden = false;
  audioService.speak('Você está aguardando o passageiro?', true);
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
  const setupIsHidden = document.getElementById('setup-page-container')?.classList.contains('hidden');
  return Boolean(
    appState.activeRouteData
    && setupIsHidden
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
      exitPassengerWaitingMode(true);
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
    gpsEngine?.stopGpsTracking();
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
  updateSimulatorUI(simulatorState.enabled ? 'Parado' : 'GPS real');

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

function returnToRealGps() {
  pauseNavigationSimulator();
  simulatorState.enabled = false;
  simulatorState.position = null;
  simulatorState.coordIndex = 0;
  if (appState.isWaitingForPassenger) exitPassengerWaitingMode(false);
  resetStationaryTracking(true);
  updateSimulatorUI('GPS real');
  gpsEngine?.startGpsTracking();
}

function initializeNavigationSimulator() {
  const panel = document.getElementById('navigation-simulator');
  const queryEnabled = new URLSearchParams(window.location.search).get('simulator') === '1';
  if (panel) panel.hidden = !(import.meta.env.DEV || queryEnabled);
  updateSimulatorUI('GPS real');
}

/**
 * Inicialização dos Componentes
 */
async function initializeApp() {
  // 1. Carrega o destino ativo do cache persistente ou padrão
  const savedDest = storageService.loadActiveDestination() || APP_CONFIG.defaultRoute.destination;
  appState.currentDestination = savedDest;

  const fallbackCenter = [savedDest.lat, savedDest.lng];

  // 2. Inicializa o Mapa em Modo 3D Waze
  mapManager = new MapManager('map-container', {
    onCameraModeChange: (isFollowing) => updateRecenterButton(isFollowing)
  });
  mapManager.init(fallbackCenter, 19.3);

  // 3. Inicializa o Topo Waze
  navigationBar = new NavigationBar('waze-top-bar', {
    onToggleSound: (btn) => toggleAudio(btn),
    onOpenSetup: () => openSetupScreen()
  });
  navigationBar.render();

  // 4. Inicializa o Velocímetro
  speedometer = new Speedometer('speedometer-widget', {
    speedLimit: null
  });
  speedometer.init();

  // 5. Inicializa o Card Inferior
  rideSheet = new RideSheet('ride-bottom-sheet', {
    onBackClick: () => openSetupScreen(),
    onStatusChange: (status) => {
      if (status === 'waiting') {
        enterPassengerWaitingMode(false);
      } else {
        exitPassengerWaitingMode(false);
      }
    }
  });
  rideSheet.setRouteInfo(
    'Minha Localização Atual (GPS)',
    appState.currentDestination.name || 'Destino Selecionado'
  );

  // 6. Inicializa a Tela de Configuração
  setupScreen = new RouteSetupScreen('setup-page-container', {
    profile: 'driver',
    onStartRoute: async (routeConfig) => {
      appState.currentDestination = routeConfig.destination;
      storageService.saveActiveDestination(routeConfig.destination);
      await startNavigationFromGps(routeConfig.destination);
    }
  });
  setupScreen.init();
  setupScreen.setDestination(appState.currentDestination);

  // 7. Inicializa o Motor de Navegação GPS Real
  gpsEngine = new GpsNavigationEngine({
    onUpdate: (state) => handleGpsUpdate(state),
    onOffRoute: (offRoutePos, distance) => handleOffRouteDetected(offRoutePos, distance),
    onStepChange: (step, dist) => handleStepChange(step, dist),
    onDestinationReached: () => handleDestinationReached(),
    onGpsError: (msg) => handleGpsError(msg)
  });

  // Conecta botões e eventos
  setupUIEventListeners();
  initializeNavigationSimulator();

  // 8. Obtém a localização GPS atual e calcula a rota para o destino
  requestGpsAndCalculateRoute();
}

/**
 * Solicita a posição GPS atual do usuário e calcula a rota até o destino ativo
 */
function requestGpsAndCalculateRoute() {
  if (!('geolocation' in navigator)) {
    showOfflineAlert('Seu navegador não possui suporte a GPS.');
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const gpsCoords = [pos.coords.latitude, pos.coords.longitude];
      appState.currentVehiclePos = gpsCoords;
      appState.userCurrentGps = gpsCoords;

      mapManager.map.setView(gpsCoords, 19.3);
      mapManager.updateVehiclePosition(gpsCoords, 0);

      await calculateAndApplyRoute(gpsCoords, appState.currentDestination, true);

      // Inicia rastreamento contínuo
      gpsEngine.startGpsTracking();
    },
    (err) => {
      console.warn('Erro ao obter GPS inicial:', err);
      showOfflineAlert('GPS desativado ou permissão negada. Ative o GPS para traçar a rota.');
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

/**
 * Inicia navegação recalculando a rota a partir do GPS atual para um novo destino
 */
async function startNavigationFromGps(destination) {
  if (appState.isWaitingForPassenger) exitPassengerWaitingMode(false);
  resetStationaryTracking(true);
  appState.currentDestination = destination;
  rideSheet.setRouteInfo('Minha Localização Atual (GPS)', destination.name || destination.address);

  if (appState.currentVehiclePos) {
    await calculateAndApplyRoute(appState.currentVehiclePos, destination, true);
    gpsEngine.startGpsTracking();
  } else {
    requestGpsAndCalculateRoute();
  }
}

/**
 * Calcula a rota TomTom com trânsito ao vivo entre o GPS atual e o destino
 */
async function calculateAndApplyRoute(startGps, destination, isInitial = false) {
  const destCoords = [destination.lat, destination.lng];

  try {
    const routeData = await fetchTomTomRoute(startGps, destCoords);

    if (!routeData || routeData.success === false) {
      showOfflineAlert(routeData?.message || 'Sem conexão para carregar a rota.');
      return null;
    }

    hideOfflineAlert();
    appState.activeRouteData = routeData;

    mapManager.drawRoute(routeData.coordinates, routeData.trafficSections);

    if (isInitial) {
      mapManager.setOriginMarker(startGps);
      mapManager.setDestinationMarker(destCoords);
      mapManager.updateVehiclePosition(startGps, 0);
      mapManager.map.setView(startGps, 19.3);
    }

    gpsEngine.setRoute(routeData);
    rideSheet.updateMetrics(routeData.distanceMeters, routeData.durationSeconds);

    if (routeData.steps && routeData.steps.length > 0) {
      navigationBar.update(routeData.steps[0], routeData.steps[0].distanceMeters, routeData.steps[1]);
    }

    return routeData;
  } catch (error) {
    console.error('Erro ao calcular rota TomTom:', error);
    showOfflineAlert('Erro de rede ao calcular trajeto. Verifique a internet.');
    return null;
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
 * Detecta desvio confirmado do traçado e solicita uma nova rota à TomTom.
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
  let recalculationSucceeded = false;

  console.log(`⚠️ Desvio detectado (${Math.round(deviationDistance)}m da rota). Recalculando trajeto...`);

  const banner = document.getElementById('reroute-banner');
  if (banner) {
    banner.classList.add('show');
  }

  audioService.playRerouteChime();
  audioService.speak('Você saiu da rota. Recalculando...', true);

  try {
    const destCoords = [appState.currentDestination.lat, appState.currentDestination.lng];
    const newRoute = await fetchTomTomRoute(currentVehiclePos, destCoords);

    if (newRoute && newRoute.success !== false) {
      recalculationSucceeded = true;
      appState.activeRouteData = newRoute;

      mapManager.drawRoute(newRoute.coordinates, newRoute.trafficSections);
      gpsEngine.setRoute(newRoute);

      if (newRoute.steps.length > 0) {
        navigationBar.update(newRoute.steps[0], newRoute.steps[0].distanceMeters, newRoute.steps[1]);
        audioService.speak(newRoute.steps[0].instruction);
      }
    } else {
      showOfflineAlert(newRoute?.message || 'Não foi possível recalcular a rota agora. Uma nova tentativa será feita.');
    }
  } catch (err) {
    console.error('Falha ao recalcular rota:', err);
    showOfflineAlert('Falha ao recalcular a rota. Uma nova tentativa será feita automaticamente.');
  } finally {
    // Em sucesso, setRoute já libera o motor; em falha, isto garante novas tentativas.
    if (!recalculationSucceeded) gpsEngine?.finishRerouting();
    setTimeout(() => {
      if (banner) banner.classList.remove('show');
      appState.isRecalculating = false;
    }, 1200);
  }
}

/**
 * Reposiciona o veículo manualmente
 */
function handleVehicleReposition(newPos) {
  appState.currentVehiclePos = newPos;
  if (gpsEngine) {
    gpsEngine.processGpsUpdate(newPos, gpsEngine.currentBearing, gpsEngine.currentSpeedKmH);
  }
}

/**
 * Trata erros de GPS
 */
function handleGpsError(msg) {
  showOfflineAlert(msg || 'Sinal de GPS indisponível.');
}

/**
 * Chegada ao Destino
 */
function handleDestinationReached() {
  hideStationaryPrompt();
  resetStationaryTracking(true);
  audioService.playArrivalFanfare();
  audioService.speak('Você chegou ao seu destino.', true);
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
 * Abre a rota no Waze a partir da coordenada do destino (100% Gratuito)
 */
function openInWaze() {
  if (!appState.currentDestination) return;

  const destPos = [
    appState.currentDestination.lat,
    appState.currentDestination.lng
  ];

  const wazeUrl = `https://waze.com/ul?ll=${destPos[0]},${destPos[1]}&navigate=yes`;
  window.open(wazeUrl, '_blank');
}

/**
 * Abre a rota no Google Maps a partir do GPS atual até o destino (100% Gratuito)
 */
function openInGoogleMaps() {
  if (!appState.currentDestination) return;

  const curPos = appState.currentVehiclePos || [
    appState.currentDestination.lat,
    appState.currentDestination.lng
  ];
  const destPos = [
    appState.currentDestination.lat,
    appState.currentDestination.lng
  ];

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${curPos[0]},${curPos[1]}&destination=${destPos[0]},${destPos[1]}&travelmode=driving`;
  window.open(googleMapsUrl, '_blank');
}

function openSetupScreen() {
  hideStationaryPrompt();
  resetStationaryTracking(true);
  setupScreen.setDestination(appState.currentDestination);
  setupScreen.show();
}

/**
 * Configuração dos Eventos da Interface
 */
function setupUIEventListeners() {
  addFastClickListener(document.getElementById('btn-resume-waiting'), () => {
    exitPassengerWaitingMode(true);
  });

  addFastClickListener(document.getElementById('btn-simulator-play'), playNavigationSimulator);
  addFastClickListener(document.getElementById('btn-simulator-pause'), pauseNavigationSimulator);
  addFastClickListener(document.getElementById('btn-simulator-waiting'), testPassengerWaitingPrompt);
  addFastClickListener(document.getElementById('btn-simulator-gps'), returnToRealGps);

  addFastClickListener(document.getElementById('btn-stationary-no'), () => {
    hideStationaryPrompt();
    clearStationaryTimeout();
    appState.stationaryPromptDismissed = true;
  });

  addFastClickListener(document.getElementById('btn-stationary-yes'), () => {
    enterPassengerWaitingMode(true);
  });

  addFastClickListener(document.getElementById('btn-open-setup'), () => {
    openSetupScreen();
  });

  addFastClickListener(document.getElementById('fab-recenter'), () => {
    mapManager.setFollowVehicle(true);
    updateRecenterButton(true);
    if (appState.currentVehiclePos) {
      mapManager.map.setView(appState.currentVehiclePos, 19.3);
    }
  });

  // Botão de Abrir Rota no Waze
  addFastClickListener(document.getElementById('btn-waze-nav'), () => {
    openInWaze();
  });

  // Botão de Abrir Rota no Google Maps
  addFastClickListener(document.getElementById('btn-google-maps-nav'), () => {
    openInGoogleMaps();
  });

  // Botão de Tentar Novamente no Banner Offline / GPS
  addFastClickListener(document.getElementById('btn-offline-retry'), async () => {
    hideOfflineAlert();
    requestGpsAndCalculateRoute();
  });

  // Escuta status de conexão do navegador
  window.addEventListener('offline', () => {
    showOfflineAlert('Você perdeu a conexão com a internet.');
  });

  window.addEventListener('online', () => {
    hideOfflineAlert();
    if (appState.currentVehiclePos && appState.currentDestination) {
      calculateAndApplyRoute(appState.currentVehiclePos, appState.currentDestination, false);
    }
  });
}

export function mountDriverApp() {
  document.documentElement.dataset.appRole = 'driver';

  const startDriverApp = () => {
    renderDriverShell(document.getElementById('app'));
    document.title = 'Navegação do Motorista - Sistema de Frotas';
    initializeApp();
  };

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', startDriverApp, { once: true });
    return;
  }

  startDriverApp();
}
