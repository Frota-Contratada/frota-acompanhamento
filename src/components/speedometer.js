/**
 * Componente do Velocímetro Circular estilo Waze
 * Só exibe limite de velocidade e velocidade do usuário se as informações estiverem disponíveis.
 */

import { addFastClickListener } from '../utils/domUtils.js';

export class Speedometer {
  constructor(elementId, options = {}) {
    this.container = document.getElementById(elementId);
    this.options = options;
    this.currentSpeed = null;
    this.speedLimit = options.speedLimit || null;
  }

  init() {
    this.render();
  }

  setSpeed(speedKmH) {
    if (speedKmH === null || speedKmH === undefined || isNaN(speedKmH)) {
      this.currentSpeed = null;
    } else {
      this.currentSpeed = Math.max(0, Math.round(speedKmH));
    }
    this.updateGauge();
  }

  setSpeedLimit(limit) {
    this.speedLimit = (limit && limit > 0) ? limit : null;
    this.updateGauge();
  }

  updateGauge() {
    if (!this.container) return;

    // Se não houver informação de velocidade, oculta o velocímetro
    if (this.currentSpeed === null) {
      this.container.style.display = 'none';
      return;
    }

    this.container.style.display = 'flex';

    const valDom = this.container.querySelector('.speedometer-val');
    const ringFill = this.container.querySelector('.speedometer-ring-fill');
    const limitBadge = this.container.querySelector('.speed-limit-badge');

    if (valDom) {
      valDom.textContent = this.currentSpeed;
    }

    // Limite de velocidade: se não possuir, não mostre
    if (limitBadge) {
      if (this.speedLimit) {
        limitBadge.style.display = 'flex';
        limitBadge.textContent = this.speedLimit;
      } else {
        limitBadge.style.display = 'none';
      }
    }

    if (ringFill) {
      const maxDisplaySpeed = 120;
      const ratio = Math.min(1, this.currentSpeed / maxDisplaySpeed);
      const offset = 188 - ratio * 188;
      ringFill.style.strokeDashoffset = offset;

      if (this.speedLimit && this.currentSpeed > this.speedLimit) {
        ringFill.style.stroke = 'var(--action-red)';
      } else {
        ringFill.style.stroke = 'var(--accent-cyan)';
      }
    }
  }

  render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <svg class="speedometer-ring-svg" viewBox="0 0 70 70">
        <circle class="speedometer-ring-bg" cx="35" cy="35" r="30" />
        <circle class="speedometer-ring-fill" cx="35" cy="35" r="30" />
      </svg>
      <div class="speed-limit-badge" style="display: ${this.speedLimit ? 'flex' : 'none'};">${this.speedLimit || ''}</div>
      <span class="speedometer-val">${this.currentSpeed !== null ? this.currentSpeed : '--'}</span>
      <span class="speedometer-unit">km/h</span>
    `;

    if (this.currentSpeed === null) {
      this.container.style.display = 'none';
    }

    if (this.container) {
      addFastClickListener(this.container, () => {
        if (this.options.onClick) {
          this.options.onClick();
        }
      });
    }
  }
}
