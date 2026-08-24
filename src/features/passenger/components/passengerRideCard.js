import { formatDistance, formatDuration, formatETA } from '../../../shared/utils/geoUtils.js';

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export class PassengerRideCard {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.originName = 'Localização do veículo';
    this.destinationName = 'Destino';
    this.remainingDistance = null;
    this.remainingDuration = null;
    this.trafficDelay = 0;
  }

  setRouteInfo(originName, destinationName) {
    this.originName = originName || 'Localização do veículo';
    this.destinationName = destinationName || 'Destino';
    this.render();
  }

  updateMetrics(distanceMeters, durationSeconds, trafficDelaySeconds = 0) {
    this.remainingDistance = distanceMeters;
    this.remainingDuration = durationSeconds;
    this.trafficDelay = Math.max(0, trafficDelaySeconds || 0);
    this.render();
  }

  render() {
    if (!this.container) return;

    const trafficMinutes = Math.round(this.trafficDelay / 60);
    this.container.innerHTML = `
      <div class="passenger-card-summary">
        <div class="passenger-eta-block">
          <strong>${formatETA(this.remainingDuration)}</strong>
          <span>Chegada estimada</span>
        </div>
        <div class="passenger-metric">
          <strong>${formatDuration(this.remainingDuration)}</strong>
          <span>Tempo restante</span>
        </div>
        <div class="passenger-metric">
          <strong>${formatDistance(this.remainingDistance)}</strong>
          <span>Distância</span>
        </div>
      </div>

      <div class="passenger-route-row">
        <div class="passenger-route-line" aria-hidden="true"><i></i><span></span></div>
        <div class="passenger-route-names">
          <p><small>Origem</small><strong>${escapeHtml(this.originName)}</strong></p>
          <p><small>Destino</small><strong>${escapeHtml(this.destinationName)}</strong></p>
        </div>
        <div class="passenger-traffic-chip ${trafficMinutes > 0 ? 'delayed' : ''}">
          ${trafficMinutes > 0 ? `+${trafficMinutes} min no trânsito` : 'Trânsito normal'}
        </div>
      </div>
    `;
  }
}
