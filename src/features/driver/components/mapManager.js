/**
 * Gerenciador do Mapa Leaflet com Visão 3D Close-Up Waze e Câmera Suavizada com Deadband
 */

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { APP_CONFIG } from '../config.js';
import { disableLeafletPropagation } from '../../../shared/utils/domUtils.js';
import { calculateBearing } from '../../../shared/utils/geoUtils.js';

export class MapManager {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.options = options;
    this.map = null;
    this.rotatorElement = null;
    this.routePolyline = null;
    this.routePolylineOutline = null;
    this.routeCoordinates = [];
    this.visualRouteCoordIndex = 0;
    this.targetRouteCoordIndex = 0;
    this.lastRouteVisualSyncAt = 0;
    this.trafficPolylineLayers = [];
    this.trafficLegend = null;
    this.vehicleMarker = null;
    this.originMarker = null;
    this.destMarker = null;
    this.isFollowingVehicle = true;
    this.currentMapBearing = 0;
    this.cumulativeAngle = 0;
    this.smoothedBearing = 0;
    this.vehicleAnimationFrame = null;
    this.lastVehicleUpdateAt = 0;
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
  drawRoute(coordinates, trafficSections = []) {
    if (!coordinates || coordinates.length === 0) return;

    if (this.routePolylineOutline) this.map.removeLayer(this.routePolylineOutline);
    if (this.routePolyline) this.map.removeLayer(this.routePolyline);
    this.clearTrafficLayers();
    this.routeCoordinates = coordinates;
    this.visualRouteCoordIndex = 0;
    this.targetRouteCoordIndex = 0;

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

    this.drawTrafficSections(trafficSections);
  }

  trafficColor(section) {
    const category = String(section.simpleCategory || '').toUpperCase();
    const delaySeconds = Number(section.delayInSeconds) || 0;
    const magnitude = Number(section.magnitudeOfDelay) || 0;

    if (category === 'ROAD_CLOSURE') return '#7F1D1D';
    if (magnitude >= 3 || delaySeconds >= 600) return '#DC2626';
    if (magnitude === 2 || delaySeconds >= 180) return '#F97316';
    return '#FACC15';
  }

  trafficCategoryLabel(category) {
    const labels = {
      JAM: 'Congestionamento',
      ROAD_WORK: 'Obras na via',
      ROAD_CLOSURE: 'Via interditada',
      OTHER: 'Ocorrência no trânsito'
    };
    return labels[String(category || '').toUpperCase()] || 'Trânsito lento';
  }

  formatTrafficDelay(seconds) {
    if (!seconds) return 'Atraso não informado';
    if (seconds < 60) return `Atraso de ${seconds} s`;
    return `Atraso de ${Math.max(1, Math.round(seconds / 60))} min`;
  }

  createTrafficPopup(section) {
    const content = document.createElement('div');
    content.className = 'traffic-route-popup';

    const title = document.createElement('strong');
    title.textContent = this.trafficCategoryLabel(section.simpleCategory);
    content.appendChild(title);

    const delay = document.createElement('span');
    delay.textContent = this.formatTrafficDelay(Number(section.delayInSeconds) || 0);
    content.appendChild(delay);

    if (Number(section.effectiveSpeedInKmh) > 0) {
      const speed = document.createElement('span');
      speed.textContent = `Velocidade média: ${Math.round(section.effectiveSpeedInKmh)} km/h`;
      content.appendChild(speed);
    }

    return content;
  }

  drawTrafficSections(trafficSections) {
    const validSections = (trafficSections || []).filter((section) => {
      const start = Number(section.startPointIndex);
      const end = Number(section.endPointIndex);
      return Number.isInteger(start) && Number.isInteger(end) && end > start;
    });

    validSections.forEach((section) => {
      const start = Math.max(0, Number(section.startPointIndex));
      const end = Math.min(this.routeCoordinates.length - 1, Number(section.endPointIndex));
      const segment = this.routeCoordinates.slice(start, end + 1);
      if (segment.length < 2) return;

      const layer = L.polyline(segment, {
        color: this.trafficColor(section),
        weight: 8,
        opacity: 1,
        lineCap: 'round',
        lineJoin: 'round',
        interactive: true
      }).addTo(this.map);

      layer.bindPopup(this.createTrafficPopup(section), {
        className: 'traffic-leaflet-popup',
        closeButton: false,
        offset: [0, -4]
      });
      layer.trafficStartIndex = start;
      layer.trafficEndIndex = end;
      this.trafficPolylineLayers.push(layer);
    });

    if (this.trafficPolylineLayers.length > 0) this.showTrafficLegend();
  }

  showTrafficLegend() {
    this.trafficLegend = L.control({ position: 'bottomleft' });
    this.trafficLegend.onAdd = () => {
      const legend = L.DomUtil.create('div', 'traffic-route-legend');
      legend.innerHTML = `
        <span><i class="traffic-dot light"></i>Leve</span>
        <span><i class="traffic-dot moderate"></i>Moderado</span>
        <span><i class="traffic-dot heavy"></i>Intenso</span>
      `;
      L.DomEvent.disableClickPropagation(legend);
      return legend;
    };
    this.trafficLegend.addTo(this.map);
  }

  clearTrafficLayers() {
    this.trafficPolylineLayers.forEach((layer) => this.map.removeLayer(layer));
    this.trafficPolylineLayers = [];
    if (this.trafficLegend) {
      this.map.removeControl(this.trafficLegend);
      this.trafficLegend = null;
    }
  }

  /**
   * Atualiza a polilinha restante em tempo real
   */
  updateRemainingRoute(remainingCoordinates, closestCoordIndex = 0) {
    if (!remainingCoordinates || remainingCoordinates.length < 2) return;
    this.targetRouteCoordIndex = Math.max(this.visualRouteCoordIndex, closestCoordIndex);

    let visualPosition = remainingCoordinates[0];
    const displayedPosition = this.vehicleMarker?.getLatLng();
    if (displayedPosition) visualPosition = [displayedPosition.lat, displayedPosition.lng];
    this.syncRouteToVisualPosition(visualPosition);
  }

  syncRouteToVisualPosition(visualPosition) {
    if (!visualPosition || this.routeCoordinates.length < 2) return;

    const displayedPosition = L.latLng(visualPosition);
    let smallestDistance = Infinity;
    let nearestIndex = this.visualRouteCoordIndex;
    const searchStart = Math.max(0, this.visualRouteCoordIndex - 3);
    const searchEnd = Math.min(
      this.routeCoordinates.length - 1,
      Math.max(this.targetRouteCoordIndex + 25, searchStart + 40)
    );

    for (let index = searchStart; index <= searchEnd; index++) {
      const distance = displayedPosition.distanceTo(L.latLng(this.routeCoordinates[index]));
      if (distance < smallestDistance) {
        smallestDistance = distance;
        nearestIndex = index;
      }
    }

    this.visualRouteCoordIndex = Math.max(this.visualRouteCoordIndex, nearestIndex);
    const visualCoordIndex = this.visualRouteCoordIndex;

    const visualRemainingCoordinates = [
      visualPosition,
      ...this.routeCoordinates.slice(visualCoordIndex + 1)
    ];

    if (this.routePolyline && this.routePolylineOutline) {
      this.routePolyline.setLatLngs(visualRemainingCoordinates);
      this.routePolylineOutline.setLatLngs(visualRemainingCoordinates);
    }

    this.trafficPolylineLayers.forEach((layer) => {
      if (layer.trafficEndIndex <= visualCoordIndex) {
        layer.setLatLngs([]);
        return;
      }

      const start = Math.max(layer.trafficStartIndex, visualCoordIndex + 1);
      const segment = this.routeCoordinates.slice(start, layer.trafficEndIndex + 1);
      if (layer.trafficStartIndex <= visualCoordIndex && segment.length > 0) {
        segment.unshift(visualPosition);
      }
      layer.setLatLngs(segment);
    });
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
              fill="#0084FF" 
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
  updateVehiclePosition(latLng, bearing = 0, routeCoordIndex = null) {
    if (!latLng) return;

    let targetPosition = L.latLng(latLng);
    const now = performance.now();
    const followsRouteGeometry = Number.isInteger(routeCoordIndex) && this.routeCoordinates.length > 1;
    if (followsRouteGeometry) {
      this.targetRouteCoordIndex = Math.max(this.visualRouteCoordIndex, routeCoordIndex);

      // Ao frear, a distância prevista diminui e pode cair atrás da seta. Nunca
      // permite que a posição visual recue sobre a rota ou inverta a direção.
      if (this.vehicleMarker) {
        const currentPosition = this.vehicleMarker.getLatLng();
        if (routeCoordIndex < this.visualRouteCoordIndex) {
          targetPosition = currentPosition;
        } else if (routeCoordIndex === this.visualRouteCoordIndex) {
          const currentProgress = this.routeSegmentProgress(currentPosition, routeCoordIndex);
          const targetProgress = this.routeSegmentProgress(targetPosition, routeCoordIndex);
          if (targetProgress < currentProgress) targetPosition = currentPosition;
        }
      }
    }

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
      this.lastVehicleUpdateAt = now;
    } else {
      const elapsedSinceLastReading = this.lastVehicleUpdateAt
        ? now - this.lastVehicleUpdateAt
        : 1000;
      this.lastVehicleUpdateAt = now;
      const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      const animationDuration = reduceMotion
        ? 0
        : Math.min(2800, Math.max(450, elapsedSinceLastReading * 0.92));

      this.animateVehicleTo(
        targetPosition,
        animationDuration,
        followsRouteGeometry ? this.targetRouteCoordIndex : null,
        bearing
      );
      if (!followsRouteGeometry) this.updateVehicleArrow(bearing);

      if (this.isFollowingVehicle && !followsRouteGeometry) {
        this.map.panTo(targetPosition, {
          animate: animationDuration > 0,
          duration: animationDuration / 1000,
          easeLinearity: 1,
          noMoveStart: true
        });
      }
    }

    if (this.isFollowingVehicle && !followsRouteGeometry) {
      this.applyMapTransform(bearing);
      if (!this.vehicleAnimationFrame) {
        this.map.panTo(targetPosition, { animate: false });
      }
    }
  }

  updateVehicleArrow(bearing) {
    const markerElement = this.vehicleMarker?.getElement() || document.getElementById('waze-vehicle-marker-dom');
    const arrowWrapper = markerElement?.querySelector('.waze-vehicle-arrow-wrapper');
    if (arrowWrapper) arrowWrapper.style.transform = `rotate(${bearing}deg)`;
  }

  routeSegmentProgress(position, coordIndex) {
    const start = this.routeCoordinates[coordIndex];
    const end = this.routeCoordinates[coordIndex + 1];
    if (!start || !end) return 1;

    const deltaLat = end[0] - start[0];
    const deltaLng = end[1] - start[1];
    const lengthSquared = deltaLat * deltaLat + deltaLng * deltaLng;
    if (lengthSquared === 0) return 1;

    const progress = (
      (position.lat - start[0]) * deltaLat
      + (position.lng - start[1]) * deltaLng
    ) / lengthSquared;
    return Math.max(0, Math.min(1, progress));
  }

  createVehicleAnimationPath(startPosition, targetPosition, targetRouteIndex) {
    if (!Number.isInteger(targetRouteIndex) || this.routeCoordinates.length < 2) {
      return [startPosition, targetPosition];
    }

    const endIndex = Math.min(this.routeCoordinates.length - 1, targetRouteIndex);
    const points = [startPosition];
    for (let index = this.visualRouteCoordIndex + 1; index <= endIndex; index++) {
      points.push(L.latLng(this.routeCoordinates[index]));
    }
    if (points[points.length - 1].distanceTo(targetPosition) > 0.3) points.push(targetPosition);
    return points;
  }

  animateVehicleTo(targetPosition, duration, targetRouteIndex = null, fallbackBearing = 0) {
    if (!this.vehicleMarker) return;
    if (this.vehicleAnimationFrame) cancelAnimationFrame(this.vehicleAnimationFrame);

    const startPosition = this.vehicleMarker.getLatLng();
    const startedAt = performance.now();
    const path = this.createVehicleAnimationPath(startPosition, targetPosition, targetRouteIndex);
    const segments = [];
    let totalDistance = 0;

    for (let index = 0; index < path.length - 1; index++) {
      const distance = path[index].distanceTo(path[index + 1]);
      if (distance <= 0) continue;
      segments.push({ start: path[index], end: path[index + 1], distance, offset: totalDistance });
      totalDistance += distance;
    }

    if (duration <= 0 || totalDistance < 0.5 || segments.length === 0) {
      this.vehicleMarker.setLatLng(targetPosition);
      // Sem deslocamento, conserva a direção anterior. Heading de celular
      // parado ou em frenagem pode oscilar até 180 graus.
      if (!Number.isInteger(targetRouteIndex)) this.updateVehicleArrow(fallbackBearing);
      this.vehicleAnimationFrame = null;
      return;
    }

    const animate = (timestamp) => {
      const progress = Math.min(1, (timestamp - startedAt) / duration);
      const traveledDistance = totalDistance * progress;
      const segment = segments.find((item) => traveledDistance <= item.offset + item.distance)
        || segments[segments.length - 1];
      const segmentProgress = Math.min(1, Math.max(0, (traveledDistance - segment.offset) / segment.distance));
      const latitude = segment.start.lat + (segment.end.lat - segment.start.lat) * segmentProgress;
      const longitude = segment.start.lng + (segment.end.lng - segment.start.lng) * segmentProgress;
      this.vehicleMarker.setLatLng([latitude, longitude]);

      // A linha acompanha a posição interpolada da seta. O limite de ~12 FPS
      // evita redesenhar polilinhas grandes em todos os frames da animação.
      if (timestamp - this.lastRouteVisualSyncAt >= 80 || progress === 1) {
        this.lastRouteVisualSyncAt = timestamp;
        const routeBearing = calculateBearing(
          segment.start.lat,
          segment.start.lng,
          segment.end.lat,
          segment.end.lng
        );
        this.updateVehicleArrow(routeBearing);
        this.syncRouteToVisualPosition([latitude, longitude]);
        if (this.isFollowingVehicle) {
          this.applyMapTransform(routeBearing);
          this.map.panTo([latitude, longitude], {
            animate: true,
            duration: 0.1,
            easeLinearity: 1,
            noMoveStart: true
          });
        }
      }

      if (progress < 1) {
        this.vehicleAnimationFrame = requestAnimationFrame(animate);
      } else {
        this.vehicleAnimationFrame = null;
      }
    };

    this.vehicleAnimationFrame = requestAnimationFrame(animate);
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
