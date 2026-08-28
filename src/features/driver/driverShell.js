import googleMapsLogoUrl from './assets/google-maps-logo.png';
import wazeLogoUrl from './assets/waze-logo.png';

export function renderDriverShell(root) {
  if (!root) {
    throw new Error('Elemento raiz da aplicação não encontrado.');
  }

  root.className = 'driver-app';
  root.dataset.roleRoot = 'driver';
  root.innerHTML = `
    <div id="map-viewport">
      <div id="map-rotator">
        <div id="map-container"></div>
      </div>
    </div>

    <div class="ui-overlay">
      <div class="waze-top-bar" id="waze-top-bar"></div>

      <div class="waiting-mode-card" id="waiting-mode-card" role="status" hidden>
        <div class="waiting-mode-icon" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round">
            <line x1="9" y1="5" x2="9" y2="19"></line>
            <line x1="15" y1="5" x2="15" y2="19"></line>
          </svg>
        </div>
        <div class="waiting-mode-info">
          <strong>Modo de espera</strong>
          <span id="waiting-mode-duration">Aguardando passageiro · iniciado agora</span>
        </div>
        <button type="button" class="waiting-mode-resume" id="btn-resume-waiting">Retomar corrida</button>
      </div>

      <section class="navigation-simulator" id="navigation-simulator" aria-label="Simulador de navegação" hidden>
        <div class="simulator-header">
          <strong>Simulador</strong>
          <span id="simulator-status">Pronto para simular</span>
        </div>
        <div class="simulator-actions">
          <button type="button" class="simulator-btn play" id="btn-simulator-play">▶ Play</button>
          <button type="button" class="simulator-btn pause" id="btn-simulator-pause">Ⅱ Pausar</button>
          <button type="button" class="simulator-btn waiting" id="btn-simulator-waiting">Testar espera</button>
          <button type="button" class="simulator-btn gps" id="btn-simulator-gps">Reiniciar</button>
        </div>
      </section>

      <div class="reroute-banner" id="reroute-banner">
        <div class="reroute-spinner"></div>
        <span>Fora da rota! Recalculando trajeto...</span>
      </div>

      <div class="offline-alert-banner" id="offline-alert-banner">
        <div class="offline-icon-box">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF4B4B" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="1" y1="1" x2="23" y2="23"/>
            <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/>
            <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/>
            <path d="M10.71 5.05A16 16 0 0 1 22.58 9"/>
            <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/>
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
            <line x1="12" y1="20" x2="12.01" y2="20"/>
          </svg>
        </div>
        <div class="offline-banner-content">
          <span class="offline-banner-title">Dispositivo Offline</span>
          <span class="offline-banner-desc" id="offline-banner-text">Não foi possível calcular o trajeto. Verifique a internet.</span>
        </div>
      </div>

      <button type="button" class="btn-recenter-map" id="fab-recenter" title="Recentralizar no GPS" aria-label="Centralizar mapa no veículo">
        <span class="recenter-icon" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 3.5 5.25 20.25 12 17.3l6.75 2.95L12 3.5Z"></path>
          </svg>
        </span>
        <span class="recenter-label">Recentralizar</span>
      </button>

      <div class="speedometer-widget" id="speedometer-widget" title="Clique para mudar velocidade"></div>

      <button type="button" class="btn-sound-nav active" id="btn-sound-nav" title="Silenciar instruções" aria-label="Silenciar instruções de voz" aria-pressed="true">
        <svg class="nav-sound-icon" width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M11 5 6.5 9H3v6h3.5L11 19V5Z"></path>
          <path class="sound-waves" d="M15.2 8.5a5 5 0 0 1 0 7M18.1 5.8a9 9 0 0 1 0 12.4"></path>
          <path class="muted-slash" d="m15.5 9 5 5m0-5-5 5"></path>
        </svg>
      </button>

      <button type="button" class="btn-waze-nav" id="btn-waze-nav" title="Abrir trajeto no Waze" aria-label="Abrir trajeto no Waze">
        <span class="waze-icon-badge" aria-hidden="true">
          <img class="external-nav-logo waze-nav-logo" src="${wazeLogoUrl}" alt="">
        </span>
        <span class="badge-tooltip">Abrir no Waze</span>
      </button>

      <button type="button" class="btn-google-maps-nav" id="btn-google-maps-nav" title="Abrir trajeto no Google Maps" aria-label="Abrir trajeto no Google Maps">
        <span class="gmaps-icon-badge" aria-hidden="true">
          <img class="external-nav-logo google-maps-nav-logo" src="${googleMapsLogoUrl}" alt="">
        </span>
        <span class="badge-tooltip">Abrir no Google Maps</span>
      </button>

      <div class="ride-bottom-sheet collapsed" id="ride-bottom-sheet"></div>
    </div>

    <div class="stationary-prompt-overlay" id="stationary-prompt" role="dialog" aria-modal="true" aria-labelledby="stationary-prompt-title" hidden>
      <div class="stationary-prompt-card">
        <p>Notamos que você está parado há mais de 5 minutos.</p>
        <h2 id="stationary-prompt-title">Está aguardando o passageiro?</h2>
        <div class="stationary-prompt-actions">
          <button type="button" class="stationary-prompt-btn no" id="btn-stationary-no">Não</button>
          <button type="button" class="stationary-prompt-btn yes" id="btn-stationary-yes">Sim</button>
        </div>
      </div>
    </div>

    <div class="stationary-prompt-overlay" id="trip-finish-prompt" role="dialog" aria-modal="true" aria-labelledby="trip-finish-title" hidden>
      <div class="stationary-prompt-card">
        <h2 id="trip-finish-title">Você deseja finalizar a corrida?</h2>
        <div class="stationary-prompt-actions">
          <button type="button" class="stationary-prompt-btn no" id="btn-finish-no">Não</button>
          <button type="button" class="stationary-prompt-btn yes" id="btn-finish-yes">Sim</button>
        </div>
      </div>
    </div>

    <div class="stationary-prompt-overlay" id="trip-complete-overlay" role="dialog" aria-modal="true" aria-labelledby="trip-complete-title" hidden>
      <div class="stationary-prompt-card trip-complete-card">
        <div class="trip-complete-check" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h2 id="trip-complete-title">Viagem concluída!</h2>
        <p>Os dados desta viagem ficarão disponíveis no histórico do aplicativo.</p>
        <button type="button" class="trip-complete-close" id="btn-complete-close">Fechar</button>
      </div>
    </div>
  `;
}
