/**
 * Serviço de Armazenamento Local (localStorage) para Cache de Rotas e Estado da Corrida.
 */

const STORAGE_KEYS = {
  ACTIVE_RIDE: 'frota_active_ride',
  ROUTE_CACHE_PREFIX: 'frota_route_cache_'
};

let lastSaveTimestamp = 0;
const SAVE_DEBOUNCE_MS = 800; // Salva o progresso a cada 800ms durante a simulação

export const storageService = {
  /**
   * Salva a corrida ativa completa (configuração, geometria da rota e progresso atual)
   */
  saveActiveRide(routeConfig, routeData, progress = null) {
    if (!routeConfig || !routeData) return;

    try {
      const payload = {
        routeConfig,
        routeData,
        progress: progress || {
          currentCoordIndex: 0,
          subProgress: 0,
          currentPosition: routeData.coordinates ? routeData.coordinates[0] : null,
          currentBearing: 0,
          activeStepIndex: 0,
          speedMultiplier: 1,
          currentSpeedIndex: 0
        },
        savedAt: Date.now()
      };

      localStorage.setItem(STORAGE_KEYS.ACTIVE_RIDE, JSON.stringify(payload));
    } catch (err) {
      console.warn('Falha ao salvar corrida ativa no localStorage:', err);
    }
  },

  /**
   * Atualiza apenas o progresso da corrida com throttling/debouncing para não afetar os 60 FPS
   */
  updateRideProgress(progress, force = false) {
    if (!progress) return;

    const now = Date.now();
    if (!force && (now - lastSaveTimestamp < SAVE_DEBOUNCE_MS)) {
      return;
    }
    lastSaveTimestamp = now;

    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_RIDE);
      if (!raw) return;

      const activeRide = JSON.parse(raw);
      activeRide.progress = {
        ...activeRide.progress,
        ...progress
      };
      activeRide.savedAt = now;

      localStorage.setItem(STORAGE_KEYS.ACTIVE_RIDE, JSON.stringify(activeRide));
    } catch (err) {
      console.warn('Falha ao atualizar progresso da corrida no cache:', err);
    }
  },

  /**
   * Carrega a corrida ativa salva no localStorage
   */
  loadActiveRide() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_RIDE);
      if (!raw) return null;

      const activeRide = JSON.parse(raw);
      if (!activeRide.routeConfig || !activeRide.routeData) {
        return null;
      }
      return activeRide;
    } catch (err) {
      console.warn('Falha ao carregar corrida ativa do localStorage:', err);
      return null;
    }
  },

  /**
   * Limpa a corrida ativa do cache (ex: ao chegar ao destino final)
   */
  clearActiveRide() {
    try {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_RIDE);
    } catch (err) {
      console.warn('Falha ao limpar corrida ativa do cache:', err);
    }
  },

  /**
   * Salva uma rota calculada no cache persistente
   */
  setCachedRoute(cacheKey, routeData) {
    try {
      localStorage.setItem(`${STORAGE_KEYS.ROUTE_CACHE_PREFIX}${cacheKey}`, JSON.stringify(routeData));
    } catch (err) {
      console.warn('Falha ao gravar rota calculada no cache persistente:', err);
    }
  },

  /**
   * Obtém uma rota calculada salva no cache persistente
   */
  getCachedRoute(cacheKey) {
    try {
      const raw = localStorage.getItem(`${STORAGE_KEYS.ROUTE_CACHE_PREFIX}${cacheKey}`);
      if (raw) return JSON.parse(raw);
    } catch (err) {
      console.warn('Falha ao ler rota calculada do cache persistente:', err);
    }
    return null;
  },

  /**
   * Salva o destino ativo para recálculo automático em caso de reload
   */
  saveActiveDestination(destination) {
    try {
      localStorage.setItem('frota_active_destination', JSON.stringify(destination));
    } catch (err) {
      console.warn('Falha ao salvar destino no cache:', err);
    }
  },

  /**
   * Obtém o destino ativo salvo no cache
   */
  loadActiveDestination() {
    try {
      const raw = localStorage.getItem('frota_active_destination');
      if (raw) return JSON.parse(raw);
    } catch (err) {
      console.warn('Falha ao ler destino do cache:', err);
    }
    return null;
  }
};
