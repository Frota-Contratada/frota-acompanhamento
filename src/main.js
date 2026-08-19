/**
 * Ponto de Entrada Principal da Aplicação
 * Navegação Automotiva 100% Baseada em GPS Real (Sem Simulação)
 * Orquestra Mapa 3D, Roteamento OSRM em Tempo Real, Topo Waze, GPS dos Sensores, Card Inferior e Integrações
 */

import { APP_CONFIG } from './config.js';
import { fetchOSRMRoute } from './services/osrmService.js';
import { audioService } from './services/audioService.js';
import { calculateDistance, formatDistance } from './services/geoUtils.js';
import { storageService } from './services/storageService.js';
import { GpsNavigationEngine } from './services/gpsNavigationEngine.js';
import { MapManager } from './components/mapManager.js';
import { NavigationBar } from './components/navigationBar.js';
import { Speedometer } from './components/speedometer.js';
import { RideSheet } from './components/rideSheet.js';
import { SetupScreen } from './components/setupScreen.js';
import { addFastClickListener } from './utils/domUtils.js';

// Estado global da aplicação
const appState = {
  currentDestination: null,
  currentVehiclePos: null,
  activeRouteData: null,
  isRecalculating: false,
  rerouteCount: 0,
  isSoundActive: true,
  userCurrentGps: null
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
    onStatusChange: () => {}
  });
  rideSheet.setRouteInfo(
    'Minha Localização Atual (GPS)',
    appState.currentDestination.name || 'Destino Selecionado'
  );

  // 6. Inicializa a Tela de Configuração
  setupScreen = new SetupScreen('setup-page-container', {
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
 * Calcula a rota OSRM entre o ponto GPS atual e o destino
 */
async function calculateAndApplyRoute(startGps, destination, isInitial = false) {
  const destCoords = [destination.lat, destination.lng];

  try {
    const routeData = await fetchOSRMRoute(startGps, destCoords);

    if (!routeData || routeData.success === false) {
      showOfflineAlert(routeData?.message || 'Sem conexão para carregar a rota.');
      return null;
    }

    hideOfflineAlert();
    appState.activeRouteData = routeData;

    mapManager.drawRoute(routeData.coordinates);

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
    console.error('Erro ao calcular rota OSRM:', error);
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
    remainingCoordinates
  } = state;

  appState.currentVehiclePos = position;

  mapManager.updateVehiclePosition(position, bearing);
  mapManager.updateRemainingRoute(remainingCoordinates);
  speedometer.setSpeed(speedKmH);

  if (activeStep) {
    navigationBar.update(activeStep, distanceToStep, nextStep);
  }

  rideSheet.updateMetrics(remainingDistanceMeters, remainingDurationSeconds);
}

/**
 * Quando a navegação entra em uma nova manobra
 */
function handleStepChange(step, distance) {
  audioService.playTurnChime();
  audioService.speak(step.instruction);
}

/**
 * DETECÇÃO DE DESVIO DE ROTA (> 45m do traçado)
 */
async function handleOffRouteDetected(currentVehiclePos, deviationDistance) {
  if (appState.isRecalculating) return;
  appState.isRecalculating = true;
  appState.rerouteCount++;

  console.log(`⚠️ Desvio detectado (${Math.round(deviationDistance)}m da rota). Recalculando trajeto...`);

  const banner = document.getElementById('reroute-banner');
  if (banner) {
    banner.classList.add('show');
  }

  audioService.playRerouteChime();
  audioService.speak('Você saiu da rota. Recalculando...', true);

  try {
    const destCoords = [appState.currentDestination.lat, appState.currentDestination.lng];
    const newRoute = await fetchOSRMRoute(currentVehiclePos, destCoords);

    if (newRoute && newRoute.success !== false) {
      appState.activeRouteData = newRoute;

      mapManager.drawRoute(newRoute.coordinates);
      gpsEngine.setRoute(newRoute);

      if (newRoute.steps.length > 0) {
        navigationBar.update(newRoute.steps[0], newRoute.steps[0].distanceMeters, newRoute.steps[1]);
        audioService.speak(newRoute.steps[0].instruction);
      }
    }
  } catch (err) {
    console.error('Falha ao recalcular rota:', err);
  } finally {
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
  setupScreen.setDestination(appState.currentDestination);
  setupScreen.show();
}

/**
 * Configuração dos Eventos da Interface
 */
function setupUIEventListeners() {
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

window.addEventListener('DOMContentLoaded', initializeApp);
