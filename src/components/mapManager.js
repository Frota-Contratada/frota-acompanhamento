/**
 * Gerenciador do Mapa Leaflet com Visão 3D Close-Up Waze e Câmera Suavizada com Deadband
 */

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { APP_CONFIG } from '../config.js';
import { disableLeafletPropagation } from '../utils/domUtils.js';

export class MapManager {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.options = options;
    this.map = null;
    this.rotatorElement = null;
    this.routePolyline = null;
    this.routePolylineOutline = null;
    this.vehicleMarker = null;
    this.originMarker = null;
    this.destMarker = null;
    this.isFollowingVehicle = true;
    this.currentMapBearing = 0;
    this.cumulativeAngle = 0;
    this.smoothedBearing = 0;
    this.tiltAngle = 24; // Inclinação 3D natural e limpa
    this.navigationZoom = 18; // Zoom bem próximo estilo Waze
    this.onVehicleDragEnd = options.onVehicleDragEnd || null;
    this.onMapClick = options.onMapClick || null;
  }

  init(initialCenter = [-23.507248, -46.653695], initialZoom = 18) {
    this.rotatorElement = document.getElementById('map-rotator');

    this.map = L.map(this.containerId, {
      center: initialCenter,
      zoom: initialZoom,
      zoomControl: false,
      attributionControl: false,
      zoomSnap: 0.1,
      maxZoom: 21
    });

    // Camada CartoDB Positron
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 21,
      maxNativeZoom: 18,
      subdomains: 'abcd',
    }).addTo(this.map);

    // Desativa a propagação de toques/cliques do Leaflet nas camadas de UI
    const uiOverlay = document.querySelector('.ui-overlay');
    const setupPageContainer = document.getElementById('setup-page-container');
    disableLeafletPropagation(uiOverlay);
    disableLeafletPropagation(setupPageContainer);

    // Modo 2D livre quando o usuário arrastar com o mouse ou dedo
    this.map.on('dragstart', () => {
      if (this.isFollowingVehicle) {
        this.setFollowVehicle(false);
        if (this.options.onCameraModeChange) {
          this.options.onCameraModeChange(false);
        }
      }
    });

    return this;
  }

  /**
   * Renderiza a rota no mapa com traço espesso e visível no zoom próximo
   */
  drawRoute(coordinates) {
    if (!coordinates || coordinates.length === 0) return;

    if (this.routePolylineOutline) this.map.removeLayer(this.routePolylineOutline);
    if (this.routePolyline) this.map.removeLayer(this.routePolyline);

    // Contorno escuro da rota
    this.routePolylineOutline = L.polyline(coordinates, {
      color: APP_CONFIG.colors.primaryNavy,
      weight: 12,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round',
      interactive: false
    }).addTo(this.map);

    // Linha principal da rota
    this.routePolyline = L.polyline(coordinates, {
      color: '#4F46E5',
      weight: 7,
      opacity: 1,
      lineCap: 'round',
      lineJoin: 'round',
      interactive: false
    }).addTo(this.map);
  }

  /**
   * Atualiza a polilinha restante em tempo real
   */
  updateRemainingRoute(remainingCoordinates) {
    if (!remainingCoordinates || remainingCoordinates.length < 2) return;
    if (this.routePolyline && this.routePolylineOutline) {
      this.routePolyline.setLatLngs(remainingCoordinates);
      this.routePolylineOutline.setLatLngs(remainingCoordinates);
    }
  }

  /**
   * Ajusta a visualização para a rota inteira
   */
  fitRouteBounds(coordinates) {
    if (!coordinates || coordinates.length === 0) return;
    const bounds = L.latLngBounds(coordinates);
    this.map.fitBounds(bounds, {
      paddingTopLeft: [40, 100],
      paddingBottomRight: [40, 100],
      maxZoom: 18,
      animate: true
    });
  }

  /**
   * Marcador de Origem
   */
  setOriginMarker(latLng) {
    if (this.originMarker) this.map.removeLayer(this.originMarker);

    const icon = L.divIcon({
      className: 'custom-pin-marker',
      html: `<div class="origin-pin-icon"></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    this.originMarker = L.marker(latLng, { icon }).addTo(this.map);
  }

  /**
   * Marcador de Destino
   */
  setDestinationMarker(latLng) {
    if (this.destMarker) this.map.removeLayer(this.destMarker);

    const icon = L.divIcon({
      className: 'custom-pin-marker',
      html: `
        <div class="destination-pin-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });

    this.destMarker = L.marker(latLng, { icon }).addTo(this.map);
  }

  /**
   * Seta de navegação 100% sólida e limpa estilo Waze
   */
  getRoundedArrowSvg() {
    return `
      <svg viewBox="0 0 36 36" class="waze-arrow-svg">
        <defs>
          <linearGradient id="navArrowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#00D2FF"/>
            <stop offset="100%" stop-color="#0077FF"/>
          </linearGradient>
        </defs>
        <path d="M18 4.2 
                 C18.6 4.2 19.2 4.6 19.6 5.2 
                 L30.8 25.2 
                 C31.4 26.3 30.6 27.6 29.4 27.2 
                 L18.6 23.4 
                 C18.2 23.2 17.8 23.2 17.4 23.4 
                 L6.6 27.2 
                 C5.4 27.6 4.6 26.3 5.2 25.2 
                 L16.4 5.2 
                 C16.8 4.6 17.4 4.2 18 4.2 Z" 
              fill="url(#navArrowGrad)" 
              stroke="#FFFFFF" 
              stroke-width="2.2" 
              stroke-linejoin="round" 
              stroke-linecap="round"/>
      </svg>
    `;
  }

  /**
   * Aplica rotação de câmera suave com Deadband (evita tremores em linhas retas e suaviza curvas)
   */
  applyMapTransform(targetBearing) {
    if (!this.rotatorElement) return;

    if (this.isFollowingVehicle) {
      let diff = (targetBearing - this.smoothedBearing);
      if (diff > 180) diff -= 360;
      if (diff < -180) diff += 360;

      // Deadband: Ignora micro-oscilações (< 3.0°) em linhas retas para a câmera não tremer
      if (Math.abs(diff) > 3.0) {
        // Amortecimento suave da câmera (damping)
        this.smoothedBearing += diff * 0.15;
      }

      let mapDiff = (this.smoothedBearing - (this.cumulativeAngle % 360));
      if (mapDiff > 180) mapDiff -= 360;
      if (mapDiff < -180) mapDiff += 360;

      this.cumulativeAngle += mapDiff;
      this.currentMapBearing = targetBearing;

      this.rotatorElement.style.transform = `scale(1.1) rotateX(${this.tiltAngle}deg) rotate(${-this.cumulativeAngle}deg)`;
    } else {
      this.rotatorElement.style.transform = `scale(1) rotateX(0deg) rotate(0deg)`;
    }
  }

  /**
   * Atualiza a posição da seta e a rotação amortecida da câmera
   */
  updateVehiclePosition(latLng, bearing = 0) {
    if (!latLng) return;

    if (!this.vehicleMarker) {
      this.smoothedBearing = bearing;
      this.cumulativeAngle = bearing;

      const icon = L.divIcon({
        className: 'custom-pin-marker',
        html: `
          <div class="waze-vehicle-container" id="waze-vehicle-marker-dom">
            <div class="waze-vehicle-shadow"></div>
            <div class="waze-vehicle-arrow-wrapper" style="transform: rotate(${bearing}deg);">
              ${this.getRoundedArrowSvg()}
            </div>
          </div>
        `,
        iconSize: [56, 56],
        iconAnchor: [28, 28]
      });

      this.vehicleMarker = L.marker(latLng, {
        icon,
        draggable: false,
        interactive: false,
        zIndexOffset: 1000
      }).addTo(this.map);
    } else {
      this.vehicleMarker.setLatLng(latLng);

      const markerElement = this.vehicleMarker.getElement() || document.getElementById('waze-vehicle-marker-dom');
      if (markerElement) {
        const arrowWrapper = markerElement.querySelector('.waze-vehicle-arrow-wrapper');
        if (arrowWrapper) {
          arrowWrapper.style.transform = `rotate(${bearing}deg)`;
        }
      }
    }

    if (this.isFollowingVehicle) {
      this.applyMapTransform(bearing);
      this.map.panTo(latLng, { animate: false });
    }
  }

  setFollowVehicle(follow) {
    this.isFollowingVehicle = follow;
    if (follow && this.vehicleMarker) {
      this.smoothedBearing = this.currentMapBearing;
      this.cumulativeAngle = this.currentMapBearing;
      this.map.setView(this.vehicleMarker.getLatLng(), this.navigationZoom, { animate: true });
      this.applyMapTransform(this.currentMapBearing);
    } else if (!follow && this.rotatorElement) {
      this.cumulativeAngle = 0;
      this.rotatorElement.style.transform = `scale(1) rotateX(0deg) rotate(0deg)`;
    }
  }
}
