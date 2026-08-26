export function renderPassengerShell(root) {
  if (!root) throw new Error('Elemento raiz da aplicação não encontrado.');

  root.className = 'passenger-app';
  root.dataset.roleRoot = 'passenger';
  root.innerHTML = `
    <main class="passenger-map-screen" aria-label="Acompanhamento da corrida">
      <div id="passenger-map"></div>

      <div class="passenger-ui-layer">
        <header class="passenger-status-card">
          <div class="passenger-status-icon" aria-hidden="true">
            <span></span>
          </div>
          <div class="passenger-status-copy">
            <span class="passenger-eyebrow">Corrida em andamento</span>
            <strong id="passenger-destination-name">Carregando destino…</strong>
          </div>
          <div class="passenger-live-badge"><i></i> Ao vivo</div>
        </header>

        <section class="passenger-simulator" id="passenger-simulator" aria-label="Simulador do veículo" hidden>
          <div>
            <strong>Simulador</strong>
            <span id="passenger-simulator-status">Pronto para simular</span>
          </div>
          <div class="passenger-simulator-actions">
            <button type="button" id="passenger-simulator-play">▶ Play</button>
            <button type="button" id="passenger-simulator-pause">Ⅱ Pausar</button>
            <button type="button" id="passenger-simulator-gps">Reiniciar</button>
          </div>
        </section>

        <div class="passenger-alert" id="passenger-alert" role="alert" hidden>
          <div>
            <strong id="passenger-alert-title">Não foi possível atualizar a corrida</strong>
            <span id="passenger-alert-text">Verifique sua conexão e tente novamente.</span>
          </div>
        </div>

        <button type="button" class="passenger-overview-button" id="passenger-recenter" title="Mostrar a rota completa" aria-hidden="true" disabled>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 6.5 9 3l6 3.5L21 3v14.5L15 21l-6-3.5L3 21V6.5Z"/>
            <path d="M9 3v14.5M15 6.5V21"/>
          </svg>
          <span>Ver rota inteira</span>
        </button>

        <section class="passenger-ride-card" id="passenger-ride-card" aria-live="polite"></section>
      </div>
    </main>
  `;
}
