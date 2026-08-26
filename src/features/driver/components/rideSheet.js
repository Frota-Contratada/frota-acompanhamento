/**
 * Componente do Card Inferior de Acompanhamento da Corrida
 * - Modo retraído: Apenas informações centrais (horário de chegada, tempo e kilometragem).
 * - Modo aberto: Origem/Destino, status da corrida e métricas (sem botão de finalizar).
 * - Interação: Suporta arrastar para abrir/fechar além do clique.
 */

import { formatDistance, formatDuration, formatETA } from '../../../shared/utils/geoUtils.js';
import { addFastClickListener } from '../../../shared/utils/domUtils.js';

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export class RideSheet {
  constructor(elementId, options = {}) {
    this.container = document.getElementById(elementId);
    this.options = options;
    this.status = 'transit'; // 'transit' | 'waiting' | 'paused'
    this.waitingMinutes = 10;
    this.originName = 'Rod PR-340 - km 2.5, Jaguapitã';
    this.destName = 'Aeroporto de Londrina';
    this.remainingDistance = 0;
    this.remainingDuration = 0;
    this.isExpanded = false;

    // Gestos de arrasto
    this.isDragging = false;
    this.startY = 0;
    this.currentTranslateY = 0;
    this.dragCleanup = null;
  }

  setRouteInfo(originName, destName) {
    this.originName = originName;
    this.destName = destName;
    this.render();
  }

  setStatus(status, waitingMinutes = 10) {
    this.status = status;
    this.waitingMinutes = waitingMinutes;
    this.render();
  }

  toggleExpand() {
    this.setExpanded(!this.isExpanded);
  }

  setExpanded(expanded) {
    this.isExpanded = expanded;
    if (this.container) {
      this.container.classList.toggle('collapsed', !this.isExpanded);
      this.container.style.transform = '';
      this.container.style.maxHeight = '';
      this.container.style.removeProperty('--sheet-drag-progress');
      this.container.classList.remove('dragging');
      const uiOverlay = document.querySelector('.ui-overlay');
      if (uiOverlay) {
        uiOverlay.classList.toggle('sheet-expanded', this.isExpanded);
      }
    }
  }

  updateMetrics(remainingDistanceMeters, remainingDurationSeconds) {
    this.remainingDistance = remainingDistanceMeters;
    this.remainingDuration = remainingDurationSeconds;

    const etaText = formatETA(this.remainingDuration);
    const durText = formatDuration(this.remainingDuration);
    const distText = formatDistance(this.remainingDistance);

    const compactEta = document.getElementById('waze-compact-eta-val');
    const compactDur = document.getElementById('waze-compact-dur');
    const compactDist = document.getElementById('waze-compact-dist');

    if (compactEta) compactEta.textContent = etaText;
    if (compactDur) compactDur.textContent = durText;
    if (compactDist) compactDist.textContent = distText;

    const expEta = document.getElementById('exp-metric-eta');
    const expTime = document.getElementById('exp-metric-time');
    const expDist = document.getElementById('exp-metric-dist');

    if (expEta) expEta.textContent = etaText;
    if (expTime) expTime.textContent = durText;
    if (expDist) expDist.textContent = distText;
  }

  render() {
    if (!this.container) return;

    this.container.classList.toggle('collapsed', !this.isExpanded);
    const uiOverlay = document.querySelector('.ui-overlay');
    if (uiOverlay) {
      uiOverlay.classList.toggle('sheet-expanded', this.isExpanded);
    }

    const isWaiting = this.status === 'waiting';
    const titleText = this.status === 'paused' || isWaiting ? 'Corrida em pausa' : 'Corrida em andamento';
    const etaText = formatETA(this.remainingDuration);
    const durText = formatDuration(this.remainingDuration);
    const distText = formatDistance(this.remainingDistance);

    this.container.innerHTML = `
      <!-- Puxador de Arrasto -->
      <div class="sheet-drag-handle-container" id="sheet-drag-handle">
        <div class="sheet-drag-handle"></div>
      </div>

      <!-- 1. BARRA RETRAÍDA: APENAS INFORMAÇÃO CENTRAL -->
      <div class="waze-compact-bar" id="waze-compact-bar">
        <div class="waze-compact-center">
          <span class="waze-compact-eta" id="waze-compact-eta-val">${etaText}</span>
          <div class="waze-compact-sub">
            <span id="waze-compact-dur">${durText}</span>
            <span class="dot-sep"></span>
            <span id="waze-compact-dist">${distText}</span>
          </div>
        </div>
      </div>

      <!-- 2. GAVETA EXPANDIDA (Anexo 1 SEM botão de finalizar) -->
      <div class="expanded-content-drawer">
        <div class="ride-sheet-header">
          <button class="back-circle-btn" id="btn-ride-collapse" title="Recolher">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
          <span class="ride-sheet-title">${titleText}</span>
        </div>

        <!-- Linha do Tempo Origem e Destino (Anexo 1) -->
        <div class="ride-route-timeline">
          <div class="timeline-vertical-line"></div>

          <!-- Origem -->
          <div class="timeline-point-row">
            <div class="timeline-point-indicator">
              <div class="origin-indicator-dot"></div>
            </div>
            <div class="timeline-point-details">
              <span class="timeline-point-label">Origem</span>
              <span class="timeline-point-name">${escapeHtml(this.originName)}</span>
            </div>
          </div>

          <!-- Destino -->
          <div class="timeline-point-row">
            <div class="timeline-point-indicator">
              <div class="dest-indicator-pin">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
              </div>
            </div>
            <div class="timeline-point-details">
              <span class="timeline-point-label">Destino</span>
              <span class="timeline-point-name">${escapeHtml(this.destName)}</span>
            </div>
          </div>
        </div>

        <!-- Pílula de Status (Anexo 1) -->
        <div class="status-pill-badge" id="btn-toggle-status" title="Clique para alternar status">
          <div class="${isWaiting ? 'status-dot-blue' : 'status-dot-green'}"></div>
          <span>${isWaiting ? `Aguardando passageiro há ${this.waitingMinutes} minutos` : 'Em trânsito até o destino'}</span>
        </div>

        <!-- Métricas Detalhadas -->
        <div class="ride-metrics-bar">
          <div class="metric-item">
            <span class="metric-val" id="exp-metric-eta">${etaText}</span>
            <span class="metric-lbl">Chegada</span>
          </div>
          <div class="metric-divider"></div>
          <div class="metric-item">
            <span class="metric-val" id="exp-metric-time">${durText}</span>
            <span class="metric-lbl">Tempo</span>
          </div>
          <div class="metric-divider"></div>
          <div class="metric-item">
            <span class="metric-val" id="exp-metric-dist">${distText}</span>
            <span class="metric-lbl">Distância</span>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    const compactBar = document.getElementById('waze-compact-bar');
    const dragHandle = document.getElementById('sheet-drag-handle');
    const collapseBtn = document.getElementById('btn-ride-collapse');
    const statusPill = document.getElementById('btn-toggle-status');

    // Clique para expandir / recolher
    if (compactBar) {
      addFastClickListener(compactBar, () => {
        if (!this.hasDragged) {
          this.toggleExpand();
        }
      });
    }

    if (collapseBtn) {
      addFastClickListener(collapseBtn, () => this.setExpanded(false));
    }

    if (statusPill) {
      addFastClickListener(statusPill, () => {
        const nextStatus = this.status === 'waiting' ? 'transit' : 'waiting';
        if (!this.options.controlledStatus) this.setStatus(nextStatus);
        if (this.options.onStatusChange) {
          this.options.onStatusChange(nextStatus);
        }
      });
    }

    // SUPORTE A ARRASTO (Drag / Swipe Up & Down)
    this.setupDragGestures(this.container);
  }

  setupDragGestures(element) {
    if (!element) return;

    if (this.dragCleanup) this.dragCleanup();

    let startY = 0;
    let currentY = 0;
    let startHeight = 0;
    let collapsedHeight = 108;
    let expandedHeight = 0;
    let activePointerId = null;
    this.hasDragged = false;

    const onPointerDown = (e) => {
      if (activePointerId !== null || (e.button !== undefined && e.button !== 0)) return;
      activePointerId = e.pointerId;
      this.hasDragged = false;
      startY = e.clientY;
      currentY = startY;
      collapsedHeight = Math.min(108, element.scrollHeight);
      expandedHeight = Math.max(collapsedHeight, Math.min(element.scrollHeight, window.innerHeight * 0.85));
      startHeight = element.getBoundingClientRect().height;
      element.setPointerCapture?.(e.pointerId);
      element.classList.add('dragging');
      element.style.transition = 'none';
      element.style.maxHeight = `${startHeight}px`;
      element.style.setProperty('--sheet-drag-progress', this.isExpanded ? '1' : '0');
    };

    const onPointerMove = (e) => {
      if (e.pointerId !== activePointerId) return;
      if (e.cancelable) e.preventDefault();
      currentY = e.clientY;
      const deltaY = currentY - startY;

      if (Math.abs(deltaY) > 8) {
        this.hasDragged = true;
      }

      const nextHeight = Math.min(expandedHeight, Math.max(collapsedHeight, startHeight - deltaY));
      const range = Math.max(1, expandedHeight - collapsedHeight);
      const progress = (nextHeight - collapsedHeight) / range;
      element.style.maxHeight = `${nextHeight}px`;
      element.style.setProperty('--sheet-drag-progress', progress.toFixed(3));
    };

    const onPointerUp = (e) => {
      if (e.pointerId !== activePointerId) return;
      element.releasePointerCapture?.(activePointerId);
      activePointerId = null;

      const deltaY = currentY - startY;
      const currentHeight = element.getBoundingClientRect().height;
      const range = Math.max(1, expandedHeight - collapsedHeight);
      const progress = (currentHeight - collapsedHeight) / range;
      const shouldExpand = Math.abs(deltaY) > 24 ? deltaY < 0 : progress >= 0.5;

      this.isExpanded = shouldExpand;
      element.classList.toggle('collapsed', !shouldExpand);
      const uiOverlay = document.querySelector('.ui-overlay');
      if (uiOverlay) uiOverlay.classList.toggle('sheet-expanded', shouldExpand);

      element.style.transition = 'max-height 0.28s cubic-bezier(0.16, 1, 0.3, 1)';
      element.style.maxHeight = `${currentHeight}px`;
      element.style.setProperty('--sheet-drag-progress', shouldExpand ? '1' : '0');
      void element.offsetHeight;
      element.style.maxHeight = `${shouldExpand ? expandedHeight : collapsedHeight}px`;

      window.setTimeout(() => {
        element.classList.remove('dragging');
        element.style.transition = '';
        element.style.maxHeight = '';
        element.style.removeProperty('--sheet-drag-progress');
      }, 300);
    };

    element.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    this.dragCleanup = () => {
      element.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };
  }
}
