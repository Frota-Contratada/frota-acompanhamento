/**
 * Componente do Topo de Navegação Waze / Google Maps
 * Exibe instruções curva a curva usando SVGs locais, sem dependência de ícones.
 */

import { formatWazeDistance } from '../../../shared/utils/geoUtils.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export class NavigationBar {
  constructor(elementId, options = {}) {
    this.container = document.getElementById(elementId);
    this.options = options;
    this.currentStep = null;
    this.nextStep = null;
    this.distanceToStep = 0;
  }

  /**
   * Retorna o SVG local correspondente à manobra.
   */
  getManeuverSvg(iconType) {
    switch (iconType) {
      // Curva à Direita 90° (CornerUpRight)
      case 'corner-up-right':
        return `
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00E5FF" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" class="waze-maneuver-svg">
            <polyline points="15 14 20 9 15 4"/>
            <path d="M4 20v-7a4 4 0 0 1 4-4h12"/>
          </svg>
        `;

      // Curva à Esquerda 90° (CornerUpLeft)
      case 'corner-up-left':
        return `
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00E5FF" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" class="waze-maneuver-svg">
            <polyline points="9 14 4 9 9 4"/>
            <path d="M20 20v-7a4 4 0 0 0-4-4H4"/>
          </svg>
        `;

      // Curva Suave à Direita 45° (ArrowUpRight)
      case 'arrow-up-right':
        return `
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00E5FF" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" class="waze-maneuver-svg">
            <line x1="7" y1="17" x2="17" y2="7"/>
            <polyline points="7 7 17 7 17 17"/>
          </svg>
        `;

      // Curva Suave à Esquerda 45° (ArrowUpLeft)
      case 'arrow-up-left':
        return `
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00E5FF" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" class="waze-maneuver-svg">
            <line x1="17" y1="17" x2="7" y2="7"/>
            <polyline points="17 7 7 7 7 17"/>
          </svg>
        `;

      // Rotatória (RotateCw)
      case 'roundabout':
        return `
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00E5FF" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" class="waze-maneuver-svg">
            <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/>
            <polyline points="21 3 21 8 16 8"/>
          </svg>
        `;

      // Retorno em U (RotateCcw)
      case 'u-turn':
        return `
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00E5FF" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" class="waze-maneuver-svg">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
            <polyline points="3 3 3 8 8 8"/>
          </svg>
        `;

      // Chegada ao Destino (Flag)
      case 'flag':
        return `
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00E5FF" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" class="waze-maneuver-svg">
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
            <line x1="4" y1="22" x2="4" y2="15"/>
          </svg>
        `;

      // Bifurcação / Entroncamento (GitMerge)
      case 'merge':
      case 'fork':
        return `
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00E5FF" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" class="waze-maneuver-svg">
            <circle cx="18" cy="18" r="3"/>
            <circle cx="6" cy="6" r="3"/>
            <path d="M6 9v12"/>
            <path d="M18 15a9 9 0 0 0-9-9"/>
          </svg>
        `;

      // Siga em frente / Manter na via (ArrowUp)
      case 'arrow-up':
      default:
        return `
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00E5FF" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" class="waze-maneuver-svg">
            <line x1="12" y1="19" x2="12" y2="5"/>
            <polyline points="5 12 12 5 19 12"/>
          </svg>
        `;
    }
  }

  update(step, distanceToStep, nextStep = null) {
    this.currentStep = step;
    this.nextStep = nextStep;
    this.distanceToStep = distanceToStep;
    this.render();
  }

  render() {
    if (!this.container) return;

    if (!this.currentStep) {
      this.container.innerHTML = `
        <div class="navigation-primary-card">
          <div class="waze-maneuver-icon-box">
            ${this.getManeuverSvg('arrow-up')}
          </div>
          <div class="waze-step-info">
            <span class="waze-step-distance">Calculando rota…</span>
            <div class="waze-step-instruction">Preparando as instruções</div>
          </div>
        </div>
      `;
      return;
    }

    const formattedDist = formatWazeDistance(this.distanceToStep);
    const instruction = this.currentStep.instruction || 'Siga pela rota';
    const street = this.currentStep.rawName || this.currentStep.streetName || '';
    const showStreet = street
      && !instruction.toLocaleLowerCase('pt-BR').includes(street.toLocaleLowerCase('pt-BR'));
    const iconSvg = this.getManeuverSvg(this.currentStep.icon);
    const nextManeuver = this.nextStep
      ? `<div class="navigation-next-card">
          <span class="navigation-next-label">Depois</span>
          <span class="navigation-next-icon" aria-hidden="true">
            ${this.getManeuverSvg(this.nextStep.icon)}
          </span>
        </div>`
      : '';

    this.container.innerHTML = `
      <div class="navigation-primary-card ${this.nextStep ? 'has-next' : ''}">
        <div class="waze-maneuver-icon-box" aria-hidden="true">
          ${iconSvg}
        </div>
        <div class="waze-step-info">
          <div class="waze-distance-row">
            <span class="waze-step-distance">${escapeHtml(formattedDist)}</span>
          </div>
          <div class="waze-step-instruction">${escapeHtml(instruction)}</div>
          ${showStreet
            ? `<div class="waze-step-street" title="${escapeHtml(street)}">${escapeHtml(street)}</div>`
            : ''}
        </div>
      </div>
      ${nextManeuver}
    `;
  }
}
