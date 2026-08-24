export function renderDriverShell(root) {
  if (!root) {
    throw new Error('Elemento raiz da aplicação não encontrado.');
  }

  root.className = 'driver-app';
  root.dataset.roleRoot = 'driver';
  root.innerHTML = `
    <div id="setup-page-container" class="setup-page-container hidden"></div>

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

      <button class="btn-back-to-setup" id="btn-open-setup" title="Configurar nova rota">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        <span>Nova Rota</span>
      </button>

      <section class="navigation-simulator" id="navigation-simulator" aria-label="Simulador de navegação" hidden>
        <div class="simulator-header">
          <strong>Simulador</strong>
          <span id="simulator-status">GPS real</span>
        </div>
        <div class="simulator-actions">
          <button type="button" class="simulator-btn play" id="btn-simulator-play">▶ Play</button>
          <button type="button" class="simulator-btn pause" id="btn-simulator-pause">Ⅱ Pausar</button>
          <button type="button" class="simulator-btn waiting" id="btn-simulator-waiting">Testar espera</button>
          <button type="button" class="simulator-btn gps" id="btn-simulator-gps">Voltar ao GPS</button>
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
        <button type="button" class="btn-offline-retry" id="btn-offline-retry" title="Tentar carregar novamente">Reconectar</button>
      </div>

      <button type="button" class="btn-recenter-map" id="fab-recenter" title="Recentralizar no GPS">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
        </svg>
        <span class="recenter-label">Centrar</span>
      </button>

      <div class="speedometer-widget" id="speedometer-widget" title="Clique para mudar velocidade"></div>

      <button class="btn-waze-nav" id="btn-waze-nav" title="Abrir trajeto no Waze">
        <div class="waze-icon-badge">
          <svg width="26" height="26" viewBox="0 0 48 48" fill="none">
            <path d="M37.5 19.5c0-8.28-6.72-15-15-15s-15 6.72-15 15c0 3.3.9 6.3 2.7 9l-2.7 7.5 7.8-2.4c2.1 1.2 4.5 1.9 7.2 1.9 8.28 0 15-6.72 15-15z" fill="#33CCFF"/>
            <circle cx="16" cy="18" r="3" fill="#1E224F"/>
            <circle cx="28" cy="18" r="3" fill="#1E224F"/>
            <path d="M19 24c1.5 2 4.5 2 6 0" stroke="#1E224F" stroke-width="2.5" stroke-linecap="round"/>
            <ellipse cx="14" cy="36" rx="3.5" ry="3.5" fill="#1E224F"/>
            <ellipse cx="28" cy="36" rx="3.5" ry="3.5" fill="#1E224F"/>
          </svg>
        </div>
        <span class="badge-tooltip">Abrir no Waze</span>
      </button>

      <button class="btn-google-maps-nav" id="btn-google-maps-nav" title="Abrir trajeto no Google Maps">
        <div class="gmaps-icon-badge">
          <svg width="26" height="26" viewBox="0 0 48 48">
            <path fill="#4285F4" d="M24 4C14.06 4 6 12.06 6 22c0 8.07 5.37 14.88 12.75 17.15L24 44l5.25-4.85C36.63 36.88 42 30.07 42 22c0-9.94-8.06-18-18-18z"/>
            <path fill="#34A853" d="M24 4c-9.94 0-18 8.06-18 18 0 4.12 1.39 7.91 3.73 10.95L24 22V4z"/>
            <path fill="#FBBC05" d="M24 4v18l14.27 10.95C40.61 29.91 42 26.12 42 22c0-9.94-8.06-18-18-18z"/>
            <path fill="#EA4335" d="M24 44v-4.85C16.62 36.88 11.25 30.07 11.25 22H6c0 8.07 5.37 14.88 12.75 17.15L24 44z"/>
            <circle fill="#ffffff" cx="24" cy="22" r="7"/>
            <circle fill="#4285F4" cx="24" cy="22" r="4.5"/>
          </svg>
        </div>
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
  `;
}
