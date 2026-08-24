/**
 * Componente da Página de Configuração de Destino
 * Ponto de partida restrito 100% ao GPS real do usuário.
 */

import { DEFAULT_ROUTE } from '../config/routeConfig.js';
import { addFastClickListener } from '../utils/domUtils.js';
import { storageService } from '../services/storageService.js';
import { autocompleteAddress } from '../services/geocodingService.js';

export const FAVORITE_PLACES = [
  {
    id: 'casa',
    name: '🏠 Minha Casa',
    address: 'R. Lençóis, 85 - Vila Baruel, São Paulo - SP, 02523-030',
    lat: -23.507248,
    lng: -46.653695
  },
  {
    id: 'escola',
    name: '🏫 A Escola',
    address: 'R. Irineu José Bordon, 335 - Parque Anhanguera, São Paulo - SP, 05120-060',
    lat: -23.513207,
    lng: -46.731058
  },
  {
    id: 'paulista',
    name: '🏙️ Av. Paulista (MASP)',
    address: 'Av. Paulista, 1578 - Bela Vista, São Paulo - SP',
    lat: -23.5615,
    lng: -46.6559
  },
  {
    id: 'congonhas',
    name: '✈️ Aeroporto de Congonhas',
    address: 'Av. Washington Luís, s/n - Vila Congonhas, São Paulo - SP',
    lat: -23.6261,
    lng: -46.6553
  },
  {
    id: 'ibirapuera',
    name: '🌳 Parque Ibirapuera',
    address: 'Av. Pedro Álvares Cabral - Vila Mariana, São Paulo - SP',
    lat: -23.5874,
    lng: -46.6576
  },
  {
    id: 'londrina_aero',
    name: '✈️ Aeroporto de Londrina',
    address: 'Aeroporto de Londrina - Gov. José Richa, Londrina - PR',
    lat: -23.3328,
    lng: -51.1378
  }
];

export class RouteSetupScreen {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.options = options;
    this.currentDest = { ...DEFAULT_ROUTE.destination };
    this.userGpsCoords = null;
    this.isGpsReady = false;
    this.gpsErrorMessage = null;
    this.searchTimer = null;
    this.searchController = null;
    this.isGpsRequestPending = false;
  }

  init() {
    this.checkGpsAvailability();
    this.render();
  }

  show() {
    if (this.container) {
      this.container.classList.remove('hidden');
      if (!this.isGpsReady) {
        this.checkGpsAvailability();
      } else {
        this.updateGpsStatusUI();
      }
    }
  }

  hide() {
    this.cancelAddressSearch();
    if (document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }
    if (this.container) {
      this.container.classList.add('hidden');
    }
  }

  setDestination(destination) {
    if (destination) {
      this.currentDest = { ...destination };
      this.render();
    }
  }

  checkGpsAvailability() {
    if (!('geolocation' in navigator)) {
      this.isGpsReady = false;
      this.gpsErrorMessage = 'Geolocalização não suportada no seu dispositivo.';
      this.updateGpsStatusUI();
      return;
    }

    if (this.isGpsRequestPending) return;
    this.isGpsRequestPending = true;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.isGpsRequestPending = false;
        this.userGpsCoords = [pos.coords.latitude, pos.coords.longitude];
        this.isGpsReady = true;
        this.gpsErrorMessage = null;
        this.updateGpsStatusUI();
      },
      (err) => {
        this.isGpsRequestPending = false;
        console.warn('GPS não autorizado na tela de setup:', err);

        // Timeout e indisponibilidade podem ocorrer momentaneamente. Se já existe
        // uma posição válida, ela continua adequada para iniciar a rota.
        if (err.code !== err.PERMISSION_DENIED && this.userGpsCoords) {
          this.isGpsReady = true;
          this.gpsErrorMessage = null;
          this.updateGpsStatusUI();
          return;
        }

        this.isGpsReady = false;
        this.gpsErrorMessage = err.code === err.PERMISSION_DENIED
          ? 'Permissão de localização negada. Libere o GPS nas configurações do navegador.'
          : 'Não foi possível obter sua posição agora. Aguarde alguns segundos e tente novamente.';
        this.updateGpsStatusUI();
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
    );
  }

  updateGpsStatusUI() {
    if (!this.container) return;

    const gpsStatusBadge = this.container.querySelector('#gps-live-status');
    const submitBtn = this.container.querySelector('#btn-submit-route');
    const gpsWarningBox = this.container.querySelector('#setup-gps-warning');

    if (this.isGpsReady && this.userGpsCoords) {
      if (gpsStatusBadge) {
        gpsStatusBadge.innerHTML = `
          <span class="gps-dot active"></span>
          <span>GPS Conectado (${this.userGpsCoords[0].toFixed(4)}, ${this.userGpsCoords[1].toFixed(4)})</span>
        `;
        gpsStatusBadge.className = 'setup-gps-badge ready';
      }
      if (gpsWarningBox) {
        gpsWarningBox.style.display = 'none';
      }
      if (submitBtn) {
        submitBtn.removeAttribute('disabled');
        submitBtn.classList.remove('disabled');
      }
    } else {
      if (gpsStatusBadge) {
        gpsStatusBadge.innerHTML = `
          <span class="gps-dot error"></span>
          <span>Aguardando GPS...</span>
        `;
        gpsStatusBadge.className = 'setup-gps-badge error';
      }
      if (gpsWarningBox) {
        gpsWarningBox.style.display = 'flex';
        gpsWarningBox.textContent = this.gpsErrorMessage || 'Ative a permissão de GPS para iniciar a navegação.';
      }
      if (submitBtn) {
        submitBtn.setAttribute('disabled', 'true');
        submitBtn.classList.add('disabled');
      }
    }
  }

  render() {
    if (!this.container) return;

    const isPassenger = this.options.profile === 'passenger';
    const badgeText = isPassenger ? 'Acompanhamento em Tempo Real' : 'Navegação GPS em Tempo Real';
    const subtitle = isPassenger
      ? 'Acompanhe o veículo e toda a rota até o destino em tempo real.'
      : 'O trajeto sempre parte da sua localização atual por GPS em tempo real.';
    const originText = isPassenger
      ? 'Localização Atual do Veículo (GPS em Tempo Real)'
      : 'Sua Localização Atual (GPS em Tempo Real)';
    const submitText = isPassenger ? 'Acompanhar Corrida' : 'Iniciar Navegação GPS';

    this.container.innerHTML = `
      <div class="setup-card">
        <div class="setup-header">
          <div class="setup-badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polygon points="12 8 8 12 12 16 12 8"/></svg>
            ${badgeText}
          </div>
          <h1 class="setup-title">Para Onde Vamos?</h1>
          <p class="setup-subtitle">${subtitle}</p>
        </div>

        <form id="setup-form" class="setup-form-group">
          <!-- Ponto de Início (Fixo no GPS) -->
          <div class="setup-input-block">
            <div class="setup-label-row">
              <label class="setup-input-label">
                <span class="setup-label-dot origin"></span>
                Ponto de Partida
              </label>
              <div class="setup-gps-badge ${this.isGpsReady ? 'ready' : 'error'}" id="gps-live-status">
                <span class="gps-dot ${this.isGpsReady ? 'active' : 'error'}"></span>
                <span>${this.isGpsReady && this.userGpsCoords ? `GPS Conectado` : 'Aguardando GPS...'}</span>
              </div>
            </div>
            <div class="setup-origin-gps-box">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
              <span>${originText}</span>
            </div>
            <div id="setup-gps-warning" class="setup-gps-warning" style="display: ${this.isGpsReady ? 'none' : 'flex'};">
              ${this.gpsErrorMessage || 'Ative a permissão de GPS para iniciar a navegação.'}
            </div>
          </div>

          <!-- Ponto de Destino -->
          <div class="setup-input-block">
            <label class="setup-input-label">
              <span class="setup-label-dot dest"></span>
              Ponto de Chegada (Destino)
            </label>
            <div class="setup-autocomplete">
              <input type="text" class="setup-text-input" id="input-dest-name" value="${this.currentDest.name || ''}" placeholder="Digite rua, número e cidade" autocomplete="off" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="address-suggestions" required />
              <div id="address-suggestions" class="setup-address-suggestions" role="listbox" hidden></div>
            </div>
            <span id="address-search-status" class="setup-address-status" aria-live="polite">Digite pelo menos 3 caracteres e selecione um endereço.</span>
            <div class="setup-coords-row">
              <input type="number" step="any" class="setup-coord-input" id="input-dest-lat" value="${this.currentDest.lat || ''}" placeholder="Latitude" readonly required />
              <input type="number" step="any" class="setup-coord-input" id="input-dest-lng" value="${this.currentDest.lng || ''}" placeholder="Longitude" readonly required />
            </div>
          </div>

          <!-- Locais Padrões para Escolha Rápida -->
          <div class="setup-presets-section">
            <span class="setup-presets-title">Destinos Rápidos</span>
            <div class="setup-preset-chips">
              ${FAVORITE_PLACES.map(place => `
                <button type="button" class="preset-chip-btn" data-place-id="${place.id}">
                  <span class="preset-chip-name">${place.name}</span>
                  <span class="preset-chip-desc">${place.address.split('-')[0].trim()}</span>
                </button>
              `).join('')}
            </div>
          </div>

          <button type="submit" class="setup-submit-btn ${!this.isGpsReady ? 'disabled' : ''}" id="btn-submit-route" ${!this.isGpsReady ? 'disabled' : ''}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
            ${submitText}
          </button>
        </form>
      </div>
    `;

    this.bindEvents();
    this.updateGpsStatusUI();
  }

  bindEvents() {
    const addressInput = this.container.querySelector('#input-dest-name');
    if (addressInput) {
      addressInput.addEventListener('input', () => this.scheduleAddressSearch(addressInput.value));
      addressInput.addEventListener('keydown', (event) => this.handleSuggestionKeys(event));
      addressInput.addEventListener('blur', () => {
        window.setTimeout(() => this.closeSuggestions(), 150);
      });
    }

    const form = document.getElementById('setup-form');
    if (form) {
      form.onsubmit = (e) => {
        e.preventDefault();

        if (!this.isGpsReady || !this.userGpsCoords) {
          alert(this.options.profile === 'passenger'
            ? 'É necessário permitir o acesso à localização para acompanhar a corrida neste protótipo.'
            : 'É necessário permitir o acesso ao GPS do seu dispositivo para iniciar a navegação.');
          this.checkGpsAvailability();
          return;
        }

        const destName = document.getElementById('input-dest-name').value;
        const destLat = parseFloat(document.getElementById('input-dest-lat').value);
        const destLng = parseFloat(document.getElementById('input-dest-lng').value);

        if (!Number.isFinite(destLat) || !Number.isFinite(destLng)) {
          alert('Selecione um endereço válido na lista de sugestões.');
          return;
        }

        const destination = {
          name: destName,
          lat: destLat,
          lng: destLng
        };

        const routeConfig = {
          name: `Meu GPS ➔ ${destName}`,
          origin: {
            lat: this.userGpsCoords[0],
            lng: this.userGpsCoords[1],
            name: 'Minha Localização Atual (GPS)'
          },
          destination
        };

        // Salva destino ativo para recálculo automático em reload
        storageService.saveActiveDestination(destination);

        this.hide();

        if (this.options.onStartRoute) {
          this.options.onStartRoute(routeConfig);
        }
      };
    }

    // Chips de Destino Rápido
    const placeBtns = this.container.querySelectorAll('.preset-chip-btn');
    placeBtns.forEach(btn => {
      addFastClickListener(btn, () => {
        const id = btn.getAttribute('data-place-id');
        const place = FAVORITE_PLACES.find(p => p.id === id);
        if (place) {
          document.getElementById('input-dest-name').value = place.address;
          document.getElementById('input-dest-lat').value = place.lat;
          document.getElementById('input-dest-lng').value = place.lng;
          this.setAddressStatus('Destino selecionado.', 'success');
          this.closeSuggestions();
        }
      });
    });
  }

  scheduleAddressSearch(query) {
    window.clearTimeout(this.searchTimer);
    this.searchController?.abort();
    this.clearDestinationCoordinates();

    const normalizedQuery = query.trim();
    if (normalizedQuery.length < 3) {
      this.closeSuggestions();
      this.setAddressStatus('Digite pelo menos 3 caracteres e selecione um endereço.');
      return;
    }

    this.setAddressStatus('Buscando endereços...');
    this.searchTimer = window.setTimeout(() => this.searchAddresses(normalizedQuery), 500);
  }

  async searchAddresses(query) {
    this.searchController = new AbortController();
    try {
      const places = await autocompleteAddress(query, {
        signal: this.searchController.signal,
        bias: this.userGpsCoords
      });
      this.renderSuggestions(places);
      this.setAddressStatus(places.length ? 'Selecione uma das sugestões.' : 'Nenhum endereço encontrado.');
    } catch (error) {
      if (error.name === 'AbortError') return;
      console.error('Erro no autocomplete de endereço:', error);
      this.closeSuggestions();
      this.setAddressStatus('Não foi possível buscar endereços. Tente novamente.', 'error');
    }
  }

  renderSuggestions(places) {
    const list = this.container.querySelector('#address-suggestions');
    const input = this.container.querySelector('#input-dest-name');
    if (!list || !input) return;

    list.replaceChildren();
    places.forEach((place) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'setup-address-option';
      button.setAttribute('role', 'option');
      button.textContent = place.address;
      button.addEventListener('click', () => this.selectAddress(place));
      list.appendChild(button);
    });

    list.hidden = places.length === 0;
    input.setAttribute('aria-expanded', String(places.length > 0));
  }

  selectAddress(place) {
    this.container.querySelector('#input-dest-name').value = place.address;
    this.container.querySelector('#input-dest-lat').value = place.lat;
    this.container.querySelector('#input-dest-lng').value = place.lng;
    this.setAddressStatus('Endereço selecionado e coordenadas preenchidas.', 'success');
    this.closeSuggestions();
  }

  handleSuggestionKeys(event) {
    const options = [...this.container.querySelectorAll('.setup-address-option')];
    if (!options.length || !['ArrowDown', 'ArrowUp'].includes(event.key)) return;
    event.preventDefault();
    (event.key === 'ArrowDown' ? options[0] : options[options.length - 1]).focus();
  }

  clearDestinationCoordinates() {
    const lat = this.container.querySelector('#input-dest-lat');
    const lng = this.container.querySelector('#input-dest-lng');
    if (lat) lat.value = '';
    if (lng) lng.value = '';
  }

  setAddressStatus(message, type = '') {
    const status = this.container.querySelector('#address-search-status');
    if (!status) return;
    status.textContent = message;
    status.className = `setup-address-status${type ? ` ${type}` : ''}`;
  }

  closeSuggestions() {
    const list = this.container.querySelector('#address-suggestions');
    const input = this.container.querySelector('#input-dest-name');
    if (list) list.hidden = true;
    if (input) input.setAttribute('aria-expanded', 'false');
  }

  cancelAddressSearch() {
    window.clearTimeout(this.searchTimer);
    this.searchController?.abort();
  }
}
